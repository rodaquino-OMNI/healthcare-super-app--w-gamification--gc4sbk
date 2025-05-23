import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import {
  DlqService,
  DlqEntry,
  DlqErrorType,
  DlqEntryStatus,
  DlqProcessAction,
  RetryAttempt,
  SendToDlqOptions
} from '../../../src/errors/dlq';
import { JourneyType } from '../../../src/interfaces/journey-events.interface';
import { createEvent } from '../../../src/interfaces/base-event.interface';

/**
 * Test suite for the DLQ (Dead Letter Queue) service
 * 
 * These tests validate that the DLQ service correctly handles failed events by:
 * - Moving events exceeding retry limits to appropriate DLQ topics
 * - Preserving original event payload and metadata
 * - Including detailed failure information
 * - Supporting manual reprocessing capabilities
 * - Correctly handling different failure scenarios
 * - Properly routing events to journey-specific DLQ topics
 */
describe('DlqService', () => {
  let service: DlqService;
  let kafkaService: KafkaService;
  let configService: ConfigService;
  let tracingService: TracingService;
  let loggerService: LoggerService;
  let dlqRepository: Repository<DlqEntry>;

  // Mock span for tracing
  const mockSpan = {
    end: jest.fn(),
  };

  // Sample event for testing
  const sampleEvent = createEvent(
    'TEST_EVENT',
    'test-service',
    { key: 'value' },
    {
      userId: 'user123',
      journey: JourneyType.HEALTH,
      eventId: 'event123',
      timestamp: '2023-01-01T00:00:00.000Z',
      version: '1.0.0',
      metadata: {
        correlationId: 'corr123',
        traceId: 'trace123'
      }
    }
  );

  // Sample Kafka event for testing
  const sampleKafkaEvent = {
    event: sampleEvent,
    topic: 'test-topic',
    partition: 0,
    offset: '100',
    timestamp: '2023-01-01T00:00:00.000Z',
    headers: {
      'X-Correlation-ID': 'corr123'
    }
  };

  // Sample error for testing
  const sampleError = new Error('Test error message');
  sampleError.stack = 'Error: Test error message\n    at TestFunction (test.ts:10:10)';

  // Sample retry attempts for testing
  const sampleRetryAttempts: RetryAttempt[] = [
    {
      timestamp: new Date('2023-01-01T00:00:00.000Z'),
      error: 'Connection error',
      stackTrace: 'Error: Connection error\n    at TestFunction (test.ts:10:10)',
      metadata: { attempt: 1 }
    },
    {
      timestamp: new Date('2023-01-01T00:01:00.000Z'),
      error: 'Timeout error',
      stackTrace: 'Error: Timeout error\n    at TestFunction (test.ts:10:10)',
      metadata: { attempt: 2 }
    }
  ];

  // Sample DLQ entry for testing
  const sampleDlqEntry: DlqEntry = {
    id: 'dlq-123',
    eventId: 'event123',
    userId: 'user123',
    journey: JourneyType.HEALTH,
    eventType: 'TEST_EVENT',
    payload: { key: 'value' },
    errorType: DlqErrorType.PROCESSING,
    errorMessage: 'Test error message',
    errorStack: 'Error: Test error message\n    at TestFunction (test.ts:10:10)',
    retryAttempts: sampleRetryAttempts,
    status: DlqEntryStatus.PENDING,
    originalTopic: 'test-topic',
    kafkaMetadata: {
      topic: 'test-topic',
      partition: 0,
      offset: '100',
      timestamp: '2023-01-01T00:00:00.000Z',
      headers: {
        'X-Correlation-ID': 'corr123'
      }
    },
    processingMetadata: { service: 'test-service' },
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z')
  };

  beforeEach(async () => {
    // Create testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DlqService,
        {
          provide: KafkaService,
          useValue: {
            produce: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key, defaultValue) => {
              if (key === 'kafka.dlqTopicPrefix') return 'dlq.';
              return defaultValue;
            }),
          },
        },
        {
          provide: TracingService,
          useValue: {
            startSpan: jest.fn().mockReturnValue(mockSpan),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DlqEntry),
          useValue: {
            save: jest.fn().mockResolvedValue(sampleDlqEntry),
            findOne: jest.fn().mockResolvedValue(sampleDlqEntry),
            createQueryBuilder: jest.fn().mockReturnValue({
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[sampleDlqEntry], 1]),
            }),
            count: jest.fn().mockResolvedValue(10),
            find: jest.fn().mockResolvedValue([sampleDlqEntry]),
            delete: jest.fn().mockResolvedValue({ affected: 5 }),
          },
        },
      ],
    }).compile();

    // Get service instances
    service = module.get<DlqService>(DlqService);
    kafkaService = module.get<KafkaService>(KafkaService);
    configService = module.get<ConfigService>(ConfigService);
    tracingService = module.get<TracingService>(TracingService);
    loggerService = module.get<LoggerService>(LoggerService);
    dlqRepository = module.get<Repository<DlqEntry>>(getRepositoryToken(DlqEntry));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendToDlq', () => {
    it('should create a DLQ entry and send it to Kafka', async () => {
      // Prepare test data
      const options: SendToDlqOptions = {
        errorType: DlqErrorType.PROCESSING,
        errorMessage: 'Test error message',
        errorStack: 'Error: Test error message\n    at TestFunction (test.ts:10:10)',
        retryAttempts: sampleRetryAttempts,
        originalTopic: 'test-topic',
        kafkaMetadata: {
          topic: 'test-topic',
          partition: 0,
          offset: '100',
          timestamp: '2023-01-01T00:00:00.000Z',
          headers: {
            'X-Correlation-ID': 'corr123'
          }
        },
        processingMetadata: { service: 'test-service' }
      };

      // Call the method
      const result = await service.sendToDlq(sampleEvent, options);

      // Verify results
      expect(result).toEqual(sampleDlqEntry);
      expect(dlqRepository.save).toHaveBeenCalled();
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'dlq.health',
        expect.any(String),
        expect.objectContaining({
          eventId: sampleEvent.eventId,
          userId: sampleEvent.userId,
          journey: sampleEvent.journey,
          eventType: sampleEvent.type,
          payload: sampleEvent.payload,
          errorType: options.errorType,
          errorMessage: options.errorMessage,
          errorStack: options.errorStack,
          retryAttempts: options.retryAttempts,
          originalTopic: options.originalTopic,
          kafkaMetadata: options.kafkaMetadata,
          processingMetadata: options.processingMetadata
        })
      );
      expect(tracingService.startSpan).toHaveBeenCalledWith('DlqService.sendToDlq');
      expect(mockSpan.end).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should handle errors during DLQ entry creation', async () => {
      // Mock repository to throw an error
      jest.spyOn(dlqRepository, 'save').mockRejectedValueOnce(new Error('Database error'));

      // Prepare test data
      const options: SendToDlqOptions = {
        errorType: DlqErrorType.PROCESSING,
        errorMessage: 'Test error message',
        originalTopic: 'test-topic'
      };

      // Call the method and expect it to throw
      await expect(service.sendToDlq(sampleEvent, options)).rejects.toThrow('Database error');

      // Verify error was logged
      expect(loggerService.error).toHaveBeenCalled();
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should use default DLQ topic when journey is not specified', async () => {
      // Create event without journey
      const eventWithoutJourney = createEvent(
        'TEST_EVENT',
        'test-service',
        { key: 'value' },
        {
          userId: 'user123',
          eventId: 'event123',
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0.0'
        }
      );

      // Prepare test data
      const options: SendToDlqOptions = {
        errorType: DlqErrorType.PROCESSING,
        errorMessage: 'Test error message',
        originalTopic: 'test-topic'
      };

      // Call the method
      await service.sendToDlq(eventWithoutJourney, options);

      // Verify correct topic was used
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'dlq.events',
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('sendKafkaEventToDlq', () => {
    it('should send a Kafka event to the DLQ with error details', async () => {
      // Call the method
      const result = await service.sendKafkaEventToDlq(sampleKafkaEvent, sampleError, sampleRetryAttempts);

      // Verify results
      expect(result).toEqual(sampleDlqEntry);
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'dlq.health',
        expect.any(String),
        expect.objectContaining({
          eventId: sampleEvent.eventId,
          errorMessage: sampleError.message,
          errorStack: sampleError.stack,
          retryAttempts: sampleRetryAttempts,
          originalTopic: sampleKafkaEvent.topic,
          kafkaMetadata: expect.objectContaining({
            topic: sampleKafkaEvent.topic,
            partition: sampleKafkaEvent.partition,
            offset: sampleKafkaEvent.offset,
            timestamp: sampleKafkaEvent.timestamp,
            headers: sampleKafkaEvent.headers
          })
        })
      );
    });

    it('should classify errors correctly', async () => {
      // Create different types of errors
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';

      const schemaError = new Error('Invalid schema');
      schemaError.name = 'SchemaError';

      const timeoutError = new Error('Request timed out');
      timeoutError.name = 'TimeoutError';

      const networkError = new Error('Network connection failed');
      networkError.name = 'NetworkError';

      const databaseError = new Error('Database query failed');
      databaseError.name = 'DatabaseError';

      // Test each error type
      await service.sendKafkaEventToDlq(sampleKafkaEvent, validationError, []);
      expect(dlqRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: DlqErrorType.VALIDATION })
      );

      await service.sendKafkaEventToDlq(sampleKafkaEvent, schemaError, []);
      expect(dlqRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: DlqErrorType.SCHEMA })
      );

      await service.sendKafkaEventToDlq(sampleKafkaEvent, timeoutError, []);
      expect(dlqRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: DlqErrorType.TIMEOUT })
      );

      await service.sendKafkaEventToDlq(sampleKafkaEvent, networkError, []);
      expect(dlqRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: DlqErrorType.NETWORK })
      );

      await service.sendKafkaEventToDlq(sampleKafkaEvent, databaseError, []);
      expect(dlqRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: DlqErrorType.DATABASE })
      );
    });
  });

  describe('queryDlqEntries', () => {
    it('should query DLQ entries with filters', async () => {
      // Create query builder spy
      const queryBuilderSpy = jest.spyOn(dlqRepository, 'createQueryBuilder');

      // Call the method with various filters
      const result = await service.queryDlqEntries({
        eventId: 'event123',
        userId: 'user123',
        journey: JourneyType.HEALTH,
        eventType: 'TEST_EVENT',
        errorType: DlqErrorType.PROCESSING,
        status: DlqEntryStatus.PENDING,
        createdAfter: new Date('2023-01-01'),
        createdBefore: new Date('2023-01-02'),
        page: 2,
        limit: 10
      });

      // Verify results
      expect(result).toEqual([[sampleDlqEntry], 1]);
      expect(queryBuilderSpy).toHaveBeenCalledWith('dlq');
      expect(queryBuilderSpy().andWhere).toHaveBeenCalledTimes(8); // Once for each filter
      expect(queryBuilderSpy().orderBy).toHaveBeenCalledWith('dlq.createdAt', 'DESC');
      expect(queryBuilderSpy().skip).toHaveBeenCalledWith(10); // (page-1) * limit
      expect(queryBuilderSpy().take).toHaveBeenCalledWith(10);
    });

    it('should use default pagination values when not provided', async () => {
      // Create query builder spy
      const queryBuilderSpy = jest.spyOn(dlqRepository, 'createQueryBuilder');

      // Call the method without pagination params
      await service.queryDlqEntries({});

      // Verify default pagination was used
      expect(queryBuilderSpy().skip).toHaveBeenCalledWith(0); // (1-1) * 20
      expect(queryBuilderSpy().take).toHaveBeenCalledWith(20);
    });
  });

  describe('getDlqEntryById', () => {
    it('should retrieve a DLQ entry by ID', async () => {
      // Call the method
      const result = await service.getDlqEntryById('dlq-123');

      // Verify results
      expect(result).toEqual(sampleDlqEntry);
      expect(dlqRepository.findOne).toHaveBeenCalledWith({ where: { id: 'dlq-123' } });
    });

    it('should return null when entry is not found', async () => {
      // Mock repository to return null
      jest.spyOn(dlqRepository, 'findOne').mockResolvedValueOnce(null);

      // Call the method
      const result = await service.getDlqEntryById('non-existent');

      // Verify results
      expect(result).toBeNull();
    });
  });

  describe('processDlqEntry', () => {
    it('should resolve a DLQ entry', async () => {
      // Call the method
      const result = await service.processDlqEntry(
        'dlq-123',
        DlqProcessAction.RESOLVE,
        'Issue resolved manually'
      );

      // Verify results
      expect(result.status).toBe(DlqEntryStatus.RESOLVED);
      expect(result.resolvedAt).toBeDefined();
      expect(result.comments).toBe('Issue resolved manually');
      expect(dlqRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'dlq-123',
        status: DlqEntryStatus.RESOLVED,
        comments: 'Issue resolved manually'
      }));
      expect(tracingService.startSpan).toHaveBeenCalledWith('DlqService.processDlqEntry');
      expect(mockSpan.end).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should reprocess a DLQ entry', async () => {
      // Call the method
      const result = await service.processDlqEntry(
        'dlq-123',
        DlqProcessAction.REPROCESS,
        'Reprocessing after fix'
      );

      // Verify results
      expect(result.status).toBe(DlqEntryStatus.REPROCESSED);
      expect(result.resolvedAt).toBeDefined();
      expect(result.comments).toBe('Reprocessing after fix');
      expect(kafkaService.produce).toHaveBeenCalledWith(
        sampleDlqEntry.originalTopic,
        sampleDlqEntry.eventId,
        expect.objectContaining({
          eventId: sampleDlqEntry.eventId,
          userId: sampleDlqEntry.userId,
          journey: sampleDlqEntry.journey,
          type: sampleDlqEntry.eventType,
          data: sampleDlqEntry.payload,
          source: 'dlq-reprocessing'
        })
      );
      expect(dlqRepository.save).toHaveBeenCalled();
    });

    it('should reprocess a DLQ entry with modified payload', async () => {
      // Modified payload for testing
      const modifiedPayload = { key: 'modified_value' };

      // Call the method
      const result = await service.processDlqEntry(
        'dlq-123',
        DlqProcessAction.REPROCESS,
        'Reprocessing with modified payload',
        modifiedPayload
      );

      // Verify results
      expect(result.status).toBe(DlqEntryStatus.REPROCESSED);
      expect(kafkaService.produce).toHaveBeenCalledWith(
        sampleDlqEntry.originalTopic,
        sampleDlqEntry.eventId,
        expect.objectContaining({
          data: modifiedPayload
        })
      );
      expect(result.processingMetadata).toEqual(expect.objectContaining({
        reprocessedWith: 'modified_payload'
      }));
    });

    it('should ignore a DLQ entry', async () => {
      // Call the method
      const result = await service.processDlqEntry(
        'dlq-123',
        DlqProcessAction.IGNORE,
        'Ignoring this error'
      );

      // Verify results
      expect(result.status).toBe(DlqEntryStatus.IGNORED);
      expect(result.resolvedAt).toBeDefined();
      expect(result.comments).toBe('Ignoring this error');
      expect(dlqRepository.save).toHaveBeenCalled();
    });

    it('should throw an error when entry is not found', async () => {
      // Mock repository to return null
      jest.spyOn(dlqRepository, 'findOne').mockResolvedValueOnce(null);

      // Call the method and expect it to throw
      await expect(service.processDlqEntry(
        'non-existent',
        DlqProcessAction.RESOLVE
      )).rejects.toThrow('DLQ entry not found: non-existent');

      // Verify error was logged
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should throw an error when entry is already processed', async () => {
      // Create a processed entry
      const processedEntry = { ...sampleDlqEntry, status: DlqEntryStatus.RESOLVED };
      jest.spyOn(dlqRepository, 'findOne').mockResolvedValueOnce(processedEntry);

      // Call the method and expect it to throw
      await expect(service.processDlqEntry(
        'dlq-123',
        DlqProcessAction.RESOLVE
      )).rejects.toThrow('DLQ entry already processed: dlq-123, status: RESOLVED');

      // Verify error was logged
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should throw an error for invalid action', async () => {
      // Call the method with invalid action and expect it to throw
      await expect(service.processDlqEntry(
        'dlq-123',
        'invalid_action' as DlqProcessAction
      )).rejects.toThrow('Invalid DLQ process action: invalid_action');

      // Verify error was logged
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('getDlqStatistics', () => {
    it('should retrieve DLQ statistics', async () => {
      // Mock repository methods
      jest.spyOn(dlqRepository, 'count').mockImplementation((options?: any) => {
        // Return different counts based on the filter
        if (!options) return Promise.resolve(100); // Total count
        if (options.where?.errorType === DlqErrorType.VALIDATION) return Promise.resolve(20);
        if (options.where?.errorType === DlqErrorType.PROCESSING) return Promise.resolve(30);
        if (options.where?.journey === JourneyType.HEALTH) return Promise.resolve(40);
        if (options.where?.status === DlqEntryStatus.PENDING) return Promise.resolve(50);
        if (options.where?.createdAt?.$gte) return Promise.resolve(10); // Time range
        return Promise.resolve(5); // Default
      });

      // Mock resolved entries for average time calculation
      const resolvedEntry1 = {
        ...sampleDlqEntry,
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        resolvedAt: new Date('2023-01-01T01:00:00.000Z') // 1 hour
      };
      const resolvedEntry2 = {
        ...sampleDlqEntry,
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        resolvedAt: new Date('2023-01-01T03:00:00.000Z') // 3 hours
      };
      jest.spyOn(dlqRepository, 'find').mockResolvedValueOnce([resolvedEntry1, resolvedEntry2]);

      // Call the method
      const result = await service.getDlqStatistics();

      // Verify results
      expect(result.totalEntries).toBe(100);
      expect(result.byErrorType).toBeDefined();
      expect(result.byJourney).toBeDefined();
      expect(result.byStatus).toBeDefined();
      expect(result.byTimeRange).toBeDefined();
      
      // Average time calculation: (1 hour + 3 hours) / 2 = 2 hours = 7,200,000 ms
      expect(result.averageTimeInQueue).toBe(7200000);
    });

    it('should handle empty resolved entries for average time calculation', async () => {
      // Mock empty resolved entries
      jest.spyOn(dlqRepository, 'find').mockResolvedValueOnce([]);

      // Call the method
      const result = await service.getDlqStatistics();

      // Verify average time is 0 when no resolved entries
      expect(result.averageTimeInQueue).toBe(0);
    });
  });

  describe('purgeResolvedEntries', () => {
    it('should purge old resolved entries', async () => {
      // Call the method
      const result = await service.purgeResolvedEntries(new Date('2023-01-01'));

      // Verify results
      expect(result).toBe(5); // Affected count from mock
      expect(dlqRepository.delete).toHaveBeenCalledWith({
        status: { $in: [DlqEntryStatus.RESOLVED, DlqEntryStatus.REPROCESSED, DlqEntryStatus.IGNORED] },
        resolvedAt: { $lt: expect.any(Date) }
      });
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should return 0 when no entries are purged', async () => {
      // Mock repository to return 0 affected
      jest.spyOn(dlqRepository, 'delete').mockResolvedValueOnce({ affected: 0 });

      // Call the method
      const result = await service.purgeResolvedEntries(new Date('2023-01-01'));

      // Verify results
      expect(result).toBe(0);
    });
  });
});