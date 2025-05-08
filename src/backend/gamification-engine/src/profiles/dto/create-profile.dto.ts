import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IGameProfile } from '@austa/interfaces/gamification';
import { ApiProperty } from '@app/shared/swagger';

/**
 * Data Transfer Object for creating a new game profile.
 * This DTO validates input data when creating profiles in the gamification engine.
 */
export class CreateProfileDto implements Pick<IGameProfile, 'userId' | 'level' | 'xp'> {
  /**
   * Unique identifier of the user associated with this game profile.
   * Must be a valid UUID.
   */
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID(4, { message: 'User ID must be a valid UUID v4' })
  userId: string;

  /**
   * Current level of the user in the gamification system.
   * Defaults to 1 if not provided.
   */
  @ApiProperty({
    description: 'Current level of the user',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Level must be a valid number' })
  @IsPositive({ message: 'Level must be a positive number' })
  @Min(1, { message: 'Level must be at least 1' })
  level?: number = 1;

  /**
   * Current experience points of the user in the gamification system.
   * Defaults to 0 if not provided.
   */
  @ApiProperty({
    description: 'Current experience points of the user',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'XP must be a valid number' })
  @Min(0, { message: 'XP cannot be negative' })
  xp?: number = 0;
}