import { GamificationEvent } from '@austa/interfaces/gamification/events';

/**
 * Comprehensive enumeration of all event types supported by the gamification engine.
 * Events are categorized by journey (Health, Care, Plan) and represent user actions
 * that can trigger gamification rules, achievements, and rewards.
 *
 * This enum provides type safety and autocompletion for event types throughout the codebase.
 */
export enum EventType {
  // Health Journey Events
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  HEALTH_GOAL_UPDATED = 'HEALTH_GOAL_UPDATED',
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  HEALTH_GOAL_COMPLETED = 'HEALTH_GOAL_COMPLETED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  MEDICAL_EVENT_ADDED = 'MEDICAL_EVENT_ADDED',
  HEALTH_PROFILE_COMPLETED = 'HEALTH_PROFILE_COMPLETED',
  HEALTH_ASSESSMENT_COMPLETED = 'HEALTH_ASSESSMENT_COMPLETED',
  DAILY_STEP_GOAL_ACHIEVED = 'DAILY_STEP_GOAL_ACHIEVED',
  WEEKLY_ACTIVITY_GOAL_ACHIEVED = 'WEEKLY_ACTIVITY_GOAL_ACHIEVED',
  SLEEP_GOAL_ACHIEVED = 'SLEEP_GOAL_ACHIEVED',
  WEIGHT_GOAL_ACHIEVED = 'WEIGHT_GOAL_ACHIEVED',
  BLOOD_PRESSURE_GOAL_ACHIEVED = 'BLOOD_PRESSURE_GOAL_ACHIEVED',
  GLUCOSE_GOAL_ACHIEVED = 'GLUCOSE_GOAL_ACHIEVED',
  
  // Care Journey Events
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_ATTENDED = 'APPOINTMENT_ATTENDED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_SKIPPED = 'MEDICATION_SKIPPED',
  MEDICATION_ADHERENCE_STREAK = 'MEDICATION_ADHERENCE_STREAK',
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  SYMPTOM_CHECKED = 'SYMPTOM_CHECKED',
  TREATMENT_PLAN_CREATED = 'TREATMENT_PLAN_CREATED',
  TREATMENT_PLAN_UPDATED = 'TREATMENT_PLAN_UPDATED',
  TREATMENT_PLAN_COMPLETED = 'TREATMENT_PLAN_COMPLETED',
  PROVIDER_RATED = 'PROVIDER_RATED',
  CARE_ASSESSMENT_COMPLETED = 'CARE_ASSESSMENT_COMPLETED',
  
  // Plan Journey Events
  PLAN_SELECTED = 'PLAN_SELECTED',
  PLAN_CHANGED = 'PLAN_CHANGED',
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_DENIED = 'CLAIM_DENIED',
  CLAIM_UPDATED = 'CLAIM_UPDATED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  BENEFIT_USED = 'BENEFIT_USED',
  COVERAGE_VERIFIED = 'COVERAGE_VERIFIED',
  PLAN_ASSESSMENT_COMPLETED = 'PLAN_ASSESSMENT_COMPLETED',
  PLAN_RECOMMENDATION_VIEWED = 'PLAN_RECOMMENDATION_VIEWED',
  PLAN_COMPARISON_VIEWED = 'PLAN_COMPARISON_VIEWED',
  
  // Cross-Journey Events
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  FEEDBACK_SUBMITTED = 'FEEDBACK_SUBMITTED',
  NOTIFICATION_CLICKED = 'NOTIFICATION_CLICKED',
  REFERRAL_SENT = 'REFERRAL_SENT',
  REFERRAL_ACCEPTED = 'REFERRAL_ACCEPTED',
  QUEST_STARTED = 'QUEST_STARTED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  REWARD_CLAIMED = 'REWARD_CLAIMED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  DAILY_LOGIN_STREAK = 'DAILY_LOGIN_STREAK',
  WEEKLY_ACTIVE_STREAK = 'WEEKLY_ACTIVE_STREAK',
  MONTHLY_ACTIVE_STREAK = 'MONTHLY_ACTIVE_STREAK'
}

/**
 * Type guard to check if a string is a valid EventType
 * @param value - The string to check
 * @returns True if the string is a valid EventType, false otherwise
 */
export function isValidEventType(value: string): value is EventType {
  return Object.values(EventType).includes(value as EventType);
}

