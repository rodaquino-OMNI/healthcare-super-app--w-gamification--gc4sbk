/**
 * @file health-journey-scenarios.ts
 * @description Contains complex end-to-end test scenarios for the Health journey in the gamification system.
 * Provides fixtures that simulate users completing health-related activities, triggering multiple gamification
 * events, and earning achievements. These scenarios combine user profiles, health events, rules, achievements,
 * and rewards to test the complete gamification flow for the Health journey.
 *
 * This file implements the following requirements from the technical specification:
 * - Integrate Health Journey events into the gamification engine
 * - Implement health metric recording events
 * - Create goal achievement event processing
 * - Implement device synchronization events
 * - Develop multi-journey achievement tracking
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  GamificationEvent,
  HealthEventType,
  CommonEventType,
  JourneyType,
  createEvent
} from '@austa/interfaces/gamification';
import { 
  IHealthMetricRecordedPayload,
  IGoalAchievedPayload,
  IGoalProgressUpdatedPayload,
  IDeviceConnectedPayload,
  IHealthInsightGeneratedPayload
} from '@austa/interfaces/gamification/events';
import { 
  MetricType,
  GoalType,
  IHealthGoal,
  IHealthMetric
} from '@austa/interfaces/journey/health';
import { achievementFixtures } from '../achievements.fixtures';
import { MOCK_USER_IDS, createTimestamp, createTestId } from '../events.fixtures';

/**
 * Helper function to create a health metric recorded event
 * @param userId User ID
 * @param metricType Type of health metric
 * @param value Metric value
 * @param unit Unit of measurement
 * @param source Source of the metric (device, manual entry, etc.)
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns A health metric recorded event
 */
export function createHealthMetricEvent(
  userId: string,
  metricType: MetricType,
  value: number,
  unit: string,
  source: string = 'manual',
  timestamp: string = createTimestamp()
): GamificationEvent {
  return {
    id: createTestId('health-metric', metricType),
    type: HealthEventType.HEALTH_METRIC_RECORDED,
    userId,
    payload: {
      data: {
        metricType,
        value,
        unit,
        source,
        recordedAt: timestamp,
      } as IHealthMetricRecordedPayload,
      metadata: {
        deviceId: source !== 'manual' ? `device-${uuidv4().substring(0, 8)}` : undefined,
        appVersion: '1.2.3',
        isManualEntry: source === 'manual'
      }
    },
    journey: JourneyType.HEALTH,
    timestamp,
    version: '1.0.0',
    correlationId: createTestId('correlation', `${metricType}-${Date.now()}`)
  };
}

/**
 * Helper function to create a goal achieved event
 * @param userId User ID
 * @param goalType Type of goal
 * @param targetValue Target value for the goal
 * @param actualValue Actual value achieved
 * @param streakCount Optional streak count
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns A goal achieved event
 */
export function createGoalAchievedEvent(
  userId: string,
  goalType: GoalType,
  targetValue: number,
  actualValue: number,
  streakCount: number = 1,
  timestamp: string = createTimestamp()
): GamificationEvent {
  const goalId = `goal-${uuidv4().substring(0, 8)}`;
  
  return {
    id: createTestId('goal-achieved', goalType),
    type: HealthEventType.GOAL_ACHIEVED,
    userId,
    payload: {
      data: {
        goalId,
        goalType,
        achievedAt: timestamp,
        targetValue,
        actualValue,
        streakCount
      } as IGoalAchievedPayload,
      metadata: {
        isFirstGoalOfType: streakCount === 1,
        relatedMetricId: `metric-${uuidv4().substring(0, 8)}`
      }
    },
    journey: JourneyType.HEALTH,
    timestamp,
    version: '1.0.0',
    correlationId: createTestId('correlation', `${goalType}-achieved-${Date.now()}`)
  };
}

/**
 * Helper function to create a goal progress updated event
 * @param userId User ID
 * @param goalType Type of goal
 * @param progressPercentage Progress percentage (0-100)
 * @param currentValue Current value
 * @param targetValue Target value
 * @param remainingDays Optional remaining days
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns A goal progress updated event
 */
export function createGoalProgressEvent(
  userId: string,
  goalType: GoalType,
  progressPercentage: number,
  currentValue: number,
  targetValue: number,
  remainingDays: number = 1,
  timestamp: string = createTimestamp()
): GamificationEvent {
  const goalId = `goal-${uuidv4().substring(0, 8)}`;
  
  return {
    id: createTestId('goal-progress', goalType),
    type: HealthEventType.GOAL_PROGRESS_UPDATED,
    userId,
    payload: {
      data: {
        goal: {
          id: goalId,
          type: goalType,
          targetValue,
          currentValue,
          startDate: createTimestamp(remainingDays + 7), // Goal started 7 days ago
          endDate: createTimestamp(remainingDays), // Goal ends in remaining days
          userId
        } as IHealthGoal,
        goalType,
        progressPercentage,
        currentValue,
        targetValue,
        remainingDays
      } as IGoalProgressUpdatedPayload,
      metadata: {
        isOnTrack: progressPercentage >= (100 - (remainingDays * 10)),
        relatedMetricId: `metric-${uuidv4().substring(0, 8)}`
      }
    },
    journey: JourneyType.HEALTH,
    timestamp,
    version: '1.0.0',
    correlationId: createTestId('correlation', `${goalType}-progress-${Date.now()}`)
  };
}

