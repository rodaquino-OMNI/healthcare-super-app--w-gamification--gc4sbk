import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RetryService } from '../src/retry/retry.service';
import { DlqService } from '../src/retry/dlq/dlq.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { RetryModule } from '../src/retry/retry.module';
import { AppModule } from '../src/app.module';
import { RetryStatus } from '../src/retry/interfaces/retry-status.enum';
import { IRetryableOperation } from '../src/retry/interfaces/retryable-operation.interface';
import { IRetryPolicy } from '../src/retry/interfaces/retry-policy.interface';
import { IRetryOptions, IFixedDelayOptions, IExponentialBackoffOptions } from '../src/retry/interfaces/retry-options.interface';
import { IDlqEntry } from '../src/retry/interfaces/dlq-entry.interface';
import { FixedIntervalPolicy } from '../src/retry/policies/fixed-interval.policy';
import { ExponentialBackoffPolicy } from '../src/retry/policies/exponential-backoff.policy';
import { MaxAttemptsPolicy } from '../src/retry/policies/max-attempts.policy';
import { CompositePolicy } from '../src/retry/policies/composite.policy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DlqEntry } from '../src/retry/dlq/dlq-entry.entity';
import { Repository } from 'typeorm';
import { RETRY_CONSTANTS } from '../src/retry/constants';

// Define retry constants for testing if not already defined
const RETRY_CONSTANTS = {
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_FIXED_DELAY_MS: 5000,
  DEFAULT_INITIAL_DELAY_MS: 1000,
  DEFAULT_MAX_DELAY_MS: 30000,
  DEFAULT_BACKOFF_FACTOR: 2,
  DEFAULT_JITTER_FACTOR: 0.2,
  REDIS_RETRY_KEY_PREFIX: 'notification:retry:',
  REDIS_RETRY_QUEUE_KEY: 'notification:retry:queue',
  REDIS_RETRY_LOCK_KEY: 'notification:retry:lock',
  REDIS_LOCK_TTL_MS: 30000,
  ERROR_TYPES: {
    TRANSIENT: 'transient',
    PERMANENT: 'permanent',
    RATE_LIMIT: 'rate_limit',
    NETWORK: 'network',
    VALIDATION: 'validation',
    UNKNOWN: 'unknown'
  }
};

// Mock retryable operation for testing
class MockRetryableOperation implements IRetryableOperation {
  private status: RetryStatus = RetryStatus.PENDING;
  private attempts = 0;
  private maxAttempts: number;
  private shouldSucceedOnAttempt: number;
  private error: Error | null = null;
  
  constructor(
    private readonly id: string,
    private readonly channel: string,
    private readonly userId: string,
    maxAttempts = 3,
    shouldSucceedOnAttempt = 2
  ) {
    this.maxAttempts = maxAttempts;
    this.shouldSucceedOnAttempt = shouldSucceedOnAttempt;
  }

  async execute(): Promise<boolean> {
    this.attempts++;
    this.status = RetryStatus.IN_PROGRESS;
    
    if (this.attempts >= this.shouldSucceedOnAttempt) {
      this.status = RetryStatus.SUCCEEDED;
      return true;
    }
    
    this.error = new Error(`Failed on attempt ${this.attempts}`);
    this.status = RetryStatus.FAILED;
    throw this.error;
  }

  getMetadata() {
    return {
      id: this.id,
      channel: this.channel,
      userId: this.userId,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      status: this.status,
      error: this.error,
    };
  }

  getStatus(): RetryStatus {
    return this.status;
  }

  getError(): Error | null {
    return this.error;
  }
}

// Mock network error for testing specific retry policies
class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Mock rate limit error for testing specific retry policies
class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

