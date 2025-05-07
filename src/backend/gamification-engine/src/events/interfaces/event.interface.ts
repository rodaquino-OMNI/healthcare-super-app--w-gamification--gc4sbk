/**
 * @file event.interface.ts
 * @description Defines core TypeScript interfaces for event data structures used throughout the gamification engine.
 * Provides the foundation for all event-related types, ensuring type safety and consistent data modeling
 * across the event processing pipeline.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Develop validation mechanisms for all event types
 * - Integrate with @austa/interfaces package for standardized schema definitions
 * - Document event schema for all journeys
 */

import { JourneyType } from '@austa/interfaces/common';
import { EventTypeId } from './event-type.interface';
import {
  IHealthMetric,
  IHealthGoal,
  MetricType,
  GoalType
} from '@austa/interfaces/journey/health';

import {
  IAppointment,
  IMedication,
  AppointmentType
} from '@austa/interfaces/journey/care';

import {
  IClaim,
  IBenefit,
  ClaimStatus
} from '@austa/interfaces/journey/plan';

/**
 * Base interface for all events in the gamification system.
 * This is the primary interface that all event types extend.
 * 
 * @interface IEvent
 */
export interface IEvent {
  /**
   * Unique identifier for the event
   */
  id?: string;

  /**
   * Type of the event, used for rule matching and processing
   * @example 'HEALTH_GOAL_ACHIEVED', 'APPOINTMENT_COMPLETED', 'CLAIM_SUBMITTED'
   */
  type: EventTypeId;

  /**
   * User ID associated with the event
   */
  userId: string;

  /**
   * Event-specific data that varies based on event type
   */
  data: Record<string, any>;

  /**
   * Source journey that generated the event
   * Optional for system-generated events
   */
  journey?: JourneyType;

  /**
   * Timestamp when the event occurred
   * ISO 8601 format
   */
  timestamp?: string;

  /**
   * Event schema version for backward compatibility
   * @default '1.0'
   */
  version?: string;

  /**
   * Optional correlation ID for tracking event processing across services
   */
  correlationId?: string;
}

/**
 * Enhanced base interface for all gamification events in the AUSTA SuperApp.
 * Extends the basic IEvent interface with additional gamification-specific properties.
 * 
 * @interface IBaseEvent
 * @extends IEvent
 */
export interface IBaseEvent extends IEvent {
  /**
   * Timestamp when the event occurred
   * ISO 8601 format
   * Required in IBaseEvent (optional in IEvent)
   */
  timestamp: string;

  /**
   * Event payload containing journey-specific data
   */
  payload: IEventPayload;
}

/**
 * Interface for event payloads with generic type parameter for type safety.
 * Allows for journey-specific event data with proper type checking.
 * 
 * @interface IEventPayload
 * @template T Type of the event data
 */
export interface IEventPayload<T = any> {
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
 * Interface for health journey events
 * @interface IHealthEvent
 * @extends IBaseEvent
 */
export interface IHealthEvent extends IBaseEvent {
  journey: 'health';
  payload: IEventPayload<IHealthEventData>;
}

/**
 * Interface for care journey events
 * @interface ICareEvent
 * @extends IBaseEvent
 */
export interface ICareEvent extends IBaseEvent {
  journey: 'care';
  payload: IEventPayload<ICareEventData>;
}

/**
 * Interface for plan journey events
 * @interface IPlanEvent
 * @extends IBaseEvent
 */
export interface IPlanEvent extends IBaseEvent {
  journey: 'plan';
  payload: IEventPayload<IPlanEventData>;
}

/**
 * Interface for system-generated events not tied to a specific journey
 * @interface ISystemEvent
 * @extends IBaseEvent
 */
export interface ISystemEvent extends IBaseEvent {
  journey?: undefined;
  payload: IEventPayload<ISystemEventData>;
}

/**
 * Union type of all possible event types in the system
 * @type GamificationEvent
 */
export type GamificationEvent = IHealthEvent | ICareEvent | IPlanEvent | ISystemEvent;

/**
 * Health journey event data interface
 * @interface IHealthEventData
 */
export interface IHealthEventData {
  /**
   * Optional health metric information
   */
  metric?: {
    type: MetricType;
    value: number;
    unit: string;
    source?: string;
    previousValue?: number;
    changePercentage?: number;
  };

  /**
   * Optional health goal information
   */
  goal?: {
    id: string;
    type: GoalType;
    progress: number;
    completed: boolean;
    targetValue: number;
    actualValue: number;
    streakCount?: number;
  };

  /**
   * Optional device connection information
   */
  device?: {
    id: string;
    type: string;
    action: 'connected' | 'disconnected' | 'synced';
    connectionTime?: string;
    isFirstConnection?: boolean;
  };

  /**
   * Optional health insight information
   */
  insight?: {
    id: string;
    type: string;
    relatedMetrics: MetricType[];
    severity: 'low' | 'medium' | 'high';
    generatedAt: string;
  };
}

/**
 * Care journey event data interface
 * @interface ICareEventData
 */
export interface ICareEventData {
  /**
   * Optional appointment information
   */
  appointment?: {
    id: string;
    type: AppointmentType;
    status: 'scheduled' | 'completed' | 'cancelled';
    providerId: string;
    scheduledFor?: string;
    completedAt?: string;
    duration?: number; // in minutes
    isFirstAppointment?: boolean;
    specialtyArea?: string;
    followUpScheduled?: boolean;
  };

