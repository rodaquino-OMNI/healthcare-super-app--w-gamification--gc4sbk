/**
 * @file kafka.constants.ts
 * @description Defines constants used in Kafka integration across the AUSTA SuperApp.
 * This file centralizes all Kafka-related constants to ensure consistency across services.
 */

/**
 * Namespace for Kafka topic name constants.
 * These constants define the standard topic names used across all services.
 */
export namespace KafkaTopics {
  /** Base prefix for all AUSTA SuperApp topics */
  export const PREFIX = 'austa';

  /** Separator used in topic names */
  export const SEPARATOR = '.';

  /**
   * Builds a fully qualified topic name with the standard prefix and separators
   * @param parts - Topic name parts to join
   * @returns Fully qualified topic name
   */
  export const buildTopicName = (...parts: string[]): string => 
    [PREFIX, ...parts].join(SEPARATOR);

  /**
   * Health journey related topics
   */
  export namespace Health {
    /** Base prefix for all health journey topics */
    export const PREFIX = 'health';
    
    /** Topic for health metric recording events */
    export const METRICS = buildTopicName(PREFIX, 'metrics');
    
    /** Topic for health goal events */
    export const GOALS = buildTopicName(PREFIX, 'goals');
    
    /** Topic for health device connection events */
    export const DEVICES = buildTopicName(PREFIX, 'devices');
    
    /** Topic for health insights generation events */
    export const INSIGHTS = buildTopicName(PREFIX, 'insights');
  }

  /**
   * Care journey related topics
   */
  export namespace Care {
    /** Base prefix for all care journey topics */
    export const PREFIX = 'care';
    
    /** Topic for appointment booking events */
    export const APPOINTMENTS = buildTopicName(PREFIX, 'appointments');
    
    /** Topic for medication adherence events */
    export const MEDICATIONS = buildTopicName(PREFIX, 'medications');
    
    /** Topic for telemedicine session events */
    export const TELEMEDICINE = buildTopicName(PREFIX, 'telemedicine');
    
    /** Topic for care plan progress events */
    export const CARE_PLANS = buildTopicName(PREFIX, 'care-plans');
  }

  /**
   * Plan journey related topics
   */
  export namespace Plan {
    /** Base prefix for all plan journey topics */
    export const PREFIX = 'plan';
    
    /** Topic for claim submission events */
    export const CLAIMS = buildTopicName(PREFIX, 'claims');
    
    /** Topic for benefit utilization events */
    export const BENEFITS = buildTopicName(PREFIX, 'benefits');
    
    /** Topic for plan selection and comparison events */
    export const PLANS = buildTopicName(PREFIX, 'plans');
    
    /** Topic for reward redemption events */
    export const REWARDS = buildTopicName(PREFIX, 'rewards');
  }

  /**
   * Gamification related topics
   */
  export namespace Gamification {
    /** Base prefix for all gamification topics */
    export const PREFIX = 'gamification';
    
    /** Topic for achievement events */
    export const ACHIEVEMENTS = buildTopicName(PREFIX, 'achievements');
    
    /** Topic for quest events */
    export const QUESTS = buildTopicName(PREFIX, 'quests');
    
    /** Topic for reward events */
    export const REWARDS = buildTopicName(PREFIX, 'rewards');
    
    /** Topic for leaderboard events */
    export const LEADERBOARDS = buildTopicName(PREFIX, 'leaderboards');
    
    /** Topic for XP and level events */
    export const XP = buildTopicName(PREFIX, 'xp');
  }

  /**
   * Notification related topics
   */
  export namespace Notification {
    /** Base prefix for all notification topics */
    export const PREFIX = 'notification';
    
    /** Topic for notification requests */
    export const REQUESTS = buildTopicName(PREFIX, 'requests');
    
    /** Topic for notification status updates */
    export const STATUS = buildTopicName(PREFIX, 'status');
    
    /** Topic for notification preferences updates */
    export const PREFERENCES = buildTopicName(PREFIX, 'preferences');
  }

  /**
   * Dead Letter Queue (DLQ) topics for failed message processing
   */
  export namespace DeadLetterQueue {
    /** Base prefix for all DLQ topics */
    export const PREFIX = 'dlq';
    
