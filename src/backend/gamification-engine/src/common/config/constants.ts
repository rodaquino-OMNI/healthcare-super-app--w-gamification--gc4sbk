/**
 * Constants used across the gamification engine's configuration modules.
 * This file centralizes all constant values to ensure consistent usage throughout the application.
 */

// Server configuration constants
export const DEFAULT_NODE_ENV = 'development';
export const DEFAULT_PORT = 3000;
export const DEFAULT_API_PREFIX = 'api';

// Kafka configuration constants
export const DEFAULT_KAFKA_CLIENT_ID = 'gamification-engine';
export const DEFAULT_KAFKA_BROKERS = 'localhost:9092';
export const DEFAULT_KAFKA_GROUP_ID = 'gamification-consumer-group';

// Kafka topic constants
export const DEFAULT_KAFKA_TOPIC_HEALTH_EVENTS = 'health.events';
export const DEFAULT_KAFKA_TOPIC_CARE_EVENTS = 'care.events';
export const DEFAULT_KAFKA_TOPIC_PLAN_EVENTS = 'plan.events';
export const DEFAULT_KAFKA_TOPIC_USER_EVENTS = 'user.events';
export const DEFAULT_KAFKA_TOPIC_GAME_EVENTS = 'game.events';

// Kafka retry constants
export const DEFAULT_KAFKA_MAX_RETRIES = 3;
export const DEFAULT_KAFKA_RETRY_INTERVAL = 1000; // milliseconds

// Event processing constants
export const DEFAULT_EVENT_PROCESSING_RATE = 1000; // milliseconds
export const DEFAULT_EVENT_BATCH_SIZE = 100;
export const DEFAULT_RULES_REFRESH_INTERVAL = 60000; // 1 minute

// Points configuration constants
export const DEFAULT_POINT_HEALTH_METRIC_RECORDED = 10;
export const DEFAULT_POINT_APPOINTMENT_BOOKED = 20;
export const DEFAULT_POINT_APPOINTMENT_ATTENDED = 50;
export const DEFAULT_POINT_CLAIM_SUBMITTED = 15;
export const DEFAULT_POINT_GOAL_COMPLETED = 100;

// Points limit constants
export const DEFAULT_MAX_POINTS_PER_DAY = 1000;
export const DEFAULT_MAX_POINTS_PER_ACTION = 500;

// Redis configuration constants
export const DEFAULT_REDIS_HOST = 'localhost';
export const DEFAULT_REDIS_PORT = 6379;
export const DEFAULT_REDIS_PASSWORD = '';
export const DEFAULT_REDIS_DB = 0;
export const DEFAULT_REDIS_KEY_PREFIX = 'game:';

// Redis TTL constants (in seconds)
export const DEFAULT_ACHIEVEMENTS_TTL = 3600; // 1 hour
export const DEFAULT_USER_PROFILE_TTL = 300; // 5 minutes
export const DEFAULT_LEADERBOARD_TTL = 900; // 15 minutes
export const DEFAULT_RULES_TTL = 600; // 10 minutes

// Redis Sorted Sets constants (new)
export const REDIS_LEADERBOARD_KEY = 'leaderboard';
export const REDIS_USER_POINTS_KEY = 'user:points';
export const REDIS_ACHIEVEMENT_PROGRESS_KEY = 'achievement:progress';
export const REDIS_QUEST_PROGRESS_KEY = 'quest:progress';
export const REDIS_DAILY_POINTS_KEY = 'daily:points';

// Database configuration constants
export const DEFAULT_DATABASE_SSL = false;
export const DEFAULT_DATABASE_LOGGING = false;

// Feature flag constants
export const DEFAULT_CACHE_ENABLED = true;
export const DEFAULT_ACHIEVEMENTS_NOTIFICATIONS_ENABLED = true;
export const DEFAULT_ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED = true;
export const DEFAULT_REWARDS_REDEMPTION_ENABLED = true;

// Leaderboard constants
export const DEFAULT_LEADERBOARD_UPDATE_INTERVAL = 900000; // 15 minutes
export const DEFAULT_LEADERBOARD_MAX_ENTRIES = 100;

// Achievement constants
export const DEFAULT_ACHIEVEMENTS_MAX_CONCURRENT_QUESTS = 5;

// Reward constants
export const DEFAULT_REWARDS_EXPIRATION_DAYS = 30;

// Dead Letter Queue constants (new)
export const DLQ_RETRY_ATTEMPTS = 3;
export const DLQ_RETRY_DELAY = 60000; // 1 minute
export const DLQ_MAX_AGE = 604800000; // 7 days in milliseconds
export const DLQ_PROCESSING_INTERVAL = 300000; // 5 minutes
export const DLQ_BATCH_SIZE = 50;

