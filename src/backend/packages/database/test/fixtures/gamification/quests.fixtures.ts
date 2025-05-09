/**
 * @file Test fixtures for quests in the gamification system.
 * Provides mock data for different quest types, including daily, weekly, and journey-specific quests.
 * This file is critical for testing quest assignment, progress tracking, and completion in the gamification engine.
 * 
 * The fixtures support:
 * - Multi-journey quest tracking system
 * - Quest completion event processing
 * - Notification delivery for achievements
 * - Quest visualization components
 * 
 * Key features:
 * - Standardized quest fixtures with proper validation schemas
 * - Quest steps and progress tracking test scenarios
 * - Cross-journey quest test cases for comprehensive testing
 * - Compatibility with event-driven quest progression
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Quest, 
  UserQuest, 
  JourneyType, 
  HealthQuest, 
  CareQuest, 
  PlanQuest, 
  CrossJourneyQuest,
  QuestStatus 
} from '@austa/interfaces/gamification';

/**
 * Base quest fixture with common properties.
 * All other quest fixtures extend this base.
 */
export const baseQuestFixture: Partial<Quest> = {
  id: uuidv4(),
  title: 'Test Quest',
  description: 'This is a test quest for unit testing',
  icon: 'star',
  xpReward: 100,
  isActive: true,
};

/**
 * Creates a quest fixture with custom properties.
 * @param overrides - Properties to override in the base quest fixture
 * @returns A complete quest fixture
 */
export const createQuestFixture = (overrides: Partial<Quest> = {}): Quest => {
  return {
    ...baseQuestFixture,
    id: overrides.id || uuidv4(),
    title: overrides.title || baseQuestFixture.title,
    description: overrides.description || baseQuestFixture.description,
    journey: overrides.journey || 'health',
    icon: overrides.icon || baseQuestFixture.icon,
    xpReward: overrides.xpReward !== undefined ? overrides.xpReward : baseQuestFixture.xpReward,
    deadline: overrides.deadline || null,
    isActive: overrides.isActive !== undefined ? overrides.isActive : baseQuestFixture.isActive,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  } as Quest;
};

/**
 * Base user quest fixture with common properties.
 * All other user quest fixtures extend this base.
 */
export const baseUserQuestFixture: Partial<UserQuest> = {
  id: uuidv4(),
  userId: uuidv4(),
  questId: uuidv4(),
  status: QuestStatus.NOT_STARTED,
  progress: 0,
  startedAt: null,
  completedAt: null,
  progressMetadata: null,
};

/**
 * Creates a user quest fixture with custom properties.
 * @param overrides - Properties to override in the base user quest fixture
 * @returns A complete user quest fixture
 */
export const createUserQuestFixture = (overrides: Partial<UserQuest> = {}): UserQuest => {
  return {
    ...baseUserQuestFixture,
    id: overrides.id || uuidv4(),
    userId: overrides.userId || baseUserQuestFixture.userId,
    questId: overrides.questId || baseUserQuestFixture.questId,
    quest: overrides.quest || createQuestFixture(),
    status: overrides.status !== undefined ? overrides.status : baseUserQuestFixture.status,
    progress: overrides.progress !== undefined ? overrides.progress : baseUserQuestFixture.progress,
    startedAt: overrides.startedAt !== undefined ? overrides.startedAt : baseUserQuestFixture.startedAt,
    completedAt: overrides.completedAt !== undefined ? overrides.completedAt : baseUserQuestFixture.completedAt,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    progressMetadata: overrides.progressMetadata !== undefined ? overrides.progressMetadata : baseUserQuestFixture.progressMetadata,
  } as UserQuest;
};

// ===== HEALTH JOURNEY QUESTS =====

/**
 * Health journey quest fixtures for testing health-specific quests.
 * These quests focus on health metrics, goals, and activities within the health journey.
 * They are used to test the integration between the health service and gamification engine.
 */
