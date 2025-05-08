import { registerAs } from '@nestjs/config';
import { KafkaConfig } from '@austa/interfaces/common';
import { NotificationEventType } from '@austa/interfaces/notification';

/**
 * Kafka configuration for the Notification Service.
 * 
 * This module provides settings for Kafka event processing including:
 * - Client identification and broker connection details
 * - Topic configuration for different notification types and journeys
 * - Consumer group configuration for proper message distribution
 * - Producer settings for reliable notification status publishing
 * - Retry policies with exponential backoff for failed operations
 * - Dead letter queue configuration for unprocessable messages
 * 
 * The notification service consumes events from journey services (Health, Care, Plan)
 * and the gamification engine, processes them according to user preferences and templates,
 * and publishes notification status events back to Kafka for tracking and analytics.
 * 
 * This configuration supports the enhanced notification delivery system with proper
 * event routing, tracking, and retry mechanisms as specified in the technical requirements.
 * 
 * @returns {KafkaConfig} The Kafka configuration object
 */
export const kafkaConfig = registerAs<KafkaConfig>('kafka', () => ({
  // Basic Kafka client configuration
  clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  groupId: process.env.KAFKA_GROUP_ID || 'notification-consumer-group',
  
  // Topic configuration for all notification-related events
  topics: {
    // Input topics - events consumed by the notification service from journey services
    healthNotifications: process.env.KAFKA_TOPIC_HEALTH_NOTIFICATIONS || 'health.notifications',
    careNotifications: process.env.KAFKA_TOPIC_CARE_NOTIFICATIONS || 'care.notifications',
    planNotifications: process.env.KAFKA_TOPIC_PLAN_NOTIFICATIONS || 'plan.notifications',
    
    // Gamification events that trigger notifications (achievements, level-ups, etc.)
    gamificationNotifications: process.env.KAFKA_TOPIC_GAMIFICATION_NOTIFICATIONS || 'gamification.notifications',
    achievementEvents: process.env.KAFKA_TOPIC_ACHIEVEMENT_EVENTS || 'gamification.achievements',
    questEvents: process.env.KAFKA_TOPIC_QUEST_EVENTS || 'gamification.quests',
    rewardEvents: process.env.KAFKA_TOPIC_REWARD_EVENTS || 'gamification.rewards',
    
    // Output topics - events published by the notification service for tracking and analytics
    notificationStatus: process.env.KAFKA_TOPIC_NOTIFICATION_STATUS || 'notification.status',
    notificationDelivery: process.env.KAFKA_TOPIC_NOTIFICATION_DELIVERY || 'notification.delivery',
    notificationRead: process.env.KAFKA_TOPIC_NOTIFICATION_READ || 'notification.read',
    
    // Dead letter queue topics for failed notification processing
    deadLetterQueue: process.env.KAFKA_TOPIC_DLQ || 'notification.dlq',
    healthDlq: process.env.KAFKA_TOPIC_HEALTH_DLQ || 'health.notifications.dlq',
    careDlq: process.env.KAFKA_TOPIC_CARE_DLQ || 'care.notifications.dlq',
    planDlq: process.env.KAFKA_TOPIC_PLAN_DLQ || 'plan.notifications.dlq',
    gamificationDlq: process.env.KAFKA_TOPIC_GAMIFICATION_DLQ || 'gamification.notifications.dlq',
  },
  
  // Event type mapping to ensure proper routing of notification events
  eventTypes: {
    // Health journey notification event types
    healthMetricRecorded: NotificationEventType.HEALTH_METRIC_RECORDED,
    healthGoalAchieved: NotificationEventType.HEALTH_GOAL_ACHIEVED,
    deviceConnected: NotificationEventType.DEVICE_CONNECTED,
    healthInsightGenerated: NotificationEventType.HEALTH_INSIGHT_GENERATED,
    
    // Care journey notification event types
    appointmentReminder: NotificationEventType.APPOINTMENT_REMINDER,
    appointmentConfirmed: NotificationEventType.APPOINTMENT_CONFIRMED,
    medicationReminder: NotificationEventType.MEDICATION_REMINDER,
    telemedicineSessionStarting: NotificationEventType.TELEMEDICINE_SESSION_STARTING,
    
    // Plan journey notification event types
    claimStatusUpdated: NotificationEventType.CLAIM_STATUS_UPDATED,
    benefitUtilized: NotificationEventType.BENEFIT_UTILIZED,
    planRenewalReminder: NotificationEventType.PLAN_RENEWAL_REMINDER,
    
    // Gamification notification event types
    achievementUnlocked: NotificationEventType.ACHIEVEMENT_UNLOCKED,
    questCompleted: NotificationEventType.QUEST_COMPLETED,
    levelUp: NotificationEventType.LEVEL_UP,
    rewardEarned: NotificationEventType.REWARD_EARNED,
  },
  
  // Retry configuration with exponential backoff
  retry: {
    maxRetries: parseInt(process.env.KAFKA_MAX_RETRIES, 10) || 3,
    initialRetryInterval: parseInt(process.env.KAFKA_INITIAL_RETRY_INTERVAL, 10) || 1000,
    maxRetryInterval: parseInt(process.env.KAFKA_MAX_RETRY_INTERVAL, 10) || 30000,
    retryFactor: parseFloat(process.env.KAFKA_RETRY_FACTOR) || 2.0,
    retryWithJitter: process.env.KAFKA_RETRY_WITH_JITTER === 'true' || true,
  },
  
  // Consumer configuration for reliable message processing
  consumer: {
    groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'notification-consumer-group',
    allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION === 'true' || false,
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT, 10) || 30000,
    heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL, 10) || 3000,
    maxWaitTimeInMs: parseInt(process.env.KAFKA_MAX_WAIT_TIME, 10) || 5000,
    maxBytesPerPartition: parseInt(process.env.KAFKA_MAX_BYTES_PER_PARTITION, 10) || 1048576, // 1MB
    autoCommit: process.env.KAFKA_AUTO_COMMIT === 'true' || true,
    autoCommitInterval: parseInt(process.env.KAFKA_AUTO_COMMIT_INTERVAL, 10) || 5000,
    autoCommitThreshold: parseInt(process.env.KAFKA_AUTO_COMMIT_THRESHOLD, 10) || 100,
    fetchMinBytes: parseInt(process.env.KAFKA_FETCH_MIN_BYTES, 10) || 1,
    fetchMaxBytes: parseInt(process.env.KAFKA_FETCH_MAX_BYTES, 10) || 1048576, // 1MB
    maxInFlightRequests: parseInt(process.env.KAFKA_CONSUMER_MAX_IN_FLIGHT, 10) || 1,
    readUncommitted: process.env.KAFKA_READ_UNCOMMITTED === 'true' || false,
  },
  
  // Producer configuration for reliable notification status publishing
  producer: {
    allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION === 'true' || false,
    idempotent: process.env.KAFKA_PRODUCER_IDEMPOTENT === 'true' || true,
    transactionalId: process.env.KAFKA_TRANSACTIONAL_ID || 'notification-producer-tx',
    maxInFlightRequests: parseInt(process.env.KAFKA_MAX_IN_FLIGHT_REQUESTS, 10) || 5,
    messageTimeout: parseInt(process.env.KAFKA_MESSAGE_TIMEOUT, 10) || 30000,
    compression: process.env.KAFKA_COMPRESSION_TYPE || 'gzip',
    acks: parseInt(process.env.KAFKA_ACKS, 10) || -1, // -1 = all brokers acknowledge
    retries: parseInt(process.env.KAFKA_PRODUCER_RETRIES, 10) || 5,
    batchSize: parseInt(process.env.KAFKA_BATCH_SIZE, 10) || 16384, // 16KB
    linger: parseInt(process.env.KAFKA_LINGER_MS, 10) || 5, // 5ms batch delay
  },
  
  // Schema validation configuration
  schemaValidation: {
    enabled: process.env.KAFKA_SCHEMA_VALIDATION === 'true' || true,
    strictMode: process.env.KAFKA_SCHEMA_STRICT_MODE === 'true' || false,
    logErrors: process.env.KAFKA_SCHEMA_LOG_ERRORS === 'true' || true,
  },
}));