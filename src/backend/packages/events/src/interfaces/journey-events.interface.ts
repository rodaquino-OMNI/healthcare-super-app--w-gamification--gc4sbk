/**
 * @file journey-events.interface.ts
 * @description Defines type-safe interfaces for journey-specific events that flow through the system.
 * These interfaces ensure that events from different journeys maintain consistent structures
 * while accommodating journey-specific data requirements.
 */

import { IBaseEvent } from './base-event.interface';
import { IVersionedEvent } from './event-versioning.interface';

// Import journey-specific interfaces
import {
  IHealthMetric,
  IHealthGoal,
  IDeviceConnection,
  IMedicalEvent,
  MetricType,
  GoalType,
  DeviceType,
} from '@austa/interfaces/journey/health';

import {
  IAppointment,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan,
  AppointmentStatus,
} from '@austa/interfaces/journey/care';

import {
  IPlan,
  IClaim,
  IBenefit,
  ClaimStatus,
} from '@austa/interfaces/journey/plan';

/**
 * Enum defining all possible journey types in the system
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Base interface for all journey events
 */
export interface IJourneyEvent extends IBaseEvent, IVersionedEvent {
  /**
   * The specific journey this event belongs to
   */
  journeyType: JourneyType;
  
  /**
   * User ID associated with this event
   */
  userId: string;
  
  /**
   * Optional correlation ID for tracking related events across journeys
   */
  correlationId?: string;
  
  /**
   * Optional session ID for grouping events from the same user session
   */
  sessionId?: string;
  
  /**
   * Optional device information for tracking event source
   */
  deviceInfo?: {
    type: 'mobile' | 'web' | 'wearable';
    id?: string;
    model?: string;
    os?: string;
    appVersion?: string;
  };
}

// ===== HEALTH JOURNEY EVENTS =====

/**
 * Enum defining all possible health journey event types
 */
export enum HealthEventType {
  METRIC_RECORDED = 'health.metric.recorded',
  GOAL_CREATED = 'health.goal.created',
  GOAL_UPDATED = 'health.goal.updated',
  GOAL_ACHIEVED = 'health.goal.achieved',
  INSIGHT_GENERATED = 'health.insight.generated',
  DEVICE_CONNECTED = 'health.device.connected',
  DEVICE_SYNCED = 'health.device.synced',
  DEVICE_DISCONNECTED = 'health.device.disconnected',
  MEDICAL_EVENT_ADDED = 'health.medical.added',
}

/**
 * Interface for health metric recording events
 */
export interface IHealthMetricRecordedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.METRIC_RECORDED;
  payload: {
    metric: IHealthMetric;
    metricType: MetricType;
    value: number;
    unit: string;
    timestamp: string;
    source: 'manual' | 'device' | 'integration';
    deviceId?: string;
    previousValue?: number;
    changePercentage?: number;
  };
}

/**
 * Interface for health goal creation events
 */
export interface IHealthGoalCreatedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.GOAL_CREATED;
  payload: {
    goal: IHealthGoal;
    goalType: GoalType;
    targetValue: number;
    unit: string;
    startDate: string;
    endDate?: string;
    recurrence?: 'daily' | 'weekly' | 'monthly';
  };
}

/**
 * Interface for health goal update events
 */
export interface IHealthGoalUpdatedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.GOAL_UPDATED;
  payload: {
    goal: IHealthGoal;
    previousTargetValue?: number;
    newTargetValue: number;
    progressPercentage: number;
    isOnTrack: boolean;
  };
}

/**
 * Interface for health goal achievement events
 */
export interface IHealthGoalAchievedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.GOAL_ACHIEVED;
  payload: {
    goal: IHealthGoal;
    achievedValue: number;
    targetValue: number;
    achievedDate: string;
    daysToAchieve: number;
    streakCount?: number;
  };
}

/**
 * Interface for health insight generation events
 */
