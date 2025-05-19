/**
 * Integration tests for event schema validation across different journey types.
 * 
 * This test suite verifies that events are properly validated against their schemas,
 * ensuring type safety and data integrity throughout the event processing pipeline.
 * It tests both valid and invalid event payloads to ensure proper validation behavior.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ValidationResult, ValidationSeverity } from '../../src/interfaces/event-validation.interface';
import { EventTypes } from '../../src/dto/event-types.enum';
import { BaseEventDto } from '../../src/dto/base-event.dto';
import { HealthMetricEventDto } from '../../src/dto/health-metric-event.dto';
import { HealthGoalEventDto } from '../../src/dto/health-goal-event.dto';
import { AppointmentEventDto } from '../../src/dto/appointment-event.dto';
import { MedicationEventDto } from '../../src/dto/medication-event.dto';
import { ClaimEventDto } from '../../src/dto/claim-event.dto';
import { BenefitEventDto } from '../../src/dto/benefit-event.dto';
import { 
  validateObject, 
  validateObjectSync, 
  validateWithZod,
  validateJourneyEvent,
  validateEventOrThrow,
  validateEventOrThrowSync,
  HealthValidation,
  CareValidation,
  PlanValidation
} from '../../src/dto/validation';
import { EventValidationError } from '../../src/errors/event-errors';

describe('Event Validation Integration Tests', () => {
  // Test fixtures
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const timestamp = new Date().toISOString();

  // =========================================================================
  // Health Journey Event Validation Tests
  // =========================================================================
  describe('Health Journey Event Validation', () => {
    describe('Health Metric Events', () => {
      // Valid health metric event
      const validHealthMetricEvent = {
        type: EventTypes.HEALTH_METRIC_RECORDED,
        userId,
        timestamp,
        journey: 'health',
        data: {
          metricType: 'heartRate',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          deviceId: 'device-123'
        }
      };

      // Invalid health metric event (missing required fields)
      const invalidHealthMetricEvent = {
        type: EventTypes.HEALTH_METRIC_RECORDED,
        userId,
        timestamp,
        journey: 'health',
        data: {
          // Missing metricType
          value: 75,
          // Missing unit
          timestamp: new Date().toISOString()
        }
      };

      // Invalid health metric event (value out of physiological range)
      const outOfRangeHealthMetricEvent = {
        type: EventTypes.HEALTH_METRIC_RECORDED,
        userId,
        timestamp,
        journey: 'health',
        data: {
          metricType: 'heartRate',
          value: 300, // Heart rate too high
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          deviceId: 'device-123'
        }
      };

      it('should validate a valid health metric event', async () => {
        // Test class-validator validation
        const result = await validateObject(validHealthMetricEvent, HealthMetricEventDto, {
          journey: 'health',
          eventType: EventTypes.HEALTH_METRIC_RECORDED
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should validate a valid health metric event synchronously', () => {
        // Test synchronous validation
        const result = validateObjectSync(validHealthMetricEvent, HealthMetricEventDto, {
          journey: 'health',
          eventType: EventTypes.HEALTH_METRIC_RECORDED
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should reject an invalid health metric event missing required fields', async () => {
        // Test validation with missing fields
        const result = await validateObject(invalidHealthMetricEvent, HealthMetricEventDto, {
          journey: 'health',
          eventType: EventTypes.HEALTH_METRIC_RECORDED
        });
        
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        
        // Check that we have the expected validation issues
        const metricTypeIssue = result.issues.find(issue => issue.field === 'data.metricType');
        const unitIssue = result.issues.find(issue => issue.field === 'data.unit');
        
        expect(metricTypeIssue).toBeDefined();
        expect(unitIssue).toBeDefined();
        expect(metricTypeIssue?.severity).toBe(ValidationSeverity.ERROR);
      });

      it('should reject a health metric with value out of physiological range', async () => {
        // Test validation with value out of range
        const result = await validateObject(outOfRangeHealthMetricEvent, HealthMetricEventDto, {
          journey: 'health',
          eventType: EventTypes.HEALTH_METRIC_RECORDED
        });
        
        expect(result.isValid).toBe(false);
        
        // Check that we have a physiological range validation issue
        const rangeIssue = result.issues.find(issue => 
          issue.field === 'data.value' && 
          issue.code.includes('PHYSIOLOGICALLY_PLAUSIBLE')
        );
        
        expect(rangeIssue).toBeDefined();
        expect(rangeIssue?.message).toContain('physiologically plausible range');
      });

      it('should validate using journey-specific validation functions', () => {
        // Test the HealthValidation namespace functions
        const result = HealthValidation.validateHealthMetric(validHealthMetricEvent.data);
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should throw EventValidationError for invalid events when using validateEventOrThrow', async () => {
        // Test that validateEventOrThrow throws the expected error
        await expect(validateEventOrThrow(
          invalidHealthMetricEvent, 
          HealthMetricEventDto, 
          { journey: 'health', eventType: EventTypes.HEALTH_METRIC_RECORDED }
        )).rejects.toThrow(EventValidationError);
        
        // Test that validateEventOrThrowSync throws the expected error
        expect(() => validateEventOrThrowSync(
          invalidHealthMetricEvent, 
          HealthMetricEventDto, 
          { journey: 'health', eventType: EventTypes.HEALTH_METRIC_RECORDED }
        )).toThrow(EventValidationError);
      });
    });

    describe('Health Goal Events', () => {
      // Valid health goal event
      const validHealthGoalEvent = {
        type: EventTypes.HEALTH_GOAL_CREATED,
        userId,
        timestamp,
        journey: 'health',
        data: {
          goalId: 'goal-123',
          goalType: 'steps',
          targetValue: 10000,
          unit: 'steps',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          currentValue: 0
        }
      };

      // Invalid health goal event (invalid goal type)
      const invalidHealthGoalEvent = {
        type: EventTypes.HEALTH_GOAL_CREATED,
        userId,
        timestamp,
        journey: 'health',
        data: {
          goalId: 'goal-123',
          goalType: 'invalid-goal-type', // Invalid goal type
          targetValue: 10000,
          unit: 'steps',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      it('should validate a valid health goal event', async () => {
        const result = await validateObject(validHealthGoalEvent, HealthGoalEventDto, {
          journey: 'health',
          eventType: EventTypes.HEALTH_GOAL_CREATED
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should reject an invalid health goal event with invalid goal type', async () => {
        const result = await validateObject(invalidHealthGoalEvent, HealthGoalEventDto, {
          journey: 'health',
          eventType: EventTypes.HEALTH_GOAL_CREATED
        });
        
        expect(result.isValid).toBe(false);
        
        // Check that we have a goal type validation issue
        const goalTypeIssue = result.issues.find(issue => 
          issue.field?.includes('goalType')
        );
        
        expect(goalTypeIssue).toBeDefined();
      });

      it('should validate using journey-specific validation functions', () => {
        // Test the HealthValidation namespace functions
        const result = HealthValidation.validateHealthGoal(validHealthGoalEvent.data);
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });
  });

  // =========================================================================
  // Care Journey Event Validation Tests
  // =========================================================================
  describe('Care Journey Event Validation', () => {
    describe('Appointment Events', () => {
      // Valid appointment event
      const validAppointmentEvent = {
        type: EventTypes.CARE_APPOINTMENT_BOOKED,
        userId,
        timestamp,
        journey: 'care',
        data: {
          appointmentId: 'appt-123',
          providerId: 'provider-123',
          specialtyType: 'cardiology',
          appointmentType: 'in_person',
          scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          bookingTimestamp: new Date().toISOString()
        }
      };

      // Invalid appointment event (past date)
      const invalidAppointmentEvent = {
        type: EventTypes.CARE_APPOINTMENT_BOOKED,
        userId,
        timestamp,
        journey: 'care',
        data: {
          appointmentId: 'appt-123',
          providerId: 'provider-123',
          specialtyType: 'cardiology',
          appointmentType: 'in_person',
          scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (past)
          bookingTimestamp: new Date().toISOString()
        }
      };

      it('should validate a valid appointment event', async () => {
        const result = await validateObject(validAppointmentEvent, AppointmentEventDto, {
          journey: 'care',
          eventType: EventTypes.CARE_APPOINTMENT_BOOKED
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should reject an appointment with a past date', async () => {
        const result = await validateObject(invalidAppointmentEvent, AppointmentEventDto, {
          journey: 'care',
          eventType: EventTypes.CARE_APPOINTMENT_BOOKED
        });
        
        expect(result.isValid).toBe(false);
        
        // Check that we have a date validation issue
        const dateIssue = result.issues.find(issue => 
          issue.field?.includes('scheduledTime') && 
          issue.message.includes('future')
        );
        
        expect(dateIssue).toBeDefined();
      });

      it('should validate using journey-specific validation functions', () => {
        // Test the CareValidation namespace functions
        const result = CareValidation.validateAppointment(validAppointmentEvent.data);
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });

    describe('Medication Events', () => {
      // Valid medication event
      const validMedicationEvent = {
        type: EventTypes.CARE_MEDICATION_TAKEN,
        userId,
        timestamp,
        journey: 'care',
        data: {
          medicationId: 'med-123',
          timestamp: new Date().toISOString(),
          takenOnSchedule: true,
          dosageTaken: '10mg'
        }
      };

      // Invalid medication event (invalid dosage)
      const invalidMedicationEvent = {
        type: EventTypes.CARE_MEDICATION_TAKEN,
        userId,
        timestamp,
        journey: 'care',
        data: {
          medicationId: 'med-123',
          timestamp: new Date().toISOString(),
          takenOnSchedule: true,
          dosageTaken: -10 // Negative dosage
        }
      };

      it('should validate a valid medication event', async () => {
        const result = await validateObject(validMedicationEvent, MedicationEventDto, {
          journey: 'care',
          eventType: EventTypes.CARE_MEDICATION_TAKEN
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should reject a medication event with invalid dosage', async () => {
        const result = await validateObject(invalidMedicationEvent, MedicationEventDto, {
          journey: 'care',
          eventType: EventTypes.CARE_MEDICATION_TAKEN
        });
        
        expect(result.isValid).toBe(false);
        
        // Check that we have a dosage validation issue
        const dosageIssue = result.issues.find(issue => 
          issue.field?.includes('dosageTaken')
        );
        
        expect(dosageIssue).toBeDefined();
      });

      it('should validate using journey-specific validation functions', () => {
        // Test the CareValidation namespace functions
        const result = CareValidation.validateMedication({
          medicationId: 'med-123',
          name: 'Test Medication',
          dosage: { amount: 10, unit: 'mg' },
          frequency: { times: 2, period: 'day' },
          startDate: new Date().toISOString()
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });
  });

  // =========================================================================
  // Plan Journey Event Validation Tests
  // =========================================================================
  describe('Plan Journey Event Validation', () => {
    describe('Claim Events', () => {
      // Valid claim event
      const validClaimEvent = {
        type: EventTypes.PLAN_CLAIM_SUBMITTED,
        userId,
        timestamp,
        journey: 'plan',
        data: {
          claimId: 'claim-123',
          claimType: 'medical',
          serviceDate: new Date().toISOString(),
          providerId: 'provider-123',
          amount: 150.75,
          submissionTimestamp: new Date().toISOString()
        }
      };

      // Invalid claim event (negative amount)
      const invalidClaimEvent = {
        type: EventTypes.PLAN_CLAIM_SUBMITTED,
        userId,
        timestamp,
        journey: 'plan',
        data: {
          claimId: 'claim-123',
          claimType: 'medical',
          serviceDate: new Date().toISOString(),
          providerId: 'provider-123',
          amount: -50.25, // Negative amount
          submissionTimestamp: new Date().toISOString()
        }
      };

      it('should validate a valid claim event', async () => {
        const result = await validateObject(validClaimEvent, ClaimEventDto, {
          journey: 'plan',
          eventType: EventTypes.PLAN_CLAIM_SUBMITTED
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should reject a claim event with negative amount', async () => {
        const result = await validateObject(invalidClaimEvent, ClaimEventDto, {
          journey: 'plan',
          eventType: EventTypes.PLAN_CLAIM_SUBMITTED
        });
        
        expect(result.isValid).toBe(false);
        
        // Check that we have an amount validation issue
        const amountIssue = result.issues.find(issue => 
          issue.field?.includes('amount') && 
          issue.message.includes('positive')
        );
        
        expect(amountIssue).toBeDefined();
      });

      it('should validate using journey-specific validation functions', () => {
        // Test the PlanValidation namespace functions
        const result = PlanValidation.validateClaim({
          claimId: 'claim-123',
          serviceDate: new Date().toISOString(),
          providerName: 'Test Provider',
          serviceType: 'consultation',
          amount: {
            total: 150.75,
            currency: 'USD'
          },
          status: 'submitted'
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });

    describe('Benefit Events', () => {
      // Valid benefit event
      const validBenefitEvent = {
        type: EventTypes.PLAN_BENEFIT_UTILIZED,
        userId,
        timestamp,
        journey: 'plan',
        data: {
          benefitId: 'benefit-123',
          benefitType: 'preventive',
          utilizationTimestamp: new Date().toISOString(),
          providerId: 'provider-123',
          savingsAmount: 75.50
        }
      };

      // Invalid benefit event (invalid benefit type)
      const invalidBenefitEvent = {
        type: EventTypes.PLAN_BENEFIT_UTILIZED,
        userId,
        timestamp,
        journey: 'plan',
        data: {
          benefitId: 'benefit-123',
          benefitType: 'invalid-type', // Invalid benefit type
          utilizationTimestamp: new Date().toISOString(),
          providerId: 'provider-123',
          savingsAmount: 75.50
        }
      };

      it('should validate a valid benefit event', async () => {
        const result = await validateObject(validBenefitEvent, BenefitEventDto, {
          journey: 'plan',
          eventType: EventTypes.PLAN_BENEFIT_UTILIZED
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should reject a benefit event with invalid benefit type', async () => {
        const result = await validateObject(invalidBenefitEvent, BenefitEventDto, {
          journey: 'plan',
          eventType: EventTypes.PLAN_BENEFIT_UTILIZED
        });
        
        expect(result.isValid).toBe(false);
        
        // Check that we have a benefit type validation issue
        const typeIssue = result.issues.find(issue => 
          issue.field?.includes('benefitType')
        );
        
        expect(typeIssue).toBeDefined();
      });

      it('should validate using journey-specific validation functions', () => {
        // Test the PlanValidation namespace functions
        const result = PlanValidation.validateBenefit({
          benefitId: 'benefit-123',
          category: 'medical',
          type: 'preventive',
          description: 'Annual check-up',
          coverage: {
            coinsurance: 0,
            copay: 0
          },
          effectiveDate: new Date().toISOString()
        });
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });
  });

  // =========================================================================
  // Cross-Journey Validation Tests
  // =========================================================================
  describe('Cross-Journey Validation', () => {
    it('should validate events using validateJourneyEvent function', () => {
      // Health journey event
      const healthResult = validateJourneyEvent(
        {
          metricType: 'heartRate',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString()
        },
        'health',
        'health.metric.recorded'
      );
      
      expect(healthResult.isValid).toBe(true);
      
      // Care journey event
      const careResult = validateJourneyEvent(
        {
          appointmentId: 'appt-123',
          providerId: 'provider-123',
          specialtyType: 'cardiology',
          appointmentType: 'in_person',
          scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          bookingTimestamp: new Date().toISOString()
        },
        'care',
        'care.appointment.booked'
      );
      
      expect(careResult.isValid).toBe(true);
      
      // Plan journey event
      const planResult = validateJourneyEvent(
        {
          claimId: 'claim-123',
          claimType: 'medical',
          serviceDate: new Date().toISOString(),
          providerId: 'provider-123',
          amount: 150.75,
          submissionTimestamp: new Date().toISOString()
        },
        'plan',
        'plan.claim.submitted'
      );
      
      expect(planResult.isValid).toBe(true);
    });

    it('should reject events with invalid journey', () => {
      const result = validateJourneyEvent(
        {
          metricType: 'heartRate',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString()
        },
        'invalid-journey', // Invalid journey
        'health.metric.recorded'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.issues[0].code).toBe('VALIDATION_INVALID_JOURNEY');
    });

    it('should reject events with invalid event type', () => {
      const result = validateJourneyEvent(
        {
          metricType: 'heartRate',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString()
        },
        'health',
        'invalid.event.type' // Invalid event type
      );
      
      expect(result.isValid).toBe(false);
      expect(result.issues[0].code).toBe('VALIDATION_INVALID_EVENT_TYPE');
    });
  });

  // =========================================================================
  // Validation Error Format Tests
  // =========================================================================
  describe('Validation Error Format', () => {
    it('should provide detailed validation issues with proper format', async () => {
      // Test with an invalid event
      const invalidEvent = {
        type: EventTypes.HEALTH_METRIC_RECORDED,
        userId,
        timestamp,
        journey: 'health',
        data: {
          // Missing metricType
          value: -10, // Invalid value
          unit: 'invalid-unit', // Invalid unit
          timestamp: 'not-a-date' // Invalid timestamp
        }
      };
      
      const result = await validateObject(invalidEvent, HealthMetricEventDto, {
        journey: 'health',
        eventType: EventTypes.HEALTH_METRIC_RECORDED
      });
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Check that each issue has the required properties
      result.issues.forEach(issue => {
        expect(issue.code).toBeDefined();
        expect(issue.message).toBeDefined();
        expect(issue.severity).toBeDefined();
        
        // Context should include journey and eventType
        if (issue.context) {
          expect(issue.context.journey).toBe('health');
          expect(issue.context.eventType).toBe(EventTypes.HEALTH_METRIC_RECORDED);
        }
      });
      
      // Test getting errors by severity
      const errorIssues = result.getIssuesBySeverity(ValidationSeverity.ERROR);
      expect(errorIssues.length).toBeGreaterThan(0);
      expect(errorIssues.every(issue => issue.severity === ValidationSeverity.ERROR)).toBe(true);
      
      // Test converting to ValidationError instances
      const errors = result.getErrors();
      expect(errors.length).toBe(result.issues.length);
    });

    it('should throw EventValidationError with proper context', async () => {
      // Test with an invalid event
      const invalidEvent = {
        type: EventTypes.HEALTH_METRIC_RECORDED,
        userId,
        timestamp,
        journey: 'health',
        data: {
          // Missing required fields
        }
      };
      
      try {
        await validateEventOrThrow(invalidEvent, HealthMetricEventDto, {
          journey: 'health',
          eventType: EventTypes.HEALTH_METRIC_RECORDED
        });
        fail('Expected validateEventOrThrow to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EventValidationError);
        
        // Check error properties
        const validationError = error as EventValidationError;
        expect(validationError.message).toContain('Event validation failed');
        expect(validationError.context).toBeDefined();
        expect(validationError.context.eventType).toBe(EventTypes.HEALTH_METRIC_RECORDED);
        expect(validationError.context.details?.validationIssues).toBeDefined();
        expect(validationError.context.details?.validationIssues.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // Zod Validation Tests
  // =========================================================================
  describe('Zod Validation', () => {
    it('should validate events using Zod schemas', () => {
      // Create a simple Zod schema for testing
      const healthMetricSchema = z.object({
        metricType: z.enum(['heartRate', 'bloodPressure', 'weight']),
        value: z.number().positive(),
        unit: z.string(),
        timestamp: z.string().datetime()
      });
      
      // Valid data
      const validData = {
        metricType: 'heartRate',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString()
      };
      
      // Invalid data
      const invalidData = {
        metricType: 'invalid', // Invalid enum value
        value: -10, // Negative value
        unit: 123, // Not a string
        timestamp: 'not-a-date' // Invalid date
      };
      
      // Test valid data
      const validResult = validateWithZod(validData, healthMetricSchema, {
        journey: 'health',
        eventType: 'health.metric.recorded'
      });
      
      expect(validResult.isValid).toBe(true);
      expect(validResult.issues).toHaveLength(0);
      
      // Test invalid data
      const invalidResult = validateWithZod(invalidData, healthMetricSchema, {
        journey: 'health',
        eventType: 'health.metric.recorded'
      });
      
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.issues.length).toBeGreaterThan(0);
      
      // Check that we have the expected validation issues
      expect(invalidResult.issues.some(issue => issue.field.includes('metricType'))).toBe(true);
      expect(invalidResult.issues.some(issue => issue.field.includes('value'))).toBe(true);
      expect(invalidResult.issues.some(issue => issue.field.includes('unit'))).toBe(true);
      expect(invalidResult.issues.some(issue => issue.field.includes('timestamp'))).toBe(true);
    });
  });
});