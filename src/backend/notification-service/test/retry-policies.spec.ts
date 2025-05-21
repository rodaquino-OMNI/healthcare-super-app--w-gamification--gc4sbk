import { Test } from '@nestjs/testing';
import {
  FixedIntervalPolicy,
  ExponentialBackoffPolicy,
  MaxAttemptsPolicy,
  CompositePolicy,
} from '../src/retry/policies';
import {
  IRetryPolicy,
  IFixedDelayOptions,
  IExponentialBackoffOptions,
  RetryStatus,
} from '../src/retry/interfaces';

describe('Retry Policies', () => {
  // Common test variables
  const transientError = new Error('Temporary network error');
  transientError.name = 'NetworkError';
  
  const permanentError = new Error('Invalid recipient');
  permanentError.name = 'ValidationError';

  describe('FixedIntervalPolicy', () => {
    let policy: FixedIntervalPolicy;
    const defaultOptions: IFixedDelayOptions = {
      maxRetries: 3,
      delay: 1000, // 1 second
      jitter: 0.1, // 10% jitter
    };

    beforeEach(() => {
      policy = new FixedIntervalPolicy(defaultOptions);
    });

    it('should calculate fixed delay between retries', () => {
      const delay1 = policy.calculateNextRetryTime(1);
      const delay2 = policy.calculateNextRetryTime(2);
      const delay3 = policy.calculateNextRetryTime(3);

      // Without jitter, all delays would be exactly 1000ms
      // With jitter of 0.1, delays should be between 900ms and 1100ms
      expect(Math.abs(delay1 - 1000)).toBeLessThanOrEqual(100);
      expect(Math.abs(delay2 - 1000)).toBeLessThanOrEqual(100);
      expect(Math.abs(delay3 - 1000)).toBeLessThanOrEqual(100);
    });

    it('should respect maximum retry attempts', () => {
      expect(policy.shouldRetry(transientError, 1)).toBe(true);
      expect(policy.shouldRetry(transientError, 2)).toBe(true);
      expect(policy.shouldRetry(transientError, 3)).toBe(true);
      expect(policy.shouldRetry(transientError, 4)).toBe(false); // Exceeds maxRetries
    });

    it('should apply jitter within expected range', () => {
      // Test with 100 samples to ensure jitter is applied correctly
      const samples = Array.from({ length: 100 }, () => policy.calculateNextRetryTime(1));
      
      // All samples should be within jitter range
      samples.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(900); // 1000 - 10%
        expect(delay).toBeLessThanOrEqual(1100); // 1000 + 10%
      });
      
      // At least some samples should be different (jitter is applied)
      const uniqueDelays = new Set(samples);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('should make appropriate retry decisions based on error types', () => {
      // Transient errors should be retried
      expect(policy.shouldRetry(transientError, 1)).toBe(true);
      
      // Permanent errors should not be retried
      expect(policy.shouldRetry(permanentError, 1)).toBe(false);
    });

    it('should return policy name', () => {
      expect(policy.getName()).toBe('FixedIntervalPolicy');
    });

    it('should handle zero jitter configuration', () => {
      const noJitterPolicy = new FixedIntervalPolicy({
        ...defaultOptions,
        jitter: 0,
      });
      
      // With no jitter, all delays should be exactly 1000ms
      const samples = Array.from({ length: 10 }, () => noJitterPolicy.calculateNextRetryTime(1));
      samples.forEach(delay => {
        expect(delay).toBe(1000);
      });
    });

    it('should handle invalid retry attempt numbers', () => {
      // Negative attempt numbers should be treated as first attempt
      expect(policy.calculateNextRetryTime(-1)).toBeGreaterThanOrEqual(900);
      expect(policy.calculateNextRetryTime(-1)).toBeLessThanOrEqual(1100);
      
      // Zero attempt should be treated as first attempt
      expect(policy.calculateNextRetryTime(0)).toBeGreaterThanOrEqual(900);
      expect(policy.calculateNextRetryTime(0)).toBeLessThanOrEqual(1100);
    });
  });

  describe('ExponentialBackoffPolicy', () => {
    let policy: ExponentialBackoffPolicy;
    const defaultOptions: IExponentialBackoffOptions = {
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffFactor: 2,
      jitter: 0.1, // 10% jitter
    };

    beforeEach(() => {
      policy = new ExponentialBackoffPolicy(defaultOptions);
    });

    it('should calculate exponentially increasing delays', () => {
      // Expected delays without jitter:
      // Attempt 1: 1000ms
      // Attempt 2: 2000ms (1000 * 2^1)
      // Attempt 3: 4000ms (1000 * 2^2)
      const delay1 = policy.calculateNextRetryTime(1);
      const delay2 = policy.calculateNextRetryTime(2);
      const delay3 = policy.calculateNextRetryTime(3);

      // With jitter of 0.1, delays should be within 10% of expected values
      expect(Math.abs(delay1 - 1000)).toBeLessThanOrEqual(100);
      expect(Math.abs(delay2 - 2000)).toBeLessThanOrEqual(200);
      expect(Math.abs(delay3 - 4000)).toBeLessThanOrEqual(400);
      
      // Each delay should be approximately double the previous one
      expect(delay2).toBeGreaterThan(delay1 * 1.8); // Allow for jitter
      expect(delay3).toBeGreaterThan(delay2 * 1.8); // Allow for jitter
    });

    it('should respect maximum retry attempts', () => {
      expect(policy.shouldRetry(transientError, 1)).toBe(true);
      expect(policy.shouldRetry(transientError, 2)).toBe(true);
      expect(policy.shouldRetry(transientError, 3)).toBe(true);
      expect(policy.shouldRetry(transientError, 4)).toBe(false); // Exceeds maxRetries
    });

    it('should apply jitter within expected range', () => {
      // Test with attempt 2, expected delay without jitter is 2000ms
      const samples = Array.from({ length: 100 }, () => policy.calculateNextRetryTime(2));
      
      // All samples should be within jitter range
      samples.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(1800); // 2000 - 10%
        expect(delay).toBeLessThanOrEqual(2200); // 2000 + 10%
      });
      
      // At least some samples should be different (jitter is applied)
      const uniqueDelays = new Set(samples);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('should respect maximum delay cap', () => {
      // Create a policy with a low max delay to test the cap
      const cappedPolicy = new ExponentialBackoffPolicy({
        ...defaultOptions,
        maxDelay: 3000, // 3 seconds
      });
      
      // Attempt 3 would normally be 4000ms (1000 * 2^2), but should be capped at 3000ms
      const delay = cappedPolicy.calculateNextRetryTime(3);
      
      // With jitter of 0.1, delay should be between 2700ms and 3000ms
      // Note: When capped, jitter only reduces the delay, never increases it beyond the cap
      expect(delay).toBeGreaterThanOrEqual(2700); // 3000 - 10%
      expect(delay).toBeLessThanOrEqual(3000); // Capped at maxDelay
    });

    it('should make appropriate retry decisions based on error types', () => {
      // Transient errors should be retried
      expect(policy.shouldRetry(transientError, 1)).toBe(true);
      
      // Permanent errors should not be retried
      expect(policy.shouldRetry(permanentError, 1)).toBe(false);
    });

    it('should return policy name', () => {
      expect(policy.getName()).toBe('ExponentialBackoffPolicy');
    });

    it('should handle custom backoff factors', () => {
      const customPolicy = new ExponentialBackoffPolicy({
        ...defaultOptions,
        backoffFactor: 3, // Triple instead of double
        jitter: 0, // No jitter for easier testing
      });
      
      // Expected delays:
      // Attempt 1: 1000ms
      // Attempt 2: 3000ms (1000 * 3^1)
      // Attempt 3: 9000ms (1000 * 3^2)
      expect(customPolicy.calculateNextRetryTime(1)).toBe(1000);
      expect(customPolicy.calculateNextRetryTime(2)).toBe(3000);
      expect(customPolicy.calculateNextRetryTime(3)).toBe(9000);
    });
  });

  describe('MaxAttemptsPolicy', () => {
    let policy: MaxAttemptsPolicy;
    
    beforeEach(() => {
      policy = new MaxAttemptsPolicy({ maxRetries: 3 });
    });

    it('should respect maximum retry attempts', () => {
      expect(policy.shouldRetry(transientError, 1)).toBe(true);
      expect(policy.shouldRetry(transientError, 2)).toBe(true);
      expect(policy.shouldRetry(transientError, 3)).toBe(true);
      expect(policy.shouldRetry(transientError, 4)).toBe(false); // Exceeds maxRetries
    });

    it('should make appropriate retry decisions based on error types', () => {
      // Transient errors should be retried
      expect(policy.shouldRetry(transientError, 1)).toBe(true);
      
      // Permanent errors should not be retried
      expect(policy.shouldRetry(permanentError, 1)).toBe(false);
    });

    it('should return policy name', () => {
      expect(policy.getName()).toBe('MaxAttemptsPolicy');
    });

    it('should return zero delay for all attempts', () => {
      // MaxAttemptsPolicy doesn't modify delay times
      expect(policy.calculateNextRetryTime(1)).toBe(0);
      expect(policy.calculateNextRetryTime(2)).toBe(0);
      expect(policy.calculateNextRetryTime(3)).toBe(0);
    });
  });

  describe('CompositePolicy', () => {
    let compositePolicy: CompositePolicy;
    let fixedPolicy: FixedIntervalPolicy;
    let exponentialPolicy: ExponentialBackoffPolicy;
    let maxAttemptsPolicy: MaxAttemptsPolicy;
    
    beforeEach(() => {
      fixedPolicy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000,
        jitter: 0,
      });
      
      exponentialPolicy = new ExponentialBackoffPolicy({
        maxRetries: 5,
        initialDelay: 2000,
        maxDelay: 30000,
        backoffFactor: 2,
        jitter: 0,
      });
      
      maxAttemptsPolicy = new MaxAttemptsPolicy({ maxRetries: 2 });
      
      compositePolicy = new CompositePolicy();
    });

    it('should delegate to appropriate child policy based on error type', () => {
      // Register policies for different error types
      compositePolicy.registerPolicy('NetworkError', exponentialPolicy);
      compositePolicy.registerPolicy('RateLimitError', fixedPolicy);
      
      // Create test errors
      const networkError = new Error('Network timeout');
      networkError.name = 'NetworkError';
      
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      
      // NetworkError should use exponential policy
      expect(compositePolicy.calculateNextRetryTime(1, networkError))
        .toBe(exponentialPolicy.calculateNextRetryTime(1));
      
      // RateLimitError should use fixed policy
      expect(compositePolicy.calculateNextRetryTime(1, rateLimitError))
        .toBe(fixedPolicy.calculateNextRetryTime(1));
      
      // Retry decisions should also be delegated
      expect(compositePolicy.shouldRetry(networkError, 5)).toBe(true); // exponentialPolicy allows 5 retries
      expect(compositePolicy.shouldRetry(networkError, 6)).toBe(false); // exceeds exponentialPolicy maxRetries
      
      expect(compositePolicy.shouldRetry(rateLimitError, 3)).toBe(true); // fixedPolicy allows 3 retries
      expect(compositePolicy.shouldRetry(rateLimitError, 4)).toBe(false); // exceeds fixedPolicy maxRetries
    });

    it('should use fallback policy when no specific policy matches', () => {
      // Register specific policy and fallback
      compositePolicy.registerPolicy('NetworkError', exponentialPolicy);
      compositePolicy.setFallbackPolicy(fixedPolicy);
      
      // Create test error that doesn't match any registered type
      const unknownError = new Error('Unknown error');
      unknownError.name = 'UnknownError';
      
      // Should use fallback policy for unknown error type
      expect(compositePolicy.calculateNextRetryTime(1, unknownError))
        .toBe(fixedPolicy.calculateNextRetryTime(1));
      
      expect(compositePolicy.shouldRetry(unknownError, 3)).toBe(true); // fixedPolicy allows 3 retries
      expect(compositePolicy.shouldRetry(unknownError, 4)).toBe(false); // exceeds fixedPolicy maxRetries
    });

    it('should handle policy registration and selection', () => {
      // Register multiple policies
      compositePolicy.registerPolicy('NetworkError', exponentialPolicy);
      compositePolicy.registerPolicy('RateLimitError', fixedPolicy);
      compositePolicy.registerPolicy('ValidationError', maxAttemptsPolicy);
      
      // Verify registered policies
      expect(compositePolicy.getPolicyForErrorType('NetworkError')).toBe(exponentialPolicy);
      expect(compositePolicy.getPolicyForErrorType('RateLimitError')).toBe(fixedPolicy);
      expect(compositePolicy.getPolicyForErrorType('ValidationError')).toBe(maxAttemptsPolicy);
      
      // Unknown error type should return undefined if no fallback is set
      expect(compositePolicy.getPolicyForErrorType('UnknownError')).toBeUndefined();
      
      // Set and verify fallback policy
      compositePolicy.setFallbackPolicy(fixedPolicy);
      expect(compositePolicy.getPolicyForErrorType('UnknownError')).toBe(fixedPolicy);
    });

    it('should return policy name', () => {
      expect(compositePolicy.getName()).toBe('CompositePolicy');
    });

    it('should handle errors with no name property', () => {
      compositePolicy.registerPolicy('Error', fixedPolicy); // Register for generic Error
      compositePolicy.setFallbackPolicy(exponentialPolicy);
      
      // Create error without name property
      const genericError = new Error('Generic error');
      delete (genericError as any).name;
      
      // Should use policy registered for 'Error'
      expect(compositePolicy.calculateNextRetryTime(1, genericError))
        .toBe(fixedPolicy.calculateNextRetryTime(1));
    });

    it('should throw error when no policy is available for an error type', () => {
      // Don't register any policies or fallback
      const unknownError = new Error('Unknown error');
      unknownError.name = 'UnknownError';
      
      // Should throw when trying to calculate retry time with no matching policy
      expect(() => {
        compositePolicy.calculateNextRetryTime(1, unknownError);
      }).toThrow('No retry policy available for error type: UnknownError');
      
      // Should return false for shouldRetry with no matching policy
      expect(compositePolicy.shouldRetry(unknownError, 1)).toBe(false);
    });
  });

  // Integration tests for policy combinations
  describe('Policy Integration', () => {
    it('should combine MaxAttemptsPolicy with ExponentialBackoffPolicy', () => {
      // Create a composite policy
      const compositePolicy = new CompositePolicy();
      
      // Create individual policies
      const maxAttemptsPolicy = new MaxAttemptsPolicy({ maxRetries: 2 });
      const exponentialPolicy = new ExponentialBackoffPolicy({
        maxRetries: 5, // This would allow 5 retries
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        jitter: 0,
      });
      
      // Register policies
      compositePolicy.registerPolicy('NetworkError', exponentialPolicy);
      
      // Create test error
      const networkError = new Error('Network timeout');
      networkError.name = 'NetworkError';
      
      // Verify exponential delay calculation
      expect(compositePolicy.calculateNextRetryTime(1, networkError)).toBe(1000);
      expect(compositePolicy.calculateNextRetryTime(2, networkError)).toBe(2000);
      
      // Verify retry decision based on exponential policy
      expect(compositePolicy.shouldRetry(networkError, 1)).toBe(true);
      expect(compositePolicy.shouldRetry(networkError, 5)).toBe(true);
      expect(compositePolicy.shouldRetry(networkError, 6)).toBe(false); // Exceeds maxRetries
      
      // Now add MaxAttemptsPolicy as a wrapper
      const limitedCompositePolicy = new CompositePolicy();
      limitedCompositePolicy.registerPolicy('NetworkError', maxAttemptsPolicy);
      
      // The MaxAttemptsPolicy should limit retries to 2 attempts
      expect(limitedCompositePolicy.shouldRetry(networkError, 1)).toBe(true);
      expect(limitedCompositePolicy.shouldRetry(networkError, 2)).toBe(true);
      expect(limitedCompositePolicy.shouldRetry(networkError, 3)).toBe(false); // Exceeds maxRetries of MaxAttemptsPolicy
    });
  });
});