/**
 * @file fixtures.ts
 * @description Provides test fixtures for event error testing scenarios.
 * Includes sample events, error contexts, retry states, and DLQ messages for consistent use across test files.
 * This utility ensures that test cases use standardized inputs, making tests more maintainable and easier to understand
 * while providing realistic test data representing various journey events and error conditions.
 */

import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { JourneyType, HealthEventType, CareEventType, PlanEventType } from '../../../src/interfaces/journey-events.interface';
import { EventErrorContext, EventProcessingStage } from '../../../src/errors/event-errors';
import { RetryContext, RetryStatus } from '../../../src/errors/retry-policies';
import { DlqEntry, DlqEntryMetadata } from '../../../src/errors/dlq';
import { ErrorType } from '@austa/errors';
import { EventResponseStatus } from '../../../src/interfaces/event-response.interface';

// ===== SAMPLE EVENTS =====

/**
 * Sample health journey events for testing
 */
export const healthEvents = {
  /**
   * Sample health metric recorded event
   */
  metricRecorded: {
    eventId: 'health-event-1',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'health-service',
    type: HealthEventType.METRIC_RECORDED,
    journey: JourneyType.HEALTH,
    userId: 'user-123',
    payload: {
      metric: {
        id: 'metric-123',
        userId: 'user-123',
        type: 'HEART_RATE',
      },
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: new Date().toISOString(),
      source: 'manual',
    },
    metadata: {
      correlationId: 'corr-123',
      deviceInfo: {
        type: 'mobile',
        os: 'iOS',
        appVersion: '1.2.3',
      },
    },
  },

  /**
   * Sample health goal achieved event
   */
  goalAchieved: {
    eventId: 'health-event-2',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'health-service',
    type: HealthEventType.GOAL_ACHIEVED,
    journey: JourneyType.HEALTH,
    userId: 'user-123',
    payload: {
      goal: {
        id: 'goal-123',
        userId: 'user-123',
        type: 'STEPS',
        targetValue: 10000,
      },
      achievedValue: 10250,
      targetValue: 10000,
      achievedDate: new Date().toISOString(),
      daysToAchieve: 1,
      streakCount: 3,
    },
    metadata: {
      correlationId: 'corr-123',
    },
  },

  /**
   * Sample device connected event
   */
  deviceConnected: {
    eventId: 'health-event-3',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'health-service',
    type: HealthEventType.DEVICE_CONNECTED,
    journey: JourneyType.HEALTH,
    userId: 'user-123',
    payload: {
      device: {
        id: 'device-123',
        userId: 'user-123',
        type: 'Smartwatch',
      },
      deviceType: 'Smartwatch',
      connectionDate: new Date().toISOString(),
      isFirstConnection: true,
      permissions: ['activity', 'heartRate'],
    },
    metadata: {
      correlationId: 'corr-123',
    },
  },
};

/**
 * Sample care journey events for testing
 */
export const careEvents = {
  /**
   * Sample appointment booked event
   */
  appointmentBooked: {
    eventId: 'care-event-1',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'care-service',
    type: CareEventType.APPOINTMENT_BOOKED,
    journey: JourneyType.CARE,
    userId: 'user-123',
    payload: {
      appointment: {
        id: 'appointment-123',
        userId: 'user-123',
        providerId: 'provider-456',
        status: 'SCHEDULED',
      },
      provider: 'Dr. Smith',
      appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      appointmentType: 'CONSULTATION',
      isFirstAppointment: true,
      isUrgent: false,
    },
    metadata: {
      correlationId: 'corr-123',
    },
  },

  /**
   * Sample medication taken event
   */
  medicationTaken: {
    eventId: 'care-event-2',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'care-service',
    type: CareEventType.MEDICATION_TAKEN,
    journey: JourneyType.CARE,
    userId: 'user-123',
    payload: {
      medication: {
        id: 'medication-123',
        userId: 'user-123',
        name: 'Aspirin',
        dosage: '100mg',
      },
      takenDate: new Date().toISOString(),
      scheduledTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      takenOnTime: true,
      dosageTaken: '100mg',
    },
    metadata: {
      correlationId: 'corr-123',
    },
  },

  /**
   * Sample telemedicine started event
   */
  telemedicineStarted: {
    eventId: 'care-event-3',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'care-service',
    type: CareEventType.TELEMEDICINE_STARTED,
    journey: JourneyType.CARE,
    userId: 'user-123',
    payload: {
      session: {
        id: 'session-123',
        userId: 'user-123',
        providerId: 'provider-456',
      },
      provider: 'Dr. Johnson',
      startDate: new Date().toISOString(),
      appointmentId: 'appointment-123',
      isScheduled: true,
      connectionQuality: 'good',
    },
    metadata: {
      correlationId: 'corr-123',
    },
  },
};

