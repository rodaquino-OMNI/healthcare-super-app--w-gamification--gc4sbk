/**
 * @file retry-strategies.ts
 * @description Implements configurable retry strategies for transient database errors,
 * including exponential backoff, jitter, circuit breaker, and custom retry policies.
 * Provides a RetryStrategyFactory to create appropriate strategies based on error types
 * and operation context.
 */

import { ErrorType } from '@austa/errors';
import { DatabaseErrorType } from './database-error.types';
import { IConnectionRetryConfig } from '../types/connection.types';
import { TransactionRetryOptions } from '../types/transaction.types';

/**
 * Interface representing the context of a database operation for retry decisions
 */
export interface OperationContext {
  /**
   * The type of database operation being performed
   */
  operationType: 'query' | 'mutation' | 'transaction' | 'connection';
  
  /**
   * The name of the specific operation (e.g., 'findUser', 'updateProfile')
   */
  operationName: string;
  
  /**
   * The journey context this operation belongs to (e.g., 'health', 'care', 'plan')
   */
  journeyContext?: string;
  
  /**
   * The number of previous retry attempts for this operation
   */
  attemptCount: number;
  
  /**
   * The timestamp when the operation was first attempted
   */
  firstAttemptTimestamp: number;
  
  /**
   * The timestamp of the most recent attempt
   */
  lastAttemptTimestamp: number;
  
  /**
   * The error that caused the operation to fail
   */
  error: Error;
  
  /**
   * Additional metadata for the operation
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for retry strategy result
 */
export interface RetryDecision {
  /**
   * Whether to retry the operation
   */
  shouldRetry: boolean;
  
  /**
   * The delay in milliseconds before the next retry attempt
   */
  delayMs: number;
  
  /**
   * The reason for the retry decision
   */
  reason: string;
  
  /**
   * Additional metadata for the retry decision
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for retry strategy configuration
 */
export interface RetryStrategyConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Initial delay in milliseconds before the first retry
   * @default 100
   */
  initialDelayMs?: number;
  
  /**
   * Maximum delay in milliseconds between retries
   * @default 5000 (5 seconds)
   */
  maxDelayMs?: number;
  
  /**
   * Types of errors that should trigger a retry
   * @default [DatabaseErrorType.CONNECTION, DatabaseErrorType.TIMEOUT, DatabaseErrorType.TRANSIENT]
   */
  retryableErrorTypes?: DatabaseErrorType[];
  
  /**
   * Journey-specific retry configurations
   */
  journeyConfigs?: Record<string, Partial<RetryStrategyConfig>>;
  
  /**
   * Operation-specific retry configurations
   */
  operationConfigs?: Record<string, Partial<RetryStrategyConfig>>;
}

/**
 * Default retry strategy configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<RetryStrategyConfig> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  retryableErrorTypes: [
    DatabaseErrorType.CONNECTION,
    DatabaseErrorType.TIMEOUT,
    DatabaseErrorType.TRANSIENT
  ],
  journeyConfigs: {},
  operationConfigs: {}
};

/**
 * Interface for retry strategies
 */
export interface RetryStrategy {
  /**
   * Determines whether to retry an operation and calculates the delay
   * @param context The context of the operation
   * @returns A decision on whether to retry and the delay before the next attempt
   */
  shouldRetry(context: OperationContext): RetryDecision;
  
  /**
   * Gets the configuration for this retry strategy
   * @returns The current configuration
   */
  getConfig(): RetryStrategyConfig;
  
  /**
   * Updates the configuration for this retry strategy
   * @param config The new configuration
   */
  updateConfig(config: Partial<RetryStrategyConfig>): void;
  
  /**
   * Resets the internal state of the retry strategy
   */
  reset(): void;
}

/**
 * Base class for retry strategies that implements common functionality
 */
export abstract class BaseRetryStrategy implements RetryStrategy {
  protected config: Required<RetryStrategyConfig>;
  
