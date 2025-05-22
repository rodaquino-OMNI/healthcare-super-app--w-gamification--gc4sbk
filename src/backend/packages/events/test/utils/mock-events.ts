/**
 * @file mock-events.ts
 * @description Provides a comprehensive mock event generation library for creating test events with
 * correct schemas for all journey types (health, care, plan). It includes factory functions for each
 * event type with configurable parameters to support various testing scenarios.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseEvent, EventMetadata, createEvent } from '../../src/interfaces/base-event.interface';
import {
  JourneyType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  IHealthMetricRecordedPayload,
  IHealthGoalAchievedPayload,
  IHealthDeviceConnectedPayload,
  ICareAppointmentBookedPayload,
  ICareMedicationTakenPayload,
  ICareTelemedicineSessionCompletedPayload,
  IPlanClaimSubmittedPayload,
  IPlanBenefitUtilizedPayload,
  IPlanRewardRedeemedPayload
} from '../../src/interfaces/journey-events.interface';

/**
 * Options for creating mock events
 */
export interface MockEventOptions {
  /**
   * Custom event ID
   */
  eventId?: string;

  /**
   * Custom timestamp
   */
  timestamp?: string;

  /**
   * Custom version
   */
  version?: string;

  /**
   * Custom user ID
   */
  userId?: string;

  /**
   * Custom metadata
   */
  metadata?: EventMetadata;

  /**
   * Custom source
   */
  source?: string;
}

/**
 * Default options for mock events
 */
const DEFAULT_MOCK_OPTIONS: MockEventOptions = {
  eventId: undefined, // Will be generated with uuidv4
  timestamp: undefined, // Will use current timestamp
  version: '1.0.0',
  userId: 'test-user-123',
  source: 'test'
};

// ===== HEALTH JOURNEY MOCK EVENTS =====

/**
 * Creates a mock health metric recorded event
 * 
 * @param metricType Type of health metric
 * @param value Value of the metric
 * @param unit Unit of measurement
 * @param options Additional event options
 * @returns A mock health metric recorded event
 */
export function createMockHealthMetricRecordedEvent(
  metricType: string = 'HEART_RATE',
  value: number = 75,
  unit: string = 'bpm',
  options: MockEventOptions = {}
): BaseEvent<IHealthMetricRecordedPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  const payload: IHealthMetricRecordedPayload = {
    metric: {
      id: uuidv4(),
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId!,
      type: metricType,
      value,
      unit,
      timestamp: new Date().toISOString(),
      source: 'manual'
    },
    metricType: metricType as any,
    value,
    unit,
    timestamp: new Date().toISOString(),
    source: 'manual',
    previousValue: value - 5,
    change: 5,
    isImprovement: true
  };

  return createEvent(
    HealthEventType.METRIC_RECORDED,
    opts.source || 'health-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.HEALTH,
      metadata: opts.metadata
    }
  );
}

/**
 * Creates a mock health goal achieved event
 * 
 * @param goalType Type of health goal
 * @param targetValue Target value of the goal
 * @param achievedValue Achieved value
 * @param options Additional event options
 * @returns A mock health goal achieved event
 */
export function createMockHealthGoalAchievedEvent(
  goalType: string = 'STEPS',
  targetValue: number = 10000,
  achievedValue: number = 10500,
  options: MockEventOptions = {}
): BaseEvent<IHealthGoalAchievedPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  const payload: IHealthGoalAchievedPayload = {
    goal: {
      id: uuidv4(),
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId!,
      type: goalType as any,
      targetValue,
      currentValue: achievedValue,
      unit: goalType === 'STEPS' ? 'steps' : 'kg',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      status: 'ACHIEVED' as any,
      progress: 100
    },
    goalType: goalType as any,
    targetValue,
    achievedValue,
    daysToAchieve: 7,
    isEarlyCompletion: true
  };

  return createEvent(
    HealthEventType.GOAL_ACHIEVED,
    opts.source || 'health-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.HEALTH,
      metadata: opts.metadata
    }
  );
}

