/**
 * @file Health Events Mock Data
 * @description Provides standardized mock data for Health journey events with appropriate payloads and metadata.
 * These mocks enable consistent and reliable testing of Health journey event processing, validation, and error handling.
 */

import { JourneyType, HealthEventType, MetricType, GoalType, GoalStatus, DeviceType, ConnectionStatus } from '@austa/interfaces/journey/health';

/**
 * Mock data for HEALTH_METRIC_RECORDED events
 * Used for testing health metric recording event processing
 */
export const healthMetricRecordedMocks = {
  // Heart rate metric recording
  heartRate: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: HealthEventType.METRIC_RECORDED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T14:32:17.123Z',
    data: {
      metricType: MetricType.HEART_RATE,
      value: 72,
      unit: 'bpm',
      source: 'DEVICE',
      deviceId: 'device-123456',
      notes: 'Resting heart rate',
      isAbnormal: false
    }
  },

  // Blood pressure metric recording
  bloodPressure: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    type: HealthEventType.METRIC_RECORDED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T14:35:22.456Z',
    data: {
      metricType: MetricType.BLOOD_PRESSURE,
      value: 120, // Systolic
      secondaryValue: 80, // Diastolic
      unit: 'mmHg',
      source: 'MANUAL',
      notes: 'Morning measurement',
      isAbnormal: false
    }
  },

  // Steps metric recording
  steps: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    type: HealthEventType.METRIC_RECORDED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T20:15:10.789Z',
    data: {
      metricType: MetricType.STEPS,
      value: 8547,
      unit: 'steps',
      source: 'DEVICE',
      deviceId: 'device-123456',
      notes: 'Daily step count',
      isAbnormal: false
    }
  },

  // Weight metric recording
  weight: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    type: HealthEventType.METRIC_RECORDED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T08:05:33.123Z',
    data: {
      metricType: MetricType.WEIGHT,
      value: 75.5,
      unit: 'kg',
      source: 'DEVICE',
      deviceId: 'device-789012',
      notes: 'Morning weight',
      isAbnormal: false
    }
  },

  // Blood glucose metric recording
  bloodGlucose: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    type: HealthEventType.METRIC_RECORDED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T12:30:45.678Z',
    data: {
      metricType: MetricType.BLOOD_GLUCOSE,
      value: 95,
      unit: 'mg/dL',
      source: 'MANUAL',
      notes: 'Before lunch',
      isAbnormal: false
    }
  },

  // Sleep metric recording
  sleep: {
    id: '550e8400-e29b-41d4-a716-446655440005',
    type: HealthEventType.METRIC_RECORDED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T08:00:00.000Z',
    data: {
      metricType: MetricType.SLEEP,
      value: 7.5,
      unit: 'hours',
      source: 'DEVICE',
      deviceId: 'device-123456',
      notes: 'Last night sleep duration',
      sleepQuality: 'GOOD',
      deepSleepDuration: 2.3,
      remSleepDuration: 1.8,
      lightSleepDuration: 3.4,
      isAbnormal: false
    }
  },

  // Invalid metric (for testing validation)
  invalid: {
    id: '550e8400-e29b-41d4-a716-446655440006',
    type: HealthEventType.METRIC_RECORDED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T14:32:17.123Z',
    data: {
      metricType: 'INVALID_TYPE', // Invalid metric type
      value: -10, // Invalid negative value
      unit: '', // Missing unit
      source: 'UNKNOWN', // Invalid source
      isAbnormal: true
    }
  }
};

/**
 * Mock data for HEALTH_GOAL_ACHIEVED events
 * Used for testing goal achievement event processing
 */
export const healthGoalAchievedMocks = {
  // Steps goal achievement
  stepsGoal: {
    id: '660e8400-e29b-41d4-a716-446655440000',
    type: HealthEventType.GOAL_ACHIEVED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T21:00:00.000Z',
    data: {
      goalId: '770e8400-e29b-41d4-a716-446655440000',
      goalType: GoalType.STEPS,
      title: 'Daily 10,000 Steps',
      targetValue: 10000,
      achievedValue: 10234,
      unit: 'steps',
      status: GoalStatus.COMPLETED,
      description: 'Complete 10,000 steps daily',
      daysToAchieve: 1,
      isEarlyCompletion: true
    }
  },

  // Weight loss goal achievement
  weightGoal: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    type: HealthEventType.GOAL_ACHIEVED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-30T08:15:00.000Z',
    data: {
      goalId: '770e8400-e29b-41d4-a716-446655440001',
      goalType: GoalType.WEIGHT,
      title: 'Weight Loss Goal',
      targetValue: 70,
      achievedValue: 69.8,
      unit: 'kg',
      status: GoalStatus.COMPLETED,
      description: 'Reach target weight of 70kg',
      daysToAchieve: 45,
      isEarlyCompletion: false
    }
  },

  // Sleep duration goal achievement
  sleepGoal: {
    id: '660e8400-e29b-41d4-a716-446655440002',
    type: HealthEventType.GOAL_ACHIEVED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-22T08:00:00.000Z',
    data: {
      goalId: '770e8400-e29b-41d4-a716-446655440002',
      goalType: GoalType.SLEEP,
      title: 'Healthy Sleep Schedule',
      targetValue: 8,
      achievedValue: 8.2,
      unit: 'hours',
      status: GoalStatus.COMPLETED,
      description: 'Sleep at least 8 hours per night for a week',
      daysToAchieve: 7,
      isEarlyCompletion: false
    }
  },

  // Blood pressure goal achievement
  bloodPressureGoal: {
    id: '660e8400-e29b-41d4-a716-446655440003',
    type: HealthEventType.GOAL_ACHIEVED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-05-15T14:30:00.000Z',
    data: {
      goalId: '770e8400-e29b-41d4-a716-446655440003',
      goalType: GoalType.BLOOD_PRESSURE,
      title: 'Healthy Blood Pressure',
      targetValue: 120, // Systolic target
      secondaryTargetValue: 80, // Diastolic target
      achievedValue: 118, // Achieved systolic
      secondaryAchievedValue: 78, // Achieved diastolic
      unit: 'mmHg',
      status: GoalStatus.COMPLETED,
      description: 'Maintain healthy blood pressure for 30 days',
      daysToAchieve: 30,
      isEarlyCompletion: false
    }
  },

  // Invalid goal achievement (for testing validation)
  invalid: {
    id: '660e8400-e29b-41d4-a716-446655440004',
    type: HealthEventType.GOAL_ACHIEVED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T21:00:00.000Z',
    data: {
      goalId: 'invalid-id', // Invalid UUID format
      goalType: 'INVALID_TYPE', // Invalid goal type
      title: '', // Empty title
      targetValue: -100, // Invalid negative target
      achievedValue: 0,
      unit: '',
      status: 'UNKNOWN' // Invalid status
    }
  }
};

