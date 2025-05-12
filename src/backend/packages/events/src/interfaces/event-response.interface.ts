/**
 * @file Event Response Interface
 * @description Defines the standardized response structure for event processing operations.
 * This interface ensures consistent response formatting for event handlers and processors,
 * including success/failure status, error details, and any resulting data.
 */

/**
 * Status enum for event processing responses
 * @enum {string}
 */
export enum EventResponseStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  RETRY = 'retry',
  REJECTED = 'rejected',
  IGNORED = 'ignored',
}

/**
 * Interface for error details in event responses
 * @interface EventResponseError
 */
export interface EventResponseError {
  /**
   * Error code for categorizing the error
   * @type {string}
   */
  code: string;

  /**
   * Human-readable error message
   * @type {string}
   */
  message: string;

  /**
   * Optional details about the error
   * @type {Record<string, any>}
   */
  details?: Record<string, any>;

  /**
   * Optional stack trace for debugging
   * @type {string}
   */
  stack?: string;

  /**
   * Flag indicating if this error is retryable
   * @type {boolean}
   */
  retryable?: boolean;
}

/**
 * Interface for metadata in event responses
 * @interface EventResponseMetadata
 */
export interface EventResponseMetadata {
  /**
   * Timestamp when the event processing completed
   * @type {string}
   */
  timestamp: string;

  /**
   * Duration of event processing in milliseconds
   * @type {number}
   */
  processingTimeMs?: number;

  /**
   * Correlation ID for tracing requests across services
   * @type {string}
   */
  correlationId?: string;

  /**
   * Journey context for the event (health, care, plan)
   * @type {string}
   */
  journeyContext?: string;

  /**
   * Service that processed the event
   * @type {string}
   */
  processorService?: string;

  /**
   * Number of retry attempts if applicable
   * @type {number}
   */
  retryCount?: number;

  /**
   * Additional metadata properties
   * @type {Record<string, any>}
   */
  [key: string]: any;
}

/**
 * Main interface for event processing responses
 * @interface IEventResponse
 * @template T - Type of the response data
 */
export interface IEventResponse<T = any> {
  /**
   * Indicates if the event processing was successful
   * @type {boolean}
   */
  success: boolean;

  /**
   * Status of the event processing
   * @type {EventResponseStatus}
   */
  status: EventResponseStatus;

  /**
   * Optional data returned from the event processing
   * @type {T}
   */
  data?: T;

  /**
   * Error information if the processing failed
   * @type {EventResponseError}
   */
  error?: EventResponseError;

  /**
   * Metadata for monitoring and tracing
   * @type {EventResponseMetadata}
   */
  metadata: EventResponseMetadata;

  /**
   * ID of the event that was processed
   * @type {string}
   */
  eventId: string;

  /**
   * Type of the event that was processed
   * @type {string}
   */
  eventType: string;
}

/**
 * Creates a successful event response
 * @function createSuccessResponse
 * @template T - Type of the response data
 * @param {Object} params - Parameters for creating a success response
 * @param {string} params.eventId - ID of the processed event
 * @param {string} params.eventType - Type of the processed event
 * @param {T} [params.data] - Optional data returned from processing
 * @param {Partial<EventResponseMetadata>} [params.metadata] - Optional additional metadata
 * @returns {IEventResponse<T>} A successful event response
 */
