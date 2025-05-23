/**
 * @file version-detector.ts
 * @description Provides utilities to detect the version of an event payload from different sources.
 * 
 * This module implements multiple version detection strategies including explicit field detection,
 * structure-based detection, header-based detection, and custom detection functions. It supports
 * a fallback chain to handle different versioning approaches across the application, ensuring
 * backward compatibility while allowing schema evolution.
 */

import { VERSION_FIELD_NAMES, VERSION_FORMAT_REGEX, VERSION_HEADER_NAMES, DEFAULT_VERSION_DETECTOR_CONFIG, DEFAULT_DETECTION_CONFIDENCE_THRESHOLD, LATEST_VERSION } from './constants';
import { VersionDetectionError } from './errors';
import { VersionDetectionResult, VersionDetectionStrategy, VersionDetectionStrategyType, VersionDetectorConfig, ExplicitVersionStrategy, HeaderBasedStrategy, StructureBasedStrategy, CustomStrategy } from './types';
import { isVersionedEvent } from './types';
import { JourneyType } from '@austa/errors';

/**
 * Class responsible for detecting the version of an event payload using various strategies.
 * It supports multiple detection methods and a fallback chain for reliable version detection.
 */
export class VersionDetector {
  private readonly config: VersionDetectorConfig;
  private readonly strategies: VersionDetectionStrategy[];

  /**
   * Creates a new VersionDetector instance
   * 
   * @param config - Configuration options for the detector
   */
  constructor(config: Partial<VersionDetectorConfig> = {}) {
    this.config = {
      ...DEFAULT_VERSION_DETECTOR_CONFIG,
      ...config,
    };

    this.strategies = this.initializeStrategies(this.config.strategies);
  }

  /**
   * Initializes the detection strategies based on the provided configuration
   * 
   * @param strategyConfigs - Array of strategy configurations
   * @returns Array of initialized detection strategies
   */
  private initializeStrategies(strategyConfigs: VersionDetectionStrategyType[]): VersionDetectionStrategy[] {
    return strategyConfigs.map(strategyConfig => {
      switch (strategyConfig.type) {
        case 'explicit':
          return this.createExplicitFieldStrategy(strategyConfig);
        case 'structure':
          return this.createStructureBasedStrategy(strategyConfig);
        case 'header':
          return this.createHeaderBasedStrategy(strategyConfig);
        case 'custom':
          return this.createCustomStrategy(strategyConfig);
        default:
          throw new Error(`Unsupported version detection strategy type: ${(strategyConfig as any).type}`);
      }
    });
  }

  /**
   * Creates an explicit field detection strategy
   * 
   * @param config - Strategy configuration
   * @returns Initialized strategy
   */
  private createExplicitFieldStrategy(config: ExplicitVersionStrategy): VersionDetectionStrategy {
    return {
      type: 'explicit',
      detect: (event: unknown): string | null => {
        if (!event || typeof event !== 'object') {
          return null;
        }

        // If a specific field is provided in the config, check that field first
        if (config.field && config.field in (event as Record<string, any>)) {
          const version = (event as Record<string, any>)[config.field];
          if (typeof version === 'string' && this.isValidVersionFormat(version)) {
            return version;
          }
        }

        // Otherwise, try common version field names
        for (const field of VERSION_FIELD_NAMES) {
          if (field in (event as Record<string, any>)) {
            const version = (event as Record<string, any>)[field];
            if (typeof version === 'string' && this.isValidVersionFormat(version)) {
              return version;
            }
          }
        }

        return null;
      }
    };
  }

  /**
   * Creates a structure-based detection strategy
   * 
   * @param config - Strategy configuration
   * @returns Initialized strategy
   */
  private createStructureBasedStrategy(config: StructureBasedStrategy): VersionDetectionStrategy {
    return {
      type: 'structure',
      detect: (event: unknown): string | null => {
        if (!event || typeof event !== 'object') {
          return null;
        }

        // Check each version's structure matcher function
        for (const [version, matcher] of Object.entries(config.versionMap)) {
          if (matcher(event)) {
            return version;
          }
        }

        return null;
      }
    };
  }

