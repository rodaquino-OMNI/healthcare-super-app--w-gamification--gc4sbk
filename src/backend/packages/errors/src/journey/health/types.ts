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
 */
export enum HealthMetricsErrorType {
  /** Metric data validation failed */
  INVALID_METRIC_DATA = 'invalid_metric_data',
  /** Metric type not supported */
  UNSUPPORTED_METRIC_TYPE = 'unsupported_metric_type',
  /** Metric data point already exists */
  DUPLICATE_METRIC = 'duplicate_metric',
  /** Metric data point not found */
  METRIC_NOT_FOUND = 'metric_not_found',
  /** Metric data range invalid */
  INVALID_DATE_RANGE = 'invalid_date_range',
  /** Metric data exceeds threshold */
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  /** Metric data below threshold */
  THRESHOLD_NOT_MET = 'threshold_not_met',
  /** Metric data processing failed */
  PROCESSING_FAILED = 'processing_failed'
}

/**
 * Enum representing different types of Health Goals errors.
 */
export enum HealthGoalsErrorType {
  /** Goal validation failed */
  INVALID_GOAL = 'invalid_goal',
  /** Goal already exists */
  DUPLICATE_GOAL = 'duplicate_goal',
  /** Goal not found */
  GOAL_NOT_FOUND = 'goal_not_found',
  /** Goal target invalid */
  INVALID_TARGET = 'invalid_target',
  /** Goal deadline invalid */
  INVALID_DEADLINE = 'invalid_deadline',
  /** Goal progress calculation failed */
  PROGRESS_CALCULATION_FAILED = 'progress_calculation_failed',
  /** Goal update failed */
  UPDATE_FAILED = 'update_failed',
  /** Maximum number of active goals reached */
  MAX_GOALS_REACHED = 'max_goals_reached'
}

/**
 * Enum representing different types of Health Insights errors.
 */
export enum HealthInsightsErrorType {
  /** Insight generation failed */
  GENERATION_FAILED = 'generation_failed',
  /** Insufficient data for insight */
  INSUFFICIENT_DATA = 'insufficient_data',
  /** Insight not found */
  INSIGHT_NOT_FOUND = 'insight_not_found',
  /** Insight type not supported */
  UNSUPPORTED_TYPE = 'unsupported_type',
  /** Insight processing timed out */
  PROCESSING_TIMEOUT = 'processing_timeout',
  /** Insight algorithm error */
  ALGORITHM_ERROR = 'algorithm_error'
}

/**
 * Enum representing different types of Device Connection errors.
 */
export enum DeviceConnectionErrorType {
  /** Device connection failed */
  CONNECTION_FAILED = 'connection_failed',
  /** Device not found */
  DEVICE_NOT_FOUND = 'device_not_found',
  /** Device type not supported */
  UNSUPPORTED_DEVICE = 'unsupported_device',
  /** Device authentication failed */
  AUTHENTICATION_FAILED = 'authentication_failed',
  /** Device sync failed */
  SYNC_FAILED = 'sync_failed',
  /** Device already connected */
  ALREADY_CONNECTED = 'already_connected',
  /** Device disconnected unexpectedly */
  UNEXPECTED_DISCONNECT = 'unexpected_disconnect',
  /** Maximum number of devices reached */
  MAX_DEVICES_REACHED = 'max_devices_reached'
}

/**
 * Enum representing different types of FHIR Integration errors.
 */
export enum FHIRIntegrationErrorType {
  /** FHIR resource validation failed */
  RESOURCE_VALIDATION_FAILED = 'resource_validation_failed',
  /** FHIR resource not found */
  RESOURCE_NOT_FOUND = 'resource_not_found',
  /** FHIR server connection failed */
  CONNECTION_FAILED = 'connection_failed',
  /** FHIR operation not supported */
  UNSUPPORTED_OPERATION = 'unsupported_operation',
  /** FHIR authentication failed */
  AUTHENTICATION_FAILED = 'authentication_failed',
  /** FHIR resource mapping failed */
  MAPPING_FAILED = 'mapping_failed',
  /** FHIR request timed out */
  REQUEST_TIMEOUT = 'request_timeout',
  /** FHIR server returned an error */
  SERVER_ERROR = 'server_error'
}

/**
 * Error code constants for Health Metrics errors.
 * Format: HEALTH_METRICS_[ERROR_TYPE]
 */
