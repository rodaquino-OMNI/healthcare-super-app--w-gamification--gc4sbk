import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';

// Import event DTOs
import { BaseEventDto } from '../../src/dto/base-event.dto';
import { HealthEventDto } from '../../src/dto/health-event.dto';
import { CareEventDto } from '../../src/dto/care-event.dto';
import { PlanEventDto } from '../../src/dto/plan-event.dto';
import { HealthMetricEventDto } from '../../src/dto/health-metric-event.dto';
import { HealthGoalEventDto } from '../../src/dto/health-goal-event.dto';
import { AppointmentEventDto } from '../../src/dto/appointment-event.dto';
import { MedicationEventDto } from '../../src/dto/medication-event.dto';
import { ClaimEventDto } from '../../src/dto/claim-event.dto';
import { BenefitEventDto } from '../../src/dto/benefit-event.dto';

// Import event types
import { EventTypes } from '../../src/dto/event-types.enum';

// Import interfaces
import { IEventHandler } from '../../src/interfaces/event-handler.interface';
import { IEventValidator } from '../../src/interfaces/event-validation.interface';
import { IEventResponse } from '../../src/interfaces/event-response.interface';
import { IKafkaEvent } from '../../src/interfaces/kafka-event.interface';

// Import test fixtures
import {
  healthEvents,
  careEvents,
  planEvents,
  baseEvents
} from '../fixtures';

// Import test utilities
import { MockKafkaClient } from '../utils/kafka-test-client';
import { waitForEvent } from '../utils/timing-helpers';
import { compareEvents } from '../utils/event-comparison';
import { validateEvent } from '../utils/event-validators';
import { createMockEvent } from '../utils/mock-events';

// Mock event handlers
class MockHealthEventHandler implements IEventHandler<HealthEventDto> {
  public readonly handledEvents: HealthEventDto[] = [];
  
  async handle(event: HealthEventDto): Promise<IEventResponse> {
    this.handledEvents.push(event);
    return { success: true };
  }
  
  canHandle(event: BaseEventDto): boolean {
    return event.journey === 'health';
  }
  
  getEventType(): string {
    return 'health';
  }
}

class MockCareEventHandler implements IEventHandler<CareEventDto> {
  public readonly handledEvents: CareEventDto[] = [];
  
  async handle(event: CareEventDto): Promise<IEventResponse> {
    this.handledEvents.push(event);
    return { success: true };
  }
  
  canHandle(event: BaseEventDto): boolean {
    return event.journey === 'care';
  }
  
  getEventType(): string {
    return 'care';
  }
}

class MockPlanEventHandler implements IEventHandler<PlanEventDto> {
  public readonly handledEvents: PlanEventDto[] = [];
  
  async handle(event: PlanEventDto): Promise<IEventResponse> {
    this.handledEvents.push(event);
    return { success: true };
  }
  
  canHandle(event: BaseEventDto): boolean {
    return event.journey === 'plan';
  }
  
  getEventType(): string {
    return 'plan';
  }
}

// Mock cross-journey event handler for achievement tracking
class MockAchievementEventHandler implements IEventHandler<BaseEventDto> {
  public readonly handledEvents: BaseEventDto[] = [];
  public readonly achievementsTriggered: Record<string, any>[] = [];
  
  async handle(event: BaseEventDto): Promise<IEventResponse> {
    this.handledEvents.push(event);
    
    // Simulate achievement processing based on event type
    if (event.type === EventTypes.Health.GOAL_ACHIEVED) {
      this.achievementsTriggered.push({
        userId: event.userId,
        achievementType: 'health-goal-completed',
        journeySource: 'health',
        points: 50
      });
    } else if (event.type === EventTypes.Care.APPOINTMENT_COMPLETED) {
      this.achievementsTriggered.push({
        userId: event.userId,
        achievementType: 'appointment-keeper',
        journeySource: 'care',
        points: 30
      });
    } else if (event.type === EventTypes.Plan.CLAIM_SUBMITTED) {
      this.achievementsTriggered.push({
        userId: event.userId,
        achievementType: 'claim-master',
        journeySource: 'plan',
        points: 40
      });
    }
    
    return { success: true };
  }
  
