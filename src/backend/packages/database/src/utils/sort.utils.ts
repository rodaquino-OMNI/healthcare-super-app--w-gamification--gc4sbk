/**
 * @file sort.utils.ts
 * @description Provides sorting utilities for database queries, offering type-safe construction
 * of sort criteria for Prisma queries across journey services. Implements multi-field sorting
 * with direction control (ASC/DESC) and nulls handling (NULLS FIRST/LAST). Includes specialized
 * sorting for time-series data in TimescaleDB with performance optimizations.
 */

import { Prisma } from '@prisma/client';
import {
  SortOptions,
  SortSpec,
  SortDirection,
  NullsPosition,
  PrismaOrderByInput,
  OrderByInputType,
  JourneyContext,
  JourneyType,
} from '../types/query.types';

/**
 * Error thrown when invalid sort options are provided.
 */
export class InvalidSortOptionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSortOptionsError';
  }
}

/**
 * Converts a sort direction to a Prisma sort order.
 * @param direction The sort direction
 * @returns The Prisma sort order
 */
export function toPrismaSortOrder(direction: SortDirection): Prisma.SortOrder {
  return direction === SortDirection.ASC ? Prisma.SortOrder.asc : Prisma.SortOrder.desc;
}

/**
 * Converts a nulls position to a Prisma nulls order.
 * @param nullsPosition The nulls position
 * @returns The Prisma nulls order
 */
export function toPrismaNullsOrder(nullsPosition?: NullsPosition): Prisma.NullsOrder | undefined {
  if (!nullsPosition) return undefined;
  return nullsPosition === NullsPosition.FIRST ? Prisma.NullsOrder.first : Prisma.NullsOrder.last;
}

/**
 * Creates a sort specification for a field.
 * @param field The field to sort by
 * @param direction The direction to sort (ascending or descending)
 * @param nulls How to handle null values in sorting
 * @returns A sort specification
 */
export function createSortSpec(field: string, direction: SortDirection = SortDirection.ASC, nulls?: NullsPosition): SortSpec {
  return { field, direction, nulls };
}

/**
 * Creates sort options with multiple sort specifications.
 * @param sorts Array of sort specifications in priority order
 * @param journeyContext Optional journey context for journey-specific sorting
 * @returns Sort options
 */
export function createSortOptions(sorts: SortSpec[], journeyContext?: JourneyContext): SortOptions {
  if (!sorts || sorts.length === 0) {
    throw new InvalidSortOptionsError('Sort specifications cannot be empty');
  }
  return { sorts, journeyContext };
}

/**
 * Converts a field path with dot notation to a nested Prisma orderBy structure.
 * @param field The field path (e.g., 'user.profile.name')
 * @param sortOrder The Prisma sort order
 * @param nullsOrder The Prisma nulls order
 * @returns A nested Prisma orderBy structure
 */
export function createNestedOrderBy(field: string, sortOrder: Prisma.SortOrder, nullsOrder?: Prisma.NullsOrder): any {
  const parts = field.split('.');
  const lastPart = parts.pop()!;
  
  let result: any = {};
  if (nullsOrder) {
    result[lastPart] = { sort: sortOrder, nulls: nullsOrder };
  } else {
    result[lastPart] = sortOrder;
  }
  
  let current = result;
  while (parts.length > 0) {
    const part = parts.pop()!;
    const temp: any = {};
    temp[part] = current;
    current = temp;
  }
  
  return result;
}

/**
 * Converts a sort specification to a Prisma orderBy input.
 * @param sortSpec The sort specification
 * @returns A Prisma orderBy input
 */
export function sortSpecToPrismaOrderBy<T>(sortSpec: SortSpec): PrismaOrderByInput<T> {
  const sortOrder = toPrismaSortOrder(sortSpec.direction);
  const nullsOrder = toPrismaNullsOrder(sortSpec.nulls);
  
  if (sortSpec.field.includes('.')) {
    return createNestedOrderBy(sortSpec.field, sortOrder, nullsOrder);
  }
  
  if (nullsOrder) {
    return { [sortSpec.field]: { sort: sortOrder, nulls: nullsOrder } } as PrismaOrderByInput<T>;
  }
  
  return { [sortSpec.field]: sortOrder } as PrismaOrderByInput<T>;
}

