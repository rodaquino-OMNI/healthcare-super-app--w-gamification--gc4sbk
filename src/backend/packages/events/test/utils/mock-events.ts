/**
 * @file Mock Event Generation Utilities
 * 
 * This file provides factory functions for creating standardized mock events
 * for testing purposes. It includes utilities for generating events for all
 * journey types (health, care, plan) with proper TypeScript interfaces.
 * 
 * These utilities help ensure test consistency and reduce test code duplication
 * when validating event processing, schema validation, and integration across services.
 */

import { v4 as uuidv4 } from 'uuid';

// Import event interfaces from @austa/interfaces
import {
  EventType,
  EventJourney,
  GamificationEvent,
  EventVersion,
  HealthMetricRecordedPayload,
  HealthGoalAchievedPayload,
  DeviceEventPayload,
  AppointmentEventPayload,
  MedicationEventPayload,
  TelemedicineEventPayload,
  ClaimEventPayload,
  BenefitUtilizedPayload,
  PlanEventPayload,
  AchievementUnlockedPayload,
  XpEarnedPayload,
} from '@austa/interfaces/gamification/events';

// Import journey-specific interfaces
import { MetricType } from '@austa/interfaces/journey/health';
import { AppointmentType } from '@austa/interfaces/journey/care';
import { ClaimStatus } from '@austa/interfaces/journey/plan';

/**
 * Default event version for all mock events
 */
const DEFAULT_EVENT_VERSION: EventVersion = {
  major: 1,
  minor: 0,
  patch: 0,
};

/**
 * Default source for all mock events
 */
const DEFAULT_EVENT_SOURCE = 'test';

/**
 * Generates a unique event ID
 * @returns A UUID string
 */
export function generateEventId(): string {
  return uuidv4();
}

/**
 * Normalizes a timestamp to ensure consistent format
 * If no timestamp is provided, uses the current time
 * 
 * @param timestamp Optional timestamp to normalize
 * @returns ISO string timestamp
 */
export function normalizeTimestamp(timestamp?: Date | string): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toISOString();
  }
  
  return timestamp.toISOString();
}

/**
 * Options for creating a base event
 */
export interface BaseEventOptions {
  /** Optional event ID (generated if not provided) */
  eventId?: string;
  /** User ID associated with the event */
  userId: string;
  /** Optional event source (defaults to 'test') */
  source?: string;
  /** Optional event version (defaults to 1.0.0) */
  version?: EventVersion;
  /** Optional timestamp (defaults to current time) */
  timestamp?: Date | string;
  /** Optional correlation ID for tracing related events */
  correlationId?: string;
}

/**
 * Creates a base event with common properties
 * 
 * @param type Event type
 * @param journey Journey associated with the event
 * @param payload Event payload
 * @param options Additional event options
 * @returns A complete GamificationEvent
 */
export function createBaseEvent<T>(
  type: EventType,
  journey: EventJourney,
  payload: T,
  options: BaseEventOptions
): GamificationEvent {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  // Add timestamp to payload if it's an object
  const payloadWithTimestamp = {
    ...payload,
    timestamp,
  };
  
  return {
    eventId: options.eventId || generateEventId(),
    type,
    userId: options.userId,
    journey,
    payload: payloadWithTimestamp as any,
    version: options.version || DEFAULT_EVENT_VERSION,
    createdAt: timestamp,
    source: options.source || DEFAULT_EVENT_SOURCE,
    correlationId: options.correlationId,
  };
}

// ===== HEALTH JOURNEY EVENT FACTORIES =====

/**
 * Options for creating a health metric recorded event
 */
export interface HealthMetricRecordedOptions extends BaseEventOptions {
  /** Type of health metric */
  metricType: MetricType | string;
  /** Value of the health metric */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Source of the metric (manual, device, etc.) */
  source?: string;
  /** Whether the metric is within healthy range */
  isWithinHealthyRange?: boolean;
}

/**
 * Creates a mock HEALTH_METRIC_RECORDED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with HealthMetricRecordedPayload
 */
