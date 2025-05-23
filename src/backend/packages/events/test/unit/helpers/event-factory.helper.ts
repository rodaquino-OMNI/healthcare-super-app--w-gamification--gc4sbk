/**
 * @file event-factory.helper.ts
 * @description Factory utilities for generating test event objects that comply with the standardized event schema.
 * This file provides functions to create valid event objects for all journeys (Health, Care, Plan) with
 * appropriate data structures that pass validation. It supports tests by enabling the creation of
 * consistent and valid test events without duplication across test files.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseEvent, EventMetadata, createEvent, validateEvent } from '../../../src/interfaces/base-event.interface';
import {
  JourneyType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  IHealthMetricRecordedPayload,
  IHealthGoalAchievedPayload,
  ICareAppointmentBookedPayload,
  ICareMedicationTakenPayload,
  IPlanClaimSubmittedPayload,
  IPlanBenefitUtilizedPayload
} from '../../../src/interfaces/journey-events.interface';
import { EventVersion } from '../../../src/interfaces/event-versioning.interface';

/**
 * Default event metadata for testing
 */
const DEFAULT_METADATA: EventMetadata = {
  correlationId: 'test-correlation-id',
  priority: 'medium',
  isRetry: false
};

/**
 * Options for creating test events
 */
export interface TestEventOptions {
  /**
   * Custom event ID (defaults to a random UUID)
   */
  eventId?: string;
  
  /**
   * Custom timestamp (defaults to current time)
   */
  timestamp?: string;
  
  /**
   * Event version (defaults to '1.0.0')
   */
  version?: string;
  
  /**
   * User ID (defaults to 'test-user-123')
   */
  userId?: string;
  
  /**
   * Custom metadata
   */
  metadata?: EventMetadata;
  
  /**
   * Whether to create an invalid event for negative testing
   */
  invalid?: boolean;
  
  /**
   * Specific property to make invalid (if invalid is true)
   */
  invalidProperty?: 'eventId' | 'type' | 'timestamp' | 'version' | 'source' | 'payload';
}

/**
 * Creates a base test event with default values
 * 
 * @param type - Event type
 * @param source - Source service
 * @param payload - Event payload
 * @param options - Additional options
 * @returns A BaseEvent instance for testing
 */
export function createTestEvent<T>(
  type: string,
  source: string,
  payload: T,
  options: TestEventOptions = {}
): BaseEvent<T> {
  const {
    eventId = uuidv4(),
    timestamp = new Date().toISOString(),
    version = '1.0.0',
    userId = 'test-user-123',
    metadata = DEFAULT_METADATA,
    invalid = false,
    invalidProperty
  } = options;
  
  // Create a valid event first
  const event = createEvent<T>(type, source, payload, {
    eventId,
    timestamp,
    version,
    userId,
    metadata
  });
  
  // If invalid event is requested, modify it accordingly
  if (invalid && invalidProperty) {
    switch (invalidProperty) {
      case 'eventId':
        (event as any).eventId = invalid ? null : event.eventId;
        break;
      case 'type':
        (event as any).type = invalid ? null : event.type;
        break;
      case 'timestamp':
        (event as any).timestamp = invalid ? 'invalid-date' : event.timestamp;
        break;
      case 'version':
        (event as any).version = invalid ? null : event.version;
        break;
      case 'source':
        (event as any).source = invalid ? null : event.source;
        break;
      case 'payload':
        (event as any).payload = invalid ? null : event.payload;
        break;
    }
  }
  
  return event;
}

/**
 * Creates a versioned event with semantic versioning
 * 
 * @param type - Event type
 * @param source - Source service
 * @param payload - Event payload
 * @param version - Semantic version (major.minor.patch)
 * @param options - Additional options
 * @returns A BaseEvent instance with proper versioning
 */
