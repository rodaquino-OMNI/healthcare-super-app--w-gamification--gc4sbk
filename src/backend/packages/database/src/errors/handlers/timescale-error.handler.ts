/**
 * TimescaleDB Error Handler
 * 
 * This module provides specialized error handling for TimescaleDB operations used in health metrics
 * and time-series data storage. It identifies TimescaleDB-specific error patterns and codes,
 * classifying them into appropriate categories with emphasis on time-series specific issues.
 * 
 * The handler enriches errors with temporal context including time range, aggregation level,
 * and partitioning information for effective troubleshooting of health data storage issues.
 */

import {
  ClassifiedDatabaseError,
  DatabaseErrorMetadata,
  DatabaseErrorRecoverability,
  DatabaseErrorSeverity,
  DatabaseErrorType,
  JourneyContext,
  JourneyErrorContext,
} from '../database-error.types';

import * as ErrorCodes from '../database-error.codes';

/**
 * Interface for TimescaleDB-specific error metadata.
 */
export interface TimescaleErrorMetadata extends DatabaseErrorMetadata {
  // Time range information for the operation
  timeRange?: {
    start?: Date;
    end?: Date;
  };
  // Aggregation level for time-series data (hourly, daily, etc.)
  aggregationLevel?: string;
  // Chunk information for the operation
  chunkInfo?: {
    chunkId?: string;
    chunkName?: string;
    chunkTimeRange?: {
      start?: Date;
      end?: Date;
    };
    isCompressed?: boolean;
  };
  // Hypertable information
  hypertableInfo?: {
    hypertableId?: string;
    hypertableName?: string;
    partitioningColumn?: string;
    chunkTimeInterval?: string;
  };
  // Compression information
  compressionInfo?: {
    compressionEnabled?: boolean;
    orderByColumns?: string[];
    segmentByColumns?: string[];
  };
}

/**
 * TimescaleDB error patterns for identifying specific error types.
 */
const TIMESCALE_ERROR_PATTERNS = {
  // Chunk-related errors
  CHUNK_NOT_FOUND: /chunk not found|chunk .* does not exist/i,
  CHUNK_CREATION_FAILED: /could not create chunk|failed to create chunk/i,
  CHUNK_ALREADY_EXISTS: /chunk .* already exists/i,
  CHUNK_COMPRESSED: /chunk .* is compressed/i,
  CHUNK_DECOMPRESSION_ERROR: /could not decompress chunk|failed to decompress chunk/i,
  CHUNK_LOCK_ERROR: /could not acquire lock on chunk/i,
  
  // Hypertable configuration errors
  HYPERTABLE_CREATION_ERROR: /could not create hypertable|failed to create hypertable/i,
  HYPERTABLE_NOT_FOUND: /hypertable .* does not exist|not a hypertable/i,
  HYPERTABLE_ALREADY_EXISTS: /table .* is already a hypertable/i,
  INVALID_TIME_COLUMN: /invalid time column|time column .* is not valid/i,
  DIMENSION_ERROR: /invalid dimension|dimension .* is not valid/i,
  
  // Compression errors
  COMPRESSION_ERROR: /could not compress|compression failed/i,
  COMPRESSION_CONFIGURATION_ERROR: /invalid compression configuration|compression configuration error/i,
  SEGMENTBY_ERROR: /invalid segmentby column|segmentby column .* is not valid/i,
  ORDERBY_ERROR: /invalid orderby column|orderby column .* is not valid/i,
  
  // Retention policy errors
  RETENTION_POLICY_ERROR: /retention policy error|could not apply retention policy/i,
  DROP_CHUNKS_ERROR: /could not drop chunks|drop_chunks failed/i,
  
  // Continuous aggregate errors
  CONTINUOUS_AGGREGATE_ERROR: /continuous aggregate error|could not refresh continuous aggregate/i,
  MATERIALIZATION_ERROR: /materialization error|could not materialize view/i,
  
  // Background worker errors
  BACKGROUND_WORKER_ERROR: /background worker error|could not start background worker/i,
  JOB_ERROR: /job error|could not execute job/i,
  
  // Temporary file errors
  TEMP_FILE_LIMIT_ERROR: /temporary file size exceeds temp_file_limit/i,
};

