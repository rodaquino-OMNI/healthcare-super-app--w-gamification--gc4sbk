/**
 * @file connection-retry.ts
 * @description Implements ConnectionRetry class that provides retry strategies and policies
 * for handling database connection failures. Includes configurable retry mechanisms with
 * exponential backoff, jitter, and circuit breaker pattern to prevent cascading failures.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ConnectionError,
  ConnectionErrorCategory,
  ConnectionEventEmitter,
  ConnectionEventType,
  DatabaseConnectionConfig,
  DatabaseConnectionType,
  JourneyDatabaseOptions,
  RetryPolicy,
  DEFAULT_RETRY_POLICY,
} from '../types/connection.types';

/**
 * Retry state for tracking retry attempts and circuit breaker status
 */
interface RetryState {
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Whether the circuit breaker is open (preventing further attempts) */
  circuitOpen: boolean;
  /** Timestamp when the circuit breaker was opened */
  circuitOpenedAt?: Date;
  /** Last error that occurred */
  lastError?: ConnectionError;
  /** Last successful connection timestamp */
  lastSuccessAt?: Date;
  /** Total retry attempts made */
  totalRetries: number;
  /** Connection identifier */
  connectionId: string;
}

/**
 * Retry context for providing operation-specific retry behavior
 */
export interface RetryContext {
  /** Operation being performed (connect, query, transaction) */
  operation: 'connect' | 'query' | 'transaction' | 'healthCheck';
  /** Database connection type */
  connectionType: DatabaseConnectionType;
  /** Journey context if available */
  journeyContext?: JourneyDatabaseOptions;
  /** Whether this is a critical operation that requires higher retry priority */
  isCritical?: boolean;
  /** Custom retry policy overrides for this specific operation */
  policyOverrides?: Partial<RetryPolicy>;
  /** Operation-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Result of a retry decision
 */
export interface RetryDecision {
  /** Whether to retry the operation */
  shouldRetry: boolean;
  /** Delay in milliseconds before the next retry attempt */
  delayMs: number;
  /** Reason for the retry decision */
  reason: string;
  /** Whether this is the final retry attempt */
  isFinalAttempt: boolean;
  /** Updated retry state */
  updatedState: RetryState;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Whether the circuit breaker is enabled */
  enabled: boolean;
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds to keep the circuit open before allowing a test request */
  resetTimeoutMs: number;
  /** Whether to apply half-open state where a single request is allowed through */
  enableHalfOpenState: boolean;
  /** Error categories that should trigger the circuit breaker */
  triggerCategories: ConnectionErrorCategory[];
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  enabled: true,
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  enableHalfOpenState: true,
  triggerCategories: [
    ConnectionErrorCategory.NETWORK,
    ConnectionErrorCategory.RESOURCE_LIMIT,
  ],
};

/**
 * Configuration for the ConnectionRetry class
 */
export interface ConnectionRetryConfig {
  /** Default retry policy */
  defaultPolicy: RetryPolicy;
  /** Circuit breaker configuration */
  circuitBreaker: CircuitBreakerConfig;
  /** Whether to enable detailed logging of retry attempts */
  enableDetailedLogging: boolean;
  /** Custom retry policies by operation type */
  operationPolicies?: {
    connect?: Partial<RetryPolicy>;
    query?: Partial<RetryPolicy>;
    transaction?: Partial<RetryPolicy>;
    healthCheck?: Partial<RetryPolicy>;
  };
  /** Custom retry policies by connection type */
  connectionTypePolicies?: {
    [DatabaseConnectionType.POSTGRES]?: Partial<RetryPolicy>;
    [DatabaseConnectionType.TIMESCALE]?: Partial<RetryPolicy>;
    [DatabaseConnectionType.REDIS]?: Partial<RetryPolicy>;
    [DatabaseConnectionType.S3]?: Partial<RetryPolicy>;
  };
  /** Custom retry policies by journey */
  journeyPolicies?: {
    health?: Partial<RetryPolicy>;
    care?: Partial<RetryPolicy>;
    plan?: Partial<RetryPolicy>;
    gamification?: Partial<RetryPolicy>;
    auth?: Partial<RetryPolicy>;
    notification?: Partial<RetryPolicy>;
  };
}

/**
 * Default ConnectionRetry configuration
 */
const DEFAULT_CONNECTION_RETRY_CONFIG: ConnectionRetryConfig = {
  defaultPolicy: DEFAULT_RETRY_POLICY,
  circuitBreaker: DEFAULT_CIRCUIT_BREAKER_CONFIG,
  enableDetailedLogging: false,
  operationPolicies: {
    connect: { maxRetries: 5, initialDelayMs: 100, maxDelayMs: 5000 },
    query: { maxRetries: 3, initialDelayMs: 50, maxDelayMs: 2000 },
    transaction: { maxRetries: 2, initialDelayMs: 50, maxDelayMs: 1000 },
    healthCheck: { maxRetries: 1, initialDelayMs: 100, maxDelayMs: 1000 },
  },
  connectionTypePolicies: {
    [DatabaseConnectionType.POSTGRES]: { maxRetries: 5, initialDelayMs: 100 },
    [DatabaseConnectionType.REDIS]: { maxRetries: 3, initialDelayMs: 50 },
    [DatabaseConnectionType.S3]: { maxRetries: 2, initialDelayMs: 200 },
  },
  journeyPolicies: {
    health: { maxRetries: 3 },
    care: { maxRetries: 3 },
    plan: { maxRetries: 3 },
    gamification: { maxRetries: 5 }, // Gamification needs higher retry count for event processing
    auth: { maxRetries: 5 }, // Auth is critical and needs more retries
    notification: { maxRetries: 2 }, // Notifications can fail more gracefully
  },
};

/**
 * Provides retry strategies and policies for handling database connection failures.
 * Implements configurable retry mechanisms with exponential backoff, jitter,
 * and circuit breaker pattern to prevent cascading failures.
 */
@Injectable()
export class ConnectionRetry {
  private readonly logger = new Logger(ConnectionRetry.name);
  private readonly retryStates = new Map<string, RetryState>();
  private readonly config: ConnectionRetryConfig;

