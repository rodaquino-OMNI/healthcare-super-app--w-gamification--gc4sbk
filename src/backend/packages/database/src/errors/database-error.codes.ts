/**
 * Database Error Codes
 * 
 * This file defines standardized error codes for database operations across the AUSTA SuperApp.
 * Codes are organized by operation type and technology to ensure consistent error identification
 * and reporting throughout the application.
 * 
 * Format: DB_[OPERATION]_[TECHNOLOGY]_[SPECIFIC_ERROR]
 * 
 * Operations:
 * - CONN: Connection-related errors
 * - QUERY: Query execution errors
 * - TRANS: Transaction-related errors
 * - INTEG: Data integrity errors
 * - CONFIG: Configuration errors
 * 
 * Technologies:
 * - PG: PostgreSQL
 * - REDIS: Redis
 * - TS: TimescaleDB
 * - S3: Amazon S3 storage
 */

// ===== CONNECTION ERRORS =====

/**
 * PostgreSQL connection errors
 */
export const DB_CONN_PG_FAILED = 'DB_CONN_PG_001'; // Failed to establish connection to PostgreSQL
export const DB_CONN_PG_TIMEOUT = 'DB_CONN_PG_002'; // Connection timeout to PostgreSQL
export const DB_CONN_PG_CLOSED = 'DB_CONN_PG_003'; // Connection unexpectedly closed by PostgreSQL
export const DB_CONN_PG_REJECTED = 'DB_CONN_PG_004'; // Connection rejected by PostgreSQL (auth failure)
export const DB_CONN_PG_POOL_EXHAUSTED = 'DB_CONN_PG_005'; // Connection pool exhausted

/**
 * Redis connection errors
 */
export const DB_CONN_REDIS_FAILED = 'DB_CONN_REDIS_001'; // Failed to establish connection to Redis
export const DB_CONN_REDIS_TIMEOUT = 'DB_CONN_REDIS_002'; // Connection timeout to Redis
export const DB_CONN_REDIS_AUTH_FAILED = 'DB_CONN_REDIS_003'; // Redis authentication failed
export const DB_CONN_REDIS_CLUSTER_ERROR = 'DB_CONN_REDIS_004'; // Redis cluster connection error

/**
 * TimescaleDB connection errors
 */
export const DB_CONN_TS_FAILED = 'DB_CONN_TS_001'; // Failed to establish connection to TimescaleDB
export const DB_CONN_TS_TIMEOUT = 'DB_CONN_TS_002'; // Connection timeout to TimescaleDB
export const DB_CONN_TS_EXTENSION_MISSING = 'DB_CONN_TS_003'; // TimescaleDB extension not installed

/**
 * S3 connection errors
 */
export const DB_CONN_S3_FAILED = 'DB_CONN_S3_001'; // Failed to establish connection to S3
export const DB_CONN_S3_TIMEOUT = 'DB_CONN_S3_002'; // Connection timeout to S3
export const DB_CONN_S3_AUTH_FAILED = 'DB_CONN_S3_003'; // S3 authentication failed
export const DB_CONN_S3_REGION_ERROR = 'DB_CONN_S3_004'; // S3 region configuration error

// ===== QUERY ERRORS =====

/**
 * PostgreSQL query errors
 */
export const DB_QUERY_PG_SYNTAX = 'DB_QUERY_PG_001'; // SQL syntax error
export const DB_QUERY_PG_TIMEOUT = 'DB_QUERY_PG_002'; // Query execution timeout
export const DB_QUERY_PG_CANCELED = 'DB_QUERY_PG_003'; // Query canceled by user or system
export const DB_QUERY_PG_RESOURCE_LIMIT = 'DB_QUERY_PG_004'; // Query exceeded resource limits
export const DB_QUERY_PG_PERMISSION_DENIED = 'DB_QUERY_PG_005'; // Permission denied for query execution

/**
 * Redis query errors
 */
