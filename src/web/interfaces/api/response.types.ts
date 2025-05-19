/**
 * Response Types for AUSTA SuperApp API
 * 
 * This file defines the TypeScript interfaces and types for API responses
 * across the AUSTA SuperApp. It provides a consistent response structure
 * for all journeys and ensures proper type safety between frontend and backend.
 */

import { ApiErrorResponse, BaseError } from './error.types';

/**
 * Generic API response interface that all response types extend
 */
export interface ApiResponse<T> {
  success: boolean;        // Indicates if the request was successful
  data?: T;               // Response data (present if success is true)
  error?: BaseError;      // Error information (present if success is false)
  timestamp: string;      // ISO timestamp when response was generated
  requestId?: string;     // Optional request ID for tracing
}

/**
 * Success response with required data
 */
export interface SuccessResponse<T> extends ApiResponse<T> {
  success: true;          // Always true for success responses
  data: T;                // Required data for success responses
  error?: never;          // No error for success responses
}

/**
 * Error response with required error information
 */
export interface ErrorResponse extends ApiResponse<never> {
  success: false;         // Always false for error responses
  data?: never;           // No data for error responses
  error: BaseError;       // Required error information
}

/**
 * Pagination metadata for paginated responses
 */
export interface PaginationMeta {
  page: number;           // Current page number (1-based)
  pageSize: number;       // Number of items per page
  totalItems: number;     // Total number of items across all pages
  totalPages: number;     // Total number of pages
  hasNextPage: boolean;   // Whether there is a next page
  hasPreviousPage: boolean; // Whether there is a previous page
}

/**
 * Extended pagination metadata with additional navigation information
 */
export interface ExtendedPaginationMeta extends PaginationMeta {
  nextPage?: number;      // Next page number if available
  previousPage?: number;  // Previous page number if available
  firstPage: number;      // First page number (always 1)
  lastPage: number;       // Last page number (same as totalPages)
}

/**
 * Cursor-based pagination metadata for infinite scrolling
 */
export interface CursorPaginationMeta {
  nextCursor?: string;    // Cursor for the next page of results
  prevCursor?: string;    // Cursor for the previous page of results
  hasNextPage: boolean;   // Whether there are more items after this page
  hasPreviousPage: boolean; // Whether there are more items before this page
  totalItems?: number;    // Optional total number of items (may not be available)
}

/**
 * Paginated response with pagination metadata
 */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: PaginationMeta; // Pagination metadata
}

/**
 * Cursor-paginated response for infinite scrolling
 */
export interface CursorPaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: CursorPaginationMeta; // Cursor pagination metadata
}

/**
 * Response envelope that wraps all API responses
 */
export interface ResponseEnvelope<T> {
  response: ApiResponse<T>; // The API response
  meta: {
    apiVersion: string;   // API version
    serverTime: string;   // Server time when response was generated
    processingTimeMs: number; // Processing time in milliseconds
    journey?: string;     // Optional journey context
  };
}

/**
 * Batch operation response for multiple items
 */
export interface BatchOperationResponse<T> extends SuccessResponse<{
  successful: T[];        // Successfully processed items
  failed: Array<{         // Failed items with errors
    item: Partial<T>;     // The item that failed
    error: BaseError;     // Error information
  }>;
  totalProcessed: number; // Total number of items processed
  totalSuccessful: number; // Number of successfully processed items
  totalFailed: number;    // Number of failed items
}> {}

/**
 * Stream response for chunked data delivery
 */
export interface StreamResponse<T> extends ApiResponse<T> {
  isComplete: boolean;    // Whether the stream is complete
  chunkIndex?: number;    // Index of the current chunk
  totalChunks?: number;   // Total number of chunks (if known)
}

/**
 * File download response
 */
export interface FileDownloadResponse extends SuccessResponse<{
  fileName: string;       // Name of the file
  fileSize: number;       // Size of the file in bytes
  mimeType: string;       // MIME type of the file
  url: string;            // URL to download the file
  expiresAt?: string;     // Optional expiration time for the download URL
}> {}

/**
 * Empty success response for operations that don't return data
 */
export interface EmptySuccessResponse extends SuccessResponse<null> {
  message?: string;       // Optional success message
}

/**
 * Health check response
 */
export interface HealthCheckResponse extends SuccessResponse<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;        // Service version
  uptime: number;         // Service uptime in seconds
  checks: Array<{         // Individual health checks
    name: string;         // Name of the check
    status: 'pass' | 'warn' | 'fail';
    message?: string;     // Optional message
    timestamp: string;    // When the check was performed
  }>;
}> {}

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(response: ApiResponse<unknown>): response is ErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if a response is a paginated response
 */
export function isPaginatedResponse<T>(
  response: ApiResponse<T[] | unknown>
): response is PaginatedResponse<T> {
  return (
    response.success === true &&
    Array.isArray(response.data) &&
    'pagination' in response &&
    typeof (response as PaginatedResponse<T>).pagination === 'object' &&
    'page' in (response as PaginatedResponse<T>).pagination
  );
}

/**
 * Type guard to check if a response is a cursor-paginated response
 */
export function isCursorPaginatedResponse<T>(
  response: ApiResponse<T[] | unknown>
): response is CursorPaginatedResponse<T> {
  return (
    response.success === true &&
    Array.isArray(response.data) &&
    'pagination' in response &&
    typeof (response as CursorPaginatedResponse<T>).pagination === 'object' &&
    'hasNextPage' in (response as CursorPaginatedResponse<T>).pagination &&
    !('page' in (response as CursorPaginatedResponse<T>).pagination)
  );
}