  /**
   * Creates a new ConnectionRetry instance
   * @param config Configuration for retry behavior
   * @param eventEmitter Optional event emitter for publishing retry events
   */
  constructor(
    config?: Partial<ConnectionRetryConfig>,
    private readonly eventEmitter?: ConnectionEventEmitter,
  ) {
    this.config = {
      ...DEFAULT_CONNECTION_RETRY_CONFIG,
      ...config,
      defaultPolicy: {
        ...DEFAULT_CONNECTION_RETRY_CONFIG.defaultPolicy,
        ...config?.defaultPolicy,
      },
      circuitBreaker: {
        ...DEFAULT_CONNECTION_RETRY_CONFIG.circuitBreaker,
        ...config?.circuitBreaker,
      },
      operationPolicies: {
        ...DEFAULT_CONNECTION_RETRY_CONFIG.operationPolicies,
        ...config?.operationPolicies,
      },
      connectionTypePolicies: {
        ...DEFAULT_CONNECTION_RETRY_CONFIG.connectionTypePolicies,
        ...config?.connectionTypePolicies,
      },
      journeyPolicies: {
        ...DEFAULT_CONNECTION_RETRY_CONFIG.journeyPolicies,
        ...config?.journeyPolicies,
      },
    };
  }

  /**
   * Initializes retry state for a connection
   * @param connectionId Unique identifier for the connection
   */
  public initializeRetryState(connectionId: string): void {
    this.retryStates.set(connectionId, {
      consecutiveFailures: 0,
      circuitOpen: false,
      totalRetries: 0,
      connectionId,
    });
  }

  /**
   * Resets retry state for a connection after successful operation
   * @param connectionId Unique identifier for the connection
   */
  public resetRetryState(connectionId: string): void {
    const state = this.retryStates.get(connectionId);
    if (state) {
      state.consecutiveFailures = 0;
      state.circuitOpen = false;
      state.lastSuccessAt = new Date();
      this.retryStates.set(connectionId, state);

      if (this.config.enableDetailedLogging) {
        this.logger.debug(`Reset retry state for connection ${connectionId}`);
      }
    }
  }

