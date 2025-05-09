import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ErrorType, AppException } from '@austa/errors';
import * as Health from '@austa/errors/journey/health';
import * as Care from '@austa/errors/journey/care';
import * as Plan from '@austa/errors/journey/plan';
import { 
  createTestErrorResponse,
  assertErrorHasJourneyContext,
  assertErrorCodePattern,
  assertProperHttpStatusCode,
  assertErrorMetadataPreserved
} from '../helpers/assertion-helpers';
import { 
  mockErrorHandler,
  MockErrorHandlerService 
} from '../helpers/mock-error-handler';
import {
  HEALTH_INVALID_METRIC,
  CARE_APPOINTMENT_SLOT_TAKEN,
  PLAN_INVALID_CLAIM_DATA,
  HEALTH_DEVICE_CONNECTION_FAILED,
  CARE_TELEMEDICINE_CONNECTION_FAILED,
  PLAN_COVERAGE_VERIFICATION_FAILED
} from '@austa/errors/constants';

describe('Journey Error Integration', () => {
  let module: TestingModule;
  let errorHandler: MockErrorHandlerService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [mockErrorHandler],
    }).compile();

    errorHandler = module.get<MockErrorHandlerService>(MockErrorHandlerService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Health Journey Error Integration', () => {
    describe('Metrics Error Handling', () => {
      it('should properly classify InvalidMetricValueError as a validation error', () => {
        // Arrange
        const metricError = new Health.Metrics.InvalidMetricValueError(
          'Blood pressure reading is outside valid range',
          { metricType: 'bloodPressure', value: '300/200', validRange: '90-180/60-120' }
        );

        // Act
        const result = errorHandler.handleError(metricError);

        // Assert
        expect(result.error.type).toBe(ErrorType.VALIDATION);
        expect(result.error.code).toBe(HEALTH_INVALID_METRIC);
        expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      });

      it('should preserve metric-specific context in error response', () => {
        // Arrange
        const metricContext = { 
          metricType: 'heartRate', 
          value: 250, 
          validRange: '40-180', 
          userId: '12345' 
        };
        const metricError = new Health.Metrics.InvalidMetricValueError(
          'Heart rate reading is outside valid range',
          metricContext
        );

        // Act
        const result = errorHandler.handleError(metricError);

        // Assert
        expect(result.error.details).toMatchObject({
          metricType: 'heartRate',
          value: 250,
          validRange: '40-180'
        });
        // Ensure user ID is not exposed in the error details
        expect(result.error.details.userId).toBeUndefined();
      });
    });

    describe('Device Error Handling', () => {
      it('should properly classify DeviceConnectionFailureError as an external error', () => {
        // Arrange
        const deviceError = new Health.Devices.DeviceConnectionFailureError(
          'Failed to connect to fitness tracker',
          { deviceId: 'fitbit-123', connectionState: 'timeout', lastSyncTimestamp: new Date().toISOString() }
        );

        // Act
        const result = errorHandler.handleError(deviceError);

        // Assert
        expect(result.error.type).toBe(ErrorType.EXTERNAL);
        expect(result.error.code).toMatch(/^HEALTH_DEVICES_/);
        expect(result.statusCode).toBe(HttpStatus.BAD_GATEWAY);
      });

      it('should include troubleshooting steps in device error responses', () => {
        // Arrange
        const deviceError = new Health.Devices.DeviceConnectionFailureError(
          'Failed to connect to fitness tracker',
          { 
            deviceId: 'fitbit-123', 
            connectionState: 'timeout', 
            troubleshootingSteps: [
              'Ensure Bluetooth is enabled',
              'Move closer to the device',
              'Restart the device'
            ]
          }
        );

        // Act
        const result = errorHandler.handleError(deviceError);

        // Assert
        expect(result.error.details.troubleshootingSteps).toBeInstanceOf(Array);
        expect(result.error.details.troubleshootingSteps).toHaveLength(3);
      });
    });

    describe('FHIR Integration Error Handling', () => {
      it('should properly handle FHIR resource errors with healthcare context', () => {
        // Arrange
        const fhirError = new Health.FHIR.InvalidResourceError(
          'Invalid FHIR Patient resource',
          { 
            resourceType: 'Patient', 
            validationErrors: ['Missing required field: gender'],
            operationType: 'create'
          }
        );

        // Act
        const result = errorHandler.handleError(fhirError);

        // Assert
        expect(result.error.type).toBe(ErrorType.VALIDATION);
        expect(result.error.code).toMatch(/^HEALTH_FHIR_/);
        expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(result.error.details.resourceType).toBe('Patient');
      });
    });
  });

  describe('Care Journey Error Integration', () => {
    describe('Appointment Error Handling', () => {
      it('should properly classify AppointmentOverlapError as a business error', () => {
        // Arrange
        const appointmentError = new Care.AppointmentOverlapError(
          'The requested appointment time overlaps with an existing appointment',
          { 
            requestedTime: '2023-05-15T14:00:00Z', 
            existingAppointmentId: 'appt-456',
            providerId: 'provider-789'
          }
        );

        // Act
        const result = errorHandler.handleError(appointmentError);

        // Assert
        expect(result.error.type).toBe(ErrorType.BUSINESS);
        expect(result.error.code).toBe(CARE_APPOINTMENT_SLOT_TAKEN);
        expect(result.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });

      it('should include alternative appointment slots in error response', () => {
        // Arrange
        const alternativeSlots = [
          '2023-05-15T15:00:00Z',
          '2023-05-15T16:00:00Z',
          '2023-05-16T10:00:00Z'
        ];
        
        const appointmentError = new Care.AppointmentOverlapError(
          'The requested appointment time overlaps with an existing appointment',
          { 
            requestedTime: '2023-05-15T14:00:00Z', 
            existingAppointmentId: 'appt-456',
            providerId: 'provider-789',
            alternativeSlots
          }
        );

        // Act
        const result = errorHandler.handleError(appointmentError);

        // Assert
        expect(result.error.details.alternativeSlots).toEqual(alternativeSlots);
      });
    });

    describe('Telemedicine Error Handling', () => {
      it('should properly classify TelemedicineConnectionError as a technical error', () => {
        // Arrange
        const teleMedError = new Care.TelemedicineConnectionError(
          'Failed to establish WebRTC connection for telemedicine session',
          { 
            sessionId: 'tele-123', 
            errorCode: 'ICE_FAILURE',
            connectionState: 'failed'
          }
        );

        // Act
        const result = errorHandler.handleError(teleMedError);

        // Assert
        expect(result.error.type).toBe(ErrorType.TECHNICAL);
        expect(result.error.code).toMatch(/^CARE_TELEMEDICINE_/);
        expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      });

      it('should include network diagnostics in telemedicine error responses', () => {
        // Arrange
        const networkDiagnostics = {
          connectionType: 'wifi',
          signalStrength: 'weak',
          bandwidthMbps: 1.2,
          packetLoss: '15%'
        };
        
        const teleMedError = new Care.TelemedicineConnectionError(
          'Failed to establish WebRTC connection for telemedicine session',
          { 
            sessionId: 'tele-123', 
            errorCode: 'ICE_FAILURE',
            connectionState: 'failed',
            networkDiagnostics
          }
        );

        // Act
        const result = errorHandler.handleError(teleMedError);

        // Assert
        expect(result.error.details.networkDiagnostics).toMatchObject(networkDiagnostics);
      });
    });

    describe('Medication Error Handling', () => {
      it('should properly classify MedicationInteractionError as a business error', () => {
        // Arrange
        const medicationError = new Care.MedicationInteractionError(
          'Potential dangerous interaction detected between medications',
          { 
            medications: ['med-123', 'med-456'],
            interactionSeverity: 'high',
            interactionDescription: 'Risk of increased sedation and respiratory depression'
          }
        );

        // Act
        const result = errorHandler.handleError(medicationError);

        // Assert
        expect(result.error.type).toBe(ErrorType.BUSINESS);
        expect(result.error.code).toMatch(/^CARE_MEDICATION_/);
        expect(result.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });
    });
  });

  describe('Plan Journey Error Integration', () => {
    describe('Claims Error Handling', () => {
      it('should properly classify ClaimValidationError as a validation error', () => {
        // Arrange
        const claimError = new Plan.Claims.ClaimValidationError(
          'Claim submission contains invalid data',
          { 
            claimId: 'claim-123',
            validationErrors: ['Missing required field: serviceDate', 'Invalid provider ID format']
          }
        );

        // Act
        const result = errorHandler.handleError(claimError);

        // Assert
        expect(result.error.type).toBe(ErrorType.VALIDATION);
        expect(result.error.code).toBe(PLAN_INVALID_CLAIM_DATA);
        expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      });

      it('should include detailed validation errors in claim error responses', () => {
        // Arrange
        const validationErrors = [
          'Missing required field: serviceDate',
          'Invalid provider ID format',
          'Claim amount exceeds maximum allowed'
        ];
        
        const claimError = new Plan.Claims.ClaimValidationError(
          'Claim submission contains invalid data',
          { 
            claimId: 'claim-123',
            validationErrors
          }
        );

        // Act
        const result = errorHandler.handleError(claimError);

        // Assert
        expect(result.error.details.validationErrors).toEqual(validationErrors);
      });
    });

    describe('Coverage Error Handling', () => {
      it('should properly classify ServiceNotCoveredError as a business error', () => {
        // Arrange
        const coverageError = new Plan.Coverage.ServiceNotCoveredError(
          'The requested service is not covered by your plan',
          { 
            serviceCode: 'SVC-123',
            planId: 'plan-456',
            serviceDescription: 'Experimental treatment'
          }
        );

        // Act
        const result = errorHandler.handleError(coverageError);

        // Assert
        expect(result.error.type).toBe(ErrorType.BUSINESS);
        expect(result.error.code).toMatch(/^PLAN_COVERAGE_/);
        expect(result.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });

      it('should include coverage details in error responses', () => {
        // Arrange
        const coverageError = new Plan.Coverage.ServiceNotCoveredError(
          'The requested service is not covered by your plan',
          { 
            serviceCode: 'SVC-123',
            planId: 'plan-456',
            serviceDescription: 'Experimental treatment',
            coverageDetails: {
              planName: 'Premium Health Plan',
              coverageLevel: 'standard',
              effectiveDate: '2023-01-01',
              expirationDate: '2023-12-31'
            }
          }
        );

        // Act
        const result = errorHandler.handleError(coverageError);

        // Assert
        expect(result.error.details.coverageDetails).toBeDefined();
        expect(result.error.details.coverageDetails.planName).toBe('Premium Health Plan');
      });
    });

    describe('Document Error Handling', () => {
      it('should properly classify DocumentFormatError as a validation error', () => {
        // Arrange
        const documentError = new Plan.Documents.DocumentFormatError(
          'Uploaded document has an unsupported format',
          { 
            fileName: 'claim_receipt.exe',
            providedFormat: 'exe',
            supportedFormats: ['pdf', 'jpg', 'png']
          }
        );

        // Act
        const result = errorHandler.handleError(documentError);

        // Assert
        expect(result.error.type).toBe(ErrorType.VALIDATION);
        expect(result.error.code).toMatch(/^PLAN_DOCUMENTS_/);
        expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('Cross-Journey Error Integration', () => {
    it('should support internationalization of error messages', () => {
      // Arrange - create an error with i18n key
      const healthError = new Health.Metrics.InvalidMetricValueError(
        'errors.health.metrics.invalid_value',
        { 
          metricType: 'bloodPressure', 
          value: '300/200', 
          validRange: '90-180/60-120',
          i18n: true,
          i18nParams: { metric: 'bloodPressure', value: '300/200', range: '90-180/60-120' }
        }
      );
      
      // Act
      const result = errorHandler.handleErrorWithI18n(healthError, 'en-US');
      const spanishResult = errorHandler.handleErrorWithI18n(healthError, 'es-ES');

      // Assert
      expect(result.error.message).not.toBe('errors.health.metrics.invalid_value');
      expect(result.error.message).toContain('Blood pressure');
      expect(spanishResult.error.message).toContain('presión arterial');
      
      // Original error code and type should be preserved
      expect(result.error.code).toBe(HEALTH_INVALID_METRIC);
      expect(result.error.type).toBe(ErrorType.VALIDATION);
      
      // i18n parameters should be included in the details
      expect(result.error.details.i18nParams).toMatchObject({
        metric: 'bloodPressure',
        value: '300/200',
        range: '90-180/60-120'
      });
    });
    
    it('should maintain consistent error structure across all journeys', () => {
      // Arrange
      const healthError = new Health.Metrics.InvalidMetricValueError(
        'Blood pressure reading is outside valid range',
        { metricType: 'bloodPressure', value: '300/200', validRange: '90-180/60-120' }
      );
      
      const careError = new Care.AppointmentOverlapError(
        'The requested appointment time overlaps with an existing appointment',
        { requestedTime: '2023-05-15T14:00:00Z', existingAppointmentId: 'appt-456' }
      );
      
      const planError = new Plan.Claims.ClaimValidationError(
        'Claim submission contains invalid data',
        { claimId: 'claim-123', validationErrors: ['Missing required field: serviceDate'] }
      );

      // Act
      const healthResult = errorHandler.handleError(healthError);
      const careResult = errorHandler.handleError(careError);
      const planResult = errorHandler.handleError(planError);

      // Assert - all should have the same structure
      const expectedKeys = ['error', 'statusCode'];
      const expectedErrorKeys = ['type', 'code', 'message', 'details'];
      
      [healthResult, careResult, planResult].forEach(result => {
        expect(Object.keys(result)).toEqual(expect.arrayContaining(expectedKeys));
        expect(Object.keys(result.error)).toEqual(expect.arrayContaining(expectedErrorKeys));
      });
    });

    it('should properly identify journey context in error responses', () => {
      // Arrange
      const healthError = new Health.Metrics.InvalidMetricValueError(
        'Blood pressure reading is outside valid range',
        { metricType: 'bloodPressure', value: '300/200', validRange: '90-180/60-120' }
      );
      
      const careError = new Care.AppointmentOverlapError(
        'The requested appointment time overlaps with an existing appointment',
        { requestedTime: '2023-05-15T14:00:00Z', existingAppointmentId: 'appt-456' }
      );
      
      const planError = new Plan.Claims.ClaimValidationError(
        'Claim submission contains invalid data',
        { claimId: 'claim-123', validationErrors: ['Missing required field: serviceDate'] }
      );

      // Act
      const healthResult = errorHandler.handleError(healthError);
      const careResult = errorHandler.handleError(careError);
      const planResult = errorHandler.handleError(planError);

      // Assert
      expect(healthResult.error.code).toMatch(/^HEALTH_/);
      expect(careResult.error.code).toMatch(/^CARE_/);
      expect(planResult.error.code).toMatch(/^PLAN_/);
      
      // Use custom assertion helper
      assertErrorHasJourneyContext(healthResult, 'health');
      assertErrorHasJourneyContext(careResult, 'care');
      assertErrorHasJourneyContext(planResult, 'plan');
    });

    it('should follow consistent error code naming conventions across journeys', () => {
      // Arrange
      const healthError = new Health.Metrics.InvalidMetricValueError(
        'Blood pressure reading is outside valid range',
        { metricType: 'bloodPressure', value: '300/200', validRange: '90-180/60-120' }
      );
      
      const careError = new Care.AppointmentOverlapError(
        'The requested appointment time overlaps with an existing appointment',
        { requestedTime: '2023-05-15T14:00:00Z', existingAppointmentId: 'appt-456' }
      );
      
      const planError = new Plan.Claims.ClaimValidationError(
        'Claim submission contains invalid data',
        { claimId: 'claim-123', validationErrors: ['Missing required field: serviceDate'] }
      );

      // Act
      const healthResult = errorHandler.handleError(healthError);
      const careResult = errorHandler.handleError(careError);
      const planResult = errorHandler.handleError(planError);

      // Assert - use custom assertion helper
      assertErrorCodePattern(healthResult.error.code, 'HEALTH');
      assertErrorCodePattern(careResult.error.code, 'CARE');
      assertErrorCodePattern(planResult.error.code, 'PLAN');
    });
  });

  describe('Error Propagation and Handling', () => {
    it('should preserve journey context when errors are propagated through services', () => {
      // Arrange - simulate error propagation through multiple services
      const originalError = new Health.Metrics.InvalidMetricValueError(
        'Blood pressure reading is outside valid range',
        { metricType: 'bloodPressure', value: '300/200', validRange: '90-180/60-120' }
      );
      
      // Simulate error being caught and re-thrown with additional context
      const propagatedError = new AppException(
        'Error processing health data',
        ErrorType.TECHNICAL,
        'SYS_PROCESSING_ERROR',
        { serviceName: 'data-processor', operationId: 'process-123' },
        originalError // Original error as cause
      );

      // Act
      const result = errorHandler.handleErrorWithCause(propagatedError);

      // Assert
      expect(result.error.type).toBe(ErrorType.TECHNICAL);
      expect(result.error.code).toBe('SYS_PROCESSING_ERROR');
      expect(result.error.cause).toBeDefined();
      expect(result.error.cause.code).toBe(HEALTH_INVALID_METRIC);
      expect(result.error.cause.details.metricType).toBe('bloodPressure');
      
      // Use custom assertion helper
      assertErrorMetadataPreserved(result, originalError);
    });
    
    it('should preserve journey-specific metadata across service boundaries', () => {
      // Arrange - simulate errors crossing service boundaries
      const healthMetadata = { 
        metricType: 'bloodPressure', 
        value: '300/200', 
        validRange: '90-180/60-120',
        userId: 'user-123',
        deviceId: 'device-456'
      };
      
      const healthError = new Health.Metrics.InvalidMetricValueError(
        'Blood pressure reading is outside valid range',
        healthMetadata
      );
      
      // Simulate API Gateway wrapping the error from Health Service
      const gatewayError = new AppException(
        'Error processing request',
        ErrorType.TECHNICAL,
        'API_GATEWAY_ERROR',
        { 
          path: '/api/health/metrics',
          method: 'POST',
          requestId: 'req-789'
        },
        healthError // Original error as cause
      );

      // Act
      const result = errorHandler.handleErrorWithCause(gatewayError);

      // Assert
      expect(result.error.type).toBe(ErrorType.TECHNICAL);
      expect(result.error.code).toBe('API_GATEWAY_ERROR');
      expect(result.error.cause).toBeDefined();
      
      // Journey-specific metadata should be preserved
      expect(result.error.cause.details.metricType).toBe('bloodPressure');
      expect(result.error.cause.details.value).toBe('300/200');
      expect(result.error.cause.details.validRange).toBe('90-180/60-120');
      
      // Sensitive data should be excluded
      expect(result.error.cause.details.userId).toBeUndefined();
      expect(result.error.cause.details.deviceId).toBeUndefined();
    });

    it('should map journey-specific errors to appropriate HTTP status codes', () => {
      // Arrange
      const validationError = new Health.Metrics.InvalidMetricValueError(
        'Blood pressure reading is outside valid range',
        { metricType: 'bloodPressure', value: '300/200', validRange: '90-180/60-120' }
      );
      
      const businessError = new Care.AppointmentOverlapError(
        'The requested appointment time overlaps with an existing appointment',
        { requestedTime: '2023-05-15T14:00:00Z', existingAppointmentId: 'appt-456' }
      );
      
      const technicalError = new Care.TelemedicineConnectionError(
        'Failed to establish WebRTC connection for telemedicine session',
        { sessionId: 'tele-123', errorCode: 'ICE_FAILURE' }
      );
      
      const externalError = new Health.Devices.DeviceConnectionFailureError(
        'Failed to connect to fitness tracker',
        { deviceId: 'fitbit-123', connectionState: 'timeout' }
      );

      // Act
      const validationResult = errorHandler.handleError(validationError);
      const businessResult = errorHandler.handleError(businessError);
      const technicalResult = errorHandler.handleError(technicalError);
      const externalResult = errorHandler.handleError(externalError);

      // Assert
      assertProperHttpStatusCode(validationResult, HttpStatus.BAD_REQUEST);
      assertProperHttpStatusCode(businessResult, HttpStatus.UNPROCESSABLE_ENTITY);
      assertProperHttpStatusCode(technicalResult, HttpStatus.INTERNAL_SERVER_ERROR);
      assertProperHttpStatusCode(externalResult, HttpStatus.BAD_GATEWAY);
    });

    it('should create client-friendly error responses with journey context', () => {
      // Arrange
      const healthError = new Health.Metrics.InvalidMetricValueError(
        'Blood pressure reading is outside valid range',
        { metricType: 'bloodPressure', value: '300/200', validRange: '90-180/60-120' }
      );

      // Act
      const clientResponse = createTestErrorResponse(healthError);

      // Assert
      expect(clientResponse).toHaveProperty('error');
      expect(clientResponse.error).toHaveProperty('message', 'Blood pressure reading is outside valid range');
      expect(clientResponse.error).toHaveProperty('code', HEALTH_INVALID_METRIC);
      expect(clientResponse.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(clientResponse.error.details).toMatchObject({
        metricType: 'bloodPressure',
        value: '300/200',
        validRange: '90-180/60-120',
        journey: 'health'
      });
    });
    
    it('should classify journey errors correctly for retry mechanisms', () => {
      // Arrange - create errors that should and shouldn't be retried
      const retryableErrors = [
        // External system errors are typically retryable
        new Health.Devices.DeviceConnectionFailureError(
          'Failed to connect to fitness tracker',
          { deviceId: 'fitbit-123', connectionState: 'timeout' }
        ),
        new Care.TelemedicineConnectionError(
          'Failed to establish WebRTC connection',
          { sessionId: 'tele-123', errorCode: 'NETWORK_FAILURE' }
        ),
        new Plan.Coverage.CoverageVerificationError(
          'Failed to verify coverage with insurance provider',
          { planId: 'plan-123', serviceCode: 'SVC-456' }
        )
      ];
      
      const nonRetryableErrors = [
        // Validation errors should not be retried
        new Health.Metrics.InvalidMetricValueError(
          'Blood pressure reading is outside valid range',
          { metricType: 'bloodPressure', value: '300/200' }
        ),
        // Business logic errors should not be retried
        new Care.AppointmentOverlapError(
          'The requested appointment time overlaps with an existing appointment',
          { requestedTime: '2023-05-15T14:00:00Z', existingAppointmentId: 'appt-456' }
        ),
        new Plan.Claims.ClaimValidationError(
          'Claim submission contains invalid data',
          { claimId: 'claim-123', validationErrors: ['Missing required field'] }
        )
      ];

      // Act & Assert
      retryableErrors.forEach(error => {
        const result = errorHandler.handleError(error);
        expect(result.error.type).toMatch(/EXTERNAL|TECHNICAL/);
        expect(result.retryable).toBe(true);
      });
      
      nonRetryableErrors.forEach(error => {
        const result = errorHandler.handleError(error);
        expect(result.error.type).toMatch(/VALIDATION|BUSINESS/);
        expect(result.retryable).toBe(false);
      });
    });
  });
});