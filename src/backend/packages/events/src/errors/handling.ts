/**
 * @module @austa/events/errors
 * 
 * This module provides comprehensive error handling utilities for event processing.
 * It includes decorators for consistent error handling, circuit breaker implementation,
 * structured logging utilities, and helper functions for error recovery.
 * 
 * @example
 * // Using the decorator on an event handler class
 * @EventErrorHandling({
 *   maxRetries: 3,
 *   useCircuitBreaker: true,
 *   sendToDlq: true,
 *   journeyConfig: {
 *     health: { maxRetries: 5 }
 *   }
 * })
 * export class HealthEventHandler implements IEventHandler<HealthEvent> {
 *   
 *   @HandleEventErrors()
 *   async handle(event: HealthEvent): Promise<IEventResponse> {
 *     // Process event
 *   }
 * }
 */

import { Injectable, Logger, SetMetadata, Type } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { 
  AppException, 
  ErrorType, 
  ExternalDependencyUnavailableError, 
  ExternalResponseFormatError,
  TechnicalError,
  BusinessError,
  DatabaseError,
  NetworkError,
  ValidationError
} from '@austa/errors';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IEventResponse } from '../interfaces/event-response.interface';

/**
 * Metadata key for event error handling options
 */
export const EVENT_ERROR_HANDLING_OPTIONS = 'event_error_handling_options';

/**
 * Options for event error handling
 */
export interface EventErrorHandlingOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Backoff factor for exponential delay calculation */
  backoffFactor?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Whether to use circuit breaker */
  useCircuitBreaker?: boolean;
  /** Whether to send to DLQ on failure */
  sendToDlq?: boolean;
  /** Custom error classifier function */
  errorClassifier?: (error: Error) => ErrorClassification;
  /** Fallback function to execute when all retries fail */
  fallback?: <T extends IBaseEvent>(event: T) => Promise<IEventResponse>;
  /** Journey-specific error handling configuration */
  journeyConfig?: {
    /** Health journey specific configuration */
    health?: Partial<EventErrorHandlingOptions>;
    /** Care journey specific configuration */
    care?: Partial<EventErrorHandlingOptions>;
    /** Plan journey specific configuration */
    plan?: Partial<EventErrorHandlingOptions>;
  };
  /** Event type specific error handling configuration */
  eventTypeConfig?: Record<string, Partial<EventErrorHandlingOptions>>;
}

/**
 * Default error handling options
 */
export const DEFAULT_ERROR_HANDLING_OPTIONS: EventErrorHandlingOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 30000,
  useCircuitBreaker: true,
  sendToDlq: true,
};

/**
 * Error classification for determining retry behavior
 */
export enum ErrorClassification {
  /** Transient errors that should be retried */
  RETRYABLE,
  /** Permanent errors that should not be retried */
  NON_RETRYABLE,
  /** Critical errors that should trigger circuit breaking */
  CRITICAL
}

/**
 * Circuit breaker states
 */
enum CircuitBreakerState {
  CLOSED,
  OPEN,
  HALF_OPEN
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Failure threshold to open the circuit */
  failureThreshold: number;
  /** Success threshold to close the circuit */
  successThreshold: number;
  /** Timeout in milliseconds before transitioning to half-open */
  resetTimeout: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 60000, // 1 minute
};

/**
 * Circuit breaker implementation for preventing cascading failures
 */
