/**
 * @file event-validator.ts
 * @description Provides validation utilities for event payloads against defined schemas using Zod.
 * This module ensures that all events conform to their expected structure before processing,
 * preventing invalid data from propagating through the system.
 */

import { z } from 'zod';
import { EventVersion } from '../versioning/types';
import schemaUtils, { SchemaRegistryEntry, SchemaRetrievalOptions } from './schema-utils';

/**
 * Interface for validation result
 */
export interface ValidationResult<T = any> {
  /** Whether the validation was successful */
  success: boolean;
  /** The validated data (only present if validation was successful) */
  data?: T;
  /** Validation errors (only present if validation failed) */
  errors?: ValidationError[];
  /** The schema used for validation */
  schema?: SchemaRegistryEntry;
  /** The event type that was validated */
  eventType: string;
  /** The schema version that was used for validation */
  schemaVersion?: EventVersion;
}

/**
 * Interface for validation error
 */
export interface ValidationError {
  /** The path to the field that failed validation */
  path: string[];
  /** The error message */
  message: string;
  /** The error code */
  code?: string;
  /** Additional context for the error */
  context?: Record<string, any>;
}

/**
 * Interface for validation options
 */
export interface ValidationOptions extends SchemaRetrievalOptions {
  /** Whether to return the data even if validation fails */
  returnDataOnError?: boolean;
  /** Whether to include the schema in the validation result */
  includeSchema?: boolean;
  /** Whether to format error messages for human readability */
  formatErrors?: boolean;
  /** Journey context for journey-specific validation */
  journeyContext?: 'health' | 'care' | 'plan';
  /** Whether to strip additional properties not defined in the schema */
  stripUnknown?: boolean;
  /** Custom error formatter function */
  errorFormatter?: (error: z.ZodError) => ValidationError[];
}

/**
 * Interface for journey-specific validation context
 */
export interface JourneyValidationContext {
  /** The journey identifier */
  journey: 'health' | 'care' | 'plan';
  /** Additional context specific to the journey */
  context?: Record<string, any>;
}

/**
 * Cache for validation schemas to improve performance
 */
