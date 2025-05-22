/**
 * Journey-specific notification event interfaces for the AUSTA SuperApp.
 * 
 * This file defines type-safe contracts for notification events originating from
 * different journeys (Health, Care, Plan), ensuring proper journey context, theming,
 * and processing logic based on the notification's source journey.
 */

import { JourneyType } from '@austa/interfaces/common';
import { IHealthGoal, IHealthMetric, IMedicalEvent, IDeviceConnection } from '@austa/interfaces/journey/health';
import { IAppointment, IMedication, IProvider, ITelemedicineSession, ITreatmentPlan } from '@austa/interfaces/journey/care';
import { IBenefit, IClaim, ICoverage, IPlan } from '@austa/interfaces/journey/plan';
import { IAchievement } from '@austa/interfaces/gamification';
import { INotificationEvent } from './notification-event.interface';
import { IVersionedNotificationEvent } from './notification-event-versioning.interface';

/**
 * Base interface for all journey-specific notification events.
 * Extends the core notification event interface with journey context.
 */
export interface IJourneyNotificationEvent extends INotificationEvent, IVersionedNotificationEvent {
  /**
   * The journey that originated this notification event.
   * Used for journey-specific theming and processing logic.
   */
  journey: JourneyType;
  
  /**
   * Optional metadata specific to the journey context.
   * Can contain additional information for advanced processing.
   */
  journeyMetadata?: Record<string, unknown>;
}

// ===== HEALTH JOURNEY NOTIFICATION EVENTS =====

/**
 * Base interface for all Health Journey notification events.
 * Provides type narrowing for health-specific notifications.
 */
export interface IHealthJourneyNotificationEvent extends IJourneyNotificationEvent {
  journey: JourneyType.HEALTH;
  
