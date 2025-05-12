import { v4 as uuidv4 } from 'uuid';

/**
 * Health journey event fixtures for testing event validation, processing, and transformation.
 * Includes fixtures for health metrics recording, goal achievements, health insights, and device synchronization.
 */

// Common user IDs for consistent testing
const USER_IDS = {
  standard: uuidv4(),
  premium: uuidv4(),
  new: uuidv4(),
  inactive: uuidv4(),
};

// Common record IDs for consistent testing
const RECORD_IDS = {
  standard: uuidv4(),
  complete: uuidv4(),
  partial: uuidv4(),
  empty: uuidv4(),
};

// Common device IDs for consistent testing
const DEVICE_IDS = {
  smartwatch: uuidv4(),
  bloodPressureMonitor: uuidv4(),
  glucoseMonitor: uuidv4(),
  smartScale: uuidv4(),
};

/**
 * Health Metric Recording Event Fixtures
 */
export const healthMetricRecordedEvents = {
  // Heart rate metric recorded event
  heartRate: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      source: 'MANUAL',
      timestamp: new Date().toISOString(),
      isAbnormal: false,
      trendPercentage: 0,
    },
  },

  // Abnormal heart rate metric recorded event
  abnormalHeartRate: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'HEART_RATE',
      value: 120,
      unit: 'bpm',
      source: 'MANUAL',
      timestamp: new Date().toISOString(),
      isAbnormal: true,
      trendPercentage: 40,
    },
  },

  // Blood pressure metric recorded event
  bloodPressure: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'BLOOD_PRESSURE',
      value: { systolic: 120, diastolic: 80 },
      unit: 'mmHg',
      source: 'DEVICE',
      deviceId: DEVICE_IDS.bloodPressureMonitor,
      timestamp: new Date().toISOString(),
      isAbnormal: false,
      trendPercentage: -5,
    },
  },

  // Abnormal blood pressure metric recorded event
  abnormalBloodPressure: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'BLOOD_PRESSURE',
      value: { systolic: 160, diastolic: 100 },
      unit: 'mmHg',
      source: 'DEVICE',
      deviceId: DEVICE_IDS.bloodPressureMonitor,
      timestamp: new Date().toISOString(),
      isAbnormal: true,
      trendPercentage: 15,
    },
  },

  // Blood glucose metric recorded event
  bloodGlucose: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'BLOOD_GLUCOSE',
      value: 95,
      unit: 'mg/dL',
      source: 'DEVICE',
      deviceId: DEVICE_IDS.glucoseMonitor,
      timestamp: new Date().toISOString(),
      isAbnormal: false,
      trendPercentage: 2,
    },
  },

  // Abnormal blood glucose metric recorded event
  abnormalBloodGlucose: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'BLOOD_GLUCOSE',
      value: 180,
      unit: 'mg/dL',
      source: 'DEVICE',
      deviceId: DEVICE_IDS.glucoseMonitor,
      timestamp: new Date().toISOString(),
      isAbnormal: true,
      trendPercentage: 30,
    },
  },

  // Steps metric recorded event
  steps: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'STEPS',
      value: 8500,
      unit: 'steps',
      source: 'DEVICE',
      deviceId: DEVICE_IDS.smartwatch,
      timestamp: new Date().toISOString(),
      isAbnormal: false,
      trendPercentage: 10,
    },
  },

  // Weight metric recorded event
  weight: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'WEIGHT',
      value: 70.5,
      unit: 'kg',
      source: 'DEVICE',
      deviceId: DEVICE_IDS.smartScale,
      timestamp: new Date().toISOString(),
      isAbnormal: false,
      trendPercentage: -2,
    },
  },

  // Sleep metric recorded event
  sleep: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'SLEEP',
      value: 7.5,
      unit: 'hours',
      source: 'DEVICE',
      deviceId: DEVICE_IDS.smartwatch,
      timestamp: new Date().toISOString(),
      isAbnormal: false,
      trendPercentage: 5,
      details: {
        deepSleep: 2.1,
        lightSleep: 4.2,
        remSleep: 1.2,
        awake: 0.5,
      },
    },
  },

  // Metric recorded with notes
  withNotes: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'HEART_RATE',
      value: 85,
      unit: 'bpm',
      source: 'MANUAL',
      timestamp: new Date().toISOString(),
      isAbnormal: false,
      trendPercentage: 10,
      notes: 'Measured after light exercise',
    },
  },

  // Metric recorded with missing optional fields
  minimal: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      source: 'MANUAL',
      timestamp: new Date().toISOString(),
    },
  },

  // First time metric recorded for a user
  firstTime: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.new,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.empty,
      type: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      source: 'MANUAL',
      timestamp: new Date().toISOString(),
      isFirstRecord: true,
    },
  },

  // Consecutive day streak metric recorded
  streak: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'HEART_RATE',
      value: 68,
      unit: 'bpm',
      source: 'MANUAL',
      timestamp: new Date().toISOString(),
      isAbnormal: false,
      currentStreak: 5, // 5 consecutive days of recording
    },
  },
};

