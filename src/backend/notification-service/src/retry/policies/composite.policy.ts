import { Injectable, Logger } from '@nestjs/common';
import { IRetryPolicy } from '../interfaces/retry-policy.interface';
import { RetryStatus } from '../interfaces/retry-status.enum';

/**
 * Interface for policy selector functions that determine which policy to use based on error
 */
export type PolicySelector = (error: Error, context?: Record<string, any>) => boolean;

/**
 * Interface for policy registration with optional selector function
 */
export interface PolicyRegistration {
  policy: IRetryPolicy;
  selector?: PolicySelector;
  errorTypes?: Array<string | Function>;
}

/**
 * A composite retry policy that combines multiple retry policies and selects
 * between them based on error types or custom conditions.
 *
 * This policy acts as an orchestrator that delegates to child policies for retry
 * decisions and timing calculations, enabling sophisticated retry strategies
 * tailored to different error scenarios.
 *
 * Example use cases:
 * - Use exponential backoff for network errors
 * - Use fixed interval for rate-limiting errors
 * - Use a maximum attempts policy for client errors
 */
@Injectable()
export class CompositePolicy implements IRetryPolicy {
  private readonly logger = new Logger(CompositePolicy.name);
  private readonly policies: PolicyRegistration[] = [];
  private fallbackPolicy: IRetryPolicy | null = null;

  /**
   * Creates a new CompositePolicy instance
   * 
   * @param name Optional name for this policy instance
   */
  constructor(private readonly name: string = 'CompositePolicy') {}

  /**
   * Registers a policy with an optional selector function or error types
   * 
   * @param policy The retry policy to register
   * @param selectorOrErrorTypes A function that determines when to use this policy or an array of error types
   * @returns This CompositePolicy instance for method chaining
   */
  registerPolicy(
    policy: IRetryPolicy,
    selectorOrErrorTypes?: PolicySelector | Array<string | Function>,
  ): CompositePolicy {
    if (!policy) {
      throw new Error('Policy cannot be null or undefined');
    }

    if (Array.isArray(selectorOrErrorTypes)) {
      // Handle array of error types
      const errorTypes = selectorOrErrorTypes;
      this.policies.push({
        policy,
        errorTypes,
        selector: (error: Error) => {
          return errorTypes.some(errorType => {
            if (typeof errorType === 'string') {
              return error.name === errorType || error.constructor.name === errorType;
            } else if (typeof errorType === 'function') {
              return error instanceof errorType;
            }
            return false;
          });
        },
      });
    } else if (typeof selectorOrErrorTypes === 'function') {
      // Handle selector function
      this.policies.push({
        policy,
        selector: selectorOrErrorTypes,
      });
    } else if (selectorOrErrorTypes === undefined) {
      // No selector provided, this policy will match all errors
      this.policies.push({ policy });
    } else {
      throw new Error('Invalid selector type. Must be a function or array of error types');
    }

    return this;
  }

  /**
   * Sets a fallback policy to use when no registered policy matches
   * 
   * @param policy The fallback retry policy
   * @returns This CompositePolicy instance for method chaining
   */
  setFallbackPolicy(policy: IRetryPolicy): CompositePolicy {
    if (!policy) {
      throw new Error('Fallback policy cannot be null or undefined');
    }
    
    this.fallbackPolicy = policy;
    return this;
  }

  /**
   * Determines if a retry should be attempted based on the error and context
   * by delegating to the appropriate child policy
   * 
   * @param error The error that occurred
   * @param attemptNumber The current attempt number (1-based)
   * @param context Additional context for retry decision
   * @returns Whether a retry should be attempted
   */
  shouldRetry(error: Error, attemptNumber: number, context?: Record<string, any>): boolean {
    const policy = this.selectPolicy(error, context);
    
    if (!policy) {
      this.logger.warn(
        `No matching policy found for error type ${error.constructor.name} and no fallback policy set`,
      );
      return false;
    }

    return policy.shouldRetry(error, attemptNumber, context);
  }

  /**
   * Calculates the next retry time by delegating to the appropriate child policy
   * 
   * @param error The error that occurred
   * @param attemptNumber The current attempt number (1-based)
   * @param context Additional context for retry calculation
   * @returns The time in milliseconds to wait before the next retry
   */
  calculateNextRetryTime(error: Error, attemptNumber: number, context?: Record<string, any>): number {
    const policy = this.selectPolicy(error, context);
    
    if (!policy) {
      this.logger.warn(
        `No matching policy found for error type ${error.constructor.name} and no fallback policy set`,
      );
      return -1; // Indicate no retry
    }

    return policy.calculateNextRetryTime(error, attemptNumber, context);
  }

  /**
   * Gets the maximum number of retry attempts by delegating to the appropriate child policy
   * 
   * @param error The error that occurred
   * @param context Additional context for retry decision
   * @returns The maximum number of retry attempts
   */
  getMaxRetryAttempts(error: Error, context?: Record<string, any>): number {
    const policy = this.selectPolicy(error, context);
    
    if (!policy) {
      this.logger.warn(
        `No matching policy found for error type ${error.constructor.name} and no fallback policy set`,
      );
      return 0; // No retries
    }

    return policy.getMaxRetryAttempts(error, context);
  }

