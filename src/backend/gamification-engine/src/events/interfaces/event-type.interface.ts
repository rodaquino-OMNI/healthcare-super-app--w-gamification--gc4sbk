/**
 * @file event-type.interface.ts
 * @description Defines TypeScript interfaces and type utilities for event type categorization and validation.
 * Provides type-safe representation of event types organized by journey, enabling proper type checking
 * and auto-completion throughout the codebase.
 */

/**
 * Base interface for event types across all journeys.
 * Provides a standardized structure for defining event types with journey context.
 */
export interface IEventType {
  /** Unique identifier for the event type */
  readonly type: string;
  /** The journey this event belongs to (health, care, plan) */
  readonly journey: 'health' | 'care' | 'plan' | 'system';
  /** Human-readable description of the event */
  readonly description: string;
  /** Version of the event schema (for backward compatibility) */
  readonly version: string;
}

/**
 * Enum defining all possible event types for the Health journey.
 * These events are triggered by user actions in the Health journey.
 */
export enum HealthEventType {
  /** Triggered when a user records a new health metric (weight, blood pressure, etc.) */
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  /** Triggered when a user achieves a health goal */
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  /** Triggered when a user sets a new health goal */
  GOAL_CREATED = 'GOAL_CREATED',
  /** Triggered when a user connects a new health device */
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  /** Triggered when a user completes a health assessment */
  HEALTH_ASSESSMENT_COMPLETED = 'HEALTH_ASSESSMENT_COMPLETED',
  /** Triggered when a user logs a medical event */
  MEDICAL_EVENT_LOGGED = 'MEDICAL_EVENT_LOGGED',
  /** Triggered when a user syncs data from a health device */
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  /** Triggered when a user completes a streak of daily health activities */
  HEALTH_STREAK_COMPLETED = 'HEALTH_STREAK_COMPLETED',
}

/**
 * Enum defining all possible event types for the Care journey.
 * These events are triggered by user actions in the Care journey.
 */
export enum CareEventType {
  /** Triggered when a user books a medical appointment */
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  /** Triggered when a user completes a medical appointment */
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  /** Triggered when a user logs taking medication */
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  /** Triggered when a user adds a new medication to their profile */
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  /** Triggered when a user completes a telemedicine session */
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  /** Triggered when a user completes a symptom check */
  SYMPTOM_CHECK_COMPLETED = 'SYMPTOM_CHECK_COMPLETED',
  /** Triggered when a user adds a new provider to their profile */
  PROVIDER_ADDED = 'PROVIDER_ADDED',
  /** Triggered when a user completes a treatment plan step */
  TREATMENT_STEP_COMPLETED = 'TREATMENT_STEP_COMPLETED',
}

/**
 * Enum defining all possible event types for the Plan journey.
 * These events are triggered by user actions in the Plan journey.
 */
export enum PlanEventType {
  /** Triggered when a user submits an insurance claim */
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  /** Triggered when a user's claim is approved */
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  /** Triggered when a user uploads a document for a claim */
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  /** Triggered when a user views their benefits */
  BENEFITS_VIEWED = 'BENEFITS_VIEWED',
  /** Triggered when a user enrolls in a new plan */
  PLAN_ENROLLED = 'PLAN_ENROLLED',
  /** Triggered when a user compares different plans */
  PLANS_COMPARED = 'PLANS_COMPARED',
  /** Triggered when a user utilizes a benefit */
  BENEFIT_UTILIZED = 'BENEFIT_UTILIZED',
  /** Triggered when a user completes their coverage profile */
  COVERAGE_PROFILE_COMPLETED = 'COVERAGE_PROFILE_COMPLETED',
}

/**
 * Enum defining system-level event types that are not specific to any journey.
 * These events are typically triggered by the system or cross-journey actions.
 */
export enum SystemEventType {
  /** Triggered when a user completes their profile */
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  /** Triggered when a user logs in */
  USER_LOGIN = 'USER_LOGIN',
  /** Triggered when a user refers another user */
  USER_REFERRAL = 'USER_REFERRAL',
  /** Triggered when a user completes onboarding */
  ONBOARDING_COMPLETED = 'ONBOARDING_COMPLETED',
  /** Triggered when a user earns a badge */
  BADGE_EARNED = 'BADGE_EARNED',
  /** Triggered when a user levels up */
  LEVEL_UP = 'LEVEL_UP',
  /** Triggered when a user completes a quest */
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  /** Triggered when a user unlocks an achievement */
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
}

