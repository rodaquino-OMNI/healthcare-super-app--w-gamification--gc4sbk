/**
 * @file DTO for assigning permissions to roles or users
 * @module auth-service/permissions/dto
 */

import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserPermissionDto } from '@austa/interfaces/auth';

/**
 * Custom validator to ensure that either roleId or userId is provided, but not both
 * 
 * @param validationOptions Options for the validation decorator
 * @returns PropertyDecorator
 */
function IsRoleOrUser(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRoleOrUser',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          return (obj.roleId !== undefined && obj.userId === undefined) || 
                 (obj.roleId === undefined && obj.userId !== undefined);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Either roleId or userId must be provided, but not both';
        },
      },
    });
  };
}

/**
 * Data transfer object for assigning permissions to roles or users
 * 
 * This DTO supports assigning multiple permissions at once to either a role or a user,
 * but not both simultaneously. It includes validation to ensure that either roleId or
 * userId is provided, but not both.
 * 
 * Extends the CreateUserPermissionDto interface from @austa/interfaces for consistency
 * across services while adding support for multiple permission assignments.
 */
@IsRoleOrUser({
  message: 'Either roleId or userId must be provided, but not both'
})
export class AssignPermissionDto implements Omit<CreateUserPermissionDto, 'permissionId'> {
  /**
   * ID of the role to assign permissions to
   * Required if userId is not provided
   */
  @ApiPropertyOptional({
    description: 'ID of the role to assign permissions to',
    type: Number,
    example: 1
  })
  @IsNumber()
  @ValidateIf(o => !o.userId)
  @IsNotEmpty({ message: 'Either roleId or userId must be provided' })
  roleId?: number;

