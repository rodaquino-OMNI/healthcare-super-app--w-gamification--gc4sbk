/**
 * @file rules.fixtures.ts
 * @description Test fixtures for gamification rules that determine when events trigger achievements.
 * 
 * This file provides mock rule definitions for different journeys, conditions, and actions.
 * These fixtures are used for testing rule evaluation, condition matching, and action execution
 * in the gamification engine.
 */

import { v4 as uuidv4 } from 'uuid';

// Import from @austa/interfaces using path aliases
import { GamificationEventType, HealthEventType, CareEventType, PlanEventType, CommonEventType } from '@austa/interfaces/gamification/events';
import { RuleActionType } from '@austa/interfaces/gamification/rules';
import { JourneyType } from '@austa/interfaces/common/types';

/**
 * Enum for journey IDs used in rules
 */
export enum JourneyId {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  ALL = 'all'
}

/**
 * Base interface for rule fixtures
 */
export interface RuleFixture {
  id: string;
  name: string;
  description?: string;
  eventType: GamificationEventType;
  journey?: JourneyId;
  condition: {
    expression: string;
    parameters?: Record<string, any>;
  };
  action: {
    type: RuleActionType;
    payload: Record<string, any>;
  };
  priority: number;
  isActive: boolean;
}

/**
 * Health journey rule fixtures
 */
export const healthRuleFixtures: RuleFixture[] = [
  {
    id: uuidv4(),
    name: 'Daily Steps Goal Achieved',
    description: 'Awards XP when a user reaches their daily steps goal',
    eventType: HealthEventType.HEALTH_METRIC_RECORDED as GamificationEventType,
    journey: JourneyId.HEALTH,
    condition: {
      expression: 'event.data.metricType === "STEPS" && event.data.value >= 10000',
      parameters: {
        stepGoal: 10000
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 50
      }
    },
    priority: 10,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'First Device Connection',
    description: 'Unlocks an achievement when a user connects their first device',
    eventType: HealthEventType.DEVICE_CONNECTED as GamificationEventType,
    journey: JourneyId.HEALTH,
    condition: {
      expression: 'event.data.isFirstConnection === true'
    },
    action: {
      type: RuleActionType.UNLOCK_ACHIEVEMENT,
      payload: {
        achievementId: 'health-device-connected-achievement'
      }
    },
    priority: 20,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Health Streak Milestone',
    description: 'Awards XP when a user records health metrics for consecutive days',
    eventType: HealthEventType.HEALTH_METRIC_RECORDED as GamificationEventType,
    journey: JourneyId.HEALTH,
    condition: {
      expression: 'userProfile.metadata && userProfile.metadata.healthStreak && userProfile.metadata.healthStreak % 7 === 0',
      parameters: {
        streakMilestone: 7
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 100,
        message: 'Congratulations on your {streak} day health streak!'
      }
    },
    priority: 5,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Complex Health Goal Achievement',
    description: 'Unlocks an achievement when multiple health conditions are met',
    eventType: HealthEventType.GOAL_ACHIEVED as GamificationEventType,
    journey: JourneyId.HEALTH,
    condition: {
      expression: `
        event.data.goalType === "STEPS" && 
        event.data.actualValue >= event.data.targetValue && 
        userProfile.metadata && 
        userProfile.metadata.previousGoalsAchieved && 
        userProfile.metadata.previousGoalsAchieved >= 5
      `,
      parameters: {
        requiredPreviousGoals: 5
      }
    },
    action: {
      type: RuleActionType.UNLOCK_ACHIEVEMENT,
      payload: {
        achievementId: 'health-goal-master-achievement'
      }
    },
    priority: 15,
    isActive: true
  }
];

/**
 * Care journey rule fixtures
 */
