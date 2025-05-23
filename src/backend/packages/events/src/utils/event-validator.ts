/**
 * @file event-validator.ts
 * @description Provides validation utilities for event payloads against defined schemas using Zod.
 * This module ensures that all events conform to their expected structure before processing,
 * preventing invalid data from propagating through the system.
 */

import { z } from 'zod';
import { EventTypes } from '../dto/event-types.enum';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IEventValidator, ValidationResult } from '../interfaces/event-validation.interface';
import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import { detectVersion } from '../versioning/version-detector';
import { transformEvent } from '../versioning/transformer';

/**
 * Cache for storing compiled Zod schemas to improve performance
 * by avoiding schema recreation on every validation.
 */
const schemaCache = new Map<string, z.ZodType<any>>();

/**
 * Options for event validation
 */
export interface EventValidationOptions {
  /**
   * Whether to throw an error on validation failure (default: false)
   */
  throwOnError?: boolean;
  
  /**
   * Whether to attempt schema version transformation if validation fails (default: true)
   */
  attemptVersionTransformation?: boolean;
  
  /**
   * Custom error message prefix
   */
  errorMessagePrefix?: string;
  
  /**
   * Journey context for journey-specific validation
   */
  journeyContext?: 'health' | 'care' | 'plan' | string;
}

/**
 * Default validation options
 */
const defaultValidationOptions: EventValidationOptions = {
  throwOnError: false,
  attemptVersionTransformation: true,
  errorMessagePrefix: 'Event validation failed:',
  journeyContext: undefined
};

/**
 * Validates an event against its schema
 * 
 * @param event The event to validate
 * @param options Validation options
 * @returns Validation result with success status and data or error
 */
export function validateEvent<T extends IBaseEvent>(
  event: unknown,
  options: EventValidationOptions = {}
): ValidationResult<T> {
  const opts = { ...defaultValidationOptions, ...options };
  
  try {
    // Basic structure validation first
    const baseSchema = getBaseEventSchema();
    const baseResult = baseSchema.safeParse(event);
    
    if (!baseResult.success) {
      return createErrorResult(
        baseResult.error,
        `${opts.errorMessagePrefix} Invalid event structure`,
        opts.throwOnError
      );
    }
    
    const validatedBase = baseResult.data as IBaseEvent;
    const eventType = validatedBase.type;
    
    // Get the appropriate schema for this event type
    const schema = getSchemaForEventType(eventType, opts.journeyContext);
    
    if (!schema) {
      return createErrorResult(
        new Error(`No schema found for event type: ${eventType}`),
        `${opts.errorMessagePrefix} Unknown event type: ${eventType}`,
        opts.throwOnError
      );
    }
    
    // Validate against the full schema
    const result = schema.safeParse(event);
    
    if (result.success) {
      return {
        success: true,
        data: result.data as T
      };
    }
    
    // If validation failed and version transformation is enabled, try to transform
    if (opts.attemptVersionTransformation && isVersionedEvent(event as any)) {
      const transformedEvent = attemptVersionTransformation(event as IVersionedEvent, eventType);
      if (transformedEvent) {
        const transformResult = schema.safeParse(transformedEvent);
        if (transformResult.success) {
          return {
            success: true,
            data: transformResult.data as T,
            transformed: true
          };
        }
      }
    }
    
    // If we got here, validation failed
    return createErrorResult(
      result.error,
      `${opts.errorMessagePrefix} Event validation failed for type: ${eventType}`,
      opts.throwOnError
    );
  } catch (error) {
    return createErrorResult(
      error instanceof Error ? error : new Error(String(error)),
      `${opts.errorMessagePrefix} Unexpected validation error`,
      opts.throwOnError
    );
  }
}

/**
 * Validates an event payload against a specific schema
 * 
 * @param payload The payload to validate
 * @param schema The Zod schema to validate against
 * @param options Validation options
 * @returns Validation result with success status and data or error
 */
