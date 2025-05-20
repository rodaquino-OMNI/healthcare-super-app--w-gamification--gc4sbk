/**
 * @file validation.ts
 * @description Provides specialized validation utilities and decorators for event validation
 * beyond what's available in standard class-validator. This file includes custom validators
 * for journey-specific fields, complex object validation, conditional validation logic, and more.
 * 
 * It centralizes validation logic that's reused across multiple event DTOs and ensures
 * consistent validation behavior across the event processing pipeline.
 *
 * @module events/dto
 */

import { 
  registerDecorator, 
  ValidationOptions, 
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  validate
} from 'class-validator';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.constants';
import { EventMetadataDto } from './event-metadata.dto';

/**
 * Interface for validation error response
 */
export interface ValidationError {
  property: string;
  errorCode: string;
  message: string;
  constraints?: Record<string, string>;
  children?: ValidationError[];
}

/**
 * Validates that a value is a valid journey name
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidJourney(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidJourney',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const validJourneys = ['health', 'care', 'plan', 'user', 'gamification'];
          return typeof value === 'string' && validJourneys.includes(value.toLowerCase());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid journey name (health, care, plan, user, gamification)`;
        }
      }
    });
  };
}

/**
 * Validates that a value is a valid event type for the specified journey
 * 
 * @param journey The journey to validate against
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidEventType(journey: string, validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidEventType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Get the actual journey value from the object if it's a property reference
          let journeyValue = journey;
          if (journey.startsWith('@')) {
            const journeyProp = journey.substring(1);
            journeyValue = (args.object as any)[journeyProp];
          }

          // Validate based on journey
          switch (journeyValue.toLowerCase()) {
            case 'health':
              return [
                'HEALTH_METRIC_RECORDED',
                'HEALTH_GOAL_ACHIEVED',
                'HEALTH_GOAL_CREATED',
                'HEALTH_GOAL_UPDATED',
                'DEVICE_SYNCHRONIZED',
                'HEALTH_INSIGHT_GENERATED'
              ].includes(value);
            case 'care':
              return [
                'APPOINTMENT_BOOKED',
                'APPOINTMENT_COMPLETED',
                'APPOINTMENT_CANCELLED',
                'MEDICATION_ADHERENCE',
                'TELEMEDICINE_SESSION_STARTED',
                'TELEMEDICINE_SESSION_ENDED',
                'CARE_PLAN_UPDATED'
              ].includes(value);
            case 'plan':
              return [
                'CLAIM_SUBMITTED',
                'CLAIM_UPDATED',
                'CLAIM_APPROVED',
                'CLAIM_REJECTED',
                'BENEFIT_UTILIZED',
                'PLAN_SELECTED',
                'PLAN_COMPARED'
              ].includes(value);
            case 'user':
              return [
                'USER_REGISTERED',
                'USER_LOGGED_IN',
                'USER_PROFILE_UPDATED',
                'USER_PREFERENCES_UPDATED'
              ].includes(value);
            case 'gamification':
              return [
                'ACHIEVEMENT_UNLOCKED',
                'REWARD_EARNED',
                'REWARD_REDEEMED',
                'LEADERBOARD_UPDATED',
                'LEVEL_UP'
              ].includes(value);
            default:
              return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          let journeyValue = journey;
          if (journey.startsWith('@')) {
            const journeyProp = journey.substring(1);
            journeyValue = (args.object as any)[journeyProp];
          }
          return `${args.property} must be a valid event type for the ${journeyValue} journey`;
        }
      }
    });
  };
}

/**
 * Validates that a value is a valid UUID
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidUUID(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidUUID',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return typeof value === 'string' && uuidRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid UUID`;
        }
      }
    });
  };
}

/**
 * Validates that a value is present only when another property has a specific value
 * 
 * @param property The property to check
 * @param values The values that require this property
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsRequiredWhen(property: string, values: any[], validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredWhen',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const relatedValue = (args.object as any)[property];
          if (values.includes(relatedValue)) {
            return value !== undefined && value !== null && value !== '';
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is required when ${property} is one of [${values.join(', ')}]`;
        }
      }
    });
  };
}

/**
 * Validates that a value is not present when another property has a specific value
 * 
 * @param property The property to check
 * @param values The values that prohibit this property
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsProhibitedWhen(property: string, values: any[], validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isProhibitedWhen',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const relatedValue = (args.object as any)[property];
          if (values.includes(relatedValue)) {
            return value === undefined || value === null || value === '';
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is not allowed when ${property} is one of [${values.join(', ')}]`;
        }
      }
    });
  };
}

/**
 * Validates that a value is a valid ISO 8601 date string
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidISODate(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidISODate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }
          try {
            const date = new Date(value);
            return !isNaN(date.getTime()) && value === date.toISOString();
          } catch (e) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ISO 8601 date string`;
        }
      }
    });
  };
}

/**
 * Validates that a value is a valid health metric value based on the metric type
 */
