import { z } from 'zod';
import {
  GamificationEvent,
  EventType,
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload,
  EventVersion
} from '@austa/interfaces/gamification/events';

/**
 * Extended EventType enum with additional internal event types
 * These are used for internal processing and are not part of the public API
 */
export enum InternalEventType {
  /** Event that failed processing and was sent to the dead letter queue */
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  /** Event that was retried after a failure */
  RETRY_EVENT = 'RETRY_EVENT',
  /** Event that was successfully processed */
  PROCESSING_COMPLETED = 'PROCESSING_COMPLETED'
}

/**
 * Combined EventType enum with both public and internal event types
 */
export type ExtendedEventType = EventType | InternalEventType;

/**
 * Kafka message headers structure
 */
export interface KafkaHeaders {
  /** The version of the event schema */
  version: string;
  /** The source service or component that produced the event */
  source: string;
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  /** Timestamp when the event was produced (ISO string) */
  timestamp: string;
  /** Content type of the message payload */
  contentType: string;
}

/**
 * Base Kafka event interface with common properties for all events
 */
export interface KafkaEvent<T = unknown> {
  /** Unique identifier for the event */
  eventId: string;
  /** Type of the event (from EventType enum) */
  type: EventType;
  /** User ID associated with the event */
  userId: string;
  /** Journey that the event belongs to (health, care, plan) */
  journey: 'health' | 'care' | 'plan';
  /** Timestamp when the event occurred (ISO string) */
  timestamp: string;
  /** Event schema version for backward compatibility */
  version: EventVersion;
  /** Event-specific payload data */
  data: T;
  /** Kafka-specific message headers */
  headers?: KafkaHeaders;
  /** Partition key for Kafka (usually userId for consistent routing) */
  partitionKey?: string;
}

/**
 * Health journey event with strongly typed payload
 */
export interface HealthKafkaEvent extends KafkaEvent<HealthEventPayload> {
  journey: 'health';
  type: 
    | EventType.HEALTH_METRIC_RECORDED
    | EventType.GOAL_CREATED
    | EventType.GOAL_PROGRESS_UPDATED
    | EventType.GOAL_ACHIEVED
    | EventType.DEVICE_CONNECTED
    | EventType.HEALTH_INSIGHT_GENERATED;
}

/**
 * Care journey event with strongly typed payload
 */
export interface CareKafkaEvent extends KafkaEvent<CareEventPayload> {
  journey: 'care';
  type: 
    | EventType.APPOINTMENT_BOOKED
    | EventType.APPOINTMENT_COMPLETED
    | EventType.APPOINTMENT_CANCELLED
    | EventType.MEDICATION_TAKEN
    | EventType.MEDICATION_SKIPPED
    | EventType.TELEMEDICINE_SESSION_STARTED
    | EventType.TELEMEDICINE_SESSION_COMPLETED
    | EventType.CARE_PLAN_CREATED
    | EventType.CARE_PLAN_UPDATED;
}

/**
 * Plan journey event with strongly typed payload
 */
export interface PlanKafkaEvent extends KafkaEvent<PlanEventPayload> {
  journey: 'plan';
  type: 
    | EventType.CLAIM_SUBMITTED
    | EventType.CLAIM_APPROVED
    | EventType.CLAIM_REJECTED
    | EventType.BENEFIT_UTILIZED
    | EventType.PLAN_SELECTED
    | EventType.PLAN_COMPARED
    | EventType.REWARD_REDEEMED;
}

/**
 * Union type of all journey-specific Kafka events
 * This creates a discriminated union based on the journey property
 */
export type JourneyKafkaEvent = 
  | HealthKafkaEvent 
  | CareKafkaEvent 
  | PlanKafkaEvent;

/**
 * Zod schema for validating Kafka headers
 */
export const kafkaHeadersSchema = z.object({
  version: z.string(),
  source: z.string(),
  correlationId: z.string().optional(),
  timestamp: z.string().datetime({ offset: true }),
  contentType: z.string().default('application/json')
});

/**
 * Base Zod schema for validating Kafka events
 */
