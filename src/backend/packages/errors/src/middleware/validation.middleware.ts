import { Request, Response, NextFunction } from 'express';
import { BaseError, ErrorType } from '../base';
import * as Joi from 'joi';
import { ZodSchema, ZodError } from 'zod';
import { validate as classValidate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Validation target options for the middleware
 */
export enum ValidationTarget {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
  HEADERS = 'headers',
  ALL = 'all'
}

/**
 * Configuration options for the validation middleware
 */
export interface ValidationOptions {
  /**
   * Target to validate (body, query, params, headers, or all)
   * @default ValidationTarget.BODY
   */
  target?: ValidationTarget;

  /**
   * Whether to abort early on first validation error
   * @default true
   */
  abortEarly?: boolean;

  /**
   * Whether to strip unknown properties from the validated object
   * @default false
   */
  stripUnknown?: boolean;

  /**
   * Error code to use for validation errors
   * @default 'VALIDATION_ERROR'
   */
  errorCode?: string;

  /**
   * Custom error message template
   * @default 'Validation failed: {details}'
   */
  errorMessage?: string;
}

/**
 * Default validation options
 */
const defaultOptions: ValidationOptions = {
  target: ValidationTarget.BODY,
  abortEarly: true,
  stripUnknown: false,
  errorCode: 'VALIDATION_ERROR',
  errorMessage: 'Validation failed: {details}'
};

/**
 * Type guard for Joi schema
 */
function isJoiSchema(schema: any): schema is Joi.Schema {
  return schema && typeof schema.validate === 'function' && schema.validate.length >= 1;
}

/**
 * Type guard for Zod schema
 */
function isZodSchema(schema: any): schema is ZodSchema {
  return schema && typeof schema.parse === 'function' && typeof schema.safeParse === 'function';
}

/**
 * Type guard for class validator class
 */
function isClassValidatorClass(schema: any): schema is new (...args: any[]) => any {
  return typeof schema === 'function' && schema.prototype && schema.prototype.constructor === schema;
}

/**
 * Formats validation error details into a human-readable string
 */
function formatValidationDetails(details: any[]): string {
  if (!Array.isArray(details)) {
    return String(details);
  }
  
  return details
    .map(detail => {
      if (typeof detail === 'string') {
        return detail;
      }
      if (detail.path && detail.message) {
        const path = Array.isArray(detail.path) ? detail.path.join('.') : detail.path;
        return `${path}: ${detail.message}`;
      }
      if (detail.field && detail.message) {
        return `${detail.field}: ${detail.message}`;
      }
      return detail.message || String(detail);
    })
    .join('; ');
}

/**
 * Creates a validation middleware for Express using Joi schema
 */
function createJoiValidationMiddleware(
  schema: Joi.Schema,
  options: ValidationOptions
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const targetData = options.target === ValidationTarget.ALL
      ? { body: req.body, query: req.query, params: req.params, headers: req.headers }
      : req[options.target];

    const joiOptions = {
      abortEarly: options.abortEarly,
      stripUnknown: options.stripUnknown,
      allowUnknown: !options.stripUnknown
    };

    const { error, value } = schema.validate(targetData, joiOptions);

    if (error) {
      const details = error.details.map(detail => ({
        path: detail.path,
        message: detail.message
      }));

      const formattedDetails = formatValidationDetails(details);
      const errorMessage = options.errorMessage.replace('{details}', formattedDetails);

      const validationError = BaseError.validation(
        errorMessage,
        options.errorCode,
        details,
        { component: 'validation.middleware', operation: 'validate' },
        error
      );

      return next(validationError);
    }

    // Update the validated data on the request
    if (options.target !== ValidationTarget.ALL) {
      req[options.target] = value;
    } else {
      req.body = value.body;
      req.query = value.query;
      req.params = value.params;
      // Don't update headers as they're often read-only
    }

    next();
  };
}

/**
 * Creates a validation middleware for Express using Zod schema
 */
