/**
 * @file error-handling.util.ts
 * @description Implements a comprehensive error handling framework for the gamification engine with
 * journey-specific error classification, standardized error codes, and context enrichment.
 * Enables consistent error responses and proper troubleshooting across gamification components.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement consistent error handling patterns
 * - Create error propagation and logging strategy
 * - Design client-friendly error responses with journey context
 * - Develop journey-specific error classification system
 */

import { Injectable, HttpStatus } from '@nestjs/common';
import { GamificationLogger, GamificationContextType } from './logging.util';
import { JourneyType } from '../interfaces/journey.interface';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IUserProfile } from '../interfaces/user-profile.interface';
import { 
  AppException, 
  ErrorType as AppErrorType, 
  ErrorContext, 
  ErrorResponse 
} from '../exceptions/app-exception.base';
import {
  ErrorCategory,
  ErrorType,
  ErrorSeverity,
  ErrorDomain,
  ERROR_CODES,
  ERROR_TYPE_TO_CATEGORY,
  ClientErrorMetadata,
  SystemErrorMetadata,
  TransientErrorMetadata,
  ExternalErrorMetadata,
  createErrorCode
} from '../exceptions/error-types.enum';
import { TracingService } from '@austa/tracing';
import { MonitoringService } from '@austa/monitoring';

/**
 * Interface for error handling options
 */
export interface ErrorHandlingOptions {
  /** Whether to include stack trace in error responses (default: false) */
  includeStack?: boolean;
  
  /** Whether to include detailed error context in responses (default: false) */
  includeDetails?: boolean;
  
  /** Whether to automatically log the error (default: true) */
  logError?: boolean;
  
  /** Whether to track the error in monitoring system (default: true) */
  trackError?: boolean;
  
  /** Custom error message to override the default */
  customMessage?: string;
  
  /** Additional context to include with the error */
  additionalContext?: Record<string, any>;
  
  /** Journey type for journey-specific error handling */
  journeyType?: JourneyType;
  
  /** User ID for user-specific error context */
  userId?: string;
  
  /** Request ID for request-specific error context */
  requestId?: string;
  
  /** Whether the error is retryable (default: based on error type) */
  isRetryable?: boolean;
}

/**
 * Interface for journey-specific error context
 */
export interface JourneyErrorContext extends ErrorContext {
  /** Journey type (Health, Care, Plan) */
  journeyType: JourneyType;
  
  /** Journey-specific context data */
  journeyContext?: Record<string, any>;
  
  /** User ID associated with the error */
  userId?: string;
  
  /** Event type if error is related to an event */
  eventType?: string;
  
  /** Achievement ID if error is related to an achievement */
  achievementId?: string;
  
  /** Quest ID if error is related to a quest */
  questId?: string;
  
  /** Reward ID if error is related to a reward */
  rewardId?: string;
}

/**
 * Interface for error handling result
 */
export interface ErrorHandlingResult {
  /** The handled error */
  error: Error;
  
  /** Whether the error was logged */
  logged: boolean;
  
  /** Whether the error was tracked in monitoring */
  tracked: boolean;
  
  /** Error response for API responses */
  response?: ErrorResponse;
  
  /** Whether the error is retryable */
  isRetryable: boolean;
  
  /** Error category */
  category: ErrorCategory;
  
  /** Error type */
  type: ErrorType | string;
  
  /** Error severity */
  severity: ErrorSeverity;
}

/**
 * Utility service that provides comprehensive error handling functionality
 * for the gamification engine with journey-specific error classification,
 * standardized error codes, and context enrichment.
 */
@Injectable()
export class ErrorHandlingService {
  constructor(
    private readonly logger: GamificationLogger,
    private readonly tracingService: TracingService,
    private readonly monitoringService: MonitoringService
  ) {}

