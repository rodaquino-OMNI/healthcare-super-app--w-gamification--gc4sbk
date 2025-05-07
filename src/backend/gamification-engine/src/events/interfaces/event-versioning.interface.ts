/**
 * @file event-versioning.interface.ts
 * @description Defines interfaces for event schema versioning and evolution, enabling
 * backward compatibility for events across different versions. Provides utilities for
 * version detection, schema migration, and handling of deprecated fields or structures.
 */

/**
 * Represents a semantic version number for event schemas.
 * Follows the major.minor.patch format according to Semantic Versioning 2.0.0.
 */
export interface IEventVersion {
  /**
   * Major version number. Incremented for incompatible API changes.
   * Events with different major versions are considered incompatible.
   */
  major: number;

  /**
   * Minor version number. Incremented for added functionality in a backward-compatible manner.
   * Events with higher minor versions can be downgraded to lower minor versions of the same major.
   */
  minor: number;

  /**
   * Patch version number. Incremented for backward-compatible bug fixes.
   * Events with different patch versions are fully compatible.
   */
  patch: number;
}

/**
 * Represents an event that includes version information.
 * All versioned events must include a version field to enable proper handling
 * across different service versions.
 */
export interface IVersionedEvent<T = unknown> {
  /**
   * The semantic version of the event schema.
   * Can be represented as an IEventVersion object or a string in the format "major.minor.patch".
   */
  version: IEventVersion | string;

  /**
   * The event payload containing the actual event data.
   * The structure of this payload may vary between versions.
   */
  payload: T;

  /**
   * Optional metadata about the event version.
   * Can include information about deprecated fields, schema changes, etc.
   */
  versionMetadata?: IVersionMetadata;
}

/**
 * Metadata about an event version, including information about
 * deprecated fields, breaking changes, and migration paths.
 */
export interface IVersionMetadata {
  /**
   * List of fields that are deprecated in this version.
   * These fields may be removed in future versions.
   */
  deprecatedFields?: string[];

  /**
   * List of fields that are required in this version but were optional or non-existent in previous versions.
   */
  newRequiredFields?: string[];

  /**
   * List of fields that have changed their type or structure in this version.
   */
  changedFieldTypes?: IFieldTypeChange[];

  /**
   * The minimum version that is compatible with this version.
   * Events with versions lower than this cannot be automatically upgraded.
   */
  minimumCompatibleVersion?: string;

  /**
   * Additional notes about this version, such as migration instructions or known issues.
   */
  notes?: string;
}

/**
 * Represents a change in the type or structure of a field between versions.
 */
export interface IFieldTypeChange {
  /**
   * The name of the field that has changed.
   */
  fieldName: string;

  /**
   * The type of the field in the previous version.
   */
  previousType: string;

  /**
   * The type of the field in the current version.
   */
  currentType: string;

  /**
   * Optional transformation function to convert values from the previous type to the current type.
   */
  transform?: (value: any) => any;
}

/**
 * Defines the strategy for handling version compatibility.
 * Different strategies can be used depending on the requirements of the service.
 */
export enum VersionCompatibilityStrategy {
  /**
   * Strict compatibility requires exact version matches.
   * Events with different versions will be rejected.
   */
  STRICT = 'strict',

  /**
   * Allows backward compatibility within the same major version.
   * Events with lower minor/patch versions can be processed by handlers expecting higher versions.
   */
  BACKWARD = 'backward',

  /**
   * Allows forward compatibility within the same major version.
   * Events with higher minor/patch versions can be processed by handlers expecting lower versions.
   */
  FORWARD = 'forward',

  /**
   * Allows both backward and forward compatibility within the same major version.
   */
  BOTH = 'both',

  /**
   * Attempts to transform events between incompatible versions.
   * Requires transformation functions to be registered.
   */
  TRANSFORM = 'transform'
}

/**
 * Interface for a service that can transform events between different versions.
 */
export interface IEventTransformer {
  /**
   * Transforms an event from its current version to the target version.
   * @param event The event to transform
   * @param targetVersion The version to transform the event to
   * @returns The transformed event, or null if transformation is not possible
   */
  transform<T, U>(event: IVersionedEvent<T>, targetVersion: IEventVersion | string): IVersionedEvent<U> | null;

  /**
   * Checks if the transformer can transform an event from its current version to the target version.
   * @param sourceVersion The current version of the event
   * @param targetVersion The version to transform the event to
   * @returns True if transformation is possible, false otherwise
   */
  canTransform(sourceVersion: IEventVersion | string, targetVersion: IEventVersion | string): boolean;

  /**
   * Registers a transformation function for a specific version pair.
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param transformFn The function to transform events from source to target version
   */
  registerTransformation<T, U>(
    sourceVersion: IEventVersion | string,
    targetVersion: IEventVersion | string,
    transformFn: (event: IVersionedEvent<T>) => IVersionedEvent<U>
  ): void;
}

/**
 * Interface for a service that can detect the version of an event.
 */
export interface IVersionDetector {
  /**
   * Detects the version of an event.
   * @param event The event to detect the version of
   * @returns The detected version, or null if version cannot be detected
   */
  detectVersion(event: unknown): IEventVersion | null;

