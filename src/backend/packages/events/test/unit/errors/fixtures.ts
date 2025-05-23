/**
 * @file Test fixtures for event error testing scenarios
 * @description Provides standardized test data for event errors across different journeys.
 * These fixtures ensure consistent test data across test files, making tests more maintainable
 * and easier to understand while providing realistic test scenarios.
 */

import { BaseEvent, EventMetadata } from '../../../src/interfaces/base-event.interface';
import { 
  JourneyType, 
  HealthEventType, 
  CareEventType, 
  PlanEventType 
} from '../../../src/interfaces/journey-events.interface';
import { 
  EventErrorCategory, 
  EventErrorContext, 
  EventProcessingStage 
} from '../../../src/errors/event-errors';
import { RetryAttempt, DlqEntryStatus, DlqErrorType } from '../../../src/errors/dlq';

// ===== SAMPLE EVENTS =====

/**
 * Sample base event for testing
 */
export const sampleBaseEvent: BaseEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'TEST_EVENT',
  timestamp: '2023-04-15T14:32:17.000Z',
  version: '1.0.0',
  source: 'test-service',
  payload: { test: 'data' }
};

/**
 * Sample health journey event for testing
 */
export const sampleHealthEvent: BaseEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174001',
  type: HealthEventType.METRIC_RECORDED,
  timestamp: '2023-04-15T14:32:17.000Z',
  version: '1.0.0',
  source: 'health-service',
  journey: JourneyType.HEALTH,
  userId: 'user-123',
  payload: {
    metric: {
      id: 'metric-123',
      userId: 'user-123',
      type: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: '2023-04-15T14:32:17.000Z',
      source: 'manual'
    },
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: '2023-04-15T14:32:17.000Z',
    source: 'manual',
    previousValue: 72,
    change: 3,
    isImprovement: false
  }
};

/**
 * Sample care journey event for testing
 */
export const sampleCareEvent: BaseEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174002',
  type: CareEventType.APPOINTMENT_BOOKED,
  timestamp: '2023-04-15T15:45:30.000Z',
  version: '1.0.0',
  source: 'care-service',
  journey: JourneyType.CARE,
  userId: 'user-123',
  payload: {
    appointment: {
      id: 'appointment-123',
      userId: 'user-123',
      providerId: 'provider-456',
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      scheduledDate: '2023-04-20T10:00:00.000Z',
      createdAt: '2023-04-15T15:45:30.000Z'
    },
    appointmentType: 'CONSULTATION',
    providerId: 'provider-456',
    scheduledDate: '2023-04-20T10:00:00.000Z',
    isFirstAppointment: false,
    isUrgent: false
  }
};

/**
 * Sample plan journey event for testing
 */
export const samplePlanEvent: BaseEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174003',
  type: PlanEventType.CLAIM_SUBMITTED,
  timestamp: '2023-04-15T16:20:45.000Z',
  version: '1.0.0',
  source: 'plan-service',
  journey: JourneyType.PLAN,
  userId: 'user-123',
  payload: {
    claim: {
      id: 'claim-123',
      userId: 'user-123',
      type: 'MEDICAL_CONSULTATION',
      amount: 150.00,
      status: 'SUBMITTED',
      submissionDate: '2023-04-15T16:20:45.000Z',
      documents: ['document-123', 'document-124']
    },
    submissionDate: '2023-04-15T16:20:45.000Z',
    amount: 150.00,
    claimType: 'MEDICAL_CONSULTATION',
    hasDocuments: true,
    isComplete: true
  }
};

/**
 * Sample event with invalid schema for testing validation errors
 */
export const invalidSchemaEvent: BaseEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174004',
  type: HealthEventType.METRIC_RECORDED,
  timestamp: '2023-04-15T14:32:17.000Z',
  version: '1.0.0',
  source: 'health-service',
  journey: JourneyType.HEALTH,
  userId: 'user-123',
  payload: {
    // Missing required fields
    metricType: 'HEART_RATE',
    // Invalid value type
    value: 'not-a-number',
    unit: 'bpm'
  }
};

