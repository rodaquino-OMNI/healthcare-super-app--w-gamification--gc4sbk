/**
 * @file versioning.interface.ts
 * @description Defines interfaces for versioning data structures throughout the gamification engine.
 * Provides mechanisms for handling schema evolution, backward compatibility, and version detection.
 * This file ensures consistent version handling across events, achievements, quests, and other versioned entities.
 *
 * This file implements the following requirements from the technical specification:
 * - Establish event versioning strategy
 * - Implement backward compatibility mechanisms
 * - Support gradual migration for dependent systems
 * - Document version compatibility requirements
 */

/**
 * Interface for version information
 * Follows semantic versioning (major.minor.patch)
 */
export interface IVersion {
  /**
   * The major version number
   * Incremented for incompatible API changes
   */
  major: number;

  /**
   * The minor version number
   * Incremented for backward-compatible functionality additions
   */
  minor: number;

  /**
   * The patch version number
   * Incremented for backward-compatible bug fixes
   */
  patch: number;

  /**
   * Returns the full version string (e.g., "1.2.3")
   */
  toString(): string;
}

/**
 * Interface for any entity that includes version metadata
 * This is the base interface for all versioned entities in the system
 */
export interface IVersioned {
  /**
   * The version of the entity schema
   * Can be a string (e.g., "1.2.3") or an IVersion object
   */
  version: string | IVersion;
}

/**
 * Interface for schema transformation between versions
 * Used to migrate entities from one version to another
 */
export interface ISchemaTransformer<T extends IVersioned = IVersioned> {
  /**
   * Transforms an entity from one version to another
   * @param entity The entity to transform
   * @param targetVersion The target version to transform to
   * @returns The transformed entity
   */
  transform(entity: T, targetVersion: IVersion): T;

  /**
   * Gets the source version of an entity
   * @param entity The entity to get the version from
   * @returns The entity version
   */
  getVersion(entity: T): IVersion;

  /**
   * Checks if the transformer can handle the given entity type
   * @param entity The entity to check
   * @returns True if the transformer can handle the entity
   */
  canHandle(entity: T): boolean;
}

/**
 * Interface for schema migration between specific versions
 * Represents a single migration step in a migration chain
 */
export interface ISchemaMigration<T extends IVersioned = IVersioned> {
  /**
   * The source version of the migration
   */
  sourceVersion: IVersion;

  /**
   * The target version of the migration
   */
  targetVersion: IVersion;

  /**
   * Migrates an entity from the source version to the target version
   * @param entity The entity to migrate
   * @returns The migrated entity
   */
  migrate(entity: T): T;
}

/**
 * Interface for schema registry that manages schema versions
 * Used to store and retrieve schema definitions for different versions
 */
export interface ISchemaRegistry {
  /**
   * Registers a schema for an entity type
   * @param entityType The entity type (e.g., "achievement", "quest", "event")
   * @param version The schema version
   * @param schema The schema definition (can be JSON Schema, Zod schema, etc.)
   */
  registerSchema(entityType: string, version: string, schema: any): void;

  /**
   * Gets a schema for an entity type and version
   * @param entityType The entity type
   * @param version The schema version
   * @returns The schema definition or undefined if not found
   */
  getSchema(entityType: string, version: string): any;

  /**
   * Gets all versions of a schema for an entity type
   * @param entityType The entity type
   * @returns An array of schema versions
   */
  getSchemaVersions(entityType: string): string[];

  /**
   * Validates an entity against its schema
   * @param entity The entity to validate
   * @param entityType The entity type
   * @returns True if the entity is valid according to its schema
   */
  validateEntity(entity: IVersioned, entityType: string): boolean;
}

/**
 * Interface for migration registry that manages migrations between versions
 * Used to store and retrieve migration steps for different entity types
 */
export interface IMigrationRegistry {
  /**
   * Registers a migration for an entity type
   * @param entityType The entity type (e.g., "achievement", "quest", "event")
   * @param migration The migration definition
   */
  registerMigration<T extends IVersioned>(entityType: string, migration: ISchemaMigration<T>): void;

  /**
   * Gets all migrations for an entity type
   * @param entityType The entity type
   * @returns An array of migrations
   */
  getMigrations<T extends IVersioned>(entityType: string): ISchemaMigration<T>[];

