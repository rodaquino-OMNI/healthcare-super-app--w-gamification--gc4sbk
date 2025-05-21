import { z } from 'zod';
import { GamificationEvent, EventVersion } from '@austa/interfaces/gamification/events';
import { KafkaEvent, KafkaHeaders, baseKafkaEventSchema, journeyKafkaEventSchema } from '../../events/kafka/event.types';

/**
 * Options for message serialization
 */
export interface SerializationOptions {
  /** Whether to compress the message (default: false) */
  compress?: boolean;
  /** Compression level (1-9, default: 6) */
  compressionLevel?: number;
  /** Content type to set in headers (default: 'application/json') */
  contentType?: string;
  /** Whether to validate the message against its schema (default: true) */
  validate?: boolean;
}

/**
 * Default serialization options
 */
const DEFAULT_SERIALIZATION_OPTIONS: SerializationOptions = {
  compress: false,
  compressionLevel: 6,
  contentType: 'application/json',
  validate: true,
};

/**
 * Options for message deserialization
 */
export interface DeserializationOptions {
  /** Whether to decompress the message (default: auto-detect) */
  decompress?: boolean;
  /** Whether to validate the message against its schema (default: true) */
  validate?: boolean;
  /** Whether to throw an error if validation fails (default: true) */
  throwOnInvalid?: boolean;
};

/**
 * Default deserialization options
 */
const DEFAULT_DESERIALIZATION_OPTIONS: DeserializationOptions = {
  decompress: undefined, // auto-detect
  validate: true,
  throwOnInvalid: true,
};

/**
 * Error thrown when message serialization or deserialization fails
 */
export class MessageSerializationError extends Error {
  /** Original error that caused the serialization failure */
  public readonly originalError?: Error;
  /** Path to the error in the message object */
  public readonly path?: string[];
  /** Error code for programmatic handling */
  public readonly code: string;

  /**
   * Creates a new MessageSerializationError
   * @param message Error message
   * @param code Error code
   * @param originalError Original error that caused the serialization failure
   * @param path Path to the error in the message object
   */
  constructor(message: string, code: string, originalError?: Error, path?: string[]) {
    super(message);
    this.name = 'MessageSerializationError';
    this.code = code;
    this.originalError = originalError;
    this.path = path;
  }
}

/**
 * Result of message validation
 */
export interface ValidationResult<T> {
  /** Whether the validation was successful */
  valid: boolean;
  /** The validated message (if successful) */
  message?: T;
  /** Error details (if unsuccessful) */
  error?: {
    /** Error message */
    message: string;
    /** Path to the error in the message object */
    path?: string[];
    /** Error code for programmatic handling */
    code: string;
  };
}

/**
 * Utility class for serializing and deserializing Kafka messages with type safety
 */
