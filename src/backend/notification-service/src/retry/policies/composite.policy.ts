import { IRetryPolicy } from '../interfaces/retry-policy.interface';
import { IRetryOptions } from '../interfaces/retry-options.interface';
import { RetryStatus } from '../interfaces/retry-status.enum';

/**
 * A composite retry policy that combines multiple retry policies and selects
 * between them based on error types or other conditions.
 * 
 * This policy delegates to its child policies for retry decisions and timing calculations,
 * enabling sophisticated retry strategies tailored to different error scenarios.
 * 
 * Example usage:
 * ```typescript
 * // Create a composite policy
 * const compositePolicy = new CompositePolicy();
 * 
 * // Add policies for specific error types
 * compositePolicy.addPolicy('network', exponentialBackoffPolicy);
 * compositePolicy.addPolicy('rate-limit', fixedIntervalPolicy);
 * 
 * // Set a default policy for unmatched error types
 * compositePolicy.setDefaultPolicy(maxAttemptsPolicy);
 * ```
 */
export class CompositePolicy implements IRetryPolicy {
  private readonly policies = new Map<string, IRetryPolicy>();
  private defaultPolicy: IRetryPolicy | null = null;
  private readonly name = 'composite';

  /**
   * Adds a policy to the composite for a specific error type.
   * 
   * @param errorType - The error type or category this policy should handle
   * @param policy - The retry policy to use for this error type
   * @returns The composite policy instance for method chaining
   */
  addPolicy(errorType: string, policy: IRetryPolicy): CompositePolicy {
    this.policies.set(errorType.toLowerCase(), policy);
    return this;
  }

  /**
   * Sets the default policy to use when no specific policy matches the error type.
   * 
   * @param policy - The default retry policy
   * @returns The composite policy instance for method chaining
   */
  setDefaultPolicy(policy: IRetryPolicy): CompositePolicy {
    this.defaultPolicy = policy;
    return this;
  }

  /**
   * Gets the appropriate policy for a given error.
   * 
   * @param error - The error to find a policy for
   * @returns The matching policy or the default policy
   * @throws Error if no matching policy is found and no default policy is set
   * @private
   */
  private getPolicyForError(error: Error): IRetryPolicy {
    // Try to match by error name
    if (error.name) {
      const policy = this.policies.get(error.name.toLowerCase());
      if (policy) {
        return policy;
      }
    }

    // Try to match by error type in the message
    for (const [errorType, policy] of this.policies.entries()) {
      if (error.message.toLowerCase().includes(errorType)) {
        return policy;
      }
    }

    // Use default policy if available
    if (this.defaultPolicy) {
      return this.defaultPolicy;
    }

    // If no policy is found and no default is set, throw an error
    throw new Error(`No retry policy found for error: ${error.name || 'Unknown'} and no default policy is set`);
  }

  /**
   * Calculates the next retry time based on the appropriate policy for the error.
   * 
   * @param attemptCount - The current attempt count (0-based)
   * @param options - Retry options
   * @param error - The error that triggered the retry
   * @returns The timestamp for the next retry attempt
   */
  calculateNextRetryTime(attemptCount: number, options: IRetryOptions, error?: Error): number {
    if (!error) {
      // If no error is provided, use the default policy
      return this.defaultPolicy
        ? this.defaultPolicy.calculateNextRetryTime(attemptCount, options)
        : Date.now() + 1000; // Default to 1 second if no policy is available
    }

    try {
      const policy = this.getPolicyForError(error);
      return policy.calculateNextRetryTime(attemptCount, options, error);
    } catch (policyError) {
      // If we can't find a policy, use a simple exponential backoff
      const baseDelay = options.initialDelay || 1000;
      const maxDelay = options.maxDelay || 60000;
      const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
      
      return Date.now() + delay;
    }
  }

  /**
   * Determines if a retry should be attempted based on the appropriate policy for the error.
   * 
   * @param error - The error that triggered the retry
   * @param attemptCount - The current attempt count (0-based)
   * @param options - Retry options
   * @returns True if a retry should be attempted, false otherwise
   */
  shouldRetry(error: Error, attemptCount: number, options: IRetryOptions): boolean {
    try {
      const policy = this.getPolicyForError(error);
      return policy.shouldRetry(error, attemptCount, options);
    } catch (policyError) {
      // If we can't find a policy, use a simple max attempts check
      const maxRetries = options.maxRetries || 3;
      return attemptCount < maxRetries;
    }
  }

