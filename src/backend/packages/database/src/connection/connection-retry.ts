/**
 * @file connection-retry.ts
 * @description Implements ConnectionRetry class that provides retry strategies and policies
 * for handling database connection failures. It includes configurable retry mechanisms with
 * exponential backoff, jitter to prevent retry storms, and circuit breaker pattern to prevent
 * cascading failures. The retry strategies are context-aware, adapting to different types of
 * operations and failure modes.
 */

import { Logger } from '@nestjs/common';
import { ErrorType, DatabaseError, TechnicalError } from '@austa/errors';
import { sleep, generateRandomId } from '@austa/utils';
import { IConnectionRetryConfig, ConnectionConfig, DatabaseTechnology } from '../types/connection.types';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../errors/database-error.types';

/**
 * Enum representing the different operation types that can be retried
 */
export enum RetryOperationType {
  CONNECT = 'connect',
  QUERY = 'query',
  TRANSACTION = 'transaction',
  COMMAND = 'command',
  HEALTH_CHECK = 'health_check',
  VALIDATION = 'validation',
}

/**
 * Interface for circuit breaker state
 */
export interface ICircuitBreakerState {
  /**
   * Whether the circuit is open (preventing further operations)
   */
  isOpen: boolean;

  /**
   * Timestamp when the circuit was opened
   */
  openedAt?: Date;

  /**
   * Timestamp when the circuit will be half-open (allowing a test operation)
   */
  resetAt?: Date;

  /**
   * Number of consecutive failures that triggered the circuit to open
   */
  failureCount: number;

  /**
   * Number of consecutive successful operations in half-open state
   */
  successCount: number;

  /**
   * Maximum number of consecutive failures before opening the circuit
   */
  failureThreshold: number;

  /**
   * Time in milliseconds to keep the circuit open before transitioning to half-open
   */
  resetTimeoutMs: number;

  /**
   * Number of consecutive successful operations required to close the circuit
   */
  successThreshold: number;
}

/**
 * Interface for retry context, containing information about the current retry operation
 */
export interface IRetryContext {
  /**
   * Unique identifier for this retry operation
   */
  id: string;

  /**
   * Type of operation being retried
   */
  operationType: RetryOperationType;

  /**
   * Database technology being used
   */
  technology: DatabaseTechnology;

  /**
   * Journey ID associated with this operation
   */
  journeyId?: string;

  /**
   * Current retry attempt (0-based)
   */
  attempt: number;

  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;

  /**
   * Timestamp when the first attempt was made
   */
  startTime: Date;

  /**
   * Timestamp of the most recent attempt
   */
  lastAttemptTime?: Date;

  /**
   * Error from the most recent attempt
   */
  lastError?: Error;

  /**
   * Additional metadata for the retry operation
   */
  metadata?: Record<string, any>;

  /**
   * Circuit breaker state for this operation type
   */
  circuitBreaker?: ICircuitBreakerState;
}

/**
 * Interface for retry result, containing information about the outcome of a retry operation
 */
export interface IRetryResult<T> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Result of the operation if successful
   */
  result?: T;

  /**
   * Error from the last attempt if unsuccessful
   */
  error?: Error;

  /**
   * Retry context containing information about the retry operation
   */
  context: IRetryContext;

  /**
   * Total number of attempts made (including the initial attempt)
   */
  attempts: number;

  /**
   * Total time elapsed during the retry operation in milliseconds
   */
  elapsedTimeMs: number;

  /**
   * Whether the circuit breaker was triggered
   */
  circuitBroken: boolean;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_BREAKER: ICircuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  successCount: 0,
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  successThreshold: 2,
};

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: IConnectionRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffFactor: 2,
  useJitter: true,
  retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT],
};

/**
 * Class that provides retry strategies and policies for database operations
 */
export class ConnectionRetry {
  private readonly logger = new Logger(ConnectionRetry.name);
  private readonly circuitBreakers: Map<string, ICircuitBreakerState> = new Map();
  private readonly retryConfig: IConnectionRetryConfig;
  private readonly connectionConfig: ConnectionConfig;

