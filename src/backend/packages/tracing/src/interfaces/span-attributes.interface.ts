/**
 * Defines standardized span attribute interfaces and constants for consistent trace annotation
 * across the AUSTA SuperApp. This file includes type definitions for common attributes like
 * HTTP details, database queries, and business operations.
 */

/**
 * Base interface for all span attributes
 */
export interface SpanAttributes {
  [key: string]: string | number | boolean | Array<string | number | boolean>;
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
 * User session tracking attributes for holistic experience monitoring
 */
export interface UserSessionSpanAttributes extends SpanAttributes {
  'user.id'?: string;
  'user.session.id'?: string;
  'user.device.id'?: string;
  'user.device.type'?: string;
  'user.device.model'?: string;
  'user.device.platform'?: string;
  'user.device.platform_version'?: string;
  'user.app.version'?: string;
  'user.network.type'?: string;
  'user.network.carrier'?: string;
}

/**
 * Journey-specific span attributes for the AUSTA SuperApp
 */
export interface JourneySpanAttributes extends SpanAttributes {
  'journey.type'?: string;
  'journey.id'?: string;
  'journey.step'?: string;
  'journey.step.status'?: string;
  'journey.completion_percentage'?: number;
}

/**
 * Health journey specific span attributes
 */
export interface HealthJourneySpanAttributes extends JourneySpanAttributes {
  'health.metric.type'?: string;
  'health.metric.value'?: number;
  'health.metric.unit'?: string;
  'health.goal.id'?: string;
  'health.goal.progress'?: number;
  'health.device.id'?: string;
  'health.device.type'?: string;
}

/**
 * Care journey specific span attributes
 */
export interface CareJourneySpanAttributes extends JourneySpanAttributes {
  'care.appointment.id'?: string;
  'care.appointment.type'?: string;
  'care.appointment.status'?: string;
  'care.provider.id'?: string;
  'care.provider.specialty'?: string;
  'care.telemedicine.session.id'?: string;
  'care.medication.id'?: string;
  'care.treatment.id'?: string;
}

/**
 * Plan journey specific span attributes
 */
export interface PlanJourneySpanAttributes extends JourneySpanAttributes {
  'plan.id'?: string;
  'plan.type'?: string;
  'plan.benefit.id'?: string;
  'plan.benefit.type'?: string;
  'plan.claim.id'?: string;
  'plan.claim.status'?: string;
  'plan.claim.amount'?: number;
  'plan.coverage.id'?: string;
  'plan.coverage.type'?: string;
}

/**
 * Gamification-related span attributes
 */
export interface GamificationSpanAttributes extends SpanAttributes {
  'gamification.event.type'?: string;
  'gamification.event.id'?: string;
  'gamification.profile.id'?: string;
  'gamification.achievement.id'?: string;
  'gamification.achievement.name'?: string;
  'gamification.quest.id'?: string;
  'gamification.quest.name'?: string;
  'gamification.reward.id'?: string;
  'gamification.reward.type'?: string;
  'gamification.points.earned'?: number;
  'gamification.level.current'?: number;
  'gamification.level.progress'?: number;
}

/**
 * Error-related span attributes for consistent error handling patterns
 */
export interface ErrorSpanAttributes extends SpanAttributes {
  'error.type'?: string;
  'error.message'?: string;
  'error.stack'?: string;
  'error.code'?: string | number;
  'error.retry_count'?: number;
  'error.category'?: string;
  'error.handled'?: boolean;
}

/**
 * External service integration span attributes
 */
export interface ExternalServiceSpanAttributes extends SpanAttributes {
  'service.name'?: string;
  'service.version'?: string;
  'service.instance.id'?: string;
  'service.namespace'?: string;
  'service.endpoint'?: string;
  'service.operation'?: string;
}

/**
 * Constants for journey types
 */
export const JOURNEY_TYPES = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan',
};

/**
 * Constants for common journey step statuses
 */