  /**
   * Determines the retry status by delegating to the appropriate child policy
   * 
   * @param error The error that occurred
   * @param attemptNumber The current attempt number (1-based)
   * @param context Additional context for status determination
   * @returns The retry status
   */
  getRetryStatus(error: Error, attemptNumber: number, context?: Record<string, any>): RetryStatus {
    const policy = this.selectPolicy(error, context);
    
    if (!policy) {
      this.logger.warn(
        `No matching policy found for error type ${error.constructor.name} and no fallback policy set`,
      );
      return RetryStatus.EXHAUSTED;
    }

    return policy.getRetryStatus(error, attemptNumber, context);
  }

  /**
   * Gets the name of this policy
   * 
   * @returns The policy name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Selects the appropriate policy based on the error and context
   * 
   * @param error The error that occurred
   * @param context Additional context for policy selection
   * @returns The selected policy or fallback policy, or null if none match
   * @private
   */
  private selectPolicy(error: Error, context?: Record<string, any>): IRetryPolicy | null {
    // Log the error type for debugging
    this.logger.debug(
      `Selecting policy for error type: ${error.constructor.name}`,
    );

    // Find the first policy with a matching selector
    for (const registration of this.policies) {
      if (!registration.selector || registration.selector(error, context)) {
        this.logger.debug(
          `Selected policy: ${registration.policy.getName()}`,
        );
        return registration.policy;
      }
    }

    // If no policy matches, use the fallback policy
    if (this.fallbackPolicy) {
      this.logger.debug(
        `Using fallback policy: ${this.fallbackPolicy.getName()}`,
      );
      return this.fallbackPolicy;
    }

    // No matching policy and no fallback
    return null;
  }

  /**
   * Creates a composite policy with common error type classifications
   * 
   * @param networkPolicy Policy for network-related errors
   * @param rateLimitPolicy Policy for rate limiting errors
   * @param serverErrorPolicy Policy for server errors
   * @param clientErrorPolicy Policy for client errors
   * @param fallbackPolicy Fallback policy when no specific policy matches
   * @returns A configured CompositePolicy instance
   */
  static createWithErrorTypes(
    networkPolicy: IRetryPolicy,
    rateLimitPolicy: IRetryPolicy,
    serverErrorPolicy: IRetryPolicy,
    clientErrorPolicy: IRetryPolicy,
    fallbackPolicy: IRetryPolicy,
  ): CompositePolicy {
    const policy = new CompositePolicy('ErrorTypeCompositePolicy');

    // Network errors (connection timeouts, DNS failures, etc.)
    policy.registerPolicy(networkPolicy, [
      'NetworkError',
      'ConnectionError',
      'TimeoutError',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
    ]);

    // Rate limiting errors
    policy.registerPolicy(rateLimitPolicy, [
      'RateLimitError',
      'TooManyRequestsError',
      'ThrottlingError',
    ]);

    // Server errors (5xx)
    policy.registerPolicy(serverErrorPolicy, (error: Error) => {
      const statusCode = (error as any).statusCode || (error as any).status;
      return statusCode >= 500 && statusCode < 600;
    });

    // Client errors (4xx)
    policy.registerPolicy(clientErrorPolicy, (error: Error) => {
      const statusCode = (error as any).statusCode || (error as any).status;
      return statusCode >= 400 && statusCode < 500;
    });

    // Fallback policy
    policy.setFallbackPolicy(fallbackPolicy);

    return policy;
  }

  /**
   * Creates a composite policy for notification delivery with channel-specific policies
   * 
   * @param pushPolicy Policy for push notification errors
   * @param emailPolicy Policy for email notification errors
   * @param smsPolicy Policy for SMS notification errors
   * @param inAppPolicy Policy for in-app notification errors
   * @param fallbackPolicy Fallback policy when no specific policy matches
   * @returns A configured CompositePolicy instance
   */
  static createForNotificationChannels(
    pushPolicy: IRetryPolicy,
    emailPolicy: IRetryPolicy,
    smsPolicy: IRetryPolicy,
    inAppPolicy: IRetryPolicy,
    fallbackPolicy: IRetryPolicy,
  ): CompositePolicy {
    const policy = new CompositePolicy('NotificationChannelCompositePolicy');

    // Push notification errors
    policy.registerPolicy(pushPolicy, (error: Error, context?: Record<string, any>) => {
      return context?.channel === 'push';
    });

    // Email notification errors
    policy.registerPolicy(emailPolicy, (error: Error, context?: Record<string, any>) => {
      return context?.channel === 'email';
    });

    // SMS notification errors
    policy.registerPolicy(smsPolicy, (error: Error, context?: Record<string, any>) => {
      return context?.channel === 'sms';
    });

    // In-app notification errors
    policy.registerPolicy(inAppPolicy, (error: Error, context?: Record<string, any>) => {
      return context?.channel === 'in-app';
    });

    // Fallback policy
    policy.setFallbackPolicy(fallbackPolicy);

    return policy;
  }
}