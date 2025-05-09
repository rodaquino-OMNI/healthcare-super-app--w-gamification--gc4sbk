/**
 * Achievement Progression Scenarios
 * 
 * This file contains test fixtures for simulating user progression through different
 * achievement levels in the gamification system. These scenarios test level-up mechanics,
 * notification systems, and reward distribution across multiple journeys.
 * 
 * The scenarios cover:
 * - Multi-tier achievements with progression through levels
 * - Partial progress and completion states
 * - Edge cases like level skipping and achievement resetting
 * - Compatibility with the achievement notification system
 * - Cross-journey achievement tracking
 * 
 * These test fixtures are used by the gamification engine's test suite to validate
 * achievement progression logic, ensuring that users receive appropriate rewards,
 * notifications, and progress tracking across all journeys.
 */

import { v4 as uuidv4 } from 'uuid';
import { JourneyType } from '@austa/interfaces/journey';
import { Achievement, UserAchievement, AchievementPresentation } from '@austa/interfaces/gamification';
import { EventType, GamificationEvent } from '@austa/interfaces/gamification/events';
import { GameProfile } from '@austa/interfaces/gamification/profiles';
import { Reward } from '@austa/interfaces/gamification/rewards';

/**
 * Interface for achievement level definition
 * Represents a single tier/level within a multi-tiered achievement
 */
export interface AchievementLevel {
  /** The numeric level (1-based) */
  level: number;
  /** Display title for this achievement level */
  title: string;
  /** Detailed description of what this level represents */
  description: string;
  /** XP reward granted when this level is unlocked */
  xpReward: number;
  /** Progress percentage required to unlock this level (0-100) */
  requiredProgress: number;
  /** Icon identifier for visual representation */
  icon: string;
  /** Optional badge awarded at this level */
  badgeId?: string;
  /** Optional metadata for level-specific properties */
  metadata?: Record<string, any>;
}

/**
 * Interface for tiered achievement definition
 * Represents a multi-level achievement with progression through tiers
 */
export interface TieredAchievement {
  /** Unique identifier for the achievement */
  id: string;
  /** Base name of the achievement (without level indicator) */
  name: string;
  /** The journey this achievement belongs to */
  journey: JourneyType | string;
  /** Array of levels/tiers for this achievement */
  levels: AchievementLevel[];
  /** Current level of progression (0 = not started) */
  currentLevel?: number;
  /** Maximum level available for this achievement */
  maxLevel: number;
  /** Whether this achievement can be reset and earned again */
  repeatable?: boolean;
  /** Whether this achievement is featured in the UI */
  featured?: boolean;
  /** Whether this achievement is secret (hidden until unlocked) */
  secret?: boolean;
  /** Optional category for grouping related achievements */
  category?: string;
  /** Optional metadata for achievement-specific properties */
  metadata?: Record<string, any>;
}

/**
 * Interface for achievement progression scenario
 */
export interface AchievementProgressionScenario {
  id: string;
  name: string;
  description: string;
  userId: string;
  tieredAchievement: TieredAchievement;
  progressSteps: ProgressStep[];
  expectedNotifications: number;
  expectedRewards: number;
  metadata?: Record<string, any>;
}

/**
 * Interface for a single progress step in a scenario
 */
