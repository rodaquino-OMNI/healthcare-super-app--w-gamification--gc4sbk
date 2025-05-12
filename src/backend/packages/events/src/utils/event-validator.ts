/**
 * @file event-validator.ts
 * @description Provides validation utilities for event payloads against defined schemas using Zod.
 * This module ensures that all events conform to their expected structure before processing,
 * preventing invalid data from propagating through the system. It includes functions for validating
 * events by type, handling versioned schemas, and generating user-friendly error messages for
 * validation failures.
 */

import { z } from 'zod';
import { getSchema, hasSchema } from './schema-utils';
import { EventVersion } from '../interfaces/event-versioning.interface';

/**
 * Cache for validation results to improve performance for repeated validations
 * @internal
 */
const validationCache = new Map<string, Map<string, ValidationResult>>();

/**
 * Maximum size of the validation cache to prevent memory leaks
 * @internal
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Result of a validation operation
 * @interface ValidationResult
 */
export interface ValidationResult {
  /**
   * Whether the validation was successful
   */
  valid: boolean;
  
  /**
   * The validated data (only present if valid is true)
   */
  data?: any;
  
  /**
   * Error details (only present if valid is false)
   */
  errors?: ValidationError[];
  
  /**
   * The schema version used for validation
   */
  schemaVersion?: EventVersion;
}

/**
 * Detailed validation error information
 * @interface ValidationError
 */
export interface ValidationError {
  /**
   * Path to the field with the error
   */
  path: string[];
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code (if available)
   */
  code?: string;
}

/**
 * Options for validating an event
 * @interface ValidateEventOptions
 */
export interface ValidateEventOptions {
  /**
   * Whether to use the validation cache
   * @default true
   */
  useCache?: boolean;
  
  /**
   * Whether to throw an error if the schema is not found
   * @default false
   */
  throwOnMissingSchema?: boolean;
  
  /**
   * Whether to try fallback versions if the specified version fails validation
   * @default true
   */
  tryFallbackVersions?: boolean;
  
  /**
   * Custom error message prefix
   */
  errorMessagePrefix?: string;
}

/**
 * Default validation options
 * @internal
 */
const defaultValidationOptions: ValidateEventOptions = {
  useCache: true,
  throwOnMissingSchema: false,
  tryFallbackVersions: true,
};

/**
 * Validates an event against its schema
 * @param eventType The type of the event
 * @param eventData The event data to validate
 * @param version The schema version to use (optional, defaults to latest)
 * @param options Validation options
 * @returns Validation result
 * @throws Error if throwOnMissingSchema is true and the schema is not found
 */
export function validateEvent(
  eventType: string,
  eventData: any,
  version?: EventVersion,
  options?: ValidateEventOptions
): ValidationResult {
  const opts = { ...defaultValidationOptions, ...options };
  
  // Check cache if enabled
  if (opts.useCache) {
    const cacheResult = getFromValidationCache(eventType, eventData, version);
    if (cacheResult) {
      return cacheResult;
    }
  }
  
  // Check if schema exists
  if (!hasSchema({ type: eventType, version })) {
    if (opts.throwOnMissingSchema) {
      throw new Error(`Schema not found for event type '${eventType}'${version ? ` and version '${version}'` : ''}`);
    }
    
    return {
      valid: false,
      errors: [{
        path: [],
        message: `Schema not found for event type '${eventType}'${version ? ` and version '${version}'` : ''}`,
        code: 'SCHEMA_NOT_FOUND',
      }],
    };
  }
  
  // Get schema
  const schema = getSchema({ type: eventType, version });
  if (!schema) {
    if (opts.throwOnMissingSchema) {
      throw new Error(`Schema not found for event type '${eventType}'${version ? ` and version '${version}'` : ''}`);
    }
    
    return {
      valid: false,
      errors: [{
        path: [],
        message: `Schema not found for event type '${eventType}'${version ? ` and version '${version}'` : ''}`,
        code: 'SCHEMA_NOT_FOUND',
      }],
    };
  }
  
  // Validate against schema
  try {
    const validatedData = schema.parse(eventData);
    
    const result: ValidationResult = {
      valid: true,
      data: validatedData,
      schemaVersion: version,
    };
    
    // Cache result if enabled
    if (opts.useCache) {
      addToValidationCache(eventType, eventData, version, result);
    }
    
    return result;
  } catch (error) {
    // If validation fails and fallback versions are enabled, try older versions
    if (opts.tryFallbackVersions && version) {
      const fallbackResult = tryFallbackVersions(eventType, eventData, version, opts);
      if (fallbackResult && fallbackResult.valid) {
        return fallbackResult;
      }
    }
    
    // Format validation errors
    const validationErrors = formatZodError(error, opts.errorMessagePrefix);
    
    const result: ValidationResult = {
      valid: false,
      errors: validationErrors,
      schemaVersion: version,
    };
    
    // Cache result if enabled
    if (opts.useCache) {
      addToValidationCache(eventType, eventData, version, result);
    }
    
    return result;
  }
}

