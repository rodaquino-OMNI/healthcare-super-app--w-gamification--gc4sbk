/**
 * Base event fixtures for testing the event system.
 * 
 * This file provides foundational event fixtures that serve as the base for all event types
 * across journeys. These fixtures enable consistent testing of the core event processing
 * pipeline independent of journey-specific logic.
 */

/**
 * Interface for base event properties that all events must have
 */
export interface BaseEvent {
  type: string;
  userId: string;
  timestamp: string;
  data: Record<string, any>;
  journey?: string;
  metadata?: Record<string, any>;
}

/**
 * Valid UUID for testing purposes
 */
export const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

/**
 * Creates a timestamp string in ISO format for the current time
 */
export const createTimestamp = (): string => new Date().toISOString();

/**
 * Creates a timestamp string in ISO format for a specific time in the past
 * @param minutesAgo Number of minutes in the past
 */
export const createPastTimestamp = (minutesAgo: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

/**
 * Creates a basic valid event with minimal required properties
 * @param type Event type
 * @param userId User ID (defaults to TEST_USER_ID)
 * @param data Event data (defaults to empty object)
 */
export const createBaseEvent = (
  type: string,
  userId: string = TEST_USER_ID,
  data: Record<string, any> = {}
): BaseEvent => ({
  type,
  userId,
  timestamp: createTimestamp(),
  data,
});

/**
 * Creates a complete event with all possible properties
 * @param type Event type
 * @param userId User ID (defaults to TEST_USER_ID)
 * @param data Event data (defaults to empty object)
 * @param journey Journey identifier (health, care, plan)
 * @param metadata Additional metadata for the event
 */
export const createCompleteEvent = (
  type: string,
  userId: string = TEST_USER_ID,
  data: Record<string, any> = {},
  journey?: string,
  metadata: Record<string, any> = {}
): BaseEvent => ({
  type,
  userId,
  timestamp: createTimestamp(),
  data,
  journey,
  metadata,
});

/**
 * Creates a health journey event
 * @param type Event type
 * @param data Event data (defaults to empty object)
 * @param userId User ID (defaults to TEST_USER_ID)
 */
export const createHealthEvent = (
  type: string,
  data: Record<string, any> = {},
  userId: string = TEST_USER_ID
): BaseEvent => ({
  type,
  userId,
  timestamp: createTimestamp(),
  data,
  journey: 'health',
});

/**
 * Creates a care journey event
 * @param type Event type
 * @param data Event data (defaults to empty object)
 * @param userId User ID (defaults to TEST_USER_ID)
 */
export const createCareEvent = (
  type: string,
  data: Record<string, any> = {},
  userId: string = TEST_USER_ID
): BaseEvent => ({
  type,
  userId,
  timestamp: createTimestamp(),
  data,
  journey: 'care',
});

/**
 * Creates a plan journey event
 * @param type Event type
 * @param data Event data (defaults to empty object)
 * @param userId User ID (defaults to TEST_USER_ID)
 */
export const createPlanEvent = (
  type: string,
  data: Record<string, any> = {},
  userId: string = TEST_USER_ID
): BaseEvent => ({
  type,
  userId,
  timestamp: createTimestamp(),
  data,
  journey: 'plan',
});

/**
 * Creates an event with a specific timestamp
 * @param type Event type
 * @param timestamp ISO timestamp string
 * @param data Event data (defaults to empty object)
 * @param userId User ID (defaults to TEST_USER_ID)
 */
export const createEventWithTimestamp = (
  type: string,
  timestamp: string,
  data: Record<string, any> = {},
  userId: string = TEST_USER_ID
): BaseEvent => ({
  type,
  userId,
  timestamp,
  data,
});

/**
 * Creates an event with custom metadata
 * @param type Event type
 * @param metadata Custom metadata object
 * @param data Event data (defaults to empty object)
 * @param userId User ID (defaults to TEST_USER_ID)
 */
export const createEventWithMetadata = (
  type: string,
  metadata: Record<string, any>,
  data: Record<string, any> = {},
  userId: string = TEST_USER_ID
): BaseEvent => ({
  type,
  userId,
  timestamp: createTimestamp(),
  data,
  metadata,
});

/**
 * Common event types across all journeys
 */
export enum CommonEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_UPDATED_PROFILE = 'USER_UPDATED_PROFILE',
  USER_COMPLETED_ONBOARDING = 'USER_COMPLETED_ONBOARDING',
}