/**
 * Helper function to create a device connected event
 * @param userId User ID
 * @param deviceType Type of device
 * @param isFirstConnection Whether this is the first connection for this device
 * @param manufacturer Device manufacturer
 * @param model Device model
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns A device connected event
 */
export function createDeviceConnectedEvent(
  userId: string,
  deviceType: string,
  isFirstConnection: boolean = false,
  manufacturer: string = 'Apple',
  model: string = 'Watch Series 7',
  timestamp: string = createTimestamp()
): GamificationEvent {
  const deviceId = `device-${uuidv4().substring(0, 8)}`;
  
  return {
    id: createTestId('device-connected', deviceType),
    type: HealthEventType.DEVICE_CONNECTED,
    userId,
    payload: {
      data: {
        deviceId,
        deviceType,
        connectionTime: timestamp,
        isFirstConnection
      } as IDeviceConnectedPayload,
      metadata: {
        manufacturer,
        model,
        connectionMethod: 'Bluetooth'
      }
    },
    journey: JourneyType.HEALTH,
    timestamp,
    version: '1.0.0',
    correlationId: createTestId('correlation', `${deviceType}-connected-${Date.now()}`)
  };
}

/**
 * Helper function to create a health insight generated event
 * @param userId User ID
 * @param insightType Type of insight
 * @param relatedMetrics Related metrics
 * @param severity Severity level
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns A health insight generated event
 */
export function createHealthInsightEvent(
  userId: string,
  insightType: string,
  relatedMetrics: MetricType[],
  severity: 'low' | 'medium' | 'high' = 'medium',
  timestamp: string = createTimestamp()
): GamificationEvent {
  const insightId = `insight-${uuidv4().substring(0, 8)}`;
  
  return {
    id: createTestId('health-insight', insightType),
    type: HealthEventType.HEALTH_INSIGHT_GENERATED,
    userId,
    payload: {
      data: {
        insightId,
        insightType,
        relatedMetrics,
        severity,
        generatedAt: timestamp
      } as IHealthInsightGeneratedPayload,
      metadata: {
        generatedBy: 'ai-health-assistant',
        recommendationProvided: true,
        userInteraction: 'full-read'
      }
    },
    journey: JourneyType.HEALTH,
    timestamp,
    version: '1.0.0',
    correlationId: createTestId('correlation', `${insightType}-generated-${Date.now()}`)
  };
}

/**
 * Helper function to create a device synced event
 * @param userId User ID
 * @param deviceType Type of device
 * @param syncedMetrics Array of metrics that were synced
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns A device synced event
 */
export function createDeviceSyncedEvent(
  userId: string,
  deviceType: string,
  syncedMetrics: MetricType[],
  timestamp: string = createTimestamp()
): GamificationEvent {
  const deviceId = `device-${uuidv4().substring(0, 8)}`;
  
  return {
    id: createTestId('device-synced', deviceType),
    type: HealthEventType.DEVICE_SYNCED,
    userId,
    payload: {
      data: {
        deviceId,
        deviceType,
        syncTime: timestamp,
        syncedMetrics,
        syncStatus: 'success'
      },
      metadata: {
        lastSyncTime: createTimestamp(0, 12), // Last synced 12 hours ago
        syncDuration: 3.5, // seconds
        metricsCount: syncedMetrics.length
      }
    },
    journey: JourneyType.HEALTH,
    timestamp,
    version: '1.0.0',
    correlationId: createTestId('correlation', `${deviceType}-synced-${Date.now()}`)
  };
}

/**
 * Helper function to create a medical event recorded event
 * @param userId User ID
 * @param eventType Type of medical event
 * @param provider Healthcare provider
 * @param notes Optional notes
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns A medical event recorded event
 */
export function createMedicalEventRecordedEvent(
  userId: string,
  eventType: string,
  provider: string,
  notes: string = '',
  timestamp: string = createTimestamp()
): GamificationEvent {
  const eventId = `medical-event-${uuidv4().substring(0, 8)}`;
  
  return {
    id: createTestId('medical-event', eventType),
    type: HealthEventType.MEDICAL_EVENT_RECORDED,
    userId,
    payload: {
      data: {
        eventId,
        eventType,
        recordedAt: timestamp,
        provider,
        notes
      },
      metadata: {
        location: 'São Paulo',
        isRecurring: eventType === 'VACCINATION' || eventType === 'MEDICATION',
        reminderSet: eventType === 'VACCINATION' || eventType === 'MEDICATION'
      }
    },
    journey: JourneyType.HEALTH,
    timestamp,
    version: '1.0.0',
    correlationId: createTestId('correlation', `${eventType}-recorded-${Date.now()}`)
  };
}

