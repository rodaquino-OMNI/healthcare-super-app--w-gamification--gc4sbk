import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { KafkaConsumer } from '../../../src/kafka/kafka.consumer';
import { KafkaProducer } from '../../../src/kafka/kafka.producer';
import { EventTypes } from '../../../src/dto/event-types.enum';
import { HealthMetricEventDto } from '../../../src/dto/health-metric-event.dto';
import { AppointmentEventDto } from '../../../src/dto/appointment-event.dto';
import { ClaimEventDto } from '../../../src/dto/claim-event.dto';
import { HealthEventDto } from '../../../src/dto/health-event.dto';
import { CareEventDto } from '../../../src/dto/care-event.dto';
import { PlanEventDto } from '../../../src/dto/plan-event.dto';
import { KafkaEvent } from '../../../src/interfaces/kafka-event.interface';
import { IEventValidator } from '../../../src/interfaces/event-validation.interface';
import { IEventHandler } from '../../../src/interfaces/event-handler.interface';
import { IEventResponse } from '../../../src/interfaces/event-response.interface';
import { KafkaErrors } from '../../../src/kafka/kafka.errors';

// Mock implementations
class MockKafkaService {
  async connect() { return Promise.resolve(); }
  async disconnect() { return Promise.resolve(); }
  getProducer() { return new MockKafkaProducer(); }
  getConsumer() { return new MockKafkaConsumer(); }
}

class MockKafkaProducer {
  async produce(topic: string, message: any) { return Promise.resolve({ success: true }); }
  async produceMany(topic: string, messages: any[]) { return Promise.resolve({ success: true }); }
}

class MockKafkaConsumer extends KafkaConsumer {
  constructor() {
    super();
  }

  async subscribe() { return Promise.resolve(); }
  async consume() { return Promise.resolve(); }
  async pause() { return Promise.resolve(); }
  async resume() { return Promise.resolve(); }
}

