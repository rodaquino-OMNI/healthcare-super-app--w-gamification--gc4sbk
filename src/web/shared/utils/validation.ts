/**
 * Validation utility functions for the AUSTA SuperApp
 * 
 * This file provides validation hooks and utility functions used across
 * the application to validate user input and ensure data integrity.
 * It supports both the Claims Submission process in the Plan journey
 * and the Authentication System for user registration and login.
 */

import { z } from 'zod';
import { useTranslation } from 'react-i18next';

// Import validation schemas from the centralized interfaces package
import {
  claimValidationSchema as baseClaimSchema,
  userValidationSchema as baseUserSchema,
  loginValidationSchema as baseLoginSchema,
  ValidationSchemaType,
} from '@austa/interfaces/common/validation';

// Import error types for standardized error handling
import { ValidationErrorCode } from '@austa/interfaces/common/error';

/**
 * Creates validation messages with internationalization support
 * 
 * @param t - The translation function
 * @returns An object with common validation error messages
 */
const getValidationMessages = (t: (key: string, options?: any) => string) => ({
  required: t('validation.required'),
  email: t('validation.email'),
  password: {
    min: t('validation.password.minLength', { length: 8 }),
    uppercase: t('validation.password.uppercase'),
    lowercase: t('validation.password.lowercase'),
    number: t('validation.password.number'),
    special: t('validation.password.special'),
  },
  match: t('validation.match'),
  date: {
    required: t('validation.date.required'),
    future: t('validation.date.noFuture'),
  },
  amount: {
    required: t('validation.amount.required'),
    positive: t('validation.amount.positive'),
  },
  provider: {
    required: t('validation.provider.required'),
  },
  claim: {
    type: t('validation.claim.type'),
  },
  cpf: {
    invalid: t('validation.cpf.invalid'),
  },
});

/**
 * Creates a localized version of a validation schema with custom error messages
 * 
 * @param baseSchema - The base validation schema from @austa/interfaces
 * @param messages - The localized error messages
 * @param customValidation - Optional function for additional custom validation
 * @returns A Zod schema with localized error messages
 */
const createLocalizedSchema = <T extends z.ZodTypeAny>(
  baseSchema: T, 
  messages: ReturnType<typeof getValidationMessages>,
  customValidation?: (data: z.infer<T>, ctx: z.RefinementCtx) => void
) => {
  // Make the schema partial to ensure validation runs even when not all fields are present
  // This addresses the issue where refinements don't run until all fields exist
  return baseSchema.partial()
    .superRefine((data, ctx) => {
      // Apply custom validation if provided
      if (customValidation) {
        customValidation(data as z.infer<T>, ctx);
      }
    });
};

/**
 * Hook to create the claim validation schema with localized error messages
 * 
 * @returns A Zod schema for validating claim submission data
 */
export const useClaimValidationSchema = () => {
  const { t } = useTranslation();
  const messages = getValidationMessages(t);
  
  return createLocalizedSchema(baseClaimSchema, messages, (data, ctx) => {
    // Validate procedure type
    if (data.procedureType === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_enum_value,
        options: data.procedureType,
        path: ['procedureType'],
        message: messages.claim.type,
      });
    }
    
    // Validate date
    if (data.date === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ['date'],
        message: messages.date.required,
      });
    } else if (data.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (data.date > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['date'],
          message: messages.date.future,
          params: { code: ValidationErrorCode.DATE_IN_FUTURE },
        });
      }
    }
    
    // Validate provider
    if (data.provider === undefined || (data.provider && data.provider.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['provider'],
        message: messages.provider.required,
      });
    }
    
    // Validate amount
    if (data.amount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: 'number',
        received: typeof data.amount,
        path: ['amount'],
        message: messages.amount.required,
      });
    } else if (data.amount !== undefined && data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 0,
        type: 'number',
        inclusive: false,
        path: ['amount'],
        message: messages.amount.positive,
      });
    }
  });
};

/**
 * Hook to create the user validation schema with localized error messages
 * 
 * @returns A Zod schema for validating user registration data
 */
export const useUserValidationSchema = () => {
  const { t } = useTranslation();
  const messages = getValidationMessages(t);
  
  return createLocalizedSchema(baseUserSchema, messages, (data, ctx) => {
    // Validate name
    if (data.name === undefined || (data.name && data.name.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['name'],
        message: messages.required,
      });
    }
    
    // Validate email
    if (data.email === undefined || (data.email && data.email.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['email'],
        message: messages.required,
      });
    } else if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        validation: 'email',
        path: ['email'],
        message: messages.email,
      });
    }
    
    // Validate password
    if (data.password === undefined || (data.password && data.password.length < 8)) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 8,
        type: 'string',
        inclusive: true,
        path: ['password'],
        message: messages.password.min,
      });
    } else if (data.password) {
      // Only check password requirements if a password is provided
      if (!/[A-Z]/.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_string,
          validation: 'regex',
          path: ['password'],
          message: messages.password.uppercase,
        });
      }
      
      if (!/[a-z]/.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_string,
          validation: 'regex',
          path: ['password'],
          message: messages.password.lowercase,
        });
      }
      
      if (!/[0-9]/.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_string,
          validation: 'regex',
          path: ['password'],
          message: messages.password.number,
        });
      }
      
      if (!/[^A-Za-z0-9]/.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_string,
          validation: 'regex',
          path: ['password'],
          message: messages.password.special,
        });
      }
    }
    
    // Validate confirm password
    if (data.confirmPassword === undefined || (data.confirmPassword && data.confirmPassword.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['confirmPassword'],
        message: messages.required,
      });
    } else if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      // Only check password matching if both fields are provided
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: messages.match,
        params: { code: ValidationErrorCode.PASSWORDS_DO_NOT_MATCH },
      });
    }
  });
};

/**
 * Hook to create the login validation schema with localized error messages
 * 
 * @returns A Zod schema for validating login data
 */
export const useLoginValidationSchema = () => {
  const { t } = useTranslation();
  const messages = getValidationMessages(t);
  
  return createLocalizedSchema(baseLoginSchema, messages, (data, ctx) => {
    // Validate email
    if (data.email === undefined || (data.email && data.email.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['email'],
        message: messages.required,
      });
    } else if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        validation: 'email',
        path: ['email'],
        message: messages.email,
      });
    }
    
    // Validate password
    if (data.password === undefined || (data.password && data.password.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['password'],
        message: messages.required,
      });
    }
  });
};

/**
 * Validates if a value is not empty
 * 
 * @param value - The value to check
 * @returns True if the value is not empty, false otherwise
 */
export const isNotEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Validates a CPF (Brazilian ID) format
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF format is valid, false otherwise
 */
export const isValidCPF = (cpf: string): boolean => {
  // Remove non-numeric characters
  cpf = cpf.replace(/[^\d]/g, '');

  // Must have 11 digits
  if (cpf.length !== 11) return false;

  // Check for all same digits (invalid CPF)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validate check digits
  let sum = 0;
  let remainder;
  
  // First check digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  // Second check digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

/**
 * Creates a Zod validation schema for CPF validation with localized error messages
 * 
 * @returns A Zod schema for validating CPF strings
 */
export const useCPFValidationSchema = () => {
  const { t } = useTranslation();
  const messages = getValidationMessages(t);
  
  return z.string()
    .min(1, { message: messages.required })
    .refine(isValidCPF, {
      message: messages.cpf.invalid,
      params: { code: ValidationErrorCode.INVALID_CPF }
    });
};