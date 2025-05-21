/**
 * @file Event interfaces for the gamification engine
 * @description Defines core TypeScript interfaces for event data structures used throughout the gamification engine.
 * These interfaces provide the foundation for all event-related types, ensuring type safety and consistent
 * data modeling across the event processing pipeline.
 */

import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Base event interface that all gamification events must implement.
 * Provides essential properties required for event processing and tracking.
 */
export interface IBaseEvent {
  /**
   * Unique identifier for the event
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id?: string;

  /**
   * The type of event that occurred
   * @example "APPOINTMENT_BOOKED", "HEALTH_GOAL_ACHIEVED", "CLAIM_SUBMITTED"
   */
  type: string;

  /**
   * The user ID associated with this event
   * @example "user_123456"
   */
  userId: string;

  /**
   * ISO timestamp when the event occurred
   * @example "2023-04-15T14:32:17.000Z"
   */
  timestamp: string;

  /**
   * The journey context where the event originated
   * @example "HEALTH", "CARE", "PLAN"
   */
  journey?: JourneyType;

  /**
   * The source service that generated this event
   * @example "health-service", "care-service", "plan-service"
   */
  source?: string;

  /**
   * Version of the event schema, used for backward compatibility
   * @example "1.0", "2.3"
   */
  version?: string;

  /**
   * Event-specific payload data
   */
  data: IEventPayload;
}

/**
 * Interface for event payload data with generic typing support.
 * Allows for type-safe access to event-specific data structures.
 */
export interface IEventPayload {
  /**
   * Any valid event data properties
   * The structure varies based on the event type
   */
  [key: string]: any;
}

/**
 * Health journey event payload interface
 * Contains data specific to health-related events
 */
export interface IHealthEventPayload extends IEventPayload {
  /**
   * Optional metric type for health measurements
   * @example "STEPS", "HEART_RATE", "BLOOD_PRESSURE"
   */
  metricType?: string;

  /**
   * Optional metric value for health measurements
   * @example 10000, 72, "120/80"
   */
  metricValue?: number | string;

  /**
   * Optional goal ID reference for goal-related events
   * @example "goal_123456"
   */
  goalId?: string;

  /**
   * Optional device ID for device-generated events
   * @example "device_123456"
   */
  deviceId?: string;
}

/**
 * Care journey event payload interface
 * Contains data specific to care-related events
 */
export interface ICareEventPayload extends IEventPayload {
  /**
   * Optional appointment ID for appointment-related events
   * @example "appointment_123456"
   */
  appointmentId?: string;

  /**
   * Optional provider ID for provider-related events
   * @example "provider_123456"
   */
  providerId?: string;

  /**
   * Optional medication ID for medication-related events
   * @example "medication_123456"
   */
  medicationId?: string;

  /**
   * Optional telemedicine session ID for telemedicine-related events
   * @example "telemedicine_123456"
   */
  telemedicineId?: string;
}

/**
 * Plan journey event payload interface
 * Contains data specific to plan-related events
 */
export interface IPlanEventPayload extends IEventPayload {
  /**
   * Optional claim ID for claim-related events
   * @example "claim_123456"
   */
  claimId?: string;

  /**
   * Optional plan ID for plan-related events
   * @example "plan_123456"
   */
  planId?: string;

  /**
   * Optional benefit ID for benefit-related events
   * @example "benefit_123456"
   */
  benefitId?: string;

  /**
   * Optional amount for financial transactions
   * @example 150.75
   */
  amount?: number;
}

/**
 * Gamification event payload interface
 * Contains data specific to gamification-related events
 */
export interface IGamificationEventPayload extends IEventPayload {
  /**
   * Optional achievement ID for achievement-related events
   * @example "achievement_123456"
   */
  achievementId?: string;

  /**
   * Optional quest ID for quest-related events
   * @example "quest_123456"
   */
  questId?: string;

  /**
   * Optional reward ID for reward-related events
   * @example "reward_123456"
   */
  rewardId?: string;

  /**
   * Optional XP amount for experience-related events
   * @example 100
   */
  xp?: number;

  /**
   * Optional level information for level-related events
   * @example { oldLevel: 1, newLevel: 2 }
   */
  level?: {
    oldLevel: number;
    newLevel: number;
  };
}

/**
 * Event validation result interface
 * Used to return the result of event validation operations
 */
export interface IEventValidationResult {
  /**
   * Whether the event is valid
   */
  isValid: boolean;

  /**
   * Error messages if validation failed
   */
  errors?: string[];
}