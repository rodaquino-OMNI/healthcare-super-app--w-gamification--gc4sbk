/**
 * @file Event type constants for the AUSTA SuperApp.
 * 
 * This file defines a comprehensive set of strongly-typed event type identifiers
 * for all journeys (Health, Care, Plan) and cross-cutting concerns (User, Gamification).
 * These constants ensure consistent event type naming across the platform, enabling
 * type-safe event publishing and handling.
 * 
 * @module events/constants/types
 */

/**
 * Health Journey event types.
 * 
 * These events are triggered by user actions and system processes within the Health Journey,
 * including health metric recording, goal management, device integration, and health insights.
 */
export enum HealthEventTypes {
  /**
   * Triggered when a user records a health metric (e.g., weight, blood pressure, heart rate).
   * Expected data: metricType, value, unit, source, timestamp
   */
  METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',

  /**
   * Triggered when a user creates a new health goal.
   * Expected data: goalId, goalType, targetValue, unit, period
   */
  GOAL_CREATED = 'HEALTH_GOAL_CREATED',

  /**
   * Triggered when a user updates an existing health goal.
   * Expected data: goalId, goalType, targetValue, unit, period
   */
  GOAL_UPDATED = 'HEALTH_GOAL_UPDATED',

  /**
   * Triggered when a user achieves a health goal.
   * Expected data: goalId, goalType, completionPercentage, isFirstTimeAchievement
   */
  GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',

  /**
   * Triggered when a user maintains a streak for a recurring health goal.
   * Expected data: goalId, goalType, streakCount
   */
  GOAL_STREAK_MAINTAINED = 'HEALTH_GOAL_STREAK_MAINTAINED',

  /**
   * Triggered when a user connects a new health device (e.g., smartwatch, glucose monitor).
   * Expected data: deviceId, deviceType, manufacturer
   */
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',

  /**
   * Triggered when data is synchronized from a connected health device.
   * Expected data: deviceId, deviceType, manufacturer, metricCount
   */
  DEVICE_SYNCED = 'DEVICE_SYNCED',

  /**
   * Triggered when a user records a medical event in their health history.
   * Expected data: eventType, description, date, providerId
   */
  MEDICAL_EVENT_RECORDED = 'MEDICAL_EVENT_RECORDED',

  /**
   * Triggered when the system generates a health insight based on user data.
   * Expected data: insightType, description, relatedMetrics
   */
  INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',

  /**
   * Triggered when a user completes a health assessment.
   * Expected data: assessmentType, score, recommendations
   */
  ASSESSMENT_COMPLETED = 'HEALTH_ASSESSMENT_COMPLETED'
}

/**
 * Care Journey event types.
 * 
 * These events are triggered by user actions and system processes within the Care Journey,
 * including appointment management, medication tracking, telemedicine sessions, and treatment plans.
 */
export enum CareEventTypes {
  /**
   * Triggered when a user books a medical appointment.
   * Expected data: appointmentId, appointmentType, providerId, isFirstAppointment
   */
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',

  /**
   * Triggered when a user attends a scheduled appointment.
   * Expected data: appointmentId, appointmentType, providerId
   */
  APPOINTMENT_ATTENDED = 'APPOINTMENT_ATTENDED',

  /**
   * Triggered when a user cancels a scheduled appointment.
   * Expected data: appointmentId, appointmentType, providerId, cancellationReason
   */
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',

  /**
   * Triggered when a user adds a new medication to their list.
   * Expected data: medicationId, medicationName
   */
  MEDICATION_ADDED = 'MEDICATION_ADDED',

  /**
   * Triggered when a user logs taking a medication.
   * Expected data: medicationId, medicationName, takenOnTime
   */
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',

  /**
   * Triggered when a user maintains a streak of medication adherence.
   * Expected data: medicationId, medicationName, streakCount
   */
  MEDICATION_ADHERENCE_STREAK = 'MEDICATION_ADHERENCE_STREAK',

  /**
   * Triggered when a user starts a telemedicine session.
   * Expected data: sessionId, providerId, isFirstSession
   */
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',

  /**
   * Triggered when a user completes a telemedicine session.
   * Expected data: sessionId, providerId, durationMinutes
   */
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',

  /**
   * Triggered when a treatment plan is created for a user.
   * Expected data: planId, planType
   */
  TREATMENT_PLAN_CREATED = 'TREATMENT_PLAN_CREATED',

