/**
 * @file health-events.fixtures.ts
 * @description Test fixtures for Health journey events, including health metrics recording,
 * goal achievements, health insights, and device synchronization. These fixtures provide
 * realistic mock data for testing health-specific event validation, processing, and
 * transformation logic in the events package.
 */

import { BaseEvent, createEvent } from '../../../src/interfaces/base-event.interface';
import {
  HealthEventType,
  IHealthMetricRecordedPayload,
  IHealthGoalCreatedPayload,
  IHealthGoalUpdatedPayload,
  IHealthGoalAchievedPayload,
  IHealthDeviceConnectedPayload,
  IHealthDeviceSyncedPayload,
  IHealthMedicalRecordAddedPayload,
  IHealthCheckCompletedPayload,
  IHealthInsightGeneratedPayload,
  JourneyType
} from '../../../src/interfaces/journey-events.interface';

// Constants for generating realistic test data
const USER_IDS = ['user_123456', 'user_789012', 'user_345678'];
const SOURCE = 'health-service';
const VERSION = '1.0.0';

/**
 * Enum for health metric types used in test fixtures
 */
enum MetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  WEIGHT = 'WEIGHT',
  SLEEP = 'SLEEP'
}

/**
 * Enum for health goal types used in test fixtures
 */
enum GoalType {
  STEPS = 'STEPS',
  WEIGHT = 'WEIGHT',
  SLEEP = 'SLEEP',
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE'
}

/**
 * Enum for health goal status used in test fixtures
 */
enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED'
}

/**
 * Enum for device types used in test fixtures
 */
enum DeviceType {
  SMARTWATCH = 'Smartwatch',
  BLOOD_PRESSURE_MONITOR = 'Blood Pressure Monitor',
  GLUCOSE_MONITOR = 'Glucose Monitor',
  SMART_SCALE = 'Smart Scale'
}

// ===== HEALTH METRIC RECORDED EVENT FIXTURES =====

/**
 * Creates a health metric recorded event fixture for heart rate
 * @param userId Optional user ID
 * @returns BaseEvent with heart rate metric payload
 */
export const createHeartRateRecordedEvent = (userId = USER_IDS[0]): BaseEvent<IHealthMetricRecordedPayload> => {
  return createEvent<IHealthMetricRecordedPayload>(
    HealthEventType.METRIC_RECORDED,
    SOURCE,
    {
      metric: {
        id: 'metric_123456',
        userId,
        type: MetricType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'Smartwatch'
      },
      metricType: MetricType.HEART_RATE,
      value: 72,
      unit: 'bpm',
      timestamp: new Date().toISOString(),
      source: 'Smartwatch',
      previousValue: 75,
      change: -3,
      isImprovement: true
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        deviceId: 'device_123456'
      }
    }
  );
};

/**
 * Creates a health metric recorded event fixture for blood pressure
 * @param userId Optional user ID
 * @returns BaseEvent with blood pressure metric payload
 */
export const createBloodPressureRecordedEvent = (userId = USER_IDS[0]): BaseEvent<IHealthMetricRecordedPayload> => {
  return createEvent<IHealthMetricRecordedPayload>(
    HealthEventType.METRIC_RECORDED,
    SOURCE,
    {
      metric: {
        id: 'metric_234567',
        userId,
        type: MetricType.BLOOD_PRESSURE,
        value: 120, // Systolic value
        secondaryValue: 80, // Diastolic value
        unit: 'mmHg',
        timestamp: new Date().toISOString(),
        source: 'Blood Pressure Monitor'
      },
      metricType: MetricType.BLOOD_PRESSURE,
      value: 120, // Systolic value
      secondaryValue: 80, // Diastolic value
      unit: 'mmHg',
      timestamp: new Date().toISOString(),
      source: 'Blood Pressure Monitor',
      previousValue: 125,
      previousSecondaryValue: 85,
      change: -5,
      isImprovement: true
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        deviceId: 'device_234567'
      }
    }
  );
};

/**
 * Creates a health metric recorded event fixture for blood glucose
 * @param userId Optional user ID
 * @returns BaseEvent with blood glucose metric payload
 */
