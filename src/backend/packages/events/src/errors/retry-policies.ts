/**
 * Configurable retry policies for event processing failures
 * 
 * This module provides various retry strategies for handling event processing failures,
 * including exponential backoff, constant interval, and custom strategies. Each policy
 * determines retry behavior based on error type, event context, and failure count.
 * 
 * @packageDocumentation
 */

import { EventProcessingError } from './event-errors';
import { isRetryableError } from '../constants/errors.constants';
import { DEFAULT_RETRY } from '../constants/config.constants';

/**
 * Enum representing the status of a retry operation
 */
export enum RetryStatus {
  /** Retry is pending and scheduled for execution */
  PENDING = 'PENDING',
  /** Retry is currently in progress */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Retry succeeded */
  SUCCEEDED = 'SUCCEEDED',
  /** Retry failed but can be retried again */
  FAILED = 'FAILED',
  /** Retry failed and maximum retries exhausted */
  EXHAUSTED = 'EXHAUSTED'
}

/**
 * Interface for retry context containing information about the current retry attempt
 */
export interface RetryContext {
  /** The error that caused the retry */
  error: Error;
  /** The number of retry attempts so far */
  retryCount: number;
  /** The maximum number of retries allowed */
  maxRetries: number;
  /** The event type being processed */
  eventType: string;
  /** The source service or journey that originated the event */
  source?: string;
  /** Additional context for the retry */
  metadata?: Record<string, any>;
}

/**
 * Base interface for retry policy options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether to add jitter to retry delays */
  useJitter?: boolean;
  /** Jitter factor (0-1) to randomize delay */
  jitterFactor?: number;
}

/**
 * Options for fixed interval retry policy
 */
export interface FixedIntervalRetryOptions extends RetryOptions {
  /** Fixed delay between retry attempts in milliseconds */
  intervalMs: number;
}

/**
 * Options for exponential backoff retry policy
 */
export interface ExponentialBackoffRetryOptions extends RetryOptions {
  /** Initial delay for first retry in milliseconds */
  initialDelayMs: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  /** Backoff factor (multiplier) for exponential increase */
  backoffFactor: number;
}

/**
 * Options for linear backoff retry policy
 */
export interface LinearBackoffRetryOptions extends RetryOptions {
  /** Initial delay for first retry in milliseconds */
  initialDelayMs: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  /** Increment amount in milliseconds for each retry */
  incrementMs: number;
}

/**
 * Interface for journey-specific retry configurations
 */
export interface JourneyRetryConfig {
  /** Health journey retry configuration */
  health?: RetryOptions;
  /** Care journey retry configuration */
  care?: RetryOptions;
  /** Plan journey retry configuration */
  plan?: RetryOptions;
  /** Gamification retry configuration */
  gamification?: RetryOptions;
  /** Notification retry configuration */
  notification?: RetryOptions;
  /** Default retry configuration for other journeys */
  default: RetryOptions;
}

/**
 * Interface for error-specific retry configurations
 */
export interface ErrorTypeRetryConfig {
  /** Retry configuration for network errors */
  network?: RetryOptions;
  /** Retry configuration for database errors */
  database?: RetryOptions;
  /** Retry configuration for validation errors */
  validation?: RetryOptions;
  /** Retry configuration for timeout errors */
  timeout?: RetryOptions;
  /** Retry configuration for rate limit errors */
  rateLimit?: RetryOptions;
  /** Retry configuration for dependency errors */
  dependency?: RetryOptions;
  /** Default retry configuration for other error types */
  default: RetryOptions;
}

/**
 * Interface that all retry policies must implement
 */
export interface IRetryPolicy {
  /**
   * Calculate the next retry time based on the retry context
   * @param context The retry context
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateNextRetryDelay(context: RetryContext): number;

  /**
   * Determine if a retry should be attempted based on the retry context
   * @param context The retry context
   * @returns True if retry should be attempted, false otherwise
   */
  shouldRetry(context: RetryContext): boolean;

  /**
   * Get the name of the retry policy
   * @returns The name of the retry policy
   */
  getName(): string;
}

/**
 * Base class for all retry policies
 */
