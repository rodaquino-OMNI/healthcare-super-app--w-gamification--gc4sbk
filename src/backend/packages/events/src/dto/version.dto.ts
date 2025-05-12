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
  IsObject,
  IsString,
  ValidateNested,
  IsInt,
  Min,
  IsOptional,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

import {
  EventVersion,
  IVersionedEvent,
  VersionCompatibility,
  versionToString,
  parseVersion,
  compareVersions,
} from '../interfaces/event-versioning.interface';

/**
 * Custom validator to ensure the version follows semantic versioning format
 */
@ValidatorConstraint({ name: 'isValidSemVer', async: false })
export class IsValidSemVerConstraint implements ValidatorConstraintInterface {
  validate(version: EventVersion) {
    if (!version || typeof version !== 'object') return false;
    if (typeof version.major !== 'number' || version.major < 0) return false;
    if (typeof version.minor !== 'number' || version.minor < 0) return false;
    if (typeof version.patch !== 'number' || version.patch < 0) return false;
    return true;
  }

  defaultMessage() {
    return 'Version must follow semantic versioning format (major.minor.patch) with non-negative integers';
  }
}

/**
 * DTO representing the version information for an event schema.
 * Follows the Semantic Versioning 2.0.0 specification (https://semver.org/).
 */
export class EventVersionDto implements EventVersion {
  /**
   * Major version number. Incremented for incompatible API changes.
   * When the major version changes, events may have breaking changes that require
   * explicit migration or transformation.
   */
  @IsInt()
  @Min(0)
  major: number;

  /**
   * Minor version number. Incremented for added functionality in a backward-compatible manner.
   * When only the minor version changes, new fields or capabilities may be added, but
   * existing fields maintain the same semantics.
   */
  @IsInt()
  @Min(0)
  minor: number;

  /**
   * Patch version number. Incremented for backward-compatible bug fixes.
   * When only the patch version changes, the event schema remains fully compatible,
   * with only implementation details or documentation being updated.
   */
  @IsInt()
  @Min(0)
  patch: number;

  /**
   * Creates a new EventVersionDto instance.
   * @param major - The major version number
   * @param minor - The minor version number
   * @param patch - The patch version number
   */
  constructor(major = 1, minor = 0, patch = 0) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  /**
   * Converts the version to a string in the format "major.minor.patch".
   * @returns The version string
   */
  toString(): string {
    return versionToString(this);
  }

  /**
   * Creates an EventVersionDto from a version string.
   * @param versionStr - The version string in the format "major.minor.patch"
   * @returns A new EventVersionDto instance
   */
  static fromString(versionStr: string): EventVersionDto {
    const { major, minor, patch } = parseVersion(versionStr);
    return new EventVersionDto(major, minor, patch);
  }

  /**
   * Compares this version with another version.
   * @param other - The version to compare with
   * @returns The compatibility level between the two versions
   */
  compareWith(other: EventVersion): VersionCompatibility {
    return compareVersions(this, other);
  }

  /**
   * Checks if this version is compatible with another version.
   * @param other - The version to check compatibility with
   * @returns True if the versions are compatible, false otherwise
   */
  isCompatibleWith(other: EventVersion): boolean {
    const compatibility = this.compareWith(other);
    return (
      compatibility === VersionCompatibility.COMPATIBLE ||
      compatibility === VersionCompatibility.BACKWARD_COMPATIBLE
    );
  }

  /**
   * Checks if this version is greater than another version.
   * @param other - The version to compare with
   * @returns True if this version is greater, false otherwise
   */
  isGreaterThan(other: EventVersion): boolean {
    if (this.major > other.major) return true;
    if (this.major < other.major) return false;
    if (this.minor > other.minor) return true;
    if (this.minor < other.minor) return false;
    return this.patch > other.patch;
  }

  /**
   * Checks if this version is equal to another version.
   * @param other - The version to compare with
   * @returns True if the versions are equal, false otherwise
   */
  isEqual(other: EventVersion): boolean {
    return (
      this.major === other.major &&
      this.minor === other.minor &&
      this.patch === other.patch
    );
  }
}

/**
 * DTO for versioned events that wraps any event payload with version metadata.
 * This class implements the IVersionedEvent interface and provides validation
 * for versioned events.
 * 
 * @template T - The type of the event payload
 */
export class VersionedEventDto<T = unknown> implements IVersionedEvent {
  /**
   * The schema version of this event.
   * Used to determine compatibility and processing strategies.
   */
  @ValidateNested()
  @Type(() => EventVersionDto)
  @Validate(IsValidSemVerConstraint)
  version: EventVersionDto;

  /**
   * The type of the event.
   * This should be a string identifier that uniquely identifies the event type.
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * The payload of the event.
   * This contains the actual data associated with the event.
   */
  @IsObject()
  payload: T;