export interface IHealthInsightGeneratedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.INSIGHT_GENERATED;
  payload: {
    insightId: string;
    insightType: 'trend' | 'anomaly' | 'recommendation' | 'milestone';
    metricType?: MetricType;
    description: string;
    severity?: 'info' | 'warning' | 'critical';
    relatedMetrics?: IHealthMetric[];
    generatedDate: string;
  };
}

/**
 * Interface for device connection events
 */
export interface IDeviceConnectedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.DEVICE_CONNECTED;
  payload: {
    device: IDeviceConnection;
    deviceType: DeviceType;
    connectionDate: string;
    isFirstConnection: boolean;
    permissions: string[];
  };
}

/**
 * Interface for device synchronization events
 */
export interface IDeviceSyncedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.DEVICE_SYNCED;
  payload: {
    device: IDeviceConnection;
    deviceType: DeviceType;
    syncDate: string;
    metricsCount: number;
    syncDuration: number; // in milliseconds
    lastSyncDate?: string;
    newMetricTypes: MetricType[];
  };
}

/**
 * Interface for device disconnection events
 */
export interface IDeviceDisconnectedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.DEVICE_DISCONNECTED;
  payload: {
    device: IDeviceConnection;
    deviceType: DeviceType;
    disconnectionDate: string;
    disconnectionReason?: 'user_initiated' | 'token_expired' | 'error' | 'permission_revoked';
    totalDaysConnected: number;
  };
}

/**
 * Interface for medical event addition events
 */
export interface IMedicalEventAddedEvent extends IJourneyEvent {
  journeyType: JourneyType.HEALTH;
  type: HealthEventType.MEDICAL_EVENT_ADDED;
  payload: {
    medicalEvent: IMedicalEvent;
    eventDate: string;
    provider?: string;
    hasDocuments: boolean;
    isImported: boolean;
  };
}

/**
 * Union type of all health journey events
 */
export type HealthJourneyEvent =
  | IHealthMetricRecordedEvent
  | IHealthGoalCreatedEvent
  | IHealthGoalUpdatedEvent
  | IHealthGoalAchievedEvent
  | IHealthInsightGeneratedEvent
  | IDeviceConnectedEvent
  | IDeviceSyncedEvent
  | IDeviceDisconnectedEvent
  | IMedicalEventAddedEvent;

// ===== CARE JOURNEY EVENTS =====

/**
 * Enum defining all possible care journey event types
 */
export enum CareEventType {
  APPOINTMENT_BOOKED = 'care.appointment.booked',
  APPOINTMENT_COMPLETED = 'care.appointment.completed',
  APPOINTMENT_CANCELLED = 'care.appointment.cancelled',
  APPOINTMENT_RESCHEDULED = 'care.appointment.rescheduled',
  MEDICATION_ADDED = 'care.medication.added',
  MEDICATION_TAKEN = 'care.medication.taken',
  MEDICATION_MISSED = 'care.medication.missed',
  MEDICATION_REFILLED = 'care.medication.refilled',
  TELEMEDICINE_STARTED = 'care.telemedicine.started',
  TELEMEDICINE_COMPLETED = 'care.telemedicine.completed',
  TREATMENT_PLAN_CREATED = 'care.treatment.created',
  TREATMENT_PLAN_UPDATED = 'care.treatment.updated',
  TREATMENT_PLAN_COMPLETED = 'care.treatment.completed',
}

/**
 * Interface for appointment booking events
 */
export interface IAppointmentBookedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.APPOINTMENT_BOOKED;
  payload: {
    appointment: IAppointment;
    provider: string;
    appointmentDate: string;
    appointmentType: string;
    isFirstAppointment: boolean;
    isUrgent: boolean;
  };
}

/**
 * Interface for appointment completion events
 */
export interface IAppointmentCompletedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.APPOINTMENT_COMPLETED;
  payload: {
    appointment: IAppointment;
    provider: string;
    completionDate: string;
    duration: number; // in minutes
    followUpRequired: boolean;
    followUpDate?: string;
    hasTreatmentPlan: boolean;
  };
}

/**
 * Interface for appointment cancellation events
 */
