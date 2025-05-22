/**
 * @file Defines TypeScript interfaces for the gamification event system.
 * 
 * This file provides standardized interfaces for events that trigger gamification
 * rules, achievements, and rewards across all journeys in the AUSTA SuperApp.
 * These interfaces ensure consistent event processing throughout the gamification
 * pipeline, enabling reliable rule evaluation, achievement unlocking, and point awarding.
 */

/**
 * Enum defining all supported event types in the gamification system.
 * 
 * These event types are used to categorize and route events to appropriate
 * handlers in the gamification engine. Each event type corresponds to a specific
 * user action or system event that may trigger gamification rules.
 */
export enum EventType {
  // Health Journey Events
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  HEALTH_GOAL_UPDATED = 'HEALTH_GOAL_UPDATED',
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  HEALTH_GOAL_STREAK_MAINTAINED = 'HEALTH_GOAL_STREAK_MAINTAINED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  MEDICAL_EVENT_RECORDED = 'MEDICAL_EVENT_RECORDED',
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',
  HEALTH_ASSESSMENT_COMPLETED = 'HEALTH_ASSESSMENT_COMPLETED',
  
  // Care Journey Events
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_ATTENDED = 'APPOINTMENT_ATTENDED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_ADHERENCE_STREAK = 'MEDICATION_ADHERENCE_STREAK',
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  TREATMENT_PLAN_CREATED = 'TREATMENT_PLAN_CREATED',
  TREATMENT_PLAN_PROGRESS = 'TREATMENT_PLAN_PROGRESS',
  TREATMENT_PLAN_COMPLETED = 'TREATMENT_PLAN_COMPLETED',
  SYMPTOM_CHECKER_USED = 'SYMPTOM_CHECKER_USED',
  PROVIDER_RATED = 'PROVIDER_RATED',
  
  // Plan Journey Events
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_DOCUMENT_UPLOADED = 'CLAIM_DOCUMENT_UPLOADED',
  BENEFIT_UTILIZED = 'BENEFIT_UTILIZED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  PLAN_COMPARED = 'PLAN_COMPARED',
  PLAN_RENEWED = 'PLAN_RENEWED',
  COVERAGE_REVIEWED = 'COVERAGE_REVIEWED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  
  // Cross-Journey Events
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  FEEDBACK_PROVIDED = 'FEEDBACK_PROVIDED',
  SURVEY_COMPLETED = 'SURVEY_COMPLETED',
  APP_FEATURE_USED = 'APP_FEATURE_USED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  LEVEL_UP = 'LEVEL_UP',
  XP_EARNED = 'XP_EARNED',
  DAILY_LOGIN = 'DAILY_LOGIN',
  WEEKLY_ACTIVE = 'WEEKLY_ACTIVE',
  MONTHLY_ACTIVE = 'MONTHLY_ACTIVE',
  REFERRAL_SENT = 'REFERRAL_SENT',
  REFERRAL_COMPLETED = 'REFERRAL_COMPLETED'
}

/**
 * Enum defining the source journeys for gamification events.
 */
export enum EventJourney {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  CROSS_JOURNEY = 'cross-journey'
}

/**
 * Interface for event versioning to support backward compatibility.
 * 
 * As event schemas evolve over time, versioning ensures that older event
 * formats can still be processed by newer versions of the system.
 */
export interface EventVersion {
  /** Major version for breaking changes */
  major: number;
  /** Minor version for backward-compatible additions */
  minor: number;
  /** Patch version for backward-compatible fixes */
  patch: number;
}

/**
 * Base interface for all gamification event payloads.
 * 
 * This provides common properties that all event payloads must include,
 * regardless of their specific event type.
 */
export interface BaseEventPayload {
  /** Timestamp when the event occurred */
  timestamp: string;
  /** Additional metadata for the event */
  metadata?: Record<string, any>;
}

// Health Journey Event Payloads

/**
 * Payload for HEALTH_METRIC_RECORDED events.
 */
export interface HealthMetricRecordedPayload extends BaseEventPayload {
  /** Type of health metric recorded */
  metricType: string;
  /** Value of the health metric */
  value: number;
  /** Unit of measurement for the health metric */
  unit: string;
  /** Source of the health metric (manual, device, etc.) */
  source: string;
  /** Whether the metric is within healthy range */
  isWithinHealthyRange?: boolean;
}

/**
 * Payload for HEALTH_GOAL_CREATED and HEALTH_GOAL_UPDATED events.
 */
export interface HealthGoalPayload extends BaseEventPayload {
  /** ID of the health goal */
  goalId: string;
  /** Type of health goal */
  goalType: string;
  /** Target value for the health goal */
  targetValue: number;
  /** Unit of measurement for the health goal */
  unit: string;
  /** Period for recurring goals (daily, weekly, etc.) */
  period?: string;
}