export const JOURNEY_STEP_STATUS = {
  STARTED: 'started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ABANDONED: 'abandoned',
};

/**
 * Constants for gamification event types
 */
export const GAMIFICATION_EVENT_TYPES = {
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  QUEST_COMPLETED: 'quest_completed',
  QUEST_STARTED: 'quest_started',
  POINTS_EARNED: 'points_earned',
  LEVEL_UP: 'level_up',
  REWARD_CLAIMED: 'reward_claimed',
};

/**
 * Constants for error categories
 */
export const ERROR_CATEGORIES = {
  CLIENT: 'client_error',
  SERVER: 'server_error',
  NETWORK: 'network_error',
  DATABASE: 'database_error',
  VALIDATION: 'validation_error',
  AUTHORIZATION: 'authorization_error',
  EXTERNAL_SERVICE: 'external_service_error',
  TIMEOUT: 'timeout_error',
  UNKNOWN: 'unknown_error',
};

/**
 * Constants for database systems
 */
export const DB_SYSTEMS = {
  POSTGRESQL: 'postgresql',
  MYSQL: 'mysql',
  MONGODB: 'mongodb',
  REDIS: 'redis',
  ELASTICSEARCH: 'elasticsearch',
};

/**
 * Constants for messaging systems
 */
export const MESSAGING_SYSTEMS = {
  KAFKA: 'kafka',
  RABBITMQ: 'rabbitmq',
  SQS: 'aws_sqs',
  SNS: 'aws_sns',
};

/**
 * Constants for HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
};

/**
 * Constants for network types
 */
export const NETWORK_TYPES = {
  WIFI: 'wifi',
  CELLULAR: 'cellular',
  ETHERNET: 'ethernet',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
};

/**
 * Constants for device types
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
  WEARABLE: 'wearable',
  TV: 'tv',
  UNKNOWN: 'unknown',
};

/**
 * Constants for health metric types
 */
export const HEALTH_METRIC_TYPES = {
  HEART_RATE: 'heart_rate',
  BLOOD_PRESSURE: 'blood_pressure',
  BLOOD_GLUCOSE: 'blood_glucose',
  WEIGHT: 'weight',
  STEPS: 'steps',
  SLEEP: 'sleep',
  CALORIES: 'calories',
  OXYGEN_SATURATION: 'oxygen_saturation',
  TEMPERATURE: 'temperature',
};

/**
 * Constants for health metric units
 */
export const HEALTH_METRIC_UNITS = {
  BPM: 'bpm',
  MMHG: 'mmHg',
  MG_DL: 'mg/dL',
  KG: 'kg',
  COUNT: 'count',
  HOURS: 'hours',
  KCAL: 'kcal',
  PERCENT: 'percent',
  CELSIUS: 'celsius',
};

/**
 * Constants for care appointment types
 */
export const CARE_APPOINTMENT_TYPES = {
  IN_PERSON: 'in_person',
  TELEMEDICINE: 'telemedicine',
  HOME_VISIT: 'home_visit',
  FOLLOW_UP: 'follow_up',
  EMERGENCY: 'emergency',
};

/**
 * Constants for care appointment statuses
 */
export const CARE_APPOINTMENT_STATUSES = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
};

/**
 * Constants for plan types
 */
export const PLAN_TYPES = {
  HEALTH: 'health',
  DENTAL: 'dental',
  VISION: 'vision',
  PHARMACY: 'pharmacy',
  MENTAL_HEALTH: 'mental_health',
  WELLNESS: 'wellness',
};

/**
 * Constants for claim statuses
 */
export const CLAIM_STATUSES = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  ADDITIONAL_INFO_REQUIRED: 'additional_info_required',
  APPROVED: 'approved',
  PARTIALLY_APPROVED: 'partially_approved',
  DENIED: 'denied',
  APPEALED: 'appealed',
  PAID: 'paid',
};