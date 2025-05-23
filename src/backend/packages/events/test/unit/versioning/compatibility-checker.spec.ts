/**
 * @file compatibility-checker.spec.ts
 * @description Unit tests for the version compatibility checker that verifies semantic versioning
 * principles are correctly applied when determining compatibility between different event versions.
 */

import {
  parseVersion,
  compareVersions,
  isVersionSupported,
  meetsMinimumVersion,
  checkVersionCompatibility,
  isEventCompatibleWithVersion,
  validateEventVersionForHandler,
  compareSchemas,
  requiresMajorVersionBump,
  requiresMinorVersionBump,
  suggestNextVersion,
  isBackwardCompatibleChange,
  checkEventCompatibilityWithHandlers,
  findHighestCompatibleVersion,
} from '../../../src/versioning/compatibility-checker';

import { IVersionedEvent } from '../../../src/interfaces';
import { CompatibilityCheckerConfig } from '../../../src/versioning/types';
import { IncompatibleVersionError, VersionDetectionError } from '../../../src/versioning/errors';
import { SUPPORTED_VERSIONS, MINIMUM_SUPPORTED_VERSION } from '../../../src/versioning/constants';

describe('Version Compatibility Checker', () => {
  // Mock events for testing
  const createMockEvent = (version: string, eventId = 'test-event-id', type = 'TEST_EVENT'): IVersionedEvent => ({
    eventId,
    type,
    version,
    timestamp: new Date().toISOString(),
    source: 'test-service',
    payload: { data: 'test-data' },
  });

  // Sample schemas for testing schema comparison
  const baseSchema = {
    id: 'string',
    name: 'string',
    age: 'number',
    active: 'boolean',
    metadata: {
      createdAt: 'string',
      tags: 'array',
    },
  };

  const schemaWithAddedField = {
    ...baseSchema,
    email: 'string', // Added field (non-breaking change)
  };

  const schemaWithRemovedField = {
    ...baseSchema,
  };
  delete schemaWithRemovedField.age; // Removed field (breaking change)

  const schemaWithTypeChange = {
    ...baseSchema,
    active: 'string', // Type changed from boolean to string (breaking change)
  };

  const schemaWithNestedChanges = {
    ...baseSchema,
    metadata: {
      ...baseSchema.metadata,
      updatedAt: 'string', // Added nested field (non-breaking change)
    },
  };

  const schemaWithNestedRemovedField = {
    ...baseSchema,
    metadata: {
      createdAt: 'string',
      // tags removed (breaking change)
    },
  };

  describe('parseVersion', () => {
    it('should correctly parse a valid semantic version', () => {
      const result = parseVersion('1.2.3');
      expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it('should correctly parse versions with single digits', () => {
      const result = parseVersion('1.0.0');
      expect(result).toEqual({ major: 1, minor: 0, patch: 0 });
    });

    it('should correctly parse versions with multiple digits', () => {
      const result = parseVersion('10.20.30');
      expect(result).toEqual({ major: 10, minor: 20, patch: 30 });
    });

    it('should throw an error for invalid version formats', () => {
      expect(() => parseVersion('1.2')).toThrow(VersionDetectionError);
      expect(() => parseVersion('1.2.3.4')).toThrow(VersionDetectionError);
      expect(() => parseVersion('1.2.x')).toThrow(VersionDetectionError);
      expect(() => parseVersion('invalid')).toThrow(VersionDetectionError);
      expect(() => parseVersion('')).toThrow(VersionDetectionError);
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for identical versions', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    });

    it('should return -1 when first version is lower than second', () => {
      // Major version difference
      expect(compareVersions('1.2.3', '2.0.0')).toBe(-1);
      // Minor version difference
      expect(compareVersions('1.2.3', '1.3.0')).toBe(-1);
      // Patch version difference
      expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
    });

    it('should return 1 when first version is higher than second', () => {
      // Major version difference
      expect(compareVersions('2.0.0', '1.2.3')).toBe(1);
      // Minor version difference
      expect(compareVersions('1.3.0', '1.2.3')).toBe(1);
      // Patch version difference
      expect(compareVersions('1.2.4', '1.2.3')).toBe(1);
    });

    it('should prioritize major over minor and patch versions', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
    });

    it('should prioritize minor over patch versions', () => {
      expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
      expect(compareVersions('1.1.9', '1.2.0')).toBe(-1);
    });

    it('should throw an error for invalid version formats', () => {
      expect(() => compareVersions('1.2', '1.2.3')).toThrow(VersionDetectionError);
      expect(() => compareVersions('1.2.3', 'invalid')).toThrow(VersionDetectionError);
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for supported versions', () => {
      // Using the actual SUPPORTED_VERSIONS from constants
      SUPPORTED_VERSIONS.forEach(version => {
        expect(isVersionSupported(version)).toBe(true);
      });
    });

    it('should return false for unsupported versions', () => {
      expect(isVersionSupported('99.99.99')).toBe(false);
      expect(isVersionSupported('0.0.1')).toBe(false);
    });
  });

  describe('meetsMinimumVersion', () => {
    it('should return true for versions equal to or greater than minimum', () => {
      // Equal to minimum
      expect(meetsMinimumVersion(MINIMUM_SUPPORTED_VERSION)).toBe(true);
      
      // Greater than minimum
      const higherVersion = SUPPORTED_VERSIONS.find(
        v => compareVersions(v, MINIMUM_SUPPORTED_VERSION) > 0
      );
      if (higherVersion) {
        expect(meetsMinimumVersion(higherVersion)).toBe(true);
      }
    });

    it('should return false for versions less than minimum', () => {
      // Create a version lower than the minimum
      const minParsed = parseVersion(MINIMUM_SUPPORTED_VERSION);
      const lowerVersion = `${Math.max(0, minParsed.major - 1)}.0.0`;
      
      expect(meetsMinimumVersion(lowerVersion)).toBe(false);
    });

    it('should throw an error for invalid version formats', () => {
      expect(() => meetsMinimumVersion('invalid')).toThrow(VersionDetectionError);
    });
  });

  describe('checkVersionCompatibility', () => {
    it('should return compatible for identical versions', () => {
      const result = checkVersionCompatibility('1.2.3', '1.2.3');
      expect(result.compatible).toBe(true);
    });

    it('should handle older source version with same major version', () => {
      // Minor version difference (backward compatible)
      const result = checkVersionCompatibility('1.1.0', '1.2.0');
      expect(result.compatible).toBe(true);
      
      // Patch version difference (backward compatible)
      const patchResult = checkVersionCompatibility('1.2.1', '1.2.3');
      expect(patchResult.compatible).toBe(true);
    });

    it('should handle older source version with different major version', () => {
      // Major version difference (breaking change)
      const result = checkVersionCompatibility('1.0.0', '2.0.0');
      expect(result.compatible).toBe(false);
      expect(result.breakingChanges).toBeDefined();
      expect(result.breakingChanges?.length).toBeGreaterThan(0);
    });

    it('should handle newer source version based on configuration', () => {
      // Default config (allowDowngrade: false)
      const defaultResult = checkVersionCompatibility('2.0.0', '1.0.0');
      expect(defaultResult.compatible).toBe(false);
      
      // Custom config (allowDowngrade: true)
      const customConfig: CompatibilityCheckerConfig = { allowDowngrade: true };
      const customResult = checkVersionCompatibility('2.0.0', '1.0.0', customConfig);
      expect(customResult.compatible).toBe(false); // Still false because major version change
      
      // Minor version difference with allowDowngrade
      const minorResult = checkVersionCompatibility('1.2.0', '1.1.0', customConfig);
      expect(minorResult.compatible).toBe(true);
    });

    it('should respect strict mode configuration', () => {
      // Non-strict mode (default)
      const nonStrictResult = checkVersionCompatibility('1.2.0', '1.1.0', { allowDowngrade: true });
      expect(nonStrictResult.compatible).toBe(true);
      
      // Strict mode
      const strictResult = checkVersionCompatibility('1.2.0', '1.1.0', { allowDowngrade: true, strict: true });
      expect(strictResult.compatible).toBe(false);
    });
  });

  describe('isEventCompatibleWithVersion', () => {
    it('should return compatible for events with matching versions', () => {
      const event = createMockEvent('1.2.3');
      const result = isEventCompatibleWithVersion(event, '1.2.3');
      expect(result.compatible).toBe(true);
    });

    it('should handle events with older versions correctly', () => {
      const event = createMockEvent('1.1.0');
      
      // Compatible with newer minor version
      const minorResult = isEventCompatibleWithVersion(event, '1.2.0');
      expect(minorResult.compatible).toBe(true);
      
      // Not compatible with newer major version
      const majorResult = isEventCompatibleWithVersion(event, '2.0.0');
      expect(majorResult.compatible).toBe(false);
    });

    it('should handle events with newer versions based on configuration', () => {
      const event = createMockEvent('1.2.0');
      
      // Default config (allowDowngrade: false)
      const defaultResult = isEventCompatibleWithVersion(event, '1.1.0');
      expect(defaultResult.compatible).toBe(false);
      
      // Custom config (allowDowngrade: true)
      const customConfig: CompatibilityCheckerConfig = { allowDowngrade: true };
      const customResult = isEventCompatibleWithVersion(event, '1.1.0', customConfig);
      expect(customResult.compatible).toBe(true);
    });

    it('should throw an error for events without a version', () => {
      const invalidEvent = { ...createMockEvent('1.0.0'), version: undefined } as any;
      expect(() => isEventCompatibleWithVersion(invalidEvent, '1.0.0')).toThrow(VersionDetectionError);
    });
  });

  describe('validateEventVersionForHandler', () => {
    it('should not throw for compatible event versions', () => {
      const event = createMockEvent('1.1.0');
      expect(() => validateEventVersionForHandler(event, '1.2.0')).not.toThrow();
    });

    it('should throw IncompatibleVersionError for incompatible versions', () => {
      const event = createMockEvent('2.0.0');
      expect(() => validateEventVersionForHandler(event, '1.0.0')).toThrow(IncompatibleVersionError);
    });

    it('should respect configuration options', () => {
      const event = createMockEvent('1.2.0');
      
      // Default config (allowDowngrade: false)
      expect(() => validateEventVersionForHandler(event, '1.1.0')).toThrow(IncompatibleVersionError);
      
      // Custom config (allowDowngrade: true)
      const customConfig: CompatibilityCheckerConfig = { allowDowngrade: true };
      expect(() => validateEventVersionForHandler(event, '1.1.0', customConfig)).not.toThrow();
    });
  });

  describe('compareSchemas', () => {
    it('should identify identical schemas as compatible', () => {
      const result = compareSchemas(baseSchema, baseSchema);
      expect(result.compatible).toBe(true);
      expect(result.differences.length).toBe(0);
      expect(result.breakingChanges.length).toBe(0);
    });

    it('should identify added fields as non-breaking changes', () => {
      const result = compareSchemas(baseSchema, schemaWithAddedField);
      expect(result.compatible).toBe(true);
      expect(result.differences.length).toBeGreaterThan(0);
      expect(result.breakingChanges.length).toBe(0);
      
      // Verify the difference is correctly identified
      const addedField = result.differences.find(d => d.path === 'email');
      expect(addedField).toBeDefined();
      expect(addedField?.type).toBe('added');
      expect(addedField?.breaking).toBe(false);
    });

    it('should identify removed fields as breaking changes', () => {
      const result = compareSchemas(baseSchema, schemaWithRemovedField);
      expect(result.compatible).toBe(false);
      expect(result.breakingChanges.length).toBeGreaterThan(0);
      
      // Verify the breaking change is correctly identified
      const removedField = result.breakingChanges.find(d => d.path === 'age');
      expect(removedField).toBeDefined();
      expect(removedField?.type).toBe('removed');
      expect(removedField?.breaking).toBe(true);
    });

    it('should identify type changes as breaking changes', () => {
      const result = compareSchemas(baseSchema, schemaWithTypeChange);
      expect(result.compatible).toBe(false);
      expect(result.breakingChanges.length).toBeGreaterThan(0);
      
      // Verify the breaking change is correctly identified
      const typeChange = result.breakingChanges.find(d => d.path === 'active');
      expect(typeChange).toBeDefined();
      expect(typeChange?.type).toBe('type_changed');
      expect(typeChange?.sourceType).toBe('boolean');
      expect(typeChange?.targetType).toBe('string');
      expect(typeChange?.breaking).toBe(true);
    });

    it('should correctly analyze nested schema changes', () => {
      // Added nested field (non-breaking)
      const addedResult = compareSchemas(baseSchema, schemaWithNestedChanges);
      expect(addedResult.compatible).toBe(true);
      
      // Verify the nested addition is correctly identified
      const addedNestedField = addedResult.differences.find(d => d.path === 'metadata.updatedAt');
      expect(addedNestedField).toBeDefined();
      expect(addedNestedField?.type).toBe('added');
      expect(addedNestedField?.breaking).toBe(false);
      
      // Removed nested field (breaking)
      const removedResult = compareSchemas(baseSchema, schemaWithNestedRemovedField);
      expect(removedResult.compatible).toBe(false);
      
      // Verify the nested removal is correctly identified
      const removedNestedField = removedResult.breakingChanges.find(d => d.path === 'metadata.tags');
      expect(removedNestedField).toBeDefined();
      expect(removedNestedField?.type).toBe('removed');
      expect(removedNestedField?.breaking).toBe(true);
    });
  });

  describe('requiresMajorVersionBump', () => {
    it('should return false for identical schemas', () => {
      expect(requiresMajorVersionBump(baseSchema, baseSchema)).toBe(false);
    });

    it('should return false for non-breaking changes', () => {
      expect(requiresMajorVersionBump(baseSchema, schemaWithAddedField)).toBe(false);
      expect(requiresMajorVersionBump(baseSchema, schemaWithNestedChanges)).toBe(false);
    });

    it('should return true for breaking changes', () => {
      expect(requiresMajorVersionBump(baseSchema, schemaWithRemovedField)).toBe(true);
      expect(requiresMajorVersionBump(baseSchema, schemaWithTypeChange)).toBe(true);
      expect(requiresMajorVersionBump(baseSchema, schemaWithNestedRemovedField)).toBe(true);
    });
  });

  describe('requiresMinorVersionBump', () => {
    it('should return false for identical schemas', () => {
      expect(requiresMinorVersionBump(baseSchema, baseSchema)).toBe(false);
    });

    it('should return true for non-breaking changes', () => {
      expect(requiresMinorVersionBump(baseSchema, schemaWithAddedField)).toBe(true);
      expect(requiresMinorVersionBump(baseSchema, schemaWithNestedChanges)).toBe(true);
    });

    it('should return false for breaking changes (requires major bump instead)', () => {
      expect(requiresMinorVersionBump(baseSchema, schemaWithRemovedField)).toBe(false);
      expect(requiresMinorVersionBump(baseSchema, schemaWithTypeChange)).toBe(false);
      expect(requiresMinorVersionBump(baseSchema, schemaWithNestedRemovedField)).toBe(false);
    });
  });

  describe('suggestNextVersion', () => {
    it('should suggest patch bump for identical schemas', () => {
      expect(suggestNextVersion('1.2.3', baseSchema, baseSchema)).toBe('1.2.4');
    });

    it('should suggest minor bump for non-breaking changes', () => {
      expect(suggestNextVersion('1.2.3', baseSchema, schemaWithAddedField)).toBe('1.3.0');
      expect(suggestNextVersion('1.2.3', baseSchema, schemaWithNestedChanges)).toBe('1.3.0');
    });

    it('should suggest major bump for breaking changes', () => {
      expect(suggestNextVersion('1.2.3', baseSchema, schemaWithRemovedField)).toBe('2.0.0');
      expect(suggestNextVersion('1.2.3', baseSchema, schemaWithTypeChange)).toBe('2.0.0');
      expect(suggestNextVersion('1.2.3', baseSchema, schemaWithNestedRemovedField)).toBe('2.0.0');
    });

    it('should handle different starting versions correctly', () => {
      expect(suggestNextVersion('0.9.5', baseSchema, schemaWithAddedField)).toBe('0.10.0');
      expect(suggestNextVersion('2.0.0', baseSchema, schemaWithRemovedField)).toBe('3.0.0');
    });
  });

  describe('isBackwardCompatibleChange', () => {
    it('should return true for identical versions', () => {
      expect(isBackwardCompatibleChange('1.2.3', '1.2.3')).toBe(true);
    });

    it('should return true for minor and patch version increases', () => {
      // Minor version increase
      expect(isBackwardCompatibleChange('1.2.3', '1.3.0')).toBe(true);
      
      // Patch version increase
      expect(isBackwardCompatibleChange('1.2.3', '1.2.4')).toBe(true);
    });

    it('should return false for major version increases', () => {
      expect(isBackwardCompatibleChange('1.2.3', '2.0.0')).toBe(false);
    });

    it('should return true for version decreases with same major version', () => {
      // Minor version decrease
      expect(isBackwardCompatibleChange('1.3.0', '1.2.0')).toBe(true);
      
      // Patch version decrease
      expect(isBackwardCompatibleChange('1.2.3', '1.2.2')).toBe(true);
    });

    it('should return false for major version decreases', () => {
      expect(isBackwardCompatibleChange('2.0.0', '1.0.0')).toBe(false);
    });
  });

  describe('checkEventCompatibilityWithHandlers', () => {
    it('should return compatibility results for all handler versions', () => {
      const event = createMockEvent('1.2.0');
      const handlerVersions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '2.0.0'];
      
      const results = checkEventCompatibilityWithHandlers(event, handlerVersions);
      
      expect(results.size).toBe(handlerVersions.length);
      
      // Event should be compatible with same or older minor versions
      expect(results.get('1.2.0')?.compatible).toBe(true);
      expect(results.get('1.3.0')?.compatible).toBe(true);
      
      // Event should not be compatible with newer major versions
      expect(results.get('2.0.0')?.compatible).toBe(false);
      
      // Event should not be compatible with older versions by default
      expect(results.get('1.0.0')?.compatible).toBe(false);
      expect(results.get('1.1.0')?.compatible).toBe(false);
    });

    it('should respect configuration options', () => {
      const event = createMockEvent('1.2.0');
      const handlerVersions = ['1.0.0', '1.1.0', '1.2.0'];
      const config: CompatibilityCheckerConfig = { allowDowngrade: true };
      
      const results = checkEventCompatibilityWithHandlers(event, handlerVersions, config);
      
      // With allowDowngrade, event should be compatible with older minor versions
      expect(results.get('1.0.0')?.compatible).toBe(true);
      expect(results.get('1.1.0')?.compatible).toBe(true);
      expect(results.get('1.2.0')?.compatible).toBe(true);
    });
  });

  describe('findHighestCompatibleVersion', () => {
    it('should find the highest compatible version', () => {
      const event = createMockEvent('1.2.0');
      const availableVersions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '2.0.0'];
      
      // Default config (no downgrade allowed)
      const result = findHighestCompatibleVersion(event, availableVersions);
      expect(result).toBe('1.4.0'); // Highest compatible version with same major
    });

    it('should return null if no compatible versions are found', () => {
      const event = createMockEvent('2.0.0');
      const availableVersions = ['1.0.0', '1.1.0', '1.2.0'];
      
      // No compatible versions (all lower major version)
      const result = findHighestCompatibleVersion(event, availableVersions);
      expect(result).toBeNull();
    });

    it('should respect configuration options', () => {
      const event = createMockEvent('1.2.0');
      const availableVersions = ['1.0.0', '1.1.0', '1.3.0', '2.0.0'];
      
      // Strict mode should require exact version match
      const strictConfig: CompatibilityCheckerConfig = { strict: true };
      const strictResult = findHighestCompatibleVersion(event, availableVersions, strictConfig);
      expect(strictResult).toBeNull(); // No exact match
      
      // Non-strict mode should find compatible version
      const nonStrictResult = findHighestCompatibleVersion(event, availableVersions);
      expect(nonStrictResult).toBe('1.3.0');
    });
  });
});