export function validatePayload<T>(
  payload: unknown,
  schema: z.ZodType<T>,
  options: EventValidationOptions = {}
): ValidationResult<T> {
  const opts = { ...defaultValidationOptions, ...options };
  
  try {
    const result = schema.safeParse(payload);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    }
    
    return createErrorResult(
      result.error,
      `${opts.errorMessagePrefix} Payload validation failed`,
      opts.throwOnError
    );
  } catch (error) {
    return createErrorResult(
      error instanceof Error ? error : new Error(String(error)),
      `${opts.errorMessagePrefix} Unexpected payload validation error`,
      opts.throwOnError
    );
  }
}

/**
 * Validates an event by its type
 * 
 * @param event The event to validate
 * @param eventType The expected event type
 * @param options Validation options
 * @returns Validation result with success status and data or error
 */
export function validateEventByType<T extends IBaseEvent>(
  event: unknown,
  eventType: string,
  options: EventValidationOptions = {}
): ValidationResult<T> {
  const opts = { ...defaultValidationOptions, ...options };
  
  try {
    // Basic structure validation first
    const baseSchema = getBaseEventSchema();
    const baseResult = baseSchema.safeParse(event);
    
    if (!baseResult.success) {
      return createErrorResult(
        baseResult.error,
        `${opts.errorMessagePrefix} Invalid event structure`,
        opts.throwOnError
      );
    }
    
    const validatedBase = baseResult.data as IBaseEvent;
    
    // Check if the event type matches the expected type
    if (validatedBase.type !== eventType) {
      return createErrorResult(
        new Error(`Event type mismatch: expected ${eventType}, got ${validatedBase.type}`),
        `${opts.errorMessagePrefix} Event type mismatch: expected ${eventType}, got ${validatedBase.type}`,
        opts.throwOnError
      );
    }
    
    // Get the appropriate schema for this event type
    const schema = getSchemaForEventType(eventType, opts.journeyContext);
    
    if (!schema) {
      return createErrorResult(
        new Error(`No schema found for event type: ${eventType}`),
        `${opts.errorMessagePrefix} Unknown event type: ${eventType}`,
        opts.throwOnError
      );
    }
    
    // Validate against the full schema
    const result = schema.safeParse(event);
    
    if (result.success) {
      return {
        success: true,
        data: result.data as T
      };
    }
    
    // If validation failed and version transformation is enabled, try to transform
    if (opts.attemptVersionTransformation && isVersionedEvent(event as any)) {
      const transformedEvent = attemptVersionTransformation(event as IVersionedEvent, eventType);
      if (transformedEvent) {
        const transformResult = schema.safeParse(transformedEvent);
        if (transformResult.success) {
          return {
            success: true,
            data: transformResult.data as T,
            transformed: true
          };
        }
      }
    }
    
    // If we got here, validation failed
    return createErrorResult(
      result.error,
      `${opts.errorMessagePrefix} Event validation failed for type: ${eventType}`,
      opts.throwOnError
    );
  } catch (error) {
    return createErrorResult(
      error instanceof Error ? error : new Error(String(error)),
      `${opts.errorMessagePrefix} Unexpected validation error`,
      opts.throwOnError
    );
  }
}

/**
 * Creates a validation error result
 * 
 * @param error The error object
 * @param message Error message
 * @param throwError Whether to throw the error
 * @returns Validation error result
 */
function createErrorResult(
  error: Error | z.ZodError,
  message: string,
  throwError: boolean = false
): ValidationResult<any> {
  const errorResult: ValidationResult<any> = {
    success: false,
    error: error instanceof z.ZodError 
      ? formatZodError(error)
      : { message: error.message, error }
  };
  
  if (throwError) {
    if (error instanceof z.ZodError) {
      throw new Error(`${message}: ${formatZodError(error).message}`);
    } else {
      throw error;
    }
  }
  
  return errorResult;
}

/**
 * Formats a Zod error into a more readable format
 * 
 * @param error The Zod error to format
 * @returns Formatted error object
 */
