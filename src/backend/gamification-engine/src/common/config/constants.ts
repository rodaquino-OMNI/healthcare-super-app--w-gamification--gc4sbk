/**
 * Default port for the Gamification Engine service.
 */
export const DEFAULT_PORT = 3000;

/**
 * Default API prefix for the Gamification Engine service.
 */
export const DEFAULT_API_PREFIX = 'api';

/**
 * Environment names.
 */
export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  STAGING = 'staging',
}

/**
 * Log levels.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Redis key prefixes.
 */
export enum RedisPrefix {
  GAME_PROFILE = 'game:profile:',
  ACHIEVEMENT = 'game:achievement:',
  LEADERBOARD = 'game:leaderboard:',
  RULE = 'game:rule:',
  QUEST = 'game:quest:',
  REWARD = 'game:reward:',
}

/**
 * Default TTL values in seconds.
 */
export enum DefaultTTL {
  ACHIEVEMENT = 3600, // 1 hour
  USER_PROFILE = 300, // 5 minutes
  LEADERBOARD = 900, // 15 minutes
  RULE = 600, // 10 minutes
}

/**
 * Kafka topics.
 */
export enum KafkaTopic {
  HEALTH_EVENTS = 'health.events',
  CARE_EVENTS = 'care.events',
  PLAN_EVENTS = 'plan.events',
  USER_EVENTS = 'user.events',
  GAME_EVENTS = 'game.events',
}

/**
 * Journey IDs.
 */
export enum JourneyId {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global',
}

/**
 * Error codes for the Gamification Engine service.
 */
export enum ErrorCode {
  INVALID_EVENT = 'GAME_001',
  PROFILE_NOT_FOUND = 'GAME_002',
  ACHIEVEMENT_NOT_FOUND = 'GAME_003',
  RULE_EVALUATION_FAILED = 'GAME_004',
  KAFKA_CONNECTION_FAILED = 'GAME_005',
  REDIS_CONNECTION_FAILED = 'GAME_006',
  DATABASE_CONNECTION_FAILED = 'GAME_007',
  INVALID_CONFIGURATION = 'GAME_008',
  QUEST_NOT_FOUND = 'GAME_009',
  QUEST_ALREADY_COMPLETED = 'GAME_010',
  QUEST_NOT_STARTED = 'GAME_011',
  QUEST_PROGRESS_INVALID = 'GAME_012',
  REWARD_NOT_FOUND = 'GAME_013',
  REWARD_ALREADY_CLAIMED = 'GAME_014',
  LEADERBOARD_GENERATION_FAILED = 'GAME_015',
  UNAUTHORIZED = 'GAME_016',
  FORBIDDEN = 'GAME_017',
  VALIDATION_FAILED = 'GAME_018',
  INTERNAL_SERVER_ERROR = 'GAME_019',
}

/**
 * Default values for gamification points.
 */
export enum DefaultPoints {
  HEALTH_METRIC_RECORDED = 10,
  APPOINTMENT_BOOKED = 20,
  APPOINTMENT_ATTENDED = 50,
  CLAIM_SUBMITTED = 15,
  GOAL_COMPLETED = 100,
}

/**
 * Default limits for gamification points.
 */
export enum PointsLimits {
  MAX_POINTS_PER_DAY = 1000,
  MAX_POINTS_PER_ACTION = 500,
}

/**
 * Default values for event processing.
 */
export enum EventProcessing {
  RATE = 1000, // 1 second
  BATCH_SIZE = 100,
  RULES_REFRESH_INTERVAL = 60000, // 1 minute
}