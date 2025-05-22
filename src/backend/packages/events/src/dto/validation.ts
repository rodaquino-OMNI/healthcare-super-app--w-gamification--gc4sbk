/**
 * @file Event validation utilities and decorators
 * @description Provides specialized validation utilities and decorators for event validation
 * beyond what's available in standard class-validator. Includes custom validators for
 * journey-specific fields, complex object validation, conditional validation logic, and more.
 */

import { 
  registerDecorator, 
  ValidationOptions, 
  ValidationArguments,
  ValidatorConstraint, 
  ValidatorConstraintInterface,
  validate
} from 'class-validator';
import { ZodSchema, z } from 'zod';
import { IBaseEvent, IEventPayload } from '../interfaces/event.interface';

/**
 * Validates that a field is only present when the event is of a specific type.
 * Useful for ensuring that certain fields are only included for specific event types.
 * 
 * @param eventType The event type for which the field should be present
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 * 
 * @example
 * class HealthMetricEventDto {
 *   @IsRequiredForEventType('HEALTH_METRIC_RECORDED')
 *   metricValue: number;
 * }
 */
export function IsRequiredForEventType(eventType: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredForEventType',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [eventType],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [requiredEventType] = args.constraints;
          const obj = args.object as any;
          
          // If this is the required event type, the field must be present
          if (obj.type === requiredEventType) {
            return value !== undefined && value !== null;
          }
          
          // For other event types, the field is optional
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [requiredEventType] = args.constraints;
          return `${args.property} is required for event type ${requiredEventType}`;
        }
      }
    });
  };
}

/**
 * Validates that a field is only present for events from a specific journey.
 * Ensures journey-specific fields are only included in events from the appropriate journey.
 * 
 * @param journeyType The journey type for which the field should be present
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 * 
 * @example
 * class HealthEventDto {
 *   @IsRequiredForJourney('health')
 *   healthMetrics: HealthMetrics;
 * }
 */
export function IsRequiredForJourney(journeyType: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredForJourney',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [journeyType],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [requiredJourney] = args.constraints;
          const obj = args.object as any;
          
          // If this is the required journey, the field must be present
          if (obj.journey === requiredJourney) {
            return value !== undefined && value !== null;
          }
          
          // For other journeys, the field is optional
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [requiredJourney] = args.constraints;
          return `${args.property} is required for journey ${requiredJourney}`;
        }
      }
    });
  };
}

/**
 * Validates that a field conforms to a Zod schema.
 * Allows using Zod schemas for validation within class-validator decorators.
 * 
 * @param schema The Zod schema to validate against
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 * 
 * @example
 * const MetricValueSchema = z.number().positive().max(1000);
 * 
 * class HealthMetricEventDto {
 *   @ValidateWithZod(MetricValueSchema)
 *   metricValue: number;
 * }
 */
export function ValidateWithZod(schema: ZodSchema, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateWithZod',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [schema],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [zodSchema] = args.constraints;
          const result = zodSchema.safeParse(value);
          return result.success;
        },
        defaultMessage(args: ValidationArguments) {
          const [zodSchema] = args.constraints;
          const result = zodSchema.safeParse(args.value);
          if (!result.success) {
            return result.error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
          }
          return 'Invalid value';
        }
      }
    });
  };
}

/**
 * Validates that a field is conditionally required based on another field's value.
 * Useful for implementing complex validation rules that depend on other fields.
 * 
 * @param condition Function that determines if the field is required
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 * 
 * @example
 * class AppointmentEventDto {
 *   @IsConditionallyRequired(
 *     obj => obj.type === 'APPOINTMENT_BOOKED' || obj.type === 'APPOINTMENT_RESCHEDULED'
 *   )
 *   appointmentDate: Date;
 * }
 */