  /**
   * Categorizes an error based on its type and properties
   * @param error The error to categorize
   * @returns The error category
   */
  public categorizeError(error: Error): ErrorCategory {
    // If it's an AppException, use its built-in categorization
    if (error instanceof AppException) {
      if (error.isClientError()) return ErrorCategory.CLIENT;
      if (error.isSystemError()) return ErrorCategory.SYSTEM;
      if (error.isExternalError()) return ErrorCategory.EXTERNAL;
      if (error.isTransientError()) return ErrorCategory.TRANSIENT;
    }

    // Check for error type property
    const errorWithType = error as any;
    if (errorWithType.type && ERROR_TYPE_TO_CATEGORY[errorWithType.type]) {
      return ERROR_TYPE_TO_CATEGORY[errorWithType.type];
    }

    // Check for error category property
    if (errorWithType.category && Object.values(ErrorCategory).includes(errorWithType.category)) {
      return errorWithType.category;
    }

    // Check for HTTP status code
    if (errorWithType.status) {
      const status = typeof errorWithType.status === 'number' 
        ? errorWithType.status 
        : parseInt(errorWithType.status, 10);
      
      if (!isNaN(status)) {
        if (status >= 400 && status < 500) return ErrorCategory.CLIENT;
        if (status >= 500) return ErrorCategory.SYSTEM;
      }
    }

    // Check for common error names and patterns
    const errorName = error.name || '';
    const errorMessage = error.message || '';

    // Client errors
    if (
      errorName.includes('Validation') ||
      errorName.includes('NotFound') ||
      errorName.includes('BadRequest') ||
      errorName.includes('Unauthorized') ||
      errorName.includes('Forbidden') ||
      errorName.includes('Conflict') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden')
    ) {
      return ErrorCategory.CLIENT;
    }

    // Transient errors
    if (
      errorName.includes('Timeout') ||
      errorName.includes('Connection') ||
      errorName.includes('Network') ||
      errorName.includes('Temporary') ||
      errorName.includes('Transient') ||
      errorName.includes('Retry') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('temporary') ||
      errorMessage.includes('retry')
    ) {
      return ErrorCategory.TRANSIENT;
    }

    // External errors
    if (
      errorName.includes('External') ||
      errorName.includes('Dependency') ||
      errorName.includes('Service') ||
      errorName.includes('API') ||
      errorName.includes('Kafka') ||
      errorMessage.includes('external') ||
      errorMessage.includes('service') ||
      errorMessage.includes('dependency') ||
      errorMessage.includes('kafka')
    ) {
      return ErrorCategory.EXTERNAL;
    }

    // Default to system error
    return ErrorCategory.SYSTEM;
  }

  /**
   * Determines if an error is retryable based on its category and type
   * @param error The error to check
   * @returns Whether the error is retryable
   */
  public isRetryableError(error: Error): boolean {
    // If it's an AppException, use its built-in property
    if (error instanceof AppException) {
      return error.isRetryable;
    }

    // Check for explicit isRetryable property
    const errorWithRetryable = error as any;
    if (typeof errorWithRetryable.isRetryable === 'boolean') {
      return errorWithRetryable.isRetryable;
    }

    // All transient errors are retryable by definition
    const category = this.categorizeError(error);
    if (category === ErrorCategory.TRANSIENT) {
      return true;
    }

    // Some external errors are retryable
    if (category === ErrorCategory.EXTERNAL) {
      // Check for specific external error types that are retryable
      const errorWithType = error as any;
      if (errorWithType.type) {
        const retryableExternalTypes = [
          ErrorType.EXTERNAL_SERVICE_UNAVAILABLE,
          ErrorType.EXTERNAL_SERVICE_TIMEOUT,
          ErrorType.KAFKA_TEMPORARY_ERROR,
          ErrorType.KAFKA_REBALANCING,
          ErrorType.KAFKA_BROKER_UNAVAILABLE,
          ErrorType.AUTH_SERVICE_UNAVAILABLE,
          ErrorType.THIRD_PARTY_RATE_LIMIT
        ];
        
        return retryableExternalTypes.includes(errorWithType.type);
      }

      // Check for common retryable external error patterns
      const errorName = error.name || '';
      const errorMessage = error.message || '';
      
      return (
        errorName.includes('Timeout') ||
        errorName.includes('Unavailable') ||
        errorName.includes('RateLimit') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('try again')
      );
    }

    // Client and system errors are generally not retryable
    return false;
  }

