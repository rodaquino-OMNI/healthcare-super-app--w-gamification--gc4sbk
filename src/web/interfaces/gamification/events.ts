/**
 * @file Defines TypeScript interfaces for the gamification event system that processes user activities across all journeys.
 * These interfaces ensure type safety for the event-driven architecture that powers the gamification features.
 */

/**
 * Enum representing all possible gamification event types across the platform.
 * These events trigger rules, achievements, quests, and rewards in the gamification engine.
 */
export enum GamificationEventType {
  // Health Journey Events
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  HEALTH_GOAL_COMPLETED = 'HEALTH_GOAL_COMPLETED',
  HEALTH_GOAL_PROGRESS = 'HEALTH_GOAL_PROGRESS',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  HEALTH_INSIGHT_VIEWED = 'HEALTH_INSIGHT_VIEWED',
  HEALTH_REPORT_GENERATED = 'HEALTH_REPORT_GENERATED',
  
  // Care Journey Events
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  SYMPTOM_CHECKED = 'SYMPTOM_CHECKED',
  PROVIDER_RATED = 'PROVIDER_RATED',
  
  // Plan Journey Events
  PLAN_VIEWED = 'PLAN_VIEWED',
  BENEFIT_EXPLORED = 'BENEFIT_EXPLORED',
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  COVERAGE_CHECKED = 'COVERAGE_CHECKED',
  
  // Gamification System Events
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  QUEST_STARTED = 'QUEST_STARTED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  REWARD_EARNED = 'REWARD_EARNED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  LEVEL_UP = 'LEVEL_UP',
  XP_EARNED = 'XP_EARNED',
  
  // General App Events
  APP_OPENED = 'APP_OPENED',
  FEATURE_USED = 'FEATURE_USED',
  JOURNEY_SWITCHED = 'JOURNEY_SWITCHED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  FEEDBACK_PROVIDED = 'FEEDBACK_PROVIDED'
}

/**
 * Base interface for all gamification events.
 * Contains common properties that every event must include.
 */
export interface BaseGamificationEvent {
  /** The type of event that occurred */
  type: GamificationEventType;
  
  /** Unique identifier for the user who triggered the event */
  userId: string;
  
  /** Timestamp when the event occurred (ISO string format) */
  timestamp: string;
  
  /** Which journey the event belongs to (health, care, plan, or system) */
  journey: 'health' | 'care' | 'plan' | 'system';
  
  /** Optional correlation ID for tracking related events */
  correlationId?: string;
  
  /** Optional client information (device, platform, app version) */
  client?: {
    deviceId?: string;
    platform?: 'ios' | 'android' | 'web';
    version?: string;
  };
}

/**
 * Interface for achievement-related events.
 */
export interface AchievementEvent extends BaseGamificationEvent {
  type: GamificationEventType.ACHIEVEMENT_UNLOCKED;
  payload: {
    /** ID of the achievement that was unlocked */
    achievementId: string;
    /** Title of the achievement */
    title: string;
    /** XP earned from unlocking this achievement */
    xpEarned: number;
  };
}

/**
 * Interface for quest-related events.
 */
export interface QuestEvent extends BaseGamificationEvent {
  type: GamificationEventType.QUEST_STARTED | GamificationEventType.QUEST_COMPLETED;
  payload: {
    /** ID of the quest */
    questId: string;
    /** Title of the quest */
    title: string;
    /** Current progress value (for QUEST_STARTED events) */
    progress?: number;
    /** XP earned (for QUEST_COMPLETED events) */
    xpEarned?: number;
  };
}

/**
 * Interface for reward-related events.
 */
export interface RewardEvent extends BaseGamificationEvent {
  type: GamificationEventType.REWARD_EARNED | GamificationEventType.REWARD_REDEEMED;
  payload: {
    /** ID of the reward */
    rewardId: string;
    /** Title of the reward */
    title: string;
    /** XP value of the reward */
    xpValue: number;
  };
}

/**
 * Interface for level-up events.
 */
export interface LevelUpEvent extends BaseGamificationEvent {
  type: GamificationEventType.LEVEL_UP;
  payload: {
    /** New level achieved */
    newLevel: number;
    /** Previous level */
    previousLevel: number;
    /** Total XP at this level */
    totalXp: number;
    /** XP needed for next level */
    nextLevelXp: number;
  };
}

/**
 * Interface for XP earned events.
 */