/**
 * Mock data for HEALTH_DEVICE_SYNCED events
 * Used for testing device synchronization event processing
 */
export const deviceSyncedMocks = {
  // Smartwatch sync
  smartwatch: {
    id: '880e8400-e29b-41d4-a716-446655440000',
    type: HealthEventType.DEVICE_SYNCED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T20:30:00.000Z',
    data: {
      connectionId: '990e8400-e29b-41d4-a716-446655440000',
      deviceType: DeviceType.SMARTWATCH,
      deviceId: 'device-123456',
      status: ConnectionStatus.CONNECTED,
      syncTimestamp: '2023-04-15T20:30:00.000Z',
      metricsCount: 3,
      metricTypes: [MetricType.HEART_RATE, MetricType.STEPS, MetricType.SLEEP],
      syncDuration: 12.5,
      syncSuccessful: true
    }
  },

  // Blood pressure monitor sync
  bloodPressureMonitor: {
    id: '880e8400-e29b-41d4-a716-446655440001',
    type: HealthEventType.DEVICE_SYNCED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T14:45:00.000Z',
    data: {
      connectionId: '990e8400-e29b-41d4-a716-446655440001',
      deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
      deviceId: 'device-789012',
      status: ConnectionStatus.CONNECTED,
      syncTimestamp: '2023-04-15T14:45:00.000Z',
      metricsCount: 1,
      metricTypes: [MetricType.BLOOD_PRESSURE],
      syncDuration: 5.2,
      syncSuccessful: true
    }
  },

  // Smart scale sync
  smartScale: {
    id: '880e8400-e29b-41d4-a716-446655440002',
    type: HealthEventType.DEVICE_SYNCED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T08:10:00.000Z',
    data: {
      connectionId: '990e8400-e29b-41d4-a716-446655440002',
      deviceType: DeviceType.SMART_SCALE,
      deviceId: 'device-345678',
      status: ConnectionStatus.CONNECTED,
      syncTimestamp: '2023-04-15T08:10:00.000Z',
      metricsCount: 1,
      metricTypes: [MetricType.WEIGHT],
      syncDuration: 3.8,
      syncSuccessful: true
    }
  },

  // Glucose monitor sync
  glucoseMonitor: {
    id: '880e8400-e29b-41d4-a716-446655440003',
    type: HealthEventType.DEVICE_SYNCED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T12:35:00.000Z',
    data: {
      connectionId: '990e8400-e29b-41d4-a716-446655440003',
      deviceType: DeviceType.GLUCOSE_MONITOR,
      deviceId: 'device-901234',
      status: ConnectionStatus.CONNECTED,
      syncTimestamp: '2023-04-15T12:35:00.000Z',
      metricsCount: 1,
      metricTypes: [MetricType.BLOOD_GLUCOSE],
      syncDuration: 4.1,
      syncSuccessful: true
    }
  },

  // Failed sync (for testing error handling)
  failed: {
    id: '880e8400-e29b-41d4-a716-446655440004',
    type: HealthEventType.DEVICE_SYNCED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T18:20:00.000Z',
    data: {
      connectionId: '990e8400-e29b-41d4-a716-446655440004',
      deviceType: DeviceType.SMARTWATCH,
      deviceId: 'device-123456',
      status: ConnectionStatus.ERROR,
      syncTimestamp: '2023-04-15T18:20:00.000Z',
      metricsCount: 0,
      metricTypes: [],
      syncDuration: 30.0,
      syncSuccessful: false,
      errorMessage: 'Connection timeout after 30 seconds'
    }
  },

  // Invalid device sync (for testing validation)
  invalid: {
    id: '880e8400-e29b-41d4-a716-446655440005',
    type: HealthEventType.DEVICE_SYNCED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: JourneyType.HEALTH,
    timestamp: '2023-04-15T20:30:00.000Z',
    data: {
      connectionId: 'invalid-id', // Invalid UUID format
      deviceType: 'UNKNOWN_DEVICE', // Invalid device type
      deviceId: '',
      status: 'INVALID_STATUS', // Invalid status
      syncTimestamp: 'not-a-date', // Invalid timestamp
      metricsCount: -1, // Invalid count
      metricTypes: ['INVALID_TYPE'], // Invalid metric type
      syncDuration: -5, // Invalid duration
      syncSuccessful: null // Invalid boolean
    }
  }
};

/**
 * Combined export of all health event mocks
 */
export const healthEventMocks = {
  metricRecorded: healthMetricRecordedMocks,
  goalAchieved: healthGoalAchievedMocks,
  deviceSynced: deviceSyncedMocks
};

/**
 * Default export for easier importing
 */
export default healthEventMocks;