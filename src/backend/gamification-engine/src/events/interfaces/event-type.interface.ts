/**
 * @file event-type.interface.ts
 * @description Defines TypeScript interfaces and type utilities for event type categorization and validation.
 * Provides type-safe representation of event types organized by journey, enabling proper type checking
 * and auto-completion throughout the codebase.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Create comprehensive event type definitions
 * - Integrate with @austa/interfaces package for standardized schema definitions
 * - Establish event versioning strategy
 *
 * @example
 * // Using event type enums for type safety
 * function processHealthEvent(eventType: HealthEventType) {
 *   if (eventType === HealthEventType.HEALTH_METRIC_RECORDED) {
 *     // Process health metric event
 *   } else if (eventType === HealthEventType.GOAL_ACHIEVED) {
 *     // Process goal achievement event
 *   }
 * }
 *
 * @example
 * // Using type guards for runtime validation
 * function processEvent(eventTypeId: string) {
 *   if (isHealthEventTypeId(eventTypeId)) {
 *     // It's a health event
 *     processHealthEvent(eventTypeId);
 *   } else if (isCareEventTypeId(eventTypeId)) {
 *     // It's a care event
 *     processCareEvent(eventTypeId);
 *   }
 * }
 */

// Import interfaces from @austa/interfaces package for standardized schema definitions
import { IBaseEvent } from '@austa/interfaces/gamification';
import { IHealthGoal, MetricType } from '@austa/interfaces/journey/health';
import { AppointmentType } from '@austa/interfaces/journey/care';
import { ClaimStatus } from '@austa/interfaces/journey/plan';

/**
 * Base interface for all event types in the gamification system.
 * Provides a standardized structure for event type identification and metadata.
 */
export interface IEventType {
  /** Unique identifier for the event type */
  readonly id: string;
  
  /** Human-readable name of the event type */
  readonly name: string;
  
  /** Optional description of the event type */
  readonly description?: string;
  
  /** The journey this event type belongs to */
  readonly journey: 'health' | 'care' | 'plan' | 'common';
  
  /** Version of the event type schema */
  readonly version: string;
  
  /** Points awarded for this event type */
  readonly points: number;
  
  /** Whether this event type is deprecated */
  readonly deprecated?: boolean;
}

/**
 * Health journey event types.
 * These events are triggered by user actions in the Health journey.
 */
export interface IHealthEventType extends IEventType {
  readonly journey: 'health';
}

/**
 * Care journey event types.
 * These events are triggered by user actions in the Care journey.
 */
export interface ICareEventType extends IEventType {
  readonly journey: 'care';
}

/**
 * Plan journey event types.
 * These events are triggered by user actions in the Plan journey.
 */
export interface IPlanEventType extends IEventType {
  readonly journey: 'plan';
}

/**
 * Common event types that are not specific to any journey.
 * These events are typically system-generated or cross-journey events.
 */
export interface ICommonEventType extends IEventType {
  readonly journey: 'common';
}

/**
 * Union type of all event types.
 * Use this type when you need to accept any valid event type.
 */
export type EventType = 
  | IHealthEventType 
  | ICareEventType 
  | IPlanEventType 
  | ICommonEventType;

/**
 * Interface for event type validation against ProcessEventDto.
 * This interface ensures that event types are compatible with the event processing pipeline.
 */
export interface IEventTypeValidator {
  /**
   * Validates an event against its declared type.
   * @param eventType The event type to validate against
   * @param event The event data from ProcessEventDto
   * @returns True if the event is valid for the given type
   */
  validate(eventType: EventType, event: {
    type: string;
    userId: string;
    data: object;
    journey?: string;
  }): boolean;
}

/**
 * Enum of all health journey event type IDs.
 * Use this for type-safe reference to health event types.
 */
export enum HealthEventType {
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_UPDATED = 'GOAL_UPDATED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  HEALTH_INSIGHT_VIEWED = 'HEALTH_INSIGHT_VIEWED',
  MEDICAL_EVENT_RECORDED = 'MEDICAL_EVENT_RECORDED',
}

/**
 * Enum of all care journey event type IDs.
 * Use this for type-safe reference to care event types.
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
  TREATMENT_PLAN_COMPLETED = 'TREATMENT_PLAN_COMPLETED',
}

/**
 * Enum of all plan journey event type IDs.
 * Use this for type-safe reference to plan event types.
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
  PLAN_SELECTED = 'PLAN_SELECTED',
}

/**
 * Enum of all common event type IDs.
 * Use this for type-safe reference to common event types.
 */
