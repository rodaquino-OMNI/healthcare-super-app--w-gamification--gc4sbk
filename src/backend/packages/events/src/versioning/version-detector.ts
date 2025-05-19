/**
 * @file version-detector.ts
 * @description Provides utilities to detect the version of an event payload from different sources.
 * Supports multiple detection strategies including explicit version field, structural analysis,
 * and header-based detection. This module enables the system to correctly identify event versions
 * even when the versioning approach varies across different parts of the application.
 */

import { EventVersion } from '../interfaces/event-versioning.interface';
import { KafkaEvent } from '../interfaces/kafka-event.interface';
import { VERSION_CONSTANTS, DEFAULT_VERSION_CONFIG, VERSION_ERROR_MESSAGES } from './constants';
import { VersionDetectionError, VersioningErrorCode } from './errors';
import {
  VersionDetectionStrategy,
  VersionDetectionOptions,
  VersionDetectionResult,
  isValidVersion,
} from './types';

/**
 * Detects the version of an event payload using configured strategies.
 * Tries each strategy in order until one succeeds or all fail.
 *
 * @param payload - The event payload to detect version from
 * @param options - Configuration options for version detection
 * @returns A result object containing the detected version and metadata
 * @throws VersionDetectionError if throwOnFailure is true and no version could be detected
 */
export function detectVersion(
  payload: unknown,
  options?: Partial<VersionDetectionOptions>
): VersionDetectionResult {
  // Merge provided options with defaults
  const config: VersionDetectionOptions = {
    strategies: options?.strategies || getDefaultStrategies(),
    throwOnFailure: options?.throwOnFailure ?? DEFAULT_VERSION_CONFIG.THROW_ON_VERSION_DETECTION_FAILURE,
    defaultVersion: options?.defaultVersion || VERSION_CONSTANTS.DEFAULT_VERSION,
  };

  // Try each strategy in order
  for (const strategy of config.strategies) {
    try {
      const result = applyDetectionStrategy(payload, strategy);
      if (result.success && result.version) {
        return result;
      }
    } catch (error) {
      // Continue to next strategy on failure
      continue;
    }
  }

  // If we reach here, all strategies failed
  const eventId = typeof payload === 'object' && payload !== null ? (payload as any).eventId : undefined;
  const error = new VersionDetectionError(
    VERSION_ERROR_MESSAGES.VERSION_NOT_DETECTED.replace('{eventId}', eventId || 'unknown'),
    { eventId }
  );

  // Either throw or return failure result
  if (config.throwOnFailure) {
    throw error;
  }

  return {
    success: false,
    error,
  };
}

/**
 * Applies a specific detection strategy to the payload.
 *
 * @param payload - The event payload to detect version from
 * @param strategy - The strategy to apply
 * @returns A result object containing the detected version if successful
 */
function applyDetectionStrategy(
  payload: unknown,
  strategy: VersionDetectionStrategy
): VersionDetectionResult {
  switch (strategy.type) {
    case 'explicit':
      return detectExplicitVersion(payload, strategy.field);
    case 'header':
      return detectHeaderVersion(payload, strategy.headerName);
    case 'structure':
      return detectStructureVersion(
        payload,
        strategy.versionMap,
        strategy.structureChecks
      );
    case 'fallback':
      return {
        success: true,
        version: strategy.defaultVersion,
        strategy: 'fallback',
      };
    default:
      return {
        success: false,
        error: new VersionDetectionError(`Unknown detection strategy: ${(strategy as any).type}`),
      };
  }
}

/**
 * Detects version from an explicit version field in the payload.
 *
 * @param payload - The event payload to detect version from
 * @param field - The name of the field containing the version
 * @returns A result object containing the detected version if successful
 */
export function detectExplicitVersion(
  payload: unknown,
  field: string = VERSION_CONSTANTS.VERSION_FIELD
): VersionDetectionResult {
  // Ensure payload is an object
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      error: new VersionDetectionError('Payload is not an object'),
    };
  }

  // Extract version from nested path (supports dot notation)
  const version = extractNestedProperty(payload, field);

  // Validate version exists and has correct format
  if (version === undefined) {
    return {
      success: false,
      error: VersionDetectionError.fieldMissing(
        field,
        (payload as any).eventId,
        (payload as any).type
      ),
    };
  }

  if (typeof version !== 'string' || !isValidVersion(version)) {
    return {
      success: false,
      error: VersionDetectionError.invalidFormat(
        String(version),
        (payload as any).eventId,
        (payload as any).type
      ),
    };
  }

  return {
    success: true,
    version,
    strategy: 'explicit',
  };
}

/**
 * Detects version from headers (primarily for Kafka messages).
 *
 * @param payload - The event payload to detect version from
 * @param headerName - The name of the header containing the version
 * @returns A result object containing the detected version if successful
 */
