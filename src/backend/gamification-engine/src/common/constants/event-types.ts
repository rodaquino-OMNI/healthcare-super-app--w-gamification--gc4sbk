/**
 * @file event-types.ts
 * @description Defines all event types that can be processed by the gamification engine, organized by journey.
 * These typed constants ensure consistent event identification across services and are used in event validation,
 * processing logic, and achievement rules.
 */

import { Journey } from './journey';

/**
 * Health journey event types
 * Events related to health metrics, goals, and device connections
 */
export enum HealthEventType {
  // Health metrics events
  METRIC_RECORDED = 'health.metric.recorded',
  METRIC_GOAL_ACHIEVED = 'health.metric.goal.achieved',
  METRIC_STREAK_CONTINUED = 'health.metric.streak.continued',
  METRIC_STREAK_BROKEN = 'health.metric.streak.broken',
  METRIC_MILESTONE_REACHED = 'health.metric.milestone.reached',
  
  // Health device events
  DEVICE_CONNECTED = 'health.device.connected',
  DEVICE_SYNCED = 'health.device.synced',
  DEVICE_DISCONNECTED = 'health.device.disconnected',
  
  // Health goals events
  GOAL_CREATED = 'health.goal.created',
  GOAL_UPDATED = 'health.goal.updated',
  GOAL_COMPLETED = 'health.goal.completed',
  GOAL_ABANDONED = 'health.goal.abandoned',
  
  // Health insights events
  INSIGHT_VIEWED = 'health.insight.viewed',
  INSIGHT_SHARED = 'health.insight.shared',
  INSIGHT_ACTIONED = 'health.insight.actioned',
  
  // Health profile events
  HEALTH_PROFILE_COMPLETED = 'health.profile.completed',
  HEALTH_PROFILE_UPDATED = 'health.profile.updated',
  HEALTH_ASSESSMENT_COMPLETED = 'health.assessment.completed',
}

/**
 * Care journey event types
 * Events related to appointments, medications, telemedicine, and providers
 */
export enum CareEventType {
  // Appointment events
  APPOINTMENT_SCHEDULED = 'care.appointment.scheduled',
  APPOINTMENT_RESCHEDULED = 'care.appointment.rescheduled',
  APPOINTMENT_CANCELLED = 'care.appointment.cancelled',
  APPOINTMENT_COMPLETED = 'care.appointment.completed',
  APPOINTMENT_REMINDER_ACKNOWLEDGED = 'care.appointment.reminder.acknowledged',
  
  // Medication events
  MEDICATION_ADDED = 'care.medication.added',
  MEDICATION_TAKEN = 'care.medication.taken',
  MEDICATION_SKIPPED = 'care.medication.skipped',
  MEDICATION_ADHERENCE_STREAK = 'care.medication.adherence.streak',
  MEDICATION_REFILL_REQUESTED = 'care.medication.refill.requested',
  
  // Telemedicine events
  TELEMEDICINE_SESSION_SCHEDULED = 'care.telemedicine.session.scheduled',
  TELEMEDICINE_SESSION_STARTED = 'care.telemedicine.session.started',
  TELEMEDICINE_SESSION_COMPLETED = 'care.telemedicine.session.completed',
  TELEMEDICINE_SESSION_RATED = 'care.telemedicine.session.rated',
  
  // Provider events
  PROVIDER_ADDED = 'care.provider.added',
  PROVIDER_RATED = 'care.provider.rated',
  PROVIDER_RECOMMENDED = 'care.provider.recommended',
  
  // Symptom checker events
  SYMPTOM_CHECKER_STARTED = 'care.symptom.checker.started',
  SYMPTOM_CHECKER_COMPLETED = 'care.symptom.checker.completed',
  SYMPTOM_LOGGED = 'care.symptom.logged',
  
  // Treatment events
  TREATMENT_PLAN_CREATED = 'care.treatment.plan.created',
  TREATMENT_PLAN_UPDATED = 'care.treatment.plan.updated',
  TREATMENT_PLAN_COMPLETED = 'care.treatment.plan.completed',
  TREATMENT_STEP_COMPLETED = 'care.treatment.step.completed',
}