export const baseKafkaEventSchema = z.object({
  eventId: z.string().uuid(),
  type: z.union([z.nativeEnum(EventType), z.nativeEnum(InternalEventType)]),
  userId: z.string().uuid(),
  journey: z.enum(['health', 'care', 'plan']),
  timestamp: z.string().datetime({ offset: true }),
  version: z.object({
    major: z.number().int().nonnegative(),
    minor: z.number().int().nonnegative(),
    patch: z.number().int().nonnegative()
  }),
  data: z.record(z.any()),
  headers: kafkaHeadersSchema.optional(),
  partitionKey: z.string().optional()
});

/**
 * Helper function to create a versioned event
 * @param event Base event data
 * @param version Event schema version
 * @returns Versioned event with proper headers
 */
export function createVersionedEvent<T>(
  event: Omit<KafkaEvent<T>, 'version' | 'headers'>,
  version: EventVersion = { major: 1, minor: 0, patch: 0 }
): KafkaEvent<T> {
  return {
    ...event,
    version,
    headers: {
      version: `${version.major}.${version.minor}.${version.patch}`,
      source: 'gamification-engine',
      timestamp: new Date().toISOString(),
      contentType: 'application/json'
    },
    partitionKey: event.userId
  };
}

/**
 * Converts a GamificationEvent from @austa/interfaces to a Kafka-specific event
 * @param event Standard gamification event
 * @returns Kafka-formatted event with headers and partition key
 */
export function toKafkaEvent<T>(event: GamificationEvent<T>): KafkaEvent<T> {
  return {
    ...event,
    headers: {
      version: `${event.version.major}.${event.version.minor}.${event.version.patch}`,
      source: event.source || 'gamification-engine',
      timestamp: event.timestamp,
      contentType: 'application/json',
      correlationId: event.correlationId
    },
    partitionKey: event.userId
  };
}

/**
 * Converts a Kafka-specific event to a standard GamificationEvent
 * @param kafkaEvent Kafka-formatted event
 * @returns Standard gamification event
 */
export function fromKafkaEvent<T>(kafkaEvent: KafkaEvent<T>): GamificationEvent<T> {
  const { headers, partitionKey, ...eventData } = kafkaEvent;
  
  return {
    ...eventData,
    source: headers?.source || 'unknown',
    correlationId: headers?.correlationId
  };
}

/**
 * Type guard to check if an event is a Health journey event
 * @param event Event to check
 * @returns True if the event is from the Health journey
 */
export function isHealthEvent(event: JourneyKafkaEvent): event is HealthKafkaEvent {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is a Care journey event
 * @param event Event to check
 * @returns True if the event is from the Care journey
 */
export function isCareEvent(event: JourneyKafkaEvent): event is CareKafkaEvent {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is a Plan journey event
 * @param event Event to check
 * @returns True if the event is from the Plan journey
 */
export function isPlanEvent(event: JourneyKafkaEvent): event is PlanKafkaEvent {
  return event.journey === 'plan';
}

/**
 * Validates a Kafka event against its schema
 * @param event Event to validate
 * @returns Validated event or throws an error
 */
export function validateKafkaEvent<T>(event: KafkaEvent<T>): KafkaEvent<T> {
  return baseKafkaEventSchema.parse(event) as KafkaEvent<T>;
}

/**
 * Journey-specific event validation schemas with payload validation
 */

// Health journey event schemas
const healthMetricSchema = z.object({
  metricType: z.string(),
  value: z.number(),
  unit: z.string(),
  source: z.string().optional(),
  deviceId: z.string().uuid().optional()
});

const healthGoalSchema = z.object({
  goalId: z.string().uuid(),
  goalType: z.string(),
  targetValue: z.number(),
  currentValue: z.number().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.string()
});

const deviceConnectionSchema = z.object({
  deviceId: z.string().uuid(),
  deviceType: z.string(),
  connectionStatus: z.string(),
  lastSyncDate: z.string().datetime().optional()
});

// Care journey event schemas
const appointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  providerId: z.string().uuid(),
  appointmentType: z.string(),
  scheduledDate: z.string().datetime(),
  status: z.string(),
  location: z.string().optional(),
  notes: z.string().optional()
});

const medicationSchema = z.object({
  medicationId: z.string().uuid(),
  name: z.string(),
  dosage: z.string(),
  scheduledTime: z.string().datetime().optional(),
  takenTime: z.string().datetime().optional(),
  status: z.string()
});

