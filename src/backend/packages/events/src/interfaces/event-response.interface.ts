/**
 * @file event-response.interface.ts
 * @description Defines the standardized response structure for event processing operations.
 * This interface ensures consistent response formatting for event handlers and processors,
 * including success/failure status, error details, and any resulting data.
 */

import { ErrorCodeDetails } from '../../errors/event-errors';

/**
 * Metadata for event processing responses, used for tracing and monitoring.
 */
export interface EventResponseMetadata {
  /**
   * Duration of the event processing operation in milliseconds
   */
  processingTimeMs?: number;

  /**
   * Correlation ID for distributed tracing
   */
  correlationId?: string;

  /**
   * ID of the service that processed the event
   */
  serviceId?: string;

  /**
   * Timestamp when the processing was completed
   */
  completedAt?: string;

  /**
   * Number of retry attempts if applicable
   */
  retryCount?: number;

  /**
   * Additional context-specific metadata
   */
  [key: string]: any;
}

/**
 * Error details for failed event processing
 */
export interface EventErrorDetails {
  /**
   * Error code for categorizing the error
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Optional detailed error information
   */
  details?: ErrorCodeDetails;

  /**
   * Stack trace (only included in development environments)
   */
  stack?: string;

  /**
   * Whether this error is retryable
   */
  retryable?: boolean;

  /**
   * Suggested delay before retry in milliseconds (if retryable)
   */
  retryDelayMs?: number;
}

/**
 * Standardized response interface for event processing operations.
 * 
 * This interface ensures consistent response formatting across all event handlers
 * and processors, enabling reliable tracking of event processing outcomes and
 * supporting better error handling, retry mechanisms, and observability.
 * 
 * @template T Type of data returned by the event processing operation
 */
export interface IEventResponse<T = any> {
  /**
   * Indicates whether the event processing was successful
   */
  success: boolean;

  /**
   * The event ID that was processed
   */
  eventId: string;

  /**
   * The type of event that was processed
   */
  eventType: string;

  /**
   * Error details if the processing failed (success = false)
   */
  error?: EventErrorDetails;

  /**
   * Result data from the event processing operation
   */
  data?: T;

  /**
   * Metadata for tracing and monitoring
   */
  metadata?: EventResponseMetadata;
}

/**
 * Creates a successful event response
 * 
 * @param eventId The ID of the processed event
 * @param eventType The type of the processed event
 * @param data Optional result data from the event processing
 * @param metadata Optional metadata for tracing and monitoring
 * @returns A successful event response object
 */
export function createSuccessResponse<T>(
  eventId: string,
  eventType: string,
  data?: T,
  metadata?: EventResponseMetadata
): IEventResponse<T> {
  return {
    success: true,
    eventId,
    eventType,
    data,
    metadata: {
      ...metadata,
      completedAt: metadata?.completedAt || new Date().toISOString(),
    },
  };
}

/**
 * Creates a failed event response
 * 
 * @param eventId The ID of the processed event
 * @param eventType The type of the processed event
 * @param error Error details for the failure
 * @param metadata Optional metadata for tracing and monitoring
 * @returns A failed event response object
 */
export function createErrorResponse<T>(
  eventId: string,
  eventType: string,
  error: EventErrorDetails,
  metadata?: EventResponseMetadata
): IEventResponse<T> {
  return {
    success: false,
    eventId,
    eventType,
    error,
    metadata: {
      ...metadata,
      completedAt: metadata?.completedAt || new Date().toISOString(),
    },
  };
}