import { IsEnum, IsInt, IsOptional, IsUUID, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
// Using standardized path aliases for imports
import { IGameProfile } from '@austa/interfaces/gamification';

/**
 * Enum for sorting order options
 * Defines the direction of sorting (ascending or descending)
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Enum for profile sorting field options
 * Defines the valid fields that can be used for sorting game profiles
 */
export enum ProfileSortField {
  LEVEL = 'level',
  XP = 'xp',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

/**
 * Data Transfer Object for filtering and paginating game profiles.
 * Used by profile listing endpoints to validate and parse query parameters.
 * 
 * This DTO standardizes query parameters for retrieving and filtering game profiles
 * across the gamification engine, ensuring consistent API behavior and proper validation
 * of client input before database queries are executed.
 */
export class FilterProfilesDto {
  /**
   * Page number for pagination (1-based indexing)
   * @example 1
   */
  @ApiProperty({
    description: 'Page number (1-based indexing)',
    default: 1,
    minimum: 1,
    type: Number,
    required: false
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  /**
   * Number of items per page
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
    required: false
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  /**
   * Field to sort by
   * @example "level"
   */
  @ApiProperty({
    description: 'Field to sort by',
    enum: ProfileSortField,
    default: ProfileSortField.LEVEL,
    required: false
  })
  @IsEnum(ProfileSortField)
  @IsOptional()
  sortBy?: ProfileSortField = ProfileSortField.LEVEL;

  /**
   * Sort order (ascending or descending)
   * @example "desc"
   */
  @ApiProperty({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
    required: false
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  /**
   * Filter by minimum level
   * @example 5
   */
  @ApiProperty({
    description: 'Filter by minimum level',
    minimum: 1,
    type: Number,
    required: false
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  minLevel?: number;

  /**
   * Filter by maximum level
   * @example 10
   */
  @ApiProperty({
    description: 'Filter by maximum level',
    minimum: 1,
    type: Number,
    required: false
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  maxLevel?: number;

  /**
   * Filter by user ID
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'Filter by user ID',
    type: String,
    required: false
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  /**
   * Filter by profiles created after this date
   * @example "2023-01-01T00:00:00Z"
   */
  @ApiProperty({
    description: 'Filter by profiles created after this date',
    type: Date,
    required: false
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  createdAfter?: Date;

  /**
   * Filter by profiles created before this date
   * @example "2023-12-31T23:59:59Z"
   */
  @ApiProperty({
    description: 'Filter by profiles created before this date',
    type: Date,
    required: false
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  createdBefore?: Date;

  /**
   * Converts the DTO to a database query object compatible with Prisma
   * @returns Object with where, orderBy, skip, and take properties for database query
   */
  toQueryOptions(): {
    where: Record<string, any>;
    orderBy: Record<string, string>;
    skip: number;
    take: number;
  } {
    const where: Record<string, any> = {};
    
    // Add userId filter if provided
    if (this.userId) {
      where.userId = this.userId;
    }
    
    // Add level range filters if provided
    if (this.minLevel !== undefined || this.maxLevel !== undefined) {
      where.level = {};
      
      if (this.minLevel !== undefined) {
        where.level.gte = this.minLevel;
      }
      
      if (this.maxLevel !== undefined) {
        where.level.lte = this.maxLevel;
      }
    }
    
    // Add date range filters if provided
    if (this.createdAfter !== undefined || this.createdBefore !== undefined) {
      where.createdAt = {};
      
      if (this.createdAfter !== undefined) {
        where.createdAt.gte = this.createdAfter;
      }
      
      if (this.createdBefore !== undefined) {
        where.createdAt.lte = this.createdBefore;
      }
    }
    
    return {
      where,
      orderBy: { [this.sortBy]: this.sortOrder },
      skip: (this.page - 1) * this.limit,
      take: this.limit
    };
  }
}