/**
 * Type guard to check if an event is a Health journey event
 * @param eventType - The event type to check
 * @returns True if the event is a Health journey event, false otherwise
 */
export function isHealthEvent(eventType: EventType): boolean {
  return [
    EventType.HEALTH_METRIC_RECORDED,
    EventType.HEALTH_GOAL_CREATED,
    EventType.HEALTH_GOAL_UPDATED,
    EventType.HEALTH_GOAL_ACHIEVED,
    EventType.HEALTH_GOAL_COMPLETED,
    EventType.DEVICE_CONNECTED,
    EventType.DEVICE_SYNCED,
    EventType.MEDICAL_EVENT_ADDED,
    EventType.HEALTH_PROFILE_COMPLETED,
    EventType.HEALTH_ASSESSMENT_COMPLETED,
    EventType.DAILY_STEP_GOAL_ACHIEVED,
    EventType.WEEKLY_ACTIVITY_GOAL_ACHIEVED,
    EventType.SLEEP_GOAL_ACHIEVED,
    EventType.WEIGHT_GOAL_ACHIEVED,
    EventType.BLOOD_PRESSURE_GOAL_ACHIEVED,
    EventType.GLUCOSE_GOAL_ACHIEVED
  ].includes(eventType);
}

/**
 * Type guard to check if an event is a Care journey event
 * @param eventType - The event type to check
 * @returns True if the event is a Care journey event, false otherwise
 */
export function isCareEvent(eventType: EventType): boolean {
  return [
    EventType.APPOINTMENT_BOOKED,
    EventType.APPOINTMENT_ATTENDED,
    EventType.APPOINTMENT_CANCELLED,
    EventType.APPOINTMENT_RESCHEDULED,
    EventType.MEDICATION_ADDED,
    EventType.MEDICATION_TAKEN,
    EventType.MEDICATION_SKIPPED,
    EventType.MEDICATION_ADHERENCE_STREAK,
    EventType.TELEMEDICINE_SESSION_STARTED,
    EventType.TELEMEDICINE_SESSION_COMPLETED,
    EventType.SYMPTOM_CHECKED,
    EventType.TREATMENT_PLAN_CREATED,
    EventType.TREATMENT_PLAN_UPDATED,
    EventType.TREATMENT_PLAN_COMPLETED,
    EventType.PROVIDER_RATED,
    EventType.CARE_ASSESSMENT_COMPLETED
  ].includes(eventType);
}

/**
 * Type guard to check if an event is a Plan journey event
 * @param eventType - The event type to check
 * @returns True if the event is a Plan journey event, false otherwise
 */
export function isPlanEvent(eventType: EventType): boolean {
  return [
    EventType.PLAN_SELECTED,
    EventType.PLAN_CHANGED,
    EventType.CLAIM_SUBMITTED,
    EventType.CLAIM_APPROVED,
    EventType.CLAIM_DENIED,
    EventType.CLAIM_UPDATED,
    EventType.DOCUMENT_UPLOADED,
    EventType.BENEFIT_USED,
    EventType.COVERAGE_VERIFIED,
    EventType.PLAN_ASSESSMENT_COMPLETED,
    EventType.PLAN_RECOMMENDATION_VIEWED,
    EventType.PLAN_COMPARISON_VIEWED
  ].includes(eventType);
}

/**
 * Type guard to check if an event is a cross-journey event
 * @param eventType - The event type to check
 * @returns True if the event is a cross-journey event, false otherwise
 */
export function isCrossJourneyEvent(eventType: EventType): boolean {
  return [
    EventType.USER_REGISTERED,
    EventType.USER_LOGGED_IN,
    EventType.PROFILE_COMPLETED,
    EventType.FEEDBACK_SUBMITTED,
    EventType.NOTIFICATION_CLICKED,
    EventType.REFERRAL_SENT,
    EventType.REFERRAL_ACCEPTED,
    EventType.QUEST_STARTED,
    EventType.QUEST_COMPLETED,
    EventType.REWARD_CLAIMED,
    EventType.ACHIEVEMENT_UNLOCKED,
    EventType.DAILY_LOGIN_STREAK,
    EventType.WEEKLY_ACTIVE_STREAK,
    EventType.MONTHLY_ACTIVE_STREAK
  ].includes(eventType);
}

