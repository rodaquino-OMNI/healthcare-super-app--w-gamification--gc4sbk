/**
 * Type conversion utilities for safely handling different data types in events.
 * 
 * This module provides functions for converting between various data types with robust
 * error handling and validation. It ensures that data conversions are performed consistently
 * across all services, preventing type-related errors during event processing.
 * 
 * @module type-converters
 */

/**
 * Error thrown when a type conversion fails.
 */
export class TypeConversionError extends Error {
  constructor(
    public readonly value: unknown,
    public readonly targetType: string,
    message?: string
  ) {
    super(message || `Failed to convert value '${value}' to type ${targetType}`);
    this.name = 'TypeConversionError';
  }
}

// ===== Basic Type Converters =====

/**
 * Safely converts a value to a string.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted string value
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function toString(value: unknown, defaultValue?: string): string {
  if (value === null || value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'string', 'Cannot convert null or undefined to string');
  }

  if (typeof value === 'string') return value;
  
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(value, 'string', `Failed to stringify object: ${(error as Error).message}`);
    }
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(value, 'string');
}

/**
 * Safely converts a value to a number.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted number value
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function toNumber(value: unknown, defaultValue?: number): number {
  if (value === null || value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'number', 'Cannot convert null or undefined to number');
  }

  if (typeof value === 'number') {
    if (isNaN(value)) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(value, 'number', 'Cannot convert NaN to number');
    }
    return value;
  }
  
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(value, 'number', 'Cannot convert empty string to number');
    }
    
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
    
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'number', `String '${value}' cannot be converted to a number`);
  }
  
  if (value instanceof Date) {
    return value.getTime();
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(value, 'number');
}

/**
 * Safely converts a value to a boolean.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted boolean value
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function toBoolean(value: unknown, defaultValue?: boolean): boolean {
  if (value === null || value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'boolean', 'Cannot convert null or undefined to boolean');
  }

  if (typeof value === 'boolean') return value;
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'true' || trimmed === 'yes' || trimmed === '1' || trimmed === 'on') return true;
    if (trimmed === 'false' || trimmed === 'no' || trimmed === '0' || trimmed === 'off') return false;
    
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'boolean', `String '${value}' cannot be converted to a boolean`);
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(value, 'boolean');
}

// ===== Date/Time Converters =====

/**
 * Safely converts a value to a Date object.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted Date object
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function toDate(value: unknown, defaultValue?: Date): Date {
  if (value === null || value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'Date', 'Cannot convert null or undefined to Date');
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(value, 'Date', 'Invalid Date object');
    }
    return value;
  }
  
  if (typeof value === 'number') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(value, 'Date', `Number ${value} cannot be converted to a valid Date`);
    }
    return date;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(value, 'Date', 'Cannot convert empty string to Date');
    }
    
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) return date;
    
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'Date', `String '${value}' cannot be converted to a valid Date`);
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(value, 'Date');
}

/**
 * Converts a Date object to an ISO string, with fallback handling.
 * 
 * @param value - The Date to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns ISO string representation of the date
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function toISOString(value: unknown, defaultValue?: string): string {
  try {
    const date = toDate(value);
    return date.toISOString();
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'ISO date string', 
      error instanceof TypeConversionError ? error.message : 'Failed to convert to ISO date string');
  }
}

/**
 * Converts a value to a Unix timestamp (milliseconds since epoch).
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns Timestamp in milliseconds
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function toTimestamp(value: unknown, defaultValue?: number): number {
  try {
    const date = toDate(value);
    return date.getTime();
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'timestamp', 
      error instanceof TypeConversionError ? error.message : 'Failed to convert to timestamp');
  }
}

// ===== Nullable/Optional Value Handlers =====

/**
 * Handles nullable values by applying a converter function if the value is not null or undefined.
 * 
 * @param value - The value to convert
 * @param converter - The converter function to apply
 * @param defaultValue - Optional default value to return if value is null/undefined
 * @returns The converted value or null/undefined/defaultValue
 */
export function convertIfDefined<T, R>(
  value: T | null | undefined,
  converter: (val: T) => R,
  defaultValue?: R
): R | null | undefined {
  if (value === null) return null;
  if (value === undefined) return defaultValue === undefined ? undefined : defaultValue;
  try {
    return converter(value);
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw error;
  }
}