/**
 * Validates an event for a specific journey
 * @param journey The journey (health, care, plan)
 * @param eventType The type of the event
 * @param eventData The event data to validate
 * @param version The schema version to use (optional, defaults to latest)
 * @param options Validation options
 * @returns Validation result
 */
export function validateJourneyEvent(
  journey: 'health' | 'care' | 'plan',
  eventType: string,
  eventData: any,
  version?: EventVersion,
  options?: ValidateEventOptions
): ValidationResult {
  // Prefix event type with journey if not already prefixed
  const prefixedEventType = eventType.startsWith(`${journey.toUpperCase()}_`) 
    ? eventType 
    : `${journey.toUpperCase()}_${eventType}`;
  
  // Add journey-specific error message prefix
  const opts = { 
    ...options, 
    errorMessagePrefix: options?.errorMessagePrefix || `${journey.charAt(0).toUpperCase() + journey.slice(1)} Journey: ` 
  };
  
  return validateEvent(prefixedEventType, eventData, version, opts);
}

/**
 * Validates a health journey event
 * @param eventType The type of the event
 * @param eventData The event data to validate
 * @param version The schema version to use (optional, defaults to latest)
 * @param options Validation options
 * @returns Validation result
 */
export function validateHealthEvent(
  eventType: string,
  eventData: any,
  version?: EventVersion,
  options?: ValidateEventOptions
): ValidationResult {
  return validateJourneyEvent('health', eventType, eventData, version, options);
}

/**
 * Validates a care journey event
 * @param eventType The type of the event
 * @param eventData The event data to validate
 * @param version The schema version to use (optional, defaults to latest)
 * @param options Validation options
 * @returns Validation result
 */
export function validateCareEvent(
  eventType: string,
  eventData: any,
  version?: EventVersion,
  options?: ValidateEventOptions
): ValidationResult {
  return validateJourneyEvent('care', eventType, eventData, version, options);
}

/**
 * Validates a plan journey event
 * @param eventType The type of the event
 * @param eventData The event data to validate
 * @param version The schema version to use (optional, defaults to latest)
 * @param options Validation options
 * @returns Validation result
 */
export function validatePlanEvent(
  eventType: string,
  eventData: any,
  version?: EventVersion,
  options?: ValidateEventOptions
): ValidationResult {
  return validateJourneyEvent('plan', eventType, eventData, version, options);
}

/**
 * Validates an event payload against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @param errorMessagePrefix Optional prefix for error messages
 * @returns Validation result
 */
export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: any,
  errorMessagePrefix?: string
): ValidationResult {
  try {
    const validatedData = schema.parse(data);
    
    return {
      valid: true,
      data: validatedData,
    };
  } catch (error) {
    const validationErrors = formatZodError(error, errorMessagePrefix);
    
    return {
      valid: false,
      errors: validationErrors,
    };
  }
}

/**
 * Validates an event payload asynchronously against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @param errorMessagePrefix Optional prefix for error messages
 * @returns Promise resolving to a validation result
 */
export async function validateWithSchemaAsync<T>(
  schema: z.ZodType<T>,
  data: any,
  errorMessagePrefix?: string
): Promise<ValidationResult> {
  try {
    const validatedData = await schema.parseAsync(data);
    
    return {
      valid: true,
      data: validatedData,
    };
  } catch (error) {
    const validationErrors = formatZodError(error, errorMessagePrefix);
    
    return {
      valid: false,
      errors: validationErrors,
    };
  }
}

