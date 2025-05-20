import { describe, expect, it, jest } from '@jest/globals';
import { BaseError } from '@austa/errors';
import { ErrorType } from '@austa/errors/types';
import { HttpStatus } from '@nestjs/common';
import { 
  EventError,
  EventValidationError,
  EventSchemaError,
  EventProcessingError,
  EventDeliveryError,
  EventRetryableError,
  EventDeadLetterError,
  JourneyEventError
} from '../../../src/errors';
import { ERROR_CODES, ERROR_MESSAGES, ERROR_SEVERITY } from '../../../src/constants/errors.constants';
import { EventMetadataDto, EventOriginDto } from '../../../src/dto/event-metadata.dto';
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';

describe('Event Errors', () => {
  // Helper function to create event metadata for testing
  const createTestMetadata = (eventType: EventType, journey: string = 'health') => {
    const origin = new EventOriginDto();
    origin.service = `${journey}-service`;
    origin.component = 'test-component';
    
    const metadata = new EventMetadataDto();
    metadata.eventId = '123e4567-e89b-12d3-a456-426614174000';
    metadata.correlationId = '123e4567-e89b-12d3-a456-426614174001';
    metadata.origin = origin;
    metadata.timestamp = new Date();
    
    return { eventType, metadata };
  };

  describe('EventError', () => {
    it('should extend BaseError', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventError(
        'Event processing failed',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        eventType,
        metadata
      );
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(EventError);
    });

    it('should store event type and metadata', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventError(
        'Event processing failed',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        eventType,
        metadata
      );
      
      expect(error.eventType).toBe(eventType);
      expect(error.eventMetadata).toBe(metadata);
    });

    it('should use TECHNICAL error type by default', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventError(
        'Event processing failed',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        eventType,
        metadata
      );
      
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should allow overriding the error type', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventError(
        'Event processing failed',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        eventType,
        metadata,
        undefined,
        undefined,
        ErrorType.EXTERNAL
      );
      
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should include event context in serialized output when includeContext is true', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventError(
        'Event processing failed',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        eventType,
        metadata
      );
      
      const json = error.toJSON(true);
      
      expect(json.error.context).toBeDefined();
      expect(json.error.context.eventType).toBe(eventType);
      expect(json.error.context.eventId).toBe(metadata.eventId);
      expect(json.error.context.correlationId).toBe(metadata.correlationId);
    });

    it('should include event context in log format', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventError(
        'Event processing failed',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        eventType,
        metadata
      );
      
      const logFormat = error.toLogFormat();
      
      expect(logFormat.eventContext).toBeDefined();
      expect(logFormat.eventContext.eventType).toBe(eventType);
      expect(logFormat.eventContext.eventId).toBe(metadata.eventId);
      expect(logFormat.eventContext.service).toBe(metadata.origin.service);
    });

    it('should extract journey from event type', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventError(
        'Event processing failed',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        eventType,
        metadata
      );
      
      expect(error.getJourney()).toBe('health');
    });

    it('should extract journey from event metadata if available', () => {
      const { eventType, metadata } = createTestMetadata(EventType.CARE_APPOINTMENT_BOOKED, 'care');
      const error = new EventError(
        'Event processing failed',
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        eventType,
        metadata
      );
      
      expect(error.getJourney()).toBe('care');
    });

    it('should determine if error is retryable based on error code', () => {
      // Retryable error
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const retryableError = new EventError(
        'Connection temporarily unavailable',
        ERROR_CODES.PRODUCER_CONNECTION_FAILED,
        eventType,
        metadata
      );
      
      // Non-retryable error
      const nonRetryableError = new EventError(
        'Schema validation failed',
        ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        eventType,
        metadata
      );
      
      expect(retryableError.isRetryable()).toBe(true);
      expect(nonRetryableError.isRetryable()).toBe(false);
    });
  });

  describe('EventValidationError', () => {
    it('should extend EventError', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const validationErrors = [
        { property: 'value', constraints: { min: 'value must be greater than 0' } }
      ];
      
      const error = new EventValidationError(
        'Event validation failed',
        eventType,
        metadata,
        validationErrors
      );
      
      expect(error).toBeInstanceOf(EventError);
      expect(error).toBeInstanceOf(EventValidationError);
    });

    it('should use VALIDATION error type', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const validationErrors = [
        { property: 'value', constraints: { min: 'value must be greater than 0' } }
      ];
      
      const error = new EventValidationError(
        'Event validation failed',
        eventType,
        metadata,
        validationErrors
      );
      
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should store validation errors in details', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const validationErrors = [
        { property: 'value', constraints: { min: 'value must be greater than 0' } }
      ];
      
      const error = new EventValidationError(
        'Event validation failed',
        eventType,
        metadata,
        validationErrors
      );
      
      expect(error.details).toEqual({ validationErrors });
    });

    it('should use SCHEMA_VALIDATION_FAILED error code', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const validationErrors = [
        { property: 'value', constraints: { min: 'value must be greater than 0' } }
      ];
      
      const error = new EventValidationError(
        'Event validation failed',
        eventType,
        metadata,
        validationErrors
      );
      
      expect(error.code).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
    });

    it('should not be retryable', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const validationErrors = [
        { property: 'value', constraints: { min: 'value must be greater than 0' } }
      ];
      
      const error = new EventValidationError(
        'Event validation failed',
        eventType,
        metadata,
        validationErrors
      );
      
      expect(error.isRetryable()).toBe(false);
    });
  });

  describe('EventSchemaError', () => {
    it('should extend EventError', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventSchemaError(
        'Schema not found for event type',
        eventType,
        metadata
      );
      
      expect(error).toBeInstanceOf(EventError);
      expect(error).toBeInstanceOf(EventSchemaError);
    });

    it('should use SCHEMA_NOT_FOUND error code by default', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventSchemaError(
        'Schema not found for event type',
        eventType,
        metadata
      );
      
      expect(error.code).toBe(ERROR_CODES.SCHEMA_NOT_FOUND);
    });

    it('should allow custom error code', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventSchemaError(
        'Schema validation error',
        eventType,
        metadata,
        undefined,
        ERROR_CODES.SCHEMA_VALIDATION_ERROR
      );
      
      expect(error.code).toBe(ERROR_CODES.SCHEMA_VALIDATION_ERROR);
    });

    it('should not be retryable', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventSchemaError(
        'Schema not found for event type',
        eventType,
        metadata
      );
      
      expect(error.isRetryable()).toBe(false);
    });
  });

  describe('EventProcessingError', () => {
    it('should extend EventError', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata
      );
      
      expect(error).toBeInstanceOf(EventError);
      expect(error).toBeInstanceOf(EventProcessingError);
    });

    it('should use CONSUMER_PROCESSING_FAILED error code by default', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata
      );
      
      expect(error.code).toBe(ERROR_CODES.CONSUMER_PROCESSING_FAILED);
    });

    it('should be retryable by default', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata
      );
      
      expect(error.isRetryable()).toBe(true);
    });

    it('should allow setting retryable flag explicitly', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata,
        undefined,
        ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        false // not retryable
      );
      
      expect(error.isRetryable()).toBe(false);
    });

    it('should include processing context in details if provided', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const processingContext = { 
        processorId: 'health-processor',
        processingStage: 'validation',
        attemptNumber: 2
      };
      
      const error = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata,
        processingContext
      );
      
      expect(error.details).toEqual(processingContext);
    });
  });

  describe('EventDeliveryError', () => {
    it('should extend EventError', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventDeliveryError(
        'Failed to deliver event',
        eventType,
        metadata
      );
      
      expect(error).toBeInstanceOf(EventError);
      expect(error).toBeInstanceOf(EventDeliveryError);
    });

    it('should use PRODUCER_SEND_FAILED error code by default', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventDeliveryError(
        'Failed to deliver event',
        eventType,
        metadata
      );
      
      expect(error.code).toBe(ERROR_CODES.PRODUCER_SEND_FAILED);
    });

    it('should be retryable by default', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventDeliveryError(
        'Failed to deliver event',
        eventType,
        metadata
      );
      
      expect(error.isRetryable()).toBe(true);
    });

    it('should include delivery context in details if provided', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const deliveryContext = { 
        topic: 'health.events',
        partition: 0,
        attemptNumber: 2
      };
      
      const error = new EventDeliveryError(
        'Failed to deliver event',
        eventType,
        metadata,
        deliveryContext
      );
      
      expect(error.details).toEqual(deliveryContext);
    });
  });

  describe('EventRetryableError', () => {
    it('should extend EventError', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventRetryableError(
        'Temporary failure, will retry',
        eventType,
        metadata,
        { attemptNumber: 2, maxAttempts: 5 }
      );
      
      expect(error).toBeInstanceOf(EventError);
      expect(error).toBeInstanceOf(EventRetryableError);
    });

    it('should always be retryable', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventRetryableError(
        'Temporary failure, will retry',
        eventType,
        metadata,
        { attemptNumber: 2, maxAttempts: 5 }
      );
      
      expect(error.isRetryable()).toBe(true);
    });

    it('should store retry information in details', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const retryInfo = { 
        attemptNumber: 2, 
        maxAttempts: 5,
        nextRetryDelayMs: 1000
      };
      
      const error = new EventRetryableError(
        'Temporary failure, will retry',
        eventType,
        metadata,
        retryInfo
      );
      
      expect(error.details).toEqual(retryInfo);
    });

    it('should use RETRY_FAILED error code by default', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventRetryableError(
        'Temporary failure, will retry',
        eventType,
        metadata,
        { attemptNumber: 2, maxAttempts: 5 }
      );
      
      expect(error.code).toBe(ERROR_CODES.RETRY_FAILED);
    });

    it('should allow custom error code', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new EventRetryableError(
        'Temporary failure, will retry',
        eventType,
        metadata,
        { attemptNumber: 2, maxAttempts: 5 },
        ERROR_CODES.PRODUCER_CONNECTION_FAILED
      );
      
      expect(error.code).toBe(ERROR_CODES.PRODUCER_CONNECTION_FAILED);
    });

    it('should provide information about retry exhaustion', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      
      // Not exhausted
      const notExhausted = new EventRetryableError(
        'Temporary failure, will retry',
        eventType,
        metadata,
        { attemptNumber: 2, maxAttempts: 5 }
      );
      
      // Exhausted
      const exhausted = new EventRetryableError(
        'Retry attempts exhausted',
        eventType,
        metadata,
        { attemptNumber: 5, maxAttempts: 5 }
      );
      
      expect(notExhausted.isRetryExhausted()).toBe(false);
      expect(exhausted.isRetryExhausted()).toBe(true);
    });
  });

  describe('EventDeadLetterError', () => {
    it('should extend EventError', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const originalError = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata
      );
      
      const error = new EventDeadLetterError(
        'Failed to send to dead-letter queue',
        eventType,
        metadata,
        originalError
      );
      
      expect(error).toBeInstanceOf(EventError);
      expect(error).toBeInstanceOf(EventDeadLetterError);
    });

    it('should use DLQ_SEND_FAILED error code', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const originalError = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata
      );
      
      const error = new EventDeadLetterError(
        'Failed to send to dead-letter queue',
        eventType,
        metadata,
        originalError
      );
      
      expect(error.code).toBe(ERROR_CODES.DLQ_SEND_FAILED);
    });

    it('should store original error as cause', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const originalError = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata
      );
      
      const error = new EventDeadLetterError(
        'Failed to send to dead-letter queue',
        eventType,
        metadata,
        originalError
      );
      
      expect(error.cause).toBe(originalError);
    });

    it('should not be retryable', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const originalError = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata
      );
      
      const error = new EventDeadLetterError(
        'Failed to send to dead-letter queue',
        eventType,
        metadata,
        originalError
      );
      
      expect(error.isRetryable()).toBe(false);
    });

    it('should include original error details in log format', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const originalError = new EventProcessingError(
        'Failed to process event',
        eventType,
        metadata,
        { processorId: 'health-processor' }
      );
      
      const error = new EventDeadLetterError(
        'Failed to send to dead-letter queue',
        eventType,
        metadata,
        originalError
      );
      
      const logFormat = error.toLogFormat();
      
      expect(logFormat.originalError).toBeDefined();
      expect(logFormat.originalError.code).toBe(originalError.code);
      expect(logFormat.originalError.message).toBe(originalError.message);
      expect(logFormat.originalError.details).toEqual(originalError.details);
    });
  });

  describe('JourneyEventError', () => {
    it('should extend EventError', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new JourneyEventError(
        'Health journey processing error',
        'health',
        eventType,
        metadata
      );
      
      expect(error).toBeInstanceOf(EventError);
      expect(error).toBeInstanceOf(JourneyEventError);
    });

    it('should store journey information', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new JourneyEventError(
        'Health journey processing error',
        'health',
        eventType,
        metadata
      );
      
      expect(error.journey).toBe('health');
    });

    it('should override getJourney() to return the stored journey', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED, 'care');
      const error = new JourneyEventError(
        'Health journey processing error',
        'health', // Explicitly set journey to 'health'
        eventType,
        metadata
      );
      
      // Should return the explicitly set journey, not the one from metadata
      expect(error.getJourney()).toBe('health');
    });

    it('should include journey in context', () => {
      const { eventType, metadata } = createTestMetadata(EventType.HEALTH_METRIC_RECORDED);
      const error = new JourneyEventError(
        'Health journey processing error',
        'health',
        eventType,
        metadata
      );
      
      const json = error.toJSON(true);
      
      expect(json.error.context.journey).toBe('health');
    });

    it('should create journey-specific error for health journey', () => {
      const { eventType, metadata } = createTestMetadata(JourneyEvents.Health.METRIC_RECORDED);
      const error = new JourneyEventError(
        'Health metric processing error',
        'health',
        eventType,
        metadata,
        { metricType: 'heart_rate', value: 75 }
      );
      
      expect(error.journey).toBe('health');
      expect(error.details).toEqual({ metricType: 'heart_rate', value: 75 });
    });

    it('should create journey-specific error for care journey', () => {
      const { eventType, metadata } = createTestMetadata(JourneyEvents.Care.APPOINTMENT_BOOKED, 'care');
      const error = new JourneyEventError(
        'Care appointment processing error',
        'care',
        eventType,
        metadata,
        { appointmentId: '12345', providerId: 'provider-123' }
      );
      
      expect(error.journey).toBe('care');
      expect(error.details).toEqual({ appointmentId: '12345', providerId: 'provider-123' });
    });

    it('should create journey-specific error for plan journey', () => {
      const { eventType, metadata } = createTestMetadata(JourneyEvents.Plan.CLAIM_SUBMITTED, 'plan');
      const error = new JourneyEventError(
        'Plan claim processing error',
        'plan',
        eventType,
        metadata,
        { claimId: '12345', amount: 100.50 }
      );
      
      expect(error.journey).toBe('plan');
      expect(error.details).toEqual({ claimId: '12345', amount: 100.50 });
    });
  });
});