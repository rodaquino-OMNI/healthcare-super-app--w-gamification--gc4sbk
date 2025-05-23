/**
 * Schema Validator
 * 
 * Provides utilities for creating and working with validation schemas using Zod and class-validator.
 * This file creates a bridge between different validation approaches, allowing seamless integration
 * between schema-based validation (Zod) and decorator-based validation (class-validator).
 */

import { z, ZodError, ZodType, ZodTypeDef } from 'zod';
import { validateSync, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Error message templates for common validation scenarios
 */
export const errorMessages = {
  required: 'Campo obrigatório',
  string: {
    min: (min: number) => `Deve ter pelo menos ${min} caracteres`,
    max: (max: number) => `Deve ter no máximo ${max} caracteres`,
    email: 'Email inválido',
    url: 'URL inválida',
    regex: 'Formato inválido',
  },
  number: {
    min: (min: number) => `Deve ser maior ou igual a ${min}`,
    max: (max: number) => `Deve ser menor ou igual a ${max}`,
    integer: 'Deve ser um número inteiro',
    positive: 'Deve ser um número positivo',
    negative: 'Deve ser um número negativo',
  },
  date: {
    min: (min: Date) => `Deve ser após ${min.toLocaleDateString('pt-BR')}`,
    max: (max: Date) => `Deve ser antes de ${max.toLocaleDateString('pt-BR')}`,
  },
  array: {
    min: (min: number) => `Deve ter pelo menos ${min} itens`,
    max: (max: number) => `Deve ter no máximo ${max} itens`,
  },
  object: {
    shape: 'Formato inválido',
  },
};

/**
 * Options for creating a schema
 */
export interface SchemaOptions {
  errorMap?: z.ZodErrorMap;
  journeyId?: 'health' | 'care' | 'plan';
}

/**
 * Creates a Zod schema with pre-configured error messages
 * 
 * @param schema The Zod schema to configure
 * @param options Options for schema creation
 * @returns The configured Zod schema
 */
export function createSchema<T extends ZodType<any, ZodTypeDef, any>>(
  schema: T,
  options?: SchemaOptions
): T {
  const errorMap: z.ZodErrorMap = (issue, ctx) => {
    let message: string;
    
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.expected === 'string') {
          message = 'Deve ser um texto';
        } else if (issue.expected === 'number') {
          message = 'Deve ser um número';
        } else if (issue.expected === 'date') {
          message = 'Deve ser uma data válida';
        } else if (issue.expected === 'boolean') {
          message = 'Deve ser verdadeiro ou falso';
        } else {
          message = `Tipo inválido: esperado ${issue.expected}, recebido ${issue.received}`;
        }
        break;
      case z.ZodIssueCode.too_small:
        if (issue.type === 'string') {
          message = errorMessages.string.min(issue.minimum as number);
        } else if (issue.type === 'number') {
          message = errorMessages.number.min(issue.minimum as number);
        } else if (issue.type === 'array') {
          message = errorMessages.array.min(issue.minimum as number);
        } else if (issue.type === 'date') {
          message = errorMessages.date.min(new Date(issue.minimum as number));
        } else {
          message = `Valor muito pequeno, mínimo: ${issue.minimum}`;
        }
        break;
      case z.ZodIssueCode.too_big:
        if (issue.type === 'string') {
          message = errorMessages.string.max(issue.maximum as number);
        } else if (issue.type === 'number') {
          message = errorMessages.number.max(issue.maximum as number);
        } else if (issue.type === 'array') {
          message = errorMessages.array.max(issue.maximum as number);
        } else if (issue.type === 'date') {
          message = errorMessages.date.max(new Date(issue.maximum as number));
        } else {
          message = `Valor muito grande, máximo: ${issue.maximum}`;
        }
        break;
      case z.ZodIssueCode.invalid_string:
        if (issue.validation === 'email') {
          message = errorMessages.string.email;
        } else if (issue.validation === 'url') {
          message = errorMessages.string.url;
        } else if (issue.validation === 'regex') {
          message = errorMessages.string.regex;
        } else {
          message = 'Texto inválido';
        }
        break;
      case z.ZodIssueCode.custom:
        message = issue.message || 'Valor inválido';
        break;
      default:
        message = ctx.defaultError;
    }
    
    // Apply journey-specific error formatting if needed
    if (options?.journeyId) {
      message = formatJourneyError(message, options.journeyId);
    }
    
    return { message };
  };
  
  return schema.superRefine((data, ctx) => {
    // This is a no-op refinement that allows us to attach the error map
    return true;
  }).withErrorMap(options?.errorMap || errorMap);
}

