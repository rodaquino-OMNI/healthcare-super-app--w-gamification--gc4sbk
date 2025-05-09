/**
 * @file compatibility-checker.ts
 * @description Provides utilities to check compatibility between different versions of events
 * based on semantic versioning principles. Determines if changes between versions are breaking
 * or non-breaking, and validates if an event from one version can be processed by a handler
 * expecting another version.
 * 
 * This module helps prevent runtime errors caused by incompatible event schemas and guides
 * proper versioning decisions. It implements semantic versioning rules (major.minor.patch)
 * and provides both functional and class-based APIs for version compatibility checking.
 */

import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import {
  ParsedVersion,
  VersionComparisonResult,
  CompatibilityCheckOptions,
  CompatibilityRule,
  isVersionedEvent
} from './types';
import {
  DEFAULT_COMPATIBILITY_CHECK_OPTIONS,
  VERSION_FORMAT,
  VERSION_COMPATIBILITY_LEVEL,
  ERROR_MESSAGES
} from './constants';
import { createVersionCompatibilityError } from './errors';

/**
 * Parses a semantic version string into its components
 * @param version The version string to parse (e.g., "1.2.3")
 * @returns The parsed version with major, minor, and patch components
 * @throws {Error} If the version string is invalid
 */
export function parseVersion(version: string): ParsedVersion {
  if (!VERSION_FORMAT.SEMVER_REGEX.test(version)) {
    throw createVersionCompatibilityError(
      ERROR_MESSAGES.COMPATIBILITY.INVALID_FORMAT.replace('{version}', version)
        .replace('{format}', VERSION_FORMAT.FORMAT_STRING),
      { version }
    );
  }

  const [major, minor, patch] = version.split(VERSION_FORMAT.SEPARATOR).map(Number);
  
  return { major, minor, patch };
}

/**
 * Compares two version strings and returns their relationship
 * @param versionA First version to compare
 * @param versionB Second version to compare
 * @returns -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
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
 * Determines the compatibility level between two versions
 * @param sourceVersion The source version
 * @param targetVersion The target version
 * @returns The compatibility level
 */
export function getCompatibilityLevel(
  sourceVersion: string,
  targetVersion: string
): VERSION_COMPATIBILITY_LEVEL {
  const comparison = compareVersions(sourceVersion, targetVersion);
  
  if (comparison === 0) {
    return VERSION_COMPATIBILITY_LEVEL.IDENTICAL;
  }
  
  const source = parseVersion(sourceVersion);
  const target = parseVersion(targetVersion);
  
  if (comparison < 0) {
    // Source is older than target
    return VERSION_COMPATIBILITY_LEVEL.OLDER;
  } else {
    // Source is newer than target
    return VERSION_COMPATIBILITY_LEVEL.NEWER;
  }
}

/**
 * Checks if a source version is compatible with a target version
 * @param sourceVersion The source version
 * @param targetVersion The target version
 * @param options Compatibility check options
 * @returns Whether the versions are compatible and reason if not
 */