export function createSuccessResponse<T = any>({
  eventId,
  eventType,
  data,
  metadata = {},
}: {
  eventId: string;
  eventType: string;
  data?: T;
  metadata?: Partial<EventResponseMetadata>;
}): IEventResponse<T> {
  return {
    success: true,
    status: EventResponseStatus.SUCCESS,
    eventId,
    eventType,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates a failure event response
 * @function createFailureResponse
 * @template T - Type of the response data
 * @param {Object} params - Parameters for creating a failure response
 * @param {string} params.eventId - ID of the processed event
 * @param {string} params.eventType - Type of the processed event
 * @param {EventResponseError} params.error - Error information
 * @param {Partial<EventResponseMetadata>} [params.metadata] - Optional additional metadata
 * @returns {IEventResponse<T>} A failure event response
 */
export function createFailureResponse<T = any>({
  eventId,
  eventType,
  error,
  metadata = {},
}: {
  eventId: string;
  eventType: string;
  error: EventResponseError;
  metadata?: Partial<EventResponseMetadata>;
}): IEventResponse<T> {
  return {
    success: false,
    status: EventResponseStatus.FAILURE,
    eventId,
    eventType,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates a retry event response
 * @function createRetryResponse
 * @template T - Type of the response data
 * @param {Object} params - Parameters for creating a retry response
 * @param {string} params.eventId - ID of the processed event
 * @param {string} params.eventType - Type of the processed event
 * @param {EventResponseError} params.error - Error information
 * @param {number} params.retryCount - Current retry attempt count
 * @param {Partial<EventResponseMetadata>} [params.metadata] - Optional additional metadata
 * @returns {IEventResponse<T>} A retry event response
 */
export function createRetryResponse<T = any>({
  eventId,
  eventType,
  error,
  retryCount,
  metadata = {},
}: {
  eventId: string;
  eventType: string;
  error: EventResponseError;
  retryCount: number;
  metadata?: Partial<EventResponseMetadata>;
}): IEventResponse<T> {
  return {
    success: false,
    status: EventResponseStatus.RETRY,
    eventId,
    eventType,
    error: {
      ...error,
      retryable: true,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      retryCount,
      ...metadata,
    },
  };
}

/**
 * Creates a partial success event response
 * @function createPartialResponse
 * @template T - Type of the response data
 * @param {Object} params - Parameters for creating a partial success response
 * @param {string} params.eventId - ID of the processed event
 * @param {string} params.eventType - Type of the processed event
 * @param {T} params.data - Partial data returned from processing
 * @param {EventResponseError} params.error - Error information for the partial failure
 * @param {Partial<EventResponseMetadata>} [params.metadata] - Optional additional metadata
 * @returns {IEventResponse<T>} A partial success event response
 */
export function createPartialResponse<T = any>({
  eventId,
  eventType,
  data,
  error,
  metadata = {},
}: {
  eventId: string;
  eventType: string;
  data: T;
  error: EventResponseError;
  metadata?: Partial<EventResponseMetadata>;
}): IEventResponse<T> {
  return {
    success: true, // Still considered successful but with caveats
    status: EventResponseStatus.PARTIAL,
    eventId,
    eventType,
    data,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates a rejected event response (for events that fail validation)
 * @function createRejectedResponse
 * @template T - Type of the response data
 * @param {Object} params - Parameters for creating a rejected response
 * @param {string} params.eventId - ID of the processed event
 * @param {string} params.eventType - Type of the processed event
 * @param {EventResponseError} params.error - Validation error information
 * @param {Partial<EventResponseMetadata>} [params.metadata] - Optional additional metadata
 * @returns {IEventResponse<T>} A rejected event response
 */
export function createRejectedResponse<T = any>({
  eventId,
  eventType,
  error,
  metadata = {},
}: {
  eventId: string;
  eventType: string;
  error: EventResponseError;
  metadata?: Partial<EventResponseMetadata>;
}): IEventResponse<T> {
  return {
    success: false,
    status: EventResponseStatus.REJECTED,
    eventId,
    eventType,
    error: {
      ...error,
      retryable: false, // Validation failures are not retryable
    },
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates an ignored event response (for events that are intentionally not processed)
 * @function createIgnoredResponse
 * @template T - Type of the response data
 * @param {Object} params - Parameters for creating an ignored response
 * @param {string} params.eventId - ID of the processed event
 * @param {string} params.eventType - Type of the processed event
 * @param {string} params.reason - Reason for ignoring the event
 * @param {Partial<EventResponseMetadata>} [params.metadata] - Optional additional metadata
 * @returns {IEventResponse<T>} An ignored event response
 */
export function createIgnoredResponse<T = any>({
  eventId,
  eventType,
  reason,
  metadata = {},
}: {
  eventId: string;
  eventType: string;
  reason: string;
  metadata?: Partial<EventResponseMetadata>;
}): IEventResponse<T> {
  return {
    success: true, // Considered successful because it was intentionally ignored
    status: EventResponseStatus.IGNORED,
    eventId,
    eventType,
    error: {
      code: 'EVENT_IGNORED',
      message: reason,
      retryable: false,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates an event response from an Error object
 * @function createResponseFromError
 * @template T - Type of the response data
 * @param {Object} params - Parameters for creating a response from an error
 * @param {string} params.eventId - ID of the processed event
 * @param {string} params.eventType - Type of the processed event
 * @param {Error} params.error - Error object
 * @param {boolean} [params.retryable=true] - Whether the error is retryable
 * @param {Partial<EventResponseMetadata>} [params.metadata] - Optional additional metadata
 * @returns {IEventResponse<T>} A failure event response
 */
export function createResponseFromError<T = any>({
  eventId,
  eventType,
  error,
  retryable = true,
  metadata = {},
}: {
  eventId: string;
  eventType: string;
  error: Error;
  retryable?: boolean;
  metadata?: Partial<EventResponseMetadata>;
}): IEventResponse<T> {
  return {
    success: false,
    status: retryable ? EventResponseStatus.RETRY : EventResponseStatus.FAILURE,
    eventId,
    eventType,
    error: {
      code: error.name || 'ERROR',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      retryable,
      details: {
        originalError: error,
      },
    },
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Type guard to check if a response is successful
 * @function isSuccessResponse
 * @param {IEventResponse<any>} response - The event response to check
 * @returns {boolean} True if the response is successful
 */
export function isSuccessResponse(response: IEventResponse<any>): boolean {
  return response.success && 
    (response.status === EventResponseStatus.SUCCESS || 
     response.status === EventResponseStatus.PARTIAL || 
     response.status === EventResponseStatus.IGNORED);
}

/**
 * Type guard to check if a response is a failure
 * @function isFailureResponse
 * @param {IEventResponse<any>} response - The event response to check
 * @returns {boolean} True if the response is a failure
 */
export function isFailureResponse(response: IEventResponse<any>): boolean {
  return !response.success || 
    (response.status === EventResponseStatus.FAILURE || 
     response.status === EventResponseStatus.REJECTED);
}

/**
 * Type guard to check if a response is retryable
 * @function isRetryableResponse
 * @param {IEventResponse<any>} response - The event response to check
 * @returns {boolean} True if the response is retryable
 */
export function isRetryableResponse(response: IEventResponse<any>): boolean {
  return !response.success && 
    response.status === EventResponseStatus.RETRY && 
    response.error?.retryable === true;
}

/**
 * Creates a journey-specific event response with appropriate metadata
 * @function createJourneyResponse
 * @template T - Type of the response data
 * @param {Object} params - Parameters for creating a journey response
 * @param {string} params.eventId - ID of the processed event
 * @param {string} params.eventType - Type of the processed event
 * @param {T} [params.data] - Optional data returned from processing
 * @param {EventResponseError} [params.error] - Optional error information
 * @param {string} params.journeyContext - Journey context (health, care, plan)
 * @param {boolean} [params.success=true] - Whether the response is successful
 * @param {EventResponseStatus} [params.status=EventResponseStatus.SUCCESS] - Response status
 * @param {Partial<EventResponseMetadata>} [params.metadata] - Optional additional metadata
 * @returns {IEventResponse<T>} A journey-specific event response
 */
export function createJourneyResponse<T = any>({
  eventId,
  eventType,
  data,
  error,
  journeyContext,
  success = true,
  status = EventResponseStatus.SUCCESS,
  metadata = {},
}: {
  eventId: string;
  eventType: string;
  data?: T;
  error?: EventResponseError;
  journeyContext: 'health' | 'care' | 'plan' | 'game';
  success?: boolean;
  status?: EventResponseStatus;
  metadata?: Partial<EventResponseMetadata>;
}): IEventResponse<T> {
  return {
    success,
    status,
    eventId,
    eventType,
    data,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      journeyContext,
      ...metadata,
    },
  };
}