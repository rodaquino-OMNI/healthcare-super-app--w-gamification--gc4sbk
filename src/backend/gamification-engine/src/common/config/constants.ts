/**
 * Constants used across the gamification engine's configuration modules.
 * This file centralizes all configuration constants to ensure consistent usage
 * throughout the application and simplify maintenance.
 */

/**
 * Environment constants
 */
export const DEFAULT_NODE_ENV = 'development';
export const ENV_PRODUCTION = 'production';
export const ENV_DEVELOPMENT = 'development';
export const ENV_TEST = 'test';

/**
 * Server constants
 */
export const DEFAULT_PORT = 3000;
export const DEFAULT_API_PREFIX = 'api';

/**
 * Kafka configuration constants
 */
export const DEFAULT_KAFKA_CLIENT_ID = 'gamification-engine';
export const DEFAULT_KAFKA_BROKERS = 'localhost:9092';
export const DEFAULT_KAFKA_GROUP_ID = 'gamification-consumer-group';

// Kafka topic names
export const DEFAULT_KAFKA_TOPIC_HEALTH_EVENTS = 'health.events';
export const DEFAULT_KAFKA_TOPIC_CARE_EVENTS = 'care.events';
export const DEFAULT_KAFKA_TOPIC_PLAN_EVENTS = 'plan.events';
export const DEFAULT_KAFKA_TOPIC_USER_EVENTS = 'user.events';
export const DEFAULT_KAFKA_TOPIC_GAME_EVENTS = 'game.events';

// Kafka retry configuration
export const DEFAULT_KAFKA_MAX_RETRIES = 3;
export const DEFAULT_KAFKA_RETRY_INTERVAL = 1000; // milliseconds

// Dead Letter Queue (DLQ) constants
export const DEFAULT_KAFKA_DLQ_SUFFIX = '.dlq';
export const DEFAULT_KAFKA_DLQ_MAX_SIZE = 10000;
export const DEFAULT_KAFKA_DLQ_PROCESSING_INTERVAL = 3600000; // 1 hour in milliseconds

/**
 * Event processing constants
 */
export const DEFAULT_EVENT_PROCESSING_RATE = 1000; // milliseconds
export const DEFAULT_EVENT_BATCH_SIZE = 100;
export const DEFAULT_RULES_REFRESH_INTERVAL = 60000; // 1 minute in milliseconds

/**
 * Points configuration constants
 */
// Default point values for different actions
export const DEFAULT_POINT_HEALTH_METRIC_RECORDED = 10;
export const DEFAULT_POINT_APPOINTMENT_BOOKED = 20;
export const DEFAULT_POINT_APPOINTMENT_ATTENDED = 50;
export const DEFAULT_POINT_CLAIM_SUBMITTED = 15;
export const DEFAULT_POINT_GOAL_COMPLETED = 100;

// Point limits
export const DEFAULT_MAX_POINTS_PER_DAY = 1000;
export const DEFAULT_MAX_POINTS_PER_ACTION = 500;

/**
 * Redis configuration constants
 */
export const DEFAULT_REDIS_HOST = 'localhost';
export const DEFAULT_REDIS_PORT = 6379;
export const DEFAULT_REDIS_DB = 0;
export const DEFAULT_REDIS_KEY_PREFIX = 'game:';

// Redis TTL constants (in seconds)
export const DEFAULT_ACHIEVEMENTS_TTL = 3600; // 1 hour
export const DEFAULT_USER_PROFILE_TTL = 300; // 5 minutes
export const DEFAULT_LEADERBOARD_TTL = 900; // 15 minutes
export const DEFAULT_RULES_TTL = 600; // 10 minutes

// Redis Sorted Set constants
export const DEFAULT_REDIS_LEADERBOARD_KEY = 'leaderboard';
export const DEFAULT_REDIS_USER_ACHIEVEMENTS_KEY = 'user:achievements';
export const DEFAULT_REDIS_USER_POINTS_KEY = 'user:points';
export const DEFAULT_REDIS_ACTIVE_QUESTS_KEY = 'active:quests';

/**
 * Database configuration constants
 */
export const DEFAULT_DATABASE_SSL = false;
export const DEFAULT_DATABASE_LOGGING = false;

/**
 * Feature configuration constants
 */
// Cache feature constants
export const DEFAULT_CACHE_ENABLED = true;

// Leaderboard feature constants
export const DEFAULT_LEADERBOARD_UPDATE_INTERVAL = 900000; // 15 minutes in milliseconds
export const DEFAULT_LEADERBOARD_MAX_ENTRIES = 100;

// Achievements feature constants
export const DEFAULT_ACHIEVEMENTS_NOTIFICATIONS_ENABLED = true;
export const DEFAULT_ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED = true;
export const DEFAULT_ACHIEVEMENTS_MAX_CONCURRENT_QUESTS = 5;

