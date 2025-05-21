import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CreateProfileDto } from '@app/gamification/profiles/dto/create-profile.dto';
import { IGameProfile } from '@austa/interfaces/gamification';

/**
 * Data Transfer Object for updating an existing game profile.
 * Extends CreateProfileDto as a partial type, making all fields optional for PATCH operations.
 * Includes validation rules to ensure data integrity when updating profile attributes.
 */
export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  /**
   * Optional level field with validation
   * Must be a positive integer with a reasonable maximum value
   */
  @IsOptional()
  @IsInt({ message: 'Level must be an integer' })
  @Min(1, { message: 'Level must be at least 1' })
  @Max(100, { message: 'Level cannot exceed 100' })
  level?: IGameProfile['level'];

  /**
   * Optional experience points field with validation
   * Must be a non-negative integer with a reasonable maximum value
   */
  @IsOptional()
  @IsInt({ message: 'XP must be an integer' })
  @Min(0, { message: 'XP cannot be negative' })
  @Max(1000000, { message: 'XP cannot exceed 1,000,000' })
  xp?: IGameProfile['xp'];
}