/**
 * Creates a mock health device connected event
 * 
 * @param deviceType Type of device
 * @param deviceId Device identifier
 * @param isFirstConnection Whether this is the first connection
 * @param options Additional event options
 * @returns A mock health device connected event
 */
export function createMockHealthDeviceConnectedEvent(
  deviceType: string = 'Smartwatch',
  deviceId: string = 'device-123',
  isFirstConnection: boolean = true,
  options: MockEventOptions = {}
): BaseEvent<IHealthDeviceConnectedPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  const payload: IHealthDeviceConnectedPayload = {
    deviceConnection: {
      id: uuidv4(),
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId!,
      deviceId,
      deviceType,
      connectionDate: new Date().toISOString(),
      lastSyncDate: new Date().toISOString(),
      status: 'CONNECTED' as any
    },
    deviceId,
    deviceType,
    connectionDate: new Date().toISOString(),
    isFirstConnection
  };

  return createEvent(
    HealthEventType.DEVICE_CONNECTED,
    opts.source || 'health-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.HEALTH,
      metadata: opts.metadata
    }
  );
}

// ===== CARE JOURNEY MOCK EVENTS =====

/**
 * Creates a mock care appointment booked event
 * 
 * @param appointmentType Type of appointment
 * @param providerId Provider identifier
 * @param scheduledDate When the appointment is scheduled
 * @param options Additional event options
 * @returns A mock care appointment booked event
 */
export function createMockCareAppointmentBookedEvent(
  appointmentType: string = 'CONSULTATION',
  providerId: string = 'provider-123',
  scheduledDate: string = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  options: MockEventOptions = {}
): BaseEvent<ICareAppointmentBookedPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  const payload: ICareAppointmentBookedPayload = {
    appointment: {
      id: uuidv4(),
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId!,
      providerId,
      type: appointmentType as any,
      status: 'SCHEDULED' as any,
      scheduledDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    appointmentType: appointmentType as any,
    providerId,
    scheduledDate,
    isFirstAppointment: false,
    isUrgent: false
  };

  return createEvent(
    CareEventType.APPOINTMENT_BOOKED,
    opts.source || 'care-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.CARE,
      metadata: opts.metadata
    }
  );
}

/**
 * Creates a mock care medication taken event
 * 
 * @param medicationId Medication identifier
 * @param medicationName Name of the medication
 * @param takenOnTime Whether the medication was taken on time
 * @param options Additional event options
 * @returns A mock care medication taken event
 */
export function createMockCareMedicationTakenEvent(
  medicationId: string = 'med-123',
  medicationName: string = 'Test Medication',
  takenOnTime: boolean = true,
  options: MockEventOptions = {}
): BaseEvent<ICareMedicationTakenPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  const payload: ICareMedicationTakenPayload = {
    medicationId,
    medicationName,
    takenDate: new Date().toISOString(),
    takenOnTime,
    dosage: '10mg'
  };

  return createEvent(
    CareEventType.MEDICATION_TAKEN,
    opts.source || 'care-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.CARE,
      metadata: opts.metadata
    }
  );
}

/**
 * Creates a mock care telemedicine session completed event
 * 
 * @param sessionId Session identifier
 * @param providerId Provider identifier
 * @param duration Duration in minutes
 * @param options Additional event options
 * @returns A mock care telemedicine session completed event
 */