/**
 * Converts multiple sort specifications to a Prisma orderBy input.
 * For single sort specs, returns a simple object.
 * For multiple sort specs, returns an array of orderBy objects.
 * @param sortSpecs The sort specifications
 * @returns A Prisma orderBy input
 */
export function sortSpecsToPrismaOrderBy<T>(sortSpecs: SortSpec[]): PrismaOrderByInput<T> | PrismaOrderByInput<T>[] {
  if (sortSpecs.length === 1) {
    return sortSpecToPrismaOrderBy<T>(sortSpecs[0]);
  }
  
  return sortSpecs.map(spec => sortSpecToPrismaOrderBy<T>(spec));
}

/**
 * Converts sort options to a Prisma orderBy input.
 * @param sortOptions The sort options
 * @returns A Prisma orderBy input
 */
export function sortOptionsToPrismaOrderBy<T>(sortOptions: SortOptions): PrismaOrderByInput<T> | PrismaOrderByInput<T>[] {
  return sortSpecsToPrismaOrderBy<T>(sortOptions.sorts);
}

/**
 * Applies sort options to a Prisma query.
 * @param query The Prisma query
 * @param sortOptions The sort options
 * @returns The Prisma query with sorting applied
 */
export function applySorting<T extends any>(query: any, sortOptions?: SortOptions): any {
  if (!sortOptions || !sortOptions.sorts || sortOptions.sorts.length === 0) {
    return query;
  }
  
  const orderBy = sortOptionsToPrismaOrderBy<T>(sortOptions);
  return query.orderBy(orderBy);
}

// TimescaleDB-specific sort utilities

/**
 * Creates a TimescaleDB-specific sort specification for time-series data.
 * @param timeField The timestamp field to sort by
 * @param direction The direction to sort
 * @returns A sort specification optimized for TimescaleDB
 */
export function createTimeSeriesSortSpec(timeField: string = 'timestamp', direction: SortDirection = SortDirection.DESC): SortSpec {
  return createSortSpec(timeField, direction);
}

/**
 * Creates TimescaleDB-specific sort options for time-series data with a secondary sort field.
 * @param timeField The timestamp field to sort by
 * @param secondaryField Optional secondary field to sort by
 * @param timeDirection The direction to sort the timestamp field
 * @param secondaryDirection The direction to sort the secondary field
 * @returns Sort options optimized for TimescaleDB
 */
export function createTimeSeriesSortOptions(
  timeField: string = 'timestamp',
  secondaryField?: string,
  timeDirection: SortDirection = SortDirection.DESC,
  secondaryDirection: SortDirection = SortDirection.ASC
): SortOptions {
  const sorts: SortSpec[] = [createSortSpec(timeField, timeDirection)];
  
  if (secondaryField) {
    sorts.push(createSortSpec(secondaryField, secondaryDirection));
  }
  
  return createSortOptions(sorts);
}

/**
 * Applies TimescaleDB-specific optimizations to sort options.
 * @param sortOptions The sort options
 * @returns Optimized sort options for TimescaleDB
 */
export function optimizeTimeSeriesSorting(sortOptions: SortOptions): SortOptions {
  // TimescaleDB performs better with specific index-aware sorting strategies
  // This function would implement those optimizations
  return sortOptions;
}

// Journey-specific sort utilities

/**
 * Creates sort options for health metrics, optimized for the Health journey.
 * @param direction The direction to sort by timestamp
 * @param includeMetricType Whether to include metric type as a secondary sort
 * @returns Sort options for health metrics
 */
