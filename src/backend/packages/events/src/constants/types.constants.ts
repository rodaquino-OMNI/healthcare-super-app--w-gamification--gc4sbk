/**
 * @file types.constants.ts
 * @description Defines a comprehensive set of strongly-typed event type identifiers for all journeys
 * (Health, Care, Plan) and cross-cutting concerns (User, Gamification). This file ensures consistent
 * event type naming across the platform, enabling type-safe event publishing and handling.
 */

/**
 * Health journey event types related to health metrics, goals, insights, and device connections.
 * These events are triggered by user actions in the Health journey and processed by the gamification engine.
 */
export enum HealthEventTypes {
  /**
   * Triggered when a user records a new health metric (weight, heart rate, blood pressure, etc.)
   * Expected data: { metricType: string, value: number, unit: string, timestamp: string, deviceId?: string }
   */
  METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',

  /**
   * Triggered when a user achieves a health goal (steps target, weight goal, etc.)
   * Expected data: { goalId: string, goalType: string, targetValue: number, achievedValue: number, unit: string }
   */
  GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',

  /**
   * Triggered when a user creates a new health goal
   * Expected data: { goalId: string, goalType: string, targetValue: number, startValue: number, unit: string, deadline?: string }
   */
  GOAL_CREATED = 'HEALTH_GOAL_CREATED',

  /**
   * Triggered when a user makes progress towards a health goal
   * Expected data: { goalId: string, currentValue: number, targetValue: number, progressPercentage: number }
   */
  GOAL_PROGRESS = 'HEALTH_GOAL_PROGRESS',

  /**
   * Triggered when the system generates a health insight based on user data
   * Expected data: { insightId: string, insightType: string, relatedMetrics: string[], severity: string }
   */
  INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',

  /**
   * Triggered when a user connects a new health device (smartwatch, scale, etc.)
   * Expected data: { deviceId: string, deviceType: string, manufacturer: string, model: string }
   */
  DEVICE_CONNECTED = 'HEALTH_DEVICE_CONNECTED',

  /**
   * Triggered when a health device syncs data with the platform
   * Expected data: { deviceId: string, syncTimestamp: string, dataPoints: number, syncStatus: string }
   */
  DEVICE_SYNCED = 'HEALTH_DEVICE_SYNCED',

  /**
   * Triggered when a user completes a health assessment
   * Expected data: { assessmentId: string, assessmentType: string, score: number, completionTime: string }
   */
  ASSESSMENT_COMPLETED = 'HEALTH_ASSESSMENT_COMPLETED',
}

/**
 * Care journey event types related to appointments, medications, telemedicine, and care plans.
 * These events are triggered by user actions in the Care journey and processed by the gamification engine.
 */
export enum CareEventTypes {
  /**
   * Triggered when a user books a medical appointment
   * Expected data: { appointmentId: string, providerId: string, specialtyId: string, datetime: string, location?: string }
   */
  APPOINTMENT_BOOKED = 'CARE_APPOINTMENT_BOOKED',

  /**
   * Triggered when a user checks in for an appointment
   * Expected data: { appointmentId: string, checkInTime: string, waitingTime?: number }
   */
  APPOINTMENT_CHECKED_IN = 'CARE_APPOINTMENT_CHECKED_IN',

  /**
   * Triggered when an appointment is completed
   * Expected data: { appointmentId: string, duration: number, followUpNeeded: boolean }
   */
  APPOINTMENT_COMPLETED = 'CARE_APPOINTMENT_COMPLETED',

  /**
   * Triggered when a user cancels an appointment
   * Expected data: { appointmentId: string, cancellationReason?: string, rescheduled: boolean }
   */
  APPOINTMENT_CANCELLED = 'CARE_APPOINTMENT_CANCELLED',

  /**
   * Triggered when a user logs taking medication
   * Expected data: { medicationId: string, dosage: number, unit: string, timestamp: string }
   */
  MEDICATION_TAKEN = 'CARE_MEDICATION_TAKEN',

  /**
   * Triggered when a user skips a scheduled medication
   * Expected data: { medicationId: string, skippedAt: string, reason?: string }
   */
  MEDICATION_SKIPPED = 'CARE_MEDICATION_SKIPPED',

  /**
   * Triggered when a user adds a new medication to their regimen
   * Expected data: { medicationId: string, name: string, dosage: number, frequency: string, startDate: string }
   */
  MEDICATION_ADDED = 'CARE_MEDICATION_ADDED',

