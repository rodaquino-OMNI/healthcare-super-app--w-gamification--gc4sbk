/**
 * @file kafka.constants.ts
 * @description Defines constants used in Kafka integration, including default topic names, error codes,
 * retry settings, and consumer group names. This centralized constants file ensures consistency
 * across all services using Kafka.
 */

import { RetryPolicy, KafkaErrorType, EventProcessingStatus } from './kafka.types';
import { DEFAULT_CONSUMER_GROUPS, DEFAULT_RETRY_SETTINGS, DEFAULT_TIMEOUTS_MS, DEFAULT_BATCH_SIZES } from '../constants/config.constants';
import { VERSIONED_TOPICS, DLQ_TOPICS, RETRY_TOPICS, CONSUMER_GROUPS } from '../constants/topics.constants';
import { EVENT_ERROR_MESSAGES, EVENT_ERROR_SEVERITY } from '../constants/errors.constants';
import { SerializationFormat, CompressionAlgorithm } from '../constants/serialization.constants';
import { HEADERS } from '../constants/headers.constants';

// -----------------------------------------------------------------------------
// Kafka Client Configuration Constants
// -----------------------------------------------------------------------------

/**
 * Default Kafka client ID prefix
 * Service names will be appended to this prefix
 */
export const KAFKA_CLIENT_ID_PREFIX = 'austa-superapp';

/**
 * Default Kafka broker addresses
 * These can be overridden via environment variables
 */
export const DEFAULT_KAFKA_BROKERS = ['kafka:9092'];

/**
 * Environment variable names for Kafka configuration
 */
export const KAFKA_ENV_VARS = {
  /** Environment variable for Kafka brokers */
  BROKERS: 'KAFKA_BROKERS',
  /** Environment variable for Kafka client ID */
  CLIENT_ID: 'KAFKA_CLIENT_ID',
  /** Environment variable for Kafka consumer group ID */
  CONSUMER_GROUP: 'KAFKA_CONSUMER_GROUP',
  /** Environment variable for Kafka SSL enabled flag */
  SSL_ENABLED: 'KAFKA_SSL_ENABLED',
  /** Environment variable for Kafka SASL enabled flag */
  SASL_ENABLED: 'KAFKA_SASL_ENABLED',
  /** Environment variable for Kafka SASL username */
  SASL_USERNAME: 'KAFKA_SASL_USERNAME',
  /** Environment variable for Kafka SASL password */
  SASL_PASSWORD: 'KAFKA_SASL_PASSWORD',
  /** Environment variable for Kafka SASL mechanism */
  SASL_MECHANISM: 'KAFKA_SASL_MECHANISM',
  /** Environment variable for Kafka topic prefix */
  TOPIC_PREFIX: 'KAFKA_TOPIC_PREFIX',
};

/**
 * Default Kafka client configuration
 */
export const DEFAULT_KAFKA_CLIENT_CONFIG = {
  /** Default client ID */
  clientId: `${KAFKA_CLIENT_ID_PREFIX}-default`,
  /** Default brokers */
  brokers: DEFAULT_KAFKA_BROKERS,
  /** Default connection timeout in milliseconds */
  connectionTimeout: DEFAULT_TIMEOUTS_MS.CONNECTION,
  /** Default request timeout in milliseconds */
  requestTimeout: DEFAULT_TIMEOUTS_MS.STANDARD,
  /** Default retry options */
  retry: {
    initialRetryTime: DEFAULT_RETRY_SETTINGS.INITIAL_DELAY_MS,
    retries: DEFAULT_RETRY_SETTINGS.MAX_ATTEMPTS,
    maxRetryTime: DEFAULT_RETRY_SETTINGS.MAX_DELAY_MS,
    factor: DEFAULT_RETRY_SETTINGS.BACKOFF_FACTOR,
  },
  /** Default SSL configuration (disabled by default) */
  ssl: false,
  /** Default SASL configuration (disabled by default) */
  sasl: undefined,
};

// -----------------------------------------------------------------------------
// Kafka Producer Configuration Constants
// -----------------------------------------------------------------------------

/**
 * Default Kafka producer configuration
 */
