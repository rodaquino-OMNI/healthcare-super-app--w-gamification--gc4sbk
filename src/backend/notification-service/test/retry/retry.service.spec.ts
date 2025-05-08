import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RetryService } from '../../src/retry/retry.service';
import { DlqService } from '../../src/retry/dlq/dlq.service';
import { Notification } from '../../src/notifications/entities/notification.entity';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { LoggerService } from '../../../shared/src/logging/logger.service';
import { TracingService } from '../../../shared/src/tracing/tracing.service';
import { RetryStatus } from '../../src/retry/interfaces/retry-status.enum';
import { IRetryableOperation } from '../../src/retry/interfaces/retryable-operation.interface';

// Mock implementations
const mockNotificationRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
};

const mockNotificationsService = {
  sendThroughChannel: jest.fn(),
};

const mockDlqService = {
  addToDlq: jest.fn(),
};

const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockTracingService = {
  getCurrentTraceId: jest.fn().mockReturnValue('mock-trace-id'),
};

describe('RetryService', () => {
  let service: RetryService;
  let notificationRepository: Repository<Notification>;
  let notificationsService: NotificationsService;
  let dlqService: DlqService;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: DlqService,
          useValue: mockDlqService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: TracingService,
          useValue: mockTracingService,
        },
      ],
    }).compile();

    service = module.get<RetryService>(RetryService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    notificationsService = module.get<NotificationsService>(NotificationsService);
    dlqService = module.get<DlqService>(DlqService);

    // Call onModuleInit manually since it's not called in tests
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerPolicy', () => {
    it('should register a policy', () => {
      const mockPolicy = {
        calculateNextRetryTime: jest.fn(),
        shouldRetry: jest.fn(),
        getName: jest.fn().mockReturnValue('test-policy'),
      };

      service.registerPolicy('test-policy', mockPolicy);
      const retrievedPolicy = service.getPolicy('test-policy');

      expect(retrievedPolicy).toBe(mockPolicy);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        'Registered retry policy: test-policy',
        'RetryService'
      );
    });
  });

  describe('getPolicy', () => {
    it('should return the requested policy if it exists', () => {
      const mockPolicy = {
        calculateNextRetryTime: jest.fn(),
        shouldRetry: jest.fn(),
        getName: jest.fn().mockReturnValue('test-policy'),
      };

      service.registerPolicy('test-policy', mockPolicy);
      const retrievedPolicy = service.getPolicy('test-policy');

      expect(retrievedPolicy).toBe(mockPolicy);
    });

    it('should return the default policy if the requested policy does not exist', () => {
      const defaultPolicy = service.getPolicy('exponential-backoff');
      const retrievedPolicy = service.getPolicy('non-existent-policy');

      expect(retrievedPolicy).toBe(defaultPolicy);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        "Retry policy 'non-existent-policy' not found, using default policy",
        'RetryService'
      );
    });
  });

  describe('scheduleRetry', () => {
    let mockOperation: IRetryableOperation;
    let mockError: Error;
    let mockMetadata: { notificationId: number; userId: string; channel: string; attemptCount?: number };

    beforeEach(() => {
      mockOperation = {
        execute: jest.fn(),
        getPayload: jest.fn().mockReturnValue({ test: 'payload' }),
        getMetadata: jest.fn().mockReturnValue({ test: 'metadata' }),
      };

      mockError = new Error('Test error');

      mockMetadata = {
        notificationId: 123,
        userId: 'test-user',
        channel: 'push',
        attemptCount: 0,
      };

      // Mock the policy to allow retry
      const mockPolicy = service.getPolicy('exponential-backoff');
      jest.spyOn(mockPolicy, 'shouldRetry').mockReturnValue(true);
      jest.spyOn(mockPolicy, 'calculateNextRetryTime').mockReturnValue(Date.now() + 1000);

      // Mock setTimeout
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule a retry when the policy allows it', async () => {
      const result = await service.scheduleRetry(mockOperation, mockError, mockMetadata);

      expect(result).toBe(RetryStatus.PENDING);
      expect(mockNotificationRepository.update).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Scheduling retry for notification 123 on channel push (attempt 1)',
        'RetryService',
        expect.objectContaining({
          userId: 'test-user',
          notificationId: 123,
          channel: 'push',
          attemptCount: 0,
          traceId: 'mock-trace-id',
          errorMessage: 'Test error',
        })
      );
    });

    it('should move to DLQ when the policy does not allow retry', async () => {
      const mockPolicy = service.getPolicy('exponential-backoff');
      jest.spyOn(mockPolicy, 'shouldRetry').mockReturnValue(false);

      const result = await service.scheduleRetry(mockOperation, mockError, mockMetadata);

      expect(result).toBe(RetryStatus.EXHAUSTED);
      expect(mockDlqService.addToDlq).toHaveBeenCalled();
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Retry policy exponential-backoff determined no more retries for notification 123',
        'RetryService',
        expect.objectContaining({
          userId: 'test-user',
          notificationId: 123,
          channel: 'push',
          attemptCount: 0,
          traceId: 'mock-trace-id',
          errorMessage: 'Test error',
        })
      );
    });

    it('should handle errors during scheduling', async () => {
      mockNotificationRepository.update.mockRejectedValueOnce(new Error('Database error'));

      const result = await service.scheduleRetry(mockOperation, mockError, mockMetadata);

      expect(result).toBe(RetryStatus.FAILED);
      expect(mockDlqService.addToDlq).toHaveBeenCalled();
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Error scheduling retry for notification 123',
        expect.any(Error),
        'RetryService',
        expect.objectContaining({
          userId: 'test-user',
          notificationId: 123,
          channel: 'push',
          attemptCount: 0,
          traceId: 'mock-trace-id',
        })
      );
    });
  });

  describe('processRetries', () => {
    beforeEach(() => {
      const mockNotifications = [
        {
          id: 1,
          userId: 'user1',
          channel: 'push',
          status: 'retry-scheduled',
          title: 'Test',
          body: 'Test body',
          type: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 'user2',
          channel: 'email',
          status: 'retry-scheduled',
          title: 'Test 2',
          body: 'Test body 2',
          type: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(mockNotifications);
      mockNotificationsService.sendThroughChannel.mockResolvedValue(undefined);
    });

    it('should process scheduled retries', async () => {
      await service.processRetries();

      expect(mockNotificationRepository.find).toHaveBeenCalled();
      expect(mockNotificationsService.sendThroughChannel).toHaveBeenCalledTimes(2);
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Processing scheduled retries',
        'RetryService',
        expect.objectContaining({ traceId: 'mock-trace-id' })
      );
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Completed processing 2 scheduled retries',
        'RetryService',
        expect.objectContaining({ count: 2, traceId: 'mock-trace-id' })
      );
    });

    it('should handle errors during processing', async () => {
      mockNotificationRepository.find.mockRejectedValueOnce(new Error('Database error'));

      await service.processRetries();

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Error processing scheduled retries',
        expect.any(Error),
        'RetryService',
        expect.objectContaining({ traceId: 'mock-trace-id' })
      );
    });
  });
});