export function formatZodError(error: z.ZodError): { message: string; issues: z.ZodIssue[]; formattedIssues: string[] } {
  const formattedIssues = error.issues.map(issue => {
    const path = issue.path.join('.');
    const pathPrefix = path ? `${path}: ` : '';
    return `${pathPrefix}${issue.message}`;
  });
  
  return {
    message: formattedIssues.join('; '),
    issues: error.issues,
    formattedIssues
  };
}

/**
 * Gets the base event schema for basic structure validation
 * 
 * @returns Zod schema for base event validation
 */
function getBaseEventSchema(): z.ZodType<IBaseEvent> {
  const cacheKey = 'base-event-schema';
  
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey) as z.ZodType<IBaseEvent>;
  }
  
  const schema = z.object({
    type: z.string().min(1),
    userId: z.string().uuid(),
    data: z.record(z.any()),
    journey: z.string().optional(),
    timestamp: z.string().datetime().optional().default(() => new Date().toISOString()),
    version: z.string().optional(),
    source: z.string().optional(),
    metadata: z.record(z.any()).optional()
  });
  
  schemaCache.set(cacheKey, schema);
  return schema;
}

/**
 * Gets the schema for a specific event type
 * 
 * @param eventType The event type to get the schema for
 * @param journeyContext Optional journey context for journey-specific schemas
 * @returns Zod schema for the event type or undefined if not found
 */
function getSchemaForEventType(eventType: string, journeyContext?: string): z.ZodType<any> | undefined {
  const cacheKey = journeyContext ? `${eventType}-${journeyContext}` : eventType;
  
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey);
  }
  
  let schema: z.ZodType<any> | undefined;
  
  // Try to get a journey-specific schema first if context is provided
  if (journeyContext) {
    schema = getJourneySpecificSchema(eventType, journeyContext);
    if (schema) {
      schemaCache.set(cacheKey, schema);
      return schema;
    }
  }
  
  // Fall back to generic event type schemas
  switch (eventType) {
    // Health journey events
    case EventTypes.HEALTH_METRIC_RECORDED:
      schema = getHealthMetricSchema();
      break;
    case EventTypes.HEALTH_GOAL_ACHIEVED:
      schema = getHealthGoalSchema();
      break;
    case EventTypes.DEVICE_CONNECTED:
      schema = getDeviceConnectionSchema();
      break;
      
    // Care journey events
    case EventTypes.APPOINTMENT_BOOKED:
      schema = getAppointmentSchema();
      break;
    case EventTypes.MEDICATION_TAKEN:
      schema = getMedicationSchema();
      break;
    case EventTypes.TELEMEDICINE_SESSION_COMPLETED:
      schema = getTelemedicineSchema();
      break;
      
    // Plan journey events
    case EventTypes.CLAIM_SUBMITTED:
      schema = getClaimSchema();
      break;
    case EventTypes.BENEFIT_UTILIZED:
      schema = getBenefitSchema();
      break;
    case EventTypes.PLAN_SELECTED:
      schema = getPlanSelectionSchema();
      break;
      
    // Generic events
    case EventTypes.USER_REGISTERED:
    case EventTypes.USER_LOGGED_IN:
      schema = getUserEventSchema();
      break;
      
    default:
      // For unknown event types, use a generic schema
      schema = getGenericEventSchema();
      break;
  }
  
  if (schema) {
    schemaCache.set(cacheKey, schema);
  }
  
  return schema;
}

/**
 * Gets a journey-specific schema for an event type
 * 
 * @param eventType The event type
 * @param journeyContext The journey context
 * @returns Journey-specific Zod schema or undefined if not found
 */
function getJourneySpecificSchema(eventType: string, journeyContext: string): z.ZodType<any> | undefined {
  switch (journeyContext.toLowerCase()) {
    case 'health':
      return getHealthJourneySchema(eventType);
    case 'care':
      return getCareJourneySchema(eventType);
    case 'plan':
      return getPlanJourneySchema(eventType);
    default:
      return undefined;
  }
}

