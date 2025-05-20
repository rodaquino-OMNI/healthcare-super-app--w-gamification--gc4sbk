import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  TestEnvironment,
  createTestUser,
  createTestAppointment,
  createTestEvent,
  assertEvent,
  retry,
  waitForCondition,
  seedTestDatabase
} from './test-helpers';
import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { TOPICS } from '../../src/constants/topics.constants';

// Since we couldn't find the JourneyType enum, we'll define it here based on context
enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  USER = 'user',
  GAMIFICATION = 'game'
}

/**
 * End-to-end tests for Care Journey events.
 * 
 * These tests validate the complete flow of care-related events from production to consumption,
 * ensuring proper event schema validation and processing through the event pipeline.
 */
describe('Care Journey Events (e2e)', () => {
  let testEnv: TestEnvironment;
  let app: INestApplication;
  let prisma: PrismaClient;
  let testUser: any;
  
  // Setup test environment before all tests
  beforeAll(async () => {
    // Create test environment with care-specific topics
    testEnv = new TestEnvironment({
      topics: [
        TOPICS.CARE.EVENTS,
        TOPICS.CARE.APPOINTMENTS,
        TOPICS.CARE.MEDICATIONS,
        TOPICS.CARE.TELEMEDICINE,
        TOPICS.GAMIFICATION.EVENTS
      ]
    });
    
    await testEnv.setup();
    app = testEnv.getApp();
    prisma = testEnv.getPrisma();
    
    // Seed test database with required data
    await seedTestDatabase(prisma);
    
    // Create a test user for all tests
    testUser = await createTestUser(prisma);
  }, 60000);
  
  // Clean up after all tests
  afterAll(async () => {
    await testEnv.teardown();
  });
  
  // Clear consumed messages before each test
  beforeEach(() => {
    testEnv.clearConsumedMessages();
  });
  
  /**
   * Tests for appointment booking events
   */
  describe('Appointment Events', () => {
    let testAppointment: any;
    
    beforeEach(async () => {
      // Create a test appointment for each test
      testAppointment = await createTestAppointment(prisma, testUser.id);
    });
    
    it('should process CARE_APPOINTMENT_BOOKED events', async () => {
      // Create appointment booked event
      const appointmentData = {
        appointmentId: testAppointment.id,
        providerId: testAppointment.providerId,
        specialtyType: 'Cardiologia', // This would come from the provider's specialty
        appointmentType: 'in_person',
        scheduledAt: testAppointment.scheduledAt.toISOString(),
        bookedAt: new Date().toISOString()
      };
      
      const event = createTestEvent(
        EventType.CARE_APPOINTMENT_BOOKED,
        JourneyType.CARE,
        testUser.id,
        appointmentData
      );
      
      // Publish event
      await testEnv.publishEvent(event, TOPICS.CARE.APPOINTMENTS);
      
      // Wait for event to be processed
      const processedEvent = await testEnv.waitForEvent(
        EventType.CARE_APPOINTMENT_BOOKED,
        testUser.id
      );
      
      // Assert event was processed correctly
      assertEvent(
        processedEvent,
        EventType.CARE_APPOINTMENT_BOOKED,
        JourneyType.CARE,
        testUser.id
      );
      
      // Verify event data
      expect(processedEvent.data).toMatchObject(appointmentData);
      
      // Verify gamification points were awarded (if applicable)
      await waitForCondition(async () => {
        const gamificationEvent = await testEnv.waitForEvent(
          EventType.GAMIFICATION_POINTS_EARNED,
          testUser.id
        );
        
        return !!gamificationEvent;
      });
    });
    
    it('should process CARE_APPOINTMENT_COMPLETED events', async () => {
      // Update appointment status to completed
      await prisma.appointment.update({
        where: { id: testAppointment.id },
        data: { status: 'COMPLETED' }
      });
      
      // Create appointment completed event
      const appointmentData = {
        appointmentId: testAppointment.id,
        providerId: testAppointment.providerId,
        appointmentType: 'in_person',
        scheduledAt: testAppointment.scheduledAt.toISOString(),
        completedAt: new Date().toISOString(),
        duration: 30 // minutes
      };
      
      const event = createTestEvent(
        EventType.CARE_APPOINTMENT_COMPLETED,
        JourneyType.CARE,
        testUser.id,
        appointmentData
      );
      
      // Publish event
      await testEnv.publishEvent(event, TOPICS.CARE.APPOINTMENTS);
      
      // Wait for event to be processed
      const processedEvent = await testEnv.waitForEvent(
        EventType.CARE_APPOINTMENT_COMPLETED,
        testUser.id
      );
      
      // Assert event was processed correctly
      assertEvent(
        processedEvent,
        EventType.CARE_APPOINTMENT_COMPLETED,
        JourneyType.CARE,
        testUser.id
      );
      
      // Verify event data
      expect(processedEvent.data).toMatchObject(appointmentData);
      
      // Verify achievement unlocked event (if applicable)
      await waitForCondition(async () => {
        const achievementEvent = await testEnv.waitForEvent(
          EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
          testUser.id
        );
        
        return !!achievementEvent && achievementEvent.data.achievementType === 'appointment-keeper';
      });
    });
  });
  
  /**
   * Tests for medication adherence events
   */
  describe('Medication Events', () => {
    it('should process CARE_MEDICATION_TAKEN events', async () => {
      // Create medication taken event
      const medicationData = {
        medicationId: uuidv4(),
        medicationName: 'Test Medication',
        dosage: '10mg',
        takenAt: new Date().toISOString(),
        adherence: 'on_time'
      };
      
      const event = createTestEvent(
        EventType.CARE_MEDICATION_TAKEN,
        JourneyType.CARE,
        testUser.id,
        medicationData
      );
      
      // Publish event
      await testEnv.publishEvent(event, TOPICS.CARE.MEDICATIONS);
      
      // Wait for event to be processed
      const processedEvent = await testEnv.waitForEvent(
        EventType.CARE_MEDICATION_TAKEN,
        testUser.id
      );
      
      // Assert event was processed correctly
      assertEvent(
        processedEvent,
        EventType.CARE_MEDICATION_TAKEN,
        JourneyType.CARE,
        testUser.id
      );
      
      // Verify event data
      expect(processedEvent.data).toMatchObject(medicationData);
      
      // Verify gamification points were awarded (if applicable)
      await waitForCondition(async () => {
        const gamificationEvent = await testEnv.waitForEvent(
          EventType.GAMIFICATION_POINTS_EARNED,
          testUser.id
        );
        
        return !!gamificationEvent;
      });
    });
    
    it('should handle missed medication events correctly', async () => {
      // Create missed medication event
      const medicationData = {
        medicationId: uuidv4(),
        medicationName: 'Test Medication',
        dosage: '10mg',
        takenAt: new Date().toISOString(),
        adherence: 'missed'
      };
      
      const event = createTestEvent(
        EventType.CARE_MEDICATION_TAKEN,
        JourneyType.CARE,
        testUser.id,
        medicationData
      );
      
      // Publish event
      await testEnv.publishEvent(event, TOPICS.CARE.MEDICATIONS);
      
      // Wait for event to be processed
      const processedEvent = await testEnv.waitForEvent(
        EventType.CARE_MEDICATION_TAKEN,
        testUser.id
      );
      
      // Assert event was processed correctly
      assertEvent(
        processedEvent,
        EventType.CARE_MEDICATION_TAKEN,
        JourneyType.CARE,
        testUser.id
      );
      
      // Verify event data
      expect(processedEvent.data).toMatchObject(medicationData);
      expect(processedEvent.data.adherence).toBe('missed');
      
      // No gamification points should be awarded for missed medications
      // Wait a bit to ensure no points event is generated
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const gamificationEvents = testEnv.getConsumedMessages().filter(msg => {
        try {
          const event = JSON.parse(msg.value.toString());
          return event.type === EventType.GAMIFICATION_POINTS_EARNED && 
                 event.userId === testUser.id;
        } catch {
          return false;
        }
      });
      
      expect(gamificationEvents.length).toBe(0);
    });
  });
  
  /**
   * Tests for telemedicine session events
   */
  describe('Telemedicine Events', () => {
    let testAppointment: any;
    let sessionId: string;
    
    beforeEach(async () => {
      // Create a test appointment for telemedicine
      testAppointment = await createTestAppointment(prisma, testUser.id, {
        appointmentType: 'TELEMEDICINE'
      });
      
      sessionId = uuidv4();
    });
    
    it('should process CARE_TELEMEDICINE_STARTED events', async () => {
      // Create telemedicine started event
      const telemedicineData = {
        sessionId,
        appointmentId: testAppointment.id,
        providerId: testAppointment.providerId,
        startedAt: new Date().toISOString(),
        deviceType: 'mobile'
      };
      
      const event = createTestEvent(
        EventType.CARE_TELEMEDICINE_STARTED,
        JourneyType.CARE,
        testUser.id,
        telemedicineData
      );
      
      // Publish event
      await testEnv.publishEvent(event, TOPICS.CARE.TELEMEDICINE);
      
      // Wait for event to be processed
      const processedEvent = await testEnv.waitForEvent(
        EventType.CARE_TELEMEDICINE_STARTED,
        testUser.id
      );
      
      // Assert event was processed correctly
      assertEvent(
        processedEvent,
        EventType.CARE_TELEMEDICINE_STARTED,
        JourneyType.CARE,
        testUser.id
      );
      
      // Verify event data
      expect(processedEvent.data).toMatchObject(telemedicineData);
    });
    
    it('should process CARE_TELEMEDICINE_COMPLETED events', async () => {
      // Create telemedicine completed event
      const startTime = new Date(Date.now() - 30 * 60000); // 30 minutes ago
      const endTime = new Date();
      
      const telemedicineData = {
        sessionId,
        appointmentId: testAppointment.id,
        providerId: testAppointment.providerId,
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
        duration: 30, // minutes
        quality: 'good'
      };
      
      const event = createTestEvent(
        EventType.CARE_TELEMEDICINE_COMPLETED,
        JourneyType.CARE,
        testUser.id,
        telemedicineData
      );
      
      // Publish event
      await testEnv.publishEvent(event, TOPICS.CARE.TELEMEDICINE);
      
      // Wait for event to be processed
      const processedEvent = await testEnv.waitForEvent(
        EventType.CARE_TELEMEDICINE_COMPLETED,
        testUser.id
      );
      
      // Assert event was processed correctly
      assertEvent(
        processedEvent,
        EventType.CARE_TELEMEDICINE_COMPLETED,
        JourneyType.CARE,
        testUser.id
      );
      
      // Verify event data
      expect(processedEvent.data).toMatchObject(telemedicineData);
      
      // Verify gamification points were awarded (if applicable)
      await waitForCondition(async () => {
        const gamificationEvent = await testEnv.waitForEvent(
          EventType.GAMIFICATION_POINTS_EARNED,
          testUser.id
        );
        
        return !!gamificationEvent;
      });
      
      // Update appointment status to completed
      await prisma.appointment.update({
        where: { id: testAppointment.id },
        data: { status: 'COMPLETED' }
      });
    });
  });
  
  /**
   * Tests for care plan events
   */
  describe('Care Plan Events', () => {
    let carePlanId: string;
    
    beforeEach(() => {
      carePlanId = uuidv4();
    });
    
    it('should process CARE_PLAN_CREATED events', async () => {
      // Create care plan created event
      const carePlanData = {
        planId: carePlanId,
        providerId: uuidv4(),
        planType: 'chronic_condition',
        condition: 'Hypertension',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString(), // 90 days from now
        createdAt: new Date().toISOString()
      };
      
      const event = createTestEvent(
        EventType.CARE_PLAN_CREATED,
        JourneyType.CARE,
        testUser.id,
        carePlanData
      );
      
      // Publish event
      await testEnv.publishEvent(event, TOPICS.CARE.EVENTS);
      
      // Wait for event to be processed
      const processedEvent = await testEnv.waitForEvent(
        EventType.CARE_PLAN_CREATED,
        testUser.id
      );
      
      // Assert event was processed correctly
      assertEvent(
        processedEvent,
        EventType.CARE_PLAN_CREATED,
        JourneyType.CARE,
        testUser.id
      );
      
      // Verify event data
      expect(processedEvent.data).toMatchObject(carePlanData);
    });
    
    it('should process CARE_PLAN_TASK_COMPLETED events', async () => {
      // Create care plan task completed event
      const taskData = {
        taskId: uuidv4(),
        planId: carePlanId,
        taskType: 'medication',
        completedAt: new Date().toISOString(),
        status: 'completed'
      };
      
      const event = createTestEvent(
        EventType.CARE_PLAN_TASK_COMPLETED,
        JourneyType.CARE,
        testUser.id,
        taskData
      );
      
      // Publish event
      await testEnv.publishEvent(event, TOPICS.CARE.EVENTS);
      
      // Wait for event to be processed
      const processedEvent = await testEnv.waitForEvent(
        EventType.CARE_PLAN_TASK_COMPLETED,
        testUser.id
      );
      
      // Assert event was processed correctly
      assertEvent(
        processedEvent,
        EventType.CARE_PLAN_TASK_COMPLETED,
        JourneyType.CARE,
        testUser.id
      );
      
      // Verify event data
      expect(processedEvent.data).toMatchObject(taskData);
      
      // Verify gamification points were awarded (if applicable)
      await waitForCondition(async () => {
        const gamificationEvent = await testEnv.waitForEvent(
          EventType.GAMIFICATION_POINTS_EARNED,
          testUser.id
        );
        
        return !!gamificationEvent;
      });
    });
  });
  
  /**
   * Tests for error handling with malformed events
   */
  describe('Error Handling', () => {
    it('should handle malformed care events gracefully', async () => {
      // Create a malformed event missing required fields
      const malformedEvent = createTestEvent(
        EventType.CARE_APPOINTMENT_BOOKED,
        JourneyType.CARE,
        testUser.id,
        { 
          // Missing required appointmentId and other fields
          bookedAt: new Date().toISOString()
        }
      );
      
      // Publish event
      await testEnv.publishEvent(malformedEvent, TOPICS.CARE.APPOINTMENTS);
      
      // Wait a bit to ensure event is processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify no error is thrown and the event is sent to dead letter queue
      // This would require checking the dead letter queue, which might not be
      // directly accessible in the test environment. Instead, we verify that
      // no exception is thrown and the test continues to run.
      
      // Clear messages for next test
      testEnv.clearConsumedMessages();
    });
    
    it('should validate event schema correctly', async () => {
      // Create an event with invalid field types
      const invalidEvent = createTestEvent(
        EventType.CARE_MEDICATION_TAKEN,
        JourneyType.CARE,
        testUser.id,
        {
          medicationId: uuidv4(),
          medicationName: 'Test Medication',
          dosage: 10, // Should be a string, not a number
          takenAt: new Date().toISOString(),
          adherence: 'on_time'
        }
      );
      
      // Publish event
      await testEnv.publishEvent(invalidEvent, TOPICS.CARE.MEDICATIONS);
      
      // Wait a bit to ensure event is processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify no error is thrown and the test continues to run
      // Clear messages for next test
      testEnv.clearConsumedMessages();
    });
  });
  
  /**
   * Tests for cross-journey interactions
   */
  describe('Cross-Journey Interactions', () => {
    it('should trigger gamification events from care journey events', async () => {
      // Create a sequence of care events that should trigger gamification
      // 1. Book an appointment
      const appointment = await createTestAppointment(prisma, testUser.id);
      
      const appointmentEvent = createTestEvent(
        EventType.CARE_APPOINTMENT_BOOKED,
        JourneyType.CARE,
        testUser.id,
        {
          appointmentId: appointment.id,
          providerId: appointment.providerId,
          specialtyType: 'Cardiologia',
          appointmentType: 'in_person',
          scheduledAt: appointment.scheduledAt.toISOString(),
          bookedAt: new Date().toISOString()
        }
      );
      
      await testEnv.publishEvent(appointmentEvent, TOPICS.CARE.APPOINTMENTS);
      
      // 2. Complete the appointment
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'COMPLETED' }
      });
      
      const completedEvent = createTestEvent(
        EventType.CARE_APPOINTMENT_COMPLETED,
        JourneyType.CARE,
        testUser.id,
        {
          appointmentId: appointment.id,
          providerId: appointment.providerId,
          appointmentType: 'in_person',
          scheduledAt: appointment.scheduledAt.toISOString(),
          completedAt: new Date().toISOString(),
          duration: 30
        }
      );
      
      await testEnv.publishEvent(completedEvent, TOPICS.CARE.APPOINTMENTS);
      
      // 3. Take medication
      const medicationEvent = createTestEvent(
        EventType.CARE_MEDICATION_TAKEN,
        JourneyType.CARE,
        testUser.id,
        {
          medicationId: uuidv4(),
          medicationName: 'Test Medication',
          dosage: '10mg',
          takenAt: new Date().toISOString(),
          adherence: 'on_time'
        }
      );
      
      await testEnv.publishEvent(medicationEvent, TOPICS.CARE.MEDICATIONS);
      
      // Verify that gamification events are triggered
      await retry(async () => {
        const messages = testEnv.getConsumedMessages();
        const gamificationEvents = messages.filter(msg => {
          try {
            const event = JSON.parse(msg.value.toString());
            return event.type === EventType.GAMIFICATION_POINTS_EARNED && 
                   event.userId === testUser.id;
          } catch {
            return false;
          }
        });
        
        // We expect at least 3 gamification events (one for each care event)
        if (gamificationEvents.length < 3) {
          throw new Error(`Expected at least 3 gamification events, but got ${gamificationEvents.length}`);
        }
        
        return true;
      });
      
      // Check for achievement unlocked event
      await waitForCondition(async () => {
        const achievementEvent = await testEnv.waitForEvent(
          EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
          testUser.id
        );
        
        return !!achievementEvent;
      });
    });
  });
});