export interface ProgressStep {
  stepId: string;
  description: string;
  progressIncrement: number;
  eventType: EventType | string;
  eventPayload: Record<string, any>;
  expectedProgress: number;
  expectedLevel?: number;
  shouldUnlock?: boolean;
  shouldNotify?: boolean;
  shouldReward?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Creates a multi-level achievement for testing
 */
export function createTieredAchievement(journey: JourneyType, name: string, levels: number = 3): TieredAchievement {
  const achievementLevels: AchievementLevel[] = [];
  
  for (let i = 1; i <= levels; i++) {
    achievementLevels.push({
      level: i,
      title: `${name} Level ${i}`,
      description: `Complete level ${i} of the ${name} achievement`,
      xpReward: i * 50,
      requiredProgress: i === levels ? 100 : (i * 100) / levels,
      icon: `${name.toLowerCase().replace(/\s+/g, '-')}-level-${i}`
    });
  }
  
  return {
    id: uuidv4(),
    name,
    journey,
    levels: achievementLevels,
    currentLevel: 0,
    maxLevel: levels
  };
}

/**
 * Creates an achievement entity from a tiered achievement and level
 */
export function createAchievementEntity(tieredAchievement: TieredAchievement, level: number): Achievement {
  const achievementLevel = tieredAchievement.levels[level - 1];
  
  return {
    id: `${tieredAchievement.id}-level-${level}`,
    title: achievementLevel.title,
    description: achievementLevel.description,
    journey: tieredAchievement.journey,
    icon: achievementLevel.icon,
    xpReward: achievementLevel.xpReward,
    total: 100 // Progress is always normalized to 0-100
  };
}

/**
 * Creates a user achievement entity for tracking progress
 */
export function createUserAchievementEntity(
  userId: string,
  achievement: Achievement,
  progress: number = 0,
  unlocked: boolean = false
): UserAchievement {
  return {
    profileId: userId,
    achievementId: achievement.id,
    progress,
    unlocked,
    unlockedAt: unlocked ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    achievement
  };
}

/**
 * Scenario 1: Standard progression through a 3-level achievement
 * 
 * This scenario simulates a user progressing through all levels of a 3-tier achievement
 * in the health journey. Each level requires more progress than the previous one.
 */
export const standardProgressionScenario: AchievementProgressionScenario = {
  id: 'standard-progression',
  name: 'Standard Achievement Progression',
  description: 'User progresses through all levels of a 3-tier achievement in the health journey',
  userId: uuidv4(),
  tieredAchievement: createTieredAchievement(JourneyType.HEALTH, 'Health Tracker'),
  progressSteps: [
    // Level 1 progress steps
    {
      stepId: uuidv4(),
      description: 'User records first health metric',
      progressIncrement: 10,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'HEART_RATE', value: 75 },
      expectedProgress: 10,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: false
    },
    {
      stepId: uuidv4(),
      description: 'User records second health metric',
      progressIncrement: 15,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'BLOOD_PRESSURE', value: '120/80' },
      expectedProgress: 25,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: false
    },
    {
      stepId: uuidv4(),
      description: 'User completes level 1',
      progressIncrement: 10,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'WEIGHT', value: 70 },
      expectedProgress: 35, // Reaches level 1 threshold (33.33%)
      expectedLevel: 1,
      shouldUnlock: true,
      shouldNotify: true,
      shouldReward: true
    },
    
    // Level 2 progress steps
    {
      stepId: uuidv4(),
      description: 'User continues progress in level 2',
      progressIncrement: 15,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'STEPS', value: 8000 },
      expectedProgress: 50,
      expectedLevel: 2,
      shouldUnlock: false,
      shouldNotify: false
    },
    {
      stepId: uuidv4(),
      description: 'User completes level 2',
      progressIncrement: 20,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'SLEEP', value: 8 },
      expectedProgress: 70, // Reaches level 2 threshold (66.66%)
      expectedLevel: 2,
      shouldUnlock: true,
      shouldNotify: true,
      shouldReward: true
    },
    
    // Level 3 progress steps
    {
      stepId: uuidv4(),
      description: 'User continues progress in level 3',
      progressIncrement: 15,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'BLOOD_GLUCOSE', value: 85 },
      expectedProgress: 85,
      expectedLevel: 3,
      shouldUnlock: false,
      shouldNotify: false
    },
    {
      stepId: uuidv4(),
      description: 'User completes level 3 (final level)',
      progressIncrement: 15,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'HEART_RATE', value: 72 },
      expectedProgress: 100, // Reaches level 3 threshold (100%)
      expectedLevel: 3,
      shouldUnlock: true,
      shouldNotify: true,
      shouldReward: true
    }
  ],
  expectedNotifications: 3, // One for each level completion
  expectedRewards: 3 // One for each level completion
};