/**
 * Gets a health journey-specific schema for an event type
 * 
 * @param eventType The event type
 * @returns Health journey-specific Zod schema or undefined if not found
 */
function getHealthJourneySchema(eventType: string): z.ZodType<any> | undefined {
  const baseSchema = getBaseEventSchema();
  
  switch (eventType) {
    case EventTypes.HEALTH_METRIC_RECORDED:
      return baseSchema.extend({
        data: z.object({
          metricType: z.enum(['WEIGHT', 'HEART_RATE', 'BLOOD_PRESSURE', 'STEPS', 'SLEEP', 'GLUCOSE']),
          value: z.number(),
          unit: z.string(),
          timestamp: z.string().datetime(),
          source: z.enum(['MANUAL', 'DEVICE', 'INTEGRATION']).optional(),
          deviceId: z.string().optional(),
          notes: z.string().optional()
        })
      });
      
    case EventTypes.HEALTH_GOAL_ACHIEVED:
      return baseSchema.extend({
        data: z.object({
          goalId: z.string().uuid(),
          goalType: z.enum(['STEPS', 'WEIGHT', 'ACTIVITY', 'SLEEP', 'NUTRITION']),
          targetValue: z.number(),
          achievedValue: z.number(),
          unit: z.string(),
          achievedAt: z.string().datetime(),
          streakCount: z.number().int().nonnegative().optional()
        })
      });
      
    case EventTypes.DEVICE_CONNECTED:
      return baseSchema.extend({
        data: z.object({
          deviceId: z.string(),
          deviceType: z.enum(['SMARTWATCH', 'SCALE', 'BLOOD_PRESSURE', 'GLUCOSE_MONITOR', 'FITNESS_TRACKER']),
          manufacturer: z.string(),
          model: z.string().optional(),
          connectionMethod: z.enum(['BLUETOOTH', 'WIFI', 'MANUAL', 'API']),
          connectedAt: z.string().datetime(),
          permissions: z.array(z.string()).optional()
        })
      });
      
    default:
      return undefined;
  }
}

/**
 * Gets a care journey-specific schema for an event type
 * 
 * @param eventType The event type
 * @returns Care journey-specific Zod schema or undefined if not found
 */
function getCareJourneySchema(eventType: string): z.ZodType<any> | undefined {
  const baseSchema = getBaseEventSchema();
  
  switch (eventType) {
    case EventTypes.APPOINTMENT_BOOKED:
      return baseSchema.extend({
        data: z.object({
          appointmentId: z.string().uuid(),
          providerId: z.string().uuid(),
          specialization: z.string(),
          dateTime: z.string().datetime(),
          duration: z.number().int().positive(),
          location: z.object({
            type: z.enum(['VIRTUAL', 'IN_PERSON']),
            address: z.string().optional(),
            coordinates: z.tuple([z.number(), z.number()]).optional()
          }),
          reason: z.string().optional(),
          status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).default('SCHEDULED')
        })
      });
      
    case EventTypes.MEDICATION_TAKEN:
      return baseSchema.extend({
        data: z.object({
          medicationId: z.string().uuid(),
          medicationName: z.string(),
          dosage: z.number().positive(),
          unit: z.string(),
          takenAt: z.string().datetime(),
          scheduledFor: z.string().datetime().optional(),
          adherence: z.enum(['ON_TIME', 'DELAYED', 'MISSED']).optional(),
          notes: z.string().optional()
        })
      });
      
    case EventTypes.TELEMEDICINE_SESSION_COMPLETED:
      return baseSchema.extend({
        data: z.object({
          sessionId: z.string().uuid(),
          providerId: z.string().uuid(),
          providerName: z.string(),
          specialization: z.string(),
          startTime: z.string().datetime(),
          endTime: z.string().datetime(),
          duration: z.number().int().positive(),
          notes: z.string().optional(),
          followUpRequired: z.boolean().optional(),
          prescriptionsIssued: z.array(z.string()).optional()
        })
      });
      
    default:
      return undefined;
  }
}

