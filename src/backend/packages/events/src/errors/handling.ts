import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker, CircuitBreakerOptions } from './circuit-breaker';
import { EventProcessingError, EventValidationError, EventSchemaError, EventTimeoutError } from './event-errors';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { EventResponse } from '../interfaces/event-response.interface';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';

/**
 * Error classification for event processing errors
 */
export enum ErrorCategory {
  // Errors that should never be retried (invalid data, schema errors)
  PERMANENT = 'PERMANENT',
  // Errors that should be retried (network issues, temporary service unavailability)
  TRANSIENT = 'TRANSIENT',
  // Errors that might be resolved with retry, but need careful handling
  INDETERMINATE = 'INDETERMINATE'
}

/**
 * Options for error handling in event processors
 */
export interface ErrorHandlingOptions {
  // Maximum number of retries before sending to DLQ
  maxRetries?: number;
  // Whether to use circuit breaker pattern
  useCircuitBreaker?: boolean;
  // Circuit breaker configuration
  circuitBreakerOptions?: CircuitBreakerOptions;
  // Whether to enable detailed error logging
  detailedLogging?: boolean;
  // Custom error classifier function
  errorClassifier?: (error: Error) => ErrorCategory;
  // Fallback function to execute when all retries are exhausted
  fallbackFn?: <T, R>(event: T) => Promise<R>;
}

/**
 * Default error handling options
 */
export const DEFAULT_ERROR_HANDLING_OPTIONS: ErrorHandlingOptions = {
  maxRetries: 3,
  useCircuitBreaker: true,
  detailedLogging: true,
  circuitBreakerOptions: {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    monitorInterval: 5000 // 5 seconds
  }
};

/**
 * Utility for classifying errors into categories for retry decisions
 */
export function classifyError(error: Error): ErrorCategory {
  // Schema and validation errors should never be retried
  if (error instanceof EventValidationError || error instanceof EventSchemaError) {
    return ErrorCategory.PERMANENT;
  }
  
  // Timeout errors are typically transient
  if (error instanceof EventTimeoutError) {
    return ErrorCategory.TRANSIENT;
  }
  
  // For EventProcessingError, check the error code or message for classification
  if (error instanceof EventProcessingError) {
    // Database connection errors, network errors are typically transient
    if (
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('temporarily unavailable')
    ) {
      return ErrorCategory.TRANSIENT;
    }
    
    // Data integrity errors, permission errors are typically permanent
    if (
      error.message.includes('permission denied') ||
      error.message.includes('not authorized') ||
      error.message.includes('integrity constraint') ||
      error.message.includes('duplicate key')
    ) {
      return ErrorCategory.PERMANENT;
    }
  }
  
  // For unknown errors, classify as indeterminate
  return ErrorCategory.INDETERMINATE;
}

/**
 * Decorator for adding standardized error handling to event processor methods
 * @param options Error handling options
 */
