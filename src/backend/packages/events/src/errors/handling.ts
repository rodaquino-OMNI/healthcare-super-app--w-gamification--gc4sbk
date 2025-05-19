import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker, CircuitBreakerOptions } from './circuit-breaker';
import { EventProcessingError, EventValidationError } from './event-errors';
import { sendToDlq } from './dlq';
import { applyRetryPolicy } from './retry-policies';

// Import interfaces from the interfaces directory
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { IEventResponse } from '../interfaces/event-response.interface';

// Import tracing for enhanced error logging
import { TraceContext, getCurrentTraceId } from '@austa/tracing';

/**
 * @fileoverview
 * This file provides comprehensive error handling utilities for event processing.
 * 
 * It includes:
 * - Decorators for wrapping event processors with standardized error handling
 * - Circuit breaker implementation to prevent cascading failures
 * - Structured logging utilities for event processing errors
 * - Helper functions for error recovery with fallback mechanisms
 * 
 * These utilities ensure consistent error handling patterns across all event processors
 * and seamless integration with retry and DLQ systems.
 */

/**
 * Logger instance for event error handling
 */
const logger = new Logger('EventErrorHandler');

/**
 * Processing stages for event handling
 * Used to track where in the pipeline an error occurred
 */
export enum EventProcessingStage {
  VALIDATION = 'validation',
  DESERIALIZATION = 'deserialization',
  PROCESSING = 'processing',
  PERSISTENCE = 'persistence',
  NOTIFICATION = 'notification',
  RESPONSE = 'response'
}

/**
 * Options for configuring error handling behavior
 */
export interface ErrorHandlingOptions {
  /**
   * Whether to automatically send failed events to DLQ
   */
  sendToDlq?: boolean;
  
  /**
   * Whether to apply retry policies based on error type
   */
  applyRetryPolicy?: boolean;
  
  /**
   * Whether to use circuit breaker pattern
   */
  useCircuitBreaker?: boolean;
  
  /**
   * Circuit breaker configuration
   */
  circuitBreakerOptions?: CircuitBreakerOptions;
  
  /**
   * Custom error handler function
   */
  customErrorHandler?: (error: Error, event: IBaseEvent) => Promise<void>;
  
  /**
   * Journey context for error handling
   */
  journeyContext?: 'health' | 'care' | 'plan' | 'gamification';
  
  /**
   * Whether to include tracing information in error logs
   */
  includeTracing?: boolean;
  
  /**
   * Processing stage where the error occurred
   * Helps with debugging and monitoring specific parts of the pipeline
   */
  processingStage?: EventProcessingStage;
  
  /**
   * Maximum number of retries before sending to DLQ
   * If not specified, uses the default from retry policy
   */
  maxRetries?: number;
}

/**
 * Default error handling options
 */
const defaultErrorHandlingOptions: ErrorHandlingOptions = {
  sendToDlq: true,
  applyRetryPolicy: true,
  useCircuitBreaker: false,
  journeyContext: 'gamification',
  includeTracing: true,
  processingStage: EventProcessingStage.PROCESSING,
};

/**
 * Decorator for handling errors in event processors
 * Wraps the event handler method with standardized error handling
 * 
 * @param options Error handling options
 */
