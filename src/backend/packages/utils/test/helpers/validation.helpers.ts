/**
 * Validation Test Helpers
 * 
 * Provides test helper functions for validation utilities, including:
 * - Generators for valid and invalid data structures
 * - Schema testing helpers
 * - Assertion utilities for validation testing
 * - Helpers for testing common validators (emails, URLs, phone numbers)
 * 
 * These helpers facilitate testing of schema validation, object validation,
 * and type-specific validation functions across all journey services.
 */

import { z, ZodType, ZodError } from 'zod';
import { ValidationResult } from '../../src/validation';
import { randomUtils } from './common.helpers';

/**
 * Interface for test data generation options
 */
export interface TestDataOptions {
  /** Whether to include valid data in the result */
  includeValid?: boolean;
  /** Whether to include invalid data in the result */
  includeInvalid?: boolean;
  /** Number of valid examples to generate */
  validCount?: number;
  /** Number of invalid examples to generate */
  invalidCount?: number;
  /** Journey context for journey-specific test data */
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * Interface for test data generation result
 */
export interface TestData<T> {
  /** Valid test data examples */
  valid: T[];
  /** Invalid test data examples */
  invalid: T[];
  /** Description of the test data */
  description: string;
}

/**
 * Interface for schema test options
 */
export interface SchemaTestOptions {
  /** Description of the test */
  description?: string;
  /** Whether to log validation errors */
  logErrors?: boolean;
  /** Custom error handler */
  onError?: (error: ZodError) => void;
}

/**
 * Generates test data for string validation
 * 
 * @param type The type of string data to generate
 * @param options Options for test data generation
 * @returns Test data for string validation
 * 
 * @example
 * ```ts
 * // Generate test data for email validation
 * const emailTestData = generateStringTestData('email');
 * 
 * // Test a validator with the generated data
 * emailTestData.valid.forEach(email => {
 *   expect(isValidEmail(email)).toBe(true);
 * });
 * 
 * emailTestData.invalid.forEach(email => {
 *   expect(isValidEmail(email)).toBe(false);
 * });
 * ```
 */
export function generateStringTestData(
  type: 'email' | 'url' | 'cpf' | 'cnpj' | 'phone' | 'cep' | 'rg' | 'uuid' | 'alphanumeric' | 'alphabetic' | 'numeric' | 'password',
  options: TestDataOptions = {}
): TestData<string> {
  const {
    includeValid = true,
    includeInvalid = true,
    validCount = 5,
    invalidCount = 5,
    journeyContext,
  } = options;
  
  const result: TestData<string> = {
    valid: [],
    invalid: [],
    description: `Test data for ${type} validation`,
  };
  
  if (includeValid) {
    result.valid = generateValidStrings(type, validCount, journeyContext);
  }
  
  if (includeInvalid) {
    result.invalid = generateInvalidStrings(type, invalidCount, journeyContext);
  }
  
  return result;
}

/**
 * Generates valid string examples for the specified type
 * 
 * @param type The type of string to generate
 * @param count The number of examples to generate
 * @param journeyContext Optional journey context
 * @returns An array of valid string examples
 */
function generateValidStrings(
  type: string,
  count: number,
  journeyContext?: 'health' | 'care' | 'plan'
): string[] {
  const examples: string[] = [];
  
  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'email':
        if (journeyContext === 'health') {
          examples.push(`saude${i}@exemplo.com.br`);
        } else if (journeyContext === 'care') {
          examples.push(`cuidados${i}@exemplo.com.br`);
        } else if (journeyContext === 'plan') {
          examples.push(`plano${i}@exemplo.com.br`);
        } else {
          examples.push(`user${i}@example.com`);
          examples.push(`usuario${i}@exemplo.com.br`);
        }
        break;
      case 'url':
        examples.push(`https://example.com/path${i}`);
        examples.push(`https://exemplo.com.br/caminho${i}`);
        break;
      case 'cpf':
        // Use the randomUtils.cpf() function from common.helpers.ts
        examples.push(randomUtils.cpf());
        break;
      case 'cnpj':
        // Generate valid CNPJ
        examples.push(generateValidCNPJ());
        break;
      case 'phone':
        examples.push(`+5511987654${i.toString().padStart(3, '0')}`);
        examples.push(`(11) 98765-4${i.toString().padStart(3, '0')}`);
        break;
      case 'cep':
        examples.push(`01311-00${i}`);
        examples.push(`0131100${i}`);
        break;
      case 'rg':
        examples.push(`12.345.678-${i}`);
        examples.push(`12345678${i}`);
        break;
      case 'uuid':
        examples.push(`123e4567-e89b-12d3-a456-42661417400${i}`);
        break;
      case 'alphanumeric':
        examples.push(`abc123${i}`);
        break;
      case 'alphabetic':
        examples.push(`abcDEF${i}`);
        break;
      case 'numeric':
        examples.push(`12345${i}`);
        break;
      case 'password':
        examples.push(`StrongP@ss${i}123`);
        break;
      default:
        examples.push(`example${i}`);
    }
  }
  
  return examples;
}

/**
 * Generates invalid string examples for the specified type
 * 
 * @param type The type of string to generate
 * @param count The number of examples to generate
 * @param journeyContext Optional journey context
 * @returns An array of invalid string examples
 */
