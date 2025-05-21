/**
 * Journey-specific event interfaces for the gamification engine.
 * 
 * This file defines specialized interfaces for journey-specific events
 * (Health, Care, Plan) processed by the gamification engine. It provides
 * type definitions for journey-specific event payloads, ensuring proper
 * data validation and processing based on the event's journey context.
 */

// Import shared journey interfaces from @austa/interfaces
import { 
  IHealthMetric, 
  IHealthGoal, 
  MetricType, 
  GoalType,
  GoalStatus 
} from '@austa/interfaces/journey/health';

import {
  IAppointment,
  IMedication,
  AppointmentStatus,
  AppointmentType
} from '@austa/interfaces/journey/care';

import {
  IClaim,
  IBenefit,
  ClaimStatus
} from '@austa/interfaces/journey/plan';

/**
 * Base interface for all journey events
 */
export interface IJourneyEvent {
  type: string;
  userId: string;
  timestamp?: Date;
  journey: 'health' | 'care' | 'plan';
  data: Record<string, any>;
}

// ===== HEALTH JOURNEY EVENTS =====

/**
 * Health journey event interface
 */
export interface IHealthEvent extends IJourneyEvent {
  journey: 'health';
  type: HealthEventType;
  data: IHealthEventPayload;
}

/**
 * Enum of all health journey event types
 */
export enum HealthEventType {
  METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  GOAL_UPDATED = 'HEALTH_GOAL_UPDATED',
  GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  DEVICE_CONNECTED = 'HEALTH_DEVICE_CONNECTED',
  MEDICAL_RECORD_ADDED = 'HEALTH_MEDICAL_RECORD_ADDED',
  HEALTH_CHECK_COMPLETED = 'HEALTH_CHECK_COMPLETED'
}

/**
 * Union type for all health event payloads
 */
export type IHealthEventPayload = 
  | IHealthMetricRecordedPayload
  | IHealthGoalCreatedPayload
  | IHealthGoalUpdatedPayload
  | IHealthGoalAchievedPayload
  | IHealthDeviceConnectedPayload
  | IHealthMedicalRecordAddedPayload
  | IHealthCheckCompletedPayload;

/**
 * Payload for HEALTH_METRIC_RECORDED event
 */
export interface IHealthMetricRecordedPayload {
  metric: IHealthMetric;
  metricType: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  source?: string;
  previousValue?: number;
  change?: number;
  isImprovement?: boolean;
}

/**
 * Payload for HEALTH_GOAL_CREATED event
 */
export interface IHealthGoalCreatedPayload {
  goal: IHealthGoal;
  goalType: GoalType;
  targetValue: number;
  unit: string;
  startDate: Date;
  endDate?: Date;
}

/**
 * Payload for HEALTH_GOAL_UPDATED event
 */
export interface IHealthGoalUpdatedPayload {
  goal: IHealthGoal;
  previousStatus?: GoalStatus;
  newStatus: GoalStatus;
  progress: number; // 0-100 percentage
  currentValue: number;
  targetValue: number;
}

/**
 * Payload for HEALTH_GOAL_ACHIEVED event
 */
export interface IHealthGoalAchievedPayload {
  goal: IHealthGoal;
  goalType: GoalType;
  achievedValue: number;
  targetValue: number;
  daysToAchieve: number;
  isEarlyCompletion?: boolean;
}

/**
 * Payload for HEALTH_DEVICE_CONNECTED event
 */
export interface IHealthDeviceConnectedPayload {
  deviceId: string;
  deviceType: string;
  connectionDate: Date;
  isFirstConnection: boolean;
}

/**
 * Payload for HEALTH_MEDICAL_RECORD_ADDED event
 */
export interface IHealthMedicalRecordAddedPayload {
  recordId: string;
  recordType: string;
  recordDate: Date;
  provider?: string;
}

/**
 * Payload for HEALTH_CHECK_COMPLETED event
 */
export interface IHealthCheckCompletedPayload {
  checkId: string;
  completionDate: Date;
  score?: number;
  recommendations?: string[];
}

// ===== CARE JOURNEY EVENTS =====

/**
 * Care journey event interface
 */
export interface ICareEvent extends IJourneyEvent {
  journey: 'care';
  type: CareEventType;
  data: ICareEventPayload;
}

