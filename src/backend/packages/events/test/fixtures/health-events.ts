/**
 * @file Health Journey Event Test Fixtures
 * @description Provides standardized test fixtures for health-related events in the gamification system.
 * These fixtures include health metric recording, goal achievement, health insights, and device synchronization events.
 * They are used for testing gamification rules, achievement processing, and notifications related to the Health journey.
 */

import { 
  EventType, 
  EventJourney, 
  GamificationEvent,
  HealthMetricRecordedPayload,
  HealthGoalPayload,
  HealthGoalAchievedPayload,
  HealthGoalStreakPayload,
  DeviceEventPayload
} from '../../../interfaces/gamification/events';

import {
  GoalType,
  GoalStatus,
  GoalPeriod,
  MetricType,
  MetricSource,
  DeviceType,
  ConnectionStatus
} from '../../../interfaces/journey/health';

/**
 * Creates a base gamification event with common properties
 * 
 * @param type - The event type
 * @param userId - The user ID associated with the event
 * @param payload - The event payload
 * @returns A gamification event with common properties set
 */
const createBaseEvent = <T>(type: EventType, userId: string, payload: T): GamificationEvent => ({
  eventId: `test-event-${Math.random().toString(36).substring(2, 10)}`,
  type,
  userId,
  journey: EventJourney.HEALTH,
  payload: payload as any,
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'health-service',
  correlationId: `corr-${Math.random().toString(36).substring(2, 10)}`
});

// ===== HEALTH METRIC RECORDED EVENTS =====

/**
 * Creates a HEALTH_METRIC_RECORDED event for heart rate
 * 
 * @param userId - The user ID
 * @param value - The heart rate value in bpm
 * @param source - The source of the metric (default: manual entry)
 * @returns A gamification event for heart rate recording
 */
export const createHeartRateRecordedEvent = (
  userId: string,
  value: number,
  source: MetricSource = MetricSource.MANUAL_ENTRY
): GamificationEvent => {
  const payload: HealthMetricRecordedPayload = {
    timestamp: new Date().toISOString(),
    metricType: MetricType.HEART_RATE,
    value,
    unit: 'bpm',
    source,
    isWithinHealthyRange: value >= 60 && value <= 100
  };
  
  return createBaseEvent(EventType.HEALTH_METRIC_RECORDED, userId, payload);
};

/**
 * Creates a HEALTH_METRIC_RECORDED event for blood pressure
 * 
 * @param userId - The user ID
 * @param systolic - The systolic blood pressure value
 * @param diastolic - The diastolic blood pressure value
 * @param source - The source of the metric (default: manual entry)
 * @returns A gamification event for blood pressure recording
 */
export const createBloodPressureRecordedEvent = (
  userId: string,
  systolic: number,
  diastolic: number,
  source: MetricSource = MetricSource.MANUAL_ENTRY
): GamificationEvent => {
  const payload: HealthMetricRecordedPayload = {
    timestamp: new Date().toISOString(),
    metricType: MetricType.BLOOD_PRESSURE,
    value: systolic, // Primary value is systolic
    unit: 'mmHg',
    source,
    metadata: {
      diastolic,
      combined: `${systolic}/${diastolic}`
    },
    isWithinHealthyRange: systolic <= 120 && diastolic <= 80
  };
  
  return createBaseEvent(EventType.HEALTH_METRIC_RECORDED, userId, payload);
};

/**
 * Creates a HEALTH_METRIC_RECORDED event for blood glucose
 * 
 * @param userId - The user ID
 * @param value - The blood glucose value in mg/dL
 * @param source - The source of the metric (default: manual entry)
 * @returns A gamification event for blood glucose recording
 */
export const createBloodGlucoseRecordedEvent = (
  userId: string,
  value: number,
  source: MetricSource = MetricSource.MANUAL_ENTRY
): GamificationEvent => {
  const payload: HealthMetricRecordedPayload = {
    timestamp: new Date().toISOString(),
    metricType: MetricType.BLOOD_GLUCOSE,
    value,
    unit: 'mg/dL',
    source,
    isWithinHealthyRange: value >= 70 && value <= 100
  };
  
  return createBaseEvent(EventType.HEALTH_METRIC_RECORDED, userId, payload);
};

/**
 * Creates a HEALTH_METRIC_RECORDED event for steps
 * 
 * @param userId - The user ID
 * @param value - The step count
 * @param source - The source of the metric (default: wearable device)
 * @returns A gamification event for step count recording
 */