export enum CommonEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  NOTIFICATION_VIEWED = 'NOTIFICATION_VIEWED',
  FEEDBACK_SUBMITTED = 'FEEDBACK_SUBMITTED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
}

/**
 * Union type of all event type IDs.
 * Use this when you need a type that represents any valid event type ID.
 */
export type EventTypeId = 
  | HealthEventType 
  | CareEventType 
  | PlanEventType 
  | CommonEventType;

/**
 * Type guard to check if an event type is a health event type.
 * @param eventType The event type to check
 * @returns True if the event type is a health event type
 */
export function isHealthEventType(eventType: IEventType): eventType is IHealthEventType {
  return eventType.journey === 'health';
}

/**
 * Type guard to check if an event type is a care event type.
 * @param eventType The event type to check
 * @returns True if the event type is a care event type
 */
export function isCareEventType(eventType: IEventType): eventType is ICareEventType {
  return eventType.journey === 'care';
}

/**
 * Type guard to check if an event type is a plan event type.
 * @param eventType The event type to check
 * @returns True if the event type is a plan event type
 */
export function isPlanEventType(eventType: IEventType): eventType is IPlanEventType {
  return eventType.journey === 'plan';
}

/**
 * Type guard to check if an event type is a common event type.
 * @param eventType The event type to check
 * @returns True if the event type is a common event type
 */
export function isCommonEventType(eventType: IEventType): eventType is ICommonEventType {
  return eventType.journey === 'common';
}

/**
 * Type guard to check if a string is a valid health event type ID.
 * @param type The string to check
 * @returns True if the string is a valid health event type ID
 */
export function isHealthEventTypeId(type: string): type is HealthEventType {
  return Object.values(HealthEventType).includes(type as HealthEventType);
}

/**
 * Type guard to check if a string is a valid care event type ID.
 * @param type The string to check
 * @returns True if the string is a valid care event type ID
 */
export function isCareEventTypeId(type: string): type is CareEventType {
  return Object.values(CareEventType).includes(type as CareEventType);
}

/**
 * Type guard to check if a string is a valid plan event type ID.
 * @param type The string to check
 * @returns True if the string is a valid plan event type ID
 */
export function isPlanEventTypeId(type: string): type is PlanEventType {
  return Object.values(PlanEventType).includes(type as PlanEventType);
}

/**
 * Type guard to check if a string is a valid common event type ID.
 * @param type The string to check
 * @returns True if the string is a valid common event type ID
 */
export function isCommonEventTypeId(type: string): type is CommonEventType {
  return Object.values(CommonEventType).includes(type as CommonEventType);
}

/**
 * Type guard to check if a string is a valid event type ID.
 * @param type The string to check
 * @returns True if the string is a valid event type ID
 */
export function isEventTypeId(type: string): type is EventTypeId {
  return (
    isHealthEventTypeId(type) ||
    isCareEventTypeId(type) ||
    isPlanEventTypeId(type) ||
    isCommonEventTypeId(type)
  );
}

/**
 * Maps a journey name to its corresponding event type enum.
 * @param journey The journey name
 * @returns The event type enum for the journey
 */
export function getEventTypeEnumForJourney(journey: string): typeof HealthEventType | typeof CareEventType | typeof PlanEventType | typeof CommonEventType {
  switch (journey) {
    case 'health':
      return HealthEventType;
    case 'care':
      return CareEventType;
    case 'plan':
      return PlanEventType;
    case 'common':
    default:
      return CommonEventType;
  }
}

/**
 * Gets the journey for an event type ID.
 * @param eventTypeId The event type ID
 * @returns The journey for the event type ID
 */
export function getJourneyForEventTypeId(eventTypeId: EventTypeId): 'health' | 'care' | 'plan' | 'common' {
  if (isHealthEventTypeId(eventTypeId)) {
    return 'health';
  } else if (isCareEventTypeId(eventTypeId)) {
    return 'care';
  } else if (isPlanEventTypeId(eventTypeId)) {
    return 'plan';
  } else {
    return 'common';
  }
}

/**
 * Interface for health metric recorded event payload.
 * This is used with the HEALTH_METRIC_RECORDED event type.
 */
export interface IHealthMetricRecordedPayload {
  /** The type of health metric recorded */
  metricType: MetricType;
  /** The value of the health metric */
  value: number;
  /** The unit of measurement for the health metric */
  unit: string;
  /** Optional source of the health metric */
  source?: string;
  /** Optional timestamp when the metric was recorded */
  recordedAt?: string | Date;
}

