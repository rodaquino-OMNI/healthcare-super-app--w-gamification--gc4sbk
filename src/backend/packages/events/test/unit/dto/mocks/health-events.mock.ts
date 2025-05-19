/**
 * @file health-events.mock.ts
 * 
 * This file provides standardized mock data for Health journey events (HEALTH_METRIC_RECORDED, 
 * GOAL_ACHIEVED, DEVICE_SYNCED) with appropriate payloads and metadata. Each mock object conforms 
 * to the ProcessEventDto structure with proper type, userId, journey, and data properties.
 * 
 * These mocks enable consistent and reliable testing of Health journey event processing, validation, 
 * and error handling within the event architecture.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseEventDto } from '../../../../src/dto/base-event.dto';

// Common test values
const TEST_USER_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const TEST_TIMESTAMP = new Date().toISOString();
const TEST_CORRELATION_ID = uuidv4();

/**
 * Creates a base event with common properties
 */
const createBaseEvent = <T = any>(
  type: string,
  data: T,
  options: {
    userId?: string;
    timestamp?: string;
    correlationId?: string;
    version?: string;
    source?: string;
  } = {}
): BaseEventDto => ({
  eventId: uuidv4(),
  type,
  userId: options.userId || TEST_USER_ID,
  journey: 'health',
  timestamp: options.timestamp || TEST_TIMESTAMP,
  data,
  metadata: {
    correlationId: options.correlationId || TEST_CORRELATION_ID,
    version: options.version || '1.0.0',
    source: options.source || 'health-service'
  }
});

// Health Metric Events

/**
 * Mock for a heart rate metric recording event
 */
export const HEART_RATE_RECORDED_EVENT: BaseEventDto = createBaseEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricId: uuidv4(),
    type: 'HEART_RATE',
    value: 72,
    unit: 'bpm',
    recordedAt: TEST_TIMESTAMP,
    source: 'manual',
    notes: 'Resting heart rate',
    isWithinNormalRange: true,
    normalRangeMin: 60,
    normalRangeMax: 100
  }
);

/**
 * Mock for a blood pressure metric recording event
 */
export const BLOOD_PRESSURE_RECORDED_EVENT: BaseEventDto = createBaseEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricId: uuidv4(),
    type: 'BLOOD_PRESSURE',
    value: {
      systolic: 120,
      diastolic: 80
    },
    unit: 'mmHg',
    recordedAt: TEST_TIMESTAMP,
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Blood Pressure Monitor',
    isWithinNormalRange: true,
    normalRangeMin: {
      systolic: 90,
      diastolic: 60
    },
    normalRangeMax: {
      systolic: 140,
      diastolic: 90
    }
  }
);

/**
 * Mock for a blood glucose metric recording event
 */
export const BLOOD_GLUCOSE_RECORDED_EVENT: BaseEventDto = createBaseEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricId: uuidv4(),
    type: 'BLOOD_GLUCOSE',
    value: 85,
    unit: 'mg/dL',
    recordedAt: TEST_TIMESTAMP,
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Glucose Monitor',
    measurementContext: 'fasting',
    isWithinNormalRange: true,
    normalRangeMin: 70,
    normalRangeMax: 100
  }
);

/**
 * Mock for a steps metric recording event
 */
export const STEPS_RECORDED_EVENT: BaseEventDto = createBaseEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricId: uuidv4(),
    type: 'STEPS',
    value: 8500,
    unit: 'steps',
    recordedAt: TEST_TIMESTAMP,
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Smartwatch',
    isWithinNormalRange: true,
    normalRangeMin: 5000,
    normalRangeMax: null,
    period: 'daily'
  }
);

/**
 * Mock for a weight metric recording event
 */
export const WEIGHT_RECORDED_EVENT: BaseEventDto = createBaseEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricId: uuidv4(),
    type: 'WEIGHT',
    value: 70.5,
    unit: 'kg',
    recordedAt: TEST_TIMESTAMP,
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Smart Scale',
    additionalMetrics: {
      bodyFatPercentage: 22.5,
      muscleMass: 55.2,
      waterPercentage: 60.1,
      bmi: 24.2
    }
  }
);

/**
 * Mock for a sleep metric recording event
 */