export function detectHeaderVersion(
  payload: unknown,
  headerName: string = VERSION_CONSTANTS.VERSION_HEADER
): VersionDetectionResult {
  // Check if payload is a Kafka event with headers
  if (
    !payload ||
    typeof payload !== 'object' ||
    !(payload as Partial<KafkaEvent>).headers
  ) {
    return {
      success: false,
      error: new VersionDetectionError('Payload has no headers'),
    };
  }

  const kafkaEvent = payload as Partial<KafkaEvent>;
  const headers = kafkaEvent.headers || {};
  const version = headers[headerName];

  // Validate version exists and has correct format
  if (version === undefined) {
    return {
      success: false,
      error: VersionDetectionError.fieldMissing(
        `headers.${headerName}`,
        kafkaEvent.eventId,
        kafkaEvent.type
      ),
    };
  }

  // Handle both string and Buffer header values (Kafka can use either)
  const versionStr = Buffer.isBuffer(version) ? version.toString('utf8') : String(version);

  if (!isValidVersion(versionStr)) {
    return {
      success: false,
      error: VersionDetectionError.invalidFormat(
        versionStr,
        kafkaEvent.eventId,
        kafkaEvent.type
      ),
    };
  }

  return {
    success: true,
    version: versionStr,
    strategy: 'header',
  };
}

/**
 * Detects version by analyzing the structure of the payload.
 * Uses a set of structure checks and a mapping of structures to versions.
 *
 * @param payload - The event payload to detect version from
 * @param versionMap - Mapping of structure identifiers to versions
 * @param structureChecks - Functions that check if payload matches a specific structure
 * @returns A result object containing the detected version if successful
 */
export function detectStructureVersion(
  payload: unknown,
  versionMap: Record<string, EventVersion>,
  structureChecks: Array<(payload: unknown) => boolean>
): VersionDetectionResult {
  // Ensure payload is an object
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      error: new VersionDetectionError('Payload is not an object'),
    };
  }

  // Apply each structure check
  for (let i = 0; i < structureChecks.length; i++) {
    const check = structureChecks[i];
    const structureId = String(i);

    if (check(payload) && versionMap[structureId]) {
      return {
        success: true,
        version: versionMap[structureId],
        strategy: 'structure',
      };
    }
  }

  return {
    success: false,
    error: new VersionDetectionError('No matching structure found for payload'),
  };
}

/**
 * Creates a set of default detection strategies based on configuration.
 *
 * @returns An array of detection strategies in order of precedence
 */
export function getDefaultStrategies(): VersionDetectionStrategy[] {
  const strategies: VersionDetectionStrategy[] = [];

  // Add strategies based on default configuration
  for (const strategyType of DEFAULT_VERSION_CONFIG.DEFAULT_DETECTION_STRATEGIES) {
    switch (strategyType) {
      case 'explicit':
        strategies.push({
          type: 'explicit',
          field: VERSION_CONSTANTS.VERSION_FIELD,
        });
        break;
      case 'header':
        strategies.push({
          type: 'header',
          headerName: VERSION_CONSTANTS.VERSION_HEADER,
        });
        break;
      case 'structure':
        // This is a placeholder - actual structure checks would be application-specific
        // and should be provided by the consumer
        strategies.push({
          type: 'structure',
          versionMap: { '0': VERSION_CONSTANTS.DEFAULT_VERSION },
          structureChecks: [() => false], // Default to not matching any structure
        });
        break;
      case 'fallback':
        strategies.push({
          type: 'fallback',
          defaultVersion: VERSION_CONSTANTS.DEFAULT_VERSION,
        });
        break;
    }
  }

  return strategies;
}

/**
 * Creates a structure check function that verifies if a payload has all required fields
 * and none of the excluded fields.
 *
 * @param requiredFields - Fields that must exist in the payload
 * @param excludedFields - Fields that must not exist in the payload
 * @returns A function that checks if a payload matches the criteria
 */
export function createStructureCheck(
  requiredFields: string[],
  excludedFields: string[] = []
): (payload: unknown) => boolean {
  return (payload: unknown): boolean => {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    // Check required fields
    for (const field of requiredFields) {
      if (extractNestedProperty(payload, field) === undefined) {
        return false;
      }
    }

    // Check excluded fields
    for (const field of excludedFields) {
      if (extractNestedProperty(payload, field) !== undefined) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Creates a detection configuration with custom strategies.
 *
 * @param strategies - Array of detection strategies in order of precedence
 * @param options - Additional configuration options
 * @returns Complete detection configuration
 */
export function createDetectionConfig(
  strategies: VersionDetectionStrategy[],
  options?: Partial<Omit<VersionDetectionOptions, 'strategies'>>
): VersionDetectionOptions {
  return {
    strategies,
    throwOnFailure: options?.throwOnFailure ?? DEFAULT_VERSION_CONFIG.THROW_ON_VERSION_DETECTION_FAILURE,
    defaultVersion: options?.defaultVersion || VERSION_CONSTANTS.DEFAULT_VERSION,
  };
}

/**
 * Extracts a property from an object using dot notation for nested properties.
 *
 * @param obj - The object to extract from
 * @param path - The property path (e.g., 'user.address.city')
 * @returns The property value or undefined if not found
 */
function extractNestedProperty(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const parts = path.split('.');
  let current: any = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}