export function checkVersionCompatibility(
  sourceVersion: string,
  targetVersion: string,
  options: CompatibilityCheckOptions = DEFAULT_COMPATIBILITY_CHECK_OPTIONS
): VersionComparisonResult {
  const source = parseVersion(sourceVersion);
  const target = parseVersion(targetVersion);
  const compatibilityLevel = getCompatibilityLevel(sourceVersion, targetVersion);
  
  // If versions are identical, they are compatible
  if (compatibilityLevel === VERSION_COMPATIBILITY_LEVEL.IDENTICAL) {
    return { isCompatible: true };
  }
  
  // Apply semantic versioning rules
  if (options.strictSemver) {
    if (compatibilityLevel === VERSION_COMPATIBILITY_LEVEL.OLDER) {
      // Source is older than target
      // In strict semver, older versions are compatible with newer versions
      // only if the major version is the same
      if (source.major !== target.major) {
        return {
          isCompatible: false,
          reason: 'Major version mismatch',
          breakingChanges: [`Major version changed from ${source.major} to ${target.major}`]
        };
      }
      
      // Minor version changes might introduce new features but should be backward compatible
      return { isCompatible: true };
    } else {
      // Source is newer than target
      // In strict semver, newer versions are not compatible with older versions
      // unless explicitly allowed
      
      // Check if major versions match
      if (source.major !== target.major) {
        return {
          isCompatible: false,
          reason: 'Major version mismatch',
          breakingChanges: [`Major version changed from ${target.major} to ${source.major}`]
        };
      }
      
      // Check if minor versions are compatible
      if (source.minor !== target.minor && !options.allowNewerMinor) {
        return {
          isCompatible: false,
          reason: 'Minor version mismatch and allowNewerMinor is false',
          breakingChanges: [`Minor version changed from ${target.minor} to ${source.minor}`]
        };
      }
      
      // Check if patch versions are compatible
      if (source.patch !== target.patch && !options.allowNewerPatch) {
        return {
          isCompatible: false,
          reason: 'Patch version mismatch and allowNewerPatch is false',
          breakingChanges: [`Patch version changed from ${target.patch} to ${source.patch}`]
        };
      }
      
      // Versions are compatible
      return { isCompatible: true };
    }
  } else {
    // Non-strict mode - apply custom rules
    const breakingChanges: string[] = [];
    
    // Apply custom compatibility rules
    if (options.customRules && options.customRules.length > 0) {
      for (const rule of options.customRules) {
        if (!rule.check(source, target)) {
          breakingChanges.push(rule.message);
        }
      }
    }
    
    return {
      isCompatible: breakingChanges.length === 0,
      reason: breakingChanges.length > 0 ? 'Custom compatibility rules failed' : undefined,
      breakingChanges: breakingChanges.length > 0 ? breakingChanges : undefined
    };
  }
}

/**
 * Checks if an event is compatible with a target version
 * @param event The event to check
 * @param targetVersion The target version
 * @param options Compatibility check options
 * @returns Whether the event is compatible with the target version
 * @throws {Error} If the event is not a versioned event
 */
export function isEventCompatibleWithVersion<T extends IVersionedEvent>(
  event: T,
  targetVersion: string,
  options: CompatibilityCheckOptions = DEFAULT_COMPATIBILITY_CHECK_OPTIONS
): VersionComparisonResult {
  if (!isVersionedEvent(event)) {
    throw createVersionCompatibilityError(
      'Event is not a versioned event',
      { event }
    );
  }
  
  return checkVersionCompatibility(event.version, targetVersion, options);
}

/**
 * Checks if two events are compatible with each other
 * @param sourceEvent The source event
 * @param targetEvent The target event
 * @param options Compatibility check options
 * @returns Whether the events are compatible
 * @throws {Error} If either event is not a versioned event
 */
export function areEventsCompatible<T extends IVersionedEvent, U extends IVersionedEvent>(
  sourceEvent: T,
  targetEvent: U,
  options: CompatibilityCheckOptions = DEFAULT_COMPATIBILITY_CHECK_OPTIONS
): VersionComparisonResult {
  if (!isVersionedEvent(sourceEvent) || !isVersionedEvent(targetEvent)) {
    throw createVersionCompatibilityError(
      'Both events must be versioned events',
      { sourceEvent, targetEvent }
    );
  }
  
  return checkVersionCompatibility(sourceEvent.version, targetEvent.version, options);
}

/**
 * Performs schema-based compatibility checking between two event schemas
 * @param sourceSchema The source schema
 * @param targetSchema The target schema
 * @param options Additional options for schema compatibility checking
 * @returns Whether the schemas are compatible and any breaking changes
 */