export const SLEEP_RECORDED_EVENT: BaseEventDto = createBaseEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricId: uuidv4(),
    type: 'SLEEP',
    value: 7.5,
    unit: 'hours',
    recordedAt: TEST_TIMESTAMP,
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Smartwatch',
    isWithinNormalRange: true,
    normalRangeMin: 7,
    normalRangeMax: 9,
    sleepQuality: 'good',
    sleepStages: {
      deep: 120, // minutes
      light: 240, // minutes
      rem: 90, // minutes
      awake: 10 // minutes
    },
    startTime: new Date(Date.now() - 27000000).toISOString(), // 7.5 hours ago
    endTime: TEST_TIMESTAMP
  }
);

// Health Goal Events

/**
 * Mock for a steps goal achievement event
 */
export const STEPS_GOAL_ACHIEVED_EVENT: BaseEventDto = createBaseEvent(
  'GOAL_ACHIEVED',
  {
    goalId: uuidv4(),
    type: 'STEPS',
    targetValue: 8000,
    achievedValue: 8500,
    unit: 'steps',
    achievedAt: TEST_TIMESTAMP,
    startedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    progress: 100,
    streak: 5, // days
    difficulty: 'medium',
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Smartwatch'
  }
);

/**
 * Mock for a weight goal achievement event
 */
export const WEIGHT_GOAL_ACHIEVED_EVENT: BaseEventDto = createBaseEvent(
  'GOAL_ACHIEVED',
  {
    goalId: uuidv4(),
    type: 'WEIGHT',
    targetValue: 70.0,
    achievedValue: 70.5,
    unit: 'kg',
    achievedAt: TEST_TIMESTAMP,
    startedAt: new Date(Date.now() - 7776000000).toISOString(), // 90 days ago
    initialValue: 80.0,
    progress: 100,
    difficulty: 'hard',
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Smart Scale'
  }
);

/**
 * Mock for a blood pressure goal achievement event
 */
export const BLOOD_PRESSURE_GOAL_ACHIEVED_EVENT: BaseEventDto = createBaseEvent(
  'GOAL_ACHIEVED',
  {
    goalId: uuidv4(),
    type: 'BLOOD_PRESSURE',
    targetValue: {
      systolic: 120,
      diastolic: 80
    },
    achievedValue: {
      systolic: 118,
      diastolic: 78
    },
    unit: 'mmHg',
    achievedAt: TEST_TIMESTAMP,
    startedAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
    initialValue: {
      systolic: 145,
      diastolic: 95
    },
    progress: 100,
    difficulty: 'medium',
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Blood Pressure Monitor'
  }
);

/**
 * Mock for a sleep goal achievement event
 */
export const SLEEP_GOAL_ACHIEVED_EVENT: BaseEventDto = createBaseEvent(
  'GOAL_ACHIEVED',
  {
    goalId: uuidv4(),
    type: 'SLEEP',
    targetValue: 7.0,
    achievedValue: 7.5,
    unit: 'hours',
    achievedAt: TEST_TIMESTAMP,
    startedAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    progress: 100,
    streak: 3, // days
    difficulty: 'medium',
    source: 'device',
    deviceId: uuidv4(),
    deviceType: 'Smartwatch'
  }
);

// Device Sync Events

/**
 * Mock for a smartwatch device sync event
 */
export const SMARTWATCH_SYNCED_EVENT: BaseEventDto = createBaseEvent(
  'DEVICE_SYNCED',
  {
    deviceId: uuidv4(),
    deviceType: 'Smartwatch',
    manufacturer: 'Various',
    model: 'Health Watch Pro',
    syncedAt: TEST_TIMESTAMP,
    lastSyncedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    syncDurationMs: 3500,
    batteryLevel: 75,
    firmwareVersion: '2.1.3',
    metricsCount: 5,
    metrics: [
      { type: 'HEART_RATE', count: 24 },
      { type: 'STEPS', count: 1 },
      { type: 'SLEEP', count: 1 }
    ],
    syncStatus: 'success'
  }
);

/**
 * Mock for a blood pressure monitor device sync event
 */
export const BLOOD_PRESSURE_MONITOR_SYNCED_EVENT: BaseEventDto = createBaseEvent(
  'DEVICE_SYNCED',
  {
    deviceId: uuidv4(),
    deviceType: 'Blood Pressure Monitor',
    manufacturer: 'Various',
    model: 'BP Monitor X2',
    syncedAt: TEST_TIMESTAMP,
    lastSyncedAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    syncDurationMs: 1200,
    batteryLevel: 90,
    firmwareVersion: '1.5.0',
    metricsCount: 1,
    metrics: [
      { type: 'BLOOD_PRESSURE', count: 1 }
    ],
    syncStatus: 'success'
  }
);