export function createVersionedTestEvent<T>(
  type: string,
  source: string,
  payload: T,
  version: EventVersion,
  options: Omit<TestEventOptions, 'version'> = {}
): BaseEvent<T> {
  const versionString = `${version.major}.${version.minor}.${version.patch}`;
  return createTestEvent(type, source, payload, { ...options, version: versionString });
}

/**
 * Validates a test event and returns the validation result
 * 
 * @param event - The event to validate
 * @returns Validation result with isValid flag and optional errors
 */
export function validateTestEvent<T>(event: BaseEvent<T>) {
  return validateEvent(event);
}

// ===== HEALTH JOURNEY TEST EVENTS =====

/**
 * Creates a test health metric recorded event
 * 
 * @param options - Test event options
 * @returns A health metric recorded event for testing
 */
export function createHealthMetricRecordedEvent(options: TestEventOptions = {}): BaseEvent<IHealthMetricRecordedPayload> {
  const payload: IHealthMetricRecordedPayload = {
    metric: {
      id: 'metric-123',
      userId: options.userId || 'test-user-123',
      type: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: new Date().toISOString(),
      source: 'manual'
    },
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    source: 'manual',
    previousValue: 72,
    change: 3,
    isImprovement: false
  };
  
  return createTestEvent(
    HealthEventType.METRIC_RECORDED,
    'health-service',
    payload,
    { ...options, journey: JourneyType.HEALTH }
  );
}

/**
 * Creates a test health goal achieved event
 * 
 * @param options - Test event options
 * @returns A health goal achieved event for testing
 */
export function createHealthGoalAchievedEvent(options: TestEventOptions = {}): BaseEvent<IHealthGoalAchievedPayload> {
  const payload: IHealthGoalAchievedPayload = {
    goal: {
      id: 'goal-123',
      userId: options.userId || 'test-user-123',
      type: 'STEPS',
      targetValue: 10000,
      currentValue: 10250,
      unit: 'steps',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(), // 23 days from now
      status: 'ACHIEVED',
      progress: 100
    },
    goalType: 'STEPS',
    achievedValue: 10250,
    targetValue: 10000,
    daysToAchieve: 7,
    isEarlyCompletion: true
  };
  
  return createTestEvent(
    HealthEventType.GOAL_ACHIEVED,
    'health-service',
    payload,
    { ...options, journey: JourneyType.HEALTH }
  );
}

/**
 * Creates a test health device connected event
 * 
 * @param options - Test event options
 * @returns A health device connected event for testing
 */
export function createHealthDeviceConnectedEvent(options: TestEventOptions = {}): BaseEvent<any> {
  const payload = {
    deviceConnection: {
      id: 'device-conn-123',
      userId: options.userId || 'test-user-123',
      deviceId: 'device-123',
      deviceType: 'Smartwatch',
      connectionDate: new Date().toISOString(),
      lastSyncDate: new Date().toISOString(),
      status: 'CONNECTED'
    },
    deviceId: 'device-123',
    deviceType: 'Smartwatch',
    connectionDate: new Date().toISOString(),
    isFirstConnection: true
  };
  
  return createTestEvent(
    HealthEventType.DEVICE_CONNECTED,
    'health-service',
    payload,
    { ...options, journey: JourneyType.HEALTH }
  );
}

// ===== CARE JOURNEY TEST EVENTS =====

/**
 * Creates a test appointment booked event
 * 
 * @param options - Test event options
 * @returns An appointment booked event for testing
 */
export function createAppointmentBookedEvent(options: TestEventOptions = {}): BaseEvent<ICareAppointmentBookedPayload> {
  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 3); // 3 days from now
  
  const payload: ICareAppointmentBookedPayload = {
    appointment: {
      id: 'appointment-123',
      userId: options.userId || 'test-user-123',
      providerId: 'provider-123',
      type: 'IN_PERSON',
      status: 'SCHEDULED',
      scheduledDate: appointmentDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      specialty: 'Cardiologia',
      notes: 'Regular check-up'
    },
    appointmentType: 'IN_PERSON',
    providerId: 'provider-123',
    scheduledDate: appointmentDate.toISOString(),
    isFirstAppointment: false,
    isUrgent: false
  };
  
  return createTestEvent(
    CareEventType.APPOINTMENT_BOOKED,
    'care-service',
    payload,
    { ...options, journey: JourneyType.CARE }
  );
}

