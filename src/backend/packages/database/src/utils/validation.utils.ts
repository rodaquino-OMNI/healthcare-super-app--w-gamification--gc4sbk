/**
 * @file validation.utils.ts
 * @description Provides comprehensive data validation utilities for database operations using Zod schemas.
 * Implements pre-validation for database inputs to ensure data integrity before database operations.
 * Includes journey-specific validation schemas and utilities for validation error formatting.
 *
 * @module @austa/database/utils/validation
 */

import { z } from 'zod';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError as ClassValidationError } from 'class-validator';

/**
 * Enum representing the different journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

// Import journey-specific interfaces
import {
  MetricType,
  MetricSource,
  IHealthMetric,
} from '@austa/interfaces/journey/health';

import {
  AppointmentType,
  AppointmentStatus,
  IAppointment,
} from '@austa/interfaces/journey/care';

import {
  ClaimStatus,
  IClaim,
  IBenefit,
} from '@austa/interfaces/journey/plan';

/**
 * Interface for validation error details
 */
export interface ValidationErrorDetail {
  /** Path to the field with the error */
  path: string[];
  /** Error message */
  message: string;
  /** Original validation error code */
  code: string;
}

/**
 * Interface for formatted validation errors
 */
export interface FormattedValidationError {
  /** Overall error message */
  message: string;
  /** Detailed validation errors */
  errors: ValidationErrorDetail[];
  /** Journey context where the validation error occurred */
  journey?: JourneyType;
}

/**
 * Options for validation
 */
export interface ValidationOptions {
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Journey context for validation */
  journey?: JourneyType;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Default validation options
 */
const defaultValidationOptions: ValidationOptions = {
  throwOnError: true,
  journey: undefined,
  errorMessage: 'Validation failed',
};

/**
 * Validates data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated data or throws an error
 * 
 * @example
 * const userSchema = z.object({
 *   id: z.string().uuid(),
 *   name: z.string().min(2),
 *   email: z.string().email(),
 * });
 * 
 * // Will validate and return the data if valid, or throw an error if invalid
 * const validatedUser = validateWithZod(userSchema, userData);
 */
export function validateWithZod<T>(schema: z.ZodType<T>, data: unknown, options: ValidationOptions = {}): T {
  const opts = { ...defaultValidationOptions, ...options };
  
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error, opts.journey, opts.errorMessage);
      
      if (opts.throwOnError) {
        throw new ValidationError(formattedError);
      }
      
      return null as unknown as T;
    }
    
    throw error;
  }
}

/**
 * Validates data against a Zod schema and returns a result object
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Object with success flag, data, and errors
 * 
 * @example
 * const userSchema = z.object({
 *   id: z.string().uuid(),
 *   name: z.string().min(2),
 *   email: z.string().email(),
 * });
 * 
 * const result = validateWithResult(userSchema, userData);
 * if (result.success) {
 *   // Use result.data safely
 * } else {
 *   // Handle result.errors
 * }
 */
export function validateWithResult<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: ValidationOptions = {}
): { success: boolean; data?: T; errors?: FormattedValidationError } {
  const opts = { ...defaultValidationOptions, ...options, throwOnError: false };
  
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error, opts.journey, opts.errorMessage);
      return { success: false, errors: formattedError };
    }
    
    throw error;
  }
}

/**
 * Validates data against a class-validator decorated class
 * 
 * @param cls - Class with class-validator decorators
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated instance or throws an error
 * 
 * @example
 * class UserDto {
 *   @IsUUID()
 *   id: string;
 *   
 *   @IsString()
 *   @MinLength(2)
 *   name: string;
 *   
 *   @IsEmail()
 *   email: string;
 * }
 * 
 * const validatedUser = validateWithClassValidator(UserDto, userData);
 */
