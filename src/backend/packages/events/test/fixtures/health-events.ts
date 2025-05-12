/**
 * Test fixtures for Health journey events.
 * 
 * This file provides standardized test data for health-related events with realistic values
 * for testing gamification rules, achievement processing, and notifications related to the
 * Health journey.
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, subHours } from 'date-fns';

// Event type constants for Health journey
export enum HealthEventType {
  METRIC_RECORDED = 'health.metric.recorded',
  GOAL_PROGRESS = 'health.goal.progress',
  GOAL_ACHIEVED = 'health.goal.achieved',
  INSIGHT_GENERATED = 'health.insight.generated',
  DEVICE_CONNECTED = 'health.device.connected',
  DEVICE_SYNCED = 'health.device.synced',
  DEVICE_DISCONNECTED = 'health.device.disconnected'
}

// Health metric types
export enum MetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  WEIGHT = 'WEIGHT',
  SLEEP = 'SLEEP'
}

// Device types
export enum DeviceType {
  SMARTWATCH = 'Smartwatch',
  BLOOD_PRESSURE_MONITOR = 'Blood Pressure Monitor',
  GLUCOSE_MONITOR = 'Glucose Monitor',
  SMART_SCALE = 'Smart Scale'
}

// Connection status
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PAIRING = 'pairing',
  SYNCING = 'syncing',
  ERROR = 'error'
}

// Goal types
export enum GoalType {
  STEPS = 'steps',
  WEIGHT = 'weight',
  SLEEP = 'sleep',
  HEART_RATE = 'heart_rate',
  BLOOD_PRESSURE = 'blood_pressure',
  BLOOD_GLUCOSE = 'blood_glucose'
}

// Goal status
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABANDONED = 'abandoned'
}

// Base event interface
interface BaseEvent {
  id: string;
  type: string;
  userId: string;
  timestamp: string;
  journey: 'health';
  version: string;
  payload: Record<string, any>;
}

/**
 * Creates a base health event with common properties
 */
const createBaseHealthEvent = (type: HealthEventType, payload: Record<string, any>, userId = 'user-123'): BaseEvent => ({
  id: uuidv4(),
  type,
  userId,
  timestamp: new Date().toISOString(),
  journey: 'health',
  version: '1.0',
  payload
});

/**
 * Health Metric Recorded Event Fixtures
 */

// Heart rate metric event
export const heartRateMetricEvent = createBaseHealthEvent(
  HealthEventType.METRIC_RECORDED,
  {
    metricType: MetricType.HEART_RATE,
    value: 72,
    unit: 'bpm',
    source: 'manual',
    recordedAt: new Date().toISOString(),
    metadata: {
      deviceId: null,
      notes: 'Resting heart rate'
    }
  }
);

// Blood pressure metric event
export const bloodPressureMetricEvent = createBaseHealthEvent(
  HealthEventType.METRIC_RECORDED,
  {
    metricType: MetricType.BLOOD_PRESSURE,
    value: { systolic: 120, diastolic: 80 },
    unit: 'mmHg',
    source: 'device',
    recordedAt: new Date().toISOString(),
    metadata: {
      deviceId: 'device-456',
      deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
      notes: 'Morning measurement'
    }
  }
);

// Blood glucose metric event
export const bloodGlucoseMetricEvent = createBaseHealthEvent(
  HealthEventType.METRIC_RECORDED,
  {
    metricType: MetricType.BLOOD_GLUCOSE,
    value: 85,
    unit: 'mg/dL',
    source: 'device',
    recordedAt: new Date().toISOString(),
    metadata: {
      deviceId: 'device-789',
      deviceType: DeviceType.GLUCOSE_MONITOR,
      measurementContext: 'fasting',
      notes: 'Before breakfast'
    }
  }
);

