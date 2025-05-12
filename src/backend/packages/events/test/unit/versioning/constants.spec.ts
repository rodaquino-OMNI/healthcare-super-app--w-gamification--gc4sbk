/**
 * Unit tests for versioning constants
 * 
 * These tests verify that all required constants are properly defined with the correct values.
 * Tests version identifiers, configuration defaults, and error message templates to ensure
 * consistency across the system.
 */

import { jest } from '@jest/globals';
import {
  VERSION_CONSTANTS,
  DEFAULT_VERSION_CONFIG,
  VERSION_ERROR_MESSAGES,
  VERSION_COMPARISON,
  SCHEMA_VERSION_CONSTANTS,
  JOURNEY_EVENT_VERSIONS
} from '../../../src/versioning/constants';

describe('Versioning Constants', () => {
  describe('VERSION_CONSTANTS', () => {
    it('should define all required version identifiers', () => {
      // Check that all expected constants are defined
      expect(VERSION_CONSTANTS.LATEST_VERSION).toBeDefined();
      expect(VERSION_CONSTANTS.MINIMUM_SUPPORTED_VERSION).toBeDefined();
      expect(VERSION_CONSTANTS.DEFAULT_VERSION).toBeDefined();
      expect(VERSION_CONSTANTS.VERSION_FORMAT).toBeDefined();
      expect(VERSION_CONSTANTS.VERSION_SEPARATOR).toBeDefined();
      expect(VERSION_CONSTANTS.VERSION_FIELD).toBeDefined();
      expect(VERSION_CONSTANTS.VERSION_HEADER).toBeDefined();
    });

    it('should have correct version values', () => {
      // Verify the version values match the expected format
      expect(VERSION_CONSTANTS.LATEST_VERSION).toBe('1.0.0');
      expect(VERSION_CONSTANTS.MINIMUM_SUPPORTED_VERSION).toBe('1.0.0');
      expect(VERSION_CONSTANTS.DEFAULT_VERSION).toBe('1.0.0');
      expect(VERSION_CONSTANTS.VERSION_SEPARATOR).toBe('.');
      expect(VERSION_CONSTANTS.VERSION_FIELD).toBe('version');
      expect(VERSION_CONSTANTS.VERSION_HEADER).toBe('event-version');
    });

    it('should have a valid version format pattern', () => {
      // Test that the version format regex works correctly
      const { VERSION_FORMAT } = VERSION_CONSTANTS;
      
      // Valid versions
      expect(VERSION_FORMAT.test('1.0.0')).toBe(true);
      expect(VERSION_FORMAT.test('0.1.0')).toBe(true);
      expect(VERSION_FORMAT.test('10.20.30')).toBe(true);
      
      // Invalid versions
      expect(VERSION_FORMAT.test('1.0')).toBe(false);
      expect(VERSION_FORMAT.test('1.0.0.0')).toBe(false);
      expect(VERSION_FORMAT.test('1.0.a')).toBe(false);
      expect(VERSION_FORMAT.test('v1.0.0')).toBe(false);
      expect(VERSION_FORMAT.test('1.0.0-alpha')).toBe(false);
    });

    it('should extract version components correctly', () => {
      // Test that the regex captures the version components correctly
      const { VERSION_FORMAT } = VERSION_CONSTANTS;
      
      const match = '2.3.4'.match(VERSION_FORMAT);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('2'); // major
      expect(match[2]).toBe('3'); // minor
      expect(match[3]).toBe('4'); // patch
    });
  });

  describe('DEFAULT_VERSION_CONFIG', () => {
    it('should define all required configuration options', () => {
      // Check that all expected configuration options are defined
      expect(DEFAULT_VERSION_CONFIG.AUTO_UPGRADE_EVENTS).toBeDefined();
      expect(DEFAULT_VERSION_CONFIG.ALLOW_UNSUPPORTED_VERSIONS).toBeDefined();
      expect(DEFAULT_VERSION_CONFIG.VALIDATE_TRANSFORMED_EVENTS).toBeDefined();
      expect(DEFAULT_VERSION_CONFIG.THROW_ON_VERSION_DETECTION_FAILURE).toBeDefined();
      expect(DEFAULT_VERSION_CONFIG.PRESERVE_METADATA_ON_TRANSFORM).toBeDefined();
      expect(DEFAULT_VERSION_CONFIG.DEFAULT_DETECTION_STRATEGIES).toBeDefined();
      expect(DEFAULT_VERSION_CONFIG.MAX_TRANSFORMATION_STEPS).toBeDefined();
      expect(DEFAULT_VERSION_CONFIG.USE_AUTO_FIELD_MAPPING).toBeDefined();
    });

    it('should have correct default values', () => {
      // Verify the default values match the expected configuration
      expect(DEFAULT_VERSION_CONFIG.AUTO_UPGRADE_EVENTS).toBe(true);
      expect(DEFAULT_VERSION_CONFIG.ALLOW_UNSUPPORTED_VERSIONS).toBe(false);
      expect(DEFAULT_VERSION_CONFIG.VALIDATE_TRANSFORMED_EVENTS).toBe(true);
      expect(DEFAULT_VERSION_CONFIG.THROW_ON_VERSION_DETECTION_FAILURE).toBe(true);
      expect(DEFAULT_VERSION_CONFIG.PRESERVE_METADATA_ON_TRANSFORM).toBe(true);
      expect(DEFAULT_VERSION_CONFIG.MAX_TRANSFORMATION_STEPS).toBe(5);
      expect(DEFAULT_VERSION_CONFIG.USE_AUTO_FIELD_MAPPING).toBe(true);
    });

    it('should have correct detection strategies', () => {
      // Verify the detection strategies array
      const { DEFAULT_DETECTION_STRATEGIES } = DEFAULT_VERSION_CONFIG;
      
      expect(Array.isArray(DEFAULT_DETECTION_STRATEGIES)).toBe(true);
      expect(DEFAULT_DETECTION_STRATEGIES.length).toBe(4);
      expect(DEFAULT_DETECTION_STRATEGIES).toContain('explicit');
      expect(DEFAULT_DETECTION_STRATEGIES).toContain('header');
      expect(DEFAULT_DETECTION_STRATEGIES).toContain('structure');
      expect(DEFAULT_DETECTION_STRATEGIES).toContain('fallback');
      
      // Check order of strategies (precedence)
      expect(DEFAULT_DETECTION_STRATEGIES[0]).toBe('explicit');
      expect(DEFAULT_DETECTION_STRATEGIES[DEFAULT_DETECTION_STRATEGIES.length - 1]).toBe('fallback');
    });
  });

  describe('VERSION_ERROR_MESSAGES', () => {
    it('should define all required error message templates', () => {
      // Check that all expected error message templates are defined
      expect(VERSION_ERROR_MESSAGES.INVALID_VERSION_FORMAT).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.VERSION_NOT_DETECTED).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.UNSUPPORTED_VERSION).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.VERSION_TOO_NEW).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.NO_MIGRATION_PATH).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.MIGRATION_FAILED).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.TRANSFORMATION_FAILED).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.VALIDATION_FAILED).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.MAX_TRANSFORMATION_STEPS_EXCEEDED).toBeDefined();
      expect(VERSION_ERROR_MESSAGES.INCOMPATIBLE_VERSIONS).toBeDefined();
    });

    it('should have correct template format with placeholders', () => {
      // Verify that error messages contain expected placeholders
      expect(VERSION_ERROR_MESSAGES.INVALID_VERSION_FORMAT).toContain('{version}');
      expect(VERSION_ERROR_MESSAGES.VERSION_NOT_DETECTED).toContain('{eventId}');
      expect(VERSION_ERROR_MESSAGES.UNSUPPORTED_VERSION).toContain('{version}');
      expect(VERSION_ERROR_MESSAGES.UNSUPPORTED_VERSION).toContain('{minVersion}');
      expect(VERSION_ERROR_MESSAGES.VERSION_TOO_NEW).toContain('{version}');
      expect(VERSION_ERROR_MESSAGES.VERSION_TOO_NEW).toContain('{latestVersion}');
      expect(VERSION_ERROR_MESSAGES.NO_MIGRATION_PATH).toContain('{sourceVersion}');
      expect(VERSION_ERROR_MESSAGES.NO_MIGRATION_PATH).toContain('{targetVersion}');
      expect(VERSION_ERROR_MESSAGES.MIGRATION_FAILED).toContain('{sourceVersion}');
      expect(VERSION_ERROR_MESSAGES.MIGRATION_FAILED).toContain('{targetVersion}');
      expect(VERSION_ERROR_MESSAGES.MIGRATION_FAILED).toContain('{reason}');
      expect(VERSION_ERROR_MESSAGES.TRANSFORMATION_FAILED).toContain('{reason}');
      expect(VERSION_ERROR_MESSAGES.VALIDATION_FAILED).toContain('{errors}');
      expect(VERSION_ERROR_MESSAGES.MAX_TRANSFORMATION_STEPS_EXCEEDED).toContain('{steps}');
      expect(VERSION_ERROR_MESSAGES.INCOMPATIBLE_VERSIONS).toContain('{sourceVersion}');
      expect(VERSION_ERROR_MESSAGES.INCOMPATIBLE_VERSIONS).toContain('{targetVersion}');
    });

    it('should have descriptive error messages', () => {
      // Verify that error messages are descriptive and clear
      Object.values(VERSION_ERROR_MESSAGES).forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(10); // Arbitrary minimum length for a descriptive message
      });
    });
  });

  describe('VERSION_COMPARISON', () => {
    it('should define all required comparison constants', () => {
      // Check that all expected comparison constants are defined
      expect(VERSION_COMPARISON.EQUAL).toBeDefined();
      expect(VERSION_COMPARISON.GREATER).toBeDefined();
      expect(VERSION_COMPARISON.LESS).toBeDefined();
      expect(VERSION_COMPARISON.COMPATIBILITY_MODES).toBeDefined();
    });

    it('should have correct comparison values', () => {
      // Verify the comparison values
      expect(VERSION_COMPARISON.EQUAL).toBe(0);
      expect(VERSION_COMPARISON.GREATER).toBe(1);
      expect(VERSION_COMPARISON.LESS).toBe(-1);
    });

    it('should define all required compatibility modes', () => {
      // Check that all expected compatibility modes are defined
      const { COMPATIBILITY_MODES } = VERSION_COMPARISON;
      
      expect(COMPATIBILITY_MODES.STRICT).toBeDefined();
      expect(COMPATIBILITY_MODES.STANDARD).toBeDefined();
      expect(COMPATIBILITY_MODES.RELAXED).toBeDefined();
      
      // Verify the mode values
      expect(COMPATIBILITY_MODES.STRICT).toBe('strict');
      expect(COMPATIBILITY_MODES.STANDARD).toBe('standard');
      expect(COMPATIBILITY_MODES.RELAXED).toBe('relaxed');
    });
  });

  describe('SCHEMA_VERSION_CONSTANTS', () => {
    it('should define all required schema versioning constants', () => {
      // Check that all expected schema versioning constants are defined
      expect(SCHEMA_VERSION_CONSTANTS.REGISTRY_KEY_FORMAT).toBeDefined();
      expect(SCHEMA_VERSION_CONSTANTS.DEFAULT_NAMESPACE).toBeDefined();
      expect(SCHEMA_VERSION_CONSTANTS.COMPATIBILITY_MODES).toBeDefined();
    });

    it('should have correct schema registry values', () => {
      // Verify the schema registry values
      expect(SCHEMA_VERSION_CONSTANTS.REGISTRY_KEY_FORMAT).toBe('{eventType}@{version}');
      expect(SCHEMA_VERSION_CONSTANTS.DEFAULT_NAMESPACE).toBe('austa.events');
    });

    it('should define all required schema compatibility modes', () => {
      // Check that all expected schema compatibility modes are defined
      const { COMPATIBILITY_MODES } = SCHEMA_VERSION_CONSTANTS;
      
      expect(COMPATIBILITY_MODES.BACKWARD).toBeDefined();
      expect(COMPATIBILITY_MODES.FORWARD).toBeDefined();
      expect(COMPATIBILITY_MODES.FULL).toBeDefined();
      expect(COMPATIBILITY_MODES.NONE).toBeDefined();
      
      // Verify the mode values
      expect(COMPATIBILITY_MODES.BACKWARD).toBe('BACKWARD');
      expect(COMPATIBILITY_MODES.FORWARD).toBe('FORWARD');
      expect(COMPATIBILITY_MODES.FULL).toBe('FULL');
      expect(COMPATIBILITY_MODES.NONE).toBe('NONE');
    });
  });

  describe('JOURNEY_EVENT_VERSIONS', () => {
    it('should define versions for all journeys', () => {
      // Check that all expected journeys have version definitions
      expect(JOURNEY_EVENT_VERSIONS.HEALTH).toBeDefined();
      expect(JOURNEY_EVENT_VERSIONS.CARE).toBeDefined();
      expect(JOURNEY_EVENT_VERSIONS.PLAN).toBeDefined();
      expect(JOURNEY_EVENT_VERSIONS.GAMIFICATION).toBeDefined();
    });

    it('should define latest and minimum supported versions for each journey', () => {
      // Check that each journey has both latest and minimum supported versions
      Object.values(JOURNEY_EVENT_VERSIONS).forEach(journey => {
        expect(journey.LATEST).toBeDefined();
        expect(journey.MINIMUM_SUPPORTED).toBeDefined();
      });
    });

    it('should have valid semantic versions for all journeys', () => {
      // Verify that all journey versions are valid semantic versions
      const { VERSION_FORMAT } = VERSION_CONSTANTS;
      
      Object.values(JOURNEY_EVENT_VERSIONS).forEach(journey => {
        expect(VERSION_FORMAT.test(journey.LATEST)).toBe(true);
        expect(VERSION_FORMAT.test(journey.MINIMUM_SUPPORTED)).toBe(true);
      });
    });

    it('should have consistent initial versions across journeys', () => {
      // All journeys should start with the same version in this initial implementation
      const initialVersion = '1.0.0';
      
      Object.values(JOURNEY_EVENT_VERSIONS).forEach(journey => {
        expect(journey.LATEST).toBe(initialVersion);
        expect(journey.MINIMUM_SUPPORTED).toBe(initialVersion);
      });
    });
  });
});