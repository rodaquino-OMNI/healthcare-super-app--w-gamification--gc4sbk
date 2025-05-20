/**
 * @file mock-journey-events.ts
 * @description Mock generators for journey-specific events used in testing Kafka event processing.
 * This file provides factory functions to create standardized event objects for Health, Care, and Plan
 * journeys that match the expected schema for the gamification engine and notification service.
 *
 * These mock events are used in unit tests to verify event processing, validation, and transformation
 * logic without requiring actual event production from journey services.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventType, JourneyEvents } from '../../../../src/dto/event-types.enum';
import { 
  EventMetadataDto, 
  EventOriginDto, 
  EventVersionDto,
  createEventMetadata 
} from '../../../../src/dto/event-metadata.dto';
import {
  HealthMetricType,
  HealthGoalType,
  DeviceType,
  HealthInsightType
} from '../../../../src/dto/health-event.dto';

// Base interfaces for event structure
interface BaseEvent {
  type: string;
  payload: any;
  metadata: EventMetadataDto;
}

interface UserContext {
  userId: string;
  sessionId?: string;
  deviceId?: string;
  platform?: 'web' | 'mobile' | 'api';
}

/**
 * Creates a base event with standard metadata.
 * 
 * @param type The event type
 * @param payload The event payload
 * @param service The originating service name
 * @param userContext Optional user context for correlation
 * @returns A complete event object with metadata
 */
export function createBaseEvent(
  type: string,
  payload: any,
  service: string,
  userContext?: UserContext
): BaseEvent {
  const metadata = createEventMetadata(service, {
    eventId: uuidv4(),
    timestamp: new Date(),
    correlationId: userContext?.sessionId || uuidv4(),
    sessionId: userContext?.sessionId,
    context: userContext ? {
      userId: userContext.userId,
      deviceId: userContext.deviceId,
      platform: userContext.platform
    } : undefined
  });

  return {
    type,
    payload,
    metadata
  };
}

/**
 * Creates a versioned event with specific schema version.
 * Used for testing backward compatibility.
 * 
 * @param type The event type
 * @param payload The event payload
 * @param service The originating service name
 * @param version The schema version in format 'major.minor.patch'
 * @param userContext Optional user context for correlation
 * @returns A complete event object with versioned metadata
 */
export function createVersionedEvent(
  type: string,
  payload: any,
  service: string,
  version: string,
  userContext?: UserContext
): BaseEvent {
  const event = createBaseEvent(type, payload, service, userContext);
  event.metadata.version = EventVersionDto.fromString(version);
  return event;
}

/**
 * Creates an invalid event for testing validation logic.
 * 
 * @param type The event type
 * @param invalidations Object containing fields to invalidate and how
 * @param service The originating service name
 * @returns An invalid event object for testing validation
 */
export function createInvalidEvent(
  type: string,
  invalidations: Record<string, any>,
  service: string
): BaseEvent {
  // Create a minimal valid event first
  const basePayload = {};
  const event = createBaseEvent(type, basePayload, service);
  
  // Apply invalidations
  Object.entries(invalidations).forEach(([path, value]) => {
    const pathParts = path.split('.');
    let current: any = event;
    
    // Navigate to the parent object of the field to invalidate
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the invalid value
    current[pathParts[pathParts.length - 1]] = value;
  });
  
  return event;
}

// ===== HEALTH JOURNEY EVENT GENERATORS =====

/**
 * Creates a mock health metric recorded event.
 * 
 * @param metricType The type of health metric
 * @param value The metric value
 * @param unit The unit of measurement
 * @param userContext Optional user context for correlation
 * @returns A complete health metric recorded event
 */
export function createHealthMetricRecordedEvent(
  metricType: HealthMetricType,
  value: number,
  unit: string,
  userContext?: UserContext
): BaseEvent {
  const payload = {
    metricType,
    value,
    unit,
    timestamp: new Date().toISOString(),
    source: 'manual'
  };
  
  return createBaseEvent(
    EventType.HEALTH_METRIC_RECORDED,
    payload,
    'health-service',
    userContext
  );
}

/**
 * Creates a mock health goal achieved event.
 * 
 * @param goalType The type of health goal
 * @param targetValue The goal target value
 * @param achievedValue The actual achieved value
 * @param userContext Optional user context for correlation
 * @returns A complete health goal achieved event
 */
