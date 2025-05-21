import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Data Transfer Object for pagination request parameters
 * Used to standardize pagination handling across all modules
 */
export class PaginationRequestDto {
  /**
   * Page number (1-based)
   */
  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  /**
   * Number of items per page
   */
  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 10;

  /**
   * Converts pagination parameters to Prisma skip/take format
   */
  toPrismaSkipTake(): { skip: number; take: number } {
    return {
      skip: (this.page - 1) * this.limit,
      take: this.limit,
    };
  }
}

/**
 * Data Transfer Object for pagination response metadata
 * Provides information about the pagination state
 */
export class PaginationResponseDto {
  /**
   * Current page number (1-based)
   */
  @ApiProperty({
    description: 'Current page number (1-based)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  page: number;

  /**
   * Number of items per page
   */
  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  @IsInt()
  @Min(1)
  limit: number;

  /**
   * Total number of items across all pages
   */
  @ApiProperty({
    description: 'Total number of items across all pages',
    example: 42,
  })
  @IsInt()
  @Min(0)
  totalItems: number;

  /**
   * Total number of pages
   */
  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  @IsInt()
  @Min(0)
  totalPages: number;

  /**
   * Whether there is a next page available
   */
  @ApiProperty({
    description: 'Whether there is a next page available',
    example: true,
  })
  hasNextPage: boolean;

  /**
   * Whether there is a previous page available
   */
  @ApiProperty({
    description: 'Whether there is a previous page available',
    example: false,
  })
  hasPreviousPage: boolean;

  /**
   * Creates a pagination response DTO from the provided parameters
   * 
   * @param page Current page number
   * @param limit Number of items per page
   * @param totalItems Total number of items across all pages
   * @returns A new PaginationResponseDto instance
   */
  static create(page: number, limit: number, totalItems: number): PaginationResponseDto {
    const totalPages = Math.ceil(totalItems / limit);
    
    const response = new PaginationResponseDto();
    response.page = page;
    response.limit = limit;
    response.totalItems = totalItems;
    response.totalPages = totalPages;
    response.hasNextPage = page < totalPages;
    response.hasPreviousPage = page > 1;
    
    return response;
  }
}

/**
 * Generic paginated response wrapper
 * Combines an array of items with pagination metadata
 * 
 * @template T Type of items in the paginated response
 */
export class PaginatedResponseDto<T> {
  /**
   * Array of items for the current page
   */
  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
  })
  @IsArray()
  items: T[];

  /**
   * Pagination metadata
   */
  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationResponseDto,
  })
  pagination: PaginationResponseDto;

  /**
   * Additional metadata (optional)
   */
  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { processingTimeMs: 123 },
  })
  @IsOptional()
  meta?: Record<string, any>;

  /**
   * Creates a paginated response DTO from the provided items and pagination parameters
   * 
   * @param items Array of items for the current page
   * @param page Current page number
   * @param limit Number of items per page
   * @param totalItems Total number of items across all pages
   * @param meta Additional metadata (optional)
   * @returns A new PaginatedResponseDto instance
   */
  static create<T>(
    items: T[],
    page: number,
    limit: number,
    totalItems: number,
    meta?: Record<string, any>,
  ): PaginatedResponseDto<T> {
    const response = new PaginatedResponseDto<T>();
    response.items = items;
    response.pagination = PaginationResponseDto.create(page, limit, totalItems);
    response.meta = meta;
    
    return response;
  }
}