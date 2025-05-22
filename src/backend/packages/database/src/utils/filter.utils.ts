/**
 * @file filter.utils.ts
 * @description Provides a comprehensive set of filtering utilities for constructing type-safe Prisma filters
 * across all journey services. Implements filters for common data types (string, number, boolean, date)
 * with support for various operators (equals, contains, startsWith, endsWith, in, between, etc.).
 * Includes journey-specific filtering helpers for Health metrics, Care appointments, and Plan benefits
 * with built-in performance optimizations.
 */

import { Prisma } from '@prisma/client';
import { 
  FilterCondition, 
  FilterGroup, 
  FilterParams, 
  AnyFilterCondition,
  ComparisonOperator, 
  LogicalOperator,
  BetweenFilterCondition,
  InFilterCondition,
  NullFilterCondition,
  RegexFilterCondition,
  JsonPathFilterCondition,
  TypedFilterCondition,
  TypedFilterGroup,
  TypedFilterParams
} from '../types/query.types';
import { JourneyId } from '../types/journey.types';
import { DatabaseException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';

// -----------------------------------------------------------------------------
// Error Handling
// -----------------------------------------------------------------------------

/**
 * Error class for filter-related errors
 */
export class FilterError extends DatabaseException {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, DatabaseErrorType.FILTER_ERROR, metadata);
  }
}

/**
 * Validates a filter condition and throws an error if it's invalid
 * 
 * @param condition The filter condition to validate
 * @throws {FilterError} If the condition is invalid
 */
export function validateFilterCondition(condition: AnyFilterCondition): void {
  if (!condition) {
    throw new FilterError('Filter condition cannot be null or undefined');
  }

  if (!condition.field) {
    throw new FilterError('Filter condition must have a field property');
  }

  if (!Object.values(ComparisonOperator).includes(condition.operator)) {
    throw new FilterError(`Invalid operator: ${condition.operator}`);
  }

  // Validate specific operator requirements
  switch (condition.operator) {
    case ComparisonOperator.BETWEEN:
      if (!Array.isArray((condition as BetweenFilterCondition).value) || 
          (condition as BetweenFilterCondition).value.length !== 2) {
        throw new FilterError('BETWEEN operator requires an array of exactly 2 values');
      }
      break;

    case ComparisonOperator.IN:
    case ComparisonOperator.NOT_IN:
      if (!Array.isArray((condition as InFilterCondition).value)) {
        throw new FilterError(`${condition.operator} operator requires an array of values`);
      }
      break;

    case ComparisonOperator.IS_NULL:
    case ComparisonOperator.IS_NOT_NULL:
      // No value needed for these operators
      break;

    case ComparisonOperator.REGEX:
      if (typeof (condition as RegexFilterCondition).value !== 'string') {
        throw new FilterError('REGEX operator requires a string value');
      }
      break;

    case ComparisonOperator.JSON_PATH:
      if (!(condition as JsonPathFilterCondition).path) {
        throw new FilterError('JSON_PATH operator requires a path property');
      }
      break;

    default:
      // For other operators, just ensure value is not undefined
      if (condition.value === undefined && 
          condition.operator !== ComparisonOperator.IS_NULL && 
          condition.operator !== ComparisonOperator.IS_NOT_NULL) {
        throw new FilterError(`Value is required for operator ${condition.operator}`);
      }
  }
}

/**
 * Validates a filter group and throws an error if it's invalid
 * 
 * @param group The filter group to validate
 * @throws {FilterError} If the group is invalid
 */
export function validateFilterGroup(group: FilterGroup): void {
  if (!group) {
    throw new FilterError('Filter group cannot be null or undefined');
  }

  if (!Object.values(LogicalOperator).includes(group.operator)) {
    throw new FilterError(`Invalid logical operator: ${group.operator}`);
  }

  if (!Array.isArray(group.conditions) || group.conditions.length === 0) {
    throw new FilterError('Filter group must have at least one condition');
  }

  // Validate each condition in the group
  group.conditions.forEach(condition => {
    if ((condition as FilterGroup).operator) {
      validateFilterGroup(condition as FilterGroup);
    } else {
      validateFilterCondition(condition as AnyFilterCondition);
    }
  });
}

/**
 * Validates filter parameters and throws an error if they're invalid
 * 
 * @param filter The filter parameters to validate
 * @throws {FilterError} If the filter parameters are invalid
 */
export function validateFilter(filter: FilterParams): void {
  if (!filter) {
    return; // Empty filter is valid
  }

  if (Array.isArray(filter)) {
    if (filter.length === 0) {
      throw new FilterError('Filter array cannot be empty');
    }

    filter.forEach(item => {
      if ((item as FilterGroup).operator) {
        validateFilterGroup(item as FilterGroup);
      } else {
        validateFilterCondition(item as AnyFilterCondition);
      }
    });
  } else if ((filter as FilterGroup).operator) {
    validateFilterGroup(filter as FilterGroup);
  } else {
    validateFilterCondition(filter as AnyFilterCondition);
  }
}

// -----------------------------------------------------------------------------
// Basic Filter Builders
// -----------------------------------------------------------------------------

/**
 * Creates a filter condition for string equality
 * 
 * @param field The field to filter on
 * @param value The value to compare against
 * @returns A filter condition for string equality
 */
export function equals(field: string, value: any): FilterCondition {
  return {
    field,
    operator: ComparisonOperator.EQ,
    value
  };
}

/**
 * Creates a filter condition for string inequality
 * 
 * @param field The field to filter on
 * @param value The value to compare against
 * @returns A filter condition for string inequality
 */
export function notEquals(field: string, value: any): FilterCondition {
  return {
    field,
    operator: ComparisonOperator.NE,
    value
  };
}