export interface IAppointmentCancelledEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.APPOINTMENT_CANCELLED;
  payload: {
    appointment: IAppointment;
    provider: string;
    cancellationDate: string;
    cancellationReason?: string;
    rescheduled: boolean;
    newAppointmentId?: string;
  };
}

/**
 * Interface for appointment rescheduling events
 */
export interface IAppointmentRescheduledEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.APPOINTMENT_RESCHEDULED;
  payload: {
    appointment: IAppointment;
    provider: string;
    originalDate: string;
    newDate: string;
    rescheduledBy: 'patient' | 'provider' | 'system';
    reschedulingReason?: string;
  };
}

/**
 * Interface for medication addition events
 */
export interface IMedicationAddedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.MEDICATION_ADDED;
  payload: {
    medication: IMedication;
    prescriptionDate: string;
    dosage: string;
    frequency: string;
    duration: number; // in days
    startDate: string;
    endDate?: string;
    remindersEnabled: boolean;
  };
}

/**
 * Interface for medication taken events
 */
export interface IMedicationTakenEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.MEDICATION_TAKEN;
  payload: {
    medication: IMedication;
    takenDate: string;
    scheduledTime: string;
    takenOnTime: boolean;
    delayMinutes?: number;
    dosageTaken: string;
    notes?: string;
  };
}

/**
 * Interface for medication missed events
 */
export interface IMedicationMissedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.MEDICATION_MISSED;
  payload: {
    medication: IMedication;
    missedDate: string;
    scheduledTime: string;
    reason?: string;
    remindersSent: number;
    isCritical: boolean;
  };
}

/**
 * Interface for medication refill events
 */
export interface IMedicationRefilledEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.MEDICATION_REFILLED;
  payload: {
    medication: IMedication;
    refillDate: string;
    quantity: number;
    daysSupply: number;
    pharmacy?: string;
    isAutoRefill: boolean;
    remainingRefills: number;
  };
}

/**
 * Interface for telemedicine session start events
 */
export interface ITelemedicineStartedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.TELEMEDICINE_STARTED;
  payload: {
    session: ITelemedicineSession;
    provider: string;
    startDate: string;
    appointmentId?: string;
    isScheduled: boolean;
    connectionQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  };
}

/**
 * Interface for telemedicine session completion events
 */
export interface ITelemedicineCompletedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.TELEMEDICINE_COMPLETED;
  payload: {
    session: ITelemedicineSession;
    provider: string;
    endDate: string;
    duration: number; // in minutes
    connectionIssues: boolean;
    followUpRequired: boolean;
    prescriptionIssued: boolean;
    patientRating?: number; // 1-5 scale
  };
}

/**
 * Interface for treatment plan creation events
 */
export interface ITreatmentPlanCreatedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.TREATMENT_PLAN_CREATED;
  payload: {
    treatmentPlan: ITreatmentPlan;
    provider: string;
    creationDate: string;
    condition: string;
    expectedDuration: number; // in days
    activityCount: number;
    hasMedications: boolean;
    hasAppointments: boolean;
  };
}

/**
 * Interface for treatment plan update events
 */
export interface ITreatmentPlanUpdatedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.TREATMENT_PLAN_UPDATED;
  payload: {
    treatmentPlan: ITreatmentPlan;
    provider: string;
    updateDate: string;
    progressPercentage: number;
    activitiesCompleted: number;
    activitiesRemaining: number;
    nextActivityDate?: string;
    isOnTrack: boolean;
  };
}

/**
 * Interface for treatment plan completion events
 */
export interface ITreatmentPlanCompletedEvent extends IJourneyEvent {
  journeyType: JourneyType.CARE;
  type: CareEventType.TREATMENT_PLAN_COMPLETED;
  payload: {
    treatmentPlan: ITreatmentPlan;
    provider: string;
    completionDate: string;
    actualDuration: number; // in days
    expectedDuration: number; // in days
    outcomeNotes?: string;
    followUpRequired: boolean;
    patientFeedback?: string;
  };
}

/**
 * Union type of all care journey events
 */