// Rewards feature constants
export const DEFAULT_REWARDS_EXPIRATION_DAYS = 30;
export const DEFAULT_REWARDS_REDEMPTION_ENABLED = true;

/**
 * Environment variable names
 */
export const ENV_NODE_ENV = 'NODE_ENV';
export const ENV_PORT = 'PORT';
export const ENV_API_PREFIX = 'API_PREFIX';

export const ENV_KAFKA_CLIENT_ID = 'KAFKA_CLIENT_ID';
export const ENV_KAFKA_BROKERS = 'KAFKA_BROKERS';
export const ENV_KAFKA_GROUP_ID = 'KAFKA_GROUP_ID';
export const ENV_KAFKA_TOPIC_HEALTH_EVENTS = 'KAFKA_TOPIC_HEALTH_EVENTS';
export const ENV_KAFKA_TOPIC_CARE_EVENTS = 'KAFKA_TOPIC_CARE_EVENTS';
export const ENV_KAFKA_TOPIC_PLAN_EVENTS = 'KAFKA_TOPIC_PLAN_EVENTS';
export const ENV_KAFKA_TOPIC_USER_EVENTS = 'KAFKA_TOPIC_USER_EVENTS';
export const ENV_KAFKA_TOPIC_GAME_EVENTS = 'KAFKA_TOPIC_GAME_EVENTS';
export const ENV_KAFKA_MAX_RETRIES = 'KAFKA_MAX_RETRIES';
export const ENV_KAFKA_RETRY_INTERVAL = 'KAFKA_RETRY_INTERVAL';
export const ENV_KAFKA_DLQ_PROCESSING_INTERVAL = 'KAFKA_DLQ_PROCESSING_INTERVAL';

export const ENV_EVENT_PROCESSING_RATE = 'EVENT_PROCESSING_RATE';
export const ENV_EVENT_BATCH_SIZE = 'EVENT_BATCH_SIZE';
export const ENV_RULES_REFRESH_INTERVAL = 'RULES_REFRESH_INTERVAL';

export const ENV_DEFAULT_POINT_HEALTH_METRIC_RECORDED = 'DEFAULT_POINT_HEALTH_METRIC_RECORDED';
export const ENV_DEFAULT_POINT_APPOINTMENT_BOOKED = 'DEFAULT_POINT_APPOINTMENT_BOOKED';
export const ENV_DEFAULT_POINT_APPOINTMENT_ATTENDED = 'DEFAULT_POINT_APPOINTMENT_ATTENDED';
export const ENV_DEFAULT_POINT_CLAIM_SUBMITTED = 'DEFAULT_POINT_CLAIM_SUBMITTED';
export const ENV_DEFAULT_POINT_GOAL_COMPLETED = 'DEFAULT_POINT_GOAL_COMPLETED';
export const ENV_MAX_POINTS_PER_DAY = 'MAX_POINTS_PER_DAY';
export const ENV_MAX_POINTS_PER_ACTION = 'MAX_POINTS_PER_ACTION';

export const ENV_REDIS_HOST = 'REDIS_HOST';
export const ENV_REDIS_PORT = 'REDIS_PORT';
export const ENV_REDIS_PASSWORD = 'REDIS_PASSWORD';
export const ENV_REDIS_DB = 'REDIS_DB';
export const ENV_REDIS_KEY_PREFIX = 'REDIS_KEY_PREFIX';
export const ENV_ACHIEVEMENTS_TTL = 'ACHIEVEMENTS_TTL';
export const ENV_USER_PROFILE_TTL = 'USER_PROFILE_TTL';
export const ENV_LEADERBOARD_TTL = 'LEADERBOARD_TTL';
export const ENV_RULES_TTL = 'RULES_TTL';

export const ENV_DATABASE_URL = 'DATABASE_URL';
export const ENV_DATABASE_SSL = 'DATABASE_SSL';
export const ENV_DATABASE_LOGGING = 'DATABASE_LOGGING';

export const ENV_CACHE_ENABLED = 'CACHE_ENABLED';
export const ENV_LEADERBOARD_UPDATE_INTERVAL = 'LEADERBOARD_UPDATE_INTERVAL';
export const ENV_LEADERBOARD_MAX_ENTRIES = 'LEADERBOARD_MAX_ENTRIES';
export const ENV_ACHIEVEMENTS_NOTIFICATIONS_ENABLED = 'ACHIEVEMENTS_NOTIFICATIONS_ENABLED';
export const ENV_ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED = 'ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED';
export const ENV_ACHIEVEMENTS_MAX_CONCURRENT_QUESTS = 'ACHIEVEMENTS_MAX_CONCURRENT_QUESTS';
export const ENV_REWARDS_EXPIRATION_DAYS = 'REWARDS_EXPIRATION_DAYS';
export const ENV_REWARDS_REDEMPTION_ENABLED = 'REWARDS_REDEMPTION_ENABLED';