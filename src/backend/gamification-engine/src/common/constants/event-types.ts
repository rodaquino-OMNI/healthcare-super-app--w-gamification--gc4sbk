/**
 * @file event-types.ts
 * @description Defines all event types that can be processed by the gamification engine, organized by journey.
 * These typed constants ensure consistent event identification across services and are used in
 * event validation, processing logic, and achievement rules.
 */

import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Health journey event types
 * Events related to health metrics, goals, and device connections
 */
export enum HealthEventType {
  // Metric recording events
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_METRIC_UPDATED = 'HEALTH_METRIC_UPDATED',
  HEALTH_METRIC_DELETED = 'HEALTH_METRIC_DELETED',
  
  // Goal-related events
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  HEALTH_GOAL_UPDATED = 'HEALTH_GOAL_UPDATED',
  HEALTH_GOAL_COMPLETED = 'HEALTH_GOAL_COMPLETED',
  HEALTH_GOAL_ABANDONED = 'HEALTH_GOAL_ABANDONED',
  
  // Device-related events
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_DISCONNECTED = 'DEVICE_DISCONNECTED',
  DEVICE_SYNC_COMPLETED = 'DEVICE_SYNC_COMPLETED',
  
  // Insight-related events
  HEALTH_INSIGHT_VIEWED = 'HEALTH_INSIGHT_VIEWED',
  HEALTH_REPORT_GENERATED = 'HEALTH_REPORT_GENERATED',
  HEALTH_REPORT_SHARED = 'HEALTH_REPORT_SHARED',
  
  // Streak-related events
  DAILY_HEALTH_CHECK_COMPLETED = 'DAILY_HEALTH_CHECK_COMPLETED',
  WEEKLY_HEALTH_SUMMARY_VIEWED = 'WEEKLY_HEALTH_SUMMARY_VIEWED',
  MONTHLY_HEALTH_GOAL_ACHIEVED = 'MONTHLY_HEALTH_GOAL_ACHIEVED'
}

/**
 * Care journey event types
 * Events related to appointments, medications, providers, and telemedicine
 */
export enum CareEventType {
  // Appointment-related events
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_ATTENDED = 'APPOINTMENT_ATTENDED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_REMINDER_ACKNOWLEDGED = 'APPOINTMENT_REMINDER_ACKNOWLEDGED',
  
  // Medication-related events
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_SKIPPED = 'MEDICATION_SKIPPED',
  MEDICATION_REMINDER_ACKNOWLEDGED = 'MEDICATION_REMINDER_ACKNOWLEDGED',
  MEDICATION_REFILL_REQUESTED = 'MEDICATION_REFILL_REQUESTED',
  
  // Provider-related events
  PROVIDER_SEARCHED = 'PROVIDER_SEARCHED',
  PROVIDER_FAVORITED = 'PROVIDER_FAVORITED',
  PROVIDER_RATED = 'PROVIDER_RATED',
  PROVIDER_RECOMMENDED = 'PROVIDER_RECOMMENDED',
  
  // Telemedicine-related events
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  TELEMEDICINE_SESSION_CANCELLED = 'TELEMEDICINE_SESSION_CANCELLED',
  
  // Symptom-related events
  SYMPTOM_CHECKED = 'SYMPTOM_CHECKED',
  SYMPTOM_TRACKER_UPDATED = 'SYMPTOM_TRACKER_UPDATED',
  
  // Treatment-related events
  TREATMENT_PLAN_VIEWED = 'TREATMENT_PLAN_VIEWED',
  TREATMENT_PLAN_COMPLETED = 'TREATMENT_PLAN_COMPLETED',
  TREATMENT_PROGRESS_UPDATED = 'TREATMENT_PROGRESS_UPDATED'
}

/**
 * Plan journey event types
 * Events related to insurance plans, claims, benefits, and coverage
 */
export enum PlanEventType {
  // Plan-related events
  PLAN_VIEWED = 'PLAN_VIEWED',
  PLAN_COMPARED = 'PLAN_COMPARED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  PLAN_CHANGED = 'PLAN_CHANGED',
  
  // Claim-related events
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_UPDATED = 'CLAIM_UPDATED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_DENIED = 'CLAIM_DENIED',
  CLAIM_DOCUMENT_UPLOADED = 'CLAIM_DOCUMENT_UPLOADED',
  
