import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

/**
 * Data transfer object for validating requests to grant rewards to users.
 * This DTO ensures that only valid user and reward IDs are processed,
 * preventing invalid data from causing downstream errors in the reward
 * granting process.
 *
 * Used in the RewardsController when handling POST requests to grant
 * a reward to a user based on achievements or direct admin actions.
 */
export class GrantRewardDto {
  /**
   * The ID of the user to grant the reward to.
   * Must be a valid UUID that corresponds to an existing user profile.
   */
  @IsNotEmpty()
  @IsUUID(4)
  userId: string;

  /**
   * The ID of the reward to grant to the user.
   * Must be a valid UUID that corresponds to an existing reward in the system.
   */
  @IsNotEmpty()
  @IsUUID(4)
  rewardId: string;

  /**
   * Optional journey context for the reward.
   * Specifies which journey the reward is associated with.
   * Possible values: 'health', 'care', 'plan'
   */
  @IsOptional()
  @IsString()
  journey?: string;
}