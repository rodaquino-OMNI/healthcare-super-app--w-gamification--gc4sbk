/**
 * Unit tests for the versioning module barrel file (index.ts)
 * 
 * These tests verify that all components are correctly exported and accessible
 * from the versioning module, ensuring that consumers can reliably import the
 * versioning functionality without having to know the internal file structure.
 */

import { jest } from '@jest/globals';
import * as versioningModule from '../../../src/versioning';
import * as versionDetector from '../../../src/versioning/version-detector';
import * as schemaMigrator from '../../../src/versioning/schema-migrator';
import * as compatibilityChecker from '../../../src/versioning/compatibility-checker';
import * as transformer from '../../../src/versioning/transformer';
import * as types from '../../../src/versioning/types';
import * as constants from '../../../src/versioning/constants';
import * as errors from '../../../src/versioning/errors';
import * as interfaces from '../../../src/interfaces/event-versioning.interface';
import { VersionedEventDto } from '../../../src/dto/version.dto';

describe('Versioning Module Exports', () => {
  describe('Interface Re-exports', () => {
    it('should re-export all interfaces from event-versioning.interface.ts', () => {
      // Check that all interfaces are re-exported
      expect(versioningModule.IVersionedEvent).toBeDefined();
      expect(versioningModule.EventVersion).toBeDefined();
      expect(versioningModule.EventVersioningStrategy).toBeDefined();
      expect(versioningModule.VersionDetectionResult).toBeDefined();
      expect(versioningModule.VersionMigrationPath).toBeDefined();
      expect(versioningModule.VersionTransformer).toBeDefined();
      
      // Verify they are the same as the original interfaces
      expect(versioningModule.IVersionedEvent).toBe(interfaces.IVersionedEvent);
      expect(versioningModule.EventVersion).toBe(interfaces.EventVersion);
      expect(versioningModule.EventVersioningStrategy).toBe(interfaces.EventVersioningStrategy);
      expect(versioningModule.VersionDetectionResult).toBe(interfaces.VersionDetectionResult);
      expect(versioningModule.VersionMigrationPath).toBe(interfaces.VersionMigrationPath);
      expect(versioningModule.VersionTransformer).toBe(interfaces.VersionTransformer);
    });

    it('should re-export DTOs related to versioning', () => {
      expect(versioningModule.VersionedEventDto).toBeDefined();
      expect(versioningModule.VersionedEventDto).toBe(VersionedEventDto);
    });
  });

  describe('Module Re-exports', () => {
    it('should re-export all exports from version-detector', () => {
      // Get all exports from version-detector
      const detectorExports = Object.keys(versionDetector);
      
      // Check that all exports are available in the main module
      detectorExports.forEach(exportName => {
        expect(versioningModule[exportName]).toBeDefined();
        expect(versioningModule[exportName]).toBe(versionDetector[exportName]);
      });
    });

    it('should re-export all exports from schema-migrator', () => {
      // Get all exports from schema-migrator
      const migratorExports = Object.keys(schemaMigrator);
      
      // Check that all exports are available in the main module
      migratorExports.forEach(exportName => {
        expect(versioningModule[exportName]).toBeDefined();
        expect(versioningModule[exportName]).toBe(schemaMigrator[exportName]);
      });
    });

    it('should re-export all exports from compatibility-checker', () => {
      // Get all exports from compatibility-checker
      const compatibilityExports = Object.keys(compatibilityChecker);
      
      // Check that all exports are available in the main module
      compatibilityExports.forEach(exportName => {
        expect(versioningModule[exportName]).toBeDefined();
        expect(versioningModule[exportName]).toBe(compatibilityChecker[exportName]);
      });
    });

    it('should re-export all exports from transformer', () => {
      // Get all exports from transformer
      const transformerExports = Object.keys(transformer);
      
      // Check that all exports are available in the main module
      transformerExports.forEach(exportName => {
        expect(versioningModule[exportName]).toBeDefined();
        expect(versioningModule[exportName]).toBe(transformer[exportName]);
      });
    });

    it('should re-export all exports from types', () => {
      // Get all exports from types
      const typesExports = Object.keys(types);
      
      // Check that all exports are available in the main module
      typesExports.forEach(exportName => {
        expect(versioningModule[exportName]).toBeDefined();
        expect(versioningModule[exportName]).toBe(types[exportName]);
      });
    });

    it('should re-export all exports from constants', () => {
      // Get all exports from constants
      const constantsExports = Object.keys(constants);
      
      // Check that all exports are available in the main module
      constantsExports.forEach(exportName => {
        expect(versioningModule[exportName]).toBeDefined();
        expect(versioningModule[exportName]).toBe(constants[exportName]);
      });
    });

    it('should re-export all exports from errors', () => {
      // Get all exports from errors
      const errorsExports = Object.keys(errors);
      
      // Check that all exports are available in the main module
      errorsExports.forEach(exportName => {
        expect(versioningModule[exportName]).toBeDefined();
        expect(versioningModule[exportName]).toBe(errors[exportName]);
      });
    });
  });

  describe('Named Core Function Exports', () => {
    it('should export detectVersion function', () => {
      expect(versioningModule.detectVersion).toBeDefined();
      expect(typeof versioningModule.detectVersion).toBe('function');
      expect(versioningModule.detectVersion).toBe(versionDetector.detectVersion);
    });

    it('should export isCompatible function', () => {
      expect(versioningModule.isCompatible).toBeDefined();
      expect(typeof versioningModule.isCompatible).toBe('function');
      expect(versioningModule.isCompatible).toBe(compatibilityChecker.isCompatible);
    });

    it('should export migrateEvent function', () => {
      expect(versioningModule.migrateEvent).toBeDefined();
      expect(typeof versioningModule.migrateEvent).toBe('function');
      expect(versioningModule.migrateEvent).toBe(schemaMigrator.migrateEvent);
    });

    it('should export upgradeToLatest function', () => {
      expect(versioningModule.upgradeToLatest).toBeDefined();
      expect(typeof versioningModule.upgradeToLatest).toBe('function');
      expect(versioningModule.upgradeToLatest).toBe(transformer.upgradeToLatest);
    });

    it('should export downgradeEvent function', () => {
      expect(versioningModule.downgradeEvent).toBeDefined();
      expect(typeof versioningModule.downgradeEvent).toBe('function');
      expect(versioningModule.downgradeEvent).toBe(transformer.downgradeEvent);
    });

    it('should export registerMigrationPath function', () => {
      expect(versioningModule.registerMigrationPath).toBeDefined();
      expect(typeof versioningModule.registerMigrationPath).toBe('function');
      expect(versioningModule.registerMigrationPath).toBe(schemaMigrator.registerMigrationPath);
    });
  });

  describe('Named Utility Function Exports', () => {
    it('should export parseVersion function', () => {
      expect(versioningModule.parseVersion).toBeDefined();
      expect(typeof versioningModule.parseVersion).toBe('function');
      expect(versioningModule.parseVersion).toBe(types.parseVersion);
    });

    it('should export compareVersions function', () => {
      expect(versioningModule.compareVersions).toBeDefined();
      expect(typeof versioningModule.compareVersions).toBe('function');
      expect(versioningModule.compareVersions).toBe(compatibilityChecker.compareVersions);
    });

    it('should export createVersion function', () => {
      expect(versioningModule.createVersion).toBeDefined();
      expect(typeof versioningModule.createVersion).toBe('function');
      expect(versioningModule.createVersion).toBe(types.createVersion);
    });

    it('should export getLatestVersion function', () => {
      expect(versioningModule.getLatestVersion).toBeDefined();
      expect(typeof versioningModule.getLatestVersion).toBe('function');
      expect(versioningModule.getLatestVersion).toBe(constants.getLatestVersion);
    });

    it('should export getMinimumSupportedVersion function', () => {
      expect(versioningModule.getMinimumSupportedVersion).toBeDefined();
      expect(typeof versioningModule.getMinimumSupportedVersion).toBe('function');
      expect(versioningModule.getMinimumSupportedVersion).toBe(constants.getMinimumSupportedVersion);
    });
  });

  describe('Import Patterns', () => {
    it('should support importing the entire module', () => {
      expect(Object.keys(versioningModule).length).toBeGreaterThan(0);
    });

    it('should support importing specific named exports', () => {
      // Simulate importing specific exports
      const { detectVersion, isCompatible, upgradeToLatest } = versioningModule;
      
      expect(detectVersion).toBeDefined();
      expect(isCompatible).toBeDefined();
      expect(upgradeToLatest).toBeDefined();
      
      expect(detectVersion).toBe(versionDetector.detectVersion);
      expect(isCompatible).toBe(compatibilityChecker.isCompatible);
      expect(upgradeToLatest).toBe(transformer.upgradeToLatest);
    });

    it('should support importing types and interfaces', () => {
      // Simulate importing types and interfaces
      type VersionedEvent = versioningModule.IVersionedEvent;
      type VersionStrategy = versioningModule.EventVersioningStrategy;
      
      // This is a compile-time check, so we just need to verify the types exist
      expect(versioningModule.IVersionedEvent).toBeDefined();
      expect(versioningModule.EventVersioningStrategy).toBeDefined();
    });
  });

  describe('Module Organization', () => {
    it('should organize exports into logical groups', () => {
      // Core functions
      const coreFunctions = [
        'detectVersion',
        'isCompatible',
        'migrateEvent',
        'upgradeToLatest',
        'downgradeEvent',
        'registerMigrationPath'
      ];
      
      // Utility functions
      const utilityFunctions = [
        'parseVersion',
        'compareVersions',
        'createVersion',
        'getLatestVersion',
        'getMinimumSupportedVersion'
      ];
      
      // Interfaces
      const interfaces = [
        'IVersionedEvent',
        'EventVersion',
        'EventVersioningStrategy',
        'VersionDetectionResult',
        'VersionMigrationPath',
        'VersionTransformer'
      ];
      
      // Check that all expected exports exist
      [...coreFunctions, ...utilityFunctions, ...interfaces].forEach(exportName => {
        expect(versioningModule[exportName]).toBeDefined();
      });
    });

    it('should not expose internal implementation details', () => {
      // The module should not expose any private or internal functions
      // This is a negative test to ensure encapsulation
      
      // Check for common naming patterns of internal functions
      const moduleExports = Object.keys(versioningModule);
      const internalPatterns = ['_', 'internal', 'private', 'impl'];
      
      internalPatterns.forEach(pattern => {
        const internalExports = moduleExports.filter(name => name.includes(pattern));
        expect(internalExports.length).toBe(0);
      });
    });
  });
});