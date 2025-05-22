/**
 * @file Cross-journey test scenarios for the gamification system
 * @description Provides test fixtures that simulate users engaging with multiple journeys
 * simultaneously, triggering cross-journey gamification rules, and earning complex achievements.
 * These scenarios test the ability of the gamification engine to process events from different
 * journeys and apply rules that span across journey boundaries.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Events,
  Achievements,
  Rules,
  Profiles,
  Quests,
  Rewards
} from '@austa/interfaces/gamification';

/**
 * Interface for a cross-journey test scenario
 */
export interface CrossJourneyScenario {
  /** Name of the scenario for identification */
  name: string;
  
  /** Description of what the scenario tests */
  description: string;
  
  /** User profile for the scenario */
  userProfile: Profiles.IGameProfile;
  
  /** Events to be processed in sequence */
  events: Events.GamificationEvent[];
  
  /** Rules that should be triggered by the events */
  rules: Rules.Rule[];
  
  /** Expected achievements to be unlocked */
  expectedAchievements: Achievements.Achievement[];
  
  /** Expected rewards to be granted */
  expectedRewards?: Rewards.Reward[];
  
  /** Expected quests to be progressed or completed */
  expectedQuests?: Quests.Quest[];
  
  /** Expected XP to be earned */
  expectedXpEarned: number;
}

/**
 * Creates a base user profile for testing
 * @param userId User ID for the profile
 * @returns A game profile for testing
 */
