/**
 * @file Quest fixtures for testing the gamification engine
 * @description Provides standardized test fixtures for quests in the gamification system,
 * including different quest types (daily, weekly, journey-specific) and user quest progress states.
 * These fixtures are used for testing quest assignment, progress tracking, and completion.
 */

import { Quest } from '@austa/interfaces/gamification';
import { QuestStatus } from 'src/backend/gamification-engine/src/quests/entities/user-quest.entity';

/**
 * Enum representing different quest types for testing purposes.
 * Used to categorize quests by their frequency and scope.
 */
export enum QuestType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ONE_TIME = 'ONE_TIME',
  SPECIAL = 'SPECIAL',
}

/**
 * Interface extending the base Quest interface with additional properties
 * needed for testing purposes.
 */
export interface TestQuest extends Quest {
  /**
   * The type of quest (daily, weekly, monthly, one-time, special).
   */
  type: QuestType;
  
  /**
   * Optional steps required to complete the quest.
   * Each step represents a discrete action or milestone.
   */
  steps?: QuestStep[];
  
  /**
   * Optional metadata for the quest, used for testing specific scenarios.
   */
  metadata?: Record<string, any>;
}

/**
 * Interface representing a step in a multi-step quest.
 * Used for testing incremental progress tracking.
 */
export interface QuestStep {
  /**
   * Unique identifier for the step.
   */
  id: string;
  
  /**
   * Description of what the step entails.
   */
  description: string;
  
  /**
   * The progress value (0-100) that completing this step contributes to the overall quest.
   */
  progressValue: number;
  
  /**
   * Optional metadata for the step, used for testing specific scenarios.
   */
  metadata?: Record<string, any>;
}

/**
 * Interface representing a user's progress on a quest for testing purposes.
 * Extends the standard UserQuest interface with additional testing properties.
 */
export interface TestUserQuest {
  /**
   * The ID of the quest being undertaken.
   */
  questId: string;
  
  /**
   * The ID of the user profile.
   */
  profileId: string;
  
  /**
   * The current status of the quest (NOT_STARTED, IN_PROGRESS, COMPLETED).
   */
  status: QuestStatus;
  
  /**
   * The current progress value (0-100).
   */
  progress: number;
  
  /**
   * Optional completed steps for multi-step quests.
   */
  completedSteps?: string[];
  
  /**
   * Optional start date for the quest.
   */
  startedAt?: Date;
  
  /**
   * Optional completion date for the quest.
   */
  completedAt?: Date;
  
  /**
   * Whether rewards have been granted for this quest.
   */
  rewarded: boolean;
  
  /**
   * The journey associated with this user quest.
   */
  journey: string;
  
  /**
   * Optional metadata for testing specific scenarios.
   */
  metadata?: Record<string, any>;
}

// ============================================================================
// Health Journey Quest Fixtures
// ============================================================================

/**
 * Collection of health journey quest fixtures for testing.
 */