export abstract class BaseRetryPolicy implements IRetryPolicy {
  protected maxRetries: number;
  protected useJitter: boolean;
  protected jitterFactor: number;

  /**
   * Create a new base retry policy
   * @param options Retry policy options
   */
  constructor(options?: RetryOptions) {
    this.maxRetries = options?.maxRetries ?? DEFAULT_RETRY.MAX_RETRIES;
    this.useJitter = options?.useJitter ?? true;
    this.jitterFactor = options?.jitterFactor ?? DEFAULT_RETRY.JITTER_FACTOR;
  }

  /**
   * Calculate the next retry time based on the retry context
   * @param context The retry context
   * @returns The delay in milliseconds until the next retry attempt
   */
  abstract calculateNextRetryDelay(context: RetryContext): number;

  /**
   * Get the name of the retry policy
   * @returns The name of the retry policy
   */
  abstract getName(): string;

  /**
   * Determine if a retry should be attempted based on the retry context
   * @param context The retry context
   * @returns True if retry should be attempted, false otherwise
   */
  shouldRetry(context: RetryContext): boolean {
    // Check if maximum retries exceeded
    if (context.retryCount >= this.maxRetries) {
      return false;
    }

    // Check if error is retryable
    if (context.error instanceof EventProcessingError) {
      return isRetryableError(context.error.code);
    }

    // Default to retryable for non-EventProcessingError errors
    // This allows system errors to be retried
    return true;
  }

  /**
   * Apply jitter to a delay value to prevent thundering herd problem
   * @param delay The base delay in milliseconds
   * @returns The delay with jitter applied
   */
  protected applyJitter(delay: number): number {
    if (!this.useJitter) {
      return delay;
    }

    // Apply jitter by randomizing the delay within a range
    // determined by the jitter factor
    const jitterRange = delay * this.jitterFactor;
    return delay - (jitterRange / 2) + (Math.random() * jitterRange);
  }
}

/**
 * Retry policy with fixed interval between retry attempts
 */
export class FixedIntervalRetryPolicy extends BaseRetryPolicy {
  private intervalMs: number;

  /**
   * Create a new fixed interval retry policy
   * @param options Fixed interval retry policy options
   */
  constructor(options: FixedIntervalRetryOptions) {
    super(options);
    this.intervalMs = options.intervalMs;
  }

  /**
   * Calculate the next retry time based on the retry context
   * @param context The retry context
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateNextRetryDelay(context: RetryContext): number {
    return this.applyJitter(this.intervalMs);
  }

  /**
   * Get the name of the retry policy
   * @returns The name of the retry policy
   */
  getName(): string {
    return 'FixedIntervalRetryPolicy';
  }
}

/**
 * Retry policy with exponentially increasing delays between retry attempts
 */
export class ExponentialBackoffRetryPolicy extends BaseRetryPolicy {
  private initialDelayMs: number;
  private maxDelayMs: number;
  private backoffFactor: number;

  /**
   * Create a new exponential backoff retry policy
   * @param options Exponential backoff retry policy options
   */
  constructor(options: ExponentialBackoffRetryOptions) {
    super(options);
    this.initialDelayMs = options.initialDelayMs;
    this.maxDelayMs = options.maxDelayMs;
    this.backoffFactor = options.backoffFactor;
  }

  /**
   * Calculate the next retry time based on the retry context
   * @param context The retry context
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateNextRetryDelay(context: RetryContext): number {
    // Calculate exponential backoff: initialDelay * (backoffFactor ^ retryCount)
    const exponentialDelay = this.initialDelayMs * Math.pow(this.backoffFactor, context.retryCount);
    
    // Cap the delay at the maximum delay
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    
    // Apply jitter to prevent thundering herd problem
    return this.applyJitter(cappedDelay);
  }

  /**
   * Get the name of the retry policy
   * @returns The name of the retry policy
   */
  getName(): string {
    return 'ExponentialBackoffRetryPolicy';
  }
}

/**
 * Retry policy with linearly increasing delays between retry attempts
 */
export class LinearBackoffRetryPolicy extends BaseRetryPolicy {
  private initialDelayMs: number;
  private maxDelayMs: number;
  private incrementMs: number;