/**
 * Plan journey event types
 * Events related to insurance plans, benefits, claims, and coverage
 */
export enum PlanEventType {
  // Plan events
  PLAN_VIEWED = 'plan.viewed',
  PLAN_COMPARED = 'plan.compared',
  PLAN_SELECTED = 'plan.selected',
  PLAN_CHANGED = 'plan.changed',
  
  // Benefit events
  BENEFIT_VIEWED = 'plan.benefit.viewed',
  BENEFIT_USED = 'plan.benefit.used',
  BENEFIT_SHARED = 'plan.benefit.shared',
  BENEFIT_MILESTONE_REACHED = 'plan.benefit.milestone.reached',
  
  // Claim events
  CLAIM_STARTED = 'plan.claim.started',
  CLAIM_SUBMITTED = 'plan.claim.submitted',
  CLAIM_APPROVED = 'plan.claim.approved',
  CLAIM_REJECTED = 'plan.claim.rejected',
  CLAIM_DOCUMENT_UPLOADED = 'plan.claim.document.uploaded',
  
  // Coverage events
  COVERAGE_CHECKED = 'plan.coverage.checked',
  COVERAGE_EXPLAINED = 'plan.coverage.explained',
  COVERAGE_LIMIT_APPROACHING = 'plan.coverage.limit.approaching',
  COVERAGE_RENEWED = 'plan.coverage.renewed',
  
  // Document events
  DOCUMENT_UPLOADED = 'plan.document.uploaded',
  DOCUMENT_VERIFIED = 'plan.document.verified',
  DOCUMENT_SHARED = 'plan.document.shared',
}

/**
 * Cross-journey event types
 * Events that are not specific to a single journey
 */
export enum CrossJourneyEventType {
  // User engagement events
  APP_OPENED = 'app.opened',
  FEATURE_USED = 'feature.used',
  FEEDBACK_PROVIDED = 'feedback.provided',
  SURVEY_COMPLETED = 'survey.completed',
  
  // Social events
  CONTENT_SHARED = 'content.shared',
  ACHIEVEMENT_SHARED = 'achievement.shared',
  REFERRAL_SENT = 'referral.sent',
  REFERRAL_ACCEPTED = 'referral.accepted',
  
  // Onboarding events
  ONBOARDING_STARTED = 'onboarding.started',
  ONBOARDING_STEP_COMPLETED = 'onboarding.step.completed',
  ONBOARDING_COMPLETED = 'onboarding.completed',
  
  // Profile events
  PROFILE_CREATED = 'profile.created',
  PROFILE_UPDATED = 'profile.updated',
  PROFILE_PICTURE_UPDATED = 'profile.picture.updated',
  
  // Notification events
  NOTIFICATION_RECEIVED = 'notification.received',
  NOTIFICATION_OPENED = 'notification.opened',
  NOTIFICATION_SETTINGS_UPDATED = 'notification.settings.updated',
}

/**
 * Union type of all event types
 */
export type EventType = 
  | HealthEventType
  | CareEventType
  | PlanEventType
  | CrossJourneyEventType;

/**
 * Interface for event metadata
 */
export interface EventTypeMetadata {
  type: EventType;
  journey: Journey | 'cross-journey';
  description: string;
  pointValue?: number;
  category: string;
  version: number;
}

/**
 * Event metadata for Health journey events
 */
