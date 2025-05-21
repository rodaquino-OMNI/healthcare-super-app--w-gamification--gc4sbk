/**
 * @file achievement-events.types.ts
 * @description Type-safe event schema interfaces for all achievement-related events processed by the gamification engine.
 * Ensures consistent event structure and versioning across all journey services.
 */

import { AchievementEventType, AchievementStatus } from '../interfaces/achievement-status.enum';
import { IAchievement } from '../interfaces/i-achievement.interface';
import { IUserAchievement } from '../interfaces/i-user-achievement.interface';

/**
 * Import versioning interfaces from @austa/interfaces package
 */
import {
  IVersionedEvent,
  IEventVersion,
  EventSchemaVersion,
} from '@austa/interfaces/gamification/events';

/**
 * Event version metadata for achievement events
 * Follows semantic versioning pattern
 */
export const ACHIEVEMENT_EVENT_VERSION: IEventVersion = {
  major: 1,
  minor: 0,
  patch: 0,
  schemaVersion: EventSchemaVersion.V1,
};

/**
 * Base interface for all achievement event payloads
 * Contains common properties shared across all achievement events
 */
export interface IAchievementEventBasePayload {
  /** The unique identifier of the achievement */
  achievementId: string;
  
  /** The unique identifier of the user */
  userId: string;
  
  /** The journey this achievement belongs to (health, care, plan) */
  journey: 'health' | 'care' | 'plan' | 'cross-journey';
  
  /** Timestamp when the event occurred */
  timestamp: string;
  
  /** Optional metadata for additional context */
  metadata?: Record<string, any>;
}

/**
 * Interface for achievement unlocked event payloads
 * Contains data specific to when a user unlocks an achievement
 */
export interface IAchievementUnlockedPayload extends IAchievementEventBasePayload {
  /** The achievement that was unlocked */
  achievement: Partial<IAchievement>;
  
  /** The XP reward granted for unlocking the achievement */
  xpAwarded: number;
  
  /** Any additional rewards granted */
  additionalRewards?: {
    /** Identifier of the reward */
    rewardId: string;
    /** Type of reward */
    rewardType: string;
    /** Value of the reward */
    value: any;
  }[];
}

/**
 * Interface for achievement progress event payloads
 * Contains data about a user's progress toward unlocking an achievement
 */
export interface IAchievementProgressPayload extends IAchievementEventBasePayload {
  /** Current progress value */
  currentValue: number;
  
  /** Target value needed to unlock the achievement */
  targetValue: number;
  
  /** Calculated percentage of completion (0-100) */
  percentComplete: number;
  
  /** Previous progress value before this update */
  previousValue?: number;
  
  /** The action that triggered this progress update */
  triggeringAction?: string;
}

/**
 * Interface for achievement reset event payloads
 * Contains data about resetting a user's progress on an achievement
 */
export interface IAchievementResetPayload extends IAchievementEventBasePayload {
  /** Reason for the reset */
  reason: string;
  
  /** Previous status before reset */
  previousStatus: AchievementStatus;
  
  /** Previous progress value before reset */
  previousProgress?: number;
  
  /** Whether XP should be deducted */
  deductXp: boolean;
  
  /** Amount of XP to deduct if applicable */
  xpToDeduct?: number;
}

/**
 * Interface for achievement created event payloads
 * Contains data about a newly created achievement in the system
 */
export interface IAchievementCreatedPayload extends IAchievementEventBasePayload {
  /** The newly created achievement */
  achievement: IAchievement;
}

/**
 * Interface for achievement updated event payloads
 * Contains data about updates to an existing achievement
 */
export interface IAchievementUpdatedPayload extends IAchievementEventBasePayload {
  /** The updated achievement */
  achievement: Partial<IAchievement>;
  
  /** Fields that were updated */
  updatedFields: string[];
}

/**
 * Health journey specific achievement event payloads
 */
export namespace HealthJourney {
  /**
   * Interface for health metric achievement event payloads
   * Triggered when a health metric contributes to achievement progress
   */
  export interface IHealthMetricAchievementPayload extends IAchievementProgressPayload {
    /** The type of health metric recorded */
    metricType: string;
    
    /** The value of the health metric */
    metricValue: number;
    
    /** The unit of measurement */
    metricUnit: string;
    
    /** Whether this is a new personal record */
    isPersonalRecord?: boolean;
  }
  
  /**
   * Interface for health goal achievement event payloads
   * Triggered when a health goal is completed
   */
  export interface IHealthGoalAchievementPayload extends IAchievementUnlockedPayload {
    /** The ID of the completed goal */
    goalId: string;
    
    /** The type of goal completed */
    goalType: string;
    
    /** The target value that was achieved */
    goalTarget: number;
    
    /** The streak count if applicable */
    streak?: number;
  }
  
  /**
   * Interface for device connection achievement event payloads
   * Triggered when a health device is connected
   */
  export interface IDeviceConnectionAchievementPayload extends IAchievementProgressPayload {
    /** The type of device connected */
    deviceType: string;
    
