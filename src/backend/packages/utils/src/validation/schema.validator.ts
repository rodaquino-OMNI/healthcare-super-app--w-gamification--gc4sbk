/**
 * Schema Validator
 * 
 * Provides utilities for creating and working with validation schemas using Zod and class-validator.
 * This file creates a bridge between different validation approaches, allowing seamless integration
 * between schema-based validation (Zod) and decorator-based validation (class-validator).
 */

import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, validateSync, ValidationError as ClassValidationError } from 'class-validator';
import { z, ZodError, ZodIssue, ZodSchema, ZodType } from 'zod';

/**
 * Error format standardized across validation libraries
 */
export interface ValidationErrorItem {
  path: string[];
  message: string;
  code: string;
  metadata?: Record<string, any>;
}

/**
 * Standardized validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorItem[];
}

/**
 * Options for schema validation
 */
export interface SchemaValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  context?: Record<string, any>;
  journeyId?: 'health' | 'care' | 'plan';
}

/**
 * Default error messages for common validation scenarios
 */
const DEFAULT_ERROR_MESSAGES = {
  required: 'This field is required',
  string: 'Must be a string',
  number: 'Must be a number',
  boolean: 'Must be a boolean',
  email: 'Invalid email address',
  url: 'Invalid URL',
  uuid: 'Invalid UUID',
  date: 'Invalid date',
  min: 'Value is too small',
  max: 'Value is too large',
  minLength: 'Text is too short',
  maxLength: 'Text is too long',
  pattern: 'Invalid format',
  custom: 'Validation failed',
};

/**
 * Journey-specific error messages
 */
const JOURNEY_ERROR_MESSAGES = {
  health: {
    required: 'This health metric is required',
    number: 'Health metric must be a number',
    min: 'Health metric is below minimum value',
    max: 'Health metric exceeds maximum value',
    date: 'Invalid health record date',
  },
  care: {
    required: 'This care information is required',
    date: 'Invalid appointment date',
    email: 'Invalid healthcare provider email',
  },
  plan: {
    required: 'This plan information is required',
    number: 'Benefit amount must be a number',
    date: 'Invalid coverage date',
  },
};

/**
 * Creates a Zod schema with pre-configured error messages
 * @param schema The base Zod schema
 * @param journeyId Optional journey ID for journey-specific error messages
 * @returns Enhanced Zod schema with custom error messages
 */
export function createZodSchema<T extends ZodType<any, any, any>>(
  schema: T,
  journeyId?: 'health' | 'care' | 'plan'
): T {
  // Apply journey-specific error messages if a journeyId is provided
  if (journeyId && JOURNEY_ERROR_MESSAGES[journeyId]) {
    const journeyMessages = JOURNEY_ERROR_MESSAGES[journeyId];
    
    // Create a new schema with custom error messages
    return schema.superRefine((data, ctx) => {
      try {
        schema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          // Replace error messages with journey-specific ones where applicable
          error.issues.forEach((issue) => {
            const messageType = issue.code.toLowerCase();
            if (journeyMessages[messageType]) {
              ctx.addIssue({
                ...issue,
                message: journeyMessages[messageType],
              });
            } else {
              ctx.addIssue(issue);
            }
          });
        }
      }
    }) as T;
  }
  
  return schema;
}

/**
 * Validates data against a Zod schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @param options Validation options
 * @returns Validation result with standardized format
 */
export async function validateWithZod<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options: SchemaValidationOptions = {}
): Promise<ValidationResult<T>> {
  try {
    // Apply journey-specific schema if needed
    const schemaToUse = options.journeyId 
      ? createZodSchema(schema, options.journeyId)
      : schema;
    
    // Parse data with the schema
    const result = schemaToUse.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      // Format errors to standardized format
      const errors = formatZodErrors(result.error);
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    // Handle unexpected errors
    return {
      success: false,
      errors: [
        {
          path: [],
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'validation_error',
        },
      ],
    };
  }
}

/**
 * Synchronous version of validateWithZod
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @param options Validation options
 * @returns Validation result with standardized format
 */
export function validateWithZodSync<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options: SchemaValidationOptions = {}
): ValidationResult<T> {
  try {
    // Apply journey-specific schema if needed
    const schemaToUse = options.journeyId 
      ? createZodSchema(schema, options.journeyId)
      : schema;
    
    // Parse data with the schema
    const result = schemaToUse.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      // Format errors to standardized format
      const errors = formatZodErrors(result.error);
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    // Handle unexpected errors
    return {
      success: false,
      errors: [
        {
          path: [],
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'validation_error',
        },
      ],
    };
  }
}