export const DEFAULT_PRODUCER_CONFIG = {
  /** Whether to enable idempotent production (exactly-once delivery) */
  idempotent: true,
  /** Acknowledgement level (0 = no ack, 1 = leader ack, -1 = all replicas ack) */
  acks: -1,
  /** Compression type */
  compression: CompressionAlgorithm.GZIP,
  /** Maximum in-flight requests */
  maxInFlightRequests: 5,
  /** Batch size in bytes */
  batchSize: 16384, // 16KB
  /** Batch.linger.ms - how long to wait for batch to fill */
  linger: 5, // 5ms
  /** Request timeout in milliseconds */
  requestTimeout: DEFAULT_TIMEOUTS_MS.STANDARD,
};

/**
 * Default Kafka transaction configuration
 */
export const DEFAULT_TRANSACTION_CONFIG = {
  /** Default transaction timeout in milliseconds */
  timeout: 60000, // 1 minute
  /** Default transaction ID prefix */
  idPrefix: 'tx-',
};

// -----------------------------------------------------------------------------
// Kafka Consumer Configuration Constants
// -----------------------------------------------------------------------------

/**
 * Default Kafka consumer configuration
 */
export const DEFAULT_CONSUMER_CONFIG = {
  /** Default group ID */
  groupId: DEFAULT_CONSUMER_GROUPS.API_GATEWAY,
  /** Whether to consume from the beginning of the topic */
  fromBeginning: false,
  /** Maximum number of bytes to fetch in a single request */
  maxBytes: 1048576, // 1MB
  /** Minimum number of bytes to fetch in a single request */
  minBytes: 1, // 1 byte
  /** Maximum wait time for fetch in milliseconds */
  maxWaitTimeInMs: 500, // 500ms
  /** Whether to auto-commit offsets */
  autoCommit: true,
  /** Auto-commit interval in milliseconds */
  autoCommitInterval: 5000, // 5 seconds
  /** Session timeout in milliseconds */
  sessionTimeout: 30000, // 30 seconds
  /** Heartbeat interval in milliseconds */
  heartbeatInterval: 3000, // 3 seconds
  /** Maximum number of bytes per partition */
  maxBytesPerPartition: 1048576, // 1MB
  /** Isolation level (read_committed or read_uncommitted) */
  isolationLevel: 'read_committed',
  /** Metadata max age in milliseconds */
  metadataMaxAge: 300000, // 5 minutes
  /** Whether to allow auto topic creation */
  allowAutoTopicCreation: false,
};

/**
 * Default Kafka consumer run configuration
 */
export const DEFAULT_CONSUMER_RUN_CONFIG = {
  /** Whether to auto-close the consumer on error */
  autoClose: true,
  /** Whether to enable auto-commit */
  autoCommit: true,
  /** Whether to enable auto-commit on error */
  autoCommitOnError: false,
  /** Partition concurrency limit */
  partitionsConsumedConcurrently: 1,
  /** Batch size for eachBatch */
  eachBatchSize: DEFAULT_BATCH_SIZES.STANDARD,
};

// -----------------------------------------------------------------------------
// Kafka Admin Configuration Constants
// -----------------------------------------------------------------------------

/**
 * Default Kafka admin configuration
 */
export const DEFAULT_ADMIN_CONFIG = {
  /** Default topic configuration */
  defaultTopicConfig: {
    /** Number of partitions */
    numPartitions: 3,
    /** Replication factor */
    replicationFactor: 3,
    /** Retention time in milliseconds */
    retentionMs: 604800000, // 7 days
    /** Cleanup policy */
    cleanupPolicy: 'delete',
  },
  /** Default topic creation timeout in milliseconds */
  createTopicsTimeout: 30000, // 30 seconds
  /** Default topic deletion timeout in milliseconds */
  deleteTopicsTimeout: 30000, // 30 seconds
};

// -----------------------------------------------------------------------------
// Kafka Error Constants
// -----------------------------------------------------------------------------

/**
 * Kafka error codes from the Kafka protocol
 * These are used to identify specific error types
 */