// Environment names
export const ENV_DEVELOPMENT = 'development';
export const ENV_PRODUCTION = 'production';
export const ENV_TEST = 'test';
export const ENV_STAGING = 'staging';

// Event types
export const EVENT_TYPE_HEALTH = 'health';
export const EVENT_TYPE_CARE = 'care';
export const EVENT_TYPE_PLAN = 'plan';
export const EVENT_TYPE_USER = 'user';
export const EVENT_TYPE_GAME = 'game';

// Journey-specific event subtypes
// Health journey events
export const EVENT_SUBTYPE_HEALTH_METRIC_RECORDED = 'health.metric.recorded';
export const EVENT_SUBTYPE_HEALTH_GOAL_CREATED = 'health.goal.created';
export const EVENT_SUBTYPE_HEALTH_GOAL_COMPLETED = 'health.goal.completed';
export const EVENT_SUBTYPE_HEALTH_DEVICE_CONNECTED = 'health.device.connected';

// Care journey events
export const EVENT_SUBTYPE_CARE_APPOINTMENT_BOOKED = 'care.appointment.booked';
export const EVENT_SUBTYPE_CARE_APPOINTMENT_ATTENDED = 'care.appointment.attended';
export const EVENT_SUBTYPE_CARE_MEDICATION_ADHERENCE = 'care.medication.adherence';
export const EVENT_SUBTYPE_CARE_TELEMEDICINE_SESSION = 'care.telemedicine.session';

// Plan journey events
export const EVENT_SUBTYPE_PLAN_CLAIM_SUBMITTED = 'plan.claim.submitted';
export const EVENT_SUBTYPE_PLAN_BENEFIT_USED = 'plan.benefit.used';
export const EVENT_SUBTYPE_PLAN_DOCUMENT_UPLOADED = 'plan.document.uploaded';

// Achievement types
export const ACHIEVEMENT_TYPE_ONETIME = 'onetime';
export const ACHIEVEMENT_TYPE_PROGRESSIVE = 'progressive';
export const ACHIEVEMENT_TYPE_STREAK = 'streak';
export const ACHIEVEMENT_TYPE_COLLECTION = 'collection';

// Quest types
export const QUEST_TYPE_DAILY = 'daily';
export const QUEST_TYPE_WEEKLY = 'weekly';
export const QUEST_TYPE_MONTHLY = 'monthly';
export const QUEST_TYPE_SPECIAL = 'special';

// Reward types
export const REWARD_TYPE_BADGE = 'badge';
export const REWARD_TYPE_POINTS = 'points';
export const REWARD_TYPE_DISCOUNT = 'discount';
export const REWARD_TYPE_FEATURE = 'feature';

// Configuration keys for accessing config values
export const CONFIG_KEY_GAMIFICATION_ENGINE = 'gamificationEngine';
export const CONFIG_KEY_NODE_ENV = 'nodeEnv';
export const CONFIG_KEY_PORT = 'port';
export const CONFIG_KEY_API_PREFIX = 'apiPrefix';
export const CONFIG_KEY_KAFKA = 'kafka';
export const CONFIG_KEY_KAFKA_CLIENT_ID = 'clientId';
export const CONFIG_KEY_KAFKA_BROKERS = 'brokers';
export const CONFIG_KEY_KAFKA_GROUP_ID = 'groupId';
export const CONFIG_KEY_KAFKA_TOPICS = 'topics';
export const CONFIG_KEY_KAFKA_MAX_RETRIES = 'maxRetries';
export const CONFIG_KEY_KAFKA_RETRY_INTERVAL = 'retryInterval';
export const CONFIG_KEY_EVENT_PROCESSING = 'eventProcessing';
export const CONFIG_KEY_POINTS = 'points';
export const CONFIG_KEY_REDIS = 'redis';
export const CONFIG_KEY_DATABASE = 'database';
export const CONFIG_KEY_FEATURES = 'features';

