/**
 * @file event-response.interface.ts
 * @description Defines standardized interfaces for event processing responses
 * across all services in the AUSTA SuperApp. These interfaces ensure consistent
 * error handling, retry mechanisms, and observability for event processing.
 *
 * Example usage:
 * 
 * ```typescript
 * // Create a successful response
 * const response: EventResponse<UserData> = {
 *   success: true,
 *   data: { userId: '123', name: 'John Doe' },
 *   metadata: {
 *     correlationId: '550e8400-e29b-41d4-a716-446655440000',
 *     timestamp: new Date(),
 *     processingTimeMs: 42,
 *     source: 'health-service',
 *     destination: 'gamification-engine'
 *   }
 * };
 *
 * // Create a failed response
 * const errorResponse: EventResponse = {
 *   success: false,
 *   error: {
 *     code: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
 *     message: 'Message failed schema validation',
 *     retryable: false,
 *     context: { validationErrors: ['Field userId is required'] }
 *   },
 *   metadata: {
 *     correlationId: '550e8400-e29b-41d4-a716-446655440000',
 *     timestamp: new Date(),
 *     source: 'health-service',
 *     destination: 'gamification-engine'
 *   }
 * };
 * ```
 *
 * @module events/interfaces
 */

/**
 * Metadata for event processing responses.
 * 
 * This metadata provides context for monitoring, tracing, and debugging
 * event processing across services.
 */
export interface EventResponseMetadata {
  /**
   * Correlation ID for distributed tracing.
   * Used to track related events across multiple services.
   */
  correlationId: string;

  /**
   * Timestamp when the response was created.
   */
  timestamp: Date;

  /**
   * Time taken to process the event in milliseconds.
   * Used for performance monitoring and optimization.
   */
  processingTimeMs?: number;

  /**
   * Number of retry attempts for this event.
   * Used to track retry history and enforce retry limits.
   */
  retryCount?: number;

  /**
   * Source service or component that processed the event.
   */
  source?: string;

  /**
   * Target service or component for the response.
   */
  destination?: string;

  /**
   * Additional context for the response.
   * Can contain any JSON-serializable data.
   */
  context?: Record<string, any>;
}

/**
 * Error details for failed event processing.
 * 
 * This interface provides standardized error information for failed events,
 * including whether the error is retryable and additional context.
 */
export interface EventErrorDetails {
  /**
   * Error code from the ERROR_CODES constants.
   * Used for error categorization and handling.
   */
  code: string;

  /**
   * Human-readable error message.
   * Should provide clear information about what went wrong.
   */
  message: string;

  /**
   * Stack trace for debugging.
   * Only included in development and testing environments.
   */
  stack?: string;

  /**
   * Whether this error can be retried.
   * Used by the retry mechanism to determine if retry should be attempted.
   */
  retryable: boolean;

  /**
   * Additional context for the error.
   * Can include validation errors, received data, or other relevant information.
   */
  context?: Record<string, any>;
}

/**
 * Standardized response interface for event processing.
 * 
 * This interface ensures consistent response structure across all event handlers,
 * supporting reliable error tracking, retry mechanisms, and observability.
 * 
 * @template T Type of the response data for successful processing
 */
export interface EventResponse<T = any> {
  /**
   * Whether the event processing succeeded.
   */
  success: boolean;

  /**
   * Result data for successful processing.
   * Only present when success is true.
   */
  data?: T;

  /**
   * Error details for failed processing.
   * Only present when success is false.
   */
  error?: EventErrorDetails;

  /**
   * Metadata for monitoring, tracing, and debugging.
   */
  metadata: EventResponseMetadata;
}

/**
 * Creates a successful event response.
 * 
 * @template T Type of the response data
 * @param data Result data
 * @param metadata Response metadata
 * @returns A successful EventResponse
 */
export function createSuccessResponse<T>(
  data: T,
  metadata: EventResponseMetadata
): EventResponse<T> {
  return {
    success: true,
    data,
    metadata
  };
}

/**
 * Creates a failed event response.
 * 
 * @param error Error details
 * @param metadata Response metadata
 * @returns A failed EventResponse
 */
export function createErrorResponse(
  error: EventErrorDetails,
  metadata: EventResponseMetadata
): EventResponse {
  return {
    success: false,
    error,
    metadata
  };
}

/**
 * Creates response metadata from an event metadata DTO.
 * 
 * @param eventMetadata Event metadata DTO
 * @param additionalMetadata Additional metadata properties
 * @returns Response metadata
 */
export function createResponseMetadata(
  eventMetadata: any, // Using any to avoid circular dependency with EventMetadataDto
  additionalMetadata: Partial<EventResponseMetadata> = {}
): EventResponseMetadata {
  return {
    correlationId: eventMetadata.correlationId || '',
    timestamp: eventMetadata.timestamp || new Date(),
    source: eventMetadata.origin?.service,
    ...additionalMetadata
  };
}