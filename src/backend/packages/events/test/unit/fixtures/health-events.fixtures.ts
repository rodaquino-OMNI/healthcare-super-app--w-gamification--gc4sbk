/**
 * @file health-events.fixtures.ts
 * @description Test fixtures for Health journey events in the AUSTA SuperApp.
 * 
 * This file provides a comprehensive set of test fixtures for health-related events,
 * including health metrics recording, goal achievements, health insights, and device
 * synchronization. These fixtures are used for testing event validation, processing,
 * and transformation logic in the events package.
 *
 * @module events/test/fixtures
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  HealthMetricRecordedEventDto,
  HealthGoalAchievedEventDto,
  HealthInsightGeneratedEventDto,
  DeviceSynchronizedEventDto,
  HealthMetricData,
  HealthGoalData,
  HealthInsightData,
  DeviceSyncData,
  HealthMetricType,
  HealthGoalType,
  HealthInsightType,
  DeviceType
} from '../../../src/dto/health-event.dto';
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';

// Common test user IDs
const TEST_USER_IDS = {
  standard: '550e8400-e29b-41d4-a716-446655440000',
  premium: '550e8400-e29b-41d4-a716-446655440001',
  new: '550e8400-e29b-41d4-a716-446655440002',
  inactive: '550e8400-e29b-41d4-a716-446655440003',
  withDevices: '550e8400-e29b-41d4-a716-446655440004',
};

// Common test device IDs
const TEST_DEVICE_IDS = {
  smartwatch: 'device-sw-' + uuidv4().substring(0, 8),
  bloodPressureMonitor: 'device-bp-' + uuidv4().substring(0, 8),
  glucoseMonitor: 'device-gm-' + uuidv4().substring(0, 8),
  scale: 'device-sc-' + uuidv4().substring(0, 8),
  sleepTracker: 'device-st-' + uuidv4().substring(0, 8),
};

// Common test goal IDs
const TEST_GOAL_IDS = {
  steps: 'goal-steps-' + uuidv4().substring(0, 8),
  weight: 'goal-weight-' + uuidv4().substring(0, 8),
  sleep: 'goal-sleep-' + uuidv4().substring(0, 8),
  bloodPressure: 'goal-bp-' + uuidv4().substring(0, 8),
  bloodGlucose: 'goal-bg-' + uuidv4().substring(0, 8),
  activity: 'goal-activity-' + uuidv4().substring(0, 8),
  water: 'goal-water-' + uuidv4().substring(0, 8),
};

// Common test insight IDs
const TEST_INSIGHT_IDS = {
  anomaly: 'insight-anomaly-' + uuidv4().substring(0, 8),
  trend: 'insight-trend-' + uuidv4().substring(0, 8),
  recommendation: 'insight-rec-' + uuidv4().substring(0, 8),
  suggestion: 'insight-sug-' + uuidv4().substring(0, 8),
  risk: 'insight-risk-' + uuidv4().substring(0, 8),
};

/**
 * Creates a base event object with common properties.
 * 
 * @param userId The ID of the user associated with the event
 * @returns A partial event object with common properties
 */
const createBaseEvent = (userId: string) => ({
  userId,
  timestamp: new Date().toISOString(),
  metadata: {
    correlationId: uuidv4(),
    source: 'health-service',
    version: '1.0.0',
  },
});

/**
 * Generates a set of health metric recorded event fixtures for testing.
 * 
 * @returns An object containing various health metric recorded event fixtures
 */
