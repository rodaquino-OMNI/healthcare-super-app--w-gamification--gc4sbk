/**
 * @file transformer.ts
 * @description Implements transformation functions to convert events between different versions,
 * supporting both upgrading (older to newer) and downgrading (newer to older) scenarios.
 * Provides a flexible transformation API that works with custom transformers, schema-based
 * transformations, and automatic field mapping.
 */

import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import {
  TransformationOptions,
  FieldTransformer,
  MigrationFunction,
  ParsedVersion,
  isVersionedEvent
} from './types';
import { DEFAULT_TRANSFORMATION_OPTIONS, ERROR_MESSAGES, MIGRATION_DIRECTION, VERSION_FORMAT } from './constants';
import { VersioningError } from './errors';

/**
 * Transforms an event from one version to another
 * @param event The event to transform
 * @param targetVersion The target version to transform to
 * @param options Transformation options
 * @returns The transformed event
 */
export function transformEvent<T extends IVersionedEvent>(
  event: T,
  targetVersion: string,
  options: Partial<TransformationOptions> = {}
): T {
  // Validate input
  if (!event) {
    throw new VersioningError(
      ERROR_MESSAGES.TRANSFORMATION.FAILED,
      'Event cannot be null or undefined'
    );
  }

  if (!isVersionedEvent(event)) {
    throw new VersioningError(
      ERROR_MESSAGES.TRANSFORMATION.FAILED,
      'Input is not a valid versioned event'
    );
  }

  if (!targetVersion || !VERSION_FORMAT.SEMVER_REGEX.test(targetVersion)) {
    throw new VersioningError(
      ERROR_MESSAGES.TRANSFORMATION.FAILED,
      `Invalid target version: ${targetVersion}`
    );
  }

  // If the event is already at the target version, return it as is
  if (event.version === targetVersion) {
    return { ...event };
  }

  // Merge default options with provided options
  const mergedOptions = { ...DEFAULT_TRANSFORMATION_OPTIONS, ...options };

  // Determine transformation direction
  const direction = determineTransformationDirection(event.version, targetVersion);

  // Apply the appropriate transformation based on direction
  let transformedEvent: T;
  
  if (direction === MIGRATION_DIRECTION.UPGRADE) {
    transformedEvent = upgradeEvent(event, targetVersion, mergedOptions);
  } else if (direction === MIGRATION_DIRECTION.DOWNGRADE) {
    transformedEvent = downgradeEvent(event, targetVersion, mergedOptions);
  } else {
    // This should never happen as we already checked for equal versions
    transformedEvent = { ...event };
  }

  // Validate the transformed event if required
  if (mergedOptions.validateResult) {
    const isValid = validateTransformedEvent(transformedEvent, targetVersion);
    
    if (!isValid && mergedOptions.throwOnValidationError) {
      throw new VersioningError(
        ERROR_MESSAGES.TRANSFORMATION.VALIDATION_FAILED,
        `Validation failed for transformed event`,
        {
          eventType: transformedEvent.type,
          version: targetVersion
        }
      );
    }
  }

  return transformedEvent;
}

/**
 * Upgrades an event from an older version to a newer version
 * @param event The event to upgrade
 * @param targetVersion The target version to upgrade to
 * @param options Transformation options
 * @returns The upgraded event
 */
export function upgradeEvent<T extends IVersionedEvent>(
  event: T,
  targetVersion: string,
  options: TransformationOptions
): T {
  // Create a copy of the event to avoid modifying the original
  const upgradedEvent = { ...event };
  
  // Apply field mappings if provided
  if (options.fieldMappings && Object.keys(options.fieldMappings).length > 0) {
    applyFieldMappings(upgradedEvent, options.fieldMappings);
  }
  
  // Apply field transformers if provided
  if (options.fieldTransformers && Object.keys(options.fieldTransformers).length > 0) {
    applyFieldTransformers(upgradedEvent, options.fieldTransformers);
  }
  
  // Update the version
  upgradedEvent.version = targetVersion;
  
  return upgradedEvent;
}

/**
 * Downgrades an event from a newer version to an older version
 * @param event The event to downgrade
 * @param targetVersion The target version to downgrade to
 * @param options Transformation options
 * @returns The downgraded event
 */
export function downgradeEvent<T extends IVersionedEvent>(
  event: T,
  targetVersion: string,
  options: TransformationOptions
): T {
  // Create a copy of the event to avoid modifying the original
  const downgradedEvent = { ...event };
  
  // Apply field mappings if provided (in reverse)
  if (options.fieldMappings && Object.keys(options.fieldMappings).length > 0) {
    applyFieldMappingsReverse(downgradedEvent, options.fieldMappings);
  }
  
  // Apply field transformers if provided
  if (options.fieldTransformers && Object.keys(options.fieldTransformers).length > 0) {
    applyFieldTransformers(downgradedEvent, options.fieldTransformers);
  }
  
  // Remove fields that don't exist in the target version if preserveExtraFields is false
  if (!options.preserveExtraFields) {
    // This would require schema information for the target version
    // For now, we'll rely on explicit field transformers to handle this
  }
  
  // Update the version
  downgradedEvent.version = targetVersion;
  
  return downgradedEvent;
}

