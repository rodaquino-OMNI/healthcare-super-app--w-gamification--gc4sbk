import { GraphQLScalarType, Kind } from 'graphql';
import { DateScalarType } from '@austa/interfaces/api';

/**
 * Validates if a string is a valid ISO 8601 date format (YYYY-MM-DD)
 * @param value The string to validate
 * @returns True if the string is a valid ISO 8601 date format
 */
const isValidISODate = (value: string): boolean => {
  // ISO 8601 date format: YYYY-MM-DD
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!isoDateRegex.test(value)) {
    return false;
  }
  
  // Additional validation by attempting to parse the date
  try {
    const date = new Date(value);
    // Ensure the date is valid and doesn't have time components
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === value && !isNaN(date.getTime());
  } catch (e) {
    return false;
  }
};

/**
 * Extracts the date part (YYYY-MM-DD) from a Date object or ISO string
 * @param date Date object or ISO string
 * @returns Date string in YYYY-MM-DD format
 */
const extractDatePart = (date: Date | string): string => {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    // If it's already a valid ISO date string (YYYY-MM-DD), return it
    if (isValidISODate(date)) {
      return date;
    }
    
    // Otherwise, try to parse it and extract the date part
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  }
  
  throw new Error(
    `Date scalar extraction error: Unable to extract date part from ${date}. ` +
    `This may affect date fields in health records, appointments, or plan coverage dates.`
  );
};

/**
 * GraphQL scalar type for Date values without time components.
 * Used for date fields in health records, appointments, and plan coverage dates across all journeys.
 * Validates and serializes ISO 8601 date strings in YYYY-MM-DD format.
 */
export const DateScalar: DateScalarType = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO 8601 date string without time components (YYYY-MM-DD)',
  
  // Convert outgoing Date to ISO date string (YYYY-MM-DD)
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return extractDatePart(value);
    }
    
    if (typeof value === 'string') {
      try {
        return extractDatePart(value);
      } catch (e) {
        throw new Error(
          `Date scalar serialization error: Invalid date string provided. ` +
          `This may affect date fields in health records, appointments, or plan coverage dates.`
        );
      }
    }
    
    throw new Error(
      `Date scalar serialization error: Expected Date instance or ISO date string, got ${typeof value}. ` +
      `This may affect date fields across all journeys.`
    );
  },
  
  // Convert input string to Date
  parseValue(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new Error(
        `Date scalar parse error: Expected ISO date string, got ${typeof value}. ` +
        `This may affect data submission in all journeys.`
      );
    }
    
    if (!isValidISODate(value)) {
      throw new Error(
        `Date scalar parse error: Invalid ISO 8601 date format. ` +
        `Expected format YYYY-MM-DD, got ${value}. ` +
        `This may affect health records in Health journey, appointments in Care journey, or coverage dates in Plan journey.`
      );
    }
    
    const date = new Date(value);
    // Set the time to midnight UTC to ensure we're only dealing with the date part
    date.setUTCHours(0, 0, 0, 0);
    return date;
  },
  
  // Convert AST literal to Date
  parseLiteral(ast): Date {
    if (ast.kind !== Kind.STRING) {
      throw new Error(
        `Date scalar parse error: Expected AST kind STRING, got ${ast.kind}. ` +
        `This may affect GraphQL queries across all journeys.`
      );
    }
    
    const { value } = ast;
    if (!isValidISODate(value)) {
      throw new Error(
        `Date scalar parse error: Invalid ISO 8601 date format in literal. ` +
        `Expected format YYYY-MM-DD, got ${value}. ` +
        `This may affect queries for health records, appointments, or coverage dates.`
      );
    }
    
    const date = new Date(value);
    // Set the time to midnight UTC to ensure we're only dealing with the date part
    date.setUTCHours(0, 0, 0, 0);
    return date;
  },
});

export default DateScalar;