/**
 * Interface for goal achieved event payload.
 * This is used with the GOAL_ACHIEVED event type.
 */
export interface IGoalAchievedPayload {
  /** The ID of the goal that was achieved */
  goalId: string;
  /** The goal that was achieved */
  goal: IHealthGoal;
  /** The timestamp when the goal was achieved */
  achievedAt: string | Date;
}

/**
 * Interface for appointment booked event payload.
 * This is used with the APPOINTMENT_BOOKED event type.
 */
export interface IAppointmentBookedPayload {
  /** The ID of the appointment that was booked */
  appointmentId: string;
  /** The type of appointment */
  appointmentType: AppointmentType;
  /** The ID of the provider for the appointment */
  providerId: string;
  /** The scheduled date and time for the appointment */
  scheduledAt: string | Date;
}

/**
 * Interface for claim submitted event payload.
 * This is used with the CLAIM_SUBMITTED event type.
 */
export interface IClaimSubmittedPayload {
  /** The ID of the claim that was submitted */
  claimId: string;
  /** The amount of the claim */
  amount: number;
  /** The status of the claim */
  status: ClaimStatus;
  /** The timestamp when the claim was submitted */
  submittedAt: string | Date;
}

/**
 * Interface for a registry of event types.
 * This can be used to store and retrieve event type definitions.
 */
export interface IEventTypeRegistry {
  /**
   * Gets an event type by its ID.
   * @param id The event type ID
   * @returns The event type, or undefined if not found
   */
  getEventType(id: EventTypeId): EventType | undefined;
  
  /**
   * Gets all event types for a journey.
   * @param journey The journey
   * @returns An array of event types for the journey
   */
  getEventTypesForJourney(journey: 'health' | 'care' | 'plan' | 'common'): EventType[];
  
  /**
   * Gets all event types.
   * @returns An array of all event types
   */
  getAllEventTypes(): EventType[];
  
  /**
   * Registers an event type.
   * @param eventType The event type to register
   */
  registerEventType(eventType: EventType): void;
  
  /**
   * Gets an event type by its ID and version.
   * @param id The event type ID
   * @param version The event type version
   * @returns The event type, or undefined if not found
   */
  getEventTypeVersion(id: EventTypeId, version: string): EventType | undefined;
}

/**
 * Semantic version interface for event types.
 * This is used to track and manage event type versions.
 */
export interface IEventTypeVersion {
  /** Major version number (incremented for breaking changes) */
  major: number;
  /** Minor version number (incremented for backward-compatible additions) */
  minor: number;
  /** Patch version number (incremented for backward-compatible fixes) */
  patch: number;
  /** Full version string in semver format (e.g., "1.2.3") */
  toString(): string;
}

/**
 * Creates a new event type version object.
 * @param versionString The version string in semver format (e.g., "1.2.3")
 * @returns An IEventTypeVersion object
 */
export function createEventTypeVersion(versionString: string): IEventTypeVersion {
  const parts = versionString.split('.');
  const major = parseInt(parts[0] || '0', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const patch = parseInt(parts[2] || '0', 10);
  
  return {
    major,
    minor,
    patch,
    toString: () => `${major}.${minor}.${patch}`
  };
}

/**
 * Compares two event type versions.
 * @param a The first version
 * @param b The second version
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareEventTypeVersions(a: IEventTypeVersion, b: IEventTypeVersion): -1 | 0 | 1 {
  if (a.major < b.major) return -1;
  if (a.major > b.major) return 1;
  if (a.minor < b.minor) return -1;
  if (a.minor > b.minor) return 1;
  if (a.patch < b.patch) return -1;
  if (a.patch > b.patch) return 1;
  return 0;
}

/**
 * Checks if an event type version is compatible with a required version.
 * @param actual The actual version
 * @param required The required version
 * @returns True if the actual version is compatible with the required version
 */
export function isCompatibleEventTypeVersion(actual: IEventTypeVersion, required: IEventTypeVersion): boolean {
  // Major version must match exactly for compatibility
  if (actual.major !== required.major) return false;
  
  // Actual minor version must be greater than or equal to required
  if (actual.minor < required.minor) return false;
  
  // If minor versions match, actual patch must be greater than or equal to required
  if (actual.minor === required.minor && actual.patch < required.patch) return false;
  
  return true;
}