/**
 * @file Achievement fixtures for testing the gamification engine
 * @description Provides standardized test fixtures for achievement entities and achievement types
 * in the gamification engine. Contains mock data for different achievement levels, journey-specific
 * achievements, and achievement progress states.
 */

import { JourneyType, Achievement, UserAchievement } from '@austa/interfaces/gamification/achievements';
import { AchievementType, AchievementTypeValue } from '@austa/interfaces/gamification/achievement-types';
import { AchievementStatus } from '@austa/interfaces/gamification/achievement-status';

/**
 * Standard achievement types for testing
 */
export const achievementTypeFixtures = {
  /**
   * Health journey achievement types
   */
  health: {
    /**
     * Achievement for tracking health metrics consistently
     */
    healthMetricsStreak: {
      name: 'health-metrics-streak',
      title: 'Health Tracker',
      description: 'Track your health metrics for consecutive days',
      journey: JourneyType.HEALTH,
      icon: 'heart-pulse',
      levels: 3,
      type: AchievementType.PROGRESSIVE,
      metricCategory: 'consistency',
      levelRequirements: [3, 7, 14], // Days
      levelRewards: [10, 25, 50], // XP
    },

    /**
     * Achievement for reaching step goals
     */
    stepsGoal: {
      name: 'steps-goal',
      title: 'Step Master',
      description: 'Reach your daily step goal',
      journey: JourneyType.HEALTH,
      icon: 'footprints',
      levels: 3,
      type: AchievementType.PROGRESSIVE,
      metricCategory: 'steps',
      levelRequirements: [5, 15, 30], // Days
      levelRewards: [15, 30, 75], // XP
    },

    /**
     * Achievement for tracking sleep consistently
     */
    sleepTracking: {
      name: 'sleep-tracking',
      title: 'Sleep Watcher',
      description: 'Track your sleep patterns consistently',
      journey: JourneyType.HEALTH,
      icon: 'moon',
      levels: 3,
      type: AchievementType.PROGRESSIVE,
      metricCategory: 'sleep',
      levelRequirements: [3, 7, 14], // Days
      levelRewards: [10, 25, 50], // XP
    },

    /**
     * Achievement for connecting a health device
     */
    deviceConnection: {
      name: 'device-connection',
      title: 'Connected Health',
      description: 'Connect a health tracking device to your account',
      journey: JourneyType.HEALTH,
      icon: 'smartwatch',
      levels: 1,
      type: AchievementType.JOURNEY,
      metricCategory: 'devices',
      levelRequirements: [1], // Devices
      levelRewards: [25], // XP
    },
  },

  /**
   * Care journey achievement types
   */
  care: {
    /**
     * Achievement for attending scheduled appointments
     */
    appointmentAttendance: {
      name: 'appointment-attendance',
      title: 'Appointment Keeper',
      description: 'Attend your scheduled medical appointments',
      journey: JourneyType.CARE,
      icon: 'calendar-check',
      levels: 3,
      type: AchievementType.PROGRESSIVE,
      activityCategory: 'appointments',
      levelRequirements: [1, 3, 5], // Appointments
      levelRewards: [20, 40, 75], // XP
    },

    /**
     * Achievement for medication adherence
     */
    medicationAdherence: {
      name: 'medication-adherence',
      title: 'Medication Manager',
      description: 'Take your medications as prescribed',
      journey: JourneyType.CARE,
      icon: 'pill',
      levels: 3,
      type: AchievementType.PROGRESSIVE,
      activityCategory: 'medications',
      levelRequirements: [7, 14, 30], // Days
      levelRewards: [15, 35, 70], // XP
    },

    /**
     * Achievement for completing telemedicine sessions
     */
    telemedicineSession: {
      name: 'telemedicine-session',
      title: 'Digital Doctor',
      description: 'Complete telemedicine consultations',
      journey: JourneyType.CARE,
      icon: 'video',
      levels: 3,
      type: AchievementType.PROGRESSIVE,
      activityCategory: 'telemedicine',
      levelRequirements: [1, 3, 5], // Sessions
      levelRewards: [25, 50, 100], // XP
    },
  },

  /**
   * Plan journey achievement types
   */
  plan: {
    /**
     * Achievement for submitting claims
     */
    claimSubmission: {
      name: 'claim-submission',
      title: 'Claim Expert',
      description: 'Submit insurance claims successfully',
      journey: JourneyType.PLAN,
      icon: 'receipt',
      levels: 3,
      type: AchievementType.PROGRESSIVE,
      activityCategory: 'claims',
      levelRequirements: [1, 3, 5], // Claims
      levelRewards: [20, 40, 80], // XP
    },

    /**
     * Achievement for reviewing benefits
     */
    benefitsReview: {
      name: 'benefits-review',
      title: 'Benefits Explorer',
      description: 'Review your available benefits',
      journey: JourneyType.PLAN,
      icon: 'shield-check',
      levels: 1,
      type: AchievementType.JOURNEY,
      activityCategory: 'benefits',
      levelRequirements: [1], // Reviews
      levelRewards: [15], // XP
    },

    /**
     * Achievement for uploading documents
     */
    documentUpload: {
      name: 'document-upload',
      title: 'Document Manager',
      description: 'Upload insurance-related documents',
      journey: JourneyType.PLAN,
      icon: 'file-upload',
      levels: 3,
      type: AchievementType.PROGRESSIVE,
      activityCategory: 'documents',
      levelRequirements: [1, 3, 5], // Documents
      levelRewards: [10, 25, 50], // XP
    },
  },

  /**
   * Cross-journey achievement types
   */
  crossJourney: {
    /**
     * Achievement for completing actions across all journeys
     */
    journeyExplorer: {
      name: 'journey-explorer',
      title: 'Journey Explorer',
      description: 'Complete actions in all three journeys',
      journey: JourneyType.GLOBAL,
      icon: 'compass',
      levels: 1,
      type: AchievementType.CROSS_JOURNEY,
      levelRequirements: [3], // Actions (one in each journey)
      levelRewards: [50], // XP
    },

    /**
     * Achievement for health and care integration
     */
    healthCareSynergy: {
      name: 'health-care-synergy',
      title: 'Health & Care Synergy',
      description: 'Track a health metric and discuss it in a telemedicine appointment',
      journey: JourneyType.GLOBAL,
      icon: 'link',
      levels: 1,
      type: AchievementType.CROSS_JOURNEY,
      levelRequirements: [1], // Completed synergy
      levelRewards: [40], // XP
    },

    /**
     * Achievement for care and plan integration
     */
    carePlanIntegration: {
      name: 'care-plan-integration',
      title: 'Care & Plan Integration',
      description: 'Attend an appointment and submit the related claim',
      journey: JourneyType.GLOBAL,
      icon: 'handshake',
      levels: 1,
      type: AchievementType.CROSS_JOURNEY,
      levelRequirements: [1], // Completed integration
      levelRewards: [40], // XP
    },

    /**
     * Achievement for completing the full health cycle
     */
    completeHealthCycle: {
      name: 'complete-health-cycle',
      title: 'Complete Health Cycle',
      description: 'Track health metrics, discuss with a doctor, and get coverage',
      journey: JourneyType.GLOBAL,
      icon: 'circle-check',
      levels: 1,
      type: AchievementType.CROSS_JOURNEY,
      levelRequirements: [1], // Completed cycle
      levelRewards: [100], // XP
    },
  },

  /**
   * Special event achievement types
   */
  special: {
    /**
     * Achievement for participating in a health challenge
     */
    healthChallenge: {
      name: 'health-challenge-2023',
      title: 'Health Challenge 2023',
      description: 'Participate in the annual health challenge',
      journey: JourneyType.HEALTH,
      icon: 'trophy',
      levels: 1,
      type: AchievementType.SPECIAL,
      levelRequirements: [1], // Participation
      levelRewards: [50], // XP
    },
  },
};