export const HEALTH_EVENT_METADATA: Record<HealthEventType, EventTypeMetadata> = {
  [HealthEventType.METRIC_RECORDED]: {
    type: HealthEventType.METRIC_RECORDED,
    journey: Journey.HEALTH,
    description: 'User recorded a health metric',
    pointValue: 5,
    category: 'metrics',
    version: 1,
  },
  [HealthEventType.METRIC_GOAL_ACHIEVED]: {
    type: HealthEventType.METRIC_GOAL_ACHIEVED,
    journey: Journey.HEALTH,
    description: 'User achieved a health metric goal',
    pointValue: 20,
    category: 'metrics',
    version: 1,
  },
  [HealthEventType.METRIC_STREAK_CONTINUED]: {
    type: HealthEventType.METRIC_STREAK_CONTINUED,
    journey: Journey.HEALTH,
    description: 'User continued a streak of recording health metrics',
    pointValue: 10,
    category: 'metrics',
    version: 1,
  },
  [HealthEventType.METRIC_STREAK_BROKEN]: {
    type: HealthEventType.METRIC_STREAK_BROKEN,
    journey: Journey.HEALTH,
    description: 'User broke a streak of recording health metrics',
    pointValue: 0,
    category: 'metrics',
    version: 1,
  },
  [HealthEventType.METRIC_MILESTONE_REACHED]: {
    type: HealthEventType.METRIC_MILESTONE_REACHED,
    journey: Journey.HEALTH,
    description: 'User reached a milestone for a health metric',
    pointValue: 25,
    category: 'metrics',
    version: 1,
  },
  [HealthEventType.DEVICE_CONNECTED]: {
    type: HealthEventType.DEVICE_CONNECTED,
    journey: Journey.HEALTH,
    description: 'User connected a health device',
    pointValue: 15,
    category: 'devices',
    version: 1,
  },
  [HealthEventType.DEVICE_SYNCED]: {
    type: HealthEventType.DEVICE_SYNCED,
    journey: Journey.HEALTH,
    description: 'User synced data from a health device',
    pointValue: 5,
    category: 'devices',
    version: 1,
  },
  [HealthEventType.DEVICE_DISCONNECTED]: {
    type: HealthEventType.DEVICE_DISCONNECTED,
    journey: Journey.HEALTH,
    description: 'User disconnected a health device',
    pointValue: 0,
    category: 'devices',
    version: 1,
  },
  [HealthEventType.GOAL_CREATED]: {
    type: HealthEventType.GOAL_CREATED,
    journey: Journey.HEALTH,
    description: 'User created a health goal',
    pointValue: 10,
    category: 'goals',
    version: 1,
  },
  [HealthEventType.GOAL_UPDATED]: {
    type: HealthEventType.GOAL_UPDATED,
    journey: Journey.HEALTH,
    description: 'User updated a health goal',
    pointValue: 5,
    category: 'goals',
    version: 1,
  },
  [HealthEventType.GOAL_COMPLETED]: {
    type: HealthEventType.GOAL_COMPLETED,
    journey: Journey.HEALTH,
    description: 'User completed a health goal',
    pointValue: 30,
    category: 'goals',
    version: 1,
  },
  [HealthEventType.GOAL_ABANDONED]: {
    type: HealthEventType.GOAL_ABANDONED,
    journey: Journey.HEALTH,
    description: 'User abandoned a health goal',
    pointValue: 0,
    category: 'goals',
    version: 1,
  },
  [HealthEventType.INSIGHT_VIEWED]: {
    type: HealthEventType.INSIGHT_VIEWED,
    journey: Journey.HEALTH,
    description: 'User viewed a health insight',
    pointValue: 5,
    category: 'insights',
    version: 1,
  },
  [HealthEventType.INSIGHT_SHARED]: {
    type: HealthEventType.INSIGHT_SHARED,
    journey: Journey.HEALTH,
    description: 'User shared a health insight',
    pointValue: 10,
    category: 'insights',
    version: 1,
  },
  [HealthEventType.INSIGHT_ACTIONED]: {
    type: HealthEventType.INSIGHT_ACTIONED,
    journey: Journey.HEALTH,
    description: 'User took action on a health insight',
    pointValue: 15,
    category: 'insights',
    version: 1,
  },
  [HealthEventType.HEALTH_PROFILE_COMPLETED]: {
    type: HealthEventType.HEALTH_PROFILE_COMPLETED,
    journey: Journey.HEALTH,
    description: 'User completed their health profile',
    pointValue: 25,
    category: 'profile',
    version: 1,
  },
  [HealthEventType.HEALTH_PROFILE_UPDATED]: {
    type: HealthEventType.HEALTH_PROFILE_UPDATED,
    journey: Journey.HEALTH,
    description: 'User updated their health profile',
    pointValue: 10,
    category: 'profile',
    version: 1,
  },
  [HealthEventType.HEALTH_ASSESSMENT_COMPLETED]: {
    type: HealthEventType.HEALTH_ASSESSMENT_COMPLETED,
    journey: Journey.HEALTH,
    description: 'User completed a health assessment',
    pointValue: 30,
    category: 'assessment',
    version: 1,
  },
};

