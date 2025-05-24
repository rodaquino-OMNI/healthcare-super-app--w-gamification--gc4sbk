/**
 * Common validation schemas and utilities for the AUSTA SuperApp
 * 
 * This file centralizes common validation patterns used across multiple domains,
 * providing reusable validation rules for IDs, dates, pagination parameters, and
 * other frequently validated fields. It ensures consistent validation behavior
 * and error messages throughout the application.
 */

import { z } from 'zod'; // v3.22.4

/**
 * Common validation error messages to ensure consistency across the application
 */
export const ValidationMessages = {
  REQUIRED: 'Este campo é obrigatório',
  INVALID_UUID: 'ID inválido',
  INVALID_DATE: 'Data inválida',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Número de telefone inválido',
  INVALID_CPF: 'CPF inválido',
  INVALID_PASSWORD: 'Senha inválida',
  INVALID_NUMBER: 'Número inválido',
  INVALID_STRING: 'Texto inválido',
  INVALID_BOOLEAN: 'Valor booleano inválido',
  INVALID_ENUM: 'Valor de enumeração inválido',
  INVALID_ARRAY: 'Lista inválida',
  INVALID_OBJECT: 'Objeto inválido',
  MIN_LENGTH: (min: number) => `Deve ter pelo menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Deve ter no máximo ${max} caracteres`,
  MIN_VALUE: (min: number) => `Deve ser maior ou igual a ${min}`,
  MAX_VALUE: (max: number) => `Deve ser menor ou igual a ${max}`,
  INVALID_FORMAT: (format: string) => `Formato inválido. Use ${format}`,
};

/**
 * Common ID validation schema
 * Used for validating UUIDs across the application
 */
export const idSchema = z.string().uuid({
  message: ValidationMessages.INVALID_UUID,
});

/**
 * Common date validation schema
 * Used for validating ISO date strings across the application
 */
export const dateSchema = z.string().datetime({
  message: ValidationMessages.INVALID_DATE,
  offset: true,
});

/**
 * Common date range validation schema
 * Used for validating date ranges across the application
 */
export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'A data de início deve ser anterior à data de fim',
    path: ['startDate'],
  }
);

/**
 * Common email validation schema
 * Used for validating email addresses across the application
 */
export const emailSchema = z.string().email({
  message: ValidationMessages.INVALID_EMAIL,
});

/**
 * Common phone validation schema
 * Used for validating Brazilian phone numbers across the application
 */
export const phoneSchema = z.string().regex(
  /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  {
    message: ValidationMessages.INVALID_PHONE,
  }
);

/**
 * Common CPF validation schema
 * Used for validating Brazilian CPF numbers across the application
 */
export const cpfSchema = z.string().regex(
  /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  {
    message: ValidationMessages.INVALID_CPF,
  }
);

/**
 * Common password validation schema
 * Used for validating passwords across the application
 * Requires at least 8 characters, one uppercase letter, one lowercase letter,
 * one number, and one special character
 */
export const passwordSchema = z.string()
  .min(8, { message: ValidationMessages.MIN_LENGTH(8) })
  .regex(/[A-Z]/, { message: 'Deve conter pelo menos uma letra maiúscula' })
  .regex(/[a-z]/, { message: 'Deve conter pelo menos uma letra minúscula' })
  .regex(/[0-9]/, { message: 'Deve conter pelo menos um número' })
  .regex(/[^A-Za-z0-9]/, { message: 'Deve conter pelo menos um caractere especial' });

/**
 * Common pagination parameters validation schema
 * Used for validating pagination parameters across the application
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1, { message: ValidationMessages.MIN_VALUE(1) }).default(1),
  limit: z.number().int().min(1, { message: ValidationMessages.MIN_VALUE(1) }).max(100, { message: ValidationMessages.MAX_VALUE(100) }).default(20),
});

/**
 * Common sorting parameters validation schema
 * Used for validating sorting parameters across the application
 */
export const sortingSchema = z.object({
  sortBy: z.string(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Common search parameters validation schema
 * Used for validating search parameters across the application
 */
export const searchSchema = z.object({
  query: z.string().min(1, { message: ValidationMessages.MIN_LENGTH(1) }),
});

/**
 * Common filter parameters validation schema
 * Used for validating filter parameters across the application
 */
export const filterSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number())]));

/**
 * Common query parameters validation schema
 * Used for validating query parameters across the application
 * Combines pagination, sorting, search, and filter schemas
 */
export const queryParamsSchema = z.object({
  pagination: paginationSchema.optional(),
  sorting: sortingSchema.optional(),
  search: searchSchema.optional(),
  filters: filterSchema.optional(),
});

/**
 * Type inference helper for Zod schemas
 * Extracts the inferred type from a Zod schema
 */
export type InferSchema<T extends z.ZodType<any, any, any>> = z.infer<T>;

/**
 * Common ID type
 * Used for typing UUIDs across the application
 */
export type ID = InferSchema<typeof idSchema>;

/**
 * Common date type
 * Used for typing ISO date strings across the application
 */
export type DateString = InferSchema<typeof dateSchema>;

/**
 * Common date range type
 * Used for typing date ranges across the application
 */
export type DateRange = InferSchema<typeof dateRangeSchema>;

