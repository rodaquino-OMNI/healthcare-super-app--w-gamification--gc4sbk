/**
 * @file topics.constants.ts
 * @description Centralizes all Kafka topic name constants used across the healthcare super app,
 * creating a single source of truth for event stream topics. This file ensures consistent topic
 * naming between producers and consumers, preventing misconfiguration and message routing issues.
 */

import { JOURNEY_IDS } from './journey.constants';

/**
 * Base topic names for each journey and cross-cutting concern.
 * These are the core topic names without any versioning or environment prefixes.
 */
export const BASE_TOPICS = {
  /**
   * Topic for health journey events (metrics, goals, devices, insights)
   * Consumed by: Gamification Engine, Notification Service
   * Produced by: Health Service
   */
  HEALTH_EVENTS: 'health.events',

  /**
   * Topic for care journey events (appointments, medications, telemedicine)
   * Consumed by: Gamification Engine, Notification Service
   * Produced by: Care Service
   */
  CARE_EVENTS: 'care.events',

  /**
   * Topic for plan journey events (claims, benefits, coverage)
   * Consumed by: Gamification Engine, Notification Service
   * Produced by: Plan Service
   */
  PLAN_EVENTS: 'plan.events',

  /**
   * Topic for user-related events (profile updates, logins, preferences)
   * Consumed by: All Services, Gamification Engine, Notification Service
   * Produced by: Auth Service, API Gateway
   */
  USER_EVENTS: 'user.events',

  /**
   * Topic for gamification events (achievements, rewards, levels)
   * Consumed by: Notification Service, Journey Services
   * Produced by: Gamification Engine
   */
  GAME_EVENTS: 'game.events',

  /**
   * Topic for notification events (delivery status, user interactions)
   * Consumed by: Journey Services
   * Produced by: Notification Service
   */
  NOTIFICATION_EVENTS: 'notification.events',
} as const;

/**
 * Versioned topic names with the format: {base_topic}.v{version}
 * This allows for backward compatibility when event schemas evolve.
 * 
 * Current version is v1 for all topics.
 */
export const VERSIONED_TOPICS = {
  /**
   * Versioned topic for health journey events
   */
  HEALTH_EVENTS_V1: `${BASE_TOPICS.HEALTH_EVENTS}.v1`,

  /**
   * Versioned topic for care journey events
   */
  CARE_EVENTS_V1: `${BASE_TOPICS.CARE_EVENTS}.v1`,

  /**
   * Versioned topic for plan journey events
   */
  PLAN_EVENTS_V1: `${BASE_TOPICS.PLAN_EVENTS}.v1`,

  /**
   * Versioned topic for user-related events
   */
  USER_EVENTS_V1: `${BASE_TOPICS.USER_EVENTS}.v1`,

  /**
   * Versioned topic for gamification events
   */
  GAME_EVENTS_V1: `${BASE_TOPICS.GAME_EVENTS}.v1`,

  /**
   * Versioned topic for notification events
   */
  NOTIFICATION_EVENTS_V1: `${BASE_TOPICS.NOTIFICATION_EVENTS}.v1`,
} as const;

/**
 * Dead Letter Queue (DLQ) topics for failed event processing.
 * These topics store events that could not be processed after multiple retries.
 */
export const DLQ_TOPICS = {
  /**
   * DLQ for health journey events
   */
  HEALTH_EVENTS_DLQ: `${BASE_TOPICS.HEALTH_EVENTS}.dlq`,

  /**
   * DLQ for care journey events
   */
  CARE_EVENTS_DLQ: `${BASE_TOPICS.CARE_EVENTS}.dlq`,

  /**
   * DLQ for plan journey events
   */
  PLAN_EVENTS_DLQ: `${BASE_TOPICS.PLAN_EVENTS}.dlq`,

  /**
   * DLQ for user-related events
   */
  USER_EVENTS_DLQ: `${BASE_TOPICS.USER_EVENTS}.dlq`,

  /**
   * DLQ for gamification events
   */
  GAME_EVENTS_DLQ: `${BASE_TOPICS.GAME_EVENTS}.dlq`,

  /**
   * DLQ for notification events
   */
  NOTIFICATION_EVENTS_DLQ: `${BASE_TOPICS.NOTIFICATION_EVENTS}.dlq`,
} as const;

/**
 * Retry topics for events that failed processing but can be retried.
 * These topics use a delay mechanism to implement exponential backoff.
 */
