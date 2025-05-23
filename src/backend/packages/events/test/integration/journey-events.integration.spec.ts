/**
 * @file Journey Events Integration Tests
 * @description Integration tests for journey-specific event processing, focusing on Health, Care, and Plan journeys.
 * These tests verify that each journey's events are properly structured, validated, and processed according to
 * their specific requirements. It ensures that cross-journey events are properly correlated and that
 * journey-specific business rules are applied correctly.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventsModule } from '../../src/events.module';
import { EventsService } from '../../src/events.service';
import { EventValidationService } from '../../src/validation/event-validation.service';
import { EventProcessingService } from '../../src/processing/event-processing.service';
import { KafkaService } from '../../src/kafka/kafka.service';

// Import journey-specific event interfaces
import {
  JourneyType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  correlateEvents,
  isHealthEvent,
  isCareEvent,
  isPlanEvent
} from '../../src/interfaces/journey-events.interface';

// Import base event interfaces
import { BaseEvent, createEvent, validateEvent } from '../../src/interfaces/base-event.interface';
import { ValidationResult } from '../../src/interfaces/event-validation.interface';
import { IEventResponse } from '../../src/interfaces/event-response.interface';

// Import mock data generators
import { 
  createMockHealthEvent, 
  createMockCareEvent, 
  createMockPlanEvent 
} from '../mocks/journey-events.mock';

// Import test utilities
import { waitForEventProcessing } from '../utils/test-utils';

describe('Journey Events Integration Tests', () => {
  let module: TestingModule;
  let eventsService: EventsService;
  let validationService: EventValidationService;
  let processingService: EventProcessingService;
  let kafkaService: KafkaService;

  beforeAll(async () => {
    // Create testing module with all required dependencies
    module = await Test.createTestingModule({
      imports: [EventsModule],
    }).compile();

    // Get service instances
    eventsService = module.get<EventsService>(EventsService);
    validationService = module.get<EventValidationService>(EventValidationService);
    processingService = module.get<EventProcessingService>(EventProcessingService);
    kafkaService = module.get<KafkaService>(KafkaService);

    // Initialize services and connections
    await kafkaService.connect();
  });

  afterAll(async () => {
    // Clean up resources
    await kafkaService.disconnect();
    await module.close();
  });

  describe('Health Journey Event Processing', () => {
    it('should validate and process HEALTH_METRIC_RECORDED events', async () => {
      // Create a mock health metric recorded event
      const healthEvent = createMockHealthEvent(HealthEventType.METRIC_RECORDED, {
        metric: {
          id: 'metric-123',
          userId: 'user-123',
          type: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
        },
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual-entry',
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(healthEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(healthEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(HealthEventType.METRIC_RECORDED);
      expect(response.data).toBeDefined();
    });

    it('should validate and process HEALTH_GOAL_ACHIEVED events', async () => {
      // Create a mock health goal achieved event
      const healthEvent = createMockHealthEvent(HealthEventType.GOAL_ACHIEVED, {
        goal: {
          id: 'goal-123',
          userId: 'user-123',
          type: 'STEPS',
          targetValue: 10000,
          currentValue: 10500,
          unit: 'steps',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(), // 23 days from now
          status: 'ACHIEVED',
        },
        goalType: 'STEPS',
        achievedValue: 10500,
        targetValue: 10000,
        daysToAchieve: 7,
        isEarlyCompletion: true,
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(healthEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(healthEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(HealthEventType.GOAL_ACHIEVED);
      expect(response.data).toBeDefined();
    });

    it('should validate and process HEALTH_DEVICE_CONNECTED events', async () => {
      // Create a mock health device connected event
      const healthEvent = createMockHealthEvent(HealthEventType.DEVICE_CONNECTED, {
        deviceConnection: {
          id: 'device-conn-123',
          userId: 'user-123',
          deviceId: 'device-123',
          deviceType: 'Smartwatch',
          connectionStatus: 'CONNECTED',
          lastSyncDate: new Date().toISOString(),
        },
        deviceId: 'device-123',
        deviceType: 'Smartwatch',
        connectionDate: new Date().toISOString(),
        isFirstConnection: true,
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(healthEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(healthEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(HealthEventType.DEVICE_CONNECTED);
      expect(response.data).toBeDefined();
    });

    it('should reject invalid health events with appropriate error messages', async () => {
      // Create an invalid health event (missing required fields)
      const invalidHealthEvent = createMockHealthEvent(HealthEventType.METRIC_RECORDED, {
        // Missing required fields
        metricType: 'HEART_RATE',
        // Missing value
        unit: 'bpm',
        timestamp: new Date().toISOString(),
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(invalidHealthEvent);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Attempt to process the event
      const response = await processingService.processEvent(invalidHealthEvent);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error.code).toContain('VALIDATION_ERROR');
    });
  });

  describe('Care Journey Event Processing', () => {
    it('should validate and process CARE_APPOINTMENT_BOOKED events', async () => {
      // Create a mock care appointment booked event
      const careEvent = createMockCareEvent(CareEventType.APPOINTMENT_BOOKED, {
        appointment: {
          id: 'appointment-123',
          userId: 'user-123',
          providerId: 'provider-123',
          type: 'CONSULTATION',
          status: 'SCHEDULED',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          createdAt: new Date().toISOString(),
        },
        appointmentType: 'CONSULTATION',
        providerId: 'provider-123',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        isFirstAppointment: true,
        isUrgent: false,
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(careEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(careEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(CareEventType.APPOINTMENT_BOOKED);
      expect(response.data).toBeDefined();
    });

    it('should validate and process CARE_MEDICATION_ADHERENCE_STREAK events', async () => {
      // Create a mock care medication adherence streak event
      const careEvent = createMockCareEvent(CareEventType.MEDICATION_ADHERENCE_STREAK, {
        medicationId: 'medication-123',
        medicationName: 'Medication A',
        streakDays: 30,
        adherencePercentage: 95,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        endDate: new Date().toISOString(),
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(careEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(careEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(CareEventType.MEDICATION_ADHERENCE_STREAK);
      expect(response.data).toBeDefined();
    });

    it('should validate and process CARE_TELEMEDICINE_SESSION_COMPLETED events', async () => {
      // Create a mock care telemedicine session completed event
      const careEvent = createMockCareEvent(CareEventType.TELEMEDICINE_SESSION_COMPLETED, {
        session: {
          id: 'session-123',
          userId: 'user-123',
          providerId: 'provider-123',
          appointmentId: 'appointment-123',
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          endTime: new Date().toISOString(),
          status: 'COMPLETED',
        },
        sessionId: 'session-123',
        providerId: 'provider-123',
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        endTime: new Date().toISOString(),
        duration: 30,
        appointmentId: 'appointment-123',
        technicalIssues: false,
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(careEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(careEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(CareEventType.TELEMEDICINE_SESSION_COMPLETED);
      expect(response.data).toBeDefined();
    });

    it('should reject invalid care events with appropriate error messages', async () => {
      // Create an invalid care event (missing required fields)
      const invalidCareEvent = createMockCareEvent(CareEventType.APPOINTMENT_BOOKED, {
        // Missing appointment object
        appointmentType: 'CONSULTATION',
        providerId: 'provider-123',
        // Missing scheduledDate
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(invalidCareEvent);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Attempt to process the event
      const response = await processingService.processEvent(invalidCareEvent);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error.code).toContain('VALIDATION_ERROR');
    });
  });

  describe('Plan Journey Event Processing', () => {
    it('should validate and process PLAN_CLAIM_SUBMITTED events', async () => {
      // Create a mock plan claim submitted event
      const planEvent = createMockPlanEvent(PlanEventType.CLAIM_SUBMITTED, {
        claim: {
          id: 'claim-123',
          userId: 'user-123',
          claimType: 'MEDICAL_CONSULTATION',
          amount: 150.00,
          status: 'SUBMITTED',
          submissionDate: new Date().toISOString(),
          documents: ['document-123', 'document-124'],
        },
        submissionDate: new Date().toISOString(),
        amount: 150.00,
        claimType: 'MEDICAL_CONSULTATION',
        hasDocuments: true,
        isComplete: true,
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(planEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(planEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(PlanEventType.CLAIM_SUBMITTED);
      expect(response.data).toBeDefined();
    });

    it('should validate and process PLAN_BENEFIT_UTILIZED events', async () => {
      // Create a mock plan benefit utilized event
      const planEvent = createMockPlanEvent(PlanEventType.BENEFIT_UTILIZED, {
        benefit: {
          id: 'benefit-123',
          name: 'Annual Check-up',
          description: 'Yearly comprehensive health check-up',
          coverageLimit: 500.00,
          coverageUsed: 150.00,
          coverageRemaining: 350.00,
        },
        utilizationDate: new Date().toISOString(),
        serviceProvider: 'Hospital A',
        amount: 150.00,
        remainingCoverage: 350.00,
        isFirstUtilization: false,
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(planEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(planEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(PlanEventType.BENEFIT_UTILIZED);
      expect(response.data).toBeDefined();
    });

    it('should validate and process PLAN_REWARD_REDEEMED events', async () => {
      // Create a mock plan reward redeemed event
      const planEvent = createMockPlanEvent(PlanEventType.REWARD_REDEEMED, {
        rewardId: 'reward-123',
        rewardName: 'Fitness Discount',
        redemptionDate: new Date().toISOString(),
        pointValue: 500,
        monetaryValue: 50.00,
        rewardType: 'DISCOUNT',
        isPremiumReward: false,
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(planEvent);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();

      // Process the event
      const response = await processingService.processEvent(planEvent);
      expect(response.success).toBe(true);
      expect(response.eventType).toBe(PlanEventType.REWARD_REDEEMED);
      expect(response.data).toBeDefined();
    });

    it('should reject invalid plan events with appropriate error messages', async () => {
      // Create an invalid plan event (missing required fields)
      const invalidPlanEvent = createMockPlanEvent(PlanEventType.CLAIM_SUBMITTED, {
        // Missing claim object
        submissionDate: new Date().toISOString(),
        // Missing amount
        claimType: 'MEDICAL_CONSULTATION',
        hasDocuments: true,
        isComplete: true,
      });

      // Validate the event
      const validationResult = await validationService.validateEvent(invalidPlanEvent);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Attempt to process the event
      const response = await processingService.processEvent(invalidPlanEvent);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error.code).toContain('VALIDATION_ERROR');
    });
  });

  describe('Cross-Journey Event Correlation', () => {
    it('should correlate events across different journeys', async () => {
      // Create events from different journeys
      const healthEvent = createMockHealthEvent(HealthEventType.GOAL_ACHIEVED, {
        goal: {
          id: 'goal-123',
          userId: 'user-123',
          type: 'STEPS',
          targetValue: 10000,
          currentValue: 10500,
          unit: 'steps',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ACHIEVED',
        },
        goalType: 'STEPS',
        achievedValue: 10500,
        targetValue: 10000,
        daysToAchieve: 7,
        isEarlyCompletion: true,
      });

      const careEvent = createMockCareEvent(CareEventType.APPOINTMENT_COMPLETED, {
        appointment: {
          id: 'appointment-123',
          userId: 'user-123',
          providerId: 'provider-123',
          type: 'CONSULTATION',
          status: 'COMPLETED',
          scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: new Date().toISOString(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        appointmentType: 'CONSULTATION',
        providerId: 'provider-123',
        completionDate: new Date().toISOString(),
        duration: 30,
        followUpScheduled: true,
      });

      const planEvent = createMockPlanEvent(PlanEventType.REWARD_REDEEMED, {
        rewardId: 'reward-123',
        rewardName: 'Fitness Discount',
        redemptionDate: new Date().toISOString(),
        pointValue: 500,
        monetaryValue: 50.00,
        rewardType: 'DISCOUNT',
        isPremiumReward: false,
      });

      // Correlate the events
      const correlationId = `test-correlation-${Date.now()}`;
      const correlatedEvents = correlateEvents(
        [healthEvent, careEvent, planEvent],
        correlationId
      );

      // Verify correlation
      expect(correlatedEvents.length).toBe(3);
      correlatedEvents.forEach(event => {
        expect(event.correlationId).toBe(correlationId);
      });

      // Process correlated events
      const responses = await Promise.all(
        correlatedEvents.map(event => processingService.processEvent(event))
      );

      // Verify all events were processed successfully
      responses.forEach(response => {
        expect(response.success).toBe(true);
        expect(response.metadata).toBeDefined();
        // Check that correlation ID is preserved in response metadata
        expect(response.metadata.correlationId).toBe(correlationId);
      });

      // Verify cross-journey achievement tracking
      const achievementResponse = await eventsService.getAchievementsForCorrelation(correlationId);
      expect(achievementResponse.success).toBe(true);
      expect(achievementResponse.data).toBeDefined();
      expect(achievementResponse.data.achievements).toBeDefined();
      expect(achievementResponse.data.achievements.length).toBeGreaterThan(0);
    });

    it('should process events in the correct order within a correlation group', async () => {
      // Create a sequence of related events
      const correlationId = `test-sequence-${Date.now()}`;
      
      // Step 1: User books an appointment
      const appointmentBookedEvent = createMockCareEvent(CareEventType.APPOINTMENT_BOOKED, {
        appointment: {
          id: 'appointment-seq-123',
          userId: 'user-123',
          providerId: 'provider-123',
          type: 'CONSULTATION',
          status: 'SCHEDULED',
          scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        appointmentType: 'CONSULTATION',
        providerId: 'provider-123',
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        isFirstAppointment: false,
        isUrgent: false,
      });
      appointmentBookedEvent.correlationId = correlationId;

      // Step 2: User completes the appointment
      const appointmentCompletedEvent = createMockCareEvent(CareEventType.APPOINTMENT_COMPLETED, {
        appointment: {
          id: 'appointment-seq-123',
          userId: 'user-123',
          providerId: 'provider-123',
          type: 'CONSULTATION',
          status: 'COMPLETED',
          scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        appointmentType: 'CONSULTATION',
        providerId: 'provider-123',
        completionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        duration: 30,
        followUpScheduled: false,
      });
      appointmentCompletedEvent.correlationId = correlationId;

      // Step 3: User submits a claim for the appointment
      const claimSubmittedEvent = createMockPlanEvent(PlanEventType.CLAIM_SUBMITTED, {
        claim: {
          id: 'claim-seq-123',
          userId: 'user-123',
          claimType: 'MEDICAL_CONSULTATION',
          amount: 150.00,
          status: 'SUBMITTED',
          submissionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          documents: ['document-seq-123'],
          relatedAppointmentId: 'appointment-seq-123',
        },
        submissionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 150.00,
        claimType: 'MEDICAL_CONSULTATION',
        hasDocuments: true,
        isComplete: true,
      });
      claimSubmittedEvent.correlationId = correlationId;

      // Process events in sequence
      const response1 = await processingService.processEvent(appointmentBookedEvent);
      expect(response1.success).toBe(true);
      
      const response2 = await processingService.processEvent(appointmentCompletedEvent);
      expect(response2.success).toBe(true);
      
      const response3 = await processingService.processEvent(claimSubmittedEvent);
      expect(response3.success).toBe(true);

      // Verify the sequence was processed correctly
      const sequenceResponse = await eventsService.getEventSequence(correlationId);
      expect(sequenceResponse.success).toBe(true);
      expect(sequenceResponse.data).toBeDefined();
      expect(sequenceResponse.data.events).toBeDefined();
      expect(sequenceResponse.data.events.length).toBe(3);
      
      // Verify events are in the correct order
      expect(sequenceResponse.data.events[0].type).toBe(CareEventType.APPOINTMENT_BOOKED);
      expect(sequenceResponse.data.events[1].type).toBe(CareEventType.APPOINTMENT_COMPLETED);
      expect(sequenceResponse.data.events[2].type).toBe(PlanEventType.CLAIM_SUBMITTED);

      // Verify cross-journey achievement
      const achievementResponse = await eventsService.getAchievementsForCorrelation(correlationId);
      expect(achievementResponse.success).toBe(true);
      expect(achievementResponse.data.achievements).toBeDefined();
      // Should have a specific achievement for completing the full sequence
      const fullSequenceAchievement = achievementResponse.data.achievements.find(
        a => a.type === 'CROSS_JOURNEY_SEQUENCE_COMPLETED'
      );
      expect(fullSequenceAchievement).toBeDefined();
    });
  });

  describe('Journey-Specific Business Rules', () => {
    it('should apply health journey-specific rules for goal achievement events', async () => {
      // Create a health goal achieved event with early completion
      const healthEvent = createMockHealthEvent(HealthEventType.GOAL_ACHIEVED, {
        goal: {
          id: 'goal-bonus-123',
          userId: 'user-123',
          type: 'STEPS',
          targetValue: 10000,
          currentValue: 12000, // 20% over target
          unit: 'steps',
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          endDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(), // 27 days from now
          status: 'ACHIEVED',
        },
        goalType: 'STEPS',
        achievedValue: 12000,
        targetValue: 10000,
        daysToAchieve: 3,
        isEarlyCompletion: true,
      });

      // Process the event
      const response = await processingService.processEvent(healthEvent);
      expect(response.success).toBe(true);
      
      // Verify bonus points for early completion and exceeding target
      expect(response.data).toBeDefined();
      expect(response.data.bonusPoints).toBeDefined();
      expect(response.data.bonusPoints).toBeGreaterThan(0);
      expect(response.data.bonusReasons).toContain('EARLY_COMPLETION');
      expect(response.data.bonusReasons).toContain('EXCEEDED_TARGET');
    });

    it('should apply care journey-specific rules for medication adherence streak events', async () => {
      // Create a care medication adherence streak event with high adherence
      const careEvent = createMockCareEvent(CareEventType.MEDICATION_ADHERENCE_STREAK, {
        medicationId: 'medication-streak-123',
        medicationName: 'Medication B',
        streakDays: 90, // 90-day streak
        adherencePercentage: 98, // 98% adherence
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      // Process the event
      const response = await processingService.processEvent(careEvent);
      expect(response.success).toBe(true);
      
      // Verify milestone achievement and high adherence bonus
      expect(response.data).toBeDefined();
      expect(response.data.milestoneAchieved).toBe(true);
      expect(response.data.streakCategory).toBe('EXCELLENT');
      expect(response.data.bonusPoints).toBeGreaterThan(0);
    });

    it('should apply plan journey-specific rules for claim submission events', async () => {
      // Create a plan claim submitted event with complete documentation
      const planEvent = createMockPlanEvent(PlanEventType.CLAIM_SUBMITTED, {
        claim: {
          id: 'claim-complete-123',
          userId: 'user-123',
          claimType: 'MEDICAL_PROCEDURE',
          amount: 1200.00,
          status: 'SUBMITTED',
          submissionDate: new Date().toISOString(),
          documents: ['document-1', 'document-2', 'document-3', 'document-4'],
          completenessScore: 100, // Perfect documentation
        },
        submissionDate: new Date().toISOString(),
        amount: 1200.00,
        claimType: 'MEDICAL_PROCEDURE',
        hasDocuments: true,
        isComplete: true,
      });

      // Process the event
      const response = await processingService.processEvent(planEvent);
      expect(response.success).toBe(true);
      
      // Verify expedited processing and documentation bonus
      expect(response.data).toBeDefined();
      expect(response.data.expeditedProcessing).toBe(true);
      expect(response.data.documentationBonus).toBe(true);
      expect(response.data.estimatedProcessingDays).toBeLessThan(5); // Expedited processing
    });
  });
});