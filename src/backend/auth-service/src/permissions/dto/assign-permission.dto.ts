import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for assigning a permission to a role
 */
export class AssignPermissionDto {
  /**
   * ID of the permission to assign
   */
  @ApiProperty({
    description: 'ID of the permission to assign',
    example: '1',
  })
  @IsNotEmpty({ message: 'Permission ID is required' })
  @IsString({ message: 'Permission ID must be a string' })
  permissionId: string;

  /**
   * ID of the role to assign the permission to
   */
  @ApiProperty({
    description: 'ID of the role to assign the permission to',
    example: '1',
  })
  @IsNotEmpty({ message: 'Role ID is required' })
  @IsString({ message: 'Role ID must be a string' })
  roleId: string;
}