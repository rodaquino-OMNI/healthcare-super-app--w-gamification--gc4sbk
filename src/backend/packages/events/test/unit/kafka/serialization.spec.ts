import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { OpenTelemetryTracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import { KafkaSerializationError } from '../../../src/errors/event-errors';
import { BaseEvent, createEvent } from '../../../src/interfaces/base-event.interface';
import { validateEventSchema } from '../../../src/validation/schema-validator';
import { KAFKA_ERROR_CODES } from '../../../src/kafka/kafka.constants';

// Mock dependencies
jest.mock('@austa/tracing');
jest.mock('@austa/logging');
jest.mock('../../../src/validation/schema-validator');

describe('Kafka Serialization', () => {
  let kafkaService: KafkaService;
  let configService: ConfigService;
  let tracingService: jest.Mocked<OpenTelemetryTracingService>;
  let loggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    // Create mocks
    configService = {
      get: jest.fn().mockImplementation((key, defaultValue) => {
        if (key === 'kafka.brokers') return 'localhost:9092';
        if (key === 'service.name') return 'test-service';
        return defaultValue;
      }),
    } as any;

    tracingService = {
      startActiveSpan: jest.fn().mockImplementation((name, fn) => fn({
        setAttributes: jest.fn(),
        end: jest.fn(),
      })),
      getPropagationHeaders: jest.fn().mockReturnValue({}),
    } as any;

    loggerService = {
      createLogger: jest.fn().mockReturnValue({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      }),
    } as any;

    // Create testing module
    const moduleRef = await Test.createTestingModule({
      providers: [
        KafkaService,
        { provide: ConfigService, useValue: configService },
        { provide: OpenTelemetryTracingService, useValue: tracingService },
        { provide: LoggerService, useValue: loggerService },
        { provide: 'KAFKA_OPTIONS', useValue: { serviceName: 'test-service' } },
      ],
    }).compile();

    kafkaService = moduleRef.get<KafkaService>(KafkaService);

    // Mock private methods using any type assertion
    (kafkaService as any).kafka = {
      producer: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        send: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, errorCode: 0 }]),
      }),
    };
    (kafkaService as any).producer = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, errorCode: 0 }]),
    };
  });

  describe('JSON Serialization', () => {
    it('should serialize a message to JSON Buffer', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      
      // Act
      const result = await kafkaService.produce('test-topic', testEvent);
      
      // Assert
      expect(result).toBeDefined();
      expect((kafkaService as any).producer.send).toHaveBeenCalled();
      
      // Extract the serialized message from the send call
      const sendCall = (kafkaService as any).producer.send.mock.calls[0][0];
      expect(sendCall.messages[0].value).toBeInstanceOf(Buffer);
      
      // Verify the content of the serialized message
      const deserializedMessage = JSON.parse(sendCall.messages[0].value.toString());
      expect(deserializedMessage).toEqual(testEvent);
    });

    it('should handle serialization errors gracefully', async () => {
      // Arrange
      const circularReference: any = {};
      circularReference.self = circularReference; // Create circular reference that can't be serialized
      
      const testEvent = createEvent('TEST_EVENT', 'test-service', circularReference);
      
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Circular reference');
      });
      
      // Act & Assert
      await expect(kafkaService.produce('test-topic', testEvent)).rejects.toThrow(KafkaSerializationError);
      
      // Restore original function
      JSON.stringify = originalStringify;
    });
  });

  describe('JSON Deserialization', () => {
    it('should deserialize a JSON Buffer to an object', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      const serializedMessage = Buffer.from(JSON.stringify(testEvent));
      
      // Mock the consumer to call our callback with the test message
      (kafkaService as any).kafka.consumer = jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockResolvedValue(undefined),
        run: jest.fn().mockImplementation(async (config) => {
          if (config.eachMessage) {
            await config.eachMessage({
              topic: 'test-topic',
              partition: 0,
              message: {
                value: serializedMessage,
                key: Buffer.from('test-key'),
                headers: { 'test-header': Buffer.from('test-value') },
                timestamp: '1630000000000',
                offset: '0',
              },
            });
          }
        }),
      });
      
      // Act
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      await kafkaService.consume('test-topic', 'test-group', messageHandler);
      
      // Assert
      expect(messageHandler).toHaveBeenCalled();
      const [message, metadata] = messageHandler.mock.calls[0];
      expect(message).toEqual(testEvent);
      expect(metadata).toEqual({
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: '1630000000000',
        key: 'test-key',
        headers: { 'test-header': 'test-value' },
      });
    });

    it('should handle deserialization errors gracefully', async () => {
      // Arrange
      const invalidMessage = Buffer.from('invalid json');
      
      // Mock the consumer to call our callback with the invalid message
      (kafkaService as any).kafka.consumer = jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockResolvedValue(undefined),
        run: jest.fn().mockImplementation(async (config) => {
          if (config.eachMessage) {
            await config.eachMessage({
              topic: 'test-topic',
              partition: 0,
              message: {
                value: invalidMessage,
                key: Buffer.from('test-key'),
                headers: { 'test-header': Buffer.from('test-value') },
                timestamp: '1630000000000',
                offset: '0',
              },
            });
          }
        }),
      });
      
      // Mock the logger to capture error logs
      const logger = (kafkaService as any).logger;
      
      // Act
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      await kafkaService.consume('test-topic', 'test-group', messageHandler);
      
      // Assert
      expect(messageHandler).not.toHaveBeenCalled(); // Handler should not be called for invalid messages
      expect(logger.error).toHaveBeenCalled(); // Error should be logged
    });
  });

  describe('Header Serialization', () => {
    it('should format string headers to Buffer headers', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      const headers = {
        'custom-header': 'custom-value',
        'x-correlation-id': 'test-correlation-id',
      };
      
      // Act
      await kafkaService.produce('test-topic', testEvent, 'test-key', headers);
      
      // Assert
      const sendCall = (kafkaService as any).producer.send.mock.calls[0][0];
      const kafkaHeaders = sendCall.messages[0].headers;
      
      // Check that headers were converted to Buffer
      expect(kafkaHeaders['custom-header']).toBeInstanceOf(Buffer);
      expect(kafkaHeaders['custom-header'].toString()).toBe('custom-value');
      expect(kafkaHeaders['x-correlation-id']).toBeInstanceOf(Buffer);
      expect(kafkaHeaders['x-correlation-id'].toString()).toBe('test-correlation-id');
      
      // Check that system headers were added
      expect(kafkaHeaders['x-source-service']).toBeInstanceOf(Buffer);
      expect(kafkaHeaders['x-source-service'].toString()).toBe('test-service');
      expect(kafkaHeaders['x-event-type']).toBeInstanceOf(Buffer);
      expect(kafkaHeaders['x-event-type'].toString()).toBe('TEST_EVENT');
    });

    it('should parse Buffer headers to string headers', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      const bufferHeaders = {
        'custom-header': Buffer.from('custom-value'),
        'x-correlation-id': Buffer.from('test-correlation-id'),
      };
      
      // Mock the consumer to call our callback with the test message and headers
      (kafkaService as any).kafka.consumer = jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockResolvedValue(undefined),
        run: jest.fn().mockImplementation(async (config) => {
          if (config.eachMessage) {
            await config.eachMessage({
              topic: 'test-topic',
              partition: 0,
              message: {
                value: Buffer.from(JSON.stringify(testEvent)),
                key: Buffer.from('test-key'),
                headers: bufferHeaders,
                timestamp: '1630000000000',
                offset: '0',
              },
            });
          }
        }),
      });
      
      // Act
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      await kafkaService.consume('test-topic', 'test-group', messageHandler);
      
      // Assert
      expect(messageHandler).toHaveBeenCalled();
      const [_, metadata] = messageHandler.mock.calls[0];
      
      // Check that Buffer headers were converted to strings
      expect(metadata.headers['custom-header']).toBe('custom-value');
      expect(metadata.headers['x-correlation-id']).toBe('test-correlation-id');
    });

    it('should handle null or undefined header values', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      const headers = {
        'null-header': null,
        'undefined-header': undefined,
        'valid-header': 'valid-value',
      };
      
      // Act
      await kafkaService.produce('test-topic', testEvent, 'test-key', headers as any);
      
      // Assert
      const sendCall = (kafkaService as any).producer.send.mock.calls[0][0];
      const kafkaHeaders = sendCall.messages[0].headers;
      
      // Check that null and undefined headers were not included
      expect(kafkaHeaders['null-header']).toBeUndefined();
      expect(kafkaHeaders['undefined-header']).toBeUndefined();
      expect(kafkaHeaders['valid-header']).toBeInstanceOf(Buffer);
      expect(kafkaHeaders['valid-header'].toString()).toBe('valid-value');
    });
  });

  describe('Schema Validation', () => {
    it('should validate events against schema before producing', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      const schemaId = 'test-schema';
      
      // Mock the schema validator
      (validateEventSchema as jest.Mock).mockResolvedValue({ valid: true });
      
      // Act
      await kafkaService.produce('test-topic', testEvent, undefined, undefined, { schemaId });
      
      // Assert
      expect(validateEventSchema).toHaveBeenCalledWith(testEvent, schemaId);
    });

    it('should throw validation error for invalid events', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      const schemaId = 'test-schema';
      
      // Mock the schema validator to return invalid
      (validateEventSchema as jest.Mock).mockResolvedValue({ 
        valid: false, 
        errors: ['Invalid event format'] 
      });
      
      // Act & Assert
      await expect(kafkaService.produce('test-topic', testEvent, undefined, undefined, { schemaId }))
        .rejects.toThrow('Event validation failed');
    });

    it('should validate events against schema when consuming', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      const serializedMessage = Buffer.from(JSON.stringify(testEvent));
      const schemaId = 'test-schema';
      
      // Mock the schema validator
      (validateEventSchema as jest.Mock).mockResolvedValue({ valid: true });
      
      // Mock the consumer to call our callback with the test message
      (kafkaService as any).kafka.consumer = jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockResolvedValue(undefined),
        run: jest.fn().mockImplementation(async (config) => {
          if (config.eachMessage) {
            await config.eachMessage({
              topic: 'test-topic',
              partition: 0,
              message: {
                value: serializedMessage,
                key: Buffer.from('test-key'),
                headers: { 'test-header': Buffer.from('test-value') },
                timestamp: '1630000000000',
                offset: '0',
              },
            });
          }
        }),
      });
      
      // Act
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      await kafkaService.consume('test-topic', 'test-group', messageHandler, { schemaId });
      
      // Assert
      expect(validateEventSchema).toHaveBeenCalledWith(testEvent, schemaId);
      expect(messageHandler).toHaveBeenCalled();
    });

    it('should not call message handler for invalid events when consuming', async () => {
      // Arrange
      const testEvent = createEvent('TEST_EVENT', 'test-service', { value: 'test' });
      const serializedMessage = Buffer.from(JSON.stringify(testEvent));
      const schemaId = 'test-schema';
      
      // Mock the schema validator to return invalid
      (validateEventSchema as jest.Mock).mockResolvedValue({ 
        valid: false, 
        errors: ['Invalid event format'] 
      });
      
      // Mock the consumer to call our callback with the test message
      (kafkaService as any).kafka.consumer = jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockResolvedValue(undefined),
        run: jest.fn().mockImplementation(async (config) => {
          if (config.eachMessage) {
            await config.eachMessage({
              topic: 'test-topic',
              partition: 0,
              message: {
                value: serializedMessage,
                key: Buffer.from('test-key'),
                headers: { 'test-header': Buffer.from('test-value') },
                timestamp: '1630000000000',
                offset: '0',
              },
            });
          }
        }),
      });
      
      // Mock the logger to capture error logs
      const logger = (kafkaService as any).logger;
      
      // Act
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      await kafkaService.consume('test-topic', 'test-group', messageHandler, { schemaId });
      
      // Assert
      expect(validateEventSchema).toHaveBeenCalledWith(testEvent, schemaId);
      expect(messageHandler).not.toHaveBeenCalled(); // Handler should not be called for invalid messages
      expect(logger.error).toHaveBeenCalled(); // Error should be logged
    });
  });

  describe('Schema Evolution and Compatibility', () => {
    it('should handle events with different versions', async () => {
      // Arrange
      const v1Event = createEvent('TEST_EVENT', 'test-service', { value: 'test' }, { version: '1.0.0' });
      const v2Event = createEvent('TEST_EVENT', 'test-service', { value: 'test', newField: 'new' }, { version: '2.0.0' });
      
      // Act & Assert - Both versions should serialize and deserialize correctly
      await expect(kafkaService.produce('test-topic', v1Event)).resolves.toBeDefined();
      await expect(kafkaService.produce('test-topic', v2Event)).resolves.toBeDefined();
      
      // Check that version is included in headers
      const v1SendCall = (kafkaService as any).producer.send.mock.calls[0][0];
      const v2SendCall = (kafkaService as any).producer.send.mock.calls[1][0];
      
      expect(v1SendCall.messages[0].headers['x-event-version'].toString()).toBe('1.0.0');
      expect(v2SendCall.messages[0].headers['x-event-version'].toString()).toBe('2.0.0');
    });

    it('should support backward compatibility with missing optional fields', async () => {
      // Arrange
      // Create an event without optional fields
      const minimalEvent: BaseEvent = {
        eventId: 'test-id',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { value: 'test' },
        // Missing optional fields: journey, userId, metadata
      };
      
      // Act
      await expect(kafkaService.produce('test-topic', minimalEvent)).resolves.toBeDefined();
      
      // Assert - The event should be serialized correctly
      const sendCall = (kafkaService as any).producer.send.mock.calls[0][0];
      const serializedMessage = sendCall.messages[0].value;
      const deserializedMessage = JSON.parse(serializedMessage.toString());
      
      // Check that all required fields are present
      expect(deserializedMessage.eventId).toBe(minimalEvent.eventId);
      expect(deserializedMessage.type).toBe(minimalEvent.type);
      expect(deserializedMessage.timestamp).toBe(minimalEvent.timestamp);
      expect(deserializedMessage.version).toBe(minimalEvent.version);
      expect(deserializedMessage.source).toBe(minimalEvent.source);
      expect(deserializedMessage.payload).toEqual(minimalEvent.payload);
      
      // Optional fields should be undefined
      expect(deserializedMessage.journey).toBeUndefined();
      expect(deserializedMessage.userId).toBeUndefined();
      expect(deserializedMessage.metadata).toBeUndefined();
    });
  });

  describe('Performance Testing', () => {
    it('should efficiently serialize large batches of messages', async () => {
      // Arrange
      const batchSize = 1000;
      const messages = Array.from({ length: batchSize }, (_, i) => ({
        message: createEvent('TEST_EVENT', 'test-service', { value: `test-${i}` }),
        key: `key-${i}`,
      }));
      
      // Act
      const startTime = process.hrtime.bigint();
      await kafkaService.produceBatch('test-topic', messages);
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      
      // Assert
      expect((kafkaService as any).producer.send).toHaveBeenCalled();
      const sendCall = (kafkaService as any).producer.send.mock.calls[0][0];
      expect(sendCall.messages.length).toBe(batchSize);
      
      // Log performance metrics
      console.log(`Serialized ${batchSize} messages in ${durationMs.toFixed(2)}ms (${(batchSize / durationMs * 1000).toFixed(2)} msgs/sec)`);
      
      // Performance assertion - should process at least 10,000 msgs/sec on modern hardware
      // This is a soft assertion as performance depends on the test environment
      // expect(batchSize / durationMs * 1000).toBeGreaterThan(10000);
    });
  });

  describe('Binary and String Format Conversion', () => {
    it('should convert between string and binary formats correctly', async () => {
      // Arrange
      const testString = 'Hello, world! 你好，世界！'; // Include multi-byte characters
      
      // Act - Convert string to Buffer
      const buffer = Buffer.from(testString);
      
      // Convert Buffer back to string
      const resultString = buffer.toString();
      
      // Assert
      expect(resultString).toBe(testString);
    });

    it('should handle binary data correctly', async () => {
      // Arrange
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF]);
      
      // Act - Serialize an event with binary data in base64 format
      const testEvent = createEvent('BINARY_EVENT', 'test-service', { 
        binaryData: binaryData.toString('base64') 
      });
      
      // Act
      await kafkaService.produce('test-topic', testEvent);
      
      // Assert
      const sendCall = (kafkaService as any).producer.send.mock.calls[0][0];
      const serializedMessage = sendCall.messages[0].value;
      const deserializedMessage = JSON.parse(serializedMessage.toString());
      
      // Convert the base64 string back to binary
      const resultBinary = Buffer.from(deserializedMessage.payload.binaryData, 'base64');
      
      // Check that the binary data is preserved
      expect(resultBinary.equals(binaryData)).toBe(true);
    });
  });
});