export function IsConditionallyRequired(
  condition: (object: any) => boolean,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isConditionallyRequired',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [condition],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [conditionFn] = args.constraints;
          const obj = args.object;
          
          // If the condition is met, the field must be present
          if (conditionFn(obj)) {
            return value !== undefined && value !== null;
          }
          
          // Otherwise, the field is optional
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is required based on other field values`;
        }
      }
    });
  };
}

/**
 * Validates that a numeric field is within a physiologically plausible range for health metrics.
 * Ensures health metric values are within reasonable ranges to prevent erroneous data.
 * 
 * @param metricType The type of health metric being validated
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 * 
 * @example
 * class HealthMetricEventDto {
 *   @IsPhysiologicallyPlausible('HEART_RATE')
 *   heartRate: number;
 * }
 */
export function IsPhysiologicallyPlausible(
  metricType: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhysiologicallyPlausible',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [metricType],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'number') {
            return false;
          }
          
          const [metricType] = args.constraints;
          
          // Define plausible ranges for different health metrics
          switch (metricType.toUpperCase()) {
            case 'HEART_RATE':
              return value >= 30 && value <= 220; // bpm
            case 'BLOOD_PRESSURE_SYSTOLIC':
              return value >= 70 && value <= 250; // mmHg
            case 'BLOOD_PRESSURE_DIASTOLIC':
              return value >= 40 && value <= 150; // mmHg
            case 'BLOOD_GLUCOSE':
              return value >= 30 && value <= 600; // mg/dL
            case 'BODY_TEMPERATURE':
              return value >= 34 && value <= 42; // Celsius
            case 'WEIGHT':
              return value >= 1 && value <= 500; // kg
            case 'HEIGHT':
              return value >= 30 && value <= 250; // cm
            case 'STEPS':
              return value >= 0 && value <= 100000; // steps per day
            case 'SLEEP_DURATION':
              return value >= 0 && value <= 24; // hours
            default:
              return true; // For unknown metric types, defer to other validators
          }
        },
        defaultMessage(args: ValidationArguments) {
          const [metricType] = args.constraints;
          return `${args.property} is not within a physiologically plausible range for ${metricType}`;
        }
      }
    });
  };
}

/**
 * Validates that a field contains a valid Brazilian currency value.
 * Ensures financial values are properly formatted for Brazilian Real.
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 * 
 * @example
 * class ClaimEventDto {
 *   @IsBrazilianCurrency()
 *   claimAmount: number;
 * }
 */
export function IsBrazilianCurrency(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBrazilianCurrency',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if it's a number or a string that can be converted to a number
          if (typeof value === 'number') {
            // Ensure it has at most 2 decimal places and is non-negative
            return value >= 0 && Math.floor(value * 100) / 100 === value;
          } else if (typeof value === 'string') {
            // Check if it matches Brazilian currency format (R$ X.XXX,XX)
            const brCurrencyRegex = /^R\$ ?(\d{1,3}(\.\d{3})*,\d{2})$/;
            return brCurrencyRegex.test(value);
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Brazilian currency value`;
        }
      }
    });
  };
}

/**
 * Validates that an event payload contains all required fields for a specific event type.
 * Ensures event payloads have the necessary data for processing.
 * 
 * @param requiredFields Array of field names required for the event type
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 * 
 * @example
 * class AppointmentEventDto {
 *   @HasRequiredEventFields(['appointmentId', 'providerId', 'appointmentDate'])
 *   data: object;
 * }
 */
export function HasRequiredEventFields(
  requiredFields: string[],
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'hasRequiredEventFields',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [requiredFields],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'object' || value === null) {
            return false;
          }
          
          const [requiredFields] = args.constraints;
          return requiredFields.every(field => 
            Object.prototype.hasOwnProperty.call(value, field) && 
            value[field] !== undefined && 
            value[field] !== null
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [requiredFields] = args.constraints;
          return `${args.property} must contain the following required fields: ${requiredFields.join(', ')}`;
        }
      }
    });
  };
}