export const healthQuestFixtures: HealthQuest[] = [
  // Daily step count quest
  createQuestFixture({
    id: 'health-quest-1',
    title: 'Daily Step Goal',
    description: 'Walk 10,000 steps today to earn XP',
    journey: 'health',
    icon: 'footprints',
    xpReward: 50,
    deadline: new Date(new Date().setHours(23, 59, 59, 999)), // Today at midnight
  }) as HealthQuest,
  
  // Weekly exercise quest
  createQuestFixture({
    id: 'health-quest-2',
    title: 'Weekly Exercise Challenge',
    description: 'Complete 3 workouts this week to earn XP',
    journey: 'health',
    icon: 'dumbbell',
    xpReward: 150,
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
  }) as HealthQuest,
  
  // Blood pressure tracking quest
  createQuestFixture({
    id: 'health-quest-3',
    title: 'Blood Pressure Tracking',
    description: 'Record your blood pressure for 5 consecutive days',
    journey: 'health',
    icon: 'heart-pulse',
    xpReward: 200,
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)), // 10 days from now
  }) as HealthQuest,
  
  // Sleep tracking quest
  createQuestFixture({
    id: 'health-quest-4',
    title: 'Sleep Improvement',
    description: 'Get at least 7 hours of sleep for 3 consecutive nights',
    journey: 'health',
    icon: 'moon',
    xpReward: 100,
    deadline: new Date(new Date().setDate(new Date().getDate() + 5)), // 5 days from now
  }) as HealthQuest,
  
  // Weight tracking quest
  createQuestFixture({
    id: 'health-quest-5',
    title: 'Weight Tracking',
    description: 'Record your weight once a week for a month',
    journey: 'health',
    icon: 'weight-scale',
    xpReward: 300,
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
  }) as HealthQuest,
];

// ===== CARE JOURNEY QUESTS =====

/**
 * Care journey quest fixtures for testing care-specific quests.
 * These quests focus on appointments, medications, and provider interactions within the care journey.
 * They are used to test the integration between the care service and gamification engine.
 */
export const careQuestFixtures: CareQuest[] = [
  // Appointment scheduling quest
  createQuestFixture({
    id: 'care-quest-1',
    title: 'Schedule Annual Checkup',
    description: 'Schedule your annual physical examination',
    journey: 'care',
    icon: 'calendar-plus',
    xpReward: 100,
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
  }) as CareQuest,
  
  // Medication adherence quest
  createQuestFixture({
    id: 'care-quest-2',
    title: 'Medication Adherence',
    description: 'Take all your medications as prescribed for 7 consecutive days',
    journey: 'care',
    icon: 'pill',
    xpReward: 150,
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
  }) as CareQuest,
  
  // Telemedicine consultation quest
  createQuestFixture({
    id: 'care-quest-3',
    title: 'Virtual Consultation',
    description: 'Complete a telemedicine consultation with your doctor',
    journey: 'care',
    icon: 'video',
    xpReward: 200,
    deadline: new Date(new Date().setDate(new Date().getDate() + 21)), // 21 days from now
  }) as CareQuest,
  
  // Health education quest
  createQuestFixture({
    id: 'care-quest-4',
    title: 'Health Education',
    description: 'Complete 3 health education modules',
    journey: 'care',
    icon: 'book-open',
    xpReward: 120,
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)), // 10 days from now
  }) as CareQuest,
  
  // Provider review quest
  createQuestFixture({
    id: 'care-quest-5',
    title: 'Provider Feedback',
    description: 'Leave a review for your healthcare provider after your appointment',
    journey: 'care',
    icon: 'star',
    xpReward: 50,
    deadline: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days from now
  }) as CareQuest,
];

// ===== PLAN JOURNEY QUESTS =====

/**
 * Plan journey quest fixtures for testing plan-specific quests.
 * These quests focus on insurance claims, benefits, and plan management within the plan journey.
 * They are used to test the integration between the plan service and gamification engine.
 */
