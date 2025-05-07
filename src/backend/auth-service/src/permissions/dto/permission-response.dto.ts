/**
 * @file Permission response DTO for the AUSTA SuperApp authentication system
 * @module auth-service/permissions/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto as IPermissionResponseDto } from '@austa/interfaces/auth';
import { Permission } from '../entities/permission.entity';

/**
 * Data Transfer Object for permission responses
 * Standardizes the structure of permission-related API responses
 */
export class PermissionResponseDto implements IPermissionResponseDto {
  /**
   * Unique identifier for the permission
   */
  @ApiProperty({
    description: 'Unique identifier for the permission',
    example: 1,
    type: Number,
  })
  id: number;

  /**
   * Name of the permission in the format journey:resource:action
   */
  @ApiProperty({
    description: 'Name of the permission in the format journey:resource:action',
    example: 'health:metrics:read',
    type: String,
  })
  name: string;

  /**
   * Human-readable description of what the permission allows
   */
  @ApiProperty({
    description: 'Human-readable description of what the permission allows',
    example: 'Permission to read health metrics',
    type: String,
  })
  description: string;

  /**
   * The journey this permission belongs to (health, care, plan)
   */
  @ApiProperty({
    description: 'The journey this permission belongs to',
    example: 'health',
    type: String,
  })
  journey: string;

  /**
   * The resource this permission applies to (metrics, appointments, claims, etc.)
   */
  @ApiProperty({
    description: 'The resource this permission applies to',
    example: 'metrics',
    type: String,
  })
  resource: string;

  /**
   * The action this permission allows (read, create, update, delete, etc.)
   */
  @ApiProperty({
    description: 'The action this permission allows',
    example: 'read',
    type: String,
  })
  action: string;

  /**
   * Timestamp of when the permission was created
   */
  @ApiProperty({
    description: 'Timestamp of when the permission was created',
    example: '2023-01-01T00:00:00.000Z',
    type: Date,
    required: false,
  })
  createdAt?: Date;

  /**
   * Timestamp of when the permission was last updated
   */
  @ApiProperty({
    description: 'Timestamp of when the permission was last updated',
    example: '2023-01-01T00:00:00.000Z',
    type: Date,
    required: false,
  })
  updatedAt?: Date;

  /**
   * Creates a new PermissionResponseDto instance
   * 
   * @param partial Partial permission data to initialize the instance with
   */
  constructor(partial?: Partial<PermissionResponseDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Creates a PermissionResponseDto from a Permission entity
   * 
   * @param permission The permission entity to convert
   * @returns A new PermissionResponseDto instance
   */
  static fromEntity(permission: Permission): PermissionResponseDto {
    return new PermissionResponseDto({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      journey: permission.journey,
      resource: permission.resource,
      action: permission.action,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }

  /**
   * Creates an array of PermissionResponseDto from an array of Permission entities
   * 
   * @param permissions The permission entities to convert
   * @returns An array of PermissionResponseDto instances
   */
  static fromEntities(permissions: Permission[]): PermissionResponseDto[] {
    return permissions.map(permission => this.fromEntity(permission));
  }
}