export function createTestUserProfile(userId: string = uuidv4()): Profiles.IGameProfile {
  return {
    id: uuidv4(),
    userId,
    level: 1,
    xp: 0,
    totalXp: 0,
    streaks: [],
    badges: [],
    settings: {
      notifications: true,
      leaderboard: true,
      shareAchievements: true
    },
    metrics: {
      healthEventsCount: 0,
      careEventsCount: 0,
      planEventsCount: 0,
      totalEventsCount: 0,
      achievementsUnlocked: 0,
      questsCompleted: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Creates a test event with the specified parameters
 * @param type Event type
 * @param userId User ID
 * @param journey Journey source
 * @param payload Event payload
 * @returns A gamification event
 */
export function createTestEvent(
  type: Events.EventType,
  userId: string,
  journey: Events.EventJourney,
  payload: Events.EventPayload
): Events.GamificationEvent {
  return {
    eventId: uuidv4(),
    type,
    userId,
    journey,
    payload,
    version: { major: 1, minor: 0, patch: 0 },
    createdAt: new Date().toISOString(),
    source: 'test'
  };
}

/**
 * Creates a test achievement with the specified parameters
 * @param journey Journey type
 * @param title Achievement title
 * @param description Achievement description
 * @param xpReward XP reward for unlocking
 * @returns An achievement
 */
export function createTestAchievement(
  journey: Achievements.JourneyType,
  title: string,
  description: string,
  xpReward: number = 100
): Achievements.Achievement {
  return {
    id: uuidv4(),
    title,
    description,
    journey,
    icon: 'trophy',
    xpReward
  };
}

/**
 * Creates a test rule with the specified parameters
 * @param event Event type to listen for
 * @param condition Rule condition
 * @param actions Actions to perform when triggered
 * @returns A rule
 */
export function createTestRule(
  event: string,
  condition: Rules.RuleCondition,
  actions: Rules.RuleAction[]
): Rules.Rule {
  return {
    id: uuidv4(),
    event,
    condition,
    actions
  };
}

/**
 * Scenario 1: Wellness Warrior
 * 
 * Tests a user who engages with all three journeys (Health, Care, Plan) and unlocks
 * a cross-journey achievement for maintaining consistent engagement across all areas.
 * 
 * This scenario validates:
 * 1. Processing events from multiple journeys for the same user
 * 2. Tracking cross-journey activity patterns
 * 3. Unlocking achievements that require activity across journeys
 * 4. Proper XP calculation from multi-journey activities
 */
export const wellnessWarriorScenario: CrossJourneyScenario = (() => {
  const userId = uuidv4();
  const userProfile = createTestUserProfile(userId);
  
  // Create cross-journey achievement
  const wellnessWarriorAchievement = createTestAchievement(
    Achievements.JourneyType.GLOBAL,
    'Wellness Warrior',
    'Engage with all three journeys (Health, Care, Plan) in a single week',
    250
  );
  
  // Create journey-specific achievements
  const healthTrackerAchievement = createTestAchievement(
    Achievements.JourneyType.HEALTH,
    'Health Tracker',
    'Record health metrics for 3 consecutive days',
    100
  );
  
  const appointmentKeeperAchievement = createTestAchievement(
    Achievements.JourneyType.CARE,
    'Appointment Keeper',
    'Attend a scheduled medical appointment',
    100
  );
  
  const planExplorerAchievement = createTestAchievement(
    Achievements.JourneyType.PLAN,
    'Plan Explorer',
    'Review your insurance coverage details',
    100
  );
  
  // Create events from different journeys
  const healthEvent1 = createTestEvent(
    Events.EventType.HEALTH_METRIC_RECORDED,
    userId,
    Events.EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      metricType: 'STEPS',
      value: 8500,
      unit: 'steps',
      source: 'manual'
    } as Events.HealthMetricRecordedPayload
  );
  
  const healthEvent2 = createTestEvent(
    Events.EventType.HEALTH_GOAL_CREATED,
    userId,
    Events.EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      goalId: uuidv4(),
      goalType: 'STEPS',
      targetValue: 10000,
      unit: 'steps',
      period: 'daily'
    } as Events.HealthGoalPayload
  );
  
  const careEvent = createTestEvent(
    Events.EventType.APPOINTMENT_ATTENDED,
    userId,
    Events.EventJourney.CARE,
    {
      timestamp: new Date().toISOString(),
      appointmentId: uuidv4(),
      appointmentType: 'CHECKUP',
      providerId: uuidv4(),
      isFirstAppointment: true
    } as Events.AppointmentEventPayload
  );
  
  const planEvent = createTestEvent(
    Events.EventType.COVERAGE_REVIEWED,
    userId,
    Events.EventJourney.PLAN,
    {
      timestamp: new Date().toISOString(),
      metadata: {
        coverageType: 'MEDICAL',
        reviewDuration: 300 // seconds
      }
    } as Events.BaseEventPayload
  );
  
  // Create rules for the events
  const healthMetricRule = createTestRule(
    Events.EventType.HEALTH_METRIC_RECORDED,
    { expression: "event.payload.metricType === 'STEPS' && event.payload.value >= 5000" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 50 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: healthTrackerAchievement.id, value: 1 }
    ]
  );
  
  const appointmentRule = createTestRule(
    Events.EventType.APPOINTMENT_ATTENDED,
    { expression: "true" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 100 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: appointmentKeeperAchievement.id, value: 1 }
    ]
  );
  
  const coverageReviewRule = createTestRule(
    Events.EventType.COVERAGE_REVIEWED,
    { expression: "event.payload.metadata && event.payload.metadata.reviewDuration >= 60" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 75 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: planExplorerAchievement.id, value: 1 }
    ]
  );
  
  // Create cross-journey rule
  const crossJourneyRule = createTestRule(
    'CROSS_JOURNEY_CHECK',
    {
      expression: "userProfile.metrics.healthEventsCount > 0 && userProfile.metrics.careEventsCount > 0 && userProfile.metrics.planEventsCount > 0"
    },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 250 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: wellnessWarriorAchievement.id, value: 1 }
    ]
  );
  
  return {
    name: 'Wellness Warrior Scenario',
    description: 'Tests a user engaging with all three journeys and unlocking a cross-journey achievement',
    userProfile,
    events: [healthEvent1, healthEvent2, careEvent, planEvent],
    rules: [healthMetricRule, appointmentRule, coverageReviewRule, crossJourneyRule],
    expectedAchievements: [healthTrackerAchievement, appointmentKeeperAchievement, planExplorerAchievement, wellnessWarriorAchievement],
    expectedXpEarned: 475 // 50 + 100 + 75 + 250
  };
})();

/**
 * Scenario 2: Prevention Champion
 * 
 * Tests a user who completes preventive care activities across Health and Care journeys,
 * unlocking a cross-journey achievement for preventive health management.
 * 
 * This scenario validates:
 * 1. Processing related events across Health and Care journeys
 * 2. Tracking thematic activities that span multiple journeys
 * 3. Unlocking achievements that require specific combinations of activities
 * 4. Proper event ordering and rule triggering for complex patterns
 */