// Steps metric event
export const stepsMetricEvent = createBaseHealthEvent(
  HealthEventType.METRIC_RECORDED,
  {
    metricType: MetricType.STEPS,
    value: 8542,
    unit: 'steps',
    source: 'device',
    recordedAt: new Date().toISOString(),
    metadata: {
      deviceId: 'device-101',
      deviceType: DeviceType.SMARTWATCH,
      notes: 'Daily step count'
    }
  }
);

// Weight metric event
export const weightMetricEvent = createBaseHealthEvent(
  HealthEventType.METRIC_RECORDED,
  {
    metricType: MetricType.WEIGHT,
    value: 70.5,
    unit: 'kg',
    source: 'device',
    recordedAt: new Date().toISOString(),
    metadata: {
      deviceId: 'device-202',
      deviceType: DeviceType.SMART_SCALE,
      bodyComposition: {
        bodyFat: 22.1,
        muscleMass: 45.3,
        waterPercentage: 55.2
      },
      notes: 'Morning weight'
    }
  }
);

// Sleep metric event
export const sleepMetricEvent = createBaseHealthEvent(
  HealthEventType.METRIC_RECORDED,
  {
    metricType: MetricType.SLEEP,
    value: 7.5,
    unit: 'hours',
    source: 'device',
    recordedAt: new Date().toISOString(),
    metadata: {
      deviceId: 'device-101',
      deviceType: DeviceType.SMARTWATCH,
      sleepQuality: 'good',
      sleepStages: {
        deep: 120,
        light: 240,
        rem: 90,
        awake: 30
      },
      notes: 'Last night sleep'
    }
  }
);

// Collection of all metric events
export const metricEvents = {
  heartRateMetricEvent,
  bloodPressureMetricEvent,
  bloodGlucoseMetricEvent,
  stepsMetricEvent,
  weightMetricEvent,
  sleepMetricEvent
};

/**
 * Goal Progress and Achievement Event Fixtures
 */

// Steps goal progress event (75% complete)
export const stepsGoalProgressEvent = createBaseHealthEvent(
  HealthEventType.GOAL_PROGRESS,
  {
    goalId: 'goal-123',
    goalType: GoalType.STEPS,
    targetValue: 10000,
    currentValue: 7500,
    progressPercentage: 75,
    status: GoalStatus.ACTIVE,
    startDate: subDays(new Date(), 5).toISOString(),
    endDate: addDays(new Date(), 2).toISOString(),
    metadata: {
      streakDays: 3,
      previousBest: 9200
    }
  }
);

// Weight goal achieved event
export const weightGoalAchievedEvent = createBaseHealthEvent(
  HealthEventType.GOAL_ACHIEVED,
  {
    goalId: 'goal-456',
    goalType: GoalType.WEIGHT,
    targetValue: 68.0,
    currentValue: 67.8,
    progressPercentage: 100,
    status: GoalStatus.COMPLETED,
    startDate: subDays(new Date(), 30).toISOString(),
    endDate: new Date().toISOString(),
    achievedAt: new Date().toISOString(),
    metadata: {
      totalWeightLost: 4.2,
      daysToAchieve: 28,
      nextGoalSuggestion: {
        type: GoalType.WEIGHT,
        targetValue: 65.0,
        duration: 30
      }
    }
  }
);

// Sleep goal progress event (50% complete)
export const sleepGoalProgressEvent = createBaseHealthEvent(
  HealthEventType.GOAL_PROGRESS,
  {
    goalId: 'goal-789',
    goalType: GoalType.SLEEP,
    targetValue: 8.0,
    currentValue: 7.0,
    progressPercentage: 50,
    status: GoalStatus.ACTIVE,
    startDate: subDays(new Date(), 10).toISOString(),
    endDate: addDays(new Date(), 10).toISOString(),
    metadata: {
      consistencyScore: 65,
      averageSleepQuality: 'fair'
    }
  }
);