/**
 * Creates a test medication taken event
 * 
 * @param options - Test event options
 * @returns A medication taken event for testing
 */
export function createMedicationTakenEvent(options: TestEventOptions = {}): BaseEvent<ICareMedicationTakenPayload> {
  const payload: ICareMedicationTakenPayload = {
    medicationId: 'medication-123',
    medicationName: 'Atorvastatina',
    takenDate: new Date().toISOString(),
    takenOnTime: true,
    dosage: '20mg'
  };
  
  return createTestEvent(
    CareEventType.MEDICATION_TAKEN,
    'care-service',
    payload,
    { ...options, journey: JourneyType.CARE }
  );
}

/**
 * Creates a test telemedicine session completed event
 * 
 * @param options - Test event options
 * @returns A telemedicine session completed event for testing
 */
export function createTelemedicineSessionCompletedEvent(options: TestEventOptions = {}): BaseEvent<any> {
  const startTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  const endTime = new Date();
  
  const payload = {
    session: {
      id: 'session-123',
      userId: options.userId || 'test-user-123',
      providerId: 'provider-123',
      appointmentId: 'appointment-123',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'COMPLETED',
      duration: 30,
      notes: 'Successful session'
    },
    sessionId: 'session-123',
    providerId: 'provider-123',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: 30,
    appointmentId: 'appointment-123',
    technicalIssues: false
  };
  
  return createTestEvent(
    CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    'care-service',
    payload,
    { ...options, journey: JourneyType.CARE }
  );
}

// ===== PLAN JOURNEY TEST EVENTS =====

/**
 * Creates a test claim submitted event
 * 
 * @param options - Test event options
 * @returns A claim submitted event for testing
 */
