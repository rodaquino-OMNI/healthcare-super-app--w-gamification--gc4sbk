/**
 * Common validation schemas and utilities for the AUSTA SuperApp
 * 
 * This file centralizes common validation patterns used across multiple domains,
 * providing reusable validation rules for IDs, dates, pagination parameters, and
 * other frequently validated fields. It ensures consistent validation behavior
 * and error messages throughout the application.
 */

import { z } from 'zod'; // v3.22.4

/**
 * Common validation schemas for frequently used data types
 */
export const CommonValidation = {
  /**
   * UUID validation schema with custom error message
   */
  uuid: () => z.string().uuid({
    message: 'Invalid ID format. Must be a valid UUID.',
  }),

  /**
   * Non-empty string validation with optional min/max length constraints
   */
  nonEmptyString: (options?: { min?: number; max?: number; field?: string }) => {
    const fieldName = options?.field || 'Field';
    let schema = z.string({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a string`,
    }).min(1, { message: `${fieldName} cannot be empty` });
    
    if (options?.min) {
      schema = schema.min(options.min, { 
        message: `${fieldName} must be at least ${options.min} characters` 
      });
    }
    
    if (options?.max) {
      schema = schema.max(options.max, { 
        message: `${fieldName} cannot exceed ${options.max} characters` 
      });
    }
    
    return schema;
  },

  /**
   * ISO date string validation (YYYY-MM-DD)
   */
  dateString: () => z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    { message: 'Invalid date format. Use YYYY-MM-DD.' }
  ),

  /**
   * ISO datetime string validation
   */
  dateTimeString: () => z.string().datetime({
    message: 'Invalid datetime format. Use ISO 8601 format (e.g., 2023-01-01T12:00:00Z).'
  }),

  /**
   * Positive integer validation
   */
  positiveInteger: (options?: { field?: string }) => {
    const fieldName = options?.field || 'Value';
    return z.number({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a number`,
    }).int({
      message: `${fieldName} must be an integer`
    }).positive({
      message: `${fieldName} must be positive`
    });
  },

  /**
   * Non-negative integer validation (zero or positive)
   */
  nonNegativeInteger: (options?: { field?: string }) => {
    const fieldName = options?.field || 'Value';
    return z.number({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a number`,
    }).int({
      message: `${fieldName} must be an integer`
    }).min(0, {
      message: `${fieldName} must be zero or positive`
    });
  },

  /**
   * Email validation
   */
  email: () => z.string().email({
    message: 'Invalid email address format.'
  }),

  /**
   * Phone number validation (basic format)
   */
  phoneNumber: () => z.string().regex(
    /^\+?[0-9\s\-\(\)]{8,20}$/,
    { message: 'Invalid phone number format.' }
  ),

  /**
   * URL validation
   */
  url: () => z.string().url({
    message: 'Invalid URL format.'
  }),

  /**
   * Boolean validation
   */
  boolean: (options?: { field?: string }) => {
    const fieldName = options?.field || 'Value';
    return z.boolean({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a boolean`,
    });
  },

  /**
   * Array validation with min/max length constraints
   */
  array: <T extends z.ZodTypeAny>(
    schema: T,
    options?: { min?: number; max?: number; field?: string }
  ) => {
    const fieldName = options?.field || 'Array';
    let arraySchema = z.array(schema, {
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be an array`,
    });

    if (options?.min !== undefined) {
      arraySchema = arraySchema.min(options.min, {
        message: `${fieldName} must contain at least ${options.min} item(s)`
      });
    }

    if (options?.max !== undefined) {
      arraySchema = arraySchema.max(options.max, {
        message: `${fieldName} cannot contain more than ${options.max} item(s)`
      });
    }

    return arraySchema;
  },
};

/**
 * Common pagination parameters validation schema
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Type definition for pagination parameters
 */
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * Common date range parameters validation schema
 */
export const DateRangeParamsSchema = z.object({
  startDate: CommonValidation.dateString(),
  endDate: CommonValidation.dateString(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

/**
 * Type definition for date range parameters
 */
export type DateRangeParams = z.infer<typeof DateRangeParamsSchema>;

/**
 * Common ID parameter validation schema
 */
export const IdParamSchema = z.object({
  id: CommonValidation.uuid(),
});

/**
 * Type definition for ID parameter
 */
export type IdParam = z.infer<typeof IdParamSchema>;

/**
 * Common search parameters validation schema
 */
export const SearchParamsSchema = z.object({
  query: z.string().min(1).max(100),
  ...PaginationParamsSchema.shape,
});

/**
 * Type definition for search parameters
 */
export type SearchParams = z.infer<typeof SearchParamsSchema>;

/**
 * Validation utility functions
 */
export const ValidationUtils = {
  /**
   * Validates data against a schema and returns the result
   * @param schema Zod schema to validate against
   * @param data Data to validate
   * @returns Validation result with success flag, data, and errors
   */
  validate: <T extends z.ZodType>(schema: T, data: unknown): {
    success: boolean;
    data?: z.infer<T>;
    errors?: z.ZodError;
  } => {
    try {
      const validData = schema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  },

  /**
   * Validates data against a schema asynchronously and returns the result
   * @param schema Zod schema to validate against
   * @param data Data to validate
   * @returns Promise with validation result containing success flag, data, and errors
   */
  validateAsync: async <T extends z.ZodType>(schema: T, data: unknown): Promise<{
    success: boolean;
    data?: z.infer<T>;
    errors?: z.ZodError;
  }> => {
    try {
      const validData = await schema.parseAsync(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  },

  /**
   * Formats Zod validation errors into a user-friendly object
   * @param zodError Zod error object
   * @returns Object with field names as keys and error messages as values
   */
  formatErrors: (zodError: z.ZodError): Record<string, string> => {
    const formattedErrors: Record<string, string> = {};
    
    zodError.errors.forEach((error) => {
      const path = error.path.join('.');
      formattedErrors[path] = error.message;
    });
    
    return formattedErrors;
  },

  /**
   * Creates a partial schema from an existing schema where all properties are optional
   * @param schema Original Zod schema
   * @returns New schema with all properties made optional
   */
  createPartialSchema: <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    return z.object({
      ...Object.fromEntries(
        Object.entries(schema.shape).map(([key, value]) => [key, value.optional()])
      ),
    }) as z.ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }>;
  },
};

/**
 * Type inference helpers for Zod schemas
 */
export const SchemaTypes = {
  /**
   * Infers the type from a Zod schema
   * @param schema Zod schema to infer type from
   * @returns Type inferred from the schema (for TypeScript only)
   */
  infer: <T extends z.ZodType>(schema: T) => {} as z.infer<T>,

  /**
   * Creates a partial type from a Zod schema
   * @param schema Zod schema to create partial type from
   * @returns Partial type inferred from the schema (for TypeScript only)
   */
  partial: <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    return {} as Partial<z.infer<z.ZodObject<T>>>;
  },
};

/**
 * Common error messages for validation failures
 */
export const ValidationErrorMessages = {
  REQUIRED: 'This field is required',
  INVALID_TYPE: 'Invalid data type',
  INVALID_FORMAT: 'Invalid format',
  INVALID_LENGTH: 'Invalid length',
  INVALID_RANGE: 'Value is out of allowed range',
  INVALID_ENUM: 'Value is not one of the allowed options',
  INVALID_DATE: 'Invalid date format',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_URL: 'Invalid URL',
  INVALID_UUID: 'Invalid UUID format',
  INVALID_PASSWORD: 'Password does not meet security requirements',
  INVALID_USERNAME: 'Username contains invalid characters',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  TERMS_NOT_ACCEPTED: 'You must accept the terms and conditions',
};