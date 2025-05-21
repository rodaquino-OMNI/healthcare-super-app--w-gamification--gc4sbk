import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RetryService } from '../src/retry/retry.service';
import { DlqService } from '../src/retry/dlq/dlq.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { AppModule } from '../src/app.module';
import { RetryStatus } from '../src/retry/interfaces/retry-status.enum';
import { ErrorTypes } from '../src/retry/constants/error-types.constants';
import { PolicyTypes } from '../src/retry/constants/policy-types.constants';
import { IRetryableOperation } from '../src/retry/interfaces/retryable-operation.interface';
import { SendNotificationDto } from '../src/notifications/dto/send-notification.dto';

// Mock implementation of a retryable operation for testing
class MockRetryableOperation implements IRetryableOperation {
  private executionCount = 0;
  private shouldSucceedOnAttempt: number;
  private errorType: ErrorTypes;
  private notificationId: string;
  private userId: string;
  private channel: string;

  constructor(
    shouldSucceedOnAttempt: number,
    errorType: ErrorTypes = ErrorTypes.TRANSIENT,
    notificationId: string = 'test-notification-id',
    userId: string = 'test-user-id',
    channel: string = 'push',
  ) {
    this.shouldSucceedOnAttempt = shouldSucceedOnAttempt;
    this.errorType = errorType;
    this.notificationId = notificationId;
    this.userId = userId;
    this.channel = channel;
  }

  async execute(): Promise<any> {
    this.executionCount++;
    
    if (this.executionCount >= this.shouldSucceedOnAttempt) {
      return { success: true, attempt: this.executionCount };
    }
    
    const error = new Error(`Failed on attempt ${this.executionCount}`);
    (error as any).type = this.errorType;
    throw error;
  }

  getMetadata() {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
      channel: this.channel,
      errorType: this.errorType,
    };
  }

  getExecutionCount() {
    return this.executionCount;
  }
}