  /**
   * Creates a new instance of BaseRetryStrategy
   * @param config Configuration for the retry strategy
   */
  constructor(config: Partial<RetryStrategyConfig> = {}) {
    this.config = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
      journeyConfigs: { ...DEFAULT_RETRY_CONFIG.journeyConfigs, ...config.journeyConfigs },
      operationConfigs: { ...DEFAULT_RETRY_CONFIG.operationConfigs, ...config.operationConfigs }
    };
  }
  
  /**
   * Gets the configuration for this retry strategy
   * @returns The current configuration
   */
  public getConfig(): RetryStrategyConfig {
    return { ...this.config };
  }
  
  /**
   * Updates the configuration for this retry strategy
   * @param config The new configuration
   */
  public updateConfig(config: Partial<RetryStrategyConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      journeyConfigs: { ...this.config.journeyConfigs, ...config.journeyConfigs },
      operationConfigs: { ...this.config.operationConfigs, ...config.operationConfigs }
    };
  }
  
  /**
   * Resets the internal state of the retry strategy
   */
  public reset(): void {
    // Base implementation does nothing, subclasses can override
  }
  
  /**
   * Determines whether to retry an operation and calculates the delay
   * @param context The context of the operation
   * @returns A decision on whether to retry and the delay before the next attempt
   */
  public abstract shouldRetry(context: OperationContext): RetryDecision;
  
  /**
   * Gets the effective configuration for a specific operation context
   * @param context The operation context
   * @returns The effective configuration for the context
   */
  protected getEffectiveConfig(context: OperationContext): Required<RetryStrategyConfig> {
    const baseConfig = { ...this.config };
    
    // Apply journey-specific configuration if available
    if (context.journeyContext && this.config.journeyConfigs[context.journeyContext]) {
      Object.assign(baseConfig, this.config.journeyConfigs[context.journeyContext]);
    }
    
    // Apply operation-specific configuration if available
    if (this.config.operationConfigs[context.operationName]) {
      Object.assign(baseConfig, this.config.operationConfigs[context.operationName]);
    }
    
    return baseConfig as Required<RetryStrategyConfig>;
  }
  
  /**
   * Checks if an error is retryable based on its type
   * @param error The error to check
   * @param retryableTypes Array of retryable error types
   * @returns Whether the error is retryable
   */
  protected isRetryableError(error: Error, retryableTypes: DatabaseErrorType[]): boolean {
    // If the error has a type property that matches a retryable type, it's retryable
    if ('type' in error && typeof error['type'] === 'string') {
      return retryableTypes.includes(error['type'] as DatabaseErrorType);
    }
    
    // Check for specific error patterns that indicate retryable errors
    const errorMessage = error.message.toLowerCase();
    const retryablePatterns = [
      'connection', 'timeout', 'deadlock', 'lock', 'retry', 'again',
      'temporary', 'transient', 'interrupt', 'reset', 'closed', 'unavailable'
    ];
    
    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }
  
  /**
   * Adds jitter to a delay to prevent thundering herd problem
   * @param delay The base delay in milliseconds
   * @returns The delay with jitter added
   */
  protected addJitter(delay: number): number {
    // Add random jitter of ±25% to the delay
    const jitterFactor = 0.25;
    const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
    return Math.max(0, Math.floor(delay + jitter));
  }
}

/**
 * Implements an exponential backoff retry strategy with configurable base delay,
 * maximum attempts, and jitter
 */
export class ExponentialBackoffStrategy extends BaseRetryStrategy {
  /**
   * Determines whether to retry an operation and calculates the delay using exponential backoff
   * @param context The context of the operation
   * @returns A decision on whether to retry and the delay before the next attempt
   */
  public shouldRetry(context: OperationContext): RetryDecision {
    const config = this.getEffectiveConfig(context);
    
    // Check if we've exceeded the maximum number of retries
    if (context.attemptCount >= config.maxRetries) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: `Maximum retry attempts (${config.maxRetries}) exceeded`
      };
    }
    
    // Check if the error is retryable
    if (!this.isRetryableError(context.error, config.retryableErrorTypes)) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: 'Error is not retryable'
      };
    }
    
    // Calculate delay with exponential backoff: initialDelay * (2 ^ attemptCount)
    let delay = config.initialDelayMs * Math.pow(2, context.attemptCount);
    
    // Cap the delay at the maximum delay
    delay = Math.min(delay, config.maxDelayMs);
    
    // Add jitter to prevent thundering herd problem
    delay = this.addJitter(delay);
    
    return {
      shouldRetry: true,
      delayMs: delay,
      reason: 'Retryable error with exponential backoff',
      metadata: {
        baseDelay: config.initialDelayMs * Math.pow(2, context.attemptCount),
        maxDelay: config.maxDelayMs,
        attemptCount: context.attemptCount
      }
    };
  }
}

