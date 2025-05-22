/**
 * @file Test fixtures for gamification rules.
 * 
 * This file provides mock rule definitions for testing the gamification engine's
 * rule evaluation, condition matching, and action execution capabilities.
 * It includes fixtures for different journeys, condition types, and action types.
 */

import { EventJourney, EventType } from '@austa/interfaces/gamification/events';
import { RuleActionType } from '@austa/interfaces/gamification/rules';

/**
 * Base rule fixture with common properties.
 * 
 * @param overrides - Properties to override in the base rule
 * @returns A rule fixture with default values and any overrides
 */
export const createBaseRuleFixture = (overrides: Record<string, any> = {}) => ({
  id: 'rule-test-id',
  name: 'Test Rule',
  description: 'A test rule for unit testing',
  eventType: EventType.HEALTH_METRIC_RECORDED,
  journey: EventJourney.HEALTH,
  condition: {
    expression: 'event.data.value > 100'
  },
  action: {
    type: RuleActionType.AWARD_XP,
    value: 10
  },
  priority: 100,
  isActive: true,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
  ...overrides
});

/**
 * Collection of rule fixtures for simple condition testing.
 * 
 * These fixtures use basic expression conditions to test the rule evaluation engine.
 */
export const simpleConditionRules = {
  /**
   * Rule that always evaluates to true.
   */
  alwaysTrue: createBaseRuleFixture({
    id: 'rule-always-true',
    name: 'Always True Rule',
    description: 'A rule that always evaluates to true',
    condition: {
      expression: 'true'
    }
  }),

  /**
   * Rule that always evaluates to false.
   */
  alwaysFalse: createBaseRuleFixture({
    id: 'rule-always-false',
    name: 'Always False Rule',
    description: 'A rule that always evaluates to false',
    condition: {
      expression: 'false'
    }
  }),

  /**
   * Rule with a numeric comparison condition.
   */
  numericComparison: createBaseRuleFixture({
    id: 'rule-numeric-comparison',
    name: 'Numeric Comparison Rule',
    description: 'A rule that compares numeric values',
    condition: {
      expression: 'event.data.value >= 100'
    }
  }),

  /**
   * Rule with a string comparison condition.
   */
  stringComparison: createBaseRuleFixture({
    id: 'rule-string-comparison',
    name: 'String Comparison Rule',
    description: 'A rule that compares string values',
    eventType: EventType.APPOINTMENT_BOOKED,
    journey: EventJourney.CARE,
    condition: {
      expression: 'event.data.appointmentType === "TELEMEDICINE"'
    }
  }),

  /**
   * Rule with a date comparison condition.
   */
  dateComparison: createBaseRuleFixture({
    id: 'rule-date-comparison',
    name: 'Date Comparison Rule',
    description: 'A rule that compares dates',
    condition: {
      expression: 'new Date(event.data.timestamp) > new Date("2023-01-01")'
    }
  }),

  /**
   * Rule with a null/undefined check condition.
   */
  nullCheck: createBaseRuleFixture({
    id: 'rule-null-check',
    name: 'Null Check Rule',
    description: 'A rule that checks for null or undefined values',
    condition: {
      expression: 'event.data.value != null'
    }
  })
};

/**
 * Collection of rule fixtures with complex structured conditions.
 * 
 * These fixtures use structured condition objects with logical operators
 * to test advanced condition evaluation capabilities.
 */
