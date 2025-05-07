import { IsString, IsBoolean, IsOptional, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { IJourneyType } from '@austa/interfaces/journey';

/**
 * Data Transfer Object for creating a new role.
 * Validates role creation data including name, description, journey, and isDefault flag.
 */
export class CreateRoleDto {
  /**
   * Unique name of the role (e.g., 'User', 'Caregiver', 'Provider', 'Administrator')
   * Must be alphanumeric with optional hyphens and underscores
   */
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  @MaxLength(50, { message: 'Role name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message: 'Role name can only contain letters, numbers, hyphens, and underscores',
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  /**
   * Description of the role and its purpose
   */
  @IsString()
  @IsNotEmpty({ message: 'Role description is required' })
  @MaxLength(200, { message: 'Role description cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;

  /**
   * The journey this role is associated with (health, care, plan, or null for global roles)
   */
  @IsOptional()
  @IsString()
  @Matches(/^(health|care|plan)$/, {
    message: 'Journey must be one of: health, care, plan',
  })
  journey?: IJourneyType;

  /**
   * Indicates if this is a default role assigned to new users
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isDefault?: boolean = false;
}