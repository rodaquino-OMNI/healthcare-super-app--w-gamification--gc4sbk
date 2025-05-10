/**
 * Interface defining the standardized response structure for event processing operations.
 * This ensures consistent response formatting across all event handlers and processors,
 * enabling reliable tracking of event processing outcomes and supporting better error handling,
 * retry mechanisms, and observability throughout the platform.
 */
export interface IEventResponse<T = any> {
  /**
   * Indicates whether the event processing was successful.
   * Quick flag for status checking without parsing error details.
   */
  success: boolean;

  /**
   * Optional data returned from the event processing operation.
   * Only present when the operation was successful (success = true).
   */
  data?: T;

  /**
   * Error details for failed event processing.
   * Only present when the operation failed (success = false).
   */
  error?: {
    /**
     * Error code identifying the type of error that occurred.
     * Should follow a standardized format across the application.
     */
    code: string;

    /**
     * Human-readable error message describing what went wrong.
     */
    message: string;

    /**
     * Optional additional details about the error.
     * Can include validation errors, stack traces, or other diagnostic information.
     */
    details?: Record<string, any>;
  };

  /**
   * Metadata for tracing and monitoring the event processing.
   * Useful for debugging, performance analysis, and observability.
   */
  metadata?: {
    /**
     * Unique identifier for tracing the request through the system.
     */
    traceId?: string;

    /**
     * Time taken to process the event in milliseconds.
     */
    processingTimeMs?: number;

    /**
     * Number of retry attempts made for this event, if applicable.
     */
    retryCount?: number;

    /**
     * Timestamp when the event processing started.
     */
    startedAt?: string;

    /**
     * Timestamp when the event processing completed.
     */
    completedAt?: string;

    /**
     * Service or component that processed the event.
     */
    processor?: string;

    /**
     * Additional custom metadata fields relevant to the specific event type or processor.
     */
    [key: string]: any;
  };
}

/**
 * Creates a successful event response with the provided data.
 * 
 * @param data - The data to include in the response
 * @param metadata - Optional metadata for the response
 * @returns A successful event response object
 */
export function createSuccessResponse<T>(
  data?: T,
  metadata?: IEventResponse['metadata']
): IEventResponse<T> {
  return {
    success: true,
    data,
    metadata,
  };
}

/**
 * Creates a failed event response with the provided error details.
 * 
 * @param code - Error code identifying the type of error
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @param metadata - Optional metadata for the response
 * @returns A failed event response object
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, any>,
  metadata?: IEventResponse['metadata']
): IEventResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    metadata,
  };
}