export const HEALTH_METRICS_ERROR_CODES = {
  INVALID_METRIC_DATA: 'HEALTH_METRICS_001',
  UNSUPPORTED_METRIC_TYPE: 'HEALTH_METRICS_002',
  DUPLICATE_METRIC: 'HEALTH_METRICS_003',
  METRIC_NOT_FOUND: 'HEALTH_METRICS_004',
  INVALID_DATE_RANGE: 'HEALTH_METRICS_005',
  THRESHOLD_EXCEEDED: 'HEALTH_METRICS_006',
  THRESHOLD_NOT_MET: 'HEALTH_METRICS_007',
  PROCESSING_FAILED: 'HEALTH_METRICS_008'
} as const;

/**
 * Error code constants for Health Goals errors.
 * Format: HEALTH_GOALS_[ERROR_TYPE]
 */
export const HEALTH_GOALS_ERROR_CODES = {
  INVALID_GOAL: 'HEALTH_GOALS_001',
  DUPLICATE_GOAL: 'HEALTH_GOALS_002',
  GOAL_NOT_FOUND: 'HEALTH_GOALS_003',
  INVALID_TARGET: 'HEALTH_GOALS_004',
  INVALID_DEADLINE: 'HEALTH_GOALS_005',
  PROGRESS_CALCULATION_FAILED: 'HEALTH_GOALS_006',
  UPDATE_FAILED: 'HEALTH_GOALS_007',
  MAX_GOALS_REACHED: 'HEALTH_GOALS_008'
} as const;

/**
 * Error code constants for Health Insights errors.
 * Format: HEALTH_INSIGHTS_[ERROR_TYPE]
 */
export const HEALTH_INSIGHTS_ERROR_CODES = {
  GENERATION_FAILED: 'HEALTH_INSIGHTS_001',
  INSUFFICIENT_DATA: 'HEALTH_INSIGHTS_002',
  INSIGHT_NOT_FOUND: 'HEALTH_INSIGHTS_003',
  UNSUPPORTED_TYPE: 'HEALTH_INSIGHTS_004',
  PROCESSING_TIMEOUT: 'HEALTH_INSIGHTS_005',
  ALGORITHM_ERROR: 'HEALTH_INSIGHTS_006'
} as const;

/**
 * Error code constants for Device Connection errors.
 * Format: HEALTH_DEVICE_[ERROR_TYPE]
 */
export const HEALTH_DEVICE_ERROR_CODES = {
  CONNECTION_FAILED: 'HEALTH_DEVICE_001',
  DEVICE_NOT_FOUND: 'HEALTH_DEVICE_002',
  UNSUPPORTED_DEVICE: 'HEALTH_DEVICE_003',
  AUTHENTICATION_FAILED: 'HEALTH_DEVICE_004',
  SYNC_FAILED: 'HEALTH_DEVICE_005',
  ALREADY_CONNECTED: 'HEALTH_DEVICE_006',
  UNEXPECTED_DISCONNECT: 'HEALTH_DEVICE_007',
  MAX_DEVICES_REACHED: 'HEALTH_DEVICE_008'
} as const;

/**
 * Error code constants for FHIR Integration errors.
 * Format: HEALTH_FHIR_[ERROR_TYPE]
 */
export const HEALTH_FHIR_ERROR_CODES = {
  RESOURCE_VALIDATION_FAILED: 'HEALTH_FHIR_001',
  RESOURCE_NOT_FOUND: 'HEALTH_FHIR_002',
  CONNECTION_FAILED: 'HEALTH_FHIR_003',
  UNSUPPORTED_OPERATION: 'HEALTH_FHIR_004',
  AUTHENTICATION_FAILED: 'HEALTH_FHIR_005',
  MAPPING_FAILED: 'HEALTH_FHIR_006',
  REQUEST_TIMEOUT: 'HEALTH_FHIR_007',
  SERVER_ERROR: 'HEALTH_FHIR_008'
} as const;

/**
 * Type for Health Metrics error codes.
 */
export type HealthMetricsErrorCode = typeof HEALTH_METRICS_ERROR_CODES[keyof typeof HEALTH_METRICS_ERROR_CODES];

/**
 * Type for Health Goals error codes.
 */
export type HealthGoalsErrorCode = typeof HEALTH_GOALS_ERROR_CODES[keyof typeof HEALTH_GOALS_ERROR_CODES];

/**
 * Type for Health Insights error codes.
 */
