import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import { ValidationResult } from '../interfaces/event-validation.interface';
import { EventVersion } from '../interfaces/event-versioning.interface';

/**
 * Options for event serialization
 */
export interface SerializationOptions {
  /**
   * Whether to include binary data in the serialized output
   * When true, binary data will be Base64 encoded
   * When false, binary data will be omitted
   * @default true
   */
  includeBinaryData?: boolean;

  /**
   * Whether to include version information in the serialized output
   * @default true
   */
  includeVersion?: boolean;

  /**
   * Journey context to include in the serialized output
   * This helps with routing events to the appropriate handlers
   */
  journeyContext?: string;

  /**
   * Additional metadata to include in the serialized output
   */
  metadata?: Record<string, unknown>;
}

/**
 * Options for event deserialization
 */
export interface DeserializationOptions {
  /**
   * Whether to validate the event structure during deserialization
   * @default true
   */
  validate?: boolean;

  /**
   * Whether to decode Base64 encoded binary data
   * @default true
   */
  decodeBinaryData?: boolean;

  /**
   * Target event version to deserialize to
   * If provided, the deserializer will attempt to convert the event to this version
   * If not provided, the original version will be preserved
   */
  targetVersion?: EventVersion;

  /**
   * Whether to throw an error if the event version is incompatible with the target version
   * @default false
   */
  strictVersioning?: boolean;
}

/**
 * Result of event deserialization
 */
export interface DeserializationResult<T = unknown> {
  /**
   * The deserialized event
   */
  event: T;

  /**
   * Whether the deserialization was successful
   */
  success: boolean;

  /**
   * Validation results, if validation was performed
   */
  validation?: ValidationResult;

  /**
   * Original version of the event before any conversion
   */
  originalVersion?: EventVersion;

  /**
   * Current version of the event after conversion (if performed)
   */
  currentVersion?: EventVersion;

  /**
   * Any errors that occurred during deserialization
   */
  errors?: Error[];
}

/**
 * Binary data encoding types supported by the serializer
 */
export enum BinaryEncoding {
  BASE64 = 'base64',
  HEX = 'hex',
  NONE = 'none'
}

/**
 * Marker interface to identify binary data fields that need special handling
 */
export interface BinaryData {
  /**
   * The binary data as a Buffer
   */
  data: Buffer;

  /**
   * The encoding used for the binary data
   */
  encoding: BinaryEncoding;

  /**
   * Optional MIME type of the binary data
   */
  mimeType?: string;
}

/**
 * Service for serializing and deserializing events
 * Provides standardized methods for converting events to/from JSON
 * with support for binary data, versioning, and validation
 */
@Injectable()
export class EventSerializer {
  private readonly logger = new Logger(EventSerializer.name);

  /**
   * Serializes an event to a JSON string
   * 
   * @param event The event to serialize
   * @param options Serialization options
   * @returns The serialized event as a JSON string
   */
  serialize<T extends IBaseEvent>(event: T, options: SerializationOptions = {}): string {
    try {
      const {
        includeBinaryData = true,
        includeVersion = true,
        journeyContext,
        metadata = {}
      } = options;

      // Create a deep copy of the event to avoid modifying the original
      const eventCopy = this.deepCopy(event);

      // Process binary data if needed
      if (includeBinaryData) {
        this.processBinaryData(eventCopy, 'encode');
      } else {
        this.removeBinaryData(eventCopy);
      }

      // Add version information if needed
      if (includeVersion && !eventCopy.version) {
        eventCopy.version = '1.0.0';
      }

      // Add journey context if provided
      if (journeyContext && !eventCopy.journey) {
        eventCopy.journey = journeyContext;
      }

      // Add additional metadata
      eventCopy.metadata = { ...eventCopy.metadata, ...metadata };

      return JSON.stringify(eventCopy);
    } catch (error) {
      this.logger.error(`Error serializing event: ${error.message}`, error.stack);
      throw new Error(`Failed to serialize event: ${error.message}`);
    }
  }

