/**
 * @file event-metadata.dto.spec.ts
 * @description Unit tests for the EventMetadataDto class that validate the metadata structure used across all journey events.
 * Tests verify origin validation, version format, correlation ID structure, and additional context property validation.
 * These tests ensure consistent metadata handling across services and provide the foundation for event correlation and debugging.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import {
  EventMetadataDto,
  ErrorMetadataDto,
  Journey,
  EventSource,
  createEventMetadata,
  createJourneyMetadata,
  createErrorMetadata
} from '../../../src/dto/event-metadata.dto';

describe('EventMetadataDto', () => {
  describe('constructor', () => {
    it('should create an empty metadata object when no parameters are provided', () => {
      const metadata = new EventMetadataDto();
      expect(metadata).toBeDefined();
      expect(metadata.correlationId).toBeUndefined();
      expect(metadata.traceId).toBeUndefined();
      expect(metadata.userId).toBeUndefined();
      expect(metadata.journey).toBeUndefined();
      expect(metadata.source).toBeUndefined();
      expect(metadata.timestamp).toBeUndefined();
      expect(metadata.context).toBeUndefined();
      expect(metadata.error).toBeUndefined();
    });

    it('should create a metadata object with provided values', () => {
      const correlationId = uuidv4();
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const userId = 'user-123';
      const journey = Journey.HEALTH;
      const source = EventSource.HEALTH_SERVICE;
      const timestamp = new Date().toISOString();
      const context = { requestId: 'req-456' };

      const metadata = new EventMetadataDto({
        correlationId,
        traceId,
        userId,
        journey,
        source,
        timestamp,
        context
      });

      expect(metadata.correlationId).toBe(correlationId);
      expect(metadata.traceId).toBe(traceId);
      expect(metadata.userId).toBe(userId);
      expect(metadata.journey).toBe(journey);
      expect(metadata.source).toBe(source);
      expect(metadata.timestamp).toBe(timestamp);
      expect(metadata.context).toEqual(context);
      expect(metadata.error).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should validate a valid metadata object', async () => {
      const correlationId = uuidv4();
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const userId = 'user-123';
      const journey = Journey.HEALTH;
      const source = EventSource.HEALTH_SERVICE;
      const timestamp = new Date().toISOString();
      const context = { requestId: 'req-456' };

      const metadata = new EventMetadataDto({
        correlationId,
        traceId,
        userId,
        journey,
        source,
        timestamp,
        context
      });

      const errors = await validate(metadata);
      expect(errors.length).toBe(0);
    });

    it('should validate an empty metadata object', async () => {
      const metadata = new EventMetadataDto();
      const errors = await validate(metadata);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for invalid correlationId format', async () => {
      const metadata = new EventMetadataDto({
        correlationId: 'not-a-uuid'
      });

      const errors = await validate(metadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('correlationId');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail validation for invalid journey value', async () => {
      const metadata = plainToInstance(EventMetadataDto, {
        journey: 'invalid-journey'
      });

      const errors = await validate(metadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('journey');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail validation for invalid source value', async () => {
      const metadata = plainToInstance(EventMetadataDto, {
        source: 'invalid-source'
      });

      const errors = await validate(metadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('source');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail validation for invalid timestamp format', async () => {
      const metadata = new EventMetadataDto({
        timestamp: 'not-an-iso-date'
      });

      const errors = await validate(metadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('timestamp');
      expect(errors[0].constraints).toHaveProperty('isIso8601');
    });

    it('should fail validation for non-object context', async () => {
      const metadata = new EventMetadataDto({
        context: 'not-an-object' as any
      });

      const errors = await validate(metadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('context');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });
  });

  describe('with methods', () => {
    let baseMetadata: EventMetadataDto;

    beforeEach(() => {
      baseMetadata = new EventMetadataDto({
        userId: 'user-123',
        source: EventSource.HEALTH_SERVICE
      });
    });

    it('should create a new instance with additional metadata using with()', () => {
      const additionalMetadata = {
        correlationId: uuidv4(),
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736'
      };

      const newMetadata = baseMetadata.with(additionalMetadata);

      // Should be a new instance
      expect(newMetadata).not.toBe(baseMetadata);

      // Should have original properties
      expect(newMetadata.userId).toBe(baseMetadata.userId);
      expect(newMetadata.source).toBe(baseMetadata.source);

      // Should have new properties
      expect(newMetadata.correlationId).toBe(additionalMetadata.correlationId);
      expect(newMetadata.traceId).toBe(additionalMetadata.traceId);
    });

    it('should merge context objects when both exist', () => {
      const metadataWithContext = new EventMetadataDto({
        userId: 'user-123',
        context: { requestId: 'req-456' }
      });

      const newMetadata = metadataWithContext.with({
        context: { sessionId: 'session-789' }
      });

      expect(newMetadata.context).toEqual({
        requestId: 'req-456',
        sessionId: 'session-789'
      });
    });

    it('should add correlation ID using withCorrelation()', () => {
      const correlationId = uuidv4();
      const newMetadata = baseMetadata.withCorrelation(correlationId);

      expect(newMetadata.correlationId).toBe(correlationId);
      expect(newMetadata.userId).toBe(baseMetadata.userId);
      expect(newMetadata.source).toBe(baseMetadata.source);
    });

    it('should add trace ID using withTracing()', () => {
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const newMetadata = baseMetadata.withTracing(traceId);

      expect(newMetadata.traceId).toBe(traceId);
      expect(newMetadata.userId).toBe(baseMetadata.userId);
      expect(newMetadata.source).toBe(baseMetadata.source);
    });

    it('should add user ID using withUser()', () => {
      const metadataWithoutUser = new EventMetadataDto({
        source: EventSource.HEALTH_SERVICE
      });

      const userId = 'new-user-456';
      const newMetadata = metadataWithoutUser.withUser(userId);

      expect(newMetadata.userId).toBe(userId);
      expect(newMetadata.source).toBe(metadataWithoutUser.source);
    });

    it('should add journey using withJourney()', () => {
      const journey = Journey.CARE;
      const newMetadata = baseMetadata.withJourney(journey);

      expect(newMetadata.journey).toBe(journey);
      expect(newMetadata.userId).toBe(baseMetadata.userId);
      expect(newMetadata.source).toBe(baseMetadata.source);
    });

    it('should add source using withSource()', () => {
      const metadataWithoutSource = new EventMetadataDto({
        userId: 'user-123'
      });

      const source = EventSource.CARE_SERVICE;
      const newMetadata = metadataWithoutSource.withSource(source);

      expect(newMetadata.source).toBe(source);
      expect(newMetadata.userId).toBe(metadataWithoutSource.userId);
    });

    it('should add error using withError() with ErrorMetadataDto', () => {
      const error = new ErrorMetadataDto({
        message: 'Test error',
        name: 'TestError',
        code: 'TEST_ERROR'
      });

      const newMetadata = baseMetadata.withError(error);

      expect(newMetadata.error).toBeDefined();
      expect(newMetadata.error).toBe(error);
      expect(newMetadata.userId).toBe(baseMetadata.userId);
      expect(newMetadata.source).toBe(baseMetadata.source);
    });

    it('should add error using withError() with Error object', () => {
      const error = new Error('Test error');
      error.name = 'TestError';

      const newMetadata = baseMetadata.withError(error);

      expect(newMetadata.error).toBeDefined();
      expect(newMetadata.error).toBeInstanceOf(ErrorMetadataDto);
      expect(newMetadata.error.message).toBe(error.message);
      expect(newMetadata.error.name).toBe(error.name);
      expect(newMetadata.error.stack).toBe(error.stack);
      expect(newMetadata.userId).toBe(baseMetadata.userId);
      expect(newMetadata.source).toBe(baseMetadata.source);
    });

    it('should add context using withContext()', () => {
      const context = { requestId: 'req-456' };
      const newMetadata = baseMetadata.withContext(context);

      expect(newMetadata.context).toEqual(context);
      expect(newMetadata.userId).toBe(baseMetadata.userId);
      expect(newMetadata.source).toBe(baseMetadata.source);
    });

    it('should merge context when using withContext() with existing context', () => {
      const metadataWithContext = new EventMetadataDto({
        userId: 'user-123',
        context: { requestId: 'req-456' }
      });

      const additionalContext = { sessionId: 'session-789' };
      const newMetadata = metadataWithContext.withContext(additionalContext);

      expect(newMetadata.context).toEqual({
        requestId: 'req-456',
        sessionId: 'session-789'
      });
      expect(newMetadata.userId).toBe(metadataWithContext.userId);
    });
  });

  describe('static methods', () => {
    describe('fromObject', () => {
      it('should create metadata from a valid object', () => {
        const correlationId = uuidv4();
        const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
        const userId = 'user-123';
        const journey = Journey.HEALTH;
        const source = EventSource.HEALTH_SERVICE;
        const timestamp = new Date().toISOString();
        const context = { requestId: 'req-456' };
        const error = { message: 'Test error', name: 'TestError' };

        const obj = {
          correlationId,
          traceId,
          userId,
          journey,
          source,
          timestamp,
          context,
          error
        };

        const metadata = EventMetadataDto.fromObject(obj);

        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.correlationId).toBe(correlationId);
        expect(metadata.traceId).toBe(traceId);
        expect(metadata.userId).toBe(userId);
        expect(metadata.journey).toBe(journey);
        expect(metadata.source).toBe(source);
        expect(metadata.timestamp).toBe(timestamp);
        expect(metadata.context).toEqual(context);
        expect(metadata.error).toBeInstanceOf(ErrorMetadataDto);
        expect(metadata.error.message).toBe(error.message);
        expect(metadata.error.name).toBe(error.name);
      });

      it('should handle partial objects', () => {
        const obj = {
          correlationId: uuidv4(),
          userId: 'user-123'
        };

        const metadata = EventMetadataDto.fromObject(obj);

        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.correlationId).toBe(obj.correlationId);
        expect(metadata.userId).toBe(obj.userId);
        expect(metadata.traceId).toBeUndefined();
        expect(metadata.journey).toBeUndefined();
        expect(metadata.source).toBeUndefined();
        expect(metadata.timestamp).toBeUndefined();
        expect(metadata.context).toBeUndefined();
        expect(metadata.error).toBeUndefined();
      });

      it('should ignore invalid journey values', () => {
        const obj = {
          journey: 'invalid-journey'
        };

        const metadata = EventMetadataDto.fromObject(obj);

        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.journey).toBeUndefined();
      });

      it('should ignore invalid source values', () => {
        const obj = {
          source: 'invalid-source'
        };

        const metadata = EventMetadataDto.fromObject(obj);

        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.source).toBeUndefined();
      });

      it('should handle empty objects', () => {
        const metadata = EventMetadataDto.fromObject({});

        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.correlationId).toBeUndefined();
        expect(metadata.traceId).toBeUndefined();
        expect(metadata.userId).toBeUndefined();
        expect(metadata.journey).toBeUndefined();
        expect(metadata.source).toBeUndefined();
        expect(metadata.timestamp).toBeUndefined();
        expect(metadata.context).toBeUndefined();
        expect(metadata.error).toBeUndefined();
      });
    });
  });
});

describe('ErrorMetadataDto', () => {
  describe('constructor', () => {
    it('should create an error metadata object with provided values', () => {
      const message = 'Test error';
      const name = 'TestError';
      const code = 'TEST_ERROR';
      const stack = 'Error: Test error\n    at Test.function';
      const details = { param: 'value' };

      const errorMetadata = new ErrorMetadataDto({
        message,
        name,
        code,
        stack,
        details
      });

      expect(errorMetadata.message).toBe(message);
      expect(errorMetadata.name).toBe(name);
      expect(errorMetadata.code).toBe(code);
      expect(errorMetadata.stack).toBe(stack);
      expect(errorMetadata.details).toEqual(details);
    });
  });

  describe('validation', () => {
    it('should validate a valid error metadata object', async () => {
      const errorMetadata = new ErrorMetadataDto({
        message: 'Test error',
        name: 'TestError',
        code: 'TEST_ERROR',
        stack: 'Error: Test error\n    at Test.function',
        details: { param: 'value' }
      });

      const errors = await validate(errorMetadata);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for missing message', async () => {
      const errorMetadata = new ErrorMetadataDto({
        message: '',
        name: 'TestError'
      });

      const errors = await validate(errorMetadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('message');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation for non-object details', async () => {
      const errorMetadata = new ErrorMetadataDto({
        message: 'Test error',
        details: 'not-an-object' as any
      });

      const errors = await validate(errorMetadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('details');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });
  });

  describe('static methods', () => {
    describe('fromObject', () => {
      it('should create error metadata from a valid object', () => {
        const obj = {
          message: 'Test error',
          name: 'TestError',
          code: 'TEST_ERROR',
          stack: 'Error: Test error\n    at Test.function',
          details: { param: 'value' }
        };

        const errorMetadata = ErrorMetadataDto.fromObject(obj);

        expect(errorMetadata).toBeInstanceOf(ErrorMetadataDto);
        expect(errorMetadata.message).toBe(obj.message);
        expect(errorMetadata.name).toBe(obj.name);
        expect(errorMetadata.code).toBe(obj.code);
        expect(errorMetadata.stack).toBe(obj.stack);
        expect(errorMetadata.details).toEqual(obj.details);
      });

      it('should use "Unknown error" as default message when missing', () => {
        const obj = {
          name: 'TestError',
          code: 'TEST_ERROR'
        };

        const errorMetadata = ErrorMetadataDto.fromObject(obj);

        expect(errorMetadata).toBeInstanceOf(ErrorMetadataDto);
        expect(errorMetadata.message).toBe('Unknown error');
        expect(errorMetadata.name).toBe(obj.name);
        expect(errorMetadata.code).toBe(obj.code);
      });

      it('should handle partial objects', () => {
        const obj = {
          message: 'Test error'
        };

        const errorMetadata = ErrorMetadataDto.fromObject(obj);

        expect(errorMetadata).toBeInstanceOf(ErrorMetadataDto);
        expect(errorMetadata.message).toBe(obj.message);
        expect(errorMetadata.name).toBeUndefined();
        expect(errorMetadata.code).toBeUndefined();
        expect(errorMetadata.stack).toBeUndefined();
        expect(errorMetadata.details).toBeUndefined();
      });
    });

    describe('fromError', () => {
      it('should create error metadata from a standard Error object', () => {
        const error = new Error('Test error');
        error.name = 'TestError';

        const errorMetadata = ErrorMetadataDto.fromError(error);

        expect(errorMetadata).toBeInstanceOf(ErrorMetadataDto);
        expect(errorMetadata.message).toBe(error.message);
        expect(errorMetadata.name).toBe(error.name);
        expect(errorMetadata.stack).toBe(error.stack);
      });

      it('should handle custom error properties', () => {
        class CustomError extends Error {
          code: string;

          constructor(message: string, code: string) {
            super(message);
            this.name = 'CustomError';
            this.code = code;
          }
        }

        const error = new CustomError('Custom error', 'CUSTOM_ERROR');
        const errorMetadata = ErrorMetadataDto.fromError(error);

        expect(errorMetadata).toBeInstanceOf(ErrorMetadataDto);
        expect(errorMetadata.message).toBe(error.message);
        expect(errorMetadata.name).toBe(error.name);
        expect(errorMetadata.stack).toBe(error.stack);
        // Note: code is not automatically copied because it's not a standard Error property
        expect(errorMetadata.code).toBeUndefined();
      });
    });
  });
});

describe('Factory Functions', () => {
  describe('createEventMetadata', () => {
    it('should create metadata with correlation ID', () => {
      const correlationId = uuidv4();
      const metadata = createEventMetadata(correlationId);

      expect(metadata).toBeInstanceOf(EventMetadataDto);
      expect(metadata.correlationId).toBe(correlationId);
    });

    it('should create metadata with correlation ID and additional metadata', () => {
      const correlationId = uuidv4();
      const userId = 'user-123';
      const source = EventSource.HEALTH_SERVICE;

      const metadata = createEventMetadata(correlationId, {
        userId,
        source
      });

      expect(metadata).toBeInstanceOf(EventMetadataDto);
      expect(metadata.correlationId).toBe(correlationId);
      expect(metadata.userId).toBe(userId);
      expect(metadata.source).toBe(source);
    });

    it('should create metadata without correlation ID', () => {
      const userId = 'user-123';
      const metadata = createEventMetadata(undefined, { userId });

      expect(metadata).toBeInstanceOf(EventMetadataDto);
      expect(metadata.correlationId).toBeUndefined();
      expect(metadata.userId).toBe(userId);
    });
  });

  describe('createJourneyMetadata', () => {
    it('should create metadata with journey', () => {
      const journey = Journey.HEALTH;
      const metadata = createJourneyMetadata(journey);

      expect(metadata).toBeInstanceOf(EventMetadataDto);
      expect(metadata.journey).toBe(journey);
    });

    it('should create metadata with journey and additional metadata', () => {
      const journey = Journey.CARE;
      const userId = 'user-123';
      const source = EventSource.CARE_SERVICE;

      const metadata = createJourneyMetadata(journey, {
        userId,
        source
      });

      expect(metadata).toBeInstanceOf(EventMetadataDto);
      expect(metadata.journey).toBe(journey);
      expect(metadata.userId).toBe(userId);
      expect(metadata.source).toBe(source);
    });
  });

  describe('createErrorMetadata', () => {
    it('should create error metadata from Error object', () => {
      const error = new Error('Test error');
      error.name = 'TestError';

      const errorMetadata = createErrorMetadata(error);

      expect(errorMetadata).toBeInstanceOf(ErrorMetadataDto);
      expect(errorMetadata.message).toBe(error.message);
      expect(errorMetadata.name).toBe(error.name);
      expect(errorMetadata.stack).toBe(error.stack);
    });

    it('should create error metadata with additional details', () => {
      const error = new Error('Test error');
      const details = { requestId: 'req-123', userId: 'user-456' };

      const errorMetadata = createErrorMetadata(error, details);

      expect(errorMetadata).toBeInstanceOf(ErrorMetadataDto);
      expect(errorMetadata.message).toBe(error.message);
      expect(errorMetadata.details).toEqual(details);
    });
  });
});

describe('Integration with Distributed Tracing', () => {
  it('should support correlation IDs for request tracing', () => {
    // Simulate incoming request with correlation ID
    const correlationId = uuidv4();
    const incomingMetadata = createEventMetadata(correlationId, {
      source: EventSource.API_GATEWAY
    });

    // Simulate passing correlation ID to downstream service
    const healthServiceMetadata = incomingMetadata.withSource(EventSource.HEALTH_SERVICE);
    expect(healthServiceMetadata.correlationId).toBe(correlationId);
    expect(healthServiceMetadata.source).toBe(EventSource.HEALTH_SERVICE);

    // Simulate passing correlation ID to another downstream service
    const gamificationMetadata = healthServiceMetadata.withSource(EventSource.GAMIFICATION_ENGINE);
    expect(gamificationMetadata.correlationId).toBe(correlationId);
    expect(gamificationMetadata.source).toBe(EventSource.GAMIFICATION_ENGINE);
  });

  it('should support OpenTelemetry trace IDs', () => {
    // Simulate incoming request with trace ID
    const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
    const incomingMetadata = new EventMetadataDto({
      traceId,
      source: EventSource.API_GATEWAY
    });

    // Simulate passing trace ID to downstream service
    const healthServiceMetadata = incomingMetadata.withSource(EventSource.HEALTH_SERVICE);
    expect(healthServiceMetadata.traceId).toBe(traceId);

    // Simulate adding correlation ID while preserving trace ID
    const correlationId = uuidv4();
    const enhancedMetadata = healthServiceMetadata.withCorrelation(correlationId);
    expect(enhancedMetadata.traceId).toBe(traceId);
    expect(enhancedMetadata.correlationId).toBe(correlationId);
  });

  it('should support error propagation with context', () => {
    // Simulate initial metadata
    const correlationId = uuidv4();
    const userId = 'user-123';
    const metadata = createEventMetadata(correlationId, {
      userId,
      source: EventSource.HEALTH_SERVICE
    });

    // Simulate error occurring
    const error = new Error('Database connection failed');
    const errorContext = { 
      dbHost: 'db.example.com',
      operation: 'fetchHealthMetrics'
    };

    // Add error and context to metadata
    const errorMetadata = metadata
      .withError(error)
      .withContext(errorContext);

    // Verify error information is preserved
    expect(errorMetadata.correlationId).toBe(correlationId);
    expect(errorMetadata.userId).toBe(userId);
    expect(errorMetadata.error).toBeDefined();
    expect(errorMetadata.error.message).toBe(error.message);
    expect(errorMetadata.context).toEqual(errorContext);

    // Simulate passing to error handling service
    const notificationMetadata = errorMetadata.withSource(EventSource.NOTIFICATION_SERVICE);
    expect(notificationMetadata.error).toBeDefined();
    expect(notificationMetadata.error.message).toBe(error.message);
    expect(notificationMetadata.context).toEqual(errorContext);
  });
});