/**
 * Creates a filter condition for greater than comparison
 * 
 * @param field The field to filter on
 * @param value The value to compare against
 * @returns A filter condition for greater than comparison
 */
export function greaterThan(field: string, value: number | Date): FilterCondition {
  return {
    field,
    operator: ComparisonOperator.GT,
    value
  };
}

/**
 * Creates a filter condition for greater than or equal comparison
 * 
 * @param field The field to filter on
 * @param value The value to compare against
 * @returns A filter condition for greater than or equal comparison
 */
export function greaterThanOrEqual(field: string, value: number | Date): FilterCondition {
  return {
    field,
    operator: ComparisonOperator.GTE,
    value
  };
}

/**
 * Creates a filter condition for less than comparison
 * 
 * @param field The field to filter on
 * @param value The value to compare against
 * @returns A filter condition for less than comparison
 */
export function lessThan(field: string, value: number | Date): FilterCondition {
  return {
    field,
    operator: ComparisonOperator.LT,
    value
  };
}

/**
 * Creates a filter condition for less than or equal comparison
 * 
 * @param field The field to filter on
 * @param value The value to compare against
 * @returns A filter condition for less than or equal comparison
 */
export function lessThanOrEqual(field: string, value: number | Date): FilterCondition {
  return {
    field,
    operator: ComparisonOperator.LTE,
    value
  };
}

/**
 * Creates a filter condition for string contains
 * 
 * @param field The field to filter on
 * @param value The substring to check for
 * @param caseSensitive Whether the comparison should be case-sensitive
 * @returns A filter condition for string contains
 */
export function contains(field: string, value: string, caseSensitive = true): FilterCondition {
  return {
    field,
    operator: caseSensitive ? ComparisonOperator.CONTAINS : ComparisonOperator.CONTAINS_I,
    value
  };
}

/**
 * Creates a filter condition for string starts with
 * 
 * @param field The field to filter on
 * @param value The prefix to check for
 * @param caseSensitive Whether the comparison should be case-sensitive
 * @returns A filter condition for string starts with
 */
export function startsWith(field: string, value: string, caseSensitive = true): FilterCondition {
  return {
    field,
    operator: caseSensitive ? ComparisonOperator.STARTS_WITH : ComparisonOperator.STARTS_WITH_I,
    value
  };
}

/**
 * Creates a filter condition for string ends with
 * 
 * @param field The field to filter on
 * @param value The suffix to check for
 * @param caseSensitive Whether the comparison should be case-sensitive
 * @returns A filter condition for string ends with
 */
export function endsWith(field: string, value: string, caseSensitive = true): FilterCondition {
  return {
    field,
    operator: caseSensitive ? ComparisonOperator.ENDS_WITH : ComparisonOperator.ENDS_WITH_I,
    value
  };
}

/**
 * Creates a filter condition for checking if a value is in an array
 * 
 * @param field The field to filter on
 * @param values The array of values to check against
 * @returns A filter condition for in array
 */
export function inArray(field: string, values: any[]): InFilterCondition {
  return {
    field,
    operator: ComparisonOperator.IN,
    value: values
  };
}

/**
 * Creates a filter condition for checking if a value is not in an array
 * 
 * @param field The field to filter on
 * @param values The array of values to check against
 * @returns A filter condition for not in array
 */
export function notInArray(field: string, values: any[]): InFilterCondition {
  return {
    field,
    operator: ComparisonOperator.NOT_IN,
    value: values
  };
}

/**
 * Creates a filter condition for checking if a value is between two values
 * 
 * @param field The field to filter on
 * @param min The minimum value (inclusive)
 * @param max The maximum value (inclusive)
 * @returns A filter condition for between
 */
export function between(field: string, min: any, max: any): BetweenFilterCondition {
  return {
    field,
    operator: ComparisonOperator.BETWEEN,
    value: [min, max]
  };
}

/**
 * Creates a filter condition for checking if a field is null
 * 
 * @param field The field to filter on
 * @returns A filter condition for is null
 */
export function isNull(field: string): NullFilterCondition {
  return {
    field,
    operator: ComparisonOperator.IS_NULL
  };
}

/**
 * Creates a filter condition for checking if a field is not null
 * 
 * @param field The field to filter on
 * @returns A filter condition for is not null
 */
export function isNotNull(field: string): NullFilterCondition {
  return {
    field,
    operator: ComparisonOperator.IS_NOT_NULL
  };
}

/**
 * Creates a filter condition for matching a regular expression
 * 
 * @param field The field to filter on
 * @param pattern The regular expression pattern
 * @param flags The regular expression flags
 * @returns A filter condition for regex matching
 */
export function regex(field: string, pattern: string, flags?: string): RegexFilterCondition {
  return {
    field,
    operator: ComparisonOperator.REGEX,
    value: pattern,
    flags
  };
}

/**
 * Creates a filter condition for JSON path expressions
 * 
 * @param field The field to filter on
 * @param path The JSON path expression
 * @param value The value to compare against
 * @param pathOperator The operator to use for the comparison
 * @returns A filter condition for JSON path expressions
 */
export function jsonPath(
  field: string, 
  path: string, 
  value: any, 
  pathOperator: ComparisonOperator = ComparisonOperator.EQ
): JsonPathFilterCondition {
  return {
    field,
    operator: ComparisonOperator.JSON_PATH,
    path,
    value,
    pathOperator
  };
}

// -----------------------------------------------------------------------------
// Composite Filter Builders
// -----------------------------------------------------------------------------

/**
 * Creates a filter group with AND logic
 * 
 * @param conditions The conditions to combine with AND logic
 * @returns A filter group with AND logic
 */
