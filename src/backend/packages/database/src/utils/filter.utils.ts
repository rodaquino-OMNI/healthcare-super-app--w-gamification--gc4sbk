/**
 * @file filter.utils.ts
 * @description Provides comprehensive filtering utilities for constructing type-safe Prisma filters
 * across all journey services. Implements filters for common data types with support for various
 * operators and includes journey-specific filtering helpers with built-in performance optimizations.
 */

import { Prisma } from '@prisma/client';
import { InvalidParameterError, MalformedRequestError } from '@austa/errors';
import { MetricType } from '@austa/interfaces/journey/health';
import { AppointmentStatus } from '@austa/interfaces/journey/care';
import { ClaimStatus } from '@austa/interfaces/journey/plan';

/**
 * Base filter types for different data types
 */

/**
 * String filter operations supported by the filter utilities
 */
export type StringFilterOperator = 
  | 'equals' 
  | 'not' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith' 
  | 'in' 
  | 'notIn';

/**
 * Number filter operations supported by the filter utilities
 */
export type NumberFilterOperator = 
  | 'equals' 
  | 'not' 
  | 'lt' 
  | 'lte' 
  | 'gt' 
  | 'gte' 
  | 'in' 
  | 'notIn';

/**
 * Boolean filter operations supported by the filter utilities
 */
export type BooleanFilterOperator = 
  | 'equals' 
  | 'not';

/**
 * Date filter operations supported by the filter utilities
 */
export type DateFilterOperator = 
  | 'equals' 
  | 'not' 
  | 'lt' 
  | 'lte' 
  | 'gt' 
  | 'gte' 
  | 'in' 
  | 'notIn';

/**
 * Enum filter operations supported by the filter utilities
 */
export type EnumFilterOperator = 
  | 'equals' 
  | 'not' 
  | 'in' 
  | 'notIn';

/**
 * Logical filter operations for combining multiple filters
 */
export type LogicalFilterOperator = 'AND' | 'OR' | 'NOT';

/**
 * Base filter interface for all filter types
 */
export interface BaseFilter {
  field: string;
  operator: string;
  value: any;
}

/**
 * String filter interface for filtering string fields
 */
export interface StringFilter extends BaseFilter {
  operator: StringFilterOperator;
  value: string | string[];
}

/**
 * Number filter interface for filtering numeric fields
 */
export interface NumberFilter extends BaseFilter {
  operator: NumberFilterOperator;
  value: number | number[];
}

/**
 * Boolean filter interface for filtering boolean fields
 */
export interface BooleanFilter extends BaseFilter {
  operator: BooleanFilterOperator;
  value: boolean;
}

/**
 * Date filter interface for filtering date fields
 */
export interface DateFilter extends BaseFilter {
  operator: DateFilterOperator;
  value: Date | Date[];
}

/**
 * Enum filter interface for filtering enum fields
 */
export interface EnumFilter extends BaseFilter {
  operator: EnumFilterOperator;
  value: string | string[];
}

/**
 * Logical filter interface for combining multiple filters
 */
export interface LogicalFilter {
  operator: LogicalFilterOperator;
  filters: Array<StringFilter | NumberFilter | BooleanFilter | DateFilter | EnumFilter | LogicalFilter>;
}

/**
 * Union type of all possible filter types
 */
export type Filter = StringFilter | NumberFilter | BooleanFilter | DateFilter | EnumFilter | LogicalFilter;

/**
 * Type for a filter condition that can be applied to a Prisma query
 */
export type FilterCondition = Record<string, any>;

/**
 * Error messages for filter validation
 */
const ERROR_MESSAGES = {
  INVALID_FILTER_TYPE: 'Invalid filter type provided',
  INVALID_OPERATOR: 'Invalid operator for filter type',
  INVALID_VALUE_TYPE: 'Invalid value type for filter operator',
  MISSING_FIELD: 'Filter field is required',
  MISSING_OPERATOR: 'Filter operator is required',
  MISSING_VALUE: 'Filter value is required',
  INVALID_LOGICAL_FILTER: 'Logical filter must contain an array of filters',
};

/**
 * Validates a string filter and throws an error if invalid
 * @param filter The string filter to validate
 * @throws {InvalidParameterError} If the filter is invalid
 */