export const createStepsRecordedEvent = (
  userId: string,
  value: number,
  source: MetricSource = MetricSource.WEARABLE_DEVICE
): GamificationEvent => {
  const payload: HealthMetricRecordedPayload = {
    timestamp: new Date().toISOString(),
    metricType: MetricType.STEPS,
    value,
    unit: 'steps',
    source,
    isWithinHealthyRange: value >= 5000
  };
  
  return createBaseEvent(EventType.HEALTH_METRIC_RECORDED, userId, payload);
};

/**
 * Creates a HEALTH_METRIC_RECORDED event for weight
 * 
 * @param userId - The user ID
 * @param value - The weight value in kg
 * @param source - The source of the metric (default: smart scale)
 * @returns A gamification event for weight recording
 */
export const createWeightRecordedEvent = (
  userId: string,
  value: number,
  source: MetricSource = MetricSource.MEDICAL_DEVICE
): GamificationEvent => {
  const payload: HealthMetricRecordedPayload = {
    timestamp: new Date().toISOString(),
    metricType: MetricType.WEIGHT,
    value,
    unit: 'kg',
    source,
    // Weight healthy range depends on height, age, etc., so we don't set isWithinHealthyRange
  };
  
  return createBaseEvent(EventType.HEALTH_METRIC_RECORDED, userId, payload);
};

/**
 * Creates a HEALTH_METRIC_RECORDED event for sleep duration
 * 
 * @param userId - The user ID
 * @param value - The sleep duration in hours
 * @param source - The source of the metric (default: wearable device)
 * @returns A gamification event for sleep duration recording
 */
export const createSleepRecordedEvent = (
  userId: string,
  value: number,
  source: MetricSource = MetricSource.WEARABLE_DEVICE
): GamificationEvent => {
  const payload: HealthMetricRecordedPayload = {
    timestamp: new Date().toISOString(),
    metricType: MetricType.SLEEP,
    value,
    unit: 'hours',
    source,
    isWithinHealthyRange: value >= 7 && value <= 9,
    metadata: {
      deepSleepMinutes: Math.round(value * 60 * 0.25), // 25% deep sleep
      remSleepMinutes: Math.round(value * 60 * 0.2),    // 20% REM sleep
      lightSleepMinutes: Math.round(value * 60 * 0.55)  // 55% light sleep
    }
  };
  
  return createBaseEvent(EventType.HEALTH_METRIC_RECORDED, userId, payload);
};

// ===== HEALTH GOAL EVENTS =====

/**
 * Creates a HEALTH_GOAL_CREATED event
 * 
 * @param userId - The user ID
 * @param goalType - The type of health goal
 * @param targetValue - The target value for the goal
 * @param period - The period for the goal (default: daily)
 * @returns A gamification event for goal creation
 */
export const createHealthGoalCreatedEvent = (
  userId: string,
  goalType: GoalType,
  targetValue: number,
  period: GoalPeriod = GoalPeriod.DAILY
): GamificationEvent => {
  const goalId = `goal-${Math.random().toString(36).substring(2, 10)}`;
  let unit = 'steps';
  
  // Set appropriate unit based on goal type
  switch (goalType) {
    case GoalType.STEPS:
      unit = 'steps';
      break;
    case GoalType.SLEEP:
      unit = 'hours';
      break;
    case GoalType.WATER:
      unit = 'ml';
      break;
    case GoalType.WEIGHT:
      unit = 'kg';
      break;
    case GoalType.EXERCISE:
      unit = 'minutes';
      break;
    case GoalType.HEART_RATE:
      unit = 'bpm';
      break;
    case GoalType.BLOOD_PRESSURE:
      unit = 'mmHg';
      break;
    case GoalType.BLOOD_GLUCOSE:
      unit = 'mg/dL';
      break;
    default:
      unit = 'units';
  }
  
  const payload: HealthGoalPayload = {
    timestamp: new Date().toISOString(),
    goalId,
    goalType,
    targetValue,
    unit,
    period
  };
  
  return createBaseEvent(EventType.HEALTH_GOAL_CREATED, userId, payload);
};

/**
 * Creates a HEALTH_GOAL_UPDATED event
 * 
 * @param userId - The user ID
 * @param goalId - The ID of the goal being updated
 * @param goalType - The type of health goal
 * @param targetValue - The new target value for the goal
 * @param period - The period for the goal (default: daily)
 * @returns A gamification event for goal update
 */
