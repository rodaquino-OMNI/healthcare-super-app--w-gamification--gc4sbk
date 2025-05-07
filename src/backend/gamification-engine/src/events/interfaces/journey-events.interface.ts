/**
 * Journey-specific event interfaces for the gamification engine.
 * 
 * This file defines specialized interfaces for events from different journeys
 * (Health, Care, Plan) processed by the gamification engine. These interfaces
 * ensure proper type safety and validation for journey-specific event payloads.
 */

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
 * Base interface for all journey events
 */
export interface IJourneyEvent {
  type: string;
  userId: string;
  timestamp: Date;
  journey: string;
  data: Record<string, any>;
}

// ===== HEALTH JOURNEY EVENTS =====

/**
 * Health journey event types
 */
export enum HealthEventType {
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  GOAL_PROGRESS_UPDATED = 'GOAL_PROGRESS_UPDATED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED'
}

/**
 * Health metric recorded event payload
 */
export interface IHealthMetricRecordedPayload {
  metric: IHealthMetric;
  metricType: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  source?: string;
  previousValue?: number;
  changePercentage?: number;
}

/**
 * Goal achieved event payload
 */
export interface IGoalAchievedPayload {
  goal: IHealthGoal;
  goalType: GoalType;
  achievedAt: Date;
  targetValue: number;
  actualValue: number;
  streakCount?: number;
}

/**
 * Goal progress updated event payload
 */
export interface IGoalProgressUpdatedPayload {
  goal: IHealthGoal;
  goalType: GoalType;
  progressPercentage: number;
  currentValue: number;
  targetValue: number;
  remainingDays?: number;
}

/**
 * Device connected event payload
 */
export interface IDeviceConnectedPayload {
  deviceId: string;
  deviceType: string;
  connectionTime: Date;
  isFirstConnection: boolean;
}

/**
 * Health insight generated event payload
 */
export interface IHealthInsightGeneratedPayload {
  insightId: string;
  insightType: string;
  relatedMetrics: MetricType[];
  severity: 'low' | 'medium' | 'high';
  generatedAt: Date;
}

/**
 * Union type of all health event payloads
 */
export type HealthEventPayload =
  | IHealthMetricRecordedPayload
  | IGoalAchievedPayload
  | IGoalProgressUpdatedPayload
  | IDeviceConnectedPayload
  | IHealthInsightGeneratedPayload;

/**
 * Health journey event interface
 */
export interface IHealthEvent extends IJourneyEvent {
  journey: 'health';
  type: HealthEventType;
  data: HealthEventPayload;
}

// ===== CARE JOURNEY EVENTS =====

/**
 * Care journey event types
 */
export enum CareEventType {
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_ADHERENCE_STREAK = 'MEDICATION_ADHERENCE_STREAK',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  SYMPTOM_CHECKED = 'SYMPTOM_CHECKED'
}

/**
 * Appointment booked event payload
 */
export interface IAppointmentBookedPayload {
  appointment: IAppointment;
  appointmentType: AppointmentType;
  providerId: string;
  scheduledFor: Date;
  isFirstAppointment: boolean;
  specialtyArea?: string;
}

/**
 * Appointment completed event payload
 */
export interface IAppointmentCompletedPayload {
  appointment: IAppointment;
  appointmentType: AppointmentType;
  providerId: string;
  completedAt: Date;
  duration: number; // in minutes
  followUpScheduled?: boolean;
}

/**
 * Medication taken event payload
 */
export interface IMedicationTakenPayload {
  medication: IMedication;
  takenAt: Date;
  dosage: string;
  adherencePercentage: number; // 0-100
  onSchedule: boolean;
}

/**
 * Medication adherence streak event payload
 */
export interface IMedicationAdherenceStreakPayload {
  medication: IMedication;
  streakDays: number;
  adherencePercentage: number; // 0-100
  lastTakenAt: Date;
}

/**
 * Telemedicine session completed event payload
 */
export interface ITelemedicineSessionCompletedPayload {
  sessionId: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  specialtyArea?: string;
}

/**
 * Symptom checked event payload
 */
export interface ISymptomCheckedPayload {
  symptomIds: string[];
  checkedAt: Date;
  severity: 'mild' | 'moderate' | 'severe';
  recommendationProvided: boolean;
}

/**
 * Union type of all care event payloads
 */
