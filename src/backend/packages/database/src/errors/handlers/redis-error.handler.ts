/**
 * @file redis-error.handler.ts
 * @description Specialized error handler for Redis cache and session storage operations.
 * Identifies and classifies Redis-specific errors, converting them to standardized
 * DatabaseException types with appropriate error codes and recovery strategies.
 */

import { Logger } from '@nestjs/common';
import {
  ConnectionException,
  ConfigurationException,
  DatabaseException,
  QueryException,
  TransactionException,
  IntegrityException,
  JourneyDatabaseException,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  JourneyContext,
  DatabaseOperationContext
} from '../database-error.exception';
import {
  DatabaseErrorType,
  DatabaseErrorContext,
  DatabaseErrorClassification,
  createJourneyContext,
  createOperationContext
} from '../database-error.types';
import * as ErrorCodes from '../database-error.codes';
import { RetryStrategyFactory, CircuitBreakerStrategy, ExponentialBackoffStrategy } from '../retry-strategies';

/**
 * Interface for Redis command context
 */
export interface RedisCommandContext {
  /**
   * The Redis command being executed
   */
  command: string;
  
  /**
   * The key or key pattern being accessed
   */
  key?: string;
  
  /**
   * The Redis database index
   */
  db?: number;
  
  /**
   * Whether this is a cluster operation
   */
  isCluster?: boolean;
  
  /**
   * The Redis node ID for cluster operations
   */
  nodeId?: string;
  
  /**
   * The Redis slot for cluster operations
   */
  slot?: number;
  
  /**
   * Additional command-specific arguments
   */
  args?: any[];
}

/**
 * Configuration options for the Redis error handler
 */
export interface RedisErrorHandlerOptions {
  /**
   * Whether to enable detailed error logging
   */
  enableDetailedLogging?: boolean;
  
  /**
   * Maximum number of retry attempts for transient errors
   */
  maxRetries?: number;
  
  /**
   * Initial delay in milliseconds before the first retry
   */
  initialDelayMs?: number;
  
  /**
   * Maximum delay in milliseconds between retries
   */
  maxDelayMs?: number;
  
  /**
   * Whether to use circuit breaker for connection errors
   */
  useCircuitBreaker?: boolean;
  
  /**
   * Number of consecutive failures required to open the circuit
   */
  circuitBreakerFailureThreshold?: number;
  
  /**
   * Time in milliseconds that the circuit stays open before moving to half-open
   */
  circuitBreakerResetTimeoutMs?: number;
  
  /**
   * Journey-specific error handling options
   */
  journeyOptions?: {
    /**
     * The journey to use for error context
     */
    journey?: 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth';
    
    /**
     * The feature within the journey
     */
    feature?: string;
  };
}

/**
 * Default configuration for the Redis error handler
 */
const DEFAULT_REDIS_ERROR_HANDLER_OPTIONS: Required<RedisErrorHandlerOptions> = {
  enableDetailedLogging: true,
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  useCircuitBreaker: true,
  circuitBreakerFailureThreshold: 5,
  circuitBreakerResetTimeoutMs: 30000, // 30 seconds
  journeyOptions: {
    journey: undefined,
    feature: undefined
  }
};

/**
 * Patterns for identifying Redis error types based on error messages
 */
const REDIS_ERROR_PATTERNS = {
  CONNECTION: [
    'connection refused',
    'connection timeout',
    'connection closed',
    'failed to connect',
    'network error',
    'connect ECONNREFUSED',
    'connect ETIMEDOUT',
    'connect ECONNRESET',
    'socket hang up',
    'socket closed'
  ],
  AUTHENTICATION: [
    'NOAUTH',
    'invalid password',
    'authentication failed',
    'AUTH failed'
  ],
  COMMAND: [
    'unknown command',
    'wrong number of arguments',
    'syntax error',
    'ERR',
    'WRONGTYPE'
  ],
  CLUSTER: [
    'MOVED',
    'ASK',
    'CLUSTERDOWN',
    'CROSSSLOT',
    'TRYAGAIN',
    'LOADING'
  ],
  TIMEOUT: [
    'timeout',
    'timed out',
    'ETIMEDOUT'
  ],
  MEMORY: [
    'OOM',
    'out of memory',
    'maxmemory'
  ],
  READONLY: [
    'READONLY',
    'read-only'
  ],
  TRANSACTION: [
    'EXECABORT',
    'WATCH',
    'MULTI',
    'EXEC',
    'transaction'
  ]
};

