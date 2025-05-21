/**
 * Barrel file that exports all public-facing components from the rewards module.
 * This file provides a clean, consistent API for other modules to consume the rewards
 * functionality, simplifying imports and enforcing proper encapsulation.
 *
 * @module rewards
 */

// Export the main module and service
export { RewardsModule } from './rewards.module';
export { RewardsService } from './rewards.service';

// Export entities
export { Reward } from './entities/reward.entity';
export { UserReward } from './entities/user-reward.entity';

// Export DTOs
export {
  CreateRewardDto,
  UpdateRewardDto,
  FilterRewardDto,
  GrantRewardDto,
} from './dto';

// Export interfaces
export {
  RewardEventInterface,
  RewardRequestInterface,
  RewardResponseInterface,
  RewardServiceInterface,
} from './interfaces';

// Export exceptions
export {
  BaseRewardException,
  DuplicateRewardException,
  InvalidRewardDataException,
  RewardExceptionTypes,
  RewardExternalServiceException,
  RewardNotFoundException,
  RewardProcessingException,
  UserRewardNotFoundException,
} from './exceptions';

// Export consumers
export {
  BaseConsumer,
  CareJourneyConsumer,
  ConsumersModule,
  HealthJourneyConsumer,
  PlanJourneyConsumer,
  RewardEventTypes,
} from './consumers';