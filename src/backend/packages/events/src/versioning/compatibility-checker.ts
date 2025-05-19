/**
 * Compatibility checker for event versioning.
 * Provides utilities to check compatibility between different versions of events
 * based on semantic versioning principles. Determines if changes between versions
 * are breaking or non-breaking, and validates if an event from one version can be
 * processed by a handler expecting another version.
 */

import { EventVersion } from '../interfaces/event-versioning.interface';
import { VERSION_COMPARISON, VERSION_CONSTANTS, VERSION_ERROR_MESSAGES } from './constants';
import {
  ParsedVersion,
  VersionComparisonResult,
  VersionCompatibilityChecker,
  EventSchemaVersionMap,
  isValidVersion,
} from './types';

/**
 * Compatibility mode configuration options.
 */
export interface CompatibilityOptions {
  /**
   * The compatibility mode to use for version checking.
   * - 'strict': Requires exact version match
   * - 'standard': Allows minor and patch differences within same major version
   * - 'relaxed': Allows any version with same or lower major version
   * @default 'standard'
   */
  mode?: keyof typeof VERSION_COMPARISON.COMPATIBILITY_MODES;

  /**
   * Whether to allow processing newer versions than the handler expects.
   * In standard mode, this only applies to minor and patch versions.
   * In relaxed mode, this can also apply to major versions.
   * @default false
   */
  allowNewer?: boolean;

  /**
   * Whether to check schema compatibility in addition to version compatibility.
   * When true, the schemas for both versions will be compared to ensure compatibility.
   * @default true
   */
  checkSchema?: boolean;

  /**
   * Custom error message to use when versions are incompatible.
   * If not provided, a default message will be used.
   */
  errorMessage?: string;
}

/**
 * Default compatibility options.
 */
const DEFAULT_COMPATIBILITY_OPTIONS: CompatibilityOptions = {
  mode: 'standard',
  allowNewer: false,
  checkSchema: true,
};

/**
 * Parses a semantic version string into its components.
 * @param version The version string to parse (e.g., '1.2.3')
 * @returns The parsed version with major, minor, and patch components
 * @throws Error if the version format is invalid
 */
export function parseVersion(version: EventVersion): ParsedVersion {
  if (!isValidVersion(version)) {
    throw new Error(
      VERSION_ERROR_MESSAGES.INVALID_VERSION_FORMAT.replace('{version}', version)
    );
  }

  const [major, minor, patch] = version
    .split(VERSION_CONSTANTS.VERSION_SEPARATOR)
    .map(Number);

  return { major, minor, patch };
}

/**
 * Compares two semantic versions.
 * @param versionA The first version
 * @param versionB The second version
 * @returns 0 if equal, 1 if versionA > versionB, -1 if versionA < versionB
 */
export function compareVersions(versionA: EventVersion, versionB: EventVersion): number {
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);

  // Compare major versions
  if (parsedA.major !== parsedB.major) {
    return parsedA.major > parsedB.major
      ? VERSION_COMPARISON.GREATER
      : VERSION_COMPARISON.LESS;
  }

  // Compare minor versions
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor > parsedB.minor
      ? VERSION_COMPARISON.GREATER
      : VERSION_COMPARISON.LESS;
  }

  // Compare patch versions
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch > parsedB.patch
      ? VERSION_COMPARISON.GREATER
      : VERSION_COMPARISON.LESS;
  }

  // Versions are equal
  return VERSION_COMPARISON.EQUAL;
}

/**
 * Checks if a source version is compatible with a target version based on
 * semantic versioning rules and the specified compatibility mode.
 * @param sourceVersion The version of the event being processed
 * @param targetVersion The version expected by the handler
 * @param options Compatibility checking options
 * @returns Result indicating compatibility status with details
 */