/**
 * Event metadata for Care journey events
 */
export const CARE_EVENT_METADATA: Record<CareEventType, EventTypeMetadata> = {
  [CareEventType.APPOINTMENT_SCHEDULED]: {
    type: CareEventType.APPOINTMENT_SCHEDULED,
    journey: Journey.CARE,
    description: 'User scheduled a medical appointment',
    pointValue: 15,
    category: 'appointments',
    version: 1,
  },
  [CareEventType.APPOINTMENT_RESCHEDULED]: {
    type: CareEventType.APPOINTMENT_RESCHEDULED,
    journey: Journey.CARE,
    description: 'User rescheduled a medical appointment',
    pointValue: 5,
    category: 'appointments',
    version: 1,
  },
  [CareEventType.APPOINTMENT_CANCELLED]: {
    type: CareEventType.APPOINTMENT_CANCELLED,
    journey: Journey.CARE,
    description: 'User cancelled a medical appointment',
    pointValue: 0,
    category: 'appointments',
    version: 1,
  },
  [CareEventType.APPOINTMENT_COMPLETED]: {
    type: CareEventType.APPOINTMENT_COMPLETED,
    journey: Journey.CARE,
    description: 'User completed a medical appointment',
    pointValue: 25,
    category: 'appointments',
    version: 1,
  },
  [CareEventType.APPOINTMENT_REMINDER_ACKNOWLEDGED]: {
    type: CareEventType.APPOINTMENT_REMINDER_ACKNOWLEDGED,
    journey: Journey.CARE,
    description: 'User acknowledged an appointment reminder',
    pointValue: 5,
    category: 'appointments',
    version: 1,
  },
  [CareEventType.MEDICATION_ADDED]: {
    type: CareEventType.MEDICATION_ADDED,
    journey: Journey.CARE,
    description: 'User added a medication to their list',
    pointValue: 10,
    category: 'medications',
    version: 1,
  },
  [CareEventType.MEDICATION_TAKEN]: {
    type: CareEventType.MEDICATION_TAKEN,
    journey: Journey.CARE,
    description: 'User marked a medication as taken',
    pointValue: 5,
    category: 'medications',
    version: 1,
  },
  [CareEventType.MEDICATION_SKIPPED]: {
    type: CareEventType.MEDICATION_SKIPPED,
    journey: Journey.CARE,
    description: 'User marked a medication as skipped',
    pointValue: 0,
    category: 'medications',
    version: 1,
  },
  [CareEventType.MEDICATION_ADHERENCE_STREAK]: {
    type: CareEventType.MEDICATION_ADHERENCE_STREAK,
    journey: Journey.CARE,
    description: 'User maintained a medication adherence streak',
    pointValue: 15,
    category: 'medications',
    version: 1,
  },
  [CareEventType.MEDICATION_REFILL_REQUESTED]: {
    type: CareEventType.MEDICATION_REFILL_REQUESTED,
    journey: Journey.CARE,
    description: 'User requested a medication refill',
    pointValue: 10,
    category: 'medications',
    version: 1,
  },
  [CareEventType.TELEMEDICINE_SESSION_SCHEDULED]: {
    type: CareEventType.TELEMEDICINE_SESSION_SCHEDULED,
    journey: Journey.CARE,
    description: 'User scheduled a telemedicine session',
    pointValue: 15,
    category: 'telemedicine',
    version: 1,
  },
  [CareEventType.TELEMEDICINE_SESSION_STARTED]: {
    type: CareEventType.TELEMEDICINE_SESSION_STARTED,
    journey: Journey.CARE,
    description: 'User started a telemedicine session',
    pointValue: 10,
    category: 'telemedicine',
    version: 1,
  },
  [CareEventType.TELEMEDICINE_SESSION_COMPLETED]: {
    type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    journey: Journey.CARE,
    description: 'User completed a telemedicine session',
    pointValue: 25,
    category: 'telemedicine',
    version: 1,
  },
  [CareEventType.TELEMEDICINE_SESSION_RATED]: {
    type: CareEventType.TELEMEDICINE_SESSION_RATED,
    journey: Journey.CARE,
    description: 'User rated a telemedicine session',
    pointValue: 10,
    category: 'telemedicine',
    version: 1,
  },
  [CareEventType.PROVIDER_ADDED]: {
    type: CareEventType.PROVIDER_ADDED,
    journey: Journey.CARE,
    description: 'User added a healthcare provider to their list',
    pointValue: 10,
    category: 'providers',
    version: 1,
  },
  [CareEventType.PROVIDER_RATED]: {
    type: CareEventType.PROVIDER_RATED,
    journey: Journey.CARE,
    description: 'User rated a healthcare provider',
    pointValue: 10,
    category: 'providers',
    version: 1,
  },
  [CareEventType.PROVIDER_RECOMMENDED]: {
    type: CareEventType.PROVIDER_RECOMMENDED,
    journey: Journey.CARE,
    description: 'User recommended a healthcare provider',
    pointValue: 15,
    category: 'providers',
    version: 1,
  },
  [CareEventType.SYMPTOM_CHECKER_STARTED]: {
    type: CareEventType.SYMPTOM_CHECKER_STARTED,
    journey: Journey.CARE,
    description: 'User started using the symptom checker',
    pointValue: 5,
    category: 'symptoms',
    version: 1,
  },
  [CareEventType.SYMPTOM_CHECKER_COMPLETED]: {
    type: CareEventType.SYMPTOM_CHECKER_COMPLETED,
    journey: Journey.CARE,
    description: 'User completed the symptom checker',
    pointValue: 15,
    category: 'symptoms',
    version: 1,
  },
  [CareEventType.SYMPTOM_LOGGED]: {
    type: CareEventType.SYMPTOM_LOGGED,
    journey: Journey.CARE,
    description: 'User logged a symptom',
    pointValue: 5,
    category: 'symptoms',
    version: 1,
  },
  [CareEventType.TREATMENT_PLAN_CREATED]: {
    type: CareEventType.TREATMENT_PLAN_CREATED,
    journey: Journey.CARE,
    description: 'User created a treatment plan',
    pointValue: 15,
    category: 'treatments',
    version: 1,
  },
  [CareEventType.TREATMENT_PLAN_UPDATED]: {
    type: CareEventType.TREATMENT_PLAN_UPDATED,
    journey: Journey.CARE,
    description: 'User updated a treatment plan',
    pointValue: 5,
    category: 'treatments',
    version: 1,
  },
  [CareEventType.TREATMENT_PLAN_COMPLETED]: {
    type: CareEventType.TREATMENT_PLAN_COMPLETED,
    journey: Journey.CARE,
    description: 'User completed a treatment plan',
    pointValue: 30,
    category: 'treatments',
    version: 1,
  },
  [CareEventType.TREATMENT_STEP_COMPLETED]: {
    type: CareEventType.TREATMENT_STEP_COMPLETED,
    journey: Journey.CARE,
    description: 'User completed a step in a treatment plan',
    pointValue: 10,
    category: 'treatments',
    version: 1,
  },
};

