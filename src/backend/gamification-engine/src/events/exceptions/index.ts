/**
 * @file Event Exceptions Barrel File
 * @description Exports all event exception classes and interfaces for the gamification engine.
 * This file provides a clean import interface for other modules, simplifying dependency management
 * by allowing consumers to import all exceptions from a single location rather than individual files.
 */

// Import all exception classes using TypeScript path aliases for consistent code organization
import { BaseEventException } from './base-event.exception';
import { 
  EventDeadLetterQueueException, 
  RetryAttempt, 
  ManualInterventionMetadata, 
  MonitoringMetadata 
} from './event-dead-letter-queue.exception';
import { EventKafkaException } from './event-kafka.exception';
import { EventProcessingException } from './event-processing.exception';
import { EventRetryableException, RetryOptions } from './event-retryable.exception';
import { EventValidationException, ValidationErrorDetail, EventValidationExceptionMetadata } from './event-validation.exception';

// Re-export all exception classes as named exports
export {
  BaseEventException,
  EventDeadLetterQueueException,
  EventKafkaException,
  EventProcessingException,
  EventRetryableException,
  EventValidationException,
  // Export interfaces from event-dead-letter-queue.exception.ts
  RetryAttempt,
  ManualInterventionMetadata,
  MonitoringMetadata,
  // Export interfaces from event-retryable.exception.ts
  RetryOptions,
  // Export interfaces from event-validation.exception.ts
  ValidationErrorDetail,
  EventValidationExceptionMetadata
};

// Export interfaces for exception types to enable type-safe usage
export type EventException = 
  | BaseEventException
  | EventDeadLetterQueueException
  | EventKafkaException
  | EventProcessingException
  | EventRetryableException
  | EventValidationException;

// Export categorized exception types for more specific error handling
export type RetryableEventException = EventRetryableException | EventKafkaException;
export type NonRetryableEventException = EventDeadLetterQueueException | EventValidationException;
export type SystemEventException = EventProcessingException;

// Export a utility function to check if an exception is retryable
export const isRetryableException = (error: unknown): error is RetryableEventException => {
  return (
    error instanceof EventRetryableException ||
    error instanceof EventKafkaException
  );
};

// Export a utility function to check if an exception should be sent to DLQ
export const isDLQException = (error: unknown): error is EventDeadLetterQueueException => {
  return error instanceof EventDeadLetterQueueException;
};

// Export a default object with all exceptions for convenience
const EventExceptions = {
  BaseEventException,
  EventDeadLetterQueueException,
  EventKafkaException,
  EventProcessingException,
  EventRetryableException,
  EventValidationException,
  isRetryableException,
  isDLQException,
};

export default EventExceptions;