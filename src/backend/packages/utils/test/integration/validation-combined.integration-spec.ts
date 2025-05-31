/**
 * Integration Test Suite for Combined Validation Utilities
 * 
 * This test suite validates the combined application of multiple validation utilities
 * in different validation contexts. It ensures that validation rules work correctly
 * when applied together, across different journey domains (health, care, plan), and
 * with both synchronous and asynchronous validation workflows.
 */

import { ValidationResult } from '../../src/validation';
import * as stringValidator from '../../src/validation/string.validator';
import * as objectValidator from '../../src/validation/object.validator';
import * as numberValidator from '../../src/validation/number.validator';
import * as dateValidator from '../../src/validation/date.validator';
import * as commonValidator from '../../src/validation/common.validator';
import * as schemaValidator from '../../src/validation/schema.validator';

import testHelpers, { 
  IntegrationTestContext, 
  JourneyType,
  createTestContext,
  setupHealthJourneyTest,
  setupCareJourneyTest,
  setupPlanJourneyTest,
  generateCrossJourneyData
} from './helpers';

describe('Combined Validation Utilities Integration', () => {
  let context: IntegrationTestContext;

  beforeEach(() => {
    context = createTestContext();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('String Validation Combinations', () => {
    it('should validate CPF and email together', () => {
      const validData = {
        cpf: '123.456.789-09', // This is not a valid CPF, but we're mocking validation
        email: 'user@example.com'
      };

      const invalidData = {
        cpf: '123.456.789-00', // Invalid CPF
        email: 'invalid-email'
      };

      // Mock the CPF validation for testing purposes
      jest.spyOn(stringValidator, 'isValidCPF').mockImplementation((cpf) => cpf === '123.456.789-09');

      // Combined validation function
      const validateUserIdentity = (data: any): ValidationResult => {
        const cpfResult = stringValidator.validateCPF(data.cpf);
        if (!cpfResult.valid) {
          return cpfResult;
        }

        const emailResult = stringValidator.validateEmail(data.email);
        if (!emailResult.valid) {
          return emailResult;
        }

        return { valid: true, value: data };
      };

      // Test with valid data
      const validResult = validateUserIdentity(validData);
      expect(validResult.valid).toBe(true);

      // Test with invalid CPF
      const invalidCpfData = { ...validData, cpf: invalidData.cpf };
      const invalidCpfResult = validateUserIdentity(invalidCpfData);
      expect(invalidCpfResult.valid).toBe(false);
      expect(invalidCpfResult.message).toContain('CPF');

      // Test with invalid email
      const invalidEmailData = { ...validData, email: invalidData.email };
      const invalidEmailResult = validateUserIdentity(invalidEmailData);
      expect(invalidEmailResult.valid).toBe(false);
      expect(invalidEmailResult.message).toContain('Email');
    });

    it('should validate URL with pattern matching and length validation', () => {
      // Combined validation function for URLs
      const validateApiEndpoint = (url: string): ValidationResult => {
        // First check if it's a valid URL
        const urlResult = stringValidator.validateUrl(url, { 
          requireHttps: true,
          checkSsrf: true
        });

        if (!urlResult.valid) {
          return urlResult;
        }

        // Then check if it matches our API pattern
        const patternResult = stringValidator.validatePattern(url, {
          pattern: /^https:\/\/api\.austa\.local\/v\d+\/.+$/
        });

        if (!patternResult.valid) {
          return {
            valid: false,
            message: 'URL must follow the pattern: https://api.austa.local/v{version}/{endpoint}',
            value: url
          };
        }

        // Finally check if the URL isn't too long
        const lengthResult = stringValidator.validateLength(url, {
          max: 100
        });

        if (!lengthResult.valid) {
          return lengthResult;
        }

        return { valid: true, value: url };
      };

      // Test with valid URL
      const validUrl = 'https://api.austa.local/v1/health/metrics';
      const validResult = validateApiEndpoint(validUrl);
      expect(validResult.valid).toBe(true);

      // Test with non-HTTPS URL
      const nonHttpsUrl = 'http://api.austa.local/v1/health/metrics';
      const nonHttpsResult = validateApiEndpoint(nonHttpsUrl);
      expect(nonHttpsResult.valid).toBe(false);
      expect(nonHttpsResult.message).toContain('HTTPS');

      // Test with URL not matching pattern
      const invalidPatternUrl = 'https://api.example.com/health/metrics';
      const invalidPatternResult = validateApiEndpoint(invalidPatternUrl);
      expect(invalidPatternResult.valid).toBe(false);
      expect(invalidPatternResult.message).toContain('pattern');

      // Test with URL that's too long
      const longUrl = 'https://api.austa.local/v1/' + 'a'.repeat(100);
      const longUrlResult = validateApiEndpoint(longUrl);
      expect(longUrlResult.valid).toBe(false);
      expect(longUrlResult.message).toContain('length');
    });

    it('should combine string validators with custom error messages', () => {
      // Create a custom validator that combines multiple string validations
      const validateUsername = (username: string): ValidationResult => {
        // Check if not empty
        if (stringValidator.isEmptyString(username)) {
          return {
            valid: false,
            message: 'Username cannot be empty',
            value: username
          };
        }

        // Check length
        if (!stringValidator.isValidLength(username, { min: 3, max: 20 })) {
          return {
            valid: false,
            message: 'Username must be between 3 and 20 characters',
            value: username
          };
        }

        // Check if alphanumeric
        if (!stringValidator.isAlphanumeric(username)) {
          return {
            valid: false,
            message: 'Username must contain only letters and numbers',
            value: username
          };
        }

        return { valid: true, value: username };
      };

      // Test with valid username
      expect(validateUsername('user123').valid).toBe(true);

      // Test with empty username
      const emptyResult = validateUsername('');
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.message).toBe('Username cannot be empty');

      // Test with short username
      const shortResult = validateUsername('ab');
      expect(shortResult.valid).toBe(false);
      expect(shortResult.message).toBe('Username must be between 3 and 20 characters');

      // Test with non-alphanumeric username
      const nonAlphanumericResult = validateUsername('user@123');
      expect(nonAlphanumericResult.valid).toBe(false);
      expect(nonAlphanumericResult.message).toBe('Username must contain only letters and numbers');
    });
  });

  describe('Object Validation Combinations', () => {
    it('should validate complex objects with nested validation rules', () => {
      // Define a schema for a user profile
      const userProfileSchema = {
        id: { type: 'string', required: true },
        name: { 
          type: 'string', 
          required: true,
          validator: (value: string) => stringValidator.isValidLength(value, { min: 2, max: 50 })
        },
        email: {
          type: 'string',
          required: true,
          validator: (value: string) => stringValidator.isValidEmail(value)
        },
        age: {
          type: 'number',
          required: true,
          validator: (value: number) => numberValidator.isInRange(value, { min: 18, max: 120 })
        },
        address: {
          type: 'object',
          required: true,
          properties: {
            street: { type: 'string', required: true },
            city: { type: 'string', required: true },
            state: { type: 'string', required: true },
            zipCode: { 
              type: 'string', 
              required: true,
              validator: (value: string) => /^\d{5}-\d{3}$/.test(value)
            }
          }
        },
        preferences: {
          type: 'object',
          properties: {
            notifications: { type: 'boolean' },
            theme: { type: 'string' }
          }
        },
        tags: {
          type: 'array',
          items: { type: 'string' }
        }
      };

      // Create a validator function
      const validateUserProfile = objectValidator.createDetailedObjectValidator(userProfileSchema, {
        validateNested: true,
        checkTypes: true,
        allowAdditionalProperties: false
      });

      // Valid user profile
      const validProfile = {
        id: 'user123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 30,
        address: {
          street: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100'
        },
        preferences: {
          notifications: true,
          theme: 'dark'
        },
        tags: ['health', 'fitness']
      };

      // Test with valid profile
      const validResult = validateUserProfile(validProfile);
      expect(validResult.valid).toBe(true);

      // Test with invalid email
      const invalidEmailProfile = {
        ...validProfile,
        email: 'invalid-email'
      };
      const invalidEmailResult = validateUserProfile(invalidEmailProfile);
      expect(invalidEmailResult.valid).toBe(false);
      expect(invalidEmailResult.invalidProperties).toHaveProperty('email');

      // Test with invalid nested property
      const invalidAddressProfile = {
        ...validProfile,
        address: {
          ...validProfile.address,
          zipCode: '12345'
        }
      };
      const invalidAddressResult = validateUserProfile(invalidAddressProfile);
      expect(invalidAddressResult.valid).toBe(false);
      expect(invalidAddressResult.invalidProperties).toHaveProperty('address.zipCode');

      // Test with additional properties
      const additionalPropsProfile = {
        ...validProfile,
        extraField: 'should not be here'
      };
      const additionalPropsResult = validateUserProfile(additionalPropsProfile);
      expect(additionalPropsResult.valid).toBe(false);
      expect(additionalPropsResult.message).toContain('additional properties');
    });

    it('should validate arrays with complex validation rules', () => {
      // Define a schema for a health metric
      const healthMetricSchema = {
        id: { type: 'string', required: true },
        type: { 
          type: 'string', 
          required: true,
          validator: (value: string) => ['weight', 'blood_pressure', 'glucose', 'heart_rate'].includes(value)
        },
        value: { type: 'number', required: true },
        unit: { type: 'string', required: true },
        timestamp: { 
          type: 'date', 
          required: true,
          validator: (value: Date) => dateValidator.isValidDate(value) && dateValidator.isPastDate(value)
        },
        source: { type: 'string' }
      };

      // Create a validator function for an array of health metrics
      const validateHealthMetrics = (metrics: any[]): ValidationResult => {
        if (!Array.isArray(metrics)) {
          return {
            valid: false,
            message: 'Expected an array of health metrics',
            value: metrics
          };
        }

        const metricValidator = objectValidator.createDetailedObjectValidator(healthMetricSchema);
        const invalidMetrics: { index: number, errors: Record<string, string> }[] = [];

        metrics.forEach((metric, index) => {
          const result = metricValidator(metric);
          if (!result.valid && result.invalidProperties) {
            invalidMetrics.push({
              index,
              errors: result.invalidProperties
            });
          }
        });

        if (invalidMetrics.length > 0) {
          return {
            valid: false,
            message: `${invalidMetrics.length} health metrics failed validation`,
            details: { invalidMetrics },
            value: metrics
          };
        }

        return { valid: true, value: metrics };
      };

      // Valid health metrics
      const validMetrics = [
        {
          id: 'metric1',
          type: 'weight',
          value: 75.5,
          unit: 'kg',
          timestamp: new Date(Date.now() - 86400000), // yesterday
          source: 'manual'
        },
        {
          id: 'metric2',
          type: 'glucose',
          value: 95,
          unit: 'mg/dL',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          source: 'device'
        }
      ];

      // Test with valid metrics
      const validResult = validateHealthMetrics(validMetrics);
      expect(validResult.valid).toBe(true);

      // Test with invalid metric type
      const invalidTypeMetrics = [
        ...validMetrics,
        {
          id: 'metric3',
          type: 'invalid_type', // Invalid type
          value: 120,
          unit: 'bpm',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          source: 'device'
        }
      ];
      const invalidTypeResult = validateHealthMetrics(invalidTypeMetrics);
      expect(invalidTypeResult.valid).toBe(false);
      expect(invalidTypeResult.details?.invalidMetrics).toHaveLength(1);
      expect(invalidTypeResult.details?.invalidMetrics[0].errors).toHaveProperty('type');

      // Test with future timestamp (invalid)
      const invalidTimestampMetrics = [
        ...validMetrics,
        {
          id: 'metric4',
          type: 'heart_rate',
          value: 72,
          unit: 'bpm',
          timestamp: new Date(Date.now() + 86400000), // tomorrow (future)
          source: 'device'
        }
      ];
      const invalidTimestampResult = validateHealthMetrics(invalidTimestampMetrics);
      expect(invalidTimestampResult.valid).toBe(false);
      expect(invalidTimestampResult.details?.invalidMetrics).toHaveLength(1);
      expect(invalidTimestampResult.details?.invalidMetrics[0].errors).toHaveProperty('timestamp');
    });
  });

  describe('Journey-Specific Validation Combinations', () => {
    it('should validate health journey data with combined validators', () => {
      // Set up health journey test context
      setupHealthJourneyTest(context);

      // Define a validator for health goals
      const validateHealthGoal = (goal: any): ValidationResult => {
        // Schema for health goals
        const healthGoalSchema = {
          id: { type: 'string', required: true },
          userId: { type: 'string', required: true },
          type: { 
            type: 'string', 
            required: true,
            validator: (value: string) => [
              'WEIGHT', 'STEPS', 'SLEEP', 'WATER', 'EXERCISE'
            ].includes(value)
          },
          target: { type: 'number', required: true },
          unit: { type: 'string', required: true },
          startDate: { 
            type: 'date', 
            required: true,
            validator: (value: Date) => dateValidator.isValidDate(value)
          },
          endDate: { 
            type: 'date', 
            required: true,
            validator: (value: Date) => {
              return dateValidator.isValidDate(value) && 
                     dateValidator.isDateInRange(value, { min: goal.startDate });
            }
          },
          progress: { 
            type: 'number',
            validator: (value: number) => numberValidator.isInRange(value, { min: 0, max: 100 })
          },
          status: { 
            type: 'string',
            validator: (value: string) => ['ACTIVE', 'COMPLETED', 'ABANDONED'].includes(value)
          }
        };

        return objectValidator.validateObjectStructure(goal, healthGoalSchema, {
          validateNested: true,
          checkTypes: true
        });
      };

      // Create a valid health goal
      const validGoal = {
        id: 'goal123',
        userId: 'user456',
        type: 'WEIGHT',
        target: 70,
        unit: 'kg',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
        progress: 45,
        status: 'ACTIVE'
      };

      // Test with valid goal
      const validResult = validateHealthGoal(validGoal);
      expect(validResult.valid).toBe(true);

      // Test with invalid goal type
      const invalidTypeGoal = { ...validGoal, type: 'INVALID_TYPE' };
      const invalidTypeResult = validateHealthGoal(invalidTypeGoal);
      expect(invalidTypeResult.valid).toBe(false);
      expect(invalidTypeResult.invalidProperties).toHaveProperty('type');

      // Test with end date before start date
      const invalidDateGoal = { 
        ...validGoal, 
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-03-31')
      };
      const invalidDateResult = validateHealthGoal(invalidDateGoal);
      expect(invalidDateResult.valid).toBe(false);
      expect(invalidDateResult.invalidProperties).toHaveProperty('endDate');

      // Test with invalid progress value
      const invalidProgressGoal = { ...validGoal, progress: 110 }; // Over 100%
      const invalidProgressResult = validateHealthGoal(invalidProgressGoal);
      expect(invalidProgressResult.valid).toBe(false);
      expect(invalidProgressResult.invalidProperties).toHaveProperty('progress');
    });

    it('should validate care journey data with combined validators', () => {
      // Set up care journey test context
      setupCareJourneyTest(context);

      // Define a validator for appointments
      const validateAppointment = (appointment: any): ValidationResult => {
        // First validate the appointment time
        const timeValidation = (startTime: Date, endTime: Date): boolean => {
          // Appointments must be in the future
          if (!dateValidator.isFutureDate(startTime)) {
            return false;
          }
          
          // End time must be after start time
          if (!dateValidator.isDateInRange(endTime, { min: startTime })) {
            return false;
          }
          
          // Appointments must be during business hours (8 AM to 6 PM)
          const hours = startTime.getHours();
          if (hours < 8 || hours >= 18) {
            return false;
          }
          
          return true;
        };

        // Schema for appointments
        const appointmentSchema = {
          id: { type: 'string', required: true },
          patientId: { type: 'string', required: true },
          providerId: { type: 'string', required: true },
          specialty: { 
            type: 'string', 
            required: true,
            validator: (value: string) => context.testData.appointmentsByStatus !== undefined
          },
          status: { 
            type: 'string', 
            required: true,
            validator: (value: string) => ['scheduled', 'completed', 'cancelled', 'no-show'].includes(value)
          },
          startTime: { 
            type: 'date', 
            required: true,
            validator: (value: Date) => dateValidator.isValidDate(value)
          },
          endTime: { 
            type: 'date', 
            required: true,
            validator: (value: Date) => dateValidator.isValidDate(value)
          },
          notes: { type: 'string' },
          location: { 
            type: 'string',
            required: true,
            validator: (value: string) => ['in-person', 'telemedicine'].includes(value)
          }
        };

        // First validate the object structure
        const structureResult = objectValidator.validateObjectStructure(appointment, appointmentSchema, {
          validateNested: true,
          checkTypes: true
        });

        if (!structureResult.valid) {
          return structureResult;
        }

        // Then validate the appointment time constraints
        if (!timeValidation(appointment.startTime, appointment.endTime)) {
          return {
            valid: false,
            message: 'Appointment time validation failed. Appointments must be in the future, during business hours, and end time must be after start time.',
            value: appointment
          };
        }

        return { valid: true, value: appointment };
      };

      // Create a valid appointment (using a future date during business hours)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // 10 AM

      const endTime = new Date(tomorrow);
      endTime.setMinutes(endTime.getMinutes() + 30); // 30 minutes later

      const validAppointment = {
        id: 'appt123',
        patientId: 'patient456',
        providerId: 'provider789',
        specialty: 'Cardiologia',
        status: 'scheduled',
        startTime: tomorrow,
        endTime: endTime,
        notes: 'Regular checkup',
        location: 'in-person'
      };

      // Test with valid appointment
      const validResult = validateAppointment(validAppointment);
      expect(validResult.valid).toBe(true);

      // Test with past appointment (invalid)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      pastDate.setHours(10, 0, 0, 0);

      const pastEndTime = new Date(pastDate);
      pastEndTime.setMinutes(pastEndTime.getMinutes() + 30);

      const pastAppointment = {
        ...validAppointment,
        startTime: pastDate,
        endTime: pastEndTime
      };

      const pastResult = validateAppointment(pastAppointment);
      expect(pastResult.valid).toBe(false);
      expect(pastResult.message).toContain('time validation failed');

      // Test with non-business hours (invalid)
      const nonBusinessDate = new Date(tomorrow);
      nonBusinessDate.setHours(20, 0, 0, 0); // 8 PM

      const nonBusinessEndTime = new Date(nonBusinessDate);
      nonBusinessEndTime.setMinutes(nonBusinessEndTime.getMinutes() + 30);

      const nonBusinessAppointment = {
        ...validAppointment,
        startTime: nonBusinessDate,
        endTime: nonBusinessEndTime
      };

      const nonBusinessResult = validateAppointment(nonBusinessAppointment);
      expect(nonBusinessResult.valid).toBe(false);
      expect(nonBusinessResult.message).toContain('time validation failed');

      // Test with invalid status
      const invalidStatusAppointment = {
        ...validAppointment,
        status: 'pending' // Invalid status
      };

      const invalidStatusResult = validateAppointment(invalidStatusAppointment);
      expect(invalidStatusResult.valid).toBe(false);
      expect(invalidStatusResult.invalidProperties).toHaveProperty('status');
    });

    it('should validate plan journey data with combined validators', () => {
      // Set up plan journey test context
      setupPlanJourneyTest(context);

      // Define a validator for insurance claims
      const validateInsuranceClaim = (claim: any): ValidationResult => {
        // Schema for insurance claims
        const claimSchema = {
          id: { type: 'string', required: true },
          memberId: { type: 'string', required: true },
          policyNumber: { type: 'string', required: true },
          type: { 
            type: 'string', 
            required: true,
            validator: (value: string) => ['medical', 'dental', 'pharmacy', 'vision', 'therapy'].includes(value)
          },
          status: { 
            type: 'string', 
            required: true,
            validator: (value: string) => ['submitted', 'in-review', 'approved', 'denied', 'paid'].includes(value)
          },
          submissionDate: { 
            type: 'string', 
            required: true,
            validator: (value: string) => {
              try {
                const date = new Date(value);
                return dateValidator.isValidDate(date) && dateValidator.isPastDate(date);
              } catch (e) {
                return false;
              }
            }
          },
          processedDate: { 
            type: 'string', 
            validator: (value: string) => {
              if (!value) return true; // Optional field
              try {
                const date = new Date(value);
                const submissionDate = new Date(claim.submissionDate);
                return dateValidator.isValidDate(date) && 
                       dateValidator.isDateInRange(date, { min: submissionDate });
              } catch (e) {
                return false;
              }
            }
          },
          amount: { 
            type: 'number', 
            required: true,
            validator: (value: number) => numberValidator.isPositive(value)
          },
          currency: { 
            type: 'string', 
            required: true,
            validator: (value: string) => value === 'BRL'
          },
          description: { type: 'string', required: true },
          providerName: { type: 'string', required: true },
          documents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', required: true },
                filename: { type: 'string', required: true },
                uploadDate: { type: 'string', required: true },
                type: { 
                  type: 'string', 
                  required: true,
                  validator: (value: string) => ['receipt', 'medical-report', 'other'].includes(value)
                }
              }
            }
          }
        };

        return objectValidator.validateObjectStructure(claim, claimSchema, {
          validateNested: true,
          checkTypes: true
        });
      };

      // Create a valid insurance claim
      const validClaim = {
        id: 'claim123',
        memberId: 'member456',
        policyNumber: 'POL-100001',
        type: 'medical',
        status: 'submitted',
        submissionDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
        processedDate: null,
        amount: 150.75,
        currency: 'BRL',
        description: 'Consultation with cardiologist',
        providerName: 'Dr. Silva',
        documents: [
          {
            id: 'doc1',
            filename: 'receipt.pdf',
            uploadDate: new Date(Date.now() - 86400000).toISOString(),
            type: 'receipt'
          }
        ]
      };

      // Test with valid claim
      const validResult = validateInsuranceClaim(validClaim);
      expect(validResult.valid).toBe(true);

      // Test with invalid claim type
      const invalidTypeClaim = { ...validClaim, type: 'invalid-type' };
      const invalidTypeResult = validateInsuranceClaim(invalidTypeClaim);
      expect(invalidTypeResult.valid).toBe(false);
      expect(invalidTypeResult.invalidProperties).toHaveProperty('type');

      // Test with negative amount (invalid)
      const negativeAmountClaim = { ...validClaim, amount: -50.25 };
      const negativeAmountResult = validateInsuranceClaim(negativeAmountClaim);
      expect(negativeAmountResult.valid).toBe(false);
      expect(negativeAmountResult.invalidProperties).toHaveProperty('amount');

      // Test with processed date before submission date (invalid)
      const invalidDatesClaim = {
        ...validClaim,
        submissionDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
        processedDate: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      };
      const invalidDatesResult = validateInsuranceClaim(invalidDatesClaim);
      expect(invalidDatesResult.valid).toBe(false);
      expect(invalidDatesResult.invalidProperties).toHaveProperty('processedDate');

      // Test with invalid document type
      const invalidDocumentClaim = {
        ...validClaim,
        documents: [
          {
            id: 'doc1',
            filename: 'receipt.pdf',
            uploadDate: new Date(Date.now() - 86400000).toISOString(),
            type: 'invalid-type' // Invalid document type
          }
        ]
      };
      const invalidDocumentResult = validateInsuranceClaim(invalidDocumentClaim);
      expect(invalidDocumentResult.valid).toBe(false);
      expect(invalidDocumentResult.invalidProperties).toHaveProperty('documents[0].type');
    });
  });

  describe('Asynchronous Validation Workflows', () => {
    it('should support async validation with combined validators', async () => {
      // Generate cross-journey data for testing
      generateCrossJourneyData(context);

      // Define an async validator that combines multiple validation rules
      const validateUserProfile = async (profile: any): Promise<ValidationResult> => {
        // First validate the basic structure synchronously
        const basicSchema = {
          userId: { type: 'string', required: true },
          email: { 
            type: 'string', 
            required: true,
            validator: (value: string) => stringValidator.isValidEmail(value)
          },
          name: { type: 'string', required: true },
          journeyPreferences: { type: 'object', required: true }
        };

        const basicResult = objectValidator.validateObjectStructure(profile, basicSchema);
        if (!basicResult.valid) {
          return basicResult;
        }

        // Then perform async validations
        try {
          // Simulate async validation of email uniqueness
          const isEmailUnique = await new Promise<boolean>((resolve) => {
            setTimeout(() => {
              // Mock implementation - in real code this would check a database
              resolve(profile.email !== 'taken@example.com');
            }, 50);
          });

          if (!isEmailUnique) {
            return {
              valid: false,
              message: 'Email is already in use',
              value: profile
            };
          }

          // Validate journey-specific preferences
          const journeyValidations = [];

          // Health journey validation
          if (profile.journeyPreferences.health) {
            journeyValidations.push(
              validateHealthPreferences(profile.journeyPreferences.health)
            );
          }

          // Care journey validation
          if (profile.journeyPreferences.care) {
            journeyValidations.push(
              validateCarePreferences(profile.journeyPreferences.care)
            );
          }

          // Plan journey validation
          if (profile.journeyPreferences.plan) {
            journeyValidations.push(
              validatePlanPreferences(profile.journeyPreferences.plan)
            );
          }

          // Wait for all journey validations to complete
          const journeyResults = await Promise.all(journeyValidations);
          const invalidJourneyResult = journeyResults.find(result => !result.valid);

          if (invalidJourneyResult) {
            return invalidJourneyResult;
          }

          return { valid: true, value: profile };
        } catch (error) {
          return {
            valid: false,
            message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            value: profile
          };
        }
      };

      // Mock journey-specific validation functions
      const validateHealthPreferences = async (prefs: any): Promise<ValidationResult> => {
        // Simulate async validation
        return new Promise((resolve) => {
          setTimeout(() => {
            const isValid = prefs && 
                          typeof prefs.shareMetrics === 'boolean' && 
                          Array.isArray(prefs.trackedMetrics);
            
            resolve({
              valid: isValid,
              message: isValid ? undefined : 'Invalid health journey preferences',
              value: prefs
            });
          }, 30);
        });
      };

      const validateCarePreferences = async (prefs: any): Promise<ValidationResult> => {
        // Simulate async validation
        return new Promise((resolve) => {
          setTimeout(() => {
            const isValid = prefs && 
                          typeof prefs.preferredLocation === 'string' && 
                          ['in-person', 'telemedicine', 'both'].includes(prefs.preferredLocation);
            
            resolve({
              valid: isValid,
              message: isValid ? undefined : 'Invalid care journey preferences',
              value: prefs
            });
          }, 20);
        });
      };

      const validatePlanPreferences = async (prefs: any): Promise<ValidationResult> => {
        // Simulate async validation
        return new Promise((resolve) => {
          setTimeout(() => {
            const isValid = prefs && 
                          typeof prefs.paperlessCommunication === 'boolean' && 
                          typeof prefs.autoRenewal === 'boolean';
            
            resolve({
              valid: isValid,
              message: isValid ? undefined : 'Invalid plan journey preferences',
              value: prefs
            });
          }, 10);
        });
      };

      // Valid user profile
      const validProfile = {
        userId: 'user123',
        email: 'user@example.com',
        name: 'Test User',
        journeyPreferences: {
          health: {
            shareMetrics: true,
            trackedMetrics: ['weight', 'steps', 'sleep']
          },
          care: {
            preferredLocation: 'both',
            preferredSpecialties: ['cardiology', 'dermatology']
          },
          plan: {
            paperlessCommunication: true,
            autoRenewal: true,
            paymentMethod: 'credit_card'
          }
        }
      };

      // Test with valid profile
      const validResult = await validateUserProfile(validProfile);
      expect(validResult.valid).toBe(true);

      // Test with non-unique email
      const nonUniqueEmailProfile = {
        ...validProfile,
        email: 'taken@example.com'
      };
      const nonUniqueEmailResult = await validateUserProfile(nonUniqueEmailProfile);
      expect(nonUniqueEmailResult.valid).toBe(false);
      expect(nonUniqueEmailResult.message).toContain('already in use');

      // Test with invalid health preferences
      const invalidHealthProfile = {
        ...validProfile,
        journeyPreferences: {
          ...validProfile.journeyPreferences,
          health: {
            shareMetrics: 'yes' // Should be boolean
          }
        }
      };
      const invalidHealthResult = await validateUserProfile(invalidHealthProfile);
      expect(invalidHealthResult.valid).toBe(false);
      expect(invalidHealthResult.message).toContain('health journey');

      // Test with invalid care preferences
      const invalidCareProfile = {
        ...validProfile,
        journeyPreferences: {
          ...validProfile.journeyPreferences,
          care: {
            preferredLocation: 'home' // Invalid value
          }
        }
      };
      const invalidCareResult = await validateUserProfile(invalidCareProfile);
      expect(invalidCareResult.valid).toBe(false);
      expect(invalidCareResult.message).toContain('care journey');
    });

    it('should handle validation error messages with proper localization', async () => {
      // Define a validator that supports localized error messages
      const validateWithLocalization = (value: any, locale: string = 'pt-BR'): ValidationResult => {
        // Error message templates by locale
        const errorMessages = {
          'pt-BR': {
            required: 'Campo obrigatório',
            invalidEmail: 'E-mail inválido',
            invalidCpf: 'CPF inválido',
            invalidDate: 'Data inválida',
            invalidPhone: 'Telefone inválido',
            invalidZipCode: 'CEP inválido'
          },
          'en-US': {
            required: 'Required field',
            invalidEmail: 'Invalid email',
            invalidCpf: 'Invalid CPF',
            invalidDate: 'Invalid date',
            invalidPhone: 'Invalid phone number',
            invalidZipCode: 'Invalid ZIP code'
          }
        };

        // Get messages for the selected locale (fallback to en-US)
        const messages = errorMessages[locale] || errorMessages['en-US'];

        // Create a schema with localized error messages
        const userSchema = {
          name: { 
            type: 'string', 
            required: true,
            message: messages.required
          },
          email: { 
            type: 'string', 
            required: true,
            validator: (v: string) => stringValidator.isValidEmail(v),
            message: messages.invalidEmail
          },
          cpf: { 
            type: 'string', 
            required: true,
            validator: (v: string) => stringValidator.isValidCPF(v),
            message: messages.invalidCpf
          },
          birthDate: { 
            type: 'string', 
            required: true,
            validator: (v: string) => {
              try {
                return dateValidator.isValidDate(new Date(v));
              } catch (e) {
                return false;
              }
            },
            message: messages.invalidDate
          },
          phone: { 
            type: 'string', 
            required: true,
            validator: (v: string) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(v),
            message: messages.invalidPhone
          },
          address: {
            type: 'object',
            required: true,
            properties: {
              zipCode: { 
                type: 'string', 
                required: true,
                validator: (v: string) => /^\d{5}-\d{3}$/.test(v),
                message: messages.invalidZipCode
              }
            }
          }
        };

        return objectValidator.validateObjectStructure(value, userSchema, {
          validateNested: true,
          formatError: (prop, msg) => msg // Use the message from the schema
        });
      };

      // Invalid user data
      const invalidUser = {
        name: 'João Silva',
        email: 'invalid-email',
        cpf: '123.456.789-00', // Invalid CPF
        birthDate: 'not-a-date',
        phone: '12345-6789', // Invalid format
        address: {
          zipCode: '12345' // Invalid format
        }
      };

      // Test with Portuguese locale
      const ptResult = validateWithLocalization(invalidUser, 'pt-BR');
      expect(ptResult.valid).toBe(false);
      expect(ptResult.invalidProperties?.email).toBe('E-mail inválido');
      expect(ptResult.invalidProperties?.cpf).toBe('CPF inválido');
      expect(ptResult.invalidProperties?.birthDate).toBe('Data inválida');
      expect(ptResult.invalidProperties?.phone).toBe('Telefone inválido');
      expect(ptResult.invalidProperties?.['address.zipCode']).toBe('CEP inválido');

      // Test with English locale
      const enResult = validateWithLocalization(invalidUser, 'en-US');
      expect(enResult.valid).toBe(false);
      expect(enResult.invalidProperties?.email).toBe('Invalid email');
      expect(enResult.invalidProperties?.cpf).toBe('Invalid CPF');
      expect(enResult.invalidProperties?.birthDate).toBe('Invalid date');
      expect(enResult.invalidProperties?.phone).toBe('Invalid phone number');
      expect(enResult.invalidProperties?.['address.zipCode']).toBe('Invalid ZIP code');

      // Test with fallback locale
      const fallbackResult = validateWithLocalization(invalidUser, 'fr-FR'); // Unsupported locale
      expect(fallbackResult.valid).toBe(false);
      expect(fallbackResult.invalidProperties?.email).toBe('Invalid email'); // Falls back to en-US
    });
  });
});