export const healthMetricRecordedFixtures = {
  /**
   * Valid heart rate metric with normal value
   */
  validHeartRate: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 72,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      notes: 'Resting heart rate',
      deviceId: TEST_DEVICE_IDS.smartwatch,
    } as HealthMetricData,
  }),

  /**
   * Valid blood pressure metric with normal values
   */
  validBloodPressure: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.BLOOD_PRESSURE,
      value: 120, // Systolic value (would be 120/80 in real implementation)
      unit: 'mmHg',
      recordedAt: new Date().toISOString(),
      notes: 'Morning measurement',
      deviceId: TEST_DEVICE_IDS.bloodPressureMonitor,
    } as HealthMetricData,
  }),

  /**
   * Valid blood glucose metric with normal value
   */
  validBloodGlucose: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.BLOOD_GLUCOSE,
      value: 95,
      unit: 'mg/dL',
      recordedAt: new Date().toISOString(),
      notes: 'Fasting blood glucose',
      deviceId: TEST_DEVICE_IDS.glucoseMonitor,
    } as HealthMetricData,
  }),

  /**
   * Valid steps metric with high value
   */
  validSteps: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.STEPS,
      value: 12500,
      unit: 'steps',
      recordedAt: new Date().toISOString(),
      deviceId: TEST_DEVICE_IDS.smartwatch,
    } as HealthMetricData,
  }),

  /**
   * Valid weight metric
   */
  validWeight: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.WEIGHT,
      value: 75.5,
      unit: 'kg',
      recordedAt: new Date().toISOString(),
      deviceId: TEST_DEVICE_IDS.scale,
    } as HealthMetricData,
  }),

  /**
   * Valid sleep metric
   */
  validSleep: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.SLEEP,
      value: 7.5,
      unit: 'hours',
      recordedAt: new Date().toISOString(),
      notes: 'Good quality sleep',
      deviceId: TEST_DEVICE_IDS.sleepTracker,
    } as HealthMetricData,
  }),

  /**
   * Valid oxygen saturation metric
   */
  validOxygenSaturation: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.OXYGEN_SATURATION,
      value: 98,
      unit: '%',
      recordedAt: new Date().toISOString(),
      deviceId: TEST_DEVICE_IDS.smartwatch,
    } as HealthMetricData,
  }),

  /**
   * Valid water intake metric
   */
  validWaterIntake: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.WATER_INTAKE,
      value: 2500,
      unit: 'ml',
      recordedAt: new Date().toISOString(),
    } as HealthMetricData,
  }),

  /**
   * Valid temperature metric
   */
  validTemperature: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.TEMPERATURE,
      value: 36.8,
      unit: '°C',
      recordedAt: new Date().toISOString(),
    } as HealthMetricData,
  }),

  /**
   * Invalid heart rate metric with value outside acceptable range
   */
  invalidHeartRate: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 250, // Outside acceptable range
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
    } as HealthMetricData,
  }),

  /**
   * Invalid blood glucose metric with value outside acceptable range
   */
  invalidBloodGlucose: (): HealthMetricRecordedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.BLOOD_GLUCOSE,
      value: -10, // Negative value, which is invalid
      unit: 'mg/dL',
      recordedAt: new Date().toISOString(),
    } as HealthMetricData,
  }),

  /**
   * Invalid metric with missing required fields
   */
  invalidMissingFields: (): Partial<HealthMetricRecordedEventDto> => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: {
      metricType: HealthMetricType.STEPS,
      // Missing value and unit
      recordedAt: new Date().toISOString(),
    } as Partial<HealthMetricData>,
  }),

  /**
   * Batch of multiple valid metrics for testing bulk processing
   */
  batchValidMetrics: (): HealthMetricRecordedEventDto[] => [
    healthMetricRecordedFixtures.validHeartRate(),
    healthMetricRecordedFixtures.validBloodPressure(),
    healthMetricRecordedFixtures.validSteps(),
    healthMetricRecordedFixtures.validWeight(),
    healthMetricRecordedFixtures.validSleep(),
  ],
};

/**
 * Generates a set of health goal achieved event fixtures for testing.
 * 
 * @returns An object containing various health goal achieved event fixtures
 */