export function validateWithClassValidator<T extends object>(
  cls: ClassConstructor<T>,
  data: Record<string, unknown>,
  options: ValidationOptions = {}
): T {
  const opts = { ...defaultValidationOptions, ...options };
  const instance = plainToInstance(cls, data);
  const errors = validateSync(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  
  if (errors.length > 0) {
    const formattedError = formatClassValidatorErrors(errors, opts.journey, opts.errorMessage);
    
    if (opts.throwOnError) {
      throw new ValidationError(formattedError);
    }
    
    return null as unknown as T;
  }
  
  return instance;
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  /** Detailed validation errors */
  public readonly errors: ValidationErrorDetail[];
  /** Journey context where the validation error occurred */
  public readonly journey?: JourneyType;
  
  constructor(formattedError: FormattedValidationError) {
    super(formattedError.message);
    this.name = 'ValidationError';
    this.errors = formattedError.errors;
    this.journey = formattedError.journey;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Formats a Zod error into a standardized format
 * 
 * @param error - Zod error to format
 * @param journey - Journey context
 * @param message - Custom error message
 * @returns Formatted validation error
 */
export function formatZodError(
  error: z.ZodError,
  journey?: JourneyType,
  message = 'Validation failed'
): FormattedValidationError {
  const errors: ValidationErrorDetail[] = error.errors.map((err) => ({
    path: err.path,
    message: err.message,
    code: err.code,
  }));
  
  return {
    message,
    errors,
    journey,
  };
}

/**
 * Formats class-validator errors into a standardized format
 * 
 * @param errors - Class-validator errors to format
 * @param journey - Journey context
 * @param message - Custom error message
 * @returns Formatted validation error
 */
export function formatClassValidatorErrors(
  errors: ClassValidationError[],
  journey?: JourneyType,
  message = 'Validation failed'
): FormattedValidationError {
  const flattenErrors = (error: ClassValidationError, path: string[] = []): ValidationErrorDetail[] => {
    const currentPath = [...path, error.property];
    
    const constraints = error.constraints
      ? Object.entries(error.constraints).map(([code, msg]) => ({
          path: currentPath,
          message: msg,
          code,
        }))
      : [];
    
    const childErrors = error.children
      ? error.children.flatMap((child) => flattenErrors(child, currentPath))
      : [];
    
    return [...constraints, ...childErrors];
  };
  
  const formattedErrors = errors.flatMap((error) => flattenErrors(error));
  
  return {
    message,
    errors: formattedErrors,
    journey,
  };
}

// ===== Journey-specific validation schemas =====

/**
 * Health journey validation schemas
 */
export const HealthValidation = {
  /**
   * Schema for validating health metrics
   */
  metric: z.object({
    userId: z.string().uuid(),
    type: z.nativeEnum(MetricType),
    value: z.number(),
    unit: z.string(),
    timestamp: z.date(),
    source: z.nativeEnum(MetricSource).optional(),
    deviceId: z.string().optional(),
    notes: z.string().optional(),
  }),
  
  /**
   * Schema for validating health metric batch creation
   */
  metricBatch: z.array(
    z.object({
      userId: z.string().uuid(),
      type: z.nativeEnum(MetricType),
      value: z.number(),
      unit: z.string(),
      timestamp: z.date(),
      source: z.nativeEnum(MetricSource).optional(),
      deviceId: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  
  /**
   * Schema for validating health metric updates
   */
  metricUpdate: z.object({
    value: z.number().optional(),
    unit: z.string().optional(),
    timestamp: z.date().optional(),
    source: z.nativeEnum(MetricSource).optional(),
    notes: z.string().optional(),
  }),
};

/**
 * Care journey validation schemas
 */
export const CareValidation = {
  /**
   * Schema for validating appointments
   */
  appointment: z.object({
    userId: z.string().uuid(),
    providerId: z.string().uuid(),
    type: z.nativeEnum(AppointmentType),
    status: z.nativeEnum(AppointmentStatus),
    scheduledAt: z.date(),
    duration: z.number().int().positive(),
    location: z.string().optional(),
    notes: z.string().optional(),
    reminderSent: z.boolean().optional().default(false),
  }),
  
  /**
   * Schema for validating appointment updates
   */
  appointmentUpdate: z.object({
    providerId: z.string().uuid().optional(),
    type: z.nativeEnum(AppointmentType).optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    scheduledAt: z.date().optional(),
    duration: z.number().int().positive().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    reminderSent: z.boolean().optional(),
  }),
  
  /**
   * Schema for validating appointment cancellation
   */
  appointmentCancellation: z.object({
    reason: z.string(),
    canceledBy: z.string().uuid(),
  }),
};

/**
 * Plan journey validation schemas
 */
export const PlanValidation = {
  /**
   * Schema for validating benefits
   */
  benefit: z.object({
    planId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string(),
    coveragePercentage: z.number().min(0).max(100),
    annualLimit: z.number().optional(),
    lifetimeLimit: z.number().optional(),
    waitingPeriod: z.number().int().min(0).optional(),
    isActive: z.boolean().default(true),
  }),
  
  /**
   * Schema for validating benefit updates
   */
  benefitUpdate: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    coveragePercentage: z.number().min(0).max(100).optional(),
    annualLimit: z.number().optional(),
    lifetimeLimit: z.number().optional(),
    waitingPeriod: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
  
  /**
   * Schema for validating claims
   */
  claim: z.object({
    userId: z.string().uuid(),
    planId: z.string().uuid(),
    benefitId: z.string().uuid(),
    serviceDate: z.date(),
    amount: z.number().positive(),
    status: z.nativeEnum(ClaimStatus).default(ClaimStatus.SUBMITTED),
    providerName: z.string(),
    description: z.string(),
    receiptUrls: z.array(z.string().url()).optional(),
    notes: z.string().optional(),
  }),
};

/**
 * Validates data based on journey type and entity type
 * 
 * @param journey - Journey type
 * @param entityType - Entity type within the journey
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated data or throws an error
 * 
 * @example
 * const validatedMetric = validateJourneyData(
 *   'health',
 *   'metric',
 *   metricData
 * );
 */
export function validateJourneyData<T>(
  journey: JourneyType,
  entityType: string,
  data: unknown,
  options: ValidationOptions = {}
): T {
  const opts = { ...options, journey };
  
  switch (journey) {
    case JourneyType.HEALTH:
      return validateHealthData(entityType, data, opts) as unknown as T;
    case JourneyType.CARE:
      return validateCareData(entityType, data, opts) as unknown as T;
    case JourneyType.PLAN:
      return validatePlanData(entityType, data, opts) as unknown as T;
    default:
      throw new Error(`Unknown journey type: ${journey}`);
  }
}

/**
 * Validates health journey data
 * 
 * @param entityType - Entity type within the health journey
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated data or throws an error
 */
function validateHealthData(
  entityType: string,
  data: unknown,
  options: ValidationOptions = {}
): unknown {
  switch (entityType) {
    case 'metric':
      return validateWithZod(HealthValidation.metric, data, options);
    case 'metricBatch':
      return validateWithZod(HealthValidation.metricBatch, data, options);
    case 'metricUpdate':
      return validateWithZod(HealthValidation.metricUpdate, data, options);
    default:
      throw new Error(`Unknown health entity type: ${entityType}`);
  }
}

/**
 * Validates care journey data
 * 
 * @param entityType - Entity type within the care journey
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated data or throws an error
 */
function validateCareData(
  entityType: string,
  data: unknown,
  options: ValidationOptions = {}
): unknown {
  switch (entityType) {
    case 'appointment':
      return validateWithZod(CareValidation.appointment, data, options);
    case 'appointmentUpdate':
      return validateWithZod(CareValidation.appointmentUpdate, data, options);
    case 'appointmentCancellation':
      return validateWithZod(CareValidation.appointmentCancellation, data, options);
    default:
      throw new Error(`Unknown care entity type: ${entityType}`);
  }
}

/**
 * Validates plan journey data
 * 
 * @param entityType - Entity type within the plan journey
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated data or throws an error
 */
function validatePlanData(
  entityType: string,
  data: unknown,
  options: ValidationOptions = {}
): unknown {
  switch (entityType) {
    case 'benefit':
      return validateWithZod(PlanValidation.benefit, data, options);
    case 'benefitUpdate':
      return validateWithZod(PlanValidation.benefitUpdate, data, options);
    case 'claim':
      return validateWithZod(PlanValidation.claim, data, options);
    default:
      throw new Error(`Unknown plan entity type: ${entityType}`);
  }
}

/**
 * Validates data before a database operation
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated data or throws an error
 * 
 * @example
 * const userSchema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 * });
 * 
 * const validatedData = validateDbInput(userSchema, userData);
 * await prisma.user.create({ data: validatedData });
 */
export function validateDbInput<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: ValidationOptions = {}
): T {
  return validateWithZod(schema, data, {
    ...options,
    errorMessage: options.errorMessage || 'Invalid database input',
  });
}

/**
 * Validates data after a database operation
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated data or throws an error
 * 
 * @example
 * const userSchema = z.object({
 *   id: z.string().uuid(),
 *   name: z.string().min(2),
 *   email: z.string().email(),
 *   createdAt: z.date(),
 * });
 * 
 * const user = await prisma.user.findUnique({ where: { id } });
 * const validatedUser = validateDbOutput(userSchema, user);
 */
export function validateDbOutput<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: ValidationOptions = {}
): T {
  return validateWithZod(schema, data, {
    ...options,
    errorMessage: options.errorMessage || 'Invalid database output',
  });
}

/**
 * Creates a validation pipeline that applies multiple validation schemas in sequence
 * 
 * @param schemas - Array of Zod schemas to apply
 * @returns A new Zod schema that applies all schemas in sequence
 * 
 * @example
 * const baseUserSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 * 
 * const adminUserSchema = z.object({
 *   role: z.literal('admin'),
 *   permissions: z.array(z.string()),
 * });
 * 
 * const validateAdminUser = createValidationPipeline([baseUserSchema, adminUserSchema]);
 * const validatedAdmin = validateAdminUser.parse(userData);
 */
export function createValidationPipeline<T>(schemas: z.ZodType<T>[]): z.ZodType<T> {
  return z.preprocess((data) => {
    return schemas.reduce((validatedData, schema) => {
      return schema.parse(validatedData);
    }, data);
  }, schemas[schemas.length - 1]);
}

/**
 * Creates a partial validation schema that makes all properties optional
 * 
 * @param schema - Zod schema to make partial
 * @returns A new Zod schema with all properties optional
 * 
 * @example
 * const userSchema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 *   age: z.number().positive(),
 * });
 * 
 * const partialUserSchema = createPartialSchema(userSchema);
 * // Now all fields are optional
 * const validatedPartialUser = partialUserSchema.parse({ name: 'John' });
 */
export function createPartialSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodObject<T> {
  const partialShape = Object.entries(schema.shape).reduce(
    (acc, [key, value]) => {
      acc[key] = value.optional();
      return acc;
    },
    {} as Record<string, z.ZodTypeAny>
  );
  
  return z.object(partialShape as T);
}

/**
 * Creates a validation schema for database filters
 * 
 * @param schema - Base Zod schema for the entity
 * @returns A new Zod schema for validating filters
 * 
 * @example
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number(),
 * });
 * 
 * const userFilterSchema = createFilterSchema(userSchema);
 * const validFilter = userFilterSchema.parse({
 *   name: { contains: 'John' },
 *   age: { gte: 18 },
 * });
 */
export function createFilterSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodType<Record<string, unknown>> {
  const filterShape = Object.entries(schema.shape).reduce(
    (acc, [key, value]) => {
      // Create filter operators based on the field type
      if (value instanceof z.ZodString) {
        acc[key] = z.union([
          value,
          z.object({
            equals: value.optional(),
            contains: z.string().optional(),
            startsWith: z.string().optional(),
            endsWith: z.string().optional(),
            in: z.array(z.string()).optional(),
            notIn: z.array(z.string()).optional(),
          }),
        ]).optional();
      } else if (value instanceof z.ZodNumber) {
        acc[key] = z.union([
          value,
          z.object({
            equals: value.optional(),
            gt: z.number().optional(),
            gte: z.number().optional(),
            lt: z.number().optional(),
            lte: z.number().optional(),
            in: z.array(z.number()).optional(),
            notIn: z.array(z.number()).optional(),
          }),
        ]).optional();
      } else if (value instanceof z.ZodBoolean) {
        acc[key] = z.union([value, z.object({ equals: value.optional() })]).optional();
      } else if (value instanceof z.ZodDate) {
        acc[key] = z.union([
          value,
          z.object({
            equals: z.date().optional(),
            gt: z.date().optional(),
            gte: z.date().optional(),
            lt: z.date().optional(),
            lte: z.date().optional(),
          }),
        ]).optional();
      } else {
        // For other types, just make them optional
        acc[key] = value.optional();
      }
      return acc;
    },
    {} as Record<string, z.ZodTypeAny>
  );
  
  return z.object(filterShape).strict().optional();
}

/**
 * Validates a database entity against its schema before saving
 * 
 * @param entityName - Name of the entity for error messages
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param journey - Journey context
 * @returns Validated data or throws an error
 * 
 * @example
 * const userSchema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 * });
 * 
 * const validatedUser = validateEntity('User', userSchema, userData, 'care');
 * await prisma.user.create({ data: validatedUser });
 */
export function validateEntity<T>(
  entityName: string,
  schema: z.ZodType<T>,
  data: unknown,
  journey?: JourneyType
): T {
  return validateWithZod(schema, data, {
    errorMessage: `Invalid ${entityName} data`,
    journey,
  });
}

/**
 * Combines multiple validation errors into a single error
 * 
 * @param errors - Array of validation errors
 * @param journey - Journey context
 * @returns Combined validation error
 * 
 * @example
 * try {
 *   // Some validation logic
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     errors.push(error);
 *   }
 * }
 * 
 * if (errors.length > 0) {
 *   throw combineValidationErrors(errors, 'health');
 * }
 */
export function combineValidationErrors(
  errors: ValidationError[],
  journey?: JourneyType
): ValidationError {
  if (errors.length === 0) {
    return new ValidationError({
      message: 'No validation errors',
      errors: [],
      journey,
    });
  }
  
  if (errors.length === 1) {
    return errors[0];
  }
  
  const combinedErrors: ValidationErrorDetail[] = errors.flatMap((error) => error.errors);
  
  return new ValidationError({
    message: 'Multiple validation errors occurred',
    errors: combinedErrors,
    journey,
  });
}

/**
 * Validates data against a schema and transforms it to another format
 * 
 * @param schema - Zod schema to validate against
 * @param transformer - Function to transform the validated data
 * @param data - Data to validate and transform
 * @param options - Validation options
 * @returns Transformed data or throws an error
 * 
 * @example
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 * 
 * const transformer = (user) => ({
 *   ...user,
 *   nameUpperCase: user.name.toUpperCase(),
 * });
 * 
 * const transformedUser = validateAndTransform(userSchema, transformer, userData);
 */
export function validateAndTransform<T, R>(
  schema: z.ZodType<T>,
  transformer: (data: T) => R,
  data: unknown,
  options: ValidationOptions = {}
): R {
  const validatedData = validateWithZod(schema, data, options);
  return transformer(validatedData);
}

/**
 * Cross-journey validation utilities
 */
export const CrossJourneyValidation = {
  /**
   * Validates data across multiple journeys
   * 
   * @param journeyValidations - Map of journey validations
   * @param data - Data to validate
   * @returns Validation results for each journey
   * 
   * @example
   * const results = CrossJourneyValidation.validateAcrossJourneys({
   *   [JourneyType.HEALTH]: {
   *     schema: HealthValidation.metric,
   *     entityType: 'metric',
   *   },
   *   [JourneyType.CARE]: {
   *     schema: CareValidation.appointment,
   *     entityType: 'appointment',
   *   },
   * }, sharedData);
   * 
   * // Check results for each journey
   * if (results[JourneyType.HEALTH].success) {
   *   // Use health validation result
   * }
   */
  validateAcrossJourneys<T extends Record<string, unknown>>(
    journeyValidations: Record<JourneyType, { schema: z.ZodType<any>; entityType: string }>,
    data: T
  ): Record<JourneyType, { success: boolean; data?: any; errors?: FormattedValidationError }> {
    const results: Record<JourneyType, { success: boolean; data?: any; errors?: FormattedValidationError }> = {} as any;
    
    for (const [journey, validation] of Object.entries(journeyValidations)) {
      const journeyType = journey as JourneyType;
      results[journeyType] = validateWithResult(
        validation.schema,
        data,
        { journey: journeyType, errorMessage: `Validation failed for ${validation.entityType} in ${journeyType} journey` }
      );
    }
    
    return results;
  },
  
  /**
   * Checks if data is valid for any journey
   * 
   * @param journeyValidations - Map of journey validations
   * @param data - Data to validate
   * @returns True if valid for any journey, false otherwise
   * 
   * @example
   * const isValid = CrossJourneyValidation.isValidForAnyJourney({
   *   [JourneyType.HEALTH]: HealthValidation.metric,
   *   [JourneyType.CARE]: CareValidation.appointment,
   * }, data);
   */
  isValidForAnyJourney<T extends Record<string, unknown>>(
    journeyValidations: Record<JourneyType, z.ZodType<any>>,
    data: T
  ): boolean {
    for (const [journey, schema] of Object.entries(journeyValidations)) {
      const result = validateWithResult(schema, data, { journey: journey as JourneyType, throwOnError: false });
      if (result.success) {
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Checks if data is valid for all journeys
   * 
   * @param journeyValidations - Map of journey validations
   * @param data - Data to validate
   * @returns True if valid for all journeys, false otherwise
   * 
   * @example
   * const isValid = CrossJourneyValidation.isValidForAllJourneys({
   *   [JourneyType.HEALTH]: HealthValidation.metric,
   *   [JourneyType.CARE]: CareValidation.appointment,
   * }, data);
   */
  isValidForAllJourneys<T extends Record<string, unknown>>(
    journeyValidations: Record<JourneyType, z.ZodType<any>>,
    data: T
  ): boolean {
    for (const [journey, schema] of Object.entries(journeyValidations)) {
      const result = validateWithResult(schema, data, { journey: journey as JourneyType, throwOnError: false });
      if (!result.success) {
        return false;
      }
    }
    
    return true;
  },
};