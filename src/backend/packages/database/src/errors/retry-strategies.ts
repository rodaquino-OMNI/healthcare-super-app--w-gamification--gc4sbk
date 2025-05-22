/**
 * @file retry-strategies.ts
 * @description Implements configurable retry strategies for transient database errors,
 * including exponential backoff, jitter, circuit breaker, and custom retry policies.
 */

import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';

/**
 * Enum representing different types of database operations
 * Used to provide context for retry decisions
 */
export enum DatabaseOperationType {
  READ = 'READ',
  WRITE = 'WRITE',
  TRANSACTION = 'TRANSACTION',
  CONNECTION = 'CONNECTION',
  MIGRATION = 'MIGRATION',
}

/**
 * Enum representing different journey contexts
 * Used to customize retry behavior based on journey requirements
 */
export enum JourneyContext {
  HEALTH = 'HEALTH',
  CARE = 'CARE',
  PLAN = 'PLAN',
  GAMIFICATION = 'GAMIFICATION',
  NOTIFICATION = 'NOTIFICATION',
  AUTH = 'AUTH',
  SYSTEM = 'SYSTEM',
}

/**
 * Interface representing the context of a database operation
 * Provides information for making intelligent retry decisions
 */
export interface RetryContext {
  /** The type of database operation being performed */
  operationType: DatabaseOperationType;
  
  /** The journey context in which the operation is being performed */
  journeyContext?: JourneyContext;
  
  /** The number of previous retry attempts */
  attemptsMade: number;
  
  /** The error that triggered the retry */
  error: Error;
  
  /** The time when the first attempt was made */
  firstAttemptTime: Date;
  
  /** Optional metadata for additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for retry strategies
 * All retry strategies must implement this interface
 */
export interface RetryStrategy {
  /**
   * Determines if a retry should be attempted based on the context
   * @param context The retry context
   * @returns True if a retry should be attempted, false otherwise
   */
  shouldRetry(context: RetryContext): boolean;
  
  /**
   * Calculates the delay before the next retry attempt
   * @param context The retry context
   * @returns The delay in milliseconds before the next retry
   */
  getNextRetryDelay(context: RetryContext): number;
  
  /**
   * Gets the name of the strategy for logging and monitoring
   * @returns The name of the strategy
   */
  getName(): string;
}

/**
 * Configuration for the exponential backoff strategy
 */
export interface ExponentialBackoffConfig {
  /** Base delay in milliseconds */
  baseDelayMs: number;
  
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Jitter factor (0-1) to add randomness to delays */
  jitterFactor?: number;
  
  /** Operation-specific configuration overrides */
  operationTypeOverrides?: Partial<Record<DatabaseOperationType, Partial<ExponentialBackoffConfig>>>;
  
  /** Journey-specific configuration overrides */
  journeyContextOverrides?: Partial<Record<JourneyContext, Partial<ExponentialBackoffConfig>>>;
}

/**
 * Implementation of exponential backoff retry strategy with jitter
 */
@Injectable()
export class ExponentialBackoffStrategy implements RetryStrategy {
  private readonly logger = new Logger(ExponentialBackoffStrategy.name);
  private readonly defaultConfig: ExponentialBackoffConfig = {
    baseDelayMs: 100,
    maxDelayMs: 10000,
    maxAttempts: 3,
    jitterFactor: 0.2,
  };

  constructor(private config: ExponentialBackoffConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.logger.log(`Initialized with config: ${JSON.stringify(this.config)}`);
  }

  /**
   * Gets the effective configuration for a specific retry context
   * Applies operation and journey specific overrides if available
   */
  private getEffectiveConfig(context: RetryContext): ExponentialBackoffConfig {
    let effectiveConfig = { ...this.config };
    
    // Apply operation type overrides if available
    const operationOverrides = this.config.operationTypeOverrides?.[context.operationType];
    if (operationOverrides) {
      effectiveConfig = { ...effectiveConfig, ...operationOverrides };
    }
    
    // Apply journey context overrides if available
    if (context.journeyContext && this.config.journeyContextOverrides?.[context.journeyContext]) {
      const journeyOverrides = this.config.journeyContextOverrides[context.journeyContext];
      effectiveConfig = { ...effectiveConfig, ...journeyOverrides };
    }
    
    return effectiveConfig;
  }

