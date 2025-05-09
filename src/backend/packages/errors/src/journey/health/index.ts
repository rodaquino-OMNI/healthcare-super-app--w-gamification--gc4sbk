/**
 * @file Health journey-specific error classes for the AUSTA SuperApp
 * @description This file serves as the primary barrel file for all Health journey-specific errors,
 * providing a centralized export point for Metrics, Goals, Insights, Devices, and FHIR integration
 * error classes.
 * 
 * The error classes are organized by domain to ensure consistent error handling
 * across the Health journey. Each domain has its own namespace with specific error classes.
 * 
 * @example
 * // Import all Health journey errors
 * import * as HealthErrors from '@austa/errors/journey/health';
 * 
 * // Use domain-specific errors
 * throw new HealthErrors.Metrics.InvalidMetricValueError('Heart rate value out of range');
 * throw new HealthErrors.Goals.GoalNotFoundError('goal-123');
 * 
 * @example
 * // Import specific domain errors
 * import { Metrics, Devices } from '@austa/errors/journey/health';
 * 
 * // Use domain-specific errors
 * throw new Metrics.InvalidMetricValueError('Heart rate value out of range');
 * throw new Devices.DeviceConnectionError('Failed to connect to device');
 */

// Import domain-specific error modules
import * as Metrics from './metric-errors';
import * as Goals from './goal-errors';
import * as Insights from './insight-errors';
import * as Devices from './device-errors';
import * as FHIR from './fhir-errors';

// Import error codes
import * as ErrorCodes from './error-codes';

/**
 * Re-export all domain-specific error modules
 */
export {
  Metrics,
  Goals,
  Insights,
  Devices,
  FHIR,
  ErrorCodes
};

/**
 * @namespace Metrics
 * @description Metric-specific error classes for health metrics recording, validation, and analysis
 */

/**
 * @namespace Goals
 * @description Goal-specific error classes for health goals creation, tracking, and achievement
 */

/**
 * @namespace Insights
 * @description Insight-specific error classes for health insights generation, recommendation, and notification
 */

/**
 * @namespace Devices
 * @description Device-specific error classes for wearable device connection, synchronization, and data processing
 */

/**
 * @namespace FHIR
 * @description FHIR integration-specific error classes for healthcare data exchange and interoperability
 */

/**
 * @namespace ErrorCodes
 * @description Error codes used throughout the Health journey, organized by domain and error type
 */

// Also export individual error classes for direct imports
export * from './metric-errors';
export * from './goal-errors';
export * from './insight-errors';
export * from './device-errors';
export * from './fhir-errors';
export * from './error-codes';