export const createHealthGoalUpdatedEvent = (
  userId: string,
  goalId: string,
  goalType: GoalType,
  targetValue: number,
  period: GoalPeriod = GoalPeriod.DAILY
): GamificationEvent => {
  let unit = 'steps';
  
  // Set appropriate unit based on goal type
  switch (goalType) {
    case GoalType.STEPS:
      unit = 'steps';
      break;
    case GoalType.SLEEP:
      unit = 'hours';
      break;
    case GoalType.WATER:
      unit = 'ml';
      break;
    case GoalType.WEIGHT:
      unit = 'kg';
      break;
    case GoalType.EXERCISE:
      unit = 'minutes';
      break;
    case GoalType.HEART_RATE:
      unit = 'bpm';
      break;
    case GoalType.BLOOD_PRESSURE:
      unit = 'mmHg';
      break;
    case GoalType.BLOOD_GLUCOSE:
      unit = 'mg/dL';
      break;
    default:
      unit = 'units';
  }
  
  const payload: HealthGoalPayload = {
    timestamp: new Date().toISOString(),
    goalId,
    goalType,
    targetValue,
    unit,
    period,
    metadata: {
      previousTargetValue: targetValue - Math.floor(Math.random() * 10) // Simulate a change
    }
  };
  
  return createBaseEvent(EventType.HEALTH_GOAL_UPDATED, userId, payload);
};

/**
 * Creates a HEALTH_GOAL_ACHIEVED event
 * 
 * @param userId - The user ID
 * @param goalId - The ID of the achieved goal
 * @param goalType - The type of health goal
 * @param targetValue - The target value that was achieved
 * @param isFirstTimeAchievement - Whether this is the first time achieving this goal
 * @returns A gamification event for goal achievement
 */
export const createHealthGoalAchievedEvent = (
  userId: string,
  goalId: string,
  goalType: GoalType,
  targetValue: number,
  isFirstTimeAchievement: boolean = false
): GamificationEvent => {
  let unit = 'steps';
  
  // Set appropriate unit based on goal type
  switch (goalType) {
    case GoalType.STEPS:
      unit = 'steps';
      break;
    case GoalType.SLEEP:
      unit = 'hours';
      break;
    case GoalType.WATER:
      unit = 'ml';
      break;
    case GoalType.WEIGHT:
      unit = 'kg';
      break;
    case GoalType.EXERCISE:
      unit = 'minutes';
      break;
    case GoalType.HEART_RATE:
      unit = 'bpm';
      break;
    case GoalType.BLOOD_PRESSURE:
      unit = 'mmHg';
      break;
    case GoalType.BLOOD_GLUCOSE:
      unit = 'mg/dL';
      break;
    default:
      unit = 'units';
  }
  
  const payload: HealthGoalAchievedPayload = {
    timestamp: new Date().toISOString(),
    goalId,
    goalType,
    targetValue,
    unit,
    period: GoalPeriod.DAILY,
    completionPercentage: 100,
    isFirstTimeAchievement
  };
  
  return createBaseEvent(EventType.HEALTH_GOAL_ACHIEVED, userId, payload);
};

/**
 * Creates a HEALTH_GOAL_STREAK_MAINTAINED event
 * 
 * @param userId - The user ID
 * @param goalId - The ID of the goal with a streak
 * @param goalType - The type of health goal
 * @param streakCount - The current streak count
 * @returns A gamification event for goal streak maintenance
 */
export const createHealthGoalStreakEvent = (
  userId: string,
  goalId: string,
  goalType: GoalType,
  streakCount: number
): GamificationEvent => {
  const payload: HealthGoalStreakPayload = {
    timestamp: new Date().toISOString(),
    goalId,
    goalType,
    streakCount
  };
  
  return createBaseEvent(EventType.HEALTH_GOAL_STREAK_MAINTAINED, userId, payload);
};

// ===== DEVICE EVENTS =====

/**
 * Creates a DEVICE_CONNECTED event
 * 
 * @param userId - The user ID
 * @param deviceType - The type of device connected
 * @param manufacturer - The device manufacturer
 * @returns A gamification event for device connection
 */
