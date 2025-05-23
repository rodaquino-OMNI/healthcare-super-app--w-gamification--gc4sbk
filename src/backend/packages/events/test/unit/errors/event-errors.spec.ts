import { ErrorType } from '@austa/errors';
import {
  EventException,
  EventErrorCategory,
  EventProcessingStage,
  EventErrorContext,
  EventValidationException,
  EventDeserializationException,
  EventSchemaVersionException,
  EventProcessingException,
  EventPublishingException,
  EventPersistenceException,
  EventHandlerNotFoundException,
  EventMaxRetriesExceededException,
  HealthEventException,
  CareEventException,
  PlanEventException
} from '../../../src/errors/event-errors';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';

describe('Event Errors', () => {
  // Mock event for testing
  const mockEvent: BaseEvent = {
    eventId: 'test-event-123',
    type: 'TEST_EVENT',
    timestamp: '2023-04-15T14:32:17.000Z',
    version: '1.0.0',
    source: 'test-service',
    journey: 'health',
    userId: 'user-123',
    payload: { test: 'data' },
    metadata: {
      correlationId: 'corr-123',
      retryCount: 2
    }
  };

  // Mock event context for testing
  const mockEventContext: EventErrorContext = {
    eventId: 'test-event-123',
    eventType: 'TEST_EVENT',
    eventSource: 'test-service',
    processingStage: EventProcessingStage.PROCESSING,
    journey: 'health',
    userId: 'user-123',
    retryCount: 2,
    metadata: {
      correlationId: 'corr-123'
    }
  };

  describe('EventException (Base Class)', () => {
    it('should create an instance with all properties', () => {
      const error = new EventException(
        'Test error message',
        ErrorType.TECHNICAL,
        'TEST_ERROR',
        EventErrorCategory.TRANSIENT,
        mockEventContext,
        { additionalInfo: 'test' },
        new Error('Original error')
      );

      expect(error).toBeInstanceOf(EventException);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error message');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.category).toBe(EventErrorCategory.TRANSIENT);
      expect(error.eventContext).toEqual(mockEventContext);
      expect(error.details).toEqual({ additionalInfo: 'test' });
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause?.message).toBe('Original error');
    });

    it('should create an instance from an event using fromEvent', () => {
      const error = EventException.fromEvent(
        mockEvent,
        'Error from event',
        ErrorType.TECHNICAL,
        'EVENT_ERROR',
        EventErrorCategory.TRANSIENT,
        EventProcessingStage.PROCESSING,
        { additionalInfo: 'test' },
        new Error('Original error')
      );

      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Error from event');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('EVENT_ERROR');
      expect(error.category).toBe(EventErrorCategory.TRANSIENT);
      expect(error.eventContext).toEqual({
        eventId: mockEvent.eventId,
        eventType: mockEvent.type,
        eventSource: mockEvent.source,
        processingStage: EventProcessingStage.PROCESSING,
        journey: mockEvent.journey,
        userId: mockEvent.userId,
        metadata: mockEvent.metadata
      });
      expect(error.details).toEqual({ additionalInfo: 'test' });
      expect(error.cause).toBeInstanceOf(Error);
    });

    it('should correctly serialize to JSON with event context', () => {
      const error = new EventException(
        'Test error message',
        ErrorType.TECHNICAL,
        'TEST_ERROR',
        EventErrorCategory.TRANSIENT,
        mockEventContext
      );

      const json = error.toJSON();
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('message', 'Test error message');
      expect(json.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(json.error).toHaveProperty('code', 'TEST_ERROR');
      expect(json.error).toHaveProperty('category', EventErrorCategory.TRANSIENT);
      expect(json.error).toHaveProperty('eventContext', mockEventContext);
    });

    it('should correctly identify retriable errors', () => {
      const transientError = new EventException(
        'Transient error',
        ErrorType.TECHNICAL,
        'TRANSIENT_ERROR',
        EventErrorCategory.TRANSIENT,
        mockEventContext
      );

      const retriableError = new EventException(
        'Retriable error',
        ErrorType.TECHNICAL,
        'RETRIABLE_ERROR',
        EventErrorCategory.RETRIABLE,
        mockEventContext
      );

      const permanentError = new EventException(
        'Permanent error',
        ErrorType.TECHNICAL,
        'PERMANENT_ERROR',
        EventErrorCategory.PERMANENT,
        mockEventContext
      );

      const manualError = new EventException(
        'Manual error',
        ErrorType.TECHNICAL,
        'MANUAL_ERROR',
        EventErrorCategory.MANUAL,
        mockEventContext
      );

      expect(transientError.isRetriable()).toBe(true);
      expect(retriableError.isRetriable()).toBe(true);
      expect(permanentError.isRetriable()).toBe(false);
      expect(manualError.isRetriable()).toBe(false);
    });
  });

  describe('EventValidationException', () => {
    it('should create an instance with correct defaults', () => {
      const error = new EventValidationException(
        'Validation error',
        'VALIDATION_ERROR',
        mockEventContext,
        { field: 'test', constraint: 'required' }
      );

      expect(error).toBeInstanceOf(EventValidationException);
      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Validation error');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe(EventErrorCategory.PERMANENT);
      expect(error.eventContext.processingStage).toBe(EventProcessingStage.VALIDATION);
      expect(error.details).toEqual({ field: 'test', constraint: 'required' });
    });

    it('should create an instance from an event using fromEvent', () => {
      const error = EventValidationException.fromEvent(
        mockEvent,
        'Event validation failed',
        { field: 'test', constraint: 'required' }
      );

      expect(error).toBeInstanceOf(EventValidationException);
      expect(error.message).toBe('Event validation failed');
      expect(error.code).toBe('EVENT_VALIDATION_ERROR');
      expect(error.category).toBe(EventErrorCategory.PERMANENT);
      expect(error.eventContext).toHaveProperty('eventId', mockEvent.eventId);
      expect(error.eventContext).toHaveProperty('eventType', mockEvent.type);
      expect(error.eventContext).toHaveProperty('processingStage', EventProcessingStage.VALIDATION);
    });
  });

  describe('EventDeserializationException', () => {
    it('should create an instance with correct defaults', () => {
      const error = new EventDeserializationException(
        'Deserialization error',
        'DESERIALIZATION_ERROR',
        mockEventContext,
        { rawData: '{malformed json}' }
      );

      expect(error).toBeInstanceOf(EventDeserializationException);
      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Deserialization error');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('DESERIALIZATION_ERROR');
      expect(error.category).toBe(EventErrorCategory.PERMANENT);
      expect(error.eventContext.processingStage).toBe(EventProcessingStage.DESERIALIZATION);
    });

    it('should create an instance with partial context', () => {
      const partialContext = {
        eventType: 'PARTIAL_EVENT',
        eventSource: 'unknown-source'
      };

      const error = EventDeserializationException.withPartialContext(
        partialContext,
        'Could not deserialize event',
        { rawData: '{malformed json}' }
      );

      expect(error).toBeInstanceOf(EventDeserializationException);
      expect(error.message).toBe('Could not deserialize event');
      expect(error.eventContext).toHaveProperty('eventType', 'PARTIAL_EVENT');
      expect(error.eventContext).toHaveProperty('eventSource', 'unknown-source');
      expect(error.eventContext.processingStage).toBe(EventProcessingStage.DESERIALIZATION);
    });
  });

  describe('EventSchemaVersionException', () => {
    it('should create an instance with correct defaults', () => {
      const error = new EventSchemaVersionException(
        'Schema version mismatch',
        'SCHEMA_VERSION_ERROR',
        mockEventContext,
        { expectedVersion: '2.0.0', actualVersion: '1.0.0' }
      );

      expect(error).toBeInstanceOf(EventSchemaVersionException);
      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Schema version mismatch');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('SCHEMA_VERSION_ERROR');
      expect(error.category).toBe(EventErrorCategory.PERMANENT);
      expect(error.eventContext.processingStage).toBe(EventProcessingStage.VALIDATION);
    });

    it('should create an instance from an event using fromEvent', () => {
      const error = EventSchemaVersionException.fromEvent(
        mockEvent,
        '2.0.0',
        '1.0.0'
      );

      expect(error).toBeInstanceOf(EventSchemaVersionException);
      expect(error.message).toContain('Expected 2.0.0, got 1.0.0');
      expect(error.code).toBe('EVENT_SCHEMA_VERSION_ERROR');
      expect(error.details).toEqual({
        expectedVersion: '2.0.0',
        actualVersion: '1.0.0',
        migrationRequired: true
      });
    });
  });

  describe('EventProcessingException', () => {
    it('should create an instance with correct defaults', () => {
      const error = new EventProcessingException(
        'Processing error',
        'PROCESSING_ERROR',
        EventErrorCategory.RETRIABLE,
        mockEventContext,
        { processingStep: 'data-transformation' }
      );

      expect(error).toBeInstanceOf(EventProcessingException);
      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Processing error');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('PROCESSING_ERROR');
      expect(error.category).toBe(EventErrorCategory.RETRIABLE);
      expect(error.eventContext.processingStage).toBe(EventProcessingStage.PROCESSING);
    });

    it('should create an instance from an event using fromEvent', () => {
      const error = EventProcessingException.fromEvent(
        mockEvent,
        'Failed to process event',
        EventErrorCategory.TRANSIENT,
        { processingStep: 'data-transformation' }
      );

      expect(error).toBeInstanceOf(EventProcessingException);
      expect(error.message).toBe('Failed to process event');
      expect(error.code).toBe('EVENT_PROCESSING_ERROR');
      expect(error.category).toBe(EventErrorCategory.TRANSIENT);
      expect(error.eventContext).toHaveProperty('retryCount', 2);
    });
  });

  describe('EventPublishingException', () => {
    it('should create an instance with correct defaults', () => {
      const error = new EventPublishingException(
        'Publishing error',
        'PUBLISHING_ERROR',
        EventErrorCategory.TRANSIENT,
        mockEventContext,
        { destination: 'kafka-topic' }
      );

      expect(error).toBeInstanceOf(EventPublishingException);
      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Publishing error');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('PUBLISHING_ERROR');
      expect(error.category).toBe(EventErrorCategory.TRANSIENT);
      expect(error.eventContext.processingStage).toBe(EventProcessingStage.PUBLISHING);
    });

    it('should create an instance from an event using fromEvent', () => {
      const error = EventPublishingException.fromEvent(
        mockEvent,
        'kafka-topic',
        'Failed to publish event'
      );

      expect(error).toBeInstanceOf(EventPublishingException);
      expect(error.message).toBe('Failed to publish event');
      expect(error.code).toBe('EVENT_PUBLISHING_ERROR');
      expect(error.category).toBe(EventErrorCategory.TRANSIENT);
      expect(error.details).toHaveProperty('destination', 'kafka-topic');
      expect(error.details).toHaveProperty('timestamp');
    });

    it('should use default message if none provided', () => {
      const error = EventPublishingException.fromEvent(
        mockEvent,
        'kafka-topic',
        ''
      );

      expect(error.message).toBe('Failed to publish event to kafka-topic');
    });
  });

  describe('EventPersistenceException', () => {
    it('should create an instance with correct defaults', () => {
      const error = new EventPersistenceException(
        'Persistence error',
        'PERSISTENCE_ERROR',
        EventErrorCategory.TRANSIENT,
        mockEventContext,
        { storageTarget: 'database' }
      );

      expect(error).toBeInstanceOf(EventPersistenceException);
      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Persistence error');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('PERSISTENCE_ERROR');
      expect(error.category).toBe(EventErrorCategory.TRANSIENT);
      expect(error.eventContext.processingStage).toBe(EventProcessingStage.PERSISTENCE);
    });

    it('should create an instance from an event using fromEvent', () => {
      const error = EventPersistenceException.fromEvent(
        mockEvent,
        'events_table',
        'Failed to persist event'
      );

      expect(error).toBeInstanceOf(EventPersistenceException);
      expect(error.message).toBe('Failed to persist event');
      expect(error.code).toBe('EVENT_PERSISTENCE_ERROR');
      expect(error.category).toBe(EventErrorCategory.TRANSIENT);
      expect(error.details).toHaveProperty('storageTarget', 'events_table');
      expect(error.details).toHaveProperty('timestamp');
    });

    it('should use default message if none provided', () => {
      const error = EventPersistenceException.fromEvent(
        mockEvent,
        'events_table',
        ''
      );

      expect(error.message).toBe('Failed to persist event to events_table');
    });

    it('should correctly identify constraint violations', () => {
      const constraintError1 = new EventPersistenceException(
        'Constraint violation',
        'CONSTRAINT_ERROR',
        EventErrorCategory.PERMANENT,
        mockEventContext,
        { storageTarget: 'database' },
        new Error('duplicate key value violates unique constraint')
      );

      const constraintError2 = new EventPersistenceException(
        'Constraint violation',
        'CONSTRAINT_ERROR',
        EventErrorCategory.PERMANENT,
        mockEventContext,
        { storageTarget: 'database' },
        new Error('foreign key constraint fails')
      );

      const nonConstraintError = new EventPersistenceException(
        'Other error',
        'OTHER_ERROR',
        EventErrorCategory.TRANSIENT,
        mockEventContext,
        { storageTarget: 'database' },
        new Error('connection timeout')
      );

      expect(constraintError1.isConstraintViolation()).toBe(true);
      expect(constraintError2.isConstraintViolation()).toBe(true);
      expect(nonConstraintError.isConstraintViolation()).toBe(false);
    });
  });

  describe('EventHandlerNotFoundException', () => {
    it('should create an instance with correct defaults', () => {
      const error = new EventHandlerNotFoundException(
        'Handler not found',
        'HANDLER_NOT_FOUND',
        mockEventContext,
        { availableHandlers: ['handler1', 'handler2'] }
      );

      expect(error).toBeInstanceOf(EventHandlerNotFoundException);
      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Handler not found');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('HANDLER_NOT_FOUND');
      expect(error.category).toBe(EventErrorCategory.MANUAL);
      expect(error.eventContext.processingStage).toBe(EventProcessingStage.PROCESSING);
    });

    it('should create an instance from an event using fromEvent', () => {
      const error = EventHandlerNotFoundException.fromEvent(mockEvent);

      expect(error).toBeInstanceOf(EventHandlerNotFoundException);
      expect(error.message).toContain('No handler found for event type: TEST_EVENT');
      expect(error.code).toBe('EVENT_HANDLER_NOT_FOUND');
      expect(error.category).toBe(EventErrorCategory.MANUAL);
      expect(error.details).toHaveProperty('availableHandlers');
    });
  });

  describe('EventMaxRetriesExceededException', () => {
    it('should create an instance with correct defaults', () => {
      const error = new EventMaxRetriesExceededException(
        'Max retries exceeded',
        'MAX_RETRIES_EXCEEDED',
        mockEventContext,
        { maxRetries: 5, retryCount: 5 }
      );

      expect(error).toBeInstanceOf(EventMaxRetriesExceededException);
      expect(error).toBeInstanceOf(EventException);
      expect(error.message).toBe('Max retries exceeded');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('MAX_RETRIES_EXCEEDED');
      expect(error.category).toBe(EventErrorCategory.MANUAL);
    });

    it('should create an instance from an event using fromEvent', () => {
      const lastError = new Error('Last processing error');
      const error = EventMaxRetriesExceededException.fromEvent(
        mockEvent,
        5,
        lastError
      );

      expect(error).toBeInstanceOf(EventMaxRetriesExceededException);
      expect(error.message).toContain('Maximum retry count (5) exceeded');
      expect(error.code).toBe('EVENT_MAX_RETRIES_EXCEEDED');
      expect(error.category).toBe(EventErrorCategory.MANUAL);
      expect(error.details).toEqual({
        maxRetries: 5,
        retryCount: 2,
        lastErrorMessage: 'Last processing error',
        lastErrorStack: lastError.stack,
        movedToDLQ: true
      });
      expect(error.cause).toBe(lastError);
    });
  });

  describe('Journey-specific Exceptions', () => {
    describe('HealthEventException', () => {
      it('should create an instance with correct defaults', () => {
        const error = new HealthEventException(
          'Health event error',
          'HEALTH_ERROR',
          EventErrorCategory.RETRIABLE,
          mockEventContext,
          { healthMetric: 'heart-rate' }
        );

        expect(error).toBeInstanceOf(HealthEventException);
        expect(error).toBeInstanceOf(EventException);
        expect(error.message).toBe('Health event error');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('HEALTH_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
        expect(error.eventContext.journey).toBe('health');
      });

      it('should create an instance from an event using fromEvent', () => {
        const error = HealthEventException.fromEvent(
          mockEvent,
          'Failed to process health metric',
          'HEALTH_METRIC_ERROR',
          EventErrorCategory.RETRIABLE,
          { healthMetric: 'heart-rate' }
        );

        expect(error).toBeInstanceOf(HealthEventException);
        expect(error.message).toBe('Failed to process health metric');
        expect(error.code).toBe('HEALTH_METRIC_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
        expect(error.eventContext.journey).toBe('health');
        expect(error.details).toEqual({ healthMetric: 'heart-rate' });
      });

      it('should use default code and category if not provided', () => {
        const error = HealthEventException.fromEvent(
          mockEvent,
          'Health event error'
        );

        expect(error.code).toBe('HEALTH_EVENT_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
      });
    });

    describe('CareEventException', () => {
      it('should create an instance with correct defaults', () => {
        const careContext = { ...mockEventContext, journey: 'care' };
        const error = new CareEventException(
          'Care event error',
          'CARE_ERROR',
          EventErrorCategory.RETRIABLE,
          careContext,
          { appointmentId: 'appt-123' }
        );

        expect(error).toBeInstanceOf(CareEventException);
        expect(error).toBeInstanceOf(EventException);
        expect(error.message).toBe('Care event error');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('CARE_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
        expect(error.eventContext.journey).toBe('care');
      });

      it('should create an instance from an event using fromEvent', () => {
        const careEvent = { ...mockEvent, journey: 'care' };
        const error = CareEventException.fromEvent(
          careEvent,
          'Failed to process appointment',
          'APPOINTMENT_ERROR',
          EventErrorCategory.RETRIABLE,
          { appointmentId: 'appt-123' }
        );

        expect(error).toBeInstanceOf(CareEventException);
        expect(error.message).toBe('Failed to process appointment');
        expect(error.code).toBe('APPOINTMENT_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
        expect(error.eventContext.journey).toBe('care');
        expect(error.details).toEqual({ appointmentId: 'appt-123' });
      });

      it('should use default code and category if not provided', () => {
        const careEvent = { ...mockEvent, journey: 'care' };
        const error = CareEventException.fromEvent(
          careEvent,
          'Care event error'
        );

        expect(error.code).toBe('CARE_EVENT_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
      });
    });

    describe('PlanEventException', () => {
      it('should create an instance with correct defaults', () => {
        const planContext = { ...mockEventContext, journey: 'plan' };
        const error = new PlanEventException(
          'Plan event error',
          'PLAN_ERROR',
          EventErrorCategory.RETRIABLE,
          planContext,
          { claimId: 'claim-123' }
        );

        expect(error).toBeInstanceOf(PlanEventException);
        expect(error).toBeInstanceOf(EventException);
        expect(error.message).toBe('Plan event error');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('PLAN_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
        expect(error.eventContext.journey).toBe('plan');
      });

      it('should create an instance from an event using fromEvent', () => {
        const planEvent = { ...mockEvent, journey: 'plan' };
        const error = PlanEventException.fromEvent(
          planEvent,
          'Failed to process claim',
          'CLAIM_ERROR',
          EventErrorCategory.RETRIABLE,
          { claimId: 'claim-123' }
        );

        expect(error).toBeInstanceOf(PlanEventException);
        expect(error.message).toBe('Failed to process claim');
        expect(error.code).toBe('CLAIM_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
        expect(error.eventContext.journey).toBe('plan');
        expect(error.details).toEqual({ claimId: 'claim-123' });
      });

      it('should use default code and category if not provided', () => {
        const planEvent = { ...mockEvent, journey: 'plan' };
        const error = PlanEventException.fromEvent(
          planEvent,
          'Plan event error'
        );

        expect(error.code).toBe('PLAN_EVENT_ERROR');
        expect(error.category).toBe(EventErrorCategory.RETRIABLE);
      });
    });
  });

  describe('Error Classification and Retry Behavior', () => {
    it('should correctly classify errors for retry decisions', () => {
      // Create errors with different categories
      const errors = [
        new EventValidationException('Validation error', undefined, mockEventContext),
        new EventDeserializationException('Deserialization error', undefined, mockEventContext),
        new EventSchemaVersionException('Schema version error', undefined, mockEventContext),
        new EventProcessingException('Processing error', undefined, EventErrorCategory.RETRIABLE, mockEventContext),
        new EventPublishingException('Publishing error', undefined, EventErrorCategory.TRANSIENT, mockEventContext),
        new EventPersistenceException('Persistence error', undefined, EventErrorCategory.TRANSIENT, mockEventContext),
        new EventHandlerNotFoundException('Handler not found', undefined, mockEventContext),
        new EventMaxRetriesExceededException('Max retries exceeded', undefined, mockEventContext),
        new HealthEventException('Health error', undefined, EventErrorCategory.RETRIABLE, mockEventContext),
        new CareEventException('Care error', undefined, EventErrorCategory.PERMANENT, mockEventContext),
        new PlanEventException('Plan error', undefined, EventErrorCategory.MANUAL, mockEventContext)
      ];

      // Expected retry decisions
      const expectedRetriable = [
        false, // EventValidationException (PERMANENT)
        false, // EventDeserializationException (PERMANENT)
        false, // EventSchemaVersionException (PERMANENT)
        true,  // EventProcessingException (RETRIABLE)
        true,  // EventPublishingException (TRANSIENT)
        true,  // EventPersistenceException (TRANSIENT)
        false, // EventHandlerNotFoundException (MANUAL)
        false, // EventMaxRetriesExceededException (MANUAL)
        true,  // HealthEventException (RETRIABLE)
        false, // CareEventException (PERMANENT)
        false  // PlanEventException (MANUAL)
      ];

      // Verify each error's retry decision
      errors.forEach((error, index) => {
        expect(error.isRetriable()).toBe(expectedRetriable[index]);
      });
    });

    it('should maintain proper error inheritance hierarchy', () => {
      // Create one instance of each error type
      const errors = [
        new EventValidationException('Validation error', undefined, mockEventContext),
        new EventDeserializationException('Deserialization error', undefined, mockEventContext),
        new EventSchemaVersionException('Schema version error', undefined, mockEventContext),
        new EventProcessingException('Processing error', undefined, EventErrorCategory.RETRIABLE, mockEventContext),
        new EventPublishingException('Publishing error', undefined, EventErrorCategory.TRANSIENT, mockEventContext),
        new EventPersistenceException('Persistence error', undefined, EventErrorCategory.TRANSIENT, mockEventContext),
        new EventHandlerNotFoundException('Handler not found', undefined, mockEventContext),
        new EventMaxRetriesExceededException('Max retries exceeded', undefined, mockEventContext),
        new HealthEventException('Health error', undefined, EventErrorCategory.RETRIABLE, mockEventContext),
        new CareEventException('Care error', undefined, EventErrorCategory.RETRIABLE, mockEventContext),
        new PlanEventException('Plan error', undefined, EventErrorCategory.RETRIABLE, mockEventContext)
      ];

      // Verify each error is an instance of EventException and Error
      errors.forEach(error => {
        expect(error).toBeInstanceOf(EventException);
        expect(error).toBeInstanceOf(Error);
      });

      // Verify journey-specific errors
      expect(errors[8]).toBeInstanceOf(HealthEventException);
      expect(errors[9]).toBeInstanceOf(CareEventException);
      expect(errors[10]).toBeInstanceOf(PlanEventException);
    });
  });

  describe('Error Metadata and Context', () => {
    it('should include all required metadata fields for troubleshooting', () => {
      // Create an error with complete context
      const error = EventProcessingException.fromEvent(
        mockEvent,
        'Processing failed',
        EventErrorCategory.RETRIABLE,
        {
          processingStep: 'data-transformation',
          processingTime: 1234,
          processorId: 'processor-123'
        }
      );

      // Verify JSON representation includes all context
      const json = error.toJSON();
      
      // Check error basics
      expect(json.error).toHaveProperty('message', 'Processing failed');
      expect(json.error).toHaveProperty('code', 'EVENT_PROCESSING_ERROR');
      expect(json.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(json.error).toHaveProperty('category', EventErrorCategory.RETRIABLE);
      
      // Check event context
      expect(json.error.eventContext).toHaveProperty('eventId', mockEvent.eventId);
      expect(json.error.eventContext).toHaveProperty('eventType', mockEvent.type);
      expect(json.error.eventContext).toHaveProperty('eventSource', mockEvent.source);
      expect(json.error.eventContext).toHaveProperty('processingStage', EventProcessingStage.PROCESSING);
      expect(json.error.eventContext).toHaveProperty('journey', mockEvent.journey);
      expect(json.error.eventContext).toHaveProperty('userId', mockEvent.userId);
      expect(json.error.eventContext).toHaveProperty('retryCount', 2);
      
      // Check details
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('processingStep', 'data-transformation');
      expect(json.error.details).toHaveProperty('processingTime', 1234);
      expect(json.error.details).toHaveProperty('processorId', 'processor-123');
    });

    it('should format error context consistently across all error types', () => {
      // Create different error types with the same context
      const validationError = new EventValidationException('Validation error', undefined, mockEventContext);
      const processingError = new EventProcessingException('Processing error', undefined, EventErrorCategory.RETRIABLE, mockEventContext);
      const publishingError = new EventPublishingException('Publishing error', undefined, EventErrorCategory.TRANSIENT, mockEventContext);
      
      // Get JSON representations
      const validationJson = validationError.toJSON();
      const processingJson = processingError.toJSON();
      const publishingJson = publishingError.toJSON();
      
      // Verify common context fields are consistent
      expect(validationJson.error.eventContext.eventId).toBe(mockEventContext.eventId);
      expect(processingJson.error.eventContext.eventId).toBe(mockEventContext.eventId);
      expect(publishingJson.error.eventContext.eventId).toBe(mockEventContext.eventId);
      
      expect(validationJson.error.eventContext.eventType).toBe(mockEventContext.eventType);
      expect(processingJson.error.eventContext.eventType).toBe(mockEventContext.eventType);
      expect(publishingJson.error.eventContext.eventType).toBe(mockEventContext.eventType);
      
      // Verify processing stage is set correctly for each error type
      expect(validationJson.error.eventContext.processingStage).toBe(EventProcessingStage.VALIDATION);
      expect(processingJson.error.eventContext.processingStage).toBe(EventProcessingStage.PROCESSING);
      expect(publishingJson.error.eventContext.processingStage).toBe(EventProcessingStage.PUBLISHING);
    });
  });
});