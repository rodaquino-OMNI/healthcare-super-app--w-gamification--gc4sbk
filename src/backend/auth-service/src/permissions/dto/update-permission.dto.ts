/**
 * @file Update Permission DTO for the AUSTA SuperApp authentication system
 * @module auth-service/permissions/dto
 */

import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UpdatePermissionDto as IUpdatePermissionDto } from '@austa/interfaces/auth';
import { CreatePermissionDto } from './create-permission.dto';

/**
 * Data Transfer Object for updating an existing permission
 * Extends CreatePermissionDto but makes all properties optional
 */
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) implements IUpdatePermissionDto {
  /**
   * Updated name of the permission in the format journey:resource:action
   * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
   */
  @ApiProperty({
    description: 'Updated name of the permission in the format journey:resource:action',
    example: 'health:metrics:read',
    minLength: 3,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Permission name must be a string' })
  @MinLength(3, { message: 'Permission name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Permission name cannot exceed 100 characters' })
  @Matches(/^[a-z]+:[a-z]+:[a-z]+$/, {
    message: 'Permission name must follow the format journey:resource:action (e.g., health:metrics:read)',
  })
  name?: string;

  /**
   * Updated human-readable description of what the permission allows
   */
  @ApiProperty({
    description: 'Updated human-readable description of what the permission allows',
    example: 'Allows reading health metrics in the Health journey',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}