export function WithErrorHandling(options: ErrorHandlingOptions = DEFAULT_ERROR_HANDLING_OPTIONS) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const instance = this;
      const logger: LoggerService = instance.logger || new Logger('EventErrorHandler');
      const tracingService: TracingService = instance.tracingService;
      
      // Extract event from arguments (assuming first arg is the event)
      const event = args[0];
      const eventType = event?.type || 'unknown';
      const eventId = event?.eventId || 'unknown';
      
      // Create or get circuit breaker if enabled
      let circuitBreaker: CircuitBreaker | null = null;
      if (options.useCircuitBreaker) {
        const circuitBreakerKey = `${target.constructor.name}.${propertyKey}`;  
        circuitBreaker = CircuitBreaker.getInstance(
          circuitBreakerKey,
          options.circuitBreakerOptions || DEFAULT_ERROR_HANDLING_OPTIONS.circuitBreakerOptions
        );
      }
      
      // Create span for tracing if tracing service is available
      let span;
      if (tracingService) {
        span = tracingService.startSpan(`event.process.${eventType}`, {
          attributes: {
            'event.id': eventId,
            'event.type': eventType,
            'processor.name': target.constructor.name,
            'processor.method': propertyKey
          }
        });
      }
      
      try {
        // Check circuit breaker state before proceeding
        if (circuitBreaker && !circuitBreaker.isAllowed()) {
          logger.warn(
            `Circuit breaker open for ${target.constructor.name}.${propertyKey}. Skipping processing.`,
            {
              eventType,
              eventId,
              circuitBreaker: circuitBreaker.getState()
            }
          );
          
          // If fallback function is provided, use it
          if (options.fallbackFn) {
            return await options.fallbackFn(event);
          }
          
          throw new EventProcessingError(
            `Circuit breaker open for ${eventType}`,
            'CIRCUIT_BREAKER_OPEN',
            { eventId, eventType }
          );
        }
        
        // Execute the original method
        const result = await originalMethod.apply(instance, args);
        
        // Record success in circuit breaker
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }
        
        // Finish span if tracing is enabled
        if (span) {
          span.end();
        }
        
        return result;
      } catch (error) {
        // Record failure in circuit breaker
        if (circuitBreaker) {
          circuitBreaker.recordFailure();
        }
        
        // Classify error for retry decisions
        const errorCategory = options.errorClassifier 
          ? options.errorClassifier(error) 
          : classifyError(error);
        
        // Log error with appropriate level and context
        if (options.detailedLogging) {
          logger.error(
            `Error processing event ${eventType} (${eventId}): ${error.message}`,
            {
              error,
              eventType,
              eventId,
              errorCategory,
              stack: error.stack
            }
          );
        } else {
          logger.error(
            `Error processing event ${eventType}: ${error.message}`,
            { eventType, errorCategory }
          );
        }
        
        // Record error in tracing span
        if (span) {
          span.recordException(error);
          span.setAttributes({
            'error.category': errorCategory,
            'error.message': error.message,
            'error.type': error.constructor.name
          });
          span.end();
        }
        
        // If fallback function is provided and error is permanent, use it
        if (options.fallbackFn && errorCategory === ErrorCategory.PERMANENT) {
          try {
            return await options.fallbackFn(event);
          } catch (fallbackError) {
            logger.error(
              `Fallback function failed for event ${eventType}: ${fallbackError.message}`,
              { eventType, eventId, error: fallbackError }
            );
          }
        }
        
        // Rethrow the error for upstream handling
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator for adding retry capabilities to event processor methods
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay between retries in milliseconds
 */
export function WithRetry(maxRetries: number = 3, delayMs: number = 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const instance = this;
      const logger: LoggerService = instance.logger || new Logger('EventRetryHandler');
      
      // Extract event from arguments (assuming first arg is the event)
      const event = args[0];
      const eventType = event?.type || 'unknown';
      const eventId = event?.eventId || 'unknown';
      
      let lastError: Error;
      let attempt = 0;
      
      while (attempt <= maxRetries) {
        try {
          // Execute the original method
          return await originalMethod.apply(instance, args);
        } catch (error) {
          lastError = error;
          attempt++;
          
          // Classify error to determine if retry is appropriate
          const errorCategory = classifyError(error);
          
          // Don't retry permanent errors
          if (errorCategory === ErrorCategory.PERMANENT) {
            logger.warn(
              `Not retrying permanent error for event ${eventType} (${eventId}): ${error.message}`,
              { eventType, eventId, errorCategory }
            );
            throw error;
          }
          
          // If we've reached max retries, throw the last error
          if (attempt > maxRetries) {
            logger.error(
              `Max retries (${maxRetries}) reached for event ${eventType} (${eventId}): ${error.message}`,
              { eventType, eventId, attempts: attempt, error }
            );
            throw error;
          }
          
          // Log retry attempt
          logger.warn(
            `Retrying event ${eventType} (${eventId}) after error: ${error.message}. Attempt ${attempt} of ${maxRetries}`,
            { eventType, eventId, attempt, maxRetries, error: error.message }
          );
          
          // Wait before retrying
          // Use exponential backoff with jitter for better retry distribution
          const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
          const delay = delayMs * Math.pow(2, attempt - 1) * jitter;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // This should never be reached due to the throw in the loop, but TypeScript needs it
      throw lastError!;
    };
    
    return descriptor;
  };
}

/**
 * Decorator for adding fallback behavior to event processor methods
 * @param fallbackFn Function to execute when the original method fails
 */
export function WithFallback<T, R>(fallbackFn: (event: T) => Promise<R>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const instance = this;
      const logger: LoggerService = instance.logger || new Logger('EventFallbackHandler');
      
      // Extract event from arguments (assuming first arg is the event)
      const event = args[0];
      const eventType = event?.type || 'unknown';
      const eventId = event?.eventId || 'unknown';
      
      try {
        // Execute the original method
        return await originalMethod.apply(instance, args);
      } catch (error) {
        // Log fallback execution
        logger.warn(
          `Executing fallback for event ${eventType} (${eventId}) after error: ${error.message}`,
          { eventType, eventId, error: error.message }
        );
        
        // Execute fallback function
        return await fallbackFn(event);
      }
    };
    
    return descriptor;
  };
}

