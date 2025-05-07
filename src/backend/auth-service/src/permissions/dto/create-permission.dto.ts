import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for creating a new permission
 */
export class CreatePermissionDto {
  /**
   * Name of the permission in the format journey:resource:action
   * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
   */
  @ApiProperty({
    description: 'Name of the permission in the format journey:resource:action',
    example: 'health:metrics:read',
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Permission name is required' })
  @IsString({ message: 'Permission name must be a string' })
  @MinLength(3, { message: 'Permission name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Permission name cannot exceed 100 characters' })
  @Matches(/^[a-z]+:[a-z]+:[a-z]+$/, {
    message: 'Permission name must follow the format journey:resource:action (e.g., health:metrics:read)',
  })
  name: string;
}