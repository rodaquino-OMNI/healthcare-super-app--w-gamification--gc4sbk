/**
 * Database Error Codes
 * 
 * This file defines standardized error codes for database operations across different
 * technologies used in the AUSTA SuperApp. These codes ensure consistent error identification,
 * reporting, and handling throughout the application.
 * 
 * Error codes are organized by:
 * - Operation type (connection, query, transaction, integrity, configuration)
 * - Technology (PostgreSQL, Redis, TimescaleDB, S3)
 * - Journey context (Health, Care, Plan)
 * 
 * Each error code follows the format: DB_[OPERATION]_[TECHNOLOGY]_[SPECIFIC_ERROR]
 * Example: DB_CONN_PG_CONNECTION_REFUSED
 * 
 * For journey-specific database errors: DB_[JOURNEY]_[OPERATION]_[SPECIFIC_ERROR]
 * Example: DB_HEALTH_QUERY_METRICS_NOT_FOUND
 */

// ===================================================================
// General Database Error Codes
// ===================================================================

/**
 * Connection error codes for database operations
 * These errors occur when establishing or maintaining database connections
 */
export const DB_CONN_FAILED = 'DB_CONN_001';
export const DB_CONN_TIMEOUT = 'DB_CONN_002';
export const DB_CONN_POOL_EXHAUSTED = 'DB_CONN_003';
export const DB_CONN_AUTH_FAILED = 'DB_CONN_004';
export const DB_CONN_HOST_UNREACHABLE = 'DB_CONN_005';
export const DB_CONN_RATE_LIMITED = 'DB_CONN_006';
export const DB_CONN_CLOSED_UNEXPECTEDLY = 'DB_CONN_007';

/**
 * Query error codes for database operations
 * These errors occur during query execution and processing
 */
export const DB_QUERY_SYNTAX_ERROR = 'DB_QUERY_001';
export const DB_QUERY_TIMEOUT = 'DB_QUERY_002';
export const DB_QUERY_EXECUTION_FAILED = 'DB_QUERY_003';
export const DB_QUERY_RESULT_TOO_LARGE = 'DB_QUERY_004';
export const DB_QUERY_INVALID_PARAMS = 'DB_QUERY_005';
export const DB_QUERY_RESOURCE_NOT_FOUND = 'DB_QUERY_006';
export const DB_QUERY_PERMISSION_DENIED = 'DB_QUERY_007';

/**
 * Transaction error codes for database operations
 * These errors occur during transaction management
 */
export const DB_TRANS_BEGIN_FAILED = 'DB_TRANS_001';
export const DB_TRANS_COMMIT_FAILED = 'DB_TRANS_002';
export const DB_TRANS_ROLLBACK_FAILED = 'DB_TRANS_003';
export const DB_TRANS_TIMEOUT = 'DB_TRANS_004';
export const DB_TRANS_DEADLOCK = 'DB_TRANS_005';
export const DB_TRANS_SERIALIZATION_FAILURE = 'DB_TRANS_006';
export const DB_TRANS_ALREADY_IN_PROGRESS = 'DB_TRANS_007';

/**
 * Data integrity error codes for database operations
 * These errors occur when data integrity constraints are violated
 */
export const DB_INTEGRITY_UNIQUE_VIOLATION = 'DB_INTEGRITY_001';
export const DB_INTEGRITY_FOREIGN_KEY_VIOLATION = 'DB_INTEGRITY_002';
export const DB_INTEGRITY_CHECK_VIOLATION = 'DB_INTEGRITY_003';
export const DB_INTEGRITY_NOT_NULL_VIOLATION = 'DB_INTEGRITY_004';
export const DB_INTEGRITY_DATA_CORRUPTION = 'DB_INTEGRITY_005';
export const DB_INTEGRITY_SCHEMA_MISMATCH = 'DB_INTEGRITY_006';
export const DB_INTEGRITY_INVALID_DATA_TYPE = 'DB_INTEGRITY_007';

/**
 * Configuration error codes for database operations
 * These errors occur due to misconfiguration of database settings
 */
export const DB_CONFIG_INVALID_CONNECTION_STRING = 'DB_CONFIG_001';
export const DB_CONFIG_MISSING_ENV_VARS = 'DB_CONFIG_002';
export const DB_CONFIG_INVALID_POOL_SIZE = 'DB_CONFIG_003';
export const DB_CONFIG_INVALID_TIMEOUT = 'DB_CONFIG_004';
export const DB_CONFIG_INVALID_CREDENTIALS = 'DB_CONFIG_005';
export const DB_CONFIG_INVALID_SCHEMA = 'DB_CONFIG_006';
export const DB_CONFIG_MIGRATION_FAILED = 'DB_CONFIG_007';

