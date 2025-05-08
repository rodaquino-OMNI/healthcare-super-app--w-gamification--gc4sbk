/**
 * @file events.ts
 * @description Defines TypeScript interfaces for the gamification event system, including GamificationEvent,
 * EventType enums, and event payload schemas. These interfaces standardize the format of events that
 * trigger gamification rules, achievements, and rewards across all journeys.
 *
 * This file is part of the @austa/interfaces package and is used by both the gamification engine
 * and other services that need to produce or consume gamification events.
 */

// Import common interfaces
import { JourneyType } from '../common/types';

// Re-export event types for backward compatibility
export * from './event-types';

/**
 * Base interface for all gamification events in the AUSTA SuperApp.
 * This is the primary interface that all event types extend.
 */
export interface GamificationEvent {
  /**
   * Unique identifier for the event
   */
  id?: string;

  /**
   * Type of the event, used for rule matching and processing
   * @example 'HEALTH_METRIC_RECORDED', 'APPOINTMENT_COMPLETED', 'CLAIM_SUBMITTED'
   */
  type: EventType;

  /**
   * User ID associated with the event
   */
  userId: string;

  /**
   * Event-specific data that varies based on event type
   */
  payload: EventPayload;

  /**
   * Source journey that generated the event
   * Optional for system-generated events
   */
  journey?: JourneyType;

  /**
   * Timestamp when the event occurred
   * ISO 8601 format
   */
  timestamp: string;

  /**
   * Event schema version for backward compatibility
   * @default '1.0.0'
   */
  version: string;

  /**
   * Optional correlation ID for tracking event processing across services
   */
  correlationId?: string;
}

/**
 * Interface for event payloads with generic type parameter for type safety.
 * Allows for journey-specific event data with proper type checking.
 */
export interface EventPayload<T = any> {
  /**
   * Event-specific data that varies based on event type
   */
  data: T;

  /**
   * Optional metadata for additional context
   */
  metadata?: Record<string, any>;
}

/**
 * Import event types from the event-types.ts file
 */
import { EventType, HealthEventType, CareEventType, PlanEventType, CommonEventType } from './event-types';

/**
 * Interface for event version metadata
 */
export interface EventVersion {
  /**
   * The major version number (incremented for breaking changes)
   */
  major: number;

  /**
   * The minor version number (incremented for backward-compatible additions)
   */
  minor: number;

  /**
   * The patch version number (incremented for backward-compatible fixes)
   */
  patch: number;

  /**
   * The full version string (e.g., "1.2.3")
   */
  toString(): string;
}

// ===== HEALTH JOURNEY EVENT PAYLOADS =====

/**
 * Interface for health metric recorded event payload.
 * This is used with the HEALTH_METRIC_RECORDED event type.
 */
export interface HealthMetricRecordedPayload {
  /** The type of health metric recorded */
  metricType: string;
  /** The value of the health metric */
  value: number;
  /** The unit of measurement for the health metric */
  unit: string;
  /** Optional source of the health metric */
  source?: string;
  /** Optional timestamp when the metric was recorded */
  recordedAt?: string;
  /** Optional previous value for comparison */
  previousValue?: number;
  /** Optional percentage change from previous value */
  changePercentage?: number;
}

/**
 * Interface for goal achieved event payload.
 * This is used with the GOAL_ACHIEVED event type.
 */
export interface GoalAchievedPayload {
  /** The ID of the goal that was achieved */
  goalId: string;
  /** The type of goal that was achieved */
  goalType: string;
  /** The timestamp when the goal was achieved */
  achievedAt: string;
  /** The target value of the goal */
  targetValue: number;
  /** The actual value achieved */
  actualValue: number;
  /** Optional streak count for consecutive achievements */
  streakCount?: number;
}

/**
 * Interface for device connected event payload.
 * This is used with the DEVICE_CONNECTED event type.
 */
export interface DeviceConnectedPayload {
  /** The ID of the device that was connected */
  deviceId: string;
  /** The type of device that was connected */
  deviceType: string;
  /** The timestamp when the device was connected */
  connectionTime: string;
  /** Whether this is the first time the device was connected */
  isFirstConnection: boolean;
}

