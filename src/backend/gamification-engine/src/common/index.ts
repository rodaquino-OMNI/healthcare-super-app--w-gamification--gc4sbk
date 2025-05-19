/**
 * Common module barrel file that exports all components from the common module.
 * 
 * This file provides a clean API for importing common functionality across the application.
 */

// Export the module itself
export * from './common.module';

// Re-export key types and interfaces from @austa packages for convenience
export { ConnectionOptions } from '@austa/database/connection';
export { TransactionOptions } from '@austa/database/transactions';
export { RetryOptions, RetryPolicy } from '@austa/errors/retry';
export { CircuitBreakerOptions } from '@austa/errors/circuit-breaker';
export { EventValidationOptions } from '@austa/events/validation';
export { DeadLetterQueueOptions } from '@austa/events/dlq';

/**
 * Feature flags interface defining all available feature toggles in the gamification engine.
 */
export interface FeatureFlags {
  /** Enable leaderboard functionality */
  enableLeaderboards: boolean;
  /** Enable quest functionality */
  enableQuests: boolean;
  /** Enable reward functionality */
  enableRewards: boolean;
  /** Enable achievement notifications */
  enableAchievementNotifications: boolean;
  /** Enable journey-specific rules */
  enableJourneySpecificRules: boolean;
  /** Enable anti-cheat protection */
  enableAntiCheatProtection: boolean;
  /** Enable event batching for performance */
  enableEventBatching: boolean;
  /** Enable caching for improved performance */
  enableCaching: boolean;
}