export interface XpEarnedEvent extends BaseGamificationEvent {
  type: GamificationEventType.XP_EARNED;
  payload: {
    /** Amount of XP earned */
    amount: number;
    /** Reason XP was earned */
    reason: string;
    /** Source of the XP (which action or feature) */
    source: string;
  };
}

/**
 * Interface for health journey specific events.
 */
export interface HealthJourneyEvent extends BaseGamificationEvent {
  journey: 'health';
  type: GamificationEventType.HEALTH_METRIC_RECORDED | 
        GamificationEventType.HEALTH_GOAL_CREATED | 
        GamificationEventType.HEALTH_GOAL_COMPLETED | 
        GamificationEventType.HEALTH_GOAL_PROGRESS | 
        GamificationEventType.DEVICE_CONNECTED | 
        GamificationEventType.HEALTH_INSIGHT_VIEWED | 
        GamificationEventType.HEALTH_REPORT_GENERATED;
  payload: HealthEventPayload;
}

/**
 * Interface for care journey specific events.
 */
export interface CareJourneyEvent extends BaseGamificationEvent {
  journey: 'care';
  type: GamificationEventType.APPOINTMENT_BOOKED | 
        GamificationEventType.APPOINTMENT_COMPLETED | 
        GamificationEventType.MEDICATION_ADDED | 
        GamificationEventType.MEDICATION_TAKEN | 
        GamificationEventType.TELEMEDICINE_SESSION_STARTED | 
        GamificationEventType.TELEMEDICINE_SESSION_COMPLETED | 
        GamificationEventType.SYMPTOM_CHECKED | 
        GamificationEventType.PROVIDER_RATED;
  payload: CareEventPayload;
}

/**
 * Interface for plan journey specific events.
 */
export interface PlanJourneyEvent extends BaseGamificationEvent {
  journey: 'plan';
  type: GamificationEventType.PLAN_VIEWED | 
        GamificationEventType.BENEFIT_EXPLORED | 
        GamificationEventType.CLAIM_SUBMITTED | 
        GamificationEventType.CLAIM_APPROVED | 
        GamificationEventType.DOCUMENT_UPLOADED | 
        GamificationEventType.COVERAGE_CHECKED;
  payload: PlanEventPayload;
}

/**
 * Union type for all possible gamification events.
 */
export type GamificationEvent = 
  | AchievementEvent 
  | QuestEvent 
  | RewardEvent 
  | LevelUpEvent 
  | XpEarnedEvent 
  | HealthJourneyEvent 
  | CareJourneyEvent 
  | PlanJourneyEvent;

/**
 * Payload interface for health journey events.
 */
export type HealthEventPayload = 
  | HealthMetricPayload 
  | HealthGoalPayload 
  | DevicePayload 
  | HealthInsightPayload;

/**
 * Payload for health metric recorded events.
 */
export interface HealthMetricPayload {
  /** Type of health metric (steps, weight, heart_rate, etc.) */
  metricType: string;
  /** Value of the recorded metric */
  value: number;
  /** Unit of measurement (kg, bpm, steps, etc.) */
  unit: string;
  /** Optional source of the metric (manual, device, integration) */
  source?: string;
}

/**
 * Payload for health goal events.
 */
export interface HealthGoalPayload {
  /** ID of the health goal */
  goalId: string;
  /** Type of goal (steps, weight, activity, etc.) */
  goalType: string;
  /** Target value for the goal */
  targetValue?: number;
  /** Current progress value */
  currentValue?: number;
  /** Percentage of completion (0-100) */
  progressPercentage?: number;
}

/**
 * Payload for device connection events.
 */
export interface DevicePayload {
  /** ID of the connected device */
  deviceId: string;
  /** Type of device (fitness_tracker, scale, blood_pressure, etc.) */
  deviceType: string;
  /** Manufacturer of the device */
  manufacturer: string;
  /** Model name/number of the device */
  model: string;
}

/**
 * Payload for health insight events.
 */
export interface HealthInsightPayload {
  /** ID of the insight */
  insightId: string;
  /** Type of insight (trend, recommendation, alert) */
  insightType: string;
  /** Category of the insight (activity, sleep, nutrition, etc.) */
  category: string;
  /** Importance level of the insight (low, medium, high) */
  importance?: 'low' | 'medium' | 'high';
}

/**
 * Payload interface for care journey events.
 */