// Heart rate goal achieved event
export const heartRateGoalAchievedEvent = createBaseHealthEvent(
  HealthEventType.GOAL_ACHIEVED,
  {
    goalId: 'goal-321',
    goalType: GoalType.HEART_RATE,
    targetValue: 65,
    currentValue: 64,
    progressPercentage: 100,
    status: GoalStatus.COMPLETED,
    startDate: subDays(new Date(), 60).toISOString(),
    endDate: new Date().toISOString(),
    achievedAt: new Date().toISOString(),
    metadata: {
      initialRestingHeartRate: 72,
      improvementPercentage: 11.1,
      exerciseMinutesPerWeek: 150
    }
  }
);

// Failed goal event
export const failedGoalEvent = createBaseHealthEvent(
  HealthEventType.GOAL_PROGRESS,
  {
    goalId: 'goal-555',
    goalType: GoalType.STEPS,
    targetValue: 8000,
    currentValue: 5600,
    progressPercentage: 70,
    status: GoalStatus.FAILED,
    startDate: subDays(new Date(), 7).toISOString(),
    endDate: subDays(new Date(), 1).toISOString(),
    metadata: {
      reason: 'deadline_expired',
      suggestedAction: 'adjust_target'
    }
  }
);

// Collection of all goal events
export const goalEvents = {
  stepsGoalProgressEvent,
  weightGoalAchievedEvent,
  sleepGoalProgressEvent,
  heartRateGoalAchievedEvent,
  failedGoalEvent
};

/**
 * Health Insight Event Fixtures
 */

// Heart health insight event
export const heartHealthInsightEvent = createBaseHealthEvent(
  HealthEventType.INSIGHT_GENERATED,
  {
    insightId: 'insight-123',
    insightType: 'heart_health',
    title: 'Improved Resting Heart Rate',
    description: 'Your resting heart rate has improved by 8% over the last month, indicating better cardiovascular fitness.',
    severity: 'positive',
    generatedAt: new Date().toISOString(),
    relatedMetrics: [MetricType.HEART_RATE],
    recommendations: [
      'Continue your current exercise routine',
      'Consider adding more cardio exercises to further improve'
    ],
    metadata: {
      dataPoints: 42,
      confidenceScore: 0.85,
      trendDirection: 'improving'
    }
  }
);

// Sleep pattern insight event
export const sleepPatternInsightEvent = createBaseHealthEvent(
  HealthEventType.INSIGHT_GENERATED,
  {
    insightId: 'insight-456',
    insightType: 'sleep_pattern',
    title: 'Irregular Sleep Schedule Detected',
    description: 'Your sleep schedule has been inconsistent over the past week, which may affect your overall rest quality.',
    severity: 'warning',
    generatedAt: new Date().toISOString(),
    relatedMetrics: [MetricType.SLEEP],
    recommendations: [
      'Try to go to bed at the same time each night',
      'Establish a relaxing bedtime routine',
      'Avoid screens 1 hour before bedtime'
    ],
    metadata: {
      dataPoints: 7,
      confidenceScore: 0.78,
      trendDirection: 'worsening',
      variabilityScore: 0.65
    }
  }
);

// Weight trend insight event
export const weightTrendInsightEvent = createBaseHealthEvent(
  HealthEventType.INSIGHT_GENERATED,
  {
    insightId: 'insight-789',
    insightType: 'weight_trend',
    title: 'Steady Weight Loss',
    description: 'You\'ve been consistently losing weight at a healthy rate of 0.5kg per week.',
    severity: 'positive',
    generatedAt: new Date().toISOString(),
    relatedMetrics: [MetricType.WEIGHT],
    recommendations: [
      'Continue your current diet and exercise routine',
      'Consider adding strength training to preserve muscle mass'
    ],
    metadata: {
      dataPoints: 28,
      confidenceScore: 0.92,
      trendDirection: 'improving',
      weeklyChangeRate: -0.5
    }
  }
);

