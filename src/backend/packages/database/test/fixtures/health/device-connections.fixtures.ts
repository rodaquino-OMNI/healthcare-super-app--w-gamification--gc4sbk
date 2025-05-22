/**
 * Test fixtures for wearable device connections in the Health journey.
 * 
 * These fixtures provide standardized test data for device pairing, synchronization,
 * and health data import functionality testing.
 */

import { DeviceConnectionStatus, DeviceType } from '@prisma/client';

/**
 * Interface for device connection test data
 */
export interface DeviceConnectionFixture {
  id?: string;
  userId: string;
  deviceTypeId: string;
  deviceIdentifier: string;
  deviceName: string;
  connectionStatus: DeviceConnectionStatus;
  lastSyncedAt?: Date | null;
  batteryLevel?: number | null;
  firmwareVersion?: string | null;
  connectionSettings?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for device type test data
 */
export interface DeviceTypeFixture {
  id?: string;
  name: string;
  description: string;
  manufacturer: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Standard device types for testing
 */
export const deviceTypes: DeviceTypeFixture[] = [
  {
    name: 'Smartwatch',
    description: 'Wearable smartwatch device',
    manufacturer: 'Various'
  },
  {
    name: 'Blood Pressure Monitor',
    description: 'Blood pressure monitoring device',
    manufacturer: 'Various'
  },
  {
    name: 'Glucose Monitor',
    description: 'Blood glucose monitoring device',
    manufacturer: 'Various'
  },
  {
    name: 'Smart Scale',
    description: 'Weight and body composition scale',
    manufacturer: 'Various'
  }
];

/**
 * Creates a device connection fixture with the specified status
 * 
 * @param userId - The user ID who owns the device connection
 * @param deviceTypeId - The device type ID
 * @param status - The connection status
 * @param overrides - Optional property overrides
 * @returns A device connection fixture
 */
export function createDeviceConnectionFixture(
  userId: string,
  deviceTypeId: string,
  status: DeviceConnectionStatus = DeviceConnectionStatus.CONNECTED,
  overrides: Partial<DeviceConnectionFixture> = {}
): DeviceConnectionFixture {
  const baseFixture: DeviceConnectionFixture = {
    userId,
    deviceTypeId,
    deviceIdentifier: `device-${Math.random().toString(36).substring(2, 10)}`,
    deviceName: `Test Device ${Math.random().toString(36).substring(2, 6)}`,
    connectionStatus: status,
    lastSyncedAt: status === DeviceConnectionStatus.CONNECTED ? new Date() : null,
    batteryLevel: status === DeviceConnectionStatus.CONNECTED ? Math.floor(Math.random() * 100) : null,
    firmwareVersion: status === DeviceConnectionStatus.CONNECTED ? '1.0.0' : null,
    connectionSettings: {}
  };

  return { ...baseFixture, ...overrides };
}

/**
 * Creates a smartwatch connection fixture
 * 
 * @param userId - The user ID who owns the device connection
 * @param deviceTypeId - The device type ID for smartwatch
 * @param status - The connection status
 * @param overrides - Optional property overrides
 * @returns A smartwatch connection fixture
 */
export function createSmartwatchFixture(
  userId: string,
  deviceTypeId: string,
  status: DeviceConnectionStatus = DeviceConnectionStatus.CONNECTED,
  overrides: Partial<DeviceConnectionFixture> = {}
): DeviceConnectionFixture {
  return createDeviceConnectionFixture(userId, deviceTypeId, status, {
    deviceName: `Smartwatch ${Math.random().toString(36).substring(2, 6)}`,
    connectionSettings: {
      trackHeartRate: true,
      trackSteps: true,
      trackSleep: true,
      syncFrequency: 'hourly'
    },
    ...overrides
  });
}

/**
 * Creates a blood pressure monitor connection fixture
 * 
 * @param userId - The user ID who owns the device connection
 * @param deviceTypeId - The device type ID for blood pressure monitor
 * @param status - The connection status
 * @param overrides - Optional property overrides
 * @returns A blood pressure monitor connection fixture
 */
export function createBloodPressureMonitorFixture(
  userId: string,
  deviceTypeId: string,
  status: DeviceConnectionStatus = DeviceConnectionStatus.CONNECTED,
  overrides: Partial<DeviceConnectionFixture> = {}
): DeviceConnectionFixture {
  return createDeviceConnectionFixture(userId, deviceTypeId, status, {
    deviceName: `BP Monitor ${Math.random().toString(36).substring(2, 6)}`,
    connectionSettings: {
      measurementProtocol: 'standard',
      storeReadings: true,
      readingFrequency: 'manual'
    },
    ...overrides
  });
}

/**
 * Creates a glucose monitor connection fixture
 * 
 * @param userId - The user ID who owns the device connection
 * @param deviceTypeId - The device type ID for glucose monitor
 * @param status - The connection status
 * @param overrides - Optional property overrides
 * @returns A glucose monitor connection fixture
 */
export function createGlucoseMonitorFixture(
  userId: string,
  deviceTypeId: string,
  status: DeviceConnectionStatus = DeviceConnectionStatus.CONNECTED,
  overrides: Partial<DeviceConnectionFixture> = {}
): DeviceConnectionFixture {
  return createDeviceConnectionFixture(userId, deviceTypeId, status, {
    deviceName: `Glucose Monitor ${Math.random().toString(36).substring(2, 6)}`,
    connectionSettings: {
      measurementUnit: 'mg/dL',
      continuousMonitoring: false,
      alertThresholds: {
        low: 70,
        high: 180
      }
    },
    ...overrides
  });
}

/**
 * Creates a smart scale connection fixture
 * 
 * @param userId - The user ID who owns the device connection
 * @param deviceTypeId - The device type ID for smart scale
 * @param status - The connection status
 * @param overrides - Optional property overrides
 * @returns A smart scale connection fixture
 */
export function createSmartScaleFixture(
  userId: string,
  deviceTypeId: string,
  status: DeviceConnectionStatus = DeviceConnectionStatus.CONNECTED,
  overrides: Partial<DeviceConnectionFixture> = {}
): DeviceConnectionFixture {
  return createDeviceConnectionFixture(userId, deviceTypeId, status, {
    deviceName: `Smart Scale ${Math.random().toString(36).substring(2, 6)}`,
    connectionSettings: {
      measurementUnit: 'kg',
      trackBodyComposition: true,
      userProfiles: ['default']
    },
    ...overrides
  });
}

/**
 * Test scenarios for device connections
 */
export const deviceConnectionScenarios = {
  /**
   * Scenario: User with multiple connected devices
   */
  userWithMultipleDevices: (userId: string, deviceTypeIds: Record<string, string>): DeviceConnectionFixture[] => [
    createSmartwatchFixture(userId, deviceTypeIds.smartwatch),
    createBloodPressureMonitorFixture(userId, deviceTypeIds.bloodPressureMonitor),
    createGlucoseMonitorFixture(userId, deviceTypeIds.glucoseMonitor),
    createSmartScaleFixture(userId, deviceTypeIds.smartScale)
  ],

  /**
   * Scenario: User with devices in different connection states
   */
  userWithMixedConnectionStates: (userId: string, deviceTypeIds: Record<string, string>): DeviceConnectionFixture[] => [
    createSmartwatchFixture(userId, deviceTypeIds.smartwatch, DeviceConnectionStatus.CONNECTED),
    createBloodPressureMonitorFixture(userId, deviceTypeIds.bloodPressureMonitor, DeviceConnectionStatus.DISCONNECTED),
    createGlucoseMonitorFixture(userId, deviceTypeIds.glucoseMonitor, DeviceConnectionStatus.PAIRING),
    createSmartScaleFixture(userId, deviceTypeIds.smartScale, DeviceConnectionStatus.ERROR)
  ],

  /**
   * Scenario: User with devices needing synchronization
   */
  userWithOutdatedDevices: (userId: string, deviceTypeIds: Record<string, string>): DeviceConnectionFixture[] => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    return [
      createSmartwatchFixture(userId, deviceTypeIds.smartwatch, DeviceConnectionStatus.CONNECTED, {
        lastSyncedAt: twoDaysAgo
      }),
      createBloodPressureMonitorFixture(userId, deviceTypeIds.bloodPressureMonitor, DeviceConnectionStatus.CONNECTED, {
        lastSyncedAt: fiveDaysAgo
      }),
      createGlucoseMonitorFixture(userId, deviceTypeIds.glucoseMonitor, DeviceConnectionStatus.CONNECTED, {
        lastSyncedAt: null
      })
    ];
  },

