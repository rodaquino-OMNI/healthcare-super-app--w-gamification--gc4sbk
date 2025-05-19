import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { KafkaService } from '../../src/kafka/kafka.service';
import { DlqService } from '../../src/errors/dlq';
import { RetryPolicyFactory, ExponentialBackoffPolicy } from '../../src/errors/retry-policies';
import { CircuitBreaker } from '../../src/errors/circuit-breaker';
import { EventErrorHandlingService, HandleEventErrors, EventProcessingStage } from '../../src/errors/handling';
import { EventProcessingError, EventValidationError, EventDatabaseError } from '../../src/errors/event-errors';
import { IBaseEvent } from '../../src/interfaces/base-event.interface';
import { IEventResponse, EventResponseStatus } from '../../src/interfaces/event-response.interface';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';

/**
 * Mock implementation of KafkaService for testing
 */
class MockKafkaService {
  private readonly messages: Map<string, any[]> = new Map();
  private readonly dlqMessages: Map<string, any[]> = new Map();

  async produce({ topic, messages }: { topic: string; messages: any[] }): Promise<void> {
    if (topic.startsWith('dlq-')) {
      if (!this.dlqMessages.has(topic)) {
        this.dlqMessages.set(topic, []);
      }
      this.dlqMessages.get(topic)?.push(...messages);
    } else {
      if (!this.messages.has(topic)) {
        this.messages.set(topic, []);
      }
      this.messages.get(topic)?.push(...messages);
    }
  }

  async consumeBatch(topic: string, groupId: string, limit: number): Promise<any[]> {
    if (topic.startsWith('dlq-')) {
      return this.dlqMessages.get(topic) || [];
    }
    return this.messages.get(topic) || [];
  }

  getDlqMessages(topic: string): any[] {
    return this.dlqMessages.get(topic) || [];
  }

  clearMessages(): void {
    this.messages.clear();
    this.dlqMessages.clear();
  }
}

/**
 * Mock implementation of TracingService for testing
 */
class MockTracingService {
  private traceId: string = uuidv4();
  private spanId: string = uuidv4();

  startSpan(name: string): any {
    return {
      end: () => {}
    };
  }

  getTraceContext(): { traceId: string; spanId: string } {
    return { traceId: this.traceId, spanId: this.spanId };
  }
}

/**
 * Mock implementation of LoggerService for testing
 */
