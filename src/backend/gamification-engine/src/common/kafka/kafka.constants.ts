/**
 * Token for injecting Kafka module options
 */
export const KAFKA_MODULE_OPTIONS = 'KAFKA_MODULE_OPTIONS';

/**
 * Default consumer group ID for the gamification engine
 */
export const DEFAULT_CONSUMER_GROUP_ID = 'gamification-engine-group';

/**
 * Default Kafka topics for the gamification engine
 */
export const DEFAULT_KAFKA_TOPICS = {
  HEALTH_EVENTS: 'health.events',
  CARE_EVENTS: 'care.events',
  PLAN_EVENTS: 'plan.events',
  USER_EVENTS: 'user.events',
  GAMIFICATION_EVENTS: 'gamification.events',
};

/**
 * Default DLQ (Dead Letter Queue) topics for the gamification engine
 */
export const DEFAULT_DLQ_TOPICS = {
  HEALTH_EVENTS: 'health.events.dlq',
  CARE_EVENTS: 'care.events.dlq',
  PLAN_EVENTS: 'plan.events.dlq',
  USER_EVENTS: 'user.events.dlq',
  GAMIFICATION_EVENTS: 'gamification.events.dlq',
};

/**
 * Default retry configuration for Kafka consumers
 */
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
};

/**
 * Kafka error codes that are considered retriable
 */
export const RETRIABLE_KAFKA_ERROR_CODES = [
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNRESET',
  'ESOCKETTIMEDOUT',
  'ERR_SOCKET_TIMEOUT',
];