export function createClaimSubmittedEvent(options: TestEventOptions = {}): BaseEvent<IPlanClaimSubmittedPayload> {
  const payload: IPlanClaimSubmittedPayload = {
    claim: {
      id: 'claim-123',
      userId: options.userId || 'test-user-123',
      type: 'Consulta Médica',
      amount: 250.0,
      status: 'SUBMITTED',
      submissionDate: new Date().toISOString(),
      description: 'Consulta com cardiologista',
      providerName: 'Dr. Silva',
      serviceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    submissionDate: new Date().toISOString(),
    amount: 250.0,
    claimType: 'Consulta Médica',
    hasDocuments: true,
    isComplete: true
  };
  
  return createTestEvent(
    PlanEventType.CLAIM_SUBMITTED,
    'plan-service',
    payload,
    { ...options, journey: JourneyType.PLAN }
  );
}

/**
 * Creates a test benefit utilized event
 * 
 * @param options - Test event options
 * @returns A benefit utilized event for testing
 */
export function createBenefitUtilizedEvent(options: TestEventOptions = {}): BaseEvent<IPlanBenefitUtilizedPayload> {
  const payload: IPlanBenefitUtilizedPayload = {
    benefit: {
      id: 'benefit-123',
      name: 'Consultas Médicas',
      description: 'Cobertura para consultas médicas',
      coverageLimit: 1000.0,
      coverageUsed: 250.0,
      coverageRemaining: 750.0,
      usageCount: 1,
      planId: 'plan-123'
    },
    utilizationDate: new Date().toISOString(),
    serviceProvider: 'Clínica São Paulo',
    amount: 250.0,
    remainingCoverage: 750.0,
    isFirstUtilization: false
  };
  
  return createTestEvent(
    PlanEventType.BENEFIT_UTILIZED,
    'plan-service',
    payload,
    { ...options, journey: JourneyType.PLAN }
  );
}

/**
 * Creates a test reward redeemed event
 * 
 * @param options - Test event options
 * @returns A reward redeemed event for testing
 */
export function createRewardRedeemedEvent(options: TestEventOptions = {}): BaseEvent<any> {
  const payload = {
    rewardId: 'reward-123',
    rewardName: 'Desconto em Farmácia',
    redemptionDate: new Date().toISOString(),
    pointValue: 500,
    monetaryValue: 50.0,
    rewardType: 'DISCOUNT',
    isPremiumReward: false
  };
  
  return createTestEvent(
    PlanEventType.REWARD_REDEEMED,
    'plan-service',
    payload,
    { ...options, journey: JourneyType.PLAN }
  );
}

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a batch of test events for load testing
 * 
 * @param count - Number of events to create
 * @param eventFactory - Factory function to create each event
 * @returns Array of test events
 */
export function createTestEventBatch<T>(
  count: number,
  eventFactory: (options: TestEventOptions) => BaseEvent<T>
): BaseEvent<T>[] {
  return Array.from({ length: count }, (_, index) => {
    return eventFactory({
      eventId: `batch-event-${index}`,
      userId: `test-user-${Math.floor(Math.random() * 10)}`
    });
  });
}

/**
 * Creates a test event with a specific journey type
 * 
 * @param journey - Journey type
 * @param options - Test event options
 * @returns A journey-specific test event
 */
export function createJourneyEvent(journey: JourneyType, options: TestEventOptions = {}): BaseEvent<any> {
  switch (journey) {
    case JourneyType.HEALTH:
      return createHealthMetricRecordedEvent(options);
    case JourneyType.CARE:
      return createAppointmentBookedEvent(options);
    case JourneyType.PLAN:
      return createClaimSubmittedEvent(options);
    default:
      throw new Error(`Unsupported journey type: ${journey}`);
  }
}

/**
 * Creates a test event with a specific event type
 * 
 * @param eventType - Event type
 * @param options - Test event options
 * @returns A specific test event based on the event type
 */
export function createEventByType(
  eventType: HealthEventType | CareEventType | PlanEventType,
  options: TestEventOptions = {}
): BaseEvent<any> {
  // Health journey events
  if (Object.values(HealthEventType).includes(eventType as HealthEventType)) {
    switch (eventType) {
      case HealthEventType.METRIC_RECORDED:
        return createHealthMetricRecordedEvent(options);
      case HealthEventType.GOAL_ACHIEVED:
        return createHealthGoalAchievedEvent(options);
      case HealthEventType.DEVICE_CONNECTED:
        return createHealthDeviceConnectedEvent(options);
      default:
        return createHealthMetricRecordedEvent(options);
    }
  }
  
  // Care journey events
  if (Object.values(CareEventType).includes(eventType as CareEventType)) {
    switch (eventType) {
      case CareEventType.APPOINTMENT_BOOKED:
        return createAppointmentBookedEvent(options);
      case CareEventType.MEDICATION_TAKEN:
        return createMedicationTakenEvent(options);
      case CareEventType.TELEMEDICINE_SESSION_COMPLETED:
        return createTelemedicineSessionCompletedEvent(options);
      default:
        return createAppointmentBookedEvent(options);
    }
  }
  
  // Plan journey events
  if (Object.values(PlanEventType).includes(eventType as PlanEventType)) {
    switch (eventType) {
      case PlanEventType.CLAIM_SUBMITTED:
        return createClaimSubmittedEvent(options);
      case PlanEventType.BENEFIT_UTILIZED:
        return createBenefitUtilizedEvent(options);
      case PlanEventType.REWARD_REDEEMED:
        return createRewardRedeemedEvent(options);
      default:
        return createClaimSubmittedEvent(options);
    }
  }
  
  throw new Error(`Unsupported event type: ${eventType}`);
}