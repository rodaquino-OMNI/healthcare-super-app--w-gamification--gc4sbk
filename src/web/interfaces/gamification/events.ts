/**
 * @file events.ts
 * @description Defines TypeScript interfaces for the gamification event system that processes
 * user activities across all journeys. These interfaces ensure type safety for the
 * event-driven architecture that powers gamification features across both web and mobile applications.
 */

/**
 * Enum representing all possible gamification event types.
 * Used to categorize events for processing by the gamification engine.
 */
export enum GamificationEventType {
  // Achievement related events
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  ACHIEVEMENT_PROGRESS = 'ACHIEVEMENT_PROGRESS',
  
  // Quest related events
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  QUEST_PROGRESS = 'QUEST_PROGRESS',
  QUEST_STARTED = 'QUEST_STARTED',
  
  // Reward related events
  REWARD_EARNED = 'REWARD_EARNED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  
  // XP and level related events
  XP_EARNED = 'XP_EARNED',
  LEVEL_UP = 'LEVEL_UP',
  
  // Health journey specific events
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  
  // Care journey specific events
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  CARE_PLAN_PROGRESS = 'CARE_PLAN_PROGRESS',
  
  // Plan journey specific events
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  BENEFIT_UTILIZED = 'BENEFIT_UTILIZED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  
  // System events
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  DAILY_STREAK = 'DAILY_STREAK'
}

/**
 * Enum representing the journey context for an event.
 * Used to categorize events by which journey they belong to.
 */
export enum JourneyType {
  HEALTH = 'HEALTH',
  CARE = 'CARE',
  PLAN = 'PLAN',
  SYSTEM = 'SYSTEM' // For cross-journey or system-level events
}

/**
 * Base interface for all gamification events.
 * Contains common properties that all events must include.
 */
export interface BaseGamificationEvent {
  /** Unique identifier for the event */
  id: string;
  
  /** Type of the event from GamificationEventType enum */
  type: GamificationEventType;
  
  /** Which journey this event belongs to */
  journey: JourneyType;
  
  /** User ID of the user who triggered the event */
  userId: string;
  
  /** Timestamp when the event occurred */
  timestamp: string;
  
  /** Optional metadata for additional context */
  metadata?: Record<string, any>;
  
  /** Event payload containing event-specific data */
  payload: any; // This will be overridden by specific event interfaces
}

/**
 * Interface for achievement-related events.
 */
export interface AchievementEvent extends BaseGamificationEvent {
  type: GamificationEventType.ACHIEVEMENT_UNLOCKED | GamificationEventType.ACHIEVEMENT_PROGRESS;
  payload: {
    /** ID of the achievement */
    achievementId: string;
    /** Title of the achievement */
    title: string;
    /** Current progress value (for ACHIEVEMENT_PROGRESS) */
    progress?: number;
    /** Total progress needed (for ACHIEVEMENT_PROGRESS) */
    total?: number;
    /** Whether the achievement is unlocked (for ACHIEVEMENT_UNLOCKED) */
    unlocked?: boolean;
  };
}

/**
 * Interface for quest-related events.
 */
export interface QuestEvent extends BaseGamificationEvent {
  type: GamificationEventType.QUEST_COMPLETED | GamificationEventType.QUEST_PROGRESS | GamificationEventType.QUEST_STARTED;
  payload: {
    /** ID of the quest */
    questId: string;
    /** Title of the quest */
    title: string;
    /** Current progress value (for QUEST_PROGRESS) */
    progress?: number;
    /** Total progress needed (for QUEST_PROGRESS) */
    total?: number;
    /** Whether the quest is completed (for QUEST_COMPLETED) */
    completed?: boolean;
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
    /** XP value of the reward (for REWARD_EARNED) */
    xp?: number;
    /** Redemption details (for REWARD_REDEEMED) */
    redemption?: {
      /** When the reward was redeemed */
      redeemedAt: string;
      /** Any additional redemption details */
      details?: Record<string, any>;
    };
  };
}

