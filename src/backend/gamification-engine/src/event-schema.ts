import { z } from 'zod'; // zod@3.22.4

/**
 * @file event-schema.ts
 * @description Defines standardized event schemas for all journey-specific events processed by the gamification engine.
 * Ensures type safety and consistency in event data structure across all services.
 * 
 * This file implements:
 * 1. Type-safe event schema definitions for all journeys
 * 2. Standardized event schemas across all services
 * 3. Event versioning strategy with backward compatibility
 * 4. Comprehensive documentation for all event types
 * 
 * @version 1.0.0
 */

/**
 * Enum representing the three main journeys in the AUSTA SuperApp
 */
export enum Journey {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global'
}

/**
 * Enum for event schema versions to support backward compatibility
 */
export enum EventSchemaVersion {
  V1 = '1.0.0',
  V1_1 = '1.1.0',
  LATEST = '1.1.0'
}

/**
 * Health Journey Event Types
 */
export enum HealthEventType {
  // Metrics
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_METRIC_UPDATED = 'HEALTH_METRIC_UPDATED',
  HEALTH_METRIC_DELETED = 'HEALTH_METRIC_DELETED',
  
  // Goals
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  HEALTH_GOAL_UPDATED = 'HEALTH_GOAL_UPDATED',
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  HEALTH_GOAL_DELETED = 'HEALTH_GOAL_DELETED',
  
  // Devices
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_DISCONNECTED = 'DEVICE_DISCONNECTED',
  DEVICE_SYNC_COMPLETED = 'DEVICE_SYNC_COMPLETED',
  
  // Insights
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',
  HEALTH_INSIGHT_VIEWED = 'HEALTH_INSIGHT_VIEWED'
}

/**
 * Care Journey Event Types
 */
export enum CareEventType {
  // Appointments
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_CANCELED = 'APPOINTMENT_CANCELED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  
  // Medications
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_SKIPPED = 'MEDICATION_SKIPPED',
  MEDICATION_REMOVED = 'MEDICATION_REMOVED',
  
  // Telemedicine
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  
  // Symptom Checker
  SYMPTOM_CHECK_STARTED = 'SYMPTOM_CHECK_STARTED',
  SYMPTOM_CHECK_COMPLETED = 'SYMPTOM_CHECK_COMPLETED',
  
  // Providers
  PROVIDER_FAVORITED = 'PROVIDER_FAVORITED',
  PROVIDER_UNFAVORITED = 'PROVIDER_UNFAVORITED',
  PROVIDER_RATED = 'PROVIDER_RATED',
  
  // Treatments
  TREATMENT_PLAN_CREATED = 'TREATMENT_PLAN_CREATED',
  TREATMENT_PLAN_UPDATED = 'TREATMENT_PLAN_UPDATED',
  TREATMENT_PLAN_COMPLETED = 'TREATMENT_PLAN_COMPLETED'
}

/**
 * Plan Journey Event Types
 */
export enum PlanEventType {
  // Claims
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_UPDATED = 'CLAIM_UPDATED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  
  // Benefits
  BENEFIT_VIEWED = 'BENEFIT_VIEWED',
  BENEFIT_USED = 'BENEFIT_USED',
  
  // Coverage
  COVERAGE_CHECKED = 'COVERAGE_CHECKED',
  COVERAGE_UPDATED = 'COVERAGE_UPDATED',
  
  // Plans
  PLAN_COMPARED = 'PLAN_COMPARED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  PLAN_CHANGED = 'PLAN_CHANGED',
  
  // Documents
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED'
}

/**
 * User-related Event Types
 */
export enum UserEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  USER_PREFERENCES_UPDATED = 'USER_PREFERENCES_UPDATED',
  USER_FEEDBACK_SUBMITTED = 'USER_FEEDBACK_SUBMITTED'
}

/**
 * Gamification Event Types
 */
export enum GamificationEventType {
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  REWARD_GRANTED = 'REWARD_GRANTED',
  QUEST_STARTED = 'QUEST_STARTED',
  QUEST_PROGRESSED = 'QUEST_PROGRESSED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  LEVEL_UP = 'LEVEL_UP',
  XP_EARNED = 'XP_EARNED'
}