/**
 * Circuit breaker state
 */
export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests are allowed
  OPEN = 'OPEN',       // Circuit is open, requests are not allowed
  HALF_OPEN = 'HALF_OPEN' // Testing if the circuit can be closed again
}

/**
 * Configuration for the circuit breaker strategy
 */
export interface CircuitBreakerConfig extends RetryStrategyConfig {
  /**
   * Number of consecutive failures required to open the circuit
   * @default 5
   */
  failureThreshold?: number;
  
  /**
   * Time in milliseconds that the circuit stays open before moving to half-open
   * @default 30000 (30 seconds)
   */
  resetTimeoutMs?: number;
  
  /**
   * Number of consecutive successful test requests required to close the circuit
   * @default 2
   */
  successThreshold?: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: Required<CircuitBreakerConfig> = {
  ...DEFAULT_RETRY_CONFIG,
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  successThreshold: 2
};

/**
 * Implements a circuit breaker pattern to prevent cascading failures
 * during outages by failing fast when a dependency is unhealthy
 */
export class CircuitBreakerStrategy extends BaseRetryStrategy {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastStateChangeTimestamp: number = Date.now();
  private readonly circuitConfig: Required<CircuitBreakerConfig>;
  
  /**
   * Creates a new instance of CircuitBreakerStrategy
   * @param config Configuration for the circuit breaker
   */
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    super(config);
    this.circuitConfig = {
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...config,
      journeyConfigs: { ...DEFAULT_CIRCUIT_BREAKER_CONFIG.journeyConfigs, ...config.journeyConfigs },
      operationConfigs: { ...DEFAULT_CIRCUIT_BREAKER_CONFIG.operationConfigs, ...config.operationConfigs }
    };
  }
  
