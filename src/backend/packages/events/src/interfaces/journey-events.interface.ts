/**
 * @file Journey Events Interface
 * @description Defines type-safe interfaces for journey-specific events that flow through the system.
 * These interfaces ensure that events from different journeys maintain consistent structures
 * while accommodating journey-specific data requirements. They provide the foundation for
 * cross-journey gamification and achievement tracking.
 */

// Import shared journey interfaces from @austa/interfaces
import { 
  IHealthMetric, 
  IHealthGoal, 
  MetricType, 
  GoalType,
  GoalStatus,
  IDeviceConnection,
  IMedicalEvent
} from '@austa/interfaces/journey/health';

import {
  IAppointment,
  IMedication,
  IProvider,
  ITelemedicineSession,
  ITreatmentPlan,
  AppointmentStatus,
  AppointmentType
} from '@austa/interfaces/journey/care';

import {
  IClaim,
  IBenefit,
  IPlan,
  IDocument,
  ICoverage,
  ClaimStatus
} from '@austa/interfaces/journey/plan';

/**
 * Enum defining the available journey types in the system
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Base interface for all journey events
 */
export interface IJourneyEvent {
  /**
   * Unique identifier for the event
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id?: string;

  /**
   * The type of event that occurred
   * @example "HEALTH_METRIC_RECORDED", "CARE_APPOINTMENT_BOOKED", "PLAN_CLAIM_SUBMITTED"
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
  timestamp: string | Date;

  /**
   * The journey context where the event originated
   * @example "health", "care", "plan"
   */
  journey: JourneyType;

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
  data: Record<string, any>;

  /**
   * Optional correlation ID for tracking related events across journeys
   * @example "corr_550e8400-e29b-41d4-a716-446655440000"
   */
  correlationId?: string;

  /**
   * Optional metadata for additional context
   */
  metadata?: Record<string, any>;
}

// ===== HEALTH JOURNEY EVENTS =====

/**
 * Health journey event interface
 */
export interface IHealthEvent extends IJourneyEvent {
  journey: JourneyType.HEALTH;
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
  DEVICE_SYNCED = 'HEALTH_DEVICE_SYNCED',
  MEDICAL_RECORD_ADDED = 'HEALTH_MEDICAL_RECORD_ADDED',
  HEALTH_CHECK_COMPLETED = 'HEALTH_CHECK_COMPLETED',
  INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED'
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
  | IHealthDeviceSyncedPayload
  | IHealthMedicalRecordAddedPayload
  | IHealthCheckCompletedPayload
  | IHealthInsightGeneratedPayload;

/**
 * Payload for HEALTH_METRIC_RECORDED event
 */
export interface IHealthMetricRecordedPayload {
  /**
   * The health metric that was recorded
   */
  metric: IHealthMetric;

  /**
   * Type of health metric
   */
  metricType: MetricType;

  /**
   * Value of the recorded metric
   */
  value: number;

  /**
   * Unit of measurement
   */
  unit: string;

  /**
   * When the metric was recorded
   */
  timestamp: Date | string;

  /**
   * Source of the metric (device, manual entry, etc.)
   */
  source?: string;

  /**
   * Previous value for comparison
   */
  previousValue?: number;

  /**
   * Change from previous value
   */
  change?: number;

  /**
   * Whether the change represents an improvement
   */
  isImprovement?: boolean;
}

/**
 * Payload for HEALTH_GOAL_CREATED event
 */
export interface IHealthGoalCreatedPayload {
  /**
   * The health goal that was created
   */
  goal: IHealthGoal;

  /**
   * Type of health goal
   */
  goalType: GoalType;

  /**
   * Target value to achieve
   */
  targetValue: number;

  /**
   * Unit of measurement
   */
  unit: string;

  /**
   * When the goal starts
   */
  startDate: Date | string;

  /**
   * When the goal ends (if applicable)
   */
  endDate?: Date | string;
}

/**
 * Payload for HEALTH_GOAL_UPDATED event
 */
export interface IHealthGoalUpdatedPayload {
  /**
   * The health goal that was updated
   */
  goal: IHealthGoal;

