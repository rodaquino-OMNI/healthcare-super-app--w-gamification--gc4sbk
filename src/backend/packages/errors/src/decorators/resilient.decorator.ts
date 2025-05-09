import { ErrorType, ErrorRecoveryStrategy } from '../types';
import {
  ResilientOptions,
  RetryOptions,
  CircuitBreakerOptions,
  FallbackOptions,
  ErrorContextOptions,
  ClassifyErrorOptions,
  TransformErrorOptions,
} from './types';

// Import the individual decorators
// In a real implementation, these would be imported from their respective files
import { WithErrorContext } from './error-context.decorator';
import { CircuitBreaker } from './circuit-breaker.decorator';
import { Retry, RetryWithBackoff } from './retry.decorator';
import { WithFallback } from './fallback.decorator';
import { ClassifyError } from './error-context.decorator';
import { TransformError } from './error-context.decorator';

/**
 * A builder class for creating a resilient decorator with a fluent API.
 * Allows configuring retry, circuit breaker, fallback, and other resilience patterns.
 * 
 * @example
 * ```typescript
 * // Simple usage with defaults
 * @Resilient()
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * // Advanced usage with custom configuration
 * @Resilient()
 *   .withRetry({ maxAttempts: 3, backoffStrategy: BackoffStrategy.EXPONENTIAL })
 *   .withCircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 })
 *   .withFallback((error, userId) => this.getUserProfileFromCache(userId))
 *   .withErrorContext({ journey: 'health', resource: 'user-profile' })
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * ```
 */
export class ResilientBuilder<T = any, A extends any[] = any[]> {
  private options: ResilientOptions<T, A> = {};
  
  /**
   * Creates a new ResilientBuilder with the specified options.
   * 
   * @param options - Initial configuration options
   */
  constructor(options?: Partial<ResilientOptions<T, A>>) {
    if (options) {
      this.options = { ...options };
    }
  }

  /**
   * Configures retry behavior for the resilient decorator.
   * 
   * @param options - Retry configuration options
   * @returns The builder instance for method chaining
   */
  withRetry(options: RetryOptions): ResilientBuilder<T, A> {
    this.options.retry = options;
    return this;
  }

  /**
   * Configures circuit breaker behavior for the resilient decorator.
   * 
   * @param options - Circuit breaker configuration options
   * @returns The builder instance for method chaining
   */
  withCircuitBreaker(options: CircuitBreakerOptions): ResilientBuilder<T, A> {
    this.options.circuitBreaker = options;
    return this;
  }

  /**
   * Configures fallback behavior for the resilient decorator.
   * 
   * @param fallbackFnOrOptions - Fallback function or options
   * @returns The builder instance for method chaining
   */
  withFallback(
    fallbackFnOrOptions: ((error: Error, ...args: A) => T | Promise<T>) | FallbackOptions<T, A>
  ): ResilientBuilder<T, A> {
    if (typeof fallbackFnOrOptions === 'function') {
      this.options.fallback = { fallbackFn: fallbackFnOrOptions };
    } else {
      this.options.fallback = fallbackFnOrOptions;
    }
    return this;
  }

  /**
   * Configures error context for the resilient decorator.
   * 
   * @param options - Error context configuration options
   * @returns The builder instance for method chaining
   */
  withErrorContext(options: ErrorContextOptions): ResilientBuilder<T, A> {
    this.options.errorContext = options;
    return this;
  }

  /**
   * Configures error classification for the resilient decorator.
   * 
   * @param options - Error classification configuration options
   * @returns The builder instance for method chaining
   */
  withErrorClassification(options: ClassifyErrorOptions): ResilientBuilder<T, A> {
    this.options.classifyError = options;
    return this;
  }

  /**
   * Configures error transformation for the resilient decorator.
   * 
   * @param options - Error transformation configuration options
   * @returns The builder instance for method chaining
   */
  withErrorTransformation(options: TransformErrorOptions): ResilientBuilder<T, A> {
    this.options.transformError = options;
    return this;
  }

  /**
   * Configures retry behavior specifically for transient errors.
   * This is a convenience method that configures retry with common settings for transient errors.
   * 
   * @param maxAttempts - Maximum number of retry attempts (default: 3)
   * @returns The builder instance for method chaining
   */
  withTransientRetry(maxAttempts = 3): ResilientBuilder<T, A> {
    this.options.retry = {
      maxAttempts,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      jitter: 0.1,
      retryableErrors: [
        ErrorType.EXTERNAL,
        ErrorType.SERVICE_UNAVAILABLE,
        ErrorType.TIMEOUT,
      ],
    };
    return this;
  }

