/**
 * Health Journey Interfaces Barrel File
 * 
 * This file serves as the central export point for all Health journey interfaces,
 * types, and validation schemas in the AUSTA SuperApp. It provides a unified entry
 * point for importing health-related TypeScript types throughout the application.
 * 
 * This barrel file maintains backward compatibility with existing code while
 * implementing the new modular folder structure, allowing for more maintainable
 * and organized code.
 *
 * @package @austa/interfaces
 */

// Re-export everything from the types module
export {
  HealthMetricType,
  isHealthMetricType,
  HealthMetricTypeValue,
  HEALTH_METRIC_DISPLAY_NAMES,
  HEALTH_METRIC_UNITS
} from './types';

// Re-export everything from the metric module
export {
  HealthMetric,
  healthMetricSchema,
  CreateHealthMetricInput,
  createHealthMetricSchema
} from './metric';

// Re-export everything from the event module
export {
  MedicalEventType,
  MedicalEvent,
  medicalEventSchema,
  ValidatedMedicalEvent
} from './event';

// Re-export everything from the goal module
export {
  HealthGoalType,
  HealthGoalStatus,
  HealthGoal,
  healthGoalSchema,
  CreateHealthGoalInput,
  createHealthGoalSchema,
  UpdateHealthGoalInput,
  updateHealthGoalSchema,
  HealthGoalAchievement
} from './goal';

// Re-export everything from the device module
export {
  DeviceType,
  ConnectionState,
  DeviceConnection,
  deviceConnectionSchema,
  ValidatedDeviceConnection
} from './device';