  /**
   * Previous goal status
   */
  previousStatus?: GoalStatus;

  /**
   * New goal status
   */
  newStatus: GoalStatus;

  /**
   * Current progress percentage (0-100)
   */
  progress: number;

  /**
   * Current value
   */
  currentValue: number;

  /**
   * Target value
   */
  targetValue: number;
}

/**
 * Payload for HEALTH_GOAL_ACHIEVED event
 */
export interface IHealthGoalAchievedPayload {
  /**
   * The health goal that was achieved
   */
  goal: IHealthGoal;

  /**
   * Type of health goal
   */
  goalType: GoalType;

  /**
   * Value at achievement
   */
  achievedValue: number;

  /**
   * Target value that was set
   */
  targetValue: number;

  /**
   * Number of days it took to achieve the goal
   */
  daysToAchieve: number;

  /**
   * Whether the goal was completed before the end date
   */
  isEarlyCompletion?: boolean;
}

/**
 * Payload for HEALTH_DEVICE_CONNECTED event
 */
export interface IHealthDeviceConnectedPayload {
  /**
   * The device connection
   */
  deviceConnection: IDeviceConnection;

  /**
   * Device identifier
   */
  deviceId: string;

  /**
   * Type of device
   */
  deviceType: string;

  /**
   * When the device was connected
   */
  connectionDate: Date | string;

  /**
   * Whether this is the first time connecting this device
   */
  isFirstConnection: boolean;
}

/**
 * Payload for HEALTH_DEVICE_SYNCED event
 */
export interface IHealthDeviceSyncedPayload {
  /**
   * The device connection
   */
  deviceConnection: IDeviceConnection;

  /**
   * Device identifier
   */
  deviceId: string;

  /**
   * Type of device
   */
  deviceType: string;

  /**
   * When the device was synced
   */
  syncDate: Date | string;

  /**
   * Number of metrics synced
   */
  metricsCount: number;

  /**
   * Types of metrics synced
   */
  metricTypes: MetricType[];

  /**
   * Whether the sync was successful
   */
  syncSuccessful: boolean;

  /**
   * Any error message if sync failed
   */
  errorMessage?: string;
}

/**
 * Payload for HEALTH_MEDICAL_RECORD_ADDED event
 */
export interface IHealthMedicalRecordAddedPayload {
  /**
   * The medical record that was added
   */
  medicalRecord: IMedicalEvent;

  /**
   * Record identifier
   */
  recordId: string;

  /**
   * Type of medical record
   */
  recordType: string;

  /**
   * Date of the record
   */
  recordDate: Date | string;

  /**
   * Healthcare provider associated with the record
   */
  provider?: string;
}

/**
 * Payload for HEALTH_CHECK_COMPLETED event
 */
export interface IHealthCheckCompletedPayload {
  /**
   * Health check identifier
   */
  checkId: string;

  /**
   * When the health check was completed
   */
  completionDate: Date | string;

  /**
   * Health score (if applicable)
   */
  score?: number;

  /**
   * Health recommendations
   */
  recommendations?: string[];
}

/**
 * Payload for HEALTH_INSIGHT_GENERATED event
 */
export interface IHealthInsightGeneratedPayload {
  /**
   * Insight identifier
   */
  insightId: string;

  /**
   * Type of insight
   */
  insightType: string;

  /**
   * When the insight was generated
   */
  generationDate: Date | string;

  /**
   * Metrics used to generate the insight
   */
  relatedMetrics?: MetricType[];

  /**
   * Severity or importance level
   */
  severity?: 'low' | 'medium' | 'high';

  /**
   * Brief description of the insight
   */
  description: string;

  /**
   * Detailed explanation
   */
  explanation?: string;

