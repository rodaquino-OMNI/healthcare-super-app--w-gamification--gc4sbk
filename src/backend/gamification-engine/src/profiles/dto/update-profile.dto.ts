import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsObject, IsOptional, Min, Max } from 'class-validator';
import { CreateProfileDto } from '@app/profiles/dto/create-profile.dto';
import { GameProfile } from '@austa/interfaces/gamification';

/**
 * UpdateProfileDto
 * 
 * Data Transfer Object for updating an existing game profile.
 * Extends PartialType of CreateProfileDto to make all fields optional for PATCH operations.
 * Includes validation rules to ensure data integrity when updating profile attributes.
 * 
 * This DTO is used by the profiles.service update method to validate incoming data
 * before persisting changes to the database.
 */
export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  /**
   * The user's current level in the gamification system
   * Must be a positive integer with a minimum value of 1
   * 
   * @example 5
   */
  @IsOptional()
  @IsInt({ message: 'Level must be an integer' })
  @Min(1, { message: 'Level must be at least 1' })
  @Max(100, { message: 'Level cannot exceed 100' })
  level?: number;

  /**
   * The user's current experience points
   * Must be a non-negative integer
   * 
   * @example 750
   */
  @IsOptional()
  @IsInt({ message: 'XP must be an integer' })
  @Min(0, { message: 'XP cannot be negative' })
  xp?: number;

  /**
   * The total XP required to reach the next level
   * Must be a positive integer with a minimum value of 100
   * 
   * @example 1000
   */
  @IsOptional()
  @IsInt({ message: 'Next level XP must be an integer' })
  @Min(100, { message: 'Next level XP must be at least 100' })
  nextLevelXp?: number;

  /**
   * Optional metadata for additional profile properties
   * Stored as a JSON object
   * 
   * @example { "lastJourney": "health", "preferences": { "notifications": true } }
   */
  @IsOptional()
  @IsObject({ message: 'Metadata must be a valid JSON object' })
  metadata?: Record<string, any>;
}