export function createHealthMetricRecordedEvent(
  options: HealthMetricRecordedOptions
): GamificationEvent {
  const payload: HealthMetricRecordedPayload = {
    metricType: options.metricType,
    value: options.value,
    unit: options.unit,
    source: options.source || 'manual',
    isWithinHealthyRange: options.isWithinHealthyRange,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.HEALTH_METRIC_RECORDED,
    EventJourney.HEALTH,
    payload,
    options
  );
}

/**
 * Options for creating a health goal achieved event
 */
export interface HealthGoalAchievedOptions extends BaseEventOptions {
  /** ID of the health goal */
  goalId: string;
  /** Type of health goal */
  goalType: string;
  /** Target value for the health goal */
  targetValue: number;
  /** Unit of measurement */
  unit: string;
  /** Percentage of goal completion */
  completionPercentage: number;
  /** Whether this is the first time achieving this goal */
  isFirstTimeAchievement: boolean;
  /** Period for recurring goals (daily, weekly, etc.) */
  period?: string;
}

/**
 * Creates a mock HEALTH_GOAL_ACHIEVED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with HealthGoalAchievedPayload
 */
export function createHealthGoalAchievedEvent(
  options: HealthGoalAchievedOptions
): GamificationEvent {
  const payload: HealthGoalAchievedPayload = {
    goalId: options.goalId,
    goalType: options.goalType,
    targetValue: options.targetValue,
    unit: options.unit,
    completionPercentage: options.completionPercentage,
    isFirstTimeAchievement: options.isFirstTimeAchievement,
    period: options.period,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.HEALTH_GOAL_ACHIEVED,
    EventJourney.HEALTH,
    payload,
    options
  );
}

/**
 * Options for creating a device connected event
 */
export interface DeviceConnectedOptions extends BaseEventOptions {
  /** ID of the device */
  deviceId: string;
  /** Type of device */
  deviceType: string;
  /** Manufacturer of the device */
  manufacturer: string;
}

/**
 * Creates a mock DEVICE_CONNECTED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with DeviceEventPayload
 */
export function createDeviceConnectedEvent(
  options: DeviceConnectedOptions
): GamificationEvent {
  const payload: DeviceEventPayload = {
    deviceId: options.deviceId,
    deviceType: options.deviceType,
    manufacturer: options.manufacturer,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.DEVICE_CONNECTED,
    EventJourney.HEALTH,
    payload,
    options
  );
}

// ===== CARE JOURNEY EVENT FACTORIES =====

/**
 * Options for creating an appointment booked event
 */
export interface AppointmentBookedOptions extends BaseEventOptions {
  /** ID of the appointment */
  appointmentId: string;
  /** Type of appointment */
  appointmentType: AppointmentType | string;
  /** ID of the provider */
  providerId: string;
  /** Whether this is the first appointment with this provider */
  isFirstAppointment?: boolean;
}

/**
 * Creates a mock APPOINTMENT_BOOKED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with AppointmentEventPayload
 */
export function createAppointmentBookedEvent(
  options: AppointmentBookedOptions
): GamificationEvent {
  const payload: AppointmentEventPayload = {
    appointmentId: options.appointmentId,
    appointmentType: options.appointmentType,
    providerId: options.providerId,
    isFirstAppointment: options.isFirstAppointment,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.APPOINTMENT_BOOKED,
    EventJourney.CARE,
    payload,
    options
  );
}

/**
 * Options for creating a medication taken event
 */
export interface MedicationTakenOptions extends BaseEventOptions {
  /** ID of the medication */
  medicationId: string;
  /** Name of the medication */
  medicationName: string;
  /** Whether the medication was taken on time */
  takenOnTime?: boolean;
}

/**
 * Creates a mock MEDICATION_TAKEN event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with MedicationEventPayload
 */
export function createMedicationTakenEvent(
  options: MedicationTakenOptions
): GamificationEvent {
  const payload: MedicationEventPayload = {
    medicationId: options.medicationId,
    medicationName: options.medicationName,
    takenOnTime: options.takenOnTime,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.MEDICATION_TAKEN,
    EventJourney.CARE,
    payload,
    options
  );
}