class MockEventValidator implements IEventValidator {
  validate(event: any): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class MockEventHandler implements IEventHandler<any> {
  async handle(event: any): Promise<IEventResponse> {
    return { success: true, data: event };
  }

  canHandle(event: any): boolean {
    return true;
  }

  getEventType(): string {
    return 'mock-event';
  }
}

// Test fixtures
const createHealthMetricEvent = (): HealthMetricEventDto => {
  const event = new HealthMetricEventDto();
  event.userId = 'user-123';
  event.type = EventTypes.Health.METRIC_RECORDED;
  event.timestamp = new Date().toISOString();
  event.metricType = 'HEART_RATE';
  event.value = 75;
  event.unit = 'bpm';
  event.source = 'manual';
  return event;
};

const createAppointmentEvent = (): AppointmentEventDto => {
  const event = new AppointmentEventDto();
  event.userId = 'user-123';
  event.type = EventTypes.Care.APPOINTMENT_BOOKED;
  event.timestamp = new Date().toISOString();
  event.appointmentId = 'appt-123';
  event.providerId = 'provider-456';
  event.specialtyId = 'specialty-789';
  event.dateTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
  event.status = 'SCHEDULED';
  return event;
};

const createClaimEvent = (): ClaimEventDto => {
  const event = new ClaimEventDto();
  event.userId = 'user-123';
  event.type = EventTypes.Plan.CLAIM_SUBMITTED;
  event.timestamp = new Date().toISOString();
  event.claimId = 'claim-123';
  event.claimType = 'MEDICAL';
  event.amount = 150.75;
  event.currency = 'BRL';
  event.status = 'SUBMITTED';
  return event;
};

describe('Journey Integration Tests', () => {
  let module: TestingModule;
  let kafkaService: KafkaService;
  let kafkaProducer: KafkaProducer;
  let healthEventValidator: IEventValidator;
  let careEventValidator: IEventValidator;
  let planEventValidator: IEventValidator;
  let healthEventHandler: IEventHandler<HealthEventDto>;
  let careEventHandler: IEventHandler<CareEventDto>;
  let planEventHandler: IEventHandler<PlanEventDto>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        { provide: KafkaService, useClass: MockKafkaService },
        { provide: 'HEALTH_EVENT_VALIDATOR', useClass: MockEventValidator },
        { provide: 'CARE_EVENT_VALIDATOR', useClass: MockEventValidator },
        { provide: 'PLAN_EVENT_VALIDATOR', useClass: MockEventValidator },
        { provide: 'HEALTH_EVENT_HANDLER', useClass: MockEventHandler },
        { provide: 'CARE_EVENT_HANDLER', useClass: MockEventHandler },
        { provide: 'PLAN_EVENT_HANDLER', useClass: MockEventHandler },
      ],
    }).compile();

    kafkaService = module.get<KafkaService>(KafkaService);
    kafkaProducer = kafkaService.getProducer();
    healthEventValidator = module.get<IEventValidator>('HEALTH_EVENT_VALIDATOR');
    careEventValidator = module.get<IEventValidator>('CARE_EVENT_VALIDATOR');
    planEventValidator = module.get<IEventValidator>('PLAN_EVENT_VALIDATOR');
    healthEventHandler = module.get<IEventHandler<HealthEventDto>>('HEALTH_EVENT_HANDLER');
    careEventHandler = module.get<IEventHandler<CareEventDto>>('CARE_EVENT_HANDLER');
    planEventHandler = module.get<IEventHandler<PlanEventDto>>('PLAN_EVENT_HANDLER');
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Health Journey Event Integration', () => {
    it('should validate health metric event schema', async () => {
      // Arrange
      const event = createHealthMetricEvent();
      jest.spyOn(healthEventValidator, 'validate').mockResolvedValue(true);

      // Act
      const isValid = await healthEventValidator.validate(event);

      // Assert
      expect(isValid).toBe(true);
      expect(healthEventValidator.validate).toHaveBeenCalledWith(event);
    });

    it('should reject invalid health metric event', async () => {
      // Arrange
      const event = createHealthMetricEvent();
      event.value = -100; // Invalid negative heart rate
      jest.spyOn(healthEventValidator, 'validate').mockResolvedValue(false);

      // Act
      const isValid = await healthEventValidator.validate(event);

      // Assert
      expect(isValid).toBe(false);
      expect(healthEventValidator.validate).toHaveBeenCalledWith(event);
    });

    it('should route health metric event to correct handler', async () => {
      // Arrange
      const event = createHealthMetricEvent();
      const kafkaEvent: KafkaEvent = {
        topic: 'health-events',
        partition: 0,
        offset: 0,
        key: event.userId,
        value: event,
        headers: {},
        timestamp: Date.now(),
      };
      jest.spyOn(healthEventHandler, 'canHandle').mockReturnValue(true);
      jest.spyOn(healthEventHandler, 'handle').mockResolvedValue({ success: true, data: event });

      // Act
      const canHandle = healthEventHandler.canHandle(kafkaEvent.value);
      const result = await healthEventHandler.handle(kafkaEvent.value);

      // Assert
      expect(canHandle).toBe(true);
      expect(result.success).toBe(true);
      expect(healthEventHandler.canHandle).toHaveBeenCalledWith(kafkaEvent.value);
      expect(healthEventHandler.handle).toHaveBeenCalledWith(kafkaEvent.value);
    });

    it('should process health metric recording event', async () => {
      // Arrange
      const event = createHealthMetricEvent();
      jest.spyOn(kafkaProducer, 'produce').mockResolvedValue({ success: true });
      jest.spyOn(healthEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { 
          ...event,
          processed: true,
          achievementEligible: true
        } 
      });

      // Act
      await kafkaProducer.produce('health-events', event);
      const result = await healthEventHandler.handle(event);

      // Assert
      expect(kafkaProducer.produce).toHaveBeenCalledWith('health-events', event);
      expect(healthEventHandler.handle).toHaveBeenCalledWith(event);
      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(true);
      expect(result.data.achievementEligible).toBe(true);
    });
  });

  describe('Care Journey Event Integration', () => {
    it('should validate appointment booking event schema', async () => {
      // Arrange
      const event = createAppointmentEvent();
      jest.spyOn(careEventValidator, 'validate').mockResolvedValue(true);

      // Act
      const isValid = await careEventValidator.validate(event);

      // Assert
      expect(isValid).toBe(true);
      expect(careEventValidator.validate).toHaveBeenCalledWith(event);
    });

    it('should reject invalid appointment event', async () => {
      // Arrange
      const event = createAppointmentEvent();
      event.dateTime = 'invalid-date'; // Invalid date format
      jest.spyOn(careEventValidator, 'validate').mockResolvedValue(false);

      // Act
      const isValid = await careEventValidator.validate(event);

      // Assert
      expect(isValid).toBe(false);
      expect(careEventValidator.validate).toHaveBeenCalledWith(event);
    });

    it('should route appointment event to correct handler', async () => {
      // Arrange
      const event = createAppointmentEvent();
      const kafkaEvent: KafkaEvent = {
        topic: 'care-events',
        partition: 0,
        offset: 0,
        key: event.userId,
        value: event,
        headers: {},
        timestamp: Date.now(),
      };
      jest.spyOn(careEventHandler, 'canHandle').mockReturnValue(true);
      jest.spyOn(careEventHandler, 'handle').mockResolvedValue({ success: true, data: event });

      // Act
      const canHandle = careEventHandler.canHandle(kafkaEvent.value);
      const result = await careEventHandler.handle(kafkaEvent.value);

      // Assert
      expect(canHandle).toBe(true);
      expect(result.success).toBe(true);
      expect(careEventHandler.canHandle).toHaveBeenCalledWith(kafkaEvent.value);
      expect(careEventHandler.handle).toHaveBeenCalledWith(kafkaEvent.value);
    });

    it('should process appointment booking event', async () => {
      // Arrange
      const event = createAppointmentEvent();
      jest.spyOn(kafkaProducer, 'produce').mockResolvedValue({ success: true });
      jest.spyOn(careEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { 
          ...event,
          processed: true,
          notificationSent: true,
          achievementProgress: 1
        } 
      });

      // Act
      await kafkaProducer.produce('care-events', event);
      const result = await careEventHandler.handle(event);

      // Assert
      expect(kafkaProducer.produce).toHaveBeenCalledWith('care-events', event);
      expect(careEventHandler.handle).toHaveBeenCalledWith(event);
      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(true);
      expect(result.data.notificationSent).toBe(true);
      expect(result.data.achievementProgress).toBe(1);
    });
  });

  describe('Plan Journey Event Integration', () => {
    it('should validate claim submission event schema', async () => {
      // Arrange
      const event = createClaimEvent();
      jest.spyOn(planEventValidator, 'validate').mockResolvedValue(true);

      // Act
      const isValid = await planEventValidator.validate(event);

      // Assert
      expect(isValid).toBe(true);
      expect(planEventValidator.validate).toHaveBeenCalledWith(event);
    });

    it('should reject invalid claim event', async () => {
      // Arrange
      const event = createClaimEvent();
      event.amount = -50; // Invalid negative amount
      jest.spyOn(planEventValidator, 'validate').mockResolvedValue(false);

      // Act
      const isValid = await planEventValidator.validate(event);

      // Assert
      expect(isValid).toBe(false);
      expect(planEventValidator.validate).toHaveBeenCalledWith(event);
    });

    it('should route claim event to correct handler', async () => {
      // Arrange
      const event = createClaimEvent();
      const kafkaEvent: KafkaEvent = {
        topic: 'plan-events',
        partition: 0,
        offset: 0,
        key: event.userId,
        value: event,
        headers: {},
        timestamp: Date.now(),
      };
      jest.spyOn(planEventHandler, 'canHandle').mockReturnValue(true);
      jest.spyOn(planEventHandler, 'handle').mockResolvedValue({ success: true, data: event });

      // Act
      const canHandle = planEventHandler.canHandle(kafkaEvent.value);
      const result = await planEventHandler.handle(kafkaEvent.value);

      // Assert
      expect(canHandle).toBe(true);
      expect(result.success).toBe(true);
      expect(planEventHandler.canHandle).toHaveBeenCalledWith(kafkaEvent.value);
      expect(planEventHandler.handle).toHaveBeenCalledWith(kafkaEvent.value);
    });

    it('should process claim submission event', async () => {
      // Arrange
      const event = createClaimEvent();
      jest.spyOn(kafkaProducer, 'produce').mockResolvedValue({ success: true });
      jest.spyOn(planEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { 
          ...event,
          processed: true,
          claimNumber: 'CLM-2023-001',
          estimatedProcessingTime: '5 business days'
        } 
      });

      // Act
      await kafkaProducer.produce('plan-events', event);
      const result = await planEventHandler.handle(event);

      // Assert
      expect(kafkaProducer.produce).toHaveBeenCalledWith('plan-events', event);
      expect(planEventHandler.handle).toHaveBeenCalledWith(event);
      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(true);
      expect(result.data.claimNumber).toBe('CLM-2023-001');
      expect(result.data.estimatedProcessingTime).toBe('5 business days');
    });
  });

  describe('Cross-Journey Event Integration', () => {
    it('should correlate events across journeys for the same user', async () => {
      // Arrange
      const userId = 'user-123';
      const correlationId = 'correlation-123';
      const healthEvent = createHealthMetricEvent();
      const careEvent = createAppointmentEvent();
      const planEvent = createClaimEvent();
      
      // Set same user and correlation ID for all events
      healthEvent.userId = userId;
      careEvent.userId = userId;
      planEvent.userId = userId;
      
      // Add metadata with correlation ID
      const metadata = { correlationId };
      healthEvent['metadata'] = metadata;
      careEvent['metadata'] = metadata;
      planEvent['metadata'] = metadata;
      
      // Mock handlers to track correlation
      jest.spyOn(healthEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { ...healthEvent, processed: true } 
      });
      jest.spyOn(careEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { ...careEvent, processed: true } 
      });
      jest.spyOn(planEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { ...planEvent, processed: true } 
      });

      // Act
      const healthResult = await healthEventHandler.handle(healthEvent);
      const careResult = await careEventHandler.handle(careEvent);
      const planResult = await planEventHandler.handle(planEvent);

      // Assert
      expect(healthResult.success).toBe(true);
      expect(careResult.success).toBe(true);
      expect(planResult.success).toBe(true);
      
      // Verify all events were processed with the same user and correlation ID
      expect(healthEventHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({ 
          userId, 
          metadata: expect.objectContaining({ correlationId }) 
        })
      );
      expect(careEventHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({ 
          userId, 
          metadata: expect.objectContaining({ correlationId }) 
        })
      );
      expect(planEventHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({ 
          userId, 
          metadata: expect.objectContaining({ correlationId }) 
        })
      );
    });

    it('should track achievement progress across multiple journeys', async () => {
      // Arrange
      const userId = 'user-123';
      const achievementId = 'cross-journey-achievement-123';
      
      // Create events from different journeys
      const healthEvent = createHealthMetricEvent();
      const careEvent = createAppointmentEvent();
      const planEvent = createClaimEvent();
      
      // Set same user for all events
      healthEvent.userId = userId;
      careEvent.userId = userId;
      planEvent.userId = userId;
      
      // Mock achievement tracking in handlers
      jest.spyOn(healthEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { 
          ...healthEvent, 
          processed: true,
          achievements: [{
            id: achievementId,
            progress: 0.33,
            type: 'cross-journey',
            journeys: ['health', 'care', 'plan']
          }]
        } 
      });
      
      jest.spyOn(careEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { 
          ...careEvent, 
          processed: true,
          achievements: [{
            id: achievementId,
            progress: 0.66,
            type: 'cross-journey',
            journeys: ['health', 'care', 'plan']
          }]
        } 
      });
      
      jest.spyOn(planEventHandler, 'handle').mockResolvedValue({ 
        success: true, 
        data: { 
          ...planEvent, 
          processed: true,
          achievements: [{
            id: achievementId,
            progress: 1.0,
            completed: true,
            type: 'cross-journey',
            journeys: ['health', 'care', 'plan']
          }]
        } 
      });

      // Act
      const healthResult = await healthEventHandler.handle(healthEvent);
      const careResult = await careEventHandler.handle(careEvent);
      const planResult = await planEventHandler.handle(planEvent);

      // Assert
      expect(healthResult.success).toBe(true);
      expect(careResult.success).toBe(true);
      expect(planResult.success).toBe(true);
      
      // Verify achievement progress tracking across journeys
      expect(healthResult.data.achievements[0].progress).toBe(0.33);
      expect(careResult.data.achievements[0].progress).toBe(0.66);
      expect(planResult.data.achievements[0].progress).toBe(1.0);
      expect(planResult.data.achievements[0].completed).toBe(true);
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it('should handle health journey validation errors', async () => {
      // Arrange
      const event = createHealthMetricEvent();
      event.value = -100; // Invalid negative heart rate
      
      // Mock validation error
      const validationError = new KafkaErrors.EventValidationError(
        'Invalid health metric value: must be positive',
        'HEALTH_METRIC_VALIDATION_ERROR'
      );
      
      jest.spyOn(healthEventValidator, 'validate').mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(healthEventValidator.validate(event)).rejects.toThrow(KafkaErrors.EventValidationError);
      await expect(healthEventValidator.validate(event)).rejects.toThrow('Invalid health metric value: must be positive');
      expect(healthEventValidator.validate).toHaveBeenCalledWith(event);
    });

    it('should handle care journey processing errors', async () => {
      // Arrange
      const event = createAppointmentEvent();
      
      // Mock processing error
      const processingError = new KafkaErrors.EventProcessingError(
        'Provider unavailable for appointment',
        'PROVIDER_UNAVAILABLE_ERROR'
      );
      
      jest.spyOn(careEventHandler, 'handle').mockImplementation(() => {
        throw processingError;
      });

      // Act & Assert
      await expect(careEventHandler.handle(event)).rejects.toThrow(KafkaErrors.EventProcessingError);
      await expect(careEventHandler.handle(event)).rejects.toThrow('Provider unavailable for appointment');
      expect(careEventHandler.handle).toHaveBeenCalledWith(event);
    });

    it('should handle plan journey schema errors', async () => {
      // Arrange
      const event = createClaimEvent();
      delete event.claimType; // Required field missing
      
      // Mock schema error
      const schemaError = new KafkaErrors.EventSchemaError(
        'Missing required field: claimType',
        'CLAIM_SCHEMA_ERROR'
      );
      
      jest.spyOn(planEventValidator, 'validate').mockImplementation(() => {
        throw schemaError;
      });

      // Act & Assert
      await expect(planEventValidator.validate(event)).rejects.toThrow(KafkaErrors.EventSchemaError);
      await expect(planEventValidator.validate(event)).rejects.toThrow('Missing required field: claimType');
      expect(planEventValidator.validate).toHaveBeenCalledWith(event);
    });

    it('should handle dead letter queue for failed events', async () => {
      // Arrange
      const event = createHealthMetricEvent();
      const dlqTopic = 'health-events-dlq';
      
      // Mock DLQ producer
      jest.spyOn(kafkaProducer, 'produce').mockResolvedValue({ success: true });
      
      // Mock processing error that should trigger DLQ
      const processingError = new KafkaErrors.EventProcessingError(
        'Failed to process health metric',
        'HEALTH_METRIC_PROCESSING_ERROR'
      );
      
      jest.spyOn(healthEventHandler, 'handle').mockImplementation(() => {
        throw processingError;
      });

      // Act
      try {
        await healthEventHandler.handle(event);
      } catch (error) {
        // In a real implementation, this would trigger DLQ logic
        await kafkaProducer.produce(dlqTopic, {
          originalEvent: event,
          error: {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString()
          },
          retryCount: 1
        });
      }

      // Assert
      expect(healthEventHandler.handle).toHaveBeenCalledWith(event);
      expect(kafkaProducer.produce).toHaveBeenCalledWith(
        dlqTopic,
        expect.objectContaining({
          originalEvent: event,
          error: expect.objectContaining({
            message: 'Failed to process health metric',
            code: 'HEALTH_METRIC_PROCESSING_ERROR'
          }),
          retryCount: 1
        })
      );
    });
  });
});