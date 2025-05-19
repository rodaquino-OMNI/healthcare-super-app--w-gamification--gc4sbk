import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { KafkaModule } from '../../../src/kafka/kafka.module';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { KafkaProducer } from '../../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../../src/kafka/kafka.consumer';
import { EventTypes } from '../../../src/dto/event-types.enum';
import { RetryPolicies } from '../../../src/errors/retry-policies';
import { DLQService } from '../../../src/errors/dlq';
import { EventValidator } from '../../../src/utils/event-validator';
import { EventAuditService } from '../../../src/utils/event-tracing';
import { CorrelationIdGenerator } from '../../../src/utils/correlation-id';
import { waitForEvent, delay } from '../utils/timing-helpers';
import { compareEvents } from '../utils/event-comparison';
import { KafkaTestClient } from '../utils/kafka-test-client';
import { 
  mockHealthMetricEvent, 
  mockCareAppointmentEvent, 
  mockPlanClaimEvent 
} from '../utils/mock-events';
import { 
  healthEvents, 
  careEvents, 
  planEvents 
} from '../fixtures';
import { MockEventProcessor } from '../mocks/mock-event-processor';
import { MockErrorHandler } from '../mocks/mock-error-handler';
import { MockEventStore } from '../mocks/mock-event-store';

