/**
 * Journey-related interfaces and types used throughout the gamification engine.
 * These types ensure consistent handling of journey-specific logic across
 * achievements, events, quests, and rewards.
 *
 * @module common/interfaces/journey
 */

import { IHealthMetric } from '@austa/interfaces/journey/health';
import { IAppointment } from '@austa/interfaces/journey/care';
import { IClaim } from '@austa/interfaces/journey/plan';

/**
 * Enum representing the three distinct user journeys in the AUSTA SuperApp.
 */
export enum JourneyType {
  /**
   * Health journey ("Minha Saúde") - Focused on health metrics, goals, and medical history.
   */
  HEALTH = 'health',
  
  /**
   * Care journey ("Cuidar-me Agora") - Focused on appointments, medications, and treatments.
   */
  CARE = 'care',
  
  /**
   * Plan journey ("Meu Plano & Benefícios") - Focused on insurance plans, claims, and benefits.
   */
  PLAN = 'plan',
}

/**
 * Base interface for journey-specific context data.
 * This interface provides common properties shared across all journey contexts.
 */
export interface IJourneyBaseContext {
  /**
   * The type of journey this context belongs to.
   */
  journeyType: JourneyType;
  
  /**
   * Unique identifier for the user associated with this journey context.
   */
  userId: string;
  
  /**
   * Timestamp when this journey context was created or last updated.
   */
  timestamp: Date;
  
  /**
   * Optional metadata associated with this journey context.
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for Health journey-specific context data.
 */
export interface IHealthJourneyContext extends IJourneyBaseContext {
  journeyType: JourneyType.HEALTH;
  
  /**
   * Health metrics associated with this context.
   */
  metrics?: IHealthMetric[];
  
  /**
   * Goal identifiers related to this context.
   */
  goalIds?: string[];
  
  /**
   * Device connection identifiers related to this context.
   */
  deviceConnectionIds?: string[];
}

/**
 * Interface for Care journey-specific context data.
 */
export interface ICareJourneyContext extends IJourneyBaseContext {
  journeyType: JourneyType.CARE;
  
  /**
   * Appointment associated with this context.
   */
  appointment?: IAppointment;
  
  /**
   * Provider identifier related to this context.
   */
  providerId?: string;
  
  /**
   * Medication identifiers related to this context.
   */
  medicationIds?: string[];
}

/**
 * Interface for Plan journey-specific context data.
 */
export interface IPlanJourneyContext extends IJourneyBaseContext {
  journeyType: JourneyType.PLAN;
  
  /**
   * Claim associated with this context.
   */
  claim?: IClaim;
  
  /**
   * Plan identifier related to this context.
   */
  planId?: string;
  
  /**
   * Benefit identifiers related to this context.
   */
  benefitIds?: string[];
}

/**
 * Union type representing all possible journey contexts.
 */
export type IJourneyContext = 
  | IHealthJourneyContext 
  | ICareJourneyContext 
  | IPlanJourneyContext;

/**
 * Type guard to check if a journey context is a Health journey context.
 * 
 * @param context The journey context to check
 * @returns True if the context is a Health journey context
 */
export function isHealthJourneyContext(context: IJourneyContext): context is IHealthJourneyContext {
  return context.journeyType === JourneyType.HEALTH;
}

/**
 * Type guard to check if a journey context is a Care journey context.
 * 
 * @param context The journey context to check
 * @returns True if the context is a Care journey context
 */
export function isCareJourneyContext(context: IJourneyContext): context is ICareJourneyContext {
  return context.journeyType === JourneyType.CARE;
}

/**
 * Type guard to check if a journey context is a Plan journey context.
 * 
 * @param context The journey context to check
 * @returns True if the context is a Plan journey context
 */
export function isPlanJourneyContext(context: IJourneyContext): context is IPlanJourneyContext {
  return context.journeyType === JourneyType.PLAN;
}

/**
 * Interface for entities that are associated with a specific journey.
 */
export interface IJourneyAssociated {
  /**
   * The type of journey this entity is associated with.
   */
  journeyType: JourneyType;
}

/**
 * Interface for entities that can be filtered by journey type.
 */
export interface IJourneyFilterable {
  /**
   * Filter criteria for journey type.
   */
  journeyType?: JourneyType | JourneyType[];
}

/**
 * Type for mapping a generic type to journey-specific variants.
 * Useful for creating journey-specific implementations of a common interface.
 */
export type JourneyTypeMap<T> = {
  [JourneyType.HEALTH]: T;
  [JourneyType.CARE]: T;
  [JourneyType.PLAN]: T;
};

/**
 * Type for creating a partial journey type map, where some journey types may not have implementations.
 */
export type PartialJourneyTypeMap<T> = Partial<JourneyTypeMap<T>>;

/**
 * Type for extracting journey-specific data from a union type based on journey type.
 * 
 * @template T The union type containing journey-specific data
 * @template J The journey type to extract
 */
export type ExtractJourneyData<T extends { journeyType: JourneyType }, J extends JourneyType> = 
  Extract<T, { journeyType: J }>;