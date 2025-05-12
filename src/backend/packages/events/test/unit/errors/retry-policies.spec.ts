import { ErrorType } from '@austa/errors';
import {
  BaseRetryPolicy,
  ExponentialBackoffPolicy,
  FixedIntervalPolicy,
  MaxAttemptsPolicy,
  CompositeRetryPolicy,
  RetryPolicyFactory,
  RetryContext,
  RetryOptions,
  ExponentialBackoffOptions,
  FixedIntervalOptions,
  JourneyRetryConfig,
  RetryStatus
} from '../../../src/errors/retry-policies';
import { retryContexts } from './fixtures';
import { createMockEventError, createRetryContext } from './mocks';

/**
 * Test implementation of BaseRetryPolicy for testing abstract methods
 */
class TestRetryPolicy extends BaseRetryPolicy {
  calculateNextRetryDelay(context: RetryContext): number {
    return this.options.initialDelay;
  }
}

describe('Retry Policies', () => {
  describe('BaseRetryPolicy', () => {
    let policy: TestRetryPolicy;
    
    beforeEach(() => {
      policy = new TestRetryPolicy('TestPolicy', {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        jitter: 0.2
      });
    });
    
    describe('shouldRetry', () => {
      it('should return false if attempt count exceeds max retries', () => {
        const context: RetryContext = {
          error: new Error('Test error'),
          attemptCount: 4, // Exceeds maxRetries of 3
          eventType: 'test.event',
          source: 'test-service'
        };
        
        expect(policy.shouldRetry(context)).toBe(false);
      });
      
      it('should return true for retryable errors within max retries', () => {
        const context: RetryContext = {
          error: new Error('ECONNREFUSED connection refused'),
          attemptCount: 2, // Within maxRetries of 3
          eventType: 'test.event',
          source: 'test-service'
        };
        
        expect(policy.shouldRetry(context)).toBe(true);
      });
      
      it('should return false for non-retryable errors', () => {
        const context: RetryContext = {
          error: new Error('Invalid input'),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        expect(policy.shouldRetry(context)).toBe(false);
      });
    });
    
    describe('isRetryableError', () => {
      it('should return true for network errors', () => {
        const networkErrors = [
          new Error('ECONNREFUSED connection refused'),
          new Error('ETIMEDOUT connection timeout'),
          new Error('ECONNRESET connection reset'),
          new Error('EHOSTUNREACH host unreachable'),
          new Error('network error occurred')
        ];
        
        networkErrors.forEach(error => {
          // @ts-ignore - accessing protected method for testing
          expect(policy.isRetryableError(error)).toBe(true);
        });
      });
      
      it('should return true for database connection errors', () => {
        const dbErrors = [
          new Error('connection lost to database'),
          new Error('database connection closed unexpectedly'),
          new Error('connection terminated')
        ];
        
        dbErrors.forEach(error => {
          // @ts-ignore - accessing protected method for testing
          expect(policy.isRetryableError(error)).toBe(true);
        });
      });
      
      it('should return true for rate limiting or temporary unavailability', () => {
        const tempErrors = [
          new Error('rate limit exceeded'),
          new Error('too many requests'),
          new Error('service unavailable'),
          new Error('please try again later')
        ];
        
        tempErrors.forEach(error => {
          // @ts-ignore - accessing protected method for testing
          expect(policy.isRetryableError(error)).toBe(true);
        });
      });
      
      it('should return true for errors with retryable error types', () => {
        const errorWithType = createMockEventError(
          'Database error',
          ErrorType.DATABASE,
          'DB_ERROR'
        );
        
        // @ts-ignore - accessing protected method for testing
        expect(policy.isRetryableError(errorWithType)).toBe(true);
      });
      
      it('should return false for errors with non-retryable error types', () => {
        const errorWithType = createMockEventError(
          'Validation error',
          ErrorType.VALIDATION,
          'VALIDATION_ERROR'
        );
        
        // @ts-ignore - accessing protected method for testing
        expect(policy.isRetryableError(errorWithType)).toBe(false);
      });
      
      it('should return false for generic errors', () => {
        const genericErrors = [
          new Error('Generic error'),
          new Error('Invalid input'),
          new Error('Not found')
        ];
        
        genericErrors.forEach(error => {
          // @ts-ignore - accessing protected method for testing
          expect(policy.isRetryableError(error)).toBe(false);
        });
      });
    });
    
    describe('isRetryableErrorType', () => {
      it('should return true for retryable error types', () => {
        const retryableTypes = [
          ErrorType.NETWORK,
          ErrorType.DATABASE,
          ErrorType.TIMEOUT,
          ErrorType.RATE_LIMIT,
          ErrorType.TEMPORARY_FAILURE,
          ErrorType.DEPENDENCY_UNAVAILABLE
        ];
        
        retryableTypes.forEach(type => {
          // @ts-ignore - accessing protected method for testing
          expect(policy.isRetryableErrorType(type)).toBe(true);
        });
      });
      
      it('should return false for non-retryable error types', () => {
        const nonRetryableTypes = [
          ErrorType.VALIDATION,
          ErrorType.AUTHORIZATION,
          ErrorType.AUTHENTICATION,
          ErrorType.NOT_FOUND,
          ErrorType.BUSINESS,
          ErrorType.TECHNICAL
        ];
        
        nonRetryableTypes.forEach(type => {
          // @ts-ignore - accessing protected method for testing
          expect(policy.isRetryableErrorType(type)).toBe(false);
        });
      });
    });
    
    describe('applyJitter', () => {
      it('should return the original delay when jitter is 0', () => {
        const policyWithoutJitter = new TestRetryPolicy('TestPolicy', {
          maxRetries: 3,
          initialDelay: 1000,
          jitter: 0
        });
        
        // @ts-ignore - accessing protected method for testing
        expect(policyWithoutJitter.applyJitter(1000)).toBe(1000);
      });
      
      it('should apply jitter within the expected range', () => {
        const delay = 1000;
        const jitter = 0.2; // 20%
        const jitterAmount = delay * jitter; // 200
        const minExpected = delay - jitterAmount / 2; // 900
        const maxExpected = delay + jitterAmount / 2; // 1100
        
        // Run multiple times to account for randomness
        for (let i = 0; i < 100; i++) {
          // @ts-ignore - accessing protected method for testing
          const jitteredDelay = policy.applyJitter(delay);
          expect(jitteredDelay).toBeGreaterThanOrEqual(minExpected);
          expect(jitteredDelay).toBeLessThanOrEqual(maxExpected);
        }
      });
    });
    
    describe('getName', () => {
      it('should return the policy name', () => {
        expect(policy.getName()).toBe('TestPolicy');
      });
    });
  });
  
  describe('ExponentialBackoffPolicy', () => {
    let policy: ExponentialBackoffPolicy;
    
    beforeEach(() => {
      policy = new ExponentialBackoffPolicy({
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 30000,
        jitter: 0.2,
        backoffFactor: 2
      });
    });
    
    describe('calculateNextRetryDelay', () => {
      it('should calculate exponential delay based on attempt count', () => {
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(policy as any, 'applyJitter').mockImplementation((delay: number) => delay);
        
        // First attempt: initialDelay * (backoffFactor ^ 0) = 1000 * (2 ^ 0) = 1000
        expect(policy.calculateNextRetryDelay({ attemptCount: 0 } as RetryContext)).toBe(1000);
        
        // Second attempt: initialDelay * (backoffFactor ^ 1) = 1000 * (2 ^ 1) = 2000
        expect(policy.calculateNextRetryDelay({ attemptCount: 1 } as RetryContext)).toBe(2000);
        
        // Third attempt: initialDelay * (backoffFactor ^ 2) = 1000 * (2 ^ 2) = 4000
        expect(policy.calculateNextRetryDelay({ attemptCount: 2 } as RetryContext)).toBe(4000);
        
        // Fourth attempt: initialDelay * (backoffFactor ^ 3) = 1000 * (2 ^ 3) = 8000
        expect(policy.calculateNextRetryDelay({ attemptCount: 3 } as RetryContext)).toBe(8000);
        
        // Fifth attempt: initialDelay * (backoffFactor ^ 4) = 1000 * (2 ^ 4) = 16000
        expect(policy.calculateNextRetryDelay({ attemptCount: 4 } as RetryContext)).toBe(16000);
      });
      
      it('should cap the delay at maxDelay', () => {
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(policy as any, 'applyJitter').mockImplementation((delay: number) => delay);
        
        // Create a context with a high attempt count that would exceed maxDelay
        const context: RetryContext = {
          error: new Error('Test error'),
          attemptCount: 10, // This would result in 1000 * (2^10) = 1,024,000ms without capping
          eventType: 'test.event',
          source: 'test-service'
        };
        
        // Should be capped at maxDelay (30000)
        expect(policy.calculateNextRetryDelay(context)).toBe(30000);
      });
      
      it('should apply jitter to the calculated delay', () => {
        // Restore the original applyJitter implementation
        jest.restoreAllMocks();
        
        const context: RetryContext = {
          error: new Error('Test error'),
          attemptCount: 2, // This would result in 1000 * (2^2) = 4000ms before jitter
          eventType: 'test.event',
          source: 'test-service'
        };
        
        // With 20% jitter, the delay should be between 3600 and 4400
        const delay = policy.calculateNextRetryDelay(context);
        expect(delay).toBeGreaterThanOrEqual(3600);
        expect(delay).toBeLessThanOrEqual(4400);
      });
      
      it('should use different backoff factors', () => {
        // Create a policy with a different backoff factor
        const policyWithDifferentFactor = new ExponentialBackoffPolicy({
          maxRetries: 5,
          initialDelay: 1000,
          maxDelay: 30000,
          jitter: 0,
          backoffFactor: 1.5
        });
        
        // First attempt: initialDelay * (backoffFactor ^ 0) = 1000 * (1.5 ^ 0) = 1000
        expect(policyWithDifferentFactor.calculateNextRetryDelay({ attemptCount: 0 } as RetryContext)).toBe(1000);
        
        // Second attempt: initialDelay * (backoffFactor ^ 1) = 1000 * (1.5 ^ 1) = 1500
        expect(policyWithDifferentFactor.calculateNextRetryDelay({ attemptCount: 1 } as RetryContext)).toBe(1500);
        
        // Third attempt: initialDelay * (backoffFactor ^ 2) = 1000 * (1.5 ^ 2) = 2250
        expect(policyWithDifferentFactor.calculateNextRetryDelay({ attemptCount: 2 } as RetryContext)).toBe(2250);
      });
    });
    
    describe('getName', () => {
      it('should return the correct policy name', () => {
        expect(policy.getName()).toBe('ExponentialBackoff');
      });
    });
  });
  
  describe('FixedIntervalPolicy', () => {
    let policy: FixedIntervalPolicy;
    
    beforeEach(() => {
      policy = new FixedIntervalPolicy({
        maxRetries: 5,
        initialDelay: 1000,
        delay: 2000,
        jitter: 0.2
      });
    });
    
    describe('calculateNextRetryDelay', () => {
      it('should return the fixed delay regardless of attempt count', () => {
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(policy as any, 'applyJitter').mockImplementation((delay: number) => delay);
        
        // Should return the same delay for all attempt counts
        expect(policy.calculateNextRetryDelay({ attemptCount: 0 } as RetryContext)).toBe(2000);
        expect(policy.calculateNextRetryDelay({ attemptCount: 1 } as RetryContext)).toBe(2000);
        expect(policy.calculateNextRetryDelay({ attemptCount: 2 } as RetryContext)).toBe(2000);
        expect(policy.calculateNextRetryDelay({ attemptCount: 10 } as RetryContext)).toBe(2000);
      });
      
      it('should use initialDelay if delay is not specified', () => {
        const policyWithoutDelay = new FixedIntervalPolicy({
          maxRetries: 5,
          initialDelay: 1000,
          jitter: 0
        });
        
        expect(policyWithoutDelay.calculateNextRetryDelay({ attemptCount: 0 } as RetryContext)).toBe(1000);
      });
      
      it('should apply jitter to the fixed delay', () => {
        // Restore the original applyJitter implementation
        jest.restoreAllMocks();
        
        // With 20% jitter, the delay should be between 1800 and 2200
        const delay = policy.calculateNextRetryDelay({ attemptCount: 0 } as RetryContext);
        expect(delay).toBeGreaterThanOrEqual(1800);
        expect(delay).toBeLessThanOrEqual(2200);
      });
    });
    
    describe('getName', () => {
      it('should return the correct policy name', () => {
        expect(policy.getName()).toBe('FixedInterval');
      });
    });
  });
  
  describe('MaxAttemptsPolicy', () => {
    let policy: MaxAttemptsPolicy;
    
    beforeEach(() => {
      policy = new MaxAttemptsPolicy({
        maxRetries: 3,
        initialDelay: 1000,
        jitter: 0.2
      });
    });
    
    describe('shouldRetry', () => {
      it('should return true if attempt count is less than max retries', () => {
        expect(policy.shouldRetry({ attemptCount: 0 } as RetryContext)).toBe(true);
        expect(policy.shouldRetry({ attemptCount: 1 } as RetryContext)).toBe(true);
        expect(policy.shouldRetry({ attemptCount: 2 } as RetryContext)).toBe(true);
      });
      
      it('should return false if attempt count equals or exceeds max retries', () => {
        expect(policy.shouldRetry({ attemptCount: 3 } as RetryContext)).toBe(false);
        expect(policy.shouldRetry({ attemptCount: 4 } as RetryContext)).toBe(false);
      });
      
      it('should ignore the error type and only check attempt count', () => {
        // Even with a retryable error type, it should return false if max attempts reached
        const context: RetryContext = {
          error: createMockEventError('Network error', ErrorType.NETWORK),
          attemptCount: 3,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        expect(policy.shouldRetry(context)).toBe(false);
        
        // Even with a non-retryable error type, it should return true if under max attempts
        const context2: RetryContext = {
          error: createMockEventError('Validation error', ErrorType.VALIDATION),
          attemptCount: 2,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        expect(policy.shouldRetry(context2)).toBe(true);
      });
    });
    
    describe('calculateNextRetryDelay', () => {
      it('should return the initial delay with jitter', () => {
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(policy as any, 'applyJitter').mockImplementation((delay: number) => delay);
        
        expect(policy.calculateNextRetryDelay({ attemptCount: 0 } as RetryContext)).toBe(1000);
        expect(policy.calculateNextRetryDelay({ attemptCount: 1 } as RetryContext)).toBe(1000);
        expect(policy.calculateNextRetryDelay({ attemptCount: 2 } as RetryContext)).toBe(1000);
      });
    });
    
    describe('getName', () => {
      it('should return the correct policy name', () => {
        expect(policy.getName()).toBe('MaxAttempts');
      });
    });
  });
  
  describe('CompositeRetryPolicy', () => {
    let defaultPolicy: MockRetryPolicy;
    let networkPolicy: MockRetryPolicy;
    let databasePolicy: MockRetryPolicy;
    let compositePolicy: CompositeRetryPolicy;
    
    // Mock implementation of RetryPolicy for testing
    class MockRetryPolicy implements RetryPolicy {
      private readonly name: string;
      private shouldRetryValue: boolean;
      private nextRetryDelay: number;
      
      constructor(name: string, shouldRetryValue: boolean, nextRetryDelay: number) {
        this.name = name;
        this.shouldRetryValue = shouldRetryValue;
        this.nextRetryDelay = nextRetryDelay;
      }
      
      shouldRetry(): boolean {
        return this.shouldRetryValue;
      }
      
      calculateNextRetryDelay(): number {
        return this.nextRetryDelay;
      }
      
      getName(): string {
        return this.name;
      }
      
      setShouldRetry(value: boolean): void {
        this.shouldRetryValue = value;
      }
      
      setNextRetryDelay(delay: number): void {
        this.nextRetryDelay = delay;
      }
    }
    
    beforeEach(() => {
      defaultPolicy = new MockRetryPolicy('DefaultPolicy', true, 1000);
      networkPolicy = new MockRetryPolicy('NetworkPolicy', true, 2000);
      databasePolicy = new MockRetryPolicy('DatabasePolicy', false, 3000);
      
      compositePolicy = new CompositeRetryPolicy(defaultPolicy);
      compositePolicy.registerPolicy(networkPolicy);
      compositePolicy.registerPolicy(databasePolicy);
      
      compositePolicy.mapErrorTypeToPolicy(ErrorType.NETWORK, 'NetworkPolicy');
      compositePolicy.mapErrorTypeToPolicy(ErrorType.DATABASE, 'DatabasePolicy');
    });
    
    describe('registerPolicy', () => {
      it('should register policies correctly', () => {
        const newPolicy = new MockRetryPolicy('NewPolicy', true, 4000);
        compositePolicy.registerPolicy(newPolicy);
        
        // Map an error type to the new policy
        compositePolicy.mapErrorTypeToPolicy(ErrorType.TIMEOUT, 'NewPolicy');
        
        // Create a context with a timeout error
        const context: RetryContext = {
          error: createMockEventError('Timeout error', ErrorType.TIMEOUT),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        // Should use the new policy
        expect(compositePolicy.calculateNextRetryDelay(context)).toBe(4000);
      });
    });
    
    describe('mapErrorTypeToPolicy', () => {
      it('should map error types to the correct policies', () => {
        // Create contexts with different error types
        const networkContext: RetryContext = {
          error: createMockEventError('Network error', ErrorType.NETWORK),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        const databaseContext: RetryContext = {
          error: createMockEventError('Database error', ErrorType.DATABASE),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        const otherContext: RetryContext = {
          error: createMockEventError('Other error', ErrorType.TECHNICAL),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        // Should use the mapped policies for specific error types
        expect(compositePolicy.shouldRetry(networkContext)).toBe(true); // NetworkPolicy
        expect(compositePolicy.shouldRetry(databaseContext)).toBe(false); // DatabasePolicy
        expect(compositePolicy.shouldRetry(otherContext)).toBe(true); // DefaultPolicy
        
        expect(compositePolicy.calculateNextRetryDelay(networkContext)).toBe(2000); // NetworkPolicy
        expect(compositePolicy.calculateNextRetryDelay(databaseContext)).toBe(3000); // DatabasePolicy
        expect(compositePolicy.calculateNextRetryDelay(otherContext)).toBe(1000); // DefaultPolicy
      });
      
      it('should ignore mappings for non-existent policies', () => {
        // Map an error type to a non-existent policy
        compositePolicy.mapErrorTypeToPolicy(ErrorType.TIMEOUT, 'NonExistentPolicy');
        
        // Create a context with a timeout error
        const context: RetryContext = {
          error: createMockEventError('Timeout error', ErrorType.TIMEOUT),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        // Should fall back to the default policy
        expect(compositePolicy.calculateNextRetryDelay(context)).toBe(1000);
      });
    });
    
    describe('shouldRetry', () => {
      it('should delegate to the appropriate policy based on error type', () => {
        // Create contexts with different error types
        const networkContext: RetryContext = {
          error: createMockEventError('Network error', ErrorType.NETWORK),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        const databaseContext: RetryContext = {
          error: createMockEventError('Database error', ErrorType.DATABASE),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        // Change the shouldRetry values
        networkPolicy.setShouldRetry(false);
        databasePolicy.setShouldRetry(true);
        
        // Should reflect the updated values
        expect(compositePolicy.shouldRetry(networkContext)).toBe(false);
        expect(compositePolicy.shouldRetry(databaseContext)).toBe(true);
      });
    });
    
    describe('calculateNextRetryDelay', () => {
      it('should delegate to the appropriate policy based on error type', () => {
        // Create contexts with different error types
        const networkContext: RetryContext = {
          error: createMockEventError('Network error', ErrorType.NETWORK),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        const databaseContext: RetryContext = {
          error: createMockEventError('Database error', ErrorType.DATABASE),
          attemptCount: 1,
          eventType: 'test.event',
          source: 'test-service'
        };
        
        // Change the nextRetryDelay values
        networkPolicy.setNextRetryDelay(5000);
        databasePolicy.setNextRetryDelay(7000);
        
        // Should reflect the updated values
        expect(compositePolicy.calculateNextRetryDelay(networkContext)).toBe(5000);
        expect(compositePolicy.calculateNextRetryDelay(databaseContext)).toBe(7000);
      });
    });
    
    describe('getName', () => {
      it('should return the correct policy name', () => {
        expect(compositePolicy.getName()).toBe('CompositeRetryPolicy');
      });
    });
  });
  
  describe('RetryPolicyFactory', () => {
    let factory: RetryPolicyFactory;
    
    beforeEach(() => {
      factory = new RetryPolicyFactory();
    });
    
    describe('createPolicyForJourneyAndErrorType', () => {
      it('should create appropriate policies for different error types', () => {
        // Network error should use ExponentialBackoffPolicy
        const networkPolicy = factory.createPolicyForJourneyAndErrorType('health', ErrorType.NETWORK);
        expect(networkPolicy.getName()).toBe('ExponentialBackoff');
        
        // Database error should use ExponentialBackoffPolicy with different parameters
        const databasePolicy = factory.createPolicyForJourneyAndErrorType('health', ErrorType.DATABASE);
        expect(databasePolicy.getName()).toBe('ExponentialBackoff');
        
        // Rate limit error should use FixedIntervalPolicy
        const rateLimitPolicy = factory.createPolicyForJourneyAndErrorType('health', ErrorType.RATE_LIMIT);
        expect(rateLimitPolicy.getName()).toBe('FixedInterval');
        
        // Other error should use MaxAttemptsPolicy
        const otherPolicy = factory.createPolicyForJourneyAndErrorType('health', ErrorType.VALIDATION);
        expect(otherPolicy.getName()).toBe('MaxAttempts');
      });
      
      it('should use journey-specific configurations', () => {
        // Mock the applyJitter method to return the input for predictable testing
        const mockApplyJitter = jest.fn(delay => delay);
        jest.spyOn(BaseRetryPolicy.prototype as any, 'applyJitter').mockImplementation(mockApplyJitter);
        
        // Health journey network error
        const healthNetworkPolicy = factory.createPolicyForJourneyAndErrorType('health', ErrorType.NETWORK);
        const healthNetworkContext: RetryContext = {
          error: new Error('Network error'),
          attemptCount: 1,
          eventType: 'health.metric.recorded',
          source: 'health-service'
        };
        
        // Care journey network error
        const careNetworkPolicy = factory.createPolicyForJourneyAndErrorType('care', ErrorType.NETWORK);
        const careNetworkContext: RetryContext = {
          error: new Error('Network error'),
          attemptCount: 1,
          eventType: 'care.appointment.booked',
          source: 'care-service'
        };
        
        // Plan journey network error
        const planNetworkPolicy = factory.createPolicyForJourneyAndErrorType('plan', ErrorType.NETWORK);
        const planNetworkContext: RetryContext = {
          error: new Error('Network error'),
          attemptCount: 1,
          eventType: 'plan.claim.submitted',
          source: 'plan-service'
        };
        
        // Should use journey-specific configurations
        expect(healthNetworkPolicy.calculateNextRetryDelay(healthNetworkContext)).toBe(1000); // initialDelay * (2^1)
        expect(careNetworkPolicy.calculateNextRetryDelay(careNetworkContext)).toBe(1000); // initialDelay * (2^1)
        expect(planNetworkPolicy.calculateNextRetryDelay(planNetworkContext)).toBe(2000); // initialDelay * (2^1)
        
        // Restore the original implementation
        jest.restoreAllMocks();
      });
      
      it('should fall back to default configuration for unknown journeys', () => {
        const unknownJourneyPolicy = factory.createPolicyForJourneyAndErrorType('unknown', ErrorType.NETWORK);
        expect(unknownJourneyPolicy.getName()).toBe('ExponentialBackoff');
        
        // Should use default configuration
        const context: RetryContext = {
          error: new Error('Network error'),
          attemptCount: 1,
          eventType: 'unknown.event',
          source: 'unknown-service'
        };
        
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(BaseRetryPolicy.prototype as any, 'applyJitter').mockImplementation(delay => delay);
        
        expect(unknownJourneyPolicy.calculateNextRetryDelay(context)).toBe(2000); // initialDelay * (2^1)
        
        // Restore the original implementation
        jest.restoreAllMocks();
      });
      
      it('should fall back to default error type configuration for unknown error types', () => {
        // Create a policy for an unknown error type
        const unknownErrorTypePolicy = factory.createPolicyForJourneyAndErrorType('health', 'UNKNOWN_ERROR_TYPE' as ErrorType);
        
        // Should use the default network error configuration
        const context: RetryContext = {
          error: new Error('Unknown error'),
          attemptCount: 1,
          eventType: 'health.metric.recorded',
          source: 'health-service'
        };
        
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(BaseRetryPolicy.prototype as any, 'applyJitter').mockImplementation(delay => delay);
        
        expect(unknownErrorTypePolicy.calculateNextRetryDelay(context)).toBe(1000); // initialDelay * (2^1)
        
        // Restore the original implementation
        jest.restoreAllMocks();
      });
      
      it('should cache policies for the same journey and error type', () => {
        // Create a spy on the constructor
        const originalExponentialBackoff = ExponentialBackoffPolicy;
        let constructorCallCount = 0;
        
        // @ts-ignore - mock the constructor
        global.ExponentialBackoffPolicy = class extends originalExponentialBackoff {
          constructor(options: ExponentialBackoffOptions) {
            super(options);
            constructorCallCount++;
          }
        };
        
        // Get the same policy twice
        const policy1 = factory.createPolicyForJourneyAndErrorType('health', ErrorType.NETWORK);
        const policy2 = factory.createPolicyForJourneyAndErrorType('health', ErrorType.NETWORK);
        
        // Should be the same instance
        expect(policy1).toBe(policy2);
        
        // Constructor should only be called once
        expect(constructorCallCount).toBe(1);
        
        // Restore the original constructor
        global.ExponentialBackoffPolicy = originalExponentialBackoff;
      });
    });
    
    describe('createCompositePolicy', () => {
      it('should create a composite policy with appropriate mappings', () => {
        const compositePolicy = factory.createCompositePolicy('health');
        expect(compositePolicy.getName()).toBe('CompositeRetryPolicy');
        
        // Create contexts with different error types
        const networkContext: RetryContext = {
          error: createMockEventError('Network error', ErrorType.NETWORK),
          attemptCount: 1,
          eventType: 'health.metric.recorded',
          source: 'health-service'
        };
        
        const databaseContext: RetryContext = {
          error: createMockEventError('Database error', ErrorType.DATABASE),
          attemptCount: 1,
          eventType: 'health.metric.recorded',
          source: 'health-service'
        };
        
        const rateLimitContext: RetryContext = {
          error: createMockEventError('Rate limit error', ErrorType.RATE_LIMIT),
          attemptCount: 1,
          eventType: 'health.metric.recorded',
          source: 'health-service'
        };
        
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(BaseRetryPolicy.prototype as any, 'applyJitter').mockImplementation(delay => delay);
        
        // Should use the appropriate policies for each error type
        expect(compositePolicy.calculateNextRetryDelay(networkContext)).toBe(1000); // ExponentialBackoff
        expect(compositePolicy.calculateNextRetryDelay(databaseContext)).toBe(1000); // ExponentialBackoff with different factor
        expect(compositePolicy.calculateNextRetryDelay(rateLimitContext)).toBe(5000); // FixedInterval
        
        // Restore the original implementation
        jest.restoreAllMocks();
      });
      
      it('should cache composite policies for the same journey', () => {
        // Create a spy on the constructor
        const originalCompositePolicy = CompositeRetryPolicy;
        let constructorCallCount = 0;
        
        // @ts-ignore - mock the constructor
        global.CompositeRetryPolicy = class extends originalCompositePolicy {
          constructor(defaultPolicy: RetryPolicy) {
            super(defaultPolicy);
            constructorCallCount++;
          }
        };
        
        // Get the same policy twice
        const policy1 = factory.createCompositePolicy('health');
        const policy2 = factory.createCompositePolicy('health');
        
        // Should be the same instance
        expect(policy1).toBe(policy2);
        
        // Constructor should only be called once
        expect(constructorCallCount).toBe(1);
        
        // Restore the original constructor
        global.CompositeRetryPolicy = originalCompositePolicy;
      });
    });
    
    describe('getPolicyForEventType', () => {
      it('should determine the journey from the event type', () => {
        // Create a spy on createCompositePolicy
        const spy = jest.spyOn(factory, 'createCompositePolicy');
        
        // Get policies for different event types
        factory.getPolicyForEventType('health.metric.recorded');
        factory.getPolicyForEventType('care.appointment.booked');
        factory.getPolicyForEventType('plan.claim.submitted');
        factory.getPolicyForEventType('unknown.event');
        
        // Should call createCompositePolicy with the correct journey
        expect(spy).toHaveBeenCalledWith('health');
        expect(spy).toHaveBeenCalledWith('care');
        expect(spy).toHaveBeenCalledWith('plan');
        expect(spy).toHaveBeenCalledWith('default');
        
        // Restore the original implementation
        spy.mockRestore();
      });
      
      it('should return a composite policy for the event type', () => {
        const policy = factory.getPolicyForEventType('health.metric.recorded');
        expect(policy.getName()).toBe('CompositeRetryPolicy');
        
        // Create a context with a network error
        const context: RetryContext = {
          error: createMockEventError('Network error', ErrorType.NETWORK),
          attemptCount: 1,
          eventType: 'health.metric.recorded',
          source: 'health-service'
        };
        
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(BaseRetryPolicy.prototype as any, 'applyJitter').mockImplementation(delay => delay);
        
        // Should use the appropriate policy for the error type
        expect(policy.calculateNextRetryDelay(context)).toBe(1000); // ExponentialBackoff
        
        // Restore the original implementation
        jest.restoreAllMocks();
      });
    });
    
    describe('custom journey configurations', () => {
      it('should use custom journey configurations when provided', () => {
        // Create a factory with custom journey configurations
        const customConfig: JourneyRetryConfig = {
          health: {
            retryOptions: {
              [ErrorType.NETWORK]: {
                maxRetries: 10,
                initialDelay: 100,
                maxDelay: 5000,
                jitter: 0.1
              }
            }
          },
          default: {
            retryOptions: {
              [ErrorType.NETWORK]: {
                maxRetries: 3,
                initialDelay: 500,
                maxDelay: 5000,
                jitter: 0.2
              }
            }
          }
        };
        
        const customFactory = new RetryPolicyFactory(customConfig);
        
        // Get policies for different journeys
        const healthPolicy = customFactory.createPolicyForJourneyAndErrorType('health', ErrorType.NETWORK);
        const defaultPolicy = customFactory.createPolicyForJourneyAndErrorType('unknown', ErrorType.NETWORK);
        
        // Create contexts
        const healthContext: RetryContext = {
          error: new Error('Network error'),
          attemptCount: 1,
          eventType: 'health.metric.recorded',
          source: 'health-service'
        };
        
        const defaultContext: RetryContext = {
          error: new Error('Network error'),
          attemptCount: 1,
          eventType: 'unknown.event',
          source: 'unknown-service'
        };
        
        // Mock the applyJitter method to return the input for predictable testing
        jest.spyOn(BaseRetryPolicy.prototype as any, 'applyJitter').mockImplementation(delay => delay);
        
        // Should use the custom configurations
        expect(healthPolicy.calculateNextRetryDelay(healthContext)).toBe(200); // 100 * (2^1)
        expect(defaultPolicy.calculateNextRetryDelay(defaultContext)).toBe(1000); // 500 * (2^1)
        
        // Should respect the custom max retries
        expect(healthPolicy.shouldRetry({ ...healthContext, attemptCount: 9 })).toBe(true); // Under max retries
        expect(healthPolicy.shouldRetry({ ...healthContext, attemptCount: 10 })).toBe(false); // At max retries
        
        expect(defaultPolicy.shouldRetry({ ...defaultContext, attemptCount: 2 })).toBe(true); // Under max retries
        expect(defaultPolicy.shouldRetry({ ...defaultContext, attemptCount: 3 })).toBe(false); // At max retries
        
        // Restore the original implementation
        jest.restoreAllMocks();
      });
    });
  });
});