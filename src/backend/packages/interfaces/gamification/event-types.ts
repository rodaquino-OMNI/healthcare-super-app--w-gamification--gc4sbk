/**
 * @file event-types.ts
 * @description Defines TypeScript enums and types for gamification event types.
 * This file provides a standardized set of event types for all journeys in the AUSTA SuperApp.
 *
 * This file is part of the @austa/interfaces package and is used by both the gamification engine
 * and other services that need to produce or consume gamification events.
 */

/**
 * Health journey event types.
 * These events are triggered by user actions in the Health journey.
 */
export enum HealthEventType {
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_UPDATED = 'GOAL_UPDATED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  HEALTH_INSIGHT_VIEWED = 'HEALTH_INSIGHT_VIEWED',
  MEDICAL_EVENT_RECORDED = 'MEDICAL_EVENT_RECORDED'
}

/**
 * Care journey event types.
 * These events are triggered by user actions in the Care journey.
 */
export enum CareEventType {
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_ATTENDED = 'APPOINTMENT_ATTENDED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_SKIPPED = 'MEDICATION_SKIPPED',
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  SYMPTOM_CHECKED = 'SYMPTOM_CHECKED',
  TREATMENT_PLAN_CREATED = 'TREATMENT_PLAN_CREATED',
  TREATMENT_PLAN_COMPLETED = 'TREATMENT_PLAN_COMPLETED'
}

/**
 * Plan journey event types.
 * These events are triggered by user actions in the Plan journey.
 */
export enum PlanEventType {
  PLAN_VIEWED = 'PLAN_VIEWED',
  BENEFIT_VIEWED = 'BENEFIT_VIEWED',
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  COVERAGE_CHECKED = 'COVERAGE_CHECKED',
  PLAN_COMPARED = 'PLAN_COMPARED',
  PLAN_SELECTED = 'PLAN_SELECTED'
}

/**
 * Common event types that are not specific to any journey.
 * These events are typically system-generated or cross-journey events.
 */
export enum CommonEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  NOTIFICATION_VIEWED = 'NOTIFICATION_VIEWED',
  FEEDBACK_SUBMITTED = 'FEEDBACK_SUBMITTED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  QUEST_COMPLETED = 'QUEST_COMPLETED'
}

/**
 * Union type of all possible event types in the system
 */
export type EventType = 
  | HealthEventType 
  | CareEventType 
  | PlanEventType 
  | CommonEventType;

/**
 * Type guard to check if an event type is a health event type.
 * @param type The event type to check
 * @returns True if the event type is a health event type
 */
export function isHealthEventType(type: EventType): type is HealthEventType {
  return Object.values(HealthEventType).includes(type as HealthEventType);
}

/**
 * Type guard to check if an event type is a care event type.
 * @param type The event type to check
 * @returns True if the event type is a care event type
 */
export function isCareEventType(type: EventType): type is CareEventType {
  return Object.values(CareEventType).includes(type as CareEventType);
}

/**
 * Type guard to check if an event type is a plan event type.
 * @param type The event type to check
 * @returns True if the event type is a plan event type
 */
export function isPlanEventType(type: EventType): type is PlanEventType {
  return Object.values(PlanEventType).includes(type as PlanEventType);
}

/**
 * Type guard to check if an event type is a common event type.
 * @param type The event type to check
 * @returns True if the event type is a common event type
 */
export function isCommonEventType(type: EventType): type is CommonEventType {
  return Object.values(CommonEventType).includes(type as CommonEventType);
}

/**
 * Gets the journey for an event type.
 * @param eventType The event type
 * @returns The journey for the event type, or undefined if it's a common event type
 */
export function getJourneyForEventType(eventType: EventType): 'health' | 'care' | 'plan' | undefined {
  if (isHealthEventType(eventType)) {
    return 'health';
  } else if (isCareEventType(eventType)) {
    return 'care';
  } else if (isPlanEventType(eventType)) {
    return 'plan';
  }
  return undefined;
}