export const KAFKA_ERROR_CODES = {
  /** Unknown server error */
  UNKNOWN: -1,
  /** No error */
  NONE: 0,
  /** Offset out of range */
  OFFSET_OUT_OF_RANGE: 1,
  /** Invalid message */
  INVALID_MESSAGE: 2,
  /** Unknown topic or partition */
  UNKNOWN_TOPIC_OR_PARTITION: 3,
  /** Invalid message size */
  INVALID_MESSAGE_SIZE: 4,
  /** Leader not available */
  LEADER_NOT_AVAILABLE: 5,
  /** Not leader for partition */
  NOT_LEADER_FOR_PARTITION: 6,
  /** Request timed out */
  REQUEST_TIMED_OUT: 7,
  /** Broker not available */
  BROKER_NOT_AVAILABLE: 8,
  /** Replica not available */
  REPLICA_NOT_AVAILABLE: 9,
  /** Message size too large */
  MESSAGE_TOO_LARGE: 10,
  /** Stale controller epoch */
  STALE_CONTROLLER_EPOCH: 11,
  /** Offset metadata too large */
  OFFSET_METADATA_TOO_LARGE: 12,
  /** Network exception */
  NETWORK_EXCEPTION: 13,
  /** Coordinator load in progress */
  COORDINATOR_LOAD_IN_PROGRESS: 14,
  /** Coordinator not available */
  COORDINATOR_NOT_AVAILABLE: 15,
  /** Not coordinator */
  NOT_COORDINATOR: 16,
  /** Invalid topic exception */
  INVALID_TOPIC_EXCEPTION: 17,
  /** Record list too large */
  RECORD_LIST_TOO_LARGE: 18,
  /** Not enough replicas */
  NOT_ENOUGH_REPLICAS: 19,
  /** Not enough replicas after append */
  NOT_ENOUGH_REPLICAS_AFTER_APPEND: 20,
  /** Invalid required acks */
  INVALID_REQUIRED_ACKS: 21,
  /** Illegal generation */
  ILLEGAL_GENERATION: 22,
  /** Inconsistent group protocol */
  INCONSISTENT_GROUP_PROTOCOL: 23,
  /** Invalid group id */
  INVALID_GROUP_ID: 24,
  /** Unknown member id */
  UNKNOWN_MEMBER_ID: 25,
  /** Invalid session timeout */
  INVALID_SESSION_TIMEOUT: 26,
  /** Rebalance in progress */
  REBALANCE_IN_PROGRESS: 27,
  /** Invalid commit offset size */
  INVALID_COMMIT_OFFSET_SIZE: 28,
  /** Topic authorization failed */
  TOPIC_AUTHORIZATION_FAILED: 29,
  /** Group authorization failed */
  GROUP_AUTHORIZATION_FAILED: 30,
  /** Cluster authorization failed */
  CLUSTER_AUTHORIZATION_FAILED: 31,
  /** Invalid timestamp */
  INVALID_TIMESTAMP: 32,
  /** Unsupported SASL mechanism */
  UNSUPPORTED_SASL_MECHANISM: 33,
  /** Illegal SASL state */
  ILLEGAL_SASL_STATE: 34,
  /** Unsupported version */
  UNSUPPORTED_VERSION: 35,
  /** Topic already exists */
  TOPIC_ALREADY_EXISTS: 36,
  /** Invalid partitions */
  INVALID_PARTITIONS: 37,
  /** Invalid replication factor */
  INVALID_REPLICATION_FACTOR: 38,
  /** Invalid replica assignment */
  INVALID_REPLICA_ASSIGNMENT: 39,
  /** Invalid config */
  INVALID_CONFIG: 40,
  /** Not controller */
  NOT_CONTROLLER: 41,
  /** Invalid request */
  INVALID_REQUEST: 42,
  /** Unsupported for message format */
  UNSUPPORTED_FOR_MESSAGE_FORMAT: 43,
  /** Policy violation */
  POLICY_VIOLATION: 44,
  /** Out of order sequence number */
  OUT_OF_ORDER_SEQUENCE_NUMBER: 45,
  /** Duplicate sequence number */
  DUPLICATE_SEQUENCE_NUMBER: 46,
  /** Invalid producer epoch */
  INVALID_PRODUCER_EPOCH: 47,
  /** Invalid transaction state */
  INVALID_TXN_STATE: 48,
  /** Invalid producer ID mapping */
  INVALID_PRODUCER_ID_MAPPING: 49,
  /** Invalid transaction timeout */
  INVALID_TRANSACTION_TIMEOUT: 50,
  /** Concurrent transactions */
  CONCURRENT_TRANSACTIONS: 51,
  /** Transaction coordinator fenced */
  TRANSACTION_COORDINATOR_FENCED: 52,
  /** Transactional ID authorization failed */
  TRANSACTIONAL_ID_AUTHORIZATION_FAILED: 53,
  /** Security disabled */
  SECURITY_DISABLED: 54,
  /** Operation not attempted */
  OPERATION_NOT_ATTEMPTED: 55,
  /** Kafka storage error */
  KAFKA_STORAGE_ERROR: 56,
  /** Log directory not found */
  LOG_DIR_NOT_FOUND: 57,
  /** SASL authentication failed */
  SASL_AUTHENTICATION_FAILED: 58,
  /** Unknown producer ID */
  UNKNOWN_PRODUCER_ID: 59,
  /** Reassignment in progress */
  REASSIGNMENT_IN_PROGRESS: 60,
  /** Delegation token auth disabled */
  DELEGATION_TOKEN_AUTH_DISABLED: 61,
  /** Delegation token not found */
  DELEGATION_TOKEN_NOT_FOUND: 62,
  /** Delegation token owner mismatch */
  DELEGATION_TOKEN_OWNER_MISMATCH: 63,
  /** Delegation token request not allowed */
  DELEGATION_TOKEN_REQUEST_NOT_ALLOWED: 64,
  /** Delegation token authorization failed */
  DELEGATION_TOKEN_AUTHORIZATION_FAILED: 65,
  /** Delegation token expired */
  DELEGATION_TOKEN_EXPIRED: 66,
  /** Invalid principal type */
  INVALID_PRINCIPAL_TYPE: 67,
  /** Non-empty group */
  NON_EMPTY_GROUP: 68,
  /** Group ID not found */
  GROUP_ID_NOT_FOUND: 69,
  /** Fetch session ID not found */
  FETCH_SESSION_ID_NOT_FOUND: 70,
  /** Invalid fetch session epoch */
  INVALID_FETCH_SESSION_EPOCH: 71,
  /** Listener not found */
  LISTENER_NOT_FOUND: 72,
  /** Topic deletion disabled */
  TOPIC_DELETION_DISABLED: 73,
  /** Fenced leader epoch */
  FENCED_LEADER_EPOCH: 74,
  /** Unknown leader epoch */
  UNKNOWN_LEADER_EPOCH: 75,
  /** Unsupported compression type */
  UNSUPPORTED_COMPRESSION_TYPE: 76,
  /** Stale broker epoch */
  STALE_BROKER_EPOCH: 77,
  /** Offset not available */
  OFFSET_NOT_AVAILABLE: 78,
  /** Member ID required */
  MEMBER_ID_REQUIRED: 79,
  /** Preferred leader not available */
  PREFERRED_LEADER_NOT_AVAILABLE: 80,
  /** Group max size reached */
  GROUP_MAX_SIZE_REACHED: 81,
  /** Fenced instance ID */
  FENCED_INSTANCE_ID: 82,
  /** Eligible leaders not available */
  ELIGIBLE_LEADERS_NOT_AVAILABLE: 83,
  /** Election not needed */
  ELECTION_NOT_NEEDED: 84,
  /** No reassignment in progress */
  NO_REASSIGNMENT_IN_PROGRESS: 85,
  /** Group subscribed to topic */
  GROUP_SUBSCRIBED_TO_TOPIC: 86,
  /** Invalid record */
  INVALID_RECORD: 87,
  /** Unstable offset commit */
  UNSTABLE_OFFSET_COMMIT: 88,
  /** Throttling quota exceeded */
  THROTTLING_QUOTA_EXCEEDED: 89,
  /** Producer fenced */
  PRODUCER_FENCED: 90,
  /** Resource not found */
  RESOURCE_NOT_FOUND: 91,
  /** Duplicate resource */
  DUPLICATE_RESOURCE: 92,
  /** Unacceptable credential */
  UNACCEPTABLE_CREDENTIAL: 93,
  /** Inconsistent voter set */
  INCONSISTENT_VOTER_SET: 94,
  /** Invalid update version */
  INVALID_UPDATE_VERSION: 95,
  /** Feature update failed */
  FEATURE_UPDATE_FAILED: 96,
  /** Principal deserialization failure */
  PRINCIPAL_DESERIALIZATION_FAILURE: 97,
};

