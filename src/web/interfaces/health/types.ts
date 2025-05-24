/**
 * Health Metric Type Definitions for the AUSTA SuperApp
 * 
 * This file contains the core enum types for health metrics in the Health journey,
 * ensuring type safety and consistency across the application. These types are used
 * for categorizing different health measurements and are referenced by both frontend
 * and backend implementations.
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
   * Heart rate measurement in beats per minute (BPM).
   * Normal resting heart rate for adults ranges from 60-100 BPM.
   */
  HEART_RATE = 'HEART_RATE',

  /**
   * Blood pressure measurement, typically recorded as systolic/diastolic in mmHg.
   * Normal blood pressure is generally considered to be below 120/80 mmHg.
   */
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',

  /**
   * Blood glucose (blood sugar) level, measured in mg/dL or mmol/L.
   * Normal fasting blood glucose is typically between 70-99 mg/dL (3.9-5.5 mmol/L).
   */
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',

  /**
   * Daily step count, used for tracking physical activity.
   * A common goal is 10,000 steps per day, though individual targets may vary.
   */
  STEPS = 'STEPS',

  /**
   * Sleep duration and quality metrics, typically measured in hours.
   * Recommended sleep for adults is 7-9 hours per night.
   */
  SLEEP = 'SLEEP',

  /**
   * Body weight measurement, recorded in kilograms (kg) or pounds (lbs).
   * Used for tracking weight management goals and BMI calculations.
   */
  WEIGHT = 'WEIGHT',
}

// Type guard to check if a string is a valid HealthMetricType
export const isHealthMetricType = (value: string): value is HealthMetricType => {
  return Object.values(HealthMetricType).includes(value as HealthMetricType);
};

/**
 * Type-safe mapping of health metric types to their display units
 */
export const HEALTH_METRIC_UNITS: Record<HealthMetricType, string> = {
  [HealthMetricType.HEART_RATE]: 'bpm',
  [HealthMetricType.BLOOD_PRESSURE]: 'mmHg',
  [HealthMetricType.BLOOD_GLUCOSE]: 'mg/dL',
  [HealthMetricType.STEPS]: 'steps',
  [HealthMetricType.SLEEP]: 'hours',
  [HealthMetricType.WEIGHT]: 'kg',
} as const;

/**
 * Type-safe mapping of health metric types to their normal range descriptions
 */
export const HEALTH_METRIC_NORMAL_RANGES: Record<HealthMetricType, string> = {
  [HealthMetricType.HEART_RATE]: '60-100 bpm',
  [HealthMetricType.BLOOD_PRESSURE]: '< 120/80 mmHg',
  [HealthMetricType.BLOOD_GLUCOSE]: '70-99 mg/dL (fasting)',
  [HealthMetricType.STEPS]: '7,000-10,000 steps/day',
  [HealthMetricType.SLEEP]: '7-9 hours/night',
  [HealthMetricType.WEIGHT]: 'BMI 18.5-24.9',
} as const;

/**
 * Type representing all possible health metric type values
 * Useful for type-safe function parameters and returns
 */
export type HealthMetricTypeValue = `${HealthMetricType}`;