    /**
     * Builds a DLQ topic name for a given source topic
     * @param sourceTopic - Original topic name
     * @returns DLQ topic name
     */
    export const buildDlqTopicName = (sourceTopic: string): string =>
      buildTopicName(PREFIX, sourceTopic.replace(new RegExp(`^${KafkaTopics.PREFIX}\${SEPARATOR}`), ''));
  }
}

/**
 * Namespace for Kafka consumer group ID constants.
 * These constants define the standard consumer group IDs used across all services.
 */
export namespace KafkaConsumerGroups {
  /** Base prefix for all AUSTA SuperApp consumer groups */
  export const PREFIX = 'austa';

  /** Separator used in consumer group IDs */
  export const SEPARATOR = '-';

  /**
   * Builds a fully qualified consumer group ID with the standard prefix and separators
   * @param parts - Consumer group ID parts to join
   * @returns Fully qualified consumer group ID
   */
  export const buildConsumerGroupId = (...parts: string[]): string => 
    [PREFIX, ...parts].join(SEPARATOR);

  /**
   * Health service consumer groups
   */
  export namespace Health {
    /** Base prefix for all health service consumer groups */
    export const PREFIX = 'health-service';
    
    /** Consumer group for processing gamification events */
    export const GAMIFICATION = buildConsumerGroupId(PREFIX, 'gamification');
    
    /** Consumer group for processing notification events */
    export const NOTIFICATIONS = buildConsumerGroupId(PREFIX, 'notifications');
  }

  /**
   * Care service consumer groups
   */
  export namespace Care {
    /** Base prefix for all care service consumer groups */
    export const PREFIX = 'care-service';
    
    /** Consumer group for processing gamification events */
    export const GAMIFICATION = buildConsumerGroupId(PREFIX, 'gamification');
    
    /** Consumer group for processing notification events */
    export const NOTIFICATIONS = buildConsumerGroupId(PREFIX, 'notifications');
  }

  /**
   * Plan service consumer groups
   */
  export namespace Plan {
    /** Base prefix for all plan service consumer groups */
    export const PREFIX = 'plan-service';
    
    /** Consumer group for processing gamification events */
    export const GAMIFICATION = buildConsumerGroupId(PREFIX, 'gamification');
    
    /** Consumer group for processing notification events */
    export const NOTIFICATIONS = buildConsumerGroupId(PREFIX, 'notifications');
  }

  /**
   * Gamification engine consumer groups
   */
  export namespace Gamification {
    /** Base prefix for all gamification engine consumer groups */
    export const PREFIX = 'gamification-engine';
    
    /** Consumer group for processing health journey events */
    export const HEALTH = buildConsumerGroupId(PREFIX, 'health');
    
    /** Consumer group for processing care journey events */
    export const CARE = buildConsumerGroupId(PREFIX, 'care');
    
    /** Consumer group for processing plan journey events */
    export const PLAN = buildConsumerGroupId(PREFIX, 'plan');
  }

  /**
   * Notification service consumer groups
   */
  export namespace Notification {
    /** Base prefix for all notification service consumer groups */
    export const PREFIX = 'notification-service';
    
    /** Consumer group for processing health journey events */
    export const HEALTH = buildConsumerGroupId(PREFIX, 'health');
    
    /** Consumer group for processing care journey events */
    export const CARE = buildConsumerGroupId(PREFIX, 'care');
    
    /** Consumer group for processing plan journey events */
    export const PLAN = buildConsumerGroupId(PREFIX, 'plan');
    
    /** Consumer group for processing gamification events */
    export const GAMIFICATION = buildConsumerGroupId(PREFIX, 'gamification');
  }

  /**
   * Dead Letter Queue (DLQ) consumer groups
   */
  export namespace DeadLetterQueue {
    /** Base prefix for all DLQ consumer groups */
    export const PREFIX = 'dlq';
    
    /**
     * Builds a DLQ consumer group ID for a given source consumer group
     * @param sourceGroup - Original consumer group ID
     * @returns DLQ consumer group ID
     */
    export const buildDlqConsumerGroupId = (sourceGroup: string): string =>
      buildConsumerGroupId(PREFIX, sourceGroup.replace(new RegExp(`^${KafkaConsumerGroups.PREFIX}${SEPARATOR}`), ''));
  }
}

