/**
 * @file types.ts
 * @description Defines common TypeScript types and enums used across the AUSTA SuperApp.
 * These types provide standardized definitions for concepts that are shared across
 * multiple services and journeys.
 */

/**
 * Enum representing the three main journeys in the AUSTA SuperApp.
 * These journeys form the foundation of the user experience model.
 */
export enum JourneyType {
  /**
   * The Health journey ("Minha Saúde") focuses on health metrics, goals,
   * and medical history.
   */
  HEALTH = 'health',

  /**
   * The Care journey ("Cuidar-me Agora") focuses on appointments, medications,
   * and telemedicine.
   */
  CARE = 'care',

  /**
   * The Plan journey ("Meu Plano & Benefícios") focuses on insurance plans,
   * claims, and benefits.
   */
  PLAN = 'plan'
}

/**
 * Type representing the possible environment names.
 * Used for configuration and logging.
 */
export type EnvironmentType = 'development' | 'test' | 'staging' | 'production';

/**
 * Interface for standardized error responses across all services.
 * Ensures consistent error handling and reporting.
 */
export interface ErrorResponse {
  /**
   * HTTP status code for the error
   */
  statusCode: number;

  /**
   * Error message describing what went wrong
   */
  message: string;

  /**
   * Error code for programmatic handling
   */
  code: string;

  /**
   * Timestamp when the error occurred
   */
  timestamp: string;

  /**
   * Path where the error occurred
   */
  path?: string;

  /**
   * Additional details about the error
   */
  details?: Record<string, any>;

  /**
   * Journey context where the error occurred
   */
  journey?: JourneyType;
}

/**
 * Interface for standardized success responses across all services.
 * Ensures consistent response formatting.
 */
export interface SuccessResponse<T> {
  /**
   * HTTP status code for the response
   */
  statusCode: number;

  /**
   * Success message
   */
  message: string;

  /**
   * Response data
   */
  data: T;

  /**
   * Timestamp when the response was generated
   */
  timestamp: string;
}

/**
 * Type representing a unique identifier.
 * Used for consistent ID handling across services.
 */
export type ID = string;

/**
 * Interface for entities with standard metadata fields.
 * Provides consistent base fields for all database entities.
 */
export interface BaseEntity {
  /**
   * Unique identifier for the entity
   */
  id: ID;

  /**
   * Timestamp when the entity was created
   */
  createdAt: Date;

  /**
   * Timestamp when the entity was last updated
   */
  updatedAt: Date;

  /**
   * Optional timestamp when the entity was deleted (for soft deletes)
   */
  deletedAt?: Date;
}

/**
 * Type representing a correlation ID for distributed tracing.
 * Used to track requests across multiple services.
 */
export type CorrelationId = string;

/**
 * Interface for request context information.
 * Provides standardized context for all requests.
 */
export interface RequestContext {
  /**
   * Correlation ID for distributed tracing
   */
  correlationId: CorrelationId;

  /**
   * User ID making the request (if authenticated)
   */
  userId?: ID;

  /**
   * Journey context for the request
   */
  journey?: JourneyType;

  /**
   * Timestamp when the request was received
   */
  timestamp: Date;

  /**
   * Additional context data
   */
  metadata?: Record<string, any>;
}