export const healthGoalAchievedFixtures = {
  /**
   * Valid steps goal achieved with 100% completion
   */
  validStepsGoalComplete: (): HealthGoalAchievedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      goalId: TEST_GOAL_IDS.steps,
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily for a week',
      targetValue: 10000,
      unit: 'steps',
      achievedAt: new Date().toISOString(),
      progressPercentage: 100,
    } as HealthGoalData,
  }),

  /**
   * Valid weight goal achieved with 100% completion
   */
  validWeightGoalComplete: (): HealthGoalAchievedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      goalId: TEST_GOAL_IDS.weight,
      goalType: HealthGoalType.WEIGHT_TARGET,
      description: 'Lose 5kg in 3 months',
      targetValue: 70,
      unit: 'kg',
      achievedAt: new Date().toISOString(),
      progressPercentage: 100,
    } as HealthGoalData,
  }),

  /**
   * Valid sleep goal achieved with 100% completion
   */
  validSleepGoalComplete: (): HealthGoalAchievedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      goalId: TEST_GOAL_IDS.sleep,
      goalType: HealthGoalType.SLEEP_DURATION,
      description: 'Sleep 8 hours every night for a month',
      targetValue: 8,
      unit: 'hours',
      achievedAt: new Date().toISOString(),
      progressPercentage: 100,
    } as HealthGoalData,
  }),

  /**
   * Valid blood pressure goal achieved with 100% completion
   */
  validBloodPressureGoalComplete: (): HealthGoalAchievedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      goalId: TEST_GOAL_IDS.bloodPressure,
      goalType: HealthGoalType.BLOOD_PRESSURE_MANAGEMENT,
      description: 'Maintain blood pressure below 130/85 for 3 months',
      achievedAt: new Date().toISOString(),
      progressPercentage: 100,
    } as HealthGoalData,
  }),

  /**
   * Valid water intake goal achieved with 100% completion
   */
  validWaterIntakeGoalComplete: (): HealthGoalAchievedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      goalId: TEST_GOAL_IDS.water,
      goalType: HealthGoalType.WATER_INTAKE,
      description: 'Drink 2.5 liters of water daily for a month',
      targetValue: 2500,
      unit: 'ml',
      achievedAt: new Date().toISOString(),
      progressPercentage: 100,
    } as HealthGoalData,
  }),

  /**
   * Valid steps goal with partial completion (75%)
   */
  validStepsGoalPartial: (): HealthGoalAchievedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      goalId: TEST_GOAL_IDS.steps,
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily for a week',
      targetValue: 10000,
      unit: 'steps',
      progressPercentage: 75,
    } as HealthGoalData,
  }),

  /**
   * Valid activity frequency goal with partial completion (50%)
   */
  validActivityGoalPartial: (): HealthGoalAchievedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      goalId: TEST_GOAL_IDS.activity,
      goalType: HealthGoalType.ACTIVITY_FREQUENCY,
      description: 'Exercise 3 times per week for a month',
      progressPercentage: 50,
    } as HealthGoalData,
  }),

  /**
   * Invalid goal with progress percentage outside valid range
   */
  invalidProgressPercentage: (): HealthGoalAchievedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      goalId: TEST_GOAL_IDS.steps,
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily for a week',
      targetValue: 10000,
      unit: 'steps',
      progressPercentage: 120, // Invalid: over 100%
    } as HealthGoalData,
  }),

  /**
   * Invalid goal with missing required fields
   */
  invalidMissingFields: (): Partial<HealthGoalAchievedEventDto> => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: {
      // Missing goalId and goalType
      description: 'Incomplete goal data',
      progressPercentage: 50,
    } as Partial<HealthGoalData>,
  }),

  /**
   * Batch of multiple valid goals for testing bulk processing
   */
  batchValidGoals: (): HealthGoalAchievedEventDto[] => [
    healthGoalAchievedFixtures.validStepsGoalComplete(),
    healthGoalAchievedFixtures.validWeightGoalComplete(),
    healthGoalAchievedFixtures.validSleepGoalComplete(),
    healthGoalAchievedFixtures.validBloodPressureGoalComplete(),
    healthGoalAchievedFixtures.validWaterIntakeGoalComplete(),
  ],
};

/**
 * Generates a set of health insight generated event fixtures for testing.
 * 
 * @returns An object containing various health insight generated event fixtures
 */
