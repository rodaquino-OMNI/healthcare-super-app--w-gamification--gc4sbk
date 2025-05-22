/**
 * PaginationDto - Defines standardized pagination parameters for API endpoints
 * across all journey services in the AUSTA SuperApp.
 *
 * This DTO provides a consistent way to paginate API results while supporting
 * both page-based and cursor-based pagination strategies with appropriate
 * validation rules and default values.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Enum for pagination strategy
 * Provides strongly typed options for page-based or cursor-based pagination
 */
export enum PaginationStrategy {
  PAGE_BASED = 'page-based',
  CURSOR_BASED = 'cursor-based',
}

/**
 * Base pagination DTO interface that provides common pagination properties
 * shared across all pagination strategies.
 */
export interface BasePaginationDto {
  /**
   * Maximum number of items to return per page/request
   * @example 10
   */
  limit: number;

  /**
   * Pagination strategy to use (page-based or cursor-based)
   * @example PaginationStrategy.PAGE_BASED
   */
  strategy?: PaginationStrategy;

  /**
   * Journey context for the pagination (health, care, plan)
   * Allows for journey-specific handling of pagination
   */
  journey?: string;
}

/**
 * Main pagination DTO class that provides standardized pagination parameters
 * for API endpoints across all journey services.
 * 
 * Supports both page-based pagination (page number and items per page) and
 * cursor-based pagination (cursor and limit) with appropriate validation.
 */
export class PaginationDto implements BasePaginationDto {
  /**
   * Current page number (1-based indexing)
   * Only used with page-based pagination strategy
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Page number (1-based indexing)',
    type: Number,
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than or equal to 1' })
  @Type(() => Number)
  @ValidateIf((o) => o.strategy !== PaginationStrategy.CURSOR_BASED)
  page?: number = 1;

  /**
   * Maximum number of items to return per page/request
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be greater than or equal to 1' })
  @Max(100, { message: 'Limit must be less than or equal to 100' })
  @Type(() => Number)
  limit: number = 10;

  /**
   * Cursor for pagination (typically the ID of the last item in the previous page)
   * Only used with cursor-based pagination strategy
   * @example 'dGhpcyBpcyBhIGN1cnNvcg=='
   */
  @ApiPropertyOptional({
    description: 'Cursor for pagination (ID of the last item in the previous page)',
    type: String,
    example: 'dGhpcyBpcyBhIGN1cnNvcg==',
  })
  @IsOptional()
  @IsString({ message: 'Cursor must be a string' })
  @ValidateIf((o) => o.strategy === PaginationStrategy.CURSOR_BASED)
  cursor?: string;

  /**
   * Pagination strategy to use (page-based or cursor-based)
   * Defaults to page-based pagination if not specified
   * @example PaginationStrategy.PAGE_BASED
   */
  @ApiPropertyOptional({
    description: 'Pagination strategy to use',
    enum: PaginationStrategy,
    default: PaginationStrategy.PAGE_BASED,
    example: PaginationStrategy.PAGE_BASED,
  })
  @IsOptional()
  @IsEnum(PaginationStrategy, {
    message: `Strategy must be one of: ${Object.values(PaginationStrategy).join(', ')}`,
  })
  strategy?: PaginationStrategy = PaginationStrategy.PAGE_BASED;

  /**
   * Journey context for the pagination (health, care, plan)
   * Allows for journey-specific handling of pagination
   * @example 'health'
   */
  @ApiPropertyOptional({
    description: 'Journey context for the pagination',
    type: String,
    example: 'health',
  })
  @IsOptional()
  @IsString({ message: 'Journey must be a string' })
  journey?: string;
}

/**
 * Interface for pagination metadata
 * Contains information about the current pagination state
 */
export interface PaginationMeta {
  /**
   * Total number of items available
   * @example 100
   */
  total: number;

  /**
   * Current page number (only for page-based pagination)
   * @example 1
   */
  page?: number;

  /**
   * Number of items per page
   * @example 10
   */
  limit: number;

  /**
   * Total number of pages available (only for page-based pagination)
   * @example 10
   */
  pages?: number;

  /**
   * Whether there is a next page/more items available
   * @example true
   */
  hasNext: boolean;

  /**
   * Whether there is a previous page
   * @example false
   */
  hasPrevious: boolean;

  /**
   * Cursor for the next page (only for cursor-based pagination)
   * @example 'dGhpcyBpcyBhIGN1cnNvcg=='
   */
  nextCursor?: string;

  /**
   * Cursor for the previous page (only for cursor-based pagination)
   * @example 'cHJldmlvdXMgY3Vyc29y'
   */
  previousCursor?: string;
}

/**
 * Generic interface for paginated responses
 * @template T - The type of items being paginated
 */
export interface PaginatedResponse<T> {
  /**
   * Array of items for the current page
   */
  data: T[];

  /**
   * Pagination metadata
   */
  meta: PaginationMeta;
}

/**
 * Utility function to calculate pagination metadata for page-based pagination
 * @param total - Total number of items available
 * @param page - Current page number
 * @param limit - Number of items per page
 * @returns Pagination metadata
 */
export function createPagePaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const pages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrevious: page > 1,
  };
}

/**
 * Utility function to calculate pagination metadata for cursor-based pagination
 * @param total - Total number of items available
 * @param limit - Number of items per page
 * @param hasNext - Whether there are more items available
 * @param hasPrevious - Whether there are previous items available
 * @param nextCursor - Cursor for the next page
 * @param previousCursor - Cursor for the previous page
 * @returns Pagination metadata
 */
export function createCursorPaginationMeta(
  total: number,
  limit: number,
  hasNext: boolean,
  hasPrevious: boolean,
  nextCursor?: string,
  previousCursor?: string,
): PaginationMeta {
  return {
    total,
    limit,
    hasNext,
    hasPrevious,
    nextCursor,
    previousCursor,
  };
}