export type CareJourneyEvent =
  | IAppointmentBookedEvent
  | IAppointmentCompletedEvent
  | IAppointmentCancelledEvent
  | IAppointmentRescheduledEvent
  | IMedicationAddedEvent
  | IMedicationTakenEvent
  | IMedicationMissedEvent
  | IMedicationRefilledEvent
  | ITelemedicineStartedEvent
  | ITelemedicineCompletedEvent
  | ITreatmentPlanCreatedEvent
  | ITreatmentPlanUpdatedEvent
  | ITreatmentPlanCompletedEvent;

// ===== PLAN JOURNEY EVENTS =====

/**
 * Enum defining all possible plan journey event types
 */
export enum PlanEventType {
  CLAIM_SUBMITTED = 'plan.claim.submitted',
  CLAIM_UPDATED = 'plan.claim.updated',
  CLAIM_APPROVED = 'plan.claim.approved',
  CLAIM_DENIED = 'plan.claim.denied',
  BENEFIT_USED = 'plan.benefit.used',
  BENEFIT_LIMIT_REACHED = 'plan.benefit.limit_reached',
  PLAN_SELECTED = 'plan.plan.selected',
  PLAN_CHANGED = 'plan.plan.changed',
  PLAN_RENEWED = 'plan.plan.renewed',
  PLAN_COMPARED = 'plan.plan.compared',
  REWARD_REDEEMED = 'plan.reward.redeemed',
}

/**
 * Interface for claim submission events
 */
export interface IClaimSubmittedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.CLAIM_SUBMITTED;
  payload: {
    claim: IClaim;
    submissionDate: string;
    amount: number;
    serviceDate: string;
    provider: string;
    hasDocuments: boolean;
    documentCount: number;
    isFirstClaim: boolean;
  };
}

/**
 * Interface for claim update events
 */
export interface IClaimUpdatedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.CLAIM_UPDATED;
  payload: {
    claim: IClaim;
    updateDate: string;
    previousStatus: ClaimStatus;
    newStatus: ClaimStatus;
    updatedFields: string[];
    documentsAdded: boolean;
    documentCount: number;
  };
}

/**
 * Interface for claim approval events
 */
export interface IClaimApprovedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.CLAIM_APPROVED;
  payload: {
    claim: IClaim;
    approvalDate: string;
    submittedAmount: number;
    approvedAmount: number;
    coveragePercentage: number;
    processingDays: number;
    paymentDate?: string;
    paymentMethod?: string;
  };
}

/**
 * Interface for claim denial events
 */
export interface IClaimDeniedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.CLAIM_DENIED;
  payload: {
    claim: IClaim;
    denialDate: string;
    denialReason: string;
    submittedAmount: number;
    processingDays: number;
    appealEligible: boolean;
    appealDeadline?: string;
    additionalInfoRequired?: string[];
  };
}

/**
 * Interface for benefit usage events
 */
export interface IBenefitUsedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.BENEFIT_USED;
  payload: {
    benefit: IBenefit;
    usageDate: string;
    provider?: string;
    serviceDescription: string;
    amountUsed: number;
    remainingAmount: number;
    remainingPercentage: number;
    isFirstUse: boolean;
  };
}

/**
 * Interface for benefit limit reached events
 */
export interface IBenefitLimitReachedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.BENEFIT_LIMIT_REACHED;
  payload: {
    benefit: IBenefit;
    reachedDate: string;
    limitType: 'amount' | 'visits' | 'days' | 'items';
    limitValue: number;
    renewalDate?: string;
    alternativeBenefits?: IBenefit[];
  };
}

/**
 * Interface for plan selection events
 */
export interface IPlanSelectedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.PLAN_SELECTED;
  payload: {
    plan: IPlan;
    selectionDate: string;
    effectiveDate: string;
    premium: number;
    paymentFrequency: 'monthly' | 'quarterly' | 'annually';
    isFirstPlan: boolean;
    comparedPlansCount?: number;
  };
}

/**
 * Interface for plan change events
 */
