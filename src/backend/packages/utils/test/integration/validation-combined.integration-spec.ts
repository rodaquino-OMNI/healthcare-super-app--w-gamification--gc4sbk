/**
 * Integration tests for combined validation utilities
 *
 * This test suite validates the combined application of multiple validation utilities
 * in different validation contexts. It ensures that validation rules work correctly when
 * applied together, across different journey domains (health, care, plan), and with both
 * synchronous and asynchronous validation workflows.
 */

import { z } from 'zod';
import { JourneyType } from '@austa/interfaces/journey';

// Import validation utilities
import { string, number, date, object, schema, common, ValidationResult } from '../../src/validation';

// Import test helpers and setup
import { 
  createJourneyContext, 
  journeyHelpers, 
  testDataGenerators, 
  integrationVerifiers,
  JourneyContext
} from './helpers';
import { validationContexts } from './setup';

// Define test types
interface HealthMetric {
  userId: string;
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
  deviceId?: string;
}

interface CareAppointment {
  userId: string;
  providerId: string;
  specialty: string;
  date: Date;
  status: string;
  notes?: string;
}

interface PlanClaim {
  userId: string;
  type: string;
  date: Date;
  amount: number;
  status: string;
  description?: string;
}

/**
 * Test suite for combined string validation rules
 */
describe('Combined String Validation Rules', () => {
  // Test combining multiple string validation rules
  describe('Multiple string validators', () => {
    // Test synchronous validation combinations
    it('should validate CPF and string length together', () => {
      const validCPF = '529.982.247-25';
      const invalidCPF = '111.111.111-11';
      const longString = 'a'.repeat(100);
      
      // Valid CPF with valid length
      expect(string.isValidCPF(validCPF) && string.isValidLength(validCPF, 1, 20)).toBe(true);
      
      // Invalid CPF with valid length
      expect(string.isValidCPF(invalidCPF) && string.isValidLength(invalidCPF, 1, 20)).toBe(false);
      
      // Valid CPF with invalid length (this should never happen with real CPFs, but testing the combination)
      expect(string.isValidCPF(validCPF) && string.isValidLength(validCPF, 1, 10)).toBe(false);
      
      // Valid CPF with invalid length (too long)
      expect(string.isValidCPF(validCPF + longString) && string.isValidLength(validCPF + longString, 1, 20)).toBe(false);
    });
    
    it('should validate email and pattern together', () => {
      const validEmail = 'test@austa.com.br';
      const validDomainEmail = 'user@austa.com.br';
      const invalidEmail = 'not-an-email';
      const nonAustaEmail = 'user@other-company.com';
      
      // Valid email with valid domain pattern
      expect(
        string.isValidEmail(validEmail) && 
        string.matchesPattern(validEmail, /.*@austa\.com\.br$/)
      ).toBe(true);
      
      // Valid email with valid domain pattern (another example)
      expect(
        string.isValidEmail(validDomainEmail) && 
        string.matchesPattern(validDomainEmail, /.*@austa\.com\.br$/)
      ).toBe(true);
      
      // Invalid email with valid domain pattern
      expect(
        string.isValidEmail(invalidEmail) && 
        string.matchesPattern(invalidEmail, /.*@austa\.com\.br$/)
      ).toBe(false);
      
      // Valid email with invalid domain pattern
      expect(
        string.isValidEmail(nonAustaEmail) && 
        string.matchesPattern(nonAustaEmail, /.*@austa\.com\.br$/)
      ).toBe(false);
    });
    
    // Test asynchronous validation combinations
    it('should validate URL and content type asynchronously', async () => {
      const validImageUrl = 'https://austa.com.br/images/logo.png';
      const validDocUrl = 'https://austa.com.br/docs/terms.pdf';
      const invalidUrl = 'not-a-url';
      
      // Mock the content type check function
      const isImageContentType = jest.fn().mockImplementation(async (url: string) => {
        return url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg');
      });
      
      // Valid URL with valid image content type
      expect(
        string.isValidUrl(validImageUrl) && 
        await isImageContentType(validImageUrl)
      ).toBe(true);
      
      // Valid URL with invalid image content type
      expect(
        string.isValidUrl(validDocUrl) && 
        await isImageContentType(validDocUrl)
      ).toBe(false);
      
      // Invalid URL (content type check shouldn't even run)
      expect(string.isValidUrl(invalidUrl)).toBe(false);
      expect(isImageContentType).not.toHaveBeenCalledWith(invalidUrl);
    });
  });
  
  // Test combining string validation with other types
  describe('String validators with other types', () => {
    it('should validate string and number together', () => {
      const validPhone = '+55 11 98765-4321';
      const invalidPhone = '123';
      const validExtension = '123';
      const invalidExtension = 'abc';
      
      // Valid phone with valid numeric extension
      expect(
        common.isValidPhoneNumber(validPhone) && 
        number.isInteger(parseInt(validExtension, 10))
      ).toBe(true);
      
      // Invalid phone with valid numeric extension
      expect(
        common.isValidPhoneNumber(invalidPhone) && 
        number.isInteger(parseInt(validExtension, 10))
      ).toBe(false);
      
      // Valid phone with invalid numeric extension
      expect(
        common.isValidPhoneNumber(validPhone) && 
        number.isInteger(parseInt(invalidExtension, 10))
      ).toBe(false);
    });
    
    it('should validate string and date together', () => {
      const validDateStr = '01/01/2023';
      const invalidDateStr = '99/99/2023';
      const validFormat = 'dd/MM/yyyy';
      const invalidFormat = 'yyyy-MM-dd';
      
      // Valid date string with valid format
      expect(
        date.isValidDateString(validDateStr, validFormat) && 
        string.isValidLength(validDateStr, 8, 10)
      ).toBe(true);
      
      // Invalid date string with valid format
      expect(
        date.isValidDateString(invalidDateStr, validFormat) && 
        string.isValidLength(invalidDateStr, 8, 10)
      ).toBe(false);
      
      // Valid date string with invalid format
      expect(
        date.isValidDateString(validDateStr, invalidFormat) && 
        string.isValidLength(validDateStr, 8, 10)
      ).toBe(false);
    });
  });
});