export function validateStringFilter(filter: StringFilter): void {
  if (!filter.field) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_FIELD);
  }

  if (!filter.operator) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_OPERATOR);
  }

  const validOperators: StringFilterOperator[] = [
    'equals', 'not', 'contains', 'startsWith', 'endsWith', 'in', 'notIn'
  ];

  if (!validOperators.includes(filter.operator)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_OPERATOR}: ${filter.operator} for string filter`
    );
  }

  if (filter.value === undefined || filter.value === null) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_VALUE);
  }

  // Check if value type matches operator expectations
  if (['in', 'notIn'].includes(filter.operator) && !Array.isArray(filter.value)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: ${filter.operator} requires an array value`
    );
  }

  if (!['in', 'notIn'].includes(filter.operator) && Array.isArray(filter.value)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: ${filter.operator} requires a string value, not an array`
    );
  }
}

/**
 * Validates a number filter and throws an error if invalid
 * @param filter The number filter to validate
 * @throws {InvalidParameterError} If the filter is invalid
 */
export function validateNumberFilter(filter: NumberFilter): void {
  if (!filter.field) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_FIELD);
  }

  if (!filter.operator) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_OPERATOR);
  }

  const validOperators: NumberFilterOperator[] = [
    'equals', 'not', 'lt', 'lte', 'gt', 'gte', 'in', 'notIn'
  ];

  if (!validOperators.includes(filter.operator)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_OPERATOR}: ${filter.operator} for number filter`
    );
  }

  if (filter.value === undefined || filter.value === null) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_VALUE);
  }

  // Check if value type matches operator expectations
  if (['in', 'notIn'].includes(filter.operator) && !Array.isArray(filter.value)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: ${filter.operator} requires an array value`
    );
  }

  if (!['in', 'notIn'].includes(filter.operator) && Array.isArray(filter.value)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: ${filter.operator} requires a number value, not an array`
    );
  }

  // Validate that all values are numbers
  if (Array.isArray(filter.value)) {
    for (const val of filter.value) {
      if (typeof val !== 'number') {
        throw new InvalidParameterError(
          `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: All values in array must be numbers`
        );
      }
    }
  } else if (typeof filter.value !== 'number') {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: Value must be a number`
    );
  }
}

/**
 * Validates a boolean filter and throws an error if invalid
 * @param filter The boolean filter to validate
 * @throws {InvalidParameterError} If the filter is invalid
 */
export function validateBooleanFilter(filter: BooleanFilter): void {
  if (!filter.field) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_FIELD);
  }

  if (!filter.operator) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_OPERATOR);
  }

  const validOperators: BooleanFilterOperator[] = ['equals', 'not'];

  if (!validOperators.includes(filter.operator)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_OPERATOR}: ${filter.operator} for boolean filter`
    );
  }

  if (filter.value === undefined || filter.value === null) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_VALUE);
  }

  if (typeof filter.value !== 'boolean') {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: Value must be a boolean`
    );
  }
}

/**
 * Validates a date filter and throws an error if invalid
 * @param filter The date filter to validate
 * @throws {InvalidParameterError} If the filter is invalid
 */
export function validateDateFilter(filter: DateFilter): void {
  if (!filter.field) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_FIELD);
  }

  if (!filter.operator) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_OPERATOR);
  }

  const validOperators: DateFilterOperator[] = [
    'equals', 'not', 'lt', 'lte', 'gt', 'gte', 'in', 'notIn'
  ];

  if (!validOperators.includes(filter.operator)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_OPERATOR}: ${filter.operator} for date filter`
    );
  }

  if (filter.value === undefined || filter.value === null) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_VALUE);
  }

  // Check if value type matches operator expectations
  if (['in', 'notIn'].includes(filter.operator) && !Array.isArray(filter.value)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: ${filter.operator} requires an array value`
    );
  }

  if (!['in', 'notIn'].includes(filter.operator) && Array.isArray(filter.value)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: ${filter.operator} requires a date value, not an array`
    );
  }

  // Validate that all values are valid dates
  if (Array.isArray(filter.value)) {
    for (const val of filter.value) {
      if (!(val instanceof Date) || isNaN(val.getTime())) {
        throw new InvalidParameterError(
          `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: All values in array must be valid dates`
        );
      }
    }
  } else if (!(filter.value instanceof Date) || isNaN(filter.value.getTime())) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: Value must be a valid date`
    );
  }
}

/**
 * Validates an enum filter and throws an error if invalid
 * @param filter The enum filter to validate
 * @throws {InvalidParameterError} If the filter is invalid
 */
export function validateEnumFilter(filter: EnumFilter): void {
  if (!filter.field) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_FIELD);
  }

  if (!filter.operator) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_OPERATOR);
  }

  const validOperators: EnumFilterOperator[] = ['equals', 'not', 'in', 'notIn'];

  if (!validOperators.includes(filter.operator)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_OPERATOR}: ${filter.operator} for enum filter`
    );
  }

  if (filter.value === undefined || filter.value === null) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_VALUE);
  }

  // Check if value type matches operator expectations
  if (['in', 'notIn'].includes(filter.operator) && !Array.isArray(filter.value)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: ${filter.operator} requires an array value`
    );
  }

  if (!['in', 'notIn'].includes(filter.operator) && Array.isArray(filter.value)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_VALUE_TYPE}: ${filter.operator} requires a string value, not an array`
    );
  }
}

