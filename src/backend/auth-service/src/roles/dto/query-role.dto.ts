import { 
  IsString, 
  IsBoolean, 
  IsOptional, 
  IsEnum, 
  MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@austa/interfaces/common';

/**
 * Enum representing the valid journey types in the AUSTA SuperApp.
 * Used for type-safe filtering of roles by journey.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global'
}

/**
 * Data transfer object for querying roles in the AUSTA SuperApp.
 * Provides type-safe parameters for filtering roles with proper validation.
 * Extends the standard PaginationDto for consistent pagination across services.
 */
export class QueryRoleDto implements PaginationDto {
  /**
   * Current page number (1-based)
   * @example 1
   */
  @IsOptional()
  @Transform(({ value }) => value && parseInt(value))
  page?: number;
  
  /**
   * Number of items per page
   * @example 10
   */
  @IsOptional()
  @Transform(({ value }) => value && parseInt(value))
  limit?: number;
  
  /**
   * Number of items to skip (alternative to page)
   * Used for offset-based pagination
   * @example 20
   */
  @IsOptional()
  @Transform(({ value }) => value && parseInt(value))
  skip?: number;
  
  /**
   * Cursor-based pagination identifier
   * Used for cursor-based pagination when preferred over offset-based pagination
   * @example "YXJyYXljb25uZWN0aW9uOjIw"
   */
  @IsOptional()
  @IsString({ message: 'Cursor must be a string' })
  cursor?: string;

  /**
   * Filter roles by name (case-insensitive partial match)
   * @example "admin"
   */
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  /**
   * Filter roles by description (case-insensitive partial match)
   * @example "system"
   */
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  /**
   * Filter roles by journey type
   * Allows filtering roles specific to health, care, plan journeys, or global roles
   * @example "health"
   */
  @IsOptional()
  @IsEnum(JourneyType, { 
    message: `Journey must be one of: ${Object.values(JourneyType).join(', ')}` 
  })
  @Transform(({ value }) => value?.toLowerCase())
  journey?: JourneyType;

  /**
   * Filter roles by default status
   * When true, returns only default roles assigned to new users
   * When false, returns only non-default roles
   * @example true
   */
  @IsOptional()
  @IsBoolean({ message: 'isDefault must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isDefault?: boolean;

  /**
   * Sort field for ordering results
   * @example "name"
   */
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  @IsEnum(['id', 'name', 'description', 'journey', 'isDefault', 'createdAt', 'updatedAt'], {
    message: 'Sort field must be one of: id, name, description, journey, isDefault, createdAt, updatedAt'
  })
  sortBy?: string;

  /**
   * Sort direction for ordering results
   * @example "asc"
   */
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort direction must be either asc or desc' })
  @Transform(({ value }) => value?.toLowerCase())
  sortDirection?: 'asc' | 'desc';

  /**
   * Include related permissions in the response
   * @example true
   */
  @IsOptional()
  @IsBoolean({ message: 'includePermissions must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includePermissions?: boolean;
}