export const healthQuestFixtures: TestQuest[] = [
  {
    id: 'health-daily-steps',
    title: 'Daily Step Goal',
    description: 'Complete your daily step goal to earn XP',
    journey: 'health',
    icon: 'footprints',
    xpReward: 50,
    difficulty: 1,
    type: QuestType.DAILY,
    steps: [
      {
        id: 'steps-25-percent',
        description: 'Reach 25% of your daily step goal',
        progressValue: 25,
      },
      {
        id: 'steps-50-percent',
        description: 'Reach 50% of your daily step goal',
        progressValue: 25,
      },
      {
        id: 'steps-75-percent',
        description: 'Reach 75% of your daily step goal',
        progressValue: 25,
      },
      {
        id: 'steps-100-percent',
        description: 'Complete your daily step goal',
        progressValue: 25,
      },
    ],
    metadata: {
      requiredSteps: 10000,
      progressType: 'incremental',
    },
  },
  {
    id: 'health-weekly-activity',
    title: 'Weekly Activity Streak',
    description: 'Complete at least 30 minutes of activity for 5 days this week',
    journey: 'health',
    icon: 'activity',
    xpReward: 150,
    difficulty: 2,
    type: QuestType.WEEKLY,
    steps: [
      {
        id: 'activity-day-1',
        description: 'Complete 30 minutes of activity on day 1',
        progressValue: 20,
      },
      {
        id: 'activity-day-2',
        description: 'Complete 30 minutes of activity on day 2',
        progressValue: 20,
      },
      {
        id: 'activity-day-3',
        description: 'Complete 30 minutes of activity on day 3',
        progressValue: 20,
      },
      {
        id: 'activity-day-4',
        description: 'Complete 30 minutes of activity on day 4',
        progressValue: 20,
      },
      {
        id: 'activity-day-5',
        description: 'Complete 30 minutes of activity on day 5',
        progressValue: 20,
      },
    ],
    metadata: {
      requiredDays: 5,
      progressType: 'cumulative',
    },
  },
  {
    id: 'health-connect-device',
    title: 'Connect a Health Device',
    description: 'Connect a wearable device to track your health metrics automatically',
    journey: 'health',
    icon: 'device-watch',
    xpReward: 100,
    difficulty: 1,
    type: QuestType.ONE_TIME,
    metadata: {
      progressType: 'binary',
      validDevices: ['smartwatch', 'fitness-tracker', 'scale', 'blood-pressure-monitor'],
    },
  },
  {
    id: 'health-complete-profile',
    title: 'Complete Health Profile',
    description: 'Fill out all sections of your health profile for personalized insights',
    journey: 'health',
    icon: 'clipboard-list',
    xpReward: 75,
    difficulty: 1,
    type: QuestType.ONE_TIME,
    steps: [
      {
        id: 'profile-basic-info',
        description: 'Complete basic information section',
        progressValue: 20,
      },
      {
        id: 'profile-medical-history',
        description: 'Complete medical history section',
        progressValue: 20,
      },
      {
        id: 'profile-medications',
        description: 'Complete current medications section',
        progressValue: 20,
      },
      {
        id: 'profile-allergies',
        description: 'Complete allergies section',
        progressValue: 20,
      },
      {
        id: 'profile-lifestyle',
        description: 'Complete lifestyle section',
        progressValue: 20,
      },
    ],
    metadata: {
      progressType: 'incremental',
    },
  },
];

// ============================================================================
// Care Journey Quest Fixtures
// ============================================================================

/**
 * Collection of care journey quest fixtures for testing.
 */
