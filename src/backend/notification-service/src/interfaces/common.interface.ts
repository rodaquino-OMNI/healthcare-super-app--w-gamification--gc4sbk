/**
 * Common interfaces used throughout the notification service.
 * Provides standardized patterns for service responses, error handling, and data presentation.
 */

import { ErrorType } from '@austa/errors';
import { JOURNEY_IDS } from '@austa/interfaces/common';

/**
 * Standard service result wrapper interface.
 * Provides a consistent structure for all service method responses.
 * 
 * @typeParam T - The type of data returned by the service
 */
export interface IServiceResult<T> {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * The data returned by the service (if successful)
   */
  data?: T;
  
  /**
   * Error information (if unsuccessful)
   */
  error?: IServiceError;
  
  /**
   * Metadata about the operation
   */
  meta?: IServiceMeta;
}

/**
 * Standard error information structure for service results.
 */
export interface IServiceError {
  /**
   * Error message for display or logging
   */
  message: string;
  
  /**
   * Error code for categorization and client handling
   */
  code: string;
  
  /**
   * Type of error (validation, business, technical, external)
   */
  type: ErrorType;
  
  /**
   * Additional details about the error
   */
  details?: Record<string, any>;
  
  /**
   * Stack trace (only included in development environments)
   */
  stack?: string;
}

/**
 * Metadata for service operations.
 * Includes tracking and performance information.
 */
export interface IServiceMeta {
  /**
   * Timestamp when the operation was performed
   */
  timestamp: string;
  
  /**
   * Request ID for tracing
   */
  requestId?: string;
  
  /**
   * Duration of the operation in milliseconds
   */
  duration?: number;
  
  /**
   * Journey context for the operation
   */
  journey?: keyof typeof JOURNEY_IDS;
  
  /**
   * Additional metadata specific to the operation
   */
  [key: string]: any;
}

/**
 * Standard pagination interface for list responses.
 * Provides a consistent structure for paginated data.
 * 
 * @typeParam T - The type of items being paginated
 */
export interface IPaginatedResponse<T> {
  /**
   * Array of items for the current page
   */
  data: T[];
  
  /**
   * Pagination metadata
   */
  meta: IPaginationMeta;
}

/**
 * Metadata for pagination responses.
 * Contains information about the pagination state.
 */
export interface IPaginationMeta {
  /**
   * Current page number (1-based)
   */
  currentPage: number;
  
  /**
   * Number of items per page
   */
  itemsPerPage: number;
  
  /**
   * Total number of items across all pages
   */
  totalItems: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
  
  /**
   * Whether there is a next page
   */
  hasNextPage: boolean;
  
  /**
   * Whether there is a previous page
   */
  hasPreviousPage: boolean;
  
  /**
   * Cursor for cursor-based pagination (if applicable)
   */
  cursor?: string;
  
  /**
   * Next cursor for cursor-based pagination (if applicable)
   */
  nextCursor?: string;
}

/**
 * Sort direction options for sorting operations.
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Sort options for list operations.
 * Defines how results should be sorted.
 */
export interface ISortOptions {
  /**
   * Field to sort by
   */
  field: string;
  
  /**
   * Sort direction (ascending or descending)
   */
  direction: SortDirection;
}

/**
 * Filter options for list operations.
 * Defines criteria for filtering results.
 */
export interface IFilterOptions {
  /**
   * Field to filter by
   */
  field: string;
  
  /**
   * Operator for the filter (equals, contains, etc.)
   */
  operator: FilterOperator;
  
  /**
   * Value to compare against
   */
  value: any;
}

/**
 * Filter operators for filter operations.
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUALS = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUALS = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn'
}

/**
 * Validation result interface for input validation.
 * Provides a consistent structure for validation results.
 */
export interface IValidationResult {
  /**
   * Whether the validation was successful
   */
  valid: boolean;
  
  /**
   * Validation errors (if unsuccessful)
   */
  errors?: IValidationError[];
}

/**
 * Validation error interface for input validation errors.
 */
export interface IValidationError {
  /**
   * Field that failed validation
   */
  field: string;
  
  /**
   * Error message for the validation failure
   */
  message: string;
  
  /**
   * Error code for the validation failure
   */
  code?: string;
  
  /**
   * Constraints that were violated
   */
  constraints?: Record<string, string>;
}

/**
 * Retry policy interface for error handling with retries.
 */
export interface IRetryPolicy {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;
  
  /**
   * Delay between retry attempts in milliseconds
   */
  delay: number;
  
  /**
   * Factor to multiply delay by for each subsequent retry
   */
  backoffFactor: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  maxDelay: number;
  
  /**
   * Whether to use jitter to randomize delay
   */
  useJitter: boolean;
  
  /**
   * Error types that should trigger a retry
   */
  retryableErrors: ErrorType[];
}

/**
 * Notification channel type for notification delivery.
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in-app'
}

/**
 * Notification status for tracking notification delivery.
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

/**
 * Notification priority levels.
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}