/**
 * @file event.types.ts
 * @description Defines comprehensive TypeScript interfaces and types for all gamification events,
 * ensuring type safety throughout the event processing pipeline. References the standardized
 * event schemas from @austa/interfaces package and includes additional metadata for
 * Kafka-specific handling like headers and partitioning keys.
 */

import { z } from 'zod';
import {
  GamificationEventType,
  BaseGamificationEvent,
  AchievementEvent,
  QuestEvent,
  RewardEvent,
  LevelUpEvent,
  // Journey-specific event interfaces
  HealthJourneyEvent,
  CareJourneyEvent,
  PlanJourneyEvent,
  // Event payload interfaces
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload,
  // Version interfaces
  IEventVersion,
  IVersionedEvent,
  // Health journey specific event types
  STEPS_RECORDED,
  GOAL_ACHIEVED,
  HEALTH_METRIC_UPDATED,
  DEVICE_CONNECTED,
  // Care journey specific event types
  APPOINTMENT_BOOKED,
  MEDICATION_TAKEN,
  TELEMEDICINE_COMPLETED,
  SYMPTOM_CHECKED,
  // Plan journey specific event types
  CLAIM_SUBMITTED,
  BENEFIT_USED,
  PLAN_SELECTED,
  DOCUMENT_UPLOADED,
} from '@austa/interfaces/gamification/events';

// Import additional utilities for error handling
import { EventProcessingError } from '@austa/interfaces/gamification/errors';

/**
 * Kafka message headers structure
 */
export interface KafkaMessageHeaders {
  /** Unique identifier for the message */
  messageId: string;
  /** Timestamp when the message was created */
  timestamp: string;
  /** Source service that produced the event */
  source: string;
  /** Event schema version for backward compatibility */
  version: string;
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  /** User ID associated with the event */
  userId?: string;
  /** Journey context (health, care, plan) */
  journey?: string;
  /** Additional custom headers */
  [key: string]: string | undefined;
}

/**
 * Base Kafka message structure that wraps gamification events
 */
export interface KafkaMessage<T extends BaseGamificationEvent = BaseGamificationEvent> {
  /** Kafka message headers */
  headers: KafkaMessageHeaders;
  /** Event payload */
  value: T;
  /** Kafka topic the message was published to */
  topic: string;
  /** Kafka partition the message was published to */
  partition: number;
  /** Message offset in the partition */
  offset: number;
  /** Message key used for partitioning */
  key: string;
  /** Timestamp of the message */
  timestamp: string;
}

/**
 * Kafka message with versioning support
 */
export interface VersionedKafkaMessage<T extends IVersionedEvent = IVersionedEvent> extends KafkaMessage<T> {
  /** Event schema version information */
  version: IEventVersion;
}

/**
 * Kafka message with retry metadata
 */
export interface RetryableKafkaMessage<T extends BaseGamificationEvent = BaseGamificationEvent> extends KafkaMessage<T> {
  /** Retry attempt count */
  retryCount: number;
  /** Original timestamp of first attempt */
  originalTimestamp: string;
  /** Last error that caused the retry */
  lastError?: string;
  /** Next retry timestamp */
  nextRetryAt?: string;
}

/**
 * Dead letter queue message with error details
 */
export interface DeadLetterQueueMessage<T extends BaseGamificationEvent = BaseGamificationEvent> extends KafkaMessage<T> {
  /** Error details that caused the message to be sent to DLQ */
  error: {
    /** Error message */
    message: string;
    /** Error name/type */
    name: string;
    /** Error stack trace */
    stack?: string;
    /** HTTP status code if applicable */
    statusCode?: number;
  };
  /** Total retry attempts made before sending to DLQ */
  retryAttempts: number;
  /** Original timestamp when the message was first processed */
  originalTimestamp: string;
  /** Timestamp when the message was sent to DLQ */
  dlqTimestamp: string;
}

/**
 * Union type of all possible gamification events
 */
export type GamificationEvent =
  | AchievementEvent
  | QuestEvent
  | RewardEvent
  | LevelUpEvent
  | HealthJourneyEvent
  | CareJourneyEvent
  | PlanJourneyEvent;

