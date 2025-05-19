/**
 * Types for event versioning system that complement the interfaces defined in the interfaces folder.
 * Provides utility types for version manipulation, migration path definitions, transformation options,
 * and version comparison to ensure strong typing throughout the versioning module.
 */

import { IVersionedEvent, EventVersion, EventVersioningStrategy } from '../interfaces/event-versioning.interface';

/**
 * Represents a parsed semantic version with major, minor, and patch components.
 */
export type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
};

/**
 * Defines a range of versions from minimum to maximum (inclusive).
 */
export type VersionRange = {
  min: EventVersion;
  max: EventVersion;
};

/**
 * Represents the result of a version comparison operation.
 */
export type VersionComparisonResult = {
  compatible: boolean;
  reason?: string;
  details?: {
    isNewer: boolean;
    isSameMajor: boolean;
    breakingChange: boolean;
  };
};

/**
 * Defines a migration path between two specific versions.
 */
export type MigrationPath = {
  sourceVersion: EventVersion;
  targetVersion: EventVersion;
  migrationFn: MigrationFunction;
};

/**
 * Function signature for migrating an event from one version to another.
 */
export type MigrationFunction = <T extends IVersionedEvent>(event: T) => T;

/**
 * Options for event transformation operations.
 */
export type TransformationOptions = {
  /** Whether to validate the transformed event against the target schema */
  validate?: boolean;
  /** Whether to throw an error if validation fails (otherwise returns null) */
  throwOnError?: boolean;
  /** Custom transformation context data */
  context?: Record<string, unknown>;
  /** Whether to preserve the original event's metadata */
  preserveMetadata?: boolean;
};

/**
 * Result of a transformation operation.
 */
export type TransformationResult<T extends IVersionedEvent> = {
  success: boolean;
  transformed?: T;
  error?: Error;
  warnings?: string[];
};

/**
 * Discriminated union for different version detection strategies.
 */
export type VersionDetectionStrategy =
  | {
      type: 'explicit';
      field: string;
    }
  | {
      type: 'header';
      headerName: string;
    }
  | {
      type: 'structure';
      versionMap: Record<string, EventVersion>;
      structureChecks: Array<(payload: unknown) => boolean>;
    }
  | {
      type: 'fallback';
      defaultVersion: EventVersion;
    };

/**
 * Configuration options for version detection.
 */
export type VersionDetectionOptions = {
  strategies: VersionDetectionStrategy[];
  throwOnFailure?: boolean;
  defaultVersion?: EventVersion;
};

/**
 * Result of a version detection operation.
 */
export type VersionDetectionResult = {
  success: boolean;
  version?: EventVersion;
  strategy?: string;
  error?: Error;
};

/**
 * Defines a schema version mapping for a specific event type.
 */
export type EventSchemaVersionMap = {
  eventType: string;
  versions: Record<EventVersion, unknown>;
  latestVersion: EventVersion;
};

/**
 * Options for schema-based migration.
 */
export type SchemaMigrationOptions = {
  /** Whether to validate against the target schema after migration */
  validateResult?: boolean;
  /** Whether to use automatic field mapping for compatible fields */
  useAutoMapping?: boolean;
  /** Custom field mappings for specific version transitions */
  fieldMappings?: Record<string, string>;
  /** Fields to exclude from automatic mapping */
  excludeFields?: string[];
};

/**
 * Type guard to check if an object is a versioned event.
 */
export function isVersionedEvent(obj: unknown): obj is IVersionedEvent {
  if (!obj || typeof obj !== 'object') return false;
  
  const event = obj as Partial<IVersionedEvent>;
  return (
    typeof event.version === 'string' &&
    typeof event.eventId === 'string' &&
    typeof event.type === 'string' &&
    event.payload !== undefined
  );
}

/**
 * Type guard to check if a string is a valid semantic version.
 */
export function isValidVersion(version: string): version is EventVersion {
  // Simple semver validation regex (major.minor.patch)
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
  return semverRegex.test(version);
}

/**
 * Type for a function that determines if two versions are compatible.
 */
export type VersionCompatibilityChecker = (
  sourceVersion: EventVersion,
  targetVersion: EventVersion
) => VersionComparisonResult;

/**
 * Type for a function that parses a version string into its components.
 */
export type VersionParser = (version: EventVersion) => ParsedVersion;