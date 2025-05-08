/**
 * @file Common Interfaces Index
 * @description Barrel file that exports all common interfaces from the interfaces folder,
 * providing a single entry point for importing interfaces throughout the gamification engine.
 * This file also re-exports relevant interfaces from the @austa/interfaces package to ensure
 * consistent usage of shared types across the application.
 */

// Re-export interfaces from @austa/interfaces package
import * as AustaInterfaces from '@austa/interfaces';

// Export all interfaces from the gamification package
export * from '@austa/interfaces/gamification';

// Export utility namespace for working with shared interfaces
export namespace SharedInterfaces {
  export type GamificationInterfaces = typeof AustaInterfaces.gamification;
  
  /**
   * Type utility to extract a specific interface from the gamification interfaces
   * @example
   * // Get the Achievement interface from shared interfaces
   * type Achievement = SharedInterfaces.Extract<'achievements', 'Achievement'>;
   */
  export type Extract<
    Module extends keyof GamificationInterfaces,
    Interface extends keyof GamificationInterfaces[Module]
  > = GamificationInterfaces[Module][Interface];
}

// Export local interfaces
export * from './base-event.interface';
export * from './error.interface';
export * from './event-metadata.interface';
export * from './filterable.interface';
export * from './journey.interface';
export * from './leaderboard-data.interface';
export * from './pagination.interface';
export * from './retry-policy.interface';
export * from './service.interface';
export * from './user-profile.interface';
export * from './versioning.interface';

/**
 * @namespace CommonInterfaces
 * @description Namespace containing all common interfaces used throughout the gamification engine.
 * This namespace provides a convenient way to access all interfaces without importing them individually.
 * 
 * @example
 * // Import all interfaces from the common namespace
 * import { CommonInterfaces } from '@app/common/interfaces';
 * 
 * // Use a specific interface
 * const pagination: CommonInterfaces.IPaginationRequest = { page: 1, size: 10 };
 */
export namespace CommonInterfaces {
  // Re-export all local interfaces for namespace access
  export * from './base-event.interface';
  export * from './error.interface';
  export * from './event-metadata.interface';
  export * from './filterable.interface';
  export * from './journey.interface';
  export * from './leaderboard-data.interface';
  export * from './pagination.interface';
  export * from './retry-policy.interface';
  export * from './service.interface';
  export * from './user-profile.interface';
  export * from './versioning.interface';
}

/**
 * @namespace GamificationInterfaces
 * @description Namespace containing all gamification-specific interfaces from the @austa/interfaces package.
 * This namespace provides a convenient way to access all shared gamification interfaces.
 * 
 * @example
 * // Import all gamification interfaces
 * import { GamificationInterfaces } from '@app/common/interfaces';
 * 
 * // Use a specific interface
 * const achievement: GamificationInterfaces.Achievement = { ... };
 */
export namespace GamificationInterfaces {
  // Re-export all gamification interfaces from @austa/interfaces
  export * from '@austa/interfaces/gamification/achievements';
  export * from '@austa/interfaces/gamification/events';
  export * from '@austa/interfaces/gamification/leaderboard';
  export * from '@austa/interfaces/gamification/profiles';
  export * from '@austa/interfaces/gamification/quests';
  export * from '@austa/interfaces/gamification/rewards';
  export * from '@austa/interfaces/gamification/rules';
}

/**
 * @namespace JourneyInterfaces
 * @description Namespace containing journey-specific interfaces from the @austa/interfaces package.
 * This namespace provides access to interfaces for health, care, and plan journeys.
 * 
 * @example
 * // Import journey interfaces
 * import { JourneyInterfaces } from '@app/common/interfaces';
 * 
 * // Use a specific journey interface
 * const healthMetric: JourneyInterfaces.Health.HealthMetric = { ... };
 */
export namespace JourneyInterfaces {
  export import Health = AustaInterfaces.journey.health;
  export import Care = AustaInterfaces.journey.care;
  export import Plan = AustaInterfaces.journey.plan;
}

/**
 * Type utility for combining local and shared interfaces
 * @example
 * // Combine a local interface with a shared interface
 * type EnhancedAchievement = CombineInterfaces<IBaseEvent, GamificationInterfaces.Achievement>;
 */
export type CombineInterfaces<T, U> = T & U;

/**
 * Type utility for creating a versioned interface
 * @example
 * // Create a versioned event interface
 * type VersionedEvent = Versioned<IBaseEvent>;
 */
export type Versioned<T> = T & CommonInterfaces.IVersioned;

/**
 * Type utility for creating a filterable interface
 * @example
 * // Create a filterable entity interface
 * type FilterableAchievement = Filterable<GamificationInterfaces.Achievement>;
 */
export type Filterable<T> = T & CommonInterfaces.IFilterable;