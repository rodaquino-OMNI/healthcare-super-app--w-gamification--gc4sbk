/**
 * Common API response interfaces for the AUSTA SuperApp
 * 
 * This file defines standardized response structures used across all domains
 * in the application. These interfaces ensure consistent API response formats
 * and provide type safety for frontend components consuming API data.
 */

/**
 * Base response interface that all API responses extend
 * Contains common fields present in all responses
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  /** Optional message providing additional context about the response */
  message?: string;
  /** The response data payload (only present in successful responses) */
  data?: T;
  /** ISO timestamp when the response was generated */
  timestamp: string;
  /** Unique request identifier for tracing and debugging */
  requestId: string;
}

/**
 * Success response containing a single item
 * @template T - The type of data returned
 */
export interface SuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Metadata for paginated responses
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
 * Metadata for collection responses
 */
export interface CollectionMeta {
  /** Total number of items in the collection */
  totalItems: number;
  /** ISO timestamp when the collection was last updated */
  lastUpdated?: string;
}

/**
 * Success response containing a paginated collection of items
 * @template T - The type of items in the collection
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  success: true;
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Success response containing a collection of items (non-paginated)
 * @template T - The type of items in the collection
 */
export interface CollectionResponse<T> extends ApiResponse<T[]> {
  success: true;
  data: T[];
  /** Collection metadata */
  meta: CollectionMeta;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  /** Client-side errors (4xx) */
  CLIENT = 'client',
  /** Server-side errors (5xx) */
  SERVER = 'server',
  /** Validation errors */
  VALIDATION = 'validation',
  /** Authentication/authorization errors */
  AUTH = 'auth',
  /** Business logic errors */
  BUSINESS = 'business',
  /** External service errors */
  EXTERNAL = 'external',
}

/**
 * Base error details interface
 */
export interface ErrorDetails {
  /** Unique error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Error category */
  category: ErrorCategory;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Optional field name for validation errors */
  field?: string;
  /** Optional additional error context */
  context?: Record<string, unknown>;
  /** Optional HTTP status code */
  status?: number;
  /** Optional journey identifier for journey-specific errors */
  journey?: 'health' | 'care' | 'plan' | 'gamification';
}

/**
 * Validation error details for a specific field
 */
export interface ValidationErrorDetails extends ErrorDetails {
  category: ErrorCategory.VALIDATION;
  /** The field that failed validation */
  field: string;
  /** The validation rule that failed */
  rule?: string;
  /** The expected value or pattern */
  expected?: string;
  /** The received value */
  received?: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  /** Primary error details */
  error: ErrorDetails;
  /** Optional additional errors (e.g., for validation errors on multiple fields) */
  errors?: ErrorDetails[];
}

/**
 * Validation error response interface
 */
export interface ValidationErrorResponse extends ErrorResponse {
  error: ValidationErrorDetails;
  /** List of all validation errors */
  errors: ValidationErrorDetails[];
}

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
export function isPaginatedResponse<T>(response: ApiResponse<T[] | T>): response is PaginatedResponse<T> {
  return response.success === true && Array.isArray(response.data) && 'pagination' in response;
}

/**
 * Type guard to check if a response is a collection response
 */
export function isCollectionResponse<T>(response: ApiResponse<T[] | T>): response is CollectionResponse<T> {
  return response.success === true && Array.isArray(response.data) && 'meta' in response;
}

/**
 * Type guard to check if an error response is a validation error response
 */
export function isValidationErrorResponse(response: ErrorResponse): response is ValidationErrorResponse {
  return response.error.category === ErrorCategory.VALIDATION && Array.isArray(response.errors);
}