/**
 * Validates a logical filter and throws an error if invalid
 * @param filter The logical filter to validate
 * @throws {InvalidParameterError} If the filter is invalid
 */
export function validateLogicalFilter(filter: LogicalFilter): void {
  if (!filter.operator) {
    throw new InvalidParameterError(ERROR_MESSAGES.MISSING_OPERATOR);
  }

  const validOperators: LogicalFilterOperator[] = ['AND', 'OR', 'NOT'];

  if (!validOperators.includes(filter.operator)) {
    throw new InvalidParameterError(
      `${ERROR_MESSAGES.INVALID_OPERATOR}: ${filter.operator} for logical filter`
    );
  }

  if (!filter.filters || !Array.isArray(filter.filters) || filter.filters.length === 0) {
    throw new InvalidParameterError(ERROR_MESSAGES.INVALID_LOGICAL_FILTER);
  }

  // For NOT operator, only one filter is allowed
  if (filter.operator === 'NOT' && filter.filters.length > 1) {
    throw new InvalidParameterError(
      'NOT operator can only be applied to a single filter'
    );
  }

  // Validate each nested filter
  for (const nestedFilter of filter.filters) {
    validateFilter(nestedFilter);
  }
}

/**
 * Validates any type of filter and throws an error if invalid
 * @param filter The filter to validate
 * @throws {InvalidParameterError} If the filter is invalid
 */
export function validateFilter(filter: Filter): void {
  if (!filter) {
    throw new InvalidParameterError('Filter cannot be null or undefined');
  }

  if ('operator' in filter && 'filters' in filter) {
    validateLogicalFilter(filter as LogicalFilter);
    return;
  }

  if (!('field' in filter) || !('operator' in filter) || !('value' in filter)) {
    throw new InvalidParameterError('Filter must have field, operator, and value properties');
  }

  const baseFilter = filter as BaseFilter;

  // Determine filter type based on operator and validate accordingly
  if (['equals', 'not', 'contains', 'startsWith', 'endsWith', 'in', 'notIn'].includes(baseFilter.operator)) {
    if (typeof baseFilter.value === 'string' || (Array.isArray(baseFilter.value) && baseFilter.value.every(v => typeof v === 'string'))) {
      validateStringFilter(filter as StringFilter);
      return;
    }
  }

  if (['equals', 'not', 'lt', 'lte', 'gt', 'gte', 'in', 'notIn'].includes(baseFilter.operator)) {
    if (typeof baseFilter.value === 'number' || (Array.isArray(baseFilter.value) && baseFilter.value.every(v => typeof v === 'number'))) {
      validateNumberFilter(filter as NumberFilter);
      return;
    }
  }

  if (['equals', 'not'].includes(baseFilter.operator)) {
    if (typeof baseFilter.value === 'boolean') {
      validateBooleanFilter(filter as BooleanFilter);
      return;
    }
  }

  if (['equals', 'not', 'lt', 'lte', 'gt', 'gte', 'in', 'notIn'].includes(baseFilter.operator)) {
    if (baseFilter.value instanceof Date || (Array.isArray(baseFilter.value) && baseFilter.value.every(v => v instanceof Date))) {
      validateDateFilter(filter as DateFilter);
      return;
    }
  }

  // If we reach here, the filter type couldn't be determined
  throw new InvalidParameterError(ERROR_MESSAGES.INVALID_FILTER_TYPE);
}

/**
 * Builds a Prisma filter condition for a string field
 * @param filter The string filter to convert to a Prisma condition
 * @returns A Prisma filter condition object
 */
export function buildStringFilterCondition(filter: StringFilter): FilterCondition {
  validateStringFilter(filter);

  const condition: FilterCondition = {};
  const fieldCondition: Record<string, any> = {};

  switch (filter.operator) {
    case 'equals':
      fieldCondition.equals = filter.value;
      break;
    case 'not':
      fieldCondition.not = filter.value;
      break;
    case 'contains':
      fieldCondition.contains = filter.value;
      break;
    case 'startsWith':
      fieldCondition.startsWith = filter.value;
      break;
    case 'endsWith':
      fieldCondition.endsWith = filter.value;
      break;
    case 'in':
      fieldCondition.in = filter.value;
      break;
    case 'notIn':
      fieldCondition.notIn = filter.value;
      break;
    default:
      throw new InvalidParameterError(`Unsupported string filter operator: ${filter.operator}`);
  }

  condition[filter.field] = fieldCondition;
  return condition;
}