export function and(
  conditions: Array<AnyFilterCondition | FilterGroup>
): FilterGroup {
  return {
    operator: LogicalOperator.AND,
    conditions
  };
}

/**
 * Creates a filter group with OR logic
 * 
 * @param conditions The conditions to combine with OR logic
 * @returns A filter group with OR logic
 */
export function or(
  conditions: Array<AnyFilterCondition | FilterGroup>
): FilterGroup {
  return {
    operator: LogicalOperator.OR,
    conditions
  };
}

/**
 * Creates a filter group with NOT logic
 * 
 * @param condition The condition to negate
 * @returns A filter group with NOT logic
 */
export function not(
  condition: AnyFilterCondition | FilterGroup
): FilterGroup {
  return {
    operator: LogicalOperator.NOT,
    conditions: [condition]
  };
}

/**
 * Creates a filter for a date range
 * 
 * @param field The date field to filter on
 * @param startDate The start date (inclusive)
 * @param endDate The end date (inclusive)
 * @returns A filter group for the date range
 */
export function dateRange(field: string, startDate: Date, endDate: Date): FilterGroup {
  return and([
    greaterThanOrEqual(field, startDate),
    lessThanOrEqual(field, endDate)
  ]);
}

/**
 * Creates a filter for a numeric range
 * 
 * @param field The numeric field to filter on
 * @param min The minimum value (inclusive)
 * @param max The maximum value (inclusive)
 * @returns A filter group for the numeric range
 */
export function numericRange(field: string, min: number, max: number): FilterGroup {
  return and([
    greaterThanOrEqual(field, min),
    lessThanOrEqual(field, max)
  ]);
}

/**
 * Creates a filter for searching across multiple string fields
 * 
 * @param searchTerm The search term to look for
 * @param fields The fields to search in
 * @param caseSensitive Whether the search should be case-sensitive
 * @returns A filter group for the multi-field search
 */
export function multiFieldSearch(
  searchTerm: string, 
  fields: string[], 
  caseSensitive = false
): FilterGroup {
  return or(
    fields.map(field => contains(field, searchTerm, caseSensitive))
  );
}

/**
 * Creates a filter for a nested relation
 * 
 * @param relationField The relation field name
 * @param filter The filter to apply to the relation
 * @returns A filter condition for the nested relation
 */
export function nestedFilter(
  relationField: string, 
  filter: FilterParams
): FilterCondition {
  return {
    field: relationField,
    operator: ComparisonOperator.EQ,
    value: filter
  };
}

// -----------------------------------------------------------------------------
// Journey-Specific Filter Builders
// -----------------------------------------------------------------------------

/**
 * Creates a filter for health metrics within a time range
 * 
 * @param userId The user ID
 * @param metricType The type of health metric
 * @param startDate The start date (inclusive)
 * @param endDate The end date (inclusive)
 * @returns A filter group for health metrics
 */
export function healthMetricsFilter(
  userId: string,
  metricType?: string | string[],
  startDate?: Date,
  endDate?: Date
): FilterGroup {
  const conditions: Array<AnyFilterCondition | FilterGroup> = [
    equals('userId', userId)
  ];

  if (metricType) {
    if (Array.isArray(metricType)) {
      conditions.push(inArray('metricType', metricType));
    } else {
      conditions.push(equals('metricType', metricType));
    }
  }

  if (startDate && endDate) {
    conditions.push(dateRange('timestamp', startDate, endDate));
  } else if (startDate) {
    conditions.push(greaterThanOrEqual('timestamp', startDate));
  } else if (endDate) {
    conditions.push(lessThanOrEqual('timestamp', endDate));
  }

  return and(conditions);
}

/**
 * Creates a filter for health goals
 * 
 * @param userId The user ID
 * @param goalType The type of health goal
 * @param status The goal status
 * @returns A filter group for health goals
 */
export function healthGoalsFilter(
  userId: string,
  goalType?: string | string[],
  status?: string | string[]
): FilterGroup {
  const conditions: Array<AnyFilterCondition | FilterGroup> = [
    equals('userId', userId)
  ];

  if (goalType) {
    if (Array.isArray(goalType)) {
      conditions.push(inArray('goalType', goalType));
    } else {
      conditions.push(equals('goalType', goalType));
    }
  }

  if (status) {
    if (Array.isArray(status)) {
      conditions.push(inArray('status', status));
    } else {
      conditions.push(equals('status', status));
    }
  }

  return and(conditions);
}

/**
 * Creates a filter for care appointments
 * 
 * @param userId The user ID
 * @param providerId The provider ID
 * @param status The appointment status
 * @param startDate The start date (inclusive)
 * @param endDate The end date (inclusive)
 * @returns A filter group for care appointments
 */
export function careAppointmentsFilter(
  userId: string,
  providerId?: string,
  status?: string | string[],
  startDate?: Date,
  endDate?: Date
): FilterGroup {
  const conditions: Array<AnyFilterCondition | FilterGroup> = [
    equals('userId', userId)
  ];

  if (providerId) {
    conditions.push(equals('providerId', providerId));
  }

  if (status) {
    if (Array.isArray(status)) {
      conditions.push(inArray('status', status));
    } else {
      conditions.push(equals('status', status));
    }
  }

  if (startDate && endDate) {
    conditions.push(dateRange('date', startDate, endDate));
  } else if (startDate) {
    conditions.push(greaterThanOrEqual('date', startDate));
  } else if (endDate) {
    conditions.push(lessThanOrEqual('date', endDate));
  }

  return and(conditions);
}

/**
 * Creates a filter for care providers
 * 
 * @param specialty The provider specialty
 * @param location The provider location
 * @param searchTerm A search term for provider name or description
 * @returns A filter group for care providers
 */
