/**
 * @file event-serializer.ts
 * @description Provides standardized serialization and deserialization functions for event payloads
 * across all services. Ensures events are consistently formatted when published to Kafka topics
 * and correctly parsed when consumed. Supports JSON with binary data handling through Base64
 * encoding/decoding and handles versioned event schemas with graceful fallbacks for backward compatibility.
 */

import { GamificationEvent, EventPayload, parseVersion, compareVersions } from '@austa/interfaces/gamification';
import { JourneyType } from '@austa/interfaces/common/types';

/**
 * Error class for serialization/deserialization failures
 */
export class EventSerializationError extends Error {
  /**
   * The original error that caused the serialization failure
   */
  public readonly originalError?: Error;

  /**
   * The event that failed to serialize/deserialize
   */
  public readonly event?: any;

  /**
   * Additional context about the serialization failure
   */
  public readonly context?: Record<string, any>;

  constructor(message: string, options?: { originalError?: Error; event?: any; context?: Record<string, any> }) {
    super(message);
    this.name = 'EventSerializationError';
    this.originalError = options?.originalError;
    this.event = options?.event;
    this.context = options?.context;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EventSerializationError);
    }
  }
}

/**
 * Options for serializing events
 */
export interface SerializationOptions {
  /**
   * Whether to include binary data in the serialized output
   * @default true
   */
  includeBinaryData?: boolean;

  /**
   * Whether to pretty-print the JSON output
   * @default false
   */
  prettyPrint?: boolean;

  /**
   * Journey-specific context to include in the serialized output
   */
  journeyContext?: {
    journey: JourneyType;
    metadata?: Record<string, any>;
  };

  /**
   * Whether to include diagnostic information in the serialized output
   * @default false
   */
  includeDiagnostics?: boolean;
}

/**
 * Options for deserializing events
 */
export interface DeserializationOptions {
  /**
   * Whether to validate the event structure during deserialization
   * @default true
   */
  validate?: boolean;

  /**
   * Whether to handle binary data during deserialization
   * @default true
   */
  handleBinaryData?: boolean;

  /**
   * The minimum compatible version for deserialization
   * If the event version is lower than this, deserialization will fail
   */
  minCompatibleVersion?: string;

  /**
   * Whether to throw an error if the event version is incompatible
   * If false, will attempt to deserialize anyway
   * @default true
   */
  strictVersioning?: boolean;

  /**
   * Journey-specific context for deserialization
   */
  journeyContext?: {
    journey: JourneyType;
    metadata?: Record<string, any>;
  };
}

/**
 * Binary data marker interface for identifying binary fields in event payloads
 */
export interface BinaryData {
  /**
   * The original MIME type of the binary data
   */
  mimeType: string;

  /**
   * The Base64-encoded binary data
   */
  data: string;

  /**
   * Flag to identify this as binary data
   */
  __binary: true;
}

/**
 * Diagnostic information included in serialized events when diagnostics are enabled
 */
export interface EventDiagnostics {
  /**
   * The timestamp when the event was serialized
   */
  serializationTimestamp: string;

  /**
   * The hostname of the machine that serialized the event
   */
  hostname?: string;

  /**
   * The service name that serialized the event
   */
  serviceName?: string;

  /**
   * The environment in which the event was serialized
   */
  environment?: string;
}

/**
 * Serializes a gamification event to a JSON string
 * @param event The event to serialize
 * @param options Serialization options
 * @returns The serialized event as a JSON string
 * @throws EventSerializationError if serialization fails
 */
export function serializeEvent(event: GamificationEvent, options: SerializationOptions = {}): string {
  try {
    // Set default options
    const {
      includeBinaryData = true,
      prettyPrint = false,
      journeyContext,
      includeDiagnostics = false,
    } = options;

    // Create a deep copy of the event to avoid modifying the original
    const eventCopy = JSON.parse(JSON.stringify(event));

    // Add journey context if provided
    if (journeyContext) {
      eventCopy.journey = journeyContext.journey;
      if (journeyContext.metadata) {
        eventCopy.journeyMetadata = journeyContext.metadata;
      }
    }

    // Process binary data if needed
    if (includeBinaryData) {
      processBinaryData(eventCopy);
    }

    // Add diagnostics if requested
    if (includeDiagnostics) {
      eventCopy.__diagnostics = generateDiagnostics();
    }

    // Serialize to JSON
    return JSON.stringify(eventCopy, null, prettyPrint ? 2 : undefined);
  } catch (error) {
    throw new EventSerializationError('Failed to serialize event', {
      originalError: error instanceof Error ? error : new Error(String(error)),
      event,
      context: { options },
    });
  }
}

