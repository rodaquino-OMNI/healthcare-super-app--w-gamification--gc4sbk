/**
 * @file validation.ts
 * @description Specialized validation utilities and decorators for event validation beyond
 * what's available in standard class-validator. Includes custom validators for journey-specific
 * fields, complex object validation, conditional validation logic, and more.
 * 
 * This file centralizes validation logic that's reused across multiple event DTOs and ensures
 * consistent validation behavior across the event processing pipeline.
 */

import { 
  registerDecorator, 
  ValidationOptions, 
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  validate,
  validateSync,
  Validator
} from 'class-validator';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { ZodSchema, z } from 'zod';
import { EventError, EventValidationError, EventErrorContext, EventProcessingStage } from '../errors/event-errors';
import { ValidationIssue, ValidationResult, ValidationResultFactory, ValidationSeverity } from '../interfaces/event-validation.interface';

// ===================================================================
// Custom Validator Constraints
// ===================================================================

/**
 * Validator constraint for checking if a value is a valid ISO-8601 duration string
 * Example: 'PT1H30M' (1 hour and 30 minutes)
 */
@ValidatorConstraint({ name: 'isIsoDuration', async: false })
export class IsIsoDurationConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    // ISO 8601 duration regex pattern
    // P is the duration designator, followed by:
    // nY - number of years
    // nM - number of months
    // nW - number of weeks
    // nD - number of days
    // T - time designator, followed by:
    // nH - number of hours
    // nM - number of minutes
    // nS - number of seconds
    const pattern = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
    return pattern.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid ISO 8601 duration string (e.g., 'PT1H30M')`;
  }
}

/**
 * Validator constraint for checking if a value is within a physiologically plausible range
 * for health metrics (e.g., heart rate, blood pressure, weight)
 */
@ValidatorConstraint({ name: 'isPhysiologicallyPlausible', async: false })
export class IsPhysiologicallyPlausibleConstraint implements ValidatorConstraintInterface {
  // Ranges for common health metrics
  private readonly ranges: Record<string, { min: number; max: number }> = {
    // Heart rate in BPM
    heartRate: { min: 30, max: 220 },
    // Blood pressure systolic in mmHg
    bloodPressureSystolic: { min: 70, max: 250 },
    // Blood pressure diastolic in mmHg
    bloodPressureDiastolic: { min: 40, max: 150 },
    // Weight in kg
    weight: { min: 2, max: 500 },
    // Height in cm
    height: { min: 30, max: 250 },
    // Body temperature in Celsius
    temperatureCelsius: { min: 32, max: 43 },
    // Blood glucose in mg/dL
    bloodGlucose: { min: 20, max: 600 },
    // Oxygen saturation in percentage
    oxygenSaturation: { min: 50, max: 100 },
    // Respiratory rate in breaths per minute
    respiratoryRate: { min: 4, max: 60 },
    // Steps per day
    stepsDaily: { min: 0, max: 100000 },
    // Sleep duration in hours
    sleepHours: { min: 0, max: 24 },
    // Body fat percentage
    bodyFatPercentage: { min: 1, max: 60 },
    // Body mass index
    bmi: { min: 10, max: 60 }
  };

  validate(value: any, args: ValidationArguments): boolean {
    if (typeof value !== 'number') return false;
    
    const [metricType] = args.constraints;
    if (!metricType || !this.ranges[metricType]) {
      throw new Error(`Unknown metric type: ${metricType}`);
    }
    
    const { min, max } = this.ranges[metricType];
    return value >= min && value <= max;
  }

  defaultMessage(args: ValidationArguments): string {
    const [metricType] = args.constraints;
    const { min, max } = this.ranges[metricType] || { min: 0, max: 0 };
    return `${args.property} must be within physiologically plausible range for ${metricType} (${min} - ${max})`;
  }
}

/**
 * Validator constraint for checking if a value is a valid medication dosage
 * with unit validation
 */
@ValidatorConstraint({ name: 'isValidMedicationDosage', async: false })
export class IsValidMedicationDosageConstraint implements ValidatorConstraintInterface {
  // Valid medication units
  private readonly validUnits = [
    // Weight-based units
    'mg', 'g', 'mcg', 'kg',
    // Volume-based units
    'ml', 'l', 'cc',
    // International units
    'IU', 'mIU',
    // Percentage
    '%',
    // Count-based units
    'tablet', 'capsule', 'pill', 'drop', 'spray', 'patch',
    // Other common units
    'dose', 'unit', 'application'
  ];

  validate(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    
    // Check if value has amount and unit properties
    if (!('amount' in value) || !('unit' in value)) return false;
    
    // Check if amount is a positive number
    if (typeof value.amount !== 'number' || value.amount <= 0) return false;
    
    // Check if unit is a valid medication unit
    if (typeof value.unit !== 'string' || !this.validUnits.includes(value.unit.toLowerCase())) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid medication dosage with a positive amount and valid unit`;
  }
}