/**
 * Health journey specific event types with their payloads
 */
export type StepsRecordedEvent = HealthJourneyEvent & { type: typeof STEPS_RECORDED };
export type GoalAchievedEvent = HealthJourneyEvent & { type: typeof GOAL_ACHIEVED };
export type HealthMetricUpdatedEvent = HealthJourneyEvent & { type: typeof HEALTH_METRIC_UPDATED };
export type DeviceConnectedEvent = HealthJourneyEvent & { type: typeof DEVICE_CONNECTED };

/**
 * Care journey specific event types with their payloads
 */
export type AppointmentBookedEvent = CareJourneyEvent & { type: typeof APPOINTMENT_BOOKED };
export type MedicationTakenEvent = CareJourneyEvent & { type: typeof MEDICATION_TAKEN };
export type TelemedicineCompletedEvent = CareJourneyEvent & { type: typeof TELEMEDICINE_COMPLETED };
export type SymptomCheckedEvent = CareJourneyEvent & { type: typeof SYMPTOM_CHECKED };

/**
 * Plan journey specific event types with their payloads
 */
export type ClaimSubmittedEvent = PlanJourneyEvent & { type: typeof CLAIM_SUBMITTED };
export type BenefitUsedEvent = PlanJourneyEvent & { type: typeof BENEFIT_USED };
export type PlanSelectedEvent = PlanJourneyEvent & { type: typeof PLAN_SELECTED };
export type DocumentUploadedEvent = PlanJourneyEvent & { type: typeof DOCUMENT_UPLOADED };

/**
 * Kafka message with a specific gamification event type
 */
export type GamificationEventMessage = KafkaMessage<GamificationEvent>;

/**
 * Journey-specific Kafka message types
 */
export type HealthJourneyEventMessage = KafkaMessage<HealthJourneyEvent>;
export type CareJourneyEventMessage = KafkaMessage<CareJourneyEvent>;
export type PlanJourneyEventMessage = KafkaMessage<PlanJourneyEvent>;

/**
 * Specific event type Kafka message types for Health journey
 */
export type StepsRecordedEventMessage = KafkaMessage<StepsRecordedEvent>;
export type GoalAchievedEventMessage = KafkaMessage<GoalAchievedEvent>;
export type HealthMetricUpdatedEventMessage = KafkaMessage<HealthMetricUpdatedEvent>;
export type DeviceConnectedEventMessage = KafkaMessage<DeviceConnectedEvent>;

/**
 * Specific event type Kafka message types for Care journey
 */
export type AppointmentBookedEventMessage = KafkaMessage<AppointmentBookedEvent>;
export type MedicationTakenEventMessage = KafkaMessage<MedicationTakenEvent>;
export type TelemedicineCompletedEventMessage = KafkaMessage<TelemedicineCompletedEvent>;
export type SymptomCheckedEventMessage = KafkaMessage<SymptomCheckedEvent>;

/**
 * Specific event type Kafka message types for Plan journey
 */
export type ClaimSubmittedEventMessage = KafkaMessage<ClaimSubmittedEvent>;
export type BenefitUsedEventMessage = KafkaMessage<BenefitUsedEvent>;
export type PlanSelectedEventMessage = KafkaMessage<PlanSelectedEvent>;
export type DocumentUploadedEventMessage = KafkaMessage<DocumentUploadedEvent>;

/**
 * Type guard to check if an event is a Health Journey event
 * @param event The event to check
 */
