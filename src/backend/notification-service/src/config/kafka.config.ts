/**
 * Kafka Configuration for Notification Service
 * 
 * This module configures Kafka integration for the notification service, including:
 * - Broker connections
 * - Topic definitions
 * - Consumer groups
 * - Message schemas
 * 
 * It enables reliable event-based notification processing with typed message payloads
 * using @austa/interfaces for standardized event schemas.
 */

import { KafkaOptions, Transport } from '@nestjs/microservices';
import { registerAs } from '@nestjs/config';

// Import interfaces from the shared package for type safety
import { 
  NotificationEventType,
  JourneyType 
} from '@austa/interfaces/gamification';

/**
 * Topic name generator for consistent naming conventions
 */
export const generateTopicName = (prefix: string, name: string): string => {
  return `${prefix}.${name}`;
};

/**
 * Consumer group name generator for consistent naming conventions
 */
export const generateConsumerGroupId = (serviceName: string, topicName: string): string => {
  return `${serviceName}-${topicName}-consumer`;
};

/**
 * Notification service name constant
 */
export const NOTIFICATION_SERVICE_NAME = 'notification-service';

/**
 * Topic prefixes for different domains
 */
export const TOPIC_PREFIXES = {
  NOTIFICATION: 'notification',
  JOURNEY: 'journey',
  GAMIFICATION: 'gamification',
};

/**
 * Topic names for notification events
 */
export const NOTIFICATION_TOPICS = {
  // Topics for consuming notification requests
  HEALTH_NOTIFICATIONS: generateTopicName(TOPIC_PREFIXES.JOURNEY, 'health.notifications'),
  CARE_NOTIFICATIONS: generateTopicName(TOPIC_PREFIXES.JOURNEY, 'care.notifications'),
  PLAN_NOTIFICATIONS: generateTopicName(TOPIC_PREFIXES.JOURNEY, 'plan.notifications'),
  GAMIFICATION_NOTIFICATIONS: generateTopicName(TOPIC_PREFIXES.GAMIFICATION, 'notifications'),
  
  // Topics for publishing notification status updates
  NOTIFICATION_STATUS: generateTopicName(TOPIC_PREFIXES.NOTIFICATION, 'status'),
  NOTIFICATION_DELIVERY: generateTopicName(TOPIC_PREFIXES.NOTIFICATION, 'delivery'),
};

/**
 * Consumer group IDs for notification service
 */
export const CONSUMER_GROUPS = {
  HEALTH_NOTIFICATIONS: generateConsumerGroupId(NOTIFICATION_SERVICE_NAME, 'health-notifications'),
  CARE_NOTIFICATIONS: generateConsumerGroupId(NOTIFICATION_SERVICE_NAME, 'care-notifications'),
  PLAN_NOTIFICATIONS: generateConsumerGroupId(NOTIFICATION_SERVICE_NAME, 'plan-notifications'),
  GAMIFICATION_NOTIFICATIONS: generateConsumerGroupId(NOTIFICATION_SERVICE_NAME, 'gamification-notifications'),
};

/**
 * Mapping of journey types to their respective notification topics
 */
export const JOURNEY_NOTIFICATION_TOPICS: Record<JourneyType, string> = {
  [JourneyType.HEALTH]: NOTIFICATION_TOPICS.HEALTH_NOTIFICATIONS,
  [JourneyType.CARE]: NOTIFICATION_TOPICS.CARE_NOTIFICATIONS,
  [JourneyType.PLAN]: NOTIFICATION_TOPICS.PLAN_NOTIFICATIONS,
};

/**
 * Mapping of notification event types to their respective topics
 */
export const NOTIFICATION_EVENT_TOPICS: Partial<Record<NotificationEventType, string>> = {
  // Add specific mappings for different notification event types
  // This allows for more granular routing of notification events
};

/**
 * Kafka configuration for the notification service
 * Registered as 'kafka' configuration namespace
 */
export default registerAs('kafka', () => {
  const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
  
  // Default Kafka configuration
  const kafkaConfig: KafkaOptions = {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: NOTIFICATION_SERVICE_NAME,
        brokers,
        // Retry configuration for broker connection
        retry: {
          initialRetryTime: 300,
          retries: 10,
          maxRetryTime: 30000,
        },
      },
      consumer: {
        // Default consumer group ID
        groupId: CONSUMER_GROUPS.HEALTH_NOTIFICATIONS,
        // Auto-commit configuration
        allowAutoTopicCreation: false,
        maxWaitTimeInMs: 5000,
        // Retry failed messages with backoff
        retry: {
          initialRetryTime: 300,
          retries: 10,
          maxRetryTime: 30000,
        },
      },
      producer: {
        // Producer configuration
        allowAutoTopicCreation: false,
        // Idempotent producer for exactly-once semantics
        idempotent: true,
        // Retry configuration for producer
        retry: {
          initialRetryTime: 300,
          retries: 10,
          maxRetryTime: 30000,
        },
      },
      // Enable run-time type checking for messages
      subscribe: {
        fromBeginning: false,
      },
      send: {
        // Producer send configuration
        timeout: 30000,
        acks: -1, // Wait for all replicas to acknowledge (strongest durability)
      },
    },
  };

  return {
    // Main Kafka configuration
    config: kafkaConfig,
    
    // Topic definitions
    topics: NOTIFICATION_TOPICS,
    
    // Consumer group definitions
    consumerGroups: CONSUMER_GROUPS,
    
    // Topic mapping by journey
    journeyTopics: JOURNEY_NOTIFICATION_TOPICS,
    
    // Topic mapping by event type
    eventTopics: NOTIFICATION_EVENT_TOPICS,
    
    // Broker connection information
    brokers,
  };
});