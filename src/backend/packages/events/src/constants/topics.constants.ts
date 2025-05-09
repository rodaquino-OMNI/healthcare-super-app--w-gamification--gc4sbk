/**
 * @file topics.constants.ts
 * @description Centralized Kafka topic name constants for the AUSTA SuperApp.
 * 
 * This file serves as the single source of truth for all Kafka topic names used
 * across the application. It ensures consistent topic naming between producers
 * and consumers, preventing misconfiguration and message routing issues.
 * 
 * Topics are organized by journey and include versioning information for backward
 * compatibility. Each topic has a specific purpose and should be used according
 * to the documented guidelines.
 * 
 * @example
 * // Import specific journey topics
 * import { HEALTH_TOPICS } from '@austa/events/constants/topics.constants';
 * 
 * // Use in Kafka producer
 * kafkaService.produce(HEALTH_TOPICS.METRICS, healthMetricEvent);
 * 
 * @example
 * // Import all topics
 * import { TOPICS } from '@austa/events/constants/topics.constants';
 * 
 * // Use in Kafka consumer
 * kafkaService.consume(TOPICS.HEALTH.METRICS, 'consumer-group-id', handleHealthMetric);
 */

/**
 * Type definitions for topic constants to enhance type safety and code completion.
 */

/**
 * Base interface for topic namespaces
 */
interface TopicNamespace {
  EVENTS: string;
}

/**
 * Health journey topic namespace
 */
interface HealthTopics extends TopicNamespace {
  METRICS: string;
  GOALS: string;
  DEVICES: string;
}

/**
 * Care journey topic namespace
 */
interface CareTopics extends TopicNamespace {
  APPOINTMENTS: string;
  MEDICATIONS: string;
  TELEMEDICINE: string;
  PROVIDERS: string;
}

/**
 * Plan journey topic namespace
 */
interface PlanTopics extends TopicNamespace {
  CLAIMS: string;
  BENEFITS: string;
  COVERAGE: string;
}

/**
 * User topic namespace
 */
interface UserTopics extends TopicNamespace {
  AUTH: string;
  PROFILE: string;
  PREFERENCES: string;
}

/**
 * Gamification topic namespace
 */
interface GameTopics extends TopicNamespace {
  ACHIEVEMENTS: string;
  REWARDS: string;
  QUESTS: string;
  LEADERBOARD: string;
}

/**
 * Notification topic namespace
 */
interface NotificationTopics extends TopicNamespace {
  PUSH: string;
  EMAIL: string;
  SMS: string;
  IN_APP: string;
}

/**
 * Combined topics interface
 */
interface Topics {
  HEALTH: HealthTopics;
  CARE: CareTopics;
  PLAN: PlanTopics;
  USER: UserTopics;
  GAME: GameTopics;
  NOTIFICATION: NotificationTopics;
}

/**
 * Version pattern for topics to support backward compatibility.
 * Current version is v1. When making breaking changes to event schemas,
 * increment the version number and create new topic constants.
 */
const VERSION = 'v1';

/**
 * Health Journey Topics
 * 
 * These topics are used for events related to the "Minha Saúde" journey,
 * including health metrics, goals, and device connections.
 */
export const HEALTH_TOPICS: HealthTopics = {
  /**
   * Main topic for all health-related events.
   * Used for tracking health metrics, goals, and achievements.
   */
  EVENTS: `health.events.${VERSION}`,
  
  /**
   * Topic for health metric recording events.
   * Used when users record new health measurements (weight, blood pressure, etc.).
   */
  METRICS: `health.metrics.${VERSION}`,
  
  /**
   * Topic for health goal events.
   * Used when users create, update, or complete health goals.
   */
  GOALS: `health.goals.${VERSION}`,
  
  /**
   * Topic for device connection events.
   * Used when users connect or sync wearable devices.
   */
  DEVICES: `health.devices.${VERSION}`,
};

