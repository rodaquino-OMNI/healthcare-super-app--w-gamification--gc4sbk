/**
 * @file pagination.dto.ts
 * @description Standardized pagination DTOs for the gamification engine.
 * 
 * This file implements the pagination interfaces from @austa/interfaces package
 * and provides class-validator decorators for validation. It includes:
 * 
 * - PaginationRequestDto: For handling pagination requests with validation
 * - PaginationMetaDto: For pagination metadata (current page, total items, etc.)
 * - PaginationResponseDto: Generic response wrapper with pagination metadata
 * 
 * Example usage in a controller:
 * 
 * ```typescript
 * @Get()
 * async findAll(@Query() paginationDto: PaginationRequestDto): Promise<PaginationResponseDto<ItemDto>> {
 *   const { items, count } = await this.service.findAll(paginationDto);
 *   return PaginationResponseDto.fromItems(items, count, paginationDto.page, paginationDto.size);
 * }
 * ```
 */

import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IPaginationRequest, IPaginationMeta, IPaginationResponse } from '@austa/interfaces';

/**
 * Data transfer object for pagination requests.
 * Used to standardize pagination parameters across all API endpoints.
 * Implements the IPaginationRequest interface from @austa/interfaces for consistency.
 */
export class PaginationRequestDto implements IPaginationRequest {
  /**
   * The page number to retrieve (1-based indexing).
   * @default 1
   * @example 1
   */
  @ApiProperty({
    description: 'Page number (1-based indexing)',
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  /**
   * The number of items to retrieve per page.
   * @default 10
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  size?: number = 10;

  /**
   * Calculates the number of items to skip based on page and size.
   * Used for database queries with skip/take pagination.
   */
  get skip(): number {
    return (this.page - 1) * this.size;
  }

  /**
   * Returns the number of items to take per page.
   * Alias for size property, used for database queries.
   */
  get take(): number {
    return this.size;
  }
}

/**
 * Metadata for paginated responses, containing information about
 * the current page, total items, and total pages.
 * Implements the IPaginationMeta interface from @austa/interfaces for consistency.
 */
export class PaginationMetaDto implements IPaginationMeta {
  /**
   * The current page number (1-based indexing).
   * @example 1
   */
  @ApiProperty({
    description: 'Current page number',
    type: Number,
    example: 1,
  })
  readonly page: number;

  /**
   * The number of items per page.
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    type: Number,
    example: 10,
  })
  readonly size: number;

  /**
   * The total number of items across all pages.
   * @example 100
   */
  @ApiProperty({
    description: 'Total number of items',
    type: Number,
    example: 100,
  })
  readonly totalItems: number;

  /**
   * The total number of pages.
   * @example 10
   */
  @ApiProperty({
    description: 'Total number of pages',
    type: Number,
    example: 10,
  })
  readonly totalPages: number;

  /**
   * Indicates if there is a previous page available.
   * @example false
   */
  @ApiProperty({
    description: 'Indicates if there is a previous page',
    type: Boolean,
    example: false,
  })
  readonly hasPreviousPage: boolean;

  /**
   * Indicates if there is a next page available.
   * @example true
   */
  @ApiProperty({
    description: 'Indicates if there is a next page',
    type: Boolean,
    example: true,
  })
  readonly hasNextPage: boolean;

  constructor(page: number, size: number, totalItems: number) {
    this.page = page;
    this.size = size;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / size);
    this.hasPreviousPage = page > 1;
    this.hasNextPage = page < this.totalPages;
  }
}

/**
 * Generic paginated response DTO that wraps any entity type with pagination metadata.
 * Implements the IPaginationResponse interface from @austa/interfaces for consistency.
 * @template T - The entity type contained in the paginated response
 */
export class PaginationResponseDto<T> implements IPaginationResponse<T> {
  /**
   * Array of items for the current page.
   */
  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
  })
  readonly items: T[];

  /**
   * Pagination metadata including page information and total counts.
   */
  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @ValidateNested()
  @Type(() => PaginationMetaDto)
  readonly meta: PaginationMetaDto;

  /**
   * Creates a new paginated response with the provided items and metadata.
   * @param items - Array of items for the current page
   * @param meta - Pagination metadata
   */
  constructor(items: T[], meta: PaginationMetaDto) {
    this.items = items;
    this.meta = meta;
  }

  /**
   * Creates a paginated response from an array of items and pagination parameters.
   * @param items - The array of items to paginate
   * @param totalItems - The total number of items across all pages
   * @param page - The current page number
   * @param size - The number of items per page
   * @returns A new PaginationResponseDto instance
   */
  static fromItems<T>(
    items: T[],
    totalItems: number,
    page: number,
    size: number,
  ): PaginationResponseDto<T> {
    const meta = new PaginationMetaDto(page, size, totalItems);
    return new PaginationResponseDto(items, meta);
  }

  /**
   * Creates an empty paginated response with zero items.
   * @param page - The current page number
   * @param size - The number of items per page
   * @returns A new PaginationResponseDto instance with an empty array
   */
  static empty<T>(page: number, size: number): PaginationResponseDto<T> {
    return PaginationResponseDto.fromItems<T>([], 0, page, size);
  }

  /**
   * Creates a paginated response from a database query result that includes count.
   * Useful when working with Prisma's findMany with count.
   * 
   * @param result - Object containing items array and count
   * @param page - The current page number
   * @param size - The number of items per page
   * @returns A new PaginationResponseDto instance
   */
  static fromPrismaResult<T>(
    result: { data: T[]; count: number },
    page: number,
    size: number,
  ): PaginationResponseDto<T> {
    return PaginationResponseDto.fromItems<T>(result.data, result.count, page, size);
  }

  /**
   * Maps the items in the paginated response using a transform function.
   * Useful for converting between entity and DTO types while preserving pagination metadata.
   * 
   * @param transform - Function to transform each item
   * @returns A new PaginationResponseDto with transformed items
   */
  map<R>(transform: (item: T) => R): PaginationResponseDto<R> {
    const transformedItems = this.items.map(transform);
    return new PaginationResponseDto<R>(transformedItems, this.meta);
  }
}