/**
 * Namespace for Kafka configuration constants.
 * These constants define standard configuration values used across all services.
 */
export namespace KafkaConfig {
  /**
   * Default partition count for topics
   * This value can be overridden in environment-specific configurations
   */
  export const DEFAULT_PARTITIONS = 3;

  /**
   * Default replication factor for topics
   * This value can be overridden in environment-specific configurations
   */
  export const DEFAULT_REPLICATION_FACTOR = 3;

  /**
   * Default session timeout in milliseconds
   * This value can be overridden in environment-specific configurations
   */
  export const DEFAULT_SESSION_TIMEOUT = 30000; // 30 seconds

  /**
   * Default heartbeat interval in milliseconds
   * This value can be overridden in environment-specific configurations
   */
  export const DEFAULT_HEARTBEAT_INTERVAL = 3000; // 3 seconds

  /**
   * Default connection timeout in milliseconds
   * This value can be overridden in environment-specific configurations
   */
  export const DEFAULT_CONNECTION_TIMEOUT = 5000; // 5 seconds

  /**
   * Default message max bytes
   * This value can be overridden in environment-specific configurations
   */
  export const DEFAULT_MAX_BYTES = 1048576; // 1MB

  /**
   * Environment variable names for Kafka configuration
   */
  export namespace EnvVars {
    /** Environment variable for Kafka broker list */
    export const KAFKA_BROKERS = 'KAFKA_BROKERS';

    /** Environment variable for Kafka client ID */
    export const KAFKA_CLIENT_ID = 'KAFKA_CLIENT_ID';

    /** Environment variable for Kafka SSL enabled flag */
    export const KAFKA_SSL_ENABLED = 'KAFKA_SSL_ENABLED';

    /** Environment variable for Kafka SASL enabled flag */
    export const KAFKA_SASL_ENABLED = 'KAFKA_SASL_ENABLED';

    /** Environment variable for Kafka SASL username */
    export const KAFKA_SASL_USERNAME = 'KAFKA_SASL_USERNAME';

    /** Environment variable for Kafka SASL password */
    export const KAFKA_SASL_PASSWORD = 'KAFKA_SASL_PASSWORD';

    /** Environment variable for Kafka SASL mechanism */
    export const KAFKA_SASL_MECHANISM = 'KAFKA_SASL_MECHANISM';
  }
}

/**
 * Namespace for Kafka retry policy constants.
 * These constants define standard retry settings used across all services.
 */
export namespace KafkaRetryPolicy {
  /**
   * Default maximum number of retries for producer operations
   */
  export const DEFAULT_PRODUCER_MAX_RETRIES = 5;

  /**
   * Default maximum number of retries for consumer operations
   */
  export const DEFAULT_CONSUMER_MAX_RETRIES = 3;

  /**
   * Default initial retry delay in milliseconds
   */
  export const DEFAULT_INITIAL_RETRY_DELAY = 100; // 100ms

  /**
   * Default maximum retry delay in milliseconds
   */
  export const DEFAULT_MAX_RETRY_DELAY = 30000; // 30 seconds

  /**
   * Default retry delay multiplier for exponential backoff
   */
  export const DEFAULT_RETRY_DELAY_MULTIPLIER = 2;

  /**
   * Default retry jitter factor (0-1) to add randomness to retry delays
   */
  export const DEFAULT_RETRY_JITTER = 0.1; // 10% jitter

  /**
   * Default circuit breaker failure threshold
   */
  export const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 5;

  /**
   * Default circuit breaker reset timeout in milliseconds
   */
  export const DEFAULT_CIRCUIT_BREAKER_RESET_TIMEOUT = 60000; // 1 minute
}

/**
 * Namespace for Kafka error code constants.
 * These constants define standard error codes used across all services.
 */
export namespace KafkaErrorCodes {
  /**
   * Error codes for producer operations
   */
  export namespace Producer {
    /** Error code for connection failures */
    export const CONNECTION_ERROR = 'KAFKA_PRODUCER_CONNECTION_ERROR';

    /** Error code for message serialization failures */
    export const SERIALIZATION_ERROR = 'KAFKA_PRODUCER_SERIALIZATION_ERROR';