  /**
   * Scenario: User with devices having connectivity issues
   */
  userWithConnectivityIssues: (userId: string, deviceTypeIds: Record<string, string>): DeviceConnectionFixture[] => [
    createSmartwatchFixture(userId, deviceTypeIds.smartwatch, DeviceConnectionStatus.ERROR, {
      connectionSettings: {
        trackHeartRate: true,
        trackSteps: true,
        trackSleep: true,
        syncFrequency: 'hourly',
        errorCode: 'BLE_CONNECTION_TIMEOUT',
        errorMessage: 'Bluetooth connection timed out'
      }
    }),
    createBloodPressureMonitorFixture(userId, deviceTypeIds.bloodPressureMonitor, DeviceConnectionStatus.ERROR, {
      connectionSettings: {
        measurementProtocol: 'standard',
        storeReadings: true,
        readingFrequency: 'manual',
        errorCode: 'DEVICE_BATTERY_LOW',
        errorMessage: 'Device battery too low for reliable connection'
      }
    })
  ],

  /**
   * Scenario: User with low battery devices
   */
  userWithLowBatteryDevices: (userId: string, deviceTypeIds: Record<string, string>): DeviceConnectionFixture[] => [
    createSmartwatchFixture(userId, deviceTypeIds.smartwatch, DeviceConnectionStatus.CONNECTED, {
      batteryLevel: 15
    }),
    createGlucoseMonitorFixture(userId, deviceTypeIds.glucoseMonitor, DeviceConnectionStatus.CONNECTED, {
      batteryLevel: 8
    })
  ],

  /**
   * Scenario: User with devices needing firmware updates
   */
  userWithOutdatedFirmware: (userId: string, deviceTypeIds: Record<string, string>): DeviceConnectionFixture[] => [
    createSmartwatchFixture(userId, deviceTypeIds.smartwatch, DeviceConnectionStatus.CONNECTED, {
      firmwareVersion: '0.9.2',
      connectionSettings: {
        trackHeartRate: true,
        trackSteps: true,
        trackSleep: true,
        syncFrequency: 'hourly',
        latestFirmware: '1.2.0',
        updateAvailable: true
      }
    }),
    createSmartScaleFixture(userId, deviceTypeIds.smartScale, DeviceConnectionStatus.CONNECTED, {
      firmwareVersion: '1.5.3',
      connectionSettings: {
        measurementUnit: 'kg',
        trackBodyComposition: true,
        userProfiles: ['default'],
        latestFirmware: '2.0.1',
        updateAvailable: true
      }
    })
  ]
};