export function createHealthGoalAchievedEvent(
  goalType: HealthGoalType,
  targetValue: number,
  achievedValue: number,
  userContext?: UserContext
): BaseEvent {
  const payload = {
    goalId: uuidv4(),
    goalType,
    targetValue,
    achievedValue,
    completedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.HEALTH_GOAL_ACHIEVED,
    payload,
    'health-service',
    userContext
  );
}

/**
 * Creates a mock health device connected event.
 * 
 * @param deviceType The type of health device
 * @param connectionMethod The method used to connect the device
 * @param userContext Optional user context for correlation
 * @returns A complete health device connected event
 */
export function createHealthDeviceConnectedEvent(
  deviceType: DeviceType,
  connectionMethod: 'oauth' | 'bluetooth' | 'manual',
  userContext?: UserContext
): BaseEvent {
  const payload = {
    deviceId: uuidv4(),
    deviceType,
    connectionMethod,
    connectedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.HEALTH_DEVICE_CONNECTED,
    payload,
    'health-service',
    userContext
  );
}

/**
 * Creates a mock health insight generated event.
 * 
 * @param insightType The type of health insight
 * @param metricType The related metric type
 * @param severity The severity level of the insight
 * @param userContext Optional user context for correlation
 * @returns A complete health insight generated event
 */
export function createHealthInsightGeneratedEvent(
  insightType: HealthInsightType,
  metricType: HealthMetricType,
  severity: 'info' | 'warning' | 'critical',
  userContext?: UserContext
): BaseEvent {
  const payload = {
    insightId: uuidv4(),
    insightType,
    metricType,
    description: `Mock insight for ${metricType} with ${severity} severity`,
    severity,
    generatedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.HEALTH_INSIGHT_GENERATED,
    payload,
    'health-service',
    userContext
  );
}

// ===== CARE JOURNEY EVENT GENERATORS =====

/**
 * Creates a mock care appointment booked event.
 * 
 * @param specialtyType The medical specialty type
 * @param appointmentType The type of appointment
 * @param userContext Optional user context for correlation
 * @returns A complete care appointment booked event
 */
export function createCareAppointmentBookedEvent(
  specialtyType: string,
  appointmentType: 'in_person' | 'telemedicine',
  userContext?: UserContext
): BaseEvent {
  const payload = {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyType,
    appointmentType,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    bookedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.CARE_APPOINTMENT_BOOKED,
    payload,
    'care-service',
    userContext
  );
}

/**
 * Creates a mock care appointment completed event.
 * 
 * @param appointmentId The ID of the appointment (optional, generates new if not provided)
 * @param appointmentType The type of appointment
 * @param duration The duration of the appointment in minutes
 * @param userContext Optional user context for correlation
 * @returns A complete care appointment completed event
 */
export function createCareAppointmentCompletedEvent(
  appointmentId: string = uuidv4(),
  appointmentType: 'in_person' | 'telemedicine',
  duration: number,
  userContext?: UserContext
): BaseEvent {
  const scheduledAt = new Date(Date.now() - duration * 60000);
  
  const payload = {
    appointmentId,
    providerId: uuidv4(),
    appointmentType,
    scheduledAt: scheduledAt.toISOString(),
    completedAt: new Date().toISOString(),
    duration
  };
  
  return createBaseEvent(
    EventType.CARE_APPOINTMENT_COMPLETED,
    payload,
    'care-service',
    userContext
  );
}

/**
 * Creates a mock care medication taken event.
 * 
 * @param medicationName The name of the medication
 * @param dosage The dosage information
 * @param adherence The adherence status
 * @param userContext Optional user context for correlation
 * @returns A complete care medication taken event
 */
export function createCareMedicationTakenEvent(
  medicationName: string,
  dosage: string,
  adherence: 'on_time' | 'late' | 'missed',
  userContext?: UserContext
): BaseEvent {
  const payload = {
    medicationId: uuidv4(),
    medicationName,
    dosage,
    takenAt: new Date().toISOString(),
    adherence
  };
  
  return createBaseEvent(
    EventType.CARE_MEDICATION_TAKEN,
    payload,
    'care-service',
    userContext
  );
}