  // Benefit-related events
  BENEFIT_VIEWED = 'BENEFIT_VIEWED',
  BENEFIT_USED = 'BENEFIT_USED',
  BENEFIT_SHARED = 'BENEFIT_SHARED',
  
  // Coverage-related events
  COVERAGE_CHECKED = 'COVERAGE_CHECKED',
  COVERAGE_EXPLAINED = 'COVERAGE_EXPLAINED',
  
  // Document-related events
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_SHARED = 'DOCUMENT_SHARED'
}

/**
 * System event types
 * Events related to system-wide actions not specific to a journey
 */
export enum SystemEventType {
  // User-related events
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_PROFILE_COMPLETED = 'USER_PROFILE_COMPLETED',
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  
  // Gamification-related events
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  QUEST_STARTED = 'QUEST_STARTED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  REWARD_CLAIMED = 'REWARD_CLAIMED',
  LEVEL_UP = 'LEVEL_UP',
  
  // App usage events
  APP_OPENED = 'APP_OPENED',
  FEATURE_USED = 'FEATURE_USED',
  FEEDBACK_SUBMITTED = 'FEEDBACK_SUBMITTED',
  NOTIFICATION_CLICKED = 'NOTIFICATION_CLICKED'
}

/**
 * Combined event type enum
 * Aggregates all event types from all journeys for use in type checking
 */
export type EventType = 
  | HealthEventType
  | CareEventType
  | PlanEventType
  | SystemEventType;

/**
 * Event metadata interface
 * Provides additional information about each event type
 */
export interface EventMetadata {
  /** The journey this event belongs to */
  journey: JourneyType;
  /** Human-readable description of the event */
  description: string;
  /** Points awarded for this event (default: 0) */
  defaultPoints: number;
  /** Whether this event can trigger achievements */
  canTriggerAchievements: boolean;
  /** Whether this event counts towards quests */
  countsForQuests: boolean;
  /** The category this event belongs to within its journey */
  category: string;
}

/**
 * Event metadata registry
 * Maps each event type to its metadata
 */
