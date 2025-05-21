/**
 * @file versioning.interface.ts
 * @description Defines interfaces for versioning data structures throughout the gamification engine.
 * Provides mechanisms for handling schema evolution, backward compatibility, and version detection.
 * 
 * This file is a critical part of the event versioning strategy for the gamification engine.
 * It ensures that events, achievements, quests, and other versioned entities can evolve over time
 * while maintaining backward compatibility with existing systems.
 *
 * @version 1.0.0
 * @module gamification-engine/common/interfaces
 */

/**
 * Represents a semantic version number.
 * Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes that require migration
 * - MINOR: Backward-compatible feature additions
 * - PATCH: Backward-compatible bug fixes
 */
export interface ISemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Base interface for any entity that includes version information.
 * All versioned entities in the system should implement this interface.
 */
export interface IVersioned {
  /**
   * The schema version of this entity.
   * Used to determine compatibility and transformation needs.
   */
  schemaVersion: ISemanticVersion;
}

/**
 * Represents the result of a version comparison.
 * Used to determine compatibility between different versions.
 */
export enum VersionComparisonResult {
  /** Source version is older than target version */
  OLDER = -1,
  /** Source version is the same as target version */
  EQUAL = 0,
  /** Source version is newer than target version */
  NEWER = 1,
}

/**
 * Defines compatibility between different schema versions.
 * Used to determine if data migration is required.
 */
export enum VersionCompatibility {
  /** Versions are fully compatible, no transformation needed */
  COMPATIBLE = 'compatible',
  /** Versions are compatible with transformation */
  TRANSFORM_REQUIRED = 'transform_required',
  /** Versions are incompatible, cannot be transformed */
  INCOMPATIBLE = 'incompatible',
}

/**
 * Interface for schema transformation utilities.
 * Implementations handle the migration of data between different schema versions.
 */
export interface ISchemaTransformer<T extends IVersioned> {
  /**
   * The source version this transformer can handle.
   */
  sourceVersion: ISemanticVersion;
  
  /**
   * The target version this transformer produces.
   */
  targetVersion: ISemanticVersion;
  
  /**
   * Transforms data from source version to target version.
   * @param data The data to transform
   * @returns Transformed data in the target version format
   */
  transform(data: T): T;
  
  /**
   * Checks if this transformer can handle the given source and target versions.
   * @param source Source version
   * @param target Target version
   * @returns True if this transformer can handle the transformation
   */
  canTransform(source: ISemanticVersion, target: ISemanticVersion): boolean;
}

/**
 * Interface for a registry of schema transformers.
 * Manages the collection of transformers and provides methods to find and apply them.
 */
export interface ISchemaTransformerRegistry<T extends IVersioned> {
  /**
   * Registers a new transformer in the registry.
   * @param transformer The transformer to register
   */
  registerTransformer(transformer: ISchemaTransformer<T>): void;
  
  /**
   * Finds a transformer that can handle the given source and target versions.
   * @param source Source version
   * @param target Target version
   * @returns A transformer if found, undefined otherwise
   */
  findTransformer(source: ISemanticVersion, target: ISemanticVersion): ISchemaTransformer<T> | undefined;
  
  /**
   * Finds a transformation path between source and target versions.
   * May return multiple transformers that need to be applied in sequence.
   * @param source Source version
   * @param target Target version
   * @returns Array of transformers to apply in sequence, or empty array if no path found
   */
  findTransformationPath(source: ISemanticVersion, target: ISemanticVersion): ISchemaTransformer<T>[];
  
  /**
   * Transforms data from its current version to the target version.
   * May apply multiple transformers in sequence if needed.
   * @param data The data to transform
   * @param targetVersion The target version to transform to
   * @returns Transformed data in the target version format
   * @throws Error if no transformation path is available
   */
  transform(data: T, targetVersion: ISemanticVersion): T;
  
  /**
   * Gets all available transformers in the registry.
   * @returns Array of all registered transformers
   */
  getAllTransformers(): ISchemaTransformer<T>[];
  
  /**
   * Gets all available source versions that can be transformed.
   * @returns Array of all source versions
   */
  getAvailableSourceVersions(): ISemanticVersion[];
  
  /**
   * Gets all available target versions that can be transformed to.
   * @returns Array of all target versions
   */
  getAvailableTargetVersions(): ISemanticVersion[];
}

/**
 * Interface for handling deprecated fields in versioned entities.
 * Provides metadata about deprecation status and migration path.
 */
export interface IDeprecatedField {
  /**
   * The name of the deprecated field.
   */
  fieldName: string;
  
  /**
   * The version when this field was deprecated.
   */
  deprecatedInVersion: ISemanticVersion;
  
  /**
   * The version when this field will be removed.
   * If undefined, the field is deprecated but not scheduled for removal.
   */
  scheduledRemovalVersion?: ISemanticVersion;
  
  /**
   * The name of the replacement field, if any.
   */
  replacementField?: string;
  
  /**
   * Description of how to migrate from this field to its replacement.
   */
  migrationPath?: string;
}

/**
 * Interface for entities that contain deprecated fields.
 * Provides metadata about deprecated fields for documentation and tooling.
 */