export function careProvidersFilter(
  specialty?: string | string[],
  location?: string,
  searchTerm?: string
): FilterGroup {
  const conditions: Array<AnyFilterCondition | FilterGroup> = [];

  if (specialty) {
    if (Array.isArray(specialty)) {
      conditions.push(inArray('specialty', specialty));
    } else {
      conditions.push(equals('specialty', specialty));
    }
  }

  if (location) {
    conditions.push(contains('location', location, false));
  }

  if (searchTerm) {
    conditions.push(
      multiFieldSearch(searchTerm, ['name', 'description'], false)
    );
  }

  return conditions.length > 0 ? and(conditions) : and([]);
}

/**
 * Creates a filter for plan benefits
 * 
 * @param planId The plan ID
 * @param benefitType The benefit type
 * @param searchTerm A search term for benefit name or description
 * @returns A filter group for plan benefits
 */
export function planBenefitsFilter(
  planId: string,
  benefitType?: string | string[],
  searchTerm?: string
): FilterGroup {
  const conditions: Array<AnyFilterCondition | FilterGroup> = [
    equals('planId', planId)
  ];

  if (benefitType) {
    if (Array.isArray(benefitType)) {
      conditions.push(inArray('benefitType', benefitType));
    } else {
      conditions.push(equals('benefitType', benefitType));
    }
  }

  if (searchTerm) {
    conditions.push(
      multiFieldSearch(searchTerm, ['name', 'description'], false)
    );
  }

  return and(conditions);
}

/**
 * Creates a filter for plan claims
 * 
 * @param userId The user ID
 * @param status The claim status
 * @param startDate The start date (inclusive)
 * @param endDate The end date (inclusive)
 * @returns A filter group for plan claims
 */
export function planClaimsFilter(
  userId: string,
  status?: string | string[],
  startDate?: Date,
  endDate?: Date
): FilterGroup {
  const conditions: Array<AnyFilterCondition | FilterGroup> = [
    equals('userId', userId)
  ];

  if (status) {
    if (Array.isArray(status)) {
      conditions.push(inArray('status', status));
    } else {
      conditions.push(equals('status', status));
    }
  }

  if (startDate && endDate) {
    conditions.push(dateRange('submissionDate', startDate, endDate));
  } else if (startDate) {
    conditions.push(greaterThanOrEqual('submissionDate', startDate));
  } else if (endDate) {
    conditions.push(lessThanOrEqual('submissionDate', endDate));
  }

  return and(conditions);
}

/**
 * Creates a filter for journey-specific entities
 * 
 * @param journeyId The journey ID
 * @param userId The user ID
 * @returns A filter group for journey-specific entities
 */
export function journeyFilter(
  journeyId: JourneyId,
  userId?: string
): FilterGroup {
  const conditions: Array<AnyFilterCondition | FilterGroup> = [
    equals('journeyId', journeyId)
  ];

  if (userId) {
    conditions.push(equals('userId', userId));
  }

  return and(conditions);
}

// -----------------------------------------------------------------------------
// TimescaleDB-Specific Filter Optimizations
// -----------------------------------------------------------------------------

/**
 * Creates an optimized filter for time-series data in TimescaleDB
 * 
 * @param timeField The timestamp field name
 * @param startTime The start time (inclusive)
 * @param endTime The end time (inclusive)
 * @param interval The time bucket interval (e.g., '1 hour', '30 minutes')
 * @param additionalFilters Additional filters to apply
 * @returns A filter object optimized for TimescaleDB
 */
export function timeSeriesFilter(
  timeField: string,
  startTime: Date,
  endTime: Date,
  interval?: string,
  additionalFilters?: FilterParams
): any {
  // This is a specialized filter that will be transformed into a TimescaleDB-optimized query
  // The actual transformation happens in the query execution layer
  const timeRangeFilter = dateRange(timeField, startTime, endTime);
  
  if (additionalFilters) {
    return {
      timescaleOptions: {
        timeField,
        interval: interval || '1 hour',
        startTime,
        endTime
      },
      filter: and([
        timeRangeFilter,
        ...(Array.isArray(additionalFilters) ? additionalFilters : [additionalFilters])
      ])
    };
  }
  
  return {
    timescaleOptions: {
      timeField,
      interval: interval || '1 hour',
      startTime,
      endTime
    },
    filter: timeRangeFilter
  };
}

/**
 * Creates an optimized filter for health metrics time-series data
 * 
 * @param userId The user ID
 * @param metricType The type of health metric
 * @param startTime The start time (inclusive)
 * @param endTime The end time (inclusive)
 * @param interval The time bucket interval (e.g., '1 hour', '30 minutes')
 * @returns A filter object optimized for TimescaleDB health metrics
 */
export function healthMetricsTimeSeriesFilter(
  userId: string,
  metricType: string,
  startTime: Date,
  endTime: Date,
  interval?: string
): any {
  const baseFilter = healthMetricsFilter(userId, metricType, startTime, endTime);
  
  return {
    timescaleOptions: {
      timeField: 'timestamp',
      interval: interval || '1 hour',
      startTime,
      endTime,
      aggregations: ['avg', 'min', 'max'],
      groupBy: ['metricType']
    },
    filter: baseFilter
  };
}

// -----------------------------------------------------------------------------
// Filter Conversion Utilities
// -----------------------------------------------------------------------------

/**
 * Converts a filter condition to a Prisma where clause
 * 
 * @param condition The filter condition to convert
 * @returns The equivalent Prisma where clause
 */
