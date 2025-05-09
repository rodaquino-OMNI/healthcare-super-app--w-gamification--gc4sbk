/**
 * @file types.constants.ts
 * @description Defines a comprehensive set of strongly-typed event type identifiers for all journeys
 * (Health, Care, Plan) and cross-cutting concerns (User, Gamification). This file ensures consistent
 * event type naming across the platform, enabling type-safe event publishing and handling.
 */

import {
  EventType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
  isHealthEventType,
  isCareEventType,
  isPlanEventType,
  isCommonEventType,
  getJourneyForEventType
} from '@austa/interfaces/gamification';

/**
 * Re-export all event types from the interfaces package
 */
export {
  EventType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
  isHealthEventType,
  isCareEventType,
  isPlanEventType,
  isCommonEventType,
  getJourneyForEventType
};

/**
 * Namespace containing all health journey event types.
 * These events are triggered by user actions in the Health journey.
 */
export namespace HealthEvents {
  /**
   * Event triggered when a user records a health metric.
   * @payload {
   *   metricType: string; // Type of metric (e.g., 'HEART_RATE', 'WEIGHT', 'STEPS')
   *   value: number; // Value of the metric
   *   unit: string; // Unit of measurement (e.g., 'bpm', 'kg', 'count')
   *   source?: string; // Source of the metric (e.g., 'MANUAL', 'DEVICE', 'INTEGRATION')
   * }
   */
  export const METRIC_RECORDED = HealthEventType.HEALTH_METRIC_RECORDED;

  /**
   * Event triggered when a user creates a new health goal.
   * @payload {
   *   goalId: string; // ID of the created goal
   *   goalType: string; // Type of goal (e.g., 'STEPS', 'WEIGHT', 'SLEEP')
   *   targetValue: number; // Target value for the goal
   *   unit: string; // Unit of measurement
   *   startDate: string; // ISO date string for goal start
   *   endDate?: string; // Optional ISO date string for goal end
   * }
   */
  export const GOAL_CREATED = HealthEventType.GOAL_CREATED;

  /**
   * Event triggered when a user updates an existing health goal.
   * @payload {
   *   goalId: string; // ID of the updated goal
   *   previousTargetValue?: number; // Previous target value
   *   newTargetValue?: number; // New target value
   *   previousEndDate?: string; // Previous end date
   *   newEndDate?: string; // New end date
   * }
   */
  export const GOAL_UPDATED = HealthEventType.GOAL_UPDATED;

  /**
   * Event triggered when a user achieves a health goal.
   * @payload {
   *   goalId: string; // ID of the achieved goal
   *   goalType: string; // Type of goal
   *   achievedAt: string; // ISO date string when goal was achieved
   *   targetValue: number; // Target value of the goal
   *   actualValue: number; // Actual value achieved
   *   streakCount?: number; // Optional streak count for consecutive achievements
   * }
   */
  export const GOAL_ACHIEVED = HealthEventType.GOAL_ACHIEVED;

  /**
   * Event triggered when a user connects a health device.
   * @payload {
   *   deviceId: string; // ID of the connected device
   *   deviceType: string; // Type of device (e.g., 'SMARTWATCH', 'SCALE', 'GLUCOSE_MONITOR')
   *   connectionTime: string; // ISO date string when device was connected
   *   isFirstConnection: boolean; // Whether this is the first time the device was connected
   *   manufacturer?: string; // Optional device manufacturer
   *   model?: string; // Optional device model
   * }
   */
  export const DEVICE_CONNECTED = HealthEventType.DEVICE_CONNECTED;

  /**
   * Event triggered when a health device syncs data.
   * @payload {
   *   deviceId: string; // ID of the synced device
   *   deviceType: string; // Type of device
   *   syncTime: string; // ISO date string when device was synced
   *   dataTypes: string[]; // Types of data synced (e.g., ['HEART_RATE', 'STEPS'])
   *   recordCount: number; // Number of records synced
   *   syncDuration?: number; // Optional sync duration in milliseconds
   * }
   */
  export const DEVICE_SYNCED = HealthEventType.DEVICE_SYNCED;

