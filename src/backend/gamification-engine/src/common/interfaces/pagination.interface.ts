/**
 * @file Pagination Interface
 * @description Defines standardized pagination interfaces used across all modules in the gamification engine.
 * Provides request and response interfaces for paginated queries, including page number, page size,
 * total count, and result collections.
 */

import { PaginationDto, PaginatedResponse } from '@austa/interfaces/common/dto/pagination.dto';

/**
 * Interface for pagination request parameters.
 * Used for requesting paginated data from services and repositories.
 */
export interface IPaginationRequest {
  /**
   * The page number to retrieve (1-based indexing).
   * @default 1
   */
  page: number;

  /**
   * The number of items per page.
   * @default 10
   */
  size: number;

  /**
   * Optional cursor for cursor-based pagination.
   * Used as an alternative to page-based pagination for better performance with large datasets.
   */
  cursor?: string;

  /**
   * Optional flag to include total count in the response.
   * May be disabled for performance reasons with large datasets.
   * @default true
   */
  includeTotal?: boolean;
}

/**
 * Interface for pagination response metadata.
 * Contains information about the current page, total items, and navigation links.
 */
export interface IPaginationMeta {
  /**
   * The current page number (1-based indexing).
   */
  currentPage: number;

  /**
   * The number of items per page.
   */
  itemsPerPage: number;

  /**
   * The total number of items across all pages.
   * May be omitted if includeTotal was false in the request.
   */
  totalItems?: number;

  /**
   * The total number of pages.
   * May be omitted if includeTotal was false in the request.
   */
  totalPages?: number;

  /**
   * Optional cursor for the next page.
   * Used for cursor-based pagination.
   */
  nextCursor?: string;

  /**
   * Optional cursor for the previous page.
   * Used for cursor-based pagination.
   */
  prevCursor?: string;

  /**
   * Flag indicating if there is a next page available.
   */
  hasNextPage: boolean;

  /**
   * Flag indicating if there is a previous page available.
   */
  hasPrevPage: boolean;
}

/**
 * Interface for paginated response data.
 * Contains the paginated data items and pagination metadata.
 * 
 * @template T - The type of items in the paginated response
 */
export interface IPaginatedResponse<T> {
  /**
   * The array of data items for the current page.
   */
  data: T[];

  /**
   * Metadata about the pagination state.
   */
  meta: IPaginationMeta;
}

/**
 * Type for converting a PaginationDto from @austa/interfaces to an IPaginationRequest.
 * Ensures compatibility between the shared PaginationDto and the local IPaginationRequest interface.
 */
export type PaginationDtoToRequest = PaginationDto & Partial<Omit<IPaginationRequest, 'page' | 'size'>>;

/**
 * Type for converting an IPaginatedResponse to a PaginatedResponse from @austa/interfaces.
 * Ensures compatibility between the local IPaginatedResponse and the shared PaginatedResponse interface.
 * 
 * @template T - The type of items in the paginated response
 */
export type PaginatedResponseToDto<T> = PaginatedResponse<T>;

/**
 * Converts a PaginationDto from @austa/interfaces to an IPaginationRequest.
 * 
 * @param dto - The PaginationDto to convert
 * @returns An IPaginationRequest with the same pagination parameters
 */
export function convertPaginationDtoToRequest(dto: PaginationDto): IPaginationRequest {
  return {
    page: dto.page || 1,
    size: dto.limit || 10,
    cursor: dto.cursor,
    includeTotal: dto.includeTotal !== false
  };
}

/**
 * Converts an IPaginatedResponse to a PaginatedResponse from @austa/interfaces.
 * 
 * @template T - The type of items in the paginated response
 * @param response - The IPaginatedResponse to convert
 * @returns A PaginatedResponse with the same data and metadata
 */
export function convertPaginatedResponseToDto<T>(
  response: IPaginatedResponse<T>
): PaginatedResponse<T> {
  return {
    data: response.data,
    meta: {
      currentPage: response.meta.currentPage,
      itemsPerPage: response.meta.itemsPerPage,
      totalItems: response.meta.totalItems,
      totalPages: response.meta.totalPages,
      hasNextPage: response.meta.hasNextPage,
      hasPrevPage: response.meta.hasPrevPage
    }
  };
}

/**
 * Creates an empty paginated response with no data items.
 * Useful for returning an empty result set with proper pagination metadata.
 * 
 * @template T - The type of items in the paginated response
 * @param request - The pagination request parameters
 * @returns An empty IPaginatedResponse with appropriate metadata
 */
export function createEmptyPaginatedResponse<T>(
  request: IPaginationRequest
): IPaginatedResponse<T> {
  return {
    data: [],
    meta: {
      currentPage: request.page,
      itemsPerPage: request.size,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: request.page > 1
    }
  };
}