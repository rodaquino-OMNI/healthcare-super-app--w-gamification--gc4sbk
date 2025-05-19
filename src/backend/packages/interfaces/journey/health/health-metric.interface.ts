/**
 * Enum representing different types of health metrics that can be tracked.
 */
export enum MetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  WEIGHT = 'WEIGHT',
  STEPS = 'STEPS',
  SLEEP = 'SLEEP',
  OXYGEN_SATURATION = 'OXYGEN_SATURATION',
  TEMPERATURE = 'TEMPERATURE',
  RESPIRATORY_RATE = 'RESPIRATORY_RATE',
  ACTIVITY = 'ACTIVITY',
  WATER_INTAKE = 'WATER_INTAKE',
  CALORIES = 'CALORIES'
}

/**
 * Enum representing different sources of health metric data.
 */
export enum MetricSource {
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  WEARABLE_DEVICE = 'WEARABLE_DEVICE',
  MEDICAL_DEVICE = 'MEDICAL_DEVICE',
  HEALTHCARE_PROVIDER = 'HEALTHCARE_PROVIDER',
  MOBILE_APP = 'MOBILE_APP',
  THIRD_PARTY_API = 'THIRD_PARTY_API',
  FHIR_INTEGRATION = 'FHIR_INTEGRATION'
}

/**
 * Interface representing a health metric recorded for a user.
 * This interface defines the data structure for storing and displaying key health metrics
 * with trends and gamification indicators.
 * 
 * Addresses requirement F-101-RQ-001: Defines the data structure for storing 
 * and displaying key health metrics with trends and gamification indicators.
 */
export interface IHealthMetric {
  /**
   * Unique identifier for the health metric record
   */
  id: string;

  /**
   * ID of the user this metric belongs to
   */
  userId: string;

  /**
   * Type of health metric (e.g., HEART_RATE, BLOOD_PRESSURE, etc.)
   */
  type: MetricType;

  /**
   * Numerical value of the metric
   */
  value: number;

  /**
   * Unit of measurement (e.g., 'bpm', 'mg/dL', etc.)
   */
  unit: string;

  /**
   * Timestamp when the metric was recorded
   */
  timestamp: Date;

  /**
   * Source of the metric data (e.g., MANUAL_ENTRY, WEARABLE_DEVICE, etc.)
   */
  source: MetricSource;

  /**
   * Optional additional information or comments
   */
  notes?: string;

  /**
   * Percentage change from previous measurement, if available
   */
  trend?: number;

  /**
   * Indicates if the value is outside normal/healthy range
   */
  isAbnormal: boolean;
}