/**
 * Interface for XP and level-related events.
 */
export interface ProgressEvent extends BaseGamificationEvent {
  type: GamificationEventType.XP_EARNED | GamificationEventType.LEVEL_UP;
  payload: {
    /** Amount of XP earned (for XP_EARNED) */
    xpAmount?: number;
    /** Source of the XP (for XP_EARNED) */
    source?: string;
    /** New level achieved (for LEVEL_UP) */
    newLevel?: number;
    /** Previous level (for LEVEL_UP) */
    previousLevel?: number;
    /** Rewards unlocked with the new level (for LEVEL_UP) */
    unlockedRewards?: Array<{
      rewardId: string;
      title: string;
    }>;
  };
}

/**
 * Interface for Health journey specific events.
 */
export interface HealthEvent extends BaseGamificationEvent {
  journey: JourneyType.HEALTH;
  type: GamificationEventType.HEALTH_METRIC_RECORDED | 
        GamificationEventType.HEALTH_GOAL_ACHIEVED | 
        GamificationEventType.HEALTH_INSIGHT_GENERATED | 
        GamificationEventType.DEVICE_SYNCED;
  payload: HealthEventPayload;
}

/**
 * Union type for all possible Health event payloads.
 */
export type HealthEventPayload = 
  HealthMetricPayload | 
  HealthGoalPayload | 
  HealthInsightPayload | 
  DeviceSyncPayload;

/**
 * Payload for health metric recording events.
 */
export interface HealthMetricPayload {
  /** Type of health metric (steps, weight, heart_rate, etc.) */
  metricType: string;
  /** Value of the recorded metric */
  value: number;
  /** Unit of measurement (steps, kg, bpm, etc.) */
  unit: string;
  /** When the metric was recorded */
  recordedAt: string;
  /** Source of the metric (manual, device, etc.) */
  source?: string;
}

/**
 * Payload for health goal achievement events.
 */
export interface HealthGoalPayload {
  /** ID of the health goal */
  goalId: string;
  /** Type of goal (steps, weight, etc.) */
  goalType: string;
  /** Target value that was achieved */
  targetValue: number;
  /** Unit of measurement */
  unit: string;
  /** When the goal was achieved */
  achievedAt: string;
}

/**
 * Payload for health insight generation events.
 */
export interface HealthInsightPayload {
  /** ID of the generated insight */
  insightId: string;
  /** Type of insight */
  insightType: string;
  /** Brief description of the insight */
  description: string;
  /** Metrics related to this insight */
  relatedMetrics?: string[];
}

/**
 * Payload for device synchronization events.
 */
export interface DeviceSyncPayload {
  /** ID of the device */
  deviceId: string;
  /** Type of device */
  deviceType: string;
  /** When the sync occurred */
  syncedAt: string;
  /** Number of metrics synced */
  metricsCount: number;
  /** Whether the sync was successful */
  successful: boolean;
}

/**
 * Interface for Care journey specific events.
 */
export interface CareEvent extends BaseGamificationEvent {
  journey: JourneyType.CARE;
  type: GamificationEventType.APPOINTMENT_BOOKED | 
        GamificationEventType.APPOINTMENT_COMPLETED | 
        GamificationEventType.MEDICATION_TAKEN | 
        GamificationEventType.TELEMEDICINE_SESSION_COMPLETED | 
        GamificationEventType.CARE_PLAN_PROGRESS;
  payload: CareEventPayload;
}

/**
 * Union type for all possible Care event payloads.
 */
export type CareEventPayload = 
  AppointmentPayload | 
  MedicationPayload | 
  TelemedicinePayload | 
  CarePlanPayload;

/**
 * Payload for appointment-related events.
 */
export interface AppointmentPayload {
  /** ID of the appointment */
  appointmentId: string;
  /** Type of appointment */
  appointmentType: string;
  /** ID of the provider */
  providerId: string;
  /** Name of the provider */
  providerName: string;
  /** When the appointment is scheduled */
  scheduledAt: string;
  /** Duration of the appointment in minutes */
  durationMinutes: number;
  /** Whether the appointment was completed (for APPOINTMENT_COMPLETED) */
  completed?: boolean;
  /** When the appointment was completed (for APPOINTMENT_COMPLETED) */
  completedAt?: string;
}