  /**
   * Triggered when a user makes progress on a treatment plan.
   * Expected data: planId, planType, progressPercentage
   */
  TREATMENT_PLAN_PROGRESS = 'TREATMENT_PLAN_PROGRESS',

  /**
   * Triggered when a user completes a treatment plan.
   * Expected data: planId, planType, completedOnSchedule
   */
  TREATMENT_PLAN_COMPLETED = 'TREATMENT_PLAN_COMPLETED',

  /**
   * Triggered when a user uses the symptom checker feature.
   * Expected data: symptoms, recommendedActions
   */
  SYMPTOM_CHECKER_USED = 'SYMPTOM_CHECKER_USED',

  /**
   * Triggered when a user rates a healthcare provider.
   * Expected data: providerId, rating, feedback
   */
  PROVIDER_RATED = 'PROVIDER_RATED'
}

/**
 * Plan Journey event types.
 * 
 * These events are triggered by user actions and system processes within the Plan Journey,
 * including claim management, benefit utilization, and plan selection.
 */
export enum PlanEventTypes {
  /**
   * Triggered when a user submits an insurance claim.
   * Expected data: claimId, claimType, amount
   */
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',

  /**
   * Triggered when an insurance claim is approved.
   * Expected data: claimId, claimType, amount
   */
  CLAIM_APPROVED = 'CLAIM_APPROVED',

  /**
   * Triggered when a user uploads a document related to a claim.
   * Expected data: claimId, documentCount
   */
  CLAIM_DOCUMENT_UPLOADED = 'CLAIM_DOCUMENT_UPLOADED',

  /**
   * Triggered when a user utilizes a benefit from their insurance plan.
   * Expected data: benefitId, benefitType, value
   */
  BENEFIT_UTILIZED = 'BENEFIT_UTILIZED',

  /**
   * Triggered when a user selects an insurance plan.
   * Expected data: planId, planType, isUpgrade
   */
  PLAN_SELECTED = 'PLAN_SELECTED',

  /**
   * Triggered when a user compares multiple insurance plans.
   * Expected data: planId, planType, comparedPlanIds
   */
  PLAN_COMPARED = 'PLAN_COMPARED',

  /**
   * Triggered when a user renews their insurance plan.
   * Expected data: planId, planType, isUpgrade
   */
  PLAN_RENEWED = 'PLAN_RENEWED',

  /**
   * Triggered when a user reviews their coverage details.
   * Expected data: planId, coverageTypes
   */
  COVERAGE_REVIEWED = 'COVERAGE_REVIEWED',

  /**
   * Triggered when a user redeems a reward.
   * Expected data: rewardId, rewardType, value
   */
  REWARD_REDEEMED = 'REWARD_REDEEMED'
}

/**
 * User-related event types.
 * 
 * These events are triggered by user actions related to their profile and account management,
 * including profile updates, feedback, and survey completion.
 */
export enum UserEventTypes {
  /**
   * Triggered when a user completes their profile with all required information.
   * Expected data: completedSections, percentComplete
   */
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',

  /**
   * Triggered when a user updates their profile information.
   * Expected data: updatedFields
   */
  PROFILE_UPDATED = 'PROFILE_UPDATED',

  /**
   * Triggered when a user provides feedback on the app or a specific feature.
   * Expected data: feedbackType, rating, comments, featureId
   */
  FEEDBACK_PROVIDED = 'FEEDBACK_PROVIDED',

  /**
   * Triggered when a user completes a survey.
   * Expected data: surveyId, surveyType, completionTime
   */
  SURVEY_COMPLETED = 'SURVEY_COMPLETED',

  /**
   * Triggered when a user uses a specific feature in the app.
   * Expected data: featureId, featureName, usageDuration
   */
  APP_FEATURE_USED = 'APP_FEATURE_USED',

  /**
   * Triggered when a user logs in to the app.
   * Expected data: loginMethod, deviceType
   */
  DAILY_LOGIN = 'DAILY_LOGIN',

  /**
   * Triggered when a user is active in the app at least once during a week.
   * Expected data: activeDaysCount, totalSessionsCount
   */
  WEEKLY_ACTIVE = 'WEEKLY_ACTIVE',

