/**
 * @file health-events.ts
 * @description Test fixtures for Health journey events in the AUSTA SuperApp.
 * 
 * This file provides standardized test data for health-related events including:
 * - Health metric recording events (heart rate, blood pressure, weight, etc.)
 * - Goal achievement events with different progress levels
 * - Health insight generation events
 * - Device synchronization events with various device types
 * 
 * These fixtures ensure consistent and valid test data for health event consumers
 * and are used for testing gamification rules, achievement processing, and notifications.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  HealthMetricRecordedEventDto,
  HealthGoalAchievedEventDto,
  DeviceSynchronizedEventDto,
  HealthInsightGeneratedEventDto,
  HealthMetricType,
  HealthGoalType,
  DeviceType,
  HealthInsightType,
  HealthMetricData,
  HealthGoalData,
  DeviceSyncData,
  HealthInsightData
} from '../../src/dto/health-event.dto';
import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { createEventMetadata, EventMetadataDto } from '../../src/dto/event-metadata.dto';

/**
 * Creates a base event metadata object for testing
 * @param overrides Optional overrides for the metadata
 * @returns EventMetadataDto with health service origin
 */
export function createHealthEventMetadata(overrides?: Partial<EventMetadataDto>): EventMetadataDto {
  return createEventMetadata('health-service', {
    correlationId: uuidv4(),
    timestamp: new Date(),
    ...overrides
  });
}

/**
 * Test fixture for heart rate metric recording event
 */