/**
 * Maps Kafka error codes to error types for classification
 */
export const KAFKA_ERROR_CODE_TO_TYPE: Record<number, KafkaErrorType> = {
  [KAFKA_ERROR_CODES.UNKNOWN]: KafkaErrorType.UNKNOWN,
  [KAFKA_ERROR_CODES.OFFSET_OUT_OF_RANGE]: KafkaErrorType.BROKER,
  [KAFKA_ERROR_CODES.INVALID_MESSAGE]: KafkaErrorType.VALIDATION,
  [KAFKA_ERROR_CODES.UNKNOWN_TOPIC_OR_PARTITION]: KafkaErrorType.BROKER,
  [KAFKA_ERROR_CODES.INVALID_MESSAGE_SIZE]: KafkaErrorType.VALIDATION,
  [KAFKA_ERROR_CODES.LEADER_NOT_AVAILABLE]: KafkaErrorType.BROKER,
  [KAFKA_ERROR_CODES.NOT_LEADER_FOR_PARTITION]: KafkaErrorType.BROKER,
  [KAFKA_ERROR_CODES.REQUEST_TIMED_OUT]: KafkaErrorType.TIMEOUT,
  [KAFKA_ERROR_CODES.BROKER_NOT_AVAILABLE]: KafkaErrorType.CONNECTION,
  [KAFKA_ERROR_CODES.REPLICA_NOT_AVAILABLE]: KafkaErrorType.BROKER,
  [KAFKA_ERROR_CODES.MESSAGE_TOO_LARGE]: KafkaErrorType.VALIDATION,
  [KAFKA_ERROR_CODES.NETWORK_EXCEPTION]: KafkaErrorType.CONNECTION,
  [KAFKA_ERROR_CODES.COORDINATOR_NOT_AVAILABLE]: KafkaErrorType.BROKER,
  [KAFKA_ERROR_CODES.TOPIC_AUTHORIZATION_FAILED]: KafkaErrorType.AUTHORIZATION,
  [KAFKA_ERROR_CODES.GROUP_AUTHORIZATION_FAILED]: KafkaErrorType.AUTHORIZATION,
  [KAFKA_ERROR_CODES.CLUSTER_AUTHORIZATION_FAILED]: KafkaErrorType.AUTHORIZATION,
  [KAFKA_ERROR_CODES.SASL_AUTHENTICATION_FAILED]: KafkaErrorType.AUTHENTICATION,
};

