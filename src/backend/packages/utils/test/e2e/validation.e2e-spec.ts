import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { z } from 'zod';
import { IsEmail, IsNotEmpty, MinLength, validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Import validation utilities
import {
  isValidCPF,
  validateCPF,
  isValidEmail,
  isValidUrl,
  isValidLength,
  matchesPattern
} from '../../src/validation/string.validator';

import {
  isValidDate,
  isDateInRange,
  isFutureDate,
  isPastDate,
  isBusinessDay,
  isValidJourneyDate,
  isValidDateWithTimezone,
  isValidAppointmentDate,
  isValidHealthMetricDate,
  isValidClaimDate
} from '../../src/validation/date.validator';

import {
  isObjectWithShape,
  validateObjectStructure,
  hasRequiredProperties,
  hasNestedProperty,
  validateNestedProperty,
  isOfType,
  validateArrayProperty,
  areObjectsEqual
} from '../../src/validation/object.validator';

import {
  createSchema,
  validateWithZod,
  validateWithClassValidator,
  createZodSchemaFromClass,
  healthSchema,
  careSchema,
  planSchema,
  healthSchemas,
  careSchemas,
  planSchemas
} from '../../src/validation/schema.validator';

// Test module setup
describe('Validation Utilities (e2e)', () => {
  let app: INestApplication;

  // Sample data for testing
  const validCPF = '529.982.247-25';
  const invalidCPF = '111.111.111-11';
  const validEmail = 'usuario@empresa.com.br';
  const invalidEmail = 'usuario@invalid';
  const validUrl = 'https://austa.com.br/app';
  const invalidUrl = 'http://localhost:3000';
  
  // Sample dates for testing
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  // Sample objects for testing
  const healthMetric = {
    userId: 'user-123',
    type: 'blood_pressure',
    value: 120,
    unit: 'mmHg',
    timestamp: new Date(),
    source: 'manual',
    metadata: {
      systolic: 120,
      diastolic: 80
    }
  };

  const appointment = {
    userId: 'user-123',
    providerId: 'provider-456',
    specialtyId: 'specialty-789',
    dateTime: tomorrow,
    duration: 30,
    type: 'in-person',
    status: 'scheduled',
    notes: 'Regular check-up'
  };

  const insuranceClaim = {
    userId: 'user-123',
    serviceDate: yesterday,
    providerId: 'provider-456',
    procedureCode: 'PROC123',
    amount: 150.75,
    status: 'submitted',
    documents: ['doc1.pdf', 'doc2.pdf']
  };

  // Class for class-validator testing
  class UserDto {
    @IsNotEmpty()
    id: string;

    @IsNotEmpty()
    @MinLength(3)
    name: string;

    @IsEmail()
    email: string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('String Validators', () => {
    describe('CPF Validation', () => {
      it('should validate a correctly formatted CPF', () => {
        expect(isValidCPF(validCPF)).toBe(true);
      });

      it('should reject an invalid CPF', () => {
        expect(isValidCPF(invalidCPF)).toBe(false);
      });

      it('should provide detailed validation results', () => {
        const result = validateCPF(validCPF);
        expect(result.valid).toBe(true);

        const invalidResult = validateCPF(invalidCPF);
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.message).toContain('CPF with repeated digits is invalid');
      });

      it('should validate CPF in different formats', () => {
        // Without formatting
        expect(isValidCPF('52998224725')).toBe(true);
        // With formatting
        expect(isValidCPF('529.982.247-25')).toBe(true);
      });
    });

    describe('Email Validation', () => {
      it('should validate a correct email address', () => {
        expect(isValidEmail(validEmail)).toBe(true);
      });

      it('should reject an invalid email address', () => {
        expect(isValidEmail(invalidEmail)).toBe(false);
      });

      it('should validate Brazilian email domains when specified', () => {
        expect(isValidEmail('user@empresa.com.br', { validateBrazilianDomains: true })).toBe(true);
        expect(isValidEmail('user@example.com', { validateBrazilianDomains: true })).toBe(false);
      });

      it('should apply strict validation when specified', () => {
        expect(isValidEmail('user+tag@empresa.com.br', { strict: true })).toBe(true);
        expect(isValidEmail('user@localhost', { strict: true })).toBe(false);
      });
    });

    describe('URL Validation', () => {
      it('should validate a correct URL', () => {
        expect(isValidUrl(validUrl)).toBe(true);
      });

      it('should reject an invalid URL', () => {
        expect(isValidUrl('not-a-url')).toBe(false);
      });

      it('should enforce HTTPS when required', () => {
        expect(isValidUrl('http://austa.com.br', { requireHttps: true })).toBe(false);
        expect(isValidUrl('https://austa.com.br', { requireHttps: true })).toBe(true);
      });

      it('should check for SSRF vulnerabilities when specified', () => {
        expect(isValidUrl(invalidUrl, { checkSsrf: true })).toBe(false);
        expect(isValidUrl(validUrl, { checkSsrf: true })).toBe(true);
      });

      it('should validate against allowed domains', () => {
        expect(isValidUrl('https://austa.com.br', { 
          allowedDomains: ['austa.com.br', 'api.austa.com.br'] 
        })).toBe(true);
        
        expect(isValidUrl('https://example.com', { 
          allowedDomains: ['austa.com.br', 'api.austa.com.br'] 
        })).toBe(false);
      });
    });

    describe('String Pattern and Length Validation', () => {
      it('should validate string length', () => {
        expect(isValidLength('test', { min: 3, max: 10 })).toBe(true);
        expect(isValidLength('test', { min: 5 })).toBe(false);
        expect(isValidLength('test', { max: 3 })).toBe(false);
        expect(isValidLength('test', { exact: 4 })).toBe(true);
      });

      it('should validate against regex patterns', () => {
        expect(matchesPattern('ABC123', { pattern: /^[A-Z0-9]+$/ })).toBe(true);
        expect(matchesPattern('abc123', { pattern: /^[A-Z0-9]+$/ })).toBe(false);
        expect(matchesPattern('abc123', { pattern: /^[A-Z0-9]+$/, ignoreCase: true })).toBe(true);
      });

      it('should support inverted pattern matching', () => {
        expect(matchesPattern('test', { pattern: /^\d+$/, invertMatch: true })).toBe(true);
        expect(matchesPattern('123', { pattern: /^\d+$/, invertMatch: true })).toBe(false);
      });
    });
  });

  describe('Date Validators', () => {
    describe('Basic Date Validation', () => {
      it('should validate date objects', () => {
        expect(isValidDate(new Date())).toBe(true);
        expect(isValidDate('not-a-date')).toBe(false);
      });

      it('should validate date strings', () => {
        expect(isValidDate('2023-01-15')).toBe(true);
        expect(isValidDate('15/01/2023')).toBe(true); // Brazilian format
      });

      it('should validate date ranges', () => {
        expect(isDateInRange(today, yesterday, tomorrow)).toBe(true);
        expect(isDateInRange(nextMonth, yesterday, tomorrow)).toBe(false);
      });
    });

    describe('Future and Past Date Validation', () => {
      it('should validate future dates', () => {
        expect(isFutureDate(tomorrow)).toBe(true);
        expect(isFutureDate(yesterday)).toBe(false);
      });

      it('should validate past dates', () => {
        expect(isPastDate(yesterday)).toBe(true);
        expect(isPastDate(tomorrow)).toBe(false);
      });

      it('should respect minimum days in future constraint', () => {
        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(today.getDate() + 2);
        
        expect(isFutureDate(tomorrow, { minDaysInFuture: 2 })).toBe(false);
        expect(isFutureDate(twoDaysFromNow, { minDaysInFuture: 2 })).toBe(true);
      });

      it('should respect maximum days in past constraint', () => {
        const thirtyOneDaysAgo = new Date(today);
        thirtyOneDaysAgo.setDate(today.getDate() - 31);
        
        expect(isPastDate(yesterday, { maxDaysInPast: 30 })).toBe(true);
        expect(isPastDate(thirtyOneDaysAgo, { maxDaysInPast: 30 })).toBe(false);
      });
    });

    describe('Business Day Validation', () => {
      it('should identify weekends', () => {
        // Create a known weekend date (Sunday)
        const sunday = new Date('2023-01-15'); // This was a Sunday
        expect(isBusinessDay(sunday)).toBe(false);
        
        // Create a known weekday (Monday)
        const monday = new Date('2023-01-16'); // This was a Monday
        expect(isBusinessDay(monday)).toBe(true);
      });

      it('should identify Brazilian holidays', () => {
        // New Year's Day 2023
        const newYearsDay = new Date('2023-01-01');
        expect(isBusinessDay(newYearsDay)).toBe(false);
        
        // Regular day
        const regularDay = new Date('2023-01-03');
        expect(isBusinessDay(regularDay)).toBe(true);
      });

      it('should support custom holidays', () => {
        const customHoliday = new Date('2023-03-15');
        
        // Without custom holiday
        expect(isBusinessDay(customHoliday)).toBe(true);
        
        // With custom holiday
        expect(isBusinessDay(customHoliday, { 
          customHolidays: [new Date('2023-03-15')] 
        })).toBe(false);
      });
    });

    describe('Journey-Specific Date Validation', () => {
      it('should validate dates for health journey', () => {
        // Health journey allows past dates for metrics
        expect(isValidJourneyDate(yesterday, 'health')).toBe(true);
        expect(isValidJourneyDate(tomorrow, 'health')).toBe(true);
        
        // Health journey allows weekends
        const sunday = new Date('2023-01-15'); // This was a Sunday
        expect(isValidJourneyDate(sunday, 'health')).toBe(true);
      });

      it('should validate dates for care journey', () => {
        // Care journey requires future dates for appointments
        expect(isValidJourneyDate(yesterday, 'care')).toBe(false);
        expect(isValidJourneyDate(tomorrow, 'care')).toBe(true);
        
        // Care journey doesn't allow weekends by default
        const sunday = new Date('2023-01-15'); // This was a Sunday
        expect(isValidJourneyDate(sunday, 'care')).toBe(false);
      });

      it('should validate dates for plan journey', () => {
        // Plan journey typically requires past dates for claims
        expect(isValidJourneyDate(yesterday, 'plan')).toBe(true);
        expect(isValidJourneyDate(tomorrow, 'plan')).toBe(false);
      });

      it('should validate appointment dates', () => {
        // Business hours check (9 AM)
        const appointmentTime = new Date(tomorrow);
        appointmentTime.setHours(9, 0, 0, 0);
        expect(isValidAppointmentDate(appointmentTime)).toBe(true);
        
        // Outside business hours (7 AM)
        const earlyAppointment = new Date(tomorrow);
        earlyAppointment.setHours(7, 0, 0, 0);
        expect(isValidAppointmentDate(earlyAppointment)).toBe(false);
        
        // Time slot alignment (9:30 AM - aligned with 30-minute slots)
        const alignedAppointment = new Date(tomorrow);
        alignedAppointment.setHours(9, 30, 0, 0);
        expect(isValidAppointmentDate(alignedAppointment)).toBe(true);
        
        // Time slot misalignment (9:15 AM - not aligned with 30-minute slots)
        const misalignedAppointment = new Date(tomorrow);
        misalignedAppointment.setHours(9, 15, 0, 0);
        expect(isValidAppointmentDate(misalignedAppointment)).toBe(false);
      });

      it('should validate health metric dates', () => {
        // Recent past date (valid for health metrics)
        expect(isValidHealthMetricDate(yesterday)).toBe(true);
        
        // Future date (invalid for health metrics by default)
        expect(isValidHealthMetricDate(tomorrow)).toBe(false);
        
        // Future date with allowFutureDates option
        expect(isValidHealthMetricDate(tomorrow, { allowFutureDates: true })).toBe(true);
        
        // Date too far in the past
        const sixtyDaysAgo = new Date(today);
        sixtyDaysAgo.setDate(today.getDate() - 60);
        expect(isValidHealthMetricDate(sixtyDaysAgo, { maxDaysInPast: 30 })).toBe(false);
      });

      it('should validate insurance claim dates', () => {
        // Recent past date (valid for claims)
        expect(isValidClaimDate(yesterday)).toBe(true);
        
        // Future date (invalid for claims by default)
        expect(isValidClaimDate(tomorrow)).toBe(false);
        
        // Date too far in the past
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        expect(isValidClaimDate(oneYearAgo, { maxDaysInPast: 90 })).toBe(false);
      });
    });

    describe('Timezone-Aware Date Validation', () => {
      it('should validate dates with timezone consideration', () => {
        // Create a date at 3 PM São Paulo time
        const dateInSaoPaulo = new Date();
        dateInSaoPaulo.setHours(15, 0, 0, 0);
        
        expect(isValidDateWithTimezone(dateInSaoPaulo, { 
          timezone: 'America/Sao_Paulo',
          businessHoursOnly: true
        })).toBe(true);
        
        // This same time might be outside business hours in another timezone
        expect(isValidDateWithTimezone(dateInSaoPaulo, { 
          timezone: 'Asia/Tokyo',
          businessHoursOnly: true
        })).toBe(false);
      });

      it('should handle business days across timezones', () => {
        // Create a date that's Monday in São Paulo but might be Sunday elsewhere
        const mondayMorningInSaoPaulo = new Date('2023-01-16T08:00:00-03:00');
        
        expect(isValidDateWithTimezone(mondayMorningInSaoPaulo, { 
          timezone: 'America/Sao_Paulo',
          allowWeekends: false
        })).toBe(true);
        
        // This same time is still Sunday in Los Angeles
        expect(isValidDateWithTimezone(mondayMorningInSaoPaulo, { 
          timezone: 'America/Los_Angeles',
          allowWeekends: false
        })).toBe(false);
      });
    });
  });

  describe('Object Validators', () => {
    describe('Basic Object Validation', () => {
      it('should validate required properties', () => {
        expect(hasRequiredProperties(healthMetric, ['userId', 'type', 'value'])).toBe(true);
        expect(hasRequiredProperties(healthMetric, ['userId', 'nonExistentProp'])).toBe(false);
      });

      it('should validate nested properties', () => {
        expect(hasNestedProperty(healthMetric, 'metadata.systolic')).toBe(true);
        expect(hasNestedProperty(healthMetric, 'metadata.nonExistent')).toBe(false);
      });

      it('should validate property types', () => {
        expect(isOfType(healthMetric.value, 'number')).toBe(true);
        expect(isOfType(healthMetric.type, 'number')).toBe(false);
        expect(isOfType(healthMetric.metadata, 'object')).toBe(true);
        expect(isOfType(healthMetric.timestamp, 'date')).toBe(true);
      });
    });

    describe('Complex Object Validation', () => {
      it('should validate object shape', () => {
        const schema = {
          userId: { type: 'string', required: true },
          type: { type: 'string', required: true },
          value: { type: 'number', required: true },
          unit: { type: 'string', required: true },
          timestamp: { type: 'date', required: true },
          source: { type: 'string' },
          metadata: { type: 'object' }
        };
        
        expect(isObjectWithShape(healthMetric, schema)).toBe(true);
        
        // Invalid object (wrong type)
        const invalidMetric = { ...healthMetric, value: 'not-a-number' };
        expect(isObjectWithShape(invalidMetric, schema)).toBe(false);
      });

      it('should validate nested object structures', () => {
        const schema = {
          userId: { type: 'string', required: true },
          metadata: { 
            type: 'object', 
            properties: {
              systolic: { type: 'number', required: true },
              diastolic: { type: 'number', required: true }
            }
          }
        };
        
        expect(isObjectWithShape(healthMetric, schema, { validateNested: true })).toBe(true);
        
        // Invalid nested object
        const invalidNestedMetric = { 
          ...healthMetric, 
          metadata: { 
            systolic: 'not-a-number', 
            diastolic: 80 
          }
        };
        expect(isObjectWithShape(invalidNestedMetric, schema, { validateNested: true })).toBe(false);
      });

      it('should validate array properties', () => {
        expect(validateArrayProperty(insuranceClaim, 'documents', 
          item => typeof item === 'string' && item.endsWith('.pdf')
        )).toBe(true);
        
        // Invalid array items
        const invalidClaim = { 
          ...insuranceClaim, 
          documents: ['doc1.pdf', 'doc2.txt'] 
        };
        expect(validateArrayProperty(invalidClaim, 'documents', 
          item => typeof item === 'string' && item.endsWith('.pdf')
        )).toBe(false);
      });

      it('should provide detailed validation results', () => {
        const schema = {
          userId: { type: 'string', required: true },
          value: { type: 'number', required: true },
          metadata: { 
            type: 'object', 
            properties: {
              systolic: { type: 'number', required: true },
              diastolic: { type: 'number', required: true }
            }
          }
        };
        
        const invalidObject = {
          userId: 123, // Wrong type
          // Missing required 'value'
          metadata: {
            systolic: 'invalid', // Wrong type
            // Missing required 'diastolic'
          }
        };
        
        const result = validateObjectStructure(invalidObject, schema, { validateNested: true });
        
        expect(result.valid).toBe(false);
        expect(result.invalidProperties).toBeDefined();
        expect(Object.keys(result.invalidProperties!).length).toBeGreaterThan(0);
        expect(result.missingProperties).toContain('value');
      });

      it('should compare objects for equality', () => {
        const obj1 = { a: 1, b: { c: 2 } };
        const obj2 = { a: 1, b: { c: 2 } };
        const obj3 = { a: 1, b: { c: 3 } };
        
        expect(areObjectsEqual(obj1, obj2)).toBe(true);
        expect(areObjectsEqual(obj1, obj3)).toBe(false);
        
        // With ignored properties
        expect(areObjectsEqual(
          { a: 1, b: 2, c: 3 },
          { a: 1, b: 5, c: 3 },
          { ignoreProperties: ['b'] }
        )).toBe(true);
      });
    });

    describe('Cross-Journey Object Validation', () => {
      it('should validate health journey objects', () => {
        const healthMetricSchema = {
          userId: { type: 'string', required: true },
          type: { type: 'string', required: true },
          value: { type: 'number', required: true },
          unit: { type: 'string', required: true },
          timestamp: { type: 'date', required: true },
          source: { type: 'string', required: true }
        };
        
        expect(isObjectWithShape(healthMetric, healthMetricSchema)).toBe(true);
      });

      it('should validate care journey objects', () => {
        const appointmentSchema = {
          userId: { type: 'string', required: true },
          providerId: { type: 'string', required: true },
          dateTime: { type: 'date', required: true },
          duration: { type: 'number', required: true },
          type: { type: 'string', required: true },
          status: { type: 'string', required: true }
        };
        
        expect(isObjectWithShape(appointment, appointmentSchema)).toBe(true);
      });

      it('should validate plan journey objects', () => {
        const claimSchema = {
          userId: { type: 'string', required: true },
          serviceDate: { type: 'date', required: true },
          providerId: { type: 'string', required: true },
          procedureCode: { type: 'string', required: true },
          amount: { type: 'number', required: true },
          status: { type: 'string', required: true },
          documents: { type: 'array', required: true }
        };
        
        expect(isObjectWithShape(insuranceClaim, claimSchema)).toBe(true);
      });
    });
  });

  describe('Schema Validators', () => {
    describe('Zod Schema Validation', () => {
      it('should validate with Zod schemas', () => {
        const userSchema = z.object({
          id: z.string(),
          name: z.string().min(3),
          email: z.string().email()
        });
        
        const validUser = { id: 'user-123', name: 'John Doe', email: 'john@example.com' };
        const invalidUser = { id: 'user-123', name: 'Jo', email: 'invalid-email' };
        
        const validResult = validateWithZod(userSchema, validUser);
        expect(validResult.success).toBe(true);
        expect(validResult.data).toEqual(validUser);
        
        const invalidResult = validateWithZod(userSchema, invalidUser);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.errors).toBeDefined();
      });

      it('should create schemas with custom error messages', () => {
        const schema = createSchema(z.object({
          name: z.string().min(3),
          email: z.string().email()
        }));
        
        const result = validateWithZod(schema, { name: 'Jo', email: 'invalid' });
        expect(result.success).toBe(false);
        expect(result.errors?.name[0]).toContain('pelo menos 3 caracteres');
        expect(result.errors?.email[0]).toContain('Email inválido');
      });

      it('should use journey-specific schemas', () => {
        // Health journey schema
        const metricSchema = healthSchema.object({
          value: healthSchema.number({ required: true }),
          unit: healthSchema.string({ required: true }),
          timestamp: healthSchema.date({ required: true })
        });
        
        const validMetric = { value: 120, unit: 'mmHg', timestamp: new Date() };
        const invalidMetric = { value: 'invalid', unit: 'mmHg' };
        
        const validResult = validateWithZod(metricSchema, validMetric);
        expect(validResult.success).toBe(true);
        
        const invalidResult = validateWithZod(metricSchema, invalidMetric);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.errors?.value[0]).toContain('[Saúde]');
        expect(invalidResult.errors?.timestamp).toBeDefined();
      });

      it('should validate with pre-defined journey schemas', () => {
        // Using pre-defined health metric schema
        const validMetric = { 
          value: 120, 
          unit: 'mmHg', 
          timestamp: new Date(),
          source: 'manual'
        };
        
        const result = validateWithZod(healthSchemas.metric, validMetric);
        expect(result.success).toBe(true);
        
        // Using pre-defined care appointment schema
        const validAppointment = {
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
          date: tomorrow,
          duration: 30,
          type: 'in-person',
          status: 'scheduled'
        };
        
        const appointmentResult = validateWithZod(careSchemas.appointment, validAppointment);
        expect(appointmentResult.success).toBe(true);
        
        // Using pre-defined plan claim schema
        const validClaim = {
          serviceDate: yesterday,
          providerId: 'provider-123',
          procedureCode: 'PROC123',
          amount: 150.75,
          status: 'submitted',
          documents: ['doc1.pdf']
        };
        
        const claimResult = validateWithZod(planSchemas.claim, validClaim);
        expect(claimResult.success).toBe(true);
      });
    });

    describe('Class Validator Integration', () => {
      it('should validate with class-validator', () => {
        const validUser = { id: 'user-123', name: 'John Doe', email: 'john@example.com' };
        const invalidUser = { id: 'user-123', name: 'Jo', email: 'invalid-email' };
        
        const validResult = validateWithClassValidator(UserDto, validUser);
        expect(validResult.success).toBe(true);
        
        const invalidResult = validateWithClassValidator(UserDto, invalidUser);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.errors).toBeDefined();
        expect(invalidResult.errors?.name).toBeDefined();
        expect(invalidResult.errors?.email).toBeDefined();
      });

      it('should create Zod schemas from class-validator classes', () => {
        const userSchema = createZodSchemaFromClass(UserDto);
        
        const validUser = { id: 'user-123', name: 'John Doe', email: 'john@example.com' };
        const invalidUser = { id: 'user-123', name: 'Jo', email: 'invalid-email' };
        
        const validResult = validateWithZod(userSchema, validUser);
        expect(validResult.success).toBe(true);
        
        const invalidResult = validateWithZod(userSchema, invalidUser);
        expect(invalidResult.success).toBe(false);
      });
    });

    describe('Real-world Validation Scenarios', () => {
      it('should validate a complete health metric submission', () => {
        // Create a schema that combines multiple validators
        const healthMetricSchema = healthSchema.object({
          userId: healthSchema.string({ required: true }),
          type: healthSchema.string({ required: true }),
          value: healthSchema.number({ required: true }),
          unit: healthSchema.string({ required: true }),
          timestamp: healthSchema.date({ required: true }),
          source: healthSchema.string({ required: true }),
          metadata: healthSchema.object({
            systolic: healthSchema.number({ required: true }),
            diastolic: healthSchema.number({ required: true })
          })
        });
        
        // Valid submission
        const validSubmission = {
          userId: 'user-123',
          type: 'blood_pressure',
          value: 120,
          unit: 'mmHg',
          timestamp: new Date(),
          source: 'manual',
          metadata: {
            systolic: 120,
            diastolic: 80
          }
        };
        
        const validResult = validateWithZod(healthMetricSchema, validSubmission);
        expect(validResult.success).toBe(true);
        
        // Also check with object validator
        const objectSchema = {
          userId: { type: 'string', required: true },
          type: { type: 'string', required: true },
          value: { type: 'number', required: true },
          unit: { type: 'string', required: true },
          timestamp: { type: 'date', required: true },
          source: { type: 'string', required: true },
          metadata: { 
            type: 'object', 
            properties: {
              systolic: { type: 'number', required: true },
              diastolic: { type: 'number', required: true }
            }
          }
        };
        
        expect(isObjectWithShape(validSubmission, objectSchema, { validateNested: true })).toBe(true);
        
        // Also validate the timestamp is valid for health metrics
        expect(isValidHealthMetricDate(validSubmission.timestamp)).toBe(true);
      });

      it('should validate a complete appointment booking', () => {
        // Create a schema that combines multiple validators
        const appointmentSchema = careSchema.object({
          userId: careSchema.string({ required: true }),
          providerId: careSchema.string({ required: true }),
          specialtyId: careSchema.string({ required: true }),
          dateTime: careSchema.date({ required: true }),
          duration: careSchema.number({ required: true, integer: true }),
          type: z.enum(['in-person', 'telemedicine']),
          status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']),
          notes: careSchema.string()
        });
        
        // Valid booking
        const appointmentTime = new Date(tomorrow);
        appointmentTime.setHours(9, 0, 0, 0);
        
        const validBooking = {
          userId: 'user-123',
          providerId: 'provider-456',
          specialtyId: 'specialty-789',
          dateTime: appointmentTime,
          duration: 30,
          type: 'in-person',
          status: 'scheduled',
          notes: 'Regular check-up'
        };
        
        const validResult = validateWithZod(appointmentSchema, validBooking);
        expect(validResult.success).toBe(true);
        
        // Also validate the appointment date is valid
        expect(isValidAppointmentDate(validBooking.dateTime)).toBe(true);
      });

      it('should validate a complete insurance claim submission', () => {
        // Create a schema that combines multiple validators
        const claimSchema = planSchema.object({
          userId: planSchema.string({ required: true }),
          serviceDate: planSchema.date({ required: true }),
          providerId: planSchema.string({ required: true }),
          procedureCode: planSchema.string({ required: true }),
          amount: planSchema.number({ required: true }),
          status: z.enum(['submitted', 'in-review', 'approved', 'denied']),
          documents: planSchema.array(z.string())
        });
        
        // Valid claim
        const validClaim = {
          userId: 'user-123',
          serviceDate: yesterday,
          providerId: 'provider-456',
          procedureCode: 'PROC123',
          amount: 150.75,
          status: 'submitted',
          documents: ['doc1.pdf', 'doc2.pdf']
        };
        
        const validResult = validateWithZod(claimSchema, validClaim);
        expect(validResult.success).toBe(true);
        
        // Also validate the service date is valid for claims
        expect(isValidClaimDate(validClaim.serviceDate)).toBe(true);
        
        // Validate documents are PDFs
        expect(validateArrayProperty(validClaim, 'documents', 
          item => typeof item === 'string' && item.endsWith('.pdf')
        )).toBe(true);
      });
    });
  });
});