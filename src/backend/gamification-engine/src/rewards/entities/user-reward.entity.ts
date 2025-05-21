import { IsDate, IsUUID, ValidateIf } from 'class-validator';
import { IUserReward, IGameProfile } from '@austa/interfaces/gamification';
import { Reward } from '@app/rewards/entities/reward.entity';
import { GameProfile } from '@app/profiles/entities/game-profile.entity';
import * as crypto from 'crypto';

/**
 * Represents a reward earned by a user.
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 * 
 * This entity is used with Prisma ORM and implements the IUserReward interface
 * from @austa/interfaces for type safety across services.
 */
export class UserReward implements IUserReward {
  /**
   * Creates a new UserReward instance with the given properties.
   * Validates the input data and sets default values where appropriate.
   * 
   * @param data The data to create the UserReward with
   * @returns A new UserReward instance
   * @throws Error if the data is invalid
   */
  static create(data: Partial<IUserReward>): UserReward {
    const userReward = new UserReward();
    
    if (!data.profileId) {
      throw new Error('ProfileId is required');
    }
    
    if (!data.rewardId) {
      throw new Error('RewardId is required');
    }
    
    userReward.id = data.id || crypto.randomUUID();
    userReward.profileId = data.profileId;
    userReward.rewardId = data.rewardId;
    userReward.earnedAt = data.earnedAt || new Date();
    userReward.journey = data.journey || 'global';
    
    // Optional relationships
    if (data.profile) {
      userReward.profile = data.profile;
    }
    
    if (data.reward) {
      userReward.reward = data.reward;
    }
    
    // Validate the created instance
    if (!userReward.isValidTimestamp()) {
      throw new Error('Invalid earnedAt timestamp');
    }
    
    userReward.validateRelationships();
    
    return userReward;
  }
  /**
   * Unique identifier for the user reward.
   */
  @IsUUID()
  id: string;

  /**
   * ID of the game profile associated with this reward.
   * References the GameProfile entity.
   */
  @IsUUID()
  profileId: string;

  /**
   * The game profile associated with this reward.
   * This is a virtual field populated by Prisma's include functionality.
   */
  @ValidateIf((o) => !!o.profile)
  profile?: GameProfile;

  /**
   * ID of the reward earned by the user.
   * References the Reward entity.
   */
  @IsUUID()
  rewardId: string;

  /**
   * The reward earned by the user.
   * This is a virtual field populated by Prisma's include functionality.
   */
  @ValidateIf((o) => !!o.reward)
  reward?: Reward;

  /**
   * The date and time when the reward was earned.
   * Stored in ISO format for consistent timezone handling.
   */
  @IsDate()
  earnedAt: Date;

  /**
   * The journey this reward is associated with.
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards.
   * Used for journey-aware relationship querying and filtering.
   */
  journey: string;
  
  /**
   * Version number for optimistic locking.
   * Automatically incremented by Prisma on each update.
   * Used to prevent concurrent updates from overwriting each other.
   */
  version?: number;

  /**
   * Validates that the earnedAt timestamp is in the correct ISO format.
   * This is used by the validation pipeline to ensure data integrity.
   * @returns boolean indicating if the timestamp is valid
   */
  isValidTimestamp(): boolean {
    if (!this.earnedAt) return false;
    
    try {
      // Ensure the date is in valid ISO format
      return !isNaN(this.earnedAt.getTime());
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Validates that the required relationships exist.
   * Throws appropriate errors for constraint violations.
   * @throws Error if profileId or rewardId is invalid
   */
  validateRelationships(): void {
    if (!this.profileId) {
      throw new Error('UserReward must be associated with a valid GameProfile');
    }
    
    if (!this.rewardId) {
      throw new Error('UserReward must be associated with a valid Reward');
    }
    
    // Additional journey-specific validation
    if (this.reward && this.profile) {
      // For journey-specific rewards, ensure they match the user's active journey
      if (this.reward.journey !== 'global' && this.reward.journey !== this.journey) {
        throw new Error(`Reward from journey '${this.reward.journey}' cannot be assigned to user in journey '${this.journey}'`);
      }
    }
  }
  
  /**
   * Creates a Prisma query filter for journey-aware relationship querying.
   * This helps optimize database queries by filtering based on journey.
   * 
   * @param journey The journey to filter by ('health', 'care', 'plan', or undefined for all)
   * @returns A query object that can be used with Prisma's findMany
   */
  static createJourneyFilter(journey?: string): Record<string, any> {
    if (!journey) {
      return {};
    }
    
    return {
      OR: [
        { journey },
        { journey: 'global' }
      ],
      reward: {
        OR: [
          { journey },
          { journey: 'global' }
        ]
      }
    };
  }
  
  /**
   * Handles database errors related to relationship constraints.
   * Converts database-specific errors into user-friendly error messages.
   * 
   * @param error The error thrown by Prisma
   * @returns A user-friendly error message
   */
  static handleConstraintError(error: any): Error {
    // Check for Prisma-specific error codes
    if (error.code === 'P2003') {
      // Foreign key constraint failed
      if (error.meta?.field_name?.includes('profileId')) {
        return new Error('The specified game profile does not exist');
      }
      
      if (error.meta?.field_name?.includes('rewardId')) {
        return new Error('The specified reward does not exist');
      }
    }
    
    if (error.code === 'P2002') {
      // Unique constraint failed
      return new Error('This reward has already been earned by the user');
    }
    
    // Return the original error if it's not a constraint violation
    return error;
  }

  /**
   * Creates a plain object representation of this entity.
   * Useful for serialization and API responses.
   * @param includeVersion Whether to include the version field for optimistic locking
   * @returns A plain object with all properties
   */
  toJSON(includeVersion = false): Record<string, any> {
    const result: Record<string, any> = {
      id: this.id,
      profileId: this.profileId,
      rewardId: this.rewardId,
      earnedAt: this.earnedAt.toISOString(),
      journey: this.journey
    };
    
    // Include version for optimistic locking if requested
    if (includeVersion && 'version' in this) {
      result.version = (this as any).version;
    }
    
    // Include related entities if they're loaded
    if (this.profile) {
      result.profile = {
        id: this.profile.id,
        userId: this.profile.userId,
        level: this.profile.level,
        xp: this.profile.xp
      };
    }
    
    if (this.reward) {
      result.reward = {
        id: this.reward.id,
        title: this.reward.title,
        description: this.reward.description,
        xpReward: this.reward.xpReward,
        icon: this.reward.icon,
        journey: this.reward.journey
      };
    }
    
    return result;
  }
}