  /**
   * Configures the resilient decorator for a specific journey.
   * This is a convenience method that sets up error context with the journey.
   * 
   * @param journey - The journey context ('health', 'care', or 'plan')
   * @param resource - Optional resource being accessed
   * @returns The builder instance for method chaining
   */
  forJourney(
    journey: 'health' | 'care' | 'plan',
    resource?: string
  ): ResilientBuilder<T, A> {
    this.options.errorContext = {
      ...(this.options.errorContext || {}),
      journey,
      resource,
    };
    return this;
  }

  /**
   * Configures the resilient decorator with a recommended recovery strategy.
   * This is a convenience method that sets up appropriate resilience patterns based on the strategy.
   * 
   * @param strategy - The recovery strategy to use
   * @returns The builder instance for method chaining
   */
  withRecoveryStrategy(strategy: ErrorRecoveryStrategy): ResilientBuilder<T, A> {
    switch (strategy) {
      case ErrorRecoveryStrategy.RETRY:
        if (!this.options.retry) {
          this.withTransientRetry();
        }
        break;
      case ErrorRecoveryStrategy.CIRCUIT_BREAKER:
        if (!this.options.circuitBreaker) {
          this.withCircuitBreaker({
            failureThreshold: 5,
            resetTimeout: 30000,
            windowSize: 10,
          });
        }
        break;
      case ErrorRecoveryStrategy.CACHED_DATA:
        // This would typically be implemented with a specific cached fallback
        // which would require more context than we have here
        break;
      case ErrorRecoveryStrategy.DEFAULT_BEHAVIOR:
        // This would typically be implemented with a specific default fallback
        // which would require more context than we have here
        break;
      case ErrorRecoveryStrategy.GRACEFUL_DEGRADATION:
        // This typically combines circuit breaker and fallback
        if (!this.options.circuitBreaker) {
          this.withCircuitBreaker({
            failureThreshold: 5,
            resetTimeout: 30000,
            windowSize: 10,
          });
        }
        // Fallback would need to be provided separately
        break;
      case ErrorRecoveryStrategy.FAIL:
        // No recovery, just ensure proper error classification
        if (!this.options.classifyError) {
          this.withErrorClassification({
            defaultType: ErrorType.TECHNICAL,
            rethrow: true,
          });
        }
        break;
    }

    // Add the recovery strategy to error classification if it exists
    if (this.options.classifyError) {
      this.options.classifyError.recoveryStrategy = strategy;
    } else {
      this.withErrorClassification({
        defaultType: ErrorType.TECHNICAL,
        rethrow: true,
        recoveryStrategy: strategy,
      });
    }

    return this;
  }

  /**
   * Configures the resilient decorator for a specific operation.
   * This is a convenience method that sets up error context with the operation name.
   * 
   * @param operation - The operation name
   * @returns The builder instance for method chaining
   */
  forOperation(operation: string): ResilientBuilder<T, A> {
    this.options.errorContext = {
      ...(this.options.errorContext || {}),
      operation,
    };
    return this;
  }

  /**
   * Configures the resilient decorator for a specific resource.
   * This is a convenience method that sets up error context with the resource name.
   * 
   * @param resource - The resource being accessed
   * @returns The builder instance for method chaining
   */
  forResource(resource: string): ResilientBuilder<T, A> {
    this.options.errorContext = {
      ...(this.options.errorContext || {}),
      resource,
    };
    return this;
  }

  /**
   * Configures the resilient decorator to extract user ID from method arguments.
   * This is a convenience method that sets up error context with a user ID extractor.
   * 
   * @param getUserId - Function to extract user ID from method arguments
   * @returns The builder instance for method chaining
   */
  withUserContext(getUserId: (...args: any[]) => string | undefined): ResilientBuilder<T, A> {
    this.options.errorContext = {
      ...(this.options.errorContext || {}),
      getUserId,
    };
    return this;
  }