/**
 * Gets a plan journey-specific schema for an event type
 * 
 * @param eventType The event type
 * @returns Plan journey-specific Zod schema or undefined if not found
 */
function getPlanJourneySchema(eventType: string): z.ZodType<any> | undefined {
  const baseSchema = getBaseEventSchema();
  
  switch (eventType) {
    case EventTypes.CLAIM_SUBMITTED:
      return baseSchema.extend({
        data: z.object({
          claimId: z.string().uuid(),
          claimType: z.enum(['MEDICAL', 'DENTAL', 'VISION', 'PHARMACY', 'OTHER']),
          amount: z.number().positive(),
          currency: z.string().length(3),
          serviceDate: z.string().datetime(),
          providerId: z.string().uuid().optional(),
          providerName: z.string(),
          documents: z.array(z.string()).optional(),
          status: z.enum(['SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED']).default('SUBMITTED')
        })
      });
      
    case EventTypes.BENEFIT_UTILIZED:
      return baseSchema.extend({
        data: z.object({
          benefitId: z.string().uuid(),
          benefitType: z.string(),
          utilizationDate: z.string().datetime(),
          value: z.number().positive(),
          remainingValue: z.number().nonnegative(),
          expiryDate: z.string().datetime().optional(),
          provider: z.string().optional(),
          notes: z.string().optional()
        })
      });
      
    case EventTypes.PLAN_SELECTED:
      return baseSchema.extend({
        data: z.object({
          planId: z.string().uuid(),
          planName: z.string(),
          planType: z.enum(['HEALTH', 'DENTAL', 'VISION', 'COMPREHENSIVE']),
          coverageLevel: z.enum(['INDIVIDUAL', 'COUPLE', 'FAMILY']),
          startDate: z.string().datetime(),
          endDate: z.string().datetime().optional(),
          premium: z.number().positive(),
          currency: z.string().length(3),
          paymentFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']),
          selectedBenefits: z.array(z.string()).optional()
        })
      });
      
    default:
      return undefined;
  }
}

/**
 * Gets a schema for health metric events
 * 
 * @returns Zod schema for health metric events
 */
function getHealthMetricSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      metricType: z.string(),
      value: z.number(),
      unit: z.string(),
      timestamp: z.string().datetime().optional()
    })
  });
}

/**
 * Gets a schema for health goal events
 * 
 * @returns Zod schema for health goal events
 */
function getHealthGoalSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      goalId: z.string(),
      goalType: z.string(),
      targetValue: z.number(),
      achievedValue: z.number(),
      unit: z.string().optional()
    })
  });
}

/**
 * Gets a schema for device connection events
 * 
 * @returns Zod schema for device connection events
 */
function getDeviceConnectionSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      deviceId: z.string(),
      deviceType: z.string(),
      manufacturer: z.string().optional(),
      connectionMethod: z.string().optional()
    })
  });
}

/**
 * Gets a schema for appointment events
 * 
 * @returns Zod schema for appointment events
 */
function getAppointmentSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      appointmentId: z.string(),
      providerId: z.string(),
      dateTime: z.string().datetime(),
      status: z.string().optional()
    })
  });
}

/**
 * Gets a schema for medication events
 * 
 * @returns Zod schema for medication events
 */
function getMedicationSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      medicationId: z.string(),
      medicationName: z.string(),
      dosage: z.number().optional(),
      takenAt: z.string().datetime().optional()
    })
  });
}

/**
 * Gets a schema for telemedicine events
 * 
 * @returns Zod schema for telemedicine events
 */
function getTelemedicineSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      sessionId: z.string(),
      providerId: z.string(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional()
    })
  });
}

/**
 * Gets a schema for claim events
 * 
 * @returns Zod schema for claim events
 */
function getClaimSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      claimId: z.string(),
      claimType: z.string(),
      amount: z.number().positive(),
      status: z.string().optional()
    })
  });
}

/**
 * Gets a schema for benefit events
 * 
 * @returns Zod schema for benefit events
 */
function getBenefitSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      benefitId: z.string(),
      benefitType: z.string(),
      value: z.number().optional(),
      utilizationDate: z.string().datetime().optional()
    })
  });
}

/**
 * Gets a schema for plan selection events
 * 
 * @returns Zod schema for plan selection events
 */
function getPlanSelectionSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      planId: z.string(),
      planName: z.string(),
      planType: z.string(),
      startDate: z.string().datetime().optional()
    })
  });
}

/**
 * Gets a schema for user events
 * 
 * @returns Zod schema for user events
 */
function getUserEventSchema(): z.ZodType<any> {
  return getBaseEventSchema().extend({
    data: z.object({
      email: z.string().email().optional(),
      username: z.string().optional(),
      timestamp: z.string().datetime().optional()
    })
  });
}

/**
 * Gets a generic schema for unknown event types
 * 
 * @returns Generic Zod schema for unknown event types
 */
function getGenericEventSchema(): z.ZodType<any> {
  return getBaseEventSchema();
}

/**
 * Checks if an event is a versioned event
 * 
 * @param event The event to check
 * @returns True if the event is versioned, false otherwise
 */
function isVersionedEvent(event: any): event is IVersionedEvent {
  return event && typeof event === 'object' && 'version' in event && typeof event.version === 'string';
}

/**
 * Attempts to transform a versioned event to the latest version
 * 
 * @param event The versioned event to transform
 * @param eventType The event type
 * @returns Transformed event or undefined if transformation failed
 */
function attemptVersionTransformation(event: IVersionedEvent, eventType: string): IVersionedEvent | undefined {
  try {
    const currentVersion = event.version;
    const detectedVersion = detectVersion(event);
    
    if (detectedVersion && detectedVersion !== currentVersion) {
      return transformEvent(event, detectedVersion, currentVersion);
    }
    
    return undefined;
  } catch (error) {
    console.error(`Error transforming event of type ${eventType}:`, error);
    return undefined;
  }
}

/**
 * Creates a custom Zod validator for common validation patterns
 * 
 * @param schema The base Zod schema to extend
 * @param customValidators Object containing custom validators
 * @returns Extended Zod schema with custom validators
 */
export function createCustomValidator<T extends z.ZodTypeAny>(
  schema: T,
  customValidators: Record<string, (value: any) => boolean | { success: boolean; message?: string }>
): T {
  let extendedSchema = schema;
  
  for (const [key, validator] of Object.entries(customValidators)) {
    extendedSchema = extendedSchema.refine(
      (data) => {
        const result = validator(data);
        return typeof result === 'boolean' ? result : result.success;
      },
      (data) => {
        const result = validator(data);
        const message = typeof result === 'boolean' ? `Failed validation for ${key}` : result.message || `Failed validation for ${key}`;
        return { message };
      }
    ) as T;
  }
  
  return extendedSchema;
}