/**
 * Mock for a glucose monitor device sync event
 */
export const GLUCOSE_MONITOR_SYNCED_EVENT: BaseEventDto = createBaseEvent(
  'DEVICE_SYNCED',
  {
    deviceId: uuidv4(),
    deviceType: 'Glucose Monitor',
    manufacturer: 'Various',
    model: 'GlucoTrack S1',
    syncedAt: TEST_TIMESTAMP,
    lastSyncedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    syncDurationMs: 2100,
    batteryLevel: 60,
    firmwareVersion: '3.0.2',
    metricsCount: 3,
    metrics: [
      { type: 'BLOOD_GLUCOSE', count: 3 }
    ],
    syncStatus: 'success'
  }
);

/**
 * Mock for a smart scale device sync event
 */
export const SMART_SCALE_SYNCED_EVENT: BaseEventDto = createBaseEvent(
  'DEVICE_SYNCED',
  {
    deviceId: uuidv4(),
    deviceType: 'Smart Scale',
    manufacturer: 'Various',
    model: 'BodyComp Scale',
    syncedAt: TEST_TIMESTAMP,
    lastSyncedAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    syncDurationMs: 1800,
    batteryLevel: 85,
    firmwareVersion: '1.2.5',
    metricsCount: 1,
    metrics: [
      { type: 'WEIGHT', count: 1 }
    ],
    syncStatus: 'success'
  }
);

/**
 * Mock for a failed device sync event
 */
export const FAILED_DEVICE_SYNC_EVENT: BaseEventDto = createBaseEvent(
  'DEVICE_SYNC_FAILED',
  {
    deviceId: uuidv4(),
    deviceType: 'Smartwatch',
    manufacturer: 'Various',
    model: 'Health Watch Pro',
    attemptedAt: TEST_TIMESTAMP,
    lastSuccessfulSyncAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    failureReason: 'connection_lost',
    attemptCount: 3,
    batteryLevel: 15,
    errorCode: 'ERR_CONN_TIMEOUT',
    errorMessage: 'Connection timed out after 30 seconds'
  }
);

// Export collections for easier access in tests

/**
 * Collection of health metric recording events
 */
export const HEALTH_METRIC_EVENTS = {
  HEART_RATE: HEART_RATE_RECORDED_EVENT,
  BLOOD_PRESSURE: BLOOD_PRESSURE_RECORDED_EVENT,
  BLOOD_GLUCOSE: BLOOD_GLUCOSE_RECORDED_EVENT,
  STEPS: STEPS_RECORDED_EVENT,
  WEIGHT: WEIGHT_RECORDED_EVENT,
  SLEEP: SLEEP_RECORDED_EVENT
};

/**
 * Collection of goal achievement events
 */
export const GOAL_ACHIEVEMENT_EVENTS = {
  STEPS: STEPS_GOAL_ACHIEVED_EVENT,
  WEIGHT: WEIGHT_GOAL_ACHIEVED_EVENT,
  BLOOD_PRESSURE: BLOOD_PRESSURE_GOAL_ACHIEVED_EVENT,
  SLEEP: SLEEP_GOAL_ACHIEVED_EVENT
};

/**
 * Collection of device sync events
 */
export const DEVICE_SYNC_EVENTS = {
  SMARTWATCH: SMARTWATCH_SYNCED_EVENT,
  BLOOD_PRESSURE_MONITOR: BLOOD_PRESSURE_MONITOR_SYNCED_EVENT,
  GLUCOSE_MONITOR: GLUCOSE_MONITOR_SYNCED_EVENT,
  SMART_SCALE: SMART_SCALE_SYNCED_EVENT,
  FAILED: FAILED_DEVICE_SYNC_EVENT
};

/**
 * All health journey events grouped by category
 */
export const ALL_HEALTH_EVENTS = {
  HEALTH_METRIC: HEALTH_METRIC_EVENTS,
  GOAL_ACHIEVEMENT: GOAL_ACHIEVEMENT_EVENTS,
  DEVICE_SYNC: DEVICE_SYNC_EVENTS
};

/**
 * Default export for all health events
 */
export default ALL_HEALTH_EVENTS;