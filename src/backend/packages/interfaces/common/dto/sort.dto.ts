/**
 * SortDto - Defines standardized sorting parameters for repository queries
 * across all journey services in the AUSTA SuperApp.
 *
 * This DTO provides a consistent way to specify sorting criteria for query results
 * while maintaining journey-specific context and supporting multi-field sorting
 * with priority ordering.
 */

/**
 * Enum for sort direction
 * Provides strongly typed options for ascending or descending sort order
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Interface for a single sort field with direction and priority
 * @property field - The field name to sort by
 * @property direction - The sort direction (ascending or descending)
 * @property priority - Optional priority value for multi-field sorting (lower values have higher priority)
 */
export interface SortField {
  field: string;
  direction: SortDirection;
  priority?: number;
}

/**
 * Type definition for simple sort clause using field-direction pairs
 * @example { createdAt: SortDirection.DESC, name: SortDirection.ASC }
 */
export type SimpleSortClause = Record<string, SortDirection>;

/**
 * Main sort DTO interface that provides standardized sorting options
 * for repository queries across all journey services.
 * 
 * Supports both simple field-direction pairs and advanced multi-field sorting with priority.
 */
export interface SortDto<JourneyType extends string = 'health' | 'care' | 'plan'> {
  /**
   * Simple sorting criteria using field-direction pairs
   * Use this for basic sorting needs when priority is not required
   * @example { createdAt: SortDirection.DESC }
   */
  simple?: SimpleSortClause;
  
  /**
   * Advanced sorting criteria with explicit field, direction, and priority
   * Use this for complex sorting with multiple fields and specific priority ordering
   * @example [{ field: 'createdAt', direction: SortDirection.DESC, priority: 1 }, { field: 'name', direction: SortDirection.ASC, priority: 2 }]
   */
  advanced?: SortField[];
  
  /**
   * Journey context for the sort operation (health, care, plan)
   * Allows for journey-specific validation of sort fields
   */
  journey?: JourneyType;
}

/**
 * Utility function to convert a SimpleSortClause to SortField[]
 * This allows internal standardization on the advanced format
 * @param simpleSort - The simple sort clause to convert
 * @returns Array of SortField objects with auto-assigned priorities
 * @example
 * // Input: { createdAt: SortDirection.DESC, name: SortDirection.ASC }
 * // Output: [{ field: 'createdAt', direction: SortDirection.DESC, priority: 1 }, { field: 'name', direction: SortDirection.ASC, priority: 2 }]
 */
export function convertSimpleToAdvanced(simpleSort: SimpleSortClause): SortField[] {
  return Object.entries(simpleSort).map(([field, direction], index) => ({
    field,
    direction,
    priority: index + 1
  }));
}

/**
 * Utility function to normalize a SortDto to a consistent SortField[] format
 * This simplifies processing by converting all sorting options to the advanced format
 * @param sortDto - The sort DTO to normalize
 * @returns Array of SortField objects sorted by priority
 */
export function normalizeSortDto(sortDto: SortDto): SortField[] {
  const result: SortField[] = [];
  
  // Process simple sort if provided
  if (sortDto.simple && Object.keys(sortDto.simple).length > 0) {
    result.push(...convertSimpleToAdvanced(sortDto.simple));
  }
  
  // Process advanced sort if provided
  if (sortDto.advanced && sortDto.advanced.length > 0) {
    result.push(...sortDto.advanced);
  }
  
  // Sort by priority (if specified)
  return result.sort((a, b) => {
    const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER;
    const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER;
    return priorityA - priorityB;
  });
}

/**
 * Type definition for journey-specific sort field validation
 * Maps journey types to arrays of valid sort field names
 */
export type JourneyValidSortFields = {
  health: string[];
  care: string[];
  plan: string[];
};

/**
 * Default valid sort fields for each journey
 * These are common fields that can be sorted across all journeys
 */
export const DEFAULT_VALID_SORT_FIELDS: JourneyValidSortFields = {
  health: ['id', 'createdAt', 'updatedAt', 'userId'],
  care: ['id', 'createdAt', 'updatedAt', 'userId'],
  plan: ['id', 'createdAt', 'updatedAt', 'userId']
};

/**
 * Utility function to validate sort fields against journey-specific valid fields
 * @param sortDto - The sort DTO to validate
 * @param validFields - Optional mapping of journey types to valid field names (defaults to DEFAULT_VALID_SORT_FIELDS)
 * @returns Boolean indicating whether all sort fields are valid for the specified journey
 */
export function validateSortFields(
  sortDto: SortDto,
  validFields: JourneyValidSortFields = DEFAULT_VALID_SORT_FIELDS
): boolean {
  // If no journey specified, validation passes
  if (!sortDto.journey) return true;
  
  // Get valid fields for the specified journey
  const journeyFields = validFields[sortDto.journey as keyof JourneyValidSortFields];
  if (!journeyFields) return false;
  
  // Normalize the sort DTO to get all fields
  const normalizedFields = normalizeSortDto(sortDto);
  
  // Check if all fields are valid for the journey
  return normalizedFields.every(field => journeyFields.includes(field.field));
}

/**
 * Utility function to convert a SortDto to a Prisma-compatible OrderByClause
 * This is useful when using the SortDto with Prisma ORM
 * @param sortDto - The sort DTO to convert
 * @returns Prisma-compatible order by clause
 * @example
 * // Input: { simple: { createdAt: SortDirection.DESC } }
 * // Output: { createdAt: 'desc' }
 */
export function toPrismaOrderBy(sortDto: SortDto): Record<string, 'asc' | 'desc'> {
  const normalizedFields = normalizeSortDto(sortDto);
  return normalizedFields.reduce((result, { field, direction }) => {
    result[field] = direction;
    return result;
  }, {} as Record<string, 'asc' | 'desc'>);
}