/**
 * Event metadata for Plan journey events
 */
export const PLAN_EVENT_METADATA: Record<PlanEventType, EventTypeMetadata> = {
  [PlanEventType.PLAN_VIEWED]: {
    type: PlanEventType.PLAN_VIEWED,
    journey: Journey.PLAN,
    description: 'User viewed their insurance plan details',
    pointValue: 5,
    category: 'plans',
    version: 1,
  },
  [PlanEventType.PLAN_COMPARED]: {
    type: PlanEventType.PLAN_COMPARED,
    journey: Journey.PLAN,
    description: 'User compared insurance plans',
    pointValue: 10,
    category: 'plans',
    version: 1,
  },
  [PlanEventType.PLAN_SELECTED]: {
    type: PlanEventType.PLAN_SELECTED,
    journey: Journey.PLAN,
    description: 'User selected an insurance plan',
    pointValue: 25,
    category: 'plans',
    version: 1,
  },
  [PlanEventType.PLAN_CHANGED]: {
    type: PlanEventType.PLAN_CHANGED,
    journey: Journey.PLAN,
    description: 'User changed their insurance plan',
    pointValue: 15,
    category: 'plans',
    version: 1,
  },
  [PlanEventType.BENEFIT_VIEWED]: {
    type: PlanEventType.BENEFIT_VIEWED,
    journey: Journey.PLAN,
    description: 'User viewed a benefit detail',
    pointValue: 5,
    category: 'benefits',
    version: 1,
  },
  [PlanEventType.BENEFIT_USED]: {
    type: PlanEventType.BENEFIT_USED,
    journey: Journey.PLAN,
    description: 'User used a plan benefit',
    pointValue: 15,
    category: 'benefits',
    version: 1,
  },
  [PlanEventType.BENEFIT_SHARED]: {
    type: PlanEventType.BENEFIT_SHARED,
    journey: Journey.PLAN,
    description: 'User shared a plan benefit',
    pointValue: 10,
    category: 'benefits',
    version: 1,
  },
  [PlanEventType.BENEFIT_MILESTONE_REACHED]: {
    type: PlanEventType.BENEFIT_MILESTONE_REACHED,
    journey: Journey.PLAN,
    description: 'User reached a benefit usage milestone',
    pointValue: 20,
    category: 'benefits',
    version: 1,
  },
  [PlanEventType.CLAIM_STARTED]: {
    type: PlanEventType.CLAIM_STARTED,
    journey: Journey.PLAN,
    description: 'User started a claim submission',
    pointValue: 10,
    category: 'claims',
    version: 1,
  },
  [PlanEventType.CLAIM_SUBMITTED]: {
    type: PlanEventType.CLAIM_SUBMITTED,
    journey: Journey.PLAN,
    description: 'User submitted a claim',
    pointValue: 20,
    category: 'claims',
    version: 1,
  },
  [PlanEventType.CLAIM_APPROVED]: {
    type: PlanEventType.CLAIM_APPROVED,
    journey: Journey.PLAN,
    description: 'User had a claim approved',
    pointValue: 25,
    category: 'claims',
    version: 1,
  },
  [PlanEventType.CLAIM_REJECTED]: {
    type: PlanEventType.CLAIM_REJECTED,
    journey: Journey.PLAN,
    description: 'User had a claim rejected',
    pointValue: 0,
    category: 'claims',
    version: 1,
  },
  [PlanEventType.CLAIM_DOCUMENT_UPLOADED]: {
    type: PlanEventType.CLAIM_DOCUMENT_UPLOADED,
    journey: Journey.PLAN,
    description: 'User uploaded a document for a claim',
    pointValue: 10,
    category: 'claims',
    version: 1,
  },
  [PlanEventType.COVERAGE_CHECKED]: {
    type: PlanEventType.COVERAGE_CHECKED,
    journey: Journey.PLAN,
    description: 'User checked coverage for a service or procedure',
    pointValue: 5,
    category: 'coverage',
    version: 1,
  },
  [PlanEventType.COVERAGE_EXPLAINED]: {
    type: PlanEventType.COVERAGE_EXPLAINED,
    journey: Journey.PLAN,
    description: 'User viewed coverage explanation',
    pointValue: 10,
    category: 'coverage',
    version: 1,
  },
  [PlanEventType.COVERAGE_LIMIT_APPROACHING]: {
    type: PlanEventType.COVERAGE_LIMIT_APPROACHING,
    journey: Journey.PLAN,
    description: 'User is approaching a coverage limit',
    pointValue: 0,
    category: 'coverage',
    version: 1,
  },
  [PlanEventType.COVERAGE_RENEWED]: {
    type: PlanEventType.COVERAGE_RENEWED,
    journey: Journey.PLAN,
    description: 'User renewed their coverage',
    pointValue: 25,
    category: 'coverage',
    version: 1,
  },
  [PlanEventType.DOCUMENT_UPLOADED]: {
    type: PlanEventType.DOCUMENT_UPLOADED,
    journey: Journey.PLAN,
    description: 'User uploaded a document',
    pointValue: 10,
    category: 'documents',
    version: 1,
  },
  [PlanEventType.DOCUMENT_VERIFIED]: {
    type: PlanEventType.DOCUMENT_VERIFIED,
    journey: Journey.PLAN,
    description: 'User had a document verified',
    pointValue: 15,
    category: 'documents',
    version: 1,
  },
  [PlanEventType.DOCUMENT_SHARED]: {
    type: PlanEventType.DOCUMENT_SHARED,
    journey: Journey.PLAN,
    description: 'User shared a document',
    pointValue: 10,
    category: 'documents',
    version: 1,
  },
};