/**
 * Generates achievement fixtures for a specific journey and level
 * 
 * @param type The achievement type fixture to use as a template
 * @param level The level of the achievement (1-based index)
 * @returns An achievement fixture
 */
export function generateAchievementFixture(
  type: typeof achievementTypeFixtures.health.healthMetricsStreak | 
        typeof achievementTypeFixtures.care.appointmentAttendance | 
        typeof achievementTypeFixtures.plan.claimSubmission | 
        typeof achievementTypeFixtures.crossJourney.journeyExplorer | 
        typeof achievementTypeFixtures.special.healthChallenge,
  level: number = 1
): Achievement {
  // Ensure level is valid
  if (level < 1 || level > type.levels) {
    throw new Error(`Invalid level ${level} for achievement type ${type.name}. Valid levels are 1-${type.levels}`);
  }

  // Generate a unique ID based on the type and level
  const id = `${type.name}-level-${level}`;
  
  // Adjust title for multi-level achievements
  const title = type.levels > 1 ? `${type.title} ${level}` : type.title;
  
  // Get the XP reward for this level
  const xpReward = type.levelRewards[level - 1];

  // Create the achievement fixture
  return {
    id,
    title,
    description: type.description,
    journey: type.journey,
    icon: type.icon,
    xpReward,
  };
}

