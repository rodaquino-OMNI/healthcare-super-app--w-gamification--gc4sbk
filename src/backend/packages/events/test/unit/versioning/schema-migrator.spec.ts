/**
 * @file schema-migrator.spec.ts
 * @description Unit tests for the schema migration functionality that validates the system's ability
 * to transform events between different schema versions.
 */

import { MigrationRegistry, createDefaultMigrationRegistry } from '../../../src/versioning/schema-migrator';
import { MigrationError, ValidationError, VersioningError } from '../../../src/versioning/errors';
import { 
  EventTransformer, 
  MigrationPath, 
  MigrationResult, 
  SchemaValidator, 
  TransformDirection, 
  TransformOptions 
} from '../../../src/versioning/types';
import { IVersionedEvent } from '../../../src/interfaces';
import { 
  LATEST_VERSION, 
  MINIMUM_SUPPORTED_VERSION, 
  SUPPORTED_VERSIONS 
} from '../../../src/versioning/constants';

// Mock event types for testing
interface TestEventV1 extends IVersionedEvent {
  version: string;
  type: string;
  payload: {
    id: string;
    name: string;
    value: number;
  };
}

interface TestEventV2 extends IVersionedEvent {
  version: string;
  type: string;
  payload: {
    id: string;
    name: string;
    value: number;
    tags: string[];
  };
}