export const planQuestFixtures: PlanQuest[] = [
  // Claim submission quest
  createQuestFixture({
    id: 'plan-quest-1',
    title: 'Submit a Claim',
    description: 'Submit a healthcare claim with all required documentation',
    journey: 'plan',
    icon: 'file-invoice',
    xpReward: 150,
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
  }) as PlanQuest,
  
  // Benefits exploration quest
  createQuestFixture({
    id: 'plan-quest-2',
    title: 'Explore Your Benefits',
    description: 'Review all available benefits in your health plan',
    journey: 'plan',
    icon: 'gift',
    xpReward: 100,
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
  }) as PlanQuest,
  
  // Digital insurance card quest
  createQuestFixture({
    id: 'plan-quest-3',
    title: 'Digital Insurance Card',
    description: 'Download your digital insurance card to your device',
    journey: 'plan',
    icon: 'id-card',
    xpReward: 50,
    deadline: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days from now
  }) as PlanQuest,
  
  // Cost simulator quest
  createQuestFixture({
    id: 'plan-quest-4',
    title: 'Cost Estimation',
    description: 'Use the cost simulator to estimate expenses for an upcoming procedure',
    journey: 'plan',
    icon: 'calculator',
    xpReward: 120,
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
  }) as PlanQuest,
  
  // Document upload quest
  createQuestFixture({
    id: 'plan-quest-5',
    title: 'Document Management',
    description: 'Upload and organize your healthcare documents',
    journey: 'plan',
    icon: 'folder-plus',
    xpReward: 80,
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)), // 10 days from now
  }) as PlanQuest,
];

// ===== CROSS-JOURNEY QUESTS =====

/**
 * Cross-journey quest fixtures for testing quests that span multiple journeys.
 * These quests require actions across different journeys (health, care, plan) to complete.
 * They are critical for testing the multi-journey quest tracking system and cross-journey event processing.
 */
export const crossJourneyQuestFixtures: CrossJourneyQuest[] = [
  // Health and Care cross-journey quest
  createQuestFixture({
    id: 'cross-quest-1',
    title: 'Holistic Health Management',
    description: 'Track your daily steps and take your medications for 5 consecutive days',
    journey: 'cross-journey',
    icon: 'clipboard-check',
    xpReward: 250,
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
  }) as CrossJourneyQuest,
  
  // Health and Plan cross-journey quest
  createQuestFixture({
    id: 'cross-quest-2',
    title: 'Preventive Care',
    description: 'Schedule a preventive care appointment and verify it\'s covered by your plan',
    journey: 'cross-journey',
    icon: 'shield-check',
    xpReward: 300,
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
  }) as CrossJourneyQuest,
  
  // Care and Plan cross-journey quest
  createQuestFixture({
    id: 'cross-quest-3',
    title: 'Care Coordination',
    description: 'Submit a claim for a recent appointment and leave a provider review',
    journey: 'cross-journey',
    icon: 'handshake',
    xpReward: 200,
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)), // 10 days from now
  }) as CrossJourneyQuest,
  
  // All journeys cross-journey quest
  createQuestFixture({
    id: 'cross-quest-4',
    title: 'Complete Health Journey',
    description: 'Track a health metric, attend a telemedicine appointment, and review your benefits',
    journey: 'cross-journey',
    icon: 'trophy',
    xpReward: 500,
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
  }) as CrossJourneyQuest,
];

// ===== USER QUEST FIXTURES =====

/**
 * User quest fixtures in different states (not started, in progress, completed).
 * These fixtures represent the relationship between users and quests, tracking progress and completion status.
 * They are essential for testing quest progress tracking, step completion, and event-driven progression.
 */