/**
 * Builds a Prisma filter condition for a number field
 * @param filter The number filter to convert to a Prisma condition
 * @returns A Prisma filter condition object
 */
export function buildNumberFilterCondition(filter: NumberFilter): FilterCondition {
  validateNumberFilter(filter);

  const condition: FilterCondition = {};
  const fieldCondition: Record<string, any> = {};

  switch (filter.operator) {
    case 'equals':
      fieldCondition.equals = filter.value;
      break;
    case 'not':
      fieldCondition.not = filter.value;
      break;
    case 'lt':
      fieldCondition.lt = filter.value;
      break;
    case 'lte':
      fieldCondition.lte = filter.value;
      break;
    case 'gt':
      fieldCondition.gt = filter.value;
      break;
    case 'gte':
      fieldCondition.gte = filter.value;
      break;
    case 'in':
      fieldCondition.in = filter.value;
      break;
    case 'notIn':
      fieldCondition.notIn = filter.value;
      break;
    default:
      throw new InvalidParameterError(`Unsupported number filter operator: ${filter.operator}`);
  }

  condition[filter.field] = fieldCondition;
  return condition;
}

/**
 * Builds a Prisma filter condition for a boolean field
 * @param filter The boolean filter to convert to a Prisma condition
 * @returns A Prisma filter condition object
 */
export function buildBooleanFilterCondition(filter: BooleanFilter): FilterCondition {
  validateBooleanFilter(filter);

  const condition: FilterCondition = {};
  const fieldCondition: Record<string, any> = {};

  switch (filter.operator) {
    case 'equals':
      fieldCondition.equals = filter.value;
      break;
    case 'not':
      fieldCondition.not = filter.value;
      break;
    default:
      throw new InvalidParameterError(`Unsupported boolean filter operator: ${filter.operator}`);
  }

  condition[filter.field] = fieldCondition;
  return condition;
}

/**
 * Builds a Prisma filter condition for a date field
 * @param filter The date filter to convert to a Prisma condition
 * @returns A Prisma filter condition object
 */
export function buildDateFilterCondition(filter: DateFilter): FilterCondition {
  validateDateFilter(filter);

  const condition: FilterCondition = {};
  const fieldCondition: Record<string, any> = {};

  switch (filter.operator) {
    case 'equals':
      fieldCondition.equals = filter.value;
      break;
    case 'not':
      fieldCondition.not = filter.value;
      break;
    case 'lt':
      fieldCondition.lt = filter.value;
      break;
    case 'lte':
      fieldCondition.lte = filter.value;
      break;
    case 'gt':
      fieldCondition.gt = filter.value;
      break;
    case 'gte':
      fieldCondition.gte = filter.value;
      break;
    case 'in':
      fieldCondition.in = filter.value;
      break;
    case 'notIn':
      fieldCondition.notIn = filter.value;
      break;
    default:
      throw new InvalidParameterError(`Unsupported date filter operator: ${filter.operator}`);
  }

  condition[filter.field] = fieldCondition;
  return condition;
}

/**
 * Builds a Prisma filter condition for an enum field
 * @param filter The enum filter to convert to a Prisma condition
 * @returns A Prisma filter condition object
 */
export function buildEnumFilterCondition(filter: EnumFilter): FilterCondition {
  validateEnumFilter(filter);

  const condition: FilterCondition = {};
  const fieldCondition: Record<string, any> = {};

  switch (filter.operator) {
    case 'equals':
      fieldCondition.equals = filter.value;
      break;
    case 'not':
      fieldCondition.not = filter.value;
      break;
    case 'in':
      fieldCondition.in = filter.value;
      break;
    case 'notIn':
      fieldCondition.notIn = filter.value;
      break;
    default:
      throw new InvalidParameterError(`Unsupported enum filter operator: ${filter.operator}`);
  }

  condition[filter.field] = fieldCondition;
  return condition;
}

/**
 * Builds a Prisma filter condition for a logical filter (AND, OR, NOT)
 * @param filter The logical filter to convert to a Prisma condition
 * @returns A Prisma filter condition object
 */