const telemedicineSessionSchema = z.object({
  sessionId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.string()
});

const carePlanSchema = z.object({
  planId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.string()
});

// Plan journey event schemas
const claimSchema = z.object({
  claimId: z.string().uuid(),
  planId: z.string().uuid(),
  amount: z.number(),
  claimType: z.string(),
  submissionDate: z.string().datetime(),
  status: z.string(),
  documents: z.array(z.string().uuid()).optional()
});

const benefitSchema = z.object({
  benefitId: z.string().uuid(),
  planId: z.string().uuid(),
  benefitType: z.string(),
  utilizationDate: z.string().datetime(),
  value: z.number().optional()
});

const planSelectionSchema = z.object({
  planId: z.string().uuid(),
  planName: z.string(),
  selectionDate: z.string().datetime(),
  previousPlanId: z.string().uuid().optional()
});

const rewardSchema = z.object({
  rewardId: z.string().uuid(),
  rewardType: z.string(),
  value: z.number().optional(),
  redemptionDate: z.string().datetime()
});

// Health journey event validation with payload validation
export const healthKafkaEventSchema = baseKafkaEventSchema.extend({
  journey: z.literal('health'),
  type: z.enum([
    EventType.HEALTH_METRIC_RECORDED,
    EventType.GOAL_CREATED,
    EventType.GOAL_PROGRESS_UPDATED,
    EventType.GOAL_ACHIEVED,
    EventType.DEVICE_CONNECTED,
    EventType.HEALTH_INSIGHT_GENERATED
  ])
}).refine(
  (event) => {
    // Validate payload based on event type
    switch (event.type) {
      case EventType.HEALTH_METRIC_RECORDED:
        return healthMetricSchema.safeParse(event.data).success;
      case EventType.GOAL_CREATED:
      case EventType.GOAL_PROGRESS_UPDATED:
      case EventType.GOAL_ACHIEVED:
        return healthGoalSchema.safeParse(event.data).success;
      case EventType.DEVICE_CONNECTED:
        return deviceConnectionSchema.safeParse(event.data).success;
      default:
        return true; // Other event types don't have specific validation yet
    }
  },
  {
    message: 'Invalid payload for health event type',
    path: ['data']
  }
);

// Care journey event validation with payload validation
export const careKafkaEventSchema = baseKafkaEventSchema.extend({
  journey: z.literal('care'),
  type: z.enum([
    EventType.APPOINTMENT_BOOKED,
    EventType.APPOINTMENT_COMPLETED,
    EventType.APPOINTMENT_CANCELLED,
    EventType.MEDICATION_TAKEN,
    EventType.MEDICATION_SKIPPED,
    EventType.TELEMEDICINE_SESSION_STARTED,
    EventType.TELEMEDICINE_SESSION_COMPLETED,
    EventType.CARE_PLAN_CREATED,
    EventType.CARE_PLAN_UPDATED
  ])
}).refine(
  (event) => {
    // Validate payload based on event type
    switch (event.type) {
      case EventType.APPOINTMENT_BOOKED:
      case EventType.APPOINTMENT_COMPLETED:
      case EventType.APPOINTMENT_CANCELLED:
        return appointmentSchema.safeParse(event.data).success;
      case EventType.MEDICATION_TAKEN:
      case EventType.MEDICATION_SKIPPED:
        return medicationSchema.safeParse(event.data).success;
      case EventType.TELEMEDICINE_SESSION_STARTED:
      case EventType.TELEMEDICINE_SESSION_COMPLETED:
        return telemedicineSessionSchema.safeParse(event.data).success;
      case EventType.CARE_PLAN_CREATED:
      case EventType.CARE_PLAN_UPDATED:
        return carePlanSchema.safeParse(event.data).success;
      default:
        return true; // Other event types don't have specific validation yet
    }
  },
  {
    message: 'Invalid payload for care event type',
    path: ['data']
  }
);