  /**
   * Optional metadata for the event.
   * This can include information like the source service, correlation IDs, etc.
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  /**
   * Creates a new VersionedEventDto instance.
   * @param type - The event type
   * @param payload - The event payload
   * @param version - The event version (defaults to 1.0.0)
   * @param metadata - Optional metadata for the event
   */
  constructor(type: string, payload: T, version?: EventVersion, metadata?: Record<string, unknown>) {
    this.type = type;
    this.payload = payload;
    this.version = version ? new EventVersionDto(version.major, version.minor, version.patch) : new EventVersionDto();
    this.metadata = metadata;
  }

  /**
   * Creates a new versioned event with the same type and metadata but a different payload and version.
   * @param payload - The new payload
   * @param version - The new version (optional)
   * @returns A new VersionedEventDto instance
   */
  withPayload<U>(payload: U, version?: EventVersion): VersionedEventDto<U> {
    return new VersionedEventDto<U>(
      this.type,
      payload,
      version || this.version,
      this.metadata
    );
  }

  /**
   * Creates a new versioned event with the same type, payload, and metadata but a different version.
   * @param version - The new version
   * @returns A new VersionedEventDto instance
   */
  withVersion(version: EventVersion): VersionedEventDto<T> {
    return new VersionedEventDto<T>(
      this.type,
      this.payload,
      version,
      this.metadata
    );
  }

  /**
   * Creates a new versioned event with the same type, payload, and version but different metadata.
   * @param metadata - The new metadata
   * @returns A new VersionedEventDto instance
   */
  withMetadata(metadata: Record<string, unknown>): VersionedEventDto<T> {
    return new VersionedEventDto<T>(
      this.type,
      this.payload,
      this.version,
      { ...this.metadata, ...metadata }
    );
  }

  /**
   * Creates a VersionedEventDto from a plain object.
   * @param obj - The object to create the DTO from
   * @returns A new VersionedEventDto instance
   */
  static fromObject<T>(obj: any): VersionedEventDto<T> {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Invalid event object');
    }

    if (!obj.type || typeof obj.type !== 'string') {
      throw new Error('Event object must have a valid type property');
    }

    if (!obj.payload || typeof obj.payload !== 'object') {
      throw new Error('Event object must have a valid payload property');
    }

    let version: EventVersionDto;
    if (obj.version) {
      if (typeof obj.version === 'string') {
        version = EventVersionDto.fromString(obj.version);
      } else if (typeof obj.version === 'object') {
        version = new EventVersionDto(
          obj.version.major || 1,
          obj.version.minor || 0,
          obj.version.patch || 0
        );
      } else {
        version = new EventVersionDto();
      }
    } else {
      version = new EventVersionDto();
    }

    return new VersionedEventDto<T>(
      obj.type,
      obj.payload as T,
      version,
      obj.metadata
    );
  }

  /**
   * Checks if this event is compatible with a target version.
   * @param targetVersion - The target version to check compatibility with
   * @returns True if the event is compatible with the target version, false otherwise
   */
  isCompatibleWith(targetVersion: EventVersion): boolean {
    return this.version.isCompatibleWith(targetVersion);
  }

  /**
   * Checks if this event needs to be upgraded to be compatible with a target version.
   * @param targetVersion - The target version to check against
   * @returns True if the event needs to be upgraded, false otherwise
   */
  needsUpgrade(targetVersion: EventVersion): boolean {
    return targetVersion.isGreaterThan(this.version);
  }

  /**
   * Checks if this event needs to be downgraded to be compatible with a target version.
   * @param targetVersion - The target version to check against
   * @returns True if the event needs to be downgraded, false otherwise
   */
  needsDowngrade(targetVersion: EventVersion): boolean {
    return this.version.isGreaterThan(targetVersion);
  }
}

/**
 * Factory function to create a versioned event.
 * @param type - The event type
 * @param payload - The event payload
 * @param version - The event version (optional, defaults to 1.0.0)
 * @param metadata - Optional metadata for the event
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
 * Utility function to extract the payload from a versioned event.
 * @param event - The versioned event
 * @returns The event payload
 */
export function extractPayload<T>(event: VersionedEventDto<T>): T {
  return event.payload;
}

/**
 * Utility function to extract the version from a versioned event.
 * @param event - The versioned event
 * @returns The event version
 */
export function extractVersion(event: VersionedEventDto<unknown>): EventVersionDto {
  return event.version;
}

/**
 * Utility function to extract the type from a versioned event.
 * @param event - The versioned event
 * @returns The event type
 */
export function extractType(event: VersionedEventDto<unknown>): string {
  return event.type;
}

/**
 * Utility function to extract the metadata from a versioned event.
 * @param event - The versioned event
 * @returns The event metadata, or an empty object if no metadata is present
 */
export function extractMetadata(event: VersionedEventDto<unknown>): Record<string, unknown> {
  return event.metadata || {};
}