/**
 * Validates that an event payload is valid for a specific journey and event type.
 * Combines multiple validation rules for comprehensive event validation.
 * 
 * @param journeyType The journey type to validate for
 * @param eventType The event type to validate for
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 * 
 * @example
 * class EventDto {
 *   @ValidateEventPayload('health', 'HEALTH_METRIC_RECORDED')
 *   data: object;
 * }
 */
export function ValidateEventPayload(
  journeyType: string,
  eventType: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateEventPayload',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [journeyType, eventType],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'object' || value === null) {
            return false;
          }
          
          const [journeyType, eventType] = args.constraints;
          const obj = args.object as any;
          
          // Verify that the event is of the correct journey and type
          if (obj.journey !== journeyType || obj.type !== eventType) {
            return true; // Skip validation for other event types/journeys
          }
          
          // Perform journey and event type specific validation
          switch (journeyType) {
            case 'health':
              return validateHealthEventPayload(eventType, value);
            case 'care':
              return validateCareEventPayload(eventType, value);
            case 'plan':
              return validatePlanEventPayload(eventType, value);
            default:
              return true; // Unknown journey type, defer to other validators
          }
        },
        defaultMessage(args: ValidationArguments) {
          const [journeyType, eventType] = args.constraints;
          return `${args.property} is not valid for journey ${journeyType} and event type ${eventType}`;
        }
      }
    });
  };
}

/**
 * Validates health journey event payloads.
 * 
 * @param eventType The specific health event type
 * @param payload The event payload to validate
 * @returns boolean indicating if the payload is valid
 */
function validateHealthEventPayload(eventType: string, payload: any): boolean {
  switch (eventType) {
    case 'HEALTH_METRIC_RECORDED':
      return (
        typeof payload.metricType === 'string' &&
        (typeof payload.metricValue === 'number' || typeof payload.metricValue === 'string') &&
        typeof payload.unit === 'string'
      );
    case 'GOAL_ACHIEVED':
      return (
        typeof payload.goalId === 'string' &&
        typeof payload.goalType === 'string'
      );
    case 'DEVICE_CONNECTED':
      return (
        typeof payload.deviceId === 'string' &&
        typeof payload.deviceType === 'string'
      );
    default:
      return true; // Unknown event type, defer to other validators
  }
}

/**
 * Validates care journey event payloads.
 * 
 * @param eventType The specific care event type
 * @param payload The event payload to validate
 * @returns boolean indicating if the payload is valid
 */
function validateCareEventPayload(eventType: string, payload: any): boolean {
  switch (eventType) {
    case 'APPOINTMENT_BOOKED':
      return (
        typeof payload.appointmentId === 'string' &&
        typeof payload.providerId === 'string' &&
        payload.appointmentDate instanceof Date
      );
    case 'MEDICATION_TAKEN':
      return (
        typeof payload.medicationId === 'string' &&
        typeof payload.dosage === 'string'
      );
    case 'TELEMEDICINE_SESSION_COMPLETED':
      return (
        typeof payload.sessionId === 'string' &&
        typeof payload.providerId === 'string' &&
        typeof payload.duration === 'number'
      );
    default:
      return true; // Unknown event type, defer to other validators
  }
}

/**
 * Validates plan journey event payloads.
 * 
 * @param eventType The specific plan event type
 * @param payload The event payload to validate
 * @returns boolean indicating if the payload is valid
 */
function validatePlanEventPayload(eventType: string, payload: any): boolean {
  switch (eventType) {
    case 'CLAIM_SUBMITTED':
      return (
        typeof payload.claimId === 'string' &&
        typeof payload.amount === 'number' &&
        typeof payload.claimType === 'string'
      );
    case 'BENEFIT_UTILIZED':
      return (
        typeof payload.benefitId === 'string' &&
        typeof payload.benefitType === 'string'
      );
    case 'PLAN_SELECTED':
      return (
        typeof payload.planId === 'string' &&
        typeof payload.planType === 'string'
      );
    default:
      return true; // Unknown event type, defer to other validators
  }
}

