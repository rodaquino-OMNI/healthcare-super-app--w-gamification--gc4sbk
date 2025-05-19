/**
 * @file journey-integration.spec.ts
 * @description Unit tests for journey-specific Kafka integration, focusing on event schema validation,
 * message routing, and processing for health, care, and plan journeys.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';

import { KafkaService } from '../../../src/kafka/kafka.service';
import { AbstractKafkaConsumer } from '../../../src/kafka/kafka.consumer';
import { KafkaMessage } from '../../../src/kafka/kafka.interfaces';
import { 
  JourneyType, 
  HealthEventType, 
  CareEventType, 
  PlanEventType,
  JourneyEvent,
  HealthJourneyEvent,
  CareJourneyEvent,
  PlanJourneyEvent,
  isHealthJourneyEvent,
  isCareJourneyEvent,
  isPlanJourneyEvent,
  createCrossJourneyCorrelation,
  addEventToCorrelation,
  isCrossJourneyAchievementComplete,
  ICrossJourneyAchievementContext
} from '../../../src/interfaces/journey-events.interface';
import { EventValidationError, KafkaError } from '../../../src/kafka/kafka.errors';

// Mock implementation of a journey-specific consumer for testing
class JourneyKafkaConsumer extends AbstractKafkaConsumer {
  public processedEvents: JourneyEvent[] = [];
  public validationErrors: Error[] = [];
  public routingErrors: Error[] = [];
  
  constructor(kafkaService: KafkaService) {
    super(kafkaService, {
      groupId: 'journey-test-group',
      topics: ['health-events', 'care-events', 'plan-events'],
      enableDeadLetterQueue: true,
      enableCircuitBreaker: true
    });
  }
  
  // Implementation of the abstract method
  protected async processMessage(messageValue: any, originalMessage: KafkaMessage): Promise<void> {
    // Validate that the message is a valid journey event
    if (!this.isValidJourneyEvent(messageValue)) {
      const error = new EventValidationError(
        `Invalid journey event: ${JSON.stringify(messageValue)}`,
        undefined,
        { topic: originalMessage.topic, event: messageValue }
      );
      this.validationErrors.push(error);
      throw error;
    }
    
    // Route the message to the appropriate journey handler
    try {
      await this.routeJourneyEvent(messageValue as JourneyEvent);
      this.processedEvents.push(messageValue as JourneyEvent);
    } catch (error) {
      this.routingErrors.push(error as Error);
      throw error;
    }
  }
  
  // Helper method to validate journey events
  private isValidJourneyEvent(event: any): boolean {
    // Check if the event has the required properties
    if (!event || typeof event !== 'object') return false;
    if (!event.journeyType || !event.type || !event.payload) return false;
    if (!event.eventId || !event.timestamp || !event.version) return false;
    if (!event.source || !event.userId) return false;
    
    // Check if the journey type is valid
    if (!Object.values(JourneyType).includes(event.journeyType)) return false;
    
    // Validate event type based on journey type
    switch (event.journeyType) {
      case JourneyType.HEALTH:
        return Object.values(HealthEventType).includes(event.type);
      case JourneyType.CARE:
        return Object.values(CareEventType).includes(event.type);
      case JourneyType.PLAN:
        return Object.values(PlanEventType).includes(event.type);
      default:
        return false;
    }
  }
  
  // Helper method to route journey events to the appropriate handler
  private async routeJourneyEvent(event: JourneyEvent): Promise<void> {
    if (isHealthJourneyEvent(event)) {
      await this.handleHealthJourneyEvent(event);
    } else if (isCareJourneyEvent(event)) {
      await this.handleCareJourneyEvent(event);
    } else if (isPlanJourneyEvent(event)) {
      await this.handlePlanJourneyEvent(event);
    } else {
      throw new Error(`Unknown journey type: ${(event as any).journeyType}`);
    }
  }
  
  // Handler for health journey events
  private async handleHealthJourneyEvent(event: HealthJourneyEvent): Promise<void> {
    // In a real implementation, this would process the health event
    // For testing, we just verify the event type
    if (!Object.values(HealthEventType).includes(event.type as HealthEventType)) {
      throw new Error(`Invalid health event type: ${event.type}`);
    }
  }
  
  // Handler for care journey events
  private async handleCareJourneyEvent(event: CareJourneyEvent): Promise<void> {
    // In a real implementation, this would process the care event
    // For testing, we just verify the event type
    if (!Object.values(CareEventType).includes(event.type as CareEventType)) {
      throw new Error(`Invalid care event type: ${event.type}`);
    }
  }
  
  // Handler for plan journey events
  private async handlePlanJourneyEvent(event: PlanJourneyEvent): Promise<void> {
    // In a real implementation, this would process the plan event
    // For testing, we just verify the event type
    if (!Object.values(PlanEventType).includes(event.type as PlanEventType)) {
      throw new Error(`Invalid plan event type: ${event.type}`);
    }
  }
  
  // Expose the protected method for testing
  public async testHandleMessage(message: KafkaMessage): Promise<void> {
    await this.handleMessage(message);
  }
  
  // Reset the test state
  public reset(): void {
    this.processedEvents = [];
    this.validationErrors = [];
    this.routingErrors = [];
  }
}

describe('Journey Kafka Integration', () => {
  let kafkaService: MockProxy<KafkaService>;
  let journeyConsumer: JourneyKafkaConsumer;
  
  beforeEach(async () => {
    // Create a mock KafkaService
    kafkaService = mock<KafkaService>();
    
    // Configure the mock to return a mock consumer
    kafkaService.getConsumer.mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockResolvedValue(undefined),
      commitOffsets: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      resume: jest.fn(),
      seek: jest.fn().mockResolvedValue(undefined),
      connected: true
    } as any);
    
    // Create the journey consumer
    journeyConsumer = new JourneyKafkaConsumer(kafkaService);
    
    // Reset the consumer state before each test
    journeyConsumer.reset();
  });
  
  describe('Event Schema Validation', () => {
    it('should validate a valid health journey event', async () => {
      // Create a valid health journey event
      const healthEvent: HealthJourneyEvent = {
        eventId: 'test-event-1',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user-123',
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'health-events',
        partition: 0,
        offset: '0',
        value: healthEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was processed
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.processedEvents[0]).toEqual(healthEvent);
      expect(journeyConsumer.validationErrors).toHaveLength(0);
    });
    
    it('should validate a valid care journey event', async () => {
      // Create a valid care journey event
      const careEvent: CareJourneyEvent = {
        eventId: 'test-event-2',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journeyType: JourneyType.CARE,
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user-123',
        payload: {
          appointment: { id: 'appointment-1', status: 'SCHEDULED' } as any,
          provider: 'Dr. Smith',
          appointmentDate: new Date().toISOString(),
          appointmentType: 'CONSULTATION',
          isFirstAppointment: true,
          isUrgent: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'care-events',
        partition: 0,
        offset: '0',
        value: careEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was processed
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.processedEvents[0]).toEqual(careEvent);
      expect(journeyConsumer.validationErrors).toHaveLength(0);
    });
    
    it('should validate a valid plan journey event', async () => {
      // Create a valid plan journey event
      const planEvent: PlanJourneyEvent = {
        eventId: 'test-event-3',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        journeyType: JourneyType.PLAN,
        type: PlanEventType.CLAIM_SUBMITTED,
        userId: 'user-123',
        payload: {
          claim: { id: 'claim-1', status: 'SUBMITTED' } as any,
          submissionDate: new Date().toISOString(),
          amount: 100.0,
          serviceDate: new Date().toISOString(),
          provider: 'Medical Center',
          hasDocuments: true,
          documentCount: 2,
          isFirstClaim: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'plan-events',
        partition: 0,
        offset: '0',
        value: planEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was processed
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.processedEvents[0]).toEqual(planEvent);
      expect(journeyConsumer.validationErrors).toHaveLength(0);
    });
    
    it('should reject an event with missing required fields', async () => {
      // Create an invalid event missing required fields
      const invalidEvent = {
        eventId: 'test-event-4',
        timestamp: new Date().toISOString(),
        // Missing version
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: HealthEventType.METRIC_RECORDED,
        // Missing userId
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'health-events',
        partition: 0,
        offset: '0',
        value: invalidEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message and expect it to throw
      await expect(journeyConsumer.testHandleMessage(message)).rejects.toThrow(EventValidationError);
      
      // Verify that the event was not processed
      expect(journeyConsumer.processedEvents).toHaveLength(0);
      expect(journeyConsumer.validationErrors).toHaveLength(1);
    });
    
    it('should reject an event with invalid journey type', async () => {
      // Create an invalid event with an invalid journey type
      const invalidEvent = {
        eventId: 'test-event-5',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: 'invalid-journey', // Invalid journey type
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user-123',
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'health-events',
        partition: 0,
        offset: '0',
        value: invalidEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message and expect it to throw
      await expect(journeyConsumer.testHandleMessage(message)).rejects.toThrow(EventValidationError);
      
      // Verify that the event was not processed
      expect(journeyConsumer.processedEvents).toHaveLength(0);
      expect(journeyConsumer.validationErrors).toHaveLength(1);
    });
    
    it('should reject an event with mismatched journey type and event type', async () => {
      // Create an invalid event with mismatched journey type and event type
      const invalidEvent = {
        eventId: 'test-event-6',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: CareEventType.APPOINTMENT_BOOKED, // Care event type with Health journey type
        userId: 'user-123',
        payload: {
          appointment: { id: 'appointment-1', status: 'SCHEDULED' } as any,
          provider: 'Dr. Smith',
          appointmentDate: new Date().toISOString(),
          appointmentType: 'CONSULTATION',
          isFirstAppointment: true,
          isUrgent: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'health-events',
        partition: 0,
        offset: '0',
        value: invalidEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message and expect it to throw
      await expect(journeyConsumer.testHandleMessage(message)).rejects.toThrow(EventValidationError);
      
      // Verify that the event was not processed
      expect(journeyConsumer.processedEvents).toHaveLength(0);
      expect(journeyConsumer.validationErrors).toHaveLength(1);
    });
  });
  
  describe('Event Routing', () => {
    it('should route health events to the health journey handler', async () => {
      // Create a valid health journey event
      const healthEvent: HealthJourneyEvent = {
        eventId: 'test-event-7',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user-123',
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'health-events',
        partition: 0,
        offset: '0',
        value: healthEvent,
        timestamp: Date.now().toString()
      };
      
      // Spy on the handler method
      const handleSpy = jest.spyOn(journeyConsumer as any, 'handleHealthJourneyEvent');
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was routed to the health journey handler
      expect(handleSpy).toHaveBeenCalledWith(healthEvent);
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.routingErrors).toHaveLength(0);
    });
    
    it('should route care events to the care journey handler', async () => {
      // Create a valid care journey event
      const careEvent: CareJourneyEvent = {
        eventId: 'test-event-8',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journeyType: JourneyType.CARE,
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user-123',
        payload: {
          appointment: { id: 'appointment-1', status: 'SCHEDULED' } as any,
          provider: 'Dr. Smith',
          appointmentDate: new Date().toISOString(),
          appointmentType: 'CONSULTATION',
          isFirstAppointment: true,
          isUrgent: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'care-events',
        partition: 0,
        offset: '0',
        value: careEvent,
        timestamp: Date.now().toString()
      };
      
      // Spy on the handler method
      const handleSpy = jest.spyOn(journeyConsumer as any, 'handleCareJourneyEvent');
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was routed to the care journey handler
      expect(handleSpy).toHaveBeenCalledWith(careEvent);
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.routingErrors).toHaveLength(0);
    });
    
    it('should route plan events to the plan journey handler', async () => {
      // Create a valid plan journey event
      const planEvent: PlanJourneyEvent = {
        eventId: 'test-event-9',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        journeyType: JourneyType.PLAN,
        type: PlanEventType.CLAIM_SUBMITTED,
        userId: 'user-123',
        payload: {
          claim: { id: 'claim-1', status: 'SUBMITTED' } as any,
          submissionDate: new Date().toISOString(),
          amount: 100.0,
          serviceDate: new Date().toISOString(),
          provider: 'Medical Center',
          hasDocuments: true,
          documentCount: 2,
          isFirstClaim: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'plan-events',
        partition: 0,
        offset: '0',
        value: planEvent,
        timestamp: Date.now().toString()
      };
      
      // Spy on the handler method
      const handleSpy = jest.spyOn(journeyConsumer as any, 'handlePlanJourneyEvent');
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was routed to the plan journey handler
      expect(handleSpy).toHaveBeenCalledWith(planEvent);
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.routingErrors).toHaveLength(0);
    });
  });
  
  describe('Cross-Journey Event Correlation', () => {
    it('should create a cross-journey correlation', () => {
      // Create a health journey event
      const healthEvent: HealthJourneyEvent = {
        eventId: 'test-event-10',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user-123',
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      // Create a correlation with the health event
      const correlation = createCrossJourneyCorrelation('user-123', healthEvent);
      
      // Verify the correlation
      expect(correlation.userId).toBe('user-123');
      expect(correlation.journeyEvents[JourneyType.HEALTH]).toContain(healthEvent.eventId);
      expect(correlation.correlationId).toBeDefined();
      expect(correlation.createdAt).toBeDefined();
      expect(correlation.updatedAt).toBeDefined();
    });
    
    it('should add events to an existing correlation', () => {
      // Create a health journey event
      const healthEvent: HealthJourneyEvent = {
        eventId: 'test-event-11',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user-123',
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      // Create a care journey event
      const careEvent: CareJourneyEvent = {
        eventId: 'test-event-12',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journeyType: JourneyType.CARE,
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user-123',
        payload: {
          appointment: { id: 'appointment-1', status: 'SCHEDULED' } as any,
          provider: 'Dr. Smith',
          appointmentDate: new Date().toISOString(),
          appointmentType: 'CONSULTATION',
          isFirstAppointment: true,
          isUrgent: false
        }
      };
      
      // Create a correlation with the health event
      const correlation = createCrossJourneyCorrelation('user-123', healthEvent);
      
      // Add the care event to the correlation
      const updatedCorrelation = addEventToCorrelation(correlation, careEvent);
      
      // Verify the updated correlation
      expect(updatedCorrelation.userId).toBe('user-123');
      expect(updatedCorrelation.journeyEvents[JourneyType.HEALTH]).toContain(healthEvent.eventId);
      expect(updatedCorrelation.journeyEvents[JourneyType.CARE]).toContain(careEvent.eventId);
      expect(updatedCorrelation.updatedAt).not.toBe(correlation.updatedAt);
    });
    
    it('should check if a cross-journey achievement is complete', () => {
      // Create an achievement context with requirements from all journeys
      const achievementContext: ICrossJourneyAchievementContext = {
        achievementId: 'achievement-1',
        userId: 'user-123',
        requiredEvents: {
          [JourneyType.HEALTH]: [HealthEventType.METRIC_RECORDED],
          [JourneyType.CARE]: [CareEventType.APPOINTMENT_BOOKED],
          [JourneyType.PLAN]: [PlanEventType.CLAIM_SUBMITTED]
        },
        completedEvents: {
          [JourneyType.HEALTH]: [
            {
              eventType: HealthEventType.METRIC_RECORDED,
              eventId: 'test-event-13',
              timestamp: new Date().toISOString()
            }
          ],
          [JourneyType.CARE]: [
            {
              eventType: CareEventType.APPOINTMENT_BOOKED,
              eventId: 'test-event-14',
              timestamp: new Date().toISOString()
            }
          ],
          // Plan journey event is missing
        },
        progressPercentage: 66.67,
        isUnlocked: false
      };
      
      // Check if the achievement is complete (should be false)
      expect(isCrossJourneyAchievementComplete(achievementContext)).toBe(false);
      
      // Add the missing plan journey event
      const updatedContext: ICrossJourneyAchievementContext = {
        ...achievementContext,
        completedEvents: {
          ...achievementContext.completedEvents,
          [JourneyType.PLAN]: [
            {
              eventType: PlanEventType.CLAIM_SUBMITTED,
              eventId: 'test-event-15',
              timestamp: new Date().toISOString()
            }
          ]
        },
        progressPercentage: 100,
      };
      
      // Check if the achievement is complete (should be true)
      expect(isCrossJourneyAchievementComplete(updatedContext)).toBe(true);
    });
  });
  
  describe('Journey-Specific Error Handling', () => {
    it('should handle errors in health journey event processing', async () => {
      // Create a valid health journey event with an invalid event type
      const healthEvent = {
        eventId: 'test-event-16',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: 'invalid-health-event-type', // Invalid event type
        userId: 'user-123',
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'health-events',
        partition: 0,
        offset: '0',
        value: healthEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message and expect it to throw
      await expect(journeyConsumer.testHandleMessage(message)).rejects.toThrow(EventValidationError);
      
      // Verify that the event was not processed
      expect(journeyConsumer.processedEvents).toHaveLength(0);
      expect(journeyConsumer.validationErrors).toHaveLength(1);
    });
    
    it('should handle errors in care journey event processing', async () => {
      // Create a valid care journey event with an invalid event type
      const careEvent = {
        eventId: 'test-event-17',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journeyType: JourneyType.CARE,
        type: 'invalid-care-event-type', // Invalid event type
        userId: 'user-123',
        payload: {
          appointment: { id: 'appointment-1', status: 'SCHEDULED' } as any,
          provider: 'Dr. Smith',
          appointmentDate: new Date().toISOString(),
          appointmentType: 'CONSULTATION',
          isFirstAppointment: true,
          isUrgent: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'care-events',
        partition: 0,
        offset: '0',
        value: careEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message and expect it to throw
      await expect(journeyConsumer.testHandleMessage(message)).rejects.toThrow(EventValidationError);
      
      // Verify that the event was not processed
      expect(journeyConsumer.processedEvents).toHaveLength(0);
      expect(journeyConsumer.validationErrors).toHaveLength(1);
    });
    
    it('should handle errors in plan journey event processing', async () => {
      // Create a valid plan journey event with an invalid event type
      const planEvent = {
        eventId: 'test-event-18',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        journeyType: JourneyType.PLAN,
        type: 'invalid-plan-event-type', // Invalid event type
        userId: 'user-123',
        payload: {
          claim: { id: 'claim-1', status: 'SUBMITTED' } as any,
          submissionDate: new Date().toISOString(),
          amount: 100.0,
          serviceDate: new Date().toISOString(),
          provider: 'Medical Center',
          hasDocuments: true,
          documentCount: 2,
          isFirstClaim: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'plan-events',
        partition: 0,
        offset: '0',
        value: planEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message and expect it to throw
      await expect(journeyConsumer.testHandleMessage(message)).rejects.toThrow(EventValidationError);
      
      // Verify that the event was not processed
      expect(journeyConsumer.processedEvents).toHaveLength(0);
      expect(journeyConsumer.validationErrors).toHaveLength(1);
    });
  });
  
  describe('Gamification Integration', () => {
    it('should process health metric recording events for gamification', async () => {
      // Create a health metric recording event
      const healthEvent: HealthJourneyEvent = {
        eventId: 'test-event-19',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user-123',
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'health-events',
        partition: 0,
        offset: '0',
        value: healthEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was processed
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.processedEvents[0]).toEqual(healthEvent);
      expect(journeyConsumer.validationErrors).toHaveLength(0);
    });
    
    it('should process appointment booking events for gamification', async () => {
      // Create an appointment booking event
      const careEvent: CareJourneyEvent = {
        eventId: 'test-event-20',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journeyType: JourneyType.CARE,
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user-123',
        payload: {
          appointment: { id: 'appointment-1', status: 'SCHEDULED' } as any,
          provider: 'Dr. Smith',
          appointmentDate: new Date().toISOString(),
          appointmentType: 'CONSULTATION',
          isFirstAppointment: true,
          isUrgent: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'care-events',
        partition: 0,
        offset: '0',
        value: careEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was processed
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.processedEvents[0]).toEqual(careEvent);
      expect(journeyConsumer.validationErrors).toHaveLength(0);
    });
    
    it('should process claim submission events for gamification', async () => {
      // Create a claim submission event
      const planEvent: PlanJourneyEvent = {
        eventId: 'test-event-21',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        journeyType: JourneyType.PLAN,
        type: PlanEventType.CLAIM_SUBMITTED,
        userId: 'user-123',
        payload: {
          claim: { id: 'claim-1', status: 'SUBMITTED' } as any,
          submissionDate: new Date().toISOString(),
          amount: 100.0,
          serviceDate: new Date().toISOString(),
          provider: 'Medical Center',
          hasDocuments: true,
          documentCount: 2,
          isFirstClaim: false
        }
      };
      
      // Create a Kafka message with the event
      const message: KafkaMessage = {
        topic: 'plan-events',
        partition: 0,
        offset: '0',
        value: planEvent,
        timestamp: Date.now().toString()
      };
      
      // Process the message
      await journeyConsumer.testHandleMessage(message);
      
      // Verify that the event was processed
      expect(journeyConsumer.processedEvents).toHaveLength(1);
      expect(journeyConsumer.processedEvents[0]).toEqual(planEvent);
      expect(journeyConsumer.validationErrors).toHaveLength(0);
    });
    
    it('should track cross-journey achievements', () => {
      // Create events from different journeys
      const healthEvent: HealthJourneyEvent = {
        eventId: 'test-event-22',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journeyType: JourneyType.HEALTH,
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user-123',
        correlationId: 'corr-123', // Same correlation ID for all events
        payload: {
          metric: { id: 'metric-1', name: 'Heart Rate' } as any,
          metricType: 'HEART_RATE' as any,
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual'
        }
      };
      
      const careEvent: CareJourneyEvent = {
        eventId: 'test-event-23',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journeyType: JourneyType.CARE,
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user-123',
        correlationId: 'corr-123', // Same correlation ID for all events
        payload: {
          appointment: { id: 'appointment-1', status: 'SCHEDULED' } as any,
          provider: 'Dr. Smith',
          appointmentDate: new Date().toISOString(),
          appointmentType: 'CONSULTATION',
          isFirstAppointment: true,
          isUrgent: false
        }
      };
      
      const planEvent: PlanJourneyEvent = {
        eventId: 'test-event-24',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        journeyType: JourneyType.PLAN,
        type: PlanEventType.CLAIM_SUBMITTED,
        userId: 'user-123',
        correlationId: 'corr-123', // Same correlation ID for all events
        payload: {
          claim: { id: 'claim-1', status: 'SUBMITTED' } as any,
          submissionDate: new Date().toISOString(),
          amount: 100.0,
          serviceDate: new Date().toISOString(),
          provider: 'Medical Center',
          hasDocuments: true,
          documentCount: 2,
          isFirstClaim: false
        }
      };
      
      // Create an achievement context with requirements from all journeys
      const achievementContext: ICrossJourneyAchievementContext = {
        achievementId: 'achievement-2',
        userId: 'user-123',
        requiredEvents: {
          [JourneyType.HEALTH]: [HealthEventType.METRIC_RECORDED],
          [JourneyType.CARE]: [CareEventType.APPOINTMENT_BOOKED],
          [JourneyType.PLAN]: [PlanEventType.CLAIM_SUBMITTED]
        },
        completedEvents: {},
        progressPercentage: 0,
        isUnlocked: false
      };
      
      // Add the health event to the achievement context
      const contextWithHealth: ICrossJourneyAchievementContext = {
        ...achievementContext,
        completedEvents: {
          [JourneyType.HEALTH]: [
            {
              eventType: healthEvent.type as HealthEventType,
              eventId: healthEvent.eventId,
              timestamp: healthEvent.timestamp
            }
          ]
        },
        progressPercentage: 33.33
      };
      
      // Add the care event to the achievement context
      const contextWithHealthAndCare: ICrossJourneyAchievementContext = {
        ...contextWithHealth,
        completedEvents: {
          ...contextWithHealth.completedEvents,
          [JourneyType.CARE]: [
            {
              eventType: careEvent.type as CareEventType,
              eventId: careEvent.eventId,
              timestamp: careEvent.timestamp
            }
          ]
        },
        progressPercentage: 66.67
      };
      
      // Add the plan event to the achievement context
      const contextWithAllEvents: ICrossJourneyAchievementContext = {
        ...contextWithHealthAndCare,
        completedEvents: {
          ...contextWithHealthAndCare.completedEvents,
          [JourneyType.PLAN]: [
            {
              eventType: planEvent.type as PlanEventType,
              eventId: planEvent.eventId,
              timestamp: planEvent.timestamp
            }
          ]
        },
        progressPercentage: 100
      };
      
      // Check if the achievement is complete at each stage
      expect(isCrossJourneyAchievementComplete(achievementContext)).toBe(false);
      expect(isCrossJourneyAchievementComplete(contextWithHealth)).toBe(false);
      expect(isCrossJourneyAchievementComplete(contextWithHealthAndCare)).toBe(false);
      expect(isCrossJourneyAchievementComplete(contextWithAllEvents)).toBe(true);
    });
  });
});