/**
 * Service for handling errors in event processing
 */
@Injectable()
export class EventErrorHandlingService {
  constructor(
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService
  ) {}
  
  /**
   * Wraps an event handler with error handling, tracing, and logging
   * @param handler Event handler to wrap
   * @param options Error handling options
   */
  wrapWithErrorHandling<T extends IBaseEvent, R>(
    handler: IEventHandler<T, R>,
    options: ErrorHandlingOptions = DEFAULT_ERROR_HANDLING_OPTIONS
  ): IEventHandler<T, EventResponse<R>> {
    const self = this;
    
    return {
      handle: async (event: T): Promise<EventResponse<R>> => {
        const eventType = event?.type || 'unknown';
        const eventId = event?.eventId || 'unknown';
        
        // Create circuit breaker if enabled
        let circuitBreaker: CircuitBreaker | null = null;
        if (options.useCircuitBreaker) {
          const circuitBreakerKey = `${handler.constructor.name}.handle`;
          circuitBreaker = CircuitBreaker.getInstance(
            circuitBreakerKey,
            options.circuitBreakerOptions || DEFAULT_ERROR_HANDLING_OPTIONS.circuitBreakerOptions
          );
        }
        
        // Create span for tracing
        const span = this.tracingService.startSpan(`event.process.${eventType}`, {
          attributes: {
            'event.id': eventId,
            'event.type': eventType,
            'handler.name': handler.constructor.name
          }
        });
        
        try {
          // Check circuit breaker state before proceeding
          if (circuitBreaker && !circuitBreaker.isAllowed()) {
            this.logger.warn(
              `Circuit breaker open for ${handler.constructor.name}. Skipping processing.`,
              {
                eventType,
                eventId,
                circuitBreaker: circuitBreaker.getState()
              }
            );
            
            return {
              success: false,
              error: {
                message: 'Circuit breaker open, processing skipped',
                code: 'CIRCUIT_BREAKER_OPEN',
                category: ErrorCategory.TRANSIENT
              },
              metadata: {
                eventId,
                eventType,
                timestamp: new Date().toISOString()
              }
            };
          }
          
          // Check if handler can handle this event type
          if (handler.canHandle && !handler.canHandle(event)) {
            return {
              success: false,
              error: {
                message: `Handler ${handler.constructor.name} cannot handle event type ${eventType}`,
                code: 'HANDLER_INCOMPATIBLE',
                category: ErrorCategory.PERMANENT
              },
              metadata: {
                eventId,
                eventType,
                timestamp: new Date().toISOString()
              }
            };
          }
          
          // Execute the handler
          const result = await handler.handle(event);
          
          // Record success in circuit breaker
          if (circuitBreaker) {
            circuitBreaker.recordSuccess();
          }
          
          // End span
          span.end();
          
          // Return success response
          return {
            success: true,
            data: result,
            metadata: {
              eventId,
              eventType,
              timestamp: new Date().toISOString()
            }
          };
        } catch (error) {
          // Record failure in circuit breaker
          if (circuitBreaker) {
            circuitBreaker.recordFailure();
          }
          
          // Classify error
          const errorCategory = options.errorClassifier 
            ? options.errorClassifier(error) 
            : classifyError(error);
          
          // Log error
          this.logger.error(
            `Error processing event ${eventType} (${eventId}): ${error.message}`,
            {
              error,
              eventType,
              eventId,
              errorCategory,
              stack: error.stack
            }
          );
          
          // Record error in span
          span.recordException(error);
          span.setAttributes({
            'error.category': errorCategory,
            'error.message': error.message,
            'error.type': error.constructor.name
          });
          span.end();
          
          // Try fallback if provided and error is permanent
          if (options.fallbackFn && errorCategory === ErrorCategory.PERMANENT) {
            try {
              const fallbackResult = await options.fallbackFn(event);
              return {
                success: true,
                data: fallbackResult,
                metadata: {
                  eventId,
                  eventType,
                  timestamp: new Date().toISOString(),
                  fallback: true
                }
              };
            } catch (fallbackError) {
              this.logger.error(
                `Fallback function failed for event ${eventType}: ${fallbackError.message}`,
                { eventType, eventId, error: fallbackError }
              );
            }
          }
          
          // Return error response
          return {
            success: false,
            error: {
              message: error.message,
              code: error instanceof EventProcessingError ? error.code : 'PROCESSING_ERROR',
              category: errorCategory,
              details: error instanceof EventProcessingError ? error.details : undefined
            },
            metadata: {
              eventId,
              eventType,
              timestamp: new Date().toISOString()
            }
          };
        }
      },
      
      canHandle: (event: T): boolean => {
        return handler.canHandle ? handler.canHandle(event) : true;
      },
      
      getEventType: (): string => {
        return handler.getEventType ? handler.getEventType() : 'unknown';
      }
    };
  }
  