/**
 * Scenario 2: Rapid progression with level skipping
 * 
 * This scenario simulates a user making rapid progress and skipping levels
 * in a care journey achievement. The user jumps from level 1 to level 3 directly.
 */
export const levelSkippingScenario: AchievementProgressionScenario = {
  id: 'level-skipping',
  name: 'Level Skipping Progression',
  description: 'User skips level 2 by making rapid progress in a care journey achievement',
  userId: uuidv4(),
  tieredAchievement: createTieredAchievement(JourneyType.CARE, 'Appointment Master'),
  progressSteps: [
    {
      stepId: uuidv4(),
      description: 'User schedules first appointment',
      progressIncrement: 20,
      eventType: 'care.appointment.scheduled',
      eventPayload: { appointmentId: uuidv4(), providerId: uuidv4() },
      expectedProgress: 20,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: false
    },
    {
      stepId: uuidv4(),
      description: 'User makes significant progress by attending multiple appointments',
      progressIncrement: 80,
      eventType: 'care.appointment.completed',
      eventPayload: { appointmentId: uuidv4(), providerId: uuidv4(), rating: 5 },
      expectedProgress: 100, // Jumps to 100% completion
      expectedLevel: 3, // Skips level 2
      shouldUnlock: true,
      shouldNotify: true,
      shouldReward: true,
      metadata: {
        skippedLevels: [2],
        bonusXp: 50 // Bonus XP for rapid progression
      }
    }
  ],
  expectedNotifications: 1, // Only one notification for the final level
  expectedRewards: 3, // Still gets rewards for all levels
  metadata: {
    levelSkipping: true,
    bonusXpEnabled: true
  }
};

/**
 * Scenario 3: Partial progress with achievement reset
 * 
 * This scenario simulates a user making partial progress on an achievement,
 * then having their progress reset due to inactivity or a rule change.
 */
export const progressResetScenario: AchievementProgressionScenario = {
  id: 'progress-reset',
  name: 'Progress Reset Scenario',
  description: 'User progress is reset after period of inactivity in a plan journey achievement',
  userId: uuidv4(),
  tieredAchievement: createTieredAchievement(JourneyType.PLAN, 'Claim Submitter'),
  progressSteps: [
    {
      stepId: uuidv4(),
      description: 'User submits first claim',
      progressIncrement: 25,
      eventType: 'plan.claim.submitted',
      eventPayload: { claimId: uuidv4(), amount: 150.00 },
      expectedProgress: 25,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: false
    },
    {
      stepId: uuidv4(),
      description: 'User progress is reset due to inactivity',
      progressIncrement: -25, // Negative increment to reset progress
      eventType: 'system.achievement.reset',
      eventPayload: { reason: 'inactivity', daysInactive: 30 },
      expectedProgress: 0, // Progress reset to 0
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: true, // Notify user about the reset
      metadata: {
        resetReason: 'inactivity',
        resetTimestamp: new Date().toISOString()
      }
    },
    {
      stepId: uuidv4(),
      description: 'User starts progress again',
      progressIncrement: 15,
      eventType: 'plan.claim.submitted',
      eventPayload: { claimId: uuidv4(), amount: 75.00 },
      expectedProgress: 15,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: false
    },
    {
      stepId: uuidv4(),
      description: 'User continues progress after reset',
      progressIncrement: 20,
      eventType: 'plan.claim.submitted',
      eventPayload: { claimId: uuidv4(), amount: 100.00 },
      expectedProgress: 35, // Reaches level 1 threshold (33.33%)
      expectedLevel: 1,
      shouldUnlock: true,
      shouldNotify: true,
      shouldReward: true
    }
  ],
  expectedNotifications: 2, // One for reset, one for level completion
  expectedRewards: 1 // One for level completion
};

/**
 * Scenario 4: Cross-journey achievement progression
 * 
 * This scenario simulates a user progressing through a cross-journey achievement
 * that requires actions in multiple journeys (health, care, and plan).
 */