  /**
   * Determines the severity of an error based on its category and type
   * @param error The error to check
   * @returns The error severity
   */
  public getErrorSeverity(error: Error): ErrorSeverity {
    // Check for explicit severity property
    const errorWithSeverity = error as any;
    if (errorWithSeverity.severity && Object.values(ErrorSeverity).includes(errorWithSeverity.severity)) {
      return errorWithSeverity.severity;
    }

    // Determine severity based on category
    const category = this.categorizeError(error);
    
    switch (category) {
      case ErrorCategory.CLIENT:
        // Client errors are generally WARNING level unless they indicate a potential security issue
        const errorWithType = error as any;
        if (errorWithType.type) {
          const securityErrorTypes = [
            ErrorType.UNAUTHORIZED,
            ErrorType.FORBIDDEN,
            ErrorType.INVALID_CREDENTIALS,
            ErrorType.EXPIRED_TOKEN,
            ErrorType.INVALID_TOKEN,
            ErrorType.INSUFFICIENT_PERMISSIONS,
            ErrorType.ACCOUNT_LOCKED,
            ErrorType.ACCOUNT_DISABLED
          ];
          
          if (securityErrorTypes.includes(errorWithType.type)) {
            return ErrorSeverity.ERROR;
          }
        }
        return ErrorSeverity.WARNING;
      
      case ErrorCategory.SYSTEM:
        // System errors are generally ERROR level
        return ErrorSeverity.ERROR;
      
      case ErrorCategory.TRANSIENT:
        // Transient errors start as WARNING but can escalate based on retry count
        if (errorWithSeverity.retryCount && errorWithSeverity.retryCount > 3) {
          return ErrorSeverity.ERROR;
        }
        return ErrorSeverity.WARNING;
      
      case ErrorCategory.EXTERNAL:
        // External errors depend on the specific service and impact
        const criticalServices = ['AUTH', 'DATABASE', 'KAFKA'];
        const errorName = error.name || '';
        const errorMessage = error.message || '';
        
        for (const service of criticalServices) {
          if (errorName.includes(service) || errorMessage.includes(service.toLowerCase())) {
            return ErrorSeverity.ERROR;
          }
        }
        return ErrorSeverity.WARNING;
      
      default:
        return ErrorSeverity.ERROR;
    }
  }

  /**
   * Enriches an error with journey-specific context
   * @param error The error to enrich
   * @param journeyType Journey type
   * @param additionalContext Additional context to include
   * @returns The enriched error
   */
  public enrichErrorWithJourneyContext(
    error: Error,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {}
  ): Error {
    // Create journey error context
    const journeyContext: JourneyErrorContext = {
      journeyType,
      timestamp: new Date(),
      ...additionalContext
    };

    // Add correlation ID from current trace if available
    const currentSpan = this.tracingService.getCurrentSpan();
    if (currentSpan) {
      journeyContext.requestId = currentSpan.spanContext().traceId;
    }

    // If it's an AppException, use its built-in context enrichment
    if (error instanceof AppException) {
      return error.withContext(journeyContext);
    }

    // For other errors, add context properties directly
    const enrichedError = error as any;
    enrichedError.context = {
      ...enrichedError.context,
      ...journeyContext
    };

    return enrichedError;
  }

