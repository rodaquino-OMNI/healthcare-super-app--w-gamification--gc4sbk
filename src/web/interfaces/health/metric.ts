/**
 * Health Metric Interface
 * 
 * Defines the structure for health measurements tracked in the AUSTA SuperApp's Health Journey.
 * This interface represents individual health measurements like blood pressure, glucose levels,
 * and weight, with properties for identification, value, units, timestamps, and data source.
 */

import { z } from 'zod'; // v3.22.4
import { HealthMetricType } from './types';

/**
 * Represents a single health metric measurement in the Health Journey
 * 
 * Used for displaying and tracking health data throughout the application, including:
 * - Visualizing health trends over time
 * - Recording new measurements from manual entry or connected devices
 * - Comparing current values against health goals
 * - Triggering gamification events based on health achievements
 * 
 * @example
 * // Blood pressure reading
 * const bloodPressureReading: HealthMetric = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: '123e4567-e89b-12d3-a456-426614174001',
 *   type: HealthMetricType.BLOOD_PRESSURE,
 *   value: 120, // systolic value
 *   unit: 'mmHg',
 *   timestamp: '2023-04-15T14:30:00Z',
 *   source: 'manual'
 * };
 */
export interface HealthMetric {
  /** Unique identifier for the health metric record */
  id: string;
  
  /** User ID associated with this health metric */
  userId: string;
  
  /** Category of health measurement (e.g., HEART_RATE, BLOOD_PRESSURE) */
  type: HealthMetricType;
  
  /** Numerical value of the health measurement */
  value: number;
  
  /** Unit of measurement (e.g., 'bpm', 'mmHg', 'mg/dL') */
  unit: string;
  
  /** ISO 8601 timestamp when the measurement was taken */
  timestamp: string;
  
  /** Origin of the measurement (e.g., 'manual', 'fitbit', 'apple_health') */
  source: string;
}

/**
 * Zod schema for validating health metric data
 * 
 * Ensures data consistency and integrity for health metric visualization and processing.
 * Used for runtime validation of health metrics from API responses and form submissions.
 * 
 * @example
 * // Validate a health metric from an API response
 * try {
 *   const validatedMetric = healthMetricSchema.parse(apiResponse.data);
 *   // Process the validated metric
 * } catch (error) {
 *   // Handle validation errors
 *   console.error('Invalid health metric data:', error.errors);
 * }
 */
export const healthMetricSchema = z.object({
  id: z.string().uuid('Health metric ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  type: z.nativeEnum(HealthMetricType, {
    errorMap: () => ({ message: 'Must be a valid health metric type' })
  }),
  value: z.number({
    required_error: 'Value is required',
    invalid_type_error: 'Value must be a number'
  }),
  unit: z.string().min(1, 'Unit cannot be empty'),
  timestamp: z.string().datetime('Timestamp must be a valid ISO 8601 datetime string'),
  source: z.string().min(1, 'Source cannot be empty'),
});

/**
 * Type for health metric data without ID and userId
 * Used for creating new health metrics where the ID will be generated server-side
 */
export type CreateHealthMetricInput = Omit<HealthMetric, 'id' | 'userId'>;

/**
 * Zod schema for validating health metric creation input
 * Ensures data consistency when creating new health metrics
 */
export const createHealthMetricSchema = healthMetricSchema.omit({ 
  id: true, 
  userId: true 
});