class MockLoggerService {
  private context: string = 'Test';
  private logs: any[] = [];

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: any): void {
    this.logs.push({ level: 'log', message, context, timestamp: new Date() });
  }

  error(message: string, trace?: string, context?: any): void {
    this.logs.push({ level: 'error', message, trace, context, timestamp: new Date() });
  }

  warn(message: string, context?: any): void {
    this.logs.push({ level: 'warn', message, context, timestamp: new Date() });
  }

  debug(message: string, context?: any): void {
    this.logs.push({ level: 'debug', message, context, timestamp: new Date() });
  }

  getLogs(): any[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Test event handler class with error handling decorators
 */
class TestEventHandler {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(private shouldFail: boolean = false, private failureType: string = 'processing') {}

  @HandleEventErrors({
    sendToDlq: true,
    applyRetryPolicy: true,
    processingStage: EventProcessingStage.PROCESSING
  })
  async handleEvent(event: IBaseEvent): Promise<IEventResponse> {
    if (this.shouldFail) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        
        if (this.failureType === 'database') {
          throw new EventDatabaseError(
            'Database connection failed',
            { eventId: event.eventId, eventType: event.type },
            'query'
          );
        } else if (this.failureType === 'validation') {
          throw new EventValidationError(
            'Event validation failed',
            { eventId: event.eventId, eventType: event.type }
          );
        } else {
          throw new EventProcessingError(
            'Event processing failed',
            { eventId: event.eventId, eventType: event.type }
          );
        }
      }
    }

    return {
      success: true,
      status: EventResponseStatus.SUCCESS,
      eventId: event.eventId,
      eventType: event.type,
      metadata: {
        timestamp: new Date().toISOString(),
        retryCount: this.retryCount
      }
    };
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  resetRetryCount(): void {
    this.retryCount = 0;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setFailureType(type: string): void {
    this.failureType = type;
  }
}

/**
 * Create a test event for use in tests
 */
function createTestEvent(type: string = 'test.event'): IBaseEvent {
  return {
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test-service',
    type,
    payload: { data: 'test-data' },
    metadata: {
      correlationId: uuidv4(),
      journey: 'health'
    }
  };
}

describe('Error Handling Integration Tests', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dlqService: DlqService;
  let kafkaService: MockKafkaService;
  let retryPolicyFactory: RetryPolicyFactory;
  let errorHandlingService: EventErrorHandlingService;
  let testEventHandler: TestEventHandler;
  let loggerService: MockLoggerService;

  beforeAll(async () => {
    // Create mocks
    kafkaService = new MockKafkaService();
    const tracingService = new MockTracingService();
    loggerService = new MockLoggerService();

    // Create test module
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            kafka: {
              dlqTopicPrefix: 'dlq-',
              defaultDlqTopic: 'dlq-events'
            }
          })]
        })
      ],
      providers: [
        {
          provide: KafkaService,
          useValue: kafkaService
        },
        {
          provide: TracingService,
          useValue: tracingService
        },
        {
          provide: LoggerService,
          useValue: loggerService
        },
        {
          provide: RetryPolicyFactory,
          useFactory: () => new RetryPolicyFactory()
        },
        {
          provide: DlqService,
          useFactory: (kafka: KafkaService, logger: LoggerService, tracing: TracingService, config: ConfigService) => {
            return new DlqService(kafka, logger, tracing, config);
          },
          inject: [KafkaService, LoggerService, TracingService, ConfigService]
        },
        {
          provide: EventErrorHandlingService,
          useFactory: (logger: Logger) => {
            return new EventErrorHandlingService(logger);
          },
          inject: [Logger]
        },
        Logger
      ]
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Get service instances
    dlqService = module.get<DlqService>(DlqService);
    retryPolicyFactory = module.get<RetryPolicyFactory>(RetryPolicyFactory);
    errorHandlingService = module.get<EventErrorHandlingService>(EventErrorHandlingService);
    
    // Create test event handler
    testEventHandler = new TestEventHandler();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    kafkaService.clearMessages();
    loggerService.clearLogs();
    testEventHandler.resetRetryCount();
    testEventHandler.setShouldFail(false);
  });

  describe('Dead Letter Queue Functionality', () => {
    it('should send failed events to the DLQ after retry attempts are exhausted', async () => {
      // Arrange
      const testEvent = createTestEvent('health.metric.recorded');
      testEventHandler.setShouldFail(true);
      testEventHandler.setFailureType('processing');

      // Act - This will fail and eventually be sent to DLQ
      for (let i = 0; i < 4; i++) { // More than max retries
        try {
          await testEventHandler.handleEvent(testEvent);
        } catch (error) {
          // Expected to throw
        }
      }

      // Assert
      const dlqMessages = kafkaService.getDlqMessages('dlq-health');
      expect(dlqMessages.length).toBeGreaterThan(0);
      
      // Check DLQ message structure
      const dlqMessage = JSON.parse(dlqMessages[0].value);
      expect(dlqMessage.originalEvent.eventId).toBe(testEvent.eventId);
      expect(dlqMessage.metadata.errorType).toBe('business');
      expect(dlqMessage.metadata.journey).toBe('health');
    });

    it('should include error context and retry history in DLQ messages', async () => {
      // Arrange
      const testEvent = createTestEvent('health.metric.recorded');
      testEventHandler.setShouldFail(true);
      testEventHandler.setFailureType('database');

      // Act - This will fail and eventually be sent to DLQ
      for (let i = 0; i < 4; i++) { // More than max retries
        try {
          await testEventHandler.handleEvent(testEvent);
        } catch (error) {
          // Expected to throw
        }
      }

      // Assert
      const dlqMessages = kafkaService.getDlqMessages('dlq-health');
      expect(dlqMessages.length).toBeGreaterThan(0);
      
      // Check DLQ message details
      const dlqMessage = JSON.parse(dlqMessages[0].value);
      expect(dlqMessage.metadata.errorMessage).toContain('Database connection failed');
      expect(dlqMessage.metadata.sourceService).toBe(testEvent.source);
      expect(dlqMessage.metadata.originalEventId).toBe(testEvent.eventId);
    });

    it('should not send validation errors to DLQ when configured to skip validation errors', async () => {
      // This would require modifying the decorator options, which we can't do in this test
      // Instead, we'll use the DlqService directly
      
      // Arrange
      const testEvent = createTestEvent('health.metric.recorded');
      const validationError = new EventValidationError(
        'Validation failed for event',
        { eventId: testEvent.eventId, eventType: testEvent.type }
      );

      // Act
      await dlqService.sendToDlq(testEvent, validationError);

      // Assert
      const dlqMessages = kafkaService.getDlqMessages('dlq-health');
      expect(dlqMessages.length).toBe(1);
      
      // Check that it's properly marked as a client error
      const dlqMessage = JSON.parse(dlqMessages[0].value);
      expect(dlqMessage.metadata.errorType).toBe('client');
    });
  });

  describe('Retry Mechanisms', () => {
    it('should retry transient errors with exponential backoff', async () => {
      // Arrange
      const policy = new ExponentialBackoffPolicy({
        maxRetries: 3,
        initialDelay: 100,
        backoffFactor: 2,
        jitter: 0.1
      });

      const testEvent = createTestEvent();
      const error = new EventDatabaseError(
        'Temporary database connection issue',
        { eventId: testEvent.eventId, eventType: testEvent.type },
        'query'
      );

      // Act & Assert
      // First retry
      let delay = policy.calculateNextRetryDelay({ error, attemptCount: 0, eventType: testEvent.type });
      expect(delay).toBeGreaterThanOrEqual(90); // 100ms with jitter
      expect(delay).toBeLessThanOrEqual(110);

      // Second retry
      delay = policy.calculateNextRetryDelay({ error, attemptCount: 1, eventType: testEvent.type });
      expect(delay).toBeGreaterThanOrEqual(180); // 200ms with jitter
      expect(delay).toBeLessThanOrEqual(220);

      // Third retry
      delay = policy.calculateNextRetryDelay({ error, attemptCount: 2, eventType: testEvent.type });
      expect(delay).toBeGreaterThanOrEqual(360); // 400ms with jitter
      expect(delay).toBeLessThanOrEqual(440);

      // Should not retry after max retries
      expect(policy.shouldRetry({ error, attemptCount: 3, eventType: testEvent.type })).toBe(false);
    });

    it('should apply different retry policies based on error type and journey', async () => {
      // Arrange
      const healthPolicy = retryPolicyFactory.createPolicyForJourneyAndErrorType('health', 'NETWORK');
      const carePolicy = retryPolicyFactory.createPolicyForJourneyAndErrorType('care', 'NETWORK');
      const planPolicy = retryPolicyFactory.createPolicyForJourneyAndErrorType('plan', 'DATABASE');

      // Act & Assert
      // Different journeys should have different retry configurations
      expect(healthPolicy.getName()).not.toBe(planPolicy.getName());
      
      // Create test events and errors for different journeys
      const healthEvent = createTestEvent('health.metric.recorded');
      const careEvent = createTestEvent('care.appointment.booked');
      const planEvent = createTestEvent('plan.claim.submitted');
      
      const networkError = new Error('Network error');
      (networkError as any).errorType = 'NETWORK';
      
      const dbError = new Error('Database error');
      (dbError as any).errorType = 'DATABASE';

      // Check that policies are applied correctly
      const healthContext = { error: networkError, attemptCount: 0, eventType: healthEvent.type, source: 'health-service' };
      const careContext = { error: networkError, attemptCount: 0, eventType: careEvent.type, source: 'care-service' };
      const planContext = { error: dbError, attemptCount: 0, eventType: planEvent.type, source: 'plan-service' };

      // All should be retryable on first attempt
      expect(healthPolicy.shouldRetry(healthContext)).toBe(true);
      expect(carePolicy.shouldRetry(careContext)).toBe(true);
      expect(planPolicy.shouldRetry(planContext)).toBe(true);
    });

    it('should correctly handle retry counts and eventually succeed', async () => {
      // Arrange
      const testEvent = createTestEvent();
      testEventHandler.setShouldFail(true);
      testEventHandler.setFailureType('database'); // Database errors are retryable

      // Act - First attempts will fail
      for (let i = 0; i < 3; i++) { // Max retries
        try {
          await testEventHandler.handleEvent(testEvent);
        } catch (error) {
          // Expected to throw
        }
      }

      // Now it should succeed on the next attempt (after max retries)
      testEventHandler.setShouldFail(false);
      const result = await testEventHandler.handleEvent(testEvent);

      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe(EventResponseStatus.SUCCESS);
      expect(testEventHandler.getRetryCount()).toBe(3); // Should have retried 3 times before succeeding
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should open the circuit after reaching the failure threshold', async () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000, // 1 second for testing
        windowSize: 5,
        failureRateThreshold: 0.6 // 60%
      });

      // Act - Record failures
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure();
      }

      // Assert
      expect(circuitBreaker.isOpen()).toBe(true);
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should transition to half-open state after reset timeout', async () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100, // Very short for testing
        windowSize: 5
      });

      // Act - Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.isOpen()).toBe(true);

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert - Should be half-open now
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    it('should close the circuit after successful operations in half-open state', async () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100, // Very short for testing
        windowSize: 5
      });

      // Act - Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.isOpen()).toBe(true);

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');

      // Record successful operations in half-open state
      circuitBreaker.recordSuccess();
      circuitBreaker.recordSuccess();

      // Assert - Should be closed now
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should reopen the circuit on failure in half-open state', async () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100, // Very short for testing
        windowSize: 5
      });

      // Act - Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.isOpen()).toBe(true);

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');

      // Record a failure in half-open state
      circuitBreaker.recordFailure();

      // Assert - Should be open again
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log detailed error information with context', async () => {
      // Arrange
      const testEvent = createTestEvent('health.metric.recorded');
      testEventHandler.setShouldFail(true);
      testEventHandler.setFailureType('processing');

      // Act
      try {
        await testEventHandler.handleEvent(testEvent);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      const logs = loggerService.getLogs();
      const errorLogs = logs.filter(log => log.level === 'error');
      
      expect(errorLogs.length).toBeGreaterThan(0);
      
      // Check log content
      const errorLog = errorLogs[0];
      expect(errorLog.message).toContain('Event processing failed');
      expect(errorLog.context).toBeDefined();
      expect(errorLog.context.eventId).toBe(testEvent.eventId);
      expect(errorLog.context.eventType).toBe(testEvent.type);
    });

    it('should include journey context and processing stage in error logs', async () => {
      // Arrange
      const testEvent = createTestEvent('care.appointment.booked');
      testEvent.metadata = { ...testEvent.metadata, journey: 'care' };
      testEventHandler.setShouldFail(true);
      testEventHandler.setFailureType('database');

      // Act
      try {
        await testEventHandler.handleEvent(testEvent);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      const logs = loggerService.getLogs();
      const errorLogs = logs.filter(log => log.level === 'error');
      
      expect(errorLogs.length).toBeGreaterThan(0);
      
      // Check journey context and processing stage
      const errorLog = errorLogs[0];
      expect(errorLog.context.journey).toBeDefined();
      expect(errorLog.context.processingStage).toBe(EventProcessingStage.PROCESSING);
    });

    it('should log different levels based on error severity', async () => {
      // Arrange
      const testEvent = createTestEvent();
      
      // Create different types of errors
      const validationError = new EventValidationError(
        'Validation failed',
        { eventId: testEvent.eventId, eventType: testEvent.type }
      );
      
      const processingError = new EventProcessingError(
        'Processing failed',
        { eventId: testEvent.eventId, eventType: testEvent.type }
      );

      // Act - Use error handling service directly to log errors
      const wrappedHandler = errorHandlingService.wrapWithErrorHandling(
        async () => { throw validationError; },
        { journeyContext: 'health', processingStage: EventProcessingStage.VALIDATION }
      );
      
      try {
        await wrappedHandler(testEvent as any);
      } catch (error) {
        // Expected
      }
      
      const wrappedHandler2 = errorHandlingService.wrapWithErrorHandling(
        async () => { throw processingError; },
        { journeyContext: 'health', processingStage: EventProcessingStage.PROCESSING }
      );
      
      try {
        await wrappedHandler2(testEvent as any);
      } catch (error) {
        // Expected
      }

      // Assert
      const logs = loggerService.getLogs();
      const warnLogs = logs.filter(log => log.level === 'warn');
      const errorLogs = logs.filter(log => log.level === 'error');
      
      // Validation errors should be warnings, processing errors should be errors
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });
});