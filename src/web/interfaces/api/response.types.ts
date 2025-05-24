/**
 * Response handling interfaces for the AUSTA SuperApp
 * 
 * This file defines standardized TypeScript interfaces for API response structures
 * across the application, including generic response patterns, pagination metadata,
 * response envelopes with consistent error handling, and success status indicators.
 * 
 * These interfaces are used by frontend components to safely handle and display API
 * response data with proper type checking and error handling.
 */

import { ApiError, JourneyError, ValidationError } from './error.types';

/**
 * Base response interface for all API responses
 */
export interface ApiResponse {
  success: boolean;
  timestamp: string;
  requestId?: string;
}

/**
 * Successful response with data
 */
export interface SuccessResponse<T> extends ApiResponse {
  success: true;
  data: T;
}

/**
 * Error response without data
 */
export interface ErrorResponse extends ApiResponse {
  success: false;
  error: JourneyError;
}

/**
 * Response envelope that can contain either data or an error
 */
export type ResponseEnvelope<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Pagination metadata for paginated responses
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Whether there is a previous page available */
  hasPreviousPage: boolean;
}

/**
 * Paginated response with items and pagination metadata
 */
export interface PaginatedResponse<T> extends ApiResponse {
  success: true;
  data: {
    items: T[];
    meta: PaginationMeta;
  };
}

/**
 * Cursor-based pagination metadata for infinite scrolling
 */
export interface CursorPaginationMeta {
  /** Cursor for the next page of results */
  nextCursor?: string;
  /** Cursor for the previous page of results */
  prevCursor?: string;
  /** Whether there are more items available */
  hasMore: boolean;
  /** Total number of items (if available) */
  totalItems?: number;
  /** Number of items per page */
  limit: number;
}

/**
 * Cursor-paginated response for infinite scrolling
 */
export interface CursorPaginatedResponse<T> extends ApiResponse {
  success: true;
  data: {
    items: T[];
    meta: CursorPaginationMeta;
  };
}

/**
 * Empty success response for operations that don't return data
 */
export interface EmptySuccessResponse extends ApiResponse {
  success: true;
  data: null;
}

/**
 * Validation error response for form submissions
 */
export interface ValidationErrorResponse extends ApiResponse {
  success: false;
  error: ValidationError;
}

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse<T>(response: ResponseEnvelope<T>): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse<T>(response: ResponseEnvelope<T>): response is ErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if a response is a validation error response
 */
export function isValidationErrorResponse<T>(
  response: ResponseEnvelope<T>
): response is ValidationErrorResponse {
  return isErrorResponse(response) && response.error.code === 2; // ValidationError code
}

/**
 * Type guard to check if a response is a paginated response
 */
export function isPaginatedResponse<T>(
  response: ResponseEnvelope<T> | PaginatedResponse<T>
): response is PaginatedResponse<T> {
  return (
    response.success === true &&
    typeof response.data === 'object' &&
    response.data !== null &&
    'items' in response.data &&
    'meta' in response.data &&
    Array.isArray(response.data.items)
  );
}

/**
 * Type guard to check if a response is a cursor-paginated response
 */
export function isCursorPaginatedResponse<T>(
  response: ResponseEnvelope<T> | CursorPaginatedResponse<T>
): response is CursorPaginatedResponse<T> {
  return (
    response.success === true &&
    typeof response.data === 'object' &&
    response.data !== null &&
    'items' in response.data &&
    'meta' in response.data &&
    Array.isArray(response.data.items) &&
    'hasMore' in response.data.meta
  );
}

/**
 * Journey-specific response with context
 */
export interface JourneyResponse<T, C = unknown> extends SuccessResponse<T> {
  context?: C;
  journey: string;
}

/**
 * Batch operation response for multiple items
 */
export interface BatchResponse<T> extends ApiResponse {
  success: true;
  data: {
    results: Array<{
      id: string;
      success: boolean;
      data?: T;
      error?: ApiError;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
}

/**
 * Response with metadata for operations that return both data and metadata
 */
export interface ResponseWithMeta<T, M> extends ApiResponse {
  success: true;
  data: T;
  meta: M;
}

/**
 * Stream response for chunked data delivery
 */
export interface StreamResponse<T> extends ApiResponse {
  success: true;
  data: {
    /** Unique identifier for this stream */
    streamId: string;
    /** Whether this is the last chunk in the stream */
    complete: boolean;
    /** The current chunk of data */
    chunk: T;
    /** The chunk number (0-based) */
    chunkNumber: number;
    /** Total number of chunks (if known) */
    totalChunks?: number;
  };
}

/**
 * Response with caching information
 */
export interface CachedResponse<T> extends SuccessResponse<T> {
  meta: {
    /** Whether the response was served from cache */
    fromCache: boolean;
    /** When the data was last updated */
    lastUpdated: string;
    /** When the cache will expire */
    expiresAt?: string;
    /** Version of the cached data */
    version?: string;
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse extends ApiResponse {
  success: true;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    timestamp: string;
    services: Record<string, {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency?: number;
      message?: string;
    }>;
  };
}

/**
 * File upload response
 */
export interface FileUploadResponse extends ApiResponse {
  success: true;
  data: {
    fileId: string;
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
    thumbnailUrl?: string;
    uploadedAt: string;
    expiresAt?: string;
  };
}

/**
 * Bulk file upload response
 */
export interface BulkFileUploadResponse extends ApiResponse {
  success: true;
  data: {
    files: Array<{
      fileId: string;
      filename: string;
      mimeType: string;
      size: number;
      url?: string;
      thumbnailUrl?: string;
      uploadedAt: string;
      expiresAt?: string;
      success: boolean;
      error?: ApiError;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalSize: number;
    };
  };
}

/**
 * Response with progress information for long-running operations
 */
export interface ProgressResponse extends ApiResponse {
  success: true;
  data: {
    operationId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    message?: string;
    startedAt: string;
    estimatedCompletion?: string;
    result?: unknown;
    error?: ApiError;
  };
}

/**
 * WebSocket event response
 */
export interface WebSocketEventResponse<T> {
  type: string;
  payload: T;
  id: string;
  timestamp: string;
}

/**
 * GraphQL response wrapper
 */
export interface GraphQLResponse<T> {
  data: T | null;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: {
      code: string;
      exception?: {
        error?: ApiError;
      };
    };
  }>;
}

/**
 * Creates a success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an error response
 */
export function createErrorResponse(error: JourneyError): ErrorResponse {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalItems: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return {
    success: true,
    data: {
      items,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a cursor-paginated response
 */
export function createCursorPaginatedResponse<T>(
  items: T[],
  hasMore: boolean,
  nextCursor?: string,
  prevCursor?: string,
  totalItems?: number,
  limit: number = 20
): CursorPaginatedResponse<T> {
  return {
    success: true,
    data: {
      items,
      meta: {
        nextCursor,
        prevCursor,
        hasMore,
        totalItems,
        limit,
      },
    },
    timestamp: new Date().toISOString(),
  };
}