/**
 * Enum of all care journey event types
 */
export enum CareEventType {
  APPOINTMENT_BOOKED = 'CARE_APPOINTMENT_BOOKED',
  APPOINTMENT_COMPLETED = 'CARE_APPOINTMENT_COMPLETED',
  APPOINTMENT_CANCELED = 'CARE_APPOINTMENT_CANCELED',
  MEDICATION_ADDED = 'CARE_MEDICATION_ADDED',
  MEDICATION_TAKEN = 'CARE_MEDICATION_TAKEN',
  MEDICATION_ADHERENCE_STREAK = 'CARE_MEDICATION_ADHERENCE_STREAK',
  TELEMEDICINE_SESSION_COMPLETED = 'CARE_TELEMEDICINE_SESSION_COMPLETED',
  PROVIDER_RATED = 'CARE_PROVIDER_RATED',
  SYMPTOM_CHECK_COMPLETED = 'CARE_SYMPTOM_CHECK_COMPLETED'
}

/**
 * Union type for all care event payloads
 */
export type ICareEventPayload =
  | ICareAppointmentBookedPayload
  | ICareAppointmentCompletedPayload
  | ICareAppointmentCanceledPayload
  | ICareMedicationAddedPayload
  | ICareMedicationTakenPayload
  | ICareMedicationAdherenceStreakPayload
  | ICareTelemedicineSessionCompletedPayload
  | ICareProviderRatedPayload
  | ICareSymptomCheckCompletedPayload;

/**
 * Payload for CARE_APPOINTMENT_BOOKED event
 */
export interface ICareAppointmentBookedPayload {
  appointment: IAppointment;
  appointmentType: AppointmentType;
  providerId: string;
  scheduledDate: Date;
  isFirstAppointment?: boolean;
  isUrgent?: boolean;
}

/**
 * Payload for CARE_APPOINTMENT_COMPLETED event
 */
export interface ICareAppointmentCompletedPayload {
  appointment: IAppointment;
  appointmentType: AppointmentType;
  providerId: string;
  completionDate: Date;
  duration: number; // in minutes
  followUpScheduled?: boolean;
}

/**
 * Payload for CARE_APPOINTMENT_CANCELED event
 */
export interface ICareAppointmentCanceledPayload {
  appointmentId: string;
  appointmentType: AppointmentType;
  providerId: string;
  cancellationDate: Date;
  rescheduled: boolean;
  reason?: string;
}

/**
 * Payload for CARE_MEDICATION_ADDED event
 */
export interface ICareMedicationAddedPayload {
  medication: IMedication;
  startDate: Date;
  endDate?: Date;
  dosage: string;
  frequency: string;
  isChronicMedication?: boolean;
}

/**
 * Payload for CARE_MEDICATION_TAKEN event
 */
export interface ICareMedicationTakenPayload {
  medicationId: string;
  medicationName: string;
  takenDate: Date;
  takenOnTime: boolean;
  dosage: string;
}

/**
 * Payload for CARE_MEDICATION_ADHERENCE_STREAK event
 */
export interface ICareMedicationAdherenceStreakPayload {
  medicationId: string;
  medicationName: string;
  streakDays: number;
  adherencePercentage: number; // 0-100
  startDate: Date;
  endDate: Date;
}

/**
 * Payload for CARE_TELEMEDICINE_SESSION_COMPLETED event
 */
export interface ICareTelemedicineSessionCompletedPayload {
  sessionId: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  appointmentId?: string;
  technicalIssues?: boolean;
}

/**
 * Payload for CARE_PROVIDER_RATED event
 */
export interface ICareProviderRatedPayload {
  providerId: string;
  appointmentId?: string;
  rating: number; // 1-5
  feedback?: string;
  wouldRecommend: boolean;
}

/**
 * Payload for CARE_SYMPTOM_CHECK_COMPLETED event
 */
export interface ICareSymptomCheckCompletedPayload {
  checkId: string;
  completionDate: Date;
  symptomCount: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  recommendedAction?: string;
}

// ===== PLAN JOURNEY EVENTS =====

/**
 * Plan journey event interface
 */
export interface IPlanEvent extends IJourneyEvent {
  journey: 'plan';
  type: PlanEventType;
  data: IPlanEventPayload;
}

