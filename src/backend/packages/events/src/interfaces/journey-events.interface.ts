/**
 * @file journey-events.interface.ts
 * @description Defines type-safe interfaces for journey-specific events that flow through the system.
 * These interfaces ensure that events from different journeys maintain consistent structures
 * while accommodating journey-specific data requirements.
 */

import { IBaseEvent } from './event.interface';

// Import journey-specific interfaces
import { 
  IHealthMetric, 
  IHealthGoal, 
  IDeviceConnection, 
  MetricType 
} from '@austa/interfaces/journey/health';

import { 
  IAppointment, 
  IMedication, 
  ITelemedicineSession, 
  ITreatmentPlan,
  AppointmentStatus 
} from '@austa/interfaces/journey/care';

import { 
  IClaim, 
  IPlan, 
  IBenefit, 
  ClaimStatus 
} from '@austa/interfaces/journey/plan';

/**
 * Enum defining all possible Health journey event types
 */
export enum HealthEventType {
  // Metric events
  METRIC_RECORDED = 'health.metric.recorded',
  METRIC_UPDATED = 'health.metric.updated',
  METRIC_DELETED = 'health.metric.deleted',
  
  // Goal events
  GOAL_CREATED = 'health.goal.created',
  GOAL_UPDATED = 'health.goal.updated',
  GOAL_ACHIEVED = 'health.goal.achieved',
  GOAL_FAILED = 'health.goal.failed',
  
  // Insight events
  INSIGHT_GENERATED = 'health.insight.generated',
  INSIGHT_VIEWED = 'health.insight.viewed',
  
  // Device events
  DEVICE_CONNECTED = 'health.device.connected',
  DEVICE_DISCONNECTED = 'health.device.disconnected',
  DEVICE_SYNCED = 'health.device.synced',
  DEVICE_SYNC_FAILED = 'health.device.sync.failed'
}

/**
 * Enum defining all possible Care journey event types
 */
export enum CareEventType {
  // Appointment events
  APPOINTMENT_BOOKED = 'care.appointment.booked',
  APPOINTMENT_RESCHEDULED = 'care.appointment.rescheduled',
  APPOINTMENT_CANCELLED = 'care.appointment.cancelled',
  APPOINTMENT_COMPLETED = 'care.appointment.completed',
  APPOINTMENT_REMINDER = 'care.appointment.reminder',
  
  // Medication events
  MEDICATION_ADDED = 'care.medication.added',
  MEDICATION_UPDATED = 'care.medication.updated',
  MEDICATION_REMOVED = 'care.medication.removed',
  MEDICATION_TAKEN = 'care.medication.taken',
  MEDICATION_MISSED = 'care.medication.missed',
  MEDICATION_REMINDER = 'care.medication.reminder',
  
  // Telemedicine events
  TELEMEDICINE_SESSION_CREATED = 'care.telemedicine.session.created',
  TELEMEDICINE_SESSION_STARTED = 'care.telemedicine.session.started',
  TELEMEDICINE_SESSION_ENDED = 'care.telemedicine.session.ended',
  TELEMEDICINE_SESSION_CANCELLED = 'care.telemedicine.session.cancelled',
  
  // Treatment plan events
  TREATMENT_PLAN_CREATED = 'care.treatment.plan.created',
  TREATMENT_PLAN_UPDATED = 'care.treatment.plan.updated',
  TREATMENT_PLAN_COMPLETED = 'care.treatment.plan.completed',
  TREATMENT_PLAN_PROGRESS = 'care.treatment.plan.progress'
}

/**
 * Enum defining all possible Plan journey event types
 */
export enum PlanEventType {
  // Claim events
  CLAIM_SUBMITTED = 'plan.claim.submitted',
  CLAIM_UPDATED = 'plan.claim.updated',
  CLAIM_APPROVED = 'plan.claim.approved',
  CLAIM_REJECTED = 'plan.claim.rejected',
  CLAIM_DOCUMENT_ADDED = 'plan.claim.document.added',
  
  // Benefit events
  BENEFIT_UTILIZED = 'plan.benefit.utilized',
  BENEFIT_LIMIT_REACHED = 'plan.benefit.limit.reached',
  
  // Plan events
  PLAN_SELECTED = 'plan.selected',
  PLAN_COMPARED = 'plan.compared',
  PLAN_CHANGED = 'plan.changed',
  
  // Reward events
  REWARD_REDEEMED = 'plan.reward.redeemed',
  REWARD_EXPIRED = 'plan.reward.expired'
}