export const careQuestFixtures: TestQuest[] = [
  {
    id: 'care-schedule-appointment',
    title: 'Schedule a Check-up',
    description: 'Schedule a routine check-up with your primary care physician',
    journey: 'care',
    icon: 'calendar-plus',
    xpReward: 75,
    difficulty: 1,
    type: QuestType.MONTHLY,
    metadata: {
      progressType: 'binary',
      appointmentTypes: ['check-up', 'wellness-visit', 'annual-physical'],
    },
  },
  {
    id: 'care-medication-adherence',
    title: 'Medication Adherence',
    description: 'Take all your medications as prescribed for 7 consecutive days',
    journey: 'care',
    icon: 'pill',
    xpReward: 100,
    difficulty: 2,
    type: QuestType.WEEKLY,
    steps: [
      {
        id: 'medication-day-1',
        description: 'Take all medications on day 1',
        progressValue: 14.29,
      },
      {
        id: 'medication-day-2',
        description: 'Take all medications on day 2',
        progressValue: 14.29,
      },
      {
        id: 'medication-day-3',
        description: 'Take all medications on day 3',
        progressValue: 14.29,
      },
      {
        id: 'medication-day-4',
        description: 'Take all medications on day 4',
        progressValue: 14.29,
      },
      {
        id: 'medication-day-5',
        description: 'Take all medications on day 5',
        progressValue: 14.29,
      },
      {
        id: 'medication-day-6',
        description: 'Take all medications on day 6',
        progressValue: 14.29,
      },
      {
        id: 'medication-day-7',
        description: 'Take all medications on day 7',
        progressValue: 14.26,
      },
    ],
    metadata: {
      progressType: 'cumulative',
      requiresConsecutiveDays: true,
    },
  },
  {
    id: 'care-telemedicine-session',
    title: 'Complete a Telemedicine Session',
    description: 'Consult with a healthcare provider through a virtual appointment',
    journey: 'care',
    icon: 'video',
    xpReward: 125,
    difficulty: 2,
    type: QuestType.ONE_TIME,
    steps: [
      {
        id: 'telemedicine-schedule',
        description: 'Schedule a telemedicine appointment',
        progressValue: 25,
      },
      {
        id: 'telemedicine-checkin',
        description: 'Complete pre-appointment check-in',
        progressValue: 25,
      },
      {
        id: 'telemedicine-attend',
        description: 'Attend the telemedicine session',
        progressValue: 25,
      },
      {
        id: 'telemedicine-followup',
        description: 'Complete post-appointment follow-up',
        progressValue: 25,
      },
    ],
    metadata: {
      progressType: 'sequential',
      requiresCompletion: true,
    },
  },
  {
    id: 'care-symptom-check',
    title: 'Complete a Symptom Check',
    description: 'Use the symptom checker tool to assess your health concerns',
    journey: 'care',
    icon: 'stethoscope',
    xpReward: 50,
    difficulty: 1,
    type: QuestType.DAILY,
    metadata: {
      progressType: 'binary',
      minimumQuestionsAnswered: 5,
    },
  },
];

// ============================================================================
// Plan Journey Quest Fixtures
// ============================================================================

/**
 * Collection of plan journey quest fixtures for testing.
 */
export const planQuestFixtures: TestQuest[] = [
  {
    id: 'plan-submit-claim',
    title: 'Submit a Claim',
    description: 'Submit a claim for a recent healthcare service',
    journey: 'plan',
    icon: 'receipt',
    xpReward: 75,
    difficulty: 1,
    type: QuestType.MONTHLY,
    steps: [
      {
        id: 'claim-info',
        description: 'Enter claim information',
        progressValue: 25,
      },
      {
        id: 'claim-documents',
        description: 'Upload supporting documents',
        progressValue: 25,
      },
      {
        id: 'claim-review',
        description: 'Review claim details',
        progressValue: 25,
      },
      {
        id: 'claim-submit',
        description: 'Submit the claim',
        progressValue: 25,
      },
    ],
    metadata: {
      progressType: 'sequential',
      claimTypes: ['medical', 'dental', 'vision', 'pharmacy'],
    },
  },
  {
    id: 'plan-review-benefits',
    title: 'Review Your Benefits',
    description: 'Explore and understand your insurance benefits',
    journey: 'plan',
    icon: 'shield-check',
    xpReward: 50,
    difficulty: 1,
    type: QuestType.ONE_TIME,
    steps: [
      {
        id: 'benefits-medical',
        description: 'Review medical benefits',
        progressValue: 20,
      },
      {
        id: 'benefits-dental',
        description: 'Review dental benefits',
        progressValue: 20,
      },
      {
        id: 'benefits-vision',
        description: 'Review vision benefits',
        progressValue: 20,
      },
      {
        id: 'benefits-pharmacy',
        description: 'Review pharmacy benefits',
        progressValue: 20,
      },
      {
        id: 'benefits-additional',
        description: 'Review additional benefits',
        progressValue: 20,
      },
    ],
    metadata: {
      progressType: 'incremental',
      minimumTimePerSection: 30, // seconds
    },
  },
  {
    id: 'plan-cost-estimator',
    title: 'Use the Cost Estimator',
    description: 'Estimate costs for an upcoming healthcare service',
    journey: 'plan',
    icon: 'calculator',
    xpReward: 60,
    difficulty: 1,
    type: QuestType.ONE_TIME,
    metadata: {
      progressType: 'binary',
      serviceCategories: ['office-visit', 'procedure', 'imaging', 'lab-test'],
    },
  },
  {
    id: 'plan-paperless-billing',
    title: 'Enroll in Paperless Billing',
    description: 'Sign up for paperless billing and notifications',
    journey: 'plan',
    icon: 'envelope',
    xpReward: 40,
    difficulty: 1,
    type: QuestType.ONE_TIME,
    metadata: {
      progressType: 'binary',
      requiresEmailVerification: true,
    },
  },
];

