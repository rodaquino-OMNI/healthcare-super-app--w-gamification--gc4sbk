/**
 * @file error.interface.ts
 * @description Defines standardized error interfaces used throughout the gamification engine
 * for consistent error handling and reporting. These interfaces ensure uniform error handling
 * across all modules, improving debugging and client-side error messaging.
 */

import { HttpStatus } from '@nestjs/common';

/**
 * Enum representing the source journey of an error
 */
export enum ErrorJourney {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  SYSTEM = 'system'
}

/**
 * Enum representing the category of an error
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  EXTERNAL = 'external'
}

/**
 * Enum representing the severity of an error
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interface for error classification information
 */
export interface IErrorClassification {
  /**
   * The category of the error (validation, business, technical, external)
   */
  category: ErrorCategory;
  
  /**
   * The journey associated with the error (health, care, plan, gamification, system)
   */
  journey: ErrorJourney;
  
  /**
   * The severity level of the error
   */
  severity: ErrorSeverity;
  
  /**
   * Whether the error is transient and can be retried
   */
  isTransient: boolean;
  
  /**
   * Whether the error is expected as part of normal operation
   */
  isExpected: boolean;
}

/**
 * Interface for error context data
 */
export interface IErrorContext {
  /**
   * User ID associated with the error, if applicable
   */
  userId?: string;
  
  /**
   * Request ID for tracing the error across services
   */
  requestId?: string;
  
  /**
   * Correlation ID for linking related errors
   */
  correlationId?: string;
  
  /**
   * The operation that was being performed when the error occurred
   */
  operation?: string;
  
  /**
   * The resource that was being accessed when the error occurred
   */
  resource?: string;
  
  /**
   * Additional context data specific to the error
   */
  [key: string]: any;
}

/**
 * Interface for error metadata
 */
export interface IErrorMetadata {
  /**
   * Unique error code for identification
   */
  code: string;
  
  /**
   * HTTP status code associated with the error
   */
  statusCode: HttpStatus;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: Date;
  
  /**
   * Stack trace for debugging (not included in client responses)
   */
  stack?: string;
  
  /**
   * Source file and line where the error originated
   */
  source?: string;
  
  /**
   * Classification information for the error
   */
  classification: IErrorClassification;
}

/**
 * Interface for standardized error responses
 */
export interface IErrorResponse {
  /**
   * Unique error code for identification
   */
  code: string;
  
  /**
   * User-friendly error message
   */
  message: string;
  
  /**
   * HTTP status code associated with the error
   */
  statusCode: HttpStatus;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: Date;
  
  /**
   * Path where the error occurred
   */
  path?: string;
  
  /**
   * Error context data
   */
  context?: Record<string, any>;
  
  /**
   * Additional details about the error
   */
  details?: Record<string, any>;
}

/**
 * Interface for objects that can be serialized to an error response
 */
export interface IErrorSerializable {
  /**
   * Serializes the error to a standardized error response
   * @param includeDetails Whether to include detailed information in the response
   * @returns Standardized error response
   */
  toErrorResponse(includeDetails?: boolean): IErrorResponse;
  
  /**
   * Gets the error metadata
   * @returns Error metadata
   */
  getMetadata(): IErrorMetadata;
  
  /**
   * Gets the error context
   * @returns Error context data
   */
  getContext(): IErrorContext;
}

/**
 * Interface for retry configuration
 */
export interface IRetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Base delay between retries in milliseconds
   */
  baseDelayMs: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  maxDelayMs: number;
  
  /**
   * Factor by which to increase delay on each retry
   */
  backoffFactor: number;
  
  /**
   * Whether to add jitter to retry delays
   */
  useJitter: boolean;
}

/**
 * Interface for circuit breaker configuration
 */
export interface ICircuitBreakerConfig {
  /**
   * Number of failures required to open the circuit
   */
  failureThreshold: number;
  
  /**
   * Time in milliseconds to keep the circuit open before trying again
   */
  resetTimeoutMs: number;
  
  /**
   * Number of successful operations required to close the circuit
   */
  successThreshold: number;
  
  /**
   * Time in milliseconds after which a request in half-open state times out
   */
  halfOpenTimeoutMs: number;
}

/**
 * Interface for fallback strategy configuration
 */
export interface IFallbackConfig {
  /**
   * Whether to use cached data as fallback
   */
  useCachedData: boolean;
  
  /**
   * Time-to-live for cached fallback data in milliseconds
   */
  cacheTtlMs?: number;
  
  /**
   * Whether to use default values as fallback
   */
  useDefaultValues: boolean;
  
  /**
   * Whether to gracefully degrade functionality
   */
  gracefulDegradation: boolean;
}

/**
 * Type for error handler functions
 */
export type ErrorHandler = (error: Error, context?: IErrorContext) => Promise<void>;

/**
 * Type for error transformer functions
 */
export type ErrorTransformer = (error: Error, context?: IErrorContext) => Error;

/**
 * Type for error predicate functions used in filtering
 */
export type ErrorPredicate = (error: Error) => boolean;