/**
 * Formats a Zod error into a standardized validation error format
 * @param error The Zod error to format
 * @param errorMessagePrefix Optional prefix for error messages
 * @returns Array of validation errors
 * @internal
 */
function formatZodError(error: unknown, errorMessagePrefix?: string): ValidationError[] {
  if (error instanceof z.ZodError) {
    return error.errors.map(err => ({
      path: err.path,
      message: errorMessagePrefix ? `${errorMessagePrefix}${err.message}` : err.message,
      code: err.code,
    }));
  }
  
  // Handle non-Zod errors
  return [{
    path: [],
    message: errorMessagePrefix 
      ? `${errorMessagePrefix}${error instanceof Error ? error.message : String(error)}` 
      : error instanceof Error ? error.message : String(error),
    code: 'VALIDATION_ERROR',
  }];
}

/**
 * Tries to validate against older versions of a schema
 * @param eventType The type of the event
 * @param eventData The event data to validate
 * @param currentVersion The current schema version
 * @param options Validation options
 * @returns Validation result from a successful fallback version, or undefined if all fallbacks fail
 * @internal
 */
function tryFallbackVersions(
  eventType: string,
  eventData: any,
  currentVersion: EventVersion,
  options: ValidateEventOptions
): ValidationResult | undefined {
  // Parse current version
  const [major, minor, patch] = parseVersion(currentVersion);
  
  // Try patch versions first
  for (let p = patch - 1; p >= 0; p--) {
    const fallbackVersion = `${major}.${minor}.${p}`;
    const result = validateEvent(
      eventType, 
      eventData, 
      fallbackVersion as EventVersion, 
      { ...options, tryFallbackVersions: false }
    );
    
    if (result.valid) {
      return result;
    }
  }
  
  // Try minor versions next
  for (let m = minor - 1; m >= 0; m--) {
    const fallbackVersion = `${major}.${m}.0`;
    const result = validateEvent(
      eventType, 
      eventData, 
      fallbackVersion as EventVersion, 
      { ...options, tryFallbackVersions: false }
    );
    
    if (result.valid) {
      return result;
    }
  }
  
  // We don't try major versions as they typically indicate breaking changes
  
  return undefined;
}

/**
 * Gets a validation result from the cache
 * @param eventType The type of the event
 * @param eventData The event data
 * @param version The schema version
 * @returns Cached validation result, or undefined if not in cache
 * @internal
 */
function getFromValidationCache(
  eventType: string,
  eventData: any,
  version?: EventVersion
): ValidationResult | undefined {
  // Create cache key
  const dataKey = JSON.stringify(eventData);
  const typeKey = `${eventType}${version ? `@${version}` : ''}`;
  
  // Check if type exists in cache
  if (!validationCache.has(typeKey)) {
    return undefined;
  }
  
  // Check if data exists in cache for this type
  const typeCache = validationCache.get(typeKey)!;
  return typeCache.get(dataKey);
}

/**
 * Adds a validation result to the cache
 * @param eventType The type of the event
 * @param eventData The event data
 * @param version The schema version
 * @param result The validation result
 * @internal
 */
function addToValidationCache(
  eventType: string,
  eventData: any,
  version?: EventVersion,
  result: ValidationResult
): void {
  // Create cache key
  const dataKey = JSON.stringify(eventData);
  const typeKey = `${eventType}${version ? `@${version}` : ''}`;
  
  // Initialize type cache if it doesn't exist
  if (!validationCache.has(typeKey)) {
    validationCache.set(typeKey, new Map<string, ValidationResult>());
  }
  
  // Add to cache
  const typeCache = validationCache.get(typeKey)!;
  typeCache.set(dataKey, result);
  
  // Prune cache if it gets too large
  if (validationCache.size > MAX_CACHE_SIZE) {
    pruneValidationCache();
  }
}

/**
 * Prunes the validation cache to prevent memory leaks
 * Removes the oldest 20% of entries
 * @internal
 */
function pruneValidationCache(): void {
  const keys = Array.from(validationCache.keys());
  const keysToRemove = Math.floor(keys.length * 0.2);
  
  for (let i = 0; i < keysToRemove; i++) {
    validationCache.delete(keys[i]);
  }
}