  /**
   * Recommended actions
   */
  recommendations?: string[];
}

// ===== CARE JOURNEY EVENTS =====

/**
 * Care journey event interface
 */
export interface ICareEvent extends IJourneyEvent {
  journey: JourneyType.CARE;
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
  TELEMEDICINE_SESSION_STARTED = 'CARE_TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'CARE_TELEMEDICINE_SESSION_COMPLETED',
  PROVIDER_RATED = 'CARE_PROVIDER_RATED',
  SYMPTOM_CHECK_COMPLETED = 'CARE_SYMPTOM_CHECK_COMPLETED',
  CARE_PLAN_CREATED = 'CARE_PLAN_CREATED',
  CARE_PLAN_UPDATED = 'CARE_PLAN_UPDATED',
  CARE_PLAN_COMPLETED = 'CARE_PLAN_COMPLETED'
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
  | ICareTelemedicineSessionStartedPayload
  | ICareTelemedicineSessionCompletedPayload
  | ICareProviderRatedPayload
  | ICareSymptomCheckCompletedPayload
  | ICarePlanCreatedPayload
  | ICarePlanUpdatedPayload
  | ICarePlanCompletedPayload;

/**
 * Payload for CARE_APPOINTMENT_BOOKED event
 */
export interface ICareAppointmentBookedPayload {
  /**
   * The appointment that was booked
   */
  appointment: IAppointment;

  /**
   * Type of appointment
   */
  appointmentType: AppointmentType;

  /**
   * Provider identifier
   */
  providerId: string;

  /**
   * When the appointment is scheduled
   */
  scheduledDate: Date | string;

  /**
   * Whether this is the user's first appointment
   */
  isFirstAppointment?: boolean;

  /**
   * Whether the appointment is marked as urgent
   */
  isUrgent?: boolean;
}

/**
 * Payload for CARE_APPOINTMENT_COMPLETED event
 */
export interface ICareAppointmentCompletedPayload {
  /**
   * The appointment that was completed
   */
  appointment: IAppointment;

  /**
   * Type of appointment
   */
  appointmentType: AppointmentType;

  /**
   * Provider identifier
   */
  providerId: string;

  /**
   * When the appointment was completed
   */
  completionDate: Date | string;

  /**
   * Duration in minutes
   */
  duration: number;

  /**
   * Whether a follow-up appointment was scheduled
   */
  followUpScheduled?: boolean;
}

/**
 * Payload for CARE_APPOINTMENT_CANCELED event
 */
export interface ICareAppointmentCanceledPayload {
  /**
   * Appointment identifier
   */
  appointmentId: string;

  /**
   * Type of appointment
   */
  appointmentType: AppointmentType;

  /**
   * Provider identifier
   */
  providerId: string;

  /**
   * When the appointment was canceled
   */
  cancellationDate: Date | string;

  /**
   * Whether the appointment was rescheduled
   */
  rescheduled: boolean;

  /**
   * Reason for cancellation
   */
  reason?: string;
}

/**
 * Payload for CARE_MEDICATION_ADDED event
 */
export interface ICareMedicationAddedPayload {
  /**
   * The medication that was added
   */
  medication: IMedication;

  /**
   * When to start taking the medication
   */
  startDate: Date | string;

  /**
   * When to stop taking the medication (if applicable)
   */
  endDate?: Date | string;

  /**
   * Dosage information
   */
  dosage: string;

  /**
   * How often to take the medication
   */
  frequency: string;

  /**
   * Whether this is a long-term medication
   */
  isChronicMedication?: boolean;
}

/**
 * Payload for CARE_MEDICATION_TAKEN event
 */
export interface ICareMedicationTakenPayload {
  /**
   * Medication identifier
   */
  medicationId: string;

  /**
   * Name of the medication
   */
  medicationName: string;

  /**
   * When the medication was taken
   */
  takenDate: Date | string;

  /**
   * Whether the medication was taken on schedule
   */
  takenOnTime: boolean;

  /**
   * Dosage information
   */
  dosage: string;
}

/**
 * Payload for CARE_MEDICATION_ADHERENCE_STREAK event
 */
export interface ICareMedicationAdherenceStreakPayload {
  /**
   * Medication identifier
   */
  medicationId: string;

  /**
   * Name of the medication
   */
  medicationName: string;

  /**
   * Number of consecutive days medication was taken
   */
  streakDays: number;

  /**
   * Percentage of doses taken on time (0-100)
   */
  adherencePercentage: number;