/**
 * Ensures a value is not null or undefined, applying a converter function or returning a default value.
 * 
 * @param value - The value to check and convert
 * @param converter - The converter function to apply
 * @param defaultValue - The default value to return if value is null/undefined
 * @returns The converted value or default value
 * @throws {Error} If value is null/undefined and no default value is provided
 */
export function ensureValue<T, R>(
  value: T | null | undefined,
  converter: (val: T) => R,
  defaultValue?: R
): R {
  if (value === null || value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error('Value is null or undefined');
  }
  
  try {
    return converter(value);
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw error;
  }
}

// ===== Complex Type Converters =====

/**
 * Safely converts a value to an array.
 * 
 * @param value - The value to convert
 * @param itemConverter - Optional function to convert each item in the array
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted array
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function toArray<T>(
  value: unknown,
  itemConverter?: (item: unknown) => T,
  defaultValue?: T[]
): T[] {
  if (value === null || value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'array', 'Cannot convert null or undefined to array');
  }

  let array: unknown[];
  
  if (Array.isArray(value)) {
    array = value;
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        array = parsed;
      } else {
        if (defaultValue !== undefined) return defaultValue;
        throw new TypeConversionError(value, 'array', 'String does not represent a valid array');
      }
    } catch (error) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(value, 'array', `Failed to parse string as array: ${(error as Error).message}`);
    }
  } else if (typeof value === 'object' && value !== null) {
    // Convert object to array of values
    array = Object.values(value);
  } else {
    // Wrap single value in array
    array = [value];
  }
  
  if (itemConverter) {
    try {
      return array.map((item) => itemConverter(item));
    } catch (error) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(
        value, 
        'array with converted items', 
        `Failed to convert array items: ${(error as Error).message}`
      );
    }
  }
  
  return array as T[];
}

/**
 * Safely converts a value to an object.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted object
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function toObject(
  value: unknown,
  defaultValue?: Record<string, unknown>
): Record<string, unknown> {
  if (value === null || value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'object', 'Cannot convert null or undefined to object');
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      } else {
        if (defaultValue !== undefined) return defaultValue;
        throw new TypeConversionError(value, 'object', 'String does not represent a valid object');
      }
    } catch (error) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(value, 'object', `Failed to parse string as object: ${(error as Error).message}`);
    }
  }
  
  if (Array.isArray(value)) {
    // Convert array to object with indices as keys
    return value.reduce((obj, item, index) => {
      obj[index.toString()] = item;
      return obj;
    }, {} as Record<string, unknown>);
  }
  
  // For primitive types, create an object with a 'value' property
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return { value };
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(value, 'object');
}

// ===== Validation Utilities =====

/**
 * Validates that a value is within a specified numeric range.
 * 
 * @param value - The value to validate
 * @param min - The minimum allowed value (inclusive)
 * @param max - The maximum allowed value (inclusive)
 * @param defaultValue - Optional default value to return if validation fails
 * @returns The validated number
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function validateNumberRange(
  value: unknown,
  min: number,
  max: number,
  defaultValue?: number
): number {
  try {
    const num = toNumber(value);
    if (num < min || num > max) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(
        value, 
        `number in range [${min}, ${max}]`, 
        `Value ${num} is outside the allowed range [${min}, ${max}]`
      );
    }
    return num;
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw error;
  }
}

/**
 * Validates that a string matches a specified pattern.
 * 
 * @param value - The value to validate
 * @param pattern - The regex pattern to match against
 * @param defaultValue - Optional default value to return if validation fails
 * @returns The validated string
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function validateStringPattern(
  value: unknown,
  pattern: RegExp,
  defaultValue?: string
): string {
  try {
    const str = toString(value);
    if (!pattern.test(str)) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(
        value, 
        `string matching ${pattern}`, 
        `String '${str}' does not match the required pattern ${pattern}`
      );
    }
    return str;
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw error;
  }
}

/**
 * Validates that a value is one of a set of allowed values.
 * 
 * @param value - The value to validate
 * @param allowedValues - Array of allowed values
 * @param defaultValue - Optional default value to return if validation fails
 * @returns The validated value
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function validateEnum<T>(
  value: unknown,
  allowedValues: readonly T[],
  defaultValue?: T
): T {
  if (allowedValues.some(allowed => allowed === value)) {
    return value as T;
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(
    value, 
    `one of [${allowedValues.join(', ')}]`, 
    `Value is not one of the allowed values: [${allowedValues.join(', ')}]`
  );
}

/**
 * Validates a date is within a specified range.
 * 
 * @param value - The value to validate
 * @param minDate - The earliest allowed date (inclusive)
 * @param maxDate - The latest allowed date (inclusive)
 * @param defaultValue - Optional default value to return if validation fails
 * @returns The validated Date
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function validateDateRange(
  value: unknown,
  minDate: Date,
  maxDate: Date,
  defaultValue?: Date
): Date {
  try {
    const date = toDate(value);
    if (date < minDate || date > maxDate) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(
        value, 
        `date in range [${minDate.toISOString()}, ${maxDate.toISOString()}]`, 
        `Date ${date.toISOString()} is outside the allowed range [${minDate.toISOString()}, ${maxDate.toISOString()}]`
      );
    }
    return date;
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw error;
  }
}

/**
 * Validates an object has all required properties.
 * 
 * @param value - The object to validate
 * @param requiredProps - Array of property names that must exist
 * @param defaultValue - Optional default value to return if validation fails
 * @returns The validated object
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function validateRequiredProps(
  value: unknown,
  requiredProps: string[],
  defaultValue?: Record<string, unknown>
): Record<string, unknown> {
  try {
    const obj = toObject(value);
    const missingProps = requiredProps.filter(prop => !(prop in obj));
    
    if (missingProps.length > 0) {
      if (defaultValue !== undefined) return defaultValue;
      throw new TypeConversionError(
        value, 
        `object with properties [${requiredProps.join(', ')}]`, 
        `Object is missing required properties: [${missingProps.join(', ')}]`
      );
    }
    
    return obj;
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw error;
  }
}

/**
 * Applies a series of converter/validator functions to a value in sequence.
 * 
 * @param value - The initial value
 * @param converters - Array of converter functions to apply in sequence
 * @param defaultValue - Optional default value to return if any conversion fails
 * @returns The final converted value
 * @throws {Error} If any conversion fails and no default value is provided
 */