export function createHealthMetricSortOptions(direction: SortDirection = SortDirection.DESC, includeMetricType: boolean = false): SortOptions {
  const sorts: SortSpec[] = [createSortSpec('timestamp', direction)];
  
  if (includeMetricType) {
    sorts.push(createSortSpec('metricType', SortDirection.ASC));
  }
  
  return createSortOptions(sorts, { journeyType: 'HEALTH' });
}

/**
 * Creates sort options for health goals, optimized for the Health journey.
 * @param field The field to sort by (default: 'targetDate')
 * @param direction The direction to sort
 * @returns Sort options for health goals
 */
export function createHealthGoalSortOptions(field: 'targetDate' | 'progress' | 'createdAt' = 'targetDate', direction: SortDirection = SortDirection.ASC): SortOptions {
  return createSortOptions([createSortSpec(field, direction)], { journeyType: 'HEALTH' });
}

/**
 * Creates sort options for appointments, optimized for the Care journey.
 * @param direction The direction to sort by date
 * @param includeStatus Whether to include status as a secondary sort
 * @returns Sort options for appointments
 */
export function createAppointmentSortOptions(direction: SortDirection = SortDirection.ASC, includeStatus: boolean = true): SortOptions {
  const sorts: SortSpec[] = [createSortSpec('date', direction)];
  
  if (includeStatus) {
    sorts.push(createSortSpec('status', SortDirection.ASC));
  }
  
  return createSortOptions(sorts, { journeyType: 'CARE' });
}

/**
 * Creates sort options for medications, optimized for the Care journey.
 * @param field The field to sort by
 * @param direction The direction to sort
 * @returns Sort options for medications
 */
export function createMedicationSortOptions(field: 'name' | 'nextDose' | 'createdAt' = 'nextDose', direction: SortDirection = SortDirection.ASC): SortOptions {
  return createSortOptions([createSortSpec(field, direction)], { journeyType: 'CARE' });
}

/**
 * Creates sort options for insurance plans, optimized for the Plan journey.
 * @param field The field to sort by
 * @param direction The direction to sort
 * @returns Sort options for insurance plans
 */
export function createPlanSortOptions(field: 'name' | 'effectiveDate' | 'premium' = 'effectiveDate', direction: SortDirection = SortDirection.DESC): SortOptions {
  return createSortOptions([createSortSpec(field, direction)], { journeyType: 'PLAN' });
}

/**
 * Creates sort options for claims, optimized for the Plan journey.
 * @param field The field to sort by
 * @param direction The direction to sort
 * @returns Sort options for claims
 */
export function createClaimSortOptions(field: 'submissionDate' | 'status' | 'amount' = 'submissionDate', direction: SortDirection = SortDirection.DESC): SortOptions {
  return createSortOptions([createSortSpec(field, direction)], { journeyType: 'PLAN' });
}

// Performance optimization utilities

/**
 * Analyzes sort options and suggests index optimizations.
 * @param sortOptions The sort options to analyze
 * @param journeyType The journey type for context-specific optimizations
 * @returns Suggestions for index optimizations
 */
export function analyzeSortPerformance(sortOptions: SortOptions, journeyType?: JourneyType): string[] {
  const suggestions: string[] = [];
  const fields = sortOptions.sorts.map(sort => sort.field);
  
  // Check for common performance patterns and suggest optimizations
  if (fields.length > 2) {
    suggestions.push(`Consider creating a composite index for fields: ${fields.join(', ')}`);
  }
  
  // Journey-specific suggestions
  if (journeyType === 'HEALTH' && fields.includes('timestamp')) {
    suggestions.push('For time-series health data, consider using TimescaleDB hypertable partitioning');
  }
  
  if (journeyType === 'CARE' && fields.includes('date')) {
    suggestions.push('For appointment queries, ensure a B-tree index on the date field');
  }
  
  if (journeyType === 'PLAN' && fields.includes('status')) {
    suggestions.push('For claim status queries, consider a partial index on active claims');
  }
  
  return suggestions;
}

/**
 * Optimizes sort options based on the database type and query patterns.
 * @param sortOptions The sort options to optimize
 * @param databaseType The type of database being used
 * @returns Optimized sort options
 */