/**
 * Health journey event types
 */
export enum HealthEventType {
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  HEALTH_GOAL_UPDATED = 'HEALTH_GOAL_UPDATED',
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  HEALTH_INSIGHT_VIEWED = 'HEALTH_INSIGHT_VIEWED',
}

/**
 * Care journey event types
 */
export enum CareEventType {
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_ATTENDED = 'APPOINTMENT_ATTENDED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  SYMPTOM_CHECKED = 'SYMPTOM_CHECKED',
}

/**
 * Plan journey event types
 */
export enum PlanEventType {
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  BENEFIT_VIEWED = 'BENEFIT_VIEWED',
  BENEFIT_USED = 'BENEFIT_USED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  COVERAGE_CHECKED = 'COVERAGE_CHECKED',
}

/**
 * Gamification event types
 */
export enum GamificationEventType {
  XP_EARNED = 'XP_EARNED',
  LEVEL_UP = 'LEVEL_UP',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  QUEST_STARTED = 'QUEST_STARTED',
  QUEST_PROGRESSED = 'QUEST_PROGRESSED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  REWARD_EARNED = 'REWARD_EARNED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
}

/**
 * Standard event fixtures for testing
 */
export const standardEventFixtures = {
  // Common events
  userRegistered: createBaseEvent(CommonEventType.USER_REGISTERED, TEST_USER_ID, {
    email: 'user@example.com',
    name: 'Test User',
  }),
  userLoggedIn: createBaseEvent(CommonEventType.USER_LOGGED_IN, TEST_USER_ID, {
    loginMethod: 'password',
  }),
  
  // Health journey events
  healthMetricRecorded: createHealthEvent(HealthEventType.HEALTH_METRIC_RECORDED, {
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
  }),
  healthGoalAchieved: createHealthEvent(HealthEventType.HEALTH_GOAL_ACHIEVED, {
    goalId: '123',
    goalType: 'STEPS',
    targetValue: 10000,
    achievedValue: 10500,
  }),
  deviceConnected: createHealthEvent(HealthEventType.DEVICE_CONNECTED, {
    deviceId: 'device-123',
    deviceType: 'Smartwatch',
    manufacturer: 'FitBit',
  }),
  
  // Care journey events
  appointmentBooked: createCareEvent(CareEventType.APPOINTMENT_BOOKED, {
    appointmentId: 'appt-123',
    providerId: 'provider-456',
    specialtyId: 'specialty-789',
    dateTime: new Date().toISOString(),
  }),
  medicationTaken: createCareEvent(CareEventType.MEDICATION_TAKEN, {
    medicationId: 'med-123',
    medicationName: 'Aspirin',
    dosage: '100mg',
    adherenceStreak: 5,
  }),
  
  // Plan journey events
  claimSubmitted: createPlanEvent(PlanEventType.CLAIM_SUBMITTED, {
    claimId: 'claim-123',
    claimType: 'MEDICAL',
    amount: 150.75,
    serviceDate: new Date().toISOString(),
  }),
  benefitUsed: createPlanEvent(PlanEventType.BENEFIT_USED, {
    benefitId: 'benefit-123',
    benefitType: 'GYM_MEMBERSHIP',
    value: 50.00,
  }),
};

/**
 * Malformed event fixtures for negative testing
 */