export interface IPlanChangedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.PLAN_CHANGED;
  payload: {
    oldPlan: IPlan;
    newPlan: IPlan;
    changeDate: string;
    effectiveDate: string;
    premiumDifference: number;
    changeReason?: string;
    benefitChanges: {
      added: string[];
      removed: string[];
      improved: string[];
      reduced: string[];
    };
  };
}

/**
 * Interface for plan renewal events
 */
export interface IPlanRenewedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.PLAN_RENEWED;
  payload: {
    plan: IPlan;
    renewalDate: string;
    previousEndDate: string;
    newEndDate: string;
    premiumChange: number;
    premiumChangePercentage: number;
    benefitChanges: boolean;
    yearsWithPlan: number;
  };
}

/**
 * Interface for plan comparison events
 */
export interface IPlanComparedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.PLAN_COMPARED;
  payload: {
    plansCompared: IPlan[];
    comparisonDate: string;
    comparisonCriteria: string[];
    selectedPlanId?: string;
    comparisonDuration: number; // in seconds
    userPreferences?: Record<string, any>;
  };
}

/**
 * Interface for reward redemption events
 */
export interface IRewardRedeemedEvent extends IJourneyEvent {
  journeyType: JourneyType.PLAN;
  type: PlanEventType.REWARD_REDEEMED;
  payload: {
    rewardId: string;
    rewardName: string;
    rewardType: 'discount' | 'cashback' | 'gift' | 'service';
    redemptionDate: string;
    pointsUsed: number;
    monetaryValue: number;
    expirationDate?: string;
    isFirstRedemption: boolean;
  };
}

/**
 * Union type of all plan journey events
 */
export type PlanJourneyEvent =
  | IClaimSubmittedEvent
  | IClaimUpdatedEvent
  | IClaimApprovedEvent
  | IClaimDeniedEvent
  | IBenefitUsedEvent
  | IBenefitLimitReachedEvent
  | IPlanSelectedEvent
  | IPlanChangedEvent
  | IPlanRenewedEvent
  | IPlanComparedEvent
  | IRewardRedeemedEvent;

/**
 * Union type of all journey events
 */
export type JourneyEvent = HealthJourneyEvent | CareJourneyEvent | PlanJourneyEvent;

/**
 * Type guard to check if an event is a Health Journey event
 * @param event The event to check
 * @returns True if the event is a Health Journey event
 */
export function isHealthJourneyEvent(event: JourneyEvent): event is HealthJourneyEvent {
  return event.journeyType === JourneyType.HEALTH;
}

/**
 * Type guard to check if an event is a Care Journey event
 * @param event The event to check
 * @returns True if the event is a Care Journey event
 */
export function isCareJourneyEvent(event: JourneyEvent): event is CareJourneyEvent {
  return event.journeyType === JourneyType.CARE;
}

/**
 * Type guard to check if an event is a Plan Journey event
 * @param event The event to check
 * @returns True if the event is a Plan Journey event
 */
export function isPlanJourneyEvent(event: JourneyEvent): event is PlanJourneyEvent {
  return event.journeyType === JourneyType.PLAN;
}

// ===== CROSS-JOURNEY EVENT UTILITIES =====

/**
 * Interface for cross-journey event correlation
 * Used to track related events across different journeys
 */
export interface ICrossJourneyCorrelation {
  /**
   * Primary correlation ID linking related events
   */
  correlationId: string;
  
  /**
   * User ID associated with the correlated events
   */
  userId: string;
  
  /**
   * Map of journey types to event IDs
   */
  journeyEvents: {
    [JourneyType.HEALTH]?: string[];
    [JourneyType.CARE]?: string[];
    [JourneyType.PLAN]?: string[];
  };
  
  /**
   * Timestamp when the correlation was created
   */
  createdAt: string;
  
  /**
   * Timestamp when the correlation was last updated
   */
  updatedAt: string;
  
  /**
   * Optional metadata for the correlation
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for cross-journey achievement tracking
 * Used to track achievements that span multiple journeys
 */
export interface ICrossJourneyAchievementContext {
  /**
   * Achievement ID
   */
  achievementId: string;
  