/**
 * Sample plan journey events for testing
 */
export const planEvents = {
  /**
   * Sample claim submitted event
   */
  claimSubmitted: {
    eventId: 'plan-event-1',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'plan-service',
    type: PlanEventType.CLAIM_SUBMITTED,
    journey: JourneyType.PLAN,
    userId: 'user-123',
    payload: {
      claim: {
        id: 'claim-123',
        userId: 'user-123',
        status: 'SUBMITTED',
      },
      submissionDate: new Date().toISOString(),
      amount: 150.75,
      serviceDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      provider: 'City Hospital',
      hasDocuments: true,
      documentCount: 2,
      isFirstClaim: false,
    },
    metadata: {
      correlationId: 'corr-123',
    },
  },

  /**
   * Sample benefit used event
   */
  benefitUsed: {
    eventId: 'plan-event-2',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'plan-service',
    type: PlanEventType.BENEFIT_USED,
    journey: JourneyType.PLAN,
    userId: 'user-123',
    payload: {
      benefit: {
        id: 'benefit-123',
        userId: 'user-123',
        type: 'DENTAL',
      },
      usageDate: new Date().toISOString(),
      provider: 'Dental Clinic',
      serviceDescription: 'Routine cleaning',
      amountUsed: 75.0,
      remainingAmount: 425.0,
      remainingPercentage: 85,
      isFirstUse: false,
    },
    metadata: {
      correlationId: 'corr-123',
    },
  },

  /**
   * Sample reward redeemed event
   */
  rewardRedeemed: {
    eventId: 'plan-event-3',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'plan-service',
    type: PlanEventType.REWARD_REDEEMED,
    journey: JourneyType.PLAN,
    userId: 'user-123',
    payload: {
      rewardId: 'reward-123',
      rewardName: 'Fitness Discount',
      rewardType: 'discount',
      redemptionDate: new Date().toISOString(),
      pointsUsed: 500,
      monetaryValue: 50.0,
      expirationDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      isFirstRedemption: false,
    },
    metadata: {
      correlationId: 'corr-123',
    },
  },
};

// ===== ERROR CONTEXTS =====

/**
 * Sample error contexts for different error scenarios
 */
export const errorContexts: Record<string, EventErrorContext> = {
  /**
   * Validation error context
   */
  validation: {
    eventId: 'event-123',
    eventType: 'health.metric.recorded',
    eventSource: 'health-service',
    processingStage: EventProcessingStage.VALIDATION,
    details: {
      validationErrors: [
        {
          field: 'payload.value',
          message: 'Value must be a positive number',
        },
      ],
    },
  },

  /**
   * Deserialization error context
   */
  deserialization: {
    eventId: 'event-123',
    eventType: 'care.appointment.booked',
    eventSource: 'care-service',
    processingStage: EventProcessingStage.DESERIALIZATION,
    details: {
      rawMessage: '{"eventId":"event-123","type":"care.appointment.booked","payload":{"invalid json"}',
      parseError: 'Unexpected token i in JSON at position 73',
    },
  },

  /**
   * Processing error context
   */
  processing: {
    eventId: 'event-123',
    eventType: 'plan.claim.submitted',
    eventSource: 'plan-service',
    processingStage: EventProcessingStage.PROCESSING,
    details: {
      processorId: 'claim-processor',
      failedOperation: 'validateClaimAmount',
      operationArgs: {
        claimId: 'claim-123',
        amount: -50.0,
      },
    },
  },

  /**
   * Database error context
   */
  database: {
    eventId: 'event-123',
    eventType: 'health.goal.achieved',
    eventSource: 'health-service',
    processingStage: EventProcessingStage.PERSISTENCE,
    details: {
      operation: 'INSERT',
      table: 'health_achievements',
      constraint: 'unique_user_goal',
      errorCode: 'P2002',
    },
  },

  /**
   * External system error context
   */
  externalSystem: {
    eventId: 'event-123',
    eventType: 'care.telemedicine.started',
    eventSource: 'care-service',
    processingStage: EventProcessingStage.PROCESSING,
    details: {
      externalSystem: 'video-provider-api',
      endpoint: '/sessions/create',
      statusCode: 503,
      responseBody: '{"error":"Service temporarily unavailable"}',
    },
  },
};