/**
 * Kafka error types that are retryable
 */
export const RETRYABLE_KAFKA_ERROR_TYPES: KafkaErrorType[] = [
  KafkaErrorType.CONNECTION,
  KafkaErrorType.TIMEOUT,
  KafkaErrorType.BROKER,
];

/**
 * Kafka error types that are not retryable
 */
export const NON_RETRYABLE_KAFKA_ERROR_TYPES: KafkaErrorType[] = [
  KafkaErrorType.AUTHENTICATION,
  KafkaErrorType.AUTHORIZATION,
  KafkaErrorType.VALIDATION,
];

// -----------------------------------------------------------------------------
// Kafka Retry Constants
// -----------------------------------------------------------------------------

/**
 * Default retry policy for Kafka operations
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = RetryPolicy.EXPONENTIAL;

/**
 * Default retry configuration for Kafka operations
 */
export const DEFAULT_KAFKA_RETRY_CONFIG = {
  /** Whether retries are enabled */
  enabled: true,
  /** Maximum number of retry attempts */
  retries: DEFAULT_RETRY_SETTINGS.MAX_ATTEMPTS,
  /** Initial retry delay in milliseconds */
  initialRetryTimeMs: DEFAULT_RETRY_SETTINGS.INITIAL_DELAY_MS,
  /** Maximum retry delay in milliseconds */
  maxRetryTimeMs: DEFAULT_RETRY_SETTINGS.MAX_DELAY_MS,
  /** Backoff factor for exponential backoff */
  factor: DEFAULT_RETRY_SETTINGS.BACKOFF_FACTOR,
  /** Jitter factor to add randomness to retry delays */
  jitter: DEFAULT_RETRY_SETTINGS.JITTER_FACTOR,
  /** Retry policy to use */
  policy: DEFAULT_RETRY_POLICY,
  /** Error types that are retryable */
  retryableErrors: RETRYABLE_KAFKA_ERROR_TYPES,
};