  /**
   * Enriches an error with event-specific context
   * @param error The error to enrich
   * @param event The event related to the error
   * @param additionalContext Additional context to include
   * @returns The enriched error
   */
  public enrichErrorWithEventContext(
    error: Error,
    event: IBaseEvent,
    additionalContext: Record<string, any> = {}
  ): Error {
    return this.enrichErrorWithJourneyContext(
      error,
      event.journeyType,
      {
        userId: event.userId,
        eventType: event.type,
        eventId: event.id,
        timestamp: event.timestamp,
        ...additionalContext
      }
    );
  }

  /**
   * Enriches an error with achievement-specific context
   * @param error The error to enrich
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context to include
   * @returns The enriched error
   */
  public enrichErrorWithAchievementContext(
    error: Error,
    achievementId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {}
  ): Error {
    return this.enrichErrorWithJourneyContext(
      error,
      journeyType,
      {
        userId,
        achievementId,
        ...additionalContext
      }
    );
  }

  /**
   * Enriches an error with quest-specific context
   * @param error The error to enrich
   * @param questId Quest ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context to include
   * @returns The enriched error
   */
  public enrichErrorWithQuestContext(
    error: Error,
    questId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {}
  ): Error {
    return this.enrichErrorWithJourneyContext(
      error,
      journeyType,
      {
        userId,
        questId,
        ...additionalContext
      }
    );
  }

  /**
   * Enriches an error with reward-specific context
   * @param error The error to enrich
   * @param rewardId Reward ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context to include
   * @returns The enriched error
   */
  public enrichErrorWithRewardContext(
    error: Error,
    rewardId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {}
  ): Error {
    return this.enrichErrorWithJourneyContext(
      error,
      journeyType,
      {
        userId,
        rewardId,
        ...additionalContext
      }
    );
  }

  /**
   * Enriches an error with user profile-specific context
   * @param error The error to enrich
   * @param profile User profile
   * @param additionalContext Additional context to include
   * @returns The enriched error
   */
  public enrichErrorWithProfileContext(
    error: Error,
    profile: IUserProfile,
    additionalContext: Record<string, any> = {}
  ): Error {
    return this.enrichErrorWithJourneyContext(
      error,
      JourneyType.CROSS_JOURNEY, // User profiles are cross-journey
      {
        userId: profile.userId,
        profileId: profile.id,
        level: profile.level,
        ...additionalContext
      }
    );
  }

  /**
   * Handles an error with comprehensive error handling logic
   * @param error The error to handle
   * @param options Error handling options
   * @returns Error handling result
   */
  public handleError(error: Error, options: ErrorHandlingOptions = {}): ErrorHandlingResult {
    // Set default options
    const {
      includeStack = false,
      includeDetails = false,
      logError = true,
      trackError = true,
      customMessage,
      additionalContext = {},
      journeyType,
      userId,
      requestId,
      isRetryable
    } = options;

    // Enrich error with context if journey type is provided
    if (journeyType) {
      const contextWithUser = userId ? { userId, ...additionalContext } : additionalContext;
      const contextWithRequest = requestId ? { requestId, ...contextWithUser } : contextWithUser;
      error = this.enrichErrorWithJourneyContext(error, journeyType, contextWithRequest);
    } else if (Object.keys(additionalContext).length > 0) {
      // Add additional context even if journey type is not provided
      if (error instanceof AppException) {
        error = error.withContext(additionalContext);
      } else {
        const enrichedError = error as any;
        enrichedError.context = {
          ...enrichedError.context,
          ...additionalContext
        };
      }
    }

    // Determine error properties
    const category = this.categorizeError(error);
    const severity = this.getErrorSeverity(error);
    const retryable = isRetryable !== undefined ? isRetryable : this.isRetryableError(error);

    // Extract error type and message
    let errorType: string;
    let errorMessage: string;

    if (error instanceof AppException) {
      errorType = error.errorType;
      errorMessage = customMessage || error.message;
    } else {
      const errorWithType = error as any;
      errorType = errorWithType.type || error.name || 'UnknownError';
      errorMessage = customMessage || error.message || 'An unknown error occurred';
    }

    // Log the error if requested
    let logged = false;
    if (logError) {
      this.logError(error, severity, additionalContext);
      logged = true;
    }

    // Track the error in monitoring if requested
    let tracked = false;
    if (trackError) {
      this.trackError(error, severity, category, additionalContext);
      tracked = true;
    }

    // Create error response for API responses
    let response: ErrorResponse;
    if (error instanceof AppException) {
      response = error.toResponse(includeDetails);
      if (customMessage) {
        response.message = customMessage;
      }
    } else {
      // Create a standardized error response for non-AppException errors
      response = {
        errorId: (error as any).errorId || this.generateErrorId(),
        errorCode: (error as any).errorCode || this.getDefaultErrorCode(category, errorType),
        errorType: this.mapToAppErrorType(category, errorType),
        message: errorMessage,
        timestamp: new Date().toISOString(),
      };

      // Include path if available
      if ((error as any).context?.path) {
        response.path = (error as any).context.path;
      }

      // Include details if requested and available
      if (includeDetails && (error as any).context?.details) {
        response.details = (error as any).context.details;
      }

      // Include stack if requested and in development environment
      if (includeStack && process.env.NODE_ENV !== 'production') {
        response.details = { ...response.details, stack: error.stack };
      }
    }

    // Return the error handling result
    return {
      error,
      logged,
      tracked,
      response,
      isRetryable: retryable,
      category,
      type: errorType,
      severity
    };
  }