export function createMockCareTelemedicineSessionCompletedEvent(
  sessionId: string = 'session-123',
  providerId: string = 'provider-123',
  duration: number = 30,
  options: MockEventOptions = {}
): BaseEvent<ICareTelemedicineSessionCompletedPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  const startTime = new Date(Date.now() - duration * 60 * 1000).toISOString();
  const endTime = new Date().toISOString();
  
  const payload: ICareTelemedicineSessionCompletedPayload = {
    session: {
      id: sessionId,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId!,
      providerId,
      startTime,
      endTime,
      duration,
      status: 'COMPLETED' as any
    },
    sessionId,
    providerId,
    startTime,
    endTime,
    duration,
    appointmentId: 'appointment-123',
    technicalIssues: false
  };

  return createEvent(
    CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    opts.source || 'care-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.CARE,
      metadata: opts.metadata
    }
  );
}

// ===== PLAN JOURNEY MOCK EVENTS =====

/**
 * Creates a mock plan claim submitted event
 * 
 * @param claimType Type of claim
 * @param amount Claim amount
 * @param hasDocuments Whether the claim includes supporting documents
 * @param options Additional event options
 * @returns A mock plan claim submitted event
 */
export function createMockPlanClaimSubmittedEvent(
  claimType: string = 'MEDICAL',
  amount: number = 150.0,
  hasDocuments: boolean = true,
  options: MockEventOptions = {}
): BaseEvent<IPlanClaimSubmittedPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  const payload: IPlanClaimSubmittedPayload = {
    claim: {
      id: uuidv4(),
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId!,
      type: claimType as any,
      amount,
      status: 'SUBMITTED' as any,
      submissionDate: new Date().toISOString(),
      documents: hasDocuments ? [{ id: 'doc-123', name: 'receipt.pdf', type: 'application/pdf' }] : []
    },
    submissionDate: new Date().toISOString(),
    amount,
    claimType,
    hasDocuments,
    isComplete: true
  };

  return createEvent(
    PlanEventType.CLAIM_SUBMITTED,
    opts.source || 'plan-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.PLAN,
      metadata: opts.metadata
    }
  );
}

/**
 * Creates a mock plan benefit utilized event
 * 
 * @param benefitType Type of benefit
 * @param amount Cost of the service
 * @param remainingCoverage Remaining coverage for this benefit
 * @param options Additional event options
 * @returns A mock plan benefit utilized event
 */
export function createMockPlanBenefitUtilizedEvent(
  benefitType: string = 'DENTAL',
  amount: number = 75.0,
  remainingCoverage: number = 925.0,
  options: MockEventOptions = {}
): BaseEvent<IPlanBenefitUtilizedPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  const payload: IPlanBenefitUtilizedPayload = {
    benefit: {
      id: uuidv4(),
      type: benefitType as any,
      name: `${benefitType} Coverage`,
      description: `Coverage for ${benefitType.toLowerCase()} services`,
      coverageAmount: 1000.0,
      usedAmount: amount,
      remainingAmount: remainingCoverage
    },
    utilizationDate: new Date().toISOString(),
    serviceProvider: 'Provider XYZ',
    amount,
    remainingCoverage,
    isFirstUtilization: false
  };

  return createEvent(
    PlanEventType.BENEFIT_UTILIZED,
    opts.source || 'plan-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.PLAN,
      metadata: opts.metadata
    }
  );
}

/**
 * Creates a mock plan reward redeemed event
 * 
 * @param rewardName Name of the reward
 * @param pointValue Point value of the reward
 * @param rewardType Type of reward
 * @param options Additional event options
 * @returns A mock plan reward redeemed event
 */
export function createMockPlanRewardRedeemedEvent(
  rewardName: string = 'Discount Voucher',
  pointValue: number = 500,
  rewardType: string = 'VOUCHER',
  options: MockEventOptions = {}
): BaseEvent<IPlanRewardRedeemedPayload> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  const payload: IPlanRewardRedeemedPayload = {
    rewardId: uuidv4(),
    rewardName,
    redemptionDate: new Date().toISOString(),
    pointValue,
    monetaryValue: pointValue / 10, // Assuming 10 points = $1
    rewardType,
    isPremiumReward: pointValue > 1000
  };

  return createEvent(
    PlanEventType.REWARD_REDEEMED,
    opts.source || 'plan-service',
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey: JourneyType.PLAN,
      metadata: opts.metadata
    }
  );
}

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a mock event with the specified type and payload
 * 
 * @param type Event type
 * @param journey Journey type
 * @param payload Event payload
 * @param options Additional event options
 * @returns A mock event with the specified type and payload
 */
