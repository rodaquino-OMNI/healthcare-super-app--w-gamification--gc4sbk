/**
 * @file event-versioning.interface.ts
 * @description Defines interfaces for event schema versioning and evolution, enabling
 * backward compatibility for events across different versions. Provides utilities for
 * version detection, schema migration, and handling of deprecated fields or structures.
 */

/**
 * Represents the version information for an event schema.
 * Follows semantic versioning (major.minor.patch) principles.
 */
export interface IEventVersion {
  /**
   * Major version number. Incremented for breaking changes that require
   * migration or transformation of event data.
   */
  major: number;

  /**
   * Minor version number. Incremented for backward-compatible additions
   * to the event schema (new optional fields).
   */
  minor: number;

  /**
   * Patch version number. Incremented for backward-compatible bug fixes
   * that don't affect the schema structure.
   */
  patch: number;

  /**
   * Optional string representation of the version (e.g., "1.0.0").
   * If not provided, it will be generated from major, minor, and patch.
   */
  versionString?: string;
}

/**
 * Represents an event that supports versioning.
 * Extends the base event structure with version information.
 */
export interface IVersionedEvent<T = any> {
  /**
   * The version information for this event.
   * Can be a string ("1.0.0") or an IEventVersion object.
   */
  version: string | IEventVersion;

  /**
   * The event type identifier.
   */
  type: string;

  /**
   * The event payload data.
   */
  payload: T;

  /**
   * Optional metadata about the event.
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a function that transforms an event from one version to another.
 * Used for migrating events between different schema versions.
 */
export interface IEventTransformer<TSource = any, TTarget = any> {
  /**
   * Source version that this transformer can handle.
   */
  sourceVersion: string | IEventVersion;

  /**
   * Target version that this transformer produces.
   */
  targetVersion: string | IEventVersion;

  /**
   * Transforms an event from the source version to the target version.
   * @param event The event to transform
   * @returns The transformed event
   */
  transform(event: IVersionedEvent<TSource>): IVersionedEvent<TTarget>;
}

/**
 * Represents a migration path between two event versions.
 * Defines how to upgrade or downgrade between specific versions.
 */
export interface IEventMigrationPath<TSource = any, TTarget = any> {
  /**
   * Source version for this migration path.
   */
  sourceVersion: string | IEventVersion;

  /**
   * Target version for this migration path.
   */
  targetVersion: string | IEventVersion;

  /**
   * Indicates if this is an upgrade (older to newer) or downgrade (newer to older) path.
   */
  direction: 'upgrade' | 'downgrade';

  /**
   * The transformer function that performs the actual migration.
   */
  transformer: IEventTransformer<TSource, TTarget>;
}

/**
 * Options for event version detection.
 */
export interface IVersionDetectionOptions {
  /**
   * The field name where the version information is stored.
   * Default is 'version'.
   */
  versionField?: string;

  /**
   * Whether to throw an error if version cannot be detected.
   * Default is true.
   */
  throwOnMissing?: boolean;

  /**
   * Default version to use if version cannot be detected and throwOnMissing is false.
   */
  defaultVersion?: string | IEventVersion;

  /**
   * Custom detection strategies to use before falling back to standard detection.
   */
  detectionStrategies?: IVersionDetectionStrategy[];
}

/**
 * Strategy for detecting the version of an event.
 */
export interface IVersionDetectionStrategy {
  /**
   * Unique identifier for this detection strategy.
   */
  id: string;

  /**
   * Detects the version of an event.
   * @param event The event to detect the version for
   * @param options Additional options for version detection
   * @returns The detected version or null if version cannot be detected
   */
  detect(event: any, options?: IVersionDetectionOptions): string | IEventVersion | null;
}

/**
 * Options for event schema compatibility checking.
 */
export interface ICompatibilityCheckOptions {
  /**
   * Whether to use strict compatibility checking.
   * In strict mode, any schema difference is considered incompatible.
   * In non-strict mode, only breaking changes are considered incompatible.
   * Default is false.
   */
  strict?: boolean;

  /**
   * Whether to ignore additional properties in the event.
   * Default is true.
   */
  ignoreAdditionalProperties?: boolean;

  /**
   * Fields to ignore during compatibility checking.
   */
  ignoreFields?: string[];
}

/**
 * Result of a compatibility check between two event versions.
 */
export interface ICompatibilityCheckResult {
  /**
   * Whether the versions are compatible.
   */
  compatible: boolean;