  /**
   * Logs an error with appropriate context and severity
   * @param error The error to log
   * @param severity Error severity
   * @param additionalContext Additional context to include
   */
  private logError(error: Error, severity: ErrorSeverity, additionalContext: Record<string, any> = {}): void {
    // Determine logging level based on severity
    let logLevel: 'debug' | 'info' | 'warn' | 'error';
    switch (severity) {
      case ErrorSeverity.DEBUG:
        logLevel = 'debug';
        break;
      case ErrorSeverity.INFO:
        logLevel = 'info';
        break;
      case ErrorSeverity.WARNING:
        logLevel = 'warn';
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
      default:
        logLevel = 'error';
        break;
    }

    // Extract context from error
    const errorContext = error instanceof AppException 
      ? error.context 
      : (error as any).context || {};

    // Combine with additional context
    const combinedContext = {
      ...errorContext,
      ...additionalContext,
      errorName: error.name,
      errorType: error instanceof AppException ? error.errorType : (error as any).type,
      errorCode: error instanceof AppException ? error.errorCode : (error as any).errorCode,
      stack: error.stack
    };

    // Determine appropriate logging method based on context
    if (combinedContext.eventId && combinedContext.eventType) {
      // Create a minimal event object for logging
      const eventForLogging: Partial<IBaseEvent> = {
        id: combinedContext.eventId,
        type: combinedContext.eventType,
        userId: combinedContext.userId,
        journeyType: combinedContext.journeyType,
        timestamp: combinedContext.timestamp || new Date()
      };
      
      this.logger.logEventError(
        error.message,
        eventForLogging as IBaseEvent,
        error,
        combinedContext
      );
    } else if (combinedContext.achievementId) {
      this.logger.logAchievementError(
        error.message,
        combinedContext.achievementId,
        combinedContext.userId || 'unknown',
        combinedContext.journeyType,
        error,
        combinedContext
      );
    } else if (combinedContext.questId) {
      this.logger.logQuestError(
        error.message,
        combinedContext.questId,
        combinedContext.userId || 'unknown',
        combinedContext.journeyType,
        error,
        combinedContext
      );
    } else if (combinedContext.rewardId) {
      this.logger.logRewardError(
        error.message,
        combinedContext.rewardId,
        combinedContext.userId || 'unknown',
        combinedContext.journeyType,
        error,
        combinedContext
      );
    } else if (combinedContext.profileId) {
      // Create a minimal profile object for logging
      const profileForLogging: Partial<IUserProfile> = {
        id: combinedContext.profileId,
        userId: combinedContext.userId,
        level: combinedContext.level
      };
      
      this.logger.logProfileError(
        error.message,
        profileForLogging as IUserProfile,
        error,
        combinedContext
      );
    } else if (combinedContext.ruleId) {
      this.logger.logRuleError(
        error.message,
        combinedContext.ruleId,
        combinedContext.userId || 'unknown',
        combinedContext.journeyType,
        error,
        combinedContext
      );
    } else if (combinedContext.leaderboardId) {
      this.logger.logLeaderboardError(
        error.message,
        combinedContext.leaderboardId,
        combinedContext.journeyType,
        error,
        combinedContext
      );
    } else {
      // Use standard logger for other errors
      this.logger.logger[logLevel](error.message, combinedContext);
    }
  }