  /**
   * Event triggered when a user views a health insight.
   * @payload {
   *   insightId: string; // ID of the viewed insight
   *   insightType: string; // Type of insight (e.g., 'TREND', 'ANOMALY', 'RECOMMENDATION')
   *   viewedAt: string; // ISO date string when insight was viewed
   *   relatedMetrics?: string[]; // Optional related metric types
   *   timeSpent?: number; // Optional time spent viewing in seconds
   * }
   */
  export const INSIGHT_VIEWED = HealthEventType.HEALTH_INSIGHT_VIEWED;

  /**
   * Event triggered when a user records a medical event.
   * @payload {
   *   eventId: string; // ID of the medical event
   *   eventType: string; // Type of event (e.g., 'VACCINATION', 'ALLERGY', 'PROCEDURE')
   *   recordedAt: string; // ISO date string when event was recorded
   *   occurrenceDate: string; // ISO date string when the medical event occurred
   *   provider?: string; // Optional provider information
   *   notes?: string; // Optional notes
   * }
   */
  export const MEDICAL_EVENT_RECORDED = HealthEventType.MEDICAL_EVENT_RECORDED;
}

/**
 * Namespace containing all care journey event types.
 * These events are triggered by user actions in the Care journey.
 */
export namespace CareEvents {
  /**
   * Event triggered when a user books an appointment.
   * @payload {
   *   appointmentId: string; // ID of the booked appointment
   *   appointmentType: string; // Type of appointment (e.g., 'CHECKUP', 'SPECIALIST', 'FOLLOWUP')
   *   providerId: string; // ID of the provider
   *   scheduledAt: string; // ISO date string for appointment time
   *   isFirstAppointment?: boolean; // Whether this is the first appointment with this provider
   *   specialtyArea?: string; // Optional specialty area
   *   location?: string; // Optional location information
   * }
   */
  export const APPOINTMENT_BOOKED = CareEventType.APPOINTMENT_BOOKED;

  /**
   * Event triggered when a user attends an appointment.
   * @payload {
   *   appointmentId: string; // ID of the attended appointment
   *   appointmentType: string; // Type of appointment
   *   providerId: string; // ID of the provider
   *   attendedAt: string; // ISO date string when appointment was attended
   *   duration?: number; // Optional duration in minutes
   *   followupScheduled?: boolean; // Whether a follow-up was scheduled
   * }
   */
  export const APPOINTMENT_ATTENDED = CareEventType.APPOINTMENT_ATTENDED;

  /**
   * Event triggered when a user cancels an appointment.
   * @payload {
   *   appointmentId: string; // ID of the cancelled appointment
   *   appointmentType: string; // Type of appointment
   *   providerId: string; // ID of the provider
   *   cancelledAt: string; // ISO date string when appointment was cancelled
   *   scheduledAt: string; // Original scheduled time
   *   reason?: string; // Optional cancellation reason
   *   rescheduled?: boolean; // Whether the appointment was rescheduled
   * }
   */
  export const APPOINTMENT_CANCELLED = CareEventType.APPOINTMENT_CANCELLED;

  /**
   * Event triggered when a user adds a medication to their profile.
   * @payload {
   *   medicationId: string; // ID of the added medication
   *   medicationName: string; // Name of the medication
   *   dosage: string; // Dosage information
   *   frequency: string; // Frequency information (e.g., 'DAILY', 'TWICE_DAILY')
   *   startDate: string; // ISO date string for medication start
   *   endDate?: string; // Optional ISO date string for medication end
   *   prescribedBy?: string; // Optional prescriber information
   * }
   */
  export const MEDICATION_ADDED = CareEventType.MEDICATION_ADDED;