export const EVENT_METADATA: Record<EventType, EventMetadata> = {
  // Health journey events
  [HealthEventType.HEALTH_METRIC_RECORDED]: {
    journey: JourneyType.HEALTH,
    description: 'User recorded a health metric',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'metrics'
  },
  [HealthEventType.HEALTH_METRIC_UPDATED]: {
    journey: JourneyType.HEALTH,
    description: 'User updated a health metric',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'metrics'
  },
  [HealthEventType.HEALTH_METRIC_DELETED]: {
    journey: JourneyType.HEALTH,
    description: 'User deleted a health metric',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'metrics'
  },
  [HealthEventType.HEALTH_GOAL_CREATED]: {
    journey: JourneyType.HEALTH,
    description: 'User created a health goal',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'goals'
  },
  [HealthEventType.HEALTH_GOAL_UPDATED]: {
    journey: JourneyType.HEALTH,
    description: 'User updated a health goal',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'goals'
  },
  [HealthEventType.HEALTH_GOAL_COMPLETED]: {
    journey: JourneyType.HEALTH,
    description: 'User completed a health goal',
    defaultPoints: 50,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'goals'
  },
  [HealthEventType.HEALTH_GOAL_ABANDONED]: {
    journey: JourneyType.HEALTH,
    description: 'User abandoned a health goal',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'goals'
  },
  [HealthEventType.DEVICE_CONNECTED]: {
    journey: JourneyType.HEALTH,
    description: 'User connected a health device',
    defaultPoints: 20,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'devices'
  },
  [HealthEventType.DEVICE_DISCONNECTED]: {
    journey: JourneyType.HEALTH,
    description: 'User disconnected a health device',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'devices'
  },
  [HealthEventType.DEVICE_SYNC_COMPLETED]: {
    journey: JourneyType.HEALTH,
    description: 'User completed a device sync',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'devices'
  },
  [HealthEventType.HEALTH_INSIGHT_VIEWED]: {
    journey: JourneyType.HEALTH,
    description: 'User viewed a health insight',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'insights'
  },
  [HealthEventType.HEALTH_REPORT_GENERATED]: {
    journey: JourneyType.HEALTH,
    description: 'User generated a health report',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'insights'
  },
  [HealthEventType.HEALTH_REPORT_SHARED]: {
    journey: JourneyType.HEALTH,
    description: 'User shared a health report',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'insights'
  },
  [HealthEventType.DAILY_HEALTH_CHECK_COMPLETED]: {
    journey: JourneyType.HEALTH,
    description: 'User completed a daily health check',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'streaks'
  },
  [HealthEventType.WEEKLY_HEALTH_SUMMARY_VIEWED]: {
    journey: JourneyType.HEALTH,
    description: 'User viewed their weekly health summary',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'streaks'
  },
  [HealthEventType.MONTHLY_HEALTH_GOAL_ACHIEVED]: {
    journey: JourneyType.HEALTH,
    description: 'User achieved a monthly health goal',
    defaultPoints: 50,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'streaks'
  },

  // Care journey events
  [CareEventType.APPOINTMENT_BOOKED]: {
    journey: JourneyType.CARE,
    description: 'User booked an appointment',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'appointments'
  },
  [CareEventType.APPOINTMENT_ATTENDED]: {
    journey: JourneyType.CARE,
    description: 'User attended an appointment',
    defaultPoints: 20,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'appointments'
  },
  [CareEventType.APPOINTMENT_CANCELLED]: {
    journey: JourneyType.CARE,
    description: 'User cancelled an appointment',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'appointments'
  },
  [CareEventType.APPOINTMENT_RESCHEDULED]: {
    journey: JourneyType.CARE,
    description: 'User rescheduled an appointment',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'appointments'
  },
  [CareEventType.APPOINTMENT_REMINDER_ACKNOWLEDGED]: {
    journey: JourneyType.CARE,
    description: 'User acknowledged an appointment reminder',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'appointments'
  },
  [CareEventType.MEDICATION_ADDED]: {
    journey: JourneyType.CARE,
    description: 'User added a medication',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'medications'
  },
  [CareEventType.MEDICATION_TAKEN]: {
    journey: JourneyType.CARE,
    description: 'User took a medication',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'medications'
  },
  [CareEventType.MEDICATION_SKIPPED]: {
    journey: JourneyType.CARE,
    description: 'User skipped a medication',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'medications'
  },
  [CareEventType.MEDICATION_REMINDER_ACKNOWLEDGED]: {
    journey: JourneyType.CARE,
    description: 'User acknowledged a medication reminder',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'medications'
  },
  [CareEventType.MEDICATION_REFILL_REQUESTED]: {
    journey: JourneyType.CARE,
    description: 'User requested a medication refill',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'medications'
  },
  [CareEventType.PROVIDER_SEARCHED]: {
    journey: JourneyType.CARE,
    description: 'User searched for a provider',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'providers'
  },
  [CareEventType.PROVIDER_FAVORITED]: {
    journey: JourneyType.CARE,
    description: 'User favorited a provider',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'providers'
  },
  [CareEventType.PROVIDER_RATED]: {
    journey: JourneyType.CARE,
    description: 'User rated a provider',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'providers'
  },
  [CareEventType.PROVIDER_RECOMMENDED]: {
    journey: JourneyType.CARE,
    description: 'User recommended a provider',
    defaultPoints: 15,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'providers'
  },
  [CareEventType.TELEMEDICINE_SESSION_STARTED]: {
    journey: JourneyType.CARE,
    description: 'User started a telemedicine session',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'telemedicine'
  },
  [CareEventType.TELEMEDICINE_SESSION_COMPLETED]: {
    journey: JourneyType.CARE,
    description: 'User completed a telemedicine session',
    defaultPoints: 20,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'telemedicine'
  },
  [CareEventType.TELEMEDICINE_SESSION_CANCELLED]: {
    journey: JourneyType.CARE,
    description: 'User cancelled a telemedicine session',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'telemedicine'
  },
  [CareEventType.SYMPTOM_CHECKED]: {
    journey: JourneyType.CARE,
    description: 'User checked a symptom',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'symptoms'
  },
  [CareEventType.SYMPTOM_TRACKER_UPDATED]: {
    journey: JourneyType.CARE,
    description: 'User updated their symptom tracker',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'symptoms'
  },
  [CareEventType.TREATMENT_PLAN_VIEWED]: {
    journey: JourneyType.CARE,
    description: 'User viewed a treatment plan',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'treatments'
  },
  [CareEventType.TREATMENT_PLAN_COMPLETED]: {
    journey: JourneyType.CARE,
    description: 'User completed a treatment plan',
    defaultPoints: 50,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'treatments'
  },
  [CareEventType.TREATMENT_PROGRESS_UPDATED]: {
    journey: JourneyType.CARE,
    description: 'User updated treatment progress',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'treatments'
  },

  // Plan journey events
  [PlanEventType.PLAN_VIEWED]: {
    journey: JourneyType.PLAN,
    description: 'User viewed a plan',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'plans'
  },
  [PlanEventType.PLAN_COMPARED]: {
    journey: JourneyType.PLAN,
    description: 'User compared plans',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'plans'
  },
  [PlanEventType.PLAN_SELECTED]: {
    journey: JourneyType.PLAN,
    description: 'User selected a plan',
    defaultPoints: 20,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'plans'
  },
  [PlanEventType.PLAN_CHANGED]: {
    journey: JourneyType.PLAN,
    description: 'User changed their plan',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'plans'
  },
  [PlanEventType.CLAIM_SUBMITTED]: {
    journey: JourneyType.PLAN,
    description: 'User submitted a claim',
    defaultPoints: 15,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'claims'
  },
  [PlanEventType.CLAIM_UPDATED]: {
    journey: JourneyType.PLAN,
    description: 'User updated a claim',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'claims'
  },
  [PlanEventType.CLAIM_APPROVED]: {
    journey: JourneyType.PLAN,
    description: 'User had a claim approved',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'claims'
  },
  [PlanEventType.CLAIM_DENIED]: {
    journey: JourneyType.PLAN,
    description: 'User had a claim denied',
    defaultPoints: 0,
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'claims'
  },
  [PlanEventType.CLAIM_DOCUMENT_UPLOADED]: {
    journey: JourneyType.PLAN,
    description: 'User uploaded a claim document',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'claims'
  },
  [PlanEventType.BENEFIT_VIEWED]: {
    journey: JourneyType.PLAN,
    description: 'User viewed a benefit',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'benefits'
  },
  [PlanEventType.BENEFIT_USED]: {
    journey: JourneyType.PLAN,
    description: 'User used a benefit',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'benefits'
  },
  [PlanEventType.BENEFIT_SHARED]: {
    journey: JourneyType.PLAN,
    description: 'User shared a benefit',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'benefits'
  },
  [PlanEventType.COVERAGE_CHECKED]: {
    journey: JourneyType.PLAN,
    description: 'User checked coverage',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'coverage'
  },
  [PlanEventType.COVERAGE_EXPLAINED]: {
    journey: JourneyType.PLAN,
    description: 'User viewed coverage explanation',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'coverage'
  },
  [PlanEventType.DOCUMENT_DOWNLOADED]: {
    journey: JourneyType.PLAN,
    description: 'User downloaded a document',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'documents'
  },
  [PlanEventType.DOCUMENT_UPLOADED]: {
    journey: JourneyType.PLAN,
    description: 'User uploaded a document',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'documents'
  },
  [PlanEventType.DOCUMENT_SHARED]: {
    journey: JourneyType.PLAN,
    description: 'User shared a document',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'documents'
  },

  // System events
  [SystemEventType.USER_REGISTERED]: {
    journey: JourneyType.SYSTEM,
    description: 'User registered',
    defaultPoints: 50,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'user'
  },
  [SystemEventType.USER_LOGGED_IN]: {
    journey: JourneyType.SYSTEM,
    description: 'User logged in',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'user'
  },
  [SystemEventType.USER_PROFILE_COMPLETED]: {
    journey: JourneyType.SYSTEM,
    description: 'User completed their profile',
    defaultPoints: 20,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'user'
  },
  [SystemEventType.USER_PROFILE_UPDATED]: {
    journey: JourneyType.SYSTEM,
    description: 'User updated their profile',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'user'
  },
  [SystemEventType.ACHIEVEMENT_UNLOCKED]: {
    journey: JourneyType.SYSTEM,
    description: 'User unlocked an achievement',
    defaultPoints: 0, // Points are awarded by the achievement itself
    canTriggerAchievements: false,
    countsForQuests: false,
    category: 'gamification'
  },
  [SystemEventType.QUEST_STARTED]: {
    journey: JourneyType.SYSTEM,
    description: 'User started a quest',
    defaultPoints: 5,
    canTriggerAchievements: true,
    countsForQuests: false, // Doesn't count for other quests
    category: 'gamification'
  },
  [SystemEventType.QUEST_COMPLETED]: {
    journey: JourneyType.SYSTEM,
    description: 'User completed a quest',
    defaultPoints: 0, // Points are awarded by the quest itself
    canTriggerAchievements: true,
    countsForQuests: false, // Doesn't count for other quests
    category: 'gamification'
  },
  [SystemEventType.REWARD_CLAIMED]: {
    journey: JourneyType.SYSTEM,
    description: 'User claimed a reward',
    defaultPoints: 0,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'gamification'
  },
  [SystemEventType.LEVEL_UP]: {
    journey: JourneyType.SYSTEM,
    description: 'User leveled up',
    defaultPoints: 0, // Points are awarded by the level itself
    canTriggerAchievements: true,
    countsForQuests: false,
    category: 'gamification'
  },
  [SystemEventType.APP_OPENED]: {
    journey: JourneyType.SYSTEM,
    description: 'User opened the app',
    defaultPoints: 1,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'usage'
  },
  [SystemEventType.FEATURE_USED]: {
    journey: JourneyType.SYSTEM,
    description: 'User used a feature',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'usage'
  },
  [SystemEventType.FEEDBACK_SUBMITTED]: {
    journey: JourneyType.SYSTEM,
    description: 'User submitted feedback',
    defaultPoints: 10,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'usage'
  },
  [SystemEventType.NOTIFICATION_CLICKED]: {
    journey: JourneyType.SYSTEM,
    description: 'User clicked a notification',
    defaultPoints: 2,
    canTriggerAchievements: true,
    countsForQuests: true,
    category: 'usage'
  }
};