function createZodValidationMiddleware(
  schema: ZodSchema,
  options: ValidationOptions
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const targetData = options.target === ValidationTarget.ALL
      ? { body: req.body, query: req.query, params: req.params, headers: req.headers }
      : req[options.target];

    try {
      const result = schema.safeParse(targetData);

      if (!result.success) {
        const zodError = result.error;
        const details = zodError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));

        const formattedDetails = formatValidationDetails(details);
        const errorMessage = options.errorMessage.replace('{details}', formattedDetails);

        const validationError = BaseError.validation(
          errorMessage,
          options.errorCode,
          details,
          { component: 'validation.middleware', operation: 'validate' },
          zodError
        );

        return next(validationError);
      }

      // Update the validated data on the request
      if (options.target !== ValidationTarget.ALL) {
        req[options.target] = result.data;
      } else {
        req.body = result.data.body;
        req.query = result.data.query;
        req.params = result.data.params;
        // Don't update headers as they're often read-only
      }

      next();
    } catch (error) {
      // Handle unexpected errors during validation
      const unexpectedError = BaseError.from(
        error,
        'Unexpected error during validation',
        ErrorType.TECHNICAL,
        'VALIDATION_INTERNAL_ERROR',
        { component: 'validation.middleware', operation: 'validate' }
      );

      next(unexpectedError);
    }
  };
}

/**
 * Creates a validation middleware for Express using class-validator
 */
function createClassValidatorMiddleware(
  classType: new (...args: any[]) => any,
  options: ValidationOptions
): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetData = options.target === ValidationTarget.ALL
      ? { body: req.body, query: req.query, params: req.params, headers: req.headers }
      : req[options.target];

    try {
      // Transform plain object to class instance
      const instance = plainToInstance(classType, targetData);

      // Validate the instance
      const errors = await classValidate(instance, {
        skipMissingProperties: false,
        forbidUnknownValues: !options.stripUnknown,
        whitelist: options.stripUnknown,
        stopAtFirstError: options.abortEarly
      });

      if (errors.length > 0) {
        const details = errors.map(error => {
          const constraints = error.constraints || {};
          const messages = Object.values(constraints);
          return {
            field: error.property,
            message: messages.join(', ')
          };
        });

        const formattedDetails = formatValidationDetails(details);
        const errorMessage = options.errorMessage.replace('{details}', formattedDetails);

        const validationError = BaseError.validation(
          errorMessage,
          options.errorCode,
          details,
          { component: 'validation.middleware', operation: 'validate' },
          new Error('Validation failed')
        );

        return next(validationError);
      }

      // Update the validated data on the request
      if (options.target !== ValidationTarget.ALL) {
        req[options.target] = instance;
      } else {
        req.body = instance.body;
        req.query = instance.query;
        req.params = instance.params;
        // Don't update headers as they're often read-only
      }

      next();
    } catch (error) {
      // Handle unexpected errors during validation
      const unexpectedError = BaseError.from(
        error,
        'Unexpected error during validation',
        ErrorType.TECHNICAL,
        'VALIDATION_INTERNAL_ERROR',
        { component: 'validation.middleware', operation: 'validate' }
      );

      next(unexpectedError);
    }
  };
}

/**
 * Creates a validation middleware for Express
 * 
 * @param schema - Validation schema (Joi, Zod, or class-validator class)
 * @param options - Validation options
 * @returns Express middleware function
 * 
 * @example
 * // Using Joi
 * const userSchema = Joi.object({
 *   name: Joi.string().required(),
 *   email: Joi.string().email().required()
 * });
 * app.post('/users', validate(userSchema), createUserHandler);
 * 
 * @example
 * // Using Zod
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 * app.post('/users', validate(userSchema, { target: ValidationTarget.BODY }), createUserHandler);
 * 
 * @example
 * // Using class-validator
 * class CreateUserDto {
 *   @IsString()
 *   @IsNotEmpty()
 *   name: string;
 * 
 *   @IsEmail()
 *   email: string;
 * }
 * app.post('/users', validate(CreateUserDto), createUserHandler);
 */
export function validate(
  schema: Joi.Schema | ZodSchema | (new (...args: any[]) => any),
  options: ValidationOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  // Merge with default options
  const mergedOptions: ValidationOptions = {
    ...defaultOptions,
    ...options
  };

  // Create appropriate middleware based on schema type
  if (isJoiSchema(schema)) {
    return createJoiValidationMiddleware(schema, mergedOptions);
  }

  if (isZodSchema(schema)) {
    return createZodValidationMiddleware(schema, mergedOptions);
  }

  if (isClassValidatorClass(schema)) {
    return createClassValidatorMiddleware(schema, mergedOptions);
  }

  throw new Error('Unsupported schema type. Please provide a Joi schema, Zod schema, or class-validator class.');
}