  /**
   * Determines whether to retry an operation based on the circuit state
   * @param context The context of the operation
   * @returns A decision on whether to retry and the delay before the next attempt
   */
  public shouldRetry(context: OperationContext): RetryDecision {
    const config = this.getEffectiveCircuitConfig(context);
    
    // Update the circuit state based on the current time
    this.updateCircuitState();
    
    // If the circuit is open, fail fast
    if (this.state === CircuitState.OPEN) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: 'Circuit is open, failing fast',
        metadata: {
          circuitState: this.state,
          failureCount: this.failureCount,
          lastStateChangeTimestamp: this.lastStateChangeTimestamp
        }
      };
    }
    
    // Check if we've exceeded the maximum number of retries
    if (context.attemptCount >= config.maxRetries) {
      // Increment failure count if we're giving up due to max retries
      this.recordFailure();
      
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: `Maximum retry attempts (${config.maxRetries}) exceeded`,
        metadata: {
          circuitState: this.state,
          failureCount: this.failureCount,
          lastStateChangeTimestamp: this.lastStateChangeTimestamp
        }
      };
    }
    
    // Check if the error is retryable
    if (!this.isRetryableError(context.error, config.retryableErrorTypes)) {
      // Non-retryable errors don't affect the circuit state
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: 'Error is not retryable',
        metadata: {
          circuitState: this.state
        }
      };
    }
    
    // If the circuit is half-open, only allow a limited number of test requests
    if (this.state === CircuitState.HALF_OPEN && context.attemptCount === 0) {
      // This is a new request, not a retry of a previous one
      // Allow it through as a test request
      return {
        shouldRetry: true,
        delayMs: 0, // No delay for test requests
        reason: 'Test request in half-open state',
        metadata: {
          circuitState: this.state,
          isTestRequest: true
        }
      };
    } else if (this.state === CircuitState.HALF_OPEN && context.attemptCount > 0) {
      // This is a retry of a test request that failed
      // Record the failure and keep the circuit half-open or open it again
      this.recordFailure();
      
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: 'Test request failed in half-open state',
        metadata: {
          circuitState: this.state,
          failureCount: this.failureCount
        }
      };
    }
    
    // For closed circuit, use exponential backoff for retries
    let delay = config.initialDelayMs * Math.pow(2, context.attemptCount);
    delay = Math.min(delay, config.maxDelayMs);
    delay = this.addJitter(delay);
    
    return {
      shouldRetry: true,
      delayMs: delay,
      reason: 'Retryable error with circuit breaker',
      metadata: {
        circuitState: this.state,
        failureCount: this.failureCount,
        baseDelay: config.initialDelayMs * Math.pow(2, context.attemptCount),
        maxDelay: config.maxDelayMs
      }
    };
  }
  
  /**
   * Records a successful operation, potentially closing the circuit
   */
  public recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.circuitConfig.successThreshold) {
        this.closeCircuit();
      }
    }
    
    // Reset failure count in closed state on success
    if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }
  
  /**
   * Records a failed operation, potentially opening the circuit
   */
  public recordFailure(): void {
    if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.circuitConfig.failureThreshold) {
        this.openCircuit();
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit again
      this.openCircuit();
    }
  }
  
  /**
   * Gets the current state of the circuit
   * @returns The current circuit state
   */
  public getState(): CircuitState {
    this.updateCircuitState();
    return this.state;
  }
  
  /**
   * Resets the circuit breaker to its initial closed state
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChangeTimestamp = Date.now();
  }
  
  /**
   * Updates the circuit configuration
   * @param config The new configuration
   */
  public updateConfig(config: Partial<CircuitBreakerConfig>): void {
    super.updateConfig(config);
    
    this.circuitConfig = {
      ...this.circuitConfig,
      ...config,
      journeyConfigs: { ...this.circuitConfig.journeyConfigs, ...config.journeyConfigs },
      operationConfigs: { ...this.circuitConfig.operationConfigs, ...config.operationConfigs }
    };
  }
  
  /**
   * Gets the effective circuit breaker configuration for a specific operation context
   * @param context The operation context
   * @returns The effective configuration for the context
   */
  private getEffectiveCircuitConfig(context: OperationContext): Required<CircuitBreakerConfig> {
    const baseConfig = this.getEffectiveConfig(context) as Required<CircuitBreakerConfig>;
    
    // Apply circuit-specific defaults for any missing properties
    return {
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...baseConfig
    };
  }
  
  /**
   * Updates the circuit state based on the current time
   */
  private updateCircuitState(): void {
    const now = Date.now();
    
    // If the circuit is open and the reset timeout has elapsed, transition to half-open
    if (
      this.state === CircuitState.OPEN &&
      now - this.lastStateChangeTimestamp >= this.circuitConfig.resetTimeoutMs
    ) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      this.lastStateChangeTimestamp = now;
    }
  }
  
  /**
   * Opens the circuit
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.lastStateChangeTimestamp = Date.now();
  }
  
  /**
   * Closes the circuit
   */
  private closeCircuit(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChangeTimestamp = Date.now();
  }
}

/**
 * Implements a fixed interval retry strategy with a constant delay between retries
 */
