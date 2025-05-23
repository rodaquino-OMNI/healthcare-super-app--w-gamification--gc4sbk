/**
 * @file version.dto.ts
 * @description Implements event schema versioning support through a specialized DTO that wraps
 * any event payload with version metadata. This file provides the infrastructure for graceful
 * schema evolution, enabling backward compatibility with older event versions while allowing
 * new fields and validation rules to be introduced over time.
 */

import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  EventVersion,
  IVersionedEvent,
  VersionCompatibilityResult,
} from '../interfaces/event-versioning.interface';

/**
 * Data Transfer Object for event version information following semantic versioning principles.
 * Used to track and compare event schema versions.
 */
export class EventVersionDto implements EventVersion {
  /**
   * Major version number. Incremented for breaking changes that require
   * migration or special handling.
   * @example 1
   */
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  major: number;

  /**
   * Minor version number. Incremented for backward-compatible feature additions.
   * @example 2
   */
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  minor: number;

  /**
   * Patch version number. Incremented for backward-compatible bug fixes.
   * @example 3
   */
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  patch: number;

  /**
   * Creates a new EventVersionDto instance.
   * 
   * @param major Major version number
   * @param minor Minor version number
   * @param patch Patch version number
   */
  constructor(major = 1, minor = 0, patch = 0) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  /**
   * Creates an EventVersionDto from a version string in the format "major.minor.patch".
   * 
   * @param versionString Version string in the format "major.minor.patch"
   * @returns A new EventVersionDto instance
   * @throws Error if the version string is invalid
   */
  static fromString(versionString: string): EventVersionDto {
    if (!versionString) {
      throw new Error('Version string cannot be empty');
    }

    const parts = versionString.split('.');
    if (parts.length !== 3) {
      throw new Error(
        `Invalid version string format: ${versionString}. Expected format: major.minor.patch`
      );
    }

    const [major, minor, patch] = parts.map((part) => {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0) {
        throw new Error(
          `Invalid version component: ${part}. Version components must be non-negative integers.`
        );
      }
      return num;
    });

    return new EventVersionDto(major, minor, patch);
  }

  /**
   * Converts the version to a string in the format "major.minor.patch".
   * 
   * @returns Version string
   */
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  /**
   * Checks if this version is compatible with another version.
   * 
   * Compatibility rules:
   * - Exact match: All components match exactly
   * - Backward compatible: Same major version, this minor >= other minor
   * - Forward compatible: Same major version, this minor <= other minor
   * - Incompatible: Different major versions
   * 
   * @param other The version to compare with
   * @returns A VersionCompatibilityResult object
   */
  checkCompatibility(other: EventVersion): VersionCompatibilityResult {
    // Exact match
    if (
      this.major === other.major &&
      this.minor === other.minor &&
      this.patch === other.patch
    ) {
      return {
        compatible: true,
        compatibilityType: 'exact',
        migrationRequired: false,
        sourceVersion: this,
        targetVersion: other,
      };
    }

    // Different major versions are incompatible
    if (this.major !== other.major) {
      return {
        compatible: false,
        compatibilityType: 'none',
        reason: `Major version mismatch: ${this.major} vs ${other.major}`,
        migrationRequired: true,
        sourceVersion: this,
        targetVersion: other,
      };
    }

    // Same major version, check minor version
    if (this.minor === other.minor) {
      // Same minor version, different patch - fully compatible
      return {
        compatible: true,
        compatibilityType: this.patch >= other.patch ? 'backward' : 'forward',
        migrationRequired: false,
        sourceVersion: this,
        targetVersion: other,
      };
    }

    // Same major version, different minor version
    if (this.minor > other.minor) {
      // This version is newer (backward compatible)
      return {
        compatible: true,
        compatibilityType: 'backward',
        migrationRequired: false,
        sourceVersion: this,
        targetVersion: other,
      };
    } else {
      // This version is older (forward compatible, but might need migration)
      return {
        compatible: true,
        compatibilityType: 'forward',
        migrationRequired: true,
        sourceVersion: this,
        targetVersion: other,
      };
    }
  }

  /**
   * Compares this version with another version.
   * 
   * @param other The version to compare with
   * @returns -1 if this version is older, 0 if equal, 1 if this version is newer
   */
  compareTo(other: EventVersion): number {
    if (this.major !== other.major) {
      return this.major < other.major ? -1 : 1;
    }

    if (this.minor !== other.minor) {
      return this.minor < other.minor ? -1 : 1;
    }

    if (this.patch !== other.patch) {
      return this.patch < other.patch ? -1 : 1;
    }

    return 0;
  }

  /**
   * Checks if this version is newer than another version.
   * 
   * @param other The version to compare with
   * @returns True if this version is newer, false otherwise
   */
  isNewerThan(other: EventVersion): boolean {
    return this.compareTo(other) > 0;
  }

  /**
   * Checks if this version is older than another version.
   * 
   * @param other The version to compare with
   * @returns True if this version is older, false otherwise
   */
  isOlderThan(other: EventVersion): boolean {
    return this.compareTo(other) < 0;
  }

  /**
   * Checks if this version is equal to another version.
   * 
   * @param other The version to compare with
   * @returns True if versions are equal, false otherwise
   */
  isEqual(other: EventVersion): boolean {
    return this.compareTo(other) === 0;
  }
}