  /**
   * Tracks an error in the monitoring system
   * @param error The error to track
   * @param severity Error severity
   * @param category Error category
   * @param additionalContext Additional context to include
   */
  private trackError(error: Error, severity: ErrorSeverity, category: ErrorCategory, additionalContext: Record<string, any> = {}): void {
    // Extract context from error
    const errorContext = error instanceof AppException 
      ? error.context 
      : (error as any).context || {};

    // Combine with additional context
    const combinedContext = {
      ...errorContext,
      ...additionalContext,
      errorName: error.name,
      errorType: error instanceof AppException ? error.errorType : (error as any).type,
      errorCode: error instanceof AppException ? error.errorCode : (error as any).errorCode,
      errorCategory: category,
      errorSeverity: severity
    };

    // Track the error in monitoring system
    this.monitoringService.trackError(error, combinedContext);

    // Increment error counter metric
    this.monitoringService.incrementCounter('gamification_errors_total', 1, {
      category,
      type: combinedContext.errorType || error.name,
      severity,
      journey: combinedContext.journeyType || 'unknown'
    });

    // If it's a critical error, trigger an alert
    if (severity === ErrorSeverity.CRITICAL) {
      this.monitoringService.triggerAlert('critical_error', {
        message: error.message,
        category,
        type: combinedContext.errorType || error.name,
        context: JSON.stringify(combinedContext)
      });
    }
  }

  /**
   * Generates a unique error ID
   * @returns Unique error ID
   */
  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Gets a default error code based on category and type
   * @param category Error category
   * @param type Error type
   * @returns Default error code
   */
  private getDefaultErrorCode(category: ErrorCategory, type: string): string {
    // Try to map to a predefined error code
    const errorCodeKey = Object.keys(ERROR_CODES).find(key => {
      return key.replace(/_/g, '').toLowerCase() === type.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    });

    if (errorCodeKey && ERROR_CODES[errorCodeKey]) {
      return ERROR_CODES[errorCodeKey].toString();
    }

    // Use a generic error code based on category
    switch (category) {
      case ErrorCategory.CLIENT:
        return ERROR_CODES.GENERAL_CLIENT_ERROR.toString();
      case ErrorCategory.SYSTEM:
        return ERROR_CODES.GENERAL_SERVER_ERROR.toString();
      case ErrorCategory.TRANSIENT:
        return ERROR_CODES.GENERAL_TRANSIENT_ERROR.toString();
      case ErrorCategory.EXTERNAL:
        return ERROR_CODES.GENERAL_EXTERNAL_ERROR.toString();
      default:
        return ERROR_CODES.GENERAL_SERVER_ERROR.toString();
    }
  }