class ValidationCache {
  private cache: Map<string, Map<string, SchemaRegistryEntry>> = new Map();
  private maxSize: number;
  private ttl: number;
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Create a new validation cache
   * @param maxSize Maximum number of event types to cache
   * @param ttl Time-to-live for cache entries in milliseconds
   */
  constructor(maxSize: number = 100, ttl: number = 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get a schema from the cache
   * @param type Event type
   * @param version Schema version
   * @returns The cached schema or undefined if not found
   */
  get(type: string, version: string): SchemaRegistryEntry | undefined {
    const typeCache = this.cache.get(type);
    if (!typeCache) {
      this.misses++;
      return undefined;
    }

    const entry = typeCache.get(version);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    this.hits++;
    return entry;
  }

  /**
   * Set a schema in the cache
   * @param type Event type
   * @param version Schema version
   * @param schema Schema to cache
   */
  set(type: string, version: string, schema: SchemaRegistryEntry): void {
    // Ensure we don't exceed max size by removing oldest entries if needed
    if (this.cache.size >= this.maxSize && !this.cache.has(type)) {
      const oldestType = this.cache.keys().next().value;
      this.cache.delete(oldestType);
    }

    // Get or create the type cache
    let typeCache = this.cache.get(type);
    if (!typeCache) {
      typeCache = new Map();
      this.cache.set(type, typeCache);
    }

    // Set the schema
    typeCache.set(version, {
      ...schema,
      // Add expiration timestamp
      metadata: {
        ...schema.metadata,
        cacheExpires: Date.now() + this.ttl
      }
    });
  }

  /**
   * Clear expired entries from the cache
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [type, typeCache] of this.cache.entries()) {
      for (const [version, schema] of typeCache.entries()) {
        const expires = schema.metadata?.cacheExpires;
        if (expires && expires < now) {
          typeCache.delete(version);
        }
      }

      if (typeCache.size === 0) {
        this.cache.delete(type);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): { size: number; hits: number; misses: number; hitRatio: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? this.hits / total : 0
    };
  }
}

// Create a singleton validation cache
const validationCache = new ValidationCache();

/**
 * Format a Zod error into a ValidationError array
 * @param error Zod error
 * @param formatForHumans Whether to format errors for human readability
 * @returns Array of validation errors
 */
export function formatZodError(error: z.ZodError, formatForHumans: boolean = true): ValidationError[] {
  return error.errors.map(err => {
    const path = err.path;
    let message = err.message;

    // Format error message for human readability if requested
    if (formatForHumans) {
      const fieldName = path.length > 0 ? path[path.length - 1] : 'value';
      
      // Make the message more user-friendly
      if (err.code === 'invalid_type') {
        if (err.expected === 'string' && err.received === 'undefined') {
          message = `${fieldName} is required`;
        } else {
          message = `${fieldName} should be a ${err.expected}, but received ${err.received}`;
        }
      } else if (err.code === 'too_small') {
        if (err.type === 'string') {
          message = `${fieldName} should be at least ${err.minimum} characters`;
        } else if (err.type === 'number') {
          message = `${fieldName} should be at least ${err.minimum}`;
        } else if (err.type === 'array') {
          message = `${fieldName} should have at least ${err.minimum} items`;
        }
      } else if (err.code === 'too_big') {
        if (err.type === 'string') {
          message = `${fieldName} should be at most ${err.maximum} characters`;
        } else if (err.type === 'number') {
          message = `${fieldName} should be at most ${err.maximum}`;
        } else if (err.type === 'array') {
          message = `${fieldName} should have at most ${err.maximum} items`;
        }
      }
    }

    return {
      path,
      message,
      code: err.code,
      context: err.message !== message ? { originalMessage: err.message } : undefined
    };
  });
}

/**
 * Validate an event against its schema
 * @param event Event to validate
 * @param type Event type (if not provided, extracted from event)
 * @param version Schema version (if not provided, uses latest)
 * @param options Validation options
 * @returns Validation result
 */
export function validateEvent<T = any>(
  event: any,
  type?: string,
  version?: EventVersion | 'latest',
  options: ValidationOptions = {}
): ValidationResult<T> {
  const {
    returnDataOnError = false,
    includeSchema = false,
    formatErrors = true,
    findCompatible = true,
    throwIfNotFound = false,
    journeyContext,
    stripUnknown = false,
    errorFormatter = (err) => formatZodError(err, formatErrors)
  } = options;

  // Extract type from event if not provided
  const eventType = type || event?.type;
  if (!eventType) {
    return {
      success: false,
      errors: [{
        path: ['type'],
        message: 'Event type is required for validation',
        code: 'missing_type'
      }],
      eventType: 'unknown'
    };
  }

  // Check cache first
  const versionKey = version ? 
    (version === 'latest' ? 'latest' : `${version.major}.${version.minor}.${version.patch}`) : 
    'latest';
  const cachedSchema = validationCache.get(eventType, versionKey);

  // Get the schema (from cache or registry)
  let schema: SchemaRegistryEntry | undefined;
  if (cachedSchema) {
    schema = cachedSchema;
  } else {
    try {
      schema = schemaUtils.getSchema(eventType, version, { findCompatible, throwIfNotFound });
      if (schema) {
        // Cache the schema for future use
        validationCache.set(eventType, versionKey, schema);
      }
    } catch (error) {
      return {
        success: false,
        errors: [{
          path: [],
          message: `Schema for type '${eventType}' not found`,
          code: 'schema_not_found',
          context: { error: error instanceof Error ? error.message : String(error) }
        }],
        eventType
      };
    }
  }

  if (!schema) {
    return {
      success: false,
      errors: [{
        path: [],
        message: `Schema for type '${eventType}' not found`,
        code: 'schema_not_found'
      }],
      eventType
    };
  }

  // Apply journey-specific validation if context is provided
  let validationSchema = schema.schema;
  if (journeyContext) {
    validationSchema = applyJourneyValidation(validationSchema, journeyContext);
  }

  // Configure schema for stripUnknown if needed
  if (stripUnknown && validationSchema instanceof z.ZodObject) {
    validationSchema = validationSchema.strip();
  }

  // Validate the event
  try {
    const validatedData = validationSchema.parse(event) as T;
    return {
      success: true,
      data: validatedData,
      eventType,
      schemaVersion: schema.version,
      ...(includeSchema ? { schema } : {})
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        ...(returnDataOnError ? { data: event as T } : {}),
        errors: errorFormatter(error),
        eventType,
        schemaVersion: schema.version,
        ...(includeSchema ? { schema } : {})
      };
    }

    // Handle unexpected errors
    return {
      success: false,
      errors: [{
        path: [],
        message: `Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'validation_error',
        context: { error: error instanceof Error ? error.stack : String(error) }
      }],
      eventType,
      schemaVersion: schema.version
    };
  }
}

/**
 * Apply journey-specific validation to a schema
 * @param schema Base schema
 * @param journey Journey identifier or context
 * @returns Enhanced schema with journey-specific validation
 */
export function applyJourneyValidation<T>(schema: z.ZodType<T>, journey: string | JourneyValidationContext): z.ZodType<T> {
  const journeyId = typeof journey === 'string' ? journey : journey.journey;
  const context = typeof journey === 'string' ? {} : journey.context || {};

  // Apply journey-specific validation based on journey type
  switch (journeyId) {
    case 'health':
      return applyHealthJourneyValidation(schema, context);
    case 'care':
      return applyCareJourneyValidation(schema, context);
    case 'plan':
      return applyPlanJourneyValidation(schema, context);
    default:
      return schema;
  }
}

/**
 * Apply health journey-specific validation to a schema
 * @param schema Base schema
 * @param context Additional context
 * @returns Enhanced schema with health journey-specific validation
 */
function applyHealthJourneyValidation<T>(schema: z.ZodType<T>, context: Record<string, any> = {}): z.ZodType<T> {
  // If schema is an object, we can enhance it with health-specific validation
  if (schema instanceof z.ZodObject) {
    // Create a refined schema with health-specific validation
    return schema.superRefine((data, ctx) => {
      // Validate health metrics if present
      if ('data' in data && typeof data.data === 'object' && data.data !== null) {
        const healthData = data.data as Record<string, any>;

        // Validate metric values based on type
        if ('metricType' in healthData && 'value' in healthData) {
          const { metricType, value } = healthData;
          
          // Validate specific metric types
          switch (metricType) {
            case 'WEIGHT':
              if (typeof value === 'number' && (value < 1 || value > 500)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Weight value ${value} is outside physiologically plausible range (1-500 kg)`,
                  path: ['data', 'value']
                });
              }
              break;
            case 'HEART_RATE':
              if (typeof value === 'number' && (value < 30 || value > 250)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Heart rate value ${value} is outside physiologically plausible range (30-250 bpm)`,
                  path: ['data', 'value']
                });
              }
              break;
            case 'BLOOD_PRESSURE':
              if (
                'systolic' in healthData && 
                'diastolic' in healthData && 
                typeof healthData.systolic === 'number' && 
                typeof healthData.diastolic === 'number'
              ) {
                const { systolic, diastolic } = healthData;
                if (systolic < 60 || systolic > 250) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Systolic blood pressure ${systolic} is outside physiologically plausible range (60-250 mmHg)`,
                    path: ['data', 'systolic']
                  });
                }
                if (diastolic < 30 || diastolic > 150) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Diastolic blood pressure ${diastolic} is outside physiologically plausible range (30-150 mmHg)`,
                    path: ['data', 'diastolic']
                  });
                }
                if (diastolic >= systolic) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Diastolic pressure (${diastolic}) should be lower than systolic pressure (${systolic})`,
                    path: ['data']
                  });
                }
              }
              break;
            case 'BLOOD_GLUCOSE':
              if (typeof value === 'number' && (value < 20 || value > 600)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Blood glucose value ${value} is outside physiologically plausible range (20-600 mg/dL)`,
                  path: ['data', 'value']
                });
              }
              break;
            case 'STEPS':
              if (typeof value === 'number' && (value < 0 || value > 100000)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Steps value ${value} is outside plausible range (0-100,000 steps)`,
                  path: ['data', 'value']
                });
              }
              break;
            case 'SLEEP_DURATION':
              if (typeof value === 'number' && (value < 0 || value > 24)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Sleep duration ${value} is outside plausible range (0-24 hours)`,
                  path: ['data', 'value']
                });
              }
              break;
          }
        }

        // Validate health goals if present
        if ('goalType' in healthData && 'targetValue' in healthData) {
          const { goalType, targetValue } = healthData;
          
          // Validate specific goal types
          switch (goalType) {
            case 'WEIGHT_LOSS':
            case 'WEIGHT_GAIN':
              if (typeof targetValue === 'number' && (targetValue < 1 || targetValue > 500)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Weight goal target ${targetValue} is outside physiologically plausible range (1-500 kg)`,
                  path: ['data', 'targetValue']
                });
              }
              break;
            case 'STEPS':
              if (typeof targetValue === 'number' && (targetValue < 100 || targetValue > 100000)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Steps goal target ${targetValue} is outside plausible range (100-100,000 steps)`,
                  path: ['data', 'targetValue']
                });
              }
              break;
            case 'SLEEP':
              if (typeof targetValue === 'number' && (targetValue < 1 || targetValue > 24)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Sleep goal target ${targetValue} is outside plausible range (1-24 hours)`,
                  path: ['data', 'targetValue']
                });
              }
              break;
          }
        }
      }
    }) as z.ZodType<T>;
  }
  
  return schema;
}

