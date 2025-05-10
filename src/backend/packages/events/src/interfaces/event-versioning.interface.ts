/**
 * @file event-versioning.interface.ts
 * @description Defines interfaces for event versioning to support evolution of event schemas over time.
 * These interfaces enable backward compatibility for events, ensuring that both old and new
 * event formats can be processed correctly during system upgrades.
 */

/**
 * Represents a semantic version for events following the major.minor.patch format.
 * Used to track event schema versions and determine compatibility.
 */
export interface EventVersion {
  /**
   * Major version number. Incremented for breaking changes that require
   * explicit migration or handling.
   */
  major: number;

  /**
   * Minor version number. Incremented for backward-compatible additions
   * to the event schema.
   */
  minor: number;

  /**
   * Patch version number. Incremented for backward-compatible bug fixes
   * that don't affect the event schema structure.
   */
  patch: number;
}

/**
 * Interface for events that include version information.
 * All versioned events in the system should implement this interface
 * to enable proper version detection and handling.
 */
export interface IVersionedEvent {
  /**
   * The version of the event schema, following semantic versioning principles.
   * Can be represented as a string ("1.0.0") or as an EventVersion object.
   */
  version: string | EventVersion;

  /**
   * Unique identifier for the event.
   */
  eventId: string;

  /**
   * The type of the event, used for routing and processing.
   */
  type: string;

  /**
   * Timestamp when the event was created.
   */
  timestamp: string | Date;

  /**
   * The source system or service that generated the event.
   */
  source: string;

  /**
   * The event payload containing the actual data.
   */
  payload: Record<string, any>;

  /**
   * Optional metadata for the event, can include journey-specific context.
   */
  metadata?: Record<string, any>;
}

/**
 * Represents the result of a version compatibility check between two event versions.
 */
export interface VersionCompatibilityResult {
  /**
   * Whether the versions are compatible without any transformation.
   */
  compatible: boolean;

  /**
   * Whether a transformation is possible to make the versions compatible.
   */
  transformable: boolean;

  /**
   * The type of compatibility between the versions.
   */
  compatibilityType?: 'exact' | 'backward' | 'forward' | 'none';

  /**
   * Optional details about the compatibility check result.
   */
  details?: string;
}

/**
 * Interface for strategies that determine version compatibility between events.
 */
export interface VersionCompatibilityStrategy {
  /**
   * Checks if two event versions are compatible.
   * 
   * @param sourceVersion - The source event version
   * @param targetVersion - The target event version
   * @returns A result indicating compatibility and transformation options
   */
  checkCompatibility(sourceVersion: EventVersion | string, targetVersion: EventVersion | string): VersionCompatibilityResult;
}

/**
 * Interface for transforming events between different versions.
 */
export interface EventTransformer<T extends IVersionedEvent = IVersionedEvent> {
  /**
   * The source version this transformer can handle.
   */
  sourceVersion: EventVersion | string;

  /**
   * The target version this transformer produces.
   */
  targetVersion: EventVersion | string;

  /**
   * Transforms an event from the source version to the target version.
   * 
   * @param event - The event to transform
   * @returns The transformed event
   */
  transform(event: T): T;

  /**
   * Checks if this transformer can handle the given event.
   * 
   * @param event - The event to check
   * @returns True if this transformer can handle the event
   */
  canTransform(event: T): boolean;
}

/**
 * Options for event version detection.
 */
export interface VersionDetectionOptions {
  /**
   * The field name in the event object that contains the version information.
   * Default is 'version'.
   */
  versionField?: string;

  /**
   * Whether to throw an error if version detection fails.
   * Default is true.
   */
  throwOnFailure?: boolean;

  /**
   * Default version to use if version detection fails and throwOnFailure is false.
   */
  defaultVersion?: EventVersion | string;

  /**
   * Additional detection strategies to use if the primary strategy fails.
   */
  fallbackStrategies?: VersionDetectionStrategy[];
}

/**
 * Interface for strategies that detect the version of an event.
 */
export interface VersionDetectionStrategy {
  /**
   * Detects the version of an event.
   * 
   * @param event - The event to detect the version from
   * @param options - Options for version detection
   * @returns The detected version or null if detection failed
   */
  detectVersion(event: any, options?: VersionDetectionOptions): EventVersion | string | null;
}

