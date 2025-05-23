/**
 * @file compatibility-checker.ts
 * @description Provides utilities to check compatibility between different versions of events
 * based on semantic versioning principles. Determines if changes between versions are breaking
 * or non-breaking, and validates if an event from one version can be processed by a handler
 * expecting another version.
 */

import { IVersionedEvent } from '../interfaces';
import {
  CompatibilityCheckerConfig,
  ParsedVersion,
  SchemaDifference,
  SchemaComparisonResult,
  VersionCompatibilityResult,
} from './types';
import {
  DEFAULT_COMPATIBILITY_CHECKER_CONFIG,
  VERSION_FORMAT_REGEX,
  SUPPORTED_VERSIONS,
  MINIMUM_SUPPORTED_VERSION,
} from './constants';
import { IncompatibleVersionError, VersionDetectionError } from './errors';

/**
 * Parses a semantic version string into its components
 * 
 * @param version - The version string to parse (e.g., "1.2.3")
 * @returns Parsed version with major, minor, and patch components
 * @throws {VersionDetectionError} If the version format is invalid
 */
export function parseVersion(version: string): ParsedVersion {
  const match = VERSION_FORMAT_REGEX.exec(version);
  
  if (!match) {
    throw VersionDetectionError.invalidFormat(version, 'major.minor.patch');
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Compares two version strings and returns their relationship
 * 
 * @param versionA - First version to compare
 * @param versionB - Second version to compare
 * @returns -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
 * @throws {VersionDetectionError} If either version format is invalid
 */
export function compareVersions(versionA: string, versionB: string): number {
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);
  
  // Compare major versions
  if (parsedA.major !== parsedB.major) {
    return parsedA.major < parsedB.major ? -1 : 1;
  }
  
  // Compare minor versions
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor < parsedB.minor ? -1 : 1;
  }
  
  // Compare patch versions
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch < parsedB.patch ? -1 : 1;
  }
  
  // Versions are equal
  return 0;
}

/**
 * Checks if a version is supported based on the SUPPORTED_VERSIONS list
 * 
 * @param version - The version to check
 * @returns True if the version is supported, false otherwise
 */
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version);
}

/**
 * Checks if a version meets the minimum supported version requirement
 * 
 * @param version - The version to check
 * @returns True if the version meets the minimum requirement, false otherwise
 * @throws {VersionDetectionError} If the version format is invalid
 */
export function meetsMinimumVersion(version: string): boolean {
  return compareVersions(version, MINIMUM_SUPPORTED_VERSION) >= 0;
}

/**
 * Determines if a source version is compatible with a target version
 * based on semantic versioning rules
 * 
 * @param sourceVersion - The source version (e.g., from an event)
 * @param targetVersion - The target version (e.g., expected by a handler)
 * @param config - Configuration options for compatibility checking
 * @returns Compatibility result with details
 * @throws {VersionDetectionError} If either version format is invalid
 */
export function checkVersionCompatibility(
  sourceVersion: string,
  targetVersion: string,
  config: CompatibilityCheckerConfig = DEFAULT_COMPATIBILITY_CHECKER_CONFIG
): VersionCompatibilityResult {
  // Parse versions
  const source = parseVersion(sourceVersion);
  const target = parseVersion(targetVersion);
  
  // Check if versions are identical
  if (sourceVersion === targetVersion) {
    return { compatible: true };
  }
  
  // Compare versions
  const comparison = compareVersions(sourceVersion, targetVersion);
  
  // Source is older than target
  if (comparison < 0) {
    // Major version difference (breaking change)
    if (source.major < target.major) {
      return {
        compatible: false,
        reason: `Major version upgrade required (${sourceVersion} to ${targetVersion})`,
        breakingChanges: [`Major version change from ${source.major} to ${target.major}`],
      };
    }
    
    // Minor version difference (backward compatible)
    return {
      compatible: true,
      reason: `Minor/patch version difference (${sourceVersion} to ${targetVersion})`,
    };
  }
  
  // Source is newer than target
  if (comparison > 0) {
    // Downgrade not allowed by default
    if (!config.allowDowngrade) {
      return {
        compatible: false,
        reason: `Version downgrade not allowed (${sourceVersion} to ${targetVersion})`,
        breakingChanges: ['Version downgrade not allowed by configuration'],
      };
    }
    
    // Major version difference (breaking change)
    if (source.major > target.major) {
      return {
        compatible: false,
        reason: `Major version downgrade required (${sourceVersion} to ${targetVersion})`,
        breakingChanges: [`Major version change from ${source.major} to ${target.major}`],
      };
    }
    
    // Minor version difference in strict mode
    if (config.strict && source.minor > target.minor) {
      return {
        compatible: false,
        reason: `Minor version downgrade required in strict mode (${sourceVersion} to ${targetVersion})`,
        breakingChanges: [`Minor version change from ${source.minor} to ${target.minor}`],
      };
    }
    
    // Compatible in non-strict mode or patch-only difference
    return {
      compatible: !config.strict,
      reason: config.strict
        ? `Strict mode requires exact version match (${sourceVersion} vs ${targetVersion})`
        : `Minor/patch version difference allowed (${sourceVersion} to ${targetVersion})`,
    };
  }
  
  // This should never happen as we already checked for equality
  return { compatible: true };
}

