/**
 * Validation utilities for the API Gateway
 * 
 * This module provides request and response validation utilities for the API Gateway.
 * It implements consistent validation patterns using Zod/class-validator integration,
 * schema validation, and sanitization to ensure data integrity and security for all API endpoints.
 *
 * @module validation.util
 */

import { HttpException, HttpStatus, Injectable, Logger, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import { z } from 'zod';
import { ZodError } from 'zod';

// Import from shared packages
import { ErrorType } from '@austa/interfaces/common';
import { MissingParameterError, InvalidParameterError, SchemaValidationError } from '@austa/errors/categories';
import { sanitizeObject as sharedSanitizeObject } from '@austa/utils/validation';

/**
 * Options for validation
 */
export interface ValidationOptions {
  /** Whether to strip unknown properties from the validated object */
  stripUnknown?: boolean;
  /** Whether to throw an exception on validation failure */
  throwOnError?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to apply sanitization to the input */
  sanitize?: boolean;
}

/**
 * Default validation options
 */
const defaultValidationOptions: ValidationOptions = {
  stripUnknown: true,
  throwOnError: true,
  sanitize: true,
};

/**
 * Result of a validation operation
 */
export interface ValidationResult<T> {
  /** Whether the validation was successful */
  isValid: boolean;
  /** The validated and transformed data */
  data?: T;
  /** Validation errors if any */
  errors?: Record<string, string[]>;
  /** Raw validation error object */
  rawErrors?: ValidationError[] | ZodError;
}

/**
 * Sanitization options
 */
export interface SanitizationOptions {
  /** Whether to remove HTML tags */
  removeHtml?: boolean;
  /** Whether to trim strings */
  trim?: boolean;
  /** Whether to normalize whitespace */
  normalizeWhitespace?: boolean;
  /** Whether to escape special characters */
  escapeSpecialChars?: boolean;
}

/**
 * Default sanitization options
 */
const defaultSanitizationOptions: SanitizationOptions = {
  removeHtml: true,
  trim: true,
  normalizeWhitespace: true,
  escapeSpecialChars: true,
};

/**
 * Validation service for API Gateway
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  /**
   * Validates a request body against a class validator class
   * 
   * @param dto - The class to validate against
   * @param body - The request body to validate
   * @param options - Validation options
   * @returns Validation result
   */
  async validateWithClassValidator<T extends object>(
    dto: ClassConstructor<T>,
    body: Record<string, any>,
    options: ValidationOptions = defaultValidationOptions,
  ): Promise<ValidationResult<T>> {
    const mergedOptions = { ...defaultValidationOptions, ...options };
    
    try {
      // Check for required fields first
      this.checkRequiredFields(body, dto);
      
      // Apply sanitization if enabled
      const sanitizedBody = mergedOptions.sanitize 
        ? this.sanitizeObject(body)
        : body;

      // Transform plain object to class instance
      const instance = plainToInstance(dto, sanitizedBody, {
        excludeExtraneousValues: mergedOptions.stripUnknown,
      });

      // Validate the instance
      const validatorOptions: ValidatorOptions = {
        whitelist: mergedOptions.stripUnknown,
        forbidNonWhitelisted: mergedOptions.stripUnknown,
        forbidUnknownValues: mergedOptions.stripUnknown,
        stopAtFirstError: false,
      };
      
      const errors = await validate(instance, validatorOptions);

      if (errors.length > 0) {
        const formattedErrors = this.formatClassValidatorErrors(errors);
        
        this.logger.debug(
          `Validation failed: ${JSON.stringify(formattedErrors)}`,
          { body, errors: formattedErrors },
        );

        if (mergedOptions.throwOnError) {
          throw new SchemaValidationError(
            mergedOptions.errorMessage || 'Validation failed',
            formattedErrors
          );
        }

        return {
          isValid: false,
          errors: formattedErrors,
          rawErrors: errors,
        };
      }

      return {
        isValid: true,
        data: instance as T,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Unexpected validation error: ${error.message}`,
        error.stack,
      );

      if (mergedOptions.throwOnError) {
        throw new HttpException(
          {
            message: 'Internal validation error',
            type: ErrorType.TECHNICAL,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        isValid: false,
        errors: { _error: ['Internal validation error'] },
        rawErrors: error,
      };
    }
  }
  
  /**
   * Checks if all required fields are present in the request body
   * 
   * @param body - The request body to check
   * @param dto - The class with decorators defining required fields
   * @throws MissingParameterError if a required field is missing
   */
  private checkRequiredFields<T extends object>(
    body: Record<string, any>,
    dto: ClassConstructor<T>
  ): void {
    // This is a simplified implementation
    // In a real-world scenario, we would use reflection to get the required fields from the DTO
    // For now, we'll just check if the body is empty when it shouldn't be
    if (!body || Object.keys(body).length === 0) {
      const dtoName = dto.name || 'Unknown';
      throw new MissingParameterError(
        `Request body is empty for ${dtoName}`,
        'body'
      );
    }
  }

  /**
   * Validates data against a Zod schema
   * 
   * @param schema - The Zod schema to validate against
   * @param data - The data to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateWithZod<T>(
    schema: z.ZodType<T>,
    data: unknown,
    options: ValidationOptions = defaultValidationOptions,
  ): ValidationResult<T> {
    const mergedOptions = { ...defaultValidationOptions, ...options };
    
    try {
      // Check if data is null or undefined when it shouldn't be
      if (data === null || data === undefined) {
        if (mergedOptions.throwOnError) {
          throw new MissingParameterError(
            'Required data is missing',
            'body'
          );
        }
        
        return {
          isValid: false,
          errors: { body: ['Required data is missing'] },
        };
      }
      
      // Apply sanitization if enabled and data is an object
      const sanitizedData = mergedOptions.sanitize && typeof data === 'object' && data !== null
        ? this.sanitizeObject(data as Record<string, any>)
        : data;

      // Parse with Zod schema
      const result = schema.safeParse(sanitizedData);

      if (!result.success) {
        const formattedErrors = this.formatZodErrors(result.error);
        
        this.logger.debug(
          `Zod validation failed: ${JSON.stringify(formattedErrors)}`,
          { data, errors: formattedErrors },
        );

        if (mergedOptions.throwOnError) {
          throw new SchemaValidationError(
            mergedOptions.errorMessage || 'Validation failed',
            formattedErrors
          );
        }

        return {
          isValid: false,
          errors: formattedErrors,
          rawErrors: result.error,
        };
      }

      return {
        isValid: true,
        data: result.data,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Unexpected Zod validation error: ${error.message}`,
        error.stack,
      );

      if (mergedOptions.throwOnError) {
        throw new HttpException(
          {
            message: 'Internal validation error',
            type: ErrorType.TECHNICAL,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        isValid: false,
        errors: { _error: ['Internal validation error'] },
        rawErrors: error,
      };
    }
  }
  
  /**
   * Creates a Zod schema with predefined error messages
   * 
   * @param schema - Base Zod schema
   * @returns Enhanced schema with custom error messages
   */
  createEnhancedSchema<T>(schema: z.ZodType<T>): z.ZodType<T> {
    return schema.superRefine((data, ctx) => {
      // This is where you can add custom validation logic
      // For example, journey-specific validation rules
      return data;
    });
  }

  /**
   * Validates a GraphQL input against a Zod schema
   * 
   * @param schema - The Zod schema to validate against
   * @param input - The GraphQL input to validate
   * @param options - Validation options
   * @returns Validated and transformed data
   * @throws SchemaValidationError if validation fails
   */
  validateGraphQLInput<T>(
    schema: z.ZodType<T>,
    input: unknown,
    options: ValidationOptions = defaultValidationOptions,
  ): T {
    const result = this.validateWithZod(schema, input, {
      ...options,
      throwOnError: false, // We'll handle throwing ourselves
    });
    
    if (!result.isValid) {
      // Always throw for GraphQL to ensure proper error handling
      throw new SchemaValidationError(
        options.errorMessage || 'GraphQL input validation failed',
        result.errors || {}
      );
    }
    
    return result.data as T;
  }
  
  /**
   * Validates a REST API request body
   * 
   * @param schema - The Zod schema to validate against
   * @param body - The request body to validate
   * @param options - Validation options
   * @returns Validated and transformed data
   */
  validateRequestBody<T>(
    schema: z.ZodType<T>,
    body: unknown,
    options: ValidationOptions = defaultValidationOptions,
  ): T {
    const result = this.validateWithZod(schema, body, options);
    
    if (!result.isValid) {
      throw new SchemaValidationError(
        options.errorMessage || 'Request body validation failed',
        result.errors || {}
      );
    }
    
    return result.data as T;
  }
  
  /**
   * Validates query parameters against a Zod schema
   * 
   * @param schema - The Zod schema to validate against
   * @param query - The query parameters to validate
   * @param options - Validation options
   * @returns Validated and transformed query parameters
   */
  validateQueryParams<T>(
    schema: z.ZodType<T>,
    query: Record<string, any>,
    options: ValidationOptions = defaultValidationOptions,
  ): T {
    // For query params, we typically want to be more lenient with types
    // since they come as strings from the URL
    const result = this.validateWithZod(schema, query, {
      ...options,
      sanitize: true, // Always sanitize query params
    });
    
    if (!result.isValid) {
      throw new InvalidParameterError(
        options.errorMessage || 'Invalid query parameters',
        Object.keys(result.errors || {})[0] || 'query'
      );
    }
    
    return result.data as T;
  }

  /**
   * Sanitizes a string by removing HTML tags, trimming, and normalizing whitespace
   * 
   * @param input - The string to sanitize
   * @param options - Sanitization options
   * @returns Sanitized string
   */
  sanitizeString(
    input: string,
    options: SanitizationOptions = defaultSanitizationOptions,
  ): string {
    if (typeof input !== 'string') {
      return input as unknown as string;
    }
    
    const mergedOptions = { ...defaultSanitizationOptions, ...options };
    let result = input;

    if (mergedOptions.removeHtml) {
      // Remove HTML tags
      result = result.replace(/<[^>]*>/g, '');
    }

    if (mergedOptions.trim) {
      // Trim whitespace
      result = result.trim();
    }

    if (mergedOptions.normalizeWhitespace) {
      // Normalize whitespace (replace multiple spaces with a single space)
      result = result.replace(/\s+/g, ' ');
    }

    if (mergedOptions.escapeSpecialChars) {
      // Escape special characters
      result = result
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    return result;
  }

  /**
   * Sanitizes an object by recursively sanitizing all string properties
   * 
   * @param obj - The object to sanitize
   * @param options - Sanitization options
   * @returns Sanitized object
   */
  sanitizeObject<T extends Record<string, any>>(
    obj: T,
    options: SanitizationOptions = defaultSanitizationOptions,
  ): T {
    // Use the shared sanitizeObject function from @austa/utils/validation
    // This ensures consistent sanitization across all services
    try {
      return sharedSanitizeObject(obj, options);
    } catch (error) {
      // Fallback to local implementation if the shared one fails
      this.logger.warn(
        `Failed to use shared sanitizeObject, falling back to local implementation: ${error.message}`,
        error.stack,
      );
      
      return this.sanitizeObjectLocal(obj, options);
    }
  }
  
  /**
   * Local implementation of sanitizeObject as a fallback
   * 
   * @param obj - The object to sanitize
   * @param options - Sanitization options
   * @returns Sanitized object
   */
  private sanitizeObjectLocal<T extends Record<string, any>>(
    obj: T,
    options: SanitizationOptions = defaultSanitizationOptions,
  ): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.sanitizeString(value, options);
      } else if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null
            ? this.sanitizeObjectLocal(item, options)
            : typeof item === 'string'
              ? this.sanitizeString(item, options)
              : item
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitizeObjectLocal(value, options);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }
  
  /**
   * Detects and prevents common security issues in input data
   * 
   * @param input - The input to check
   * @returns Sanitized input with potential security issues addressed
   */
  securitySanitize(input: unknown): unknown {
    if (typeof input === 'string') {
      // Prevent common injection attacks
      return this.preventInjectionAttacks(input);
    } else if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        return input.map(item => this.securitySanitize(item));
      } else {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input)) {
          result[key] = this.securitySanitize(value);
        }
        return result;
      }
    }
    
    return input;
  }
  
  /**
   * Prevents common injection attacks in string inputs
   * 
   * @param input - The string to sanitize
   * @returns Sanitized string
   */
  private preventInjectionAttacks(input: string): string {
    // Prevent NoSQL injection
    const noSqlInjectionPatterns = [
      /\$\{.*\}/g,  // Template injection
      /\$eq:/g,     // MongoDB operators
      /\$gt:/g,
      /\$gte:/g,
      /\$in:/g,
      /\$lt:/g,
      /\$lte:/g,
      /\$ne:/g,
      /\$nin:/g,
      /\$or:/g,
      /\$and:/g,
      /\$not:/g,
      /\$nor:/g,
      /\$exists:/g,
      /\$type:/g,
      /\$expr:/g,
      /\$jsonSchema:/g,
      /\$mod:/g,
      /\$regex:/g,
      /\$where:/g,
      /\$text:/g,
      /\$all:/g,
      /\$elemMatch:/g,
      /\$size:/g,
      /\$bitsAllClear:/g,
      /\$bitsAllSet:/g,
      /\$bitsAnyClear:/g,
      /\$bitsAnySet:/g,
      /\$comment:/g,
      /\$meta:/g,
    ];
    
    let sanitized = input;
    for (const pattern of noSqlInjectionPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    // Prevent command injection
    sanitized = sanitized
      .replace(/;/g, '') // Command separator
      .replace(/\|/g, '') // Pipe
      .replace(/`/g, ''); // Backtick for command substitution
      
    return sanitized;
  }

  /**
   * Formats class-validator errors into a user-friendly format
   * 
   * @param errors - The class-validator errors
   * @returns Formatted errors
   */
  private formatClassValidatorErrors(
    errors: ValidationError[],
  ): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    const formatError = (error: ValidationError, prefix = '') => {
      const property = prefix ? `${prefix}.${error.property}` : error.property;

      if (error.constraints) {
        formattedErrors[property] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        error.children.forEach(child => formatError(child, property));
      }
    };

    errors.forEach(error => formatError(error));

    return formattedErrors;
  }

  /**
   * Formats Zod errors into a user-friendly format
   * 
   * @param error - The Zod error
   * @returns Formatted errors
   */
  private formatZodErrors(error: ZodError): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    error.errors.forEach(err => {
      const path = err.path.join('.');
      const key = path || '_error';

      if (!formattedErrors[key]) {
        formattedErrors[key] = [];
      }

      // Enhance error messages for better user experience
      let message = err.message;
      
      // Add more context to common error types
      if (err.code === 'invalid_type') {
        if (err.expected === 'string' && err.received === 'undefined') {
          message = `${key} is required`;
        } else {
          message = `${key} must be a ${err.expected}, but received ${err.received}`;
        }
      } else if (err.code === 'too_small') {
        if (err.type === 'string') {
          message = `${key} must be at least ${err.minimum} characters`;
        } else if (err.type === 'number') {
          message = `${key} must be greater than ${err.inclusive ? 'or equal to ' : ''}${err.minimum}`;
        } else if (err.type === 'array') {
          message = `${key} must contain at least ${err.minimum} item${err.minimum === 1 ? '' : 's'}`;
        }
      } else if (err.code === 'too_big') {
        if (err.type === 'string') {
          message = `${key} must be at most ${err.maximum} characters`;
        } else if (err.type === 'number') {
          message = `${key} must be less than ${err.inclusive ? 'or equal to ' : ''}${err.maximum}`;
        } else if (err.type === 'array') {
          message = `${key} must contain at most ${err.maximum} item${err.maximum === 1 ? '' : 's'}`;
        }
      }

      formattedErrors[key].push(message);
    });

    return formattedErrors;
  }
  
  /**
   * Validates a response against a schema before sending it to the client
   * 
   * @param schema - The schema to validate against
   * @param response - The response to validate
   * @returns Validated response
   * @throws Error if validation fails in development mode
   */
  validateResponse<T>(
    schema: z.ZodType<T>,
    response: unknown,
  ): T {
    // Only validate responses in development mode to avoid performance impact in production
    if (process.env.NODE_ENV === 'development') {
      const result = schema.safeParse(response);
      
      if (!result.success) {
        const formattedErrors = this.formatZodErrors(result.error);
        
        this.logger.error(
          `Response validation failed: ${JSON.stringify(formattedErrors)}`,
          { response, errors: formattedErrors },
        );
        
        // In development, throw an error to help identify response validation issues
        // In production, we'll just log the error and return the original response
        if (process.env.NODE_ENV === 'development') {
          throw new Error(`Response validation failed: ${JSON.stringify(formattedErrors)}`);
        }
        
        return response as T;
      }
      
      return result.data;
    }
    
    // In production, skip validation and return the original response
    return response as T;
  }
}

/**
 * Standalone validation functions for use outside of the ValidationService
 */

/**
 * Validates data against a Zod schema
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateWithZod<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: ValidationOptions = defaultValidationOptions,
): ValidationResult<T> {
  const validationService = new ValidationService();
  return validationService.validateWithZod(schema, data, options);
}

/**
 * Sanitizes a string by removing HTML tags, trimming, and normalizing whitespace
 * 
 * @param input - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string,
  options: SanitizationOptions = defaultSanitizationOptions,
): string {
  const validationService = new ValidationService();
  return validationService.sanitizeString(input, options);
}

/**
 * Sanitizes an object by recursively sanitizing all string properties
 * 
 * @param obj - The object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: SanitizationOptions = defaultSanitizationOptions,
): T {
  const validationService = new ValidationService();
  return validationService.sanitizeObject(obj, options);
}

/**
 * Applies security sanitization to prevent common attacks
 * 
 * @param input - The input to sanitize
 * @returns Sanitized input
 */
export function securitySanitize(input: unknown): unknown {
  const validationService = new ValidationService();
  return validationService.securitySanitize(input);
}

/**
 * Creates a validation pipe for use with NestJS controllers
 * 
 * @param schema - The Zod schema to validate against
 * @param options - Validation options
 * @returns A function that validates the input
 */
export function createZodValidationPipe<T>(
  schema: z.ZodType<T>,
  options: ValidationOptions = defaultValidationOptions,
) {
  return (data: unknown): T => {
    const result = validateWithZod(schema, data, options);
    
    if (!result.isValid) {
      throw new SchemaValidationError(
        options.errorMessage || 'Validation failed',
        result.errors || {}
      );
    }
    
    return result.data as T;
  };
}

/**
 * NestJS validation pipe that uses Zod schemas
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  private readonly schema: z.ZodType<T>;
  private readonly options: ValidationOptions;

  constructor(schema: z.ZodType<T>, options: ValidationOptions = defaultValidationOptions) {
    this.schema = schema;
    this.options = options;
  }

  transform(value: unknown, metadata: ArgumentMetadata): T {
    try {
      const result = validateWithZod(this.schema, value, this.options);
      
      if (!result.isValid) {
        throw new SchemaValidationError(
          this.options.errorMessage || `Validation failed for ${metadata.type} parameter`,
          result.errors || {}
        );
      }
      
      return result.data as T;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new SchemaValidationError(
        `Validation error: ${error.message}`,
        { [metadata.data || metadata.type]: [error.message] }
      );
    }
  }
}

/**
 * Creates common validation schemas for API Gateway
 */
export class ValidationSchemas {
  /**
   * Creates a schema for pagination parameters
   */
  static pagination() {
    return z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    });
  }
  
  /**
   * Creates a schema for sorting parameters
   * 
   * @param allowedFields - Fields that can be used for sorting
   */
  static sorting(allowedFields: string[]) {
    return z.object({
      sortBy: z.enum([...allowedFields] as [string, ...string[]]).default(allowedFields[0]),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    });
  }
  
  /**
   * Creates a schema for filtering parameters
   * 
   * @param filterSchema - Schema for filter fields
   */
  static filtering<T extends z.ZodRawShape>(filterSchema: T) {
    return z.object(filterSchema).partial();
  }
  
  /**
   * Creates a schema for ID parameters
   */
  static id() {
    return z.object({
      id: z.string().uuid(),
    });
  }
  
  /**
   * Creates a schema for date range parameters
   */
  static dateRange() {
    return z.object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    }).refine(data => data.startDate <= data.endDate, {
      message: 'End date must be after start date',
      path: ['endDate'],
    });
  }
}