export const crossJourneyScenario: AchievementProgressionScenario = {
  id: 'cross-journey',
  name: 'Cross-Journey Achievement',
  description: 'User progresses through an achievement requiring actions across multiple journeys',
  userId: uuidv4(),
  tieredAchievement: {
    id: uuidv4(),
    name: 'Wellness Champion',
    journey: 'cross-journey' as JourneyType, // Custom journey type for cross-journey
    levels: [
      {
        level: 1,
        title: 'Wellness Beginner',
        description: 'Start your wellness journey across health, care, and plan',
        xpReward: 100,
        requiredProgress: 33.33,
        icon: 'wellness-champion-level-1'
      },
      {
        level: 2,
        title: 'Wellness Enthusiast',
        description: 'Deepen your engagement across all wellness journeys',
        xpReward: 200,
        requiredProgress: 66.66,
        icon: 'wellness-champion-level-2'
      },
      {
        level: 3,
        title: 'Wellness Champion',
        description: 'Become a champion of wellness across all journeys',
        xpReward: 300,
        requiredProgress: 100,
        icon: 'wellness-champion-level-3'
      }
    ],
    currentLevel: 0,
    maxLevel: 3
  },
  progressSteps: [
    // Health journey contribution
    {
      stepId: uuidv4(),
      description: 'User records health metrics',
      progressIncrement: 10,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'HEART_RATE', value: 72 },
      expectedProgress: 10,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: false,
      metadata: {
        journeyContribution: 'health'
      }
    },
    {
      stepId: uuidv4(),
      description: 'User sets health goal',
      progressIncrement: 10,
      eventType: 'health.goal.created',
      eventPayload: { goalType: 'STEPS', target: 10000 },
      expectedProgress: 20,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: false,
      metadata: {
        journeyContribution: 'health'
      }
    },
    
    // Care journey contribution
    {
      stepId: uuidv4(),
      description: 'User schedules appointment',
      progressIncrement: 10,
      eventType: 'care.appointment.scheduled',
      eventPayload: { appointmentId: uuidv4(), providerId: uuidv4() },
      expectedProgress: 30,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: false,
      metadata: {
        journeyContribution: 'care'
      }
    },
    {
      stepId: uuidv4(),
      description: 'User completes level 1 with care journey action',
      progressIncrement: 5,
      eventType: 'care.appointment.completed',
      eventPayload: { appointmentId: uuidv4(), providerId: uuidv4() },
      expectedProgress: 35, // Reaches level 1 threshold (33.33%)
      expectedLevel: 1,
      shouldUnlock: true,
      shouldNotify: true,
      shouldReward: true,
      metadata: {
        journeyContribution: 'care',
        completedJourneys: ['health', 'care']
      }
    },
    
    // Plan journey contribution
    {
      stepId: uuidv4(),
      description: 'User submits claim',
      progressIncrement: 15,
      eventType: 'plan.claim.submitted',
      eventPayload: { claimId: uuidv4(), amount: 150.00 },
      expectedProgress: 50,
      expectedLevel: 2,
      shouldUnlock: false,
      shouldNotify: false,
      metadata: {
        journeyContribution: 'plan'
      }
    },
    {
      stepId: uuidv4(),
      description: 'User views benefits',
      progressIncrement: 15,
      eventType: 'plan.benefits.viewed',
      eventPayload: { benefitId: uuidv4() },
      expectedProgress: 65,
      expectedLevel: 2,
      shouldUnlock: false,
      shouldNotify: false,
      metadata: {
        journeyContribution: 'plan'
      }
    },
    {
      stepId: uuidv4(),
      description: 'User completes level 2 with plan journey action',
      progressIncrement: 5,
      eventType: 'plan.coverage.checked',
      eventPayload: { procedureCode: 'ABC123' },
      expectedProgress: 70, // Reaches level 2 threshold (66.66%)
      expectedLevel: 2,
      shouldUnlock: true,
      shouldNotify: true,
      shouldReward: true,
      metadata: {
        journeyContribution: 'plan',
        completedJourneys: ['health', 'care', 'plan']
      }
    },
    
    // Final level completion with actions from all journeys
    {
      stepId: uuidv4(),
      description: 'User makes final progress with health action',
      progressIncrement: 10,
      eventType: 'health.goal.achieved',
      eventPayload: { goalId: uuidv4() },
      expectedProgress: 80,
      expectedLevel: 3,
      shouldUnlock: false,
      shouldNotify: false,
      metadata: {
        journeyContribution: 'health'
      }
    },
    {
      stepId: uuidv4(),
      description: 'User continues with care action',
      progressIncrement: 10,
      eventType: 'care.medication.tracked',
      eventPayload: { medicationId: uuidv4() },
      expectedProgress: 90,
      expectedLevel: 3,
      shouldUnlock: false,
      shouldNotify: false,
      metadata: {
        journeyContribution: 'care'
      }
    },
    {
      stepId: uuidv4(),
      description: 'User completes final level with plan action',
      progressIncrement: 10,
      eventType: 'plan.claim.approved',
      eventPayload: { claimId: uuidv4(), amount: 200.00 },
      expectedProgress: 100, // Reaches level 3 threshold (100%)
      expectedLevel: 3,
      shouldUnlock: true,
      shouldNotify: true,
      shouldReward: true,
      metadata: {
        journeyContribution: 'plan',
        completedJourneys: ['health', 'care', 'plan'],
        allJourneysCompleted: true
      }
    }
  ],
  expectedNotifications: 3, // One for each level completion
  expectedRewards: 3, // One for each level completion
  metadata: {
    crossJourney: true,
    requiredJourneys: ['health', 'care', 'plan']
  }
};