export const userQuestFixtures: UserQuest[] = [
  // Not started quest
  createUserQuestFixture({
    id: 'user-quest-1',
    userId: 'test-user-1',
    questId: 'health-quest-1',
    quest: healthQuestFixtures[0],
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    startedAt: null,
    completedAt: null,
  }),
  
  // In progress quest with 50% completion
  createUserQuestFixture({
    id: 'user-quest-2',
    userId: 'test-user-1',
    questId: 'care-quest-2',
    quest: careQuestFixtures[1],
    status: QuestStatus.IN_PROGRESS,
    progress: 50,
    startedAt: new Date(new Date().setDate(new Date().getDate() - 2)), // Started 2 days ago
    completedAt: null,
    progressMetadata: {
      completedSteps: [
        { stepId: 'day-1', completedAt: new Date(new Date().setDate(new Date().getDate() - 2)) },
        { stepId: 'day-2', completedAt: new Date(new Date().setDate(new Date().getDate() - 1)) },
        { stepId: 'day-3', completedAt: new Date() },
      ],
      totalSteps: 7,
      lastCompletedStep: 'day-3',
    },
  }),
  
  // Completed quest
  createUserQuestFixture({
    id: 'user-quest-3',
    userId: 'test-user-1',
    questId: 'plan-quest-3',
    quest: planQuestFixtures[2],
    status: QuestStatus.COMPLETED,
    progress: 100,
    startedAt: new Date(new Date().setDate(new Date().getDate() - 5)), // Started 5 days ago
    completedAt: new Date(new Date().setDate(new Date().getDate() - 3)), // Completed 3 days ago
  }),
  
  // Cross-journey quest in progress
  createUserQuestFixture({
    id: 'user-quest-4',
    userId: 'test-user-1',
    questId: 'cross-quest-1',
    quest: crossJourneyQuestFixtures[0],
    status: QuestStatus.IN_PROGRESS,
    progress: 60,
    startedAt: new Date(new Date().setDate(new Date().getDate() - 3)), // Started 3 days ago
    completedAt: null,
    progressMetadata: {
      completedSteps: [
        { 
          stepId: 'track-steps-day-1', 
          completedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
          journey: 'health',
          eventType: 'health_metric_recorded'
        },
        { 
          stepId: 'medication-day-1', 
          completedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
          journey: 'care',
          eventType: 'medication_taken'
        },
        { 
          stepId: 'track-steps-day-2', 
          completedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
          journey: 'health',
          eventType: 'health_metric_recorded'
        },
        { 
          stepId: 'medication-day-2', 
          completedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
          journey: 'care',
          eventType: 'medication_taken'
        },
        { 
          stepId: 'track-steps-day-3', 
          completedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
          journey: 'health',
          eventType: 'health_metric_recorded'
        },
        { 
          stepId: 'medication-day-3', 
          completedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
          journey: 'care',
          eventType: 'medication_taken'
        },
      ],
      totalSteps: 10, // 5 days * 2 tasks per day
      lastCompletedStep: 'medication-day-3',
      journeyProgress: {
        health: 3, // 3 days of step tracking completed
        care: 3,   // 3 days of medication tracking completed
      },
    },
  }),
];

// ===== QUEST SCENARIOS =====

/**
 * Quest scenario fixtures for testing specific use cases.
 * These scenarios include both the quest definition and sample user progress,
 * along with events that would trigger progress updates.
 */