// ===================================================================
// Technology-Specific Database Error Codes
// ===================================================================

/**
 * PostgreSQL-specific error codes
 * These codes map to common PostgreSQL error scenarios
 */
export const DB_PG_CONNECTION_REFUSED = 'DB_PG_001';
export const DB_PG_INVALID_CATALOG = 'DB_PG_002';
export const DB_PG_INSUFFICIENT_RESOURCES = 'DB_PG_003';
export const DB_PG_TOO_MANY_CONNECTIONS = 'DB_PG_004';
export const DB_PG_DUPLICATE_KEY = 'DB_PG_005';
export const DB_PG_UNDEFINED_TABLE = 'DB_PG_006';
export const DB_PG_UNDEFINED_COLUMN = 'DB_PG_007';
export const DB_PG_UNDEFINED_FUNCTION = 'DB_PG_008';
export const DB_PG_INVALID_TEXT_REPRESENTATION = 'DB_PG_009';
export const DB_PG_DIVISION_BY_ZERO = 'DB_PG_010';
export const DB_PG_INVALID_PARAMETER_VALUE = 'DB_PG_011';
export const DB_PG_INVALID_TRANSACTION_STATE = 'DB_PG_012';

/**
 * Redis-specific error codes
 * These codes map to common Redis error scenarios
 */
export const DB_REDIS_CONNECTION_REFUSED = 'DB_REDIS_001';
export const DB_REDIS_AUTH_FAILED = 'DB_REDIS_002';
export const DB_REDIS_KEY_NOT_FOUND = 'DB_REDIS_003';
export const DB_REDIS_WRONG_TYPE = 'DB_REDIS_004';
export const DB_REDIS_OUT_OF_MEMORY = 'DB_REDIS_005';
export const DB_REDIS_COMMAND_DISABLED = 'DB_REDIS_006';
export const DB_REDIS_MASTER_DOWN = 'DB_REDIS_007';
export const DB_REDIS_REPLICA_DOWN = 'DB_REDIS_008';
export const DB_REDIS_CLUSTER_ERROR = 'DB_REDIS_009';
export const DB_REDIS_SCRIPT_ERROR = 'DB_REDIS_010';
export const DB_REDIS_TIMEOUT = 'DB_REDIS_011';
export const DB_REDIS_PUBSUB_ERROR = 'DB_REDIS_012';

/**
 * TimescaleDB-specific error codes
 * These codes map to common TimescaleDB error scenarios
 */
export const DB_TIMESCALE_HYPERTABLE_ERROR = 'DB_TIMESCALE_001';
export const DB_TIMESCALE_CHUNK_CREATION_FAILED = 'DB_TIMESCALE_002';
export const DB_TIMESCALE_COMPRESSION_ERROR = 'DB_TIMESCALE_003';
export const DB_TIMESCALE_RETENTION_POLICY_ERROR = 'DB_TIMESCALE_004';
export const DB_TIMESCALE_CONTINUOUS_AGGREGATE_ERROR = 'DB_TIMESCALE_005';
export const DB_TIMESCALE_JOB_SCHEDULING_ERROR = 'DB_TIMESCALE_006';
export const DB_TIMESCALE_DIMENSION_ERROR = 'DB_TIMESCALE_007';
export const DB_TIMESCALE_INVALID_TIME_COLUMN = 'DB_TIMESCALE_008';

/**
 * S3 storage-specific error codes
 * These codes map to common S3 error scenarios
 */
export const DB_S3_ACCESS_DENIED = 'DB_S3_001';
export const DB_S3_BUCKET_NOT_FOUND = 'DB_S3_002';
export const DB_S3_OBJECT_NOT_FOUND = 'DB_S3_003';
export const DB_S3_INVALID_CREDENTIALS = 'DB_S3_004';
export const DB_S3_BUCKET_ALREADY_EXISTS = 'DB_S3_005';
export const DB_S3_OBJECT_ALREADY_EXISTS = 'DB_S3_006';
export const DB_S3_UPLOAD_FAILED = 'DB_S3_007';
export const DB_S3_DOWNLOAD_FAILED = 'DB_S3_008';
export const DB_S3_DELETE_FAILED = 'DB_S3_009';
export const DB_S3_INVALID_OBJECT_STATE = 'DB_S3_010';
export const DB_S3_QUOTA_EXCEEDED = 'DB_S3_011';
export const DB_S3_INVALID_PART = 'DB_S3_012';

