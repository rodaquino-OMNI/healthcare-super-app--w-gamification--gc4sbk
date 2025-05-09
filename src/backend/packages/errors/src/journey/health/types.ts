/**
 * @file Health Journey Error Types
 * 
 * This file defines comprehensive TypeScript types and interfaces specific to Health journey errors,
 * including error enums, error code constants, and detailed error type definitions.
 * 
 * It serves as the foundation for type safety in Health error handling, ensuring consistent error
 * categorization, standardized error codes, and properly structured error details.
 */

import { ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Enum representing different types of Health Metrics errors.
 * Used for categorizing errors related to health metrics tracking and management.
 */
export enum HealthMetricsErrorType {
  /** Error when a metric cannot be found */
  METRIC_NOT_FOUND = 'metric_not_found',
  /** Error when a metric value is invalid or out of range */
  INVALID_METRIC_VALUE = 'invalid_metric_value',
  /** Error when a metric type is not supported */
  UNSUPPORTED_METRIC_TYPE = 'unsupported_metric_type',
  /** Error when there's a conflict in metric data */
  METRIC_DATA_CONFLICT = 'metric_data_conflict',
  /** Error when metric data cannot be processed */
  METRIC_PROCESSING_FAILED = 'metric_processing_failed'
}

/**
 * Enum representing different types of Health Goals errors.
 * Used for categorizing errors related to health goals creation and tracking.
 */
export enum HealthGoalsErrorType {
  /** Error when a goal cannot be found */
  GOAL_NOT_FOUND = 'goal_not_found',
  /** Error when a goal target is invalid */
  INVALID_GOAL_TARGET = 'invalid_goal_target',
  /** Error when a goal type is not supported */
  UNSUPPORTED_GOAL_TYPE = 'unsupported_goal_type',
  /** Error when a goal timeframe is invalid */
  INVALID_GOAL_TIMEFRAME = 'invalid_goal_timeframe',
  /** Error when goal progress cannot be updated */
  GOAL_UPDATE_FAILED = 'goal_update_failed',
  /** Error when goal creation fails */
  GOAL_CREATION_FAILED = 'goal_creation_failed'
}

/**
 * Enum representing different types of Health Insights errors.
 * Used for categorizing errors related to health insights generation and retrieval.
 */
export enum HealthInsightsErrorType {
  /** Error when an insight cannot be found */
  INSIGHT_NOT_FOUND = 'insight_not_found',
  /** Error when insight generation fails */
  INSIGHT_GENERATION_FAILED = 'insight_generation_failed',
  /** Error when insufficient data exists for insight generation */
  INSUFFICIENT_DATA = 'insufficient_data',
  /** Error when insight type is not supported */
  UNSUPPORTED_INSIGHT_TYPE = 'unsupported_insight_type',
  /** Error when insight data is invalid */
  INVALID_INSIGHT_DATA = 'invalid_insight_data'
}

/**
 * Enum representing different types of Device errors.
 * Used for categorizing errors related to health device connections and data.
 */
export enum DeviceErrorType {
  /** Error when a device cannot be found */
  DEVICE_NOT_FOUND = 'device_not_found',
  /** Error when device connection fails */
  CONNECTION_FAILED = 'connection_failed',
  /** Error when device authentication fails */
  AUTHENTICATION_FAILED = 'authentication_failed',
  /** Error when device type is not supported */
  UNSUPPORTED_DEVICE_TYPE = 'unsupported_device_type',
  /** Error when device data synchronization fails */
  SYNC_FAILED = 'sync_failed',
  /** Error when device is already connected to another account */
  DEVICE_ALREADY_CONNECTED = 'device_already_connected'
}

/**
 * Enum representing different types of FHIR integration errors.
 * Used for categorizing errors related to FHIR API interactions.
 */
export enum FHIRErrorType {
  /** Error when a FHIR resource cannot be found */
  RESOURCE_NOT_FOUND = 'resource_not_found',
  /** Error when FHIR API request fails */
  API_REQUEST_FAILED = 'api_request_failed',
  /** Error when FHIR resource validation fails */
  RESOURCE_VALIDATION_FAILED = 'resource_validation_failed',
  /** Error when FHIR resource type is not supported */
  UNSUPPORTED_RESOURCE_TYPE = 'unsupported_resource_type',
  /** Error when FHIR data mapping fails */
  DATA_MAPPING_FAILED = 'data_mapping_failed',
  /** Error when FHIR authentication fails */
  AUTHENTICATION_FAILED = 'authentication_failed'
}

/**
 * Standardized error code prefixes for Health journey errors.
 * These prefixes ensure clear error identification across the system.
 */
export const ERROR_CODE_PREFIXES = {
  /** Prefix for Health Metrics error codes */
  HEALTH_METRICS: 'HEALTH_METRICS_',
  /** Prefix for Health Goals error codes */
  HEALTH_GOALS: 'HEALTH_GOALS_',
  /** Prefix for Health Insights error codes */
  HEALTH_INSIGHTS: 'HEALTH_INSIGHTS_',
  /** Prefix for Device error codes */
  DEVICE: 'HEALTH_DEVICE_',
  /** Prefix for FHIR integration error codes */
  FHIR: 'HEALTH_FHIR_'
} as const;

/**
 * Error codes for Health Metrics errors.
 * Each code follows the standardized format with the HEALTH_METRICS_ prefix.
 */
export const HEALTH_METRICS_ERROR_CODES = {
  /** Error code for metric not found */
  NOT_FOUND: `${ERROR_CODE_PREFIXES.HEALTH_METRICS}001`,
  /** Error code for invalid metric value */
  INVALID_VALUE: `${ERROR_CODE_PREFIXES.HEALTH_METRICS}002`,
  /** Error code for unsupported metric type */
  UNSUPPORTED_TYPE: `${ERROR_CODE_PREFIXES.HEALTH_METRICS}003`,
  /** Error code for metric data conflict */
  DATA_CONFLICT: `${ERROR_CODE_PREFIXES.HEALTH_METRICS}004`,
  /** Error code for metric processing failure */
  PROCESSING_FAILED: `${ERROR_CODE_PREFIXES.HEALTH_METRICS}005`
} as const;

/**
 * Error codes for Health Goals errors.
 * Each code follows the standardized format with the HEALTH_GOALS_ prefix.
 */
export const HEALTH_GOALS_ERROR_CODES = {
  /** Error code for goal not found */
  NOT_FOUND: `${ERROR_CODE_PREFIXES.HEALTH_GOALS}001`,
  /** Error code for invalid goal target */
  INVALID_TARGET: `${ERROR_CODE_PREFIXES.HEALTH_GOALS}002`,
  /** Error code for unsupported goal type */
  UNSUPPORTED_TYPE: `${ERROR_CODE_PREFIXES.HEALTH_GOALS}003`,
  /** Error code for invalid goal timeframe */
  INVALID_TIMEFRAME: `${ERROR_CODE_PREFIXES.HEALTH_GOALS}004`,
  /** Error code for goal update failure */
  UPDATE_FAILED: `${ERROR_CODE_PREFIXES.HEALTH_GOALS}005`,
  /** Error code for goal creation failure */
  CREATION_FAILED: `${ERROR_CODE_PREFIXES.HEALTH_GOALS}006`
} as const;

/**
 * Error codes for Health Insights errors.
 * Each code follows the standardized format with the HEALTH_INSIGHTS_ prefix.
 */
export const HEALTH_INSIGHTS_ERROR_CODES = {
  /** Error code for insight not found */
  NOT_FOUND: `${ERROR_CODE_PREFIXES.HEALTH_INSIGHTS}001`,
  /** Error code for insight generation failure */
  GENERATION_FAILED: `${ERROR_CODE_PREFIXES.HEALTH_INSIGHTS}002`,
  /** Error code for insufficient data for insight generation */
  INSUFFICIENT_DATA: `${ERROR_CODE_PREFIXES.HEALTH_INSIGHTS}003`,
  /** Error code for unsupported insight type */
  UNSUPPORTED_TYPE: `${ERROR_CODE_PREFIXES.HEALTH_INSIGHTS}004`,
  /** Error code for invalid insight data */
  INVALID_DATA: `${ERROR_CODE_PREFIXES.HEALTH_INSIGHTS}005`
} as const;

/**
 * Error codes for Device errors.
 * Each code follows the standardized format with the HEALTH_DEVICE_ prefix.
 */
export const DEVICE_ERROR_CODES = {
  /** Error code for device not found */
  NOT_FOUND: `${ERROR_CODE_PREFIXES.DEVICE}001`,
  /** Error code for device connection failure */
  CONNECTION_FAILED: `${ERROR_CODE_PREFIXES.DEVICE}002`,
  /** Error code for device authentication failure */
  AUTHENTICATION_FAILED: `${ERROR_CODE_PREFIXES.DEVICE}003`,
  /** Error code for unsupported device type */
  UNSUPPORTED_TYPE: `${ERROR_CODE_PREFIXES.DEVICE}004`,
  /** Error code for device synchronization failure */
  SYNC_FAILED: `${ERROR_CODE_PREFIXES.DEVICE}005`,
  /** Error code for device already connected to another account */
  ALREADY_CONNECTED: `${ERROR_CODE_PREFIXES.DEVICE}006`
} as const;

/**
 * Error codes for FHIR integration errors.
 * Each code follows the standardized format with the HEALTH_FHIR_ prefix.
 */
export const FHIR_ERROR_CODES = {
  /** Error code for FHIR resource not found */
  RESOURCE_NOT_FOUND: `${ERROR_CODE_PREFIXES.FHIR}001`,
  /** Error code for FHIR API request failure */
  API_REQUEST_FAILED: `${ERROR_CODE_PREFIXES.FHIR}002`,
  /** Error code for FHIR resource validation failure */
  RESOURCE_VALIDATION_FAILED: `${ERROR_CODE_PREFIXES.FHIR}003`,
  /** Error code for unsupported FHIR resource type */
  UNSUPPORTED_RESOURCE_TYPE: `${ERROR_CODE_PREFIXES.FHIR}004`,
  /** Error code for FHIR data mapping failure */
  DATA_MAPPING_FAILED: `${ERROR_CODE_PREFIXES.FHIR}005`,
  /** Error code for FHIR authentication failure */
  AUTHENTICATION_FAILED: `${ERROR_CODE_PREFIXES.FHIR}006`
} as const;

/**
 * Union type of all Health error codes.
 * Provides type safety when working with Health error codes.
 */
export type HealthErrorCode =
  | typeof HEALTH_METRICS_ERROR_CODES[keyof typeof HEALTH_METRICS_ERROR_CODES]
  | typeof HEALTH_GOALS_ERROR_CODES[keyof typeof HEALTH_GOALS_ERROR_CODES]
  | typeof HEALTH_INSIGHTS_ERROR_CODES[keyof typeof HEALTH_INSIGHTS_ERROR_CODES]
  | typeof DEVICE_ERROR_CODES[keyof typeof DEVICE_ERROR_CODES]
  | typeof FHIR_ERROR_CODES[keyof typeof FHIR_ERROR_CODES];

/**
 * Interface for Health Metrics error context.
 * Provides structured data for metrics-related errors.
 */
export interface HealthMetricsErrorContext {
  /** The ID of the metric involved in the error */
  metricId?: string;
  /** The type of metric involved in the error */
  metricType?: string;
  /** The value that caused the error, if applicable */
  invalidValue?: any;
  /** The valid range for the metric, if applicable */
  validRange?: { min?: number; max?: number };
  /** Additional context-specific details */
  details?: Record<string, any>;
}

/**
 * Interface for Health Goals error context.
 * Provides structured data for goals-related errors.
 */
export interface HealthGoalsErrorContext {
  /** The ID of the goal involved in the error */
  goalId?: string;
  /** The type of goal involved in the error */
  goalType?: string;
  /** The invalid target value, if applicable */
  invalidTarget?: any;
  /** The invalid timeframe, if applicable */
  invalidTimeframe?: { start?: Date; end?: Date };
  /** Additional context-specific details */
  details?: Record<string, any>;
}

/**
 * Interface for Health Insights error context.
 * Provides structured data for insights-related errors.
 */
export interface HealthInsightsErrorContext {
  /** The ID of the insight involved in the error */
  insightId?: string;
  /** The type of insight involved in the error */
  insightType?: string;
  /** Information about missing data, if applicable */
  missingData?: string[];
  /** Additional context-specific details */
  details?: Record<string, any>;
}

/**
 * Interface for Device error context.
 * Provides structured data for device-related errors.
 */
export interface DeviceErrorContext {
  /** The ID of the device involved in the error */
  deviceId?: string;
  /** The type of device involved in the error */
  deviceType?: string;
  /** The connection details that failed, if applicable */
  connectionDetails?: Record<string, any>;
  /** The user ID the device is already connected to, if applicable */
  connectedUserId?: string;
  /** Additional context-specific details */
  details?: Record<string, any>;
}

/**
 * Interface for FHIR error context.
 * Provides structured data for FHIR-related errors.
 */
export interface FHIRErrorContext {
  /** The FHIR resource type involved in the error */
  resourceType?: string;
  /** The FHIR resource ID involved in the error */
  resourceId?: string;
  /** The validation errors, if applicable */
  validationErrors?: string[];
  /** The API endpoint that failed, if applicable */
  endpoint?: string;
  /** The HTTP status code returned by the FHIR API, if applicable */
  statusCode?: number;
  /** Additional context-specific details */
  details?: Record<string, any>;
}

/**
 * Union type of all Health error contexts.
 * Provides type safety when working with Health error contexts.
 */
export type HealthErrorContext =
  | HealthMetricsErrorContext
  | HealthGoalsErrorContext
  | HealthInsightsErrorContext
  | DeviceErrorContext
  | FHIRErrorContext;

/**
 * Type guard to check if an error code is a Health Metrics error code.
 * @param code - The error code to check
 * @returns True if the code is a Health Metrics error code
 */
export function isHealthMetricsErrorCode(code: string): code is typeof HEALTH_METRICS_ERROR_CODES[keyof typeof HEALTH_METRICS_ERROR_CODES] {
  return Object.values(HEALTH_METRICS_ERROR_CODES).includes(code as any);
}

/**
 * Type guard to check if an error code is a Health Goals error code.
 * @param code - The error code to check
 * @returns True if the code is a Health Goals error code
 */
export function isHealthGoalsErrorCode(code: string): code is typeof HEALTH_GOALS_ERROR_CODES[keyof typeof HEALTH_GOALS_ERROR_CODES] {
  return Object.values(HEALTH_GOALS_ERROR_CODES).includes(code as any);
}

/**
 * Type guard to check if an error code is a Health Insights error code.
 * @param code - The error code to check
 * @returns True if the code is a Health Insights error code
 */
export function isHealthInsightsErrorCode(code: string): code is typeof HEALTH_INSIGHTS_ERROR_CODES[keyof typeof HEALTH_INSIGHTS_ERROR_CODES] {
  return Object.values(HEALTH_INSIGHTS_ERROR_CODES).includes(code as any);
}

/**
 * Type guard to check if an error code is a Device error code.
 * @param code - The error code to check
 * @returns True if the code is a Device error code
 */
export function isDeviceErrorCode(code: string): code is typeof DEVICE_ERROR_CODES[keyof typeof DEVICE_ERROR_CODES] {
  return Object.values(DEVICE_ERROR_CODES).includes(code as any);
}

/**
 * Type guard to check if an error code is a FHIR error code.
 * @param code - The error code to check
 * @returns True if the code is a FHIR error code
 */
export function isFHIRErrorCode(code: string): code is typeof FHIR_ERROR_CODES[keyof typeof FHIR_ERROR_CODES] {
  return Object.values(FHIR_ERROR_CODES).includes(code as any);
}

/**
 * Type guard to check if an error code is any Health error code.
 * @param code - The error code to check
 * @returns True if the code is any Health error code
 */
export function isHealthErrorCode(code: string): code is HealthErrorCode {
  return (
    isHealthMetricsErrorCode(code) ||
    isHealthGoalsErrorCode(code) ||
    isHealthInsightsErrorCode(code) ||
    isDeviceErrorCode(code) ||
    isFHIRErrorCode(code)
  );
}

/**
 * Type guard to check if an error context is a Health Metrics error context.
 * @param context - The error context to check
 * @returns True if the context is a Health Metrics error context
 */
export function isHealthMetricsErrorContext(context: any): context is HealthMetricsErrorContext {
  return (
    context &&
    (context.metricId !== undefined ||
      context.metricType !== undefined ||
      context.invalidValue !== undefined ||
      context.validRange !== undefined)
  );
}

/**
 * Type guard to check if an error context is a Health Goals error context.
 * @param context - The error context to check
 * @returns True if the context is a Health Goals error context
 */
export function isHealthGoalsErrorContext(context: any): context is HealthGoalsErrorContext {
  return (
    context &&
    (context.goalId !== undefined ||
      context.goalType !== undefined ||
      context.invalidTarget !== undefined ||
      context.invalidTimeframe !== undefined)
  );
}

/**
 * Type guard to check if an error context is a Health Insights error context.
 * @param context - The error context to check
 * @returns True if the context is a Health Insights error context
 */
export function isHealthInsightsErrorContext(context: any): context is HealthInsightsErrorContext {
  return (
    context &&
    (context.insightId !== undefined ||
      context.insightType !== undefined ||
      context.missingData !== undefined)
  );
}

/**
 * Type guard to check if an error context is a Device error context.
 * @param context - The error context to check
 * @returns True if the context is a Device error context
 */
export function isDeviceErrorContext(context: any): context is DeviceErrorContext {
  return (
    context &&
    (context.deviceId !== undefined ||
      context.deviceType !== undefined ||
      context.connectionDetails !== undefined ||
      context.connectedUserId !== undefined)
  );
}

/**
 * Type guard to check if an error context is a FHIR error context.
 * @param context - The error context to check
 * @returns True if the context is a FHIR error context
 */
export function isFHIRErrorContext(context: any): context is FHIRErrorContext {
  return (
    context &&
    (context.resourceType !== undefined ||
      context.resourceId !== undefined ||
      context.validationErrors !== undefined ||
      context.endpoint !== undefined ||
      context.statusCode !== undefined)
  );
}

/**
 * Maps an error type and code to the appropriate error category from the base ErrorType enum.
 * This helps in determining the HTTP status code and general error handling approach.
 * 
 * @param errorType - The specific Health error type
 * @param errorCode - The specific Health error code
 * @returns The base ErrorType category (VALIDATION, BUSINESS, TECHNICAL, or EXTERNAL)
 */
export function mapToBaseErrorType(
  errorType: 
    | HealthMetricsErrorType 
    | HealthGoalsErrorType 
    | HealthInsightsErrorType 
    | DeviceErrorType 
    | FHIRErrorType,
  errorCode: HealthErrorCode
): ErrorType {
  // FHIR errors are typically external system errors
  if (isFHIRErrorCode(errorCode)) {
    return ErrorType.EXTERNAL;
  }
  
  // Device connection errors are typically external system errors
  if (isDeviceErrorCode(errorCode) && 
      (errorType === DeviceErrorType.CONNECTION_FAILED || 
       errorType === DeviceErrorType.SYNC_FAILED)) {
    return ErrorType.EXTERNAL;
  }
  
  // Not found errors are typically business logic errors
  if (errorType.toString().includes('_not_found')) {
    return ErrorType.BUSINESS;
  }
  
  // Invalid input errors are typically validation errors
  if (errorType.toString().includes('invalid_')) {
    return ErrorType.VALIDATION;
  }
  
  // Processing failures are typically technical errors
  if (errorType.toString().includes('_failed')) {
    return ErrorType.TECHNICAL;
  }
  
  // Default to business logic errors for other cases
  return ErrorType.BUSINESS;
}