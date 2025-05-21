import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { JourneyType } from '@austa/interfaces/common';
import { 
  DatabaseException, 
  ConnectionException, 
  QueryException, 
  TransactionException, 
  IntegrityException, 
  ConfigurationException 
} from '@austa/database/errors';
import { ErrorTransformer } from '@austa/database/errors/error-transformer';
import { 
  IDatabaseErrorHandler, 
  IDatabaseErrorContext, 
  IRetryStrategy 
} from './interfaces';
import {
  DatabaseErrorType,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  RETRY,
  ERROR_CODES,
  ERROR_RECOVERABILITY,
  ERROR_SEVERITY,
  LOGGING,
  DatabaseEnvironment
} from './constants';

/**
 * Implementation of exponential backoff retry strategy
 */
class ExponentialBackoffStrategy implements IRetryStrategy {
  constructor(
    public readonly maxRetries: number = RETRY.MAX_RETRY_ATTEMPTS,
    public readonly baseDelayMs: number = RETRY.INITIAL_RETRY_DELAY_MS,
    public readonly maxDelayMs: number = RETRY.MAX_RETRY_DELAY_MS,
    public readonly backoffFactor: number = RETRY.BACKOFF_MULTIPLIER,
    public readonly useJitter: boolean = true
  ) {}

  /**
   * Calculates the delay for a specific retry attempt using exponential backoff
   * with optional jitter to prevent retry storms.
   * 
   * @param attempt The current retry attempt (0-based)
   * @returns Delay in milliseconds before the next retry
   */
  calculateDelay(attempt: number): number {
    // Calculate base exponential delay: baseDelay * (backoffFactor ^ attempt)
    let delay = this.baseDelayMs * Math.pow(this.backoffFactor, attempt);
    
    // Apply maximum delay cap
    delay = Math.min(delay, this.maxDelayMs);
    
    // Apply jitter if enabled (adds or subtracts up to JITTER_FACTOR % of the delay)
    if (this.useJitter) {
      const jitterRange = delay * RETRY.JITTER_FACTOR;
      const jitterAmount = Math.random() * jitterRange * 2 - jitterRange;
      delay = Math.max(this.baseDelayMs, delay + jitterAmount);
    }
    
    return Math.floor(delay);
  }

  /**
   * Determines if another retry should be attempted based on the current attempt
   * number and the error that occurred.
   * 
   * @param attempt The current retry attempt (0-based)
   * @param error The error that occurred
   * @returns Whether another retry should be attempted
   */
  shouldRetry(attempt: number, error: Error): boolean {
    // Don't retry if we've reached the maximum number of attempts
    if (attempt >= this.maxRetries) {
      return false;
    }
    
    return true;
  }
}

/**
 * Service that handles database errors for the gamification engine.
 * 
 * This service categorizes and transforms database errors into application-specific
 * exceptions, implements retry mechanisms with exponential backoff, and provides
 * detailed error logging with context for troubleshooting.
 */
@Injectable()
export class DatabaseErrorHandlerService implements IDatabaseErrorHandler {
  private readonly logger = new Logger(DatabaseErrorHandlerService.name);
  private readonly environment: DatabaseEnvironment;
  private readonly enableQueryLogging: boolean;
  private readonly enableTransactionLogging: boolean;
  private readonly errorTransformer: ErrorTransformer;

  constructor(private readonly configService: ConfigService) {
    this.environment = this.configService.get<DatabaseEnvironment>(
      'DATABASE_ENVIRONMENT', 
      DatabaseEnvironment.DEVELOPMENT
    );
    
    // Get environment-specific logging settings or fall back to defaults
    const envLoggingSettings = LOGGING.ENVIRONMENT[this.environment] || {};
    this.enableQueryLogging = envLoggingSettings.ENABLE_QUERY_LOGGING ?? LOGGING.ENABLE_QUERY_LOGGING;
    this.enableTransactionLogging = envLoggingSettings.ENABLE_TRANSACTION_LOGGING ?? LOGGING.ENABLE_TRANSACTION_LOGGING;
    
    this.errorTransformer = new ErrorTransformer();
  }

