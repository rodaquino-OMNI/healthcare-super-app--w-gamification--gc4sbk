/**
 * Barrel file that exports all public-facing components from the rewards module.
 * This file provides a clean, consistent API for other modules to consume the rewards
 * functionality, simplifying imports and enforcing proper encapsulation.
 */

// Main module exports
export { RewardsModule } from './rewards.module';
export { RewardsService } from './rewards.service';
export { RewardsController } from './rewards.controller';

// Entity exports
export { Reward } from './entities/reward.entity';
export { UserReward } from './entities/user-reward.entity';

// DTO exports
export { CreateRewardDto, UpdateRewardDto, FilterRewardDto, GrantRewardDto } from './dto';

// Interface exports - re-export everything from the interfaces barrel
export * from './interfaces';

// Exception exports - re-export everything from the exceptions barrel
export * from './exceptions';

// Consumer exports - only export the public-facing consumer types
export { RewardEventTypes } from './consumers/reward-events.types';

/**
 * Default export of the RewardsModule for convenient importing.
 * This allows consumers to use either:
 * import { RewardsModule } from '@app/gamification/rewards';
 * or
 * import RewardsModule from '@app/gamification/rewards';
 */
export default RewardsModule;