@ValidatorConstraint({ name: 'isValidHealthMetricValue', async: false })
export class IsValidHealthMetricValueConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const metricType = object.metricType;
    
    if (typeof value !== 'number') {
      return false;
    }
    
    switch (metricType) {
      case 'HEART_RATE':
        return value >= 30 && value <= 220;
      case 'BLOOD_GLUCOSE':
        return value >= 20 && value <= 600;
      case 'STEPS':
        return value >= 0 && value <= 100000;
      case 'SLEEP':
        return value >= 0 && value <= 24; // Hours
      case 'WEIGHT':
        return value >= 0 && value <= 500; // kg
      case 'TEMPERATURE':
        return value >= 30 && value <= 45; // Celsius
      case 'OXYGEN_SATURATION':
        return value >= 50 && value <= 100; // Percentage
      case 'RESPIRATORY_RATE':
        return value >= 0 && value <= 100; // Breaths per minute
      case 'WATER_INTAKE':
        return value >= 0 && value <= 10000; // ml
      case 'CALORIES':
        return value >= 0 && value <= 10000;
      default:
        return true;
    }
  }
  
  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const metricType = object.metricType;
    
    switch (metricType) {
      case 'HEART_RATE':
        return `${args.property} must be between 30 and 220 for heart rate`;
      case 'BLOOD_GLUCOSE':
        return `${args.property} must be between 20 and 600 for blood glucose`;
      case 'STEPS':
        return `${args.property} must be between 0 and 100000 for steps`;
      case 'SLEEP':
        return `${args.property} must be between 0 and 24 for sleep hours`;
      case 'WEIGHT':
        return `${args.property} must be between 0 and 500 for weight in kg`;
      case 'TEMPERATURE':
        return `${args.property} must be between 30 and 45 for temperature in Celsius`;
      case 'OXYGEN_SATURATION':
        return `${args.property} must be between 50 and 100 for oxygen saturation percentage`;
      case 'RESPIRATORY_RATE':
        return `${args.property} must be between 0 and 100 for respiratory rate`;
      case 'WATER_INTAKE':
        return `${args.property} must be between 0 and 10000 for water intake in ml`;
      case 'CALORIES':
        return `${args.property} must be between 0 and 10000 for calories`;
      default:
        return `${args.property} must be a valid value for the given metric type`;
    }
  }
}

/**
 * Decorator that validates a health metric value based on the metric type
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidHealthMetricValue(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidHealthMetricValue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidHealthMetricValueConstraint,
    });
  };
}

/**
 * Validates that a value is a valid unit for the given health metric type
 */
@ValidatorConstraint({ name: 'isValidHealthMetricUnit', async: false })
export class IsValidHealthMetricUnitConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const metricType = object.metricType;
    
    if (typeof value !== 'string') {
      return false;
    }
    
    switch (metricType) {
      case 'HEART_RATE':
        return ['bpm'].includes(value);
      case 'BLOOD_GLUCOSE':
        return ['mg/dL', 'mmol/L'].includes(value);
      case 'STEPS':
        return ['steps'].includes(value);
      case 'SLEEP':
        return ['hours', 'minutes'].includes(value);
      case 'WEIGHT':
        return ['kg', 'lb'].includes(value);
      case 'TEMPERATURE':
        return ['°C', '°F'].includes(value);
      case 'OXYGEN_SATURATION':
        return ['%'].includes(value);
      case 'RESPIRATORY_RATE':
        return ['breaths/min'].includes(value);
      case 'WATER_INTAKE':
        return ['ml', 'oz'].includes(value);
      case 'CALORIES':
        return ['kcal'].includes(value);
      default:
        return true;
    }
  }
  
  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const metricType = object.metricType;
    
    switch (metricType) {
      case 'HEART_RATE':
        return `${args.property} must be 'bpm' for heart rate`;
      case 'BLOOD_GLUCOSE':
        return `${args.property} must be 'mg/dL' or 'mmol/L' for blood glucose`;
      case 'STEPS':
        return `${args.property} must be 'steps' for steps`;
      case 'SLEEP':
        return `${args.property} must be 'hours' or 'minutes' for sleep`;
      case 'WEIGHT':
        return `${args.property} must be 'kg' or 'lb' for weight`;
      case 'TEMPERATURE':
        return `${args.property} must be '°C' or '°F' for temperature`;
      case 'OXYGEN_SATURATION':
        return `${args.property} must be '%' for oxygen saturation`;
      case 'RESPIRATORY_RATE':
        return `${args.property} must be 'breaths/min' for respiratory rate`;
      case 'WATER_INTAKE':
        return `${args.property} must be 'ml' or 'oz' for water intake`;
      case 'CALORIES':
        return `${args.property} must be 'kcal' for calories`;
      default:
        return `${args.property} must be a valid unit for the given metric type`;
    }
  }
}