  /**
   * Deserializes a JSON string to an event object
   * 
   * @param jsonString The JSON string to deserialize
   * @param options Deserialization options
   * @returns The deserialization result containing the event and metadata
   */
  deserialize<T = unknown>(jsonString: string, options: DeserializationOptions = {}): DeserializationResult<T> {
    const result: DeserializationResult<T> = {
      event: null,
      success: false,
      errors: []
    };

    try {
      const {
        validate = true,
        decodeBinaryData = true,
        targetVersion,
        strictVersioning = false
      } = options;

      // Parse the JSON string
      const parsedEvent = JSON.parse(jsonString) as IVersionedEvent;

      // Store the original version
      if (parsedEvent.version) {
        result.originalVersion = parsedEvent.version;
      }

      // Handle version conversion if needed
      if (targetVersion && parsedEvent.version && targetVersion !== parsedEvent.version) {
        try {
          this.convertEventVersion(parsedEvent, targetVersion, strictVersioning);
          result.currentVersion = targetVersion;
        } catch (error) {
          result.errors.push(error);
          if (strictVersioning) {
            throw error;
          }
          // If not strict, continue with the original version
          result.currentVersion = parsedEvent.version;
        }
      } else {
        result.currentVersion = parsedEvent.version;
      }

      // Process binary data if needed
      if (decodeBinaryData) {
        this.processBinaryData(parsedEvent, 'decode');
      }

      // Validate the event if needed
      if (validate) {
        result.validation = this.validateEvent(parsedEvent);
        if (!result.validation.isValid) {
          result.errors.push(new Error(`Event validation failed: ${result.validation.errors.join(', ')}`));
          if (strictVersioning) {
            throw new Error(`Event validation failed: ${result.validation.errors.join(', ')}`);
          }
        }
      }

      result.event = parsedEvent as unknown as T;
      result.success = result.errors.length === 0;

      return result;
    } catch (error) {
      this.logger.error(`Error deserializing event: ${error.message}`, error.stack);
      result.errors.push(error);
      return result;
    }
  }

  /**
   * Creates a deep copy of an object
   * 
   * @param obj The object to copy
   * @returns A deep copy of the object
   */
  private deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    // Handle Buffer objects
    if (Buffer.isBuffer(obj)) {
      return Buffer.from(obj) as unknown as T;
    }