export const RETRY_TOPICS = {
  /**
   * Retry topic for health journey events
   */
  HEALTH_EVENTS_RETRY: `${BASE_TOPICS.HEALTH_EVENTS}.retry`,

  /**
   * Retry topic for care journey events
   */
  CARE_EVENTS_RETRY: `${BASE_TOPICS.CARE_EVENTS}.retry`,

  /**
   * Retry topic for plan journey events
   */
  PLAN_EVENTS_RETRY: `${BASE_TOPICS.PLAN_EVENTS}.retry`,

  /**
   * Retry topic for user-related events
   */
  USER_EVENTS_RETRY: `${BASE_TOPICS.USER_EVENTS}.retry`,

  /**
   * Retry topic for gamification events
   */
  GAME_EVENTS_RETRY: `${BASE_TOPICS.GAME_EVENTS}.retry`,

  /**
   * Retry topic for notification events
   */
  NOTIFICATION_EVENTS_RETRY: `${BASE_TOPICS.NOTIFICATION_EVENTS}.retry`,
} as const;

/**
 * Mapping of journey IDs to their corresponding event topics.
 * This allows for dynamic topic lookup based on journey ID.
 */
export const JOURNEY_TOPICS = {
  [JOURNEY_IDS.HEALTH]: BASE_TOPICS.HEALTH_EVENTS,
  [JOURNEY_IDS.CARE]: BASE_TOPICS.CARE_EVENTS,
  [JOURNEY_IDS.PLAN]: BASE_TOPICS.PLAN_EVENTS,
} as const;

/**
 * Mapping of journey IDs to their corresponding versioned event topics.
 * This allows for dynamic versioned topic lookup based on journey ID.
 */
export const JOURNEY_VERSIONED_TOPICS = {
  [JOURNEY_IDS.HEALTH]: VERSIONED_TOPICS.HEALTH_EVENTS_V1,
  [JOURNEY_IDS.CARE]: VERSIONED_TOPICS.CARE_EVENTS_V1,
  [JOURNEY_IDS.PLAN]: VERSIONED_TOPICS.PLAN_EVENTS_V1,
} as const;

/**
 * Mapping of journey IDs to their corresponding DLQ topics.
 * This allows for dynamic DLQ topic lookup based on journey ID.
 */
export const JOURNEY_DLQ_TOPICS = {
  [JOURNEY_IDS.HEALTH]: DLQ_TOPICS.HEALTH_EVENTS_DLQ,
  [JOURNEY_IDS.CARE]: DLQ_TOPICS.CARE_EVENTS_DLQ,
  [JOURNEY_IDS.PLAN]: DLQ_TOPICS.PLAN_EVENTS_DLQ,
} as const;

/**
 * Mapping of journey IDs to their corresponding retry topics.
 * This allows for dynamic retry topic lookup based on journey ID.
 */
export const JOURNEY_RETRY_TOPICS = {
  [JOURNEY_IDS.HEALTH]: RETRY_TOPICS.HEALTH_EVENTS_RETRY,
  [JOURNEY_IDS.CARE]: RETRY_TOPICS.CARE_EVENTS_RETRY,
  [JOURNEY_IDS.PLAN]: RETRY_TOPICS.PLAN_EVENTS_RETRY,
} as const;

/**
 * Helper function to get the appropriate topic for a journey.
 * 
 * @param journeyId The journey ID to get the topic for
 * @param options Configuration options for topic selection
 * @returns The appropriate topic name
 * 
 * @example
 * // Get the base topic for the health journey
 * const topic = getJourneyTopic('health');
 * 
 * // Get the versioned topic for the care journey
 * const versionedTopic = getJourneyTopic('care', { versioned: true });
 * 
 * // Get the DLQ topic for the plan journey
 * const dlqTopic = getJourneyTopic('plan', { dlq: true });
 */
export function getJourneyTopic(
  journeyId: keyof typeof JOURNEY_IDS,
  options: { versioned?: boolean; dlq?: boolean; retry?: boolean } = {}
): string {
  const { versioned = false, dlq = false, retry = false } = options;
  
  if (dlq) {
    return JOURNEY_DLQ_TOPICS[journeyId];
  }
  
  if (retry) {
    return JOURNEY_RETRY_TOPICS[journeyId];
  }
  
  if (versioned) {
    return JOURNEY_VERSIONED_TOPICS[journeyId];
  }
  
  return JOURNEY_TOPICS[journeyId];
}

