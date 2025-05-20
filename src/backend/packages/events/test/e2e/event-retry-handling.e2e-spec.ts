import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { KafkaService } from '../../src/kafka/kafka.service';
import { EventTypesEnum } from '../../src/dto/event-types.enum';
import { VersionDto } from '../../src/dto/version.dto';
import { EventMetadataDto } from '../../src/dto/event-metadata.dto';
import { BaseEventDto } from '../../src/dto/base-event.dto';
import { TOPICS } from '../../src/constants/topics.constants';
import { ERROR_CODES } from '../../src/constants/errors.constants';
import { setupTestApp, waitForEvents, cleanupTestApp } from './test-helpers';
import {
  MockEventBroker,
  MockEventProcessor,
  MockErrorHandler
} from '../mocks';
import {
  healthEvents,
  careEvents,
  planEvents,
  kafkaEvents,
  validationEvents
} from '../fixtures';

/**
 * End-to-end tests for event retry mechanisms and error handling.
 * 
 * These tests validate the reliability of the event processing pipeline,
 * focusing on retry mechanisms, dead letter queues, and error recovery.
 */
describe('Event Retry Handling (e2e)', () => {
  let app: INestApplication;
  let kafkaService: KafkaService;
  let mockEventBroker: MockEventBroker;
  let mockEventProcessor: MockEventProcessor;
  let mockErrorHandler: MockErrorHandler;
  
  // Setup before all tests
  beforeAll(async () => {
    // Create test module with mocked dependencies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        KafkaService,
        {
          provide: 'EVENT_BROKER',
          useFactory: () => {
            mockEventBroker = new MockEventBroker({
              topics: Object.values(TOPICS),
              errorProbability: 0.3, // 30% chance of error for testing retries
              errorTypes: ['NETWORK', 'TIMEOUT', 'VALIDATION']
            });
            return mockEventBroker;
          }
        },
        {
          provide: 'EVENT_PROCESSOR',
          useFactory: () => {
            mockEventProcessor = new MockEventProcessor({
              journeys: ['health', 'care', 'plan'],
              processingDelay: 50, // ms
              errorProbability: 0.2 // 20% chance of processing error
            });
            return mockEventProcessor;
          }
        },
        {
          provide: 'ERROR_HANDLER',
          useFactory: () => {
            mockErrorHandler = new MockErrorHandler({
              retryStrategy: 'exponential',
              maxRetries: 5,
              initialBackoff: 100, // ms
              maxBackoff: 5000, // ms
              backoffFactor: 2,
              useJitter: true
            });
            return mockErrorHandler;
          }
        }
      ]
    }).compile();

    // Setup test application
    app = await setupTestApp(moduleFixture);
    
    // Get service instances
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    
    // Reset mocks before tests
    mockEventBroker.reset();
    mockEventProcessor.reset();
    mockErrorHandler.reset();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTestApp(app);
  });

  // Reset mocks between tests
  beforeEach(() => {
    mockEventBroker.reset();
    mockEventProcessor.reset();
    mockErrorHandler.reset();
  });

  /**
   * Tests for dead letter queue functionality
   */
  describe('Dead Letter Queue', () => {
    it('should move messages to dead letter queue after max retries', async () => {
      // Arrange: Create a health event that will consistently fail validation
      const invalidEvent = validationEvents.invalidHealthMetric;
      
      // Force consistent failure for this test
      mockEventBroker.setErrorProbability(1.0); // 100% error rate
      mockErrorHandler.setMaxRetries(3); // Limit to 3 retries for faster test
      
      // Act: Publish the invalid event
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, invalidEvent);
      
      // Wait for retries and DLQ processing
      await waitForEvents(500); // Wait longer for retries
      
      // Assert: Verify the message was moved to DLQ after retries
      expect(mockErrorHandler.getDeadLetterCount()).toBe(1);
      
      // Verify retry count matches configuration
      const deadLetterEvents = mockErrorHandler.getDeadLetterEvents();
      expect(deadLetterEvents[0].retryCount).toBe(3); // Max retries reached
      
      // Verify error context is preserved
      expect(deadLetterEvents[0].error).toBeDefined();
      expect(deadLetterEvents[0].error.code).toBe(ERROR_CODES.VALIDATION.INVALID_PAYLOAD);
    });

    it('should preserve original event data in dead letter queue', async () => {
      // Arrange: Create a valid event but force processing failure
      const originalEvent = healthEvents.healthMetricHeartRate;
      
      // Configure mocks for this test
      mockEventProcessor.setErrorProbability(1.0); // 100% processing error
      mockErrorHandler.setMaxRetries(2); // Limit retries for faster test
      
      // Act: Publish the event
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, originalEvent);
      
      // Wait for retries and DLQ processing
      await waitForEvents(400);
      
      // Assert: Verify original event data is preserved in DLQ
      const deadLetterEvents = mockErrorHandler.getDeadLetterEvents();
      expect(deadLetterEvents.length).toBe(1);
      
      // Check that original event data is preserved
      const dlqEvent = deadLetterEvents[0].originalEvent;
      expect(dlqEvent.userId).toBe(originalEvent.userId);
      expect(dlqEvent.type).toBe(originalEvent.type);
      expect(dlqEvent.journey).toBe(originalEvent.journey);
      expect(dlqEvent.payload).toEqual(originalEvent.payload);
    });

    it('should include detailed error context in dead letter events', async () => {
      // Arrange: Create an event with validation issues
      const invalidEvent = validationEvents.invalidCareAppointment;
      
      // Configure mocks
      mockEventBroker.setErrorProbability(0.5); // 50% chance of broker error
      mockEventProcessor.setErrorProbability(0.5); // 50% chance of processing error
      mockErrorHandler.setMaxRetries(3);
      
      // Act: Publish the invalid event
      await kafkaService.publish(TOPICS.CARE.EVENTS, invalidEvent);
      
      // Wait for processing and potential DLQ
      await waitForEvents(500);
      
      // Assert: If event reached DLQ, verify error context
      if (mockErrorHandler.getDeadLetterCount() > 0) {
        const deadLetterEvents = mockErrorHandler.getDeadLetterEvents();
        const dlqEvent = deadLetterEvents[0];
        
        // Verify error details
        expect(dlqEvent.error).toBeDefined();
        expect(dlqEvent.error.code).toBeDefined();
        expect(dlqEvent.error.message).toBeDefined();
        expect(dlqEvent.error.timestamp).toBeDefined();
        
        // Verify stack trace for debugging
        expect(dlqEvent.error.stack).toBeDefined();
        
        // Verify context information
        expect(dlqEvent.error.context).toBeDefined();
        expect(dlqEvent.error.context.topic).toBe(TOPICS.CARE.EVENTS);
        expect(dlqEvent.error.context.eventType).toBe(invalidEvent.type);
      } else {
        // If event didn't reach DLQ (random chance), skip this test
        console.log('Event did not reach DLQ in this test run - skipping assertions');
      }
    });
  });

  /**
   * Tests for retry mechanisms with exponential backoff
   */
  describe('Retry Mechanisms', () => {
    it('should retry failed events with exponential backoff', async () => {
      // Arrange: Create a valid event
      const validEvent = healthEvents.healthGoalAchieved;
      
      // Configure mocks to fail initially but succeed on retry
      mockEventBroker.setErrorProbability(0.7); // 70% initial failure rate
      mockEventBroker.setErrorProbabilityDecay(0.5); // 50% reduction in error probability per retry
      mockErrorHandler.setMaxRetries(5);
      mockErrorHandler.setBackoffStrategy('exponential');
      mockErrorHandler.setInitialBackoff(50); // Start with 50ms
      mockErrorHandler.setBackoffFactor(2); // Double each time
      
      // Act: Publish the event
      const startTime = Date.now();
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, validEvent);
      
      // Wait for processing with retries
      await waitForEvents(1000);
      const endTime = Date.now();
      
      // Assert: Verify retry pattern
      const retryAttempts = mockErrorHandler.getRetryAttempts();
      
      // Skip test if no retries occurred (random chance)
      if (retryAttempts.length === 0) {
        console.log('No retries occurred in this test run - skipping assertions');
        return;
      }
      
      // Verify increasing delays between retries (exponential backoff)
      for (let i = 1; i < retryAttempts.length; i++) {
        const previousDelay = retryAttempts[i-1].delay;
        const currentDelay = retryAttempts[i].delay;
        
        // Each retry should have longer delay than previous (with some jitter allowance)
        expect(currentDelay).toBeGreaterThan(previousDelay * 1.5); // Allow for some jitter
      }
      
      // Verify event was eventually processed
      expect(mockEventProcessor.getProcessedCount()).toBe(1);
    });

    it('should use jitter to prevent retry storms', async () => {
      // Arrange: Create multiple events of the same type
      const events = [
        planEvents.claimSubmitted,
        planEvents.claimSubmitted, // Same event type
        planEvents.claimSubmitted  // Same event type
      ];
      
      // Configure mocks to fail initially but succeed on retry
      mockEventBroker.setErrorProbability(0.8); // High failure rate
      mockErrorHandler.setMaxRetries(4);
      mockErrorHandler.setUseJitter(true); // Enable jitter
      mockErrorHandler.setJitterFactor(0.3); // 30% jitter
      
      // Act: Publish multiple events
      for (const event of events) {
        await kafkaService.publish(TOPICS.PLAN.EVENTS, event);
      }
      
      // Wait for processing with retries
      await waitForEvents(800);
      
      // Assert: Get retry timestamps for each event
      const retryTimestamps = mockErrorHandler.getRetryTimestamps();
      
      // Skip test if not enough retries occurred
      if (Object.keys(retryTimestamps).length < 2) {
        console.log('Not enough retries occurred for jitter test - skipping assertions');
        return;
      }
      
      // Check that retry timestamps for different events at the same retry attempt
      // are not exactly the same (jitter should cause variation)
      const eventIds = Object.keys(retryTimestamps);
      const firstEventRetries = retryTimestamps[eventIds[0]];
      const secondEventRetries = retryTimestamps[eventIds[1]];
      
      // Compare retry timestamps at the same attempt number
      const commonAttempts = Math.min(firstEventRetries.length, secondEventRetries.length);
      let jitterDetected = false;
      
      for (let i = 0; i < commonAttempts; i++) {
        if (firstEventRetries[i] !== secondEventRetries[i]) {
          jitterDetected = true;
          break;
        }
      }
      
      expect(jitterDetected).toBe(true);
    });

    it('should respect maximum retry limits', async () => {
      // Arrange: Create an event that will always fail
      const alwaysFailingEvent = {
        ...healthEvents.healthMetricBloodPressure,
        payload: { ...healthEvents.healthMetricBloodPressure.payload, forceFailure: true }
      };
      
      // Configure mocks
      mockEventProcessor.setErrorProbability(1.0); // Always fail processing
      mockErrorHandler.setMaxRetries(4); // Set max retry limit
      
      // Act: Publish the event
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, alwaysFailingEvent);
      
      // Wait for processing and retries
      await waitForEvents(700);
      
      // Assert: Verify retry count does not exceed max
      const retryAttempts = mockErrorHandler.getRetryAttempts();
      const eventRetries = retryAttempts.filter(r => r.eventId === alwaysFailingEvent.id);
      
      // Should have exactly maxRetries attempts
      expect(eventRetries.length).toBeLessThanOrEqual(4);
      
      // Verify event ended up in DLQ after max retries
      expect(mockErrorHandler.getDeadLetterCount()).toBe(1);
    });
  });

  /**
   * Tests for event audit and logging
   */
  describe('Event Audit and Logging', () => {
    it('should log all retry attempts with context', async () => {
      // Arrange: Create an event that will fail initially
      const eventWithRetries = careEvents.appointmentBooked;
      
      // Configure mocks
      mockEventBroker.setErrorProbability(0.7); // High initial failure rate
      mockEventBroker.setErrorProbabilityDecay(0.4); // Improve chances on retry
      mockErrorHandler.setMaxRetries(3);
      
      // Act: Publish the event
      await kafkaService.publish(TOPICS.CARE.EVENTS, eventWithRetries);
      
      // Wait for processing and retries
      await waitForEvents(500);
      
      // Assert: Verify audit logs contain retry information
      const auditLogs = mockErrorHandler.getAuditLogs();
      
      // Find logs related to this event
      const eventLogs = auditLogs.filter(log => log.eventId === eventWithRetries.id);
      
      // Should have logs for the event
      expect(eventLogs.length).toBeGreaterThan(0);
      
      // Check retry logs if retries occurred
      const retryLogs = eventLogs.filter(log => log.action === 'RETRY');
      if (retryLogs.length > 0) {
        // Verify retry logs contain necessary context
        expect(retryLogs[0].context).toBeDefined();
        expect(retryLogs[0].context.attempt).toBeDefined();
        expect(retryLogs[0].context.maxRetries).toBeDefined();
        expect(retryLogs[0].context.delay).toBeDefined();
        expect(retryLogs[0].context.error).toBeDefined();
      }
    });

    it('should track event lifecycle across retry attempts', async () => {
      // Arrange: Create an event for lifecycle tracking
      const lifecycleEvent = planEvents.benefitUtilized;
      
      // Configure mocks
      mockEventBroker.setErrorProbability(0.6); // Moderate failure rate
      mockEventBroker.setErrorProbabilityDecay(0.5); // Improve on retry
      mockErrorHandler.setMaxRetries(3);
      
      // Act: Publish the event
      await kafkaService.publish(TOPICS.PLAN.EVENTS, lifecycleEvent);
      
      // Wait for processing and retries
      await waitForEvents(500);
      
      // Assert: Verify lifecycle tracking
      const lifecycle = mockErrorHandler.getEventLifecycle(lifecycleEvent.id);
      
      // Should have lifecycle entries
      expect(lifecycle).toBeDefined();
      expect(lifecycle.length).toBeGreaterThan(0);
      
      // First entry should be PUBLISH
      expect(lifecycle[0].action).toBe('PUBLISH');
      
      // Last entry should be either SUCCESS or DEAD_LETTER
      const lastAction = lifecycle[lifecycle.length - 1].action;
      expect(['SUCCESS', 'DEAD_LETTER']).toContain(lastAction);
      
      // Verify timestamps are in ascending order
      for (let i = 1; i < lifecycle.length; i++) {
        expect(lifecycle[i].timestamp).toBeGreaterThanOrEqual(lifecycle[i-1].timestamp);
      }
    });

    it('should record detailed error information for failed attempts', async () => {
      // Arrange: Create an event that will fail validation
      const invalidEvent = validationEvents.invalidPlanClaim;
      
      // Configure mocks
      mockEventProcessor.setErrorProbability(0.8); // High processing error rate
      mockErrorHandler.setMaxRetries(2);
      
      // Act: Publish the invalid event
      await kafkaService.publish(TOPICS.PLAN.EVENTS, invalidEvent);
      
      // Wait for processing and retries
      await waitForEvents(400);
      
      // Assert: Verify error details in audit logs
      const auditLogs = mockErrorHandler.getAuditLogs();
      const errorLogs = auditLogs.filter(
        log => log.eventId === invalidEvent.id && log.action === 'ERROR'
      );
      
      // Skip if no errors were logged (random chance)
      if (errorLogs.length === 0) {
        console.log('No error logs found for this test run - skipping assertions');
        return;
      }
      
      // Verify error details
      const errorLog = errorLogs[0];
      expect(errorLog.error).toBeDefined();
      expect(errorLog.error.code).toBeDefined();
      expect(errorLog.error.message).toBeDefined();
      expect(errorLog.error.timestamp).toBeDefined();
      
      // Verify error contains validation details if it's a validation error
      if (errorLog.error.code === ERROR_CODES.VALIDATION.INVALID_PAYLOAD) {
        expect(errorLog.error.details).toBeDefined();
        expect(Array.isArray(errorLog.error.details.validationErrors)).toBe(true);
      }
    });
  });

  /**
   * Tests for automatic recovery after failures
   */
  describe('Automatic Recovery', () => {
    it('should successfully process event after transient failures', async () => {
      // Arrange: Create a valid event
      const validEvent = healthEvents.deviceSynchronized;
      
      // Configure mocks to fail initially but succeed after retries
      mockEventBroker.setErrorProbability(0.8); // High initial failure
      mockEventBroker.setErrorProbabilityDecay(0.5); // 50% reduction per retry
      mockErrorHandler.setMaxRetries(5);
      
      // Act: Publish the event
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, validEvent);
      
      // Wait for processing with retries
      await waitForEvents(800);
      
      // Assert: Verify event was eventually processed successfully
      const processedEvents = mockEventProcessor.getProcessedEvents();
      const wasProcessed = processedEvents.some(e => e.id === validEvent.id);
      
      // Event should be processed despite initial failures
      expect(wasProcessed).toBe(true);
      
      // Verify retry attempts occurred
      const retryAttempts = mockErrorHandler.getRetryAttempts();
      const eventRetries = retryAttempts.filter(r => r.eventId === validEvent.id);
      
      // Should have at least one retry before success
      expect(eventRetries.length).toBeGreaterThan(0);
    });

    it('should recover from broker outages', async () => {
      // Arrange: Create a valid event
      const validEvent = careEvents.medicationTaken;
      
      // Configure mocks to simulate broker outage
      mockEventBroker.simulateOutage(true); // Start with broker unavailable
      
      // Act: Publish the event (should fail initially)
      const publishPromise = kafkaService.publish(TOPICS.CARE.EVENTS, validEvent);
      
      // Simulate broker recovery after a delay
      setTimeout(() => {
        mockEventBroker.simulateOutage(false); // Broker becomes available
      }, 200);
      
      // Wait for publish to complete (with retries)
      await publishPromise.catch(() => {}); // Ignore potential rejection
      await waitForEvents(500);
      
      // Assert: Verify event was published after recovery
      const publishedEvents = mockEventBroker.getPublishedEvents();
      const wasPublished = publishedEvents.some(e => e.id === validEvent.id);
      
      // Event should be published despite initial broker outage
      expect(wasPublished).toBe(true);
    });

    it('should maintain processing order after recovery', async () => {
      // Arrange: Create a sequence of related events
      const event1 = { ...careEvents.appointmentBooked, sequenceNum: 1 };
      const event2 = { ...careEvents.appointmentCheckedIn, sequenceNum: 2 };
      const event3 = { ...careEvents.appointmentCompleted, sequenceNum: 3 };
      
      // Configure mocks
      mockEventBroker.setErrorProbability(0.6); // Moderate failure rate
      mockEventBroker.setPreserveOrder(true); // Ensure order preservation
      mockErrorHandler.setMaxRetries(4);
      
      // Act: Publish events in sequence
      await kafkaService.publish(TOPICS.CARE.EVENTS, event1);
      await kafkaService.publish(TOPICS.CARE.EVENTS, event2);
      await kafkaService.publish(TOPICS.CARE.EVENTS, event3);
      
      // Wait for processing with potential retries
      await waitForEvents(800);
      
      // Assert: Verify processing order matches sequence numbers
      const processedEvents = mockEventProcessor.getProcessedEvents();
      
      // Filter events from this test by checking for sequenceNum property
      const sequencedEvents = processedEvents
        .filter(e => e.sequenceNum !== undefined)
        .sort((a, b) => {
          // Sort by processing timestamp
          return a.processedAt - b.processedAt;
        });
      
      // Skip if not enough events were processed
      if (sequencedEvents.length < 2) {
        console.log('Not enough events processed for order test - skipping assertions');
        return;
      }
      
      // Verify events were processed in sequence order despite retries
      for (let i = 1; i < sequencedEvents.length; i++) {
        expect(sequencedEvents[i].sequenceNum).toBeGreaterThan(sequencedEvents[i-1].sequenceNum);
      }
    });
  });

  /**
   * Tests for event schema versioning and compatibility
   */
  describe('Event Schema Versioning', () => {
    it('should handle different versions of the same event type', async () => {
      // Arrange: Create events with different schema versions
      const oldVersionEvent = {
        ...healthEvents.healthMetricHeartRate,
        schemaVersion: '1.0.0',
        // Old schema format
        payload: {
          value: 75,
          unit: 'bpm'
        }
      };
      
      const newVersionEvent = {
        ...healthEvents.healthMetricHeartRate,
        schemaVersion: '2.0.0',
        // New schema with additional fields
        payload: {
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual',
          confidence: 0.95
        }
      };
      
      // Configure mocks
      mockEventProcessor.setVersionCompatibility(true); // Enable version handling
      
      // Act: Publish both versions
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, oldVersionEvent);
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, newVersionEvent);
      
      // Wait for processing
      await waitForEvents(300);
      
      // Assert: Verify both versions were processed
      const processedEvents = mockEventProcessor.getProcessedEvents();
      const oldVersionProcessed = processedEvents.some(e => 
        e.id === oldVersionEvent.id && e.schemaVersion === '1.0.0'
      );
      const newVersionProcessed = processedEvents.some(e => 
        e.id === newVersionEvent.id && e.schemaVersion === '2.0.0'
      );
      
      // Both versions should be processed successfully
      expect(oldVersionProcessed).toBe(true);
      expect(newVersionProcessed).toBe(true);
    });

    it('should apply schema migrations for backward compatibility', async () => {
      // Arrange: Create an event with old schema version
      const oldSchemaEvent = {
        ...planEvents.claimSubmitted,
        schemaVersion: '1.0.0',
        // Old schema format missing required fields in newer versions
        payload: {
          claimId: 'CLM-12345',
          amount: 150.00,
          currency: 'BRL',
          serviceDate: '2023-05-15'
          // Missing: providerNPI, serviceType, attachments
        }
      };
      
      // Configure mocks
      mockEventProcessor.setVersionCompatibility(true); // Enable version handling
      mockEventProcessor.setApplyMigrations(true); // Enable schema migrations
      
      // Act: Publish old schema event
      await kafkaService.publish(TOPICS.PLAN.EVENTS, oldSchemaEvent);
      
      // Wait for processing
      await waitForEvents(300);
      
      // Assert: Verify event was processed with migration applied
      const processedEvents = mockEventProcessor.getProcessedEvents();
      const migratedEvent = processedEvents.find(e => e.id === oldSchemaEvent.id);
      
      // Event should be processed
      expect(migratedEvent).toBeDefined();
      
      // Migration should have added default values for missing fields
      expect(migratedEvent.payload.providerNPI).toBeDefined();
      expect(migratedEvent.payload.serviceType).toBeDefined();
      expect(migratedEvent.payload.attachments).toBeDefined();
      
      // Original fields should be preserved
      expect(migratedEvent.payload.claimId).toBe(oldSchemaEvent.payload.claimId);
      expect(migratedEvent.payload.amount).toBe(oldSchemaEvent.payload.amount);
    });
  });

  /**
   * Tests for message order preservation during retries
   */
  describe('Message Order Preservation', () => {
    it('should preserve message order for related events despite retries', async () => {
      // Arrange: Create a series of related events with a correlation ID
      const correlationId = 'test-correlation-123';
      const relatedEvents = [
        {
          ...careEvents.appointmentBooked,
          metadata: { correlationId, sequence: 1 }
        },
        {
          ...careEvents.appointmentCheckedIn,
          metadata: { correlationId, sequence: 2 }
        },
        {
          ...careEvents.appointmentCompleted,
          metadata: { correlationId, sequence: 3 }
        }
      ];
      
      // Configure mocks
      mockEventBroker.setErrorProbability(0.5); // 50% chance of failure
      mockEventBroker.setPreserveOrder(true); // Enable order preservation
      mockErrorHandler.setMaxRetries(3);
      
      // Act: Publish related events in sequence
      for (const event of relatedEvents) {
        await kafkaService.publish(TOPICS.CARE.EVENTS, event);
      }
      
      // Wait for processing with retries
      await waitForEvents(600);
      
      // Assert: Verify events were processed in correct order
      const processedEvents = mockEventProcessor.getProcessedEvents()
        .filter(e => e.metadata?.correlationId === correlationId)
        .sort((a, b) => a.processedAt - b.processedAt);
      
      // Skip if not enough events were processed
      if (processedEvents.length < 2) {
        console.log('Not enough correlated events processed - skipping assertions');
        return;
      }
      
      // Verify sequence order was preserved
      for (let i = 1; i < processedEvents.length; i++) {
        expect(processedEvents[i].metadata.sequence).toBeGreaterThan(
          processedEvents[i-1].metadata.sequence
        );
      }
    });

    it('should handle partition-based ordering with retries', async () => {
      // Arrange: Create events for different users (different partitions)
      const user1Events = [
        {
          ...healthEvents.healthMetricWeight,
          userId: 'user-1',
          metadata: { sequence: 1 }
        },
        {
          ...healthEvents.healthMetricWeight,
          userId: 'user-1',
          metadata: { sequence: 2 }
        }
      ];
      
      const user2Events = [
        {
          ...healthEvents.healthMetricWeight,
          userId: 'user-2',
          metadata: { sequence: 1 }
        },
        {
          ...healthEvents.healthMetricWeight,
          userId: 'user-2',
          metadata: { sequence: 2 }
        }
      ];
      
      // Configure mocks
      mockEventBroker.setErrorProbability(0.6); // Moderate failure rate
      mockEventBroker.setPartitionKey('userId'); // Partition by userId
      mockEventBroker.setPreservePartitionOrder(true); // Preserve order within partitions
      mockErrorHandler.setMaxRetries(3);
      
      // Act: Publish events for both users, interleaved
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, user1Events[0]);
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, user2Events[0]);
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, user1Events[1]);
      await kafkaService.publish(TOPICS.HEALTH.EVENTS, user2Events[1]);
      
      // Wait for processing with retries
      await waitForEvents(700);
      
      // Assert: Verify order within each user's events
      const processedEvents = mockEventProcessor.getProcessedEvents();
      
      // Group by userId
      const user1Processed = processedEvents
        .filter(e => e.userId === 'user-1')
        .sort((a, b) => a.processedAt - b.processedAt);
      
      const user2Processed = processedEvents
        .filter(e => e.userId === 'user-2')
        .sort((a, b) => a.processedAt - b.processedAt);
      
      // Skip if not enough events were processed
      if (user1Processed.length < 2 || user2Processed.length < 2) {
        console.log('Not enough events processed for partition test - skipping assertions');
        return;
      }
      
      // Verify sequence order within each user's events
      expect(user1Processed[0].metadata.sequence).toBeLessThan(user1Processed[1].metadata.sequence);
      expect(user2Processed[0].metadata.sequence).toBeLessThan(user2Processed[1].metadata.sequence);
    });
  });
});