/**
 * Union type of all journey event types
 */
export type JourneyEventType = HealthEventType | CareEventType | PlanEventType;

/**
 * Base interface for all journey events
 * Extends the IBaseEvent with journey-specific context
 */
export interface IJourneyEvent extends IBaseEvent {
  /**
   * The specific journey this event belongs to
   */
  journey: 'health' | 'care' | 'plan';
  
  /**
   * The specific type of journey event
   */
  type: JourneyEventType;
  
  /**
   * Optional correlation ID for tracking related events across journeys
   */
  correlationId?: string;
  
  /**
   * Optional metadata specific to the journey context
   */
  journeyMetadata?: Record<string, any>;
}

// Health Journey Event Interfaces

/**
 * Base interface for all Health journey events
 */
export interface IHealthEvent extends IJourneyEvent {
  journey: 'health';
  type: HealthEventType;
}

/**
 * Interface for health metric recording events
 */
export interface IHealthMetricEvent extends IHealthEvent {
  type: HealthEventType.METRIC_RECORDED | HealthEventType.METRIC_UPDATED | HealthEventType.METRIC_DELETED;
  payload: {
    metric: IHealthMetric;
    userId: string;
    source?: string;
    previousValue?: number;
    metricType: MetricType;
  };
}

/**
 * Interface for health goal events
 */
export interface IHealthGoalEvent extends IHealthEvent {
  type: HealthEventType.GOAL_CREATED | HealthEventType.GOAL_UPDATED | HealthEventType.GOAL_ACHIEVED | HealthEventType.GOAL_FAILED;
  payload: {
    goal: IHealthGoal;
    userId: string;
    progress?: number;
    achievementDate?: Date;
  };
}

/**
 * Interface for health insight events
 */
export interface IHealthInsightEvent extends IHealthEvent {
  type: HealthEventType.INSIGHT_GENERATED | HealthEventType.INSIGHT_VIEWED;
  payload: {
    insightId: string;
    userId: string;
    insightType: string;
    relatedMetrics?: MetricType[];
    generatedAt?: Date;
    viewedAt?: Date;
  };
}

/**
 * Interface for device connection events
 */
export interface IDeviceEvent extends IHealthEvent {
  type: HealthEventType.DEVICE_CONNECTED | HealthEventType.DEVICE_DISCONNECTED | HealthEventType.DEVICE_SYNCED | HealthEventType.DEVICE_SYNC_FAILED;
  payload: {
    device: IDeviceConnection;
    userId: string;
    syncedAt?: Date;
    syncedMetrics?: MetricType[];
    errorDetails?: string;
  };
}

// Care Journey Event Interfaces

/**
 * Base interface for all Care journey events
 */
export interface ICareEvent extends IJourneyEvent {
  journey: 'care';
  type: CareEventType;
}

/**
 * Interface for appointment events
 */
export interface IAppointmentEvent extends ICareEvent {
  type: CareEventType.APPOINTMENT_BOOKED | CareEventType.APPOINTMENT_RESCHEDULED | 
        CareEventType.APPOINTMENT_CANCELLED | CareEventType.APPOINTMENT_COMPLETED | 
        CareEventType.APPOINTMENT_REMINDER;
  payload: {
    appointment: IAppointment;
    userId: string;
    previousStatus?: AppointmentStatus;
    previousDate?: Date;
    reminderType?: 'upcoming' | 'checkin';
  };
}

/**
 * Interface for medication events
 */
export interface IMedicationEvent extends ICareEvent {
  type: CareEventType.MEDICATION_ADDED | CareEventType.MEDICATION_UPDATED | 
        CareEventType.MEDICATION_REMOVED | CareEventType.MEDICATION_TAKEN | 
        CareEventType.MEDICATION_MISSED | CareEventType.MEDICATION_REMINDER;
  payload: {
    medication: IMedication;
    userId: string;
    takenAt?: Date;
    dosage?: string;
    adherenceStreak?: number;
    reminderTime?: Date;
  };
}

/**
 * Interface for telemedicine events
 */
export interface ITelemedicineEvent extends ICareEvent {
  type: CareEventType.TELEMEDICINE_SESSION_CREATED | CareEventType.TELEMEDICINE_SESSION_STARTED | 
        CareEventType.TELEMEDICINE_SESSION_ENDED | CareEventType.TELEMEDICINE_SESSION_CANCELLED;
  payload: {
    session: ITelemedicineSession;
    userId: string;
    providerId: string;
    duration?: number;
    connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
    notes?: string;
  };
}

