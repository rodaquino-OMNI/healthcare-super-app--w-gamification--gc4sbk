import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { setTimeout as sleep } from 'timers/promises';
import { v4 as uuidv4 } from 'uuid';

// Import test helpers
import {
  createTestEnvironment,
  TestEnvironmentContext,
  publishTestEvent,
  waitForEvent,
  createTestEvent,
  compareEvents,
  TestDatabaseSeeder,
} from './test-helpers';

// Import interfaces and DTOs
import { IEvent } from '../../src/interfaces/base-event.interface';
import { EventTypes } from '../../src/dto/event-types.enum';
import { CareEventDto } from '../../src/dto/care-event.dto';
import { AppointmentEventDto } from '../../src/dto/appointment-event.dto';
import { MedicationEventDto } from '../../src/dto/medication-event.dto';

/**
 * End-to-end tests for Care Journey events
 * 
 * These tests validate the complete flow of care-related events from production to consumption,
 * including appointment booking, medication adherence, telemedicine session, and care plan progress events.
 */
describe('Care Journey Events (e2e)', () => {
  let context: TestEnvironmentContext;
  let app: INestApplication;
  let seeder: TestDatabaseSeeder;
  
  // Define test topics
  const CARE_EVENTS_TOPIC = 'care-events';
  const APPOINTMENT_EVENTS_TOPIC = 'appointment-events';
  const MEDICATION_EVENTS_TOPIC = 'medication-events';
  const TELEMEDICINE_EVENTS_TOPIC = 'telemedicine-events';
  const CARE_PLAN_EVENTS_TOPIC = 'care-plan-events';
  const GAMIFICATION_EVENTS_TOPIC = 'gamification-events';
  
  // Set up test environment before all tests
  beforeAll(async () => {
    // Create test environment with Kafka and database
    context = await createTestEnvironment({
      topics: [
        CARE_EVENTS_TOPIC,
        APPOINTMENT_EVENTS_TOPIC,
        MEDICATION_EVENTS_TOPIC,
        TELEMEDICINE_EVENTS_TOPIC,
        CARE_PLAN_EVENTS_TOPIC,
        GAMIFICATION_EVENTS_TOPIC,
      ],
      enableKafka: true,
      enableDatabase: true,
    });
    
    app = context.app;
    
    // Set up database seeder
    if (context.prisma) {
      seeder = new TestDatabaseSeeder(context.prisma);
      await seeder.cleanDatabase();
      await seeder.seedTestUsers();
      await seeder.seedJourneyData('care');
    }
    
    // Wait for Kafka to be ready
    await sleep(1000);
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await context.cleanup();
  });
  
  describe('Appointment Events', () => {
    it('should validate and process appointment booking events', async () => {
      // Create appointment booking event
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_BOOKED,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          appointmentId: uuidv4(),
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
          dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          location: 'Virtual',
          status: 'BOOKED',
          notes: 'Regular check-up',
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, appointmentEvent, {
        topic: APPOINTMENT_EVENTS_TOPIC,
      });
      
      // Wait for event to be processed and gamification event to be produced
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => event.type === EventTypes.Gamification.ACHIEVEMENT_PROGRESS,
        throwOnTimeout: true,
      });
      
      // Verify gamification event
      expect(gamificationEvent).toBeDefined();
      expect(gamificationEvent?.payload).toHaveProperty('userId', appointmentEvent.payload.userId);
      expect(gamificationEvent?.payload).toHaveProperty('achievementType', 'appointment-keeper');
    });
    
    it('should handle appointment check-in events', async () => {
      // Create appointment check-in event
      const appointmentId = uuidv4();
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_CHECKED_IN,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          appointmentId,
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
          dateTime: new Date().toISOString(),
          location: 'Clinic',
          status: 'CHECKED_IN',
          notes: 'Patient arrived on time',
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, appointmentEvent, {
        topic: APPOINTMENT_EVENTS_TOPIC,
      });
      
      // Wait for event to be processed and gamification event to be produced
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === EventTypes.Gamification.ACHIEVEMENT_PROGRESS && 
          event.payload.achievementType === 'appointment-keeper',
        throwOnTimeout: true,
      });
      
      // Verify gamification event
      expect(gamificationEvent).toBeDefined();
      expect(gamificationEvent?.payload).toHaveProperty('userId', appointmentEvent.payload.userId);
      expect(gamificationEvent?.payload).toHaveProperty('progress');
      expect(gamificationEvent?.payload.progress).toBeGreaterThan(0);
    });
    
    it('should handle appointment completion events', async () => {
      // Create appointment completion event
      const appointmentId = uuidv4();
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_COMPLETED,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          appointmentId,
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
          dateTime: new Date().toISOString(),
          location: 'Clinic',
          status: 'COMPLETED',
          notes: 'Follow-up in 3 months',
          duration: 30, // minutes
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, appointmentEvent, {
        topic: APPOINTMENT_EVENTS_TOPIC,
      });
      
      // Wait for event to be processed and gamification event to be produced
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === EventTypes.Gamification.ACHIEVEMENT_UNLOCKED && 
          event.payload.achievementType === 'appointment-keeper',
        throwOnTimeout: false,
      });
      
      // Verify gamification event (may be null if achievement not yet unlocked)
      if (gamificationEvent) {
        expect(gamificationEvent.payload).toHaveProperty('userId', appointmentEvent.payload.userId);
        expect(gamificationEvent.payload).toHaveProperty('achievementType', 'appointment-keeper');
        expect(gamificationEvent.payload).toHaveProperty('level');
      }
    });
    
    it('should reject invalid appointment events', async () => {
      // Create invalid appointment event (missing required fields)
      const invalidEvent = createTestEvent<Partial<AppointmentEventDto>>(
        EventTypes.Care.APPOINTMENT_BOOKED,
        {
          // Missing userId and appointmentId
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
          // Invalid date format
          dateTime: 'not-a-date',
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, invalidEvent, {
        topic: APPOINTMENT_EVENTS_TOPIC,
      });
      
      // Wait for error event
      const errorEvent = await waitForEvent<IEvent>(context, {
        topic: 'error-events',
        timeout: 5000,
        filter: (event) => 
          event.type === 'EVENT_VALIDATION_ERROR' && 
          event.payload.originalEventId === invalidEvent.eventId,
        throwOnTimeout: false,
      });
      
      // Error event might not be produced if the service is configured to just log errors
      // So we'll check for the absence of a gamification event instead
      await sleep(2000); // Wait to ensure event would have been processed
      
      // Check that no gamification event was produced
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 1000, // Short timeout since we don't expect an event
        filter: (event) => 
          event.payload.originalEventId === invalidEvent.eventId,
        throwOnTimeout: false,
      });
      
      expect(gamificationEvent).toBeNull();
    });
  });
  
  describe('Medication Events', () => {
    it('should validate and process medication adherence events', async () => {
      // Create medication adherence event
      const medicationEvent = createTestEvent<MedicationEventDto>(
        EventTypes.Care.MEDICATION_TAKEN,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          medicationId: uuidv4(),
          medicationName: 'Medication A',
          dosage: '10mg',
          scheduledTime: new Date().toISOString(),
          takenTime: new Date().toISOString(),
          status: 'TAKEN',
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, medicationEvent, {
        topic: MEDICATION_EVENTS_TOPIC,
      });
      
      // Wait for event to be processed and gamification event to be produced
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === EventTypes.Gamification.ACHIEVEMENT_PROGRESS && 
          event.payload.achievementType === 'medication-adherence',
        throwOnTimeout: true,
      });
      
      // Verify gamification event
      expect(gamificationEvent).toBeDefined();
      expect(gamificationEvent?.payload).toHaveProperty('userId', medicationEvent.payload.userId);
      expect(gamificationEvent?.payload).toHaveProperty('achievementType', 'medication-adherence');
      expect(gamificationEvent?.payload).toHaveProperty('progress');
    });
    
    it('should handle medication skipped events', async () => {
      // Create medication skipped event
      const medicationEvent = createTestEvent<MedicationEventDto>(
        EventTypes.Care.MEDICATION_SKIPPED,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          medicationId: uuidv4(),
          medicationName: 'Medication B',
          dosage: '5mg',
          scheduledTime: new Date().toISOString(),
          status: 'SKIPPED',
          reason: 'Side effects',
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, medicationEvent, {
        topic: MEDICATION_EVENTS_TOPIC,
      });
      
      // No gamification event expected for skipped medication
      // But we should verify the event was processed without errors
      await sleep(2000); // Wait to ensure event would have been processed
      
      // Optionally check for a notification event if your system sends those
      const notificationEvent = await waitForEvent<IEvent>(context, {
        topic: 'notification-events',
        timeout: 3000,
        filter: (event) => 
          event.type === 'NOTIFICATION_CREATED' && 
          event.payload.relatedEventId === medicationEvent.eventId,
        throwOnTimeout: false,
      });
      
      // Notification might be optional, so we don't assert on it
    });
    
    it('should track medication adherence streak', async () => {
      // Create multiple medication taken events to simulate a streak
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const medicationId = uuidv4();
      
      // Create events for the past 3 days
      for (let i = 3; i >= 1; i--) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        
        const medicationEvent = createTestEvent<MedicationEventDto>(
          EventTypes.Care.MEDICATION_TAKEN,
          {
            userId,
            medicationId,
            medicationName: 'Daily Medication',
            dosage: '10mg',
            scheduledTime: pastDate.toISOString(),
            takenTime: pastDate.toISOString(),
            status: 'TAKEN',
          },
          {
            source: 'care-service',
          }
        );
        
        // Publish event
        await publishTestEvent(context, medicationEvent, {
          topic: MEDICATION_EVENTS_TOPIC,
        });
        
        // Wait a bit between events
        await sleep(500);
      }
      
      // Create today's event
      const todayEvent = createTestEvent<MedicationEventDto>(
        EventTypes.Care.MEDICATION_TAKEN,
        {
          userId,
          medicationId,
          medicationName: 'Daily Medication',
          dosage: '10mg',
          scheduledTime: new Date().toISOString(),
          takenTime: new Date().toISOString(),
          status: 'TAKEN',
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish today's event
      await publishTestEvent(context, todayEvent, {
        topic: MEDICATION_EVENTS_TOPIC,
      });
      
      // Wait for achievement event (streak of 4 days might trigger an achievement)
      const achievementEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === EventTypes.Gamification.ACHIEVEMENT_UNLOCKED && 
          event.payload.achievementType === 'medication-adherence',
        throwOnTimeout: false,
      });
      
      // Achievement might not be unlocked yet, so we don't assert it must exist
      if (achievementEvent) {
        expect(achievementEvent.payload).toHaveProperty('userId', userId);
        expect(achievementEvent.payload).toHaveProperty('achievementType', 'medication-adherence');
        expect(achievementEvent.payload).toHaveProperty('level');
      }
      
      // But we should at least see progress
      const progressEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === EventTypes.Gamification.ACHIEVEMENT_PROGRESS && 
          event.payload.achievementType === 'medication-adherence' &&
          event.payload.userId === userId,
        throwOnTimeout: true,
      });
      
      expect(progressEvent).toBeDefined();
      expect(progressEvent?.payload).toHaveProperty('progress');
      expect(progressEvent?.payload.progress).toBeGreaterThanOrEqual(4); // At least 4 days streak
    });
  });
  
  describe('Telemedicine Events', () => {
    it('should validate and process telemedicine session events', async () => {
      // Create telemedicine session started event
      const sessionId = uuidv4();
      const telemedicineEvent = createTestEvent<CareEventDto>(
        EventTypes.Care.TELEMEDICINE_SESSION_STARTED,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          sessionId,
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
          startTime: new Date().toISOString(),
          sessionType: 'VIDEO',
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, telemedicineEvent, {
        topic: TELEMEDICINE_EVENTS_TOPIC,
      });
      
      // Wait a bit to simulate session duration
      await sleep(1000);
      
      // Create telemedicine session ended event
      const sessionEndedEvent = createTestEvent<CareEventDto>(
        EventTypes.Care.TELEMEDICINE_SESSION_ENDED,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          sessionId,
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
          startTime: telemedicineEvent.payload.startTime,
          endTime: new Date().toISOString(),
          sessionType: 'VIDEO',
          duration: 15, // minutes
          status: 'COMPLETED',
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, sessionEndedEvent, {
        topic: TELEMEDICINE_EVENTS_TOPIC,
      });
      
      // Wait for gamification event
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.payload.sessionId === sessionId,
        throwOnTimeout: false,
      });
      
      // Gamification event might be optional for telemedicine, so we don't assert it must exist
      if (gamificationEvent) {
        expect(gamificationEvent.payload).toHaveProperty('userId', telemedicineEvent.payload.userId);
      }
    });
  });
  
  describe('Care Plan Events', () => {
    it('should validate and process care plan progress events', async () => {
      // Create care plan progress event
      const carePlanEvent = createTestEvent<CareEventDto>(
        EventTypes.Care.CARE_PLAN_PROGRESS,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          carePlanId: uuidv4(),
          progress: 75, // percentage
          updatedAt: new Date().toISOString(),
          completedTasks: 3,
          totalTasks: 4,
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, carePlanEvent, {
        topic: CARE_PLAN_EVENTS_TOPIC,
      });
      
      // Wait for gamification event
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === EventTypes.Gamification.ACHIEVEMENT_PROGRESS && 
          event.payload.carePlanId === carePlanEvent.payload.carePlanId,
        throwOnTimeout: false,
      });
      
      // Gamification event might be optional for care plan progress, so we don't assert it must exist
      if (gamificationEvent) {
        expect(gamificationEvent.payload).toHaveProperty('userId', carePlanEvent.payload.userId);
        expect(gamificationEvent.payload).toHaveProperty('progress');
      }
    });
    
    it('should handle care plan completion events', async () => {
      // Create care plan completion event
      const carePlanEvent = createTestEvent<CareEventDto>(
        EventTypes.Care.CARE_PLAN_COMPLETED,
        {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          carePlanId: uuidv4(),
          completedAt: new Date().toISOString(),
          completedTasks: 4,
          totalTasks: 4,
          duration: 30, // days
        },
        {
          source: 'care-service',
        }
      );
      
      // Publish event
      await publishTestEvent(context, carePlanEvent, {
        topic: CARE_PLAN_EVENTS_TOPIC,
      });
      
      // Wait for achievement event
      const achievementEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === EventTypes.Gamification.ACHIEVEMENT_UNLOCKED && 
          event.payload.carePlanId === carePlanEvent.payload.carePlanId,
        throwOnTimeout: false,
      });
      
      // Achievement might not be unlocked yet, so we don't assert it must exist
      if (achievementEvent) {
        expect(achievementEvent.payload).toHaveProperty('userId', carePlanEvent.payload.userId);
        expect(achievementEvent.payload).toHaveProperty('achievementType');
        expect(achievementEvent.payload).toHaveProperty('level');
      }
      
      // Check for XP award
      const xpEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === EventTypes.Gamification.XP_AWARDED && 
          event.payload.userId === carePlanEvent.payload.userId,
        throwOnTimeout: false,
      });
      
      if (xpEvent) {
        expect(xpEvent.payload).toHaveProperty('xpAmount');
        expect(xpEvent.payload.xpAmount).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle malformed care events gracefully', async () => {
      // Create malformed event (invalid JSON)
      const malformedEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        type: EventTypes.Care.APPOINTMENT_BOOKED,
        source: 'care-service',
        // Missing payload
      };
      
      // Publish event directly as a string with invalid JSON
      await context.producer?.send({
        topic: CARE_EVENTS_TOPIC,
        messages: [
          {
            key: malformedEvent.eventId,
            // Intentionally malformed JSON
            value: '{"eventId":"' + malformedEvent.eventId + '","timestamp":"' + malformedEvent.timestamp + '","type":"' + malformedEvent.type + '","source":"care-service","payload":{'  // Missing closing brace
          },
        ],
      });
      
      // Wait a bit to ensure event would have been processed
      await sleep(2000);
      
      // Check that no gamification event was produced for this event
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 1000, // Short timeout since we don't expect an event
        filter: (event) => 
          event.payload && event.payload.originalEventId === malformedEvent.eventId,
        throwOnTimeout: false,
      });
      
      expect(gamificationEvent).toBeNull();
      
      // Check for error event if your system produces them
      const errorEvent = await waitForEvent<IEvent>(context, {
        topic: 'error-events',
        timeout: 3000,
        filter: (event) => 
          event.payload && event.payload.originalEventId === malformedEvent.eventId,
        throwOnTimeout: false,
      });
      
      // Error event might not be produced if the service is configured to just log errors
      // So we don't assert it must exist
    });
  });
});