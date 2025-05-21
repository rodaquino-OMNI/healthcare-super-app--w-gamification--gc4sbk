/**
 * Validation utilities for the gamification engine
 * 
 * Provides validation functions for event payloads, achievement criteria, and reward conditions
 * using Zod and class-validator. Implements consistent validation patterns to ensure data
 * integrity across all gamification components.
 */

import { plainToInstance } from 'class-transformer';
import { validate, validateSync, ValidationError } from 'class-validator';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Error response format for validation errors
 */
export interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
  path?: string[];
  timestamp: string;
  statusCode: number;
}

/**
 * Options for validation functions
 */
export interface ValidationOptions {
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to strip unknown properties */
  stripUnknown?: boolean;
}

/**
 * Default validation options
 */
const defaultValidationOptions: ValidationOptions = {
  throwOnError: false,
  stripUnknown: true,
};

/**
 * Validates an object against a Zod schema
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns The validated data or null if validation fails
 * @throws {ZodError} If validation fails and throwOnError is true
 */
export function validateWithZod<T>(schema: ZodSchema<T>, data: unknown, options: ValidationOptions = {}): T | null {
  const opts = { ...defaultValidationOptions, ...options };
  
  try {
    const result = schema.parse(data);
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      if (opts.throwOnError) {
        throw error;
      }
      return null;
    }
    throw error;
  }
}

/**
 * Safely validates an object against a Zod schema without throwing
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns An object containing the validation result and any errors
 */
export function safeValidateWithZod<T>(schema: ZodSchema<T>, data: unknown, options: ValidationOptions = {}) {
  const opts = { ...defaultValidationOptions, ...options };
  
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: null,
    };
  }
  
  return {
    success: false,
    data: null,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validates an object against a class-validator decorated class
 * 
 * @param cls - The class to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns A promise that resolves to the validated instance or null if validation fails
 * @throws {ValidationError[]} If validation fails and throwOnError is true
 */
export async function validateWithClassValidator<T extends object>(
  cls: new () => T,
  data: object,
  options: ValidationOptions = {}
): Promise<T | null> {
  const opts = { ...defaultValidationOptions, ...options };
  
  // Convert plain object to class instance
  const instance = plainToInstance(cls, data, {
    excludeExtraneousValues: opts.stripUnknown,
  });
  
  // Validate the instance
  const errors = await validate(instance, {
    whitelist: opts.stripUnknown,
    forbidNonWhitelisted: opts.stripUnknown,
  });
  
  if (errors.length > 0) {
    if (opts.throwOnError) {
      throw errors;
    }
    return null;
  }
  
  return instance;
}

/**
 * Synchronously validates an object against a class-validator decorated class
 * 
 * @param cls - The class to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns The validated instance or null if validation fails
 * @throws {ValidationError[]} If validation fails and throwOnError is true
 */
export function validateWithClassValidatorSync<T extends object>(
  cls: new () => T,
  data: object,
  options: ValidationOptions = {}
): T | null {
  const opts = { ...defaultValidationOptions, ...options };
  
  // Convert plain object to class instance
  const instance = plainToInstance(cls, data, {
    excludeExtraneousValues: opts.stripUnknown,
  });
  
  // Validate the instance
  const errors = validateSync(instance, {
    whitelist: opts.stripUnknown,
    forbidNonWhitelisted: opts.stripUnknown,
  });
  
  if (errors.length > 0) {
    if (opts.throwOnError) {
      throw errors;
    }
    return null;
  }
  
  return instance;
}

/**
 * Formats Zod errors into a standardized error response
 * 
 * @param error - The Zod error to format
 * @returns A formatted error response
 */
export function formatZodErrors(error: ZodError): ValidationErrorResponse {
  const formattedErrors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });
  
  return {
    message: 'Validation failed',
    errors: formattedErrors,
    path: error.errors[0]?.path || [],
    timestamp: new Date().toISOString(),
    statusCode: 400,
  };
}

/**
 * Formats class-validator errors into a standardized error response
 * 
 * @param errors - The validation errors to format
 * @returns A formatted error response
 */
export function formatClassValidatorErrors(errors: ValidationError[]): ValidationErrorResponse {
  const formattedErrors: Record<string, string[]> = {};
  
  const processErrors = (error: ValidationError, parentPath = '') => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    
    if (error.constraints) {
      formattedErrors[path] = Object.values(error.constraints);
    }
    
    if (error.children && error.children.length > 0) {
      error.children.forEach((childError) => {
        processErrors(childError, path);
      });
    }
  };
  
  errors.forEach((error) => processErrors(error));
  
  return {
    message: 'Validation failed',
    errors: formattedErrors,
    path: errors.length > 0 ? [errors[0].property] : [],
    timestamp: new Date().toISOString(),
    statusCode: 400,
  };
}