export interface IContainsDeprecatedFields extends IVersioned {
  /**
   * List of deprecated fields in this entity.
   */
  deprecatedFields: IDeprecatedField[];
}

/**
 * Type guard to check if an entity contains deprecated fields.
 * @param entity The entity to check
 * @returns True if the entity implements IContainsDeprecatedFields
 */
export function hasDeprecatedFields(entity: IVersioned): entity is IContainsDeprecatedFields {
  return 'deprecatedFields' in entity;
}

/**
 * Utility type for defining version ranges.
 * Used to specify compatibility between different versions.
 */
export interface IVersionRange {
  /**
   * Minimum compatible version (inclusive).
   */
  minVersion: ISemanticVersion;
  
  /**
   * Maximum compatible version (inclusive).
   * If undefined, there is no upper bound.
   */
  maxVersion?: ISemanticVersion;
}

/**
 * Interface for entities that specify compatibility with other versions.
 * Provides metadata about compatible versions for documentation and tooling.
 */
export interface ISpecifiesCompatibility extends IVersioned {
  /**
   * List of version ranges that are compatible with this entity.
   */
  compatibleVersions: IVersionRange[];
}

/**
 * Type guard to check if an entity specifies compatibility information.
 * @param entity The entity to check
 * @returns True if the entity implements ISpecifiesCompatibility
 */
export function specifiesCompatibility(entity: IVersioned): entity is ISpecifiesCompatibility {
  return 'compatibleVersions' in entity;
}

/**
 * Compares two semantic versions.
 * @param a First version
 * @param b Second version
 * @returns VersionComparisonResult indicating the relationship between versions
 */
export function compareVersions(a: ISemanticVersion, b: ISemanticVersion): VersionComparisonResult {
  if (a.major !== b.major) {
    return a.major < b.major ? VersionComparisonResult.OLDER : VersionComparisonResult.NEWER;
  }
  
  if (a.minor !== b.minor) {
    return a.minor < b.minor ? VersionComparisonResult.OLDER : VersionComparisonResult.NEWER;
  }
  
  if (a.patch !== b.patch) {
    return a.patch < b.patch ? VersionComparisonResult.OLDER : VersionComparisonResult.NEWER;
  }
  
  return VersionComparisonResult.EQUAL;
}

/**
 * Checks if a version is within a specified range.
 * @param version The version to check
 * @param range The range to check against
 * @returns True if the version is within the range
 */
export function isVersionInRange(version: ISemanticVersion, range: IVersionRange): boolean {
  const compareMin = compareVersions(version, range.minVersion);
  if (compareMin === VersionComparisonResult.OLDER) {
    return false;
  }
  
  if (range.maxVersion) {
    const compareMax = compareVersions(version, range.maxVersion);
    return compareMax !== VersionComparisonResult.NEWER;
  }
  
  return true;
}

/**
 * Determines the compatibility between two versions.
 * @param source Source version
 * @param target Target version
 * @returns VersionCompatibility indicating the compatibility status
 */
export function determineCompatibility(
  source: ISemanticVersion,
  target: ISemanticVersion
): VersionCompatibility {
  const comparison = compareVersions(source, target);
  
  // If versions are equal, they are compatible
  if (comparison === VersionComparisonResult.EQUAL) {
    return VersionCompatibility.COMPATIBLE;
  }
  
  // If major versions differ, they are incompatible
  if (source.major !== target.major) {
    return VersionCompatibility.INCOMPATIBLE;
  }
  
  // If source is newer than target, transformation is required
  if (comparison === VersionComparisonResult.NEWER) {
    return VersionCompatibility.TRANSFORM_REQUIRED;
  }
  
  // If source is older but same major version, transformation is required
  return VersionCompatibility.TRANSFORM_REQUIRED;
}

/**
 * Interface for versioned event schemas.
 * Extends the base IVersioned interface with event-specific properties.
 */
export interface IVersionedEvent extends IVersioned {
  /**
   * The type of the event.
   * Used to route events to appropriate handlers.
   */
  eventType: string;
  
  /**
   * The source journey that generated this event.
   * Can be 'health', 'care', 'plan', or 'gamification'.
   */
  journeySource: 'health' | 'care' | 'plan' | 'gamification';
  
  /**
   * Timestamp when the event was created.
   */
  timestamp: string;
  
  /**
   * Unique identifier for the event.
   */
  eventId: string;
  
  /**
   * User ID associated with this event.
   */
  userId: string;
  
  /**
   * The payload of the event.
   * Structure depends on the event type and version.
   */
  payload: unknown;
  
  /**
   * Optional metadata for the event.
   * Can contain additional information about the event context.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for versioned achievement schemas.
 * Extends the base IVersioned interface with achievement-specific properties.
 */
export interface IVersionedAchievement extends IVersioned {
  /**
   * Unique identifier for the achievement.
   */
  achievementId: string;
  
  /**
   * The type of the achievement.
   */
  achievementType: string;
  