/**
 * Helper function to create an achievement unlocked event
 * @param userId User ID
 * @param achievementId Achievement ID
 * @param achievementName Achievement name
 * @param pointsAwarded Points awarded
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns An achievement unlocked event
 */
export function createAchievementUnlockedEvent(
  userId: string,
  achievementId: string,
  achievementName: string,
  pointsAwarded: number,
  timestamp: string = createTimestamp()
): GamificationEvent {
  return {
    id: createTestId('achievement-unlocked', achievementName),
    type: CommonEventType.ACHIEVEMENT_UNLOCKED,
    userId,
    payload: {
      data: {
        achievementId,
        achievementName,
        unlockedAt: timestamp,
        pointsAwarded,
        journey: JourneyType.HEALTH,
        rarity: pointsAwarded > 200 ? 'rare' : pointsAwarded > 100 ? 'uncommon' : 'common'
      },
      metadata: {
        level: 1,
        previouslyUnlocked: false,
        relatedEvents: [createTestId('related', 'event')]
      }
    },
    timestamp,
    version: '1.0.0',
    correlationId: createTestId('correlation', `achievement-unlocked-${Date.now()}`)
  };
}

// ===== HEALTH JOURNEY SCENARIOS =====

/**
 * Scenario: Daily Step Goal Achievement
 * 
 * This scenario simulates a user tracking their steps over several days,
 * eventually achieving their daily step goal and unlocking an achievement.
 */
export const dailyStepGoalScenario = {
  userId: MOCK_USER_IDS.STANDARD_USER,
  description: 'User tracks steps over several days and achieves their daily step goal',
  events: [
    // Day 1: User connects a device
    createDeviceConnectedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'Smartwatch',
      true,
      'Apple',
      'Watch Series 7',
      createTimestamp(7, 0) // 7 days ago
    ),
    
    // Day 1: Initial step count sync
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.STEPS,
      7500,
      'steps',
      'Apple Watch',
      createTimestamp(7, 0) // 7 days ago
    ),
    
    // Day 2: Steps below goal
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.STEPS,
      6800,
      'steps',
      'Apple Watch',
      createTimestamp(6, 0) // 6 days ago
    ),
    
    // Day 3: Steps below goal
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.STEPS,
      7200,
      'steps',
      'Apple Watch',
      createTimestamp(5, 0) // 5 days ago
    ),
    
    // Day 4: Steps above goal
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.STEPS,
      10500,
      'steps',
      'Apple Watch',
      createTimestamp(4, 0) // 4 days ago
    ),
    
    // Day 4: Goal achieved event
    createGoalAchievedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.STEPS,
      10000,
      10500,
      1,
      createTimestamp(4, 0, 5) // 4 days ago, 5 minutes after step recording
    ),
    
    // Day 5: Steps above goal
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.STEPS,
      11200,
      'steps',
      'Apple Watch',
      createTimestamp(3, 0) // 3 days ago
    ),
    
    // Day 5: Goal achieved event
    createGoalAchievedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.STEPS,
      10000,
      11200,
      2,
      createTimestamp(3, 0, 5) // 3 days ago, 5 minutes after step recording
    ),
    
    // Day 6: Steps above goal
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.STEPS,
      10800,
      'steps',
      'Apple Watch',
      createTimestamp(2, 0) // 2 days ago
    ),
    
    // Day 6: Goal achieved event
    createGoalAchievedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.STEPS,
      10000,
      10800,
      3,
      createTimestamp(2, 0, 5) // 2 days ago, 5 minutes after step recording
    ),
    
    // Day 7: Steps above goal
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.STEPS,
      12500,
      'steps',
      'Apple Watch',
      createTimestamp(1, 0) // 1 day ago
    ),
    
    // Day 7: Goal achieved event
    createGoalAchievedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.STEPS,
      10000,
      12500,
      4,
      createTimestamp(1, 0, 5) // 1 day ago, 5 minutes after step recording
    ),
    
    // Day 8 (Today): Steps above goal
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.STEPS,
      13000,
      'steps',
      'Apple Watch',
      createTimestamp(0, 0) // Today
    ),
    
    // Day 8: Goal achieved event
    createGoalAchievedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.STEPS,
      10000,
      13000,
      5,
      createTimestamp(0, 0, 5) // Today, 5 minutes after step recording
    ),
    
    // Achievement unlocked event
    createAchievementUnlockedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      achievementFixtures.healthAchievementFixtures.stepGoal.id,
      achievementFixtures.healthAchievementFixtures.stepGoal.title,
      achievementFixtures.healthAchievementFixtures.stepGoal.xpReward,
      createTimestamp(0, 0, 10) // Today, 10 minutes after step recording
    )
  ],
  expectedResults: {
    achievements: [
      {
        id: achievementFixtures.healthAchievementFixtures.stepGoal.id,
        progress: 5,
        unlocked: true,
        xpAwarded: achievementFixtures.healthAchievementFixtures.stepGoal.xpReward
      }
    ],
    metrics: {
      [MetricType.STEPS]: {
        latest: 13000,
        average: 9857, // Average of all step counts
        trend: 'increasing'
      }
    },
    goals: {
      [GoalType.STEPS]: {
        achieved: true,
        streakCount: 5
      }
    }
  }
};

