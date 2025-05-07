import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum for permission sorting options
 */
enum PermissionSortBy {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  ID_ASC = 'id_asc',
  ID_DESC = 'id_desc',
}

/**
 * Data Transfer Object for filtering permissions
 */
export class FilterPermissionsDto {
  /**
   * Optional search term to filter permissions by name
   */
  @ApiProperty({
    description: 'Search term to filter permissions by name',
    example: 'health',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  /**
   * Optional journey to filter permissions by
   */
  @ApiProperty({
    description: 'Journey to filter permissions by',
    example: 'health',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Journey must be a string' })
  journey?: string;

  /**
   * Optional resource to filter permissions by
   */
  @ApiProperty({
    description: 'Resource to filter permissions by',
    example: 'metrics',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Resource must be a string' })
  resource?: string;

  /**
   * Optional action to filter permissions by
   */
  @ApiProperty({
    description: 'Action to filter permissions by',
    example: 'read',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Action must be a string' })
  action?: string;

  /**
   * Optional page number for pagination
   */
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  /**
   * Optional page size for pagination
   */
  @ApiProperty({
    description: 'Page size for pagination',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  /**
   * Optional sort order for permissions
   */
  @ApiProperty({
    description: 'Sort order for permissions',
    enum: PermissionSortBy,
    default: PermissionSortBy.NAME_ASC,
    required: false,
  })
  @IsOptional()
  @IsEnum(PermissionSortBy, { message: 'Invalid sort option' })
  sortBy?: PermissionSortBy = PermissionSortBy.NAME_ASC;
}