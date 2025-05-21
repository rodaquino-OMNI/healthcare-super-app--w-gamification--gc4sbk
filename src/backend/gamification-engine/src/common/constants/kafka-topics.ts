/**
 * Kafka topic name constants for the gamification engine.
 * 
 * These constants ensure consistent topic references across the application
 * when publishing and subscribing to events. They are organized by domain
 * and include consumer group IDs, dead-letter queue topics, and configuration
 * constants.
 */

/**
 * Base prefix for all gamification engine Kafka topics
 */
export const KAFKA_TOPIC_PREFIX = 'austa.gamification';

/**
 * Base prefix for all dead-letter queue topics
 */
export const DLQ_TOPIC_PREFIX = 'austa.dlq.gamification';

/**
 * Journey-specific event topics
 */
export const JOURNEY_EVENT_TOPICS = {
  HEALTH: 'health.events',
  CARE: 'care.events',
  PLAN: 'plan.events',
  USER: 'user.events',
};

/**
 * Gamification engine internal event topics
 */
export const GAMIFICATION_TOPICS = {
  ACHIEVEMENT: `${KAFKA_TOPIC_PREFIX}.achievement.events`,
  REWARD: `${KAFKA_TOPIC_PREFIX}.reward.events`,
  QUEST: `${KAFKA_TOPIC_PREFIX}.quest.events`,
  PROFILE: `${KAFKA_TOPIC_PREFIX}.profile.events`,
  LEADERBOARD: `${KAFKA_TOPIC_PREFIX}.leaderboard.events`,
  RULE: `${KAFKA_TOPIC_PREFIX}.rule.events`,
};

/**
 * Quest-specific event topics
 */
export const QUEST_TOPICS = {
  STARTED: `${GAMIFICATION_TOPICS.QUEST}.started`,
  COMPLETED: `${GAMIFICATION_TOPICS.QUEST}.completed`,
  PROGRESS: `${GAMIFICATION_TOPICS.QUEST}.progress`,
};

/**
 * Achievement-specific event topics
 */
export const ACHIEVEMENT_TOPICS = {
  UNLOCKED: `${GAMIFICATION_TOPICS.ACHIEVEMENT}.unlocked`,
  PROGRESS: `${GAMIFICATION_TOPICS.ACHIEVEMENT}.progress`,
};

/**
 * Reward-specific event topics
 */
export const REWARD_TOPICS = {
  GRANTED: `${GAMIFICATION_TOPICS.REWARD}.granted`,
  REDEEMED: `${GAMIFICATION_TOPICS.REWARD}.redeemed`,
};

/**
 * Profile-specific event topics
 */
export const PROFILE_TOPICS = {
  CREATED: `${GAMIFICATION_TOPICS.PROFILE}.created`,
  UPDATED: `${GAMIFICATION_TOPICS.PROFILE}.updated`,
  LEVEL_UP: `${GAMIFICATION_TOPICS.PROFILE}.level_up`,
};

/**
 * Dead-letter queue topics for failed event processing
 */
export const DLQ_TOPICS = {
  HEALTH_EVENTS: `${DLQ_TOPIC_PREFIX}.${JOURNEY_EVENT_TOPICS.HEALTH}`,
  CARE_EVENTS: `${DLQ_TOPIC_PREFIX}.${JOURNEY_EVENT_TOPICS.CARE}`,
  PLAN_EVENTS: `${DLQ_TOPIC_PREFIX}.${JOURNEY_EVENT_TOPICS.PLAN}`,
  USER_EVENTS: `${DLQ_TOPIC_PREFIX}.${JOURNEY_EVENT_TOPICS.USER}`,
  ACHIEVEMENT: `${DLQ_TOPIC_PREFIX}.achievement.events`,
  REWARD: `${DLQ_TOPIC_PREFIX}.reward.events`,
  QUEST: `${DLQ_TOPIC_PREFIX}.quest.events`,
  PROFILE: `${DLQ_TOPIC_PREFIX}.profile.events`,
};

/**
 * Consumer group IDs for different processing needs
 */
export const CONSUMER_GROUPS = {
  GAMIFICATION_ENGINE: 'gamification-engine-group',
  ACHIEVEMENT_PROCESSOR: 'achievement-processor-group',
  REWARD_PROCESSOR: 'reward-processor-group',
  QUEST_PROCESSOR: 'quest-processor-group',
  PROFILE_PROCESSOR: 'profile-processor-group',
  LEADERBOARD_PROCESSOR: 'leaderboard-processor-group',
  NOTIFICATION_PROCESSOR: 'notification-processor-group',
  DLQ_PROCESSOR: 'dlq-processor-group',
};

/**
 * Kafka topic configuration constants
 */
export const KAFKA_CONFIG = {
  DEFAULT_PARTITIONS: 3,
  HIGH_THROUGHPUT_PARTITIONS: 6,
  DEFAULT_REPLICATION_FACTOR: 3,
  DEFAULT_RETENTION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  HIGH_PRIORITY_RETENTION_MS: 14 * 24 * 60 * 60 * 1000, // 14 days
  DLQ_RETENTION_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * Retry configuration constants for Kafka consumers
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY_MS: 1000, // 1 second
  MAX_RETRY_DELAY_MS: 30000, // 30 seconds
  RETRY_FACTOR: 2, // Exponential backoff factor
};