  /**
   * Handles a database error, potentially transforming it into an application-specific error.
   * 
   * @param error The error to handle
   * @param context Additional context for error handling
   * @returns The handled error
   */
  handleError(error: Error, context?: IDatabaseErrorContext): Error {
    // Log the error with context
    this.logError(error, context);
    
    // Transform the error into an application-specific exception
    const transformedError = this.transformError(error, context);
    
    return transformedError;
  }

  /**
   * Determines if an error is retryable based on its type and context.
   * 
   * @param error The error to check
   * @returns Whether the error is retryable
   */
  isRetryableError(error: Error): boolean {
    // If it's already a DatabaseException, check its recoverability
    if (error instanceof DatabaseException) {
      const metadata = error.getMetadata();
      return metadata?.recoverability === DatabaseErrorRecoverability.TRANSIENT;
    }
    
    // For Prisma errors, check specific error codes
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Connection errors (P1XXX) are generally retryable
      if (error.code.startsWith('P1')) {
        return true;
      }
      
      // Specific P2XXX errors that are retryable (e.g., deadlocks, timeouts)
      const retryablePrismaErrors = ['P2024', 'P2028', 'P2034'];
      return retryablePrismaErrors.includes(error.code);
    }
    
    // For Prisma initialization errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return true; // Most initialization errors are transient
    }
    
    // For Prisma runtime errors (like timeouts)
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return false; // Rust panics are not retryable
    }
    
    // For unknown errors, check if it's a connection error
    if (this.isConnectionError(error)) {
      return true;
    }
    
    // Default to not retryable for unknown errors
    return false;
  }

  /**
   * Determines if an error is a connection error.
   * 
   * @param error The error to check
   * @returns Whether the error is a connection error
   */
  isConnectionError(error: Error): boolean {
    // If it's already a DatabaseException, check its type
    if (error instanceof ConnectionException) {
      return true;
    }
    
    // For Prisma errors, check specific error codes
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P1XXX errors are connection-related
      return error.code.startsWith('P1');
    }
    
    // For Prisma initialization errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return true;
    }
    
    // Check error message for connection-related keywords
    const errorMessage = error.message.toLowerCase();
    const connectionKeywords = [
      'connection', 'connect', 'timeout', 'network', 'socket', 'closed',
      'refused', 'reset', 'econnrefused', 'econnreset', 'etimedout'
    ];
    
    return connectionKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Determines if an error is a constraint violation.
   * 
   * @param error The error to check
   * @returns Whether the error is a constraint violation
   */
  isConstraintViolation(error: Error): boolean {
    // If it's already a DatabaseException, check its type
    if (error instanceof IntegrityException) {
      return true;
    }
    
    // For Prisma errors, check specific error codes
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2XXX errors related to constraints
      const constraintErrorCodes = ['P2002', 'P2003', 'P2004', 'P2014', 'P2015'];
      return constraintErrorCodes.includes(error.code);
    }
    
    // Check error message for constraint-related keywords
    const errorMessage = error.message.toLowerCase();
    const constraintKeywords = [
      'constraint', 'unique', 'foreign key', 'check', 'not null',
      'violation', 'integrity', 'duplicate'
    ];
    
    return constraintKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Logs a database error with appropriate context.
   * 
   * @param error The error to log
   * @param context Additional context for logging
   */
  logError(error: Error, context?: IDatabaseErrorContext): void {
    // Determine error severity
    const severity = this.getErrorSeverity(error);
    
    // Build log context
    const logContext = {
      ...context,
      errorType: this.getErrorType(error),
      errorCode: this.getErrorCode(error),
      severity,
      recoverability: this.isRetryableError(error) ? 
        DatabaseErrorRecoverability.TRANSIENT : 
        DatabaseErrorRecoverability.PERMANENT,
    };
    
    // Log based on severity
    const errorMessage = this.formatErrorMessage(error, context);
    
    switch (severity) {
      case DatabaseErrorSeverity.CRITICAL:
        this.logger.error(errorMessage, error.stack, logContext);
        break;
      case DatabaseErrorSeverity.MAJOR:
        this.logger.error(errorMessage, error.stack, logContext);
        break;
      case DatabaseErrorSeverity.MINOR:
        this.logger.warn(errorMessage, logContext);
        break;
      default:
        this.logger.warn(errorMessage, logContext);
    }
  }

  /**
   * Creates a retry strategy for a specific error.
   * 
   * @param error The error to create a retry strategy for
   * @param context Additional context for retry strategy creation
   * @returns Retry strategy for the error
   */
  createRetryStrategy(error: Error, context?: IDatabaseErrorContext): IRetryStrategy {
    // Don't create a retry strategy for non-retryable errors
    if (!this.isRetryableError(error)) {
      return new ExponentialBackoffStrategy(0); // Strategy with 0 retries
    }
    
    // Get operation-specific retry configuration
    let retryConfig = { ...RETRY };
    
    // Apply operation-specific settings if available
    if (context?.operation) {
      const operation = context.operation.toUpperCase();
      if (operation === 'READ' || operation === 'WRITE' || 
          operation === 'CONNECTION' || operation === 'TRANSACTION') {
        retryConfig = { ...retryConfig, ...RETRY.OPERATIONS[operation] };
      }
    }
    
    // Apply environment-specific settings
    const envSettings = RETRY.ENVIRONMENT[this.environment];
    if (envSettings) {
      retryConfig = { ...retryConfig, ...envSettings };
    }
    
    // For connection errors, use more aggressive retry strategy
    if (this.isConnectionError(error)) {
      return new ExponentialBackoffStrategy(
        retryConfig.OPERATIONS?.CONNECTION?.MAX_RETRY_ATTEMPTS || retryConfig.MAX_RETRY_ATTEMPTS,
        retryConfig.OPERATIONS?.CONNECTION?.INITIAL_RETRY_DELAY_MS || retryConfig.INITIAL_RETRY_DELAY_MS,
        retryConfig.MAX_RETRY_DELAY_MS,
        retryConfig.OPERATIONS?.CONNECTION?.BACKOFF_MULTIPLIER || retryConfig.BACKOFF_MULTIPLIER,
        true // Always use jitter for connection errors to prevent retry storms
      );
    }
    
    // Default retry strategy
    return new ExponentialBackoffStrategy(
      retryConfig.MAX_RETRY_ATTEMPTS,
      retryConfig.INITIAL_RETRY_DELAY_MS,
      retryConfig.MAX_RETRY_DELAY_MS,
      retryConfig.BACKOFF_MULTIPLIER,
      true // Use jitter by default
    );
  }

  /**
   * Transforms a raw error into an application-specific database exception.
   * 
   * @param error The error to transform
   * @param context Additional context for error transformation
   * @returns Transformed error
   */
  private transformError(error: Error, context?: IDatabaseErrorContext): Error {
    // If it's already a DatabaseException, just return it
    if (error instanceof DatabaseException) {
      return error;
    }
    
    // Use the error transformer from @austa/database package
    try {
      // For Prisma errors
      if (
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientUnknownRequestError ||
        error instanceof Prisma.PrismaClientRustPanicError ||
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientValidationError
      ) {
        return this.errorTransformer.transformPrismaError(error, {
          operation: context?.operation,
          model: context?.model,
          journeyType: context?.journeyType,
          metadata: context?.metadata,
        });
      }
      
      // For other errors, use the common transformer
      return this.errorTransformer.transformCommonError(error, {
        operation: context?.operation,
        model: context?.model,
        journeyType: context?.journeyType,
        metadata: context?.metadata,
      });
    } catch (transformError) {
      // If transformation fails, create a generic database exception
      this.logger.error(
        `Error transforming database error: ${transformError.message}`,
        transformError.stack
      );
      
      const errorType = this.getErrorType(error);
      const errorCode = this.getErrorCode(error);
      
      // Create appropriate exception based on error type
      switch (errorType) {
        case DatabaseErrorType.CONNECTION:
          return new ConnectionException(
            error.message,
            errorCode,
            { originalError: error, ...context }
          );
        case DatabaseErrorType.QUERY:
          return new QueryException(
            error.message,
            errorCode,
            { originalError: error, ...context }
          );
        case DatabaseErrorType.TRANSACTION:
          return new TransactionException(
            error.message,
            errorCode,
            { originalError: error, ...context }
          );
        case DatabaseErrorType.DATA_INTEGRITY:
          return new IntegrityException(
            error.message,
            errorCode,
            { originalError: error, ...context }
          );
        case DatabaseErrorType.CONFIGURATION:
          return new ConfigurationException(
            error.message,
            errorCode,
            { originalError: error, ...context }
          );
        default:
          return new DatabaseException(
            error.message,
            errorCode,
            { originalError: error, ...context }
          );
      }
    }
  }

  /**
   * Determines the type of a database error.
   * 
   * @param error The error to check
   * @returns The type of the error
   */
  private getErrorType(error: Error): DatabaseErrorType {
    // If it's already a DatabaseException, get its type
    if (error instanceof DatabaseException) {
      const metadata = error.getMetadata();
      return metadata?.errorType as DatabaseErrorType || DatabaseErrorType.QUERY;
    }
    
    // For Prisma errors, determine type based on error code
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P1XXX errors are connection-related
      if (error.code.startsWith('P1')) {
        return DatabaseErrorType.CONNECTION;
      }
      
      // P2XXX errors related to constraints
      const constraintErrorCodes = ['P2002', 'P2003', 'P2004', 'P2014', 'P2015'];
      if (constraintErrorCodes.includes(error.code)) {
        return DatabaseErrorType.DATA_INTEGRITY;
      }
      
      // P2XXX errors related to transactions
      const transactionErrorCodes = ['P2028', 'P2034'];
      if (transactionErrorCodes.includes(error.code)) {
        return DatabaseErrorType.TRANSACTION;
      }
      
      // Default to query error for other P2XXX errors
      return DatabaseErrorType.QUERY;
    }
    
    // For Prisma initialization errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return DatabaseErrorType.CONNECTION;
    }
    
    // For Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return DatabaseErrorType.QUERY;
    }
    
    // For Prisma panic errors
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return DatabaseErrorType.QUERY;
    }
    
    // For other errors, try to determine type from message
    const errorMessage = error.message.toLowerCase();
    
    if (this.isConnectionError(error)) {
      return DatabaseErrorType.CONNECTION;
    }
    
    if (this.isConstraintViolation(error)) {
      return DatabaseErrorType.DATA_INTEGRITY;
    }
    
    // Check for transaction-related keywords
    const transactionKeywords = [
      'transaction', 'commit', 'rollback', 'deadlock', 'serializable',
      'isolation', 'concurrent'
    ];
    if (transactionKeywords.some(keyword => errorMessage.includes(keyword))) {
      return DatabaseErrorType.TRANSACTION;
    }
    
    // Check for configuration-related keywords
    const configKeywords = [
      'configuration', 'config', 'setting', 'environment', 'schema',
      'migration', 'setup'
    ];
    if (configKeywords.some(keyword => errorMessage.includes(keyword))) {
      return DatabaseErrorType.CONFIGURATION;
    }
    
    // Default to query error
    return DatabaseErrorType.QUERY;
  }

  /**
   * Gets the error code for a database error.
   * 
   * @param error The error to check
   * @returns The error code
   */
  private getErrorCode(error: Error): string {
    // If it's already a DatabaseException, get its code
    if (error instanceof DatabaseException) {
      return error.getCode();
    }
    
    // For Prisma errors, map to our error codes
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Map common Prisma error codes to our error codes
      const prismaToErrorCodeMap: Record<string, string> = {
        // Connection errors
        'P1000': ERROR_CODES.CONNECTION_FAILED,
        'P1001': ERROR_CODES.CONNECTION_FAILED,
        'P1002': ERROR_CODES.CONNECTION_TIMEOUT,
        'P1008': ERROR_CODES.CONNECTION_LIMIT_REACHED,
        'P1017': ERROR_CODES.CONNECTION_CLOSED,
        
        // Query errors
        'P2009': ERROR_CODES.QUERY_SYNTAX_ERROR,
        'P2010': ERROR_CODES.QUERY_EXECUTION_ERROR,
        'P2024': ERROR_CODES.QUERY_TIMEOUT,
        
        // Transaction errors
        'P2028': ERROR_CODES.TRANSACTION_TIMEOUT,
        'P2034': ERROR_CODES.TRANSACTION_DEADLOCK,
        
        // Data integrity errors
        'P2002': ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION,
        'P2003': ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION,
        'P2004': ERROR_CODES.CHECK_CONSTRAINT_VIOLATION,
        'P2011': ERROR_CODES.NOT_NULL_CONSTRAINT_VIOLATION,
        'P2019': ERROR_CODES.DATA_TYPE_MISMATCH,
      };
      
      return prismaToErrorCodeMap[error.code] || ERROR_CODES.QUERY_FAILED;
    }
    
    // For Prisma initialization errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return ERROR_CODES.CONNECTION_FAILED;
    }
    
    // For Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return ERROR_CODES.QUERY_SYNTAX_ERROR;
    }
    
    // For Prisma panic errors
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return ERROR_CODES.QUERY_EXECUTION_ERROR;
    }
    
    // For other errors, determine based on error type
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case DatabaseErrorType.CONNECTION:
        return ERROR_CODES.CONNECTION_FAILED;
      case DatabaseErrorType.TRANSACTION:
        return ERROR_CODES.TRANSACTION_FAILED;
      case DatabaseErrorType.DATA_INTEGRITY:
        return ERROR_CODES.DATA_TYPE_MISMATCH;
      case DatabaseErrorType.CONFIGURATION:
        return ERROR_CODES.INVALID_CONFIGURATION;
      case DatabaseErrorType.QUERY:
      default:
        return ERROR_CODES.QUERY_FAILED;
    }
  }

  /**
   * Gets the severity of a database error.
   * 
   * @param error The error to check
   * @returns The severity of the error
   */
  private getErrorSeverity(error: Error): DatabaseErrorSeverity {
    // If it's already a DatabaseException, get its severity
    if (error instanceof DatabaseException) {
      const metadata = error.getMetadata();
      return metadata?.severity as DatabaseErrorSeverity || DatabaseErrorSeverity.MAJOR;
    }
    
    // Get error code and look up severity
    const errorCode = this.getErrorCode(error);
    return ERROR_SEVERITY[errorCode] || DatabaseErrorSeverity.MAJOR;
  }

  /**
   * Formats an error message with context for logging.
   * 
   * @param error The error to format
   * @param context Additional context for formatting
   * @returns Formatted error message
   */
  private formatErrorMessage(error: Error, context?: IDatabaseErrorContext): string {
    const errorType = this.getErrorType(error);
    const errorCode = this.getErrorCode(error);
    
    let message = `Database error [${errorCode}]: ${error.message}`;
    
    // Add context information if available
    if (context) {
      if (context.operation) {
        message += ` | Operation: ${context.operation}`;
      }
      
      if (context.model) {
        message += ` | Model: ${context.model}`;
      }
      
      if (context.journeyType) {
        message += ` | Journey: ${context.journeyType}`;
      }
      
      if (context.inTransaction) {
        message += ` | In Transaction: ${context.inTransaction}`;
      }
      
      if (context.retryAttempt !== undefined) {
        message += ` | Retry Attempt: ${context.retryAttempt}`;
      }
    }
    
    return message;
  }
}