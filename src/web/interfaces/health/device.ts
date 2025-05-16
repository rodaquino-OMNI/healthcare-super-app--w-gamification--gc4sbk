/**
 * Health Device Connection Interface
 * 
 * This file defines the DeviceConnection interface and its validation schema for the AUSTA SuperApp.
 * It represents connections to health tracking devices and wearables that integrate with the application,
 * including fitness trackers, smart scales, and blood pressure monitors.
 */

import { z } from 'zod'; // v3.22.4

/**
 * Types of health tracking devices supported by the application
 * Used for device integration in the Health Journey
 */
export enum DeviceType {
  FITNESS_TRACKER = 'FITNESS_TRACKER',
  SMART_WATCH = 'SMART_WATCH',
  SMART_SCALE = 'SMART_SCALE',
  BLOOD_PRESSURE_MONITOR = 'BLOOD_PRESSURE_MONITOR',
  HEART_RATE_MONITOR = 'HEART_RATE_MONITOR',
  GLUCOSE_MONITOR = 'GLUCOSE_MONITOR',
  SLEEP_TRACKER = 'SLEEP_TRACKER',
  PULSE_OXIMETER = 'PULSE_OXIMETER',
  THERMOMETER = 'THERMOMETER',
  OTHER = 'OTHER',
}

/**
 * Connection states for health tracking devices
 * Used to track the current status of device connections
 */
export enum ConnectionState {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  PAIRING = 'PAIRING',
  SYNCING = 'SYNCING',
  ERROR = 'ERROR',
}

/**
 * Represents a connection to a health tracking device
 * Used for device integration and synchronization in the Health Journey
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
});

/**
 * Type for validated device connection data
 * Represents a device connection that has passed validation
 */
export type ValidatedDeviceConnection = z.infer<typeof deviceConnectionSchema>;