/**
 * Creates a mock care plan task completed event.
 * 
 * @param taskType The type of care plan task
 * @param status The completion status
 * @param userContext Optional user context for correlation
 * @returns A complete care plan task completed event
 */
export function createCarePlanTaskCompletedEvent(
  taskType: 'medication' | 'exercise' | 'appointment',
  status: 'completed' | 'partially_completed',
  userContext?: UserContext
): BaseEvent {
  const payload = {
    taskId: uuidv4(),
    planId: uuidv4(),
    taskType,
    completedAt: new Date().toISOString(),
    status
  };
  
  return createBaseEvent(
    EventType.CARE_PLAN_TASK_COMPLETED,
    payload,
    'care-service',
    userContext
  );
}

// ===== PLAN JOURNEY EVENT GENERATORS =====

/**
 * Creates a mock plan claim submitted event.
 * 
 * @param claimType The type of insurance claim
 * @param amount The claim amount
 * @param userContext Optional user context for correlation
 * @returns A complete plan claim submitted event
 */
export function createPlanClaimSubmittedEvent(
  claimType: string,
  amount: number,
  userContext?: UserContext
): BaseEvent {
  const payload = {
    claimId: uuidv4(),
    claimType,
    providerId: uuidv4(),
    serviceDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    amount,
    submittedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.PLAN_CLAIM_SUBMITTED,
    payload,
    'plan-service',
    userContext
  );
}

/**
 * Creates a mock plan claim processed event.
 * 
 * @param claimId The ID of the claim (optional, generates new if not provided)
 * @param status The processing status
 * @param amount The total claim amount
 * @param coveredAmount The amount covered by insurance
 * @param userContext Optional user context for correlation
 * @returns A complete plan claim processed event
 */
export function createPlanClaimProcessedEvent(
  claimId: string = uuidv4(),
  status: 'approved' | 'denied' | 'partial',
  amount: number,
  coveredAmount: number,
  userContext?: UserContext
): BaseEvent {
  const payload = {
    claimId,
    status,
    amount,
    coveredAmount,
    processedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.PLAN_CLAIM_PROCESSED,
    payload,
    'plan-service',
    userContext
  );
}

/**
 * Creates a mock plan benefit utilized event.
 * 
 * @param benefitType The type of insurance benefit
 * @param savingsAmount The amount saved by using the benefit
 * @param userContext Optional user context for correlation
 * @returns A complete plan benefit utilized event
 */
export function createPlanBenefitUtilizedEvent(
  benefitType: string,
  savingsAmount: number,
  userContext?: UserContext
): BaseEvent {
  const payload = {
    benefitId: uuidv4(),
    benefitType,
    providerId: uuidv4(),
    utilizationDate: new Date().toISOString(),
    savingsAmount
  };
  
  return createBaseEvent(
    EventType.PLAN_BENEFIT_UTILIZED,
    payload,
    'plan-service',
    userContext
  );
}

/**
 * Creates a mock plan reward redeemed event.
 * 
 * @param rewardType The type of reward
 * @param pointsRedeemed The number of points redeemed
 * @param value The monetary value of the reward
 * @param userContext Optional user context for correlation
 * @returns A complete plan reward redeemed event
 */
export function createPlanRewardRedeemedEvent(
  rewardType: 'gift_card' | 'premium_discount' | 'merchandise',
  pointsRedeemed: number,
  value: number,
  userContext?: UserContext
): BaseEvent {
  const payload = {
    rewardId: uuidv4(),
    rewardType,
    pointsRedeemed,
    value,
    redeemedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.PLAN_REWARD_REDEEMED,
    payload,
    'plan-service',
    userContext
  );
}

// ===== CROSS-JOURNEY EVENT GENERATORS =====

/**
 * Creates a mock gamification points earned event.
 * 
 * @param sourceType The journey source of the points
 * @param points The number of points earned
 * @param reason The reason for earning points
 * @param userContext Optional user context for correlation
 * @returns A complete gamification points earned event
 */