// Plan journey event validation with payload validation
export const planKafkaEventSchema = baseKafkaEventSchema.extend({
  journey: z.literal('plan'),
  type: z.enum([
    EventType.CLAIM_SUBMITTED,
    EventType.CLAIM_APPROVED,
    EventType.CLAIM_REJECTED,
    EventType.BENEFIT_UTILIZED,
    EventType.PLAN_SELECTED,
    EventType.PLAN_COMPARED,
    EventType.REWARD_REDEEMED
  ])
}).refine(
  (event) => {
    // Validate payload based on event type
    switch (event.type) {
      case EventType.CLAIM_SUBMITTED:
      case EventType.CLAIM_APPROVED:
      case EventType.CLAIM_REJECTED:
        return claimSchema.safeParse(event.data).success;
      case EventType.BENEFIT_UTILIZED:
        return benefitSchema.safeParse(event.data).success;
      case EventType.PLAN_SELECTED:
      case EventType.PLAN_COMPARED:
        return planSelectionSchema.safeParse(event.data).success;
      case EventType.REWARD_REDEEMED:
        return rewardSchema.safeParse(event.data).success;
      default:
        return true; // Other event types don't have specific validation yet
    }
  },
  {
    message: 'Invalid payload for plan event type',
    path: ['data']
  }
);

/**
 * Combined schema for validating any journey event
 */
export const journeyKafkaEventSchema = z.discriminatedUnion('journey', [
  healthKafkaEventSchema,
  careKafkaEventSchema,
  planKafkaEventSchema
]);

/**
 * Validates a journey-specific Kafka event
 * @param event Event to validate
 * @returns Validated event or throws an error
 */
export function validateJourneyEvent(event: JourneyKafkaEvent): JourneyKafkaEvent {
  return journeyKafkaEventSchema.parse(event) as JourneyKafkaEvent;
}

/**
 * Result of event validation with detailed error information
 */
export interface EventValidationResult<T> {
  /** Whether the validation was successful */
  success: boolean;
  /** The validated event (if successful) */
  event?: T;
  /** Validation error details (if unsuccessful) */
  error?: {
    /** Error message */
    message: string;
    /** Path to the error in the event object */
    path?: string[];
    /** Error code for programmatic handling */
    code?: string;
  };
}

/**
 * Safely validates a Kafka event without throwing exceptions
 * @param event Event to validate
 * @returns Validation result with success flag and error details
 */
export function safeValidateKafkaEvent<T>(event: KafkaEvent<T>): EventValidationResult<KafkaEvent<T>> {
  const result = baseKafkaEventSchema.safeParse(event);
  
  if (result.success) {
    return { success: true, event: result.data as KafkaEvent<T> };
  } else {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: {
        message: firstError.message,
        path: firstError.path.map(p => p.toString()),
        code: 'INVALID_EVENT_FORMAT'
      }
    };
  }
}

/**
 * Safely validates a journey-specific event without throwing exceptions
 * @param event Event to validate
 * @returns Validation result with success flag and error details
 */
export function safeValidateJourneyEvent(event: JourneyKafkaEvent): EventValidationResult<JourneyKafkaEvent> {
  const result = journeyKafkaEventSchema.safeParse(event);
  
  if (result.success) {
    return { success: true, event: result.data as JourneyKafkaEvent };
  } else {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: {
        message: firstError.message,
        path: firstError.path.map(p => p.toString()),
        code: 'INVALID_JOURNEY_EVENT'
      }
    };
  }
}

/**
 * Checks if an event version is compatible with the current system version
 * @param eventVersion Version of the incoming event
 * @param systemVersion Current system version (defaults to 1.0.0)
 * @returns Whether the event version is compatible
 */
export function isVersionCompatible(
  eventVersion: EventVersion,
  systemVersion: EventVersion = { major: 1, minor: 0, patch: 0 }
): boolean {
  // Major version must match for compatibility
  return eventVersion.major === systemVersion.major;
}

/**
 * Extracts the event type from a raw Kafka message
 * @param message Raw Kafka message
 * @returns The event type or undefined if not found
 */
export function getEventTypeFromMessage(message: Record<string, any>): EventType | undefined {
  if (typeof message.type === 'string' && Object.values(EventType).includes(message.type as EventType)) {
    return message.type as EventType;
  }
  return undefined;
}

/**
 * Creates a dead letter event for events that failed processing
 * @param originalEvent The original event that failed
 * @param error Error information
 * @returns Dead letter event for error tracking
 */
