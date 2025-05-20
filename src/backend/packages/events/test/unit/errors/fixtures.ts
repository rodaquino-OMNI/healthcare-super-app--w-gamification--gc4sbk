import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { ERROR_CODES } from '../../../src/constants/errors.constants';
import { TOPICS } from '../../../src/constants/topics.constants';

/**
 * Test fixture interface for event objects
 */
export interface TestEvent {
  id: string;
  type: EventType;
  payload: Record<string, any>;
  metadata: {
    userId: string;
    timestamp: string;
    correlationId: string;
    source: string;
    version: string;
  };
}

/**
 * Test fixture interface for error context
 */
export interface ErrorContext {
  errorCode: string;
  errorMessage: string;
  topic: string;
  partition?: number;
  offset?: number;
  stackTrace?: string;
  timestamp: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Test fixture interface for retry state
 */
export interface RetryState {
  attemptCount: number;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  nextAttemptAt?: string;
  firstAttemptAt: string;
  lastAttemptAt?: string;
}

/**
 * Test fixture interface for DLQ message
 */
export interface DLQMessage {
  originalEvent: TestEvent;
  errorContext: ErrorContext;
  retryState: RetryState;
  sentToDLQAt: string;
}

// ===== HEALTH JOURNEY EVENT FIXTURES =====

/**
 * Sample health metric recorded event
 */
export const healthMetricRecordedEvent: TestEvent = {
  id: 'health-event-1',
  type: EventType.HEALTH_METRIC_RECORDED,
  payload: {
    metricType: 'blood_pressure',
    value: 120,
    unit: 'mmHg',
    timestamp: '2023-04-15T10:30:00Z',
    source: 'manual'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-15T10:30:05Z',
    correlationId: 'corr-abc-123',
    source: 'health-service',
    version: '1.0.0'
  }
};

/**
 * Sample health goal achieved event
 */
export const healthGoalAchievedEvent: TestEvent = {
  id: 'health-event-2',
  type: EventType.HEALTH_GOAL_ACHIEVED,
  payload: {
    goalId: 'goal-456',
    goalType: 'steps',
    targetValue: 10000,
    achievedValue: 10250,
    completedAt: '2023-04-15T22:00:00Z'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-15T22:00:05Z',
    correlationId: 'corr-def-456',
    source: 'health-service',
    version: '1.0.0'
  }
};

/**
 * Sample health device connected event
 */
export const healthDeviceConnectedEvent: TestEvent = {
  id: 'health-event-3',
  type: EventType.HEALTH_DEVICE_CONNECTED,
  payload: {
    deviceId: 'device-789',
    deviceType: 'fitbit',
    connectionMethod: 'oauth',
    connectedAt: '2023-04-16T09:15:00Z'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-16T09:15:05Z',
    correlationId: 'corr-ghi-789',
    source: 'health-service',
    version: '1.0.0'
  }
};

// ===== CARE JOURNEY EVENT FIXTURES =====

/**
 * Sample care appointment booked event
 */
export const careAppointmentBookedEvent: TestEvent = {
  id: 'care-event-1',
  type: EventType.CARE_APPOINTMENT_BOOKED,
  payload: {
    appointmentId: 'appt-123',
    providerId: 'provider-456',
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: '2023-04-20T14:30:00Z',
    bookedAt: '2023-04-16T10:45:00Z'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-16T10:45:05Z',
    correlationId: 'corr-jkl-123',
    source: 'care-service',
    version: '1.0.0'
  }
};

/**
 * Sample care medication taken event
 */
export const careMedicationTakenEvent: TestEvent = {
  id: 'care-event-2',
  type: EventType.CARE_MEDICATION_TAKEN,
  payload: {
    medicationId: 'med-789',
    medicationName: 'Atenolol',
    dosage: '50mg',
    takenAt: '2023-04-16T08:00:00Z',
    adherence: 'on_time'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-16T08:00:05Z',
    correlationId: 'corr-mno-456',
    source: 'care-service',
    version: '1.0.0'
  }
};

/**
 * Sample care telemedicine completed event
 */
export const careTelemedicineCompletedEvent: TestEvent = {
  id: 'care-event-3',
  type: EventType.CARE_TELEMEDICINE_COMPLETED,
  payload: {
    sessionId: 'session-123',
    appointmentId: 'appt-456',
    providerId: 'provider-789',
    startedAt: '2023-04-16T15:00:00Z',
    endedAt: '2023-04-16T15:30:00Z',
    duration: 30,
    quality: 'good'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-16T15:30:05Z',
    correlationId: 'corr-pqr-789',
    source: 'care-service',
    version: '1.0.0'
  }
};

// ===== PLAN JOURNEY EVENT FIXTURES =====

/**
 * Sample plan claim submitted event
 */
export const planClaimSubmittedEvent: TestEvent = {
  id: 'plan-event-1',
  type: EventType.PLAN_CLAIM_SUBMITTED,
  payload: {
    claimId: 'claim-123',
    claimType: 'medical',
    providerId: 'provider-456',
    serviceDate: '2023-04-10T09:00:00Z',
    amount: 150.00,
    submittedAt: '2023-04-17T11:30:00Z'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-17T11:30:05Z',
    correlationId: 'corr-stu-123',
    source: 'plan-service',
    version: '1.0.0'
  }
};

/**
 * Sample plan benefit utilized event
 */
export const planBenefitUtilizedEvent: TestEvent = {
  id: 'plan-event-2',
  type: EventType.PLAN_BENEFIT_UTILIZED,
  payload: {
    benefitId: 'benefit-456',
    benefitType: 'preventive',
    providerId: 'provider-789',
    utilizationDate: '2023-04-17T14:00:00Z',
    savingsAmount: 75.00
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-17T14:00:05Z',
    correlationId: 'corr-vwx-456',
    source: 'plan-service',
    version: '1.0.0'
  }
};

/**
 * Sample plan reward redeemed event
 */
export const planRewardRedeemedEvent: TestEvent = {
  id: 'plan-event-3',
  type: EventType.PLAN_REWARD_REDEEMED,
  payload: {
    rewardId: 'reward-789',
    rewardType: 'gift_card',
    pointsRedeemed: 1000,
    value: 50.00,
    redeemedAt: '2023-04-17T16:45:00Z'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-17T16:45:05Z',
    correlationId: 'corr-yza-789',
    source: 'plan-service',
    version: '1.0.0'
  }
};

// ===== GAMIFICATION EVENT FIXTURES =====

/**
 * Sample gamification points earned event
 */
export const gamificationPointsEarnedEvent: TestEvent = {
  id: 'game-event-1',
  type: EventType.GAMIFICATION_POINTS_EARNED,
  payload: {
    sourceType: 'health',
    sourceId: 'health-event-2',
    points: 50,
    reason: 'Goal achievement',
    earnedAt: '2023-04-15T22:00:10Z'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-15T22:00:15Z',
    correlationId: 'corr-def-456',
    source: 'gamification-engine',
    version: '1.0.0'
  }
};

/**
 * Sample gamification achievement unlocked event
 */
export const gamificationAchievementUnlockedEvent: TestEvent = {
  id: 'game-event-2',
  type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
  payload: {
    achievementId: 'achievement-123',
    achievementType: 'health-check-streak',
    tier: 'silver',
    points: 100,
    unlockedAt: '2023-04-17T22:15:00Z'
  },
  metadata: {
    userId: 'user-123',
    timestamp: '2023-04-17T22:15:05Z',
    correlationId: 'corr-bcd-123',
    source: 'gamification-engine',
    version: '1.0.0'
  }
};

// ===== ERROR CONTEXT FIXTURES =====

/**
 * Sample error context for schema validation failure
 */
export const schemaValidationErrorContext: ErrorContext = {
  errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
  errorMessage: 'Event failed schema validation: required property "value" is missing',
  topic: TOPICS.HEALTH.EVENTS,
  partition: 0,
  offset: 12345,
  stackTrace: 'Error: Event failed schema validation\n    at validateEvent (/app/src/validation.ts:45:11)\n    at processMessage (/app/src/consumer.ts:78:23)',
  timestamp: '2023-04-18T09:30:00Z',
  additionalInfo: {
    validationErrors: [
      {
        property: 'payload.value',
        constraints: {
          isRequired: 'value is required'
        }
      }
    ]
  }
};

/**
 * Sample error context for consumer processing failure
 */
export const consumerProcessingErrorContext: ErrorContext = {
  errorCode: ERROR_CODES.CONSUMER_PROCESSING_FAILED,
  errorMessage: 'Failed to process message: database connection error',
  topic: TOPICS.CARE.EVENTS,
  partition: 1,
  offset: 67890,
  stackTrace: 'Error: Failed to process message\n    at processEvent (/app/src/processor.ts:112:9)\n    at handleMessage (/app/src/consumer.ts:156:18)',
  timestamp: '2023-04-18T10:45:00Z',
  additionalInfo: {
    databaseError: 'Connection refused'
  }
};

/**
 * Sample error context for message deserialization failure
 */
export const deserializationErrorContext: ErrorContext = {
  errorCode: ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
  errorMessage: 'Failed to deserialize message: invalid JSON format',
  topic: TOPICS.PLAN.EVENTS,
  partition: 2,
  offset: 54321,
  stackTrace: 'SyntaxError: Unexpected token } in JSON at position 42\n    at JSON.parse (<anonymous>)\n    at deserializeMessage (/app/src/serialization.ts:28:20)',
  timestamp: '2023-04-18T11:15:00Z',
  additionalInfo: {
    rawMessage: '{"id":"plan-event-4","type":"PLAN_CLAIM_PROCESSED","payload":{"claimId":"claim-456",}}'
  }
};

// ===== RETRY STATE FIXTURES =====

/**
 * Sample retry state for first attempt
 */
export const firstAttemptRetryState: RetryState = {
  attemptCount: 1,
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  nextAttemptAt: '2023-04-18T09:30:01Z',
  firstAttemptAt: '2023-04-18T09:30:00Z',
  lastAttemptAt: '2023-04-18T09:30:00Z'
};

/**
 * Sample retry state for middle attempt
 */
export const midAttemptRetryState: RetryState = {
  attemptCount: 3,
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  nextAttemptAt: '2023-04-18T09:30:07Z',
  firstAttemptAt: '2023-04-18T09:30:00Z',
  lastAttemptAt: '2023-04-18T09:30:04Z'
};

/**
 * Sample retry state for final attempt
 */
export const finalAttemptRetryState: RetryState = {
  attemptCount: 5,
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  nextAttemptAt: undefined,
  firstAttemptAt: '2023-04-18T09:30:00Z',
  lastAttemptAt: '2023-04-18T09:30:16Z'
};

/**
 * Sample retry state with custom configuration
 */
export const customRetryState: RetryState = {
  attemptCount: 2,
  maxAttempts: 10,
  initialDelay: 500,
  maxDelay: 60000,
  backoffFactor: 3,
  nextAttemptAt: '2023-04-18T09:30:04.5Z',
  firstAttemptAt: '2023-04-18T09:30:00Z',
  lastAttemptAt: '2023-04-18T09:30:01.5Z'
};

// ===== DLQ MESSAGE FIXTURES =====

/**
 * Sample DLQ message for schema validation error
 */
export const schemaValidationDLQMessage: DLQMessage = {
  originalEvent: healthMetricRecordedEvent,
  errorContext: schemaValidationErrorContext,
  retryState: finalAttemptRetryState,
  sentToDLQAt: '2023-04-18T09:30:20Z'
};

/**
 * Sample DLQ message for consumer processing error
 */
export const consumerProcessingDLQMessage: DLQMessage = {
  originalEvent: careAppointmentBookedEvent,
  errorContext: consumerProcessingErrorContext,
  retryState: finalAttemptRetryState,
  sentToDLQAt: '2023-04-18T10:45:20Z'
};

/**
 * Sample DLQ message for deserialization error
 */
export const deserializationDLQMessage: DLQMessage = {
  originalEvent: planClaimSubmittedEvent,
  errorContext: deserializationErrorContext,
  retryState: finalAttemptRetryState,
  sentToDLQAt: '2023-04-18T11:15:20Z'
};

// ===== HELPER FUNCTIONS =====

/**
 * Creates a test event with custom properties
 * 
 * @param type - The event type
 * @param payload - The event payload
 * @param metadata - Optional metadata overrides
 * @returns A test event object
 */
export function createTestEvent(type: EventType, payload: Record<string, any>, metadata?: Partial<TestEvent['metadata']>): TestEvent {
  const defaultMetadata = {
    userId: 'user-test',
    timestamp: new Date().toISOString(),
    correlationId: `corr-${Math.random().toString(36).substring(2, 9)}`,
    source: 'test-service',
    version: '1.0.0'
  };

  return {
    id: `test-event-${Math.random().toString(36).substring(2, 9)}`,
    type,
    payload,
    metadata: { ...defaultMetadata, ...metadata }
  };
}

/**
 * Creates an error context with custom properties
 * 
 * @param errorCode - The error code
 * @param errorMessage - The error message
 * @param topic - The Kafka topic
 * @param additionalInfo - Optional additional error information
 * @returns An error context object
 */
export function createErrorContext(errorCode: string, errorMessage: string, topic: string, additionalInfo?: Record<string, any>): ErrorContext {
  return {
    errorCode,
    errorMessage,
    topic,
    partition: Math.floor(Math.random() * 10),
    offset: Math.floor(Math.random() * 100000),
    timestamp: new Date().toISOString(),
    additionalInfo
  };
}

/**
 * Creates a retry state with custom properties
 * 
 * @param attemptCount - The current attempt count
 * @param maxAttempts - The maximum number of attempts
 * @param options - Optional retry configuration
 * @returns A retry state object
 */
export function createRetryState(attemptCount: number, maxAttempts: number, options?: Partial<RetryState>): RetryState {
  const now = new Date();
  const firstAttemptAt = new Date(now.getTime() - (attemptCount * 1000)).toISOString();
  const lastAttemptAt = attemptCount > 1 ? new Date(now.getTime() - 1000).toISOString() : firstAttemptAt;
  
  const initialDelay = options?.initialDelay || 1000;
  const backoffFactor = options?.backoffFactor || 2;
  const currentDelay = Math.min(
    options?.maxDelay || 30000,
    initialDelay * Math.pow(backoffFactor, attemptCount - 1)
  );
  
  const nextAttemptAt = attemptCount < maxAttempts 
    ? new Date(now.getTime() + currentDelay).toISOString() 
    : undefined;
  
  return {
    attemptCount,
    maxAttempts,
    initialDelay: options?.initialDelay || 1000,
    maxDelay: options?.maxDelay || 30000,
    backoffFactor: options?.backoffFactor || 2,
    nextAttemptAt,
    firstAttemptAt,
    lastAttemptAt,
    ...options
  };
}

/**
 * Creates a DLQ message with custom properties
 * 
 * @param originalEvent - The original event that failed processing
 * @param errorContext - The error context
 * @param retryState - The retry state
 * @returns A DLQ message object
 */
export function createDLQMessage(originalEvent: TestEvent, errorContext: ErrorContext, retryState: RetryState): DLQMessage {
  return {
    originalEvent,
    errorContext,
    retryState,
    sentToDLQAt: new Date().toISOString()
  };
}

/**
 * Creates a collection of test events for a specific journey
 * 
 * @param journey - The journey type (health, care, plan, gamification, user)
 * @param count - The number of events to create
 * @returns An array of test events
 */
export function createJourneyEvents(journey: 'health' | 'care' | 'plan' | 'gamification' | 'user', count: number): TestEvent[] {
  const events: TestEvent[] = [];
  let eventTypes: EventType[] = [];
  
  // Select event types based on journey
  switch (journey) {
    case 'health':
      eventTypes = Object.values(JourneyEvents.Health);
      break;
    case 'care':
      eventTypes = Object.values(JourneyEvents.Care);
      break;
    case 'plan':
      eventTypes = Object.values(JourneyEvents.Plan);
      break;
    case 'gamification':
      eventTypes = Object.values(JourneyEvents.Gamification);
      break;
    case 'user':
      eventTypes = Object.values(JourneyEvents.User);
      break;
  }
  
  // Create the requested number of events
  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[i % eventTypes.length];
    let payload: Record<string, any> = {};
    
    // Create appropriate payload based on event type
    switch (eventType) {
      // Health journey events
      case EventType.HEALTH_METRIC_RECORDED:
        payload = {
          metricType: ['blood_pressure', 'weight', 'steps', 'heart_rate'][Math.floor(Math.random() * 4)],
          value: Math.floor(Math.random() * 200),
          unit: ['mmHg', 'kg', 'steps', 'bpm'][Math.floor(Math.random() * 4)],
          timestamp: new Date().toISOString(),
          source: ['manual', 'device', 'integration'][Math.floor(Math.random() * 3)]
        };
        break;
      
      case EventType.HEALTH_GOAL_ACHIEVED:
        payload = {
          goalId: `goal-${Math.floor(Math.random() * 1000)}`,
          goalType: ['steps', 'weight_loss', 'sleep'][Math.floor(Math.random() * 3)],
          targetValue: Math.floor(Math.random() * 10000),
          achievedValue: Math.floor(Math.random() * 10000),
          completedAt: new Date().toISOString()
        };
        break;
      
      // Care journey events
      case EventType.CARE_APPOINTMENT_BOOKED:
        payload = {
          appointmentId: `appt-${Math.floor(Math.random() * 1000)}`,
          providerId: `provider-${Math.floor(Math.random() * 1000)}`,
          specialtyType: ['Cardiologia', 'Dermatologia', 'Ortopedia'][Math.floor(Math.random() * 3)],
          appointmentType: ['in_person', 'telemedicine'][Math.floor(Math.random() * 2)],
          scheduledAt: new Date(Date.now() + 86400000 * 7).toISOString(),
          bookedAt: new Date().toISOString()
        };
        break;
      
      // Plan journey events
      case EventType.PLAN_CLAIM_SUBMITTED:
        payload = {
          claimId: `claim-${Math.floor(Math.random() * 1000)}`,
          claimType: ['medical', 'dental', 'vision', 'pharmacy'][Math.floor(Math.random() * 4)],
          providerId: `provider-${Math.floor(Math.random() * 1000)}`,
          serviceDate: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 30)).toISOString(),
          amount: Math.floor(Math.random() * 1000) + Math.random(),
          submittedAt: new Date().toISOString()
        };
        break;
      
      // Gamification events
      case EventType.GAMIFICATION_POINTS_EARNED:
        payload = {
          sourceType: ['health', 'care', 'plan'][Math.floor(Math.random() * 3)],
          sourceId: `event-${Math.floor(Math.random() * 1000)}`,
          points: Math.floor(Math.random() * 100),
          reason: ['Goal achievement', 'Appointment attendance', 'Claim submission'][Math.floor(Math.random() * 3)],
          earnedAt: new Date().toISOString()
        };
        break;
      
      // User events
      case EventType.USER_LOGIN:
        payload = {
          loginMethod: ['password', 'sso', 'biometric'][Math.floor(Math.random() * 3)],
          deviceType: ['mobile', 'web'][Math.floor(Math.random() * 2)],
          loginAt: new Date().toISOString()
        };
        break;
      
      // Default payload for other event types
      default:
        payload = {
          timestamp: new Date().toISOString(),
          data: `Sample data for ${eventType}`,
          randomValue: Math.floor(Math.random() * 1000)
        };
    }
    
    events.push(createTestEvent(eventType, payload));
  }
  
  return events;
}