/**
 * Union type of all event types across all journeys.
 * This provides a comprehensive type for all possible event types in the system.
 */
export type EventType = 
  | HealthEventType
  | CareEventType
  | PlanEventType
  | SystemEventType;

/**
 * Interface for Health journey event types with specific metadata.
 */
export interface IHealthEventType extends IEventType {
  readonly type: HealthEventType;
  readonly journey: 'health';
  /** Specific metadata for health events */
  readonly metricType?: string;
  readonly goalType?: string;
}

/**
 * Interface for Care journey event types with specific metadata.
 */
export interface ICareEventType extends IEventType {
  readonly type: CareEventType;
  readonly journey: 'care';
  /** Specific metadata for care events */
  readonly appointmentType?: string;
  readonly providerType?: string;
}

/**
 * Interface for Plan journey event types with specific metadata.
 */
export interface IPlanEventType extends IEventType {
  readonly type: PlanEventType;
  readonly journey: 'plan';
  /** Specific metadata for plan events */
  readonly claimType?: string;
  readonly benefitType?: string;
}

/**
 * Interface for System event types with specific metadata.
 */
export interface ISystemEventType extends IEventType {
  readonly type: SystemEventType;
  readonly journey: 'system';
  /** Specific metadata for system events */
  readonly source?: string;
  readonly priority?: 'low' | 'medium' | 'high';
}

/**
 * Union type of all journey-specific event type interfaces.
 * This provides a comprehensive type for all possible event type objects in the system.
 */
export type JourneyEventType = 
  | IHealthEventType
  | ICareEventType
  | IPlanEventType
  | ISystemEventType;

/**
 * Type guard to check if an event type belongs to the Health journey.
 * @param eventType The event type to check
 * @returns True if the event type belongs to the Health journey
 */
export function isHealthEventType(eventType: string): eventType is HealthEventType {
  return Object.values(HealthEventType).includes(eventType as HealthEventType);
}

/**
 * Type guard to check if an event type belongs to the Care journey.
 * @param eventType The event type to check
 * @returns True if the event type belongs to the Care journey
 */
export function isCareEventType(eventType: string): eventType is CareEventType {
  return Object.values(CareEventType).includes(eventType as CareEventType);
}

/**
 * Type guard to check if an event type belongs to the Plan journey.
 * @param eventType The event type to check
 * @returns True if the event type belongs to the Plan journey
 */
export function isPlanEventType(eventType: string): eventType is PlanEventType {
  return Object.values(PlanEventType).includes(eventType as PlanEventType);
}

/**
 * Type guard to check if an event type belongs to the System category.
 * @param eventType The event type to check
 * @returns True if the event type belongs to the System category
 */
export function isSystemEventType(eventType: string): eventType is SystemEventType {
  return Object.values(SystemEventType).includes(eventType as SystemEventType);
}

/**
 * Determines the journey for a given event type.
 * @param eventType The event type to check
 * @returns The journey the event type belongs to, or undefined if not found
 */
export function getJourneyForEventType(eventType: string): 'health' | 'care' | 'plan' | 'system' | undefined {
  if (isHealthEventType(eventType)) return 'health';
  if (isCareEventType(eventType)) return 'care';
  if (isPlanEventType(eventType)) return 'plan';
  if (isSystemEventType(eventType)) return 'system';
  return undefined;
}

/**
 * Creates a fully typed event type object with all required metadata.
 * @param type The event type
 * @param description Human-readable description of the event
 * @param version Version of the event schema
 * @param metadata Additional metadata for the event type
 * @returns A fully typed event type object
 */
export function createEventType<T extends EventType>(
  type: T,
  description: string,
  version: string = '1.0.0',
  metadata: Record<string, any> = {}
): JourneyEventType {
  const journey = getJourneyForEventType(type);
  
  if (!journey) {
    throw new Error(`Unknown event type: ${type}`);
  }
  
  return {
    type,
    journey,
    description,
    version,
    ...metadata,
  } as JourneyEventType;
}