  /**
   * When the streak started
   */
  startDate: Date | string;

  /**
   * When the streak ended
   */
  endDate: Date | string;
}

/**
 * Payload for CARE_TELEMEDICINE_SESSION_STARTED event
 */
export interface ICareTelemedicineSessionStartedPayload {
  /**
   * The telemedicine session
   */
  session: ITelemedicineSession;

  /**
   * Session identifier
   */
  sessionId: string;

  /**
   * Provider identifier
   */
  providerId: string;

  /**
   * When the session started
   */
  startTime: Date | string;

  /**
   * Related appointment identifier (if applicable)
   */
  appointmentId?: string;
}

/**
 * Payload for CARE_TELEMEDICINE_SESSION_COMPLETED event
 */
export interface ICareTelemedicineSessionCompletedPayload {
  /**
   * The telemedicine session
   */
  session: ITelemedicineSession;

  /**
   * Session identifier
   */
  sessionId: string;

  /**
   * Provider identifier
   */
  providerId: string;

  /**
   * When the session started
   */
  startTime: Date | string;

  /**
   * When the session ended
   */
  endTime: Date | string;

  /**
   * Duration in minutes
   */
  duration: number;

  /**
   * Related appointment identifier (if applicable)
   */
  appointmentId?: string;

  /**
   * Whether there were technical issues during the session
   */
  technicalIssues?: boolean;
}

/**
 * Payload for CARE_PROVIDER_RATED event
 */
export interface ICareProviderRatedPayload {
  /**
   * Provider identifier
   */
  providerId: string;

  /**
   * Related appointment identifier (if applicable)
   */
  appointmentId?: string;

  /**
   * Rating value (1-5)
   */
  rating: number;

  /**
   * Feedback comments
   */
  feedback?: string;

  /**
   * Whether the user would recommend this provider
   */
  wouldRecommend: boolean;
}

/**
 * Payload for CARE_SYMPTOM_CHECK_COMPLETED event
 */
export interface ICareSymptomCheckCompletedPayload {
  /**
   * Symptom check identifier
   */
  checkId: string;

  /**
   * When the symptom check was completed
   */
  completionDate: Date | string;

  /**
   * Number of symptoms reported
   */
  symptomCount: number;

  /**
   * Assessed urgency level
   */
  urgencyLevel: 'low' | 'medium' | 'high';

  /**
   * Recommended action based on symptoms
   */
  recommendedAction?: string;
}

/**
 * Payload for CARE_PLAN_CREATED event
 */
export interface ICarePlanCreatedPayload {
  /**
   * The treatment plan that was created
   */
  treatmentPlan: ITreatmentPlan;

  /**
   * Plan identifier
   */
  planId: string;

  /**
   * Type of care plan
   */
  planType: string;

  /**
   * When the plan starts
   */
  startDate: Date | string;

  /**
   * When the plan ends (if applicable)
   */
  endDate?: Date | string;

  /**
   * Provider who created the plan
   */
  providerId?: string;

  /**
   * Number of activities in the plan
   */
  activitiesCount: number;
}

/**
 * Payload for CARE_PLAN_UPDATED event
 */
export interface ICarePlanUpdatedPayload {
  /**
   * The treatment plan that was updated
   */
  treatmentPlan: ITreatmentPlan;

  /**
   * Plan identifier
   */
  planId: string;

  /**
   * Current progress percentage (0-100)
   */
  progress: number;

  /**
   * Number of completed activities
   */
  completedActivities: number;

  /**
   * Total number of activities
   */
  totalActivities: number;

  /**
   * Whether the plan is on schedule
   */
  isOnSchedule: boolean;
}

/**
 * Payload for CARE_PLAN_COMPLETED event
 */
export interface ICarePlanCompletedPayload {
  /**
   * The treatment plan that was completed
   */
  treatmentPlan: ITreatmentPlan;

  /**
   * Plan identifier
   */
  planId: string;

  /**
   * Type of care plan
   */
  planType: string;

  /**
   * When the plan was completed
   */
  completionDate: Date | string;