export const preventionChampionScenario: CrossJourneyScenario = (() => {
  const userId = uuidv4();
  const userProfile = createTestUserProfile(userId);
  
  // Create cross-journey achievement
  const preventionChampionAchievement = createTestAchievement(
    Achievements.JourneyType.GLOBAL,
    'Prevention Champion',
    'Complete a health assessment and attend a preventive care appointment',
    300
  );
  
  // Create journey-specific achievements
  const healthAssessmentAchievement = createTestAchievement(
    Achievements.JourneyType.HEALTH,
    'Health Assessment Pro',
    'Complete a comprehensive health assessment',
    150
  );
  
  const preventiveCareAchievement = createTestAchievement(
    Achievements.JourneyType.CARE,
    'Preventive Care Star',
    'Attend a preventive care appointment',
    150
  );
  
  // Create events from different journeys
  const healthAssessmentEvent = createTestEvent(
    Events.EventType.HEALTH_ASSESSMENT_COMPLETED,
    userId,
    Events.EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      metadata: {
        assessmentType: 'COMPREHENSIVE',
        completionTime: 600, // seconds
        riskFactorsIdentified: 2
      }
    } as Events.BaseEventPayload
  );
  
  const preventiveAppointmentEvent = createTestEvent(
    Events.EventType.APPOINTMENT_ATTENDED,
    userId,
    Events.EventJourney.CARE,
    {
      timestamp: new Date().toISOString(),
      appointmentId: uuidv4(),
      appointmentType: 'PREVENTIVE',
      providerId: uuidv4(),
      isFirstAppointment: false
    } as Events.AppointmentEventPayload
  );
  
  // Create rules for the events
  const healthAssessmentRule = createTestRule(
    Events.EventType.HEALTH_ASSESSMENT_COMPLETED,
    { expression: "event.payload.metadata && event.payload.metadata.assessmentType === 'COMPREHENSIVE'" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 150 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: healthAssessmentAchievement.id, value: 1 }
    ]
  );
  
  const preventiveAppointmentRule = createTestRule(
    Events.EventType.APPOINTMENT_ATTENDED,
    { expression: "event.payload.appointmentType === 'PREVENTIVE'" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 150 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: preventiveCareAchievement.id, value: 1 }
    ]
  );
  
  // Create cross-journey rule
  const preventionCrossJourneyRule = createTestRule(
    'PREVENTION_CHECK',
    {
      structured: {
        operator: 'AND',
        conditions: [
          { expression: "userProfile.achievements.some(a => a.achievementId === '" + healthAssessmentAchievement.id + "' && a.unlocked)" },
          { expression: "userProfile.achievements.some(a => a.achievementId === '" + preventiveCareAchievement.id + "' && a.unlocked)" }
        ]
      }
    },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 300 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: preventionChampionAchievement.id, value: 1 }
    ]
  );
  
  return {
    name: 'Prevention Champion Scenario',
    description: 'Tests a user completing preventive care activities across Health and Care journeys',
    userProfile,
    events: [healthAssessmentEvent, preventiveAppointmentEvent],
    rules: [healthAssessmentRule, preventiveAppointmentRule, preventionCrossJourneyRule],
    expectedAchievements: [healthAssessmentAchievement, preventiveCareAchievement, preventionChampionAchievement],
    expectedXpEarned: 600 // 150 + 150 + 300
  };
})();

/**
 * Scenario 3: Financial Wellness Master
 * 
 * Tests a user who manages both health goals and insurance benefits effectively,
 * demonstrating the connection between health management and financial wellness.
 * 
 * This scenario validates:
 * 1. Processing events that connect health outcomes with financial benefits
 * 2. Tracking complex relationships between Health and Plan journeys
 * 3. Unlocking achievements that reward holistic health and financial management
 * 4. Proper calculation of complex rewards spanning multiple journeys
 */