/**
 * Event metadata for cross-journey events
 */
export const CROSS_JOURNEY_EVENT_METADATA: Record<CrossJourneyEventType, EventTypeMetadata> = {
  [CrossJourneyEventType.APP_OPENED]: {
    type: CrossJourneyEventType.APP_OPENED,
    journey: 'cross-journey',
    description: 'User opened the app',
    pointValue: 5,
    category: 'engagement',
    version: 1,
  },
  [CrossJourneyEventType.FEATURE_USED]: {
    type: CrossJourneyEventType.FEATURE_USED,
    journey: 'cross-journey',
    description: 'User used a feature',
    pointValue: 5,
    category: 'engagement',
    version: 1,
  },
  [CrossJourneyEventType.FEEDBACK_PROVIDED]: {
    type: CrossJourneyEventType.FEEDBACK_PROVIDED,
    journey: 'cross-journey',
    description: 'User provided feedback',
    pointValue: 15,
    category: 'engagement',
    version: 1,
  },
  [CrossJourneyEventType.SURVEY_COMPLETED]: {
    type: CrossJourneyEventType.SURVEY_COMPLETED,
    journey: 'cross-journey',
    description: 'User completed a survey',
    pointValue: 20,
    category: 'engagement',
    version: 1,
  },
  [CrossJourneyEventType.CONTENT_SHARED]: {
    type: CrossJourneyEventType.CONTENT_SHARED,
    journey: 'cross-journey',
    description: 'User shared content',
    pointValue: 10,
    category: 'social',
    version: 1,
  },
  [CrossJourneyEventType.ACHIEVEMENT_SHARED]: {
    type: CrossJourneyEventType.ACHIEVEMENT_SHARED,
    journey: 'cross-journey',
    description: 'User shared an achievement',
    pointValue: 15,
    category: 'social',
    version: 1,
  },
  [CrossJourneyEventType.REFERRAL_SENT]: {
    type: CrossJourneyEventType.REFERRAL_SENT,
    journey: 'cross-journey',
    description: 'User sent a referral',
    pointValue: 20,
    category: 'social',
    version: 1,
  },
  [CrossJourneyEventType.REFERRAL_ACCEPTED]: {
    type: CrossJourneyEventType.REFERRAL_ACCEPTED,
    journey: 'cross-journey',
    description: 'User had a referral accepted',
    pointValue: 30,
    category: 'social',
    version: 1,
  },
  [CrossJourneyEventType.ONBOARDING_STARTED]: {
    type: CrossJourneyEventType.ONBOARDING_STARTED,
    journey: 'cross-journey',
    description: 'User started onboarding',
    pointValue: 5,
    category: 'onboarding',
    version: 1,
  },
  [CrossJourneyEventType.ONBOARDING_STEP_COMPLETED]: {
    type: CrossJourneyEventType.ONBOARDING_STEP_COMPLETED,
    journey: 'cross-journey',
    description: 'User completed an onboarding step',
    pointValue: 10,
    category: 'onboarding',
    version: 1,
  },
  [CrossJourneyEventType.ONBOARDING_COMPLETED]: {
    type: CrossJourneyEventType.ONBOARDING_COMPLETED,
    journey: 'cross-journey',
    description: 'User completed onboarding',
    pointValue: 30,
    category: 'onboarding',
    version: 1,
  },
  [CrossJourneyEventType.PROFILE_CREATED]: {
    type: CrossJourneyEventType.PROFILE_CREATED,
    journey: 'cross-journey',
    description: 'User created their profile',
    pointValue: 20,
    category: 'profile',
    version: 1,
  },
  [CrossJourneyEventType.PROFILE_UPDATED]: {
    type: CrossJourneyEventType.PROFILE_UPDATED,
    journey: 'cross-journey',
    description: 'User updated their profile',
    pointValue: 10,
    category: 'profile',
    version: 1,
  },
  [CrossJourneyEventType.PROFILE_PICTURE_UPDATED]: {
    type: CrossJourneyEventType.PROFILE_PICTURE_UPDATED,
    journey: 'cross-journey',
    description: 'User updated their profile picture',
    pointValue: 15,
    category: 'profile',
    version: 1,
  },
  [CrossJourneyEventType.NOTIFICATION_RECEIVED]: {
    type: CrossJourneyEventType.NOTIFICATION_RECEIVED,
    journey: 'cross-journey',
    description: 'User received a notification',
    pointValue: 0,
    category: 'notifications',
    version: 1,
  },
  [CrossJourneyEventType.NOTIFICATION_OPENED]: {
    type: CrossJourneyEventType.NOTIFICATION_OPENED,
    journey: 'cross-journey',
    description: 'User opened a notification',
    pointValue: 5,
    category: 'notifications',
    version: 1,
  },
  [CrossJourneyEventType.NOTIFICATION_SETTINGS_UPDATED]: {
    type: CrossJourneyEventType.NOTIFICATION_SETTINGS_UPDATED,
    journey: 'cross-journey',
    description: 'User updated notification settings',
    pointValue: 5,
    category: 'notifications',
    version: 1,
  },
};