/**
 * Type for events that can award points or trigger achievements
 */
export type GamificationEventType = EventType;

/**
 * Type for events that can trigger quests
 */
export type QuestEventType = EventType;

/**
 * Type for events that can trigger rewards
 */
export type RewardEventType = EventType;

/**
 * Re-export GamificationEvent from @austa/interfaces for convenience
 */
export { GamificationEvent };

/**
 * Type for a gamification event with a specific event type
 */
export type TypedGamificationEvent<T extends EventType> = GamificationEvent & {
  type: T;
};

/**
 * Type for a health journey event
 */
export type HealthEvent = TypedGamificationEvent<
  | EventType.HEALTH_METRIC_RECORDED
  | EventType.HEALTH_GOAL_CREATED
  | EventType.HEALTH_GOAL_UPDATED
  | EventType.HEALTH_GOAL_ACHIEVED
  | EventType.HEALTH_GOAL_COMPLETED
  | EventType.DEVICE_CONNECTED
  | EventType.DEVICE_SYNCED
  | EventType.MEDICAL_EVENT_ADDED
  | EventType.HEALTH_PROFILE_COMPLETED
  | EventType.HEALTH_ASSESSMENT_COMPLETED
  | EventType.DAILY_STEP_GOAL_ACHIEVED
  | EventType.WEEKLY_ACTIVITY_GOAL_ACHIEVED
  | EventType.SLEEP_GOAL_ACHIEVED
  | EventType.WEIGHT_GOAL_ACHIEVED
  | EventType.BLOOD_PRESSURE_GOAL_ACHIEVED
  | EventType.GLUCOSE_GOAL_ACHIEVED
>;

/**
 * Type for a care journey event
 */
export type CareEvent = TypedGamificationEvent<
  | EventType.APPOINTMENT_BOOKED
  | EventType.APPOINTMENT_ATTENDED
  | EventType.APPOINTMENT_CANCELLED
  | EventType.APPOINTMENT_RESCHEDULED
  | EventType.MEDICATION_ADDED
  | EventType.MEDICATION_TAKEN
  | EventType.MEDICATION_SKIPPED
  | EventType.MEDICATION_ADHERENCE_STREAK
  | EventType.TELEMEDICINE_SESSION_STARTED
  | EventType.TELEMEDICINE_SESSION_COMPLETED
  | EventType.SYMPTOM_CHECKED
  | EventType.TREATMENT_PLAN_CREATED
  | EventType.TREATMENT_PLAN_UPDATED
  | EventType.TREATMENT_PLAN_COMPLETED
  | EventType.PROVIDER_RATED
  | EventType.CARE_ASSESSMENT_COMPLETED
>;

/**
 * Type for a plan journey event
 */
export type PlanEvent = TypedGamificationEvent<
  | EventType.PLAN_SELECTED
  | EventType.PLAN_CHANGED
  | EventType.CLAIM_SUBMITTED
  | EventType.CLAIM_APPROVED
  | EventType.CLAIM_DENIED
  | EventType.CLAIM_UPDATED
  | EventType.DOCUMENT_UPLOADED
  | EventType.BENEFIT_USED
  | EventType.COVERAGE_VERIFIED
  | EventType.PLAN_ASSESSMENT_COMPLETED
  | EventType.PLAN_RECOMMENDATION_VIEWED
  | EventType.PLAN_COMPARISON_VIEWED
>;

/**
 * Type for a cross-journey event
 */
export type CrossJourneyEvent = TypedGamificationEvent<
  | EventType.USER_REGISTERED
  | EventType.USER_LOGGED_IN
  | EventType.PROFILE_COMPLETED
  | EventType.FEEDBACK_SUBMITTED
  | EventType.NOTIFICATION_CLICKED
  | EventType.REFERRAL_SENT
  | EventType.REFERRAL_ACCEPTED
  | EventType.QUEST_STARTED
  | EventType.QUEST_COMPLETED
  | EventType.REWARD_CLAIMED
  | EventType.ACHIEVEMENT_UNLOCKED
  | EventType.DAILY_LOGIN_STREAK
  | EventType.WEEKLY_ACTIVE_STREAK
  | EventType.MONTHLY_ACTIVE_STREAK
>;