/**
 * Creates a validation middleware for Express that validates request body
 * 
 * @param schema - Validation schema (Joi, Zod, or class-validator class)
 * @param options - Validation options (excluding target which is set to BODY)
 * @returns Express middleware function
 * 
 * @example
 * app.post('/users', validateBody(userSchema), createUserHandler);
 */
export function validateBody(
  schema: Joi.Schema | ZodSchema | (new (...args: any[]) => any),
  options: Omit<ValidationOptions, 'target'> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return validate(schema, { ...options, target: ValidationTarget.BODY });
}

/**
 * Creates a validation middleware for Express that validates request query parameters
 * 
 * @param schema - Validation schema (Joi, Zod, or class-validator class)
 * @param options - Validation options (excluding target which is set to QUERY)
 * @returns Express middleware function
 * 
 * @example
 * app.get('/users', validateQuery(userQuerySchema), getUsersHandler);
 */
export function validateQuery(
  schema: Joi.Schema | ZodSchema | (new (...args: any[]) => any),
  options: Omit<ValidationOptions, 'target'> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return validate(schema, { ...options, target: ValidationTarget.QUERY });
}

/**
 * Creates a validation middleware for Express that validates request path parameters
 * 
 * @param schema - Validation schema (Joi, Zod, or class-validator class)
 * @param options - Validation options (excluding target which is set to PARAMS)
 * @returns Express middleware function
 * 
 * @example
 * app.get('/users/:id', validateParams(userParamsSchema), getUserByIdHandler);
 */
export function validateParams(
  schema: Joi.Schema | ZodSchema | (new (...args: any[]) => any),
  options: Omit<ValidationOptions, 'target'> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return validate(schema, { ...options, target: ValidationTarget.PARAMS });
}

/**
 * Creates a validation middleware for Express that validates request headers
 * 
 * @param schema - Validation schema (Joi, Zod, or class-validator class)
 * @param options - Validation options (excluding target which is set to HEADERS)
 * @returns Express middleware function
 * 
 * @example
 * app.get('/secure', validateHeaders(authHeadersSchema), secureResourceHandler);
 */
export function validateHeaders(
  schema: Joi.Schema | ZodSchema | (new (...args: any[]) => any),
  options: Omit<ValidationOptions, 'target'> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return validate(schema, { ...options, target: ValidationTarget.HEADERS });
}

/**
 * Creates a validation middleware for Express that validates multiple parts of the request
 * 
 * @param schemas - Object containing schemas for different parts of the request
 * @param options - Validation options (excluding target which is set to ALL)
 * @returns Express middleware function
 * 
 * @example
 * app.post('/users/:id/posts', 
 *   validateRequest({
 *     body: postSchema,
 *     params: userParamsSchema,
 *     query: paginationSchema
 *   }),
 *   createPostHandler
 * );
 */
export function validateRequest(
  schemas: {
    body?: Joi.Schema | ZodSchema | (new (...args: any[]) => any);
    query?: Joi.Schema | ZodSchema | (new (...args: any[]) => any);
    params?: Joi.Schema | ZodSchema | (new (...args: any[]) => any);
    headers?: Joi.Schema | ZodSchema | (new (...args: any[]) => any);
  },
  options: Omit<ValidationOptions, 'target'> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    // Create a middleware chain to validate each part of the request
    const middlewares: ((req: Request, res: Response, next: NextFunction) => void)[] = [];

    if (schemas.body) {
      middlewares.push(validateBody(schemas.body, options));
    }

    if (schemas.query) {
      middlewares.push(validateQuery(schemas.query, options));
    }

    if (schemas.params) {
      middlewares.push(validateParams(schemas.params, options));
    }

    if (schemas.headers) {
      middlewares.push(validateHeaders(schemas.headers, options));
    }

    // Execute middlewares in sequence
    const executeMiddleware = (index: number) => {
      if (index >= middlewares.length) {
        return next();
      }

      middlewares[index](req, res, (err?: any) => {
        if (err) {
          return next(err);
        }
        executeMiddleware(index + 1);
      });
    };

    executeMiddleware(0);
  };
}