  /**
   * Checks if the detector can detect the version of an event.
   * @param event The event to check
   * @returns True if the detector can detect the version, false otherwise
   */
  canDetect(event: unknown): boolean;
}

/**
 * Interface for a service that can check compatibility between event versions.
 */
export interface IVersionCompatibilityChecker {
  /**
   * Checks if two versions are compatible according to the specified strategy.
   * @param version1 The first version
   * @param version2 The second version
   * @param strategy The compatibility strategy to use
   * @returns True if the versions are compatible, false otherwise
   */
  areCompatible(
    version1: IEventVersion | string,
    version2: IEventVersion | string,
    strategy?: VersionCompatibilityStrategy
  ): boolean;

  /**
   * Gets the compatibility level between two versions.
   * @param version1 The first version
   * @param version2 The second version
   * @returns The compatibility level between the versions
   */
  getCompatibilityLevel(version1: IEventVersion | string, version2: IEventVersion | string): VersionCompatibilityLevel;
}

/**
 * Represents the level of compatibility between two event versions.
 */
export enum VersionCompatibilityLevel {
  /**
   * The versions are fully compatible (same major, minor, and patch).
   */
  FULL = 'full',

  /**
   * The versions are backward compatible (same major, different minor/patch).
   */
  BACKWARD = 'backward',

  /**
   * The versions are forward compatible (same major, different minor/patch).
   */
  FORWARD = 'forward',

  /**
   * The versions are incompatible (different major).
   */
  INCOMPATIBLE = 'incompatible'
}

/**
 * Options for version migration operations.
 */
export interface IVersionMigrationOptions {
  /**
   * The compatibility strategy to use for migration.
   */
  strategy?: VersionCompatibilityStrategy;

  /**
   * Whether to throw an error if migration is not possible.
   * If false, will return null instead.
   */
  throwOnFailure?: boolean;

  /**
   * Whether to validate the migrated event against the target schema.
   */
  validateResult?: boolean;

  /**
   * Custom transformation options for specific fields.
   */
  fieldTransformations?: Record<string, (value: any) => any>;
}

/**
 * Interface for a service that can migrate events between different versions.
 */
export interface IEventMigrator {
  /**
   * Migrates an event from its current version to the target version.
   * @param event The event to migrate
   * @param targetVersion The version to migrate the event to
   * @param options Migration options
   * @returns The migrated event, or null if migration is not possible
   */
  migrate<T, U>(
    event: IVersionedEvent<T>,
    targetVersion: IEventVersion | string,
    options?: IVersionMigrationOptions
  ): IVersionedEvent<U> | null;

  /**
   * Checks if the migrator can migrate an event from its current version to the target version.
   * @param sourceVersion The current version of the event
   * @param targetVersion The version to migrate the event to
   * @returns True if migration is possible, false otherwise
   */
  canMigrate(sourceVersion: IEventVersion | string, targetVersion: IEventVersion | string): boolean;

  /**
   * Registers a migration path between two versions.
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param migrationFn The function to migrate events from source to target version
   */
  registerMigrationPath<T, U>(
    sourceVersion: IEventVersion | string,
    targetVersion: IEventVersion | string,
    migrationFn: (event: IVersionedEvent<T>, options?: IVersionMigrationOptions) => IVersionedEvent<U>
  ): void;
}

/**
 * Utility type to extract the payload type from a versioned event.
 */
export type ExtractVersionedPayload<T> = T extends IVersionedEvent<infer P> ? P : never;

/**
 * Utility type to create a versioned event from a payload type.
 */
export type CreateVersionedEvent<T> = IVersionedEvent<T>;

/**
 * Utility function to parse a version string into an IEventVersion object.
 * @param versionStr The version string to parse (e.g., "1.2.3")
 * @returns The parsed version object
 * @throws Error if the version string is invalid
 */
export function parseVersionString(versionStr: string): IEventVersion {
  const parts = versionStr.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version string: ${versionStr}. Expected format: major.minor.patch`);
  }

  const [major, minor, patch] = parts.map(part => {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0) {
      throw new Error(`Invalid version part: ${part}. Expected a non-negative integer.`);
    }
    return num;
  });

  return { major, minor, patch };
}

/**
 * Utility function to convert an IEventVersion object to a version string.
 * @param version The version object to convert
 * @returns The version string (e.g., "1.2.3")
 */
export function formatVersionString(version: IEventVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Utility function to compare two versions.
 * @param version1 The first version
 * @param version2 The second version
 * @returns -1 if version1 < version2, 0 if version1 === version2, 1 if version1 > version2
 */
export function compareVersions(
  version1: IEventVersion | string,
  version2: IEventVersion | string
): -1 | 0 | 1 {
  const v1 = typeof version1 === 'string' ? parseVersionString(version1) : version1;
  const v2 = typeof version2 === 'string' ? parseVersionString(version2) : version2;

  if (v1.major !== v2.major) {
    return v1.major < v2.major ? -1 : 1;
  }

  if (v1.minor !== v2.minor) {
    return v1.minor < v2.minor ? -1 : 1;
  }

  if (v1.patch !== v2.patch) {
    return v1.patch < v2.patch ? -1 : 1;
  }

  return 0;
}