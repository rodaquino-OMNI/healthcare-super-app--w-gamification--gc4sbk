import { IsString, IsBoolean, MaxLength, IsOptional, IsIn, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data transfer object for creating a new role in the AUSTA SuperApp.
 * Contains all necessary information required for role creation.
 */
export class CreateRoleDto {
  /**
   * Unique name of the role (e.g., 'User', 'Caregiver', 'Provider', 'Administrator').
   * Must be unique across the system.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  /**
   * Description of the role and its purpose.
   * Provides context about the role's intended use and permissions.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  description: string;

  /**
   * The journey this role is associated with (health, care, plan, or null for global roles).
   * Determines which journey-specific features and data this role can access.
   * Must be one of the three core journeys: 'health', 'care', 'plan', or null for global roles.
   */
  @IsOptional()
  @IsString()
  @IsIn(['health', 'care', 'plan', null])
  journey?: string;

  /**
   * Indicates if this is a default role assigned to new users.
   * Default roles are automatically assigned during user registration.
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true)
  isDefault?: boolean;
}