  /**
   * Determines if a retry should be attempted based on the context
   * @param context The retry context
   * @returns True if a retry should be attempted, false otherwise
   */
  public shouldRetry(context: RetryContext): boolean {
    const effectiveConfig = this.getEffectiveConfig(context);
    
    // Don't retry if we've reached the maximum number of attempts
    if (context.attemptsMade >= effectiveConfig.maxAttempts) {
      this.logger.debug(
        `Not retrying operation: max attempts (${effectiveConfig.maxAttempts}) reached`,
        { context }
      );
      return false;
    }
    
    // Check if the error is retryable based on its type
    // This could be extended with more sophisticated error analysis
    const isRetryableError = this.isRetryableError(context.error);
    if (!isRetryableError) {
      this.logger.debug('Not retrying operation: non-retryable error', { 
        error: context.error.message,
        errorType: context.error.constructor.name 
      });
      return false;
    }
    
    return true;
  }

  /**
   * Calculates the delay before the next retry attempt using exponential backoff with jitter
   * @param context The retry context
   * @returns The delay in milliseconds before the next retry
   */
  public getNextRetryDelay(context: RetryContext): number {
    const effectiveConfig = this.getEffectiveConfig(context);
    
    // Calculate exponential backoff: baseDelay * 2^attemptsMade
    const exponentialDelay = effectiveConfig.baseDelayMs * Math.pow(2, context.attemptsMade);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, effectiveConfig.maxDelayMs);
    
    // Apply jitter if configured
    if (effectiveConfig.jitterFactor && effectiveConfig.jitterFactor > 0) {
      const jitterRange = cappedDelay * effectiveConfig.jitterFactor;
      const jitter = Math.random() * jitterRange - (jitterRange / 2);
      return Math.max(0, Math.floor(cappedDelay + jitter));
    }
    
    return Math.floor(cappedDelay);
  }

  /**
   * Determines if an error is retryable based on its type and properties
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: Error): boolean {
    // Check for common transient error patterns
    const errorMessage = error.message.toLowerCase();
    
    // Connection-related errors are typically retryable
    if (
      errorMessage.includes('connection') && 
      (errorMessage.includes('timeout') || 
       errorMessage.includes('closed') || 
       errorMessage.includes('reset') || 
       errorMessage.includes('refused'))
    ) {
      return true;
    }
    
    // Deadlock and lock timeout errors are retryable
    if (
      errorMessage.includes('deadlock') || 
      errorMessage.includes('lock timeout') ||
      errorMessage.includes('serialization failure')
    ) {
      return true;
    }
    
    // Rate limiting or too many connections errors
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many connections') ||
      errorMessage.includes('connection limit')
    ) {
      return true;
    }
    
    // Check for Prisma-specific retryable errors
    if (
      error.constructor.name === 'PrismaClientInitializationError' ||
      error.constructor.name === 'PrismaClientRustPanicError' ||
      error.constructor.name === 'PrismaClientKnownRequestError' && 
      (error as any).code?.startsWith('P1')
    ) {
      return true;
    }
    
    return false;
  }

  /**
   * Gets the name of the strategy for logging and monitoring
   * @returns The name of the strategy
   */
  public getName(): string {
    return 'ExponentialBackoffStrategy';
  }
}

/**
 * Configuration for the circuit breaker strategy
 */
export interface CircuitBreakerConfig {
  /** The number of failures required to open the circuit */
  failureThreshold: number;
  
  /** The time window in milliseconds to track failures */
  failureWindowMs: number;
  
  /** The time in milliseconds that the circuit remains open before moving to half-open */
  resetTimeoutMs: number;
  
  /** The number of successful operations required to close the circuit when half-open */
  successThreshold: number;
  
  /** Operation-specific configuration overrides */
  operationTypeOverrides?: Partial<Record<DatabaseOperationType, Partial<CircuitBreakerConfig>>>;
  
  /** Journey-specific configuration overrides */
  journeyContextOverrides?: Partial<Record<JourneyContext, Partial<CircuitBreakerConfig>>>;
}

/**
 * Enum representing the state of the circuit breaker
 */
enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation, requests pass through
  OPEN = 'OPEN',           // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if the circuit can be closed
}

/**
 * Implementation of the circuit breaker pattern to prevent cascading failures
 */
