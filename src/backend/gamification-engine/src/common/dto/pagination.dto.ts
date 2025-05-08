import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type as TransformType } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Default pagination values used throughout the gamification engine
 */
export const DEFAULT_PAGINATION = {
  /**
   * Default page number (1-based indexing)
   */
  PAGE: 1,
  
  /**
   * Default page size
   */
  SIZE: 10,
  
  /**
   * Minimum allowed page number
   */
  MIN_PAGE: 1,
  
  /**
   * Minimum allowed page size
   */
  MIN_SIZE: 1,
  
  /**
   * Maximum allowed page size to prevent performance issues
   */
  MAX_SIZE: 100,
};

/**
 * Data transfer object for pagination request parameters.
 * Used across all modules in the gamification engine to standardize
 * pagination handling in API endpoints.
 */
export class PaginationRequestDto {
  /**
   * Current page number (1-based indexing)
   * @example 1
   */
  @ApiProperty({
    description: 'Page number (1-based indexing)',
    default: DEFAULT_PAGINATION.PAGE,
    minimum: DEFAULT_PAGINATION.MIN_PAGE,
    type: Number,
  })
  @IsInt({ message: 'Page must be an integer' })
  @Min(DEFAULT_PAGINATION.MIN_PAGE, { message: `Page must be at least ${DEFAULT_PAGINATION.MIN_PAGE}` })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || DEFAULT_PAGINATION.PAGE)
  @TransformType(() => Number)
  page: number = DEFAULT_PAGINATION.PAGE;

  /**
   * Number of items per page
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    default: DEFAULT_PAGINATION.SIZE,
    minimum: DEFAULT_PAGINATION.MIN_SIZE,
    maximum: DEFAULT_PAGINATION.MAX_SIZE,
    type: Number,
  })
  @IsInt({ message: 'Size must be an integer' })
  @Min(DEFAULT_PAGINATION.MIN_SIZE, { message: `Size must be at least ${DEFAULT_PAGINATION.MIN_SIZE}` })
  @Max(DEFAULT_PAGINATION.MAX_SIZE, { message: `Size cannot exceed ${DEFAULT_PAGINATION.MAX_SIZE}` })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || DEFAULT_PAGINATION.SIZE)
  @TransformType(() => Number)
  size: number = DEFAULT_PAGINATION.SIZE;

  /**
   * Calculate the number of items to skip for database queries
   * @returns Number of items to skip
   */
  getSkip(): number {
    return (this.page - 1) * this.size;
  }

  /**
   * Get the take limit for database queries
   * @returns Number of items to take
   */
  getTake(): number {
    return this.size;
  }

  /**
   * Create pagination parameters for database queries
   * @returns Object with skip and take properties
   */
  toPrismaParams(): { skip: number; take: number } {
    return {
      skip: this.getSkip(),
      take: this.getTake(),
    };
  }
}

/**
 * Metadata for paginated responses providing information about
 * total items, pages, and current pagination state.
 */
export class PaginationMetaDto {
  /**
   * Current page number
   * @example 1
   */
  @ApiProperty({ description: 'Current page number', example: 1 })
  readonly page: number;

  /**
   * Number of items per page
   * @example 10
   */
  @ApiProperty({ description: 'Number of items per page', example: 10 })
  readonly size: number;

  /**
   * Total number of items across all pages
   * @example 100
   */
  @ApiProperty({ description: 'Total number of items', example: 100 })
  readonly totalItems: number;

  /**
   * Total number of pages
   * @example 10
   */
  @ApiProperty({ description: 'Total number of pages', example: 10 })
  readonly totalPages: number;

  /**
   * Whether there is a previous page available
   * @example false
   */
  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  readonly hasPreviousPage: boolean;

  /**
   * Whether there is a next page available
   * @example true
   */
  @ApiProperty({ description: 'Whether there is a next page', example: true })
  readonly hasNextPage: boolean;

  /**
   * Creates pagination metadata based on request parameters and total count
   * @param paginationRequestDto The pagination request parameters
   * @param totalItems Total number of items across all pages
   */
  constructor(paginationRequestDto: PaginationRequestDto, totalItems: number) {
    this.page = paginationRequestDto.page;
    this.size = paginationRequestDto.size;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(this.totalItems / this.size);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.totalPages;
  }
}

/**
 * Generic paginated response DTO that wraps any entity collection
 * with standardized pagination metadata.
 * @template T The entity type contained in the paginated response
 */
export class PaginationResponseDto<T> {
  /**
   * Array of items for the current page
   */
  @ApiProperty({ description: 'Array of items for the current page', isArray: true })
  readonly items: T[];

  /**
   * Pagination metadata
   */
  @ApiProperty({ description: 'Pagination metadata', type: PaginationMetaDto })
  readonly meta: PaginationMetaDto;

  /**
   * Creates a paginated response with items and metadata
   * @param items Array of items for the current page
   * @param meta Pagination metadata
   */
  constructor(items: T[], meta: PaginationMetaDto) {
    this.items = items;
    this.meta = meta;
  }

  /**
   * Static factory method to create a paginated response from items and pagination request
   * @param items Array of items for the current page
   * @param paginationRequestDto The pagination request parameters
   * @param totalItems Total number of items across all pages
   * @returns A new PaginationResponseDto instance
   */
  static create<T>(
    items: T[],
    paginationRequestDto: PaginationRequestDto,
    totalItems: number,
  ): PaginationResponseDto<T> {
    const meta = new PaginationMetaDto(paginationRequestDto, totalItems);
    return new PaginationResponseDto(items, meta);
  }
}

/**
 * Type function to create a class with pagination response structure
 * for a specific entity type. Useful for Swagger documentation.
 * @param itemType The class representing the entity type
 * @returns A class representing the paginated response for the entity type
 */
export function createPaginatedType<T>(itemType: Type<T>): Type<PaginationResponseDto<T>> {
  class PaginatedResponseType extends PaginationResponseDto<T> {
    @ApiProperty({ type: itemType, isArray: true })
    readonly items: T[];
  }
  
  // Set proper class name for reflection metadata
  Object.defineProperty(PaginatedResponseType, 'name', {
    value: `Paginated${itemType.name}`,
  });
  
  return PaginatedResponseType;
}