/**
 * Scenario: Health Metrics Tracking Streak
 * 
 * This scenario simulates a user consistently tracking multiple health metrics
 * over several consecutive days, unlocking a streak achievement.
 */
export const healthMetricsStreakScenario = {
  userId: MOCK_USER_IDS.PREMIUM_USER,
  description: 'User consistently tracks multiple health metrics over consecutive days',
  events: [
    // Day 1: User connects a device
    createDeviceConnectedEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      'Smartwatch',
      true,
      'Garmin',
      'Venu 2',
      createTimestamp(6, 0) // 6 days ago
    ),
    
    // Day 1: Heart rate tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.HEART_RATE,
      68,
      'bpm',
      'Garmin Venu 2',
      createTimestamp(6, 0) // 6 days ago
    ),
    
    // Day 1: Blood pressure tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.BLOOD_PRESSURE,
      120,
      'mmHg',
      'Omron Monitor',
      createTimestamp(6, 1) // 6 days ago, 1 hour later
    ),
    
    // Day 1: Weight tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.WEIGHT,
      75.5,
      'kg',
      'Smart Scale',
      createTimestamp(6, 2) // 6 days ago, 2 hours later
    ),
    
    // Day 2: Heart rate tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.HEART_RATE,
      70,
      'bpm',
      'Garmin Venu 2',
      createTimestamp(5, 0) // 5 days ago
    ),
    
    // Day 2: Blood pressure tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.BLOOD_PRESSURE,
      118,
      'mmHg',
      'Omron Monitor',
      createTimestamp(5, 1) // 5 days ago, 1 hour later
    ),
    
    // Day 2: Weight tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.WEIGHT,
      75.2,
      'kg',
      'Smart Scale',
      createTimestamp(5, 2) // 5 days ago, 2 hours later
    ),
    
    // Day 3: Heart rate tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.HEART_RATE,
      72,
      'bpm',
      'Garmin Venu 2',
      createTimestamp(4, 0) // 4 days ago
    ),
    
    // Day 3: Blood pressure tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.BLOOD_PRESSURE,
      122,
      'mmHg',
      'Omron Monitor',
      createTimestamp(4, 1) // 4 days ago, 1 hour later
    ),
    
    // Day 3: Weight tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.WEIGHT,
      75.0,
      'kg',
      'Smart Scale',
      createTimestamp(4, 2) // 4 days ago, 2 hours later
    ),
    
    // Day 4: Heart rate tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.HEART_RATE,
      69,
      'bpm',
      'Garmin Venu 2',
      createTimestamp(3, 0) // 3 days ago
    ),
    
    // Day 4: Blood pressure tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.BLOOD_PRESSURE,
      119,
      'mmHg',
      'Omron Monitor',
      createTimestamp(3, 1) // 3 days ago, 1 hour later
    ),
    
    // Day 4: Weight tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.WEIGHT,
      74.8,
      'kg',
      'Smart Scale',
      createTimestamp(3, 2) // 3 days ago, 2 hours later
    ),
    
    // Day 5: Heart rate tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.HEART_RATE,
      71,
      'bpm',
      'Garmin Venu 2',
      createTimestamp(2, 0) // 2 days ago
    ),
    
    // Day 5: Blood pressure tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.BLOOD_PRESSURE,
      121,
      'mmHg',
      'Omron Monitor',
      createTimestamp(2, 1) // 2 days ago, 1 hour later
    ),
    
    // Day 5: Weight tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.WEIGHT,
      74.5,
      'kg',
      'Smart Scale',
      createTimestamp(2, 2) // 2 days ago, 2 hours later
    ),
    
    // Day 6: Heart rate tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.HEART_RATE,
      70,
      'bpm',
      'Garmin Venu 2',
      createTimestamp(1, 0) // 1 day ago
    ),
    
    // Day 6: Blood pressure tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.BLOOD_PRESSURE,
      120,
      'mmHg',
      'Omron Monitor',
      createTimestamp(1, 1) // 1 day ago, 1 hour later
    ),
    
    // Day 6: Weight tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.WEIGHT,
      74.3,
      'kg',
      'Smart Scale',
      createTimestamp(1, 2) // 1 day ago, 2 hours later
    ),
    
    // Day 7 (Today): Heart rate tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.HEART_RATE,
      68,
      'bpm',
      'Garmin Venu 2',
      createTimestamp(0, 0) // Today
    ),
    
    // Day 7: Blood pressure tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.BLOOD_PRESSURE,
      118,
      'mmHg',
      'Omron Monitor',
      createTimestamp(0, 1) // Today, 1 hour later
    ),
    
    // Day 7: Weight tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.WEIGHT,
      74.0,
      'kg',
      'Smart Scale',
      createTimestamp(0, 2) // Today, 2 hours later
    ),
    
    // Health Check Streak Achievement unlocked
    createAchievementUnlockedEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      achievementFixtures.healthAchievementFixtures.healthCheckStreak.id,
      achievementFixtures.healthAchievementFixtures.healthCheckStreak.title,
      achievementFixtures.healthAchievementFixtures.healthCheckStreak.xpReward,
      createTimestamp(0, 2, 10) // Today, 10 minutes after last metric recording
    ),
    
    // Health insight generated based on the tracked metrics
    createHealthInsightEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      'WEIGHT_TREND',
      [MetricType.WEIGHT],
      'low',
      createTimestamp(0, 3) // Today, 3 hours later
    )
  ],
  expectedResults: {
    achievements: [
      {
        id: achievementFixtures.healthAchievementFixtures.healthCheckStreak.id,
        progress: 7,
        unlocked: true,
        xpAwarded: achievementFixtures.healthAchievementFixtures.healthCheckStreak.xpReward
      }
    ],
    metrics: {
      [MetricType.HEART_RATE]: {
        latest: 68,
        average: 70, // Average of all heart rate measurements
        trend: 'stable'
      },
      [MetricType.BLOOD_PRESSURE]: {
        latest: 118,
        average: 120, // Average of all systolic blood pressure measurements
        trend: 'stable'
      },
      [MetricType.WEIGHT]: {
        latest: 74.0,
        average: 74.9, // Average of all weight measurements
        trend: 'decreasing'
      }
    },
    insights: [
      {
        type: 'WEIGHT_TREND',
        severity: 'low',
        relatedMetrics: [MetricType.WEIGHT]
      }
    ]
  }
};

