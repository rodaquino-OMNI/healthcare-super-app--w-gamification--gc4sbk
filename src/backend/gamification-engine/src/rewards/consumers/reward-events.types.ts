/**
 * @file reward-events.types.ts
 * @description Type-safe event schema interfaces for all reward-related events processed by the gamification engine.
 * Ensures consistent event structure and versioning across all journey services.
 */

import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Import versioning interfaces from @austa/interfaces package
 */
import {
  IVersionedEvent,
  IEventVersion,
  EventSchemaVersion,
} from '@austa/interfaces/gamification/events';

/**
 * Enum defining all possible reward event types
 */
export enum RewardEventType {
  /** Event emitted when a reward is granted to a user */
  REWARD_GRANTED = 'REWARD_GRANTED',
  
  /** Event emitted when a reward is redeemed by a user */
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  
  /** Event emitted when a new reward is created in the system */
  REWARD_CREATED = 'REWARD_CREATED',
  
  /** Event emitted when an existing reward is updated */
  REWARD_UPDATED = 'REWARD_UPDATED',
  
  /** Event emitted when a reward is expired or revoked */
  REWARD_REVOKED = 'REWARD_REVOKED',
}

/**
 * Event version metadata for reward events
 * Follows semantic versioning pattern
 */
export const REWARD_EVENT_VERSION: IEventVersion = {
  major: 1,
  minor: 0,
  patch: 0,
  schemaVersion: EventSchemaVersion.V1,
};

/**
 * Base interface for all reward event payloads
 * Contains common properties shared across all reward events
 */
export interface IRewardEventBasePayload {
  /** The unique identifier of the reward */
  rewardId: string;
  
  /** The unique identifier of the user */
  userId: string;
  
  /** The journey this reward belongs to (health, care, plan, global) */
  journey: JourneyType;
  
  /** Timestamp when the event occurred */
  timestamp: string;
  
  /** Optional metadata for additional context */
  metadata?: Record<string, any>;
}

/**
 * Interface for reward granted event payloads
 * Contains data specific to when a reward is granted to a user
 */
export interface IRewardGrantedPayload extends IRewardEventBasePayload {
  /** The title of the reward */
  rewardTitle: string;
  
  /** The description of the reward */
  rewardDescription: string;
  
  /** The XP value of the reward */
  xpValue: number;
  
  /** The icon representing the reward */
  icon: string;
  
  /** The achievement or action that triggered this reward */
  triggeringAction?: {
    /** Type of action that triggered the reward */
    type: string;
    /** ID of the entity that triggered the reward (achievement, quest, etc.) */
    entityId: string;
    /** Name of the entity that triggered the reward */
    entityName?: string;
  };
}

/**
 * Interface for reward redeemed event payloads
 * Contains data about a user redeeming a reward
 */
export interface IRewardRedeemedPayload extends IRewardEventBasePayload {
  /** The title of the redeemed reward */
  rewardTitle: string;
  
  /** When the reward was originally granted */
  grantedAt: string;
  
  /** Any redemption code or identifier */
  redemptionCode?: string;
  
  /** Status of the redemption */
  redemptionStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  
  /** Any additional data related to redemption */
  redemptionData?: Record<string, any>;
}

/**
 * Interface for reward created event payloads
 * Contains data about a newly created reward in the system
 */
export interface IRewardCreatedPayload extends IRewardEventBasePayload {
  /** The title of the new reward */
  rewardTitle: string;
  
  /** The description of the new reward */
  rewardDescription: string;
  
  /** The XP value of the new reward */
  xpValue: number;
  
  /** The icon representing the new reward */
  icon: string;
  
  /** Any conditions required to earn this reward */
  conditions?: {
    /** Type of condition */
    type: string;
    /** Value or threshold for the condition */
    value: any;
    /** Description of the condition */
    description?: string;
  }[];
}

/**
 * Interface for reward updated event payloads
 * Contains data about updates to an existing reward
 */
export interface IRewardUpdatedPayload extends IRewardEventBasePayload {
  /** The updated title of the reward (if changed) */
  rewardTitle?: string;
  
  /** The updated description of the reward (if changed) */
  rewardDescription?: string;
  
  /** The updated XP value of the reward (if changed) */
  xpValue?: number;
  
  /** The updated icon representing the reward (if changed) */
  icon?: string;
  
  /** Fields that were updated */
  updatedFields: string[];
}

/**
 * Interface for reward revoked event payloads
 * Contains data about a reward being revoked from a user
 */
export interface IRewardRevokedPayload extends IRewardEventBasePayload {
  /** The title of the revoked reward */
  rewardTitle: string;
  
  /** When the reward was originally granted */
  grantedAt: string;
  
  /** Reason for revoking the reward */
  reason: string;
  
  /** Whether XP should be deducted */
  deductXp: boolean;
  
  /** Amount of XP to deduct if applicable */
  xpToDeduct?: number;
}

/**
 * Health journey specific reward event payloads
 */