export type CareEventPayload =
  | IAppointmentBookedPayload
  | IAppointmentCompletedPayload
  | IMedicationTakenPayload
  | IMedicationAdherenceStreakPayload
  | ITelemedicineSessionCompletedPayload
  | ISymptomCheckedPayload;

/**
 * Care journey event interface
 */
export interface ICareEvent extends IJourneyEvent {
  journey: 'care';
  type: CareEventType;
  data: CareEventPayload;
}

// ===== PLAN JOURNEY EVENTS =====

/**
 * Plan journey event types
 */
export enum PlanEventType {
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  BENEFIT_UTILIZED = 'BENEFIT_UTILIZED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED'
}

/**
 * Claim submitted event payload
 */
export interface IClaimSubmittedPayload {
  claim: IClaim;
  submittedAt: Date;
  amount: number;
  claimType: string;
  hasDocuments: boolean;
  isFirstClaim: boolean;
}

/**
 * Claim approved event payload
 */
export interface IClaimApprovedPayload {
  claim: IClaim;
  approvedAt: Date;
  amount: number;
  approvedAmount: number;
  processingDuration: number; // in days
  status: ClaimStatus;
}

/**
 * Benefit utilized event payload
 */
export interface IBenefitUtilizedPayload {
  benefit: IBenefit;
  utilizedAt: Date;
  benefitType: string;
  savingsAmount?: number;
  isFirstUtilization: boolean;
}

/**
 * Plan selected event payload
 */
export interface IPlanSelectedPayload {
  planId: string;
  selectedAt: Date;
  planType: string;
  coverageLevel: string;
  annualCost: number;
  isNewEnrollment: boolean;
}

/**
 * Document uploaded event payload
 */
export interface IDocumentUploadedPayload {
  documentId: string;
  uploadedAt: Date;
  documentType: string;
  fileSize: number; // in bytes
  relatedClaimId?: string;
}

/**
 * Union type of all plan event payloads
 */
export type PlanEventPayload =
  | IClaimSubmittedPayload
  | IClaimApprovedPayload
  | IBenefitUtilizedPayload
  | IPlanSelectedPayload
  | IDocumentUploadedPayload;

/**
 * Plan journey event interface
 */
export interface IPlanEvent extends IJourneyEvent {
  journey: 'plan';
  type: PlanEventType;
  data: PlanEventPayload;
}

// ===== UTILITY TYPES =====

/**
 * Union type of all journey events
 */
export type JourneyEvent = IHealthEvent | ICareEvent | IPlanEvent;

/**
 * Type guard to check if an event is a health event
 * @param event The event to check
 * @returns True if the event is a health event
 */
export function isHealthEvent(event: JourneyEvent): event is IHealthEvent {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is a care event
 * @param event The event to check
 * @returns True if the event is a care event
 */
export function isCareEvent(event: JourneyEvent): event is ICareEvent {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is a plan event
 * @param event The event to check
 * @returns True if the event is a plan event
 */
export function isPlanEvent(event: JourneyEvent): event is IPlanEvent {
  return event.journey === 'plan';
}

/**
 * Maps an event type to its corresponding journey
 */
export const eventTypeToJourney: Record<string, 'health' | 'care' | 'plan'> = {
  // Health journey events
  [HealthEventType.HEALTH_METRIC_RECORDED]: 'health',
  [HealthEventType.GOAL_ACHIEVED]: 'health',
  [HealthEventType.GOAL_PROGRESS_UPDATED]: 'health',
  [HealthEventType.DEVICE_CONNECTED]: 'health',
  [HealthEventType.HEALTH_INSIGHT_GENERATED]: 'health',
  
  // Care journey events
  [CareEventType.APPOINTMENT_BOOKED]: 'care',
  [CareEventType.APPOINTMENT_COMPLETED]: 'care',
  [CareEventType.MEDICATION_TAKEN]: 'care',
  [CareEventType.MEDICATION_ADHERENCE_STREAK]: 'care',
  [CareEventType.TELEMEDICINE_SESSION_COMPLETED]: 'care',
  [CareEventType.SYMPTOM_CHECKED]: 'care',
  
  // Plan journey events
  [PlanEventType.CLAIM_SUBMITTED]: 'plan',
  [PlanEventType.CLAIM_APPROVED]: 'plan',
  [PlanEventType.BENEFIT_UTILIZED]: 'plan',
  [PlanEventType.PLAN_SELECTED]: 'plan',
  [PlanEventType.DOCUMENT_UPLOADED]: 'plan'
};