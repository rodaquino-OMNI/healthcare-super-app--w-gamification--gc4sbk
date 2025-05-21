/**
 * Journey-related interfaces and types used throughout the gamification engine.
 * These types ensure consistent handling of journey-specific logic across
 * achievements, events, quests, and rewards.
 */

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
 * Interface for journey-specific context data.
 * This provides a standardized way to include journey-specific information
 * in events, achievements, quests, and rewards.
 */
export interface IJourneyContext {
  /**
   * The type of journey this context belongs to.
   */
  journeyType: JourneyType;
  
  /**
   * Journey-specific identifier, if applicable.
   * For example, a health goal ID, appointment ID, or claim ID.
   */
  journeyEntityId?: string;
  
  /**
   * Additional journey-specific metadata.
   * This can include any journey-specific data that might be relevant
   * for gamification processing.
   */
  metadata?: Record<string, any>;
}

/**
 * Type guard to check if a value is a valid JourneyType.
 * @param value - The value to check.
 * @returns True if the value is a valid JourneyType, false otherwise.
 */
export function isJourneyType(value: any): value is JourneyType {
  return Object.values(JourneyType).includes(value as JourneyType);
}

/**
 * Type for objects that are associated with a specific journey.
 * @template T - The base type being extended with journey context.
 */
export type WithJourney<T> = T & {
  journeyContext: IJourneyContext;
};

/**
 * Type for filtering objects by journey type.
 * @template T - The type of objects to filter.
 * @template J - The journey type to filter by.
 */
export type JourneyFiltered<T extends { journeyContext: IJourneyContext }, J extends JourneyType> = 
  T & { journeyContext: { journeyType: J } };

/**
 * Type for discriminating between different journey types in a union.
 * This is useful for type-safe handling of journey-specific logic.
 * @template T - The base type with journey context.
 */
export type JourneyDiscriminated<T extends { journeyContext: IJourneyContext }> =
  | JourneyFiltered<T, JourneyType.HEALTH>
  | JourneyFiltered<T, JourneyType.CARE>
  | JourneyFiltered<T, JourneyType.PLAN>;

/**
 * Interface for objects that can be filtered by journey type.
 */
export interface IJourneyFilterable {
  /**
   * Optional journey type to filter by.
   */
  journeyType?: JourneyType;
}

/**
 * Type for journey-specific data structures.
 * This creates a mapped type where each journey has its own data structure.
 * @template T - The base type for journey-specific data.
 */
export type JourneySpecific<T> = {
  [K in JourneyType]: T;
};

/**
 * Type for partial journey-specific data structures.
 * Similar to JourneySpecific, but all properties are optional.
 * @template T - The base type for journey-specific data.
 */
export type PartialJourneySpecific<T> = {
  [K in JourneyType]?: T;
};