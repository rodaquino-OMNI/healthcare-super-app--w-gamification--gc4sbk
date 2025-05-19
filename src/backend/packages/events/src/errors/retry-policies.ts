import { ErrorType } from '@austa/errors';
import { Injectable } from '@nestjs/common';

/**
 * Enum representing the status of a retry operation
 */
export enum RetryStatus {
  /** Operation is scheduled for retry but not yet attempted */
  PENDING = 'PENDING',
  /** Operation is currently being retried */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Operation has been successfully completed after one or more retries */
  SUCCEEDED = 'SUCCEEDED',
  /** Operation has failed but is eligible for further retry attempts */
  FAILED = 'FAILED',
  /** Operation has failed and exhausted all retry attempts */
  EXHAUSTED = 'EXHAUSTED',
}

/**
 * Interface for retry policy configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts before giving up */
  maxRetries: number;
  /** Initial delay in milliseconds before the first retry */
  initialDelay: number;
  /** Maximum delay in milliseconds between retries */
  maxDelay?: number;
  /** Factor to apply jitter to prevent thundering herd problem (0-1) */
  jitter?: number;
}

/**
 * Extended options for exponential backoff retry policy
 */
export interface ExponentialBackoffOptions extends RetryOptions {
  /** Factor by which the delay increases with each retry attempt */
  backoffFactor: number;
}

/**
 * Extended options for fixed interval retry policy
 */
export interface FixedIntervalOptions extends RetryOptions {
  /** Fixed delay between retry attempts */
  delay: number;
}

/**
 * Interface for journey-specific retry configurations
 */
export interface JourneyRetryConfig {
  /** Health journey specific retry configuration */
  health?: {
    /** Retry options for different error types in health journey */
    retryOptions: {
      [key in ErrorType]?: RetryOptions;
    };
  };
  /** Care journey specific retry configuration */
  care?: {
    /** Retry options for different error types in care journey */
    retryOptions: {
      [key in ErrorType]?: RetryOptions;
    };
  };
  /** Plan journey specific retry configuration */
  plan?: {
    /** Retry options for different error types in plan journey */
    retryOptions: {
      [key in ErrorType]?: RetryOptions;
    };
  };
  /** Default retry options for any journey */
  default: {
    /** Retry options for different error types */
    retryOptions: {
      [key in ErrorType]?: RetryOptions;
    };
  };
}

/**
 * Context information for retry decision making
 */
export interface RetryContext {
  /** The error that caused the operation to fail */
  error: Error;
  /** The number of retry attempts so far */
  attemptCount: number;
  /** The event type being processed */
  eventType: string;
  /** The source journey or service of the event */
  source?: string;
  /** Additional metadata for retry decisions */
  metadata?: Record<string, any>;
}

/**
 * Interface that all retry policies must implement
 */
export interface RetryPolicy {
  /**
   * Determines if an operation should be retried based on the context
   * @param context The retry context with error and attempt information
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(context: RetryContext): boolean;

  /**
   * Calculates the time for the next retry attempt
   * @param context The retry context with error and attempt information
   * @returns The delay in milliseconds before the next retry attempt
   */
  calculateNextRetryDelay(context: RetryContext): number;

  /**
   * Gets the name of the retry policy for identification
   * @returns The name of the retry policy
   */
  getName(): string;
}

/**
 * Base implementation of retry policy with common functionality
 */
export abstract class BaseRetryPolicy implements RetryPolicy {
  protected readonly options: RetryOptions;
  protected readonly name: string;

  /**
   * Creates a new instance of BaseRetryPolicy
   * @param name The name of the retry policy
   * @param options The retry policy configuration options
   */
  constructor(name: string, options: RetryOptions) {
    this.name = name;
    this.options = {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      jitter: options.jitter !== undefined ? options.jitter : 0.2,
    };
  }