/**
 * Constraint for validating event objects against a Zod schema.
 * Provides a reusable validator for Zod schemas.
 */
@ValidatorConstraint({ name: 'zodSchema', async: false })
export class ZodSchemaValidator implements ValidatorConstraintInterface {
  constructor(private schema: ZodSchema) {}

  validate(value: any, args: ValidationArguments) {
    const result = this.schema.safeParse(value);
    return result.success;
  }

  defaultMessage(args: ValidationArguments) {
    const result = this.schema.safeParse(args.value);
    if (!result.success) {
      return result.error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
    }
    return 'Invalid value';
  }
}

/**
 * Creates a Zod schema for validating event objects.
 * Provides a consistent way to create event validation schemas.
 * 
 * @param journeyType The journey type for the event
 * @param eventType The specific event type
 * @param dataSchema The schema for the event data
 * @returns A Zod schema for validating the event
 * 
 * @example
 * const healthMetricSchema = createEventSchema(
 *   'health',
 *   'HEALTH_METRIC_RECORDED',
 *   z.object({
 *     metricType: z.string(),
 *     metricValue: z.number().positive(),
 *     unit: z.string()
 *   })
 * );
 */
export function createEventSchema(
  journeyType: string,
  eventType: string,
  dataSchema: ZodSchema
): ZodSchema {
  return z.object({
    type: z.literal(eventType),
    userId: z.string().uuid(),
    timestamp: z.string().datetime(),
    journey: z.literal(journeyType),
    data: dataSchema,
    source: z.string().optional(),
    version: z.string().optional()
  });
}

/**
 * Validates an event object using both class-validator and Zod.
 * Provides comprehensive validation using both libraries.
 * 
 * @param event The event object to validate
 * @param schema Optional Zod schema for additional validation
 * @returns Promise resolving to a validation result object
 * 
 * @example
 * const event = {
 *   type: 'HEALTH_METRIC_RECORDED',
 *   userId: 'user-123',
 *   journey: 'health',
 *   data: { metricType: 'HEART_RATE', metricValue: 75, unit: 'bpm' }
 * };
 * 
 * const result = await validateEvent(event, healthMetricSchema);
 * if (result.isValid) {
 *   // Process the valid event
 * } else {
 *   console.error(result.errors);
 * }
 */