export const createDeviceConnectedEvent = (
  userId: string,
  deviceType: DeviceType,
  manufacturer: string = 'Generic'
): GamificationEvent => {
  const deviceId = `device-${Math.random().toString(36).substring(2, 10)}`;
  
  const payload: DeviceEventPayload = {
    timestamp: new Date().toISOString(),
    deviceId,
    deviceType,
    manufacturer
  };
  
  return createBaseEvent(EventType.DEVICE_CONNECTED, userId, payload);
};

/**
 * Creates a DEVICE_SYNCED event
 * 
 * @param userId - The user ID
 * @param deviceId - The ID of the synced device
 * @param deviceType - The type of device synced
 * @param manufacturer - The device manufacturer
 * @param metricCount - The number of metrics synced
 * @returns A gamification event for device synchronization
 */
export const createDeviceSyncedEvent = (
  userId: string,
  deviceId: string,
  deviceType: DeviceType,
  manufacturer: string = 'Generic',
  metricCount: number = 1
): GamificationEvent => {
  const payload: DeviceEventPayload = {
    timestamp: new Date().toISOString(),
    deviceId,
    deviceType,
    manufacturer,
    metricCount
  };
  
  return createBaseEvent(EventType.DEVICE_SYNCED, userId, payload);
};

// ===== HEALTH INSIGHT EVENTS =====

/**
 * Creates a HEALTH_INSIGHT_GENERATED event
 * 
 * @param userId - The user ID
 * @param insightType - The type of health insight
 * @param relatedMetrics - Array of metric types related to this insight
 * @returns A gamification event for health insight generation
 */
export const createHealthInsightGeneratedEvent = (
  userId: string,
  insightType: string,
  relatedMetrics: MetricType[] = []
): GamificationEvent => {
  const payload = {
    timestamp: new Date().toISOString(),
    insightType,
    insightId: `insight-${Math.random().toString(36).substring(2, 10)}`,
    relatedMetrics,
    metadata: {
      severity: Math.floor(Math.random() * 3) + 1, // 1-3 severity
      requiresAction: Math.random() > 0.7 // 30% chance of requiring action
    }
  };
  
  return createBaseEvent(EventType.HEALTH_INSIGHT_GENERATED, userId, payload);
};

// ===== HEALTH ASSESSMENT EVENTS =====

/**
 * Creates a HEALTH_ASSESSMENT_COMPLETED event
 * 
 * @param userId - The user ID
 * @param assessmentType - The type of health assessment
 * @param score - The assessment score
 * @returns A gamification event for health assessment completion
 */
export const createHealthAssessmentCompletedEvent = (
  userId: string,
  assessmentType: string,
  score: number
): GamificationEvent => {
  const payload = {
    timestamp: new Date().toISOString(),
    assessmentType,
    assessmentId: `assessment-${Math.random().toString(36).substring(2, 10)}`,
    score,
    metadata: {
      completionTimeSeconds: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
      questionCount: Math.floor(Math.random() * 20) + 5, // 5-25 questions
      recommendations: Math.random() > 0.5 ? ['Increase water intake', 'Improve sleep habits'] : ['Exercise more frequently']
    }
  };
  
  return createBaseEvent(EventType.HEALTH_ASSESSMENT_COMPLETED, userId, payload);
};

// ===== MEDICAL EVENT RECORDED EVENTS =====

/**
 * Creates a MEDICAL_EVENT_RECORDED event
 * 
 * @param userId - The user ID
 * @param eventType - The type of medical event
 * @param provider - The healthcare provider associated with the event
 * @returns A gamification event for medical event recording
 */
export const createMedicalEventRecordedEvent = (
  userId: string,
  eventType: string,
  provider: string = 'Unknown Provider'
): GamificationEvent => {
  const payload = {
    timestamp: new Date().toISOString(),
    medicalEventId: `med-event-${Math.random().toString(36).substring(2, 10)}`,
    eventType,
    provider,
    metadata: {
      hasDocuments: Math.random() > 0.5, // 50% chance of having documents
      documentCount: Math.floor(Math.random() * 3) + 1, // 1-3 documents
      isEmergency: Math.random() > 0.9 // 10% chance of being emergency
    }
  };
  
  return createBaseEvent(EventType.MEDICAL_EVENT_RECORDED, userId, payload);
};

// ===== COLLECTIONS OF EVENTS FOR COMMON TESTING SCENARIOS =====

/**
 * Collection of health metric events for a single user
 * 
 * @param userId - The user ID
 * @returns An array of health metric events
 */