/**
 * Options for creating a telemedicine session completed event
 */
export interface TelemedicineCompletedOptions extends BaseEventOptions {
  /** ID of the telemedicine session */
  sessionId: string;
  /** ID of the provider */
  providerId: string;
  /** Duration of the session in minutes */
  durationMinutes: number;
  /** Whether this is the first telemedicine session for the user */
  isFirstSession?: boolean;
}

/**
 * Creates a mock TELEMEDICINE_SESSION_COMPLETED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with TelemedicineEventPayload
 */
export function createTelemedicineCompletedEvent(
  options: TelemedicineCompletedOptions
): GamificationEvent {
  const payload: TelemedicineEventPayload = {
    sessionId: options.sessionId,
    providerId: options.providerId,
    durationMinutes: options.durationMinutes,
    isFirstSession: options.isFirstSession,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.TELEMEDICINE_SESSION_COMPLETED,
    EventJourney.CARE,
    payload,
    options
  );
}

// ===== PLAN JOURNEY EVENT FACTORIES =====

/**
 * Options for creating a claim submitted event
 */
export interface ClaimSubmittedOptions extends BaseEventOptions {
  /** ID of the claim */
  claimId: string;
  /** Type of claim */
  claimType: string;
  /** Amount of the claim */
  amount: number;
  /** Number of documents uploaded */
  documentCount?: number;
}

/**
 * Creates a mock CLAIM_SUBMITTED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with ClaimEventPayload
 */
export function createClaimSubmittedEvent(
  options: ClaimSubmittedOptions
): GamificationEvent {
  const payload: ClaimEventPayload = {
    claimId: options.claimId,
    claimType: options.claimType,
    amount: options.amount,
    documentCount: options.documentCount,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.CLAIM_SUBMITTED,
    EventJourney.PLAN,
    payload,
    options
  );
}

/**
 * Options for creating a benefit utilized event
 */
export interface BenefitUtilizedOptions extends BaseEventOptions {
  /** ID of the benefit */
  benefitId: string;
  /** Type of benefit */
  benefitType: string;
  /** Value of the benefit utilized */
  value?: number;
}

/**
 * Creates a mock BENEFIT_UTILIZED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with BenefitUtilizedPayload
 */
export function createBenefitUtilizedEvent(
  options: BenefitUtilizedOptions
): GamificationEvent {
  const payload: BenefitUtilizedPayload = {
    benefitId: options.benefitId,
    benefitType: options.benefitType,
    value: options.value,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.BENEFIT_UTILIZED,
    EventJourney.PLAN,
    payload,
    options
  );
}

/**
 * Options for creating a coverage reviewed event
 */
export interface CoverageReviewedOptions extends BaseEventOptions {
  /** ID of the plan */
  planId: string;
  /** Type of plan */
  planType: string;
}

/**
 * Creates a mock COVERAGE_REVIEWED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with PlanEventPayload
 */
export function createCoverageReviewedEvent(
  options: CoverageReviewedOptions
): GamificationEvent {
  const payload: PlanEventPayload = {
    planId: options.planId,
    planType: options.planType,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.COVERAGE_REVIEWED,
    EventJourney.PLAN,
    payload,
    options
  );
}

// ===== CROSS-JOURNEY EVENT FACTORIES =====

/**
 * Options for creating an achievement unlocked event
 */
export interface AchievementUnlockedOptions extends BaseEventOptions {
  /** ID of the achievement */
  achievementId: string;
  /** Title of the achievement */
  achievementTitle: string;
  /** Description of the achievement */
  achievementDescription: string;
  /** XP earned from the achievement */
  xpEarned: number;
  /** Related journey for the achievement */
  relatedJourney?: EventJourney;
}

/**
 * Creates a mock ACHIEVEMENT_UNLOCKED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with AchievementUnlockedPayload
 */