export type HealthInsightsErrorCode = typeof HEALTH_INSIGHTS_ERROR_CODES[keyof typeof HEALTH_INSIGHTS_ERROR_CODES];

/**
 * Type for Device Connection error codes.
 */
export type HealthDeviceErrorCode = typeof HEALTH_DEVICE_ERROR_CODES[keyof typeof HEALTH_DEVICE_ERROR_CODES];

/**
 * Type for FHIR Integration error codes.
 */
export type HealthFHIRErrorCode = typeof HEALTH_FHIR_ERROR_CODES[keyof typeof HEALTH_FHIR_ERROR_CODES];

/**
 * Union type for all Health journey error codes.
 */
export type HealthErrorCode =
  | HealthMetricsErrorCode
  | HealthGoalsErrorCode
  | HealthInsightsErrorCode
  | HealthDeviceErrorCode
  | HealthFHIRErrorCode;

/**
 * Interface for Health Metrics error context.
 */
export interface HealthMetricsErrorContext {
  /** Type of metric (e.g., 'steps', 'heart_rate', 'blood_pressure') */
  metricType?: string;
  /** User ID associated with the metric */
  userId?: string;
  /** Date range for the metrics query */
  dateRange?: {
    start?: Date | string;
    end?: Date | string;
  };
  /** Validation errors if applicable */
  validationErrors?: Record<string, string>;
  /** Threshold values if applicable */
  thresholds?: {
    min?: number;
    max?: number;
    actual?: number;
  };
}

/**
 * Interface for Health Goals error context.
 */
export interface HealthGoalsErrorContext {
  /** Goal ID if applicable */
  goalId?: string;
  /** User ID associated with the goal */
  userId?: string;
  /** Goal type (e.g., 'steps', 'weight_loss', 'sleep') */
  goalType?: string;
  /** Goal target details */
  target?: {
    value?: number;
    unit?: string;
  };
  /** Goal deadline */
  deadline?: Date | string;
  /** Validation errors if applicable */
  validationErrors?: Record<string, string>;
  /** Current number of active goals if applicable */
  activeGoalsCount?: number;
}

/**
 * Interface for Health Insights error context.
 */
export interface HealthInsightsErrorContext {
  /** Insight ID if applicable */
  insightId?: string;
  /** User ID associated with the insight */
  userId?: string;
  /** Insight type */
  insightType?: string;
  /** Data points available for insight generation */
  dataPointsCount?: number;
  /** Minimum data points required */
  minDataPointsRequired?: number;
  /** Processing duration before timeout */
  processingDuration?: number;
  /** Algorithm details if applicable */
  algorithm?: {
    name?: string;
    version?: string;
    parameters?: Record<string, any>;
  };
}

/**
 * Interface for Device Connection error context.
 */
export interface DeviceConnectionErrorContext {
  /** Device ID if applicable */
  deviceId?: string;
  /** User ID associated with the device */
  userId?: string;
  /** Device type */
  deviceType?: string;
  /** Device manufacturer */
  manufacturer?: string;
  /** Device model */
  model?: string;
  /** Connection details */
  connection?: {
    protocol?: string;
    status?: string;
    lastSyncDate?: Date | string;
  };
  /** Current number of connected devices if applicable */
  connectedDevicesCount?: number;
}

/**
 * Interface for FHIR Integration error context.
 */
export interface FHIRIntegrationErrorContext {
  /** FHIR resource type */
  resourceType?: string;
  /** FHIR resource ID */
  resourceId?: string;
  /** User ID associated with the resource */
  userId?: string;
  /** FHIR operation (e.g., 'read', 'search', 'create') */
  operation?: string;
  /** FHIR server details */
  server?: {
    url?: string;
    version?: string;
  };
  /** Response details if applicable */
  response?: {
    status?: number;
    outcome?: any;
  };
  /** Request timeout duration if applicable */
  timeoutDuration?: number;
}

/**
 * Union type for all Health error contexts.
 */
export type HealthErrorContext =
  | HealthMetricsErrorContext
  | HealthGoalsErrorContext
  | HealthInsightsErrorContext
  | DeviceConnectionErrorContext
  | FHIRIntegrationErrorContext;

/**
 * Type guard to check if an error code is a Health Metrics error code.
 * @param code - The error code to check
 * @returns True if the code is a Health Metrics error code
 */
