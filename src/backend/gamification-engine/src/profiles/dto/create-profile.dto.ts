import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IGameProfile } from '@austa/interfaces/gamification';

/**
 * Data Transfer Object for creating a new game profile.
 * Contains the necessary data to create a profile in the gamification engine.
 * 
 * @example
 * ```typescript
 * const createProfileDto = new CreateProfileDto();
 * createProfileDto.userId = '123e4567-e89b-12d3-a456-426614174000';
 * // level and xp are optional and have default values
 * ```
 */
export class CreateProfileDto implements Pick<IGameProfile, 'userId' | 'level' | 'xp'> {
  /**
   * The unique identifier of the user for whom to create the profile.
   * Must be a valid UUID format.
   */
  @IsUUID(4, { message: 'userId must be a valid UUID' })
  userId: string;

  /**
   * The initial level for the user's game profile.
   * Optional, defaults to 1 if not provided.
   * Must be a positive number (minimum 1).
   */
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'level must be a valid number' })
  @Min(1, { message: 'level must be at least 1' })
  @Type(() => Number)
  level?: number = 1;

  /**
   * The initial experience points for the user's game profile.
   * Optional, defaults to 0 if not provided.
   * Must be a non-negative number.
   */
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'xp must be a valid number' })
  @Min(0, { message: 'xp must be at least 0' })
  @Type(() => Number)
  xp?: number = 0;
}