    /** The ID of the connected device */
    deviceId: string;
    
    /** The number of devices connected by the user */
    totalDevicesConnected: number;
  }
}

/**
 * Care journey specific achievement event payloads
 */
export namespace CareJourney {
  /**
   * Interface for appointment booking achievement event payloads
   * Triggered when an appointment is booked
   */
  export interface IAppointmentBookingAchievementPayload extends IAchievementProgressPayload {
    /** The type of appointment booked */
    appointmentType: string;
    
    /** The ID of the booked appointment */
    appointmentId: string;
    
    /** The total number of appointments booked by the user */
    totalAppointmentsBooked: number;
  }
  
  /**
   * Interface for medication adherence achievement event payloads
   * Triggered when medication is taken as prescribed
   */
  export interface IMedicationAdherenceAchievementPayload extends IAchievementProgressPayload {
    /** The ID of the medication */
    medicationId: string;
    
    /** The name of the medication */
    medicationName: string;
    
    /** The current adherence streak */
    adherenceStreak: number;
    
    /** The overall adherence percentage */
    adherencePercentage: number;
  }
  
  /**
   * Interface for telemedicine session achievement event payloads
   * Triggered when a telemedicine session is completed
   */
  export interface ITelemedicineSessionAchievementPayload extends IAchievementProgressPayload {
    /** The ID of the telemedicine session */
    sessionId: string;
    
    /** The duration of the session in minutes */
    sessionDuration: number;
    
    /** The total number of telemedicine sessions completed */
    totalSessionsCompleted: number;
  }
}

/**
 * Plan journey specific achievement event payloads
 */
export namespace PlanJourney {
  /**
   * Interface for claim submission achievement event payloads
   * Triggered when an insurance claim is submitted
   */
  export interface IClaimSubmissionAchievementPayload extends IAchievementProgressPayload {
    /** The ID of the submitted claim */
    claimId: string;
    
    /** The type of claim submitted */
    claimType: string;
    
    /** The total number of claims submitted by the user */
    totalClaimsSubmitted: number;
  }
  
  /**
   * Interface for benefit utilization achievement event payloads
   * Triggered when a benefit is utilized
   */
  export interface IBenefitUtilizationAchievementPayload extends IAchievementProgressPayload {
    /** The ID of the utilized benefit */
    benefitId: string;
    
    /** The type of benefit utilized */
    benefitType: string;
    
    /** The total number of benefits utilized by the user */
    totalBenefitsUtilized: number;
  }
  
  /**
   * Interface for plan selection achievement event payloads
   * Triggered when a plan is selected or changed
   */
  export interface IPlanSelectionAchievementPayload extends IAchievementProgressPayload {
    /** The ID of the selected plan */
    planId: string;
    
    /** The type of plan selected */
    planType: string;
    
    /** Whether this is the first plan selection */
    isFirstSelection: boolean;
  }
}

/**
 * Type union of all achievement event payload types
 * Useful for discriminated unions in event handlers
 */
export type AchievementEventPayload =
  | IAchievementUnlockedPayload
  | IAchievementProgressPayload
  | IAchievementResetPayload
  | IAchievementCreatedPayload
  | IAchievementUpdatedPayload
  | HealthJourney.IHealthMetricAchievementPayload
  | HealthJourney.IHealthGoalAchievementPayload
  | HealthJourney.IDeviceConnectionAchievementPayload
  | CareJourney.IAppointmentBookingAchievementPayload
  | CareJourney.IMedicationAdherenceAchievementPayload
  | CareJourney.ITelemedicineSessionAchievementPayload
  | PlanJourney.IClaimSubmissionAchievementPayload
  | PlanJourney.IBenefitUtilizationAchievementPayload
  | PlanJourney.IPlanSelectionAchievementPayload;

/**
 * Base interface for all achievement events
 * Implements the IVersionedEvent interface for proper versioning
 */
export interface IAchievementEventBase extends IVersionedEvent {
  /** The type of achievement event */
  type: AchievementEventType;
  
  /** The version information for this event */
  version: IEventVersion;
  
  /** The source service that generated this event */
  source: string;
  
  /** The payload of the event */
  payload: AchievementEventPayload;
}

/**
 * Interface for achievement unlocked events
 * Represents the complete event when a user unlocks an achievement
 */
export interface IAchievementUnlockedEvent extends IAchievementEventBase {
  type: AchievementEventType.ACHIEVEMENT_UNLOCKED;
  payload: IAchievementUnlockedPayload;
}

/**
 * Interface for achievement progress events
 * Represents the complete event when a user makes progress toward an achievement
 */
export interface IAchievementProgressEvent extends IAchievementEventBase {
  type: AchievementEventType.ACHIEVEMENT_PROGRESS;
  payload: IAchievementProgressPayload;
}

/**
 * Interface for achievement reset events
 * Represents the complete event when a user's achievement progress is reset
 */
export interface IAchievementResetEvent extends IAchievementEventBase {
  type: AchievementEventType.ACHIEVEMENT_RESET;
  payload: IAchievementResetPayload;
}