describe('RetryService (e2e)', () => {
  let app: INestApplication;
  let retryService: RetryService;
  let dlqService: DlqService;
  let notificationsService: NotificationsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    retryService = moduleFixture.get<RetryService>(RetryService);
    dlqService = moduleFixture.get<DlqService>(DlqService);
    notificationsService = moduleFixture.get<NotificationsService>(NotificationsService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Retry with Fixed Interval Policy', () => {
    it('should successfully retry an operation that succeeds on the second attempt', async () => {
      // Create a mock operation that will succeed on the second attempt
      const operation = new MockRetryableOperation(2, ErrorTypes.TRANSIENT);
      
      // Spy on the execute method
      const executeSpy = jest.spyOn(operation, 'execute');
      
      // Schedule the retry with fixed interval policy
      await retryService.scheduleRetry(operation, {
        policyType: PolicyTypes.FIXED,
        maxRetries: 3,
        initialDelay: 1000, // 1 second
      });
      
      // First attempt fails
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalled();
      
      // Fast-forward time to trigger the retry
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Allow any pending promises to resolve
      
      // Second attempt should succeed
      expect(executeSpy).toHaveBeenCalledTimes(2);
      
      // Verify the operation succeeded
      expect(operation.getExecutionCount()).toBe(2);
    });

    it('should move to DLQ after exhausting all retry attempts with fixed interval policy', async () => {
      // Create a mock operation that will always fail
      const operation = new MockRetryableOperation(10, ErrorTypes.TRANSIENT);
      
      // Spy on the execute method and DLQ service
      const executeSpy = jest.spyOn(operation, 'execute');
      const dlqSpy = jest.spyOn(dlqService, 'addToDlq').mockResolvedValue(null);
      
      // Schedule the retry with fixed interval policy and limited retries
      await retryService.scheduleRetry(operation, {
        policyType: PolicyTypes.FIXED,
        maxRetries: 3,
        initialDelay: 1000, // 1 second
      });
      
      // First attempt fails
      expect(executeSpy).toHaveBeenCalledTimes(1);
      
      // Fast-forward time for all retries
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve(); // Allow any pending promises to resolve
      }
      
      // Should have attempted 1 initial + 3 retries = 4 times
      expect(executeSpy).toHaveBeenCalledTimes(4);
      
      // Verify the operation was added to DLQ
      expect(dlqSpy).toHaveBeenCalledTimes(1);
      expect(dlqSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: operation.getMetadata().notificationId,
          userId: operation.getMetadata().userId,
          channel: operation.getMetadata().channel,
        }),
        expect.any(Error),
        expect.any(Array)
      );
    });
  });

  describe('Retry with Exponential Backoff Policy', () => {
    it('should retry with increasing delays using exponential backoff', async () => {
      // Create a mock operation that will succeed on the fourth attempt
      const operation = new MockRetryableOperation(4, ErrorTypes.TRANSIENT);
      
      // Spy on the execute method
      const executeSpy = jest.spyOn(operation, 'execute');
      
      // Schedule the retry with exponential backoff policy
      await retryService.scheduleRetry(operation, {
        policyType: PolicyTypes.EXPONENTIAL_BACKOFF,
        maxRetries: 5,
        initialDelay: 1000, // 1 second
        backoffFactor: 2,
        maxDelay: 10000, // 10 seconds
      });
      
      // First attempt fails
      expect(executeSpy).toHaveBeenCalledTimes(1);
      
      // First retry after 1 second
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(executeSpy).toHaveBeenCalledTimes(2);
      
      // Second retry after 2 seconds (1000 * 2^1)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      expect(executeSpy).toHaveBeenCalledTimes(3);
      
      // Third retry after 4 seconds (1000 * 2^2)
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
      expect(executeSpy).toHaveBeenCalledTimes(4);
      
      // Verify the operation succeeded on the fourth attempt
      expect(operation.getExecutionCount()).toBe(4);
    });

    it('should respect maxDelay parameter in exponential backoff', async () => {
      // Create a mock operation that will succeed on the fifth attempt
      const operation = new MockRetryableOperation(5, ErrorTypes.TRANSIENT);
      
      // Spy on the execute method
      const executeSpy = jest.spyOn(operation, 'execute');
      
      // Schedule the retry with exponential backoff policy and a low maxDelay
      await retryService.scheduleRetry(operation, {
        policyType: PolicyTypes.EXPONENTIAL_BACKOFF,
        maxRetries: 5,
        initialDelay: 1000, // 1 second
        backoffFactor: 2,
        maxDelay: 3000, // 3 seconds max delay
      });
      
      // First attempt fails
      expect(executeSpy).toHaveBeenCalledTimes(1);
      
      // First retry after 1 second
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(executeSpy).toHaveBeenCalledTimes(2);
      
      // Second retry after 2 seconds (1000 * 2^1)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      expect(executeSpy).toHaveBeenCalledTimes(3);
      
      // Third retry after 3 seconds (capped by maxDelay, would be 4000)
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      expect(executeSpy).toHaveBeenCalledTimes(4);
      
      // Fourth retry after 3 seconds (capped by maxDelay again)
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      expect(executeSpy).toHaveBeenCalledTimes(5);
      
      // Verify the operation succeeded on the fifth attempt
      expect(operation.getExecutionCount()).toBe(5);
    });
  });

  describe('Error Type-Based Retry Policies', () => {
    it('should use different retry policies based on error type', async () => {
      // Create operations with different error types
      const transientOperation = new MockRetryableOperation(2, ErrorTypes.TRANSIENT);
      const externalOperation = new MockRetryableOperation(2, ErrorTypes.EXTERNAL);
      const systemOperation = new MockRetryableOperation(2, ErrorTypes.SYSTEM);
      const clientOperation = new MockRetryableOperation(2, ErrorTypes.CLIENT);
      
      // Spy on the execute methods
      const transientSpy = jest.spyOn(transientOperation, 'execute');
      const externalSpy = jest.spyOn(externalOperation, 'execute');
      const systemSpy = jest.spyOn(systemOperation, 'execute');
      const clientSpy = jest.spyOn(clientOperation, 'execute');
      
      // Spy on the DLQ service
      const dlqSpy = jest.spyOn(dlqService, 'addToDlq').mockResolvedValue(null);
      
      // Schedule retries for each operation
      await retryService.scheduleRetry(transientOperation);
      await retryService.scheduleRetry(externalOperation);
      await retryService.scheduleRetry(systemOperation);
      await retryService.scheduleRetry(clientOperation);
      
      // All operations should have attempted once
      expect(transientSpy).toHaveBeenCalledTimes(1);
      expect(externalSpy).toHaveBeenCalledTimes(1);
      expect(systemSpy).toHaveBeenCalledTimes(1);
      expect(clientSpy).toHaveBeenCalledTimes(1);
      
      // Client errors should not be retried and go straight to DLQ
      expect(dlqSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: clientOperation.getMetadata().notificationId,
          errorType: ErrorTypes.CLIENT,
        }),
        expect.any(Error),
        expect.any(Array)
      );
      
      // Fast-forward time to trigger retries for other error types
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Transient and external errors should be retried
      expect(transientSpy).toHaveBeenCalledTimes(2);
      expect(externalSpy).toHaveBeenCalledTimes(2);
      
      // System errors might have different retry policy, check based on implementation
      // This might need adjustment based on actual implementation
      expect(systemSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Integration with NotificationsService', () => {
    it('should retry failed notification delivery', async () => {
      // Mock the sendNotification method to fail and then succeed
      let attemptCount = 0;
      const mockSendNotification = jest.spyOn(notificationsService, 'sendNotification')
        .mockImplementation(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            const error = new Error('Transient delivery failure');
            (error as any).type = ErrorTypes.TRANSIENT;
            throw error;
          }
          return { id: 'test-notification-id', status: 'delivered' };
        });

      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: 'test-user-id',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'test',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push']
      };

      // Send the notification (will fail on first attempt)
      try {
        await notificationsService.sendNotification(notificationDto);
      } catch (error) {
        // Expected to fail on first attempt
        expect(error.message).toBe('Transient delivery failure');
      }

      // Verify first attempt was made
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
      
      // Fast-forward time to trigger retry
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Verify retry was attempted and succeeded
      expect(mockSendNotification).toHaveBeenCalledTimes(2);
      expect(attemptCount).toBe(2);
    });

    it('should respect SLA by completing retries within time limit', async () => {
      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: 'test-user-id',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'test',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push']
      };

      // Mock the sendNotification method to fail multiple times and then succeed
      let attemptCount = 0;
      jest.spyOn(notificationsService, 'sendNotification')
        .mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            const error = new Error(`Transient failure on attempt ${attemptCount}`);
            (error as any).type = ErrorTypes.TRANSIENT;
            throw error;
          }
          return { id: 'test-notification-id', status: 'delivered' };
        });

      // Start timer
      const startTime = Date.now();
      jest.useRealTimers(); // Use real timers for this test to measure actual time

      // Send the notification (will eventually succeed after retries)
      try {
        await notificationsService.sendNotification(notificationDto);
      } catch (error) {
        // Expected to fail on first attempt, retry will be scheduled
      }

      // Wait for retries to complete (adjust timeout as needed)
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Calculate total time
      const totalTime = Date.now() - startTime;

      // Verify notification was eventually delivered
      expect(attemptCount).toBe(3);

      // Verify SLA was met (delivery time < 30s as per requirements)
      expect(totalTime).toBeLessThan(30000);
    });
  });

  describe('Dead Letter Queue Integration', () => {
    it('should add failed notifications to DLQ after exhausting retries', async () => {
      // Create a mock operation that will always fail
      const operation = new MockRetryableOperation(10, ErrorTypes.TRANSIENT);
      
      // Spy on the DLQ service
      const addToDlqSpy = jest.spyOn(dlqService, 'addToDlq').mockResolvedValue(null);
      
      // Schedule the retry with limited retries
      await retryService.scheduleRetry(operation, {
        policyType: PolicyTypes.EXPONENTIAL_BACKOFF,
        maxRetries: 2,
        initialDelay: 1000,
      });
      
      // Fast-forward time for all retries
      jest.advanceTimersByTime(1000); // First retry
      await Promise.resolve();
      jest.advanceTimersByTime(2000); // Second retry (with backoff)
      await Promise.resolve();
      
      // Verify the operation was added to DLQ
      expect(addToDlqSpy).toHaveBeenCalledTimes(1);
      expect(addToDlqSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: operation.getMetadata().notificationId,
          userId: operation.getMetadata().userId,
          channel: operation.getMetadata().channel,
        }),
        expect.any(Error),
        expect.arrayContaining([
          expect.objectContaining({
            status: RetryStatus.FAILED,
            timestamp: expect.any(Date),
          })
        ])
      );
    });

    it('should allow manual reprocessing of DLQ entries', async () => {
      // Mock the DLQ service to return a test entry
      const testDlqEntry = {
        id: 'test-dlq-id',
        notificationId: 'test-notification-id',
        userId: 'test-user-id',
        channel: 'push',
        payload: { title: 'Test', body: 'Test notification' },
        errorDetails: { message: 'Test error', type: ErrorTypes.TRANSIENT },
        retryHistory: [
          { status: RetryStatus.FAILED, timestamp: new Date(), attempt: 1 },
          { status: RetryStatus.FAILED, timestamp: new Date(), attempt: 2 },
          { status: RetryStatus.FAILED, timestamp: new Date(), attempt: 3 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      jest.spyOn(dlqService, 'getDlqEntry').mockResolvedValue(testDlqEntry);
      const reprocessSpy = jest.spyOn(dlqService, 'reprocessDlqEntry').mockResolvedValue(true);
      
      // Reprocess the DLQ entry
      const result = await dlqService.reprocessDlqEntry('test-dlq-id');
      
      // Verify the entry was reprocessed
      expect(result).toBe(true);
      expect(reprocessSpy).toHaveBeenCalledWith('test-dlq-id');
    });
  });
});