/**
 * Scenario 5: Achievement with notification testing
 * 
 * This scenario focuses on testing the achievement notification system,
 * including different notification types and delivery channels.
 */
export const notificationTestingScenario: AchievementProgressionScenario = {
  id: 'notification-testing',
  name: 'Achievement Notification Testing',
  description: 'Tests various notification types and delivery channels for achievements',
  userId: uuidv4(),
  tieredAchievement: createTieredAchievement(JourneyType.HEALTH, 'Notification Tester', 1),
  progressSteps: [
    {
      stepId: uuidv4(),
      description: 'User makes progress with in-app notification',
      progressIncrement: 50,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'HEART_RATE', value: 72 },
      expectedProgress: 50,
      expectedLevel: 1,
      shouldUnlock: false,
      shouldNotify: true, // Test progress notification
      metadata: {
        notificationType: 'progress',
        notificationChannel: 'in-app',
        notificationPriority: 'low'
      }
    },
    {
      stepId: uuidv4(),
      description: 'User completes achievement with multi-channel notification',
      progressIncrement: 50,
      eventType: 'health.metric.recorded',
      eventPayload: { metricType: 'BLOOD_PRESSURE', value: '120/80' },
      expectedProgress: 100,
      expectedLevel: 1,
      shouldUnlock: true,
      shouldNotify: true, // Test completion notification
      shouldReward: true,
      metadata: {
        notificationType: 'achievement_unlocked',
        notificationChannels: ['in-app', 'push', 'email'],
        notificationPriority: 'high',
        notificationTemplate: 'achievement_unlocked_template',
        notificationData: {
          achievementTitle: 'Notification Tester Level 1',
          xpAwarded: 50,
          congratsMessage: 'Congratulations on unlocking this achievement!'
        }
      }
    }
  ],
  expectedNotifications: 2, // One for progress, one for completion
  expectedRewards: 1, // One for completion
  metadata: {
    notificationTesting: true,
    testChannels: ['in-app', 'push', 'email']
  }
};

/**
 * Scenario 6: Multi-tier achievement with complex progression rules
 * 
 * This scenario tests a complex achievement with multiple tiers and special
 * progression rules, including streak bonuses and milestone rewards.
 */