// Activity level insight event
export const activityLevelInsightEvent = createBaseHealthEvent(
  HealthEventType.INSIGHT_GENERATED,
  {
    insightId: 'insight-101',
    insightType: 'activity_level',
    title: 'Activity Level Decreasing',
    description: 'Your daily step count has decreased by 20% compared to your previous month\'s average.',
    severity: 'warning',
    generatedAt: new Date().toISOString(),
    relatedMetrics: [MetricType.STEPS],
    recommendations: [
      'Try to incorporate short walks throughout your day',
      'Set reminders to stand up and move every hour',
      'Consider tracking your activity with a fitness app'
    ],
    metadata: {
      dataPoints: 30,
      confidenceScore: 0.88,
      trendDirection: 'worsening',
      comparisonPeriod: 'previous_month'
    }
  }
);

// Collection of all insight events
export const insightEvents = {
  heartHealthInsightEvent,
  sleepPatternInsightEvent,
  weightTrendInsightEvent,
  activityLevelInsightEvent
};

/**
 * Device Connection Event Fixtures
 */

// Device connected event
export const deviceConnectedEvent = createBaseHealthEvent(
  HealthEventType.DEVICE_CONNECTED,
  {
    deviceId: 'device-101',
    deviceType: DeviceType.SMARTWATCH,
    deviceName: 'Apple Watch Series 7',
    connectionStatus: ConnectionStatus.CONNECTED,
    connectedAt: new Date().toISOString(),
    metadata: {
      manufacturer: 'Apple',
      model: 'Watch Series 7',
      firmwareVersion: '8.5.1',
      batteryLevel: 85,
      connectionMethod: 'bluetooth'
    }
  }
);

// Device synced event
export const deviceSyncedEvent = createBaseHealthEvent(
  HealthEventType.DEVICE_SYNCED,
  {
    deviceId: 'device-101',
    deviceType: DeviceType.SMARTWATCH,
    deviceName: 'Apple Watch Series 7',
    connectionStatus: ConnectionStatus.CONNECTED,
    syncedAt: new Date().toISOString(),
    lastSyncedAt: subHours(new Date(), 12).toISOString(),
    syncDuration: 45, // seconds
    metricsUpdated: [
      MetricType.HEART_RATE,
      MetricType.STEPS,
      MetricType.SLEEP
    ],
    metadata: {
      dataPointsAdded: 124,
      syncStatus: 'complete',
      batteryLevel: 72
    }
  }
);

// Device disconnected event
export const deviceDisconnectedEvent = createBaseHealthEvent(
  HealthEventType.DEVICE_DISCONNECTED,
  {
    deviceId: 'device-101',
    deviceType: DeviceType.SMARTWATCH,
    deviceName: 'Apple Watch Series 7',
    connectionStatus: ConnectionStatus.DISCONNECTED,
    disconnectedAt: new Date().toISOString(),
    lastConnectedAt: subHours(new Date(), 1).toISOString(),
    disconnectionReason: 'user_initiated',
    metadata: {
      totalConnectionDuration: 86400, // seconds (24 hours)
      syncStatus: 'complete_before_disconnect'
    }
  }
);

// Device connection error event
export const deviceConnectionErrorEvent = createBaseHealthEvent(
  HealthEventType.DEVICE_CONNECTED,
  {
    deviceId: 'device-202',
    deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
    deviceName: 'Omron X5',
    connectionStatus: ConnectionStatus.ERROR,
    attemptedAt: new Date().toISOString(),
    errorCode: 'BLE_CONNECTION_TIMEOUT',
    errorMessage: 'Bluetooth connection timed out',
    metadata: {
      attemptCount: 3,
      suggestedAction: 'retry_with_device_reset',
      batteryLevel: 'unknown'
    }
  }
);

// Collection of all device events
export const deviceEvents = {
  deviceConnectedEvent,
  deviceSyncedEvent,
  deviceDisconnectedEvent,
  deviceConnectionErrorEvent
};

/**
 * Export all health events
 */
export const healthEvents = {
  ...metricEvents,
  ...goalEvents,
  ...insightEvents,
  ...deviceEvents
};