/**
 * Scenario: Device Connection and Synchronization
 * 
 * This scenario simulates a user connecting multiple health devices
 * and synchronizing data from them, unlocking a device connection achievement.
 */
export const deviceConnectionScenario = {
  userId: MOCK_USER_IDS.NEW_USER,
  description: 'User connects multiple health devices and synchronizes data',
  events: [
    // User connects first device (smartwatch)
    createDeviceConnectedEvent(
      MOCK_USER_IDS.NEW_USER,
      'Smartwatch',
      true,
      'Samsung',
      'Galaxy Watch 4',
      createTimestamp(3, 0) // 3 days ago
    ),
    
    // First device sync
    createDeviceSyncedEvent(
      MOCK_USER_IDS.NEW_USER,
      'Smartwatch',
      [MetricType.HEART_RATE, MetricType.STEPS],
      createTimestamp(3, 0, 5) // 3 days ago, 5 minutes after connection
    ),
    
    // Heart rate data from first sync
    createHealthMetricEvent(
      MOCK_USER_IDS.NEW_USER,
      MetricType.HEART_RATE,
      75,
      'bpm',
      'Samsung Galaxy Watch 4',
      createTimestamp(3, 0, 6) // 3 days ago, 6 minutes after connection
    ),
    
    // Steps data from first sync
    createHealthMetricEvent(
      MOCK_USER_IDS.NEW_USER,
      MetricType.STEPS,
      8500,
      'steps',
      'Samsung Galaxy Watch 4',
      createTimestamp(3, 0, 7) // 3 days ago, 7 minutes after connection
    ),
    
    // User connects second device (blood pressure monitor)
    createDeviceConnectedEvent(
      MOCK_USER_IDS.NEW_USER,
      'Blood Pressure Monitor',
      true,
      'Omron',
      'M7 Intelli IT',
      createTimestamp(2, 0) // 2 days ago
    ),
    
    // Second device sync
    createDeviceSyncedEvent(
      MOCK_USER_IDS.NEW_USER,
      'Blood Pressure Monitor',
      [MetricType.BLOOD_PRESSURE],
      createTimestamp(2, 0, 5) // 2 days ago, 5 minutes after connection
    ),
    
    // Blood pressure data from second sync
    createHealthMetricEvent(
      MOCK_USER_IDS.NEW_USER,
      MetricType.BLOOD_PRESSURE,
      122,
      'mmHg',
      'Omron M7 Intelli IT',
      createTimestamp(2, 0, 6) // 2 days ago, 6 minutes after connection
    ),
    
    // User connects third device (smart scale)
    createDeviceConnectedEvent(
      MOCK_USER_IDS.NEW_USER,
      'Smart Scale',
      true,
      'Withings',
      'Body+',
      createTimestamp(1, 0) // 1 day ago
    ),
    
    // Third device sync
    createDeviceSyncedEvent(
      MOCK_USER_IDS.NEW_USER,
      'Smart Scale',
      [MetricType.WEIGHT],
      createTimestamp(1, 0, 5) // 1 day ago, 5 minutes after connection
    ),
    
    // Weight data from third sync
    createHealthMetricEvent(
      MOCK_USER_IDS.NEW_USER,
      MetricType.WEIGHT,
      82.5,
      'kg',
      'Withings Body+',
      createTimestamp(1, 0, 6) // 1 day ago, 6 minutes after connection
    ),
    
    // Device Connection Achievement unlocked
    createAchievementUnlockedEvent(
      MOCK_USER_IDS.NEW_USER,
      achievementFixtures.healthAchievementFixtures.deviceConnection.id,
      achievementFixtures.healthAchievementFixtures.deviceConnection.title,
      achievementFixtures.healthAchievementFixtures.deviceConnection.xpReward,
      createTimestamp(1, 0, 10) // 1 day ago, 10 minutes after last device connection
    ),
    
    // Today: Smartwatch sync
    createDeviceSyncedEvent(
      MOCK_USER_IDS.NEW_USER,
      'Smartwatch',
      [MetricType.HEART_RATE, MetricType.STEPS],
      createTimestamp(0, 0) // Today
    ),
    
    // Today's heart rate data
    createHealthMetricEvent(
      MOCK_USER_IDS.NEW_USER,
      MetricType.HEART_RATE,
      72,
      'bpm',
      'Samsung Galaxy Watch 4',
      createTimestamp(0, 0, 1) // Today, 1 minute after sync
    ),
    
    // Today's steps data
    createHealthMetricEvent(
      MOCK_USER_IDS.NEW_USER,
      MetricType.STEPS,
      9200,
      'steps',
      'Samsung Galaxy Watch 4',
      createTimestamp(0, 0, 2) // Today, 2 minutes after sync
    ),
    
    // Today: Smart scale sync
    createDeviceSyncedEvent(
      MOCK_USER_IDS.NEW_USER,
      'Smart Scale',
      [MetricType.WEIGHT],
      createTimestamp(0, 1) // Today, 1 hour after smartwatch sync
    ),
    
    // Today's weight data
    createHealthMetricEvent(
      MOCK_USER_IDS.NEW_USER,
      MetricType.WEIGHT,
      82.1,
      'kg',
      'Withings Body+',
      createTimestamp(0, 1, 1) // Today, 1 minute after scale sync
    )
  ],
  expectedResults: {
    achievements: [
      {
        id: achievementFixtures.healthAchievementFixtures.deviceConnection.id,
        progress: 1,
        unlocked: true,
        xpAwarded: achievementFixtures.healthAchievementFixtures.deviceConnection.xpReward
      }
    ],
    devices: [
      {
        type: 'Smartwatch',
        manufacturer: 'Samsung',
        model: 'Galaxy Watch 4',
        lastSynced: createTimestamp(0, 0) // Today
      },
      {
        type: 'Blood Pressure Monitor',
        manufacturer: 'Omron',
        model: 'M7 Intelli IT',
        lastSynced: createTimestamp(2, 0, 5) // 2 days ago
      },
      {
        type: 'Smart Scale',
        manufacturer: 'Withings',
        model: 'Body+',
        lastSynced: createTimestamp(0, 1) // Today
      }
    ],
    metrics: {
      [MetricType.HEART_RATE]: {
        latest: 72,
        source: 'Samsung Galaxy Watch 4'
      },
      [MetricType.STEPS]: {
        latest: 9200,
        source: 'Samsung Galaxy Watch 4'
      },
      [MetricType.BLOOD_PRESSURE]: {
        latest: 122,
        source: 'Omron M7 Intelli IT'
      },
      [MetricType.WEIGHT]: {
        latest: 82.1,
        source: 'Withings Body+'
      }
    }
  }
};