export type CareEventPayload = 
  | AppointmentPayload 
  | MedicationPayload 
  | TelemedicinePayload 
  | SymptomCheckerPayload;

/**
 * Payload for appointment events.
 */
export interface AppointmentPayload {
  /** ID of the appointment */
  appointmentId: string;
  /** Type of appointment (checkup, specialist, dental, etc.) */
  appointmentType: string;
  /** ID of the healthcare provider */
  providerId?: string;
  /** Name of the healthcare provider */
  providerName?: string;
  /** Scheduled date and time of the appointment */
  scheduledAt?: string;
  /** Duration of the appointment in minutes */
  durationMinutes?: number;
}

/**
 * Payload for medication events.
 */
export interface MedicationPayload {
  /** ID of the medication */
  medicationId: string;
  /** Name of the medication */
  medicationName: string;
  /** Dosage information */
  dosage?: string;
  /** Frequency of medication (daily, twice_daily, etc.) */
  frequency?: string;
  /** Time the medication was taken (for MEDICATION_TAKEN events) */
  takenAt?: string;
}

/**
 * Payload for telemedicine events.
 */
export interface TelemedicinePayload {
  /** ID of the telemedicine session */
  sessionId: string;
  /** ID of the healthcare provider */
  providerId: string;
  /** Name of the healthcare provider */
  providerName: string;
  /** Duration of the session in minutes */
  durationMinutes?: number;
  /** Quality rating of the session (1-5) */
  qualityRating?: number;
}

/**
 * Payload for symptom checker events.
 */
export interface SymptomCheckerPayload {
  /** List of symptoms checked */
  symptoms: string[];
  /** Severity level reported (mild, moderate, severe) */
  severityLevel?: 'mild' | 'moderate' | 'severe';
  /** Duration of symptoms (hours, days, weeks) */
  duration?: string;
  /** Recommendation provided by the system */
  recommendation?: string;
}

/**
 * Payload interface for plan journey events.
 */
export type PlanEventPayload = 
  | PlanViewPayload 
  | BenefitPayload 
  | ClaimPayload 
  | DocumentPayload;

/**
 * Payload for plan view events.
 */
export interface PlanViewPayload {
  /** ID of the insurance plan */
  planId: string;
  /** Name of the insurance plan */
  planName: string;
  /** Type of plan (health, dental, vision, etc.) */
  planType: string;
  /** Coverage period of the plan */
  coveragePeriod?: string;
}

/**
 * Payload for benefit exploration events.
 */
export interface BenefitPayload {
  /** ID of the benefit */
  benefitId: string;
  /** Name of the benefit */
  benefitName: string;
  /** Category of the benefit */
  category: string;
  /** Coverage details of the benefit */
  coverageDetails?: string;
}

/**
 * Payload for claim events.
 */
export interface ClaimPayload {
  /** ID of the claim */
  claimId: string;
  /** Type of claim (medical, dental, vision, etc.) */
  claimType: string;
  /** Amount of the claim */
  amount?: number;
  /** Status of the claim (submitted, in_review, approved, denied) */
  status?: 'submitted' | 'in_review' | 'approved' | 'denied';
  /** Date of service */
  serviceDate?: string;
}

/**
 * Payload for document events.
 */
export interface DocumentPayload {
  /** ID of the document */
  documentId: string;
  /** Type of document (claim, prescription, report, etc.) */
  documentType: string;
  /** Name of the document */
  documentName: string;
  /** Size of the document in bytes */
  sizeBytes?: number;
}

/**
 * Interface for event processing response.
 */
export interface EventProcessingResponse {
  /** Whether the event was successfully processed */
  success: boolean;
  /** Optional error message if processing failed */
  error?: string;
  /** Results of processing the event */
  results?: {
    /** XP earned from this event */
    xpEarned?: number;
    /** Achievements unlocked by this event */
    achievementsUnlocked?: Array<{
      id: string;
      title: string;
      description: string;
      xpValue: number;
    }>;
    /** Quests progressed by this event */
    questsProgressed?: Array<{
      id: string;
      title: string;
      progress: number;
      total: number;
      completed: boolean;
    }>;
    /** Rewards earned from this event */
    rewardsEarned?: Array<{
      id: string;
      title: string;
      description: string;
      xpValue: number;
    }>;
    /** Whether the user leveled up from this event */
    leveledUp?: {
      newLevel: number;
      previousLevel: number;
    };
  };
}