import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { Controller, Get, Module, Param } from '@nestjs/common';
import { ErrorsModule } from '../../src';
import { ErrorType } from '../../src/types';

// Import journey-specific errors
import { Health } from '../../src/journey/health';
import { Care } from '../../src/journey/care';
import { Plan } from '../../src/journey/plan';

// Import test helpers
import { assertErrorResponse } from '../helpers/assertion-helpers';
import { createTestApp } from './test-app';
import { errorFactory } from '../helpers/error-factory';

/**
 * Health Journey Test Controller
 * Exposes endpoints that trigger Health journey-specific errors
 * 
 * This controller simulates the Health journey service and throws
 * domain-specific errors for metrics, goals, and devices to test
 * the error handling framework's ability to properly format and
 * categorize Health journey errors.
 */
@Controller('health')
class HealthTestController {
  @Get('metrics/:id')
  getMetric(@Param('id') id: string) {
    if (id === 'invalid') {
      throw new Health.Metrics.InvalidMetricValueError(
        'Blood pressure value is outside acceptable range',
        { metricType: 'blood_pressure', value: '300/200' }
      );
    } else if (id === 'not-found') {
      throw new Health.Metrics.MetricNotFoundError(
        'The requested health metric could not be found',
        { metricId: id, userId: 'test-user' }
      );
    } else if (id === 'device-error') {
      throw new Health.Devices.DeviceConnectionFailureError(
        'Failed to connect to the blood pressure monitor',
        { deviceId: 'bpm-123', connectionAttempts: 3 }
      );
    }
    return { id, value: '120/80', unit: 'mmHg' };
  }

  @Get('goals/:id')
  getGoal(@Param('id') id: string) {
    if (id === 'invalid') {
      throw new Health.Goals.InvalidGoalParametersError(
        'Goal parameters are invalid',
        { goalType: 'steps', targetValue: -1000 }
      );
    } else if (id === 'not-found') {
      throw new Health.Goals.GoalNotFoundError(
        'The requested health goal could not be found',
        { goalId: id, userId: 'test-user' }
      );
    }
    return { id, type: 'steps', target: 10000, progress: 5000 };
  }
}

/**
 * Care Journey Test Controller
 * Exposes endpoints that trigger Care journey-specific errors
 * 
 * This controller simulates the Care journey service and throws
 * domain-specific errors for appointments, medications, and providers
 * to test the error handling framework's ability to properly format
 * and categorize Care journey errors.
 */
@Controller('care')
class CareTestController {
  @Get('appointments/:id')
  getAppointment(@Param('id') id: string) {
    if (id === 'past-date') {
      throw new Care.AppointmentDateInPastError(
        'Cannot schedule an appointment in the past',
        { requestedDate: '2023-01-01T10:00:00Z', currentDate: new Date().toISOString() }
      );
    } else if (id === 'not-found') {
      throw new Care.AppointmentNotFoundError(
        'The requested appointment could not be found',
        { appointmentId: id, userId: 'test-user' }
      );
    } else if (id === 'provider-unavailable') {
      throw new Care.AppointmentProviderUnavailableError(
        'The selected provider is not available at the requested time',
        { providerId: 'provider-123', requestedTime: '2023-12-01T14:00:00Z' }
      );
    }
    return { id, date: '2023-12-01T14:00:00Z', provider: 'Dr. Smith', status: 'confirmed' };
  }

  @Get('medications/:id')
  getMedication(@Param('id') id: string) {
    if (id === 'interaction') {
      throw new Care.MedicationInteractionError(
        'Potential harmful interaction detected with existing medication',
        { medicationId: id, interactingWith: 'med-456', severity: 'high' }
      );
    } else if (id === 'not-found') {
      throw new Care.MedicationNotFoundError(
        'The requested medication could not be found',
        { medicationId: id, userId: 'test-user' }
      );
    }
    return { id, name: 'Aspirin', dosage: '100mg', frequency: 'daily' };
  }
}

/**
 * Plan Journey Test Controller
 * Exposes endpoints that trigger Plan journey-specific errors
 * 
 * This controller simulates the Plan journey service and throws
 * domain-specific errors for claims, benefits, and coverage
 * to test the error handling framework's ability to properly format
 * and categorize Plan journey errors.
 */