/**
 * Maps TimescaleDB error codes to standardized database error types.
 */
const TIMESCALE_ERROR_CODE_MAP: Record<string, DatabaseErrorType> = {
  'TS001': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Generic TimescaleDB error
  'TS002': DatabaseErrorType.SCHEMA_MISMATCH, // Hypertable schema error
  'TS003': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Chunk operation error
  'TS004': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Compression error
  'TS005': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Continuous aggregate error
  'TS006': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Background worker error
  'TS007': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Job error
  'TS008': DatabaseErrorType.INVALID_CONFIGURATION, // Configuration error
  'TS009': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Dimension error
  'TS010': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Time column error
  'TS011': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Retention policy error
  'TS012': DatabaseErrorType.QUERY_EXECUTION_FAILED, // Temporary file error
};

/**
 * Determines if an error is a TimescaleDB-specific error.
 */
export function isTimescaleError(error: Error | unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for TimescaleDB-specific error patterns
  return (
    errorMessage.includes('timescaledb') ||
    errorMessage.includes('hypertable') ||
    errorMessage.includes('chunk') ||
    errorMessage.includes('continuous aggregate') ||
    errorMessage.includes('compression') ||
    errorMessage.includes('_timescaledb_internal') ||
    errorMessage.includes('_timescaledb_catalog') ||
    Object.values(TIMESCALE_ERROR_PATTERNS).some(pattern => pattern.test(errorMessage))
  );
}

/**
 * Extracts chunk information from an error message.
 */
function extractChunkInfo(errorMessage: string): { chunkId?: string; chunkName?: string } {
  const chunkNameMatch = errorMessage.match(/_hyper_\d+_\d+_chunk|_timescaledb_internal\._hyper_\d+_\d+_chunk/);
  const chunkIdMatch = errorMessage.match(/chunk (\d+)/);
  
  return {
    chunkName: chunkNameMatch ? chunkNameMatch[0] : undefined,
    chunkId: chunkIdMatch ? chunkIdMatch[1] : undefined,
  };
}

/**
 * Extracts hypertable information from an error message.
 */
function extractHypertableInfo(errorMessage: string): { hypertableId?: string; hypertableName?: string } {
  const hypertableNameMatch = errorMessage.match(/hypertable "([^"]+)"|hypertable ([^\s]+)/);
  const hypertableIdMatch = errorMessage.match(/hypertable (\d+)/);
  
  return {
    hypertableName: hypertableNameMatch ? (hypertableNameMatch[1] || hypertableNameMatch[2]) : undefined,
    hypertableId: hypertableIdMatch ? hypertableIdMatch[1] : undefined,
  };
}

/**
 * Determines the error type based on the error message pattern.
 */