  /**
   * Create a new linear backoff retry policy
   * @param options Linear backoff retry policy options
   */
  constructor(options: LinearBackoffRetryOptions) {
    super(options);
    this.initialDelayMs = options.initialDelayMs;
    this.maxDelayMs = options.maxDelayMs;
    this.incrementMs = options.incrementMs;
  }

  /**
   * Calculate the next retry time based on the retry context
   * @param context The retry context
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateNextRetryDelay(context: RetryContext): number {
    // Calculate linear backoff: initialDelay + (increment * retryCount)
    const linearDelay = this.initialDelayMs + (this.incrementMs * context.retryCount);
    
    // Cap the delay at the maximum delay
    const cappedDelay = Math.min(linearDelay, this.maxDelayMs);
    
    // Apply jitter to prevent thundering herd problem
    return this.applyJitter(cappedDelay);
  }

  /**
   * Get the name of the retry policy
   * @returns The name of the retry policy
   */
  getName(): string {
    return 'LinearBackoffRetryPolicy';
  }
}

/**
 * Composite retry policy that combines multiple retry policies
 */
export class CompositeRetryPolicy implements IRetryPolicy {
  private policies: Map<string, IRetryPolicy>;
  private defaultPolicy: IRetryPolicy;

  /**
   * Create a new composite retry policy
   * @param defaultPolicy Default policy to use when no specific policy matches
   */
  constructor(defaultPolicy: IRetryPolicy) {
    this.policies = new Map<string, IRetryPolicy>();
    this.defaultPolicy = defaultPolicy;
  }

  /**
   * Add a policy for a specific error type
   * @param errorType Error type to associate with the policy
   * @param policy Retry policy to use for the error type
   * @returns This composite policy instance for chaining
   */
  addPolicyForErrorType(errorType: string, policy: IRetryPolicy): CompositeRetryPolicy {
    this.policies.set(errorType, policy);
    return this;
  }

  /**
   * Calculate the next retry time based on the retry context
   * @param context The retry context
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateNextRetryDelay(context: RetryContext): number {
    const policy = this.getPolicyForError(context.error);
    return policy.calculateNextRetryDelay(context);
  }

  /**
   * Determine if a retry should be attempted based on the retry context
   * @param context The retry context
   * @returns True if retry should be attempted, false otherwise
   */
  shouldRetry(context: RetryContext): boolean {
    const policy = this.getPolicyForError(context.error);
    return policy.shouldRetry(context);
  }

  /**
   * Get the name of the retry policy
   * @returns The name of the retry policy
   */
  getName(): string {
    return 'CompositeRetryPolicy';
  }

  /**
   * Get the appropriate policy for an error
   * @param error The error to get a policy for
   * @returns The retry policy to use for the error
   */
  private getPolicyForError(error: Error): IRetryPolicy {
    if (error instanceof EventProcessingError) {
      // Try to find a policy for this specific error code
      const policy = this.policies.get(error.code);
      if (policy) {
        return policy;
      }

      // Try to find a policy for the error category
      // Extract category from error code (e.g., EVENT_PROD_* -> PROD)
      const category = this.getErrorCategory(error.code);
      if (category) {
        const categoryPolicy = this.policies.get(category);
        if (categoryPolicy) {
          return categoryPolicy;
        }
      }
    }

    // Fall back to default policy if no specific policy found
    return this.defaultPolicy;
  }

  /**
   * Extract the error category from an error code
   * @param errorCode The error code to extract category from
   * @returns The error category or undefined if not found
   */
  private getErrorCategory(errorCode: string): string | undefined {
    // Error codes follow pattern: EVENT_CATEGORY_SPECIFIC
    const parts = errorCode.split('_');
    if (parts.length >= 2) {
      return parts[1]; // Return the category part (e.g., PROD, CONS, SCHEMA)
    }
    return undefined;
  }
}

/**
 * Factory for creating retry policies based on error types
 */
