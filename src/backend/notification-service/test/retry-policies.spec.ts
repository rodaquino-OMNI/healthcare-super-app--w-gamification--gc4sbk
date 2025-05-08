import { 
  FixedIntervalPolicy, 
  ExponentialBackoffPolicy, 
  MaxAttemptsPolicy, 
  CompositePolicy 
} from '../src/retry/policies';
import { RetryStatus } from '../src/retry/interfaces/retry-status.enum';
import { IRetryPolicy } from '../src/retry/interfaces/retry-policy.interface';

describe('Retry Policies', () => {
  // Common test variables
  const transientError = new Error('Temporary network error');
  transientError.name = 'NetworkError';
  
  const permanentError = new Error('Invalid recipient');
  permanentError.name = 'ValidationError';
  
  const defaultContext = {
    notificationId: '123e4567-e89b-12d3-a456-426614174000',
    channel: 'email',
    attemptsMade: 0
  };

  describe('FixedIntervalPolicy', () => {
    it('should calculate fixed delay between retries', () => {
      // Arrange
      const policy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000, // 1 second
        jitter: 0 // No jitter for deterministic testing
      });
      
      // Act
      const delay1 = policy.calculateNextRetryTime(defaultContext);
      const delay2 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 1 });
      const delay3 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 2 });
      
      // Assert
      expect(delay1).toBe(1000);
      expect(delay2).toBe(1000);
      expect(delay3).toBe(1000);
    });

    it('should apply jitter within the specified range', () => {
      // Arrange
      const policy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000,
        jitter: 0.2 // 20% jitter
      });
      
      // Act
      const delay = policy.calculateNextRetryTime(defaultContext);
      
      // Assert
      expect(delay).toBeGreaterThanOrEqual(800); // 1000 - 20%
      expect(delay).toBeLessThanOrEqual(1200); // 1000 + 20%
    });

    it('should respect maximum retry attempts', () => {
      // Arrange
      const policy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000
      });
      
      // Act & Assert
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 0 }, transientError)).toBe(true);
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 2 }, transientError)).toBe(true);
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 3 }, transientError)).toBe(false);
    });

    it('should return PENDING status for retryable errors within max attempts', () => {
      // Arrange
      const policy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000
      });
      
      // Act
      const status = policy.getRetryStatus({ ...defaultContext, attemptsMade: 1 }, transientError);
      
      // Assert
      expect(status).toBe(RetryStatus.PENDING);
    });

    it('should return EXHAUSTED status when max attempts reached', () => {
      // Arrange
      const policy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000
      });
      
      // Act
      const status = policy.getRetryStatus({ ...defaultContext, attemptsMade: 3 }, transientError);
      
      // Assert
      expect(status).toBe(RetryStatus.EXHAUSTED);
    });

    it('should return FAILED status for non-retryable errors', () => {
      // Arrange
      const policy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000
      });
      
      // Act
      const status = policy.getRetryStatus(defaultContext, permanentError);
      
      // Assert
      expect(status).toBe(RetryStatus.FAILED);
    });

    it('should have a descriptive name', () => {
      // Arrange
      const policy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000
      });
      
      // Act & Assert
      expect(policy.getName()).toBe('FixedIntervalPolicy');
    });
  });

  describe('ExponentialBackoffPolicy', () => {
    it('should calculate exponentially increasing delays', () => {
      // Arrange
      const policy = new ExponentialBackoffPolicy({
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
        jitter: 0 // No jitter for deterministic testing
      });
      
      // Act
      const delay1 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 0 });
      const delay2 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 1 });
      const delay3 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 2 });
      const delay4 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 3 });
      
      // Assert
      expect(delay1).toBe(1000); // initialDelay * (backoffFactor^0)
      expect(delay2).toBe(2000); // initialDelay * (backoffFactor^1)
      expect(delay3).toBe(4000); // initialDelay * (backoffFactor^2)
      expect(delay4).toBe(8000); // initialDelay * (backoffFactor^3)
    });

    it('should respect maximum delay cap', () => {
      // Arrange
      const policy = new ExponentialBackoffPolicy({
        maxRetries: 10,
        initialDelay: 1000,
        maxDelay: 5000, // Cap at 5 seconds
        backoffFactor: 2,
        jitter: 0
      });
      
      // Act
      const delay1 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 0 });
      const delay2 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 1 });
      const delay3 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 2 });
      const delay4 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 3 });
      const delay5 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 4 });
      
      // Assert
      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
      expect(delay4).toBe(5000); // Capped at maxDelay
      expect(delay5).toBe(5000); // Still capped at maxDelay
    });

    it('should apply jitter within the specified range', () => {
      // Arrange
      const policy = new ExponentialBackoffPolicy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        jitter: 0.2 // 20% jitter
      });
      
      // Act
      const baseDelay = 1000; // initialDelay * (backoffFactor^0)
      const delay = policy.calculateNextRetryTime(defaultContext);
      
      // Assert
      expect(delay).toBeGreaterThanOrEqual(baseDelay * 0.8); // 1000 - 20%
      expect(delay).toBeLessThanOrEqual(baseDelay * 1.2); // 1000 + 20%
    });

    it('should respect maximum retry attempts', () => {
      // Arrange
      const policy = new ExponentialBackoffPolicy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2
      });
      
      // Act & Assert
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 0 }, transientError)).toBe(true);
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 2 }, transientError)).toBe(true);
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 3 }, transientError)).toBe(false);
    });

    it('should handle custom backoff factors', () => {
      // Arrange
      const policy = new ExponentialBackoffPolicy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 3, // Using 3 instead of default 2
        jitter: 0
      });
      
      // Act
      const delay1 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 0 });
      const delay2 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 1 });
      const delay3 = policy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 2 });
      
      // Assert
      expect(delay1).toBe(1000); // initialDelay * (backoffFactor^0)
      expect(delay2).toBe(3000); // initialDelay * (backoffFactor^1)
      expect(delay3).toBe(9000); // initialDelay * (backoffFactor^2)
    });

    it('should have a descriptive name', () => {
      // Arrange
      const policy = new ExponentialBackoffPolicy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2
      });
      
      // Act & Assert
      expect(policy.getName()).toBe('ExponentialBackoffPolicy');
    });
  });

  describe('MaxAttemptsPolicy', () => {
    it('should only enforce maximum retry attempts without modifying delay', () => {
      // Arrange
      const policy = new MaxAttemptsPolicy({
        maxRetries: 3
      });
      
      // Act & Assert
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 0 }, transientError)).toBe(true);
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 2 }, transientError)).toBe(true);
      expect(policy.shouldRetry({ ...defaultContext, attemptsMade: 3 }, transientError)).toBe(false);
    });

    it('should return zero for delay calculation', () => {
      // Arrange
      const policy = new MaxAttemptsPolicy({
        maxRetries: 3
      });
      
      // Act
      const delay = policy.calculateNextRetryTime(defaultContext);
      
      // Assert
      expect(delay).toBe(0);
    });

    it('should return appropriate retry status based on attempts', () => {
      // Arrange
      const policy = new MaxAttemptsPolicy({
        maxRetries: 3
      });
      
      // Act & Assert
      expect(policy.getRetryStatus({ ...defaultContext, attemptsMade: 1 }, transientError))
        .toBe(RetryStatus.PENDING);
      expect(policy.getRetryStatus({ ...defaultContext, attemptsMade: 3 }, transientError))
        .toBe(RetryStatus.EXHAUSTED);
    });

    it('should have a descriptive name', () => {
      // Arrange
      const policy = new MaxAttemptsPolicy({
        maxRetries: 3
      });
      
      // Act & Assert
      expect(policy.getName()).toBe('MaxAttemptsPolicy');
    });
  });

  describe('CompositePolicy', () => {
    let fixedPolicy: IRetryPolicy;
    let exponentialPolicy: IRetryPolicy;
    let maxAttemptsPolicy: IRetryPolicy;
    let compositePolicy: CompositePolicy;

    beforeEach(() => {
      fixedPolicy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000,
        jitter: 0
      });
      
      exponentialPolicy = new ExponentialBackoffPolicy({
        maxRetries: 5,
        initialDelay: 500,
        maxDelay: 10000,
        backoffFactor: 2,
        jitter: 0
      });
      
      maxAttemptsPolicy = new MaxAttemptsPolicy({
        maxRetries: 2
      });
      
      compositePolicy = new CompositePolicy();
    });

    it('should register and select policies based on error types', () => {
      // Arrange
      compositePolicy.registerPolicy('NetworkError', exponentialPolicy);
      compositePolicy.registerPolicy('RateLimitError', fixedPolicy);
      
      const networkError = new Error('Network timeout');
      networkError.name = 'NetworkError';
      
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      
      // Act & Assert
      expect(compositePolicy.shouldRetry(defaultContext, networkError)).toBe(true);
      expect(compositePolicy.shouldRetry(defaultContext, rateLimitError)).toBe(true);
      
      // Verify correct policy selection by checking delay calculation
      expect(compositePolicy.calculateNextRetryTime(defaultContext, networkError)).toBe(500); // From exponential policy
      expect(compositePolicy.calculateNextRetryTime(defaultContext, rateLimitError)).toBe(1000); // From fixed policy
    });

    it('should use default policy when no specific policy matches', () => {
      // Arrange
      compositePolicy.registerPolicy('NetworkError', exponentialPolicy);
      compositePolicy.setDefaultPolicy(fixedPolicy);
      
      const unknownError = new Error('Unknown error');
      unknownError.name = 'UnknownError';
      
      // Act & Assert
      expect(compositePolicy.shouldRetry(defaultContext, unknownError)).toBe(true);
      expect(compositePolicy.calculateNextRetryTime(defaultContext, unknownError)).toBe(1000); // From fixed policy
    });

    it('should return false for shouldRetry when no matching policy and no default', () => {
      // Arrange
      compositePolicy.registerPolicy('NetworkError', exponentialPolicy);
      
      const unknownError = new Error('Unknown error');
      unknownError.name = 'UnknownError';
      
      // Act & Assert
      expect(compositePolicy.shouldRetry(defaultContext, unknownError)).toBe(false);
    });

    it('should delegate retry status to appropriate policy', () => {
      // Arrange
      compositePolicy.registerPolicy('NetworkError', exponentialPolicy);
      
      const networkError = new Error('Network timeout');
      networkError.name = 'NetworkError';
      
      // Act & Assert
      expect(compositePolicy.getRetryStatus(defaultContext, networkError)).toBe(RetryStatus.PENDING);
      expect(compositePolicy.getRetryStatus({ ...defaultContext, attemptsMade: 5 }, networkError)).toBe(RetryStatus.EXHAUSTED);
    });

    it('should respect the most restrictive policy when using multiple policies', () => {
      // Arrange
      const compositeWithMultiple = new CompositePolicy();
      compositeWithMultiple.registerPolicy('NetworkError', exponentialPolicy); // maxRetries: 5
      compositeWithMultiple.registerPolicy('NetworkError', maxAttemptsPolicy); // maxRetries: 2 (more restrictive)
      
      const networkError = new Error('Network timeout');
      networkError.name = 'NetworkError';
      
      // Act & Assert
      expect(compositeWithMultiple.shouldRetry({ ...defaultContext, attemptsMade: 1 }, networkError)).toBe(true);
      expect(compositeWithMultiple.shouldRetry({ ...defaultContext, attemptsMade: 2 }, networkError)).toBe(false); // Restricted by maxAttemptsPolicy
    });

    it('should have a descriptive name', () => {
      // Arrange & Act & Assert
      expect(compositePolicy.getName()).toBe('CompositePolicy');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative retry attempts gracefully', () => {
      // Arrange
      const fixedPolicy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000
      });
      
      // Act & Assert - should not throw and treat as attempt 0
      expect(() => fixedPolicy.calculateNextRetryTime({ ...defaultContext, attemptsMade: -1 })).not.toThrow();
      expect(fixedPolicy.calculateNextRetryTime({ ...defaultContext, attemptsMade: -1 })).toBe(1000);
    });

    it('should handle extremely large retry attempts without overflow', () => {
      // Arrange
      const exponentialPolicy = new ExponentialBackoffPolicy({
        maxRetries: 100, // Unrealistically high
        initialDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2
      });
      
      // Act & Assert - should cap at maxDelay without numeric overflow
      expect(exponentialPolicy.calculateNextRetryTime({ ...defaultContext, attemptsMade: 1000 })).toBe(30000);
    });

    it('should handle null or undefined error objects', () => {
      // Arrange
      const policy = new FixedIntervalPolicy({
        maxRetries: 3,
        delay: 1000
      });
      
      // Act & Assert - should not throw and return false for shouldRetry
      expect(() => policy.shouldRetry(defaultContext, null as unknown as Error)).not.toThrow();
      expect(policy.shouldRetry(defaultContext, null as unknown as Error)).toBe(false);
      expect(policy.shouldRetry(defaultContext, undefined as unknown as Error)).toBe(false);
    });

    it('should handle invalid policy configurations', () => {
      // Arrange & Act & Assert
      expect(() => new FixedIntervalPolicy({ maxRetries: -1, delay: 1000 })).toThrow();
      expect(() => new ExponentialBackoffPolicy({ 
        maxRetries: 3, 
        initialDelay: -100, 
        maxDelay: 10000,
        backoffFactor: 2
      })).toThrow();
      expect(() => new ExponentialBackoffPolicy({ 
        maxRetries: 3, 
        initialDelay: 1000, 
        maxDelay: 500, // maxDelay < initialDelay
        backoffFactor: 2
      })).toThrow();
    });

    it('should handle jitter values outside valid range', () => {
      // Arrange & Act & Assert
      expect(() => new FixedIntervalPolicy({ 
        maxRetries: 3, 
        delay: 1000,
        jitter: -0.1 // Negative jitter
      })).toThrow();
      
      expect(() => new FixedIntervalPolicy({ 
        maxRetries: 3, 
        delay: 1000,
        jitter: 1.1 // Jitter > 1
      })).toThrow();
    });
  });
});