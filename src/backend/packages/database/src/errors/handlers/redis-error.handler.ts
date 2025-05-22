/**
 * @file redis-error.handler.ts
 * @description Specialized error handler for Redis cache and session storage operations.
 * Identifies and classifies Redis-specific errors, converting them to standardized
 * DatabaseException types with appropriate error codes and retry strategies.
 */

import { Injectable, Logger } from '@nestjs/common';
import { RedisError, ReplyError } from 'redis';

import {
  ConnectionException,
  DatabaseErrorContext,
  DatabaseErrorSeverity,
  QueryException,
  ConfigurationException,
  IntegrityException,
  TransactionException
} from '../database-error.exception';

import {
  DB_REDIS_CONNECTION_REFUSED,
  DB_REDIS_AUTH_FAILED,
  DB_REDIS_KEY_NOT_FOUND,
  DB_REDIS_WRONG_TYPE,
  DB_REDIS_OUT_OF_MEMORY,
  DB_REDIS_COMMAND_DISABLED,
  DB_REDIS_MASTER_DOWN,
  DB_REDIS_REPLICA_DOWN,
  DB_REDIS_CLUSTER_ERROR,
  DB_REDIS_SCRIPT_ERROR,
  DB_REDIS_TIMEOUT,
  DB_REDIS_PUBSUB_ERROR
} from '../database-error.codes';

import {
  RetryContext,
  RetryStrategy,
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  CompositeRetryStrategy,
  DatabaseOperationType,
  JourneyContext
} from '../retry-strategies';

/**
 * Interface for Redis command context information
 * Provides additional details about the Redis operation that failed
 */
export interface RedisCommandContext {
  /** The Redis command that was executed */
  command?: string;
  
  /** The key or key pattern that was accessed */
  key?: string;
  
  /** The Redis data type being operated on */
  dataType?: 'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream' | 'unknown';
  
  /** Whether the operation was part of a transaction */
  inTransaction?: boolean;
  
  /** Whether the operation was part of a pipeline */
  inPipeline?: boolean;
  
  /** Whether the operation was on a Redis Cluster */
  isCluster?: boolean;
  
  /** The journey context in which the operation was performed */
  journey?: JourneyContext;
  
  /** Additional metadata about the operation */
  metadata?: Record<string, any>;
}

/**
 * Specialized error handler for Redis operations
 * Identifies and classifies Redis-specific errors, converting them to standardized
 * DatabaseException types with appropriate error codes and retry strategies
 */
@Injectable()
export class RedisErrorHandler {
  private readonly logger = new Logger(RedisErrorHandler.name);
  
  // Default retry strategy for Redis operations
  private readonly defaultRetryStrategy: RetryStrategy = new CompositeRetryStrategy([
    new ExponentialBackoffStrategy({
      baseDelayMs: 100,
      maxDelayMs: 5000,
      maxAttempts: 3,
      jitterFactor: 0.2,
      operationTypeOverrides: {
        [DatabaseOperationType.READ]: {
          baseDelayMs: 50,
          maxDelayMs: 2000,
          maxAttempts: 3
        },
        [DatabaseOperationType.CONNECTION]: {
          baseDelayMs: 500,
          maxDelayMs: 10000,
          maxAttempts: 5
        }
      }
    }),
    new CircuitBreakerStrategy({
      failureThreshold: 5,
      failureWindowMs: 30000,
      resetTimeoutMs: 15000,
      successThreshold: 2
    })
  ]);
  
  /**
   * Handles Redis errors by converting them to standardized DatabaseException types
   * 
   * @param error - The Redis error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized DatabaseException
   */
  public handleError(error: Error, commandContext?: Partial<RedisCommandContext>): Error {
    // If the error is already a DatabaseException, return it as is
    if (this.isDatabaseException(error)) {
      return error;
    }
    
    this.logger.debug(
      `Handling Redis error: ${error.message}`,
      { errorType: error.constructor.name, commandContext }
    );
    
    try {
      // Determine the error type and create appropriate exception
      if (this.isConnectionError(error)) {
        return this.handleConnectionError(error, commandContext);
      } else if (this.isCommandError(error)) {
        return this.handleCommandError(error, commandContext);
      } else if (this.isClusterError(error)) {
        return this.handleClusterError(error, commandContext);
      } else if (this.isTimeoutError(error)) {
        return this.handleTimeoutError(error, commandContext);
      } else if (this.isAuthError(error)) {
        return this.handleAuthError(error, commandContext);
      } else if (this.isScriptError(error)) {
        return this.handleScriptError(error, commandContext);
      } else {
        // Default to a generic database error
        return this.createGenericError(error, commandContext);
      }
    } catch (handlerError) {
      // If error handling itself fails, log and return the original error
      this.logger.error(
        `Error while handling Redis error: ${handlerError.message}`,
        { originalError: error.message }
      );
      return error;
    }
  }
  