// ===== RETRY STATES =====

/**
 * Sample retry contexts for different retry scenarios
 */
export const retryContexts: Record<string, RetryContext> = {
  /**
   * First retry attempt for a network error
   */
  firstRetryNetworkError: {
    error: new Error('Connection refused'),
    attemptCount: 1,
    eventType: 'health.metric.recorded',
    source: 'health-service',
    metadata: {
      errorType: ErrorType.NETWORK,
      retryPolicy: 'ExponentialBackoff',
    },
  },

  /**
   * Multiple retry attempts for a database error
   */
  multipleRetryDatabaseError: {
    error: new Error('Database connection lost'),
    attemptCount: 3,
    eventType: 'plan.claim.submitted',
    source: 'plan-service',
    metadata: {
      errorType: ErrorType.DATABASE,
      retryPolicy: 'ExponentialBackoff',
      previousDelays: [1000, 2000, 4000],
    },
  },

  /**
   * Rate limit error with retry-after information
   */
  rateLimitError: {
    error: new Error('Rate limit exceeded'),
    attemptCount: 2,
    eventType: 'care.appointment.booked',
    source: 'care-service',
    metadata: {
      errorType: ErrorType.RATE_LIMIT,
      retryPolicy: 'FixedInterval',
      retryAfter: 5000, // milliseconds
    },
  },

  /**
   * Maximum retries reached
   */
  maxRetriesReached: {
    error: new Error('External service unavailable'),
    attemptCount: 5,
    eventType: 'care.telemedicine.started',
    source: 'care-service',
    metadata: {
      errorType: ErrorType.EXTERNAL,
      retryPolicy: 'ExponentialBackoff',
      maxRetries: 5,
      previousDelays: [1000, 2000, 4000, 8000, 16000],
    },
  },
};

/**
 * Sample retry states for tracking retry progress
 */
export const retryStates = {
  /**
   * Pending retry state
   */
  pending: {
    eventId: 'event-123',
    status: RetryStatus.PENDING,
    attemptCount: 0,
    nextRetryTime: new Date(Date.now() + 1000).toISOString(),
    error: {
      message: 'Connection refused',
      type: ErrorType.NETWORK,
      retryable: true,
    },
    retryHistory: [],
  },

  /**
   * In progress retry state
   */
  inProgress: {
    eventId: 'event-123',
    status: RetryStatus.IN_PROGRESS,
    attemptCount: 2,
    nextRetryTime: null,
    error: {
      message: 'Database connection lost',
      type: ErrorType.DATABASE,
      retryable: true,
    },
    retryHistory: [
      {
        timestamp: new Date(Date.now() - 5000).toISOString(),
        error: 'Database connection lost',
        delayMs: 1000,
      },
      {
        timestamp: new Date(Date.now() - 2000).toISOString(),
        error: 'Database connection lost',
        delayMs: 2000,
      },
    ],
  },

  /**
   * Failed retry state
   */
  failed: {
    eventId: 'event-123',
    status: RetryStatus.FAILED,
    attemptCount: 3,
    nextRetryTime: new Date(Date.now() + 4000).toISOString(),
    error: {
      message: 'External service unavailable',
      type: ErrorType.EXTERNAL,
      retryable: true,
    },
    retryHistory: [
      {
        timestamp: new Date(Date.now() - 7000).toISOString(),
        error: 'External service unavailable',
        delayMs: 1000,
      },
      {
        timestamp: new Date(Date.now() - 4000).toISOString(),
        error: 'External service unavailable',
        delayMs: 2000,
      },
      {
        timestamp: new Date(Date.now() - 1000).toISOString(),
        error: 'External service unavailable',
        delayMs: 4000,
      },
    ],
  },

  /**
   * Exhausted retry state
   */
  exhausted: {
    eventId: 'event-123',
    status: RetryStatus.EXHAUSTED,
    attemptCount: 5,
    nextRetryTime: null,
    error: {
      message: 'External service unavailable',
      type: ErrorType.EXTERNAL,
      retryable: false,
    },
    retryHistory: [
      {
        timestamp: new Date(Date.now() - 16000).toISOString(),
        error: 'External service unavailable',
        delayMs: 1000,
      },
      {
        timestamp: new Date(Date.now() - 13000).toISOString(),
        error: 'External service unavailable',
        delayMs: 2000,
      },
      {
        timestamp: new Date(Date.now() - 9000).toISOString(),
        error: 'External service unavailable',
        delayMs: 4000,
      },
      {
        timestamp: new Date(Date.now() - 5000).toISOString(),
        error: 'External service unavailable',
        delayMs: 8000,
      },
      {
        timestamp: new Date(Date.now() - 1000).toISOString(),
        error: 'External service unavailable',
        delayMs: 16000,
      },
    ],
  },

  /**
   * Succeeded retry state
   */
  succeeded: {
    eventId: 'event-123',
    status: RetryStatus.SUCCEEDED,
    attemptCount: 3,
    nextRetryTime: null,
    error: null,
    retryHistory: [
      {
        timestamp: new Date(Date.now() - 7000).toISOString(),
        error: 'Database connection lost',
        delayMs: 1000,
      },
      {
        timestamp: new Date(Date.now() - 4000).toISOString(),
        error: 'Database connection lost',
        delayMs: 2000,
      },
      {
        timestamp: new Date(Date.now() - 1000).toISOString(),
        error: null, // No error on successful attempt
        delayMs: 4000,
      },
    ],
    successTimestamp: new Date().toISOString(),
  },
};