/**
 * Deserializes a JSON string to a gamification event
 * @param jsonString The JSON string to deserialize
 * @param options Deserialization options
 * @returns The deserialized event
 * @throws EventSerializationError if deserialization fails
 */
export function deserializeEvent(jsonString: string, options: DeserializationOptions = {}): GamificationEvent {
  try {
    // Set default options
    const {
      validate = true,
      handleBinaryData = true,
      minCompatibleVersion,
      strictVersioning = true,
      journeyContext,
    } = options;

    // Parse JSON string
    const parsedEvent = JSON.parse(jsonString) as GamificationEvent;

    // Check version compatibility if needed
    if (minCompatibleVersion && parsedEvent.version) {
      const eventVersion = parseVersion(parsedEvent.version);
      const minVersion = parseVersion(minCompatibleVersion);

      if (compareVersions(eventVersion, minVersion) < 0) {
        const errorMessage = `Event version ${parsedEvent.version} is not compatible with minimum version ${minCompatibleVersion}`;
        if (strictVersioning) {
          throw new Error(errorMessage);
        } else {
          console.warn(errorMessage + '. Attempting to deserialize anyway.');
        }
      }
    }

    // Process binary data if needed
    if (handleBinaryData) {
      decodeBinaryData(parsedEvent);
    }

    // Apply journey context if provided
    if (journeyContext) {
      parsedEvent.journey = journeyContext.journey;
    }

    // Validate the event structure if requested
    if (validate) {
      validateEvent(parsedEvent);
    }

    // Remove diagnostic information if present
    if ('__diagnostics' in parsedEvent) {
      delete (parsedEvent as any).__diagnostics;
    }

    return parsedEvent;
  } catch (error) {
    throw new EventSerializationError('Failed to deserialize event', {
      originalError: error instanceof Error ? error : new Error(String(error)),
      event: jsonString,
      context: { options },
    });
  }
}

/**
 * Serializes an event payload with binary data handling
 * @param payload The event payload to serialize
 * @returns The serialized payload as a string
 */
export function serializePayload<T>(payload: EventPayload<T>): string {
  try {
    // Create a deep copy of the payload
    const payloadCopy = JSON.parse(JSON.stringify(payload));

    // Process binary data
    processBinaryData(payloadCopy);

    // Serialize to JSON
    return JSON.stringify(payloadCopy);
  } catch (error) {
    throw new EventSerializationError('Failed to serialize payload', {
      originalError: error instanceof Error ? error : new Error(String(error)),
      event: payload,
    });
  }
}

/**
 * Deserializes a string to an event payload
 * @param jsonString The JSON string to deserialize
 * @returns The deserialized payload
 */
export function deserializePayload<T>(jsonString: string): EventPayload<T> {
  try {
    // Parse JSON string
    const parsedPayload = JSON.parse(jsonString) as EventPayload<T>;

    // Process binary data
    decodeBinaryData(parsedPayload);

    return parsedPayload;
  } catch (error) {
    throw new EventSerializationError('Failed to deserialize payload', {
      originalError: error instanceof Error ? error : new Error(String(error)),
      event: jsonString,
    });
  }
}

/**
 * Recursively processes an object to encode binary data as Base64 strings
 * @param obj The object to process
 */
function processBinaryData(obj: any): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  // Process arrays
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      processBinaryData(obj[i]);
    }
    return;
  }

  // Process objects
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // Check if the value is a Buffer or ArrayBuffer
      if (value instanceof ArrayBuffer || 
          (typeof Buffer !== 'undefined' && Buffer.isBuffer(value))) {
        // Convert to Base64 and mark as binary data
        obj[key] = encodeBinaryData(value);
      } else if (value && typeof value === 'object') {
        // Recursively process nested objects
        processBinaryData(value);
      }
    }
  }
}

/**
 * Recursively processes an object to decode Base64 strings back to binary data
 * @param obj The object to process
 */
function decodeBinaryData(obj: any): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  // Process arrays
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      decodeBinaryData(obj[i]);
    }
    return;
  }

  // Process objects
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // Check if the value is marked as binary data
      if (value && typeof value === 'object' && value.__binary === true) {
        // Decode Base64 back to binary data
        obj[key] = decodeBinaryData(value as BinaryData);
      } else if (value && typeof value === 'object') {
        // Recursively process nested objects
        decodeBinaryData(value);
      }
    }
  }
}