/**
 * Formats an error message based on the journey context
 * 
 * @param message The original error message
 * @param journeyId The journey identifier
 * @returns The formatted error message
 */
function formatJourneyError(message: string, journeyId: 'health' | 'care' | 'plan'): string {
  switch (journeyId) {
    case 'health':
      return `[Saúde] ${message}`;
    case 'care':
      return `[Cuidados] ${message}`;
    case 'plan':
      return `[Plano] ${message}`;
    default:
      return message;
  }
}

/**
 * Converts a Zod validation error to a standardized format
 * 
 * @param error The Zod validation error
 * @returns A standardized error object
 */
export function formatZodError(error: ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  
  for (const issue of error.errors) {
    const path = issue.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(issue.message);
  }
  
  return formattedErrors;
}

/**
 * Converts class-validator validation errors to a standardized format
 * 
 * @param errors The class-validator validation errors
 * @returns A standardized error object
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  
  for (const error of errors) {
    const constraints = error.constraints || {};
    const messages = Object.values(constraints);
    
    if (messages.length > 0) {
      formattedErrors[error.property] = messages;
    }
    
    // Handle nested errors
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatValidationErrors(error.children);
      
      for (const [key, value] of Object.entries(nestedErrors)) {
        const nestedKey = `${error.property}.${key}`;
        formattedErrors[nestedKey] = value;
      }
    }
  }
  
  return formattedErrors;
}

/**
 * Validates data using a Zod schema
 * 
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validation result with data and errors
 */
export function validateWithZod<T>(schema: ZodType<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: formatZodError(result.error),
    };
  }
}

/**
 * Validates data using class-validator decorators
 * 
 * @param cls The class with validation decorators
 * @param data The data to validate
 * @param options Options for validation
 * @returns The validation result with data and errors
 */
export function validateWithClassValidator<T extends object>(
  cls: new () => T,
  data: object,
  options: { transformToClass?: boolean } = {}
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
} {
  const instance = options.transformToClass 
    ? plainToInstance(cls, data)
    : Object.assign(new cls(), data);
  
  const errors = validateSync(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  });
  
  if (errors.length === 0) {
    return {
      success: true,
      data: instance,
    };
  } else {
    return {
      success: false,
      errors: formatValidationErrors(errors),
    };
  }
}

/**
 * Creates a Zod schema from a class with class-validator decorators
 * 
 * @param cls The class with validation decorators
 * @param options Options for schema creation
 * @returns A Zod schema that performs the same validations
 */
export function createZodSchemaFromClass<T extends object>(
  cls: new () => T,
  options?: SchemaOptions
): ZodType<T> {
  // Create a base schema that validates using class-validator
  const baseSchema = z.custom<T>((data) => {
    const instance = plainToInstance(cls, data);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    
    return errors.length === 0;
  }, {
    message: 'Validation failed',
  });
  
  // Apply our error formatting
  return createSchema(baseSchema, options);
}

/**
 * Creates a class-validator compatible validation function from a Zod schema
 * 
 * @param schema The Zod schema to use for validation
 * @returns A validation function compatible with class-validator's custom decorator
 */
export function createValidatorFromZodSchema<T>(schema: ZodType<T>) {
  return (value: unknown): boolean => {
    const result = schema.safeParse(value);
    return result.success;
  };
}

/**
 * Creates a journey-specific schema builder with pre-configured settings
 * 
 * @param journeyId The journey identifier
 * @returns A schema builder with journey-specific configurations
 */