  canHandle(event: BaseEventDto): boolean {
    // This handler processes events from all journeys for achievement tracking
    return true;
  }
  
  getEventType(): string {
    return 'achievement';
  }
}

describe('Journey Events Integration', () => {
  let mockKafkaClient: MockKafkaClient;
  let healthEventHandler: MockHealthEventHandler;
  let careEventHandler: MockCareEventHandler;
  let planEventHandler: MockPlanEventHandler;
  let achievementEventHandler: MockAchievementEventHandler;
  
  beforeEach(async () => {
    // Set up mock handlers
    healthEventHandler = new MockHealthEventHandler();
    careEventHandler = new MockCareEventHandler();
    planEventHandler = new MockPlanEventHandler();
    achievementEventHandler = new MockAchievementEventHandler();
    
    // Set up mock Kafka client
    mockKafkaClient = new MockKafkaClient();
    
    // Register handlers with the mock Kafka client
    mockKafkaClient.registerHandler('health-events', healthEventHandler);
    mockKafkaClient.registerHandler('care-events', careEventHandler);
    mockKafkaClient.registerHandler('plan-events', planEventHandler);
    mockKafkaClient.registerHandler('achievement-events', achievementEventHandler);
  });
  
  afterEach(() => {
    // Clean up
    mockKafkaClient.reset();
  });
  
  describe('Health Journey Events', () => {
    it('should process health metric recording events', async () => {
      // Arrange
      const healthMetricEvent = healthEvents.createHealthMetricEvent({
        userId: 'user123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        source: 'smartwatch',
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('health-events', healthMetricEvent);
      await waitForEvent(() => healthEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(healthEventHandler.handledEvents).toHaveLength(1);
      expect(healthEventHandler.handledEvents[0].type).toBe(EventTypes.Health.METRIC_RECORDED);
      expect(healthEventHandler.handledEvents[0].data.metricType).toBe('HEART_RATE');
      expect(validateEvent(healthEventHandler.handledEvents[0])).toBe(true);
    });
    
    it('should process health goal achievement events', async () => {
      // Arrange
      const goalAchievedEvent = healthEvents.createGoalAchievedEvent({
        userId: 'user123',
        goalId: 'goal456',
        goalType: 'STEPS',
        targetValue: 10000,
        achievedValue: 10500,
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('health-events', goalAchievedEvent);
      await waitForEvent(() => healthEventHandler.handledEvents.length > 0);
      await waitForEvent(() => achievementEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(healthEventHandler.handledEvents).toHaveLength(1);
      expect(healthEventHandler.handledEvents[0].type).toBe(EventTypes.Health.GOAL_ACHIEVED);
      expect(healthEventHandler.handledEvents[0].data.goalType).toBe('STEPS');
      expect(validateEvent(healthEventHandler.handledEvents[0])).toBe(true);
      
      // Check if achievement was triggered
      expect(achievementEventHandler.achievementsTriggered).toHaveLength(1);
      expect(achievementEventHandler.achievementsTriggered[0].achievementType).toBe('health-goal-completed');
    });
    
    it('should process device connection events', async () => {
      // Arrange
      const deviceConnectedEvent = healthEvents.createDeviceConnectedEvent({
        userId: 'user123',
        deviceId: 'device789',
        deviceType: 'SMARTWATCH',
        manufacturer: 'FitBit',
        model: 'Versa 3',
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('health-events', deviceConnectedEvent);
      await waitForEvent(() => healthEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(healthEventHandler.handledEvents).toHaveLength(1);
      expect(healthEventHandler.handledEvents[0].type).toBe(EventTypes.Health.DEVICE_CONNECTED);
      expect(healthEventHandler.handledEvents[0].data.deviceType).toBe('SMARTWATCH');
      expect(validateEvent(healthEventHandler.handledEvents[0])).toBe(true);
    });
    
    it('should reject invalid health metric events', async () => {
      // Arrange
      const invalidHealthMetricEvent = {
        ...healthEvents.createHealthMetricEvent({
          userId: 'user123',
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          source: 'smartwatch',
          timestamp: new Date().toISOString()
        }),
        // Remove required field to make it invalid
        data: {
          metricType: 'HEART_RATE',
          // Missing value field
          unit: 'bpm',
          source: 'smartwatch'
        }
      };
      
      // Act & Assert
      await expect(mockKafkaClient.produceEvent('health-events', invalidHealthMetricEvent))
        .rejects.toThrow();
      
      // Ensure no events were processed
      expect(healthEventHandler.handledEvents).toHaveLength(0);
    });
  });
  
  describe('Care Journey Events', () => {
    it('should process appointment booking events', async () => {
      // Arrange
      const appointmentBookedEvent = careEvents.createAppointmentBookedEvent({
        userId: 'user123',
        appointmentId: 'appt456',
        providerId: 'provider789',
        specialtyId: 'specialty123',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        appointmentType: 'IN_PERSON',
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('care-events', appointmentBookedEvent);
      await waitForEvent(() => careEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(careEventHandler.handledEvents).toHaveLength(1);
      expect(careEventHandler.handledEvents[0].type).toBe(EventTypes.Care.APPOINTMENT_BOOKED);
      expect(careEventHandler.handledEvents[0].data.appointmentType).toBe('IN_PERSON');
      expect(validateEvent(careEventHandler.handledEvents[0])).toBe(true);
    });
    
    it('should process appointment completion events', async () => {
      // Arrange
      const appointmentCompletedEvent = careEvents.createAppointmentCompletedEvent({
        userId: 'user123',
        appointmentId: 'appt456',
        providerId: 'provider789',
        completionDate: new Date().toISOString(),
        duration: 30, // minutes
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('care-events', appointmentCompletedEvent);
      await waitForEvent(() => careEventHandler.handledEvents.length > 0);
      await waitForEvent(() => achievementEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(careEventHandler.handledEvents).toHaveLength(1);
      expect(careEventHandler.handledEvents[0].type).toBe(EventTypes.Care.APPOINTMENT_COMPLETED);
      expect(validateEvent(careEventHandler.handledEvents[0])).toBe(true);
      
      // Check if achievement was triggered
      expect(achievementEventHandler.achievementsTriggered).toHaveLength(1);
      expect(achievementEventHandler.achievementsTriggered[0].achievementType).toBe('appointment-keeper');
    });
    
    it('should process medication adherence events', async () => {
      // Arrange
      const medicationTakenEvent = careEvents.createMedicationTakenEvent({
        userId: 'user123',
        medicationId: 'med456',
        medicationName: 'Aspirin',
        dosage: '100mg',
        scheduledTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        takenTime: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('care-events', medicationTakenEvent);
      await waitForEvent(() => careEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(careEventHandler.handledEvents).toHaveLength(1);
      expect(careEventHandler.handledEvents[0].type).toBe(EventTypes.Care.MEDICATION_TAKEN);
      expect(careEventHandler.handledEvents[0].data.medicationName).toBe('Aspirin');
      expect(validateEvent(careEventHandler.handledEvents[0])).toBe(true);
    });
    
    it('should reject invalid appointment events', async () => {
      // Arrange
      const invalidAppointmentEvent = {
        ...careEvents.createAppointmentBookedEvent({
          userId: 'user123',
          appointmentId: 'appt456',
          providerId: 'provider789',
          specialtyId: 'specialty123',
          appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          appointmentType: 'IN_PERSON',
          timestamp: new Date().toISOString()
        }),
        // Set invalid appointment date (in the past)
        data: {
          appointmentId: 'appt456',
          providerId: 'provider789',
          specialtyId: 'specialty123',
          appointmentDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          appointmentType: 'IN_PERSON'
        }
      };
      
      // Act & Assert
      await expect(mockKafkaClient.produceEvent('care-events', invalidAppointmentEvent))
        .rejects.toThrow();
      
      // Ensure no events were processed
      expect(careEventHandler.handledEvents).toHaveLength(0);
    });
  });
  
  describe('Plan Journey Events', () => {
    it('should process claim submission events', async () => {
      // Arrange
      const claimSubmittedEvent = planEvents.createClaimSubmittedEvent({
        userId: 'user123',
        claimId: 'claim456',
        claimType: 'MEDICAL_CONSULTATION',
        amount: 150.00,
        currency: 'BRL',
        serviceDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        providerId: 'provider789',
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('plan-events', claimSubmittedEvent);
      await waitForEvent(() => planEventHandler.handledEvents.length > 0);
      await waitForEvent(() => achievementEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(planEventHandler.handledEvents).toHaveLength(1);
      expect(planEventHandler.handledEvents[0].type).toBe(EventTypes.Plan.CLAIM_SUBMITTED);
      expect(planEventHandler.handledEvents[0].data.claimType).toBe('MEDICAL_CONSULTATION');
      expect(validateEvent(planEventHandler.handledEvents[0])).toBe(true);
      
      // Check if achievement was triggered
      expect(achievementEventHandler.achievementsTriggered).toHaveLength(1);
      expect(achievementEventHandler.achievementsTriggered[0].achievementType).toBe('claim-master');
    });
    
    it('should process benefit utilization events', async () => {
      // Arrange
      const benefitUtilizedEvent = planEvents.createBenefitUtilizedEvent({
        userId: 'user123',
        benefitId: 'benefit456',
        benefitType: 'GYM_MEMBERSHIP',
        utilizationDate: new Date().toISOString(),
        value: 100.00,
        currency: 'BRL',
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('plan-events', benefitUtilizedEvent);
      await waitForEvent(() => planEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(planEventHandler.handledEvents).toHaveLength(1);
      expect(planEventHandler.handledEvents[0].type).toBe(EventTypes.Plan.BENEFIT_UTILIZED);
      expect(planEventHandler.handledEvents[0].data.benefitType).toBe('GYM_MEMBERSHIP');
      expect(validateEvent(planEventHandler.handledEvents[0])).toBe(true);
    });
    
    it('should process plan selection events', async () => {
      // Arrange
      const planSelectedEvent = planEvents.createPlanSelectedEvent({
        userId: 'user123',
        planId: 'plan456',
        planType: 'PREMIUM',
        startDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
        annualValue: 5000.00,
        currency: 'BRL',
        timestamp: new Date().toISOString()
      });
      
      // Act
      await mockKafkaClient.produceEvent('plan-events', planSelectedEvent);
      await waitForEvent(() => planEventHandler.handledEvents.length > 0);
      
      // Assert
      expect(planEventHandler.handledEvents).toHaveLength(1);
      expect(planEventHandler.handledEvents[0].type).toBe(EventTypes.Plan.PLAN_SELECTED);
      expect(planEventHandler.handledEvents[0].data.planType).toBe('PREMIUM');
      expect(validateEvent(planEventHandler.handledEvents[0])).toBe(true);
    });
    
    it('should reject invalid claim events', async () => {
      // Arrange
      const invalidClaimEvent = {
        ...planEvents.createClaimSubmittedEvent({
          userId: 'user123',
          claimId: 'claim456',
          claimType: 'MEDICAL_CONSULTATION',
          amount: 150.00,
          currency: 'BRL',
          serviceDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
          providerId: 'provider789',
          timestamp: new Date().toISOString()
        }),
        // Set invalid amount (negative)
        data: {
          claimId: 'claim456',
          claimType: 'MEDICAL_CONSULTATION',
          amount: -150.00, // Negative amount
          currency: 'BRL',
          serviceDate: new Date(Date.now() - 604800000).toISOString(),
          providerId: 'provider789'
        }
      };
      
      // Act & Assert
      await expect(mockKafkaClient.produceEvent('plan-events', invalidClaimEvent))
        .rejects.toThrow();
      
      // Ensure no events were processed
      expect(planEventHandler.handledEvents).toHaveLength(0);
    });
  });
  
  describe('Cross-Journey Event Correlation', () => {
    it('should track achievements across multiple journeys', async () => {
      // Arrange - Create events from different journeys for the same user
      const userId = 'user123';
      const healthGoalEvent = healthEvents.createGoalAchievedEvent({
        userId,
        goalId: 'goal456',
        goalType: 'STEPS',
        targetValue: 10000,
        achievedValue: 10500,
        timestamp: new Date().toISOString()
      });
      
      const appointmentEvent = careEvents.createAppointmentCompletedEvent({
        userId,
        appointmentId: 'appt456',
        providerId: 'provider789',
        completionDate: new Date().toISOString(),
        duration: 30, // minutes
        timestamp: new Date().toISOString()
      });
      
      const claimEvent = planEvents.createClaimSubmittedEvent({
        userId,
        claimId: 'claim456',
        claimType: 'MEDICAL_CONSULTATION',
        amount: 150.00,
        currency: 'BRL',
        serviceDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        providerId: 'provider789',
        timestamp: new Date().toISOString()
      });
      
      // Act - Process events from all journeys
      await mockKafkaClient.produceEvent('health-events', healthGoalEvent);
      await mockKafkaClient.produceEvent('care-events', appointmentEvent);
      await mockKafkaClient.produceEvent('plan-events', claimEvent);
      
      // Wait for all events to be processed
      await waitForEvent(() => achievementEventHandler.handledEvents.length >= 3);
      
      // Assert - Check that achievements were triggered for all journeys
      expect(achievementEventHandler.handledEvents).toHaveLength(3);
      expect(achievementEventHandler.achievementsTriggered).toHaveLength(3);
      
      // Verify achievements from each journey
      const achievementTypes = achievementEventHandler.achievementsTriggered.map(a => a.achievementType);
      expect(achievementTypes).toContain('health-goal-completed');
      expect(achievementTypes).toContain('appointment-keeper');
      expect(achievementTypes).toContain('claim-master');
      
      // Verify all achievements are for the same user
      const userIds = achievementEventHandler.achievementsTriggered.map(a => a.userId);
      expect(userIds.every(id => id === userId)).toBe(true);
    });
    
    it('should correlate events across journeys with the same correlation ID', async () => {
      // Arrange - Create correlated events with the same correlation ID
      const correlationId = 'session-123456';
      const userId = 'user123';
      
      // Create a health metric event with correlation ID
      const healthMetricEvent = {
        ...healthEvents.createHealthMetricEvent({
          userId,
          metricType: 'BLOOD_PRESSURE',
          value: '120/80',
          unit: 'mmHg',
          source: 'medical-device',
          timestamp: new Date().toISOString()
        }),
        metadata: {
          correlationId,
          sessionId: 'telemedicine-session-789'
        }
      };
      
      // Create a care appointment event with the same correlation ID
      const appointmentEvent = {
        ...careEvents.createAppointmentCompletedEvent({
          userId,
          appointmentId: 'appt456',
          providerId: 'provider789',
          completionDate: new Date().toISOString(),
          duration: 30, // minutes
          timestamp: new Date().toISOString()
        }),
        metadata: {
          correlationId,
          sessionId: 'telemedicine-session-789'
        }
      };
      
      // Act - Process correlated events
      await mockKafkaClient.produceEvent('health-events', healthMetricEvent);
      await mockKafkaClient.produceEvent('care-events', appointmentEvent);
      
      // Wait for events to be processed
      await waitForEvent(() => 
        healthEventHandler.handledEvents.length > 0 && 
        careEventHandler.handledEvents.length > 0
      );
      
      // Assert - Verify correlation IDs are preserved
      expect(healthEventHandler.handledEvents[0].metadata?.correlationId).toBe(correlationId);
      expect(careEventHandler.handledEvents[0].metadata?.correlationId).toBe(correlationId);
      
      // Verify session IDs are preserved
      expect(healthEventHandler.handledEvents[0].metadata?.sessionId).toBe('telemedicine-session-789');
      expect(careEventHandler.handledEvents[0].metadata?.sessionId).toBe('telemedicine-session-789');
    });
    
    it('should process events in the correct order across journeys', async () => {
      // Arrange - Create a sequence of related events across journeys
      const userId = 'user123';
      const now = Date.now();
      
      // 1. First, an appointment is booked
      const appointmentBookedEvent = careEvents.createAppointmentBookedEvent({
        userId,
        appointmentId: 'appt456',
        providerId: 'provider789',
        specialtyId: 'specialty123',
        appointmentDate: new Date(now + 3600000).toISOString(), // 1 hour from now
        appointmentType: 'TELEMEDICINE',
        timestamp: new Date(now - 86400000).toISOString() // 1 day ago
      });
      
      // 2. Then, the appointment is completed
      const appointmentCompletedEvent = careEvents.createAppointmentCompletedEvent({
        userId,
        appointmentId: 'appt456',
        providerId: 'provider789',
        completionDate: new Date(now).toISOString(), // Now
        duration: 30, // minutes
        timestamp: new Date(now).toISOString() // Now
      });
      
      // 3. Health metrics are recorded during the appointment
      const healthMetricEvent = healthEvents.createHealthMetricEvent({
        userId,
        metricType: 'BLOOD_PRESSURE',
        value: '120/80',
        unit: 'mmHg',
        source: 'medical-device',
        timestamp: new Date(now + 900000).toISOString() // 15 minutes after now
      });
      
      // 4. Finally, a claim is submitted for the appointment
      const claimSubmittedEvent = planEvents.createClaimSubmittedEvent({
        userId,
        claimId: 'claim456',
        claimType: 'TELEMEDICINE_CONSULTATION',
        amount: 100.00,
        currency: 'BRL',
        serviceDate: new Date(now).toISOString(), // Now
        providerId: 'provider789',
        timestamp: new Date(now + 3600000).toISOString() // 1 hour from now
      });
      
      // Act - Process events in a different order than their timestamps
      await mockKafkaClient.produceEvent('plan-events', claimSubmittedEvent); // 4th event first
      await mockKafkaClient.produceEvent('health-events', healthMetricEvent); // 3rd event second
      await mockKafkaClient.produceEvent('care-events', appointmentCompletedEvent); // 2nd event third
      await mockKafkaClient.produceEvent('care-events', appointmentBookedEvent); // 1st event last
      
      // Wait for all events to be processed
      await waitForEvent(() => 
        careEventHandler.handledEvents.length >= 2 && 
        healthEventHandler.handledEvents.length >= 1 &&
        planEventHandler.handledEvents.length >= 1
      );
      
      // Assert - Verify all events were processed
      expect(careEventHandler.handledEvents).toHaveLength(2);
      expect(healthEventHandler.handledEvents).toHaveLength(1);
      expect(planEventHandler.handledEvents).toHaveLength(1);
      
      // Verify events can be ordered by timestamp if needed
      const allEvents = [
        ...careEventHandler.handledEvents,
        ...healthEventHandler.handledEvents,
        ...planEventHandler.handledEvents
      ];
      
      // Sort events by timestamp
      const sortedEvents = [...allEvents].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Verify correct order by timestamp
      expect(sortedEvents[0].type).toBe(EventTypes.Care.APPOINTMENT_BOOKED);
      expect(sortedEvents[1].type).toBe(EventTypes.Care.APPOINTMENT_COMPLETED);
      expect(sortedEvents[2].type).toBe(EventTypes.Health.METRIC_RECORDED);
      expect(sortedEvents[3].type).toBe(EventTypes.Plan.CLAIM_SUBMITTED);
    });
  });
});