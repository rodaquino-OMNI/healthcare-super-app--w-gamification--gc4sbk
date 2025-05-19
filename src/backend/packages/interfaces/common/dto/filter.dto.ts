/**
 * @file filter.dto.ts
 * @description Defines standardized filtering interfaces for repository queries across all backend services.
 * This file provides type definitions for 'where' conditions, related entity inclusion, and field selection,
 * allowing consistent filtering patterns across all journey services.
 *
 * @module @austa/interfaces/common/dto
 */

import { JourneyType } from '@austa/interfaces/common/types';

/**
 * Type definition for where clause conditions used in database queries.
 * Provides a flexible structure for filtering records based on field values.
 *
 * @template T - The entity type being filtered
 * 
 * @example
 * // Filter active users with a specific role
 * const whereClause: WhereClause<User> = {
 *   status: 'active',
 *   role: { in: ['admin', 'manager'] },
 *   createdAt: { gte: new Date('2023-01-01') }
 * };
 */
export type WhereClause<T = Record<string, any>> = {
  [K in keyof T]?: T[K] | Record<string, any>;
} & Record<string, any>;

/**
 * Defines the direction for sorting query results.
 * 
 * @example
 * // Sort by creation date in descending order
 * const direction: SortDirection = 'desc';
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Type definition for sorting criteria in queries.
 * Extracted from the original FilterDto for better modularity.
 * 
 * @template T - The entity type being sorted
 * 
 * @example
 * // Sort users by name ascending and creation date descending
 * const sortClause: SortDto<User> = {
 *   name: 'asc',
 *   createdAt: 'desc'
 * };
 */
export type SortDto<T = Record<string, any>> = {
  [K in keyof T]?: SortDirection;
} & Record<string, SortDirection>;

/**
 * Type definition for including related entities in query results.
 * Supports both simple boolean inclusion and nested filtering of related entities.
 * 
 * @template T - The entity type with relations to include
 * 
 * @example
 * // Include user profile and active appointments
 * const includeClause: IncludeClause<Patient> = {
 *   profile: true,
 *   appointments: { where: { status: 'active' } }
 * };
 */
export type IncludeClause<T = Record<string, any>> = {
  [K in keyof T]?: boolean | Record<string, any>;
} & Record<string, boolean | Record<string, any>>;

/**
 * Type definition for selecting specific fields in query results.
 * Allows for precise control over which fields are returned.
 * 
 * @template T - The entity type whose fields are being selected
 * 
 * @example
 * // Select only id, name, and email fields
 * const selectClause: SelectClause<User> = {
 *   id: true,
 *   name: true,
 *   email: true
 * };
 */
export type SelectClause<T = Record<string, any>> = {
  [K in keyof T]?: boolean;
} & Record<string, boolean>;

/**
 * Configuration for pagination in query results.
 * 
 * @example
 * // Get the second page with 20 items per page
 * const paginationOptions: PaginationOptions = {
 *   page: 2,
 *   limit: 20
 * };
 */
export interface PaginationOptions {
  /**
   * The page number to retrieve (1-based indexing)
   * @default 1
   */
  page?: number;
  
  /**
   * The number of items per page
   * @default 10
   */
  limit?: number;
}

/**
 * Main filter DTO interface that provides standardized filtering options
 * for repository queries across all journey services.
 * 
 * This interface is used consistently across all backend services to ensure
 * uniform query handling and maintain journey-specific context.
 * 
 * @template T - The entity type being filtered
 * 
 * @example
 * // Complete filter for active users with pagination and sorting
 * const filter: FilterDto<User> = {
 *   where: { status: 'active', role: 'doctor' },
 *   orderBy: { createdAt: 'desc', lastName: 'asc' },
 *   include: { profile: true, appointments: { where: { status: 'scheduled' } } },
 *   select: { id: true, firstName: true, lastName: true, email: true },
 *   pagination: { page: 2, limit: 20 },
 *   journey: 'care'
 * };
 */
export interface FilterDto<T = Record<string, any>> {
  /**
   * Conditions for filtering records based on field values
   * @example { status: 'active', userId: '123' }
   */
  where?: WhereClause<T>;
  
  /**
   * Sorting criteria for the results
   * @example { createdAt: 'desc', name: 'asc' }
   */
  orderBy?: SortDto<T>;
  
  /**
   * Related entities to include in the results
   * @example { user: true, appointments: { where: { status: 'active' } } }
   */
  include?: IncludeClause<T>;
  
  /**
   * Fields to include in the results
   * @example { id: true, name: true, email: true }
   */
  select?: SelectClause<T>;
  
  /**
   * Pagination options for limiting and paging results
   * @example { page: 2, limit: 20 }
   */
  pagination?: PaginationOptions;
  
  /**
   * Journey context for the filter (health, care, plan)
   * Allows for journey-specific handling of common queries
   * @example 'health'
   */
  journey?: JourneyType;
}

/**
 * Type guard to check if an object conforms to the FilterDto interface
 * 
 * @param obj - The object to check
 * @returns True if the object is a valid FilterDto
 * 
 * @example
 * if (isFilterDto(queryParams)) {
 *   // Safe to use as FilterDto
 *   const results = await repository.findMany(queryParams);
 * }
 */
export function isFilterDto<T = Record<string, any>>(
  obj: unknown
): obj is FilterDto<T> {
  if (!obj || typeof obj !== 'object') return false;
  
  const filter = obj as Record<string, unknown>;
  
  // Check if any of the FilterDto properties exist and have the correct type
  const hasValidWhere = !filter.where || typeof filter.where === 'object';
  const hasValidOrderBy = !filter.orderBy || typeof filter.orderBy === 'object';
  const hasValidInclude = !filter.include || typeof filter.include === 'object';
  const hasValidSelect = !filter.select || typeof filter.select === 'object';
  const hasValidPagination = !filter.pagination || (
    typeof filter.pagination === 'object' &&
    (!('page' in filter.pagination) || typeof (filter.pagination as any).page === 'number') &&
    (!('limit' in filter.pagination) || typeof (filter.pagination as any).limit === 'number')
  );
  const hasValidJourney = !filter.journey || (
    typeof filter.journey === 'string' &&
    ['health', 'care', 'plan'].includes(filter.journey as string)
  );
  
  return (
    hasValidWhere &&
    hasValidOrderBy &&
    hasValidInclude &&
    hasValidSelect &&
    hasValidPagination &&
    hasValidJourney
  );
}

/**
 * Creates a default filter with empty values for all properties
 * 
 * @returns A new FilterDto with default values
 * 
 * @example
 * // Start with default filter and customize as needed
 * const filter = createDefaultFilter<User>();
 * filter.where = { status: 'active' };
 * filter.orderBy = { createdAt: 'desc' };
 */
export function createDefaultFilter<T = Record<string, any>>(): FilterDto<T> {
  return {
    where: {},
    orderBy: {},
    include: {},
    select: {},
    pagination: { page: 1, limit: 10 }
  } satisfies FilterDto<T>;
}