  /**
   * Determines whether an operation should be retried and calculates the delay
   * @param connectionId Unique identifier for the connection
   * @param error Error that occurred during the operation
   * @param attempt Current attempt number (1-based)
   * @param context Context for the retry decision
   * @returns Retry decision with delay and reason
   */
  public shouldRetry(
    connectionId: string,
    error: ConnectionError,
    attempt: number,
    context: RetryContext,
  ): RetryDecision {
    // Get or initialize retry state
    let state = this.retryStates.get(connectionId);
    if (!state) {
      state = {
        consecutiveFailures: 0,
        circuitOpen: false,
        totalRetries: 0,
        connectionId,
      };
      this.retryStates.set(connectionId, state);
    }

    // Update state with the new failure
    state.consecutiveFailures += 1;
    state.lastError = error;
    state.totalRetries += 1;

    // Get the effective retry policy for this operation
    const policy = this.getEffectiveRetryPolicy(context);

    // Check if we've exceeded the maximum retry attempts
    if (attempt >= policy.maxRetries) {
      return this.createRetryDecision(false, 0, 'Maximum retry attempts exceeded', true, state);
    }

    // Check if the error is retryable
    if (!this.isErrorRetryable(error, policy)) {
      return this.createRetryDecision(false, 0, `Error is not retryable: ${error.category}`, true, state);
    }

    // Check circuit breaker status
    const circuitBreakerDecision = this.checkCircuitBreaker(state, error);
    if (circuitBreakerDecision) {
      return circuitBreakerDecision;
    }

    // Calculate delay with exponential backoff and optional jitter
    const delay = this.calculateRetryDelay(attempt, policy);

    // Log retry attempt if detailed logging is enabled
    this.logRetryAttempt(connectionId, error, attempt, delay, context);

    // Emit retry event if event emitter is available
    this.emitRetryEvent(connectionId, error, attempt, delay, context);

    return this.createRetryDecision(
      true,
      delay,
      `Retrying operation (attempt ${attempt}/${policy.maxRetries})`,
      attempt === policy.maxRetries - 1,
      state,
    );
  }

  /**
   * Checks if the circuit breaker should prevent retry attempts
   * @param state Current retry state
   * @param error Error that occurred
   * @returns Retry decision if circuit breaker prevents retry, undefined otherwise
   */
  private checkCircuitBreaker(state: RetryState, error: ConnectionError): RetryDecision | undefined {
    const config = this.config.circuitBreaker;

    // Skip circuit breaker check if disabled
    if (!config.enabled) {
      return undefined;
    }

    // Check if error category should trigger circuit breaker
    const shouldTriggerCircuitBreaker = config.triggerCategories.includes(error.category);
    if (!shouldTriggerCircuitBreaker) {
      return undefined;
    }

    // If circuit is already open, check if reset timeout has elapsed
    if (state.circuitOpen && state.circuitOpenedAt) {
      const elapsedMs = Date.now() - state.circuitOpenedAt.getTime();
      
      // If reset timeout has elapsed and half-open state is enabled, allow one test request
      if (elapsedMs >= config.resetTimeoutMs && config.enableHalfOpenState) {
        // Allow a test request in half-open state
        this.logger.log(
          `Circuit half-open for connection ${state.connectionId} after ${elapsedMs}ms, allowing test request`,
        );
        return undefined;
      }
      
      // Circuit is still open, prevent retry
      if (elapsedMs < config.resetTimeoutMs) {
        return this.createRetryDecision(
          false,
          0,
          `Circuit breaker open (${Math.round((config.resetTimeoutMs - elapsedMs) / 1000)}s remaining)`,
          true,
          state,
        );
      }
    }

    // Check if we should open the circuit breaker
    if (state.consecutiveFailures >= config.failureThreshold) {
      state.circuitOpen = true;
      state.circuitOpenedAt = new Date();
      
      this.logger.warn(
        `Circuit breaker opened for connection ${state.connectionId} after ${state.consecutiveFailures} consecutive failures`,
      );
      
      return this.createRetryDecision(
        false,
        0,
        `Circuit breaker opened after ${state.consecutiveFailures} consecutive failures`,
        true,
        state,
      );
    }

    return undefined;
  }