export function createDeadLetterEvent<T>(
  originalEvent: Partial<KafkaEvent<T>>,
  error: { message: string; code?: string; stack?: string }
): KafkaEvent<{ originalEvent: Partial<KafkaEvent<T>>; error: any }> {
  return {
    eventId: crypto.randomUUID(),
    type: InternalEventType.PROCESSING_ERROR as any,
    userId: originalEvent.userId || 'unknown',
    journey: originalEvent.journey || 'unknown' as any,
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: 0, patch: 0 },
    data: {
      originalEvent,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    },
    headers: {
      version: '1.0.0',
      source: 'gamification-engine',
      timestamp: new Date().toISOString(),
      contentType: 'application/json'
    },
    partitionKey: originalEvent.userId || 'unknown'
  };
}

/**
 * Retry information for events that need to be retried
 */
export interface RetryInfo {
  /** Number of retry attempts so far */
  attemptCount: number;
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Timestamp of the first attempt */
  firstAttemptTimestamp: string;
  /** Timestamp of the last attempt */
  lastAttemptTimestamp: string;
  /** Delay in milliseconds before the next retry */
  nextRetryDelayMs: number;
  /** Error information from the last attempt */
  lastError?: {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
  };
}

/**
 * Creates a retry event for events that need to be retried
 * @param originalEvent The original event that failed
 * @param retryInfo Retry information
 * @returns Retry event for the retry queue
 */
export function createRetryEvent<T>(
  originalEvent: KafkaEvent<T>,
  retryInfo: RetryInfo
): KafkaEvent<{ originalEvent: KafkaEvent<T>; retryInfo: RetryInfo }> {
  return {
    eventId: crypto.randomUUID(),
    type: InternalEventType.RETRY_EVENT as any,
    userId: originalEvent.userId,
    journey: originalEvent.journey,
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: 0, patch: 0 },
    data: {
      originalEvent,
      retryInfo: {
        ...retryInfo,
        lastAttemptTimestamp: new Date().toISOString()
      }
    },
    headers: {
      version: '1.0.0',
      source: 'gamification-engine',
      timestamp: new Date().toISOString(),
      contentType: 'application/json'
    },
    partitionKey: originalEvent.userId
  };
}

/**
 * Calculates the next retry delay using exponential backoff
 * @param attemptCount Current attempt count (starting from 1)
 * @param baseDelayMs Base delay in milliseconds (default: 1000)
 * @param maxDelayMs Maximum delay in milliseconds (default: 60000)
 * @returns Delay in milliseconds before the next retry
 */
export function calculateExponentialBackoff(
  attemptCount: number,
  baseDelayMs = 1000,
  maxDelayMs = 60000
): number {
  // Exponential backoff with jitter: baseDelay * 2^(attemptCount-1) * (0.5 + random(0, 0.5))
  const exponentialDelay = baseDelayMs * Math.pow(2, attemptCount - 1);
  const jitter = 0.5 + Math.random() * 0.5;
  const delay = exponentialDelay * jitter;
  
  // Cap at maximum delay
  return Math.min(delay, maxDelayMs);
}

/**
 * Extracts the original event from a retry event
 * @param retryEvent Retry event
 * @returns The original event and retry information
 */
export function extractOriginalEvent<T>(retryEvent: KafkaEvent<{ originalEvent: KafkaEvent<T>; retryInfo: RetryInfo }>): {
  originalEvent: KafkaEvent<T>;
  retryInfo: RetryInfo;
} {
  return {
    originalEvent: retryEvent.data.originalEvent,
    retryInfo: retryEvent.data.retryInfo
  };
}

/**
 * Creates a completion event for events that were successfully processed
 * @param originalEvent The original event that was processed
 * @param result Processing result information
 * @returns Completion event for tracking
 */
export function createCompletionEvent<T, R>(
  originalEvent: KafkaEvent<T>,
  result: R
): KafkaEvent<{ originalEvent: KafkaEvent<T>; result: R }> {
  return {
    eventId: crypto.randomUUID(),
    type: InternalEventType.PROCESSING_COMPLETED as any,
    userId: originalEvent.userId,
    journey: originalEvent.journey,
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: 0, patch: 0 },
    data: {
      originalEvent,
      result
    },
    headers: {
      version: '1.0.0',
      source: 'gamification-engine',
      timestamp: new Date().toISOString(),
      contentType: 'application/json'
    },
    partitionKey: originalEvent.userId
  };
}