export function buildLogicalFilterCondition(filter: LogicalFilter): FilterCondition {
  validateLogicalFilter(filter);

  const condition: FilterCondition = {};
  const nestedConditions: FilterCondition[] = [];

  for (const nestedFilter of filter.filters) {
    nestedConditions.push(buildFilterCondition(nestedFilter));
  }

  condition[filter.operator] = nestedConditions;
  return condition;
}

/**
 * Builds a Prisma filter condition for any type of filter
 * @param filter The filter to convert to a Prisma condition
 * @returns A Prisma filter condition object
 */
export function buildFilterCondition(filter: Filter): FilterCondition {
  try {
    validateFilter(filter);

    if ('operator' in filter && 'filters' in filter) {
      return buildLogicalFilterCondition(filter as LogicalFilter);
    }

    const baseFilter = filter as BaseFilter;

    // Determine filter type based on operator and value type
    if (['equals', 'not', 'contains', 'startsWith', 'endsWith', 'in', 'notIn'].includes(baseFilter.operator) &&
        (typeof baseFilter.value === 'string' || (Array.isArray(baseFilter.value) && baseFilter.value.every(v => typeof v === 'string')))) {
      return buildStringFilterCondition(filter as StringFilter);
    }

    if (['equals', 'not', 'lt', 'lte', 'gt', 'gte', 'in', 'notIn'].includes(baseFilter.operator) &&
        (typeof baseFilter.value === 'number' || (Array.isArray(baseFilter.value) && baseFilter.value.every(v => typeof v === 'number')))) {
      return buildNumberFilterCondition(filter as NumberFilter);
    }

    if (['equals', 'not'].includes(baseFilter.operator) && typeof baseFilter.value === 'boolean') {
      return buildBooleanFilterCondition(filter as BooleanFilter);
    }

    if (['equals', 'not', 'lt', 'lte', 'gt', 'gte', 'in', 'notIn'].includes(baseFilter.operator) &&
        (baseFilter.value instanceof Date || (Array.isArray(baseFilter.value) && baseFilter.value.every(v => v instanceof Date)))) {
      return buildDateFilterCondition(filter as DateFilter);
    }

    // If we reach here, try to handle as enum filter
    return buildEnumFilterCondition(filter as EnumFilter);
  } catch (error) {
    if (error instanceof InvalidParameterError) {
      throw error;
    }
    throw new MalformedRequestError(`Failed to build filter condition: ${error.message}`);
  }
}

/**
 * Creates a date range filter for a specified field
 * @param field The date field to filter on
 * @param startDate The start date of the range (inclusive)
 * @param endDate The end date of the range (inclusive)
 * @returns A logical filter with AND condition for the date range
 */
export function createDateRangeFilter(field: string, startDate: Date, endDate: Date): LogicalFilter {
  if (!startDate || !endDate) {
    throw new InvalidParameterError('Both startDate and endDate are required for date range filter');
  }

  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    throw new InvalidParameterError('startDate must be a valid Date object');
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    throw new InvalidParameterError('endDate must be a valid Date object');
  }

  if (startDate > endDate) {
    throw new InvalidParameterError('startDate must be before or equal to endDate');
  }

  return {
    operator: 'AND',
    filters: [
      {
        field,
        operator: 'gte',
        value: startDate
      } as DateFilter,
      {
        field,
        operator: 'lte',
        value: endDate
      } as DateFilter
    ]
  };
}

/**
 * Creates a filter for searching text across multiple fields
 * @param searchTerm The text to search for
 * @param fields The fields to search in
 * @returns A logical filter with OR condition for text search
 */
export function createTextSearchFilter(searchTerm: string, fields: string[]): LogicalFilter {
  if (!searchTerm || !fields || fields.length === 0) {
    throw new InvalidParameterError('Search term and at least one field are required for text search filter');
  }

  const filters: StringFilter[] = fields.map(field => ({
    field,
    operator: 'contains',
    value: searchTerm
  }));

  return {
    operator: 'OR',
    filters
  };
}

/**
 * Creates a filter for exact match on multiple fields (AND condition)
 * @param fieldValues Object with field names as keys and their exact match values
 * @returns A logical filter with AND condition for exact matches
 */