export function checkSchemaCompatibility(
  sourceSchema: Record<string, any>,
  targetSchema: Record<string, any>,
  options: {
    /**
     * Whether to treat new required fields as breaking changes
     * Default: true
     */
    treatNewRequiredFieldsAsBreaking?: boolean;
    /**
     * Whether to treat removed fields as breaking changes
     * Default: true
     */
    treatRemovedFieldsAsBreaking?: boolean;
    /**
     * Whether to treat type changes as breaking changes
     * Default: true
     */
    treatTypeChangesAsBreaking?: boolean;
    /**
     * Whether to check nested objects recursively
     * Default: true
     */
    checkNestedObjects?: boolean;
    /**
     * Whether to check array item types
     * Default: true
     */
    checkArrayItems?: boolean;
  } = {}
): VersionComparisonResult {
  const {
    treatNewRequiredFieldsAsBreaking = true,
    treatRemovedFieldsAsBreaking = true,
    treatTypeChangesAsBreaking = true,
    checkNestedObjects = true,
    checkArrayItems = true
  } = options;
  
  const breakingChanges: string[] = [];
  const nonBreakingChanges: string[] = [];
  
  // Check for removed required fields
  const sourceRequiredFields = new Set(sourceSchema.required || []);
  const targetRequiredFields = new Set(targetSchema.required || []);
  
  // Fields that are required in the target but not in the source
  const newRequiredFields = [...targetRequiredFields].filter(field => !sourceRequiredFields.has(field));
  
  if (newRequiredFields.length > 0) {
    const message = `New required fields added: ${newRequiredFields.join(', ')}`;
    if (treatNewRequiredFieldsAsBreaking) {
      breakingChanges.push(message);
    } else {
      nonBreakingChanges.push(message);
    }
  }
  
  // Check for removed fields
  const sourceProperties = new Set(Object.keys(sourceSchema.properties || {}));
  const targetProperties = new Set(Object.keys(targetSchema.properties || {}));
  
  // Fields that are in the source but not in the target
  const removedFields = [...sourceProperties].filter(field => !targetProperties.has(field));
  
  if (removedFields.length > 0) {
    const message = `Fields removed: ${removedFields.join(', ')}`;
    if (treatRemovedFieldsAsBreaking) {
      breakingChanges.push(message);
    } else {
      nonBreakingChanges.push(message);
    }
  }
  
  // Fields that are in the target but not in the source (new fields)
  const newFields = [...targetProperties].filter(field => !sourceProperties.has(field));
  
  if (newFields.length > 0) {
    nonBreakingChanges.push(`New fields added: ${newFields.join(', ')}`);
  }
  
  // Check for type changes in existing fields
  const commonFields = [...sourceProperties].filter(field => targetProperties.has(field));
  
  for (const field of commonFields) {
    const sourceField = sourceSchema.properties[field];
    const targetField = targetSchema.properties[field];
    const sourceType = sourceField.type;
    const targetType = targetField.type;
    
    // Check for type changes
    if (sourceType !== targetType) {
      const message = `Type changed for field '${field}' from ${sourceType} to ${targetType}`;
      if (treatTypeChangesAsBreaking) {
        breakingChanges.push(message);
      } else {
        nonBreakingChanges.push(message);
      }
    }
    
    // Check nested objects recursively
    if (checkNestedObjects && sourceType === 'object' && targetType === 'object') {
      const nestedResult = checkSchemaCompatibility(sourceField, targetField, options);
      
      if (!nestedResult.isCompatible && nestedResult.breakingChanges) {
        // Prefix nested breaking changes with the field name
        breakingChanges.push(
          ...nestedResult.breakingChanges.map(change => `${field}.${change}`)
        );
      }
    }
    
    // Check array item types
    if (checkArrayItems && sourceType === 'array' && targetType === 'array') {
      const sourceItems = sourceField.items;
      const targetItems = targetField.items;
      
      if (sourceItems && targetItems) {
        if (sourceItems.type !== targetItems.type) {
          const message = `Array item type changed for field '${field}' from ${sourceItems.type} to ${targetItems.type}`;
          if (treatTypeChangesAsBreaking) {
            breakingChanges.push(message);
          } else {
            nonBreakingChanges.push(message);
          }
        }
        
        // If array items are objects, check them recursively
        if (checkNestedObjects && sourceItems.type === 'object' && targetItems.type === 'object') {
          const nestedResult = checkSchemaCompatibility(sourceItems, targetItems, options);
          
          if (!nestedResult.isCompatible && nestedResult.breakingChanges) {
            // Prefix nested breaking changes with the field name and [items]
            breakingChanges.push(
              ...nestedResult.breakingChanges.map(change => `${field}[items].${change}`)
            );
          }
        }
      }
    }
    
    // Check for enum changes
    if (sourceField.enum && targetField.enum) {
      const sourceEnum = new Set(sourceField.enum);
      const targetEnum = new Set(targetField.enum);
      
      // Check for removed enum values
      const removedEnumValues = [...sourceEnum].filter(value => !targetEnum.has(value));
      
      if (removedEnumValues.length > 0) {
        const message = `Enum values removed for field '${field}': ${removedEnumValues.join(', ')}`;
        if (treatRemovedFieldsAsBreaking) {
          breakingChanges.push(message);
        } else {
          nonBreakingChanges.push(message);
        }
      }
      
      // New enum values are non-breaking
      const newEnumValues = [...targetEnum].filter(value => !sourceEnum.has(value));
      
      if (newEnumValues.length > 0) {
        nonBreakingChanges.push(`New enum values added for field '${field}': ${newEnumValues.join(', ')}`);
      }
    }
  }
  
  return {
    isCompatible: breakingChanges.length === 0,
    reason: breakingChanges.length > 0 ? 'Schema compatibility check failed' : undefined,
    breakingChanges: breakingChanges.length > 0 ? breakingChanges : undefined
  };
}

