import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig, SASLOptions, logLevel } from 'kafkajs';

/**
 * Interface for Kafka topic configuration
 */
export interface KafkaTopicConfig {
  /** Topic name */
  name: string;
  /** Number of partitions */
  partitions: number;
  /** Replication factor */
  replicationFactor: number;
  /** Topic-specific configuration */
  config?: Record<string, string>;
}

/**
 * Interface for Kafka consumer configuration
 */
export interface KafkaConsumerConfig {
  /** Consumer group ID */
  groupId: string;
  /** Maximum number of bytes to fetch in a single request */
  maxBytes: number;
  /** Maximum wait time for new messages */
  maxWaitTimeInMs: number;
  /** Session timeout */
  sessionTimeout: number;
  /** Heartbeat interval */
  heartbeatInterval: number;
  /** Whether to read from the beginning of the topic */
  fromBeginning: boolean;
  /** Auto commit configuration */
  autoCommit: boolean;
  /** Auto commit interval */
  autoCommitInterval: number;
  /** Maximum number of retries */
  maxRetries: number;
  /** Initial retry time in milliseconds */
  initialRetryTime: number;
  /** Maximum retry time in milliseconds */
  maxRetryTime: number;
  /** Factor for exponential backoff */
  retryFactor: number;
}

/**
 * Interface for Kafka producer configuration
 */
export interface KafkaProducerConfig {
  /** Whether to wait for all replicas to acknowledge writes */
  requireAllAcks: boolean;
  /** Acknowledgment timeout */
  ackTimeout: number;
  /** Maximum number of retries */
  maxRetries: number;
  /** Initial retry time in milliseconds */
  initialRetryTime: number;
  /** Maximum retry time in milliseconds */
  maxRetryTime: number;
  /** Factor for exponential backoff */
  retryFactor: number;
  /** Batch size in bytes */
  batchSize: number;
  /** Compression type */
  compression: 'none' | 'gzip' | 'snappy' | 'lz4';
  /** Linger time in milliseconds */
  lingerMs: number;
}

/**
 * Interface for dead letter queue configuration
 */
export interface DeadLetterQueueConfig {
  /** Whether DLQ is enabled */
  enabled: boolean;
  /** Topic prefix for DLQ topics */
  topicPrefix: string;
  /** Maximum number of retries before sending to DLQ */
  maxRetries: number;
}

/**
 * Interface for journey-specific Kafka configuration
 */
export interface JourneyKafkaConfig {
  /** Topic for events from this journey */
  topic: KafkaTopicConfig;
  /** Consumer group ID for this journey */
  consumerGroup: string;
  /** Dead letter queue topic for this journey */
  deadLetterTopic: KafkaTopicConfig;
}

/**
 * Complete Kafka configuration for the gamification engine
 */
export interface GamificationKafkaConfig {
  /** Client ID for Kafka connection */
  clientId: string;
  /** Broker connection settings */
  brokers: string[];
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
  /** Request timeout in milliseconds */
  requestTimeout: number;
  /** Authentication configuration */
  sasl?: SASLOptions;
  /** SSL configuration */
  ssl: boolean;
  /** Log level */
  logLevel: logLevel;
  /** Consumer configuration */
  consumer: KafkaConsumerConfig;
  /** Producer configuration */
  producer: KafkaProducerConfig;
  /** Dead letter queue configuration */
  deadLetterQueue: DeadLetterQueueConfig;
  /** Health journey configuration */
  healthJourney: JourneyKafkaConfig;
  /** Care journey configuration */
  careJourney: JourneyKafkaConfig;
  /** Plan journey configuration */
  planJourney: JourneyKafkaConfig;
}

/**
 * Service that provides Kafka configuration for the gamification engine
 */