/**
 * Combined event metadata from all journeys
 */
export const EVENT_METADATA: Record<EventType, EventTypeMetadata> = {
  ...HEALTH_EVENT_METADATA,
  ...CARE_EVENT_METADATA,
  ...PLAN_EVENT_METADATA,
  ...CROSS_JOURNEY_EVENT_METADATA,
};

/**
 * Get all event types for a specific journey
 * @param journey The journey to get event types for
 * @returns Array of event types for the specified journey
 */
export function getEventTypesByJourney(journey: Journey | 'cross-journey'): EventType[] {
  return Object.values(EVENT_METADATA)
    .filter(metadata => metadata.journey === journey)
    .map(metadata => metadata.type);
}

/**
 * Get all event types for a specific category
 * @param category The category to get event types for
 * @returns Array of event types for the specified category
 */
export function getEventTypesByCategory(category: string): EventType[] {
  return Object.values(EVENT_METADATA)
    .filter(metadata => metadata.category === category)
    .map(metadata => metadata.type);
}

/**
 * Check if an event type belongs to a specific journey
 * @param eventType The event type to check
 * @param journey The journey to check against
 * @returns True if the event type belongs to the specified journey
 */
export function isEventTypeFromJourney(eventType: EventType, journey: Journey | 'cross-journey'): boolean {
  return EVENT_METADATA[eventType]?.journey === journey;
}

/**
 * Get the point value for an event type
 * @param eventType The event type to get the point value for
 * @returns The point value for the event type, or 0 if not found
 */
export function getPointValueForEventType(eventType: EventType): number {
  return EVENT_METADATA[eventType]?.pointValue || 0;
}

/**
 * Get the metadata for an event type
 * @param eventType The event type to get metadata for
 * @returns The metadata for the event type, or undefined if not found
 */
export function getEventTypeMetadata(eventType: EventType): EventTypeMetadata | undefined {
  return EVENT_METADATA[eventType];
}

/**
 * Validate if an event type is valid
 * @param eventType The event type to validate
 * @returns True if the event type is valid
 */
export function isValidEventType(eventType: string): eventType is EventType {
  return eventType in EVENT_METADATA;
}