/**
 * Creates a transformation pipeline that applies multiple transformations in sequence
 * @param transformations Array of transformation functions to apply
 * @returns A function that applies all transformations in sequence
 */
export function createTransformationPipeline<T extends IVersionedEvent>(
  transformations: Array<MigrationFunction>
): MigrationFunction {
  return (event: T): T => {
    return transformations.reduce((currentEvent, transform) => {
      return transform(currentEvent);
    }, event);
  };
}

/**
 * Applies field mappings to an event
 * @param event The event to apply mappings to
 * @param mappings Object mapping source fields to target fields
 */
function applyFieldMappings<T extends IVersionedEvent>(
  event: T,
  mappings: Record<string, string>
): void {
  for (const [sourceField, targetField] of Object.entries(mappings)) {
    if (sourceField in event && sourceField !== targetField) {
      // @ts-ignore - Dynamic property access
      event[targetField] = event[sourceField];
      
      // Remove the source field if it's different from the target field
      if (sourceField !== targetField) {
        // @ts-ignore - Dynamic property access
        delete event[sourceField];
      }
    }
  }
}

/**
 * Applies field mappings in reverse (for downgrading)
 * @param event The event to apply reverse mappings to
 * @param mappings Object mapping source fields to target fields
 */
function applyFieldMappingsReverse<T extends IVersionedEvent>(
  event: T,
  mappings: Record<string, string>
): void {
  // Create a reverse mapping (target -> source)
  const reverseMappings: Record<string, string> = {};
  
  for (const [sourceField, targetField] of Object.entries(mappings)) {
    reverseMappings[targetField] = sourceField;
  }
  
  applyFieldMappings(event, reverseMappings);
}

/**
 * Applies field transformers to an event
 * @param event The event to apply transformers to
 * @param transformers Object mapping field names to transformer functions
 */
function applyFieldTransformers<T extends IVersionedEvent>(
  event: T,
  transformers: Record<string, FieldTransformer>
): void {
  for (const [field, transformer] of Object.entries(transformers)) {
    try {
      if (field in event) {
        // @ts-ignore - Dynamic property access
        const originalValue = event[field];
        // @ts-ignore - Dynamic property access
        event[field] = transformer(originalValue, event);
      }
    } catch (error) {
      throw new VersioningError(
        ERROR_MESSAGES.TRANSFORMATION.FIELD_FAILED,
        `Failed to transform field "${field}": ${error.message}`,
        {
          field,
          sourceType: typeof event[field],
          error: error.message
        }
      );
    }
  }
}

/**
 * Determines the direction of transformation between two versions
 * @param sourceVersion The source version
 * @param targetVersion The target version
 * @returns The direction of transformation (UPGRADE, DOWNGRADE, or NONE)
 */
function determineTransformationDirection(
  sourceVersion: string,
  targetVersion: string
): MIGRATION_DIRECTION {
  if (sourceVersion === targetVersion) {
    return MIGRATION_DIRECTION.NONE;
  }
  
  const sourceParsed = parseVersion(sourceVersion);
  const targetParsed = parseVersion(targetVersion);
  
  // Compare major versions first
  if (sourceParsed.major < targetParsed.major) {
    return MIGRATION_DIRECTION.UPGRADE;
  } else if (sourceParsed.major > targetParsed.major) {
    return MIGRATION_DIRECTION.DOWNGRADE;
  }
  
  // If major versions are equal, compare minor versions
  if (sourceParsed.minor < targetParsed.minor) {
    return MIGRATION_DIRECTION.UPGRADE;
  } else if (sourceParsed.minor > targetParsed.minor) {
    return MIGRATION_DIRECTION.DOWNGRADE;
  }
  
  // If minor versions are equal, compare patch versions
  if (sourceParsed.patch < targetParsed.patch) {
    return MIGRATION_DIRECTION.UPGRADE;
  } else if (sourceParsed.patch > targetParsed.patch) {
    return MIGRATION_DIRECTION.DOWNGRADE;
  }
  
  // Versions are equal
  return MIGRATION_DIRECTION.NONE;
}

/**
 * Parses a version string into its components
 * @param version The version string to parse
 * @returns The parsed version components
 */
