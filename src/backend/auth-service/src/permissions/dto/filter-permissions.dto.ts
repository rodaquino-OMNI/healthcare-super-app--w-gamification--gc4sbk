/**
 * @file Filter permissions DTO for the AUSTA SuperApp authentication system
 * @module auth-service/permissions/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FilterDto, OrderByClause } from '@backend/shared/src/dto/filter.dto';

/**
 * Enum for permission sorting fields
 */
export enum PermissionSortField {
  ID = 'id',
  NAME = 'name',
  JOURNEY = 'journey',
  RESOURCE = 'resource',
  ACTION = 'action',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Enum for sort directions
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Data Transfer Object for filtering and paginating permissions
 * Provides a structured approach to searching and filtering permissions with pagination support
 */
export class FilterPermissionsDto implements Partial<FilterDto> {
  /**
   * Current page number (1-based indexing)
   * @default 1
   */
  @ApiProperty({
    description: 'Page number (1-based indexing)',
    type: Number,
    default: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number = 1;

  /**
   * Number of items per page
   * @default 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    type: Number,
    default: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  limit?: number = 10;

  /**
   * Search term for filtering permissions by name, journey, resource, or action
   */
  @ApiProperty({
    description: 'Search term for filtering permissions by name, journey, resource, or action',
    type: String,
    required: false,
    example: 'health',
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  /**
   * Filter permissions by specific journey
   */
  @ApiProperty({
    description: 'Filter permissions by specific journey',
    type: String,
    required: false,
    example: 'health',
  })
  @IsOptional()
  @IsString({ message: 'Journey must be a string' })
  journey?: string;

  /**
   * Filter permissions by specific resource
   */
  @ApiProperty({
    description: 'Filter permissions by specific resource',
    type: String,
    required: false,
    example: 'metrics',
  })
  @IsOptional()
  @IsString({ message: 'Resource must be a string' })
  resource?: string;

  /**
   * Filter permissions by specific action
   */
  @ApiProperty({
    description: 'Filter permissions by specific action',
    type: String,
    required: false,
    example: 'read',
  })
  @IsOptional()
  @IsString({ message: 'Action must be a string' })
  action?: string;

  /**
   * Field to sort by
   * @default 'name'
   */
  @ApiProperty({
    description: 'Field to sort by',
    enum: PermissionSortField,
    default: PermissionSortField.NAME,
    required: false,
  })
  @IsOptional()
  @IsEnum(PermissionSortField, {
    message: `Sort field must be one of: ${Object.values(PermissionSortField).join(', ')}`,
  })
  sortBy?: PermissionSortField = PermissionSortField.NAME;

  /**
   * Sort direction
   * @default 'asc'
   */
  @ApiProperty({
    description: 'Sort direction',
    enum: SortDirection,
    default: SortDirection.ASC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortDirection, {
    message: `Sort direction must be one of: ${Object.values(SortDirection).join(', ')}`,
  })
  sortDirection?: SortDirection = SortDirection.ASC;

  /**
   * Converts the DTO to a FilterDto for use with repository queries
   * @returns FilterDto with properly formatted where and orderBy clauses
   */
  toFilterDto(): FilterDto {
    const filter: FilterDto = {
      where: {},
      orderBy: {},
      journey: 'auth',
    };

    // Add search filter if provided
    if (this.search) {
      filter.where = {
        OR: [
          { name: { contains: this.search, mode: 'insensitive' } },
          { journey: { contains: this.search, mode: 'insensitive' } },
          { resource: { contains: this.search, mode: 'insensitive' } },
          { action: { contains: this.search, mode: 'insensitive' } },
        ],
      };
    }

    // Add specific filters if provided
    if (this.journey) {
      filter.where = { ...filter.where, journey: this.journey };
    }

    if (this.resource) {
      filter.where = { ...filter.where, resource: this.resource };
    }

    if (this.action) {
      filter.where = { ...filter.where, action: this.action };
    }

    // Add sorting
    filter.orderBy = { [this.sortBy]: this.sortDirection } as OrderByClause;

    return filter;
  }

  /**
   * Calculates the number of items to skip for pagination
   * @returns Number of items to skip
   */
  getSkip(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Gets the limit for pagination
   * @returns Number of items per page
   */
  getLimit(): number {
    return this.limit;
  }
}