describe('RetryService (e2e)', () => {
  describe('Initialization and Configuration', () => {
    let moduleFixture: TestingModule;
    let initRetryService: RetryService;
    
    beforeEach(async () => {
      moduleFixture = await Test.createTestingModule({
        imports: [RetryModule],
      }).compile();
      
      initRetryService = moduleFixture.get<RetryService>(RetryService);
    });
    
    afterEach(async () => {
      await moduleFixture.close();
    });
    
    it('should initialize with default policies', () => {
      // Verify default policies are registered
      expect(initRetryService.hasPolicy('fixed')).toBe(true);
      expect(initRetryService.hasPolicy('exponential')).toBe(true);
      expect(initRetryService.hasPolicy('maxAttempts')).toBe(true);
    });
    
    it('should load configuration from environment variables', () => {
      // Verify configuration is loaded
      const config = initRetryService.getConfiguration();
      expect(config).toBeDefined();
      expect(config.maxRetries).toBeDefined();
      expect(config.defaultPolicy).toBeDefined();
    });
    
    it('should register custom policies', () => {
      // Create and register a custom policy
      const customPolicy: IRetryPolicy = {
        calculateNextRetryTime: jest.fn().mockReturnValue(Date.now() + 1000),
        shouldRetry: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue('custom'),
      };
      
      initRetryService.registerPolicy('custom', customPolicy);
      
      // Verify custom policy is registered
      expect(initRetryService.hasPolicy('custom')).toBe(true);
      expect(initRetryService.getPolicy('custom')).toBe(customPolicy);
    });
  });
  
  let app: INestApplication;
  let retryService: RetryService;
  let dlqService: DlqService;
  let dlqRepository: Repository<DlqEntry>;
  let notificationsService: NotificationsService;
  
  // Mock services
  const mockDlqService = {
    addToDlq: jest.fn().mockResolvedValue(true),
    getDlqEntries: jest.fn().mockResolvedValue([]),
    getDlqEntry: jest.fn().mockResolvedValue(null),
    reprocessDlqEntry: jest.fn().mockResolvedValue(true),
    resolveDlqEntry: jest.fn().mockResolvedValue(true),
  };

  const mockNotificationsService = {
    sendNotification: jest.fn().mockResolvedValue(true),
    resendNotification: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    // Use fake timers for controlling time in tests
    jest.useFakeTimers();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, RetryModule],
    })
      .overrideProvider(DlqService)
      .useValue(mockDlqService)
      .overrideProvider(NotificationsService)
      .useValue(mockNotificationsService)
      .overrideProvider(getRepositoryToken(DlqEntry))
      .useValue({
        save: jest.fn().mockResolvedValue(new DlqEntry()),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    retryService = moduleFixture.get<RetryService>(RetryService);
    dlqService = moduleFixture.get<DlqService>(DlqService);
    dlqRepository = moduleFixture.get<Repository<DlqEntry>>(getRepositoryToken(DlqEntry));
    notificationsService = moduleFixture.get<NotificationsService>(NotificationsService);
    
    // Register policies for testing
    const fixedPolicy = new FixedIntervalPolicy({ 
      maxRetries: 3, 
      delay: 5000, // 5 seconds
      jitter: 0 // No jitter for predictable testing
    });
    
    const exponentialPolicy = new ExponentialBackoffPolicy({
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2,
      jitter: 0 // No jitter for predictable testing
    });
    
    // Register policies with the retry service
    retryService.registerPolicy('fixed', fixedPolicy);
    retryService.registerPolicy('exponential', exponentialPolicy);
    
    // Configure error-specific policies
    retryService.registerErrorPolicy(NetworkError, 'exponential');
    retryService.registerErrorPolicy(RateLimitError, 'fixed');
  });

  afterAll(async () => {
    jest.useRealTimers();
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Retry Scheduling and Execution', () => {
    it('should successfully retry an operation that fails initially but succeeds on retry', async () => {
      // Create a mock operation that will succeed on the 2nd attempt
      const operation = new MockRetryableOperation(
        'notification-123',
        'push',
        'user-456',
        3, // max attempts
        2  // succeed on attempt #2
      );
      
      // Schedule the retry with fixed interval policy
      await retryService.scheduleRetry(operation, 'fixed');
      
      // Verify initial state
      expect(operation.getStatus()).toBe(RetryStatus.FAILED);
      expect(operation.getMetadata().attempts).toBe(1);
      
      // Advance time to trigger the retry
      jest.advanceTimersByTime(5000); // 5 seconds for fixed policy
      
      // Allow any pending promises to resolve
      await jest.runAllTimersAsync();
      
      // Verify the operation was retried and succeeded
      expect(operation.getStatus()).toBe(RetryStatus.SUCCEEDED);
      expect(operation.getMetadata().attempts).toBe(2);
      expect(mockDlqService.addToDlq).not.toHaveBeenCalled();
    });
    
    it('should move to DLQ after exhausting retry attempts', async () => {
      // Create a mock operation that will always fail
      const operation = new MockRetryableOperation(
        'notification-456',
        'email',
        'user-789',
        3, // max attempts
        10 // succeed on attempt #10 (beyond max attempts)
      );
      
      // Schedule the retry with fixed interval policy
      await retryService.scheduleRetry(operation, 'fixed');
      
      // First retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Second retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Third retry (should exhaust attempts)
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify the operation was moved to DLQ after exhausting retries
      expect(operation.getStatus()).toBe(RetryStatus.EXHAUSTED);
      expect(operation.getMetadata().attempts).toBe(3);
      expect(mockDlqService.addToDlq).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: 'notification-456',
          userId: 'user-789',
          channel: 'email',
        })
      );
    });
  });
  
  describe('Retry Policies', () => {
    it('should use composite policy to combine multiple policies', async () => {
      // Create a composite policy with both fixed and exponential policies
      const fixedPolicy = new FixedIntervalPolicy({ 
        maxRetries: 3, 
        delay: 5000,
        jitter: 0
      });
      
      const exponentialPolicy = new ExponentialBackoffPolicy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
        jitter: 0
      });
      
      const maxAttemptsPolicy = new MaxAttemptsPolicy({
        maxRetries: 2 // Stricter limit than other policies
      });
      
      // Create composite policy
      const compositePolicy = new CompositePolicy();
      compositePolicy.addPolicy('fixed', fixedPolicy);
      compositePolicy.addPolicy('exponential', exponentialPolicy);
      compositePolicy.addPolicy('maxAttempts', maxAttemptsPolicy);
      
      // Register error-specific policy mappings
      compositePolicy.addErrorTypePolicy(NetworkError, 'exponential');
      compositePolicy.addErrorTypePolicy(RateLimitError, 'fixed');
      compositePolicy.setDefaultPolicy('maxAttempts');
      
      // Register with retry service
      retryService.registerPolicy('composite', compositePolicy);
      
      // Create operations with different error types
      const networkOperation = new MockRetryableOperation(
        'notification-composite-network',
        'push',
        'user-composite'
      );
      
      const rateLimitOperation = new MockRetryableOperation(
        'notification-composite-ratelimit',
        'push',
        'user-composite'
      );
      
      const genericOperation = new MockRetryableOperation(
        'notification-composite-generic',
        'push',
        'user-composite'
      );
      
      // Override execute to throw specific errors
      jest.spyOn(networkOperation, 'execute').mockImplementation(() => {
        throw new NetworkError('Connection failed');
      });
      
      jest.spyOn(rateLimitOperation, 'execute').mockImplementation(() => {
        throw new RateLimitError('Too many requests');
      });
      
      jest.spyOn(genericOperation, 'execute').mockImplementation(() => {
        throw new Error('Generic error');
      });
      
      // Schedule retries with composite policy
      await retryService.scheduleRetry(networkOperation, 'composite');
      await retryService.scheduleRetry(rateLimitOperation, 'composite');
      await retryService.scheduleRetry(genericOperation, 'composite');
      
      // Verify policy selection through the composite policy
      expect(compositePolicy.getPolicyForError(new NetworkError('test'))).toBe(exponentialPolicy);
      expect(compositePolicy.getPolicyForError(new RateLimitError('test'))).toBe(fixedPolicy);
      expect(compositePolicy.getPolicyForError(new Error('test'))).toBe(maxAttemptsPolicy);
    });
    
    it('should use fixed interval policy with consistent delays', async () => {
      const operation = new MockRetryableOperation(
        'notification-fixed',
        'sms',
        'user-fixed',
        3, // max attempts
        4  // never succeed within max attempts
      );
      
      // Mock the scheduleRetry method to track timing
      const originalScheduleMethod = retryService.scheduleRetry;
      const scheduleRetryMock = jest.fn();
      retryService.scheduleRetry = scheduleRetryMock;
      
      // Initial scheduling
      await originalScheduleMethod.call(retryService, operation, 'fixed');
      
      // Verify initial scheduling
      expect(scheduleRetryMock).not.toHaveBeenCalled();
      
      // First retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Second retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify consistent timing between retries
      expect(scheduleRetryMock).toHaveBeenCalledTimes(2);
      
      // Restore original method
      retryService.scheduleRetry = originalScheduleMethod;
    });
    
    it('should use exponential backoff policy with increasing delays', async () => {
      const operation = new MockRetryableOperation(
        'notification-exponential',
        'push',
        'user-exponential',
        3, // max attempts
        4  // never succeed within max attempts
      );
      
      // Throw a NetworkError to trigger exponential backoff policy
      jest.spyOn(operation, 'execute').mockImplementation(() => {
        throw new NetworkError('Connection failed');
      });
      
      // Mock the scheduleRetry method to track timing
      const originalScheduleMethod = retryService.scheduleRetry;
      const scheduleRetryMock = jest.fn();
      retryService.scheduleRetry = scheduleRetryMock;
      
      // Initial scheduling
      await originalScheduleMethod.call(retryService, operation);
      
      // Verify initial scheduling
      expect(scheduleRetryMock).not.toHaveBeenCalled();
      
      // First retry (1000ms)
      jest.advanceTimersByTime(1000);
      await jest.runAllTimersAsync();
      
      // Second retry (2000ms)
      jest.advanceTimersByTime(2000);
      await jest.runAllTimersAsync();
      
      // Third retry (4000ms)
      jest.advanceTimersByTime(4000);
      await jest.runAllTimersAsync();
      
      // Verify increasing delays between retries
      expect(scheduleRetryMock).toHaveBeenCalledTimes(3);
      
      // Restore original method
      retryService.scheduleRetry = originalScheduleMethod;
    });
    
    it('should select appropriate policy based on error type', async () => {
      // Create operations with different error types
      const networkOperation = new MockRetryableOperation(
        'notification-network',
        'push',
        'user-network'
      );
      
      const rateLimitOperation = new MockRetryableOperation(
        'notification-ratelimit',
        'push',
        'user-ratelimit'
      );
      
      // Override execute to throw specific errors
      jest.spyOn(networkOperation, 'execute').mockImplementation(() => {
        throw new NetworkError('Connection failed');
      });
      
      jest.spyOn(rateLimitOperation, 'execute').mockImplementation(() => {
        throw new RateLimitError('Too many requests');
      });
      
      // Spy on policy selection
      const getPolicySpy = jest.spyOn(retryService, 'getPolicyForError');
      
      // Schedule retries
      await retryService.scheduleRetry(networkOperation);
      await retryService.scheduleRetry(rateLimitOperation);
      
      // Verify policy selection
      expect(getPolicySpy).toHaveBeenCalledTimes(2);
      expect(getPolicySpy).toHaveBeenCalledWith(expect.any(NetworkError));
      expect(getPolicySpy).toHaveBeenCalledWith(expect.any(RateLimitError));
      
      // Verify the correct policies were selected
      expect(getPolicySpy.mock.results[0].value).toBe('exponential');
      expect(getPolicySpy.mock.results[1].value).toBe('fixed');
    });
  });
  
  describe('DLQ Integration', () => {
    it('should add to DLQ when retries are exhausted', async () => {
      const operation = new MockRetryableOperation(
        'notification-dlq',
        'email',
        'user-dlq',
        2, // max attempts
        5  // never succeed within max attempts
      );
      
      // Schedule retry
      await retryService.scheduleRetry(operation, 'fixed');
      
      // First retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Second retry (should exhaust attempts)
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify DLQ integration
      expect(mockDlqService.addToDlq).toHaveBeenCalledTimes(1);
      expect(mockDlqService.addToDlq).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: 'notification-dlq',
          userId: 'user-dlq',
          channel: 'email',
          errorDetails: expect.any(Object),
          retryHistory: expect.any(Array)
        })
      );
    });
    
    it('should track retry history in DLQ entries', async () => {
      const operation = new MockRetryableOperation(
        'notification-history',
        'push',
        'user-history',
        2, // max attempts
        5  // never succeed within max attempts
      );
      
      // Schedule retry
      await retryService.scheduleRetry(operation, 'fixed');
      
      // First retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Second retry (should exhaust attempts)
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify retry history in DLQ entry
      expect(mockDlqService.addToDlq).toHaveBeenCalledWith(
        expect.objectContaining({
          retryHistory: expect.arrayContaining([
            expect.objectContaining({
              attempt: 1,
              timestamp: expect.any(Date),
              error: expect.any(Object)
            }),
            expect.objectContaining({
              attempt: 2,
              timestamp: expect.any(Date),
              error: expect.any(Object)
            })
          ])
        })
      );
    });
    
    it('should support manual reprocessing from DLQ', async () => {
      // Mock DLQ entry
      const dlqEntry = {
        id: 'dlq-123',
        notificationId: 'notification-reprocess',
        userId: 'user-reprocess',
        channel: 'email',
        payload: { title: 'Test', body: 'Test body' },
        errorDetails: { message: 'Failed after multiple attempts' },
        retryHistory: [
          { attempt: 1, timestamp: new Date(), error: { message: 'First failure' } },
          { attempt: 2, timestamp: new Date(), error: { message: 'Second failure' } }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock successful reprocessing
      mockDlqService.getDlqEntry.mockResolvedValueOnce(dlqEntry);
      mockDlqService.reprocessDlqEntry.mockResolvedValueOnce(true);
      mockNotificationsService.resendNotification.mockResolvedValueOnce(true);
      
      // Reprocess the DLQ entry
      const result = await retryService.reprocessFromDlq('dlq-123');
      
      // Verify reprocessing
      expect(result).toBe(true);
      expect(mockDlqService.getDlqEntry).toHaveBeenCalledWith('dlq-123');
      expect(mockNotificationsService.resendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: 'notification-reprocess',
          userId: 'user-reprocess',
          channel: 'email',
          payload: { title: 'Test', body: 'Test body' }
        })
      );
      expect(mockDlqService.resolveDlqEntry).toHaveBeenCalledWith('dlq-123', 'Manually reprocessed successfully');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors during retry scheduling', async () => {
      const operation = new MockRetryableOperation(
        'notification-error',
        'push',
        'user-error'
      );
      
      // Mock Redis error during scheduling
      jest.spyOn(retryService, 'scheduleRetryInRedis').mockRejectedValueOnce(
        new Error('Redis connection failed')
      );
      
      // Attempt to schedule retry
      await retryService.scheduleRetry(operation, 'fixed');
      
      // Verify fallback to immediate retry
      expect(mockDlqService.addToDlq).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: 'notification-error',
          errorDetails: expect.objectContaining({
            message: 'Redis connection failed'
          })
        })
      );
    });
    
    it('should handle errors during retry execution', async () => {
      const operation = new MockRetryableOperation(
        'notification-exec-error',
        'push',
        'user-exec-error'
      );
      
      // Schedule retry
      await retryService.scheduleRetry(operation, 'fixed');
      
      // Mock unexpected error during retry execution
      jest.spyOn(retryService, 'executeRetry').mockRejectedValueOnce(
        new Error('Unexpected execution error')
      );
      
      // Trigger retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify error handling
      expect(mockDlqService.addToDlq).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: 'notification-exec-error',
          errorDetails: expect.objectContaining({
            message: 'Unexpected execution error'
          })
        })
      );
    });
  });
  
  describe('Performance and SLA Compliance', () => {
    it('should process retries within SLA timeframe', async () => {
      // Create multiple operations for batch processing
      const operations = Array.from({ length: 10 }, (_, i) => 
        new MockRetryableOperation(
          `notification-perf-${i}`,
          'push',
          `user-perf-${i}`,
          3,
          2 // succeed on second attempt
        )
      );
      
      // Schedule all operations
      const startTime = Date.now();
      await Promise.all(operations.map(op => retryService.scheduleRetry(op, 'fixed')));
      
      // Trigger retries
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify all operations succeeded
      const allSucceeded = operations.every(op => op.getStatus() === RetryStatus.SUCCEEDED);
      expect(allSucceeded).toBe(true);
      
      // Verify processing time is within SLA (30s)
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(30000); // 30s SLA
    });
    
    it('should handle high volume of retry operations efficiently', async () => {
      // Create a large batch of operations
      const operations = Array.from({ length: 50 }, (_, i) => 
        new MockRetryableOperation(
          `notification-volume-${i}`,
          i % 2 === 0 ? 'push' : 'email',
          `user-volume-${i}`,
          3,
          i % 3 === 0 ? 1 : 2 // Some succeed immediately, others on second attempt
        )
      );
      
      // Mock batch processing method
      const processBatchSpy = jest.spyOn(retryService, 'processBatch');
      
      // Schedule all operations
      await Promise.all(operations.map(op => retryService.scheduleRetry(op, 'fixed')));
      
      // Trigger retries
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify batch processing was used for efficiency
      expect(processBatchSpy).toHaveBeenCalled();
      
      // Verify all operations were processed
      const processedCount = operations.filter(op => 
        op.getStatus() === RetryStatus.SUCCEEDED || op.getMetadata().attempts > 1
      ).length;
      
      expect(processedCount).toBe(50);
    });
  });
  
  describe('Journey-Specific Retry Behavior', () => {
    it('should apply journey-specific retry policies', async () => {
      // Create operations for different journeys
      const healthOperation = new MockRetryableOperation(
        'notification-health',
        'push',
        'user-health'
      );
      healthOperation['journey'] = 'health';
      
      const careOperation = new MockRetryableOperation(
        'notification-care',
        'push',
        'user-care'
      );
      careOperation['journey'] = 'care';
      
      const planOperation = new MockRetryableOperation(
        'notification-plan',
        'push',
        'user-plan'
      );
      planOperation['journey'] = 'plan';
      
      // Spy on policy selection
      const getPolicySpy = jest.spyOn(retryService, 'getPolicyForJourney');
      
      // Schedule retries
      await retryService.scheduleRetry(healthOperation);
      await retryService.scheduleRetry(careOperation);
      await retryService.scheduleRetry(planOperation);
      
      // Verify journey-specific policy selection
      expect(getPolicySpy).toHaveBeenCalledTimes(3);
      expect(getPolicySpy).toHaveBeenCalledWith('health');
      expect(getPolicySpy).toHaveBeenCalledWith('care');
      expect(getPolicySpy).toHaveBeenCalledWith('plan');
    });
    
    it('should prioritize critical journey notifications for retry', async () => {
      // Create operations with different priorities
      const criticalOperation = new MockRetryableOperation(
        'notification-critical',
        'push',
        'user-critical'
      );
      criticalOperation['priority'] = 'high';
      criticalOperation['journey'] = 'care';
      
      const normalOperation = new MockRetryableOperation(
        'notification-normal',
        'push',
        'user-normal'
      );
      normalOperation['priority'] = 'normal';
      normalOperation['journey'] = 'plan';
      
      // Spy on priority handling
      const prioritizeSpy = jest.spyOn(retryService, 'prioritizeRetries');
      
      // Schedule retries
      await Promise.all([
        retryService.scheduleRetry(normalOperation, 'fixed'),
        retryService.scheduleRetry(criticalOperation, 'fixed')
      ]);
      
      // Verify priority handling
      expect(prioritizeSpy).toHaveBeenCalled();
      
      // Trigger processing
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify critical operation was processed first
      const processingOrder = prioritizeSpy.mock.results[0].value;
      expect(processingOrder[0].id).toBe('notification-critical');
    });
  });
  
  describe('Integration with NotificationsService', () => {
    it('should retry failed notifications from NotificationsService', async () => {
      // Create a mock notification
      const notification = {
        id: 'notification-integration',
        userId: 'user-integration',
        title: 'Integration Test',
        body: 'Testing integration with NotificationsService',
        type: 'test',
        journey: 'health',
        data: { testId: '123' },
        channels: ['push', 'email']
      };
      
      // Mock NotificationsService.sendNotification to fail for push channel
      const originalSendMethod = notificationsService.sendNotification;
      mockNotificationsService.sendNotification.mockImplementation((dto) => {
        if (dto.channels.includes('push')) {
          throw new NetworkError('Push notification service unavailable');
        }
        return Promise.resolve(true);
      });
      
      // Mock RetryService.scheduleRetry to track calls
      const scheduleRetrySpy = jest.spyOn(retryService, 'scheduleRetry');
      
      // Attempt to send notification
      try {
        await notificationsService.sendNotification(notification);
      } catch (error) {
        // Error is expected
      }
      
      // Verify RetryService.scheduleRetry was called
      expect(scheduleRetrySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          getMetadata: expect.any(Function),
        }),
        expect.any(String)
      );
      
      // Restore original methods
      notificationsService.sendNotification = originalSendMethod;
    });
    
    it('should handle notification channel fallback during retries', async () => {
      // Create a mock notification with multiple channels
      const notification = {
        id: 'notification-fallback',
        userId: 'user-fallback',
        title: 'Fallback Test',
        body: 'Testing channel fallback during retries',
        type: 'test',
        journey: 'care',
        data: { testId: '456' },
        channels: ['push', 'email', 'sms']
      };
      
      // Mock channel-specific errors
      class PushChannelError extends Error {
        constructor() {
          super('Push channel failed');
          this.name = 'PushChannelError';
        }
      }
      
      // Mock NotificationsService to fail on push but succeed on email
      mockNotificationsService.sendNotification.mockImplementation((dto) => {
        if (dto.channels[0] === 'push') {
          throw new PushChannelError();
        }
        return Promise.resolve(true);
      });
      
      // Mock RetryService.executeWithFallback
      const fallbackSpy = jest.spyOn(retryService, 'executeWithFallback');
      
      // Attempt to send notification
      try {
        await notificationsService.sendNotification(notification);
      } catch (error) {
        // Initial error is expected
      }
      
      // Trigger retry with fallback
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify fallback was attempted
      expect(fallbackSpy).toHaveBeenCalled();
      expect(mockNotificationsService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          channels: ['email', 'sms'] // push removed after failure
        })
      );
    });
  });
  
  describe('Channel-Specific Retry Behavior', () => {
    it('should apply different retry policies based on notification channel', async () => {
      // Create operations for different channels
      const pushOperation = new MockRetryableOperation(
        'notification-push',
        'push',
        'user-push'
      );
      
      const emailOperation = new MockRetryableOperation(
        'notification-email',
        'email',
        'user-email'
      );
      
      const smsOperation = new MockRetryableOperation(
        'notification-sms',
        'sms',
        'user-sms'
      );
      
      // Spy on policy selection
      const getPolicySpy = jest.spyOn(retryService, 'getPolicyForChannel');
      
      // Schedule retries
      await retryService.scheduleRetry(pushOperation);
      await retryService.scheduleRetry(emailOperation);
      await retryService.scheduleRetry(smsOperation);
      
      // Verify channel-specific policy selection
      expect(getPolicySpy).toHaveBeenCalledTimes(3);
      expect(getPolicySpy).toHaveBeenCalledWith('push');
      expect(getPolicySpy).toHaveBeenCalledWith('email');
      expect(getPolicySpy).toHaveBeenCalledWith('sms');
    });
    
    it('should handle channel-specific errors appropriately', async () => {
      // Create channel-specific error types
      class PushDeliveryError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'PushDeliveryError';
        }
      }
      
      class EmailDeliveryError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'EmailDeliveryError';
        }
      }
      
      // Create operations with channel-specific errors
      const pushOperation = new MockRetryableOperation(
        'notification-push-error',
        'push',
        'user-push-error'
      );
      
      const emailOperation = new MockRetryableOperation(
        'notification-email-error',
        'email',
        'user-email-error'
      );
      
      // Override execute to throw channel-specific errors
      jest.spyOn(pushOperation, 'execute').mockImplementation(() => {
        throw new PushDeliveryError('FCM service unavailable');
      });
      
      jest.spyOn(emailOperation, 'execute').mockImplementation(() => {
        throw new EmailDeliveryError('SMTP connection failed');
      });
      
      // Register error-specific policies
      retryService.registerErrorPolicy(PushDeliveryError, 'exponential');
      retryService.registerErrorPolicy(EmailDeliveryError, 'fixed');
      
      // Schedule retries
      await retryService.scheduleRetry(pushOperation);
      await retryService.scheduleRetry(emailOperation);
      
      // Verify error-specific policy selection
      const getPolicySpy = jest.spyOn(retryService, 'getPolicyForError');
      expect(getPolicySpy).toHaveBeenCalledWith(expect.any(PushDeliveryError));
      expect(getPolicySpy).toHaveBeenCalledWith(expect.any(EmailDeliveryError));
    });
  });
  
  describe('Observability and Monitoring', () => {
    it('should emit metrics for retry operations', async () => {
      // Mock metrics service
      const mockMetricsService = {
        incrementCounter: jest.fn(),
        recordHistogram: jest.fn(),
        recordGauge: jest.fn(),
      };
      
      // Inject mock metrics service
      const originalMetricsService = (retryService as any).metricsService;
      (retryService as any).metricsService = mockMetricsService;
      
      // Create and schedule an operation
      const operation = new MockRetryableOperation(
        'notification-metrics',
        'push',
        'user-metrics',
        3,
        2 // succeed on second attempt
      );
      
      await retryService.scheduleRetry(operation, 'fixed');
      
      // Trigger retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify metrics were emitted
      expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
        'notification_retry_attempts_total',
        expect.any(Object)
      );
      
      expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
        'notification_retry_duration_ms',
        expect.any(Number),
        expect.any(Object)
      );
      
      // Restore original metrics service
      (retryService as any).metricsService = originalMetricsService;
    });
    
    it('should log retry operations for traceability', async () => {
      // Mock logger
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      
      // Inject mock logger
      const originalLogger = (retryService as any).logger;
      (retryService as any).logger = mockLogger;
      
      // Create and schedule an operation
      const operation = new MockRetryableOperation(
        'notification-logging',
        'push',
        'user-logging',
        3,
        2 // succeed on second attempt
      );
      
      await retryService.scheduleRetry(operation, 'fixed');
      
      // Trigger retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Scheduling retry'),
        expect.objectContaining({
          notificationId: 'notification-logging',
          attempt: expect.any(Number),
        })
      );
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retry succeeded'),
        expect.objectContaining({
          notificationId: 'notification-logging',
          attempts: 2,
        })
      );
      
      // Restore original logger
      (retryService as any).logger = originalLogger;
    });
    
    it('should create spans for distributed tracing', async () => {
      // Mock tracer
      const mockTracer = {
        startSpan: jest.fn().mockReturnValue({
          setTag: jest.fn(),
          log: jest.fn(),
          finish: jest.fn(),
        }),
      };
      
      // Inject mock tracer
      const originalTracer = (retryService as any).tracer;
      (retryService as any).tracer = mockTracer;
      
      // Create and schedule an operation
      const operation = new MockRetryableOperation(
        'notification-tracing',
        'push',
        'user-tracing',
        3,
        2 // succeed on second attempt
      );
      
      await retryService.scheduleRetry(operation, 'fixed');
      
      // Trigger retry
      jest.advanceTimersByTime(5000);
      await jest.runAllTimersAsync();
      
      // Verify tracing
      expect(mockTracer.startSpan).toHaveBeenCalledWith(
        'notification.retry',
        expect.any(Object)
      );
      
      // Restore original tracer
      (retryService as any).tracer = originalTracer;
    });
  });
});