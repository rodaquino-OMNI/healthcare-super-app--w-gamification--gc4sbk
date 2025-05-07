import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for updating an existing permission
 * Extends CreatePermissionDto but makes all properties optional
 */
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
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
  name: string;
}