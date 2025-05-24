/**
 * @file Health Interfaces Index
 * @description Central barrel file that re-exports all Health journey interfaces and schemas from the AUSTA SuperApp.
 * It provides a unified entry point for importing health-related TypeScript types and validation schemas.
 */

// Re-export all types from the health module
export * from './types';
export * from './metric';
export * from './goal';
export * from './device';
export * from './event';

// For backward compatibility with existing code
import { HealthMetricType } from './types';
import { HealthMetric, healthMetricSchema } from './metric';
import { HealthGoal, healthGoalSchema } from './goal';
import { DeviceConnection, deviceConnectionSchema } from './device';
import { MedicalEvent, medicalEventSchema } from './event';

// Re-export as a namespace for backward compatibility
export const Health = {
  HealthMetricType,
  healthMetricSchema,
  healthGoalSchema,
  deviceConnectionSchema,
  medicalEventSchema,
};

// Type collection for easier imports
export type HealthTypes = {
  HealthMetric: HealthMetric;
  HealthGoal: HealthGoal;
  DeviceConnection: DeviceConnection;
  MedicalEvent: MedicalEvent;
};