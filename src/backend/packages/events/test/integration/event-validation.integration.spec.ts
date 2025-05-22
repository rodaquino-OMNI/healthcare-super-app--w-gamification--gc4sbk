import { EventValidator } from '../../src/utils/event-validator';
import { ValidationResult } from '../../src/interfaces/event-validation.interface';
import { EventType } from '../../src/dto/event-types.enum';
import { BaseEvent } from '../../src/dto/base-event.dto';
import { HealthMetricEventDto } from '../../src/dto/health-metric-event.dto';
import { AppointmentEventDto } from '../../src/dto/appointment-event.dto';
import { ClaimEventDto } from '../../src/dto/claim-event.dto';
import { MedicationEventDto } from '../../src/dto/medication-event.dto';
import { HealthGoalEventDto } from '../../src/dto/health-goal-event.dto';
import { BenefitEventDto } from '../../src/dto/benefit-event.dto';
import * as validationFixtures from '../fixtures/validation-events';
import * as healthFixtures from '../fixtures/health-events';
import * as careFixtures from '../fixtures/care-events';
import * as planFixtures from '../fixtures/plan-events';
import { mockHealthMetricEvent, mockAppointmentEvent, mockClaimEvent } from '../utils/mock-events';
import { compareEvents } from '../utils/event-comparison';

/**
 * Integration tests for event schema validation across different journey types.
 * 
 * These tests verify that events are properly validated against their schemas,
 * ensuring type safety and data integrity throughout the event processing pipeline.
 */