/**
 * Sample event with incompatible schema version for testing version errors
 */
export const incompatibleVersionEvent: BaseEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174005',
  type: HealthEventType.METRIC_RECORDED,
  timestamp: '2023-04-15T14:32:17.000Z',
  version: '2.0.0', // Incompatible version
  source: 'health-service',
  journey: JourneyType.HEALTH,
  userId: 'user-123',
  payload: {
    // Schema for version 2.0.0 which is incompatible
    metricData: {
      type: 'HEART_RATE',
      value: 75,
      unit: 'bpm'
    },
    recordedAt: '2023-04-15T14:32:17.000Z'
  }
};

// ===== ERROR CONTEXTS =====

/**
 * Sample error context for validation errors
 */
export const validationErrorContext: EventErrorContext = {
  eventId: '123e4567-e89b-12d3-a456-426614174004',
  eventType: HealthEventType.METRIC_RECORDED,
  eventSource: 'health-service',
  processingStage: EventProcessingStage.VALIDATION,
  journey: JourneyType.HEALTH,
  userId: 'user-123',
  metadata: {
    validationErrors: [
      'Missing required field: metric',
      'Invalid type for field: value, expected number but got string'
    ]
  }
};

/**
 * Sample error context for schema version errors
 */
export const schemaVersionErrorContext: EventErrorContext = {
  eventId: '123e4567-e89b-12d3-a456-426614174005',
  eventType: HealthEventType.METRIC_RECORDED,
  eventSource: 'health-service',
  processingStage: EventProcessingStage.VALIDATION,
  journey: JourneyType.HEALTH,
  userId: 'user-123',
  metadata: {
    expectedVersion: '1.0.0',
    actualVersion: '2.0.0',
    migrationRequired: true
  }
};

/**
 * Sample error context for processing errors
 */
export const processingErrorContext: EventErrorContext = {
  eventId: '123e4567-e89b-12d3-a456-426614174001',
  eventType: HealthEventType.METRIC_RECORDED,
  eventSource: 'health-service',
  processingStage: EventProcessingStage.PROCESSING,
  journey: JourneyType.HEALTH,
  userId: 'user-123',
  retryCount: 2,
  metadata: {
    processingStep: 'saveMetricToDatabase',
    failureReason: 'Database connection error'
  }
};

/**
 * Sample error context for publishing errors
 */
export const publishingErrorContext: EventErrorContext = {
  eventId: '123e4567-e89b-12d3-a456-426614174002',
  eventType: CareEventType.APPOINTMENT_BOOKED,
  eventSource: 'care-service',
  processingStage: EventProcessingStage.PUBLISHING,
  journey: JourneyType.CARE,
  userId: 'user-123',
  metadata: {
    destination: 'gamification-events',
    failureReason: 'Kafka broker unavailable'
  }
};

/**
 * Sample error context for persistence errors
 */
export const persistenceErrorContext: EventErrorContext = {
  eventId: '123e4567-e89b-12d3-a456-426614174003',
  eventType: PlanEventType.CLAIM_SUBMITTED,
  eventSource: 'plan-service',
  processingStage: EventProcessingStage.PERSISTENCE,
  journey: JourneyType.PLAN,
  userId: 'user-123',
  metadata: {
    storageTarget: 'claims_table',
    failureReason: 'Unique constraint violation'
  }
};

// ===== RETRY STATES =====

/**
 * Sample retry attempt for testing
 */
export const sampleRetryAttempt: RetryAttempt = {
  timestamp: new Date('2023-04-15T14:35:17.000Z'),
  error: 'Database connection timeout',
  stackTrace: 'Error: Database connection timeout\n    at processHealthMetric (/src/handlers/health-metrics.ts:45:23)\n    at processEvent (/src/event-processor.ts:32:12)',
  metadata: {
    attemptNumber: 1,
    delayMs: 1000
  }
};