export function optimizeSortOptions(sortOptions: SortOptions, databaseType: 'postgres' | 'timescaledb' = 'postgres'): SortOptions {
  if (databaseType === 'timescaledb') {
    return optimizeTimeSeriesSorting(sortOptions);
  }
  
  // For standard PostgreSQL, we can apply different optimizations
  // This is a placeholder for future optimizations
  return sortOptions;
}

/**
 * Creates a sort strategy function that can be reused for similar queries.
 * @param baseOptions The base sort options to use
 * @returns A function that can be used to apply consistent sorting with variations
 */
export function createSortStrategy<T>(baseOptions: SortOptions): {
  apply: (query: any) => any;
  withDirection: (direction: SortDirection) => (query: any) => any;
  withField: (field: string, direction?: SortDirection) => (query: any) => any;
} {
  return {
    apply: (query: any) => applySorting<T>(query, baseOptions),
    withDirection: (direction: SortDirection) => (query: any) => {
      const newOptions = {
        ...baseOptions,
        sorts: baseOptions.sorts.map(sort => ({ ...sort, direction }))
      };
      return applySorting<T>(query, newOptions);
    },
    withField: (field: string, direction: SortDirection = SortDirection.ASC) => (query: any) => {
      const newOptions = {
        ...baseOptions,
        sorts: [{ field, direction }, ...baseOptions.sorts]
      };
      return applySorting<T>(query, newOptions);
    }
  };
}

/**
 * Utility for creating common sort patterns.
 * @returns An object with methods for creating common sort patterns
 */
export const SortPatterns = {
  /**
   * Creates sort options for sorting by creation date.
   * @param direction The direction to sort
   * @returns Sort options for sorting by creation date
   */
  byCreatedAt: (direction: SortDirection = SortDirection.DESC): SortOptions => {
    return createSortOptions([createSortSpec('createdAt', direction)]);
  },
  
  /**
   * Creates sort options for sorting by update date.
   * @param direction The direction to sort
   * @returns Sort options for sorting by update date
   */
  byUpdatedAt: (direction: SortDirection = SortDirection.DESC): SortOptions => {
    return createSortOptions([createSortSpec('updatedAt', direction)]);
  },
  
  /**
   * Creates sort options for sorting by name.
   * @param direction The direction to sort
   * @returns Sort options for sorting by name
   */
  byName: (direction: SortDirection = SortDirection.ASC): SortOptions => {
    return createSortOptions([createSortSpec('name', direction)]);
  },
  
  /**
   * Creates sort options for sorting by date.
   * @param field The date field to sort by
   * @param direction The direction to sort
   * @returns Sort options for sorting by date
   */
  byDate: (field: string = 'date', direction: SortDirection = SortDirection.DESC): SortOptions => {
    return createSortOptions([createSortSpec(field, direction)]);
  },
  
  /**
   * Creates sort options for sorting by status.
   * @param statusField The status field to sort by
   * @param direction The direction to sort
   * @returns Sort options for sorting by status
   */
  byStatus: (statusField: string = 'status', direction: SortDirection = SortDirection.ASC): SortOptions => {
    return createSortOptions([createSortSpec(statusField, direction)]);
  },
  
  /**
   * Creates sort options for sorting by relevance (typically used with search).
   * @param relevanceField The field containing relevance scores
   * @returns Sort options for sorting by relevance
   */
  byRelevance: (relevanceField: string = '_relevance'): SortOptions => {
    return createSortOptions([createSortSpec(relevanceField, SortDirection.DESC)]);
  },
  
  /**
   * Creates sort options for sorting by multiple fields.
   * @param fieldDirections Object mapping fields to sort directions
   * @returns Sort options for sorting by multiple fields
   */
  byMultipleFields: (fieldDirections: Record<string, SortDirection>): SortOptions => {
    const sorts = Object.entries(fieldDirections).map(
      ([field, direction]) => createSortSpec(field, direction)
    );
    return createSortOptions(sorts);
  }
};