  /**
   * Triggered when a user joins a telemedicine session
   * Expected data: { sessionId: string, providerId: string, startTime: string, deviceType: string }
   */
  TELEMEDICINE_JOINED = 'CARE_TELEMEDICINE_JOINED',

  /**
   * Triggered when a telemedicine session is completed
   * Expected data: { sessionId: string, duration: number, rating?: number, notes?: string }
   */
  TELEMEDICINE_COMPLETED = 'CARE_TELEMEDICINE_COMPLETED',

  /**
   * Triggered when a care plan is created or updated
   * Expected data: { planId: string, planType: string, startDate: string, endDate?: string, goals: number }
   */
  CARE_PLAN_UPDATED = 'CARE_PLAN_UPDATED',

  /**
   * Triggered when a user makes progress on their care plan
   * Expected data: { planId: string, completedItems: number, totalItems: number, progressPercentage: number }
   */
  CARE_PLAN_PROGRESS = 'CARE_PLAN_PROGRESS',
}

/**
 * Plan journey event types related to insurance claims, benefits, coverage, and plan management.
 * These events are triggered by user actions in the Plan journey and processed by the gamification engine.
 */
export enum PlanEventTypes {
  /**
   * Triggered when a user submits an insurance claim
   * Expected data: { claimId: string, claimType: string, amount: number, serviceDate: string, documents: number }
   */
  CLAIM_SUBMITTED = 'PLAN_CLAIM_SUBMITTED',

  /**
   * Triggered when a claim status changes (approved, rejected, in review)
   * Expected data: { claimId: string, status: string, updatedAt: string, amount?: number, reason?: string }
   */
  CLAIM_STATUS_CHANGED = 'PLAN_CLAIM_STATUS_CHANGED',

  /**
   * Triggered when a user uploads documents for a claim
   * Expected data: { claimId: string, documentIds: string[], documentTypes: string[], uploadedAt: string }
   */
  CLAIM_DOCUMENTS_UPLOADED = 'PLAN_CLAIM_DOCUMENTS_UPLOADED',

  /**
   * Triggered when a user utilizes a benefit
   * Expected data: { benefitId: string, benefitType: string, usageDate: string, value: number }
   */
  BENEFIT_UTILIZED = 'PLAN_BENEFIT_UTILIZED',

  /**
   * Triggered when a user views their coverage details
   * Expected data: { coverageType: string, viewedAt: string, detailsViewed: string[] }
   */
  COVERAGE_VIEWED = 'PLAN_COVERAGE_VIEWED',

  /**
   * Triggered when a user compares different insurance plans
   * Expected data: { planIds: string[], comparisonCategories: string[], timeSpent: number }
   */
  PLANS_COMPARED = 'PLAN_PLANS_COMPARED',

  /**
   * Triggered when a user selects or changes their insurance plan
   * Expected data: { planId: string, previousPlanId?: string, effectiveDate: string, annualValue: number }
   */
  PLAN_SELECTED = 'PLAN_PLAN_SELECTED',

  /**
   * Triggered when a user redeems a reward using their points
   * Expected data: { rewardId: string, rewardType: string, pointsUsed: number, value: number }
   */
  REWARD_REDEEMED = 'PLAN_REWARD_REDEEMED',
}

/**
 * User-related event types that apply across all journeys.
 * These events are related to user account actions, profile updates, and preferences.
 */
export enum UserEventTypes {
  /**
   * Triggered when a user completes their profile
   * Expected data: { completedSections: string[], completionPercentage: number, missingFields?: string[] }
   */
  PROFILE_COMPLETED = 'USER_PROFILE_COMPLETED',

  /**
   * Triggered when a user updates their profile information
   * Expected data: { updatedFields: string[], previousValues?: Record<string, any>, newValues?: Record<string, any> }
   */
  PROFILE_UPDATED = 'USER_PROFILE_UPDATED',

  /**
   * Triggered when a user logs in to the application
   * Expected data: { loginMethod: string, deviceType: string, location?: string, timestamp: string }
   */
  LOGGED_IN = 'USER_LOGGED_IN',

  /**
   * Triggered when a user completes the onboarding process
   * Expected data: { completedSteps: string[], timeSpent: number, selectedJourneys: string[] }
   */
  ONBOARDING_COMPLETED = 'USER_ONBOARDING_COMPLETED',

  /**
   * Triggered when a user updates their notification preferences
   * Expected data: { channels: Record<string, boolean>, categories: Record<string, boolean> }
   */
  NOTIFICATION_PREFERENCES_UPDATED = 'USER_NOTIFICATION_PREFERENCES_UPDATED',