/**
 * Apply care journey-specific validation to a schema
 * @param schema Base schema
 * @param context Additional context
 * @returns Enhanced schema with care journey-specific validation
 */
function applyCareJourneyValidation<T>(schema: z.ZodType<T>, context: Record<string, any> = {}): z.ZodType<T> {
  // If schema is an object, we can enhance it with care-specific validation
  if (schema instanceof z.ZodObject) {
    // Create a refined schema with care-specific validation
    return schema.superRefine((data, ctx) => {
      // Validate care data if present
      if ('data' in data && typeof data.data === 'object' && data.data !== null) {
        const careData = data.data as Record<string, any>;

        // Validate appointment data if present
        if ('appointmentDate' in careData) {
          const appointmentDate = new Date(careData.appointmentDate);
          const now = new Date();
          
          // Appointment can't be in the past
          if (appointmentDate < now && careData.eventType !== 'APPOINTMENT_COMPLETED') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Appointment date cannot be in the past',
              path: ['data', 'appointmentDate']
            });
          }
          
          // Appointment can't be too far in the future (1 year max)
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          if (appointmentDate > oneYearFromNow) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Appointment date cannot be more than 1 year in the future',
              path: ['data', 'appointmentDate']
            });
          }
        }

        // Validate medication data if present
        if ('medicationName' in careData && 'dosage' in careData) {
          // Validate dosage format (e.g., "10mg", "5ml")
          if (typeof careData.dosage === 'string' && !/^\d+(\.\d+)?\s*(mg|ml|g|mcg|IU)$/i.test(careData.dosage)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Dosage must be in format "[number][unit]" (e.g., "10mg", "5ml")',
              path: ['data', 'dosage']
            });
          }
          
          // Validate medication name length
          if (typeof careData.medicationName === 'string' && careData.medicationName.length < 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Medication name must be at least 2 characters',
              path: ['data', 'medicationName']
            });
          }
        }

        // Validate telemedicine session data if present
        if ('sessionDuration' in careData) {
          // Session duration should be reasonable (1-180 minutes)
          if (typeof careData.sessionDuration === 'number' && (careData.sessionDuration < 1 || careData.sessionDuration > 180)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Session duration ${careData.sessionDuration} is outside reasonable range (1-180 minutes)`,
              path: ['data', 'sessionDuration']
            });
          }
        }
      }
    }) as z.ZodType<T>;
  }
  
  return schema;
}

/**
 * Apply plan journey-specific validation to a schema
 * @param schema Base schema
 * @param context Additional context
 * @returns Enhanced schema with plan journey-specific validation
 */
function applyPlanJourneyValidation<T>(schema: z.ZodType<T>, context: Record<string, any> = {}): z.ZodType<T> {
  // If schema is an object, we can enhance it with plan-specific validation
  if (schema instanceof z.ZodObject) {
    // Create a refined schema with plan-specific validation
    return schema.superRefine((data, ctx) => {
      // Validate plan data if present
      if ('data' in data && typeof data.data === 'object' && data.data !== null) {
        const planData = data.data as Record<string, any>;

        // Validate claim data if present
        if ('claimAmount' in planData) {
          // Claim amount should be positive
          if (typeof planData.claimAmount === 'number' && planData.claimAmount <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Claim amount must be greater than 0',
              path: ['data', 'claimAmount']
            });
          }
          
          // Claim amount should be reasonable (max 1,000,000)
          if (typeof planData.claimAmount === 'number' && planData.claimAmount > 1000000) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Claim amount exceeds maximum allowed (1,000,000)',
              path: ['data', 'claimAmount']
            });
          }
          
          // Validate claim currency if present
          if ('currency' in planData && typeof planData.currency === 'string') {
            // Check if currency is valid (3-letter ISO code)
            if (!/^[A-Z]{3}$/.test(planData.currency)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Currency must be a valid 3-letter ISO code (e.g., USD, BRL)',
                path: ['data', 'currency']
              });
            }
          }
        }

        // Validate benefit data if present
        if ('benefitType' in planData && 'benefitId' in planData) {
          // Validate benefit ID format (UUID)
          if (
            typeof planData.benefitId === 'string' && 
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planData.benefitId)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Benefit ID must be a valid UUID',
              path: ['data', 'benefitId']
            });
          }
          
          // Validate benefit type
          if (
            typeof planData.benefitType === 'string' && 
            !['MEDICAL', 'DENTAL', 'VISION', 'PHARMACY', 'WELLNESS', 'OTHER'].includes(planData.benefitType)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Benefit type must be one of: MEDICAL, DENTAL, VISION, PHARMACY, WELLNESS, OTHER',
              path: ['data', 'benefitType']
            });
          }
        }
      }
    }) as z.ZodType<T>;
  }
  
  return schema;
}

/**
 * Validate an event against a specific journey's requirements
 * @param event Event to validate
 * @param journey Journey identifier
 * @param options Validation options
 * @returns Validation result
 */
export function validateJourneyEvent<T = any>(
  event: any,
  journey: 'health' | 'care' | 'plan',
  options: ValidationOptions = {}
): ValidationResult<T> {
  return validateEvent<T>(event, event?.type, options?.schemaVersion || 'latest', {
    ...options,
    journeyContext: journey
  });
}

/**
 * Validate a health journey event
 * @param event Event to validate
 * @param options Validation options
 * @returns Validation result
 */
export function validateHealthEvent<T = any>(
  event: any,
  options: ValidationOptions = {}
): ValidationResult<T> {
  return validateJourneyEvent<T>(event, 'health', options);
}

/**
 * Validate a care journey event
 * @param event Event to validate
 * @param options Validation options
 * @returns Validation result
 */
export function validateCareEvent<T = any>(
  event: any,
  options: ValidationOptions = {}
): ValidationResult<T> {
  return validateJourneyEvent<T>(event, 'care', options);
}

/**
 * Validate a plan journey event
 * @param event Event to validate
 * @param options Validation options
 * @returns Validation result
 */
export function validatePlanEvent<T = any>(
  event: any,
  options: ValidationOptions = {}
): ValidationResult<T> {
  return validateJourneyEvent<T>(event, 'plan', options);
}

/**
 * Create a validator function for a specific event type
 * @param eventType Event type to validate
 * @param version Schema version to use (defaults to latest)
 * @param options Default validation options
 * @returns Validator function for the specified event type
 */
export function createEventValidator<T = any>(
  eventType: string,
  version: EventVersion | 'latest' = 'latest',
  options: ValidationOptions = {}
): (event: any, overrideOptions?: ValidationOptions) => ValidationResult<T> {
  return (event: any, overrideOptions?: ValidationOptions) => {
    return validateEvent<T>(event, eventType, version, {
      ...options,
      ...overrideOptions
    });
  };
}

/**
 * Create a validator function for a specific journey
 * @param journey Journey to validate
 * @param options Default validation options
 * @returns Validator function for the specified journey
 */
export function createJourneyValidator<T = any>(
  journey: 'health' | 'care' | 'plan',
  options: ValidationOptions = {}
): (event: any, overrideOptions?: ValidationOptions) => ValidationResult<T> {
  return (event: any, overrideOptions?: ValidationOptions) => {
    return validateJourneyEvent<T>(event, journey, {
      ...options,
      ...overrideOptions
    });
  };
}

/**
 * Validate multiple events in batch
 * @param events Array of events to validate
 * @param options Validation options
 * @returns Array of validation results
 */
export function validateEventBatch<T = any>(
  events: any[],
  options: ValidationOptions = {}
): ValidationResult<T>[] {
  return events.map(event => validateEvent<T>(event, event?.type, options?.schemaVersion || 'latest', options));
}

/**
 * Check if an event is valid without throwing an error
 * @param event Event to validate
 * @param type Event type (if not provided, extracted from event)
 * @param version Schema version (if not provided, uses latest)
 * @param options Validation options
 * @returns True if the event is valid, false otherwise
 */
export function isValidEvent(
  event: any,
  type?: string,
  version?: EventVersion | 'latest',
  options: ValidationOptions = {}
): boolean {
  const result = validateEvent(event, type, version, options);
  return result.success;
}

/**
 * Get validation errors for an event
 * @param event Event to validate
 * @param type Event type (if not provided, extracted from event)
 * @param version Schema version (if not provided, uses latest)
 * @param options Validation options
 * @returns Array of validation errors or undefined if valid
 */
export function getValidationErrors(
  event: any,
  type?: string,
  version?: EventVersion | 'latest',
  options: ValidationOptions = {}
): ValidationError[] | undefined {
  const result = validateEvent(event, type, version, options);
  return result.success ? undefined : result.errors;
}

/**
 * Format validation errors as a human-readable string
 * @param errors Validation errors
 * @returns Human-readable error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (!errors || errors.length === 0) {
    return 'No validation errors';
  }

  return errors.map(err => {
    const path = err.path.length > 0 ? err.path.join('.') : 'value';
    return `${path}: ${err.message}`;
  }).join('\n');
}

/**
 * Clear the validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear();
}

/**
 * Get validation cache statistics
 * @returns Cache statistics
 */
export function getValidationCacheStats(): { size: number; hits: number; misses: number; hitRatio: number } {
  return validationCache.getStats();
}

/**
 * Export all validation utilities
 */
export default {
  validateEvent,
  validateJourneyEvent,
  validateHealthEvent,
  validateCareEvent,
  validatePlanEvent,
  createEventValidator,
  createJourneyValidator,
  validateEventBatch,
  isValidEvent,
  getValidationErrors,
  formatValidationErrors,
  formatZodError,
  clearValidationCache,
  getValidationCacheStats,
  applyJourneyValidation
};