/**
 * @file sort.dto.ts
 * @description Defines standardized sorting parameters for repository queries
 * across all journey services in the AUSTA SuperApp.
 *
 * This DTO provides a consistent way to sort query results while maintaining
 * journey-specific context and validation. It supports both simple single-field
 * sorting and complex multi-field sorting with priority ordering.
 */

/**
 * Enum for sort directions
 * Provides strongly typed options for ascending or descending sort order
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Interface for a single sort field specification
 * @example { field: 'createdAt', direction: SortDirection.DESC }
 */
export interface SortField {
  /** The field name to sort by */
  field: string;
  /** The direction to sort (ascending or descending) */
  direction: SortDirection;
}

/**
 * Interface for multi-field sorting with priority
 * @example { fields: [{ field: 'priority', direction: SortDirection.DESC }, { field: 'createdAt', direction: SortDirection.ASC }] }
 */
export interface MultiFieldSort {
  /** Array of sort fields in priority order (first field has highest priority) */
  fields: SortField[];
}

/**
 * Type definition for legacy OrderByClause from FilterDto
 * Maintained for backward compatibility
 * @example { createdAt: 'desc', name: 'asc' }
 * @deprecated Use SortField or MultiFieldSort instead
 */
export type OrderByClause = Record<string, SortDirection>;

/**
 * Main SortDto interface that provides standardized sorting options
 * for repository queries across all journey services.
 */
export interface SortDto {
  /**
   * Single field sorting specification
   * Use this for simple sorting by a single field
   * @example { field: 'createdAt', direction: SortDirection.DESC }
   */
  sort?: SortField;

  /**
   * Multi-field sorting specification with priority ordering
   * Use this for complex sorting by multiple fields
   * @example { fields: [{ field: 'status', direction: SortDirection.ASC }, { field: 'createdAt', direction: SortDirection.DESC }] }
   */
  multiSort?: MultiFieldSort;

  /**
   * Legacy sorting format from FilterDto
   * Maintained for backward compatibility
   * @example { createdAt: 'desc', name: 'asc' }
   * @deprecated Use sort or multiSort instead
   */
  orderBy?: OrderByClause;

  /**
   * Journey context for the sort (health, care, plan)
   * Allows for journey-specific validation of sort fields
   */
  journey?: string;
}

/**
 * Utility function to convert legacy OrderByClause to MultiFieldSort
 * @param orderBy - Legacy OrderByClause object
 * @returns MultiFieldSort object
 * @example
 * // Input: { createdAt: 'desc', name: 'asc' }
 * // Output: { fields: [{ field: 'createdAt', direction: SortDirection.DESC }, { field: 'name', direction: SortDirection.ASC }] }
 */
export function convertOrderByToMultiSort(orderBy: OrderByClause): MultiFieldSort {
  return {
    fields: Object.entries(orderBy).map(([field, direction]) => ({
      field,
      direction: direction as SortDirection
    }))
  };
}

/**
 * Utility function to normalize different sorting formats into MultiFieldSort
 * @param sortDto - SortDto object that may contain sort, multiSort, or orderBy
 * @returns MultiFieldSort object or undefined if no sorting specified
 * @example
 * // Input with sort: { sort: { field: 'createdAt', direction: SortDirection.DESC } }
 * // Output: { fields: [{ field: 'createdAt', direction: SortDirection.DESC }] }
 * 
 * // Input with multiSort: { multiSort: { fields: [{ field: 'status', direction: SortDirection.ASC }, { field: 'createdAt', direction: SortDirection.DESC }] } }
 * // Output: { fields: [{ field: 'status', direction: SortDirection.ASC }, { field: 'createdAt', direction: SortDirection.DESC }] }
 * 
 * // Input with orderBy: { orderBy: { createdAt: 'desc', name: 'asc' } }
 * // Output: { fields: [{ field: 'createdAt', direction: SortDirection.DESC }, { field: 'name', direction: SortDirection.ASC }] }
 */
