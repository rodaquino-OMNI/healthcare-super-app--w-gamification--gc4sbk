/**
 * @file event-versioning.interface.ts
 * @description Defines interfaces for event versioning to support evolution of event schemas over time.
 * These interfaces enable backward compatibility for events, ensuring that both old and new
 * event formats can be processed correctly during system upgrades.
 */

/**
 * Represents a semantic version following the major.minor.patch format.
 * Used to track event schema versions and determine compatibility.
 */
export interface EventVersion {
  /**
   * Major version number. Incremented for breaking changes that require
   * migration or special handling.
   */
  major: number;

  /**
   * Minor version number. Incremented for backward-compatible feature additions.
   */
  minor: number;

  /**
   * Patch version number. Incremented for backward-compatible bug fixes.
   */
  patch: number;
}

/**
 * Represents an event that includes version information.
 * All versioned events in the system should implement this interface
 * to ensure proper version handling and compatibility checks.
 */
export interface IVersionedEvent<T = unknown> {
  /**
   * The schema version of this event.
   */
  version: EventVersion;

  /**
   * The event type identifier.
   */
  type: string;

  /**
   * The actual event payload data.
   */
  payload: T;

  /**
   * Optional metadata associated with the event.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Represents the result of a version compatibility check.
 */
export interface VersionCompatibilityResult {
  /**
   * Whether the versions are compatible.
   */
  compatible: boolean;

  /**
   * The type of compatibility (exact, backward, forward, none).
   */
  compatibilityType?: 'exact' | 'backward' | 'forward' | 'none';

  /**
   * Reason for incompatibility, if applicable.
   */
  reason?: string;

  /**
   * Whether migration is required to handle this event.
   */
  migrationRequired: boolean;

  /**
   * The source version being checked.
   */
  sourceVersion: EventVersion;

  /**
   * The target version being checked against.
   */
  targetVersion: EventVersion;
}

/**
 * Defines a strategy for detecting the version of an event.
 */
export interface VersionDetectionStrategy {
  /**
   * Detects the version from an event or event-like object.
   * 
   * @param event The event or event-like object to detect version from
   * @returns The detected EventVersion or null if version cannot be detected
   */
  detectVersion(event: unknown): EventVersion | null;

  /**
   * Checks if this strategy can handle the given event.
   * 
   * @param event The event to check
   * @returns True if this strategy can handle the event, false otherwise
   */
  canHandle(event: unknown): boolean;
}

/**
 * Defines a strategy for checking compatibility between event versions.
 */
export interface VersionCompatibilityStrategy {
  /**
   * Checks if two versions are compatible according to this strategy.
   * 
   * @param sourceVersion The source version to check
   * @param targetVersion The target version to check against
   * @returns A VersionCompatibilityResult with the compatibility details
   */
  checkCompatibility(sourceVersion: EventVersion, targetVersion: EventVersion): VersionCompatibilityResult;
}

/**
 * Represents a migration path between two event versions.
 */
export interface VersionMigrationPath<TSource = unknown, TTarget = unknown> {
  /**
   * The source version this migration starts from.
   */
  sourceVersion: EventVersion;

  /**
   * The target version this migration leads to.
   */
  targetVersion: EventVersion;

  /**
   * Transforms an event from the source version to the target version.
   * 
   * @param sourceEvent The event in the source version format
   * @returns The transformed event in the target version format
   */
  migrate(sourceEvent: IVersionedEvent<TSource>): IVersionedEvent<TTarget>;
}

/**
 * Options for event transformation between versions.
 */
export interface EventTransformationOptions {
  /**
   * Whether to validate the transformed event against the target schema.
   * Default is true.
   */
  validate?: boolean;

  /**
   * Whether to throw an error if validation fails.
   * Default is true.
   */
  throwOnValidationError?: boolean;

  /**
   * Whether to preserve additional fields not defined in the target schema.
   * Default is false.
   */
  preserveExtraFields?: boolean;

  /**
   * Custom transformation context that can be used by transformers.
   */
  context?: Record<string, unknown>;
}

/**
 * Defines a strategy for handling event versioning throughout the system.
 * This is the main interface that orchestrates version detection, compatibility checking,
 * and migration between versions.
 */
export interface EventVersioningStrategy {
  /**
   * Detects the version of an event.
   * 
   * @param event The event to detect version from
   * @returns The detected EventVersion
   * @throws If version cannot be detected
   */
  detectVersion(event: unknown): EventVersion;

  /**
   * Checks if an event is compatible with a target version.
   * 
   * @param event The event to check compatibility for
   * @param targetVersion The target version to check against
   * @returns A VersionCompatibilityResult with compatibility details
   */
  checkCompatibility(event: unknown, targetVersion: EventVersion): VersionCompatibilityResult;

  /**
   * Transforms an event to a target version if possible.
   * 
   * @param event The event to transform
   * @param targetVersion The target version to transform to
   * @param options Optional transformation options
   * @returns The transformed event in the target version format
   * @throws If transformation is not possible or fails
   */
  transformToVersion<T = unknown, R = unknown>(
    event: IVersionedEvent<T>,
    targetVersion: EventVersion,
    options?: EventTransformationOptions
  ): IVersionedEvent<R>;

  /**
   * Registers a migration path between two versions.
   * 
   * @param migrationPath The migration path to register
   */
  registerMigrationPath<TSource = unknown, TTarget = unknown>(
    migrationPath: VersionMigrationPath<TSource, TTarget>
  ): void;

  /**
   * Gets all registered migration paths.
   * 
   * @returns Array of all registered migration paths
   */
  getMigrationPaths(): VersionMigrationPath[];

  /**
   * Finds a migration path between two versions.
   * 
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns The migration path if found, null otherwise
   */
  findMigrationPath<TSource = unknown, TTarget = unknown>(
    sourceVersion: EventVersion,
    targetVersion: EventVersion
  ): VersionMigrationPath<TSource, TTarget> | null;
}

/**
 * Utility type for parsing a version string into an EventVersion object.
 */
export type ParsedVersion = EventVersion;

/**
 * Represents a range of compatible versions.
 */
export interface VersionRange {
  /**
   * The minimum version in the range (inclusive).
   */
  minVersion: EventVersion;

  /**
   * The maximum version in the range (inclusive).
   */
  maxVersion: EventVersion;

  /**
   * Checks if a version is within this range.
   * 
   * @param version The version to check
   * @returns True if the version is within the range, false otherwise
   */
  includes(version: EventVersion): boolean;
}