/**
 * Encodes binary data as a Base64 string and marks it as binary data
 * @param data The binary data to encode
 * @returns The encoded binary data object
 */
function encodeBinaryData(data: ArrayBuffer | Buffer): BinaryData {
  let base64Data: string;
  let mimeType = 'application/octet-stream';

  // Convert to Base64
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
    base64Data = data.toString('base64');
  } else if (data instanceof ArrayBuffer) {
    const uint8Array = new Uint8Array(data);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    base64Data = typeof btoa === 'function' ? 
      btoa(binaryString) : 
      Buffer.from(binaryString, 'binary').toString('base64');
  } else {
    throw new Error('Unsupported binary data type');
  }

  // Return marked binary data
  return {
    mimeType,
    data: base64Data,
    __binary: true,
  };
}

/**
 * Decodes a Base64 string back to binary data
 * @param binaryData The binary data object to decode
 * @returns The decoded binary data
 */
function decodeBinaryData(binaryData: BinaryData): ArrayBuffer | Buffer {
  // Check if this is a valid binary data object
  if (!binaryData || !binaryData.data || binaryData.__binary !== true) {
    throw new Error('Invalid binary data object');
  }

  // Decode Base64
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return Buffer.from(binaryData.data, 'base64');
  } else {
    // Browser environment
    const binaryString = typeof atob === 'function' ? 
      atob(binaryData.data) : 
      Buffer.from(binaryData.data, 'base64').toString('binary');
    
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Validates that an event has the required structure
 * @param event The event to validate
 * @throws Error if validation fails
 */
function validateEvent(event: GamificationEvent): void {
  // Check required fields
  if (!event) {
    throw new Error('Event cannot be null or undefined');
  }

  if (typeof event !== 'object') {
    throw new Error('Event must be an object');
  }

  if (!event.type) {
    throw new Error('Event must have a type');
  }

  if (!event.userId) {
    throw new Error('Event must have a userId');
  }

  if (!event.payload) {
    throw new Error('Event must have a payload');
  }

  // Additional validation could be added here
}

/**
 * Generates diagnostic information for event serialization
 * @returns Diagnostic information
 */
function generateDiagnostics(): EventDiagnostics {
  const diagnostics: EventDiagnostics = {
    serializationTimestamp: new Date().toISOString(),
  };

  // Add hostname if available
  try {
    if (typeof process !== 'undefined' && process.env) {
      diagnostics.hostname = process.env.HOSTNAME || process.env.COMPUTERNAME || undefined;
      diagnostics.serviceName = process.env.SERVICE_NAME || undefined;
      diagnostics.environment = process.env.NODE_ENV || undefined;
    }
  } catch (error) {
    // Ignore errors when accessing process.env
  }

  return diagnostics;
}

/**
 * Creates a new event with the specified type, user ID, and payload
 * @param type The event type
 * @param userId The user ID
 * @param data The event data
 * @param journey The optional journey
 * @returns A new event object
 */
export function createEvent<T>(
  type: string,
  userId: string,
  data: T,
  journey?: JourneyType
): GamificationEvent {
  return {
    id: generateEventId(),
    type,
    userId,
    payload: { data },
    journey,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    correlationId: generateCorrelationId(),
  };
}

/**
 * Generates a unique event ID
 * @returns A unique ID string
 */
function generateEventId(): string {
  return crypto.randomUUID?.() || 
    `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generates a correlation ID for tracking related events
 * @returns A correlation ID string
 */
function generateCorrelationId(): string {
  return crypto.randomUUID?.() || 
    `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Checks if two events are compatible (have the same major version)
 * @param event1 The first event
 * @param event2 The second event
 * @returns True if the events are compatible
 */
export function areEventsCompatible(event1: GamificationEvent, event2: GamificationEvent): boolean {
  const v1 = parseVersion(event1.version);
  const v2 = parseVersion(event2.version);
  return v1.major === v2.major;
}

/**
 * Extracts the journey from an event
 * @param event The event to extract the journey from
 * @returns The journey, or undefined if not present
 */
export function extractJourney(event: GamificationEvent): JourneyType | undefined {
  return event.journey;
}

/**
 * Adds journey context to an event
 * @param event The event to add journey context to
 * @param journey The journey to add
 * @param metadata Optional metadata to add
 * @returns The updated event
 */
export function addJourneyContext(
  event: GamificationEvent,
  journey: JourneyType,
  metadata?: Record<string, any>
): GamificationEvent {
  const eventCopy = { ...event, journey };
  if (metadata) {
    (eventCopy as any).journeyMetadata = metadata;
  }
  return eventCopy;
}