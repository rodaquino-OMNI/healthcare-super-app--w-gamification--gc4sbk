/**
 * End-to-end tests for validation utilities
 * 
 * These tests verify that validators work correctly in complete application contexts,
 * using real application data structures and workflows.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MinLength, validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { z } from 'zod';

// String validators
import {
  validateCPF,
  validateEmail,
  validateUrl,
  validateStringLength,
  validatePattern,
  StringValidationPatterns
} from '../../src/validation/string.validator';

// Date validators
import {
  isValidDate,
  isDateInRange,
  isBusinessDay,
  isValidJourneyDate,
  isValidJourneyDateRange,
  isValidDateInTimezone,
  isBrazilianHoliday
} from '../../src/validation/date.validator';

// Object validators
import {
  validateProperties,
  validateObjectSchema,
  validateArrayProperty,
  hasNestedProperty,
  hasValidNestedProperty,
  PropertyDefinition
} from '../../src/validation/object.validator';

// Schema validators
import {
  validateWithZod,
  validateWithClassValidator,
  createZodSchema,
  healthSchemas,
  careSchemas,
  planSchemas,
  assertValid
} from '../../src/validation/schema.validator';

describe('Validation Utilities (E2E)', () => {
  let app: INestApplication;

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
      it('should validate valid CPF numbers in different formats', () => {
        // Valid CPF with formatting
        expect(validateCPF('123.456.789-09').isValid).toBe(true);
        
        // Valid CPF without formatting
        expect(validateCPF('12345678909').isValid).toBe(true);
      });

      it('should reject invalid CPF numbers', () => {
        // Invalid CPF - wrong checksum
        const result = validateCPF('123.456.789-10');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid CPF format or checksum');
        
        // Invalid CPF - all same digits
        expect(validateCPF('111.111.111-11').isValid).toBe(false);
        
        // Invalid CPF - wrong length
        expect(validateCPF('123.456.789').isValid).toBe(false);
      });

      it('should provide detailed error information for invalid CPFs', () => {
        const result = validateCPF('123.456.789-00');
        expect(result.isValid).toBe(false);
        expect(result.details).toBeDefined();
        expect(result.details?.reason).toBe('checksum');
      });

      it('should validate CPF in a user registration scenario', () => {
        // Simulate user registration data
        const userData = {
          name: 'João Silva',
          email: 'joao@example.com.br',
          cpf: '529.982.247-25', // Valid CPF
          birthdate: '1985-03-15'
        };

        // Validate CPF as part of user registration
        const cpfValidation = validateCPF(userData.cpf);
        expect(cpfValidation.isValid).toBe(true);
      });
    });

    describe('Email Validation', () => {
      it('should validate standard email formats', () => {
        expect(validateEmail('user@example.com').isValid).toBe(true);
        expect(validateEmail('user.name+tag@example.co.uk').isValid).toBe(true);
      });

      it('should validate Brazilian email domains when required', () => {
        // Brazilian email validation
        expect(validateEmail('user@empresa.com.br', { allowBrazilianOnly: true }).isValid).toBe(true);
        expect(validateEmail('user@gov.br', { allowBrazilianOnly: true }).isValid).toBe(true);
        
        // Non-Brazilian email with Brazilian-only option
        expect(validateEmail('user@example.com', { allowBrazilianOnly: true, allowInternational: false }).isValid).toBe(false);
      });

      it('should reject invalid email formats', () => {
        expect(validateEmail('user@').isValid).toBe(false);
        expect(validateEmail('user@domain').isValid).toBe(false);
        expect(validateEmail('user@.com').isValid).toBe(false);
      });

      it('should validate email in a healthcare provider registration scenario', () => {
        // Simulate healthcare provider registration
        const providerData = {
          name: 'Dr. Ana Souza',
          specialty: 'Cardiologia',
          email: 'dra.ana@hospital.med.br',
          license: 'CRM-12345'
        };

        // Validate email as part of provider registration
        const emailValidation = validateEmail(providerData.email, { allowBrazilianOnly: true });
        expect(emailValidation.isValid).toBe(true);
      });
    });

    describe('URL Validation', () => {
      it('should validate standard URLs', () => {
        expect(validateUrl('https://www.example.com').isValid).toBe(true);
        expect(validateUrl('http://example.com/path?query=value').isValid).toBe(true);
      });

      it('should enforce HTTPS when required', () => {
        // Require HTTPS
        expect(validateUrl('http://example.com', { requireHttps: true }).isValid).toBe(false);
        expect(validateUrl('https://example.com', { requireHttps: true }).isValid).toBe(true);
      });

      it('should detect and block private IPs for SSRF protection', () => {
        // SSRF protection - block private IPs
        const result = validateUrl('http://192.168.1.1');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('URL blocked due to SSRF protection');
        
        // Allow private IPs when explicitly permitted
        expect(validateUrl('http://192.168.1.1', { allowPrivateIps: true }).isValid).toBe(true);
      });

      it('should validate URL in a medical integration scenario', () => {
        // Simulate external medical system integration
        const integrationConfig = {
          name: 'FHIR API Integration',
          baseUrl: 'https://api.healthcare-system.com/fhir',
          authType: 'oauth2',
          version: 'R4'
        };

        // Validate URL as part of integration configuration
        const urlValidation = validateUrl(integrationConfig.baseUrl, { requireHttps: true });
        expect(urlValidation.isValid).toBe(true);
      });
    });

    describe('String Length and Pattern Validation', () => {
      it('should validate string length constraints', () => {
        // Valid length
        expect(validateStringLength('password123', { min: 8, max: 20 }).isValid).toBe(true);
        
        // Too short
        expect(validateStringLength('pass', { min: 8 }).isValid).toBe(false);
        
        // Too long
        expect(validateStringLength('verylongpasswordthatexceedsmaximum', { max: 20 }).isValid).toBe(false);
      });

      it('should validate against regex patterns', () => {
        // Valid pattern match
        expect(validatePattern('ABC123', { 
          pattern: StringValidationPatterns.ALPHANUMERIC 
        }).isValid).toBe(true);
        
        // Invalid pattern match
        expect(validatePattern('ABC-123', { 
          pattern: StringValidationPatterns.ALPHANUMERIC 
        }).isValid).toBe(false);
      });

      it('should validate password strength in a user account scenario', () => {
        // Password strength pattern (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        
        // Simulate password change
        const passwordData = {
          currentPassword: 'oldPassword123',
          newPassword: 'StrongPwd123',
          confirmPassword: 'StrongPwd123'
        };

        // Validate password strength
        const lengthValidation = validateStringLength(passwordData.newPassword, { min: 8 });
        const patternValidation = validatePattern(passwordData.newPassword, { 
          pattern: passwordPattern,
          errorMessage: 'Password must contain at least 8 characters, including uppercase, lowercase, and numbers'
        });

        expect(lengthValidation.isValid).toBe(true);
        expect(patternValidation.isValid).toBe(true);
      });
    });
  });

  describe('Date Validators', () => {
    describe('Basic Date Validation', () => {
      it('should validate various date formats', () => {
        // Date object
        expect(isValidDate(new Date())).toBe(true);
        
        // ISO string
        expect(isValidDate('2023-05-15T10:30:00Z')).toBe(true);
        
        // Timestamp
        expect(isValidDate(1684144200000)).toBe(true);
        
        // Invalid date
        expect(isValidDate('not-a-date')).toBe(false);
      });

      it('should validate date ranges', () => {
        const startDate = new Date('2023-01-01');
        const middleDate = new Date('2023-01-15');
        const endDate = new Date('2023-01-31');
        
        // Date within range (inclusive)
        expect(isDateInRange(middleDate, startDate, endDate)).toBe(true);
        
        // Date at range boundary
        expect(isDateInRange(startDate, startDate, endDate, { inclusive: true })).toBe(true);
        
        // Date outside range
        expect(isDateInRange(new Date('2022-12-31'), startDate, endDate)).toBe(false);
        
        // Non-inclusive range
        expect(isDateInRange(startDate, startDate, endDate, { inclusive: false })).toBe(false);
      });

      it('should validate dates in a medical record scenario', () => {
        // Simulate medical record data
        const medicalRecord = {
          patientId: '12345',
          recordDate: '2023-03-15T14:30:00Z',
          symptoms: 'Fever, cough',
          diagnosis: 'Common cold'
        };

        // Validate record date is valid
        expect(isValidDate(medicalRecord.recordDate)).toBe(true);
        
        // Validate record date is not in the future
        const recordDate = new Date(medicalRecord.recordDate);
        const now = new Date();
        expect(recordDate <= now).toBe(true);
      });
    });

    describe('Business Day and Holiday Validation', () => {
      it('should identify Brazilian holidays', () => {
        // New Year's Day 2023
        expect(isBrazilianHoliday(new Date('2023-01-01'))).toBe(true);
        
        // Carnival Tuesday 2023
        expect(isBrazilianHoliday(new Date('2023-02-21'))).toBe(true);
        
        // Regular day
        expect(isBrazilianHoliday(new Date('2023-03-10'))).toBe(false);
      });

      it('should validate business days', () => {
        // Weekend (Sunday)
        expect(isBusinessDay(new Date('2023-03-12'))).toBe(false);
        
        // Holiday (Tiradentes Day)
        expect(isBusinessDay(new Date('2023-04-21'))).toBe(false);
        
        // Business day
        expect(isBusinessDay(new Date('2023-03-15'))).toBe(true);
      });

      it('should validate appointment scheduling in a care journey scenario', () => {
        // Simulate appointment scheduling
        const appointmentRequest = {
          doctorId: 'dr-123',
          patientId: 'patient-456',
          appointmentDate: '2023-03-15T14:00:00',
          appointmentType: 'consultation'
        };

        const appointmentDate = new Date(appointmentRequest.appointmentDate);
        
        // Validate appointment is on a business day
        expect(isBusinessDay(appointmentDate, { countryCode: 'BR' })).toBe(true);
        
        // Validate appointment is within business hours
        const hours = appointmentDate.getHours();
        expect(hours >= 9 && hours < 18).toBe(true);
      });
    });

    describe('Journey-Specific Date Validation', () => {
      it('should validate dates for health journey', () => {
        const healthMetricDate = new Date('2023-03-15T08:30:00');
        
        // Health journey allows past dates for records
        expect(isValidJourneyDate(healthMetricDate, 'health', {
          maxFutureDays: 0 // Don't allow future dates for health metrics
        })).toBe(true);
        
        // Future date beyond allowed range
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        expect(isValidJourneyDate(futureDate, 'health', {
          maxFutureDays: 7 // Allow up to 7 days in future
        })).toBe(false);
      });

      it('should validate dates for care journey', () => {
        // Care journey requires business days for appointments
        const appointmentDate = new Date('2023-03-15T14:00:00'); // A Wednesday
        
        expect(isValidJourneyDate(appointmentDate, 'care', {
          businessDaysOnly: true,
          maxFutureDays: 30 // Allow booking up to 30 days ahead
        })).toBe(true);
        
        // Weekend appointment should be invalid
        const weekendDate = new Date('2023-03-18T14:00:00'); // A Saturday
        expect(isValidJourneyDate(weekendDate, 'care', {
          businessDaysOnly: true
        })).toBe(false);
      });

      it('should validate dates for plan journey', () => {
        // Plan journey allows past dates for claims but limits how far back
        const claimDate = new Date('2023-02-15');
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24));
        
        expect(isValidJourneyDate(claimDate, 'plan', {
          maxPastDays: daysDiff + 10 // Allow claims up to this many days in the past
        })).toBe(true);
        
        // Very old claim date should be invalid
        const veryOldDate = new Date('2022-01-01');
        expect(isValidJourneyDate(veryOldDate, 'plan', {
          maxPastDays: 90 // Only allow claims from last 90 days
        })).toBe(false);
      });

      it('should validate date ranges for journey-specific scenarios', () => {
        // Health journey - validate date range for health report
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-31');
        
        expect(isValidJourneyDateRange(startDate, endDate, 'health', {
          maxRangeDays: 90 // Allow up to 90 days range for health reports
        })).toBe(true);
        
        // Too large range
        const farEndDate = new Date('2023-06-01');
        expect(isValidJourneyDateRange(startDate, farEndDate, 'health', {
          maxRangeDays: 90
        })).toBe(false);
      });
    });

    describe('Timezone-Aware Date Validation', () => {
      it('should validate dates in specific timezones', () => {
        // Create a date in UTC
        const utcDate = new Date('2023-03-15T14:00:00Z');
        
        // Validate in São Paulo timezone (UTC-3)
        expect(isValidDateInTimezone(utcDate, 'America/Sao_Paulo')).toBe(true);
        
        // Check if it's a business day in that timezone
        expect(isValidDateInTimezone(utcDate, 'America/Sao_Paulo', {
          businessDay: true
        })).toBe(true);
      });

      it('should validate appointment times across timezones', () => {
        // Simulate telemedicine appointment scheduling across timezones
        const appointmentData = {
          doctorTimezone: 'America/Sao_Paulo', // Doctor in São Paulo
          patientTimezone: 'America/New_York', // Patient in New York
          proposedTime: '2023-03-15T14:00:00Z' // UTC time
        };

        // Validate the appointment time is during business hours in doctor's timezone
        expect(isValidDateInTimezone(appointmentData.proposedTime, appointmentData.doctorTimezone, {
          businessDay: true
        })).toBe(true);
        
        // Also check it's a reasonable hour in patient's timezone
        const patientLocalTime = new Date(appointmentData.proposedTime);
        expect(isValidDateInTimezone(patientLocalTime, appointmentData.patientTimezone)).toBe(true);
      });
    });
  });

  describe('Object Validators', () => {
    describe('Property Validation', () => {
      it('should validate required properties', () => {
        const user = {
          id: '123',
          name: 'João Silva',
          email: 'joao@example.com'
        };
        
        const result = validateProperties(user, ['id', 'name', 'email']);
        expect(result.success).toBe(true);
        
        // Missing required property
        const incompleteUser = {
          id: '123',
          name: 'João Silva'
        };
        
        const incompleteResult = validateProperties(incompleteUser, ['id', 'name', 'email']);
        expect(incompleteResult.success).toBe(false);
        expect(incompleteResult.errors).toBeDefined();
        expect(incompleteResult.errors![0].field).toBe('email');
      });

      it('should validate optional properties', () => {
        const user = {
          id: '123',
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '5511999999999'
        };
        
        // Validate with required and optional properties
        const result = validateProperties(
          user,
          ['id', 'name', 'email'], // required
          ['phone', 'address']     // optional
        );
        
        expect(result.success).toBe(true);
      });

      it('should detect additional properties when not allowed', () => {
        const user = {
          id: '123',
          name: 'João Silva',
          email: 'joao@example.com',
          extraField: 'should not be here'
        };
        
        // Don't allow additional properties
        const result = validateProperties(
          user,
          ['id', 'name', 'email'],
          [],
          { allowAdditionalProperties: false }
        );
        
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors![0].field).toBe('extraField');
      });

      it('should validate properties in a patient registration scenario', () => {
        // Simulate patient registration data
        const patientData = {
          id: 'PT12345',
          name: 'Maria Santos',
          cpf: '529.982.247-25',
          birthdate: '1978-06-23',
          gender: 'female',
          contactInfo: {
            email: 'maria@example.com',
            phone: '5511999999999',
            address: 'Rua das Flores, 123'
          },
          insuranceInfo: {
            provider: 'AUSTA Saúde',
            planId: 'PREMIUM-2023',
            memberId: 'MS78901'
          }
        };

        // Validate required patient properties
        const result = validateProperties(
          patientData,
          ['id', 'name', 'cpf', 'birthdate', 'gender', 'contactInfo'],
          ['insuranceInfo']
        );
        
        expect(result.success).toBe(true);
        
        // Validate nested contact info properties
        const contactResult = validateProperties(
          patientData.contactInfo,
          ['email', 'phone'],
          ['address']
        );
        
        expect(contactResult.success).toBe(true);
      });
    });

    describe('Nested Property Validation', () => {
      it('should validate nested properties', () => {
        const user = {
          id: '123',
          name: 'João Silva',
          profile: {
            bio: 'Software developer',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        };
        
        // Check if nested property exists
        expect(hasNestedProperty(user, 'profile.preferences.theme')).toBe(true);
        expect(hasNestedProperty(user, 'profile.preferences.language')).toBe(false);
      });

      it('should validate nested property values', () => {
        const user = {
          id: '123',
          name: 'João Silva',
          profile: {
            bio: 'Software developer',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        };
        
        // Validate nested property value
        expect(hasValidNestedProperty(
          user,
          'profile.preferences.theme',
          value => ['light', 'dark', 'system'].includes(value)
        )).toBe(true);
        
        // Invalid nested property value
        expect(hasValidNestedProperty(
          user,
          'profile.preferences.theme',
          value => value === 'blue'
        )).toBe(false);
      });

      it('should validate nested properties in a health record scenario', () => {
        // Simulate health record with nested measurements
        const healthRecord = {
          patientId: 'PT12345',
          recordDate: '2023-03-15T10:30:00Z',
          measurements: {
            bloodPressure: {
              systolic: 120,
              diastolic: 80,
              unit: 'mmHg'
            },
            heartRate: {
              value: 72,
              unit: 'bpm'
            },
            bloodGlucose: {
              value: 95,
              unit: 'mg/dL',
              measurementType: 'fasting'
            }
          },
          notes: 'Regular checkup'
        };

        // Validate blood pressure measurements
        expect(hasNestedProperty(healthRecord, 'measurements.bloodPressure.systolic')).toBe(true);
        expect(hasNestedProperty(healthRecord, 'measurements.bloodPressure.diastolic')).toBe(true);
        
        // Validate systolic blood pressure is in normal range
        expect(hasValidNestedProperty(
          healthRecord,
          'measurements.bloodPressure.systolic',
          value => typeof value === 'number' && value >= 90 && value <= 140
        )).toBe(true);
        
        // Validate blood glucose is in normal fasting range
        expect(hasValidNestedProperty(
          healthRecord,
          'measurements.bloodGlucose.value',
          value => {
            if (healthRecord.measurements.bloodGlucose.measurementType === 'fasting') {
              return value >= 70 && value <= 100; // Normal fasting range (mg/dL)
            }
            return true; // Not validating non-fasting
          }
        )).toBe(true);
      });
    });

    describe('Object Schema Validation', () => {
      it('should validate objects against a schema', () => {
        // Define schema
        const userSchema: PropertyDefinition[] = [
          { name: 'id', required: true },
          { name: 'name', required: true, validator: value => typeof value === 'string' && value.length > 0 },
          { name: 'email', required: true, validator: value => typeof value === 'string' && value.includes('@') },
          { name: 'age', required: false, validator: value => typeof value === 'number' && value >= 18 }
        ];
        
        // Valid user
        const user = {
          id: '123',
          name: 'João Silva',
          email: 'joao@example.com',
          age: 30
        };
        
        const result = validateObjectSchema(user, userSchema);
        expect(result.success).toBe(true);
        
        // Invalid user (underage)
        const underageUser = {
          id: '124',
          name: 'Young User',
          email: 'young@example.com',
          age: 16
        };
        
        const underageResult = validateObjectSchema(underageUser, userSchema);
        expect(underageResult.success).toBe(false);
        expect(underageResult.errors).toBeDefined();
        expect(underageResult.errors![0].field).toBe('age');
      });

      it('should validate array properties', () => {
        const post = {
          id: 'post-123',
          title: 'Health Tips',
          content: 'Stay hydrated...',
          tags: ['health', 'wellness', 'hydration']
        };
        
        // Validate that all tags are non-empty strings
        const result = validateArrayProperty(
          post,
          'tags',
          tag => typeof tag === 'string' && tag.trim().length > 0
        );
        
        expect(result.success).toBe(true);
        
        // Invalid array element
        const invalidPost = {
          id: 'post-124',
          title: 'Health Tips',
          content: 'Stay hydrated...',
          tags: ['health', '', 'hydration'] // Empty tag
        };
        
        const invalidResult = validateArrayProperty(
          invalidPost,
          'tags',
          tag => typeof tag === 'string' && tag.trim().length > 0
        );
        
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.errors).toBeDefined();
        expect(invalidResult.errors![0].field).toBe('tags[1]');
      });

      it('should validate objects in a medical prescription scenario', () => {
        // Define prescription schema
        const prescriptionSchema: PropertyDefinition[] = [
          { name: 'id', required: true },
          { name: 'patientId', required: true },
          { name: 'doctorId', required: true },
          { name: 'date', required: true, validator: value => isValidDate(value) },
          { name: 'medications', required: true, validator: value => Array.isArray(value) && value.length > 0 },
          { name: 'notes', required: false }
        ];
        
        // Simulate prescription data
        const prescription = {
          id: 'RX12345',
          patientId: 'PT12345',
          doctorId: 'DR98765',
          date: '2023-03-15T14:30:00Z',
          medications: [
            {
              name: 'Amoxicillin',
              dosage: '500mg',
              frequency: '8h',
              duration: '7 days'
            },
            {
              name: 'Ibuprofen',
              dosage: '400mg',
              frequency: '12h',
              duration: '3 days',
              instructions: 'Take with food'
            }
          ],
          notes: 'Follow up in 10 days if symptoms persist'
        };

        // Validate prescription against schema
        const result = validateObjectSchema(prescription, prescriptionSchema);
        expect(result.success).toBe(true);
        
        // Validate each medication in the array
        const medicationSchema: PropertyDefinition[] = [
          { name: 'name', required: true },
          { name: 'dosage', required: true },
          { name: 'frequency', required: true },
          { name: 'duration', required: true },
          { name: 'instructions', required: false }
        ];
        
        prescription.medications.forEach((medication, index) => {
          const medResult = validateObjectSchema(medication, medicationSchema);
          expect(medResult.success).toBe(true);
        });
      });
    });
  });

  describe('Schema Validators', () => {
    describe('Zod Schema Validation', () => {
      it('should validate data against Zod schemas', async () => {
        // Define Zod schema
        const userSchema = z.object({
          id: z.string(),
          name: z.string().min(1),
          email: z.string().email(),
          age: z.number().min(18).optional()
        });
        
        // Valid user
        const user = {
          id: '123',
          name: 'João Silva',
          email: 'joao@example.com',
          age: 30
        };
        
        const result = await validateWithZod(userSchema, user);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(user);
        
        // Invalid user
        const invalidUser = {
          id: '124',
          name: '',  // Empty name
          email: 'invalid-email', // Invalid email
          age: 16    // Underage
        };
        
        const invalidResult = await validateWithZod(userSchema, invalidUser);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.errors).toBeDefined();
        expect(invalidResult.errors!.length).toBe(2); // Name and email errors
      });

      it('should use journey-specific error messages', async () => {
        // Create a health journey schema
        const healthMetricSchema = createZodSchema(
          z.object({
            patientId: z.string(),
            metricType: z.string(),
            value: z.number().min(0),
            unit: z.string(),
            date: z.string().refine(val => isValidDate(val), { message: 'Invalid date' })
          }),
          'health' // Journey ID
        );
        
        // Invalid health metric
        const invalidMetric = {
          patientId: 'PT12345',
          metricType: 'bloodGlucose',
          value: -10, // Negative value
          unit: 'mg/dL',
          date: '2023-03-15T10:30:00Z'
        };
        
        const result = await validateWithZod(healthMetricSchema, invalidMetric);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors![0].message).toContain('Health metric is below minimum value');
      });

      it('should validate data in a health metrics scenario', async () => {
        // Use pre-configured health schemas
        const bloodPressureSchema = z.object({
          systolic: healthSchemas.number({ min: 70, max: 200 }),
          diastolic: healthSchemas.number({ min: 40, max: 120 }),
          pulse: healthSchemas.number({ min: 40, max: 200, required: false }),
          measurementDate: healthSchemas.date()
        });
        
        // Valid blood pressure reading
        const bloodPressureReading = {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          measurementDate: new Date('2023-03-15T10:30:00Z')
        };
        
        const result = await validateWithZod(bloodPressureSchema, bloodPressureReading);
        expect(result.success).toBe(true);
        
        // Invalid blood pressure reading
        const invalidReading = {
          systolic: 220, // Too high
          diastolic: 85,
          measurementDate: new Date('2023-03-15T10:30:00Z')
        };
        
        const invalidResult = await validateWithZod(bloodPressureSchema, invalidReading);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.errors).toBeDefined();
        expect(invalidResult.errors![0].message).toContain('Health metric exceeds maximum value');
      });
    });

    describe('Class Validator Integration', () => {
      // Define a class with class-validator decorators
      class AppointmentDto {
        @IsNotEmpty()
        @IsString()
        doctorId: string;
        
        @IsNotEmpty()
        @IsString()
        patientId: string;
        
        @IsNotEmpty()
        appointmentDate: Date;
        
        @IsString()
        @MinLength(3)
        appointmentType: string;
        
        @IsEmail()
        notificationEmail?: string;
      }

      it('should validate classes with class-validator', async () => {
        // Valid appointment
        const appointmentData = {
          doctorId: 'DR98765',
          patientId: 'PT12345',
          appointmentDate: new Date('2023-03-20T14:00:00Z'),
          appointmentType: 'consultation',
          notificationEmail: 'patient@example.com'
        };
        
        const result = await validateWithClassValidator(AppointmentDto, appointmentData);
        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(AppointmentDto);
        
        // Invalid appointment
        const invalidAppointment = {
          doctorId: 'DR98765',
          // Missing patientId
          appointmentDate: new Date('2023-03-20T14:00:00Z'),
          appointmentType: 'x', // Too short
          notificationEmail: 'invalid-email' // Invalid email
        };
        
        const invalidResult = await validateWithClassValidator(AppointmentDto, invalidAppointment);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.errors).toBeDefined();
        expect(invalidResult.errors!.length).toBe(3); // Missing patientId, short type, invalid email
      });

      it('should validate DTO in a care journey appointment scenario', async () => {
        // Simulate appointment creation in care journey
        const appointmentRequest = {
          doctorId: 'DR98765',
          patientId: 'PT12345',
          appointmentDate: new Date('2023-03-20T14:00:00Z'),
          appointmentType: 'follow-up',
          notificationEmail: 'patient@example.com'
        };
        
        // Validate appointment request
        const validationResult = await validateWithClassValidator(AppointmentDto, appointmentRequest);
        
        if (validationResult.success) {
          // In a real application, we would proceed with appointment creation
          const appointment = validationResult.data!;
          
          // Additional business rule validation
          const isBusinessDay = isValidJourneyDate(appointment.appointmentDate, 'care', {
            businessDaysOnly: true
          });
          
          expect(isBusinessDay).toBe(true);
        } else {
          fail('Appointment validation should succeed');
        }
      });
    });

    describe('Runtime Type Checking', () => {
      it('should perform runtime type checking for critical operations', () => {
        // Define schema for critical operation
        const transferSchema = z.object({
          sourceAccountId: z.string(),
          destinationAccountId: z.string(),
          amount: z.number().positive(),
          currency: z.string().length(3),
          description: z.string().optional()
        });
        
        // Valid transfer data
        const transferData = {
          sourceAccountId: 'ACC-001',
          destinationAccountId: 'ACC-002',
          amount: 1000.50,
          currency: 'BRL',
          description: 'Monthly payment'
        };
        
        // Use assertValid for runtime type checking
        const validatedData = assertValid(transferData, transferSchema);
        expect(validatedData).toEqual(transferData);
        
        // Invalid data should throw an error
        const invalidData = {
          sourceAccountId: 'ACC-001',
          destinationAccountId: 'ACC-002',
          amount: -100, // Negative amount
          currency: 'BRL'
        };
        
        expect(() => assertValid(invalidData, transferSchema)).toThrow();
      });

      it('should validate critical data in a medication administration scenario', () => {
        // Define schema for medication administration
        const medicationSchema = z.object({
          patientId: z.string(),
          medicationId: z.string(),
          dosage: z.number().positive(),
          unit: z.string(),
          route: z.enum(['oral', 'intravenous', 'intramuscular', 'subcutaneous']),
          administeredBy: z.string(),
          administeredAt: z.date()
        });
        
        // Simulate medication administration data
        const medicationData = {
          patientId: 'PT12345',
          medicationId: 'MED-789',
          dosage: 10,
          unit: 'mg',
          route: 'oral',
          administeredBy: 'NURSE-456',
          administeredAt: new Date()
        };
        
        // Critical operation - validate before recording administration
        try {
          const validatedData = assertValid(medicationData, medicationSchema);
          
          // In a real application, we would proceed with recording the administration
          expect(validatedData).toEqual(medicationData);
        } catch (error) {
          fail('Medication data validation should not throw: ' + error);
        }
        
        // Invalid medication data (wrong route)
        const invalidData = {
          ...medicationData,
          route: 'topical' // Not in enum
        };
        
        expect(() => assertValid(invalidData, medicationSchema)).toThrow();
      });
    });

    describe('Cross-Journey Validation', () => {
      it('should validate data that spans multiple journeys', async () => {
        // Define schemas for different journeys
        const healthProfileSchema = healthSchemas.model('HealthProfile', z.object({
          patientId: z.string(),
          height: z.number().positive(),
          weight: z.number().positive(),
          bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
          allergies: z.array(z.string()).optional()
        }));
        
        const careProfileSchema = careSchemas.model('CareProfile', z.object({
          patientId: z.string(),
          primaryPhysician: z.string(),
          emergencyContact: z.string(),
          preferredHospital: z.string().optional()
        }));
        
        const planProfileSchema = planSchemas.model('PlanProfile', z.object({
          patientId: z.string(),
          planId: z.string(),
          memberId: z.string(),
          coverageStartDate: z.date(),
          coverageEndDate: z.date().optional()
        }));
        
        // Simulate user with data across all journeys
        const userData = {
          userId: 'USER-123',
          name: 'Ana Silva',
          email: 'ana@example.com',
          journeyData: {
            health: {
              patientId: 'PT-ANA-001',
              height: 165,
              weight: 60,
              bloodType: 'O+',
              allergies: ['Penicillin']
            },
            care: {
              patientId: 'PT-ANA-001',
              primaryPhysician: 'DR-CARDIO-001',
              emergencyContact: '5511999999999',
              preferredHospital: 'AUSTA Hospital'
            },
            plan: {
              patientId: 'PT-ANA-001',
              planId: 'PREMIUM-2023',
              memberId: 'MEM-12345',
              coverageStartDate: new Date('2023-01-01'),
              coverageEndDate: new Date('2023-12-31')
            }
          }
        };

        // Validate each journey's data
        const healthResult = await validateWithZod(healthProfileSchema, userData.journeyData.health);
        const careResult = await validateWithZod(careProfileSchema, userData.journeyData.care);
        const planResult = await validateWithZod(planProfileSchema, userData.journeyData.plan);
        
        expect(healthResult.success).toBe(true);
        expect(careResult.success).toBe(true);
        expect(planResult.success).toBe(true);
        
        // Validate cross-journey consistency
        const healthPatientId = userData.journeyData.health.patientId;
        const carePatientId = userData.journeyData.care.patientId;
        const planPatientId = userData.journeyData.plan.patientId;
        
        // Patient IDs should be consistent across journeys
        expect(healthPatientId).toBe(carePatientId);
        expect(carePatientId).toBe(planPatientId);
      });

      it('should validate gamification events from different journeys', async () => {
        // Define base event schema
        const baseEventSchema = z.object({
          eventId: z.string().uuid(),
          userId: z.string(),
          timestamp: z.date(),
          journeyId: z.enum(['health', 'care', 'plan']),
          eventType: z.string(),
          points: z.number().int().nonnegative()
        });
        
        // Journey-specific event schemas
        const healthEventSchema = baseEventSchema.extend({
          journeyId: z.literal('health'),
          eventType: z.enum([
            'HEALTH_METRIC_RECORDED',
            'HEALTH_GOAL_ACHIEVED',
            'HEALTH_CHALLENGE_COMPLETED'
          ]),
          metadata: z.object({
            metricType: z.string().optional(),
            goalId: z.string().optional(),
            challengeId: z.string().optional(),
            value: z.number().optional()
          })
        });
        
        const careEventSchema = baseEventSchema.extend({
          journeyId: z.literal('care'),
          eventType: z.enum([
            'APPOINTMENT_COMPLETED',
            'MEDICATION_ADHERENCE',
            'TELEMEDICINE_SESSION'
          ]),
          metadata: z.object({
            appointmentId: z.string().optional(),
            medicationId: z.string().optional(),
            sessionId: z.string().optional(),
            duration: z.number().optional()
          })
        });
        
        // Simulate events from different journeys
        const healthEvent = {
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'USER-123',
          timestamp: new Date(),
          journeyId: 'health',
          eventType: 'HEALTH_METRIC_RECORDED',
          points: 10,
          metadata: {
            metricType: 'bloodPressure',
            value: 120
          }
        };
        
        const careEvent = {
          eventId: '123e4567-e89b-12d3-a456-426614174001',
          userId: 'USER-123',
          timestamp: new Date(),
          journeyId: 'care',
          eventType: 'APPOINTMENT_COMPLETED',
          points: 20,
          metadata: {
            appointmentId: 'APT-12345',
            duration: 30
          }
        };

        // Validate events
        const healthEventResult = await validateWithZod(
          healthEventSchema,
          healthEvent
        );
        
        const careEventResult = await validateWithZod(
          careEventSchema,
          careEvent
        );
        
        expect(healthEventResult.success).toBe(true);
        expect(careEventResult.success).toBe(true);
        
        // Invalid event (wrong metadata for event type)
        const invalidHealthEvent = {
          ...healthEvent,
          eventType: 'HEALTH_GOAL_ACHIEVED',
          // Missing goalId in metadata
        };
        
        // This should still be valid as goalId is optional
        const invalidResult = await validateWithZod(
          healthEventSchema,
          invalidHealthEvent
        );
        
        expect(invalidResult.success).toBe(true);
      });
    });
  });
});