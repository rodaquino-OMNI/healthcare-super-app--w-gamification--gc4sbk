/**
 * TimescaleDB Error Handler
 * 
 * Provides specialized error handling for TimescaleDB operations used in health metrics
 * and time-series data storage. This handler identifies TimescaleDB-specific error patterns
 * and codes, classifying them into appropriate categories with emphasis on time-series
 * specific issues like chunk insertion errors, retention policy conflicts, and hypertable
 * configuration problems.
 * 
 * It enriches errors with temporal context including time range, aggregation level, and
 * partitioning information for effective troubleshooting of health data storage issues.
 */

import {
  ConnectionException,
  ConfigurationException,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  DatabaseOperationContext,
  IntegrityException,
  JourneyContext,
  QueryException,
  TransactionException,
  JourneyDatabaseException
} from '../database-error.exception';
import * as ErrorCodes from '../database-error.codes';
import { DatabaseErrorContext, DatabaseErrorClassification, DatabaseErrorType } from '../database-error.types';

/**
 * Interface for database error handlers.
 * Defines the common contract that all database error handlers must implement.
 */
interface IDatabaseErrorHandler {
  /**
   * Handles a database error by classifying it and transforming it into a standardized exception.
   * 
   * @param error - The original error to handle
   * @param context - Optional context information about the operation that caused the error
   * @returns A standardized error classification result
   */
  handleError(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification;
  
  /**
   * Determines if this handler can process the given error.
   * 
   * @param error - The error to check
   * @returns True if this handler can process the error, false otherwise
   */
  canHandle(error: Error): boolean;
  
  /**
   * Enriches an error with additional context information.
   * 
   * @param error - The error to enrich
   * @param context - Context information to add to the error
   * @returns The enriched error
   */
  enrichError(error: Error, context: DatabaseErrorContext): Error;
}

/**
 * Interface for TimescaleDB-specific error context
 */
export interface TimescaleErrorContext {
  /**
   * The time range for the operation (start and end timestamps)
   */
  timeRange?: {
    start?: Date | string;
    end?: Date | string;
  };

  /**
   * The time bucket or aggregation level (e.g., '1 hour', '1 day')
   */
  timeBucket?: string;

  /**
   * The chunk interval configuration
   */
  chunkInterval?: string;

  /**
   * The hypertable name
   */
  hypertable?: string;

  /**
   * The compression settings
   */
  compression?: {
    enabled: boolean;
    chunkTimeInterval?: string;
    compressionScheduleInterval?: string;
  };

  /**
   * The retention policy settings
   */
  retentionPolicy?: {
    enabled: boolean;
    interval?: string;
  };

  /**
   * The continuous aggregate configuration
   */
  continuousAggregate?: {
    name?: string;
    refreshInterval?: string;
    materialized?: boolean;
  };

  /**
   * The partitioning information
   */
  partitioning?: {
    timeColumn: string;
    spaceColumn?: string;
    partitioningFunc?: string;
    numberOfPartitions?: number;
  };

  /**
   * The metric type (e.g., 'heart_rate', 'steps', 'blood_pressure')
   */
  metricType?: string;