// Environment variable names
export const ENV_VAR_NODE_ENV = 'NODE_ENV';
export const ENV_VAR_PORT = 'PORT';
export const ENV_VAR_API_PREFIX = 'API_PREFIX';
export const ENV_VAR_KAFKA_CLIENT_ID = 'KAFKA_CLIENT_ID';
export const ENV_VAR_KAFKA_BROKERS = 'KAFKA_BROKERS';
export const ENV_VAR_KAFKA_GROUP_ID = 'KAFKA_GROUP_ID';
export const ENV_VAR_KAFKA_TOPIC_HEALTH_EVENTS = 'KAFKA_TOPIC_HEALTH_EVENTS';
export const ENV_VAR_KAFKA_TOPIC_CARE_EVENTS = 'KAFKA_TOPIC_CARE_EVENTS';
export const ENV_VAR_KAFKA_TOPIC_PLAN_EVENTS = 'KAFKA_TOPIC_PLAN_EVENTS';
export const ENV_VAR_KAFKA_TOPIC_USER_EVENTS = 'KAFKA_TOPIC_USER_EVENTS';
export const ENV_VAR_KAFKA_TOPIC_GAME_EVENTS = 'KAFKA_TOPIC_GAME_EVENTS';
export const ENV_VAR_KAFKA_MAX_RETRIES = 'KAFKA_MAX_RETRIES';
export const ENV_VAR_KAFKA_RETRY_INTERVAL = 'KAFKA_RETRY_INTERVAL';
export const ENV_VAR_EVENT_PROCESSING_RATE = 'EVENT_PROCESSING_RATE';
export const ENV_VAR_EVENT_BATCH_SIZE = 'EVENT_BATCH_SIZE';
export const ENV_VAR_RULES_REFRESH_INTERVAL = 'RULES_REFRESH_INTERVAL';
export const ENV_VAR_DEFAULT_POINT_HEALTH_METRIC_RECORDED = 'DEFAULT_POINT_HEALTH_METRIC_RECORDED';
export const ENV_VAR_DEFAULT_POINT_APPOINTMENT_BOOKED = 'DEFAULT_POINT_APPOINTMENT_BOOKED';
export const ENV_VAR_DEFAULT_POINT_APPOINTMENT_ATTENDED = 'DEFAULT_POINT_APPOINTMENT_ATTENDED';
export const ENV_VAR_DEFAULT_POINT_CLAIM_SUBMITTED = 'DEFAULT_POINT_CLAIM_SUBMITTED';
export const ENV_VAR_DEFAULT_POINT_GOAL_COMPLETED = 'DEFAULT_POINT_GOAL_COMPLETED';
export const ENV_VAR_MAX_POINTS_PER_DAY = 'MAX_POINTS_PER_DAY';
export const ENV_VAR_MAX_POINTS_PER_ACTION = 'MAX_POINTS_PER_ACTION';
export const ENV_VAR_REDIS_HOST = 'REDIS_HOST';
export const ENV_VAR_REDIS_PORT = 'REDIS_PORT';
export const ENV_VAR_REDIS_PASSWORD = 'REDIS_PASSWORD';
export const ENV_VAR_REDIS_DB = 'REDIS_DB';
export const ENV_VAR_REDIS_KEY_PREFIX = 'REDIS_KEY_PREFIX';
export const ENV_VAR_ACHIEVEMENTS_TTL = 'ACHIEVEMENTS_TTL';
export const ENV_VAR_USER_PROFILE_TTL = 'USER_PROFILE_TTL';
export const ENV_VAR_LEADERBOARD_TTL = 'LEADERBOARD_TTL';
export const ENV_VAR_RULES_TTL = 'RULES_TTL';
export const ENV_VAR_DATABASE_URL = 'DATABASE_URL';
export const ENV_VAR_DATABASE_SSL = 'DATABASE_SSL';
export const ENV_VAR_DATABASE_LOGGING = 'DATABASE_LOGGING';
export const ENV_VAR_CACHE_ENABLED = 'CACHE_ENABLED';
export const ENV_VAR_LEADERBOARD_UPDATE_INTERVAL = 'LEADERBOARD_UPDATE_INTERVAL';
export const ENV_VAR_LEADERBOARD_MAX_ENTRIES = 'LEADERBOARD_MAX_ENTRIES';
export const ENV_VAR_ACHIEVEMENTS_NOTIFICATIONS_ENABLED = 'ACHIEVEMENTS_NOTIFICATIONS_ENABLED';
export const ENV_VAR_ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED = 'ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED';
export const ENV_VAR_ACHIEVEMENTS_MAX_CONCURRENT_QUESTS = 'ACHIEVEMENTS_MAX_CONCURRENT_QUESTS';
export const ENV_VAR_REWARDS_EXPIRATION_DAYS = 'REWARDS_EXPIRATION_DAYS';
export const ENV_VAR_REWARDS_REDEMPTION_ENABLED = 'REWARDS_REDEMPTION_ENABLED';
export const ENV_VAR_DLQ_RETRY_ATTEMPTS = 'DLQ_RETRY_ATTEMPTS';
export const ENV_VAR_DLQ_RETRY_DELAY = 'DLQ_RETRY_DELAY';
export const ENV_VAR_DLQ_MAX_AGE = 'DLQ_MAX_AGE';
export const ENV_VAR_DLQ_PROCESSING_INTERVAL = 'DLQ_PROCESSING_INTERVAL';
export const ENV_VAR_DLQ_BATCH_SIZE = 'DLQ_BATCH_SIZE';