export const createBloodGlucoseRecordedEvent = (userId = USER_IDS[0]): BaseEvent<IHealthMetricRecordedPayload> => {
  return createEvent<IHealthMetricRecordedPayload>(
    HealthEventType.METRIC_RECORDED,
    SOURCE,
    {
      metric: {
        id: 'metric_345678',
        userId,
        type: MetricType.BLOOD_GLUCOSE,
        value: 95,
        unit: 'mg/dL',
        timestamp: new Date().toISOString(),
        source: 'Glucose Monitor'
      },
      metricType: MetricType.BLOOD_GLUCOSE,
      value: 95,
      unit: 'mg/dL',
      timestamp: new Date().toISOString(),
      source: 'Glucose Monitor',
      previousValue: 105,
      change: -10,
      isImprovement: true
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        deviceId: 'device_345678',
        mealContext: 'fasting' // Additional context specific to glucose readings
      }
    }
  );
};

/**
 * Creates a health metric recorded event fixture for steps
 * @param userId Optional user ID
 * @returns BaseEvent with steps metric payload
 */
export const createStepsRecordedEvent = (userId = USER_IDS[0]): BaseEvent<IHealthMetricRecordedPayload> => {
  return createEvent<IHealthMetricRecordedPayload>(
    HealthEventType.METRIC_RECORDED,
    SOURCE,
    {
      metric: {
        id: 'metric_456789',
        userId,
        type: MetricType.STEPS,
        value: 8547,
        unit: 'steps',
        timestamp: new Date().toISOString(),
        source: 'Smartwatch'
      },
      metricType: MetricType.STEPS,
      value: 8547,
      unit: 'steps',
      timestamp: new Date().toISOString(),
      source: 'Smartwatch',
      previousValue: 7823,
      change: 724,
      isImprovement: true
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        deviceId: 'device_123456',
        activityContext: 'daily' // Additional context for steps
      }
    }
  );
};

/**
 * Creates a health metric recorded event fixture for weight
 * @param userId Optional user ID
 * @returns BaseEvent with weight metric payload
 */
export const createWeightRecordedEvent = (userId = USER_IDS[0]): BaseEvent<IHealthMetricRecordedPayload> => {
  return createEvent<IHealthMetricRecordedPayload>(
    HealthEventType.METRIC_RECORDED,
    SOURCE,
    {
      metric: {
        id: 'metric_567890',
        userId,
        type: MetricType.WEIGHT,
        value: 75.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
        source: 'Smart Scale'
      },
      metricType: MetricType.WEIGHT,
      value: 75.5,
      unit: 'kg',
      timestamp: new Date().toISOString(),
      source: 'Smart Scale',
      previousValue: 76.2,
      change: -0.7,
      isImprovement: true
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        deviceId: 'device_567890',
        bodyComposition: {
          bodyFat: 22.5,
          muscleMass: 45.3,
          waterPercentage: 55.2
        }
      }
    }
  );
};

/**
 * Creates a health metric recorded event fixture for sleep
 * @param userId Optional user ID
 * @returns BaseEvent with sleep metric payload
 */
export const createSleepRecordedEvent = (userId = USER_IDS[0]): BaseEvent<IHealthMetricRecordedPayload> => {
  return createEvent<IHealthMetricRecordedPayload>(
    HealthEventType.METRIC_RECORDED,
    SOURCE,
    {
      metric: {
        id: 'metric_678901',
        userId,
        type: MetricType.SLEEP,
        value: 7.5,
        unit: 'hours',
        timestamp: new Date().toISOString(),
        source: 'Smartwatch'
      },
      metricType: MetricType.SLEEP,
      value: 7.5,
      unit: 'hours',
      timestamp: new Date().toISOString(),
      source: 'Smartwatch',
      previousValue: 6.8,
      change: 0.7,
      isImprovement: true
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        deviceId: 'device_123456',
        sleepQuality: {
          deepSleep: 2.3,
          lightSleep: 4.1,
          remSleep: 1.1,
          awake: 0.2
        }
      }
    }
  );
};

// Collection of all health metric recorded events
export const healthMetricRecordedEvents = [
  createHeartRateRecordedEvent(),
  createBloodPressureRecordedEvent(),
  createBloodGlucoseRecordedEvent(),
  createStepsRecordedEvent(),
  createWeightRecordedEvent(),
  createSleepRecordedEvent()
];

// ===== HEALTH GOAL EVENTS FIXTURES =====

/**
 * Creates a health goal created event fixture
 * @param goalType Type of health goal
 * @param userId Optional user ID
 * @returns BaseEvent with goal created payload
 */