function generateInvalidStrings(
  type: string,
  count: number,
  journeyContext?: 'health' | 'care' | 'plan'
): string[] {
  const examples: string[] = [];
  
  // Common invalid examples for all types
  const commonInvalid = ['', ' ', null, undefined, '   '];
  
  // Add type-specific invalid examples
  const typeSpecificInvalid: Record<string, string[]> = {
    'email': [
      'invalid',
      'user@',
      '@example.com',
      'user@example',
      'user@.com',
      'user@example..com',
    ],
    'url': [
      'invalid',
      'http://',
      'example.com',
      'http://localhost',
      'ftp://example.com',
      'http://.com',
    ],
    'cpf': [
      '123.456.789-00', // Invalid verification digits
      '111.111.111-11', // Repeated digits
      '123.456.789',    // Incomplete
      '123456789012',   // Too long
      'abc.def.ghi-jk',  // Non-numeric
    ],
    'cnpj': [
      '12.345.678/0001-00', // Invalid verification digits
      '11.111.111/1111-11', // Repeated digits
      '12.345.678/0001',    // Incomplete
      '123456789012345',    // Too long
      'ab.cde.fgh/ijkl-mn',  // Non-numeric
    ],
    'phone': [
      '123',              // Too short
      '1234567890123456', // Too long
      '+1234',            // Invalid country code
      '(11) 1234-567',    // Incomplete
      'abc-def-ghij',      // Non-numeric
    ],
    'cep': [
      '1234',         // Too short
      '123456789',     // Too long
      '00000-000',     // Invalid (all zeros)
      'abcde-fgh',      // Non-numeric
    ],
    'rg': [
      '123',          // Too short
      '12345678901',   // Too long
      'abc.def.ghi-j',  // Non-numeric
    ],
    'uuid': [
      '123e4567-e89b-12d3-a456', // Incomplete
      '123e4567-e89b-X2d3-a456-426614174000', // Invalid character
      '123e4567e89b12d3a456426614174000', // Missing hyphens
    ],
    'alphanumeric': [
      'abc-123',  // Contains non-alphanumeric
      'abc_123',  // Contains underscore
      'abc 123',  // Contains space
    ],
    'alphabetic': [
      'abc123',   // Contains numbers
      'abc-def',  // Contains hyphen
      'abc def',  // Contains space
    ],
    'numeric': [
      'abc123',   // Contains letters
      '123-456',  // Contains hyphen
      '123 456',  // Contains space
    ],
    'password': [
      'password',      // No uppercase, number, or special char
      'Password',      // No number or special char
      'Password1',     // No special char
      'Pass@',         // Too short
    ],
  };
  
  // Add common invalid examples first
  examples.push(...commonInvalid.slice(0, Math.min(count, commonInvalid.length)));
  
  // Add type-specific invalid examples
  if (typeSpecificInvalid[type]) {
    examples.push(...typeSpecificInvalid[type].slice(0, count - examples.length));
  }
  
  // If we still need more examples, generate random invalid strings
  while (examples.length < count) {
    examples.push(`invalid_${type}_${randomUtils.string(5)}`);
  }
  
  return examples;
}

/**
 * Generates a valid CNPJ (Brazilian company ID)
 * 
 * @returns A valid CNPJ string
 */
