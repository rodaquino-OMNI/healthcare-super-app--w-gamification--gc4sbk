/**
 * Journey-specific notification event interfaces for the AUSTA SuperApp.
 * 
 * This file defines type-safe contracts for notification events originating from different journeys,
 * ensuring proper journey context, theming, and processing logic based on the notification's source journey.
 * 
 * These interfaces integrate with journey-specific data models from @austa/interfaces to provide
 * consistent typing across the platform while supporting the journey-centered architecture.
 */

import { INotificationEvent } from './notification-event.interface';

// Import journey-specific interfaces from @austa/interfaces
import { IHealthGoal, IHealthMetric, IMedicalEvent, IDeviceConnection } from '@austa/interfaces/journey/health';
import { IAppointment, IMedication, ITelemedicineSession, ITreatmentPlan } from '@austa/interfaces/journey/care';
import { IClaim, IPlan, IBenefit, ICoverage } from '@austa/interfaces/journey/plan';
import { Achievement, Quest, Reward } from '@austa/interfaces/gamification';

/**
 * Enum defining all supported journey types in the AUSTA SuperApp.
 * Used as a discriminator for journey-specific notification events.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  CROSS_JOURNEY = 'cross_journey' // For notifications that span multiple journeys
}

/**
 * Base interface for all journey-specific notification events.
 * Extends the core notification event interface with journey context.
 */
export interface IJourneyNotificationEvent extends INotificationEvent {
  /**
   * The journey that originated this notification event.
   * Acts as a discriminator for the union type.
   */
  journey: JourneyType;
  
  /**
   * Journey-specific theming information for UI rendering.
   */
  journeyTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    iconName?: string;
  };
  
  /**
   * Optional deep link to the relevant section within the journey.
   */
  journeyDeepLink?: string;
}

/**
 * Health Journey notification event interface.
 * Contains health-specific notification data and context.
 */
export interface IHealthJourneyNotificationEvent extends IJourneyNotificationEvent {
  journey: JourneyType.HEALTH;
  
  /**
   * Type of health notification being sent.
   */
  healthNotificationType: 'goal' | 'metric' | 'device' | 'medical_event' | 'insight';
  
  /**
   * Health-specific data payload based on notification type.
   */
  healthData?: {
    goal?: IHealthGoal;
    metric?: IHealthMetric;
    device?: IDeviceConnection;
    medicalEvent?: IMedicalEvent;
    insight?: {
      type: string;
      description: string;
      severity: 'info' | 'warning' | 'alert';
      relatedMetrics?: string[];
    };
  };
  
  /**
   * Additional metadata for health notifications.
   */
  healthMetadata?: {
    trendDirection?: 'up' | 'down' | 'stable';
    percentageChange?: number;
    thresholdExceeded?: boolean;
    recommendedAction?: string;
  };
}

/**
 * Care Journey notification event interface.
 * Contains care-specific notification data and context.
 */
export interface ICareJourneyNotificationEvent extends IJourneyNotificationEvent {
  journey: JourneyType.CARE;
  
  /**
   * Type of care notification being sent.
   */
  careNotificationType: 'appointment' | 'medication' | 'telemedicine' | 'treatment' | 'provider';
  
  /**
   * Care-specific data payload based on notification type.
   */
  careData?: {
    appointment?: IAppointment;
    medication?: IMedication;
    telemedicineSession?: ITelemedicineSession;
    treatmentPlan?: ITreatmentPlan;
    provider?: {
      id: string;
      name: string;
      specialty?: string;
      message?: string;
    };
  };
  
  /**
   * Additional metadata for care notifications.
   */
  careMetadata?: {
    urgency?: 'low' | 'medium' | 'high';
    requiresAction?: boolean;
    expiresAt?: Date;
    reminderCount?: number;
  };
}

/**
 * Plan Journey notification event interface.
 * Contains plan-specific notification data and context.
 */
export interface IPlanJourneyNotificationEvent extends IJourneyNotificationEvent {
  journey: JourneyType.PLAN;
  
  /**
   * Type of plan notification being sent.
   */
  planNotificationType: 'claim' | 'plan' | 'benefit' | 'coverage' | 'document';
  
  /**
   * Plan-specific data payload based on notification type.
   */
  planData?: {
    claim?: IClaim;
    plan?: IPlan;
    benefit?: IBenefit;
    coverage?: ICoverage;
    document?: {
      id: string;
      name: string;
      type: string;
      url?: string;
      expirationDate?: Date;
    };
  };
  
  /**
   * Additional metadata for plan notifications.
   */
  planMetadata?: {
    financialImpact?: {
      amount?: number;
      currency?: string;
      type?: 'credit' | 'debit' | 'savings';
    };
    status?: string;
    deadlineDate?: Date;
  };
}

/**
 * Cross-Journey notification event interface for notifications that span multiple journeys.
 * Particularly useful for gamification achievements that may be earned across different journeys.
 */
export interface ICrossJourneyNotificationEvent extends IJourneyNotificationEvent {
  journey: JourneyType.CROSS_JOURNEY;
  
  /**
   * Type of cross-journey notification being sent.
   */
  crossJourneyType: 'achievement' | 'quest' | 'reward' | 'level_up' | 'system';
  
  /**
   * The specific journeys involved in this cross-journey notification.
   */
  involvedJourneys: JourneyType[];
  
  /**
   * Gamification-specific data payload based on notification type.
   */
  gamificationData?: {
    achievement?: Achievement;
    quest?: Quest;
    reward?: Reward;
    levelUp?: {
      oldLevel: number;
      newLevel: number;
      unlockedFeatures?: string[];
    };
  };
  
  /**
   * Additional metadata for cross-journey notifications.
   */
  crossJourneyMetadata?: {
    xpEarned?: number;
    streakCount?: number;
    milestoneReached?: string;
    congratulatoryMessage?: string;
  };
}

/**
 * Union type of all journey-specific notification events.
 * Enables type narrowing based on the 'journey' discriminator field.
 */
export type JourneyNotificationEvent =
  | IHealthJourneyNotificationEvent
  | ICareJourneyNotificationEvent
  | IPlanJourneyNotificationEvent
  | ICrossJourneyNotificationEvent;

/**
 * Type guard to check if a notification event is a Health journey event.
 */
export function isHealthJourneyEvent(event: JourneyNotificationEvent): event is IHealthJourneyNotificationEvent {
  return event.journey === JourneyType.HEALTH;
}

/**
 * Type guard to check if a notification event is a Care journey event.
 */
export function isCareJourneyEvent(event: JourneyNotificationEvent): event is ICareJourneyNotificationEvent {
  return event.journey === JourneyType.CARE;
}

/**
 * Type guard to check if a notification event is a Plan journey event.
 */
export function isPlanJourneyEvent(event: JourneyNotificationEvent): event is IPlanJourneyNotificationEvent {
  return event.journey === JourneyType.PLAN;
}

/**
 * Type guard to check if a notification event is a Cross-Journey event.
 */
export function isCrossJourneyEvent(event: JourneyNotificationEvent): event is ICrossJourneyNotificationEvent {
  return event.journey === JourneyType.CROSS_JOURNEY;
}