  /**
   * Creates a new ConnectionRetry instance
   * @param connectionConfig The database connection configuration
   */
  constructor(connectionConfig: ConnectionConfig) {
    this.connectionConfig = connectionConfig;
    this.retryConfig = connectionConfig.retry || DEFAULT_RETRY_CONFIG;
    this.initializeCircuitBreakers();
  }

  /**
   * Initializes circuit breakers for all operation types
   */
  private initializeCircuitBreakers(): void {
    Object.values(RetryOperationType).forEach((operationType) => {
      const circuitBreakerId = this.getCircuitBreakerId(operationType);
      this.circuitBreakers.set(circuitBreakerId, { ...DEFAULT_CIRCUIT_BREAKER });
    });
  }

  /**
   * Gets a unique identifier for a circuit breaker based on operation type and journey
   * @param operationType The type of operation
   * @returns A unique identifier for the circuit breaker
   */
  private getCircuitBreakerId(operationType: RetryOperationType): string {
    return `${this.connectionConfig.technology}:${operationType}:${this.connectionConfig.journeyId || 'default'}`;
  }

  /**
   * Gets the circuit breaker state for a specific operation type
   * @param operationType The type of operation
   * @returns The circuit breaker state
   */
  private getCircuitBreaker(operationType: RetryOperationType): ICircuitBreakerState {
    const circuitBreakerId = this.getCircuitBreakerId(operationType);
    let circuitBreaker = this.circuitBreakers.get(circuitBreakerId);

    if (!circuitBreaker) {
      circuitBreaker = { ...DEFAULT_CIRCUIT_BREAKER };
      this.circuitBreakers.set(circuitBreakerId, circuitBreaker);
    }

    return circuitBreaker;
  }

  /**
   * Updates the circuit breaker state based on the result of an operation
   * @param operationType The type of operation
   * @param success Whether the operation was successful
   */
  private updateCircuitBreaker(operationType: RetryOperationType, success: boolean): void {
    const circuitBreaker = this.getCircuitBreaker(operationType);

    if (success) {
      // Handle successful operation
      if (circuitBreaker.isOpen) {
        // Circuit is open or half-open
        circuitBreaker.successCount++;

        if (circuitBreaker.successCount >= circuitBreaker.successThreshold) {
          // Close the circuit after enough consecutive successes
          circuitBreaker.isOpen = false;
          circuitBreaker.failureCount = 0;
          circuitBreaker.successCount = 0;
          circuitBreaker.openedAt = undefined;
          circuitBreaker.resetAt = undefined;

          this.logger.log(
            `Circuit breaker closed for ${operationType} operations after ${circuitBreaker.successThreshold} consecutive successes`
          );
        }
      } else {
        // Circuit is closed, reset failure count
        circuitBreaker.failureCount = 0;
      }
    } else {
      // Handle failed operation
      circuitBreaker.failureCount++;
      circuitBreaker.successCount = 0;

      if (!circuitBreaker.isOpen && circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
        // Open the circuit after enough consecutive failures
        circuitBreaker.isOpen = true;
        circuitBreaker.openedAt = new Date();
        circuitBreaker.resetAt = new Date(Date.now() + circuitBreaker.resetTimeoutMs);

        this.logger.warn(
          `Circuit breaker opened for ${operationType} operations after ${circuitBreaker.failureCount} consecutive failures. ` +
          `Will attempt reset at ${circuitBreaker.resetAt.toISOString()}`
        );
      }
    }
  }

  /**
   * Checks if the circuit breaker is open for a specific operation type
   * @param operationType The type of operation
   * @returns True if the circuit is open, false otherwise
   */
  private isCircuitOpen(operationType: RetryOperationType): boolean {
    const circuitBreaker = this.getCircuitBreaker(operationType);

    if (!circuitBreaker.isOpen) {
      return false;
    }

    // Check if it's time to transition to half-open state
    if (circuitBreaker.resetAt && new Date() >= circuitBreaker.resetAt) {
      // Allow a single test operation to go through (half-open state)
      this.logger.log(
        `Circuit breaker for ${operationType} operations transitioning to half-open state after ${circuitBreaker.resetTimeoutMs}ms timeout`
      );
      return false;
    }

    return true;
  }