/**
 * Payload for HEALTH_GOAL_ACHIEVED events.
 */
export interface HealthGoalAchievedPayload extends HealthGoalPayload {
  /** Percentage of goal completion */
  completionPercentage: number;
  /** Whether this is the first time achieving this goal */
  isFirstTimeAchievement: boolean;
}

/**
 * Payload for HEALTH_GOAL_STREAK_MAINTAINED events.
 */
export interface HealthGoalStreakPayload extends BaseEventPayload {
  /** ID of the health goal */
  goalId: string;
  /** Current streak count */
  streakCount: number;
  /** Type of health goal */
  goalType: string;
}

/**
 * Payload for DEVICE_CONNECTED and DEVICE_SYNCED events.
 */
export interface DeviceEventPayload extends BaseEventPayload {
  /** ID of the device */
  deviceId: string;
  /** Type of device */
  deviceType: string;
  /** Manufacturer of the device */
  manufacturer: string;
  /** Number of metrics synced (for DEVICE_SYNCED) */
  metricCount?: number;
}

// Care Journey Event Payloads

/**
 * Payload for APPOINTMENT_BOOKED, APPOINTMENT_ATTENDED, and APPOINTMENT_CANCELLED events.
 */
export interface AppointmentEventPayload extends BaseEventPayload {
  /** ID of the appointment */
  appointmentId: string;
  /** Type of appointment */
  appointmentType: string;
  /** ID of the provider */
  providerId: string;
  /** Whether this is the first appointment with this provider */
  isFirstAppointment?: boolean;
  /** Reason for cancellation (for APPOINTMENT_CANCELLED) */
  cancellationReason?: string;
}

/**
 * Payload for MEDICATION_ADDED, MEDICATION_TAKEN, and MEDICATION_ADHERENCE_STREAK events.
 */
export interface MedicationEventPayload extends BaseEventPayload {
  /** ID of the medication */
  medicationId: string;
  /** Name of the medication */
  medicationName: string;
  /** Current streak count (for MEDICATION_ADHERENCE_STREAK) */
  streakCount?: number;
  /** Whether the medication was taken on time */
  takenOnTime?: boolean;
}

/**
 * Payload for TELEMEDICINE_SESSION_STARTED and TELEMEDICINE_SESSION_COMPLETED events.
 */
export interface TelemedicineEventPayload extends BaseEventPayload {
  /** ID of the telemedicine session */
  sessionId: string;
  /** ID of the provider */
  providerId: string;
  /** Duration of the session in minutes (for TELEMEDICINE_SESSION_COMPLETED) */
  durationMinutes?: number;
  /** Whether this is the first telemedicine session for the user */
  isFirstSession?: boolean;
}

/**
 * Payload for TREATMENT_PLAN_CREATED, TREATMENT_PLAN_PROGRESS, and TREATMENT_PLAN_COMPLETED events.
 */
export interface TreatmentPlanEventPayload extends BaseEventPayload {
  /** ID of the treatment plan */
  planId: string;
  /** Type of treatment plan */
  planType: string;
  /** Progress percentage (for TREATMENT_PLAN_PROGRESS) */
  progressPercentage?: number;
  /** Whether the plan was completed on schedule (for TREATMENT_PLAN_COMPLETED) */
  completedOnSchedule?: boolean;
}

// Plan Journey Event Payloads

/**
 * Payload for CLAIM_SUBMITTED, CLAIM_APPROVED, and CLAIM_DOCUMENT_UPLOADED events.
 */
export interface ClaimEventPayload extends BaseEventPayload {
  /** ID of the claim */
  claimId: string;
  /** Type of claim */
  claimType: string;
  /** Amount of the claim */
  amount?: number;
  /** Number of documents uploaded (for CLAIM_DOCUMENT_UPLOADED) */
  documentCount?: number;
}

/**
 * Payload for BENEFIT_UTILIZED events.
 */
export interface BenefitUtilizedPayload extends BaseEventPayload {
  /** ID of the benefit */
  benefitId: string;
  /** Type of benefit */
  benefitType: string;
  /** Value of the benefit utilized */
  value?: number;
}

/**
 * Payload for PLAN_SELECTED, PLAN_COMPARED, and PLAN_RENEWED events.
 */
export interface PlanEventPayload extends BaseEventPayload {
  /** ID of the plan */
  planId: string;
  /** Type of plan */
  planType: string;
  /** IDs of compared plans (for PLAN_COMPARED) */
  comparedPlanIds?: string[];
  /** Whether this is a plan upgrade (for PLAN_SELECTED and PLAN_RENEWED) */
  isUpgrade?: boolean;
}

// Cross-Journey Event Payloads