export function createGamificationPointsEarnedEvent(
  sourceType: 'health' | 'care' | 'plan',
  points: number,
  reason: string,
  userContext?: UserContext
): BaseEvent {
  const payload = {
    sourceType,
    sourceId: uuidv4(),
    points,
    reason,
    earnedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.GAMIFICATION_POINTS_EARNED,
    payload,
    'gamification-engine',
    userContext
  );
}

/**
 * Creates a mock gamification achievement unlocked event.
 * 
 * @param achievementType The type of achievement
 * @param tier The achievement tier
 * @param points The points awarded for the achievement
 * @param userContext Optional user context for correlation
 * @returns A complete gamification achievement unlocked event
 */
export function createGamificationAchievementUnlockedEvent(
  achievementType: string,
  tier: 'bronze' | 'silver' | 'gold',
  points: number,
  userContext?: UserContext
): BaseEvent {
  const payload = {
    achievementId: uuidv4(),
    achievementType,
    tier,
    points,
    unlockedAt: new Date().toISOString()
  };
  
  return createBaseEvent(
    EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    payload,
    'gamification-engine',
    userContext
  );
}

/**
 * Creates a sequence of related events for testing cross-journey scenarios.
 * 
 * @param userContext The user context to use for all events
 * @returns An array of related events in chronological order
 */
export function createCrossJourneyEventSequence(userContext: UserContext): BaseEvent[] {
  // Create a consistent user context with correlation ID
  const context = {
    ...userContext,
    sessionId: userContext.sessionId || uuidv4()
  };
  
  // Create a sequence of events that would occur in a realistic user journey
  return [
    // User records health metrics
    createHealthMetricRecordedEvent(
      HealthMetricType.HEART_RATE,
      75,
      'bpm',
      context
    ),
    
    // User achieves a health goal
    createHealthGoalAchievedEvent(
      HealthGoalType.STEPS_TARGET,
      10000,
      10500,
      context
    ),
    
    // User earns points for achieving the goal
    createGamificationPointsEarnedEvent(
      'health',
      50,
      'Completed daily steps goal',
      context
    ),
    
    // User books a medical appointment
    createCareAppointmentBookedEvent(
      'Cardiologia',
      'in_person',
      context
    ),
    
    // User earns points for booking the appointment
    createGamificationPointsEarnedEvent(
      'care',
      25,
      'Booked preventive care appointment',
      context
    ),
    
    // User submits an insurance claim
    createPlanClaimSubmittedEvent(
      'Consulta Médica',
      150.00,
      context
    ),
    
    // User unlocks an achievement for cross-journey activity
    createGamificationAchievementUnlockedEvent(
      'health-check-streak',
      'silver',
      100,
      context
    )
  ];
}

/**
 * Creates a batch of random events for load testing.
 * 
 * @param count The number of events to generate
 * @returns An array of random events
 */
export function createRandomEventBatch(count: number): BaseEvent[] {
  const events: BaseEvent[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random user context
    const userContext: UserContext = {
      userId: uuidv4(),
      sessionId: uuidv4(),
      platform: Math.random() > 0.5 ? 'mobile' : 'web'
    };
    
    // Randomly select an event type to generate
    const eventType = Math.floor(Math.random() * 5);
    
    switch (eventType) {
      case 0:
        // Health metric recorded
        events.push(createHealthMetricRecordedEvent(
          HealthMetricType.STEPS,
          Math.floor(Math.random() * 20000),
          'steps',
          userContext
        ));
        break;
      
      case 1:
        // Care appointment booked
        events.push(createCareAppointmentBookedEvent(
          'Dermatologia',
          Math.random() > 0.5 ? 'in_person' : 'telemedicine',
          userContext
        ));
        break;
      
      case 2:
        // Plan claim submitted
        events.push(createPlanClaimSubmittedEvent(
          'Exame',
          Math.floor(Math.random() * 500) + 50,
          userContext
        ));
        break;
      
      case 3:
        // Medication taken
        events.push(createCareMedicationTakenEvent(
          'Medication ' + Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 100) + 'mg',
          Math.random() > 0.7 ? 'late' : 'on_time',
          userContext
        ));
        break;
      
      case 4:
        // Health device connected
        events.push(createHealthDeviceConnectedEvent(
          DeviceType.SMARTWATCH,
          'bluetooth',
          userContext
        ));
        break;
    }
  }
  
  return events;
}