import { Buffer } from 'buffer';

/**
 * Interfaces for event serialization and deserialization
 */

/**
 * Represents a serialized event with version information
 */
interface SerializedEvent {
  /**
   * The schema version of the event
   * Format: major.minor.patch (e.g., 1.0.0)
   */
  version: string;
  
  /**
   * The serialized event data
   */
  data: string;
  
  /**
   * Optional metadata for the serialized event
   */
  meta?: Record<string, unknown>;
}

/**
 * Options for event serialization
 */
interface SerializationOptions {
  /**
   * Whether to include binary data handling
   * @default true
   */
  handleBinary?: boolean;
  
  /**
   * The journey context for the event
   * Possible values: 'health', 'care', 'plan'
   */
  journeyContext?: string;
  
  /**
   * Additional metadata to include in the serialized event
   */
  metadata?: Record<string, unknown>;
  
  /**
   * Whether to pretty print the JSON output
   * @default false
   */
  pretty?: boolean;
}

/**
 * Options for event deserialization
 */
interface DeserializationOptions {
  /**
   * Whether to handle binary data during deserialization
   * @default true
   */
  handleBinary?: boolean;
  
  /**
   * Whether to validate the event schema during deserialization
   * @default true
   */
  validate?: boolean;
  
  /**
   * Whether to allow events with unknown versions
   * @default false
   */
  allowUnknownVersion?: boolean;
  
  /**
   * The journey context for deserialization
   * Possible values: 'health', 'care', 'plan'
   */
  journeyContext?: string;
}

/**
 * Error thrown when serialization or deserialization fails
 */
export class EventSerializationError extends Error {
  /**
   * The original error that caused the serialization failure
   */
  public readonly originalError?: Error;
  
  /**
   * The event that failed to serialize or deserialize
   */
  public readonly event?: unknown;
  
  /**
   * Additional context about the error
   */
  public readonly context?: Record<string, unknown>;
  
  constructor(message: string, options?: {
    originalError?: Error;
    event?: unknown;
    context?: Record<string, unknown>;
  }) {
    super(message);
    this.name = 'EventSerializationError';
    this.originalError = options?.originalError;
    this.event = options?.event;
    this.context = options?.context;
    
    // Preserve the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EventSerializationError);
    }
  }
}

/**
 * Detects if a value is likely to be binary data (Buffer, ArrayBuffer, etc.)
 * @param value The value to check
 * @returns True if the value appears to be binary data
 */
const isBinaryData = (value: unknown): boolean => {
  return (
    value instanceof Buffer ||
    value instanceof ArrayBuffer ||
    value instanceof Uint8Array ||
    value instanceof Int8Array ||
    (typeof value === 'object' &&
      value !== null &&
      'buffer' in value &&
      value.buffer instanceof ArrayBuffer)
  );
};

/**
 * Converts binary data to a Base64 string with type information
 * @param data The binary data to convert
 * @returns A string representation with type information
 */
const binaryToBase64 = (data: unknown): string => {
  if (data instanceof Buffer) {
    return `__bin_buffer:${data.toString('base64')}`;
  }
  
  if (data instanceof ArrayBuffer) {
    return `__bin_arraybuffer:${Buffer.from(data).toString('base64')}`;
  }
  
  if (data instanceof Uint8Array) {
    return `__bin_uint8array:${Buffer.from(data).toString('base64')}`;
  }
  
  if (data instanceof Int8Array) {
    return `__bin_int8array:${Buffer.from(data).toString('base64')}`;
  }
  
  // Default case, try to convert to buffer
  try {
    return `__bin_unknown:${Buffer.from(data as any).toString('base64')}`;
  } catch (error) {
    throw new EventSerializationError('Failed to convert binary data to Base64', {
      originalError: error as Error,
      event: data,
    });
  }
};

/**
 * Converts a Base64 string back to its original binary format
 * @param data The Base64 string with type information
 * @returns The original binary data
 */