  /**
   * Event triggered when a user logs taking a medication.
   * @payload {
   *   medicationId: string; // ID of the medication
   *   takenAt: string; // ISO date string when medication was taken
   *   dosage?: string; // Optional dosage information
   *   adherencePercentage?: number; // Optional percentage of adherence to schedule
   *   onSchedule?: boolean; // Whether the medication was taken on schedule
   *   streakDays?: number; // Optional number of consecutive days medication has been taken
   * }
   */
  export const MEDICATION_TAKEN = CareEventType.MEDICATION_TAKEN;

  /**
   * Event triggered when a user logs skipping a medication.
   * @payload {
   *   medicationId: string; // ID of the medication
   *   skippedAt: string; // ISO date string when medication was skipped
   *   reason?: string; // Optional reason for skipping
   *   adherencePercentage?: number; // Optional updated adherence percentage
   * }
   */
  export const MEDICATION_SKIPPED = CareEventType.MEDICATION_SKIPPED;

  /**
   * Event triggered when a user starts a telemedicine session.
   * @payload {
   *   sessionId: string; // ID of the telemedicine session
   *   providerId: string; // ID of the provider
   *   startTime: string; // ISO date string when session started
   *   appointmentId?: string; // Optional related appointment ID
   *   deviceType?: string; // Optional device type used (e.g., 'MOBILE', 'DESKTOP')
   *   connectionQuality?: string; // Optional connection quality information
   * }
   */
  export const TELEMEDICINE_SESSION_STARTED = CareEventType.TELEMEDICINE_SESSION_STARTED;

  /**
   * Event triggered when a user completes a telemedicine session.
   * @payload {
   *   sessionId: string; // ID of the telemedicine session
   *   providerId: string; // ID of the provider
   *   startTime: string; // ISO date string when session started
   *   endTime: string; // ISO date string when session ended
   *   duration: number; // Duration in minutes
   *   specialtyArea?: string; // Optional specialty area
   *   followupScheduled?: boolean; // Whether a follow-up was scheduled
   *   prescriptionIssued?: boolean; // Whether a prescription was issued
   * }
   */
  export const TELEMEDICINE_SESSION_COMPLETED = CareEventType.TELEMEDICINE_SESSION_COMPLETED;

  /**
   * Event triggered when a user checks symptoms.
   * @payload {
   *   checkId: string; // ID of the symptom check
   *   symptoms: string[]; // Array of symptom codes or descriptions
   *   checkedAt: string; // ISO date string when symptoms were checked
   *   severity?: string; // Optional severity level
   *   recommendation?: string; // Optional recommendation provided
   *   followupAction?: string; // Optional follow-up action
   * }
   */
  export const SYMPTOM_CHECKED = CareEventType.SYMPTOM_CHECKED;

  /**
   * Event triggered when a treatment plan is created for a user.
   * @payload {
   *   planId: string; // ID of the treatment plan
   *   condition: string; // Condition being treated
   *   createdAt: string; // ISO date string when plan was created
   *   providerId?: string; // Optional provider ID
   *   duration?: number; // Optional duration in days
   *   steps?: number; // Optional number of steps in the plan
   * }
   */
  export const TREATMENT_PLAN_CREATED = CareEventType.TREATMENT_PLAN_CREATED;

  /**
   * Event triggered when a user completes a treatment plan.
   * @payload {
   *   planId: string; // ID of the treatment plan
   *   condition: string; // Condition that was treated
   *   completedAt: string; // ISO date string when plan was completed
   *   startedAt: string; // ISO date string when plan was started
   *   adherencePercentage?: number; // Optional percentage of adherence to plan
   *   outcome?: string; // Optional outcome information
   * }
   */
  export const TREATMENT_PLAN_COMPLETED = CareEventType.TREATMENT_PLAN_COMPLETED;
}

/**
 * Namespace containing all plan journey event types.
 * These events are triggered by user actions in the Plan journey.
 */