export function filterConditionToPrisma(condition: AnyFilterCondition): any {
  const { field, operator, value } = condition;
  const fieldPath = field.split('.');
  
  // Handle nested fields
  if (fieldPath.length > 1) {
    return nestedFilterToPrisma(fieldPath, operator, value, condition);
  }
  
  // Handle root-level fields
  switch (operator) {
    case ComparisonOperator.EQ:
      return { [field]: { equals: value } };
    case ComparisonOperator.NE:
      return { [field]: { not: { equals: value } } };
    case ComparisonOperator.GT:
      return { [field]: { gt: value } };
    case ComparisonOperator.GTE:
      return { [field]: { gte: value } };
    case ComparisonOperator.LT:
      return { [field]: { lt: value } };
    case ComparisonOperator.LTE:
      return { [field]: { lte: value } };
    case ComparisonOperator.IN:
      return { [field]: { in: value } };
    case ComparisonOperator.NOT_IN:
      return { [field]: { notIn: value } };
    case ComparisonOperator.CONTAINS:
      return { [field]: { contains: value } };
    case ComparisonOperator.CONTAINS_I:
      return { [field]: { contains: value, mode: 'insensitive' } };
    case ComparisonOperator.STARTS_WITH:
      return { [field]: { startsWith: value } };
    case ComparisonOperator.STARTS_WITH_I:
      return { [field]: { startsWith: value, mode: 'insensitive' } };
    case ComparisonOperator.ENDS_WITH:
      return { [field]: { endsWith: value } };
    case ComparisonOperator.ENDS_WITH_I:
      return { [field]: { endsWith: value, mode: 'insensitive' } };
    case ComparisonOperator.IS_NULL:
      return { [field]: { equals: null } };
    case ComparisonOperator.IS_NOT_NULL:
      return { [field]: { not: { equals: null } } };
    case ComparisonOperator.BETWEEN:
      return { 
        AND: [
          { [field]: { gte: value[0] } },
          { [field]: { lte: value[1] } }
        ] 
      };
    case ComparisonOperator.REGEX:
      // Prisma doesn't directly support regex, so we use a workaround with raw queries
      // This will be handled specially in the query execution layer
      return { 
        [field]: { 
          _regex: { 
            pattern: value, 
            flags: (condition as RegexFilterCondition).flags 
          } 
        } 
      };
    case ComparisonOperator.JSON_PATH:
      const jsonCondition = condition as JsonPathFilterCondition;
      // JSON path queries will be handled specially in the query execution layer
      return { 
        [field]: { 
          _jsonPath: { 
            path: jsonCondition.path, 
            value: jsonCondition.value,
            operator: jsonCondition.pathOperator || ComparisonOperator.EQ
          } 
        } 
      };
    default:
      throw new FilterError(`Unsupported operator: ${operator}`);
  }
}

/**
 * Converts a nested filter condition to a Prisma where clause
 * 
 * @param fieldPath The field path split into parts
 * @param operator The comparison operator
 * @param value The value to compare against
 * @param condition The original filter condition
 * @returns The equivalent Prisma where clause for a nested field
 */
function nestedFilterToPrisma(
  fieldPath: string[], 
  operator: ComparisonOperator, 
  value: any,
  condition: AnyFilterCondition
): any {
  // Build the nested structure from inside out
  let result: any = {};
  const lastField = fieldPath[fieldPath.length - 1];
  
  // Handle the innermost field based on the operator
  switch (operator) {
    case ComparisonOperator.EQ:
      result = { equals: value };
      break;
    case ComparisonOperator.NE:
      result = { not: { equals: value } };
      break;
    case ComparisonOperator.GT:
      result = { gt: value };
      break;
    case ComparisonOperator.GTE:
      result = { gte: value };
      break;
    case ComparisonOperator.LT:
      result = { lt: value };
      break;
    case ComparisonOperator.LTE:
      result = { lte: value };
      break;
    case ComparisonOperator.IN:
      result = { in: value };
      break;
    case ComparisonOperator.NOT_IN:
      result = { notIn: value };
      break;
    case ComparisonOperator.CONTAINS:
      result = { contains: value };
      break;
    case ComparisonOperator.CONTAINS_I:
      result = { contains: value, mode: 'insensitive' };
      break;
    case ComparisonOperator.STARTS_WITH:
      result = { startsWith: value };
      break;
    case ComparisonOperator.STARTS_WITH_I:
      result = { startsWith: value, mode: 'insensitive' };
      break;
    case ComparisonOperator.ENDS_WITH:
      result = { endsWith: value };
      break;
    case ComparisonOperator.ENDS_WITH_I:
      result = { endsWith: value, mode: 'insensitive' };
      break;
    case ComparisonOperator.IS_NULL:
      result = { equals: null };
      break;
    case ComparisonOperator.IS_NOT_NULL:
      result = { not: { equals: null } };
      break;
    case ComparisonOperator.BETWEEN:
      // For nested BETWEEN, we need to use a different approach
      return { 
        AND: [
          { [fieldPath[0]]: buildNestedPath(fieldPath.slice(1, -1), { [lastField]: { gte: value[0] } }) },
          { [fieldPath[0]]: buildNestedPath(fieldPath.slice(1, -1), { [lastField]: { lte: value[1] } }) }
        ] 
      };
    case ComparisonOperator.REGEX:
    case ComparisonOperator.JSON_PATH:
      // These operators require special handling in the query execution layer
      // We'll use a placeholder that will be processed later
      result = { 
        _specialOperator: { 
          operator, 
          value,
          condition
        } 
      };
      break;
    default:
      throw new FilterError(`Unsupported operator for nested fields: ${operator}`);
  }
  
  // Build the nested structure
  result = { [lastField]: result };
  
  // Work backwards through the path to build the full nested structure
  for (let i = fieldPath.length - 2; i > 0; i--) {
    result = { [fieldPath[i]]: result };
  }
  
  return { [fieldPath[0]]: result };
}

