import { z } from 'zod';
import { IsEmail, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import {
  assertValid,
  careSchemas,
  createClassValidator,
  createDateSchema,
  createJourneySchemaBuilder,
  createZodSchema,
  createZodSchemaFromClass,
  createZodValidator,
  formatClassValidatorErrors,
  formatZodErrors,
  healthSchemas,
  planSchemas,
  SchemaValidationOptions,
  validateWithClassValidator,
  validateWithClassValidatorSync,
  validateWithZod,
  validateWithZodSync,
  ValidationErrorItem,
  ValidationResult
} from '../../../src/validation/schema.validator';

// Test classes for class-validator tests
class TestUser {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNumber()
  @Min(18)
  @Max(120)
  age: number;

  constructor(name: string, email: string, age: number) {
    this.name = name;
    this.email = email;
    this.age = age;
  }
}

class NestedTestObject {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  user: TestUser;

  constructor(title: string, user: TestUser) {
    this.title = title;
    this.user = user;
  }
}

// Test schemas for Zod tests
const userSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  age: z.number().min(18, { message: 'Must be at least 18 years old' }).max(120, { message: 'Must be at most 120 years old' })
});

const nestedSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  user: userSchema
});

describe('Schema Validator', () => {
  describe('createZodSchema', () => {
    it('should create a schema with default error messages', () => {
      const schema = createZodSchema(z.string().min(5));
      const result = schema.safeParse('abc');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeDefined();
      }
    });

    it('should create a schema with journey-specific error messages', () => {
      const schema = createZodSchema(z.number().min(10), 'health');
      const result = schema.safeParse(5);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Health metric');
      }
    });
  });

  describe('validateWithZod', () => {
    it('should validate valid data successfully', async () => {
      const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      const result = await validateWithZod(userSchema, validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      const result = await validateWithZod(userSchema, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(3);
      expect(result.errors?.map(e => e.path[0])).toEqual(['name', 'email', 'age']);
    });

    it('should apply journey-specific error messages', async () => {
      const schema = z.object({
        value: z.number().min(10)
      });
      
      const invalidData = { value: 5 };
      const result = await validateWithZod(schema, invalidData, { journeyId: 'health' });
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toContain('Health metric');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Create a schema that throws an error during validation
      const errorSchema = z.custom<any>(() => {
        throw new Error('Unexpected error');
      });
      
      const result = await validateWithZod(errorSchema, {});
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe('Unexpected error');
      expect(result.errors?.[0].code).toBe('validation_error');
    });
  });

  describe('validateWithZodSync', () => {
    it('should validate valid data successfully', () => {
      const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      const result = validateWithZodSync(userSchema, validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should return validation errors for invalid data', () => {
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      const result = validateWithZodSync(userSchema, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('validateWithClassValidator', () => {
    it('should validate valid data successfully', async () => {
      const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      const result = await validateWithClassValidator(TestUser, validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(TestUser);
      expect(result.data?.name).toBe('John Doe');
      expect(result.errors).toBeUndefined();
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      const result = await validateWithClassValidator(TestUser, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should apply journey-specific error messages', async () => {
      const invalidData = { name: 'John', email: 'john@example.com', age: 15 };
      const result = await validateWithClassValidator(TestUser, invalidData, { journeyId: 'health' });
      
      expect(result.success).toBe(false);
      const ageError = result.errors?.find(e => e.path.includes('age'));
      expect(ageError?.message).toContain('Health metric');
    });

    it('should handle nested validation', async () => {
      const validNestedData = {
        title: 'Test Title',
        user: { name: 'John Doe', email: 'john@example.com', age: 30 }
      };
      
      const result = await validateWithClassValidator(NestedTestObject, validNestedData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(NestedTestObject);
      expect(result.data?.user).toBeInstanceOf(TestUser);
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock plainToInstance to throw an error
      const originalPlainToInstance = plainToInstance;
      (plainToInstance as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('Transformation error');
      });
      
      const result = await validateWithClassValidator(TestUser, {});
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe('Transformation error');
      
      // Restore original function
      (plainToInstance as unknown) = originalPlainToInstance;
    });
  });

  describe('validateWithClassValidatorSync', () => {
    it('should validate valid data successfully', () => {
      const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      const result = validateWithClassValidatorSync(TestUser, validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(TestUser);
      expect(result.errors).toBeUndefined();
    });

    it('should return validation errors for invalid data', () => {
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      const result = validateWithClassValidatorSync(TestUser, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
    });
  });

  describe('formatZodErrors', () => {
    it('should format Zod errors to standardized format', () => {
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      const result = userSchema.safeParse(invalidData);
      
      if (!result.success) {
        const formattedErrors = formatZodErrors(result.error);
        
        expect(formattedErrors).toHaveLength(3);
        expect(formattedErrors[0]).toHaveProperty('path');
        expect(formattedErrors[0]).toHaveProperty('message');
        expect(formattedErrors[0]).toHaveProperty('code');
      } else {
        fail('Validation should have failed');
      }
    });
  });

  describe('formatClassValidatorErrors', () => {
    it('should format class-validator errors to standardized format', async () => {
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      const instance = plainToInstance(TestUser, invalidData);
      
      // Import the actual validate function to get real validation errors
      const { validate } = require('class-validator');
      const errors = await validate(instance);
      
      const formattedErrors = formatClassValidatorErrors(errors);
      
      expect(formattedErrors.length).toBeGreaterThan(0);
      expect(formattedErrors[0]).toHaveProperty('path');
      expect(formattedErrors[0]).toHaveProperty('message');
      expect(formattedErrors[0]).toHaveProperty('code');
    });

    it('should apply journey-specific error messages', async () => {
      const invalidData = { name: 'John', email: 'john@example.com', age: 15 };
      const instance = plainToInstance(TestUser, invalidData);
      
      // Import the actual validate function to get real validation errors
      const { validate } = require('class-validator');
      const errors = await validate(instance);
      
      const formattedErrors = formatClassValidatorErrors(errors, 'health');
      
      const ageError = formattedErrors.find(e => e.path.includes('age'));
      expect(ageError?.message).toContain('Health metric');
    });
  });

  describe('createZodSchemaFromClass', () => {
    it('should create a Zod schema from a class-validator decorated class', () => {
      const schema = createZodSchemaFromClass(TestUser);
      
      const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      
      expect(schema.safeParse(validData).success).toBe(true);
      expect(schema.safeParse(invalidData).success).toBe(false);
    });
  });

  describe('createClassValidator', () => {
    it('should create a validation function for a class', async () => {
      const validator = createClassValidator(TestUser);
      
      const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      
      const validResult = await validator(validData);
      const invalidResult = await validator(invalidData);
      
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('createZodValidator', () => {
    it('should create a validation function for a Zod schema', async () => {
      const validator = createZodValidator(userSchema);
      
      const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      
      const validResult = await validator(validData);
      const invalidResult = await validator(invalidData);
      
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('createJourneySchemaBuilder', () => {
    it('should create journey-specific schema builders', () => {
      const healthBuilder = createJourneySchemaBuilder('health');
      
      // Test string schema
      const stringSchema = healthBuilder.string({ min: 5 });
      expect(stringSchema.safeParse('abc').success).toBe(false);
      expect(stringSchema.safeParse('abcdef').success).toBe(true);
      
      // Test number schema
      const numberSchema = healthBuilder.number({ min: 10 });
      expect(numberSchema.safeParse(5).success).toBe(false);
      expect(numberSchema.safeParse(15).success).toBe(true);
      
      // Test date schema
      const dateSchema = healthBuilder.date();
      expect(dateSchema.safeParse(new Date()).success).toBe(true);
      expect(dateSchema.safeParse('not a date').success).toBe(false);
      
      // Test email schema
      const emailSchema = healthBuilder.email();
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('not-an-email').success).toBe(false);
    });

    it('should apply journey-specific error messages', () => {
      const healthBuilder = createJourneySchemaBuilder('health');
      const careBuilder = createJourneySchemaBuilder('care');
      const planBuilder = createJourneySchemaBuilder('plan');
      
      // Create schemas for each journey
      const healthNumberSchema = healthBuilder.number({ min: 10 });
      const careNumberSchema = careBuilder.number({ min: 10 });
      const planNumberSchema = planBuilder.number({ min: 10 });
      
      // Parse with invalid data to get error messages
      const healthResult = healthNumberSchema.safeParse(5);
      const careResult = careNumberSchema.safeParse(5);
      const planResult = planNumberSchema.safeParse(5);
      
      // Check that error messages are journey-specific
      if (!healthResult.success && !careResult.success && !planResult.success) {
        expect(healthResult.error.issues[0].message).toContain('Health metric');
        expect(careResult.error.issues[0].message).not.toContain('Health metric');
        expect(planResult.error.issues[0].message).toContain('Benefit amount');
      } else {
        fail('Validation should have failed for all journeys');
      }
    });
  });

  describe('Pre-configured journey schema builders', () => {
    it('should provide pre-configured schema builders for each journey', () => {
      // Test health schemas
      const healthStringSchema = healthSchemas.string({ min: 5 });
      expect(healthStringSchema.safeParse('abc').success).toBe(false);
      expect(healthStringSchema.safeParse('abcdef').success).toBe(true);
      
      // Test care schemas
      const careEmailSchema = careSchemas.email();
      expect(careEmailSchema.safeParse('test@example.com').success).toBe(true);
      expect(careEmailSchema.safeParse('not-an-email').success).toBe(false);
      
      // Test plan schemas
      const planNumberSchema = planSchemas.number({ min: 10 });
      expect(planNumberSchema.safeParse(5).success).toBe(false);
      expect(planNumberSchema.safeParse(15).success).toBe(true);
    });
  });

  describe('assertValid', () => {
    it('should return validated data when valid', () => {
      const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      const result = assertValid(validData, userSchema);
      
      expect(result).toEqual(validData);
    });

    it('should throw an error with details when invalid', () => {
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      
      expect(() => assertValid(invalidData, userSchema)).toThrow();
      try {
        assertValid(invalidData, userSchema);
      } catch (error) {
        expect(error.message).toContain('name');
        expect(error.message).toContain('email');
        expect(error.message).toContain('age');
      }
    });

    it('should use custom error message when provided', () => {
      const invalidData = { name: '', email: 'not-an-email', age: 15 };
      const customMessage = 'Custom validation error';
      
      try {
        assertValid(invalidData, userSchema, customMessage);
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });
  });

  describe('createDateSchema', () => {
    it('should validate and transform string dates', () => {
      const dateSchema = createDateSchema();
      
      const result = dateSchema.safeParse('2023-01-01');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Date);
        expect(result.data.getFullYear()).toBe(2023);
      }
    });

    it('should validate and transform numeric timestamps', () => {
      const dateSchema = createDateSchema();
      const timestamp = new Date('2023-01-01').getTime();
      
      const result = dateSchema.safeParse(timestamp);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Date);
        expect(result.data.getFullYear()).toBe(2023);
      }
    });

    it('should validate Date objects', () => {
      const dateSchema = createDateSchema();
      const date = new Date('2023-01-01');
      
      const result = dateSchema.safeParse(date);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Date);
        expect(result.data.getFullYear()).toBe(2023);
      }
    });

    it('should reject invalid dates', () => {
      const dateSchema = createDateSchema();
      
      expect(dateSchema.safeParse('not a date').success).toBe(false);
      expect(dateSchema.safeParse('2023-13-01').success).toBe(false); // Invalid month
      expect(dateSchema.safeParse(NaN).success).toBe(false);
    });

    it('should enforce min/max date constraints', () => {
      const minDate = new Date('2023-01-01');
      const maxDate = new Date('2023-12-31');
      const dateSchema = createDateSchema({ min: minDate, max: maxDate });
      
      // Valid date within range
      expect(dateSchema.safeParse('2023-06-15').success).toBe(true);
      
      // Invalid dates outside range
      expect(dateSchema.safeParse('2022-12-31').success).toBe(false);
      expect(dateSchema.safeParse('2024-01-01').success).toBe(false);
    });

    it('should support optional dates', () => {
      const dateSchema = createDateSchema({ required: false });
      
      expect(dateSchema.safeParse(undefined).success).toBe(true);
    });
  });
});