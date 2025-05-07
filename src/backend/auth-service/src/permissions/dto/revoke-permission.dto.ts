import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for revoking a permission from a role
 */
export class RevokePermissionDto {
  /**
   * ID of the permission to revoke
   */
  @ApiProperty({
    description: 'ID of the permission to revoke',
    example: '1',
  })
  @IsNotEmpty({ message: 'Permission ID is required' })
  @IsString({ message: 'Permission ID must be a string' })
  permissionId: string;

  /**
   * ID of the role to revoke the permission from
   */
  @ApiProperty({
    description: 'ID of the role to revoke the permission from',
    example: '1',
  })
  @IsNotEmpty({ message: 'Role ID is required' })
  @IsString({ message: 'Role ID must be a string' })
  roleId: string;
}