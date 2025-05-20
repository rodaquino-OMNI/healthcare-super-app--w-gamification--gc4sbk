/**
 * @file Journey Context Interface
 * @description Defines the JourneyContext interface that extends the base LoggingContext
 * to capture journey-specific information for structured logging in the journey-centered architecture.
 */

import { LoggingContext } from './context.interface';

/**
 * Enum representing the three distinct user journeys in the AUSTA SuperApp.
 */
export enum JourneyType {
  /** Health journey ("Minha Saúde") */
  HEALTH = 'health',
  /** Care journey ("Cuidar-me Agora") */
  CARE = 'care',
  /** Plan journey ("Meu Plano & Benefícios") */
  PLAN = 'plan',
}

/**
 * Interface for journey-specific state that can be included in logs.
 * This provides a flexible structure for capturing relevant journey data.
 */
export interface JourneyState {
  /** Unique identifier for the current journey session */
  journeySessionId?: string;
  /** Current step or page within the journey */
  currentStep?: string;
  /** Previous step or page within the journey */
  previousStep?: string;
  /** Time spent on the current step (in milliseconds) */
  stepDuration?: number;
  /** Any journey-specific data relevant to the current context */
  [key: string]: any;
}

/**
 * Interface for cross-journey context when a user action spans multiple journeys.
 * This allows tracking user flows that transition between different journeys.
 */
export interface CrossJourneyContext {
  /** The source journey where the cross-journey flow originated */
  sourceJourney: JourneyType;
  /** The target journey where the cross-journey flow is heading */
  targetJourney: JourneyType;
  /** Unique identifier for the cross-journey flow */
  flowId: string;
  /** Timestamp when the cross-journey flow started */
  startedAt: string;
  /** Optional metadata for the cross-journey flow */
  metadata?: Record<string, any>;
}

/**
 * JourneyContext interface that extends the base LoggingContext to capture
 * journey-specific information for structured logging in the journey-centered architecture.
 * 
 * This interface provides critical context for logs within each journey, enabling
 * proper analysis of user experiences and system behavior within the journey-centered
 * architecture of the AUSTA SuperApp.
 */
export interface JourneyContext extends LoggingContext {
  /** The type of journey (Health, Care, Plan) */
  journeyType: JourneyType;
  
  /** Journey-specific state information */
  journeyState?: JourneyState;
  
  /** Cross-journey context for actions that span multiple journeys */
  crossJourneyContext?: CrossJourneyContext;
  
  /** Journey-specific feature flags that may affect behavior */
  journeyFeatureFlags?: Record<string, boolean>;
  
  /** Journey-specific performance metrics */
  journeyPerformance?: {
    /** Time to interactive for the journey (in milliseconds) */
    timeToInteractive?: number;
    /** Time to complete a specific journey action (in milliseconds) */
    actionDuration?: number;
    /** Number of API calls made during the journey */
    apiCallCount?: number;
    /** Other performance metrics */
    [key: string]: number | undefined;
  };
  
  /** Business transaction information related to the journey */
  businessTransaction?: {
    /** Unique identifier for the business transaction */
    transactionId: string;
    /** Type of business transaction */
    transactionType: string;
    /** Current status of the transaction */
    status: string;
    /** Timestamp when the transaction started */
    startedAt: string;
    /** Timestamp when the transaction was last updated */
    updatedAt?: string;
    /** Additional transaction metadata */
    metadata?: Record<string, any>;
  };
  
  /** User interaction information within the journey */
  userInteraction?: {
    /** Type of interaction (click, swipe, form submission, etc.) */
    interactionType: string;
    /** Target element or component of the interaction */
    interactionTarget: string;
    /** Result of the interaction */
    interactionResult?: string;
    /** Duration of the interaction (in milliseconds) */
    interactionDuration?: number;
  };
}