  /**
   * Creates a header-based detection strategy
   * 
   * @param config - Strategy configuration
   * @returns Initialized strategy
   */
  private createHeaderBasedStrategy(config: HeaderBasedStrategy): VersionDetectionStrategy {
    return {
      type: 'header',
      detect: (event: unknown): string | null => {
        if (!event || typeof event !== 'object') {
          return null;
        }

        // Check for headers or metadata in the event
        const eventObj = event as Record<string, any>;
        const headers = eventObj.headers || eventObj.metadata?.headers || eventObj.meta?.headers;

        if (!headers || typeof headers !== 'object') {
          return null;
        }

        // If a specific header field is provided in the config, check that field first
        if (config.headerField && config.headerField in headers) {
          const version = headers[config.headerField];
          if (typeof version === 'string' && this.isValidVersionFormat(version)) {
            return version;
          }
        }

        // Otherwise, try common header field names
        for (const field of VERSION_HEADER_NAMES) {
          if (field in headers) {
            const version = headers[field];
            if (typeof version === 'string' && this.isValidVersionFormat(version)) {
              return version;
            }
          }
        }

        return null;
      }
    };
  }

  /**
   * Creates a custom detection strategy
   * 
   * @param config - Strategy configuration
   * @returns Initialized strategy
   */
  private createCustomStrategy(config: CustomStrategy): VersionDetectionStrategy {
    return {
      type: 'custom',
      detect: (event: unknown): string | null => {
        try {
          const version = config.detector(event);
          if (version !== null && !this.isValidVersionFormat(version)) {
            return null;
          }
          return version;
        } catch (error) {
          // If the custom detector throws an error, log it and return null
          console.warn('Custom version detector failed:', error);
          return null;
        }
      }
    };
  }

  /**
   * Validates if a string follows the semantic version format (major.minor.patch)
   * 
   * @param version - Version string to validate
   * @returns True if the version format is valid, false otherwise
   */
  private isValidVersionFormat(version: string): boolean {
    return VERSION_FORMAT_REGEX.test(version);
  }

  /**
   * Detects the version of an event using configured strategies
   * 
   * @param event - The event to detect the version for
   * @param journey - Optional journey type for error context
   * @returns Version detection result
   * @throws VersionDetectionError if throwOnUndetected is true and no version is detected
   */
  public detect(event: unknown, journey?: JourneyType): VersionDetectionResult {
    // If the event is already a versioned event with a valid version, return it directly
    if (isVersionedEvent(event) && this.isValidVersionFormat(event.version)) {
      return {
        detected: true,
        version: event.version,
        strategy: 'explicit',
        confidence: 1.0,
      };
    }

    // Try each strategy in order until one succeeds
    for (const strategy of this.strategies) {
      try {
        const version = strategy.detect(event);
        if (version !== null) {
          return {
            detected: true,
            version,
            strategy: strategy.type,
            confidence: 1.0, // Full confidence for exact matches
          };
        }
      } catch (error) {
        // If a strategy throws an error, log it and continue with the next strategy
        console.warn(`Version detection strategy ${strategy.type} failed:`, error);
      }
    }

    // If no version was detected but we have a default version, use it
    if (this.config.defaultVersion) {
      return {
        detected: false,
        version: this.config.defaultVersion,
        confidence: 0.5, // Lower confidence for default version
      };
    }

    // If throwOnUndetected is true, throw an error
    if (this.config.throwOnUndetected) {
      const eventId = this.extractEventId(event);
      throw new VersionDetectionError(
        `Failed to detect version for event: ${eventId || 'unknown'}`,
        { event, strategies: this.strategies.map(s => s.type) },
        journey
      );
    }

    // Otherwise, return null version
    return {
      detected: false,
      version: null,
      confidence: 0,
    };
  }

  /**
   * Attempts to extract an event ID from an event for error reporting
   * 
   * @param event - The event to extract the ID from
   * @returns The event ID if found, undefined otherwise
   */
  private extractEventId(event: unknown): string | undefined {
    if (!event || typeof event !== 'object') {
      return undefined;
    }

    const eventObj = event as Record<string, any>;
    return eventObj.eventId || eventObj.id || eventObj.uuid || undefined;
  }

  /**
   * Creates a new VersionDetector with default configuration
   * 
   * @returns A new VersionDetector instance
   */
  public static createDefault(): VersionDetector {
    return new VersionDetector();
  }