export function createAchievementUnlockedEvent(
  options: AchievementUnlockedOptions
): GamificationEvent {
  const payload: AchievementUnlockedPayload = {
    achievementId: options.achievementId,
    achievementTitle: options.achievementTitle,
    achievementDescription: options.achievementDescription,
    xpEarned: options.xpEarned,
    relatedJourney: options.relatedJourney,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.ACHIEVEMENT_UNLOCKED,
    EventJourney.CROSS_JOURNEY,
    payload,
    options
  );
}

/**
 * Options for creating an XP earned event
 */
export interface XpEarnedOptions extends BaseEventOptions {
  /** Amount of XP earned */
  amount: number;
  /** Source of the XP */
  source: string;
  /** Description of how the XP was earned */
  description: string;
  /** Related journey for the XP */
  relatedJourney?: EventJourney;
}

/**
 * Creates a mock XP_EARNED event
 * 
 * @param options Event options
 * @returns A complete GamificationEvent with XpEarnedPayload
 */
export function createXpEarnedEvent(
  options: XpEarnedOptions
): GamificationEvent {
  const payload: XpEarnedPayload = {
    amount: options.amount,
    source: options.source,
    description: options.description,
    relatedJourney: options.relatedJourney,
    timestamp: '', // Will be set by createBaseEvent
  };
  
  return createBaseEvent(
    EventType.XP_EARNED,
    EventJourney.CROSS_JOURNEY,
    payload,
    options
  );
}

/**
 * Creates a batch of mock events for testing
 * 
 * @param userId User ID to associate with all events
 * @param count Number of events to generate (default: 5)
 * @returns Array of GamificationEvent objects
 */
export function createMockEventBatch(
  userId: string,
  count: number = 5
): GamificationEvent[] {
  const events: GamificationEvent[] = [];
  
  // Create a variety of events across all journeys
  for (let i = 0; i < count; i++) {
    // Rotate through different event types
    switch (i % 9) {
      case 0:
        events.push(createHealthMetricRecordedEvent({
          userId,
          metricType: 'HEART_RATE',
          value: 75 + Math.floor(Math.random() * 10),
          unit: 'bpm',
          isWithinHealthyRange: true,
        }));
        break;
      case 1:
        events.push(createHealthGoalAchievedEvent({
          userId,
          goalId: `goal-${i}`,
          goalType: 'STEPS',
          targetValue: 10000,
          unit: 'steps',
          completionPercentage: 100,
          isFirstTimeAchievement: false,
        }));
        break;
      case 2:
        events.push(createDeviceConnectedEvent({
          userId,
          deviceId: `device-${i}`,
          deviceType: 'Smartwatch',
          manufacturer: 'FitBit',
        }));
        break;
      case 3:
        events.push(createAppointmentBookedEvent({
          userId,
          appointmentId: `appointment-${i}`,
          appointmentType: 'CONSULTATION',
          providerId: `provider-${i}`,
        }));
        break;
      case 4:
        events.push(createMedicationTakenEvent({
          userId,
          medicationId: `medication-${i}`,
          medicationName: 'Test Medication',
          takenOnTime: true,
        }));
        break;
      case 5:
        events.push(createTelemedicineCompletedEvent({
          userId,
          sessionId: `session-${i}`,
          providerId: `provider-${i}`,
          durationMinutes: 30,
        }));
        break;
      case 6:
        events.push(createClaimSubmittedEvent({
          userId,
          claimId: `claim-${i}`,
          claimType: 'MEDICAL',
          amount: 150.0,
          documentCount: 2,
        }));
        break;
      case 7:
        events.push(createBenefitUtilizedEvent({
          userId,
          benefitId: `benefit-${i}`,
          benefitType: 'DENTAL',
          value: 75.0,
        }));
        break;
      case 8:
        events.push(createAchievementUnlockedEvent({
          userId,
          achievementId: `achievement-${i}`,
          achievementTitle: 'Test Achievement',
          achievementDescription: 'A test achievement for testing',
          xpEarned: 100,
          relatedJourney: EventJourney.HEALTH,
        }));
        break;
    }
  }
  
  return events;
}