/**
 * Default consumer group IDs for each service.
 * These provide consistent consumer group naming across environments.
 */
export const CONSUMER_GROUPS = {
  /**
   * Consumer group for the Gamification Engine
   */
  GAMIFICATION_ENGINE: 'gamification-consumer-group',

  /**
   * Consumer group for the Notification Service
   */
  NOTIFICATION_SERVICE: 'notification-consumer-group',

  /**
   * Consumer group for the Health Service
   */
  HEALTH_SERVICE: 'health-consumer-group',

  /**
   * Consumer group for the Care Service
   */
  CARE_SERVICE: 'care-consumer-group',

  /**
   * Consumer group for the Plan Service
   */
  PLAN_SERVICE: 'plan-consumer-group',
} as const;

/**
 * Topic configuration for environment-specific prefixing.
 * This allows for isolation between development, staging, and production environments.
 */
export const TOPIC_CONFIG = {
  /**
   * Whether to apply environment prefixes to topics
   * Default: true for non-production environments
   */
  USE_ENV_PREFIX: process.env.KAFKA_USE_ENV_PREFIX !== 'false',

  /**
   * Environment prefix to apply to topics (e.g., 'dev.', 'staging.')
   * Default: Based on NODE_ENV or empty for production
   */
  ENV_PREFIX: process.env.KAFKA_TOPIC_PREFIX || 
    (process.env.NODE_ENV === 'production' ? '' : `${process.env.NODE_ENV || 'dev'}.`),

  /**
   * Whether to use versioned topics by default
   * Default: true
   */
  USE_VERSIONED_TOPICS: process.env.KAFKA_USE_VERSIONED_TOPICS !== 'false',
} as const;

/**
 * Gets the fully qualified topic name with environment prefix if configured.
 * 
 * @param topic The base topic name
 * @returns The fully qualified topic name
 * 
 * @example
 * // With ENV_PREFIX = 'dev.'
 * const fullTopic = getFullyQualifiedTopic('health.events');
 * // Returns: 'dev.health.events'
 */
export function getFullyQualifiedTopic(topic: string): string {
  if (TOPIC_CONFIG.USE_ENV_PREFIX && TOPIC_CONFIG.ENV_PREFIX) {
    return `${TOPIC_CONFIG.ENV_PREFIX}${topic}`;
  }
  return topic;
}

/**
 * Gets the appropriate topic based on configuration and environment.
 * This is the main function that should be used when determining which topic to publish to or consume from.
 * 
 * @param baseTopicKey The key of the base topic in BASE_TOPICS
 * @param options Configuration options for topic selection
 * @returns The appropriate topic name with environment prefix if configured
 * 
 * @example
 * // Get the appropriate health events topic based on configuration
 * const topic = getConfiguredTopic('HEALTH_EVENTS');
 * 
 * // Force using the versioned topic regardless of configuration
 * const versionedTopic = getConfiguredTopic('CARE_EVENTS', { forceVersioned: true });
 * 
 * // Get the DLQ topic
 * const dlqTopic = getConfiguredTopic('PLAN_EVENTS', { dlq: true });
 */
export function getConfiguredTopic(
  baseTopicKey: keyof typeof BASE_TOPICS,
  options: { forceVersioned?: boolean; dlq?: boolean; retry?: boolean } = {}
): string {
  const { forceVersioned = false, dlq = false, retry = false } = options;
  
  let topic: string;
  
  if (dlq) {
    // Get the DLQ topic
    const dlqKey = `${baseTopicKey}_DLQ` as keyof typeof DLQ_TOPICS;
    topic = DLQ_TOPICS[dlqKey];
  } else if (retry) {
    // Get the retry topic
    const retryKey = `${baseTopicKey}_RETRY` as keyof typeof RETRY_TOPICS;
    topic = RETRY_TOPICS[retryKey];
  } else if (forceVersioned || TOPIC_CONFIG.USE_VERSIONED_TOPICS) {
    // Get the versioned topic
    const versionedKey = `${baseTopicKey}_V1` as keyof typeof VERSIONED_TOPICS;
    topic = VERSIONED_TOPICS[versionedKey];
  } else {
    // Get the base topic
    topic = BASE_TOPICS[baseTopicKey];
  }
  
  // Apply environment prefix if configured
  return getFullyQualifiedTopic(topic);
}