import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';
import { APP_FILTER } from '@nestjs/core';
import { ExceptionsFilter } from '../../../../shared/src/exceptions/exceptions.filter';

// Import journey-specific errors
import { Health } from '../../src/journey/health';
import { Care } from '../../src/journey/care';
import { Plan } from '../../src/journey/plan';

// Import error code constants
import {
  HEALTH_INVALID_METRIC,
  HEALTH_DEVICE_CONNECTION_FAILED,
  CARE_PROVIDER_UNAVAILABLE,
  CARE_APPOINTMENT_SLOT_TAKEN,
  PLAN_INVALID_CLAIM_DATA,
  PLAN_COVERAGE_VERIFICATION_FAILED
} from '../../../../shared/src/constants/error-codes.constants';

// Mock controller for testing error handling
class MockController {
  throwHealthMetricError() {
    throw new Health.Metrics.InvalidMetricValueError(
      'Blood pressure reading is outside valid range',
      { metricType: 'bloodPressure', value: '300/200', validRange: '70-180/40-120' }
    );
  }

  throwHealthDeviceError() {
    throw new Health.Devices.DeviceConnectionFailureError(
      'Failed to connect to fitness tracker',
      { deviceId: 'fitbit-123', connectionMethod: 'bluetooth', lastSyncTime: '2023-04-01T10:30:00Z' }
    );
  }

  throwCareAppointmentError() {
    throw new Care.Appointment.AppointmentOverlapError(
      'The requested appointment slot is already taken',
      { providerId: 'provider-456', requestedTime: '2023-04-15T14:00:00Z', availableSlots: ['2023-04-15T15:00:00Z', '2023-04-15T16:00:00Z'] }
    );
  }

  throwCareProviderError() {
    throw new Care.Provider.ProviderUnavailableError(
      'The selected provider is not available for new appointments',
      { providerId: 'provider-789', specialty: 'Cardiology', nextAvailability: '2023-05-10' }
    );
  }

  throwPlanClaimError() {
    throw new Plan.Claims.ClaimValidationError(
      'Claim submission contains invalid data',
      { claimId: 'claim-123', fields: ['serviceDate', 'procedureCode'], validationErrors: ['Date cannot be in the future', 'Invalid procedure code format'] }
    );
  }

  throwPlanCoverageError() {
    throw new Plan.Coverage.ServiceNotCoveredError(
      'The requested service is not covered by your plan',
      { planId: 'plan-456', serviceCode: 'SRV-789', coverageType: 'dental', reason: 'Service excluded from dental coverage' }
    );
  }

  throwAppException() {
    throw new AppException(
      'Generic application error',
      ErrorType.TECHNICAL,
      'SYS_001',
      { source: 'test' }
    );
  }
}

