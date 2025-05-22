/**
 * @file Health Journey Scenarios
 * @description Contains complex end-to-end test scenarios for the Health journey in the gamification system.
 * Provides fixtures that simulate users completing health-related activities, triggering multiple
 * gamification events, and earning achievements. These scenarios combine user profiles, health events,
 * rules, achievements, and rewards to test the complete gamification flow for the Health journey.
 */

import { JourneyType } from '@austa/interfaces/common';
import { EventType, EventJourney, GamificationEvent } from '@austa/interfaces/gamification/events';
import { AchievementStatus } from '@austa/interfaces/gamification/achievement-status';
import { UserProfile } from '@austa/interfaces/gamification/profiles';
import { Achievement, UserAchievement } from '@austa/interfaces/gamification/achievements';

import { eventFixtures } from '../events.fixtures';
import { achievementFixtures, generateUserAchievementFixture } from '../achievements.fixtures';
import { profileFixtures } from '../profiles.fixtures';
import { ruleFixtures } from '../rules.fixtures';

/**
 * Interface for a health journey scenario
 */
export interface HealthJourneyScenario {
  /** Unique identifier for the scenario */
  id: string;
  
  /** Human-readable name of the scenario */
  name: string;
  
  /** Description of what the scenario tests */
  description: string;
  
  /** User profile for the scenario */
  profile: UserProfile;
  
  /** Initial user achievements before the scenario */
  initialAchievements: UserAchievement[];
  
  /** Events that occur during the scenario */
  events: GamificationEvent[];
  
  /** Expected achievements after the scenario */
  expectedAchievements: UserAchievement[];
  
  /** Expected XP gain from the scenario */
  expectedXpGain: number;
  
  /** Tags for categorizing the scenario */
  tags: string[];
}

/**
 * Creates a basic health journey scenario with default values
 * 
 * @param id Unique identifier for the scenario
 * @param name Human-readable name of the scenario
 * @param description Description of what the scenario tests
 * @param events Events that occur during the scenario
 * @param expectedAchievements Expected achievements after the scenario
 * @param expectedXpGain Expected XP gain from the scenario
 * @param tags Tags for categorizing the scenario
 * @returns A health journey scenario
 */
function createHealthScenario(
  id: string,
  name: string,
  description: string,
  events: GamificationEvent[],
  expectedAchievements: UserAchievement[],
  expectedXpGain: number,
  tags: string[] = []
): HealthJourneyScenario {
  // Use a default profile
  const profile = profileFixtures.generateBasicProfile('health-user-1', 'Health Test User');
  
  // Start with no achievements
  const initialAchievements: UserAchievement[] = [];
  
  return {
    id,
    name,
    description,
    profile,
    initialAchievements,
    events,
    expectedAchievements,
    expectedXpGain,
    tags: ['health', ...tags]
  };
}

/**
 * Scenario: User records health metrics for the first time
 * Tests the basic health metric recording event processing
 */
export const firstTimeMetricRecordingScenario: HealthJourneyScenario = createHealthScenario(
  'health-first-metric',
  'First Health Metric Recording',
  'User records a health metric for the first time, starting progress on the Health Tracker achievement',
  [
    // Record heart rate for the first time
    eventFixtures.health.metricRecorded('health-user-1')
  ],
  [
    // Start progress on health metrics streak achievement
    generateUserAchievementFixture(
      achievementFixtures.health.healthMetricsStreak[0], // Level 1
      'health-user-1',
      AchievementStatus.IN_PROGRESS,
      33 // 1/3 days progress
    )
  ],
  10, // Small XP gain for first recording
  ['first-time', 'metrics', 'heart-rate']
);

/**
 * Scenario: User completes a 3-day streak of recording health metrics
 * Tests achievement unlocking for consistent health tracking
 */