/**
 * Specialized error handler for Redis operations.
 * Identifies and classifies Redis-specific errors, converting them to standardized
 * DatabaseException types with appropriate error codes and recovery strategies.
 */
export class RedisErrorHandler {
  private readonly logger = new Logger(RedisErrorHandler.name);
  private readonly options: Required<RedisErrorHandlerOptions>;
  private readonly retryStrategyFactory: RetryStrategyFactory;
  private readonly circuitBreaker: CircuitBreakerStrategy;
  
  /**
   * Creates a new instance of RedisErrorHandler
   * @param options Configuration options for the handler
   */
  constructor(options: RedisErrorHandlerOptions = {}) {
    this.options = {
      ...DEFAULT_REDIS_ERROR_HANDLER_OPTIONS,
      ...options,
      journeyOptions: {
        ...DEFAULT_REDIS_ERROR_HANDLER_OPTIONS.journeyOptions,
        ...options.journeyOptions
      }
    };
    
    this.retryStrategyFactory = new RetryStrategyFactory();
    
    // Create circuit breaker for connection errors
    this.circuitBreaker = new CircuitBreakerStrategy({
      failureThreshold: this.options.circuitBreakerFailureThreshold,
      resetTimeoutMs: this.options.circuitBreakerResetTimeoutMs,
      maxRetries: this.options.maxRetries,
      initialDelayMs: this.options.initialDelayMs,
      maxDelayMs: this.options.maxDelayMs
    });
  }
  
  /**
   * Handles a Redis error, converting it to a standardized DatabaseException
   * @param error The Redis error to handle
   * @param commandContext Context information about the Redis command
   * @param databaseContext Additional database context information
   * @returns A standardized DatabaseException
   */
  public handleError(
    error: Error,
    commandContext?: RedisCommandContext,
    databaseContext?: DatabaseErrorContext
  ): DatabaseException {
    // Classify the error
    const classification = this.classifyError(error, commandContext, databaseContext);
    
    // Log the error if detailed logging is enabled
    if (this.options.enableDetailedLogging) {
      this.logError(error, classification, commandContext, databaseContext);
    }
    
    // Create journey context if journey options are provided
    const journeyContext = this.createJourneyContext(databaseContext);
    
    // Create operation context from command context
    const operationContext = this.createOperationContext(commandContext, databaseContext);
    
    // Create and return the appropriate exception type
    return this.createException(
      classification,
      error,
      journeyContext,
      operationContext
    );
  }
  