describe('Event Validation Integration Tests', () => {
  let validator: EventValidator;

  beforeEach(() => {
    validator = new EventValidator();
  });

  describe('Base Event Validation', () => {
    it('should validate a valid base event', async () => {
      // Arrange
      const validEvent = validationFixtures.validBaseEvent;

      // Act
      const result: ValidationResult = await validator.validate(validEvent);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject an event with missing required fields', async () => {
      // Arrange
      const invalidEvent = { ...validationFixtures.validBaseEvent };
      delete (invalidEvent as any).eventId;
      delete (invalidEvent as any).timestamp;

      // Act
      const result: ValidationResult = await validator.validate(invalidEvent as BaseEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].property).toContain('eventId');
      expect(result.errors[1].property).toContain('timestamp');
    });

    it('should reject an event with invalid timestamp format', async () => {
      // Arrange
      const invalidEvent = { 
        ...validationFixtures.validBaseEvent,
        timestamp: 'not-a-valid-iso-date'
      };

      // Act
      const result: ValidationResult = await validator.validate(invalidEvent as BaseEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].property).toBe('timestamp');
      expect(result.errors[0].constraints).toHaveProperty('isIso8601');
    });

    it('should reject an event with invalid version format', async () => {
      // Arrange
      const invalidEvent = { 
        ...validationFixtures.validBaseEvent,
        version: 'not-semver'
      };

      // Act
      const result: ValidationResult = await validator.validate(invalidEvent as BaseEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].property).toBe('version');
      expect(result.errors[0].constraints).toHaveProperty('matches');
    });
  });

  describe('Health Journey Event Validation', () => {
    describe('Health Metric Events', () => {
      it('should validate a valid health metric event', async () => {
        // Arrange
        const validEvent = healthFixtures.validHealthMetricEvent;

        // Act
        const result: ValidationResult = await validator.validate(validEvent);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject a health metric event with invalid metric type', async () => {
        // Arrange
        const invalidEvent = mockHealthMetricEvent({
          payload: {
            metricType: 'INVALID_TYPE' as any,
            value: 75,
            unit: 'bpm'
          }
        });

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as HealthMetricEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload.metricType');
        expect(result.errors[0].constraints).toHaveProperty('isEnum');
      });

      it('should reject a health metric event with value out of physiological range', async () => {
        // Arrange
        const invalidEvent = mockHealthMetricEvent({
          payload: {
            metricType: 'HEART_RATE',
            value: 300, // Unrealistic heart rate
            unit: 'bpm'
          }
        });

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as HealthMetricEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload.value');
        expect(result.errors[0].constraints).toHaveProperty('max');
      });

      it('should reject a health metric event with mismatched unit', async () => {
        // Arrange
        const invalidEvent = mockHealthMetricEvent({
          payload: {
            metricType: 'HEART_RATE',
            value: 75,
            unit: 'kg' // Wrong unit for heart rate
          }
        });

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as HealthMetricEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload');
        expect(result.errors[0].constraints).toHaveProperty('isMetricUnitValid');
      });
    });

    describe('Health Goal Events', () => {
      it('should validate a valid health goal event', async () => {
        // Arrange
        const validEvent = healthFixtures.validHealthGoalEvent;

        // Act
        const result: ValidationResult = await validator.validate(validEvent);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject a health goal event with invalid goal type', async () => {
        // Arrange
        const invalidEvent = { 
          ...healthFixtures.validHealthGoalEvent,
          payload: {
            ...healthFixtures.validHealthGoalEvent.payload,
            goalType: 'INVALID_GOAL_TYPE'
          }
        };

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as HealthGoalEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload.goalType');
      });

      it('should reject a health goal event with progress greater than target', async () => {
        // Arrange
        const invalidEvent = { 
          ...healthFixtures.validHealthGoalEvent,
          payload: {
            ...healthFixtures.validHealthGoalEvent.payload,
            currentValue: 12000,
            targetValue: 10000
          }
        };

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as HealthGoalEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload');
        expect(result.errors[0].constraints).toHaveProperty('isProgressValid');
      });
    });
  });

  describe('Care Journey Event Validation', () => {
    describe('Appointment Events', () => {
      it('should validate a valid appointment event', async () => {
        // Arrange
        const validEvent = careFixtures.validAppointmentEvent;

        // Act
        const result: ValidationResult = await validator.validate(validEvent);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject an appointment event with a past date for new appointments', async () => {
        // Arrange
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday
        
        const invalidEvent = mockAppointmentEvent({
          payload: {
            status: 'SCHEDULED',
            appointmentType: 'CONSULTATION',
            scheduledAt: pastDate.toISOString(),
            providerId: '12345'
          }
        });

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as AppointmentEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload');
        expect(result.errors[0].constraints).toHaveProperty('isAppointmentDateValid');
      });

      it('should reject an appointment event with invalid status transition', async () => {
        // Arrange
        const invalidEvent = { 
          ...careFixtures.validAppointmentEvent,
          payload: {
            ...careFixtures.validAppointmentEvent.payload,
            previousStatus: 'COMPLETED',
            status: 'SCHEDULED'
          }
        };

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as AppointmentEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload');
        expect(result.errors[0].constraints).toHaveProperty('isStatusTransitionValid');
      });
    });

    describe('Medication Events', () => {
      it('should validate a valid medication event', async () => {
        // Arrange
        const validEvent = careFixtures.validMedicationEvent;

        // Act
        const result: ValidationResult = await validator.validate(validEvent);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject a medication event with invalid dosage information', async () => {
        // Arrange
        const invalidEvent = { 
          ...careFixtures.validMedicationEvent,
          payload: {
            ...careFixtures.validMedicationEvent.payload,
            dosage: {
              value: -5, // Negative dosage
              unit: 'mg'
            }
          }
        };

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as MedicationEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload.dosage.value');
        expect(result.errors[0].constraints).toHaveProperty('min');
      });

      it('should reject a medication event with future timestamp for TAKEN status', async () => {
        // Arrange
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
        
        const invalidEvent = { 
          ...careFixtures.validMedicationEvent,
          timestamp: futureDate.toISOString(),
          payload: {
            ...careFixtures.validMedicationEvent.payload,
            status: 'TAKEN'
          }
        };

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as MedicationEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload');
        expect(result.errors[0].constraints).toHaveProperty('isMedicationTimestampValid');
      });
    });
  });

  describe('Plan Journey Event Validation', () => {
    describe('Claim Events', () => {
      it('should validate a valid claim event', async () => {
        // Arrange
        const validEvent = planFixtures.validClaimEvent;

        // Act
        const result: ValidationResult = await validator.validate(validEvent);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject a claim event with invalid amount', async () => {
        // Arrange
        const invalidEvent = mockClaimEvent({
          payload: {
            claimType: 'MEDICAL_CONSULTATION',
            amount: -100.50, // Negative amount
            currency: 'BRL',
            status: 'SUBMITTED'
          }
        });

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as ClaimEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload.amount');
        expect(result.errors[0].constraints).toHaveProperty('min');
      });

      it('should reject a claim event with missing required documents for SUBMITTED status', async () => {
        // Arrange
        const invalidEvent = { 
          ...planFixtures.validClaimEvent,
          payload: {
            ...planFixtures.validClaimEvent.payload,
            status: 'SUBMITTED',
            documents: [] // Empty documents array
          }
        };

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as ClaimEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload');
        expect(result.errors[0].constraints).toHaveProperty('areDocumentsValid');
      });

      it('should reject a claim event with invalid status transition', async () => {
        // Arrange
        const invalidEvent = { 
          ...planFixtures.validClaimEvent,
          payload: {
            ...planFixtures.validClaimEvent.payload,
            previousStatus: 'REJECTED',
            status: 'APPROVED'
          }
        };

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as ClaimEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload');
        expect(result.errors[0].constraints).toHaveProperty('isStatusTransitionValid');
      });
    });

    describe('Benefit Events', () => {
      it('should validate a valid benefit event', async () => {
        // Arrange
        const validEvent = planFixtures.validBenefitEvent;

        // Act
        const result: ValidationResult = await validator.validate(validEvent);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject a benefit event with usage exceeding limit', async () => {
        // Arrange
        const invalidEvent = { 
          ...planFixtures.validBenefitEvent,
          payload: {
            ...planFixtures.validBenefitEvent.payload,
            usageCount: 12,
            usageLimit: 10
          }
        };

        // Act
        const result: ValidationResult = await validator.validate(invalidEvent as BenefitEventDto);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].property).toBe('payload');
        expect(result.errors[0].constraints).toHaveProperty('isBenefitUsageValid');
      });
    });
  });

  describe('Cross-Journey Validation', () => {
    it('should validate events with cross-journey references', async () => {
      // Arrange
      const validEvent = validationFixtures.validCrossJourneyEvent;

      // Act
      const result: ValidationResult = await validator.validate(validEvent);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject events with invalid cross-journey references', async () => {
      // Arrange
      const invalidEvent = { 
        ...validationFixtures.validCrossJourneyEvent,
        payload: {
          ...validationFixtures.validCrossJourneyEvent.payload,
          relatedEvents: [
            { eventId: 'invalid-format', journey: 'health' } // Invalid event ID format
          ]
        }
      };

      // Act
      const result: ValidationResult = await validator.validate(invalidEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].property).toBe('payload.relatedEvents.0.eventId');
      expect(result.errors[0].constraints).toHaveProperty('isUuid');
    });
  });

  describe('Validation Error Format', () => {
    it('should return properly formatted validation errors', async () => {
      // Arrange
      const invalidEvent = { 
        ...validationFixtures.validBaseEvent,
        eventId: 'not-a-uuid',
        timestamp: 'not-a-date',
        version: 'invalid-version'
      };

      // Act
      const result: ValidationResult = await validator.validate(invalidEvent as BaseEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      
      // Check error structure
      result.errors.forEach(error => {
        expect(error).toHaveProperty('property');
        expect(error).toHaveProperty('value');
        expect(error).toHaveProperty('constraints');
        expect(Object.keys(error.constraints).length).toBeGreaterThan(0);
      });

      // Check error messages
      const errorMessages = result.errors.flatMap(error => Object.values(error.constraints));
      errorMessages.forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(10); // Ensure descriptive messages
      });
    });

    it('should include nested validation errors for complex objects', async () => {
      // Arrange
      const invalidEvent = mockHealthMetricEvent({
        eventId: 'not-a-uuid', // Base validation error
        payload: {
          metricType: 'INVALID_TYPE' as any, // Nested validation error
          value: -10, // Another nested validation error
          unit: 'bpm'
        }
      });

      // Act
      const result: ValidationResult = await validator.validate(invalidEvent as HealthMetricEventDto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      
      // Check for base level error
      const baseError = result.errors.find(e => e.property === 'eventId');
      expect(baseError).toBeDefined();
      
      // Check for nested errors
      const nestedErrors = result.errors.filter(e => e.property.startsWith('payload.'));
      expect(nestedErrors.length).toBeGreaterThanOrEqual(2);
    });
  });
});