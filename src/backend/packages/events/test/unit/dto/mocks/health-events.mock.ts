/**
 * @file health-events.mock.ts
 * @description Provides standardized mock data for Health journey events with appropriate payloads and metadata.
 * Each mock object conforms to the ProcessEventDto structure with proper type, userId, journey, and data properties.
 * These mocks enable consistent and reliable testing of Health journey event processing, validation, and error handling.
 */

import { v4 as uuidv4 } from 'uuid';
import { HealthMetricType, HealthGoalType, DeviceType } from '../../../../src/dto/health-event.dto';

/**
 * Base interface for all event DTOs in the system
 */
export interface ProcessEventDto {
  type: string;
  userId: string;
  journey: string;
  data: any;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Mock user IDs for consistent testing
 */
export const MOCK_USER_IDS = {
  DEFAULT: '550e8400-e29b-41d4-a716-446655440000',
  PREMIUM: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  NEW_USER: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
};

/**
 * Mock health metric recorded event for heart rate
 */
export const mockHeartRateEvent: ProcessEventDto = {
  type: 'HEALTH_METRIC_RECORDED',
  userId: MOCK_USER_IDS.DEFAULT,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    metricType: HealthMetricType.HEART_RATE,
    value: 72,
    unit: 'bpm',
    recordedAt: new Date().toISOString(),
    notes: 'Resting heart rate',
    deviceId: 'device-123',
  },
  metadata: {
    source: 'mobile-app',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health metric recorded event for blood pressure
 */
export const mockBloodPressureEvent: ProcessEventDto = {
  type: 'HEALTH_METRIC_RECORDED',
  userId: MOCK_USER_IDS.DEFAULT,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    metricType: HealthMetricType.BLOOD_PRESSURE,
    value: 120, // Systolic value
    secondaryValue: 80, // Diastolic value
    unit: 'mmHg',
    recordedAt: new Date().toISOString(),
    notes: 'Morning measurement',
    deviceId: 'device-456',
  },
  metadata: {
    source: 'mobile-app',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health metric recorded event for steps
 */
export const mockStepsEvent: ProcessEventDto = {
  type: 'HEALTH_METRIC_RECORDED',
  userId: MOCK_USER_IDS.PREMIUM,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    metricType: HealthMetricType.STEPS,
    value: 8500,
    unit: 'steps',
    recordedAt: new Date().toISOString(),
    notes: 'Daily step count',
    deviceId: 'device-789',
  },
  metadata: {
    source: 'smartwatch',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health metric recorded event for weight
 */
export const mockWeightEvent: ProcessEventDto = {
  type: 'HEALTH_METRIC_RECORDED',
  userId: MOCK_USER_IDS.NEW_USER,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    metricType: HealthMetricType.WEIGHT,
    value: 70.5,
    unit: 'kg',
    recordedAt: new Date().toISOString(),
    notes: 'Morning weight',
    deviceId: 'device-101',
  },
  metadata: {
    source: 'smart-scale',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health metric recorded event for blood glucose
 */
export const mockBloodGlucoseEvent: ProcessEventDto = {
  type: 'HEALTH_METRIC_RECORDED',
  userId: MOCK_USER_IDS.DEFAULT,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    metricType: HealthMetricType.BLOOD_GLUCOSE,
    value: 95,
    unit: 'mg/dL',
    recordedAt: new Date().toISOString(),
    notes: 'Fasting blood glucose',
    deviceId: 'device-202',
  },
  metadata: {
    source: 'glucose-monitor',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health metric recorded event for sleep
 */
export const mockSleepEvent: ProcessEventDto = {
  type: 'HEALTH_METRIC_RECORDED',
  userId: MOCK_USER_IDS.PREMIUM,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    metricType: HealthMetricType.SLEEP,
    value: 7.5,
    unit: 'hours',
    recordedAt: new Date().toISOString(),
    notes: 'Last night sleep duration',
    deviceId: 'device-303',
  },
  metadata: {
    source: 'sleep-tracker',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health goal achieved event for steps target
 */
export const mockStepsGoalAchievedEvent: ProcessEventDto = {
  type: 'HEALTH_GOAL_ACHIEVED',
  userId: MOCK_USER_IDS.DEFAULT,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.STEPS_TARGET,
    description: 'Daily 10,000 steps goal',
    targetValue: 10000,
    unit: 'steps',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100,
  },
  metadata: {
    source: 'gamification-engine',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health goal achieved event for weight target
 */
export const mockWeightGoalAchievedEvent: ProcessEventDto = {
  type: 'HEALTH_GOAL_ACHIEVED',
  userId: MOCK_USER_IDS.PREMIUM,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.WEIGHT_TARGET,
    description: 'Weight loss goal of 5kg',
    targetValue: 68,
    unit: 'kg',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100,
  },
  metadata: {
    source: 'gamification-engine',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health goal achieved event for sleep duration
 */
export const mockSleepGoalAchievedEvent: ProcessEventDto = {
  type: 'HEALTH_GOAL_ACHIEVED',
  userId: MOCK_USER_IDS.NEW_USER,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.SLEEP_DURATION,
    description: 'Sleep 8 hours per night for a week',
    targetValue: 8,
    unit: 'hours',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100,
  },
  metadata: {
    source: 'gamification-engine',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock health goal achieved event for activity frequency
 */
export const mockActivityGoalAchievedEvent: ProcessEventDto = {
  type: 'HEALTH_GOAL_ACHIEVED',
  userId: MOCK_USER_IDS.DEFAULT,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.ACTIVITY_FREQUENCY,
    description: 'Exercise 3 times per week',
    targetValue: 3,
    unit: 'sessions',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100,
  },
  metadata: {
    source: 'gamification-engine',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock device synced event for fitness tracker
 */
export const mockFitnessTrackerSyncedEvent: ProcessEventDto = {
  type: 'DEVICE_SYNCHRONIZED',
  userId: MOCK_USER_IDS.DEFAULT,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    deviceId: 'device-123',
    deviceType: DeviceType.FITNESS_TRACKER,
    deviceName: 'Fitbit Charge 5',
    syncedAt: new Date().toISOString(),
    syncSuccessful: true,
    dataPointsCount: 24,
    metricTypes: [
      HealthMetricType.STEPS,
      HealthMetricType.HEART_RATE,
      HealthMetricType.SLEEP,
    ],
  },
  metadata: {
    source: 'mobile-app',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock device synced event for smartwatch
 */
export const mockSmartwatchSyncedEvent: ProcessEventDto = {
  type: 'DEVICE_SYNCHRONIZED',
  userId: MOCK_USER_IDS.PREMIUM,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    deviceId: 'device-456',
    deviceType: DeviceType.SMARTWATCH,
    deviceName: 'Apple Watch Series 7',
    syncedAt: new Date().toISOString(),
    syncSuccessful: true,
    dataPointsCount: 48,
    metricTypes: [
      HealthMetricType.STEPS,
      HealthMetricType.HEART_RATE,
      HealthMetricType.SLEEP,
      HealthMetricType.CALORIES,
    ],
  },
  metadata: {
    source: 'mobile-app',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock device synced event for blood pressure monitor
 */
export const mockBloodPressureMonitorSyncedEvent: ProcessEventDto = {
  type: 'DEVICE_SYNCHRONIZED',
  userId: MOCK_USER_IDS.NEW_USER,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    deviceId: 'device-789',
    deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
    deviceName: 'Omron X5',
    syncedAt: new Date().toISOString(),
    syncSuccessful: true,
    dataPointsCount: 5,
    metricTypes: [HealthMetricType.BLOOD_PRESSURE],
  },
  metadata: {
    source: 'mobile-app',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Mock device synced event with failure
 */
export const mockDeviceSyncFailedEvent: ProcessEventDto = {
  type: 'DEVICE_SYNCHRONIZED',
  userId: MOCK_USER_IDS.DEFAULT,
  journey: 'health',
  timestamp: new Date().toISOString(),
  data: {
    deviceId: 'device-101',
    deviceType: DeviceType.GLUCOSE_MONITOR,
    deviceName: 'Dexcom G6',
    syncedAt: new Date().toISOString(),
    syncSuccessful: false,
    errorMessage: 'Connection timeout after 30 seconds',
  },
  metadata: {
    source: 'mobile-app',
    version: '1.0.0',
    correlationId: uuidv4(),
  },
};

/**
 * Collection of all health metric events for easy access
 */
export const healthMetricEvents = {
  heartRate: mockHeartRateEvent,
  bloodPressure: mockBloodPressureEvent,
  steps: mockStepsEvent,
  weight: mockWeightEvent,
  bloodGlucose: mockBloodGlucoseEvent,
  sleep: mockSleepEvent,
};

/**
 * Collection of all health goal achieved events for easy access
 */
export const healthGoalAchievedEvents = {
  steps: mockStepsGoalAchievedEvent,
  weight: mockWeightGoalAchievedEvent,
  sleep: mockSleepGoalAchievedEvent,
  activity: mockActivityGoalAchievedEvent,
};

/**
 * Collection of all device synced events for easy access
 */
export const deviceSyncedEvents = {
  fitnessTracker: mockFitnessTrackerSyncedEvent,
  smartwatch: mockSmartwatchSyncedEvent,
  bloodPressureMonitor: mockBloodPressureMonitorSyncedEvent,
  failed: mockDeviceSyncFailedEvent,
};

/**
 * Factory function to create a custom health metric event
 * 
 * @param userId User ID for the event
 * @param metricType Type of health metric
 * @param value Metric value
 * @param unit Measurement unit
 * @returns A customized health metric event
 */
export function createHealthMetricEvent(
  userId: string,
  metricType: HealthMetricType,
  value: number,
  unit: string
): ProcessEventDto {
  return {
    type: 'HEALTH_METRIC_RECORDED',
    userId,
    journey: 'health',
    timestamp: new Date().toISOString(),
    data: {
      metricType,
      value,
      unit,
      recordedAt: new Date().toISOString(),
    },
    metadata: {
      source: 'test',
      version: '1.0.0',
      correlationId: uuidv4(),
    },
  };
}

/**
 * Factory function to create a custom health goal achieved event
 * 
 * @param userId User ID for the event
 * @param goalType Type of health goal
 * @param description Goal description
 * @param targetValue Target value for the goal
 * @param unit Measurement unit
 * @returns A customized health goal achieved event
 */
export function createHealthGoalAchievedEvent(
  userId: string,
  goalType: HealthGoalType,
  description: string,
  targetValue: number,
  unit: string
): ProcessEventDto {
  return {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId,
    journey: 'health',
    timestamp: new Date().toISOString(),
    data: {
      goalId: uuidv4(),
      goalType,
      description,
      targetValue,
      unit,
      achievedAt: new Date().toISOString(),
      progressPercentage: 100,
    },
    metadata: {
      source: 'test',
      version: '1.0.0',
      correlationId: uuidv4(),
    },
  };
}

/**
 * Factory function to create a custom device synced event
 * 
 * @param userId User ID for the event
 * @param deviceType Type of device
 * @param deviceName Name of the device
 * @param successful Whether the sync was successful
 * @param metricTypes Types of metrics synced (optional)
 * @returns A customized device synced event
 */
export function createDeviceSyncedEvent(
  userId: string,
  deviceType: DeviceType,
  deviceName: string,
  successful: boolean,
  metricTypes?: HealthMetricType[]
): ProcessEventDto {
  const baseEvent: ProcessEventDto = {
    type: 'DEVICE_SYNCHRONIZED',
    userId,
    journey: 'health',
    timestamp: new Date().toISOString(),
    data: {
      deviceId: `device-${uuidv4().substring(0, 8)}`,
      deviceType,
      deviceName,
      syncedAt: new Date().toISOString(),
      syncSuccessful: successful,
    },
    metadata: {
      source: 'test',
      version: '1.0.0',
      correlationId: uuidv4(),
    },
  };

  if (successful && metricTypes) {
    baseEvent.data.dataPointsCount = Math.floor(Math.random() * 50) + 1;
    baseEvent.data.metricTypes = metricTypes;
  } else if (!successful) {
    baseEvent.data.errorMessage = 'Sync failed during testing';
  }

  return baseEvent;
}