@Injectable()
export class EventCircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastStateChange: number = Date.now();
  private readonly config: CircuitBreakerConfig;
  private readonly logger: LoggerService;
  private readonly serviceName: string;

  /**
   * Creates a new circuit breaker instance
   * 
   * @param serviceName Name of the service for logging
   * @param config Circuit breaker configuration
   * @param logger Logger service
   */
  constructor(
    serviceName: string,
    config: Partial<CircuitBreakerConfig> = {},
    logger?: LoggerService
  ) {
    this.serviceName = serviceName;
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
    this.logger = logger || new Logger(serviceName) as unknown as LoggerService;
  }

  /**
   * Executes a function with circuit breaker protection
   * 
   * @param fn Function to execute
   * @returns Result of the function
   * @throws Error if circuit is open or function execution fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      this.logger.warn(
        `Circuit breaker is open for ${this.serviceName}`,
        { state: this.state, lastStateChange: new Date(this.lastStateChange).toISOString() },
        'CircuitBreaker'
      );
      throw new ExternalDependencyUnavailableError(
        `Service ${this.serviceName} is unavailable (circuit open)`
      );
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Checks if the circuit is open
   * 
   * @returns True if the circuit is open, false otherwise
   */
  isOpen(): boolean {
    if (this.state === CircuitBreakerState.OPEN) {
      const now = Date.now();
      if (now - this.lastStateChange > this.config.resetTimeout) {
        this.transitionToHalfOpen();
      }
    }
    return this.state === CircuitBreakerState.OPEN;
  }

  /**
   * Records a successful execution
   */
  private recordSuccess(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    } else {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Records a failed execution
   */
  private recordFailure(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionToOpen();
    } else if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Transitions the circuit to open state
   */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.lastStateChange = Date.now();
    this.logger.warn(
      `Circuit breaker transitioned to OPEN for ${this.serviceName}`,
      { previousState: CircuitBreakerState[this.state], failureCount: this.failureCount },
      'CircuitBreaker'
    );
  }

  /**
   * Transitions the circuit to half-open state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.lastStateChange = Date.now();
    this.successCount = 0;
    this.logger.log(
      `Circuit breaker transitioned to HALF_OPEN for ${this.serviceName}`,
      { previousState: CircuitBreakerState.OPEN },
      'CircuitBreaker'
    );
  }

  /**
   * Transitions the circuit to closed state
   */
  private transitionToClosed(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.lastStateChange = Date.now();
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.log(
      `Circuit breaker transitioned to CLOSED for ${this.serviceName}`,
      { previousState: CircuitBreakerState.HALF_OPEN },
      'CircuitBreaker'
    );
  }

  /**
   * Resets the circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.lastStateChange = Date.now();
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.log(
      `Circuit breaker manually reset to CLOSED for ${this.serviceName}`,
      { previousState: this.state },
      'CircuitBreaker'
    );
  }
}

/**
 * Registry of circuit breakers for different services
 */
const circuitBreakerRegistry = new Map<string, EventCircuitBreaker>();

/**
 * Gets or creates a circuit breaker for a service
 * 
 * @param serviceName Name of the service
 * @param config Circuit breaker configuration
 * @param logger Logger service
 * @returns Circuit breaker instance
 */
export function getCircuitBreaker(
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>,
  logger?: LoggerService
): EventCircuitBreaker {
  if (!circuitBreakerRegistry.has(serviceName)) {
    circuitBreakerRegistry.set(
      serviceName,
      new EventCircuitBreaker(serviceName, config, logger)
    );
  }
  return circuitBreakerRegistry.get(serviceName)!;
}

/**
 * Decorator for setting error handling options on an event handler
 * 
 * @param options Error handling options
 * @returns Class decorator
 */
export function EventErrorHandling(options: Partial<EventErrorHandlingOptions> = {}) {
  return SetMetadata(EVENT_ERROR_HANDLING_OPTIONS, {
    ...DEFAULT_ERROR_HANDLING_OPTIONS,
    ...options
  });
}

/**
 * Decorator for wrapping an event handler method with error handling
 * 
 * @param options Optional error handling options that override class-level options
 * @returns Method decorator
 */