/**
 * Interface for achievement created events
 * Represents the complete event when a new achievement is created in the system
 */
export interface IAchievementCreatedEvent extends IAchievementEventBase {
  type: AchievementEventType.ACHIEVEMENT_CREATED;
  payload: IAchievementCreatedPayload;
}

/**
 * Interface for achievement updated events
 * Represents the complete event when an achievement is updated
 */
export interface IAchievementUpdatedEvent extends IAchievementEventBase {
  type: AchievementEventType.ACHIEVEMENT_UPDATED;
  payload: IAchievementUpdatedPayload;
}

/**
 * Health journey specific achievement events
 */
export namespace HealthJourney {
  /**
   * Interface for health metric achievement events
   */
  export interface IHealthMetricAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_PROGRESS;
    payload: IHealthMetricAchievementPayload;
  }
  
  /**
   * Interface for health goal achievement events
   */
  export interface IHealthGoalAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_UNLOCKED;
    payload: IHealthGoalAchievementPayload;
  }
  
  /**
   * Interface for device connection achievement events
   */
  export interface IDeviceConnectionAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_PROGRESS;
    payload: IDeviceConnectionAchievementPayload;
  }
}

/**
 * Care journey specific achievement events
 */
export namespace CareJourney {
  /**
   * Interface for appointment booking achievement events
   */
  export interface IAppointmentBookingAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_PROGRESS;
    payload: IAppointmentBookingAchievementPayload;
  }
  
  /**
   * Interface for medication adherence achievement events
   */
  export interface IMedicationAdherenceAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_PROGRESS;
    payload: IMedicationAdherenceAchievementPayload;
  }
  
  /**
   * Interface for telemedicine session achievement events
   */
  export interface ITelemedicineSessionAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_PROGRESS;
    payload: ITelemedicineSessionAchievementPayload;
  }
}

/**
 * Plan journey specific achievement events
 */
export namespace PlanJourney {
  /**
   * Interface for claim submission achievement events
   */
  export interface IClaimSubmissionAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_PROGRESS;
    payload: IClaimSubmissionAchievementPayload;
  }
  
  /**
   * Interface for benefit utilization achievement events
   */
  export interface IBenefitUtilizationAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_PROGRESS;
    payload: IBenefitUtilizationAchievementPayload;
  }
  
  /**
   * Interface for plan selection achievement events
   */
  export interface IPlanSelectionAchievementEvent extends IAchievementEventBase {
    type: AchievementEventType.ACHIEVEMENT_PROGRESS;
    payload: IPlanSelectionAchievementPayload;
  }
}

/**
 * Type union of all achievement event types
 * Useful for discriminated unions in event handlers
 */
export type AchievementEvent =
  | IAchievementUnlockedEvent
  | IAchievementProgressEvent
  | IAchievementResetEvent
  | IAchievementCreatedEvent
  | IAchievementUpdatedEvent
  | HealthJourney.IHealthMetricAchievementEvent
  | HealthJourney.IHealthGoalAchievementEvent
  | HealthJourney.IDeviceConnectionAchievementEvent
  | CareJourney.IAppointmentBookingAchievementEvent
  | CareJourney.IMedicationAdherenceAchievementEvent
  | CareJourney.ITelemedicineSessionAchievementEvent
  | PlanJourney.IClaimSubmissionAchievementEvent
  | PlanJourney.IBenefitUtilizationAchievementEvent
  | PlanJourney.IPlanSelectionAchievementEvent;

/**
 * Utility function to validate an achievement event
 * Ensures the event has the correct structure and version
 * @param event The event to validate
 * @returns True if the event is valid, false otherwise
 */
export function isValidAchievementEvent(event: any): event is AchievementEvent {
  if (!event) return false;
  
  // Check for required properties
  if (!event.type || !event.version || !event.payload) return false;
  
  // Validate version
  const version = event.version;
  if (!version.major || !version.schemaVersion) return false;
  
  // Validate payload based on event type
  const payload = event.payload;
  if (!payload.achievementId || !payload.userId || !payload.journey || !payload.timestamp) {
    return false;
  }
  
  return true;
}

/**
 * Utility function to create a versioned achievement event
 * @param type The type of achievement event
 * @param payload The payload of the event
 * @param source The source service generating the event
 * @returns A properly versioned achievement event
 */
export function createAchievementEvent<T extends AchievementEventPayload>(
  type: AchievementEventType,
  payload: T,
  source: string = 'gamification-engine'
): AchievementEvent {
  return {
    type,
    version: ACHIEVEMENT_EVENT_VERSION,
    source,
    payload,
  } as AchievementEvent;
}

/**
 * Utility function to migrate an achievement event to the latest version
 * Handles backward compatibility for older event versions
 * @param event The event to migrate
 * @returns The migrated event with the latest schema version
 */
export function migrateAchievementEvent(event: AchievementEvent): AchievementEvent {
  // Current version is 1.0.0, so no migration needed yet
  // This function will be expanded as new versions are introduced
  return event;
}