    /** Error code for message validation failures */
    export const VALIDATION_ERROR = 'KAFKA_PRODUCER_VALIDATION_ERROR';

    /** Error code for message delivery failures */
    export const DELIVERY_ERROR = 'KAFKA_PRODUCER_DELIVERY_ERROR';

    /** Error code for topic not found */
    export const TOPIC_NOT_FOUND = 'KAFKA_PRODUCER_TOPIC_NOT_FOUND';

    /** Error code for message too large */
    export const MESSAGE_TOO_LARGE = 'KAFKA_PRODUCER_MESSAGE_TOO_LARGE';

    /** Error code for circuit breaker open */
    export const CIRCUIT_BREAKER_OPEN = 'KAFKA_PRODUCER_CIRCUIT_BREAKER_OPEN';
  }

  /**
   * Error codes for consumer operations
   */
  export namespace Consumer {
    /** Error code for connection failures */
    export const CONNECTION_ERROR = 'KAFKA_CONSUMER_CONNECTION_ERROR';

    /** Error code for message deserialization failures */
    export const DESERIALIZATION_ERROR = 'KAFKA_CONSUMER_DESERIALIZATION_ERROR';

    /** Error code for message validation failures */
    export const VALIDATION_ERROR = 'KAFKA_CONSUMER_VALIDATION_ERROR';

    /** Error code for message processing failures */
    export const PROCESSING_ERROR = 'KAFKA_CONSUMER_PROCESSING_ERROR';

    /** Error code for topic subscription failures */
    export const SUBSCRIPTION_ERROR = 'KAFKA_CONSUMER_SUBSCRIPTION_ERROR';

    /** Error code for consumer group rebalancing failures */
    export const REBALANCE_ERROR = 'KAFKA_CONSUMER_REBALANCE_ERROR';

    /** Error code for offset commit failures */
    export const COMMIT_ERROR = 'KAFKA_CONSUMER_COMMIT_ERROR';

    /** Error code for circuit breaker open */
    export const CIRCUIT_BREAKER_OPEN = 'KAFKA_CONSUMER_CIRCUIT_BREAKER_OPEN';
  }

  /**
   * Error codes for admin operations
   */
  export namespace Admin {
    /** Error code for topic creation failures */
    export const TOPIC_CREATION_ERROR = 'KAFKA_ADMIN_TOPIC_CREATION_ERROR';

    /** Error code for topic deletion failures */
    export const TOPIC_DELETION_ERROR = 'KAFKA_ADMIN_TOPIC_DELETION_ERROR';

    /** Error code for topic configuration failures */
    export const TOPIC_CONFIG_ERROR = 'KAFKA_ADMIN_TOPIC_CONFIG_ERROR';

    /** Error code for consumer group management failures */
    export const GROUP_MANAGEMENT_ERROR = 'KAFKA_ADMIN_GROUP_MANAGEMENT_ERROR';
  }
}

/**
 * Namespace for Kafka message header key constants.
 * These constants define standard header keys used across all services.
 */
export namespace KafkaHeaders {
  /** Header key for correlation ID */
  export const CORRELATION_ID = 'X-Correlation-ID';

  /** Header key for causation ID */
  export const CAUSATION_ID = 'X-Causation-ID';

  /** Header key for user ID */
  export const USER_ID = 'X-User-ID';

  /** Header key for source service */
  export const SOURCE_SERVICE = 'X-Source-Service';

  /** Header key for source journey */
  export const SOURCE_JOURNEY = 'X-Source-Journey';

  /** Header key for event type */
  export const EVENT_TYPE = 'X-Event-Type';

  /** Header key for event version */
  export const EVENT_VERSION = 'X-Event-Version';

  /** Header key for content type */
  export const CONTENT_TYPE = 'Content-Type';

  /** Header key for timestamp */
  export const TIMESTAMP = 'X-Timestamp';

  /** Header key for retry count */
  export const RETRY_COUNT = 'X-Retry-Count';

  /** Header key for original topic (used in DLQ) */
  export const ORIGINAL_TOPIC = 'X-Original-Topic';

  /** Header key for error code (used in DLQ) */
  export const ERROR_CODE = 'X-Error-Code';

  /** Header key for error message (used in DLQ) */
  export const ERROR_MESSAGE = 'X-Error-Message';
}