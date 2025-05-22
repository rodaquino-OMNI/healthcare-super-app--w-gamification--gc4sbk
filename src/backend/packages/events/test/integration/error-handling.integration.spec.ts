import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';
import { DlqService, DlqErrorType, DlqEntryStatus, DlqProcessAction } from '../../src/errors/dlq';
import { BaseEvent } from '../../src/interfaces/base-event.interface';
import { KafkaEvent } from '../../src/interfaces/kafka-event.interface';
import {
  RetryStrategy,
  JourneyType,
  RetryPolicyConfig,
  RetryContext,
  RetryResult,
  createRetryContext,
  getRetryPolicy,
  calculateRetryDelay,
  isRetryableError,
  isCircuitBreakerOpen,
  recordCircuitBreakerFailure,
  recordCircuitBreakerSuccess,
  sendToDeadLetterQueue,
  executeWithRetry,
  retryEventProcessing,
  withRetry
} from '../../src/utils/retry-utils';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import { getRepositoryToken } from '@nestjs/typeorm';

// Mock implementations
class MockKafkaService {
  async produce(topic: string, key: string, value: any): Promise<void> {
    return Promise.resolve();
  }
}

class MockKafkaProducer {
  async produce(options: any): Promise<void> {
    return Promise.resolve();
  }
}

class MockTracingService {
  startSpan(name: string) {
    return {
      setStatus: jest.fn(),
      end: jest.fn(),
    };
  }
}

class MockLoggerService {
  log(message: string, context?: any, source?: string): void {}
  error(message: string, trace?: string, context?: any, source?: string): void {}
  warn(message: string, context?: any, source?: string): void {}
}

class MockRepository {
  items: any[] = [];
  
