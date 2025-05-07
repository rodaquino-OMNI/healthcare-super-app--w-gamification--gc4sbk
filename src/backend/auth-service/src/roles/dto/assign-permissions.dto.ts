/**
 * @file DTO for assigning multiple permissions to a role
 * @module auth-service/roles/dto
 */

import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ArrayMinSize, ArrayUnique } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignPermissionDto } from '@app/auth/permissions/dto/assign-permission.dto';
import { IPermissionAssignment } from '@austa/interfaces/auth';

/**
 * Data transfer object for assigning multiple permissions to a role
 * 
 * This DTO is used specifically for assigning a list of permissions to a role.
 * It validates that the permission IDs array is not empty, contains only valid IDs,
 * and has no duplicates. It also supports optional audit information.
 */
export class AssignPermissionsDto implements IPermissionAssignment {
  /**
   * ID of the role to assign permissions to
   */
  @ApiProperty({
    description: 'ID of the role to assign permissions to',
    type: Number,
    example: 1
  })
  @IsNumber({}, { message: 'Role ID must be a valid number' })
  @IsNotEmpty({ message: 'Role ID is required' })
  roleId: number;

  /**
   * IDs of the permissions to assign to the role
   * Must be an array of at least one permission ID with no duplicates
   */
  @ApiProperty({
    description: 'IDs of the permissions to assign to the role',
    type: [Number],
    example: [1, 2, 3]
  })
  @IsArray({ message: 'Permission IDs must be provided as an array' })
  @ArrayMinSize(1, { message: 'At least one permission ID must be provided' })
  @IsNumber({}, { each: true, message: 'Each permission ID must be a valid number' })
  @ArrayUnique({ message: 'Permission IDs must be unique' })
  permissionIds: number[];

  /**
   * Optional reason for granting these permissions
   * Useful for audit purposes
   */
  @ApiPropertyOptional({
    description: 'Reason for granting these permissions',
    type: String,
    example: 'Required for health journey access'
  })
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;

  /**
   * ID of the user who is granting these permissions
   * Used for audit trail purposes
   */
  @ApiPropertyOptional({
    description: 'ID of the user granting these permissions',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Granted by must be a valid UUID' })
  grantedBy?: string;

  /**
   * Validates that the permissionIds array is not empty and contains only valid IDs
   * 
   * @returns True if the validation passes, false otherwise
   */
  validatePermissionIds(): boolean {
    return Array.isArray(this.permissionIds) && 
           this.permissionIds.length > 0 && 
           this.permissionIds.every(id => typeof id === 'number' && id > 0) &&
           new Set(this.permissionIds).size === this.permissionIds.length;
  }

  /**
   * Validates the entire DTO
   * 
   * @returns True if all validations pass, false otherwise
   */
  validate(): boolean {
    return typeof this.roleId === 'number' && 
           this.roleId > 0 && 
           this.validatePermissionIds();
  }

  /**
   * Converts this DTO to an AssignPermissionDto for compatibility with the permissions module
   * 
   * @returns An AssignPermissionDto instance with the same data
   */
  toAssignPermissionDto(): AssignPermissionDto {
    return AssignPermissionDto.forRole(
      this.roleId,
      this.permissionIds,
      {
        reason: this.reason,
        grantedBy: this.grantedBy
      }
    );
  }

  /**
   * Creates an AssignPermissionsDto from an AssignPermissionDto
   * 
   * @param dto The AssignPermissionDto to convert
   * @returns A new AssignPermissionsDto with the same data, or null if the input DTO is for a user
   */
  static fromAssignPermissionDto(dto: AssignPermissionDto): AssignPermissionsDto | null {
    if (!dto.roleId) {
      return null; // Cannot convert if the DTO is for a user
    }

    const result = new AssignPermissionsDto();
    result.roleId = dto.roleId;
    result.permissionIds = dto.permissionIds;
    result.reason = dto.reason;
    result.grantedBy = dto.grantedBy;
    return result;
  }

  /**
   * Creates a new AssignPermissionsDto
   * 
   * @param roleId The ID of the role to assign permissions to
   * @param permissionIds The IDs of the permissions to assign
   * @param options Additional options (reason, grantedBy)
   * @returns A new AssignPermissionsDto
   */
  static create(
    roleId: number, 
    permissionIds: number[], 
    options?: { reason?: string, grantedBy?: string }
  ): AssignPermissionsDto {
    const dto = new AssignPermissionsDto();
    dto.roleId = roleId;
    dto.permissionIds = [...new Set(permissionIds)]; // Remove duplicates
    if (options) {
      dto.reason = options.reason;
      dto.grantedBy = options.grantedBy;
    }
    return dto;
  }

  /**
   * Converts this DTO to a plain object for serialization
   * 
   * @returns A plain object representation of this DTO
   */
  toObject(): Record<string, any> {
    return {
      roleId: this.roleId,
      permissionIds: this.permissionIds,
      reason: this.reason,
      grantedBy: this.grantedBy
    };
  }
}