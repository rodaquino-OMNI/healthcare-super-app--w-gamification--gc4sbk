/**
 * @file Journey Interface
 * @description Defines journey-related interfaces and types used throughout the gamification engine.
 * Contains the JourneyType enum, IJourneyContext interface, and utility types for journey-specific data structures.
 */

import { IJourneyType } from '@austa/interfaces/journey';

/**
 * Enum representing the available journey types in the application.
 * Used for categorizing achievements, events, quests, and other entities by journey.
 */
export enum JourneyType {
  /**
   * Health journey - focused on health metrics, goals, and wellness activities.
   */
  HEALTH = 'health',

  /**
   * Care journey - focused on appointments, treatments, and medical care activities.
   */
  CARE = 'care',

  /**
   * Plan journey - focused on insurance plans, benefits, and claims.
   */
  PLAN = 'plan',

  /**
   * Cross-journey - applies to multiple or all journeys.
   */
  CROSS_JOURNEY = 'cross_journey'
}

/**
 * Interface for journey context data.
 * Provides journey-specific information for events, achievements, and other entities.
 */
export interface IJourneyContext {
  /**
   * The type of journey this context belongs to.
   */
  journeyType: JourneyType;

  /**
   * Additional journey-specific metadata.
   * Can contain any journey-specific data needed for processing.
   */
  metadata?: Record<string, any>;

  /**
   * Optional reference to a specific journey entity or resource.
   * For example, a health metric ID, appointment ID, or claim ID.
   */
  referenceId?: string;

  /**
   * Optional reference type to clarify what the referenceId points to.
   * For example, 'health_metric', 'appointment', or 'claim'.
   */
  referenceType?: string;
}

/**
 * Interface for health journey-specific context.
 * Extends the base IJourneyContext with health-specific properties.
 */
export interface IHealthJourneyContext extends IJourneyContext {
  /**
   * The type of journey is always HEALTH for this context.
   */
  journeyType: JourneyType.HEALTH;

  /**
   * Optional health metric type associated with this context.
   * For example, 'steps', 'weight', 'heart_rate', etc.
   */
  metricType?: string;

  /**
   * Optional health goal ID associated with this context.
   */
  goalId?: string;

  /**
   * Optional device ID that generated the health data.
   */
  deviceId?: string;
}

/**
 * Interface for care journey-specific context.
 * Extends the base IJourneyContext with care-specific properties.
 */
export interface ICareJourneyContext extends IJourneyContext {
  /**
   * The type of journey is always CARE for this context.
   */
  journeyType: JourneyType.CARE;

  /**
   * Optional appointment ID associated with this context.
   */
  appointmentId?: string;

  /**
   * Optional provider ID associated with this context.
   */
  providerId?: string;

  /**
   * Optional treatment ID associated with this context.
   */
  treatmentId?: string;

  /**
   * Optional medication ID associated with this context.
   */
  medicationId?: string;
}

/**
 * Interface for plan journey-specific context.
 * Extends the base IJourneyContext with plan-specific properties.
 */
export interface IPlanJourneyContext extends IJourneyContext {
  /**
   * The type of journey is always PLAN for this context.
   */
  journeyType: JourneyType.PLAN;

  /**
   * Optional plan ID associated with this context.
   */
  planId?: string;

  /**
   * Optional claim ID associated with this context.
   */
  claimId?: string;

  /**
   * Optional benefit ID associated with this context.
   */
  benefitId?: string;

  /**
   * Optional coverage ID associated with this context.
   */
  coverageId?: string;
}

/**
 * Interface for cross-journey context.
 * Extends the base IJourneyContext with properties that span multiple journeys.
 */
export interface ICrossJourneyContext extends IJourneyContext {
  /**
   * The type of journey is always CROSS_JOURNEY for this context.
   */
  journeyType: JourneyType.CROSS_JOURNEY;

  /**
   * Array of journey types that this context applies to.
   */
  applicableJourneys: JourneyType[];

  /**
   * Optional map of journey-specific context data.
   */
  journeyContexts?: {
    [JourneyType.HEALTH]?: Omit<IHealthJourneyContext, 'journeyType'>;
    [JourneyType.CARE]?: Omit<ICareJourneyContext, 'journeyType'>;
    [JourneyType.PLAN]?: Omit<IPlanJourneyContext, 'journeyType'>;
  };
}

/**
 * Type representing any journey context.
 * Can be a health, care, plan, or cross-journey context.
 */
export type AnyJourneyContext = 
  | IHealthJourneyContext 
  | ICareJourneyContext 
  | IPlanJourneyContext 
  | ICrossJourneyContext;

/**
 * Type guard to check if a journey context is a health journey context.
 * 
 * @param context - The journey context to check
 * @returns True if the context is a health journey context, false otherwise
 */
export function isHealthJourneyContext(context: AnyJourneyContext): context is IHealthJourneyContext {
  return context.journeyType === JourneyType.HEALTH;
}

/**
 * Type guard to check if a journey context is a care journey context.
 * 
 * @param context - The journey context to check
 * @returns True if the context is a care journey context, false otherwise
 */
export function isCareJourneyContext(context: AnyJourneyContext): context is ICareJourneyContext {
  return context.journeyType === JourneyType.CARE;
}

/**
 * Type guard to check if a journey context is a plan journey context.
 * 
 * @param context - The journey context to check
 * @returns True if the context is a plan journey context, false otherwise
 */
export function isPlanJourneyContext(context: AnyJourneyContext): context is IPlanJourneyContext {
  return context.journeyType === JourneyType.PLAN;
}

/**
 * Type guard to check if a journey context is a cross-journey context.
 * 
 * @param context - The journey context to check
 * @returns True if the context is a cross-journey context, false otherwise
 */
export function isCrossJourneyContext(context: AnyJourneyContext): context is ICrossJourneyContext {
  return context.journeyType === JourneyType.CROSS_JOURNEY;
}

/**
 * Maps a JourneyType to the corresponding IJourneyType from @austa/interfaces.
 * Ensures compatibility between local and shared journey type enums.
 * 
 * @param journeyType - The local JourneyType enum value
 * @returns The corresponding IJourneyType from @austa/interfaces
 */
export function mapToSharedJourneyType(journeyType: JourneyType): IJourneyType {
  switch (journeyType) {
    case JourneyType.HEALTH:
      return 'health' as IJourneyType;
    case JourneyType.CARE:
      return 'care' as IJourneyType;
    case JourneyType.PLAN:
      return 'plan' as IJourneyType;
    case JourneyType.CROSS_JOURNEY:
      return 'cross_journey' as IJourneyType;
    default:
      throw new Error(`Unknown journey type: ${journeyType}`);
  }
}

/**
 * Maps an IJourneyType from @austa/interfaces to the corresponding local JourneyType.
 * Ensures compatibility between shared and local journey type enums.
 * 
 * @param journeyType - The IJourneyType from @austa/interfaces
 * @returns The corresponding local JourneyType enum value
 */
export function mapFromSharedJourneyType(journeyType: IJourneyType): JourneyType {
  switch (journeyType) {
    case 'health':
      return JourneyType.HEALTH;
    case 'care':
      return JourneyType.CARE;
    case 'plan':
      return JourneyType.PLAN;
    case 'cross_journey':
      return JourneyType.CROSS_JOURNEY;
    default:
      throw new Error(`Unknown journey type: ${journeyType}`);
  }
}