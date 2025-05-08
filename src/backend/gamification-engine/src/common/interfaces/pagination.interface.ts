/**
 * @file Pagination Interface
 * @description Defines standardized pagination interfaces used across all modules in the gamification engine.
 * These interfaces provide consistent pagination behavior for API endpoints and database queries.
 * Integration with @austa/interfaces ensures type safety and consistent pagination patterns across the platform.
 */

// Import shared interfaces from @austa/interfaces
import { common } from '@austa/interfaces';

/**
 * @interface ISortDirection
 * @description Enum defining the possible sort directions for paginated queries
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * @interface ISortOption
 * @description Interface for defining sort options in paginated requests
 * @property {string} field - The field to sort by
 * @property {SortDirection} direction - The direction to sort (ascending or descending)
 */
export interface ISortOption {
  field: string;
  direction: SortDirection;
}

/**
 * @interface IPaginationRequest
 * @description Interface for pagination request parameters used in API endpoints and service methods
 * @property {number} page - The page number to retrieve (1-based indexing)
 * @property {number} size - The number of items per page
 * @property {ISortOption[]} [sort] - Optional sorting criteria
 */
export interface IPaginationRequest {
  page: number;
  size: number;
  sort?: ISortOption[];
}

/**
 * @interface IPaginationMeta
 * @description Interface for pagination metadata included in paginated responses
 * @property {number} page - The current page number
 * @property {number} size - The number of items per page
 * @property {number} total - The total number of items across all pages
 * @property {number} pages - The total number of pages
 * @property {boolean} hasNext - Whether there is a next page available
 * @property {boolean} hasPrevious - Whether there is a previous page available
 */
export interface IPaginationMeta {
  page: number;
  size: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * @interface IPaginationResponse
 * @description Generic interface for paginated responses returned by API endpoints and service methods
 * @template T - The type of items in the paginated response
 * @property {T[]} items - The array of items for the current page
 * @property {IPaginationMeta} meta - Metadata about the pagination state
 */
export interface IPaginationResponse<T> {
  items: T[];
  meta: IPaginationMeta;
}

/**
 * @interface IPaginationOptions
 * @description Extended pagination options for internal service methods
 * @extends IPaginationRequest
 * @property {Record<string, unknown>} [filter] - Optional filter criteria
 * @property {boolean} [includeDeleted] - Whether to include soft-deleted items
 */
export interface IPaginationOptions extends IPaginationRequest {
  filter?: Record<string, unknown>;
  includeDeleted?: boolean;
}

/**
 * Type utility for creating a paginated response from an array of items and pagination metadata
 * @param items - Array of items to include in the response
 * @param total - Total number of items across all pages
 * @param options - Pagination options used for the request
 * @returns A properly formatted IPaginationResponse object
 * 
 * @example
 * // Create a paginated response for achievements
 * const achievements = await this.repository.findMany({ skip, take, where });
 * const total = await this.repository.count({ where });
 * return createPaginatedResponse(achievements, total, paginationOptions);
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  options: IPaginationRequest
): IPaginationResponse<T> {
  const { page, size } = options;
  const pages = Math.ceil(total / size);
  
  return {
    items,
    meta: {
      page,
      size,
      total,
      pages,
      hasNext: page < pages,
      hasPrevious: page > 1,
    },
  };
}

/**
 * Type utility for converting a database query result to a paginated response
 * @template T - The entity type
 * @template R - The response DTO type
 */
export type PaginatedResponse<T> = IPaginationResponse<T>;

/**
 * Type utility for extracting pagination parameters from a request object
 * @param request - The request object containing pagination parameters
 * @param defaultSize - The default page size if not specified
 * @returns Standardized pagination parameters
 * 
 * @example
 * // Extract pagination parameters from a request
 * const { page, size, sort } = extractPaginationParams(request, 20);
 */
export function extractPaginationParams(
  request: Partial<IPaginationRequest>,
  defaultSize = 10
): IPaginationRequest {
  const page = Math.max(1, request.page || 1);
  const size = Math.max(1, Math.min(100, request.size || defaultSize));
  
  return {
    page,
    size,
    sort: request.sort,
  };
}

/**
 * Type utility for calculating database query skip/take parameters from pagination request
 * @param pagination - The pagination request parameters
 * @returns Object with skip and take properties for database queries
 * 
 * @example
 * // Calculate skip/take for a database query
 * const { skip, take } = getPaginationSkipTake(paginationRequest);
 * const results = await prisma.achievement.findMany({ skip, take });
 */
export function getPaginationSkipTake(pagination: IPaginationRequest): { skip: number; take: number } {
  const { page, size } = extractPaginationParams(pagination);
  
  return {
    skip: (page - 1) * size,
    take: size,
  };
}

/**
 * Type utility for converting sort options to database-specific sort parameters
 * @param sort - Array of sort options
 * @returns Database-specific sort parameters (e.g., for Prisma)
 * 
 * @example
 * // Convert sort options to Prisma orderBy
 * const orderBy = convertSortToDatabaseParams(paginationRequest.sort);
 * const results = await prisma.achievement.findMany({ orderBy });
 */
export function convertSortToDatabaseParams<T extends Record<string, unknown>>(
  sort?: ISortOption[]
): Record<string, string>[] | undefined {
  if (!sort || sort.length === 0) {
    return undefined;
  }
  
  return sort.map(({ field, direction }) => ({
    [field]: direction.toLowerCase(),
  }));
}