/**
 * Default dead letter queue configuration
 */
export const DEFAULT_DLQ_CONFIG = {
  /** Whether DLQ is enabled */
  enabled: true,
  /** Topic name suffix for DLQ topics */
  topicSuffix: '.dlq',
  /** Header prefix for DLQ headers */
  headerPrefix: 'dlq-',
  /** Maximum number of retries before sending to DLQ */
  maxRetries: DEFAULT_RETRY_SETTINGS.MAX_ATTEMPTS,
};

// -----------------------------------------------------------------------------
// Kafka Message Constants
// -----------------------------------------------------------------------------

/**
 * Default message headers for Kafka messages
 */
export const DEFAULT_MESSAGE_HEADERS = {
  /** Content type header */
  contentType: SerializationFormat.JSON,
  /** Schema version header */
  schemaVersion: '1.0.0',
  /** Source service header */
  sourceService: 'unknown',
  /** Timestamp header */
  timestamp: new Date().toISOString(),
};

/**
 * Maximum message size in bytes
 * Messages larger than this will be rejected
 */
export const MAX_MESSAGE_SIZE_BYTES = 1048576; // 1MB

/**
 * Default batch size for message production
 */
export const DEFAULT_BATCH_SIZE = 100;

// -----------------------------------------------------------------------------
// Kafka Topic Constants
// -----------------------------------------------------------------------------

/**
 * Default topic configuration for new topics
 */
export const DEFAULT_TOPIC_CONFIG = {
  /** Number of partitions */
  numPartitions: 3,
  /** Replication factor */
  replicationFactor: 3,
  /** Cleanup policy */
  cleanupPolicy: 'delete',
  /** Retention time in milliseconds */
  retentionMs: 604800000, // 7 days
  /** Maximum message size in bytes */
  maxMessageBytes: MAX_MESSAGE_SIZE_BYTES,
  /** Minimum in-sync replicas */
  minInsyncReplicas: 2,
  /** Whether unclean leader election is allowed */
  uncleanLeaderElectionEnable: false,
};

/**
 * Topic configuration for dead letter queue topics
 */
export const DLQ_TOPIC_CONFIG = {
  ...DEFAULT_TOPIC_CONFIG,
  /** Longer retention for DLQ topics */
  retentionMs: 2592000000, // 30 days
  /** Single partition for ordered processing */
  numPartitions: 1,
};

/**
 * Topic configuration for retry topics
 */
export const RETRY_TOPIC_CONFIG = {
  ...DEFAULT_TOPIC_CONFIG,
  /** Shorter retention for retry topics */
  retentionMs: 86400000, // 1 day
  /** Single partition for ordered processing */
  numPartitions: 1,
};

// -----------------------------------------------------------------------------
// Kafka Consumer Group Constants
// -----------------------------------------------------------------------------

/**
 * Default consumer group configuration
 */
export const DEFAULT_CONSUMER_GROUP_CONFIG = {
  /** Session timeout in milliseconds */
  sessionTimeoutMs: 30000, // 30 seconds
  /** Rebalance timeout in milliseconds */
  rebalanceTimeoutMs: 60000, // 1 minute
  /** Heartbeat interval in milliseconds */
  heartbeatIntervalMs: 3000, // 3 seconds
  /** Maximum poll interval in milliseconds */
  maxPollIntervalMs: 300000, // 5 minutes
};