export const financialWellnessMasterScenario: CrossJourneyScenario = (() => {
  const userId = uuidv4();
  const userProfile = createTestUserProfile(userId);
  
  // Create cross-journey achievement
  const financialWellnessAchievement = createTestAchievement(
    Achievements.JourneyType.GLOBAL,
    'Financial Wellness Master',
    'Achieve a health goal and utilize a wellness benefit',
    350
  );
  
  // Create journey-specific achievements
  const healthGoalAchievement = createTestAchievement(
    Achievements.JourneyType.HEALTH,
    'Goal Crusher',
    'Achieve a health goal',
    150
  );
  
  const wellnessBenefitAchievement = createTestAchievement(
    Achievements.JourneyType.PLAN,
    'Wellness Benefit Pro',
    'Utilize a wellness benefit from your insurance plan',
    150
  );
  
  // Create events from different journeys
  const healthGoalAchievedEvent = createTestEvent(
    Events.EventType.HEALTH_GOAL_ACHIEVED,
    userId,
    Events.EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      goalId: uuidv4(),
      goalType: 'WEIGHT',
      targetValue: 75,
      unit: 'kg',
      completionPercentage: 100,
      isFirstTimeAchievement: true
    } as Events.HealthGoalAchievedPayload
  );
  
  const benefitUtilizedEvent = createTestEvent(
    Events.EventType.BENEFIT_UTILIZED,
    userId,
    Events.EventJourney.PLAN,
    {
      timestamp: new Date().toISOString(),
      benefitId: uuidv4(),
      benefitType: 'WELLNESS',
      value: 200
    } as Events.BenefitUtilizedPayload
  );
  
  // Create rules for the events
  const healthGoalRule = createTestRule(
    Events.EventType.HEALTH_GOAL_ACHIEVED,
    { expression: "event.payload.completionPercentage === 100" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 150 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: healthGoalAchievement.id, value: 1 }
    ]
  );
  
  const benefitUtilizedRule = createTestRule(
    Events.EventType.BENEFIT_UTILIZED,
    { expression: "event.payload.benefitType === 'WELLNESS'" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 150 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: wellnessBenefitAchievement.id, value: 1 }
    ]
  );
  
  // Create cross-journey rule
  const financialWellnessRule = createTestRule(
    'FINANCIAL_WELLNESS_CHECK',
    {
      structured: {
        operator: 'AND',
        conditions: [
          { expression: "userProfile.achievements.some(a => a.achievementId === '" + healthGoalAchievement.id + "' && a.unlocked)" },
          { expression: "userProfile.achievements.some(a => a.achievementId === '" + wellnessBenefitAchievement.id + "' && a.unlocked)" }
        ]
      }
    },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 350 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: financialWellnessAchievement.id, value: 1 },
      { 
        type: Rules.RuleActionType.SEND_NOTIFICATION, 
        message: "You've unlocked the Financial Wellness Master achievement by connecting your health goals with your insurance benefits!"
      }
    ]
  );
  
  // Create a reward for this achievement
  const financialWellnessReward: Rewards.Reward = {
    id: uuidv4(),
    title: 'Premium Discount',
    description: '5% discount on next month\'s premium',
    type: 'DISCOUNT',
    value: 5,
    requiredXp: 500,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return {
    name: 'Financial Wellness Master Scenario',
    description: 'Tests a user managing both health goals and insurance benefits effectively',
    userProfile,
    events: [healthGoalAchievedEvent, benefitUtilizedEvent],
    rules: [healthGoalRule, benefitUtilizedRule, financialWellnessRule],
    expectedAchievements: [healthGoalAchievement, wellnessBenefitAchievement, financialWellnessAchievement],
    expectedRewards: [financialWellnessReward],
    expectedXpEarned: 650 // 150 + 150 + 350
  };
})();

/**
 * Scenario 4: Complete Care Coordinator
 * 
 * Tests a user who coordinates care across all three journeys, demonstrating
 * the ability to manage health metrics, attend appointments, and handle claims efficiently.
 * 
 * This scenario validates:
 * 1. Processing complex sequences of events across all journeys
 * 2. Tracking sophisticated user behavior patterns that span multiple domains
 * 3. Unlocking tiered achievements that require progressive engagement
 * 4. Proper handling of event dependencies and temporal relationships
 */