/**
 * Validator constraint for checking if a value is a valid currency amount
 * with currency code validation
 */
@ValidatorConstraint({ name: 'isValidCurrencyAmount', async: false })
export class IsValidCurrencyAmountConstraint implements ValidatorConstraintInterface {
  // ISO 4217 currency codes (subset of common currencies)
  private readonly validCurrencyCodes = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'BRL', 'INR'
  ];

  validate(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    
    // Check if value has amount and currency properties
    if (!('amount' in value) || !('currency' in value)) return false;
    
    // Check if amount is a number (can be negative for refunds)
    if (typeof value.amount !== 'number') return false;
    
    // Check if currency is a valid ISO 4217 currency code
    if (typeof value.currency !== 'string' || 
        !this.validCurrencyCodes.includes(value.currency.toUpperCase())) {
      return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid currency amount with a numeric amount and valid currency code`;
  }
}

/**
 * Validator constraint for checking if a value is a valid appointment time
 * (future date, within business hours, etc.)
 */
@ValidatorConstraint({ name: 'isValidAppointmentTime', async: false })
export class IsValidAppointmentTimeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (!(value instanceof Date) && typeof value !== 'string') return false;
    
    const appointmentDate = typeof value === 'string' ? new Date(value) : value;
    
    // Check if date is valid
    if (isNaN(appointmentDate.getTime())) return false;
    
    // Check if date is in the future
    const now = new Date();
    if (appointmentDate <= now) return false;
    
    // Check if date is within reasonable future timeframe (e.g., 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (appointmentDate > oneYearFromNow) return false;
    
    // Check if time is within business hours (8 AM to 6 PM)
    // This can be customized based on provider availability
    const [minHour, maxHour] = args.constraints || [8, 18];
    const hour = appointmentDate.getHours();
    if (hour < minHour || hour >= maxHour) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const [minHour, maxHour] = args.constraints || [8, 18];
    return `${args.property} must be a valid future appointment time within business hours (${minHour}:00 - ${maxHour}:00)`;
  }
}

/**
 * Validator constraint for checking if a value is a valid health goal
 * with appropriate target values
 */
@ValidatorConstraint({ name: 'isValidHealthGoal', async: false })
export class IsValidHealthGoalConstraint implements ValidatorConstraintInterface {
  // Valid goal types and their value ranges
  private readonly goalTypes: Record<string, { min: number; max: number; unit: string }> = {
    'steps': { min: 1000, max: 50000, unit: 'steps' },
    'weight': { min: 30, max: 200, unit: 'kg' },
    'sleep': { min: 3, max: 12, unit: 'hours' },
    'water': { min: 1, max: 5, unit: 'liters' },
    'exercise': { min: 10, max: 300, unit: 'minutes' },
    'meditation': { min: 5, max: 120, unit: 'minutes' },
    'calories': { min: 500, max: 5000, unit: 'kcal' }
  };

  validate(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    
    // Check if value has type and target properties
    if (!('type' in value) || !('target' in value)) return false;
    
    // Check if type is a valid goal type
    if (typeof value.type !== 'string' || !this.goalTypes[value.type]) return false;
    
    // Check if target is a number within valid range for the goal type
    if (typeof value.target !== 'number') return false;
    
    const { min, max } = this.goalTypes[value.type];
    if (value.target < min || value.target > max) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid health goal with appropriate target values`;
  }
}

/**
 * Validator constraint for checking if a value is a valid benefit type
 * with appropriate benefit details
 */
