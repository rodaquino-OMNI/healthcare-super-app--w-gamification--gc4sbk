/**
 * Test fixtures for wearable device connections with different connection statuses.
 * These fixtures support testing device pairing, synchronization, and health data import functionality.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Enum representing possible connection statuses for health devices
 */
export enum DeviceConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  PAIRING = 'PAIRING',
  PAIRING_FAILED = 'PAIRING_FAILED',
  SYNCING = 'SYNCING',
  SYNC_FAILED = 'SYNC_FAILED',
  AUTHORIZED = 'AUTHORIZED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

/**
 * Enum representing device types available in the system
 */
export enum DeviceType {
  SMARTWATCH = 'Smartwatch',
  BLOOD_PRESSURE_MONITOR = 'Blood Pressure Monitor',
  GLUCOSE_MONITOR = 'Glucose Monitor',
  SMART_SCALE = 'Smart Scale',
}

/**
 * Interface for device connection test data
 */
export interface DeviceConnectionFixture {
  id: string;
  userId: string;
  deviceTypeId: string;
  deviceType: {
    id: string;
    name: DeviceType;
    description: string;
    manufacturer: string;
  };
  deviceIdentifier: string;
  deviceName: string;
  connectionStatus: DeviceConnectionStatus;
  lastSyncedAt: Date | null;
  batteryLevel: number | null;
  firmwareVersion: string | null;
  connectionSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for creating a device connection fixture
 */
export interface CreateDeviceConnectionOptions {
  userId?: string;
  deviceTypeId?: string;
  deviceType?: DeviceType;
  deviceIdentifier?: string;
  deviceName?: string;
  connectionStatus?: DeviceConnectionStatus;
  lastSyncedAt?: Date | null;
  batteryLevel?: number | null;
  firmwareVersion?: string | null;
  connectionSettings?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Factory function to create a device connection fixture with default values
 * @param options - Partial device connection data to override defaults
 * @returns A complete device connection fixture
 */
export function createDeviceConnection(options: CreateDeviceConnectionOptions = {}): DeviceConnectionFixture {
  const deviceType = options.deviceType || DeviceType.SMARTWATCH;
  const now = new Date();
  
  return {
    id: uuidv4(),
    userId: options.userId || uuidv4(),
    deviceTypeId: options.deviceTypeId || uuidv4(),
    deviceType: {
      id: options.deviceTypeId || uuidv4(),
      name: deviceType,
      description: getDeviceDescription(deviceType),
      manufacturer: 'Various',
    },
    deviceIdentifier: options.deviceIdentifier || `device-${uuidv4().substring(0, 8)}`,
    deviceName: options.deviceName || getDefaultDeviceName(deviceType),
    connectionStatus: options.connectionStatus || DeviceConnectionStatus.CONNECTED,
    lastSyncedAt: options.lastSyncedAt !== undefined ? options.lastSyncedAt : now,
    batteryLevel: options.batteryLevel !== undefined ? options.batteryLevel : 85,
    firmwareVersion: options.firmwareVersion || '1.0.0',
    connectionSettings: options.connectionSettings || getDefaultConnectionSettings(deviceType),
    createdAt: options.createdAt || new Date(now.getTime() - 86400000), // 1 day ago
    updatedAt: options.updatedAt || now,
  };
}

/**
 * Creates a connected device fixture
 * @param deviceType - Type of device to create
 * @param userId - User ID to associate with the device
 * @returns A device connection fixture in CONNECTED state
 */
export function createConnectedDevice(deviceType: DeviceType, userId: string): DeviceConnectionFixture {
  return createDeviceConnection({
    userId,
    deviceType,
    connectionStatus: DeviceConnectionStatus.CONNECTED,
    lastSyncedAt: new Date(),
    batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
  });
}

/**
 * Creates a disconnected device fixture
 * @param deviceType - Type of device to create
 * @param userId - User ID to associate with the device
 * @returns A device connection fixture in DISCONNECTED state
 */
export function createDisconnectedDevice(deviceType: DeviceType, userId: string): DeviceConnectionFixture {
  const lastSyncDate = new Date();
  lastSyncDate.setDate(lastSyncDate.getDate() - Math.floor(Math.random() * 10) - 1); // 1-10 days ago
  
  return createDeviceConnection({
    userId,
    deviceType,
    connectionStatus: DeviceConnectionStatus.DISCONNECTED,
    lastSyncedAt: lastSyncDate,
    batteryLevel: Math.floor(Math.random() * 50) + 10, // 10-60%
  });
}

/**
 * Creates a device in pairing state
 * @param deviceType - Type of device to create
 * @param userId - User ID to associate with the device
 * @returns A device connection fixture in PAIRING state
 */
export function createPairingDevice(deviceType: DeviceType, userId: string): DeviceConnectionFixture {
  return createDeviceConnection({
    userId,
    deviceType,
    connectionStatus: DeviceConnectionStatus.PAIRING,
    lastSyncedAt: null,
    batteryLevel: null,
    firmwareVersion: null,
  });
}

/**
 * Creates a device with failed pairing
 * @param deviceType - Type of device to create
 * @param userId - User ID to associate with the device
 * @returns A device connection fixture in PAIRING_FAILED state
 */
export function createPairingFailedDevice(deviceType: DeviceType, userId: string): DeviceConnectionFixture {
  return createDeviceConnection({
    userId,
    deviceType,
    connectionStatus: DeviceConnectionStatus.PAIRING_FAILED,
    lastSyncedAt: null,
    batteryLevel: null,
    firmwareVersion: null,
    connectionSettings: {
      errorCode: 'BLE_CONNECTION_TIMEOUT',
      errorMessage: 'Bluetooth connection timed out during pairing',
      attemptCount: Math.floor(Math.random() * 3) + 1, // 1-3 attempts
    },
  });
}

/**
 * Creates a device in syncing state
 * @param deviceType - Type of device to create
 * @param userId - User ID to associate with the device
 * @returns A device connection fixture in SYNCING state
 */
export function createSyncingDevice(deviceType: DeviceType, userId: string): DeviceConnectionFixture {
  const lastSyncDate = new Date();
  lastSyncDate.setHours(lastSyncDate.getHours() - Math.floor(Math.random() * 12) - 1); // 1-12 hours ago
  
  return createDeviceConnection({
    userId,
    deviceType,
    connectionStatus: DeviceConnectionStatus.SYNCING,
    lastSyncedAt: lastSyncDate,
    batteryLevel: Math.floor(Math.random() * 30) + 60, // 60-90%
  });
}

/**
 * Creates a device with sync failure
 * @param deviceType - Type of device to create
 * @param userId - User ID to associate with the device
 * @returns A device connection fixture in SYNC_FAILED state
 */
export function createSyncFailedDevice(deviceType: DeviceType, userId: string): DeviceConnectionFixture {
  const lastSyncDate = new Date();
  lastSyncDate.setDate(lastSyncDate.getDate() - Math.floor(Math.random() * 5) - 1); // 1-5 days ago
  
  return createDeviceConnection({
    userId,
    deviceType,
    connectionStatus: DeviceConnectionStatus.SYNC_FAILED,
    lastSyncedAt: lastSyncDate,
    batteryLevel: Math.floor(Math.random() * 40) + 20, // 20-60%
    connectionSettings: {
      errorCode: 'DATA_SYNC_ERROR',
      errorMessage: 'Failed to synchronize data from device',
      syncProgress: Math.floor(Math.random() * 90) + 10, // 10-99%
      failedAt: new Date(),
    },
  });
}

/**
 * Creates a device with unauthorized status
 * @param deviceType - Type of device to create
 * @param userId - User ID to associate with the device
 * @returns A device connection fixture in UNAUTHORIZED state
 */
export function createUnauthorizedDevice(deviceType: DeviceType, userId: string): DeviceConnectionFixture {
  return createDeviceConnection({
    userId,
    deviceType,
    connectionStatus: DeviceConnectionStatus.UNAUTHORIZED,
    lastSyncedAt: null,
    batteryLevel: Math.floor(Math.random() * 100),
    connectionSettings: {
      errorCode: 'AUTH_REQUIRED',
      errorMessage: 'Device requires authentication',
      authUrl: 'https://api.devicemanufacturer.com/auth',
    },
  });
}

/**
 * Test scenario with a user having multiple devices in different states
 * @param userId - User ID to associate with the devices
 * @returns An array of device connection fixtures
 */
export function createMultiDeviceScenario(userId: string): DeviceConnectionFixture[] {
  return [
    createConnectedDevice(DeviceType.SMARTWATCH, userId),
    createDisconnectedDevice(DeviceType.BLOOD_PRESSURE_MONITOR, userId),
    createSyncFailedDevice(DeviceType.GLUCOSE_MONITOR, userId),
    createPairingDevice(DeviceType.SMART_SCALE, userId),
  ];
}

/**
 * Test scenario for troubleshooting device connectivity issues
 * @param userId - User ID to associate with the devices
 * @returns An array of device connection fixtures with various error states
 */
export function createTroubleshootingScenario(userId: string): DeviceConnectionFixture[] {
  return [
    createPairingFailedDevice(DeviceType.SMARTWATCH, userId),
    createSyncFailedDevice(DeviceType.BLOOD_PRESSURE_MONITOR, userId),
    createUnauthorizedDevice(DeviceType.GLUCOSE_MONITOR, userId),
    createDisconnectedDevice(DeviceType.SMART_SCALE, userId),
  ];
}

/**
 * Test scenario for data synchronization testing
 * @param userId - User ID to associate with the devices
 * @returns An array of device connection fixtures in various sync states
 */
export function createSyncTestScenario(userId: string): DeviceConnectionFixture[] {
  return [
    createSyncingDevice(DeviceType.SMARTWATCH, userId),
    createConnectedDevice(DeviceType.BLOOD_PRESSURE_MONITOR, userId),
    createSyncFailedDevice(DeviceType.GLUCOSE_MONITOR, userId),
    createConnectedDevice(DeviceType.SMART_SCALE, userId),
  ];
}

/**
 * Helper function to get a default device name based on type
 * @param deviceType - Type of device
 * @returns A default name for the device
 */
function getDefaultDeviceName(deviceType: DeviceType): string {
  switch (deviceType) {
    case DeviceType.SMARTWATCH:
      return 'My Smartwatch';
    case DeviceType.BLOOD_PRESSURE_MONITOR:
      return 'Blood Pressure Monitor';
    case DeviceType.GLUCOSE_MONITOR:
      return 'Glucose Monitor';
    case DeviceType.SMART_SCALE:
      return 'Smart Scale';
    default:
      return 'Unknown Device';
  }
}

/**
 * Helper function to get a device description based on type
 * @param deviceType - Type of device
 * @returns A description for the device
 */
function getDeviceDescription(deviceType: DeviceType): string {
  switch (deviceType) {
    case DeviceType.SMARTWATCH:
      return 'Wearable smartwatch device';
    case DeviceType.BLOOD_PRESSURE_MONITOR:
      return 'Blood pressure monitoring device';
    case DeviceType.GLUCOSE_MONITOR:
      return 'Blood glucose monitoring device';
    case DeviceType.SMART_SCALE:
      return 'Weight and body composition scale';
    default:
      return 'Unknown device type';
  }
}

/**
 * Helper function to get default connection settings based on device type
 * @param deviceType - Type of device
 * @returns Default connection settings for the device
 */
function getDefaultConnectionSettings(deviceType: DeviceType): Record<string, any> {
  switch (deviceType) {
    case DeviceType.SMARTWATCH:
      return {
        protocol: 'BLE',
        dataFormats: ['STEPS', 'HEART_RATE', 'SLEEP'],
        syncInterval: 3600, // seconds
        notificationsEnabled: true,
      };
    case DeviceType.BLOOD_PRESSURE_MONITOR:
      return {
        protocol: 'BLE',
        dataFormats: ['SYSTOLIC', 'DIASTOLIC', 'PULSE'],
        manualSync: true,
        storeReadings: 50,
      };
    case DeviceType.GLUCOSE_MONITOR:
      return {
        protocol: 'BLE',
        dataFormats: ['GLUCOSE_LEVEL', 'TIMESTAMP'],
        continuousMonitoring: false,
        readingInterval: 0, // manual readings
      };
    case DeviceType.SMART_SCALE:
      return {
        protocol: 'BLE',
        dataFormats: ['WEIGHT', 'BMI', 'BODY_FAT', 'MUSCLE_MASS'],
        userProfiles: true,
        manualSync: true,
      };
    default:
      return {
        protocol: 'UNKNOWN',
      };
  }
}