// ===================================================================
// Journey-Specific Database Error Codes
// ===================================================================

/**
 * Health Journey database error codes
 * These codes are specific to health journey database operations
 */
export const DB_HEALTH_CONN_TIMESCALE_FAILED = 'DB_HEALTH_CONN_001';
export const DB_HEALTH_QUERY_METRICS_NOT_FOUND = 'DB_HEALTH_QUERY_001';
export const DB_HEALTH_QUERY_DEVICE_NOT_FOUND = 'DB_HEALTH_QUERY_002';
export const DB_HEALTH_QUERY_GOAL_NOT_FOUND = 'DB_HEALTH_QUERY_003';
export const DB_HEALTH_INTEGRITY_DUPLICATE_METRIC = 'DB_HEALTH_INTEGRITY_001';
export const DB_HEALTH_INTEGRITY_INVALID_METRIC_VALUE = 'DB_HEALTH_INTEGRITY_002';
export const DB_HEALTH_INTEGRITY_INVALID_GOAL_TARGET = 'DB_HEALTH_INTEGRITY_003';
export const DB_HEALTH_TRANS_SYNC_FAILED = 'DB_HEALTH_TRANS_001';

/**
 * Care Journey database error codes
 * These codes are specific to care journey database operations
 */
export const DB_CARE_QUERY_PROVIDER_NOT_FOUND = 'DB_CARE_QUERY_001';
export const DB_CARE_QUERY_APPOINTMENT_NOT_FOUND = 'DB_CARE_QUERY_002';
export const DB_CARE_QUERY_MEDICATION_NOT_FOUND = 'DB_CARE_QUERY_003';
export const DB_CARE_INTEGRITY_DUPLICATE_APPOINTMENT = 'DB_CARE_INTEGRITY_001';
export const DB_CARE_INTEGRITY_INVALID_APPOINTMENT_TIME = 'DB_CARE_INTEGRITY_002';
export const DB_CARE_INTEGRITY_PROVIDER_UNAVAILABLE = 'DB_CARE_INTEGRITY_003';
export const DB_CARE_TRANS_BOOKING_FAILED = 'DB_CARE_TRANS_001';

/**
 * Plan Journey database error codes
 * These codes are specific to plan journey database operations
 */
export const DB_PLAN_QUERY_COVERAGE_NOT_FOUND = 'DB_PLAN_QUERY_001';
export const DB_PLAN_QUERY_BENEFIT_NOT_FOUND = 'DB_PLAN_QUERY_002';
export const DB_PLAN_QUERY_CLAIM_NOT_FOUND = 'DB_PLAN_QUERY_003';
export const DB_PLAN_INTEGRITY_DUPLICATE_CLAIM = 'DB_PLAN_INTEGRITY_001';
export const DB_PLAN_INTEGRITY_INVALID_CLAIM_AMOUNT = 'DB_PLAN_INTEGRITY_002';
export const DB_PLAN_INTEGRITY_COVERAGE_LIMIT_EXCEEDED = 'DB_PLAN_INTEGRITY_003';
export const DB_PLAN_TRANS_CLAIM_SUBMISSION_FAILED = 'DB_PLAN_TRANS_001';

/**
 * Gamification database error codes
 * These codes are specific to gamification database operations
 */
export const DB_GAME_QUERY_PROFILE_NOT_FOUND = 'DB_GAME_QUERY_001';
export const DB_GAME_QUERY_ACHIEVEMENT_NOT_FOUND = 'DB_GAME_QUERY_002';
export const DB_GAME_QUERY_REWARD_NOT_FOUND = 'DB_GAME_QUERY_003';
export const DB_GAME_QUERY_QUEST_NOT_FOUND = 'DB_GAME_QUERY_004';
export const DB_GAME_INTEGRITY_DUPLICATE_ACHIEVEMENT = 'DB_GAME_INTEGRITY_001';
export const DB_GAME_INTEGRITY_INVALID_POINTS = 'DB_GAME_INTEGRITY_002';
export const DB_GAME_INTEGRITY_QUEST_REQUIREMENT_MISMATCH = 'DB_GAME_INTEGRITY_003';
export const DB_GAME_TRANS_REWARD_CLAIM_FAILED = 'DB_GAME_TRANS_001';