/**
 * Health Goal Achievement Event Fixtures
 */
export const healthGoalAchievedEvents = {
  // Daily steps goal achieved
  dailySteps: {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'STEPS',
      period: 'DAILY',
      targetValue: 10000,
      currentValue: 10250,
      completionPercentage: 102.5,
      achievedAt: new Date().toISOString(),
    },
  },

  // Weekly exercise goal achieved
  weeklyExercise: {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'EXERCISE',
      period: 'WEEKLY',
      targetValue: 150, // 150 minutes per week
      currentValue: 165,
      completionPercentage: 110,
      achievedAt: new Date().toISOString(),
    },
  },

  // Monthly weight loss goal achieved
  monthlyWeightLoss: {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'WEIGHT',
      period: 'MONTHLY',
      targetValue: 2, // 2kg weight loss
      currentValue: 2.5,
      completionPercentage: 125,
      achievedAt: new Date().toISOString(),
      startValue: 73, // starting weight
      endValue: 70.5, // ending weight
    },
  },

  // Blood pressure goal achieved
  bloodPressureGoal: {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'BLOOD_PRESSURE',
      period: 'WEEKLY',
      targetValue: { systolic: 120, diastolic: 80 },
      currentValue: { systolic: 118, diastolic: 78 },
      completionPercentage: 100,
      achievedAt: new Date().toISOString(),
      consistencyDays: 5, // maintained for 5 days
    },
  },

  // Sleep goal achieved
  sleepGoal: {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'SLEEP',
      period: 'DAILY',
      targetValue: 8, // 8 hours
      currentValue: 8.2,
      completionPercentage: 102.5,
      achievedAt: new Date().toISOString(),
      streak: 3, // 3 days in a row
    },
  },

  // First goal ever achieved
  firstGoalAchieved: {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId: USER_IDS.new,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.empty,
      type: 'STEPS',
      period: 'DAILY',
      targetValue: 5000,
      currentValue: 5200,
      completionPercentage: 104,
      achievedAt: new Date().toISOString(),
      isFirstGoalAchieved: true,
    },
  },

  // Goal achieved with difficulty (just barely)
  barelyAchieved: {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'STEPS',
      period: 'DAILY',
      targetValue: 10000,
      currentValue: 10001,
      completionPercentage: 100.01,
      achievedAt: new Date().toISOString(),
      lastMinuteCompletion: true,
    },
  },

  // Goal achieved with exceptional performance
  exceptionalAchievement: {
    type: 'HEALTH_GOAL_ACHIEVED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'EXERCISE',
      period: 'WEEKLY',
      targetValue: 150,
      currentValue: 300,
      completionPercentage: 200,
      achievedAt: new Date().toISOString(),
      isExceptional: true,
    },
  },
};

/**
 * Health Goal Progress Event Fixtures
 */
export const healthGoalProgressEvents = {
  // 50% progress towards steps goal
  halfwaySteps: {
    type: 'HEALTH_GOAL_PROGRESS',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'STEPS',
      period: 'DAILY',
      targetValue: 10000,
      currentValue: 5000,
      completionPercentage: 50,
      updatedAt: new Date().toISOString(),
    },
  },

  // 75% progress towards weight goal
  nearlyCompleteWeight: {
    type: 'HEALTH_GOAL_PROGRESS',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'WEIGHT',
      period: 'MONTHLY',
      targetValue: 2, // 2kg weight loss
      currentValue: 1.5,
      completionPercentage: 75,
      updatedAt: new Date().toISOString(),
      startValue: 73, // starting weight
      currentWeight: 71.5, // current weight
    },
  },

  // 25% progress towards exercise goal
  startedExercise: {
    type: 'HEALTH_GOAL_PROGRESS',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'EXERCISE',
      period: 'WEEKLY',
      targetValue: 150, // 150 minutes
      currentValue: 37.5,
      completionPercentage: 25,
      updatedAt: new Date().toISOString(),
      daysRemaining: 5, // 5 days left in the week
    },
  },

  // 90% progress towards sleep goal
  almostCompleteSleep: {
    type: 'HEALTH_GOAL_PROGRESS',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'SLEEP',
      period: 'DAILY',
      targetValue: 8, // 8 hours
      currentValue: 7.2,
      completionPercentage: 90,
      updatedAt: new Date().toISOString(),
    },
  },

  // First progress update for a new user
  firstProgress: {
    type: 'HEALTH_GOAL_PROGRESS',
    userId: USER_IDS.new,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      goalId: uuidv4(),
      recordId: RECORD_IDS.empty,
      type: 'STEPS',
      period: 'DAILY',
      targetValue: 5000,
      currentValue: 2000,
      completionPercentage: 40,
      updatedAt: new Date().toISOString(),
      isFirstUpdate: true,
    },
  },
};