/**
 * Decorator that validates a health metric unit based on the metric type
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidHealthMetricUnit(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidHealthMetricUnit',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidHealthMetricUnitConstraint,
    });
  };
}

/**
 * Validates that a value is a valid device type
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidDeviceType(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidDeviceType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const validDeviceTypes = [
            'FITNESS_TRACKER',
            'SMARTWATCH',
            'BLOOD_PRESSURE_MONITOR',
            'GLUCOSE_MONITOR',
            'SCALE',
            'SLEEP_TRACKER',
            'THERMOMETER',
            'PULSE_OXIMETER'
          ];
          return typeof value === 'string' && validDeviceTypes.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid device type`;
        }
      }
    });
  };
}

/**
 * Validates that a value is a valid appointment status
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidAppointmentStatus(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidAppointmentStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const validStatuses = [
            'SCHEDULED',
            'CONFIRMED',
            'CHECKED_IN',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
            'NO_SHOW',
            'RESCHEDULED'
          ];
          return typeof value === 'string' && validStatuses.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid appointment status`;
        }
      }
    });
  };
}

/**
 * Validates that a value is a valid claim status
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function IsValidClaimStatus(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidClaimStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const validStatuses = [
            'SUBMITTED',
            'UNDER_REVIEW',
            'ADDITIONAL_INFO_REQUIRED',
            'APPROVED',
            'PARTIALLY_APPROVED',
            'REJECTED',
            'PAYMENT_PENDING',
            'PAYMENT_PROCESSED',
            'APPEALED'
          ];
          return typeof value === 'string' && validStatuses.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid claim status`;
        }
      }
    });
  };
}

/**
 * Validates that an event has valid metadata
 * 
 * @param validationOptions Additional validation options
 * @returns PropertyDecorator
 */
export function HasValidEventMetadata(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'hasValidEventMetadata',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any) {
          if (!value || typeof value !== 'object') {
            return false;
          }
          
          const metadata = value as EventMetadataDto;
          const errors = await validate(metadata);
          return errors.length === 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain valid event metadata`;
        }
      }
    });
  };
}

/**
 * Utility function to format validation errors into a standardized structure
 * 
 * @param errors Array of validation errors from class-validator
 * @returns Formatted validation errors
 */
export function formatValidationErrors(errors: any[]): ValidationError[] {
  return errors.map(error => {
    const formattedError: ValidationError = {
      property: error.property,
      errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
      constraints: error.constraints
    };
    
    if (error.children && error.children.length > 0) {
      formattedError.children = formatValidationErrors(error.children);
    }
    
    return formattedError;
  });
}

/**
 * Utility function to validate an object against its class-validator decorators
 * 
 * @param object The object to validate
 * @param options Additional validation options
 * @returns Promise resolving to validation errors or null if valid
 */
export async function validateObject(object: any, options?: any): Promise<ValidationError[] | null> {
  const errors = await validate(object, options);
  
  if (errors.length === 0) {
    return null;
  }
  
  return formatValidationErrors(errors);
}

/**
 * Utility function to check if a value is a valid UUID
 * 
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid UUID
 */
export function isUUID(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Utility function to check if a value is a valid ISO 8601 date string
 * 
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid ISO 8601 date string
 */
export function isISODate(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  try {
    const date = new Date(value);
    return !isNaN(date.getTime()) && value === date.toISOString();
  } catch (e) {
    return false;
  }
}

/**
 * Utility function to check if a value is a valid journey name
 * 
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid journey name
 */
export function isValidJourney(value: any): boolean {
  const validJourneys = ['health', 'care', 'plan', 'user', 'gamification'];
  return typeof value === 'string' && validJourneys.includes(value.toLowerCase());
}

/**
 * Utility function to check if a value is a valid event type for a given journey
 * 
 * @param value The value to check
 * @param journey The journey to validate against
 * @returns Boolean indicating if the value is a valid event type for the journey
 */
export function isValidEventType(value: any, journey: string): boolean {
  if (typeof value !== 'string' || typeof journey !== 'string') {
    return false;
  }
  
  switch (journey.toLowerCase()) {
    case 'health':
      return [
        'HEALTH_METRIC_RECORDED',
        'HEALTH_GOAL_ACHIEVED',
        'HEALTH_GOAL_CREATED',
        'HEALTH_GOAL_UPDATED',
        'DEVICE_SYNCHRONIZED',
        'HEALTH_INSIGHT_GENERATED'
      ].includes(value);
    case 'care':
      return [
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_COMPLETED',
        'APPOINTMENT_CANCELLED',
        'MEDICATION_ADHERENCE',
        'TELEMEDICINE_SESSION_STARTED',
        'TELEMEDICINE_SESSION_ENDED',
        'CARE_PLAN_UPDATED'
      ].includes(value);
    case 'plan':
      return [
        'CLAIM_SUBMITTED',
        'CLAIM_UPDATED',
        'CLAIM_APPROVED',
        'CLAIM_REJECTED',
        'BENEFIT_UTILIZED',
        'PLAN_SELECTED',
        'PLAN_COMPARED'
      ].includes(value);
    case 'user':
      return [
        'USER_REGISTERED',
        'USER_LOGGED_IN',
        'USER_PROFILE_UPDATED',
        'USER_PREFERENCES_UPDATED'
      ].includes(value);
    case 'gamification':
      return [
        'ACHIEVEMENT_UNLOCKED',
        'REWARD_EARNED',
        'REWARD_REDEEMED',
        'LEADERBOARD_UPDATED',
        'LEVEL_UP'
      ].includes(value);
    default:
      return false;
  }
}