export function HandleEventErrors(options?: Partial<EventErrorHandlingOptions>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get the event handler instance
      const instance = this as IEventHandler<any>;
      
      // Get the event from arguments
      const event = args[0] as IBaseEvent;
      
      // Get error handling options from metadata or use defaults
      const classOptions: EventErrorHandlingOptions = Reflect.getMetadata(
        EVENT_ERROR_HANDLING_OPTIONS,
        instance.constructor
      ) || DEFAULT_ERROR_HANDLING_OPTIONS;
      
      // Get method-level options if provided
      const methodOptions: Partial<EventErrorHandlingOptions> = Reflect.getMetadata(
        EVENT_ERROR_HANDLING_OPTIONS,
        instance,
        propertyKey
      ) || {};
      
      // Merge options with method options taking precedence
      let options: EventErrorHandlingOptions = {
        ...classOptions,
        ...methodOptions
      };
      
      // Apply journey-specific configuration if available
      if (event.journey && options.journeyConfig && options.journeyConfig[event.journey as keyof typeof options.journeyConfig]) {
        options = {
          ...options,
          ...options.journeyConfig[event.journey as keyof typeof options.journeyConfig]
        };
      }
      
      // Apply event type specific configuration if available
      if (options.eventTypeConfig && options.eventTypeConfig[event.type]) {
        options = {
          ...options,
          ...options.eventTypeConfig[event.type]
        };
      }

      // Get logger and tracing services if available
      const logger = (this.logger || new Logger(instance.constructor.name)) as LoggerService;
      const tracer = this.tracer as TracingService | undefined;

      // Create a correlation ID for tracing
      const correlationId = event.metadata?.correlationId || 
        (tracer ? tracer.getCurrentTraceId() : undefined) || 
        `event-${event.eventId}`;

      // Log the start of processing
      logger.log(
        `Processing event: ${event.type}`,
        { 
          correlationId,
          eventId: event.eventId,
          eventType: event.type,
          source: event.source,
          version: event.version
        },
        instance.constructor.name
      );

      // Initialize retry counter
      let retryCount = 0;
      let lastError: Error | null = null;

      // Get or create circuit breaker if enabled
      let circuitBreaker: EventCircuitBreaker | undefined;
      if (options.useCircuitBreaker) {
        const serviceName = event.source || instance.constructor.name;
        circuitBreaker = getCircuitBreaker(serviceName, undefined, logger);
      }

      // Implement retry with exponential backoff
      while (retryCount <= (options.maxRetries || 0)) {
        try {
          // Execute with circuit breaker if enabled
          let result: IEventResponse;
          if (circuitBreaker) {
            result = await circuitBreaker.execute(() => originalMethod.apply(this, args));
          } else {
            result = await originalMethod.apply(this, args);
          }

          // Log successful processing
          logger.log(
            `Event processed successfully: ${event.type}`,
            { 
              correlationId,
              eventId: event.eventId,
              eventType: event.type,
              source: event.source,
              success: result.success,
              retryCount
            },
            instance.constructor.name
          );

          return result;
        } catch (error) {
          lastError = error as Error;

          // Classify the error
          const errorClassification = classifyError(error, options.errorClassifier);

          // Log the error with appropriate level based on classification
          logEventError(
            error as Error,
            event,
            {
              correlationId,
              retryCount,
              classification: errorClassification,
              handlerName: instance.constructor.name
            },
            logger
          );

          // Check if error is retryable and if we have retries left
          if (
            errorClassification === ErrorClassification.NON_RETRYABLE ||
            retryCount >= (options.maxRetries || 0)
          ) {
            break;
          }

          // Calculate backoff delay with exponential strategy
          const delay = calculateBackoffDelay(
            retryCount,
            options.initialDelay || DEFAULT_ERROR_HANDLING_OPTIONS.initialDelay!,
            options.backoffFactor || DEFAULT_ERROR_HANDLING_OPTIONS.backoffFactor!,
            options.maxDelay || DEFAULT_ERROR_HANDLING_OPTIONS.maxDelay!
          );

          // Log retry attempt
          logger.warn(
            `Retrying event processing (${retryCount + 1}/${(options.maxRetries || 0) + 1}): ${event.type} after ${delay}ms`,
            { 
              correlationId,
              eventId: event.eventId,
              eventType: event.type,
              source: event.source,
              retryCount: retryCount + 1,
              delay,
              error: error instanceof Error ? error.message : String(error)
            },
            instance.constructor.name
          );

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        }
      }

      // If we reach here, all retries have failed
      if (lastError) {
        // Try fallback if provided
        if (options.fallback) {
          try {
            logger.warn(
              `Executing fallback for failed event: ${event.type}`,
              { 
                correlationId,
                eventId: event.eventId,
                eventType: event.type,
                source: event.source,
                error: lastError.message
              },
              instance.constructor.name
            );

            return await options.fallback(event);
          } catch (fallbackError) {
            logger.error(
              `Fallback execution failed for event: ${event.type}`,
              fallbackError instanceof Error ? fallbackError.stack : String(fallbackError),
              instance.constructor.name,
              { 
                correlationId,
                eventId: event.eventId,
                eventType: event.type,
                source: event.source,
                originalError: lastError.message
              }
            );
          }
        }

        // Send to DLQ if enabled
        if (options.sendToDlq && instance.sendToDlq) {
          try {
            await instance.sendToDlq(event, lastError, {
              correlationId,
              retryCount: options.maxRetries || 0
            });

            logger.log(
              `Event sent to DLQ: ${event.type}`,
              { 
                correlationId,
                eventId: event.eventId,
                eventType: event.type,
                source: event.source
              },
              instance.constructor.name
            );
          } catch (dlqError) {
            logger.error(
              `Failed to send event to DLQ: ${event.type}`,
              dlqError instanceof Error ? dlqError.stack : String(dlqError),
              instance.constructor.name,
              { 
                correlationId,
                eventId: event.eventId,
                eventType: event.type,
                source: event.source
              }
            );
          }
        }

        // Return error response
        return {
          success: false,
          error: {
            message: lastError.message,
            code: lastError instanceof AppException ? lastError.code : 'PROCESSING_ERROR',
            type: lastError instanceof AppException ? lastError.type : ErrorType.TECHNICAL
          }
        };
      }

      // This should never happen, but just in case
      return {
        success: false,
        error: {
          message: 'Unknown error during event processing',
          code: 'UNKNOWN_ERROR',
          type: ErrorType.TECHNICAL
        }
      };
    };

    return descriptor;
  };
}