function generateValidCNPJ(): string {
  // Generate 12 random digits
  const digits: number[] = [];
  for (let i = 0; i < 12; i++) {
    digits.push(randomUtils.integer(0, 9));
  }
  
  // Calculate first verification digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  digits.push(digit1);
  
  // Calculate second verification digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  digits.push(digit2);
  
  // Format CNPJ
  const cnpj = digits.join('');
  return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5, 8)}/${cnpj.substring(8, 12)}-${cnpj.substring(12)}`;
}

/**
 * Generates test data for number validation
 * 
 * @param type The type of number data to generate
 * @param options Options for test data generation
 * @returns Test data for number validation
 * 
 * @example
 * ```ts
 * // Generate test data for integer validation
 * const integerTestData = generateNumberTestData('integer');
 * 
 * // Test a validator with the generated data
 * integerTestData.valid.forEach(num => {
 *   expect(isInteger(num)).toBe(true);
 * });
 * ```
 */
export function generateNumberTestData(
  type: 'integer' | 'float' | 'positive' | 'negative' | 'range' | 'percentage' | 'currency',
  options: TestDataOptions & {
    min?: number;
    max?: number;
  } = {}
): TestData<number> {
  const {
    includeValid = true,
    includeInvalid = true,
    validCount = 5,
    invalidCount = 5,
    min = 0,
    max = 100,
    journeyContext,
  } = options;
  
  const result: TestData<number> = {
    valid: [],
    invalid: [],
    description: `Test data for ${type} validation`,
  };
  
  if (includeValid) {
    result.valid = generateValidNumbers(type, validCount, { min, max, journeyContext });
  }
  
  if (includeInvalid) {
    result.invalid = generateInvalidNumbers(type, invalidCount, { min, max, journeyContext });
  }
  
  return result;
}

/**
 * Generates valid number examples for the specified type
 * 
 * @param type The type of number to generate
 * @param count The number of examples to generate
 * @param options Additional options
 * @returns An array of valid number examples
 */
function generateValidNumbers(
  type: string,
  count: number,
  options: {
    min?: number;
    max?: number;
    journeyContext?: 'health' | 'care' | 'plan';
  } = {}
): number[] {
  const { min = 0, max = 100, journeyContext } = options;
  const examples: number[] = [];
  
  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'integer':
        examples.push(randomUtils.integer(min, max));
        break;
      case 'float':
        examples.push(min + (Math.random() * (max - min)));
        break;
      case 'positive':
        examples.push(randomUtils.integer(1, max));
        break;
      case 'negative':
        examples.push(randomUtils.integer(-max, -1));
        break;
      case 'range':
        examples.push(randomUtils.integer(min, max));
        break;
      case 'percentage':
        examples.push(randomUtils.integer(0, 100));
        break;
      case 'currency':
        // Generate currency values with 2 decimal places
        examples.push(Math.round(randomUtils.integer(min * 100, max * 100)) / 100);
        break;
      default:
        examples.push(randomUtils.integer(min, max));
    }
  }
  
  return examples;
}

/**
 * Generates invalid number examples for the specified type
 * 
 * @param type The type of number to generate
 * @param count The number of examples to generate
 * @param options Additional options
 * @returns An array of invalid number examples
 */
function generateInvalidNumbers(
  type: string,
  count: number,
  options: {
    min?: number;
    max?: number;
    journeyContext?: 'health' | 'care' | 'plan';
  } = {}
): number[] {
  const { min = 0, max = 100, journeyContext } = options;
  const examples: number[] = [];
  
  // Type-specific invalid examples
  switch (type) {
    case 'integer':
      examples.push(min + 0.5, max + 0.5);
      break;
    case 'float':
      // For float validation, NaN and Infinity are invalid
      examples.push(NaN, Infinity, -Infinity);
      break;
    case 'positive':
      examples.push(0, -1, -10, -randomUtils.integer(1, 100));
      break;
    case 'negative':
      examples.push(0, 1, 10, randomUtils.integer(1, 100));
      break;
    case 'range':
      examples.push(min - 1, max + 1, min - 10, max + 10);
      break;
    case 'percentage':
      examples.push(-1, 101, 200, -50);
      break;
    case 'currency':
      // Invalid currency values (negative or too many decimal places)
      examples.push(-0.01, -10, 0.001, 0.999);
      break;
    default:
      examples.push(NaN, Infinity, -Infinity);
  }
  
  // Ensure we have enough examples
  while (examples.length < count) {
    // Add more invalid examples based on type
    switch (type) {
      case 'integer':
        examples.push(Math.random() + randomUtils.integer(max + 1, max + 100));
        break;
      case 'positive':
        examples.push(-randomUtils.integer(1, 1000));
        break;
      case 'negative':
        examples.push(randomUtils.integer(1, 1000));
        break;
      case 'range':
        examples.push(min - randomUtils.integer(1, 100), max + randomUtils.integer(1, 100));
        break;
      default:
        examples.push(NaN);
    }
  }
  
  return examples.slice(0, count);
}

/**
 * Generates test data for date validation
 * 
 * @param type The type of date data to generate
 * @param options Options for test data generation
 * @returns Test data for date validation
 * 
 * @example
 * ```ts
 * // Generate test data for future date validation
 * const futureTestData = generateDateTestData('future');
 * 
 * // Test a validator with the generated data
 * futureTestData.valid.forEach(date => {
 *   expect(isFutureDate(date)).toBe(true);
 * });
 * ```
 */
export function generateDateTestData(
  type: 'past' | 'future' | 'range' | 'businessDay' | 'weekend' | 'holiday' | 'today',
  options: TestDataOptions & {
    referenceDate?: Date;
    startDate?: Date;
    endDate?: Date;
  } = {}
): TestData<Date> {
  const {
    includeValid = true,
    includeInvalid = true,
    validCount = 5,
    invalidCount = 5,
    referenceDate = new Date(),
    startDate = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before reference
    endDate = new Date(referenceDate.getTime() + 30 * 24 * 60 * 60 * 1000),   // 30 days after reference
    journeyContext,
  } = options;
  
  const result: TestData<Date> = {
    valid: [],
    invalid: [],
    description: `Test data for ${type} date validation`,
  };
  
  if (includeValid) {
    result.valid = generateValidDates(type, validCount, { referenceDate, startDate, endDate, journeyContext });
  }
  
  if (includeInvalid) {
    result.invalid = generateInvalidDates(type, invalidCount, { referenceDate, startDate, endDate, journeyContext });
  }
  
  return result;
}

/**
 * Generates valid date examples for the specified type
 * 
 * @param type The type of date to generate
 * @param count The number of examples to generate
 * @param options Additional options
 * @returns An array of valid date examples
 */
function generateValidDates(
  type: string,
  count: number,
  options: {
    referenceDate?: Date;
    startDate?: Date;
    endDate?: Date;
    journeyContext?: 'health' | 'care' | 'plan';
  } = {}
): Date[] {
  const {
    referenceDate = new Date(),
    startDate = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000),
    endDate = new Date(referenceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    journeyContext,
  } = options;
  
  const examples: Date[] = [];
  
  // Helper to check if a date is a weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };
  
  // Helper to check if a date is a business day (not weekend, not holiday)
  const isBusinessDay = (date: Date): boolean => {
    // This is a simplified check - in a real implementation, we would also check holidays
    return !isWeekend(date);
  };
  
  // Helper to generate a random date between two dates
  const randomDateBetween = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };
  
  // Generate dates based on type
  for (let i = 0; i < count; i++) {
    let date: Date;
    
    switch (type) {
      case 'past':
        // Generate a date in the past
        date = randomDateBetween(new Date(1970, 0, 1), referenceDate);
        break;
      case 'future':
        // Generate a date in the future
        date = randomDateBetween(referenceDate, new Date(2050, 11, 31));
        break;
      case 'range':
        // Generate a date within the specified range
        date = randomDateBetween(startDate, endDate);
        break;
      case 'businessDay':
        // Generate a business day
        do {
          date = randomDateBetween(startDate, endDate);
        } while (!isBusinessDay(date));
        break;
      case 'weekend':
        // Generate a weekend day
        do {
          date = randomDateBetween(startDate, endDate);
        } while (!isWeekend(date));
        break;
      case 'holiday':
        // For simplicity, we'll use some common Brazilian holidays
        // In a real implementation, this would be more comprehensive
        const holidays = [
          new Date(referenceDate.getFullYear(), 0, 1),   // New Year's Day
          new Date(referenceDate.getFullYear(), 3, 21),  // Tiradentes Day
          new Date(referenceDate.getFullYear(), 4, 1),   // Labor Day
          new Date(referenceDate.getFullYear(), 8, 7),   // Independence Day
          new Date(referenceDate.getFullYear(), 9, 12),  // Our Lady of Aparecida
          new Date(referenceDate.getFullYear(), 10, 2),  // All Souls' Day
          new Date(referenceDate.getFullYear(), 10, 15), // Republic Proclamation Day
          new Date(referenceDate.getFullYear(), 11, 25), // Christmas Day
        ];
        date = holidays[i % holidays.length];
        break;
      case 'today':
        // Use the reference date with slight variations
        date = new Date(referenceDate);
        date.setHours(i * 2); // Vary the hours to get different instances
        break;
      default:
        date = randomDateBetween(startDate, endDate);
    }
    
    examples.push(date);
  }
  
  return examples;
}

/**
 * Generates invalid date examples for the specified type
 * 
 * @param type The type of date to generate
 * @param count The number of examples to generate
 * @param options Additional options
 * @returns An array of invalid date examples
 */
function generateInvalidDates(
  type: string,
  count: number,
  options: {
    referenceDate?: Date;
    startDate?: Date;
    endDate?: Date;
    journeyContext?: 'health' | 'care' | 'plan';
  } = {}
): Date[] {
  const {
    referenceDate = new Date(),
    startDate = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000),
    endDate = new Date(referenceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    journeyContext,
  } = options;
  
  const examples: Date[] = [];
  
  // Helper to check if a date is a weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };
  
  // Helper to check if a date is a business day (not weekend, not holiday)
  const isBusinessDay = (date: Date): boolean => {
    // This is a simplified check - in a real implementation, we would also check holidays
    return !isWeekend(date);
  };
  
  // Helper to generate a random date between two dates
  const randomDateBetween = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };
  
  // Generate invalid dates based on type
  for (let i = 0; i < count; i++) {
    let date: Date;
    
    switch (type) {
      case 'past':
        // Future dates are invalid for past validation
        date = new Date(referenceDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        break;
      case 'future':
        // Past dates are invalid for future validation
        date = new Date(referenceDate.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
        break;
      case 'range':
        // Dates outside the range are invalid
        if (i % 2 === 0) {
          date = new Date(startDate.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
        } else {
          date = new Date(endDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        }
        break;
      case 'businessDay':
        // Weekend days are invalid for business day validation
        do {
          date = randomDateBetween(startDate, endDate);
        } while (!isWeekend(date)); // We want weekend days (invalid business days)
        break;
      case 'weekend':
        // Business days are invalid for weekend validation
        do {
          date = randomDateBetween(startDate, endDate);
        } while (!isBusinessDay(date)); // We want business days (invalid weekend days)
        break;
      case 'holiday':
        // For simplicity, we'll use some days that are definitely not holidays
        date = new Date(referenceDate.getFullYear(), 0, 2 + i);  // January 2-6 (not holidays)
        break;
      case 'today':
        // Dates other than today are invalid
        if (i % 2 === 0) {
          date = new Date(referenceDate.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
        } else {
          date = new Date(referenceDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        }
        break;
      default:
        // Invalid date object
        date = new Date('invalid date');
    }
    
    examples.push(date);
  }
  
  return examples;
}

/**
 * Generates test data for object validation
 * 
 * @param schema The schema to use for validation
 * @param options Options for test data generation
 * @returns Test data for object validation
 * 
 * @example
 * ```ts
 * // Define a schema
 * const userSchema = z.object({
 *   id: z.string().uuid(),
 *   name: z.string().min(2),
 *   email: z.string().email(),
 *   age: z.number().int().positive(),
 * });
 * 
 * // Generate test data
 * const userData = generateObjectTestData(userSchema);
 * 
 * // Test validation
 * userData.valid.forEach(user => {
 *   expect(userSchema.safeParse(user).success).toBe(true);
 * });
 * ```
 */
export function generateObjectTestData<T extends Record<string, any>>(
  schema: ZodType<T>,
  options: TestDataOptions & {
    baseObject?: Partial<T>;
    invalidFields?: Array<keyof T>;
  } = {}
): TestData<T> {
  const {
    includeValid = true,
    includeInvalid = true,
    validCount = 3,
    invalidCount = 3,
    baseObject = {},
    invalidFields = [],
    journeyContext,
  } = options;
  
  const result: TestData<T> = {
    valid: [],
    invalid: [],
    description: 'Test data for object validation',
  };
  
  if (includeValid) {
    result.valid = generateValidObjects(schema, validCount, { baseObject, journeyContext });
  }
  
  if (includeInvalid) {
    result.invalid = generateInvalidObjects(schema, invalidCount, { baseObject, invalidFields, journeyContext });
  }
  
  return result;
}

/**
 * Generates valid object examples for the specified schema
 * 
 * @param schema The schema to use for validation
 * @param count The number of examples to generate
 * @param options Additional options
 * @returns An array of valid object examples
 */
function generateValidObjects<T extends Record<string, any>>(
  schema: ZodType<T>,
  count: number,
  options: {
    baseObject?: Partial<T>;
    journeyContext?: 'health' | 'care' | 'plan';
  } = {}
): T[] {
  const { baseObject = {}, journeyContext } = options;
  const examples: T[] = [];
  
  // Extract schema shape to determine field types
  // Note: This is a simplified approach and may not work for all schema types
  const schemaShape = (schema as any)._def?.shape || {};
  
  for (let i = 0; i < count; i++) {
    const obj: Record<string, any> = { ...baseObject };
    
    // Generate values for each field based on its type
    for (const [key, fieldSchema] of Object.entries(schemaShape)) {
      if (key in obj) continue; // Skip if already in baseObject
      
      const fieldType = getZodFieldType(fieldSchema);
      obj[key] = generateValueForType(fieldType, key, i, journeyContext);
    }
    
    // Validate and add to examples if valid
    const result = schema.safeParse(obj);
    if (result.success) {
      examples.push(result.data);
    } else {
      // If validation failed, try to fix the object
      const fixedObj = fixObjectForSchema(obj, schema, result.error);
      const fixedResult = schema.safeParse(fixedObj);
      if (fixedResult.success) {
        examples.push(fixedResult.data);
      }
    }
  }
  
  // If we couldn't generate enough valid examples, fill with the base object
  while (examples.length < count) {
    const fillerObj = { ...baseObject, _filler: randomUtils.string(10) };
    examples.push(fillerObj as T);
  }
  
  return examples;
}

/**
 * Generates invalid object examples for the specified schema
 * 
 * @param schema The schema to use for validation
 * @param count The number of examples to generate
 * @param options Additional options
 * @returns An array of invalid object examples
 */
function generateInvalidObjects<T extends Record<string, any>>(
  schema: ZodType<T>,
  count: number,
  options: {
    baseObject?: Partial<T>;
    invalidFields?: Array<keyof T>;
    journeyContext?: 'health' | 'care' | 'plan';
  } = {}
): T[] {
  const { baseObject = {}, invalidFields = [], journeyContext } = options;
  const examples: T[] = [];
  
  // Extract schema shape to determine field types
  const schemaShape = (schema as any)._def?.shape || {};
  
  for (let i = 0; i < count; i++) {
    const obj: Record<string, any> = { ...baseObject };
    
    // Generate values for each field based on its type
    for (const [key, fieldSchema] of Object.entries(schemaShape)) {
      if (key in obj) continue; // Skip if already in baseObject
      
      const fieldType = getZodFieldType(fieldSchema);
      obj[key] = generateValueForType(fieldType, key, i, journeyContext);
    }
    
    // Make one or more fields invalid
    const fieldsToInvalidate = invalidFields.length > 0 
      ? invalidFields 
      : Object.keys(schemaShape).slice(0, 1 + (i % 3)); // Invalidate 1-3 fields
    
    for (const field of fieldsToInvalidate) {
      const fieldSchema = schemaShape[field];
      if (!fieldSchema) continue;
      
      const fieldType = getZodFieldType(fieldSchema);
      obj[field] = generateInvalidValueForType(fieldType, String(field), i);
    }
    
    examples.push(obj as T);
  }
  
  return examples;
}

/**
 * Gets the field type from a Zod schema
 * 
 * @param fieldSchema The Zod field schema
 * @returns The field type as a string
 */
function getZodFieldType(fieldSchema: any): string {
  if (!fieldSchema) return 'unknown';
  
  // Check for common Zod types
  if (fieldSchema._def?.typeName === 'ZodString') return 'string';
  if (fieldSchema._def?.typeName === 'ZodNumber') return 'number';
  if (fieldSchema._def?.typeName === 'ZodBoolean') return 'boolean';
  if (fieldSchema._def?.typeName === 'ZodDate') return 'date';
  if (fieldSchema._def?.typeName === 'ZodArray') return 'array';
  if (fieldSchema._def?.typeName === 'ZodObject') return 'object';
  if (fieldSchema._def?.typeName === 'ZodEnum') return 'enum';
  if (fieldSchema._def?.typeName === 'ZodUnion') return 'union';
  if (fieldSchema._def?.typeName === 'ZodOptional') {
    return getZodFieldType(fieldSchema._def?.innerType);
  }
  if (fieldSchema._def?.typeName === 'ZodNullable') {
    return getZodFieldType(fieldSchema._def?.innerType);
  }
  
  return 'unknown';
}

/**
 * Generates a value for the specified type
 * 
 * @param type The field type
 * @param fieldName The field name
 * @param index The index for generating unique values
 * @param journeyContext Optional journey context
 * @returns A value of the specified type
 */
function generateValueForType(
  type: string,
  fieldName: string,
  index: number,
  journeyContext?: 'health' | 'care' | 'plan'
): any {
  switch (type) {
    case 'string':
      // Generate string based on field name
      if (fieldName.includes('email')) {
        return generateValidStrings('email', 1, journeyContext)[0];
      }
      if (fieldName.includes('url')) {
        return generateValidStrings('url', 1)[0];
      }
      if (fieldName.includes('cpf')) {
        return generateValidStrings('cpf', 1)[0];
      }
      if (fieldName.includes('cnpj')) {
        return generateValidStrings('cnpj', 1)[0];
      }
      if (fieldName.includes('phone')) {
        return generateValidStrings('phone', 1)[0];
      }
      if (fieldName.includes('cep')) {
        return generateValidStrings('cep', 1)[0];
      }
      if (fieldName.includes('password')) {
        return generateValidStrings('password', 1)[0];
      }
      if (fieldName.includes('id') || fieldName === 'id') {
        return `id-${randomUtils.string(8)}`;
      }
      return `${fieldName}-${index}-${randomUtils.string(5)}`;
    
    case 'number':
      // Generate number based on field name
      if (fieldName.includes('age')) {
        return randomUtils.integer(18, 80);
      }
      if (fieldName.includes('price') || fieldName.includes('amount')) {
        return Math.round(randomUtils.integer(100, 10000)) / 100; // Currency-like
      }
      if (fieldName.includes('percentage')) {
        return randomUtils.integer(0, 100);
      }
      return randomUtils.integer(1, 1000);
    
    case 'boolean':
      return randomUtils.boolean();
    
    case 'date':
      return new Date(Date.now() - randomUtils.integer(0, 365) * 24 * 60 * 60 * 1000);
    
    case 'array':
      return Array.from({ length: randomUtils.integer(1, 3) }, (_, i) => 
        `item-${index}-${i}-${randomUtils.string(3)}`
      );
    
    case 'object':
      return { 
        id: `id-${randomUtils.string(8)}`,
        name: `name-${index}-${randomUtils.string(5)}`,
      };
    
    case 'enum':
      return ['ACTIVE', 'INACTIVE', 'PENDING'][randomUtils.integer(0, 2)];
    
    case 'union':
      // For union types, return a string as a safe default
      return `union-${index}-${randomUtils.string(5)}`;
    
    default:
      return `unknown-${index}-${randomUtils.string(5)}`;
  }
}

/**
 * Generates an invalid value for the specified type
 * 
 * @param type The field type
 * @param fieldName The field name
 * @param index The index for generating unique values
 * @returns An invalid value for the specified type
 */
function generateInvalidValueForType(type: string, fieldName: string, index: number): any {
  switch (type) {
    case 'string':
      // Generate invalid string based on field name
      if (fieldName.includes('email')) {
        return generateInvalidStrings('email', 1)[0];
      }
      if (fieldName.includes('url')) {
        return generateInvalidStrings('url', 1)[0];
      }
      if (fieldName.includes('cpf')) {
        return generateInvalidStrings('cpf', 1)[0];
      }
      if (fieldName.includes('cnpj')) {
        return generateInvalidStrings('cnpj', 1)[0];
      }
      if (fieldName.includes('phone')) {
        return generateInvalidStrings('phone', 1)[0];
      }
      if (fieldName.includes('cep')) {
        return generateInvalidStrings('cep', 1)[0];
      }
      if (fieldName.includes('password')) {
        return generateInvalidStrings('password', 1)[0];
      }
      // For other string fields, return a number (type mismatch)
      return index;
    
    case 'number':
      // For number fields, return a string (type mismatch)
      return `not-a-number-${index}`;
    
    case 'boolean':
      // For boolean fields, return a string (type mismatch)
      return `not-a-boolean-${index}`;
    
    case 'date':
      // For date fields, return an invalid date string
      return 'not-a-date';
    
    case 'array':
      // For array fields, return a non-array
      return `not-an-array-${index}`;
    
    case 'object':
      // For object fields, return a non-object
      return `not-an-object-${index}`;
    
    case 'enum':
      // For enum fields, return an invalid enum value
      return `INVALID_ENUM_VALUE_${index}`;
    
    case 'union':
      // For union types, return null (assuming null is not part of the union)
      return null;
    
    default:
      return null;
  }
}

/**
 * Attempts to fix an object to make it valid for a schema
 * 
 * @param obj The object to fix
 * @param schema The schema to validate against
 * @param error The validation error
 * @returns A fixed object that should pass validation
 */
function fixObjectForSchema<T extends Record<string, any>>(
  obj: Record<string, any>,
  schema: ZodType<T>,
  error: ZodError
): Record<string, any> {
  const fixedObj = { ...obj };
  
  // Extract schema shape to determine field types
  const schemaShape = (schema as any)._def?.shape || {};
  
  // Fix each error
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const fieldName = issue.path[0]?.toString() || '';
    const fieldSchema = schemaShape[fieldName];
    
    if (!fieldSchema) continue;
    
    const fieldType = getZodFieldType(fieldSchema);
    
    // Generate a valid value for this field
    fixedObj[fieldName] = generateValueForType(fieldType, fieldName, 0);
  }
  
  return fixedObj;
}

/**
 * Tests a schema with the provided test data
 * 
 * @param schema The schema to test
 * @param testData The test data to use
 * @param options Test options
 * 
 * @example
 * ```ts
 * // Define a schema
 * const emailSchema = z.string().email();
 * 
 * // Generate test data
 * const emailTestData = generateStringTestData('email');
 * 
 * // Test the schema
 * testSchema(emailSchema, emailTestData);
 * ```
 */
export function testSchema<T>(
  schema: ZodType<T>,
  testData: TestData<any>,
  options: SchemaTestOptions = {}
): void {
  const { description = 'Schema validation', logErrors = false, onError } = options;
  
  describe(description, () => {
    it('should validate valid data', () => {
      testData.valid.forEach((data, index) => {
        const result = schema.safeParse(data);
        if (!result.success && logErrors) {
          console.error(`Validation failed for valid data at index ${index}:`, data);
          console.error('Errors:', result.error.format());
        }
        expect(result.success).toBe(true);
      });
    });
    
    it('should reject invalid data', () => {
      testData.invalid.forEach((data, index) => {
        const result = schema.safeParse(data);
        if (result.success && logErrors) {
          console.error(`Validation succeeded for invalid data at index ${index}:`, data);
        }
        expect(result.success).toBe(false);
        
        if (!result.success && onError) {
          onError(result.error);
        }
      });
    });
  });
}

/**
 * Tests a validator function with the provided test data
 * 
 * @param validator The validator function to test
 * @param testData The test data to use
 * @param options Test options
 * 
 * @example
 * ```ts
 * // Define a validator function
 * const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 * 
 * // Generate test data
 * const emailTestData = generateStringTestData('email');
 * 
 * // Test the validator
 * testValidator(isValidEmail, emailTestData);
 * ```
 */
export function testValidator<T>(
  validator: (value: T) => boolean,
  testData: TestData<T>,
  options: SchemaTestOptions = {}
): void {
  const { description = 'Validator function' } = options;
  
  describe(description, () => {
    it('should validate valid data', () => {
      testData.valid.forEach((data, index) => {
        const result = validator(data);
        expect(result).toBe(true);
      });
    });
    
    it('should reject invalid data', () => {
      testData.invalid.forEach((data, index) => {
        const result = validator(data);
        expect(result).toBe(false);
      });
    });
  });
}

/**
 * Tests a validator function that returns a ValidationResult
 * 
 * @param validator The validator function to test
 * @param testData The test data to use
 * @param options Test options
 * 
 * @example
 * ```ts
 * // Define a validator function that returns a ValidationResult
 * const validateEmail = (email: string): ValidationResult => ({
 *   valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
 *   message: 'Invalid email format',
 *   value: email
 * });
 * 
 * // Generate test data
 * const emailTestData = generateStringTestData('email');
 * 
 * // Test the validator
 * testDetailedValidator(validateEmail, emailTestData);
 * ```
 */
export function testDetailedValidator<T>(
  validator: (value: T) => ValidationResult,
  testData: TestData<T>,
  options: SchemaTestOptions = {}
): void {
  const { description = 'Detailed validator function' } = options;
  
  describe(description, () => {
    it('should validate valid data', () => {
      testData.valid.forEach((data, index) => {
        const result = validator(data);
        expect(result.valid).toBe(true);
        expect(result.value).toEqual(data);
      });
    });
    
    it('should reject invalid data', () => {
      testData.invalid.forEach((data, index) => {
        const result = validator(data);
        expect(result.valid).toBe(false);
        expect(result.message).toBeTruthy();
        expect(result.value).toEqual(data);
      });
    });
  });
}

/**
 * Assertion utilities for validation testing
 */
export const validationAssertions = {
  /**
   * Asserts that a value passes validation with a validator function
   * 
   * @param value The value to validate
   * @param validator The validator function
   * @param message Optional assertion message
   * 
   * @example
   * ```ts
   * test('should validate email', () => {
   *   validationAssertions.toPassValidation('user@example.com', isValidEmail);
   * });
   * ```
   */
  toPassValidation<T>(value: T, validator: (value: T) => boolean, message?: string): void {
    const result = validator(value);
    expect(result).toBe(true, message || `Expected ${value} to pass validation`);
  },
  
  /**
   * Asserts that a value fails validation with a validator function
   * 
   * @param value The value to validate
   * @param validator The validator function
   * @param message Optional assertion message
   * 
   * @example
   * ```ts
   * test('should reject invalid email', () => {
   *   validationAssertions.toFailValidation('invalid', isValidEmail);
   * });
   * ```
   */
  toFailValidation<T>(value: T, validator: (value: T) => boolean, message?: string): void {
    const result = validator(value);
    expect(result).toBe(false, message || `Expected ${value} to fail validation`);
  },
  
  /**
   * Asserts that a value passes validation with a validator function that returns a ValidationResult
   * 
   * @param value The value to validate
   * @param validator The validator function
   * @param message Optional assertion message
   * 
   * @example
   * ```ts
   * test('should validate email', () => {
   *   validationAssertions.toPassDetailedValidation('user@example.com', validateEmail);
   * });
   * ```
   */
  toPassDetailedValidation<T>(value: T, validator: (value: T) => ValidationResult, message?: string): void {
    const result = validator(value);
    expect(result.valid).toBe(true, message || `Expected ${value} to pass validation`);
    expect(result.value).toEqual(value);
  },
  
  /**
   * Asserts that a value fails validation with a validator function that returns a ValidationResult
   * 
   * @param value The value to validate
   * @param validator The validator function
   * @param expectedMessage Optional expected error message
   * @param message Optional assertion message
   * 
   * @example
   * ```ts
   * test('should reject invalid email', () => {
   *   validationAssertions.toFailDetailedValidation('invalid', validateEmail, 'Invalid email format');
   * });
   * ```
   */
  toFailDetailedValidation<T>(
    value: T,
    validator: (value: T) => ValidationResult,
    expectedMessage?: string | RegExp,
    message?: string
  ): void {
    const result = validator(value);
    expect(result.valid).toBe(false, message || `Expected ${value} to fail validation`);
    expect(result.value).toEqual(value);
    
    if (expectedMessage) {
      if (expectedMessage instanceof RegExp) {
        expect(result.message).toMatch(expectedMessage);
      } else {
        expect(result.message).toContain(expectedMessage);
      }
    } else {
      expect(result.message).toBeTruthy();
    }
  },
  
  /**
   * Asserts that a value passes validation with a Zod schema
   * 
   * @param value The value to validate
   * @param schema The Zod schema
   * @param message Optional assertion message
   * 
   * @example
   * ```ts
   * test('should validate user', () => {
   *   const userSchema = z.object({ name: z.string(), age: z.number() });
   *   validationAssertions.toPassSchemaValidation({ name: 'Test', age: 30 }, userSchema);
   * });
   * ```
   */
  toPassSchemaValidation<T>(value: unknown, schema: ZodType<T>, message?: string): void {
    const result = schema.safeParse(value);
    if (!result.success) {
      console.error('Validation errors:', result.error.format());
    }
    expect(result.success).toBe(true, message || `Expected ${JSON.stringify(value)} to pass schema validation`);
  },
  
  /**
   * Asserts that a value fails validation with a Zod schema
   * 
   * @param value The value to validate
   * @param schema The Zod schema
   * @param expectedPath Optional expected error path
   * @param message Optional assertion message
   * 
   * @example
   * ```ts
   * test('should reject invalid user', () => {
   *   const userSchema = z.object({ name: z.string(), age: z.number() });
   *   validationAssertions.toFailSchemaValidation({ name: 'Test', age: 'thirty' }, userSchema, 'age');
   * });
   * ```
   */
  toFailSchemaValidation<T>(
    value: unknown,
    schema: ZodType<T>,
    expectedPath?: string,
    message?: string
  ): void {
    const result = schema.safeParse(value);
    expect(result.success).toBe(false, message || `Expected ${JSON.stringify(value)} to fail schema validation`);
    
    if (!result.success && expectedPath) {
      const errors = result.error.format();
      expect(errors[expectedPath]).toBeDefined(`Expected error at path '${expectedPath}'`);
    }
  },
};

/**
 * Creates a mock validator function for testing
 * 
 * @param validValues Values that should pass validation
 * @param options Options for the mock validator
 * @returns A mock validator function
 * 
 * @example
 * ```ts
 * test('should use mock validator', () => {
 *   const mockEmailValidator = createMockValidator(['user@example.com', 'test@test.com']);
 *   
 *   expect(mockEmailValidator('user@example.com')).toBe(true);
 *   expect(mockEmailValidator('invalid')).toBe(false);
 * });
 * ```
 */
export function createMockValidator<T>(
  validValues: T[],
  options: {
    alwaysValid?: boolean;
    alwaysInvalid?: boolean;
    implementation?: (value: T) => boolean;
  } = {}
): jest.Mock<boolean, [T]> {
  const { alwaysValid, alwaysInvalid, implementation } = options;
  
  const mockFn = jest.fn((value: T): boolean => {
    if (alwaysValid) return true;
    if (alwaysInvalid) return false;
    if (implementation) return implementation(value);
    return validValues.includes(value);
  });
  
  return mockFn;
}

/**
 * Creates a mock detailed validator function for testing
 * 
 * @param validValues Values that should pass validation
 * @param options Options for the mock validator
 * @returns A mock detailed validator function
 * 
 * @example
 * ```ts
 * test('should use mock detailed validator', () => {
 *   const mockEmailValidator = createMockDetailedValidator(['user@example.com'], {
 *     errorMessage: 'Invalid email format'
 *   });
 *   
 *   expect(mockEmailValidator('user@example.com').valid).toBe(true);
 *   
 *   const result = mockEmailValidator('invalid');
 *   expect(result.valid).toBe(false);
 *   expect(result.message).toBe('Invalid email format');
 * });
 * ```
 */
export function createMockDetailedValidator<T>(
  validValues: T[],
  options: {
    alwaysValid?: boolean;
    alwaysInvalid?: boolean;
    errorMessage?: string;
    implementation?: (value: T) => ValidationResult;
  } = {}
): jest.Mock<ValidationResult, [T]> {
  const { 
    alwaysValid, 
    alwaysInvalid, 
    errorMessage = 'Validation failed', 
    implementation 
  } = options;
  
  const mockFn = jest.fn((value: T): ValidationResult => {
    if (alwaysValid) return { valid: true, value };
    if (alwaysInvalid) return { valid: false, message: errorMessage, value };
    if (implementation) return implementation(value);
    
    const isValid = validValues.includes(value);
    return isValid 
      ? { valid: true, value } 
      : { valid: false, message: errorMessage, value };
  });
  
  return mockFn;
}

/**
 * Creates a mock Zod schema for testing
 * 
 * @param validValues Values that should pass validation
 * @param options Options for the mock schema
 * @returns A mock Zod schema
 * 
 * @example
 * ```ts
 * test('should use mock schema', () => {
 *   const mockUserSchema = createMockSchema([{ name: 'Test', age: 30 }], {
 *     errorMessage: 'Invalid user data'
 *   });
 *   
 *   expect(mockUserSchema.safeParse({ name: 'Test', age: 30 }).success).toBe(true);
 *   
 *   const result = mockUserSchema.safeParse({ name: 'Test' });
 *   expect(result.success).toBe(false);
 * });
 * ```
 */
export function createMockSchema<T>(
  validValues: T[],
  options: {
    alwaysValid?: boolean;
    alwaysInvalid?: boolean;
    errorMessage?: string;
  } = {}
): ZodType<T> {
  const { alwaysValid, alwaysInvalid, errorMessage = 'Validation failed' } = options;
  
  return {
    _def: { typeName: 'ZodMock' },
    
    safeParse: (value: unknown) => {
      if (alwaysValid) return { success: true, data: value as T };
      if (alwaysInvalid) {
        return {
          success: false,
          error: new ZodError([{
            code: 'custom',
            path: [],
            message: errorMessage,
          }]),
        };
      }
      
      const isValid = validValues.some(valid => 
        JSON.stringify(valid) === JSON.stringify(value)
      );
      
      if (isValid) {
        return { success: true, data: value as T };
      } else {
        return {
          success: false,
          error: new ZodError([{
            code: 'custom',
            path: [],
            message: errorMessage,
          }]),
        };
      }
    },
    
    parse: (value: unknown) => {
      const result = (this as any).safeParse(value);
      if (result.success) return result.data;
      throw result.error;
    },
  } as unknown as ZodType<T>;
}

// Export default for convenient importing
export default {
  generateStringTestData,
  generateNumberTestData,
  generateDateTestData,
  generateObjectTestData,
  testSchema,
  testValidator,
  testDetailedValidator,
  validationAssertions,
  createMockValidator,
  createMockDetailedValidator,
  createMockSchema,
};