export function checkVersionCompatibility(
  sourceVersion: EventVersion,
  targetVersion: EventVersion,
  options: CompatibilityOptions = DEFAULT_COMPATIBILITY_OPTIONS
): VersionComparisonResult {
  const { mode = 'standard', allowNewer = false } = options;

  // Parse versions
  const source = parseVersion(sourceVersion);
  const target = parseVersion(targetVersion);

  // Determine if source is newer than target
  const comparison = compareVersions(sourceVersion, targetVersion);
  const isNewer = comparison === VERSION_COMPARISON.GREATER;
  const isOlder = comparison === VERSION_COMPARISON.LESS;
  const isEqual = comparison === VERSION_COMPARISON.EQUAL;

  // If versions are equal, they are always compatible
  if (isEqual) {
    return {
      compatible: true,
      details: {
        isNewer: false,
        isSameMajor: true,
        breakingChange: false,
      },
    };
  }

  // Check if major versions are the same
  const isSameMajor = source.major === target.major;

  // Determine if there's a breaking change based on the compatibility mode
  let breakingChange = false;
  let compatible = false;

  switch (mode) {
    case 'strict':
      // In strict mode, versions must be exactly equal
      breakingChange = !isEqual;
      compatible = isEqual;
      break;

    case 'standard':
      // In standard mode, major version must match, and source should not be newer unless allowed
      breakingChange = !isSameMajor || (isNewer && !allowNewer);
      compatible = isSameMajor && (isOlder || (isNewer && allowNewer));
      break;

    case 'relaxed':
      // In relaxed mode, source major version can be lower or equal to target
      breakingChange = source.major > target.major || (isNewer && !allowNewer);
      compatible = source.major <= target.major && (isOlder || (isNewer && allowNewer));
      break;

    default:
      throw new Error(`Unknown compatibility mode: ${mode}`);
  }

  // Prepare result with details
  const result: VersionComparisonResult = {
    compatible,
    details: {
      isNewer,
      isSameMajor,
      breakingChange,
    },
  };

  // Add reason if incompatible
  if (!compatible) {
    result.reason = options.errorMessage || VERSION_ERROR_MESSAGES.INCOMPATIBLE_VERSIONS
      .replace('{sourceVersion}', sourceVersion)
      .replace('{targetVersion}', targetVersion);
  }

  return result;
}

/**
 * Creates a version compatibility checker function with predefined options.
 * @param options The compatibility options to use for all checks
 * @returns A function that checks compatibility between two versions
 */
export function createCompatibilityChecker(
  options: CompatibilityOptions = DEFAULT_COMPATIBILITY_OPTIONS
): VersionCompatibilityChecker {
  return (sourceVersion: EventVersion, targetVersion: EventVersion) => {
    return checkVersionCompatibility(sourceVersion, targetVersion, options);
  };
}

/**
 * Checks if a source version can be safely upgraded to a target version.
 * @param sourceVersion The current version
 * @param targetVersion The version to upgrade to
 * @returns Result indicating if the upgrade is safe
 */
export function canSafelyUpgrade(
  sourceVersion: EventVersion,
  targetVersion: EventVersion
): VersionComparisonResult {
  // Parse versions
  const source = parseVersion(sourceVersion);
  const target = parseVersion(targetVersion);

  // Check if target is actually newer
  const comparison = compareVersions(targetVersion, sourceVersion);
  if (comparison !== VERSION_COMPARISON.GREATER) {
    return {
      compatible: false,
      reason: 'Target version is not newer than source version',
      details: {
        isNewer: false,
        isSameMajor: source.major === target.major,
        breakingChange: false,
      },
    };
  }

  // Determine if this is a breaking change (major version change)
  const breakingChange = target.major > source.major;

  return {
    compatible: !breakingChange,
    reason: breakingChange
      ? `Major version upgrade from ${sourceVersion} to ${targetVersion} may introduce breaking changes`
      : undefined,
    details: {
      isNewer: true,
      isSameMajor: source.major === target.major,
      breakingChange,
    },
  };
}