  /**
   * Determines if an operation should be retried based on the context
   * @param context The retry context with error and attempt information
   * @returns True if the operation should be retried, false otherwise
   */
  public shouldRetry(context: RetryContext): boolean {
    // Don't retry if we've exceeded the maximum number of retries
    if (context.attemptCount >= this.options.maxRetries) {
      return false;
    }

    // Check if the error is retryable based on its type
    return this.isRetryableError(context.error);
  }

  /**
   * Calculates the time for the next retry attempt
   * @param context The retry context with error and attempt information
   * @returns The delay in milliseconds before the next retry attempt
   */
  public abstract calculateNextRetryDelay(context: RetryContext): number;

  /**
   * Gets the name of the retry policy for identification
   * @returns The name of the retry policy
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Determines if an error is retryable based on its type
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  protected isRetryableError(error: Error): boolean {
    // By default, consider network errors, database connection errors, and
    // temporary service unavailability errors as retryable
    if (error instanceof Error) {
      // Check for network errors
      if (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('EHOSTUNREACH') ||
        error.message.includes('network error')
      ) {
        return true;
      }

      // Check for database connection errors
      if (
        error.message.includes('connection') &&
        (error.message.includes('lost') || error.message.includes('closed') || error.message.includes('terminated'))
      ) {
        return true;
      }

      // Check for rate limiting or temporary service unavailability
      if (
        error.message.includes('rate limit') ||
        error.message.includes('too many requests') ||
        error.message.includes('service unavailable') ||
        error.message.includes('try again')
      ) {
        return true;
      }

      // Check for custom error types from @austa/errors
      if ('errorType' in error && typeof (error as any).errorType === 'string') {
        const errorType = (error as any).errorType as ErrorType;
        return this.isRetryableErrorType(errorType);
      }
    }

    return false;
  }

  /**
   * Determines if an error type is retryable
   * @param errorType The error type to check
   * @returns True if the error type is retryable, false otherwise
   */
  protected isRetryableErrorType(errorType: ErrorType): boolean {
    // Consider certain error types as retryable
    const retryableErrorTypes = [
      ErrorType.NETWORK,
      ErrorType.DATABASE,
      ErrorType.TIMEOUT,
      ErrorType.RATE_LIMIT,
      ErrorType.TEMPORARY_FAILURE,
      ErrorType.DEPENDENCY_UNAVAILABLE,
    ];

    return retryableErrorTypes.includes(errorType);
  }

  /**
   * Applies jitter to a delay value to prevent the thundering herd problem
   * @param delay The base delay value in milliseconds
   * @returns The delay with jitter applied
   */
  protected applyJitter(delay: number): number {
    if (!this.options.jitter || this.options.jitter <= 0) {
      return delay;
    }

    // Apply jitter by randomly adjusting the delay by up to jitter%
    const jitterAmount = delay * this.options.jitter;
    return delay - jitterAmount / 2 + Math.random() * jitterAmount;
  }
}

/**
 * Implements a retry policy with exponential backoff
 */
export class ExponentialBackoffPolicy extends BaseRetryPolicy {
  private readonly backoffFactor: number;

  /**
   * Creates a new instance of ExponentialBackoffPolicy
   * @param options The exponential backoff configuration options
   */
  constructor(options: ExponentialBackoffOptions) {
    super('ExponentialBackoff', options);
    this.backoffFactor = options.backoffFactor || 2;
  }

  /**
   * Calculates the next retry delay using exponential backoff
   * @param context The retry context with error and attempt information
   * @returns The delay in milliseconds before the next retry attempt
   */
  public calculateNextRetryDelay(context: RetryContext): number {
    // Calculate exponential backoff: initialDelay * (backoffFactor ^ attemptCount)
    const exponentialDelay = this.options.initialDelay * Math.pow(this.backoffFactor, context.attemptCount);
    
    // Cap the delay at the maximum delay
    const cappedDelay = Math.min(exponentialDelay, this.options.maxDelay || Number.MAX_SAFE_INTEGER);
    
    // Apply jitter to prevent the thundering herd problem
    return this.applyJitter(cappedDelay);
  }
}

