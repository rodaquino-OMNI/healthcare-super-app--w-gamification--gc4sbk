import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Controller, Get, Module, Param } from '@nestjs/common';
import { ErrorsModule } from '../../src';
import { AppException, ErrorType } from '../../../shared/src/exceptions/exceptions.types';

// Import journey-specific errors
import * as Health from '../../src/journey/health';
import * as Care from '../../src/journey/care';
import * as Plan from '../../src/journey/plan';

// Health Journey Test Controller
@Controller('health')
class HealthTestController {
  @Get('metrics/:id')
  getMetric(@Param('id') id: string) {
    if (id === 'invalid') {
      throw new Health.Metrics.InvalidMetricValueError(
        'Blood pressure value is outside acceptable range',
        { value: '300/200', acceptableRange: '90-140/60-90' }
      );
    }
    if (id === 'not-found') {
      throw new Health.Metrics.MetricNotFoundError(
        'Requested health metric not found',
        { metricId: id, metricType: 'blood_pressure' }
      );
    }
    if (id === 'device-error') {
      throw new Health.Devices.DeviceConnectionFailureError(
        'Failed to connect to blood pressure monitor',
        { deviceId: 'BP-Monitor-123', connectionAttempts: 3 }
      );
    }
    return { id, value: '120/80', unit: 'mmHg' };
  }

  @Get('goals/:id')
  getGoal(@Param('id') id: string) {
    if (id === 'invalid') {
      throw new Health.Goals.InvalidGoalParametersError(
        'Goal parameters are invalid',
        { targetValue: -10, metricType: 'steps' }
      );
    }
    if (id === 'conflict') {
      throw new Health.Goals.ConflictingGoalsError(
        'Goal conflicts with existing goals',
        { goalId: id, conflictingGoalIds: ['goal-123', 'goal-456'] }
      );
    }
    return { id, type: 'steps', target: 10000, progress: 5000 };
  }

  @Get('insights/:id')
  getInsight(@Param('id') id: string) {
    if (id === 'insufficient-data') {
      throw new Health.Insights.InsufficientDataError(
        'Not enough data to generate insight',
        { metricType: 'heart_rate', requiredDays: 7, availableDays: 2 }
      );
    }
    return { id, type: 'trend', description: 'Your heart rate is improving' };
  }
}

// Care Journey Test Controller
@Controller('care')
class CareTestController {
  @Get('appointments/:id')
  getAppointment(@Param('id') id: string) {
    if (id === 'not-found') {
      throw new Care.AppointmentNotFoundError(
        'Appointment not found',
        { appointmentId: id }
      );
    }
    if (id === 'past-date') {
      throw new Care.AppointmentDateInPastError(
        'Cannot book appointment in the past',
        { requestedDate: '2023-01-01T10:00:00Z', currentDate: new Date().toISOString() }
      );
    }
    if (id === 'provider-unavailable') {
      throw new Care.AppointmentProviderUnavailableError(
        'Provider is not available at the requested time',
        { providerId: 'provider-123', requestedTime: '2023-12-01T14:00:00Z' }
      );
    }
    return { id, provider: 'Dr. Smith', date: '2023-12-01T14:00:00Z' };
  }

  @Get('medications/:id')
  getMedication(@Param('id') id: string) {
    if (id === 'not-found') {
      throw new Care.MedicationNotFoundError(
        'Medication not found',
        { medicationId: id }
      );
    }
    if (id === 'interaction') {
      throw new Care.MedicationInteractionError(
        'Potential drug interaction detected',
        { 
          medicationId: id, 
          interactingMedicationIds: ['med-123', 'med-456'],
          severityLevel: 'high'
        }
      );
    }
    return { id, name: 'Aspirin', dosage: '100mg', frequency: 'daily' };
  }

  @Get('telemedicine/:id')
  getTelemedicineSession(@Param('id') id: string) {
    if (id === 'connection-error') {
      throw new Care.TelemedicineConnectionError(
        'Failed to establish telemedicine connection',
        { sessionId: id, errorCode: 'WEBRTC_ICE_FAILED' }
      );
    }
    return { id, status: 'scheduled', provider: 'Dr. Johnson' };
  }
}

// Plan Journey Test Controller
@Controller('plan')
class PlanTestController {
  @Get('plans/:id')
  getPlan(@Param('id') id: string) {
    if (id === 'not-found') {
      throw new Plan.Plans.PlanNotFoundError(
        'Insurance plan not found',
        { planId: id }
      );
    }
    if (id === 'region-unavailable') {
      throw new Plan.Plans.PlanNotAvailableInRegionError(
        'Plan is not available in your region',
        { planId: id, userRegion: 'Northeast', availableRegions: ['West', 'South'] }
      );
    }
    return { id, name: 'Premium Health Plan', coverage: 'comprehensive' };
  }