  /**
   * Classifies a Redis error based on its message and properties
   * @param error The Redis error to classify
   * @param commandContext Context information about the Redis command
   * @param databaseContext Additional database context information
   * @returns Classification information for the error
   */
  private classifyError(
    error: Error,
    commandContext?: RedisCommandContext,
    databaseContext?: DatabaseErrorContext
  ): DatabaseErrorClassification {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name;
    
    // Check for connection errors
    if (this.matchesErrorPattern(errorMessage, REDIS_ERROR_PATTERNS.CONNECTION)) {
      return {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_REDIS_FAILED,
        message: 'Failed to establish connection to Redis',
        details: { originalError: error, commandContext },
        journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
      };
    }
    
    // Check for authentication errors
    if (this.matchesErrorPattern(errorMessage, REDIS_ERROR_PATTERNS.AUTHENTICATION)) {
      return {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CONN_REDIS_AUTH_FAILED,
        message: 'Redis authentication failed',
        details: { originalError: error, commandContext },
        journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
      };
    }
    
    // Check for timeout errors
    if (this.matchesErrorPattern(errorMessage, REDIS_ERROR_PATTERNS.TIMEOUT)) {
      const isConnectionTimeout = errorMessage.includes('connection') || 
                                 errorMessage.includes('connect');
      
      if (isConnectionTimeout) {
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CONN_REDIS_TIMEOUT,
          message: 'Connection timeout to Redis',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      } else {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_QUERY_REDIS_TIMEOUT,
          message: 'Redis command execution timeout',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
    }
    
    // Check for cluster errors
    if (this.matchesErrorPattern(errorMessage, REDIS_ERROR_PATTERNS.CLUSTER)) {
      // MOVED and ASK errors are actually redirections, not errors
      const isRedirection = errorMessage.includes('MOVED') || errorMessage.includes('ASK');
      
      if (isRedirection) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_QUERY_REDIS_SYNTAX,
          message: 'Redis cluster redirection required',
          details: { originalError: error, commandContext, isRedirection: true },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // CLUSTERDOWN is a critical cluster failure
      if (errorMessage.includes('CLUSTERDOWN')) {
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CONN_REDIS_CLUSTER_ERROR,
          message: 'Redis cluster is down',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // CROSSSLOT is a command targeting multiple keys in different slots
      if (errorMessage.includes('CROSSSLOT')) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_QUERY_REDIS_SYNTAX,
          message: 'Redis cluster keys must be in the same slot',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // TRYAGAIN is a transient cluster error during resharding
      if (errorMessage.includes('TRYAGAIN')) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_QUERY_REDIS_SYNTAX,
          message: 'Redis cluster resharding in progress, try again',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // LOADING is a transient error when a node is loading data
      if (errorMessage.includes('LOADING')) {
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CONN_REDIS_CLUSTER_ERROR,
          message: 'Redis node is loading the dataset in memory',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // Default cluster error
      return {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_REDIS_CLUSTER_ERROR,
        message: 'Redis cluster error',
        details: { originalError: error, commandContext },
        journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
      };
    }
    
    // Check for memory errors
    if (this.matchesErrorPattern(errorMessage, REDIS_ERROR_PATTERNS.MEMORY)) {
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_QUERY_REDIS_MAX_MEMORY,
        message: 'Redis max memory limit reached',
        details: { originalError: error, commandContext },
        journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
      };
    }
    
    // Check for read-only errors
    if (this.matchesErrorPattern(errorMessage, REDIS_ERROR_PATTERNS.READONLY)) {
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_QUERY_REDIS_SYNTAX,
        message: 'Redis instance is in read-only mode',
        details: { originalError: error, commandContext },
        journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
      };
    }
    
    // Check for transaction errors
    if (this.matchesErrorPattern(errorMessage, REDIS_ERROR_PATTERNS.TRANSACTION)) {
      // EXECABORT indicates a transaction was aborted due to a WATCH failure
      if (errorMessage.includes('EXECABORT') || errorMessage.includes('WATCH')) {
        return {
          type: DatabaseErrorType.TRANSACTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_TRANS_REDIS_WATCH_FAILED,
          message: 'Redis WATCH detected modified keys',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // Nested MULTI commands are not allowed
      if (errorMessage.includes('MULTI') && errorMessage.includes('nested')) {
        return {
          type: DatabaseErrorType.TRANSACTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_TRANS_REDIS_MULTI_NESTED,
          message: 'Nested MULTI commands not allowed in Redis',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // Default transaction error
      return {
        type: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_TRANS_REDIS_EXEC_FAILED,
        message: 'Redis transaction failed',
        details: { originalError: error, commandContext },
        journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
      };
    }
    
    // Check for command errors
    if (this.matchesErrorPattern(errorMessage, REDIS_ERROR_PATTERNS.COMMAND)) {
      // WRONGTYPE indicates an operation against a key holding the wrong kind of value
      if (errorMessage.includes('WRONGTYPE')) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_QUERY_REDIS_WRONG_TYPE,
          message: 'Operation against key holding wrong kind of value in Redis',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // Check for key existence errors
      if (errorMessage.includes('NX') || errorMessage.includes('XX')) {
        const isNxError = errorMessage.includes('NX');
        
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: isNxError ? ErrorCodes.DB_INTEG_REDIS_KEY_EXISTS : ErrorCodes.DB_INTEG_REDIS_KEY_NOT_EXISTS,
          message: isNxError ? 'Key already exists in Redis (NX operation)' : 'Key does not exist in Redis (XX operation)',
          details: { originalError: error, commandContext },
          journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
        };
      }
      
      // Default command error
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_QUERY_REDIS_SYNTAX,
        message: 'Redis command syntax error',
        details: { originalError: error, commandContext },
        journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
      };
    }
    
    // Handle journey-specific errors if journey context is provided
    if (databaseContext?.journey) {
      return this.classifyJourneyError(error, databaseContext.journey, commandContext, databaseContext);
    }
    
    // Default to a generic database error for unrecognized errors
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_QUERY_REDIS_SYNTAX,
      message: `Unrecognized Redis error: ${error.message}`,
      details: { originalError: error, commandContext },
      journeyContext: databaseContext?.journey ? { journey: databaseContext.journey } : undefined
    };
  }
  
  /**
   * Classifies a journey-specific Redis error
   * @param error The Redis error to classify
   * @param journey The journey where the error occurred
   * @param commandContext Context information about the Redis command
   * @param databaseContext Additional database context information
   * @returns Classification information for the error
   */
  private classifyJourneyError(
    error: Error,
    journey: string,
    commandContext?: RedisCommandContext,
    databaseContext?: DatabaseErrorContext
  ): DatabaseErrorClassification {
    const errorMessage = error.message.toLowerCase();
    const feature = databaseContext?.feature;
    
    // Health journey specific errors
    if (journey === 'health') {
      // Device connection caching errors
      if (feature === 'devices' || (commandContext?.key && commandContext.key.includes('device'))) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_HEALTH_DEVICE_SYNC_FAILED,
          message: 'Failed to cache health device connection data',
          details: { originalError: error, commandContext },
          journeyContext: { journey, feature: feature || 'devices' }
        };
      }
      
      // Health metrics caching errors
      if (feature === 'metrics' || (commandContext?.key && commandContext.key.includes('metric'))) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_HEALTH_METRIC_INVALID,
          message: 'Failed to cache health metric data',
          details: { originalError: error, commandContext },
          journeyContext: { journey, feature: feature || 'metrics' }
        };
      }
      
