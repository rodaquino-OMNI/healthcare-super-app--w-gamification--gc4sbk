import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '../../src/kafka/kafka.service';
import { EventType } from '../../src/dto/event-types.enum';
import { HEALTH_TOPIC, CARE_TOPIC, PLAN_TOPIC, DLQ_TOPIC } from '../../src/constants/topics.constants';
import { EventErrorCode } from '../../src/constants/errors.constants';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConfigService } from '@nestjs/config';
import { EventsModule } from '../../src/events.module';
import { EventMetadata } from '../../src/dto/event-metadata.dto';
import { createMock } from '@golevelup/ts-jest';
import { setTimeout as sleep } from 'timers/promises';

/**
 * Integration tests for error handling in the event processing pipeline.
 * 
 * These tests verify that the system properly handles various error scenarios,
 * including dead letter queues, retry mechanisms, backoff strategies, and error logging.
 */
describe('Error Handling Integration', () => {
  let module: TestingModule;
  let kafkaService: KafkaService;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let mockProducer: any;
  let mockConsumer: any;
  let mockAdmin: any;
  
  // Mock event data for testing
  const testEventMetadata: EventMetadata = {
    eventId: 'test-event-123',
    timestamp: new Date().toISOString(),
    correlationId: 'correlation-123',
    userId: 'user-123',
    source: 'integration-test',
    version: '1.0.0'
  };
  
  const healthEvent = {
    type: EventType.HEALTH_METRIC_RECORDED,
    payload: {
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    metadata: testEventMetadata
  };
  
  beforeEach(async () => {
    // Create mock Kafka client components
    mockProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined)
    };
    
    mockConsumer = {
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      resume: jest.fn()
    };
    
    mockAdmin = {
      connect: jest.fn().mockResolvedValue(undefined),
      createTopics: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      fetchTopicMetadata: jest.fn().mockResolvedValue({
        topics: [
          { name: HEALTH_TOPIC },
          { name: CARE_TOPIC },
          { name: PLAN_TOPIC },
          { name: DLQ_TOPIC }
        ]
      })
    };
    
    // Create test module with mocked dependencies
    module = await Test.createTestingModule({
      imports: [EventsModule],
    })
      .overrideProvider(KafkaService)
      .useValue({
        createProducer: jest.fn().mockReturnValue(mockProducer),
        createConsumer: jest.fn().mockReturnValue(mockConsumer),
        createAdminClient: jest.fn().mockReturnValue(mockAdmin),
        getProducer: jest.fn().mockReturnValue(mockProducer),
        getConsumer: jest.fn().mockReturnValue(mockConsumer),
        getAdminClient: jest.fn().mockReturnValue(mockAdmin),
        sendToDLQ: jest.fn().mockResolvedValue(undefined),
        serialize: jest.fn().mockImplementation((value) => JSON.stringify(value)),
        deserialize: jest.fn().mockImplementation((value) => JSON.parse(value)),
      })
      .overrideProvider(LoggerService)
      .useValue(createMock<LoggerService>())
      .overrideProvider(TracingService)
      .useValue(createMock<TracingService>())
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockImplementation((key) => {
          const config = {
            'kafka.retryAttempts': 3,
            'kafka.initialRetryDelay': 100,
            'kafka.maxRetryDelay': 5000,
            'kafka.retryBackoffMultiplier': 2,
            'kafka.dlqEnabled': true,
            'kafka.dlqTopic': DLQ_TOPIC,
            'kafka.brokers': ['localhost:9092'],
            'kafka.clientId': 'test-client',
            'kafka.groupId': 'test-group',
          };
          return config[key];
        })
      })
      .compile();
    
    kafkaService = module.get<KafkaService>(KafkaService);
    loggerService = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Spy on logger methods
    jest.spyOn(loggerService, 'error');
    jest.spyOn(loggerService, 'warn');
    jest.spyOn(loggerService, 'debug');
  });
  
  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });
  
  describe('Dead Letter Queue', () => {
    it('should send failed events to DLQ after retry exhaustion', async () => {
      // Mock producer to fail consistently
      const error = new Error('Broker connection failed');
      mockProducer.send.mockRejectedValue(error);
      
      // Attempt to send an event that will fail
      try {
        await kafkaService.getProducer().send({
          topic: HEALTH_TOPIC,
          messages: [{
            key: healthEvent.metadata.eventId,
            value: kafkaService.serialize(healthEvent)
          }]
        });
      } catch (e) {
        // Expected to fail
      }
      
      // Wait for retry attempts to complete
      await sleep(1000);
      
      // Verify DLQ was called with the failed event
      expect(kafkaService.sendToDLQ).toHaveBeenCalledWith(
        expect.objectContaining({
          originalTopic: HEALTH_TOPIC,
          originalMessage: expect.objectContaining({
            key: healthEvent.metadata.eventId,
          }),
          error: expect.any(Error),
          retryCount: configService.get('kafka.retryAttempts')
        })
      );
      
      // Verify error was logged
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to produce message after maximum retries'),
        expect.objectContaining({
          eventId: healthEvent.metadata.eventId,
          topic: HEALTH_TOPIC,
          error: expect.any(Error),
          retryCount: configService.get('kafka.retryAttempts')
        })
      );
    });
    
    it('should include original event data and error context in DLQ message', async () => {
      // Setup a specific error for testing
      const validationError = new Error('Event validation failed');
      validationError.name = 'ValidationError';
      mockProducer.send.mockRejectedValue(validationError);
      
      // Capture the DLQ call
      const sendToDLQSpy = jest.spyOn(kafkaService, 'sendToDLQ');
      
      // Attempt to send an event that will fail
      try {
        await kafkaService.getProducer().send({
          topic: HEALTH_TOPIC,
          messages: [{
            key: healthEvent.metadata.eventId,
            value: kafkaService.serialize(healthEvent),
            headers: {
              'correlation-id': Buffer.from(healthEvent.metadata.correlationId || ''),
              'user-id': Buffer.from(healthEvent.metadata.userId || '')
            }
          }]
        });
      } catch (e) {
        // Expected to fail
      }
      
      // Wait for retry attempts to complete
      await sleep(1000);
      
      // Verify DLQ message contains all required context
      expect(sendToDLQSpy).toHaveBeenCalled();
      const dlqCall = sendToDLQSpy.mock.calls[0][0];
      
      expect(dlqCall).toMatchObject({
        originalTopic: HEALTH_TOPIC,
        originalMessage: expect.objectContaining({
          key: healthEvent.metadata.eventId,
          headers: expect.objectContaining({
            'correlation-id': expect.any(Buffer),
            'user-id': expect.any(Buffer)
          })
        }),
        error: expect.objectContaining({
          name: 'ValidationError',
          message: 'Event validation failed'
        }),
        retryCount: expect.any(Number),
        timestamp: expect.any(String)
      });
      
      // Verify the original event payload is preserved
      const originalValue = JSON.parse(dlqCall.originalMessage.value.toString());
      expect(originalValue).toEqual(healthEvent);
    });
  });
  
  describe('Retry Mechanism', () => {
    it('should retry failed events with exponential backoff', async () => {
      // Mock producer to fail initially then succeed
      let attemptCount = 0;
      mockProducer.send.mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Temporary network error'));
        }
        return Promise.resolve();
      });
      
      // Record timestamps for retry attempts
      const timestamps: number[] = [];
      const originalSend = mockProducer.send;
      mockProducer.send = jest.fn().mockImplementation(async (...args) => {
        timestamps.push(Date.now());
        return originalSend(...args);
      });
      
      // Send an event that will fail initially
      await kafkaService.getProducer().send({
        topic: HEALTH_TOPIC,
        messages: [{
          key: healthEvent.metadata.eventId,
          value: kafkaService.serialize(healthEvent)
        }]
      });
      
      // Verify the correct number of attempts were made
      expect(mockProducer.send).toHaveBeenCalledTimes(3);
      
      // Verify exponential backoff pattern
      const initialDelay = configService.get('kafka.initialRetryDelay');
      const backoffMultiplier = configService.get('kafka.retryBackoffMultiplier');
      
      // Calculate expected minimum delays (allowing for some execution time variance)
      const expectedMinDelay1 = initialDelay * 0.9;
      const expectedMinDelay2 = initialDelay * backoffMultiplier * 0.9;
      
      // Calculate actual delays
      const delay1 = timestamps[1] - timestamps[0];
      const delay2 = timestamps[2] - timestamps[1];
      
      // Verify delays follow exponential pattern
      expect(delay1).toBeGreaterThanOrEqual(expectedMinDelay1);
      expect(delay2).toBeGreaterThanOrEqual(expectedMinDelay2);
      expect(delay2).toBeGreaterThan(delay1); // Second delay should be longer
    });
    
    it('should apply different retry policies based on error type', async () => {
      // Create different error types
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      
      // Mock producer to return different errors
      let attemptCount = 0;
      mockProducer.send.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) return Promise.reject(networkError);
        if (attemptCount === 2) return Promise.reject(validationError);
        return Promise.resolve();
      });
      
      // Spy on retry delay calculation
      const calculateRetryDelaySpy = jest.spyOn(kafkaService as any, 'calculateRetryDelay');
      
      // Send an event that will trigger different errors
      try {
        await kafkaService.getProducer().send({
          topic: HEALTH_TOPIC,
          messages: [{
            key: healthEvent.metadata.eventId,
            value: kafkaService.serialize(healthEvent)
          }]
        });
      } catch (e) {
        // ValidationError should not be retried, so we expect to catch it
        expect(e.name).toBe('ValidationError');
      }
      
      // Verify retry delay calculation was called with network error but not validation error
      expect(calculateRetryDelaySpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'NetworkError' }),
        expect.any(Number)
      );
      
      expect(calculateRetryDelaySpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ValidationError' }),
        expect.any(Number)
      );
      
      // Verify appropriate logging
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retrying failed Kafka operation'),
        expect.objectContaining({
          error: expect.objectContaining({ name: 'NetworkError' }),
          attempt: 1,
          delay: expect.any(Number)
        })
      );
      
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Non-retriable error encountered'),
        expect.objectContaining({
          error: expect.objectContaining({ name: 'ValidationError' })
        })
      );
    });
  });
  
  describe('Circuit Breaker Pattern', () => {
    it('should open circuit after consecutive failures', async () => {
      // Mock implementation to track circuit state
      let circuitOpen = false;
      const originalSend = mockProducer.send;
      
      // Mock the isCircuitOpen method
      jest.spyOn(kafkaService as any, 'isCircuitOpen').mockImplementation(() => circuitOpen);
      
      // Mock the openCircuit method
      jest.spyOn(kafkaService as any, 'openCircuit').mockImplementation(() => {
        circuitOpen = true;
      });
      
      // Mock producer to always fail
      mockProducer.send.mockRejectedValue(new Error('Broker connection failed'));
      
      // Configure failure threshold
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'kafka.circuitBreakerFailureThreshold') return 3;
        if (key === 'kafka.circuitBreakerResetTimeout') return 30000;
        return undefined;
      });
      
      // Attempt multiple operations to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await kafkaService.getProducer().send({
            topic: HEALTH_TOPIC,
            messages: [{
              key: `event-${i}`,
              value: kafkaService.serialize(healthEvent)
            }]
          });
        } catch (e) {
          // Expected to fail
        }
      }
      
      // Verify circuit was opened
      expect(kafkaService['openCircuit']).toHaveBeenCalled();
      expect(circuitOpen).toBe(true);
      
      // Verify fast-fail behavior when circuit is open
      const startTime = Date.now();
      try {
        await kafkaService.getProducer().send({
          topic: HEALTH_TOPIC,
          messages: [{
            key: 'event-after-circuit-open',
            value: kafkaService.serialize(healthEvent)
          }]
        });
      } catch (e) {
        expect(e.message).toContain('Circuit breaker is open');
      }
      const duration = Date.now() - startTime;
      
      // Verify fast failure (no retry delay)
      expect(duration).toBeLessThan(50); // Should fail immediately
      
      // Verify appropriate logging
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker opened'),
        expect.objectContaining({
          failureCount: expect.any(Number),
          resetTimeout: expect.any(Number)
        })
      );
    });
    
    it('should reset circuit after timeout period', async () => {
      // Mock implementation to track circuit state
      let circuitOpen = true;
      let circuitOpenedAt = Date.now() - 31000; // Opened 31 seconds ago
      
      // Mock the isCircuitOpen method
      jest.spyOn(kafkaService as any, 'isCircuitOpen').mockImplementation(() => {
        // Check if reset timeout has elapsed
        const resetTimeout = 30000; // 30 seconds
        if (circuitOpen && (Date.now() - circuitOpenedAt) > resetTimeout) {
          circuitOpen = false; // Auto-reset after timeout
          return false;
        }
        return circuitOpen;
      });
      
      // Mock the resetCircuit method
      jest.spyOn(kafkaService as any, 'resetCircuit').mockImplementation(() => {
        circuitOpen = false;
      });
      
      // Configure circuit breaker settings
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'kafka.circuitBreakerResetTimeout') return 30000;
        return undefined;
      });
      
      // Mock producer to succeed
      mockProducer.send.mockResolvedValue(undefined);
      
      // Attempt operation after circuit timeout
      await kafkaService.getProducer().send({
        topic: HEALTH_TOPIC,
        messages: [{
          key: 'event-after-reset',
          value: kafkaService.serialize(healthEvent)
        }]
      });
      
      // Verify circuit was checked and reset
      expect(kafkaService['isCircuitOpen']).toHaveBeenCalled();
      expect(circuitOpen).toBe(false);
      
      // Verify appropriate logging
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker reset'),
        expect.any(Object)
      );
    });
  });
  
  describe('Error Logging and Monitoring', () => {
    it('should log detailed error information with context', async () => {
      // Create a specific error for testing
      const specificError = new Error('Schema validation failed');
      specificError.name = 'SchemaValidationError';
      (specificError as any).code = EventErrorCode.SCHEMA_VALIDATION_ERROR;
      (specificError as any).details = {
        field: 'payload.metricType',
        constraint: 'enum',
        value: 'INVALID_TYPE'
      };
      
      // Mock producer to fail with the specific error
      mockProducer.send.mockRejectedValue(specificError);
      
      // Attempt to send an event that will fail
      try {
        await kafkaService.getProducer().send({
          topic: HEALTH_TOPIC,
          messages: [{
            key: healthEvent.metadata.eventId,
            value: kafkaService.serialize(healthEvent),
            headers: {
              'correlation-id': Buffer.from(healthEvent.metadata.correlationId || ''),
              'user-id': Buffer.from(healthEvent.metadata.userId || '')
            }
          }]
        });
      } catch (e) {
        // Expected to fail
      }
      
      // Verify error was logged with detailed context
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed'),
        expect.objectContaining({
          eventId: healthEvent.metadata.eventId,
          correlationId: healthEvent.metadata.correlationId,
          userId: healthEvent.metadata.userId,
          topic: HEALTH_TOPIC,
          errorCode: EventErrorCode.SCHEMA_VALIDATION_ERROR,
          errorDetails: expect.objectContaining({
            field: 'payload.metricType',
            constraint: 'enum',
            value: 'INVALID_TYPE'
          })
        })
      );
    });
    
    it('should track error metrics for monitoring', async () => {
      // Mock metrics tracking
      const incrementMetricSpy = jest.fn();
      jest.spyOn(kafkaService as any, 'incrementErrorMetric').mockImplementation(incrementMetricSpy);
      
      // Create different error types
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      (networkError as any).code = EventErrorCode.BROKER_CONNECTION_ERROR;
      
      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      (validationError as any).code = EventErrorCode.SCHEMA_VALIDATION_ERROR;
      
      // Mock producer to return different errors in sequence
      let attemptCount = 0;
      mockProducer.send.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) return Promise.reject(networkError);
        if (attemptCount === 2) return Promise.reject(validationError);
        return Promise.resolve();
      });
      
      // Attempt operations that will trigger different errors
      try {
        await kafkaService.getProducer().send({
          topic: HEALTH_TOPIC,
          messages: [{ key: 'event-1', value: kafkaService.serialize(healthEvent) }]
        });
      } catch (e) {
        // Expected to fail with network error, then retry
      }
      
      try {
        await kafkaService.getProducer().send({
          topic: HEALTH_TOPIC,
          messages: [{ key: 'event-2', value: kafkaService.serialize(healthEvent) }]
        });
      } catch (e) {
        // Expected to fail with validation error
      }
      
      // Verify metrics were incremented for each error type
      expect(incrementMetricSpy).toHaveBeenCalledWith(
        'kafka_error_count',
        expect.objectContaining({
          error_code: EventErrorCode.BROKER_CONNECTION_ERROR,
          topic: HEALTH_TOPIC
        })
      );
      
      expect(incrementMetricSpy).toHaveBeenCalledWith(
        'kafka_error_count',
        expect.objectContaining({
          error_code: EventErrorCode.SCHEMA_VALIDATION_ERROR,
          topic: HEALTH_TOPIC
        })
      );
      
      // Verify retry metrics
      expect(incrementMetricSpy).toHaveBeenCalledWith(
        'kafka_retry_count',
        expect.objectContaining({
          topic: HEALTH_TOPIC
        })
      );
    });
  });
});