/**
 * Helper function to build a nested path for Prisma queries
 * 
 * @param pathParts The parts of the path
 * @param innerCondition The innermost condition
 * @returns The nested path object
 */
function buildNestedPath(pathParts: string[], innerCondition: any): any {
  if (pathParts.length === 0) {
    return innerCondition;
  }
  
  return { [pathParts[0]]: buildNestedPath(pathParts.slice(1), innerCondition) };
}

/**
 * Converts a filter group to a Prisma where clause
 * 
 * @param group The filter group to convert
 * @returns The equivalent Prisma where clause
 */
export function filterGroupToPrisma(group: FilterGroup): any {
  const { operator, conditions } = group;
  
  switch (operator) {
    case LogicalOperator.AND:
      return { 
        AND: conditions.map(condition => 
          (condition as FilterGroup).operator 
            ? filterGroupToPrisma(condition as FilterGroup) 
            : filterConditionToPrisma(condition as AnyFilterCondition)
        ) 
      };
    case LogicalOperator.OR:
      return { 
        OR: conditions.map(condition => 
          (condition as FilterGroup).operator 
            ? filterGroupToPrisma(condition as FilterGroup) 
            : filterConditionToPrisma(condition as AnyFilterCondition)
        ) 
      };
    case LogicalOperator.NOT:
      if (conditions.length !== 1) {
        throw new FilterError('NOT operator requires exactly one condition');
      }
      
      const condition = conditions[0];
      return { 
        NOT: (condition as FilterGroup).operator 
          ? filterGroupToPrisma(condition as FilterGroup) 
          : filterConditionToPrisma(condition as AnyFilterCondition) 
      };
    default:
      throw new FilterError(`Unsupported logical operator: ${operator}`);
  }
}

/**
 * Converts filter parameters to a Prisma where clause
 * 
 * @param filter The filter parameters to convert
 * @returns The equivalent Prisma where clause
 */
export function filterToPrisma(filter: FilterParams): any {
  if (!filter) {
    return {};
  }
  
  if (Array.isArray(filter)) {
    // If it's an array, treat it as an AND group
    return filterGroupToPrisma({
      operator: LogicalOperator.AND,
      conditions: filter
    });
  } else if ((filter as FilterGroup).operator) {
    return filterGroupToPrisma(filter as FilterGroup);
  } else {
    return filterConditionToPrisma(filter as AnyFilterCondition);
  }
}

/**
 * Converts typed filter parameters to standard filter parameters
 * 
 * @param typedFilter The typed filter parameters
 * @returns The equivalent standard filter parameters
 */
export function typedFilterToFilter<T>(
  typedFilter: TypedFilterParams<T>
): FilterParams {
  if (!typedFilter) {
    return undefined;
  }
  
  // Handle filter groups (AND, OR, NOT)
  const logicalOperators = Object.values(LogicalOperator);
  const logicalOperatorKeys = Object.keys(typedFilter).filter(key => 
    logicalOperators.includes(key as LogicalOperator)
  );
  
  if (logicalOperatorKeys.length > 0) {
    const operator = logicalOperatorKeys[0] as LogicalOperator;
    const conditions = (typedFilter as any)[operator];
    
    if (!Array.isArray(conditions)) {
      throw new FilterError(`${operator} operator requires an array of conditions`);
    }
    
    return {
      operator,
      conditions: conditions.map(condition => typedFilterToFilter(condition))
    };
  }
  
  // Handle filter conditions
  const conditions: AnyFilterCondition[] = [];
  
  for (const [field, operators] of Object.entries(typedFilter)) {
    if (!operators) continue;
    
    for (const [operator, value] of Object.entries(operators)) {
      if (value === undefined) continue;
      
      const comparisonOperator = operator as ComparisonOperator;
      
      switch (comparisonOperator) {
        case ComparisonOperator.BETWEEN:
          conditions.push({
            field,
            operator: comparisonOperator,
            value: value as [any, any]
          });
          break;
        case ComparisonOperator.IN:
        case ComparisonOperator.NOT_IN:
          conditions.push({
            field,
            operator: comparisonOperator,
            value: value as any[]
          });
          break;
        case ComparisonOperator.IS_NULL:
        case ComparisonOperator.IS_NOT_NULL:
          conditions.push({
            field,
            operator: comparisonOperator
          });
          break;
        case ComparisonOperator.REGEX:
          const regexValue = value as { pattern: string; flags?: string };
          conditions.push({
            field,
            operator: comparisonOperator,
            value: regexValue.pattern,
            flags: regexValue.flags
          });
          break;
        case ComparisonOperator.JSON_PATH:
          const jsonPathValue = value as { path: string; value: any; pathOperator?: ComparisonOperator };
          conditions.push({
            field,
            operator: comparisonOperator,
            path: jsonPathValue.path,
            value: jsonPathValue.value,
            pathOperator: jsonPathValue.pathOperator
          });
          break;
        default:
          conditions.push({
            field,
            operator: comparisonOperator,
            value
          });
      }
    }
  }
  
  if (conditions.length === 1) {
    return conditions[0];
  } else if (conditions.length > 1) {
    return {
      operator: LogicalOperator.AND,
      conditions
    };
  }
  
  return undefined;
}

/**
 * Creates a type-safe filter builder for a specific model
 * 
 * @template T The model type
 * @returns A function that creates type-safe filter conditions
 */