  @Get('claims/:id')
  getClaim(@Param('id') id: string) {
    if (id === 'not-found') {
      throw new Plan.Claims.ClaimNotFoundError(
        'Claim not found',
        { claimId: id }
      );
    }
    if (id === 'duplicate') {
      throw new Plan.Claims.DuplicateClaimError(
        'Duplicate claim detected',
        { claimId: id, originalClaimId: 'claim-123', serviceDate: '2023-10-15' }
      );
    }
    if (id === 'denied') {
      throw new Plan.Claims.ClaimDeniedError(
        'Claim was denied',
        { 
          claimId: id, 
          denialReason: 'Service not covered under current plan',
          denialCode: 'NOT_COVERED'
        }
      );
    }
    return { id, status: 'approved', amount: 500.00 };
  }

  @Get('benefits/:id')
  getBenefit(@Param('id') id: string) {
    if (id === 'not-found') {
      throw new Plan.Benefits.BenefitNotFoundError(
        'Benefit not found',
        { benefitId: id }
      );
    }
    if (id === 'not-covered') {
      throw new Plan.Benefits.BenefitNotCoveredError(
        'Benefit not covered by current plan',
        { benefitId: id, planId: 'plan-123' }
      );
    }
    if (id === 'limit-exceeded') {
      throw new Plan.Benefits.BenefitLimitExceededError(
        'Benefit usage limit exceeded',
        { 
          benefitId: id, 
          limit: 10, 
          used: 10,
          renewalDate: '2024-01-01'
        }
      );
    }
    return { id, name: 'Physical Therapy', limit: 20, used: 5 };
  }
}

@Module({
  imports: [ErrorsModule.forRoot()],
  controllers: [HealthTestController, CareTestController, PlanTestController],
})
class TestModule {}