/**
 * Checks if an event is compatible with a target version
 * 
 * @param event - The event to check
 * @param targetVersion - The target version
 * @param config - Configuration options for compatibility checking
 * @returns Compatibility result with details
 * @throws {VersionDetectionError} If the event has no version or invalid version format
 */
export function isEventCompatibleWithVersion(
  event: IVersionedEvent,
  targetVersion: string,
  config: CompatibilityCheckerConfig = DEFAULT_COMPATIBILITY_CHECKER_CONFIG
): VersionCompatibilityResult {
  if (!event.version) {
    throw VersionDetectionError.missingVersion(event.eventId || 'unknown');
  }
  
  return checkVersionCompatibility(event.version, targetVersion, config);
}

/**
 * Validates that an event can be processed by a handler expecting a specific version
 * 
 * @param event - The event to validate
 * @param handlerVersion - The version expected by the handler
 * @param config - Configuration options for compatibility checking
 * @throws {IncompatibleVersionError} If the event is not compatible with the handler version
 */
export function validateEventVersionForHandler(
  event: IVersionedEvent,
  handlerVersion: string,
  config: CompatibilityCheckerConfig = DEFAULT_COMPATIBILITY_CHECKER_CONFIG
): void {
  const result = isEventCompatibleWithVersion(event, handlerVersion, config);
  
  if (!result.compatible) {
    throw IncompatibleVersionError.versionMismatch(
      event.version,
      handlerVersion,
      event.type,
    );
  }
}

/**
 * Analyzes schema differences between two versions of an event schema
 * 
 * @param sourceSchema - The source schema object
 * @param targetSchema - The target schema object
 * @param path - Current path in the schema (used for recursion)
 * @returns Schema comparison result with differences
 */
export function compareSchemas(
  sourceSchema: Record<string, any>,
  targetSchema: Record<string, any>,
  path = ''
): SchemaComparisonResult {
  const differences: SchemaDifference[] = [];
  const breakingChanges: SchemaDifference[] = [];
  
  // Check for removed fields (breaking change)
  for (const key in sourceSchema) {
    const fieldPath = path ? `${path}.${key}` : key;
    
    if (!(key in targetSchema)) {
      const difference: SchemaDifference = {
        path: fieldPath,
        type: 'removed',
        breaking: true,
      };
      differences.push(difference);
      breakingChanges.push(difference);
    } else if (
      typeof sourceSchema[key] === 'object' &&
      sourceSchema[key] !== null &&
      typeof targetSchema[key] === 'object' &&
      targetSchema[key] !== null
    ) {
      // Recursively compare nested objects
      const nestedResult = compareSchemas(
        sourceSchema[key],
        targetSchema[key],
        fieldPath
      );
      
      differences.push(...nestedResult.differences);
      breakingChanges.push(...nestedResult.breakingChanges);
    } else if (typeof sourceSchema[key] !== typeof targetSchema[key]) {
      // Type changes are breaking changes
      const difference: SchemaDifference = {
        path: fieldPath,
        type: 'type_changed',
        sourceType: typeof sourceSchema[key],
        targetType: typeof targetSchema[key],
        breaking: true,
      };
      differences.push(difference);
      breakingChanges.push(difference);
    }
  }
  
  // Check for added fields (non-breaking change if not required)
  for (const key in targetSchema) {
    const fieldPath = path ? `${path}.${key}` : key;
    
    if (!(key in sourceSchema)) {
      differences.push({
        path: fieldPath,
        type: 'added',
        breaking: false, // Added fields are generally not breaking changes
      });
    }
  }
  
  return {
    compatible: breakingChanges.length === 0,
    differences,
    breakingChanges,
  };
}

