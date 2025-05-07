import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsBoolean, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateRoleDto } from './create-role.dto';
import { IJourneyType } from '@austa/interfaces/journey';

/**
 * Data Transfer Object for updating an existing role.
 * Makes all fields optional to support partial updates while maintaining
 * validation rules from CreateRoleDto for consistency.
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  /**
   * Optional update to the role name
   * When provided, must be alphanumeric with optional hyphens and underscores
   */
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Role name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message: 'Role name can only contain letters, numbers, hyphens, and underscores',
  })
  @Transform(({ value }) => value?.trim())
  name?: string;

  /**
   * Optional update to the role description
   */
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Role description cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  /**
   * Optional update to the journey this role is associated with
   * When provided, must be one of: health, care, plan
   */
  @IsOptional()
  @IsString()
  @Matches(/^(health|care|plan)$/, {
    message: 'Journey must be one of: health, care, plan',
  })
  journey?: IJourneyType;

  /**
   * Optional update to whether this is a default role
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isDefault?: boolean;
}