  /**
   * Health-specific metadata for advanced processing.
   */
  healthMetadata?: {
    /**
     * Optional category for health notifications (e.g., 'metrics', 'goals', 'insights').
     */
    category?: string;
    
    /**
     * Optional urgency level for health notifications.
     */
    urgency?: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Notification event for health goal updates.
 * Triggered when a user's health goal is created, updated, or achieved.
 */
export interface IHealthGoalNotificationEvent extends IHealthJourneyNotificationEvent {
  type: 'health:goal:created' | 'health:goal:updated' | 'health:goal:achieved' | 'health:goal:reminder';
  payload: {
    /**
     * The health goal associated with this notification.
     */
    goal: IHealthGoal;
    
    /**
     * Optional progress percentage (0-100) for goal tracking.
     */
    progress?: number;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

/**
 * Notification event for health metric updates.
 * Triggered when a significant health metric is recorded or when a metric
 * exceeds normal ranges.
 */
export interface IHealthMetricNotificationEvent extends IHealthJourneyNotificationEvent {
  type: 'health:metric:recorded' | 'health:metric:alert' | 'health:metric:trend';
  payload: {
    /**
     * The health metric associated with this notification.
     */
    metric: IHealthMetric;
    
    /**
     * Optional reference values for context (e.g., normal ranges).
     */
    referenceValues?: {
      min?: number;
      max?: number;
      target?: number;
    };
    
    /**
     * Optional trend information for metric changes over time.
     */
    trend?: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

/**
 * Notification event for medical events.
 * Triggered when a medical event is added to the user's health record.
 */
export interface IMedicalEventNotificationEvent extends IHealthJourneyNotificationEvent {
  type: 'health:medical:added' | 'health:medical:updated' | 'health:medical:reminder';
  payload: {
    /**
     * The medical event associated with this notification.
     */
    medicalEvent: IMedicalEvent;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

/**
 * Notification event for device connections.
 * Triggered when a health device is connected, disconnected, or requires sync.
 */
export interface IDeviceConnectionNotificationEvent extends IHealthJourneyNotificationEvent {
  type: 'health:device:connected' | 'health:device:disconnected' | 'health:device:sync_required' | 'health:device:sync_completed';
  payload: {
    /**
     * The device connection associated with this notification.
     */
    deviceConnection: IDeviceConnection;
    
    /**
     * Optional last sync timestamp.
     */
    lastSyncAt?: Date;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

// ===== CARE JOURNEY NOTIFICATION EVENTS =====

/**
 * Base interface for all Care Journey notification events.
 * Provides type narrowing for care-specific notifications.
 */
export interface ICareJourneyNotificationEvent extends IJourneyNotificationEvent {
  journey: JourneyType.CARE;
  
  /**
   * Care-specific metadata for advanced processing.
   */
  careMetadata?: {
    /**
     * Optional category for care notifications (e.g., 'appointment', 'medication', 'telemedicine').
     */
    category?: string;
    
    /**
     * Optional priority level for care notifications.
     */
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  };
}

/**
 * Notification event for appointments.
 * Triggered for appointment scheduling, reminders, and status changes.
 */
export interface IAppointmentNotificationEvent extends ICareJourneyNotificationEvent {
  type: 'care:appointment:scheduled' | 'care:appointment:reminder' | 'care:appointment:canceled' | 'care:appointment:rescheduled' | 'care:appointment:confirmed';
  payload: {
    /**
     * The appointment associated with this notification.
     */
    appointment: IAppointment;
    
    /**
     * Optional provider information for the appointment.
     */
    provider?: IProvider;
    
    /**
     * Optional time until the appointment (in minutes).
     */
    timeUntilAppointment?: number;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

/**
 * Notification event for medications.
 * Triggered for medication reminders, refills, and adherence tracking.
 */
export interface IMedicationNotificationEvent extends ICareJourneyNotificationEvent {
  type: 'care:medication:reminder' | 'care:medication:refill' | 'care:medication:adherence' | 'care:medication:added';
  payload: {
    /**
     * The medication associated with this notification.
     */
    medication: IMedication;
    
    /**
     * Optional adherence percentage (0-100) for medication tracking.
     */
    adherencePercentage?: number;
    
    /**
     * Optional days supply remaining for refill reminders.
     */
    daysSupplyRemaining?: number;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

/**
 * Notification event for telemedicine sessions.
 * Triggered for session scheduling, reminders, and status updates.
 */
export interface ITelemedicineNotificationEvent extends ICareJourneyNotificationEvent {
  type: 'care:telemedicine:scheduled' | 'care:telemedicine:reminder' | 'care:telemedicine:started' | 'care:telemedicine:ended' | 'care:telemedicine:canceled';
  payload: {
    /**
     * The telemedicine session associated with this notification.
     */
    session: ITelemedicineSession;
    
    /**
     * Optional provider information for the session.
     */
    provider?: IProvider;
    
    /**
     * Optional time until the session (in minutes).
     */
    timeUntilSession?: number;
    
    /**
     * Optional join URL for the telemedicine session.
     */
    joinUrl?: string;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

/**
 * Notification event for treatment plans.
 * Triggered for plan updates, activity reminders, and progress tracking.
 */
export interface ITreatmentPlanNotificationEvent extends ICareJourneyNotificationEvent {
  type: 'care:treatment:created' | 'care:treatment:updated' | 'care:treatment:activity_reminder' | 'care:treatment:completed';
  payload: {
    /**
     * The treatment plan associated with this notification.
     */
    treatmentPlan: ITreatmentPlan;
    
    /**
     * Optional progress percentage (0-100) for treatment plan tracking.
     */
    progress?: number;
    
    /**
     * Optional activity name for activity reminders.
     */
    activityName?: string;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

// ===== PLAN JOURNEY NOTIFICATION EVENTS =====

/**
 * Base interface for all Plan Journey notification events.
 * Provides type narrowing for plan-specific notifications.
 */
export interface IPlanJourneyNotificationEvent extends IJourneyNotificationEvent {
  journey: JourneyType.PLAN;
  
  /**
   * Plan-specific metadata for advanced processing.
   */
  planMetadata?: {
    /**
     * Optional category for plan notifications (e.g., 'claim', 'benefit', 'coverage').
     */
    category?: string;
    
    /**
     * Optional importance level for plan notifications.
     */
    importance?: 'low' | 'medium' | 'high';
  };
}

/**
 * Notification event for insurance claims.
 * Triggered for claim status updates, approvals, denials, and information requests.
 */
export interface IClaimNotificationEvent extends IPlanJourneyNotificationEvent {
  type: 'plan:claim:submitted' | 'plan:claim:updated' | 'plan:claim:approved' | 'plan:claim:denied' | 'plan:claim:info_required' | 'plan:claim:payment_processed';
  payload: {
    /**
     * The claim associated with this notification.
     */
    claim: IClaim;
    
    /**
     * Optional previous status for status change notifications.
     */
    previousStatus?: string;
    
    /**
     * Optional payment amount for approved claims.
     */
    paymentAmount?: number;
    
    /**
     * Optional additional information required for info_required notifications.
     */
    infoRequired?: string[];
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

/**
 * Notification event for insurance benefits.
 * Triggered for benefit utilization, updates, and eligibility changes.
 */
export interface IBenefitNotificationEvent extends IPlanJourneyNotificationEvent {
  type: 'plan:benefit:utilized' | 'plan:benefit:updated' | 'plan:benefit:expiring' | 'plan:benefit:renewed';
  payload: {
    /**
     * The benefit associated with this notification.
     */
    benefit: IBenefit;
    
    /**
     * Optional utilization percentage (0-100) for benefit tracking.
     */
    utilizationPercentage?: number;
    
    /**
     * Optional days until expiration for expiring benefits.
     */
    daysUntilExpiration?: number;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

/**
 * Notification event for insurance plans.
 * Triggered for plan enrollment, updates, and renewal reminders.
 */
export interface IPlanNotificationEvent extends IPlanJourneyNotificationEvent {
  type: 'plan:enrollment:completed' | 'plan:enrollment:updated' | 'plan:renewal:reminder' | 'plan:renewal:completed';
  payload: {
    /**
     * The insurance plan associated with this notification.
     */
    plan: IPlan;
    
    /**
     * Optional coverage information for the plan.
     */
    coverage?: ICoverage;
    
    /**
     * Optional days until renewal for renewal reminders.
     */
    daysUntilRenewal?: number;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

// ===== CROSS-JOURNEY NOTIFICATION EVENTS =====

/**
 * Notification event for achievements across all journeys.
 * Triggered when a user unlocks an achievement in any journey.
 */
export interface IAchievementNotificationEvent extends IJourneyNotificationEvent {
  type: 'gamification:achievement:unlocked' | 'gamification:achievement:progress';
  payload: {
    /**
     * The achievement associated with this notification.
     */
    achievement: IAchievement;
    
    /**
     * The journey that triggered this achievement.
     * May be different from the notification's primary journey.
     */
    sourceJourney: JourneyType;
    
    /**
     * Optional progress percentage (0-100) for achievement tracking.
     */
    progress?: number;
    
    /**
     * Optional XP points awarded for this achievement.
     */
    xpAwarded?: number;
    
    /**
     * Optional message to display with the notification.
     */
    message?: string;
  };
}

// ===== TYPE UTILITIES =====

/**
 * Union type of all Health Journey notification events.
 */
export type HealthJourneyNotificationEvent = 
  | IHealthGoalNotificationEvent
  | IHealthMetricNotificationEvent
  | IMedicalEventNotificationEvent
  | IDeviceConnectionNotificationEvent;

/**
 * Union type of all Care Journey notification events.
 */
export type CareJourneyNotificationEvent = 
  | IAppointmentNotificationEvent
  | IMedicationNotificationEvent
  | ITelemedicineNotificationEvent
  | ITreatmentPlanNotificationEvent;

/**
 * Union type of all Plan Journey notification events.
 */
export type PlanJourneyNotificationEvent = 
  | IClaimNotificationEvent
  | IBenefitNotificationEvent
  | IPlanNotificationEvent;

/**
 * Union type of all journey-specific notification events.
 * Use this type for handling all possible journey notification events.
 */
export type JourneyNotificationEvent = 
  | HealthJourneyNotificationEvent
  | CareJourneyNotificationEvent
  | PlanJourneyNotificationEvent
  | IAchievementNotificationEvent;

/**
 * Type guard to check if a notification event is from the Health Journey.
 * 
 * @param event The notification event to check
 * @returns True if the event is a Health Journey notification event
 */
export function isHealthJourneyNotificationEvent(
  event: JourneyNotificationEvent
): event is HealthJourneyNotificationEvent {
  return event.journey === JourneyType.HEALTH;
}

/**
 * Type guard to check if a notification event is from the Care Journey.
 * 
 * @param event The notification event to check
 * @returns True if the event is a Care Journey notification event
 */
export function isCareJourneyNotificationEvent(
  event: JourneyNotificationEvent
): event is CareJourneyNotificationEvent {
  return event.journey === JourneyType.CARE;
}

/**
 * Type guard to check if a notification event is from the Plan Journey.
 * 
 * @param event The notification event to check
 * @returns True if the event is a Plan Journey notification event
 */
export function isPlanJourneyNotificationEvent(
  event: JourneyNotificationEvent
): event is PlanJourneyNotificationEvent {
  return event.journey === JourneyType.PLAN;
}

/**
 * Type guard to check if a notification event is an Achievement notification.
 * 
 * @param event The notification event to check
 * @returns True if the event is an Achievement notification event
 */
export function isAchievementNotificationEvent(
  event: JourneyNotificationEvent
): event is IAchievementNotificationEvent {
  return event.type.startsWith('gamification:achievement:');
}