/**
 * Parses a version string into its components
 * @param version The version string to parse
 * @returns Array of [major, minor, patch] as numbers
 * @internal
 */
function parseVersion(version: EventVersion): [number, number, number] {
  const parts = version.split('.');
  const major = parseInt(parts[0], 10) || 0;
  const minor = parseInt(parts[1], 10) || 0;
  const patch = parseInt(parts[2], 10) || 0;
  
  return [major, minor, patch];
}

/**
 * Clears the validation cache
 * Useful for testing or when schemas are updated at runtime
 */
export function clearValidationCache(): void {
  validationCache.clear();
}

/**
 * Creates a validation pipeline that applies multiple validators in sequence
 * @param validators Array of validation functions to apply
 * @returns A function that applies all validators and returns the first failure or the final success
 */
export function createValidationPipeline<T>(
  validators: Array<(data: any) => ValidationResult>
): (data: any) => ValidationResult {
  return (data: any): ValidationResult => {
    let currentData = data;
    
    for (const validator of validators) {
      const result = validator(currentData);
      
      if (!result.valid) {
        return result;
      }
      
      // Update data for next validator
      currentData = result.data;
    }
    
    return {
      valid: true,
      data: currentData,
    };
  };
}

/**
 * Creates a validator function that validates a specific field in an object
 * @param fieldName The name of the field to validate
 * @param schema The schema to validate the field against
 * @param errorMessagePrefix Optional prefix for error messages
 * @returns A validation function for the specified field
 */
export function createFieldValidator<T>(
  fieldName: string,
  schema: z.ZodType<T>,
  errorMessagePrefix?: string
): (data: any) => ValidationResult {
  return (data: any): ValidationResult => {
    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        errors: [{
          path: [],
          message: `Expected an object but received ${data === null ? 'null' : typeof data}`,
          code: 'INVALID_TYPE',
        }],
      };
    }
    
    if (!(fieldName in data)) {
      return {
        valid: false,
        errors: [{
          path: [fieldName],
          message: `Field '${fieldName}' is required`,
          code: 'MISSING_FIELD',
        }],
      };
    }
    
    const fieldValue = data[fieldName];
    const result = validateWithSchema(schema, fieldValue, errorMessagePrefix);
    
    if (!result.valid) {
      // Update error paths to include the field name
      const updatedErrors = result.errors!.map(err => ({
        ...err,
        path: [fieldName, ...err.path],
      }));
      
      return {
        valid: false,
        errors: updatedErrors,
      };
    }
    
    // Return a new object with the validated field
    return {
      valid: true,
      data: {
        ...data,
        [fieldName]: result.data,
      },
    };
  };
}

/**
 * Creates a validator function that validates an object against a schema
 * and adds additional custom validation logic
 * @param schema The schema to validate against
 * @param customValidator A function that performs additional validation
 * @param errorMessagePrefix Optional prefix for error messages
 * @returns A validation function that applies both schema and custom validation
 */
export function createCustomValidator<T>(
  schema: z.ZodType<T>,
  customValidator: (data: T) => ValidationResult,
  errorMessagePrefix?: string
): (data: any) => ValidationResult {
  return (data: any): ValidationResult => {
    // First validate against schema
    const schemaResult = validateWithSchema(schema, data, errorMessagePrefix);
    
    if (!schemaResult.valid) {
      return schemaResult;
    }
    
    // Then apply custom validation
    return customValidator(schemaResult.data as T);
  };
}

/**
 * Creates a validator that ensures a value is one of the allowed values
 * @param allowedValues Array of allowed values
 * @param errorMessage Custom error message
 * @returns A validation function that checks if a value is allowed
 */
export function createEnumValidator<T extends string | number>(
  allowedValues: T[],
  errorMessage?: string
): (value: any) => ValidationResult {
  return (value: any): ValidationResult => {
    if (allowedValues.includes(value as T)) {
      return {
        valid: true,
        data: value,
      };
    }
    
    return {
      valid: false,
      errors: [{
        path: [],
        message: errorMessage || `Expected one of [${allowedValues.join(', ')}] but received '${value}'`,
        code: 'INVALID_ENUM_VALUE',
      }],
    };
  };
}