/**
 * Validates data against a class-validator decorated class
 * @param cls Class constructor with class-validator decorators
 * @param data Data to validate
 * @param options Validation options
 * @returns Validation result with standardized format
 */
export async function validateWithClassValidator<T extends object>(
  cls: ClassConstructor<T>,
  data: object,
  options: SchemaValidationOptions = {}
): Promise<ValidationResult<T>> {
  try {
    // Transform plain object to class instance
    const instance = plainToInstance(cls, data);
    
    // Validate the instance
    const validationErrors = await validate(instance, {
      skipMissingProperties: options.stripUnknown,
      whitelist: options.stripUnknown,
      forbidNonWhitelisted: options.stripUnknown,
    });
    
    if (validationErrors.length === 0) {
      return {
        success: true,
        data: instance,
      };
    } else {
      // Format errors to standardized format
      const errors = formatClassValidatorErrors(validationErrors, options.journeyId);
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    // Handle unexpected errors
    return {
      success: false,
      errors: [
        {
          path: [],
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'validation_error',
        },
      ],
    };
  }
}

/**
 * Synchronous version of validateWithClassValidator
 * @param cls Class constructor with class-validator decorators
 * @param data Data to validate
 * @param options Validation options
 * @returns Validation result with standardized format
 */
export function validateWithClassValidatorSync<T extends object>(
  cls: ClassConstructor<T>,
  data: object,
  options: SchemaValidationOptions = {}
): ValidationResult<T> {
  try {
    // Transform plain object to class instance
    const instance = plainToInstance(cls, data);
    
    // Validate the instance
    const validationErrors = validateSync(instance, {
      skipMissingProperties: options.stripUnknown,
      whitelist: options.stripUnknown,
      forbidNonWhitelisted: options.stripUnknown,
    });
    
    if (validationErrors.length === 0) {
      return {
        success: true,
        data: instance,
      };
    } else {
      // Format errors to standardized format
      const errors = formatClassValidatorErrors(validationErrors, options.journeyId);
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    // Handle unexpected errors
    return {
      success: false,
      errors: [
        {
          path: [],
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'validation_error',
        },
      ],
    };
  }
}

/**
 * Formats Zod errors to standardized format
 * @param error Zod error object
 * @returns Array of standardized validation error items
 */
export function formatZodErrors(error: ZodError): ValidationErrorItem[] {
  return error.issues.map((issue: ZodIssue) => {
    return {
      path: issue.path,
      message: issue.message,
      code: issue.code.toLowerCase(),
      metadata: issue.params,
    };
  });
}

/**
 * Formats class-validator errors to standardized format
 * @param errors Array of class-validator errors
 * @param journeyId Optional journey ID for journey-specific error messages
 * @returns Array of standardized validation error items
 */
export function formatClassValidatorErrors(
  errors: ClassValidationError[],
  journeyId?: 'health' | 'care' | 'plan'
): ValidationErrorItem[] {
  const result: ValidationErrorItem[] = [];
  
  // Helper function to process nested errors
  const processErrors = (error: ClassValidationError, parentPath: string[] = []) => {
    const path = [...parentPath, error.property];
    
    // Process constraints
    if (error.constraints) {
      Object.entries(error.constraints).forEach(([code, message]) => {
        // Apply journey-specific messages if available
        let finalMessage = message;
        if (journeyId && JOURNEY_ERROR_MESSAGES[journeyId]) {
          const journeyMessages = JOURNEY_ERROR_MESSAGES[journeyId];
          if (journeyMessages[code]) {
            finalMessage = journeyMessages[code];
          }
        }
        
        result.push({
          path,
          message: finalMessage,
          code,
          metadata: error.contexts?.[code],
        });
      });
    }
    
    // Process nested errors recursively
    if (error.children && error.children.length > 0) {
      error.children.forEach((child) => processErrors(child, path));
    }
  };
  
  // Process all errors
  errors.forEach((error) => processErrors(error));
  
  return result;
}

/**
 * Creates a Zod schema from a class-validator decorated class
 * @param cls Class constructor with class-validator decorators
 * @returns Zod schema that performs equivalent validation
 */
export function createZodSchemaFromClass<T extends object>(
  cls: ClassConstructor<T>
): ZodSchema<T> {
  // Create a schema that uses class-validator internally
  return z.custom<T>((data) => {
    const instance = plainToInstance(cls, data);
    const errors = validateSync(instance, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    
    return errors.length === 0;
  }, {
    message: 'Invalid data according to class validation rules',
  }) as ZodSchema<T>;
}

/**
 * Creates a validation function for a class-validator decorated class
 * @param cls Class constructor with class-validator decorators
 * @returns Function that validates data against the class
 */
export function createClassValidator<T extends object>(
  cls: ClassConstructor<T>
): (data: unknown) => Promise<ValidationResult<T>> {
  return (data: unknown) => validateWithClassValidator(cls, data as object);
}

/**
 * Creates a validation function for a Zod schema
 * @param schema Zod schema
 * @returns Function that validates data against the schema
 */
export function createZodValidator<T>(
  schema: ZodSchema<T>
): (data: unknown) => Promise<ValidationResult<T>> {
  return (data: unknown) => validateWithZod(schema, data);
}

/**
 * Creates a journey-specific schema builder for common data models
 * @param journeyId Journey identifier
 * @returns Object with methods to create common schemas for the journey
 */
export function createJourneySchemaBuilder(journeyId: 'health' | 'care' | 'plan') {
  return {
    /**
     * Creates a string schema with journey-specific validation
     */
    string: (options?: { required?: boolean; min?: number; max?: number; pattern?: RegExp }) => {
      let schema = z.string();
      
      if (options?.min !== undefined) {
        schema = schema.min(options.min);
      }
      
      if (options?.max !== undefined) {
        schema = schema.max(options.max);
      }
      
      if (options?.pattern) {
        schema = schema.regex(options.pattern);
      }
      
      if (options?.required === false) {
        schema = schema.optional();
      }
      
      return createZodSchema(schema, journeyId);
    },
    
    /**
     * Creates a number schema with journey-specific validation
     */
    number: (options?: { required?: boolean; min?: number; max?: number; integer?: boolean }) => {
      let schema = z.number();
      
      if (options?.min !== undefined) {
        schema = schema.min(options.min);
      }
      
      if (options?.max !== undefined) {
        schema = schema.max(options.max);
      }
      
      if (options?.integer) {
        schema = schema.int();
      }
      
      if (options?.required === false) {
        schema = schema.optional();
      }
      
      return createZodSchema(schema, journeyId);
    },
    
    /**
     * Creates a date schema with journey-specific validation
     */
    date: (options?: { required?: boolean; min?: Date; max?: Date }) => {
      let schema = z.date();
      
      if (options?.min) {
        schema = schema.min(options.min);
      }
      
      if (options?.max) {
        schema = schema.max(options.max);
      }
      
      if (options?.required === false) {
        schema = schema.optional();
      }
      
      return createZodSchema(schema, journeyId);
    },
    
    /**
     * Creates an email schema with journey-specific validation
     */
    email: (options?: { required?: boolean }) => {
      let schema = z.string().email();
      
      if (options?.required === false) {
        schema = schema.optional();
      }
      
      return createZodSchema(schema, journeyId);
    },
    
    /**
     * Creates a schema for common journey-specific data models
     */
    model: <T>(modelType: string, schema: ZodSchema<T>) => {
      return createZodSchema(schema, journeyId);
    },
  };
}

/**
 * Pre-configured schema builders for each journey
 */
export const healthSchemas = createJourneySchemaBuilder('health');
export const careSchemas = createJourneySchemaBuilder('care');
export const planSchemas = createJourneySchemaBuilder('plan');

/**
 * Utility to perform runtime type checking for critical operations
 * @param data Data to validate
 * @param schema Zod schema to validate against
 * @param errorMessage Custom error message if validation fails
 * @returns Validated and typed data
 * @throws Error if validation fails
 */
export function assertValid<T>(
  data: unknown,
  schema: ZodSchema<T>,
  errorMessage = 'Invalid data format'
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = formatZodErrors(error);
      const errorDetails = formattedErrors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ');
      
      throw new Error(`${errorMessage}: ${errorDetails}`);
    }
    throw error;
  }
}

/**
 * Creates a schema for validating common date formats and converting to Date objects
 * @param options Validation options
 * @returns Zod schema for date validation
 */
export function createDateSchema(options?: { required?: boolean; min?: Date; max?: Date }) {
  // Schema that accepts string, number, or Date and converts to Date
  let schema = z.union([
    z.string().refine(
      (val) => !isNaN(new Date(val).getTime()),
      { message: 'Invalid date string' }
    ),
    z.number().refine(
      (val) => !isNaN(new Date(val).getTime()),
      { message: 'Invalid date timestamp' }
    ),
    z.date(),
  ]).transform(val => new Date(val));
  
  if (options?.min) {
    schema = schema.refine(
      (date) => date >= options.min!,
      { message: `Date must be after ${options.min.toISOString()}` }
    );
  }
  
  if (options?.max) {
    schema = schema.refine(
      (date) => date <= options.max!,
      { message: `Date must be before ${options.max.toISOString()}` }
    );
  }
  
  if (options?.required === false) {
    schema = schema.optional();
  }
  
  return schema;
}