    // Handle Array objects
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCopy(item)) as unknown as T;
    }

    // Handle plain objects
    const copy = {} as T;
    Object.keys(obj).forEach(key => {
      copy[key] = this.deepCopy(obj[key]);
    });

    return copy;
  }

  /**
   * Processes binary data in an event
   * Encodes or decodes binary data based on the operation
   * 
   * @param obj The object to process
   * @param operation The operation to perform ('encode' or 'decode')
   */
  private processBinaryData(obj: any, operation: 'encode' | 'decode'): void {
    if (obj === null || typeof obj !== 'object') {
      return;
    }

    // Process arrays
    if (Array.isArray(obj)) {
      obj.forEach(item => this.processBinaryData(item, operation));
      return;
    }

    // Check if this is a binary data object
    if (this.isBinaryData(obj)) {
      if (operation === 'encode') {
        // Convert Buffer to Base64 string
        obj.data = obj.data.toString(obj.encoding || BinaryEncoding.BASE64);
        obj.__binary = true; // Mark as encoded binary data
      } else if (operation === 'decode' && obj.__binary) {
        // Convert Base64 string back to Buffer
        obj.data = Buffer.from(obj.data, obj.encoding || BinaryEncoding.BASE64);
        delete obj.__binary; // Remove the marker
      }
      return;
    }

    // Process object properties recursively
    Object.keys(obj).forEach(key => {
      if (obj[key] !== null && typeof obj[key] === 'object') {
        this.processBinaryData(obj[key], operation);
      }
    });
  }

  /**
   * Removes binary data from an object
   * 
   * @param obj The object to process
   */
  private removeBinaryData(obj: any): void {
    if (obj === null || typeof obj !== 'object') {
      return;
    }

    // Process arrays
    if (Array.isArray(obj)) {
      obj.forEach(item => this.removeBinaryData(item));
      return;
    }

    // Check if this is a binary data object
    if (this.isBinaryData(obj)) {
      obj.data = '[BINARY_DATA_REMOVED]';
      return;
    }

    // Process object properties recursively
    Object.keys(obj).forEach(key => {
      if (obj[key] !== null && typeof obj[key] === 'object') {
        this.removeBinaryData(obj[key]);
      }
    });
  }

  /**
   * Checks if an object is a binary data object
   * 
   * @param obj The object to check
   * @returns True if the object is a binary data object, false otherwise
   */
  private isBinaryData(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      (Buffer.isBuffer(obj.data) || obj.__binary) &&
      (obj.encoding === undefined || Object.values(BinaryEncoding).includes(obj.encoding))
    );
  }

  /**
   * Converts an event from one version to another
   * 
   * @param event The event to convert
   * @param targetVersion The target version
   * @param strict Whether to throw an error if conversion is not possible
   */
  private convertEventVersion(event: IVersionedEvent, targetVersion: string, strict: boolean): void {
    // Skip if versions are the same
    if (event.version === targetVersion) {
      return;
    }

    // Parse versions
    const currentVersion = this.parseVersion(event.version);
    const target = this.parseVersion(targetVersion);

    // Check if conversion is possible
    if (currentVersion.major !== target.major && strict) {
      throw new Error(`Cannot convert event from version ${event.version} to ${targetVersion}: Major version change`);
    }

    // Apply version-specific transformations
    // This is a simplified implementation - in a real system, you would have
    // specific transformation logic for each version change
    if (currentVersion.major === target.major) {
      if (currentVersion.minor < target.minor) {
        // Upgrade minor version
        this.upgradeMinorVersion(event, currentVersion, target);
      } else if (currentVersion.minor > target.minor) {
        // Downgrade minor version
        this.downgradeMinorVersion(event, currentVersion, target);
      }

      // Update patch version differences
      if (currentVersion.patch !== target.patch) {
        // Patch versions are compatible, just update the version
        event.version = targetVersion;
      }
    }
  }

  /**
   * Parses a version string into its components
   * 
   * @param version The version string to parse
   * @returns The parsed version components
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.');
    return {
      major: parseInt(parts[0], 10) || 0,
      minor: parseInt(parts[1], 10) || 0,
      patch: parseInt(parts[2], 10) || 0
    };
  }

  /**
   * Upgrades an event to a higher minor version
   * 
   * @param event The event to upgrade
   * @param currentVersion The current version components
   * @param targetVersion The target version components
   */
  private upgradeMinorVersion(
    event: IVersionedEvent,
    currentVersion: { major: number; minor: number; patch: number },
    targetVersion: { major: number; minor: number; patch: number }
  ): void {
    // This is where you would implement version-specific upgrades
    // For example, adding new fields or transforming existing ones
    
    // Example implementation:
    // if (currentVersion.minor === 0 && targetVersion.minor >= 1) {
    //   // Add new field introduced in v1.1.0
    //   event.data.newField = 'default value';
    // }

    // Update the version
    event.version = `${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}`;
  }

  /**
   * Downgrades an event to a lower minor version
   * 
   * @param event The event to downgrade
   * @param currentVersion The current version components
   * @param targetVersion The target version components
   */
  private downgradeMinorVersion(
    event: IVersionedEvent,
    currentVersion: { major: number; minor: number; patch: number },
    targetVersion: { major: number; minor: number; patch: number }
  ): void {
    // This is where you would implement version-specific downgrades
    // For example, removing fields that don't exist in the target version
    
    // Example implementation:
    // if (currentVersion.minor >= 1 && targetVersion.minor === 0) {
    //   // Remove field that doesn't exist in v1.0.0
    //   delete event.data.newField;
    // }

    // Update the version
    event.version = `${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}`;
  }

  /**
   * Validates an event structure
   * 
   * @param event The event to validate
   * @returns The validation result
   */
  private validateEvent(event: any): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    if (!event.type) {
      errors.push('Event type is required');
    }

    if (!event.userId) {
      errors.push('User ID is required');
    }

    if (!event.data || typeof event.data !== 'object') {
      errors.push('Event data must be a non-null object');
    }

    // Additional validation could be performed here
    // For example, checking that the event type is valid
    // or that the data structure matches the expected schema for the event type

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Serializes an event to a Buffer
   * Useful for binary protocols or storage
   * 
   * @param event The event to serialize
   * @param options Serialization options
   * @returns The serialized event as a Buffer
   */
  serializeToBuffer<T extends IBaseEvent>(event: T, options: SerializationOptions = {}): Buffer {
    const jsonString = this.serialize(event, options);
    return Buffer.from(jsonString, 'utf8');
  }

  /**
   * Deserializes a Buffer to an event object
   * 
   * @param buffer The Buffer to deserialize
   * @param options Deserialization options
   * @returns The deserialization result containing the event and metadata
   */
  deserializeFromBuffer<T = unknown>(buffer: Buffer, options: DeserializationOptions = {}): DeserializationResult<T> {
    const jsonString = buffer.toString('utf8');
    return this.deserialize<T>(jsonString, options);
  }

  /**
   * Creates a journey-specific serialization context
   * 
   * @param journey The journey identifier ('health', 'care', or 'plan')
   * @returns Serialization options with the journey context set
   */
  createJourneyContext(journey: 'health' | 'care' | 'plan'): SerializationOptions {
    return {
      journeyContext: journey,
      metadata: {
        journeyId: journey,
        timestamp: new Date().toISOString()
      }
    };
  }
}