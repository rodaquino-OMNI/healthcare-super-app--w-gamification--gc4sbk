/**
 * @file event-schema.ts
 * @description Defines standardized event schemas for all journey-specific events processed by the gamification engine.
 * Ensures type safety and consistency in event data structure across all services.
 */

import { z } from 'zod';
import {
  GamificationEvent,
  EventType,
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload,
} from '@austa/interfaces/gamification';
import { IEventVersion, IVersionedEvent } from '@austa/interfaces/gamification/events';

// -----------------------------------------------------------------------------
// Base Event Schema
// -----------------------------------------------------------------------------

/**
 * Base event interface that all gamification events must implement.
 * Provides the core structure for events processed by the gamification engine.
 */
export interface IBaseEvent {
  /** Unique identifier for the event */
  eventId: string;
  
  /** Timestamp when the event occurred (ISO-8601 format) */
  timestamp: string;
  
  /** User ID associated with the event */
  userId: string;
  
  /** Type of event (from EventType enum) */
  type: EventType;
  
  /** Source service or component that generated the event */
  source: string;
  
  /** Journey context for the event (health, care, plan) */
  journey: 'health' | 'care' | 'plan';
  
  /** Event schema version information */
  version: IEventVersion;
  
  /** Event-specific data payload */
  payload: unknown;
  
  /** Optional metadata for tracing, debugging, etc. */
  metadata?: Record<string, unknown>;
}

/**
 * Event version interface defining the semantic versioning structure.
 * Used to track schema evolution and ensure backward compatibility.
 */
export interface IEventVersion {
  /** Major version (incremented for breaking changes) */
  major: number;
  
  /** Minor version (incremented for backward-compatible additions) */
  minor: number;
  
  /** Patch version (incremented for backward-compatible fixes) */
  patch: number;
}

// -----------------------------------------------------------------------------
// Journey-Specific Event Interfaces
// -----------------------------------------------------------------------------

/**
 * Health journey event interface.
 * Specializes the base event for health-related activities.
 */
export interface IHealthEvent extends IBaseEvent {
  journey: 'health';
  type: Extract<EventType, 
    | EventType.HEALTH_METRIC_RECORDED 
    | EventType.GOAL_ACHIEVED 
    | EventType.DEVICE_CONNECTED 
    | EventType.HEALTH_INSIGHT_GENERATED
  >;
  payload: HealthEventPayload;
}

/**
 * Care journey event interface.
 * Specializes the base event for care-related activities.
 */
export interface ICareEvent extends IBaseEvent {
  journey: 'care';
  type: Extract<EventType, 
    | EventType.APPOINTMENT_BOOKED 
    | EventType.APPOINTMENT_COMPLETED 
    | EventType.MEDICATION_ADHERENCE 
    | EventType.TELEMEDICINE_SESSION_COMPLETED 
    | EventType.CARE_PLAN_UPDATED
  >;
  payload: CareEventPayload;
}

/**
 * Plan journey event interface.
 * Specializes the base event for plan-related activities.
 */
export interface IPlanEvent extends IBaseEvent {
  journey: 'plan';
  type: Extract<EventType, 
    | EventType.CLAIM_SUBMITTED 
    | EventType.BENEFIT_UTILIZED 
    | EventType.PLAN_SELECTED 
    | EventType.REWARD_REDEEMED
  >;
  payload: PlanEventPayload;
}

/**
 * Union type of all journey-specific event interfaces.
 * Provides a comprehensive type for all events processed by the gamification engine.
 */
export type JourneyEvent = IHealthEvent | ICareEvent | IPlanEvent;

// -----------------------------------------------------------------------------
// Zod Validation Schemas
// -----------------------------------------------------------------------------

/**
 * Zod schema for event version validation.
 */
export const eventVersionSchema = z.object({
  major: z.number().int().nonnegative(),
  minor: z.number().int().nonnegative(),
  patch: z.number().int().nonnegative(),
});

/**
 * Zod schema for base event validation.
 * Validates the common structure shared by all events.
 */