export namespace PlanEvents {
  /**
   * Event triggered when a user views their plan details.
   * @payload {
   *   planId: string; // ID of the viewed plan
   *   viewedAt: string; // ISO date string when plan was viewed
   *   planType: string; // Type of plan
   *   viewDuration?: number; // Optional view duration in seconds
   *   sectionsViewed?: string[]; // Optional sections viewed
   * }
   */
  export const PLAN_VIEWED = PlanEventType.PLAN_VIEWED;

  /**
   * Event triggered when a user views a benefit.
   * @payload {
   *   benefitId: string; // ID of the viewed benefit
   *   benefitType: string; // Type of benefit
   *   viewedAt: string; // ISO date string when benefit was viewed
   *   planId?: string; // Optional related plan ID
   *   viewDuration?: number; // Optional view duration in seconds
   * }
   */
  export const BENEFIT_VIEWED = PlanEventType.BENEFIT_VIEWED;

  /**
   * Event triggered when a user submits a claim.
   * @payload {
   *   claimId: string; // ID of the submitted claim
   *   amount: number; // Amount of the claim
   *   claimType?: string; // Optional type of claim
   *   submittedAt: string; // ISO date string when claim was submitted
   *   serviceDate: string; // ISO date string when service was provided
   *   hasDocuments?: boolean; // Whether the claim has supporting documents
   *   isFirstClaim?: boolean; // Whether this is the first claim submitted by the user
   * }
   */
  export const CLAIM_SUBMITTED = PlanEventType.CLAIM_SUBMITTED;

  /**
   * Event triggered when a claim is approved.
   * @payload {
   *   claimId: string; // ID of the approved claim
   *   amount: number; // Amount of the claim
   *   approvedAmount: number; // Approved amount
   *   approvedAt: string; // ISO date string when claim was approved
   *   processingTime?: number; // Optional processing time in hours
   *   paymentMethod?: string; // Optional payment method
   *   paymentDate?: string; // Optional ISO date string for payment
   * }
   */
  export const CLAIM_APPROVED = PlanEventType.CLAIM_APPROVED;

  /**
   * Event triggered when a claim is rejected.
   * @payload {
   *   claimId: string; // ID of the rejected claim
   *   amount: number; // Amount of the claim
   *   rejectedAt: string; // ISO date string when claim was rejected
   *   reason?: string; // Optional rejection reason
   *   appealable?: boolean; // Whether the rejection can be appealed
   *   nextSteps?: string; // Optional next steps information
   * }
   */
  export const CLAIM_REJECTED = PlanEventType.CLAIM_REJECTED;

  /**
   * Event triggered when a user uploads a document.
   * @payload {
   *   documentId: string; // ID of the uploaded document
   *   documentType: string; // Type of document
   *   uploadedAt: string; // ISO date string when document was uploaded
   *   fileSize: number; // Size of the file in bytes
   *   fileName: string; // Name of the file
   *   relatedEntityId?: string; // Optional ID of related entity (e.g., claim ID)
   *   relatedEntityType?: string; // Optional type of related entity
   * }
   */
  export const DOCUMENT_UPLOADED = PlanEventType.DOCUMENT_UPLOADED;

  /**
   * Event triggered when a user checks coverage for a service or provider.
   * @payload {
   *   serviceType?: string; // Optional type of service checked
   *   providerId?: string; // Optional provider ID
   *   checkedAt: string; // ISO date string when coverage was checked
   *   isCovered?: boolean; // Whether the service/provider is covered
   *   coveragePercentage?: number; // Optional coverage percentage
   *   outOfPocketEstimate?: number; // Optional out-of-pocket estimate
   * }
   */
  export const COVERAGE_CHECKED = PlanEventType.COVERAGE_CHECKED;