/**
 * Union of all event types
 */
export type EventType = 
  | HealthEventType
  | CareEventType
  | PlanEventType
  | UserEventType
  | GamificationEventType;

/**
 * Base event interface that all events must implement
 */
export interface BaseEvent {
  /**
   * The type of the event
   */
  type: EventType;
  
  /**
   * The ID of the user associated with the event
   */
  userId: string;
  
  /**
   * The journey associated with the event
   */
  journey: Journey;
  
  /**
   * Timestamp when the event occurred
   */
  timestamp: string | Date;
  
  /**
   * Schema version for backward compatibility
   */
  schemaVersion: EventSchemaVersion;
  
  /**
   * Event data specific to the event type
   */
  data: Record<string, any>;
}

/**
 * Health metric types
 */
export enum HealthMetricType {
  STEPS = 'steps',
  WEIGHT = 'weight',
  HEART_RATE = 'heart_rate',
  BLOOD_PRESSURE = 'blood_pressure',
  BLOOD_GLUCOSE = 'blood_glucose',
  SLEEP = 'sleep',
  CALORIES = 'calories',
  WATER = 'water',
  EXERCISE = 'exercise',
  TEMPERATURE = 'temperature',
  OXYGEN_SATURATION = 'oxygen_saturation'
}

/**
 * Health goal types
 */
export enum HealthGoalType {
  STEPS = 'steps',
  WEIGHT = 'weight',
  EXERCISE = 'exercise',
  SLEEP = 'sleep',
  WATER = 'water',
  CALORIES = 'calories',
  CUSTOM = 'custom'
}

/**
 * Device types
 */
export enum DeviceType {
  SMARTWATCH = 'smartwatch',
  FITNESS_TRACKER = 'fitness_tracker',
  SMART_SCALE = 'smart_scale',
  BLOOD_PRESSURE_MONITOR = 'blood_pressure_monitor',
  GLUCOSE_MONITOR = 'glucose_monitor',
  SLEEP_TRACKER = 'sleep_tracker',
  THERMOMETER = 'thermometer',
  PULSE_OXIMETER = 'pulse_oximeter'
}

/**
 * Appointment types
 */
export enum AppointmentType {
  IN_PERSON = 'in_person',
  TELEMEDICINE = 'telemedicine',
  HOME_VISIT = 'home_visit'
}

/**
 * Claim types
 */
export enum ClaimType {
  MEDICAL = 'medical',
  DENTAL = 'dental',
  VISION = 'vision',
  PHARMACY = 'pharmacy',
  MENTAL_HEALTH = 'mental_health',
  PHYSICAL_THERAPY = 'physical_therapy',
  OTHER = 'other'
}

/**
 * Document types
 */
export enum DocumentType {
  INSURANCE_CARD = 'insurance_card',
  MEDICAL_RECORD = 'medical_record',
  PRESCRIPTION = 'prescription',
  CLAIM_FORM = 'claim_form',
  RECEIPT = 'receipt',
  LAB_RESULT = 'lab_result',
  OTHER = 'other'
}

// ==========================================
// Health Journey Event Interfaces
// ==========================================

/**
 * Health Metric Recorded Event
 */
export interface HealthMetricRecordedEvent extends BaseEvent {
  type: HealthEventType.HEALTH_METRIC_RECORDED;
  journey: Journey.HEALTH;
  data: {
    metricId: string;
    metricType: HealthMetricType;
    value: number;
    unit: string;
    recordedAt: string | Date;
    deviceId?: string;
    notes?: string;
  };
}

/**
 * Health Goal Achieved Event
 */
export interface HealthGoalAchievedEvent extends BaseEvent {
  type: HealthEventType.HEALTH_GOAL_ACHIEVED;
  journey: Journey.HEALTH;
  data: {
    goalId: string;
    goalType: HealthGoalType;
    targetValue: number;
    achievedValue: number;
    unit: string;
    startDate: string | Date;
    achievedAt: string | Date;
  };
}