export function isHealthJourneyEvent(event: GamificationEvent): event is HealthJourneyEvent {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is a Care Journey event
 * @param event The event to check
 */
export function isCareJourneyEvent(event: GamificationEvent): event is CareJourneyEvent {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is a Plan Journey event
 * @param event The event to check
 */
export function isPlanJourneyEvent(event: GamificationEvent): event is PlanJourneyEvent {
  return event.journey === 'plan';
}

/**
 * Type guard to check if a Kafka message contains a Health Journey event
 * @param message The Kafka message to check
 */
export function isHealthJourneyEventMessage(message: GamificationEventMessage): message is HealthJourneyEventMessage {
  return isHealthJourneyEvent(message.value);
}

/**
 * Type guard to check if a Kafka message contains a Care Journey event
 * @param message The Kafka message to check
 */
export function isCareJourneyEventMessage(message: GamificationEventMessage): message is CareJourneyEventMessage {
  return isCareJourneyEvent(message.value);
}

/**
 * Type guard to check if a Kafka message contains a Plan Journey event
 * @param message The Kafka message to check
 */
export function isPlanJourneyEventMessage(message: GamificationEventMessage): message is PlanJourneyEventMessage {
  return isPlanJourneyEvent(message.value);
}

/**
 * Type guard to check if an event is of a specific health journey event type
 * @param event The event to check
 * @param type The specific event type to check for
 */
export function isHealthEventType<T extends GamificationEventType>(
  event: GamificationEvent,
  type: T
): event is HealthJourneyEvent & { type: T } {
  return isHealthJourneyEvent(event) && event.type === type;
}

/**
 * Type guard to check if an event is of a specific care journey event type
 * @param event The event to check
 * @param type The specific event type to check for
 */
export function isCareEventType<T extends GamificationEventType>(
  event: GamificationEvent,
  type: T
): event is CareJourneyEvent & { type: T } {
  return isCareJourneyEvent(event) && event.type === type;
}

/**
 * Type guard to check if an event is of a specific plan journey event type
 * @param event The event to check
 * @param type The specific event type to check for
 */
export function isPlanEventType<T extends GamificationEventType>(
  event: GamificationEvent,
  type: T
): event is PlanJourneyEvent & { type: T } {
  return isPlanJourneyEvent(event) && event.type === type;
}

/**
 * Type guard to check if a Kafka message contains a specific health journey event type
 * @param message The Kafka message to check
 * @param type The specific event type to check for
 */
export function isHealthEventTypeMessage<T extends GamificationEventType>(
  message: GamificationEventMessage,
  type: T
): message is KafkaMessage<HealthJourneyEvent & { type: T }> {
  return isHealthEventType(message.value, type);
}

/**
 * Type guard to check if a Kafka message contains a specific care journey event type
 * @param message The Kafka message to check
 * @param type The specific event type to check for
 */
export function isCareEventTypeMessage<T extends GamificationEventType>(
  message: GamificationEventMessage,
  type: T
): message is KafkaMessage<CareJourneyEvent & { type: T }> {
  return isCareEventType(message.value, type);
}

/**
 * Type guard to check if a Kafka message contains a specific plan journey event type
 * @param message The Kafka message to check
 * @param type The specific event type to check for
 */
export function isPlanEventTypeMessage<T extends GamificationEventType>(
  message: GamificationEventMessage,
  type: T
): message is KafkaMessage<PlanJourneyEvent & { type: T }> {
  return isPlanEventType(message.value, type);
}

/**
 * Zod schema for Kafka message headers
 */
export const kafkaMessageHeadersSchema = z.object({
  messageId: z.string().uuid(),
  timestamp: z.string().datetime(),
  source: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  correlationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  journey: z.enum(['health', 'care', 'plan']).optional(),
  retryCount: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : undefined),
  originalTimestamp: z.string().datetime().optional(),
  dlqReason: z.string().optional(),
}).catchall(z.string().optional());

/**
 * Zod schema for base gamification event
 */
export const baseGamificationEventSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(GamificationEventType),
  userId: z.string().uuid(),
  timestamp: z.string().datetime(),
  journey: z.enum(['health', 'care', 'plan']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  payload: z.record(z.any()),
});

/**
 * Zod schema for health journey event payload
 */
export const healthEventPayloadSchema = z.object({
  metricType: z.string().optional(),
  metricValue: z.number().optional(),
  goalId: z.string().uuid().optional(),
  deviceId: z.string().optional(),
  activityType: z.string().optional(),
  activityDuration: z.number().optional(),
  insightId: z.string().uuid().optional(),
}).catchall(z.any());

/**
 * Zod schema for care journey event payload
 */
export const careEventPayloadSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  medicationId: z.string().uuid().optional(),
  adherenceStatus: z.boolean().optional(),
  telemedicineSessionId: z.string().uuid().optional(),
  symptomId: z.string().uuid().optional(),
  treatmentId: z.string().uuid().optional(),
}).catchall(z.any());