  /**
   * The data source (e.g., 'manual', 'wearable', 'medical_device')
   */
  dataSource?: string;
}

/**
 * Extended database operation context with TimescaleDB-specific information
 */
export interface TimescaleOperationContext extends DatabaseOperationContext {
  /**
   * TimescaleDB-specific context
   */
  timescale?: TimescaleErrorContext;
}

/**
 * Error handler for TimescaleDB-specific errors
 */
export class TimescaleErrorHandler implements IDatabaseErrorHandler {
  /**
   * Handles a database error by classifying it and transforming it into a standardized exception.
   * 
   * @param error - The original error to handle
   * @param context - Optional context information about the operation that caused the error
   * @returns A standardized error classification result
   */
  handleError(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification {
    // Extract journey context if available
    const journeyContext: JourneyContext = {
      journey: context?.journey,
      feature: context?.feature,
      userId: context?.userId
    };
    
    // Extract TimescaleDB-specific context if available
    const timescaleContext = (context as TimescaleOperationContext)?.timescale;
    
    // Convert operation context
    const operationContext: TimescaleOperationContext = {
      operation: context?.operation,
      entity: context?.entity,
      query: context?.query,
      params: context?.params,
      timescale: timescaleContext
    };
    
    // Handle the error using the static method
    const handledError = TimescaleErrorHandler.handleError(error, operationContext, journeyContext);
    
    // Convert the handled error to a classification result
    if (handledError instanceof Error) {
      if ('type' in handledError && 'code' in handledError && 'severity' in handledError && 'recoverability' in handledError) {
        // It's already a DatabaseException or similar
        const dbError = handledError as any;
        return {
          type: dbError.type,
          severity: dbError.severity,
          recoverability: dbError.recoverability,
          code: dbError.code,
          message: dbError.message,
          details: {
            originalError: error.message,
            context: dbError.context || context,
            journeyContext: dbError.journeyContext || journeyContext
          }
        };
      }
      
      // It's a regular error, create a default classification
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_QUERY_TS_HYPERTABLE_ERROR,
        message: handledError.message,
        details: {
          originalError: error.message,
          context,
          journeyContext
        }
      };
    }
    
    // This shouldn't happen, but provide a fallback
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_QUERY_TS_HYPERTABLE_ERROR,
      message: error.message,
      details: {
        originalError: error.message,
        context,
        journeyContext
      }
    };
  }
  
  /**
   * Determines if this handler can process the given error.
   * 
   * @param error - The error to check
   * @returns True if this handler can process the error, false otherwise
   */
  canHandle(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    return (
      // Check for TimescaleDB-specific keywords in the error message
      errorMessage.includes('timescale') ||
      errorMessage.includes('hypertable') ||
      errorMessage.includes('chunk') ||
      errorMessage.includes('time_bucket') ||
      errorMessage.includes('continuous aggregate') ||
      errorMessage.includes('compression') ||
      errorMessage.includes('retention policy') ||
      // Check for TimescaleDB-specific error codes
      errorMessage.includes('ts_') ||
      // Check for TimescaleDB extension errors
      errorMessage.includes('extension "timescaledb"')
    );
  }
  
  /**
   * Enriches an error with additional context information.
   * 
   * @param error - The error to enrich
   * @param context - Context information to add to the error
   * @returns The enriched error
   */
  enrichError(error: Error, context: DatabaseErrorContext): Error {
    // Extract journey context if available
    const journeyContext: JourneyContext = {
      journey: context?.journey,
      feature: context?.feature,
      userId: context?.userId
    };
    
    // Extract TimescaleDB-specific context if available
    const timescaleContext = (context as TimescaleOperationContext)?.timescale;
    
    // Convert operation context
    const operationContext: TimescaleOperationContext = {
      operation: context?.operation,
      entity: context?.entity,
      query: context?.query,
      params: context?.params,
      timescale: timescaleContext
    };
    
    // Use the static method to enrich the error
    return TimescaleErrorHandler.enrichErrorWithTimescaleContext(error, operationContext, journeyContext, timescaleContext);
  }
  
  /**
   * Handles TimescaleDB-specific errors and converts them to appropriate exceptions
   * 
   * @param error - The original error
   * @param context - Operation context including TimescaleDB-specific information
   * @param journeyContext - Journey context information
   * @returns Appropriate database exception
   */
  public static handleError(
    error: Error,
    context?: TimescaleOperationContext,
    journeyContext?: JourneyContext
  ): Error {
    // Extract TimescaleDB-specific context
    const timescaleContext = context?.timescale || {};
    
    // Check if this is a TimescaleDB-specific error
    if (this.isTimescaleError(error)) {
      return this.handleTimescaleError(error, context, journeyContext, timescaleContext);
    }
    
    // Handle PostgreSQL errors that might be related to TimescaleDB
    if (this.isPostgresError(error)) {
      return this.handlePostgresError(error, context, journeyContext, timescaleContext);
    }
    
    // Enrich generic errors with TimescaleDB context
    return this.enrichErrorWithTimescaleContext(error, context, journeyContext, timescaleContext);
  }