  /**
   * Determines if an error is already a DatabaseException
   * 
   * @param error - The error to check
   * @returns True if the error is a DatabaseException
   */
  private isDatabaseException(error: Error): boolean {
    return (
      error instanceof ConnectionException ||
      error instanceof QueryException ||
      error instanceof TransactionException ||
      error instanceof IntegrityException ||
      error instanceof ConfigurationException
    );
  }
  
  /**
   * Determines if an error is a Redis connection error
   * 
   * @param error - The error to check
   * @returns True if the error is a connection error
   */
  private isConnectionError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      error instanceof RedisError &&
      (errorMessage.includes('connection') ||
       errorMessage.includes('connect') ||
       errorMessage.includes('network') ||
       errorMessage.includes('socket') ||
       errorMessage.includes('econnrefused') ||
       errorMessage.includes('econnreset') ||
       errorMessage.includes('etimedout'))
    );
  }
  
  /**
   * Determines if an error is a Redis command error
   * 
   * @param error - The error to check
   * @returns True if the error is a command error
   */
  private isCommandError(error: Error): boolean {
    return (
      error instanceof ReplyError ||
      (error.name === 'ReplyError') ||
      (error instanceof Error && error.message.startsWith('ERR'))
    );
  }
  
  /**
   * Determines if an error is a Redis cluster error
   * 
   * @param error - The error to check
   * @returns True if the error is a cluster error
   */
  private isClusterError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('cluster') ||
      errorMessage.includes('moved') ||
      errorMessage.includes('ask') ||
      errorMessage.includes('clusterdown') ||
      errorMessage.includes('master') ||
      errorMessage.includes('replica') ||
      errorMessage.includes('slave')
    );
  }
  
  /**
   * Determines if an error is a Redis timeout error
   * 
   * @param error - The error to check
   * @returns True if the error is a timeout error
   */
  private isTimeoutError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('etimedout')
    );
  }
  
  /**
   * Determines if an error is a Redis authentication error
   * 
   * @param error - The error to check
   * @returns True if the error is an authentication error
   */
  private isAuthError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('auth') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('password') ||
      errorMessage.includes('acl') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('denied')
    );
  }
  
  /**
   * Determines if an error is a Redis script error
   * 
   * @param error - The error to check
   * @returns True if the error is a script error
   */
  private isScriptError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('script') ||
      errorMessage.includes('lua') ||
      errorMessage.includes('eval')
    );
  }
  
  /**
   * Handles Redis connection errors
   * 
   * @param error - The connection error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized ConnectionException
   */
  private handleConnectionError(error: Error, commandContext?: Partial<RedisCommandContext>): ConnectionException {
    const errorMessage = error.message.toLowerCase();
    let errorCode = DB_REDIS_CONNECTION_REFUSED;
    let severity = DatabaseErrorSeverity.HIGH;
    let recoverable = true;
    
    // Determine specific connection error type
    if (errorMessage.includes('refused') || errorMessage.includes('econnrefused')) {
      errorCode = DB_REDIS_CONNECTION_REFUSED;
      severity = DatabaseErrorSeverity.HIGH;
    } else if (errorMessage.includes('master') && (errorMessage.includes('down') || errorMessage.includes('unavailable'))) {
      errorCode = DB_REDIS_MASTER_DOWN;
      severity = DatabaseErrorSeverity.CRITICAL;
    } else if (errorMessage.includes('replica') || errorMessage.includes('slave')) {
      errorCode = DB_REDIS_REPLICA_DOWN;
      severity = DatabaseErrorSeverity.MEDIUM;
    }
    
    // Create context with Redis-specific information
    const context: Partial<DatabaseErrorContext> = {
      severity,
      recoverable,
      journey: this.getJourneyFromContext(commandContext),
      operation: 'Redis Connection',
      entity: 'Redis',
      recoverySuggestions: [
        'Check Redis server status and network connectivity',
        'Verify Redis connection configuration (host, port, credentials)',
        'Ensure Redis service is running and accessible',
        'Check for firewall or security group restrictions',
        'Verify connection pool settings and limits'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command || 'connect',
        redisKey: commandContext?.key,
        isCluster: commandContext?.isCluster,
        originalError: error.message
      }
    };
    
    return new ConnectionException(
      `Redis connection error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis command errors
   * 
   * @param error - The command error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized DatabaseException (type depends on the specific error)
   */
  private handleCommandError(error: Error, commandContext?: Partial<RedisCommandContext>): Error {
    const errorMessage = error.message.toLowerCase();
    
    // Handle specific command errors
    if (errorMessage.includes('wrongtype') || errorMessage.includes('wrong kind')) {
      return this.handleWrongTypeError(error, commandContext);
    } else if (errorMessage.includes('no such key') || errorMessage.includes('not found') || errorMessage.includes('nil')) {
      return this.handleKeyNotFoundError(error, commandContext);
    } else if (errorMessage.includes('out of memory') || errorMessage.includes('oom')) {
      return this.handleOutOfMemoryError(error, commandContext);
    } else if (errorMessage.includes('disabled') || errorMessage.includes('not enabled')) {
      return this.handleCommandDisabledError(error, commandContext);
    } else if (errorMessage.includes('pubsub')) {
      return this.handlePubSubError(error, commandContext);
    }
    
    // Default to generic query error
    return this.createGenericQueryError(error, commandContext);
  }
  
  /**
   * Handles Redis wrong type errors (WRONGTYPE Operation against a key holding the wrong kind of value)
   * 
   * @param error - The wrong type error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized IntegrityException
   */
  private handleWrongTypeError(error: Error, commandContext?: Partial<RedisCommandContext>): IntegrityException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverable: false,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Command',
      entity: 'Redis Key',
      recoverySuggestions: [
        'Check the data type of the key before performing operations',
        'Use type-specific Redis commands for the key',
        'Delete the key and recreate it with the correct type if necessary',
        'Implement type checking in your application code'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        expectedType: commandContext?.dataType || 'unknown',
        inTransaction: commandContext?.inTransaction,
        originalError: error.message
      }
    };
    
    return new IntegrityException(
      `Redis wrong type error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis key not found errors
   * 
   * @param error - The key not found error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized QueryException
   */
  private handleKeyNotFoundError(error: Error, commandContext?: Partial<RedisCommandContext>): QueryException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.LOW,
      recoverable: true,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Command',
      entity: 'Redis Key',
      recoverySuggestions: [
        'Check if the key exists before attempting to access it',
        'Implement proper error handling for missing keys',
        'Use default values when keys are not found',
        'Consider using Redis TTL to manage key expiration'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        inTransaction: commandContext?.inTransaction,
        originalError: error.message
      }
    };
    
    return new QueryException(
      `Redis key not found: ${commandContext?.key || 'unknown key'}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis out of memory errors
   * 
   * @param error - The out of memory error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized ConnectionException
   */
  private handleOutOfMemoryError(error: Error, commandContext?: Partial<RedisCommandContext>): ConnectionException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverable: false,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Command',
      entity: 'Redis Server',
      recoverySuggestions: [
        'Increase Redis server memory allocation',
        'Implement key eviction policies',
        'Review memory usage patterns and optimize',
        'Consider Redis cluster for better memory distribution',
        'Implement proper TTL for cached data'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        inTransaction: commandContext?.inTransaction,
        originalError: error.message
      }
    };
    
    return new ConnectionException(
      `Redis out of memory error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis command disabled errors
   * 
   * @param error - The command disabled error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized ConfigurationException
   */
  private handleCommandDisabledError(error: Error, commandContext?: Partial<RedisCommandContext>): ConfigurationException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverable: false,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Command',
      entity: 'Redis Server',
      recoverySuggestions: [
        'Check Redis server configuration',
        'Verify command permissions in Redis ACL',
        'Use alternative commands if available',
        'Contact system administrator to enable required commands'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        inTransaction: commandContext?.inTransaction,
        originalError: error.message
      }
    };
    
    return new ConfigurationException(
      `Redis command disabled: ${commandContext?.command || 'unknown command'}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis Pub/Sub errors
   * 
   * @param error - The Pub/Sub error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized QueryException
   */
  private handlePubSubError(error: Error, commandContext?: Partial<RedisCommandContext>): QueryException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverable: true,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis PubSub',
      entity: 'Redis Channel',
      recoverySuggestions: [
        'Check channel name and subscription status',
        'Verify Redis Pub/Sub configuration',
        'Implement reconnection logic for Pub/Sub clients',
        'Consider using Redis Streams for more reliable messaging'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisChannel: commandContext?.key,
        originalError: error.message
      }
    };
    
    return new QueryException(
      `Redis Pub/Sub error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis cluster errors
   * 
   * @param error - The cluster error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized ConnectionException
   */
  private handleClusterError(error: Error, commandContext?: Partial<RedisCommandContext>): ConnectionException {
    const errorMessage = error.message.toLowerCase();
    let errorCode = DB_REDIS_CLUSTER_ERROR;
    let severity = DatabaseErrorSeverity.HIGH;
    let recoverable = true;
    
    // Determine specific cluster error type
    if (errorMessage.includes('clusterdown')) {
      severity = DatabaseErrorSeverity.CRITICAL;
      recoverable = false;
    } else if (errorMessage.includes('moved') || errorMessage.includes('ask')) {
      // MOVED or ASK errors are part of normal cluster operation for redirections
      severity = DatabaseErrorSeverity.LOW;
      recoverable = true;
    }
    
    const context: Partial<DatabaseErrorContext> = {
      severity,
      recoverable,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Cluster Operation',
      entity: 'Redis Cluster',
      recoverySuggestions: [
        'Check Redis cluster status and health',
        'Verify cluster configuration and node connectivity',
        'Ensure proper slot distribution across cluster nodes',
        'Use cluster-aware Redis client with proper configuration',
        'Implement proper retry logic for MOVED and ASK redirections'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        isCluster: true,
        inTransaction: commandContext?.inTransaction,
        originalError: error.message
      }
    };
    
    return new ConnectionException(
      `Redis cluster error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis timeout errors
   * 
   * @param error - The timeout error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized ConnectionException
   */
  private handleTimeoutError(error: Error, commandContext?: Partial<RedisCommandContext>): ConnectionException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverable: true,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Command',
      entity: 'Redis Server',
      recoverySuggestions: [
        'Check Redis server load and performance',
        'Increase command timeout settings',
        'Optimize Redis commands to reduce execution time',
        'Consider Redis cluster for better load distribution',
        'Implement proper retry logic with backoff'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        inTransaction: commandContext?.inTransaction,
        isCluster: commandContext?.isCluster,
        originalError: error.message
      }
    };
    
    return new ConnectionException(
      `Redis timeout error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis authentication errors
   * 
   * @param error - The authentication error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized ConnectionException
   */
  private handleAuthError(error: Error, commandContext?: Partial<RedisCommandContext>): ConnectionException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.HIGH,
      recoverable: false,
      journey: this.getJourneyFromContext(commandContext),
      operation: 'Redis Authentication',
      entity: 'Redis Server',
      recoverySuggestions: [
        'Verify Redis authentication credentials',
        'Check Redis ACL configuration',
        'Ensure proper permissions for the Redis user',
        'Verify TLS/SSL configuration if enabled',
        'Check for recent Redis security configuration changes'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command || 'auth',
        isCluster: commandContext?.isCluster,
        originalError: error.message
      }
    };
    
    return new ConnectionException(
      `Redis authentication error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Handles Redis script errors
   * 
   * @param error - The script error to handle
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized QueryException
   */
  private handleScriptError(error: Error, commandContext?: Partial<RedisCommandContext>): QueryException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverable: false,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Script',
      entity: 'Redis Script',
      recoverySuggestions: [
        'Check Lua script syntax and logic',
        'Verify script inputs and parameters',
        'Test script with smaller datasets',
        'Consider breaking complex scripts into smaller operations',
        'Implement proper error handling for script execution'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command || 'eval',
        redisKey: commandContext?.key,
        inTransaction: commandContext?.inTransaction,
        originalError: error.message
      }
    };
    
    return new QueryException(
      `Redis script error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Creates a generic query error for Redis operations
   * 
   * @param error - The original error
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized QueryException
   */
  private createGenericQueryError(error: Error, commandContext?: Partial<RedisCommandContext>): QueryException {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverable: true,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Command',
      entity: 'Redis',
      recoverySuggestions: [
        'Check Redis command syntax and parameters',
        'Verify key exists and has the correct data type',
        'Implement proper error handling for Redis operations',
        'Consider using Redis transactions for atomic operations'
      ],
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        dataType: commandContext?.dataType,
        inTransaction: commandContext?.inTransaction,
        inPipeline: commandContext?.inPipeline,
        isCluster: commandContext?.isCluster,
        originalError: error.message
      }
    };
    
    return new QueryException(
      `Redis query error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Creates a generic error for Redis operations that don't match specific categories
   * 
   * @param error - The original error
   * @param commandContext - Additional context about the Redis operation
   * @returns A standardized DatabaseException
   */
  private createGenericError(error: Error, commandContext?: Partial<RedisCommandContext>): Error {
    const context: Partial<DatabaseErrorContext> = {
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverable: true,
      journey: this.getJourneyFromContext(commandContext),
      operation: commandContext?.command || 'Redis Operation',
      entity: 'Redis',
      technicalDetails: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        inTransaction: commandContext?.inTransaction,
        inPipeline: commandContext?.inPipeline,
        isCluster: commandContext?.isCluster,
        originalError: error.message
      }
    };
    
    return new QueryException(
      `Redis error: ${error.message}`,
      context,
      error
    );
  }
  
  /**
   * Extracts the journey context from the command context
   * 
   * @param commandContext - The Redis command context
   * @returns The journey context as a string
   */
  private getJourneyFromContext(commandContext?: Partial<RedisCommandContext>): 'health' | 'care' | 'plan' | 'gamification' | 'common' {
    if (!commandContext?.journey) {
      return 'common';
    }
    
    switch (commandContext.journey) {
      case JourneyContext.HEALTH:
        return 'health';
      case JourneyContext.CARE:
        return 'care';
      case JourneyContext.PLAN:
        return 'plan';
      case JourneyContext.GAMIFICATION:
        return 'gamification';
      default:
        return 'common';
    }
  }
  
  /**
   * Determines if a Redis error is retryable
   * 
   * @param error - The error to check
   * @returns True if the error is retryable
   */
  public isRetryable(error: Error): boolean {
    // Connection errors are generally retryable
    if (this.isConnectionError(error)) {
      return true;
    }
    
    // Timeout errors are retryable
    if (this.isTimeoutError(error)) {
      return true;
    }
    
    // Some cluster errors are retryable (MOVED, ASK)
    if (this.isClusterError(error)) {
      const errorMessage = error.message.toLowerCase();
      return (
        errorMessage.includes('moved') ||
        errorMessage.includes('ask') ||
        !errorMessage.includes('clusterdown')
      );
    }
    
    // Authentication errors are not retryable without configuration changes
    if (this.isAuthError(error)) {
      return false;
    }
    
    // Command errors are generally not retryable without code changes
    if (this.isCommandError(error)) {
      return false;
    }
    
    // Script errors are not retryable without code changes
    if (this.isScriptError(error)) {
      return false;
    }
    
    // Default to not retryable for unknown errors
    return false;
  }
  
  /**
   * Gets the appropriate retry strategy for a Redis error
   * 
   * @param error - The error to get a retry strategy for
   * @param commandContext - Additional context about the Redis operation
   * @returns A retry strategy or null if the error is not retryable
   */
  public getRetryStrategy(error: Error, commandContext?: Partial<RedisCommandContext>): RetryStrategy | null {
    if (!this.isRetryable(error)) {
      return null;
    }
    
    // Use the default retry strategy
    return this.defaultRetryStrategy;
  }
  
  /**
   * Creates a retry context for a Redis error
   * 
   * @param error - The error to create a retry context for
   * @param commandContext - Additional context about the Redis operation
   * @param attemptsMade - The number of retry attempts already made
   * @returns A retry context
   */
  public createRetryContext(error: Error, commandContext?: Partial<RedisCommandContext>, attemptsMade = 0): RetryContext {
    // Determine the operation type based on the command
    let operationType = DatabaseOperationType.READ;
    
    if (commandContext?.command) {
      const command = commandContext.command.toLowerCase();
      if (
        command.startsWith('set') ||
        command.startsWith('del') ||
        command.startsWith('hmset') ||
        command.startsWith('hset') ||
        command.startsWith('lpush') ||
        command.startsWith('rpush') ||
        command.startsWith('sadd') ||
        command.startsWith('zadd')
      ) {
        operationType = DatabaseOperationType.WRITE;
      } else if (
        command.startsWith('multi') ||
        command.startsWith('exec') ||
        command.startsWith('discard')
      ) {
        operationType = DatabaseOperationType.TRANSACTION;
      } else if (
        command === 'connect' ||
        command === 'auth' ||
        command === 'select'
      ) {
        operationType = DatabaseOperationType.CONNECTION;
      }
    } else if (this.isConnectionError(error)) {
      operationType = DatabaseOperationType.CONNECTION;
    }
    
    // Create the retry context
    return {
      operationType,
      journeyContext: commandContext?.journey,
      attemptsMade,
      error,
      firstAttemptTime: new Date(),
      metadata: {
        redisCommand: commandContext?.command,
        redisKey: commandContext?.key,
        inTransaction: commandContext?.inTransaction,
        inPipeline: commandContext?.inPipeline,
        isCluster: commandContext?.isCluster
      }
    };
  }
}