/**
 * Checks if a source version can be safely downgraded to a target version.
 * @param sourceVersion The current version
 * @param targetVersion The version to downgrade to
 * @returns Result indicating if the downgrade is safe
 */
export function canSafelyDowngrade(
  sourceVersion: EventVersion,
  targetVersion: EventVersion
): VersionComparisonResult {
  // Parse versions
  const source = parseVersion(sourceVersion);
  const target = parseVersion(targetVersion);

  // Check if target is actually older
  const comparison = compareVersions(targetVersion, sourceVersion);
  if (comparison !== VERSION_COMPARISON.LESS) {
    return {
      compatible: false,
      reason: 'Target version is not older than source version',
      details: {
        isNewer: false,
        isSameMajor: source.major === target.major,
        breakingChange: false,
      },
    };
  }

  // Determine if this is a breaking change (major or minor version change)
  const breakingChange = target.major < source.major;
  const minorChange = target.minor < source.minor && target.major === source.major;

  return {
    compatible: !breakingChange,
    reason: breakingChange
      ? `Major version downgrade from ${sourceVersion} to ${targetVersion} may introduce breaking changes`
      : minorChange
      ? `Minor version downgrade from ${sourceVersion} to ${targetVersion} may lose functionality`
      : undefined,
    details: {
      isNewer: false,
      isSameMajor: source.major === target.major,
      breakingChange,
    },
  };
}

/**
 * Checks if a version is within a supported range.
 * @param version The version to check
 * @param minVersion The minimum supported version
 * @param maxVersion The maximum supported version
 * @returns True if the version is within the supported range
 */
export function isVersionSupported(
  version: EventVersion,
  minVersion: EventVersion = VERSION_CONSTANTS.MINIMUM_SUPPORTED_VERSION,
  maxVersion: EventVersion = VERSION_CONSTANTS.LATEST_VERSION
): boolean {
  return (
    compareVersions(version, minVersion) >= VERSION_COMPARISON.EQUAL &&
    compareVersions(version, maxVersion) <= VERSION_COMPARISON.EQUAL
  );
}

/**
 * Checks if two schemas are compatible based on their structure.
 * @param sourceSchema The source schema
 * @param targetSchema The target schema
 * @param options Additional options for schema compatibility checking
 * @returns Result indicating if the schemas are compatible
 */