/**
 * Utility functions for working with event types
 */

/**
 * Get all event types for a specific journey
 * @param journey The journey to filter by
 * @returns Array of event types for the specified journey
 */
export function getEventTypesByJourney(journey: JourneyType): EventType[] {
  return Object.keys(EVENT_METADATA).filter(
    (eventType) => EVENT_METADATA[eventType as EventType].journey === journey
  ) as EventType[];
}

/**
 * Get all event types for a specific category within a journey
 * @param journey The journey to filter by
 * @param category The category to filter by
 * @returns Array of event types for the specified journey and category
 */
export function getEventTypesByCategory(journey: JourneyType, category: string): EventType[] {
  return Object.keys(EVENT_METADATA).filter(
    (eventType) => {
      const metadata = EVENT_METADATA[eventType as EventType];
      return metadata.journey === journey && metadata.category === category;
    }
  ) as EventType[];
}

/**
 * Check if an event type can trigger achievements
 * @param eventType The event type to check
 * @returns True if the event type can trigger achievements, false otherwise
 */
export function canTriggerAchievements(eventType: EventType): boolean {
  return EVENT_METADATA[eventType].canTriggerAchievements;
}

/**
 * Check if an event type counts towards quests
 * @param eventType The event type to check
 * @returns True if the event type counts towards quests, false otherwise
 */
export function countsForQuests(eventType: EventType): boolean {
  return EVENT_METADATA[eventType].countsForQuests;
}

/**
 * Get the default points for an event type
 * @param eventType The event type to get points for
 * @returns The default points for the event type
 */
export function getDefaultPoints(eventType: EventType): number {
  return EVENT_METADATA[eventType].defaultPoints;
}

/**
 * Get the journey for an event type
 * @param eventType The event type to get the journey for
 * @returns The journey for the event type
 */
export function getJourneyForEventType(eventType: EventType): JourneyType {
  return EVENT_METADATA[eventType].journey;
}

/**
 * Get the description for an event type
 * @param eventType The event type to get the description for
 * @returns The description for the event type
 */
export function getEventDescription(eventType: EventType): string {
  return EVENT_METADATA[eventType].description;
}

/**
 * Get the category for an event type
 * @param eventType The event type to get the category for
 * @returns The category for the event type
 */
export function getEventCategory(eventType: EventType): string {
  return EVENT_METADATA[eventType].category;
}