  /**
   * Configures the resilient decorator with common settings for external API calls.
   * This is a convenience method that sets up retry, circuit breaker, and error classification
   * with appropriate settings for external API calls.
   * 
   * @param serviceName - Name of the external service
   * @returns The builder instance for method chaining
   */
  forExternalService(serviceName: string): ResilientBuilder<T, A> {
    // Configure retry for transient errors
    this.withTransientRetry();
    
    // Configure circuit breaker
    this.withCircuitBreaker({
      id: `external-${serviceName}`,
      failureThreshold: 5,
      resetTimeout: 30000,
      windowSize: 10,
      failureErrors: [
        ErrorType.EXTERNAL,
        ErrorType.SERVICE_UNAVAILABLE,
        ErrorType.TIMEOUT,
      ],
    });
    
    // Configure error context
    this.withErrorContext({
      resource: serviceName,
      data: { externalService: serviceName },
    });
    
    // Configure error classification
    this.withErrorClassification({
      defaultType: ErrorType.EXTERNAL,
      recoveryStrategy: ErrorRecoveryStrategy.CIRCUIT_BREAKER,
    });
    
    return this;
  }

  /**
   * Configures the resilient decorator with common settings for database operations.
   * This is a convenience method that sets up retry and error classification
   * with appropriate settings for database operations.
   * 
   * @param databaseName - Name of the database
   * @returns The builder instance for method chaining
   */
  forDatabase(databaseName: string): ResilientBuilder<T, A> {
    // Configure retry for transient errors
    this.withRetry({
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      baseDelay: 100, // Shorter delay for database operations
      maxDelay: 5000,
      jitter: 0.1,
      retryableErrors: [
        ErrorType.TIMEOUT,
        ErrorType.SERVICE_UNAVAILABLE,
      ],
    });
    
    // Configure error context
    this.withErrorContext({
      resource: `db:${databaseName}`,
      data: { database: databaseName },
    });
    
    // Configure error classification
    this.withErrorClassification({
      defaultType: ErrorType.TECHNICAL,
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
    });
    
    return this;
  }

  /**
   * Creates a copy of this builder with the same configuration.
   * Useful for creating variations of a base configuration.
   * 
   * @returns A new builder instance with the same configuration
   */
  clone(): ResilientBuilder<T, A> {
    return new ResilientBuilder<T, A>({ ...this.options });
  }

  /**
   * Builds the resilient decorator with the configured options.
   * 
   * @returns A method decorator that applies the configured resilience patterns
   */
  build(): MethodDecorator {
    const options = { ...this.options };
    return createResilientDecorator(options);
  }
}

/**
 * Creates a method decorator that applies multiple resilience patterns.
 * 
 * @param options - Configuration options for the resilient decorator
 * @returns A method decorator that applies the configured resilience patterns
 * @private
 */
function createResilientDecorator<T, A extends any[]>(
  options: ResilientOptions<T, A>
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // We need to apply the decorators in the correct order, but in reverse
    // since each decorator wraps the previous one
    
    // Start with the original method
    let currentDescriptor = { ...descriptor };
    
    // Apply error classification (should be applied first but executed last)
    if (options.classifyError) {
      const classifyErrorDecorator = ClassifyError(options.classifyError);
      currentDescriptor = classifyErrorDecorator(target, propertyKey, currentDescriptor) || currentDescriptor;
    }
    
    // Apply fallback (should be applied before retry and circuit breaker)
    if (options.fallback) {
      const fallbackDecorator = WithFallback(options.fallback);
      currentDescriptor = fallbackDecorator(target, propertyKey, currentDescriptor) || currentDescriptor;
    }
    
    // Apply retry (should be applied before circuit breaker)
    if (options.retry) {
      // Use RetryWithBackoff if a backoff strategy is specified, otherwise use Retry
      const retryDecorator = options.retry.backoffStrategy ? 
        RetryWithBackoff(options.retry) : 
        Retry(options.retry);
      currentDescriptor = retryDecorator(target, propertyKey, currentDescriptor) || currentDescriptor;
    }
    
    // Apply circuit breaker (should be applied before error context)
    if (options.circuitBreaker) {
      // If retry is also configured, we need to ensure the circuit breaker
      // is aware of retry attempts to avoid false positives
      const circuitBreakerOptions = { ...options.circuitBreaker };
      
      // If retry is configured, modify the circuit breaker to be aware of retry attempts
      if (options.retry) {
        // Adjust failure threshold based on retry attempts
        // This ensures that a single logical operation that is retried multiple times
        // doesn't count as multiple failures for the circuit breaker
        const maxAttempts = options.retry.maxAttempts || 3;
        
        // Wrap the isFailure function to be retry-aware
        const originalIsFailure = circuitBreakerOptions.isFailure;
        circuitBreakerOptions.isFailure = (error: Error) => {
          // Check if this is a retry-exhausted error
          const isRetryExhausted = error instanceof Error && 
            (error as any).retryExhausted === true;
          
          // If it's a retry-exhausted error, count it as a single failure
          // Otherwise, use the original isFailure function or default behavior
          if (isRetryExhausted) {
            return true;
          }
          
          if (originalIsFailure) {
            return originalIsFailure(error);
          }
          
          // Default behavior: count all errors as failures
          return true;
        };
      }
      
      const circuitBreakerDecorator = CircuitBreaker(circuitBreakerOptions);
      currentDescriptor = circuitBreakerDecorator(target, propertyKey, currentDescriptor) || currentDescriptor;
    }
    
    // Apply error transformation
    if (options.transformError) {
      const transformErrorDecorator = TransformError(options.transformError);
      currentDescriptor = transformErrorDecorator(target, propertyKey, currentDescriptor) || currentDescriptor;
    }
    
    // Apply error context (should be applied last but executed first)
    if (options.errorContext) {
      const errorContextDecorator = WithErrorContext(options.errorContext);
      currentDescriptor = errorContextDecorator(target, propertyKey, currentDescriptor) || currentDescriptor;
    }
    
    // Return the final descriptor with all decorators applied
    return currentDescriptor;
  };
}