  /**
   * Calculates the delay before the next retry attempt using exponential backoff and optional jitter
   * @param attempt Current attempt number (1-based)
   * @param policy Retry policy to use
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
    // Calculate base delay with exponential backoff: initialDelay * (backoffMultiplier ^ (attempt - 1))
    let delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1);
    
    // Apply jitter if enabled (adds or subtracts up to 25% of the delay)
    if (policy.useJitter) {
      const jitterFactor = 0.25; // 25% jitter
      const jitterRange = delay * jitterFactor;
      delay = delay - jitterRange + (Math.random() * jitterRange * 2);
    }
    
    // Ensure delay doesn't exceed maximum
    delay = Math.min(delay, policy.maxDelayMs);
    
    // Ensure delay is at least 1ms
    return Math.max(Math.round(delay), 1);
  }

  /**
   * Determines if an error is retryable based on its category and code
   * @param error Error that occurred
   * @param policy Retry policy to use
   * @returns Whether the error is retryable
   */
  private isErrorRetryable(error: ConnectionError, policy: RetryPolicy): boolean {
    // If the error is explicitly marked as retryable, respect that
    if (error.isRetryable) {
      return true;
    }

    // Check if error code is in the list of retryable error codes
    if (policy.retryableErrorCodes && error.code) {
      if (policy.retryableErrorCodes.includes(error.code)) {
        return true;
      }
    }

    // Determine retryability based on error category
    switch (error.category) {
      case ConnectionErrorCategory.NETWORK:
      case ConnectionErrorCategory.TIMEOUT:
        // Network and timeout errors are generally retryable
        return true;
      case ConnectionErrorCategory.RESOURCE_LIMIT:
        // Resource limit errors might be retryable after a delay
        return true;
      case ConnectionErrorCategory.AUTHENTICATION:
      case ConnectionErrorCategory.CONFIGURATION:
        // Authentication and configuration errors are not retryable without intervention
        return false;
      case ConnectionErrorCategory.UNKNOWN:
      default:
        // Unknown errors are retryable by default, but with caution
        return true;
    }
  }

  /**
   * Gets the effective retry policy for a specific operation by merging policies
   * @param context Retry context with operation details
   * @returns Effective retry policy
   */
  private getEffectiveRetryPolicy(context: RetryContext): RetryPolicy {
    // Start with the default policy
    const basePolicy = { ...this.config.defaultPolicy };

    // Apply operation-specific policy if available
    if (this.config.operationPolicies?.[context.operation]) {
      Object.assign(basePolicy, this.config.operationPolicies[context.operation]);
    }

    // Apply connection type-specific policy if available
    if (this.config.connectionTypePolicies?.[context.connectionType]) {
      Object.assign(basePolicy, this.config.connectionTypePolicies[context.connectionType]);
    }

    // Apply journey-specific policy if available
    if (context.journeyContext?.journeyId && this.config.journeyPolicies?.[context.journeyContext.journeyId]) {
      Object.assign(basePolicy, this.config.journeyPolicies[context.journeyContext.journeyId]);
    }

    // Apply critical operation overrides if applicable
    if (context.isCritical) {
      // Critical operations get more retries and potentially longer delays
      basePolicy.maxRetries = Math.max(basePolicy.maxRetries, 5);
      basePolicy.maxDelayMs = Math.max(basePolicy.maxDelayMs, 10000);
    }

    // Apply context-specific policy overrides if provided
    if (context.policyOverrides) {
      Object.assign(basePolicy, context.policyOverrides);
    }

    return basePolicy;
  }