/**
 * Creates a validator for checking if a value is within a range
 * 
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createRangeValidator(
  min: number,
  max: number,
  errorMessage?: string
): (value: number) => { success: boolean; message?: string } {
  return (value: number) => {
    const success = value >= min && value <= max;
    return {
      success,
      message: success ? undefined : errorMessage || `Value must be between ${min} and ${max}`
    };
  };
}

/**
 * Creates a validator for checking if a string matches a pattern
 * 
 * @param pattern Regular expression pattern
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createPatternValidator(
  pattern: RegExp,
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  return (value: string) => {
    const success = pattern.test(value);
    return {
      success,
      message: success ? undefined : errorMessage || `Value must match pattern ${pattern}`
    };
  };
}

/**
 * Creates a validator for checking if a value is one of a set of allowed values
 * 
 * @param allowedValues Array of allowed values
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createEnumValidator<T>(
  allowedValues: T[],
  errorMessage?: string
): (value: T) => { success: boolean; message?: string } {
  return (value: T) => {
    const success = allowedValues.includes(value);
    return {
      success,
      message: success ? undefined : errorMessage || `Value must be one of: ${allowedValues.join(', ')}`
    };
  };
}

/**
 * Creates a validator for checking if a date is within a range
 * 
 * @param minDate Minimum date (inclusive)
 * @param maxDate Maximum date (inclusive)
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createDateRangeValidator(
  minDate: Date,
  maxDate: Date,
  errorMessage?: string
): (value: string | Date) => { success: boolean; message?: string } {
  return (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    const success = !isNaN(date.getTime()) && date >= minDate && date <= maxDate;
    return {
      success,
      message: success ? undefined : errorMessage || `Date must be between ${minDate.toISOString()} and ${maxDate.toISOString()}`
    };
  };
}

/**
 * Creates a validator for checking if an object has required properties
 * 
 * @param requiredProps Array of required property names
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createRequiredPropsValidator(
  requiredProps: string[],
  errorMessage?: string
): (value: Record<string, any>) => { success: boolean; message?: string } {
  return (value: Record<string, any>) => {
    const missingProps = requiredProps.filter(prop => !(prop in value));
    const success = missingProps.length === 0;
    return {
      success,
      message: success ? undefined : errorMessage || `Missing required properties: ${missingProps.join(', ')}`
    };
  };
}

/**
 * Creates a validator for checking if a string is a valid UUID
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createUuidValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return createPatternValidator(uuidPattern, errorMessage || 'Value must be a valid UUID');
}

/**
 * Creates a validator for checking if a value is a valid email address
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createEmailValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  // This is a simplified email regex, consider using a more comprehensive one for production
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return createPatternValidator(emailPattern, errorMessage || 'Value must be a valid email address');
}

/**
 * Creates a validator for checking if a string is a valid ISO date
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createIsoDateValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  return (value: string) => {
    const date = new Date(value);
    const success = !isNaN(date.getTime()) && date.toISOString() === value;
    return {
      success,
      message: success ? undefined : errorMessage || 'Value must be a valid ISO date string'
    };
  };
}

/**
 * Creates a validator for checking if a value is a valid phone number
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createPhoneValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  // This is a simplified phone regex, consider using a more comprehensive one for production
  const phonePattern = /^\+?[0-9]{10,15}$/;
  return createPatternValidator(phonePattern, errorMessage || 'Value must be a valid phone number');
}

/**
 * Creates a validator for checking if a value is a valid URL
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createUrlValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  return (value: string) => {
    try {
      new URL(value);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: errorMessage || 'Value must be a valid URL'
      };
    }
  };
}

/**
 * Creates a validator for checking if a value is a valid currency code
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createCurrencyCodeValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  // ISO 4217 currency codes are 3 letters
  const currencyPattern = /^[A-Z]{3}$/;
  return createPatternValidator(currencyPattern, errorMessage || 'Value must be a valid 3-letter currency code');
}

/**
 * Creates a validator for checking if a value is a valid JSON string
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createJsonValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  return (value: string) => {
    try {
      JSON.parse(value);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: errorMessage || 'Value must be a valid JSON string'
      };
    }
  };
}

/**
 * Creates a validator for checking if a value is a valid base64 string
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createBase64Validator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return createPatternValidator(base64Pattern, errorMessage || 'Value must be a valid base64 string');
}

/**
 * Creates a validator for checking if a value is a valid hex color
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createHexColorValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  const hexColorPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  return createPatternValidator(hexColorPattern, errorMessage || 'Value must be a valid hex color code');
}

/**
 * Creates a validator for checking if a value is a valid IP address
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createIpAddressValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  // This is a simplified IP regex, consider using a more comprehensive one for production
  const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  return (value: string) => {
    if (!ipPattern.test(value)) {
      return {
        success: false,
        message: errorMessage || 'Value must be a valid IP address'
      };
    }
    
    // Check if each octet is between 0 and 255
    const octets = value.split('.');
    const validOctets = octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
    
    return {
      success: validOctets,
      message: validOctets ? undefined : errorMessage || 'Value must be a valid IP address'
    };
  };
}

/**
 * Creates a validator for checking if a value is a valid credit card number
 * 
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createCreditCardValidator(
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  return (value: string) => {
    // Remove spaces and dashes
    const sanitized = value.replace(/[\s-]/g, '');
    
    // Check if it contains only digits
    if (!/^\d+$/.test(sanitized)) {
      return {
        success: false,
        message: errorMessage || 'Credit card number must contain only digits, spaces, or dashes'
      };
    }
    
    // Check length (most credit cards are between 13 and 19 digits)
    if (sanitized.length < 13 || sanitized.length > 19) {
      return {
        success: false,
        message: errorMessage || 'Credit card number must be between 13 and 19 digits'
      };
    }
    
    // Luhn algorithm (checksum)
    let sum = 0;
    let double = false;
    
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);
      
      if (double) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      double = !double;
    }
    
    const valid = sum % 10 === 0;
    
    return {
      success: valid,
      message: valid ? undefined : errorMessage || 'Invalid credit card number'
    };
  };
}

/**
 * Creates a validator for checking if a value is a valid postal code
 * 
 * @param countryCode Country code for country-specific validation
 * @param errorMessage Custom error message
 * @returns Validator function
 */
