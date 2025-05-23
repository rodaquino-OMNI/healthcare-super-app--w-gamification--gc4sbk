/**
 * @file event-metadata.dto.spec.ts
 * @description Unit tests for the EventMetadataDto class that validate the metadata structure
 * used across all journey events. Tests verify origin validation, version format, correlation ID
 * structure, and additional context property validation.
 */

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import { EventMetadataDto, EventPriority } from '../../../src/dto/event-metadata.dto';
import {
  createEventMetadataData,
  createEventMetadataDto,
  validateDto,
} from './test-utils';

describe('EventMetadataDto', () => {
  describe('Validation', () => {
    it('should validate a valid metadata object', async () => {
      // Create a complete metadata object with all optional fields
      const metadata = createEventMetadataDto({
        correlationId: `corr-${uuidv4()}`,
        traceId: `trace-${uuidv4()}`,
        spanId: `span-${uuidv4()}`,
        priority: EventPriority.HIGH,
        isRetry: false,
        requestId: `req-${uuidv4()}`,
        sessionId: `sess-${uuidv4()}`,
        deviceId: `device-${uuidv4()}`,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        environment: 'test',
        parentEventId: uuidv4(),
      });

      // Validate the metadata
      const result = await validateDto(metadata);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate an empty metadata object (all fields optional)', async () => {
      const metadata = new EventMetadataDto();
      const result = await validateDto(metadata);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate correlationId as string', async () => {
      const metadata = createEventMetadataDto({
        correlationId: 123 as any, // Invalid type
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('correlationId')).toBe(true);
    });

    it('should validate traceId as string', async () => {
      const metadata = createEventMetadataDto({
        traceId: 123 as any, // Invalid type
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('traceId')).toBe(true);
    });

    it('should validate spanId as string', async () => {
      const metadata = createEventMetadataDto({
        spanId: 123 as any, // Invalid type
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('spanId')).toBe(true);
    });

    it('should validate priority as enum value', async () => {
      const metadata = createEventMetadataDto({
        priority: 'INVALID_PRIORITY' as any, // Invalid enum value
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('priority')).toBe(true);
    });

    it('should validate retryCount as number when isRetry is true', async () => {
      const metadata = createEventMetadataDto({
        isRetry: true,
        // Missing retryCount
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('retryCount')).toBe(true);
    });

    it('should validate retryCount is >= 0', async () => {
      const metadata = createEventMetadataDto({
        isRetry: true,
        retryCount: -1, // Invalid negative value
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('retryCount')).toBe(true);
    });

    it('should not require retryCount when isRetry is false', async () => {
      const metadata = createEventMetadataDto({
        isRetry: false,
        // No retryCount provided
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(true);
      expect(result.hasErrorForProperty('retryCount')).toBe(false);
    });

    it('should validate originalTimestamp as ISO8601 when isRetry is true', async () => {
      const metadata = createEventMetadataDto({
        isRetry: true,
        retryCount: 1,
        originalTimestamp: 'not-a-date', // Invalid date format
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('originalTimestamp')).toBe(true);
    });

    it('should validate parentEventId as UUID', async () => {
      const metadata = createEventMetadataDto({
        parentEventId: 'not-a-uuid', // Invalid UUID format
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('parentEventId')).toBe(true);
    });
  });

  describe('Static Factory Methods', () => {
    describe('create()', () => {
      it('should create a new EventMetadataDto with default values', () => {
        const metadata = EventMetadataDto.create();
        expect(metadata).toBeInstanceOf(EventMetadataDto);
      });

      it('should create a new EventMetadataDto with provided values', () => {
        const testData = {
          correlationId: 'test-correlation-id',
          priority: EventPriority.HIGH,
        };

        const metadata = EventMetadataDto.create(testData);
        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.correlationId).toBe(testData.correlationId);
        expect(metadata.priority).toBe(testData.priority);
      });
    });

    describe('createForRetry()', () => {
      it('should create a retry metadata with correct retry information', () => {
        const originalMetadata = EventMetadataDto.create({
          correlationId: 'test-correlation-id',
          traceId: 'test-trace-id',
          spanId: 'test-span-id',
        });

        const originalTimestamp = new Date().toISOString();
        const retryCount = 3;

        const retryMetadata = EventMetadataDto.createForRetry(
          originalMetadata,
          retryCount,
          originalTimestamp
        );

        expect(retryMetadata).toBeInstanceOf(EventMetadataDto);
        expect(retryMetadata.isRetry).toBe(true);
        expect(retryMetadata.retryCount).toBe(retryCount);
        expect(retryMetadata.originalTimestamp).toBe(originalTimestamp);
        expect(retryMetadata.correlationId).toBe(originalMetadata.correlationId);
        expect(retryMetadata.traceId).toBe(originalMetadata.traceId);
        expect(retryMetadata.spanId).not.toBe(originalMetadata.spanId); // Should generate new span ID
        expect(retryMetadata.spanId).toMatch(/^span-/); // Should start with 'span-'
      });

      it('should use default retry count if not provided', () => {
        const originalMetadata = EventMetadataDto.create({
          correlationId: 'test-correlation-id',
        });

        const retryMetadata = EventMetadataDto.createForRetry(originalMetadata);

        expect(retryMetadata.isRetry).toBe(true);
        expect(retryMetadata.retryCount).toBe(1); // Default value
      });

      it('should preserve original timestamp if not provided', () => {
        const originalTimestamp = new Date().toISOString();
        const originalMetadata = EventMetadataDto.create({
          correlationId: 'test-correlation-id',
          originalTimestamp,
        });

        const retryMetadata = EventMetadataDto.createForRetry(originalMetadata);

        expect(retryMetadata.originalTimestamp).toBe(originalTimestamp);
      });
    });

    describe('createWithCorrelation()', () => {
      it('should create metadata with provided correlation IDs', () => {
        const correlationId = 'test-correlation-id';
        const traceId = 'test-trace-id';
        const spanId = 'test-span-id';

        const metadata = EventMetadataDto.createWithCorrelation(
          correlationId,
          traceId,
          spanId
        );

        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.correlationId).toBe(correlationId);
        expect(metadata.traceId).toBe(traceId);
        expect(metadata.spanId).toBe(spanId);
      });

      it('should generate correlation IDs if not provided', () => {
        const metadata = EventMetadataDto.createWithCorrelation();

        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.correlationId).toMatch(/^corr-/); // Should start with 'corr-'
        expect(metadata.traceId).toMatch(/^trace-/); // Should start with 'trace-'
        expect(metadata.spanId).toMatch(/^span-/); // Should start with 'span-'
      });

      it('should generate missing correlation IDs if some are provided', () => {
        const correlationId = 'test-correlation-id';

        const metadata = EventMetadataDto.createWithCorrelation(correlationId);

        expect(metadata).toBeInstanceOf(EventMetadataDto);
        expect(metadata.correlationId).toBe(correlationId);
        expect(metadata.traceId).toMatch(/^trace-/); // Should be generated
        expect(metadata.spanId).toMatch(/^span-/); // Should be generated
      });
    });

    describe('createChildFromParent()', () => {
      it('should create child metadata with inherited correlation context', () => {
        const parentMetadata = EventMetadataDto.create({
          correlationId: 'test-correlation-id',
          traceId: 'test-trace-id',
          spanId: 'test-span-id',
          parentEventId: 'parent-event-id',
        });

        const childMetadata = EventMetadataDto.createChildFromParent(parentMetadata);

        expect(childMetadata).toBeInstanceOf(EventMetadataDto);
        expect(childMetadata.correlationId).toBe(parentMetadata.correlationId);
        expect(childMetadata.traceId).toBe(parentMetadata.traceId);
        expect(childMetadata.spanId).not.toBe(parentMetadata.spanId); // Should generate new span ID
        expect(childMetadata.spanId).toMatch(/^span-/); // Should start with 'span-'
        expect(childMetadata.parentEventId).toBe(parentMetadata.parentEventId);
      });
    });
  });

  describe('Instance Methods', () => {
    describe('merge()', () => {
      it('should merge additional metadata into the instance', () => {
        const metadata = EventMetadataDto.create({
          correlationId: 'test-correlation-id',
          priority: EventPriority.LOW,
        });

        const additionalMetadata = {
          priority: EventPriority.HIGH, // Should override
          environment: 'production', // Should add
        };

        const mergedMetadata = metadata.merge(additionalMetadata);

        expect(mergedMetadata).toBe(metadata); // Should return the same instance
        expect(mergedMetadata.correlationId).toBe('test-correlation-id');
        expect(mergedMetadata.priority).toBe(EventPriority.HIGH); // Should be updated
        expect(mergedMetadata.environment).toBe('production'); // Should be added
      });

      it('should handle merging with empty object', () => {
        const metadata = EventMetadataDto.create({
          correlationId: 'test-correlation-id',
        });

        const mergedMetadata = metadata.merge({});

        expect(mergedMetadata).toBe(metadata);
        expect(mergedMetadata.correlationId).toBe('test-correlation-id');
      });
    });
  });

  describe('Integration with Distributed Tracing', () => {
    it('should support W3C Trace Context format', async () => {
      // W3C Trace Context format: https://www.w3.org/TR/trace-context/
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const spanId = '00f067aa0ba902b7';
      const traceFlags = '01'; // Sampled

      const metadata = createEventMetadataDto({
        traceId: `trace-${traceId}`,
        spanId: `span-${spanId}`,
        // Additional W3C trace context properties
        traceFlags,
        traceState: 'rojo=00f067aa0ba902b7,congo=t61rcWkgMzE',
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(true);
    });

    it('should support OpenTelemetry context propagation', async () => {
      // OpenTelemetry context format
      const metadata = createEventMetadataDto({
        traceId: 'trace-4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: 'span-00f067aa0ba902b7',
        // OpenTelemetry specific fields
        otelTraceFlags: 1,
        otelTraceState: 'rojo=00f067aa0ba902b7,congo=t61rcWkgMzE',
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(true);
    });

    it('should support correlation with request context', async () => {
      const metadata = createEventMetadataDto({
        correlationId: 'corr-request-123',
        requestId: 'req-123',
        sessionId: 'sess-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      const result = await validateDto(metadata);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Serialization and Deserialization', () => {
    it('should properly deserialize from plain object', () => {
      const plainObject = {
        correlationId: 'test-correlation-id',
        traceId: 'test-trace-id',
        spanId: 'test-span-id',
        priority: EventPriority.MEDIUM,
        isRetry: true,
        retryCount: 2,
        originalTimestamp: new Date().toISOString(),
        customField: 'custom-value',
      };

      const metadata = plainToInstance(EventMetadataDto, plainObject);

      expect(metadata).toBeInstanceOf(EventMetadataDto);
      expect(metadata.correlationId).toBe(plainObject.correlationId);
      expect(metadata.traceId).toBe(plainObject.traceId);
      expect(metadata.spanId).toBe(plainObject.spanId);
      expect(metadata.priority).toBe(plainObject.priority);
      expect(metadata.isRetry).toBe(plainObject.isRetry);
      expect(metadata.retryCount).toBe(plainObject.retryCount);
      expect(metadata.originalTimestamp).toBe(plainObject.originalTimestamp);
      expect(metadata.customField).toBe(plainObject.customField);
    });

    it('should handle additional properties via index signature', () => {
      const metadata = EventMetadataDto.create({
        correlationId: 'test-correlation-id',
      });

      // Add custom properties via index signature
      metadata['customField1'] = 'custom-value-1';
      metadata['customField2'] = 'custom-value-2';
      metadata['nestedObject'] = { key: 'value' };

      expect(metadata['customField1']).toBe('custom-value-1');
      expect(metadata['customField2']).toBe('custom-value-2');
      expect(metadata['nestedObject']).toEqual({ key: 'value' });

      // Validate that custom properties don't affect validation
      validate(metadata).then(errors => {
        expect(errors.length).toBe(0);
      });
    });
  });
});