/**
 * Care Journey Topics
 * 
 * These topics are used for events related to the "Cuidar-me Agora" journey,
 * including appointments, medications, and telemedicine sessions.
 */
export const CARE_TOPICS: CareTopics = {
  /**
   * Main topic for all care-related events.
   * Used for tracking appointments, medications, and care activities.
   */
  EVENTS: `care.events.${VERSION}`,
  
  /**
   * Topic for appointment events.
   * Used when users book, reschedule, or attend appointments.
   */
  APPOINTMENTS: `care.appointments.${VERSION}`,
  
  /**
   * Topic for medication events.
   * Used when users add, take, or update medication schedules.
   */
  MEDICATIONS: `care.medications.${VERSION}`,
  
  /**
   * Topic for telemedicine events.
   * Used for telemedicine session scheduling, attendance, and completion.
   */
  TELEMEDICINE: `care.telemedicine.${VERSION}`,
  
  /**
   * Topic for provider interaction events.
   * Used when users interact with healthcare providers.
   */
  PROVIDERS: `care.providers.${VERSION}`,
};

/**
 * Plan Journey Topics
 * 
 * These topics are used for events related to the "Meu Plano & Benefícios" journey,
 * including insurance plans, claims, and benefits.
 */
export const PLAN_TOPICS: PlanTopics = {
  /**
   * Main topic for all plan-related events.
   * Used for tracking plan selections, claims, and benefit usage.
   */
  EVENTS: `plan.events.${VERSION}`,
  
  /**
   * Topic for insurance claim events.
   * Used when users submit, update, or receive updates on insurance claims.
   */
  CLAIMS: `plan.claims.${VERSION}`,
  
  /**
   * Topic for benefit usage events.
   * Used when users view, select, or utilize plan benefits.
   */
  BENEFITS: `plan.benefits.${VERSION}`,
  
  /**
   * Topic for coverage events.
   * Used when users check coverage details or make coverage changes.
   */
  COVERAGE: `plan.coverage.${VERSION}`,
};

/**
 * User Topics
 * 
 * These topics are used for cross-journey user events that don't belong
 * to a specific journey, such as authentication, profile updates, and preferences.
 */
export const USER_TOPICS: UserTopics = {
  /**
   * Main topic for all user-related events.
   * Used for tracking user activities across journeys.
   */
  EVENTS: `user.events.${VERSION}`,
  
  /**
   * Topic for authentication events.
   * Used when users sign in, sign out, or change authentication details.
   */
  AUTH: `user.auth.${VERSION}`,
  
  /**
   * Topic for profile events.
   * Used when users update their profile information.
   */
  PROFILE: `user.profile.${VERSION}`,
  
  /**
   * Topic for preference events.
   * Used when users update their preferences or settings.
   */
  PREFERENCES: `user.preferences.${VERSION}`,
};

/**
 * Gamification Topics
 * 
 * These topics are used for gamification-related events that process
 * achievements, rewards, and other gamification elements across all journeys.
 */
export const GAME_TOPICS: GameTopics = {
  /**
   * Main topic for all gamification-related events.
   * Used for tracking gamification activities across journeys.
   */
  EVENTS: `game.events.${VERSION}`,
  
  /**
   * Topic for achievement events.
   * Used when users earn or progress towards achievements.
   */
  ACHIEVEMENTS: `game.achievements.${VERSION}`,
  
  /**
   * Topic for reward events.
   * Used when users earn, redeem, or receive rewards.
   */
  REWARDS: `game.rewards.${VERSION}`,
  
  /**
   * Topic for quest events.
   * Used when users start, progress on, or complete quests.
   */
  QUESTS: `game.quests.${VERSION}`,
  
  /**
   * Topic for leaderboard events.
   * Used for updating leaderboard rankings and scores.
   */
  LEADERBOARD: `game.leaderboard.${VERSION}`,
};

/**
 * Notification Topics
 * 
 * These topics are used for notification-related events across all journeys.
 */