  /**
   * Triggered when a user connects a social account
   * Expected data: { provider: string, connectedAt: string, permissions: string[] }
   */
  SOCIAL_ACCOUNT_CONNECTED = 'USER_SOCIAL_ACCOUNT_CONNECTED',

  /**
   * Triggered when a user invites another user to the platform
   * Expected data: { inviteeEmail: string, invitationMethod: string, message?: string }
   */
  INVITATION_SENT = 'USER_INVITATION_SENT',

  /**
   * Triggered when a user accepts an invitation
   * Expected data: { inviterId: string, invitationId: string, registrationDate: string }
   */
  INVITATION_ACCEPTED = 'USER_INVITATION_ACCEPTED',
}

/**
 * Gamification-related event types that are generated by the gamification engine.
 * These events represent outcomes of the gamification process and are typically consumed by the notification service.
 */
export enum GamificationEventTypes {
  /**
   * Triggered when a user earns XP points
   * Expected data: { amount: number, sourceEvent: string, newTotal: number, journey?: string }
   */
  XP_EARNED = 'GAMIFICATION_XP_EARNED',

  /**
   * Triggered when a user levels up
   * Expected data: { oldLevel: number, newLevel: number, xpThreshold: number, rewards?: any[] }
   */
  LEVEL_UP = 'GAMIFICATION_LEVEL_UP',

  /**
   * Triggered when a user unlocks an achievement
   * Expected data: { achievementId: string, achievementName: string, description: string, xpAwarded: number }
   */
  ACHIEVEMENT_UNLOCKED = 'GAMIFICATION_ACHIEVEMENT_UNLOCKED',

  /**
   * Triggered when a user makes progress towards an achievement
   * Expected data: { achievementId: string, currentProgress: number, threshold: number, progressPercentage: number }
   */
  ACHIEVEMENT_PROGRESS = 'GAMIFICATION_ACHIEVEMENT_PROGRESS',

  /**
   * Triggered when a user completes a quest
   * Expected data: { questId: string, questName: string, completedAt: string, rewards: any[] }
   */
  QUEST_COMPLETED = 'GAMIFICATION_QUEST_COMPLETED',

  /**
   * Triggered when a user's position changes on a leaderboard
   * Expected data: { leaderboardId: string, oldPosition?: number, newPosition: number, score: number }
   */
  LEADERBOARD_POSITION_CHANGED = 'GAMIFICATION_LEADERBOARD_POSITION_CHANGED',

  /**
   * Triggered when a user earns a reward
   * Expected data: { rewardId: string, rewardType: string, value: number, expiresAt?: string }
   */
  REWARD_EARNED = 'GAMIFICATION_REWARD_EARNED',

  /**
   * Triggered when a streak (consecutive actions) is updated
   * Expected data: { streakType: string, currentCount: number, lastUpdated: string, nextDeadline?: string }
   */
  STREAK_UPDATED = 'GAMIFICATION_STREAK_UPDATED',
}

/**
 * Union type of all event types for type-safe event handling.
 * This allows for exhaustive type checking when processing events.
 */
export type EventType =
  | HealthEventTypes
  | CareEventTypes
  | PlanEventTypes
  | UserEventTypes
  | GamificationEventTypes;

/**
 * Mapping of journey names to their respective event type enums.
 * This allows for dynamic event type lookup based on journey.
 */
export const JourneyEventTypes = {
  health: HealthEventTypes,
  care: CareEventTypes,
  plan: PlanEventTypes,
  user: UserEventTypes,
  gamification: GamificationEventTypes,
};

/**
 * Type guard to check if an event type belongs to a specific journey.
 * 
 * @param eventType The event type to check
 * @param journey The journey to check against
 * @returns True if the event type belongs to the specified journey
 * 
 * @example
 * if (isJourneyEvent(event.type, 'health')) {
 *   // Handle health journey event
 * }
 */
export function isJourneyEvent(eventType: EventType, journey: keyof typeof JourneyEventTypes): boolean {
  const journeyEvents = Object.values(JourneyEventTypes[journey]);
  return journeyEvents.includes(eventType as any);
}

/**
 * Gets all event types for a specific journey.
 * 
 * @param journey The journey to get event types for
 * @returns Array of event types for the specified journey
 * 
 * @example
 * const healthEvents = getJourneyEventTypes('health');
 * // Returns all health journey event types
 */
export function getJourneyEventTypes(journey: keyof typeof JourneyEventTypes): string[] {
  return Object.values(JourneyEventTypes[journey]);
}