  /**
   * Creates a standardized retry decision object
   * @param shouldRetry Whether to retry the operation
   * @param delayMs Delay in milliseconds before the next retry attempt
   * @param reason Reason for the retry decision
   * @param isFinalAttempt Whether this is the final retry attempt
   * @param state Updated retry state
   * @returns Retry decision
   */
  private createRetryDecision(
    shouldRetry: boolean,
    delayMs: number,
    reason: string,
    isFinalAttempt: boolean,
    state: RetryState,
  ): RetryDecision {
    // Update the retry state in the map
    this.retryStates.set(state.connectionId, state);

    return {
      shouldRetry,
      delayMs,
      reason,
      isFinalAttempt,
      updatedState: { ...state },
    };
  }

  /**
   * Logs retry attempt details if detailed logging is enabled
   * @param connectionId Connection identifier
   * @param error Error that occurred
   * @param attempt Current attempt number
   * @param delay Calculated delay before next retry
   * @param context Retry context
   */
  private logRetryAttempt(
    connectionId: string,
    error: ConnectionError,
    attempt: number,
    delay: number,
    context: RetryContext,
  ): void {
    if (!this.config.enableDetailedLogging) {
      return;
    }

    const state = this.retryStates.get(connectionId);
    const journey = context.journeyContext?.journeyId || 'unknown';
    
    this.logger.debug(
      `Retry attempt ${attempt} for ${context.operation} on ${context.connectionType} connection ` +
      `(journey: ${journey}, id: ${connectionId}): ` +
      `${error.message} (${error.category}). ` +
      `Delay: ${delay}ms, Consecutive failures: ${state?.consecutiveFailures || 0}`,
      {
        connectionId,
        attempt,
        operation: context.operation,
        connectionType: context.connectionType,
        journeyId: journey,
        errorCategory: error.category,
        errorCode: error.code,
        delay,
        consecutiveFailures: state?.consecutiveFailures || 0,
      },
    );
  }

  /**
   * Emits a retry event if an event emitter is available
   * @param connectionId Connection identifier
   * @param error Error that occurred
   * @param attempt Current attempt number
   * @param delay Calculated delay before next retry
   * @param context Retry context
   */
  private emitRetryEvent(
    connectionId: string,
    error: ConnectionError,
    attempt: number,
    delay: number,
    context: RetryContext,
  ): void {
    if (!this.eventEmitter) {
      return;
    }

    this.eventEmitter.emit({
      type: ConnectionEventType.RECONNECTING,
      connectionId,
      journeyId: context.journeyContext?.journeyId,
      timestamp: new Date(),
      data: {
        attempt,
        operation: context.operation,
        connectionType: context.connectionType,
        delay,
        errorCategory: error.category,
        errorCode: error.code,
        isCritical: context.isCritical,
      },
      error,
    });
  }

  /**
   * Gets the current retry state for a connection
   * @param connectionId Connection identifier
   * @returns Current retry state or undefined if not found
   */
  public getRetryState(connectionId: string): RetryState | undefined {
    return this.retryStates.get(connectionId);
  }

  /**
   * Checks if the circuit breaker is currently open for a connection
   * @param connectionId Connection identifier
   * @returns Whether the circuit breaker is open
   */
  public isCircuitOpen(connectionId: string): boolean {
    const state = this.retryStates.get(connectionId);
    if (!state) {
      return false;
    }

    // If circuit is open but reset timeout has elapsed, consider it closed
    if (state.circuitOpen && state.circuitOpenedAt) {
      const elapsedMs = Date.now() - state.circuitOpenedAt.getTime();
      if (elapsedMs >= this.config.circuitBreaker.resetTimeoutMs) {
        return false;
      }
    }

    return state.circuitOpen;
  }

  /**
   * Manually closes the circuit breaker for a connection
   * @param connectionId Connection identifier
   */
  public closeCircuit(connectionId: string): void {
    const state = this.retryStates.get(connectionId);
    if (state && state.circuitOpen) {
      state.circuitOpen = false;
      state.consecutiveFailures = 0;
      this.retryStates.set(connectionId, state);
      
      this.logger.log(`Circuit breaker manually closed for connection ${connectionId}`);
      
      if (this.eventEmitter) {
        this.eventEmitter.emit({
          type: ConnectionEventType.RECONNECTED,
          connectionId,
          timestamp: new Date(),
          data: {
            manualReset: true,
          },
        });
      }
    }
  }