/**
 * Payload for ACHIEVEMENT_UNLOCKED events.
 */
export interface AchievementUnlockedPayload extends BaseEventPayload {
  /** ID of the achievement */
  achievementId: string;
  /** Title of the achievement */
  achievementTitle: string;
  /** Description of the achievement */
  achievementDescription: string;
  /** XP earned from the achievement */
  xpEarned: number;
  /** Related journey for the achievement */
  relatedJourney?: EventJourney;
}

/**
 * Payload for QUEST_COMPLETED events.
 */
export interface QuestCompletedPayload extends BaseEventPayload {
  /** ID of the quest */
  questId: string;
  /** Title of the quest */
  questTitle: string;
  /** XP earned from the quest */
  xpEarned: number;
  /** Rewards earned from the quest */
  rewards?: Array<{
    rewardId: string;
    rewardType: string;
    rewardValue: number;
  }>;
}

/**
 * Payload for XP_EARNED events.
 */
export interface XpEarnedPayload extends BaseEventPayload {
  /** Amount of XP earned */
  amount: number;
  /** Source of the XP */
  source: string;
  /** Description of how the XP was earned */
  description: string;
  /** Related journey for the XP */
  relatedJourney?: EventJourney;
}

/**
 * Payload for LEVEL_UP events.
 */
export interface LevelUpPayload extends BaseEventPayload {
  /** New level achieved */
  newLevel: number;
  /** Previous level */
  previousLevel: number;
  /** Total XP at new level */
  totalXp: number;
  /** Rewards unlocked at this level */
  unlockedRewards?: Array<{
    rewardId: string;
    rewardType: string;
    rewardDescription: string;
  }>;
}

/**
 * Union type for all possible event payloads.
 */
export type EventPayload =
  | HealthMetricRecordedPayload
  | HealthGoalPayload
  | HealthGoalAchievedPayload
  | HealthGoalStreakPayload
  | DeviceEventPayload
  | AppointmentEventPayload
  | MedicationEventPayload
  | TelemedicineEventPayload
  | TreatmentPlanEventPayload
  | ClaimEventPayload
  | BenefitUtilizedPayload
  | PlanEventPayload
  | AchievementUnlockedPayload
  | QuestCompletedPayload
  | XpEarnedPayload
  | LevelUpPayload
  | Record<string, any>; // Fallback for custom events

/**
 * Main interface for gamification events.
 * 
 * This interface standardizes the structure of events that trigger
 * gamification rules, achievements, and rewards across all journeys.
 * It ensures consistent event processing throughout the gamification pipeline.
 */
export interface GamificationEvent {
  /** Unique identifier for the event */
  eventId: string;
  
  /** Type of the event */
  type: EventType;
  
  /** ID of the user associated with the event */
  userId: string;
  
  /** Journey associated with the event */
  journey: EventJourney;
  
  /** Payload containing event-specific data */
  payload: EventPayload;
  
  /** Version information for backward compatibility */
  version: EventVersion;
  
  /** Timestamp when the event was created */
  createdAt: string;
  
  /** Source system or service that generated the event */
  source: string;
  
  /** Optional correlation ID for tracing related events */
  correlationId?: string;
}

/**
 * Interface for processing gamification events.
 * 
 * This is used for receiving events from various journeys and
 * processing them in the gamification engine.
 */
export interface ProcessGamificationEventDto {
  /** Type of the event */
  type: EventType | string;
  
  /** ID of the user associated with the event */
  userId: string;
  
  /** Data associated with the event */
  data: Record<string, any>;
  
  /** Journey associated with the event */
  journey?: EventJourney | string;
  
  /** Version information for backward compatibility */
  version?: EventVersion | {
    major: number;
    minor: number;
    patch: number;
  };
  
  /** Source system or service that generated the event */
  source?: string;
  
  /** Optional correlation ID for tracing related events */
  correlationId?: string;
}

/**
 * Interface for event processing results.
 */
export interface EventProcessingResult {
  /** Whether the event was processed successfully */
  success: boolean;
  
  /** Error message if processing failed */
  error?: string;
  
  /** Error code if processing failed */
  errorCode?: string;
  
  /** Results of processing the event */
  results?: {
    /** XP earned from the event */
    xpEarned?: number;
    
    /** Achievements unlocked by the event */
    achievementsUnlocked?: Array<{
      achievementId: string;
      achievementTitle: string;
      xpEarned: number;
    }>;
    
    /** Quests progressed by the event */
    questsProgressed?: Array<{
      questId: string;
      questTitle: string;
      progressPercentage: number;
      isCompleted: boolean;
    }>;
    
    /** Level up information if the event caused a level up */
    levelUp?: {
      newLevel: number;
      previousLevel: number;
    };
  };
}