/**
 * Generates a set of achievement fixtures for all levels of an achievement type
 * 
 * @param type The achievement type fixture to use as a template
 * @returns An array of achievement fixtures, one for each level
 */
export function generateAllLevelAchievements(
  type: typeof achievementTypeFixtures.health.healthMetricsStreak | 
        typeof achievementTypeFixtures.care.appointmentAttendance | 
        typeof achievementTypeFixtures.plan.claimSubmission | 
        typeof achievementTypeFixtures.crossJourney.journeyExplorer | 
        typeof achievementTypeFixtures.special.healthChallenge
): Achievement[] {
  return Array.from({ length: type.levels }, (_, i) => 
    generateAchievementFixture(type, i + 1)
  );
}

/**
 * Generates user achievement fixtures in different states
 * 
 * @param achievement The achievement to create user achievement fixtures for
 * @param profileId The user profile ID
 * @param status The status of the user achievement
 * @param progressPercentage The percentage of progress (0-100)
 * @returns A user achievement fixture
 */
export function generateUserAchievementFixture(
  achievement: Achievement,
  profileId: string,
  status: AchievementStatus = AchievementStatus.LOCKED,
  progressPercentage: number = 0
): UserAchievement {
  // Find the achievement type and level
  const achievementNameParts = achievement.id.split('-level-');
  const achievementName = achievementNameParts[0];
  const level = achievementNameParts.length > 1 ? parseInt(achievementNameParts[1], 10) : 1;
  
  // Find the achievement type in the fixtures
  let achievementType: any = null;
  let requirementValue = 1;
  
  // Search through all journey types
  for (const journeyKey of ['health', 'care', 'plan', 'crossJourney', 'special'] as const) {
    const journeyTypes = achievementTypeFixtures[journeyKey];
    for (const typeKey in journeyTypes) {
      if (journeyTypes[typeKey].name === achievementName) {
        achievementType = journeyTypes[typeKey];
        requirementValue = achievementType.levelRequirements[level - 1];
        break;
      }
    }
    if (achievementType) break;
  }
  
  if (!achievementType) {
    throw new Error(`Achievement type not found for ${achievement.id}`);
  }
  
  // Calculate progress based on status and percentage
  let progress = 0;
  let unlocked = false;
  let unlockedAt: Date | null = null;
  
  switch (status) {
    case AchievementStatus.LOCKED:
      progress = 0;
      unlocked = false;
      break;
    case AchievementStatus.VISIBLE:
      progress = 0;
      unlocked = false;
      break;
    case AchievementStatus.IN_PROGRESS:
      // Calculate progress based on percentage and requirement
      progress = Math.floor((progressPercentage / 100) * requirementValue);
      // Ensure progress is at least 1 for IN_PROGRESS
      progress = Math.max(1, progress);
      // Ensure progress is less than the requirement
      progress = Math.min(progress, requirementValue - 1);
      unlocked = false;
      break;
    case AchievementStatus.COMPLETED:
      progress = requirementValue;
      unlocked = false;
      break;
    case AchievementStatus.UNLOCKED:
      progress = requirementValue;
      unlocked = true;
      unlockedAt = new Date();
      break;
    case AchievementStatus.LEGACY:
      progress = requirementValue;
      unlocked = true;
      unlockedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      break;
  }
  
  return {
    profileId,
    achievementId: achievement.id,
    achievement,
    progress,
    total: requirementValue,
    unlocked,
    unlockedAt,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    updatedAt: new Date(),
  };
}

