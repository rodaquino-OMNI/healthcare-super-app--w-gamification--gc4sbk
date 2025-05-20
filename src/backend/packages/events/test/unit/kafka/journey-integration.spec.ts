import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { EventTypes } from '../../../src/dto/event-types.enum';
import { 
  MockEventBroker, 
  MockEventProcessor, 
  MockEventValidator,
  MockJourneyServices,
  MockErrorHandler
} from '../../mocks';
import {
  healthEvents,
  careEvents,
  planEvents,
  baseEvents,
  kafkaEvents
} from '../../fixtures';
import {
  setupKafkaTestEnvironment,
  createJourneyEventProducer,
  createJourneyEventConsumer
} from '../helpers/kafka-setup.helper';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { KAFKA_TOPICS } from '../../../src/constants/topics.constants';
import { ERROR_CODES } from '../../../src/constants/errors.constants';

describe('Journey Integration - Kafka', () => {
  let moduleRef: TestingModule;
  let kafkaService: KafkaService;
  let mockEventBroker: MockEventBroker;
  let mockEventProcessor: MockEventProcessor;
  let mockEventValidator: MockEventValidator;
  let mockJourneyServices: MockJourneyServices;
  let mockErrorHandler: MockErrorHandler;

  beforeAll(async () => {
    // Set up the test environment with mocks
    const testEnv = await setupKafkaTestEnvironment();
    moduleRef = testEnv.moduleRef;
    kafkaService = testEnv.kafkaService;
    mockEventBroker = testEnv.mockEventBroker;
    mockEventProcessor = testEnv.mockEventProcessor;
    mockEventValidator = testEnv.mockEventValidator;
    mockJourneyServices = testEnv.mockJourneyServices;
    mockErrorHandler = testEnv.mockErrorHandler;
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockEventBroker.reset();
    mockEventProcessor.reset();
    mockEventValidator.reset();
    mockJourneyServices.reset();
    mockErrorHandler.reset();
  });

  describe('Health Journey Integration', () => {
    let healthProducer: any;
    let healthConsumer: any;

    beforeEach(async () => {
      // Create journey-specific producer and consumer
      healthProducer = await createJourneyEventProducer(kafkaService, 'health');
      healthConsumer = await createJourneyEventConsumer(kafkaService, 'health');
    });

    it('should validate health metric recording events', async () => {
      // Arrange
      const metricEvent = healthEvents.createHealthMetricEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, metricEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.HEALTH_METRIC_RECORDED,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.HEALTH_METRIC_RECORDED
        })
      );
    });

    it('should validate health goal achievement events', async () => {
      // Arrange
      const goalEvent = healthEvents.createGoalAchievementEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, goalEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.HEALTH_GOAL_ACHIEVED,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.HEALTH_GOAL_ACHIEVED
        })
      );
    });

    it('should validate health device synchronization events', async () => {
      // Arrange
      const deviceEvent = healthEvents.createDeviceSyncEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, deviceEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.HEALTH_DEVICE_SYNCED,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.HEALTH_DEVICE_SYNCED
        })
      );
    });

    it('should reject invalid health events with proper error code', async () => {
      // Arrange
      const invalidEvent = healthEvents.createInvalidHealthEvent();
      mockEventValidator.setValidationResult(false, [
        { field: 'payload.value', message: 'Value must be a number' }
      ]);
      mockErrorHandler.expectError(ERROR_CODES.EVENT_VALIDATION_FAILED);

      // Act
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, invalidEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalled();
      expect(mockEventProcessor.processEvent).not.toHaveBeenCalled();
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ERROR_CODES.EVENT_VALIDATION_FAILED,
          context: expect.objectContaining({
            journey: 'health'
          })
        })
      );
    });
  });

  describe('Care Journey Integration', () => {
    let careProducer: any;
    let careConsumer: any;

    beforeEach(async () => {
      // Create journey-specific producer and consumer
      careProducer = await createJourneyEventProducer(kafkaService, 'care');
      careConsumer = await createJourneyEventConsumer(kafkaService, 'care');
    });

    it('should validate appointment booking events', async () => {
      // Arrange
      const appointmentEvent = careEvents.createAppointmentBookedEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, appointmentEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.CARE_APPOINTMENT_BOOKED,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.CARE_APPOINTMENT_BOOKED
        })
      );
    });

    it('should validate medication adherence events', async () => {
      // Arrange
      const medicationEvent = careEvents.createMedicationAdherenceEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, medicationEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.CARE_MEDICATION_TAKEN,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.CARE_MEDICATION_TAKEN
        })
      );
    });

    it('should validate telemedicine session events', async () => {
      // Arrange
      const telemedicineEvent = careEvents.createTelemedicineSessionEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, telemedicineEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.CARE_TELEMEDICINE_COMPLETED,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.CARE_TELEMEDICINE_COMPLETED
        })
      );
    });

    it('should reject invalid care events with proper error code', async () => {
      // Arrange
      const invalidEvent = careEvents.createInvalidCareEvent();
      mockEventValidator.setValidationResult(false, [
        { field: 'payload.appointmentId', message: 'Appointment ID is required' }
      ]);
      mockErrorHandler.expectError(ERROR_CODES.EVENT_VALIDATION_FAILED);

      // Act
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, invalidEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalled();
      expect(mockEventProcessor.processEvent).not.toHaveBeenCalled();
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ERROR_CODES.EVENT_VALIDATION_FAILED,
          context: expect.objectContaining({
            journey: 'care'
          })
        })
      );
    });
  });

  describe('Plan Journey Integration', () => {
    let planProducer: any;
    let planConsumer: any;

    beforeEach(async () => {
      // Create journey-specific producer and consumer
      planProducer = await createJourneyEventProducer(kafkaService, 'plan');
      planConsumer = await createJourneyEventConsumer(kafkaService, 'plan');
    });

    it('should validate claim submission events', async () => {
      // Arrange
      const claimEvent = planEvents.createClaimSubmittedEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await planProducer.produce(KAFKA_TOPICS.PLAN_EVENTS, claimEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.PLAN_CLAIM_SUBMITTED,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.PLAN_CLAIM_SUBMITTED
        })
      );
    });

    it('should validate benefit utilization events', async () => {
      // Arrange
      const benefitEvent = planEvents.createBenefitUtilizedEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await planProducer.produce(KAFKA_TOPICS.PLAN_EVENTS, benefitEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.PLAN_BENEFIT_UTILIZED,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.PLAN_BENEFIT_UTILIZED
        })
      );
    });

    it('should validate reward redemption events', async () => {
      // Arrange
      const rewardEvent = planEvents.createRewardRedeemedEvent();
      mockEventValidator.setValidationResult(true);

      // Act
      await planProducer.produce(KAFKA_TOPICS.PLAN_EVENTS, rewardEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.PLAN_REWARD_REDEEMED,
          payload: expect.any(Object)
        })
      );
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.PLAN_REWARD_REDEEMED
        })
      );
    });

    it('should reject invalid plan events with proper error code', async () => {
      // Arrange
      const invalidEvent = planEvents.createInvalidPlanEvent();
      mockEventValidator.setValidationResult(false, [
        { field: 'payload.amount', message: 'Amount must be a positive number' }
      ]);
      mockErrorHandler.expectError(ERROR_CODES.EVENT_VALIDATION_FAILED);

      // Act
      await planProducer.produce(KAFKA_TOPICS.PLAN_EVENTS, invalidEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalled();
      expect(mockEventProcessor.processEvent).not.toHaveBeenCalled();
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ERROR_CODES.EVENT_VALIDATION_FAILED,
          context: expect.objectContaining({
            journey: 'plan'
          })
        })
      );
    });
  });

  describe('Cross-Journey Event Correlation', () => {
    let healthProducer: any;
    let careProducer: any;
    let planProducer: any;
    
    beforeEach(async () => {
      // Create journey-specific producers
      healthProducer = await createJourneyEventProducer(kafkaService, 'health');
      careProducer = await createJourneyEventProducer(kafkaService, 'care');
      planProducer = await createJourneyEventProducer(kafkaService, 'plan');
      
      // Configure mock services for cross-journey testing
      mockJourneyServices.setupCrossJourneyCorrelation();
    });

    it('should correlate events across health and care journeys', async () => {
      // Arrange
      const userId = 'user-123';
      const correlationId = 'correlation-xyz';
      const metadata: EventMetadataDto = {
        userId,
        correlationId,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const healthEvent = healthEvents.createHealthMetricEvent(metadata);
      const careEvent = careEvents.createAppointmentBookedEvent(metadata);
      
      mockEventValidator.setValidationResult(true);

      // Act - Send events from different journeys with the same correlation ID
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, healthEvent);
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, careEvent);
      await mockEventBroker.processAllMessages();

      // Assert
      expect(mockJourneyServices.hasCorrelatedEvents(correlationId)).toBe(true);
      expect(mockJourneyServices.getCorrelatedEventCount(correlationId)).toBe(2);
      expect(mockJourneyServices.getCorrelatedEventTypes(correlationId)).toEqual(
        expect.arrayContaining([
          EventTypes.HEALTH_METRIC_RECORDED,
          EventTypes.CARE_APPOINTMENT_BOOKED
        ])
      );
    });

    it('should track user activity across all three journeys', async () => {
      // Arrange
      const userId = 'user-456';
      const baseMetadata = {
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Create events for all three journeys with the same user ID
      const healthEvent = healthEvents.createHealthMetricEvent({
        ...baseMetadata,
        correlationId: 'health-corr-1'
      });
      
      const careEvent = careEvents.createAppointmentBookedEvent({
        ...baseMetadata,
        correlationId: 'care-corr-1'
      });
      
      const planEvent = planEvents.createClaimSubmittedEvent({
        ...baseMetadata,
        correlationId: 'plan-corr-1'
      });
      
      mockEventValidator.setValidationResult(true);

      // Act - Send events from all journeys for the same user
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, healthEvent);
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, careEvent);
      await planProducer.produce(KAFKA_TOPICS.PLAN_EVENTS, planEvent);
      await mockEventBroker.processAllMessages();

      // Assert
      expect(mockJourneyServices.getUserJourneyCount(userId)).toBe(3);
      expect(mockJourneyServices.getUserActiveJourneys(userId)).toEqual(
        expect.arrayContaining(['health', 'care', 'plan'])
      );
      expect(mockJourneyServices.getUserEventCount(userId)).toBe(3);
    });
  });

  describe('Gamification Integration', () => {
    let healthProducer: any;
    let careProducer: any;
    let planProducer: any;
    
    beforeEach(async () => {
      // Create journey-specific producers
      healthProducer = await createJourneyEventProducer(kafkaService, 'health');
      careProducer = await createJourneyEventProducer(kafkaService, 'care');
      planProducer = await createJourneyEventProducer(kafkaService, 'plan');
      
      // Configure mock services for gamification testing
      mockJourneyServices.setupGamificationIntegration();
      mockEventValidator.setValidationResult(true);
    });

    it('should trigger achievement for health streak events', async () => {
      // Arrange
      const userId = 'user-789';
      const metadata = {
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Create multiple health metric events to simulate a streak
      const events = [
        healthEvents.createHealthMetricEvent({ ...metadata, correlationId: 'health-1' }),
        healthEvents.createHealthMetricEvent({ ...metadata, correlationId: 'health-2' }),
        healthEvents.createHealthMetricEvent({ ...metadata, correlationId: 'health-3' })
      ];

      // Act - Send multiple health events to trigger streak achievement
      for (const event of events) {
        await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, event);
        await mockEventBroker.processNextMessage();
      }

      // Assert
      expect(mockJourneyServices.hasAchievement(userId, 'health-check-streak')).toBe(true);
      expect(mockJourneyServices.getAchievementLevel(userId, 'health-check-streak')).toBe(1);
      expect(mockJourneyServices.getXpEarned(userId)).toBeGreaterThan(0);
    });

    it('should trigger achievement for appointment attendance', async () => {
      // Arrange
      const userId = 'user-101';
      const metadata = {
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Create appointment booked and completed events
      const bookedEvent = careEvents.createAppointmentBookedEvent({
        ...metadata,
        correlationId: 'care-appt-1'
      });
      
      const completedEvent = careEvents.createAppointmentCompletedEvent({
        ...metadata,
        correlationId: 'care-appt-1',
        payload: {
          ...bookedEvent.payload,
          status: 'COMPLETED'
        }
      });

      // Act - Book and complete an appointment
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, bookedEvent);
      await mockEventBroker.processNextMessage();
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, completedEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockJourneyServices.hasAchievement(userId, 'appointment-keeper')).toBe(true);
      expect(mockJourneyServices.getXpEarned(userId)).toBeGreaterThan(0);
    });

    it('should trigger achievement for claim submission', async () => {
      // Arrange
      const userId = 'user-202';
      const metadata = {
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Create claim submitted event
      const claimEvent = planEvents.createClaimSubmittedEvent({
        ...metadata,
        correlationId: 'plan-claim-1'
      });

      // Act - Submit a claim
      await planProducer.produce(KAFKA_TOPICS.PLAN_EVENTS, claimEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockJourneyServices.hasAchievement(userId, 'claim-master')).toBe(true);
      expect(mockJourneyServices.getXpEarned(userId)).toBeGreaterThan(0);
    });

    it('should create cross-journey achievement when events from all journeys are received', async () => {
      // Arrange
      const userId = 'user-303';
      const metadata = {
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Create events from all three journeys
      const healthEvent = healthEvents.createHealthMetricEvent({
        ...metadata,
        correlationId: 'cross-journey-1'
      });
      
      const careEvent = careEvents.createAppointmentBookedEvent({
        ...metadata,
        correlationId: 'cross-journey-2'
      });
      
      const planEvent = planEvents.createClaimSubmittedEvent({
        ...metadata,
        correlationId: 'cross-journey-3'
      });

      // Act - Send events from all journeys
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, healthEvent);
      await mockEventBroker.processNextMessage();
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, careEvent);
      await mockEventBroker.processNextMessage();
      await planProducer.produce(KAFKA_TOPICS.PLAN_EVENTS, planEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockJourneyServices.hasAchievement(userId, 'super-user')).toBe(true);
      expect(mockJourneyServices.getXpEarned(userId)).toBeGreaterThan(0);
      expect(mockJourneyServices.getUserActiveJourneys(userId).length).toBe(3);
    });
  });

  describe('Journey-Specific Error Handling', () => {
    let healthProducer: any;
    let careProducer: any;
    let planProducer: any;
    
    beforeEach(async () => {
      // Create journey-specific producers
      healthProducer = await createJourneyEventProducer(kafkaService, 'health');
      careProducer = await createJourneyEventProducer(kafkaService, 'care');
      planProducer = await createJourneyEventProducer(kafkaService, 'plan');
      
      // Configure error handler
      mockErrorHandler.reset();
    });

    it('should handle health journey validation errors with specific context', async () => {
      // Arrange
      const invalidEvent = healthEvents.createInvalidHealthEvent();
      mockEventValidator.setValidationResult(false, [
        { field: 'payload.metricType', message: 'Invalid metric type' },
        { field: 'payload.value', message: 'Value must be a number' }
      ]);

      // Act
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, invalidEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ERROR_CODES.EVENT_VALIDATION_FAILED,
          message: expect.stringContaining('Invalid health event'),
          context: expect.objectContaining({
            journey: 'health',
            eventType: EventTypes.HEALTH_METRIC_RECORDED,
            validationErrors: expect.arrayContaining([
              expect.objectContaining({ field: 'payload.metricType' }),
              expect.objectContaining({ field: 'payload.value' })
            ])
          })
        })
      );
      expect(mockEventProcessor.processEvent).not.toHaveBeenCalled();
    });

    it('should handle care journey schema errors with specific context', async () => {
      // Arrange
      const schemaErrorEvent = careEvents.createSchemaErrorCareEvent();
      mockEventValidator.setValidationResult(false, [
        { field: 'type', message: 'Unknown event type for care journey' }
      ]);

      // Act
      await careProducer.produce(KAFKA_TOPICS.CARE_EVENTS, schemaErrorEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ERROR_CODES.EVENT_SCHEMA_ERROR,
          message: expect.stringContaining('Invalid care event schema'),
          context: expect.objectContaining({
            journey: 'care',
            schemaVersion: expect.any(String)
          })
        })
      );
      expect(mockEventProcessor.processEvent).not.toHaveBeenCalled();
    });

    it('should handle plan journey processing errors with specific context', async () => {
      // Arrange
      const processingErrorEvent = planEvents.createProcessingErrorPlanEvent();
      mockEventValidator.setValidationResult(true);
      mockEventProcessor.setProcessingError('plan', ERROR_CODES.EVENT_PROCESSING_FAILED, 'Failed to process plan event');

      // Act
      await planProducer.produce(KAFKA_TOPICS.PLAN_EVENTS, processingErrorEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockEventValidator.validate).toHaveBeenCalled();
      expect(mockEventProcessor.processEvent).toHaveBeenCalled();
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ERROR_CODES.EVENT_PROCESSING_FAILED,
          message: expect.stringContaining('Failed to process plan event'),
          context: expect.objectContaining({
            journey: 'plan',
            eventType: expect.any(String),
            processingStage: expect.any(String)
          })
        })
      );
    });

    it('should route dead letter events to the correct journey-specific DLQ', async () => {
      // Arrange
      const deadLetterEvent = baseEvents.createBaseEvent({
        type: EventTypes.HEALTH_METRIC_RECORDED,
        payload: { metricType: 'INVALID_TYPE' }
      });
      mockEventValidator.setValidationResult(false);
      mockErrorHandler.expectDeadLetterQueue('health');

      // Act
      await healthProducer.produce(KAFKA_TOPICS.HEALTH_EVENTS, deadLetterEvent);
      await mockEventBroker.processNextMessage();

      // Assert
      expect(mockErrorHandler.sendToDeadLetterQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          journey: 'health',
          topic: KAFKA_TOPICS.HEALTH_EVENTS,
          event: expect.objectContaining({
            type: EventTypes.HEALTH_METRIC_RECORDED
          })
        })
      );
      expect(mockEventProcessor.processEvent).not.toHaveBeenCalled();
    });
  });
});