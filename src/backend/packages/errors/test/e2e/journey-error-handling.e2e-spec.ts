import { INestApplication, Controller, Get, Query, Module, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { ErrorsModule } from '../../src/nest/module';
import { ErrorType } from '../../src/types';
import { BaseError } from '../../src/base';
import { WithErrorContext } from '../../src/decorators/error-context.decorator';

// Import journey-specific errors
import * as Health from '../../src/journey/health';
import * as Care from '../../src/journey/care';
import * as Plan from '../../src/journey/plan';

/**
 * Controller that throws Health journey-specific errors
 */
@Controller('health')
class HealthErrorsController {
  @Get('metrics')
  @WithErrorContext({ journey: 'Health', feature: 'Metrics' })
  getMetricsError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'validation':
        throw new Health.Metrics.InvalidMetricValueError('heart_rate', '300', 'Value exceeds maximum (220)');
      case 'business':
        throw new Health.Metrics.MetricThresholdExceededError('blood_pressure', '180/120', 'Hypertensive crisis');
      case 'technical':
        throw new Health.Metrics.MetricStorageError('Failed to store health metric', 'DATABASE_ERROR');
      case 'external':
        throw new Health.Devices.DeviceConnectionFailureError('Fitbit', 'Authentication failed with external service');
      default:
        return { success: true, journey: 'Health' };
    }
  }

  @Get('goals')
  @WithErrorContext({ journey: 'Health', feature: 'Goals' })
  getGoalsError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'validation':
        throw new Health.Goals.InvalidGoalParametersError('steps', '100000', 'Daily goal is unrealistically high');
      case 'business':
        throw new Health.Goals.ConflictingGoalsError('Current goal conflicts with existing active goal');
      default:
        return { success: true, journey: 'Health', feature: 'Goals' };
    }
  }

  @Get('fhir')
  @WithErrorContext({ journey: 'Health', feature: 'FHIR' })
  getFhirError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'external':
        throw new Health.FHIR.FhirConnectionFailureError('https://fhir.example.org/Patient/123', 'Failed to connect to FHIR server');
      case 'validation':
        throw new Health.FHIR.InvalidResourceError('Patient', 'Missing required fields: name, birthDate');
      default:
        return { success: true, journey: 'Health', feature: 'FHIR' };
    }
  }
}

/**
 * Controller that throws Care journey-specific errors
 */
@Controller('care')
class CareErrorsController {
  @Get('appointments')
  @WithErrorContext({ journey: 'Care', feature: 'Appointments' })
  getAppointmentsError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'validation':
        throw new Care.AppointmentDateInPastError(new Date('2023-01-01'));
      case 'business':
        throw new Care.AppointmentOverlapError('You already have an appointment scheduled at this time');
      case 'technical':
        throw new Care.AppointmentPersistenceError('Failed to save appointment', 'DATABASE_ERROR');
      case 'external':
        throw new Care.AppointmentCalendarSyncError('Failed to sync with provider calendar', 'EXTERNAL_API_ERROR');
      default:
        return { success: true, journey: 'Care', feature: 'Appointments' };
    }
  }

  @Get('telemedicine')
  @WithErrorContext({ journey: 'Care', feature: 'Telemedicine' })
  getTelemedicineError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'technical':
        throw new Care.TelemedicineConnectionError('WebRTC connection failed', 'ICE_NEGOTIATION_FAILED');
      case 'external':
        throw new Care.TelemedicineServiceError('Video provider service unavailable', 'SERVICE_UNAVAILABLE');
      default:
        return { success: true, journey: 'Care', feature: 'Telemedicine' };
    }
  }

  @Get('medications')
  @WithErrorContext({ journey: 'Care', feature: 'Medications' })
  getMedicationsError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'business':
        throw new Care.MedicationInteractionError('Potential interaction detected with current medications', [
          { name: 'Warfarin', interactionSeverity: 'high' },
          { name: 'Aspirin', interactionSeverity: 'high' }
        ]);
      case 'validation':
        throw new Care.MedicationDosageError('Invalid dosage: 500mg exceeds maximum recommended dose of 250mg');
      default:
        return { success: true, journey: 'Care', feature: 'Medications' };
    }
  }
}

/**
 * Controller that throws Plan journey-specific errors
 */