export const careRuleFixtures: RuleFixture[] = [
  {
    id: uuidv4(),
    name: 'Appointment Attendance',
    description: 'Awards XP when a user attends a scheduled appointment',
    eventType: CareEventType.APPOINTMENT_ATTENDED as GamificationEventType,
    journey: JourneyId.CARE,
    condition: {
      expression: 'true' // Always triggers when an appointment is attended
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 75
      }
    },
    priority: 10,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Medication Adherence Streak',
    description: 'Progresses an achievement when medications are taken consistently',
    eventType: CareEventType.MEDICATION_TAKEN as GamificationEventType,
    journey: JourneyId.CARE,
    condition: {
      expression: 'event.data.onSchedule === true && event.data.streakDays >= 3',
      parameters: {
        requiredStreakDays: 3
      }
    },
    action: {
      type: RuleActionType.PROGRESS_ACHIEVEMENT,
      payload: {
        achievementId: 'medication-adherence-achievement',
        value: 1
      }
    },
    priority: 5,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'First Telemedicine Session',
    description: 'Unlocks an achievement when a user completes their first telemedicine session',
    eventType: CareEventType.TELEMEDICINE_SESSION_COMPLETED as GamificationEventType,
    journey: JourneyId.CARE,
    condition: {
      expression: `
        !userProfile.metadata || 
        !userProfile.metadata.telemedicineSessionsCompleted || 
        userProfile.metadata.telemedicineSessionsCompleted === 1
      `
    },
    action: {
      type: RuleActionType.UNLOCK_ACHIEVEMENT,
      payload: {
        achievementId: 'first-telemedicine-achievement'
      }
    },
    priority: 20,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Comprehensive Care Engagement',
    description: 'Awards XP when a user engages with multiple care features',
    eventType: CareEventType.APPOINTMENT_ATTENDED as GamificationEventType,
    journey: JourneyId.CARE,
    condition: {
      expression: `
        userProfile.metadata && 
        userProfile.metadata.appointmentsAttended && 
        userProfile.metadata.appointmentsAttended >= 1 && 
        userProfile.metadata.medicationAdherencePercentage && 
        userProfile.metadata.medicationAdherencePercentage >= 80
      `,
      parameters: {
        requiredAppointments: 1,
        requiredAdherencePercentage: 80
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 150,
        message: 'You\'re taking great care of your health!'
      }
    },
    priority: 15,
    isActive: true
  }
];

/**
 * Plan journey rule fixtures
 */
export const planRuleFixtures: RuleFixture[] = [
  {
    id: uuidv4(),
    name: 'Complete Claim Submission',
    description: 'Awards XP when a user submits a claim with all required documentation',
    eventType: PlanEventType.CLAIM_SUBMITTED as GamificationEventType,
    journey: JourneyId.PLAN,
    condition: {
      expression: 'event.data.hasDocuments === true'
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 50
      }
    },
    priority: 10,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'First Benefit Utilization',
    description: 'Unlocks an achievement when a user utilizes a benefit for the first time',
    eventType: PlanEventType.BENEFIT_VIEWED as GamificationEventType,
    journey: JourneyId.PLAN,
    condition: {
      expression: 'event.data.isFirstUtilization === true'
    },
    action: {
      type: RuleActionType.UNLOCK_ACHIEVEMENT,
      payload: {
        achievementId: 'first-benefit-achievement'
      }
    },
    priority: 20,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Plan Comparison Expert',
    description: 'Progresses an achievement when a user compares multiple plans',
    eventType: PlanEventType.PLAN_COMPARED as GamificationEventType,
    journey: JourneyId.PLAN,
    condition: {
      expression: `
        userProfile.metadata && 
        userProfile.metadata.plansCompared && 
        userProfile.metadata.plansCompared >= 3
      `,
      parameters: {
        requiredComparisons: 3
      }
    },
    action: {
      type: RuleActionType.PROGRESS_ACHIEVEMENT,
      payload: {
        achievementId: 'plan-comparison-expert-achievement',
        value: 1
      }
    },
    priority: 5,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'High-Value Claim Submission',
    description: 'Awards bonus XP for submitting high-value claims with proper documentation',
    eventType: PlanEventType.CLAIM_SUBMITTED as GamificationEventType,
    journey: JourneyId.PLAN,
    condition: {
      expression: 'event.data.amount >= 1000 && event.data.hasDocuments === true',
      parameters: {
        thresholdAmount: 1000
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 100,
        message: 'Bonus XP for submitting a well-documented high-value claim!'
      }
    },
    priority: 15,
    isActive: true
  }
];

/**
 * Cross-journey rule fixtures that apply to events from multiple journeys
 */