export const completeCareCoordinatorScenario: CrossJourneyScenario = (() => {
  const userId = uuidv4();
  const userProfile = createTestUserProfile(userId);
  
  // Create cross-journey achievement
  const careCoordinatorAchievement = createTestAchievement(
    Achievements.JourneyType.GLOBAL,
    'Complete Care Coordinator',
    'Manage your health metrics, attend an appointment, and submit a related claim',
    500
  );
  
  // Create journey-specific achievements
  const healthMetricsAchievement = createTestAchievement(
    Achievements.JourneyType.HEALTH,
    'Health Metrics Manager',
    'Record multiple health metrics in preparation for an appointment',
    100
  );
  
  const specialistAppointmentAchievement = createTestAchievement(
    Achievements.JourneyType.CARE,
    'Specialist Consultation',
    'Attend an appointment with a specialist',
    150
  );
  
  const efficientClaimAchievement = createTestAchievement(
    Achievements.JourneyType.PLAN,
    'Efficient Claim Submitter',
    'Submit a claim within 48 hours of an appointment',
    200
  );
  
  // Create a quest that spans all three journeys
  const careCoordinationQuest: Quests.Quest = {
    id: uuidv4(),
    title: 'Care Coordination Challenge',
    description: 'Complete a full cycle of care coordination across all journeys',
    type: 'MULTI_JOURNEY',
    steps: [
      { id: uuidv4(), description: 'Record health metrics before appointment', requiredProgress: 1 },
      { id: uuidv4(), description: 'Attend specialist appointment', requiredProgress: 1 },
      { id: uuidv4(), description: 'Submit claim for appointment', requiredProgress: 1 }
    ],
    xpReward: 300,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    requiredLevel: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Create events from different journeys
  const healthMetricEvent1 = createTestEvent(
    Events.EventType.HEALTH_METRIC_RECORDED,
    userId,
    Events.EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      metricType: 'BLOOD_PRESSURE',
      value: 120,
      unit: 'mmHg',
      source: 'manual'
    } as Events.HealthMetricRecordedPayload
  );
  
  const healthMetricEvent2 = createTestEvent(
    Events.EventType.HEALTH_METRIC_RECORDED,
    userId,
    Events.EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      source: 'manual'
    } as Events.HealthMetricRecordedPayload
  );
  
  const appointmentEvent = createTestEvent(
    Events.EventType.APPOINTMENT_ATTENDED,
    userId,
    Events.EventJourney.CARE,
    {
      timestamp: new Date().toISOString(),
      appointmentId: uuidv4(),
      appointmentType: 'SPECIALIST',
      providerId: uuidv4(),
      isFirstAppointment: false
    } as Events.AppointmentEventPayload
  );
  
  const claimEvent = createTestEvent(
    Events.EventType.CLAIM_SUBMITTED,
    userId,
    Events.EventJourney.PLAN,
    {
      timestamp: new Date().toISOString(),
      claimId: uuidv4(),
      claimType: 'MEDICAL',
      amount: 150
    } as Events.ClaimEventPayload
  );
  
  // Create rules for the events
  const healthMetricsRule = createTestRule(
    Events.EventType.HEALTH_METRIC_RECORDED,
    { expression: "true" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 50 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: healthMetricsAchievement.id, value: 0.5 }, // Need 2 metrics
      { type: Rules.RuleActionType.PROGRESS_QUEST, questId: careCoordinationQuest.id, value: 0.5 } // Progress first step
    ]
  );
  
  const specialistAppointmentRule = createTestRule(
    Events.EventType.APPOINTMENT_ATTENDED,
    { expression: "event.payload.appointmentType === 'SPECIALIST'" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 150 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: specialistAppointmentAchievement.id, value: 1 },
      { type: Rules.RuleActionType.PROGRESS_QUEST, questId: careCoordinationQuest.id, value: 1 } // Complete second step
    ]
  );
  
  const claimSubmissionRule = createTestRule(
    Events.EventType.CLAIM_SUBMITTED,
    { expression: "event.payload.claimType === 'MEDICAL'" },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 200 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: efficientClaimAchievement.id, value: 1 },
      { type: Rules.RuleActionType.PROGRESS_QUEST, questId: careCoordinationQuest.id, value: 1 } // Complete third step
    ]
  );
  
  // Create cross-journey rule
  const careCoordinatorRule = createTestRule(
    'CARE_COORDINATOR_CHECK',
    {
      structured: {
        operator: 'AND',
        conditions: [
          { expression: "userProfile.achievements.some(a => a.achievementId === '" + healthMetricsAchievement.id + "' && a.unlocked)" },
          { expression: "userProfile.achievements.some(a => a.achievementId === '" + specialistAppointmentAchievement.id + "' && a.unlocked)" },
          { expression: "userProfile.achievements.some(a => a.achievementId === '" + efficientClaimAchievement.id + "' && a.unlocked)" }
        ]
      }
    },
    [
      { type: Rules.RuleActionType.AWARD_XP, value: 500 },
      { type: Rules.RuleActionType.PROGRESS_ACHIEVEMENT, achievementId: careCoordinatorAchievement.id, value: 1 },
      { 
        type: Rules.RuleActionType.SEND_NOTIFICATION, 
        message: "Congratulations! You've mastered care coordination across all journeys!"
      }
    ]
  );
  
  // Create a reward for completing the quest
  const careCoordinationReward: Rewards.Reward = {
    id: uuidv4(),
    title: 'Care Coordination Badge',
    description: 'Special profile badge showing your care coordination expertise',
    type: 'BADGE',
    value: 0,
    requiredXp: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return {
    name: 'Complete Care Coordinator Scenario',
    description: 'Tests a user coordinating care across all three journeys',
    userProfile,
    events: [healthMetricEvent1, healthMetricEvent2, appointmentEvent, claimEvent],
    rules: [healthMetricsRule, specialistAppointmentRule, claimSubmissionRule, careCoordinatorRule],
    expectedAchievements: [healthMetricsAchievement, specialistAppointmentAchievement, efficientClaimAchievement, careCoordinatorAchievement],
    expectedQuests: [careCoordinationQuest],
    expectedRewards: [careCoordinationReward],
    expectedXpEarned: 950 // 50 + 50 + 150 + 200 + 500
  };
})();