/**
 * Payload for medication-related events.
 */
export interface MedicationPayload {
  /** ID of the medication */
  medicationId: string;
  /** Name of the medication */
  medicationName: string;
  /** Dosage taken */
  dosage: string;
  /** When the medication was taken */
  takenAt: string;
  /** Whether it was taken on schedule */
  onSchedule: boolean;
}

/**
 * Payload for telemedicine-related events.
 */
export interface TelemedicinePayload {
  /** ID of the telemedicine session */
  sessionId: string;
  /** ID of the provider */
  providerId: string;
  /** Name of the provider */
  providerName: string;
  /** Duration of the session in minutes */
  durationMinutes: number;
  /** When the session started */
  startedAt: string;
  /** When the session ended */
  endedAt: string;
  /** Quality rating of the session (1-5) */
  qualityRating?: number;
}

/**
 * Payload for care plan progress events.
 */
export interface CarePlanPayload {
  /** ID of the care plan */
  planId: string;
  /** Type of care plan */
  planType: string;
  /** Current progress percentage */
  progressPercentage: number;
  /** Specific task that was completed */
  completedTask?: string;
  /** When the task was completed */
  completedAt?: string;
}

/**
 * Interface for Plan journey specific events.
 */
export interface PlanEvent extends BaseGamificationEvent {
  journey: JourneyType.PLAN;
  type: GamificationEventType.CLAIM_SUBMITTED | 
        GamificationEventType.CLAIM_APPROVED | 
        GamificationEventType.BENEFIT_UTILIZED | 
        GamificationEventType.PLAN_SELECTED;
  payload: PlanEventPayload;
}

/**
 * Union type for all possible Plan event payloads.
 */
export type PlanEventPayload = 
  ClaimPayload | 
  BenefitPayload | 
  PlanSelectionPayload;

/**
 * Payload for claim-related events.
 */
export interface ClaimPayload {
  /** ID of the claim */
  claimId: string;
  /** Type of claim */
  claimType: string;
  /** Amount of the claim */
  amount: number;
  /** Currency of the amount */
  currency: string;
  /** When the claim was submitted */
  submittedAt?: string;
  /** When the claim was approved (for CLAIM_APPROVED) */
  approvedAt?: string;
  /** Status of the claim */
  status?: 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'PENDING';
}

/**
 * Payload for benefit utilization events.
 */
export interface BenefitPayload {
  /** ID of the benefit */
  benefitId: string;
  /** Type of benefit */
  benefitType: string;
  /** Description of the benefit */
  description: string;
  /** When the benefit was utilized */
  utilizedAt: string;
  /** Value of the benefit utilized */
  value?: number;
  /** Currency of the value */
  currency?: string;
}

/**
 * Payload for plan selection events.
 */
export interface PlanSelectionPayload {
  /** ID of the selected plan */
  planId: string;
  /** Name of the plan */
  planName: string;
  /** Type of plan */
  planType: string;
  /** When the plan was selected */
  selectedAt: string;
  /** Previous plan ID if switching plans */
  previousPlanId?: string;
  /** Annual cost of the plan */
  annualCost?: number;
  /** Currency of the cost */
  currency?: string;
}

/**
 * Interface for system-level events.
 */
export interface SystemEvent extends BaseGamificationEvent {
  journey: JourneyType.SYSTEM;
  type: GamificationEventType.USER_REGISTERED | 
        GamificationEventType.USER_LOGGED_IN | 
        GamificationEventType.DAILY_STREAK;
  payload: SystemEventPayload;
}

/**
 * Union type for all possible System event payloads.
 */
export type SystemEventPayload = 
  UserRegistrationPayload | 
  UserLoginPayload | 
  DailyStreakPayload;

/**
 * Payload for user registration events.
 */