/**
 * Implements a retry policy with fixed intervals between retries
 */
export class FixedIntervalPolicy extends BaseRetryPolicy {
  private readonly delay: number;

  /**
   * Creates a new instance of FixedIntervalPolicy
   * @param options The fixed interval configuration options
   */
  constructor(options: FixedIntervalOptions) {
    super('FixedInterval', options);
    this.delay = options.delay || options.initialDelay;
  }

  /**
   * Calculates the next retry delay using a fixed interval
   * @param context The retry context with error and attempt information
   * @returns The delay in milliseconds before the next retry attempt
   */
  public calculateNextRetryDelay(context: RetryContext): number {
    // Apply jitter to the fixed delay to prevent the thundering herd problem
    return this.applyJitter(this.delay);
  }
}

/**
 * Implements a retry policy that limits the maximum number of retry attempts
 */
export class MaxAttemptsPolicy extends BaseRetryPolicy {
  /**
   * Creates a new instance of MaxAttemptsPolicy
   * @param options The retry policy configuration options
   */
  constructor(options: RetryOptions) {
    super('MaxAttempts', options);
  }

  /**
   * Calculates the next retry delay (delegates to another policy)
   * @param context The retry context with error and attempt information
   * @returns The delay in milliseconds before the next retry attempt
   */
  public calculateNextRetryDelay(context: RetryContext): number {
    // This policy only enforces max attempts, so use a simple delay
    return this.applyJitter(this.options.initialDelay);
  }

  /**
   * Determines if an operation should be retried based on the max attempts
   * @param context The retry context with error and attempt information
   * @returns True if the operation should be retried, false otherwise
   */
  public shouldRetry(context: RetryContext): boolean {
    // Only check the attempt count, not the error type
    return context.attemptCount < this.options.maxRetries;
  }
}

/**
 * Implements a composite retry policy that combines multiple policies
 */
export class CompositeRetryPolicy implements RetryPolicy {
  private readonly policies: Map<string, RetryPolicy> = new Map();
  private readonly defaultPolicy: RetryPolicy;
  private readonly errorTypeToPolicy: Map<ErrorType, RetryPolicy> = new Map();

  /**
   * Creates a new instance of CompositeRetryPolicy
   * @param defaultPolicy The default policy to use when no specific policy matches
   */
  constructor(defaultPolicy: RetryPolicy) {
    this.defaultPolicy = defaultPolicy;
    this.registerPolicy(defaultPolicy);
  }

  /**
   * Registers a retry policy with the composite policy
   * @param policy The retry policy to register
   * @returns The composite policy instance for chaining
   */
  public registerPolicy(policy: RetryPolicy): CompositeRetryPolicy {
    this.policies.set(policy.getName(), policy);
    return this;
  }

  /**
   * Maps an error type to a specific retry policy
   * @param errorType The error type to map
   * @param policyName The name of the policy to use for this error type
   * @returns The composite policy instance for chaining
   */
  public mapErrorTypeToPolicy(errorType: ErrorType, policyName: string): CompositeRetryPolicy {
    const policy = this.policies.get(policyName);
    if (policy) {
      this.errorTypeToPolicy.set(errorType, policy);
    }
    return this;
  }

  /**
   * Gets the appropriate policy for a given error
   * @param error The error to get a policy for
   * @returns The appropriate retry policy for the error
   */
  private getPolicyForError(error: Error): RetryPolicy {
    if ('errorType' in error && typeof (error as any).errorType === 'string') {
      const errorType = (error as any).errorType as ErrorType;
      const policy = this.errorTypeToPolicy.get(errorType);
      if (policy) {
        return policy;
      }
    }
    return this.defaultPolicy;
  }

