/**
 * Kafka topic name constants for the AUSTA SuperApp event system.
 * This file centralizes all topic names used across the healthcare super app,
 * creating a single source of truth for event stream topics.
 * 
 * These constants ensure consistent topic naming between producers and consumers,
 * preventing misconfiguration and message routing issues.
 */

/**
 * Base topic names for each journey and cross-journey events.
 * These are the core topic names without versioning or environment prefixes.
 */
export const BASE_TOPICS = {
  /**
   * Health journey events topic.
   * Used for events related to health metrics, goals, and device integration.
   */
  HEALTH_EVENTS: 'health.events',

  /**
   * Care journey events topic.
   * Used for events related to appointments, telemedicine, and care plans.
   */
  CARE_EVENTS: 'care.events',

  /**
   * Plan journey events topic.
   * Used for events related to insurance plans, claims, and benefits.
   */
  PLAN_EVENTS: 'plan.events',

  /**
   * User events topic for cross-journey user activities.
   * Used for events related to user profiles, preferences, and authentication.
   */
  USER_EVENTS: 'user.events',

  /**
   * Gamification events topic for achievement and reward events.
   * Used for events related to points, achievements, levels, and rewards.
   */
  GAME_EVENTS: 'game.events',
};

/**
 * Topic version pattern for supporting backward compatibility.
 * Format: {base_topic}.v{major_version}
 * 
 * Example: health.events.v1
 */
export const TOPIC_VERSION_PATTERN = '{topic}.v{version}';

/**
 * Current major version for each topic.
 * Increment when making breaking changes to event schemas.
 */
export const TOPIC_VERSIONS = {
  [BASE_TOPICS.HEALTH_EVENTS]: 1,
  [BASE_TOPICS.CARE_EVENTS]: 1,
  [BASE_TOPICS.PLAN_EVENTS]: 1,
  [BASE_TOPICS.USER_EVENTS]: 1,
  [BASE_TOPICS.GAME_EVENTS]: 1,
};

/**
 * Environment-specific topic prefix configuration.
 * Used to separate topics across different environments (dev, staging, prod).
 */
export const TOPIC_ENV_PREFIX = {
  DEVELOPMENT: 'dev.',
  STAGING: 'stg.',
  PRODUCTION: '', // No prefix for production
};

/**
 * Generates a versioned topic name based on the base topic and version.
 * 
 * @param baseTopic The base topic name
 * @param version The major version number (defaults to current version)
 * @returns The versioned topic name
 */
export const getVersionedTopic = (baseTopic: string, version?: number): string => {
  const topicVersion = version || TOPIC_VERSIONS[baseTopic] || 1;
  return TOPIC_VERSION_PATTERN
    .replace('{topic}', baseTopic)
    .replace('{version}', topicVersion.toString());
};

/**
 * Generates an environment-specific topic name with proper versioning.
 * 
 * @param baseTopic The base topic name
 * @param environment The deployment environment
 * @param version The major version number (defaults to current version)
 * @returns The environment-specific versioned topic name
 */
export const getEnvironmentTopic = (
  baseTopic: string,
  environment: keyof typeof TOPIC_ENV_PREFIX = 'PRODUCTION',
  version?: number
): string => {
  const versionedTopic = getVersionedTopic(baseTopic, version);
  const prefix = TOPIC_ENV_PREFIX[environment] || '';
  return `${prefix}${versionedTopic}`;
};

/**
 * Namespace for Health journey topics with proper typing.
 */
export namespace HealthTopics {
  /**
   * Base topic for all health journey events.
   */
  export const BASE = BASE_TOPICS.HEALTH_EVENTS;

  /**
   * Versioned topic for health journey events (current version).
   */
  export const CURRENT = getVersionedTopic(BASE);

  /**
   * Topic for health metrics recording events.
   * Used when users record weight, blood pressure, steps, etc.
   */
  export const METRICS = `${BASE}.metrics`;

  /**
   * Topic for health goal events.
   * Used when users set, update, or complete health goals.
   */
  export const GOALS = `${BASE}.goals`;

  /**
   * Topic for device integration events.
   * Used when users connect, sync, or disconnect health devices.
   */
  export const DEVICES = `${BASE}.devices`;

  /**
   * Topic for health insights events.
   * Used for generated health insights and recommendations.
   */
  export const INSIGHTS = `${BASE}.insights`;
}

/**
 * Namespace for Care journey topics with proper typing.
 */
export namespace CareTopics {
  /**
   * Base topic for all care journey events.
   */
  export const BASE = BASE_TOPICS.CARE_EVENTS;

  /**
   * Versioned topic for care journey events (current version).
   */
  export const CURRENT = getVersionedTopic(BASE);

  /**
   * Topic for appointment events.
   * Used when users book, reschedule, or cancel appointments.
   */
  export const APPOINTMENTS = `${BASE}.appointments`;

  /**
   * Topic for telemedicine events.
   * Used for telemedicine session events (start, end, etc.).
   */
  export const TELEMEDICINE = `${BASE}.telemedicine`;

  /**
   * Topic for medication events.
   * Used for medication adherence tracking and reminders.
   */
  export const MEDICATIONS = `${BASE}.medications`;

  /**
   * Topic for care plan events.
   * Used when care plans are created, updated, or completed.
   */
  export const CARE_PLANS = `${BASE}.care-plans`;
}