      // Default health journey error
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_HEALTH_TIMESERIES_ERROR,
        message: 'Health journey Redis caching error',
        details: { originalError: error, commandContext },
        journeyContext: { journey, feature }
      };
    }
    
    // Care journey specific errors
    if (journey === 'care') {
      // Appointment caching errors
      if (feature === 'appointments' || (commandContext?.key && commandContext.key.includes('appointment'))) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CARE_APPOINTMENT_CONFLICT,
          message: 'Failed to cache appointment data',
          details: { originalError: error, commandContext },
          journeyContext: { journey, feature: feature || 'appointments' }
        };
      }
      
      // Provider caching errors
      if (feature === 'providers' || (commandContext?.key && commandContext.key.includes('provider'))) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CARE_PROVIDER_NOT_FOUND,
          message: 'Failed to cache provider data',
          details: { originalError: error, commandContext },
          journeyContext: { journey, feature: feature || 'providers' }
        };
      }
      
      // Default care journey error
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CARE_TELEMEDICINE_RECORD,
        message: 'Care journey Redis caching error',
        details: { originalError: error, commandContext },
        journeyContext: { journey, feature }
      };
    }
    
    // Plan journey specific errors
    if (journey === 'plan') {
      // Benefits caching errors
      if (feature === 'benefits' || (commandContext?.key && commandContext.key.includes('benefit'))) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_PLAN_BENEFIT_CONSTRAINT,
          message: 'Failed to cache benefit data',
          details: { originalError: error, commandContext },
          journeyContext: { journey, feature: feature || 'benefits' }
        };
      }
      
      // Claims caching errors
      if (feature === 'claims' || (commandContext?.key && commandContext.key.includes('claim'))) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_PLAN_CLAIM_DUPLICATE,
          message: 'Failed to cache claim data',
          details: { originalError: error, commandContext },
          journeyContext: { journey, feature: feature || 'claims' }
        };
      }
      
      // Default plan journey error
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_PLAN_COVERAGE_CONSTRAINT,
        message: 'Plan journey Redis caching error',
        details: { originalError: error, commandContext },
        journeyContext: { journey, feature }
      };
    }
    
    // Gamification journey specific errors
    if (journey === 'gamification') {
      // Achievement caching errors
      if (feature === 'achievements' || (commandContext?.key && commandContext.key.includes('achievement'))) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_GAME_ACHIEVEMENT_CONSTRAINT,
          message: 'Failed to cache achievement data',
          details: { originalError: error, commandContext },
          journeyContext: { journey, feature: feature || 'achievements' }
        };
      }
      
      // Event caching errors
      if (feature === 'events' || (commandContext?.key && commandContext.key.includes('event'))) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_GAME_EVENT_INVALID,
          message: 'Failed to cache gamification event data',
          details: { originalError: error, commandContext },
          journeyContext: { journey, feature: feature || 'events' }
        };
      }
      
      // Default gamification journey error
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_GAME_PROFILE_INTEGRITY,
        message: 'Gamification journey Redis caching error',
        details: { originalError: error, commandContext },
        journeyContext: { journey, feature }
      };
    }
    
    // Auth service specific errors
    if (journey === 'auth') {
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_REDIS_FAILED,
        message: 'Authentication session storage error',
        details: { originalError: error, commandContext },
        journeyContext: { journey, feature }
      };
    }
    
    // Notification service specific errors
    if (journey === 'notification') {
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_REDIS_FAILED,
        message: 'Notification delivery cache error',
        details: { originalError: error, commandContext },
        journeyContext: { journey, feature }
      };
    }
    
    // Default journey error
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_QUERY_REDIS_SYNTAX,
      message: `${journey} journey Redis caching error`,
      details: { originalError: error, commandContext },
      journeyContext: { journey, feature }
    };
  }
  
  /**
   * Creates a standardized DatabaseException from error classification
   * @param classification The error classification
   * @param originalError The original Redis error
   * @param journeyContext Journey context information
   * @param operationContext Operation context information
   * @returns A standardized DatabaseException
   */
  private createException(
    classification: DatabaseErrorClassification,
    originalError: Error,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext
  ): DatabaseException {
    // If journey context is provided, create a JourneyDatabaseException
    if (journeyContext?.journey && journeyContext?.feature) {
      return new JourneyDatabaseException(
        classification.message,
        classification.code,
        journeyContext.journey,
        journeyContext.feature,
        classification.severity,
        classification.recoverability,
        operationContext,
        this.getRecoverySuggestion(classification.type, classification.recoverability),
        { originalError: originalError.message },
        originalError
      );
    }
    
    // Create the appropriate exception type based on the error classification
    switch (classification.type) {
      case DatabaseErrorType.CONNECTION:
        return new ConnectionException(
          classification.message,
          classification.code,
          classification.severity,
          classification.recoverability,
          journeyContext,
          operationContext,
          this.getRecoverySuggestion(DatabaseErrorType.CONNECTION, classification.recoverability),
          originalError
        );
        
      case DatabaseErrorType.QUERY:
        return new QueryException(
          classification.message,
          classification.code,
          classification.severity,
          classification.recoverability,
          journeyContext,
          operationContext,
          this.getRecoverySuggestion(DatabaseErrorType.QUERY, classification.recoverability),
          originalError
        );
        
      case DatabaseErrorType.TRANSACTION:
        return new TransactionException(
          classification.message,
          classification.code,
          classification.severity,
          classification.recoverability,
          journeyContext,
          operationContext,
          this.getRecoverySuggestion(DatabaseErrorType.TRANSACTION, classification.recoverability),
          originalError
        );
        
      case DatabaseErrorType.INTEGRITY:
        return new IntegrityException(
          classification.message,
          classification.code,
          classification.severity,
          classification.recoverability,
          journeyContext,
          operationContext,
          this.getRecoverySuggestion(DatabaseErrorType.INTEGRITY, classification.recoverability),
          originalError
        );
        
      case DatabaseErrorType.CONFIGURATION:
        return new ConfigurationException(
          classification.message,
          classification.code,
          classification.severity,
          classification.recoverability,
          journeyContext,
          operationContext,
          this.getRecoverySuggestion(DatabaseErrorType.CONFIGURATION, classification.recoverability),
          originalError
        );
        
      default:
        return new DatabaseException(
          classification.message,
          classification.code,
          classification.severity,
          classification.recoverability,
          journeyContext,
          operationContext,
          'Check Redis server status and command syntax.',
          originalError
        );
    }
  }
  
  /**
   * Gets a recovery suggestion based on error type and recoverability
   * @param errorType The type of database error
   * @param recoverability Whether the error is transient or permanent
   * @returns A suggestion for recovering from the error
   */
  private getRecoverySuggestion(
    errorType: DatabaseErrorType,
    recoverability: DatabaseErrorRecoverability
  ): string {
    if (recoverability === DatabaseErrorRecoverability.TRANSIENT) {
      switch (errorType) {
        case DatabaseErrorType.CONNECTION:
          return 'Check Redis server availability and network connectivity. Retry the operation after a brief delay.';
          
        case DatabaseErrorType.QUERY:
          return 'Retry the operation after a brief delay. If the issue persists, check command syntax and key existence.';
          
        case DatabaseErrorType.TRANSACTION:
          return 'Retry the transaction after a brief delay. If the issue persists, check for concurrent modifications to watched keys.';
          
        default:
          return 'Retry the operation after a brief delay. If the issue persists, check Redis server status.';
      }
    } else {
      switch (errorType) {
        case DatabaseErrorType.CONNECTION:
          return 'Check Redis server configuration, credentials, and network settings. Ensure the Redis server is properly configured.';
          
        case DatabaseErrorType.QUERY:
          return 'Check command syntax, key types, and arguments. Ensure the operation is valid for the target key type.';
          
        case DatabaseErrorType.TRANSACTION:
          return 'Check transaction logic and watched keys. Ensure proper usage of MULTI/EXEC blocks.';
          
        case DatabaseErrorType.INTEGRITY:
          return 'Check key existence requirements and constraints. Ensure proper usage of NX/XX options.';
          
        case DatabaseErrorType.CONFIGURATION:
          return 'Check Redis configuration settings, connection strings, and environment variables. Ensure proper setup for the current environment.';
          
        default:
          return 'Check Redis server status, command syntax, and application logic.';
      }
    }
  }
  
  /**
   * Creates a journey context from database context
   * @param databaseContext Database context information
   * @returns Journey context information
   */
  private createJourneyContext(databaseContext?: DatabaseErrorContext): JourneyContext | undefined {
    // If database context has journey information, use it
    if (databaseContext?.journey) {
      return createJourneyContext(
        databaseContext.journey as any,
        databaseContext.feature || '',
        databaseContext.userId
      );
    }
    
    // If options specify a journey, use it
    if (this.options.journeyOptions?.journey) {
      return createJourneyContext(
        this.options.journeyOptions.journey,
        this.options.journeyOptions.feature || '',
        databaseContext?.userId
      );
    }
    
    return undefined;
  }
  
  /**
   * Creates an operation context from command context
   * @param commandContext Redis command context
   * @param databaseContext Database context information
   * @returns Database operation context
   */
  private createOperationContext(
    commandContext?: RedisCommandContext,
    databaseContext?: DatabaseErrorContext
  ): DatabaseOperationContext | undefined {
    if (!commandContext) {
      return databaseContext?.operation ? {
        operation: databaseContext.operation,
        entity: databaseContext.entity || 'redis',
        query: databaseContext.query,
        params: databaseContext.params
      } : undefined;
    }
    
    return createOperationContext(
      commandContext.command || databaseContext?.operation || 'unknown',
      'redis',
      commandContext.command ? `${commandContext.command} ${commandContext.key || ''}` : databaseContext?.query,
      {
        key: commandContext.key,
        db: commandContext.db,
        isCluster: commandContext.isCluster,
        nodeId: commandContext.nodeId,
        slot: commandContext.slot,
        args: commandContext.args,
        ...(databaseContext?.params || {})
      }
    );
  }
  
  /**
   * Logs a Redis error with classification information
   * @param error The original Redis error
   * @param classification The error classification
   * @param commandContext Redis command context
   * @param databaseContext Database context information
   */
  private logError(
    error: Error,
    classification: DatabaseErrorClassification,
    commandContext?: RedisCommandContext,
    databaseContext?: DatabaseErrorContext
  ): void {
    const logContext = {
      errorType: classification.type,
      errorCode: classification.code,
      severity: classification.severity,
      recoverability: classification.recoverability,
      journey: classification.journeyContext?.journey || databaseContext?.journey,
      feature: classification.journeyContext?.feature || databaseContext?.feature,
      command: commandContext?.command,
      key: commandContext?.key,
      isCluster: commandContext?.isCluster,
      originalError: error.message
    };
    
    // Log based on severity
    switch (classification.severity) {
      case DatabaseErrorSeverity.CRITICAL:
        this.logger.error(`Redis critical error: ${classification.message}`, logContext);
        break;
        
      case DatabaseErrorSeverity.MAJOR:
        this.logger.warn(`Redis error: ${classification.message}`, logContext);
        break;
        
      case DatabaseErrorSeverity.MINOR:
        this.logger.log(`Redis minor error: ${classification.message}`, logContext);
        break;
        
      default:
        this.logger.debug(`Redis error: ${classification.message}`, logContext);
    }
  }
  
  /**
   * Checks if an error message matches any pattern in a list
   * @param errorMessage The error message to check
   * @param patterns List of patterns to match against
   * @returns Whether the error message matches any pattern
   */
  private matchesErrorPattern(errorMessage: string, patterns: string[]): boolean {
    return patterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
  }
  
  /**
   * Determines if an error is retryable and calculates the delay before the next attempt
   * @param error The Redis error
   * @param commandContext Redis command context
   * @param databaseContext Database context information
   * @param attempt The current attempt number (0-based)
   * @returns A decision on whether to retry and the delay before the next attempt
   */
  public getRetryDecision(
    error: Error,
    commandContext?: RedisCommandContext,
    databaseContext?: DatabaseErrorContext,
    attempt: number = 0
  ): { shouldRetry: boolean; delayMs: number; reason: string } {
    // Classify the error
    const classification = this.classifyError(error, commandContext, databaseContext);
    
    // If the error is not recoverable, don't retry
    if (classification.recoverability !== DatabaseErrorRecoverability.TRANSIENT) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: 'Error is not transient'
      };
    }
    
    // If we've exceeded the maximum number of retries, don't retry
    if (attempt >= this.options.maxRetries) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: `Maximum retry attempts (${this.options.maxRetries}) exceeded`
      };
    }
    
    // For connection errors, use circuit breaker
    if (classification.type === DatabaseErrorType.CONNECTION && this.options.useCircuitBreaker) {
      // Create a context for the circuit breaker
      const context = {
        operationType: 'connection' as const,
        operationName: commandContext?.command || 'redis',
        journeyContext: databaseContext?.journey,
        attemptCount: attempt,
        firstAttemptTimestamp: Date.now() - (attempt * 1000), // Approximate
        lastAttemptTimestamp: Date.now(),
        error,
        metadata: { commandContext, databaseContext }
      };
      
      // Get decision from circuit breaker
      const decision = this.circuitBreaker.shouldRetry(context);
      
      return {
        shouldRetry: decision.shouldRetry,
        delayMs: decision.delayMs,
        reason: decision.reason
      };
    }
    
    // For other transient errors, use exponential backoff
    const backoffStrategy = new ExponentialBackoffStrategy({
      maxRetries: this.options.maxRetries,
      initialDelayMs: this.options.initialDelayMs,
      maxDelayMs: this.options.maxDelayMs
    });
    
    // Create a context for the backoff strategy
    const context = {
      operationType: 'query' as const,
      operationName: commandContext?.command || 'redis',
      journeyContext: databaseContext?.journey,
      attemptCount: attempt,
      firstAttemptTimestamp: Date.now() - (attempt * 1000), // Approximate
      lastAttemptTimestamp: Date.now(),
      error,
      metadata: { commandContext, databaseContext }
    };
    
    // Get decision from backoff strategy
    const decision = backoffStrategy.shouldRetry(context);
    
    return {
      shouldRetry: decision.shouldRetry,
      delayMs: decision.delayMs,
      reason: decision.reason
    };
  }
  
  /**
   * Updates the configuration for the Redis error handler
   * @param options New configuration options
   */
  public updateOptions(options: Partial<RedisErrorHandlerOptions>): void {
    this.options = {
      ...this.options,
      ...options,
      journeyOptions: {
        ...this.options.journeyOptions,
        ...options.journeyOptions
      }
    };
    
    // Update circuit breaker configuration if needed
    if (
      options.maxRetries !== undefined ||
      options.initialDelayMs !== undefined ||
      options.maxDelayMs !== undefined ||
      options.circuitBreakerFailureThreshold !== undefined ||
      options.circuitBreakerResetTimeoutMs !== undefined
    ) {
      this.circuitBreaker.updateConfig({
        failureThreshold: options.circuitBreakerFailureThreshold || this.options.circuitBreakerFailureThreshold,
        resetTimeoutMs: options.circuitBreakerResetTimeoutMs || this.options.circuitBreakerResetTimeoutMs,
        maxRetries: options.maxRetries || this.options.maxRetries,
        initialDelayMs: options.initialDelayMs || this.options.initialDelayMs,
        maxDelayMs: options.maxDelayMs || this.options.maxDelayMs
      });
    }
  }
  
  /**
   * Resets the internal state of the Redis error handler
   */
  public reset(): void {
    this.circuitBreaker.reset();
  }
  
  /**
   * Gets the current state of the circuit breaker
   * @returns The current circuit state
   */
  public getCircuitState(): string {
    return this.circuitBreaker.getState();
  }
}

