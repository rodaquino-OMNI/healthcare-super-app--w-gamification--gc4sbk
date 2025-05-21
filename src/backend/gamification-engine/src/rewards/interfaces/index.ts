/**
 * @file Reward Interfaces Barrel File
 * @description Exports all interfaces and types related to rewards in the gamification system.
 * This file simplifies imports throughout the application by providing a single import point
 * for all reward-related interfaces and types.
 * 
 * This barrel file enables a clean, consistent import pattern across the codebase:
 * ```typescript
 * import { RewardRequestDto, RewardResponseDto } from '@app/rewards/interfaces';
 * ```
 * 
 * It also integrates with the shared @austa/interfaces package to ensure type consistency
 * between the gamification engine and other services that consume reward data.
 * 
 * @module rewards/interfaces
 */

// Import shared interfaces from @austa/interfaces package
import * as SharedRewardInterfaces from '@austa/interfaces/gamification/rewards';

/**
 * Re-export all shared reward interfaces from the @austa/interfaces package.
 * This provides a convenient way to access standardized reward interfaces
 * that are shared across multiple services.
 * 
 * @example
 * // Import shared reward interfaces
 * import { SharedRewardInterfaces } from '@app/rewards/interfaces';
 * 
 * // Use a specific shared interface
 * const reward: SharedRewardInterfaces.Reward = { ... };
 */
export { SharedRewardInterfaces };

/**
 * Direct re-exports of specific shared interfaces for convenience.
 * This allows consumers to import these interfaces directly without
 * going through the SharedRewardInterfaces namespace.
 */
export type {
  Reward,
  UserReward,
  RewardType,
  RewardStatus,
  JourneyReward
} from '@austa/interfaces/gamification/rewards';

/**
 * Reward Request/Response Definitions
 * These interfaces define the structure of data for API requests and responses
 * related to rewards functionality.
 */
export * from './reward-request.interface';
export * from './reward-response.interface';

/**
 * Reward Service Definitions
 * These interfaces define the contract for the RewardsService, ensuring
 * consistent implementation of reward business logic.
 */
export * from './reward-service.interface';

/**
 * Reward Event Definitions
 * These interfaces define the structure of event payloads for reward-related
 * events transmitted through Kafka.
 */
export * from './reward-event.interface';