export function createJourneySchemaBuilder(journeyId: 'health' | 'care' | 'plan') {
  return {
    /**
     * Creates a string schema with journey-specific validations
     */
    string: (options?: { required?: boolean }) => {
      let schema = z.string({
        required_error: errorMessages.required,
        invalid_type_error: 'Deve ser um texto',
      });
      
      if (!options?.required) {
        schema = schema.optional();
      }
      
      return createSchema(schema, { journeyId });
    },
    
    /**
     * Creates a number schema with journey-specific validations
     */
    number: (options?: { required?: boolean; integer?: boolean }) => {
      let schema = z.number({
        required_error: errorMessages.required,
        invalid_type_error: 'Deve ser um número',
      });
      
      if (options?.integer) {
        schema = schema.int(errorMessages.number.integer);
      }
      
      if (!options?.required) {
        schema = schema.optional();
      }
      
      return createSchema(schema, { journeyId });
    },
    
    /**
     * Creates a date schema with journey-specific validations
     */
    date: (options?: { required?: boolean }) => {
      let schema = z.date({
        required_error: errorMessages.required,
        invalid_type_error: 'Deve ser uma data válida',
      });
      
      if (!options?.required) {
        schema = schema.optional();
      }
      
      return createSchema(schema, { journeyId });
    },
    
    /**
     * Creates an object schema with journey-specific validations
     */
    object: <T extends z.ZodRawShape>(shape: T, options?: { required?: boolean }) => {
      let schema = z.object(shape, {
        required_error: errorMessages.required,
        invalid_type_error: errorMessages.object.shape,
      });
      
      if (!options?.required) {
        schema = schema.partial();
      }
      
      return createSchema(schema, { journeyId });
    },
    
    /**
     * Creates an array schema with journey-specific validations
     */
    array: <T extends ZodType>(itemSchema: T, options?: { required?: boolean }) => {
      let schema = z.array(itemSchema, {
        required_error: errorMessages.required,
        invalid_type_error: 'Deve ser uma lista',
      });
      
      if (!options?.required) {
        schema = schema.optional();
      }
      
      return createSchema(schema, { journeyId });
    },
  };
}

/**
 * Pre-configured schema builders for each journey
 */
export const healthSchema = createJourneySchemaBuilder('health');
export const careSchema = createJourneySchemaBuilder('care');
export const planSchema = createJourneySchemaBuilder('plan');

/**
 * Common schema patterns for health journey
 */
export const healthSchemas = {
  /**
   * Schema for health metrics
   */
  metric: healthSchema.object({
    value: healthSchema.number({ required: true }),
    unit: healthSchema.string({ required: true }),
    timestamp: healthSchema.date({ required: true }),
    source: healthSchema.string({ required: true }),
  }),
  
  /**
   * Schema for health goals
   */
  goal: healthSchema.object({
    metricType: healthSchema.string({ required: true }),
    targetValue: healthSchema.number({ required: true }),
    currentValue: healthSchema.number({ required: true }),
    startDate: healthSchema.date({ required: true }),
    endDate: healthSchema.date({ required: true }),
    status: z.enum(['active', 'completed', 'failed']),
  }),
};

/**
 * Common schema patterns for care journey
 */
export const careSchemas = {
  /**
   * Schema for appointments
   */
  appointment: careSchema.object({
    providerId: careSchema.string({ required: true }),
    specialtyId: careSchema.string({ required: true }),
    date: careSchema.date({ required: true }),
    duration: careSchema.number({ required: true, integer: true }),
    type: z.enum(['in-person', 'telemedicine']),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']),
  }),
  
  /**
   * Schema for medications
   */
  medication: careSchema.object({
    name: careSchema.string({ required: true }),
    dosage: careSchema.string({ required: true }),
    frequency: careSchema.string({ required: true }),
    startDate: careSchema.date({ required: true }),
    endDate: careSchema.date(),
    instructions: careSchema.string(),
  }),
};

/**
 * Common schema patterns for plan journey
 */
export const planSchemas = {
  /**
   * Schema for insurance claims
   */
  claim: planSchema.object({
    serviceDate: planSchema.date({ required: true }),
    providerId: planSchema.string({ required: true }),
    procedureCode: planSchema.string({ required: true }),
    amount: planSchema.number({ required: true }),
    status: z.enum(['submitted', 'in-review', 'approved', 'denied']),
    documents: planSchema.array(z.string()),
  }),
  
  /**
   * Schema for benefits
   */
  benefit: planSchema.object({
    code: planSchema.string({ required: true }),
    name: planSchema.string({ required: true }),
    description: planSchema.string(),
    coveragePercentage: planSchema.number({ required: true }),
    annualLimit: planSchema.number({ integer: true }),
    usedAmount: planSchema.number({ required: true }),
  }),
};