function parseVersion(version: string): ParsedVersion {
  const match = version.match(VERSION_FORMAT.SEMVER_REGEX);
  
  if (!match) {
    throw new VersioningError(
      ERROR_MESSAGES.VERSION_DETECTION.INVALID_FORMAT,
      `Invalid version format: ${version}`,
      {
        version,
        format: VERSION_FORMAT.FORMAT_STRING
      }
    );
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Validates a transformed event against its expected schema
 * @param event The event to validate
 * @param version The version to validate against
 * @returns Whether the event is valid
 */
function validateTransformedEvent<T extends IVersionedEvent>(
  event: T,
  version: string
): boolean {
  // In a real implementation, this would validate against a schema registry
  // For now, we'll do basic validation
  
  // Check that the event has the required fields for a versioned event
  if (!event.version || !event.type || !event.eventId) {
    return false;
  }
  
  // Check that the version matches the expected version
  if (event.version !== version) {
    return false;
  }
  
  // Additional validation could be performed here based on the event type and version
  
  return true;
}

/**
 * Creates a field transformer that transforms a field only if it exists
 * @param transformer The transformer function to apply
 * @returns A field transformer that only transforms existing fields
 */
export function createOptionalFieldTransformer(
  transformer: FieldTransformer
): FieldTransformer {
  return (value: any, event: IVersionedEvent) => {
    if (value === undefined || value === null) {
      return value;
    }
    
    return transformer(value, event);
  };
}

/**
 * Creates a field transformer that transforms a nested field
 * @param path The path to the nested field (dot notation)
 * @param transformer The transformer function to apply
 * @returns A field transformer that transforms a nested field
 */
export function createNestedFieldTransformer(
  path: string,
  transformer: FieldTransformer
): FieldTransformer {
  return (value: any, event: IVersionedEvent) => {
    if (value === undefined || value === null) {
      return value;
    }
    
    const pathParts = path.split('.');
    let current = value;
    
    // Navigate to the nested field
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      if (current === undefined || current === null || typeof current !== 'object') {
        return value; // Cannot navigate further, return original value
      }
      
      current = current[part];
    }
    
    // Apply the transformer to the nested field
    const lastPart = pathParts[pathParts.length - 1];
    
    if (current === undefined || current === null || typeof current !== 'object') {
      return value; // Cannot access the field, return original value
    }
    
    // Create a deep copy of the value to avoid modifying the original
    const result = JSON.parse(JSON.stringify(value));
    
    // Navigate to the parent of the field to transform
    let currentResult = result;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      currentResult = currentResult[part];
    }
    
    // Apply the transformer
    currentResult[lastPart] = transformer(current[lastPart], event);
    
    return result;
  };
}

/**
 * Creates a field transformer that transforms an array of items
 * @param itemTransformer The transformer function to apply to each item
 * @returns A field transformer that transforms an array
 */
export function createArrayFieldTransformer(
  itemTransformer: FieldTransformer
): FieldTransformer {
  return (value: any, event: IVersionedEvent) => {
    if (!Array.isArray(value)) {
      return value;
    }
    
    return value.map(item => itemTransformer(item, event));
  };
}

/**
 * Creates a field transformer that renames a field
 * @param oldName The old field name
 * @param newName The new field name
 * @returns A field transformer that renames a field
 */
export function createFieldRenameTransformer(
  oldName: string,
  newName: string
): FieldTransformer {
  return (value: any, event: IVersionedEvent) => {
    if (value === undefined || value === null || typeof value !== 'object') {
      return value;
    }
    
    const result = { ...value };
    
    if (oldName in result) {
      result[newName] = result[oldName];
      delete result[oldName];
    }
    
    return result;
  };
}

/**
 * Creates a field transformer that changes the type of a field
 * @param transformer The transformer function to apply
 * @returns A field transformer that changes the type of a field
 */
export function createTypeTransformer<T, U>(
  transformer: (value: T) => U
): FieldTransformer {
  return (value: any, event: IVersionedEvent) => {
    if (value === undefined || value === null) {
      return value;
    }
    
    return transformer(value as T);
  };
}

/**
 * Creates a field transformer that applies a default value if the field is missing
 * @param defaultValue The default value to apply
 * @returns A field transformer that applies a default value
 */
export function createDefaultValueTransformer<T>(
  defaultValue: T
): FieldTransformer {
  return (value: any, event: IVersionedEvent) => {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    
    return value;
  };
}

/**
 * Creates a field transformer that combines multiple transformers
 * @param transformers The transformers to combine
 * @returns A field transformer that applies all transformers in sequence
 */
export function createCompositeTransformer(
  ...transformers: FieldTransformer[]
): FieldTransformer {
  return (value: any, event: IVersionedEvent) => {
    return transformers.reduce((currentValue, transformer) => {
      return transformer(currentValue, event);
    }, value);
  };
}