export function applyConverters<T>(
  value: unknown,
  converters: Array<(val: unknown) => unknown>,
  defaultValue?: T
): T {
  try {
    return converters.reduce(
      (result, converter) => converter(result),
      value
    ) as T;
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw error;
  }
}

// ===== Journey-Specific Type Converters =====

/**
 * Health metric types supported in the Health journey.
 */
export enum HealthMetricType {
  WEIGHT = 'WEIGHT',
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  SLEEP = 'SLEEP',
  OXYGEN_SATURATION = 'OXYGEN_SATURATION',
  TEMPERATURE = 'TEMPERATURE',
  CALORIES = 'CALORIES'
}

/**
 * Validates and converts a value to a HealthMetricType.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The validated HealthMetricType
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function toHealthMetricType(
  value: unknown,
  defaultValue?: HealthMetricType
): HealthMetricType {
  if (typeof value === 'string') {
    const upperValue = value.toUpperCase();
    if (Object.values(HealthMetricType).includes(upperValue as HealthMetricType)) {
      return upperValue as HealthMetricType;
    }
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(
    value,
    'HealthMetricType',
    `Value is not a valid health metric type. Expected one of: ${Object.values(HealthMetricType).join(', ')}`
  );
}

/**
 * Appointment status types in the Care journey.
 */
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

/**
 * Validates and converts a value to an AppointmentStatus.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The validated AppointmentStatus
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function toAppointmentStatus(
  value: unknown,
  defaultValue?: AppointmentStatus
): AppointmentStatus {
  if (typeof value === 'string') {
    const upperValue = value.toUpperCase();
    if (Object.values(AppointmentStatus).includes(upperValue as AppointmentStatus)) {
      return upperValue as AppointmentStatus;
    }
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(
    value,
    'AppointmentStatus',
    `Value is not a valid appointment status. Expected one of: ${Object.values(AppointmentStatus).join(', ')}`
  );
}

/**
 * Claim status types in the Plan journey.
 */
export enum ClaimStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