/**
 * Creates a custom compatibility rule
 * @param name Rule name
 * @param checkFn Function to check compatibility
 * @param message Message to include when rule fails
 * @returns A compatibility rule
 */
export function createCompatibilityRule(
  name: string,
  checkFn: (source: ParsedVersion, target: ParsedVersion) => boolean,
  message: string
): CompatibilityRule {
  return {
    name,
    check: checkFn,
    message
  };
}

/**
 * Predefined compatibility rules
 */
export const COMPATIBILITY_RULES = {
  /**
   * Rule that requires exact version match
   */
  EXACT_MATCH: createCompatibilityRule(
    'exactMatch',
    (source, target) => (
      source.major === target.major &&
      source.minor === target.minor &&
      source.patch === target.patch
    ),
    'Versions must match exactly'
  ),
  
  /**
   * Rule that requires major version match
   */
  MAJOR_VERSION_MATCH: createCompatibilityRule(
    'majorVersionMatch',
    (source, target) => source.major === target.major,
    'Major versions must match'
  ),
  
  /**
   * Rule that requires major and minor version match
   */
  MINOR_VERSION_MATCH: createCompatibilityRule(
    'minorVersionMatch',
    (source, target) => (
      source.major === target.major &&
      source.minor === target.minor
    ),
    'Major and minor versions must match'
  ),
  
  /**
   * Rule that allows newer patch versions
   */
  ALLOW_NEWER_PATCH: createCompatibilityRule(
    'allowNewerPatch',
    (source, target) => (
      source.major === target.major &&
      source.minor === target.minor &&
      (source.patch >= target.patch)
    ),
    'Source patch version must be greater than or equal to target patch version'
  ),
  
  /**
   * Rule that allows newer minor and patch versions
   */
  ALLOW_NEWER_MINOR: createCompatibilityRule(
    'allowNewerMinor',
    (source, target) => (
      source.major === target.major &&
      (source.minor > target.minor || (source.minor === target.minor && source.patch >= target.patch))
    ),
    'Source minor version must be greater than or equal to target minor version'
  ),
  
  /**
   * Rule that allows any version within a major version
   */
  SAME_MAJOR_VERSION: createCompatibilityRule(
    'sameMajorVersion',
    (source, target) => source.major === target.major,
    'Source and target must have the same major version'
  ),
  
  /**
   * Rule that requires source version to be at least the target version
   */
  AT_LEAST_TARGET_VERSION: createCompatibilityRule(
    'atLeastTargetVersion',
    (source, target) => {
      if (source.major !== target.major) return source.major > target.major;
      if (source.minor !== target.minor) return source.minor > target.minor;
      return source.patch >= target.patch;
    },
    'Source version must be greater than or equal to target version'
  )
};