// ===== CARE JOURNEY EVENT PAYLOADS =====

/**
 * Interface for appointment booked event payload.
 * This is used with the APPOINTMENT_BOOKED event type.
 */
export interface AppointmentBookedPayload {
  /** The ID of the appointment that was booked */
  appointmentId: string;
  /** The type of appointment */
  appointmentType: string;
  /** The ID of the provider for the appointment */
  providerId: string;
  /** The scheduled date and time for the appointment */
  scheduledAt: string;
  /** Whether this is the first appointment with this provider */
  isFirstAppointment?: boolean;
  /** The specialty area of the appointment */
  specialtyArea?: string;
}

/**
 * Interface for medication taken event payload.
 * This is used with the MEDICATION_TAKEN event type.
 */
export interface MedicationTakenPayload {
  /** The ID of the medication that was taken */
  medicationId: string;
  /** The timestamp when the medication was taken */
  takenAt: string;
  /** The dosage of the medication */
  dosage?: string;
  /** The percentage of adherence to the medication schedule */
  adherencePercentage?: number;
  /** Whether the medication was taken on schedule */
  onSchedule?: boolean;
  /** The number of consecutive days the medication has been taken */
  streakDays?: number;
}

/**
 * Interface for telemedicine session completed event payload.
 * This is used with the TELEMEDICINE_SESSION_COMPLETED event type.
 */
export interface TelemedicineSessionCompletedPayload {
  /** The ID of the telemedicine session */
  sessionId: string;
  /** The ID of the provider for the session */
  providerId: string;
  /** The start time of the session */
  startTime: string;
  /** The end time of the session */
  endTime: string;
  /** The duration of the session in minutes */
  duration: number;
  /** The specialty area of the session */
  specialtyArea?: string;
}

// ===== PLAN JOURNEY EVENT PAYLOADS =====

/**
 * Interface for claim submitted event payload.
 * This is used with the CLAIM_SUBMITTED event type.
 */
export interface ClaimSubmittedPayload {
  /** The ID of the claim that was submitted */
  claimId: string;
  /** The amount of the claim */
  amount: number;
  /** The type of claim */
  claimType?: string;
  /** The timestamp when the claim was submitted */
  submittedAt: string;
  /** Whether the claim has supporting documents */
  hasDocuments?: boolean;
  /** Whether this is the first claim submitted by the user */
  isFirstClaim?: boolean;
}

/**
 * Interface for benefit utilized event payload.
 * This is used with the BENEFIT_VIEWED event type.
 */
export interface BenefitUtilizedPayload {
  /** The ID of the benefit that was utilized */
  benefitId: string;
  /** The type of benefit */
  benefitType: string;
  /** The timestamp when the benefit was utilized */
  utilizedAt: string;
  /** The amount saved by utilizing the benefit */
  savingsAmount?: number;
  /** Whether this is the first time the benefit was utilized */
  isFirstUtilization?: boolean;
}

/**
 * Interface for plan selected event payload.
 * This is used with the PLAN_SELECTED event type.
 */
export interface PlanSelectedPayload {
  /** The ID of the plan that was selected */
  planId: string;
  /** The type of plan */
  planType: string;
  /** The timestamp when the plan was selected */
  selectedAt: string;
  /** The coverage level of the plan */
  coverageLevel?: string;
  /** The annual cost of the plan */
  annualCost?: number;
  /** Whether this is a new enrollment or a plan change */
  isNewEnrollment?: boolean;
}

// ===== COMMON EVENT PAYLOADS =====

/**
 * Interface for achievement unlocked event payload.
 * This is used with the ACHIEVEMENT_UNLOCKED event type.
 */