/**
 * Factory functions for creating custom health events
 */

/**
 * Creates a custom health metric recorded event
 */
export const createHealthMetricEvent = (
  metricType: MetricType,
  value: number | Record<string, any>,
  source = 'manual',
  metadata: Record<string, any> = {}
) => createBaseHealthEvent(
  HealthEventType.METRIC_RECORDED,
  {
    metricType,
    value,
    unit: getUnitForMetricType(metricType),
    source,
    recordedAt: new Date().toISOString(),
    metadata
  }
);

/**
 * Creates a custom goal progress event
 */
export const createGoalProgressEvent = (
  goalType: GoalType,
  targetValue: number,
  currentValue: number,
  status: GoalStatus = GoalStatus.ACTIVE,
  metadata: Record<string, any> = {}
) => {
  const progressPercentage = Math.min(Math.round((currentValue / targetValue) * 100), 100);
  
  return createBaseHealthEvent(
    status === GoalStatus.COMPLETED ? HealthEventType.GOAL_ACHIEVED : HealthEventType.GOAL_PROGRESS,
    {
      goalId: `goal-${uuidv4().slice(0, 8)}`,
      goalType,
      targetValue,
      currentValue,
      progressPercentage,
      status,
      startDate: subDays(new Date(), 7).toISOString(),
      endDate: addDays(new Date(), 7).toISOString(),
      ...(status === GoalStatus.COMPLETED ? { achievedAt: new Date().toISOString() } : {}),
      metadata
    }
  );
};

/**
 * Creates a custom device connection event
 */
export const createDeviceConnectionEvent = (
  deviceType: DeviceType,
  connectionStatus: ConnectionStatus,
  deviceName: string,
  metadata: Record<string, any> = {}
) => {
  const deviceId = `device-${uuidv4().slice(0, 8)}`;
  const eventType = getEventTypeForConnectionStatus(connectionStatus);
  
  return createBaseHealthEvent(
    eventType,
    {
      deviceId,
      deviceType,
      deviceName,
      connectionStatus,
      ...(connectionStatus === ConnectionStatus.CONNECTED ? { connectedAt: new Date().toISOString() } : {}),
      ...(connectionStatus === ConnectionStatus.DISCONNECTED ? { disconnectedAt: new Date().toISOString() } : {}),
      ...(connectionStatus === ConnectionStatus.SYNCING ? { syncedAt: new Date().toISOString() } : {}),
      metadata
    }
  );
};

/**
 * Helper function to get the appropriate unit for a metric type
 */
function getUnitForMetricType(metricType: MetricType): string {
  const unitMap: Record<MetricType, string> = {
    [MetricType.HEART_RATE]: 'bpm',
    [MetricType.BLOOD_PRESSURE]: 'mmHg',
    [MetricType.BLOOD_GLUCOSE]: 'mg/dL',
    [MetricType.STEPS]: 'steps',
    [MetricType.WEIGHT]: 'kg',
    [MetricType.SLEEP]: 'hours'
  };
  
  return unitMap[metricType] || '';
}

/**
 * Helper function to get the appropriate event type for a connection status
 */
function getEventTypeForConnectionStatus(status: ConnectionStatus): HealthEventType {
  const eventMap: Record<ConnectionStatus, HealthEventType> = {
    [ConnectionStatus.CONNECTED]: HealthEventType.DEVICE_CONNECTED,
    [ConnectionStatus.DISCONNECTED]: HealthEventType.DEVICE_DISCONNECTED,
    [ConnectionStatus.SYNCING]: HealthEventType.DEVICE_SYNCED,
    [ConnectionStatus.PAIRING]: HealthEventType.DEVICE_CONNECTED,
    [ConnectionStatus.ERROR]: HealthEventType.DEVICE_CONNECTED
  };
  
  return eventMap[status] || HealthEventType.DEVICE_CONNECTED;
}