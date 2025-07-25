/**
 * @file Device connection interfaces for the Health journey
 * @description Defines interfaces and enums for wearable device connections
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
 * Represents a connection between a user's health record and a wearable device.
 * This interface stores information about the device, its connection status, and synchronization details.
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