@Controller('plan')
class PlanErrorsController {
  @Get('claims')
  @WithErrorContext({ journey: 'Plan', feature: 'Claims' })
  getClaimsError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'validation':
        throw new Plan.Claims.ClaimValidationError('Missing required documentation for claim');
      case 'business':
        throw new Plan.Claims.DuplicateClaimError('A claim for this service on this date already exists');
      case 'technical':
        throw new Plan.Claims.ClaimPersistenceError('Failed to save claim', 'DATABASE_ERROR');
      case 'external':
        throw new Plan.Claims.ClaimProcessingApiError('Insurance provider API unavailable', 'EXTERNAL_API_ERROR');
      default:
        return { success: true, journey: 'Plan', feature: 'Claims' };
    }
  }

  @Get('benefits')
  @WithErrorContext({ journey: 'Plan', feature: 'Benefits' })
  getBenefitsError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'business':
        throw new Plan.Benefits.BenefitNotCoveredError('This service is not covered by your current plan');
      case 'validation':
        throw new Plan.Benefits.BenefitEligibilityError('You are not eligible for this benefit until 2024-01-01');
      default:
        return { success: true, journey: 'Plan', feature: 'Benefits' };
    }
  }

  @Get('coverage')
  @WithErrorContext({ journey: 'Plan', feature: 'Coverage' })
  getCoverageError(@Query('type') errorType: string) {
    switch (errorType) {
      case 'business':
        throw new Plan.Coverage.ServiceNotCoveredError('Physical therapy is not covered by your current plan');
      case 'external':
        throw new Plan.Coverage.CoverageApiIntegrationError('Failed to verify coverage with insurance provider', 'API_TIMEOUT');
      default:
        return { success: true, journey: 'Plan', feature: 'Coverage' };
    }
  }
}

/**
 * Custom error for testing generic journey error handling
 */
class GenericJourneyError extends BaseError {
  constructor(journey: string, feature: string, message: string, type: ErrorType) {
    super({
      message,
      type,
      code: `${journey.toUpperCase()}_${feature.toUpperCase()}_ERROR`,
      statusCode: type === ErrorType.VALIDATION ? HttpStatus.BAD_REQUEST : 
                 type === ErrorType.BUSINESS ? HttpStatus.UNPROCESSABLE_ENTITY :
                 type === ErrorType.EXTERNAL ? HttpStatus.BAD_GATEWAY :
                 HttpStatus.INTERNAL_SERVER_ERROR,
      context: {
        journey,
        feature
      }
    });
  }
}

/**
 * Controller for testing generic journey error handling
 */
@Controller('generic')
class GenericJourneyErrorsController {
  @Get('error')
  getGenericJourneyError(
    @Query('journey') journey: string = 'unknown',
    @Query('feature') feature: string = 'unknown',
    @Query('type') errorType: string = 'business'
  ) {
    const type = errorType === 'validation' ? ErrorType.VALIDATION :
                errorType === 'business' ? ErrorType.BUSINESS :
                errorType === 'external' ? ErrorType.EXTERNAL :
                ErrorType.TECHNICAL;
                
    throw new GenericJourneyError(
      journey, 
      feature, 
      `Error in ${journey} journey, ${feature} feature`, 
      type
    );
  }
}

/**
 * Test module with controllers for journey-specific errors
 */
@Module({
  imports: [ErrorsModule.forRoot()],
  controllers: [
    HealthErrorsController,
    CareErrorsController,
    PlanErrorsController,
    GenericJourneyErrorsController
  ]
})
class JourneyErrorsTestModule {}