export class FixedIntervalStrategy extends BaseRetryStrategy {
  /**
   * Determines whether to retry an operation with a fixed delay interval
   * @param context The context of the operation
   * @returns A decision on whether to retry and the delay before the next attempt
   */
  public shouldRetry(context: OperationContext): RetryDecision {
    const config = this.getEffectiveConfig(context);
    
    // Check if we've exceeded the maximum number of retries
    if (context.attemptCount >= config.maxRetries) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: `Maximum retry attempts (${config.maxRetries}) exceeded`
      };
    }
    
    // Check if the error is retryable
    if (!this.isRetryableError(context.error, config.retryableErrorTypes)) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: 'Error is not retryable'
      };
    }
    
    // Use a fixed delay with optional jitter
    let delay = config.initialDelayMs;
    delay = this.addJitter(delay);
    
    return {
      shouldRetry: true,
      delayMs: delay,
      reason: 'Retryable error with fixed interval',
      metadata: {
        fixedDelay: config.initialDelayMs,
        attemptCount: context.attemptCount
      }
    };
  }
}

/**
 * Implements a no-retry strategy that never retries operations
 */
export class NoRetryStrategy extends BaseRetryStrategy {
  /**
   * Always decides not to retry operations
   * @param context The context of the operation
   * @returns A decision not to retry
   */
  public shouldRetry(context: OperationContext): RetryDecision {
    return {
      shouldRetry: false,
      delayMs: 0,
      reason: 'No retry strategy configured'
    };
  }
}

/**
 * Factory for creating retry strategies based on error types and operation context
 */
export class RetryStrategyFactory {
  private readonly strategies: Map<string, RetryStrategy> = new Map();
  private readonly defaultStrategy: RetryStrategy;
  
  /**
   * Creates a new instance of RetryStrategyFactory
   * @param defaultStrategy The default retry strategy to use when no specific strategy is found
   */
  constructor(defaultStrategy?: RetryStrategy) {
    this.defaultStrategy = defaultStrategy || new ExponentialBackoffStrategy();
    
    // Register default strategies
    this.registerStrategy('default', this.defaultStrategy);
    this.registerStrategy('exponential', new ExponentialBackoffStrategy());
    this.registerStrategy('circuitBreaker', new CircuitBreakerStrategy());
    this.registerStrategy('fixedInterval', new FixedIntervalStrategy());
    this.registerStrategy('noRetry', new NoRetryStrategy());
  }
  
  /**
   * Registers a retry strategy with a name
   * @param name The name of the strategy
   * @param strategy The retry strategy instance
   */
  public registerStrategy(name: string, strategy: RetryStrategy): void {
    this.strategies.set(name.toLowerCase(), strategy);
  }
  
  /**
   * Gets a retry strategy by name
   * @param name The name of the strategy
   * @returns The retry strategy instance, or the default strategy if not found
   */
  public getStrategy(name: string): RetryStrategy {
    return this.strategies.get(name.toLowerCase()) || this.defaultStrategy;
  }
  
  /**
   * Gets all registered strategy names
   * @returns Array of strategy names
   */
  public getStrategyNames(): string[] {
    return Array.from(this.strategies.keys());
  }
  
  /**
   * Creates a retry strategy from a connection retry configuration
   * @param config The connection retry configuration
   * @returns A configured retry strategy
   */
  public createFromConnectionConfig(config: IConnectionRetryConfig): RetryStrategy {
    return new ExponentialBackoffStrategy({
      maxRetries: config.maxRetries,
      initialDelayMs: config.initialDelayMs,
      maxDelayMs: config.maxDelayMs,
      // Map error types from connection config to database error types
      retryableErrorTypes: this.mapErrorTypes(config.retryableErrors)
    });
  }
  
  /**
   * Creates a retry strategy from a transaction retry configuration
   * @param options The transaction retry options
   * @returns A configured retry strategy
   */
  public createFromTransactionConfig(options: TransactionRetryOptions): RetryStrategy {
    return new ExponentialBackoffStrategy({
      maxRetries: options.maxRetries,
      initialDelayMs: options.baseDelayMs,
      maxDelayMs: options.maxDelayMs,
      retryableErrorTypes: options.retryableErrors
    });
  }
  