  /**
   * Whether all activities were completed
   */
  fullyCompleted: boolean;

  /**
   * Percentage of activities completed (0-100)
   */
  completionPercentage: number;

  /**
   * Number of days the plan was active
   */
  daysActive: number;
}

// ===== PLAN JOURNEY EVENTS =====

/**
 * Plan journey event interface
 */
export interface IPlanEvent extends IJourneyEvent {
  journey: JourneyType.PLAN;
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
  PLAN_COMPARED = 'PLAN_PLAN_COMPARED',
  DOCUMENT_UPLOADED = 'PLAN_DOCUMENT_UPLOADED',
  COVERAGE_VERIFIED = 'PLAN_COVERAGE_VERIFIED',
  REWARD_REDEEMED = 'PLAN_REWARD_REDEEMED'
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
  | IPlanPlanComparedPayload
  | IPlanDocumentUploadedPayload
  | IPlanCoverageVerifiedPayload
  | IPlanRewardRedeemedPayload;

/**
 * Payload for PLAN_CLAIM_SUBMITTED event
 */
export interface IPlanClaimSubmittedPayload {
  /**
   * The claim that was submitted
   */
  claim: IClaim;

  /**
   * When the claim was submitted
   */
  submissionDate: Date | string;

  /**
   * Claim amount
   */
  amount: number;

  /**
   * Type of claim
   */
  claimType: string;

  /**
   * Whether the claim includes supporting documents
   */
  hasDocuments: boolean;

  /**
   * Whether the claim submission is complete
   */
  isComplete: boolean;
}

/**
 * Payload for PLAN_CLAIM_APPROVED event
 */
export interface IPlanClaimApprovedPayload {
  /**
   * Claim identifier
   */
  claimId: string;

  /**
   * When the claim was approved
   */
  approvalDate: Date | string;

  /**
   * Original claim amount
   */
  amount: number;

  /**
   * Approved amount (may differ from original)
   */
  approvedAmount: number;

  /**
   * Number of days to process the claim
   */
  processingDays: number;

  /**
   * How the payment will be made
   */
  paymentMethod?: string;

  /**
   * When the payment will be made
   */
  paymentDate?: Date | string;
}

/**
 * Payload for PLAN_CLAIM_REJECTED event
 */
export interface IPlanClaimRejectedPayload {
  /**
   * Claim identifier
   */
  claimId: string;

  /**
   * When the claim was rejected
   */
  rejectionDate: Date | string;

  /**
   * Reason for rejection
   */
  reason: string;

  /**
   * Whether the claim can be resubmitted
   */
  canResubmit: boolean;

  /**
   * Documents needed for resubmission
   */
  missingDocuments?: string[];
}

/**
 * Payload for PLAN_BENEFIT_UTILIZED event
 */
export interface IPlanBenefitUtilizedPayload {
  /**
   * The benefit that was utilized
   */
  benefit: IBenefit;

  /**
   * When the benefit was utilized
   */
  utilizationDate: Date | string;

  /**
   * Provider of the service
   */
  serviceProvider?: string;

  /**
   * Cost of the service
   */
  amount?: number;

  /**
   * Remaining coverage for this benefit
   */
  remainingCoverage?: number;

  /**
   * Whether this is the first time using this benefit
   */
  isFirstUtilization: boolean;
}

/**
 * Payload for PLAN_PLAN_SELECTED event
 */
export interface IPlanPlanSelectedPayload {
  /**
   * The plan that was selected
   */
  plan: IPlan;

  /**
   * Plan identifier
   */
  planId: string;

  /**
   * Plan name
   */
  planName: string;

  /**
   * When the plan was selected
   */
  selectionDate: Date | string;

  /**
   * When the plan coverage starts
   */
  startDate: Date | string;

  /**
   * When the plan coverage ends
   */
  endDate?: Date | string;

  /**
   * Monthly premium amount
   */
  premium: number;

  /**
   * Whether this is an upgrade from a previous plan
   */
  isUpgrade?: boolean;
}

/**
 * Payload for PLAN_PLAN_RENEWED event
 */
export interface IPlanPlanRenewedPayload {
  /**
   * The plan that was renewed
   */
  plan: IPlan;