/**
 * Data Transfer Object for versioned events.
 * Wraps any event payload with version metadata to support schema evolution.
 * 
 * @template T Type of the event payload
 */
export class VersionedEventDto<T = unknown> implements IVersionedEvent<T> {
  /**
   * The schema version of this event.
   */
  @ValidateNested()
  @Type(() => EventVersionDto)
  version: EventVersionDto;

  /**
   * The event type identifier.
   * @example 'health.metric.recorded'
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * The actual event payload data.
   */
  @IsObject()
  @IsNotEmpty()
  payload: T;

  /**
   * Optional metadata associated with the event.
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  /**
   * Creates a new VersionedEventDto instance.
   * 
   * @param type Event type identifier
   * @param payload Event payload data
   * @param version Event schema version (defaults to 1.0.0)
   * @param metadata Optional event metadata
   */
  constructor(
    type: string,
    payload: T,
    version: EventVersion = new EventVersionDto(1, 0, 0),
    metadata?: Record<string, unknown>
  ) {
    this.type = type;
    this.payload = payload;
    this.version = version instanceof EventVersionDto 
      ? version 
      : new EventVersionDto(version.major, version.minor, version.patch);
    this.metadata = metadata;
  }

  /**
   * Creates a VersionedEventDto from a plain object.
   * 
   * @param data Plain object containing event data
   * @returns A new VersionedEventDto instance
   */
  static fromPlain<T>(data: Record<string, unknown>): VersionedEventDto<T> {
    if (!data) {
      throw new Error('Event data cannot be empty');
    }

    const { type, payload, version, metadata } = data;

    if (!type || typeof type !== 'string') {
      throw new Error('Event type is required and must be a string');
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Event payload is required and must be an object');
    }

    let eventVersion: EventVersionDto;

    if (!version) {
      // Default to version 1.0.0 if not specified
      eventVersion = new EventVersionDto(1, 0, 0);
    } else if (typeof version === 'string') {
      // Parse version string
      eventVersion = EventVersionDto.fromString(version);
    } else if (typeof version === 'object') {
      // Use version object
      const { major = 1, minor = 0, patch = 0 } = version as Record<string, unknown>;
      eventVersion = new EventVersionDto(
        typeof major === 'number' ? major : parseInt(String(major), 10),
        typeof minor === 'number' ? minor : parseInt(String(minor), 10),
        typeof patch === 'number' ? patch : parseInt(String(patch), 10)
      );
    } else {
      throw new Error('Invalid version format');
    }

    return new VersionedEventDto<T>(
      type as string,
      payload as T,
      eventVersion,
      metadata as Record<string, unknown>
    );
  }

  /**
   * Converts the event to a plain object suitable for serialization.
   * 
   * @returns Plain object representation of the event
   */
  toPlain(): Record<string, unknown> {
    return {
      type: this.type,
      version: this.version.toString(),
      payload: this.payload,
      ...(this.metadata ? { metadata: this.metadata } : {}),
    };
  }

