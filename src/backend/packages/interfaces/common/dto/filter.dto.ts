/**
 * @file filter.dto.ts
 * @description Defines standardized filtering interfaces for repository queries
 * across all journey services in the AUSTA SuperApp.
 *
 * This DTO provides a consistent way to filter, sort, and shape query results
 * while maintaining journey-specific context for Health, Care, and Plan journeys.
 *
 * @package @austa/interfaces
 */

import { JourneyType } from '../../journey/types';

/**
 * Type definition for where clause conditions used in repository queries.
 * Provides a type-safe way to define filter conditions.
 * 
 * @example 
 * // Basic filtering
 * const where: WhereClause = { status: 'active', userId: '123' };
 * 
 * // Complex filtering with operators
 * const where: WhereClause = { 
 *   createdAt: { gte: new Date('2023-01-01') },
 *   status: { in: ['active', 'pending'] }
 * };
 */
export type WhereClause = Record<string, unknown>;

/**
 * Type definition for sorting criteria with direction.
 * Extracted from the original FilterDto for better modularity.
 * 
 * @example 
 * // Sort by creation date descending and name ascending
 * const sort: SortDto = { createdAt: 'desc', name: 'asc' };
 */
export interface SortDto {
  [field: string]: 'asc' | 'desc';
}

/**
 * Type definition for including related entities in query results.
 * Supports nested includes with filtering on related entities.
 * 
 * @example
 * // Include user data
 * const include: IncludeClause = { user: true };
 * 
 * // Include active appointments with their providers
 * const include: IncludeClause = { 
 *   appointments: { 
 *     where: { status: 'active' },
 *     include: { provider: true }
 *   }
 * };
 */
export type IncludeClause = {
  [relation: string]: boolean | {
    where?: WhereClause;
    include?: IncludeClause;
    select?: SelectClause;
    orderBy?: SortDto;
  };
};

/**
 * Type definition for selecting specific fields in query results.
 * Allows for precise control over returned data to optimize payload size.
 * 
 * @example
 * // Select only id, name and email fields
 * const select: SelectClause = { id: true, name: true, email: true };
 */
export type SelectClause = Record<string, boolean>;

/**
 * Main filter DTO interface that provides standardized filtering options
 * for repository queries across all journey services.
 * 
 * This interface is used throughout the application to ensure consistent
 * query patterns across all services while maintaining journey-specific context.
 */
export interface FilterDto {
  /**
   * Conditions for filtering records based on field values.
   * Supports complex conditions with operators like eq, ne, gt, gte, lt, lte, in, etc.
   */
  where?: WhereClause;
  
  /**
   * Sorting criteria for the results.
   * Replaced the original OrderByClause with SortDto for better modularity.
   */
  orderBy?: SortDto;
  
  /**
   * Related entities to include in the results.
   * Supports nested includes with their own filtering, sorting and selection.
   */
  include?: IncludeClause;
  
  /**
   * Fields to include in the results.
   * When not specified, typically returns all fields based on service defaults.
   */
  select?: SelectClause;
  
  /**
   * Journey context for the filter (health, care, plan).
   * Allows for journey-specific handling of common queries and proper context isolation.
   */
  journey?: JourneyType;
  
  /**
   * Maximum number of records to return.
   * Used for pagination in combination with skip.
   */
  take?: number;
  
  /**
   * Number of records to skip.
   * Used for pagination in combination with take.
   */
  skip?: number;
  
  /**
   * Whether to include soft-deleted records in the results.
   * Default is false in most repositories.
   */
  includeDeleted?: boolean;
}

/**
 * Extended filter DTO with cursor-based pagination support.
 * Useful for efficient pagination of large datasets.
 * 
 * @example
 * // Get next page after cursor
 * const filter: CursorFilterDto = {
 *   where: { status: 'active' },
 *   cursor: { id: '123' },
 *   take: 10
 * };
 */
export interface CursorFilterDto extends Omit<FilterDto, 'skip'> {
  /**
   * Cursor for pagination based on a unique identifier.
   * More efficient than offset pagination for large datasets.
   */
  cursor?: Record<string, unknown>;
}