export class RetryPolicyFactory {
  /**
   * Create a default exponential backoff retry policy
   * @param options Optional configuration to override defaults
   * @returns An exponential backoff retry policy
   */
  static createDefaultPolicy(options?: Partial<ExponentialBackoffRetryOptions>): IRetryPolicy {
    return new ExponentialBackoffRetryPolicy({
      initialDelayMs: options?.initialDelayMs ?? DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS,
      maxDelayMs: options?.maxDelayMs ?? DEFAULT_RETRY.MAX_RETRY_DELAY_MS,
      backoffFactor: options?.backoffFactor ?? DEFAULT_RETRY.BACKOFF_FACTOR,
      maxRetries: options?.maxRetries ?? DEFAULT_RETRY.MAX_RETRIES,
      useJitter: options?.useJitter ?? true,
      jitterFactor: options?.jitterFactor ?? DEFAULT_RETRY.JITTER_FACTOR
    });
  }

  /**
   * Create a fixed interval retry policy
   * @param options Optional configuration to override defaults
   * @returns A fixed interval retry policy
   */
  static createFixedIntervalPolicy(options?: Partial<FixedIntervalRetryOptions>): IRetryPolicy {
    return new FixedIntervalRetryPolicy({
      intervalMs: options?.intervalMs ?? DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS,
      maxRetries: options?.maxRetries ?? DEFAULT_RETRY.MAX_RETRIES,
      useJitter: options?.useJitter ?? true,
      jitterFactor: options?.jitterFactor ?? DEFAULT_RETRY.JITTER_FACTOR
    });
  }

  /**
   * Create a linear backoff retry policy
   * @param options Optional configuration to override defaults
   * @returns A linear backoff retry policy
   */
  static createLinearBackoffPolicy(options?: Partial<LinearBackoffRetryOptions>): IRetryPolicy {
    return new LinearBackoffRetryPolicy({
      initialDelayMs: options?.initialDelayMs ?? DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS,
      maxDelayMs: options?.maxDelayMs ?? DEFAULT_RETRY.MAX_RETRY_DELAY_MS,
      incrementMs: options?.incrementMs ?? DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS,
      maxRetries: options?.maxRetries ?? DEFAULT_RETRY.MAX_RETRIES,
      useJitter: options?.useJitter ?? true,
      jitterFactor: options?.jitterFactor ?? DEFAULT_RETRY.JITTER_FACTOR
    });
  }

  /**
   * Create a composite policy with specialized handling for different error types
   * @param config Configuration for different error types
   * @returns A composite retry policy
   */
  static createErrorTypePolicy(config: ErrorTypeRetryConfig): IRetryPolicy {
    // Create default policy
    const defaultPolicy = RetryPolicyFactory.createDefaultPolicy(config.default);
    
    // Create composite policy with default
    const compositePolicy = new CompositeRetryPolicy(defaultPolicy);
    
    // Add specialized policies for different error types
    if (config.network) {
      const networkPolicy = RetryPolicyFactory.createExponentialBackoffPolicy({
        initialDelayMs: 200,
        maxDelayMs: 10000,
        backoffFactor: 2,
        ...config.network
      });
      compositePolicy.addPolicyForErrorType('NETWORK', networkPolicy);
      compositePolicy.addPolicyForErrorType('EVENT_DELIV_NETWORK_FAILURE', networkPolicy);
    }
    
    if (config.database) {
      const databasePolicy = RetryPolicyFactory.createExponentialBackoffPolicy({
        initialDelayMs: 500,
        maxDelayMs: 15000,
        backoffFactor: 1.5,
        ...config.database
      });
      compositePolicy.addPolicyForErrorType('DATABASE', databasePolicy);
      compositePolicy.addPolicyForErrorType('EVENT_DATABASE_ERROR', databasePolicy);
    }
    
    if (config.timeout) {
      const timeoutPolicy = RetryPolicyFactory.createExponentialBackoffPolicy({
        initialDelayMs: 1000,
        maxDelayMs: 20000,
        backoffFactor: 2,
        ...config.timeout
      });
      compositePolicy.addPolicyForErrorType('TIMEOUT', timeoutPolicy);
      compositePolicy.addPolicyForErrorType('EVENT_TIMEOUT_ERROR', timeoutPolicy);
      compositePolicy.addPolicyForErrorType('EVENT_CONS_PROCESSING_TIMEOUT', timeoutPolicy);
    }
    
    if (config.rateLimit) {
      const rateLimitPolicy = RetryPolicyFactory.createLinearBackoffPolicy({
        initialDelayMs: 2000,
        maxDelayMs: 60000,
        incrementMs: 5000,
        ...config.rateLimit
      });
      compositePolicy.addPolicyForErrorType('RATE_LIMIT', rateLimitPolicy);
      compositePolicy.addPolicyForErrorType('EVENT_RATE_LIMIT_ERROR', rateLimitPolicy);
      compositePolicy.addPolicyForErrorType('EVENT_PROD_RATE_LIMIT_EXCEEDED', rateLimitPolicy);
    }
    
    if (config.dependency) {
      const dependencyPolicy = RetryPolicyFactory.createExponentialBackoffPolicy({
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffFactor: 2,
        ...config.dependency
      });
      compositePolicy.addPolicyForErrorType('DEPENDENCY', dependencyPolicy);
      compositePolicy.addPolicyForErrorType('EVENT_DEPENDENCY_ERROR', dependencyPolicy);
    }
    
    return compositePolicy;
  }

