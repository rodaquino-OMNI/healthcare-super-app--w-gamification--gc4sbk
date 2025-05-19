import { Controller, Get, Post, Body, Inject, Headers, HttpStatus } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import {
  BusinessRuleViolationError,
  InvalidParameterError,
  InternalServerError,
  ExternalApiError
} from '../../../src/categories';
import { HealthMetricError } from '../../../src/journey/health';
import { AppointmentError } from '../../../src/journey/care';
import { PlanBenefitError } from '../../../src/journey/plan';

/**
 * Test controller that generates different types of errors for e2e testing
 */
@Controller('test')
export class TestController {
  constructor(
    private readonly logger: LoggerService,
    private readonly tracing: TracingService,
    @Inject('TEST_SERVICE') private readonly testService: any
  ) {}

  /**
   * Endpoint that throws a validation error
   */
  @Get('validation-error')
  validationError() {
    throw new InvalidParameterError('Invalid parameter provided', 'test_param');
  }

  /**
   * Endpoint that throws a business rule violation error
   */
  @Get('business-error')
  businessError(@Headers() headers: Record<string, string>) {
    const requestId = headers['x-request-id'] || 'unknown';
    
    // Add the request ID to the error context
    const error = new BusinessRuleViolationError(
      'Business rule violated during test operation',
      'TEST_BUSINESS_RULE',
      { requestId }
    );
    
    throw error;
  }

  /**
   * Endpoint that throws a technical error
   */
  @Post('technical-error')
  technicalError(@Body() body: any) {
    throw new InternalServerError(
      'Internal server error during test operation',
      'TEST_TECHNICAL_ERROR',
      { requestData: body }
    );
  }

  /**
   * Endpoint that throws an external API error
   */
  @Get('external-error')
  externalError() {
    throw new ExternalApiError(
      'External API error during test operation',
      {
        service: 'test-external-service',
        endpoint: '/api/test',
        statusCode: 500
      }
    );
  }

  /**
   * Endpoint that handles sensitive data in errors
   */
  @Post('sensitive-data-error')
  sensitiveDataError(@Body() sensitiveData: any) {
    throw new InvalidParameterError(
      'Invalid sensitive data provided',
      'password',
      { request: { body: sensitiveData } }
    );
  }

  /**
   * Endpoint that returns sensitive data in error response
   */
  @Post('sensitive-response-error')
  sensitiveResponseError() {
    const error = new InternalServerError(
      'Error with sensitive data in details',
      'SENSITIVE_DATA_ERROR',
      { sensitiveData: 'secret-api-key-12345' }
    );
    throw error;
  }

  /**
   * Endpoint that generates multiple errors for aggregation testing
   */
  @Get('aggregated-errors')
  async aggregatedErrors() {
    // Log multiple errors with the same group ID
    const groupId = 'test-group-1';
    
    this.logger.logError(new InternalServerError(
      'First error in group',
      'GROUP_ERROR_1',
      { errorGroupId: groupId }
    ), {
      service: 'test-service',
      environment: 'test',
      version: '1.0.0',
      errorId: 'error-1',
      errorGroupId: groupId
    });
    
    this.logger.logError(new InternalServerError(
      'Second error in group',
      'GROUP_ERROR_2',
      { errorGroupId: groupId }
    ), {
      service: 'test-service',
      environment: 'test',
      version: '1.0.0',
      errorId: 'error-2',
      errorGroupId: groupId
    });
    
    // Log an error with a different group ID
    this.logger.logError(new InternalServerError(
      'Error in different group',
      'GROUP_ERROR_3',
      { errorGroupId: 'test-group-2' }
    ), {
      service: 'test-service',
      environment: 'test',
      version: '1.0.0',
      errorId: 'error-3',
      errorGroupId: 'test-group-2'
    });
    
    throw new InternalServerError('Aggregated errors test');
  }

  /**
   * Endpoint that throws a health journey specific error
   */
  @Get('health-journey-error')
  healthJourneyError() {
    throw new HealthMetricError(
      'Invalid health metric value',
      {
        metricType: 'blood_pressure',
        goalId: 'goal-123',
        value: '200/120',
        threshold: '140/90'
      }
    );
  }

  /**
   * Endpoint that throws a care journey specific error
   */
  @Get('care-journey-error')
  careJourneyError() {
    throw new AppointmentError(
      'Appointment scheduling conflict',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-456',
        requestedTime: '2023-05-15T10:00:00Z',
        conflictReason: 'PROVIDER_UNAVAILABLE'
      }
    );
  }

  /**
   * Endpoint that throws a plan journey specific error
   */
  @Get('plan-journey-error')
  planJourneyError() {
    throw new PlanBenefitError(
      'Benefit not available in selected plan',
      {
        planId: 'plan-123',
        benefitId: 'benefit-456',
        requestedDate: '2023-06-01',
        coverageStatus: 'NOT_COVERED'
      }
    );
  }
}