  /**
   * Creates a new retry context for an operation
   * @param operationType The type of operation being retried
   * @param metadata Additional metadata for the retry operation
   * @returns A new retry context
   */
  private createRetryContext(operationType: RetryOperationType, metadata?: Record<string, any>): IRetryContext {
    return {
      id: generateRandomId(),
      operationType,
      technology: this.connectionConfig.technology,
      journeyId: this.connectionConfig.journeyId,
      attempt: 0,
      maxRetries: this.retryConfig.maxRetries,
      startTime: new Date(),
      metadata,
      circuitBreaker: this.getCircuitBreaker(operationType),
    };
  }

  /**
   * Calculates the delay before the next retry attempt using exponential backoff and optional jitter
   * @param attempt The current retry attempt (0-based)
   * @returns The delay in milliseconds before the next retry
   */
  private calculateRetryDelay(attempt: number): number {
    const { initialDelayMs, maxDelayMs, backoffFactor, useJitter } = this.retryConfig;

    // Calculate exponential backoff: initialDelay * (backoffFactor ^ attempt)
    let delay = initialDelayMs * Math.pow(backoffFactor, attempt);

    // Apply maximum delay limit
    delay = Math.min(delay, maxDelayMs);

    // Add jitter if enabled (±25% of the calculated delay)
    if (useJitter) {
      const jitterFactor = 0.25; // 25% jitter
      const jitterRange = delay * jitterFactor;
      delay = delay - jitterRange + (Math.random() * jitterRange * 2);
    }

    return Math.floor(delay);
  }

