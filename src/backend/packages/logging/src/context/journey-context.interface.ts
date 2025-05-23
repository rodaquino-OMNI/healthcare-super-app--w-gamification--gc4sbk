/**
 * Interface for journey-specific logging context in the AUSTA SuperApp.
 * Extends the base LoggingContext to capture journey-specific information
 * for structured logging in the journey-centered architecture.
 */

import { JourneyType } from './context.constants';
import { LoggingContext } from './context.interface';

/**
 * Interface representing journey-specific context information for logging.
 * This interface captures the journey type (Health, Care, Plan) and any
 * journey-specific state or metadata needed for comprehensive logging.
 */
export interface JourneyContext extends LoggingContext {
  /**
   * The type of journey (Health, Care, Plan)
   * Corresponds to the three main user journeys in the AUSTA SuperApp:
   * - Health: "Minha Saúde"
   * - Care: "Cuidar-me Agora"
   * - Plan: "Meu Plano & Benefícios"
   */
  journeyType: JourneyType;

  /**
   * Journey-specific identifier (e.g., appointment ID, claim ID, health record ID)
   * Used to correlate logs with specific resources within a journey
   */
  resourceId?: string;

  /**
   * The specific action being performed within the journey
   * Examples: 'view-appointment', 'submit-claim', 'record-health-metric'
   */
  action?: string;

  /**
   * The current step in a multi-step journey process
   * Useful for tracking user progress through complex flows
   */
  step?: string | number;

  /**
   * Identifier for the specific journey flow or process
   * Used to group related actions within a journey
   */
  flowId?: string;

  /**
   * Indicates if this context spans multiple journeys
   * Used for cross-journey operations that affect multiple domains
   */
  isCrossJourney?: boolean;

  /**
   * References to related journeys when in a cross-journey context
   * Only populated when isCrossJourney is true
   */
  relatedJourneys?: JourneyType[];

  /**
   * Additional journey-specific data as key-value pairs
   * Can contain any journey-specific context that doesn't fit in other properties
   */
  journeyData?: Record<string, any>;

  /**
   * Business transaction ID for tracking operations across services
   * Used to correlate logs from different services that are part of the same business transaction
   */
  transactionId?: string;

  /**
   * Metadata about the journey state
   * Can include information about the journey's current state, configuration, or other metadata
   */
  journeyMetadata?: {
    /**
     * The version of the journey flow being executed
     * Useful for tracking changes to journey implementations over time
     */
    version?: string;

    /**
     * Indicates if this is a new or returning user to this journey
     */
    isNewUser?: boolean;

    /**
     * Timestamp when the user started this journey session
     */
    journeyStartTime?: Date;

    /**
     * Any feature flags affecting this journey
     */
    featureFlags?: Record<string, boolean>;

    /**
     * Additional metadata specific to each journey type
     */
    [key: string]: any;
  };
}