  /**
   * Manually opens the circuit breaker for a connection
   * @param connectionId Connection identifier
   * @param reason Reason for manually opening the circuit
   */
  public openCircuit(connectionId: string, reason: string): void {
    const state = this.retryStates.get(connectionId) || {
      consecutiveFailures: this.config.circuitBreaker.failureThreshold,
      circuitOpen: false,
      totalRetries: 0,
      connectionId,
    };

    state.circuitOpen = true;
    state.circuitOpenedAt = new Date();
    this.retryStates.set(connectionId, state);
    
    this.logger.warn(`Circuit breaker manually opened for connection ${connectionId}: ${reason}`);
    
    if (this.eventEmitter) {
      this.eventEmitter.emit({
        type: ConnectionEventType.ERROR,
        connectionId,
        timestamp: new Date(),
        data: {
          manualCircuitOpen: true,
          reason,
        },
      });
    }
  }

  /**
   * Executes a function with retry logic
   * @param connectionId Connection identifier
   * @param operation Function to execute
   * @param context Retry context
   * @returns Promise resolving to the operation result
   * @throws Last error if all retries fail
   */
  public async executeWithRetry<T>(
    connectionId: string,
    operation: () => Promise<T>,
    context: RetryContext,
  ): Promise<T> {
    const policy = this.getEffectiveRetryPolicy(context);
    let attempt = 0;
    let lastError: ConnectionError | undefined;

    while (attempt <= policy.maxRetries) {
      try {
        // Increment attempt counter
        attempt++;

        // Execute the operation
        const result = await operation();

        // Reset retry state on success
        this.resetRetryState(connectionId);

        return result;
      } catch (error) {
        // Convert error to ConnectionError if needed
        const connectionError = this.ensureConnectionError(error);
        lastError = connectionError;

        // Check if we should retry
        const decision = this.shouldRetry(connectionId, connectionError, attempt, context);

        if (!decision.shouldRetry) {
          // Don't retry, throw the last error
          break;
        }

        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, decision.delayMs));
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Operation failed after all retry attempts');
  }

  /**
   * Ensures that an error is a ConnectionError
   * @param error Error to convert
   * @returns ConnectionError instance
   */
  private ensureConnectionError(error: any): ConnectionError {
    if (error && 'category' in error && 'isRetryable' in error) {
      return error as ConnectionError;
    }

    // Convert generic error to ConnectionError
    return {
      category: ConnectionErrorCategory.UNKNOWN,
      originalError: error instanceof Error ? error : new Error(String(error)),
      message: error instanceof Error ? error.message : String(error),
      isRetryable: true, // Default to retryable for unknown errors
      timestamp: new Date(),
    };
  }

  /**
   * Gets retry statistics for all connections
   * @returns Retry statistics by connection ID
   */
  public getRetryStatistics(): Record<string, {
    totalRetries: number;
    consecutiveFailures: number;
    circuitOpen: boolean;
    circuitOpenedAt?: Date;
    lastSuccessAt?: Date;
    lastErrorCategory?: ConnectionErrorCategory;
    lastErrorTimestamp?: Date;
  }> {
    const statistics: Record<string, any> = {};

    for (const [connectionId, state] of this.retryStates.entries()) {
      statistics[connectionId] = {
        totalRetries: state.totalRetries,
        consecutiveFailures: state.consecutiveFailures,
        circuitOpen: state.circuitOpen,
        circuitOpenedAt: state.circuitOpenedAt,
        lastSuccessAt: state.lastSuccessAt,
        lastErrorCategory: state.lastError?.category,
        lastErrorTimestamp: state.lastError?.timestamp,
      };
    }

    return statistics;
  }

  /**
   * Clears all retry state data
   */
  public clearAllRetryStates(): void {
    this.retryStates.clear();
    this.logger.debug('Cleared all retry states');
  }
}