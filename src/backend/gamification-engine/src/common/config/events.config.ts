import { registerAs } from '@nestjs/config';
import { EventSchemaVersion } from '@austa/interfaces/gamification';

/**
 * Configuration for the Gamification Engine's event processing system.
 * This module centralizes all event-related configuration settings.
 * 
 * @module EventsConfig
 */
export const eventsConfig = registerAs('events', () => ({
  /**
   * General event processing configuration
   */
  processing: {
    /**
     * Base rate at which events are processed in milliseconds
     * Lower values increase throughput but may impact system resources
     */
    baseRate: parseInt(process.env.EVENT_PROCESSING_RATE, 10) || 1000,
    
    /**
     * Journey-specific processing rates (in milliseconds)
     * Allows prioritization of certain event types
     */
    journeyRates: {
      health: parseInt(process.env.HEALTH_EVENT_PROCESSING_RATE, 10) || 800,
      care: parseInt(process.env.CARE_EVENT_PROCESSING_RATE, 10) || 1000,
      plan: parseInt(process.env.PLAN_EVENT_PROCESSING_RATE, 10) || 1200,
    },
    
    /**
     * Number of events to process in a single batch
     */
    batchSize: parseInt(process.env.EVENT_BATCH_SIZE, 10) || 100,
    
    /**
     * Maximum number of concurrent batches to process
     */
    maxConcurrentBatches: parseInt(process.env.MAX_CONCURRENT_BATCHES, 10) || 3,
    
    /**
     * Timeout for event processing in milliseconds
     * After this time, event processing will be considered failed
     */
    processingTimeout: parseInt(process.env.EVENT_PROCESSING_TIMEOUT, 10) || 30000,
  },
  
  /**
   * Rule evaluation configuration
   */
  rules: {
    /**
     * How often to refresh rules from the database (in milliseconds)
     */
    refreshInterval: parseInt(process.env.RULES_REFRESH_INTERVAL, 10) || 60000, // 1 minute
    
    /**
     * Maximum number of rules to evaluate concurrently
     */
    maxConcurrentEvaluations: parseInt(process.env.MAX_CONCURRENT_RULE_EVALUATIONS, 10) || 10,
    
    /**
     * Whether to cache rule evaluation results
     */
    cacheResults: process.env.CACHE_RULE_RESULTS !== 'false', // Enabled by default
    
    /**
     * TTL for cached rule evaluation results (in seconds)
     */
    cacheResultsTtl: parseInt(process.env.RULE_RESULTS_CACHE_TTL, 10) || 300, // 5 minutes
  },
  
  /**
   * Retry strategy configuration for failed event processing
   */
  retry: {
    /**
     * Maximum number of retry attempts for failed event processing
     */
    maxAttempts: parseInt(process.env.EVENT_MAX_RETRY_ATTEMPTS, 10) || 3,
    
    /**
     * Initial retry delay in milliseconds
     */
    initialDelay: parseInt(process.env.EVENT_RETRY_INITIAL_DELAY, 10) || 1000,
    
    /**
     * Factor by which to increase delay on each retry attempt
     */
    backoffFactor: parseFloat(process.env.EVENT_RETRY_BACKOFF_FACTOR) || 2.0,
    
    /**
     * Maximum delay between retries in milliseconds
     */
    maxDelay: parseInt(process.env.EVENT_RETRY_MAX_DELAY, 10) || 60000, // 1 minute
    
    /**
     * Whether to add jitter to retry delays to prevent thundering herd problems
     */
    useJitter: process.env.EVENT_RETRY_USE_JITTER !== 'false', // Enabled by default
  },
  
  /**
   * Dead letter queue configuration for events that fail processing
   */
  deadLetterQueue: {
    /**
     * Whether to enable the dead letter queue
     */
    enabled: process.env.DLQ_ENABLED !== 'false', // Enabled by default
    
    /**
     * Kafka topic for the dead letter queue
     */
    topic: process.env.DLQ_TOPIC || 'gamification.events.dlq',
    
    /**
     * Whether to include the full event payload in the dead letter queue
     */
    includePayload: process.env.DLQ_INCLUDE_PAYLOAD !== 'false', // Enabled by default
    
    /**
     * Whether to automatically retry processing events from the dead letter queue
     */
    autoRetry: process.env.DLQ_AUTO_RETRY === 'true', // Disabled by default
    
    /**
     * Interval at which to retry processing events from the dead letter queue (in milliseconds)
     */
    retryInterval: parseInt(process.env.DLQ_RETRY_INTERVAL, 10) || 3600000, // 1 hour
  },
  
  /**
   * Event schema versioning configuration
   */
  schema: {
    /**
     * Current version of the event schema
     * This should match the version in @austa/interfaces
     */
    version: process.env.EVENT_SCHEMA_VERSION || EventSchemaVersion.V1,
    
    /**
     * Whether to validate events against the schema
     */
    validateEvents: process.env.VALIDATE_EVENT_SCHEMA !== 'false', // Enabled by default
    
    /**
     * Whether to support legacy event schemas
     */
    supportLegacySchemas: process.env.SUPPORT_LEGACY_EVENT_SCHEMAS === 'true', // Disabled by default
  },
  
  /**
   * Journey-specific event configuration
   */
  journeys: {
    health: {
      /**
       * Kafka topic for health journey events
       */
      topic: process.env.KAFKA_TOPIC_HEALTH_EVENTS || 'health.events',
      
      /**
       * Whether to prioritize processing of health events
       */
      prioritize: process.env.PRIORITIZE_HEALTH_EVENTS === 'true', // Disabled by default
    },
    care: {
      /**
       * Kafka topic for care journey events
       */
      topic: process.env.KAFKA_TOPIC_CARE_EVENTS || 'care.events',
      
      /**
       * Whether to prioritize processing of care events
       */
      prioritize: process.env.PRIORITIZE_CARE_EVENTS === 'true', // Disabled by default
    },
    plan: {
      /**
       * Kafka topic for plan journey events
       */
      topic: process.env.KAFKA_TOPIC_PLAN_EVENTS || 'plan.events',
      
      /**
       * Whether to prioritize processing of plan events
       */
      prioritize: process.env.PRIORITIZE_PLAN_EVENTS === 'true', // Disabled by default
    },
  },
}));