export const DB_QUERY_REDIS_SYNTAX = 'DB_QUERY_REDIS_001'; // Redis command syntax error
export const DB_QUERY_REDIS_TIMEOUT = 'DB_QUERY_REDIS_002'; // Redis command execution timeout
export const DB_QUERY_REDIS_WRONG_TYPE = 'DB_QUERY_REDIS_003'; // Operation against key holding wrong kind of value
export const DB_QUERY_REDIS_MAX_MEMORY = 'DB_QUERY_REDIS_004'; // Redis max memory limit reached

/**
 * TimescaleDB query errors
 */
export const DB_QUERY_TS_SYNTAX = 'DB_QUERY_TS_001'; // TimescaleDB syntax error
export const DB_QUERY_TS_TIMEOUT = 'DB_QUERY_TS_002'; // TimescaleDB query timeout
export const DB_QUERY_TS_HYPERTABLE_ERROR = 'DB_QUERY_TS_003'; // Error with hypertable operation
export const DB_QUERY_TS_CHUNK_ERROR = 'DB_QUERY_TS_004'; // Error with chunk operation

/**
 * S3 query errors
 */
export const DB_QUERY_S3_NOT_FOUND = 'DB_QUERY_S3_001'; // Object not found in S3
export const DB_QUERY_S3_TIMEOUT = 'DB_QUERY_S3_002'; // S3 operation timeout
export const DB_QUERY_S3_THROTTLED = 'DB_QUERY_S3_003'; // S3 request throttled
export const DB_QUERY_S3_SIZE_EXCEEDED = 'DB_QUERY_S3_004'; // S3 object size limit exceeded

// ===== TRANSACTION ERRORS =====

/**
 * PostgreSQL transaction errors
 */
export const DB_TRANS_PG_BEGIN_FAILED = 'DB_TRANS_PG_001'; // Failed to begin transaction
export const DB_TRANS_PG_COMMIT_FAILED = 'DB_TRANS_PG_002'; // Failed to commit transaction
export const DB_TRANS_PG_ROLLBACK_FAILED = 'DB_TRANS_PG_003'; // Failed to rollback transaction
export const DB_TRANS_PG_DEADLOCK = 'DB_TRANS_PG_004'; // Deadlock detected
export const DB_TRANS_PG_SERIALIZATION = 'DB_TRANS_PG_005'; // Serialization failure in transaction

/**
 * Redis transaction errors
 */
export const DB_TRANS_REDIS_EXEC_FAILED = 'DB_TRANS_REDIS_001'; // Redis EXEC command failed
export const DB_TRANS_REDIS_WATCH_FAILED = 'DB_TRANS_REDIS_002'; // Redis WATCH detected modified keys
export const DB_TRANS_REDIS_MULTI_NESTED = 'DB_TRANS_REDIS_003'; // Nested MULTI commands not allowed

// ===== INTEGRITY ERRORS =====

/**
 * PostgreSQL integrity errors
 */
export const DB_INTEG_PG_UNIQUE = 'DB_INTEG_PG_001'; // Unique constraint violation
export const DB_INTEG_PG_FOREIGN_KEY = 'DB_INTEG_PG_002'; // Foreign key constraint violation
export const DB_INTEG_PG_CHECK = 'DB_INTEG_PG_003'; // Check constraint violation
export const DB_INTEG_PG_NOT_NULL = 'DB_INTEG_PG_004'; // Not null constraint violation
export const DB_INTEG_PG_EXCLUSION = 'DB_INTEG_PG_005'; // Exclusion constraint violation

/**
 * Redis integrity errors
 */
export const DB_INTEG_REDIS_KEY_EXISTS = 'DB_INTEG_REDIS_001'; // Key already exists (NX operation)
export const DB_INTEG_REDIS_KEY_NOT_EXISTS = 'DB_INTEG_REDIS_002'; // Key does not exist (XX operation)

/**
 * TimescaleDB integrity errors
 */
export const DB_INTEG_TS_UNIQUE = 'DB_INTEG_TS_001'; // TimescaleDB unique constraint violation
export const DB_INTEG_TS_DIMENSION_ALIGN = 'DB_INTEG_TS_002'; // TimescaleDB dimension alignment error

/**
 * S3 integrity errors
 */
export const DB_INTEG_S3_ETAG_MISMATCH = 'DB_INTEG_S3_001'; // S3 ETag mismatch
export const DB_INTEG_S3_CHECKSUM_FAILED = 'DB_INTEG_S3_002'; // S3 checksum validation failed