// ===== DLQ MESSAGES =====

/**
 * Sample DLQ entries for different error scenarios
 */
export const dlqEntries: Record<string, DlqEntry> = {
  /**
   * Health journey DLQ entry for validation error
   */
  healthValidationError: {
    originalEvent: healthEvents.metricRecorded as BaseEvent,
    metadata: {
      originalEventId: healthEvents.metricRecorded.eventId,
      errorMessage: 'Validation failed: Value must be a positive number',
      errorType: 'client',
      stackTrace: 'Error: Validation failed\n    at validateEvent (/app/src/validators.ts:42:11)\n    at processEvent (/app/src/processor.ts:23:5)',
      sourceService: 'health-service',
      journey: 'health',
      dlqTimestamp: new Date().toISOString(),
      retryHistory: [],
    },
  },

  /**
   * Care journey DLQ entry for external system error with retries
   */
  careExternalError: {
    originalEvent: careEvents.telemedicineStarted as BaseEvent,
    metadata: {
      originalEventId: careEvents.telemedicineStarted.eventId,
      errorMessage: 'External service unavailable: video-provider-api returned 503',
      errorType: 'external',
      stackTrace: 'Error: External service unavailable\n    at callExternalApi (/app/src/external.ts:87:11)\n    at processTelemedicineEvent (/app/src/telemedicine.ts:45:7)',
      sourceService: 'care-service',
      journey: 'care',
      dlqTimestamp: new Date().toISOString(),
      retryHistory: [
        {
          timestamp: new Date(Date.now() - 16000).toISOString(),
          errorMessage: 'External service unavailable: video-provider-api returned 503',
          attempt: 1,
        },
        {
          timestamp: new Date(Date.now() - 8000).toISOString(),
          errorMessage: 'External service unavailable: video-provider-api returned 503',
          attempt: 2,
        },
        {
          timestamp: new Date(Date.now() - 1000).toISOString(),
          errorMessage: 'External service unavailable: video-provider-api returned 503',
          attempt: 3,
        },
      ],
    },
  },

  /**
   * Plan journey DLQ entry for database error with retries
   */
  planDatabaseError: {
    originalEvent: planEvents.claimSubmitted as BaseEvent,
    metadata: {
      originalEventId: planEvents.claimSubmitted.eventId,
      errorMessage: 'Database error: Failed to insert claim record - constraint violation',
      errorType: 'system',
      stackTrace: 'Error: Database error\n    at executeQuery (/app/src/database.ts:112:9)\n    at saveClaim (/app/src/claims.ts:78:12)',
      sourceService: 'plan-service',
      journey: 'plan',
      dlqTimestamp: new Date().toISOString(),
      retryHistory: [
        {
          timestamp: new Date(Date.now() - 10000).toISOString(),
          errorMessage: 'Database error: Failed to insert claim record - constraint violation',
          attempt: 1,
        },
        {
          timestamp: new Date(Date.now() - 5000).toISOString(),
          errorMessage: 'Database error: Failed to insert claim record - constraint violation',
          attempt: 2,
        },
      ],
    },
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Creates a custom event error context
 * 
 * @param eventId - The ID of the event
 * @param eventType - The type of the event
 * @param stage - The processing stage where the error occurred
 * @param details - Additional error details
 * @returns An event error context object
 */
export function createErrorContext(
  eventId: string,
  eventType: string,
  stage: EventProcessingStage,
  details?: Record<string, any>,
): EventErrorContext {
  return {
    eventId,
    eventType,
    eventSource: eventType.split('.')[0] + '-service',
    processingStage: stage,
    details: details || {},
  };
}

/**
 * Creates a custom retry context
 * 
 * @param eventType - The type of the event
 * @param errorMessage - The error message
 * @param attemptCount - The number of retry attempts so far
 * @param errorType - The type of error
 * @returns A retry context object
 */
export function createRetryContext(
  eventType: string,
  errorMessage: string,
  attemptCount: number,
  errorType: ErrorType,
): RetryContext {
  return {
    error: new Error(errorMessage),
    attemptCount,
    eventType,
    source: eventType.split('.')[0] + '-service',
    metadata: {
      errorType,
      retryPolicy: errorType === ErrorType.RATE_LIMIT ? 'FixedInterval' : 'ExponentialBackoff',
    },
  };
}

/**
 * Creates a custom DLQ entry
 * 
 * @param event - The original event
 * @param errorMessage - The error message
 * @param errorType - The type of error
 * @param retryCount - The number of retry attempts
 * @returns A DLQ entry object
 */
export function createDlqEntry<T extends BaseEvent>(
  event: T,
  errorMessage: string,
  errorType: 'client' | 'system' | 'transient' | 'external',
  retryCount: number = 0,
): DlqEntry<T> {
  const retryHistory: DlqEntryMetadata['retryHistory'] = [];
  
  // Generate retry history if retryCount > 0
  if (retryCount > 0) {
    const now = Date.now();
    for (let i = 0; i < retryCount; i++) {
      retryHistory.push({
        timestamp: new Date(now - (retryCount - i) * 5000).toISOString(),
        errorMessage,
        attempt: i + 1,
      });
    }
  }
  
  return {
    originalEvent: event,
    metadata: {
      originalEventId: event.eventId,
      errorMessage,
      errorType,
      sourceService: event.source || 'unknown',
      journey: event.journey as any,
      dlqTimestamp: new Date().toISOString(),
      retryHistory,
    },
  };
}

/**
 * Creates a sample event response for testing
 * 
 * @param eventId - The ID of the event
 * @param eventType - The type of the event
 * @param success - Whether the response indicates success
 * @param status - The status of the response
 * @returns An event response object
 */
export function createEventResponse(
  eventId: string,
  eventType: string,
  success: boolean,
  status: EventResponseStatus,
) {
  return {
    success,
    status,
    eventId,
    eventType,
    metadata: {
      timestamp: new Date().toISOString(),
      processingTimeMs: 42,
      correlationId: 'corr-123',
      journeyContext: eventType.split('.')[0],
    },
    ...(success ? { data: { processed: true } } : {
      error: {
        code: 'ERROR_CODE',
        message: 'Error message',
        retryable: status === EventResponseStatus.RETRY,
      },
    }),
  };
}

/**
 * Creates a custom event with specified properties
 * 
 * @param journey - The journey type
 * @param eventType - The specific event type
 * @param userId - The user ID
 * @param payload - The event payload
 * @returns A custom event object
 */
export function createCustomEvent<T>(
  journey: JourneyType,
  eventType: string,
  userId: string,
  payload: T,
): BaseEvent<T> {
  return {
    eventId: `${journey}-event-${Date.now()}`,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: `${journey}-service`,
    type: eventType,
    journey,
    userId,
    payload,
    metadata: {
      correlationId: `corr-${Date.now()}`,
    },
  };
}