export const healthMetricsStreakScenario: HealthJourneyScenario = (() => {
  // Create events for 3 consecutive days of health tracking
  const events: GamificationEvent[] = [];
  const userId = 'health-user-1';
  const now = new Date();
  
  // Create heart rate events for 3 consecutive days
  for (let i = 0; i < 3; i++) {
    const event = eventFixtures.health.metricRecorded(userId);
    // Adjust timestamp to simulate consecutive days
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() - (2 - i)); // 2 days ago, 1 day ago, today
    event.timestamp = eventDate.toISOString();
    events.push(event);
  }
  
  return createHealthScenario(
    'health-metrics-streak',
    'Health Metrics 3-Day Streak',
    'User records health metrics for 3 consecutive days, unlocking the first level of the Health Tracker achievement',
    events,
    [
      // Unlock level 1 of health metrics streak achievement
      generateUserAchievementFixture(
        achievementFixtures.health.healthMetricsStreak[0], // Level 1
        userId,
        AchievementStatus.UNLOCKED
      ),
      // Start showing level 2 as visible
      generateUserAchievementFixture(
        achievementFixtures.health.healthMetricsStreak[1], // Level 2
        userId,
        AchievementStatus.VISIBLE
      )
    ],
    25, // XP reward for level 1 achievement
    ['streak', 'metrics', 'achievement-unlock']
  );
})();

/**
 * Scenario: User achieves their step goal for the first time
 * Tests step goal achievement event processing
 */
export const firstStepGoalScenario: HealthJourneyScenario = createHealthScenario(
  'health-first-step-goal',
  'First Step Goal Achievement',
  'User reaches their daily step goal for the first time, starting progress on the Step Master achievement',
  [
    // Record step count that meets the goal
    {
      ...eventFixtures.health.metricRecorded('health-user-1'),
      type: EventType.HEALTH_METRIC_RECORDED,
      payload: {
        timestamp: new Date().toISOString(),
        metricType: 'STEPS',
        value: 10000,
        unit: 'steps',
        source: 'manual',
        isWithinHealthyRange: true,
        metadata: {
          deviceId: null,
          location: 'outdoor'
        }
      }
    },
    // Goal achievement event
    eventFixtures.health.goalAchieved('health-user-1')
  ],
  [
    // Start progress on step goal achievement
    generateUserAchievementFixture(
      achievementFixtures.health.stepsGoal[0], // Level 1
      'health-user-1',
      AchievementStatus.IN_PROGRESS,
      20 // 1/5 days progress
    )
  ],
  15, // XP gain for first goal achievement
  ['first-time', 'steps', 'goal']
);

/**
 * Scenario: User connects a health device for the first time
 * Tests device connection event processing and achievement unlocking
 */
export const deviceConnectionScenario: HealthJourneyScenario = createHealthScenario(
  'health-device-connection',
  'First Device Connection',
  'User connects a health tracking device to their account, unlocking the Connected Health achievement',
  [
    // Connect a health device
    eventFixtures.health.deviceConnected('health-user-1')
  ],
  [
    // Unlock device connection achievement
    generateUserAchievementFixture(
      achievementFixtures.health.deviceConnection[0], // Level 1
      'health-user-1',
      AchievementStatus.UNLOCKED
    )
  ],
  25, // XP reward for achievement
  ['device', 'first-time', 'achievement-unlock']
);

/**
 * Scenario: User tracks sleep for multiple days
 * Tests sleep tracking event processing and achievement progress
 */