export function isHealthMetricsErrorCode(code: string): code is HealthMetricsErrorCode {
  return Object.values(HEALTH_METRICS_ERROR_CODES).includes(code as HealthMetricsErrorCode);
}

/**
 * Type guard to check if an error code is a Health Goals error code.
 * @param code - The error code to check
 * @returns True if the code is a Health Goals error code
 */
export function isHealthGoalsErrorCode(code: string): code is HealthGoalsErrorCode {
  return Object.values(HEALTH_GOALS_ERROR_CODES).includes(code as HealthGoalsErrorCode);
}

/**
 * Type guard to check if an error code is a Health Insights error code.
 * @param code - The error code to check
 * @returns True if the code is a Health Insights error code
 */
export function isHealthInsightsErrorCode(code: string): code is HealthInsightsErrorCode {
  return Object.values(HEALTH_INSIGHTS_ERROR_CODES).includes(code as HealthInsightsErrorCode);
}

/**
 * Type guard to check if an error code is a Health Device error code.
 * @param code - The error code to check
 * @returns True if the code is a Health Device error code
 */
export function isHealthDeviceErrorCode(code: string): code is HealthDeviceErrorCode {
  return Object.values(HEALTH_DEVICE_ERROR_CODES).includes(code as HealthDeviceErrorCode);
}

/**
 * Type guard to check if an error code is a Health FHIR error code.
 * @param code - The error code to check
 * @returns True if the code is a Health FHIR error code
 */
export function isHealthFHIRErrorCode(code: string): code is HealthFHIRErrorCode {
  return Object.values(HEALTH_FHIR_ERROR_CODES).includes(code as HealthFHIRErrorCode);
}

/**
 * Type guard to check if an error code is any Health journey error code.
 * @param code - The error code to check
 * @returns True if the code is a Health journey error code
 */
export function isHealthErrorCode(code: string): code is HealthErrorCode {
  return (
    isHealthMetricsErrorCode(code) ||
    isHealthGoalsErrorCode(code) ||
    isHealthInsightsErrorCode(code) ||
    isHealthDeviceErrorCode(code) ||
    isHealthFHIRErrorCode(code)
  );
}

/**
 * Maps a Health Metrics error type to its corresponding error code.
 * @param errorType - The Health Metrics error type
 * @returns The corresponding error code
 */
export function getHealthMetricsErrorCode(errorType: HealthMetricsErrorType): HealthMetricsErrorCode {
  const key = Object.keys(HealthMetricsErrorType).find(
    (key) => HealthMetricsErrorType[key as keyof typeof HealthMetricsErrorType] === errorType
  );
  
  if (!key) {
    throw new Error(`Unknown Health Metrics error type: ${errorType}`);
  }
  
  return HEALTH_METRICS_ERROR_CODES[key as keyof typeof HEALTH_METRICS_ERROR_CODES];
}

/**
 * Maps a Health Goals error type to its corresponding error code.
 * @param errorType - The Health Goals error type
 * @returns The corresponding error code
 */
export function getHealthGoalsErrorCode(errorType: HealthGoalsErrorType): HealthGoalsErrorCode {
  const key = Object.keys(HealthGoalsErrorType).find(
    (key) => HealthGoalsErrorType[key as keyof typeof HealthGoalsErrorType] === errorType
  );
  
  if (!key) {
    throw new Error(`Unknown Health Goals error type: ${errorType}`);
  }
  
  return HEALTH_GOALS_ERROR_CODES[key as keyof typeof HEALTH_GOALS_ERROR_CODES];
}

/**
 * Maps a Health Insights error type to its corresponding error code.
 * @param errorType - The Health Insights error type
 * @returns The corresponding error code
 */
export function getHealthInsightsErrorCode(errorType: HealthInsightsErrorType): HealthInsightsErrorCode {
  const key = Object.keys(HealthInsightsErrorType).find(
    (key) => HealthInsightsErrorType[key as keyof typeof HealthInsightsErrorType] === errorType
  );
  
  if (!key) {
    throw new Error(`Unknown Health Insights error type: ${errorType}`);
  }
  
  return HEALTH_INSIGHTS_ERROR_CODES[key as keyof typeof HEALTH_INSIGHTS_ERROR_CODES];
}

/**
 * Maps a Device Connection error type to its corresponding error code.
 * @param errorType - The Device Connection error type
 * @returns The corresponding error code
 */
