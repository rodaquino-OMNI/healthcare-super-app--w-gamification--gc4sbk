import { registerAs } from '@nestjs/config';
import { GamificationEvent, EventType } from '@austa/interfaces/gamification';

/**
 * Configuration for the gamification event processing system.
 * This module manages how events are processed and evaluated against gamification rules,
 * ensuring consistent performance and reliable event handling.
 */
export const eventsConfig = registerAs('events', () => ({
  /**
   * Event processing rate configuration
   * Controls how frequently events are processed from the queue
   */
  processing: {
    // Base rate at which events are processed (in milliseconds)
    baseRate: parseInt(process.env.EVENT_PROCESSING_BASE_RATE, 10) || 1000,
    
    // Journey-specific processing rates (can be adjusted for different event volumes)
    journeyRates: {
      health: parseInt(process.env.HEALTH_EVENT_PROCESSING_RATE, 10) || 1000,
      care: parseInt(process.env.CARE_EVENT_PROCESSING_RATE, 10) || 1000,
      plan: parseInt(process.env.PLAN_EVENT_PROCESSING_RATE, 10) || 1000,
    },
    
    // Maximum number of events to process in a single batch
    batchSize: parseInt(process.env.EVENT_BATCH_SIZE, 10) || 100,
    
    // Maximum number of concurrent batches to process
    maxConcurrentBatches: parseInt(process.env.MAX_CONCURRENT_BATCHES, 10) || 3,
    
    // Interval at which to refresh rules from the database (in milliseconds)
    rulesRefreshInterval: parseInt(process.env.RULES_REFRESH_INTERVAL, 10) || 60000, // 1 minute
  },
  
  /**
   * Event retry configuration
   * Controls how failed events are retried
   */
  retry: {
    // Maximum number of retry attempts for failed events
    maxRetries: parseInt(process.env.EVENT_MAX_RETRIES, 10) || 3,
    
    // Base delay between retry attempts (in milliseconds)
    baseDelay: parseInt(process.env.EVENT_RETRY_BASE_DELAY, 10) || 1000,
    
    // Factor by which to increase delay on each retry attempt
    backoffFactor: parseFloat(process.env.EVENT_RETRY_BACKOFF_FACTOR) || 2.0,
    
    // Maximum delay between retry attempts (in milliseconds)
    maxDelay: parseInt(process.env.EVENT_RETRY_MAX_DELAY, 10) || 30000, // 30 seconds
  },
  
  /**
   * Dead letter queue configuration
   * Controls how permanently failed events are handled
   */
  deadLetterQueue: {
    // Whether to enable the dead letter queue
    enabled: process.env.DLQ_ENABLED !== 'false', // Enabled by default
    
    // Topic name for the dead letter queue
    topic: process.env.DLQ_TOPIC || 'gamification.events.dlq',
    
    // Whether to log dead letter queue events
    logging: process.env.DLQ_LOGGING !== 'false', // Enabled by default
  },
  
  /**
   * Event schema validation configuration
   * Controls how events are validated against schemas
   */
  validation: {
    // Whether to enable schema validation for events
    enabled: process.env.EVENT_VALIDATION_ENABLED !== 'false', // Enabled by default
    
    // Whether to reject events that fail validation
    rejectInvalid: process.env.REJECT_INVALID_EVENTS !== 'false', // Enabled by default
    
    // Whether to log validation errors
    logErrors: process.env.LOG_VALIDATION_ERRORS !== 'false', // Enabled by default
  },
  
  /**
   * Event versioning configuration
   * Controls how different versions of event schemas are handled
   */
  versioning: {
    // Default version to use for events without a version
    defaultVersion: process.env.DEFAULT_EVENT_VERSION || '1.0',
    
    // Minimum supported version
    minVersion: process.env.MIN_EVENT_VERSION || '1.0',
    
    // Latest supported version
    latestVersion: process.env.LATEST_EVENT_VERSION || '1.0',
    
    // Whether to reject events with unsupported versions
    rejectUnsupported: process.env.REJECT_UNSUPPORTED_VERSIONS === 'true', // Disabled by default
  },
  
  /**
   * Event type configuration
   * Maps event types to their processing priorities
   */
  eventTypes: {
    // Priority levels for different event types (higher number = higher priority)
    priorities: {
      [EventType.HEALTH_METRIC_RECORDED]: 5,
      [EventType.HEALTH_GOAL_COMPLETED]: 8,
      [EventType.HEALTH_DEVICE_CONNECTED]: 3,
      
      [EventType.CARE_APPOINTMENT_BOOKED]: 5,
      [EventType.CARE_APPOINTMENT_ATTENDED]: 8,
      [EventType.CARE_MEDICATION_TAKEN]: 6,
      
      [EventType.PLAN_CLAIM_SUBMITTED]: 5,
      [EventType.PLAN_BENEFIT_USED]: 4,
      [EventType.PLAN_DOCUMENT_UPLOADED]: 3,
      
      [EventType.USER_PROFILE_UPDATED]: 2,
      [EventType.USER_LOGIN]: 1,
      
      // Default priority for events not explicitly listed
      default: 1,
    },
    
    // Rate limits for different event types (events per minute)
    rateLimits: {
      [EventType.HEALTH_METRIC_RECORDED]: 1000,
      [EventType.HEALTH_GOAL_COMPLETED]: 500,
      [EventType.HEALTH_DEVICE_CONNECTED]: 200,
      
      [EventType.CARE_APPOINTMENT_BOOKED]: 300,
      [EventType.CARE_APPOINTMENT_ATTENDED]: 300,
      [EventType.CARE_MEDICATION_TAKEN]: 500,
      
      [EventType.PLAN_CLAIM_SUBMITTED]: 300,
      [EventType.PLAN_BENEFIT_USED]: 300,
      [EventType.PLAN_DOCUMENT_UPLOADED]: 200,
      
      [EventType.USER_PROFILE_UPDATED]: 100,
      [EventType.USER_LOGIN]: 1000,
      
      // Default rate limit for events not explicitly listed
      default: 500,
    },
  },
  
  /**
   * Kafka configuration for event processing
   * Controls how events are consumed from Kafka topics
   */
  kafka: {
    // Consumer group ID for the gamification engine
    consumerGroupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'gamification-events-consumer',
    
    // Topics to consume events from
    topics: {
      health: process.env.KAFKA_TOPIC_HEALTH_EVENTS || 'health.events',
      care: process.env.KAFKA_TOPIC_CARE_EVENTS || 'care.events',
      plan: process.env.KAFKA_TOPIC_PLAN_EVENTS || 'plan.events',
      user: process.env.KAFKA_TOPIC_USER_EVENTS || 'user.events',
      game: process.env.KAFKA_TOPIC_GAME_EVENTS || 'game.events',
    },
    
    // Consumer configuration
    consumer: {
      // Maximum number of messages to fetch in a single poll
      maxBatchSize: parseInt(process.env.KAFKA_MAX_BATCH_SIZE, 10) || 500,
      
      // Maximum time to wait for a full batch (in milliseconds)
      maxWaitTimeMs: parseInt(process.env.KAFKA_MAX_WAIT_TIME_MS, 10) || 1000,
      
      // Whether to commit offsets automatically
      autoCommit: process.env.KAFKA_AUTO_COMMIT !== 'false', // Enabled by default
      
      // Interval at which to commit offsets (in milliseconds)
      autoCommitIntervalMs: parseInt(process.env.KAFKA_AUTO_COMMIT_INTERVAL_MS, 10) || 5000,
      
      // Whether to start consuming from the earliest offset
      fromBeginning: process.env.KAFKA_FROM_BEGINNING === 'true', // Disabled by default
    },
  },
}));