export const createHealthGoalCreatedEvent = (
  goalType = GoalType.STEPS,
  userId = USER_IDS[0]
): BaseEvent<IHealthGoalCreatedPayload> => {
  const goalData = {
    [GoalType.STEPS]: { targetValue: 10000, unit: 'steps' },
    [GoalType.WEIGHT]: { targetValue: 70, unit: 'kg' },
    [GoalType.SLEEP]: { targetValue: 8, unit: 'hours' },
    [GoalType.HEART_RATE]: { targetValue: 65, unit: 'bpm' },
    [GoalType.BLOOD_PRESSURE]: { targetValue: 120, secondaryTargetValue: 80, unit: 'mmHg' },
    [GoalType.BLOOD_GLUCOSE]: { targetValue: 90, unit: 'mg/dL' }
  }[goalType];

  return createEvent<IHealthGoalCreatedPayload>(
    HealthEventType.GOAL_CREATED,
    SOURCE,
    {
      goal: {
        id: `goal_${Date.now()}`,
        userId,
        type: goalType,
        targetValue: goalData.targetValue,
        secondaryTargetValue: goalData.secondaryTargetValue,
        unit: goalData.unit,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: GoalStatus.ACTIVE,
        progress: 0
      },
      goalType: goalType,
      targetValue: goalData.targetValue,
      unit: goalData.unit,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        isRecurring: false,
        difficulty: 'medium'
      }
    }
  );
};

/**
 * Creates a health goal updated event fixture
 * @param goalType Type of health goal
 * @param progress Current progress percentage (0-100)
 * @param userId Optional user ID
 * @returns BaseEvent with goal updated payload
 */
export const createHealthGoalUpdatedEvent = (
  goalType = GoalType.STEPS,
  progress = 50,
  userId = USER_IDS[0]
): BaseEvent<IHealthGoalUpdatedPayload> => {
  const goalData = {
    [GoalType.STEPS]: { targetValue: 10000, currentValue: 5000, unit: 'steps' },
    [GoalType.WEIGHT]: { targetValue: 70, currentValue: 72.5, unit: 'kg' },
    [GoalType.SLEEP]: { targetValue: 8, currentValue: 7.2, unit: 'hours' },
    [GoalType.HEART_RATE]: { targetValue: 65, currentValue: 68, unit: 'bpm' },
    [GoalType.BLOOD_PRESSURE]: { targetValue: 120, currentValue: 125, unit: 'mmHg' },
    [GoalType.BLOOD_GLUCOSE]: { targetValue: 90, currentValue: 95, unit: 'mg/dL' }
  }[goalType];

  // Adjust current value based on progress
  const currentValue = goalType === GoalType.WEIGHT
    ? goalData.targetValue + ((goalData.currentValue - goalData.targetValue) * (1 - progress / 100))
    : goalData.targetValue * (progress / 100);

  return createEvent<IHealthGoalUpdatedPayload>(
    HealthEventType.GOAL_UPDATED,
    SOURCE,
    {
      goal: {
        id: `goal_${Date.now() - 1000000}`, // Created some time ago
        userId,
        type: goalType,
        targetValue: goalData.targetValue,
        unit: goalData.unit,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        status: progress >= 100 ? GoalStatus.COMPLETED : GoalStatus.ACTIVE,
        progress: progress
      },
      previousStatus: GoalStatus.ACTIVE,
      newStatus: progress >= 100 ? GoalStatus.COMPLETED : GoalStatus.ACTIVE,
      progress: progress,
      currentValue: currentValue,
      targetValue: goalData.targetValue
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    }
  );
};

/**
 * Creates a health goal achieved event fixture
 * @param goalType Type of health goal
 * @param userId Optional user ID
 * @returns BaseEvent with goal achieved payload
 */
export const createHealthGoalAchievedEvent = (
  goalType = GoalType.STEPS,
  userId = USER_IDS[0]
): BaseEvent<IHealthGoalAchievedPayload> => {
  const goalData = {
    [GoalType.STEPS]: { targetValue: 10000, achievedValue: 10250, unit: 'steps' },
    [GoalType.WEIGHT]: { targetValue: 70, achievedValue: 70, unit: 'kg' },
    [GoalType.SLEEP]: { targetValue: 8, achievedValue: 8.2, unit: 'hours' },
    [GoalType.HEART_RATE]: { targetValue: 65, achievedValue: 65, unit: 'bpm' },
    [GoalType.BLOOD_PRESSURE]: { targetValue: 120, achievedValue: 118, unit: 'mmHg' },
    [GoalType.BLOOD_GLUCOSE]: { targetValue: 90, achievedValue: 90, unit: 'mg/dL' }
  }[goalType];

  return createEvent<IHealthGoalAchievedPayload>(
    HealthEventType.GOAL_ACHIEVED,
    SOURCE,
    {
      goal: {
        id: `goal_${Date.now() - 2000000}`, // Created some time ago
        userId,
        type: goalType,
        targetValue: goalData.targetValue,
        unit: goalData.unit,
        startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        status: GoalStatus.COMPLETED,
        progress: 100
      },
      goalType: goalType,
      achievedValue: goalData.achievedValue,
      targetValue: goalData.targetValue,
      daysToAchieve: 25, // Took 25 days to achieve
      isEarlyCompletion: true // Completed before end date
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        achievementStreak: 3, // Third goal achieved in a row
        difficulty: 'medium'
      }
    }
  );
};