/**
 * Creates a compatibility check options object with predefined rules
 * @param preset The preset to use
 * @returns Compatibility check options
 */
export function createCompatibilityOptions(
  preset: 'strict' | 'relaxed' | 'development' | 'production'
): CompatibilityCheckOptions {
  switch (preset) {
    case 'strict':
      return {
        strictSemver: true,
        allowNewerPatch: false,
        allowNewerMinor: false,
        customRules: [COMPATIBILITY_RULES.EXACT_MATCH]
      };
    
    case 'relaxed':
      return {
        strictSemver: true,
        allowNewerPatch: true,
        allowNewerMinor: true,
        customRules: []
      };
    
    case 'development':
      return {
        strictSemver: false,
        allowNewerPatch: true,
        allowNewerMinor: true,
        customRules: [COMPATIBILITY_RULES.SAME_MAJOR_VERSION]
      };
    
    case 'production':
      return {
        strictSemver: true,
        allowNewerPatch: true,
        allowNewerMinor: false,
        customRules: []
      };
    
    default:
      return DEFAULT_COMPATIBILITY_CHECK_OPTIONS;
  }
}

/**
 * Checks if a version is within a specified range
 * @param version The version to check
 * @param range The version range
 * @returns Whether the version is within the range
 */
export function isVersionInRange(version: string, range: { min: string; max?: string }): boolean {
  const minComparison = compareVersions(version, range.min);
  
  // Version must be greater than or equal to minimum
  if (minComparison < 0) {
    return false;
  }
  
  // If maximum is specified, version must be less than or equal to maximum
  if (range.max) {
    const maxComparison = compareVersions(version, range.max);
    return maxComparison <= 0;
  }
  
  return true;
}

/**
 * Determines if a version change is a major, minor, or patch change
 * @param fromVersion The original version
 * @param toVersion The new version
 * @returns The type of version change
 */
export function getVersionChangeType(
  fromVersion: string,
  toVersion: string
): 'major' | 'minor' | 'patch' | 'none' {
  const from = parseVersion(fromVersion);
  const to = parseVersion(toVersion);
  
  if (from.major !== to.major) {
    return 'major';
  }
  
  if (from.minor !== to.minor) {
    return 'minor';
  }
  
  if (from.patch !== to.patch) {
    return 'patch';
  }
  
  return 'none';
}

/**
 * Increments a version according to semantic versioning rules
 * @param version The version to increment
 * @param type The type of increment (major, minor, or patch)
 * @returns The incremented version
 */
export function incrementVersion(
  version: string,
  type: 'major' | 'minor' | 'patch'
): string {
  const parsed = parseVersion(version);
  
  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    
    default:
      return version;
  }
}

/**
 * Class-based implementation of version compatibility checking
 * Provides an object-oriented approach to version compatibility
 */
export class VersionCompatibilityChecker {
  private options: CompatibilityCheckOptions;
  
  /**
   * Creates a new version compatibility checker
   * @param options Compatibility check options
   */
  constructor(options: CompatibilityCheckOptions = DEFAULT_COMPATIBILITY_CHECK_OPTIONS) {
    this.options = { ...DEFAULT_COMPATIBILITY_CHECK_OPTIONS, ...options };
  }
  