/**
 * A decorator that combines multiple resilience patterns (retry, circuit breaker, fallback)
 * into a single decorator with a fluent configuration API.
 * 
 * This decorator provides a comprehensive solution for making method calls resilient
 * against various failure modes. It supports configuration of all underlying patterns
 * and ensures they work together consistently.
 * 
 * @param optionsOrBuilder - Configuration options or a pre-configured builder
 * @returns A method decorator or a builder for further configuration
 * 
 * @example
 * ```typescript
 * // Simple usage with defaults
 * @Resilient()
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * // Advanced usage with custom configuration
 * @Resilient()
 *   .withRetry({ maxAttempts: 3, backoffStrategy: BackoffStrategy.EXPONENTIAL })
 *   .withCircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 })
 *   .withFallback((error, userId) => this.getUserProfileFromCache(userId))
 *   .withErrorContext({ journey: 'health', resource: 'user-profile' })
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * // Usage with pre-configured options
 * const options: ResilientOptions = {
 *   retry: { maxAttempts: 3 },
 *   circuitBreaker: { failureThreshold: 5 },
 *   fallback: { fallbackFn: (error, userId) => getDefaultProfile(userId) }
 * };
 * 
 * @Resilient(options)
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * // Usage with convenience methods for common scenarios
 * @Resilient()
 *   .forJourney('health')
 *   .forOperation('getUserProfile')
 *   .withTransientRetry()
 *   .withFallback((error, userId) => this.getUserProfileFromCache(userId))
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * // Usage with pre-configured patterns for external services
 * @Resilient()
 *   .forExternalService('health-api')
 *   .withFallback((error, userId) => this.getUserProfileFromCache(userId))
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * // Creating reusable resilience configurations
 * const healthServiceResilience = new ResilientBuilder()
 *   .forJourney('health')
 *   .withTransientRetry()
 *   .withCircuitBreaker({ failureThreshold: 5 });
 * 
 * @Resilient(healthServiceResilience)
 *   .withFallback((error, userId) => this.getUserProfileFromCache(userId))
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * ```
 */
export function Resilient<T = any, A extends any[] = any[]>(
  optionsOrBuilder?: ResilientOptions<T, A> | ResilientBuilder<T, A>
): MethodDecorator | ResilientBuilder<T, A> {
  // If no options are provided, return a new builder for fluent configuration
  if (!optionsOrBuilder) {
    return new ResilientBuilder<T, A>();
  }

  // If a builder is provided, build and return the decorator
  if (optionsOrBuilder instanceof ResilientBuilder) {
    return optionsOrBuilder.build();
  }

  // If options are provided, create and return the decorator
  return createResilientDecorator(optionsOrBuilder);
}

