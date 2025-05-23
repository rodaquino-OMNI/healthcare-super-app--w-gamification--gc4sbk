import { z } from 'zod';
import { EventType } from '../../../src/dto/event-types.enum';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { ValidationResult } from '../../../src/interfaces/event-validation.interface';
import {
  validateEvent,
  validateEventByType,
  validatePayload,
  formatZodError,
  createUuidValidator,
  createRangeValidator,
  createPatternValidator,
  createRequiredPropsValidator,
  EventValidator,
  eventValidator
} from '../../../src/utils/event-validator';

describe('Event Validation Utilities', () => {
  // Test data for reuse across tests
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const invalidUserId = 'not-a-uuid';
  const validTimestamp = new Date().toISOString();
  const invalidTimestamp = 'not-a-timestamp';

  // Helper function to create a valid base event
  const createValidBaseEvent = (overrides: Partial<BaseEvent> = {}): BaseEvent => ({
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    type: EventType.HEALTH_METRIC_RECORDED,
    timestamp: validTimestamp,
    version: '1.0.0',
    source: 'test',
    userId: validUserId,
    journey: 'health',
    payload: {
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: validTimestamp
    },
    ...overrides
  });

  describe('validateEvent', () => {
    it('should validate a valid event', () => {
      // Arrange
      const validEvent = createValidBaseEvent();

      // Act
      const result = validateEvent(validEvent);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject an event with missing required fields', () => {
      // Arrange
      const invalidEvent = {
        // Missing type, userId, and other required fields
        timestamp: validTimestamp,
        data: { value: 'test' }
      };

      // Act
      const result = validateEvent(invalidEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
      // Check that the error message mentions the missing fields
      expect(result.error.message).toContain('type');
    });

    it('should reject an event with invalid userId format', () => {
      // Arrange
      const invalidEvent = createValidBaseEvent({ userId: invalidUserId });

      // Act
      const result = validateEvent(invalidEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('userId');
      expect(result.error.message).toContain('uuid');
    });

    it('should reject an event with invalid timestamp format', () => {
      // Arrange
      const invalidEvent = createValidBaseEvent({ timestamp: invalidTimestamp });

      // Act
      const result = validateEvent(invalidEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('timestamp');
      expect(result.error.message).toContain('datetime');
    });

    it('should use default timestamp if not provided', () => {
      // Arrange
      const eventWithoutTimestamp = createValidBaseEvent();
      delete eventWithoutTimestamp.timestamp;

      // Act
      const result = validateEvent(eventWithoutTimestamp);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.timestamp).toBeDefined();
      // Verify it's a valid ISO date string
      expect(() => new Date(result.data.timestamp)).not.toThrow();
    });
  });

  describe('validateEventByType', () => {
    it('should validate an event with the correct type', () => {
      // Arrange
      const validEvent = createValidBaseEvent();

      // Act
      const result = validateEventByType(validEvent, EventType.HEALTH_METRIC_RECORDED);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject an event with the wrong type', () => {
      // Arrange
      const validEvent = createValidBaseEvent();

      // Act
      const result = validateEventByType(validEvent, EventType.HEALTH_GOAL_ACHIEVED);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('type mismatch');
      expect(result.error.message).toContain(EventType.HEALTH_GOAL_ACHIEVED);
      expect(result.error.message).toContain(EventType.HEALTH_METRIC_RECORDED);
    });

    it('should reject an event with an unknown type', () => {
      // Arrange
      const unknownTypeEvent = createValidBaseEvent({ type: 'UNKNOWN_TYPE' });

      // Act
      const result = validateEventByType(unknownTypeEvent, 'UNKNOWN_TYPE');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Unknown event type');
    });
  });

  describe('Journey-specific event validation', () => {
    describe('Health Journey Events', () => {
      it('should validate a valid HEALTH_METRIC_RECORDED event', () => {
        // Arrange
        const validEvent = createValidBaseEvent({
          type: EventType.HEALTH_METRIC_RECORDED,
          journey: 'health',
          payload: {
            metricType: 'HEART_RATE',
            value: 75,
            unit: 'bpm',
            timestamp: validTimestamp,
            source: 'MANUAL'
          }
        });

        // Act
        const result = validateEvent(validEvent, { journeyContext: 'health' });

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('should validate a valid HEALTH_GOAL_ACHIEVED event', () => {
        // Arrange
        const validEvent = createValidBaseEvent({
          type: EventType.HEALTH_GOAL_ACHIEVED,
          journey: 'health',
          payload: {
            goalId: '550e8400-e29b-41d4-a716-446655440000',
            goalType: 'STEPS',
            targetValue: 10000,
            achievedValue: 10500,
            unit: 'steps',
            achievedAt: validTimestamp,
            streakCount: 5
          }
        });

        // Act
        const result = validateEvent(validEvent, { journeyContext: 'health' });

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('should reject a HEALTH_METRIC_RECORDED event with invalid metric type', () => {
        // Arrange
        const invalidEvent = createValidBaseEvent({
          type: EventType.HEALTH_METRIC_RECORDED,
          journey: 'health',
          payload: {
            metricType: 'INVALID_METRIC', // Invalid metric type
            value: 75,
            unit: 'bpm',
            timestamp: validTimestamp
          }
        });

        // Act
        const result = validateEvent(invalidEvent, { journeyContext: 'health' });

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('metricType');
      });

      it('should reject a HEALTH_GOAL_ACHIEVED event with negative achieved value', () => {
        // Arrange
        const invalidEvent = createValidBaseEvent({
          type: EventType.HEALTH_GOAL_ACHIEVED,
          journey: 'health',
          payload: {
            goalId: '550e8400-e29b-41d4-a716-446655440000',
            goalType: 'STEPS',
            targetValue: 10000,
            achievedValue: -500, // Negative value is invalid
            unit: 'steps',
            achievedAt: validTimestamp
          }
        });

        // Act
        const result = validateEvent(invalidEvent, { journeyContext: 'health' });

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('achievedValue');
      });
    });

    describe('Care Journey Events', () => {
      it('should validate a valid CARE_APPOINTMENT_BOOKED event', () => {
        // Arrange
        const validEvent = createValidBaseEvent({
          type: EventType.CARE_APPOINTMENT_BOOKED,
          journey: 'care',
          payload: {
            appointmentId: '550e8400-e29b-41d4-a716-446655440000',
            providerId: '550e8400-e29b-41d4-a716-446655440001',
            specialization: 'Cardiology',
            dateTime: validTimestamp,
            duration: 30,
            location: {
              type: 'VIRTUAL',
              address: null
            },
            reason: 'Annual checkup',
            status: 'SCHEDULED'
          }
        });

        // Act
        const result = validateEvent(validEvent, { journeyContext: 'care' });

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('should validate a valid CARE_MEDICATION_TAKEN event', () => {
        // Arrange
        const validEvent = createValidBaseEvent({
          type: EventType.CARE_MEDICATION_TAKEN,
          journey: 'care',
          payload: {
            medicationId: '550e8400-e29b-41d4-a716-446655440000',
            medicationName: 'Aspirin',
            dosage: 100,
            unit: 'mg',
            takenAt: validTimestamp,
            scheduledFor: validTimestamp,
            adherence: 'ON_TIME'
          }
        });

        // Act
        const result = validateEvent(validEvent, { journeyContext: 'care' });

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('should reject a CARE_APPOINTMENT_BOOKED event with invalid location type', () => {
        // Arrange
        const invalidEvent = createValidBaseEvent({
          type: EventType.CARE_APPOINTMENT_BOOKED,
          journey: 'care',
          payload: {
            appointmentId: '550e8400-e29b-41d4-a716-446655440000',
            providerId: '550e8400-e29b-41d4-a716-446655440001',
            specialization: 'Cardiology',
            dateTime: validTimestamp,
            duration: 30,
            location: {
              type: 'INVALID_LOCATION', // Invalid location type
              address: null
            },
            status: 'SCHEDULED'
          }
        });

        // Act
        const result = validateEvent(invalidEvent, { journeyContext: 'care' });

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('location.type');
      });

      it('should reject a CARE_MEDICATION_TAKEN event with negative dosage', () => {
        // Arrange
        const invalidEvent = createValidBaseEvent({
          type: EventType.CARE_MEDICATION_TAKEN,
          journey: 'care',
          payload: {
            medicationId: '550e8400-e29b-41d4-a716-446655440000',
            medicationName: 'Aspirin',
            dosage: -100, // Negative dosage is invalid
            unit: 'mg',
            takenAt: validTimestamp
          }
        });

        // Act
        const result = validateEvent(invalidEvent, { journeyContext: 'care' });

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('dosage');
      });
    });

    describe('Plan Journey Events', () => {
      it('should validate a valid PLAN_CLAIM_SUBMITTED event', () => {
        // Arrange
        const validEvent = createValidBaseEvent({
          type: EventType.PLAN_CLAIM_SUBMITTED,
          journey: 'plan',
          payload: {
            claimId: '550e8400-e29b-41d4-a716-446655440000',
            claimType: 'MEDICAL',
            amount: 150.75,
            currency: 'USD',
            serviceDate: validTimestamp,
            providerId: '550e8400-e29b-41d4-a716-446655440001',
            providerName: 'Dr. Smith',
            documents: ['doc1.pdf', 'doc2.pdf'],
            status: 'SUBMITTED'
          }
        });

        // Act
        const result = validateEvent(validEvent, { journeyContext: 'plan' });

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('should validate a valid PLAN_BENEFIT_UTILIZED event', () => {
        // Arrange
        const validEvent = createValidBaseEvent({
          type: EventType.PLAN_BENEFIT_UTILIZED,
          journey: 'plan',
          payload: {
            benefitId: '550e8400-e29b-41d4-a716-446655440000',
            benefitType: 'DENTAL',
            utilizationDate: validTimestamp,
            value: 200,
            remainingValue: 800,
            expiryDate: validTimestamp,
            provider: 'Dental Clinic'
          }
        });

        // Act
        const result = validateEvent(validEvent, { journeyContext: 'plan' });

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('should reject a PLAN_CLAIM_SUBMITTED event with zero amount', () => {
        // Arrange
        const invalidEvent = createValidBaseEvent({
          type: EventType.PLAN_CLAIM_SUBMITTED,
          journey: 'plan',
          payload: {
            claimId: '550e8400-e29b-41d4-a716-446655440000',
            claimType: 'MEDICAL',
            amount: 0, // Zero amount is invalid
            currency: 'USD',
            serviceDate: validTimestamp,
            providerName: 'Dr. Smith'
          }
        });

        // Act
        const result = validateEvent(invalidEvent, { journeyContext: 'plan' });

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('amount');
      });

      it('should reject a PLAN_BENEFIT_UTILIZED event with negative remaining value', () => {
        // Arrange
        const invalidEvent = createValidBaseEvent({
          type: EventType.PLAN_BENEFIT_UTILIZED,
          journey: 'plan',
          payload: {
            benefitId: '550e8400-e29b-41d4-a716-446655440000',
            benefitType: 'DENTAL',
            utilizationDate: validTimestamp,
            value: 200,
            remainingValue: -50, // Negative remaining value is invalid
            provider: 'Dental Clinic'
          }
        });

        // Act
        const result = validateEvent(invalidEvent, { journeyContext: 'plan' });

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('remainingValue');
      });
    });
  });

  describe('Nested data structure validation', () => {
    it('should validate events with nested objects', () => {
      // Arrange
      const validEvent = createValidBaseEvent({
        type: EventType.CARE_APPOINTMENT_BOOKED,
        journey: 'care',
        payload: {
          appointmentId: '550e8400-e29b-41d4-a716-446655440000',
          providerId: '550e8400-e29b-41d4-a716-446655440001',
          specialization: 'Cardiology',
          dateTime: validTimestamp,
          duration: 30,
          location: {
            type: 'IN_PERSON',
            address: '123 Medical St, City',
            coordinates: [40.7128, -74.0060]
          },
          status: 'SCHEDULED'
        }
      });

      // Act
      const result = validateEvent(validEvent, { journeyContext: 'care' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject events with invalid nested objects', () => {
      // Arrange
      const invalidEvent = createValidBaseEvent({
        type: EventType.CARE_APPOINTMENT_BOOKED,
        journey: 'care',
        payload: {
          appointmentId: '550e8400-e29b-41d4-a716-446655440000',
          providerId: '550e8400-e29b-41d4-a716-446655440001',
          specialization: 'Cardiology',
          dateTime: validTimestamp,
          duration: 30,
          location: {
            type: 'IN_PERSON',
            address: '123 Medical St, City',
            coordinates: [40.7128] // Invalid coordinates (should be a tuple of 2 numbers)
          },
          status: 'SCHEDULED'
        }
      });

      // Act
      const result = validateEvent(invalidEvent, { journeyContext: 'care' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('coordinates');
    });

    it('should validate events with nested arrays', () => {
      // Arrange
      const validEvent = createValidBaseEvent({
        type: EventType.PLAN_CLAIM_SUBMITTED,
        journey: 'plan',
        payload: {
          claimId: '550e8400-e29b-41d4-a716-446655440000',
          claimType: 'MEDICAL',
          amount: 150.75,
          currency: 'USD',
          serviceDate: validTimestamp,
          providerName: 'Dr. Smith',
          documents: ['doc1.pdf', 'doc2.pdf', 'doc3.pdf']
        }
      });

      // Act
      const result = validateEvent(validEvent, { journeyContext: 'plan' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject events with invalid nested arrays', () => {
      // Arrange
      const invalidEvent = createValidBaseEvent({
        type: EventType.PLAN_SELECTED,
        journey: 'plan',
        payload: {
          planId: '550e8400-e29b-41d4-a716-446655440000',
          planName: 'Premium Health Plan',
          planType: 'HEALTH',
          coverageLevel: 'INDIVIDUAL',
          startDate: validTimestamp,
          premium: 299.99,
          currency: 'USD',
          paymentFrequency: 'MONTHLY',
          selectedBenefits: [123, 456] // Invalid: should be array of strings
        }
      });

      // Act
      const result = validateEvent(invalidEvent, { journeyContext: 'plan' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('selectedBenefits');
    });
  });

  describe('UUID format validation', () => {
    it('should validate proper UUID format', () => {
      // Arrange
      const uuidValidator = createUuidValidator();
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const result = uuidValidator(validUuid);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      // Arrange
      const uuidValidator = createUuidValidator();
      const invalidUuids = [
        'not-a-uuid',
        '550e8400e29b41d4a716446655440000', // No hyphens
        '550e8400-e29b-41d4-a716-44665544000G', // Invalid character
        '550e8400-e29b-41d4-a716', // Too short
      ];

      // Act & Assert
      invalidUuids.forEach(uuid => {
        const result = uuidValidator(uuid);
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
      });
    });

    it('should validate events with UUID fields', () => {
      // Arrange
      const validEvent = createValidBaseEvent({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        payload: {
          goalId: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440000'
        }
      });

      // Act
      const result = validateEvent(validEvent);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject events with invalid UUID fields', () => {
      // Arrange
      const invalidEvent = createValidBaseEvent({
        userId: 'invalid-uuid-format',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm'
        }
      });

      // Act
      const result = validateEvent(invalidEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('userId');
    });
  });

  describe('Error reporting and classification', () => {
    it('should format Zod errors with proper path information', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number().positive(),
        address: z.object({
          street: z.string(),
          city: z.string(),
          zipCode: z.string().length(5)
        })
      });

      const invalidData = {
        name: 'John',
        age: -5, // Invalid: negative number
        address: {
          street: '123 Main St',
          city: '', // Invalid: empty string
          zipCode: '1234' // Invalid: wrong length
        }
      };

      // Act
      const validationResult = schema.safeParse(invalidData);
      const formattedError = formatZodError(validationResult.error);

      // Assert
      expect(formattedError.message).toBeDefined();
      expect(formattedError.issues).toHaveLength(3);
      expect(formattedError.formattedIssues).toHaveLength(3);

      // Check that paths are correctly included in error messages
      expect(formattedError.message).toContain('age:');
      expect(formattedError.message).toContain('address.city:');
      expect(formattedError.message).toContain('address.zipCode:');
    });

    it('should classify errors by type', () => {
      // Arrange
      const invalidEvent = createValidBaseEvent({
        userId: invalidUserId, // Invalid UUID
        timestamp: invalidTimestamp, // Invalid timestamp
        payload: {
          metricType: 'UNKNOWN_TYPE', // Invalid enum value
          value: 'not-a-number', // Invalid type (should be number)
          unit: 'bpm'
        }
      });

      // Act
      const result = validateEvent(invalidEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Check that the error message contains all validation issues
      const errorMessage = result.error.message;
      expect(errorMessage).toContain('userId');
      expect(errorMessage).toContain('timestamp');
      expect(errorMessage).toContain('payload');
    });

    it('should provide detailed error messages for nested validation failures', () => {
      // Arrange
      const invalidEvent = createValidBaseEvent({
        type: EventType.CARE_APPOINTMENT_BOOKED,
        journey: 'care',
        payload: {
          // Missing required appointmentId
          providerId: invalidUserId, // Invalid UUID
          specialization: '', // Empty string
          dateTime: invalidTimestamp, // Invalid timestamp
          duration: -30, // Negative duration
          location: {
            type: 'UNKNOWN', // Invalid enum
            coordinates: ['not', 'numbers'] // Invalid coordinates
          }
        }
      });

      // Act
      const result = validateEvent(invalidEvent, { journeyContext: 'care' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Check that the error message contains path information for nested fields
      const errorMessage = result.error.message;
      expect(errorMessage).toContain('appointmentId');
      expect(errorMessage).toContain('providerId');
      expect(errorMessage).toContain('dateTime');
      expect(errorMessage).toContain('duration');
      expect(errorMessage).toContain('location.type');
      expect(errorMessage).toContain('location.coordinates');
    });
  });

  describe('Custom validators', () => {
    it('should validate ranges correctly', () => {
      // Arrange
      const rangeValidator = createRangeValidator(1, 100);

      // Act & Assert
      expect(rangeValidator(50).success).toBe(true);
      expect(rangeValidator(1).success).toBe(true);
      expect(rangeValidator(100).success).toBe(true);
      expect(rangeValidator(0).success).toBe(false);
      expect(rangeValidator(101).success).toBe(false);
    });

    it('should validate patterns correctly', () => {
      // Arrange
      const emailValidator = createPatternValidator(/^[\w.-]+@[\w.-]+\.\w+$/);

      // Act & Assert
      expect(emailValidator('user@example.com').success).toBe(true);
      expect(emailValidator('user.name@company-domain.co.uk').success).toBe(true);
      expect(emailValidator('invalid-email').success).toBe(false);
      expect(emailValidator('missing@domain').success).toBe(false);
    });

    it('should validate required properties correctly', () => {
      // Arrange
      const requiredPropsValidator = createRequiredPropsValidator(['name', 'age', 'email']);

      // Act & Assert
      expect(requiredPropsValidator({ name: 'John', age: 30, email: 'john@example.com' }).success).toBe(true);
      expect(requiredPropsValidator({ name: 'John', age: 30 }).success).toBe(false);
      expect(requiredPropsValidator({ name: 'John' }).success).toBe(false);
      expect(requiredPropsValidator({}).success).toBe(false);
    });
  });

  describe('EventValidator class', () => {
    it('should provide a singleton instance', () => {
      // Assert
      expect(eventValidator).toBeInstanceOf(EventValidator);
    });

    it('should validate events through the class interface', () => {
      // Arrange
      const validEvent = createValidBaseEvent();
      const validator = new EventValidator();

      // Act
      const result = validator.validate(validEvent);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate events by type through the class interface', () => {
      // Arrange
      const validEvent = createValidBaseEvent();
      const validator = new EventValidator();

      // Act
      const result = validator.validateByType(validEvent, EventType.HEALTH_METRIC_RECORDED);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate payloads through the class interface', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number().positive()
      });
      const validPayload = { name: 'John', age: 30 };
      const validator = new EventValidator();

      // Act
      const result = validator.validatePayload(validPayload, schema);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should format errors through the class interface', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number().positive()
      });
      const invalidPayload = { name: 'John', age: -5 };
      const validator = new EventValidator();
      const validationResult = schema.safeParse(invalidPayload);

      // Act
      const formattedError = validator.formatError(validationResult.error);

      // Assert
      expect(formattedError.message).toBeDefined();
      expect(formattedError.issues).toBeDefined();
      expect(formattedError.formattedIssues).toBeDefined();
      expect(formattedError.message).toContain('age');
    });
  });

  describe('validatePayload', () => {
    it('should validate a payload against a schema', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number().positive(),
        email: z.string().email()
      });
      const validPayload = {
        name: 'John Doe',
        age: 30,
        email: 'john.doe@example.com'
      };

      // Act
      const result = validatePayload(validPayload, schema);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validPayload);
    });

    it('should reject an invalid payload', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number().positive(),
        email: z.string().email()
      });
      const invalidPayload = {
        name: 'John Doe',
        age: -5, // Invalid: negative number
        email: 'not-an-email' // Invalid: not an email
      };

      // Act
      const result = validatePayload(invalidPayload, schema);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('age');
      expect(result.error.message).toContain('email');
    });

    it('should handle unexpected errors during validation', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        callback: z.function().refine((fn) => fn() === true, {
          message: 'Callback must return true'
        })
      });
      const invalidPayload = {
        name: 'John Doe',
        callback: () => { throw new Error('Unexpected error'); }
      };

      // Act
      const result = validatePayload(invalidPayload, schema);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Unexpected');
    });
  });
});