export const crossJourneyRuleFixtures: RuleFixture[] = [
  {
    id: uuidv4(),
    name: 'New User Onboarding',
    description: 'Awards XP when a new user logs in for the first time',
    eventType: CommonEventType.USER_LOGGED_IN as GamificationEventType,
    journey: JourneyId.ALL,
    condition: {
      expression: `
        !userProfile.metadata || 
        !userProfile.metadata.loginCount || 
        userProfile.metadata.loginCount === 1
      `
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 100,
        message: 'Welcome to AUSTA SuperApp!'
      }
    },
    priority: 100, // Highest priority
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Cross-Journey Engagement',
    description: 'Unlocks an achievement when a user engages with all three journeys',
    eventType: CommonEventType.PROFILE_UPDATED as GamificationEventType,
    journey: JourneyId.ALL,
    condition: {
      expression: `
        userProfile.journeyProgress && 
        userProfile.journeyProgress.health > 0 && 
        userProfile.journeyProgress.care > 0 && 
        userProfile.journeyProgress.plan > 0
      `
    },
    action: {
      type: RuleActionType.UNLOCK_ACHIEVEMENT,
      payload: {
        achievementId: 'cross-journey-explorer-achievement'
      }
    },
    priority: 50,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Achievement Milestone',
    description: 'Awards bonus XP when a user unlocks multiple achievements',
    eventType: CommonEventType.ACHIEVEMENT_UNLOCKED as GamificationEventType,
    journey: JourneyId.ALL,
    condition: {
      expression: `
        userProfile.achievements && 
        userProfile.achievements.length > 0 && 
        userProfile.achievements.length % 5 === 0
      `,
      parameters: {
        milestoneFactor: 5
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 250,
        message: 'Achievement milestone reached!'
      }
    },
    priority: 30,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Super User Status',
    description: 'Updates user level when they reach a high XP threshold',
    eventType: CommonEventType.PROFILE_UPDATED as GamificationEventType,
    journey: JourneyId.ALL,
    condition: {
      expression: 'userProfile.xp >= 10000',
      parameters: {
        xpThreshold: 10000
      }
    },
    action: {
      type: RuleActionType.UPDATE_LEVEL,
      payload: {
        level: 10,
        message: 'Congratulations! You\'ve reached Super User status!'
      }
    },
    priority: 40,
    isActive: true
  }
];

/**
 * Complex condition rule fixtures with advanced logic
 */
export const complexConditionRuleFixtures: RuleFixture[] = [
  {
    id: uuidv4(),
    name: 'Health and Care Integration',
    description: 'Awards XP when a user connects health data and attends appointments',
    eventType: CareEventType.APPOINTMENT_ATTENDED as GamificationEventType,
    journey: JourneyId.CARE,
    condition: {
      expression: `
        userProfile.metadata && 
        userProfile.metadata.connectedDevices && 
        userProfile.metadata.connectedDevices.length >= 1 && 
        userProfile.metadata.appointmentsAttended && 
        userProfile.metadata.appointmentsAttended >= 3 && 
        event.data.specialtyArea === "PRIMARY_CARE"
      `,
      parameters: {
        requiredDevices: 1,
        requiredAppointments: 3,
        specialtyArea: 'PRIMARY_CARE'
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 200,
        message: 'You\'re integrating your health data with your care!'
      }
    },
    priority: 25,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Comprehensive Health Management',
    description: 'Unlocks a special achievement for users who manage all aspects of their health',
    eventType: HealthEventType.HEALTH_METRIC_RECORDED as GamificationEventType,
    journey: JourneyId.HEALTH,
    condition: {
      expression: `
        // Check if user has recorded multiple types of health metrics
        userProfile.metadata && 
        userProfile.metadata.recordedMetricTypes && 
        Array.isArray(userProfile.metadata.recordedMetricTypes) && 
        userProfile.metadata.recordedMetricTypes.length >= 4 && 
        
        // Check if user has attended appointments
        userProfile.metadata.appointmentsAttended && 
        userProfile.metadata.appointmentsAttended >= 2 && 
        
        // Check if user has submitted claims
        userProfile.metadata.claimsSubmitted && 
        userProfile.metadata.claimsSubmitted >= 1 && 
        
        // Check if current event is recording a new metric type
        !userProfile.metadata.recordedMetricTypes.includes(event.data.metricType)
      `,
      parameters: {
        requiredMetricTypes: 4,
        requiredAppointments: 2,
        requiredClaims: 1
      }
    },
    action: {
      type: RuleActionType.UNLOCK_ACHIEVEMENT,
      payload: {
        achievementId: 'health-management-master-achievement',
        message: 'You\'ve mastered comprehensive health management!'
      }
    },
    priority: 35,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Seasonal Health Challenge',
    description: 'Awards XP for completing health activities during a specific time period',
    eventType: HealthEventType.GOAL_ACHIEVED as GamificationEventType,
    journey: JourneyId.HEALTH,
    condition: {
      expression: `
        // Check if the current date is within the challenge period
        (function() {
          const now = new Date();
          const challengeStart = new Date('2023-06-01');
          const challengeEnd = new Date('2023-08-31');
          return now >= challengeStart && now <= challengeEnd;
        })() && 
        
        // Check if the goal is a steps goal
        event.data.goalType === "STEPS" && 
        
        // Check if the goal was exceeded by at least 20%
        event.data.actualValue >= event.data.targetValue * 1.2
      `,
      parameters: {
        challengeStartDate: '2023-06-01',
        challengeEndDate: '2023-08-31',
        exceededPercentage: 20
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 150,
        message: 'Summer Health Challenge: Goal exceeded by more than 20%!'
      }
    },
    priority: 45,
    isActive: true
  }
];