@Injectable()
export class KafkaConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get the Kafka client configuration
   */
  getKafkaConfig(): KafkaConfig {
    const clientId = this.configService.get<string>('KAFKA_CLIENT_ID', 'gamification-engine');
    const brokers = this.getBrokers();
    const ssl = this.configService.get<boolean>('KAFKA_SSL_ENABLED', true);
    const sasl = this.getSaslConfig();
    const connectionTimeout = this.configService.get<number>('KAFKA_CONNECTION_TIMEOUT', 3000);
    const requestTimeout = this.configService.get<number>('KAFKA_REQUEST_TIMEOUT', 30000);
    const logLevel = this.getLogLevel();

    return {
      clientId,
      brokers,
      ssl,
      sasl,
      connectionTimeout,
      requestTimeout,
      logLevel,
    };
  }

  /**
   * Get the complete gamification Kafka configuration
   */
  getGamificationKafkaConfig(): GamificationKafkaConfig {
    return {
      ...this.getKafkaConfig(),
      consumer: this.getConsumerConfig(),
      producer: this.getProducerConfig(),
      deadLetterQueue: this.getDeadLetterQueueConfig(),
      healthJourney: this.getHealthJourneyConfig(),
      careJourney: this.getCareJourneyConfig(),
      planJourney: this.getPlanJourneyConfig(),
    };
  }

  /**
   * Get the Kafka brokers from environment variables
   */
  private getBrokers(): string[] {
    const brokersString = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092');
    return brokersString.split(',').map(broker => broker.trim());
  }

  /**
   * Get the SASL configuration if enabled
   */
  private getSaslConfig(): SASLOptions | undefined {
    const saslEnabled = this.configService.get<boolean>('KAFKA_SASL_ENABLED', false);
    
    if (!saslEnabled) {
      return undefined;
    }

    const mechanism = this.configService.get<string>('KAFKA_SASL_MECHANISM', 'plain');
    const username = this.configService.get<string>('KAFKA_SASL_USERNAME', '');
    const password = this.configService.get<string>('KAFKA_SASL_PASSWORD', '');

    if (!username || !password) {
      throw new Error('KAFKA_SASL_USERNAME and KAFKA_SASL_PASSWORD must be provided when SASL is enabled');
    }

    return {
      mechanism: mechanism as any,
      username,
      password,
    };
  }

  /**
   * Get the log level based on the environment
   */
  private getLogLevel(): logLevel {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    
    switch (environment) {
      case 'production':
        return logLevel.ERROR;
      case 'staging':
        return logLevel.WARN;
      case 'development':
      default:
        return logLevel.INFO;
    }
  }

  /**
   * Get the consumer configuration
   */
  private getConsumerConfig(): KafkaConsumerConfig {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    
    // Base configuration
    const config: KafkaConsumerConfig = {
      groupId: this.configService.get<string>('KAFKA_CONSUMER_GROUP_ID', 'gamification-engine'),
      maxBytes: this.configService.get<number>('KAFKA_CONSUMER_MAX_BYTES', 1048576), // 1MB
      maxWaitTimeInMs: this.configService.get<number>('KAFKA_CONSUMER_MAX_WAIT_TIME', 500),
      sessionTimeout: this.configService.get<number>('KAFKA_CONSUMER_SESSION_TIMEOUT', 30000),
      heartbeatInterval: this.configService.get<number>('KAFKA_CONSUMER_HEARTBEAT_INTERVAL', 3000),
      fromBeginning: this.configService.get<boolean>('KAFKA_CONSUMER_FROM_BEGINNING', false),
      autoCommit: this.configService.get<boolean>('KAFKA_CONSUMER_AUTO_COMMIT', true),
      autoCommitInterval: this.configService.get<number>('KAFKA_CONSUMER_AUTO_COMMIT_INTERVAL', 5000),
      maxRetries: this.configService.get<number>('KAFKA_CONSUMER_MAX_RETRIES', 10),
      initialRetryTime: this.configService.get<number>('KAFKA_CONSUMER_INITIAL_RETRY_TIME', 300),
      maxRetryTime: this.configService.get<number>('KAFKA_CONSUMER_MAX_RETRY_TIME', 30000),
      retryFactor: this.configService.get<number>('KAFKA_CONSUMER_RETRY_FACTOR', 2),
    };

    // Environment-specific overrides
    switch (environment) {
      case 'production':
        return {
          ...config,
          maxRetries: 15,
          maxWaitTimeInMs: 300,
          sessionTimeout: 45000,
          heartbeatInterval: 5000,
        };
      case 'staging':
        return {
          ...config,
          maxRetries: 12,
          maxWaitTimeInMs: 400,
          sessionTimeout: 40000,
          heartbeatInterval: 4000,
        };
      case 'development':
      default:
        return config;
    }
  }

  /**
   * Get the producer configuration
   */
  private getProducerConfig(): KafkaProducerConfig {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    
    // Base configuration
    const config: KafkaProducerConfig = {
      requireAllAcks: this.configService.get<boolean>('KAFKA_PRODUCER_REQUIRE_ACKS', true),
      ackTimeout: this.configService.get<number>('KAFKA_PRODUCER_ACK_TIMEOUT', 30000),
      maxRetries: this.configService.get<number>('KAFKA_PRODUCER_MAX_RETRIES', 5),
      initialRetryTime: this.configService.get<number>('KAFKA_PRODUCER_INITIAL_RETRY_TIME', 300),
      maxRetryTime: this.configService.get<number>('KAFKA_PRODUCER_MAX_RETRY_TIME', 30000),
      retryFactor: this.configService.get<number>('KAFKA_PRODUCER_RETRY_FACTOR', 2),
      batchSize: this.configService.get<number>('KAFKA_PRODUCER_BATCH_SIZE', 16384), // 16KB
      compression: this.configService.get<'none' | 'gzip' | 'snappy' | 'lz4'>('KAFKA_PRODUCER_COMPRESSION', 'snappy'),
      lingerMs: this.configService.get<number>('KAFKA_PRODUCER_LINGER_MS', 5),
    };

    // Environment-specific overrides
    switch (environment) {
      case 'production':
        return {
          ...config,
          requireAllAcks: true,
          maxRetries: 8,
          batchSize: 32768, // 32KB
          compression: 'snappy',
          lingerMs: 10,
        };
      case 'staging':
        return {
          ...config,
          requireAllAcks: true,
          maxRetries: 6,
          batchSize: 24576, // 24KB
          compression: 'snappy',
          lingerMs: 8,
        };
      case 'development':
      default:
        return config;
    }
  }

  /**
   * Get the dead letter queue configuration
   */
  private getDeadLetterQueueConfig(): DeadLetterQueueConfig {
    return {
      enabled: this.configService.get<boolean>('KAFKA_DLQ_ENABLED', true),
      topicPrefix: this.configService.get<string>('KAFKA_DLQ_TOPIC_PREFIX', 'dlq-'),
      maxRetries: this.configService.get<number>('KAFKA_DLQ_MAX_RETRIES', 5),
    };
  }

  /**
   * Get the Health journey configuration
   */
  private getHealthJourneyConfig(): JourneyKafkaConfig {
    return {
      topic: {
        name: this.configService.get<string>('KAFKA_HEALTH_TOPIC', 'health-events'),
        partitions: this.configService.get<number>('KAFKA_HEALTH_PARTITIONS', 6),
        replicationFactor: this.configService.get<number>('KAFKA_HEALTH_REPLICATION_FACTOR', 3),
        config: {
          'cleanup.policy': 'delete',
          'retention.ms': '604800000', // 7 days
          'segment.bytes': '107374182', // 100MB
        },
      },
      consumerGroup: this.configService.get<string>('KAFKA_HEALTH_CONSUMER_GROUP', 'gamification-health-consumer'),
      deadLetterTopic: {
        name: this.configService.get<string>('KAFKA_HEALTH_DLQ_TOPIC', 'dlq-health-events'),
        partitions: this.configService.get<number>('KAFKA_HEALTH_DLQ_PARTITIONS', 3),
        replicationFactor: this.configService.get<number>('KAFKA_HEALTH_DLQ_REPLICATION_FACTOR', 3),
        config: {
          'cleanup.policy': 'compact,delete',
          'retention.ms': '2592000000', // 30 days
          'segment.bytes': '107374182', // 100MB
        },
      },
    };
  }

  /**
   * Get the Care journey configuration
   */
  private getCareJourneyConfig(): JourneyKafkaConfig {
    return {
      topic: {
        name: this.configService.get<string>('KAFKA_CARE_TOPIC', 'care-events'),
        partitions: this.configService.get<number>('KAFKA_CARE_PARTITIONS', 6),
        replicationFactor: this.configService.get<number>('KAFKA_CARE_REPLICATION_FACTOR', 3),
        config: {
          'cleanup.policy': 'delete',
          'retention.ms': '604800000', // 7 days
          'segment.bytes': '107374182', // 100MB
        },
      },
      consumerGroup: this.configService.get<string>('KAFKA_CARE_CONSUMER_GROUP', 'gamification-care-consumer'),
      deadLetterTopic: {
        name: this.configService.get<string>('KAFKA_CARE_DLQ_TOPIC', 'dlq-care-events'),
        partitions: this.configService.get<number>('KAFKA_CARE_DLQ_PARTITIONS', 3),
        replicationFactor: this.configService.get<number>('KAFKA_CARE_DLQ_REPLICATION_FACTOR', 3),
        config: {
          'cleanup.policy': 'compact,delete',
          'retention.ms': '2592000000', // 30 days
          'segment.bytes': '107374182', // 100MB
        },
      },
    };
  }

  /**
   * Get the Plan journey configuration
   */
  private getPlanJourneyConfig(): JourneyKafkaConfig {
    return {
      topic: {
        name: this.configService.get<string>('KAFKA_PLAN_TOPIC', 'plan-events'),
        partitions: this.configService.get<number>('KAFKA_PLAN_PARTITIONS', 6),
        replicationFactor: this.configService.get<number>('KAFKA_PLAN_REPLICATION_FACTOR', 3),
        config: {
          'cleanup.policy': 'delete',
          'retention.ms': '604800000', // 7 days
          'segment.bytes': '107374182', // 100MB
        },
      },
      consumerGroup: this.configService.get<string>('KAFKA_PLAN_CONSUMER_GROUP', 'gamification-plan-consumer'),
      deadLetterTopic: {
        name: this.configService.get<string>('KAFKA_PLAN_DLQ_TOPIC', 'dlq-plan-events'),
        partitions: this.configService.get<number>('KAFKA_PLAN_DLQ_PARTITIONS', 3),
        replicationFactor: this.configService.get<number>('KAFKA_PLAN_DLQ_REPLICATION_FACTOR', 3),
        config: {
          'cleanup.policy': 'compact,delete',
          'retention.ms': '2592000000', // 30 days
          'segment.bytes': '107374182', // 100MB
        },
      },
    };
  }
}