describe('MigrationRegistry', () => {
  let registry: MigrationRegistry;
  
  // Sample events for testing
  const eventV1: TestEventV1 = {
    version: '0.5.0',
    type: 'test-event',
    payload: {
      id: 'test-123',
      name: 'Test Event',
      value: 42
    }
  };
  
  const eventV2: TestEventV2 = {
    version: '1.0.0',
    type: 'test-event',
    payload: {
      id: 'test-123',
      name: 'Test Event',
      value: 42,
      tags: ['test', 'event']
    }
  };
  
  // Mock transformers
  const v1ToV2Transformer: EventTransformer = (event: TestEventV1, options?: TransformOptions): TestEventV2 => {
    return {
      ...event,
      version: '1.0.0',
      payload: {
        ...event.payload,
        tags: ['test', 'event']
      }
    };
  };
  
  const v2ToV1Transformer: EventTransformer = (event: TestEventV2, options?: TransformOptions): TestEventV1 => {
    const { tags, ...rest } = event.payload;
    return {
      ...event,
      version: '0.5.0',
      payload: rest
    };
  };
  
  // Mock validators
  const v1Validator: SchemaValidator = (event: unknown, version: string): boolean => {
    if (version !== '0.5.0') return false;
    const typedEvent = event as TestEventV1;
    return (
      typedEvent.version === '0.5.0' &&
      typedEvent.type === 'test-event' &&
      typeof typedEvent.payload.id === 'string' &&
      typeof typedEvent.payload.name === 'string' &&
      typeof typedEvent.payload.value === 'number'
    );
  };
  
  const v2Validator: SchemaValidator = (event: unknown, version: string): boolean => {
    if (version !== '1.0.0') return false;
    const typedEvent = event as TestEventV2;
    return (
      typedEvent.version === '1.0.0' &&
      typedEvent.type === 'test-event' &&
      typeof typedEvent.payload.id === 'string' &&
      typeof typedEvent.payload.name === 'string' &&
      typeof typedEvent.payload.value === 'number' &&
      Array.isArray(typedEvent.payload.tags)
    );
  };
  
  beforeEach(() => {
    // Create a fresh registry for each test
    registry = new MigrationRegistry({ allowDowngrade: true });
  });
  
  describe('Registration of migration paths', () => {
    it('should register a migration path between two versions', () => {
      // Register a migration path
      registry.registerMigration('0.5.0', '1.0.0', v1ToV2Transformer);
      
      // Get all migration paths
      const paths = registry.getAllMigrationPaths();
      
      // Check that the path was registered
      expect(paths.size).toBe(1);
      expect(paths.has('0.5.0')).toBe(true);
      
      const pathsFromV1 = paths.get('0.5.0');
      expect(pathsFromV1).toBeDefined();
      expect(pathsFromV1?.length).toBe(1);
      expect(pathsFromV1?.[0].sourceVersion).toBe('0.5.0');
      expect(pathsFromV1?.[0].targetVersion).toBe('1.0.0');
    });
    
    it('should register multiple migration paths from the same source version', () => {
      // Register multiple migration paths
      registry.registerMigration('0.5.0', '0.6.0', v1ToV2Transformer);
      registry.registerMigration('0.5.0', '0.7.0', v1ToV2Transformer);
      
      // Get all migration paths
      const paths = registry.getAllMigrationPaths();
      
      // Check that the paths were registered
      expect(paths.size).toBe(1);
      expect(paths.has('0.5.0')).toBe(true);
      
      const pathsFromV1 = paths.get('0.5.0');
      expect(pathsFromV1).toBeDefined();
      expect(pathsFromV1?.length).toBe(2);
      expect(pathsFromV1?.[0].targetVersion).toBe('0.6.0');
      expect(pathsFromV1?.[1].targetVersion).toBe('0.7.0');
    });
    
    it('should replace an existing migration path if registered again', () => {
      // Register a migration path
      registry.registerMigration('0.5.0', '1.0.0', v1ToV2Transformer);
      
      // Register the same path again with a different transformer
      const newTransformer: EventTransformer = (event: TestEventV1): TestEventV2 => {
        return {
          ...event,
          version: '1.0.0',
          payload: {
            ...event.payload,
            tags: ['new', 'transformer']
          }
        };
      };
      
      registry.registerMigration('0.5.0', '1.0.0', newTransformer);
      
      // Get all migration paths
      const paths = registry.getAllMigrationPaths();
      
      // Check that there's still only one path
      expect(paths.size).toBe(1);
      expect(paths.has('0.5.0')).toBe(true);
      
      const pathsFromV1 = paths.get('0.5.0');
      expect(pathsFromV1).toBeDefined();
      expect(pathsFromV1?.length).toBe(1);
      
      // Apply the transformer to check it's the new one
      const result = pathsFromV1?.[0].transformer(eventV1) as TestEventV2;
      expect(result.payload.tags).toEqual(['new', 'transformer']);
    });
    
    it('should throw an error when registering a migration with an unsupported source version', () => {
      // Try to register a migration with an unsupported source version
      expect(() => {
        registry.registerMigration('999.0.0', '1.0.0', v1ToV2Transformer);
      }).toThrow(VersioningError);
    });
    
    it('should throw an error when registering a migration with an unsupported target version', () => {
      // Try to register a migration with an unsupported target version
      expect(() => {
        registry.registerMigration('0.5.0', '999.0.0', v1ToV2Transformer);
      }).toThrow(VersioningError);
    });
  });
  
  describe('Registration of validators', () => {
    it('should register a validator for a specific version', () => {
      // Register a validator
      registry.registerValidator('0.5.0', v1Validator);
      
      // Validate an event
      const isValid = registry.validateEvent(eventV1, '0.5.0');
      
      // Check that the validation was successful
      expect(isValid).toBe(true);
    });
    
    it('should return true when validating an event with no registered validator', () => {
      // Validate an event with no registered validator
      const isValid = registry.validateEvent(eventV1, '0.5.0');
      
      // Check that the validation was successful (default behavior)
      expect(isValid).toBe(true);
    });
    
    it('should return false when validation fails', () => {
      // Register a validator
      registry.registerValidator('0.5.0', v1Validator);
      
      // Create an invalid event
      const invalidEvent = {
        version: '0.5.0',
        type: 'test-event',
        payload: {
          id: 123, // Should be a string
          name: 'Test Event',
          value: 42
        }
      };
      
      // Validate the invalid event
      const isValid = registry.validateEvent(invalidEvent, '0.5.0');
      
      // Check that the validation failed
      expect(isValid).toBe(false);
    });
    
    it('should throw an error when registering a validator for an unsupported version', () => {
      // Try to register a validator for an unsupported version
      expect(() => {
        registry.registerValidator('999.0.0', v1Validator);
      }).toThrow(VersioningError);
    });
  });
  
  describe('Finding migration paths', () => {
    beforeEach(() => {
      // Register migration paths for testing
      registry.registerMigration('0.5.0', '0.6.0', v1ToV2Transformer);
      registry.registerMigration('0.6.0', '0.7.0', v1ToV2Transformer);
      registry.registerMigration('0.7.0', '0.8.0', v1ToV2Transformer);
      registry.registerMigration('0.8.0', '0.9.0', v1ToV2Transformer);
      registry.registerMigration('0.9.0', '1.0.0', v1ToV2Transformer);
      
      // Register downgrade paths
      registry.registerMigration('1.0.0', '0.9.0', v2ToV1Transformer);
      registry.registerMigration('0.9.0', '0.8.0', v2ToV1Transformer);
      registry.registerMigration('0.8.0', '0.7.0', v2ToV1Transformer);
      registry.registerMigration('0.7.0', '0.6.0', v2ToV1Transformer);
      registry.registerMigration('0.6.0', '0.5.0', v2ToV1Transformer);
    });
    
    it('should find a direct migration path between two versions', () => {
      // Find a direct migration path
      const path = registry.findMigrationPath('0.5.0', '0.6.0');
      
      // Check that the path was found
      expect(path.length).toBe(1);
      expect(path[0].sourceVersion).toBe('0.5.0');
      expect(path[0].targetVersion).toBe('0.6.0');
    });
    
    it('should find a multi-step migration path between two versions', () => {
      // Find a multi-step migration path
      const path = registry.findMigrationPath('0.5.0', '1.0.0');
      
      // Check that the path was found
      expect(path.length).toBe(5);
      expect(path[0].sourceVersion).toBe('0.5.0');
      expect(path[0].targetVersion).toBe('0.6.0');
      expect(path[1].sourceVersion).toBe('0.6.0');
      expect(path[1].targetVersion).toBe('0.7.0');
      expect(path[2].sourceVersion).toBe('0.7.0');
      expect(path[2].targetVersion).toBe('0.8.0');
      expect(path[3].sourceVersion).toBe('0.8.0');
      expect(path[3].targetVersion).toBe('0.9.0');
      expect(path[4].sourceVersion).toBe('0.9.0');
      expect(path[4].targetVersion).toBe('1.0.0');
    });
    
    it('should find a downgrade path if allowed', () => {
      // Find a downgrade path
      const path = registry.findMigrationPath('1.0.0', '0.5.0');
      
      // Check that the path was found
      expect(path.length).toBe(5);
      expect(path[0].sourceVersion).toBe('1.0.0');
      expect(path[0].targetVersion).toBe('0.9.0');
      expect(path[4].sourceVersion).toBe('0.6.0');
      expect(path[4].targetVersion).toBe('0.5.0');
    });
    
    it('should return an empty array if source and target versions are the same', () => {
      // Find a migration path to the same version
      const path = registry.findMigrationPath('0.5.0', '0.5.0');
      
      // Check that an empty path was returned
      expect(path.length).toBe(0);
    });
    
    it('should throw an error if no migration path is found', () => {
      // Create a new registry without any migrations
      const emptyRegistry = new MigrationRegistry();
      
      // Try to find a migration path
      expect(() => {
        emptyRegistry.findMigrationPath('0.5.0', '1.0.0');
      }).toThrow(MigrationError);
    });
    
    it('should throw an error if downgrade is not allowed', () => {
      // Create a registry that doesn't allow downgrades
      const noDowngradeRegistry = new MigrationRegistry({ allowDowngrade: false });
      
      // Register some migrations
      noDowngradeRegistry.registerMigration('0.5.0', '1.0.0', v1ToV2Transformer);
      noDowngradeRegistry.registerMigration('1.0.0', '0.5.0', v2ToV1Transformer);
      
      // Try to find a downgrade path
      expect(() => {
        noDowngradeRegistry.findMigrationPath('1.0.0', '0.5.0');
      }).toThrow(MigrationError);
    });
  });
  
  describe('Migrating events', () => {
    beforeEach(() => {
      // Register migration paths and validators for testing
      registry.registerMigration('0.5.0', '1.0.0', v1ToV2Transformer);
      registry.registerMigration('1.0.0', '0.5.0', v2ToV1Transformer);
      registry.registerValidator('0.5.0', v1Validator);
      registry.registerValidator('1.0.0', v2Validator);
    });
    
    it('should migrate an event from one version to another', () => {
      // Migrate an event
      const result = registry.migrateEvent(eventV1, '1.0.0');
      
      // Check that the migration was successful
      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.event?.version).toBe('1.0.0');
      expect((result.event as TestEventV2).payload.tags).toEqual(['test', 'event']);
    });
    
    it('should return the original event if already at the target version', () => {
      // Migrate an event that's already at the target version
      const result = registry.migrateEvent(eventV1, '0.5.0');
      
      // Check that the original event was returned
      expect(result.success).toBe(true);
      expect(result.event).toBe(eventV1);
    });
    
    it('should validate the result if validateResult is true', () => {
      // Register a migration that produces an invalid result
      const invalidTransformer: EventTransformer = (event: TestEventV1): TestEventV2 => {
        return {
          ...event,
          version: '1.0.0',
          payload: {
            ...event.payload,
            tags: 'not-an-array' as any // Invalid: should be an array
          }
        };
      };
      
      registry.registerMigration('0.5.0', '1.0.0', invalidTransformer);
      
      // Migrate with validation
      const result = registry.migrateEvent(eventV1, '1.0.0', { validateResult: true });
      
      // Check that the migration failed due to validation
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });
    
    it('should return a failure result if the event is not a valid versioned event', () => {
      // Try to migrate an invalid event
      const invalidEvent = { foo: 'bar' };
      const result = registry.migrateEvent(invalidEvent as any, '1.0.0');
      
      // Check that the migration failed
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });
    
    it('should include the migration path in the result', () => {
      // Register intermediate migrations
      registry.registerMigration('0.5.0', '0.7.0', v1ToV2Transformer);
      registry.registerMigration('0.7.0', '1.0.0', v1ToV2Transformer);
      
      // Migrate an event
      const result = registry.migrateEvent(eventV1, '1.0.0');
      
      // Check that the migration path is included
      expect(result.success).toBe(true);
      expect(result.migrationPath).toBeDefined();
      expect(result.migrationPath).toEqual(['0.5.0', '0.7.0', '1.0.0']);
    });
  });
  
  describe('Safe migration with transaction-like semantics', () => {
    beforeEach(() => {
      // Register migration paths and validators for testing
      registry.registerMigration('0.5.0', '0.7.0', v1ToV2Transformer);
      registry.registerMigration('0.7.0', '1.0.0', v1ToV2Transformer);
      registry.registerValidator('0.5.0', v1Validator);
      registry.registerValidator('1.0.0', v2Validator);
    });
    
    it('should return the migrated event if migration succeeds', () => {
      // Safely migrate an event
      const result = registry.safeMigrate(eventV1, '1.0.0');
      
      // Check that the migration was successful
      expect(result.version).toBe('1.0.0');
      expect((result as TestEventV2).payload.tags).toEqual(['test', 'event']);
    });
    
    it('should return the original event if migration fails', () => {
      // Register a migration that throws an error
      const errorTransformer: EventTransformer = () => {
        throw new Error('Transformation failed');
      };
      
      registry.registerMigration('0.5.0', '0.7.0', errorTransformer);
      
      // Safely migrate an event
      const result = registry.safeMigrate(eventV1, '1.0.0');
      
      // Check that the original event was returned
      expect(result).toBe(eventV1);
    });
    
    it('should return the original event if validation fails', () => {
      // Register a migration that produces an invalid result
      const invalidTransformer: EventTransformer = (event: TestEventV1): TestEventV2 => {
        return {
          ...event,
          version: '0.7.0',
          payload: {
            ...event.payload,
            tags: 'not-an-array' as any // Invalid: should be an array
          }
        };
      };
      
      registry.registerMigration('0.5.0', '0.7.0', invalidTransformer);
      
      // Safely migrate with validation
      const result = registry.safeMigrate(eventV1, '1.0.0', { validateResult: true });
      
      // Check that the original event was returned
      expect(result).toBe(eventV1);
    });
  });
  
  describe('Default migration registry', () => {
    it('should create a default migration registry with pre-registered migrations', () => {
      // Create a default migration registry
      const defaultRegistry = createDefaultMigrationRegistry();
      
      // Check that migrations are pre-registered
      const paths = defaultRegistry.getAllMigrationPaths();
      expect(paths.size).toBeGreaterThan(0);
    });
    
    it('should register downgrade paths if allowed', () => {
      // Create a default migration registry with downgrades allowed
      const defaultRegistry = createDefaultMigrationRegistry({ allowDowngrade: true });
      
      // Check that downgrade paths are registered
      const paths = defaultRegistry.getAllMigrationPaths();
      
      // There should be paths from newer to older versions
      let hasDowngradePath = false;
      for (const [sourceVersion, targetPaths] of paths.entries()) {
        for (const path of targetPaths) {
          if (path.sourceVersion > path.targetVersion) {
            hasDowngradePath = true;
            break;
          }
        }
        if (hasDowngradePath) break;
      }
      
      expect(hasDowngradePath).toBe(true);
    });
  });
  
  describe('Data integrity during migration', () => {
    beforeEach(() => {
      // Register migration paths for testing
      registry.registerMigration('0.5.0', '1.0.0', v1ToV2Transformer);
      registry.registerMigration('1.0.0', '0.5.0', v2ToV1Transformer);
    });
    
    it('should preserve data integrity when upgrading and then downgrading', () => {
      // Upgrade an event
      const upgradeResult = registry.migrateEvent(eventV1, '1.0.0');
      expect(upgradeResult.success).toBe(true);
      
      // Downgrade the upgraded event
      const downgradeResult = registry.migrateEvent(upgradeResult.event as TestEventV2, '0.5.0');
      expect(downgradeResult.success).toBe(true);
      
      // Check that the original data is preserved
      const finalEvent = downgradeResult.event as TestEventV1;
      expect(finalEvent.version).toBe('0.5.0');
      expect(finalEvent.type).toBe('test-event');
      expect(finalEvent.payload.id).toBe('test-123');
      expect(finalEvent.payload.name).toBe('Test Event');
      expect(finalEvent.payload.value).toBe(42);
    });
    
    it('should handle complex data transformations correctly', () => {
      // Create an event with complex data
      const complexEvent: TestEventV1 = {
        version: '0.5.0',
        type: 'complex-event',
        payload: {
          id: 'complex-123',
          name: 'Complex Event',
          value: 99
        }
      };
      
      // Register a complex transformer
      const complexTransformer: EventTransformer = (event: TestEventV1): TestEventV2 => {
        return {
          ...event,
          version: '1.0.0',
          payload: {
            id: `transformed-${event.payload.id}`,
            name: event.payload.name.toUpperCase(),
            value: event.payload.value * 2,
            tags: event.payload.name.split(' ')
          }
        };
      };
      
      registry.registerMigration('0.5.0', '1.0.0', complexTransformer);
      
      // Migrate the complex event
      const result = registry.migrateEvent(complexEvent, '1.0.0');
      expect(result.success).toBe(true);
      
      // Check that the complex transformation was applied correctly
      const transformedEvent = result.event as TestEventV2;
      expect(transformedEvent.version).toBe('1.0.0');
      expect(transformedEvent.payload.id).toBe('transformed-complex-123');
      expect(transformedEvent.payload.name).toBe('COMPLEX EVENT');
      expect(transformedEvent.payload.value).toBe(198); // 99 * 2
      expect(transformedEvent.payload.tags).toEqual(['Complex', 'Event']);
    });
  });
  
  describe('Error handling during migration', () => {
    it('should handle errors in transformers gracefully', () => {
      // Register a transformer that throws an error
      const errorTransformer: EventTransformer = () => {
        throw new Error('Transformation failed');
      };
      
      registry.registerMigration('0.5.0', '1.0.0', errorTransformer);
      
      // Try to migrate an event
      const result = registry.migrateEvent(eventV1, '1.0.0');
      
      // Check that the error was handled
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Transformation failed');
    });
    
    it('should handle non-Error exceptions in transformers', () => {
      // Register a transformer that throws a non-Error
      const errorTransformer: EventTransformer = () => {
        throw 'Not an Error object';
      };
      
      registry.registerMigration('0.5.0', '1.0.0', errorTransformer);
      
      // Try to migrate an event
      const result = registry.migrateEvent(eventV1, '1.0.0');
      
      // Check that the error was handled
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(MigrationError);
    });
    
    it('should handle validation errors during migration', () => {
      // Register a validator that always fails
      const failingValidator: SchemaValidator = () => false;
      registry.registerValidator('1.0.0', failingValidator);
      
      // Register a migration
      registry.registerMigration('0.5.0', '1.0.0', v1ToV2Transformer);
      
      // Try to migrate an event with validation
      const result = registry.migrateEvent(eventV1, '1.0.0', { validateResult: true });
      
      // Check that the validation error was handled
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });
  
  describe('Utility methods', () => {
    it('should clear all registered migrations and validators', () => {
      // Register some migrations and validators
      registry.registerMigration('0.5.0', '1.0.0', v1ToV2Transformer);
      registry.registerValidator('0.5.0', v1Validator);
      
      // Clear the registry
      registry.clear();
      
      // Check that everything was cleared
      const paths = registry.getAllMigrationPaths();
      expect(paths.size).toBe(0);
      
      // Validation should still pass (default behavior when no validator is registered)
      const isValid = registry.validateEvent(eventV1, '0.5.0');
      expect(isValid).toBe(true);
    });
    
    it('should return all supported versions', () => {
      // Get supported versions
      const versions = registry.getSupportedVersions();
      
      // Check that the versions match the constants
      expect(versions).toEqual(SUPPORTED_VERSIONS);
    });
  });
});