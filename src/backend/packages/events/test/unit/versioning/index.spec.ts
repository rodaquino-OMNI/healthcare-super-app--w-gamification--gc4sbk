import { Test } from '@nestjs/testing';
import * as versioningModule from '../../../src/versioning';

describe('Versioning Module Exports', () => {
  describe('Constants', () => {
    it('should export VERSION_LATEST constant', () => {
      expect(versioningModule.VERSION_LATEST).toBeDefined();
      expect(typeof versioningModule.VERSION_LATEST).toBe('string');
    });

    it('should export VERSION_MIN_SUPPORTED constant', () => {
      expect(versioningModule.VERSION_MIN_SUPPORTED).toBeDefined();
      expect(typeof versioningModule.VERSION_MIN_SUPPORTED).toBe('string');
    });

    it('should export DEFAULT_VERSION_CONFIG constant', () => {
      expect(versioningModule.DEFAULT_VERSION_CONFIG).toBeDefined();
      expect(typeof versioningModule.DEFAULT_VERSION_CONFIG).toBe('object');
    });

    it('should export VERSION_PATTERN constant', () => {
      expect(versioningModule.VERSION_PATTERN).toBeDefined();
      expect(versioningModule.VERSION_PATTERN).toBeInstanceOf(RegExp);
    });
  });

  describe('Error Classes', () => {
    it('should export VersionError base class', () => {
      expect(versioningModule.VersionError).toBeDefined();
      expect(typeof versioningModule.VersionError).toBe('function');
      expect(new versioningModule.VersionError('test')).toBeInstanceOf(Error);
    });

    it('should export VersionDetectionError class', () => {
      expect(versioningModule.VersionDetectionError).toBeDefined();
      expect(typeof versioningModule.VersionDetectionError).toBe('function');
      expect(new versioningModule.VersionDetectionError('test')).toBeInstanceOf(versioningModule.VersionError);
    });

    it('should export IncompatibleVersionError class', () => {
      expect(versioningModule.IncompatibleVersionError).toBeDefined();
      expect(typeof versioningModule.IncompatibleVersionError).toBe('function');
      expect(new versioningModule.IncompatibleVersionError('test')).toBeInstanceOf(versioningModule.VersionError);
    });

    it('should export MigrationError class', () => {
      expect(versioningModule.MigrationError).toBeDefined();
      expect(typeof versioningModule.MigrationError).toBe('function');
      expect(new versioningModule.MigrationError('test')).toBeInstanceOf(versioningModule.VersionError);
    });

    it('should export TransformationError class', () => {
      expect(versioningModule.TransformationError).toBeDefined();
      expect(typeof versioningModule.TransformationError).toBe('function');
      expect(new versioningModule.TransformationError('test')).toBeInstanceOf(versioningModule.VersionError);
    });
  });

  describe('Interfaces', () => {
    it('should export VersionConfig interface', () => {
      // TypeScript interfaces are not available at runtime, so we can only check
      // if the module has the type definition in its exports
      expect('VersionConfig' in versioningModule).toBe(true);
    });

    it('should export VersionedEvent interface', () => {
      expect('VersionedEvent' in versioningModule).toBe(true);
    });

    it('should export MigrationPath interface', () => {
      expect('MigrationPath' in versioningModule).toBe(true);
    });

    it('should export TransformationOptions interface', () => {
      expect('TransformationOptions' in versioningModule).toBe(true);
    });
  });

  describe('Classes and Functions', () => {
    it('should export VersionDetector class', () => {
      expect(versioningModule.VersionDetector).toBeDefined();
      expect(typeof versioningModule.VersionDetector).toBe('function');
    });

    it('should export CompatibilityChecker class', () => {
      expect(versioningModule.CompatibilityChecker).toBeDefined();
      expect(typeof versioningModule.CompatibilityChecker).toBe('function');
    });

    it('should export SchemaMigrator class', () => {
      expect(versioningModule.SchemaMigrator).toBeDefined();
      expect(typeof versioningModule.SchemaMigrator).toBe('function');
    });

    it('should export EventTransformer class', () => {
      expect(versioningModule.EventTransformer).toBeDefined();
      expect(typeof versioningModule.EventTransformer).toBe('function');
    });

    it('should export compareVersions function', () => {
      expect(versioningModule.compareVersions).toBeDefined();
      expect(typeof versioningModule.compareVersions).toBe('function');
    });

    it('should export parseVersion function', () => {
      expect(versioningModule.parseVersion).toBeDefined();
      expect(typeof versioningModule.parseVersion).toBe('function');
    });

    it('should export isValidVersion function', () => {
      expect(versioningModule.isValidVersion).toBeDefined();
      expect(typeof versioningModule.isValidVersion).toBe('function');
    });
  });

  describe('Module Integration', () => {
    it('should provide a consistent API for consumers', () => {
      // This test verifies that the module exports can be used together in a typical workflow
      const mockEvent = { data: { foo: 'bar' }, metadata: { version: '1.0.0' } };
      
      // We're not testing the actual functionality here, just that the exports
      // can be used together in a type-safe way
      expect(() => {
        const detector = new versioningModule.VersionDetector();
        const version = detector.detectVersion(mockEvent);
        
        const checker = new versioningModule.CompatibilityChecker();
        const isCompatible = checker.isCompatible(version, versioningModule.VERSION_LATEST);
        
        if (!isCompatible) {
          const migrator = new versioningModule.SchemaMigrator();
          const transformer = new versioningModule.EventTransformer();
          
          if (migrator.hasMigrationPath(version, versioningModule.VERSION_LATEST)) {
            return transformer.transform(mockEvent, versioningModule.VERSION_LATEST);
          } else {
            throw new versioningModule.IncompatibleVersionError(
              `No migration path from ${version} to ${versioningModule.VERSION_LATEST}`
            );
          }
        }
        
        return mockEvent;
      }).not.toThrow();
    });

    it('should allow importing specific components directly', () => {
      // This test verifies that consumers can import specific components
      // without importing the entire module
      const importStatement = `
        import { 
          VersionDetector, 
          CompatibilityChecker,
          VERSION_LATEST,
          isValidVersion 
        } from '../../../src/versioning';
      `;
      
      // We can't actually test the import statement, but we can verify
      // that the components are exported individually
      expect(versioningModule.VersionDetector).toBeDefined();
      expect(versioningModule.CompatibilityChecker).toBeDefined();
      expect(versioningModule.VERSION_LATEST).toBeDefined();
      expect(versioningModule.isValidVersion).toBeDefined();
    });
  });

  describe('Versioning Module Structure', () => {
    it('should export all components with consistent naming', () => {
      // Constants should be UPPER_SNAKE_CASE
      const constants = [
        'VERSION_LATEST',
        'VERSION_MIN_SUPPORTED',
        'DEFAULT_VERSION_CONFIG',
        'VERSION_PATTERN'
      ];
      
      constants.forEach(constant => {
        expect(constant in versioningModule).toBe(true);
        expect(constant).toMatch(/^[A-Z][A-Z0-9_]*$/);
      });
      
      // Classes should be PascalCase
      const classes = [
        'VersionDetector',
        'CompatibilityChecker',
        'SchemaMigrator',
        'EventTransformer',
        'VersionError',
        'VersionDetectionError',
        'IncompatibleVersionError',
        'MigrationError',
        'TransformationError'
      ];
      
      classes.forEach(className => {
        expect(className in versioningModule).toBe(true);
        expect(className).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
      
      // Functions should be camelCase
      const functions = [
        'compareVersions',
        'parseVersion',
        'isValidVersion'
      ];
      
      functions.forEach(functionName => {
        expect(functionName in versioningModule).toBe(true);
        expect(functionName).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      });
      
      // Interfaces should be PascalCase (but we can't check at runtime)
      const interfaces = [
        'VersionConfig',
        'VersionedEvent',
        'MigrationPath',
        'TransformationOptions'
      ];
      
      interfaces.forEach(interfaceName => {
        expect(interfaceName in versioningModule).toBe(true);
        expect(interfaceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    it('should not expose internal implementation details', () => {
      // The module should not expose internal utilities or implementation details
      const publicExports = [
        // Constants
        'VERSION_LATEST',
        'VERSION_MIN_SUPPORTED',
        'DEFAULT_VERSION_CONFIG',
        'VERSION_PATTERN',
        
        // Error classes
        'VersionError',
        'VersionDetectionError',
        'IncompatibleVersionError',
        'MigrationError',
        'TransformationError',
        
        // Interfaces
        'VersionConfig',
        'VersionedEvent',
        'MigrationPath',
        'TransformationOptions',
        
        // Classes
        'VersionDetector',
        'CompatibilityChecker',
        'SchemaMigrator',
        'EventTransformer',
        
        // Functions
        'compareVersions',
        'parseVersion',
        'isValidVersion'
      ];
      
      // Get all exports from the module
      const allExports = Object.keys(versioningModule);
      
      // Check that there are no unexpected exports
      allExports.forEach(exportName => {
        expect(publicExports).toContain(exportName);
      });
      
      // Check that all expected exports are present
      publicExports.forEach(exportName => {
        expect(allExports).toContain(exportName);
      });
    });
  });
});