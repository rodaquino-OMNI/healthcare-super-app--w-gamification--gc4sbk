/**
 * @file Health Types
 * @description Defines the core enum types for the Health journey in the AUSTA SuperApp.
 * This file serves as the foundation for type-safe health metric tracking across the application.
 */

/**
 * Types of health metrics that can be tracked in the application
 * 
 * @remarks
 * These types align with the My Health journey requirements and are used
 * to categorize different health measurements throughout the application.
 * 
 * @example
 * ```typescript
 * // Using the enum to specify a metric type
 * const metricType: HealthMetricType = HealthMetricType.HEART_RATE;
 * ```
 */
export enum HealthMetricType {
  /**
   * Heart rate measurements in beats per minute (BPM)
   * Typically collected from wearable devices or manual input
   */
  HEART_RATE = 'HEART_RATE',
  
  /**
   * Blood pressure measurements in mmHg (systolic/diastolic)
   * Usually stored as two separate values in the metric value field
   */
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  
  /**
   * Blood glucose measurements in mg/dL or mmol/L
   * Important for diabetes management and monitoring
   */
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  
  /**
   * Step count measurements
   * Typically collected from wearable devices or smartphone sensors
   */
  STEPS = 'STEPS',
  
  /**
   * Sleep duration and quality measurements
   * Usually includes duration in minutes and may include sleep stages
   */
  SLEEP = 'SLEEP',
  
  /**
   * Weight measurements in kg or lb
   * Can be collected from smart scales or manual input
   */
  WEIGHT = 'WEIGHT',
}

/**
 * Type guard to check if a string is a valid HealthMetricType
 * 
 * @param value - The string value to check
 * @returns True if the value is a valid HealthMetricType, false otherwise
 * 
 * @example
 * ```typescript
 * if (isHealthMetricType(metricTypeString)) {
 *   // Safe to use as HealthMetricType
 *   const typedValue: HealthMetricType = metricTypeString;
 * }
 * ```
 */
export function isHealthMetricType(value: string): value is HealthMetricType {
  return Object.values(HealthMetricType).includes(value as HealthMetricType);
}

/**
 * Gets the display name for a health metric type in Portuguese
 * 
 * @param type - The HealthMetricType to get the display name for
 * @returns The localized display name for the metric type
 * 
 * @example
 * ```typescript
 * const displayName = getHealthMetricTypeDisplayName(HealthMetricType.HEART_RATE);
 * // Returns "Frequência Cardíaca"
 * ```
 */
export function getHealthMetricTypeDisplayName(type: HealthMetricType): string {
  const displayNames: Record<HealthMetricType, string> = {
    [HealthMetricType.HEART_RATE]: 'Frequência Cardíaca',
    [HealthMetricType.BLOOD_PRESSURE]: 'Pressão Arterial',
    [HealthMetricType.BLOOD_GLUCOSE]: 'Glicemia',
    [HealthMetricType.STEPS]: 'Passos',
    [HealthMetricType.SLEEP]: 'Sono',
    [HealthMetricType.WEIGHT]: 'Peso',
  };
  
  return displayNames[type];
}

/**
 * Gets the default unit for a health metric type
 * 
 * @param type - The HealthMetricType to get the default unit for
 * @returns The default unit for the metric type
 * 
 * @example
 * ```typescript
 * const unit = getDefaultUnitForMetricType(HealthMetricType.HEART_RATE);
 * // Returns "bpm"
 * ```
 */
export function getDefaultUnitForMetricType(type: HealthMetricType): string {
  const defaultUnits: Record<HealthMetricType, string> = {
    [HealthMetricType.HEART_RATE]: 'bpm',
    [HealthMetricType.BLOOD_PRESSURE]: 'mmHg',
    [HealthMetricType.BLOOD_GLUCOSE]: 'mg/dL',
    [HealthMetricType.STEPS]: 'passos',
    [HealthMetricType.SLEEP]: 'min',
    [HealthMetricType.WEIGHT]: 'kg',
  };
  
  return defaultUnits[type];
}