/**
 * Test suite for complex object validation with nested rules
 */
describe('Complex Object Validation with Nested Rules', () => {
  // Test validating complex objects
  describe('Object structure validation', () => {
    it('should validate object with nested properties', () => {
      const validUser = {
        id: '123',
        name: 'Test User',
        email: 'test@austa.com.br',
        profile: {
          age: 30,
          cpf: '529.982.247-25',
          address: {
            street: 'Test Street',
            number: '123',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01234-567'
          }
        }
      };
      
      const invalidUser = {
        id: '123',
        name: 'Test User',
        email: 'invalid-email',
        profile: {
          age: 30,
          cpf: '111.111.111-11', // Invalid CPF
          address: {
            street: 'Test Street',
            number: '123',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '0000-000' // Invalid postal code
          }
        }
      };
      
      // Validate nested properties individually
      expect(
        object.hasValidNestedProperty(validUser, 'email', (email) => string.isValidEmail(email)) &&
        object.hasValidNestedProperty(validUser, 'profile.cpf', (cpf) => string.isValidCPF(cpf)) &&
        object.hasValidNestedProperty(validUser, 'profile.address.postalCode', (cep) => common.isValidPostalCode(cep))
      ).toBe(true);
      
      // Validate nested properties of invalid object
      expect(
        object.hasValidNestedProperty(invalidUser, 'email', (email) => string.isValidEmail(email)) &&
        object.hasValidNestedProperty(invalidUser, 'profile.cpf', (cpf) => string.isValidCPF(cpf)) &&
        object.hasValidNestedProperty(invalidUser, 'profile.address.postalCode', (cep) => common.isValidPostalCode(cep))
      ).toBe(false);
    });
    
    it('should validate array of objects with nested rules', () => {
      const validItems = [
        { id: '1', name: 'Item 1', price: 10.5, inStock: true },
        { id: '2', name: 'Item 2', price: 20.75, inStock: false },
        { id: '3', name: 'Item 3', price: 15.0, inStock: true }
      ];
      
      const invalidItems = [
        { id: '1', name: 'Item 1', price: 10.5, inStock: true },
        { id: '2', name: '', price: -5, inStock: false }, // Invalid name and price
        { id: '3', name: 'Item 3', price: 15.0, inStock: 'yes' } // Invalid inStock type
      ];
      
      // Validate each item in the array
      const validateItem = (item: any): boolean => {
        return (
          string.isValidLength(item.name, 1, 50) &&
          number.isPositive(item.price) &&
          typeof item.inStock === 'boolean'
        );
      };
      
      // All valid items should pass validation
      expect(validItems.every(validateItem)).toBe(true);
      
      // At least one invalid item should fail validation
      expect(invalidItems.every(validateItem)).toBe(false);
    });
  });
  
  // Test schema-based validation
  describe('Schema-based validation', () => {
    it('should validate complex object using Zod schema', () => {
      // Define a schema for user data
      const addressSchema = z.object({
        street: z.string().min(1),
        number: z.string().min(1),
        city: z.string().min(1),
        state: z.string().length(2),
        postalCode: z.string().refine(common.isValidPostalCode, {
          message: 'Invalid postal code'
        })
      });
      
      const profileSchema = z.object({
        age: z.number().min(18),
        cpf: z.string().refine(string.isValidCPF, {
          message: 'Invalid CPF'
        }),
        address: addressSchema
      });
      
      const userSchema = z.object({
        id: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        profile: profileSchema
      });
      
      const validUser = {
        id: '123',
        name: 'Test User',
        email: 'test@austa.com.br',
        profile: {
          age: 30,
          cpf: '529.982.247-25',
          address: {
            street: 'Test Street',
            number: '123',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01234-567'
          }
        }
      };
      
      const invalidUser = {
        id: '123',
        name: 'Test User',
        email: 'invalid-email',
        profile: {
          age: 16, // Underage
          cpf: '111.111.111-11', // Invalid CPF
          address: {
            street: 'Test Street',
            number: '123',
            city: 'São Paulo',
            state: 'S', // Invalid state length
            postalCode: '0000-000' // Invalid postal code
          }
        }
      };
      
      // Validate using schema
      const validResult = userSchema.safeParse(validUser);
      const invalidResult = userSchema.safeParse(invalidUser);
      
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      
      // Check specific error fields in the invalid result
      if (!invalidResult.success) {
        const formattedErrors = invalidResult.error.format();
        expect(formattedErrors.email?._errors).toBeDefined();
        expect(formattedErrors.profile?.age?._errors).toBeDefined();
        expect(formattedErrors.profile?.cpf?._errors).toBeDefined();
        expect(formattedErrors.profile?.address?.state?._errors).toBeDefined();
        expect(formattedErrors.profile?.address?.postalCode?._errors).toBeDefined();
      }
    });
  });
});