export namespace HealthJourney {
  /**
   * Interface for health metric reward event payloads
   * Triggered when a health metric earns a reward
   */
  export interface IHealthMetricRewardPayload extends IRewardGrantedPayload {
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
   * Interface for health goal reward event payloads
   * Triggered when a health goal completion earns a reward
   */
  export interface IHealthGoalRewardPayload extends IRewardGrantedPayload {
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
   * Interface for device connection reward event payloads
   * Triggered when connecting a health device earns a reward
   */
  export interface IDeviceConnectionRewardPayload extends IRewardGrantedPayload {
    /** The type of device connected */
    deviceType: string;
    
    /** The ID of the connected device */
    deviceId: string;
    
    /** The number of devices connected by the user */
    totalDevicesConnected: number;
  }
}

/**
 * Care journey specific reward event payloads
 */
export namespace CareJourney {
  /**
   * Interface for appointment booking reward event payloads
   * Triggered when booking an appointment earns a reward
   */
  export interface IAppointmentBookingRewardPayload extends IRewardGrantedPayload {
    /** The type of appointment booked */
    appointmentType: string;
    
    /** The ID of the booked appointment */
    appointmentId: string;
    
    /** The total number of appointments booked by the user */
    totalAppointmentsBooked: number;
  }
  
  /**
   * Interface for medication adherence reward event payloads
   * Triggered when medication adherence earns a reward
   */
  export interface IMedicationAdherenceRewardPayload extends IRewardGrantedPayload {
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
   * Interface for telemedicine session reward event payloads
   * Triggered when completing a telemedicine session earns a reward
   */
  export interface ITelemedicineSessionRewardPayload extends IRewardGrantedPayload {
    /** The ID of the telemedicine session */
    sessionId: string;
    
    /** The duration of the session in minutes */
    sessionDuration: number;
    
    /** The total number of telemedicine sessions completed */
    totalSessionsCompleted: number;
  }
}

/**
 * Plan journey specific reward event payloads
 */
export namespace PlanJourney {
  /**
   * Interface for claim submission reward event payloads
   * Triggered when submitting an insurance claim earns a reward
   */
  export interface IClaimSubmissionRewardPayload extends IRewardGrantedPayload {
    /** The ID of the submitted claim */
    claimId: string;
    
    /** The type of claim submitted */
    claimType: string;
    
    /** The total number of claims submitted by the user */
    totalClaimsSubmitted: number;
  }
  
  /**
   * Interface for benefit utilization reward event payloads
   * Triggered when utilizing a benefit earns a reward
   */
  export interface IBenefitUtilizationRewardPayload extends IRewardGrantedPayload {
    /** The ID of the utilized benefit */
    benefitId: string;
    
    /** The type of benefit utilized */
    benefitType: string;
    
    /** The total number of benefits utilized by the user */
    totalBenefitsUtilized: number;
  }
  
  /**
   * Interface for plan selection reward event payloads
   * Triggered when selecting or comparing plans earns a reward
   */
  export interface IPlanSelectionRewardPayload extends IRewardGrantedPayload {
    /** The ID of the selected plan */
    planId: string;
    
    /** The type of plan selected */
    planType: string;
    
    /** Whether this is the first plan selection */
    isFirstSelection: boolean;
  }
}

/**
 * Type union of all reward event payload types
 * Useful for discriminated unions in event handlers
 */
export type RewardEventPayload =
  | IRewardGrantedPayload
  | IRewardRedeemedPayload
  | IRewardCreatedPayload
  | IRewardUpdatedPayload
  | IRewardRevokedPayload
  | HealthJourney.IHealthMetricRewardPayload
  | HealthJourney.IHealthGoalRewardPayload
  | HealthJourney.IDeviceConnectionRewardPayload
  | CareJourney.IAppointmentBookingRewardPayload
  | CareJourney.IMedicationAdherenceRewardPayload
  | CareJourney.ITelemedicineSessionRewardPayload
  | PlanJourney.IClaimSubmissionRewardPayload
  | PlanJourney.IBenefitUtilizationRewardPayload
  | PlanJourney.IPlanSelectionRewardPayload;

/**
 * Base interface for all reward events
 * Implements the IVersionedEvent interface for proper versioning
 */
export interface IRewardEventBase extends IVersionedEvent {
  /** The type of reward event */
  type: RewardEventType;
  
  /** The version information for this event */
  version: IEventVersion;
  
  /** The source service that generated this event */
  source: string;
  