export const complexProgressionScenario: AchievementProgressionScenario = {
  id: 'complex-progression',
  name: 'Complex Achievement Progression',
  description: 'Tests complex progression rules with streaks and milestones',
  userId: uuidv4(),
  tieredAchievement: {
    id: uuidv4(),
    name: 'Wellness Streak',
    journey: JourneyType.HEALTH,
    levels: [
      {
        level: 1,
        title: 'Wellness Streak Bronze',
        description: 'Maintain a 7-day streak of health check-ins',
        xpReward: 75,
        requiredProgress: 25,
        icon: 'wellness-streak-bronze',
        metadata: {
          requiredDays: 7,
          streakBonus: 10
        }
      },
      {
        level: 2,
        title: 'Wellness Streak Silver',
        description: 'Maintain a 14-day streak of health check-ins',
        xpReward: 150,
        requiredProgress: 50,
        icon: 'wellness-streak-silver',
        metadata: {
          requiredDays: 14,
          streakBonus: 20
        }
      },
      {
        level: 3,
        title: 'Wellness Streak Gold',
        description: 'Maintain a 30-day streak of health check-ins',
        xpReward: 300,
        requiredProgress: 75,
        icon: 'wellness-streak-gold',
        metadata: {
          requiredDays: 30,
          streakBonus: 30
        }
      },
      {
        level: 4,
        title: 'Wellness Streak Platinum',
        description: 'Maintain a 60-day streak of health check-ins',
        xpReward: 500,
        requiredProgress: 100,
        icon: 'wellness-streak-platinum',
        badgeId: 'wellness-master',
        metadata: {
          requiredDays: 60,
          streakBonus: 50,
          unlocksBadge: true
        }
      }
    ],
    currentLevel: 0,
    maxLevel: 4,
    repeatable: true,
    featured: true,
    metadata: {
      streakBased: true,
      dailyCheckRequired: true,
      resetOnMissedDay: true
    }
  },
  progressSteps: [
    // Level 1 progress - 7 day streak
    ...Array(7).fill(null).map((_, index) => ({
      stepId: uuidv4(),
      description: `Day ${index + 1} of health check-in streak`,
      progressIncrement: 3.5, // 7 days = 25% progress (3.57% per day)
      eventType: 'health.check.completed',
      eventPayload: { day: index + 1, timestamp: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString() },
      expectedProgress: Math.min(25, (index + 1) * 3.5),
      expectedLevel: 1,
      shouldUnlock: index === 6, // Unlock on day 7
      shouldNotify: index === 6,
      shouldReward: index === 6,
      metadata: {
        streakDay: index + 1,
        streakMilestone: index === 6 ? '7-day' : undefined
      }
    })),
    
    // Level 2 progress - 14 day streak
    ...Array(7).fill(null).map((_, index) => ({
      stepId: uuidv4(),
      description: `Day ${index + 8} of health check-in streak`,
      progressIncrement: 3.5, // 7 more days = 50% progress
      eventType: 'health.check.completed',
      eventPayload: { day: index + 8, timestamp: new Date(Date.now() + (index + 7) * 24 * 60 * 60 * 1000).toISOString() },
      expectedProgress: Math.min(50, 25 + (index + 1) * 3.5),
      expectedLevel: 2,
      shouldUnlock: index === 6, // Unlock on day 14
      shouldNotify: index === 6,
      shouldReward: index === 6,
      metadata: {
        streakDay: index + 8,
        streakMilestone: index === 6 ? '14-day' : undefined
      }
    })),
    
    // Level 3 progress - 30 day streak (16 more days)
    ...Array(16).fill(null).map((_, index) => ({
      stepId: uuidv4(),
      description: `Day ${index + 15} of health check-in streak`,
      progressIncrement: 1.56, // 16 more days = 25% more progress
      eventType: 'health.check.completed',
      eventPayload: { day: index + 15, timestamp: new Date(Date.now() + (index + 14) * 24 * 60 * 60 * 1000).toISOString() },
      expectedProgress: Math.min(75, 50 + (index + 1) * 1.56),
      expectedLevel: 3,
      shouldUnlock: index === 15, // Unlock on day 30
      shouldNotify: index === 15,
      shouldReward: index === 15,
      metadata: {
        streakDay: index + 15,
        streakMilestone: index === 15 ? '30-day' : undefined
      }
    })),
    
    // Level 4 progress - 60 day streak (30 more days)
    ...Array(30).fill(null).map((_, index) => ({
      stepId: uuidv4(),
      description: `Day ${index + 31} of health check-in streak`,
      progressIncrement: 0.83, // 30 more days = 25% more progress
      eventType: 'health.check.completed',
      eventPayload: { day: index + 31, timestamp: new Date(Date.now() + (index + 30) * 24 * 60 * 60 * 1000).toISOString() },
      expectedProgress: Math.min(100, 75 + (index + 1) * 0.83),
      expectedLevel: 4,
      shouldUnlock: index === 29, // Unlock on day 60
      shouldNotify: index === 29,
      shouldReward: index === 29,
      metadata: {
        streakDay: index + 31,
        streakMilestone: index === 29 ? '60-day' : undefined,
        unlocksBadge: index === 29
      }
    }))
  ],
  expectedNotifications: 4, // One for each level completion
  expectedRewards: 4, // One for each level completion
  metadata: {
    streakBased: true,
    totalDays: 60,
    badgeUnlocked: 'wellness-master',
    totalXpPossible: 1025 // 75 + 150 + 300 + 500
  }
};