export function createExactMatchFilter(fieldValues: Record<string, any>): LogicalFilter {
  if (!fieldValues || Object.keys(fieldValues).length === 0) {
    throw new InvalidParameterError('At least one field-value pair is required for exact match filter');
  }

  const filters: Filter[] = [];

  for (const [field, value] of Object.entries(fieldValues)) {
    if (typeof value === 'string') {
      filters.push({
        field,
        operator: 'equals',
        value
      } as StringFilter);
    } else if (typeof value === 'number') {
      filters.push({
        field,
        operator: 'equals',
        value
      } as NumberFilter);
    } else if (typeof value === 'boolean') {
      filters.push({
        field,
        operator: 'equals',
        value
      } as BooleanFilter);
    } else if (value instanceof Date) {
      filters.push({
        field,
        operator: 'equals',
        value
      } as DateFilter);
    } else if (Array.isArray(value)) {
      // Handle array values as 'in' operator
      if (value.length > 0) {
        if (typeof value[0] === 'string') {
          filters.push({
            field,
            operator: 'in',
            value
          } as StringFilter);
        } else if (typeof value[0] === 'number') {
          filters.push({
            field,
            operator: 'in',
            value
          } as NumberFilter);
        } else if (value[0] instanceof Date) {
          filters.push({
            field,
            operator: 'in',
            value
          } as DateFilter);
        }
      }
    }
  }

  if (filters.length === 0) {
    throw new InvalidParameterError('No valid field-value pairs provided for exact match filter');
  }

  return {
    operator: 'AND',
    filters
  };
}

/**
 * Creates a filter for nested relation fields
 * @param relationPath The path to the relation (e.g., 'user.profile')
 * @param filter The filter to apply on the relation
 * @returns A filter condition for the nested relation
 */
export function createNestedFilter(relationPath: string, filter: Filter): FilterCondition {
  if (!relationPath || !filter) {
    throw new InvalidParameterError('Relation path and filter are required for nested filter');
  }

  const pathParts = relationPath.split('.');
  if (pathParts.length < 1) {
    throw new InvalidParameterError('Invalid relation path format');
  }

  // Build the nested filter structure from inside out
  let condition = buildFilterCondition(filter);
  
  // Start from the last relation and work backwards
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const tempCondition: FilterCondition = {};
    tempCondition[pathParts[i]] = condition;
    condition = tempCondition;
  }

  return condition;
}

/**
 * Creates a filter for TimescaleDB time-series data with optimized performance
 * @param timeField The timestamp field to filter on
 * @param startTime The start time of the range (inclusive)
 * @param endTime The end time of the range (inclusive)
 * @param additionalFilters Optional additional filters to apply
 * @returns A filter condition optimized for TimescaleDB
 */
export function createTimeSeriesFilter(
  timeField: string,
  startTime: Date,
  endTime: Date,
  additionalFilters?: Filter[]
): FilterCondition {
  if (!timeField || !startTime || !endTime) {
    throw new InvalidParameterError('Time field, start time, and end time are required for time series filter');
  }

  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    throw new InvalidParameterError('startTime must be a valid Date object');
  }

  if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
    throw new InvalidParameterError('endTime must be a valid Date object');
  }

  if (startTime > endTime) {
    throw new InvalidParameterError('startTime must be before or equal to endTime');
  }

  // Create the time range filter
  const timeRangeFilter = createDateRangeFilter(timeField, startTime, endTime);
  
  // If no additional filters, return just the time range filter
  if (!additionalFilters || additionalFilters.length === 0) {
    return buildFilterCondition(timeRangeFilter);
  }

  // Combine with additional filters using AND
  const combinedFilter: LogicalFilter = {
    operator: 'AND',
    filters: [timeRangeFilter, ...additionalFilters]
  };

  return buildFilterCondition(combinedFilter);
}

/**
 * Creates a filter for health metrics with optimized performance
 * @param metricType The type of health metric to filter
 * @param startDate The start date of the range (inclusive)
 * @param endDate The end date of the range (inclusive)
 * @param userId Optional user ID to filter by
 * @returns A filter condition optimized for health metrics
 */
export function createHealthMetricFilter(
  metricType: MetricType,
  startDate: Date,
  endDate: Date,
  userId?: string
): FilterCondition {
  if (!metricType || !startDate || !endDate) {
    throw new InvalidParameterError('Metric type, start date, and end date are required for health metric filter');
  }

  const filters: Filter[] = [
    {
      field: 'type',
      operator: 'equals',
      value: metricType
    } as EnumFilter
  ];

  // Add user filter if provided
  if (userId) {
    filters.push({
      field: 'userId',
      operator: 'equals',
      value: userId
    } as StringFilter);
  }

  // Use the time series filter for optimized performance
  return createTimeSeriesFilter('timestamp', startDate, endDate, filters);
}

/**
 * Creates a filter for care appointments with optimized performance
 * @param status Optional appointment status to filter by
 * @param startDate The start date of the range (inclusive)
 * @param endDate The end date of the range (inclusive)
 * @param userId Optional user ID to filter by
 * @param providerId Optional provider ID to filter by
 * @returns A filter condition optimized for appointments
 */
