/**
 * Integration tests for journey-specific error handling.
 * 
 * These tests verify proper integration between journey errors (health, care, plan)
 * and the core error system. They test journey-specific error classification,
 * custom error codes, client-friendly error messages with journey context, and
 * proper HTTP status code mapping.
 */

import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../src/categories/index';
import { AppException } from '../../src/base/app-exception';
import { Health, Care, Plan } from '../../src/journey';
import {
  Health as HealthFactory,
  Care as CareFactory,
  Plan as PlanFactory
} from '../helpers/error-factory';
import {
  assertHealthJourneyError,
  assertCareJourneyError,
  assertPlanJourneyError,
  assertJourneyHttpErrorResponse,
  assertCrossJourneyErrorPropagation
} from '../helpers/assertion-helpers';

describe('Journey Error Integration', () => {
  /**
   * Health Journey Error Tests
   */
  describe('Health Journey Errors', () => {
    describe('Error Classification', () => {
      it('should classify metric errors correctly', () => {
        // Create a health metric error
        const error = HealthFactory.createMetricError('heartRate', {
          code: 'HEALTH_METRICS_INVALID_HEART_RATE',
          details: {
            metricType: 'heartRate',
            value: 250,
            allowedRange: { min: 30, max: 220 }
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.VALIDATION);
        expect(error).toContainErrorCode('HEALTH_METRICS_INVALID_HEART_RATE');
        expect(error).toHaveJourneyContext('health', ['metricType', 'value', 'allowedRange']);

        // Use specialized assertion helper
        assertHealthJourneyError(error, 'HEALTH_METRICS_INVALID_HEART_RATE', 'metrics');
      });

      it('should classify goal errors correctly', () => {
        // Create a health goal error
        const error = HealthFactory.createGoalError('steps', {
          code: 'HEALTH_GOALS_INVALID_STEPS',
          details: {
            goalType: 'steps',
            targetValue: -100,
            minValue: 0
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.VALIDATION);
        expect(error).toContainErrorCode('HEALTH_GOALS_INVALID_STEPS');
        expect(error).toHaveJourneyContext('health', ['goalType', 'targetValue', 'minValue']);

        // Use specialized assertion helper
        assertHealthJourneyError(error, 'HEALTH_GOALS_INVALID_STEPS', 'goals');
      });

      it('should classify device errors correctly', () => {
        // Create a device connection error
        const error = HealthFactory.createDeviceError('fitbit', {
          code: 'HEALTH_DEVICES_CONNECTION_FITBIT',
          details: {
            deviceType: 'fitbit',
            errorCode: 'AUTH_FAILED',
            timestamp: new Date().toISOString()
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.EXTERNAL);
        expect(error).toContainErrorCode('HEALTH_DEVICES_CONNECTION_FITBIT');
        expect(error).toHaveJourneyContext('health', ['deviceType', 'errorCode']);

        // Use specialized assertion helper
        assertHealthJourneyError(error, 'HEALTH_DEVICES_CONNECTION_FITBIT', 'devices');
      });

      it('should classify FHIR errors correctly', () => {
        // Create a FHIR error
        const error = HealthFactory.createFhirError('Patient', {
          code: 'HEALTH_FHIR_INVALID_PATIENT',
          details: {
            resourceType: 'Patient',
            validationErrors: ['Missing required field: name']
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.VALIDATION);
        expect(error).toContainErrorCode('HEALTH_FHIR_INVALID_PATIENT');
        expect(error).toHaveJourneyContext('health', ['resourceType', 'validationErrors']);

        // Use specialized assertion helper
        assertHealthJourneyError(error, 'HEALTH_FHIR_INVALID_PATIENT', 'fhir');
      });
    });

    describe('Error Serialization', () => {
      it('should serialize health errors with proper context', () => {
        // Create a health metric error
        const error = HealthFactory.createMetricError('heartRate', {
          code: 'HEALTH_METRICS_INVALID_HEART_RATE',
          details: {
            metricType: 'heartRate',
            value: 250,
            allowedRange: { min: 30, max: 220 }
          }
        });

        // Serialize to JSON
        const serialized = error.toJSON();

        // Verify serialized structure
        expect(serialized).toHaveProperty('error');
        expect(serialized.error).toHaveProperty('type', ErrorType.VALIDATION);
        expect(serialized.error).toHaveProperty('code', 'HEALTH_METRICS_INVALID_HEART_RATE');
        expect(serialized.error).toHaveProperty('message');
        expect(serialized.error).toHaveProperty('details');
        expect(serialized.error.details).toHaveProperty('metricType', 'heartRate');
        expect(serialized.error.details).toHaveProperty('value', 250);
        expect(serialized.error.details).toHaveProperty('allowedRange');
        expect(serialized.error.details.allowedRange).toHaveProperty('min', 30);
        expect(serialized.error.details.allowedRange).toHaveProperty('max', 220);
      });

      it('should convert health errors to HTTP exceptions with correct status codes', () => {
        // Create errors of different types
        const validationError = HealthFactory.createMetricError('heartRate');
        const businessError = new Health.Goals.GoalNotFoundError('Goal not found', {
          goalId: 'goal-123'
        });
        const technicalError = new Health.Insights.InsightGenerationError('Failed to generate insights', {
          userId: 'user-123',
          insightType: 'activity'
        });
        const externalError = HealthFactory.createDeviceError('fitbit');

        // Convert to HTTP exceptions
        const validationHttpError = validationError.toHttpException();
        const businessHttpError = businessError.toHttpException();
        const technicalHttpError = technicalError.toHttpException();
        const externalHttpError = externalError.toHttpException();

        // Verify status codes
        expect(validationHttpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(businessHttpError.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(technicalHttpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(externalHttpError.getStatus()).toBe(HttpStatus.BAD_GATEWAY);

        // Verify response structure is preserved
        const validationResponse = validationHttpError.getResponse();
        expect(validationResponse).toHaveProperty('error');
        expect(validationResponse.error).toHaveProperty('type', ErrorType.VALIDATION);
        expect(validationResponse.error).toHaveProperty('code');
      });
    });

    describe('HTTP Response Integration', () => {
      it('should create proper HTTP error responses with health context', () => {
        // Create a mock HTTP response with a health error
        const error = HealthFactory.createMetricError('heartRate');
        const httpError = error.toHttpException();
        const mockResponse = {
          status: httpError.getStatus(),
          body: httpError.getResponse()
        };

        // Verify HTTP response
        assertJourneyHttpErrorResponse(
          mockResponse,
          'health',
          HttpStatus.BAD_REQUEST,
          ErrorType.VALIDATION,
          error.code
        );
      });
    });
  });

  /**
   * Care Journey Error Tests
   */
  describe('Care Journey Errors', () => {
    describe('Error Classification', () => {
      it('should classify appointment errors correctly', () => {
        // Create an appointment error
        const error = CareFactory.createAppointmentError('notFound', 'appt-123', {
          code: 'CARE_APPOINTMENT_NOT_FOUND',
          details: {
            appointmentId: 'appt-123'
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.BUSINESS);
        expect(error).toContainErrorCode('CARE_APPOINTMENT_NOT_FOUND');
        expect(error).toHaveJourneyContext('care', ['appointmentId']);

        // Use specialized assertion helper
        assertCareJourneyError(error, 'CARE_APPOINTMENT_NOT_FOUND', 'appointment');
      });

      it('should classify provider errors correctly', () => {
        // Create a provider error
        const error = CareFactory.createProviderError('unavailable', 'provider-123', {
          code: 'CARE_PROVIDER_UNAVAILABLE',
          details: {
            providerId: 'provider-123',
            reason: 'On vacation',
            availableAfter: '2023-12-31'
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.BUSINESS);
        expect(error).toContainErrorCode('CARE_PROVIDER_UNAVAILABLE');
        expect(error).toHaveJourneyContext('care', ['providerId', 'reason', 'availableAfter']);

        // Use specialized assertion helper
        assertCareJourneyError(error, 'CARE_PROVIDER_UNAVAILABLE', 'provider');
      });

      it('should classify telemedicine errors correctly', () => {
        // Create a telemedicine error
        const error = CareFactory.createTelemedicineError('connection', 'session-123', {
          code: 'CARE_TELEMEDICINE_CONNECTION',
          details: {
            sessionId: 'session-123',
            errorCode: 'WEBRTC_FAILED',
            timestamp: new Date().toISOString()
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.TECHNICAL);
        expect(error).toContainErrorCode('CARE_TELEMEDICINE_CONNECTION');
        expect(error).toHaveJourneyContext('care', ['sessionId', 'errorCode']);

        // Use specialized assertion helper
        assertCareJourneyError(error, 'CARE_TELEMEDICINE_CONNECTION', 'telemedicine');
      });

      it('should classify medication errors correctly', () => {
        // Create a medication error
        const error = CareFactory.createMedicationError('interaction', 'med-123', {
          code: 'CARE_MEDICATION_INTERACTION',
          details: {
            medicationId: 'med-123',
            interactingWith: 'med-456',
            severityLevel: 'high',
            interactionDescription: 'Potentially life-threatening interaction'
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.BUSINESS);
        expect(error).toContainErrorCode('CARE_MEDICATION_INTERACTION');
        expect(error).toHaveJourneyContext('care', [
          'medicationId',
          'interactingWith',
          'severityLevel',
          'interactionDescription'
        ]);

        // Use specialized assertion helper
        assertCareJourneyError(error, 'CARE_MEDICATION_INTERACTION', 'medication');
      });
    });

    describe('Error Serialization', () => {
      it('should serialize care errors with proper context', () => {
        // Create a care appointment error
        const error = CareFactory.createAppointmentError('overlap', 'appt-123', {
          code: 'CARE_APPOINTMENT_OVERLAP',
          details: {
            appointmentId: 'appt-123',
            conflictingAppointmentId: 'appt-456',
            requestedTime: '2023-12-15T14:00:00Z',
            conflictingTime: '2023-12-15T14:30:00Z'
          }
        });

        // Serialize to JSON
        const serialized = error.toJSON();

        // Verify serialized structure
        expect(serialized).toHaveProperty('error');
        expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
        expect(serialized.error).toHaveProperty('code', 'CARE_APPOINTMENT_OVERLAP');
        expect(serialized.error).toHaveProperty('message');
        expect(serialized.error).toHaveProperty('details');
        expect(serialized.error.details).toHaveProperty('appointmentId', 'appt-123');
        expect(serialized.error.details).toHaveProperty('conflictingAppointmentId', 'appt-456');
        expect(serialized.error.details).toHaveProperty('requestedTime', '2023-12-15T14:00:00Z');
        expect(serialized.error.details).toHaveProperty('conflictingTime', '2023-12-15T14:30:00Z');
      });

      it('should convert care errors to HTTP exceptions with correct status codes', () => {
        // Create errors of different types
        const validationError = new Care.SymptomAssessmentIncompleteError('Symptom assessment incomplete', {
          missingSymptoms: ['fever', 'cough']
        });
        const businessError = CareFactory.createAppointmentError('notFound', 'appt-123');
        const technicalError = CareFactory.createTelemedicineError('connection', 'session-123');
        const externalError = new Care.PharmacyIntegrationError('Pharmacy integration failed', {
          pharmacyId: 'pharm-123',
          operationType: 'prescription'
        });

        // Convert to HTTP exceptions
        const validationHttpError = validationError.toHttpException();
        const businessHttpError = businessError.toHttpException();
        const technicalHttpError = technicalError.toHttpException();
        const externalHttpError = externalError.toHttpException();

        // Verify status codes
        expect(validationHttpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(businessHttpError.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(technicalHttpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(externalHttpError.getStatus()).toBe(HttpStatus.BAD_GATEWAY);

        // Verify response structure is preserved
        const businessResponse = businessHttpError.getResponse();
        expect(businessResponse).toHaveProperty('error');
        expect(businessResponse.error).toHaveProperty('type', ErrorType.BUSINESS);
        expect(businessResponse.error).toHaveProperty('code', 'CARE_APPOINTMENT_NOT_FOUND');
      });
    });

    describe('HTTP Response Integration', () => {
      it('should create proper HTTP error responses with care context', () => {
        // Create a mock HTTP response with a care error
        const error = CareFactory.createProviderError('unavailable', 'provider-123');
        const httpError = error.toHttpException();
        const mockResponse = {
          status: httpError.getStatus(),
          body: httpError.getResponse()
        };

        // Verify HTTP response
        assertJourneyHttpErrorResponse(
          mockResponse,
          'care',
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorType.BUSINESS,
          error.code
        );
      });
    });
  });

  /**
   * Plan Journey Error Tests
   */
  describe('Plan Journey Errors', () => {
    describe('Error Classification', () => {
      it('should classify plan errors correctly', () => {
        // Create a plan error
        const error = PlanFactory.createPlanError('notFound', 'plan-123', {
          code: 'PLAN_PLANS_NOT_FOUND',
          details: {
            planId: 'plan-123'
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.BUSINESS);
        expect(error).toContainErrorCode('PLAN_PLANS_NOT_FOUND');
        expect(error).toHaveJourneyContext('plan', ['planId']);

        // Use specialized assertion helper
        assertPlanJourneyError(error, 'PLAN_PLANS_NOT_FOUND', 'plans');
      });

      it('should classify benefit errors correctly', () => {
        // Create a benefit error
        const error = PlanFactory.createBenefitError('notCovered', 'benefit-123', {
          code: 'PLAN_BENEFITS_NOT_COVERED',
          details: {
            benefitId: 'benefit-123',
            planId: 'plan-456',
            reason: 'Not included in selected plan'
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.BUSINESS);
        expect(error).toContainErrorCode('PLAN_BENEFITS_NOT_COVERED');
        expect(error).toHaveJourneyContext('plan', ['benefitId', 'planId', 'reason']);

        // Use specialized assertion helper
        assertPlanJourneyError(error, 'PLAN_BENEFITS_NOT_COVERED', 'benefits');
      });

      it('should classify claim errors correctly', () => {
        // Create a claim error
        const error = PlanFactory.createClaimError('validation', 'claim-123', {
          code: 'PLAN_CLAIMS_VALIDATION',
          details: {
            claimId: 'claim-123',
            validationErrors: [
              { field: 'serviceDate', message: 'Date cannot be in the future' },
              { field: 'amount', message: 'Amount must be greater than zero' }
            ]
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.VALIDATION);
        expect(error).toContainErrorCode('PLAN_CLAIMS_VALIDATION');
        expect(error).toHaveJourneyContext('plan', ['claimId', 'validationErrors']);

        // Use specialized assertion helper
        assertPlanJourneyError(error, 'PLAN_CLAIMS_VALIDATION', 'claims');
      });

      it('should classify coverage errors correctly', () => {
        // Create a coverage error
        const error = PlanFactory.createCoverageError('outOfNetwork', 'coverage-123', {
          code: 'PLAN_COVERAGE_OUT_OF_NETWORK',
          details: {
            coverageId: 'coverage-123',
            providerId: 'provider-456',
            networkName: 'Preferred Provider Network'
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.BUSINESS);
        expect(error).toContainErrorCode('PLAN_COVERAGE_OUT_OF_NETWORK');
        expect(error).toHaveJourneyContext('plan', ['coverageId', 'providerId', 'networkName']);

        // Use specialized assertion helper
        assertPlanJourneyError(error, 'PLAN_COVERAGE_OUT_OF_NETWORK', 'coverage');
      });

      it('should classify document errors correctly', () => {
        // Create a document error
        const error = PlanFactory.createDocumentError('format', 'doc-123', {
          code: 'PLAN_DOCUMENTS_FORMAT',
          details: {
            documentId: 'doc-123',
            providedFormat: 'bmp',
            allowedFormats: ['pdf', 'jpg', 'png']
          }
        });

        // Verify error classification
        expect(error).toBeErrorType(ErrorType.VALIDATION);
        expect(error).toContainErrorCode('PLAN_DOCUMENTS_FORMAT');
        expect(error).toHaveJourneyContext('plan', ['documentId', 'providedFormat', 'allowedFormats']);

        // Use specialized assertion helper
        assertPlanJourneyError(error, 'PLAN_DOCUMENTS_FORMAT', 'documents');
      });
    });

    describe('Error Serialization', () => {
      it('should serialize plan errors with proper context', () => {
        // Create a plan claim error
        const error = PlanFactory.createClaimError('denied', 'claim-123', {
          code: 'PLAN_CLAIMS_DENIED',
          details: {
            claimId: 'claim-123',
            denialReason: 'Service not covered under current plan',
            denialCode: 'NOT_COVERED',
            appealDeadline: '2023-12-31'
          }
        });

        // Serialize to JSON
        const serialized = error.toJSON();

        // Verify serialized structure
        expect(serialized).toHaveProperty('error');
        expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
        expect(serialized.error).toHaveProperty('code', 'PLAN_CLAIMS_DENIED');
        expect(serialized.error).toHaveProperty('message');
        expect(serialized.error).toHaveProperty('details');
        expect(serialized.error.details).toHaveProperty('claimId', 'claim-123');
        expect(serialized.error.details).toHaveProperty('denialReason', 'Service not covered under current plan');
        expect(serialized.error.details).toHaveProperty('denialCode', 'NOT_COVERED');
        expect(serialized.error.details).toHaveProperty('appealDeadline', '2023-12-31');
      });

      it('should convert plan errors to HTTP exceptions with correct status codes', () => {
        // Create errors of different types
        const validationError = PlanFactory.createDocumentError('format', 'doc-123');
        const businessError = PlanFactory.createBenefitError('notCovered', 'benefit-123');
        const technicalError = new Plan.Claims.ClaimPersistenceError('Failed to save claim', {
          claimId: 'claim-123',
          operation: 'create'
        });
        const externalError = new Plan.Coverage.CoverageApiIntegrationError('Coverage API error', {
          apiEndpoint: '/api/coverage/verify',
          statusCode: 503
        });

        // Convert to HTTP exceptions
        const validationHttpError = validationError.toHttpException();
        const businessHttpError = businessError.toHttpException();
        const technicalHttpError = technicalError.toHttpException();
        const externalHttpError = externalError.toHttpException();

        // Verify status codes
        expect(validationHttpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(businessHttpError.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(technicalHttpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(externalHttpError.getStatus()).toBe(HttpStatus.BAD_GATEWAY);

        // Verify response structure is preserved
        const validationResponse = validationHttpError.getResponse();
        expect(validationResponse).toHaveProperty('error');
        expect(validationResponse.error).toHaveProperty('type', ErrorType.VALIDATION);
        expect(validationResponse.error).toHaveProperty('code');
      });
    });

    describe('HTTP Response Integration', () => {
      it('should create proper HTTP error responses with plan context', () => {
        // Create a mock HTTP response with a plan error
        const error = PlanFactory.createClaimError('validation', 'claim-123');
        const httpError = error.toHttpException();
        const mockResponse = {
          status: httpError.getStatus(),
          body: httpError.getResponse()
        };

        // Verify HTTP response
        assertJourneyHttpErrorResponse(
          mockResponse,
          'plan',
          HttpStatus.BAD_REQUEST,
          ErrorType.VALIDATION,
          error.code
        );
      });
    });
  });

  /**
   * Cross-Journey Error Tests
   */
  describe('Cross-Journey Error Handling', () => {
    it('should preserve context when propagating errors between journeys', () => {
      // Create a health error
      const healthError = HealthFactory.createMetricError('heartRate', {
        code: 'HEALTH_METRICS_INVALID_HEART_RATE',
        details: {
          metricType: 'heartRate',
          value: 250,
          allowedRange: { min: 30, max: 220 }
        }
      });

      // Create a care error that wraps the health error
      const careError = new Care.TreatmentPlanConflictError(
        'Treatment plan conflicts with health metrics',
        {
          treatmentPlanId: 'treatment-123',
          sourceJourney: 'health',
          sourceError: healthError
        },
        healthError
      );

      // Verify error propagation
      expect(careError).toBeErrorType(ErrorType.BUSINESS);
      expect(careError.cause).toBe(healthError);
      expect(careError.details).toHaveProperty('sourceJourney', 'health');
      expect(careError.details).toHaveProperty('sourceError');
      expect(careError.details.sourceError).toHaveProperty('code', 'HEALTH_METRICS_INVALID_HEART_RATE');

      // Use specialized assertion helper
      assertCrossJourneyErrorPropagation(healthError, careError, 'health', 'care');
    });

    it('should maintain error chain when propagating through multiple journeys', () => {
      // Create a health error
      const healthError = HealthFactory.createMetricError('heartRate');

      // Create a care error that wraps the health error
      const careError = new Care.TreatmentPlanConflictError(
        'Treatment plan conflicts with health metrics',
        { treatmentPlanId: 'treatment-123' },
        healthError
      );

      // Create a plan error that wraps the care error
      const planError = new Plan.Claims.ClaimDeniedError(
        'Claim denied due to treatment plan conflict',
        { claimId: 'claim-123' },
        careError
      );

      // Verify error chain
      expect(planError.cause).toBe(careError);
      expect(planError.cause.cause).toBe(healthError);

      // Verify each error maintains its type
      expect(planError).toBeErrorType(ErrorType.BUSINESS);
      expect(planError.cause).toBeErrorType(ErrorType.BUSINESS);
      expect(planError.cause.cause).toBeErrorType(ErrorType.VALIDATION);

      // Verify error codes are preserved
      expect(planError).toContainErrorCode('PLAN_CLAIMS_DENIED');
      expect(planError.cause).toContainErrorCode('CARE_TREATMENT_PLAN_CONFLICT');
      expect(planError.cause.cause).toContainErrorCode('HEALTH_METRICS_INVALID_HEART_RATE');
    });
  });
});