export class MessageSerializer {
  /**
   * Serializes a message to a Buffer for sending to Kafka
   * @param message Message to serialize
   * @param options Serialization options
   * @returns Serialized message as a Buffer
   * @throws MessageSerializationError if serialization fails
   */
  public static serialize<T>(message: KafkaEvent<T>, options?: SerializationOptions): Buffer {
    const opts = { ...DEFAULT_SERIALIZATION_OPTIONS, ...options };

    try {
      // Validate message against schema if requested
      if (opts.validate) {
        this.validateMessage(message);
      }

      // Convert message to JSON string
      const jsonString = JSON.stringify(message);

      // Compress if requested
      if (opts.compress) {
        return this.compressMessage(jsonString, opts.compressionLevel);
      }

      // Return as Buffer
      return Buffer.from(jsonString, 'utf8');
    } catch (error) {
      if (error instanceof MessageSerializationError) {
        throw error;
      }

      throw new MessageSerializationError(
        `Failed to serialize message: ${error instanceof Error ? error.message : String(error)}`,
        'SERIALIZATION_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Deserializes a Buffer from Kafka to a typed message
   * @param buffer Buffer to deserialize
   * @param options Deserialization options
   * @returns Deserialized message
   * @throws MessageSerializationError if deserialization fails and throwOnInvalid is true
   */
  public static deserialize<T>(buffer: Buffer, options?: DeserializationOptions): KafkaEvent<T> {
    const opts = { ...DEFAULT_DESERIALIZATION_OPTIONS, ...options };

    try {
      // Check if message is compressed
      const isCompressed = this.isCompressedMessage(buffer);
      const shouldDecompress = opts.decompress !== undefined ? opts.decompress : isCompressed;

      // Decompress if needed
      const jsonString = shouldDecompress
        ? this.decompressMessage(buffer).toString('utf8')
        : buffer.toString('utf8');

      // Parse JSON
      const message = JSON.parse(jsonString) as KafkaEvent<T>;

      // Validate message against schema if requested
      if (opts.validate) {
        const validationResult = this.validateMessageSafe<T>(message);
        if (!validationResult.valid && opts.throwOnInvalid) {
          throw new MessageSerializationError(
            validationResult.error?.message || 'Invalid message format',
            validationResult.error?.code || 'INVALID_MESSAGE_FORMAT',
            undefined,
            validationResult.error?.path
          );
        }
      }

      return message;
    } catch (error) {
      if (error instanceof MessageSerializationError) {
        throw error;
      }

      throw new MessageSerializationError(
        `Failed to deserialize message: ${error instanceof Error ? error.message : String(error)}`,
        'DESERIALIZATION_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validates a message against its schema
   * @param message Message to validate
   * @throws MessageSerializationError if validation fails
   */
  private static validateMessage<T>(message: KafkaEvent<T>): void {
    try {
      // First validate against base schema
      baseKafkaEventSchema.parse(message);

      // Then validate against journey-specific schema if applicable
      if (message.journey === 'health' || message.journey === 'care' || message.journey === 'plan') {
        journeyKafkaEventSchema.parse(message);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new MessageSerializationError(
          `Invalid message format: ${firstError.message}`,
          'INVALID_MESSAGE_FORMAT',
          error,
          firstError.path.map(p => p.toString())
        );
      }

      throw new MessageSerializationError(
        `Failed to validate message: ${error instanceof Error ? error.message : String(error)}`,
        'VALIDATION_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validates a message against its schema without throwing an error
   * @param message Message to validate
   * @returns Validation result
   */
  private static validateMessageSafe<T>(message: KafkaEvent<T>): ValidationResult<KafkaEvent<T>> {
    try {
      // First validate against base schema
      const baseResult = baseKafkaEventSchema.safeParse(message);
      if (!baseResult.success) {
        const firstError = baseResult.error.errors[0];
        return {
          valid: false,
          error: {
            message: firstError.message,
            path: firstError.path.map(p => p.toString()),
            code: 'INVALID_MESSAGE_FORMAT',
          },
        };
      }

      // Then validate against journey-specific schema if applicable
      if (message.journey === 'health' || message.journey === 'care' || message.journey === 'plan') {
        const journeyResult = journeyKafkaEventSchema.safeParse(message);
        if (!journeyResult.success) {
          const firstError = journeyResult.error.errors[0];
          return {
            valid: false,
            error: {
              message: firstError.message,
              path: firstError.path.map(p => p.toString()),
              code: 'INVALID_JOURNEY_MESSAGE',
            },
          };
        }
      }

      return { valid: true, message };
    } catch (error) {
      return {
        valid: false,
        error: {
          message: `Failed to validate message: ${error instanceof Error ? error.message : String(error)}`,
          code: 'VALIDATION_ERROR',
        },
      };
    }
  }

  /**
   * Compresses a message using zlib
   * @param jsonString JSON string to compress
   * @param level Compression level (1-9, default: 6)
   * @returns Compressed message as a Buffer
   */
  private static compressMessage(jsonString: string, level: number = 6): Buffer {
    try {
      const zlib = require('zlib');
      const buffer = Buffer.from(jsonString, 'utf8');
      return zlib.gzipSync(buffer, { level });
    } catch (error) {
      throw new MessageSerializationError(
        `Failed to compress message: ${error instanceof Error ? error.message : String(error)}`,
        'COMPRESSION_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Decompresses a message using zlib
   * @param buffer Compressed message as a Buffer
   * @returns Decompressed message as a Buffer
   */
  private static decompressMessage(buffer: Buffer): Buffer {
    try {
      const zlib = require('zlib');
      return zlib.gunzipSync(buffer);
    } catch (error) {
      throw new MessageSerializationError(
        `Failed to decompress message: ${error instanceof Error ? error.message : String(error)}`,
        'DECOMPRESSION_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Checks if a message is compressed using zlib
   * @param buffer Message buffer to check
   * @returns Whether the message is compressed
   */
  private static isCompressedMessage(buffer: Buffer): boolean {
    // Check for gzip magic number (0x1f, 0x8b)
    return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  }

  /**
   * Converts a standard GamificationEvent to a Kafka-specific event
   * @param event Standard gamification event
   * @returns Kafka-formatted event with headers and partition key
   */
  public static fromGamificationEvent<T>(event: GamificationEvent<T>): KafkaEvent<T> {
    return {
      ...event,
      headers: {
        version: `${event.version.major}.${event.version.minor}.${event.version.patch}`,
        source: event.source || 'gamification-engine',
        timestamp: event.timestamp,
        contentType: 'application/json',
        correlationId: event.correlationId,
      },
      partitionKey: event.userId,
    };
  }

  /**
   * Converts a Kafka-specific event to a standard GamificationEvent
   * @param kafkaEvent Kafka-formatted event
   * @returns Standard gamification event
   */
  public static toGamificationEvent<T>(kafkaEvent: KafkaEvent<T>): GamificationEvent<T> {
    const { headers, partitionKey, ...eventData } = kafkaEvent;
    
    return {
      ...eventData,
      source: headers?.source || 'unknown',
      correlationId: headers?.correlationId,
    };
  }

  /**
   * Creates a versioned Kafka event
   * @param event Base event data
   * @param version Event schema version
   * @returns Versioned event with proper headers
   */
  public static createVersionedEvent<T>(
    event: Omit<KafkaEvent<T>, 'version' | 'headers'>,
    version: EventVersion = { major: 1, minor: 0, patch: 0 }
  ): KafkaEvent<T> {
    return {
      ...event,
      version,
      headers: {
        version: `${version.major}.${version.minor}.${version.patch}`,
        source: 'gamification-engine',
        timestamp: new Date().toISOString(),
        contentType: 'application/json',
      },
      partitionKey: event.userId,
    };
  }

  /**
   * Extracts headers from a Kafka message
   * @param message Kafka message
   * @returns Extracted headers or undefined if not present
   */
  public static extractHeaders<T>(message: KafkaEvent<T>): KafkaHeaders | undefined {
    return message.headers;
  }

  /**
   * Updates headers in a Kafka message
   * @param message Kafka message
   * @param headers Headers to update (partial)
   * @returns Updated message with new headers
   */
  public static updateHeaders<T>(
    message: KafkaEvent<T>,
    headers: Partial<KafkaHeaders>
  ): KafkaEvent<T> {
    return {
      ...message,
      headers: {
        ...message.headers,
        ...headers,
      },
    };
  }

  /**
   * Checks if an event version is compatible with the current system version
   * @param eventVersion Version of the incoming event
   * @param systemVersion Current system version (defaults to 1.0.0)
   * @returns Whether the event version is compatible
   */
  public static isVersionCompatible(
    eventVersion: EventVersion,
    systemVersion: EventVersion = { major: 1, minor: 0, patch: 0 }
  ): boolean {
    // Major version must match for compatibility
    return eventVersion.major === systemVersion.major;
  }
}