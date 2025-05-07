/**
 * TypeScript interfaces and type utilities for event type categorization and validation.
 * 
 * This file provides type-safe representation of event types organized by journey,
 * enabling proper type checking and auto-completion throughout the codebase.
 */

import { 
  HealthEventType, 
  CareEventType, 
  PlanEventType 
} from './journey-events.interface';

/**
 * Interface for event type categorization
 */
export interface IEventType {
  /**
   * The event type identifier
   */
  type: string;

  /**
   * The journey this event type belongs to
   */
  journey: 'health' | 'care' | 'plan';

  /**
   * Description of the event type
   */
  description: string;

  /**
   * Whether this event type is enabled
   */
  enabled: boolean;

  /**
   * The points awarded for this event type by default
   */
  defaultPoints: number;
}

/**
 * Interface for health journey event types
 */
export interface IHealthEventType extends IEventType {
  journey: 'health';
  type: HealthEventType;
}

/**
 * Interface for care journey event types
 */
export interface ICareEventType extends IEventType {
  journey: 'care';
  type: CareEventType;
}

/**
 * Interface for plan journey event types
 */
export interface IPlanEventType extends IEventType {
  journey: 'plan';
  type: PlanEventType;
}

/**
 * Union type of all journey event types
 */
export type JourneyEventType = IHealthEventType | ICareEventType | IPlanEventType;

/**
 * Type guard to check if an event type is a health event type
 * @param eventType The event type to check
 * @returns True if the event type is a health event type
 */
export function isHealthEventType(eventType: JourneyEventType): eventType is IHealthEventType {
  return eventType.journey === 'health';
}

/**
 * Type guard to check if an event type is a care event type
 * @param eventType The event type to check
 * @returns True if the event type is a care event type
 */
export function isCareEventType(eventType: JourneyEventType): eventType is ICareEventType {
  return eventType.journey === 'care';
}

/**
 * Type guard to check if an event type is a plan event type
 * @param eventType The event type to check
 * @returns True if the event type is a plan event type
 */
export function isPlanEventType(eventType: JourneyEventType): eventType is IPlanEventType {
  return eventType.journey === 'plan';
}

/**
 * Predefined event types for the health journey
 */
export const HEALTH_EVENT_TYPES: IHealthEventType[] = [
  {
    type: HealthEventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    description: 'User recorded a health metric',
    enabled: true,
    defaultPoints: 5
  },
  {
    type: HealthEventType.GOAL_ACHIEVED,
    journey: 'health',
    description: 'User achieved a health goal',
    enabled: true,
    defaultPoints: 20
  },
  {
    type: HealthEventType.GOAL_PROGRESS_UPDATED,
    journey: 'health',
    description: 'User made progress towards a health goal',
    enabled: true,
    defaultPoints: 2
  },
  {
    type: HealthEventType.DEVICE_CONNECTED,
    journey: 'health',
    description: 'User connected a health device',
    enabled: true,
    defaultPoints: 10
  },
  {
    type: HealthEventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    description: 'Health insight was generated for the user',
    enabled: true,
    defaultPoints: 3
  }
];

/**
 * Predefined event types for the care journey
 */
export const CARE_EVENT_TYPES: ICareEventType[] = [
  {
    type: CareEventType.APPOINTMENT_BOOKED,
    journey: 'care',
    description: 'User booked a medical appointment',
    enabled: true,
    defaultPoints: 10
  },
  {
    type: CareEventType.APPOINTMENT_COMPLETED,
    journey: 'care',
    description: 'User completed a medical appointment',
    enabled: true,
    defaultPoints: 15
  },
  {
    type: CareEventType.MEDICATION_TAKEN,
    journey: 'care',
    description: 'User logged taking medication',
    enabled: true,
    defaultPoints: 5
  },
  {
    type: CareEventType.MEDICATION_ADHERENCE_STREAK,
    journey: 'care',
    description: 'User maintained a medication adherence streak',
    enabled: true,
    defaultPoints: 10
  },
  {
    type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    journey: 'care',
    description: 'User completed a telemedicine session',
    enabled: true,
    defaultPoints: 20
  },
  {
    type: CareEventType.SYMPTOM_CHECKED,
    journey: 'care',
    description: 'User checked symptoms',
    enabled: true,
    defaultPoints: 5
  }
];

/**
 * Predefined event types for the plan journey
 */
export const PLAN_EVENT_TYPES: IPlanEventType[] = [
  {
    type: PlanEventType.CLAIM_SUBMITTED,
    journey: 'plan',
    description: 'User submitted an insurance claim',
    enabled: true,
    defaultPoints: 15
  },
  {
    type: PlanEventType.CLAIM_APPROVED,
    journey: 'plan',
    description: 'User had an insurance claim approved',
    enabled: true,
    defaultPoints: 10
  },
  {
    type: PlanEventType.BENEFIT_UTILIZED,
    journey: 'plan',
    description: 'User utilized an insurance benefit',
    enabled: true,
    defaultPoints: 10
  },
  {
    type: PlanEventType.PLAN_SELECTED,
    journey: 'plan',
    description: 'User selected an insurance plan',
    enabled: true,
    defaultPoints: 20
  },
  {
    type: PlanEventType.DOCUMENT_UPLOADED,
    journey: 'plan',
    description: 'User uploaded a document',
    enabled: true,
    defaultPoints: 5
  }
];

/**
 * All predefined event types
 */
export const ALL_EVENT_TYPES: JourneyEventType[] = [
  ...HEALTH_EVENT_TYPES,
  ...CARE_EVENT_TYPES,
  ...PLAN_EVENT_TYPES
];

/**
 * Gets an event type by its type string
 * @param type The event type string
 * @returns The event type object or undefined if not found
 */
export function getEventTypeByType(type: string): JourneyEventType | undefined {
  return ALL_EVENT_TYPES.find(eventType => eventType.type === type);
}

/**
 * Gets all event types for a specific journey
 * @param journey The journey to get event types for
 * @returns An array of event types for the specified journey
 */
export function getEventTypesByJourney(journey: 'health' | 'care' | 'plan'): JourneyEventType[] {
  return ALL_EVENT_TYPES.filter(eventType => eventType.journey === journey);
}