import { GamificationEventType } from '@austa/interfaces/gamification/events';

/**
 * Enumeration of all supported event types across all journeys in the system.
 * Events are categorized by journey (Health, Care, Plan) and used to trigger
 * gamification rules, achievements, and rewards.
 *
 * This enum provides type safety and autocompletion for event types, ensuring
 * consistent usage throughout the codebase.
 * 
 * @remarks
 * This enum is aligned with GamificationEventType from @austa/interfaces to ensure
 * consistency across the platform. Any changes to this enum should also be reflected
 * in the interfaces package.
 */
export enum EventType {
  // Health Journey Events
  /**
   * Triggered when a user records a health metric (weight, blood pressure, etc.)
   * Data payload includes metric type, value, and unit.
   */
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',

  /**
   * Triggered when a user achieves a health goal
   * Data payload includes goal type, target value, and achievement date.
   */
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',

  /**
   * Triggered when a user creates a new health goal
   * Data payload includes goal type, target value, and start/end dates.
   */
  GOAL_CREATED = 'GOAL_CREATED',

  /**
   * Triggered when a user connects a wearable device or health app
   * Data payload includes device type, connection status, and timestamp.
   */
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',

  /**
   * Triggered when the system generates a health insight for the user
   * Data payload includes insight type, description, and related metrics.
   */
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',

  // Care Journey Events
  /**
   * Triggered when a user books a medical appointment
   * Data payload includes appointment type, provider, and scheduled date/time.
   */
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',

  /**
   * Triggered when a user completes a medical appointment
   * Data payload includes appointment type, provider, and completion status.
   */
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',

  /**
   * Triggered when a user logs taking medication
   * Data payload includes medication name, dosage, and timestamp.
   */
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',

  /**
   * Triggered when a user starts a telemedicine session
   * Data payload includes session ID, provider, and start time.
   */
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',

  /**
   * Triggered when a user completes a telemedicine session
   * Data payload includes session ID, duration, and completion status.
   */
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',

  /**
   * Triggered when a user makes progress on their care plan
   * Data payload includes care plan ID, progress percentage, and activity details.
   */
  CARE_PLAN_PROGRESS = 'CARE_PLAN_PROGRESS',

  // Plan Journey Events
  /**
   * Triggered when a user submits an insurance claim
   * Data payload includes claim type, amount, and submission details.
   */
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',

  /**
   * Triggered when a user's insurance claim is approved
   * Data payload includes claim ID, approved amount, and processing details.
   */
  CLAIM_APPROVED = 'CLAIM_APPROVED',

  /**
   * Triggered when a user utilizes an insurance benefit
   * Data payload includes benefit type, usage details, and timestamp.
   */
  BENEFIT_USED = 'BENEFIT_USED',

  /**
   * Triggered when a user selects or changes their insurance plan
   * Data payload includes plan details, coverage information, and selection date.
   */
  PLAN_SELECTED = 'PLAN_SELECTED',

  /**
   * Triggered when a user accesses their digital insurance card
   * Data payload includes access timestamp and device information.
   */
  DIGITAL_CARD_ACCESSED = 'DIGITAL_CARD_ACCESSED',

  // Cross-Journey Events
  /**
   * Triggered when a user completes their profile information
   * Data payload includes completion percentage and updated fields.
   */
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',

  /**
   * Triggered when a user invites another user to the platform
   * Data payload includes invitation details and referral information.
   */
  USER_REFERRED = 'USER_REFERRED',

  /**
   * Triggered when a user completes a feedback survey
   * Data payload includes survey type, completion status, and timestamp.
   */
  FEEDBACK_SUBMITTED = 'FEEDBACK_SUBMITTED',

  // System Events
  /**
   * Triggered when a user logs in to the application
   * Data payload includes login timestamp and device information.
   */
  USER_LOGIN = 'USER_LOGIN',

  /**
   * Triggered when a user completes a streak of daily activities
   * Data payload includes streak count, activity type, and completion date.
   */
  STREAK_COMPLETED = 'STREAK_COMPLETED',

  /**
   * Triggered when a user earns an achievement
   * Data payload includes achievement ID, name, and unlock conditions.
   */
  ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',

  /**
   * Triggered when a user levels up in the gamification system
   * Data payload includes new level, XP earned, and unlocked features.
   */
  LEVEL_UP = 'LEVEL_UP',

  /**
   * Triggered when a user completes a quest
   * Data payload includes quest ID, completion status, and rewards.
   */
  QUEST_COMPLETED = 'QUEST_COMPLETED',
}

/**
 * Type guard to check if a string is a valid EventType
 * @param value The string value to check
 * @returns True if the value is a valid EventType, false otherwise
 */
export function isValidEventType(value: string): value is EventType {
  return Object.values(EventType).includes(value as EventType);
}

/**
 * Type for Health Journey specific events
 */
export type HealthEventType = 
  | EventType.HEALTH_METRIC_RECORDED
  | EventType.GOAL_ACHIEVED
  | EventType.GOAL_CREATED
  | EventType.DEVICE_CONNECTED
  | EventType.HEALTH_INSIGHT_GENERATED;