/**
 * Health Insight Generation Event Fixtures
 */
export const healthInsightEvents = {
  // Heart rate trend insight
  heartRateTrend: {
    type: 'HEALTH_INSIGHT_GENERATED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      insightId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'TREND',
      metricType: 'HEART_RATE',
      period: 'WEEKLY',
      summary: 'Your resting heart rate has decreased by 5 bpm over the past week.',
      interpretation: 'POSITIVE',
      details: {
        startValue: 75,
        endValue: 70,
        changePercentage: -6.67,
        dataPoints: 7,
      },
      generatedAt: new Date().toISOString(),
    },
  },

  // Sleep quality insight
  sleepQuality: {
    type: 'HEALTH_INSIGHT_GENERATED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      insightId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'PATTERN',
      metricType: 'SLEEP',
      period: 'MONTHLY',
      summary: 'Your deep sleep has improved by 15% this month.',
      interpretation: 'POSITIVE',
      details: {
        averageSleepDuration: 7.8,
        averageDeepSleep: 2.3,
        previousAverageDeepSleep: 2.0,
        changePercentage: 15,
        dataPoints: 28,
      },
      generatedAt: new Date().toISOString(),
    },
  },

  // Activity correlation insight
  activityCorrelation: {
    type: 'HEALTH_INSIGHT_GENERATED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      insightId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'CORRELATION',
      metricTypes: ['STEPS', 'SLEEP'],
      period: 'MONTHLY',
      summary: 'On days with over 8,000 steps, you average 7.5 hours of sleep vs. 6.8 hours on less active days.',
      interpretation: 'POSITIVE',
      details: {
        primaryMetric: 'STEPS',
        secondaryMetric: 'SLEEP',
        correlationStrength: 0.72, // 0-1 scale
        activeThreshold: 8000,
        activeAverage: 7.5,
        inactiveAverage: 6.8,
        dataPoints: 30,
      },
      generatedAt: new Date().toISOString(),
    },
  },

  // Health anomaly insight
  healthAnomaly: {
    type: 'HEALTH_INSIGHT_GENERATED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      insightId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'ANOMALY',
      metricType: 'BLOOD_PRESSURE',
      period: 'WEEKLY',
      summary: 'Your blood pressure readings have been consistently elevated this week.',
      interpretation: 'NEGATIVE',
      details: {
        averageSystolic: 145,
        averageDiastolic: 92,
        normalSystolic: 120,
        normalDiastolic: 80,
        dataPoints: 7,
        consecutiveDays: 5,
      },
      generatedAt: new Date().toISOString(),
      requiresAttention: true,
    },
  },

  // Goal achievement insight
  goalAchievementInsight: {
    type: 'HEALTH_INSIGHT_GENERATED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      insightId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'ACHIEVEMENT',
      goalType: 'STEPS',
      period: 'MONTHLY',
      summary: 'You've achieved your daily step goal 25 out of 30 days this month!',
      interpretation: 'POSITIVE',
      details: {
        goalType: 'STEPS',
        targetValue: 10000,
        achievedDays: 25,
        totalDays: 30,
        achievementRate: 83.33,
        averageCompletion: 112.5, // average percentage of goal completion
      },
      generatedAt: new Date().toISOString(),
    },
  },

  // First insight for a new user
  firstInsight: {
    type: 'HEALTH_INSIGHT_GENERATED',
    userId: USER_IDS.new,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      insightId: uuidv4(),
      recordId: RECORD_IDS.empty,
      type: 'WELCOME',
      summary: 'Welcome to your health journey! Start by setting a daily step goal.',
      interpretation: 'NEUTRAL',
      details: {
        suggestedGoal: {
          type: 'STEPS',
          targetValue: 7500,
          period: 'DAILY',
        },
        isFirstInsight: true,
      },
      generatedAt: new Date().toISOString(),
    },
  },
};

