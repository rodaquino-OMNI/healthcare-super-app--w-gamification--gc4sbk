/**
 * Pagination DTO - Defines standardized pagination parameters for API endpoints
 * across all journey services in the AUSTA SuperApp.
 *
 * This DTO provides a consistent way to paginate API responses while supporting
 * both traditional page-based pagination and cursor-based pagination for
 * improved performance with large datasets.
 *
 * @module @austa/interfaces/common/dto
 */

import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base pagination class with common properties for all pagination types
 */
export class BasePaginationDto {
  /**
   * Maximum number of items to return per page
   * @default 20
   * @minimum 1
   * @maximum 100
   */
  @ApiProperty({
    description: 'Maximum number of items to return',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  /**
   * Journey context for the pagination (health, care, plan)
   * Allows for journey-specific handling of pagination
   */
  @ApiPropertyOptional({
    description: 'Journey context for pagination',
    enum: ['health', 'care', 'plan'],
    example: 'health',
  })
  @IsString()
  @IsOptional()
  journey?: string;
}

/**
 * Page-based pagination DTO
 * Uses page number and items per page for pagination
 */
export class PagePaginationDto extends BasePaginationDto {
  /**
   * Page number (1-based indexing)
   * @default 1
   * @minimum 1
   */
  @ApiProperty({
    description: 'Page number (1-based indexing)',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  /**
   * Validates that cursor is not present when using page-based pagination
   */
  @ValidateIf((o) => o.cursor !== undefined)
  @IsOptional()
  cursor?: never;
}

/**
 * Cursor-based pagination DTO
 * Uses a cursor string for efficient pagination of large datasets
 */
export class CursorPaginationDto extends BasePaginationDto {
  /**
   * Cursor string for pagination
   * Typically an encoded representation of the last item's ID or timestamp
   */
  @ApiProperty({
    description: 'Cursor string for pagination',
    example: 'WyIyMDIzLTAzLTAxVDAwOjAwOjAwLjAwMFoiLDEwMF0=',
  })
  @IsString()
  cursor: string;

  /**
   * Validates that page is not present when using cursor-based pagination
   */
  @ValidateIf((o) => o.page !== undefined)
  @IsOptional()
  page?: never;
}

/**
 * Union type for both pagination types
 * Allows API endpoints to accept either page-based or cursor-based pagination
 */
export type PaginationDto = PagePaginationDto | CursorPaginationDto;

/**
 * Standard pagination response metadata
 * Provides information about the current pagination state
 */
export interface PaginationMeta {
  /**
   * Total number of items available
   */
  totalItems: number;

  /**
   * Number of items returned in the current page
   */
  itemCount: number;

  /**
   * Total number of pages available (for page-based pagination)
   */
  totalPages?: number;

  /**
   * Current page number (for page-based pagination)
   */
  currentPage?: number;

  /**
   * Next cursor for fetching the next page (for cursor-based pagination)
   */
  nextCursor?: string;

  /**
   * Previous cursor for fetching the previous page (for cursor-based pagination)
   */
  prevCursor?: string;

  /**
   * Whether there are more items available
   */
  hasNextPage: boolean;

  /**
   * Whether there are previous items available
   */
  hasPrevPage: boolean;
}

/**
 * Standard paginated response wrapper
 * Provides a consistent structure for paginated API responses
 */
export interface PaginatedResponse<T> {
  /**
   * Array of items for the current page
   */
  items: T[];

  /**
   * Pagination metadata
   */
  meta: PaginationMeta;
}