  /**
   * Create a composite policy with specialized handling for different journeys
   * @param config Configuration for different journeys
   * @returns A composite retry policy
   */
  static createJourneyPolicy(config: JourneyRetryConfig): IRetryPolicy {
    // Create default policy
    const defaultPolicy = RetryPolicyFactory.createDefaultPolicy(config.default);
    
    // Create composite policy with default
    const compositePolicy = new CompositeRetryPolicy(defaultPolicy);
    
    // Add specialized policies for different journeys
    if (config.health) {
      const healthPolicy = RetryPolicyFactory.createExponentialBackoffPolicy(config.health);
      compositePolicy.addPolicyForErrorType('health', healthPolicy);
    }
    
    if (config.care) {
      const carePolicy = RetryPolicyFactory.createExponentialBackoffPolicy(config.care);
      compositePolicy.addPolicyForErrorType('care', carePolicy);
    }
    
    if (config.plan) {
      const planPolicy = RetryPolicyFactory.createExponentialBackoffPolicy(config.plan);
      compositePolicy.addPolicyForErrorType('plan', planPolicy);
    }
    
    if (config.gamification) {
      const gamificationPolicy = RetryPolicyFactory.createExponentialBackoffPolicy(config.gamification);
      compositePolicy.addPolicyForErrorType('gamification', gamificationPolicy);
    }
    
    if (config.notification) {
      const notificationPolicy = RetryPolicyFactory.createExponentialBackoffPolicy(config.notification);
      compositePolicy.addPolicyForErrorType('notification', notificationPolicy);
    }
    
    return compositePolicy;
  }

  /**
   * Create an exponential backoff policy with the specified options
   * @param options Options for the exponential backoff policy
   * @returns An exponential backoff retry policy
   */
  private static createExponentialBackoffPolicy(options: Partial<ExponentialBackoffRetryOptions>): ExponentialBackoffRetryPolicy {
    return new ExponentialBackoffRetryPolicy({
      initialDelayMs: options.initialDelayMs ?? DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS,
      maxDelayMs: options.maxDelayMs ?? DEFAULT_RETRY.MAX_RETRY_DELAY_MS,
      backoffFactor: options.backoffFactor ?? DEFAULT_RETRY.BACKOFF_FACTOR,
      maxRetries: options.maxRetries ?? DEFAULT_RETRY.MAX_RETRIES,
      useJitter: options.useJitter ?? true,
      jitterFactor: options.jitterFactor ?? DEFAULT_RETRY.JITTER_FACTOR
    });
  }
}

/**
 * Utility functions for working with retry policies
 */