/**
 * Scenario: Health Goal Setting and Achievement
 * 
 * This scenario simulates a user setting multiple health goals,
 * tracking progress, and eventually achieving them.
 */
export const healthGoalAchievementScenario = {
  userId: MOCK_USER_IDS.STANDARD_USER,
  description: 'User sets multiple health goals, tracks progress, and achieves them',
  events: [
    // Initial weight goal progress (50%)
    createGoalProgressEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.WEIGHT,
      50,
      78,
      75,
      14, // 14 days remaining
      createTimestamp(14, 0) // 14 days ago
    ),
    
    // Weight tracking day 1
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.WEIGHT,
      78,
      'kg',
      'Smart Scale',
      createTimestamp(14, 0, 5) // 14 days ago, 5 minutes after goal progress
    ),
    
    // Weight goal progress update (60%)
    createGoalProgressEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.WEIGHT,
      60,
      77.2,
      75,
      10, // 10 days remaining
      createTimestamp(10, 0) // 10 days ago
    ),
    
    // Weight tracking day 5
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.WEIGHT,
      77.2,
      'kg',
      'Smart Scale',
      createTimestamp(10, 0, 5) // 10 days ago, 5 minutes after goal progress
    ),
    
    // Weight goal progress update (80%)
    createGoalProgressEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.WEIGHT,
      80,
      75.6,
      75,
      5, // 5 days remaining
      createTimestamp(5, 0) // 5 days ago
    ),
    
    // Weight tracking day 10
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.WEIGHT,
      75.6,
      'kg',
      'Smart Scale',
      createTimestamp(5, 0, 5) // 5 days ago, 5 minutes after goal progress
    ),
    
    // Weight goal progress update (100%)
    createGoalProgressEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.WEIGHT,
      100,
      75,
      75,
      0, // 0 days remaining
      createTimestamp(0, 0) // Today
    ),
    
    // Weight tracking day 15
    createHealthMetricEvent(
      MOCK_USER_IDS.STANDARD_USER,
      MetricType.WEIGHT,
      75,
      'kg',
      'Smart Scale',
      createTimestamp(0, 0, 5) // Today, 5 minutes after goal progress
    ),
    
    // Weight goal achieved
    createGoalAchievedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      GoalType.WEIGHT,
      75,
      75,
      1,
      createTimestamp(0, 0, 10) // Today, 10 minutes after weight tracking
    ),
    
    // Weight Goal Achievement unlocked
    createAchievementUnlockedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      achievementFixtures.healthAchievementFixtures.weightGoal.id,
      achievementFixtures.healthAchievementFixtures.weightGoal.title,
      achievementFixtures.healthAchievementFixtures.weightGoal.xpReward,
      createTimestamp(0, 0, 15) // Today, 15 minutes after goal achieved
    ),
    
    // Health insight generated based on weight goal achievement
    createHealthInsightEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'WEIGHT_GOAL_ACHIEVED',
      [MetricType.WEIGHT],
      'medium',
      createTimestamp(0, 1) // Today, 1 hour after goal achieved
    )
  ],
  expectedResults: {
    achievements: [
      {
        id: achievementFixtures.healthAchievementFixtures.weightGoal.id,
        progress: 1,
        unlocked: true,
        xpAwarded: achievementFixtures.healthAchievementFixtures.weightGoal.xpReward
      }
    ],
    goals: {
      [GoalType.WEIGHT]: {
        targetValue: 75,
        currentValue: 75,
        progress: 100,
        achieved: true,
        completedInDays: 14 // Completed in 14 days (from first event to achievement)
      }
    },
    metrics: {
      [MetricType.WEIGHT]: {
        latest: 75,
        initial: 78,
        change: -3,
        changePercentage: -3.85, // (75-78)/78 * 100
        trend: 'decreasing'
      }
    },
    insights: [
      {
        type: 'WEIGHT_GOAL_ACHIEVED',
        severity: 'medium',
        relatedMetrics: [MetricType.WEIGHT]
      }
    ]
  }
};