export function createFilterBuilder<T>() {
  return {
    /**
     * Creates an equals filter condition
     * 
     * @param field The field to filter on
     * @param value The value to compare against
     * @returns A filter condition for equality
     */
    equals<K extends keyof T>(field: K, value: T[K]): FilterCondition {
      return equals(field as string, value);
    },
    
    /**
     * Creates a not equals filter condition
     * 
     * @param field The field to filter on
     * @param value The value to compare against
     * @returns A filter condition for inequality
     */
    notEquals<K extends keyof T>(field: K, value: T[K]): FilterCondition {
      return notEquals(field as string, value);
    },
    
    /**
     * Creates a greater than filter condition
     * 
     * @param field The field to filter on
     * @param value The value to compare against
     * @returns A filter condition for greater than comparison
     */
    greaterThan<K extends keyof T>(
      field: K, 
      value: T[K] extends number | Date ? T[K] : never
    ): FilterCondition {
      return greaterThan(field as string, value as number | Date);
    },
    
    /**
     * Creates a greater than or equal filter condition
     * 
     * @param field The field to filter on
     * @param value The value to compare against
     * @returns A filter condition for greater than or equal comparison
     */
    greaterThanOrEqual<K extends keyof T>(
      field: K, 
      value: T[K] extends number | Date ? T[K] : never
    ): FilterCondition {
      return greaterThanOrEqual(field as string, value as number | Date);
    },
    
    /**
     * Creates a less than filter condition
     * 
     * @param field The field to filter on
     * @param value The value to compare against
     * @returns A filter condition for less than comparison
     */
    lessThan<K extends keyof T>(
      field: K, 
      value: T[K] extends number | Date ? T[K] : never
    ): FilterCondition {
      return lessThan(field as string, value as number | Date);
    },
    
    /**
     * Creates a less than or equal filter condition
     * 
     * @param field The field to filter on
     * @param value The value to compare against
     * @returns A filter condition for less than or equal comparison
     */
    lessThanOrEqual<K extends keyof T>(
      field: K, 
      value: T[K] extends number | Date ? T[K] : never
    ): FilterCondition {
      return lessThanOrEqual(field as string, value as number | Date);
    },
    
    /**
     * Creates a contains filter condition for string fields
     * 
     * @param field The field to filter on
     * @param value The substring to check for
     * @param caseSensitive Whether the comparison should be case-sensitive
     * @returns A filter condition for string contains
     */
    contains<K extends keyof T>(
      field: K, 
      value: T[K] extends string ? string : never,
      caseSensitive = true
    ): FilterCondition {
      return contains(field as string, value as string, caseSensitive);
    },
    
    /**
     * Creates a starts with filter condition for string fields
     * 
     * @param field The field to filter on
     * @param value The prefix to check for
     * @param caseSensitive Whether the comparison should be case-sensitive
     * @returns A filter condition for string starts with
     */
    startsWith<K extends keyof T>(
      field: K, 
      value: T[K] extends string ? string : never,
      caseSensitive = true
    ): FilterCondition {
      return startsWith(field as string, value as string, caseSensitive);
    },
    
    /**
     * Creates an ends with filter condition for string fields
     * 
     * @param field The field to filter on
     * @param value The suffix to check for
     * @param caseSensitive Whether the comparison should be case-sensitive
     * @returns A filter condition for string ends with
     */
    endsWith<K extends keyof T>(
      field: K, 
      value: T[K] extends string ? string : never,
      caseSensitive = true
    ): FilterCondition {
      return endsWith(field as string, value as string, caseSensitive);
    },
    
    /**
     * Creates an in array filter condition
     * 
     * @param field The field to filter on
     * @param values The array of values to check against
     * @returns A filter condition for in array
     */
    inArray<K extends keyof T>(field: K, values: T[K][]): InFilterCondition {
      return inArray(field as string, values);
    },
    
    /**
     * Creates a not in array filter condition
     * 
     * @param field The field to filter on
     * @param values The array of values to check against
     * @returns A filter condition for not in array
     */
    notInArray<K extends keyof T>(field: K, values: T[K][]): InFilterCondition {
      return notInArray(field as string, values);
    },
    
    /**
     * Creates a between filter condition
     * 
     * @param field The field to filter on
     * @param min The minimum value (inclusive)
     * @param max The maximum value (inclusive)
     * @returns A filter condition for between
     */
    between<K extends keyof T>(
      field: K, 
      min: T[K], 
      max: T[K]
    ): BetweenFilterCondition {
      return between(field as string, min, max);
    },
    
    /**
     * Creates an is null filter condition
     * 
     * @param field The field to filter on
     * @returns A filter condition for is null
     */
    isNull<K extends keyof T>(field: K): NullFilterCondition {
      return isNull(field as string);
    },
    
    /**
     * Creates an is not null filter condition
     * 
     * @param field The field to filter on
     * @returns A filter condition for is not null
     */
    isNotNull<K extends keyof T>(field: K): NullFilterCondition {
      return isNotNull(field as string);
    },
    
    /**
     * Creates a date range filter condition
     * 
     * @param field The date field to filter on
     * @param startDate The start date (inclusive)
     * @param endDate The end date (inclusive)
     * @returns A filter group for the date range
     */
    dateRange<K extends keyof T>(
      field: K, 
      startDate: T[K] extends Date ? Date : never, 
      endDate: T[K] extends Date ? Date : never
    ): FilterGroup {
      return dateRange(field as string, startDate as Date, endDate as Date);
    },
    
    /**
     * Creates a numeric range filter condition
     * 
     * @param field The numeric field to filter on
     * @param min The minimum value (inclusive)
     * @param max The maximum value (inclusive)
     * @returns A filter group for the numeric range
     */
    numericRange<K extends keyof T>(
      field: K, 
      min: T[K] extends number ? number : never, 
      max: T[K] extends number ? number : never
    ): FilterGroup {
      return numericRange(field as string, min as number, max as number);
    },
    
    /**
     * Creates a filter for searching across multiple string fields
     * 
     * @param searchTerm The search term to look for
     * @param fields The fields to search in
     * @param caseSensitive Whether the search should be case-sensitive
     * @returns A filter group for the multi-field search
     */
    multiFieldSearch(
      searchTerm: string, 
      fields: Array<keyof T>, 
      caseSensitive = false
    ): FilterGroup {
      return multiFieldSearch(searchTerm, fields as string[], caseSensitive);
    },
    
    /**
     * Creates a filter for a nested relation
     * 
     * @param relationField The relation field name
     * @param filter The filter to apply to the relation
     * @returns A filter condition for the nested relation
     */
    nestedFilter<K extends keyof T>(
      relationField: K, 
      filter: FilterParams
    ): FilterCondition {
      return nestedFilter(relationField as string, filter);
    },
    
    /**
     * Creates a filter group with AND logic
     * 
     * @param conditions The conditions to combine with AND logic
     * @returns A filter group with AND logic
     */
    and(
      conditions: Array<AnyFilterCondition | FilterGroup>
    ): FilterGroup {
      return and(conditions);
    },
    
    /**
     * Creates a filter group with OR logic
     * 
     * @param conditions The conditions to combine with OR logic
     * @returns A filter group with OR logic
     */
    or(
      conditions: Array<AnyFilterCondition | FilterGroup>
    ): FilterGroup {
      return or(conditions);
    },
    
    /**
     * Creates a filter group with NOT logic
     * 
     * @param condition The condition to negate
     * @returns A filter group with NOT logic
     */
    not(
      condition: AnyFilterCondition | FilterGroup
    ): FilterGroup {
      return not(condition);
    }
  };
}