/**
 * Enum of all plan journey event types
 */
export enum PlanEventType {
  CLAIM_SUBMITTED = 'PLAN_CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'PLAN_CLAIM_APPROVED',
  CLAIM_REJECTED = 'PLAN_CLAIM_REJECTED',
  BENEFIT_UTILIZED = 'PLAN_BENEFIT_UTILIZED',
  PLAN_SELECTED = 'PLAN_PLAN_SELECTED',
  PLAN_RENEWED = 'PLAN_PLAN_RENEWED',
  DOCUMENT_UPLOADED = 'PLAN_DOCUMENT_UPLOADED',
  COVERAGE_VERIFIED = 'PLAN_COVERAGE_VERIFIED'
}

/**
 * Union type for all plan event payloads
 */
export type IPlanEventPayload =
  | IPlanClaimSubmittedPayload
  | IPlanClaimApprovedPayload
  | IPlanClaimRejectedPayload
  | IPlanBenefitUtilizedPayload
  | IPlanPlanSelectedPayload
  | IPlanPlanRenewedPayload
  | IPlanDocumentUploadedPayload
  | IPlanCoverageVerifiedPayload;

/**
 * Payload for PLAN_CLAIM_SUBMITTED event
 */
export interface IPlanClaimSubmittedPayload {
  claim: IClaim;
  submissionDate: Date;
  amount: number;
  claimType: string;
  hasDocuments: boolean;
  isComplete: boolean;
}

/**
 * Payload for PLAN_CLAIM_APPROVED event
 */
export interface IPlanClaimApprovedPayload {
  claimId: string;
  approvalDate: Date;
  amount: number;
  approvedAmount: number;
  processingDays: number;
  paymentMethod?: string;
  paymentDate?: Date;
}

/**
 * Payload for PLAN_CLAIM_REJECTED event
 */
export interface IPlanClaimRejectedPayload {
  claimId: string;
  rejectionDate: Date;
  reason: string;
  canResubmit: boolean;
  missingDocuments?: string[];
}

/**
 * Payload for PLAN_BENEFIT_UTILIZED event
 */
export interface IPlanBenefitUtilizedPayload {
  benefit: IBenefit;
  utilizationDate: Date;
  serviceProvider?: string;
  amount?: number;
  remainingCoverage?: number;
  isFirstUtilization: boolean;
}

/**
 * Payload for PLAN_PLAN_SELECTED event
 */
export interface IPlanPlanSelectedPayload {
  planId: string;
  planName: string;
  selectionDate: Date;
  startDate: Date;
  endDate?: Date;
  premium: number;
  isUpgrade?: boolean;
}

/**
 * Payload for PLAN_PLAN_RENEWED event
 */
export interface IPlanPlanRenewedPayload {
  planId: string;
  planName: string;
  renewalDate: Date;
  previousEndDate: Date;
  newEndDate: Date;
  premium: number;
  premiumChange?: number;
  consecutiveYears: number;
}

/**
 * Payload for PLAN_DOCUMENT_UPLOADED event
 */
export interface IPlanDocumentUploadedPayload {
  documentId: string;
  documentType: string;
  uploadDate: Date;
  fileSize: number;
  fileName: string;
  claimId?: string;
}

/**
 * Payload for PLAN_COVERAGE_VERIFIED event
 */
export interface IPlanCoverageVerifiedPayload {
  verificationId: string;
  verificationDate: Date;
  serviceType: string;
  providerId?: string;
  isCovered: boolean;
  estimatedCoverage?: number;
  outOfPocketEstimate?: number;
}

// ===== UTILITY TYPES =====

/**
 * Union type for all journey events
 */
export type JourneyEvent = IHealthEvent | ICareEvent | IPlanEvent;

/**
 * Union type for all journey event types
 */
export type JourneyEventType = HealthEventType | CareEventType | PlanEventType;

/**
 * Type guard to check if an event is a health event
 */
export function isHealthEvent(event: IJourneyEvent): event is IHealthEvent {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is a care event
 */
export function isCareEvent(event: IJourneyEvent): event is ICareEvent {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is a plan event
 */
export function isPlanEvent(event: IJourneyEvent): event is IPlanEvent {
  return event.journey === 'plan';
}