import { EventProcessingError } from '../../../src/errors/event-errors';
import {
  BaseRetryPolicy,
  ExponentialBackoffRetryPolicy,
  FixedIntervalRetryPolicy,
  LinearBackoffRetryPolicy,
  CompositeRetryPolicy,
  RetryPolicyFactory,
  RetryUtils,
  RetryContext,
  RetryStatus,
  IRetryPolicy
} from '../../../src/errors/retry-policies';
import { isRetryableError } from '../../../src/constants/errors.constants';
import { DEFAULT_RETRY } from '../../../src/constants/config.constants';

// Mock the event-errors module
jest.mock('../../../src/errors/event-errors');

// Mock the errors.constants module
jest.mock('../../../src/constants/errors.constants', () => ({
  isRetryableError: jest.fn()
}));

describe('Retry Policies', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (isRetryableError as jest.Mock).mockReturnValue(true);
  });

  describe('FixedIntervalRetryPolicy', () => {
    it('should calculate fixed delay without jitter', () => {
      const policy = new FixedIntervalRetryPolicy({
        intervalMs: 1000,
        useJitter: false
      });

      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 2,
        maxRetries: 5,
        eventType: 'test.event'
      };

      const delay = policy.calculateNextRetryDelay(context);
      expect(delay).toBe(1000);
    });

    it('should calculate fixed delay with jitter', () => {
      // Mock Math.random to return a fixed value for testing
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const policy = new FixedIntervalRetryPolicy({
        intervalMs: 1000,
        useJitter: true,
        jitterFactor: 0.2
      });

      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 2,
        maxRetries: 5,
        eventType: 'test.event'
      };

      const delay = policy.calculateNextRetryDelay(context);
      // With jitterFactor 0.2 and Math.random() = 0.5, the jitter should be 0
      // 1000 - (1000 * 0.2 / 2) + (0.5 * 1000 * 0.2) = 1000 - 100 + 100 = 1000
      expect(delay).toBe(1000);

      randomSpy.mockRestore();
    });

    it('should return policy name correctly', () => {
      const policy = new FixedIntervalRetryPolicy({
        intervalMs: 1000
      });

      expect(policy.getName()).toBe('FixedIntervalRetryPolicy');
    });

    it('should determine if retry should be attempted based on retry count', () => {
      const policy = new FixedIntervalRetryPolicy({
        intervalMs: 1000,
        maxRetries: 3
      });

      // Should retry when retryCount < maxRetries
      let context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 2,
        maxRetries: 3,
        eventType: 'test.event'
      };

      expect(policy.shouldRetry(context)).toBe(true);

      // Should not retry when retryCount >= maxRetries
      context = {
        error: new Error('Test error'),
        retryCount: 3,
        maxRetries: 3,
        eventType: 'test.event'
      };

      expect(policy.shouldRetry(context)).toBe(false);
    });

    it('should determine if retry should be attempted based on error type', () => {
      const policy = new FixedIntervalRetryPolicy({
        intervalMs: 1000,
        maxRetries: 3
      });

      // Mock EventProcessingError
      const mockError = new Error('Test error') as EventProcessingError;
      mockError.code = 'EVENT_PROD_DELIVERY_TIMEOUT';

      const context: RetryContext = {
        error: mockError,
        retryCount: 1,
        maxRetries: 3,
        eventType: 'test.event'
      };

      // Test with retryable error
      (isRetryableError as jest.Mock).mockReturnValue(true);
      expect(policy.shouldRetry(context)).toBe(true);

      // Test with non-retryable error
      (isRetryableError as jest.Mock).mockReturnValue(false);
      expect(policy.shouldRetry(context)).toBe(false);
    });
  });

  describe('ExponentialBackoffRetryPolicy', () => {
    it('should calculate exponential delay without jitter', () => {
      const policy = new ExponentialBackoffRetryPolicy({
        initialDelayMs: 100,
        maxDelayMs: 10000,
        backoffFactor: 2,
        useJitter: false
      });

      // Test with different retry counts
      let context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 0,
        maxRetries: 5,
        eventType: 'test.event'
      };

      // First retry: initialDelay * (backoffFactor ^ retryCount) = 100 * (2 ^ 0) = 100
      expect(policy.calculateNextRetryDelay(context)).toBe(100);

      // Second retry: initialDelay * (backoffFactor ^ retryCount) = 100 * (2 ^ 1) = 200
      context.retryCount = 1;
      expect(policy.calculateNextRetryDelay(context)).toBe(200);

      // Third retry: initialDelay * (backoffFactor ^ retryCount) = 100 * (2 ^ 2) = 400
      context.retryCount = 2;
      expect(policy.calculateNextRetryDelay(context)).toBe(400);

      // Fourth retry: initialDelay * (backoffFactor ^ retryCount) = 100 * (2 ^ 3) = 800
      context.retryCount = 3;
      expect(policy.calculateNextRetryDelay(context)).toBe(800);
    });

    it('should respect maximum delay limit', () => {
      const policy = new ExponentialBackoffRetryPolicy({
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffFactor: 2,
        useJitter: false
      });

      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 5, // This would normally result in 100 * (2^5) = 3200ms
        maxRetries: 10,
        eventType: 'test.event'
      };

      // Should be capped at maxDelayMs
      expect(policy.calculateNextRetryDelay(context)).toBe(1000);
    });

    it('should calculate exponential delay with jitter', () => {
      // Mock Math.random to return a fixed value for testing
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const policy = new ExponentialBackoffRetryPolicy({
        initialDelayMs: 100,
        maxDelayMs: 10000,
        backoffFactor: 2,
        useJitter: true,
        jitterFactor: 0.2
      });

      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 2, // 100 * (2^2) = 400ms
        maxRetries: 5,
        eventType: 'test.event'
      };

      const delay = policy.calculateNextRetryDelay(context);
      // With jitterFactor 0.2 and Math.random() = 0.5, the jitter should be 0
      // 400 - (400 * 0.2 / 2) + (0.5 * 400 * 0.2) = 400 - 40 + 40 = 400
      expect(delay).toBe(400);

      randomSpy.mockRestore();
    });

    it('should return policy name correctly', () => {
      const policy = new ExponentialBackoffRetryPolicy({
        initialDelayMs: 100,
        maxDelayMs: 10000,
        backoffFactor: 2
      });

      expect(policy.getName()).toBe('ExponentialBackoffRetryPolicy');
    });
  });

  describe('LinearBackoffRetryPolicy', () => {
    it('should calculate linear delay without jitter', () => {
      const policy = new LinearBackoffRetryPolicy({
        initialDelayMs: 100,
        maxDelayMs: 10000,
        incrementMs: 200,
        useJitter: false
      });

      // Test with different retry counts
      let context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 0,
        maxRetries: 5,
        eventType: 'test.event'
      };

      // First retry: initialDelay + (increment * retryCount) = 100 + (200 * 0) = 100
      expect(policy.calculateNextRetryDelay(context)).toBe(100);

      // Second retry: initialDelay + (increment * retryCount) = 100 + (200 * 1) = 300
      context.retryCount = 1;
      expect(policy.calculateNextRetryDelay(context)).toBe(300);

      // Third retry: initialDelay + (increment * retryCount) = 100 + (200 * 2) = 500
      context.retryCount = 2;
      expect(policy.calculateNextRetryDelay(context)).toBe(500);

      // Fourth retry: initialDelay + (increment * retryCount) = 100 + (200 * 3) = 700
      context.retryCount = 3;
      expect(policy.calculateNextRetryDelay(context)).toBe(700);
    });

    it('should respect maximum delay limit', () => {
      const policy = new LinearBackoffRetryPolicy({
        initialDelayMs: 100,
        maxDelayMs: 1000,
        incrementMs: 300,
        useJitter: false
      });

      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 5, // This would normally result in 100 + (300 * 5) = 1600ms
        maxRetries: 10,
        eventType: 'test.event'
      };

      // Should be capped at maxDelayMs
      expect(policy.calculateNextRetryDelay(context)).toBe(1000);
    });

    it('should calculate linear delay with jitter', () => {
      // Mock Math.random to return a fixed value for testing
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const policy = new LinearBackoffRetryPolicy({
        initialDelayMs: 100,
        maxDelayMs: 10000,
        incrementMs: 200,
        useJitter: true,
        jitterFactor: 0.2
      });

      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 2, // 100 + (200 * 2) = 500ms
        maxRetries: 5,
        eventType: 'test.event'
      };

      const delay = policy.calculateNextRetryDelay(context);
      // With jitterFactor 0.2 and Math.random() = 0.5, the jitter should be 0
      // 500 - (500 * 0.2 / 2) + (0.5 * 500 * 0.2) = 500 - 50 + 50 = 500
      expect(delay).toBe(500);

      randomSpy.mockRestore();
    });

    it('should return policy name correctly', () => {
      const policy = new LinearBackoffRetryPolicy({
        initialDelayMs: 100,
        maxDelayMs: 10000,
        incrementMs: 200
      });

      expect(policy.getName()).toBe('LinearBackoffRetryPolicy');
    });
  });

  describe('CompositeRetryPolicy', () => {
    let defaultPolicy: IRetryPolicy;
    let networkPolicy: IRetryPolicy;
    let databasePolicy: IRetryPolicy;
    let compositePolicy: CompositeRetryPolicy;

    beforeEach(() => {
      // Create mock policies
      defaultPolicy = {
        calculateNextRetryDelay: jest.fn().mockReturnValue(100),
        shouldRetry: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue('DefaultPolicy')
      };

      networkPolicy = {
        calculateNextRetryDelay: jest.fn().mockReturnValue(200),
        shouldRetry: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue('NetworkPolicy')
      };

      databasePolicy = {
        calculateNextRetryDelay: jest.fn().mockReturnValue(300),
        shouldRetry: jest.fn().mockReturnValue(false),
        getName: jest.fn().mockReturnValue('DatabasePolicy')
      };

      // Create composite policy
      compositePolicy = new CompositeRetryPolicy(defaultPolicy);
      compositePolicy.addPolicyForErrorType('NETWORK', networkPolicy);
      compositePolicy.addPolicyForErrorType('DATABASE', databasePolicy);
    });

    it('should use the appropriate policy based on error type', () => {
      // Create mock errors
      const defaultError = new Error('Default error');
      const networkError = new Error('Network error') as EventProcessingError;
      networkError.code = 'EVENT_DELIV_NETWORK_FAILURE';
      const databaseError = new Error('Database error') as EventProcessingError;
      databaseError.code = 'EVENT_DATABASE_ERROR';

      // Create retry contexts
      const defaultContext: RetryContext = {
        error: defaultError,
        retryCount: 1,
        maxRetries: 5,
        eventType: 'test.event'
      };

      const networkContext: RetryContext = {
        error: networkError,
        retryCount: 1,
        maxRetries: 5,
        eventType: 'test.event'
      };

      const databaseContext: RetryContext = {
        error: databaseError,
        retryCount: 1,
        maxRetries: 5,
        eventType: 'test.event'
      };

      // Test calculateNextRetryDelay
      expect(compositePolicy.calculateNextRetryDelay(defaultContext)).toBe(100);
      expect(defaultPolicy.calculateNextRetryDelay).toHaveBeenCalledWith(defaultContext);

      expect(compositePolicy.calculateNextRetryDelay(networkContext)).toBe(200);
      expect(networkPolicy.calculateNextRetryDelay).toHaveBeenCalledWith(networkContext);

      expect(compositePolicy.calculateNextRetryDelay(databaseContext)).toBe(300);
      expect(databasePolicy.calculateNextRetryDelay).toHaveBeenCalledWith(databaseContext);

      // Test shouldRetry
      expect(compositePolicy.shouldRetry(defaultContext)).toBe(true);
      expect(defaultPolicy.shouldRetry).toHaveBeenCalledWith(defaultContext);

      expect(compositePolicy.shouldRetry(networkContext)).toBe(true);
      expect(networkPolicy.shouldRetry).toHaveBeenCalledWith(networkContext);

      expect(compositePolicy.shouldRetry(databaseContext)).toBe(false);
      expect(databasePolicy.shouldRetry).toHaveBeenCalledWith(databaseContext);
    });

    it('should extract error category from error code', () => {
      // Create an error with a category in the code
      const categoryError = new Error('Category error') as EventProcessingError;
      categoryError.code = 'EVENT_PROD_RATE_LIMIT_EXCEEDED';

      // Add a policy for the PROD category
      const prodPolicy = {
        calculateNextRetryDelay: jest.fn().mockReturnValue(400),
        shouldRetry: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue('ProdPolicy')
      };
      compositePolicy.addPolicyForErrorType('PROD', prodPolicy);

      const context: RetryContext = {
        error: categoryError,
        retryCount: 1,
        maxRetries: 5,
        eventType: 'test.event'
      };

      // Should use the PROD policy based on the error code category
      expect(compositePolicy.calculateNextRetryDelay(context)).toBe(400);
      expect(prodPolicy.calculateNextRetryDelay).toHaveBeenCalledWith(context);
    });

    it('should return policy name correctly', () => {
      expect(compositePolicy.getName()).toBe('CompositeRetryPolicy');
    });
  });

  describe('RetryPolicyFactory', () => {
    it('should create default policy with default values', () => {
      const policy = RetryPolicyFactory.createDefaultPolicy();
      expect(policy).toBeInstanceOf(ExponentialBackoffRetryPolicy);

      // Test with a context to verify default values are used
      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 0,
        maxRetries: DEFAULT_RETRY.MAX_RETRIES,
        eventType: 'test.event'
      };

      // With default values, first retry should be DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS
      const delay = policy.calculateNextRetryDelay(context);
      expect(delay).toBeGreaterThanOrEqual(DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS * 0.95); // Allow for jitter
      expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS * 1.05); // Allow for jitter
    });

    it('should create default policy with custom values', () => {
      const policy = RetryPolicyFactory.createDefaultPolicy({
        initialDelayMs: 200,
        maxDelayMs: 5000,
        backoffFactor: 3,
        maxRetries: 10,
        useJitter: false
      });

      expect(policy).toBeInstanceOf(ExponentialBackoffRetryPolicy);

      // Test with a context to verify custom values are used
      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 0,
        maxRetries: 10,
        eventType: 'test.event'
      };

      // With custom values, first retry should be 200ms
      expect(policy.calculateNextRetryDelay(context)).toBe(200);

      // Second retry should be 200 * 3^1 = 600ms
      context.retryCount = 1;
      expect(policy.calculateNextRetryDelay(context)).toBe(600);
    });

    it('should create fixed interval policy', () => {
      const policy = RetryPolicyFactory.createFixedIntervalPolicy({
        intervalMs: 500,
        maxRetries: 3,
        useJitter: false
      });

      expect(policy).toBeInstanceOf(FixedIntervalRetryPolicy);

      // Test with a context to verify values are used
      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 0,
        maxRetries: 3,
        eventType: 'test.event'
      };

      // Fixed interval should always be 500ms
      expect(policy.calculateNextRetryDelay(context)).toBe(500);

      context.retryCount = 2;
      expect(policy.calculateNextRetryDelay(context)).toBe(500);
    });

    it('should create linear backoff policy', () => {
      const policy = RetryPolicyFactory.createLinearBackoffPolicy({
        initialDelayMs: 100,
        maxDelayMs: 1000,
        incrementMs: 200,
        maxRetries: 5,
        useJitter: false
      });

      expect(policy).toBeInstanceOf(LinearBackoffRetryPolicy);

      // Test with a context to verify values are used
      const context: RetryContext = {
        error: new Error('Test error'),
        retryCount: 0,
        maxRetries: 5,
        eventType: 'test.event'
      };

      // First retry: initialDelay + (increment * retryCount) = 100 + (200 * 0) = 100
      expect(policy.calculateNextRetryDelay(context)).toBe(100);

      // Second retry: initialDelay + (increment * retryCount) = 100 + (200 * 1) = 300
      context.retryCount = 1;
      expect(policy.calculateNextRetryDelay(context)).toBe(300);
    });

    it('should create error type policy', () => {
      const policy = RetryPolicyFactory.createErrorTypePolicy({
        default: {},
        network: {
          maxRetries: 3,
          initialDelayMs: 200
        },
        database: {
          maxRetries: 5,
          initialDelayMs: 500
        }
      });

      expect(policy).toBeInstanceOf(CompositeRetryPolicy);

      // Create mock errors
      const defaultError = new Error('Default error');
      const networkError = new Error('Network error') as EventProcessingError;
      networkError.code = 'EVENT_DELIV_NETWORK_FAILURE';
      const databaseError = new Error('Database error') as EventProcessingError;
      databaseError.code = 'EVENT_DATABASE_ERROR';

      // Create retry contexts
      const defaultContext: RetryContext = {
        error: defaultError,
        retryCount: 0,
        maxRetries: DEFAULT_RETRY.MAX_RETRIES,
        eventType: 'test.event'
      };

      const networkContext: RetryContext = {
        error: networkError,
        retryCount: 0,
        maxRetries: 3,
        eventType: 'test.event'
      };

      const databaseContext: RetryContext = {
        error: databaseError,
        retryCount: 0,
        maxRetries: 5,
        eventType: 'test.event'
      };

      // Test with different error types
      const defaultDelay = policy.calculateNextRetryDelay(defaultContext);
      const networkDelay = policy.calculateNextRetryDelay(networkContext);
      const databaseDelay = policy.calculateNextRetryDelay(databaseContext);

      // Default should use DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS
      expect(defaultDelay).toBeGreaterThanOrEqual(DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS * 0.95); // Allow for jitter
      expect(defaultDelay).toBeLessThanOrEqual(DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS * 1.05); // Allow for jitter

      // Network should use 200ms
      expect(networkDelay).toBeGreaterThanOrEqual(200 * 0.95); // Allow for jitter
      expect(networkDelay).toBeLessThanOrEqual(200 * 1.05); // Allow for jitter

      // Database should use 500ms
      expect(databaseDelay).toBeGreaterThanOrEqual(500 * 0.95); // Allow for jitter
      expect(databaseDelay).toBeLessThanOrEqual(500 * 1.05); // Allow for jitter
    });

    it('should create journey policy', () => {
      const policy = RetryPolicyFactory.createJourneyPolicy({
        default: {},
        health: {
          maxRetries: 5,
          initialDelayMs: 200
        },
        care: {
          maxRetries: 4,
          initialDelayMs: 500
        },
        plan: {
          maxRetries: 3,
          initialDelayMs: 1000
        }
      });

      expect(policy).toBeInstanceOf(CompositeRetryPolicy);

      // Create mock errors with journey context
      const healthError = new Error('Health error') as EventProcessingError;
      healthError.code = 'HEALTH_EVENT_ERROR';
      const careError = new Error('Care error') as EventProcessingError;
      careError.code = 'CARE_EVENT_ERROR';
      const planError = new Error('Plan error') as EventProcessingError;
      planError.code = 'PLAN_EVENT_ERROR';

      // Create retry contexts
      const healthContext: RetryContext = {
        error: healthError,
        retryCount: 0,
        maxRetries: 5,
        eventType: 'health.event',
        source: 'health'
      };

      const careContext: RetryContext = {
        error: careError,
        retryCount: 0,
        maxRetries: 4,
        eventType: 'care.event',
        source: 'care'
      };

      const planContext: RetryContext = {
        error: planError,
        retryCount: 0,
        maxRetries: 3,
        eventType: 'plan.event',
        source: 'plan'
      };

      // Test with different journey contexts
      const healthDelay = policy.calculateNextRetryDelay(healthContext);
      const careDelay = policy.calculateNextRetryDelay(careContext);
      const planDelay = policy.calculateNextRetryDelay(planContext);

      // Health should use 200ms
      expect(healthDelay).toBeGreaterThanOrEqual(200 * 0.95); // Allow for jitter
      expect(healthDelay).toBeLessThanOrEqual(200 * 1.05); // Allow for jitter

      // Care should use 500ms
      expect(careDelay).toBeGreaterThanOrEqual(500 * 0.95); // Allow for jitter
      expect(careDelay).toBeLessThanOrEqual(500 * 1.05); // Allow for jitter

      // Plan should use 1000ms
      expect(planDelay).toBeGreaterThanOrEqual(1000 * 0.95); // Allow for jitter
      expect(planDelay).toBeLessThanOrEqual(1000 * 1.05); // Allow for jitter
    });
  });

  describe('RetryUtils', () => {
    it('should calculate next retry delay with default policy', () => {
      const delay = RetryUtils.calculateNextRetryDelay(
        new Error('Test error'),
        0,
        'test.event'
      );

      // Should use default policy with DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS
      expect(delay).toBeGreaterThanOrEqual(DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS * 0.95); // Allow for jitter
      expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY.INITIAL_RETRY_DELAY_MS * 1.05); // Allow for jitter
    });

    it('should calculate next retry delay with custom policy', () => {
      const customPolicy = new FixedIntervalRetryPolicy({
        intervalMs: 500,
        useJitter: false
      });

      const delay = RetryUtils.calculateNextRetryDelay(
        new Error('Test error'),
        0,
        'test.event',
        undefined,
        customPolicy
      );

      // Should use custom policy with 500ms
      expect(delay).toBe(500);
    });

    it('should determine if retry should be attempted with default policy', () => {
      // Test with retryable error
      (isRetryableError as jest.Mock).mockReturnValue(true);
      const shouldRetry1 = RetryUtils.shouldRetry(
        new Error('Test error') as EventProcessingError,
        0,
        'test.event'
      );
      expect(shouldRetry1).toBe(true);

      // Test with non-retryable error
      (isRetryableError as jest.Mock).mockReturnValue(false);
      const shouldRetry2 = RetryUtils.shouldRetry(
        new Error('Test error') as EventProcessingError,
        0,
        'test.event'
      );
      expect(shouldRetry2).toBe(false);

      // Test with max retries exceeded
      (isRetryableError as jest.Mock).mockReturnValue(true);
      const shouldRetry3 = RetryUtils.shouldRetry(
        new Error('Test error') as EventProcessingError,
        DEFAULT_RETRY.MAX_RETRIES,
        'test.event'
      );
      expect(shouldRetry3).toBe(false);
    });

    it('should determine if retry should be attempted with custom policy', () => {
      const customPolicy = {
        calculateNextRetryDelay: jest.fn().mockReturnValue(500),
        shouldRetry: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue('CustomPolicy')
      };

      RetryUtils.shouldRetry(
        new Error('Test error'),
        0,
        'test.event',
        undefined,
        customPolicy
      );

      // Should use custom policy
      expect(customPolicy.shouldRetry).toHaveBeenCalled();
    });

    it('should create policy for event based on event type', () => {
      // Test with health event
      const healthPolicy = RetryUtils.createPolicyForEvent('health.metrics.recorded');
      expect(healthPolicy).toBeInstanceOf(ExponentialBackoffRetryPolicy);

      // Test with care event
      const carePolicy = RetryUtils.createPolicyForEvent('care.appointment.booked');
      expect(carePolicy).toBeInstanceOf(ExponentialBackoffRetryPolicy);

      // Test with plan event
      const planPolicy = RetryUtils.createPolicyForEvent('plan.claim.submitted');
      expect(planPolicy).toBeInstanceOf(ExponentialBackoffRetryPolicy);

      // Test with gamification event
      const gamePolicy = RetryUtils.createPolicyForEvent('game.achievement.unlocked');
      expect(gamePolicy).toBeInstanceOf(ExponentialBackoffRetryPolicy);

      // Test with notification event
      const notificationPolicy = RetryUtils.createPolicyForEvent('notification.sent');
      expect(notificationPolicy).toBeInstanceOf(ExponentialBackoffRetryPolicy);

      // Test with unknown event type
      const unknownPolicy = RetryUtils.createPolicyForEvent('unknown.event');
      expect(unknownPolicy).toBeInstanceOf(ExponentialBackoffRetryPolicy);
    });

    it('should create policy for event based on source', () => {
      // Test with health source
      const healthPolicy = RetryUtils.createPolicyForEvent('event.type', 'health');
      expect(healthPolicy).toBeInstanceOf(CompositeRetryPolicy);

      // Test with care source
      const carePolicy = RetryUtils.createPolicyForEvent('event.type', 'care');
      expect(carePolicy).toBeInstanceOf(CompositeRetryPolicy);

      // Test with plan source
      const planPolicy = RetryUtils.createPolicyForEvent('event.type', 'plan');
      expect(planPolicy).toBeInstanceOf(CompositeRetryPolicy);

      // Test with gamification source
      const gamePolicy = RetryUtils.createPolicyForEvent('event.type', 'gamification');
      expect(gamePolicy).toBeInstanceOf(CompositeRetryPolicy);

      // Test with notification source
      const notificationPolicy = RetryUtils.createPolicyForEvent('event.type', 'notification');
      expect(notificationPolicy).toBeInstanceOf(CompositeRetryPolicy);

      // Test with unknown source
      const unknownPolicy = RetryUtils.createPolicyForEvent('event.type', 'unknown');
      expect(unknownPolicy).toBeInstanceOf(ExponentialBackoffRetryPolicy);
    });
  });
});