// ============================================================================
// Cross-Journey Quest Fixtures
// ============================================================================

/**
 * Collection of cross-journey quest fixtures that span multiple journeys.
 * These quests require actions across different journeys to complete.
 */
export const crossJourneyQuestFixtures: TestQuest[] = [
  {
    id: 'cross-wellness-champion',
    title: 'Wellness Champion',
    description: 'Complete key actions across all journeys to become a wellness champion',
    journey: 'health', // Primary journey, but involves all journeys
    icon: 'award',
    xpReward: 300,
    difficulty: 3,
    type: QuestType.SPECIAL,
    steps: [
      {
        id: 'wellness-health-metrics',
        description: 'Record health metrics for 3 consecutive days',
        progressValue: 20,
        metadata: {
          journey: 'health',
          requiredDays: 3,
        },
      },
      {
        id: 'wellness-appointment',
        description: 'Schedule a preventive care appointment',
        progressValue: 20,
        metadata: {
          journey: 'care',
          appointmentType: 'preventive',
        },
      },
      {
        id: 'wellness-benefits',
        description: 'Review your wellness program benefits',
        progressValue: 20,
        metadata: {
          journey: 'plan',
          benefitType: 'wellness',
        },
      },
      {
        id: 'wellness-activity',
        description: 'Complete a physical activity session',
        progressValue: 20,
        metadata: {
          journey: 'health',
          activityDuration: 30, // minutes
        },
      },
      {
        id: 'wellness-assessment',
        description: 'Complete a health risk assessment',
        progressValue: 20,
        metadata: {
          journey: 'care',
          assessmentType: 'health-risk',
        },
      },
    ],
    metadata: {
      progressType: 'cross-journey',
      journeys: ['health', 'care', 'plan'],
      expirationDays: 30,
    },
  },
  {
    id: 'cross-preventive-care',
    title: 'Preventive Care Master',
    description: 'Complete preventive care activities across health and care journeys',
    journey: 'care', // Primary journey, but involves health journey too
    icon: 'shield-plus',
    xpReward: 200,
    difficulty: 2,
    type: QuestType.SPECIAL,
    steps: [
      {
        id: 'preventive-health-profile',
        description: 'Update your health profile with current information',
        progressValue: 25,
        metadata: {
          journey: 'health',
        },
      },
      {
        id: 'preventive-screening',
        description: 'Schedule a recommended screening',
        progressValue: 25,
        metadata: {
          journey: 'care',
          screeningTypes: ['mammogram', 'colonoscopy', 'blood-pressure', 'cholesterol'],
        },
      },
      {
        id: 'preventive-benefits',
        description: 'Review your preventive care coverage',
        progressValue: 25,
        metadata: {
          journey: 'plan',
          benefitType: 'preventive',
        },
      },
      {
        id: 'preventive-immunization',
        description: 'Update your immunization records',
        progressValue: 25,
        metadata: {
          journey: 'health',
          recordType: 'immunization',
        },
      },
    ],
    metadata: {
      progressType: 'cross-journey',
      journeys: ['health', 'care', 'plan'],
      expirationDays: 60,
    },
  },
];

// ============================================================================
// User Quest Progress Fixtures
// ============================================================================

/**
 * Collection of user quest progress fixtures for testing different states.
 */