/**
 * Test suite for journey-specific validation combinations
 */
describe('Journey-Specific Validation Combinations', () => {
  // Test health journey validations
  describe('Health Journey Validations', () => {
    it('should validate health metrics with combined rules', () => {
      const validMetric: HealthMetric = {
        userId: 'user123',
        type: 'WEIGHT',
        value: 75.5,
        unit: 'kg',
        timestamp: new Date(),
        deviceId: 'device123'
      };
      
      const invalidMetric: HealthMetric = {
        userId: 'user123',
        type: 'WEIGHT',
        value: -10, // Invalid negative weight
        unit: 'kg',
        timestamp: new Date(Date.now() + 86400000), // Future date
        deviceId: 'device123'
      };
      
      // Create a validation function that combines multiple rules
      const validateHealthMetric = (metric: HealthMetric): boolean => {
        const context = createJourneyContext(JourneyType.HEALTH);
        
        return (
          // User ID validation
          string.isValidLength(metric.userId, 1, 50) &&
          
          // Type validation
          object.isValidEnumValue(metric.type, ['WEIGHT', 'HEIGHT', 'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE']) &&
          
          // Value validation based on type
          (metric.type === 'WEIGHT' ? number.isInRange(metric.value, 20, 300) : true) &&
          (metric.type === 'HEIGHT' ? number.isInRange(metric.value, 50, 250) : true) &&
          (metric.type === 'HEART_RATE' ? number.isInRange(metric.value, 30, 220) : true) &&
          
          // Unit validation
          object.isValidEnumValue(metric.unit, ['kg', 'cm', 'bpm', 'mmHg', 'mg/dL']) &&
          
          // Timestamp validation (not in future)
          date.isPastOrPresent(metric.timestamp)
        );
      };
      
      expect(validateHealthMetric(validMetric)).toBe(true);
      expect(validateHealthMetric(invalidMetric)).toBe(false);
    });
    
    it('should validate health metrics using context-aware validation', () => {
      const healthContext = validationContexts.health;
      
      const validMetric: HealthMetric = {
        userId: 'user123',
        type: 'WEIGHT',
        value: 75.5,
        unit: 'kg',
        timestamp: new Date(),
        deviceId: 'device123'
      };
      
      const invalidMetric: HealthMetric = {
        userId: 'user123',
        type: 'INVALID_TYPE', // Invalid type
        value: -10, // Invalid negative weight
        unit: 'invalid', // Invalid unit
        timestamp: new Date(Date.now() + 86400000), // Future date
        deviceId: 'device123'
      };
      
      // Use the validation context to validate the metrics
      expect(healthContext.validate('healthMetric', validMetric).valid).toBe(true);
      
      const invalidResult = healthContext.validate('healthMetric', invalidMetric);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });
  
  // Test care journey validations
  describe('Care Journey Validations', () => {
    it('should validate appointment bookings with combined rules', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const validAppointment: CareAppointment = {
        userId: 'user123',
        providerId: 'provider456',
        specialty: 'CARDIOLOGY',
        date: tomorrow, // Future date is valid for appointments
        status: 'SCHEDULED'
      };
      
      const invalidAppointment: CareAppointment = {
        userId: 'user123',
        providerId: 'provider456',
        specialty: 'INVALID_SPECIALTY', // Invalid specialty
        date: today, // Same day might be invalid depending on rules
        status: 'UNKNOWN_STATUS' // Invalid status
      };
      
      // Create a validation function that combines multiple rules
      const validateAppointment = (appointment: CareAppointment): boolean => {
        const context = createJourneyContext(JourneyType.CARE);
        
        return (
          // User and provider ID validation
          string.isValidLength(appointment.userId, 1, 50) &&
          string.isValidLength(appointment.providerId, 1, 50) &&
          
          // Specialty validation
          object.isValidEnumValue(appointment.specialty, [
            'CARDIOLOGY', 'DERMATOLOGY', 'ORTHOPEDICS', 'PEDIATRICS', 'NEUROLOGY'
          ]) &&
          
          // Date validation (must be future date)
          date.isFutureDate(appointment.date) &&
          
          // Status validation
          object.isValidEnumValue(appointment.status, [
            'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
          ])
        );
      };
      
      expect(validateAppointment(validAppointment)).toBe(true);
      expect(validateAppointment(invalidAppointment)).toBe(false);
    });
    
    it('should validate appointment bookings using context-aware validation', () => {
      const careContext = validationContexts.care;
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const validAppointment: CareAppointment = {
        userId: 'user123',
        providerId: 'provider456',
        specialty: 'CARDIOLOGY',
        date: tomorrow,
        status: 'SCHEDULED'
      };
      
      const invalidAppointment: CareAppointment = {
        userId: 'user123',
        providerId: 'provider456',
        specialty: 'INVALID_SPECIALTY',
        date: today,
        status: 'UNKNOWN_STATUS'
      };
      
      // Use the validation context to validate the appointments
      expect(careContext.validate('appointment', validAppointment).valid).toBe(true);
      
      const invalidResult = careContext.validate('appointment', invalidAppointment);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });
  
  // Test plan journey validations
  describe('Plan Journey Validations', () => {
    it('should validate insurance claims with combined rules', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const validClaim: PlanClaim = {
        userId: 'user123',
        type: 'MEDICAL',
        date: lastMonth, // Past date is valid for claims
        amount: 500.75,
        status: 'PENDING'
      };
      
      const invalidClaim: PlanClaim = {
        userId: 'user123',
        type: 'INVALID_TYPE', // Invalid type
        date: new Date(Date.now() + 86400000), // Future date is invalid for claims
        amount: -100, // Negative amount
        status: 'UNKNOWN_STATUS' // Invalid status
      };
      
      // Create a validation function that combines multiple rules
      const validateClaim = (claim: PlanClaim): boolean => {
        const context = createJourneyContext(JourneyType.PLAN);
        
        return (
          // User ID validation
          string.isValidLength(claim.userId, 1, 50) &&
          
          // Type validation
          object.isValidEnumValue(claim.type, ['MEDICAL', 'DENTAL', 'VISION', 'PHARMACY']) &&
          
          // Date validation (must be past date)
          date.isPastDate(claim.date) &&
          
          // Amount validation
          number.isPositive(claim.amount) &&
          
          // Status validation
          object.isValidEnumValue(claim.status, ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'])
        );
      };
      
      expect(validateClaim(validClaim)).toBe(true);
      expect(validateClaim(invalidClaim)).toBe(false);
    });
    
    it('should validate insurance claims using context-aware validation', () => {
      const planContext = validationContexts.plan;
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const validClaim: PlanClaim = {
        userId: 'user123',
        type: 'MEDICAL',
        date: lastMonth,
        amount: 500.75,
        status: 'PENDING'
      };
      
      const invalidClaim: PlanClaim = {
        userId: 'user123',
        type: 'INVALID_TYPE',
        date: new Date(Date.now() + 86400000),
        amount: -100,
        status: 'UNKNOWN_STATUS'
      };
      
      // Use the validation context to validate the claims
      expect(planContext.validate('claim', validClaim).valid).toBe(true);
      
      const invalidResult = planContext.validate('claim', invalidClaim);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Test suite for validation error handling and formatting
 */
describe('Validation Error Handling and Formatting', () => {
  // Test error message formatting
  describe('Error message formatting', () => {
    it('should format validation errors with proper context', () => {
      const invalidUser = {
        name: '',
        email: 'invalid-email',
        age: 16
      };
      
      // Define a schema with custom error messages
      const userSchema = z.object({
        name: z.string().min(1, { message: 'Nome é obrigatório' }),
        email: z.string().email({ message: 'Email inválido' }),
        age: z.number().min(18, { message: 'Idade mínima é 18 anos' })
      });
      
      // Validate and get formatted errors
      const result = userSchema.safeParse(invalidUser);
      
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const formattedErrors = result.error.format();
        
        // Check specific error messages
        expect(formattedErrors.name?._errors).toContain('Nome é obrigatório');
        expect(formattedErrors.email?._errors).toContain('Email inválido');
        expect(formattedErrors.age?._errors).toContain('Idade mínima é 18 anos');
      }
    });
    
    it('should format validation errors with field paths for nested objects', () => {
      const invalidAddress = {
        street: '',
        city: '',
        state: 'INVALID',
        postalCode: '123'
      };
      
      // Define a schema with nested objects
      const addressSchema = z.object({
        street: z.string().min(1, { message: 'Rua é obrigatória' }),
        city: z.string().min(1, { message: 'Cidade é obrigatória' }),
        state: z.string().length(2, { message: 'Estado deve ter 2 caracteres' }),
        postalCode: z.string().refine(common.isValidPostalCode, {
          message: 'CEP inválido'
        })
      });
      
      // Validate and get formatted errors
      const result = addressSchema.safeParse(invalidAddress);
      
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const formattedErrors = result.error.format();
        
        // Check specific error messages with paths
        expect(formattedErrors.street?._errors).toContain('Rua é obrigatória');
        expect(formattedErrors.city?._errors).toContain('Cidade é obrigatória');
        expect(formattedErrors.state?._errors).toContain('Estado deve ter 2 caracteres');
        expect(formattedErrors.postalCode?._errors).toContain('CEP inválido');
      }
    });
  });
  
  // Test localization of error messages
  describe('Error message localization', () => {
    it('should format error messages in Portuguese (default)', () => {
      const invalidData = {
        cpf: '111.111.111-11',
        birthDate: '99/99/2000'
      };
      
      // Define a schema with localized error messages
      const schema = z.object({
        cpf: z.string().refine(string.isValidCPF, {
          message: 'CPF inválido'
        }),
        birthDate: z.string().refine(
          (date) => date.isValidDateString(date, 'dd/MM/yyyy'),
          { message: 'Data de nascimento inválida' }
        )
      });
      
      // Validate with Brazilian Portuguese context
      const result = validationContexts.health.validateWithSchema(schema, invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toContain('CPF inválido');
      expect(result.errors[1].message).toContain('Data de nascimento inválida');
    });
    
    it('should format error messages in English when using English locale', () => {
      const invalidData = {
        cpf: '111.111.111-11',
        birthDate: '99/99/2000'
      };
      
      // Define a schema with localized error messages
      const schema = z.object({
        cpf: z.string().refine(string.isValidCPF, {
          message: 'Invalid CPF'
        }),
        birthDate: z.string().refine(
          (date) => date.isValidDateString(date, 'MM/dd/yyyy'),
          { message: 'Invalid birth date' }
        )
      });
      
      // Validate with English context
      const result = validationContexts.english.validateWithSchema(schema, invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toContain('Invalid CPF');
      expect(result.errors[1].message).toContain('Invalid birth date');
    });
  });
  
  // Test combining multiple validation errors
  describe('Combined validation errors', () => {
    it('should collect all validation errors when validating complex objects', () => {
      const invalidUser = {
        id: '123',
        name: '', // Invalid: empty
        email: 'invalid-email', // Invalid: not an email
        profile: {
          age: 16, // Invalid: underage
          cpf: '111.111.111-11', // Invalid: invalid CPF
          address: {
            street: 'Test Street',
            city: '', // Invalid: empty
            state: 'INVALID', // Invalid: not 2 chars
            postalCode: '0000-000' // Invalid: invalid postal code
          }
        }
      };
      
      // Validate using a complex schema
      const addressSchema = z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().length(2),
        postalCode: z.string().refine(common.isValidPostalCode)
      });
      
      const profileSchema = z.object({
        age: z.number().min(18),
        cpf: z.string().refine(string.isValidCPF),
        address: addressSchema
      });
      
      const userSchema = z.object({
        id: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        profile: profileSchema
      });
      
      // Validate and collect all errors
      const result = userSchema.safeParse(invalidUser);
      
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const formattedErrors = result.error.format();
        
        // Count the total number of validation errors
        const errorCount = Object.keys(formattedErrors).filter(key => key !== '_errors').length +
                          Object.keys(formattedErrors.profile || {}).filter(key => key !== '_errors').length +
                          Object.keys(formattedErrors.profile?.address || {}).filter(key => key !== '_errors').length;
        
        // We expect at least 6 validation errors
        expect(errorCount).toBeGreaterThanOrEqual(6);
      }
    });
  });
});

/**
 * Test suite for cross-journey validation
 */
describe('Cross-Journey Validation', () => {
  it('should validate data that spans multiple journeys', () => {
    // Create a user with data from multiple journeys
    const crossJourneyUser = {
      id: 'user123',
      name: 'Test User',
      email: 'test@austa.com.br',
      cpf: '529.982.247-25',
      // Health journey data
      healthMetrics: [
        {
          type: 'WEIGHT',
          value: 75.5,
          unit: 'kg',
          timestamp: new Date()
        }
      ],
      // Care journey data
      appointments: [
        {
          providerId: 'provider456',
          specialty: 'CARDIOLOGY',
          date: new Date(Date.now() + 86400000),
          status: 'SCHEDULED'
        }
      ],
      // Plan journey data
      claims: [
        {
          type: 'MEDICAL',
          date: new Date(Date.now() - 86400000),
          amount: 500.75,
          status: 'PENDING'
        }
      ]
    };
    
    // Validate using multiple journey contexts
    const validateCrossJourneyUser = (user: any): ValidationResult => {
      // Validate common user data
      const commonValidation = {
        valid: (
          string.isValidLength(user.id, 1, 50) &&
          string.isValidLength(user.name, 1, 100) &&
          string.isValidEmail(user.email) &&
          string.isValidCPF(user.cpf)
        ),
        errors: []
      };
      
      if (!commonValidation.valid) {
        commonValidation.errors.push({
          field: 'user',
          message: 'Invalid user data'
        });
        return commonValidation;
      }
      
      // Validate health journey data
      const healthValidation = validationContexts.health.validate(
        'healthMetrics',
        user.healthMetrics
      );
      
      // Validate care journey data
      const careValidation = validationContexts.care.validate(
        'appointments',
        user.appointments
      );
      
      // Validate plan journey data
      const planValidation = validationContexts.plan.validate(
        'claims',
        user.claims
      );
      
      // Combine all validation results
      return {
        valid: commonValidation.valid && 
               healthValidation.valid && 
               careValidation.valid && 
               planValidation.valid,
        errors: [
          ...commonValidation.errors,
          ...healthValidation.errors,
          ...careValidation.errors,
          ...planValidation.errors
        ]
      };
    };
    
    const validationResult = validateCrossJourneyUser(crossJourneyUser);
    expect(validationResult.valid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
    
    // Test with invalid data
    const invalidCrossJourneyUser = {
      ...crossJourneyUser,
      email: 'invalid-email',
      healthMetrics: [
        {
          type: 'INVALID_TYPE',
          value: -10,
          unit: 'invalid',
          timestamp: new Date(Date.now() + 86400000)
        }
      ]
    };
    
    const invalidResult = validateCrossJourneyUser(invalidCrossJourneyUser);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
});