/**
 * Validates and converts a value to a ClaimStatus.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The validated ClaimStatus
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function toClaimStatus(
  value: unknown,
  defaultValue?: ClaimStatus
): ClaimStatus {
  if (typeof value === 'string') {
    const upperValue = value.toUpperCase();
    if (Object.values(ClaimStatus).includes(upperValue as ClaimStatus)) {
      return upperValue as ClaimStatus;
    }
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(
    value,
    'ClaimStatus',
    `Value is not a valid claim status. Expected one of: ${Object.values(ClaimStatus).join(', ')}`
  );
}

/**
 * Validates and converts a monetary value with currency information.
 * 
 * @param value - The value to convert (can be a number or an object with amount and currency)
 * @param defaultCurrency - Default currency code to use if not specified
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns Object with amount and currency properties
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function toMonetaryValue(
  value: unknown,
  defaultCurrency: string = 'BRL',
  defaultValue?: { amount: number; currency: string }
): { amount: number; currency: string } {
  try {
    if (typeof value === 'number') {
      return { amount: value, currency: defaultCurrency };
    }
    
    if (typeof value === 'string') {
      return { amount: toNumber(value), currency: defaultCurrency };
    }
    
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const amount = toNumber(obj.amount);
      const currency = toString(obj.currency || defaultCurrency);
      
      return { amount, currency };
    }
    
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'monetary value', 'Invalid monetary value format');
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(
      value,
      'monetary value',
      error instanceof Error ? error.message : 'Failed to convert to monetary value'
    );
  }
}

/**
 * Validates and converts a health measurement with value and unit.
 * 
 * @param value - The value to convert
 * @param expectedUnit - Expected unit for validation
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns Object with value and unit properties
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function toHealthMeasurement(
  value: unknown,
  expectedUnit?: string,
  defaultValue?: { value: number; unit: string }
): { value: number; unit: string } {
  try {
    if (typeof value === 'number') {
      if (!expectedUnit) {
        throw new TypeConversionError(value, 'health measurement', 'Unit is required for numeric values');
      }
      return { value, unit: expectedUnit };
    }
    
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const measureValue = toNumber(obj.value);
      const unit = toString(obj.unit || expectedUnit);
      
      if (!unit) {
        throw new TypeConversionError(value, 'health measurement', 'Unit is required');
      }
      
      if (expectedUnit && unit !== expectedUnit) {
        throw new TypeConversionError(
          value,
          `health measurement with unit ${expectedUnit}`,
          `Invalid unit: ${unit}. Expected: ${expectedUnit}`
        );
      }
      
      return { value: measureValue, unit };
    }
    
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'health measurement', 'Invalid health measurement format');
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(
      value,
      'health measurement',
      error instanceof Error ? error.message : 'Failed to convert to health measurement'
    );
  }
}

/**
 * Validates and converts a UUID string.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The validated UUID string
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function toUUID(
  value: unknown,
  defaultValue?: string
): string {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  try {
    const str = toString(value);
    if (UUID_REGEX.test(str)) {
      return str;
    }
    
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(value, 'UUID', 'Invalid UUID format');
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw error;
  }
}

// ===== Event-Specific Converters =====

/**
 * Journey types in the AUSTA SuperApp.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Validates and converts a value to a JourneyType.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The validated JourneyType
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function toJourneyType(
  value: unknown,
  defaultValue?: JourneyType
): JourneyType {
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (Object.values(JourneyType).includes(lowerValue as JourneyType)) {
      return lowerValue as JourneyType;
    }
  }
  
  if (defaultValue !== undefined) return defaultValue;
  throw new TypeConversionError(
    value,
    'JourneyType',
    `Value is not a valid journey type. Expected one of: ${Object.values(JourneyType).join(', ')}`
  );
}

/**
 * Converts an event payload to a strongly-typed structure based on the event type.
 * 
 * @param eventType - The type of event
 * @param data - The event data to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted event data with proper typing
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function convertEventData<T>(
  eventType: string,
  data: unknown,
  defaultValue?: T
): T {
  try {
    // Ensure data is an object
    const eventData = toObject(data);
    
    // Apply event-specific conversions based on event type
    // This is a simplified example - in a real implementation, you would have
    // more comprehensive mapping of event types to conversion logic
    if (eventType.startsWith('HEALTH_METRIC_')) {
      const metricType = eventType.replace('HEALTH_METRIC_', '');
      return {
        ...eventData,
        metricType: toHealthMetricType(metricType, HealthMetricType.WEIGHT),
        measurement: toHealthMeasurement(eventData.measurement),
        recordedAt: toDate(eventData.recordedAt, new Date()),
        userId: toUUID(eventData.userId)
      } as unknown as T;
    }
    
    if (eventType === 'APPOINTMENT_BOOKED') {
      return {
        ...eventData,
        appointmentId: toUUID(eventData.appointmentId),
        status: toAppointmentStatus(eventData.status, AppointmentStatus.SCHEDULED),
        scheduledAt: toDate(eventData.scheduledAt),
        providerId: toUUID(eventData.providerId),
        userId: toUUID(eventData.userId)
      } as unknown as T;
    }
    
    if (eventType === 'CLAIM_SUBMITTED') {
      return {
        ...eventData,
        claimId: toUUID(eventData.claimId),
        status: toClaimStatus(eventData.status, ClaimStatus.SUBMITTED),
        amount: toMonetaryValue(eventData.amount),
        submittedAt: toDate(eventData.submittedAt, new Date()),
        userId: toUUID(eventData.userId)
      } as unknown as T;
    }
    
    // For unknown event types, just return the data as is
    return eventData as unknown as T;
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(
      data,
      `typed event data for ${eventType}`,
      error instanceof Error ? error.message : 'Failed to convert event data'
    );
  }
}

/**
 * Safely extracts a property from an event payload with type conversion.
 * 
 * @param data - The event data object
 * @param propertyPath - The path to the property (supports dot notation for nested properties)
 * @param converter - Function to convert the property value
 * @param defaultValue - Optional default value to return if extraction or conversion fails
 * @returns The converted property value
 */
