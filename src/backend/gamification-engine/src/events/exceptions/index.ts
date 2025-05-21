/**
 * @file Barrel export file for all event exception classes
 * @description This file exports all event-related exception classes from the events module,
 * providing a clean and organized interface for importing exceptions throughout the application.
 * It simplifies dependency management by allowing consumers to import all exceptions from a
 * single location rather than individual files.
 */

// Import all exception classes using TypeScript path aliases for consistent code organization
import { BaseEventException } from './base-event.exception';
import { EventDeadLetterQueueException } from './event-dead-letter-queue.exception';
import { EventKafkaException } from './event-kafka.exception';
import { EventProcessingException } from './event-processing.exception';
import { EventRetryableException } from './event-retryable.exception';
import { EventValidationException } from './event-validation.exception';

// Re-export common error interfaces from @austa/interfaces
import { IErrorResponse, IErrorContext } from '@austa/interfaces/common';

// Named exports for all exception classes
export {
  BaseEventException,
  EventDeadLetterQueueException,
  EventKafkaException,
  EventProcessingException,
  EventRetryableException,
  EventValidationException,
  
  // Re-export error interfaces for convenience
  IErrorResponse,
  IErrorContext
};

/**
 * Type representing all event exception classes
 * This type can be used for functions that need to handle any type of event exception
 */
export type EventException =
  | BaseEventException
  | EventDeadLetterQueueException
  | EventKafkaException
  | EventProcessingException
  | EventRetryableException
  | EventValidationException;

/**
 * Default export for convenience when importing all exceptions
 * Example usage: import EventExceptions from '@app/events/exceptions';
 */
export default {
  BaseEventException,
  EventDeadLetterQueueException,
  EventKafkaException,
  EventProcessingException,
  EventRetryableException,
  EventValidationException
};