/**
 * Collection of all achievement progression scenarios
 */
export const achievementProgressionScenarios: AchievementProgressionScenario[] = [
  standardProgressionScenario,
  levelSkippingScenario,
  progressResetScenario,
  crossJourneyScenario,
  notificationTestingScenario,
  complexProgressionScenario
];

/**
 * Helper function to get a scenario by ID
 */
export function getScenarioById(scenarioId: string): AchievementProgressionScenario | undefined {
  return achievementProgressionScenarios.find(scenario => scenario.id === scenarioId);
}

/**
 * Helper function to create all achievement entities for a scenario
 */
export function createAchievementEntitiesForScenario(scenario: AchievementProgressionScenario): Achievement[] {
  const achievements: Achievement[] = [];
  
  for (let level = 1; level <= scenario.tieredAchievement.maxLevel; level++) {
    achievements.push(createAchievementEntity(scenario.tieredAchievement, level));
  }
  
  return achievements;
}

/**
 * Helper function to simulate progression through a scenario
 * 
 * This function processes all steps in a scenario and simulates the user's
 * progression through the achievement levels, triggering appropriate callbacks
 * for progress updates, level completions, and notifications.
 * 
 * @param scenario The achievement progression scenario to simulate
 * @param onProgressUpdate Optional callback when progress is updated
 * @param onLevelComplete Optional callback when a level is completed
 * @param onNotification Optional callback when a notification should be sent
 * @param onReward Optional callback when a reward should be granted
 * @returns Array of UserAchievement objects representing the final state
 */
export function simulateScenarioProgression(
  scenario: AchievementProgressionScenario,
  onProgressUpdate?: (step: ProgressStep, userAchievement: UserAchievement) => void,
  onLevelComplete?: (level: number, achievement: Achievement) => void,
  onNotification?: (step: ProgressStep, achievement: Achievement) => void,
  onReward?: (level: number, achievement: Achievement, xpAmount: number) => void
): UserAchievement[] {
  const achievements = createAchievementEntitiesForScenario(scenario);
  const userAchievements: UserAchievement[] = achievements.map(achievement => 
    createUserAchievementEntity(scenario.userId, achievement)
  );
  
  let currentLevel = 1;
  let currentUserAchievement = userAchievements[currentLevel - 1];
  
  for (const step of scenario.progressSteps) {
    // Update progress
    currentUserAchievement.progress += step.progressIncrement;
    
    // Ensure progress is within bounds
    if (currentUserAchievement.progress < 0) currentUserAchievement.progress = 0;
    if (currentUserAchievement.progress > 100) currentUserAchievement.progress = 100;
    
    // Check if level changed
    if (step.expectedLevel && step.expectedLevel !== currentLevel) {
      currentLevel = step.expectedLevel;
      currentUserAchievement = userAchievements[currentLevel - 1];
    }
    
    // Update unlock status if needed
    if (step.shouldUnlock) {
      currentUserAchievement.unlocked = true;
      currentUserAchievement.unlockedAt = new Date();
      
      if (onLevelComplete) {
        onLevelComplete(currentLevel, achievements[currentLevel - 1]);
      }
    }
    
    // Trigger notification if needed
    if (step.shouldNotify && onNotification) {
      onNotification(step, achievements[currentLevel - 1]);
    }
    
    // Trigger reward if needed
    if (step.shouldReward && onReward) {
      const achievement = achievements[currentLevel - 1];
      const xpAmount = scenario.tieredAchievement.levels[currentLevel - 1].xpReward;
      onReward(currentLevel, achievement, xpAmount);
    }
    
    // Callback for progress update
    if (onProgressUpdate) {
      onProgressUpdate(step, currentUserAchievement);
    }
  }
  
  return userAchievements;
}