const base64ToBinary = (data: string): unknown => {
  const [type, base64] = data.split(':', 2);
  const buffer = Buffer.from(base64, 'base64');
  
  switch (type) {
    case '__bin_buffer':
      return buffer;
    case '__bin_arraybuffer':
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
    case '__bin_uint8array':
      return new Uint8Array(buffer);
    case '__bin_int8array':
      return new Int8Array(buffer);
    case '__bin_unknown':
    default:
      return buffer;
  }
};

/**
 * Recursively processes an object to handle binary data during serialization
 * @param obj The object to process
 * @returns A new object with binary data converted to Base64 strings
 */
const processBinaryData = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (isBinaryData(obj)) {
    return binaryToBase64(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(processBinaryData);
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = processBinaryData(value);
    }
    return result;
  }
  
  return obj;
};

/**
 * Recursively processes an object to restore binary data during deserialization
 * @param obj The object to process
 * @returns A new object with Base64 strings converted back to binary data
 */
const restoreBinaryData = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string' && obj.startsWith('__bin_')) {
    return base64ToBinary(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(restoreBinaryData);
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = restoreBinaryData(value);
    }
    return result;
  }
  
  return obj;
};

/**
 * Adds journey-specific context to an event
 * @param event The event to enhance
 * @param journeyContext The journey context to add
 * @returns The event with journey context added
 */
const addJourneyContext = (event: unknown, journeyContext?: string): unknown => {
  if (!journeyContext || typeof event !== 'object' || event === null) {
    return event;
  }
  
  // Clone the event to avoid modifying the original
  const enhancedEvent = { ...event as Record<string, unknown> };
  
  // Add journey context if not already present
  if (!enhancedEvent.journey) {
    enhancedEvent.journey = journeyContext;
  }
  
  // Add journey-specific metadata if not already present
  if (!enhancedEvent.metadata) {
    enhancedEvent.metadata = {};
  }
  
  const metadata = enhancedEvent.metadata as Record<string, unknown>;
  if (!metadata.journeyContext) {
    metadata.journeyContext = journeyContext;
  }
  
  return enhancedEvent;
};

/**
 * Serializes an event to a JSON string with version information
 * @param event The event to serialize
 * @param version The schema version of the event (default: '1.0.0')
 * @param options Serialization options
 * @returns A JSON string representing the serialized event
 */