/**
 * Standard achievement fixtures for testing
 */
export const achievementFixtures = {
  /**
   * Health journey achievements
   */
  health: {
    healthMetricsStreak: generateAllLevelAchievements(achievementTypeFixtures.health.healthMetricsStreak),
    stepsGoal: generateAllLevelAchievements(achievementTypeFixtures.health.stepsGoal),
    sleepTracking: generateAllLevelAchievements(achievementTypeFixtures.health.sleepTracking),
    deviceConnection: generateAllLevelAchievements(achievementTypeFixtures.health.deviceConnection),
  },
  
  /**
   * Care journey achievements
   */
  care: {
    appointmentAttendance: generateAllLevelAchievements(achievementTypeFixtures.care.appointmentAttendance),
    medicationAdherence: generateAllLevelAchievements(achievementTypeFixtures.care.medicationAdherence),
    telemedicineSession: generateAllLevelAchievements(achievementTypeFixtures.care.telemedicineSession),
  },
  
  /**
   * Plan journey achievements
   */
  plan: {
    claimSubmission: generateAllLevelAchievements(achievementTypeFixtures.plan.claimSubmission),
    benefitsReview: generateAllLevelAchievements(achievementTypeFixtures.plan.benefitsReview),
    documentUpload: generateAllLevelAchievements(achievementTypeFixtures.plan.documentUpload),
  },
  
  /**
   * Cross-journey achievements
   */
  crossJourney: {
    journeyExplorer: generateAllLevelAchievements(achievementTypeFixtures.crossJourney.journeyExplorer),
    healthCareSynergy: generateAllLevelAchievements(achievementTypeFixtures.crossJourney.healthCareSynergy),
    carePlanIntegration: generateAllLevelAchievements(achievementTypeFixtures.crossJourney.carePlanIntegration),
    completeHealthCycle: generateAllLevelAchievements(achievementTypeFixtures.crossJourney.completeHealthCycle),
  },
  
  /**
   * Special event achievements
   */
  special: {
    healthChallenge: generateAllLevelAchievements(achievementTypeFixtures.special.healthChallenge),
  },
};

/**
 * Generates a complete set of user achievements for a profile
 * with a mix of different statuses
 * 
 * @param profileId The user profile ID
 * @returns An array of user achievement fixtures
 */
export function generateUserAchievementSet(profileId: string): UserAchievement[] {
  const userAchievements: UserAchievement[] = [];
  
  // Helper to add achievements with a specific status
  const addAchievementsWithStatus = (
    achievements: Achievement[], 
    status: AchievementStatus, 
    progressPercentage: number = 0
  ) => {
    achievements.forEach(achievement => {
      userAchievements.push(
        generateUserAchievementFixture(achievement, profileId, status, progressPercentage)
      );
    });
  };
  
  // Add some locked achievements
  addAchievementsWithStatus(
    [
      ...achievementFixtures.health.healthMetricsStreak.slice(1), // Level 2-3
      ...achievementFixtures.care.appointmentAttendance.slice(1), // Level 2-3
      ...achievementFixtures.plan.claimSubmission.slice(1), // Level 2-3
    ],
    AchievementStatus.LOCKED
  );
  
  // Add some visible achievements
  addAchievementsWithStatus(
    [
      achievementFixtures.health.deviceConnection[0], // Level 1
      achievementFixtures.plan.benefitsReview[0], // Level 1
      achievementFixtures.crossJourney.journeyExplorer[0], // Level 1
    ],
    AchievementStatus.VISIBLE
  );
  
  // Add some in-progress achievements with different progress percentages
  addAchievementsWithStatus(
    [achievementFixtures.health.healthMetricsStreak[0]], // Level 1
    AchievementStatus.IN_PROGRESS,
    33
  );
  
  addAchievementsWithStatus(
    [achievementFixtures.care.appointmentAttendance[0]], // Level 1
    AchievementStatus.IN_PROGRESS,
    66
  );
  
  addAchievementsWithStatus(
    [achievementFixtures.plan.claimSubmission[0]], // Level 1
    AchievementStatus.IN_PROGRESS,
    90
  );
  
  // Add some completed achievements
  addAchievementsWithStatus(
    [
      achievementFixtures.health.sleepTracking[0], // Level 1
      achievementFixtures.care.medicationAdherence[0], // Level 1
    ],
    AchievementStatus.COMPLETED
  );
  
  // Add some unlocked achievements
  addAchievementsWithStatus(
    [
      achievementFixtures.health.stepsGoal[0], // Level 1
      achievementFixtures.care.telemedicineSession[0], // Level 1
      achievementFixtures.plan.documentUpload[0], // Level 1
      achievementFixtures.crossJourney.healthCareSynergy[0], // Level 1
    ],
    AchievementStatus.UNLOCKED
  );
  
  // Add some legacy achievements
  addAchievementsWithStatus(
    [achievementFixtures.special.healthChallenge[0]], // Level 1
    AchievementStatus.LEGACY
  );
  
  return userAchievements;
}

