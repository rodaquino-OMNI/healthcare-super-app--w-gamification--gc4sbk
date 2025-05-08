/**
 * @file Gamification Engine Constants
 * @description Central barrel file that re-exports all constants from the gamification engine constants directory.
 * This file provides a single import point for consumers, simplifying imports and ensuring all constants
 * are consistently available throughout the application.
 *
 * @example
 * // Import all constants from a specific category
 * import { KAFKA_TOPICS, REDIS_KEYS } from '@app/gamification/common/constants';
 *
 * // Or import specific constants
 * import { 
 *   ACHIEVEMENT_TYPES, 
 *   EVENT_TYPES,
 *   JOURNEY_IDENTIFIERS,
 *   POINT_VALUES,
 *   ERROR_CODES,
 *   RETRY_POLICIES 
 * } from '@app/gamification/common/constants';
 */

/**
 * Journey Constants
 * @description Constants related to the three user journeys (Health, Care, Plan)
 */
export * from './journey';

/**
 * Event System Constants
 * @description Constants related to event processing, Kafka topics, and event types
 */
export * from './event-types';
export * from './kafka-topics';

/**
 * Achievement System Constants
 * @description Constants related to achievements, point values, and gamification rules
 */
export * from './achievement-types';
export * from './point-values';

/**
 * Infrastructure Constants
 * @description Constants related to infrastructure components like Redis, caching, etc.
 */
export * from './redis-keys';

/**
 * Error Handling Constants
 * @description Constants related to error codes, retry policies, and error handling
 */
export * from './error-codes';
export * from './retry-policies';

/**
 * @example Usage examples for common constant patterns
 *
 * // Using Kafka topics
 * kafkaClient.subscribe(KAFKA_TOPICS.ACHIEVEMENT_EVENTS);
 *
 * // Using Redis keys
 * const leaderboardKey = REDIS_KEYS.LEADERBOARD.global();
 * const userAchievementsKey = REDIS_KEYS.USER_ACHIEVEMENTS.forUser(userId);
 *
 * // Using point values
 * const points = POINT_VALUES.HEALTH.COMPLETE_GOAL;
 *
 * // Using journey identifiers
 * if (journeyId === JOURNEY_IDENTIFIERS.HEALTH) {
 *   // Health journey specific logic
 * }
 *
 * // Using error codes
 * throw new GamificationError(ERROR_CODES.ACHIEVEMENT.NOT_FOUND);
 *
 * // Using retry policies
 * const retryConfig = RETRY_POLICIES.KAFKA_CONSUMER;
 */