// Collection of health goal events
export const healthGoalEvents = [
  createHealthGoalCreatedEvent(GoalType.STEPS),
  createHealthGoalCreatedEvent(GoalType.WEIGHT),
  createHealthGoalCreatedEvent(GoalType.SLEEP),
  createHealthGoalUpdatedEvent(GoalType.STEPS, 50),
  createHealthGoalUpdatedEvent(GoalType.WEIGHT, 75),
  createHealthGoalUpdatedEvent(GoalType.SLEEP, 90),
  createHealthGoalAchievedEvent(GoalType.STEPS),
  createHealthGoalAchievedEvent(GoalType.WEIGHT),
  createHealthGoalAchievedEvent(GoalType.SLEEP)
];

// ===== DEVICE CONNECTION EVENTS FIXTURES =====

/**
 * Creates a health device connected event fixture
 * @param deviceType Type of device
 * @param userId Optional user ID
 * @returns BaseEvent with device connected payload
 */
export const createHealthDeviceConnectedEvent = (
  deviceType = DeviceType.SMARTWATCH,
  userId = USER_IDS[0]
): BaseEvent<IHealthDeviceConnectedPayload> => {
  const deviceId = `device_${Date.now()}`;
  
  return createEvent<IHealthDeviceConnectedPayload>(
    HealthEventType.DEVICE_CONNECTED,
    SOURCE,
    {
      deviceConnection: {
        id: `connection_${Date.now()}`,
        userId,
        deviceId,
        deviceType,
        connectionDate: new Date().toISOString(),
        lastSyncDate: new Date().toISOString(),
        status: 'connected',
        permissions: ['read_metrics', 'write_metrics']
      },
      deviceId,
      deviceType,
      connectionDate: new Date().toISOString(),
      isFirstConnection: true
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        deviceModel: deviceType === DeviceType.SMARTWATCH ? 'Garmin Forerunner 945' :
                     deviceType === DeviceType.BLOOD_PRESSURE_MONITOR ? 'Omron X5' :
                     deviceType === DeviceType.GLUCOSE_MONITOR ? 'Dexcom G6' :
                     'Withings Body+',
        connectionMethod: 'bluetooth'
      }
    }
  );
};

/**
 * Creates a health device synced event fixture
 * @param deviceType Type of device
 * @param successful Whether the sync was successful
 * @param userId Optional user ID
 * @returns BaseEvent with device synced payload
 */
export const createHealthDeviceSyncedEvent = (
  deviceType = DeviceType.SMARTWATCH,
  successful = true,
  userId = USER_IDS[0]
): BaseEvent<IHealthDeviceSyncedPayload> => {
  const deviceId = `device_${Date.now() - 1000000}`; // Device connected some time ago
  
  // Define metrics based on device type
  const metricTypes = {
    [DeviceType.SMARTWATCH]: [MetricType.HEART_RATE, MetricType.STEPS, MetricType.SLEEP],
    [DeviceType.BLOOD_PRESSURE_MONITOR]: [MetricType.BLOOD_PRESSURE],
    [DeviceType.GLUCOSE_MONITOR]: [MetricType.BLOOD_GLUCOSE],
    [DeviceType.SMART_SCALE]: [MetricType.WEIGHT]
  }[deviceType];
  
  return createEvent<IHealthDeviceSyncedPayload>(
    HealthEventType.DEVICE_SYNCED,
    SOURCE,
    {
      deviceConnection: {
        id: `connection_${Date.now() - 1000000}`,
        userId,
        deviceId,
        deviceType,
        connectionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Connected 7 days ago
        lastSyncDate: new Date().toISOString(),
        status: 'connected',
        permissions: ['read_metrics', 'write_metrics']
      },
      deviceId,
      deviceType,
      syncDate: new Date().toISOString(),
      metricsCount: successful ? deviceType === DeviceType.SMARTWATCH ? 24 : 1 : 0,
      metricTypes,
      syncSuccessful: successful,
      errorMessage: successful ? undefined : 'Connection timeout'
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        deviceModel: deviceType === DeviceType.SMARTWATCH ? 'Garmin Forerunner 945' :
                     deviceType === DeviceType.BLOOD_PRESSURE_MONITOR ? 'Omron X5' :
                     deviceType === DeviceType.GLUCOSE_MONITOR ? 'Dexcom G6' :
                     'Withings Body+',
        batteryLevel: successful ? 75 : 5, // Low battery might be reason for failure
        syncDuration: successful ? 12.5 : 30.0 // Seconds
      }
    }
  );
};