/**
 * Device Synchronization Event Fixtures
 */
export const deviceSyncEvents = {
  // Smartwatch connected event
  smartwatchConnected: {
    type: 'DEVICE_CONNECTED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      deviceConnectionId: uuidv4(),
      recordId: RECORD_IDS.standard,
      deviceType: 'SMARTWATCH',
      deviceId: DEVICE_IDS.smartwatch,
      manufacturer: 'Apple',
      model: 'Apple Watch Series 7',
      status: 'CONNECTED',
      connectedAt: new Date().toISOString(),
      supportedMetrics: ['HEART_RATE', 'STEPS', 'SLEEP', 'EXERCISE'],
    },
  },

  // Blood pressure monitor connected event
  bloodPressureMonitorConnected: {
    type: 'DEVICE_CONNECTED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      deviceConnectionId: uuidv4(),
      recordId: RECORD_IDS.standard,
      deviceType: 'BLOOD_PRESSURE_MONITOR',
      deviceId: DEVICE_IDS.bloodPressureMonitor,
      manufacturer: 'Omron',
      model: 'M7 Intelli IT',
      status: 'CONNECTED',
      connectedAt: new Date().toISOString(),
      supportedMetrics: ['BLOOD_PRESSURE'],
    },
  },

  // Glucose monitor connected event
  glucoseMonitorConnected: {
    type: 'DEVICE_CONNECTED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      deviceConnectionId: uuidv4(),
      recordId: RECORD_IDS.standard,
      deviceType: 'GLUCOSE_MONITOR',
      deviceId: DEVICE_IDS.glucoseMonitor,
      manufacturer: 'Dexcom',
      model: 'G6',
      status: 'CONNECTED',
      connectedAt: new Date().toISOString(),
      supportedMetrics: ['BLOOD_GLUCOSE'],
    },
  },

  // Smart scale connected event
  smartScaleConnected: {
    type: 'DEVICE_CONNECTED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      deviceConnectionId: uuidv4(),
      recordId: RECORD_IDS.standard,
      deviceType: 'SMART_SCALE',
      deviceId: DEVICE_IDS.smartScale,
      manufacturer: 'Withings',
      model: 'Body+',
      status: 'CONNECTED',
      connectedAt: new Date().toISOString(),
      supportedMetrics: ['WEIGHT', 'BODY_FAT', 'MUSCLE_MASS', 'WATER_PERCENTAGE'],
    },
  },

  // Device disconnected event
  deviceDisconnected: {
    type: 'DEVICE_DISCONNECTED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      deviceConnectionId: uuidv4(),
      recordId: RECORD_IDS.standard,
      deviceType: 'SMARTWATCH',
      deviceId: DEVICE_IDS.smartwatch,
      status: 'DISCONNECTED',
      disconnectedAt: new Date().toISOString(),
      reason: 'USER_INITIATED',
    },
  },

  // Device sync completed event
  deviceSyncCompleted: {
    type: 'DEVICE_SYNC_COMPLETED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      deviceConnectionId: uuidv4(),
      recordId: RECORD_IDS.standard,
      deviceType: 'SMARTWATCH',
      deviceId: DEVICE_IDS.smartwatch,
      syncedAt: new Date().toISOString(),
      metricsCount: {
        HEART_RATE: 24,
        STEPS: 1,
        SLEEP: 1,
        EXERCISE: 3,
      },
      totalMetrics: 29,
      syncDuration: 12.5, // seconds
      syncStatus: 'SUCCESS',
    },
  },

  // Device sync failed event
  deviceSyncFailed: {
    type: 'DEVICE_SYNC_FAILED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      deviceConnectionId: uuidv4(),
      recordId: RECORD_IDS.standard,
      deviceType: 'SMARTWATCH',
      deviceId: DEVICE_IDS.smartwatch,
      attemptedAt: new Date().toISOString(),
      errorCode: 'CONNECTION_LOST',
      errorMessage: 'Connection to device was lost during synchronization',
      retryCount: 2,
      syncStatus: 'FAILED',
    },
  },

  // First device ever connected for a user
  firstDeviceConnected: {
    type: 'DEVICE_CONNECTED',
    userId: USER_IDS.new,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      deviceConnectionId: uuidv4(),
      recordId: RECORD_IDS.empty,
      deviceType: 'SMARTWATCH',
      deviceId: uuidv4(),
      manufacturer: 'Fitbit',
      model: 'Versa 3',
      status: 'CONNECTED',
      connectedAt: new Date().toISOString(),
      supportedMetrics: ['HEART_RATE', 'STEPS', 'SLEEP'],
      isFirstDevice: true,
    },
  },
};