export function checkSchemaCompatibility(
  sourceSchema: Record<string, unknown>,
  targetSchema: Record<string, unknown>,
  options: {
    mode?: 'backward' | 'forward' | 'full';
    ignoreAdditionalProperties?: boolean;
  } = { mode: 'backward', ignoreAdditionalProperties: true }
): VersionComparisonResult {
  const { mode = 'backward', ignoreAdditionalProperties = true } = options;

  // Helper function to check if a schema is a subset of another
  const isSubset = (sub: Record<string, unknown>, sup: Record<string, unknown>): boolean => {
    // Check all required properties in the target schema
    for (const [key, targetValue] of Object.entries(sup)) {
      // If the property doesn't exist in the source schema
      if (!(key in sub)) {
        return false;
      }

      const sourceValue = sub[key];

      // If both values are objects, recursively check compatibility
      if (
        targetValue !== null &&
        sourceValue !== null &&
        typeof targetValue === 'object' &&
        typeof sourceValue === 'object' &&
        !Array.isArray(targetValue) &&
        !Array.isArray(sourceValue)
      ) {
        if (!isSubset(sourceValue as Record<string, unknown>, targetValue as Record<string, unknown>)) {
          return false;
        }
      }
      // For arrays, check if the types are compatible
      else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        // Simple check for array compatibility - could be enhanced for more complex cases
        if (targetValue.length > 0 && sourceValue.length > 0) {
          const targetItemType = typeof targetValue[0];
          const sourceItemType = typeof sourceValue[0];
          if (targetItemType !== sourceItemType) {
            return false;
          }
        }
      }
      // For primitive values, check if the types match
      else if (typeof targetValue !== typeof sourceValue) {
        return false;
      }
    }

    return true;
  };

  // Check additional properties in the source schema
  const hasAdditionalProperties = (): boolean => {
    if (ignoreAdditionalProperties) {
      return false;
    }

    for (const key of Object.keys(sourceSchema)) {
      if (!(key in targetSchema)) {
        return true;
      }
    }

    return false;
  };

  let compatible = false;
  let reason: string | undefined;

  switch (mode) {
    case 'backward':
      // Backward compatibility: new schema can read old data
      // Target schema must be a superset of source schema
      compatible = isSubset(sourceSchema, targetSchema);
      reason = compatible ? undefined : 'Target schema cannot process all fields from source schema';
      break;

    case 'forward':
      // Forward compatibility: old schema can read new data
      // Source schema must be a superset of target schema
      compatible = isSubset(targetSchema, sourceSchema) && !hasAdditionalProperties();
      reason = compatible
        ? undefined
        : hasAdditionalProperties()
        ? 'Source schema contains additional properties not in target schema'
        : 'Source schema is missing required fields from target schema';
      break;

    case 'full':
      // Full compatibility: both backward and forward
      // Schemas must be equivalent (ignoring additional properties if specified)
      const backwardCompatible = isSubset(sourceSchema, targetSchema);
      const forwardCompatible = isSubset(targetSchema, sourceSchema) && !hasAdditionalProperties();
      compatible = backwardCompatible && forwardCompatible;
      reason = compatible
        ? undefined
        : !backwardCompatible
        ? 'Target schema cannot process all fields from source schema'
        : 'Source schema is missing required fields from target schema or contains additional properties';
      break;

    default:
      throw new Error(`Unknown schema compatibility mode: ${mode}`);
  }

  return {
    compatible,
    reason,
    details: {
      isNewer: false, // Not applicable for schema comparison
      isSameMajor: true, // Not applicable for schema comparison
      breakingChange: !compatible,
    },
  };
}

/**
 * Checks if an event with a source version can be processed by a handler expecting a target version,
 * optionally checking schema compatibility as well.
 * @param sourceVersion The version of the event
 * @param targetVersion The version expected by the handler
 * @param schemaVersionMap Optional map of schemas for different versions
 * @param options Compatibility checking options
 * @returns Result indicating if the event can be processed
 */
export function canProcessEvent(
  sourceVersion: EventVersion,
  targetVersion: EventVersion,
  schemaVersionMap?: EventSchemaVersionMap,
  options: CompatibilityOptions = DEFAULT_COMPATIBILITY_OPTIONS
): VersionComparisonResult {
  // First check version compatibility
  const versionResult = checkVersionCompatibility(sourceVersion, targetVersion, options);
  
  // If versions are incompatible or schema checking is disabled, return the version result
  if (!versionResult.compatible || options.checkSchema === false || !schemaVersionMap) {
    return versionResult;
  }

  // Get schemas for both versions
  const sourceSchema = schemaVersionMap.versions[sourceVersion];
  const targetSchema = schemaVersionMap.versions[targetVersion];

  // If either schema is missing, we can't check schema compatibility
  if (!sourceSchema || !targetSchema) {
    return {
      ...versionResult,
      reason: `Schema not found for ${!sourceSchema ? sourceVersion : targetVersion}`,
    };
  }

  // Check schema compatibility
  const schemaResult = checkSchemaCompatibility(
    sourceSchema as Record<string, unknown>,
    targetSchema as Record<string, unknown>,
    { mode: 'backward' }
  );

  // If schemas are incompatible, return the schema result
  if (!schemaResult.compatible) {
    return {
      compatible: false,
      reason: schemaResult.reason,
      details: {
        ...versionResult.details,
        breakingChange: true,
      },
    };
  }

  // Both version and schema are compatible
  return versionResult;
}