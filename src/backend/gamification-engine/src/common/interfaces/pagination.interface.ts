/**
 * @file Pagination Interface
 * @description Defines standardized pagination interfaces used across all modules in the gamification engine.
 * Provides request and response interfaces for paginated queries, including page number, page size,
 * total count, and result collections. This file ensures consistent pagination behavior throughout the application.
 */

import { IPaginationRequest as BaseIPaginationRequest, IPaginationResponse as BaseIPaginationResponse } from '@austa/interfaces/common';
import { SortDirection } from '@austa/interfaces/common/dto';

/**
 * Interface for pagination request parameters
 * Extends the base pagination interface from @austa/interfaces/common
 */
export interface IPaginationRequest extends BaseIPaginationRequest {
  /** Current page number (1-based indexing) */
  page: number;
  
  /** Number of items per page */
  size: number;
  
  /** Optional sort parameters */
  sort?: ISortOptions;
}

/**
 * Interface for sort options
 */
export interface ISortOptions {
  /** Field to sort by */
  field: string;
  
  /** Sort direction (ascending or descending) */
  direction: SortDirection;
}

/**
 * Interface for pagination response
 * Extends the base pagination response interface from @austa/interfaces/common
 */
export interface IPaginationResponse<T> extends BaseIPaginationResponse<T> {
  /** Array of items for the current page */
  items: T[];
  
  /** Total number of items across all pages */
  total: number;
  
  /** Current page number */
  page: number;
  
  /** Number of items per page */
  size: number;
  
  /** Total number of pages */
  pages: number;
  
  /** Whether there is a next page available */
  hasNext: boolean;
  
  /** Whether there is a previous page available */
  hasPrevious: boolean;
}

/**
 * Utility type to convert an entity to a paginated response
 * @template T - The entity type
 * @template R - The response type
 */
export type ToPaginatedResponse<T, R> = {
  items: R[];
  total: number;
  page: number;
  size: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

/**
 * Creates a paginated response from an array of items and pagination parameters
 * @param items - Array of items for the current page
 * @param total - Total number of items across all pages
 * @param page - Current page number
 * @param size - Number of items per page
 * @returns Paginated response object
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  size: number,
): IPaginationResponse<T> {
  const pages = Math.ceil(total / size);
  
  return {
    items,
    total,
    page,
    size,
    pages,
    hasNext: page < pages,
    hasPrevious: page > 1,
  };
}

/**
 * Utility type for paginated entity responses
 * Useful for controller return types
 * @template T - The entity type
 */
export type PaginatedEntity<T> = IPaginationResponse<T>;

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: IPaginationRequest = {
  page: 1,
  size: 10,
};

/**
 * Maximum allowed page size to prevent performance issues
 */
export const MAX_PAGE_SIZE = 100;