@Injectable()
export class CircuitBreakerStrategy implements RetryStrategy {
  private readonly logger = new Logger(CircuitBreakerStrategy.name);
  private readonly defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    failureWindowMs: 60000, // 1 minute
    resetTimeoutMs: 30000,  // 30 seconds
    successThreshold: 2,
  };
  
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private openTime: number = 0;
  private successCount: number = 0;
  
  // Track circuit breaker state per operation type and journey context
  private readonly circuitStates: Record<string, {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    openTime: number;
    successCount: number;
  }> = {};

  constructor(private config: CircuitBreakerConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.logger.log(`Initialized with config: ${JSON.stringify(this.config)}`);
  }

  /**
   * Gets the effective configuration for a specific retry context
   * Applies operation and journey specific overrides if available
   */
  private getEffectiveConfig(context: RetryContext): CircuitBreakerConfig {
    let effectiveConfig = { ...this.config };
    
    // Apply operation type overrides if available
    const operationOverrides = this.config.operationTypeOverrides?.[context.operationType];
    if (operationOverrides) {
      effectiveConfig = { ...effectiveConfig, ...operationOverrides };
    }
    
    // Apply journey context overrides if available
    if (context.journeyContext && this.config.journeyContextOverrides?.[context.journeyContext]) {
      const journeyOverrides = this.config.journeyContextOverrides[context.journeyContext];
      effectiveConfig = { ...effectiveConfig, ...journeyOverrides };
    }
    
    return effectiveConfig;
  }

  /**
   * Gets the circuit key for the given context
   * This allows for separate circuit breakers per operation type and journey
   */
  private getCircuitKey(context: RetryContext): string {
    return `${context.operationType}:${context.journeyContext || 'UNKNOWN'}`;
  }

  /**
   * Gets or creates the circuit state for the given context
   */
  private getCircuitState(context: RetryContext): {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    openTime: number;
    successCount: number;
  } {
    const key = this.getCircuitKey(context);
    if (!this.circuitStates[key]) {
      this.circuitStates[key] = {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailureTime: 0,
        openTime: 0,
        successCount: 0,
      };
    }
    return this.circuitStates[key];
  }

  /**
   * Records a successful operation for the given context
   */
  public recordSuccess(context: RetryContext): void {
    const circuitState = this.getCircuitState(context);
    const effectiveConfig = this.getEffectiveConfig(context);
    
    if (circuitState.state === CircuitState.HALF_OPEN) {
      circuitState.successCount++;
      
      if (circuitState.successCount >= effectiveConfig.successThreshold) {
        circuitState.state = CircuitState.CLOSED;
        circuitState.failures = 0;
        circuitState.successCount = 0;
        this.logger.log(
          `Circuit closed for ${this.getCircuitKey(context)} after ${effectiveConfig.successThreshold} successful operations`
        );
      }
    } else if (circuitState.state === CircuitState.CLOSED) {
      // Reset failure count after a successful operation
      const now = Date.now();
      if (now - circuitState.lastFailureTime > effectiveConfig.failureWindowMs) {
        circuitState.failures = 0;
      }
    }
  }

  /**
   * Records a failed operation for the given context
   */
  public recordFailure(context: RetryContext): void {
    const circuitState = this.getCircuitState(context);
    const effectiveConfig = this.getEffectiveConfig(context);
    const now = Date.now();
    
    if (circuitState.state === CircuitState.CLOSED) {
      // Clean up old failures outside the window
      if (now - circuitState.lastFailureTime > effectiveConfig.failureWindowMs) {
        circuitState.failures = 0;
      }
      
      circuitState.failures++;
      circuitState.lastFailureTime = now;
      
      if (circuitState.failures >= effectiveConfig.failureThreshold) {
        circuitState.state = CircuitState.OPEN;
        circuitState.openTime = now;
        this.logger.warn(
          `Circuit opened for ${this.getCircuitKey(context)} after ${circuitState.failures} failures`
        );
      }
    } else if (circuitState.state === CircuitState.HALF_OPEN) {
      circuitState.state = CircuitState.OPEN;
      circuitState.openTime = now;
      circuitState.successCount = 0;
      this.logger.warn(
        `Circuit re-opened for ${this.getCircuitKey(context)} after failure in half-open state`
      );
    }
  }

  /**
   * Determines if a retry should be attempted based on the circuit state
   * @param context The retry context
   * @returns True if a retry should be attempted, false otherwise
   */
  public shouldRetry(context: RetryContext): boolean {
    const circuitState = this.getCircuitState(context);
    const effectiveConfig = this.getEffectiveConfig(context);
    const now = Date.now();
    
    // Check if the circuit is open
    if (circuitState.state === CircuitState.OPEN) {
      // Check if it's time to transition to half-open
      if (now - circuitState.openTime >= effectiveConfig.resetTimeoutMs) {
        circuitState.state = CircuitState.HALF_OPEN;
        circuitState.successCount = 0;
        this.logger.log(
          `Circuit half-opened for ${this.getCircuitKey(context)} after ${effectiveConfig.resetTimeoutMs}ms`
        );
        return true;
      }
      
      this.logger.debug(
        `Not retrying operation: circuit is open for ${this.getCircuitKey(context)}`,
        { context }
      );
      return false;
    }
    
    // In half-open state, we allow a limited number of retries
    if (circuitState.state === CircuitState.HALF_OPEN) {
      // Only allow one request at a time in half-open state
      if (circuitState.successCount > 0) {
        this.logger.debug(
          `Not retrying operation: circuit is half-open and already testing for ${this.getCircuitKey(context)}`,
          { context }
        );
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculates the delay before the next retry attempt
   * For circuit breaker, this is typically a fixed delay
   * @param context The retry context
   * @returns The delay in milliseconds before the next retry
   */
  public getNextRetryDelay(context: RetryContext): number {
    const circuitState = this.getCircuitState(context);
    
    // If the circuit is half-open, use a small delay
    if (circuitState.state === CircuitState.HALF_OPEN) {
      return 100; // Small delay for half-open state
    }
    
    // For closed circuit, use a fixed delay
    return 1000; // 1 second default delay
  }

  /**
   * Gets the name of the strategy for logging and monitoring
   * @returns The name of the strategy
   */
  public getName(): string {
    return 'CircuitBreakerStrategy';
  }
}

/**
 * Configuration for the composite retry strategy
 */
export interface CompositeRetryConfig {
  /** List of retry strategies to use */
  strategies: RetryStrategy[];
  
  /** Whether all strategies must agree to retry (AND) or any strategy (OR) */
  requireAllStrategies?: boolean;
}

/**
 * Implementation of a composite retry strategy that combines multiple strategies
 */
@Injectable()
export class CompositeRetryStrategy implements RetryStrategy {
  private readonly logger = new Logger(CompositeRetryStrategy.name);
  private readonly requireAllStrategies: boolean;

  constructor(private readonly strategies: RetryStrategy[], requireAllStrategies = false) {
    this.requireAllStrategies = requireAllStrategies;
    this.logger.log(
      `Initialized with ${strategies.length} strategies, requireAllStrategies=${requireAllStrategies}`
    );
  }

  /**
   * Determines if a retry should be attempted based on all included strategies
   * @param context The retry context
   * @returns True if a retry should be attempted, false otherwise
   */
  public shouldRetry(context: RetryContext): boolean {
    if (this.strategies.length === 0) {
      return false;
    }
    
    if (this.requireAllStrategies) {
      // All strategies must agree to retry (AND)
      return this.strategies.every(strategy => strategy.shouldRetry(context));
    } else {
      // Any strategy can trigger a retry (OR)
      return this.strategies.some(strategy => strategy.shouldRetry(context));
    }
  }

  /**
   * Calculates the delay before the next retry attempt
   * Uses the maximum delay from all strategies
   * @param context The retry context
   * @returns The delay in milliseconds before the next retry
   */
  public getNextRetryDelay(context: RetryContext): number {
    if (this.strategies.length === 0) {
      return 1000; // Default delay if no strategies
    }
    
    // Use the maximum delay from all strategies
    const delays = this.strategies.map(strategy => strategy.getNextRetryDelay(context));
    return Math.max(...delays);
  }

  /**
   * Gets the name of the strategy for logging and monitoring
   * @returns The name of the strategy
   */
  public getName(): string {
    const strategyNames = this.strategies.map(s => s.getName()).join(', ');
    return `CompositeRetryStrategy(${strategyNames})`;
  }
}

/**
 * Factory for creating retry strategies based on error type and context
 */
@Injectable()
export class RetryStrategyFactory {
  private readonly logger = new Logger(RetryStrategyFactory.name);
  
  // Default strategies for different operation types
  private readonly defaultStrategies: Record<DatabaseOperationType, RetryStrategy> = {
    [DatabaseOperationType.READ]: new ExponentialBackoffStrategy({
      baseDelayMs: 50,
      maxDelayMs: 2000,
      maxAttempts: 3,
    }),
    [DatabaseOperationType.WRITE]: new ExponentialBackoffStrategy({
      baseDelayMs: 100,
      maxDelayMs: 5000,
      maxAttempts: 3,
    }),
    [DatabaseOperationType.TRANSACTION]: new ExponentialBackoffStrategy({
      baseDelayMs: 200,
      maxDelayMs: 10000,
      maxAttempts: 5,
    }),
    [DatabaseOperationType.CONNECTION]: new CompositeRetryStrategy([
      new ExponentialBackoffStrategy({
        baseDelayMs: 500,
        maxDelayMs: 30000,
        maxAttempts: 10,
      }),
      new CircuitBreakerStrategy({
        failureThreshold: 3,
        failureWindowMs: 30000,
        resetTimeoutMs: 60000,
        successThreshold: 2,
      }),
    ]),
    [DatabaseOperationType.MIGRATION]: new ExponentialBackoffStrategy({
      baseDelayMs: 1000,
      maxDelayMs: 60000,
      maxAttempts: 10,
    }),
  };
  
  // Journey-specific strategy overrides
  private readonly journeyStrategies: Partial<Record<JourneyContext, Partial<Record<DatabaseOperationType, RetryStrategy>>>> = {
    [JourneyContext.HEALTH]: {
      [DatabaseOperationType.READ]: new ExponentialBackoffStrategy({
        baseDelayMs: 50,
        maxDelayMs: 1000,
        maxAttempts: 2, // Health data reads need to be fast
      }),
    },
    [JourneyContext.CARE]: {
      [DatabaseOperationType.WRITE]: new ExponentialBackoffStrategy({
        baseDelayMs: 100,
        maxDelayMs: 3000,
        maxAttempts: 5, // Care data writes need more reliability
      }),
    },
    [JourneyContext.GAMIFICATION]: {
      [DatabaseOperationType.TRANSACTION]: new CompositeRetryStrategy([
        new ExponentialBackoffStrategy({
          baseDelayMs: 200,
          maxDelayMs: 5000,
          maxAttempts: 5,
        }),
        new CircuitBreakerStrategy({
          failureThreshold: 10, // Gamification can tolerate more failures
          failureWindowMs: 60000,
          resetTimeoutMs: 30000,
          successThreshold: 3,
        }),
      ]),
    },
  };

  constructor() {
    this.logger.log('RetryStrategyFactory initialized');
  }

  /**
   * Creates a retry strategy based on the operation context
   * @param context The retry context
   * @returns The appropriate retry strategy
   */
  public createStrategy(context: RetryContext): RetryStrategy {
    // Check for journey-specific strategy
    if (context.journeyContext && 
        this.journeyStrategies[context.journeyContext] && 
        this.journeyStrategies[context.journeyContext][context.operationType]) {
      const strategy = this.journeyStrategies[context.journeyContext][context.operationType];
      this.logger.debug(
        `Using journey-specific strategy ${strategy.getName()} for ${context.journeyContext}/${context.operationType}`
      );
      return strategy;
    }
    
    // Fall back to default strategy for the operation type
    const defaultStrategy = this.defaultStrategies[context.operationType];
    this.logger.debug(
      `Using default strategy ${defaultStrategy.getName()} for ${context.operationType}`
    );
    return defaultStrategy;
  }

  /**
   * Records a successful operation for circuit breaker strategies
   * @param context The retry context
   */
  public recordSuccess(context: RetryContext): void {
    const strategy = this.createStrategy(context);
    
    // If it's a circuit breaker or composite strategy, record success
    if (strategy instanceof CircuitBreakerStrategy) {
      strategy.recordSuccess(context);
    } else if (strategy instanceof CompositeRetryStrategy) {
      // Record success for any circuit breaker strategies in the composite
      const strategies = (strategy as any).strategies;
      if (Array.isArray(strategies)) {
        strategies.forEach(s => {
          if (s instanceof CircuitBreakerStrategy) {
            s.recordSuccess(context);
          }
        });
      }
    }
  }

  /**
   * Records a failed operation for circuit breaker strategies
   * @param context The retry context
   */
  public recordFailure(context: RetryContext): void {
    const strategy = this.createStrategy(context);
    
    // If it's a circuit breaker or composite strategy, record failure
    if (strategy instanceof CircuitBreakerStrategy) {
      strategy.recordFailure(context);
    } else if (strategy instanceof CompositeRetryStrategy) {
      // Record failure for any circuit breaker strategies in the composite
      const strategies = (strategy as any).strategies;
      if (Array.isArray(strategies)) {
        strategies.forEach(s => {
          if (s instanceof CircuitBreakerStrategy) {
            s.recordFailure(context);
          }
        });
      }
    }
  }
}