  /**
   * Sets compatibility check options
   * @param options The options to set
   * @returns This instance for method chaining
   */
  setOptions(options: Partial<CompatibilityCheckOptions>): this {
    this.options = { ...this.options, ...options };
    return this;
  }
  
  /**
   * Gets the current compatibility check options
   * @returns The current options
   */
  getOptions(): CompatibilityCheckOptions {
    return { ...this.options };
  }
  
  /**
   * Uses a preset configuration
   * @param preset The preset to use
   * @returns This instance for method chaining
   */
  usePreset(preset: 'strict' | 'relaxed' | 'development' | 'production'): this {
    this.options = createCompatibilityOptions(preset);
    return this;
  }
  
  /**
   * Adds a custom compatibility rule
   * @param rule The rule to add
   * @returns This instance for method chaining
   */
  addRule(rule: CompatibilityRule): this {
    if (!this.options.customRules) {
      this.options.customRules = [];
    }
    
    this.options.customRules.push(rule);
    return this;
  }
  
  /**
   * Checks if a source version is compatible with a target version
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns Whether the versions are compatible and reason if not
   */
  checkVersionCompatibility(
    sourceVersion: string,
    targetVersion: string
  ): VersionComparisonResult {
    return checkVersionCompatibility(sourceVersion, targetVersion, this.options);
  }
  
  /**
   * Checks if an event is compatible with a target version
   * @param event The event to check
   * @param targetVersion The target version
   * @returns Whether the event is compatible with the target version
   */
  isEventCompatibleWithVersion<T extends IVersionedEvent>(
    event: T,
    targetVersion: string
  ): VersionComparisonResult {
    return isEventCompatibleWithVersion(event, targetVersion, this.options);
  }
  
  /**
   * Checks if two events are compatible with each other
   * @param sourceEvent The source event
   * @param targetEvent The target event
   * @returns Whether the events are compatible
   */
  areEventsCompatible<T extends IVersionedEvent, U extends IVersionedEvent>(
    sourceEvent: T,
    targetEvent: U
  ): VersionComparisonResult {
    return areEventsCompatible(sourceEvent, targetEvent, this.options);
  }
  
  /**
   * Performs schema-based compatibility checking between two event schemas
   * @param sourceSchema The source schema
   * @param targetSchema The target schema
   * @param schemaOptions Additional options for schema compatibility checking
   * @returns Whether the schemas are compatible and any breaking changes
   */
  checkSchemaCompatibility(
    sourceSchema: Record<string, any>,
    targetSchema: Record<string, any>,
    schemaOptions?: Parameters<typeof checkSchemaCompatibility>[2]
  ): VersionComparisonResult {
    return checkSchemaCompatibility(sourceSchema, targetSchema, schemaOptions);
  }
  
  /**
   * Gets the compatibility level between two versions
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns The compatibility level
   */
  getCompatibilityLevel(
    sourceVersion: string,
    targetVersion: string
  ): VERSION_COMPATIBILITY_LEVEL {
    return getCompatibilityLevel(sourceVersion, targetVersion);
  }
  
  /**
   * Checks if a version is within a specified range
   * @param version The version to check
   * @param range The version range
   * @returns Whether the version is within the range
   */
  isVersionInRange(version: string, range: { min: string; max?: string }): boolean {
    return isVersionInRange(version, range);
  }
  
  /**
   * Determines if a version change is a major, minor, or patch change
   * @param fromVersion The original version
   * @param toVersion The new version
   * @returns The type of version change
   */
  getVersionChangeType(
    fromVersion: string,
    toVersion: string
  ): 'major' | 'minor' | 'patch' | 'none' {
    return getVersionChangeType(fromVersion, toVersion);
  }
  
  /**
   * Increments a version according to semantic versioning rules
   * @param version The version to increment
   * @param type The type of increment (major, minor, or patch)
   * @returns The incremented version
   */
  incrementVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
    return incrementVersion(version, type);
  }
}