/**
 * Maps service names to their default consumer group IDs
 */
export const SERVICE_TO_CONSUMER_GROUP: Record<string, string> = {
  'api-gateway': CONSUMER_GROUPS.API_GATEWAY,
  'auth-service': CONSUMER_GROUPS.AUTH_SERVICE,
  'health-service': CONSUMER_GROUPS.HEALTH_SERVICE,
  'care-service': CONSUMER_GROUPS.CARE_SERVICE,
  'plan-service': CONSUMER_GROUPS.PLAN_SERVICE,
  'gamification-engine': CONSUMER_GROUPS.GAMIFICATION_ENGINE,
  'notification-service': CONSUMER_GROUPS.NOTIFICATION_SERVICE,
};

// -----------------------------------------------------------------------------
// Kafka Metrics Constants
// -----------------------------------------------------------------------------

/**
 * Metric names for Kafka operations
 */
export const KAFKA_METRICS = {
  /** Messages produced count */
  MESSAGES_PRODUCED: 'kafka.messages.produced',
  /** Messages consumed count */
  MESSAGES_CONSUMED: 'kafka.messages.consumed',
  /** Message production errors count */
  PRODUCTION_ERRORS: 'kafka.production.errors',
  /** Message consumption errors count */
  CONSUMPTION_ERRORS: 'kafka.consumption.errors',
  /** Message production latency */
  PRODUCTION_LATENCY: 'kafka.production.latency',
  /** Message consumption latency */
  CONSUMPTION_LATENCY: 'kafka.consumption.latency',
  /** Dead letter queue messages count */
  DLQ_MESSAGES: 'kafka.dlq.messages',
  /** Retry attempts count */
  RETRY_ATTEMPTS: 'kafka.retry.attempts',
  /** Batch size */
  BATCH_SIZE: 'kafka.batch.size',
  /** Connection status */
  CONNECTION_STATUS: 'kafka.connection.status',
};

// -----------------------------------------------------------------------------
// Kafka Health Check Constants
// -----------------------------------------------------------------------------

/**
 * Health check configuration for Kafka
 */
export const KAFKA_HEALTH_CHECK_CONFIG = {
  /** Timeout for health checks in milliseconds */
  timeout: 5000, // 5 seconds
  /** Interval for health checks in milliseconds */
  interval: 30000, // 30 seconds
};

/**
 * Health status values for Kafka
 */
export enum KafkaHealthStatus {
  /** Kafka is healthy */
  HEALTHY = 'healthy',
  /** Kafka is unhealthy */
  UNHEALTHY = 'unhealthy',
  /** Kafka health is degraded */
  DEGRADED = 'degraded',
}

// -----------------------------------------------------------------------------
// Kafka Module Constants
// -----------------------------------------------------------------------------

/**
 * Default module options for the Kafka module
 */
export const DEFAULT_KAFKA_MODULE_OPTIONS = {
  /** Whether to enable health checks */
  enableHealthCheck: true,
  /** Whether to register as a global module */
  isGlobal: false,
  /** Client configuration */
  client: DEFAULT_KAFKA_CLIENT_CONFIG,
  /** Consumer configuration */
  consumer: DEFAULT_CONSUMER_CONFIG,
  /** Producer configuration */
  producer: DEFAULT_PRODUCER_CONFIG,
};

/**
 * Module provider tokens for dependency injection
 */
export const KAFKA_PROVIDERS = {
  /** Provider token for Kafka options */
  OPTIONS: 'KAFKA_MODULE_OPTIONS',
  /** Provider token for Kafka client */
  CLIENT: 'KAFKA_CLIENT',
  /** Provider token for Kafka producer */
  PRODUCER: 'KAFKA_PRODUCER',
  /** Provider token for Kafka consumer */
  CONSUMER: 'KAFKA_CONSUMER',
  /** Provider token for Kafka admin */
  ADMIN: 'KAFKA_ADMIN',
};