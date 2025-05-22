/**
 * @file validation.utils.ts
 * @description Provides comprehensive data validation utilities for database operations using Zod schemas.
 * Implements pre-validation for database inputs to ensure data integrity before database operations.
 * Includes journey-specific validation schemas for Health metrics, Care appointments, and Plan benefits
 * with domain-specific rules. Offers utilities for validation error formatting and aggregation with
 * detailed error messages for client responses. Also provides integration with class-validator for
 * compatibility with NestJS validation pipes.
 */

import { z } from 'zod';
import { ClassValidatorFields, ValidationError, validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { DatabaseErrorCodes } from '../errors/database-error.codes';
import { DatabaseException, IntegrityException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';
import { JourneyType } from '../types/journey.types';

/**
 * Interface for validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  path?: string[];
  value?: any;
}

/**
 * Interface for validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
}

/**
 * Options for validation
 */
export interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  context?: Record<string, any>;
  journeyType?: JourneyType;
}

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  abortEarly: false,
  stripUnknown: true,
  context: {},
};

/**
 * Validates data against a Zod schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @param options Validation options
 * @returns Validation result
 */
export function validateWithZod<T>(schema: z.ZodType<T>, data: unknown, options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS): ValidationResult<T> {
  try {
    const result = schema.safeParse(data, {
      abortEarly: options.abortEarly,
      context: options.context,
    });

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    const errors = formatZodErrors(result.error);
    return {
      success: false,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed due to an unexpected error',
        code: DatabaseErrorCodes.DB_VALIDATION_UNEXPECTED,
      }],
    };
  }
}

/**
 * Formats Zod errors into a standardized format
 * @param error Zod error
 * @returns Array of validation error details
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorDetail[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: getErrorCode(err.code),
    path: err.path,
    value: err.input,
  }));
}

/**
 * Gets error code for Zod error
 * @param zodErrorCode Zod error code
 * @returns Database error code
 */
function getErrorCode(zodErrorCode: z.ZodIssueCode): string {
  const codeMap: Record<z.ZodIssueCode, string> = {
    invalid_type: DatabaseErrorCodes.DB_VALIDATION_INVALID_TYPE,
    invalid_literal: DatabaseErrorCodes.DB_VALIDATION_INVALID_LITERAL,
    custom: DatabaseErrorCodes.DB_VALIDATION_CUSTOM,
    invalid_union: DatabaseErrorCodes.DB_VALIDATION_INVALID_UNION,
    invalid_union_discriminator: DatabaseErrorCodes.DB_VALIDATION_INVALID_UNION_DISCRIMINATOR,
    invalid_enum_value: DatabaseErrorCodes.DB_VALIDATION_INVALID_ENUM,
    unrecognized_keys: DatabaseErrorCodes.DB_VALIDATION_UNRECOGNIZED_KEYS,
    invalid_arguments: DatabaseErrorCodes.DB_VALIDATION_INVALID_ARGUMENTS,
    invalid_return_type: DatabaseErrorCodes.DB_VALIDATION_INVALID_RETURN_TYPE,
    invalid_date: DatabaseErrorCodes.DB_VALIDATION_INVALID_DATE,
    invalid_string: DatabaseErrorCodes.DB_VALIDATION_INVALID_STRING,
    too_small: DatabaseErrorCodes.DB_VALIDATION_TOO_SMALL,
    too_big: DatabaseErrorCodes.DB_VALIDATION_TOO_BIG,
    invalid_intersection_types: DatabaseErrorCodes.DB_VALIDATION_INVALID_INTERSECTION,
    not_multiple_of: DatabaseErrorCodes.DB_VALIDATION_NOT_MULTIPLE_OF,
    not_finite: DatabaseErrorCodes.DB_VALIDATION_NOT_FINITE,
  };

  return codeMap[zodErrorCode] || DatabaseErrorCodes.DB_VALIDATION_UNKNOWN;
}

/**
 * Validates data against a class-validator class
 * @param cls Class to validate against
 * @param data Data to validate
 * @param options Validation options
 * @returns Validation result
 */