export function normalizeSortDto(sortDto?: SortDto): MultiFieldSort | undefined {
  if (!sortDto) return undefined;

  if (sortDto.multiSort) {
    return sortDto.multiSort;
  }

  if (sortDto.sort) {
    return {
      fields: [sortDto.sort]
    };
  }

  if (sortDto.orderBy) {
    return convertOrderByToMultiSort(sortDto.orderBy);
  }

  return undefined;
}

/**
 * Utility function to validate sort fields against a list of allowed fields
 * @param sortDto - SortDto object to validate
 * @param allowedFields - Array of field names that are allowed for sorting
 * @returns boolean indicating if all sort fields are valid
 * @throws Error if any sort field is not in the allowed fields list
 * @example
 * // Valid: validateSortFields({ sort: { field: 'createdAt', direction: SortDirection.DESC } }, ['createdAt', 'name'])
 * // Invalid: validateSortFields({ sort: { field: 'invalidField', direction: SortDirection.ASC } }, ['createdAt', 'name'])
 */
export function validateSortFields(sortDto: SortDto, allowedFields: string[]): boolean {
  const normalizedSort = normalizeSortDto(sortDto);
  if (!normalizedSort) return true;

  for (const { field } of normalizedSort.fields) {
    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid sort field: ${field}. Allowed fields are: ${allowedFields.join(', ')}`);
    }
  }

  return true;
}

/**
 * Journey-specific allowed sort fields
 * These maps define which fields can be sorted for each journey
 */
export const JOURNEY_SORT_FIELDS = {
  health: [
    'id',
    'userId',
    'createdAt',
    'updatedAt',
    'metricType',
    'metricValue',
    'recordedAt',
    'goalProgress',
    'deviceId'
  ],
  care: [
    'id',
    'userId',
    'createdAt',
    'updatedAt',
    'appointmentDate',
    'status',
    'providerId',
    'specialtyType',
    'priority'
  ],
  plan: [
    'id',
    'userId',
    'createdAt',
    'updatedAt',
    'planType',
    'coverageStart',
    'coverageEnd',
    'premium',
    'status',
    'claimAmount',
    'submissionDate',
    'benefitType'
  ]
};

/**
 * Utility function to validate sort fields based on journey context
 * @param sortDto - SortDto object to validate
 * @returns boolean indicating if all sort fields are valid for the specified journey
 * @throws Error if any sort field is not valid for the journey
 * @example
 * // Valid: validateJourneySortFields({ sort: { field: 'metricValue', direction: SortDirection.DESC }, journey: 'health' })
 * // Invalid: validateJourneySortFields({ sort: { field: 'appointmentDate', direction: SortDirection.ASC }, journey: 'health' })
 */
export function validateJourneySortFields(sortDto: SortDto): boolean {
  if (!sortDto.journey) return true;
  
  const journeyFields = JOURNEY_SORT_FIELDS[sortDto.journey as keyof typeof JOURNEY_SORT_FIELDS];
  if (!journeyFields) {
    throw new Error(`Invalid journey: ${sortDto.journey}. Allowed journeys are: ${Object.keys(JOURNEY_SORT_FIELDS).join(', ')}`);
  }

  return validateSortFields(sortDto, journeyFields);
}

/**
 * Utility function to convert MultiFieldSort to Prisma orderBy format
 * @param multiSort - MultiFieldSort object
 * @returns Prisma-compatible orderBy object
 * @example
 * // Input: { fields: [{ field: 'createdAt', direction: SortDirection.DESC }, { field: 'name', direction: SortDirection.ASC }] }
 * // Output: { createdAt: 'desc', name: 'asc' }
 */
export function toPrismaOrderBy(multiSort: MultiFieldSort): Record<string, string> {
  return multiSort.fields.reduce((orderBy, { field, direction }) => {
    orderBy[field] = direction;
    return orderBy;
  }, {} as Record<string, string>);
}