  /**
   * Creates a new VersionDetector with only explicit field detection
   * 
   * @param field - The field name to check for version information
   * @returns A new VersionDetector instance
   */
  public static createExplicitFieldDetector(field = 'version'): VersionDetector {
    return new VersionDetector({
      strategies: [
        {
          type: 'explicit',
          field,
        },
      ],
      defaultVersion: LATEST_VERSION,
      throwOnUndetected: false,
    });
  }

  /**
   * Creates a new VersionDetector with only header-based detection
   * 
   * @param headerField - The header field name to check for version information
   * @returns A new VersionDetector instance
   */
  public static createHeaderDetector(headerField = 'x-event-version'): VersionDetector {
    return new VersionDetector({
      strategies: [
        {
          type: 'header',
          headerField,
        },
      ],
      defaultVersion: LATEST_VERSION,
      throwOnUndetected: false,
    });
  }

  /**
   * Creates a new VersionDetector with a custom detection function
   * 
   * @param detector - Custom function to detect the version
   * @returns A new VersionDetector instance
   */
  public static createCustomDetector(
    detector: (event: unknown) => string | null
  ): VersionDetector {
    return new VersionDetector({
      strategies: [
        {
          type: 'custom',
          detector,
        },
      ],
      defaultVersion: LATEST_VERSION,
      throwOnUndetected: false,
    });
  }

  /**
   * Creates a comprehensive VersionDetector with all available strategies
   * 
   * @param versionMap - Map of versions to structure matcher functions for structure-based detection
   * @returns A new VersionDetector instance
   */
  public static createComprehensiveDetector(
    versionMap: Record<string, (event: unknown) => boolean> = {}
  ): VersionDetector {
    return new VersionDetector({
      strategies: [
        {
          type: 'explicit',
          field: 'version',
        },
        {
          type: 'header',
          headerField: 'x-event-version',
        },
        {
          type: 'structure',
          versionMap,
        },
      ],
      defaultVersion: LATEST_VERSION,
      throwOnUndetected: true,
    });
  }
}

/**
 * Helper function to detect the version of an event using default settings
 * 
 * @param event - The event to detect the version for
 * @param journey - Optional journey type for error context
 * @returns The detected version or the default version
 * @throws VersionDetectionError if no version is detected and throwOnUndetected is true
 */
export function detectEventVersion(event: unknown, journey?: JourneyType): string {
  const detector = VersionDetector.createDefault();
  const result = detector.detect(event, journey);
  
  if (!result.detected && result.version === null) {
    throw new VersionDetectionError(
      `Failed to detect version for event`,
      { event },
      journey
    );
  }
  
  return result.version as string;
}

/**
 * Helper function to check if an event has a specific version
 * 
 * @param event - The event to check
 * @param expectedVersion - The expected version
 * @returns True if the event has the expected version, false otherwise
 */
export function hasVersion(event: unknown, expectedVersion: string): boolean {
  try {
    const detector = VersionDetector.createDefault();
    const result = detector.detect(event);
    return result.detected && result.version === expectedVersion;
  } catch (error) {
    return false;
  }
}

/**
 * Helper function to ensure an event has a version field
 * If the event doesn't have a version, adds the specified version
 * 
 * @param event - The event to ensure has a version
 * @param defaultVersion - The default version to use if none is detected
 * @returns The event with a version field
 */
export function ensureEventVersion<T extends Record<string, any>>(
  event: T,
  defaultVersion = LATEST_VERSION
): T & { version: string } {
  if (!event) {
    throw new Error('Cannot ensure version for null or undefined event');
  }

  // If the event already has a valid version, return it as is
  if ('version' in event && typeof event.version === 'string' && VERSION_FORMAT_REGEX.test(event.version)) {
    return event as T & { version: string };
  }

  // Try to detect the version
  try {
    const detector = VersionDetector.createDefault();
    const result = detector.detect(event);
    
    if (result.detected && result.version) {
      return { ...event, version: result.version } as T & { version: string };
    }
  } catch (error) {
    // If detection fails, use the default version
  }

  // Add the default version
  return { ...event, version: defaultVersion } as T & { version: string };
}