  /**
   * Maps error category and type to AppErrorType for consistent API responses
   * @param category Error category
   * @param type Error type
   * @returns Mapped AppErrorType
   */
  private mapToAppErrorType(category: ErrorCategory, type: string): AppErrorType {
    // Direct mapping for common error types
    const typeMapping: Record<string, AppErrorType> = {
      'VALIDATION': AppErrorType.VALIDATION,
      'INVALID_INPUT': AppErrorType.VALIDATION,
      'UNAUTHORIZED': AppErrorType.AUTHENTICATION,
      'FORBIDDEN': AppErrorType.AUTHORIZATION,
      'NOT_FOUND': AppErrorType.NOT_FOUND,
      'CONFLICT': AppErrorType.CONFLICT,
      'BAD_REQUEST': AppErrorType.BAD_REQUEST,
      'INTERNAL_SERVER_ERROR': AppErrorType.INTERNAL,
      'DATABASE_ERROR': AppErrorType.DATABASE,
      'CONFIGURATION_ERROR': AppErrorType.CONFIGURATION,
      'EXTERNAL_SERVICE_ERROR': AppErrorType.EXTERNAL,
      'INTEGRATION_ERROR': AppErrorType.INTEGRATION,
      'KAFKA_ERROR': AppErrorType.KAFKA,
      'TRANSIENT_ERROR': AppErrorType.TRANSIENT,
      'TIMEOUT': AppErrorType.TIMEOUT,
      'RATE_LIMITED': AppErrorType.RATE_LIMIT
    };

    // Check for direct mapping
    if (typeMapping[type]) {
      return typeMapping[type];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(typeMapping)) {
      if (type.includes(key)) {
        return value;
      }
    }

    // Map based on category
    switch (category) {
      case ErrorCategory.CLIENT:
        if (type.includes('AUTH') || type.includes('TOKEN')) {
          return AppErrorType.AUTHENTICATION;
        }
        if (type.includes('PERMISSION')) {
          return AppErrorType.AUTHORIZATION;
        }
        if (type.includes('FOUND')) {
          return AppErrorType.NOT_FOUND;
        }
        if (type.includes('VALID') || type.includes('FORMAT')) {
          return AppErrorType.VALIDATION;
        }
        return AppErrorType.BAD_REQUEST;
      
      case ErrorCategory.SYSTEM:
        if (type.includes('DB') || type.includes('DATABASE')) {
          return AppErrorType.DATABASE;
        }
        if (type.includes('CONFIG')) {
          return AppErrorType.CONFIGURATION;
        }
        return AppErrorType.INTERNAL;
      
      case ErrorCategory.EXTERNAL:
        if (type.includes('KAFKA')) {
          return AppErrorType.KAFKA;
        }
        return AppErrorType.EXTERNAL;
      
      case ErrorCategory.TRANSIENT:
        if (type.includes('TIMEOUT')) {
          return AppErrorType.TIMEOUT;
        }
        if (type.includes('RATE')) {
          return AppErrorType.RATE_LIMIT;
        }
        return AppErrorType.TRANSIENT;
      
      default:
        return AppErrorType.INTERNAL;
    }
  }
}

/**
 * Creates a client error with journey context
 * @param message Error message
 * @param errorType Client error type
 * @param journeyType Journey type
 * @param metadata Additional error metadata
 * @returns Client error with journey context
 */
export function createClientError(
  message: string,
  errorType: ErrorType,
  journeyType: JourneyType,
  metadata: ClientErrorMetadata = {}
): Error {
  const error = new Error(message);
  (error as any).type = errorType;
  (error as any).category = ErrorCategory.CLIENT;
  (error as any).context = {
    journeyType,
    timestamp: new Date(),
    ...metadata
  };
  return error;
}

/**
 * Creates a system error with journey context
 * @param message Error message
 * @param errorType System error type
 * @param journeyType Journey type
 * @param metadata Additional error metadata
 * @returns System error with journey context
 */
export function createSystemError(
  message: string,
  errorType: ErrorType,
  journeyType: JourneyType,
  metadata: SystemErrorMetadata = {}
): Error {
  const error = new Error(message);
  (error as any).type = errorType;
  (error as any).category = ErrorCategory.SYSTEM;
  (error as any).context = {
    journeyType,
    timestamp: new Date(),
    ...metadata
  };
  return error;
}