/**
 * Sample retry attempts for testing multiple retries
 */
export const multipleRetryAttempts: RetryAttempt[] = [
  {
    timestamp: new Date('2023-04-15T14:35:17.000Z'),
    error: 'Database connection timeout',
    stackTrace: 'Error: Database connection timeout\n    at processHealthMetric (/src/handlers/health-metrics.ts:45:23)\n    at processEvent (/src/event-processor.ts:32:12)',
    metadata: {
      attemptNumber: 1,
      delayMs: 1000
    }
  },
  {
    timestamp: new Date('2023-04-15T14:36:18.000Z'),
    error: 'Database connection timeout',
    stackTrace: 'Error: Database connection timeout\n    at processHealthMetric (/src/handlers/health-metrics.ts:45:23)\n    at processEvent (/src/event-processor.ts:32:12)',
    metadata: {
      attemptNumber: 2,
      delayMs: 2000
    }
  },
  {
    timestamp: new Date('2023-04-15T14:38:19.000Z'),
    error: 'Database connection timeout',
    stackTrace: 'Error: Database connection timeout\n    at processHealthMetric (/src/handlers/health-metrics.ts:45:23)\n    at processEvent (/src/event-processor.ts:32:12)',
    metadata: {
      attemptNumber: 3,
      delayMs: 4000
    }
  }
];

/**
 * Sample retry metadata for health events
 */
export const healthRetryMetadata: EventMetadata = {
  correlationId: 'corr-123e4567-e89b-12d3-a456-426614174000',
  retryCount: 2,
  isRetry: true,
  originalTimestamp: '2023-04-15T14:32:17.000Z',
  priority: 'high',
  retryPolicy: 'exponentialBackoff',
  nextRetryDelayMs: 4000
};

/**
 * Sample retry metadata for care events
 */
export const careRetryMetadata: EventMetadata = {
  correlationId: 'corr-123e4567-e89b-12d3-a456-426614174000',
  retryCount: 1,
  isRetry: true,
  originalTimestamp: '2023-04-15T15:45:30.000Z',
  priority: 'medium',
  retryPolicy: 'exponentialBackoff',
  nextRetryDelayMs: 2000
};

/**
 * Sample retry metadata for plan events
 */
export const planRetryMetadata: EventMetadata = {
  correlationId: 'corr-123e4567-e89b-12d3-a456-426614174000',
  retryCount: 3,
  isRetry: true,
  originalTimestamp: '2023-04-15T16:20:45.000Z',
  priority: 'high',
  retryPolicy: 'exponentialBackoff',
  nextRetryDelayMs: 8000
};

// ===== DLQ FIXTURES =====

/**
 * Sample DLQ entry for health event
 */
export const healthDlqEntry = {
  id: 'dlq-1681566737000-abc123',
  eventId: '123e4567-e89b-12d3-a456-426614174001',
  userId: 'user-123',
  journey: JourneyType.HEALTH,
  eventType: HealthEventType.METRIC_RECORDED,
  payload: sampleHealthEvent.payload,
  errorType: DlqErrorType.DATABASE,
  errorMessage: 'Failed to save health metric: Database connection error',
  errorStack: 'Error: Failed to save health metric: Database connection error\n    at processHealthMetric (/src/handlers/health-metrics.ts:45:23)\n    at processEvent (/src/event-processor.ts:32:12)',
  retryAttempts: multipleRetryAttempts,
  status: DlqEntryStatus.PENDING,
  originalTopic: 'health-events',
  kafkaMetadata: {
    topic: 'health-events',
    partition: 0,
    offset: '1000',
    timestamp: '2023-04-15T14:32:17.000Z',
    headers: {
      'correlation-id': 'corr-123e4567-e89b-12d3-a456-426614174000'
    }
  },
  processingMetadata: {
    lastProcessingStep: 'saveMetricToDatabase',
    failureReason: 'Database connection error',
    retryPolicy: 'exponentialBackoff',
    maxRetries: 3
  },
  createdAt: new Date('2023-04-15T14:38:57.000Z'),
  updatedAt: new Date('2023-04-15T14:38:57.000Z')
};