export async function validateWithClassValidator<T extends object>(cls: new () => T, data: object, options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS): Promise<ValidationResult<T>> {
  try {
    const instance = plainToClass(cls, data, {
      excludeExtraneousValues: options.stripUnknown,
    });

    const errors = await validate(instance, {
      skipMissingProperties: false,
      forbidUnknownValues: !options.stripUnknown,
      stopAtFirstError: options.abortEarly,
    });

    if (errors.length === 0) {
      return {
        success: true,
        data: instance,
      };
    }

    const formattedErrors = formatClassValidatorErrors(errors);
    return {
      success: false,
      errors: formattedErrors,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed due to an unexpected error',
        code: DatabaseErrorCodes.DB_VALIDATION_UNEXPECTED,
      }],
    };
  }
}

/**
 * Formats class-validator errors into a standardized format
 * @param errors Class-validator errors
 * @returns Array of validation error details
 */
export function formatClassValidatorErrors(errors: ValidationError[]): ValidationErrorDetail[] {
  const result: ValidationErrorDetail[] = [];

  function processError(error: ValidationError, parentPath: string[] = []) {
    const path = [...parentPath, error.property];
    const field = path.join('.');

    if (error.constraints) {
      Object.entries(error.constraints).forEach(([key, message]) => {
        result.push({
          field,
          message,
          code: `DB_VALIDATION_${key.toUpperCase()}`,
          path,
          value: error.value,
        });
      });
    }

    if (error.children && error.children.length > 0) {
      error.children.forEach((child) => processError(child, path));
    }
  }

  errors.forEach((error) => processError(error));
  return result;
}

/**
 * Throws a DatabaseException if validation fails
 * @param result Validation result
 * @param entityName Name of the entity being validated
 * @param journeyType Type of journey
 * @throws DatabaseException
 */
export function throwIfValidationFails<T>(result: ValidationResult<T>, entityName: string, journeyType?: JourneyType): T {
  if (!result.success) {
    throw new IntegrityException(
      `Validation failed for ${entityName}`,
      DatabaseErrorType.DATA_INTEGRITY,
      {
        errors: result.errors,
        entityName,
        journeyType,
      },
    );
  }

  return result.data as T;
}

/**
 * Validates data before database operation
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @param entityName Name of the entity being validated
 * @param options Validation options
 * @returns Validated data
 * @throws DatabaseException if validation fails
 */
export function validateBeforeDbOperation<T>(
  schema: z.ZodType<T>,
  data: unknown,
  entityName: string,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
): T {
  const result = validateWithZod(schema, data, options);
  return throwIfValidationFails(result, entityName, options.journeyType);
}

// Journey-specific validation schemas

/**
 * Base schemas for common validation patterns
 */
export const BaseSchemas = {
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  nonEmptyString: z.string().min(1),
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().nonnegative(),
  futureDate: z.date().refine((date) => date > new Date(), {
    message: 'Date must be in the future',
  }),
  pastDate: z.date().refine((date) => date < new Date(), {
    message: 'Date must be in the past',
  }),
};

/**
 * Health journey validation schemas
 */