describe('Journey Error Integration', () => {
  let app: INestApplication;
  let mockController: MockController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MockController],
      providers: [
        {
          provide: APP_FILTER,
          useClass: ExceptionsFilter,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    mockController = moduleFixture.get<MockController>(MockController);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Journey Error Integration', () => {
    it('should properly handle and transform Health Metrics errors', async () => {
      // Create a route that throws a Health Metrics error
      app.use('/test/health/metrics', (req, res, next) => {
        try {
          mockController.throwHealthMetricError();
        } catch (error) {
          next(error);
        }
      });

      // Test the error response
      const response = await request(app.getHttpServer())
        .get('/test/health/metrics')
        .expect(HttpStatus.BAD_REQUEST);

      // Verify error structure and content
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(response.body.error).toHaveProperty('code', HEALTH_INVALID_METRIC);
      expect(response.body.error).toHaveProperty('message', 'Blood pressure reading is outside valid range');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('metricType', 'bloodPressure');
      expect(response.body.error.details).toHaveProperty('value', '300/200');
      expect(response.body.error.details).toHaveProperty('validRange', '70-180/40-120');
      expect(response.body.error.details).toHaveProperty('journey', 'health');
    });

    it('should properly handle and transform Health Device errors', async () => {
      // Create a route that throws a Health Device error
      app.use('/test/health/devices', (req, res, next) => {
        try {
          mockController.throwHealthDeviceError();
        } catch (error) {
          next(error);
        }
      });

      // Test the error response
      const response = await request(app.getHttpServer())
        .get('/test/health/devices')
        .expect(HttpStatus.BAD_GATEWAY);

      // Verify error structure and content
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(response.body.error).toHaveProperty('code', HEALTH_DEVICE_CONNECTION_FAILED);
      expect(response.body.error).toHaveProperty('message', 'Failed to connect to fitness tracker');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('deviceId', 'fitbit-123');
      expect(response.body.error.details).toHaveProperty('connectionMethod', 'bluetooth');
      expect(response.body.error.details).toHaveProperty('lastSyncTime', '2023-04-01T10:30:00Z');
      expect(response.body.error.details).toHaveProperty('journey', 'health');
    });
  });

  describe('Care Journey Error Integration', () => {
    it('should properly handle and transform Care Appointment errors', async () => {
      // Create a route that throws a Care Appointment error
      app.use('/test/care/appointments', (req, res, next) => {
        try {
          mockController.throwCareAppointmentError();
        } catch (error) {
          next(error);
        }
      });

      // Test the error response
      const response = await request(app.getHttpServer())
        .get('/test/care/appointments')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Verify error structure and content
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(response.body.error).toHaveProperty('code', CARE_APPOINTMENT_SLOT_TAKEN);
      expect(response.body.error).toHaveProperty('message', 'The requested appointment slot is already taken');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('providerId', 'provider-456');
      expect(response.body.error.details).toHaveProperty('requestedTime', '2023-04-15T14:00:00Z');
      expect(response.body.error.details).toHaveProperty('availableSlots');
      expect(response.body.error.details.availableSlots).toEqual(['2023-04-15T15:00:00Z', '2023-04-15T16:00:00Z']);
      expect(response.body.error.details).toHaveProperty('journey', 'care');
    });

    it('should properly handle and transform Care Provider errors', async () => {
      // Create a route that throws a Care Provider error
      app.use('/test/care/providers', (req, res, next) => {
        try {
          mockController.throwCareProviderError();
        } catch (error) {
          next(error);
        }
      });

      // Test the error response
      const response = await request(app.getHttpServer())
        .get('/test/care/providers')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Verify error structure and content
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(response.body.error).toHaveProperty('code', CARE_PROVIDER_UNAVAILABLE);
      expect(response.body.error).toHaveProperty('message', 'The selected provider is not available for new appointments');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('providerId', 'provider-789');
      expect(response.body.error.details).toHaveProperty('specialty', 'Cardiology');
      expect(response.body.error.details).toHaveProperty('nextAvailability', '2023-05-10');
      expect(response.body.error.details).toHaveProperty('journey', 'care');
    });
  });

  describe('Plan Journey Error Integration', () => {
    it('should properly handle and transform Plan Claim errors', async () => {
      // Create a route that throws a Plan Claim error
      app.use('/test/plan/claims', (req, res, next) => {
        try {
          mockController.throwPlanClaimError();
        } catch (error) {
          next(error);
        }
      });

      // Test the error response
      const response = await request(app.getHttpServer())
        .get('/test/plan/claims')
        .expect(HttpStatus.BAD_REQUEST);

      // Verify error structure and content
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(response.body.error).toHaveProperty('code', PLAN_INVALID_CLAIM_DATA);
      expect(response.body.error).toHaveProperty('message', 'Claim submission contains invalid data');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('claimId', 'claim-123');
      expect(response.body.error.details).toHaveProperty('fields');
      expect(response.body.error.details.fields).toEqual(['serviceDate', 'procedureCode']);
      expect(response.body.error.details).toHaveProperty('validationErrors');
      expect(response.body.error.details.validationErrors).toEqual(['Date cannot be in the future', 'Invalid procedure code format']);
      expect(response.body.error.details).toHaveProperty('journey', 'plan');
    });

    it('should properly handle and transform Plan Coverage errors', async () => {
      // Create a route that throws a Plan Coverage error
      app.use('/test/plan/coverage', (req, res, next) => {
        try {
          mockController.throwPlanCoverageError();
        } catch (error) {
          next(error);
        }
      });

      // Test the error response
      const response = await request(app.getHttpServer())
        .get('/test/plan/coverage')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Verify error structure and content
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(response.body.error).toHaveProperty('code', PLAN_COVERAGE_VERIFICATION_FAILED);
      expect(response.body.error).toHaveProperty('message', 'The requested service is not covered by your plan');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('planId', 'plan-456');
      expect(response.body.error.details).toHaveProperty('serviceCode', 'SRV-789');
      expect(response.body.error.details).toHaveProperty('coverageType', 'dental');
      expect(response.body.error.details).toHaveProperty('reason', 'Service excluded from dental coverage');
      expect(response.body.error.details).toHaveProperty('journey', 'plan');
    });
  });

  describe('Cross-Journey Error Handling', () => {
    it('should preserve journey context in error responses', async () => {
      // Create routes for each journey
      const journeyRoutes = [
        { path: '/test/health/metrics', method: 'throwHealthMetricError', journey: 'health' },
        { path: '/test/care/appointments', method: 'throwCareAppointmentError', journey: 'care' },
        { path: '/test/plan/claims', method: 'throwPlanClaimError', journey: 'plan' }
      ];

      // Set up routes
      journeyRoutes.forEach(route => {
        app.use(route.path, (req, res, next) => {
          try {
            mockController[route.method]();
          } catch (error) {
            next(error);
          }
        });
      });

      // Test each journey route
      for (const route of journeyRoutes) {
        const response = await request(app.getHttpServer()).get(route.path);
        
        // Verify journey context is preserved
        expect(response.body.error.details).toHaveProperty('journey', route.journey);
        
        // Verify error code follows journey-specific naming convention
        expect(response.body.error.code.startsWith(route.journey.toUpperCase())).toBeTruthy();
      }
    });

    it('should map journey-specific errors to appropriate HTTP status codes', async () => {
      // Define test cases with expected status codes
      const testCases = [
        { path: '/test/health/metrics', method: 'throwHealthMetricError', expectedStatus: HttpStatus.BAD_REQUEST },
        { path: '/test/health/devices', method: 'throwHealthDeviceError', expectedStatus: HttpStatus.BAD_GATEWAY },
        { path: '/test/care/appointments', method: 'throwCareAppointmentError', expectedStatus: HttpStatus.UNPROCESSABLE_ENTITY },
        { path: '/test/care/providers', method: 'throwCareProviderError', expectedStatus: HttpStatus.UNPROCESSABLE_ENTITY },
        { path: '/test/plan/claims', method: 'throwPlanClaimError', expectedStatus: HttpStatus.BAD_REQUEST },
        { path: '/test/plan/coverage', method: 'throwPlanCoverageError', expectedStatus: HttpStatus.UNPROCESSABLE_ENTITY }
      ];

      // Set up routes
      testCases.forEach(testCase => {
        app.use(testCase.path, (req, res, next) => {
          try {
            mockController[testCase.method]();
          } catch (error) {
            next(error);
          }
        });
      });

      // Test each case
      for (const testCase of testCases) {
        await request(app.getHttpServer())
          .get(testCase.path)
          .expect(testCase.expectedStatus);
      }
    });

    it('should handle non-journey errors with the base AppException', async () => {
      // Create a route that throws a generic AppException
      app.use('/test/generic-error', (req, res, next) => {
        try {
          mockController.throwAppException();
        } catch (error) {
          next(error);
        }
      });

      // Test the error response
      const response = await request(app.getHttpServer())
        .get('/test/generic-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // Verify error structure and content
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.body.error).toHaveProperty('code', 'SYS_001');
      expect(response.body.error).toHaveProperty('message', 'Generic application error');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('source', 'test');
      
      // Should not have journey context
      expect(response.body.error.details).not.toHaveProperty('journey');
    });
  });

  describe('Error Serialization and Metadata Preservation', () => {
    it('should preserve all error metadata in serialized responses', async () => {
      // Create routes for each journey with detailed error metadata
      const routes = [
        { 
          path: '/test/health/detailed', 
          handler: () => {
            throw new Health.Metrics.InvalidMetricValueError(
              'Invalid health metric value',
              { 
                metricType: 'heartRate', 
                value: 250, 
                validRange: '40-180',
                userId: 'user-123',
                deviceId: 'device-456',
                timestamp: '2023-04-10T12:30:45Z',
                source: 'manual-entry',
                previousValue: 75,
                measurementUnit: 'bpm'
              }
            );
          }
        },
        { 
          path: '/test/care/detailed', 
          handler: () => {
            throw new Care.Telemedicine.TelemedicineConnectionError(
              'Failed to establish telemedicine session',
              { 
                sessionId: 'session-123',
                providerId: 'provider-456',
                patientId: 'patient-789',
                connectionType: 'webrtc',
                errorCode: 'ICE_FAILURE',
                browserInfo: 'Chrome 98.0.4758.102',
                networkQuality: 'poor',
                timestamp: '2023-04-10T14:45:30Z',
                retryCount: 3,
                troubleshootingSteps: ['Check internet connection', 'Allow camera access', 'Restart browser']
              }
            );
          }
        },
        { 
          path: '/test/plan/detailed', 
          handler: () => {
            throw new Plan.Claims.ClaimProcessingError(
              'Claim processing failed',
              { 
                claimId: 'claim-123',
                memberId: 'member-456',
                providerNpi: '1234567890',
                submissionDate: '2023-04-01T10:15:30Z',
                serviceDate: '2023-03-25',
                procedureCodes: ['99213', '85025'],
                diagnosisCodes: ['J20.9', 'I10'],
                claimAmount: 250.75,
                processingStage: 'verification',
                rejectionReason: 'Missing prior authorization',
                resubmissionAllowed: true,
                appealDeadline: '2023-05-01'
              }
            );
          }
        }
      ];

      // Set up routes
      routes.forEach(route => {
        app.use(route.path, (req, res, next) => {
          try {
            route.handler();
          } catch (error) {
            next(error);
          }
        });
      });

      // Test each route and verify all metadata is preserved
      for (const route of routes) {
        const response = await request(app.getHttpServer()).get(route.path);
        
        // Verify response has error structure
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('details');
        
        // For the health route, verify all detailed metadata
        if (route.path === '/test/health/detailed') {
          const details = response.body.error.details;
          expect(details).toHaveProperty('metricType', 'heartRate');
          expect(details).toHaveProperty('value', 250);
          expect(details).toHaveProperty('validRange', '40-180');
          expect(details).toHaveProperty('userId', 'user-123');
          expect(details).toHaveProperty('deviceId', 'device-456');
          expect(details).toHaveProperty('timestamp', '2023-04-10T12:30:45Z');
          expect(details).toHaveProperty('source', 'manual-entry');
          expect(details).toHaveProperty('previousValue', 75);
          expect(details).toHaveProperty('measurementUnit', 'bpm');
          expect(details).toHaveProperty('journey', 'health');
        }
        
        // For the care route, verify all detailed metadata
        if (route.path === '/test/care/detailed') {
          const details = response.body.error.details;
          expect(details).toHaveProperty('sessionId', 'session-123');
          expect(details).toHaveProperty('providerId', 'provider-456');
          expect(details).toHaveProperty('patientId', 'patient-789');
          expect(details).toHaveProperty('connectionType', 'webrtc');
          expect(details).toHaveProperty('errorCode', 'ICE_FAILURE');
          expect(details).toHaveProperty('browserInfo', 'Chrome 98.0.4758.102');
          expect(details).toHaveProperty('networkQuality', 'poor');
          expect(details).toHaveProperty('timestamp', '2023-04-10T14:45:30Z');
          expect(details).toHaveProperty('retryCount', 3);
          expect(details).toHaveProperty('troubleshootingSteps');
          expect(details.troubleshootingSteps).toEqual(['Check internet connection', 'Allow camera access', 'Restart browser']);
          expect(details).toHaveProperty('journey', 'care');
        }
        
        // For the plan route, verify all detailed metadata
        if (route.path === '/test/plan/detailed') {
          const details = response.body.error.details;
          expect(details).toHaveProperty('claimId', 'claim-123');
          expect(details).toHaveProperty('memberId', 'member-456');
          expect(details).toHaveProperty('providerNpi', '1234567890');
          expect(details).toHaveProperty('submissionDate', '2023-04-01T10:15:30Z');
          expect(details).toHaveProperty('serviceDate', '2023-03-25');
          expect(details).toHaveProperty('procedureCodes');
          expect(details.procedureCodes).toEqual(['99213', '85025']);
          expect(details).toHaveProperty('diagnosisCodes');
          expect(details.diagnosisCodes).toEqual(['J20.9', 'I10']);
          expect(details).toHaveProperty('claimAmount', 250.75);
          expect(details).toHaveProperty('processingStage', 'verification');
          expect(details).toHaveProperty('rejectionReason', 'Missing prior authorization');
          expect(details).toHaveProperty('resubmissionAllowed', true);
          expect(details).toHaveProperty('appealDeadline', '2023-05-01');
          expect(details).toHaveProperty('journey', 'plan');
        }
      }
    });
  });
});