/**
 * @file Create Permission DTO for the AUSTA SuperApp authentication system
 * @module auth-service/permissions/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CreatePermissionDto as ICreatePermissionDto } from '@austa/interfaces/auth';

/**
 * Data Transfer Object for creating a new permission
 * Validates that the permission follows the format journey:resource:action
 */
export class CreatePermissionDto implements ICreatePermissionDto {
  /**
   * Name of the permission in the format journey:resource:action
   * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
   */
  @ApiProperty({
    description: 'Name of the permission in the format journey:resource:action',
    example: 'health:metrics:read',
    minLength: 3,
    maxLength: 100,
    required: true,
  })
  @IsNotEmpty({ message: 'Permission name is required' })
  @IsString({ message: 'Permission name must be a string' })
  @MinLength(3, { message: 'Permission name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Permission name cannot exceed 100 characters' })
  @Matches(/^[a-z]+:[a-z]+:[a-z]+$/, {
    message: 'Permission name must follow the format journey:resource:action (e.g., health:metrics:read)',
  })
  name: string;

  /**
   * Human-readable description of what the permission allows
   */
  @ApiProperty({
    description: 'Human-readable description of what the permission allows',
    example: 'Allows reading health metrics in the Health journey',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  /**
   * Validates if the permission name follows the correct format
   * and extracts journey, resource, and action components
   * 
   * @returns An object with journey, resource, and action properties
   * @throws Error if the permission name is invalid
   */
  parsePermissionName(): { journey: string; resource: string; action: string } {
    const parts = this.name.split(':');
    
    if (parts.length !== 3 || parts.some(part => !part.trim())) {
      throw new Error('Invalid permission format. Must be journey:resource:action');
    }
    
    const [journey, resource, action] = parts;
    return { journey, resource, action };
  }
}