export const complexConditionRules = {
  /**
   * Rule with a logical AND condition.
   */
  logicalAnd: createBaseRuleFixture({
    id: 'rule-logical-and',
    name: 'Logical AND Rule',
    description: 'A rule with a logical AND condition',
    condition: {
      structured: {
        operator: 'AND',
        conditions: [
          { expression: 'event.data.value > 100' },
          { expression: 'event.data.source === "device"' }
        ]
      }
    }
  }),

  /**
   * Rule with a logical OR condition.
   */
  logicalOr: createBaseRuleFixture({
    id: 'rule-logical-or',
    name: 'Logical OR Rule',
    description: 'A rule with a logical OR condition',
    condition: {
      structured: {
        operator: 'OR',
        conditions: [
          { expression: 'event.data.value > 150' },
          { expression: 'event.data.isWithinHealthyRange === true' }
        ]
      }
    }
  }),

  /**
   * Rule with a logical NOT condition.
   */
  logicalNot: createBaseRuleFixture({
    id: 'rule-logical-not',
    name: 'Logical NOT Rule',
    description: 'A rule with a logical NOT condition',
    condition: {
      structured: {
        operator: 'NOT',
        conditions: [
          { expression: 'event.data.value < 50' }
        ]
      }
    }
  }),

  /**
   * Rule with nested logical operators.
   */
  nestedLogical: createBaseRuleFixture({
    id: 'rule-nested-logical',
    name: 'Nested Logical Rule',
    description: 'A rule with nested logical operators',
    condition: {
      structured: {
        operator: 'AND',
        conditions: [
          { expression: 'event.data.metricType === "STEPS"' },
          {
            structured: {
              operator: 'OR',
              conditions: [
                { expression: 'event.data.value > 10000' },
                {
                  structured: {
                    operator: 'AND',
                    conditions: [
                      { expression: 'event.data.value > 5000' },
                      { expression: 'event.data.isWithinHealthyRange === true' }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }),

  /**
   * Rule with field comparison operators.
   */
  fieldComparison: createBaseRuleFixture({
    id: 'rule-field-comparison',
    name: 'Field Comparison Rule',
    description: 'A rule with field comparison operators',
    condition: {
      structured: {
        operator: 'AND',
        conditions: [
          {
            structured: {
              operator: 'GREATER_THAN',
              field: 'data.value',
              value: 100
            }
          },
          {
            structured: {
              operator: 'EQUALS',
              field: 'data.unit',
              value: 'steps'
            }
          }
        ]
      }
    }
  }),

  /**
   * Rule with a contains operator.
   */
  containsOperator: createBaseRuleFixture({
    id: 'rule-contains-operator',
    name: 'Contains Operator Rule',
    description: 'A rule with a contains operator',
    eventType: EventType.PROFILE_UPDATED,
    journey: EventJourney.CROSS_JOURNEY,
    condition: {
      structured: {
        operator: 'CONTAINS',
        field: 'data.updatedFields',
        value: 'healthPreferences'
      }
    }
  })
};

/**
 * Collection of rule fixtures for different action types.
 * 
 * These fixtures test various action types that can be triggered when a rule condition is met.
 */
export const actionTypeRules = {
  /**
   * Rule that awards XP points.
   */
  awardXp: createBaseRuleFixture({
    id: 'rule-award-xp',
    name: 'Award XP Rule',
    description: 'A rule that awards XP points',
    action: {
      type: RuleActionType.AWARD_XP,
      value: 50
    }
  }),

  /**
   * Rule that progresses an achievement.
   */
  progressAchievement: createBaseRuleFixture({
    id: 'rule-progress-achievement',
    name: 'Progress Achievement Rule',
    description: 'A rule that progresses an achievement',
    action: {
      type: RuleActionType.PROGRESS_ACHIEVEMENT,
      achievementId: 'achievement-steps-goal',
      value: 1
    }
  }),

  /**
   * Rule that progresses a quest.
   */
  progressQuest: createBaseRuleFixture({
    id: 'rule-progress-quest',
    name: 'Progress Quest Rule',
    description: 'A rule that progresses a quest',
    action: {
      type: RuleActionType.PROGRESS_QUEST,
      questId: 'quest-daily-activity',
      value: 1
    }
  }),

  /**
   * Rule that grants a reward.
   */
  grantReward: createBaseRuleFixture({
    id: 'rule-grant-reward',
    name: 'Grant Reward Rule',
    description: 'A rule that grants a reward',
    action: {
      type: RuleActionType.GRANT_REWARD,
      rewardId: 'reward-premium-content'
    }
  }),

  /**
   * Rule that sends a notification.
   */
  sendNotification: createBaseRuleFixture({
    id: 'rule-send-notification',
    name: 'Send Notification Rule',
    description: 'A rule that sends a notification',
    action: {
      type: RuleActionType.SEND_NOTIFICATION,
      message: 'Congratulations on reaching your health goal!'
    }
  }),

  /**
   * Rule that unlocks a feature.
   */
  unlockFeature: createBaseRuleFixture({
    id: 'rule-unlock-feature',
    name: 'Unlock Feature Rule',
    description: 'A rule that unlocks a feature',
    action: {
      type: RuleActionType.UNLOCK_FEATURE,
      feature: 'advanced-health-insights'
    }
  }),

  /**
   * Rule with multiple actions.
   */
  multipleActions: createBaseRuleFixture({
    id: 'rule-multiple-actions',
    name: 'Multiple Actions Rule',
    description: 'A rule that performs multiple actions',
    action: [
      {
        type: RuleActionType.AWARD_XP,
        value: 100
      },
      {
        type: RuleActionType.PROGRESS_ACHIEVEMENT,
        achievementId: 'achievement-health-enthusiast',
        value: 1
      },
      {
        type: RuleActionType.SEND_NOTIFICATION,
        message: 'You\'ve made great progress on your health journey!'
      }
    ]
  })
};

/**
 * Collection of journey-specific rule fixtures.
 * 
 * These fixtures test rules that are specific to each journey (Health, Care, Plan)
 * and cross-journey rules that apply to multiple journeys.
 */
export const journeySpecificRules = {
  /**
   * Health journey rule for step tracking.
   */
  healthStepsRule: createBaseRuleFixture({
    id: 'rule-health-steps',
    name: 'Daily Steps Goal Rule',
    description: 'A rule that tracks daily steps goal achievement',
    eventType: EventType.HEALTH_METRIC_RECORDED,
    journey: EventJourney.HEALTH,
    condition: {
      structured: {
        operator: 'AND',
        conditions: [
          { expression: 'event.data.metricType === "STEPS"' },
          { expression: 'event.data.value >= 10000' }
        ]
      }
    },
    action: [
      {
        type: RuleActionType.AWARD_XP,
        value: 50
      },
      {
        type: RuleActionType.PROGRESS_ACHIEVEMENT,
        achievementId: 'achievement-steps-goal',
        value: 1
      }
    ]
  }),

  /**
   * Health journey rule for sleep tracking.
   */
  healthSleepRule: createBaseRuleFixture({
    id: 'rule-health-sleep',
    name: 'Healthy Sleep Rule',
    description: 'A rule that tracks healthy sleep patterns',
    eventType: EventType.HEALTH_METRIC_RECORDED,
    journey: EventJourney.HEALTH,
    condition: {
      structured: {
        operator: 'AND',
        conditions: [
          { expression: 'event.data.metricType === "SLEEP"' },
          { expression: 'event.data.value >= 7' },
          { expression: 'event.data.value <= 9' }
        ]
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      value: 30
    }
  }),

  /**
   * Care journey rule for appointment attendance.
   */
  careAppointmentRule: createBaseRuleFixture({
    id: 'rule-care-appointment',
    name: 'Appointment Attendance Rule',
    description: 'A rule that rewards attending medical appointments',
    eventType: EventType.APPOINTMENT_ATTENDED,
    journey: EventJourney.CARE,
    condition: {
      expression: 'true' // Always trigger for any attended appointment
    },
    action: [
      {
        type: RuleActionType.AWARD_XP,
        value: 75
      },
      {
        type: RuleActionType.PROGRESS_ACHIEVEMENT,
        achievementId: 'achievement-appointment-keeper',
        value: 1
      }
    ]
  }),

  /**
   * Care journey rule for medication adherence.
   */
  careMedicationRule: createBaseRuleFixture({
    id: 'rule-care-medication',
    name: 'Medication Adherence Rule',
    description: 'A rule that tracks medication adherence',
    eventType: EventType.MEDICATION_ADHERENCE_STREAK,
    journey: EventJourney.CARE,
    condition: {
      expression: 'event.data.streakCount >= 7' // One week streak
    },
    action: [
      {
        type: RuleActionType.AWARD_XP,
        value: 100
      },
      {
        type: RuleActionType.PROGRESS_ACHIEVEMENT,
        achievementId: 'achievement-medication-adherence',
        value: 1
      },
      {
        type: RuleActionType.SEND_NOTIFICATION,
        message: 'Congratulations on maintaining your medication schedule for a week!'
      }
    ]
  }),

  /**
   * Plan journey rule for claim submission.
   */
  planClaimRule: createBaseRuleFixture({
    id: 'rule-plan-claim',
    name: 'Claim Submission Rule',
    description: 'A rule that rewards submitting insurance claims',
    eventType: EventType.CLAIM_SUBMITTED,
    journey: EventJourney.PLAN,
    condition: {
      expression: 'event.data.documentCount >= 1' // At least one document uploaded
    },
    action: [
      {
        type: RuleActionType.AWARD_XP,
        value: 40
      },
      {
        type: RuleActionType.PROGRESS_ACHIEVEMENT,
        achievementId: 'achievement-claim-master',
        value: 1
      }
    ]
  }),

  /**
   * Plan journey rule for benefit utilization.
   */
  planBenefitRule: createBaseRuleFixture({
    id: 'rule-plan-benefit',
    name: 'Benefit Utilization Rule',
    description: 'A rule that tracks insurance benefit utilization',
    eventType: EventType.BENEFIT_UTILIZED,
    journey: EventJourney.PLAN,
    condition: {
      structured: {
        operator: 'AND',
        conditions: [
          { expression: 'event.data.benefitType === "WELLNESS"' },
          { expression: 'event.data.value > 0' }
        ]
      }
    },
    action: {
      type: RuleActionType.AWARD_XP,
      value: 25
    }
  }),

  /**
   * Cross-journey rule for profile completion.
   */
  crossJourneyProfileRule: createBaseRuleFixture({
    id: 'rule-cross-journey-profile',
    name: 'Profile Completion Rule',
    description: 'A rule that rewards completing the user profile',
    eventType: EventType.PROFILE_COMPLETED,
    journey: EventJourney.CROSS_JOURNEY,
    condition: {
      expression: 'true' // Always trigger for profile completion
    },
    action: [
      {
        type: RuleActionType.AWARD_XP,
        value: 200
      },
      {
        type: RuleActionType.UNLOCK_FEATURE,
        feature: 'personalized-recommendations'
      }
    ]
  }),

  /**
   * Cross-journey rule for daily login streak.
   */
  crossJourneyLoginRule: createBaseRuleFixture({
    id: 'rule-cross-journey-login',
    name: 'Daily Login Streak Rule',
    description: 'A rule that rewards daily login streaks',
    eventType: EventType.DAILY_LOGIN,
    journey: EventJourney.CROSS_JOURNEY,
    condition: {
      expression: 'event.data.streakCount % 7 === 0' // Every 7 days
    },
    action: {
      type: RuleActionType.AWARD_XP,
      value: 50
    }
  })
};

/**
 * Collection of rule fixtures for testing rule priority and conflict resolution.
 * 
 * These fixtures have overlapping conditions but different priorities to test
 * how the rule engine handles rule conflicts and prioritization.
 */
export const priorityRules = {
  /**
   * High priority rule.
   */
  highPriority: createBaseRuleFixture({
    id: 'rule-high-priority',
    name: 'High Priority Rule',
    description: 'A rule with high priority',
    priority: 10, // Lower number = higher priority
    condition: {
      expression: 'event.data.value > 100'
    },
    action: {
      type: RuleActionType.AWARD_XP,
      value: 100
    }
  }),

  /**
   * Medium priority rule.
   */
  mediumPriority: createBaseRuleFixture({
    id: 'rule-medium-priority',
    name: 'Medium Priority Rule',
    description: 'A rule with medium priority',
    priority: 50,
    condition: {
      expression: 'event.data.value > 100'
    },
    action: {
      type: RuleActionType.AWARD_XP,
      value: 50
    }
  }),

  /**
   * Low priority rule.
   */
  lowPriority: createBaseRuleFixture({
    id: 'rule-low-priority',
    name: 'Low Priority Rule',
    description: 'A rule with low priority',
    priority: 100,
    condition: {
      expression: 'event.data.value > 100'
    },
    action: {
      type: RuleActionType.AWARD_XP,
      value: 25
    }
  })
};

/**
 * Collection of rule fixtures for testing rule status.
 * 
 * These fixtures have different active states to test how the rule engine
 * handles active and inactive rules.
 */
export const statusRules = {
  /**
   * Active rule.
   */
  activeRule: createBaseRuleFixture({
    id: 'rule-active',
    name: 'Active Rule',
    description: 'A rule that is active',
    isActive: true
  }),

  /**
   * Inactive rule.
   */
  inactiveRule: createBaseRuleFixture({
    id: 'rule-inactive',
    name: 'Inactive Rule',
    description: 'A rule that is inactive',
    isActive: false
  })
};

/**
 * Collection of all rule fixtures for easy access.
 */
export const allRuleFixtures = {
  ...simpleConditionRules,
  ...complexConditionRules,
  ...actionTypeRules,
  ...journeySpecificRules,
  ...priorityRules,
  ...statusRules
};

/**
 * Helper function to get a rule fixture by ID.
 * 
 * @param id - The ID of the rule fixture to retrieve
 * @returns The rule fixture with the specified ID, or undefined if not found
 */
export const getRuleFixtureById = (id: string) => {
  return Object.values(allRuleFixtures).find(rule => rule.id === id);
};

/**
 * Helper function to get all rule fixtures for a specific journey.
 * 
 * @param journey - The journey to filter rules by
 * @returns An array of rule fixtures for the specified journey
 */
export const getRuleFixturesByJourney = (journey: EventJourney) => {
  return Object.values(allRuleFixtures).filter(rule => rule.journey === journey);
};

/**
 * Helper function to get all rule fixtures for a specific event type.
 * 
 * @param eventType - The event type to filter rules by
 * @returns An array of rule fixtures for the specified event type
 */
export const getRuleFixturesByEventType = (eventType: EventType) => {
  return Object.values(allRuleFixtures).filter(rule => rule.eventType === eventType);
};