/**
 * Zod schema for plan journey event payload
 */
export const planEventPayloadSchema = z.object({
  claimId: z.string().uuid().optional(),
  benefitId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  coverageId: z.string().uuid().optional(),
  amount: z.number().optional(),
}).catchall(z.any());

/**
 * Zod schema for health journey event
 */
export const healthJourneyEventSchema = baseGamificationEventSchema.extend({
  journey: z.literal('health'),
  payload: healthEventPayloadSchema,
});

/**
 * Zod schema for care journey event
 */
export const careJourneyEventSchema = baseGamificationEventSchema.extend({
  journey: z.literal('care'),
  payload: careEventPayloadSchema,
});

/**
 * Zod schema for plan journey event
 */
export const planJourneyEventSchema = baseGamificationEventSchema.extend({
  journey: z.literal('plan'),
  payload: planEventPayloadSchema,
});

/**
 * Zod schema for any gamification event
 */
export const gamificationEventSchema = z.discriminatedUnion('journey', [
  healthJourneyEventSchema,
  careJourneyEventSchema,
  planJourneyEventSchema,
]);

/**
 * Zod schema for Kafka message with gamification event
 */
export const gamificationEventMessageSchema = z.object({
  headers: kafkaMessageHeadersSchema,
  value: gamificationEventSchema,
  topic: z.string(),
  partition: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  key: z.string(),
  timestamp: z.string().datetime(),
});

/**
 * Kafka message key generator for consistent partitioning
 * @param userId User ID associated with the event
 * @param eventType Type of the event
 * @returns A deterministic key for Kafka partitioning
 */
export function generateKafkaMessageKey(userId: string, eventType: GamificationEventType): string {
  return `${userId}-${eventType}`;
}

/**
 * Creates Kafka message headers from a gamification event
 * @param event The gamification event
 * @param source Source service name
 * @param correlationId Optional correlation ID for distributed tracing
 * @returns Kafka message headers
 */
export function createKafkaMessageHeaders(
  event: GamificationEvent,
  source: string,
  correlationId?: string,
): KafkaMessageHeaders {
  return {
    messageId: event.id,
    timestamp: event.timestamp,
    source,
    version: event.version,
    correlationId: correlationId || event.id,
    userId: event.userId,
    journey: event.journey,
  };
}

/**
 * Creates a Kafka message from a gamification event
 * @param event The gamification event
 * @param topic Kafka topic
 * @param source Source service name
 * @param correlationId Optional correlation ID for distributed tracing
 * @returns Kafka message with the event
 */
export function createKafkaMessage<T extends GamificationEvent>(
  event: T,
  topic: string,
  source: string,
  correlationId?: string,
): Omit<KafkaMessage<T>, 'partition' | 'offset'> {
  const headers = createKafkaMessageHeaders(event, source, correlationId);
  const key = generateKafkaMessageKey(event.userId, event.type);
  
  return {
    headers,
    value: event,
    topic,
    key,
    timestamp: event.timestamp,
  };
}

/**
 * Validates a gamification event using Zod schema
 * @param event The event to validate
 * @returns Validated event or throws an error
 */
export function validateGamificationEvent<T extends GamificationEvent>(event: T): T {
  return gamificationEventSchema.parse(event) as T;
}

/**
 * Validates a Kafka message containing a gamification event
 * @param message The Kafka message to validate
 * @returns Validated message or throws an error
 */
export function validateGamificationEventMessage<T extends GamificationEventMessage>(
  message: T
): T {
  return gamificationEventMessageSchema.parse(message) as T;
}

/**
 * Safely validates a gamification event, returning a Result type
 * @param event The event to validate
 * @returns Object with success flag and either validated event or error
 */
export function safeValidateGamificationEvent<T extends GamificationEvent>(
  event: T
): { success: true; data: T } | { success: false; error: EventProcessingError } {
  try {
    const validatedEvent = validateGamificationEvent(event);
    return { success: true, data: validatedEvent };
  } catch (error) {
    return {
      success: false,
      error: new EventProcessingError(
        `Event validation failed: ${error instanceof Error ? error.message : String(error)}`,
        'VALIDATION_ERROR',
        { event, originalError: error }
      ),
    };
  }
}

