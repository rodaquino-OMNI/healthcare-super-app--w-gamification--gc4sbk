/**
 * @file event-errors.spec.ts
 * @description Unit tests for event-specific error classes that extend the base error system.
 * Tests verify that event-specific error classes properly capture event context, classify errors
 * for retry decisions, and integrate with the monitoring system.
 */

import { ErrorType } from '@austa/errors/base';
import {
  EventError,
  EventErrorContext,
  EventProcessingStage,
  EventValidationError,
  EventSchemaError,
  EventDeserializationError,
  EventRoutingError,
  EventProcessingError,
  EventPersistenceError,
  EventExternalSystemError,
  EventTimeoutError,
  EventDatabaseError,
  EventDataProcessingError,
  EventVersionError,
  DuplicateEventError,
  EventRateLimitError,
  HealthEventErrors,
  CareEventErrors,
  PlanEventErrors
} from '../../../src/errors/event-errors';

describe('EventError', () => {
  const mockContext: EventErrorContext = {
    eventId: 'test-event-123',
    eventType: 'health.metric.created',
    eventSource: 'health-service',
    processingStage: EventProcessingStage.PROCESSING,
    details: { metricType: 'HEART_RATE', value: 75 }
  };

  describe('Base EventError class', () => {
    it('should create an error with the correct properties', () => {
      const error = new EventError(
        'Test error message',
        ErrorType.TECHNICAL,
        'TEST_ERROR_CODE',
        mockContext
      );

      expect(error.message).toContain('Test error message');
      expect(error.message).toContain('Event ID: test-event-123');
      expect(error.message).toContain('Event Type: health.metric.created');
      expect(error.message).toContain('Source: health-service');
      expect(error.message).toContain('Stage: processing');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('TEST_ERROR_CODE');
      expect(error.context).toEqual(mockContext);
      expect(error.name).toBe('EventError');
    });

    it('should create a formatted message with context', () => {
      const message = EventError.createMessage('Base message', mockContext);
      
      expect(message).toContain('Base message');
      expect(message).toContain('Event ID: test-event-123');
      expect(message).toContain('Event Type: health.metric.created');
      expect(message).toContain('Source: health-service');
      expect(message).toContain('Stage: processing');
    });

    it('should return the original message when context is empty', () => {
      const message = EventError.createMessage('Base message', {});
      expect(message).toBe('Base message');
    });

    it('should properly serialize to JSON with event context', () => {
      const error = new EventError(
        'Test error message',
        ErrorType.TECHNICAL,
        'TEST_ERROR_CODE',
        mockContext
      );

      const json = error.toJSON();
      
      expect(json.error).toBeDefined();
      expect(json.error.message).toContain('Test error message');
      expect(json.error.code).toBe('TEST_ERROR_CODE');
      expect(json.error.type).toBe(ErrorType.TECHNICAL);
      expect(json.error.eventContext).toBeDefined();
      expect(json.error.eventContext.eventId).toBe('test-event-123');
      expect(json.error.eventContext.eventType).toBe('health.metric.created');
      expect(json.error.eventContext.eventSource).toBe('health-service');
      expect(json.error.eventContext.processingStage).toBe(EventProcessingStage.PROCESSING);
    });

    it('should determine if an error is retriable based on error type', () => {
      const technicalError = new EventError(
        'Technical error',
        ErrorType.TECHNICAL,
        'TECHNICAL_ERROR',
        mockContext
      );

      const externalError = new EventError(
        'External error',
        ErrorType.EXTERNAL,
        'EXTERNAL_ERROR',
        mockContext
      );

      const validationError = new EventError(
        'Validation error',
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        mockContext
      );

      const businessError = new EventError(
        'Business error',
        ErrorType.BUSINESS,
        'BUSINESS_ERROR',
        mockContext
      );

      expect(technicalError.isRetriable()).toBe(true);
      expect(externalError.isRetriable()).toBe(true);
      expect(validationError.isRetriable()).toBe(false);
      expect(businessError.isRetriable()).toBe(false);
    });
  });

  describe('Specialized error classes', () => {
    it('should create EventValidationError with correct type and code', () => {
      const error = new EventValidationError('Invalid event format', mockContext);
      
      expect(error.message).toContain('Invalid event format');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('EVENT_VALIDATION_ERROR');
      expect(error.isRetriable()).toBe(false);
    });

    it('should create EventSchemaError with correct type and code', () => {
      const error = new EventSchemaError('Schema validation failed', mockContext);
      
      expect(error.message).toContain('Schema validation failed');
      expect(error.code).toBe('EVENT_SCHEMA_ERROR');
      expect(error.isRetriable()).toBe(false);
    });

    it('should create EventDeserializationError with correct stage', () => {
      const error = new EventDeserializationError('Failed to deserialize event', mockContext);
      
      expect(error.message).toContain('Failed to deserialize event');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('EVENT_DESERIALIZATION_ERROR');
      expect(error.context.processingStage).toBe(EventProcessingStage.DESERIALIZATION);
    });

    it('should create EventRoutingError with correct stage', () => {
      const error = new EventRoutingError('No handler found for event', mockContext);
      
      expect(error.message).toContain('No handler found for event');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('EVENT_ROUTING_ERROR');
      expect(error.context.processingStage).toBe(EventProcessingStage.ROUTING);
    });

    it('should create EventProcessingError with correct type and stage', () => {
      const error = new EventProcessingError('Failed to process event', mockContext);
      
      expect(error.message).toContain('Failed to process event');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('EVENT_PROCESSING_ERROR');
      expect(error.context.processingStage).toBe(EventProcessingStage.PROCESSING);
      expect(error.isRetriable()).toBe(false);
    });

    it('should create EventPersistenceError with correct stage', () => {
      const error = new EventPersistenceError('Failed to persist event', mockContext);
      
      expect(error.message).toContain('Failed to persist event');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('EVENT_PERSISTENCE_ERROR');
      expect(error.context.processingStage).toBe(EventProcessingStage.PERSISTENCE);
      expect(error.isRetriable()).toBe(true);
    });

    it('should create EventExternalSystemError with correct status code', () => {
      const error = new EventExternalSystemError('External API error', mockContext, 503);
      
      expect(error.message).toContain('External API error');
      expect(error.code).toBe('EVENT_EXTERNAL_SYSTEM_ERROR');
      expect(error.statusCode).toBe(503);
      expect(error.isRetriable()).toBe(true);
    });

    it('should determine retriability of EventExternalSystemError based on status code', () => {
      const error4xx = new EventExternalSystemError('Client error', mockContext, 400);
      const error5xx = new EventExternalSystemError('Server error', mockContext, 500);
      
      expect(error4xx.isRetriable()).toBe(false);
      expect(error5xx.isRetriable()).toBe(true);
    });

    it('should create EventTimeoutError with correct timeout value', () => {
      const error = new EventTimeoutError('Operation timed out', mockContext, 3000);
      
      expect(error.message).toContain('Operation timed out');
      expect(error.code).toBe('EVENT_TIMEOUT_ERROR');
      expect(error.timeoutMs).toBe(3000);
      expect(error.isRetriable()).toBe(true);
    });

    it('should create EventDatabaseError with correct operation', () => {
      const error = new EventDatabaseError('Database query failed', mockContext, 'SELECT');
      
      expect(error.message).toContain('Database query failed');
      expect(error.code).toBe('EVENT_DATABASE_ERROR');
      expect(error.operation).toBe('SELECT');
      expect(error.isRetriable()).toBe(true);
    });

    it('should create EventDataProcessingError with correct context', () => {
      const error = new EventDataProcessingError('Data processing failed', mockContext);
      
      expect(error.message).toContain('Data processing failed');
      expect(error.code).toBe('EVENT_DATA_PROCESSING_ERROR');
      expect(error.context).toEqual(mockContext);
    });

    it('should create EventVersionError with version information', () => {
      const error = new EventVersionError(
        'Incompatible event version',
        mockContext,
        '1.0.0',
        '2.0.0'
      );
      
      expect(error.message).toContain('Incompatible event version');
      expect(error.message).toContain('Expected: 2.0.0, Actual: 1.0.0');
      expect(error.code).toBe('EVENT_VERSION_ERROR');
      expect(error.actualVersion).toBe('1.0.0');
      expect(error.expectedVersion).toBe('2.0.0');
      expect(error.isRetriable()).toBe(false);
    });

    it('should create DuplicateEventError with correct type', () => {
      const error = new DuplicateEventError('Event already processed', mockContext);
      
      expect(error.message).toContain('Event already processed');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('DUPLICATE_EVENT_ERROR');
      expect(error.isRetriable()).toBe(false);
    });

    it('should create EventRateLimitError with retry delay', () => {
      const error = new EventRateLimitError('Rate limit exceeded', mockContext, 10000);
      
      expect(error.message).toContain('Rate limit exceeded');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('EVENT_RATE_LIMIT_ERROR');
      expect(error.retryAfterMs).toBe(10000);
      expect(error.isRetriable()).toBe(true);
      expect(error.getRetryDelayMs()).toBe(10000);
    });

    it('should provide default retry delay when not specified', () => {
      const error = new EventRateLimitError('Rate limit exceeded', mockContext);
      
      expect(error.getRetryDelayMs()).toBe(5000); // Default value
    });
  });

  describe('Journey-specific error classes', () => {
    describe('Health journey errors', () => {
      it('should create MetricEventError with correct code', () => {
        const error = new HealthEventErrors.MetricEventError('Metric processing failed', mockContext);
        
        expect(error.message).toContain('Metric processing failed');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('HEALTH_METRIC_EVENT_ERROR');
      });

      it('should create GoalEventError with correct code', () => {
        const error = new HealthEventErrors.GoalEventError('Goal processing failed', mockContext);
        
        expect(error.message).toContain('Goal processing failed');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('HEALTH_GOAL_EVENT_ERROR');
      });

      it('should create DeviceSyncEventError with correct code and retriability', () => {
        const error = new HealthEventErrors.DeviceSyncEventError('Device sync failed', mockContext);
        
        expect(error.message).toContain('Device sync failed');
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('HEALTH_DEVICE_SYNC_EVENT_ERROR');
        expect(error.isRetriable()).toBe(true);
      });
    });

    describe('Care journey errors', () => {
      it('should create AppointmentEventError with correct code', () => {
        const error = new CareEventErrors.AppointmentEventError('Appointment processing failed', mockContext);
        
        expect(error.message).toContain('Appointment processing failed');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('CARE_APPOINTMENT_EVENT_ERROR');
      });

      it('should create MedicationEventError with correct code', () => {
        const error = new CareEventErrors.MedicationEventError('Medication processing failed', mockContext);
        
        expect(error.message).toContain('Medication processing failed');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('CARE_MEDICATION_EVENT_ERROR');
      });

      it('should create TelemedicineEventError with correct code', () => {
        const error = new CareEventErrors.TelemedicineEventError('Telemedicine processing failed', mockContext);
        
        expect(error.message).toContain('Telemedicine processing failed');
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('CARE_TELEMEDICINE_EVENT_ERROR');
      });
    });

    describe('Plan journey errors', () => {
      it('should create ClaimEventError with correct code', () => {
        const error = new PlanEventErrors.ClaimEventError('Claim processing failed', mockContext);
        
        expect(error.message).toContain('Claim processing failed');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('PLAN_CLAIM_EVENT_ERROR');
      });

      it('should create BenefitEventError with correct code', () => {
        const error = new PlanEventErrors.BenefitEventError('Benefit processing failed', mockContext);
        
        expect(error.message).toContain('Benefit processing failed');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('PLAN_BENEFIT_EVENT_ERROR');
      });

      it('should create CoverageEventError with correct code', () => {
        const error = new PlanEventErrors.CoverageEventError('Coverage processing failed', mockContext);
        
        expect(error.message).toContain('Coverage processing failed');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('PLAN_COVERAGE_EVENT_ERROR');
      });
    });
  });

  describe('Error inheritance and instanceof checks', () => {
    it('should maintain proper inheritance hierarchy', () => {
      const validationError = new EventValidationError('Validation failed', mockContext);
      const schemaError = new EventSchemaError('Schema invalid', mockContext);
      const healthError = new HealthEventErrors.MetricEventError('Health metric error', mockContext);
      
      expect(validationError instanceof EventError).toBe(true);
      expect(validationError instanceof Error).toBe(true);
      expect(schemaError instanceof Error).toBe(true);
      expect(healthError instanceof EventError).toBe(true);
      expect(healthError instanceof Error).toBe(true);
    });
  });

  describe('Error with cause', () => {
    it('should properly capture the cause of an error', () => {
      const cause = new Error('Original error');
      const error = new EventProcessingError('Processing failed', mockContext, cause);
      
      expect(error.cause).toBe(cause);
      expect(error.message).toContain('Processing failed');
    });

    it('should determine retriability based on cause for certain errors', () => {
      const timeoutCause = new EventTimeoutError('Timeout occurred', mockContext);
      const validationCause = new EventValidationError('Validation failed', mockContext);
      
      const errorWithTimeoutCause = new CareEventErrors.TelemedicineEventError(
        'Telemedicine error',
        mockContext,
        timeoutCause
      );
      
      const errorWithValidationCause = new CareEventErrors.TelemedicineEventError(
        'Telemedicine error',
        mockContext,
        validationCause
      );
      
      expect(errorWithTimeoutCause.isRetriable()).toBe(true);
      expect(errorWithValidationCause.isRetriable()).toBe(false);
    });
  });
});