export const NOTIFICATION_TOPICS: NotificationTopics = {
  /**
   * Main topic for all notification-related events.
   * Used for sending notifications to users.
   */
  EVENTS: `notification.events.${VERSION}`,
  
  /**
   * Topic for push notification events.
   * Used for sending push notifications to mobile devices.
   */
  PUSH: `notification.push.${VERSION}`,
  
  /**
   * Topic for email notification events.
   * Used for sending email notifications.
   */
  EMAIL: `notification.email.${VERSION}`,
  
  /**
   * Topic for SMS notification events.
   * Used for sending SMS notifications.
   */
  SMS: `notification.sms.${VERSION}`,
  
  /**
   * Topic for in-app notification events.
   * Used for sending in-app notifications.
   */
  IN_APP: `notification.in-app.${VERSION}`,
};

/**
 * All Topics
 * 
 * Combines all topic namespaces into a single object for easy access.
 * This allows importing all topics with a single import statement.
 */
export const TOPICS: Topics = {
  HEALTH: HEALTH_TOPICS,
  CARE: CARE_TOPICS,
  PLAN: PLAN_TOPICS,
  USER: USER_TOPICS,
  GAME: GAME_TOPICS,
  NOTIFICATION: NOTIFICATION_TOPICS,
};

/**
 * Topic validation utilities
 */
export const TopicValidation = {
  /**
   * Validates if a topic name follows the correct format
   * @param topic The topic name to validate
   * @returns True if the topic is valid, false otherwise
   */
  isValidTopic: (topic: string): boolean => {
    // Topics should follow the format: domain.entity.version
    // e.g., health.metrics.v1
    const topicRegex = /^[a-z]+\.[a-z-]+\.v\d+$/;
    return topicRegex.test(topic);
  },
  
  /**
   * Gets all topics for a specific journey
   * @param journey The journey name (health, care, plan)
   * @returns An array of all topics for the specified journey
   */
  getJourneyTopics: (journey: 'health' | 'care' | 'plan'): string[] => {
    switch (journey) {
      case 'health':
        return Object.values(HEALTH_TOPICS);
      case 'care':
        return Object.values(CARE_TOPICS);
      case 'plan':
        return Object.values(PLAN_TOPICS);
      default:
        return [];
    }
  },
  
  /**
   * Gets all topics across all journeys
   * @returns An array of all topics
   */
  getAllTopics: (): string[] => {
    return [
      ...Object.values(HEALTH_TOPICS),
      ...Object.values(CARE_TOPICS),
      ...Object.values(PLAN_TOPICS),
      ...Object.values(USER_TOPICS),
      ...Object.values(GAME_TOPICS),
      ...Object.values(NOTIFICATION_TOPICS),
    ];
  },
};

/**
 * Topic versioning utilities
 */
export const TopicVersions = {
  /**
   * Current version of topics
   */
  CURRENT: VERSION,
  
  /**
   * Gets a versioned topic name
   * @param baseTopic The base topic name without version
   * @param version The version to use (defaults to current version)
   * @returns The versioned topic name
   */
  getVersioned: (baseTopic: string, version: string = VERSION): string => {
    return `${baseTopic}.${version}`;
  },
  
  /**
   * Extracts the base topic name from a versioned topic
   * @param versionedTopic The versioned topic name
   * @returns The base topic name without version
   */
  getBaseTopic: (versionedTopic: string): string => {
    const parts = versionedTopic.split('.');
    // Remove the last part (version)
    return parts.slice(0, -1).join('.');
  },
  
  /**
   * Extracts the version from a versioned topic
   * @param versionedTopic The versioned topic name
   * @returns The version string
   */
  getVersion: (versionedTopic: string): string => {
    const parts = versionedTopic.split('.');
    // Get the last part (version)
    return parts[parts.length - 1];
  },
};

/**
 * Default export for backward compatibility with existing code.
 * New code should use the named exports for better type safety.
 */
export default TOPICS;