/**
 * Medical Event Recorded Event Fixtures
 */
export const medicalEventRecordedEvents = {
  // Doctor visit recorded event
  doctorVisit: {
    type: 'MEDICAL_EVENT_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      eventId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'DOCTOR_VISIT',
      description: 'Annual physical examination',
      date: new Date().toISOString(),
      provider: 'Dr. Maria Silva',
      location: 'Clínica São Paulo',
      documents: [
        {
          id: uuidv4(),
          name: 'Physical Exam Results.pdf',
          type: 'application/pdf',
          size: 1250000,
          uploadedAt: new Date().toISOString(),
        },
      ],
    },
  },

  // Vaccination recorded event
  vaccination: {
    type: 'MEDICAL_EVENT_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      eventId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'VACCINATION',
      description: 'COVID-19 Booster',
      date: new Date().toISOString(),
      provider: 'Clínica de Vacinação Central',
      details: {
        vaccine: 'Pfizer-BioNTech',
        doseNumber: 3,
        lotNumber: 'PZ12345',
        nextDoseDate: null,
      },
      documents: [
        {
          id: uuidv4(),
          name: 'Vaccination Certificate.pdf',
          type: 'application/pdf',
          size: 850000,
          uploadedAt: new Date().toISOString(),
        },
      ],
    },
  },

  // Lab test recorded event
  labTest: {
    type: 'MEDICAL_EVENT_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      eventId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'LAB_TEST',
      description: 'Complete blood count and lipid panel',
      date: new Date().toISOString(),
      provider: 'Laboratório Diagnósticos',
      details: {
        testTypes: ['CBC', 'LIPID_PANEL', 'GLUCOSE'],
        abnormalResults: true,
        followUpRequired: true,
      },
      documents: [
        {
          id: uuidv4(),
          name: 'Lab Results.pdf',
          type: 'application/pdf',
          size: 1500000,
          uploadedAt: new Date().toISOString(),
        },
      ],
    },
  },

  // Medication prescribed event
  medicationPrescribed: {
    type: 'MEDICAL_EVENT_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      eventId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'MEDICATION_PRESCRIBED',
      description: 'Hypertension medication prescription',
      date: new Date().toISOString(),
      provider: 'Dr. Carlos Mendes',
      details: {
        medications: [
          {
            name: 'Losartan',
            dosage: '50mg',
            frequency: 'Once daily',
            duration: '3 months',
          },
        ],
        reason: 'Hypertension management',
        instructions: 'Take in the morning with food',
      },
      documents: [
        {
          id: uuidv4(),
          name: 'Prescription.pdf',
          type: 'application/pdf',
          size: 950000,
          uploadedAt: new Date().toISOString(),
        },
      ],
    },
  },

  // Allergy recorded event
  allergyRecorded: {
    type: 'MEDICAL_EVENT_RECORDED',
    userId: USER_IDS.standard,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      eventId: uuidv4(),
      recordId: RECORD_IDS.standard,
      type: 'ALLERGY',
      description: 'Penicillin allergy',
      date: new Date().toISOString(),
      details: {
        allergen: 'Penicillin',
        reaction: 'Rash and difficulty breathing',
        severity: 'SEVERE',
        diagnosedDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString(),
      },
      documents: [],
    },
  },

  // First medical event recorded for a user
  firstMedicalEvent: {
    type: 'MEDICAL_EVENT_RECORDED',
    userId: USER_IDS.new,
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      eventId: uuidv4(),
      recordId: RECORD_IDS.empty,
      type: 'DOCTOR_VISIT',
      description: 'Initial consultation',
      date: new Date().toISOString(),
      provider: 'Dr. Ana Ferreira',
      isFirstRecord: true,
      documents: [],
    },
  },
};

/**
 * Export all health event fixtures
 */
export const healthEvents = {
  healthMetricRecordedEvents,
  healthGoalAchievedEvents,
  healthGoalProgressEvents,
  healthInsightEvents,
  deviceSyncEvents,
  medicalEventRecordedEvents,
};

export default healthEvents;