/**
 * Type guard to check if an event type belongs to the Health Journey
 * @param eventType The event type to check
 * @returns True if the event type belongs to the Health Journey, false otherwise
 */
export function isHealthEvent(eventType: EventType): eventType is HealthEventType {
  return [
    EventType.HEALTH_METRIC_RECORDED,
    EventType.GOAL_ACHIEVED,
    EventType.GOAL_CREATED,
    EventType.DEVICE_CONNECTED,
    EventType.HEALTH_INSIGHT_GENERATED,
  ].includes(eventType);
}

/**
 * Type for Care Journey specific events
 */
export type CareEventType = 
  | EventType.APPOINTMENT_BOOKED
  | EventType.APPOINTMENT_COMPLETED
  | EventType.MEDICATION_TAKEN
  | EventType.TELEMEDICINE_SESSION_STARTED
  | EventType.TELEMEDICINE_SESSION_COMPLETED
  | EventType.CARE_PLAN_PROGRESS;

/**
 * Type guard to check if an event type belongs to the Care Journey
 * @param eventType The event type to check
 * @returns True if the event type belongs to the Care Journey, false otherwise
 */
export function isCareEvent(eventType: EventType): eventType is CareEventType {
  return [
    EventType.APPOINTMENT_BOOKED,
    EventType.APPOINTMENT_COMPLETED,
    EventType.MEDICATION_TAKEN,
    EventType.TELEMEDICINE_SESSION_STARTED,
    EventType.TELEMEDICINE_SESSION_COMPLETED,
    EventType.CARE_PLAN_PROGRESS,
  ].includes(eventType);
}

/**
 * Type for Plan Journey specific events
 */
export type PlanEventType = 
  | EventType.CLAIM_SUBMITTED
  | EventType.CLAIM_APPROVED
  | EventType.BENEFIT_USED
  | EventType.PLAN_SELECTED
  | EventType.DIGITAL_CARD_ACCESSED;

/**
 * Type guard to check if an event type belongs to the Plan Journey
 * @param eventType The event type to check
 * @returns True if the event type belongs to the Plan Journey, false otherwise
 */
export function isPlanEvent(eventType: EventType): eventType is PlanEventType {
  return [
    EventType.CLAIM_SUBMITTED,
    EventType.CLAIM_APPROVED,
    EventType.BENEFIT_USED,
    EventType.PLAN_SELECTED,
    EventType.DIGITAL_CARD_ACCESSED,
  ].includes(eventType);
}

/**
 * Type for Cross-Journey events
 */
export type CrossJourneyEventType = 
  | EventType.PROFILE_COMPLETED
  | EventType.USER_REFERRED
  | EventType.FEEDBACK_SUBMITTED;

/**
 * Type guard to check if an event type is a cross-journey event
 * @param eventType The event type to check
 * @returns True if the event type is a cross-journey event, false otherwise
 */
export function isCrossJourneyEvent(eventType: EventType): eventType is CrossJourneyEventType {
  return [
    EventType.PROFILE_COMPLETED,
    EventType.USER_REFERRED,
    EventType.FEEDBACK_SUBMITTED,
  ].includes(eventType);
}

/**
 * Type for System events
 */
export type SystemEventType = 
  | EventType.USER_LOGIN
  | EventType.STREAK_COMPLETED
  | EventType.ACHIEVEMENT_EARNED
  | EventType.LEVEL_UP
  | EventType.QUEST_COMPLETED;

/**
 * Type guard to check if an event type is a system event
 * @param eventType The event type to check
 * @returns True if the event type is a system event, false otherwise
 */
export function isSystemEvent(eventType: EventType): eventType is SystemEventType {
  return [
    EventType.USER_LOGIN,
    EventType.STREAK_COMPLETED,
    EventType.ACHIEVEMENT_EARNED,
    EventType.LEVEL_UP,
    EventType.QUEST_COMPLETED,
  ].includes(eventType);
}

/**
 * Get the journey associated with an event type
 * @param eventType The event type to check
 * @returns The journey name ('health', 'care', 'plan', 'cross-journey', or 'system')
 */
export function getEventJourney(eventType: EventType): 'health' | 'care' | 'plan' | 'cross-journey' | 'system' {
  if (isHealthEvent(eventType)) return 'health';
  if (isCareEvent(eventType)) return 'care';
  if (isPlanEvent(eventType)) return 'plan';
  if (isCrossJourneyEvent(eventType)) return 'cross-journey';
  return 'system';
}

// Re-export types from @austa/interfaces for consistency
export { 
  GamificationEventType,
  BaseGamificationEvent,
  HealthGamificationEvent,
  CareGamificationEvent,
  PlanGamificationEvent,
  SystemGamificationEvent,
  CrossJourneyGamificationEvent
} from '@austa/interfaces/gamification/events';

/**
 * Maps internal EventType to GamificationEventType from @austa/interfaces
 * This ensures compatibility between the internal event system and the shared interfaces
 * 
 * @param eventType The internal event type
 * @returns The corresponding GamificationEventType
 */
export function mapToGamificationEventType(eventType: EventType): GamificationEventType {
  // The enum values should match exactly, so we can cast directly
  // This function exists to provide a clear mapping point if the enums ever diverge
  return eventType as unknown as GamificationEventType;
}