/**
 * Interface for the overall event versioning strategy that combines
 * version detection, compatibility checking, and transformation.
 */
export interface EventVersioningStrategy {
  /**
   * Detects the version of an event.
   * 
   * @param event - The event to detect the version from
   * @param options - Options for version detection
   * @returns The detected version
   */
  detectVersion(event: any, options?: VersionDetectionOptions): EventVersion | string;

  /**
   * Checks if two event versions are compatible.
   * 
   * @param sourceVersion - The source event version
   * @param targetVersion - The target event version
   * @returns A result indicating compatibility and transformation options
   */
  checkCompatibility(sourceVersion: EventVersion | string, targetVersion: EventVersion | string): VersionCompatibilityResult;

  /**
   * Transforms an event from one version to another if possible.
   * 
   * @param event - The event to transform
   * @param targetVersion - The target version to transform to
   * @returns The transformed event
   * @throws Error if transformation is not possible
   */
  transformEvent<T extends IVersionedEvent>(event: T, targetVersion: EventVersion | string): T;

  /**
   * Registers a transformer for converting between specific versions.
   * 
   * @param transformer - The transformer to register
   */
  registerTransformer<T extends IVersionedEvent>(transformer: EventTransformer<T>): void;

  /**
   * Gets the latest supported version for a given event type.
   * 
   * @param eventType - The type of event
   * @returns The latest supported version
   */
  getLatestVersion(eventType?: string): EventVersion | string;

  /**
   * Gets the minimum supported version for a given event type.
   * 
   * @param eventType - The type of event
   * @returns The minimum supported version
   */
  getMinimumSupportedVersion(eventType?: string): EventVersion | string;
}

/**
 * Interface for a migration path between two event versions.
 */
export interface EventMigrationPath<T extends IVersionedEvent = IVersionedEvent> {
  /**
   * The source version this migration path starts from.
   */
  sourceVersion: EventVersion | string;

  /**
   * The target version this migration path leads to.
   */
  targetVersion: EventVersion | string;

  /**
   * The event type this migration path applies to.
   * If not specified, applies to all event types.
   */
  eventType?: string;

  /**
   * Migrates an event from the source version to the target version.
   * 
   * @param event - The event to migrate
   * @returns The migrated event
   */
  migrate(event: T): T;

  /**
   * Validates that the migrated event conforms to the target schema.
   * 
   * @param event - The migrated event to validate
   * @returns True if the event is valid according to the target schema
   */
  validate?(event: T): boolean;
}

/**
 * Interface for a registry of event migration paths.
 */
export interface EventMigrationRegistry {
  /**
   * Registers a migration path for a specific event type and version transition.
   * 
   * @param migrationPath - The migration path to register
   */
  registerMigrationPath<T extends IVersionedEvent>(migrationPath: EventMigrationPath<T>): void;

  /**
   * Finds a migration path for a specific event type and version transition.
   * 
   * @param sourceVersion - The source version
   * @param targetVersion - The target version
   * @param eventType - The event type
   * @returns The migration path if found, null otherwise
   */
  findMigrationPath<T extends IVersionedEvent>(
    sourceVersion: EventVersion | string,
    targetVersion: EventVersion | string,
    eventType?: string
  ): EventMigrationPath<T> | null;

  /**
   * Migrates an event from its current version to the target version.
   * 
   * @param event - The event to migrate
   * @param targetVersion - The target version
   * @returns The migrated event
   * @throws Error if no migration path is found
   */
  migrateEvent<T extends IVersionedEvent>(event: T, targetVersion: EventVersion | string): T;

  /**
   * Gets all registered migration paths.
   * 
   * @returns All registered migration paths
   */
  getAllMigrationPaths<T extends IVersionedEvent>(): EventMigrationPath<T>[];

  /**
   * Clears all registered migration paths.
   */
  clearMigrationPaths(): void;
}

/**
 * Utility type for parsing a version string into an EventVersion object.
 */
export type ParsedVersion = EventVersion;

/**
 * Utility type for representing a version range with minimum and maximum versions.
 */
export interface VersionRange {
  /**
   * The minimum version in the range (inclusive).
   */
  min: EventVersion | string;

  /**
   * The maximum version in the range (inclusive).
   */
  max: EventVersion | string;
}