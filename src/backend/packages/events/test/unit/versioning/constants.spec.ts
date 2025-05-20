import {
  VERSION_LATEST,
  VERSION_MIN_SUPPORTED,
  DEFAULT_VERSION_CONFIG,
  VERSION_PATTERN,
  VERSION_ERROR_MESSAGES,
  VERSION_FIELD_NAME,
  VERSION_HEADER_NAME,
  DEFAULT_DETECTION_STRATEGIES,
  MIGRATION_ERROR_MESSAGES,
  TRANSFORMATION_ERROR_MESSAGES,
  COMPATIBILITY_ERROR_MESSAGES
} from '../../../src/versioning/constants';

describe('Versioning Constants', () => {
  describe('Version Identifiers', () => {
    it('should define VERSION_LATEST as a valid semantic version', () => {
      expect(VERSION_LATEST).toBeDefined();
      expect(typeof VERSION_LATEST).toBe('string');
      expect(VERSION_LATEST).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should define VERSION_MIN_SUPPORTED as a valid semantic version', () => {
      expect(VERSION_MIN_SUPPORTED).toBeDefined();
      expect(typeof VERSION_MIN_SUPPORTED).toBe('string');
      expect(VERSION_MIN_SUPPORTED).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have VERSION_MIN_SUPPORTED be less than or equal to VERSION_LATEST', () => {
      const latest = VERSION_LATEST.split('.').map(Number);
      const minSupported = VERSION_MIN_SUPPORTED.split('.').map(Number);

      // Compare major version
      if (latest[0] !== minSupported[0]) {
        expect(minSupported[0]).toBeLessThanOrEqual(latest[0]);
        return;
      }

      // Compare minor version if major is the same
      if (latest[1] !== minSupported[1]) {
        expect(minSupported[1]).toBeLessThanOrEqual(latest[1]);
        return;
      }

      // Compare patch version if major and minor are the same
      expect(minSupported[2]).toBeLessThanOrEqual(latest[2]);
    });

    it('should have VERSION_FIELD_NAME defined as a string', () => {
      expect(VERSION_FIELD_NAME).toBeDefined();
      expect(typeof VERSION_FIELD_NAME).toBe('string');
      expect(VERSION_FIELD_NAME.length).toBeGreaterThan(0);
    });

    it('should have VERSION_HEADER_NAME defined as a string', () => {
      expect(VERSION_HEADER_NAME).toBeDefined();
      expect(typeof VERSION_HEADER_NAME).toBe('string');
      expect(VERSION_HEADER_NAME.length).toBeGreaterThan(0);
    });
  });

  describe('Version Pattern', () => {
    it('should define VERSION_PATTERN as a RegExp', () => {
      expect(VERSION_PATTERN).toBeDefined();
      expect(VERSION_PATTERN).toBeInstanceOf(RegExp);
    });

    it('should validate valid semantic versions', () => {
      const validVersions = [
        '1.0.0',
        '0.1.0',
        '0.0.1',
        '10.20.30',
        '1.2.3'
      ];

      validVersions.forEach(version => {
        expect(VERSION_PATTERN.test(version)).toBe(true);
      });
    });

    it('should reject invalid semantic versions', () => {
      const invalidVersions = [
        '1',
        '1.0',
        'a.b.c',
        '1.0.0-alpha',  // Pre-release versions not supported
        '1.0.0+build',  // Build metadata not supported
        '01.1.1',       // Leading zeros not allowed
        '1.01.1',
        '1.1.01',
        ' 1.0.0',       // Whitespace not allowed
        '1.0.0 ',
        'v1.0.0'        // 'v' prefix not allowed
      ];

      invalidVersions.forEach(version => {
        expect(VERSION_PATTERN.test(version)).toBe(false);
      });
    });
  });

  describe('Default Configuration', () => {
    it('should define DEFAULT_VERSION_CONFIG as an object', () => {
      expect(DEFAULT_VERSION_CONFIG).toBeDefined();
      expect(typeof DEFAULT_VERSION_CONFIG).toBe('object');
      expect(DEFAULT_VERSION_CONFIG).not.toBeNull();
    });

    it('should include strictVersioning property', () => {
      expect(DEFAULT_VERSION_CONFIG.strictVersioning).toBeDefined();
      expect(typeof DEFAULT_VERSION_CONFIG.strictVersioning).toBe('boolean');
    });

    it('should include allowMissingVersion property', () => {
      expect(DEFAULT_VERSION_CONFIG.allowMissingVersion).toBeDefined();
      expect(typeof DEFAULT_VERSION_CONFIG.allowMissingVersion).toBe('boolean');
    });

    it('should include defaultVersion property', () => {
      expect(DEFAULT_VERSION_CONFIG.defaultVersion).toBeDefined();
      expect(typeof DEFAULT_VERSION_CONFIG.defaultVersion).toBe('string');
      expect(DEFAULT_VERSION_CONFIG.defaultVersion).toMatch(VERSION_PATTERN);
    });

    it('should include autoUpgradeEvents property', () => {
      expect(DEFAULT_VERSION_CONFIG.autoUpgradeEvents).toBeDefined();
      expect(typeof DEFAULT_VERSION_CONFIG.autoUpgradeEvents).toBe('boolean');
    });

    it('should include detectionStrategies property as an array', () => {
      expect(DEFAULT_VERSION_CONFIG.detectionStrategies).toBeDefined();
      expect(Array.isArray(DEFAULT_VERSION_CONFIG.detectionStrategies)).toBe(true);
      expect(DEFAULT_VERSION_CONFIG.detectionStrategies.length).toBeGreaterThan(0);
    });
  });

  describe('Detection Strategies', () => {
    it('should define DEFAULT_DETECTION_STRATEGIES as an array', () => {
      expect(DEFAULT_DETECTION_STRATEGIES).toBeDefined();
      expect(Array.isArray(DEFAULT_DETECTION_STRATEGIES)).toBe(true);
      expect(DEFAULT_DETECTION_STRATEGIES.length).toBeGreaterThan(0);
    });

    it('should include field-based detection strategy', () => {
      expect(DEFAULT_DETECTION_STRATEGIES.some(strategy => 
        strategy.name && strategy.name.toLowerCase().includes('field')
      )).toBe(true);
    });

    it('should include header-based detection strategy', () => {
      expect(DEFAULT_DETECTION_STRATEGIES.some(strategy => 
        strategy.name && strategy.name.toLowerCase().includes('header')
      )).toBe(true);
    });

    it('should include structure-based detection strategy', () => {
      expect(DEFAULT_DETECTION_STRATEGIES.some(strategy => 
        strategy.name && strategy.name.toLowerCase().includes('structure')
      )).toBe(true);
    });

    it('should have detection strategies with detect functions', () => {
      DEFAULT_DETECTION_STRATEGIES.forEach(strategy => {
        expect(strategy.detect).toBeDefined();
        expect(typeof strategy.detect).toBe('function');
      });
    });
  });

  describe('Error Message Templates', () => {
    it('should define VERSION_ERROR_MESSAGES as an object', () => {
      expect(VERSION_ERROR_MESSAGES).toBeDefined();
      expect(typeof VERSION_ERROR_MESSAGES).toBe('object');
      expect(VERSION_ERROR_MESSAGES).not.toBeNull();
    });

    it('should include detection failure message template', () => {
      expect(VERSION_ERROR_MESSAGES.DETECTION_FAILED).toBeDefined();
      expect(typeof VERSION_ERROR_MESSAGES.DETECTION_FAILED).toBe('string');
      expect(VERSION_ERROR_MESSAGES.DETECTION_FAILED.length).toBeGreaterThan(10);
      expect(VERSION_ERROR_MESSAGES.DETECTION_FAILED).toContain('{');
      expect(VERSION_ERROR_MESSAGES.DETECTION_FAILED).toContain('}');
    });

    it('should include invalid version message template', () => {
      expect(VERSION_ERROR_MESSAGES.INVALID_VERSION).toBeDefined();
      expect(typeof VERSION_ERROR_MESSAGES.INVALID_VERSION).toBe('string');
      expect(VERSION_ERROR_MESSAGES.INVALID_VERSION.length).toBeGreaterThan(10);
      expect(VERSION_ERROR_MESSAGES.INVALID_VERSION).toContain('{');
      expect(VERSION_ERROR_MESSAGES.INVALID_VERSION).toContain('}');
    });

    it('should define COMPATIBILITY_ERROR_MESSAGES as an object', () => {
      expect(COMPATIBILITY_ERROR_MESSAGES).toBeDefined();
      expect(typeof COMPATIBILITY_ERROR_MESSAGES).toBe('object');
      expect(COMPATIBILITY_ERROR_MESSAGES).not.toBeNull();
    });

    it('should include incompatible version message template', () => {
      expect(COMPATIBILITY_ERROR_MESSAGES.INCOMPATIBLE_VERSION).toBeDefined();
      expect(typeof COMPATIBILITY_ERROR_MESSAGES.INCOMPATIBLE_VERSION).toBe('string');
      expect(COMPATIBILITY_ERROR_MESSAGES.INCOMPATIBLE_VERSION.length).toBeGreaterThan(10);
      expect(COMPATIBILITY_ERROR_MESSAGES.INCOMPATIBLE_VERSION).toContain('{');
      expect(COMPATIBILITY_ERROR_MESSAGES.INCOMPATIBLE_VERSION).toContain('}');
    });

    it('should define MIGRATION_ERROR_MESSAGES as an object', () => {
      expect(MIGRATION_ERROR_MESSAGES).toBeDefined();
      expect(typeof MIGRATION_ERROR_MESSAGES).toBe('object');
      expect(MIGRATION_ERROR_MESSAGES).not.toBeNull();
    });

    it('should include migration path not found message template', () => {
      expect(MIGRATION_ERROR_MESSAGES.PATH_NOT_FOUND).toBeDefined();
      expect(typeof MIGRATION_ERROR_MESSAGES.PATH_NOT_FOUND).toBe('string');
      expect(MIGRATION_ERROR_MESSAGES.PATH_NOT_FOUND.length).toBeGreaterThan(10);
      expect(MIGRATION_ERROR_MESSAGES.PATH_NOT_FOUND).toContain('{');
      expect(MIGRATION_ERROR_MESSAGES.PATH_NOT_FOUND).toContain('}');
    });

    it('should include migration failed message template', () => {
      expect(MIGRATION_ERROR_MESSAGES.MIGRATION_FAILED).toBeDefined();
      expect(typeof MIGRATION_ERROR_MESSAGES.MIGRATION_FAILED).toBe('string');
      expect(MIGRATION_ERROR_MESSAGES.MIGRATION_FAILED.length).toBeGreaterThan(10);
      expect(MIGRATION_ERROR_MESSAGES.MIGRATION_FAILED).toContain('{');
      expect(MIGRATION_ERROR_MESSAGES.MIGRATION_FAILED).toContain('}');
    });

    it('should define TRANSFORMATION_ERROR_MESSAGES as an object', () => {
      expect(TRANSFORMATION_ERROR_MESSAGES).toBeDefined();
      expect(typeof TRANSFORMATION_ERROR_MESSAGES).toBe('object');
      expect(TRANSFORMATION_ERROR_MESSAGES).not.toBeNull();
    });

    it('should include transformation failed message template', () => {
      expect(TRANSFORMATION_ERROR_MESSAGES.TRANSFORMATION_FAILED).toBeDefined();
      expect(typeof TRANSFORMATION_ERROR_MESSAGES.TRANSFORMATION_FAILED).toBe('string');
      expect(TRANSFORMATION_ERROR_MESSAGES.TRANSFORMATION_FAILED.length).toBeGreaterThan(10);
      expect(TRANSFORMATION_ERROR_MESSAGES.TRANSFORMATION_FAILED).toContain('{');
      expect(TRANSFORMATION_ERROR_MESSAGES.TRANSFORMATION_FAILED).toContain('}');
    });
  });

  describe('Message Template Formatting', () => {
    it('should have placeholders in error message templates', () => {
      // Check that all error message templates have placeholders
      Object.values(VERSION_ERROR_MESSAGES).forEach(template => {
        expect(template).toMatch(/\{[\w.]+\}/);
      });

      Object.values(COMPATIBILITY_ERROR_MESSAGES).forEach(template => {
        expect(template).toMatch(/\{[\w.]+\}/);
      });

      Object.values(MIGRATION_ERROR_MESSAGES).forEach(template => {
        expect(template).toMatch(/\{[\w.]+\}/);
      });

      Object.values(TRANSFORMATION_ERROR_MESSAGES).forEach(template => {
        expect(template).toMatch(/\{[\w.]+\}/);
      });
    });

    it('should have descriptive error messages', () => {
      // Check that all error messages are descriptive (not empty and have a minimum length)
      Object.values(VERSION_ERROR_MESSAGES).forEach(template => {
        expect(template.length).toBeGreaterThan(20);
      });

      Object.values(COMPATIBILITY_ERROR_MESSAGES).forEach(template => {
        expect(template.length).toBeGreaterThan(20);
      });

      Object.values(MIGRATION_ERROR_MESSAGES).forEach(template => {
        expect(template.length).toBeGreaterThan(20);
      });

      Object.values(TRANSFORMATION_ERROR_MESSAGES).forEach(template => {
        expect(template.length).toBeGreaterThan(20);
      });
    });
  });

  describe('Versioning Constants Integration', () => {
    it('should have consistent version format across all constants', () => {
      // All version strings should match the VERSION_PATTERN
      expect(VERSION_LATEST).toMatch(VERSION_PATTERN);
      expect(VERSION_MIN_SUPPORTED).toMatch(VERSION_PATTERN);
      expect(DEFAULT_VERSION_CONFIG.defaultVersion).toMatch(VERSION_PATTERN);
    });

    it('should have detection strategies aligned with configuration defaults', () => {
      // The default detection strategies should be the same as in the config
      expect(DEFAULT_VERSION_CONFIG.detectionStrategies).toEqual(DEFAULT_DETECTION_STRATEGIES);
    });

    it('should have error messages that reference relevant version fields', () => {
      // Error messages should reference the version field name when appropriate
      const versionFieldMessages = Object.values(VERSION_ERROR_MESSAGES)
        .filter(msg => msg.includes(VERSION_FIELD_NAME));
      
      expect(versionFieldMessages.length).toBeGreaterThan(0);
    });
  });
});