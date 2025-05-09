/**
 * @file Achievement Test Fixtures
 * @description Provides standardized test fixtures for achievement entities and achievement types
 * in the gamification engine. Contains mock data for different achievement levels, journey-specific
 * achievements, and achievement progress states.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Achievement, 
  JourneyType,
  UserAchievement,
  HealthAchievement,
  CareAchievement,
  PlanAchievement,
  AchievementPresentation
} from '@austa/interfaces/gamification/achievements';
import { 
  EventType, 
  HealthEventType, 
  CareEventType, 
  PlanEventType,
  CommonEventType
} from '@austa/interfaces/gamification/event-types';
import { EventSchema } from '@austa/interfaces/gamification/events';

/**
 * Base achievement fixture factory
 * Creates a basic achievement with default values that can be overridden
 */
export const createAchievementFixture = (overrides?: Partial<Achievement>): Achievement => ({
  id: uuidv4(),
  title: 'Test Achievement',
  description: 'This is a test achievement',
  journey: JourneyType.HEALTH,
  icon: 'trophy',
  xpReward: 100,
  total: 1,
  ...overrides
});

/**
 * User achievement fixture factory
 * Creates a user achievement with default values that can be overridden
 */
export const createUserAchievementFixture = (
  achievementId: string = uuidv4(),
  overrides?: Partial<UserAchievement>
): UserAchievement => ({
  profileId: uuidv4(),
  achievementId,
  progress: 0,
  unlocked: false,
  unlockedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

/**
 * Achievement presentation fixture factory
 * Creates an achievement presentation with default values that can be overridden
 */
export const createAchievementPresentationFixture = (
  overrides?: Partial<AchievementPresentation>
): AchievementPresentation => ({
  id: uuidv4(),
  title: 'Test Achievement',
  description: 'This is a test achievement',
  journey: JourneyType.HEALTH,
  icon: 'trophy',
  progress: 0,
  total: 1,
  unlocked: false,
  xpReward: 100,
  unlockedAt: null,
  ...overrides
});

/**
 * Health journey achievement fixture factory
 * Creates a health-specific achievement with appropriate metadata
 */
export const createHealthAchievementFixture = (
  overrides?: Partial<HealthAchievement>
): HealthAchievement => ({
  ...createAchievementFixture({
    journey: JourneyType.HEALTH,
    icon: 'heart-pulse',
    ...overrides
  })
}) as HealthAchievement;

/**
 * Care journey achievement fixture factory
 * Creates a care-specific achievement with appropriate metadata
 */
export const createCareAchievementFixture = (
  overrides?: Partial<CareAchievement>
): CareAchievement => ({
  ...createAchievementFixture({
    journey: JourneyType.CARE,
    icon: 'stethoscope',
    ...overrides
  })
}) as CareAchievement;

/**
 * Plan journey achievement fixture factory
 * Creates a plan-specific achievement with appropriate metadata
 */
export const createPlanAchievementFixture = (
  overrides?: Partial<PlanAchievement>
): PlanAchievement => ({
  ...createAchievementFixture({
    journey: JourneyType.PLAN,
    icon: 'shield-check',
    ...overrides
  })
}) as PlanAchievement;

/**
 * Achievement level progression fixtures
 * Provides a set of achievements with increasing difficulty and rewards
 */
export const achievementLevelFixtures = {
  level1: createAchievementFixture({
    title: 'Bronze Achievement',
    description: 'Complete the first level',
    xpReward: 100,
    total: 5,
    icon: 'medal-bronze'
  }),
  level2: createAchievementFixture({
    title: 'Silver Achievement',
    description: 'Complete the second level',
    xpReward: 250,
    total: 10,
    icon: 'medal-silver'
  }),
  level3: createAchievementFixture({
    title: 'Gold Achievement',
    description: 'Complete the third level',
    xpReward: 500,
    total: 25,
    icon: 'medal-gold'
  })
};

/**
 * Achievement progress state fixtures
 * Provides user achievements in different states of progress
 */
export const achievementProgressFixtures = {
  notStarted: createUserAchievementFixture(achievementLevelFixtures.level1.id, {
    progress: 0,
    unlocked: false
  }),
  inProgress: createUserAchievementFixture(achievementLevelFixtures.level1.id, {
    progress: 3,
    unlocked: false
  }),
  completed: createUserAchievementFixture(achievementLevelFixtures.level1.id, {
    progress: 5,
    unlocked: true,
    unlockedAt: new Date()
  }),
  overachieved: createUserAchievementFixture(achievementLevelFixtures.level1.id, {
    progress: 8, // Exceeded the required total
    unlocked: true,
    unlockedAt: new Date()
  })
};

/**
 * Health journey achievement fixtures
 * Provides a set of health-specific achievements
 */
export const healthAchievementFixtures = {
  stepGoal: createHealthAchievementFixture({
    id: uuidv4(),
    title: 'Step Master',
    description: 'Reach your daily step goal',
    xpReward: 50,
    total: 10,
    icon: 'footprints'
  }),
  healthCheckStreak: createHealthAchievementFixture({
    id: uuidv4(),
    title: 'Health Monitor',
    description: 'Record your health metrics for consecutive days',
    xpReward: 100,
    total: 7,
    icon: 'heart-pulse'
  }),
  deviceConnection: createHealthAchievementFixture({
    id: uuidv4(),
    title: 'Connected Health',
    description: 'Connect a health tracking device',
    xpReward: 75,
    total: 1,
    icon: 'smartwatch'
  }),
  weightGoal: createHealthAchievementFixture({
    id: uuidv4(),
    title: 'Weight Goal Achiever',
    description: 'Reach your weight goal',
    xpReward: 200,
    total: 1,
    icon: 'scale'
  }),
  sleepGoal: createHealthAchievementFixture({
    id: uuidv4(),
    title: 'Sleep Champion',
    description: 'Achieve your sleep goal for consecutive nights',
    xpReward: 150,
    total: 5,
    icon: 'moon'
  })
};

/**
 * Care journey achievement fixtures
 * Provides a set of care-specific achievements
 */
export const careAchievementFixtures = {
  appointmentKeeper: createCareAchievementFixture({
    id: uuidv4(),
    title: 'Appointment Keeper',
    description: 'Attend scheduled medical appointments',
    xpReward: 100,
    total: 3,
    icon: 'calendar-check'
  }),
  medicationAdherence: createCareAchievementFixture({
    id: uuidv4(),
    title: 'Medication Adherence',
    description: 'Take your medications as prescribed',
    xpReward: 150,
    total: 14,
    icon: 'pill'
  }),
  telemedicineUser: createCareAchievementFixture({
    id: uuidv4(),
    title: 'Telemedicine Pioneer',
    description: 'Complete a telemedicine consultation',
    xpReward: 75,
    total: 1,
    icon: 'video'
  }),
  symptomTracker: createCareAchievementFixture({
    id: uuidv4(),
    title: 'Symptom Tracker',
    description: 'Record your symptoms regularly',
    xpReward: 50,
    total: 5,
    icon: 'clipboard-list'
  }),
  treatmentCompleter: createCareAchievementFixture({
    id: uuidv4(),
    title: 'Treatment Completer',
    description: 'Complete a treatment plan',
    xpReward: 200,
    total: 1,
    icon: 'check-circle'
  })
};

/**
 * Plan journey achievement fixtures
 * Provides a set of plan-specific achievements
 */
export const planAchievementFixtures = {
  claimMaster: createPlanAchievementFixture({
    id: uuidv4(),
    title: 'Claim Master',
    description: 'Submit complete claims with all required documentation',
    xpReward: 100,
    total: 3,
    icon: 'receipt'
  }),
  benefitExplorer: createPlanAchievementFixture({
    id: uuidv4(),
    title: 'Benefit Explorer',
    description: 'Explore all available benefits in your plan',
    xpReward: 75,
    total: 5,
    icon: 'gift'
  }),
  documentOrganizer: createPlanAchievementFixture({
    id: uuidv4(),
    title: 'Document Organizer',
    description: 'Upload and organize all your insurance documents',
    xpReward: 50,
    total: 3,
    icon: 'folder-open'
  }),
  coverageOptimizer: createPlanAchievementFixture({
    id: uuidv4(),
    title: 'Coverage Optimizer',
    description: 'Compare and select the optimal coverage plan',
    xpReward: 150,
    total: 1,
    icon: 'shield-check'
  }),
  quickClaimer: createPlanAchievementFixture({
    id: uuidv4(),
    title: 'Quick Claimer',
    description: 'Submit a claim within 24 hours of service',
    xpReward: 100,
    total: 1,
    icon: 'clock'
  })
};

/**
 * Cross-journey achievement fixtures
 * Provides achievements that can be unlocked from multiple journeys
 */
export const crossJourneyAchievementFixtures = {
  wellnessWarrior: createAchievementFixture({
    id: uuidv4(),
    title: 'Wellness Warrior',
    description: 'Be active in all three journeys in a single week',
    journey: 'cross-journey',
    xpReward: 250,
    total: 1,
    icon: 'star'
  }),
  consistencyChampion: createAchievementFixture({
    id: uuidv4(),
    title: 'Consistency Champion',
    description: 'Log into the app for 30 consecutive days',
    journey: 'cross-journey',
    xpReward: 200,
    total: 30,
    icon: 'calendar'
  }),
  dataCompletionist: createAchievementFixture({
    id: uuidv4(),
    title: 'Data Completionist',
    description: 'Complete your profile information across all journeys',
    journey: 'cross-journey',
    xpReward: 150,
    total: 3, // One for each journey
    icon: 'user-check'
  }),
  feedbackProvider: createAchievementFixture({
    id: uuidv4(),
    title: 'Feedback Provider',
    description: 'Provide feedback in each journey',
    journey: 'cross-journey',
    xpReward: 100,
    total: 3, // One for each journey
    icon: 'message-square'
  }),
  superAppExplorer: createAchievementFixture({
    id: uuidv4(),
    title: 'SuperApp Explorer',
    description: 'Use all major features across all journeys',
    journey: 'cross-journey',
    xpReward: 300,
    total: 10, // Major features across journeys
    icon: 'compass'
  })
};

/**
 * Achievement event condition fixtures
 * Provides event schemas for triggering different achievements
 */
export const achievementEventConditionFixtures: Record<string, EventSchema> = {
  // Health journey event conditions
  stepGoal: {
    type: HealthEventType.GOAL_ACHIEVED,
    count: 10,
    metadata: {
      goalType: 'steps',
      minValue: 5000
    }
  },
  healthCheckStreak: {
    type: HealthEventType.HEALTH_METRIC_RECORDED,
    count: 7,
    metadata: {
      requireConsecutiveDays: true
    }
  },
  deviceConnection: {
    type: HealthEventType.DEVICE_CONNECTED,
    count: 1
  },
  
  // Care journey event conditions
  appointmentKeeper: {
    type: CareEventType.APPOINTMENT_ATTENDED,
    count: 3
  },
  medicationAdherence: {
    type: CareEventType.MEDICATION_TAKEN,
    count: 14,
    metadata: {
      requireConsecutiveDays: true,
      onSchedule: true
    }
  },
  telemedicineUser: {
    type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    count: 1
  },
  
  // Plan journey event conditions
  claimMaster: {
    type: PlanEventType.CLAIM_SUBMITTED,
    count: 3,
    metadata: {
      hasDocuments: true
    }
  },
  benefitExplorer: {
    type: PlanEventType.BENEFIT_VIEWED,
    count: 5,
    metadata: {
      uniqueBenefits: true
    }
  },
  documentOrganizer: {
    type: PlanEventType.DOCUMENT_UPLOADED,
    count: 3,
    metadata: {
      documentTypes: ['insurance', 'medical', 'receipt']
    }
  },
  
  // Cross-journey event conditions
  wellnessWarrior: {
    type: CommonEventType.ACHIEVEMENT_UNLOCKED,
    count: 3,
    metadata: {
      journeys: ['health', 'care', 'plan'],
      timeframe: 'week'
    }
  },
  consistencyChampion: {
    type: CommonEventType.USER_LOGGED_IN,
    count: 30,
    metadata: {
      requireConsecutiveDays: true
    }
  }
};

/**
 * Multi-level achievement fixtures
 * Provides sets of achievements with multiple levels of progression
 */
export const multiLevelAchievementFixtures = {
  // Health journey multi-level achievements
  stepMaster: {
    level1: createHealthAchievementFixture({
      id: uuidv4(),
      title: 'Step Beginner',
      description: 'Reach your daily step goal 5 times',
      xpReward: 50,
      total: 5,
      icon: 'footprints'
    }),
    level2: createHealthAchievementFixture({
      id: uuidv4(),
      title: 'Step Enthusiast',
      description: 'Reach your daily step goal 25 times',
      xpReward: 150,
      total: 25,
      icon: 'footprints'
    }),
    level3: createHealthAchievementFixture({
      id: uuidv4(),
      title: 'Step Master',
      description: 'Reach your daily step goal 100 times',
      xpReward: 500,
      total: 100,
      icon: 'footprints-gold'
    })
  },
  
  // Care journey multi-level achievements
  medicationAdherence: {
    level1: createCareAchievementFixture({
      id: uuidv4(),
      title: 'Medication Starter',
      description: 'Take your medications as prescribed for 7 days',
      xpReward: 75,
      total: 7,
      icon: 'pill'
    }),
    level2: createCareAchievementFixture({
      id: uuidv4(),
      title: 'Medication Regular',
      description: 'Take your medications as prescribed for 30 days',
      xpReward: 200,
      total: 30,
      icon: 'pill'
    }),
    level3: createCareAchievementFixture({
      id: uuidv4(),
      title: 'Medication Master',
      description: 'Take your medications as prescribed for 90 days',
      xpReward: 500,
      total: 90,
      icon: 'pill-gold'
    })
  },
  
  // Plan journey multi-level achievements
  claimExpert: {
    level1: createPlanAchievementFixture({
      id: uuidv4(),
      title: 'Claim Novice',
      description: 'Submit 3 complete claims',
      xpReward: 100,
      total: 3,
      icon: 'receipt'
    }),
    level2: createPlanAchievementFixture({
      id: uuidv4(),
      title: 'Claim Expert',
      description: 'Submit 10 complete claims',
      xpReward: 250,
      total: 10,
      icon: 'receipt'
    }),
    level3: createPlanAchievementFixture({
      id: uuidv4(),
      title: 'Claim Master',
      description: 'Submit 25 complete claims',
      xpReward: 500,
      total: 25,
      icon: 'receipt-gold'
    })
  }
};

/**
 * Achievement notification fixtures
 * Provides sample achievement notifications for testing UI components
 */
export const achievementNotificationFixtures = {
  health: {
    id: uuidv4(),
    achievementId: healthAchievementFixtures.stepGoal.id,
    title: 'Achievement Unlocked!',
    message: `Congratulations! You've unlocked the "${healthAchievementFixtures.stepGoal.title}" achievement.`,
    xpAwarded: healthAchievementFixtures.stepGoal.xpReward,
    iconPath: healthAchievementFixtures.stepGoal.icon,
    journey: JourneyType.HEALTH,
    timestamp: new Date().toISOString()
  },
  care: {
    id: uuidv4(),
    achievementId: careAchievementFixtures.appointmentKeeper.id,
    title: 'Achievement Unlocked!',
    message: `Congratulations! You've unlocked the "${careAchievementFixtures.appointmentKeeper.title}" achievement.`,
    xpAwarded: careAchievementFixtures.appointmentKeeper.xpReward,
    iconPath: careAchievementFixtures.appointmentKeeper.icon,
    journey: JourneyType.CARE,
    timestamp: new Date().toISOString()
  },
  plan: {
    id: uuidv4(),
    achievementId: planAchievementFixtures.claimMaster.id,
    title: 'Achievement Unlocked!',
    message: `Congratulations! You've unlocked the "${planAchievementFixtures.claimMaster.title}" achievement.`,
    xpAwarded: planAchievementFixtures.claimMaster.xpReward,
    iconPath: planAchievementFixtures.claimMaster.icon,
    journey: JourneyType.PLAN,
    timestamp: new Date().toISOString()
  },
  crossJourney: {
    id: uuidv4(),
    achievementId: crossJourneyAchievementFixtures.wellnessWarrior.id,
    title: 'Special Achievement Unlocked!',
    message: `Congratulations! You've unlocked the "${crossJourneyAchievementFixtures.wellnessWarrior.title}" achievement.`,
    xpAwarded: crossJourneyAchievementFixtures.wellnessWarrior.xpReward,
    iconPath: crossJourneyAchievementFixtures.wellnessWarrior.icon,
    journey: 'cross-journey',
    timestamp: new Date().toISOString()
  }
};

/**
 * Achievement test scenarios
 * Provides complete test scenarios for achievement-related functionality
 */
export const achievementTestScenarios = {
  // Scenario: User completes a health journey achievement
  healthAchievementUnlock: {
    userId: uuidv4(),
    achievement: healthAchievementFixtures.stepGoal,
    events: Array(10).fill(null).map((_, index) => ({
      type: HealthEventType.GOAL_ACHIEVED,
      userId: uuidv4(),
      payload: {
        data: {
          goalId: uuidv4(),
          goalType: 'steps',
          achievedAt: new Date(Date.now() - (9 - index) * 24 * 60 * 60 * 1000).toISOString(),
          targetValue: 10000,
          actualValue: 10500 + index * 100
        }
      },
      journey: JourneyType.HEALTH,
      timestamp: new Date(Date.now() - (9 - index) * 24 * 60 * 60 * 1000).toISOString(),
      version: '1.0.0'
    })),
    expectedResult: {
      unlocked: true,
      progress: 10,
      xpAwarded: healthAchievementFixtures.stepGoal.xpReward
    }
  },
  
  // Scenario: User makes progress on a care journey achievement but doesn't complete it
  careAchievementProgress: {
    userId: uuidv4(),
    achievement: careAchievementFixtures.medicationAdherence,
    events: Array(7).fill(null).map((_, index) => ({
      type: CareEventType.MEDICATION_TAKEN,
      userId: uuidv4(),
      payload: {
        data: {
          medicationId: uuidv4(),
          takenAt: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString(),
          onSchedule: true,
          streakDays: index + 1
        }
      },
      journey: JourneyType.CARE,
      timestamp: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString(),
      version: '1.0.0'
    })),
    expectedResult: {
      unlocked: false,
      progress: 7,
      xpAwarded: 0
    }
  },
  
  // Scenario: User completes a cross-journey achievement
  crossJourneyAchievementUnlock: {
    userId: uuidv4(),
    achievement: crossJourneyAchievementFixtures.dataCompletionist,
    events: [
      // Health journey profile completion
      {
        type: CommonEventType.PROFILE_UPDATED,
        userId: uuidv4(),
        payload: {
          data: {
            journey: JourneyType.HEALTH,
            completionPercentage: 100
          }
        },
        journey: JourneyType.HEALTH,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        version: '1.0.0'
      },
      // Care journey profile completion
      {
        type: CommonEventType.PROFILE_UPDATED,
        userId: uuidv4(),
        payload: {
          data: {
            journey: JourneyType.CARE,
            completionPercentage: 100
          }
        },
        journey: JourneyType.CARE,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        version: '1.0.0'
      },
      // Plan journey profile completion
      {
        type: CommonEventType.PROFILE_UPDATED,
        userId: uuidv4(),
        payload: {
          data: {
            journey: JourneyType.PLAN,
            completionPercentage: 100
          }
        },
        journey: JourneyType.PLAN,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        version: '1.0.0'
      }
    ],
    expectedResult: {
      unlocked: true,
      progress: 3,
      xpAwarded: crossJourneyAchievementFixtures.dataCompletionist.xpReward
    }
  },
  
  // Scenario: User progresses through multiple levels of an achievement
  multiLevelAchievementProgression: {
    userId: uuidv4(),
    achievements: [
      multiLevelAchievementFixtures.stepMaster.level1,
      multiLevelAchievementFixtures.stepMaster.level2,
      multiLevelAchievementFixtures.stepMaster.level3
    ],
    events: Array(100).fill(null).map((_, index) => ({
      type: HealthEventType.GOAL_ACHIEVED,
      userId: uuidv4(),
      payload: {
        data: {
          goalId: uuidv4(),
          goalType: 'steps',
          achievedAt: new Date(Date.now() - (99 - index) * 24 * 60 * 60 * 1000).toISOString(),
          targetValue: 10000,
          actualValue: 10500 + index * 100
        }
      },
      journey: JourneyType.HEALTH,
      timestamp: new Date(Date.now() - (99 - index) * 24 * 60 * 60 * 1000).toISOString(),
      version: '1.0.0'
    })),
    expectedResults: [
      { unlocked: true, progress: 5, xpAwarded: multiLevelAchievementFixtures.stepMaster.level1.xpReward },
      { unlocked: true, progress: 25, xpAwarded: multiLevelAchievementFixtures.stepMaster.level2.xpReward },
      { unlocked: true, progress: 100, xpAwarded: multiLevelAchievementFixtures.stepMaster.level3.xpReward }
    ]
  }
};

/**
 * Export all fixtures for use in tests
 */
export const achievementFixtures = {
  createAchievementFixture,
  createUserAchievementFixture,
  createAchievementPresentationFixture,
  createHealthAchievementFixture,
  createCareAchievementFixture,
  createPlanAchievementFixture,
  achievementLevelFixtures,
  achievementProgressFixtures,
  healthAchievementFixtures,
  careAchievementFixtures,
  planAchievementFixtures,
  crossJourneyAchievementFixtures,
  achievementEventConditionFixtures,
  multiLevelAchievementFixtures,
  achievementNotificationFixtures,
  achievementTestScenarios
};

export default achievementFixtures;