/**
 * Sample DLQ entry for care event
 */
export const careDlqEntry = {
  id: 'dlq-1681571130000-def456',
  eventId: '123e4567-e89b-12d3-a456-426614174002',
  userId: 'user-123',
  journey: JourneyType.CARE,
  eventType: CareEventType.APPOINTMENT_BOOKED,
  payload: sampleCareEvent.payload,
  errorType: DlqErrorType.NETWORK,
  errorMessage: 'Failed to publish appointment event: Kafka broker unavailable',
  errorStack: 'Error: Failed to publish appointment event: Kafka broker unavailable\n    at publishEvent (/src/kafka/producer.ts:78:21)\n    at processAppointment (/src/handlers/appointments.ts:56:18)',
  retryAttempts: [
    {
      timestamp: new Date('2023-04-15T15:46:30.000Z'),
      error: 'Kafka broker unavailable',
      stackTrace: 'Error: Kafka broker unavailable\n    at publishEvent (/src/kafka/producer.ts:78:21)',
      metadata: { attemptNumber: 1, delayMs: 1000 }
    }
  ],
  status: DlqEntryStatus.PENDING,
  originalTopic: 'care-events',
  kafkaMetadata: {
    topic: 'care-events',
    partition: 1,
    offset: '2000',
    timestamp: '2023-04-15T15:45:30.000Z',
    headers: {
      'correlation-id': 'corr-123e4567-e89b-12d3-a456-426614174000'
    }
  },
  processingMetadata: {
    lastProcessingStep: 'publishToKafka',
    failureReason: 'Kafka broker unavailable',
    retryPolicy: 'exponentialBackoff',
    maxRetries: 3
  },
  createdAt: new Date('2023-04-15T15:47:30.000Z'),
  updatedAt: new Date('2023-04-15T15:47:30.000Z')
};

/**
 * Sample DLQ entry for plan event
 */
export const planDlqEntry = {
  id: 'dlq-1681573245000-ghi789',
  eventId: '123e4567-e89b-12d3-a456-426614174003',
  userId: 'user-123',
  journey: JourneyType.PLAN,
  eventType: PlanEventType.CLAIM_SUBMITTED,
  payload: samplePlanEvent.payload,
  errorType: DlqErrorType.VALIDATION,
  errorMessage: 'Failed to validate claim: Claim amount exceeds maximum allowed for this plan type',
  errorStack: 'Error: Failed to validate claim: Claim amount exceeds maximum allowed for this plan type\n    at validateClaim (/src/validators/claim-validator.ts:34:15)\n    at processClaim (/src/handlers/claims.ts:28:22)',
  retryAttempts: [],
  status: DlqEntryStatus.PENDING,
  originalTopic: 'plan-events',
  kafkaMetadata: {
    topic: 'plan-events',
    partition: 2,
    offset: '3000',
    timestamp: '2023-04-15T16:20:45.000Z',
    headers: {
      'correlation-id': 'corr-123e4567-e89b-12d3-a456-426614174000'
    }
  },
  processingMetadata: {
    lastProcessingStep: 'validateClaim',
    failureReason: 'Claim amount exceeds maximum allowed for this plan type',
    validationRules: {
      maxClaimAmount: 100.00,
      actualAmount: 150.00
    }
  },
  createdAt: new Date('2023-04-15T16:20:45.000Z'),
  updatedAt: new Date('2023-04-15T16:20:45.000Z')
};

// ===== HELPER FUNCTIONS =====

