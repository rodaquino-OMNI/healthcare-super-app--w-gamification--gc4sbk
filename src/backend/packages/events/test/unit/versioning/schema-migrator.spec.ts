/**
 * @file schema-migrator.spec.ts
 * @description Unit tests for the schema migration functionality that validates the system's ability
 * to transform events between different schema versions.
 */

import { SchemaMigrator, schemaMigrator, migrateEvent, registerMigration, registerBidirectionalMigration, canMigrate, discoverMigrationPath } from '../../../src/versioning/schema-migrator';
import { MigrationPathNotFoundError, ValidationError, MigrationExecutionError } from '../../../src/versioning/errors';
import { DEFAULT_MIGRATION_OPTIONS } from '../../../src/versioning/constants';

// Test event types
type TestEventV1 = {
  version: string;
  type: string;
  eventId: string;
  payload: {
    name: string;
    value: number;
  };
};

type TestEventV2 = {
  version: string;
  type: string;
  eventId: string;
  payload: {
    name: string;
    value: number;
    metadata: {
      createdAt: string;
    };
  };
};

type TestEventV3 = {
  version: string;
  type: string;
  eventId: string;
  payload: {
    name: string;
    value: number;
    metadata: {
      createdAt: string;
      updatedAt: string;
    };
  };
};