export const sleepTrackingScenario: HealthJourneyScenario = (() => {
  // Create events for 3 days of sleep tracking
  const events: GamificationEvent[] = [];
  const userId = 'health-user-1';
  const now = new Date();
  
  // Create sleep tracking events for 3 days (not necessarily consecutive)
  for (let i = 0; i < 3; i++) {
    const event = {
      ...eventFixtures.health.metricRecorded(userId),
      type: EventType.HEALTH_METRIC_RECORDED,
      payload: {
        timestamp: new Date().toISOString(),
        metricType: 'SLEEP',
        value: 7.5, // 7.5 hours
        unit: 'hours',
        source: 'device',
        isWithinHealthyRange: true,
        metadata: {
          deviceId: 'device_789',
          sleepQuality: 'good',
          deepSleepPercentage: 22
        }
      }
    };
    
    // Adjust timestamp to simulate different days
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() - (i * 2)); // Today, 2 days ago, 4 days ago
    event.payload.timestamp = eventDate.toISOString();
    events.push(event);
  }
  
  return createHealthScenario(
    'health-sleep-tracking',
    'Sleep Tracking Progress',
    'User tracks their sleep for multiple days, making progress on the Sleep Watcher achievement',
    events,
    [
      // Progress on sleep tracking achievement
      generateUserAchievementFixture(
        achievementFixtures.health.sleepTracking[0], // Level 1
        userId,
        AchievementStatus.COMPLETED
      )
    ],
    20, // XP gain for progress
    ['sleep', 'metrics', 'achievement-progress']
  );
})();

/**
 * Scenario: User completes a comprehensive health assessment
 * Tests health assessment completion event processing
 */
export const healthAssessmentScenario: HealthJourneyScenario = createHealthScenario(
  'health-assessment',
  'Health Assessment Completion',
  'User completes a comprehensive health assessment, earning XP and making progress on achievements',
  [
    // Complete a health assessment
    eventFixtures.health.assessmentCompleted('health-user-1')
  ],
  [
    // No specific achievement for this yet, but could add one
  ],
  30, // XP gain for assessment completion
  ['assessment', 'comprehensive']
);

/**
 * Scenario: User syncs multiple metrics from a device
 * Tests processing of multiple health metrics from a single device sync
 */
export const deviceSyncMultipleMetricsScenario: HealthJourneyScenario = (() => {
  const userId = 'health-user-1';
  const now = new Date();
  
  // Create multiple metric events from a single device sync
  const events: GamificationEvent[] = [
    // Device connection event
    eventFixtures.health.deviceConnected(userId),
    
    // Heart rate metric
    {
      ...eventFixtures.health.metricRecorded(userId),
      payload: {
        timestamp: now.toISOString(),
        metricType: 'HEART_RATE',
        value: 68,
        unit: 'bpm',
        source: 'device',
        isWithinHealthyRange: true,
        metadata: {
          deviceId: 'device_789',
          location: 'home'
        }
      }
    },
    
    // Steps metric
    {
      ...eventFixtures.health.metricRecorded(userId),
      payload: {
        timestamp: now.toISOString(),
        metricType: 'STEPS',
        value: 8500,
        unit: 'steps',
        source: 'device',
        isWithinHealthyRange: true,
        metadata: {
          deviceId: 'device_789',
          location: 'outdoor'
        }
      }
    },
    
    // Sleep metric
    {
      ...eventFixtures.health.metricRecorded(userId),
      payload: {
        timestamp: now.toISOString(),
        metricType: 'SLEEP',
        value: 7.2,
        unit: 'hours',
        source: 'device',
        isWithinHealthyRange: true,
        metadata: {
          deviceId: 'device_789',
          sleepQuality: 'good',
          deepSleepPercentage: 20
        }
      }
    }
  ];
  
  return createHealthScenario(
    'health-device-sync-multiple',
    'Device Sync with Multiple Metrics',
    'User syncs a device that provides multiple health metrics at once, testing batch event processing',
    events,
    [
      // Device connection achievement
      generateUserAchievementFixture(
        achievementFixtures.health.deviceConnection[0],
        userId,
        AchievementStatus.UNLOCKED
      ),
      
      // Progress on health metrics streak
      generateUserAchievementFixture(
        achievementFixtures.health.healthMetricsStreak[0],
        userId,
        AchievementStatus.IN_PROGRESS,
        33 // 1/3 days progress
      ),
      
      // Progress on sleep tracking
      generateUserAchievementFixture(
        achievementFixtures.health.sleepTracking[0],
        userId,
        AchievementStatus.IN_PROGRESS,
        33 // 1/3 days progress
      )
    ],
    40, // Combined XP gain
    ['device', 'sync', 'multiple-metrics', 'batch-processing']
  );
})();