/**
 * Inactive rule fixtures for testing isActive filtering
 */
export const inactiveRuleFixtures: RuleFixture[] = [
  {
    id: uuidv4(),
    name: 'Inactive Health Rule',
    description: 'This rule is inactive and should not be evaluated',
    eventType: HealthEventType.HEALTH_METRIC_RECORDED as GamificationEventType,
    journey: JourneyId.HEALTH,
    condition: {
      expression: 'true' // Would always trigger if active
    },
    action: {
      type: RuleActionType.AWARD_XP,
      payload: {
        value: 1000 // High value to make it obvious if incorrectly triggered
      }
    },
    priority: 100,
    isActive: false
  },
  {
    id: uuidv4(),
    name: 'Inactive Cross-Journey Rule',
    description: 'This cross-journey rule is inactive and should not be evaluated',
    eventType: CommonEventType.USER_LOGGED_IN as GamificationEventType,
    journey: JourneyId.ALL,
    condition: {
      expression: 'true' // Would always trigger if active
    },
    action: {
      type: RuleActionType.UNLOCK_ACHIEVEMENT,
      payload: {
        achievementId: 'inactive-achievement'
      }
    },
    priority: 100,
    isActive: false
  }
];

/**
 * Combined array of all rule fixtures
 */
export const allRuleFixtures: RuleFixture[] = [
  ...healthRuleFixtures,
  ...careRuleFixtures,
  ...planRuleFixtures,
  ...crossJourneyRuleFixtures,
  ...complexConditionRuleFixtures,
  ...inactiveRuleFixtures
];

/**
 * Helper function to get rule fixtures by journey
 * @param journey The journey to filter by
 * @returns Array of rule fixtures for the specified journey
 */
export function getRuleFixturesByJourney(journey: JourneyId): RuleFixture[] {
  return allRuleFixtures.filter(rule => 
    rule.isActive && (rule.journey === journey || rule.journey === JourneyId.ALL)
  );
}

/**
 * Helper function to get rule fixtures by event type
 * @param eventType The event type to filter by
 * @returns Array of rule fixtures for the specified event type
 */
export function getRuleFixturesByEventType(eventType: GamificationEventType): RuleFixture[] {
  return allRuleFixtures.filter(rule => 
    rule.isActive && rule.eventType === eventType
  );
}

/**
 * Helper function to get rule fixtures by both journey and event type
 * @param journey The journey to filter by
 * @param eventType The event type to filter by
 * @returns Array of rule fixtures for the specified journey and event type
 */
export function getRuleFixturesByJourneyAndEventType(
  journey: JourneyId,
  eventType: GamificationEventType
): RuleFixture[] {
  return allRuleFixtures.filter(rule => 
    rule.isActive && 
    (rule.journey === journey || rule.journey === JourneyId.ALL) && 
    rule.eventType === eventType
  );
}

/**
 * Helper function to get a rule fixture by ID
 * @param id The rule ID to find
 * @returns The rule fixture with the specified ID, or undefined if not found
 */
export function getRuleFixtureById(id: string): RuleFixture | undefined {
  return allRuleFixtures.find(rule => rule.id === id);
}