export function createMockEvent<T = any>(
  type: string,
  journey: JourneyType,
  payload: T,
  options: MockEventOptions = {}
): BaseEvent<T> {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  return createEvent(
    type,
    opts.source || `${journey}-service`,
    payload,
    {
      eventId: opts.eventId || uuidv4(),
      timestamp: opts.timestamp || new Date().toISOString(),
      version: opts.version || DEFAULT_MOCK_OPTIONS.version,
      userId: opts.userId || DEFAULT_MOCK_OPTIONS.userId,
      journey,
      metadata: opts.metadata
    }
  );
}

/**
 * Creates a sequence of mock events for testing event processing pipelines
 * 
 * @param count Number of events to create
 * @param eventFactory Factory function to create each event
 * @param options Additional event options
 * @returns Array of mock events
 */
export function createMockEventSequence<T extends BaseEvent>(
  count: number,
  eventFactory: (index: number) => T,
  options: { delayBetweenEventsMs?: number } = {}
): T[] {
  const events: T[] = [];
  const now = Date.now();
  const delayMs = options.delayBetweenEventsMs || 1000;
  
  for (let i = 0; i < count; i++) {
    const event = eventFactory(i);
    
    // If delayBetweenEventsMs is specified, adjust the timestamps
    if (options.delayBetweenEventsMs) {
      const timestamp = new Date(now + i * delayMs).toISOString();
      (event as any).timestamp = timestamp;
    }
    
    events.push(event);
  }
  
  return events;
}

/**
 * Creates a mock event batch with events from different journeys
 * 
 * @param healthEvents Number of health events to include
 * @param careEvents Number of care events to include
 * @param planEvents Number of plan events to include
 * @param options Additional event options
 * @returns Array of mock events from different journeys
 */
export function createMockEventBatch(
  healthEvents: number = 1,
  careEvents: number = 1,
  planEvents: number = 1,
  options: MockEventOptions = {}
): BaseEvent[] {
  const events: BaseEvent[] = [];
  
  // Add health events
  for (let i = 0; i < healthEvents; i++) {
    events.push(createMockHealthMetricRecordedEvent('HEART_RATE', 75 + i, 'bpm', options));
  }
  
  // Add care events
  for (let i = 0; i < careEvents; i++) {
    events.push(createMockCareAppointmentBookedEvent('CONSULTATION', `provider-${i}`, new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(), options));
  }
  
  // Add plan events
  for (let i = 0; i < planEvents; i++) {
    events.push(createMockPlanClaimSubmittedEvent('MEDICAL', 150.0 + i * 10, true, options));
  }
  
  return events;
}

/**
 * Creates a mock event with an invalid schema for testing validation
 * 
 * @param type Event type
 * @param journey Journey type
 * @param invalidations Object with fields to invalidate and their invalid values
 * @param options Additional event options
 * @returns A mock event with an invalid schema
 */
export function createInvalidMockEvent(
  type: string,
  journey: JourneyType,
  invalidations: Record<string, any>,
  options: MockEventOptions = {}
): BaseEvent {
  const opts = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  // Create a valid event first
  const validEvent = createMockEvent(
    type,
    journey,
    { testField: 'testValue' },
    opts
  );
  
  // Apply invalidations
  const invalidEvent = { ...validEvent };
  
  for (const [field, value] of Object.entries(invalidations)) {
    // Handle nested fields with dot notation
    if (field.includes('.')) {
      const parts = field.split('.');
      let current: any = invalidEvent;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
    } else {
      (invalidEvent as any)[field] = value;
    }
  }
  
  return invalidEvent;
}