/**
 * Scenario: User achieves multiple health goals in a single day
 * Tests processing of multiple goal achievements and their combined effects
 */
export const multipleGoalAchievementScenario: HealthJourneyScenario = (() => {
  const userId = 'health-user-1';
  const now = new Date();
  
  // Create events for multiple goal achievements
  const events: GamificationEvent[] = [
    // Steps goal achievement
    {
      ...eventFixtures.health.goalAchieved(userId),
      payload: {
        timestamp: now.toISOString(),
        goalId: 'goal_456',
        goalType: 'STEPS',
        targetValue: 10000,
        unit: 'steps',
        period: 'daily',
        completionPercentage: 100,
        isFirstTimeAchievement: false,
        metadata: {
          streakCount: 5, // 5th day in a row
          previousBest: 9500
        }
      }
    },
    
    // Sleep goal achievement
    {
      ...eventFixtures.health.goalAchieved(userId),
      payload: {
        timestamp: now.toISOString(),
        goalId: 'goal_457',
        goalType: 'SLEEP',
        targetValue: 7,
        unit: 'hours',
        period: 'daily',
        completionPercentage: 100,
        isFirstTimeAchievement: false,
        metadata: {
          streakCount: 3, // 3rd day in a row
          sleepQuality: 'excellent'
        }
      }
    },
    
    // Heart rate zone goal achievement
    {
      ...eventFixtures.health.goalAchieved(userId),
      payload: {
        timestamp: now.toISOString(),
        goalId: 'goal_458',
        goalType: 'HEART_RATE_ZONE',
        targetValue: 30,
        unit: 'minutes',
        period: 'daily',
        completionPercentage: 100,
        isFirstTimeAchievement: true,
        metadata: {
          zone: 'cardio',
          intensity: 'moderate'
        }
      }
    }
  ];
  
  return createHealthScenario(
    'health-multiple-goals',
    'Multiple Health Goals Achievement',
    'User achieves multiple health goals in a single day, testing combined achievement processing',
    events,
    [
      // Steps goal achievement progress
      generateUserAchievementFixture(
        achievementFixtures.health.stepsGoal[0],
        userId,
        AchievementStatus.UNLOCKED
      ),
      
      // Sleep tracking progress
      generateUserAchievementFixture(
        achievementFixtures.health.sleepTracking[0],
        userId,
        AchievementStatus.UNLOCKED
      )
    ],
    75, // Combined XP gain
    ['goals', 'multiple', 'achievement-unlock']
  );
})();

/**
 * Scenario: User completes a full health journey cycle
 * Tests a comprehensive health journey with multiple events and achievements
 */