export async function validateEvent(
  event: IBaseEvent,
  schema?: ZodSchema
): Promise<{ isValid: boolean; errors?: string[] }> {
  // First validate with class-validator if the event is a class instance
  if (event.constructor !== Object) {
    const errors = await validate(event);
    if (errors.length > 0) {
      return {
        isValid: false,
        errors: errors.flatMap(error => 
          Object.values(error.constraints || {}).map(message => message)
        )
      };
    }
  }
  
  // Then validate with Zod if a schema is provided
  if (schema) {
    const result = schema.safeParse(event);
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map(err => `${err.path}: ${err.message}`)
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Validates that an event payload matches a specific structure based on event type.
 * Provides a simple way to validate event payloads without creating full schemas.
 * 
 * @param event The event object to validate
 * @returns Validation result object
 * 
 * @example
 * const event = {
 *   type: 'HEALTH_METRIC_RECORDED',
 *   userId: 'user-123',
 *   journey: 'health',
 *   data: { metricType: 'HEART_RATE', metricValue: 75, unit: 'bpm' }
 * };
 * 
 * const result = validateEventPayloadStructure(event);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 */
export function validateEventPayloadStructure(
  event: IBaseEvent
): { isValid: boolean; errors?: string[] } {
  if (!event || typeof event !== 'object') {
    return { isValid: false, errors: ['Event must be an object'] };
  }
  
  if (!event.type) {
    return { isValid: false, errors: ['Event must have a type'] };
  }
  
  if (!event.userId) {
    return { isValid: false, errors: ['Event must have a userId'] };
  }
  
  if (!event.data || typeof event.data !== 'object') {
    return { isValid: false, errors: ['Event must have a data object'] };
  }
  
  // Validate based on journey and event type
  if (event.journey) {
    switch (event.journey) {
      case 'health':
        return validateHealthEventStructure(event.type, event.data);
      case 'care':
        return validateCareEventStructure(event.type, event.data);
      case 'plan':
        return validatePlanEventStructure(event.type, event.data);
    }
  }
  
  // If no journey is specified or it's not one of the known journeys,
  // we can't perform journey-specific validation
  return { isValid: true };
}

/**
 * Validates health event payload structure.
 * 
 * @param eventType The specific health event type
 * @param data The event data to validate
 * @returns Validation result object
 */
function validateHealthEventStructure(
  eventType: string,
  data: IEventPayload
): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  switch (eventType) {
    case 'HEALTH_METRIC_RECORDED':
      if (!data.metricType) errors.push('Health metric event must have a metricType');
      if (data.metricValue === undefined) errors.push('Health metric event must have a metricValue');
      if (!data.unit) errors.push('Health metric event must have a unit');
      break;
    case 'GOAL_ACHIEVED':
      if (!data.goalId) errors.push('Goal achievement event must have a goalId');
      if (!data.goalType) errors.push('Goal achievement event must have a goalType');
      break;
    case 'DEVICE_CONNECTED':
      if (!data.deviceId) errors.push('Device connection event must have a deviceId');
      if (!data.deviceType) errors.push('Device connection event must have a deviceType');
      break;
  }
  
  return errors.length > 0 ? { isValid: false, errors } : { isValid: true };
}

/**
 * Validates care event payload structure.
 * 
 * @param eventType The specific care event type
 * @param data The event data to validate
 * @returns Validation result object
 */
function validateCareEventStructure(
  eventType: string,
  data: IEventPayload
): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  switch (eventType) {
    case 'APPOINTMENT_BOOKED':
      if (!data.appointmentId) errors.push('Appointment event must have an appointmentId');
      if (!data.providerId) errors.push('Appointment event must have a providerId');
      if (!data.appointmentDate) errors.push('Appointment event must have an appointmentDate');
      break;
    case 'MEDICATION_TAKEN':
      if (!data.medicationId) errors.push('Medication event must have a medicationId');
      if (!data.dosage) errors.push('Medication event must have a dosage');
      break;
    case 'TELEMEDICINE_SESSION_COMPLETED':
      if (!data.sessionId) errors.push('Telemedicine event must have a sessionId');
      if (!data.providerId) errors.push('Telemedicine event must have a providerId');
      if (data.duration === undefined) errors.push('Telemedicine event must have a duration');
      break;
  }
  
  return errors.length > 0 ? { isValid: false, errors } : { isValid: true };
}

/**
 * Validates plan event payload structure.
 * 
 * @param eventType The specific plan event type
 * @param data The event data to validate
 * @returns Validation result object
 */
function validatePlanEventStructure(
  eventType: string,
  data: IEventPayload
): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  switch (eventType) {
    case 'CLAIM_SUBMITTED':
      if (!data.claimId) errors.push('Claim event must have a claimId');
      if (data.amount === undefined) errors.push('Claim event must have an amount');
      if (!data.claimType) errors.push('Claim event must have a claimType');
      break;
    case 'BENEFIT_UTILIZED':
      if (!data.benefitId) errors.push('Benefit event must have a benefitId');
      if (!data.benefitType) errors.push('Benefit event must have a benefitType');
      break;
    case 'PLAN_SELECTED':
      if (!data.planId) errors.push('Plan selection event must have a planId');
      if (!data.planType) errors.push('Plan selection event must have a planType');
      break;
  }
  
  return errors.length > 0 ? { isValid: false, errors } : { isValid: true };
}