  /**
   * ID of the user to assign permissions to
   * Required if roleId is not provided
   */
  @ApiPropertyOptional({
    description: 'ID of the user to assign permissions to',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @ValidateIf(o => !o.roleId)
  @IsNotEmpty({ message: 'Either roleId or userId must be provided' })
  userId?: string;

  /**
   * IDs of the permissions to assign
   * Must be an array of at least one permission ID
   */
  @ApiProperty({
    description: 'IDs of the permissions to assign',
    type: [Number],
    example: [1, 2, 3]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty({ message: 'At least one permission ID must be provided' })
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
  @IsString()
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
  @IsUUID()
  grantedBy?: string;

  /**
   * Validates that either roleId or userId is provided, but not both
   * 
   * @returns True if the validation passes, false otherwise
   */
  validateTargetEntity(): boolean {
    return (this.roleId !== undefined && this.userId === undefined) || 
           (this.roleId === undefined && this.userId !== undefined);
  }

  /**
   * Validates that the permissionIds array is not empty and contains only valid IDs
   * 
   * @returns True if the validation passes, false otherwise
   */
  validatePermissionIds(): boolean {
    return Array.isArray(this.permissionIds) && 
           this.permissionIds.length > 0 && 
           this.permissionIds.every(id => typeof id === 'number' && id > 0);
  }

  /**
   * Validates the entire DTO
   * 
   * @returns True if all validations pass, false otherwise
   */
  validate(): boolean {
    return this.validateTargetEntity() && this.validatePermissionIds();
  }

  /**
   * Converts this DTO to an array of AssignSinglePermissionDto instances
   * 
   * @returns An array of AssignSinglePermissionDto instances, one for each permission ID
   */
  toSingleAssignments(): AssignSinglePermissionDto[] {
    return this.permissionIds.map(permissionId => {
      const dto = new AssignSinglePermissionDto();
      dto.roleId = this.roleId;
      dto.userId = this.userId;
      dto.permissionId = permissionId;
      dto.reason = this.reason;
      dto.grantedBy = this.grantedBy;
      return dto;
    });
  }

  /**
   * Creates an AssignPermissionDto from a single permission assignment
   * 
   * @param singleAssignment The single permission assignment to convert
   * @returns A new AssignPermissionDto with the permission ID in an array
   */
  static fromSingleAssignment(singleAssignment: AssignSinglePermissionDto): AssignPermissionDto {
    const dto = new AssignPermissionDto();
    dto.roleId = singleAssignment.roleId;
    dto.userId = singleAssignment.userId;
    dto.permissionIds = [singleAssignment.permissionId];
    dto.reason = singleAssignment.reason;
    dto.grantedBy = singleAssignment.grantedBy;
    return dto;
  }

  /**
   * Creates an AssignPermissionDto for assigning multiple permissions to a role
   * 
   * @param roleId The ID of the role to assign permissions to
   * @param permissionIds The IDs of the permissions to assign
   * @param options Additional options (reason, grantedBy)
   * @returns A new AssignPermissionDto
   */
  static forRole(roleId: number, permissionIds: number[], options?: { reason?: string, grantedBy?: string }): AssignPermissionDto {
    const dto = new AssignPermissionDto();
    dto.roleId = roleId;
    dto.permissionIds = permissionIds;
    if (options) {
      dto.reason = options.reason;
      dto.grantedBy = options.grantedBy;
    }
    return dto;
  }

  /**
   * Creates an AssignPermissionDto for assigning multiple permissions to a user
   * 
   * @param userId The ID of the user to assign permissions to
   * @param permissionIds The IDs of the permissions to assign
   * @param options Additional options (reason, grantedBy)
   * @returns A new AssignPermissionDto
   */
  static forUser(userId: string, permissionIds: number[], options?: { reason?: string, grantedBy?: string }): AssignPermissionDto {
    const dto = new AssignPermissionDto();
    dto.userId = userId;
    dto.permissionIds = permissionIds;
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
      userId: this.userId,
      permissionIds: this.permissionIds,
      reason: this.reason,
      grantedBy: this.grantedBy
    };
  }
}

/**
 * Data transfer object for assigning a single permission to roles or users
 * 
 * This is a simplified version of AssignPermissionDto for cases where only
 * one permission needs to be assigned at a time.
 * 
 * Implements the CreateUserPermissionDto interface from @austa/interfaces for
 * consistency across services.
 */
@IsRoleOrUser({
  message: 'Either roleId or userId must be provided, but not both'
})
export class AssignSinglePermissionDto implements CreateUserPermissionDto {
  /**
   * ID of the role to assign the permission to
   * Required if userId is not provided
   */
  @ApiPropertyOptional({
    description: 'ID of the role to assign the permission to',
    type: Number,
    example: 1
  })
  @IsNumber()
  @ValidateIf(o => !o.userId)
  @IsNotEmpty({ message: 'Either roleId or userId must be provided' })
  roleId?: number;

  /**
   * ID of the user to assign the permission to
   * Required if roleId is not provided
   */
  @ApiPropertyOptional({
    description: 'ID of the user to assign the permission to',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @ValidateIf(o => !o.roleId)
  @IsNotEmpty({ message: 'Either roleId or userId must be provided' })
  userId?: string;

  /**
   * ID of the permission to assign
   */
  @ApiProperty({
    description: 'ID of the permission to assign',
    type: Number,
    example: 1
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Permission ID must be provided' })
  permissionId: number;

  /**
   * Optional reason for granting this permission
   * Useful for audit purposes
   */
  @ApiPropertyOptional({
    description: 'Reason for granting this permission',
    type: String,
    example: 'Required for health journey access'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  /**
   * ID of the user who is granting this permission
   * Used for audit trail purposes
   */
  @ApiPropertyOptional({
    description: 'ID of the user granting this permission',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  grantedBy?: string;

  /**
   * Validates that either roleId or userId is provided, but not both
   * 
   * @returns True if the validation passes, false otherwise
   */
  validateTargetEntity(): boolean {
    return (this.roleId !== undefined && this.userId === undefined) || 
           (this.roleId === undefined && this.userId !== undefined);
  }

  /**
   * Validates that the permissionId is a valid ID
   * 
   * @returns True if the validation passes, false otherwise
   */
  validatePermissionId(): boolean {
    return typeof this.permissionId === 'number' && this.permissionId > 0;
  }

  /**
   * Validates the entire DTO
   * 
   * @returns True if all validations pass, false otherwise
   */
  validate(): boolean {
    return this.validateTargetEntity() && this.validatePermissionId();
  }

  /**
   * Creates a new AssignSinglePermissionDto for a role
   * 
   * @param roleId The ID of the role to assign the permission to
   * @param permissionId The ID of the permission to assign
   * @param options Additional options (reason, grantedBy)
   * @returns A new AssignSinglePermissionDto
   */
  static forRole(roleId: number, permissionId: number, options?: { reason?: string, grantedBy?: string }): AssignSinglePermissionDto {
    const dto = new AssignSinglePermissionDto();
    dto.roleId = roleId;
    dto.permissionId = permissionId;
    if (options) {
      dto.reason = options.reason;
      dto.grantedBy = options.grantedBy;
    }
    return dto;
  }

  /**
   * Creates a new AssignSinglePermissionDto for a user
   * 
   * @param userId The ID of the user to assign the permission to
   * @param permissionId The ID of the permission to assign
   * @param options Additional options (reason, grantedBy)
   * @returns A new AssignSinglePermissionDto
   */
  static forUser(userId: string, permissionId: number, options?: { reason?: string, grantedBy?: string }): AssignSinglePermissionDto {
    const dto = new AssignSinglePermissionDto();
    dto.userId = userId;
    dto.permissionId = permissionId;
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
      userId: this.userId,
      permissionId: this.permissionId,
      reason: this.reason,
      grantedBy: this.grantedBy
    };
  }
}