export const serializeEvent = (
  event: unknown,
  version = '1.0.0',
  options: SerializationOptions = {}
): string => {
  try {
    const {
      handleBinary = true,
      journeyContext,
      metadata = {},
      pretty = false,
    } = options;
    
    // Add journey context if specified
    const contextEnhancedEvent = journeyContext
      ? addJourneyContext(event, journeyContext)
      : event;
    
    // Process binary data if needed
    const processedEvent = handleBinary
      ? processBinaryData(contextEnhancedEvent)
      : contextEnhancedEvent;
    
    // Create the serialized event structure
    const serializedEvent: SerializedEvent = {
      version,
      data: JSON.stringify(processedEvent),
      meta: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
    
    // Return the serialized event as a JSON string
    return JSON.stringify(serializedEvent, null, pretty ? 2 : undefined);
  } catch (error) {
    throw new EventSerializationError('Failed to serialize event', {
      originalError: error as Error,
      event,
      context: {
        version,
        options,
      },
    });
  }
};

/**
 * Deserializes a JSON string back to an event object
 * @param serializedEvent The JSON string to deserialize
 * @param options Deserialization options
 * @returns The deserialized event object
 */
export const deserializeEvent = <T = unknown>(
  serializedEvent: string,
  options: DeserializationOptions = {}
): T => {
  try {
    const {
      handleBinary = true,
      validate = true,
      allowUnknownVersion = false,
      journeyContext,
    } = options;
    
    // Parse the serialized event
    const parsedEvent = JSON.parse(serializedEvent) as SerializedEvent;
    
    // Validate the event structure
    if (validate) {
      if (!parsedEvent.version) {
        throw new Error('Missing event version');
      }
      
      if (!parsedEvent.data) {
        throw new Error('Missing event data');
      }
    }
    
    // Check if the version is supported
    if (!allowUnknownVersion && !isVersionSupported(parsedEvent.version)) {
      throw new Error(`Unsupported event version: ${parsedEvent.version}`);
    }
    
    // Parse the event data
    const eventData = JSON.parse(parsedEvent.data);
    
    // Process binary data if needed
    const processedEvent = handleBinary
      ? restoreBinaryData(eventData)
      : eventData;
    
    // Add journey context if specified
    const contextEnhancedEvent = journeyContext
      ? addJourneyContext(processedEvent, journeyContext)
      : processedEvent;
    
    return contextEnhancedEvent as T;
  } catch (error) {
    throw new EventSerializationError('Failed to deserialize event', {
      originalError: error as Error,
      event: serializedEvent,
      context: {
        options,
      },
    });
  }
};

/**
 * Checks if a given event version is supported by the current implementation
 * @param version The version to check
 * @returns True if the version is supported
 */
export const isVersionSupported = (version: string): boolean => {
  // Currently supported major versions
  const supportedMajorVersions = [1];
  
  try {
    // Parse the version string
    const [major] = version.split('.').map(Number);
    
    // Check if the major version is supported
    return supportedMajorVersions.includes(major);
  } catch {
    // If version parsing fails, consider it unsupported
    return false;
  }
};

/**
 * Extracts the version information from a serialized event
 * @param serializedEvent The serialized event string
 * @returns The version string or null if not found
 */
export const extractEventVersion = (serializedEvent: string): string | null => {
  try {
    const parsed = JSON.parse(serializedEvent) as SerializedEvent;
    return parsed.version || null;
  } catch {
    return null;
  }
};

/**
 * Checks if a string is a serialized event
 * @param str The string to check
 * @returns True if the string appears to be a serialized event
 */
export const isSerializedEvent = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str) as unknown;
    
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      'data' in parsed &&
      typeof parsed.version === 'string' &&
      typeof parsed.data === 'string'
    );
  } catch {
    return false;
  }
};

/**
 * Serializes an event with binary data handling
 * This is a convenience function that sets handleBinary to true
 * @param event The event to serialize
 * @param version The schema version of the event
 * @param options Additional serialization options
 * @returns A JSON string representing the serialized event
 */
export const serializeBinaryEvent = (
  event: unknown,
  version = '1.0.0',
  options: Omit<SerializationOptions, 'handleBinary'> = {}
): string => {
  return serializeEvent(event, version, { ...options, handleBinary: true });
};

/**
 * Deserializes an event with binary data handling
 * This is a convenience function that sets handleBinary to true
 * @param serializedEvent The JSON string to deserialize
 * @param options Additional deserialization options
 * @returns The deserialized event object
 */
export const deserializeBinaryEvent = <T = unknown>(
  serializedEvent: string,
  options: Omit<DeserializationOptions, 'handleBinary'> = {}
): T => {
  return deserializeEvent<T>(serializedEvent, { ...options, handleBinary: true });
};

/**
 * Serializes an event for a specific journey
 * This is a convenience function that sets the journeyContext
 * @param event The event to serialize
 * @param journey The journey context ('health', 'care', or 'plan')
 * @param version The schema version of the event
 * @param options Additional serialization options
 * @returns A JSON string representing the serialized event
 */
export const serializeJourneyEvent = (
  event: unknown,
  journey: 'health' | 'care' | 'plan',
  version = '1.0.0',
  options: Omit<SerializationOptions, 'journeyContext'> = {}
): string => {
  return serializeEvent(event, version, { ...options, journeyContext: journey });
};

/**
 * Deserializes an event for a specific journey
 * This is a convenience function that sets the journeyContext
 * @param serializedEvent The JSON string to deserialize
 * @param journey The journey context ('health', 'care', or 'plan')
 * @param options Additional deserialization options
 * @returns The deserialized event object
 */
export const deserializeJourneyEvent = <T = unknown>(
  serializedEvent: string,
  journey: 'health' | 'care' | 'plan',
  options: Omit<DeserializationOptions, 'journeyContext'> = {}
): T => {
  return deserializeEvent<T>(serializedEvent, { ...options, journeyContext: journey });
};