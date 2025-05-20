import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { Kafka, KafkaMessage, Producer, logLevel } from 'kafkajs';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { VersionDto } from '../../../src/dto/version.dto';

// Mock implementations
const mockSchemaRegistry = {
  register: jest.fn(),
  getSchema: jest.fn(),
  getLatestSchemaId: jest.fn(),
  encode: jest.fn(),
  decode: jest.fn(),
};

const mockProducer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn(),
};

const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
};

// Sample test data
const sampleHealthEvent = {
  userId: '123',
  metricType: 'HEART_RATE',
  value: 75,
  unit: 'bpm',
  timestamp: new Date().toISOString(),
};

const sampleEventMetadata: EventMetadataDto = {
  correlationId: 'corr-123',
  timestamp: new Date().toISOString(),
  source: 'health-service',
  version: '1.0.0',
};

const sampleVersionedEvent: VersionDto<any> = {
  schemaVersion: '1.0.0',
  payload: sampleHealthEvent,
};

describe('Kafka Serialization', () => {
  let kafkaService: KafkaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        {
          provide: SchemaRegistry,
          useValue: mockSchemaRegistry,
        },
        {
          provide: Kafka,
          useValue: mockKafka,
        },
      ],
    }).compile();

    kafkaService = module.get<KafkaService>(KafkaService);
  });

  describe('JSON Serialization', () => {
    it('should serialize an event to JSON format', async () => {
      // Arrange
      const event = sampleHealthEvent;
      const expectedBuffer = Buffer.from(JSON.stringify(event));
      
      // Act
      const result = await kafkaService.serializeToJson(event);
      
      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toEqual(expectedBuffer.toString());
    });

    it('should deserialize JSON data to an event object', async () => {
      // Arrange
      const jsonBuffer = Buffer.from(JSON.stringify(sampleHealthEvent));
      
      // Act
      const result = await kafkaService.deserializeFromJson<typeof sampleHealthEvent>(jsonBuffer);
      
      // Assert
      expect(result).toEqual(sampleHealthEvent);
    });

    it('should validate JSON against a schema during serialization', async () => {
      // Arrange
      const event = sampleHealthEvent;
      const schema = {
        type: 'object',
        required: ['userId', 'metricType', 'value', 'unit', 'timestamp'],
        properties: {
          userId: { type: 'string' },
          metricType: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      };
      
      // Act
      const result = await kafkaService.serializeToJsonWithValidation(event, schema);
      
      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(JSON.parse(result.toString())).toEqual(event);
    });

    it('should throw an error when JSON validation fails', async () => {
      // Arrange
      const invalidEvent = { ...sampleHealthEvent, value: 'not-a-number' };
      const schema = {
        type: 'object',
        required: ['userId', 'metricType', 'value', 'unit', 'timestamp'],
        properties: {
          userId: { type: 'string' },
          metricType: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      };
      
      // Act & Assert
      await expect(kafkaService.serializeToJsonWithValidation(invalidEvent, schema))
        .rejects.toThrow(/validation failed/);
    });
  });

  describe('Avro Serialization', () => {
    const avroSchema = {
      type: 'record',
      name: 'HealthMetric',
      namespace: 'org.austa.health',
      fields: [
        { name: 'userId', type: 'string' },
        { name: 'metricType', type: 'string' },
        { name: 'value', type: 'double' },
        { name: 'unit', type: 'string' },
        { name: 'timestamp', type: 'string' },
      ],
    };

    it('should serialize an event using Avro with schema registry', async () => {
      // Arrange
      const event = sampleHealthEvent;
      const schemaId = 123;
      const encodedBuffer = Buffer.from([0, 0, 0, 0, 123, /* mock avro data */]);
      
      mockSchemaRegistry.getLatestSchemaId.mockResolvedValue(schemaId);
      mockSchemaRegistry.encode.mockResolvedValue(encodedBuffer);
      
      // Act
      const result = await kafkaService.serializeToAvro(event, 'health-metric');
      
      // Assert
      expect(mockSchemaRegistry.getLatestSchemaId).toHaveBeenCalledWith('health-metric');
      expect(mockSchemaRegistry.encode).toHaveBeenCalledWith({
        schemaId,
        payload: event,
      });
      expect(result).toEqual(encodedBuffer);
    });

    it('should deserialize Avro data using schema registry', async () => {
      // Arrange
      const avroBuffer = Buffer.from([0, 0, 0, 0, 123, /* mock avro data */]);
      mockSchemaRegistry.decode.mockResolvedValue(sampleHealthEvent);
      
      // Act
      const result = await kafkaService.deserializeFromAvro(avroBuffer);
      
      // Assert
      expect(mockSchemaRegistry.decode).toHaveBeenCalledWith(avroBuffer);
      expect(result).toEqual(sampleHealthEvent);
    });

    it('should register a new schema if it does not exist', async () => {
      // Arrange
      const event = sampleHealthEvent;
      const schemaId = 456;
      const encodedBuffer = Buffer.from([0, 0, 0, 0, 123, /* mock avro data */]);
      
      mockSchemaRegistry.getLatestSchemaId.mockRejectedValue(new Error('Schema not found'));
      mockSchemaRegistry.register.mockResolvedValue({ id: schemaId });
      mockSchemaRegistry.encode.mockResolvedValue(encodedBuffer);
      
      // Act
      const result = await kafkaService.serializeToAvro(event, 'health-metric', avroSchema);
      
      // Assert
      expect(mockSchemaRegistry.register).toHaveBeenCalledWith({
        type: 'AVRO',
        schema: JSON.stringify(avroSchema),
      });
      expect(mockSchemaRegistry.encode).toHaveBeenCalledWith({
        schemaId,
        payload: event,
      });
      expect(result).toEqual(encodedBuffer);
    });
  });

  describe('Schema Evolution and Compatibility', () => {
    // Original schema
    const originalSchema = {
      type: 'record',
      name: 'HealthMetric',
      namespace: 'org.austa.health',
      fields: [
        { name: 'userId', type: 'string' },
        { name: 'metricType', type: 'string' },
        { name: 'value', type: 'double' },
        { name: 'unit', type: 'string' },
        { name: 'timestamp', type: 'string' },
      ],
    };

    // Evolved schema with a new field (backward compatible)
    const evolvedSchema = {
      type: 'record',
      name: 'HealthMetric',
      namespace: 'org.austa.health',
      fields: [
        { name: 'userId', type: 'string' },
        { name: 'metricType', type: 'string' },
        { name: 'value', type: 'double' },
        { name: 'unit', type: 'string' },
        { name: 'timestamp', type: 'string' },
        { name: 'deviceId', type: ['null', 'string'], default: null },
      ],
    };

    it('should deserialize data with an older schema version', async () => {
      // Arrange
      const originalEvent = sampleHealthEvent;
      const originalBuffer = Buffer.from([0, 0, 0, 0, 123, /* mock avro data */]);
      
      mockSchemaRegistry.decode.mockResolvedValue(originalEvent);
      
      // Act
      const result = await kafkaService.deserializeFromAvroWithSchema(originalBuffer, evolvedSchema);
      
      // Assert
      expect(result).toEqual({ ...originalEvent, deviceId: null });
    });

    it('should serialize data with a newer schema version', async () => {
      // Arrange
      const evolvedEvent = { ...sampleHealthEvent, deviceId: 'device-123' };
      const schemaId = 789;
      const encodedBuffer = Buffer.from([0, 0, 0, 0, 123, /* mock avro data */]);
      
      mockSchemaRegistry.register.mockResolvedValue({ id: schemaId });
      mockSchemaRegistry.encode.mockResolvedValue(encodedBuffer);
      
      // Act
      const result = await kafkaService.serializeToAvro(evolvedEvent, 'health-metric-v2', evolvedSchema);
      
      // Assert
      expect(mockSchemaRegistry.register).toHaveBeenCalledWith({
        type: 'AVRO',
        schema: JSON.stringify(evolvedSchema),
      });
      expect(result).toEqual(encodedBuffer);
    });

    it('should check schema compatibility before registering', async () => {
      // Arrange
      mockSchemaRegistry.getLatestSchemaId.mockResolvedValue(123);
      mockSchemaRegistry.getSchema.mockResolvedValue({
        schema: JSON.stringify(originalSchema),
      });
      
      // Act
      const result = await kafkaService.checkSchemaCompatibility('health-metric', evolvedSchema);
      
      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Header Serialization', () => {
    it('should serialize event metadata to message headers', () => {
      // Arrange
      const metadata = sampleEventMetadata;
      
      // Act
      const headers = kafkaService.serializeHeaders(metadata);
      
      // Assert
      expect(headers).toEqual({
        correlationId: Buffer.from(metadata.correlationId),
        timestamp: Buffer.from(metadata.timestamp),
        source: Buffer.from(metadata.source),
        version: Buffer.from(metadata.version),
      });
    });

    it('should deserialize message headers to event metadata', () => {
      // Arrange
      const kafkaHeaders = {
        correlationId: Buffer.from(sampleEventMetadata.correlationId),
        timestamp: Buffer.from(sampleEventMetadata.timestamp),
        source: Buffer.from(sampleEventMetadata.source),
        version: Buffer.from(sampleEventMetadata.version),
      };
      
      // Act
      const metadata = kafkaService.deserializeHeaders(kafkaHeaders);
      
      // Assert
      expect(metadata).toEqual(sampleEventMetadata);
    });

    it('should handle missing headers gracefully', () => {
      // Arrange
      const incompleteHeaders = {
        correlationId: Buffer.from(sampleEventMetadata.correlationId),
        // Missing other headers
      };
      
      // Act
      const metadata = kafkaService.deserializeHeaders(incompleteHeaders);
      
      // Assert
      expect(metadata.correlationId).toEqual(sampleEventMetadata.correlationId);
      expect(metadata.timestamp).toBeUndefined();
      expect(metadata.source).toBeUndefined();
      expect(metadata.version).toBeUndefined();
    });
  });

  describe('Performance Testing', () => {
    it('should serialize JSON within acceptable time limits', async () => {
      // Arrange
      const event = sampleHealthEvent;
      const iterations = 1000;
      
      // Act
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        await kafkaService.serializeToJson(event);
      }
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
      
      // Assert
      expect(duration / iterations).toBeLessThan(1); // Less than 1ms per operation
    });

    it('should deserialize JSON within acceptable time limits', async () => {
      // Arrange
      const jsonBuffer = Buffer.from(JSON.stringify(sampleHealthEvent));
      const iterations = 1000;
      
      // Act
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        await kafkaService.deserializeFromJson(jsonBuffer);
      }
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
      
      // Assert
      expect(duration / iterations).toBeLessThan(1); // Less than 1ms per operation
    });
  });

  describe('Binary and String Format Conversion', () => {
    it('should convert between string and binary formats', () => {
      // Arrange
      const originalString = JSON.stringify(sampleHealthEvent);
      
      // Act
      const binaryData = kafkaService.stringToBinary(originalString);
      const recoveredString = kafkaService.binaryToString(binaryData);
      
      // Assert
      expect(binaryData).toBeInstanceOf(Buffer);
      expect(recoveredString).toEqual(originalString);
    });

    it('should handle UTF-8 special characters correctly', () => {
      // Arrange
      const specialCharsString = 'Special characters: áéíóú ñ ç ß Ø 你好';
      
      // Act
      const binaryData = kafkaService.stringToBinary(specialCharsString);
      const recoveredString = kafkaService.binaryToString(binaryData);
      
      // Assert
      expect(recoveredString).toEqual(specialCharsString);
    });

    it('should handle empty strings', () => {
      // Arrange
      const emptyString = '';
      
      // Act
      const binaryData = kafkaService.stringToBinary(emptyString);
      const recoveredString = kafkaService.binaryToString(binaryData);
      
      // Assert
      expect(binaryData.length).toBe(0);
      expect(recoveredString).toEqual(emptyString);
    });
  });

  describe('Complete Message Serialization', () => {
    it('should serialize a complete Kafka message with headers and payload', async () => {
      // Arrange
      const event = sampleHealthEvent;
      const metadata = sampleEventMetadata;
      const topic = 'health.events';
      const key = 'user-123';
      
      const mockJsonBuffer = Buffer.from(JSON.stringify(event));
      jest.spyOn(kafkaService, 'serializeToJson').mockResolvedValue(mockJsonBuffer);
      jest.spyOn(kafkaService, 'serializeHeaders').mockReturnValue({
        correlationId: Buffer.from(metadata.correlationId),
        timestamp: Buffer.from(metadata.timestamp),
        source: Buffer.from(metadata.source),
        version: Buffer.from(metadata.version),
      });
      
      // Act
      const message = await kafkaService.createKafkaMessage(topic, event, key, metadata);
      
      // Assert
      expect(message).toEqual({
        topic,
        messages: [
          {
            key: Buffer.from(key),
            value: mockJsonBuffer,
            headers: {
              correlationId: Buffer.from(metadata.correlationId),
              timestamp: Buffer.from(metadata.timestamp),
              source: Buffer.from(metadata.source),
              version: Buffer.from(metadata.version),
            },
          },
        ],
      });
    });

    it('should deserialize a complete Kafka message with headers and payload', async () => {
      // Arrange
      const kafkaMessage: KafkaMessage = {
        key: Buffer.from('user-123'),
        value: Buffer.from(JSON.stringify(sampleHealthEvent)),
        timestamp: '1620000000000',
        size: 100,
        attributes: 0,
        offset: '0',
        headers: {
          correlationId: Buffer.from(sampleEventMetadata.correlationId),
          timestamp: Buffer.from(sampleEventMetadata.timestamp),
          source: Buffer.from(sampleEventMetadata.source),
          version: Buffer.from(sampleEventMetadata.version),
        },
      };
      
      jest.spyOn(kafkaService, 'deserializeFromJson').mockResolvedValue(sampleHealthEvent);
      jest.spyOn(kafkaService, 'deserializeHeaders').mockReturnValue(sampleEventMetadata);
      
      // Act
      const result = await kafkaService.parseKafkaMessage<typeof sampleHealthEvent>(kafkaMessage);
      
      // Assert
      expect(result).toEqual({
        key: 'user-123',
        value: sampleHealthEvent,
        metadata: sampleEventMetadata,
      });
    });
  });

  describe('Versioned Events', () => {
    it('should serialize a versioned event', async () => {
      // Arrange
      const versionedEvent = sampleVersionedEvent;
      const mockJsonBuffer = Buffer.from(JSON.stringify(versionedEvent));
      
      jest.spyOn(kafkaService, 'serializeToJson').mockResolvedValue(mockJsonBuffer);
      
      // Act
      const result = await kafkaService.serializeVersionedEvent(versionedEvent);
      
      // Assert
      expect(kafkaService.serializeToJson).toHaveBeenCalledWith(versionedEvent);
      expect(result).toEqual(mockJsonBuffer);
    });

    it('should deserialize to a versioned event', async () => {
      // Arrange
      const versionedEventBuffer = Buffer.from(JSON.stringify(sampleVersionedEvent));
      
      jest.spyOn(kafkaService, 'deserializeFromJson').mockResolvedValue(sampleVersionedEvent);
      
      // Act
      const result = await kafkaService.deserializeToVersionedEvent<typeof sampleHealthEvent>(versionedEventBuffer);
      
      // Assert
      expect(kafkaService.deserializeFromJson).toHaveBeenCalledWith(versionedEventBuffer);
      expect(result).toEqual(sampleVersionedEvent);
    });

    it('should validate schema version during deserialization', async () => {
      // Arrange
      const oldVersionedEvent = {
        schemaVersion: '0.5.0',
        payload: sampleHealthEvent,
      };
      const versionedEventBuffer = Buffer.from(JSON.stringify(oldVersionedEvent));
      
      jest.spyOn(kafkaService, 'deserializeFromJson').mockResolvedValue(oldVersionedEvent);
      
      // Act & Assert
      await expect(kafkaService.deserializeToVersionedEvent<typeof sampleHealthEvent>(
        versionedEventBuffer,
        { minVersion: '1.0.0' }
      )).rejects.toThrow(/incompatible schema version/);
    });
  });
});