/**
 * Scenario: Sleep Tracking and Goal Achievement
 * 
 * This scenario simulates a user tracking their sleep over several days,
 * working toward a sleep goal achievement.
 */
export const sleepTrackingScenario = {
  userId: MOCK_USER_IDS.PREMIUM_USER,
  description: 'User tracks sleep over several days and achieves sleep goal',
  events: [
    // Day 1: Sleep tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.SLEEP,
      6.5,
      'hours',
      'Fitbit Sense',
      createTimestamp(5, 8) // 5 days ago, 8am
    ),
    
    // Day 2: Sleep tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.SLEEP,
      7.2,
      'hours',
      'Fitbit Sense',
      createTimestamp(4, 8) // 4 days ago, 8am
    ),
    
    // Day 3: Sleep tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.SLEEP,
      7.5,
      'hours',
      'Fitbit Sense',
      createTimestamp(3, 8) // 3 days ago, 8am
    ),
    
    // Day 3: Sleep goal progress (60%)
    createGoalProgressEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      GoalType.SLEEP,
      60,
      3,
      5, // Need 5 days of good sleep
      2, // 2 days remaining
      createTimestamp(3, 8, 5) // 3 days ago, 5 minutes after sleep tracking
    ),
    
    // Day 4: Sleep tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.SLEEP,
      8.0,
      'hours',
      'Fitbit Sense',
      createTimestamp(2, 8) // 2 days ago, 8am
    ),
    
    // Day 4: Sleep goal progress (80%)
    createGoalProgressEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      GoalType.SLEEP,
      80,
      4,
      5, // Need 5 days of good sleep
      1, // 1 day remaining
      createTimestamp(2, 8, 5) // 2 days ago, 5 minutes after sleep tracking
    ),
    
    // Day 5: Sleep tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.SLEEP,
      7.8,
      'hours',
      'Fitbit Sense',
      createTimestamp(1, 8) // 1 day ago, 8am
    ),
    
    // Day 5: Sleep goal progress (100%)
    createGoalProgressEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      GoalType.SLEEP,
      100,
      5,
      5, // Need 5 days of good sleep
      0, // 0 days remaining
      createTimestamp(1, 8, 5) // 1 day ago, 5 minutes after sleep tracking
    ),
    
    // Day 5: Sleep goal achieved
    createGoalAchievedEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      GoalType.SLEEP,
      5, // 5 days of good sleep
      5,
      1,
      createTimestamp(1, 8, 10) // 1 day ago, 10 minutes after sleep tracking
    ),
    
    // Sleep Goal Achievement unlocked
    createAchievementUnlockedEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      achievementFixtures.healthAchievementFixtures.sleepGoal.id,
      achievementFixtures.healthAchievementFixtures.sleepGoal.title,
      achievementFixtures.healthAchievementFixtures.sleepGoal.xpReward,
      createTimestamp(1, 8, 15) // 1 day ago, 15 minutes after goal achieved
    ),
    
    // Day 6 (Today): Sleep tracking
    createHealthMetricEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      MetricType.SLEEP,
      8.2,
      'hours',
      'Fitbit Sense',
      createTimestamp(0, 8) // Today, 8am
    ),
    
    // Health insight generated based on sleep improvement
    createHealthInsightEvent(
      MOCK_USER_IDS.PREMIUM_USER,
      'SLEEP_IMPROVEMENT',
      [MetricType.SLEEP],
      'low',
      createTimestamp(0, 9) // Today, 9am
    )
  ],
  expectedResults: {
    achievements: [
      {
        id: achievementFixtures.healthAchievementFixtures.sleepGoal.id,
        progress: 5,
        unlocked: true,
        xpAwarded: achievementFixtures.healthAchievementFixtures.sleepGoal.xpReward
      }
    ],
    goals: {
      [GoalType.SLEEP]: {
        targetValue: 5, // 5 days of good sleep
        currentValue: 5,
        progress: 100,
        achieved: true
      }
    },
    metrics: {
      [MetricType.SLEEP]: {
        latest: 8.2,
        average: 7.53, // Average of all sleep durations
        trend: 'increasing'
      }
    },
    insights: [
      {
        type: 'SLEEP_IMPROVEMENT',
        severity: 'low',
        relatedMetrics: [MetricType.SLEEP]
      }
    ]
  }
};