  /**
   * Gets the most appropriate retry strategy for an operation context
   * @param context The operation context
   * @returns The most appropriate retry strategy for the context
   */
  public getStrategyForContext(context: OperationContext): RetryStrategy {
    // Use circuit breaker for connection operations
    if (context.operationType === 'connection') {
      return this.getStrategy('circuitBreaker');
    }
    
    // Use exponential backoff for transactions
    if (context.operationType === 'transaction') {
      return this.getStrategy('exponential');
    }
    
    // Use fixed interval for simple queries
    if (context.operationType === 'query') {
      return this.getStrategy('fixedInterval');
    }
    
    // Use exponential backoff for mutations
    if (context.operationType === 'mutation') {
      return this.getStrategy('exponential');
    }
    
    // Default to exponential backoff
    return this.defaultStrategy;
  }
  
  /**
   * Maps error types from connection config to database error types
   * @param errorTypes Array of error types from connection config
   * @returns Array of database error types
   */
  private mapErrorTypes(errorTypes: ErrorType[]): DatabaseErrorType[] {
    const mapping: Record<ErrorType, DatabaseErrorType> = {
      [ErrorType.TRANSIENT]: DatabaseErrorType.TRANSIENT,
      [ErrorType.VALIDATION]: DatabaseErrorType.VALIDATION,
      [ErrorType.BUSINESS]: DatabaseErrorType.DATA_INTEGRITY,
      [ErrorType.TECHNICAL]: DatabaseErrorType.SYSTEM,
      [ErrorType.EXTERNAL]: DatabaseErrorType.EXTERNAL,
      [ErrorType.SECURITY]: DatabaseErrorType.SECURITY,
      [ErrorType.UNKNOWN]: DatabaseErrorType.UNKNOWN
    };
    
    return errorTypes.map(type => mapping[type] || DatabaseErrorType.UNKNOWN);
  }
}

/**
 * Creates a retry context from an error and operation details
 * @param error The error that occurred
 * @param operationType The type of operation
 * @param operationName The name of the operation
 * @param journeyContext The journey context
 * @param attemptCount The number of previous retry attempts
 * @param metadata Additional metadata
 * @returns An operation context for retry decisions
 */
export function createRetryContext(
  error: Error,
  operationType: OperationContext['operationType'],
  operationName: string,
  journeyContext?: string,
  attemptCount: number = 0,
  metadata?: Record<string, any>
): OperationContext {
  const now = Date.now();
  
  return {
    operationType,
    operationName,
    journeyContext,
    attemptCount,
    firstAttemptTimestamp: now - (attemptCount * 1000), // Approximate first attempt time
    lastAttemptTimestamp: now,
    error,
    metadata
  };
}

/**
 * Utility function to execute a function with retry logic
 * @param fn The function to execute
 * @param strategy The retry strategy to use
 * @param operationType The type of operation
 * @param operationName The name of the operation
 * @param journeyContext The journey context
 * @param metadata Additional metadata
 * @returns A promise that resolves with the result of the function
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  strategy: RetryStrategy,
  operationType: OperationContext['operationType'],
  operationName: string,
  journeyContext?: string,
  metadata?: Record<string, any>
): Promise<T> {
  let attemptCount = 0;
  let lastError: Error;
  
  while (true) {
    try {
      // If this is a circuit breaker strategy and it's open, fail fast
      if (strategy instanceof CircuitBreakerStrategy && strategy.getState() === CircuitState.OPEN) {
        throw new Error(`Circuit breaker is open for operation ${operationName}`);
      }
      
      const result = await fn();
      
      // Record success if using circuit breaker
      if (strategy instanceof CircuitBreakerStrategy) {
        strategy.recordSuccess();
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Create retry context
      const context = createRetryContext(
        lastError,
        operationType,
        operationName,
        journeyContext,
        attemptCount,
        metadata
      );
      
      // Get retry decision
      const decision = strategy.shouldRetry(context);
      
      // If we shouldn't retry, rethrow the error
      if (!decision.shouldRetry) {
        throw lastError;
      }
      
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, decision.delayMs));
      
      // Increment attempt count
      attemptCount++;
    }
  }
}

// Export all retry strategies and utilities
export default {
  RetryStrategyFactory,
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  FixedIntervalStrategy,
  NoRetryStrategy,
  executeWithRetry,
  createRetryContext
};