describe('Journey Error Handling (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JourneyErrorsTestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Journey Errors', () => {
    it('should handle Health Metrics validation errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/metrics?type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('validation');
      expect(response.body.error.code).toMatch(/^HEALTH_METRICS_/);
      expect(response.body.error.message).toContain('heart_rate');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Health');
      expect(response.body.error.context.feature).toBe('Metrics');
    });

    it('should handle Health Metrics business errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/metrics?type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('business');
      expect(response.body.error.code).toMatch(/^HEALTH_METRICS_/);
      expect(response.body.error.message).toContain('blood_pressure');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Health');
      expect(response.body.error.context.feature).toBe('Metrics');
    });

    it('should handle Health Goals errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/goals?type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('validation');
      expect(response.body.error.code).toMatch(/^HEALTH_GOALS_/);
      expect(response.body.error.message).toContain('steps');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Health');
      expect(response.body.error.context.feature).toBe('Goals');
    });

    it('should handle Health FHIR external errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/fhir?type=external')
        .expect(HttpStatus.BAD_GATEWAY);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('external');
      expect(response.body.error.code).toMatch(/^HEALTH_FHIR_/);
      expect(response.body.error.message).toContain('FHIR server');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Health');
      expect(response.body.error.context.feature).toBe('FHIR');
    });
  });

  describe('Care Journey Errors', () => {
    it('should handle Care Appointments validation errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/appointments?type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('validation');
      expect(response.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
      expect(response.body.error.message).toContain('past');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Care');
      expect(response.body.error.context.feature).toBe('Appointments');
    });

    it('should handle Care Appointments business errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/appointments?type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('business');
      expect(response.body.error.code).toMatch(/^CARE_APPOINTMENT_/);
      expect(response.body.error.message).toContain('overlap');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Care');
      expect(response.body.error.context.feature).toBe('Appointments');
    });

    it('should handle Care Telemedicine technical errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/telemedicine?type=technical')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('technical');
      expect(response.body.error.code).toMatch(/^CARE_TELEMEDICINE_/);
      expect(response.body.error.message).toContain('WebRTC');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Care');
      expect(response.body.error.context.feature).toBe('Telemedicine');
    });

    it('should handle Care Medications business errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/medications?type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('business');
      expect(response.body.error.code).toMatch(/^CARE_MEDICATION_/);
      expect(response.body.error.message).toContain('interaction');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Care');
      expect(response.body.error.context.feature).toBe('Medications');
      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.details).toContainEqual(expect.objectContaining({
        name: 'Warfarin',
        interactionSeverity: 'high'
      }));
    });
  });

  describe('Plan Journey Errors', () => {
    it('should handle Plan Claims validation errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/claims?type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('validation');
      expect(response.body.error.code).toMatch(/^PLAN_CLAIMS_/);
      expect(response.body.error.message).toContain('documentation');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Plan');
      expect(response.body.error.context.feature).toBe('Claims');
    });

    it('should handle Plan Claims business errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/claims?type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('business');
      expect(response.body.error.code).toMatch(/^PLAN_CLAIMS_/);
      expect(response.body.error.message).toContain('duplicate');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Plan');
      expect(response.body.error.context.feature).toBe('Claims');
    });

    it('should handle Plan Benefits business errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/benefits?type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('business');
      expect(response.body.error.code).toMatch(/^PLAN_BENEFITS_/);
      expect(response.body.error.message).toContain('not covered');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Plan');
      expect(response.body.error.context.feature).toBe('Benefits');
    });

    it('should handle Plan Coverage external errors with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/coverage?type=external')
        .expect(HttpStatus.BAD_GATEWAY);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('external');
      expect(response.body.error.code).toMatch(/^PLAN_COVERAGE_/);
      expect(response.body.error.message).toContain('insurance provider');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Plan');
      expect(response.body.error.context.feature).toBe('Coverage');
    });
  });

  describe('Generic Journey Error Handling', () => {
    it('should handle errors from any journey with proper context', async () => {
      const response = await request(app.getHttpServer())
        .get('/generic/error?journey=Nutrition&feature=Recipes&type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('business');
      expect(response.body.error.code).toBe('NUTRITION_RECIPES_ERROR');
      expect(response.body.error.message).toContain('Nutrition journey');
      expect(response.body.error.context).toBeDefined();
      expect(response.body.error.context.journey).toBe('Nutrition');
      expect(response.body.error.context.feature).toBe('Recipes');
    });

    it('should map error types to appropriate HTTP status codes', async () => {
      // Validation error -> 400 Bad Request
      await request(app.getHttpServer())
        .get('/generic/error?journey=Test&feature=Validation&type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      // Business error -> 422 Unprocessable Entity
      await request(app.getHttpServer())
        .get('/generic/error?journey=Test&feature=Business&type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Technical error -> 500 Internal Server Error
      await request(app.getHttpServer())
        .get('/generic/error?journey=Test&feature=Technical&type=technical')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // External error -> 502 Bad Gateway
      await request(app.getHttpServer())
        .get('/generic/error?journey=Test&feature=External&type=external')
        .expect(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('Error Code Conventions', () => {
    it('should use HEALTH_ prefix for Health journey error codes', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/metrics?type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error.code).toMatch(/^HEALTH_/);
    });

    it('should use CARE_ prefix for Care journey error codes', async () => {
      const response = await request(app.getHttpServer())
        .get('/care/appointments?type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error.code).toMatch(/^CARE_/);
    });

    it('should use PLAN_ prefix for Plan journey error codes', async () => {
      const response = await request(app.getHttpServer())
        .get('/plan/claims?type=validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error.code).toMatch(/^PLAN_/);
    });
  });

  describe('Error Context and Client-Friendly Messaging', () => {
    it('should include journey context in all error responses', async () => {
      // Health journey
      const healthResponse = await request(app.getHttpServer())
        .get('/health/metrics?type=validation')
        .expect(HttpStatus.BAD_REQUEST);
      
      expect(healthResponse.body.error.context.journey).toBe('Health');
      
      // Care journey
      const careResponse = await request(app.getHttpServer())
        .get('/care/appointments?type=validation')
        .expect(HttpStatus.BAD_REQUEST);
      
      expect(careResponse.body.error.context.journey).toBe('Care');
      
      // Plan journey
      const planResponse = await request(app.getHttpServer())
        .get('/plan/claims?type=validation')
        .expect(HttpStatus.BAD_REQUEST);
      
      expect(planResponse.body.error.context.journey).toBe('Plan');
    });

    it('should provide user-friendly error messages with context', async () => {
      // Health journey - business error with context
      const healthResponse = await request(app.getHttpServer())
        .get('/health/metrics?type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
      
      expect(healthResponse.body.error.message).toContain('blood_pressure');
      expect(healthResponse.body.error.message).toContain('Hypertensive crisis');
      
      // Care journey - business error with context
      const careResponse = await request(app.getHttpServer())
        .get('/care/medications?type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
      
      expect(careResponse.body.error.message).toContain('interaction');
      expect(careResponse.body.error.details).toBeDefined();
      
      // Plan journey - business error with context
      const planResponse = await request(app.getHttpServer())
        .get('/plan/benefits?type=business')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
      
      expect(planResponse.body.error.message).toContain('not covered');
      expect(planResponse.body.error.message).toContain('current plan');
    });
  });
});