@Controller('plan')
class PlanTestController {
  @Get('claims/:id')
  getClaim(@Param('id') id: string) {
    if (id === 'duplicate') {
      throw new Plan.Claims.DuplicateClaimError(
        'A claim with the same information has already been submitted',
        { claimId: 'original-claim-123', submissionDate: '2023-11-15T10:30:00Z' }
      );
    } else if (id === 'not-found') {
      throw new Plan.Claims.ClaimNotFoundError(
        'The requested claim could not be found',
        { claimId: id, userId: 'test-user' }
      );
    } else if (id === 'denied') {
      throw new Plan.Claims.ClaimDeniedError(
        'Claim was denied due to service not being covered',
        { claimId: id, denialReason: 'service-not-covered', appealDeadline: '2023-12-30' }
      );
    }
    return { id, amount: 150.00, status: 'approved', submissionDate: '2023-11-10T09:15:00Z' };
  }

  @Get('benefits/:id')
  getBenefit(@Param('id') id: string) {
    if (id === 'not-covered') {
      throw new Plan.Benefits.BenefitNotCoveredError(
        'This benefit is not covered by your current plan',
        { benefitId: id, planId: 'basic-plan' }
      );
    } else if (id === 'not-found') {
      throw new Plan.Benefits.BenefitNotFoundError(
        'The requested benefit could not be found',
        { benefitId: id, userId: 'test-user' }
      );
    } else if (id === 'limit-exceeded') {
      throw new Plan.Benefits.BenefitLimitExceededError(
        'You have exceeded the annual limit for this benefit',
        { benefitId: id, limit: 1000, used: 1200, period: 'annual' }
      );
    }
    return { id, name: 'Dental Checkup', coveragePercentage: 80, annualLimit: 1000 };
  }
}

/**
 * Test Module that includes all journey controllers
 * 
 * This module configures the ErrorsModule and registers all journey-specific
 * test controllers to create a complete test environment for verifying
 * journey-specific error handling across the AUSTA SuperApp.
 */
@Module({
  imports: [ErrorsModule],
  controllers: [HealthTestController, CareTestController, PlanTestController],
})
class JourneyErrorTestModule {}

/**
 * End-to-end tests for journey-specific error handling
 * 
 * These tests verify that:
 * 1. Each journey (Health, Care, Plan) has specialized error types
 * 2. Errors are properly classified and formatted
 * 3. Error responses include appropriate journey context
 * 4. Error codes follow defined conventions (HEALTH_, CARE_, PLAN_ prefixes)
 */