export const questScenarios = {
  /**
   * Scenario for testing daily streak quests.
   */
  dailyStreak: {
    quest: createQuestFixture({
      id: 'daily-streak-quest',
      title: 'Daily Login Streak',
      description: 'Log in for 7 consecutive days to earn XP',
      journey: 'cross-journey',
      icon: 'calendar-check',
      xpReward: 200,
      deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
    }),
    userQuest: createUserQuestFixture({
      questId: 'daily-streak-quest',
      status: QuestStatus.IN_PROGRESS,
      progress: 42.85, // 3/7 days = ~42.85%
      progressMetadata: {
        completedSteps: [
          { stepId: 'day-1', completedAt: new Date(new Date().setDate(new Date().getDate() - 3)) },
          { stepId: 'day-2', completedAt: new Date(new Date().setDate(new Date().getDate() - 2)) },
          { stepId: 'day-3', completedAt: new Date(new Date().setDate(new Date().getDate() - 1)) },
        ],
        totalSteps: 7,
        lastCompletedStep: 'day-3',
        streakCount: 3,
      },
    }),
    events: [
      { type: 'user_login', timestamp: new Date(new Date().setDate(new Date().getDate() - 3)) },
      { type: 'user_login', timestamp: new Date(new Date().setDate(new Date().getDate() - 2)) },
      { type: 'user_login', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
      { type: 'user_login', timestamp: new Date() }, // Today's login
    ],
  },
  
  /**
   * Scenario for testing multi-step quests with different completion requirements.
   */
  multiStepQuest: {
    quest: createQuestFixture({
      id: 'multi-step-quest',
      title: 'Complete Health Profile',
      description: 'Fill out all sections of your health profile',
      journey: 'health',
      icon: 'user-check',
      xpReward: 300,
      deadline: null, // No deadline
    }),
    userQuest: createUserQuestFixture({
      questId: 'multi-step-quest',
      status: QuestStatus.IN_PROGRESS,
      progress: 60, // 3/5 steps = 60%
      progressMetadata: {
        completedSteps: [
          { stepId: 'basic-info', completedAt: new Date(new Date().setDate(new Date().getDate() - 5)) },
          { stepId: 'medical-history', completedAt: new Date(new Date().setDate(new Date().getDate() - 3)) },
          { stepId: 'current-medications', completedAt: new Date(new Date().setDate(new Date().getDate() - 1)) },
        ],
        totalSteps: 5,
        lastCompletedStep: 'current-medications',
        remainingSteps: ['allergies', 'family-history'],
      },
    }),
    events: [
      { type: 'profile_section_completed', section: 'basic-info', timestamp: new Date(new Date().setDate(new Date().getDate() - 5)) },
      { type: 'profile_section_completed', section: 'medical-history', timestamp: new Date(new Date().setDate(new Date().getDate() - 3)) },
      { type: 'profile_section_completed', section: 'current-medications', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
    ],
  },
  
  /**
   * Scenario for testing quests with threshold-based completion.
   */
  thresholdQuest: {
    quest: createQuestFixture({
      id: 'threshold-quest',
      title: 'Step Master',
      description: 'Reach 100,000 total steps',
      journey: 'health',
      icon: 'footprints',
      xpReward: 500,
      deadline: null, // No deadline
    }),
    userQuest: createUserQuestFixture({
      questId: 'threshold-quest',
      status: QuestStatus.IN_PROGRESS,
      progress: 75, // 75,000/100,000 steps = 75%
      progressMetadata: {
        currentValue: 75000,
        targetValue: 100000,
        unit: 'steps',
        lastUpdate: new Date(new Date().setDate(new Date().getDate() - 1)),
      },
    }),
    events: [
      { type: 'steps_recorded', count: 5000, timestamp: new Date(new Date().setDate(new Date().getDate() - 10)) },
      { type: 'steps_recorded', count: 20000, timestamp: new Date(new Date().setDate(new Date().getDate() - 7)) },
      { type: 'steps_recorded', count: 30000, timestamp: new Date(new Date().setDate(new Date().getDate() - 4)) },
      { type: 'steps_recorded', count: 20000, timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
    ],
  },
  
  /**
   * Scenario for testing cross-journey quests with complex requirements.
   */
  complexCrossJourneyQuest: {
    quest: createQuestFixture({
      id: 'complex-cross-journey',
      title: 'Health Optimizer',
      description: 'Complete actions across all journeys to optimize your health',
      journey: 'cross-journey',
      icon: 'diagram-project',
      xpReward: 1000,
      deadline: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
    }),
    userQuest: createUserQuestFixture({
      questId: 'complex-cross-journey',
      status: QuestStatus.IN_PROGRESS,
      progress: 40, // 4/10 steps = 40%
      progressMetadata: {
        completedSteps: [
          { 
            stepId: 'connect-device', 
            completedAt: new Date(new Date().setDate(new Date().getDate() - 15)),
            journey: 'health',
            eventType: 'device_connected'
          },
          { 
            stepId: 'schedule-appointment', 
            completedAt: new Date(new Date().setDate(new Date().getDate() - 10)),
            journey: 'care',
            eventType: 'appointment_scheduled'
          },
          { 
            stepId: 'review-benefits', 
            completedAt: new Date(new Date().setDate(new Date().getDate() - 7)),
            journey: 'plan',
            eventType: 'benefits_reviewed'
          },
          { 
            stepId: 'set-health-goal', 
            completedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
            journey: 'health',
            eventType: 'goal_created'
          },
        ],
        totalSteps: 10,
        lastCompletedStep: 'set-health-goal',
        journeyProgress: {
          health: 2, // 2 health steps completed
          care: 1,   // 1 care step completed
          plan: 1,   // 1 plan step completed
        },
        remainingSteps: [
          { stepId: 'attend-appointment', journey: 'care' },
          { stepId: 'submit-claim', journey: 'plan' },
          { stepId: 'track-metrics-week', journey: 'health' },
          { stepId: 'medication-adherence', journey: 'care' },
          { stepId: 'complete-health-assessment', journey: 'health' },
          { stepId: 'review-coverage', journey: 'plan' },
        ],
      },
    }),
    events: [
      { type: 'device_connected', deviceType: 'smartwatch', journey: 'health', timestamp: new Date(new Date().setDate(new Date().getDate() - 15)) },
      { type: 'appointment_scheduled', providerId: 'provider-123', journey: 'care', timestamp: new Date(new Date().setDate(new Date().getDate() - 10)) },
      { type: 'benefits_reviewed', planId: 'plan-456', journey: 'plan', timestamp: new Date(new Date().setDate(new Date().getDate() - 7)) },
      { type: 'goal_created', goalType: 'weight', journey: 'health', timestamp: new Date(new Date().setDate(new Date().getDate() - 5)) },
    ],
  },
};

/**
 * Helper function to generate a quest with steps for testing step-based progression.
 * @param journeyType The journey type for the quest
 * @param steps Number of steps in the quest
 * @returns A quest fixture with step-based progression
 */
export const createStepBasedQuestFixture = (journeyType: JourneyType, steps: number = 5): Quest => {
  const journeyTitles = {
    'health': 'Health Journey Steps',
    'care': 'Care Journey Steps',
    'plan': 'Plan Journey Steps',
    'cross-journey': 'Cross-Journey Steps'
  };
  
  return createQuestFixture({
    title: journeyTitles[journeyType] || 'Step-Based Quest',
    description: `Complete ${steps} steps to earn XP`,
    journey: journeyType,
    icon: 'list-check',
    xpReward: steps * 50, // XP scales with number of steps
    deadline: new Date(new Date().setDate(new Date().getDate() + steps * 2)), // Deadline scales with steps
  });
};

/**
 * Helper function to create an event-driven quest fixture for testing event processing.
 * @param eventType The type of event that progresses this quest
 * @param journeyType The journey type for the quest
 * @returns A quest fixture that responds to specific events
 */
export const createEventDrivenQuestFixture = (eventType: string, journeyType: JourneyType): Quest => {
  const eventTitles = {
    'health_metric_recorded': 'Record Health Metrics',
    'appointment_scheduled': 'Schedule Appointments',
    'medication_taken': 'Medication Adherence',
    'claim_submitted': 'Submit Claims',
    'benefit_used': 'Use Your Benefits',
    'user_login': 'Regular Login',
    'profile_updated': 'Keep Profile Updated',
  };
  
  return createQuestFixture({
    title: eventTitles[eventType] || 'Event-Driven Quest',
    description: `Complete actions that trigger ${eventType} events`,
    journey: journeyType,
    icon: 'bell',
    xpReward: 150,
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
  });
};

/**
 * All quest fixtures combined for easy access.
 */
export const allQuestFixtures = {
  health: healthQuestFixtures,
  care: careQuestFixtures,
  plan: planQuestFixtures,
  crossJourney: crossJourneyQuestFixtures,
  userQuests: userQuestFixtures,
  scenarios: questScenarios,
  
  // Helper functions exposed for test creation
  createQuestFixture,
  createUserQuestFixture,
  createStepBasedQuestFixture,
  createEventDrivenQuestFixture,
};

export default allQuestFixtures;