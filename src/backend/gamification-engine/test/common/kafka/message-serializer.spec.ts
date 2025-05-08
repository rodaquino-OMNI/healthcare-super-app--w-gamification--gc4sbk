import { Test } from '@nestjs/testing';
import { MessageSerializer, SerializationOptions } from '../../../src/common/kafka/message-serializer';
import { ValidationError } from '@austa/errors';
import * as zlib from 'zlib';
import { promisify } from 'util';

// Mock GamificationEvent type for testing
const mockEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'HEALTH_METRIC_RECORDED',
  timestamp: new Date().toISOString(),
  source: 'health-service',
  version: '1.0.0',
  payload: {
    userId: 'user123',
    metricType: 'STEPS',
    value: 10000,
    unit: 'count',
    recordedAt: new Date().toISOString(),
  },
  metadata: {
    correlationId: 'corr-123',
  },
};

const gzipAsync = promisify(zlib.gzip);

describe('MessageSerializer', () => {
  let serializer: MessageSerializer;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MessageSerializer],
    }).compile();

    serializer = moduleRef.get<MessageSerializer>(MessageSerializer);
  });

  describe('serialize', () => {
    it('should serialize an event into a Kafka message', async () => {
      const result = await serializer.serialize(mockEvent);
      
      expect(result).toBeDefined();
      expect(result.value).toBeInstanceOf(Buffer);
      expect(result.headers).toBeDefined();
      expect(result.headers.eventType).toEqual(Buffer.from('HEALTH_METRIC_RECORDED'));
      expect(result.headers.eventId).toEqual(Buffer.from(mockEvent.eventId));
      expect(result.headers.correlationId).toEqual(Buffer.from(mockEvent.metadata.correlationId));
    });

    it('should add custom headers when provided', async () => {
      const options: SerializationOptions = {
        headers: {
          'custom-header': 'custom-value',
        },
      };

      const result = await serializer.serialize(mockEvent, options);
      
      expect(result.headers['custom-header']).toEqual(Buffer.from('custom-value'));
    });

    it('should compress large messages when compression is enabled', async () => {
      // Create a large event payload
      const largeEvent = {
        ...mockEvent,
        payload: {
          ...mockEvent.payload,
          // Add a large data field to trigger compression
          largeData: Array(20000).fill('x').join(''),
        },
      };

      const options: SerializationOptions = {
        compress: true,
        compressionThreshold: 100, // Set a low threshold to ensure compression
      };

      const result = await serializer.serialize(largeEvent, options);
      
      expect(result.headers.compression).toEqual(Buffer.from('gzip'));
      
      // The compressed size should be smaller than the JSON string
      const jsonSize = Buffer.byteLength(JSON.stringify(largeEvent));
      expect(result.value.length).toBeLessThan(jsonSize);
    });

    it('should not compress small messages even when compression is enabled', async () => {
      const options: SerializationOptions = {
        compress: true,
        compressionThreshold: 1000000, // Set a high threshold to prevent compression
      };

      const result = await serializer.serialize(mockEvent, options);
      
      expect(result.headers.compression).toBeUndefined();
    });

    it('should throw ValidationError for invalid events', async () => {
      const invalidEvent = {
        // Missing required fields
        type: 'INVALID_EVENT',
      };

      await expect(serializer.serialize(invalidEvent as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('deserialize', () => {
    it('should deserialize a Kafka message into an event', async () => {
      // First serialize an event
      const serialized = await serializer.serialize(mockEvent);
      
      // Then deserialize it
      const result = await serializer.deserialize({
        key: Buffer.from('test-key'),
        value: serialized.value,
        headers: serialized.headers,
        timestamp: '0',
        offset: '0',
        partition: 0,
        topic: 'test-topic',
      });
      
      expect(result).toEqual(mockEvent);
    });

    it('should deserialize compressed messages', async () => {
      // Create a compressed message manually
      const jsonString = JSON.stringify(mockEvent);
      const compressedValue = await gzipAsync(Buffer.from(jsonString));
      
      const result = await serializer.deserialize({
        key: Buffer.from('test-key'),
        value: compressedValue,
        headers: {
          compression: Buffer.from('gzip'),
          eventType: Buffer.from(mockEvent.type),
        },
        timestamp: '0',
        offset: '0',
        partition: 0,
        topic: 'test-topic',
      });
      
      expect(result).toEqual(mockEvent);
    });

    it('should enhance events with metadata from headers', async () => {
      // Create an event without metadata
      const eventWithoutMetadata = {
        ...mockEvent,
        metadata: undefined,
      };
      
      // Serialize it
      const serialized = await serializer.serialize(eventWithoutMetadata);
      
      // Add additional headers
      serialized.headers.traceId = Buffer.from('trace-123');
      serialized.headers.correlationId = Buffer.from('corr-456');
      
      // Deserialize it
      const result = await serializer.deserialize({
        key: Buffer.from('test-key'),
        value: serialized.value,
        headers: serialized.headers,
        timestamp: '0',
        offset: '0',
        partition: 0,
        topic: 'test-topic',
      });
      
      // Check that metadata was added from headers
      expect(result.metadata).toBeDefined();
      expect(result.metadata.correlationId).toEqual('corr-456');
      expect(result.metadata.traceId).toEqual('trace-123');
    });

    it('should throw ValidationError for empty messages', async () => {
      await expect(serializer.deserialize({
        key: Buffer.from('test-key'),
        value: null,
        headers: {},
        timestamp: '0',
        offset: '0',
        partition: 0,
        topic: 'test-topic',
      } as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for malformed JSON', async () => {
      await expect(serializer.deserialize({
        key: Buffer.from('test-key'),
        value: Buffer.from('not-valid-json'),
        headers: {},
        timestamp: '0',
        offset: '0',
        partition: 0,
        topic: 'test-topic',
      })).rejects.toThrow(ValidationError);
    });
  });
});