  /**
   * Event triggered when a user compares plans.
   * @payload {
   *   planIds: string[]; // IDs of the compared plans
   *   comparedAt: string; // ISO date string when plans were compared
   *   comparisonDuration?: number; // Optional comparison duration in seconds
   *   comparisonCriteria?: string[]; // Optional comparison criteria
   * }
   */
  export const PLAN_COMPARED = PlanEventType.PLAN_COMPARED;

  /**
   * Event triggered when a user selects a plan.
   * @payload {
   *   planId: string; // ID of the selected plan
   *   planType: string; // Type of plan
   *   selectedAt: string; // ISO date string when plan was selected
   *   coverageLevel?: string; // Optional coverage level
   *   annualCost?: number; // Optional annual cost
   *   isNewEnrollment?: boolean; // Whether this is a new enrollment or a plan change
   *   previousPlanId?: string; // Optional previous plan ID if changing plans
   * }
   */
  export const PLAN_SELECTED = PlanEventType.PLAN_SELECTED;
}

/**
 * Namespace containing all common event types.
 * These events are not specific to any journey and may be triggered by system actions
 * or user actions that span multiple journeys.
 */
export namespace CommonEvents {
  /**
   * Event triggered when a user registers.
   * @payload {
   *   userId: string; // ID of the registered user
   *   registeredAt: string; // ISO date string when user registered
   *   registrationMethod: string; // Method of registration (e.g., 'EMAIL', 'SOCIAL', 'SSO')
   *   referralSource?: string; // Optional referral source
   * }
   */
  export const USER_REGISTERED = CommonEventType.USER_REGISTERED;

  /**
   * Event triggered when a user logs in.
   * @payload {
   *   userId: string; // ID of the logged-in user
   *   loggedInAt: string; // ISO date string when user logged in
   *   loginMethod: string; // Method of login (e.g., 'EMAIL', 'SOCIAL', 'SSO')
   *   deviceType?: string; // Optional device type
   *   location?: string; // Optional location information
   * }
   */
  export const USER_LOGGED_IN = CommonEventType.USER_LOGGED_IN;

  /**
   * Event triggered when a user updates their profile.
   * @payload {
   *   userId: string; // ID of the user
   *   updatedAt: string; // ISO date string when profile was updated
   *   updatedFields: string[]; // Fields that were updated
   *   isFirstUpdate?: boolean; // Whether this is the first profile update
   * }
   */
  export const PROFILE_UPDATED = CommonEventType.PROFILE_UPDATED;

  /**
   * Event triggered when a user views a notification.
   * @payload {
   *   notificationId: string; // ID of the viewed notification
   *   notificationType: string; // Type of notification
   *   viewedAt: string; // ISO date string when notification was viewed
   *   relatedEntityId?: string; // Optional ID of related entity
   *   relatedEntityType?: string; // Optional type of related entity
   * }
   */
  export const NOTIFICATION_VIEWED = CommonEventType.NOTIFICATION_VIEWED;

  /**
   * Event triggered when a user submits feedback.
   * @payload {
   *   feedbackId: string; // ID of the submitted feedback
   *   feedbackType: string; // Type of feedback (e.g., 'RATING', 'COMMENT', 'SUGGESTION')
   *   submittedAt: string; // ISO date string when feedback was submitted
   *   rating?: number; // Optional rating value
   *   journey?: string; // Optional related journey
   *   feature?: string; // Optional related feature
   * }
   */
  export const FEEDBACK_SUBMITTED = CommonEventType.FEEDBACK_SUBMITTED;

  /**
   * Event triggered when a user redeems a reward.
   * @payload {
   *   rewardId: string; // ID of the redeemed reward
   *   rewardName: string; // Name of the reward
   *   redeemedAt: string; // ISO date string when reward was redeemed
   *   value?: number; // Optional value of the reward
   *   rewardType?: string; // Optional type of reward
   *   expiresAt?: string; // Optional ISO date string for expiration
   * }
   */
  export const REWARD_REDEEMED = CommonEventType.REWARD_REDEEMED;