function determineErrorType(errorMessage: string): DatabaseErrorType {
  // Check for chunk-related errors
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_NOT_FOUND.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_CREATION_FAILED.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_ALREADY_EXISTS.test(errorMessage)) {
    return DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_COMPRESSED.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_DECOMPRESSION_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_LOCK_ERROR.test(errorMessage)) {
    return DatabaseErrorType.TRANSACTION_DEADLOCK;
  }
  
  // Check for hypertable configuration errors
  if (TIMESCALE_ERROR_PATTERNS.HYPERTABLE_CREATION_ERROR.test(errorMessage)) {
    return DatabaseErrorType.SCHEMA_MISMATCH;
  }
  if (TIMESCALE_ERROR_PATTERNS.HYPERTABLE_NOT_FOUND.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.HYPERTABLE_ALREADY_EXISTS.test(errorMessage)) {
    return DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION;
  }
  if (TIMESCALE_ERROR_PATTERNS.INVALID_TIME_COLUMN.test(errorMessage)) {
    return DatabaseErrorType.SCHEMA_MISMATCH;
  }
  if (TIMESCALE_ERROR_PATTERNS.DIMENSION_ERROR.test(errorMessage)) {
    return DatabaseErrorType.SCHEMA_MISMATCH;
  }
  
  // Check for compression errors
  if (TIMESCALE_ERROR_PATTERNS.COMPRESSION_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.COMPRESSION_CONFIGURATION_ERROR.test(errorMessage)) {
    return DatabaseErrorType.INVALID_CONFIGURATION;
  }
  if (TIMESCALE_ERROR_PATTERNS.SEGMENTBY_ERROR.test(errorMessage)) {
    return DatabaseErrorType.SCHEMA_MISMATCH;
  }
  if (TIMESCALE_ERROR_PATTERNS.ORDERBY_ERROR.test(errorMessage)) {
    return DatabaseErrorType.SCHEMA_MISMATCH;
  }
  
  // Check for retention policy errors
  if (TIMESCALE_ERROR_PATTERNS.RETENTION_POLICY_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.DROP_CHUNKS_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  
  // Check for continuous aggregate errors
  if (TIMESCALE_ERROR_PATTERNS.CONTINUOUS_AGGREGATE_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.MATERIALIZATION_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  
  // Check for background worker errors
  if (TIMESCALE_ERROR_PATTERNS.BACKGROUND_WORKER_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.JOB_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  
  // Check for temporary file errors
  if (TIMESCALE_ERROR_PATTERNS.TEMP_FILE_LIMIT_ERROR.test(errorMessage)) {
    return DatabaseErrorType.QUERY_EXECUTION_FAILED;
  }
  
  // Default error type
  return DatabaseErrorType.UNKNOWN;
}

/**
 * Determines the error code based on the error message and type.
 */
function determineErrorCode(errorMessage: string, errorType: DatabaseErrorType): string {
  // Check for chunk-related errors
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_NOT_FOUND.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_CHUNK_CREATION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_CREATION_FAILED.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_CHUNK_CREATION_FAILED;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_ALREADY_EXISTS.test(errorMessage)) {
    return ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_COMPRESSED.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_COMPRESSION_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_DECOMPRESSION_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_COMPRESSION_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.CHUNK_LOCK_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TRANS_DEADLOCK;
  }
  
  // Check for hypertable configuration errors
  if (TIMESCALE_ERROR_PATTERNS.HYPERTABLE_CREATION_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_HYPERTABLE_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.HYPERTABLE_NOT_FOUND.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_HYPERTABLE_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.HYPERTABLE_ALREADY_EXISTS.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_HYPERTABLE_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.INVALID_TIME_COLUMN.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_INVALID_TIME_COLUMN;
  }
  if (TIMESCALE_ERROR_PATTERNS.DIMENSION_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_DIMENSION_ERROR;
  }
  
  // Check for compression errors
  if (TIMESCALE_ERROR_PATTERNS.COMPRESSION_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_COMPRESSION_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.COMPRESSION_CONFIGURATION_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_COMPRESSION_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.SEGMENTBY_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_COMPRESSION_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.ORDERBY_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_COMPRESSION_ERROR;
  }
  
  // Check for retention policy errors
  if (TIMESCALE_ERROR_PATTERNS.RETENTION_POLICY_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_RETENTION_POLICY_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.DROP_CHUNKS_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_RETENTION_POLICY_ERROR;
  }
  
  // Check for continuous aggregate errors
  if (TIMESCALE_ERROR_PATTERNS.CONTINUOUS_AGGREGATE_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_CONTINUOUS_AGGREGATE_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.MATERIALIZATION_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_CONTINUOUS_AGGREGATE_ERROR;
  }
  
  // Check for background worker errors
  if (TIMESCALE_ERROR_PATTERNS.BACKGROUND_WORKER_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_JOB_SCHEDULING_ERROR;
  }
  if (TIMESCALE_ERROR_PATTERNS.JOB_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_TIMESCALE_JOB_SCHEDULING_ERROR;
  }
  
  // Check for temporary file errors
  if (TIMESCALE_ERROR_PATTERNS.TEMP_FILE_LIMIT_ERROR.test(errorMessage)) {
    return ErrorCodes.DB_CONFIG_INVALID_TIMEOUT;
  }
  
  // Health journey specific errors
  if (errorMessage.includes('health metrics') || errorMessage.includes('health_metrics')) {
    return ErrorCodes.DB_HEALTH_QUERY_METRICS_NOT_FOUND;
  }
  if (errorMessage.includes('health goals') || errorMessage.includes('health_goals')) {
    return ErrorCodes.DB_HEALTH_QUERY_GOAL_NOT_FOUND;
  }
  if (errorMessage.includes('device') || errorMessage.includes('wearable')) {
    return ErrorCodes.DB_HEALTH_QUERY_DEVICE_NOT_FOUND;
  }
  
  // Default error code based on error type
  switch (errorType) {
    case DatabaseErrorType.SCHEMA_MISMATCH:
      return ErrorCodes.DB_TIMESCALE_HYPERTABLE_ERROR;
    case DatabaseErrorType.QUERY_EXECUTION_FAILED:
      return ErrorCodes.DB_QUERY_EXECUTION_FAILED;
    case DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION:
      return ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION;
    case DatabaseErrorType.INVALID_CONFIGURATION:
      return ErrorCodes.DB_CONFIG_INVALID_SCHEMA;
    case DatabaseErrorType.TRANSACTION_DEADLOCK:
      return ErrorCodes.DB_TRANS_DEADLOCK;
    default:
      return ErrorCodes.DB_QUERY_EXECUTION_FAILED;
  }
}

/**
 * Determines the error severity based on the error type.
 */
function determineErrorSeverity(errorType: DatabaseErrorType): DatabaseErrorSeverity {
  switch (errorType) {
    case DatabaseErrorType.CONNECTION_FAILED:
    case DatabaseErrorType.CONNECTION_TIMEOUT:
    case DatabaseErrorType.CONNECTION_LIMIT_REACHED:
    case DatabaseErrorType.CONNECTION_CLOSED:
    case DatabaseErrorType.TRANSACTION_BEGIN_FAILED:
    case DatabaseErrorType.TRANSACTION_COMMIT_FAILED:
    case DatabaseErrorType.TRANSACTION_ROLLBACK_FAILED:
    case DatabaseErrorType.TRANSACTION_TIMEOUT:
    case DatabaseErrorType.TRANSACTION_DEADLOCK:
    case DatabaseErrorType.INVALID_CONFIGURATION:
    case DatabaseErrorType.MISSING_CONFIGURATION:
    case DatabaseErrorType.SCHEMA_MISMATCH:
    case DatabaseErrorType.MIGRATION_FAILED:
      return DatabaseErrorSeverity.CRITICAL;
      
    case DatabaseErrorType.QUERY_SYNTAX:
    case DatabaseErrorType.QUERY_TIMEOUT:
    case DatabaseErrorType.QUERY_EXECUTION_FAILED:
    case DatabaseErrorType.QUERY_RESULT_ERROR:
    case DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION:
    case DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION:
    case DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION:
    case DatabaseErrorType.NOT_NULL_CONSTRAINT_VIOLATION:
      return DatabaseErrorSeverity.MAJOR;
      
    case DatabaseErrorType.DATA_VALIDATION_FAILED:
    default:
      return DatabaseErrorSeverity.MINOR;
  }
}

/**
 * Determines the error recoverability based on the error type and message.
 */
function determineErrorRecoverability(errorType: DatabaseErrorType, errorMessage: string): DatabaseErrorRecoverability {
  // Transient errors that can be retried
  if (
    errorType === DatabaseErrorType.CONNECTION_TIMEOUT ||
    errorType === DatabaseErrorType.CONNECTION_LIMIT_REACHED ||
    errorType === DatabaseErrorType.QUERY_TIMEOUT ||
    errorType === DatabaseErrorType.TRANSACTION_TIMEOUT ||
    errorType === DatabaseErrorType.TRANSACTION_DEADLOCK ||
    TIMESCALE_ERROR_PATTERNS.CHUNK_LOCK_ERROR.test(errorMessage) ||
    TIMESCALE_ERROR_PATTERNS.TEMP_FILE_LIMIT_ERROR.test(errorMessage) ||
    errorMessage.includes('could not acquire lock') ||
    errorMessage.includes('deadlock detected') ||
    errorMessage.includes('connection timeout') ||
    errorMessage.includes('too many connections')
  ) {
    return DatabaseErrorRecoverability.TRANSIENT;
  }
  
  // Permanent errors that cannot be retried
  if (
    errorType === DatabaseErrorType.SCHEMA_MISMATCH ||
    errorType === DatabaseErrorType.INVALID_CONFIGURATION ||
    errorType === DatabaseErrorType.MISSING_CONFIGURATION ||
    errorType === DatabaseErrorType.QUERY_SYNTAX ||
    errorType === DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION ||
    errorType === DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION ||
    errorType === DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION ||
    errorType === DatabaseErrorType.NOT_NULL_CONSTRAINT_VIOLATION ||
    errorType === DatabaseErrorType.DATA_VALIDATION_FAILED ||
    TIMESCALE_ERROR_PATTERNS.HYPERTABLE_CREATION_ERROR.test(errorMessage) ||
    TIMESCALE_ERROR_PATTERNS.HYPERTABLE_NOT_FOUND.test(errorMessage) ||
    TIMESCALE_ERROR_PATTERNS.HYPERTABLE_ALREADY_EXISTS.test(errorMessage) ||
    TIMESCALE_ERROR_PATTERNS.INVALID_TIME_COLUMN.test(errorMessage) ||
    TIMESCALE_ERROR_PATTERNS.DIMENSION_ERROR.test(errorMessage) ||
    TIMESCALE_ERROR_PATTERNS.COMPRESSION_CONFIGURATION_ERROR.test(errorMessage) ||
    TIMESCALE_ERROR_PATTERNS.SEGMENTBY_ERROR.test(errorMessage) ||
    TIMESCALE_ERROR_PATTERNS.ORDERBY_ERROR.test(errorMessage)
  ) {
    return DatabaseErrorRecoverability.PERMANENT;
  }
  
  // Default to unknown recoverability
  return DatabaseErrorRecoverability.UNKNOWN;
}

/**
 * Enriches the error metadata with TimescaleDB-specific information.
 */
function enrichErrorMetadata(
  error: Error | unknown,
  metadata?: Partial<DatabaseErrorMetadata>,
): TimescaleErrorMetadata {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const enrichedMetadata: TimescaleErrorMetadata = {
    ...metadata,
    originalError: error instanceof Error ? error : new Error(errorMessage),
    timestamp: new Date(),
  };
  
  // Extract chunk information
  const chunkInfo = extractChunkInfo(errorMessage);
  if (chunkInfo.chunkId || chunkInfo.chunkName) {
    enrichedMetadata.chunkInfo = {
      ...enrichedMetadata.chunkInfo,
      chunkId: chunkInfo.chunkId,
      chunkName: chunkInfo.chunkName,
      isCompressed: errorMessage.includes('compressed'),
    };
  }
  
  // Extract hypertable information
  const hypertableInfo = extractHypertableInfo(errorMessage);
  if (hypertableInfo.hypertableId || hypertableInfo.hypertableName) {
    enrichedMetadata.hypertableInfo = {
      ...enrichedMetadata.hypertableInfo,
      hypertableId: hypertableInfo.hypertableId,
      hypertableName: hypertableInfo.hypertableName,
    };
  }
  
  // Extract time range information from error message
  const timeRangeMatch = errorMessage.match(/time range \[(.*?)\]|between (.*?) and (.*?)/);
  if (timeRangeMatch) {
    const timeRangeStr = timeRangeMatch[1] || `${timeRangeMatch[2]} and ${timeRangeMatch[3]}`;
    const [startStr, endStr] = timeRangeStr.split(' and ');
    
    enrichedMetadata.timeRange = {
      ...enrichedMetadata.timeRange,
      start: startStr ? new Date(startStr) : undefined,
      end: endStr ? new Date(endStr) : undefined,
    };
  }
  
  // Extract compression information
  if (errorMessage.includes('compression')) {
    const orderByMatch = errorMessage.match(/orderby \[(.*?)\]/);
    const segmentByMatch = errorMessage.match(/segmentby \[(.*?)\]/);
    
    enrichedMetadata.compressionInfo = {
      ...enrichedMetadata.compressionInfo,
      compressionEnabled: true,
      orderByColumns: orderByMatch ? orderByMatch[1].split(',').map(col => col.trim()) : undefined,
      segmentByColumns: segmentByMatch ? segmentByMatch[1].split(',').map(col => col.trim()) : undefined,
    };
  }
  
  // Extract aggregation level information
  const aggregationMatch = errorMessage.match(/aggregation level ['"]?(hourly|daily|weekly|monthly|yearly)['"]?/);
  if (aggregationMatch) {
    enrichedMetadata.aggregationLevel = aggregationMatch[1];
  }
  
  return enrichedMetadata;
}

/**
 * Classifies a TimescaleDB error into a standardized database error.
 */
export function classifyTimescaleError(
  error: Error | unknown,
  journeyContext?: Partial<JourneyErrorContext>,
  metadata?: Partial<DatabaseErrorMetadata>,
): ClassifiedDatabaseError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Determine error type, code, severity, and recoverability
  const errorType = determineErrorType(errorMessage);
  const errorCode = determineErrorCode(errorMessage, errorType);
  const errorSeverity = determineErrorSeverity(errorType);
  const errorRecoverability = determineErrorRecoverability(errorType, errorMessage);
  
  // Enrich metadata with TimescaleDB-specific information
  const enrichedMetadata = enrichErrorMetadata(error, metadata);
  
  // Create journey context with defaults
  const defaultJourneyContext: JourneyErrorContext = {
    journey: JourneyContext.HEALTH,
    feature: 'health-metrics',
    userVisible: false,
    ...journeyContext,
  };
  
  // Create classified error
  return {
    type: errorType,
    severity: errorSeverity,
    recoverability: errorRecoverability,
    message: errorMessage,
    code: errorCode,
    journeyContext: defaultJourneyContext,
    metadata: enrichedMetadata,
  };
}

/**
 * TimescaleDB Error Handler class for handling TimescaleDB-specific errors.
 */
export class TimescaleErrorHandler {
  /**
   * Checks if the given error is a TimescaleDB-specific error.
   */
  public isTimescaleError(error: Error | unknown): boolean {
    return isTimescaleError(error);
  }
  
  /**
   * Classifies a TimescaleDB error into a standardized database error.
   */
  public classifyError(
    error: Error | unknown,
    journeyContext?: Partial<JourneyErrorContext>,
    metadata?: Partial<DatabaseErrorMetadata>,
  ): ClassifiedDatabaseError {
    return classifyTimescaleError(error, journeyContext, metadata);
  }
  
  /**
   * Enriches an error with TimescaleDB-specific metadata.
   */
  public enrichErrorMetadata(
    error: Error | unknown,
    metadata?: Partial<DatabaseErrorMetadata>,
  ): TimescaleErrorMetadata {
    return enrichErrorMetadata(error, metadata);
  }
  
  /**
   * Determines if a TimescaleDB error is retryable.
   */
  public isRetryableError(error: Error | unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = determineErrorType(errorMessage);
    const errorRecoverability = determineErrorRecoverability(errorType, errorMessage);
    
    return errorRecoverability === DatabaseErrorRecoverability.TRANSIENT;
  }
  
  /**
   * Gets the recommended retry delay for a TimescaleDB error.
   */
  public getRetryDelay(error: Error | unknown, attempt: number): number {
    // Base delay of 100ms with exponential backoff and jitter
    const baseDelay = 100;
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    
    return Math.floor(exponentialDelay + jitter);
  }
  
  /**
   * Gets the maximum number of retry attempts for a TimescaleDB error.
   */
  public getMaxRetryAttempts(error: Error | unknown): number {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Higher retry limits for transient errors like locks and timeouts
    if (
      TIMESCALE_ERROR_PATTERNS.CHUNK_LOCK_ERROR.test(errorMessage) ||
      errorMessage.includes('could not acquire lock') ||
      errorMessage.includes('deadlock detected')
    ) {
      return 10; // More retries for lock-related errors
    }
    
    if (
      TIMESCALE_ERROR_PATTERNS.TEMP_FILE_LIMIT_ERROR.test(errorMessage) ||
      errorMessage.includes('connection timeout') ||
      errorMessage.includes('too many connections')
    ) {
      return 5; // Moderate retries for resource-related errors
    }
    
    // Default retry attempts
    return 3;
  }
}

export default new TimescaleErrorHandler();