/**
 * Scenario: Medical Event Recording
 * 
 * This scenario simulates a user recording various medical events
 * such as vaccinations, doctor visits, and medication changes.
 */
export const medicalEventRecordingScenario = {
  userId: MOCK_USER_IDS.STANDARD_USER,
  description: 'User records various medical events',
  events: [
    // Vaccination record
    createMedicalEventRecordedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'VACCINATION',
      'Clínica Vacinas',
      'Annual flu vaccination',
      createTimestamp(30, 0) // 30 days ago
    ),
    
    // Doctor visit record
    createMedicalEventRecordedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'DOCTOR_VISIT',
      'Dr. Silva',
      'Annual checkup, all results normal',
      createTimestamp(15, 0) // 15 days ago
    ),
    
    // Blood test record
    createMedicalEventRecordedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'LAB_TEST',
      'Laboratório Central',
      'Complete blood panel',
      createTimestamp(14, 0) // 14 days ago
    ),
    
    // Medication change record
    createMedicalEventRecordedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'MEDICATION_CHANGE',
      'Dr. Silva',
      'Started vitamin D supplement',
      createTimestamp(13, 0) // 13 days ago
    ),
    
    // Health insight generated based on medical events
    createHealthInsightEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'PREVENTIVE_CARE',
      [MetricType.HEART_RATE, MetricType.BLOOD_PRESSURE],
      'low',
      createTimestamp(10, 0) // 10 days ago
    ),
    
    // Specialist visit record
    createMedicalEventRecordedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'SPECIALIST_VISIT',
      'Dr. Cardoso',
      'Cardiology consultation, no issues found',
      createTimestamp(7, 0) // 7 days ago
    ),
    
    // Today: Dental visit record
    createMedicalEventRecordedEvent(
      MOCK_USER_IDS.STANDARD_USER,
      'DENTAL_VISIT',
      'Dra. Oliveira',
      'Regular cleaning and checkup',
      createTimestamp(0, 0) // Today
    )
  ],
  expectedResults: {
    medicalEvents: [
      {
        type: 'VACCINATION',
        provider: 'Clínica Vacinas',
        date: createTimestamp(30, 0) // 30 days ago
      },
      {
        type: 'DOCTOR_VISIT',
        provider: 'Dr. Silva',
        date: createTimestamp(15, 0) // 15 days ago
      },
      {
        type: 'LAB_TEST',
        provider: 'Laboratório Central',
        date: createTimestamp(14, 0) // 14 days ago
      },
      {
        type: 'MEDICATION_CHANGE',
        provider: 'Dr. Silva',
        date: createTimestamp(13, 0) // 13 days ago
      },
      {
        type: 'SPECIALIST_VISIT',
        provider: 'Dr. Cardoso',
        date: createTimestamp(7, 0) // 7 days ago
      },
      {
        type: 'DENTAL_VISIT',
        provider: 'Dra. Oliveira',
        date: createTimestamp(0, 0) // Today
      }
    ],
    insights: [
      {
        type: 'PREVENTIVE_CARE',
        severity: 'low',
        relatedMetrics: [MetricType.HEART_RATE, MetricType.BLOOD_PRESSURE]
      }
    ]
  }
};

// Export all scenarios for use in tests
export const healthJourneyScenarios = {
  dailyStepGoalScenario,
  healthMetricsStreakScenario,
  deviceConnectionScenario,
  healthGoalAchievementScenario,
  sleepTrackingScenario,
  medicalEventRecordingScenario
};

export default healthJourneyScenarios;