  /**
   * Gets migrations needed to go from source to target version
   * @param entityType The entity type
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns An array of migrations in the correct order
   */
  getMigrationPath<T extends IVersioned>(
    entityType: string,
    sourceVersion: IVersion,
    targetVersion: IVersion
  ): ISchemaMigration<T>[];
}

/**
 * Interface for handling deprecated fields in versioned entities
 * Used to mark fields as deprecated and provide migration guidance
 */
export interface IDeprecatedField {
  /**
   * The name of the deprecated field
   */
  fieldName: string;

  /**
   * The version when the field was deprecated
   */
  deprecatedInVersion: string;

  /**
   * The version when the field will be removed
   * If undefined, the field is deprecated but not scheduled for removal
   */
  removedInVersion?: string;

  /**
   * The replacement field name, if any
   */
  replacedBy?: string;

  /**
   * Migration guidance for consumers
   */
  migrationGuidance?: string;
}

/**
 * Interface for version compatibility information
 * Used to document compatibility between different versions
 */
export interface IVersionCompatibility {
  /**
   * The version being described
   */
  version: string;

  /**
   * The minimum compatible version
   * Entities with versions below this cannot be automatically migrated
   */
  minimumCompatibleVersion: string;

  /**
   * The recommended minimum version for new implementations
   */
  recommendedMinimumVersion: string;

  /**
   * List of deprecated fields in this version
   */
  deprecatedFields?: IDeprecatedField[];

  /**
   * List of breaking changes in this version compared to the previous version
   */
  breakingChanges?: string[];

  /**
   * Migration notes for consumers
   */
  migrationNotes?: string;
}

/**
 * Parses a version string into an IVersion object
 * @param versionStr The version string to parse (e.g., "1.2.3")
 * @returns The parsed version object
 */
export function parseVersion(versionStr: string): IVersion {
  const parts = versionStr.split('.');
  return {
    major: parseInt(parts[0], 10) || 0,
    minor: parseInt(parts[1], 10) || 0,
    patch: parseInt(parts[2], 10) || 0,
    toString: () => versionStr
  };
}

/**
 * Compares two version objects
 * @param v1 The first version
 * @param v2 The second version
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: IVersion, v2: IVersion): number {
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

/**
 * Checks if a version is compatible with a target version
 * @param version The version to check
 * @param targetVersion The target version to check against
 * @param allowMajorUpgrade Whether to allow major version upgrades (default: false)
 * @returns True if the version is compatible with the target version
 */
export function isVersionCompatible(
  version: IVersion,
  targetVersion: IVersion,
  allowMajorUpgrade = false
): boolean {
  if (version.major !== targetVersion.major && !allowMajorUpgrade) {
    return false;
  }
  
  // If same major version, any lower or equal minor version is compatible
  if (version.major === targetVersion.major) {
    return version.minor <= targetVersion.minor;
  }
  
  // If allowing major upgrades, any lower major version is compatible
  return version.major < targetVersion.major;
}

/**
 * Creates a version string from major, minor, and patch numbers
 * @param major The major version number
 * @param minor The minor version number
 * @param patch The patch version number
 * @returns The version string (e.g., "1.2.3")
 */
export function createVersionString(major: number, minor: number, patch: number): string {
  return `${major}.${minor}.${patch}`;
}

/**
 * Creates an IVersion object from major, minor, and patch numbers
 * @param major The major version number
 * @param minor The minor version number
 * @param patch The patch version number
 * @returns The IVersion object
 */
export function createVersion(major: number, minor: number, patch: number): IVersion {
  const versionStr = createVersionString(major, minor, patch);
  return {
    major,
    minor,
    patch,
    toString: () => versionStr
  };
}

/**
 * Type guard to check if an object is versioned
 * @param obj The object to check
 * @returns True if the object implements IVersioned
 */
export function isVersioned(obj: any): obj is IVersioned {
  return obj && typeof obj === 'object' && 'version' in obj;
}

/**
 * Type for a function that transforms an entity to the latest version
 */
export type VersionUpgrader<T extends IVersioned> = (entity: T) => T;

/**
 * Type for a function that transforms an entity to a specific version
 */
export type VersionTransformer<T extends IVersioned> = (entity: T, targetVersion: IVersion) => T;

/**
 * Type for a function that validates an entity against its schema
 */
export type SchemaValidator<T extends IVersioned> = (entity: T) => boolean;