/**
 * Namespace for Plan journey topics with proper typing.
 */
export namespace PlanTopics {
  /**
   * Base topic for all plan journey events.
   */
  export const BASE = BASE_TOPICS.PLAN_EVENTS;

  /**
   * Versioned topic for plan journey events (current version).
   */
  export const CURRENT = getVersionedTopic(BASE);

  /**
   * Topic for insurance claim events.
   * Used when users submit, update, or receive updates on claims.
   */
  export const CLAIMS = `${BASE}.claims`;

  /**
   * Topic for benefit utilization events.
   * Used when users utilize or inquire about their benefits.
   */
  export const BENEFITS = `${BASE}.benefits`;

  /**
   * Topic for plan selection events.
   * Used when users view, compare, or select insurance plans.
   */
  export const PLAN_SELECTION = `${BASE}.selection`;

  /**
   * Topic for coverage verification events.
   * Used when coverage is verified for services or procedures.
   */
  export const COVERAGE = `${BASE}.coverage`;
}

/**
 * Namespace for User-related topics with proper typing.
 */
export namespace UserTopics {
  /**
   * Base topic for all user-related events.
   */
  export const BASE = BASE_TOPICS.USER_EVENTS;

  /**
   * Versioned topic for user events (current version).
   */
  export const CURRENT = getVersionedTopic(BASE);

  /**
   * Topic for user profile events.
   * Used when users create, update, or delete their profiles.
   */
  export const PROFILES = `${BASE}.profiles`;

  /**
   * Topic for user authentication events.
   * Used for login, logout, password reset, etc.
   */
  export const AUTHENTICATION = `${BASE}.auth`;

  /**
   * Topic for user preference events.
   * Used when users update their preferences or settings.
   */
  export const PREFERENCES = `${BASE}.preferences`;

  /**
   * Topic for user notification events.
   * Used for sending notifications to users.
   */
  export const NOTIFICATIONS = `${BASE}.notifications`;
}

/**
 * Namespace for Gamification-related topics with proper typing.
 */
export namespace GameTopics {
  /**
   * Base topic for all gamification-related events.
   */
  export const BASE = BASE_TOPICS.GAME_EVENTS;

  /**
   * Versioned topic for gamification events (current version).
   */
  export const CURRENT = getVersionedTopic(BASE);

  /**
   * Topic for achievement events.
   * Used when users earn or progress towards achievements.
   */
  export const ACHIEVEMENTS = `${BASE}.achievements`;

  /**
   * Topic for reward events.
   * Used when rewards are earned, claimed, or expired.
   */
  export const REWARDS = `${BASE}.rewards`;

  /**
   * Topic for leaderboard events.
   * Used for leaderboard updates and rankings.
   */
  export const LEADERBOARDS = `${BASE}.leaderboards`;

  /**
   * Topic for quest events.
   * Used when quests are started, progressed, or completed.
   */
  export const QUESTS = `${BASE}.quests`;
}

/**
 * Dead letter queue topics for each journey.
 * Used for events that failed processing after maximum retries.
 */
export const DLQ_TOPICS = {
  /**
   * Dead letter queue for health journey events.
   */
  HEALTH_DLQ: `${BASE_TOPICS.HEALTH_EVENTS}.dlq`,

  /**
   * Dead letter queue for care journey events.
   */
  CARE_DLQ: `${BASE_TOPICS.CARE_EVENTS}.dlq`,

  /**
   * Dead letter queue for plan journey events.
   */
  PLAN_DLQ: `${BASE_TOPICS.PLAN_EVENTS}.dlq`,

  /**
   * Dead letter queue for user events.
   */
  USER_DLQ: `${BASE_TOPICS.USER_EVENTS}.dlq`,

  /**
   * Dead letter queue for gamification events.
   */
  GAME_DLQ: `${BASE_TOPICS.GAME_EVENTS}.dlq`,
};

/**
 * Environment variable names for topic configuration.
 * These match the environment variables used in the application configuration.
 */
export const TOPIC_ENV_VARS = {
  HEALTH_EVENTS: 'KAFKA_TOPIC_HEALTH_EVENTS',
  CARE_EVENTS: 'KAFKA_TOPIC_CARE_EVENTS',
  PLAN_EVENTS: 'KAFKA_TOPIC_PLAN_EVENTS',
  USER_EVENTS: 'KAFKA_TOPIC_USER_EVENTS',
  GAME_EVENTS: 'KAFKA_TOPIC_GAME_EVENTS',
};

/**
 * Default configuration object for Kafka topics.
 * This matches the structure used in the application configuration.
 */
export const DEFAULT_TOPIC_CONFIG = {
  healthEvents: process.env[TOPIC_ENV_VARS.HEALTH_EVENTS] || BASE_TOPICS.HEALTH_EVENTS,
  careEvents: process.env[TOPIC_ENV_VARS.CARE_EVENTS] || BASE_TOPICS.CARE_EVENTS,
  planEvents: process.env[TOPIC_ENV_VARS.PLAN_EVENTS] || BASE_TOPICS.PLAN_EVENTS,
  userEvents: process.env[TOPIC_ENV_VARS.USER_EVENTS] || BASE_TOPICS.USER_EVENTS,
  gameEvents: process.env[TOPIC_ENV_VARS.GAME_EVENTS] || BASE_TOPICS.GAME_EVENTS,
};