// ===== CONFIGURATION ERRORS =====

/**
 * PostgreSQL configuration errors
 */
export const DB_CONFIG_PG_INVALID_URL = 'DB_CONFIG_PG_001'; // Invalid PostgreSQL connection URL
export const DB_CONFIG_PG_INVALID_SCHEMA = 'DB_CONFIG_PG_002'; // Invalid database schema
export const DB_CONFIG_PG_INVALID_POOL = 'DB_CONFIG_PG_003'; // Invalid connection pool configuration

/**
 * Redis configuration errors
 */
export const DB_CONFIG_REDIS_INVALID_URL = 'DB_CONFIG_REDIS_001'; // Invalid Redis connection URL
export const DB_CONFIG_REDIS_INVALID_CLUSTER = 'DB_CONFIG_REDIS_002'; // Invalid Redis cluster configuration

/**
 * TimescaleDB configuration errors
 */
export const DB_CONFIG_TS_INVALID_RETENTION = 'DB_CONFIG_TS_001'; // Invalid retention policy configuration
export const DB_CONFIG_TS_INVALID_CHUNK = 'DB_CONFIG_TS_002'; // Invalid chunk time interval configuration

/**
 * S3 configuration errors
 */
export const DB_CONFIG_S3_INVALID_BUCKET = 'DB_CONFIG_S3_001'; // Invalid S3 bucket configuration
export const DB_CONFIG_S3_INVALID_CREDENTIALS = 'DB_CONFIG_S3_002'; // Invalid S3 credentials configuration
export const DB_CONFIG_S3_INVALID_REGION = 'DB_CONFIG_S3_003'; // Invalid S3 region configuration

// ===== JOURNEY-SPECIFIC DATABASE ERRORS =====

/**
 * Health Journey database errors
 */
export const DB_HEALTH_METRIC_INVALID = 'DB_HEALTH_001'; // Invalid health metric data
export const DB_HEALTH_DEVICE_SYNC_FAILED = 'DB_HEALTH_002'; // Failed to sync device data
export const DB_HEALTH_GOAL_CONSTRAINT = 'DB_HEALTH_003'; // Health goal constraint violation
export const DB_HEALTH_FHIR_INTEGRATION = 'DB_HEALTH_004'; // FHIR integration database error
export const DB_HEALTH_TIMESERIES_ERROR = 'DB_HEALTH_005'; // Time-series data storage error

/**
 * Care Journey database errors
 */
export const DB_CARE_PROVIDER_NOT_FOUND = 'DB_CARE_001'; // Care provider not found
export const DB_CARE_APPOINTMENT_CONFLICT = 'DB_CARE_002'; // Appointment scheduling conflict
export const DB_CARE_MEDICATION_CONSTRAINT = 'DB_CARE_003'; // Medication constraint violation
export const DB_CARE_TELEMEDICINE_RECORD = 'DB_CARE_004'; // Telemedicine session record error

/**
 * Plan Journey database errors
 */
export const DB_PLAN_COVERAGE_CONSTRAINT = 'DB_PLAN_001'; // Plan coverage constraint violation
export const DB_PLAN_CLAIM_DUPLICATE = 'DB_PLAN_002'; // Duplicate claim submission
export const DB_PLAN_BENEFIT_CONSTRAINT = 'DB_PLAN_003'; // Benefit constraint violation
export const DB_PLAN_DOCUMENT_STORAGE = 'DB_PLAN_004'; // Plan document storage error

/**
 * Gamification database errors
 */
export const DB_GAME_EVENT_INVALID = 'DB_GAME_001'; // Invalid gamification event data
export const DB_GAME_ACHIEVEMENT_CONSTRAINT = 'DB_GAME_002'; // Achievement constraint violation
export const DB_GAME_REWARD_CONSTRAINT = 'DB_GAME_003'; // Reward constraint violation
export const DB_GAME_QUEST_DEPENDENCY = 'DB_GAME_004'; // Quest dependency constraint violation
export const DB_GAME_PROFILE_INTEGRITY = 'DB_GAME_005'; // Gamification profile integrity error