/**
 * Creates a type-safe filter builder for health metrics
 * 
 * @template T The health metric model type
 * @returns A function that creates type-safe health metric filters
 */
export function createHealthMetricsFilterBuilder<T>() {
  const baseBuilder = createFilterBuilder<T>();
  
  return {
    ...baseBuilder,
    
    /**
     * Creates a filter for health metrics within a time range
     * 
     * @param userId The user ID
     * @param metricType The type of health metric
     * @param startDate The start date (inclusive)
     * @param endDate The end date (inclusive)
     * @returns A filter group for health metrics
     */
    forUserAndTimeRange(
      userId: string,
      metricType?: string | string[],
      startDate?: Date,
      endDate?: Date
    ): FilterGroup {
      return healthMetricsFilter(userId, metricType, startDate, endDate);
    },
    
    /**
     * Creates an optimized filter for health metrics time-series data
     * 
     * @param userId The user ID
     * @param metricType The type of health metric
     * @param startTime The start time (inclusive)
     * @param endTime The end time (inclusive)
     * @param interval The time bucket interval (e.g., '1 hour', '30 minutes')
     * @returns A filter object optimized for TimescaleDB health metrics
     */
    forTimeSeries(
      userId: string,
      metricType: string,
      startTime: Date,
      endTime: Date,
      interval?: string
    ): any {
      return healthMetricsTimeSeriesFilter(userId, metricType, startTime, endTime, interval);
    }
  };
}

/**
 * Creates a type-safe filter builder for care appointments
 * 
 * @template T The appointment model type
 * @returns A function that creates type-safe appointment filters
 */
export function createCareAppointmentsFilterBuilder<T>() {
  const baseBuilder = createFilterBuilder<T>();
  
  return {
    ...baseBuilder,
    
    /**
     * Creates a filter for care appointments
     * 
     * @param userId The user ID
     * @param providerId The provider ID
     * @param status The appointment status
     * @param startDate The start date (inclusive)
     * @param endDate The end date (inclusive)
     * @returns A filter group for care appointments
     */
    forUserAndDateRange(
      userId: string,
      providerId?: string,
      status?: string | string[],
      startDate?: Date,
      endDate?: Date
    ): FilterGroup {
      return careAppointmentsFilter(userId, providerId, status, startDate, endDate);
    },
    
    /**
     * Creates a filter for upcoming appointments
     * 
     * @param userId The user ID
     * @param status Optional appointment status
     * @returns A filter group for upcoming appointments
     */
    forUpcoming(
      userId: string,
      status?: string | string[]
    ): FilterGroup {
      const today = new Date();
      return careAppointmentsFilter(userId, undefined, status, today, undefined);
    }
  };
}

/**
 * Creates a type-safe filter builder for plan claims
 * 
 * @template T The claim model type
 * @returns A function that creates type-safe claim filters
 */
export function createPlanClaimsFilterBuilder<T>() {
  const baseBuilder = createFilterBuilder<T>();
  
  return {
    ...baseBuilder,
    
    /**
     * Creates a filter for plan claims
     * 
     * @param userId The user ID
     * @param status The claim status
     * @param startDate The start date (inclusive)
     * @param endDate The end date (inclusive)
     * @returns A filter group for plan claims
     */
    forUserAndDateRange(
      userId: string,
      status?: string | string[],
      startDate?: Date,
      endDate?: Date
    ): FilterGroup {
      return planClaimsFilter(userId, status, startDate, endDate);
    },
    
    /**
     * Creates a filter for recent claims
     * 
     * @param userId The user ID
     * @param daysBack Number of days to look back
     * @returns A filter group for recent claims
     */
    forRecent(
      userId: string,
      daysBack: number = 30
    ): FilterGroup {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - daysBack);
      
      return planClaimsFilter(userId, undefined, pastDate, today);
    }
  };
}