describe('Journey-specific Error Handling (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Create test application with journey error controllers
    const moduleRef = await Test.createTestingModule({
      imports: [JourneyErrorTestModule],
    }).compile();

    app = await createTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Journey Error Handling', () => {
    it('should return properly formatted error for invalid metric value', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/metrics/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^HEALTH_METRICS_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('metricType', 'blood_pressure');
      expect(response.body.error.details).toHaveProperty('value', '300/200');
    });

    it('should return properly formatted error for metric not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/metrics/not-found')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^HEALTH_METRICS_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('metricId', 'not-found');
      expect(response.body.error.details).toHaveProperty('userId', 'test-user');
    });

    it('should return properly formatted error for device connection failure', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/metrics/device-error')
        .expect(502); // External error - Bad Gateway

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^HEALTH_DEVICES_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('deviceId', 'bpm-123');
      expect(response.body.error.details).toHaveProperty('connectionAttempts', 3);
    });

    it('should return properly formatted error for invalid goal parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/goals/invalid')
        .expect(400); // Validation error - Bad Request

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^HEALTH_GOALS_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('goalType', 'steps');
      expect(response.body.error.details).toHaveProperty('targetValue', -1000);
    });
  });

  describe('Care Journey Error Handling', () => {
    it('should return properly formatted error for appointment in past date', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/appointments/past-date')
        .expect(400); // Validation error - Bad Request

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('requestedDate', '2023-01-01T10:00:00Z');
      expect(response.body.error.details).toHaveProperty('currentDate');
    });

    it('should return properly formatted error for appointment not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/appointments/not-found')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('appointmentId', 'not-found');
      expect(response.body.error.details).toHaveProperty('userId', 'test-user');
    });

    it('should return properly formatted error for provider unavailable', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/appointments/provider-unavailable')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('providerId', 'provider-123');
      expect(response.body.error.details).toHaveProperty('requestedTime', '2023-12-01T14:00:00Z');
    });

    it('should return properly formatted error for medication interaction', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/medications/interaction')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^CARE_MEDICATION_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('medicationId', 'interaction');
      expect(response.body.error.details).toHaveProperty('interactingWith', 'med-456');
      expect(response.body.error.details).toHaveProperty('severity', 'high');
    });
  });

  describe('Plan Journey Error Handling', () => {
    it('should return properly formatted error for duplicate claim', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/claims/duplicate')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^PLAN_CLAIMS_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('claimId', 'original-claim-123');
      expect(response.body.error.details).toHaveProperty('submissionDate', '2023-11-15T10:30:00Z');
    });

    it('should return properly formatted error for claim not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/claims/not-found')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^PLAN_CLAIMS_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('claimId', 'not-found');
      expect(response.body.error.details).toHaveProperty('userId', 'test-user');
    });

    it('should return properly formatted error for denied claim', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/claims/denied')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^PLAN_CLAIMS_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('claimId', 'denied');
      expect(response.body.error.details).toHaveProperty('denialReason', 'service-not-covered');
      expect(response.body.error.details).toHaveProperty('appealDeadline', '2023-12-30');
    });

    it('should return properly formatted error for benefit not covered', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/benefits/not-covered')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^PLAN_BENEFITS_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('benefitId', 'not-covered');
      expect(response.body.error.details).toHaveProperty('planId', 'basic-plan');
    });

    it('should return properly formatted error for benefit limit exceeded', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/benefits/limit-exceeded')
        .expect(422); // Business error - Unprocessable Entity

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/^PLAN_BENEFITS_/);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.details).toHaveProperty('benefitId', 'limit-exceeded');
      expect(response.body.error.details).toHaveProperty('limit', 1000);
      expect(response.body.error.details).toHaveProperty('used', 1200);
      expect(response.body.error.details).toHaveProperty('period', 'annual');
    });
  });

  describe('Cross-Journey Error Handling', () => {
    // Mock the logger to verify error logging
    let mockLogger: any;
    
    beforeEach(() => {
      // Reset the mock before each test
      mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      };
      
      // Replace the logger in the app with our mock
      const loggerService = app.get('LOGGER_SERVICE', { strict: false });
      if (loggerService) {
        Object.assign(loggerService, mockLogger);
      }
    });
    it('should maintain consistent error structure across all journeys', async () => {
      // Get error responses from each journey
      const healthResponse = await request(app.getHttpServer()).get('/health/metrics/not-found');
      const careResponse = await request(app.getHttpServer()).get('/care/appointments/not-found');
      const planResponse = await request(app.getHttpServer()).get('/plan/claims/not-found');

      // Verify consistent structure
      const responses = [healthResponse.body, careResponse.body, planResponse.body];
      
      responses.forEach(response => {
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('type');
        expect(response.error).toHaveProperty('code');
        expect(response.error).toHaveProperty('message');
        expect(response.error).toHaveProperty('details');
      });

      // Verify journey-specific prefixes
      expect(healthResponse.body.error.code).toMatch(/^HEALTH_/);
      expect(careResponse.body.error.code).toMatch(/^CARE_/);
      expect(planResponse.body.error.code).toMatch(/^PLAN_/);
      
      // Use the assertErrorResponse helper for more comprehensive validation
      assertErrorResponse(healthResponse.body, {
        type: ErrorType.BUSINESS,
        codePattern: /^HEALTH_METRICS_/,
        hasMessage: true,
        details: { metricId: 'not-found', userId: 'test-user' }
      });
      
      assertErrorResponse(careResponse.body, {
        type: ErrorType.BUSINESS,
        codePattern: /^CARE_APPOINTMENT_/,
        hasMessage: true,
        details: { appointmentId: 'not-found', userId: 'test-user' }
      });
      
      assertErrorResponse(planResponse.body, {
        type: ErrorType.BUSINESS,
        codePattern: /^PLAN_CLAIMS_/,
        hasMessage: true,
        details: { claimId: 'not-found', userId: 'test-user' }
      });
    });

    it('should map error types to consistent HTTP status codes across journeys', async () => {
      // Test validation errors (400 Bad Request)
      const healthValidationResponse = await request(app.getHttpServer())
        .get('/health/goals/invalid')
        .expect(400);
      
      const careValidationResponse = await request(app.getHttpServer())
        .get('/care/appointments/past-date')
        .expect(400);

      // Test business errors (422 Unprocessable Entity)
      const healthBusinessResponse = await request(app.getHttpServer())
        .get('/health/metrics/not-found')
        .expect(422);
      
      const careBusinessResponse = await request(app.getHttpServer())
        .get('/care/appointments/not-found')
        .expect(422);
      
      const planBusinessResponse = await request(app.getHttpServer())
        .get('/plan/claims/not-found')
        .expect(422);

      // Test external errors (502 Bad Gateway)
      const healthExternalResponse = await request(app.getHttpServer())
        .get('/health/metrics/device-error')
        .expect(502);

      // Verify error types match expected HTTP status codes
      expect(healthValidationResponse.body.error.type).toBe('validation');
      expect(careValidationResponse.body.error.type).toBe('validation');
      
      expect(healthBusinessResponse.body.error.type).toBe('business');
      expect(careBusinessResponse.body.error.type).toBe('business');
      expect(planBusinessResponse.body.error.type).toBe('business');
      
      expect(healthExternalResponse.body.error.type).toBe('external');
    });
    
    it('should provide user-friendly error messages with journey context', async () => {
      // Get error responses from each journey with detailed context
      const healthResponse = await request(app.getHttpServer()).get('/health/metrics/invalid');
      const careResponse = await request(app.getHttpServer()).get('/care/medications/interaction');
      const planResponse = await request(app.getHttpServer()).get('/plan/benefits/limit-exceeded');
      
      // Verify messages are user-friendly and contain relevant context
      expect(healthResponse.body.error.message).toContain('Blood pressure value');
      expect(healthResponse.body.error.message).toContain('outside acceptable range');
      
      expect(careResponse.body.error.message).toContain('Potential harmful interaction');
      expect(careResponse.body.error.message).toContain('existing medication');
      
      expect(planResponse.body.error.message).toContain('exceeded the annual limit');
      
      // Verify context details are included
      expect(healthResponse.body.error.details).toHaveProperty('metricType', 'blood_pressure');
      expect(careResponse.body.error.details).toHaveProperty('severity', 'high');
      expect(planResponse.body.error.details).toHaveProperty('period', 'annual');
    });
    
    it('should properly log errors with journey context', async () => {
      // Trigger errors from each journey
      await request(app.getHttpServer()).get('/health/metrics/not-found');
      await request(app.getHttpServer()).get('/care/appointments/not-found');
      await request(app.getHttpServer()).get('/plan/claims/not-found');
      
      // Verify that errors were logged with proper context
      expect(mockLogger.error).toHaveBeenCalledTimes(3);
      
      // Check the logged error messages contain journey-specific information
      const logCalls = mockLogger.error.mock.calls;
      
      // At least one log should contain Health journey information
      expect(logCalls.some(call => 
        call[0].includes('Health') || 
        (call[1] && JSON.stringify(call[1]).includes('HEALTH_'))))
      .toBeTruthy();
      
      // At least one log should contain Care journey information
      expect(logCalls.some(call => 
        call[0].includes('Care') || 
        (call[1] && JSON.stringify(call[1]).includes('CARE_'))))
      .toBeTruthy();
      
      // At least one log should contain Plan journey information
      expect(logCalls.some(call => 
        call[0].includes('Plan') || 
        (call[1] && JSON.stringify(call[1]).includes('PLAN_'))))
      .toBeTruthy();
    });
  });
});