// Collection of device connection events
export const healthDeviceEvents = [
  createHealthDeviceConnectedEvent(DeviceType.SMARTWATCH),
  createHealthDeviceConnectedEvent(DeviceType.BLOOD_PRESSURE_MONITOR),
  createHealthDeviceConnectedEvent(DeviceType.GLUCOSE_MONITOR),
  createHealthDeviceConnectedEvent(DeviceType.SMART_SCALE),
  createHealthDeviceSyncedEvent(DeviceType.SMARTWATCH, true),
  createHealthDeviceSyncedEvent(DeviceType.BLOOD_PRESSURE_MONITOR, true),
  createHealthDeviceSyncedEvent(DeviceType.GLUCOSE_MONITOR, true),
  createHealthDeviceSyncedEvent(DeviceType.SMART_SCALE, true),
  createHealthDeviceSyncedEvent(DeviceType.SMARTWATCH, false) // Failed sync
];

// ===== HEALTH INSIGHT EVENTS FIXTURES =====

/**
 * Creates a health insight generated event fixture
 * @param insightType Type of health insight
 * @param severity Severity level of the insight
 * @param userId Optional user ID
 * @returns BaseEvent with health insight payload
 */
export const createHealthInsightGeneratedEvent = (
  insightType = 'TREND_ANALYSIS',
  severity: 'low' | 'medium' | 'high' = 'medium',
  userId = USER_IDS[0]
): BaseEvent<IHealthInsightGeneratedPayload> => {
  // Define insight data based on type
  const insightData = {
    'TREND_ANALYSIS': {
      description: 'Your heart rate has been trending higher than normal',
      explanation: 'Over the past 2 weeks, your resting heart rate has increased by 8 bpm on average.',
      recommendations: ['Consider reducing caffeine intake', 'Increase daily physical activity', 'Practice relaxation techniques'],
      relatedMetrics: [MetricType.HEART_RATE]
    },
    'CORRELATION': {
      description: 'Sleep duration appears to affect your next-day step count',
      explanation: 'Analysis shows that when you sleep less than 7 hours, your step count the following day is 20% lower on average.',
      recommendations: ['Aim for 7-8 hours of sleep consistently', 'Establish a regular sleep schedule'],
      relatedMetrics: [MetricType.SLEEP, MetricType.STEPS]
    },
    'ANOMALY_DETECTION': {
      description: 'Unusual blood pressure reading detected',
      explanation: 'Your latest blood pressure reading of 145/95 mmHg is significantly higher than your 3-month average of 125/82 mmHg.',
      recommendations: ['Retake your blood pressure after resting for 5 minutes', 'Consult with your healthcare provider if readings remain elevated'],
      relatedMetrics: [MetricType.BLOOD_PRESSURE]
    },
    'GOAL_RECOMMENDATION': {
      description: 'New step goal recommendation based on your activity',
      explanation: 'Based on your consistent achievement of your current step goal, we recommend increasing your daily target.',
      recommendations: ['Consider increasing your daily step goal to 12,000 steps', 'Try to add a 15-minute walk during your lunch break'],
      relatedMetrics: [MetricType.STEPS]
    },
    'HEALTH_RISK': {
      description: 'Potential blood glucose management issue detected',
      explanation: 'Your blood glucose readings have shown increased variability over the past week, with 3 readings above your target range.',
      recommendations: ['Monitor your carbohydrate intake more closely', 'Check your blood glucose more frequently', 'Consult with your healthcare provider'],
      relatedMetrics: [MetricType.BLOOD_GLUCOSE]
    }
  }[insightType];

  return createEvent<IHealthInsightGeneratedPayload>(
    HealthEventType.INSIGHT_GENERATED,
    SOURCE,
    {
      insightId: `insight_${Date.now()}`,
      insightType,
      generationDate: new Date().toISOString(),
      relatedMetrics: insightData.relatedMetrics,
      severity,
      description: insightData.description,
      explanation: insightData.explanation,
      recommendations: insightData.recommendations
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        analysisTimeframe: '14d', // 14 days of data analyzed
        confidenceScore: severity === 'high' ? 0.92 : severity === 'medium' ? 0.78 : 0.65,
        dataPointsAnalyzed: 142
      }
    }
  );
};