/**
 * Creates a transient error with journey context
 * @param message Error message
 * @param errorType Transient error type
 * @param journeyType Journey type
 * @param metadata Additional error metadata
 * @returns Transient error with journey context
 */
export function createTransientError(
  message: string,
  errorType: ErrorType,
  journeyType: JourneyType,
  metadata: TransientErrorMetadata
): Error {
  const error = new Error(message);
  (error as any).type = errorType;
  (error as any).category = ErrorCategory.TRANSIENT;
  (error as any).isRetryable = true;
  (error as any).context = {
    journeyType,
    timestamp: new Date(),
    ...metadata
  };
  return error;
}

/**
 * Creates an external dependency error with journey context
 * @param message Error message
 * @param errorType External error type
 * @param journeyType Journey type
 * @param metadata Additional error metadata
 * @returns External error with journey context
 */
export function createExternalError(
  message: string,
  errorType: ErrorType,
  journeyType: JourneyType,
  metadata: ExternalErrorMetadata
): Error {
  const error = new Error(message);
  (error as any).type = errorType;
  (error as any).category = ErrorCategory.EXTERNAL;
  (error as any).isRetryable = [
    ErrorType.EXTERNAL_SERVICE_UNAVAILABLE,
    ErrorType.EXTERNAL_SERVICE_TIMEOUT,
    ErrorType.KAFKA_TEMPORARY_ERROR,
    ErrorType.KAFKA_REBALANCING,
    ErrorType.KAFKA_BROKER_UNAVAILABLE,
    ErrorType.AUTH_SERVICE_UNAVAILABLE,
    ErrorType.THIRD_PARTY_RATE_LIMIT
  ].includes(errorType);
  (error as any).context = {
    journeyType,
    timestamp: new Date(),
    ...metadata
  };
  return error;
}

/**
 * Wraps a function with error handling
 * @param fn Function to wrap
 * @param errorHandler Error handling service
 * @param options Error handling options
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T>(
  fn: (...args: any[]) => Promise<T>,
  errorHandler: ErrorHandlingService,
  options: ErrorHandlingOptions = {}
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      const result = errorHandler.handleError(error as Error, options);
      throw result.error;
    }
  };
}

/**
 * Decorator that adds error handling to a class method
 * @param options Error handling options
 * @returns Method decorator
 */
export function HandleError(options: ErrorHandlingOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Assume ErrorHandlingService is available as a class property
        const errorHandler = this.errorHandlingService as ErrorHandlingService;
        if (!errorHandler) {
          console.error('ErrorHandlingService not available in class instance');
          throw error;
        }

        const result = errorHandler.handleError(error as Error, options);
        throw result.error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator that adds journey-specific error handling to a class method
 * @param journeyType Journey type
 * @param options Additional error handling options
 * @returns Method decorator
 */
export function HandleJourneyError(journeyType: JourneyType, options: Omit<ErrorHandlingOptions, 'journeyType'> = {}) {
  return HandleError({ ...options, journeyType });
}

/**
 * Decorator that adds event-specific error handling to a class method
 * @param options Additional error handling options
 * @returns Method decorator
 */
export function HandleEventError(options: Omit<ErrorHandlingOptions, 'journeyType'> = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Assume ErrorHandlingService is available as a class property
        const errorHandler = this.errorHandlingService as ErrorHandlingService;
        if (!errorHandler) {
          console.error('ErrorHandlingService not available in class instance');
          throw error;
        }

        // Assume first argument is an event
        const event = args[0] as IBaseEvent;
        if (!event || !event.journeyType) {
          throw error;
        }

        // Enrich error with event context
        const enrichedError = errorHandler.enrichErrorWithEventContext(error as Error, event);
        
        // Handle the enriched error
        const result = errorHandler.handleError(enrichedError, options);
        throw result.error;
      }
    };

    return descriptor;
  };
}