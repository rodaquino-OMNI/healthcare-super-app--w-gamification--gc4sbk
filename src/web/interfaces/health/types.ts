/**
 * Health Metric Type Definitions for the AUSTA SuperApp
 * 
 * This file defines the core enum types for the Health journey, providing
 * type-safe categorization of different health measurements tracked within
 * the application. These types serve as the foundation for health metric
 * tracking across both web and mobile platforms.
 *
 * @package @austa/interfaces
 */

/**
 * Types of health metrics that can be tracked in the application.
 * Used throughout the Health journey for consistent categorization of health data.
 * 
 * @enum {string}
 */
export enum HealthMetricType {
  /**
   * Heart rate measurements in beats per minute (BPM).
   * Normal resting heart rate for adults ranges from 60-100 BPM.
   */
  HEART_RATE = 'HEART_RATE',

  /**
   * Blood pressure measurements, typically recorded as systolic/diastolic in mmHg.
   * Normal blood pressure is generally considered to be below 120/80 mmHg.
   */
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',

  /**
   * Blood glucose (blood sugar) measurements, typically in mg/dL or mmol/L.
   * Normal fasting blood glucose is typically between 70-99 mg/dL (3.9-5.5 mmol/L).
   */
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',

  /**
   * Step count measurements, typically recorded as steps per day.
   * A common goal is 10,000 steps per day for active adults.
   */
  STEPS = 'STEPS',

  /**
   * Sleep duration and quality measurements, typically recorded in hours.
   * Recommended sleep for adults is 7-9 hours per night.
   */
  SLEEP = 'SLEEP',

  /**
   * Body weight measurements, typically recorded in kg or lbs.
   * Used for tracking weight management goals and BMI calculations.
   */
  WEIGHT = 'WEIGHT',
}

/**
 * Type guard to check if a string is a valid HealthMetricType
 * Provides runtime type safety for health metric categorization
 * 
 * @param value - The string value to check
 * @returns True if the value is a valid HealthMetricType
 */
export function isHealthMetricType(value: string): value is HealthMetricType {
  return Object.values(HealthMetricType).includes(value as HealthMetricType);
}

/**
 * Type representing all possible health metric type values
 * Useful for type-safe function parameters and return values
 */
export type HealthMetricTypeValue = `${HealthMetricType}`;

/**
 * Mapping of health metric types to their display names
 * Used for consistent UI presentation across the application
 */
export const HEALTH_METRIC_DISPLAY_NAMES: Record<HealthMetricType, string> = {
  [HealthMetricType.HEART_RATE]: 'Heart Rate',
  [HealthMetricType.BLOOD_PRESSURE]: 'Blood Pressure',
  [HealthMetricType.BLOOD_GLUCOSE]: 'Blood Glucose',
  [HealthMetricType.STEPS]: 'Steps',
  [HealthMetricType.SLEEP]: 'Sleep',
  [HealthMetricType.WEIGHT]: 'Weight',
};

/**
 * Mapping of health metric types to their standard units of measurement
 * Ensures consistent unit display across the application
 */
export const HEALTH_METRIC_UNITS: Record<HealthMetricType, string> = {
  [HealthMetricType.HEART_RATE]: 'bpm',
  [HealthMetricType.BLOOD_PRESSURE]: 'mmHg',
  [HealthMetricType.BLOOD_GLUCOSE]: 'mg/dL',
  [HealthMetricType.STEPS]: 'steps',
  [HealthMetricType.SLEEP]: 'hours',
  [HealthMetricType.WEIGHT]: 'kg',
};