export interface UserRegistrationPayload {
  /** When the user registered */
  registeredAt: string;
  /** Registration method used */
  method: 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';
  /** Whether the profile is complete */
  profileComplete: boolean;
}

/**
 * Payload for user login events.
 */
export interface UserLoginPayload {
  /** When the user logged in */
  loggedInAt: string;
  /** Login method used */
  method: 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';
  /** Device type used for login */
  deviceType: 'MOBILE' | 'WEB' | 'TABLET';
}

/**
 * Payload for daily streak events.
 */
export interface DailyStreakPayload {
  /** Current streak count in days */
  streakCount: number;
  /** When the streak was updated */
  updatedAt: string;
  /** Bonus XP awarded for the streak */
  bonusXp?: number;
}

/**
 * Interface for event processing responses.
 * Used to handle the result of event processing by the gamification engine.
 */
export interface EventResponse {
  /** Whether the event was processed successfully */
  success: boolean;
  /** Error message if processing failed */
  error?: string;
  /** Achievements unlocked as a result of this event */
  unlockedAchievements?: Array<{
    id: string;
    title: string;
    description: string;
    xp: number;
  }>;
  /** XP earned from this event */
  xpEarned?: number;
  /** Whether the user leveled up from this event */
  leveledUp?: boolean;
  /** New level if the user leveled up */
  newLevel?: number;
  /** Quests that progressed from this event */
  questProgress?: Array<{
    id: string;
    title: string;
    progress: number;
    total: number;
    completed: boolean;
  }>;
  /** Rewards earned from this event */
  earnedRewards?: Array<{
    id: string;
    title: string;
    description: string;
    xp: number;
  }>;
}

/**
 * Union type for all possible gamification events.
 * Used for type checking and discriminated unions.
 */
export type GamificationEvent = 
  AchievementEvent | 
  QuestEvent | 
  RewardEvent | 
  ProgressEvent | 
  HealthEvent | 
  CareEvent | 
  PlanEvent | 
  SystemEvent;

/**
 * Type guard to check if an event is an AchievementEvent.
 */
export function isAchievementEvent(event: GamificationEvent): event is AchievementEvent {
  return event.type === GamificationEventType.ACHIEVEMENT_UNLOCKED || 
         event.type === GamificationEventType.ACHIEVEMENT_PROGRESS;
}

/**
 * Type guard to check if an event is a QuestEvent.
 */
export function isQuestEvent(event: GamificationEvent): event is QuestEvent {
  return event.type === GamificationEventType.QUEST_COMPLETED || 
         event.type === GamificationEventType.QUEST_PROGRESS || 
         event.type === GamificationEventType.QUEST_STARTED;
}

/**
 * Type guard to check if an event is a RewardEvent.
 */
export function isRewardEvent(event: GamificationEvent): event is RewardEvent {
  return event.type === GamificationEventType.REWARD_EARNED || 
         event.type === GamificationEventType.REWARD_REDEEMED;
}

/**
 * Type guard to check if an event is a ProgressEvent.
 */
export function isProgressEvent(event: GamificationEvent): event is ProgressEvent {
  return event.type === GamificationEventType.XP_EARNED || 
         event.type === GamificationEventType.LEVEL_UP;
}

/**
 * Type guard to check if an event is a HealthEvent.
 */
export function isHealthEvent(event: GamificationEvent): event is HealthEvent {
  return event.journey === JourneyType.HEALTH;
}

/**
 * Type guard to check if an event is a CareEvent.
 */
export function isCareEvent(event: GamificationEvent): event is CareEvent {
  return event.journey === JourneyType.CARE;
}

/**
 * Type guard to check if an event is a PlanEvent.
 */
export function isPlanEvent(event: GamificationEvent): event is PlanEvent {
  return event.journey === JourneyType.PLAN;
}

/**
 * Type guard to check if an event is a SystemEvent.
 */
export function isSystemEvent(event: GamificationEvent): event is SystemEvent {
  return event.journey === JourneyType.SYSTEM;
}