export function createAppointmentFilter(
  status?: AppointmentStatus,
  startDate?: Date,
  endDate?: Date,
  userId?: string,
  providerId?: string
): FilterCondition {
  const filters: Filter[] = [];

  // Add status filter if provided
  if (status) {
    filters.push({
      field: 'status',
      operator: 'equals',
      value: status
    } as EnumFilter);
  }

  // Add user filter if provided
  if (userId) {
    filters.push({
      field: 'userId',
      operator: 'equals',
      value: userId
    } as StringFilter);
  }

  // Add provider filter if provided
  if (providerId) {
    filters.push({
      field: 'providerId',
      operator: 'equals',
      value: providerId
    } as StringFilter);
  }

  // If date range is provided, add date filter
  if (startDate && endDate) {
    if (startDate > endDate) {
      throw new InvalidParameterError('startDate must be before or equal to endDate');
    }

    const dateRangeFilter = createDateRangeFilter('scheduledAt', startDate, endDate);
    filters.push(dateRangeFilter);
  }

  // If no filters, return empty object
  if (filters.length === 0) {
    return {};
  }

  // If only one filter, return it directly
  if (filters.length === 1) {
    return buildFilterCondition(filters[0]);
  }

  // Combine all filters with AND
  const combinedFilter: LogicalFilter = {
    operator: 'AND',
    filters
  };

  return buildFilterCondition(combinedFilter);
}

/**
 * Creates a filter for plan claims with optimized performance
 * @param status Optional claim status to filter by
 * @param startDate Optional start date for submission date range
 * @param endDate Optional end date for submission date range
 * @param userId Optional user ID to filter by
 * @returns A filter condition optimized for claims
 */
export function createClaimFilter(
  status?: ClaimStatus,
  startDate?: Date,
  endDate?: Date,
  userId?: string
): FilterCondition {
  const filters: Filter[] = [];

  // Add status filter if provided
  if (status) {
    filters.push({
      field: 'status',
      operator: 'equals',
      value: status
    } as EnumFilter);
  }

  // Add user filter if provided
  if (userId) {
    filters.push({
      field: 'userId',
      operator: 'equals',
      value: userId
    } as StringFilter);
  }

  // If date range is provided, add date filter
  if (startDate && endDate) {
    if (startDate > endDate) {
      throw new InvalidParameterError('startDate must be before or equal to endDate');
    }

    const dateRangeFilter = createDateRangeFilter('submittedAt', startDate, endDate);
    filters.push(dateRangeFilter);
  }

  // If no filters, return empty object
  if (filters.length === 0) {
    return {};
  }

  // If only one filter, return it directly
  if (filters.length === 1) {
    return buildFilterCondition(filters[0]);
  }

  // Combine all filters with AND
  const combinedFilter: LogicalFilter = {
    operator: 'AND',
    filters
  };

  return buildFilterCondition(combinedFilter);
}

/**
 * Applies a filter condition to a Prisma query
 * @param query The Prisma query to apply the filter to
 * @param filter The filter to apply
 * @returns The Prisma query with the filter applied
 */
export function applyFilter<T extends Record<string, any>>(
  query: T,
  filter: Filter | FilterCondition
): T {
  try {
    // If filter is already a FilterCondition, use it directly
    const condition = (filter as FilterCondition).AND || (filter as FilterCondition).OR || (filter as FilterCondition).NOT
      ? filter as FilterCondition
      : buildFilterCondition(filter as Filter);

    // Apply the filter to the query
    return {
      ...query,
      where: query.where
        ? { ...query.where, ...condition }
        : condition
    };
  } catch (error) {
    if (error instanceof InvalidParameterError || error instanceof MalformedRequestError) {
      throw error;
    }
    throw new MalformedRequestError(`Failed to apply filter: ${error.message}`);
  }
}

/**
 * Combines multiple filters with a logical operator
 * @param filters The filters to combine
 * @param operator The logical operator to use (AND, OR, NOT)
 * @returns A combined logical filter
 */
export function combineFilters(
  filters: Filter[],
  operator: LogicalFilterOperator = 'AND'
): LogicalFilter {
  if (!filters || filters.length === 0) {
    throw new InvalidParameterError('At least one filter is required to combine filters');
  }

  if (operator === 'NOT' && filters.length > 1) {
    throw new InvalidParameterError('NOT operator can only be applied to a single filter');
  }

  return {
    operator,
    filters
  };
}