/**
 * Validates an event payload against a schema
 * 
 * @param eventType - The type of event being validated
 * @param payload - The event payload to validate
 * @param schema - The Zod schema to validate against
 * @param options - Validation options
 * @returns The validated payload or null if validation fails
 */
export function validateEventPayload<T>(
  eventType: string,
  payload: unknown,
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
): T | null {
  const opts = {
    ...defaultValidationOptions,
    errorMessage: `Invalid payload for event type: ${eventType}`,
    ...options,
  };
  
  return validateWithZod(schema, payload, opts);
}

/**
 * Validates achievement criteria against a schema
 * 
 * @param achievementId - The ID of the achievement
 * @param criteria - The criteria to validate
 * @param schema - The Zod schema to validate against
 * @param options - Validation options
 * @returns The validated criteria or null if validation fails
 */
export function validateAchievementCriteria<T>(
  achievementId: string,
  criteria: unknown,
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
): T | null {
  const opts = {
    ...defaultValidationOptions,
    errorMessage: `Invalid criteria for achievement: ${achievementId}`,
    ...options,
  };
  
  return validateWithZod(schema, criteria, opts);
}

/**
 * Validates reward conditions against a schema
 * 
 * @param rewardId - The ID of the reward
 * @param conditions - The conditions to validate
 * @param schema - The Zod schema to validate against
 * @param options - Validation options
 * @returns The validated conditions or null if validation fails
 */
export function validateRewardConditions<T>(
  rewardId: string,
  conditions: unknown,
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
): T | null {
  const opts = {
    ...defaultValidationOptions,
    errorMessage: `Invalid conditions for reward: ${rewardId}`,
    ...options,
  };
  
  return validateWithZod(schema, conditions, opts);
}

/**
 * Performs runtime type checking for critical operations
 * 
 * @param value - The value to check
 * @param expectedType - The expected type of the value
 * @param valueName - The name of the value for error messages
 * @returns True if the value is of the expected type, false otherwise
 * @throws {Error} If the value is not of the expected type and throwOnError is true
 */
export function checkType(
  value: unknown,
  expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function',
  valueName: string,
  throwOnError = false
): boolean {
  let isValid = false;
  
  switch (expectedType) {
    case 'string':
      isValid = typeof value === 'string';
      break;
    case 'number':
      isValid = typeof value === 'number' && !isNaN(value);
      break;
    case 'boolean':
      isValid = typeof value === 'boolean';
      break;
    case 'object':
      isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
      break;
    case 'array':
      isValid = Array.isArray(value);
      break;
    case 'function':
      isValid = typeof value === 'function';
      break;
    default:
      isValid = false;
  }
  
  if (!isValid && throwOnError) {
    throw new Error(`${valueName} must be of type ${expectedType}`);
  }
  
  return isValid;
}

/**
 * Creates a schema for validating event payloads with common fields
 * 
 * @param payloadSchema - The schema for the payload-specific fields
 * @returns A schema for the complete event payload
 */
export function createEventPayloadSchema<T>(payloadSchema: ZodSchema<T>) {
  return z.object({
    eventId: z.string().uuid(),
    timestamp: z.string().datetime(),
    userId: z.string().uuid(),
    journeyType: z.enum(['HEALTH', 'CARE', 'PLAN']),
    payload: payloadSchema,
    metadata: z.object({
      source: z.string(),
      version: z.string(),
    }).optional(),
  });
}

/**
 * Creates a schema for validating achievement criteria with common fields
 * 
 * @param criteriaSchema - The schema for the criteria-specific fields
 * @returns A schema for the complete achievement criteria
 */
export function createAchievementCriteriaSchema<T>(criteriaSchema: ZodSchema<T>) {
  return z.object({
    type: z.enum(['SINGLE_EVENT', 'MULTIPLE_EVENTS', 'STREAK', 'MILESTONE']),
    journeyType: z.enum(['HEALTH', 'CARE', 'PLAN', 'ALL']),
    threshold: z.number().int().positive(),
    timeframe: z.object({
      type: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
      durationInDays: z.number().int().positive().optional(),
    }).optional(),
    criteria: criteriaSchema,
  });
}

/**
 * Creates a schema for validating reward conditions with common fields
 * 
 * @param conditionsSchema - The schema for the conditions-specific fields
 * @returns A schema for the complete reward conditions
 */
export function createRewardConditionsSchema<T>(conditionsSchema: ZodSchema<T>) {
  return z.object({
    type: z.enum(['ACHIEVEMENT', 'XP_LEVEL', 'QUEST_COMPLETION', 'CUSTOM']),
    journeyType: z.enum(['HEALTH', 'CARE', 'PLAN', 'ALL']),
    requiredAchievements: z.array(z.string().uuid()).optional(),
    requiredXp: z.number().int().positive().optional(),
    requiredQuestIds: z.array(z.string().uuid()).optional(),
    conditions: conditionsSchema,
  });
}