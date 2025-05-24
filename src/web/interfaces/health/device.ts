/**
 * Health Device Interfaces for the AUSTA SuperApp
 * 
 * This file defines TypeScript interfaces and validation schemas for health tracking devices
 * and wearables that integrate with the Health journey of the application. These interfaces
 * ensure type safety and data consistency for device connections across the platform.
 */

import { z } from 'zod'; // v3.22.4

/**
 * Types of health tracking devices supported by the application
 * Used for device integration in the Health journey
 */
export enum DeviceType {
  FITNESS_TRACKER = 'FITNESS_TRACKER',
  SMART_SCALE = 'SMART_SCALE',
  BLOOD_PRESSURE_MONITOR = 'BLOOD_PRESSURE_MONITOR',
  GLUCOSE_MONITOR = 'GLUCOSE_MONITOR',
  SLEEP_TRACKER = 'SLEEP_TRACKER',
  HEART_RATE_MONITOR = 'HEART_RATE_MONITOR',
  SMARTWATCH = 'SMARTWATCH',
  PULSE_OXIMETER = 'PULSE_OXIMETER',
}

/**
 * Connection states for health tracking devices
 * Represents the current status of a device connection
 */
export enum ConnectionState {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  PAIRING = 'PAIRING',
  SYNCING = 'SYNCING',
  ERROR = 'ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

/**
 * Represents a connection to a health tracking device
 * Used for device integration and synchronization in the Health journey
 */
export interface DeviceConnection {
  /** Unique identifier for the device connection */
  id: string;
  
  /** User ID associated with this device connection */
  userId: string;
  
  /** Type of health tracking device */
  deviceType: DeviceType;
  
  /** Unique identifier for the specific device */
  deviceId: string;
  
  /** Timestamp of the last successful data synchronization */
  lastSync: string;
  
  /** Current connection state of the device */
  status: ConnectionState;
  
  /** Optional manufacturer name of the device */
  manufacturer?: string;
  
  /** Optional model name/number of the device */
  model?: string;
  
  /** Optional firmware version of the device */
  firmwareVersion?: string;
}

/**
 * Zod schema for validating device connection data
 * Ensures data consistency and integrity for device integration
 */
export const deviceConnectionSchema = z.object({
  id: z.string().uuid({
    message: 'Device connection ID must be a valid UUID',
  }),
  userId: z.string().uuid({
    message: 'User ID must be a valid UUID',
  }),
  deviceType: z.nativeEnum(DeviceType, {
    errorMap: (issue, ctx) => ({
      message: `Invalid device type: ${ctx.data}. Must be one of the supported device types.`,
    }),
  }),
  deviceId: z.string().min(1, {
    message: 'Device ID is required and cannot be empty',
  }),
  lastSync: z.string().datetime({
    message: 'Last sync must be a valid ISO datetime string',
  }),
  status: z.nativeEnum(ConnectionState, {
    errorMap: (issue, ctx) => ({
      message: `Invalid connection state: ${ctx.data}. Must be one of the defined connection states.`,
    }),
  }),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  firmwareVersion: z.string().optional(),
});

/**
 * Type for device connection data validated by the schema
 * Provides a type-safe way to work with validated device connection data
 */
export type ValidatedDeviceConnection = z.infer<typeof deviceConnectionSchema>;