  /**
   * Event triggered when a user unlocks an achievement.
   * @payload {
   *   achievementId: string; // ID of the unlocked achievement
   *   achievementName: string; // Name of the achievement
   *   unlockedAt: string; // ISO date string when achievement was unlocked
   *   pointsAwarded: number; // Number of points awarded
   *   journey?: string; // Optional related journey
   *   rarity?: string; // Optional rarity of the achievement
   * }
   */
  export const ACHIEVEMENT_UNLOCKED = CommonEventType.ACHIEVEMENT_UNLOCKED;

  /**
   * Event triggered when a user completes a quest.
   * @payload {
   *   questId: string; // ID of the completed quest
   *   questName: string; // Name of the quest
   *   completedAt: string; // ISO date string when quest was completed
   *   pointsAwarded: number; // Number of points awarded
   *   journey?: string; // Optional related journey
   *   duration?: number; // Optional duration to complete in days
   * }
   */
  export const QUEST_COMPLETED = CommonEventType.QUEST_COMPLETED;
}

/**
 * Namespace containing all gamification-specific event types.
 * These events are related to the gamification system and are typically
 * generated by the gamification engine itself.
 */
export namespace GamificationEvents {
  /**
   * Event triggered when a user earns XP.
   * @payload {
   *   userId: string; // ID of the user
   *   amount: number; // Amount of XP earned
   *   source: string; // Source of the XP (e.g., 'ACHIEVEMENT', 'QUEST', 'ACTIVITY')
   *   timestamp: string; // ISO date string when XP was earned
   *   sourceEventId?: string; // Optional ID of the source event
   *   journey?: string; // Optional related journey
   * }
   */
  export const XP_EARNED = 'XP_EARNED';

  /**
   * Event triggered when a user levels up.
   * @payload {
   *   userId: string; // ID of the user
   *   oldLevel: number; // Previous level
   *   newLevel: number; // New level
   *   timestamp: string; // ISO date string when level up occurred
   *   totalXp: number; // Total XP at the time of level up
   *   rewards?: any[]; // Optional rewards for the new level
   * }
   */
  export const LEVEL_UP = 'LEVEL_UP';

  /**
   * Event triggered when a user's streak is updated.
   * @payload {
   *   userId: string; // ID of the user
   *   streakType: string; // Type of streak (e.g., 'LOGIN', 'ACTIVITY', 'MEDICATION')
   *   currentCount: number; // Current streak count
   *   previousCount: number; // Previous streak count
   *   timestamp: string; // ISO date string when streak was updated
   *   journey?: string; // Optional related journey
   * }
   */
  export const STREAK_UPDATED = 'STREAK_UPDATED';

  /**
   * Event triggered when a user joins a leaderboard.
   * @payload {
   *   userId: string; // ID of the user
   *   leaderboardId: string; // ID of the leaderboard
   *   timestamp: string; // ISO date string when user joined
   *   initialRank: number; // Initial rank on the leaderboard
   *   leaderboardType?: string; // Optional type of leaderboard
   *   journey?: string; // Optional related journey
   * }
   */
  export const LEADERBOARD_JOINED = 'LEADERBOARD_JOINED';

  /**
   * Event triggered when a user's rank changes on a leaderboard.
   * @payload {
   *   userId: string; // ID of the user
   *   leaderboardId: string; // ID of the leaderboard
   *   oldRank: number; // Previous rank
   *   newRank: number; // New rank
   *   timestamp: string; // ISO date string when rank changed
   *   leaderboardType?: string; // Optional type of leaderboard
   * }
   */
  export const RANK_CHANGED = 'RANK_CHANGED';
}

/**
 * Namespace containing all user-specific event types.
 * These events are related to user account management and preferences.
 */