/**
 * Creates a sample health event with custom data
 * @param overrides Properties to override in the default health event
 * @returns Customized health event
 */
export function createHealthEvent(overrides: Partial<BaseEvent> = {}): BaseEvent {
  return {
    ...sampleHealthEvent,
    ...overrides,
    payload: {
      ...sampleHealthEvent.payload,
      ...(overrides.payload || {})
    }
  };
}

/**
 * Creates a sample care event with custom data
 * @param overrides Properties to override in the default care event
 * @returns Customized care event
 */
export function createCareEvent(overrides: Partial<BaseEvent> = {}): BaseEvent {
  return {
    ...sampleCareEvent,
    ...overrides,
    payload: {
      ...sampleCareEvent.payload,
      ...(overrides.payload || {})
    }
  };
}

/**
 * Creates a sample plan event with custom data
 * @param overrides Properties to override in the default plan event
 * @returns Customized plan event
 */
export function createPlanEvent(overrides: Partial<BaseEvent> = {}): BaseEvent {
  return {
    ...samplePlanEvent,
    ...overrides,
    payload: {
      ...samplePlanEvent.payload,
      ...(overrides.payload || {})
    }
  };
}

/**
 * Creates a retry context with custom data
 * @param event The event being retried
 * @param retryCount Number of retry attempts so far
 * @param error The error that caused the retry
 * @param additionalMetadata Additional metadata for the retry context
 * @returns Customized retry context
 */
export function createRetryContext(
  event: BaseEvent,
  retryCount: number,
  error: Error,
  additionalMetadata: Record<string, any> = {}
): EventErrorContext {
  return {
    eventId: event.eventId,
    eventType: event.type,
    eventSource: event.source,
    processingStage: EventProcessingStage.PROCESSING,
    journey: event.journey,
    userId: event.userId,
    retryCount,
    metadata: {
      ...event.metadata,
      error: error.message,
      errorStack: error.stack,
      ...additionalMetadata
    }
  };
}

/**
 * Creates a DLQ entry with custom data
 * @param event The event that failed processing
 * @param errorType Type of error that occurred
 * @param errorMessage Error message
 * @param retryAttempts Array of retry attempts
 * @param additionalMetadata Additional metadata for the DLQ entry
 * @returns Customized DLQ entry
 */
export function createDlqEntry(
  event: BaseEvent,
  errorType: DlqErrorType,
  errorMessage: string,
  retryAttempts: RetryAttempt[] = [],
  additionalMetadata: Record<string, any> = {}
) {
  const now = new Date();
  const id = `dlq-${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    id,
    eventId: event.eventId,
    userId: event.userId,
    journey: event.journey,
    eventType: event.type,
    payload: event.payload,
    errorType,
    errorMessage,
    errorStack: new Error(errorMessage).stack,
    retryAttempts,
    status: DlqEntryStatus.PENDING,
    originalTopic: `${event.journey?.toLowerCase() || 'unknown'}-events`,
    kafkaMetadata: {
      topic: `${event.journey?.toLowerCase() || 'unknown'}-events`,
      partition: 0,
      offset: '0',
      timestamp: event.timestamp,
      headers: {
        'correlation-id': event.metadata?.correlationId || `corr-${event.eventId}`
      }
    },
    processingMetadata: {
      ...additionalMetadata
    },
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Creates an error with retry metadata
 * @param message Error message
 * @param retryCount Number of retry attempts so far
 * @param category Error category for retry classification
 * @returns Error with retry metadata
 */
export function createErrorWithRetryMetadata(
  message: string,
  retryCount: number,
  category: EventErrorCategory
): Error {
  const error = new Error(message);
  (error as any).retryCount = retryCount;
  (error as any).category = category;
  (error as any).isRetriable = category === EventErrorCategory.TRANSIENT || 
                              category === EventErrorCategory.RETRIABLE;
  return error;
}