/**
 * Creates a filter for a specific journey based on the journey type
 * @param journeyType The type of journey ('health', 'care', or 'plan')
 * @param params Journey-specific parameters for filtering
 * @returns A filter condition optimized for the specified journey
 */
export function createJourneyFilter(
  journeyType: 'health' | 'care' | 'plan',
  params: Record<string, any>
): FilterCondition {
  switch (journeyType) {
    case 'health':
      return createHealthMetricFilter(
        params.metricType,
        params.startDate,
        params.endDate,
        params.userId
      );
    case 'care':
      return createAppointmentFilter(
        params.status,
        params.startDate,
        params.endDate,
        params.userId,
        params.providerId
      );
    case 'plan':
      return createClaimFilter(
        params.status,
        params.startDate,
        params.endDate,
        params.userId
      );
    default:
      throw new InvalidParameterError(`Unsupported journey type: ${journeyType}`);
  }
}

/**
 * Parses a filter from a JSON string or object
 * @param filterInput The filter as a JSON string or object
 * @returns The parsed filter object
 */
export function parseFilter(filterInput: string | object): Filter {
  try {
    const filter = typeof filterInput === 'string' 
      ? JSON.parse(filterInput) 
      : filterInput;
    
    validateFilter(filter as Filter);
    return filter as Filter;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new MalformedRequestError(`Invalid filter JSON: ${error.message}`);
    }
    if (error instanceof InvalidParameterError) {
      throw error;
    }
    throw new MalformedRequestError(`Failed to parse filter: ${error.message}`);
  }
}

/**
 * Converts a Prisma filter condition back to a Filter object
 * @param condition The Prisma filter condition to convert
 * @returns The equivalent Filter object
 */
export function conditionToFilter(condition: FilterCondition): Filter {
  // Handle logical operators
  if (condition.AND) {
    return {
      operator: 'AND',
      filters: Array.isArray(condition.AND)
        ? condition.AND.map(c => conditionToFilter(c))
        : [conditionToFilter(condition.AND)]
    };
  }

  if (condition.OR) {
    return {
      operator: 'OR',
      filters: Array.isArray(condition.OR)
        ? condition.OR.map(c => conditionToFilter(c))
        : [conditionToFilter(condition.OR)]
    };
  }

  if (condition.NOT) {
    return {
      operator: 'NOT',
      filters: Array.isArray(condition.NOT)
        ? condition.NOT.map(c => conditionToFilter(c))
        : [conditionToFilter(condition.NOT)]
    };
  }

  // Handle field conditions
  const entries = Object.entries(condition);
  if (entries.length === 0) {
    throw new InvalidParameterError('Empty filter condition');
  }

  const [field, fieldCondition] = entries[0];
  
  // Handle direct value assignment (equals)
  if (typeof fieldCondition !== 'object' || fieldCondition === null) {
    return {
      field,
      operator: 'equals',
      value: fieldCondition
    } as Filter;
  }

  // Handle object conditions
  const conditionEntries = Object.entries(fieldCondition);
  if (conditionEntries.length === 0) {
    throw new InvalidParameterError(`Empty field condition for field: ${field}`);
  }

  const [operator, value] = conditionEntries[0];

  // Determine filter type based on value
  if (typeof value === 'string') {
    return {
      field,
      operator: operator as StringFilterOperator,
      value
    } as StringFilter;
  }

  if (typeof value === 'number') {
    return {
      field,
      operator: operator as NumberFilterOperator,
      value
    } as NumberFilter;
  }

  if (typeof value === 'boolean') {
    return {
      field,
      operator: operator as BooleanFilterOperator,
      value
    } as BooleanFilter;
  }

  if (value instanceof Date) {
    return {
      field,
      operator: operator as DateFilterOperator,
      value
    } as DateFilter;
  }

  if (Array.isArray(value)) {
    if (value.length > 0) {
      if (typeof value[0] === 'string') {
        return {
          field,
          operator: operator as StringFilterOperator,
          value
        } as StringFilter;
      }

      if (typeof value[0] === 'number') {
        return {
          field,
          operator: operator as NumberFilterOperator,
          value
        } as NumberFilter;
      }

      if (value[0] instanceof Date) {
        return {
          field,
          operator: operator as DateFilterOperator,
          value
        } as DateFilter;
      }
    }

    // Default to enum filter for empty arrays or other types
    return {
      field,
      operator: operator as EnumFilterOperator,
      value
    } as EnumFilter;
  }

  // Default to enum filter for other cases
  return {
    field,
    operator: operator as EnumFilterOperator,
    value
  } as EnumFilter;
}