  /**
   * User ID associated with the achievement
   */
  userId: string;
  
  /**
   * Required events from each journey to unlock the achievement
   */
  requiredEvents: {
    [JourneyType.HEALTH]?: HealthEventType[];
    [JourneyType.CARE]?: CareEventType[];
    [JourneyType.PLAN]?: PlanEventType[];
  };
  
  /**
   * Completed events from each journey
   */
  completedEvents: {
    [JourneyType.HEALTH]?: {
      eventType: HealthEventType;
      eventId: string;
      timestamp: string;
    }[];
    [JourneyType.CARE]?: {
      eventType: CareEventType;
      eventId: string;
      timestamp: string;
    }[];
    [JourneyType.PLAN]?: {
      eventType: PlanEventType;
      eventId: string;
      timestamp: string;
    }[];
  };
  
  /**
   * Progress percentage towards achievement completion
   */
  progressPercentage: number;
  
  /**
   * Whether the achievement has been unlocked
   */
  isUnlocked: boolean;
  
  /**
   * Timestamp when the achievement was unlocked
   */
  unlockedAt?: string;
}

/**
 * Utility function to create a cross-journey correlation
 * @param userId User ID associated with the correlation
 * @param initialEvent Initial event to include in the correlation
 * @param metadata Optional metadata for the correlation
 * @returns A new cross-journey correlation object
 */
export function createCrossJourneyCorrelation(
  userId: string,
  initialEvent: JourneyEvent,
  metadata?: Record<string, any>
): ICrossJourneyCorrelation {
  const now = new Date().toISOString();
  const journeyEvents: ICrossJourneyCorrelation['journeyEvents'] = {};
  
  // Add the initial event to the appropriate journey
  journeyEvents[initialEvent.journeyType] = [initialEvent.eventId];
  
  return {
    correlationId: initialEvent.correlationId || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    journeyEvents,
    createdAt: now,
    updatedAt: now,
    metadata
  };
}

/**
 * Utility function to add an event to an existing cross-journey correlation
 * @param correlation Existing correlation object
 * @param event Event to add to the correlation
 * @returns Updated correlation object
 */
export function addEventToCorrelation(
  correlation: ICrossJourneyCorrelation,
  event: JourneyEvent
): ICrossJourneyCorrelation {
  // Create a deep copy of the correlation to avoid mutations
  const updatedCorrelation = JSON.parse(JSON.stringify(correlation)) as ICrossJourneyCorrelation;
  
  // Initialize the journey events array if it doesn't exist
  if (!updatedCorrelation.journeyEvents[event.journeyType]) {
    updatedCorrelation.journeyEvents[event.journeyType] = [];
  }
  
  // Add the event ID to the appropriate journey if it's not already there
  if (!updatedCorrelation.journeyEvents[event.journeyType]?.includes(event.eventId)) {
    updatedCorrelation.journeyEvents[event.journeyType]?.push(event.eventId);
  }
  
  // Update the correlation timestamp
  updatedCorrelation.updatedAt = new Date().toISOString();
  
  return updatedCorrelation;
}

/**
 * Utility function to check if a cross-journey achievement is complete
 * @param context Achievement context to check
 * @returns True if the achievement is complete
 */
export function isCrossJourneyAchievementComplete(context: ICrossJourneyAchievementContext): boolean {
  // If already unlocked, return true
  if (context.isUnlocked) {
    return true;
  }
  
  // Check if all required events from each journey have been completed
  const journeyTypes = Object.keys(context.requiredEvents) as JourneyType[];
  
  for (const journeyType of journeyTypes) {
    const requiredEvents = context.requiredEvents[journeyType] || [];
    const completedEventTypes = (context.completedEvents[journeyType] || []).map(e => e.eventType);
    
    // Check if all required events for this journey have been completed
    const allCompleted = requiredEvents.every(eventType => 
      completedEventTypes.includes(eventType)
    );
    
    // If any journey's requirements are not met, the achievement is not complete
    if (!allCompleted) {
      return false;
    }
  }
  
  // All required events from all journeys have been completed
  return true;
}