  /**
   * Determines if an operation should be retried based on the context
   * @param context The retry context with error and attempt information
   * @returns True if the operation should be retried, false otherwise
   */
  public shouldRetry(context: RetryContext): boolean {
    const policy = this.getPolicyForError(context.error);
    return policy.shouldRetry(context);
  }

  /**
   * Calculates the time for the next retry attempt
   * @param context The retry context with error and attempt information
   * @returns The delay in milliseconds before the next retry attempt
   */
  public calculateNextRetryDelay(context: RetryContext): number {
    const policy = this.getPolicyForError(context.error);
    return policy.calculateNextRetryDelay(context);
  }

  /**
   * Gets the name of the retry policy for identification
   * @returns The name of the retry policy
   */
  public getName(): string {
    return 'CompositeRetryPolicy';
  }
}

/**
 * Factory for creating retry policies based on event types and journeys
 */
@Injectable()
export class RetryPolicyFactory {
  private readonly journeyConfigs: JourneyRetryConfig;
  private readonly policyCache: Map<string, RetryPolicy> = new Map();

  /**
   * Creates a new instance of RetryPolicyFactory
   * @param journeyConfigs The journey-specific retry configurations
   */
  constructor(journeyConfigs?: JourneyRetryConfig) {
    // Set default configurations if none provided
    this.journeyConfigs = journeyConfigs || this.getDefaultJourneyConfigs();
  }

  /**
   * Creates default journey configurations
   * @returns The default journey configurations
   */
  private getDefaultJourneyConfigs(): JourneyRetryConfig {
    return {
      health: {
        retryOptions: {
          [ErrorType.NETWORK]: {
            maxRetries: 5,
            initialDelay: 500,
            maxDelay: 10000,
            jitter: 0.3,
          },
          [ErrorType.DATABASE]: {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            jitter: 0.2,
          },
          [ErrorType.TIMEOUT]: {
            maxRetries: 3,
            initialDelay: 2000,
            maxDelay: 10000,
            jitter: 0.2,
          },
        },
      },
      care: {
        retryOptions: {
          [ErrorType.NETWORK]: {
            maxRetries: 5,
            initialDelay: 500,
            maxDelay: 10000,
            jitter: 0.3,
          },
          [ErrorType.DATABASE]: {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            jitter: 0.2,
          },
          [ErrorType.TIMEOUT]: {
            maxRetries: 4,
            initialDelay: 1500,
            maxDelay: 8000,
            jitter: 0.2,
          },
        },
      },
      plan: {
        retryOptions: {
          [ErrorType.NETWORK]: {
            maxRetries: 4,
            initialDelay: 1000,
            maxDelay: 15000,
            jitter: 0.3,
          },
          [ErrorType.DATABASE]: {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            jitter: 0.2,
          },
          [ErrorType.TIMEOUT]: {
            maxRetries: 3,
            initialDelay: 2000,
            maxDelay: 10000,
            jitter: 0.2,
          },
        },
      },
      default: {
        retryOptions: {
          [ErrorType.NETWORK]: {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            jitter: 0.2,
          },
          [ErrorType.DATABASE]: {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            jitter: 0.2,
          },
          [ErrorType.TIMEOUT]: {
            maxRetries: 2,
            initialDelay: 2000,
            maxDelay: 8000,
            jitter: 0.2,
          },
          [ErrorType.RATE_LIMIT]: {
            maxRetries: 3,
            initialDelay: 5000,
            maxDelay: 30000,
            jitter: 0.1,
          },
          [ErrorType.TEMPORARY_FAILURE]: {
            maxRetries: 5,
            initialDelay: 1000,
            maxDelay: 15000,
            jitter: 0.2,
          },
          [ErrorType.DEPENDENCY_UNAVAILABLE]: {
            maxRetries: 5,
            initialDelay: 2000,
            maxDelay: 20000,
            jitter: 0.2,
          },
        },
      },
    };
  }