  /**
   * Gets the name of this policy.
   * 
   * @returns The policy name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Gets all registered error types and their associated policies.
   * 
   * @returns A record of error types and policy names
   */
  getRegisteredPolicies(): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [errorType, policy] of this.policies.entries()) {
      result[errorType] = policy.getName();
    }
    
    if (this.defaultPolicy) {
      result['default'] = this.defaultPolicy.getName();
    }
    
    return result;
  }

  /**
   * Classifies an error into a known error type that can be handled by a specific policy.
   * 
   * @param error - The error to classify
   * @returns The error type classification
   */
  classifyError(error: Error): string {
    // Check for network errors
    if (
      error.name === 'NetworkError' ||
      error.name === 'FetchError' ||
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    ) {
      return 'network';
    }

    // Check for rate limiting errors
    if (
      error.name === 'RateLimitError' ||
      error.message.includes('rate limit') ||
      error.message.includes('throttle') ||
      error.message.includes('429') ||
      error.message.includes('too many requests')
    ) {
      return 'rate-limit';
    }

    // Check for service unavailable errors
    if (
      error.name === 'ServiceUnavailableError' ||
      error.message.includes('service unavailable') ||
      error.message.includes('503') ||
      error.message.includes('unavailable')
    ) {
      return 'service-unavailable';
    }

    // Check for authentication errors
    if (
      error.name === 'AuthenticationError' ||
      error.message.includes('authentication') ||
      error.message.includes('unauthorized') ||
      error.message.includes('401')
    ) {
      return 'authentication';
    }

    // Check for permission errors
    if (
      error.name === 'PermissionError' ||
      error.message.includes('permission') ||
      error.message.includes('forbidden') ||
      error.message.includes('403')
    ) {
      return 'permission';
    }

    // Check for validation errors
    if (
      error.name === 'ValidationError' ||
      error.message.includes('validation') ||
      error.message.includes('invalid') ||
      error.message.includes('400')
    ) {
      return 'validation';
    }

    // Check for database errors
    if (
      error.name === 'DatabaseError' ||
      error.message.includes('database') ||
      error.message.includes('sql') ||
      error.message.includes('query')
    ) {
      return 'database';
    }

    // Default classification
    return 'unknown';
  }

  /**
   * Creates a policy selector function that can be used to dynamically select
   * policies based on custom logic.
   * 
   * @param selectorFn - A function that takes an error and returns a policy name
   * @returns A new composite policy that uses the selector function
   */
  static withSelector(
    selectorFn: (error: Error) => string,
    policies: Record<string, IRetryPolicy>,
    defaultPolicy?: IRetryPolicy
  ): CompositePolicy {
    const composite = new CompositePolicy();
    
    // Register all provided policies
    for (const [name, policy] of Object.entries(policies)) {
      composite.addPolicy(name, policy);
    }
    
    // Set the default policy if provided
    if (defaultPolicy) {
      composite.setDefaultPolicy(defaultPolicy);
    }
    
    // Override the getPolicyForError method to use the selector function
    const originalGetPolicyForError = composite.getPolicyForError.bind(composite);
    composite.getPolicyForError = (error: Error): IRetryPolicy => {
      try {
        const policyName = selectorFn(error);
        const policy = composite.policies.get(policyName.toLowerCase());
        
        if (policy) {
          return policy;
        }
        
        // Fall back to the original implementation if the selector doesn't match
        return originalGetPolicyForError(error);
      } catch (selectorError) {
        // If the selector throws, fall back to the original implementation
        return originalGetPolicyForError(error);
      }
    };
    
    return composite;
  }

  /**
   * Creates a composite policy with journey-specific policies.
   * 
   * @param journeyPolicies - A record mapping journey names to retry policies
   * @param defaultPolicy - The default policy to use when no journey-specific policy matches
   * @returns A new composite policy configured for journey-specific retry handling
   */
  static forJourneys(
    journeyPolicies: Record<string, IRetryPolicy>,
    defaultPolicy: IRetryPolicy
  ): CompositePolicy {
    const composite = new CompositePolicy();
    
    // Register journey-specific policies
    for (const [journey, policy] of Object.entries(journeyPolicies)) {
      composite.addPolicy(journey, policy);
    }
    
    // Set the default policy
    composite.setDefaultPolicy(defaultPolicy);
    
    return composite;
  }

  /**
   * Creates a composite policy with channel-specific policies.
   * 
   * @param channelPolicies - A record mapping channel names to retry policies
   * @param defaultPolicy - The default policy to use when no channel-specific policy matches
   * @returns A new composite policy configured for channel-specific retry handling
   */
  static forChannels(
    channelPolicies: Record<string, IRetryPolicy>,
    defaultPolicy: IRetryPolicy
  ): CompositePolicy {
    const composite = new CompositePolicy();
    
    // Register channel-specific policies
    for (const [channel, policy] of Object.entries(channelPolicies)) {
      composite.addPolicy(channel, policy);
    }
    
    // Set the default policy
    composite.setDefaultPolicy(defaultPolicy);
    
    return composite;
  }
}