  async save(item: any): Promise<any> {
    if (!item.id) {
      item.id = uuidv4();
    }
    const existingIndex = this.items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      this.items[existingIndex] = item;
    } else {
      this.items.push(item);
    }
    return item;
  }
  
  async findOne(options: any): Promise<any> {
    const { where } = options;
    return this.items.find(item => item.id === where.id);
  }
  
  async count(options?: any): Promise<number> {
    if (!options) return this.items.length;
    
    const { where } = options;
    if (!where) return this.items.length;
    
    return this.items.filter(item => {
      for (const [key, value] of Object.entries(where)) {
        if (item[key] !== value) return false;
      }
      return true;
    }).length;
  }
  
  async find(options?: any): Promise<any[]> {
    if (!options) return this.items;
    
    const { where } = options;
    if (!where) return this.items;
    
    return this.items.filter(item => {
      for (const [key, value] of Object.entries(where)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }
  
  async delete(options: any): Promise<{ affected: number }> {
    const { where } = options;
    const initialCount = this.items.length;
    this.items = this.items.filter(item => {
      for (const [key, value] of Object.entries(where)) {
        if (item[key] !== value) return true;
      }
      return false;
    });
    return { affected: initialCount - this.items.length };
  }
  
  createQueryBuilder() {
    return {
      andWhere: () => this,
      orderBy: () => this,
      skip: () => this,
      take: () => this,
      getManyAndCount: () => [this.items, this.items.length]
    };
  }
}

// Test event factory
function createTestEvent(journeyType: JourneyType = JourneyType.HEALTH): BaseEvent {
  return {
    eventId: uuidv4(),
    userId: `user-${uuidv4().substring(0, 8)}`,
    journey: journeyType,
    type: `${journeyType.toLowerCase()}.test.event`,
    data: { test: 'data', timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test'
  };
}

function createKafkaEvent(baseEvent: BaseEvent): KafkaEvent {
  return {
    event: baseEvent,
    topic: `${baseEvent.journey.toLowerCase()}-events`,
    partition: 0,
    offset: '0',
    timestamp: new Date().toISOString(),
    headers: {
      'correlation-id': uuidv4(),
      'event-type': baseEvent.type
    }
  };
}

// Custom errors for testing
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

describe('Error Handling Integration Tests', () => {
  let module: TestingModule;
  let dlqService: DlqService;
  let kafkaService: KafkaService;
  let kafkaProducer: KafkaProducer;
  let loggerService: LoggerService;
  let mockRepository: MockRepository;
  let logger: Logger;

  beforeEach(async () => {
    jest.useFakeTimers();
    mockRepository = new MockRepository();
    
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            kafka: {
              dlqTopicPrefix: 'dlq.',
              brokers: ['localhost:9092'],
              clientId: 'test-client'
            }
          })]
        })
      ],
      providers: [
        {
          provide: KafkaService,
          useClass: MockKafkaService
        },
        {
          provide: KafkaProducer,
          useClass: MockKafkaProducer
        },
        {
          provide: TracingService,
          useClass: MockTracingService
        },
        {
          provide: LoggerService,
          useClass: MockLoggerService
        },
        {
          provide: getRepositoryToken(DlqService),
          useValue: mockRepository
        },
        ConfigService,
        DlqService
      ]
    }).compile();

    dlqService = module.get<DlqService>(DlqService);
    kafkaService = module.get<KafkaService>(KafkaService);
    kafkaProducer = module.get<KafkaProducer>(KafkaProducer);
    loggerService = module.get<LoggerService>(LoggerService);
    logger = new Logger('TestLogger');
    
    // Spy on methods
    jest.spyOn(kafkaService, 'produce').mockResolvedValue();
    jest.spyOn(kafkaProducer, 'produce').mockResolvedValue();
    jest.spyOn(logger, 'log').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    await module.close();
  });

  describe('Dead Letter Queue (DLQ) Tests', () => {
    it('should send a failed event to the DLQ', async () => {
      // Arrange
      const testEvent = createTestEvent(JourneyType.HEALTH);
      const kafkaEvent = createKafkaEvent(testEvent);
      const error = new ValidationError('Invalid event data');
      
      // Act
      const result = await dlqService.sendKafkaEventToDlq(kafkaEvent, error, [
        {
          timestamp: new Date(),
          error: 'First attempt failed',
          stackTrace: 'Error stack trace'
        }
      ]);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.eventId).toBe(testEvent.eventId);
      expect(result.errorType).toBe(DlqErrorType.VALIDATION);
      expect(result.status).toBe(DlqEntryStatus.PENDING);
      expect(kafkaService.produce).toHaveBeenCalled();
    });

    it('should retrieve DLQ entries by query parameters', async () => {
      // Arrange
      const testEvent1 = createTestEvent(JourneyType.HEALTH);
      const testEvent2 = createTestEvent(JourneyType.CARE);
      const kafkaEvent1 = createKafkaEvent(testEvent1);
      const kafkaEvent2 = createKafkaEvent(testEvent2);
      
      await dlqService.sendKafkaEventToDlq(kafkaEvent1, new ValidationError('Invalid health data'));
      await dlqService.sendKafkaEventToDlq(kafkaEvent2, new DatabaseError('Database connection failed'));
      
      // Act
      const [healthEntries, healthCount] = await dlqService.queryDlqEntries({
        journey: JourneyType.HEALTH
      });
      
      // Assert
      expect(healthCount).toBe(1);
      expect(healthEntries[0].journey).toBe(JourneyType.HEALTH);
    });

    it('should process a DLQ entry for reprocessing', async () => {
      // Arrange
      const testEvent = createTestEvent(JourneyType.PLAN);
      const kafkaEvent = createKafkaEvent(testEvent);
      const error = new NetworkError('Connection timeout');
      
      const dlqEntry = await dlqService.sendKafkaEventToDlq(kafkaEvent, error);
      
      // Act
      const processedEntry = await dlqService.processDlqEntry(
        dlqEntry.id,
        DlqProcessAction.REPROCESS,
        'Fixed network issue, reprocessing'
      );
      
      // Assert
      expect(processedEntry.status).toBe(DlqEntryStatus.REPROCESSED);
      expect(processedEntry.resolvedAt).toBeDefined();
      expect(processedEntry.comments).toBe('Fixed network issue, reprocessing');
      expect(kafkaService.produce).toHaveBeenCalledTimes(2); // Once for DLQ, once for reprocessing
    });

    it('should get DLQ statistics', async () => {
      // Arrange
      const testEvent1 = createTestEvent(JourneyType.HEALTH);
      const testEvent2 = createTestEvent(JourneyType.CARE);
      const testEvent3 = createTestEvent(JourneyType.PLAN);
      
      const kafkaEvent1 = createKafkaEvent(testEvent1);
      const kafkaEvent2 = createKafkaEvent(testEvent2);
      const kafkaEvent3 = createKafkaEvent(testEvent3);
      
      await dlqService.sendKafkaEventToDlq(kafkaEvent1, new ValidationError('Invalid health data'));
      await dlqService.sendKafkaEventToDlq(kafkaEvent2, new DatabaseError('Database connection failed'));
      await dlqService.sendKafkaEventToDlq(kafkaEvent3, new NetworkError('API timeout'));
      
      // Act
      const stats = await dlqService.getDlqStatistics();
      
      // Assert
      expect(stats.totalEntries).toBe(3);
      expect(stats.byJourney[JourneyType.HEALTH]).toBe(1);
      expect(stats.byJourney[JourneyType.CARE]).toBe(1);
      expect(stats.byJourney[JourneyType.PLAN]).toBe(1);
      expect(stats.byErrorType[DlqErrorType.VALIDATION]).toBe(1);
      expect(stats.byErrorType[DlqErrorType.DATABASE]).toBe(1);
      expect(stats.byErrorType[DlqErrorType.NETWORK]).toBe(1);
    });
  });

  describe('Retry Mechanism Tests', () => {
    it('should retry an operation with exponential backoff', async () => {
      // Arrange
      let attempts = 0;
      const maxAttempts = 3;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < maxAttempts) {
          throw new NetworkError('Connection failed');
        }
        return 'Success';
      });
      
      const policy: RetryPolicyConfig = {
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        backoffFactor: 2,
        jitterMs: 0 // Disable jitter for predictable testing
      };
      
      const retryContext = createRetryContext(policy, JourneyType.HEALTH);
      
      // Act
      const result = await executeWithRetry(
        operation,
        retryContext,
        logger
      );
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(maxAttempts);
      expect(result.retryContext.attempt).toBe(maxAttempts);
      
      // Verify exponential backoff delays
      expect(setTimeout).toHaveBeenCalledTimes(maxAttempts - 1);
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 100); // Initial delay
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 200); // 100 * 2^1
    });

    it('should stop retrying after max retries and send to DLQ', async () => {
      // Arrange
      const operation = jest.fn().mockRejectedValue(new DatabaseError('Database connection failed'));
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 50,
        maxDelayMs: 500,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        deadLetterQueueTopic: 'test-dlq'
      };
      
      const retryContext = createRetryContext(policy, JourneyType.CARE);
      const sendToDlqSpy = jest.spyOn(dlqService, 'sendKafkaEventToDlq').mockResolvedValue({} as any);
      
      // Act
      const result = await executeWithRetry(
        operation,
        retryContext,
        logger,
        kafkaProducer
      );
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(DatabaseError);
      expect(operation).toHaveBeenCalledTimes(policy.maxRetries + 1); // Initial + retries
      expect(result.retryContext.attempt).toBe(policy.maxRetries + 1);
      expect(kafkaProducer.produce).toHaveBeenCalled();
    });

    it('should not retry non-retryable errors', async () => {
      // Arrange
      const operation = jest.fn().mockRejectedValue(new ValidationError('Invalid input'));
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 50,
        maxDelayMs: 500,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        nonRetryableErrors: ['ValidationError']
      };
      
      const retryContext = createRetryContext(policy, JourneyType.PLAN);
      
      // Act
      const result = await executeWithRetry(
        operation,
        retryContext,
        logger
      );
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(operation).toHaveBeenCalledTimes(1); // No retries
      expect(result.retryContext.attempt).toBe(1);
    });

    it('should retry only specified retryable errors', async () => {
      // Arrange
      let callCount = 0;
      const operation = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) throw new NetworkError('Network error');
        if (callCount === 2) throw new ValidationError('Validation error');
        return 'Success';
      });
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 50,
        maxDelayMs: 500,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        retryableErrors: ['NetworkError']
      };
      
      const retryContext = createRetryContext(policy, JourneyType.HEALTH);
      
      // Act
      const result = await executeWithRetry(
        operation,
        retryContext,
        logger
      );
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(operation).toHaveBeenCalledTimes(2); // Only retried the NetworkError
      expect(result.retryContext.attempt).toBe(2);
    });

    it('should use journey-specific retry policies', async () => {
      // Arrange
      const healthPolicy = getRetryPolicy(JourneyType.HEALTH);
      const carePolicy = getRetryPolicy(JourneyType.CARE);
      const planPolicy = getRetryPolicy(JourneyType.PLAN);
      
      // Act & Assert
      expect(healthPolicy.maxRetries).toBe(5);
      expect(carePolicy.maxRetries).toBe(3);
      expect(planPolicy.maxRetries).toBe(7);
      
      expect(healthPolicy.deadLetterQueueTopic).toBe('health-events-dlq');
      expect(carePolicy.deadLetterQueueTopic).toBe('care-events-dlq');
      expect(planPolicy.deadLetterQueueTopic).toBe('plan-events-dlq');
    });

    it('should wrap a function with retry capabilities', async () => {
      // Arrange
      let attempts = 0;
      const testFn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new NetworkError('Connection failed');
        }
        return 'Success';
      });
      
      const retryableFunction = withRetry(JourneyType.HEALTH)(testFn);
      
      // Act
      const result = await retryableFunction();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.result).toBe('Success');
      expect(testFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Circuit Breaker Tests', () => {
    it('should open circuit breaker after threshold failures', () => {
      // Arrange
      const serviceName = 'test-service';
      const options = {
        failureThreshold: 3,
        resetTimeout: 30000,
        rollingCountWindow: 60000
      };
      
      // Act & Assert
      expect(isCircuitBreakerOpen(serviceName)).toBe(false);
      
      recordCircuitBreakerFailure(serviceName, options);
      expect(isCircuitBreakerOpen(serviceName)).toBe(false);
      
      recordCircuitBreakerFailure(serviceName, options);
      expect(isCircuitBreakerOpen(serviceName)).toBe(false);
      
      recordCircuitBreakerFailure(serviceName, options);
      expect(isCircuitBreakerOpen(serviceName)).toBe(true);
    });

    it('should close circuit breaker after reset timeout', () => {
      // Arrange
      const serviceName = 'test-service';
      const options = {
        failureThreshold: 3,
        resetTimeout: 1000, // 1 second for testing
        rollingCountWindow: 60000
      };
      
      // Act
      recordCircuitBreakerFailure(serviceName, options);
      recordCircuitBreakerFailure(serviceName, options);
      recordCircuitBreakerFailure(serviceName, options);
      expect(isCircuitBreakerOpen(serviceName)).toBe(true);
      
      // Fast-forward time
      jest.advanceTimersByTime(1500); // 1.5 seconds
      
      // Assert
      expect(isCircuitBreakerOpen(serviceName)).toBe(false);
    });

    it('should reset circuit breaker on success', () => {
      // Arrange
      const serviceName = 'test-service';
      const options = {
        failureThreshold: 3,
        resetTimeout: 30000,
        rollingCountWindow: 60000
      };
      
      // Act
      recordCircuitBreakerFailure(serviceName, options);
      recordCircuitBreakerFailure(serviceName, options);
      recordCircuitBreakerFailure(serviceName, options);
      expect(isCircuitBreakerOpen(serviceName)).toBe(true);
      
      recordCircuitBreakerSuccess(serviceName);
      
      // Assert
      expect(isCircuitBreakerOpen(serviceName)).toBe(false);
    });

    it('should skip operation when circuit breaker is open', async () => {
      // Arrange
      const serviceName = 'test-service';
      const options = {
        failureThreshold: 3,
        resetTimeout: 30000,
        rollingCountWindow: 60000
      };
      
      const operation = jest.fn().mockResolvedValue('Success');
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 50,
        maxDelayMs: 500,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        enableCircuitBreaker: true,
        circuitBreakerOptions: options
      };
      
      const retryContext = createRetryContext(policy, JourneyType.HEALTH);
      retryContext.journeyType = JourneyType.HEALTH;
      
      // Open the circuit breaker
      recordCircuitBreakerFailure(JourneyType.HEALTH, options);
      recordCircuitBreakerFailure(JourneyType.HEALTH, options);
      recordCircuitBreakerFailure(JourneyType.HEALTH, options);
      
      // Act
      const result = await executeWithRetry(
        operation,
        retryContext,
        logger
      );
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Circuit breaker open');
      expect(operation).not.toHaveBeenCalled(); // Operation was skipped
      expect(result.retryContext.circuitBreakerOpen).toBe(true);
    });
  });

  describe('Error Logging and Monitoring Tests', () => {
    it('should log retry attempts', async () => {
      // Arrange
      const operation = jest.fn()
        .mockRejectedValueOnce(new NetworkError('First failure'))
        .mockRejectedValueOnce(new NetworkError('Second failure'))
        .mockResolvedValue('Success');
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 50,
        maxDelayMs: 500,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF
      };
      
      const retryContext = createRetryContext(policy, JourneyType.HEALTH);
      
      // Act
      await executeWithRetry(
        operation,
        retryContext,
        logger
      );
      
      // Assert
      expect(logger.log).toHaveBeenCalledTimes(2); // Two retry logs
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Retrying operation'),
        expect.objectContaining({
          error: 'First failure',
          journeyType: JourneyType.HEALTH
        })
      );
    });

    it('should log when max retries are exceeded', async () => {
      // Arrange
      const operation = jest.fn().mockRejectedValue(new DatabaseError('Database connection failed'));
      
      const policy: RetryPolicyConfig = {
        maxRetries: 2,
        initialDelayMs: 50,
        maxDelayMs: 500,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF
      };
      
      const retryContext = createRetryContext(policy, JourneyType.CARE);
      
      // Act
      await executeWithRetry(
        operation,
        retryContext,
        logger
      );
      
      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Max retries (2) exceeded'),
        expect.objectContaining({
          attempts: 3, // Initial + 2 retries
          journeyType: JourneyType.CARE
        })
      );
    });

    it('should log when circuit breaker opens', async () => {
      // Arrange
      const operation = jest.fn().mockRejectedValue(new NetworkError('Connection failed'));
      
      const policy: RetryPolicyConfig = {
        maxRetries: 2,
        initialDelayMs: 50,
        maxDelayMs: 500,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        enableCircuitBreaker: true,
        circuitBreakerOptions: {
          failureThreshold: 1, // Open after just one failure for testing
          resetTimeout: 30000,
          rollingCountWindow: 60000
        }
      };
      
      const retryContext = createRetryContext(policy, JourneyType.PLAN);
      retryContext.journeyType = JourneyType.PLAN;
      
      // Act
      await executeWithRetry(
        operation,
        retryContext,
        logger
      );
      
      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker opened for'),
        expect.any(Object)
      );
    });

    it('should log when sending to DLQ', async () => {
      // Arrange
      const testEvent = createTestEvent(JourneyType.HEALTH);
      const error = new ValidationError('Invalid event data');
      const retryContext = createRetryContext(
        getRetryPolicy(JourneyType.HEALTH),
        JourneyType.HEALTH
      );
      retryContext.attempt = 3; // After some retries
      
      // Act
      await sendToDeadLetterQueue(
        testEvent,
        error,
        retryContext,
        kafkaProducer,
        logger
      );
      
      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Event sent to DLQ'),
        expect.objectContaining({
          eventId: testEvent.eventId,
          journeyType: JourneyType.HEALTH
        })
      );
      expect(kafkaProducer.produce).toHaveBeenCalledWith(expect.objectContaining({
        topic: 'health-events-dlq',
        messages: expect.arrayContaining([
          expect.objectContaining({
            key: testEvent.eventId,
            headers: expect.objectContaining({
              'x-retry-count': '3',
              'x-original-event-type': testEvent.type,
              'x-failure-reason': error.message,
              'x-journey-type': JourneyType.HEALTH
            })
          })
        ])
      }));
    });
  });

  describe('End-to-End Event Processing Tests', () => {
    it('should process an event with retries and eventually succeed', async () => {
      // Arrange
      const testEvent = createTestEvent(JourneyType.HEALTH);
      let attempts = 0;
      
      const eventProcessor = jest.fn().mockImplementation(async (event: BaseEvent) => {
        attempts++;
        if (attempts < 3) {
          throw new NetworkError(`Processing attempt ${attempts} failed`);
        }
        return { processed: true, eventId: event.eventId };
      });
      
      // Act
      const result = await retryEventProcessing(
        testEvent,
        eventProcessor,
        JourneyType.HEALTH,
        undefined,
        logger,
        kafkaProducer
      );
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        processed: true,
        eventId: testEvent.eventId
      });
      expect(eventProcessor).toHaveBeenCalledTimes(3);
      expect(eventProcessor).toHaveBeenCalledWith(testEvent);
    });

    it('should process an event, fail all retries, and send to DLQ', async () => {
      // Arrange
      const testEvent = createTestEvent(JourneyType.CARE);
      const eventProcessor = jest.fn().mockRejectedValue(
        new DatabaseError('Database connection failed')
      );
      
      // Override the retry policy for faster testing
      const customPolicy = {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 50
      };
      
      // Act
      const result = await retryEventProcessing(
        testEvent,
        eventProcessor,
        JourneyType.CARE,
        customPolicy,
        logger,
        kafkaProducer
      );
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(DatabaseError);
      expect(eventProcessor).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(kafkaProducer.produce).toHaveBeenCalled(); // Sent to DLQ
    });

    it('should handle non-retryable errors immediately', async () => {
      // Arrange
      const testEvent = createTestEvent(JourneyType.PLAN);
      const eventProcessor = jest.fn().mockRejectedValue(
        new ValidationError('Invalid event format')
      );
      
      const customPolicy = {
        maxRetries: 3,
        initialDelayMs: 50,
        maxDelayMs: 500,
        nonRetryableErrors: ['ValidationError']
      };
      
      // Act
      const result = await retryEventProcessing(
        testEvent,
        eventProcessor,
        JourneyType.PLAN,
        customPolicy,
        logger,
        kafkaProducer
      );
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(eventProcessor).toHaveBeenCalledTimes(1); // No retries
      expect(kafkaProducer.produce).toHaveBeenCalled(); // Sent to DLQ
    });
  });
});