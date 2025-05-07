import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@austa/interfaces/auth';

/**
 * Data Transfer Object for permission responses
 */
export class PermissionResponseDto implements Partial<Permission> {
  /**
   * ID of the permission
   */
  @ApiProperty({
    description: 'ID of the permission',
    example: 1,
  })
  id: number;

  /**
   * Name of the permission in the format journey:resource:action
   */
  @ApiProperty({
    description: 'Name of the permission in the format journey:resource:action',
    example: 'health:metrics:read',
  })
  name: string;

  /**
   * Human-readable description of the permission
   */
  @ApiProperty({
    description: 'Human-readable description of the permission',
    example: 'Permission for health:metrics:read',
  })
  description: string;

  /**
   * Constructor to create a PermissionResponseDto from a Permission entity
   * 
   * @param permission The permission entity to convert
   */
  constructor(permission: Permission) {
    this.id = permission.id;
    this.name = permission.name;
    this.description = permission.description;
  }
}