@ValidatorConstraint({ name: 'isValidBenefitType', async: false })
export class IsValidBenefitTypeConstraint implements ValidatorConstraintInterface {
  // Valid benefit categories and types
  private readonly benefitCategories = {
    'medical': ['consultation', 'hospitalization', 'surgery', 'emergency', 'preventive'],
    'dental': ['cleaning', 'fillings', 'orthodontics', 'extraction', 'root-canal'],
    'vision': ['exam', 'glasses', 'contacts', 'laser-surgery'],
    'pharmacy': ['prescription', 'otc', 'specialty'],
    'wellness': ['gym', 'nutrition', 'mental-health', 'alternative-medicine'],
    'telehealth': ['video-consultation', 'chat', 'remote-monitoring']
  };

  validate(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    
    // Check if value has category and type properties
    if (!('category' in value) || !('type' in value)) return false;
    
    // Check if category is valid
    if (typeof value.category !== 'string' || 
        !Object.keys(this.benefitCategories).includes(value.category)) {
      return false;
    }
    
    // Check if type is valid for the category
    if (typeof value.type !== 'string' || 
        !this.benefitCategories[value.category].includes(value.type)) {
      return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid benefit with appropriate category and type`;
  }
}

// ===================================================================
// Custom Validation Decorators
// ===================================================================

/**
 * Decorator that validates if a string is a valid ISO-8601 duration
 * @param validationOptions Additional validation options
 */
export function IsIsoDuration(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isIsoDuration',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIsoDurationConstraint
    });
  };
}

/**
 * Decorator that validates if a number is within a physiologically plausible range
 * for a specific health metric type
 * @param metricType The type of health metric (e.g., 'heartRate', 'weight')
 * @param validationOptions Additional validation options
 */
export function IsPhysiologicallyPlausible(metricType: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhysiologicallyPlausible',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [metricType],
      validator: IsPhysiologicallyPlausibleConstraint
    });
  };
}

/**
 * Decorator that validates if an object is a valid medication dosage
 * @param validationOptions Additional validation options
 */
export function IsValidMedicationDosage(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidMedicationDosage',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidMedicationDosageConstraint
    });
  };
}

/**
 * Decorator that validates if an object is a valid currency amount
 * @param validationOptions Additional validation options
 */
export function IsValidCurrencyAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCurrencyAmount',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCurrencyAmountConstraint
    });
  };
}

/**
 * Decorator that validates if a date is a valid appointment time
 * @param minHour Minimum hour for appointments (default: 8)
 * @param maxHour Maximum hour for appointments (default: 18)
 * @param validationOptions Additional validation options
 */
export function IsValidAppointmentTime(
  minHour: number = 8,
  maxHour: number = 18,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidAppointmentTime',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minHour, maxHour],
      validator: IsValidAppointmentTimeConstraint
    });
  };
}

/**
 * Decorator that validates if an object is a valid health goal
 * @param validationOptions Additional validation options
 */
export function IsValidHealthGoal(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidHealthGoal',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidHealthGoalConstraint
    });
  };
}

/**
 * Decorator that validates if an object is a valid benefit type
 * @param validationOptions Additional validation options
 */
export function IsValidBenefitType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidBenefitType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidBenefitTypeConstraint
    });
  };
}

/**
 * Decorator that conditionally applies validation decorators based on a condition
 * @param condition Function that determines if validation should be applied
 * @param decorators Validation decorators to apply if condition is true
 */
export function ValidateIf(
  condition: (object: any, value: any) => boolean,
  ...decorators: PropertyDecorator[]
) {
  return function (object: Object, propertyName: string) {
    // Store original property descriptor
    const descriptor = Object.getOwnPropertyDescriptor(object, propertyName) || {
      configurable: true,
      enumerable: true
    };
    
    // Define new property with getter/setter
    Object.defineProperty(object, propertyName, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: function () {
        return descriptor.value;
      },
      set: function (value: any) {
        // Apply decorators if condition is met
        if (condition(this, value)) {
          decorators.forEach(decorator => decorator(object, propertyName));
        }
        descriptor.value = value;
      }
    });
  };
}

/**
 * Decorator that validates an object against a Zod schema
 * @param schema Zod schema to validate against
 * @param validationOptions Additional validation options
 */
export function ValidateWithZod(schema: ZodSchema, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateWithZod',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [schema],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [schema] = args.constraints as [ZodSchema];
          const result = schema.safeParse(value);
          return result.success;
        },
        defaultMessage(args: ValidationArguments) {
          const [schema] = args.constraints as [ZodSchema];
          const result = schema.safeParse(args.value);
          if (!result.success) {
            return `${args.property} validation failed: ${result.error.message}`;
          }
          return `${args.property} validation failed`;
        }
      }
    });
  };
}

/**
 * Decorator that validates if a property is valid based on the event type
 * @param eventTypeField Name of the field containing the event type
 * @param validEventTypes Array of event types for which validation should be applied
 * @param validationOptions Additional validation options
 */
export function ValidateForEventTypes(
  eventTypeField: string,
  validEventTypes: string[],
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateForEventTypes',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [eventTypeField, validEventTypes],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [eventTypeField, validEventTypes] = args.constraints;
          const eventType = (args.object as any)[eventTypeField];
          
          // Skip validation if event type is not in the list
          if (!validEventTypes.includes(eventType)) {
            return true;
          }
          
          // Validate value is present for the specified event types
          return value !== undefined && value !== null;
        },
        defaultMessage(args: ValidationArguments) {
          const [eventTypeField, validEventTypes] = args.constraints;
          return `${args.property} is required for event types: ${validEventTypes.join(', ')}`;
        }
      }
    });
  };
}

/**
 * Decorator that validates if a property is valid based on the journey
 * @param journeyField Name of the field containing the journey
 * @param validJourneys Array of journeys for which validation should be applied
 * @param validationOptions Additional validation options
 */
export function ValidateForJourneys(
  journeyField: string,
  validJourneys: string[],
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateForJourneys',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [journeyField, validJourneys],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [journeyField, validJourneys] = args.constraints;
          const journey = (args.object as any)[journeyField];
          
          // Skip validation if journey is not in the list
          if (!validJourneys.includes(journey)) {
            return true;
          }
          
          // Validate value is present for the specified journeys
          return value !== undefined && value !== null;
        },
        defaultMessage(args: ValidationArguments) {
          const [journeyField, validJourneys] = args.constraints;
          return `${args.property} is required for journeys: ${validJourneys.join(', ')}`;
        }
      }
    });
  };
}

// ===================================================================
// Validation Utility Functions
// ===================================================================

/**
 * Validates an object against a class-validator decorated class
 * @param object Object to validate
 * @param validatorClass Class with validation decorators
 * @param options Additional validation options
 * @returns Validation result
 */
export async function validateObject<T extends object>(
  object: object,
  validatorClass: ClassConstructor<T>,
  options: { journey?: string; eventType?: string } = {}
): Promise<ValidationResult> {
  try {
    // Convert plain object to class instance
    const instance = plainToInstance(validatorClass, object);
    
    // Validate instance
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    });
    
    if (errors.length === 0) {
      return ValidationResultFactory.valid(options.journey);
    }
    
    // Map validation errors to validation issues
    const issues: ValidationIssue[] = errors.flatMap(error => {
      const constraints = error.constraints || {};
      return Object.entries(constraints).map(([key, message]) => ({
        code: `VALIDATION_${key.toUpperCase()}`,
        message,
        field: error.property,
        severity: ValidationSeverity.ERROR,
        context: {
          value: error.value,
          journey: options.journey,
          eventType: options.eventType
        }
      }));
    });
    
    return ValidationResultFactory.invalid(issues, options.journey);
  } catch (error) {
    // Handle unexpected validation errors
    const issue: ValidationIssue = {
      code: 'VALIDATION_SYSTEM_ERROR',
      message: `Validation system error: ${error.message}`,
      severity: ValidationSeverity.ERROR,
      context: {
        journey: options.journey,
        eventType: options.eventType,
        error: error.toString()
      }
    };
    
    return ValidationResultFactory.invalid([issue], options.journey);
  }
}

/**
 * Validates an object against a class-validator decorated class synchronously
 * @param object Object to validate
 * @param validatorClass Class with validation decorators
 * @param options Additional validation options
 * @returns Validation result
 */
export function validateObjectSync<T extends object>(
  object: object,
  validatorClass: ClassConstructor<T>,
  options: { journey?: string; eventType?: string } = {}
): ValidationResult {
  try {
    // Convert plain object to class instance
    const instance = plainToInstance(validatorClass, object);
    
    // Validate instance
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    });
    
    if (errors.length === 0) {
      return ValidationResultFactory.valid(options.journey);
    }
    
    // Map validation errors to validation issues
    const issues: ValidationIssue[] = errors.flatMap(error => {
      const constraints = error.constraints || {};
      return Object.entries(constraints).map(([key, message]) => ({
        code: `VALIDATION_${key.toUpperCase()}`,
        message,
        field: error.property,
        severity: ValidationSeverity.ERROR,
        context: {
          value: error.value,
          journey: options.journey,
          eventType: options.eventType
        }
      }));
    });
    
    return ValidationResultFactory.invalid(issues, options.journey);
  } catch (error) {
    // Handle unexpected validation errors
    const issue: ValidationIssue = {
      code: 'VALIDATION_SYSTEM_ERROR',
      message: `Validation system error: ${error.message}`,
      severity: ValidationSeverity.ERROR,
      context: {
        journey: options.journey,
        eventType: options.eventType,
        error: error.toString()
      }
    };
    
    return ValidationResultFactory.invalid([issue], options.journey);
  }
}

/**
 * Validates an object against a Zod schema
 * @param object Object to validate
 * @param schema Zod schema
 * @param options Additional validation options
 * @returns Validation result
 */
export function validateWithZod<T extends z.ZodType>(
  object: unknown,
  schema: T,
  options: { journey?: string; eventType?: string } = {}
): ValidationResult {
  try {
    const result = schema.safeParse(object);
    
    if (result.success) {
      return ValidationResultFactory.valid(options.journey);
    }
    
    // Map Zod errors to validation issues
    const issues: ValidationIssue[] = result.error.errors.map(error => ({
      code: `VALIDATION_ZOD_${error.code}`,
      message: error.message,
      field: error.path.join('.'),
      severity: ValidationSeverity.ERROR,
      context: {
        value: error.path.length > 0 ? getValueAtPath(object, error.path) : object,
        journey: options.journey,
        eventType: options.eventType
      }
    }));
    
    return ValidationResultFactory.invalid(issues, options.journey);
  } catch (error) {
    // Handle unexpected validation errors
    const issue: ValidationIssue = {
      code: 'VALIDATION_SYSTEM_ERROR',
      message: `Zod validation error: ${error.message}`,
      severity: ValidationSeverity.ERROR,
      context: {
        journey: options.journey,
        eventType: options.eventType,
        error: error.toString()
      }
    };
    
    return ValidationResultFactory.invalid([issue], options.journey);
  }
}

/**
 * Helper function to get a value at a specific path in an object
 * @param obj Object to get value from
 * @param path Path to the value
 * @returns Value at the path or undefined
 */
function getValueAtPath(obj: any, path: (string | number)[]): any {
  return path.reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key];
  }, obj);
}

/**
 * Validates an event and throws an EventValidationError if validation fails
 * @param event Event to validate
 * @param validatorClass Class with validation decorators
 * @param options Additional validation options
 * @throws EventValidationError if validation fails
 */
export async function validateEventOrThrow<T extends object>(
  event: object,
  validatorClass: ClassConstructor<T>,
  options: { journey?: string; eventType?: string } = {}
): Promise<void> {
  const result = await validateObject(event, validatorClass, options);
  
  if (!result.isValid) {
    const errorContext: EventErrorContext = {
      eventType: options.eventType,
      processingStage: EventProcessingStage.VALIDATION,
      details: {
        validationIssues: result.issues,
        journey: options.journey
      }
    };
    
    const errorMessages = result.issues.map(issue => issue.message).join('; ');
    throw new EventValidationError(`Event validation failed: ${errorMessages}`, errorContext);
  }
}

/**
 * Validates an event synchronously and throws an EventValidationError if validation fails
 * @param event Event to validate
 * @param validatorClass Class with validation decorators
 * @param options Additional validation options
 * @throws EventValidationError if validation fails
 */
export function validateEventOrThrowSync<T extends object>(
  event: object,
  validatorClass: ClassConstructor<T>,
  options: { journey?: string; eventType?: string } = {}
): void {
  const result = validateObjectSync(event, validatorClass, options);
  
  if (!result.isValid) {
    const errorContext: EventErrorContext = {
      eventType: options.eventType,
      processingStage: EventProcessingStage.VALIDATION,
      details: {
        validationIssues: result.issues,
        journey: options.journey
      }
    };
    
    const errorMessages = result.issues.map(issue => issue.message).join('; ');
    throw new EventValidationError(`Event validation failed: ${errorMessages}`, errorContext);
  }
}

// ===================================================================
// Journey-Specific Validation Functions
// ===================================================================

/**
 * Namespace for Health journey-specific validation functions
 */
export namespace HealthValidation {
  /**
   * Validates health metric data
   * @param metricData Health metric data to validate
   * @returns Validation result
   */
  export function validateHealthMetric(metricData: any): ValidationResult {
    // Define Zod schema for health metric data
    const healthMetricSchema = z.object({
      type: z.enum([
        'heartRate', 'bloodPressure', 'weight', 'height', 'temperature',
        'bloodGlucose', 'oxygenSaturation', 'respiratoryRate', 'steps',
        'sleep', 'bodyFat', 'bmi', 'caloriesBurned', 'caloriesConsumed'
      ]),
      value: z.number(),
      unit: z.string(),
      timestamp: z.string().datetime(),
      source: z.enum(['manual', 'device', 'integration']).optional(),
      deviceId: z.string().optional()
    });
    
    return validateWithZod(metricData, healthMetricSchema, { journey: 'health', eventType: 'health.metric.recorded' });
  }
  
  /**
   * Validates health goal data
   * @param goalData Health goal data to validate
   * @returns Validation result
   */
  export function validateHealthGoal(goalData: any): ValidationResult {
    // Define Zod schema for health goal data
    const healthGoalSchema = z.object({
      type: z.enum([
        'steps', 'weight', 'sleep', 'water', 'exercise',
        'meditation', 'calories'
      ]),
      target: z.number(),
      current: z.number().optional(),
      unit: z.string(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime().optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      reminderEnabled: z.boolean().optional()
    });
    
    return validateWithZod(goalData, healthGoalSchema, { journey: 'health', eventType: 'health.goal.created' });
  }
  
  /**
   * Validates device connection data
   * @param deviceData Device connection data to validate
   * @returns Validation result
   */
  export function validateDeviceConnection(deviceData: any): ValidationResult {
    // Define Zod schema for device connection data
    const deviceConnectionSchema = z.object({
      deviceId: z.string(),
      deviceType: z.enum([
        'smartwatch', 'fitnessBand', 'smartScale', 'glucoseMeter',
        'bloodPressureMonitor', 'sleepTracker', 'smartphone'
      ]),
      manufacturer: z.string(),
      model: z.string(),
      connectionStatus: z.enum(['connected', 'disconnected', 'pairing', 'failed']),
      lastSyncTimestamp: z.string().datetime().optional(),
      permissions: z.array(z.string()).optional()
    });
    
    return validateWithZod(deviceData, deviceConnectionSchema, { journey: 'health', eventType: 'health.device.connected' });
  }
}

/**
 * Namespace for Care journey-specific validation functions
 */
export namespace CareValidation {
  /**
   * Validates appointment data
   * @param appointmentData Appointment data to validate
   * @returns Validation result
   */
  export function validateAppointment(appointmentData: any): ValidationResult {
    // Define Zod schema for appointment data
    const appointmentSchema = z.object({
      providerId: z.string(),
      specialization: z.string(),
      appointmentType: z.enum(['in-person', 'video', 'phone']),
      dateTime: z.string().datetime(),
      duration: z.number().min(5).max(180), // Duration in minutes
      reason: z.string(),
      location: z.object({
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional()
      }).optional(),
      status: z.enum([
        'scheduled', 'confirmed', 'checked-in', 'completed',
        'cancelled', 'no-show', 'rescheduled'
      ])
    });
    
    return validateWithZod(appointmentData, appointmentSchema, { journey: 'care', eventType: 'care.appointment.booked' });
  }
  
  /**
   * Validates medication data
   * @param medicationData Medication data to validate
   * @returns Validation result
   */
  export function validateMedication(medicationData: any): ValidationResult {
    // Define Zod schema for medication data
    const medicationSchema = z.object({
      medicationId: z.string(),
      name: z.string(),
      dosage: z.object({
        amount: z.number().positive(),
        unit: z.string()
      }),
      frequency: z.object({
        times: z.number().positive(),
        period: z.enum(['day', 'week', 'month'])
      }),
      schedule: z.array(z.object({
        time: z.string(), // Format: HH:MM
        taken: z.boolean().optional(),
        takenAt: z.string().datetime().optional()
      })).optional(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime().optional(),
      instructions: z.string().optional(),
      prescribedBy: z.string().optional(),
      refillReminder: z.boolean().optional()
    });
    
    return validateWithZod(medicationData, medicationSchema, { journey: 'care', eventType: 'care.medication.added' });
  }
  
  /**
   * Validates telemedicine session data
   * @param sessionData Telemedicine session data to validate
   * @returns Validation result
   */
  export function validateTelemedicineSession(sessionData: any): ValidationResult {
    // Define Zod schema for telemedicine session data
    const telemedicineSessionSchema = z.object({
      sessionId: z.string(),
      providerId: z.string(),
      appointmentId: z.string().optional(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime().optional(),
      status: z.enum([
        'scheduled', 'waiting', 'in-progress', 'completed',
        'cancelled', 'failed', 'no-show'
      ]),
      sessionType: z.enum(['video', 'audio', 'chat']),
      technicalDetails: z.object({
        platform: z.string().optional(),
        browserInfo: z.string().optional(),
        deviceInfo: z.string().optional(),
        connectionQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
      }).optional()
    });
    
    return validateWithZod(sessionData, telemedicineSessionSchema, { journey: 'care', eventType: 'care.telemedicine.started' });
  }
}

/**
 * Namespace for Plan journey-specific validation functions
 */
export namespace PlanValidation {
  /**
   * Validates claim data
   * @param claimData Claim data to validate
   * @returns Validation result
   */
  export function validateClaim(claimData: any): ValidationResult {
    // Define Zod schema for claim data
    const claimSchema = z.object({
      claimId: z.string(),
      serviceDate: z.string().datetime(),
      providerName: z.string(),
      providerId: z.string().optional(),
      serviceType: z.string(),
      diagnosisCodes: z.array(z.string()).optional(),
      procedureCodes: z.array(z.string()).optional(),
      amount: z.object({
        total: z.number().positive(),
        covered: z.number().optional(),
        patientResponsibility: z.number().optional(),
        currency: z.string().default('USD')
      }),
      status: z.enum([
        'submitted', 'in-review', 'approved', 'partially-approved',
        'denied', 'appealed', 'paid', 'cancelled'
      ]),
      documents: z.array(z.object({
        documentId: z.string(),
        documentType: z.string(),
        uploadDate: z.string().datetime()
      })).optional(),
      notes: z.string().optional()
    });
    
    return validateWithZod(claimData, claimSchema, { journey: 'plan', eventType: 'plan.claim.submitted' });
  }
  
  /**
   * Validates benefit data
   * @param benefitData Benefit data to validate
   * @returns Validation result
   */
  export function validateBenefit(benefitData: any): ValidationResult {
    // Define Zod schema for benefit data
    const benefitSchema = z.object({
      benefitId: z.string(),
      category: z.enum([
        'medical', 'dental', 'vision', 'pharmacy',
        'wellness', 'telehealth'
      ]),
      type: z.string(),
      description: z.string(),
      coverage: z.object({
        coinsurance: z.number().min(0).max(100).optional(), // Percentage
        copay: z.number().min(0).optional(),
        deductible: z.number().min(0).optional(),
        outOfPocketMax: z.number().min(0).optional(),
        currency: z.string().default('USD')
      }),
      limits: z.object({
        visitsPerYear: z.number().optional(),
        amountPerYear: z.number().optional(),
        lifetime: z.number().optional()
      }).optional(),
      network: z.enum(['in-network', 'out-of-network', 'both']).optional(),
      requiresPreauthorization: z.boolean().optional(),
      effectiveDate: z.string().datetime(),
      expirationDate: z.string().datetime().optional()
    });
    
    return validateWithZod(benefitData, benefitSchema, { journey: 'plan', eventType: 'plan.benefit.utilized' });
  }
  
  /**
   * Validates plan selection data
   * @param planData Plan selection data to validate
   * @returns Validation result
   */
  export function validatePlanSelection(planData: any): ValidationResult {
    // Define Zod schema for plan selection data
    const planSelectionSchema = z.object({
      planId: z.string(),
      planName: z.string(),
      planType: z.enum([
        'HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'Catastrophic',
        'Bronze', 'Silver', 'Gold', 'Platinum'
      ]),
      premium: z.object({
        amount: z.number().positive(),
        frequency: z.enum(['monthly', 'quarterly', 'annually']),
        currency: z.string().default('USD')
      }),
      coverage: z.object({
        individual: z.boolean(),
        family: z.boolean(),
        dependents: z.array(z.string()).optional()
      }),
      effectiveDate: z.string().datetime(),
      selectionDate: z.string().datetime(),
      previousPlanId: z.string().optional(),
      reason: z.string().optional()
    });
    
    return validateWithZod(planData, planSelectionSchema, { journey: 'plan', eventType: 'plan.plan.selected' });
  }
}

// ===================================================================
// Cross-Journey Validation Functions
// ===================================================================

/**
 * Validates event data based on journey and event type
 * @param eventData Event data to validate
 * @param journey Journey (health, care, plan)
 * @param eventType Event type
 * @returns Validation result
 */
export function validateJourneyEvent(
  eventData: any,
  journey: string,
  eventType: string
): ValidationResult {
  // Validate based on journey and event type
  switch (journey) {
    case 'health':
      return validateHealthEvent(eventData, eventType);
    case 'care':
      return validateCareEvent(eventData, eventType);
    case 'plan':
      return validatePlanEvent(eventData, eventType);
    default:
      return ValidationResultFactory.invalid([
        {
          code: 'VALIDATION_INVALID_JOURNEY',
          message: `Invalid journey: ${journey}`,
          severity: ValidationSeverity.ERROR,
          context: { journey, eventType }
        }
      ]);
  }
}

/**
 * Validates health journey event data based on event type
 * @param eventData Event data to validate
 * @param eventType Event type
 * @returns Validation result
 */
function validateHealthEvent(eventData: any, eventType: string): ValidationResult {
  // Validate based on event type
  if (eventType.startsWith('health.metric.')) {
    return HealthValidation.validateHealthMetric(eventData);
  } else if (eventType.startsWith('health.goal.')) {
    return HealthValidation.validateHealthGoal(eventData);
  } else if (eventType.startsWith('health.device.')) {
    return HealthValidation.validateDeviceConnection(eventData);
  } else {
    return ValidationResultFactory.invalid([
      {
        code: 'VALIDATION_INVALID_EVENT_TYPE',
        message: `Invalid health event type: ${eventType}`,
        severity: ValidationSeverity.ERROR,
        context: { journey: 'health', eventType }
      }
    ]);
  }
}

/**
 * Validates care journey event data based on event type
 * @param eventData Event data to validate
 * @param eventType Event type
 * @returns Validation result
 */
function validateCareEvent(eventData: any, eventType: string): ValidationResult {
  // Validate based on event type
  if (eventType.startsWith('care.appointment.')) {
    return CareValidation.validateAppointment(eventData);
  } else if (eventType.startsWith('care.medication.')) {
    return CareValidation.validateMedication(eventData);
  } else if (eventType.startsWith('care.telemedicine.')) {
    return CareValidation.validateTelemedicineSession(eventData);
  } else {
    return ValidationResultFactory.invalid([
      {
        code: 'VALIDATION_INVALID_EVENT_TYPE',
        message: `Invalid care event type: ${eventType}`,
        severity: ValidationSeverity.ERROR,
        context: { journey: 'care', eventType }
      }
    ]);
  }
}

/**
 * Validates plan journey event data based on event type
 * @param eventData Event data to validate
 * @param eventType Event type
 * @returns Validation result
 */
function validatePlanEvent(eventData: any, eventType: string): ValidationResult {
  // Validate based on event type
  if (eventType.startsWith('plan.claim.')) {
    return PlanValidation.validateClaim(eventData);
  } else if (eventType.startsWith('plan.benefit.')) {
    return PlanValidation.validateBenefit(eventData);
  } else if (eventType.startsWith('plan.plan.')) {
    return PlanValidation.validatePlanSelection(eventData);
  } else {
    return ValidationResultFactory.invalid([
      {
        code: 'VALIDATION_INVALID_EVENT_TYPE',
        message: `Invalid plan event type: ${eventType}`,
        severity: ValidationSeverity.ERROR,
        context: { journey: 'plan', eventType }
      }
    ]);
  }
}