export function createPostalCodeValidator(
  countryCode: string = 'US',
  errorMessage?: string
): (value: string) => { success: boolean; message?: string } {
  return (value: string) => {
    let pattern: RegExp;
    
    switch (countryCode.toUpperCase()) {
      case 'US':
        pattern = /^\d{5}(-\d{4})?$/;
        break;
      case 'CA':
        pattern = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
        break;
      case 'UK':
        pattern = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
        break;
      case 'BR':
        pattern = /^\d{5}-\d{3}$/;
        break;
      default:
        // Default pattern that accepts most postal code formats
        pattern = /^[A-Za-z0-9\s-]{3,10}$/;
        break;
    }
    
    const success = pattern.test(value);
    return {
      success,
      message: success ? undefined : errorMessage || `Invalid postal code for ${countryCode}`
    };
  };
}

// Export the main validator class that implements the IEventValidator interface
export class EventValidator implements IEventValidator {
  /**
   * Validates an event against its schema
   * 
   * @param event The event to validate
   * @param options Validation options
   * @returns Validation result with success status and data or error
   */
  validate<T extends IBaseEvent>(event: unknown, options?: EventValidationOptions): ValidationResult<T> {
    return validateEvent<T>(event, options);
  }
  
  /**
   * Validates an event by its type
   * 
   * @param event The event to validate
   * @param eventType The expected event type
   * @param options Validation options
   * @returns Validation result with success status and data or error
   */
  validateByType<T extends IBaseEvent>(event: unknown, eventType: string, options?: EventValidationOptions): ValidationResult<T> {
    return validateEventByType<T>(event, eventType, options);
  }
  
  /**
   * Validates an event payload against a specific schema
   * 
   * @param payload The payload to validate
   * @param schema The Zod schema to validate against
   * @param options Validation options
   * @returns Validation result with success status and data or error
   */
  validatePayload<T>(payload: unknown, schema: z.ZodType<T>, options?: EventValidationOptions): ValidationResult<T> {
    return validatePayload<T>(payload, schema, options);
  }
  
  /**
   * Formats a Zod error into a more readable format
   * 
   * @param error The Zod error to format
   * @returns Formatted error object
   */
  formatError(error: z.ZodError): { message: string; issues: z.ZodIssue[]; formattedIssues: string[] } {
    return formatZodError(error);
  }
}

// Export a singleton instance of the validator
export const eventValidator = new EventValidator();