export const HealthValidationSchemas = {
  /**
   * Schema for health metrics
   */
  healthMetric: z.object({
    id: BaseSchemas.id.optional(),
    userId: BaseSchemas.userId,
    type: z.enum(['HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'WEIGHT', 'STEPS', 'SLEEP', 'OXYGEN_SATURATION']),
    value: z.number(),
    unit: z.string(),
    timestamp: z.date(),
    source: z.enum(['MANUAL', 'DEVICE', 'INTEGRATION']),
    deviceId: z.string().optional(),
    notes: z.string().optional(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }),

  /**
   * Schema for health goals
   */
  healthGoal: z.object({
    id: BaseSchemas.id.optional(),
    userId: BaseSchemas.userId,
    type: z.enum(['STEPS', 'WEIGHT', 'SLEEP', 'HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'ACTIVITY']),
    target: z.number(),
    unit: z.string(),
    period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    startDate: z.date(),
    endDate: z.date().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED']),
    progress: BaseSchemas.nonNegativeNumber,
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }).refine((data) => {
    if (data.endDate && data.startDate >= data.endDate) {
      return false;
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),

  /**
   * Schema for device connections
   */
  deviceConnection: z.object({
    id: BaseSchemas.id.optional(),
    userId: BaseSchemas.userId,
    deviceType: z.enum(['FITBIT', 'APPLE_HEALTH', 'GOOGLE_FIT', 'SAMSUNG_HEALTH', 'GARMIN', 'OMRON', 'OTHER']),
    deviceId: z.string(),
    connectionStatus: z.enum(['CONNECTED', 'DISCONNECTED', 'PENDING', 'FAILED']),
    lastSyncedAt: z.date().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    tokenExpiresAt: z.date().optional(),
    settings: z.record(z.any()).optional(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }),
};

/**
 * Care journey validation schemas
 */
export const CareValidationSchemas = {
  /**
   * Schema for appointments
   */
  appointment: z.object({
    id: BaseSchemas.id.optional(),
    userId: BaseSchemas.userId,
    providerId: BaseSchemas.id,
    type: z.enum(['IN_PERSON', 'VIDEO', 'PHONE']),
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
    scheduledAt: BaseSchemas.futureDate,
    duration: z.number().int().positive(),
    reason: BaseSchemas.nonEmptyString,
    notes: z.string().optional(),
    location: z.string().optional(),
    reminderSent: z.boolean().optional(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }),

  /**
   * Schema for providers
   */
  provider: z.object({
    id: BaseSchemas.id.optional(),
    name: BaseSchemas.nonEmptyString,
    specialty: z.string(),
    licenseNumber: z.string(),
    address: z.string(),
    phone: BaseSchemas.phone,
    email: BaseSchemas.email,
    availableForTelemedicine: z.boolean(),
    acceptingNewPatients: z.boolean(),
    languages: z.array(z.string()),
    education: z.array(z.string()).optional(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }),

  /**
   * Schema for medications
   */
  medication: z.object({
    id: BaseSchemas.id.optional(),
    userId: BaseSchemas.userId,
    name: BaseSchemas.nonEmptyString,
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.date(),
    endDate: z.date().optional(),
    instructions: z.string(),
    prescribedBy: z.string().optional(),
    active: z.boolean(),
    reminderEnabled: z.boolean(),
    reminderTimes: z.array(z.string()).optional(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }).refine((data) => {
    if (data.endDate && data.startDate >= data.endDate) {
      return false;
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
};

/**
 * Plan journey validation schemas
 */
export const PlanValidationSchemas = {
  /**
   * Schema for insurance plans
   */
  plan: z.object({
    id: BaseSchemas.id.optional(),
    userId: BaseSchemas.userId.optional(),
    name: BaseSchemas.nonEmptyString,
    description: z.string(),
    provider: z.string(),
    type: z.string(),
    premium: BaseSchemas.nonNegativeNumber,
    deductible: BaseSchemas.nonNegativeNumber,
    copay: BaseSchemas.nonNegativeNumber,
    coinsurance: z.number().min(0).max(100),
    outOfPocketMax: BaseSchemas.nonNegativeNumber,
    startDate: z.date(),
    endDate: z.date().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }).refine((data) => {
    if (data.endDate && data.startDate >= data.endDate) {
      return false;
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),

  /**
   * Schema for claims
   */
  claim: z.object({
    id: BaseSchemas.id.optional(),
    userId: BaseSchemas.userId,
    planId: BaseSchemas.id,
    serviceDate: z.date(),
    providerName: BaseSchemas.nonEmptyString,
    serviceDescription: BaseSchemas.nonEmptyString,
    claimAmount: BaseSchemas.positiveNumber,
    approvedAmount: BaseSchemas.nonNegativeNumber.optional(),
    status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'DENIED', 'CANCELLED']),
    submittedAt: z.date(),
    processedAt: z.date().optional(),
    notes: z.string().optional(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }),

  /**
   * Schema for benefits
   */
  benefit: z.object({
    id: BaseSchemas.id.optional(),
    planId: BaseSchemas.id,
    name: BaseSchemas.nonEmptyString,
    description: z.string(),
    type: z.string(),
    coverage: z.number().min(0).max(100),
    limit: z.number().optional(),
    limitPeriod: z.enum(['PER_VISIT', 'ANNUAL', 'LIFETIME']).optional(),
    requirements: z.string().optional(),
    active: z.boolean(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }),
};

/**
 * Gamification validation schemas
 */
export const GamificationValidationSchemas = {
  /**
   * Schema for gamification events
   */
  event: z.object({
    id: BaseSchemas.id.optional(),
    userId: BaseSchemas.userId,
    type: z.string(),
    journeyType: z.enum(['HEALTH', 'CARE', 'PLAN']),
    payload: z.record(z.any()),
    timestamp: z.date(),
    processed: z.boolean().optional(),
    processedAt: z.date().optional(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }),

  /**
   * Schema for achievements
   */
  achievement: z.object({
    id: BaseSchemas.id.optional(),
    name: BaseSchemas.nonEmptyString,
    description: z.string(),
    journeyType: z.enum(['HEALTH', 'CARE', 'PLAN', 'CROSS_JOURNEY']),
    type: z.string(),
    points: z.number().int().nonnegative(),
    criteria: z.record(z.any()),
    icon: z.string().optional(),
    active: z.boolean(),
    createdAt: BaseSchemas.createdAt.optional(),
    updatedAt: BaseSchemas.updatedAt.optional(),
  }),
};

/**
 * Gets journey-specific validation schema
 * @param journeyType Type of journey
 * @param entityName Name of the entity
 * @returns Zod schema for the entity
 * @throws Error if schema not found
 */
export function getJourneyValidationSchema(journeyType: JourneyType, entityName: string): z.ZodType<any> {
  const schemaMap: Record<JourneyType, Record<string, z.ZodType<any>>> = {
    HEALTH: HealthValidationSchemas,
    CARE: CareValidationSchemas,
    PLAN: PlanValidationSchemas,
    GAMIFICATION: GamificationValidationSchemas,
  };

  const journeySchemas = schemaMap[journeyType];
  if (!journeySchemas) {
    throw new Error(`No validation schemas found for journey type: ${journeyType}`);
  }

  const schema = journeySchemas[entityName];
  if (!schema) {
    throw new Error(`No validation schema found for entity: ${entityName} in journey: ${journeyType}`);
  }

  return schema;
}

/**
 * Validates data for a specific journey entity
 * @param journeyType Type of journey
 * @param entityName Name of the entity
 * @param data Data to validate
 * @param options Validation options
 * @returns Validated data
 * @throws DatabaseException if validation fails
 */
export function validateJourneyEntity<T>(
  journeyType: JourneyType,
  entityName: string,
  data: unknown,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
): T {
  const schema = getJourneyValidationSchema(journeyType, entityName);
  return validateBeforeDbOperation(
    schema,
    data,
    entityName,
    { ...options, journeyType },
  );
}

/**
 * Creates a partial validation schema for updates
 * @param schema Original Zod schema
 * @returns Partial schema where all fields are optional
 */
export function createPartialSchema<T>(schema: z.ZodType<T>): z.ZodType<Partial<T>> {
  if (schema instanceof z.ZodObject) {
    return schema.partial();
  }
  throw new Error('Cannot create partial schema for non-object schema');
}

/**
 * Validates partial data for updates
 * @param schema Original Zod schema
 * @param data Partial data to validate
 * @param entityName Name of the entity being validated
 * @param options Validation options
 * @returns Validated partial data
 * @throws DatabaseException if validation fails
 */
export function validatePartialUpdate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  entityName: string,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
): Partial<T> {
  const partialSchema = createPartialSchema(schema);
  const result = validateWithZod(partialSchema, data, options);
  return throwIfValidationFails(result, entityName, options.journeyType);
}

/**
 * Validates partial data for a specific journey entity update
 * @param journeyType Type of journey
 * @param entityName Name of the entity
 * @param data Partial data to validate
 * @param options Validation options
 * @returns Validated partial data
 * @throws DatabaseException if validation fails
 */
export function validateJourneyEntityUpdate<T>(
  journeyType: JourneyType,
  entityName: string,
  data: unknown,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
): Partial<T> {
  const schema = getJourneyValidationSchema(journeyType, entityName);
  return validatePartialUpdate(
    schema,
    data,
    entityName,
    { ...options, journeyType },
  );
}

/**
 * Validates an array of items against a schema
 * @param schema Zod schema to validate against
 * @param items Array of items to validate
 * @param entityName Name of the entity being validated
 * @param options Validation options
 * @returns Array of validated items
 * @throws DatabaseException if validation fails for any item
 */
export function validateArray<T>(
  schema: z.ZodType<T>,
  items: unknown[],
  entityName: string,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
): T[] {
  const arraySchema = z.array(schema);
  return validateBeforeDbOperation(
    arraySchema,
    items,
    entityName,
    options,
  );
}

/**
 * Validates an array of items for a specific journey entity
 * @param journeyType Type of journey
 * @param entityName Name of the entity
 * @param items Array of items to validate
 * @param options Validation options
 * @returns Array of validated items
 * @throws DatabaseException if validation fails for any item
 */
export function validateJourneyEntityArray<T>(
  journeyType: JourneyType,
  entityName: string,
  items: unknown[],
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
): T[] {
  const schema = getJourneyValidationSchema(journeyType, entityName);
  return validateArray(
    schema,
    items,
    entityName,
    { ...options, journeyType },
  );
}