/**
 * Classifies an error to determine retry behavior
 * 
 * @param error The error to classify
 * @param customClassifier Optional custom classifier function
 * @returns Error classification
 */
export function classifyError(
  error: unknown,
  customClassifier?: (error: Error) => ErrorClassification
): ErrorClassification {
  // Use custom classifier if provided
  if (customClassifier && error instanceof Error) {
    return customClassifier(error);
  }

  // Check for custom retryable property
  if (error instanceof Error) {
    // @ts-ignore - Check for custom retryable property
    if (typeof error.retryable === 'boolean') {
      // @ts-ignore
      return error.retryable ? 
        ErrorClassification.RETRYABLE : 
        ErrorClassification.NON_RETRYABLE;
    }

    // Check for critical property
    // @ts-ignore - Check for custom critical property
    if (typeof error.critical === 'boolean' && error.critical) {
      return ErrorClassification.CRITICAL;
    }
  }

  // Classify based on error type
  if (error instanceof ExternalDependencyUnavailableError) {
    return ErrorClassification.RETRYABLE;
  }

  if (error instanceof ExternalResponseFormatError) {
    return ErrorClassification.NON_RETRYABLE;
  }
  
  if (error instanceof DatabaseError) {
    // Database errors are typically retryable
    // except for constraint violations and schema errors
    if (
      error.message.includes('constraint') ||
      error.message.includes('schema') ||
      error.message.includes('duplicate key')
    ) {
      return ErrorClassification.NON_RETRYABLE;
    }
    return ErrorClassification.RETRYABLE;
  }
  
  if (error instanceof NetworkError) {
    // Network errors are almost always retryable
    return ErrorClassification.RETRYABLE;
  }
  
  if (error instanceof ValidationError) {
    // Validation errors are never retryable
    return ErrorClassification.NON_RETRYABLE;
  }

  if (error instanceof TechnicalError) {
    // Most technical errors are retryable
    return ErrorClassification.RETRYABLE;
  }

  if (error instanceof BusinessError) {
    // Business errors are typically non-retryable
    return ErrorClassification.NON_RETRYABLE;
  }

  if (error instanceof AppException) {
    // Classify based on error type
    switch (error.type) {
      case ErrorType.EXTERNAL:
        return ErrorClassification.RETRYABLE;
      case ErrorType.TECHNICAL:
        return ErrorClassification.RETRYABLE;
      case ErrorType.BUSINESS:
      case ErrorType.VALIDATION:
      default:
        return ErrorClassification.NON_RETRYABLE;
    }
  }

  // For generic errors, check message for common transient error patterns
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('temporarily unavailable') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('socket hang up')
    ) {
      return ErrorClassification.RETRYABLE;
    }
  }

  // By default, don't retry unknown error types
  return ErrorClassification.NON_RETRYABLE;
}

