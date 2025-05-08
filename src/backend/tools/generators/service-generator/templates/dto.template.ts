import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from 'class-validator';
import { <%= className %>Interface } from '@austa/interfaces/journey/<%= journeyName %>';

/**
 * Data Transfer Object for <%= className %> entities in the AUSTA SuperApp.
 * 
 * This DTO implements the <%= className %>Interface from @austa/interfaces to ensure
 * consistent type definitions across all services. It includes validation rules
 * using class-validator decorators and enhanced Swagger documentation.
 *
 * @version 1.0.0
 * @journey <%= journeyName %>
 */
export class <%= className %>Dto implements <%= className %>Interface {
  /**
   * Unique identifier for the <%= className %>.
   * 
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @IsUUID('4', { message: 'ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

  /**
   * Name or title of the <%= className %>.
   * 
   * @example '<%= className %> Title'
   */
  @ApiProperty({
    description: 'Name or title',
    example: '<%= className %> Title',
    maxLength: 255
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name: string;

  /**
   * Optional description of the <%= className %>.
   * 
   * @example 'Detailed description of the <%= className %>'
   */
  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'Detailed description of the <%= className %>',
    nullable: true
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  /**
   * Creation timestamp of the <%= className %>.
   * 
   * @example '2023-01-01T00:00:00Z'
   */
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00Z',
    type: Date
  })
  @IsDate({ message: 'Created at must be a valid date' })
  @Type(() => Date)
  createdAt: Date;

  /**
   * Last update timestamp of the <%= className %>.
   * 
   * @example '2023-01-01T00:00:00Z'
   */
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00Z',
    type: Date
  })
  @IsDate({ message: 'Updated at must be a valid date' })
  @Type(() => Date)
  updatedAt: Date;

  /**
   * Version number for tracking changes and ensuring backward compatibility.
   * 
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Version number for tracking changes',
    example: 1,
    default: 1
  })
  @IsInt({ message: 'Version must be an integer' })
  @IsPositive({ message: 'Version must be a positive number' })
  @IsOptional()
  version?: number;

  /**
   * Journey context marker for journey-specific data handling.
   * This field helps identify which journey this DTO belongs to.
   * 
   * @example '<%= journeyName %>'
   */
  @ApiPropertyOptional({
    description: 'Journey context marker',
    example: '<%= journeyName %>',
    enum: ['health', 'care', 'plan']
  })
  @IsString({ message: 'Journey context must be a string' })
  @IsOptional()
  journeyContext?: string = '<%= journeyName %>';
}

/**
 * Data Transfer Object for creating a new <%= className %> entity.
 * Extends the base <%= className %>Dto with specific validation for creation operations.
 * 
 * @version 1.0.0
 * @journey <%= journeyName %>
 */
export class Create<%= className %>Dto implements Partial<Omit<<%= className %>Interface, 'id' | 'createdAt' | 'updatedAt'>> {
  /**
   * Name or title of the <%= className %>.
   * 
   * @example '<%= className %> Title'
   */
  @ApiProperty({
    description: 'Name or title',
    example: '<%= className %> Title',
    maxLength: 255
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name: string;

  /**
   * Optional description of the <%= className %>.
   * 
   * @example 'Detailed description of the <%= className %>'
   */
  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'Detailed description of the <%= className %>',
    nullable: true
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  /**
   * Journey context marker for journey-specific data handling.
   * This field helps identify which journey this DTO belongs to.
   * 
   * @example '<%= journeyName %>'
   */
  @ApiPropertyOptional({
    description: 'Journey context marker',
    example: '<%= journeyName %>',
    enum: ['health', 'care', 'plan']
  })
  @IsString({ message: 'Journey context must be a string' })
  @IsOptional()
  journeyContext?: string = '<%= journeyName %>';
}

/**
 * Data Transfer Object for updating an existing <%= className %> entity.
 * Makes all fields optional to support partial updates.
 * 
 * @version 1.0.0
 * @journey <%= journeyName %>
 */
export class Update<%= className %>Dto implements Partial<Omit<<%= className %>Interface, 'id' | 'createdAt' | 'updatedAt'>> {
  /**
   * Name or title of the <%= className %>.
   * 
   * @example '<%= className %> Title'
   */
  @ApiPropertyOptional({
    description: 'Name or title',
    example: '<%= className %> Title',
    maxLength: 255
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name?: string;

  /**
   * Optional description of the <%= className %>.
   * 
   * @example 'Detailed description of the <%= className %>'
   */
  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'Detailed description of the <%= className %>',
    nullable: true
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  /**
   * Version number for optimistic concurrency control.
   * If provided, the update will only succeed if the current version matches.
   * 
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Version number for optimistic concurrency control',
    example: 1
  })
  @IsInt({ message: 'Version must be an integer' })
  @IsPositive({ message: 'Version must be a positive number' })
  @IsOptional()
  version?: number;
}

/**
 * Data Transfer Object for filtering <%= className %> entities.
 * Used for search and list operations with pagination support.
 * 
 * @version 1.0.0
 * @journey <%= journeyName %>
 */
export class Filter<%= className %>Dto {
  /**
   * Optional search term to filter <%= className %> entities by name or description.
   * 
   * @example 'search term'
   */
  @ApiPropertyOptional({
    description: 'Search term to filter by name or description',
    example: 'search term'
  })
  @IsString({ message: 'Search term must be a string' })
  @IsOptional()
  search?: string;

  /**
   * Optional date range for filtering by creation date.
   * 
   * @example { from: '2023-01-01T00:00:00Z', to: '2023-12-31T23:59:59Z' }
   */
  @ApiPropertyOptional({
    description: 'Date range for filtering by creation date',
    example: { from: '2023-01-01T00:00:00Z', to: '2023-12-31T23:59:59Z' }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  createdAt?: DateRangeDto;

  /**
   * Journey context marker for journey-specific data handling.
   * This field helps identify which journey this DTO belongs to.
   * 
   * @example '<%= journeyName %>'
   */
  @ApiPropertyOptional({
    description: 'Journey context marker',
    example: '<%= journeyName %>',
    enum: ['health', 'care', 'plan']
  })
  @IsString({ message: 'Journey context must be a string' })
  @IsOptional()
  journeyContext?: string = '<%= journeyName %>';
}

/**
 * Helper DTO for date range filtering.
 * Used by Filter<%= className %>Dto for date-based queries.
 */
class DateRangeDto {
  /**
   * Start date of the range.
   * 
   * @example '2023-01-01T00:00:00Z'
   */
  @ApiPropertyOptional({
    description: 'Start date of the range',
    example: '2023-01-01T00:00:00Z',
    type: Date
  })
  @IsDate({ message: 'From date must be a valid date' })
  @IsOptional()
  @Type(() => Date)
  from?: Date;

  /**
   * End date of the range.
   * 
   * @example '2023-12-31T23:59:59Z'
   */
  @ApiPropertyOptional({
    description: 'End date of the range',
    example: '2023-12-31T23:59:59Z',
    type: Date
  })
  @IsDate({ message: 'To date must be a valid date' })
  @IsOptional()
  @Type(() => Date)
  to?: Date;
}