export const healthInsightGeneratedFixtures = {
  /**
   * Valid anomaly detection insight with high confidence
   */
  validAnomalyHighConfidence: (): HealthInsightGeneratedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: {
      insightId: TEST_INSIGHT_IDS.anomaly,
      insightType: HealthInsightType.ANOMALY_DETECTION,
      title: 'Unusual Heart Rate Pattern Detected',
      description: 'We noticed your heart rate has been elevated during rest for the past 3 days.',
      relatedMetricTypes: [HealthMetricType.HEART_RATE],
      confidenceScore: 85,
      generatedAt: new Date().toISOString(),
      userAcknowledged: false,
    } as HealthInsightData,
  }),

  /**
   * Valid trend analysis insight with medium confidence
   */
  validTrendMediumConfidence: (): HealthInsightGeneratedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: {
      insightId: TEST_INSIGHT_IDS.trend,
      insightType: HealthInsightType.TREND_ANALYSIS,
      title: 'Improving Sleep Pattern',
      description: 'Your sleep duration has been consistently improving over the past 2 weeks.',
      relatedMetricTypes: [HealthMetricType.SLEEP],
      confidenceScore: 65,
      generatedAt: new Date().toISOString(),
      userAcknowledged: false,
    } as HealthInsightData,
  }),

  /**
   * Valid preventive recommendation insight
   */
  validPreventiveRecommendation: (): HealthInsightGeneratedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: {
      insightId: TEST_INSIGHT_IDS.recommendation,
      insightType: HealthInsightType.PREVENTIVE_RECOMMENDATION,
      title: 'Hydration Reminder',
      description: 'Based on your activity level and the current weather, consider increasing your water intake.',
      relatedMetricTypes: [HealthMetricType.WATER_INTAKE, HealthMetricType.STEPS],
      confidenceScore: 70,
      generatedAt: new Date().toISOString(),
      userAcknowledged: false,
    } as HealthInsightData,
  }),

  /**
   * Valid goal suggestion insight
   */
  validGoalSuggestion: (): HealthInsightGeneratedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: {
      insightId: TEST_INSIGHT_IDS.suggestion,
      insightType: HealthInsightType.GOAL_SUGGESTION,
      title: 'New Step Goal Suggestion',
      description: 'You\'ve been consistently exceeding your current step goal. Consider setting a more challenging target.',
      relatedMetricTypes: [HealthMetricType.STEPS],
      confidenceScore: 90,
      generatedAt: new Date().toISOString(),
      userAcknowledged: false,
    } as HealthInsightData,
  }),

  /**
   * Valid health risk assessment insight with high confidence
   */
  validRiskAssessmentHighConfidence: (): HealthInsightGeneratedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: {
      insightId: TEST_INSIGHT_IDS.risk,
      insightType: HealthInsightType.HEALTH_RISK_ASSESSMENT,
      title: 'Blood Pressure Risk Assessment',
      description: 'Your blood pressure readings have been consistently elevated. This may increase your risk of cardiovascular issues.',
      relatedMetricTypes: [HealthMetricType.BLOOD_PRESSURE],
      confidenceScore: 80,
      generatedAt: new Date().toISOString(),
      userAcknowledged: false,
    } as HealthInsightData,
  }),

  /**
   * Valid acknowledged insight
   */
  validAcknowledgedInsight: (): HealthInsightGeneratedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: {
      insightId: TEST_INSIGHT_IDS.anomaly,
      insightType: HealthInsightType.ANOMALY_DETECTION,
      title: 'Unusual Heart Rate Pattern Detected',
      description: 'We noticed your heart rate has been elevated during rest for the past 3 days.',
      relatedMetricTypes: [HealthMetricType.HEART_RATE],
      confidenceScore: 85,
      generatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      userAcknowledged: true,
    } as HealthInsightData,
  }),

  /**
   * Invalid insight with missing required fields
   */
  invalidMissingFields: (): Partial<HealthInsightGeneratedEventDto> => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: {
      // Missing insightId and insightType
      title: 'Incomplete Insight',
      description: 'This insight is missing required fields.',
      confidenceScore: 50,
    } as Partial<HealthInsightData>,
  }),

  /**
   * Invalid insight with confidence score outside valid range
   */
  invalidConfidenceScore: (): HealthInsightGeneratedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.standard),
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: {
      insightId: TEST_INSIGHT_IDS.anomaly,
      insightType: HealthInsightType.ANOMALY_DETECTION,
      title: 'Invalid Confidence Score',
      description: 'This insight has an invalid confidence score.',
      confidenceScore: 120, // Invalid: over 100%
      generatedAt: new Date().toISOString(),
    } as HealthInsightData,
  }),

  /**
   * Batch of multiple valid insights for testing bulk processing
   */
  batchValidInsights: (): HealthInsightGeneratedEventDto[] => [
    healthInsightGeneratedFixtures.validAnomalyHighConfidence(),
    healthInsightGeneratedFixtures.validTrendMediumConfidence(),
    healthInsightGeneratedFixtures.validPreventiveRecommendation(),
    healthInsightGeneratedFixtures.validGoalSuggestion(),
    healthInsightGeneratedFixtures.validRiskAssessmentHighConfidence(),
  ],
};

/**
 * Generates a set of device synchronized event fixtures for testing.
 * 
 * @returns An object containing various device synchronized event fixtures
 */
