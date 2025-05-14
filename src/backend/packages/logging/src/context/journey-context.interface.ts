import { LogContext } from '../interfaces/logger.interface';

/**
 * Enum representing the available journey types in the AUSTA SuperApp.
 * The application is built around three primary user journeys with an additional
 * cross-journey type for operations that span multiple journeys.
 */
export enum JourneyType {
  /**
   * Health journey focused on health metrics, goals, and device integration
   */
  HEALTH = 'health',
  
  /**
   * Care journey focused on appointments, medications, and provider interactions
   */
  CARE = 'care',
  
  /**
   * Plan journey focused on insurance plans, benefits, and claims
   */
  PLAN = 'plan',
  
  /**
   * Cross-journey operations that span multiple journeys
   */
  CROSS_JOURNEY = 'cross_journey'
}

/**
 * Interface for health journey specific context information.
 * Captures health-specific data points relevant for logging in the health journey.
 */
export interface HealthJourneyContext {
  /**
   * The health metric type being recorded or accessed
   */
  metricType?: string;
  
  /**
   * The device ID for connected health devices
   */
  deviceId?: string;
  
  /**
   * The health goal ID being tracked
   */
  goalId?: string;
  
  /**
   * The specific health insight being generated or viewed
   */
  insightId?: string;
  
  /**
   * The FHIR resource type being accessed or modified
   */
  fhirResourceType?: string;
  
  /**
   * The FHIR resource ID being accessed or modified
   */
  fhirResourceId?: string;
}

/**
 * Interface for care journey specific context information.
 * Captures care-specific data points relevant for logging in the care journey.
 */
export interface CareJourneyContext {
  /**
   * The appointment ID for scheduling or appointment management
   */
  appointmentId?: string;
  
  /**
   * The healthcare provider ID
   */
  providerId?: string;
  
  /**
   * The telemedicine session ID for virtual consultations
   */
  sessionId?: string;
  
  /**
   * The medication ID for medication tracking
   */
  medicationId?: string;
  
  /**
   * The treatment plan ID
   */
  treatmentPlanId?: string;
  
  /**
   * The symptom checker session ID
   */
  symptomCheckerSessionId?: string;
}

/**
 * Interface for plan journey specific context information.
 * Captures plan-specific data points relevant for logging in the plan journey.
 */
export interface PlanJourneyContext {
  /**
   * The insurance plan ID
   */
  planId?: string;
  
  /**
   * The insurance claim ID
   */
  claimId?: string;
  
  /**
   * The benefit ID being accessed or utilized
   */
  benefitId?: string;
  
  /**
   * The coverage ID for specific coverage details
   */
  coverageId?: string;
  
  /**
   * The document ID for insurance-related documents
   */
  documentId?: string;
}

/**
 * Interface for cross-journey context information.
 * Captures data points that span multiple journeys or are shared between journeys.
 */
export interface CrossJourneyContext {
  /**
   * The gamification event type
   */
  eventType?: string;
  
  /**
   * The achievement ID for gamification
   */
  achievementId?: string;
  
  /**
   * The quest ID for gamification
   */
  questId?: string;
  
  /**
   * The reward ID for gamification
   */
  rewardId?: string;
  
  /**
   * The user profile ID for gamification
   */
  profileId?: string;
  
  /**
   * The leaderboard ID for gamification
   */
  leaderboardId?: string;
}

/**
 * Interface representing journey-specific context for structured logging in the AUSTA SuperApp.
 * Extends the base LogContext to capture journey-specific information that provides
 * critical context for logs within each journey.
 */
export interface JourneyContext extends LogContext {
  /**
   * The specific journey type (Health, Care, Plan, or Cross-Journey)
   */
  journeyType: JourneyType;
  
  /**
   * The journey ID for tracking specific user journeys
   */
  journeyId?: string;
  
  /**
   * The current step or action within the journey
   */
  journeyStep?: string;
  
  /**
   * The journey state or status
   */
  journeyState?: string;
  
  /**
   * The business transaction ID for tracking operations across services
   */
  transactionId?: string;
  
  /**
   * The user session ID for holistic experience monitoring
   */
  sessionId?: string;
  
  /**
   * Health journey specific context
   */
  health?: HealthJourneyContext;
  
  /**
   * Care journey specific context
   */
  care?: CareJourneyContext;
  
  /**
   * Plan journey specific context
   */
  plan?: PlanJourneyContext;
  
  /**
   * Cross-journey specific context
   */
  crossJourney?: CrossJourneyContext;
  
  /**
   * Additional journey-specific metadata
   */
  journeyMetadata?: Record<string, any>;
}