  /**
   * Creates a safe event handler that catches all errors and returns a standardized response
   * @param handlerFn Function that processes an event
   * @param options Error handling options
   */
  createSafeEventHandler<T extends IBaseEvent, R>(
    handlerFn: (event: T) => Promise<R>,
    options: ErrorHandlingOptions = DEFAULT_ERROR_HANDLING_OPTIONS
  ): (event: T) => Promise<EventResponse<R>> {
    return async (event: T): Promise<EventResponse<R>> => {
      const eventType = event?.type || 'unknown';
      const eventId = event?.eventId || 'unknown';
      
      // Create span for tracing
      const span = this.tracingService.startSpan(`event.process.${eventType}`, {
        attributes: {
          'event.id': eventId,
          'event.type': eventType,
          'handler.type': 'function'
        }
      });
      
      try {
        // Execute the handler function
        const result = await handlerFn(event);
        
        // End span
        span.end();
        
        // Return success response
        return {
          success: true,
          data: result,
          metadata: {
            eventId,
            eventType,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        // Classify error
        const errorCategory = options.errorClassifier 
          ? options.errorClassifier(error) 
          : classifyError(error);
        
        // Log error
        this.logger.error(
          `Error in function handler for event ${eventType} (${eventId}): ${error.message}`,
          {
            error,
            eventType,
            eventId,
            errorCategory,
            stack: error.stack
          }
        );
        
        // Record error in span
        span.recordException(error);
        span.setAttributes({
          'error.category': errorCategory,
          'error.message': error.message,
          'error.type': error.constructor.name
        });
        span.end();
        
        // Try fallback if provided and error is permanent
        if (options.fallbackFn && errorCategory === ErrorCategory.PERMANENT) {
          try {
            const fallbackResult = await options.fallbackFn(event);
            return {
              success: true,
              data: fallbackResult,
              metadata: {
                eventId,
                eventType,
                timestamp: new Date().toISOString(),
                fallback: true
              }
            };
          } catch (fallbackError) {
            this.logger.error(
              `Fallback function failed for event ${eventType}: ${fallbackError.message}`,
              { eventType, eventId, error: fallbackError }
            );
          }
        }
        
        // Return error response
        return {
          success: false,
          error: {
            message: error.message,
            code: error instanceof EventProcessingError ? error.code : 'PROCESSING_ERROR',
            category: errorCategory,
            details: error instanceof EventProcessingError ? error.details : undefined
          },
          metadata: {
            eventId,
            eventType,
            timestamp: new Date().toISOString()
          }
        };
      }
    };
  }
}