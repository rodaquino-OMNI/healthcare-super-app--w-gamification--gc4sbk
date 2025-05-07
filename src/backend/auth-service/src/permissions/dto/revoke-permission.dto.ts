import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// Import shared interfaces using TypeScript path aliases
import { IPermission } from '@austa/interfaces/auth';

/**
 * Data Transfer Object for revoking a permission from a role or user
 * 
 * This DTO ensures that permission revocation operations are properly validated
 * and includes audit trail information for security and compliance purposes.
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
  @Transform(({ value }) => value?.trim())
  permissionId: string;

  /**
   * ID of the role from which to revoke the permission
   * Either roleId or userId must be provided, but not both
   */
  @ApiProperty({
    description: 'ID of the role from which to revoke the permission',
    example: '1',
    required: false,
  })
  @ValidateIf(o => !o.userId && o.userId !== '')
  @IsNotEmpty({ message: 'Either roleId or userId must be provided' })
  @IsString({ message: 'Role ID must be a string' })
  roleId?: string;

  /**
   * ID of the user from which to revoke the permission
   * Either roleId or userId must be provided, but not both
   */
  @ApiProperty({
    description: 'ID of the user from which to revoke the permission',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @ValidateIf(o => !o.roleId && o.roleId !== '')
  @IsNotEmpty({ message: 'Either roleId or userId must be provided' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId?: string;
  
  /**
   * Validates that only one of roleId or userId is provided
   * This custom validation ensures that the revocation target is unambiguous
   */
  @ValidateIf(o => o.roleId && o.userId)
  @IsString({ message: 'Cannot provide both roleId and userId simultaneously' })

  /**
   * Reason for revoking the permission (for audit purposes)
   */
  @ApiProperty({
    description: 'Reason for revoking the permission (for audit purposes)',
    example: 'User no longer requires this permission due to role change',
    required: true,
  })
  @IsNotEmpty({ message: 'Revocation reason is required for audit purposes' })
  @IsString({ message: 'Revocation reason must be a string' })
  @Transform(({ value }) => value?.trim())
  reason: string;

  /**
   * ID of the user performing the revocation (for audit purposes)
   */
  @ApiProperty({
    description: 'ID of the user performing the revocation (for audit purposes)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsNotEmpty({ message: 'Revoker ID is required for audit purposes' })
  @IsUUID('4', { message: 'Revoker ID must be a valid UUID' })
  revokedBy: string;

  /**
   * Optional confirmation code to prevent accidental revocation of critical permissions
   * Required only for revoking system-level permissions
   * Must be 'CONFIRM' for system-level permissions
   */
  @ApiProperty({
    description: 'Confirmation code for revoking critical permissions',
    example: 'CONFIRM',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Confirmation code must be a string' })
  @ValidateIf(o => o.permissionId && o.permissionId.startsWith('system:'))
  @Matches(/^CONFIRM$/, { message: 'Confirmation code must be exactly "CONFIRM" for system-level permissions' })
  confirmationCode?: string;
  
  /**
   * Timestamp when this revocation should take effect
   * If not provided, the revocation takes effect immediately
   */
  @ApiProperty({
    description: 'Timestamp when this revocation should take effect',
    example: '2023-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Effective date must be a valid ISO date string' })
  effectiveDate?: string;
  
  /**
   * Converts the DTO to a plain object for easier handling in the service
   * @returns A plain object representation of the DTO
   */
  toObject() {
    return {
      permissionId: this.permissionId,
      roleId: this.roleId,
      userId: this.userId,
      reason: this.reason,
      revokedBy: this.revokedBy,
      confirmationCode: this.confirmationCode,
      effectiveDate: this.effectiveDate ? new Date(this.effectiveDate) : undefined,
    };
  }
}