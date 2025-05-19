import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Data transfer object for validating requests to grant rewards to users.
 * This DTO ensures that only valid user and reward IDs are processed,
 * preventing invalid data from causing downstream errors in the reward granting process.
 * 
 * Used in the RewardsController when handling POST requests to grant a reward to a user.
 */
export class GrantRewardDto {
  /**
   * The ID of the user to whom the reward will be granted.
   * Must be a valid UUID that corresponds to an existing user profile.
   */
  @IsNotEmpty()
  @IsUUID(4)
  userId: string;

  /**
   * The ID of the reward to be granted to the user.
   * Must be a valid UUID that corresponds to an existing reward in the system.
   */
  @IsNotEmpty()
  @IsUUID(4)
  rewardId: string;

  /**
   * The journey associated with this reward grant.
   * This is optional but can be used for journey-specific validation and processing.
   * 
   * Possible values:
   * - 'health' - My Health journey
   * - 'care' - Care Now journey
   * - 'plan' - My Plan & Benefits journey
   */
  @IsOptional()
  @IsString()
  journey?: JourneyType;
}