export const heartRateMetricEvent: HealthMetricRecordedEventDto = {
  type: JourneyEvents.Health.METRIC_RECORDED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    metricType: HealthMetricType.HEART_RATE,
    value: 72,
    unit: 'bpm',
    recordedAt: new Date().toISOString(),
    notes: 'Resting heart rate',
    deviceId: 'smartwatch-001'
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for blood pressure metric recording event
 */
export const bloodPressureMetricEvent: HealthMetricRecordedEventDto = {
  type: JourneyEvents.Health.METRIC_RECORDED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    metricType: HealthMetricType.BLOOD_PRESSURE,
    value: 120, // Systolic value (would typically be stored as "120/80" in a real implementation)
    unit: 'mmHg',
    recordedAt: new Date().toISOString(),
    notes: 'Morning measurement',
    deviceId: 'bp-monitor-001'
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for weight metric recording event
 */
export const weightMetricEvent: HealthMetricRecordedEventDto = {
  type: JourneyEvents.Health.METRIC_RECORDED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    metricType: HealthMetricType.WEIGHT,
    value: 70.5,
    unit: 'kg',
    recordedAt: new Date().toISOString(),
    notes: 'Weekly weigh-in',
    deviceId: 'smart-scale-001'
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for steps metric recording event
 */
export const stepsMetricEvent: HealthMetricRecordedEventDto = {
  type: JourneyEvents.Health.METRIC_RECORDED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    metricType: HealthMetricType.STEPS,
    value: 8547,
    unit: 'steps',
    recordedAt: new Date().toISOString(),
    deviceId: 'smartwatch-001'
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for sleep metric recording event
 */
export const sleepMetricEvent: HealthMetricRecordedEventDto = {
  type: JourneyEvents.Health.METRIC_RECORDED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    metricType: HealthMetricType.SLEEP,
    value: 7.5,
    unit: 'hours',
    recordedAt: new Date().toISOString(),
    notes: 'Good quality sleep',
    deviceId: 'sleep-tracker-001'
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for blood glucose metric recording event
 */
export const bloodGlucoseMetricEvent: HealthMetricRecordedEventDto = {
  type: JourneyEvents.Health.METRIC_RECORDED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    metricType: HealthMetricType.BLOOD_GLUCOSE,
    value: 95,
    unit: 'mg/dL',
    recordedAt: new Date().toISOString(),
    notes: 'Before breakfast',
    deviceId: 'glucose-monitor-001'
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for oxygen saturation metric recording event
 */
export const oxygenSaturationMetricEvent: HealthMetricRecordedEventDto = {
  type: JourneyEvents.Health.METRIC_RECORDED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    metricType: HealthMetricType.OXYGEN_SATURATION,
    value: 98,
    unit: '%',
    recordedAt: new Date().toISOString(),
    deviceId: 'pulse-oximeter-001'
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a completed steps goal achievement event
 */
export const stepsGoalAchievedEvent: HealthGoalAchievedEventDto = {
  type: JourneyEvents.Health.GOAL_ACHIEVED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.STEPS_TARGET,
    description: 'Walk 10,000 steps daily',
    targetValue: 10000,
    unit: 'steps',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a partially completed weight goal achievement event
 */
export const weightGoalPartialEvent: HealthGoalAchievedEventDto = {
  type: JourneyEvents.Health.GOAL_ACHIEVED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.WEIGHT_TARGET,
    description: 'Lose 5kg over 2 months',
    targetValue: 65,
    unit: 'kg',
    progressPercentage: 60
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a completed sleep goal achievement event
 */
export const sleepGoalAchievedEvent: HealthGoalAchievedEventDto = {
  type: JourneyEvents.Health.GOAL_ACHIEVED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.SLEEP_DURATION,
    description: 'Sleep 8 hours every night for a week',
    targetValue: 8,
    unit: 'hours',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a blood pressure management goal achievement event
 */
export const bloodPressureGoalAchievedEvent: HealthGoalAchievedEventDto = {
  type: JourneyEvents.Health.GOAL_ACHIEVED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.BLOOD_PRESSURE_MANAGEMENT,
    description: 'Maintain blood pressure below 130/85 for a month',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a successful smartwatch synchronization event
 */
export const smartwatchSyncEvent: DeviceSynchronizedEventDto = {
  type: JourneyEvents.Health.DEVICE_CONNECTED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    deviceId: 'smartwatch-001',
    deviceType: DeviceType.SMARTWATCH,
    deviceName: 'Apple Watch Series 7',
    syncedAt: new Date().toISOString(),
    syncSuccessful: true,
    dataPointsCount: 24,
    metricTypes: [
      HealthMetricType.HEART_RATE,
      HealthMetricType.STEPS,
      HealthMetricType.SLEEP
    ]
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a successful blood pressure monitor synchronization event
 */
export const bloodPressureMonitorSyncEvent: DeviceSynchronizedEventDto = {
  type: JourneyEvents.Health.DEVICE_CONNECTED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    deviceId: 'bp-monitor-001',
    deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
    deviceName: 'Omron X5',
    syncedAt: new Date().toISOString(),
    syncSuccessful: true,
    dataPointsCount: 3,
    metricTypes: [HealthMetricType.BLOOD_PRESSURE]
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a failed glucose monitor synchronization event
 */
export const failedGlucoseMonitorSyncEvent: DeviceSynchronizedEventDto = {
  type: JourneyEvents.Health.DEVICE_CONNECTED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    deviceId: 'glucose-monitor-001',
    deviceType: DeviceType.GLUCOSE_MONITOR,
    deviceName: 'Dexcom G6',
    syncedAt: new Date().toISOString(),
    syncSuccessful: false,
    errorMessage: 'Connection timeout after 30 seconds'
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a successful scale synchronization event
 */
export const scaleSyncEvent: DeviceSynchronizedEventDto = {
  type: JourneyEvents.Health.DEVICE_CONNECTED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    deviceId: 'smart-scale-001',
    deviceType: DeviceType.SCALE,
    deviceName: 'Withings Body+',
    syncedAt: new Date().toISOString(),
    syncSuccessful: true,
    dataPointsCount: 1,
    metricTypes: [HealthMetricType.WEIGHT]
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a trend analysis health insight event
 */
export const trendAnalysisInsightEvent: HealthInsightGeneratedEventDto = {
  type: JourneyEvents.Health.INSIGHT_GENERATED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    insightId: uuidv4(),
    insightType: HealthInsightType.TREND_ANALYSIS,
    title: 'Improving Sleep Pattern',
    description: 'Your sleep duration has improved by 15% over the past month. Keep up the good work!',
    relatedMetricTypes: [HealthMetricType.SLEEP],
    confidenceScore: 85,
    generatedAt: new Date().toISOString(),
    userAcknowledged: false
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for an anomaly detection health insight event (high priority)
 */
export const anomalyDetectionInsightEvent: HealthInsightGeneratedEventDto = {
  type: JourneyEvents.Health.INSIGHT_GENERATED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    insightId: uuidv4(),
    insightType: HealthInsightType.ANOMALY_DETECTION,
    title: 'Unusual Heart Rate Pattern',
    description: 'We detected an unusual heart rate pattern during your sleep last night. Consider discussing this with your healthcare provider.',
    relatedMetricTypes: [HealthMetricType.HEART_RATE],
    confidenceScore: 78,
    generatedAt: new Date().toISOString(),
    userAcknowledged: false
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a preventive recommendation health insight event
 */
export const preventiveRecommendationInsightEvent: HealthInsightGeneratedEventDto = {
  type: JourneyEvents.Health.INSIGHT_GENERATED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    insightId: uuidv4(),
    insightType: HealthInsightType.PREVENTIVE_RECOMMENDATION,
    title: 'Hydration Reminder',
    description: 'Based on your activity level and the current weather, remember to increase your water intake today.',
    relatedMetricTypes: [HealthMetricType.WATER_INTAKE, HealthMetricType.STEPS],
    confidenceScore: 65,
    generatedAt: new Date().toISOString(),
    userAcknowledged: true
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a goal suggestion health insight event
 */
export const goalSuggestionInsightEvent: HealthInsightGeneratedEventDto = {
  type: JourneyEvents.Health.INSIGHT_GENERATED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    insightId: uuidv4(),
    insightType: HealthInsightType.GOAL_SUGGESTION,
    title: 'New Step Goal Suggestion',
    description: 'You consistently exceed your current step goal. Consider increasing it to 12,000 steps for more challenge.',
    relatedMetricTypes: [HealthMetricType.STEPS],
    confidenceScore: 90,
    generatedAt: new Date().toISOString(),
    userAcknowledged: false
  },
  metadata: createHealthEventMetadata()
};

/**
 * Test fixture for a health risk assessment insight event (high priority)
 */
export const healthRiskAssessmentInsightEvent: HealthInsightGeneratedEventDto = {
  type: JourneyEvents.Health.INSIGHT_GENERATED,
  journey: 'health',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    insightId: uuidv4(),
    insightType: HealthInsightType.HEALTH_RISK_ASSESSMENT,
    title: 'Blood Pressure Risk Assessment',
    description: 'Your blood pressure readings have been consistently elevated over the past two weeks. This may indicate hypertension risk.',
    relatedMetricTypes: [HealthMetricType.BLOOD_PRESSURE],
    confidenceScore: 82,
    generatedAt: new Date().toISOString(),
    userAcknowledged: false
  },
  metadata: createHealthEventMetadata()
};

/**
 * Collection of all health metric events for easy import
 */
export const healthMetricEvents = {
  heartRateMetricEvent,
  bloodPressureMetricEvent,
  weightMetricEvent,
  stepsMetricEvent,
  sleepMetricEvent,
  bloodGlucoseMetricEvent,
  oxygenSaturationMetricEvent
};

/**
 * Collection of all health goal events for easy import
 */
export const healthGoalEvents = {
  stepsGoalAchievedEvent,
  weightGoalPartialEvent,
  sleepGoalAchievedEvent,
  bloodPressureGoalAchievedEvent
};

/**
 * Collection of all device synchronization events for easy import
 */
export const deviceSyncEvents = {
  smartwatchSyncEvent,
  bloodPressureMonitorSyncEvent,
  failedGlucoseMonitorSyncEvent,
  scaleSyncEvent
};

/**
 * Collection of all health insight events for easy import
 */
export const healthInsightEvents = {
  trendAnalysisInsightEvent,
  anomalyDetectionInsightEvent,
  preventiveRecommendationInsightEvent,
  goalSuggestionInsightEvent,
  healthRiskAssessmentInsightEvent
};

/**
 * Collection of all health events for easy import
 */
export const allHealthEvents = {
  ...healthMetricEvents,
  ...healthGoalEvents,
  ...deviceSyncEvents,
  ...healthInsightEvents
};