describe('Event Retry Handling (E2E)', () => {
  let app: INestApplication;
  let kafkaService: KafkaService;
  let kafkaProducer: KafkaProducer;
  let kafkaConsumer: KafkaConsumer;
  let dlqService: DLQService;
  let eventValidator: EventValidator;
  let eventAuditService: EventAuditService;
  let mockEventProcessor: MockEventProcessor;
  let mockErrorHandler: MockErrorHandler;
  let mockEventStore: MockEventStore;
  let kafkaTestClient: KafkaTestClient;

  beforeAll(async () => {
    // Create a testing module with real Kafka services but mock event processor
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        KafkaModule.forRoot({
          clientId: 'event-retry-e2e-test',
          brokers: ['localhost:9092'],
          groupId: 'event-retry-test-group',
        }),
      ],
      providers: [
        {
          provide: MockEventProcessor,
          useClass: MockEventProcessor,
        },
        {
          provide: MockErrorHandler,
          useClass: MockErrorHandler,
        },
        {
          provide: MockEventStore,
          useClass: MockEventStore,
        },
        {
          provide: EventAuditService,
          useClass: EventAuditService,
        },
        {
          provide: EventValidator,
          useClass: EventValidator,
        },
        {
          provide: DLQService,
          useClass: DLQService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get service instances
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    kafkaProducer = moduleFixture.get<KafkaProducer>(KafkaProducer);
    kafkaConsumer = moduleFixture.get<KafkaConsumer>(KafkaConsumer);
    dlqService = moduleFixture.get<DLQService>(DLQService);
    eventValidator = moduleFixture.get<EventValidator>(EventValidator);
    eventAuditService = moduleFixture.get<EventAuditService>(EventAuditService);
    mockEventProcessor = moduleFixture.get<MockEventProcessor>(MockEventProcessor);
    mockErrorHandler = moduleFixture.get<MockErrorHandler>(MockErrorHandler);
    mockEventStore = moduleFixture.get<MockEventStore>(MockEventStore);

    // Initialize Kafka test client
    kafkaTestClient = new KafkaTestClient({
      clientId: 'event-retry-e2e-test-client',
      brokers: ['localhost:9092'],
    });
    await kafkaTestClient.connect();

    // Configure mock event processor for testing
    mockEventProcessor.configure({
      failureRate: 0, // Start with no failures
      processingDelay: 10, // Small delay to simulate processing time
      errorTypes: ['validation', 'processing', 'timeout'],
    });

    // Configure mock error handler
    mockErrorHandler.configure({
      retryPolicy: RetryPolicies.exponentialBackoff({
        initialDelayMs: 50,
        maxDelayMs: 1000,
        maxRetries: 3,
        jitterFactor: 0.1,
      }),
    });

    // Clear event store before tests
    await mockEventStore.clear();

    // Subscribe to test topics
    await kafkaConsumer.subscribe([
      'health-events',
      'care-events',
      'plan-events',
      'dlq-health-events',
      'dlq-care-events',
      'dlq-plan-events',
    ]);
  });

  afterAll(async () => {
    // Clean up resources
    await kafkaTestClient.disconnect();
    await kafkaService.onModuleDestroy();
    await app.close();
  });

  beforeEach(async () => {
    // Reset mocks and stores before each test
    jest.clearAllMocks();
    await mockEventStore.clear();
    mockEventProcessor.resetCounters();
    mockErrorHandler.resetCounters();
  });

  describe('Dead Letter Queue Functionality', () => {
    it('should send events to DLQ after maximum retries are exhausted', async () => {
      // Configure processor to always fail with non-recoverable error
      mockEventProcessor.configure({
        failureRate: 1.0, // Always fail
        errorTypes: ['processing'], // Non-recoverable error
      });

      // Create test event
      const testEvent = mockHealthMetricEvent({
        userId: 'test-user-1',
        metricType: 'HEART_RATE',
        value: 75,
      });

      // Send event
      await kafkaProducer.produce({
        topic: 'health-events',
        messages: [
          {
            key: testEvent.eventId,
            value: JSON.stringify(testEvent),
            headers: {
              'correlation-id': CorrelationIdGenerator.generate(),
            },
          },
        ],
      });

      // Wait for event to be processed and sent to DLQ after retries
      await waitForEvent(() => mockErrorHandler.getRetryCount(testEvent.eventId) >= 3, 5000);
      await waitForEvent(() => dlqService.getMessageCount('dlq-health-events') > 0, 2000);

      // Verify event was sent to DLQ
      const dlqMessages = await dlqService.readMessages('dlq-health-events', 1);
      expect(dlqMessages.length).toBe(1);
      
      // Verify DLQ message contains original event and error information
      const dlqMessage = dlqMessages[0];
      expect(dlqMessage.originalEvent).toEqual(testEvent);
      expect(dlqMessage.error).toBeDefined();
      expect(dlqMessage.retryCount).toBeGreaterThanOrEqual(3);
      expect(dlqMessage.lastRetryTimestamp).toBeDefined();
    });

    it('should include detailed error information in DLQ messages', async () => {
      // Configure processor to fail with specific error
      mockEventProcessor.configure({
        failureRate: 1.0, // Always fail
        errorTypes: ['validation'], // Validation error
        errorMessage: 'Invalid metric value: out of physiological range',
      });

      // Create test event with invalid data
      const testEvent = mockHealthMetricEvent({
        userId: 'test-user-2',
        metricType: 'HEART_RATE',
        value: 300, // Invalid heart rate
      });

      // Send event
      await kafkaProducer.produce({
        topic: 'health-events',
        messages: [
          {
            key: testEvent.eventId,
            value: JSON.stringify(testEvent),
            headers: {
              'correlation-id': CorrelationIdGenerator.generate(),
            },
          },
        ],
      });

      // Wait for event to be processed and sent to DLQ
      await waitForEvent(() => dlqService.getMessageCount('dlq-health-events') > 0, 5000);

      // Verify DLQ message contains detailed error information
      const dlqMessages = await dlqService.readMessages('dlq-health-events', 1);
      const dlqMessage = dlqMessages[0];
      
      expect(dlqMessage.error).toBeDefined();
      expect(dlqMessage.error.message).toContain('Invalid metric value');
      expect(dlqMessage.error.code).toBe('VALIDATION_ERROR');
      expect(dlqMessage.error.context).toEqual({
        eventType: EventTypes.HEALTH_METRIC_RECORDED,
        fieldName: 'value',
        invalidValue: 300,
        validRange: { min: 30, max: 220 },
      });
    });
  });

  describe('Retry Mechanisms with Exponential Backoff', () => {
    it('should retry failed events with exponential backoff', async () => {
      // Configure processor to fail initially but succeed after retries
      mockEventProcessor.configure({
        failureRate: 0.8, // High failure rate
        errorTypes: ['timeout'], // Recoverable error
        successAfterAttempts: 2, // Succeed after 2 attempts
      });

      // Create test event
      const testEvent = mockCareAppointmentEvent({
        userId: 'test-user-3',
        appointmentId: 'appt-123',
        status: 'BOOKED',
      });

      // Record start time
      const startTime = Date.now();

      // Send event
      await kafkaProducer.produce({
        topic: 'care-events',
        messages: [
          {
            key: testEvent.eventId,
            value: JSON.stringify(testEvent),
            headers: {
              'correlation-id': CorrelationIdGenerator.generate(),
            },
          },
        ],
      });

      // Wait for event to be successfully processed after retries
      await waitForEvent(() => mockEventProcessor.getSuccessCount() > 0, 5000);

      // Get retry timestamps
      const retryTimestamps = mockErrorHandler.getRetryTimestamps(testEvent.eventId);
      
      // Verify at least 2 retries occurred
      expect(retryTimestamps.length).toBeGreaterThanOrEqual(2);
      
      // Calculate delays between retries
      const delays = [];
      for (let i = 1; i < retryTimestamps.length; i++) {
        delays.push(retryTimestamps[i] - retryTimestamps[i-1]);
      }
      
      // Verify exponential backoff pattern (each delay should be longer than the previous)
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i-1]);
      }
      
      // Verify event was eventually processed successfully
      expect(mockEventProcessor.getSuccessCount()).toBe(1);
      expect(mockEventStore.getEvents().length).toBe(1);
      expect(mockEventStore.getEvents()[0].eventId).toBe(testEvent.eventId);
    });

    it('should apply jitter to retry intervals to prevent thundering herd', async () => {
      // Configure processor to fail consistently
      mockEventProcessor.configure({
        failureRate: 1.0, // Always fail
        errorTypes: ['timeout'], // Recoverable error
        successAfterAttempts: 10, // Require many attempts (won't reach this)
      });

      // Configure error handler with specific jitter
      mockErrorHandler.configure({
        retryPolicy: RetryPolicies.exponentialBackoff({
          initialDelayMs: 50,
          maxDelayMs: 1000,
          maxRetries: 5,
          jitterFactor: 0.2, // 20% jitter
        }),
      });

      // Create and send multiple test events simultaneously
      const events = [];
      for (let i = 0; i < 5; i++) {
        const event = mockCareAppointmentEvent({
          userId: `test-user-${4 + i}`,
          appointmentId: `appt-${200 + i}`,
          status: 'BOOKED',
        });
        events.push(event);
      }

      // Send all events
      for (const event of events) {
        await kafkaProducer.produce({
          topic: 'care-events',
          messages: [
            {
              key: event.eventId,
              value: JSON.stringify(event),
              headers: {
                'correlation-id': CorrelationIdGenerator.generate(),
              },
            },
          ],
        });
      }

      // Wait for multiple retry attempts
      await delay(2000);

      // Get retry timestamps for all events
      const allRetryTimestamps = events.map(event => {
        return mockErrorHandler.getRetryTimestamps(event.eventId);
      });

      // For each retry attempt, check that the timestamps are not all identical
      // This verifies that jitter is being applied
      for (let attemptIndex = 0; attemptIndex < 3; attemptIndex++) {
        const timestampsForAttempt = allRetryTimestamps
          .filter(timestamps => timestamps.length > attemptIndex)
          .map(timestamps => timestamps[attemptIndex]);

        // Skip if we don't have enough data points
        if (timestampsForAttempt.length < 2) continue;

        // Check that timestamps are not all identical (jitter is working)
        const uniqueTimestamps = new Set(timestampsForAttempt);
        expect(uniqueTimestamps.size).toBeGreaterThan(1);
      }
    });
  });

  describe('Event Audit and Logging', () => {
    it('should log all event processing attempts including retries', async () => {
      // Configure processor to fail initially but succeed after retries
      mockEventProcessor.configure({
        failureRate: 0.7, // High failure rate
        errorTypes: ['processing'], // Processing error
        successAfterAttempts: 2, // Succeed after 2 attempts
      });

      // Create test event
      const testEvent = mockPlanClaimEvent({
        userId: 'test-user-9',
        claimId: 'claim-456',
        status: 'SUBMITTED',
        amount: 150.75,
      });

      // Send event
      await kafkaProducer.produce({
        topic: 'plan-events',
        messages: [
          {
            key: testEvent.eventId,
            value: JSON.stringify(testEvent),
            headers: {
              'correlation-id': CorrelationIdGenerator.generate(),
            },
          },
        ],
      });

      // Wait for event to be successfully processed after retries
      await waitForEvent(() => mockEventProcessor.getSuccessCount() > 0, 5000);

      // Verify audit logs contain entries for all processing attempts
      const auditLogs = eventAuditService.getAuditLogs(testEvent.eventId);
      
      // Should have at least 3 log entries: initial attempt + 2 retries
      expect(auditLogs.length).toBeGreaterThanOrEqual(3);
      
      // First logs should be failures, last should be success
      expect(auditLogs[0].status).toBe('FAILED');
      expect(auditLogs[auditLogs.length - 1].status).toBe('SUCCEEDED');
      
      // Verify log content
      auditLogs.forEach(log => {
        expect(log.eventId).toBe(testEvent.eventId);
        expect(log.eventType).toBe(EventTypes.PLAN_CLAIM_SUBMITTED);
        expect(log.timestamp).toBeDefined();
        expect(log.correlationId).toBeDefined();
        expect(log.processingTimeMs).toBeGreaterThan(0);
        
        if (log.status === 'FAILED') {
          expect(log.error).toBeDefined();
          expect(log.retryCount).toBeDefined();
          expect(log.nextRetryTimestamp).toBeDefined();
        }
      });
    });

    it('should track event processing metrics for monitoring', async () => {
      // Reset metrics before test
      eventAuditService.resetMetrics();

      // Configure processor with mixed success/failure
      mockEventProcessor.configure({
        failureRate: 0.5, // 50% failure rate
        errorTypes: ['timeout', 'processing'], // Mix of error types
        successAfterAttempts: 3, // Eventually succeed
      });

      // Create and send multiple test events
      const events = [];
      for (let i = 0; i < 10; i++) {
        const event = mockPlanClaimEvent({
          userId: `test-user-${10 + i}`,
          claimId: `claim-${500 + i}`,
          status: 'SUBMITTED',
          amount: 100 + i * 10,
        });
        events.push(event);
        
        await kafkaProducer.produce({
          topic: 'plan-events',
          messages: [
            {
              key: event.eventId,
              value: JSON.stringify(event),
              headers: {
                'correlation-id': CorrelationIdGenerator.generate(),
              },
            },
          ],
        });
      }

      // Wait for events to be processed
      await delay(5000);

      // Get processing metrics
      const metrics = eventAuditService.getMetrics();
      
      // Verify metrics are being tracked
      expect(metrics.totalEvents).toBeGreaterThanOrEqual(10);
      expect(metrics.successfulEvents).toBeGreaterThan(0);
      expect(metrics.failedEvents).toBeGreaterThan(0);
      expect(metrics.retryAttempts).toBeGreaterThan(0);
      expect(metrics.averageProcessingTimeMs).toBeGreaterThan(0);
      
      // Verify journey-specific metrics
      expect(metrics.journeyMetrics.plan.totalEvents).toBeGreaterThanOrEqual(10);
      expect(metrics.journeyMetrics.plan.eventTypes[EventTypes.PLAN_CLAIM_SUBMITTED]).toBeGreaterThanOrEqual(10);
      
      // Verify error metrics
      expect(metrics.errorMetrics.timeout).toBeGreaterThan(0);
      expect(metrics.errorMetrics.processing).toBeGreaterThan(0);
    });
  });

  describe('Automatic Recovery After Failures', () => {
    it('should automatically recover and process events after temporary failures', async () => {
      // Configure processor to simulate temporary service outage
      mockEventProcessor.configure({
        failureRate: 1.0, // Always fail initially
        errorTypes: ['service_unavailable'], // Temporary failure
      });

      // Create test event
      const testEvent = mockHealthMetricEvent({
        userId: 'test-user-20',
        metricType: 'WEIGHT',
        value: 75.5,
      });

      // Send event
      await kafkaProducer.produce({
        topic: 'health-events',
        messages: [
          {
            key: testEvent.eventId,
            value: JSON.stringify(testEvent),
            headers: {
              'correlation-id': CorrelationIdGenerator.generate(),
            },
          },
        ],
      });

      // Wait for initial processing attempt
      await delay(500);

      // Verify event processing failed
      expect(mockEventProcessor.getFailureCount()).toBeGreaterThan(0);
      expect(mockEventProcessor.getSuccessCount()).toBe(0);

      // Simulate service recovery
      mockEventProcessor.configure({
        failureRate: 0.0, // Always succeed now
        errorTypes: [],
      });

      // Wait for automatic retry and successful processing
      await waitForEvent(() => mockEventProcessor.getSuccessCount() > 0, 5000);

      // Verify event was eventually processed successfully
      expect(mockEventProcessor.getSuccessCount()).toBe(1);
      expect(mockEventStore.getEvents().length).toBe(1);
      expect(mockEventStore.getEvents()[0].eventId).toBe(testEvent.eventId);
    });

    it('should maintain processing order for related events during recovery', async () => {
      // Configure processor to fail initially
      mockEventProcessor.configure({
        failureRate: 1.0, // Always fail
        errorTypes: ['timeout'], // Recoverable error
      });

      // Create sequence of related events for the same user/entity
      const userId = 'test-user-21';
      const events = [];
      
      // Create 3 sequential events (appointment booked, checked-in, completed)
      const appointmentId = 'appt-789';
      const event1 = mockCareAppointmentEvent({
        userId,
        appointmentId,
        status: 'BOOKED',
        sequenceNumber: 1,
      });
      
      const event2 = mockCareAppointmentEvent({
        userId,
        appointmentId,
        status: 'CHECKED_IN',
        sequenceNumber: 2,
      });
      
      const event3 = mockCareAppointmentEvent({
        userId,
        appointmentId,
        status: 'COMPLETED',
        sequenceNumber: 3,
      });
      
      events.push(event1, event2, event3);

      // Send events in sequence
      for (const event of events) {
        await kafkaProducer.produce({
          topic: 'care-events',
          messages: [
            {
              key: event.eventId,
              value: JSON.stringify(event),
              headers: {
                'correlation-id': CorrelationIdGenerator.generate(),
                'sequence-number': event.sequenceNumber.toString(),
              },
            },
          ],
        });
        
        // Small delay between events
        await delay(50);
      }

      // Wait for initial processing attempts
      await delay(500);

      // Simulate service recovery
      mockEventProcessor.configure({
        failureRate: 0.0, // Always succeed now
        errorTypes: [],
      });

      // Wait for automatic retry and successful processing of all events
      await waitForEvent(() => mockEventProcessor.getSuccessCount() >= 3, 5000);

      // Verify all events were processed
      expect(mockEventProcessor.getSuccessCount()).toBe(3);
      expect(mockEventStore.getEvents().length).toBe(3);

      // Get processed events in order of processing
      const processedEvents = mockEventStore.getEvents();
      
      // Verify events were processed in the correct sequence order
      // despite potentially different retry schedules
      expect(processedEvents[0].sequenceNumber).toBe(1);
      expect(processedEvents[1].sequenceNumber).toBe(2);
      expect(processedEvents[2].sequenceNumber).toBe(3);
      
      // Verify status transitions were processed in order
      expect(processedEvents[0].data.status).toBe('BOOKED');
      expect(processedEvents[1].data.status).toBe('CHECKED_IN');
      expect(processedEvents[2].data.status).toBe('COMPLETED');
    });
  });

  describe('Event Schema Versioning and Compatibility', () => {
    it('should handle events with different schema versions', async () => {
      // Configure processor for normal operation
      mockEventProcessor.configure({
        failureRate: 0.0, // Always succeed
        errorTypes: [],
      });

      // Create events with different schema versions
      const v1Event = {
        ...planEvents.claimSubmitted.v1,
        eventId: 'event-v1-' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: 'test-user-30',
      };
      
      const v2Event = {
        ...planEvents.claimSubmitted.v2,
        eventId: 'event-v2-' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: 'test-user-30',
      };

      // Send both events
      await kafkaProducer.produce({
        topic: 'plan-events',
        messages: [
          {
            key: v1Event.eventId,
            value: JSON.stringify(v1Event),
            headers: {
              'correlation-id': CorrelationIdGenerator.generate(),
              'schema-version': '1.0.0',
            },
          },
        ],
      });
      
      await kafkaProducer.produce({
        topic: 'plan-events',
        messages: [
          {
            key: v2Event.eventId,
            value: JSON.stringify(v2Event),
            headers: {
              'correlation-id': CorrelationIdGenerator.generate(),
              'schema-version': '2.0.0',
            },
          },
        ],
      });

      // Wait for both events to be processed
      await waitForEvent(() => mockEventProcessor.getSuccessCount() >= 2, 5000);

      // Verify both events were processed successfully
      expect(mockEventProcessor.getSuccessCount()).toBe(2);
      expect(mockEventStore.getEvents().length).toBe(2);
      
      // Verify events were transformed to the current schema version if needed
      const storedEvents = mockEventStore.getEvents();
      const storedV1Event = storedEvents.find(e => e.eventId === v1Event.eventId);
      const storedV2Event = storedEvents.find(e => e.eventId === v2Event.eventId);
      
      // Both should have the same structure in storage (latest schema)
      expect(Object.keys(storedV1Event.data)).toEqual(Object.keys(storedV2Event.data));
      
      // V1 event should have been upgraded to include new fields from V2
      expect(storedV1Event.data.claimType).toBeDefined();
      expect(storedV1Event.data.documentReferences).toBeDefined();
    });

    it('should handle schema validation failures gracefully', async () => {
      // Configure processor for normal operation
      mockEventProcessor.configure({
        failureRate: 0.0, // Always succeed
        errorTypes: [],
      });

      // Create an event with invalid schema (missing required fields)
      const invalidEvent = {
        eventId: 'invalid-event-' + Date.now(),
        eventType: EventTypes.HEALTH_METRIC_RECORDED,
        timestamp: new Date().toISOString(),
        userId: 'test-user-31',
        // Missing required 'data' field with metric information
      };

      // Send invalid event
      await kafkaProducer.produce({
        topic: 'health-events',
        messages: [
          {
            key: invalidEvent.eventId,
            value: JSON.stringify(invalidEvent),
            headers: {
              'correlation-id': CorrelationIdGenerator.generate(),
            },
          },
        ],
      });

      // Wait for event to be processed and sent to DLQ
      await waitForEvent(() => dlqService.getMessageCount('dlq-health-events') > 0, 5000);

      // Verify event was sent to DLQ with validation error
      const dlqMessages = await dlqService.readMessages('dlq-health-events', 1);
      expect(dlqMessages.length).toBe(1);
      
      const dlqMessage = dlqMessages[0];
      expect(dlqMessage.originalEvent).toEqual(invalidEvent);
      expect(dlqMessage.error.code).toBe('SCHEMA_VALIDATION_ERROR');
      expect(dlqMessage.error.message).toContain('required property');
    });
  });
});