  /**
   * The criteria for unlocking this achievement.
   * Structure depends on the achievement type and version.
   */
  criteria: unknown;
}

/**
 * Interface for versioned quest schemas.
 * Extends the base IVersioned interface with quest-specific properties.
 */
export interface IVersionedQuest extends IVersioned {
  /**
   * Unique identifier for the quest.
   */
  questId: string;
  
  /**
   * The type of the quest.
   */
  questType: string;
  
  /**
   * The steps required to complete this quest.
   * Structure depends on the quest type and version.
   */
  steps: unknown[];
}

/**
 * Converts a string version to a semantic version object.
 * @param version Version string in format "MAJOR.MINOR.PATCH"
 * @returns ISemanticVersion object
 * @throws Error if the version string is invalid
 */
export function parseVersion(version: string): ISemanticVersion {
  const parts = version.split('.');
  
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${version}. Expected format: MAJOR.MINOR.PATCH`);
  }
  
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  const patch = parseInt(parts[2], 10);
  
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new Error(`Invalid version components: ${version}. All components must be numbers.`);
  }
  
  return { major, minor, patch };
}

/**
 * Converts a semantic version object to a string.
 * @param version ISemanticVersion object
 * @returns Version string in format "MAJOR.MINOR.PATCH"
 */
export function formatVersion(version: ISemanticVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Interface for a version migration strategy.
 * Defines how to handle version migrations across the system.
 */
export interface IVersionMigrationStrategy {
  /**
   * Determines whether automatic migration should be attempted.
   * @param source Source version
   * @param target Target version
   * @returns True if automatic migration should be attempted
   */
  shouldAttemptMigration(source: ISemanticVersion, target: ISemanticVersion): boolean;
  
  /**
   * Determines whether to accept data even if migration fails.
   * @param source Source version
   * @param target Target version
   * @returns True if data should be accepted even if migration fails
   */
  shouldAcceptOnMigrationFailure(source: ISemanticVersion, target: ISemanticVersion): boolean;
  
  /**
   * Gets the preferred target version for a given source version.
   * @param source Source version
   * @returns The preferred target version
   */
  getPreferredTargetVersion(source: ISemanticVersion): ISemanticVersion;
}

/**
 * Default implementation of the version migration strategy.
 * Can be extended or replaced with custom logic.
 */
export const DefaultVersionMigrationStrategy: IVersionMigrationStrategy = {
  shouldAttemptMigration(source: ISemanticVersion, target: ISemanticVersion): boolean {
    // Only attempt migration if major versions are the same
    return source.major === target.major;
  },
  
  shouldAcceptOnMigrationFailure(source: ISemanticVersion, target: ISemanticVersion): boolean {
    // Accept on failure only for minor version differences
    return source.major === target.major && Math.abs(source.minor - target.minor) <= 1;
  },
  
  getPreferredTargetVersion(source: ISemanticVersion): ISemanticVersion {
    // Default to the latest version in the same major version
    return { major: source.major, minor: 999, patch: 999 };
  },
};

/**
 * Interface for a version compatibility validator.
 * Used to validate compatibility between different versions.
 */
export interface IVersionCompatibilityValidator {
  /**
   * Validates compatibility between source and target versions.
   * @param source Source version
   * @param target Target version
   * @returns True if versions are compatible
   */
  isCompatible(source: ISemanticVersion, target: ISemanticVersion): boolean;
  
  /**
   * Gets a detailed compatibility report between source and target versions.
   * @param source Source version
   * @param target Target version
   * @returns Detailed compatibility information
   */
  getCompatibilityReport(source: ISemanticVersion, target: ISemanticVersion): {
    compatible: boolean;
    reason?: string;
    migrationPath?: ISchemaTransformer<IVersioned>[];
  };
}

/**
 * Type for a version migration error.
 * Contains information about what went wrong during migration.
 */
export interface IVersionMigrationError {
  /**
   * The source version that was being migrated.
   */
  sourceVersion: ISemanticVersion;
  
  /**
   * The target version that was being migrated to.
   */
  targetVersion: ISemanticVersion;
  
  /**
   * The error message.
   */
  message: string;
  
  /**
   * The original error that caused the migration to fail.
   */
  originalError?: Error;
  
  /**
   * The entity that was being migrated.
   */
  entity?: IVersioned;
  
  /**
   * The transformer that failed.
   */
  failedTransformer?: ISchemaTransformer<IVersioned>;
}

/**
 * Interface for a version migration result.
 * Contains information about the result of a migration operation.
 */
export interface IVersionMigrationResult<T extends IVersioned> {
  /**
   * Whether the migration was successful.
   */
  success: boolean;
  
  /**
   * The original entity before migration.
   */
  originalEntity: T;
  
  /**
   * The migrated entity after successful migration.
   * Undefined if migration failed.
   */
  migratedEntity?: T;
  
  /**
   * The error that occurred during migration.
   * Undefined if migration was successful.
   */
  error?: IVersionMigrationError;
  
  /**
   * The transformers that were applied during migration.
   */
  appliedTransformers: ISchemaTransformer<T>[];
  
  /**
   * The source version that was migrated.
   */
  sourceVersion: ISemanticVersion;
  
  /**
   * The target version that was migrated to.
   */
  targetVersion: ISemanticVersion;
}