  /**
   * Checks if an error is a TimescaleDB-specific error
   * 
   * @param error - The error to check
   * @returns True if the error is TimescaleDB-specific
   */
  private static isTimescaleError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    return (
      // Check for TimescaleDB-specific keywords in the error message
      errorMessage.includes('timescale') ||
      errorMessage.includes('hypertable') ||
      errorMessage.includes('chunk') ||
      errorMessage.includes('time_bucket') ||
      errorMessage.includes('continuous aggregate') ||
      errorMessage.includes('compression') ||
      errorMessage.includes('retention policy') ||
      // Check for TimescaleDB-specific error codes
      errorMessage.includes('ts_') ||
      // Check for TimescaleDB extension errors
      errorMessage.includes('extension "timescaledb"')
    );
  }

  /**
   * Checks if an error is a PostgreSQL error
   * 
   * @param error - The error to check
   * @returns True if the error is a PostgreSQL error
   */
  private static isPostgresError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    return (
      // Check for PostgreSQL error codes
      /error: .*?\b\d{5}\b/i.test(errorMessage) ||
      // Check for common PostgreSQL error messages
      errorMessage.includes('postgresql') ||
      errorMessage.includes('pg') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('column') ||
      errorMessage.includes('database') ||
      errorMessage.includes('syntax error')
    );
  }

  /**
   * Handles TimescaleDB-specific errors
   * 
   * @param error - The original error
   * @param context - Operation context
   * @param journeyContext - Journey context information
   * @param timescaleContext - TimescaleDB-specific context
   * @returns Appropriate database exception
   */
  private static handleTimescaleError(
    error: Error,
    context?: TimescaleOperationContext,
    journeyContext?: JourneyContext,
    timescaleContext?: TimescaleErrorContext
  ): Error {
    const errorMessage = error.message.toLowerCase();
    const operationContext: TimescaleOperationContext = {
      ...context,
      timescale: timescaleContext
    };
    
    // Handle hypertable errors
    if (
      errorMessage.includes('hypertable') ||
      errorMessage.includes('create_hypertable')
    ) {
      if (errorMessage.includes('already exists')) {
        return new ConfigurationException(
          'Hypertable already exists',
          ErrorCodes.DB_CONFIG_TS_INVALID_CHUNK,
          DatabaseErrorSeverity.MINOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Use an existing hypertable or drop it before recreating',
          error
        );
      }
      
      if (errorMessage.includes('not empty')) {
        return new ConfigurationException(
          'Cannot convert non-empty table to hypertable',
          ErrorCodes.DB_CONFIG_TS_INVALID_CHUNK,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Create a new empty table or migrate data to a new hypertable',
          error
        );
      }
      
      if (errorMessage.includes('invalid dimension')) {
        return new ConfigurationException(
          'Invalid dimension for hypertable',
          ErrorCodes.DB_CONFIG_TS_INVALID_CHUNK,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Check that the time column exists and has the correct data type',
          error
        );
      }
      
      return new ConfigurationException(
        'Hypertable configuration error',
        ErrorCodes.DB_CONFIG_TS_INVALID_CHUNK,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check hypertable configuration parameters',
        error
      );
    }
    
    // Handle chunk errors
    if (errorMessage.includes('chunk')) {
      if (errorMessage.includes('no chunks')) {
        return new QueryException(
          'No chunks found for the specified time range',
          ErrorCodes.DB_QUERY_TS_CHUNK_ERROR,
          DatabaseErrorSeverity.MINOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Verify that data exists for the specified time range',
          error
        );
      }
      
      if (errorMessage.includes('drop_chunks')) {
        return new QueryException(
          'Error dropping chunks',
          ErrorCodes.DB_QUERY_TS_CHUNK_ERROR,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Check that the specified time range is valid and chunks exist',
          error
        );
      }
      
      return new QueryException(
        'Chunk operation error',
        ErrorCodes.DB_QUERY_TS_CHUNK_ERROR,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check chunk operation parameters and permissions',
        error
      );
    }
    
    // Handle compression errors
    if (errorMessage.includes('compression')) {
      if (errorMessage.includes('already compressed')) {
        return new QueryException(
          'Chunk is already compressed',
          ErrorCodes.DB_QUERY_TS_CHUNK_ERROR,
          DatabaseErrorSeverity.MINOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Skip compression for this chunk or use force parameter',
          error
        );
      }
      
      if (errorMessage.includes('cannot compress')) {
        return new QueryException(
          'Cannot compress chunk',
          ErrorCodes.DB_QUERY_TS_CHUNK_ERROR,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Check that the chunk is eligible for compression',
          error
        );
      }
      
      return new ConfigurationException(
        'Compression configuration error',
        ErrorCodes.DB_CONFIG_TS_INVALID_CHUNK,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check compression settings and ensure TimescaleDB is properly configured',
        error
      );
    }
    
    // Handle continuous aggregate errors
    if (errorMessage.includes('continuous') || errorMessage.includes('aggregate')) {
      if (errorMessage.includes('already exists')) {
        return new ConfigurationException(
          'Continuous aggregate already exists',
          ErrorCodes.DB_CONFIG_TS_INVALID_RETENTION,
          DatabaseErrorSeverity.MINOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Use an existing continuous aggregate or drop it before recreating',
          error
        );
      }
      
      if (errorMessage.includes('refresh')) {
        return new QueryException(
          'Error refreshing continuous aggregate',
          ErrorCodes.DB_QUERY_TS_HYPERTABLE_ERROR,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.TRANSIENT,
          journeyContext,
          operationContext,
          'Check the time range for refresh and try again with a smaller range',
          error
        );
      }
      
      return new ConfigurationException(
        'Continuous aggregate configuration error',
        ErrorCodes.DB_CONFIG_TS_INVALID_RETENTION,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check continuous aggregate configuration parameters',
        error
      );
    }
    
    // Handle retention policy errors
    if (errorMessage.includes('retention')) {
      return new ConfigurationException(
        'Retention policy configuration error',
        ErrorCodes.DB_CONFIG_TS_INVALID_RETENTION,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check retention policy settings and ensure they do not conflict with other policies',
        error
      );
    }
    
    // Handle time bucket errors
    if (errorMessage.includes('time_bucket')) {
      return new QueryException(
        'Time bucket function error',
        ErrorCodes.DB_QUERY_TS_HYPERTABLE_ERROR,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check time bucket parameters and ensure the column type is compatible',
        error
      );
    }
    
    // Handle extension errors
    if (errorMessage.includes('extension "timescaledb"')) {
      if (errorMessage.includes('does not exist')) {
        return new ConfigurationException(
          'TimescaleDB extension is not installed',
          ErrorCodes.DB_CONN_TS_EXTENSION_MISSING,
          DatabaseErrorSeverity.CRITICAL,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Install TimescaleDB extension on the database server',
          error
        );
      }
      
      return new ConfigurationException(
        'TimescaleDB extension error',
        ErrorCodes.DB_CONN_TS_EXTENSION_MISSING,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check TimescaleDB extension installation and version compatibility',
        error
      );
    }
    
    // Default TimescaleDB error
    return new QueryException(
      `TimescaleDB operation error: ${error.message}`,
      ErrorCodes.DB_QUERY_TS_HYPERTABLE_ERROR,
      DatabaseErrorSeverity.MAJOR,
      DatabaseErrorRecoverability.PERMANENT,
      journeyContext,
      operationContext,
      'Check TimescaleDB operation parameters and permissions',
      error
    );
  }

  /**
   * Handles PostgreSQL errors that might be related to TimescaleDB
   * 
   * @param error - The original error
   * @param context - Operation context
   * @param journeyContext - Journey context information
   * @param timescaleContext - TimescaleDB-specific context
   * @returns Appropriate database exception
   */
  private static handlePostgresError(
    error: Error,
    context?: TimescaleOperationContext,
    journeyContext?: JourneyContext,
    timescaleContext?: TimescaleErrorContext
  ): Error {
    const errorMessage = error.message.toLowerCase();
    const operationContext: TimescaleOperationContext = {
      ...context,
      timescale: timescaleContext
    };
    
    // Extract PostgreSQL error code if present
    const pgErrorCodeMatch = errorMessage.match(/error: .*?\b(\d{5})\b/i);
    const pgErrorCode = pgErrorCodeMatch ? pgErrorCodeMatch[1] : null;
    
    // Handle specific PostgreSQL error codes
    if (pgErrorCode) {
      // Class 42 — Syntax Error or Access Rule Violation
      if (pgErrorCode.startsWith('42')) {
        // 42P01: undefined_table
        if (pgErrorCode === '42P01' && this.isLikelyTimescaleTable(context, timescaleContext)) {
          return new ConfigurationException(
            'TimescaleDB hypertable does not exist',
            ErrorCodes.DB_CONFIG_TS_INVALID_CHUNK,
            DatabaseErrorSeverity.MAJOR,
            DatabaseErrorRecoverability.PERMANENT,
            journeyContext,
            operationContext,
            'Create the hypertable before performing operations on it',
            error
          );
        }
        
        // 42P13: invalid_column_reference
        if (pgErrorCode === '42P13' && this.isLikelyTimeColumn(errorMessage, timescaleContext)) {
          return new QueryException(
            'Invalid time column reference in TimescaleDB query',
            ErrorCodes.DB_QUERY_TS_HYPERTABLE_ERROR,
            DatabaseErrorSeverity.MAJOR,
            DatabaseErrorRecoverability.PERMANENT,
            journeyContext,
            operationContext,
            'Check that the time column exists and is properly referenced in the query',
            error
          );
        }
      }
      
      // Class 23 — Integrity Constraint Violation
      if (pgErrorCode.startsWith('23')) {
        // Handle constraint violations that might be related to TimescaleDB chunks
        if (this.isLikelyChunkConstraint(errorMessage, timescaleContext)) {
          return new IntegrityException(
            'TimescaleDB chunk constraint violation',
            ErrorCodes.DB_INTEG_TS_UNIQUE,
            DatabaseErrorSeverity.MAJOR,
            DatabaseErrorRecoverability.PERMANENT,
            journeyContext,
            operationContext,
            'Check that the data satisfies all constraints for the hypertable',
            error
          );
        }
      }
      
      // Class 08 — Connection Exception
      if (pgErrorCode.startsWith('08')) {
        return new ConnectionException(
          'Connection error to TimescaleDB',
          ErrorCodes.DB_CONN_TS_FAILED,
          DatabaseErrorSeverity.CRITICAL,
          DatabaseErrorRecoverability.TRANSIENT,
          journeyContext,
          operationContext,
          'Check database connection settings and ensure TimescaleDB is running',
          error
        );
      }
      
      // Class 57 — Operator Intervention
      if (pgErrorCode.startsWith('57')) {
        // 57014: query_canceled
        if (pgErrorCode === '57014') {
          return new QueryException(
            'TimescaleDB query canceled',
            ErrorCodes.DB_QUERY_TS_TIMEOUT,
            DatabaseErrorSeverity.MAJOR,
            DatabaseErrorRecoverability.TRANSIENT,
            journeyContext,
            operationContext,
            'The query was canceled due to timeout or user intervention. Try with a smaller time range or optimize the query.',
            error
          );
        }
      }
      
      // Class 40 — Transaction Rollback
      if (pgErrorCode.startsWith('40')) {
        return new TransactionException(
          'TimescaleDB transaction error',
          ErrorCodes.DB_TRANS_PG_ROLLBACK_FAILED,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.TRANSIENT,
          journeyContext,
          operationContext,
          'The transaction was rolled back. Check for deadlocks or serialization failures.',
          error
        );
      }
    }
    
    // Check for health metrics specific errors
    if (
      journeyContext?.journey === 'health' &&
      (timescaleContext?.metricType || context?.entity?.includes('metric'))
    ) {
      return new JourneyDatabaseException(
        `Health metric storage error: ${error.message}`,
        ErrorCodes.DB_HEALTH_TIMESERIES_ERROR,
        'health',
        'metrics',
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        operationContext,
        'Check that the health metric data is valid and properly formatted',
        { metricType: timescaleContext?.metricType },
        error
      );
    }
    
    // Default to enriching the error with TimescaleDB context
    return this.enrichErrorWithTimescaleContext(error, context, journeyContext, timescaleContext);
  }

  /**
   * Enriches a generic error with TimescaleDB context
   * 
   * @param error - The original error
   * @param context - Operation context
   * @param journeyContext - Journey context information
   * @param timescaleContext - TimescaleDB-specific context
   * @returns Enriched error
   */
  private static enrichErrorWithTimescaleContext(
    error: Error,
    context?: TimescaleOperationContext,
    journeyContext?: JourneyContext,
    timescaleContext?: TimescaleErrorContext
  ): Error {
    // If error is already a DatabaseException, just enrich the context
    if (error instanceof ConnectionException ||
        error instanceof QueryException ||
        error instanceof TransactionException ||
        error instanceof IntegrityException ||
        error instanceof ConfigurationException ||
        error instanceof JourneyDatabaseException) {
      // Already a database exception, just return it
      return error;
    }
    
    // Create operation context with TimescaleDB information
    const operationContext: TimescaleOperationContext = {
      ...context,
      timescale: timescaleContext
    };
    
    // Create a generic database exception with TimescaleDB context
    return new QueryException(
      `Database operation error: ${error.message}`,
      ErrorCodes.DB_QUERY_TS_HYPERTABLE_ERROR,
      DatabaseErrorSeverity.MAJOR,
      DatabaseErrorRecoverability.PERMANENT,
      journeyContext,
      operationContext,
      'Check operation parameters and database permissions',
      error
    );
  }

  /**
   * Checks if an error is likely related to a TimescaleDB table
   * 
   * @param context - Operation context
   * @param timescaleContext - TimescaleDB-specific context
   * @returns True if the error is likely related to a TimescaleDB table
   */
  private static isLikelyTimescaleTable(
    context?: TimescaleOperationContext,
    timescaleContext?: TimescaleErrorContext
  ): boolean {
    // Check if the entity or hypertable name suggests a TimescaleDB table
    return !!(
      timescaleContext?.hypertable ||
      context?.entity?.includes('metric') ||
      context?.entity?.includes('measurement') ||
      context?.entity?.includes('time_series') ||
      context?.entity?.includes('timeseries') ||
      context?.entity?.includes('health_data')
    );
  }

  /**
   * Checks if an error is likely related to a time column
   * 
   * @param errorMessage - The error message
   * @param timescaleContext - TimescaleDB-specific context
   * @returns True if the error is likely related to a time column
   */
  private static isLikelyTimeColumn(
    errorMessage: string,
    timescaleContext?: TimescaleErrorContext
  ): boolean {
    // Check if the error message or context suggests a time column issue
    const timeColumnName = timescaleContext?.partitioning?.timeColumn || 'time';
    
    return (
      errorMessage.includes(timeColumnName) ||
      errorMessage.includes('timestamp') ||
      errorMessage.includes('date') ||
      errorMessage.includes('interval')
    );
  }

  /**
   * Checks if an error is likely related to a TimescaleDB chunk constraint
   * 
   * @param errorMessage - The error message
   * @param timescaleContext - TimescaleDB-specific context
   * @returns True if the error is likely related to a chunk constraint
   */
  private static isLikelyChunkConstraint(
    errorMessage: string,
    timescaleContext?: TimescaleErrorContext
  ): boolean {
    // Check if the error message suggests a chunk constraint issue
    return (
      errorMessage.includes('_chunk_') ||
      errorMessage.includes('constraint') && (
        timescaleContext?.hypertable ||
        timescaleContext?.chunkInterval
      )
    );
  }

  /**
   * Creates a TimescaleDB error context object with time-series specific information
   * 
   * @param timeRange - The time range for the operation
   * @param timeBucket - The time bucket or aggregation level
   * @param hypertable - The hypertable name
   * @param metricType - The metric type
   * @param additionalContext - Additional TimescaleDB-specific context
   * @returns TimescaleDB error context
   */
  public static createTimescaleContext(
    timeRange?: { start?: Date | string; end?: Date | string },
    timeBucket?: string,
    hypertable?: string,
    metricType?: string,
    additionalContext?: Partial<TimescaleErrorContext>
  ): TimescaleErrorContext {
    return {
      timeRange,
      timeBucket,
      hypertable,
      metricType,
      ...additionalContext
    };
  }

  /**
   * Creates a health journey context for TimescaleDB operations
   * 
   * @param feature - The specific feature within the health journey
   * @param userId - The user ID associated with the operation
   * @param additionalContext - Additional journey-specific context
   * @returns Journey context for health data
   */
  public static createHealthJourneyContext(
    feature: string,
    userId?: string,
    additionalContext: Record<string, any> = {}
  ): JourneyContext {
    return {
      journey: 'health',
      feature,
      userId,
      ...additionalContext
    };
  }
}