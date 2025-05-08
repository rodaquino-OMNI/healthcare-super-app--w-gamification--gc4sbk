import { Prisma } from '@prisma/client';
import { IsDate, IsUUID, validateOrReject } from 'class-validator';
import { GameProfile } from '@app/shared/profiles/entities/game-profile.entity';
import { Reward } from '@app/shared/rewards/entities/reward.entity';
import { IUserReward, IGameProfile } from '@austa/interfaces/gamification';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Represents a reward earned by a user.
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 * 
 * @implements {IUserReward} from @austa/interfaces/gamification
 */
export class UserReward implements IUserReward {
  /**
   * Unique identifier for the user reward.
   */
  @IsUUID(4)
  id: string;

  /**
   * The game profile associated with this reward.
   */
  profile: GameProfile;

  /**
   * The ID of the associated game profile.
   */
  @IsUUID(4)
  profileId: string;

  /**
   * The reward earned by the user.
   */
  reward: Reward;

  /**
   * The ID of the earned reward.
   */
  @IsUUID(4)
  rewardId: string;

  /**
   * The date and time when the reward was earned.
   * Stored in ISO format for consistent cross-platform representation.
   */
  @IsDate()
  earnedAt: Date;

  /**
   * The journey type associated with this reward.
   * Used for journey-aware relationship querying and filtering.
   */
  journeyType?: JourneyType;

  /**
   * Creates a new UserReward instance from a Prisma UserReward record.
   * 
   * @param userReward - The Prisma UserReward record
   * @returns A new UserReward entity instance
   */
  static fromPrisma(userReward: Prisma.UserRewardGetPayload<{
    include: {
      profile: true;
      reward: true;
    };
  }>): UserReward {
    const entity = new UserReward();
    entity.id = userReward.id;
    entity.profileId = userReward.profileId;
    entity.rewardId = userReward.rewardId;
    entity.earnedAt = userReward.earnedAt;
    
    // Map related entities if included in the query
    if (userReward.profile) {
      entity.profile = GameProfile.fromPrisma(userReward.profile);
    }
    
    if (userReward.reward) {
      entity.reward = Reward.fromPrisma(userReward.reward);
    }
    
    // Set journey type if available from the profile
    if (entity.profile && (entity.profile as unknown as IGameProfile).journeyType) {
      entity.journeyType = (entity.profile as unknown as IGameProfile).journeyType;
    }
    
    return entity;
  }

  /**
   * Validates the UserReward entity.
   * Throws validation errors if the entity is invalid.
   * 
   * @throws {Error} If validation fails
   */
  async validate(): Promise<void> {
    try {
      await validateOrReject(this);
    } catch (errors) {
      // Transform validation errors into a standardized format
      const formattedErrors = errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value
      }));
      
      throw new Error(
        `UserReward validation failed: ${JSON.stringify(formattedErrors)}`
      );
    }
  }

  /**
   * Creates a Prisma create input object from this entity.
   * Used when creating new UserReward records in the database.
   * 
   * @returns Prisma.UserRewardCreateInput
   */
  toPrismaCreateInput(): Prisma.UserRewardCreateInput {
    return {
      id: this.id,
      earnedAt: this.earnedAt,
      profile: {
        connect: { id: this.profileId }
      },
      reward: {
        connect: { id: this.rewardId }
      }
    };
  }

  /**
   * Creates a Prisma update input object from this entity.
   * Used when updating existing UserReward records in the database.
   * 
   * @returns Prisma.UserRewardUpdateInput
   */
  toPrismaUpdateInput(): Prisma.UserRewardUpdateInput {
    return {
      earnedAt: this.earnedAt,
      profile: {
        connect: { id: this.profileId }
      },
      reward: {
        connect: { id: this.rewardId }
      }
    };
  }

  /**
   * Creates a journey-aware query filter for finding user rewards.
   * Enables optimized performance when querying by journey type.
   * 
   * @param journeyType - Optional journey type to filter by
   * @returns Prisma.UserRewardWhereInput
   */
  static createJourneyFilter(journeyType?: JourneyType): Prisma.UserRewardWhereInput {
    if (!journeyType) {
      return {};
    }
    
    return {
      profile: {
        journeyType: journeyType
      }
    };
  }
}