/**
 * Device Connected Event
 */
export interface DeviceConnectedEvent extends BaseEvent {
  type: HealthEventType.DEVICE_CONNECTED;
  journey: Journey.HEALTH;
  data: {
    deviceId: string;
    deviceType: DeviceType;
    deviceName: string;
    manufacturer: string;
    model?: string;
    connectedAt: string | Date;
  };
}

// ==========================================
// Care Journey Event Interfaces
// ==========================================

/**
 * Appointment Booked Event
 */
export interface AppointmentBookedEvent extends BaseEvent {
  type: CareEventType.APPOINTMENT_BOOKED;
  journey: Journey.CARE;
  data: {
    appointmentId: string;
    providerId: string;
    providerName: string;
    appointmentType: AppointmentType;
    specialtyType?: string;
    scheduledAt: string | Date;
    duration: number; // in minutes
    location?: string;
    notes?: string;
  };
}

/**
 * Medication Taken Event
 */
export interface MedicationTakenEvent extends BaseEvent {
  type: CareEventType.MEDICATION_TAKEN;
  journey: Journey.CARE;
  data: {
    medicationId: string;
    medicationName: string;
    dosage: string;
    takenAt: string | Date;
    scheduled: boolean;
    notes?: string;
  };
}

/**
 * Telemedicine Session Completed Event
 */
export interface TelemedicineSessionCompletedEvent extends BaseEvent {
  type: CareEventType.TELEMEDICINE_SESSION_COMPLETED;
  journey: Journey.CARE;
  data: {
    sessionId: string;
    providerId: string;
    providerName: string;
    startTime: string | Date;
    endTime: string | Date;
    duration: number; // in minutes
    notes?: string;
  };
}

// ==========================================
// Plan Journey Event Interfaces
// ==========================================

/**
 * Claim Submitted Event
 */
export interface ClaimSubmittedEvent extends BaseEvent {
  type: PlanEventType.CLAIM_SUBMITTED;
  journey: Journey.PLAN;
  data: {
    claimId: string;
    claimType: ClaimType;
    providerId?: string;
    providerName?: string;
    serviceDate: string | Date;
    amount: number;
    currency: string;
    description?: string;
    submittedAt: string | Date;
  };
}

/**
 * Benefit Used Event
 */
export interface BenefitUsedEvent extends BaseEvent {
  type: PlanEventType.BENEFIT_USED;
  journey: Journey.PLAN;
  data: {
    benefitId: string;
    benefitName: string;
    benefitCategory: string;
    usedAt: string | Date;
    value?: number;
    notes?: string;
  };
}

/**
 * Document Uploaded Event
 */
export interface DocumentUploadedEvent extends BaseEvent {
  type: PlanEventType.DOCUMENT_UPLOADED;
  journey: Journey.PLAN;
  data: {
    documentId: string;
    documentType: DocumentType;
    fileName: string;
    fileSize: number; // in bytes
    mimeType: string;
    uploadedAt: string | Date;
    relatedEntityId?: string;
    relatedEntityType?: string;
  };
}

// ==========================================
// User Event Interfaces
// ==========================================

/**
 * User Registered Event
 */
