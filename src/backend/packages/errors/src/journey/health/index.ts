/**
 * @file Health Journey Error Index
 * @description Primary barrel file for all Health journey-specific error classes.
 * This file provides a centralized export point for Metrics, Goals, Insights, Devices, and FHIR integration errors,
 * enabling consistent error handling across the Health journey.
 *
 * @module @austa/errors/journey/health
 */

// Import domain-specific error modules
import * as Metrics from './metrics-errors';
import * as Goals from './goals-errors';
import * as Insights from './insights-errors';
import * as Devices from './devices-errors';
import * as FHIR from './fhir-errors';
import * as ErrorCodes from './error-codes';

/**
 * Re-export all Health journey error codes
 */
export { ErrorCodes };

/**
 * Re-export all Health journey domain-specific error modules
 * This enables consumers to import errors in a structured way:
 * 
 * @example
 * // Import specific domain namespace
 * import { Metrics } from '@austa/errors/journey/health';
 * 
 * // Use domain-specific errors
 * throw new Metrics.InvalidMetricValueError('Heart rate value out of range', {
 *   metricType: 'HEART_RATE',
 *   value: 250,
 *   allowedRange: { min: 30, max: 220 }
 * });
 *
 * @example
 * // Import specific error class directly
 * import { Metrics } from '@austa/errors/journey/health';
 * const { InvalidMetricValueError } = Metrics;
 * 
 * // Use the error class
 * throw new InvalidMetricValueError('Heart rate value out of range', {
 *   metricType: 'HEART_RATE',
 *   value: 250,
 *   allowedRange: { min: 30, max: 220 }
 * });
 */
export {
  Metrics,
  Goals,
  Insights,
  Devices,
  FHIR
};

// Export individual error classes for direct import

// Metrics errors
export const {
  InvalidMetricValueError,
  MetricNotFoundError,
  MetricTypeNotSupportedError,
  MetricValidationError,
  MetricPersistenceError
} = Metrics;

// Goals errors
export const {
  GoalNotFoundError,
  GoalValidationError,
  GoalProgressUpdateError,
  GoalCompletionError,
  GoalPersistenceError
} = Goals;

// Insights errors
export const {
  InsightGenerationError,
  InsightNotFoundError,
  InsightDataInsufficientError,
  InsightPersistenceError
} = Insights;

// Devices errors
export const {
  DeviceConnectionError,
  DeviceNotFoundError,
  DeviceSyncError,
  DeviceAuthenticationError,
  DeviceTypeNotSupportedError,
  DevicePersistenceError
} = Devices;

// FHIR errors
export const {
  FHIRIntegrationError,
  FHIRResourceNotFoundError,
  FHIRAuthenticationError,
  FHIRResponseFormatError,
  FHIRRequestValidationError
} = FHIR;

/**
 * Health Journey Error Namespace
 * Provides a structured way to access all Health journey-specific error classes.
 * 
 * @namespace
 */
export namespace Health {
  /**
   * Error Codes
   * Contains error code constants for the Health journey.
   */
  export import ErrorCodes = ErrorCodes;
  
  /**
   * Metrics Domain Error Namespace
   * Contains all error classes specific to health metrics (heart rate, blood pressure, etc.).
   * 
   * @namespace
   */
  export import Metrics = Metrics;
  
  /**
   * Goals Domain Error Namespace
   * Contains all error classes specific to health goals (step counts, weight targets, etc.).
   * 
   * @namespace
   */
  export import Goals = Goals;
  
  /**
   * Insights Domain Error Namespace
   * Contains all error classes specific to health insights and recommendations.
   * 
   * @namespace
   */
  export import Insights = Insights;
  
  /**
   * Devices Domain Error Namespace
   * Contains all error classes specific to wearable device connections and synchronization.
   * 
   * @namespace
   */
  export import Devices = Devices;
  
  /**
   * FHIR Integration Error Namespace
   * Contains all error classes specific to FHIR API integration for medical records.
   * 
   * @namespace
   */
  export import FHIR = FHIR;
}