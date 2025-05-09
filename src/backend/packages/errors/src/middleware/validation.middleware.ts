import { Request, Response, NextFunction } from 'express';
import { BaseError, ErrorType, JourneyContext } from '../base';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError as ClassValidationError } from 'class-validator';
import * as Joi from 'joi';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validation target in the request object.
 */
export enum ValidationTarget {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
  HEADERS = 'headers',
  ALL = 'all'
}

/**
 * Options for the validation middleware.
 */
export interface ValidationOptions {
  /**
   * Whether to abort early on first validation error.
   * Default: false (collect all errors)
   */
  abortEarly?: boolean;
  
  /**
   * Whether to strip unknown properties from the validated object.
   * Default: false
   */
  stripUnknown?: boolean;
  
  /**
   * Error code to use for validation errors.
   * Default: 'VALIDATION_ERROR'
   */
  errorCode?: string;
  
  /**
   * Journey context to include in the error.
   */
  journeyContext?: JourneyContext;
  
  /**
   * Custom error message to use instead of the default.
   */
  errorMessage?: string;
  
  /**
   * Whether to include the raw validation errors in the error details.
   * Default: true
   */
  includeRawErrors?: boolean;
}

/**
 * Default validation options.
 */
const defaultValidationOptions: ValidationOptions = {
  abortEarly: false,
  stripUnknown: false,
  errorCode: 'VALIDATION_ERROR',
  includeRawErrors: true
};

/**
 * Creates a validation middleware using Joi schema.
 * 
 * @param schema - Joi schema to validate against
 * @param target - Request property to validate (body, query, params, headers)
 * @param options - Validation options
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * const userSchema = Joi.object({
 *   name: Joi.string().required(),
 *   email: Joi.string().email().required(),
 *   age: Joi.number().integer().min(18).required()
 * });
 * 
 * app.post('/users', validateWithJoi(userSchema, ValidationTarget.BODY), (req, res) => {
 *   // Request body is validated
 *   res.status(201).json({ message: 'User created' });
 * });
 * ```
 */
export function validateWithJoi(
  schema: Joi.Schema,
  target: ValidationTarget = ValidationTarget.BODY,
  options: ValidationOptions = {}
) {
  const mergedOptions = { ...defaultValidationOptions, ...options };
  
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[target];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: mergedOptions.abortEarly,
      stripUnknown: mergedOptions.stripUnknown
    });
    
    if (error) {
      const details = mergedOptions.includeRawErrors ? {
        errors: error.details.map(detail => ({
          path: detail.path.join('.'),
          type: detail.type,
          message: detail.message
        }))
      } : undefined;
      
      const errorMessage = mergedOptions.errorMessage || 
        `Validation failed for ${target}: ${error.details.map(d => d.message).join(', ')}`;
      
      const validationError = new BaseError(
        errorMessage,
        ErrorType.VALIDATION,
        mergedOptions.errorCode,
        { journey: mergedOptions.journeyContext, requestId: req['requestId'] },
        details
      );
      
      return next(validationError);
    }
    
    // Update the request object with validated data
    if (mergedOptions.stripUnknown) {
      req[target] = value;
    }
    
    next();
  };
}

/**
 * Creates a validation middleware using Zod schema.
 * 
 * @param schema - Zod schema to validate against
 * @param target - Request property to validate (body, query, params, headers)
 * @param options - Validation options
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number().int().min(18)
 * });
 * 
 * app.post('/users', validateWithZod(userSchema, ValidationTarget.BODY), (req, res) => {
 *   // Request body is validated
 *   res.status(201).json({ message: 'User created' });
 * });
 * ```
 */
export function validateWithZod(
  schema: ZodSchema,
  target: ValidationTarget = ValidationTarget.BODY,
  options: ValidationOptions = {}
) {
  const mergedOptions = { ...defaultValidationOptions, ...options };
  
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[target];
    
    try {
      const result = schema.parse(dataToValidate);
      
      // Update the request object with validated data
      if (mergedOptions.stripUnknown) {
        req[target] = result;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = mergedOptions.includeRawErrors ? {
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            code: err.code,
            message: err.message
          }))
        } : undefined;
        
        const errorMessage = mergedOptions.errorMessage || 
          `Validation failed for ${target}: ${error.errors.map(e => e.message).join(', ')}`;
        
        const validationError = new BaseError(
          errorMessage,
          ErrorType.VALIDATION,
          mergedOptions.errorCode,
          { journey: mergedOptions.journeyContext, requestId: req['requestId'] },
          details
        );
        
        return next(validationError);
      }
      
      // If it's not a ZodError, pass it to the next error handler
      next(error);
    }
  };
}

/**
 * Options for class-validator validation.
 */
export interface ClassValidationOptions extends ValidationOptions {
  /**
   * Whether to validate nested objects.
   * Default: true
   */
  validateNested?: boolean;
  
  /**
   * Whether to skip missing properties.
   * Default: false
   */
  skipMissingProperties?: boolean;
  
  /**
   * Whether to whitelist properties.
   * Default: false
   */
  whitelist?: boolean;
  
  /**
   * Whether to forbid non-whitelisted properties.
   * Default: false
   */
  forbidNonWhitelisted?: boolean;
}

/**
 * Default class-validator options.
 */
const defaultClassValidationOptions: ClassValidationOptions = {
  ...defaultValidationOptions,
  validateNested: true,
  skipMissingProperties: false,
  whitelist: false,
  forbidNonWhitelisted: false
};

