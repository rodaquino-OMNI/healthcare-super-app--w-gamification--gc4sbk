/**
 * @file Error handling module for event processing
 * @module @austa/events/errors
 * 
 * This module provides a comprehensive set of error handling utilities, error types,
 * retry policies, and dead letter queue (DLQ) integration for the event processing system.
 * It ensures consistent error handling patterns across all event processors and services.
 */

// Export error types
export * from './event-errors';

// Export error handling utilities
export * from './handling';

// Export DLQ utilities
export * from './dlq';

// Export retry policies
export * from './retry-policies';

// Export error-related interfaces
import { ValidationResult } from '../interfaces/event-validation.interface';
import { EventResponse } from '../interfaces/event-response.interface';

export { ValidationResult, EventResponse };

// Export error constants
import * as ErrorConstants from '../constants/errors.constants';

export { ErrorConstants };

/**
 * Common error categories for event processing
 * @enum {string}
 */
export enum EventErrorCategory {
  /** Validation errors (schema, format, etc.) */
  VALIDATION = 'validation',
  /** Processing errors during event handling */
  PROCESSING = 'processing',
  /** Delivery errors when sending events */
  DELIVERY = 'delivery',
  /** Schema errors related to event structure */
  SCHEMA = 'schema',
  /** System errors (unexpected failures) */
  SYSTEM = 'system',
}

/**
 * Error severity levels for event processing errors
 * @enum {string}
 */
export enum EventErrorSeverity {
  /** Informational errors that don't affect processing */
  INFO = 'info',
  /** Warning errors that might affect processing but can be handled */
  WARNING = 'warning',
  /** Error conditions that prevent successful processing */
  ERROR = 'error',
  /** Critical errors that require immediate attention */
  CRITICAL = 'critical',
}

/**
 * Retry strategy types for event processing errors
 * @enum {string}
 */
export enum RetryStrategy {
  /** No retry attempts will be made */
  NONE = 'none',
  /** Fixed interval between retry attempts */
  CONSTANT = 'constant',
  /** Exponentially increasing delay between retry attempts */
  EXPONENTIAL = 'exponential',
  /** Custom retry strategy defined by the service */
  CUSTOM = 'custom',
}

/**
 * Interface for error context in event processing
 * @interface
 */
export interface EventErrorContext {
  /** Unique identifier for the event */
  eventId: string;
  /** Type of the event */
  eventType: string;
  /** Source service or journey that produced the event */
  source: string;
  /** Processing stage where the error occurred */
  stage: 'validation' | 'processing' | 'delivery' | 'consumption';
  /** Number of retry attempts made so far */
  retryCount?: number;
  /** Additional context specific to the error */
  [key: string]: any;
}

/**
 * Determines if an error is retryable based on its type and context
 * @param error - The error to check
 * @param context - Additional context about the error
 * @returns True if the error should be retried, false otherwise
 */
export function isRetryableError(error: Error, context?: Partial<EventErrorContext>): boolean {
  // This is just a placeholder - the actual implementation would be in the handling.ts file
  return false;
}

/**
 * Creates a standardized error response for event processing failures
 * @param error - The error that occurred
 * @param context - Additional context about the error
 * @returns A standardized error response object
 */
export function createErrorResponse(error: Error, context?: Partial<EventErrorContext>): EventResponse {
  // This is just a placeholder - the actual implementation would be in the handling.ts file
  return {
    success: false,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...context,
    },
  };
}