  /**
   * Optional medication information
   */
  medication?: {
    id: string;
    action: 'taken' | 'skipped' | 'scheduled';
    takenAt?: string;
    dosage?: string;
    adherencePercentage?: number; // 0-100
    onSchedule?: boolean;
    streakDays?: number;
  };

  /**
   * Optional telemedicine session information
   */
  telemedicine?: {
    id: string;
    providerId: string;
    startTime: string;
    endTime: string;
    duration: number; // in minutes
    status: 'completed' | 'cancelled' | 'missed';
    specialtyArea?: string;
  };

  /**
   * Optional symptom checker information
   */
  symptomChecker?: {
    symptomIds: string[];
    checkedAt: string;
    severity: 'mild' | 'moderate' | 'severe';
    recommendationProvided: boolean;
  };
}

/**
 * Plan journey event data interface
 * @interface IPlanEventData
 */
export interface IPlanEventData {
  /**
   * Optional claim information
   */
  claim?: {
    id: string;
    status: ClaimStatus;
    submittedAt?: string;
    approvedAt?: string;
    amount: number;
    approvedAmount?: number;
    claimType?: string;
    hasDocuments?: boolean;
    isFirstClaim?: boolean;
    processingDuration?: number; // in days
  };

  /**
   * Optional benefit information
   */
  benefit?: {
    id: string;
    type: string;
    action: 'viewed' | 'used' | 'shared';
    utilizedAt?: string;
    savingsAmount?: number;
    isFirstUtilization?: boolean;
  };

  /**
   * Optional plan selection information
   */
  plan?: {
    id: string;
    action: 'viewed' | 'compared' | 'selected';
    selectedAt?: string;
    planType?: string;
    coverageLevel?: string;
    annualCost?: number;
    isNewEnrollment?: boolean;
  };

  /**
   * Optional document information
   */
  document?: {
    id: string;
    type: string;
    uploadedAt: string;
    fileSize: number; // in bytes
    relatedClaimId?: string;
  };
}

/**
 * System event data interface for events not tied to a specific journey
 * @interface ISystemEventData
 */
export interface ISystemEventData {
  /**
   * Optional achievement information
   */
  achievement?: {
    id: string;
    name?: string;
    action: 'unlocked' | 'progress';
    progress?: number;
    unlockedAt?: string;
    pointsAwarded?: number;
    journey?: 'health' | 'care' | 'plan' | 'cross-journey';
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };

  /**
   * Optional level information
   */
  level?: {
    old: number;
    new: number;
    pointsToNextLevel?: number;
    timestamp?: string;
  };

  /**
   * Optional reward information
   */
  reward?: {
    id: string;
    name?: string;
    action: 'earned' | 'redeemed';
    earnedAt?: string;
    redeemedAt?: string;
    value?: number;
    type?: 'discount' | 'cashback' | 'gift' | 'subscription' | 'access' | 'other';
  };

  /**
   * Optional quest information
   */
  quest?: {
    id: string;
    name?: string;
    action: 'started' | 'progressed' | 'completed';
    progress?: number;
    stepsCompleted?: number;
    totalSteps?: number;
    completedAt?: string;
    pointsAwarded?: number;
    journey?: 'health' | 'care' | 'plan' | 'cross-journey';
  };
}

/**
 * Type guard to check if an event is a health event
 * @param event The event to check
 * @returns True if the event is a health event
 */
export function isHealthEvent(event: IEvent): event is IHealthEvent {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is a care event
 * @param event The event to check
 * @returns True if the event is a care event
 */
export function isCareEvent(event: IEvent): event is ICareEvent {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is a plan event
 * @param event The event to check
 * @returns True if the event is a plan event
 */
export function isPlanEvent(event: IEvent): event is IPlanEvent {
  return event.journey === 'plan';
}

/**
 * Type guard to check if an event is a system event
 * @param event The event to check
 * @returns True if the event is a system event
 */
export function isSystemEvent(event: IEvent): event is ISystemEvent {
  return event.journey === undefined;
}

/**
 * Creates a new event with the specified properties
 * @param type The event type
 * @param userId The user ID
 * @param data The event data
 * @param journey The optional journey
 * @returns A new IEvent object
 */
export function createEvent(type: EventTypeId, userId: string, data: Record<string, any>, journey?: JourneyType): IEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    userId,
    data,
    journey,
    timestamp: new Date().toISOString(),
    version: '1.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  };
}

/**
 * Converts a ProcessEventDto to an IEvent
 * @param dto The ProcessEventDto to convert
 * @returns An IEvent object
 */
export function fromProcessEventDto(dto: { type: string; userId: string; data: object; journey?: string }): IEvent {
  return {
    type: dto.type as EventTypeId,
    userId: dto.userId,
    data: dto.data as Record<string, any>,
    journey: dto.journey as JourneyType,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
}

/**
 * Converts an IEvent to an IBaseEvent with a structured payload
 * @param event The IEvent to convert
 * @returns An IBaseEvent object
 */
export function toBaseEvent(event: IEvent): IBaseEvent {
  return {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
    payload: {
      data: event.data
    }
  };
}