/**
 * Common pagination parameters type
 * Used for typing pagination parameters across the application
 */
export type PaginationParams = InferSchema<typeof paginationSchema>;

/**
 * Common sorting parameters type
 * Used for typing sorting parameters across the application
 */
export type SortingParams = InferSchema<typeof sortingSchema>;

/**
 * Common search parameters type
 * Used for typing search parameters across the application
 */
export type SearchParams = InferSchema<typeof searchSchema>;

/**
 * Common filter parameters type
 * Used for typing filter parameters across the application
 */
export type FilterParams = InferSchema<typeof filterSchema>;

/**
 * Common query parameters type
 * Used for typing query parameters across the application
 */
export type QueryParams = InferSchema<typeof queryParamsSchema>;

/**
 * Validation utility functions
 */
export const ValidationUtils = {
  /**
   * Validates data against a schema and returns the result
   * @param schema The Zod schema to validate against
   * @param data The data to validate
   * @returns The validation result with success flag, validated data, and errors
   */
  validate: <T extends z.ZodType<any, any, any>>(schema: T, data: unknown): {
    success: boolean;
    data?: z.infer<T>;
    errors?: z.ZodError;
  } => {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error,
        };
      }
      throw error;
    }
  },

  /**
   * Validates data against a schema and returns the validated data or throws an error
   * @param schema The Zod schema to validate against
   * @param data The data to validate
   * @returns The validated data
   * @throws {z.ZodError} If validation fails
   */
  validateOrThrow: <T extends z.ZodType<any, any, any>>(schema: T, data: unknown): z.infer<T> => {
    return schema.parse(data);
  },

  /**
   * Validates data against a schema asynchronously and returns the result
   * @param schema The Zod schema to validate against
   * @param data The data to validate
   * @returns A promise that resolves to the validation result
   */
  validateAsync: async <T extends z.ZodType<any, any, any>>(
    schema: T,
    data: unknown
  ): Promise<{
    success: boolean;
    data?: z.infer<T>;
    errors?: z.ZodError;
  }> => {
    try {
      const validatedData = await schema.parseAsync(data);
      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error,
        };
      }
      throw error;
    }
  },

  /**
   * Formats Zod validation errors into a user-friendly object
   * @param error The Zod error to format
   * @returns An object with field names as keys and error messages as values
   */
  formatErrors: (error: z.ZodError): Record<string, string> => {
    const formattedErrors: Record<string, string> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      formattedErrors[path] = err.message;
    });
    return formattedErrors;
  },

  /**
   * Creates a partial schema from an existing schema
   * Makes all properties optional
   * @param schema The schema to make partial
   * @returns A new schema with all properties optional
   */
  createPartialSchema: <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    return schema.partial();
  },

  /**
   * Creates a schema that requires at least one of the specified fields
   * @param schema The base schema
   * @param keys The keys that should have at least one present
   * @returns A new schema with the specified constraint
   */
  requireAtLeastOne: <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    keys: (keyof T)[],
    errorMessage = 'Pelo menos um dos campos deve ser fornecido'
  ) => {
    return schema.refine(
      (data) => keys.some((key) => data[key as keyof typeof data] !== undefined),
      {
        message: errorMessage,
        path: [keys[0] as string],
      }
    );
  },

  /**
   * Creates a schema that requires exactly one of the specified fields
   * @param schema The base schema
   * @param keys The keys that should have exactly one present
   * @returns A new schema with the specified constraint
   */
  requireExactlyOne: <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    keys: (keyof T)[],
    errorMessage = 'Exatamente um dos campos deve ser fornecido'
  ) => {
    return schema.refine(
      (data) => keys.filter((key) => data[key as keyof typeof data] !== undefined).length === 1,
      {
        message: errorMessage,
        path: [keys[0] as string],
      }
    );
  },

  /**
   * Creates a schema that requires all or none of the specified fields
   * @param schema The base schema
   * @param keys The keys that should all be present or all be absent
   * @returns A new schema with the specified constraint
   */
  requireAllOrNone: <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    keys: (keyof T)[],
    errorMessage = 'Todos ou nenhum dos campos devem ser fornecidos'
  ) => {
    return schema.refine(
      (data) => {
        const definedCount = keys.filter((key) => data[key as keyof typeof data] !== undefined).length;
        return definedCount === 0 || definedCount === keys.length;
      },
      {
        message: errorMessage,
        path: [keys[0] as string],
      }
    );
  },

  /**
   * Creates a schema that requires fields conditionally based on another field
   * @param schema The base schema
   * @param condition The condition field and value
   * @param requiredFields The fields that are required when the condition is met
   * @returns A new schema with the specified constraint
   */
  requireWhen: <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    condition: { field: keyof T; value: any },
    requiredFields: (keyof T)[],
    errorMessage = (field: string) => `O campo ${field} é obrigatório quando ${String(condition.field)} é ${condition.value}`
  ) => {
    return schema.refine(
      (data) => {
        if (data[condition.field as keyof typeof data] === condition.value) {
          return requiredFields.every((field) => data[field as keyof typeof data] !== undefined);
        }
        return true;
      },
      (data) => ({
        message: errorMessage(String(requiredFields[0])),
        path: [requiredFields[0] as string],
      })
    );
  },
};