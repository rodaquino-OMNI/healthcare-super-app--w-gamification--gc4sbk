import { GraphQLScalarType, Kind } from 'graphql';
import { DateTimeScalarType } from '@austa/interfaces/api';

/**
 * Validates if a string is a valid ISO 8601 datetime with timezone information
 * @param value The string to validate
 * @returns True if the string is a valid ISO 8601 datetime with timezone
 */
const isValidISODateTimeWithTimezone = (value: string): boolean => {
  // ISO 8601 format with timezone: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ss.sss+HH:mm
  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
  
  if (!isoDateTimeRegex.test(value)) {
    return false;
  }
  
  // Additional validation by attempting to parse the date
  try {
    const date = new Date(value);
    return !isNaN(date.getTime());
  } catch (e) {
    return false;
  }
};

/**
 * GraphQL scalar type for DateTime values with timezone support.
 * Used for appointment scheduling, health metrics timestamping, and event timing across all journeys.
 * Validates and serializes ISO 8601 datetime strings with timezone information.
 */
export const DateTimeScalar: DateTimeScalarType = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO 8601 datetime string with timezone information (YYYY-MM-DDTHH:mm:ss.sssZ)',
  
  // Convert outgoing Date to ISO string with timezone
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      throw new Error(
        `DateTime scalar serialization error: Invalid datetime string provided. ` +
        `This may affect appointment scheduling in Care journey or health metrics in Health journey.`
      );
    }
    
    throw new Error(
      `DateTime scalar serialization error: Expected Date instance or ISO datetime string, got ${typeof value}. ` +
      `This may affect timestamp fields across all journeys.`
    );
  },
  
  // Convert input string to Date
  parseValue(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new Error(
        `DateTime scalar parse error: Expected ISO datetime string, got ${typeof value}. ` +
        `This may affect data submission in all journeys.`
      );
    }
    
    if (!isValidISODateTimeWithTimezone(value)) {
      throw new Error(
        `DateTime scalar parse error: Invalid ISO 8601 datetime format with timezone. ` +
        `Expected format YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ss.sss+HH:mm, got ${value}. ` +
        `This may affect appointment scheduling in Care journey or event timing in Gamification.`
      );
    }
    
    const date = new Date(value);
    return date;
  },
  
  // Convert AST literal to Date
  parseLiteral(ast): Date {
    if (ast.kind !== Kind.STRING) {
      throw new Error(
        `DateTime scalar parse error: Expected AST kind STRING, got ${ast.kind}. ` +
        `This may affect GraphQL queries across all journeys.`
      );
    }
    
    const { value } = ast;
    if (!isValidISODateTimeWithTimezone(value)) {
      throw new Error(
        `DateTime scalar parse error: Invalid ISO 8601 datetime format with timezone in literal. ` +
        `Expected format YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ss.sss+HH:mm, got ${value}. ` +
        `This may affect queries for health metrics, appointments, or event timing.`
      );
    }
    
    const date = new Date(value);
    return date;
  },
});

export default DateTimeScalar;