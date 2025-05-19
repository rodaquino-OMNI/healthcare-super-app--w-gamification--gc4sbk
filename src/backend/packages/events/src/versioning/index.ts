/**
 * @module versioning
 * 
 * Provides comprehensive utilities for event schema versioning, ensuring backward and forward
 * compatibility as event schemas evolve over time. This module enables services to handle
 * events from different versions during rolling deployments and maintains data integrity
 * across version boundaries.
 * 
 * The versioning module includes:
 * - Version detection strategies for identifying event versions
 * - Schema migration utilities for transforming events between versions
 * - Compatibility checking to determine if versions are compatible
 * - Transformation functions for converting events between versions
 * - Error handling specific to versioning operations
 * 
 * @example
 * // Detect version of an event
 * import { detectVersion } from '@austa/events/versioning';
 * const version = detectVersion(eventPayload);
 * 
 * // Check compatibility between versions
 * import { isCompatible } from '@austa/events/versioning';
 * const canProcess = isCompatible(eventVersion, handlerVersion);
 * 
 * // Transform event to latest version
 * import { upgradeToLatest } from '@austa/events/versioning';
 * const latestEvent = upgradeToLatest(eventPayload);
 */

// Re-export interfaces from event-versioning.interface.ts
export { 
  IVersionedEvent,
  EventVersion,
  EventVersioningStrategy,
  VersionDetectionResult,
  VersionMigrationPath,
  VersionTransformer
} from '../interfaces/event-versioning.interface';

// Re-export DTOs related to versioning
export { VersionedEventDto } from '../dto/version.dto';

// Export version detection utilities
export * from './version-detector';

// Export schema migration utilities
export * from './schema-migrator';

// Export compatibility checking utilities
export * from './compatibility-checker';

// Export transformation utilities
export * from './transformer';

// Export versioning types
export * from './types';

// Export versioning constants
export * from './constants';

// Export versioning errors
export * from './errors';

/**
 * Core versioning functions
 * @group Core Functions
 */

/**
 * Detects the version of an event payload using configured strategies.
 * @param payload - The event payload to detect version for
 * @param options - Optional configuration for version detection
 * @returns The detected version information
 * @throws VersionDetectionError if version cannot be determined
 */
export { detectVersion } from './version-detector';

/**
 * Checks if two event versions are compatible based on semantic versioning rules.
 * @param sourceVersion - The version of the source event
 * @param targetVersion - The version expected by the handler
 * @param options - Optional configuration for compatibility checking
 * @returns Whether the versions are compatible
 */
export { isCompatible } from './compatibility-checker';

/**
 * Migrates an event from one version to another using registered migration paths.
 * @param event - The event to migrate
 * @param targetVersion - The desired target version
 * @param options - Optional configuration for migration
 * @returns The migrated event
 * @throws MigrationError if migration fails
 */
export { migrateEvent } from './schema-migrator';

/**
 * Transforms an event to the latest supported version.
 * @param event - The event to upgrade
 * @param options - Optional configuration for transformation
 * @returns The upgraded event
 * @throws TransformationError if transformation fails
 */
export { upgradeToLatest } from './transformer';

/**
 * Transforms an event to an older version for backward compatibility.
 * @param event - The event to downgrade
 * @param targetVersion - The desired target version
 * @param options - Optional configuration for transformation
 * @returns The downgraded event
 * @throws TransformationError if transformation fails
 */
export { downgradeEvent } from './transformer';

/**
 * Registers a migration path between two versions.
 * @param sourceVersion - The source version
 * @param targetVersion - The target version
 * @param migrator - The migration function
 */
export { registerMigrationPath } from './schema-migrator';

/**
 * Utility functions for version manipulation
 * @group Utility Functions
 */

/**
 * Parses a version string into its components.
 * @param versionStr - The version string to parse (e.g., "1.2.3")
 * @returns The parsed version object
 */
export { parseVersion } from './types';

/**
 * Compares two versions and returns their relationship.
 * @param versionA - The first version
 * @param versionB - The second version
 * @returns -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
 */
export { compareVersions } from './compatibility-checker';

/**
 * Creates a version string from major, minor, and patch components.
 * @param major - The major version number
 * @param minor - The minor version number
 * @param patch - The patch version number
 * @returns The formatted version string
 */
export { createVersion } from './types';

/**
 * Gets the latest supported version for a given event type.
 * @param eventType - The type of event
 * @returns The latest supported version
 */
export { getLatestVersion } from './constants';

/**
 * Gets the minimum supported version for a given event type.
 * @param eventType - The type of event
 * @returns The minimum supported version
 */
export { getMinimumSupportedVersion } from './constants';