/**
 * Checks if a schema change requires a major version bump
 * 
 * @param sourceSchema - The source schema object
 * @param targetSchema - The target schema object
 * @returns True if a major version bump is required, false otherwise
 */
export function requiresMajorVersionBump(
  sourceSchema: Record<string, any>,
  targetSchema: Record<string, any>
): boolean {
  const result = compareSchemas(sourceSchema, targetSchema);
  return !result.compatible;
}

/**
 * Checks if a schema change requires a minor version bump
 * 
 * @param sourceSchema - The source schema object
 * @param targetSchema - The target schema object
 * @returns True if a minor version bump is required, false otherwise
 */
export function requiresMinorVersionBump(
  sourceSchema: Record<string, any>,
  targetSchema: Record<string, any>
): boolean {
  const result = compareSchemas(sourceSchema, targetSchema);
  
  // If there are breaking changes, it requires a major version bump, not minor
  if (!result.compatible) {
    return false;
  }
  
  // If there are any differences (but no breaking changes), it requires a minor version bump
  return result.differences.length > 0;
}

/**
 * Suggests the next version based on schema changes
 * 
 * @param currentVersion - The current version
 * @param sourceSchema - The source schema object
 * @param targetSchema - The target schema object
 * @returns The suggested next version
 * @throws {VersionDetectionError} If the current version format is invalid
 */
export function suggestNextVersion(
  currentVersion: string,
  sourceSchema: Record<string, any>,
  targetSchema: Record<string, any>
): string {
  const parsed = parseVersion(currentVersion);
  
  if (requiresMajorVersionBump(sourceSchema, targetSchema)) {
    return `${parsed.major + 1}.0.0`;
  }
  
  if (requiresMinorVersionBump(sourceSchema, targetSchema)) {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }
  
  // If no significant changes, suggest a patch bump
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

/**
 * Determines if a version change is backward compatible
 * 
 * @param oldVersion - The old version
 * @param newVersion - The new version
 * @returns True if the change is backward compatible, false otherwise
 * @throws {VersionDetectionError} If either version format is invalid
 */
export function isBackwardCompatibleChange(
  oldVersion: string,
  newVersion: string
): boolean {
  const oldParsed = parseVersion(oldVersion);
  const newParsed = parseVersion(newVersion);
  
  // Major version changes are not backward compatible
  if (newParsed.major > oldParsed.major) {
    return false;
  }
  
  // Same major version, but different minor/patch is backward compatible
  return newParsed.major === oldParsed.major;
}

/**
 * Checks if an event can be safely processed by handlers of different versions
 * 
 * @param event - The event to check
 * @param handlerVersions - Array of handler versions to check against
 * @param config - Configuration options for compatibility checking
 * @returns Map of handler versions to compatibility results
 */
export function checkEventCompatibilityWithHandlers(
  event: IVersionedEvent,
  handlerVersions: string[],
  config: CompatibilityCheckerConfig = DEFAULT_COMPATIBILITY_CHECKER_CONFIG
): Map<string, VersionCompatibilityResult> {
  const results = new Map<string, VersionCompatibilityResult>();
  
  for (const handlerVersion of handlerVersions) {
    results.set(
      handlerVersion,
      isEventCompatibleWithVersion(event, handlerVersion, config)
    );
  }
  
  return results;
}

/**
 * Finds the highest compatible version for an event from a list of available versions
 * 
 * @param event - The event to check
 * @param availableVersions - Array of available versions to check against
 * @param config - Configuration options for compatibility checking
 * @returns The highest compatible version or null if none are compatible
 */
export function findHighestCompatibleVersion(
  event: IVersionedEvent,
  availableVersions: string[],
  config: CompatibilityCheckerConfig = DEFAULT_COMPATIBILITY_CHECKER_CONFIG
): string | null {
  // Sort versions in descending order
  const sortedVersions = [...availableVersions].sort((a, b) => compareVersions(b, a));
  
  for (const version of sortedVersions) {
    const result = isEventCompatibleWithVersion(event, version, config);
    if (result.compatible) {
      return version;
    }
  }
  
  return null;
}