export function getHealthDeviceErrorCode(errorType: DeviceConnectionErrorType): HealthDeviceErrorCode {
  const key = Object.keys(DeviceConnectionErrorType).find(
    (key) => DeviceConnectionErrorType[key as keyof typeof DeviceConnectionErrorType] === errorType
  );
  
  if (!key) {
    throw new Error(`Unknown Device Connection error type: ${errorType}`);
  }
  
  return HEALTH_DEVICE_ERROR_CODES[key as keyof typeof HEALTH_DEVICE_ERROR_CODES];
}

/**
 * Maps a FHIR Integration error type to its corresponding error code.
 * @param errorType - The FHIR Integration error type
 * @returns The corresponding error code
 */
export function getHealthFHIRErrorCode(errorType: FHIRIntegrationErrorType): HealthFHIRErrorCode {
  const key = Object.keys(FHIRIntegrationErrorType).find(
    (key) => FHIRIntegrationErrorType[key as keyof typeof FHIRIntegrationErrorType] === errorType
  );
  
  if (!key) {
    throw new Error(`Unknown FHIR Integration error type: ${errorType}`);
  }
  
  return HEALTH_FHIR_ERROR_CODES[key as keyof typeof HEALTH_FHIR_ERROR_CODES];
}

/**
 * Determines the appropriate ErrorType based on the Health error code.
 * @param code - The Health error code
 * @returns The corresponding ErrorType
 */
export function getErrorTypeFromHealthCode(code: HealthErrorCode): ErrorType {
  // Validation errors
  if (
    code === HEALTH_METRICS_ERROR_CODES.INVALID_METRIC_DATA ||
    code === HEALTH_METRICS_ERROR_CODES.INVALID_DATE_RANGE ||
    code === HEALTH_GOALS_ERROR_CODES.INVALID_GOAL ||
    code === HEALTH_GOALS_ERROR_CODES.INVALID_TARGET ||
    code === HEALTH_GOALS_ERROR_CODES.INVALID_DEADLINE ||
    code === HEALTH_FHIR_ERROR_CODES.RESOURCE_VALIDATION_FAILED
  ) {
    return ErrorType.VALIDATION;
  }
  
  // Business logic errors
  if (
    code === HEALTH_METRICS_ERROR_CODES.DUPLICATE_METRIC ||
    code === HEALTH_METRICS_ERROR_CODES.METRIC_NOT_FOUND ||
    code === HEALTH_METRICS_ERROR_CODES.THRESHOLD_EXCEEDED ||
    code === HEALTH_METRICS_ERROR_CODES.THRESHOLD_NOT_MET ||
    code === HEALTH_GOALS_ERROR_CODES.DUPLICATE_GOAL ||
    code === HEALTH_GOALS_ERROR_CODES.GOAL_NOT_FOUND ||
    code === HEALTH_GOALS_ERROR_CODES.MAX_GOALS_REACHED ||
    code === HEALTH_INSIGHTS_ERROR_CODES.INSUFFICIENT_DATA ||
    code === HEALTH_INSIGHTS_ERROR_CODES.INSIGHT_NOT_FOUND ||
    code === HEALTH_DEVICE_ERROR_CODES.DEVICE_NOT_FOUND ||
    code === HEALTH_DEVICE_ERROR_CODES.ALREADY_CONNECTED ||
    code === HEALTH_DEVICE_ERROR_CODES.MAX_DEVICES_REACHED ||
    code === HEALTH_FHIR_ERROR_CODES.RESOURCE_NOT_FOUND
  ) {
    return ErrorType.BUSINESS;
  }
  
  // External system errors
  if (
    code === HEALTH_DEVICE_ERROR_CODES.CONNECTION_FAILED ||
    code === HEALTH_DEVICE_ERROR_CODES.AUTHENTICATION_FAILED ||
    code === HEALTH_DEVICE_ERROR_CODES.SYNC_FAILED ||
    code === HEALTH_DEVICE_ERROR_CODES.UNEXPECTED_DISCONNECT ||
    code === HEALTH_FHIR_ERROR_CODES.CONNECTION_FAILED ||
    code === HEALTH_FHIR_ERROR_CODES.AUTHENTICATION_FAILED ||
    code === HEALTH_FHIR_ERROR_CODES.REQUEST_TIMEOUT ||
    code === HEALTH_FHIR_ERROR_CODES.SERVER_ERROR
  ) {
    return ErrorType.EXTERNAL;
  }
  
  // Technical errors (default)
  return ErrorType.TECHNICAL;
}