/**
 * Generates a set of user achievements for cross-journey scenarios
 * 
 * @param profileId The user profile ID
 * @returns An array of user achievement fixtures specifically for cross-journey testing
 */
export function generateCrossJourneyAchievementSet(profileId: string): UserAchievement[] {
  const userAchievements: UserAchievement[] = [];
  
  // Add all cross-journey achievements in different states
  userAchievements.push(
    // Journey Explorer - In Progress (2/3 journeys completed)
    generateUserAchievementFixture(
      achievementFixtures.crossJourney.journeyExplorer[0],
      profileId,
      AchievementStatus.IN_PROGRESS,
      66
    ),
    
    // Health & Care Synergy - Completed but not claimed
    generateUserAchievementFixture(
      achievementFixtures.crossJourney.healthCareSynergy[0],
      profileId,
      AchievementStatus.COMPLETED
    ),
    
    // Care & Plan Integration - Unlocked
    generateUserAchievementFixture(
      achievementFixtures.crossJourney.carePlanIntegration[0],
      profileId,
      AchievementStatus.UNLOCKED
    ),
    
    // Complete Health Cycle - Visible but not started
    generateUserAchievementFixture(
      achievementFixtures.crossJourney.completeHealthCycle[0],
      profileId,
      AchievementStatus.VISIBLE
    )
  );
  
  // Add some journey-specific achievements to test cross-journey interactions
  userAchievements.push(
    // Health journey - one unlocked achievement
    generateUserAchievementFixture(
      achievementFixtures.health.healthMetricsStreak[0],
      profileId,
      AchievementStatus.UNLOCKED
    ),
    
    // Care journey - one unlocked achievement
    generateUserAchievementFixture(
      achievementFixtures.care.appointmentAttendance[0],
      profileId,
      AchievementStatus.UNLOCKED
    ),
    
    // Plan journey - one in-progress achievement
    generateUserAchievementFixture(
      achievementFixtures.plan.claimSubmission[0],
      profileId,
      AchievementStatus.IN_PROGRESS,
      50
    )
  );
  
  return userAchievements;
}

/**
 * Generates a set of progressive achievement fixtures for a user
 * showing the progression through multiple levels
 * 
 * @param profileId The user profile ID
 * @param achievementType The achievement type to generate progression for
 * @returns An array of user achievement fixtures showing progression
 */
export function generateProgressiveAchievementSet(
  profileId: string,
  achievementType: typeof achievementTypeFixtures.health.healthMetricsStreak | 
                  typeof achievementTypeFixtures.care.appointmentAttendance | 
                  typeof achievementTypeFixtures.plan.claimSubmission
): UserAchievement[] {
  const achievements = generateAllLevelAchievements(achievementType);
  const userAchievements: UserAchievement[] = [];
  
  // Level 1 - Unlocked
  userAchievements.push(
    generateUserAchievementFixture(
      achievements[0],
      profileId,
      AchievementStatus.UNLOCKED
    )
  );
  
  // Level 2 - In Progress (if there is a level 2)
  if (achievements.length > 1) {
    userAchievements.push(
      generateUserAchievementFixture(
        achievements[1],
        profileId,
        AchievementStatus.IN_PROGRESS,
        50
      )
    );
  }
  
  // Level 3 - Locked (if there is a level 3)
  if (achievements.length > 2) {
    userAchievements.push(
      generateUserAchievementFixture(
        achievements[2],
        profileId,
        AchievementStatus.LOCKED
      )
    );
  }
  
  return userAchievements;
}