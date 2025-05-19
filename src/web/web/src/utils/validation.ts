import { z } from 'zod'; // v3.22.4 - Schema validation library
import { validationSchemas } from '@austa/interfaces/common/validation';

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Fu00edsicas) number.
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF is valid, false otherwise
 */
export function validateCPF(cpf: string): boolean {
  // Use the shared CPF validation schema if available, otherwise fall back to local implementation
  if (validationSchemas?.cpf) {
    const result = validationSchemas.cpf.safeParse(cpf);
    return result.success;
  }
  
  // Remove non-digit characters
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Check if it has 11 digits
  if (cleanCpf.length !== 11) {
    return false;
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return false;
  }
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Check if calculated verification digits match the CPF's verification digits
  return (
    parseInt(cleanCpf.charAt(9)) === digit1 &&
    parseInt(cleanCpf.charAt(10)) === digit2
  );
}

/**
 * Validates an email address format.
 * 
 * @param email - The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Use the shared email validation schema if available, otherwise fall back to local implementation
  if (validationSchemas?.email) {
    const result = validationSchemas.email.safeParse(email);
    return result.success;
  }
  
  // Regular expression for email validation
  // This pattern checks for standard email format with proper domain structure
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(email);
}

/**
 * Checks if a password meets strength criteria:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param password - The password to check
 * @returns True if the password meets all criteria, false otherwise
 */
export function isStrongPassword(password: string): boolean {
  // Use the shared password validation schema if available, otherwise fall back to local implementation
  if (validationSchemas?.password) {
    const result = validationSchemas.password.safeParse(password);
    return result.success;
  }
  
  // Check minimum length
  if (password.length < 8) {
    return false;
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return false;
  }
  
  // Check for at least one special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    return false;
  }
  
  return true;
}

/**
 * Type-safe validation function that uses Zod schemas for validation
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with validation result and optional error messages
 */
export function validateWithSchema<T>(schema: z.ZodType<T>, data: unknown): { 
  isValid: boolean; 
  data?: T; 
  errors?: z.ZodError;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      isValid: true,
      data: result.data
    };
  }
  
  return {
    isValid: false,
    errors: result.error
  };
}

/**
 * Creates a validation schema for a form field with custom error messages
 * 
 * @param schema - Base Zod schema
 * @param errorMap - Custom error messages for validation failures
 * @returns Enhanced Zod schema with custom error messages
 */
export function createFieldValidator<T>(schema: z.ZodType<T>, errorMap?: z.ZodErrorMap): z.ZodType<T> {
  if (errorMap) {
    return schema.superRefine((data, ctx) => {
      const result = schema.safeParse(data);
      if (!result.success) {
        result.error.errors.forEach(err => {
          const customError = errorMap(err.code, err);
          ctx.addIssue({
            code: err.code,
            path: err.path,
            message: customError.message
          });
        });
      }
    });
  }
  
  return schema;
}