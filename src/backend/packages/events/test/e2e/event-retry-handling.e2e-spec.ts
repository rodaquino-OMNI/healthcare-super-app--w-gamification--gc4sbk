/**
 * End-to-end tests for event retry mechanisms and error handling
 * 
 * This test suite validates the reliability of the event processing pipeline,
 * focusing on retry mechanisms, dead letter queues, event audit logging,
 * and error recovery procedures.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../../src/events.module';
import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';
import { DLQService } from '../../src/errors/dlq';
import { RetryPolicyService } from '../../src/errors/retry-policies';
import { EventAuditService } from '../../src/utils/event-tracing';
import { IBaseEvent } from '../../src/interfaces/base-event.interface';
import { IKafkaEvent } from '../../src/interfaces/kafka-event.interface';
import { IEventResponse } from '../../src/interfaces/event-response.interface';
import { EventProcessingError } from '../../src/errors/event-errors';
import { randomUUID } from 'crypto';
import {
  createTestEnvironment,
  createTestConsumer,
  publishTestEvent,
  waitForEvent,
  waitForEvents,
  createJourneyEventFactories,
  assertEventsEqual,
  waitForCondition,
  retry,
  createMockEventHandler,
  TestEnvironment
} from './test-helpers';

describe('Event Retry Handling (E2E)', () => {
  let testEnv: TestEnvironment;
  let kafkaService: KafkaService;
  let kafkaProducer: KafkaProducer;
  let dlqService: DLQService;
  let retryPolicyService: RetryPolicyService;
  let eventAuditService: EventAuditService;
  let eventFactories: ReturnType<typeof createJourneyEventFactories>;
  
  // Test topics
  const MAIN_TOPIC = 'test-events';
  const RETRY_TOPIC = 'test-events-retry';
  const DLQ_TOPIC = 'test-events-dlq';
  const AUDIT_TOPIC = 'test-events-audit';
  
  // Setup before all tests
  beforeAll(async () => {
    // Create test environment
    testEnv = await createTestEnvironment({
      useRealKafka: false, // Use mock Kafka for faster tests
      seedDatabase: true,
      envVars: {
        KAFKA_RETRY_TOPIC: RETRY_TOPIC,
        KAFKA_DLQ_TOPIC: DLQ_TOPIC,
        KAFKA_AUDIT_TOPIC: AUDIT_TOPIC,
        MAX_RETRY_ATTEMPTS: '3',
        INITIAL_RETRY_DELAY: '100', // 100ms for faster tests
        MAX_RETRY_DELAY: '1000',    // 1s for faster tests
      },
    });
    
    // Get required services
    kafkaService = testEnv.kafkaService;
    kafkaProducer = testEnv.kafkaProducer;
    dlqService = testEnv.moduleRef.get<DLQService>(DLQService);
    retryPolicyService = testEnv.moduleRef.get<RetryPolicyService>(RetryPolicyService);
    eventAuditService = testEnv.moduleRef.get<EventAuditService>(EventAuditService);
    
    // Create event factories
    eventFactories = createJourneyEventFactories();
  });
  
  // Cleanup after all tests
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  describe('Dead Letter Queue Functionality', () => {
    let mainConsumer: KafkaConsumer;
    let dlqConsumer: KafkaConsumer;
    
    beforeEach(async () => {
      // Create consumers for main and DLQ topics
      mainConsumer = await createTestConsumer(kafkaService, MAIN_TOPIC);
      dlqConsumer = await createTestConsumer(kafkaService, DLQ_TOPIC);
    });
    
    afterEach(async () => {
      // Disconnect consumers
      await mainConsumer.disconnect();
      await dlqConsumer.disconnect();
    });
    
    it('should move events to DLQ after maximum retry attempts', async () => {
      // Create a test event
      const testEvent = eventFactories.health.metricRecorded({
        eventId: randomUUID(),
      });
      
      // Create a failing event handler that always throws an error
      const failingHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async () => {
          throw new EventProcessingError(
            'Simulated processing error',
            testEvent,
            { retryable: true }
          );
        }
      );
      
      // Register the failing handler
      mainConsumer.registerHandler(failingHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for the event to appear in the DLQ after retries
      const dlqEvent = await waitForEvent<IBaseEvent>(
        dlqConsumer,
        (event) => event.eventId === testEvent.eventId,
        10000 // Allow time for retries
      );
      
      // Verify the event was moved to DLQ
      expect(dlqEvent).not.toBeNull();
      expect(dlqEvent?.eventId).toBe(testEvent.eventId);
      
      // Verify the event has retry metadata
      expect(dlqEvent?.metadata?.retries).toBeDefined();
      expect(dlqEvent?.metadata?.retries?.attempts).toBeGreaterThanOrEqual(3); // MAX_RETRY_ATTEMPTS
      expect(dlqEvent?.metadata?.retries?.errors).toHaveLength(dlqEvent?.metadata?.retries?.attempts || 0);
      expect(dlqEvent?.metadata?.retries?.lastError).toContain('Simulated processing error');
    });
    
    it('should immediately move non-retryable events to DLQ', async () => {
      // Create a test event
      const testEvent = eventFactories.health.metricRecorded({
        eventId: randomUUID(),
      });
      
      // Create a failing event handler that throws a non-retryable error
      const failingHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async () => {
          throw new EventProcessingError(
            'Non-retryable error',
            testEvent,
            { retryable: false }
          );
        }
      );
      
      // Register the failing handler
      mainConsumer.registerHandler(failingHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for the event to appear in the DLQ immediately (no retries)
      const dlqEvent = await waitForEvent<IBaseEvent>(
        dlqConsumer,
        (event) => event.eventId === testEvent.eventId,
        5000
      );
      
      // Verify the event was moved to DLQ
      expect(dlqEvent).not.toBeNull();
      expect(dlqEvent?.eventId).toBe(testEvent.eventId);
      
      // Verify the event has no retry attempts
      expect(dlqEvent?.metadata?.retries?.attempts).toBe(1);
      expect(dlqEvent?.metadata?.retries?.errors).toHaveLength(1);
      expect(dlqEvent?.metadata?.retries?.lastError).toContain('Non-retryable error');
    });
    
    it('should include original event data and error context in DLQ events', async () => {
      // Create a test event with specific payload
      const testEvent = eventFactories.care.appointmentBooked({
        eventId: randomUUID(),
        payload: {
          userId: 'test-user-id',
          appointmentId: 'test-appointment-id',
          providerId: 'test-provider-id',
          specialtyId: 'test-specialty-id',
          scheduledAt: new Date().toISOString(),
          bookedAt: new Date().toISOString(),
        },
      });
      
      // Create a failing event handler with detailed error
      const failingHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async () => {
          throw new EventProcessingError(
            'Validation error in appointment data',
            testEvent,
            { 
              retryable: false,
              context: {
                field: 'scheduledAt',
                reason: 'Appointment time is in the past',
                severity: 'ERROR'
              }
            }
          );
        }
      );
      
      // Register the failing handler
      mainConsumer.registerHandler(failingHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for the event to appear in the DLQ
      const dlqEvent = await waitForEvent<IBaseEvent>(
        dlqConsumer,
        (event) => event.eventId === testEvent.eventId,
        5000
      );
      
      // Verify the event was moved to DLQ with all original data
      expect(dlqEvent).not.toBeNull();
      expect(dlqEvent?.eventId).toBe(testEvent.eventId);
      expect(dlqEvent?.type).toBe(testEvent.type);
      expect(dlqEvent?.journey).toBe(testEvent.journey);
      expect(dlqEvent?.payload).toEqual(testEvent.payload);
      
      // Verify error context is included
      expect(dlqEvent?.metadata?.error?.message).toContain('Validation error in appointment data');
      expect(dlqEvent?.metadata?.error?.context?.field).toBe('scheduledAt');
      expect(dlqEvent?.metadata?.error?.context?.reason).toBe('Appointment time is in the past');
      expect(dlqEvent?.metadata?.error?.context?.severity).toBe('ERROR');
    });
  });
  
  describe('Retry Mechanisms with Exponential Backoff', () => {
    let mainConsumer: KafkaConsumer;
    let retryConsumer: KafkaConsumer;
    
    beforeEach(async () => {
      // Create consumers for main and retry topics
      mainConsumer = await createTestConsumer(kafkaService, MAIN_TOPIC);
      retryConsumer = await createTestConsumer(kafkaService, RETRY_TOPIC);
    });
    
    afterEach(async () => {
      // Disconnect consumers
      await mainConsumer.disconnect();
      await retryConsumer.disconnect();
    });
    
    it('should retry failed events with increasing delays', async () => {
      // Create a test event
      const testEvent = eventFactories.health.metricRecorded({
        eventId: randomUUID(),
      });
      
      // Create a failing event handler
      const failingHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async () => {
          throw new EventProcessingError(
            'Temporary processing error',
            testEvent,
            { retryable: true }
          );
        }
      );
      
      // Register the failing handler
      mainConsumer.registerHandler(failingHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for retry events
      const retryEvents = await waitForEvents<IBaseEvent>(
        retryConsumer,
        (event) => event.eventId === testEvent.eventId,
        3, // Expect 3 retry attempts
        10000 // Allow time for retries with backoff
      );
      
      // Verify retry attempts
      expect(retryEvents.length).toBeGreaterThanOrEqual(1);
      
      // Verify increasing retry delays
      if (retryEvents.length >= 2) {
        const retryDelays: number[] = [];
        
        for (let i = 0; i < retryEvents.length; i++) {
          const retryEvent = retryEvents[i];
          expect(retryEvent.metadata?.retries?.attempts).toBe(i + 1);
          
          if (i > 0) {
            const prevTimestamp = new Date(retryEvents[i-1].timestamp).getTime();
            const currTimestamp = new Date(retryEvent.timestamp).getTime();
            const delay = currTimestamp - prevTimestamp;
            retryDelays.push(delay);
          }
        }
        
        // Verify exponential backoff (each delay should be greater than the previous)
        for (let i = 1; i < retryDelays.length; i++) {
          expect(retryDelays[i]).toBeGreaterThanOrEqual(retryDelays[i-1]);
        }
      }
    });
    
    it('should apply journey-specific retry policies', async () => {
      // Create test events for different journeys
      const healthEvent = eventFactories.health.metricRecorded({
        eventId: randomUUID(),
      });
      
      const careEvent = eventFactories.care.appointmentBooked({
        eventId: randomUUID(),
      });
      
      // Create failing handlers for each journey
      const healthHandler = createMockEventHandler<IBaseEvent>(
        healthEvent.type,
        async () => {
          throw new EventProcessingError(
            'Health journey error',
            healthEvent,
            { retryable: true }
          );
        }
      );
      
      const careHandler = createMockEventHandler<IBaseEvent>(
        careEvent.type,
        async () => {
          throw new EventProcessingError(
            'Care journey error',
            careEvent,
            { retryable: true }
          );
        }
      );
      
      // Register the handlers
      mainConsumer.registerHandler(healthHandler);
      mainConsumer.registerHandler(careHandler);
      
      // Publish the test events
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, healthEvent);
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, careEvent);
      
      // Wait for retry events
      const healthRetryEvents = await waitForEvents<IBaseEvent>(
        retryConsumer,
        (event) => event.eventId === healthEvent.eventId,
        2,
        10000
      );
      
      const careRetryEvents = await waitForEvents<IBaseEvent>(
        retryConsumer,
        (event) => event.eventId === careEvent.eventId,
        2,
        10000
      );
      
      // Verify journey-specific retry metadata
      expect(healthRetryEvents[0].metadata?.retries?.policy).toBe('health');
      expect(careRetryEvents[0].metadata?.retries?.policy).toBe('care');
      
      // Different journeys may have different retry configurations
      // This is a simplified test - in a real system, you might have different
      // max attempts or backoff strategies for different journeys
    });
    
    it('should respect maximum retry attempts configuration', async () => {
      // Create a test event
      const testEvent = eventFactories.plan.claimSubmitted({
        eventId: randomUUID(),
      });
      
      // Create a failing event handler
      const failingHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async () => {
          throw new EventProcessingError(
            'Persistent error',
            testEvent,
            { retryable: true }
          );
        }
      );
      
      // Register the failing handler
      mainConsumer.registerHandler(failingHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for retry events
      const retryEvents = await waitForEvents<IBaseEvent>(
        retryConsumer,
        (event) => event.eventId === testEvent.eventId,
        3, // MAX_RETRY_ATTEMPTS
        10000
      );
      
      // Verify retry attempts
      expect(retryEvents.length).toBeLessThanOrEqual(3); // Should not exceed MAX_RETRY_ATTEMPTS
      
      // The last retry event should have the maximum attempt count
      if (retryEvents.length > 0) {
        const lastRetryEvent = retryEvents[retryEvents.length - 1];
        expect(lastRetryEvent.metadata?.retries?.attempts).toBeLessThanOrEqual(3);
      }
    });
  });
  
  describe('Event Audit and Logging', () => {
    let mainConsumer: KafkaConsumer;
    let auditConsumer: KafkaConsumer;
    
    beforeEach(async () => {
      // Create consumers for main and audit topics
      mainConsumer = await createTestConsumer(kafkaService, MAIN_TOPIC);
      auditConsumer = await createTestConsumer(kafkaService, AUDIT_TOPIC);
    });
    
    afterEach(async () => {
      // Disconnect consumers
      await mainConsumer.disconnect();
      await auditConsumer.disconnect();
    });
    
    it('should log all event processing attempts to the audit topic', async () => {
      // Create a test event
      const testEvent = eventFactories.health.metricRecorded({
        eventId: randomUUID(),
      });
      
      // Create a successful event handler
      const successHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async (event) => {
          return { success: true, event };
        }
      );
      
      // Register the handler
      mainConsumer.registerHandler(successHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for audit event
      const auditEvent = await waitForEvent<any>(
        auditConsumer,
        (event) => event.eventId === testEvent.eventId && event.type === 'audit.event.processed',
        5000
      );
      
      // Verify audit event
      expect(auditEvent).not.toBeNull();
      expect(auditEvent?.originalEvent?.eventId).toBe(testEvent.eventId);
      expect(auditEvent?.originalEvent?.type).toBe(testEvent.type);
      expect(auditEvent?.status).toBe('SUCCESS');
      expect(auditEvent?.processingTime).toBeGreaterThan(0);
      expect(auditEvent?.timestamp).toBeDefined();
    });
    
    it('should log failed event processing attempts with error details', async () => {
      // Create a test event
      const testEvent = eventFactories.care.medicationTaken({
        eventId: randomUUID(),
      });
      
      // Create a failing event handler
      const failingHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async () => {
          throw new EventProcessingError(
            'Medication validation failed',
            testEvent,
            { 
              retryable: true,
              context: {
                field: 'dosage',
                reason: 'Invalid dosage format',
              }
            }
          );
        }
      );
      
      // Register the handler
      mainConsumer.registerHandler(failingHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for audit event
      const auditEvent = await waitForEvent<any>(
        auditConsumer,
        (event) => 
          event.eventId !== testEvent.eventId && // Audit event has its own ID
          event.originalEvent?.eventId === testEvent.eventId && 
          event.type === 'audit.event.failed',
        5000
      );
      
      // Verify audit event
      expect(auditEvent).not.toBeNull();
      expect(auditEvent?.originalEvent?.eventId).toBe(testEvent.eventId);
      expect(auditEvent?.originalEvent?.type).toBe(testEvent.type);
      expect(auditEvent?.status).toBe('FAILED');
      expect(auditEvent?.error?.message).toContain('Medication validation failed');
      expect(auditEvent?.error?.context?.field).toBe('dosage');
      expect(auditEvent?.error?.context?.reason).toBe('Invalid dosage format');
      expect(auditEvent?.processingTime).toBeGreaterThan(0);
      expect(auditEvent?.timestamp).toBeDefined();
      expect(auditEvent?.retryScheduled).toBe(true);
    });
    
    it('should log retry attempts with attempt count and delay information', async () => {
      // Create a test event
      const testEvent = eventFactories.plan.benefitUtilized({
        eventId: randomUUID(),
      });
      
      // Create a failing event handler
      const failingHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async () => {
          throw new EventProcessingError(
            'Temporary benefit processing error',
            testEvent,
            { retryable: true }
          );
        }
      );
      
      // Register the handler
      mainConsumer.registerHandler(failingHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for retry audit events
      const auditEvents = await waitForEvents<any>(
        auditConsumer,
        (event) => 
          event.originalEvent?.eventId === testEvent.eventId && 
          (event.type === 'audit.event.failed' || event.type === 'audit.event.retry'),
        3, // Expect initial failure + retry attempts
        10000
      );
      
      // Verify audit events
      expect(auditEvents.length).toBeGreaterThanOrEqual(2); // At least initial failure + first retry
      
      // First event should be the initial failure
      expect(auditEvents[0].type).toBe('audit.event.failed');
      expect(auditEvents[0].retryScheduled).toBe(true);
      
      // Subsequent events should be retries
      for (let i = 1; i < auditEvents.length; i++) {
        const retryAudit = auditEvents[i];
        expect(retryAudit.type).toBe('audit.event.retry');
        expect(retryAudit.retryAttempt).toBe(i);
        expect(retryAudit.originalEvent.eventId).toBe(testEvent.eventId);
        expect(retryAudit.originalEvent.type).toBe(testEvent.type);
        
        if (i < auditEvents.length - 1) {
          expect(retryAudit.retryScheduled).toBe(true);
          expect(retryAudit.nextRetryDelay).toBeGreaterThan(0);
        }
      }
    });
  });
  
  describe('Automatic Recovery After Failures', () => {
    let mainConsumer: KafkaConsumer;
    let retryConsumer: KafkaConsumer;
    let dlqConsumer: KafkaConsumer;
    
    beforeEach(async () => {
      // Create consumers for all topics
      mainConsumer = await createTestConsumer(kafkaService, MAIN_TOPIC);
      retryConsumer = await createTestConsumer(kafkaService, RETRY_TOPIC);
      dlqConsumer = await createTestConsumer(kafkaService, DLQ_TOPIC);
    });
    
    afterEach(async () => {
      // Disconnect consumers
      await mainConsumer.disconnect();
      await retryConsumer.disconnect();
      await dlqConsumer.disconnect();
    });
    
    it('should successfully process an event after transient failures', async () => {
      // Create a test event
      const testEvent = eventFactories.health.goalAchieved({
        eventId: randomUUID(),
      });
      
      // Create a handler that fails twice then succeeds
      let attemptCount = 0;
      const recoveringHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async (event) => {
          attemptCount++;
          
          if (attemptCount <= 2) {
            throw new EventProcessingError(
              `Transient error (attempt ${attemptCount})`,
              event,
              { retryable: true }
            );
          }
          
          // Success on third attempt
          return { success: true, event };
        }
      );
      
      // Register the handler
      mainConsumer.registerHandler(recoveringHandler);
      retryConsumer.registerHandler(recoveringHandler); // Also handle retries
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Wait for the handler to be called enough times
      await waitForCondition(
        () => attemptCount >= 3,
        10000 // Allow time for retries
      );
      
      // Verify the handler was called multiple times
      expect(attemptCount).toBeGreaterThanOrEqual(3);
      expect(recoveringHandler.handle).toHaveBeenCalledTimes(attemptCount);
      
      // Verify the event was not sent to DLQ
      const dlqEvent = await waitForEvent<IBaseEvent>(
        dlqConsumer,
        (event) => event.eventId === testEvent.eventId,
        2000 // Short timeout as we don't expect this event
      );
      
      expect(dlqEvent).toBeNull(); // Should not be in DLQ
    });
    
    it('should recover from broker outages and process backlogged events', async () => {
      // This test simulates a broker outage by disconnecting and reconnecting the consumer
      
      // Create test events
      const testEvents = [
        eventFactories.health.metricRecorded({ eventId: randomUUID() }),
        eventFactories.health.metricRecorded({ eventId: randomUUID() }),
        eventFactories.health.metricRecorded({ eventId: randomUUID() }),
      ];
      
      // Create a handler that tracks processed events
      const processedEvents: string[] = [];
      const trackingHandler = createMockEventHandler<IBaseEvent>(
        testEvents[0].type,
        async (event) => {
          processedEvents.push(event.eventId);
          return { success: true, event };
        }
      );
      
      // Register the handler
      mainConsumer.registerHandler(trackingHandler);
      
      // Simulate broker outage by disconnecting the consumer
      await mainConsumer.disconnect();
      
      // Publish events during the "outage"
      for (const event of testEvents) {
        await publishTestEvent(kafkaProducer, MAIN_TOPIC, event);
      }
      
      // Wait a moment to ensure events are published
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reconnect the consumer (recovery)
      await mainConsumer.connect();
      
      // Wait for all events to be processed
      await waitForCondition(
        () => processedEvents.length === testEvents.length,
        10000
      );
      
      // Verify all events were processed
      expect(processedEvents).toHaveLength(testEvents.length);
      for (const event of testEvents) {
        expect(processedEvents).toContain(event.eventId);
      }
    });
    
    it('should handle service restarts during event processing', async () => {
      // This test simulates a service restart by recreating the consumer
      
      // Create a test event
      const testEvent = eventFactories.care.appointmentBooked({
        eventId: randomUUID(),
      });
      
      // Create a handler that tracks processed events
      const processedEvents: string[] = [];
      const trackingHandler = createMockEventHandler<IBaseEvent>(
        testEvent.type,
        async (event) => {
          processedEvents.push(event.eventId);
          return { success: true, event };
        }
      );
      
      // Register the handler
      mainConsumer.registerHandler(trackingHandler);
      
      // Publish the test event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, testEvent);
      
      // Simulate service restart by disconnecting and recreating the consumer
      await mainConsumer.disconnect();
      
      // Create a new consumer with the same group ID to simulate restart
      const newConsumer = await createTestConsumer(
        kafkaService,
        MAIN_TOPIC,
        mainConsumer.getGroupId() // Use same group ID for offset continuity
      );
      
      // Register the same handler
      newConsumer.registerHandler(trackingHandler);
      
      // Wait for the event to be processed
      await waitForCondition(
        () => processedEvents.includes(testEvent.eventId),
        10000
      );
      
      // Verify the event was processed
      expect(processedEvents).toContain(testEvent.eventId);
      
      // Clean up
      await newConsumer.disconnect();
    });
  });
  
  describe('Event Schema Versioning and Compatibility', () => {
    let mainConsumer: KafkaConsumer;
    
    beforeEach(async () => {
      // Create consumer for main topic
      mainConsumer = await createTestConsumer(kafkaService, MAIN_TOPIC);
    });
    
    afterEach(async () => {
      // Disconnect consumer
      await mainConsumer.disconnect();
    });
    
    it('should handle events with different schema versions', async () => {
      // Create events with different versions
      const v1Event = eventFactories.health.metricRecorded({
        eventId: randomUUID(),
        version: '1.0.0',
        // v1 schema
        payload: {
          userId: 'test-user-id',
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual',
        },
      });
      
      const v2Event = eventFactories.health.metricRecorded({
        eventId: randomUUID(),
        version: '2.0.0',
        // v2 schema with additional fields
        payload: {
          userId: 'test-user-id',
          metricType: 'HEART_RATE',
          value: 80,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual',
          deviceId: 'test-device-id', // New in v2
          accuracy: 0.95, // New in v2
        },
      });
      
      // Create a handler that can process both versions
      const processedEvents: IBaseEvent[] = [];
      const versionCompatibleHandler = createMockEventHandler<IBaseEvent>(
        v1Event.type,
        async (event) => {
          processedEvents.push(event);
          return { success: true, event };
        }
      );
      
      // Register the handler
      mainConsumer.registerHandler(versionCompatibleHandler);
      
      // Publish both events
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, v1Event);
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, v2Event);
      
      // Wait for both events to be processed
      await waitForCondition(
        () => processedEvents.length === 2,
        10000
      );
      
      // Verify both events were processed
      expect(processedEvents).toHaveLength(2);
      
      // Find the processed events by ID
      const processedV1 = processedEvents.find(e => e.eventId === v1Event.eventId);
      const processedV2 = processedEvents.find(e => e.eventId === v2Event.eventId);
      
      // Verify event versions were preserved
      expect(processedV1?.version).toBe('1.0.0');
      expect(processedV2?.version).toBe('2.0.0');
      
      // Verify payloads were preserved
      expect(processedV1?.payload).toEqual(v1Event.payload);
      expect(processedV2?.payload).toEqual(v2Event.payload);
    });
    
    it('should transform events to the latest schema version when needed', async () => {
      // Create an old version event
      const oldVersionEvent = eventFactories.care.medicationTaken({
        eventId: randomUUID(),
        version: '1.0.0',
        // Old schema
        payload: {
          userId: 'test-user-id',
          medicationId: 'test-medication-id',
          takenAt: new Date().toISOString(),
          // Missing scheduledAt and dosage fields that are in newer versions
        },
      });
      
      // Create a handler that expects the latest schema version
      const processedEvents: IBaseEvent[] = [];
      const latestVersionHandler = createMockEventHandler<IBaseEvent>(
        oldVersionEvent.type,
        async (event) => {
          // This handler expects the latest schema with all fields
          // The event should be transformed before reaching here
          processedEvents.push(event);
          
          // Verify the event has been transformed to include required fields
          if (!event.payload.scheduledAt || !event.payload.dosage) {
            throw new Error('Event not transformed to latest schema');
          }
          
          return { success: true, event };
        }
      );
      
      // Register the handler
      mainConsumer.registerHandler(latestVersionHandler);
      
      // Publish the old version event
      await publishTestEvent(kafkaProducer, MAIN_TOPIC, oldVersionEvent);
      
      // Wait for the event to be processed
      await waitForCondition(
        () => processedEvents.length === 1,
        10000
      );
      
      // Verify the event was processed
      expect(processedEvents).toHaveLength(1);
      
      // Verify the event was transformed
      const processedEvent = processedEvents[0];
      expect(processedEvent.eventId).toBe(oldVersionEvent.eventId);
      expect(processedEvent.payload.userId).toBe(oldVersionEvent.payload.userId);
      expect(processedEvent.payload.medicationId).toBe(oldVersionEvent.payload.medicationId);
      expect(processedEvent.payload.takenAt).toBe(oldVersionEvent.payload.takenAt);
      
      // These fields should have been added during transformation
      expect(processedEvent.payload.scheduledAt).toBeDefined();
      expect(processedEvent.payload.dosage).toBeDefined();
      
      // The version should be updated to indicate transformation
      expect(processedEvent.metadata?.originalVersion).toBe('1.0.0');
      expect(processedEvent.version).not.toBe('1.0.0');
    });
  });
  
  describe('Message Order Preservation During Retries', () => {
    let mainConsumer: KafkaConsumer;
    let retryConsumer: KafkaConsumer;
    
    beforeEach(async () => {
      // Create consumers for main and retry topics
      mainConsumer = await createTestConsumer(kafkaService, MAIN_TOPIC);
      retryConsumer = await createTestConsumer(kafkaService, RETRY_TOPIC);
    });
    
    afterEach(async () => {
      // Disconnect consumers
      await mainConsumer.disconnect();
      await retryConsumer.disconnect();
    });
    
    it('should preserve message order for related events during retries', async () => {
      // Create a sequence of related events with the same correlation ID
      const correlationId = randomUUID();
      const sequenceEvents = [
        eventFactories.care.appointmentBooked({
          eventId: randomUUID(),
          metadata: { correlationId, sequence: 1 },
        }),
        eventFactories.care.appointmentBooked({
          eventId: randomUUID(),
          metadata: { correlationId, sequence: 2 },
          type: 'care.appointment.checked-in', // Different event type in same sequence
        }),
        eventFactories.care.appointmentBooked({
          eventId: randomUUID(),
          metadata: { correlationId, sequence: 3 },
          type: 'care.appointment.completed', // Different event type in same sequence
        }),
      ];
      
      // Create a handler that fails for the first event but succeeds for others
      const processedEvents: IBaseEvent[] = [];
      const orderingHandler = createMockEventHandler<IBaseEvent>(
        'care.appointment.*', // Handle all appointment events
        async (event) => {
          // Fail only for the first event on first attempt
          if (
            event.metadata?.sequence === 1 && 
            !event.metadata?.retries?.attempts
          ) {
            throw new EventProcessingError(
              'First event processing error',
              event,
              { retryable: true }
            );
          }
          
          // Record the processing order
          processedEvents.push(event);
          return { success: true, event };
        }
      );
      
      // Register the handler for both main and retry topics
      mainConsumer.registerHandler(orderingHandler);
      retryConsumer.registerHandler(orderingHandler);
      
      // Publish all events in sequence
      for (const event of sequenceEvents) {
        await publishTestEvent(kafkaProducer, MAIN_TOPIC, event);
      }
      
      // Wait for all events to be processed
      await waitForCondition(
        () => processedEvents.length === sequenceEvents.length,
        10000
      );
      
      // Verify all events were processed
      expect(processedEvents).toHaveLength(sequenceEvents.length);
      
      // Verify the events were processed in the correct order
      // (by sequence number, regardless of retry status)
      const sequences = processedEvents.map(e => e.metadata?.sequence);
      expect(sequences).toEqual([1, 2, 3]);
    });
    
    it('should handle concurrent processing of unrelated events during retries', async () => {
      // Create unrelated events from different users/contexts
      const events = [
        eventFactories.health.metricRecorded({
          eventId: randomUUID(),
          payload: { userId: 'user-1', metricType: 'HEART_RATE', value: 75 },
        }),
        eventFactories.health.metricRecorded({
          eventId: randomUUID(),
          payload: { userId: 'user-2', metricType: 'HEART_RATE', value: 80 },
        }),
        eventFactories.health.metricRecorded({
          eventId: randomUUID(),
          payload: { userId: 'user-3', metricType: 'HEART_RATE', value: 85 },
        }),
      ];
      
      // Create a handler that fails for specific users
      const processedEvents: Record<string, IBaseEvent[]> = {
        'user-1': [],
        'user-2': [],
        'user-3': [],
      };
      
      const concurrentHandler = createMockEventHandler<IBaseEvent>(
        events[0].type,
        async (event) => {
          const userId = event.payload.userId;
          
          // Fail for user-2 on first attempt
          if (
            userId === 'user-2' && 
            !event.metadata?.retries?.attempts
          ) {
            throw new EventProcessingError(
              'User-2 processing error',
              event,
              { retryable: true }
            );
          }
          
          // Record the processing
          processedEvents[userId].push(event);
          return { success: true, event };
        }
      );
      
      // Register the handler for both main and retry topics
      mainConsumer.registerHandler(concurrentHandler);
      retryConsumer.registerHandler(concurrentHandler);
      
      // Publish all events
      for (const event of events) {
        await publishTestEvent(kafkaProducer, MAIN_TOPIC, event);
      }
      
      // Wait for all events to be processed
      await waitForCondition(
        () => 
          processedEvents['user-1'].length === 1 &&
          processedEvents['user-2'].length === 1 &&
          processedEvents['user-3'].length === 1,
        10000
      );
      
      // Verify all events were processed
      expect(processedEvents['user-1']).toHaveLength(1);
      expect(processedEvents['user-2']).toHaveLength(1);
      expect(processedEvents['user-3']).toHaveLength(1);
      
      // Verify user-2 event has retry metadata
      expect(processedEvents['user-2'][0].metadata?.retries?.attempts).toBeGreaterThanOrEqual(1);
      
      // Verify other users' events don't have retry metadata
      expect(processedEvents['user-1'][0].metadata?.retries?.attempts).toBeUndefined();
      expect(processedEvents['user-3'][0].metadata?.retries?.attempts).toBeUndefined();
    });
  });
});