/**
 * Calculates the backoff delay for retries with exponential strategy
 * 
 * @param retryCount Current retry count
 * @param initialDelay Initial delay in milliseconds
 * @param backoffFactor Backoff factor for exponential calculation
 * @param maxDelay Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  retryCount: number,
  initialDelay: number,
  backoffFactor: number,
  maxDelay: number
): number {
  // Calculate base delay with exponential backoff
  const baseDelay = initialDelay * Math.pow(backoffFactor, retryCount);
  
  // Add jitter to prevent thundering herd problem (±10%)
  const jitter = baseDelay * 0.1 * (Math.random() * 2 - 1);
  
  // Apply jitter and cap at maximum delay
  return Math.min(baseDelay + jitter, maxDelay);
}

/**
 * Context for logging event errors
 */
interface EventErrorLoggingContext {
  correlationId: string;
  retryCount: number;
  classification: ErrorClassification;
  handlerName: string;
}

/**
 * Logs an event processing error with appropriate level and context
 * 
 * @param error The error that occurred
 * @param event The event being processed
 * @param context Additional context for logging
 * @param logger Logger service
 */
export function logEventError(
  error: Error,
  event: IBaseEvent,
  context: EventErrorLoggingContext,
  logger: LoggerService
): void {
  const { correlationId, retryCount, classification, handlerName } = context;
  
  // Prepare log context
  const logContext = {
    correlationId,
    eventId: event.eventId,
    eventType: event.type,
    source: event.source,
    retryCount,
    classification: ErrorClassification[classification],
    errorType: error instanceof AppException ? error.type : 'UNKNOWN',
    errorCode: error instanceof AppException ? error.code : undefined
  };

  // Log with appropriate level based on classification and retry count
  if (classification === ErrorClassification.CRITICAL) {
    logger.error(
      `Critical error processing event: ${event.type}`,
      error.stack,
      handlerName,
      logContext
    );
  } else if (classification === ErrorClassification.NON_RETRYABLE) {
    logger.error(
      `Non-retryable error processing event: ${event.type}`,
      error.stack,
      handlerName,
      logContext
    );
  } else if (retryCount >= 3) { // Log as error for last retry attempts
    logger.error(
      `Error processing event (retry ${retryCount}): ${event.type}`,
      error.stack,
      handlerName,
      logContext
    );
  } else { // Log as warning for initial retry attempts
    logger.warn(
      `Error processing event (retry ${retryCount}): ${event.type} - ${error.message}`,
      logContext,
      handlerName
    );
  }
}

/**
 * Creates a fallback function that returns a default response
 * 
 * @param defaultResponse Default response to return
 * @returns Fallback function
 * 
 * @example
 * // Using default fallback in event handler
 * @EventErrorHandling({
 *   fallback: createDefaultFallback({
 *     data: { status: 'degraded' },
 *     metadata: { source: 'fallback' }
 *   })
 * })
 * export class HealthEventHandler implements IEventHandler<HealthEvent> {
 *   // ...
 * }
 */
export function createDefaultFallback<T extends IBaseEvent>(
  defaultResponse: Partial<IEventResponse>
): (event: T) => Promise<IEventResponse> {
  return async () => ({
    success: false,
    ...defaultResponse
  });
}

/**
 * Creates a fallback function that returns cached data
 * 
 * @param cacheProvider Function that retrieves cached data
 * @returns Fallback function
 * 
 * @example
 * // Using cached data fallback in event handler
 * @EventErrorHandling({
 *   fallback: createCachedDataFallback(async (event) => {
 *     // Retrieve cached data from Redis or other cache
 *     return redisClient.get(`health:${event.userId}`);
 *   })
 * })
 * export class HealthEventHandler implements IEventHandler<HealthEvent> {
 *   // ...
 * }
 */
