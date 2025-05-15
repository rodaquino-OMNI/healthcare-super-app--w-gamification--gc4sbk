/**
 * Defines standardized span attribute interfaces and constants for consistent trace annotation
 * across the AUSTA SuperApp. This file includes type definitions for common attributes like
 * HTTP details, database queries, and business operations.
 */

/**
 * Base interface for all span attributes
 */
export interface SpanAttributes {
  [key: string]: string | number | boolean | string[] | number[] | boolean[];
}

/**
 * HTTP-related span attributes following OpenTelemetry semantic conventions
 */
export interface HttpSpanAttributes extends SpanAttributes {
  'http.method'?: string;
  'http.url'?: string;
  'http.target'?: string;
  'http.host'?: string;
  'http.scheme'?: string;
  'http.status_code'?: number;
  'http.flavor'?: string;
  'http.user_agent'?: string;
  'http.request_content_length'?: number;
  'http.response_content_length'?: number;
  'http.route'?: string;
}

/**
 * Database-related span attributes following OpenTelemetry semantic conventions
 */
export interface DatabaseSpanAttributes extends SpanAttributes {
  'db.system'?: string;
  'db.connection_string'?: string;
  'db.user'?: string;
  'db.name'?: string;
  'db.statement'?: string;
  'db.operation'?: string;
  'db.instance'?: string;
  'db.sql.table'?: string;
}

/**
 * Messaging system span attributes following OpenTelemetry semantic conventions
 */
export interface MessagingSpanAttributes extends SpanAttributes {
  'messaging.system'?: string;
  'messaging.destination'?: string;
  'messaging.destination_kind'?: string;
  'messaging.temp_destination'?: boolean;
  'messaging.protocol'?: string;
  'messaging.protocol_version'?: string;
  'messaging.url'?: string;
  'messaging.message_id'?: string;
  'messaging.conversation_id'?: string;
  'messaging.message_payload_size_bytes'?: number;
  'messaging.message_payload_compressed_size_bytes'?: number;
}

/**
 * Journey-specific span attributes for the AUSTA SuperApp
 */
export interface JourneySpanAttributes extends SpanAttributes {
  'austa.journey.name'?: string;
  'austa.journey.operation'?: string;
  'austa.journey.user_id'?: string;
  'austa.journey.session_id'?: string;
  'austa.journey.feature'?: string;
  'austa.journey.step'?: string;
  'austa.journey.error_code'?: string;
  'austa.journey.error_message'?: string;
}

/**
 * Health journey specific span attributes
 */
export interface HealthJourneySpanAttributes extends JourneySpanAttributes {
  'austa.health.metric_type'?: string;
  'austa.health.metric_value'?: number;
  'austa.health.goal_id'?: string;
  'austa.health.device_id'?: string;
  'austa.health.integration_type'?: string;
}

/**
 * Care journey specific span attributes
 */
export interface CareJourneySpanAttributes extends JourneySpanAttributes {
  'austa.care.appointment_id'?: string;
  'austa.care.provider_id'?: string;
  'austa.care.telemedicine_session_id'?: string;
  'austa.care.medication_id'?: string;
  'austa.care.treatment_id'?: string;
}

/**
 * Plan journey specific span attributes
 */
export interface PlanJourneySpanAttributes extends JourneySpanAttributes {
  'austa.plan.plan_id'?: string;
  'austa.plan.benefit_id'?: string;
  'austa.plan.claim_id'?: string;
  'austa.plan.coverage_id'?: string;
  'austa.plan.document_id'?: string;
}

/**
 * Gamification-related span attributes
 */
export interface GamificationSpanAttributes extends SpanAttributes {
  'austa.gamification.event_type'?: string;
  'austa.gamification.profile_id'?: string;
  'austa.gamification.achievement_id'?: string;
  'austa.gamification.quest_id'?: string;
  'austa.gamification.reward_id'?: string;
  'austa.gamification.points'?: number;
  'austa.gamification.level'?: number;
}

/**
 * Error-related span attributes
 */
export interface ErrorSpanAttributes extends SpanAttributes {
  'error.type'?: string;
  'error.message'?: string;
  'error.stack'?: string;
  'error.code'?: string;
  'error.retry_count'?: number;
  'error.is_retryable'?: boolean;
}

/**
 * Constants for common attribute values
 */
export const JOURNEY_NAMES = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan',
} as const;

export const DATABASE_SYSTEMS = {
  POSTGRES: 'postgresql',
  REDIS: 'redis',
  MONGODB: 'mongodb',
} as const;

export const MESSAGING_SYSTEMS = {
  KAFKA: 'kafka',
  RABBITMQ: 'rabbitmq',
  SQS: 'aws_sqs',
} as const;

export const ERROR_TYPES = {
  VALIDATION: 'validation_error',
  AUTHENTICATION: 'authentication_error',
  AUTHORIZATION: 'authorization_error',
  NOT_FOUND: 'not_found_error',
  TIMEOUT: 'timeout_error',
  DEPENDENCY: 'dependency_error',
  INTERNAL: 'internal_error',
} as const;

export const GAMIFICATION_EVENT_TYPES = {
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  QUEST_COMPLETED: 'quest_completed',
  REWARD_CLAIMED: 'reward_claimed',
  POINTS_EARNED: 'points_earned',
  LEVEL_UP: 'level_up',
} as const;

/**
 * Helper function to create journey-specific span attributes
 */
export function createJourneyAttributes(journeyName: string, userId: string, sessionId: string): JourneySpanAttributes {
  return {
    'austa.journey.name': journeyName,
    'austa.journey.user_id': userId,
    'austa.journey.session_id': sessionId,
  };
}

/**
 * Helper function to create error span attributes
 */
export function createErrorAttributes(error: Error, code?: string, isRetryable?: boolean): ErrorSpanAttributes {
  return {
    'error.type': error.name,
    'error.message': error.message,
    'error.stack': error.stack,
    ...(code && { 'error.code': code }),
    ...(isRetryable !== undefined && { 'error.is_retryable': isRetryable }),
  };
}