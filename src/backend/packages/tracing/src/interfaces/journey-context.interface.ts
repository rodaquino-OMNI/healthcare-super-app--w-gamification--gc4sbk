/**
 * Journey Context Interfaces for Tracing
 *
 * These interfaces define the structure for journey-specific context that can be
 * attached to traces, providing business context to technical traces and enabling
 * correlation between technical operations and business processes.
 */

/**
 * Base interface for all journey contexts
 * Contains common properties shared across all journeys
 */
export interface BaseJourneyContext {
  /** Unique identifier for the journey session */
  journeyId: string;
  
  /** User identifier associated with the journey */
  userId: string;
  
  /** Journey type identifier */
  journeyType: JourneyType;
  
  /** Timestamp when the journey was initiated */
  startedAt: string;
  
  /** Current step or screen in the journey */
  currentStep?: string;
  
  /** Previous step or screen in the journey */
  previousStep?: string;
  
  /** Device information */
  deviceInfo?: {
    /** Device type (mobile, web, etc.) */
    type: string;
    /** Device platform (iOS, Android, browser) */
    platform: string;
    /** Application version */
    appVersion: string;
  };
  
  /** Correlation IDs for cross-service tracing */
  correlationIds?: {
    /** Request ID for the current request */
    requestId: string;
    /** Session ID for the current user session */
    sessionId?: string;
    /** Transaction ID for business transactions */
    transactionId?: string;
  };
}

/**
 * Enum representing the different journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Interface for Health Journey specific context
 */
export interface HealthJourneyContext extends BaseJourneyContext {
  journeyType: JourneyType.HEALTH;
  
  /** Health metrics being tracked or viewed */
  metrics?: {
    /** Type of health metric */
    metricType: string;
    /** Time period for the metric data */
    timePeriod?: string;
  };
  
  /** Health goals information */
  goals?: {
    /** Goal identifier */
    goalId?: string;
    /** Goal type */
    goalType?: string;
    /** Goal progress percentage */
    progress?: number;
  };
  
  /** Connected health devices */
  devices?: {
    /** Device identifier */
    deviceId?: string;
    /** Device type */
    deviceType?: string;
    /** Last sync timestamp */
    lastSyncAt?: string;
  };
  
  /** Medical history context */
  medicalHistory?: {
    /** Record type being viewed */
    recordType?: string;
    /** Time period for records */
    timePeriod?: string;
  };
}

/**
 * Interface for Care Journey specific context
 */
export interface CareJourneyContext extends BaseJourneyContext {
  journeyType: JourneyType.CARE;
  
  /** Appointment information */
  appointment?: {
    /** Appointment identifier */
    appointmentId?: string;
    /** Appointment type */
    appointmentType?: string;
    /** Appointment status */
    status?: string;
    /** Provider information */
    provider?: {
      /** Provider identifier */
      providerId?: string;
      /** Provider type */
      providerType?: string;
    };
  };
  
  /** Telemedicine session information */
  telemedicine?: {
    /** Session identifier */
    sessionId?: string;
    /** Session status */
    status?: string;
    /** Session duration in seconds */
    durationSeconds?: number;
  };
  
  /** Symptom checker information */
  symptomChecker?: {
    /** Assessment identifier */
    assessmentId?: string;
    /** Primary symptom */
    primarySymptom?: string;
    /** Assessment completion status */
    completed?: boolean;
  };
  
  /** Treatment plan information */
  treatmentPlan?: {
    /** Plan identifier */
    planId?: string;
    /** Plan type */
    planType?: string;
    /** Plan progress percentage */
    progress?: number;
  };
}

/**
 * Interface for Plan Journey specific context
 */
export interface PlanJourneyContext extends BaseJourneyContext {
  journeyType: JourneyType.PLAN;
  
  /** Insurance plan information */
  plan?: {
    /** Plan identifier */
    planId?: string;
    /** Plan type */
    planType?: string;
    /** Plan status */
    status?: string;
  };
  
  /** Claim information */
  claim?: {
    /** Claim identifier */
    claimId?: string;
    /** Claim type */
    claimType?: string;
    /** Claim status */
    status?: string;
    /** Claim amount */
    amount?: number;
  };
  
  /** Benefit information */
  benefit?: {
    /** Benefit identifier */
    benefitId?: string;
    /** Benefit type */
    benefitType?: string;
    /** Utilization percentage */
    utilization?: number;
  };
  
  /** Cost estimation information */
  costEstimation?: {
    /** Service type being estimated */
    serviceType?: string;
    /** Estimated cost */
    estimatedCost?: number;
    /** Coverage percentage */
    coveragePercentage?: number;
  };
}

/**
 * Interface for Gamification context that can be attached to any journey
 * Enables cross-journey achievement tracking in traces
 */
export interface GamificationContext {
  /** Event information */
  event?: {
    /** Event identifier */
    eventId: string;
    /** Event type */
    eventType: string;
    /** Source journey that generated the event */
    sourceJourney: JourneyType;
    /** Points awarded for this event */
    pointsAwarded?: number;
  };
  
  /** Achievement information */
  achievement?: {
    /** Achievement identifier */
    achievementId?: string;
    /** Achievement type */
    achievementType?: string;
    /** Achievement progress percentage */
    progress?: number;
    /** Whether the achievement was unlocked */
    unlocked?: boolean;
    /** Timestamp when the achievement was unlocked */
    unlockedAt?: string;
  };
  
  /** Quest information */
  quest?: {
    /** Quest identifier */
    questId?: string;
    /** Quest type */
    questType?: string;
    /** Quest progress percentage */
    progress?: number;
    /** Whether the quest was completed */
    completed?: boolean;
  };
  
  /** Reward information */
  reward?: {
    /** Reward identifier */
    rewardId?: string;
    /** Reward type */
    rewardType?: string;
    /** Whether the reward was claimed */
    claimed?: boolean;
    /** Timestamp when the reward was claimed */
    claimedAt?: string;
  };
  
  /** User profile information */
  profile?: {
    /** User level */
    level?: number;
    /** Total points accumulated */
    totalPoints?: number;
    /** Current streak days */
    streakDays?: number;
  };
}

/**
 * Union type for all journey contexts
 */
export type JourneyContext = HealthJourneyContext | CareJourneyContext | PlanJourneyContext;

/**
 * Interface for a complete tracing context that includes both journey and gamification contexts
 */
export interface TraceContext {
  /** Journey-specific context */
  journeyContext?: JourneyContext;
  /** Gamification context */
  gamificationContext?: GamificationContext;
}