export interface UserRegisteredEvent extends BaseEvent {
  type: UserEventType.USER_REGISTERED;
  journey: Journey.GLOBAL;
  data: {
    email: string;
    registrationMethod: 'email' | 'google' | 'apple' | 'facebook';
    registeredAt: string | Date;
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * User Logged In Event
 */
export interface UserLoggedInEvent extends BaseEvent {
  type: UserEventType.USER_LOGGED_IN;
  journey: Journey.GLOBAL;
  data: {
    loginMethod: 'email' | 'google' | 'apple' | 'facebook';
    loggedInAt: string | Date;
    userAgent?: string;
    ipAddress?: string;
    deviceInfo?: {
      platform: string;
      deviceModel?: string;
      osVersion?: string;
      appVersion?: string;
    };
  };
}

// ==========================================
// Gamification Event Interfaces
// ==========================================

/**
 * Achievement Unlocked Event
 */
export interface AchievementUnlockedEvent extends BaseEvent {
  type: GamificationEventType.ACHIEVEMENT_UNLOCKED;
  journey: Journey.GLOBAL;
  data: {
    achievementId: string;
    achievementName: string;
    xpAwarded: number;
    unlockedAt: string | Date;
    relatedJourney?: Journey;
  };
}

/**
 * Quest Completed Event
 */
export interface QuestCompletedEvent extends BaseEvent {
  type: GamificationEventType.QUEST_COMPLETED;
  journey: Journey.GLOBAL;
  data: {
    questId: string;
    questName: string;
    xpAwarded: number;
    completedAt: string | Date;
    relatedJourney?: Journey;
    rewardIds?: string[];
  };
}

// ==========================================
// Union Types for All Events
// ==========================================

/**
 * Union type for all Health Journey events
 */
export type HealthEvent = 
  | HealthMetricRecordedEvent
  | HealthGoalAchievedEvent
  | DeviceConnectedEvent;

/**
 * Union type for all Care Journey events
 */
export type CareEvent = 
  | AppointmentBookedEvent
  | MedicationTakenEvent
  | TelemedicineSessionCompletedEvent;

/**
 * Union type for all Plan Journey events
 */
export type PlanEvent = 
  | ClaimSubmittedEvent
  | BenefitUsedEvent
  | DocumentUploadedEvent;

/**
 * Union type for all User events
 */
export type UserEvent = 
  | UserRegisteredEvent
  | UserLoggedInEvent;

/**
 * Union type for all Gamification events
 */
export type GamificationEvent = 
  | AchievementUnlockedEvent
  | QuestCompletedEvent;

/**
 * Union type for all events
 */
export type Event = 
  | HealthEvent
  | CareEvent
  | PlanEvent
  | UserEvent
  | GamificationEvent;

// ==========================================
// Zod Schemas for Validation
// ==========================================

/**
 * Base Zod schema for all events
 */
export const baseEventSchema = z.object({
  type: z.string(),
  userId: z.string().uuid(),
  journey: z.nativeEnum(Journey),
  timestamp: z.union([z.string().datetime(), z.date()]),
  schemaVersion: z.nativeEnum(EventSchemaVersion),
  data: z.record(z.any())
});

/**
 * Health Metric Recorded Event Schema
 */
export const healthMetricRecordedSchema = baseEventSchema.extend({
  type: z.literal(HealthEventType.HEALTH_METRIC_RECORDED),
  journey: z.literal(Journey.HEALTH),
  data: z.object({
    metricId: z.string().uuid(),
    metricType: z.nativeEnum(HealthMetricType),
    value: z.number(),
    unit: z.string(),
    recordedAt: z.union([z.string().datetime(), z.date()]),
    deviceId: z.string().uuid().optional(),
    notes: z.string().optional()
  })
});

/**
 * Health Goal Achieved Event Schema
 */
export const healthGoalAchievedSchema = baseEventSchema.extend({
  type: z.literal(HealthEventType.HEALTH_GOAL_ACHIEVED),
  journey: z.literal(Journey.HEALTH),
  data: z.object({
    goalId: z.string().uuid(),
    goalType: z.nativeEnum(HealthGoalType),
    targetValue: z.number(),
    achievedValue: z.number(),
    unit: z.string(),
    startDate: z.union([z.string().datetime(), z.date()]),
    achievedAt: z.union([z.string().datetime(), z.date()])
  })
});

/**
 * Device Connected Event Schema
 */
export const deviceConnectedSchema = baseEventSchema.extend({
  type: z.literal(HealthEventType.DEVICE_CONNECTED),
  journey: z.literal(Journey.HEALTH),
  data: z.object({
    deviceId: z.string().uuid(),
    deviceType: z.nativeEnum(DeviceType),
    deviceName: z.string(),
    manufacturer: z.string(),
    model: z.string().optional(),
    connectedAt: z.union([z.string().datetime(), z.date()])
  })
});

/**
 * Appointment Booked Event Schema
 */
export const appointmentBookedSchema = baseEventSchema.extend({
  type: z.literal(CareEventType.APPOINTMENT_BOOKED),
  journey: z.literal(Journey.CARE),
  data: z.object({
    appointmentId: z.string().uuid(),
    providerId: z.string().uuid(),
    providerName: z.string(),
    appointmentType: z.nativeEnum(AppointmentType),
    specialtyType: z.string().optional(),
    scheduledAt: z.union([z.string().datetime(), z.date()]),
    duration: z.number().int().positive(),
    location: z.string().optional(),
    notes: z.string().optional()
  })
});

/**
 * Medication Taken Event Schema
 */
export const medicationTakenSchema = baseEventSchema.extend({
  type: z.literal(CareEventType.MEDICATION_TAKEN),
  journey: z.literal(Journey.CARE),
  data: z.object({
    medicationId: z.string().uuid(),
    medicationName: z.string(),
    dosage: z.string(),
    takenAt: z.union([z.string().datetime(), z.date()]),
    scheduled: z.boolean(),
    notes: z.string().optional()
  })
});

/**
 * Telemedicine Session Completed Event Schema
 */
export const telemedicineSessionCompletedSchema = baseEventSchema.extend({
  type: z.literal(CareEventType.TELEMEDICINE_SESSION_COMPLETED),
  journey: z.literal(Journey.CARE),
  data: z.object({
    sessionId: z.string().uuid(),
    providerId: z.string().uuid(),
    providerName: z.string(),
    startTime: z.union([z.string().datetime(), z.date()]),
    endTime: z.union([z.string().datetime(), z.date()]),
    duration: z.number().int().positive(),
    notes: z.string().optional()
  })
});

/**
 * Claim Submitted Event Schema
 */
export const claimSubmittedSchema = baseEventSchema.extend({
  type: z.literal(PlanEventType.CLAIM_SUBMITTED),
  journey: z.literal(Journey.PLAN),
  data: z.object({
    claimId: z.string().uuid(),
    claimType: z.nativeEnum(ClaimType),
    providerId: z.string().uuid().optional(),
    providerName: z.string().optional(),
    serviceDate: z.union([z.string().datetime(), z.date()]),
    amount: z.number().positive(),
    currency: z.string(),
    description: z.string().optional(),
    submittedAt: z.union([z.string().datetime(), z.date()])
  })
});

/**
 * Benefit Used Event Schema
 */
export const benefitUsedSchema = baseEventSchema.extend({
  type: z.literal(PlanEventType.BENEFIT_USED),
  journey: z.literal(Journey.PLAN),
  data: z.object({
    benefitId: z.string().uuid(),
    benefitName: z.string(),
    benefitCategory: z.string(),
    usedAt: z.union([z.string().datetime(), z.date()]),
    value: z.number().optional(),
    notes: z.string().optional()
  })
});

/**
 * Document Uploaded Event Schema
 */
export const documentUploadedSchema = baseEventSchema.extend({
  type: z.literal(PlanEventType.DOCUMENT_UPLOADED),
  journey: z.literal(Journey.PLAN),
  data: z.object({
    documentId: z.string().uuid(),
    documentType: z.nativeEnum(DocumentType),
    fileName: z.string(),
    fileSize: z.number().int().positive(),
    mimeType: z.string(),
    uploadedAt: z.union([z.string().datetime(), z.date()]),
    relatedEntityId: z.string().uuid().optional(),
    relatedEntityType: z.string().optional()
  })
});

/**
 * User Registered Event Schema
 */
export const userRegisteredSchema = baseEventSchema.extend({
  type: z.literal(UserEventType.USER_REGISTERED),
  journey: z.literal(Journey.GLOBAL),
  data: z.object({
    email: z.string().email(),
    registrationMethod: z.enum(['email', 'google', 'apple', 'facebook']),
    registeredAt: z.union([z.string().datetime(), z.date()]),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional()
  })
});

/**
 * User Logged In Event Schema
 */
export const userLoggedInSchema = baseEventSchema.extend({
  type: z.literal(UserEventType.USER_LOGGED_IN),
  journey: z.literal(Journey.GLOBAL),
  data: z.object({
    loginMethod: z.enum(['email', 'google', 'apple', 'facebook']),
    loggedInAt: z.union([z.string().datetime(), z.date()]),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    deviceInfo: z.object({
      platform: z.string(),
      deviceModel: z.string().optional(),
      osVersion: z.string().optional(),
      appVersion: z.string().optional()
    }).optional()
  })
});

/**
 * Achievement Unlocked Event Schema
 */
export const achievementUnlockedSchema = baseEventSchema.extend({
  type: z.literal(GamificationEventType.ACHIEVEMENT_UNLOCKED),
  journey: z.literal(Journey.GLOBAL),
  data: z.object({
    achievementId: z.string().uuid(),
    achievementName: z.string(),
    xpAwarded: z.number().int().nonnegative(),
    unlockedAt: z.union([z.string().datetime(), z.date()]),
    relatedJourney: z.nativeEnum(Journey).optional()
  })
});

/**
 * Quest Completed Event Schema
 */
export const questCompletedSchema = baseEventSchema.extend({
  type: z.literal(GamificationEventType.QUEST_COMPLETED),
  journey: z.literal(Journey.GLOBAL),
  data: z.object({
    questId: z.string().uuid(),
    questName: z.string(),
    xpAwarded: z.number().int().nonnegative(),
    completedAt: z.union([z.string().datetime(), z.date()]),
    relatedJourney: z.nativeEnum(Journey).optional(),
    rewardIds: z.array(z.string().uuid()).optional()
  })
});

// ==========================================
// Validation Functions
// ==========================================

/**
 * Validates a health metric recorded event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateHealthMetricRecorded(event: unknown): HealthMetricRecordedEvent {
  return healthMetricRecordedSchema.parse(event) as HealthMetricRecordedEvent;
}

/**
 * Validates a health goal achieved event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateHealthGoalAchieved(event: unknown): HealthGoalAchievedEvent {
  return healthGoalAchievedSchema.parse(event) as HealthGoalAchievedEvent;
}

/**
 * Validates a device connected event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateDeviceConnected(event: unknown): DeviceConnectedEvent {
  return deviceConnectedSchema.parse(event) as DeviceConnectedEvent;
}

/**
 * Validates an appointment booked event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateAppointmentBooked(event: unknown): AppointmentBookedEvent {
  return appointmentBookedSchema.parse(event) as AppointmentBookedEvent;
}

/**
 * Validates a medication taken event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateMedicationTaken(event: unknown): MedicationTakenEvent {
  return medicationTakenSchema.parse(event) as MedicationTakenEvent;
}

/**
 * Validates a telemedicine session completed event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateTelemedicineSessionCompleted(event: unknown): TelemedicineSessionCompletedEvent {
  return telemedicineSessionCompletedSchema.parse(event) as TelemedicineSessionCompletedEvent;
}

/**
 * Validates a claim submitted event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateClaimSubmitted(event: unknown): ClaimSubmittedEvent {
  return claimSubmittedSchema.parse(event) as ClaimSubmittedEvent;
}

/**
 * Validates a benefit used event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateBenefitUsed(event: unknown): BenefitUsedEvent {
  return benefitUsedSchema.parse(event) as BenefitUsedEvent;
}

/**
 * Validates a document uploaded event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateDocumentUploaded(event: unknown): DocumentUploadedEvent {
  return documentUploadedSchema.parse(event) as DocumentUploadedEvent;
}

/**
 * Validates a user registered event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateUserRegistered(event: unknown): UserRegisteredEvent {
  return userRegisteredSchema.parse(event) as UserRegisteredEvent;
}

/**
 * Validates a user logged in event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateUserLoggedIn(event: unknown): UserLoggedInEvent {
  return userLoggedInSchema.parse(event) as UserLoggedInEvent;
}

/**
 * Validates an achievement unlocked event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateAchievementUnlocked(event: unknown): AchievementUnlockedEvent {
  return achievementUnlockedSchema.parse(event) as AchievementUnlockedEvent;
}

/**
 * Validates a quest completed event
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateQuestCompleted(event: unknown): QuestCompletedEvent {
  return questCompletedSchema.parse(event) as QuestCompletedEvent;
}

/**
 * Validates any event based on its type
 * @param event The event to validate
 * @returns The validated event or throws an error
 */
export function validateEvent(event: unknown): Event {
  // First validate that it's a base event
  const baseEvent = baseEventSchema.parse(event);
  
  // Then validate based on the event type
  switch (baseEvent.type) {
    case HealthEventType.HEALTH_METRIC_RECORDED:
      return validateHealthMetricRecorded(event);
    case HealthEventType.HEALTH_GOAL_ACHIEVED:
      return validateHealthGoalAchieved(event);
    case HealthEventType.DEVICE_CONNECTED:
      return validateDeviceConnected(event);
    case CareEventType.APPOINTMENT_BOOKED:
      return validateAppointmentBooked(event);
    case CareEventType.MEDICATION_TAKEN:
      return validateMedicationTaken(event);
    case CareEventType.TELEMEDICINE_SESSION_COMPLETED:
      return validateTelemedicineSessionCompleted(event);
    case PlanEventType.CLAIM_SUBMITTED:
      return validateClaimSubmitted(event);
    case PlanEventType.BENEFIT_USED:
      return validateBenefitUsed(event);
    case PlanEventType.DOCUMENT_UPLOADED:
      return validateDocumentUploaded(event);
    case UserEventType.USER_REGISTERED:
      return validateUserRegistered(event);
    case UserEventType.USER_LOGGED_IN:
      return validateUserLoggedIn(event);
    case GamificationEventType.ACHIEVEMENT_UNLOCKED:
      return validateAchievementUnlocked(event);
    case GamificationEventType.QUEST_COMPLETED:
      return validateQuestCompleted(event);
    default:
      // For events without specific schemas, return the base event
      return baseEvent as Event;
  }
}

/**
 * Checks if an event is of a specific type
 * @param event The event to check
 * @param type The event type to check against
 * @returns True if the event is of the specified type, false otherwise
 */
export function isEventType<T extends Event>(
  event: Event, 
  type: EventType
): event is T {
  return event.type === type;
}

/**
 * Checks if an event is from a specific journey
 * @param event The event to check
 * @param journey The journey to check against
 * @returns True if the event is from the specified journey, false otherwise
 */
export function isJourneyEvent<T extends Event>(
  event: Event,
  journey: Journey
): event is T {
  return event.journey === journey;
}

/**
 * Converts a string or Date timestamp to a Date object
 * @param timestamp The timestamp to convert
 * @returns A Date object
 */
export function normalizeTimestamp(timestamp: string | Date): Date {
  return typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
}

/**
 * Creates a new event with the latest schema version
 * @param event The event to upgrade
 * @returns A new event with the latest schema version
 */
export function upgradeEventSchema(event: Event): Event {
  return {
    ...event,
    schemaVersion: EventSchemaVersion.LATEST
  };
}

/**
 * Checks if an event needs schema upgrade
 * @param event The event to check
 * @returns True if the event needs upgrade, false otherwise
 */
export function needsSchemaUpgrade(event: Event): boolean {
  return event.schemaVersion !== EventSchemaVersion.LATEST;
}

/**
 * Creates a base event with default values
 * @param type The event type
 * @param userId The user ID
 * @param journey The journey
 * @param data The event data
 * @returns A base event
 */
export function createBaseEvent(
  type: EventType,
  userId: string,
  journey: Journey,
  data: Record<string, any>
): BaseEvent {
  return {
    type,
    userId,
    journey,
    timestamp: new Date(),
    schemaVersion: EventSchemaVersion.LATEST,
    data
  };
}