export class RetryUtils {
  /**
   * Calculate the next retry time for an event processing error
   * @param error The error that occurred
   * @param retryCount Current retry count
   * @param eventType Type of event being processed
   * @param source Source service or journey
   * @param policy Retry policy to use
   * @returns The delay in milliseconds until the next retry attempt
   */
  static calculateNextRetryDelay(
    error: Error,
    retryCount: number,
    eventType: string,
    source?: string,
    policy?: IRetryPolicy
  ): number {
    // Use provided policy or create default
    const retryPolicy = policy || RetryPolicyFactory.createDefaultPolicy();
    
    // Create retry context
    const context: RetryContext = {
      error,
      retryCount,
      maxRetries: DEFAULT_RETRY.MAX_RETRIES,
      eventType,
      source
    };
    
    // Calculate next retry delay
    return retryPolicy.calculateNextRetryDelay(context);
  }

  /**
   * Determine if a retry should be attempted for an event processing error
   * @param error The error that occurred
   * @param retryCount Current retry count
   * @param eventType Type of event being processed
   * @param source Source service or journey
   * @param policy Retry policy to use
   * @returns True if retry should be attempted, false otherwise
   */
  static shouldRetry(
    error: Error,
    retryCount: number,
    eventType: string,
    source?: string,
    policy?: IRetryPolicy
  ): boolean {
    // Use provided policy or create default
    const retryPolicy = policy || RetryPolicyFactory.createDefaultPolicy();
    
    // Create retry context
    const context: RetryContext = {
      error,
      retryCount,
      maxRetries: DEFAULT_RETRY.MAX_RETRIES,
      eventType,
      source
    };
    
    // Determine if retry should be attempted
    return retryPolicy.shouldRetry(context);
  }

  /**
   * Create a retry policy based on event type and source
   * @param eventType Type of event being processed
   * @param source Source service or journey
   * @returns An appropriate retry policy for the event
   */
  static createPolicyForEvent(eventType: string, source?: string): IRetryPolicy {
    // Create journey-specific policies
    if (source) {
      const journeyConfig: JourneyRetryConfig = {
        default: {}
      };
      
      // Configure journey-specific settings
      switch (source.toLowerCase()) {
        case 'health':
          journeyConfig.health = {
            maxRetries: 5,
            initialDelayMs: 200,
            maxDelayMs: 10000,
            backoffFactor: 2
          };
          break;
        case 'care':
          journeyConfig.care = {
            maxRetries: 4,
            initialDelayMs: 500,
            maxDelayMs: 15000,
            backoffFactor: 1.8
          };
          break;
        case 'plan':
          journeyConfig.plan = {
            maxRetries: 3,
            initialDelayMs: 1000,
            maxDelayMs: 20000,
            backoffFactor: 1.5
          };
          break;
        case 'gamification':
          journeyConfig.gamification = {
            maxRetries: 6,
            initialDelayMs: 100,
            maxDelayMs: 5000,
            backoffFactor: 2
          };
          break;
        case 'notification':
          journeyConfig.notification = {
            maxRetries: 7,
            initialDelayMs: 100,
            maxDelayMs: 30000,
            backoffFactor: 2.5
          };
          break;
      }
      
      return RetryPolicyFactory.createJourneyPolicy(journeyConfig);
    }
    
    // Create event type-specific policies
    if (eventType.includes('health')) {
      return RetryPolicyFactory.createDefaultPolicy({
        maxRetries: 5,
        initialDelayMs: 200,
        maxDelayMs: 10000
      });
    } else if (eventType.includes('care')) {
      return RetryPolicyFactory.createDefaultPolicy({
        maxRetries: 4,
        initialDelayMs: 500,
        maxDelayMs: 15000
      });
    } else if (eventType.includes('plan')) {
      return RetryPolicyFactory.createDefaultPolicy({
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 20000
      });
    } else if (eventType.includes('game') || eventType.includes('achievement')) {
      return RetryPolicyFactory.createDefaultPolicy({
        maxRetries: 6,
        initialDelayMs: 100,
        maxDelayMs: 5000
      });
    } else if (eventType.includes('notification')) {
      return RetryPolicyFactory.createDefaultPolicy({
        maxRetries: 7,
        initialDelayMs: 100,
        maxDelayMs: 30000
      });
    }
    
    // Default policy for unknown event types
    return RetryPolicyFactory.createDefaultPolicy();
  }
}