/**
 * Interface for treatment plan events
 */
export interface ITreatmentPlanEvent extends ICareEvent {
  type: CareEventType.TREATMENT_PLAN_CREATED | CareEventType.TREATMENT_PLAN_UPDATED | 
        CareEventType.TREATMENT_PLAN_COMPLETED | CareEventType.TREATMENT_PLAN_PROGRESS;
  payload: {
    treatmentPlan: ITreatmentPlan;
    userId: string;
    progress?: number;
    completedSteps?: number;
    totalSteps?: number;
    updatedBy?: string;
  };
}

// Plan Journey Event Interfaces

/**
 * Base interface for all Plan journey events
 */
export interface IPlanEvent extends IJourneyEvent {
  journey: 'plan';
  type: PlanEventType;
}

/**
 * Interface for claim events
 */
export interface IClaimEvent extends IPlanEvent {
  type: PlanEventType.CLAIM_SUBMITTED | PlanEventType.CLAIM_UPDATED | 
        PlanEventType.CLAIM_APPROVED | PlanEventType.CLAIM_REJECTED | 
        PlanEventType.CLAIM_DOCUMENT_ADDED;
  payload: {
    claim: IClaim;
    userId: string;
    previousStatus?: ClaimStatus;
    documentId?: string;
    reviewedBy?: string;
    approvalDetails?: Record<string, any>;
    rejectionReason?: string;
  };
}

/**
 * Interface for benefit utilization events
 */
export interface IBenefitEvent extends IPlanEvent {
  type: PlanEventType.BENEFIT_UTILIZED | PlanEventType.BENEFIT_LIMIT_REACHED;
  payload: {
    benefit: IBenefit;
    userId: string;
    planId: string;
    utilizationAmount?: number;
    remainingBalance?: number;
    utilizationDate: Date;
    relatedClaimId?: string;
  };
}

/**
 * Interface for plan selection and comparison events
 */
export interface IPlanSelectionEvent extends IPlanEvent {
  type: PlanEventType.PLAN_SELECTED | PlanEventType.PLAN_COMPARED | PlanEventType.PLAN_CHANGED;
  payload: {
    plan: IPlan;
    userId: string;
    previousPlanId?: string;
    comparedPlanIds?: string[];
    selectionDate?: Date;
    effectiveDate?: Date;
  };
}

/**
 * Interface for reward redemption events
 */
export interface IRewardEvent extends IPlanEvent {
  type: PlanEventType.REWARD_REDEEMED | PlanEventType.REWARD_EXPIRED;
  payload: {
    rewardId: string;
    userId: string;
    rewardType: string;
    rewardValue: number;
    redemptionDate?: Date;
    expirationDate?: Date;
    benefitId?: string;
  };
}

// Utility types for working with journey events

/**
 * Union type of all Health journey events
 */
export type HealthEvent = IHealthMetricEvent | IHealthGoalEvent | IHealthInsightEvent | IDeviceEvent;

/**
 * Union type of all Care journey events
 */
export type CareEvent = IAppointmentEvent | IMedicationEvent | ITelemedicineEvent | ITreatmentPlanEvent;

/**
 * Union type of all Plan journey events
 */
export type PlanEvent = IClaimEvent | IBenefitEvent | IPlanSelectionEvent | IRewardEvent;

/**
 * Union type of all journey events
 */
export type JourneyEvent = HealthEvent | CareEvent | PlanEvent;

/**
 * Type guard to check if an event is a Health journey event
 */
export function isHealthEvent(event: JourneyEvent): event is HealthEvent {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is a Care journey event
 */
export function isCareEvent(event: JourneyEvent): event is CareEvent {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is a Plan journey event
 */
export function isPlanEvent(event: JourneyEvent): event is PlanEvent {
  return event.journey === 'plan';
}

/**
 * Interface for cross-journey event correlation
 * Used to track related events across different journeys
 */
export interface ICrossJourneyCorrelation {
  /**
   * Unique correlation ID shared by related events
   */
  correlationId: string;
  
  /**
   * List of event IDs that are part of this correlation
   */
  eventIds: string[];
  
  /**
   * Map of journeys to their respective events in this correlation
   */
  journeyEvents: {
    health?: string[];
    care?: string[];
    plan?: string[];
  };
  
  /**
   * Timestamp when the correlation was created
   */
  createdAt: Date;
  
  /**
   * Optional metadata for the correlation
   */
  metadata?: Record<string, any>;
}