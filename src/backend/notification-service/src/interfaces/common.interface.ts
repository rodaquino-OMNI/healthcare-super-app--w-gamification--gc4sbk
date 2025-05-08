/**
 * Common interfaces used throughout the notification service.
 * Provides standardized patterns for service responses, error handling, and data presentation.
 */

import { ErrorType } from '@austa/errors';
import { FilterDto, PaginationDto, SortDto } from '@austa/interfaces/common/dto';
import { IBaseEntity } from '@austa/interfaces/common/model';

/**
 * Standard service result interface for all service operations.
 * Provides a consistent pattern for success/failure status and error information.
 */
export interface IServiceResult<T = any> {
  /** Indicates if the operation was successful */
  success: boolean;
  /** The data returned by the operation (if successful) */
  data?: T;
  /** Error information (if operation failed) */
  error?: IServiceError;
  /** Optional metadata for the operation */
  metadata?: IMetadata;
}

/**
 * Error information for service results.
 */
export interface IServiceError {
  /** Error message */
  message: string;
  /** Error code for client-side error handling */
  code: string;
  /** Type of error (validation, business, technical, external) */
  type: ErrorType;
  /** Additional error details */
  details?: Record<string, any>;
  /** Stack trace (only included in development) */
  stack?: string;
  /** Original error that caused this error */
  cause?: Error;
}

/**
 * Metadata for service operations.
 * Used for tracking, analytics, and debugging.
 */
export interface IMetadata {
  /** Timestamp when the operation was performed */
  timestamp: string;
  /** Correlation ID for tracking requests across services */
  correlationId?: string;
  /** User ID who performed the operation */
  userId?: string;
  /** Journey context (health, care, plan) */
  journey?: string;
  /** Additional metadata properties */
  [key: string]: any;
}

/**
 * Standard paginated response interface.
 * Used for list operations that return paginated results.
 */
export interface IPaginatedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Flag indicating if there are more pages */
  hasMore: boolean;
  /** Optional metadata */
  metadata?: IMetadata;
}

/**
 * Options for sorting operations.
 * Extends the SortDto from @austa/interfaces.
 */
export interface ISortOptions extends SortDto {
  /** Additional sort options specific to notification service */
  defaultField?: string;
  /** Flag to include soft-deleted items */
  includeDeleted?: boolean;
}

/**
 * Options for filtering operations.
 * Extends the FilterDto from @austa/interfaces.
 */
export interface IFilterOptions extends FilterDto {
  /** Additional filter options specific to notification service */
  journeyType?: string;
  /** Flag to include soft-deleted items */
  includeDeleted?: boolean;
}

/**
 * Options for list operations.
 * Combines pagination, sorting, and filtering options.
 */
export interface IListOptions {
  /** Pagination options */
  pagination?: PaginationDto;
  /** Sorting options */
  sort?: ISortOptions;
  /** Filtering options */
  filter?: IFilterOptions;
  /** Additional options */
  [key: string]: any;
}

/**
 * Result of a validation operation.
 * Used for input validation and error collection.
 */
export interface IValidationResult {
  /** Indicates if the validation was successful */
  valid: boolean;
  /** Array of validation errors (if validation failed) */
  errors?: IValidationError[];
  /** Validated and transformed data (if validation succeeded) */
  data?: any;
}

/**
 * Validation error information.
 */
export interface IValidationError {
  /** Field that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Additional error details */
  details?: Record<string, any>;
}

/**
 * Retry policy configuration for notification delivery.
 */
export interface IRetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay before first retry (in milliseconds) */
  initialDelay: number;
  /** Backoff factor for exponential backoff */
  backoffFactor: number;
  /** Maximum delay between retries (in milliseconds) */
  maxDelay: number;
  /** Types of errors that should trigger a retry */
  retryableErrors: ErrorType[];
}

/**
 * Notification entity interface extending the base entity.
 */
export interface INotification extends IBaseEntity {
  /** User ID who will receive the notification */
  userId: string;
  /** Notification type */
  type: string;
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Delivery channel (push, email, sms, in-app) */
  channel: string;
  /** Notification status (sent, delivered, read, failed) */
  status: string;
  /** Additional notification data */
  data?: Record<string, any>;
  /** Delivery attempts information */
  deliveryAttempts?: IDeliveryAttempt[];
  /** Read timestamp (if notification has been read) */
  readAt?: Date;
}

/**
 * Delivery attempt information for tracking notification delivery.
 */
export interface IDeliveryAttempt {
  /** Timestamp of the delivery attempt */
  timestamp: Date;
  /** Status of the delivery attempt */
  status: string;
  /** Error information (if delivery failed) */
  error?: IServiceError;
  /** Provider-specific response */
  providerResponse?: Record<string, any>;
}