/**
 * Exports all cross-journey scenarios for use in tests
 */
export const crossJourneyScenarios = {
  wellnessWarrior: wellnessWarriorScenario,
  preventionChampion: preventionChampionScenario,
  financialWellnessMaster: financialWellnessMasterScenario,
  completeCareCoordinator: completeCareCoordinatorScenario
};

/**
 * Helper function to get a specific cross-journey scenario by name
 * @param name Name of the scenario to retrieve
 * @returns The requested scenario or undefined if not found
 */
export function getScenarioByName(name: string): CrossJourneyScenario | undefined {
  const scenarios = {
    'wellnessWarrior': wellnessWarriorScenario,
    'preventionChampion': preventionChampionScenario,
    'financialWellnessMaster': financialWellnessMasterScenario,
    'completeCareCoordinator': completeCareCoordinatorScenario
  };
  
  return scenarios[name];
}

/**
 * Helper function to get all events from all scenarios
 * @returns Array of all events from all scenarios
 */
export function getAllCrossJourneyEvents(): Events.GamificationEvent[] {
  return [
    ...wellnessWarriorScenario.events,
    ...preventionChampionScenario.events,
    ...financialWellnessMasterScenario.events,
    ...completeCareCoordinatorScenario.events
  ];
}

/**
 * Helper function to get all rules from all scenarios
 * @returns Array of all rules from all scenarios
 */
export function getAllCrossJourneyRules(): Rules.Rule[] {
  return [
    ...wellnessWarriorScenario.rules,
    ...preventionChampionScenario.rules,
    ...financialWellnessMasterScenario.rules,
    ...completeCareCoordinatorScenario.rules
  ];
}

/**
 * Helper function to get all achievements from all scenarios
 * @returns Array of all achievements from all scenarios
 */
export function getAllCrossJourneyAchievements(): Achievements.Achievement[] {
  return [
    ...wellnessWarriorScenario.expectedAchievements,
    ...preventionChampionScenario.expectedAchievements,
    ...financialWellnessMasterScenario.expectedAchievements,
    ...completeCareCoordinatorScenario.expectedAchievements
  ];
}