import { z } from 'zod';
import { IsEmail, IsString, Length, validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Import the schema validator utilities that we're testing
// Note: Since the actual implementation doesn't exist yet, we're writing tests based on the expected behavior
// described in the technical specification
import {
  createZodSchema,
  validateWithZod,
  validateWithClassValidator,
  createHybridValidator,
  transformZodErrors,
  createJourneySchema,
  zodToClassValidator,
  classValidatorToZod
} from '../../../src/validation/schema.validator';

describe('Schema Validator', () => {
  describe('createZodSchema', () => {
    it('should create a valid Zod schema with default error messages', () => {
      // Arrange
      const schema = createZodSchema({
        name: z.string(),
        age: z.number().positive(),
        email: z.string().email()
      });

      // Act
      const validResult = schema.safeParse({
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      });

      const invalidResult = schema.safeParse({
        name: 'John Doe',
        age: -5,
        email: 'not-an-email'
      });

      // Assert
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        const errors = invalidResult.error.format();
        expect(errors.age?._errors).toBeDefined();
        expect(errors.email?._errors).toBeDefined();
      }
    });

    it('should create a schema with custom error messages', () => {
      // Arrange
      const schema = createZodSchema({
        name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
        age: z.number().positive({ message: 'Idade deve ser positiva' }),
        email: z.string().email({ message: 'Email inválido' })
      });

      // Act
      const invalidResult = schema.safeParse({
        name: 'Jo',
        age: -5,
        email: 'not-an-email'
      });

      // Assert
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        const errors = invalidResult.error.format();
        expect(errors.name?._errors[0]).toBe('Nome deve ter pelo menos 3 caracteres');
        expect(errors.age?._errors[0]).toBe('Idade deve ser positiva');
        expect(errors.email?._errors[0]).toBe('Email inválido');
      }
    });

    it('should support nested schemas', () => {
      // Arrange
      const addressSchema = createZodSchema({
        street: z.string(),
        city: z.string(),
        zipCode: z.string().regex(/^\d{5}-\d{3}$/, { message: 'CEP inválido' })
      });

      const userSchema = createZodSchema({
        name: z.string(),
        address: addressSchema
      });

      // Act
      const validResult = userSchema.safeParse({
        name: 'John Doe',
        address: {
          street: 'Rua das Flores',
          city: 'São Paulo',
          zipCode: '01234-567'
        }
      });

      const invalidResult = userSchema.safeParse({
        name: 'John Doe',
        address: {
          street: 'Rua das Flores',
          city: 'São Paulo',
          zipCode: '0123-567' // Invalid format
        }
      });

      // Assert
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        const errors = invalidResult.error.format();
        expect(errors.address?.zipCode?._errors[0]).toBe('CEP inválido');
      }
    });
  });

  describe('validateWithZod', () => {
    it('should validate data against a Zod schema', async () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().positive(),
        email: z.string().email()
      });

      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };

      const invalidData = {
        name: 'Jo',
        age: -5,
        email: 'not-an-email'
      };

      // Act
      const validResult = await validateWithZod(validData, schema);
      const invalidResult = await validateWithZod(invalidData, schema);

      // Assert
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validData);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.name).toBeDefined();
      expect(invalidResult.errors?.age).toBeDefined();
      expect(invalidResult.errors?.email).toBeDefined();
    });

    it('should transform data according to schema transformations', async () => {
      // Arrange
      const schema = z.object({
        name: z.string().transform(val => val.trim()),
        birthYear: z.number().transform(year => new Date().getFullYear() - year),
        email: z.string().email().toLowerCase()
      });

      const inputData = {
        name: '  John Doe  ',
        birthYear: 1990,
        email: 'John@Example.com'
      };

      // Act
      const result = await validateWithZod(inputData, schema);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.birthYear).toBeGreaterThan(30); // Age calculation
        expect(result.data.email).toBe('john@example.com');
      }
    });
  });

  describe('validateWithClassValidator', () => {
    // Define a class for testing with class-validator decorators
    class UserDto {
      @IsString()
      @Length(3, 50)
      name: string;

      @IsEmail()
      email: string;

      constructor(name: string, email: string) {
        this.name = name;
        this.email = email;
      }
    }

    it('should validate data using class-validator decorators', async () => {
      // Arrange
      const validUser = plainToInstance(UserDto, {
        name: 'John Doe',
        email: 'john@example.com'
      });

      const invalidUser = plainToInstance(UserDto, {
        name: 'Jo',
        email: 'not-an-email'
      });

      // Act
      const validResult = await validateWithClassValidator(validUser);
      const invalidResult = await validateWithClassValidator(invalidUser);

      // Assert
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validUser);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.length).toBeGreaterThan(0);
      expect(invalidResult.errors?.some(e => e.property === 'name')).toBe(true);
      expect(invalidResult.errors?.some(e => e.property === 'email')).toBe(true);
    });

    it('should format class-validator errors consistently', async () => {
      // Arrange
      const invalidUser = plainToInstance(UserDto, {
        name: 'Jo',
        email: 'not-an-email'
      });

      // Act
      const result = await validateWithClassValidator(invalidUser);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success && result.errors) {
        const formattedErrors = result.errors;
        expect(formattedErrors.some(e => e.property === 'name')).toBe(true);
        expect(formattedErrors.some(e => e.property === 'email')).toBe(true);
        
        const nameError = formattedErrors.find(e => e.property === 'name');
        const emailError = formattedErrors.find(e => e.property === 'email');
        
        expect(nameError?.constraints).toBeDefined();
        expect(emailError?.constraints).toBeDefined();
      }
    });
  });

  describe('createHybridValidator', () => {
    it('should create a validator that uses both Zod and class-validator', async () => {
      // Arrange
      class UserDto {
        @IsString()
        @Length(3, 50)
        name: string;

        @IsEmail()
        email: string;

        constructor(name: string, email: string) {
          this.name = name;
          this.email = email;
        }
      }

      const zodSchema = z.object({
        name: z.string().min(3).max(50),
        email: z.string().email(),
        age: z.number().positive().optional()
      });

      const hybridValidator = createHybridValidator(zodSchema, UserDto);

      // Act
      const validResult = await hybridValidator({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });

      const invalidResult = await hybridValidator({
        name: 'Jo',
        email: 'not-an-email',
        age: -5
      });

      // Assert
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBeDefined();
      expect(validResult.data.name).toBe('John Doe');
      expect(validResult.data.email).toBe('john@example.com');
      expect(validResult.data.age).toBe(30);
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.name).toBeDefined();
      expect(invalidResult.errors?.email).toBeDefined();
      expect(invalidResult.errors?.age).toBeDefined();
    });
  });

  describe('transformZodErrors', () => {
    it('should transform Zod errors into a consistent format', () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().positive()
      });

      const result = schema.safeParse({
        name: 'Jo',
        email: 'not-an-email',
        age: -5
      });

      // Act
      let transformedErrors;
      if (!result.success) {
        transformedErrors = transformZodErrors(result.error);
      }

      // Assert
      expect(transformedErrors).toBeDefined();
      expect(transformedErrors?.name).toBeDefined();
      expect(transformedErrors?.email).toBeDefined();
      expect(transformedErrors?.age).toBeDefined();
      expect(Array.isArray(transformedErrors?.name)).toBe(true);
      expect(Array.isArray(transformedErrors?.email)).toBe(true);
      expect(Array.isArray(transformedErrors?.age)).toBe(true);
    });

    it('should support localized error messages', () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
        email: z.string().email({ message: 'Email inválido' }),
        age: z.number().positive({ message: 'Idade deve ser positiva' })
      });

      const result = schema.safeParse({
        name: 'Jo',
        email: 'not-an-email',
        age: -5
      });

      // Act
      let transformedErrors;
      if (!result.success) {
        transformedErrors = transformZodErrors(result.error);
      }

      // Assert
      expect(transformedErrors).toBeDefined();
      expect(transformedErrors?.name[0]).toBe('Nome deve ter pelo menos 3 caracteres');
      expect(transformedErrors?.email[0]).toBe('Email inválido');
      expect(transformedErrors?.age[0]).toBe('Idade deve ser positiva');
    });
  });

  describe('createJourneySchema', () => {
    it('should create journey-specific schemas with appropriate validations', () => {
      // Arrange & Act
      const healthSchema = createJourneySchema('health', {
        metricValue: z.number().positive(),
        metricUnit: z.string(),
        timestamp: z.date()
      });

      const careSchema = createJourneySchema('care', {
        providerName: z.string(),
        specialtyCode: z.string(),
        appointmentDate: z.date()
      });

      const planSchema = createJourneySchema('plan', {
        planCode: z.string(),
        coverageLevel: z.enum(['basic', 'standard', 'premium']),
        startDate: z.date()
      });

      // Assert
      // Health journey validation
      const validHealthData = {
        metricValue: 120,
        metricUnit: 'bpm',
        timestamp: new Date()
      };
      const invalidHealthData = {
        metricValue: -10, // Invalid negative value
        metricUnit: 'bpm',
        timestamp: new Date()
      };
      expect(healthSchema.safeParse(validHealthData).success).toBe(true);
      expect(healthSchema.safeParse(invalidHealthData).success).toBe(false);

      // Care journey validation
      const validCareData = {
        providerName: 'Dr. Smith',
        specialtyCode: 'CARD',
        appointmentDate: new Date()
      };
      const invalidCareData = {
        providerName: '', // Empty string
        specialtyCode: 'CARD',
        appointmentDate: new Date()
      };
      expect(careSchema.safeParse(validCareData).success).toBe(true);
      expect(careSchema.safeParse(invalidCareData).success).toBe(false);

      // Plan journey validation
      const validPlanData = {
        planCode: 'PREMIUM2023',
        coverageLevel: 'premium',
        startDate: new Date()
      };
      const invalidPlanData = {
        planCode: 'PREMIUM2023',
        coverageLevel: 'ultra', // Invalid enum value
        startDate: new Date()
      };
      expect(planSchema.safeParse(validPlanData).success).toBe(true);
      expect(planSchema.safeParse(invalidPlanData).success).toBe(false);
    });

    it('should apply journey-specific validation rules', () => {
      // Arrange & Act
      // Health journey typically has stricter numeric validations
      const healthSchema = createJourneySchema('health', {
        heartRate: z.number().int().min(30).max(220),
        bloodPressure: z.object({
          systolic: z.number().int().min(70).max(190),
          diastolic: z.number().int().min(40).max(120)
        })
      });

      // Care journey typically validates appointment times
      const careSchema = createJourneySchema('care', {
        appointmentTime: z.date(),
        duration: z.number().min(15).max(120)
      });

      // Plan journey typically validates document numbers
      const planSchema = createJourneySchema('plan', {
        documentNumber: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/),
        planType: z.enum(['individual', 'family', 'corporate'])
      });

      // Assert
      // Test health journey specific validations
      const validHealthData = {
        heartRate: 75,
        bloodPressure: {
          systolic: 120,
          diastolic: 80
        }
      };
      const invalidHealthData = {
        heartRate: 250, // Too high
        bloodPressure: {
          systolic: 120,
          diastolic: 80
        }
      };
      expect(healthSchema.safeParse(validHealthData).success).toBe(true);
      expect(healthSchema.safeParse(invalidHealthData).success).toBe(false);

      // Test care journey specific validations
      const validCareData = {
        appointmentTime: new Date(),
        duration: 30
      };
      const invalidCareData = {
        appointmentTime: new Date(),
        duration: 180 // Too long
      };
      expect(careSchema.safeParse(validCareData).success).toBe(true);
      expect(careSchema.safeParse(invalidCareData).success).toBe(false);

      // Test plan journey specific validations
      const validPlanData = {
        documentNumber: '12.345.678/0001-90',
        planType: 'corporate'
      };
      const invalidPlanData = {
        documentNumber: '123456789', // Invalid format
        planType: 'corporate'
      };
      expect(planSchema.safeParse(validPlanData).success).toBe(true);
      expect(planSchema.safeParse(invalidPlanData).success).toBe(false);
    });
  });

  describe('zodToClassValidator', () => {
    it('should convert a Zod schema to class-validator decorators', () => {
      // Arrange
      const zodSchema = z.object({
        name: z.string().min(3).max(50),
        email: z.string().email(),
        age: z.number().positive().optional()
      });

      // Act
      const UserClass = zodToClassValidator(zodSchema, 'UserDto');
      const user = new UserClass();
      user.name = 'Jo'; // Too short
      user.email = 'not-an-email';
      user.age = -5; // Negative

      // Assert
      return validate(user).then(errors => {
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'name')).toBe(true);
        expect(errors.some(e => e.property === 'email')).toBe(true);
        expect(errors.some(e => e.property === 'age')).toBe(true);
      });
    });
  });

  describe('classValidatorToZod', () => {
    it('should convert class-validator decorators to a Zod schema', () => {
      // Arrange
      class UserDto {
        @IsString()
        @Length(3, 50)
        name: string;

        @IsEmail()
        email: string;

        constructor(name: string, email: string) {
          this.name = name;
          this.email = email;
        }
      }

      // Act
      const zodSchema = classValidatorToZod(UserDto);

      // Assert
      const validResult = zodSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com'
      });

      const invalidResult = zodSchema.safeParse({
        name: 'Jo', // Too short
        email: 'not-an-email'
      });

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        const errors = invalidResult.error.format();
        expect(errors.name?._errors).toBeDefined();
        expect(errors.email?._errors).toBeDefined();
      }
    });
  });
});