export const malformedEventFixtures = {
  missingType: {
    userId: TEST_USER_ID,
    timestamp: createTimestamp(),
    data: {},
  },
  missingUserId: {
    type: 'TEST_EVENT',
    timestamp: createTimestamp(),
    data: {},
  },
  missingTimestamp: {
    type: 'TEST_EVENT',
    userId: TEST_USER_ID,
    data: {},
  },
  missingData: {
    type: 'TEST_EVENT',
    userId: TEST_USER_ID,
    timestamp: createTimestamp(),
  },
  invalidUserId: {
    type: 'TEST_EVENT',
    userId: 'not-a-uuid',
    timestamp: createTimestamp(),
    data: {},
  },
  invalidTimestamp: {
    type: 'TEST_EVENT',
    userId: TEST_USER_ID,
    timestamp: 'not-a-timestamp',
    data: {},
  },
  emptyData: {
    type: 'TEST_EVENT',
    userId: TEST_USER_ID,
    timestamp: createTimestamp(),
    data: {},
  },
  nullData: {
    type: 'TEST_EVENT',
    userId: TEST_USER_ID,
    timestamp: createTimestamp(),
    data: null,
  },
};

/**
 * Event fixtures with varying metadata for testing context handling
 */
export const metadataEventFixtures = {
  withSource: createEventWithMetadata('TEST_EVENT', { source: 'mobile-app' }, { testData: true }),
  withVersion: createEventWithMetadata('TEST_EVENT', { version: '1.0.0' }, { testData: true }),
  withCorrelationId: createEventWithMetadata('TEST_EVENT', { correlationId: 'corr-123' }, { testData: true }),
  withDeviceInfo: createEventWithMetadata('TEST_EVENT', {
    device: {
      type: 'mobile',
      os: 'iOS',
      osVersion: '15.0',
      appVersion: '2.1.0',
    },
  }, { testData: true }),
  withLocation: createEventWithMetadata('TEST_EVENT', {
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      accuracy: 10,
    },
  }, { testData: true }),
  withSessionInfo: createEventWithMetadata('TEST_EVENT', {
    session: {
      id: 'session-123',
      startTime: createPastTimestamp(30),
      duration: 1800, // seconds
    },
  }, { testData: true }),
};

/**
 * Event fixtures with different timestamps for testing time-based processing
 */
export const timestampEventFixtures = {
  current: createEventWithTimestamp('TEST_EVENT', createTimestamp(), { testData: true }),
  oneMinuteAgo: createEventWithTimestamp('TEST_EVENT', createPastTimestamp(1), { testData: true }),
  oneHourAgo: createEventWithTimestamp('TEST_EVENT', createPastTimestamp(60), { testData: true }),
  oneDayAgo: createEventWithTimestamp('TEST_EVENT', createPastTimestamp(60 * 24), { testData: true }),
  oneWeekAgo: createEventWithTimestamp('TEST_EVENT', createPastTimestamp(60 * 24 * 7), { testData: true }),
};

/**
 * Factory function to create a batch of events for testing bulk processing
 * @param count Number of events to create
 * @param type Event type (defaults to 'TEST_EVENT')
 * @param journey Optional journey identifier
 */
export const createEventBatch = (
  count: number,
  type: string = 'TEST_EVENT',
  journey?: string
): BaseEvent[] => {
  const events: BaseEvent[] = [];
  
  for (let i = 0; i < count; i++) {
    events.push({
      type,
      userId: TEST_USER_ID,
      timestamp: createTimestamp(),
      data: { index: i, batchSize: count },
      journey,
    });
  }
  
  return events;
};

/**
 * Factory function to create events with sequential timestamps
 * @param count Number of events to create
 * @param intervalMinutes Minutes between each event
 * @param type Event type (defaults to 'TEST_EVENT')
 */
export const createSequentialEvents = (
  count: number,
  intervalMinutes: number,
  type: string = 'TEST_EVENT'
): BaseEvent[] => {
  const events: BaseEvent[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = createPastTimestamp(intervalMinutes * (count - i - 1));
    
    events.push({
      type,
      userId: TEST_USER_ID,
      timestamp,
      data: { sequence: i + 1, total: count },
    });
  }
  
  return events;
};