  /**
   * Determines if an error is retryable based on the retry configuration and error type
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: Error): boolean {
    // Check if it's a known database error with recoverability information
    if (error instanceof DatabaseError) {
      // Check if the error is explicitly marked as recoverable
      if (error.recoverability === DatabaseErrorRecoverability.RECOVERABLE) {
        return true;
      }

      // Check if it's a transient error
      if (error.errorType === DatabaseErrorType.CONNECTION || 
          error.errorType === DatabaseErrorType.TIMEOUT) {
        return true;
      }
    }

    // Check if it's a technical error with a retryable error type
    if (error instanceof TechnicalError) {
      return this.retryConfig.retryableErrors.includes(error.type);
    }

    // For unknown errors, check if they match common transient error patterns
    const errorMessage = error.message.toLowerCase();
    const transientPatterns = [
      'connection refused',
      'connection reset',
      'connection timeout',
      'connection closed',
      'network error',
      'timeout',
      'deadlock',
      'too many connections',
      'rate limit',
      'throttle',
      'temporarily unavailable',
      'service unavailable',
      'server is busy',
      'try again',
      'socket hang up',
      'econnrefused',
      'econnreset',
      'etimedout',
      'ehostunreach',
      'epipe',
    ];

    return transientPatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Logs information about a retry attempt
   * @param context The retry context
   * @param delay The delay before the next retry in milliseconds
   */
  private logRetryAttempt(context: IRetryContext, delay: number): void {
    const { operationType, attempt, maxRetries, lastError } = context;
    const errorMessage = lastError ? lastError.message : 'Unknown error';
    const journeyInfo = context.journeyId ? ` for journey ${context.journeyId}` : '';

    this.logger.warn(
      `Retry attempt ${attempt + 1}/${maxRetries + 1} for ${operationType} operation${journeyInfo}. ` +
      `Error: ${errorMessage}. Retrying in ${delay}ms...`
    );

    // Log additional details at debug level
    if (this.connectionConfig.debug) {
      this.logger.debug({
        message: `Retry details for ${context.id}`,
        retryContext: {
          ...context,
          lastError: lastError ? {
            message: lastError.message,
            stack: lastError.stack,
            name: lastError.name,
          } : undefined,
        },
        delay,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Logs the final result of a retry operation
   * @param result The retry result
   */
  private logRetryResult<T>(result: IRetryResult<T>): void {
    const { success, attempts, context, error, circuitBroken, elapsedTimeMs } = result;
    const { operationType, maxRetries } = context;
    const journeyInfo = context.journeyId ? ` for journey ${context.journeyId}` : '';

    if (success) {
      this.logger.log(
        `${operationType} operation${journeyInfo} succeeded after ${attempts} attempt(s) in ${elapsedTimeMs}ms`
      );
    } else if (circuitBroken) {
      this.logger.error(
        `${operationType} operation${journeyInfo} failed: Circuit breaker open. ` +
        `Will reset at ${context.circuitBreaker?.resetAt?.toISOString()}`
      );
    } else {
      const errorMessage = error ? error.message : 'Unknown error';
      this.logger.error(
        `${operationType} operation${journeyInfo} failed after ${attempts} attempt(s) (max: ${maxRetries + 1}). ` +
        `Last error: ${errorMessage}`
      );
    }

    // Log additional details at debug level
    if (this.connectionConfig.debug) {
      this.logger.debug({
        message: `Retry result for ${context.id}`,
        retryResult: {
          ...result,
          error: error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          } : undefined,
          // Don't include the actual result in logs as it might be sensitive or large
          result: success ? '[Result omitted from logs]' : undefined,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Executes an operation with retry logic
   * @param operationType The type of operation being performed
   * @param operation The operation function to execute
   * @param metadata Additional metadata for the retry operation
   * @returns A promise that resolves to the retry result
   */
  public async executeWithRetry<T>(
    operationType: RetryOperationType,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<IRetryResult<T>> {
    // Create retry context
    const context = this.createRetryContext(operationType, metadata);
    const startTime = Date.now();

    // Check if circuit breaker is open
    if (this.isCircuitOpen(operationType)) {
      const circuitBreaker = this.getCircuitBreaker(operationType);
      const error = new TechnicalError(
        `Circuit breaker open for ${operationType} operations. Too many consecutive failures.`,
        ErrorType.CIRCUIT_OPEN
      );

      return {
        success: false,
        error,
        context,
        attempts: 0,
        elapsedTimeMs: 0,
        circuitBroken: true,
      };
    }

    // Execute the operation with retries
    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts <= context.maxRetries) {
      try {
        // Update context for this attempt
        context.attempt = attempts;
        context.lastAttemptTime = new Date();

        // Execute the operation
        const result = await operation();

        // Operation succeeded, update circuit breaker and return success
        this.updateCircuitBreaker(operationType, true);

        return {
          success: true,
          result,
          context,
          attempts: attempts + 1,
          elapsedTimeMs: Date.now() - startTime,
          circuitBroken: false,
        };
      } catch (error) {
        // Store the error
        lastError = error instanceof Error ? error : new Error(String(error));
        context.lastError = lastError;

        // Check if we've reached the maximum number of retries
        if (attempts >= context.maxRetries) {
          break;
        }

        // Check if the error is retryable
        if (!this.isRetryableError(lastError)) {
          // Non-retryable error, update circuit breaker and return failure
          this.updateCircuitBreaker(operationType, false);

          return {
            success: false,
            error: lastError,
            context,
            attempts: attempts + 1,
            elapsedTimeMs: Date.now() - startTime,
            circuitBroken: false,
          };
        }

        // Calculate delay for the next retry
        const delay = this.calculateRetryDelay(attempts);

        // Log retry attempt
        this.logRetryAttempt(context, delay);

        // Wait before retrying
        await sleep(delay);

        // Increment attempt counter
        attempts++;
      }
    }

    // All retries failed, update circuit breaker and return failure
    this.updateCircuitBreaker(operationType, false);

    const result: IRetryResult<T> = {
      success: false,
      error: lastError,
      context,
      attempts: attempts + 1,
      elapsedTimeMs: Date.now() - startTime,
      circuitBroken: false,
    };

    // Log the final result
    this.logRetryResult(result);

    return result;
  }

  /**
   * Executes a database connection operation with retry logic
   * @param connectFn The connection function to execute
   * @param metadata Additional metadata for the retry operation
   * @returns A promise that resolves to the retry result
   */
  public async executeConnect<T>(
    connectFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<IRetryResult<T>> {
    return this.executeWithRetry(RetryOperationType.CONNECT, connectFn, metadata);
  }

  /**
   * Executes a database query operation with retry logic
   * @param queryFn The query function to execute
   * @param metadata Additional metadata for the retry operation
   * @returns A promise that resolves to the retry result
   */
  public async executeQuery<T>(
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<IRetryResult<T>> {
    return this.executeWithRetry(RetryOperationType.QUERY, queryFn, metadata);
  }

  /**
   * Executes a database transaction operation with retry logic
   * @param transactionFn The transaction function to execute
   * @param metadata Additional metadata for the retry operation
   * @returns A promise that resolves to the retry result
   */
  public async executeTransaction<T>(
    transactionFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<IRetryResult<T>> {
    return this.executeWithRetry(RetryOperationType.TRANSACTION, transactionFn, metadata);
  }

  /**
   * Executes a database command operation with retry logic
   * @param commandFn The command function to execute
   * @param metadata Additional metadata for the retry operation
   * @returns A promise that resolves to the retry result
   */
  public async executeCommand<T>(
    commandFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<IRetryResult<T>> {
    return this.executeWithRetry(RetryOperationType.COMMAND, commandFn, metadata);
  }

  /**
   * Executes a health check operation with retry logic
   * @param healthCheckFn The health check function to execute
   * @param metadata Additional metadata for the retry operation
   * @returns A promise that resolves to the retry result
   */
  public async executeHealthCheck<T>(
    healthCheckFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<IRetryResult<T>> {
    return this.executeWithRetry(RetryOperationType.HEALTH_CHECK, healthCheckFn, metadata);
  }

  /**
   * Executes a validation operation with retry logic
   * @param validationFn The validation function to execute
   * @param metadata Additional metadata for the retry operation
   * @returns A promise that resolves to the retry result
   */
  public async executeValidation<T>(
    validationFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<IRetryResult<T>> {
    return this.executeWithRetry(RetryOperationType.VALIDATION, validationFn, metadata);
  }

  /**
   * Resets the circuit breaker for a specific operation type
   * @param operationType The type of operation
   */
  public resetCircuitBreaker(operationType: RetryOperationType): void {
    const circuitBreakerId = this.getCircuitBreakerId(operationType);
    this.circuitBreakers.set(circuitBreakerId, { ...DEFAULT_CIRCUIT_BREAKER });
    this.logger.log(`Circuit breaker reset for ${operationType} operations`);
  }

  /**
   * Resets all circuit breakers
   */
  public resetAllCircuitBreakers(): void {
    this.initializeCircuitBreakers();
    this.logger.log('All circuit breakers reset');
  }

  /**
   * Gets the current state of a circuit breaker
   * @param operationType The type of operation
   * @returns The current circuit breaker state
   */
  public getCircuitBreakerState(operationType: RetryOperationType): ICircuitBreakerState {
    return { ...this.getCircuitBreaker(operationType) };
  }

  /**
   * Gets the current state of all circuit breakers
   * @returns A map of operation types to circuit breaker states
   */
  public getAllCircuitBreakerStates(): Record<RetryOperationType, ICircuitBreakerState> {
    const states: Partial<Record<RetryOperationType, ICircuitBreakerState>> = {};
    
    Object.values(RetryOperationType).forEach((operationType) => {
      states[operationType] = this.getCircuitBreakerState(operationType);
    });
    
    return states as Record<RetryOperationType, ICircuitBreakerState>;
  }

  /**
   * Updates the retry configuration
   * @param config The new retry configuration
   */
  public updateRetryConfig(config: Partial<IConnectionRetryConfig>): void {
    this.retryConfig.maxRetries = config.maxRetries ?? this.retryConfig.maxRetries;
    this.retryConfig.initialDelayMs = config.initialDelayMs ?? this.retryConfig.initialDelayMs;
    this.retryConfig.maxDelayMs = config.maxDelayMs ?? this.retryConfig.maxDelayMs;
    this.retryConfig.backoffFactor = config.backoffFactor ?? this.retryConfig.backoffFactor;
    this.retryConfig.useJitter = config.useJitter ?? this.retryConfig.useJitter;
    
    if (config.retryableErrors) {
      this.retryConfig.retryableErrors = [...config.retryableErrors];
    }
    
    this.logger.log('Retry configuration updated');
  }

  /**
   * Gets the current retry configuration
   * @returns The current retry configuration
   */
  public getRetryConfig(): IConnectionRetryConfig {
    return { ...this.retryConfig };
  }
}