export interface AchievementUnlockedPayload {
  /** The ID of the achievement that was unlocked */
  achievementId: string;
  /** The name of the achievement */
  achievementName: string;
  /** The timestamp when the achievement was unlocked */
  unlockedAt: string;
  /** The number of points awarded for the achievement */
  pointsAwarded: number;
  /** The journey associated with the achievement */
  journey?: 'health' | 'care' | 'plan' | 'cross-journey';
  /** The rarity of the achievement */
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/**
 * Interface for quest completed event payload.
 * This is used with the QUEST_COMPLETED event type.
 */
export interface QuestCompletedPayload {
  /** The ID of the quest that was completed */
  questId: string;
  /** The name of the quest */
  questName: string;
  /** The timestamp when the quest was completed */
  completedAt: string;
  /** The number of points awarded for completing the quest */
  pointsAwarded: number;
  /** The journey associated with the quest */
  journey?: 'health' | 'care' | 'plan' | 'cross-journey';
}

/**
 * Interface for reward redeemed event payload.
 * This is used with the REWARD_REDEEMED event type.
 */
export interface RewardRedeemedPayload {
  /** The ID of the reward that was redeemed */
  rewardId: string;
  /** The name of the reward */
  rewardName: string;
  /** The timestamp when the reward was redeemed */
  redeemedAt: string;
  /** The value of the reward */
  value?: number;
  /** The type of reward */
  rewardType?: 'discount' | 'cashback' | 'gift' | 'subscription' | 'access' | 'other';
}

// ===== TYPE GUARDS =====

/**
 * Import type guards from the event-types.ts file
 */
import { isHealthEventType, isCareEventType, isPlanEventType, isCommonEventType } from './event-types';

/**
 * Type guard to check if an event is a health journey event.
 * @param event The event to check
 * @returns True if the event is a health journey event
 */
export function isHealthJourneyEvent(event: GamificationEvent): boolean {
  return event.journey === 'health' || isHealthEventType(event.type);
}

/**
 * Type guard to check if an event is a care journey event.
 * @param event The event to check
 * @returns True if the event is a care journey event
 */
export function isCareJourneyEvent(event: GamificationEvent): boolean {
  return event.journey === 'care' || isCareEventType(event.type);
}

/**
 * Type guard to check if an event is a plan journey event.
 * @param event The event to check
 * @returns True if the event is a plan journey event
 */
export function isPlanJourneyEvent(event: GamificationEvent): boolean {
  return event.journey === 'plan' || isPlanEventType(event.type);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Parses a version string into an EventVersion object.
 * @param versionStr The version string to parse (e.g., "1.2.3")
 * @returns An EventVersion object
 */
export function parseVersion(versionStr: string): EventVersion {
  const parts = versionStr.split('.');
  return {
    major: parseInt(parts[0], 10) || 0,
    minor: parseInt(parts[1], 10) || 0,
    patch: parseInt(parts[2], 10) || 0,
    toString: () => versionStr
  };
}

/**
 * Compares two version objects.
 * @param v1 The first version
 * @param v2 The second version
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: EventVersion, v2: EventVersion): number {
  if (v1.major !== v2.major) {
    return v1.major < v2.major ? -1 : 1;
  }
  if (v1.minor !== v2.minor) {
    return v1.minor < v2.minor ? -1 : 1;
  }
  if (v1.patch !== v2.patch) {
    return v1.patch < v2.patch ? -1 : 1;
  }
  return 0;
}

/**
 * Creates a new gamification event.
 * @param type The event type
 * @param userId The user ID
 * @param payload The event payload
 * @param journey The optional journey
 * @returns A new GamificationEvent object
 */
export function createEvent<T>(type: EventType, userId: string, payload: EventPayload<T>, journey?: JourneyType): GamificationEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    userId,
    payload,
    journey,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  };
}

/**
 * Import utility functions from the event-types.ts file
 */
import { getJourneyForEventType } from './event-types';

/**
 * Checks if two events are compatible (have the same major version).
 * @param event1 The first event
 * @param event2 The second event
 * @returns True if the events are compatible
 */
export function areEventsCompatible(event1: GamificationEvent, event2: GamificationEvent): boolean {
  const v1 = parseVersion(event1.version);
  const v2 = parseVersion(event2.version);
  return v1.major === v2.major;
}