  /**
   * Triggered when a user is active in the app at least once during a month.
   * Expected data: activeDaysCount, totalSessionsCount
   */
  MONTHLY_ACTIVE = 'MONTHLY_ACTIVE',

  /**
   * Triggered when a user sends a referral to another potential user.
   * Expected data: referralMethod, referralCode
   */
  REFERRAL_SENT = 'REFERRAL_SENT',

  /**
   * Triggered when a referred user completes the registration process.
   * Expected data: referralCode, referrerId
   */
  REFERRAL_COMPLETED = 'REFERRAL_COMPLETED'
}

/**
 * Gamification event types.
 * 
 * These events are triggered by the gamification engine in response to user actions,
 * including achievement unlocking, quest completion, and level progression.
 */
export enum GamificationEventTypes {
  /**
   * Triggered when a user unlocks an achievement.
   * Expected data: achievementId, achievementTitle, achievementDescription, xpEarned
   */
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',

  /**
   * Triggered when a user completes a quest.
   * Expected data: questId, questTitle, xpEarned, rewards
   */
  QUEST_COMPLETED = 'QUEST_COMPLETED',

  /**
   * Triggered when a user levels up in the gamification system.
   * Expected data: newLevel, previousLevel, totalXp, unlockedRewards
   */
  LEVEL_UP = 'LEVEL_UP',

  /**
   * Triggered when a user earns XP from any action.
   * Expected data: amount, source, description
   */
  XP_EARNED = 'XP_EARNED'
}

/**
 * Journey identifiers for event categorization.
 * 
 * These constants are used to categorize events by their source journey,
 * enabling journey-specific event processing and analytics.
 */
export enum JourneyTypes {
  /** Health journey - "Minha Saúde" */
  HEALTH = 'health',
  
  /** Care journey - "Cuidar-me Agora" */
  CARE = 'care',
  
  /** Plan journey - "Meu Plano & Benefícios" */
  PLAN = 'plan',
  
  /** Events that span multiple journeys or are not journey-specific */
  CROSS_JOURNEY = 'cross-journey'
}

/**
 * Union type of all event type enums for type-safe event handling.
 * 
 * This type allows for comprehensive type checking when working with events
 * from any journey or category.
 */
export type EventTypes =
  | HealthEventTypes
  | CareEventTypes
  | PlanEventTypes
  | UserEventTypes
  | GamificationEventTypes;

/**
 * Maps journey types to their corresponding event type enums.
 * 
 * This mapping enables journey-specific event type validation and processing.
 */
export const JOURNEY_EVENT_TYPES = {
  [JourneyTypes.HEALTH]: HealthEventTypes,
  [JourneyTypes.CARE]: CareEventTypes,
  [JourneyTypes.PLAN]: PlanEventTypes,
  [JourneyTypes.CROSS_JOURNEY]: {
    ...UserEventTypes,
    ...GamificationEventTypes
  }
};

/**
 * All event types as a flat object for easy lookup.
 * 
 * This constant provides a convenient way to access all event types
 * without needing to know which specific enum they belong to.
 */
export const ALL_EVENT_TYPES = {
  ...HealthEventTypes,
  ...CareEventTypes,
  ...PlanEventTypes,
  ...UserEventTypes,
  ...GamificationEventTypes
};

/**
 * Checks if a given string is a valid event type.
 * 
 * @param type - The string to check
 * @returns True if the string is a valid event type, false otherwise
 */
export function isValidEventType(type: string): type is EventTypes {
  return Object.values(ALL_EVENT_TYPES).includes(type as EventTypes);
}

/**
 * Gets the journey associated with a specific event type.
 * 
 * @param eventType - The event type to check
 * @returns The journey type associated with the event, or CROSS_JOURNEY if not found
 */
export function getJourneyForEventType(eventType: EventTypes | string): JourneyTypes {
  // Check Health journey events
  if (Object.values(HealthEventTypes).includes(eventType as HealthEventTypes)) {
    return JourneyTypes.HEALTH;
  }
  
  // Check Care journey events
  if (Object.values(CareEventTypes).includes(eventType as CareEventTypes)) {
    return JourneyTypes.CARE;
  }
  
  // Check Plan journey events
  if (Object.values(PlanEventTypes).includes(eventType as PlanEventTypes)) {
    return JourneyTypes.PLAN;
  }
  
  // Default to cross-journey for user and gamification events
  return JourneyTypes.CROSS_JOURNEY;
}