export function HandleEventErrors(options: ErrorHandlingOptions = {}) {
  const mergedOptions = { ...defaultErrorHandlingOptions, ...options };
  
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const event = args[0] as IBaseEvent;
      const circuitBreaker = mergedOptions.useCircuitBreaker ? 
        new CircuitBreaker(mergedOptions.circuitBreakerOptions) : null;
      
      // Create trace context for this event processing if tracing is enabled
      let traceContext: TraceContext | undefined;
      if (mergedOptions.includeTracing) {
        // This would create a new trace or continue an existing one
        // traceContext = createTraceContext(event);
      }
      
      try {
        // Check if circuit is open before proceeding
        if (circuitBreaker && circuitBreaker.isOpen()) {
          throw new EventProcessingError(
            'Circuit breaker is open, rejecting request',
            'CIRCUIT_OPEN',
            { eventId: event.eventId, eventType: event.type },
            false, // Not retryable when circuit is open
            mergedOptions.processingStage
          );
        }
        
        // Call the original method
        const result = await originalMethod.apply(this, args);
        
        // If circuit breaker is used, record success
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }
        
        return result;
      } catch (error) {
        // Record failure in circuit breaker if used
        if (circuitBreaker) {
          circuitBreaker.recordFailure();
        }
        
        // Log the error with structured context
        logEventError(
          error, 
          event, 
          mergedOptions.journeyContext,
          mergedOptions.includeTracing,
          mergedOptions.processingStage
        );
        
        // Apply retry policy if enabled
        if (mergedOptions.applyRetryPolicy) {
          const shouldRetry = await applyRetryPolicy(error, event, mergedOptions.maxRetries);
          if (shouldRetry) {
            logger.log(`Retrying event ${event.eventId} based on retry policy`);
            return;
          }
        }
        
        // Send to DLQ if enabled and not retrying
        if (mergedOptions.sendToDlq) {
          await sendToDlq(event, error, mergedOptions.journeyContext);
        }
        
        // Call custom error handler if provided
        if (mergedOptions.customErrorHandler) {
          await mergedOptions.customErrorHandler(error, event);
        }
        
        // Rethrow or return error response based on handler type
        if (isEventHandler(this)) {
          return createErrorResponse(error, event);
        } else {
          throw error;
        }
      } finally {
        // Clean up trace context if it was created
        if (traceContext) {
          // This would end the trace context
          // endTraceContext(traceContext);
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator for handling validation errors in event processors
 * Specifically focuses on validation errors before processing
 * 
 * @param options Error handling options
 */
export function HandleValidationErrors(options: ErrorHandlingOptions = {}) {
  // Override default options to set validation-specific settings
  const validationOptions: ErrorHandlingOptions = {
    ...defaultErrorHandlingOptions,
    processingStage: EventProcessingStage.VALIDATION,
    // Validation errors typically don't retry
    applyRetryPolicy: false,
    ...options
  };
  
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const event = args[0] as IBaseEvent;
      
      // Create trace context for validation if tracing is enabled
      let traceContext: TraceContext | undefined;
      if (validationOptions.includeTracing) {
        // This would create a new trace or continue an existing one
        // traceContext = createTraceContext(event, 'validation');
      }
      
      try {
        // Call the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Only handle validation errors, let other errors propagate
        if (error instanceof EventValidationError) {
          // Log validation error with structured context
          logEventError(
            error,
            event,
            validationOptions.journeyContext,
            validationOptions.includeTracing,
            EventProcessingStage.VALIDATION
          );
          
          // Send to DLQ if enabled (validation errors typically don't retry)
          if (validationOptions.sendToDlq) {
            await sendToDlq(event, error, validationOptions.journeyContext);
          }
          
          // Call custom error handler if provided
          if (validationOptions.customErrorHandler) {
            await validationOptions.customErrorHandler(error, event);
          }
          
          // Return error response for validation errors
          return createErrorResponse(error, event);
        }
        
        // Rethrow non-validation errors
        throw error;
      } finally {
        // Clean up trace context if it was created
        if (traceContext) {
          // This would end the trace context
          // endTraceContext(traceContext);
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Utility function to log event processing errors with structured context
 * 
 * @param error The error that occurred
 * @param event The event being processed
 * @param journeyContext Optional journey context for categorization
 * @param includeTracing Whether to include tracing information
 * @param processingStage The stage where the error occurred
 */
export function logEventError(
  error: Error, 
  event: IBaseEvent, 
  journeyContext?: string,
  includeTracing: boolean = true,
  processingStage: EventProcessingStage = EventProcessingStage.PROCESSING
): void {
  // Build base error context with event information
  const errorContext: Record<string, any> = {
    eventId: event.eventId,
    eventType: event.type,
    source: event.source,
    journey: journeyContext || 'unknown',
    timestamp: new Date().toISOString(),
    processingStage: processingStage,
  };
  
  // Add tracing information if enabled
  if (includeTracing) {
    const traceId = getCurrentTraceId();
    if (traceId) {
      errorContext.traceId = traceId;
    }
  }
  
  // Add version information if available
  if (event.version) {
    errorContext.eventVersion = event.version;
  }
  
  // Log based on error type with appropriate level and context
  if (error instanceof EventProcessingError) {
    logger.error(
      `Event processing error: ${error.message}`,
      {
        ...errorContext,
        errorCode: error.code,
        details: error.details,
        retryable: error.isRetryable,
        processingStage: error.processingStage || processingStage,
      },
      error.stack
    );
  } else if (error instanceof EventValidationError) {
    logger.warn(
      `Event validation error: ${error.message}`,
      {
        ...errorContext,
        errorCode: error.code,
        details: error.details,
        validationErrors: error.validationErrors,
        processingStage: EventProcessingStage.VALIDATION,
      }
    );
  } else {
    logger.error(
      `Unexpected error in event processing: ${error.message}`,
      errorContext,
      error.stack
    );
  }
  
  // Additional metric tracking for monitoring systems
  try {
    // This would integrate with a metrics system like Prometheus
    // incrementErrorCounter(event.type, journeyContext, error.name);
  } catch (metricError) {
    // Don't let metrics tracking failure affect the main flow
    logger.debug(`Failed to record error metric: ${metricError.message}`);
  }
}

/**
 * Creates a standardized error response for event handlers
 * 
 * @param error The error that occurred
 * @param event The event being processed
 * @returns A standardized error response
 */
export function createErrorResponse(error: Error, event: IBaseEvent): IEventResponse {
  const baseResponse = {
    success: false,
    eventId: event.eventId,
    timestamp: new Date().toISOString(),
    source: event.source,
    type: event.type,
  };
  
  // Include trace ID if available
  const traceId = getCurrentTraceId();
  if (traceId) {
    Object.assign(baseResponse, { traceId });
  }
  
  if (error instanceof EventProcessingError || error instanceof EventValidationError) {
    return {
      ...baseResponse,
      error: {
        message: error.message,
        code: error.code,
        type: error instanceof EventValidationError ? 'VALIDATION_ERROR' : 'PROCESSING_ERROR',
        details: error.details,
        retryable: error instanceof EventProcessingError ? error.isRetryable : false,
        processingStage: error instanceof EventProcessingError ? 
          error.processingStage : EventProcessingStage.VALIDATION,
      },
    };
  }
  
  // For unknown errors, provide a generic response
  return {
    ...baseResponse,
    error: {
      message: 'An unexpected error occurred during event processing',
      code: 'UNKNOWN_ERROR',
      type: 'SYSTEM_ERROR',
      retryable: false,
      processingStage: EventProcessingStage.PROCESSING,
      details: process.env.NODE_ENV !== 'production' ? { originalMessage: error.message } : undefined,
    },
  };
}

/**
 * Utility to check if an object is an event handler
 * 
 * @param obj Object to check
 * @returns True if the object is an event handler
 */
function isEventHandler(obj: any): obj is IEventHandler {
  return obj && typeof obj.handle === 'function' && typeof obj.getEventType === 'function';
}

/**
 * Utility function to create a fallback handler for event processing
 * Used when the primary handler fails and a fallback behavior is needed
 * 
 * @param fallbackFn The fallback function to execute
 * @param options Error handling options for the fallback
 * @returns A function that executes the fallback
 */
export function createFallbackHandler<T extends IBaseEvent>(
  fallbackFn: (event: T, error: Error) => Promise<IEventResponse>,
  options: ErrorHandlingOptions = {}
) {
  const mergedOptions = { ...defaultErrorHandlingOptions, ...options };
  
  return async (event: T, error: Error): Promise<IEventResponse> => {
    // Create trace context for fallback if tracing is enabled
    let traceContext: TraceContext | undefined;
    if (mergedOptions.includeTracing) {
      // This would create a new trace or continue an existing one
      // traceContext = createTraceContext(event, 'fallback');
    }
    
    try {
      logger.log(
        `Executing fallback handler for event ${event.eventId}`,
        {
          eventType: event.type,
          source: event.source,
          journey: mergedOptions.journeyContext,
          originalError: error.message,
          traceId: mergedOptions.includeTracing ? getCurrentTraceId() : undefined
        }
      );
      
      return await fallbackFn(event, error);
    } catch (fallbackError) {
      // Log the fallback failure with context about both errors
      logger.error(
        `Fallback handler failed for event ${event.eventId}: ${fallbackError.message}`,
        { 
          eventType: event.type,
          source: event.source,
          journey: mergedOptions.journeyContext,
          originalError: error.message,
          fallbackError: fallbackError.message,
          traceId: mergedOptions.includeTracing ? getCurrentTraceId() : undefined
        },
        fallbackError.stack
      );
      
      // Send to DLQ if enabled since both primary and fallback failed
      if (mergedOptions.sendToDlq) {
        // Create a combined error with context from both failures
        const combinedError = new EventProcessingError(
          'Both primary and fallback handlers failed',
          'FALLBACK_FAILED',
          { 
            originalError: error.message,
            fallbackError: fallbackError.message 
          },
          false, // Not retryable when fallback also fails
          mergedOptions.processingStage
        );
        
        await sendToDlq(event, combinedError, mergedOptions.journeyContext);
      }
      
      // Return a generic error response when even the fallback fails
      return {
        success: false,
        eventId: event.eventId,
        timestamp: new Date().toISOString(),
        source: event.source,
        type: event.type,
        traceId: mergedOptions.includeTracing ? getCurrentTraceId() : undefined,
        error: {
          message: 'Both primary and fallback handlers failed',
          code: 'FALLBACK_FAILED',
          type: 'SYSTEM_ERROR',
          retryable: false,
          details: process.env.NODE_ENV !== 'production' ? {
            originalError: error.message,
            fallbackError: fallbackError.message
          } : undefined
        },
      };
    } finally {
      // Clean up trace context if it was created
      if (traceContext) {
        // This would end the trace context
        // endTraceContext(traceContext);
      }
    }
  };
}

/**
 * Class decorator for adding error handling to all methods of an event handler class
 * 
 * @param options Error handling options
 */
export function EventErrorHandler(options: ErrorHandlingOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Get all method names from the prototype
    const methodNames = Object.getOwnPropertyNames(constructor.prototype)
      .filter(name => 
        name !== 'constructor' && 
        typeof constructor.prototype[name] === 'function'
      );
    
    // Apply error handling to each method
    methodNames.forEach(methodName => {
      const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, methodName);
      if (descriptor && typeof descriptor.value === 'function') {
        // Apply different decorators based on method name
        let decoratedDescriptor;
        
        // Apply validation-specific error handling to validate* methods
        if (methodName.startsWith('validate') || methodName === 'canHandle') {
          decoratedDescriptor = HandleValidationErrors({
            ...options,
            processingStage: EventProcessingStage.VALIDATION
          })(constructor.prototype, methodName, descriptor);
        } 
        // Apply standard error handling to handle* and process* methods
        else if (methodName === 'handle' || methodName === 'process' || methodName.startsWith('handle') || methodName.startsWith('process')) {
          decoratedDescriptor = HandleEventErrors({
            ...options,
            processingStage: EventProcessingStage.PROCESSING
          })(constructor.prototype, methodName, descriptor);
        }
        // Apply persistence error handling to save* and persist* methods
        else if (methodName.startsWith('save') || methodName.startsWith('persist') || methodName.startsWith('store')) {
          decoratedDescriptor = HandleEventErrors({
            ...options,
            processingStage: EventProcessingStage.PERSISTENCE
          })(constructor.prototype, methodName, descriptor);
        }
        // Apply standard error handling to other methods
        else {
          decoratedDescriptor = HandleEventErrors(options)(constructor.prototype, methodName, descriptor);
        }
        
        Object.defineProperty(constructor.prototype, methodName, decoratedDescriptor);
      }
    });
    
    // Add logging for class initialization
    const originalConstructor = constructor;
    function newConstructor(...args: any[]) {
      const instance = new originalConstructor(...args);
      logger.debug(`Initialized event handler with error handling: ${constructor.name}`);
      return instance;
    }
    
    // Copy prototype so instanceof works correctly
    newConstructor.prototype = originalConstructor.prototype;
    
    return newConstructor as unknown as T;
  };
}

/**
 * Utility class for wrapping event handlers with error handling
 * Can be used when decorators are not suitable
 */
@Injectable()
export class EventErrorHandlingService {
  constructor(private readonly logger: Logger = new Logger('EventErrorHandlingService')) {}
  
  /**
   * Wraps an event handler function with error handling
   * 
   * @param handlerFn The event handler function to wrap
   * @param options Error handling options
   * @returns A wrapped function with error handling
   */
  wrapWithErrorHandling<T extends IBaseEvent, R>(
    handlerFn: (event: T) => Promise<R>,
    options: ErrorHandlingOptions = {}
  ): (event: T) => Promise<R | IEventResponse> {
    const mergedOptions = { ...defaultErrorHandlingOptions, ...options };
    const circuitBreaker = mergedOptions.useCircuitBreaker ? 
      new CircuitBreaker(mergedOptions.circuitBreakerOptions) : null;
    
    return async (event: T): Promise<R | IEventResponse> => {
      // Create trace context for this event processing if tracing is enabled
      let traceContext: TraceContext | undefined;
      if (mergedOptions.includeTracing) {
        // This would create a new trace or continue an existing one
        // traceContext = createTraceContext(event);
      }
      
      try {
        // Check if circuit is open before proceeding
        if (circuitBreaker && circuitBreaker.isOpen()) {
          throw new EventProcessingError(
            'Circuit breaker is open, rejecting request',
            'CIRCUIT_OPEN',
            { eventId: event.eventId, eventType: event.type },
            false, // Not retryable when circuit is open
            mergedOptions.processingStage
          );
        }
        
        // Call the handler function
        const result = await handlerFn(event);
        
        // Record success in circuit breaker if used
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }
        
        return result;
      } catch (error) {
        // Record failure in circuit breaker if used
        if (circuitBreaker) {
          circuitBreaker.recordFailure();
        }
        
        // Log the error
        logEventError(
          error, 
          event, 
          mergedOptions.journeyContext,
          mergedOptions.includeTracing,
          mergedOptions.processingStage
        );
        
        // Apply retry policy if enabled
        if (mergedOptions.applyRetryPolicy) {
          const shouldRetry = await applyRetryPolicy(error, event, mergedOptions.maxRetries);
          if (shouldRetry) {
            this.logger.log(`Retrying event ${event.eventId} based on retry policy`);
            throw error; // Rethrow to trigger retry
          }
        }
        
        // Send to DLQ if enabled and not retrying
        if (mergedOptions.sendToDlq) {
          await sendToDlq(event, error, mergedOptions.journeyContext);
        }
        
        // Call custom error handler if provided
        if (mergedOptions.customErrorHandler) {
          await mergedOptions.customErrorHandler(error, event);
        }
        
        // Return error response
        return createErrorResponse(error, event);
      } finally {
        // Clean up trace context if it was created
        if (traceContext) {
          // This would end the trace context
          // endTraceContext(traceContext);
        }
      }
    };
  }
  
  /**
   * Executes an event handler with a fallback if it fails
   * 
   * @param primaryHandler The primary handler function
   * @param fallbackHandler The fallback handler function
   * @param event The event to process
   * @param options Error handling options for logging and tracing
   * @returns The result of either the primary or fallback handler
   */
  async executeWithFallback<T extends IBaseEvent, R>(
    primaryHandler: (event: T) => Promise<R>,
    fallbackHandler: (event: T, error: Error) => Promise<R>,
    event: T,
    options: ErrorHandlingOptions = {}
  ): Promise<R> {
    const mergedOptions = { ...defaultErrorHandlingOptions, ...options };
    
    try {
      return await primaryHandler(event);
    } catch (error) {
      // Log the primary handler failure
      this.logger.warn(
        `Primary handler failed for event ${event.eventId}, executing fallback`,
        { 
          eventType: event.type, 
          errorMessage: error.message,
          journey: mergedOptions.journeyContext,
          processingStage: mergedOptions.processingStage,
          traceId: mergedOptions.includeTracing ? getCurrentTraceId() : undefined
        }
      );
      
      // Execute fallback with error context
      return await fallbackHandler(event, error);
    }
  }
  
  /**
   * Creates a circuit breaker for an event handler
   * 
   * @param options Circuit breaker configuration options
   * @returns A configured circuit breaker instance
   */
  createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
    return new CircuitBreaker(options);
  }
  
  /**
   * Checks if an error is retryable based on its type and context
   * 
   * @param error The error to check
   * @param event The event being processed
   * @returns True if the error is retryable
   */
  isRetryableError(error: Error, event: IBaseEvent): boolean {
    if (error instanceof EventProcessingError) {
      return error.isRetryable;
    }
    
    // Default retry logic for common error types
    if (error.name === 'TimeoutError' || 
        error.name === 'ConnectionError' || 
        error.message.includes('timeout') || 
        error.message.includes('connection')) {
      return true;
    }
    
    // Non-retryable by default for other error types
    return false;
  }
}