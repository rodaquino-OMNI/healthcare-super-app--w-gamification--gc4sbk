/**
 * @austa/interfaces/journey/health
 * 
 * This module provides a centralized export point for all health journey interfaces
 * and type definitions used throughout the AUSTA SuperApp. It enables consistent
 * type usage across both backend services and frontend applications.
 *
 * These interfaces support the health journey's core features including health metrics
 * tracking, goal setting, medical event recording, and device connections management.
 */

/**
 * Health Goals
 * 
 * Interfaces and enums related to user health goals, supporting the ability
 * to set, track, and manage health-related objectives.
 */

/**
 * Enumeration of possible health goal types.
 */
export enum GoalType {
  STEPS = 'steps',
  SLEEP = 'sleep',
  WATER = 'water',
  WEIGHT = 'weight',
  EXERCISE = 'exercise',
  HEART_RATE = 'heart_rate',
  BLOOD_PRESSURE = 'blood_pressure',
  BLOOD_GLUCOSE = 'blood_glucose',
  CUSTOM = 'custom'
}

/**
 * Enumeration of possible health goal statuses.
 */
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

/**
 * Enumeration of possible health goal periods.
 */
export enum GoalPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

/**
 * Interface representing a health goal set by a user.
 */
export interface IHealthGoal {
  /**
   * Unique identifier for the health goal.
   */
  id: string;

  /**
   * Reference to the health record this goal belongs to.
   */
  recordId: string;

  /**
   * Type of health goal (e.g., steps, sleep, weight).
   */
  type: GoalType;

  /**
   * Title or name of the goal.
   */
  title: string;

  /**
   * Optional description of the goal.
   */
  description?: string;

  /**
   * Target value to achieve for this goal.
   */
  targetValue: number;

  /**
   * Unit of measurement for the goal (e.g., steps, hours, kg).
   */
  unit: string;

  /**
   * Current progress value toward the goal.
   */
  currentValue: number;

  /**
   * Current status of the goal (active, completed, abandoned).
   */
  status: GoalStatus;

  /**
   * Period for the goal (daily, weekly, monthly, custom).
   */
  period: GoalPeriod;

  /**
   * Date when the goal was started or became active.
   */
  startDate: Date;

  /**
   * Optional target end date for the goal.
   */
  endDate?: Date;

  /**
   * Date when the goal was completed, if applicable.
   */
  completedDate?: Date;

  /**
   * Date when the goal was created in the system.
   */
  createdAt: Date;

  /**
   * Date when the goal was last updated.
   */
  updatedAt: Date;
}

/**
 * Health Metrics
 * 
 * Interfaces and enums related to health measurements and metrics tracking.
 */

/**
 * Enumeration of health metric types that can be tracked.
 */
export enum MetricType {
  HEART_RATE = 'heart_rate',
  BLOOD_PRESSURE = 'blood_pressure',
  BLOOD_GLUCOSE = 'blood_glucose',
  WEIGHT = 'weight',
  HEIGHT = 'height',
  STEPS = 'steps',
  SLEEP = 'sleep',
  WATER = 'water',
  CALORIES = 'calories',
  EXERCISE = 'exercise',
  OXYGEN_SATURATION = 'oxygen_saturation',
  TEMPERATURE = 'temperature',
  BMI = 'bmi',
  CUSTOM = 'custom'
}

/**
 * Enumeration of possible sources for health metric data.
 */
export enum MetricSource {
  MANUAL_ENTRY = 'manual_entry',
  WEARABLE_DEVICE = 'wearable_device',
  MEDICAL_DEVICE = 'medical_device',
  HEALTHCARE_PROVIDER = 'healthcare_provider',
  THIRD_PARTY_APP = 'third_party_app',
  SYSTEM_CALCULATED = 'system_calculated'
}

/**
 * Interface representing a health metric recorded for a user.
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
  notes?: string | null;

  /**
   * Percentage change from previous measurement, if available
   */
  trend?: number | null;

  /**
   * Indicates if the value is outside normal/healthy range
   */
  isAbnormal: boolean;
}

/**
 * Medical Events
 * 
 * Interfaces related to medical events in a user's health history.
 */

/**
 * Interface representing a medical event in a user's health history.
 */
export interface IMedicalEvent {
  /**
   * Unique identifier for the medical event.
   */
  id: string;

  /**
   * Reference to the health record this event belongs to.
   */
  recordId: string;

  /**
   * The type of medical event (e.g., 'visit', 'diagnosis', 'procedure', 'medication').
   */
  type: string;

  /**
   * Detailed description of the medical event.
   */
  description?: string;

  /**
   * Date when the medical event occurred.
   */
  date: Date;

  /**
   * Healthcare provider associated with this medical event.
   */
  provider?: string;

  /**
   * References to documents associated with this medical event (e.g., medical reports, images).
   */
  documents?: string[];

  /**
   * Timestamp when the record was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the record was last updated.
   */
  updatedAt: Date;
}

/**
 * Device Connections
 * 
 * Interfaces and enums related to wearable device connections and synchronization.
 */

/**
 * Enum representing possible device connection statuses
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PAIRING = 'pairing',
  ERROR = 'error'
}

/**
 * Enum representing supported device types
 */
export enum DeviceType {
  SMARTWATCH = 'smartwatch',
  FITNESS_TRACKER = 'fitness_tracker',
  SMART_SCALE = 'smart_scale',
  BLOOD_PRESSURE_MONITOR = 'blood_pressure_monitor',
  GLUCOSE_MONITOR = 'glucose_monitor',
  SLEEP_TRACKER = 'sleep_tracker',
  OTHER = 'other'
}

/**
 * Interface representing a connection between a user's health record and a wearable device.
 */
export interface IDeviceConnection {
  /**
   * Unique identifier for the device connection
   */
  id: string;

  /**
   * Reference to the health record this device is connected to
   */
  recordId: string;

  /**
   * Type of wearable device (e.g., smartwatch, fitness tracker)
   */
  deviceType: DeviceType;

  /**
   * Unique identifier for the device (typically provided by the device itself)
   */
  deviceId: string;

  /**
   * When the device data was last synchronized
   */
  lastSync?: Date;

  /**
   * Current connection status of the device
   */
  status: ConnectionStatus;

  /**
   * When the device connection was created
   */
  createdAt: Date;

  /**
   * When the device connection was last updated
   */
  updatedAt: Date;
}