/**
 * Safely validates a Kafka message, returning a Result type
 * @param message The Kafka message to validate
 * @returns Object with success flag and either validated message or error
 */
export function safeValidateGamificationEventMessage<T extends GamificationEventMessage>(
  message: T
): { success: true; data: T } | { success: false; error: EventProcessingError } {
  try {
    const validatedMessage = validateGamificationEventMessage(message);
    return { success: true, data: validatedMessage };
  } catch (error) {
    return {
      success: false,
      error: new EventProcessingError(
        `Message validation failed: ${error instanceof Error ? error.message : String(error)}`,
        'VALIDATION_ERROR',
        { message, originalError: error }
      ),
    };
  }
}

/**
 * Extracts journey-specific payload from a gamification event
 * @param event The gamification event
 * @returns Typed payload based on the journey
 */
export function extractEventPayload<T extends GamificationEvent>(event: T): 
  T extends HealthJourneyEvent ? HealthEventPayload :
  T extends CareJourneyEvent ? CareEventPayload :
  T extends PlanJourneyEvent ? PlanEventPayload :
  Record<string, any> {
  return event.payload as any;
}

/**
 * Converts a raw Kafka message to a typed GamificationEventMessage
 * @param rawMessage Raw Kafka message from the consumer
 * @returns Typed GamificationEventMessage
 * @throws Error if the message cannot be parsed or is invalid
 */
export function parseKafkaMessage(rawMessage: any): GamificationEventMessage {
  if (!rawMessage || typeof rawMessage !== 'object') {
    throw new EventProcessingError(
      'Invalid Kafka message: message is not an object',
      'PARSING_ERROR',
      { rawMessage }
    );
  }

  // Parse headers
  const headers: KafkaMessageHeaders = {
    messageId: '',
    timestamp: '',
    source: '',
    version: '1.0.0',
  };

  if (rawMessage.headers && typeof rawMessage.headers === 'object') {
    for (const [key, value] of Object.entries(rawMessage.headers)) {
      if (value !== null && value !== undefined) {
        // Kafka headers are Buffer objects, convert to string
        headers[key] = value instanceof Buffer ? value.toString() : String(value);
      }
    }
  }

  // Parse value (event payload)
  let value: GamificationEvent;
  try {
    if (typeof rawMessage.value === 'string') {
      value = JSON.parse(rawMessage.value);
    } else if (rawMessage.value instanceof Buffer) {
      value = JSON.parse(rawMessage.value.toString());
    } else if (typeof rawMessage.value === 'object') {
      value = rawMessage.value;
    } else {
      throw new Error('Message value is not a valid JSON string or object');
    }
  } catch (error) {
    throw new EventProcessingError(
      `Failed to parse message value: ${error instanceof Error ? error.message : String(error)}`,
      'PARSING_ERROR',
      { rawMessage, originalError: error }
    );
  }

  // Construct the typed message
  const message: GamificationEventMessage = {
    headers,
    value,
    topic: String(rawMessage.topic || ''),
    partition: Number(rawMessage.partition || 0),
    offset: Number(rawMessage.offset || 0),
    key: rawMessage.key instanceof Buffer ? rawMessage.key.toString() : String(rawMessage.key || ''),
    timestamp: String(rawMessage.timestamp || new Date().toISOString()),
  };

  // Validate the constructed message
  return validateGamificationEventMessage(message);
}

/**
 * Creates a dead letter queue message from a failed event message
 * @param message Original Kafka message that failed processing
 * @param error Error that caused the failure
 * @param retryAttempts Number of retry attempts made
 * @returns Dead letter queue message
 */
export function createDeadLetterQueueMessage<T extends GamificationEvent>(
  message: KafkaMessage<T>,
  error: Error,
  retryAttempts: number
): DeadLetterQueueMessage<T> {
  return {
    ...message,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      statusCode: (error as any).statusCode,
    },
    retryAttempts,
    originalTimestamp: message.headers.originalTimestamp || message.timestamp,
    dlqTimestamp: new Date().toISOString(),
  };
}