export namespace UserEvents {
  /**
   * Event triggered when a user updates their notification preferences.
   * @payload {
   *   userId: string; // ID of the user
   *   updatedAt: string; // ISO date string when preferences were updated
   *   channels: { // Updated channel preferences
   *     email?: boolean;
   *     push?: boolean;
   *     sms?: boolean;
   *     inApp?: boolean;
   *   };
   *   categories?: { // Optional category preferences
   *     [category: string]: boolean;
   *   };
   * }
   */
  export const NOTIFICATION_PREFERENCES_UPDATED = 'NOTIFICATION_PREFERENCES_UPDATED';

  /**
   * Event triggered when a user connects a third-party account.
   * @payload {
   *   userId: string; // ID of the user
   *   providerType: string; // Type of provider (e.g., 'GOOGLE', 'FACEBOOK', 'APPLE')
   *   connectedAt: string; // ISO date string when account was connected
   *   isFirstConnection: boolean; // Whether this is the first connection for this provider
   *   scopes?: string[]; // Optional authorized scopes
   * }
   */
  export const ACCOUNT_CONNECTED = 'ACCOUNT_CONNECTED';

  /**
   * Event triggered when a user disconnects a third-party account.
   * @payload {
   *   userId: string; // ID of the user
   *   providerType: string; // Type of provider
   *   disconnectedAt: string; // ISO date string when account was disconnected
   *   connectionDuration?: number; // Optional duration of connection in days
   *   reason?: string; // Optional reason for disconnection
   * }
   */
  export const ACCOUNT_DISCONNECTED = 'ACCOUNT_DISCONNECTED';

  /**
   * Event triggered when a user changes their language preference.
   * @payload {
   *   userId: string; // ID of the user
   *   oldLanguage: string; // Previous language code
   *   newLanguage: string; // New language code
   *   changedAt: string; // ISO date string when language was changed
   *   source?: string; // Optional source of change (e.g., 'SETTINGS', 'ONBOARDING')
   * }
   */
  export const LANGUAGE_CHANGED = 'LANGUAGE_CHANGED';

  /**
   * Event triggered when a user completes their profile.
   * @payload {
   *   userId: string; // ID of the user
   *   completedAt: string; // ISO date string when profile was completed
   *   completedFields: string[]; // Fields that were completed
   *   profileCompletionPercentage: number; // Percentage of profile completion
   *   source?: string; // Optional source of completion (e.g., 'ONBOARDING', 'SETTINGS')
   * }
   */
  export const PROFILE_COMPLETED = 'PROFILE_COMPLETED';
}

/**
 * Union type of all event types from all namespaces.
 * This provides a comprehensive type for all possible events in the system.
 */
export type AllEventTypes =
  | EventType
  | GamificationEvents[keyof typeof GamificationEvents]
  | UserEvents[keyof typeof UserEvents];

/**
 * Checks if an event type is a gamification event type.
 * @param type The event type to check
 * @returns True if the event type is a gamification event type
 */
export function isGamificationEventType(type: AllEventTypes): boolean {
  return Object.values(GamificationEvents).includes(type as any);
}

/**
 * Checks if an event type is a user event type.
 * @param type The event type to check
 * @returns True if the event type is a user event type
 */
export function isUserEventType(type: AllEventTypes): boolean {
  return Object.values(UserEvents).includes(type as any);
}

/**
 * Gets the category for an event type.
 * @param eventType The event type
 * @returns The category for the event type
 */
export function getEventCategory(eventType: AllEventTypes): 'health' | 'care' | 'plan' | 'common' | 'gamification' | 'user' | undefined {
  if (isHealthEventType(eventType as EventType)) {
    return 'health';
  } else if (isCareEventType(eventType as EventType)) {
    return 'care';
  } else if (isPlanEventType(eventType as EventType)) {
    return 'plan';
  } else if (isCommonEventType(eventType as EventType)) {
    return 'common';
  } else if (isGamificationEventType(eventType)) {
    return 'gamification';
  } else if (isUserEventType(eventType)) {
    return 'user';
  }
  return undefined;
}