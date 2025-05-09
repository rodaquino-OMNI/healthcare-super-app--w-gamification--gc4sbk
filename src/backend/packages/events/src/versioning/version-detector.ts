/**
 * @file version-detector.ts
 * @description Provides utilities to detect the version of an event payload from different sources.
 * Supports multiple detection strategies including explicit version field, structural analysis,
 * and header-based detection. This module enables the system to correctly identify event versions
 * even when the versioning approach varies across different parts of the application.
 */

import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import {
  VersionDetectionOptions,
  VersionDetectionResult,
  VersionDetectionStrategy,
  ParsedVersion,
  isFieldBasedStrategy,
  isHeaderBasedStrategy,
  isSchemaBasedStrategy,
  isVersionedEvent
} from './types';
import {
  DEFAULT_VERSION_DETECTION_OPTIONS,
  VERSION_FORMAT,
  VERSION_CONSTANTS,
  ERROR_MESSAGES
} from './constants';
import { VersionDetectionError } from './errors';

/**
 * Class responsible for detecting the version of an event payload
 * using various strategies in a configurable priority order.
 */
export class VersionDetector {
  private options: VersionDetectionOptions;

  /**
   * Creates a new VersionDetector instance
   * @param options Configuration options for version detection
   */
  constructor(options?: Partial<VersionDetectionOptions>) {
    this.options = {
      ...DEFAULT_VERSION_DETECTION_OPTIONS,
      ...options
    };
  }

  /**
   * Detects the version of an event using configured strategies
   * @param event The event to detect the version for
   * @param headers Optional headers associated with the event (e.g., Kafka message headers)
   * @returns The detected version information
   * @throws {VersionDetectionError} If version detection fails and throwOnFailure is true
   */
  public detect(event: unknown, headers?: Record<string, string | Buffer>): VersionDetectionResult {
    if (!event) {
      return this.handleDetectionFailure('Event payload is null or undefined');
    }

    // If the event already implements IVersionedEvent, use its version
    if (isVersionedEvent(event)) {
      return this.createSuccessResult(event.version, 'explicit', true);
    }

    // Sort strategies by priority (highest first)
    const strategies = [...(this.options.strategies || [])].sort((a, b) => b.priority - a.priority);

    // Try each strategy in order
    for (const strategy of strategies) {
      try {
        let result: VersionDetectionResult | null = null;

        if (isFieldBasedStrategy(strategy)) {
          result = this.detectFromField(event, strategy.field, strategy.path);
        } else if (isHeaderBasedStrategy(strategy) && headers) {
          result = this.detectFromHeader(headers, strategy.headerName);
        } else if (isSchemaBasedStrategy(strategy)) {
          result = this.detectFromSchema(event, strategy.schemaFingerprints);
        }

        if (result) {
          return result;
        }
      } catch (error) {
        // Continue to the next strategy if one fails
        continue;
      }
    }

    // If we get here, no strategy succeeded
    return this.handleDetectionFailure('No version detection strategy succeeded');
  }

  /**
   * Detects version from a specific field in the event
   * @param event The event object
   * @param field The field name containing the version
   * @param path Optional path to nested field (dot notation)
   * @returns The detected version information or null if not found
   */
  private detectFromField(event: unknown, field: string, path?: string): VersionDetectionResult | null {
    if (typeof event !== 'object' || event === null) {
      return null;
    }

    let value: any = event;

    // Handle nested path if provided
    if (path) {
      const parts = path.split('.');
      for (const part of parts) {
        if (value === null || typeof value !== 'object' || !(part in value)) {
          return null;
        }
        value = value[part];
      }
    }

    // Check if the field exists
    if (!(field in value)) {
      return null;
    }

    const version = value[field];
    if (typeof version !== 'string') {
      return null;
    }

    // Validate the version format
    if (!this.isValidVersion(version)) {
      throw new VersionDetectionError(
        ERROR_MESSAGES.VERSION_DETECTION.INVALID_FORMAT
          .replace('{version}', version)
          .replace('{format}', VERSION_FORMAT.FORMAT_STRING)
      );
    }

    return this.createSuccessResult(version, 'field', true);
  }

  /**
   * Detects version from event headers (e.g., Kafka message headers)
   * @param headers The headers object
   * @param headerName The header name containing the version
   * @returns The detected version information or null if not found
   */
  private detectFromHeader(headers: Record<string, string | Buffer>, headerName: string): VersionDetectionResult | null {
    if (!headers || typeof headers !== 'object') {
      return null;
    }

    if (!(headerName in headers)) {
      return null;
    }

    let version: string;
    const headerValue = headers[headerName];

    // Handle Buffer or string header value
    if (Buffer.isBuffer(headerValue)) {
      version = headerValue.toString('utf8');
    } else if (typeof headerValue === 'string') {
      version = headerValue;
    } else {
      return null;
    }

    // Validate the version format
    if (!this.isValidVersion(version)) {
      throw new VersionDetectionError(
        ERROR_MESSAGES.VERSION_DETECTION.INVALID_FORMAT
          .replace('{version}', version)
          .replace('{format}', VERSION_FORMAT.FORMAT_STRING)
      );
    }

    return this.createSuccessResult(version, 'header', true);
  }

