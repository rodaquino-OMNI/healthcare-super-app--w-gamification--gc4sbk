/**
 * @file Journey Error Index
 * @description Primary barrel file for all journey-specific errors in the AUSTA SuperApp.
 * This file provides a centralized export point for Health, Care, and Plan journey error classes,
 * enabling consistent error handling across the application.
 *
 * @module @austa/errors/journey
 */

// Import journey-specific error modules
import * as Health from './health';
import * as Care from './care';
import * as Plan from './plan';

/**
 * Re-export all journey-specific error modules
 * This enables consumers to import errors in a structured way:
 * 
 * @example
 * // Import specific journey namespace
 * import { Health } from '@austa/errors/journey';
 * 
 * // Use journey-specific errors
 * throw new Health.Metrics.InvalidMetricValueError('Heart rate value out of range', {
 *   metricType: 'HEART_RATE',
 *   value: 250,
 *   allowedRange: { min: 30, max: 220 }
 * });
 *
 * @example
 * // Import specific error class directly
 * import { Health } from '@austa/errors/journey';
 * const { InvalidMetricValueError } = Health.Metrics;
 * 
 * // Use the error class
 * throw new InvalidMetricValueError('Heart rate value out of range', {
 *   metricType: 'HEART_RATE',
 *   value: 250,
 *   allowedRange: { min: 30, max: 220 }
 * });
 */
export {
  Health,
  Care,
  Plan
};

/**
 * Journey Error Namespace
 * Provides a structured way to access all journey-specific error classes.
 * 
 * @namespace
 */
export namespace Journey {
  /**
   * Health Journey Error Namespace
   * Contains all error classes specific to the Health journey.
   * 
   * @namespace
   */
  export import Health = Health;
  
  /**
   * Care Journey Error Namespace
   * Contains all error classes specific to the Care journey.
   * 
   * @namespace
   */
  export import Care = Care;
  
  /**
   * Plan Journey Error Namespace
   * Contains all error classes specific to the Plan journey.
   * 
   * @namespace
   */
  export import Plan = Plan;
}