  /**
   * Checks if this event is compatible with a target version.
   * 
   * @param targetVersion The target version to check compatibility with
   * @returns A VersionCompatibilityResult object
   */
  checkCompatibility(targetVersion: EventVersion): VersionCompatibilityResult {
    return this.version.checkCompatibility(targetVersion);
  }

  /**
   * Creates a new versioned event with an updated version but the same payload.
   * Useful for migrating events to a new version without changing the payload.
   * 
   * @param newVersion The new version to use
   * @returns A new VersionedEventDto with the updated version
   */
  withVersion(newVersion: EventVersion): VersionedEventDto<T> {
    return new VersionedEventDto<T>(
      this.type,
      this.payload,
      newVersion,
      this.metadata
    );
  }

  /**
   * Creates a new versioned event with an updated payload but the same version.
   * Useful for transforming the payload without changing the version.
   * 
   * @param newPayload The new payload to use
   * @returns A new VersionedEventDto with the updated payload
   */
  withPayload<R>(newPayload: R): VersionedEventDto<R> {
    return new VersionedEventDto<R>(
      this.type,
      newPayload,
      this.version,
      this.metadata
    );
  }

  /**
   * Creates a new versioned event with updated metadata.
   * 
   * @param newMetadata The new metadata to use (will be merged with existing metadata)
   * @returns A new VersionedEventDto with the updated metadata
   */
  withMetadata(newMetadata: Record<string, unknown>): VersionedEventDto<T> {
    return new VersionedEventDto<T>(
      this.type,
      this.payload,
      this.version,
      { ...this.metadata, ...newMetadata }
    );
  }
}

/**
 * Type guard to check if an object is a valid VersionedEventDto.
 * 
 * @param obj Object to check
 * @returns True if the object is a valid VersionedEventDto, false otherwise
 */
export function isVersionedEvent(obj: unknown): obj is VersionedEventDto {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const event = obj as Partial<VersionedEventDto>;
  
  return (
    typeof event.type === 'string' &&
    !!event.type &&
    !!event.payload &&
    typeof event.payload === 'object' &&
    !!event.version &&
    typeof event.version === 'object' &&
    typeof (event.version as Partial<EventVersion>).major === 'number' &&
    typeof (event.version as Partial<EventVersion>).minor === 'number' &&
    typeof (event.version as Partial<EventVersion>).patch === 'number'
  );
}

/**
 * Utility function to create a versioned event.
 * 
 * @param type Event type identifier
 * @param payload Event payload data
 * @param version Event schema version (defaults to 1.0.0)
 * @param metadata Optional event metadata
 * @returns A new VersionedEventDto instance
 */
export function createVersionedEvent<T>(
  type: string,
  payload: T,
  version?: EventVersion,
  metadata?: Record<string, unknown>
): VersionedEventDto<T> {
  return new VersionedEventDto<T>(type, payload, version, metadata);
}

/**
 * Utility function to parse a version string into an EventVersionDto.
 * 
 * @param versionString Version string in the format "major.minor.patch"
 * @returns A new EventVersionDto instance
 */
export function parseVersion(versionString: string): EventVersionDto {
  return EventVersionDto.fromString(versionString);
}

/**
 * Utility function to compare two versions.
 * 
 * @param version1 First version to compare
 * @param version2 Second version to compare
 * @returns -1 if version1 is older, 0 if equal, 1 if version1 is newer
 */
export function compareVersions(version1: EventVersion, version2: EventVersion): number {
  const v1 = version1 instanceof EventVersionDto 
    ? version1 
    : new EventVersionDto(version1.major, version1.minor, version1.patch);
  
  return v1.compareTo(version2);
}

/**
 * Utility function to check if two versions are compatible.
 * 
 * @param version1 First version to check
 * @param version2 Second version to check
 * @returns A VersionCompatibilityResult object
 */
export function checkVersionCompatibility(
  version1: EventVersion,
  version2: EventVersion
): VersionCompatibilityResult {
  const v1 = version1 instanceof EventVersionDto 
    ? version1 
    : new EventVersionDto(version1.major, version1.minor, version1.patch);
  
  return v1.checkCompatibility(version2);
}