export const fullHealthJourneyCycleScenario: HealthJourneyScenario = (() => {
  const userId = 'health-user-1';
  const now = new Date();
  const events: GamificationEvent[] = [];
  
  // Day 1: Connect device and record initial metrics
  const day1 = new Date(now);
  day1.setDate(day1.getDate() - 6); // 6 days ago
  
  events.push(
    // Connect device
    {
      ...eventFixtures.health.deviceConnected(userId),
      timestamp: day1.toISOString()
    },
    
    // Record heart rate
    {
      ...eventFixtures.health.metricRecorded(userId),
      timestamp: day1.toISOString(),
      payload: {
        ...eventFixtures.health.metricRecorded(userId).payload,
        timestamp: day1.toISOString()
      }
    },
    
    // Record steps
    {
      ...eventFixtures.health.metricRecorded(userId),
      timestamp: day1.toISOString(),
      type: EventType.HEALTH_METRIC_RECORDED,
      payload: {
        timestamp: day1.toISOString(),
        metricType: 'STEPS',
        value: 8000,
        unit: 'steps',
        source: 'device',
        isWithinHealthyRange: true
      }
    }
  );
  
  // Days 2-7: Record metrics daily and achieve goals
  for (let i = 1; i <= 6; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() - (6 - i)); // 5 days ago to today
    
    events.push(
      // Record heart rate
      {
        ...eventFixtures.health.metricRecorded(userId),
        timestamp: day.toISOString(),
        payload: {
          ...eventFixtures.health.metricRecorded(userId).payload,
          timestamp: day.toISOString(),
          value: 70 + Math.floor(Math.random() * 10) // Random heart rate 70-79
        }
      },
      
      // Record steps
      {
        ...eventFixtures.health.metricRecorded(userId),
        timestamp: day.toISOString(),
        type: EventType.HEALTH_METRIC_RECORDED,
        payload: {
          timestamp: day.toISOString(),
          metricType: 'STEPS',
          value: 9000 + Math.floor(Math.random() * 2000), // Random steps 9000-11000
          unit: 'steps',
          source: 'device',
          isWithinHealthyRange: true
        }
      }
    );
    
    // Add goal achievement events for days with enough steps
    if (i % 2 === 0) { // Every other day
      events.push(
        {
          ...eventFixtures.health.goalAchieved(userId),
          timestamp: day.toISOString(),
          payload: {
            ...eventFixtures.health.goalAchieved(userId).payload,
            timestamp: day.toISOString(),
            streakCount: Math.floor(i / 2) // Increasing streak count
          }
        }
      );
    }
    
    // Add sleep tracking for some days
    if (i % 3 === 0) { // Every third day
      events.push(
        {
          ...eventFixtures.health.metricRecorded(userId),
          timestamp: day.toISOString(),
          type: EventType.HEALTH_METRIC_RECORDED,
          payload: {
            timestamp: day.toISOString(),
            metricType: 'SLEEP',
            value: 7.5,
            unit: 'hours',
            source: 'device',
            isWithinHealthyRange: true
          }
        }
      );
    }
  }
  
  // Add health assessment on the last day
  events.push(
    {
      ...eventFixtures.health.assessmentCompleted(userId),
      timestamp: now.toISOString()
    }
  );
  
  return createHealthScenario(
    'health-full-journey-cycle',
    'Full Health Journey Cycle',
    'User completes a comprehensive health journey over 7 days, including device connection, daily metrics, goal achievements, and health assessment',
    events,
    [
      // Device connection achievement - unlocked
      generateUserAchievementFixture(
        achievementFixtures.health.deviceConnection[0],
        userId,
        AchievementStatus.UNLOCKED
      ),
      
      // Health metrics streak - level 1 unlocked, level 2 in progress
      generateUserAchievementFixture(
        achievementFixtures.health.healthMetricsStreak[0],
        userId,
        AchievementStatus.UNLOCKED
      ),
      generateUserAchievementFixture(
        achievementFixtures.health.healthMetricsStreak[1],
        userId,
        AchievementStatus.IN_PROGRESS,
        85 // 6/7 days progress towards level 2
      ),
      
      // Steps goal - level 1 unlocked
      generateUserAchievementFixture(
        achievementFixtures.health.stepsGoal[0],
        userId,
        AchievementStatus.UNLOCKED
      ),
      
      // Sleep tracking - in progress
      generateUserAchievementFixture(
        achievementFixtures.health.sleepTracking[0],
        userId,
        AchievementStatus.IN_PROGRESS,
        66 // 2/3 days progress
      )
    ],
    200, // Total XP gain from the full journey
    ['comprehensive', 'full-cycle', 'multi-day', 'multiple-achievements']
  );
})();

/**
 * All health journey scenarios combined for easy access
 */
export const healthJourneyScenarios = {
  firstTimeMetricRecording: firstTimeMetricRecordingScenario,
  healthMetricsStreak: healthMetricsStreakScenario,
  firstStepGoal: firstStepGoalScenario,
  deviceConnection: deviceConnectionScenario,
  sleepTracking: sleepTrackingScenario,
  healthAssessment: healthAssessmentScenario,
  deviceSyncMultipleMetrics: deviceSyncMultipleMetricsScenario,
  multipleGoalAchievement: multipleGoalAchievementScenario,
  fullHealthJourneyCycle: fullHealthJourneyCycleScenario
};

export default healthJourneyScenarios;