export const userQuestFixtures: TestUserQuest[] = [
  // Not started quest
  {
    questId: 'health-daily-steps',
    profileId: 'test-profile-1',
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    rewarded: false,
    journey: 'health',
  },
  
  // In progress quest with partial completion
  {
    questId: 'health-weekly-activity',
    profileId: 'test-profile-1',
    status: QuestStatus.IN_PROGRESS,
    progress: 60,
    completedSteps: ['activity-day-1', 'activity-day-2', 'activity-day-3'],
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    rewarded: false,
    journey: 'health',
    metadata: {
      lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  },
  
  // Completed quest with rewards granted
  {
    questId: 'care-symptom-check',
    profileId: 'test-profile-1',
    status: QuestStatus.COMPLETED,
    progress: 100,
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    rewarded: true,
    journey: 'care',
  },
  
  // Completed quest but rewards not yet granted
  {
    questId: 'plan-paperless-billing',
    profileId: 'test-profile-1',
    status: QuestStatus.COMPLETED,
    progress: 100,
    startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    completedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    rewarded: false,
    journey: 'plan',
  },
  
  // Cross-journey quest in progress
  {
    questId: 'cross-wellness-champion',
    profileId: 'test-profile-1',
    status: QuestStatus.IN_PROGRESS,
    progress: 40,
    completedSteps: ['wellness-health-metrics', 'wellness-activity'],
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    rewarded: false,
    journey: 'health',
    metadata: {
      journeyProgress: {
        health: 40,
        care: 0,
        plan: 0,
      },
    },
  },
  
  // Different user's quest progress
  {
    questId: 'health-daily-steps',
    profileId: 'test-profile-2',
    status: QuestStatus.IN_PROGRESS,
    progress: 75,
    completedSteps: ['steps-25-percent', 'steps-50-percent', 'steps-75-percent'],
    startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    rewarded: false,
    journey: 'health',
    metadata: {
      currentSteps: 7500,
      goalSteps: 10000,
    },
  },
];

// ============================================================================
// Combined Quest Fixtures
// ============================================================================

/**
 * All quest fixtures combined for easy access.
 */
export const allQuestFixtures: TestQuest[] = [
  ...healthQuestFixtures,
  ...careQuestFixtures,
  ...planQuestFixtures,
  ...crossJourneyQuestFixtures,
];

/**
 * Helper function to get a quest fixture by ID.
 * 
 * @param questId The ID of the quest to retrieve
 * @returns The quest fixture with the specified ID, or undefined if not found
 */
export function getQuestFixtureById(questId: string): TestQuest | undefined {
  return allQuestFixtures.find(quest => quest.id === questId);
}

/**
 * Helper function to get user quest fixtures by profile ID.
 * 
 * @param profileId The ID of the profile to retrieve quests for
 * @returns An array of user quest fixtures for the specified profile
 */
export function getUserQuestFixturesByProfileId(profileId: string): TestUserQuest[] {
  return userQuestFixtures.filter(userQuest => userQuest.profileId === profileId);
}

/**
 * Helper function to get quest fixtures by journey.
 * 
 * @param journey The journey to retrieve quests for
 * @returns An array of quest fixtures for the specified journey
 */
export function getQuestFixturesByJourney(journey: string): TestQuest[] {
  return allQuestFixtures.filter(quest => quest.journey === journey);
}

/**
 * Helper function to get quest fixtures by type.
 * 
 * @param type The type of quests to retrieve
 * @returns An array of quest fixtures of the specified type
 */
export function getQuestFixturesByType(type: QuestType): TestQuest[] {
  return allQuestFixtures.filter(quest => quest.type === type);
}

/**
 * Helper function to create a user quest fixture with default values.
 * 
 * @param questId The ID of the quest
 * @param profileId The ID of the user profile
 * @returns A new user quest fixture with default values
 */
export function createUserQuestFixture(questId: string, profileId: string): TestUserQuest {
  const quest = getQuestFixtureById(questId);
  
  if (!quest) {
    throw new Error(`Quest with ID ${questId} not found`);
  }
  
  return {
    questId,
    profileId,
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    rewarded: false,
    journey: quest.journey,
  };
}