/**
 * Creates a validation middleware using class-validator decorators.
 * 
 * @param type - Class with validation decorators
 * @param target - Request property to validate (body, query, params, headers)
 * @param options - Validation options
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * class CreateUserDto {
 *   @IsString()
 *   @IsNotEmpty()
 *   name: string;
 * 
 *   @IsEmail()
 *   email: string;
 * 
 *   @IsInt()
 *   @Min(18)
 *   age: number;
 * }
 * 
 * app.post('/users', validateWithClassValidator(CreateUserDto, ValidationTarget.BODY), (req, res) => {
 *   // Request body is validated
 *   res.status(201).json({ message: 'User created' });
 * });
 * ```
 */
export function validateWithClassValidator<T extends object>(
  type: ClassConstructor<T>,
  target: ValidationTarget = ValidationTarget.BODY,
  options: ClassValidationOptions = {}
) {
  const mergedOptions = { ...defaultClassValidationOptions, ...options };
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[target];
    
    // Transform plain object to class instance
    const instance = plainToInstance(type, dataToValidate);
    
    // Validate the instance
    const errors = await validate(instance, {
      skipMissingProperties: mergedOptions.skipMissingProperties,
      whitelist: mergedOptions.whitelist,
      forbidNonWhitelisted: mergedOptions.forbidNonWhitelisted,
      validationError: { target: false, value: true }
    });
    
    if (errors.length > 0) {
      const details = mergedOptions.includeRawErrors ? {
        errors: formatClassValidatorErrors(errors)
      } : undefined;
      
      const errorMessage = mergedOptions.errorMessage || 
        `Validation failed for ${target}: ${formatClassValidatorErrorMessage(errors)}`;
      
      const validationError = new BaseError(
        errorMessage,
        ErrorType.VALIDATION,
        mergedOptions.errorCode,
        { journey: mergedOptions.journeyContext, requestId: req['requestId'] },
        details
      );
      
      return next(validationError);
    }
    
    // Update the request object with validated data
    if (mergedOptions.whitelist) {
      req[target] = instance;
    }
    
    next();
  };
}

/**
 * Formats class-validator errors into a more readable format.
 * 
 * @param errors - Class-validator errors
 * @returns Formatted errors
 */
function formatClassValidatorErrors(errors: ClassValidationError[]): any[] {
  const result = [];
  
  for (const error of errors) {
    if (error.constraints) {
      // Add each constraint as a separate error
      for (const [type, message] of Object.entries(error.constraints)) {
        result.push({
          path: error.property,
          type,
          message
        });
      }
    }
    
    // Process nested errors
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatClassValidatorErrors(error.children);
      for (const nestedError of nestedErrors) {
        result.push({
          path: `${error.property}.${nestedError.path}`,
          type: nestedError.type,
          message: nestedError.message
        });
      }
    }
  }
  
  return result;
}

/**
 * Formats class-validator errors into a readable error message.
 * 
 * @param errors - Class-validator errors
 * @returns Formatted error message
 */
function formatClassValidatorErrorMessage(errors: ClassValidationError[]): string {
  const messages = [];
  
  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    
    // Process nested errors
    if (error.children && error.children.length > 0) {
      const nestedMessages = formatClassValidatorErrorMessage(error.children);
      messages.push(nestedMessages);
    }
  }
  
  return messages.join(', ');
}

/**
 * Factory function to create a validation middleware based on the schema type.
 * Automatically detects the schema type and uses the appropriate validation function.
 * 
 * @param schema - Validation schema (Joi, Zod, or class-validator class)
 * @param target - Request property to validate (body, query, params, headers)
 * @param options - Validation options
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * // With Joi
 * const joiSchema = Joi.object({ name: Joi.string().required() });
 * app.post('/users', createValidationMiddleware(joiSchema), (req, res) => { ... });
 * 
 * // With Zod
 * const zodSchema = z.object({ name: z.string() });
 * app.post('/users', createValidationMiddleware(zodSchema), (req, res) => { ... });
 * 
 * // With class-validator
 * class UserDto {
 *   @IsString()
 *   name: string;
 * }
 * app.post('/users', createValidationMiddleware(UserDto), (req, res) => { ... });
 * ```
 */
export function createValidationMiddleware(
  schema: any,
  target: ValidationTarget = ValidationTarget.BODY,
  options: ValidationOptions = {}
) {
  // Check if it's a Joi schema
  if (schema && typeof schema.validate === 'function') {
    return validateWithJoi(schema, target, options);
  }
  
  // Check if it's a Zod schema
  if (schema && typeof schema.parse === 'function' && typeof schema.safeParse === 'function') {
    return validateWithZod(schema, target, options);
  }
  
  // Assume it's a class-validator class
  return validateWithClassValidator(schema, target, options as ClassValidationOptions);
}

/**
 * Creates a validation middleware for multiple targets using different schemas.
 * 
 * @param schemas - Map of validation targets to schemas
 * @param options - Validation options
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * const schemas = {
 *   [ValidationTarget.BODY]: Joi.object({ name: Joi.string().required() }),
 *   [ValidationTarget.QUERY]: Joi.object({ filter: Joi.string() }),
 *   [ValidationTarget.PARAMS]: Joi.object({ id: Joi.string().uuid() })
 * };
 * 
 * app.put('/users/:id', validateMultiple(schemas), (req, res) => {
 *   // All request parts are validated
 *   res.status(200).json({ message: 'User updated' });
 * });
 * ```
 */
export function validateMultiple(
  schemas: Record<ValidationTarget, any>,
  options: ValidationOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Create an array of middleware functions for each target
    const middlewares = Object.entries(schemas).map(([target, schema]) => {
      return createValidationMiddleware(schema, target as ValidationTarget, options);
    });
    
    // Execute each middleware in sequence
    for (const middleware of middlewares) {
      try {
        await new Promise<void>((resolve, reject) => {
          middleware(req, res, (err: any) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } catch (error) {
        return next(error);
      }
    }
    
    next();
  };
}