/**
 * Creates a new ResilientBuilder with the specified options.
 * This is a convenience function for creating a builder without using the decorator syntax.
 * 
 * @param options - Initial configuration options
 * @returns A new builder instance
 * 
 * @example
 * ```typescript
 * // Create a reusable resilience configuration
 * const healthServiceResilience = createResilientBuilder()
 *   .forJourney('health')
 *   .withTransientRetry()
 *   .withCircuitBreaker({ failureThreshold: 5 });
 * 
 * // Use it with different methods
 * @Resilient(healthServiceResilience.clone())
 *   .withFallback((error, userId) => this.getUserProfileFromCache(userId))
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // Method implementation
 * }
 * 
 * @Resilient(healthServiceResilience.clone())
 *   .withFallback((error, metricId) => this.getDefaultMetric(metricId))
 * async getHealthMetric(metricId: string): Promise<HealthMetric> {
 *   // Method implementation
 * }
 * ```
 */
export function createResilientBuilder<T = any, A extends any[] = any[]>(
  options?: Partial<ResilientOptions<T, A>>
): ResilientBuilder<T, A> {
  return new ResilientBuilder<T, A>(options);
}

/**
 * Pre-configured resilience patterns for common use cases.
 * These can be used as a starting point for creating resilient decorators.
 */
export const ResilientPatterns = {
  /**
   * Pattern for health journey services with transient retry and circuit breaker.
   * 
   * @returns A pre-configured builder for health journey services
   */
  healthJourney<T = any, A extends any[] = any[]>(): ResilientBuilder<T, A> {
    return new ResilientBuilder<T, A>()
      .forJourney('health')
      .withTransientRetry()
      .withCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
        windowSize: 10,
      })
      .withErrorClassification({
        defaultType: ErrorType.TECHNICAL,
        recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      });
  },
  
  /**
   * Pattern for care journey services with transient retry and circuit breaker.
   * 
   * @returns A pre-configured builder for care journey services
   */
  careJourney<T = any, A extends any[] = any[]>(): ResilientBuilder<T, A> {
    return new ResilientBuilder<T, A>()
      .forJourney('care')
      .withTransientRetry()
      .withCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
        windowSize: 10,
      })
      .withErrorClassification({
        defaultType: ErrorType.TECHNICAL,
        recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      });
  },
  
  /**
   * Pattern for plan journey services with transient retry and circuit breaker.
   * 
   * @returns A pre-configured builder for plan journey services
   */
  planJourney<T = any, A extends any[] = any[]>(): ResilientBuilder<T, A> {
    return new ResilientBuilder<T, A>()
      .forJourney('plan')
      .withTransientRetry()
      .withCircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
        windowSize: 10,
      })
      .withErrorClassification({
        defaultType: ErrorType.TECHNICAL,
        recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      });
  },
  
  /**
   * Pattern for database operations with retry and error classification.
   * 
   * @param databaseName - Name of the database
   * @returns A pre-configured builder for database operations
   */
  database<T = any, A extends any[] = any[]>(databaseName: string): ResilientBuilder<T, A> {
    return new ResilientBuilder<T, A>().forDatabase(databaseName);
  },
  
  /**
   * Pattern for external API calls with retry, circuit breaker, and error classification.
   * 
   * @param serviceName - Name of the external service
   * @returns A pre-configured builder for external API calls
   */
  externalService<T = any, A extends any[] = any[]>(serviceName: string): ResilientBuilder<T, A> {
    return new ResilientBuilder<T, A>().forExternalService(serviceName);
  },
  
  /**
   * Pattern for critical operations with minimal retry and fallback.
   * 
   * @param defaultValue - Default value to return if the operation fails
   * @returns A pre-configured builder for critical operations
   */
  criticalOperation<T = any, A extends any[] = any[]>(defaultValue: T): ResilientBuilder<T, A> {
    return new ResilientBuilder<T, A>()
      .withRetry({
        maxAttempts: 2,
        backoffStrategy: 'exponential',
        baseDelay: 100,
        maxDelay: 1000,
        jitter: 0.1,
      })
      .withFallback({
        fallbackFn: (error: Error) => defaultValue,
      })
      .withErrorClassification({
        defaultType: ErrorType.TECHNICAL,
        recoveryStrategy: ErrorRecoveryStrategy.DEFAULT_BEHAVIOR,
        rethrow: false,
      });
  },
};