  /**
   * The compatibility level between the versions.
   * - 'identical': Schemas are identical
   * - 'compatible': Schemas are compatible (no breaking changes)
   * - 'breaking': Schemas have breaking changes
   */
  level: 'identical' | 'compatible' | 'breaking';

  /**
   * List of incompatibilities found during the check.
   * Empty if compatible is true.
   */
  incompatibilities?: string[];

  /**
   * Source version used in the compatibility check.
   */
  sourceVersion: string | IEventVersion;

  /**
   * Target version used in the compatibility check.
   */
  targetVersion: string | IEventVersion;
}

/**
 * Options for event schema migration.
 */
export interface IMigrationOptions {
  /**
   * Whether to validate the migrated event against the target schema.
   * Default is true.
   */
  validate?: boolean;

  /**
   * Whether to throw an error if migration fails.
   * Default is true.
   */
  throwOnError?: boolean;

  /**
   * Whether to automatically find the migration path.
   * If false, an exact migration path must exist.
   * Default is true.
   */
  autoFindPath?: boolean;

  /**
   * Custom context data to pass to transformers.
   */
  context?: Record<string, any>;
}

/**
 * Result of an event migration operation.
 */
export interface IMigrationResult<T = any> {
  /**
   * Whether the migration was successful.
   */
  success: boolean;

  /**
   * The migrated event if successful.
   */
  event?: IVersionedEvent<T>;

  /**
   * Error information if migration failed.
   */
  error?: {
    message: string;
    code: string;
    details?: any;
  };

  /**
   * Source version used in the migration.
   */
  sourceVersion: string | IEventVersion;

  /**
   * Target version used in the migration.
   */
  targetVersion: string | IEventVersion;

  /**
   * Migration path used for the operation.
   */
  path?: IEventMigrationPath[];
}

/**
 * Registry for event schema versions and migration paths.
 */
export interface IEventSchemaRegistry {
  /**
   * Registers a new event schema version.
   * @param eventType The event type
   * @param version The version information
   * @param schema The schema definition
   */
  registerSchema(eventType: string, version: string | IEventVersion, schema: any): void;

  /**
   * Registers a migration path between two versions of an event.
   * @param eventType The event type
   * @param migrationPath The migration path definition
   */
  registerMigrationPath<TSource = any, TTarget = any>(
    eventType: string,
    migrationPath: IEventMigrationPath<TSource, TTarget>
  ): void;

  /**
   * Gets the schema for a specific event type and version.
   * @param eventType The event type
   * @param version The version information
   * @returns The schema definition or null if not found
   */
  getSchema(eventType: string, version: string | IEventVersion): any | null;

  /**
   * Gets all registered versions for an event type.
   * @param eventType The event type
   * @returns Array of registered versions
   */
  getVersions(eventType: string): (string | IEventVersion)[];

  /**
   * Gets the latest version for an event type.
   * @param eventType The event type
   * @returns The latest version or null if no versions are registered
   */
  getLatestVersion(eventType: string): string | IEventVersion | null;

  /**
   * Finds a migration path between two versions of an event.
   * @param eventType The event type
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns The migration path or null if no path exists
   */
  findMigrationPath(
    eventType: string,
    sourceVersion: string | IEventVersion,
    targetVersion: string | IEventVersion
  ): IEventMigrationPath[] | null;
}

/**
 * Service for handling event versioning operations.
 */
export interface IEventVersioningService {
  /**
   * Detects the version of an event.
   * @param event The event to detect the version for
   * @param options Options for version detection
   * @returns The detected version
   */
  detectVersion(event: any, options?: IVersionDetectionOptions): string | IEventVersion;

  /**
   * Checks if two event versions are compatible.
   * @param eventType The event type
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param options Options for compatibility checking
   * @returns The compatibility check result
   */
  checkCompatibility(
    eventType: string,
    sourceVersion: string | IEventVersion,
    targetVersion: string | IEventVersion,
    options?: ICompatibilityCheckOptions
  ): ICompatibilityCheckResult;

  /**
   * Migrates an event from one version to another.
   * @param event The event to migrate
   * @param targetVersion The target version
   * @param options Options for migration
   * @returns The migration result
   */
  migrateEvent<TSource = any, TTarget = any>(
    event: IVersionedEvent<TSource>,
    targetVersion: string | IEventVersion,
    options?: IMigrationOptions
  ): IMigrationResult<TTarget>;

  /**
   * Gets the schema registry.
   * @returns The event schema registry
   */
  getRegistry(): IEventSchemaRegistry;
}