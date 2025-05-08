/**
 * Kafka topic constants for the gamification engine.
 * 
 * This file defines all Kafka topic names, consumer group IDs, and related configuration
 * constants used throughout the gamification engine for event streaming.
 * 
 * These constants ensure consistent topic references across the application when
 * publishing and subscribing to events.
 */

/**
 * Base topic names for each journey's events
 */
export const JOURNEY_EVENT_TOPICS = {
  /** Topic for health journey events */
  HEALTH: 'austa.health.events',
  /** Topic for care journey events */
  CARE: 'austa.care.events',
  /** Topic for plan journey events */
  PLAN: 'austa.plan.events',
  /** Topic for cross-journey events */
  CROSS_JOURNEY: 'austa.cross-journey.events'
} as const;

/**
 * Dead-letter queue (DLQ) topic names for failed event processing
 */
export const DLQ_TOPICS = {
  /** DLQ for health journey events */
  HEALTH: `${JOURNEY_EVENT_TOPICS.HEALTH}.dlq`,
  /** DLQ for care journey events */
  CARE: `${JOURNEY_EVENT_TOPICS.CARE}.dlq`,
  /** DLQ for plan journey events */
  PLAN: `${JOURNEY_EVENT_TOPICS.PLAN}.dlq`,
  /** DLQ for cross-journey events */
  CROSS_JOURNEY: `${JOURNEY_EVENT_TOPICS.CROSS_JOURNEY}.dlq`
} as const;

/**
 * Consumer group IDs for different processing needs
 */
export const CONSUMER_GROUPS = {
  /** Base consumer group ID for the gamification engine */
  BASE: 'gamification-consumer-group',
  /** Consumer group for health journey events */
  HEALTH: 'gamification-consumer-group-health',
  /** Consumer group for care journey events */
  CARE: 'gamification-consumer-group-care',
  /** Consumer group for plan journey events */
  PLAN: 'gamification-consumer-group-plan',
  /** Consumer group for achievement processing */
  ACHIEVEMENTS: 'gamification-achievements-group',
  /** Consumer group for reward processing */
  REWARDS: 'gamification-rewards-group',
  /** Consumer group for leaderboard updates */
  LEADERBOARD: 'gamification-leaderboard-group'
} as const;

/**
 * Notification topics for gamification events
 */
export const NOTIFICATION_TOPICS = {
  /** Topic for achievement notifications */
  ACHIEVEMENTS: 'austa.notifications.achievements',
  /** Topic for level-up notifications */
  LEVEL_UP: 'austa.notifications.level-up',
  /** Topic for reward notifications */
  REWARDS: 'austa.notifications.rewards',
  /** Topic for quest notifications */
  QUESTS: 'austa.notifications.quests'
} as const;

/**
 * Internal topics for gamification engine processing
 */
export const INTERNAL_TOPICS = {
  /** Topic for processed events (after rule evaluation) */
  PROCESSED_EVENTS: 'austa.gamification.processed-events',
  /** Topic for achievement events */
  ACHIEVEMENTS: 'austa.gamification.achievements',
  /** Topic for reward events */
  REWARDS: 'austa.gamification.rewards',
  /** Topic for leaderboard updates */
  LEADERBOARD: 'austa.gamification.leaderboard-updates'
} as const;

/**
 * Kafka topic configuration constants
 */
export const TOPIC_CONFIG = {
  /** Default number of partitions for gamification topics */
  DEFAULT_PARTITIONS: 6,
  /** Default replication factor for gamification topics */
  DEFAULT_REPLICATION_FACTOR: 3,
  /** Default retention period in milliseconds (7 days) */
  DEFAULT_RETENTION_MS: 7 * 24 * 60 * 60 * 1000,
  /** Retention period for DLQ topics in milliseconds (30 days) */
  DLQ_RETENTION_MS: 30 * 24 * 60 * 60 * 1000
} as const;

/**
 * Retry configuration constants for Kafka consumers
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
  /** Initial delay in milliseconds */
  INITIAL_DELAY_MS: 1000,
  /** Backoff factor for exponential delay calculation */
  BACKOFF_FACTOR: 2,
  /** Maximum delay in milliseconds */
  MAX_DELAY_MS: 30000
} as const;

/**
 * Legacy topic names for backward compatibility
 * @deprecated Use JOURNEY_EVENT_TOPICS instead
 */
export const LEGACY_TOPICS = {
  /** Legacy topic for health journey events */
  HEALTH: 'health.events',
  /** Legacy topic for care journey events */
  CARE: 'care.events',
  /** Legacy topic for plan journey events */
  PLAN: 'plan.events'
} as const;

/**
 * Maps configuration keys to actual topic names
 */
export const TOPIC_KEY_MAPPING = {
  'healthEvents': JOURNEY_EVENT_TOPICS.HEALTH,
  'careEvents': JOURNEY_EVENT_TOPICS.CARE,
  'planEvents': JOURNEY_EVENT_TOPICS.PLAN,
  'crossJourneyEvents': JOURNEY_EVENT_TOPICS.CROSS_JOURNEY,
  // Legacy mappings
  'health': LEGACY_TOPICS.HEALTH,
  'care': LEGACY_TOPICS.CARE,
  'plan': LEGACY_TOPICS.PLAN
} as const;

/**
 * Type for all journey event topics
 */
export type JourneyEventTopic = typeof JOURNEY_EVENT_TOPICS[keyof typeof JOURNEY_EVENT_TOPICS];

/**
 * Type for all DLQ topics
 */
export type DlqTopic = typeof DLQ_TOPICS[keyof typeof DLQ_TOPICS];

/**
 * Type for all consumer groups
 */
export type ConsumerGroup = typeof CONSUMER_GROUPS[keyof typeof CONSUMER_GROUPS];

/**
 * Type for all notification topics
 */
export type NotificationTopic = typeof NOTIFICATION_TOPICS[keyof typeof NOTIFICATION_TOPICS];

/**
 * Type for all internal topics
 */
export type InternalTopic = typeof INTERNAL_TOPICS[keyof typeof INTERNAL_TOPICS];

/**
 * Type for all legacy topics
 */
export type LegacyTopic = typeof LEGACY_TOPICS[keyof typeof LEGACY_TOPICS];

/**
 * Type for all topic key mappings
 */
export type TopicKeyMapping = typeof TOPIC_KEY_MAPPING[keyof typeof TOPIC_KEY_MAPPING];

/**
 * Utility function to get the DLQ topic for a given event topic
 * @param topic The event topic
 * @returns The corresponding DLQ topic
 */
export function getDlqTopic(topic: JourneyEventTopic | LegacyTopic | string): string {
  return `${topic}.dlq`;
}

/**
 * Utility function to get the consumer group for a given journey
 * @param journey The journey type ('health', 'care', 'plan')
 * @param suffix Optional suffix to append to the consumer group
 * @returns The consumer group ID
 */
export function getConsumerGroup(journey: 'health' | 'care' | 'plan' | string, suffix?: string): string {
  const baseGroup = CONSUMER_GROUPS.BASE;
  const journeyGroup = journey.toLowerCase();
  
  if (suffix) {
    return `${baseGroup}-${journeyGroup}-${suffix}`;
  }
  
  return `${baseGroup}-${journeyGroup}`;
}