  /** The payload of the event */
  payload: RewardEventPayload;
}

/**
 * Interface for reward granted events
 * Represents the complete event when a reward is granted to a user
 */
export interface IRewardGrantedEvent extends IRewardEventBase {
  type: RewardEventType.REWARD_GRANTED;
  payload: IRewardGrantedPayload;
}

/**
 * Interface for reward redeemed events
 * Represents the complete event when a user redeems a reward
 */
export interface IRewardRedeemedEvent extends IRewardEventBase {
  type: RewardEventType.REWARD_REDEEMED;
  payload: IRewardRedeemedPayload;
}

/**
 * Interface for reward created events
 * Represents the complete event when a new reward is created in the system
 */
export interface IRewardCreatedEvent extends IRewardEventBase {
  type: RewardEventType.REWARD_CREATED;
  payload: IRewardCreatedPayload;
}

/**
 * Interface for reward updated events
 * Represents the complete event when a reward is updated
 */
export interface IRewardUpdatedEvent extends IRewardEventBase {
  type: RewardEventType.REWARD_UPDATED;
  payload: IRewardUpdatedPayload;
}

/**
 * Interface for reward revoked events
 * Represents the complete event when a reward is revoked from a user
 */
export interface IRewardRevokedEvent extends IRewardEventBase {
  type: RewardEventType.REWARD_REVOKED;
  payload: IRewardRevokedPayload;
}

/**
 * Health journey specific reward events
 */
export namespace HealthJourney {
  /**
   * Interface for health metric reward events
   */
  export interface IHealthMetricRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: IHealthMetricRewardPayload;
  }
  
  /**
   * Interface for health goal reward events
   */
  export interface IHealthGoalRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: IHealthGoalRewardPayload;
  }
  
  /**
   * Interface for device connection reward events
   */
  export interface IDeviceConnectionRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: IDeviceConnectionRewardPayload;
  }
}

/**
 * Care journey specific reward events
 */
export namespace CareJourney {
  /**
   * Interface for appointment booking reward events
   */
  export interface IAppointmentBookingRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: IAppointmentBookingRewardPayload;
  }
  
  /**
   * Interface for medication adherence reward events
   */
  export interface IMedicationAdherenceRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: IMedicationAdherenceRewardPayload;
  }
  
  /**
   * Interface for telemedicine session reward events
   */
  export interface ITelemedicineSessionRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: ITelemedicineSessionRewardPayload;
  }
}

/**
 * Plan journey specific reward events
 */
export namespace PlanJourney {
  /**
   * Interface for claim submission reward events
   */
  export interface IClaimSubmissionRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: IClaimSubmissionRewardPayload;
  }
  
  /**
   * Interface for benefit utilization reward events
   */
  export interface IBenefitUtilizationRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: IBenefitUtilizationRewardPayload;
  }
  
  /**
   * Interface for plan selection reward events
   */
  export interface IPlanSelectionRewardEvent extends IRewardEventBase {
    type: RewardEventType.REWARD_GRANTED;
    payload: IPlanSelectionRewardPayload;
  }
}

/**
 * Type union of all reward event types
 * Useful for discriminated unions in event handlers
 */
export type RewardEvent =
  | IRewardGrantedEvent
  | IRewardRedeemedEvent
  | IRewardCreatedEvent
  | IRewardUpdatedEvent
  | IRewardRevokedEvent
  | HealthJourney.IHealthMetricRewardEvent
  | HealthJourney.IHealthGoalRewardEvent
  | HealthJourney.IDeviceConnectionRewardEvent
  | CareJourney.IAppointmentBookingRewardEvent
  | CareJourney.IMedicationAdherenceRewardEvent
  | CareJourney.ITelemedicineSessionRewardEvent
  | PlanJourney.IClaimSubmissionRewardEvent
  | PlanJourney.IBenefitUtilizationRewardEvent
  | PlanJourney.IPlanSelectionRewardEvent;

/**
 * Utility function to validate a reward event
 * Ensures the event has the correct structure and version
 * @param event The event to validate
 * @returns True if the event is valid, false otherwise
 */
export function isValidRewardEvent(event: any): event is RewardEvent {
  if (!event) return false;
  
  // Check for required properties
  if (!event.type || !event.version || !event.payload) return false;
  
  // Validate version
  const version = event.version;
  if (!version.major || !version.schemaVersion) return false;
  
  // Validate payload based on event type
  const payload = event.payload;
  if (!payload.rewardId || !payload.userId || !payload.journey || !payload.timestamp) {
    return false;
  }
  
  return true;
}

/**
 * Utility function to create a versioned reward event
 * @param type The type of reward event
 * @param payload The payload of the event
 * @param source The source service generating the event
 * @returns A properly versioned reward event
 */
export function createRewardEvent<T extends RewardEventPayload>(
  type: RewardEventType,
  payload: T,
  source: string = 'gamification-engine'
): RewardEvent {
  return {
    type,
    version: REWARD_EVENT_VERSION,
    source,
    payload,
  } as RewardEvent;
}

/**
 * Utility function to migrate a reward event to the latest version
 * Handles backward compatibility for older event versions
 * @param event The event to migrate
 * @returns The migrated event with the latest schema version
 */
export function migrateRewardEvent(event: RewardEvent): RewardEvent {
  // Current version is 1.0.0, so no migration needed yet
  // This function will be expanded as new versions are introduced
  return event;
}