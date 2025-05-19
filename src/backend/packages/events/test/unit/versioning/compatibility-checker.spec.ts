/**
 * Unit tests for the version compatibility checker.
 * Tests semantic versioning principles and schema-based compatibility analysis.
 */

import {
  parseVersion,
  compareVersions,
  checkVersionCompatibility,
  createCompatibilityChecker,
  canSafelyUpgrade,
  canSafelyDowngrade,
  isVersionSupported,
  checkSchemaCompatibility,
  canProcessEvent,
} from '../../../src/versioning/compatibility-checker';
import { VERSION_COMPARISON, VERSION_ERROR_MESSAGES } from '../../../src/versioning/constants';
import { EventSchemaVersionMap } from '../../../src/versioning/types';

describe('Version Compatibility Checker', () => {
  describe('parseVersion', () => {
    it('should parse a valid version string', () => {
      const result = parseVersion('1.2.3');
      expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it('should parse version with single-digit components', () => {
      const result = parseVersion('1.0.0');
      expect(result).toEqual({ major: 1, minor: 0, patch: 0 });
    });

    it('should parse version with multi-digit components', () => {
      const result = parseVersion('10.20.30');
      expect(result).toEqual({ major: 10, minor: 20, patch: 30 });
    });

    it('should throw an error for invalid version format', () => {
      expect(() => parseVersion('1.2')).toThrow();
      expect(() => parseVersion('1.2.3.4')).toThrow();
      expect(() => parseVersion('1.2.a')).toThrow();
      expect(() => parseVersion('invalid')).toThrow();
      expect(() => parseVersion('')).toThrow();
    });
  });

  describe('compareVersions', () => {
    it('should return EQUAL for identical versions', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(VERSION_COMPARISON.EQUAL);
    });

    it('should return GREATER when first version has higher major', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBe(VERSION_COMPARISON.GREATER);
    });

    it('should return LESS when first version has lower major', () => {
      expect(compareVersions('1.9.9', '2.0.0')).toBe(VERSION_COMPARISON.LESS);
    });

    it('should return GREATER when first version has higher minor with same major', () => {
      expect(compareVersions('1.3.0', '1.2.9')).toBe(VERSION_COMPARISON.GREATER);
    });

    it('should return LESS when first version has lower minor with same major', () => {
      expect(compareVersions('1.2.9', '1.3.0')).toBe(VERSION_COMPARISON.LESS);
    });

    it('should return GREATER when first version has higher patch with same major and minor', () => {
      expect(compareVersions('1.2.3', '1.2.2')).toBe(VERSION_COMPARISON.GREATER);
    });

    it('should return LESS when first version has lower patch with same major and minor', () => {
      expect(compareVersions('1.2.2', '1.2.3')).toBe(VERSION_COMPARISON.LESS);
    });

    it('should prioritize major over minor and patch', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBe(VERSION_COMPARISON.GREATER);
      expect(compareVersions('1.9.9', '2.0.0')).toBe(VERSION_COMPARISON.LESS);
    });

    it('should prioritize minor over patch', () => {
      expect(compareVersions('1.2.0', '1.1.9')).toBe(VERSION_COMPARISON.GREATER);
      expect(compareVersions('1.1.9', '1.2.0')).toBe(VERSION_COMPARISON.LESS);
    });
  });

  describe('checkVersionCompatibility', () => {
    describe('strict mode', () => {
      it('should require exact version match', () => {
        const result = checkVersionCompatibility('1.2.3', '1.2.3', { mode: 'strict' });
        expect(result.compatible).toBe(true);
      });

      it('should reject different patch versions', () => {
        const result = checkVersionCompatibility('1.2.3', '1.2.4', { mode: 'strict' });
        expect(result.compatible).toBe(false);
        expect(result.details?.breakingChange).toBe(true);
      });

      it('should reject different minor versions', () => {
        const result = checkVersionCompatibility('1.2.3', '1.3.3', { mode: 'strict' });
        expect(result.compatible).toBe(false);
        expect(result.details?.breakingChange).toBe(true);
      });

      it('should reject different major versions', () => {
        const result = checkVersionCompatibility('1.2.3', '2.2.3', { mode: 'strict' });
        expect(result.compatible).toBe(false);
        expect(result.details?.breakingChange).toBe(true);
      });
    });

    describe('standard mode (default)', () => {
      it('should accept exact version match', () => {
        const result = checkVersionCompatibility('1.2.3', '1.2.3');
        expect(result.compatible).toBe(true);
      });

      it('should accept older patch version with same major and minor', () => {
        const result = checkVersionCompatibility('1.2.2', '1.2.3');
        expect(result.compatible).toBe(true);
        expect(result.details?.isNewer).toBe(false);
      });

      it('should accept older minor version with same major', () => {
        const result = checkVersionCompatibility('1.1.3', '1.2.3');
        expect(result.compatible).toBe(true);
        expect(result.details?.isNewer).toBe(false);
      });

      it('should reject newer patch version by default', () => {
        const result = checkVersionCompatibility('1.2.4', '1.2.3');
        expect(result.compatible).toBe(false);
        expect(result.details?.isNewer).toBe(true);
      });

      it('should reject newer minor version by default', () => {
        const result = checkVersionCompatibility('1.3.3', '1.2.3');
        expect(result.compatible).toBe(false);
        expect(result.details?.isNewer).toBe(true);
      });

      it('should reject different major versions', () => {
        const result = checkVersionCompatibility('2.0.0', '1.0.0');
        expect(result.compatible).toBe(false);
        expect(result.details?.isSameMajor).toBe(false);
      });

      it('should accept newer versions when allowNewer is true', () => {
        const result = checkVersionCompatibility('1.2.4', '1.2.3', { allowNewer: true });
        expect(result.compatible).toBe(true);
        expect(result.details?.isNewer).toBe(true);

        const result2 = checkVersionCompatibility('1.3.0', '1.2.3', { allowNewer: true });
        expect(result2.compatible).toBe(true);
        expect(result2.details?.isNewer).toBe(true);
      });

      it('should still reject different major versions even with allowNewer', () => {
        const result = checkVersionCompatibility('2.0.0', '1.0.0', { allowNewer: true });
        expect(result.compatible).toBe(false);
        expect(result.details?.isSameMajor).toBe(false);
      });
    });

    describe('relaxed mode', () => {
      it('should accept exact version match', () => {
        const result = checkVersionCompatibility('1.2.3', '1.2.3', { mode: 'relaxed' });
        expect(result.compatible).toBe(true);
      });

      it('should accept older major versions', () => {
        const result = checkVersionCompatibility('1.0.0', '2.0.0', { mode: 'relaxed' });
        expect(result.compatible).toBe(true);
        expect(result.details?.isSameMajor).toBe(false);
      });

      it('should reject newer major versions by default', () => {
        const result = checkVersionCompatibility('2.0.0', '1.0.0', { mode: 'relaxed' });
        expect(result.compatible).toBe(false);
        expect(result.details?.isSameMajor).toBe(false);
      });

      it('should accept newer major versions when allowNewer is true', () => {
        const result = checkVersionCompatibility('2.0.0', '1.0.0', { 
          mode: 'relaxed', 
          allowNewer: true 
        });
        expect(result.compatible).toBe(true);
        expect(result.details?.isSameMajor).toBe(false);
        expect(result.details?.isNewer).toBe(true);
      });
    });

    it('should include custom error message when provided', () => {
      const customMessage = 'Custom incompatibility message';
      const result = checkVersionCompatibility('2.0.0', '1.0.0', { 
        errorMessage: customMessage 
      });
      expect(result.compatible).toBe(false);
      expect(result.reason).toBe(customMessage);
    });

    it('should include default error message when not compatible', () => {
      const result = checkVersionCompatibility('2.0.0', '1.0.0');
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('2.0.0');
      expect(result.reason).toContain('1.0.0');
    });

    it('should throw error for unknown compatibility mode', () => {
      expect(() => {
        checkVersionCompatibility('1.0.0', '1.0.0', { 
          mode: 'unknown' as any 
        });
      }).toThrow();
    });
  });

  describe('createCompatibilityChecker', () => {
    it('should create a checker with default options', () => {
      const checker = createCompatibilityChecker();
      const result = checker('1.2.3', '1.2.3');
      expect(result.compatible).toBe(true);

      const result2 = checker('2.0.0', '1.0.0');
      expect(result2.compatible).toBe(false);
    });

    it('should create a checker with custom options', () => {
      const checker = createCompatibilityChecker({ 
        mode: 'strict', 
        errorMessage: 'Custom error' 
      });
      
      const result = checker('1.2.3', '1.2.3');
      expect(result.compatible).toBe(true);

      const result2 = checker('1.2.4', '1.2.3');
      expect(result2.compatible).toBe(false);
      expect(result2.reason).toBe('Custom error');
    });

    it('should create a checker that consistently applies the same options', () => {
      const checker = createCompatibilityChecker({ 
        mode: 'relaxed', 
        allowNewer: true 
      });
      
      // This would normally fail in standard mode
      const result = checker('2.0.0', '1.0.0');
      expect(result.compatible).toBe(true);

      // This would normally fail without allowNewer
      const result2 = checker('1.3.0', '1.2.0');
      expect(result2.compatible).toBe(true);
    });
  });

  describe('canSafelyUpgrade', () => {
    it('should allow upgrading to a newer patch version', () => {
      const result = canSafelyUpgrade('1.2.3', '1.2.4');
      expect(result.compatible).toBe(true);
      expect(result.details?.breakingChange).toBe(false);
    });

    it('should allow upgrading to a newer minor version', () => {
      const result = canSafelyUpgrade('1.2.3', '1.3.0');
      expect(result.compatible).toBe(true);
      expect(result.details?.breakingChange).toBe(false);
    });

    it('should not allow upgrading to a newer major version', () => {
      const result = canSafelyUpgrade('1.2.3', '2.0.0');
      expect(result.compatible).toBe(false);
      expect(result.details?.breakingChange).toBe(true);
      expect(result.reason).toContain('Major version upgrade');
    });

    it('should reject when target is not newer', () => {
      const result = canSafelyUpgrade('1.2.3', '1.2.3');
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('not newer');

      const result2 = canSafelyUpgrade('1.2.3', '1.2.2');
      expect(result2.compatible).toBe(false);
      expect(result2.reason).toContain('not newer');

      const result3 = canSafelyUpgrade('1.2.3', '1.1.0');
      expect(result3.compatible).toBe(false);
      expect(result3.reason).toContain('not newer');
    });
  });

  describe('canSafelyDowngrade', () => {
    it('should allow downgrading to an older patch version', () => {
      const result = canSafelyDowngrade('1.2.3', '1.2.2');
      expect(result.compatible).toBe(true);
      expect(result.details?.breakingChange).toBe(false);
    });

    it('should allow downgrading to an older minor version but warn about potential functionality loss', () => {
      const result = canSafelyDowngrade('1.2.3', '1.1.0');
      expect(result.compatible).toBe(true);
      expect(result.reason).toContain('may lose functionality');
    });

    it('should not allow downgrading to an older major version', () => {
      const result = canSafelyDowngrade('2.0.0', '1.9.9');
      expect(result.compatible).toBe(false);
      expect(result.details?.breakingChange).toBe(true);
      expect(result.reason).toContain('Major version downgrade');
    });

    it('should reject when target is not older', () => {
      const result = canSafelyDowngrade('1.2.3', '1.2.3');
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('not older');

      const result2 = canSafelyDowngrade('1.2.3', '1.2.4');
      expect(result2.compatible).toBe(false);
      expect(result2.reason).toContain('not older');

      const result3 = canSafelyDowngrade('1.2.3', '1.3.0');
      expect(result3.compatible).toBe(false);
      expect(result3.reason).toContain('not older');
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for version within supported range', () => {
      // Mock the constants for testing
      jest.spyOn(VERSION_COMPARISON, 'EQUAL').mockReturnValue(0);
      
      const result = isVersionSupported('1.0.0', '1.0.0', '2.0.0');
      expect(result).toBe(true);

      const result2 = isVersionSupported('1.5.0', '1.0.0', '2.0.0');
      expect(result2).toBe(true);

      const result3 = isVersionSupported('2.0.0', '1.0.0', '2.0.0');
      expect(result3).toBe(true);
    });

    it('should return false for version below minimum supported', () => {
      const result = isVersionSupported('0.9.9', '1.0.0', '2.0.0');
      expect(result).toBe(false);
    });

    it('should return false for version above maximum supported', () => {
      const result = isVersionSupported('2.0.1', '1.0.0', '2.0.0');
      expect(result).toBe(false);
    });

    it('should use default min and max versions when not provided', () => {
      // This test depends on the default values in VERSION_CONSTANTS
      // We're assuming the default min and max are both '1.0.0' based on the constants file
      const result = isVersionSupported('1.0.0');
      expect(result).toBe(true);

      const result2 = isVersionSupported('0.9.0');
      expect(result2).toBe(false);

      const result3 = isVersionSupported('1.1.0');
      // This could be true or false depending on the default max version
      // We're assuming it's false based on the constants file
      expect(result3).toBe(false);
    });
  });

  describe('checkSchemaCompatibility', () => {
    const sourceSchema = {
      id: 'string',
      name: 'string',
      age: 'number',
      metadata: {
        created: 'string',
        tags: ['string'],
      },
    };

    describe('backward compatibility mode', () => {
      it('should return compatible when target schema is a superset of source schema', () => {
        const targetSchema = {
          ...sourceSchema,
          email: 'string', // Additional field
          metadata: {
            ...sourceSchema.metadata,
            updated: 'string', // Additional nested field
          },
        };

        const result = checkSchemaCompatibility(sourceSchema, targetSchema);
        expect(result.compatible).toBe(true);
      });

      it('should return incompatible when target schema is missing fields from source schema', () => {
        const targetSchema = {
          id: 'string',
          name: 'string',
          // Missing age field
          metadata: {
            created: 'string',
            // Missing tags field
          },
        };

        const result = checkSchemaCompatibility(sourceSchema, targetSchema);
        expect(result.compatible).toBe(false);
        expect(result.reason).toContain('Target schema cannot process all fields');
      });

      it('should return incompatible when field types are different', () => {
        const targetSchema = {
          ...sourceSchema,
          age: 'string', // Different type (number -> string)
        };

        const result = checkSchemaCompatibility(sourceSchema, targetSchema);
        expect(result.compatible).toBe(false);
      });
    });

    describe('forward compatibility mode', () => {
      it('should return compatible when source schema is a superset of target schema', () => {
        const targetSchema = {
          id: 'string',
          name: 'string',
          // No age field
        };

        const result = checkSchemaCompatibility(
          { ...sourceSchema, email: 'string' }, // Source has additional fields
          targetSchema,
          { mode: 'forward', ignoreAdditionalProperties: true }
        );
        expect(result.compatible).toBe(true);
      });

      it('should return incompatible when source schema is missing fields from target schema', () => {
        const targetSchema = {
          ...sourceSchema,
          email: 'string', // Additional required field
        };

        const result = checkSchemaCompatibility(
          sourceSchema,
          targetSchema,
          { mode: 'forward' }
        );
        expect(result.compatible).toBe(false);
        expect(result.reason).toContain('Source schema is missing required fields');
      });

      it('should return incompatible when ignoreAdditionalProperties is false and source has extra fields', () => {
        const targetSchema = {
          id: 'string',
          name: 'string',
        };

        const result = checkSchemaCompatibility(
          sourceSchema, // Has additional fields
          targetSchema,
          { mode: 'forward', ignoreAdditionalProperties: false }
        );
        expect(result.compatible).toBe(false);
        expect(result.reason).toContain('additional properties');
      });
    });

    describe('full compatibility mode', () => {
      it('should return compatible when schemas are identical', () => {
        const result = checkSchemaCompatibility(
          sourceSchema,
          { ...sourceSchema }, // Clone to ensure deep equality
          { mode: 'full' }
        );
        expect(result.compatible).toBe(true);
      });

      it('should return incompatible when schemas have any differences', () => {
        const targetSchema = {
          ...sourceSchema,
          email: 'string', // Additional field
        };

        const result = checkSchemaCompatibility(
          sourceSchema,
          targetSchema,
          { mode: 'full', ignoreAdditionalProperties: false }
        );
        expect(result.compatible).toBe(false);
      });

      it('should return compatible when schemas differ only by additional properties and ignoreAdditionalProperties is true', () => {
        const targetSchema = {
          ...sourceSchema,
          email: 'string', // Additional field
        };

        const result = checkSchemaCompatibility(
          sourceSchema,
          targetSchema,
          { mode: 'full', ignoreAdditionalProperties: true }
        );
        expect(result.compatible).toBe(true);
      });
    });

    it('should throw error for unknown schema compatibility mode', () => {
      expect(() => {
        checkSchemaCompatibility(
          sourceSchema,
          sourceSchema,
          { mode: 'unknown' as any }
        );
      }).toThrow();
    });
  });

  describe('canProcessEvent', () => {
    // Sample schema version map for testing
    const schemaVersionMap: EventSchemaVersionMap = {
      eventType: 'test-event',
      latestVersion: '2.0.0',
      versions: {
        '1.0.0': {
          id: 'string',
          name: 'string',
          value: 'number',
        },
        '1.1.0': {
          id: 'string',
          name: 'string',
          value: 'number',
          tags: ['string'], // Added field
        },
        '2.0.0': {
          id: 'string',
          name: 'string',
          value: 'number',
          tags: ['string'],
          metadata: { // Added nested object
            created: 'string',
          },
        },
      },
    };

    it('should return compatible when versions and schemas are compatible', () => {
      const result = canProcessEvent('1.0.0', '1.1.0', schemaVersionMap);
      expect(result.compatible).toBe(true);
    });

    it('should return incompatible when versions are incompatible', () => {
      const result = canProcessEvent('2.0.0', '1.0.0', schemaVersionMap);
      expect(result.compatible).toBe(false);
      // Should fail on version check before schema check
      expect(result.reason).not.toContain('Schema');
    });

    it('should return incompatible when versions are compatible but schemas are not', () => {
      // Create a modified schema map where 1.0.0 and 1.1.0 are incompatible
      const modifiedMap: EventSchemaVersionMap = {
        ...schemaVersionMap,
        versions: {
          ...schemaVersionMap.versions,
          '1.1.0': {
            id: 'string',
            name: 'string',
            // value field is missing, making it incompatible with 1.0.0
            newField: 'boolean',
          },
        },
      };

      const result = canProcessEvent('1.0.0', '1.1.0', modifiedMap);
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('Target schema cannot process');
    });

    it('should skip schema check when checkSchema option is false', () => {
      // Even with incompatible schemas, it should return compatible
      const modifiedMap: EventSchemaVersionMap = {
        ...schemaVersionMap,
        versions: {
          ...schemaVersionMap.versions,
          '1.1.0': {
            id: 'string',
            // Completely different schema that would normally be incompatible
          },
        },
      };

      const result = canProcessEvent('1.0.0', '1.1.0', modifiedMap, { checkSchema: false });
      expect(result.compatible).toBe(true);
    });

    it('should return incompatible when schema is missing for source version', () => {
      const result = canProcessEvent('1.2.0', '1.1.0', schemaVersionMap);
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('Schema not found for 1.2.0');
    });

    it('should return incompatible when schema is missing for target version', () => {
      const result = canProcessEvent('1.0.0', '1.2.0', schemaVersionMap);
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('Schema not found for 1.2.0');
    });

    it('should return version compatibility result when no schema map is provided', () => {
      const result = canProcessEvent('1.0.0', '1.1.0');
      expect(result.compatible).toBe(true);

      const result2 = canProcessEvent('2.0.0', '1.0.0');
      expect(result2.compatible).toBe(false);
    });
  });
});