export const createHealthMetricEventsCollection = (userId: string): GamificationEvent[] => [
  createHeartRateRecordedEvent(userId, 72),
  createBloodPressureRecordedEvent(userId, 120, 80),
  createBloodGlucoseRecordedEvent(userId, 85),
  createStepsRecordedEvent(userId, 8500),
  createWeightRecordedEvent(userId, 70.5),
  createSleepRecordedEvent(userId, 7.5)
];

/**
 * Collection of health goal events for a single user
 * 
 * @param userId - The user ID
 * @returns An array of health goal events
 */
export const createHealthGoalEventsCollection = (userId: string): GamificationEvent[] => {
  const stepsGoalId = `goal-steps-${Math.random().toString(36).substring(2, 10)}`;
  const sleepGoalId = `goal-sleep-${Math.random().toString(36).substring(2, 10)}`;
  const waterGoalId = `goal-water-${Math.random().toString(36).substring(2, 10)}`;
  
  return [
    createHealthGoalCreatedEvent(userId, GoalType.STEPS, 10000),
    createHealthGoalCreatedEvent(userId, GoalType.SLEEP, 8, GoalPeriod.DAILY),
    createHealthGoalCreatedEvent(userId, GoalType.WATER, 2000, GoalPeriod.DAILY),
    createHealthGoalAchievedEvent(userId, stepsGoalId, GoalType.STEPS, 10000, true),
    createHealthGoalStreakEvent(userId, stepsGoalId, GoalType.STEPS, 3),
    createHealthGoalUpdatedEvent(userId, sleepGoalId, GoalType.SLEEP, 7.5),
    createHealthGoalAchievedEvent(userId, waterGoalId, GoalType.WATER, 2000, false),
    createHealthGoalStreakEvent(userId, waterGoalId, GoalType.WATER, 5)
  ];
};

/**
 * Collection of device events for a single user
 * 
 * @param userId - The user ID
 * @returns An array of device events
 */
export const createDeviceEventsCollection = (userId: string): GamificationEvent[] => {
  const smartwatchId = `device-watch-${Math.random().toString(36).substring(2, 10)}`;
  const bpMonitorId = `device-bp-${Math.random().toString(36).substring(2, 10)}`;
  const scaleId = `device-scale-${Math.random().toString(36).substring(2, 10)}`;
  
  return [
    createDeviceConnectedEvent(userId, DeviceType.SMARTWATCH, 'Apple'),
    createDeviceConnectedEvent(userId, DeviceType.BLOOD_PRESSURE_MONITOR, 'Omron'),
    createDeviceConnectedEvent(userId, DeviceType.SMART_SCALE, 'Withings'),
    createDeviceSyncedEvent(userId, smartwatchId, DeviceType.SMARTWATCH, 'Apple', 5),
    createDeviceSyncedEvent(userId, bpMonitorId, DeviceType.BLOOD_PRESSURE_MONITOR, 'Omron', 1),
    createDeviceSyncedEvent(userId, scaleId, DeviceType.SMART_SCALE, 'Withings', 2)
  ];
};

/**
 * Collection of insight and assessment events for a single user
 * 
 * @param userId - The user ID
 * @returns An array of insight and assessment events
 */
export const createInsightAndAssessmentEventsCollection = (userId: string): GamificationEvent[] => [
  createHealthInsightGeneratedEvent(userId, 'sleep_pattern', [MetricType.SLEEP]),
  createHealthInsightGeneratedEvent(userId, 'activity_trend', [MetricType.STEPS, MetricType.EXERCISE]),
  createHealthInsightGeneratedEvent(userId, 'heart_rate_variability', [MetricType.HEART_RATE]),
  createHealthAssessmentCompletedEvent(userId, 'general_health', 85),
  createHealthAssessmentCompletedEvent(userId, 'stress_assessment', 65),
  createMedicalEventRecordedEvent(userId, 'annual_checkup', 'Dr. Smith')
];

/**
 * Creates a complete set of health events for a user
 * 
 * @param userId - The user ID
 * @returns An array of all health-related events
 */
export const createCompleteHealthEventSet = (userId: string): GamificationEvent[] => [
  ...createHealthMetricEventsCollection(userId),
  ...createHealthGoalEventsCollection(userId),
  ...createDeviceEventsCollection(userId),
  ...createInsightAndAssessmentEventsCollection(userId)
];