/**
 * Creates a Redis command context object
 * @param command The Redis command being executed
 * @param key The key or key pattern being accessed
 * @param args Additional command arguments
 * @param options Additional options for the context
 * @returns A Redis command context object
 */
export function createRedisCommandContext(
  command: string,
  key?: string,
  args?: any[],
  options?: {
    db?: number;
    isCluster?: boolean;
    nodeId?: string;
    slot?: number;
  }
): RedisCommandContext {
  return {
    command,
    key,
    args,
    db: options?.db,
    isCluster: options?.isCluster,
    nodeId: options?.nodeId,
    slot: options?.slot
  };
}

/**
 * Utility function to execute a Redis command with retry logic
 * @param fn The function to execute the Redis command
 * @param handler The Redis error handler
 * @param command The Redis command being executed
 * @param key The key or key pattern being accessed
 * @param journeyContext Journey context information
 * @param args Additional command arguments
 * @returns A promise that resolves with the result of the command
 */
export async function executeRedisCommandWithRetry<T>(
  fn: () => Promise<T>,
  handler: RedisErrorHandler,
  command: string,
  key?: string,
  journeyContext?: { journey: string; feature?: string },
  ...args: any[]
): Promise<T> {
  let attempt = 0;
  let lastError: Error;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Create command context
      const commandContext = createRedisCommandContext(command, key, args);
      
      // Create database context
      const databaseContext: DatabaseErrorContext = {
        operation: command,
        entity: 'redis',
        journey: journeyContext?.journey as any,
        feature: journeyContext?.feature,
        query: `${command} ${key || ''}`,
        params: { args }
      };
      
      // Get retry decision
      const decision = handler.getRetryDecision(
        lastError,
        commandContext,
        databaseContext,
        attempt
      );
      
      // If we shouldn't retry, throw a standardized exception
      if (!decision.shouldRetry) {
        throw handler.handleError(lastError, commandContext, databaseContext);
      }
      
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, decision.delayMs));
      
      // Increment attempt count
      attempt++;
    }
  }
}

// Export the handler and utilities
export default RedisErrorHandler;