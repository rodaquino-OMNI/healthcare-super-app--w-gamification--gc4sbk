/**
 * @file Unit tests for the versioning module barrel file
 * 
 * These tests verify that all components are correctly exported and accessible
 * from the versioning module's public API. This ensures consumers can reliably
 * import the versioning functionality without having to know the internal file structure.
 */

import { describe, expect, it } from '@jest/globals';
import * as versioningModule from '../../../src/versioning';

describe('Versioning Module Exports', () => {
  it('should export all expected components', () => {
    // Get all exports from the versioning module
    const exports = Object.keys(versioningModule);
    
    // Define the expected exports
    const expectedExports = [
      // Version Detection exports
      'detectEventVersion',
      'createVersionDetector',
      'VersionDetectionStrategy',
      'createFallbackDetector',
      
      // Compatibility Checking exports
      'isCompatibleVersion',
      'compareVersions',
      'checkSchemaCompatibility',
      'CompatibilityMode',
      'createCompatibilityChecker',
      
      // Schema Migration exports
      'migrateEvent',
      'registerMigrationPath',
      'getMigrationPath',
      'createSchemaMigrator',
      'validateMigrationResult',
      
      // Event Transformation exports
      'transformEvent',
      'upgradeEvent',
      'downgradeEvent',
      'createTransformer',
      'createTransformationPipeline',
    ];
    
    // Check that all expected exports are available
    expectedExports.forEach(exportName => {
      expect(exports).toContain(exportName);
      expect(versioningModule[exportName]).toBeDefined();
    });
  });
  
  it('should export all types from the types module', () => {
    // We can't easily check all types since they're not available at runtime
    // But we can check that the module has type exports by checking a few known types
    // that should be used in the implementation
    
    // These checks will fail at compile time if the types aren't exported
    const typeCheck: versioningModule.VersionDetectionOptions = { 
      strategy: versioningModule.VersionDetectionStrategy.EXPLICIT_FIELD,
      versionField: 'version'
    };
    
    expect(typeCheck).toBeDefined();
    expect(versioningModule.VersionDetectionStrategy).toBeDefined();
  });
  
  it('should export all errors from the errors module', () => {
    // Check that error classes are exported
    expect(versioningModule.VersioningError).toBeDefined();
    expect(versioningModule.VersionDetectionError).toBeDefined();
    expect(versioningModule.IncompatibleVersionError).toBeDefined();
    expect(versioningModule.MigrationError).toBeDefined();
    expect(versioningModule.TransformationError).toBeDefined();
    
    // Verify that the errors are properly constructed
    expect(new versioningModule.VersioningError('test')).toBeInstanceOf(Error);
    expect(new versioningModule.VersionDetectionError('test')).toBeInstanceOf(versioningModule.VersioningError);
  });
  
  it('should export all constants from the constants module', () => {
    // Check that important constants are exported
    expect(versioningModule.LATEST_VERSION).toBeDefined();
    expect(versioningModule.MIN_SUPPORTED_VERSION).toBeDefined();
    expect(versioningModule.DEFAULT_VERSION_FIELD).toBeDefined();
    expect(versioningModule.VERSION_FORMAT_REGEX).toBeDefined();
  });
  
  it('should organize exports into logical groups', () => {
    // Version Detection group
    const versionDetectionExports = [
      'detectEventVersion',
      'createVersionDetector',
      'VersionDetectionStrategy',
      'createFallbackDetector',
    ];
    
    // Compatibility Checking group
    const compatibilityExports = [
      'isCompatibleVersion',
      'compareVersions',
      'checkSchemaCompatibility',
      'CompatibilityMode',
      'createCompatibilityChecker',
    ];
    
    // Schema Migration group
    const migrationExports = [
      'migrateEvent',
      'registerMigrationPath',
      'getMigrationPath',
      'createSchemaMigrator',
      'validateMigrationResult',
    ];
    
    // Event Transformation group
    const transformationExports = [
      'transformEvent',
      'upgradeEvent',
      'downgradeEvent',
      'createTransformer',
      'createTransformationPipeline',
    ];
    
    // Check that all exports in each group are defined
    versionDetectionExports.forEach(exportName => {
      expect(versioningModule[exportName]).toBeDefined();
    });
    
    compatibilityExports.forEach(exportName => {
      expect(versioningModule[exportName]).toBeDefined();
    });
    
    migrationExports.forEach(exportName => {
      expect(versioningModule[exportName]).toBeDefined();
    });
    
    transformationExports.forEach(exportName => {
      expect(versioningModule[exportName]).toBeDefined();
    });
  });
  
  it('should support proper import patterns for consumers', () => {
    // Test named imports
    const { 
      detectEventVersion, 
      isCompatibleVersion, 
      migrateEvent, 
      transformEvent 
    } = versioningModule;
    
    expect(detectEventVersion).toBeDefined();
    expect(isCompatibleVersion).toBeDefined();
    expect(migrateEvent).toBeDefined();
    expect(transformEvent).toBeDefined();
    
    // Test importing specific groups
    const { 
      // Version Detection
      detectEventVersion: detectVersion,
      createVersionDetector,
      
      // Compatibility Checking
      isCompatibleVersion: isCompatible,
      compareVersions,
      
      // Schema Migration
      migrateEvent: migrate,
      registerMigrationPath,
      
      // Event Transformation
      transformEvent: transform,
      upgradeEvent,
      downgradeEvent,
    } = versioningModule;
    
    // Version Detection
    expect(detectVersion).toBeDefined();
    expect(createVersionDetector).toBeDefined();
    
    // Compatibility Checking
    expect(isCompatible).toBeDefined();
    expect(compareVersions).toBeDefined();
    
    // Schema Migration
    expect(migrate).toBeDefined();
    expect(registerMigrationPath).toBeDefined();
    
    // Event Transformation
    expect(transform).toBeDefined();
    expect(upgradeEvent).toBeDefined();
    expect(downgradeEvent).toBeDefined();
  });
});