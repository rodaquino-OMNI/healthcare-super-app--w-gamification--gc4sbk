/**
 * Provides utilities for serializing and deserializing Kafka messages with type safety.
 * Handles JSON transformation, schema validation against @austa/interfaces types,
 * and preserves message metadata across the wire.
 */
import { Logger } from '@nestjs/common';
import { KafkaMessage, Message } from 'kafkajs';
import * as zlib from 'zlib';
import { promisify } from 'util';

// Import interfaces from the shared package
import { GamificationEvent } from '@austa/interfaces/gamification';
import { ValidationError } from '@austa/errors';

// Compression utilities
const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

// Constants
const COMPRESSION_THRESHOLD = 1024 * 10; // 10KB
const COMPRESSION_HEADER = 'compression';
const COMPRESSION_GZIP = 'gzip';

/**
 * Options for message serialization
 */
export interface SerializationOptions {
  /**
   * Whether to compress large messages
   * @default true
   */
  compress?: boolean;
  
  /**
   * Size threshold in bytes for compression
   * @default 10240 (10KB)
   */
  compressionThreshold?: number;
  
  /**
   * Additional headers to include with the message
   */
  headers?: Record<string, string>;
}

/**
 * Default serialization options
 */
const defaultOptions: SerializationOptions = {
  compress: true,
  compressionThreshold: COMPRESSION_THRESHOLD,
  headers: {},
};

/**
 * Class responsible for serializing and deserializing Kafka messages
 * with type safety and schema validation.
 */
export class MessageSerializer {
  private readonly logger = new Logger(MessageSerializer.name);

  /**
   * Serializes an event into a Kafka message
   * 
   * @param event The event to serialize
   * @param options Serialization options
   * @returns A Kafka message ready to be sent
   * 
   * @throws ValidationError if the event fails schema validation
   */
  public async serialize<T extends GamificationEvent>(
    event: T,
    options: SerializationOptions = {}
  ): Promise<Message> {
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      // Validate the event against its schema
      this.validateEvent(event);
      
      // Convert to JSON string
      const jsonString = JSON.stringify(event);
      
      // Determine if compression should be applied
      const shouldCompress = 
        mergedOptions.compress && 
        Buffer.byteLength(jsonString) > (mergedOptions.compressionThreshold || COMPRESSION_THRESHOLD);
      
      // Prepare the message value
      let value: Buffer;
      const headers: Record<string, Buffer> = {};
      
      // Apply compression if needed
      if (shouldCompress) {
        value = await gzipAsync(Buffer.from(jsonString));
        headers[COMPRESSION_HEADER] = Buffer.from(COMPRESSION_GZIP);
        this.logger.debug(`Compressed message from ${jsonString.length} to ${value.length} bytes`);
      } else {
        value = Buffer.from(jsonString);
      }
      
      // Add custom headers
      if (mergedOptions.headers) {
        Object.entries(mergedOptions.headers).forEach(([key, val]) => {
          headers[key] = Buffer.from(val);
        });
      }
      
      // Add event type as header for easier routing
      headers['eventType'] = Buffer.from(event.type);
      
      // Add event ID as header for tracing
      if (event.eventId) {
        headers['eventId'] = Buffer.from(event.eventId);
      }
      
      // Add correlation ID if present
      if (event.metadata?.correlationId) {
        headers['correlationId'] = Buffer.from(event.metadata.correlationId);
      }
      
      return {
        value,
        headers,
      };
    } catch (error) {
      this.logger.error(`Failed to serialize event: ${error.message}`, error.stack);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        'Failed to serialize event',
        { originalError: error, event }
      );
    }
  }

  /**
   * Deserializes a Kafka message into a typed event
   * 
   * @param message The Kafka message to deserialize
   * @returns The deserialized event with proper typing
   * 
   * @throws ValidationError if the message cannot be deserialized or fails schema validation
   */
  public async deserialize<T extends GamificationEvent>(
    message: KafkaMessage
  ): Promise<T> {
    try {
      if (!message.value) {
        throw new ValidationError('Empty message value');
      }
      
      // Check if message is compressed
      const isCompressed = 
        message.headers && 
        message.headers[COMPRESSION_HEADER] && 
        Buffer.from(message.headers[COMPRESSION_HEADER]).toString() === COMPRESSION_GZIP;
      
      // Decompress if needed
      let jsonString: string;
      if (isCompressed) {
        const decompressed = await gunzipAsync(message.value);
        jsonString = decompressed.toString('utf8');
        this.logger.debug(`Decompressed message from ${message.value.length} to ${jsonString.length} bytes`);
      } else {
        jsonString = message.value.toString('utf8');
      }
      
      // Parse JSON
      const event = JSON.parse(jsonString) as T;
      
      // Validate the deserialized event
      this.validateEvent(event);
      
      // Enhance the event with metadata from headers if not already present
      this.enhanceEventWithHeaders(event, message.headers);
      
      return event;
    } catch (error) {
      this.logger.error(`Failed to deserialize message: ${error.message}`, error.stack);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        'Failed to deserialize message',
        { originalError: error, messageHeaders: message.headers }
      );
    }
  }

  /**
   * Validates that an event conforms to the expected schema
   * 
   * @param event The event to validate
   * @throws ValidationError if validation fails
   */
  private validateEvent<T extends GamificationEvent>(event: T): void {
    // Basic structure validation
    if (!event) {
      throw new ValidationError('Event cannot be null or undefined');
    }
    
    if (typeof event !== 'object') {
      throw new ValidationError('Event must be an object');
    }
    
    // Required fields validation
    const requiredFields = ['type', 'timestamp', 'source', 'version'];
    for (const field of requiredFields) {
      if (!event[field]) {
        throw new ValidationError(`Event is missing required field: ${field}`);
      }
    }
    
    // Type-specific validation
    this.validateEventType(event);
  }

  /**
   * Validates event based on its specific type
   * 
   * @param event The event to validate
   * @throws ValidationError if validation fails
   */
  private validateEventType<T extends GamificationEvent>(event: T): void {
    // This could be extended with more specific validation logic based on event type
    // For example, checking that health metrics have valid units, or appointments have valid dates
    
    // For now, we just ensure the payload exists
    if (!event.payload) {
      throw new ValidationError('Event payload is missing');
    }
    
    // Additional validation could be implemented here, potentially using
    // schema validation libraries like Joi, Zod, or class-validator
  }

  /**
   * Enhances an event with metadata from Kafka message headers
   * 
   * @param event The event to enhance
   * @param headers The Kafka message headers
   */
  private enhanceEventWithHeaders<T extends GamificationEvent>(
    event: T,
    headers: Record<string, Buffer> | undefined
  ): void {
    if (!headers) return;
    
    // Initialize metadata if not present
    if (!event.metadata) {
      event.metadata = {};
    }
    
    // Add correlation ID if present in headers but not in event
    if (headers['correlationId'] && !event.metadata.correlationId) {
      event.metadata.correlationId = Buffer.from(headers['correlationId']).toString();
    }
    
    // Add other relevant headers as metadata
    const metadataHeaders = ['traceId', 'spanId', 'parentSpanId', 'tenantId'];
    for (const header of metadataHeaders) {
      if (headers[header] && !event.metadata[header]) {
        event.metadata[header] = Buffer.from(headers[header]).toString();
      }
    }
  }
}