/**
 * Creates a health check completed event fixture
 * @param score Health score (0-100)
 * @param userId Optional user ID
 * @returns BaseEvent with health check completed payload
 */
export const createHealthCheckCompletedEvent = (
  score = 85,
  userId = USER_IDS[0]
): BaseEvent<IHealthCheckCompletedPayload> => {
  // Generate recommendations based on score
  const recommendations = [];
  if (score < 90) recommendations.push('Increase daily physical activity');
  if (score < 80) recommendations.push('Improve sleep habits');
  if (score < 70) recommendations.push('Consider dietary improvements');
  if (score < 60) recommendations.push('Schedule a check-up with your healthcare provider');
  
  return createEvent<IHealthCheckCompletedPayload>(
    HealthEventType.HEALTH_CHECK_COMPLETED,
    SOURCE,
    {
      checkId: `check_${Date.now()}`,
      completionDate: new Date().toISOString(),
      score,
      recommendations: recommendations.length > 0 ? recommendations : ['Maintain your current healthy habits']
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        checkType: 'comprehensive',
        timeToComplete: 240, // Seconds
        questionsAnswered: 25
      }
    }
  );
};

/**
 * Creates a medical record added event fixture
 * @param recordType Type of medical record
 * @param userId Optional user ID
 * @returns BaseEvent with medical record added payload
 */
export const createMedicalRecordAddedEvent = (
  recordType = 'MEDICATION',
  userId = USER_IDS[0]
): BaseEvent<IHealthMedicalRecordAddedPayload> => {
  return createEvent<IHealthMedicalRecordAddedPayload>(
    HealthEventType.MEDICAL_RECORD_ADDED,
    SOURCE,
    {
      medicalRecord: {
        id: `record_${Date.now()}`,
        userId,
        type: recordType,
        date: new Date().toISOString(),
        provider: 'Dr. Smith',
        notes: 'Regular check-up, all vitals normal',
        attachments: []
      },
      recordId: `record_${Date.now()}`,
      recordType,
      recordDate: new Date().toISOString(),
      provider: 'Dr. Smith'
    },
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`,
        source: 'manual_entry',
        hasAttachments: false
      }
    }
  );
};

// Collection of health insight events
export const healthInsightEvents = [
  createHealthInsightGeneratedEvent('TREND_ANALYSIS', 'medium'),
  createHealthInsightGeneratedEvent('CORRELATION', 'low'),
  createHealthInsightGeneratedEvent('ANOMALY_DETECTION', 'high'),
  createHealthInsightGeneratedEvent('GOAL_RECOMMENDATION', 'low'),
  createHealthInsightGeneratedEvent('HEALTH_RISK', 'high'),
  createHealthCheckCompletedEvent(85),
  createHealthCheckCompletedEvent(65),
  createMedicalRecordAddedEvent('MEDICATION'),
  createMedicalRecordAddedEvent('ALLERGY')
];

// ===== COMBINED HEALTH EVENTS COLLECTION =====

/**
 * Complete collection of all health event fixtures
 */
export const healthEvents = [
  ...healthMetricRecordedEvents,
  ...healthGoalEvents,
  ...healthDeviceEvents,
  ...healthInsightEvents
];

/**
 * Creates a custom health event with specified parameters
 * @param type Health event type
 * @param payload Event payload
 * @param userId User ID
 * @returns Custom health event
 */
export function createCustomHealthEvent<T>(
  type: HealthEventType,
  payload: T,
  userId = USER_IDS[0]
): BaseEvent<T> {
  return createEvent<T>(
    type,
    SOURCE,
    payload,
    {
      userId,
      journey: JourneyType.HEALTH,
      version: VERSION,
      metadata: {
        correlationId: `corr-${Date.now()}`
      }
    }
  );
}