describe('Journey Error Handling (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Journey Error Handling', () => {
    it('should return properly formatted error for invalid metric value', () => {
      return request(app.getHttpServer())
        .get('/health/metrics/invalid')
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.VALIDATION);
          expect(res.body.error.code).toMatch(/^HEALTH_METRICS_/);
          expect(res.body.error.message).toBe('Blood pressure value is outside acceptable range');
          expect(res.body.error.details).toEqual({
            value: '300/200',
            acceptableRange: '90-140/60-90'
          });
        });
    });

    it('should return properly formatted error for metric not found', () => {
      return request(app.getHttpServer())
        .get('/health/metrics/not-found')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^HEALTH_METRICS_/);
          expect(res.body.error.message).toBe('Requested health metric not found');
          expect(res.body.error.details).toEqual({
            metricId: 'not-found',
            metricType: 'blood_pressure'
          });
        });
    });

    it('should return properly formatted error for device connection failure', () => {
      return request(app.getHttpServer())
        .get('/health/metrics/device-error')
        .expect(502)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.EXTERNAL);
          expect(res.body.error.code).toMatch(/^HEALTH_DEVICES_/);
          expect(res.body.error.message).toBe('Failed to connect to blood pressure monitor');
          expect(res.body.error.details).toEqual({
            deviceId: 'BP-Monitor-123',
            connectionAttempts: 3
          });
        });
    });

    it('should return properly formatted error for invalid goal parameters', () => {
      return request(app.getHttpServer())
        .get('/health/goals/invalid')
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.VALIDATION);
          expect(res.body.error.code).toMatch(/^HEALTH_GOALS_/);
          expect(res.body.error.message).toBe('Goal parameters are invalid');
          expect(res.body.error.details).toEqual({
            targetValue: -10,
            metricType: 'steps'
          });
        });
    });

    it('should return properly formatted error for conflicting goals', () => {
      return request(app.getHttpServer())
        .get('/health/goals/conflict')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^HEALTH_GOALS_/);
          expect(res.body.error.message).toBe('Goal conflicts with existing goals');
          expect(res.body.error.details).toEqual({
            goalId: 'conflict',
            conflictingGoalIds: ['goal-123', 'goal-456']
          });
        });
    });

    it('should return properly formatted error for insufficient data for insights', () => {
      return request(app.getHttpServer())
        .get('/health/insights/insufficient-data')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^HEALTH_INSIGHTS_/);
          expect(res.body.error.message).toBe('Not enough data to generate insight');
          expect(res.body.error.details).toEqual({
            metricType: 'heart_rate',
            requiredDays: 7,
            availableDays: 2
          });
        });
    });
  });

  describe('Care Journey Error Handling', () => {
    it('should return properly formatted error for appointment not found', () => {
      return request(app.getHttpServer())
        .get('/care/appointments/not-found')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
          expect(res.body.error.message).toBe('Appointment not found');
          expect(res.body.error.details).toEqual({
            appointmentId: 'not-found'
          });
        });
    });

    it('should return properly formatted error for appointment date in past', () => {
      return request(app.getHttpServer())
        .get('/care/appointments/past-date')
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.VALIDATION);
          expect(res.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
          expect(res.body.error.message).toBe('Cannot book appointment in the past');
          expect(res.body.error.details.requestedDate).toBe('2023-01-01T10:00:00Z');
          expect(res.body.error.details.currentDate).toBeDefined();
        });
    });

    it('should return properly formatted error for provider unavailable', () => {
      return request(app.getHttpServer())
        .get('/care/appointments/provider-unavailable')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
          expect(res.body.error.message).toBe('Provider is not available at the requested time');
          expect(res.body.error.details).toEqual({
            providerId: 'provider-123',
            requestedTime: '2023-12-01T14:00:00Z'
          });
        });
    });

    it('should return properly formatted error for medication not found', () => {
      return request(app.getHttpServer())
        .get('/care/medications/not-found')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^CARE_MEDICATION_/);
          expect(res.body.error.message).toBe('Medication not found');
          expect(res.body.error.details).toEqual({
            medicationId: 'not-found'
          });
        });
    });

    it('should return properly formatted error for medication interaction', () => {
      return request(app.getHttpServer())
        .get('/care/medications/interaction')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^CARE_MEDICATION_/);
          expect(res.body.error.message).toBe('Potential drug interaction detected');
          expect(res.body.error.details).toEqual({
            medicationId: 'interaction',
            interactingMedicationIds: ['med-123', 'med-456'],
            severityLevel: 'high'
          });
        });
    });

    it('should return properly formatted error for telemedicine connection error', () => {
      return request(app.getHttpServer())
        .get('/care/telemedicine/connection-error')
        .expect(502)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.EXTERNAL);
          expect(res.body.error.code).toMatch(/^CARE_TELEMEDICINE_/);
          expect(res.body.error.message).toBe('Failed to establish telemedicine connection');
          expect(res.body.error.details).toEqual({
            sessionId: 'connection-error',
            errorCode: 'WEBRTC_ICE_FAILED'
          });
        });
    });
  });

  describe('Plan Journey Error Handling', () => {
    it('should return properly formatted error for plan not found', () => {
      return request(app.getHttpServer())
        .get('/plan/plans/not-found')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^PLAN_PLANS_/);
          expect(res.body.error.message).toBe('Insurance plan not found');
          expect(res.body.error.details).toEqual({
            planId: 'not-found'
          });
        });
    });

    it('should return properly formatted error for plan not available in region', () => {
      return request(app.getHttpServer())
        .get('/plan/plans/region-unavailable')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^PLAN_PLANS_/);
          expect(res.body.error.message).toBe('Plan is not available in your region');
          expect(res.body.error.details).toEqual({
            planId: 'region-unavailable',
            userRegion: 'Northeast',
            availableRegions: ['West', 'South']
          });
        });
    });

    it('should return properly formatted error for claim not found', () => {
      return request(app.getHttpServer())
        .get('/plan/claims/not-found')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^PLAN_CLAIMS_/);
          expect(res.body.error.message).toBe('Claim not found');
          expect(res.body.error.details).toEqual({
            claimId: 'not-found'
          });
        });
    });

    it('should return properly formatted error for duplicate claim', () => {
      return request(app.getHttpServer())
        .get('/plan/claims/duplicate')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^PLAN_CLAIMS_/);
          expect(res.body.error.message).toBe('Duplicate claim detected');
          expect(res.body.error.details).toEqual({
            claimId: 'duplicate',
            originalClaimId: 'claim-123',
            serviceDate: '2023-10-15'
          });
        });
    });

    it('should return properly formatted error for denied claim', () => {
      return request(app.getHttpServer())
        .get('/plan/claims/denied')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^PLAN_CLAIMS_/);
          expect(res.body.error.message).toBe('Claim was denied');
          expect(res.body.error.details).toEqual({
            claimId: 'denied',
            denialReason: 'Service not covered under current plan',
            denialCode: 'NOT_COVERED'
          });
        });
    });

    it('should return properly formatted error for benefit not found', () => {
      return request(app.getHttpServer())
        .get('/plan/benefits/not-found')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^PLAN_BENEFITS_/);
          expect(res.body.error.message).toBe('Benefit not found');
          expect(res.body.error.details).toEqual({
            benefitId: 'not-found'
          });
        });
    });

    it('should return properly formatted error for benefit not covered', () => {
      return request(app.getHttpServer())
        .get('/plan/benefits/not-covered')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^PLAN_BENEFITS_/);
          expect(res.body.error.message).toBe('Benefit not covered by current plan');
          expect(res.body.error.details).toEqual({
            benefitId: 'not-covered',
            planId: 'plan-123'
          });
        });
    });

    it('should return properly formatted error for benefit limit exceeded', () => {
      return request(app.getHttpServer())
        .get('/plan/benefits/limit-exceeded')
        .expect(422)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.BUSINESS);
          expect(res.body.error.code).toMatch(/^PLAN_BENEFITS_/);
          expect(res.body.error.message).toBe('Benefit usage limit exceeded');
          expect(res.body.error.details).toEqual({
            benefitId: 'limit-exceeded',
            limit: 10,
            used: 10,
            renewalDate: '2024-01-01'
          });
        });
    });
  });

  describe('Cross-Journey Error Handling', () => {
    it('should maintain consistent error structure across all journeys', async () => {
      // Get error responses from each journey
      const healthResponse = await request(app.getHttpServer()).get('/health/metrics/not-found').expect(422);
      const careResponse = await request(app.getHttpServer()).get('/care/appointments/not-found').expect(422);
      const planResponse = await request(app.getHttpServer()).get('/plan/claims/not-found').expect(422);
      
      // Verify consistent error structure
      const errorStructureKeys = ['type', 'code', 'message', 'details'];
      
      errorStructureKeys.forEach(key => {
        expect(healthResponse.body.error).toHaveProperty(key);
        expect(careResponse.body.error).toHaveProperty(key);
        expect(planResponse.body.error).toHaveProperty(key);
      });
    });

    it('should use journey-specific error code prefixes', async () => {
      // Get error responses from each journey
      const healthResponse = await request(app.getHttpServer()).get('/health/metrics/not-found').expect(422);
      const careResponse = await request(app.getHttpServer()).get('/care/appointments/not-found').expect(422);
      const planResponse = await request(app.getHttpServer()).get('/plan/claims/not-found').expect(422);
      
      // Verify journey-specific error code prefixes
      expect(healthResponse.body.error.code).toMatch(/^HEALTH_/);
      expect(careResponse.body.error.code).toMatch(/^CARE_/);
      expect(planResponse.body.error.code).toMatch(/^PLAN_/);
    });

    it('should include journey-specific context in error details', async () => {
      // Get error responses with rich context from each journey
      const healthResponse = await request(app.getHttpServer()).get('/health/goals/conflict').expect(422);
      const careResponse = await request(app.getHttpServer()).get('/care/medications/interaction').expect(422);
      const planResponse = await request(app.getHttpServer()).get('/plan/claims/denied').expect(422);
      
      // Verify journey-specific context in error details
      expect(healthResponse.body.error.details).toHaveProperty('conflictingGoalIds');
      expect(careResponse.body.error.details).toHaveProperty('interactingMedicationIds');
      expect(careResponse.body.error.details).toHaveProperty('severityLevel');
      expect(planResponse.body.error.details).toHaveProperty('denialReason');
      expect(planResponse.body.error.details).toHaveProperty('denialCode');
    });

    it('should map error types to appropriate HTTP status codes across all journeys', async () => {
      // Validation errors (400 Bad Request)
      const healthValidationResponse = await request(app.getHttpServer()).get('/health/metrics/invalid');
      const careValidationResponse = await request(app.getHttpServer()).get('/care/appointments/past-date');
      
      expect(healthValidationResponse.status).toBe(400);
      expect(careValidationResponse.status).toBe(400);
      
      // Business errors (422 Unprocessable Entity)
      const healthBusinessResponse = await request(app.getHttpServer()).get('/health/metrics/not-found');
      const careBusinessResponse = await request(app.getHttpServer()).get('/care/appointments/not-found');
      const planBusinessResponse = await request(app.getHttpServer()).get('/plan/claims/not-found');
      
      expect(healthBusinessResponse.status).toBe(422);
      expect(careBusinessResponse.status).toBe(422);
      expect(planBusinessResponse.status).toBe(422);
      
      // External errors (502 Bad Gateway)
      const healthExternalResponse = await request(app.getHttpServer()).get('/health/metrics/device-error');
      const careExternalResponse = await request(app.getHttpServer()).get('/care/telemedicine/connection-error');
      
      expect(healthExternalResponse.status).toBe(502);
      expect(careExternalResponse.status).toBe(502);
    });
  });
});