describe('SchemaMigrator', () => {
  let migrator: SchemaMigrator;

  beforeEach(() => {
    // Create a fresh migrator instance for each test
    migrator = new SchemaMigrator();
  });

  describe('Migration Registration', () => {
    it('should register a single migration path', () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const transformer = jest.fn((event: TestEventV1) => {
        return {
          ...event,
          version: toVersion,
          payload: {
            ...event.payload,
            metadata: {
              createdAt: new Date().toISOString(),
            },
          },
        } as TestEventV2;
      });

      // Act
      migrator.registerMigration(eventType, fromVersion, toVersion, transformer);

      // Assert
      const migrations = migrator.getMigrations(eventType);
      expect(migrations).toHaveLength(1);
      expect(migrations[0].eventType).toBe(eventType);
      expect(migrations[0].fromVersion).toBe(fromVersion);
      expect(migrations[0].toVersion).toBe(toVersion);
      expect(migrations[0].transformer).toBe(transformer);
    });

    it('should register bidirectional migration paths', () => {
      // Arrange
      const eventType = 'test.event';
      const version1 = '1.0.0';
      const version2 = '2.0.0';
      const upgradeTransformer = jest.fn((event: TestEventV1) => {
        return {
          ...event,
          version: version2,
          payload: {
            ...event.payload,
            metadata: {
              createdAt: new Date().toISOString(),
            },
          },
        } as TestEventV2;
      });
      const downgradeTransformer = jest.fn((event: TestEventV2) => {
        return {
          ...event,
          version: version1,
          payload: {
            name: event.payload.name,
            value: event.payload.value,
          },
        } as TestEventV1;
      });

      // Act
      migrator.registerBidirectionalMigration(
        eventType,
        version1,
        version2,
        upgradeTransformer,
        downgradeTransformer
      );

      // Assert
      const migrations = migrator.getMigrations(eventType);
      expect(migrations).toHaveLength(2);
      
      // Check upgrade path
      const upgradePath = migrations.find(m => m.fromVersion === version1 && m.toVersion === version2);
      expect(upgradePath).toBeDefined();
      expect(upgradePath?.transformer).toBe(upgradeTransformer);
      
      // Check downgrade path
      const downgradePath = migrations.find(m => m.fromVersion === version2 && m.toVersion === version1);
      expect(downgradePath).toBeDefined();
      expect(downgradePath?.transformer).toBe(downgradeTransformer);
    });

    it('should retrieve registered event types', () => {
      // Arrange
      const eventTypes = ['test.event.1', 'test.event.2', 'test.event.3'];
      const transformer = jest.fn(event => event);

      // Register migrations for each event type
      eventTypes.forEach(eventType => {
        migrator.registerMigration(eventType, '1.0.0', '2.0.0', transformer);
      });

      // Act
      const registeredTypes = migrator.getRegisteredEventTypes();

      // Assert
      expect(registeredTypes).toHaveLength(eventTypes.length);
      eventTypes.forEach(eventType => {
        expect(registeredTypes).toContain(eventType);
      });
    });
  });

  describe('Migration Path Discovery', () => {
    it('should discover direct migration path', () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const transformer = jest.fn(event => event);

      migrator.registerMigration(eventType, fromVersion, toVersion, transformer);

      // Act
      const path = migrator.discoverMigrationPath(eventType, fromVersion, toVersion);

      // Assert
      expect(path).not.toBeNull();
      expect(path).toHaveLength(1);
      expect(path?.[0].fromVersion).toBe(fromVersion);
      expect(path?.[0].toVersion).toBe(toVersion);
    });

    it('should discover multi-step migration path', () => {
      // Arrange
      const eventType = 'test.event';
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const v3 = '3.0.0';
      const transformer = jest.fn(event => event);

      // Register v1 -> v2 and v2 -> v3 migrations
      migrator.registerMigration(eventType, v1, v2, transformer);
      migrator.registerMigration(eventType, v2, v3, transformer);

      // Act
      const path = migrator.discoverMigrationPath(eventType, v1, v3);

      // Assert
      expect(path).not.toBeNull();
      expect(path).toHaveLength(2);
      expect(path?.[0].fromVersion).toBe(v1);
      expect(path?.[0].toVersion).toBe(v2);
      expect(path?.[1].fromVersion).toBe(v2);
      expect(path?.[1].toVersion).toBe(v3);
    });

    it('should return null when no migration path exists', () => {
      // Arrange
      const eventType = 'test.event';
      const v1 = '1.0.0';
      const v3 = '3.0.0';

      // No migrations registered

      // Act
      const path = migrator.discoverMigrationPath(eventType, v1, v3);

      // Assert
      expect(path).toBeNull();
    });

    it('should return empty array when source and target versions are the same', () => {
      // Arrange
      const eventType = 'test.event';
      const version = '1.0.0';

      // Act
      const path = migrator.discoverMigrationPath(eventType, version, version);

      // Assert
      expect(path).toEqual([]);
    });

    it('should find the shortest path when multiple paths exist', () => {
      // Arrange
      const eventType = 'test.event';
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const v3 = '3.0.0';
      const transformer = jest.fn(event => event);

      // Register v1 -> v2, v2 -> v3, and direct v1 -> v3 migrations
      migrator.registerMigration(eventType, v1, v2, transformer);
      migrator.registerMigration(eventType, v2, v3, transformer);
      migrator.registerMigration(eventType, v1, v3, transformer);

      // Act
      const path = migrator.discoverMigrationPath(eventType, v1, v3);

      // Assert
      expect(path).not.toBeNull();
      expect(path).toHaveLength(1); // Should find the direct path
      expect(path?.[0].fromVersion).toBe(v1);
      expect(path?.[0].toVersion).toBe(v3);
    });
  });

  describe('Event Migration', () => {
    it('should migrate event with direct path', async () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version: fromVersion,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };
      
      const transformer = jest.fn((event: TestEventV1) => {
        return {
          ...event,
          version: toVersion,
          payload: {
            ...event.payload,
            metadata: {
              createdAt: new Date().toISOString(),
            },
          },
        } as TestEventV2;
      });

      migrator.registerMigration(eventType, fromVersion, toVersion, transformer);

      // Act
      const result = await migrator.migrateEvent(sourceEvent, toVersion);

      // Assert
      expect(result.success).toBe(true);
      expect(result.originalEvent).toBe(sourceEvent);
      expect(result.migratedEvent.version).toBe(toVersion);
      expect(result.fromVersion).toBe(fromVersion);
      expect(result.toVersion).toBe(toVersion);
      expect(result.migrationPath).toHaveLength(1);
      expect(transformer).toHaveBeenCalledWith(sourceEvent);
      
      // Check the transformed event structure
      const migratedEvent = result.migratedEvent as TestEventV2;
      expect(migratedEvent.payload.name).toBe(sourceEvent.payload.name);
      expect(migratedEvent.payload.value).toBe(sourceEvent.payload.value);
      expect(migratedEvent.payload.metadata).toBeDefined();
      expect(migratedEvent.payload.metadata.createdAt).toBeDefined();
    });

    it('should migrate event with multi-step path', async () => {
      // Arrange
      const eventType = 'test.event';
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const v3 = '3.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version: v1,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };
      
      const transformer1to2 = jest.fn((event: TestEventV1) => {
        return {
          ...event,
          version: v2,
          payload: {
            ...event.payload,
            metadata: {
              createdAt: new Date().toISOString(),
            },
          },
        } as TestEventV2;
      });
      
      const transformer2to3 = jest.fn((event: TestEventV2) => {
        return {
          ...event,
          version: v3,
          payload: {
            ...event.payload,
            metadata: {
              ...event.payload.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        } as TestEventV3;
      });

      migrator.registerMigration(eventType, v1, v2, transformer1to2);
      migrator.registerMigration(eventType, v2, v3, transformer2to3);

      // Act
      const result = await migrator.migrateEvent(sourceEvent, v3);

      // Assert
      expect(result.success).toBe(true);
      expect(result.originalEvent).toBe(sourceEvent);
      expect(result.migratedEvent.version).toBe(v3);
      expect(result.fromVersion).toBe(v1);
      expect(result.toVersion).toBe(v3);
      expect(result.migrationPath).toHaveLength(2);
      expect(transformer1to2).toHaveBeenCalledWith(sourceEvent);
      
      // Check the transformed event structure
      const migratedEvent = result.migratedEvent as TestEventV3;
      expect(migratedEvent.payload.name).toBe(sourceEvent.payload.name);
      expect(migratedEvent.payload.value).toBe(sourceEvent.payload.value);
      expect(migratedEvent.payload.metadata).toBeDefined();
      expect(migratedEvent.payload.metadata.createdAt).toBeDefined();
      expect(migratedEvent.payload.metadata.updatedAt).toBeDefined();
      
      // Verify the second transformer was called with the output of the first transformer
      const expectedInputForSecondTransformer = transformer1to2.mock.results[0].value;
      expect(transformer2to3).toHaveBeenCalledWith(expectedInputForSecondTransformer);
    });

    it('should return the original event when already at target version', async () => {
      // Arrange
      const eventType = 'test.event';
      const version = '1.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };
      
      const transformer = jest.fn((event: TestEventV1) => event);

      // Act
      const result = await migrator.migrateEvent(sourceEvent, version);

      // Assert
      expect(result.success).toBe(true);
      expect(result.originalEvent).toBe(sourceEvent);
      expect(result.migratedEvent).toBe(sourceEvent);
      expect(result.fromVersion).toBe(version);
      expect(result.toVersion).toBe(version);
      expect(result.migrationPath).toHaveLength(0);
      expect(transformer).not.toHaveBeenCalled();
    });

    it('should throw MigrationPathNotFoundError when no path exists', async () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '3.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version: fromVersion,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };

      // No migrations registered

      // Act & Assert
      await expect(migrator.migrateEvent(sourceEvent, toVersion))
        .rejects
        .toThrow(MigrationPathNotFoundError);
    });

    it('should validate migrated event when validation is enabled', async () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version: fromVersion,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };
      
      const transformer = jest.fn((event: TestEventV1) => {
        return {
          ...event,
          version: toVersion,
          payload: {
            ...event.payload,
            metadata: {
              createdAt: new Date().toISOString(),
            },
          },
        } as TestEventV2;
      });
      
      // Validator that always fails
      const validator = jest.fn(() => false);

      migrator.registerMigration(eventType, fromVersion, toVersion, transformer, validator);

      // Act & Assert
      await expect(migrator.migrateEvent(sourceEvent, toVersion, {
        ...DEFAULT_MIGRATION_OPTIONS,
        validateResult: true,
      }))
        .rejects
        .toThrow(ValidationError);
      
      expect(transformer).toHaveBeenCalledWith(sourceEvent);
      expect(validator).toHaveBeenCalled();
    });

    it('should handle migration execution errors', async () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version: fromVersion,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };
      
      // Transformer that throws an error
      const transformer = jest.fn(() => {
        throw new Error('Transformation failed');
      });

      migrator.registerMigration(eventType, fromVersion, toVersion, transformer);

      // Act & Assert
      await expect(migrator.migrateEvent(sourceEvent, toVersion))
        .rejects
        .toThrow(MigrationExecutionError);
      
      expect(transformer).toHaveBeenCalledWith(sourceEvent);
    });
  });

  describe('Rollback Functionality', () => {
    it('should rollback to original event on validation error when rollbackOnError is true', async () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version: fromVersion,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };
      
      const transformer = jest.fn((event: TestEventV1) => {
        return {
          ...event,
          version: toVersion,
          payload: {
            ...event.payload,
            metadata: {
              createdAt: new Date().toISOString(),
            },
          },
        } as TestEventV2;
      });
      
      // Validator that always fails
      const validator = jest.fn(() => false);

      migrator.registerMigration(eventType, fromVersion, toVersion, transformer, validator);

      // Act
      const result = await migrator.migrateEvent(sourceEvent, toVersion, {
        validateResult: true,
        rollbackOnError: true,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.originalEvent).toBe(sourceEvent);
      expect(result.migratedEvent).toBe(sourceEvent); // Should be rolled back to original
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(transformer).toHaveBeenCalledWith(sourceEvent);
      expect(validator).toHaveBeenCalled();
    });

    it('should rollback to original event on execution error when rollbackOnError is true', async () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version: fromVersion,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };
      
      // Transformer that throws an error
      const transformer = jest.fn(() => {
        throw new Error('Transformation failed');
      });

      migrator.registerMigration(eventType, fromVersion, toVersion, transformer);

      // Act
      const result = await migrator.migrateEvent(sourceEvent, toVersion, {
        rollbackOnError: true,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.originalEvent).toBe(sourceEvent);
      expect(result.migratedEvent).toBe(sourceEvent); // Should be rolled back to original
      expect(result.error).toBeDefined();
      expect(transformer).toHaveBeenCalledWith(sourceEvent);
    });
  });

  describe('Compatibility Checks', () => {
    it('should check if direct migration is possible', () => {
      // Arrange
      const eventType = 'test.event';
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const v3 = '3.0.0';
      const transformer = jest.fn(event => event);

      migrator.registerMigration(eventType, v1, v2, transformer);

      // Act & Assert
      expect(migrator.canMigrateDirect(eventType, v1, v2)).toBe(true);
      expect(migrator.canMigrateDirect(eventType, v1, v3)).toBe(false);
      expect(migrator.canMigrateDirect(eventType, v2, v3)).toBe(false);
    });

    it('should check if any migration path is possible', () => {
      // Arrange
      const eventType = 'test.event';
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const v3 = '3.0.0';
      const transformer = jest.fn(event => event);

      migrator.registerMigration(eventType, v1, v2, transformer);
      migrator.registerMigration(eventType, v2, v3, transformer);

      // Act & Assert
      expect(migrator.canMigrate(eventType, v1, v2)).toBe(true);
      expect(migrator.canMigrate(eventType, v2, v3)).toBe(true);
      expect(migrator.canMigrate(eventType, v1, v3)).toBe(true); // Multi-step path
      expect(migrator.canMigrate(eventType, v3, v1)).toBe(false); // No path in reverse direction
    });

    it('should return true when source and target versions are the same', () => {
      // Arrange
      const eventType = 'test.event';
      const version = '1.0.0';

      // Act & Assert
      expect(migrator.canMigrate(eventType, version, version)).toBe(true);
      expect(migrator.canMigrateDirect(eventType, version, version)).toBe(true);
    });
  });

  describe('Singleton Functions', () => {
    beforeEach(() => {
      // Reset the singleton instance for each test
      // This is a bit of a hack, but it's necessary to test the singleton functions
      // @ts-ignore - Accessing private property for testing
      schemaMigrator.registry = new Map();
      // @ts-ignore - Accessing private property for testing
      schemaMigrator.validators = new Map();
    });

    it('should register migration using singleton function', () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const transformer = jest.fn(event => event);

      // Act
      registerMigration(eventType, fromVersion, toVersion, transformer);

      // Assert
      const migrations = schemaMigrator.getMigrations(eventType);
      expect(migrations).toHaveLength(1);
      expect(migrations[0].eventType).toBe(eventType);
      expect(migrations[0].fromVersion).toBe(fromVersion);
      expect(migrations[0].toVersion).toBe(toVersion);
    });

    it('should register bidirectional migration using singleton function', () => {
      // Arrange
      const eventType = 'test.event';
      const version1 = '1.0.0';
      const version2 = '2.0.0';
      const upgradeTransformer = jest.fn(event => event);
      const downgradeTransformer = jest.fn(event => event);

      // Act
      registerBidirectionalMigration(
        eventType,
        version1,
        version2,
        upgradeTransformer,
        downgradeTransformer
      );

      // Assert
      const migrations = schemaMigrator.getMigrations(eventType);
      expect(migrations).toHaveLength(2);
    });

    it('should check migration possibility using singleton function', () => {
      // Arrange
      const eventType = 'test.event';
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const transformer = jest.fn(event => event);

      registerMigration(eventType, v1, v2, transformer);

      // Act & Assert
      expect(canMigrate(eventType, v1, v2)).toBe(true);
      expect(canMigrate(eventType, v2, v1)).toBe(false);
    });

    it('should discover migration path using singleton function', () => {
      // Arrange
      const eventType = 'test.event';
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const v3 = '3.0.0';
      const transformer = jest.fn(event => event);

      registerMigration(eventType, v1, v2, transformer);
      registerMigration(eventType, v2, v3, transformer);

      // Act
      const path = discoverMigrationPath(eventType, v1, v3);

      // Assert
      expect(path).not.toBeNull();
      expect(path).toHaveLength(2);
    });

    it('should migrate event using singleton function', async () => {
      // Arrange
      const eventType = 'test.event';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const eventId = 'test-event-1';
      
      const sourceEvent: TestEventV1 = {
        version: fromVersion,
        type: eventType,
        eventId,
        payload: {
          name: 'Test Event',
          value: 42,
        },
      };
      
      const transformer = jest.fn((event: TestEventV1) => {
        return {
          ...event,
          version: toVersion,
          payload: {
            ...event.payload,
            metadata: {
              createdAt: new Date().toISOString(),
            },
          },
        } as TestEventV2;
      });

      registerMigration(eventType, fromVersion, toVersion, transformer);

      // Act
      const result = await migrateEvent(sourceEvent, toVersion);

      // Assert
      expect(result.success).toBe(true);
      expect(result.migratedEvent.version).toBe(toVersion);
    });
  });
});