export const deviceSynchronizedFixtures = {
  /**
   * Valid successful smartwatch synchronization
   */
  validSmartwatchSuccessful: (): DeviceSynchronizedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.withDevices),
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: {
      deviceId: TEST_DEVICE_IDS.smartwatch,
      deviceType: DeviceType.SMARTWATCH,
      deviceName: 'Apple Watch Series 7',
      syncedAt: new Date().toISOString(),
      syncSuccessful: true,
      dataPointsCount: 245,
      metricTypes: [
        HealthMetricType.HEART_RATE,
        HealthMetricType.STEPS,
        HealthMetricType.SLEEP,
        HealthMetricType.OXYGEN_SATURATION,
      ],
    } as DeviceSyncData,
  }),

  /**
   * Valid successful blood pressure monitor synchronization
   */
  validBloodPressureMonitorSuccessful: (): DeviceSynchronizedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.withDevices),
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: {
      deviceId: TEST_DEVICE_IDS.bloodPressureMonitor,
      deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
      deviceName: 'Omron X5',
      syncedAt: new Date().toISOString(),
      syncSuccessful: true,
      dataPointsCount: 12,
      metricTypes: [HealthMetricType.BLOOD_PRESSURE],
    } as DeviceSyncData,
  }),

  /**
   * Valid successful glucose monitor synchronization
   */
  validGlucoseMonitorSuccessful: (): DeviceSynchronizedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.withDevices),
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: {
      deviceId: TEST_DEVICE_IDS.glucoseMonitor,
      deviceType: DeviceType.GLUCOSE_MONITOR,
      deviceName: 'FreeStyle Libre',
      syncedAt: new Date().toISOString(),
      syncSuccessful: true,
      dataPointsCount: 96,
      metricTypes: [HealthMetricType.BLOOD_GLUCOSE],
    } as DeviceSyncData,
  }),

  /**
   * Valid successful scale synchronization
   */
  validScaleSuccessful: (): DeviceSynchronizedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.withDevices),
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: {
      deviceId: TEST_DEVICE_IDS.scale,
      deviceType: DeviceType.SCALE,
      deviceName: 'Withings Body+',
      syncedAt: new Date().toISOString(),
      syncSuccessful: true,
      dataPointsCount: 1,
      metricTypes: [HealthMetricType.WEIGHT],
    } as DeviceSyncData,
  }),

  /**
   * Valid failed smartwatch synchronization
   */
  validSmartwatchFailed: (): DeviceSynchronizedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.withDevices),
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: {
      deviceId: TEST_DEVICE_IDS.smartwatch,
      deviceType: DeviceType.SMARTWATCH,
      deviceName: 'Apple Watch Series 7',
      syncedAt: new Date().toISOString(),
      syncSuccessful: false,
      errorMessage: 'Bluetooth connection lost during sync',
    } as DeviceSyncData,
  }),

  /**
   * Valid failed blood pressure monitor synchronization
   */
  validBloodPressureMonitorFailed: (): DeviceSynchronizedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.withDevices),
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: {
      deviceId: TEST_DEVICE_IDS.bloodPressureMonitor,
      deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
      deviceName: 'Omron X5',
      syncedAt: new Date().toISOString(),
      syncSuccessful: false,
      errorMessage: 'Device battery too low for data transfer',
    } as DeviceSyncData,
  }),

  /**
   * Invalid device sync with missing required fields
   */
  invalidMissingFields: (): Partial<DeviceSynchronizedEventDto> => ({
    ...createBaseEvent(TEST_USER_IDS.withDevices),
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: {
      // Missing deviceId and deviceType
      deviceName: 'Incomplete Device Data',
      syncedAt: new Date().toISOString(),
      syncSuccessful: true,
    } as Partial<DeviceSyncData>,
  }),

  /**
   * Invalid device sync with inconsistent success/error state
   */
  invalidInconsistentState: (): DeviceSynchronizedEventDto => ({
    ...createBaseEvent(TEST_USER_IDS.withDevices),
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: {
      deviceId: TEST_DEVICE_IDS.smartwatch,
      deviceType: DeviceType.SMARTWATCH,
      deviceName: 'Apple Watch Series 7',
      syncedAt: new Date().toISOString(),
      syncSuccessful: true, // Success flag is true
      errorMessage: 'But there is an error message', // Inconsistent with success flag
    } as DeviceSyncData,
  }),

  /**
   * Batch of multiple valid device syncs for testing bulk processing
   */
  batchValidDeviceSyncs: (): DeviceSynchronizedEventDto[] => [
    deviceSynchronizedFixtures.validSmartwatchSuccessful(),
    deviceSynchronizedFixtures.validBloodPressureMonitorSuccessful(),
    deviceSynchronizedFixtures.validGlucoseMonitorSuccessful(),
    deviceSynchronizedFixtures.validScaleSuccessful(),
    deviceSynchronizedFixtures.validSmartwatchFailed(),
  ],
};

/**
 * Combined export of all health event fixtures for easier importing
 * 
 * @example
 * import { healthEventFixtures } from './health-events.fixtures';
 * 
 * const heartRateEvent = healthEventFixtures.metrics.validHeartRate();
 * const goalEvent = healthEventFixtures.goals.validStepsGoalComplete();
 */
export const healthEventFixtures = {
  metrics: healthMetricRecordedFixtures,
  goals: healthGoalAchievedFixtures,
  insights: healthInsightGeneratedFixtures,
  devices: deviceSynchronizedFixtures,
};