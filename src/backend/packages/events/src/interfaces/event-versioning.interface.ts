/**
 * @file event-versioning.interface.ts
 * @description Defines interfaces for event versioning to support evolution of event schemas over time.
 * These interfaces enable backward compatibility for events, ensuring that both old and new
 * event formats can be processed correctly during system upgrades.
 */

/**
 * Represents a semantic version for an event schema.
 * Follows the Semantic Versioning 2.0.0 specification (https://semver.org/).
 */
export interface EventVersion {
  /**
   * Major version number. Incremented for incompatible API changes.
   * When the major version changes, events may have breaking changes that require
   * explicit migration or transformation.
   */
  major: number;

  /**
   * Minor version number. Incremented for added functionality in a backward-compatible manner.
   * When only the minor version changes, new fields or capabilities may be added, but
   * existing fields maintain the same semantics.
   */
  minor: number;

  /**
   * Patch version number. Incremented for backward-compatible bug fixes.
   * When only the patch version changes, the event schema remains fully compatible,
   * with only implementation details or documentation being updated.
   */
  patch: number;
}

/**
 * Interface for events that include version information.
 * All versioned events must implement this interface to support
 * proper versioning and compatibility checks.
 */
export interface IVersionedEvent {
  /**
   * The schema version of this event.
   * Used to determine compatibility and processing strategies.
   */
  version: EventVersion;

  /**
   * The type of the event.
   * This should be a string identifier that uniquely identifies the event type.
   */
  type: string;

  /**
   * The payload of the event.
   * This contains the actual data associated with the event.
   */
  payload: unknown;
}

/**
 * Result of a version compatibility check between two event versions.
 */
export enum VersionCompatibility {
  /**
   * Versions are fully compatible. No transformation is needed.
   */
  COMPATIBLE = 'COMPATIBLE',

  /**
   * Versions are backward compatible. The newer version can understand the older one.
   */
  BACKWARD_COMPATIBLE = 'BACKWARD_COMPATIBLE',

  /**
   * Versions are forward compatible. The older version can understand the newer one.
   */
  FORWARD_COMPATIBLE = 'FORWARD_COMPATIBLE',

  /**
   * Versions are incompatible. Explicit transformation is required.
   */
  INCOMPATIBLE = 'INCOMPATIBLE'
}

/**
 * Interface for a function that transforms an event from one version to another.
 * @template T - The source event type
 * @template U - The target event type
 */
export interface EventTransformer<T extends IVersionedEvent, U extends IVersionedEvent> {
  /**
   * Transforms an event from one version to another.
   * @param event - The source event to transform
   * @returns The transformed event
   */
  (event: T): U;
}

/**
 * Interface for a strategy that handles event versioning.
 * Implementations of this interface provide specific versioning behaviors
 * for different event types or journeys.
 */
export interface EventVersioningStrategy {
  /**
   * Checks if the strategy can handle the given event type.
   * @param eventType - The type of event to check
   * @returns True if this strategy can handle the event type, false otherwise
   */
  canHandle(eventType: string): boolean;

  /**
   * Determines the compatibility between two event versions.
   * @param sourceVersion - The source event version
   * @param targetVersion - The target event version to compare against
   * @returns The compatibility level between the two versions
   */
  checkCompatibility(sourceVersion: EventVersion, targetVersion: EventVersion): VersionCompatibility;

  /**
   * Gets the latest version for a specific event type.
   * @param eventType - The type of event to get the latest version for
   * @returns The latest version for the event type
   */
  getLatestVersion(eventType: string): EventVersion;

  /**
   * Upgrades an event to the latest version or a specific target version.
   * @param event - The event to upgrade
   * @param targetVersion - Optional target version to upgrade to. If not provided, upgrades to the latest version.
   * @returns The upgraded event
   */
  upgradeEvent<T extends IVersionedEvent>(event: T, targetVersion?: EventVersion): T;

  /**
   * Downgrades an event to a previous version for backward compatibility.
   * @param event - The event to downgrade
   * @param targetVersion - The target version to downgrade to
   * @returns The downgraded event
   */
  downgradeEvent<T extends IVersionedEvent>(event: T, targetVersion: EventVersion): T;
}

/**
 * Interface for a registry that manages event versioning strategies.
 * This registry allows the system to select the appropriate strategy
 * for a given event type.
 */
export interface EventVersioningRegistry {
  /**
   * Registers a versioning strategy for specific event types.
   * @param strategy - The strategy to register
   */
  registerStrategy(strategy: EventVersioningStrategy): void;

  /**
   * Gets the appropriate versioning strategy for a given event type.
   * @param eventType - The type of event to get a strategy for
   * @returns The versioning strategy for the event type, or undefined if none is registered
   */
  getStrategy(eventType: string): EventVersioningStrategy | undefined;

  /**
   * Checks if a strategy is registered for a given event type.
   * @param eventType - The type of event to check
   * @returns True if a strategy is registered for the event type, false otherwise
   */
  hasStrategy(eventType: string): boolean;
}

/**
 * Utility type for creating a version string from an EventVersion object.
 * Format: "major.minor.patch" (e.g., "1.0.0")
 */
export type VersionString = `${number}.${number}.${number}`;

/**
 * Converts an EventVersion object to a version string.
 * @param version - The EventVersion object to convert
 * @returns The version string in the format "major.minor.patch"
 */
export function versionToString(version: EventVersion): VersionString {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Parses a version string into an EventVersion object.
 * @param versionStr - The version string to parse in the format "major.minor.patch"
 * @returns The parsed EventVersion object
 * @throws Error if the version string is invalid
 */
export function parseVersion(versionStr: string): EventVersion {
  const parts = versionStr.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version string: ${versionStr}. Expected format: major.minor.patch`);
  }

  const [major, minor, patch] = parts.map(part => {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0) {
      throw new Error(`Invalid version component: ${part}. Expected a non-negative integer.`);
    }
    return num;
  });

  return { major, minor, patch };
}

/**
 * Compares two EventVersion objects to determine their compatibility.
 * @param sourceVersion - The source version to compare
 * @param targetVersion - The target version to compare against
 * @returns The compatibility level between the two versions
 */
export function compareVersions(sourceVersion: EventVersion, targetVersion: EventVersion): VersionCompatibility {
  if (sourceVersion.major !== targetVersion.major) {
    return VersionCompatibility.INCOMPATIBLE;
  }

  if (sourceVersion.minor > targetVersion.minor) {
    return VersionCompatibility.FORWARD_COMPATIBLE;
  }

  if (sourceVersion.minor < targetVersion.minor) {
    return VersionCompatibility.BACKWARD_COMPATIBLE;
  }

  // Same major and minor versions
  return VersionCompatibility.COMPATIBLE;
}