export const baseEventSchema = z.object({
  eventId: z.string().uuid(),
  timestamp: z.string().datetime({ offset: true }),
  userId: z.string().uuid(),
  type: z.nativeEnum(EventType),
  source: z.string().min(1),
  journey: z.enum(['health', 'care', 'plan']),
  version: eventVersionSchema,
  payload: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Health metric recorded event payload schema.
 */
export const healthMetricRecordedSchema = z.object({
  metricType: z.enum([
    'WEIGHT', 'HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 
    'STEPS', 'SLEEP', 'CALORIES', 'WATER', 'EXERCISE'
  ]),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime({ offset: true }),
  source: z.enum(['MANUAL', 'DEVICE', 'INTEGRATION']).optional(),
  deviceId: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Goal achieved event payload schema.
 */
export const goalAchievedSchema = z.object({
  goalId: z.string().uuid(),
  goalType: z.enum([
    'STEPS', 'WEIGHT', 'EXERCISE', 'WATER', 'SLEEP', 'MEDITATION', 'CUSTOM'
  ]),
  targetValue: z.number(),
  achievedValue: z.number(),
  completedAt: z.string().datetime({ offset: true }),
  streakCount: z.number().int().nonnegative().optional(),
});

/**
 * Device connected event payload schema.
 */
export const deviceConnectedSchema = z.object({
  deviceId: z.string(),
  deviceType: z.enum([
    'SMARTWATCH', 'FITNESS_TRACKER', 'SCALE', 'BLOOD_PRESSURE_MONITOR', 
    'GLUCOSE_MONITOR', 'SLEEP_TRACKER', 'OTHER'
  ]),
  manufacturer: z.string(),
  model: z.string().optional(),
  connectionMethod: z.enum(['BLUETOOTH', 'WIFI', 'API']),
  connectedAt: z.string().datetime({ offset: true }),
});

/**
 * Health insight generated event payload schema.
 */
export const healthInsightGeneratedSchema = z.object({
  insightId: z.string().uuid(),
  insightType: z.enum([
    'TREND', 'ANOMALY', 'RECOMMENDATION', 'ACHIEVEMENT', 'ALERT'
  ]),
  relatedMetrics: z.array(z.string()).optional(),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  generatedAt: z.string().datetime({ offset: true }),
});

/**
 * Appointment booked event payload schema.
 */
export const appointmentBookedSchema = z.object({
  appointmentId: z.string().uuid(),
  providerId: z.string().uuid(),
  specialization: z.string(),
  scheduledAt: z.string().datetime({ offset: true }),
  location: z.string().optional(),
  virtual: z.boolean(),
  firstAppointment: z.boolean().optional(),
});

/**
 * Appointment completed event payload schema.
 */
export const appointmentCompletedSchema = z.object({
  appointmentId: z.string().uuid(),
  providerId: z.string().uuid(),
  completedAt: z.string().datetime({ offset: true }),
  duration: z.number().int().positive(),
  followUpRecommended: z.boolean().optional(),
});

/**
 * Medication adherence event payload schema.
 */
export const medicationAdherenceSchema = z.object({
  medicationId: z.string().uuid(),
  medicationName: z.string(),
  adherenceType: z.enum(['TAKEN', 'SKIPPED', 'MISSED']),
  scheduledTime: z.string().datetime({ offset: true }),
  actualTime: z.string().datetime({ offset: true }).optional(),
  dosage: z.string(),
  streak: z.number().int().nonnegative().optional(),
});

/**
 * Telemedicine session completed event payload schema.
 */
export const telemedicineSessionCompletedSchema = z.object({
  sessionId: z.string().uuid(),
  providerId: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  duration: z.number().int().positive(),
  successful: z.boolean(),
  technicalIssues: z.boolean().optional(),
});

/**
 * Care plan updated event payload schema.
 */
export const carePlanUpdatedSchema = z.object({
  planId: z.string().uuid(),
  updateType: z.enum(['CREATED', 'UPDATED', 'COMPLETED', 'CANCELLED']),
  updatedAt: z.string().datetime({ offset: true }),
  completionPercentage: z.number().min(0).max(100).optional(),
  addedItems: z.array(z.string()).optional(),
  removedItems: z.array(z.string()).optional(),
});

/**
 * Claim submitted event payload schema.
 */
export const claimSubmittedSchema = z.object({
  claimId: z.string().uuid(),
  claimType: z.enum([
    'MEDICAL', 'DENTAL', 'VISION', 'PHARMACY', 'OTHER'
  ]),
  amount: z.number().positive(),
  currency: z.string().length(3),
  serviceDate: z.string().datetime({ offset: true }),
  submittedAt: z.string().datetime({ offset: true }),
  provider: z.string().optional(),
  firstClaim: z.boolean().optional(),
});

/**
 * Benefit utilized event payload schema.
 */
export const benefitUtilizedSchema = z.object({
  benefitId: z.string().uuid(),
  benefitType: z.enum([
    'PREVENTIVE_CARE', 'SPECIALIST', 'EMERGENCY', 'WELLNESS', 
    'MENTAL_HEALTH', 'PHYSICAL_THERAPY', 'OTHER'
  ]),
  utilizedAt: z.string().datetime({ offset: true }),
  monetaryValue: z.number().nonnegative().optional(),
  firstTimeUsed: z.boolean().optional(),
});

/**
 * Plan selected event payload schema.
 */
export const planSelectedSchema = z.object({
  planId: z.string().uuid(),
  planType: z.enum([
    'HEALTH', 'DENTAL', 'VISION', 'COMPREHENSIVE', 'OTHER'
  ]),
  coverageLevel: z.enum([
    'INDIVIDUAL', 'COUPLE', 'FAMILY', 'OTHER'
  ]),
  selectedAt: z.string().datetime({ offset: true }),
  effectiveDate: z.string().date(),
  annualCost: z.number().nonnegative(),
  previousPlan: z.string().uuid().optional(),
});

/**
 * Reward redeemed event payload schema.
 */
export const rewardRedeemedSchema = z.object({
  rewardId: z.string().uuid(),
  rewardType: z.enum([
    'DISCOUNT', 'GIFT_CARD', 'PHYSICAL_ITEM', 'DIGITAL_ITEM', 
    'EXPERIENCE', 'DONATION', 'OTHER'
  ]),
  pointsUsed: z.number().int().positive(),
  redeemedAt: z.string().datetime({ offset: true }),
  monetaryValue: z.number().nonnegative().optional(),
  shippingRequired: z.boolean().optional(),
});

// -----------------------------------------------------------------------------
// Journey-Specific Event Schemas
// -----------------------------------------------------------------------------

/**
 * Health event schema mapping event types to their payload schemas.
 */
export const healthEventSchemas = {
  [EventType.HEALTH_METRIC_RECORDED]: healthMetricRecordedSchema,
  [EventType.GOAL_ACHIEVED]: goalAchievedSchema,
  [EventType.DEVICE_CONNECTED]: deviceConnectedSchema,
  [EventType.HEALTH_INSIGHT_GENERATED]: healthInsightGeneratedSchema,
};

/**
 * Care event schema mapping event types to their payload schemas.
 */
export const careEventSchemas = {
  [EventType.APPOINTMENT_BOOKED]: appointmentBookedSchema,
  [EventType.APPOINTMENT_COMPLETED]: appointmentCompletedSchema,
  [EventType.MEDICATION_ADHERENCE]: medicationAdherenceSchema,
  [EventType.TELEMEDICINE_SESSION_COMPLETED]: telemedicineSessionCompletedSchema,
  [EventType.CARE_PLAN_UPDATED]: carePlanUpdatedSchema,
};

/**
 * Plan event schema mapping event types to their payload schemas.
 */
export const planEventSchemas = {
  [EventType.CLAIM_SUBMITTED]: claimSubmittedSchema,
  [EventType.BENEFIT_UTILIZED]: benefitUtilizedSchema,
  [EventType.PLAN_SELECTED]: planSelectedSchema,
  [EventType.REWARD_REDEEMED]: rewardRedeemedSchema,
};

/**
 * Combined event schema mapping all event types to their payload schemas.
 */
export const eventSchemas = {
  ...healthEventSchemas,
  ...careEventSchemas,
  ...planEventSchemas,
};

// -----------------------------------------------------------------------------
// Validation Functions
// -----------------------------------------------------------------------------

/**
 * Validates an event against its schema based on event type.
 * @param event The event to validate
 * @returns A validation result with success/error information
 */
export function validateEvent(event: IBaseEvent): { 
  valid: boolean; 
  errors?: z.ZodError; 
} {
  try {
    // Validate base event structure
    baseEventSchema.parse(event);
    
    // Get the appropriate schema for the event type
    const payloadSchema = eventSchemas[event.type];
    if (!payloadSchema) {
      throw new Error(`No schema defined for event type: ${event.type}`);
    }
    
    // Validate the payload
    payloadSchema.parse(event.payload);
    
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    throw error;
  }
}

/**
 * Checks if an event is compatible with the current schema version.
 * @param event The event to check for compatibility
 * @returns Boolean indicating if the event is compatible
 */
export function isEventVersionCompatible(event: IVersionedEvent): boolean {
  // Current schema version
  const currentVersion = { major: 1, minor: 0, patch: 0 };
  
  // Check if the event version is compatible with current schema
  // Major version must match, minor and patch can be lower or equal
  return (
    event.version.major === currentVersion.major &&
    event.version.minor <= currentVersion.minor
  );
}

/**
 * Type guard to check if an event is a health event.
 * @param event The event to check
 * @returns Boolean indicating if the event is a health event
 */
export function isHealthEvent(event: IBaseEvent): event is IHealthEvent {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is a care event.
 * @param event The event to check
 * @returns Boolean indicating if the event is a care event
 */
export function isCareEvent(event: IBaseEvent): event is ICareEvent {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is a plan event.
 * @param event The event to check
 * @returns Boolean indicating if the event is a plan event
 */
export function isPlanEvent(event: IBaseEvent): event is IPlanEvent {
  return event.journey === 'plan';
}

/**
 * Creates a new event with the current schema version.
 * @param eventData Partial event data to create a new event
 * @returns A complete event with the current schema version
 */
export function createEvent<T extends Omit<IBaseEvent, 'version' | 'eventId' | 'timestamp'>>(
  eventData: T
): IBaseEvent & T & { version: IEventVersion } {
  return {
    ...eventData,
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: 0, patch: 0 },
  };
}

// -----------------------------------------------------------------------------
// Export Event Types
// -----------------------------------------------------------------------------

/**
 * Re-export types from @austa/interfaces for convenience
 */
export { EventType, GamificationEvent };

/**
 * Export all event-related types and schemas
 */
export type {
  IBaseEvent,
  IEventVersion,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  JourneyEvent,
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload,
  IVersionedEvent,
};