  /**
   * Detects version based on event schema structure by comparing with known fingerprints
   * @param event The event object
   * @param schemaFingerprints Map of schema fingerprints to versions
   * @returns The detected version information or null if not found
   */
  private detectFromSchema(event: unknown, schemaFingerprints: Record<string, string>): VersionDetectionResult | null {
    if (typeof event !== 'object' || event === null) {
      return null;
    }

    // Generate a fingerprint of the event structure
    const fingerprint = this.generateSchemaFingerprint(event);

    // Check if the fingerprint matches any known schema
    if (fingerprint in schemaFingerprints) {
      const version = schemaFingerprints[fingerprint];
      return this.createSuccessResult(version, 'schema', false);
    }

    return null;
  }

  /**
   * Generates a fingerprint of the event structure for schema-based detection
   * @param obj The object to generate a fingerprint for
   * @returns A string fingerprint representing the object structure
   */
  private generateSchemaFingerprint(obj: unknown): string {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return 'array:empty';
      }
      // For arrays, use the type of the first element as representative
      return `array:${this.generateSchemaFingerprint(obj[0])}`;
    }

    // For objects, create a sorted list of keys and their types
    const keys = Object.keys(obj).sort();
    if (keys.length === 0) {
      return 'object:empty';
    }

    const keyTypes = keys.map(key => {
      const value = (obj as Record<string, unknown>)[key];
      return `${key}:${typeof value}`;
    });

    return `object:{${keyTypes.join(',')}}`;  
  }

  /**
   * Parses a version string into its components
   * @param version The version string to parse
   * @returns The parsed version components
   * @throws {VersionDetectionError} If the version format is invalid
   */
  public parseVersion(version: string): ParsedVersion {
    if (!this.isValidVersion(version)) {
      throw new VersionDetectionError(
        ERROR_MESSAGES.VERSION_DETECTION.INVALID_FORMAT
          .replace('{version}', version)
          .replace('{format}', VERSION_FORMAT.FORMAT_STRING)
      );
    }

    const parts = version.split(VERSION_FORMAT.SEPARATOR);
    return {
      major: parseInt(parts[0], 10),
      minor: parseInt(parts[1], 10),
      patch: parseInt(parts[2], 10)
    };
  }

  /**
   * Validates a version string against the expected format
   * @param version The version string to validate
   * @returns Whether the version is valid
   */
  public isValidVersion(version: string): boolean {
    return VERSION_FORMAT.SEMVER_REGEX.test(version);
  }

  /**
   * Checks if a version is supported based on configured minimum version
   * @param version The version to check
   * @returns Whether the version is supported
   */
  public isSupportedVersion(version: string): boolean {
    if (!this.isValidVersion(version)) {
      return false;
    }

    const parsedVersion = this.parseVersion(version);
    const minVersion = this.parseVersion(VERSION_CONSTANTS.MINIMUM_SUPPORTED_VERSION);

    // Compare major, minor, and patch versions
    if (parsedVersion.major < minVersion.major) {
      return false;
    }
    if (parsedVersion.major === minVersion.major && parsedVersion.minor < minVersion.minor) {
      return false;
    }
    if (parsedVersion.major === minVersion.major && parsedVersion.minor === minVersion.minor && parsedVersion.patch < minVersion.patch) {
      return false;
    }

    return true;
  }

  /**
   * Creates a successful version detection result
   * @param version The detected version
   * @param strategy The strategy used to detect the version
   * @param isExplicit Whether the version was explicitly defined
   * @returns The version detection result
   */
  private createSuccessResult(version: string, strategy: string, isExplicit: boolean): VersionDetectionResult {
    let parsed: ParsedVersion | undefined;
    try {
      parsed = this.parseVersion(version);
    } catch (error) {
      // If parsing fails, leave parsed undefined
    }

    return {
      version,
      detectionStrategy: strategy,
      isExplicit,
      parsed
    };
  }

  /**
   * Handles a version detection failure based on configuration
   * @param reason The reason for the failure
   * @returns A default version result or throws an error
   * @throws {VersionDetectionError} If throwOnFailure is true
   */
  private handleDetectionFailure(reason: string): VersionDetectionResult {
    if (this.options.throwOnFailure) {
      throw new VersionDetectionError(`${ERROR_MESSAGES.VERSION_DETECTION.FAILED}: ${reason}`);
    }

    // Return default version if not throwing
    return {
      version: this.options.defaultVersion || VERSION_CONSTANTS.DEFAULT_VERSION,
      isExplicit: false
    };
  }
}

/**
 * Creates a new VersionDetector with default options
 * @returns A VersionDetector instance
 */
export function createVersionDetector(options?: Partial<VersionDetectionOptions>): VersionDetector {
  return new VersionDetector(options);
}

/**
 * Detects the version of an event using default options
 * @param event The event to detect the version for
 * @param headers Optional headers associated with the event
 * @returns The detected version information
 */
export function detectVersion(event: unknown, headers?: Record<string, string | Buffer>): VersionDetectionResult {
  const detector = createVersionDetector();
  return detector.detect(event, headers);
}

/**
 * Checks if an event has a valid version
 * @param event The event to check
 * @returns Whether the event has a valid version
 */
export function hasValidVersion(event: unknown): boolean {
  if (!isVersionedEvent(event)) {
    return false;
  }

  const detector = createVersionDetector();
  return detector.isValidVersion(event.version);
}

/**
 * Ensures an event has a valid version, adding a default if missing
 * @param event The event to ensure has a version
 * @returns The event with a valid version
 */
export function ensureVersion<T extends Record<string, any>>(event: T): T & { version: string } {
  if (isVersionedEvent(event)) {
    return event as T & { version: string };
  }

  return {
    ...event,
    version: VERSION_CONSTANTS.DEFAULT_VERSION
  };
}