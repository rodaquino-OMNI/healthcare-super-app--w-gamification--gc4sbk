/**
 * @file response.ts
 * @description Standardized API response interfaces for the AUSTA SuperApp
 * 
 * This file defines the common response interfaces used across all domains and journeys
 * in the AUSTA SuperApp. These interfaces ensure consistent API response structures
 * throughout the application and provide type safety for frontend components consuming
 * API data.
 * 
 * The interfaces include:
 * - Base response interface (IApiResponse)
 * - Success response interfaces (ISuccessResponse)
 * - Error response interfaces (IErrorResponse)
 * - Paginated response interfaces (IPaginatedResponse)
 * - Collection response interfaces (ICollectionResponse)
 */

/**
 * Base API response interface that all other response types extend
 * Contains common fields for all API responses
 */
export interface IApiResponse {
  /** 
   * Success status of the response 
   * true for successful responses, false for error responses
   */
  success: boolean;
  
  /** 
   * Timestamp when the response was generated 
   * ISO 8601 format string
   */
  timestamp: string;
  
  /** 
   * Optional request ID for tracing and debugging 
   * Used for correlating logs and tracking request flow
   */
  requestId?: string;
}

/**
 * Success response interface for single item responses
 * @template T - The type of data being returned
 */
export interface ISuccessResponse<T> extends IApiResponse {
  /** Always true for success responses */
  success: true;
  
  /** The data payload of the response */
  data: T;
  
  /** Optional metadata about the response */
  meta?: Record<string, unknown>;
}

/**
 * Error code enum for standardized error classification
 * Used to categorize errors across the application
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  
  // Journey-specific errors
  HEALTH_SERVICE_ERROR = 'HEALTH_SERVICE_ERROR',
  CARE_SERVICE_ERROR = 'CARE_SERVICE_ERROR',
  PLAN_SERVICE_ERROR = 'PLAN_SERVICE_ERROR',
  
  // Integration errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  
  // Data errors
  DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Authentication/Authorization errors
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // Unknown/unclassified errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Error severity levels for classifying the impact of errors
 */
export enum ErrorSeverity {
  /** Informational issues that don't affect functionality */
  INFO = 'INFO',
  
  /** Minor issues that don't significantly impact the user experience */
  WARNING = 'WARNING',
  
  /** Serious issues that prevent specific functionality from working */
  ERROR = 'ERROR',
  
  /** Critical issues that prevent core application functionality */
  CRITICAL = 'CRITICAL'
}

/**
 * Validation error interface for field-specific validation errors
 */
export interface IValidationError {
  /** Field that failed validation */
  field: string;
  
  /** Error message for this field */
  message: string;
  
  /** Optional error code specific to this validation error */
  code?: string;
  
  /** Optional value that was rejected */
  rejectedValue?: unknown;
}

/**
 * Error response interface for error responses
 */
export interface IErrorResponse extends IApiResponse {
  /** Always false for error responses */
  success: false;
  
  /** Error message describing what went wrong */
  message: string;
  
  /** Error code for programmatic error handling */
  code: ErrorCode;
  
  /** HTTP status code associated with this error */
  status: number;
  
  /** Error severity level */
  severity: ErrorSeverity;
  
  /** Optional array of validation errors for validation failures */
  validationErrors?: IValidationError[];
  
  /** Optional error details for debugging (not exposed in production) */
  details?: Record<string, unknown>;
  
  /** Optional journey context where the error occurred */
  journey?: 'health' | 'care' | 'plan';
  
  /** Optional error source (service or component that generated the error) */
  source?: string;
  
  /** Optional error ID for tracking specific error instances */
  errorId?: string;
  
  /** Optional suggestions for resolving the error */
  suggestions?: string[];
}

/**
 * Pagination metadata interface for paginated responses
 */
export interface IPaginationMeta {
  /** Current page number (1-based) */
  currentPage: number;
  
  /** Number of items per page */
  pageSize: number;
  
  /** Total number of items across all pages */
  totalItems: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  
  /** Whether there is a next page */
  hasNextPage: boolean;
}

/**
 * Paginated response interface for paginated data
 * @template T - The type of items in the paginated response
 */
export interface IPaginatedResponse<T> extends ISuccessResponse<T[]> {
  /** Pagination metadata */
  meta: IPaginationMeta & Record<string, unknown>;
}

/**
 * Collection metadata interface for collection responses
 */
export interface ICollectionMeta {
  /** Total number of items in the collection */
  totalItems: number;
  
  /** Timestamp when the collection was last updated */
  lastUpdated?: string;
  
  /** Optional filtering information applied to the collection */
  filters?: Record<string, unknown>;
  
  /** Optional sorting information applied to the collection */
  sort?: {
    /** Field used for sorting */
    field: string;
    
    /** Sort direction (asc or desc) */
    direction: 'asc' | 'desc';
  };
}

/**
 * Collection response interface for lists of data
 * @template T - The type of items in the collection
 */
export interface ICollectionResponse<T> extends ISuccessResponse<T[]> {
  /** Collection metadata */
  meta: ICollectionMeta & Record<string, unknown>;
}

/**
 * Empty success response interface for operations that don't return data
 */
export interface IEmptySuccessResponse extends IApiResponse {
  /** Always true for success responses */
  success: true;
  
  /** Optional metadata about the response */
  meta?: Record<string, unknown>;
}

/**
 * Batch operation result interface for bulk operations
 * @template T - The type of items in the batch operation
 */
export interface IBatchOperationResult<T> extends ISuccessResponse<{
  /** Successfully processed items */
  successful: T[];
  
  /** Failed items with their errors */
  failed: Array<{
    /** The item that failed */
    item: Partial<T>;
    
    /** Error information */
    error: {
      /** Error message */
      message: string;
      
      /** Error code */
      code: ErrorCode;
    };
  }>;
}> {
  /** Batch operation metadata */
  meta: {
    /** Total number of items processed */
    totalProcessed: number;
    
    /** Number of successful items */
    successCount: number;
    
    /** Number of failed items */
    failureCount: number;
  } & Record<string, unknown>;
}

/**
 * Stream response interface for streaming data
 * @template T - The type of items in the stream
 */
export interface IStreamResponse<T> extends ISuccessResponse<T[]> {
  /** Stream metadata */
  meta: {
    /** Whether the stream has more data */
    hasMore: boolean;
    
    /** Cursor for fetching the next batch of data */
    nextCursor?: string;
    
    /** Timestamp of the oldest item in the stream */
    oldestTimestamp?: string;
    
    /** Timestamp of the newest item in the stream */
    newestTimestamp?: string;
  } & Record<string, unknown>;
}

/**
 * Event response interface for event-based operations
 * @template T - The type of event data
 */
export interface IEventResponse<T> extends ISuccessResponse<T> {
  /** Event metadata */
  meta: {
    /** Event type */
    eventType: string;
    
    /** Event source */
    source: string;
    
    /** Event timestamp */
    eventTimestamp: string;
    
    /** Event ID */
    eventId: string;
  } & Record<string, unknown>;
}