  /**
   * Creates a retry policy for a specific journey and error type
   * @param journey The journey to create a policy for
   * @param errorType The error type to create a policy for
   * @returns A retry policy for the specified journey and error type
   */
  public createPolicyForJourneyAndErrorType(journey: string, errorType: ErrorType): RetryPolicy {
    const cacheKey = `${journey}:${errorType}`;
    
    // Return cached policy if available
    if (this.policyCache.has(cacheKey)) {
      return this.policyCache.get(cacheKey)!;
    }

    // Get journey-specific config or fall back to default
    const journeyConfig = this.journeyConfigs[journey.toLowerCase() as keyof JourneyRetryConfig] || 
                          this.journeyConfigs.default;
    
    // Get error-specific options or fall back to default network error options
    const options = journeyConfig.retryOptions[errorType] || 
                    this.journeyConfigs.default.retryOptions[ErrorType.NETWORK]!;

    // Create appropriate policy based on error type
    let policy: RetryPolicy;
    
    switch (errorType) {
      case ErrorType.RATE_LIMIT:
        // For rate limiting, use fixed interval with longer delays
        policy = new FixedIntervalPolicy({
          ...options,
          delay: options.initialDelay,
        });
        break;
        
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
      case ErrorType.TEMPORARY_FAILURE:
      case ErrorType.DEPENDENCY_UNAVAILABLE:
        // For transient errors, use exponential backoff
        policy = new ExponentialBackoffPolicy({
          ...options,
          backoffFactor: 2,
        });
        break;
        
      case ErrorType.DATABASE:
        // For database errors, use exponential backoff with more aggressive parameters
        policy = new ExponentialBackoffPolicy({
          ...options,
          backoffFactor: 1.5,
        });
        break;
        
      default:
        // For other errors, use a simple max attempts policy
        policy = new MaxAttemptsPolicy(options);
    }
    
    // Cache the policy for future use
    this.policyCache.set(cacheKey, policy);
    
    return policy;
  }

  /**
   * Creates a composite retry policy for a specific journey
   * @param journey The journey to create a policy for
   * @returns A composite retry policy for the specified journey
   */
  public createCompositePolicy(journey: string): CompositeRetryPolicy {
    const cacheKey = `composite:${journey}`;
    
    // Return cached policy if available
    if (this.policyCache.has(cacheKey)) {
      return this.policyCache.get(cacheKey) as CompositeRetryPolicy;
    }

    // Create default policy for the journey
    const defaultPolicy = this.createPolicyForJourneyAndErrorType(
      journey, 
      ErrorType.NETWORK
    );
    
    // Create composite policy with the default policy
    const compositePolicy = new CompositeRetryPolicy(defaultPolicy);
    
    // Register policies for different error types
    const errorTypes = [
      ErrorType.NETWORK,
      ErrorType.DATABASE,
      ErrorType.TIMEOUT,
      ErrorType.RATE_LIMIT,
      ErrorType.TEMPORARY_FAILURE,
      ErrorType.DEPENDENCY_UNAVAILABLE,
    ];
    
    // Create and register policies for each error type
    for (const errorType of errorTypes) {
      const policy = this.createPolicyForJourneyAndErrorType(journey, errorType);
      compositePolicy.registerPolicy(policy);
      compositePolicy.mapErrorTypeToPolicy(errorType, policy.getName());
    }
    
    // Cache the composite policy for future use
    this.policyCache.set(cacheKey, compositePolicy);
    
    return compositePolicy;
  }

  /**
   * Gets a retry policy for a specific event type
   * @param eventType The event type to get a policy for
   * @returns A retry policy for the specified event type
   */
  public getPolicyForEventType(eventType: string): RetryPolicy {
    // Determine the journey from the event type
    let journey = 'default';
    
    if (eventType.startsWith('health.')) {
      journey = 'health';
    } else if (eventType.startsWith('care.')) {
      journey = 'care';
    } else if (eventType.startsWith('plan.')) {
      journey = 'plan';
    }
    
    // Create a composite policy for the journey
    return this.createCompositePolicy(journey);
  }
}