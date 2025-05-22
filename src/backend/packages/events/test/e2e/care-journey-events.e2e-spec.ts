/**
 * @file care-journey-events.e2e-spec.ts
 * @description End-to-end tests for Care Journey events, validating the complete flow
 * of care-related events from production to consumption. This file tests event publishing,
 * validation, and processing for appointment booking, medication adherence, telemedicine session,
 * and care plan progress events.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';
import { EventsModule } from '../../src/events.module';
import { PrismaService } from '@austa/database';
import { BaseEvent } from '../../src/interfaces/base-event.interface';
import { KafkaEvent } from '../../src/interfaces/kafka-event.interface';
import { 
  AppointmentStatus, 
  MedicationAdherenceStatus, 
  TelemedicineSessionStatus,
  CarePlanProgressStatus,
  IAppointmentEvent,
  IMedicationEvent,
  ITelemedicineEvent,
  ICarePlanEvent
} from '@austa/interfaces/journey/care';
import {
  createTestEnvironment,
  createTestConsumer,
  publishTestEvent,
  waitForEvent,
  waitForEvents,
  createJourneyEventFactories,
  assertEventsEqual,
  TestEnvironment,
} from './test-helpers';

// Constants for test configuration
const CARE_EVENTS_TOPIC = 'care-events';
const GAMIFICATION_EVENTS_TOPIC = 'gamification-events';
const NOTIFICATION_EVENTS_TOPIC = 'notification-events';

// Test timeout (increased for e2e tests)
jest.setTimeout(30000);

describe('Care Journey Events (E2E)', () => {
  let testEnv: TestEnvironment;
  let kafkaProducer: KafkaProducer;
  let careEventsConsumer: KafkaConsumer;
  let gamificationEventsConsumer: KafkaConsumer;
  let notificationEventsConsumer: KafkaConsumer;
  let eventFactories: ReturnType<typeof createJourneyEventFactories>;

  beforeAll(async () => {
    // Create test environment with Kafka and database
    testEnv = await createTestEnvironment({
      useRealKafka: true,
      seedDatabase: true,
    });

    kafkaProducer = testEnv.kafkaProducer;

    // Create consumers for different event topics
    careEventsConsumer = await createTestConsumer(
      testEnv.kafkaService,
      CARE_EVENTS_TOPIC,
      'care-events-test-consumer'
    );

    gamificationEventsConsumer = await createTestConsumer(
      testEnv.kafkaService,
      GAMIFICATION_EVENTS_TOPIC,
      'gamification-events-test-consumer'
    );

    notificationEventsConsumer = await createTestConsumer(
      testEnv.kafkaService,
      NOTIFICATION_EVENTS_TOPIC,
      'notification-events-test-consumer'
    );

    // Create event factories for test data generation
    eventFactories = createJourneyEventFactories();
  });

  afterAll(async () => {
    // Disconnect consumers
    await careEventsConsumer.disconnect();
    await gamificationEventsConsumer.disconnect();
    await notificationEventsConsumer.disconnect();

    // Clean up test environment
    await testEnv.cleanup();
  });

  describe('Appointment Booking Events', () => {
    it('should publish and consume appointment booking events', async () => {
      // Create an appointment booking event
      const appointmentEvent = eventFactories.care.appointmentBooked({
        payload: {
          userId: randomUUID(),
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
          status: AppointmentStatus.BOOKED,
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, appointmentEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        careEventsConsumer,
        (event) => event.type === 'care.appointment.booked',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, appointmentEvent, ['eventId', 'timestamp']);

      // Wait for gamification event triggered by appointment booking
      const gamificationEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.progress.updated' && 
          event.payload.sourceEventId === appointmentEvent.eventId,
        5000
      );

      // Assert that the gamification event was triggered
      expect(gamificationEvent).not.toBeNull();
      expect(gamificationEvent.payload.achievementType).toBe('appointment-keeper');
      expect(gamificationEvent.payload.userId).toBe(appointmentEvent.payload.userId);
    });

    it('should validate appointment booking event schema', async () => {
      // Create an invalid appointment booking event (missing required fields)
      const invalidAppointmentEvent = eventFactories.care.appointmentBooked({
        payload: {
          // Missing userId
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          bookedAt: new Date().toISOString(),
          status: AppointmentStatus.BOOKED,
        } as any,
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, invalidAppointmentEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidAppointmentEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'userId',
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should process appointment status updates', async () => {
      // Create an appointment ID to track through the process
      const appointmentId = randomUUID();
      const userId = randomUUID();

      // Create an appointment booking event
      const bookingEvent = eventFactories.care.appointmentBooked({
        payload: {
          userId,
          appointmentId,
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
          status: AppointmentStatus.BOOKED,
        },
      });

      // Publish the booking event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, bookingEvent);

      // Create an appointment confirmation event for the same appointment
      const confirmationEvent = eventFactories.care.appointmentBooked({
        type: 'care.appointment.confirmed',
        payload: {
          userId,
          appointmentId,
          providerId: bookingEvent.payload.providerId,
          specialtyId: bookingEvent.payload.specialtyId,
          scheduledAt: bookingEvent.payload.scheduledAt,
          confirmedAt: new Date().toISOString(),
          status: AppointmentStatus.CONFIRMED,
        },
      });

      // Publish the confirmation event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, confirmationEvent);

      // Wait for notification event triggered by appointment confirmation
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'appointment-confirmed' &&
          event.payload.userId === userId,
        5000
      );

      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          appointmentId,
          scheduledAt: bookingEvent.payload.scheduledAt,
        })
      );
    });

    it('should handle appointment cancellation events', async () => {
      // Create an appointment ID to track through the process
      const appointmentId = randomUUID();
      const userId = randomUUID();

      // Create an appointment booking event
      const bookingEvent = eventFactories.care.appointmentBooked({
        payload: {
          userId,
          appointmentId,
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
          status: AppointmentStatus.BOOKED,
        },
      });

      // Publish the booking event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, bookingEvent);

      // Create an appointment cancellation event for the same appointment
      const cancellationEvent = eventFactories.care.appointmentBooked({
        type: 'care.appointment.cancelled',
        payload: {
          userId,
          appointmentId,
          providerId: bookingEvent.payload.providerId,
          specialtyId: bookingEvent.payload.specialtyId,
          scheduledAt: bookingEvent.payload.scheduledAt,
          cancelledAt: new Date().toISOString(),
          status: AppointmentStatus.CANCELLED,
          reason: 'Patient request',
        },
      });

      // Publish the cancellation event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, cancellationEvent);

      // Wait for notification event triggered by appointment cancellation
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'appointment-cancelled' &&
          event.payload.userId === userId,
        5000
      );

      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          appointmentId,
          reason: cancellationEvent.payload.reason,
        })
      );
    });
  });

  describe('Medication Adherence Events', () => {
    it('should publish and consume medication taken events', async () => {
      // Create a medication taken event
      const medicationEvent = eventFactories.care.medicationTaken({
        payload: {
          userId: randomUUID(),
          medicationId: randomUUID(),
          scheduledAt: new Date().toISOString(),
          takenAt: new Date().toISOString(),
          dosage: '10mg',
          status: MedicationAdherenceStatus.TAKEN,
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, medicationEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        careEventsConsumer,
        (event) => event.type === 'care.medication.taken',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, medicationEvent, ['eventId', 'timestamp']);

      // Wait for gamification event triggered by medication adherence
      const gamificationEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.progress.updated' && 
          event.payload.sourceEventId === medicationEvent.eventId,
        5000
      );

      // Assert that the gamification event was triggered
      expect(gamificationEvent).not.toBeNull();
      expect(gamificationEvent.payload.achievementType).toBe('medication-adherence');
      expect(gamificationEvent.payload.userId).toBe(medicationEvent.payload.userId);
    });

    it('should validate medication taken event schema', async () => {
      // Create an invalid medication taken event (invalid dosage type)
      const invalidMedicationEvent = eventFactories.care.medicationTaken({
        payload: {
          userId: randomUUID(),
          medicationId: randomUUID(),
          scheduledAt: new Date().toISOString(),
          takenAt: new Date().toISOString(),
          dosage: 10 as any, // Invalid dosage type (should be string)
          status: MedicationAdherenceStatus.TAKEN,
        },
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, invalidMedicationEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidMedicationEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'payload.dosage',
          message: expect.stringContaining('string'),
        })
      );
    });

    it('should handle medication missed events', async () => {
      // Create a medication missed event
      const missedEvent = eventFactories.care.medicationTaken({
        type: 'care.medication.missed',
        payload: {
          userId: randomUUID(),
          medicationId: randomUUID(),
          scheduledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          missedAt: new Date().toISOString(),
          dosage: '10mg',
          status: MedicationAdherenceStatus.MISSED,
          reason: 'Forgot',
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, missedEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        careEventsConsumer,
        (event) => event.type === 'care.medication.missed',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, missedEvent, ['eventId', 'timestamp']);

      // Wait for notification event triggered by missed medication
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'medication-missed' &&
          event.payload.userId === missedEvent.payload.userId,
        5000
      );

      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          medicationId: missedEvent.payload.medicationId,
          dosage: missedEvent.payload.dosage,
        })
      );
    });
  });

  describe('Telemedicine Session Events', () => {
    it('should publish and consume telemedicine session completed events', async () => {
      // Create a telemedicine session completed event
      const telemedicineEvent = eventFactories.care.telemedicineCompleted({
        payload: {
          userId: randomUUID(),
          sessionId: randomUUID(),
          providerId: randomUUID(),
          startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          endedAt: new Date().toISOString(),
          duration: 1800, // 30 minutes in seconds
          status: TelemedicineSessionStatus.COMPLETED,
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, telemedicineEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        careEventsConsumer,
        (event) => event.type === 'care.telemedicine.completed',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, telemedicineEvent, ['eventId', 'timestamp']);

      // Wait for gamification event triggered by telemedicine session
      const gamificationEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.progress.updated' && 
          event.payload.sourceEventId === telemedicineEvent.eventId,
        5000
      );

      // Assert that the gamification event was triggered
      expect(gamificationEvent).not.toBeNull();
      expect(gamificationEvent.payload.userId).toBe(telemedicineEvent.payload.userId);
    });

    it('should validate telemedicine session event schema', async () => {
      // Create an invalid telemedicine session event (invalid duration type)
      const invalidTelemedicineEvent = eventFactories.care.telemedicineCompleted({
        payload: {
          userId: randomUUID(),
          sessionId: randomUUID(),
          providerId: randomUUID(),
          startedAt: new Date(Date.now() - 1800000).toISOString(),
          endedAt: new Date().toISOString(),
          duration: '1800' as any, // Invalid duration type (should be number)
          status: TelemedicineSessionStatus.COMPLETED,
        },
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, invalidTelemedicineEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidTelemedicineEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'payload.duration',
          message: expect.stringContaining('number'),
        })
      );
    });

    it('should handle telemedicine session scheduled events', async () => {
      // Create a telemedicine session scheduled event
      const scheduledEvent = eventFactories.care.telemedicineCompleted({
        type: 'care.telemedicine.scheduled',
        payload: {
          userId: randomUUID(),
          sessionId: randomUUID(),
          providerId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
          status: TelemedicineSessionStatus.SCHEDULED,
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, scheduledEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        careEventsConsumer,
        (event) => event.type === 'care.telemedicine.scheduled',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, scheduledEvent, ['eventId', 'timestamp']);

      // Wait for notification event triggered by scheduled telemedicine session
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'telemedicine-scheduled' &&
          event.payload.userId === scheduledEvent.payload.userId,
        5000
      );

      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          sessionId: scheduledEvent.payload.sessionId,
          scheduledAt: scheduledEvent.payload.scheduledAt,
        })
      );
    });
  });

  describe('Care Plan Progress Events', () => {
    it('should publish and consume care plan progress events', async () => {
      // Create a care plan progress event
      const carePlanEvent = eventFactories.care.appointmentBooked({
        type: 'care.plan.progress',
        payload: {
          userId: randomUUID(),
          carePlanId: randomUUID(),
          progressPercentage: 75,
          updatedAt: new Date().toISOString(),
          status: CarePlanProgressStatus.IN_PROGRESS,
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, carePlanEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        careEventsConsumer,
        (event) => event.type === 'care.plan.progress',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, carePlanEvent, ['eventId', 'timestamp']);

      // Wait for gamification event triggered by care plan progress
      const gamificationEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.progress.updated' && 
          event.payload.sourceEventId === carePlanEvent.eventId,
        5000
      );

      // Assert that the gamification event was triggered
      expect(gamificationEvent).not.toBeNull();
      expect(gamificationEvent.payload.userId).toBe(carePlanEvent.payload.userId);
    });

    it('should validate care plan progress event schema', async () => {
      // Create an invalid care plan progress event (invalid progress percentage)
      const invalidCarePlanEvent = eventFactories.care.appointmentBooked({
        type: 'care.plan.progress',
        payload: {
          userId: randomUUID(),
          carePlanId: randomUUID(),
          progressPercentage: 120, // Invalid percentage (should be 0-100)
          updatedAt: new Date().toISOString(),
          status: CarePlanProgressStatus.IN_PROGRESS,
        },
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, invalidCarePlanEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidCarePlanEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'payload.progressPercentage',
          message: expect.stringContaining('between 0 and 100'),
        })
      );
    });

    it('should handle care plan completed events', async () => {
      // Create a care plan completed event
      const completedEvent = eventFactories.care.appointmentBooked({
        type: 'care.plan.completed',
        payload: {
          userId: randomUUID(),
          carePlanId: randomUUID(),
          progressPercentage: 100,
          completedAt: new Date().toISOString(),
          status: CarePlanProgressStatus.COMPLETED,
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, completedEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        careEventsConsumer,
        (event) => event.type === 'care.plan.completed',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, completedEvent, ['eventId', 'timestamp']);

      // Wait for notification event triggered by completed care plan
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'care-plan-completed' &&
          event.payload.userId === completedEvent.payload.userId,
        5000
      );

      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          carePlanId: completedEvent.payload.carePlanId,
          completedAt: completedEvent.payload.completedAt,
        })
      );

      // Wait for achievement unlocked event
      const achievementEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.achievement.unlocked' && 
          event.payload.userId === completedEvent.payload.userId,
        5000
      );

      // Assert that the achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent.payload.achievementType).toBe('care-plan-completer');
    });
  });

  describe('Cross-Journey Integration', () => {
    it('should trigger gamification achievements from care events', async () => {
      const userId = randomUUID();
      
      // Create multiple medication taken events for the same user
      const medicationEvents = [];
      
      for (let i = 0; i < 3; i++) {
        const medicationEvent = eventFactories.care.medicationTaken({
          payload: {
            userId,
            medicationId: randomUUID(),
            scheduledAt: new Date().toISOString(),
            takenAt: new Date().toISOString(),
            dosage: '10mg',
            status: MedicationAdherenceStatus.TAKEN,
          },
        });
        
        medicationEvents.push(medicationEvent);
        
        // Publish the event
        await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, medicationEvent);
      }
      
      // Wait for achievement unlocked event
      const achievementEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.achievement.unlocked' && 
          event.payload.userId === userId &&
          event.payload.achievementType === 'medication-adherence',
        10000
      );
      
      // Assert that the achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent.payload.level).toBe(1);
      expect(achievementEvent.payload.points).toBeGreaterThan(0);
      
      // Wait for notification about the achievement
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'achievement-unlocked' &&
          event.payload.userId === userId,
        5000
      );
      
      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          achievementType: 'medication-adherence',
          level: 1,
          title: expect.any(String),
        })
      );
    });
    
    it('should update user profile based on care journey events', async () => {
      const userId = randomUUID();
      
      // Create an appointment booking event
      const appointmentEvent = eventFactories.care.appointmentBooked({
        payload: {
          userId,
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
          status: AppointmentStatus.BOOKED,
        },
      });
      
      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, appointmentEvent);
      
      // Create a telemedicine session completed event for the same user
      const telemedicineEvent = eventFactories.care.telemedicineCompleted({
        payload: {
          userId,
          sessionId: randomUUID(),
          providerId: randomUUID(),
          startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          endedAt: new Date().toISOString(),
          duration: 1800, // 30 minutes in seconds
          status: TelemedicineSessionStatus.COMPLETED,
        },
      });
      
      // Publish the event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, telemedicineEvent);
      
      // Wait for profile updated event
      const profileEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.profile.updated' && 
          event.payload.userId === userId,
        10000
      );
      
      // Assert that the profile was updated
      expect(profileEvent).not.toBeNull();
      expect(profileEvent.payload.profile).toEqual(
        expect.objectContaining({
          appointmentsBooked: 1,
          telemedicineSessionsCompleted: 1,
          totalTelemedicineMinutes: 30,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed events gracefully', async () => {
      // Create a malformed event (missing required type field)
      const malformedEvent = {
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        // Missing type field
        journey: 'care',
        payload: {
          userId: randomUUID(),
          appointmentId: randomUUID(),
        },
      } as any;

      // Publish the malformed event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, malformedEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === malformedEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'type',
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should handle events with invalid journey type', async () => {
      // Create an event with invalid journey type
      const invalidJourneyEvent = eventFactories.care.appointmentBooked({
        journey: 'invalid-journey' as any,
        payload: {
          userId: randomUUID(),
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          bookedAt: new Date().toISOString(),
          status: AppointmentStatus.BOOKED,
        },
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, invalidJourneyEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidJourneyEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'journey',
          message: expect.stringContaining('valid'),
        })
      );
    });

    it('should handle duplicate events', async () => {
      // Create an appointment booking event
      const appointmentEvent = eventFactories.care.appointmentBooked({
        payload: {
          userId: randomUUID(),
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          bookedAt: new Date().toISOString(),
          status: AppointmentStatus.BOOKED,
        },
      });

      // Publish the event twice
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, appointmentEvent);
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, appointmentEvent);

      // Wait for duplicate event detection
      const duplicateEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.duplicate' && 
          event.payload.originalEventId === appointmentEvent.eventId,
        5000
      );

      // Assert that duplicate was detected
      expect(duplicateEvent).not.toBeNull();
      expect(duplicateEvent.payload.eventType).toBe(appointmentEvent.type);
    });
  });

  describe('Health Checks', () => {
    it('should verify event processing pipeline health', async () => {
      // Create a health check event
      const healthCheckEvent = {
        eventId: randomUUID(),
        type: 'system.health.check',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        journey: 'care',
        payload: {
          component: 'care-journey-events',
          checkId: randomUUID(),
          timestamp: new Date().toISOString(),
        },
      };

      // Publish the health check event
      await publishTestEvent(kafkaProducer, CARE_EVENTS_TOPIC, healthCheckEvent);

      // Wait for health check response
      const healthResponse = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.health.response' && 
          event.payload.checkId === healthCheckEvent.payload.checkId,
        5000
      );

      // Assert that health check response was received
      expect(healthResponse).not.toBeNull();
      expect(healthResponse.payload.status).toBe('healthy');
      expect(healthResponse.payload.component).toBe('care-journey-events');
      expect(healthResponse.payload.metrics).toEqual(
        expect.objectContaining({
          processingTime: expect.any(Number),
          queueSize: expect.any(Number),
        })
      );
    });
  });
});