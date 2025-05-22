/**
 * @file Unit tests for versioning constants
 * 
 * These tests verify that all required constants are properly defined with the correct values.
 * Tests version identifiers, configuration defaults, and error message templates to ensure
 * consistency across the system.
 */

import { describe, expect, it } from '@jest/globals';
import * as constants from '../../../src/versioning/constants';
import { CompatibilityCheckerConfig, MigrationRegistryConfig, SchemaValidationConfig, TransformOptions, VersionDetectorConfig } from '../../../src/versioning/types';

describe('Versioning Constants', () => {
  describe('Version Identifiers', () => {
    it('should define LATEST_VERSION with correct format', () => {
      expect(constants.LATEST_VERSION).toBeDefined();
      expect(typeof constants.LATEST_VERSION).toBe('string');
      expect(constants.LATEST_VERSION).toMatch(constants.VERSION_FORMAT_REGEX);
    });

    it('should define MINIMUM_SUPPORTED_VERSION with correct format', () => {
      expect(constants.MINIMUM_SUPPORTED_VERSION).toBeDefined();
      expect(typeof constants.MINIMUM_SUPPORTED_VERSION).toBe('string');
      expect(constants.MINIMUM_SUPPORTED_VERSION).toMatch(constants.VERSION_FORMAT_REGEX);
    });

    it('should define SUPPORTED_VERSIONS as an array of valid versions', () => {
      expect(constants.SUPPORTED_VERSIONS).toBeDefined();
      expect(Array.isArray(constants.SUPPORTED_VERSIONS)).toBe(true);
      expect(constants.SUPPORTED_VERSIONS.length).toBeGreaterThan(0);
      
      // All versions should match the version format regex
      constants.SUPPORTED_VERSIONS.forEach(version => {
        expect(version).toMatch(constants.VERSION_FORMAT_REGEX);
      });

      // Array should include both MINIMUM_SUPPORTED_VERSION and LATEST_VERSION
      expect(constants.SUPPORTED_VERSIONS).toContain(constants.MINIMUM_SUPPORTED_VERSION);
      expect(constants.SUPPORTED_VERSIONS).toContain(constants.LATEST_VERSION);

      // Array should be in ascending order
      const sortedVersions = [...constants.SUPPORTED_VERSIONS].sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
        
        if (aMajor !== bMajor) return aMajor - bMajor;
        if (aMinor !== bMinor) return aMinor - bMinor;
        return aPatch - bPatch;
      });
      
      expect(constants.SUPPORTED_VERSIONS).toEqual(sortedVersions);
    });

    it('should define VERSION_FORMAT_REGEX that validates semantic versions', () => {
      expect(constants.VERSION_FORMAT_REGEX).toBeDefined();
      expect(constants.VERSION_FORMAT_REGEX).toBeInstanceOf(RegExp);
      
      // Should match valid semantic versions
      expect('1.0.0').toMatch(constants.VERSION_FORMAT_REGEX);
      expect('0.1.0').toMatch(constants.VERSION_FORMAT_REGEX);
      expect('0.0.1').toMatch(constants.VERSION_FORMAT_REGEX);
      expect('10.20.30').toMatch(constants.VERSION_FORMAT_REGEX);
      
      // Should not match invalid formats
      expect('1.0').not.toMatch(constants.VERSION_FORMAT_REGEX);
      expect('1').not.toMatch(constants.VERSION_FORMAT_REGEX);
      expect('1.0.0-alpha').not.toMatch(constants.VERSION_FORMAT_REGEX);
      expect('v1.0.0').not.toMatch(constants.VERSION_FORMAT_REGEX);
      expect('1.0.0.0').not.toMatch(constants.VERSION_FORMAT_REGEX);
      expect('a.b.c').not.toMatch(constants.VERSION_FORMAT_REGEX);
    });
  });

  describe('Error Templates', () => {
    it('should define ERROR_TEMPLATES with all required error messages', () => {
      expect(constants.ERROR_TEMPLATES).toBeDefined();
      expect(typeof constants.ERROR_TEMPLATES).toBe('object');
      
      // Check for required error templates
      const requiredTemplates = [
        'INVALID_VERSION_FORMAT',
        'VERSION_NOT_SUPPORTED',
        'VERSION_TOO_OLD',
        'VERSION_DETECTION_FAILED',
        'NO_MIGRATION_PATH',
        'INCOMPATIBLE_VERSIONS',
        'DOWNGRADE_NOT_ALLOWED',
        'TRANSFORMATION_FAILED',
        'VALIDATION_FAILED'
      ];
      
      requiredTemplates.forEach(template => {
        expect(constants.ERROR_TEMPLATES[template]).toBeDefined();
        expect(typeof constants.ERROR_TEMPLATES[template]).toBe('string');
      });
    });

    it('should have placeholders in error templates', () => {
      // Each template should have placeholders in {placeholder} format
      Object.values(constants.ERROR_TEMPLATES).forEach(template => {
        expect(template).toMatch(/\{[a-zA-Z0-9]+\}/);
      });
      
      // Check specific placeholders in key templates
      expect(constants.ERROR_TEMPLATES.INVALID_VERSION_FORMAT).toContain('{version}');
      expect(constants.ERROR_TEMPLATES.INVALID_VERSION_FORMAT).toContain('{expectedFormat}');
      
      expect(constants.ERROR_TEMPLATES.VERSION_NOT_SUPPORTED).toContain('{version}');
      expect(constants.ERROR_TEMPLATES.VERSION_NOT_SUPPORTED).toContain('{supportedVersions}');
      
      expect(constants.ERROR_TEMPLATES.VERSION_TOO_OLD).toContain('{version}');
      expect(constants.ERROR_TEMPLATES.VERSION_TOO_OLD).toContain('{minVersion}');
      
      expect(constants.ERROR_TEMPLATES.NO_MIGRATION_PATH).toContain('{sourceVersion}');
      expect(constants.ERROR_TEMPLATES.NO_MIGRATION_PATH).toContain('{targetVersion}');
      expect(constants.ERROR_TEMPLATES.NO_MIGRATION_PATH).toContain('{eventType}');
    });
  });

  describe('Default Configurations', () => {
    it('should define DEFAULT_VERSION_DETECTOR_CONFIG with required properties', () => {
      expect(constants.DEFAULT_VERSION_DETECTOR_CONFIG).toBeDefined();
      
      const config: VersionDetectorConfig = constants.DEFAULT_VERSION_DETECTOR_CONFIG;
      
      // Check required properties
      expect(config.strategies).toBeDefined();
      expect(Array.isArray(config.strategies)).toBe(true);
      expect(config.strategies.length).toBeGreaterThan(0);
      
      expect(config.defaultVersion).toBeDefined();
      expect(config.defaultVersion).toBe(constants.LATEST_VERSION);
      
      expect(typeof config.throwOnUndetected).toBe('boolean');
    });

    it('should define DEFAULT_COMPATIBILITY_CHECKER_CONFIG with required properties', () => {
      expect(constants.DEFAULT_COMPATIBILITY_CHECKER_CONFIG).toBeDefined();
      
      const config: CompatibilityCheckerConfig = constants.DEFAULT_COMPATIBILITY_CHECKER_CONFIG;
      
      // Check required properties
      expect(typeof config.strict).toBe('boolean');
      expect(typeof config.allowMajorUpgrade).toBe('boolean');
      expect(typeof config.allowDowngrade).toBe('boolean');
    });

    it('should define DEFAULT_SCHEMA_VALIDATION_CONFIG with required properties', () => {
      expect(constants.DEFAULT_SCHEMA_VALIDATION_CONFIG).toBeDefined();
      
      const config: SchemaValidationConfig = constants.DEFAULT_SCHEMA_VALIDATION_CONFIG;
      
      // Check required properties
      expect(typeof config.strict).toBe('boolean');
      expect(typeof config.throwOnInvalid).toBe('boolean');
    });

    it('should define DEFAULT_MIGRATION_REGISTRY_CONFIG with required properties', () => {
      expect(constants.DEFAULT_MIGRATION_REGISTRY_CONFIG).toBeDefined();
      
      const config: MigrationRegistryConfig = constants.DEFAULT_MIGRATION_REGISTRY_CONFIG;
      
      // Check required properties
      expect(typeof config.strict).toBe('boolean');
      expect(typeof config.validateResults).toBe('boolean');
      expect(typeof config.allowDowngrade).toBe('boolean');
    });

    it('should define DEFAULT_TRANSFORM_OPTIONS with required properties', () => {
      expect(constants.DEFAULT_TRANSFORM_OPTIONS).toBeDefined();
      
      const options: TransformOptions = constants.DEFAULT_TRANSFORM_OPTIONS;
      
      // Check required properties
      expect(options.direction).toBeDefined();
      expect(options.direction).toBe('upgrade');
      expect(typeof options.validateResult).toBe('boolean');
      expect(typeof options.strict).toBe('boolean');
    });
  });

  describe('Other Constants', () => {
    it('should define PRESERVED_FIELDS as an array of strings', () => {
      expect(constants.PRESERVED_FIELDS).toBeDefined();
      expect(Array.isArray(constants.PRESERVED_FIELDS)).toBe(true);
      expect(constants.PRESERVED_FIELDS.length).toBeGreaterThan(0);
      
      // All fields should be strings
      constants.PRESERVED_FIELDS.forEach(field => {
        expect(typeof field).toBe('string');
      });
      
      // Should include essential fields
      const essentialFields = ['eventId', 'timestamp', 'type', 'metadata'];
      essentialFields.forEach(field => {
        expect(constants.PRESERVED_FIELDS).toContain(field);
      });
    });

    it('should define MAX_TRANSFORMATION_STEPS as a positive number', () => {
      expect(constants.MAX_TRANSFORMATION_STEPS).toBeDefined();
      expect(typeof constants.MAX_TRANSFORMATION_STEPS).toBe('number');
      expect(constants.MAX_TRANSFORMATION_STEPS).toBeGreaterThan(0);
    });

    it('should define DEFAULT_DETECTION_CONFIDENCE_THRESHOLD as a number between 0 and 1', () => {
      expect(constants.DEFAULT_DETECTION_CONFIDENCE_THRESHOLD).toBeDefined();
      expect(typeof constants.DEFAULT_DETECTION_CONFIDENCE_THRESHOLD).toBe('number');
      expect(constants.DEFAULT_DETECTION_CONFIDENCE_THRESHOLD).toBeGreaterThanOrEqual(0);
      expect(constants.DEFAULT_DETECTION_CONFIDENCE_THRESHOLD).toBeLessThanOrEqual(1);
    });

    it('should define VERSION_FIELD_NAMES as an array of strings', () => {
      expect(constants.VERSION_FIELD_NAMES).toBeDefined();
      expect(Array.isArray(constants.VERSION_FIELD_NAMES)).toBe(true);
      expect(constants.VERSION_FIELD_NAMES.length).toBeGreaterThan(0);
      
      // All fields should be strings
      constants.VERSION_FIELD_NAMES.forEach(field => {
        expect(typeof field).toBe('string');
      });
      
      // Should include common version field names
      const commonFields = ['version', 'schemaVersion', 'eventVersion'];
      commonFields.forEach(field => {
        expect(constants.VERSION_FIELD_NAMES).toContain(field);
      });
    });

    it('should define VERSION_HEADER_NAMES as an array of strings', () => {
      expect(constants.VERSION_HEADER_NAMES).toBeDefined();
      expect(Array.isArray(constants.VERSION_HEADER_NAMES)).toBe(true);
      expect(constants.VERSION_HEADER_NAMES.length).toBeGreaterThan(0);
      
      // All headers should be strings
      constants.VERSION_HEADER_NAMES.forEach(header => {
        expect(typeof header).toBe('string');
      });
      
      // Should include common version header names
      const commonHeaders = ['x-event-version', 'x-schema-version', 'x-api-version'];
      commonHeaders.forEach(header => {
        expect(constants.VERSION_HEADER_NAMES).toContain(header);
      });
    });

    it('should define JOURNEY_VERSION_PREFIXES with all journey types', () => {
      expect(constants.JOURNEY_VERSION_PREFIXES).toBeDefined();
      expect(typeof constants.JOURNEY_VERSION_PREFIXES).toBe('object');
      
      // Should include all journey types
      expect(constants.JOURNEY_VERSION_PREFIXES.HEALTH).toBeDefined();
      expect(constants.JOURNEY_VERSION_PREFIXES.CARE).toBeDefined();
      expect(constants.JOURNEY_VERSION_PREFIXES.PLAN).toBeDefined();
      
      // All prefixes should be strings ending with a hyphen
      Object.values(constants.JOURNEY_VERSION_PREFIXES).forEach(prefix => {
        expect(typeof prefix).toBe('string');
        expect(prefix.endsWith('-')).toBe(true);
      });
    });

    it('should define DEFAULT_OPERATION_TIMEOUT as a positive number', () => {
      expect(constants.DEFAULT_OPERATION_TIMEOUT).toBeDefined();
      expect(typeof constants.DEFAULT_OPERATION_TIMEOUT).toBe('number');
      expect(constants.DEFAULT_OPERATION_TIMEOUT).toBeGreaterThan(0);
    });
  });

  describe('Consistency Checks', () => {
    it('should have LATEST_VERSION in SUPPORTED_VERSIONS', () => {
      expect(constants.SUPPORTED_VERSIONS).toContain(constants.LATEST_VERSION);
    });

    it('should have MINIMUM_SUPPORTED_VERSION in SUPPORTED_VERSIONS', () => {
      expect(constants.SUPPORTED_VERSIONS).toContain(constants.MINIMUM_SUPPORTED_VERSION);
    });

    it('should have LATEST_VERSION be the last element in SUPPORTED_VERSIONS', () => {
      expect(constants.SUPPORTED_VERSIONS[constants.SUPPORTED_VERSIONS.length - 1]).toBe(constants.LATEST_VERSION);
    });

    it('should have MINIMUM_SUPPORTED_VERSION be the first element in SUPPORTED_VERSIONS', () => {
      expect(constants.SUPPORTED_VERSIONS[0]).toBe(constants.MINIMUM_SUPPORTED_VERSION);
    });

    it('should have DEFAULT_VERSION_DETECTOR_CONFIG.defaultVersion match LATEST_VERSION', () => {
      expect(constants.DEFAULT_VERSION_DETECTOR_CONFIG.defaultVersion).toBe(constants.LATEST_VERSION);
    });
  });
});