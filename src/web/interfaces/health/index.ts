/**
 * Health Journey Interfaces for the AUSTA SuperApp
 * 
 * This barrel file re-exports all Health journey interfaces and schemas from the AUSTA SuperApp.
 * It provides a unified entry point for importing health-related TypeScript types and validation
 * schemas throughout the application.
 * 
 * @package @austa/interfaces
 */

// Re-export all types from the types module
export {
  HealthMetricType,
  isHealthMetricType,
  HEALTH_METRIC_UNITS,
  HEALTH_METRIC_NORMAL_RANGES,
  HealthMetricTypeValue,
} from './types';

// Re-export all metric-related types and schemas
export {
  HealthMetric,
  healthMetricSchema,
  CreateHealthMetricInput,
  createHealthMetricSchema,
  UpdateHealthMetricInput,
  updateHealthMetricSchema,
  HealthMetricQuery,
  healthMetricQuerySchema,
} from './metric';

// Re-export all medical event types and schemas
export {
  MedicalEvent,
  medicalEventSchema,
  MedicalEventValidationResult,
} from './event';

// Re-export all health goal types and schemas
export {
  HealthGoalType,
  HealthGoalStatus,
  HealthGoal,
  healthGoalSchema,
  ValidatedHealthGoal,
} from './goal';

// Re-export all device connection types and schemas
export {
  DeviceType,
  ConnectionState,
  DeviceConnection,
  deviceConnectionSchema,
  ValidatedDeviceConnection,
} from './device';