export function createCachedDataFallback<T extends IBaseEvent, R>(
  cacheProvider: (event: T) => Promise<R | null>
): (event: T) => Promise<IEventResponse> {
  return async (event: T) => {
    const cachedData = await cacheProvider(event);
    
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        metadata: {
          fromCache: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    return {
      success: false,
      error: {
        message: 'Failed to process event and no cached data available',
        code: 'NO_CACHED_DATA',
        type: ErrorType.TECHNICAL
      }
    };
  };
}

/**
 * Creates a fallback function that gracefully degrades functionality
 * 
 * @param degradedProcessor Function that provides degraded functionality
 * @returns Fallback function
 * 
 * @example
 * // Using graceful degradation fallback in event handler
 * @EventErrorHandling({
 *   fallback: createGracefulDegradationFallback(async (event) => {
 *     // Provide limited functionality without external dependencies
 *     return {
 *       success: true,
 *       data: { 
 *         limitedData: true,
 *         message: 'Limited functionality available'
 *       }
 *     };
 *   })
 * })
 * export class HealthEventHandler implements IEventHandler<HealthEvent> {
 *   // ...
 * }
 */
export function createGracefulDegradationFallback<T extends IBaseEvent>(
  degradedProcessor: (event: T) => Promise<IEventResponse>
): (event: T) => Promise<IEventResponse> {
  return async (event: T) => {
    try {
      const result = await degradedProcessor(event);
      return {
        ...result,
        metadata: {
          ...result.metadata,
          degraded: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to process event with degraded functionality',
          code: 'DEGRADED_PROCESSING_FAILED',
          type: ErrorType.TECHNICAL
        },
        metadata: {
          degraded: true
        }
      };
    }
  };
}

/**
 * Factory for creating event error handlers with consistent configuration
 * 
 * @param baseOptions Base error handling options for all handlers
 * @returns Factory function for creating decorated handler classes
 * 
 * @example
 * // Create a factory for health journey event handlers
 * const healthEventHandlerFactory = createEventErrorHandlerFactory({
 *   maxRetries: 5,
 *   useCircuitBreaker: true,
 *   sendToDlq: true,
 *   eventTypeConfig: {
 *     'health.metric.recorded': { maxRetries: 3 },
 *     'health.goal.achieved': { maxRetries: 0 }
 *   }
 * });
 * 
 * // Apply factory to handler classes
 * @healthEventHandlerFactory
 * export class MetricRecordedHandler implements IEventHandler<MetricRecordedEvent> {
 *   // ...
 * }
 */
export function createEventErrorHandlerFactory(baseOptions: Partial<EventErrorHandlingOptions>) {
  return function decorateEventHandler<T extends Type<any>>(handlerClass: T): T {
    // Apply the EventErrorHandling decorator with the provided options
    EventErrorHandling(baseOptions)(handlerClass);
    return handlerClass;
  };
}

/**
 * Interface for DLQ context information
 */
export interface DlqContext {
  /** Correlation ID for tracing */
  correlationId: string;
  /** Number of retry attempts made */
  retryCount: number;
  /** Additional metadata for DLQ */
  [key: string]: any;
}

/**
 * Interface for event handlers that support DLQ integration
 */
export interface IDlqCapableEventHandler<T extends IBaseEvent> extends IEventHandler<T> {
  /**
   * Sends a failed event to the dead letter queue
   * 
   * @param event The event that failed processing
   * @param error The error that caused the failure
   * @param context Additional context for DLQ
   */
  sendToDlq(event: T, error: Error, context: DlqContext): Promise<void>;
}

/**
 * Utility for wrapping an event handler function with error handling
 * 
 * @param handlerFn The event handler function to wrap
 * @param options Error handling options
 * @param logger Logger service
 * @param tracer Optional tracing service
 * @returns Wrapped handler function with error handling
 * 
 * @example
 * // Wrap a standalone event handler function
 * const processHealthEvent = async (event: HealthEvent): Promise<IEventResponse> => {
 *   // Process event
 *   return { success: true, data: { processed: true } };
 * };
 * 
 * // Create wrapped handler with error handling
 * const safeProcessHealthEvent = wrapWithErrorHandling(
 *   processHealthEvent,
 *   { 
 *     maxRetries: 3,
 *     useCircuitBreaker: true,
 *     fallback: createDefaultFallback({ data: { status: 'degraded' } })
 *   },
 *   loggerService,
 *   tracingService
 * );
 * 
 * // Use the wrapped handler
 * const result = await safeProcessHealthEvent(healthEvent);
 */
export function wrapWithErrorHandling<T extends IBaseEvent>(
  handlerFn: (event: T) => Promise<IEventResponse>,
  options: Partial<EventErrorHandlingOptions> = {},
  logger: LoggerService,
  tracer?: TracingService
): (event: T) => Promise<IEventResponse> {
  const mergedOptions: EventErrorHandlingOptions = {
    ...DEFAULT_ERROR_HANDLING_OPTIONS,
    ...options
  };
  
  return async (event: T): Promise<IEventResponse> => {
    // Create a correlation ID for tracing
    const correlationId = event.metadata?.correlationId || 
      (tracer ? tracer.getCurrentTraceId() : undefined) || 
      `event-${event.eventId}`;

    // Log the start of processing
    logger.log(
      `Processing event: ${event.type}`,
      { 
        correlationId,
        eventId: event.eventId,
        eventType: event.type,
        source: event.source,
        version: event.version
      },
      'EventHandler'
    );

    // Initialize retry counter
    let retryCount = 0;
    let lastError: Error | null = null;

    // Get or create circuit breaker if enabled
    let circuitBreaker: EventCircuitBreaker | undefined;
    if (mergedOptions.useCircuitBreaker) {
      const serviceName = event.source || 'EventHandler';
      circuitBreaker = getCircuitBreaker(serviceName, undefined, logger);
    }

    // Implement retry with exponential backoff
    while (retryCount <= (mergedOptions.maxRetries || 0)) {
      try {
        // Execute with circuit breaker if enabled
        let result: IEventResponse;
        if (circuitBreaker) {
          result = await circuitBreaker.execute(() => handlerFn(event));
        } else {
          result = await handlerFn(event);
        }

        // Log successful processing
        logger.log(
          `Event processed successfully: ${event.type}`,
          { 
            correlationId,
            eventId: event.eventId,
            eventType: event.type,
            source: event.source,
            success: result.success,
            retryCount
          },
          'EventHandler'
        );

        return result;
      } catch (error) {
        lastError = error as Error;

        // Classify the error
        const errorClassification = classifyError(error, mergedOptions.errorClassifier);

        // Log the error with appropriate level based on classification
        logEventError(
          error as Error,
          event,
          {
            correlationId,
            retryCount,
            classification: errorClassification,
            handlerName: 'EventHandler'
          },
          logger
        );

        // Check if error is retryable and if we have retries left
        if (
          errorClassification === ErrorClassification.NON_RETRYABLE ||
          retryCount >= (mergedOptions.maxRetries || 0)
        ) {
          break;
        }

        // Calculate backoff delay with exponential strategy
        const delay = calculateBackoffDelay(
          retryCount,
          mergedOptions.initialDelay || DEFAULT_ERROR_HANDLING_OPTIONS.initialDelay!,
          mergedOptions.backoffFactor || DEFAULT_ERROR_HANDLING_OPTIONS.backoffFactor!,
          mergedOptions.maxDelay || DEFAULT_ERROR_HANDLING_OPTIONS.maxDelay!
        );

        // Log retry attempt
        logger.warn(
          `Retrying event processing (${retryCount + 1}/${(mergedOptions.maxRetries || 0) + 1}): ${event.type} after ${delay}ms`,
          { 
            correlationId,
            eventId: event.eventId,
            eventType: event.type,
            source: event.source,
            retryCount: retryCount + 1,
            delay,
            error: error instanceof Error ? error.message : String(error)
          },
          'EventHandler'
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      }
    }

    // If we reach here, all retries have failed
    if (lastError) {
      // Try fallback if provided
      if (mergedOptions.fallback) {
        try {
          logger.warn(
            `Executing fallback for failed event: ${event.type}`,
            { 
              correlationId,
              eventId: event.eventId,
              eventType: event.type,
              source: event.source,
              error: lastError.message
            },
            'EventHandler'
          );

          return await mergedOptions.fallback(event);
        } catch (fallbackError) {
          logger.error(
            `Fallback execution failed for event: ${event.type}`,
            fallbackError instanceof Error ? fallbackError.stack : String(fallbackError),
            'EventHandler',
            { 
              correlationId,
              eventId: event.eventId,
              eventType: event.type,
              source: event.source,
              originalError: lastError.message
            }
          );
        }
      }

      // Return error response
      return {
        success: false,
        error: {
          message: lastError.message,
          code: lastError instanceof AppException ? lastError.code : 'PROCESSING_ERROR',
          type: lastError instanceof AppException ? lastError.type : ErrorType.TECHNICAL
        }
      };
    }

    // This should never happen, but just in case
    return {
      success: false,
      error: {
        message: 'Unknown error during event processing',
        code: 'UNKNOWN_ERROR',
        type: ErrorType.TECHNICAL
      }
    };
  };
}