  /**
   * Plan identifier
   */
  planId: string;

  /**
   * Plan name
   */
  planName: string;

  /**
   * When the plan was renewed
   */
  renewalDate: Date | string;

  /**
   * When the previous coverage ended
   */
  previousEndDate: Date | string;

  /**
   * When the new coverage ends
   */
  newEndDate: Date | string;

  /**
   * Monthly premium amount
   */
  premium: number;

  /**
   * Change in premium from previous period
   */
  premiumChange?: number;

  /**
   * Number of consecutive years with this plan
   */
  consecutiveYears: number;
}

/**
 * Payload for PLAN_PLAN_COMPARED event
 */
export interface IPlanPlanComparedPayload {
  /**
   * Plans that were compared
   */
  comparedPlans: IPlan[];

  /**
   * Plan identifiers
   */
  planIds: string[];

  /**
   * When the comparison was made
   */
  comparisonDate: Date | string;

  /**
   * Criteria used for comparison
   */
  comparisonCriteria: string[];

  /**
   * Whether a plan was selected after comparison
   */
  selectionMade: boolean;

  /**
   * Identifier of the selected plan (if any)
   */
  selectedPlanId?: string;
}

/**
 * Payload for PLAN_DOCUMENT_UPLOADED event
 */
export interface IPlanDocumentUploadedPayload {
  /**
   * The document that was uploaded
   */
  document: IDocument;

  /**
   * Document identifier
   */
  documentId: string;

  /**
   * Type of document
   */
  documentType: string;

  /**
   * When the document was uploaded
   */
  uploadDate: Date | string;

  /**
   * Size of the file in bytes
   */
  fileSize: number;

  /**
   * Name of the file
   */
  fileName: string;

  /**
   * Related claim identifier (if applicable)
   */
  claimId?: string;
}

/**
 * Payload for PLAN_COVERAGE_VERIFIED event
 */
export interface IPlanCoverageVerifiedPayload {
  /**
   * The coverage that was verified
   */
  coverage: ICoverage;

  /**
   * Verification identifier
   */
  verificationId: string;

  /**
   * When the verification was performed
   */
  verificationDate: Date | string;

  /**
   * Type of service being verified
   */
  serviceType: string;

  /**
   * Provider identifier
   */
  providerId?: string;

  /**
   * Whether the service is covered
   */
  isCovered: boolean;

  /**
   * Estimated coverage amount
   */
  estimatedCoverage?: number;

  /**
   * Estimated out-of-pocket cost
   */
  outOfPocketEstimate?: number;
}

/**
 * Payload for PLAN_REWARD_REDEEMED event
 */
export interface IPlanRewardRedeemedPayload {
  /**
   * Reward identifier
   */
  rewardId: string;

  /**
   * Name of the reward
   */
  rewardName: string;

  /**
   * When the reward was redeemed
   */
  redemptionDate: Date | string;

  /**
   * Point value of the reward
   */
  pointValue: number;

  /**
   * Monetary value of the reward (if applicable)
   */
  monetaryValue?: number;

  /**
   * Type of reward
   */
  rewardType: string;

  /**
   * Whether this is a premium reward
   */
  isPremiumReward: boolean;
}

// ===== CROSS-JOURNEY EVENTS =====

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
  return event.journey === JourneyType.HEALTH;
}

/**
 * Type guard to check if an event is a care event
 */
export function isCareEvent(event: IJourneyEvent): event is ICareEvent {
  return event.journey === JourneyType.CARE;
}

/**
 * Type guard to check if an event is a plan event
 */
export function isPlanEvent(event: IJourneyEvent): event is IPlanEvent {
  return event.journey === JourneyType.PLAN;
}

/**
 * Helper function to create a correlation between events across journeys
 */
export function correlateEvents(events: IJourneyEvent[], correlationId?: string): IJourneyEvent[] {
  const actualCorrelationId = correlationId || `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  return events.map(event => ({
    ...event,
    correlationId: actualCorrelationId
  }));
}