export function extractEventProperty<T>(
  data: unknown,
  propertyPath: string,
  converter: (val: unknown) => T,
  defaultValue?: T
): T {
  try {
    const obj = toObject(data);
    const parts = propertyPath.split('.');
    
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Cannot access property '${part}' of ${current}`);
      }
      
      current = (current as Record<string, unknown>)[part];
      
      if (current === undefined) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Property '${propertyPath}' does not exist in event data`);
      }
    }
    
    return converter(current);
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(
      data,
      `property ${propertyPath}`,
      error instanceof Error ? error.message : 'Failed to extract property from event data'
    );
  }
}

/**
 * Interface for event data validation result.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates event data against a set of validation rules.
 * 
 * @param data - The event data to validate
 * @param validations - Array of validation functions
 * @returns Validation result with success flag and error messages
 */
export function validateEventData(
  data: unknown,
  validations: Array<(data: unknown) => string | null>
): ValidationResult {
  const errors: string[] = [];
  
  for (const validation of validations) {
    try {
      const error = validation(data);
      if (error) {
        errors.push(error);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ===== ProcessEventDto Integration =====

/**
 * Type definition for ProcessEventDto based on the structure from gamification-engine.
 * This matches the structure defined in src/backend/gamification-engine/src/events/dto/process-event.dto.ts
 */
export interface ProcessEventDto {
  type: string;
  userId: string;
  data: Record<string, unknown>;
  journey?: string;
}

/**
 * Safely converts an unknown value to a ProcessEventDto with validation.
 * 
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The validated ProcessEventDto
 * @throws {TypeConversionError} If validation fails and no default value is provided
 */
export function toProcessEventDto(
  value: unknown,
  defaultValue?: ProcessEventDto
): ProcessEventDto {
  try {
    const obj = toObject(value);
    
    // Extract and validate required fields
    const type = toString(obj.type);
    const userId = toUUID(obj.userId);
    const data = toObject(obj.data);
    
    // Extract and validate optional fields
    let journey: string | undefined;
    if ('journey' in obj) {
      journey = toString(obj.journey);
      // Validate journey if present
      if (journey) {
        toJourneyType(journey); // This will throw if invalid
      }
    }
    
    return {
      type,
      userId,
      data,
      journey
    };
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(
      value,
      'ProcessEventDto',
      error instanceof Error ? error.message : 'Failed to convert to ProcessEventDto'
    );
  }
}

/**
 * Converts a ProcessEventDto to a strongly-typed event data structure based on the event type.
 * 
 * @param event - The ProcessEventDto to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted event with strongly-typed data
 * @throws {TypeConversionError} If conversion fails and no default value is provided
 */
export function convertProcessEvent<T>(
  event: ProcessEventDto,
  defaultValue?: { type: string; userId: string; journey?: string; data: T }
): { type: string; userId: string; journey?: string; data: T } {
  try {
    // Convert the event data based on the event type
    const convertedData = convertEventData<T>(event.type, event.data);
    
    return {
      type: event.type,
      userId: event.userId,
      journey: event.journey,
      data: convertedData
    };
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new TypeConversionError(
      event,
      `typed event for ${event.type}`,
      error instanceof Error ? error.message : 'Failed to convert process event'
    );
  }
}