/**
 * Helper function to create a reward from an achievement level
 */
export function createRewardFromAchievement(achievement: Achievement, level: number): Reward {
  return {
    id: `reward-${achievement.id}-level-${level}`,
    title: `Reward for ${achievement.title}`,
    description: `Reward for completing ${achievement.title}`,
    xpValue: achievement.xpReward,
    iconPath: `rewards/${achievement.icon}-reward`,
    journey: achievement.journey as JourneyType,
    type: 'achievement_reward',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      achievementId: achievement.id,
      achievementLevel: level
    }
  };
}

/**
 * Helper function to create a notification event for achievement progress or completion
 */
export function createAchievementNotificationEvent(
  userId: string,
  achievement: Achievement,
  progress: number,
  unlocked: boolean = false
): GamificationEvent {
  return {
    id: uuidv4(),
    type: unlocked ? EventType.ACHIEVEMENT_UNLOCKED : EventType.ACHIEVEMENT_PROGRESS,
    userId,
    timestamp: new Date(),
    journey: achievement.journey as JourneyType,
    payload: {
      achievementId: achievement.id,
      title: achievement.title,
      description: achievement.description,
      progress,
      unlocked,
      xpReward: unlocked ? achievement.xpReward : 0
    },
    metadata: {
      notificationType: unlocked ? 'achievement_unlocked' : 'achievement_progress',
      notificationPriority: unlocked ? 'high' : 'medium',
      iconPath: achievement.icon
    }
  };
}

/**
 * Helper function to create a game profile with achievement progress
 */
export function createGameProfileWithAchievements(
  userId: string,
  userAchievements: UserAchievement[]
): GameProfile {
  // Calculate total XP from unlocked achievements
  const totalXp = userAchievements.reduce((sum, ua) => {
    if (ua.unlocked && ua.achievement) {
      return sum + ua.achievement.xpReward;
    }
    return sum;
  }, 0);
  
  // Calculate level based on XP (simple formula: 100 XP per level)
  const level = Math.floor(totalXp / 100) + 1;
  
  return {
    id: uuidv4(),
    userId,
    level,
    xp: totalXp,
    totalXp,
    createdAt: new Date(),
    updatedAt: new Date(),
    achievements: userAchievements.length,
    unlockedAchievements: userAchievements.filter(ua => ua.unlocked).length,
    metadata: {
      journeyProgress: {
        health: userAchievements
          .filter(ua => ua.achievement?.journey === JourneyType.HEALTH && ua.unlocked)
          .length,
        care: userAchievements
          .filter(ua => ua.achievement?.journey === JourneyType.CARE && ua.unlocked)
          .length,
        plan: userAchievements
          .filter(ua => ua.achievement?.journey === JourneyType.PLAN && ua.unlocked)
          .length
      }
    }
  };
}

export default {
  achievementProgressionScenarios,
  standardProgressionScenario,
  levelSkippingScenario,
  progressResetScenario,
  crossJourneyScenario,
  notificationTestingScenario,
  complexProgressionScenario,
  getScenarioById,
  createAchievementEntitiesForScenario,
  simulateScenarioProgression,
  createTieredAchievement,
  createAchievementEntity,
  createUserAchievementEntity,
  createRewardFromAchievement,
  createAchievementNotificationEvent,
  createGameProfileWithAchievements
};