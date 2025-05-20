/**
 * @file version.dto.spec.ts
 * @description Unit tests for the VersionDto class that validate event schema versioning support.
 * Tests verify semantic versioning format validation, compatibility layer functionality, and version
 * migration utilities. These tests ensure proper schema evolution with backward compatibility,
 * allowing the system to handle older event versions while supporting new fields and validation rules.
 */

import {
  VersionedEventDto,
  compareVersions,
  isVersionCompatible,
  registerVersionMigration,
  createVersionedEvent,
  upgradeEventPayload,
  createVersionFromString,
  getLatestVersion,
  canMigrate,
  registerMigrationChain,
  versionMigrations
} from '../../../src/dto/version.dto';
import { EventVersionDto } from '../../../src/dto/event-metadata.dto';

// Clear all registered migrations before each test
beforeEach(() => {
  // Clear the versionMigrations object
  Object.keys(versionMigrations).forEach(key => {
    delete versionMigrations[key];
  });
});

describe('Version Comparison and Compatibility', () => {
  describe('compareVersions', () => {
    it('should return 0 for identical versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.3.1', '2.3.1')).toBe(0);
    });

    it('should return -1 when first version is lower', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1); // Major version lower
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1); // Minor version lower
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1); // Patch version lower
      expect(compareVersions('1.2.3', '1.2.4')).toBe(-1); // Patch version lower
    });

    it('should return 1 when first version is higher', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1); // Major version higher
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1); // Minor version higher
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1); // Patch version higher
      expect(compareVersions('2.2.3', '1.9.9')).toBe(1); // Major version higher, despite minor/patch
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true for identical versions', () => {
      expect(isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
      expect(isVersionCompatible('2.3.1', '2.3.1')).toBe(true);
    });

    it('should return true when current version has higher minor version', () => {
      expect(isVersionCompatible('1.2.0', '1.1.0')).toBe(true);
      expect(isVersionCompatible('1.5.0', '1.0.0')).toBe(true);
    });

    it('should return true when current version has higher patch version', () => {
      expect(isVersionCompatible('1.1.2', '1.1.1')).toBe(true);
      expect(isVersionCompatible('1.1.5', '1.1.0')).toBe(true);
    });

    it('should return true when current version has higher minor and patch version', () => {
      expect(isVersionCompatible('1.2.3', '1.1.0')).toBe(true);
    });

    it('should return false when major versions differ', () => {
      expect(isVersionCompatible('2.0.0', '1.0.0')).toBe(false);
      expect(isVersionCompatible('1.0.0', '2.0.0')).toBe(false);
    });

    it('should return false when current minor version is lower', () => {
      expect(isVersionCompatible('1.0.0', '1.1.0')).toBe(false);
      expect(isVersionCompatible('1.1.0', '1.2.0')).toBe(false);
    });

    it('should return false when minor versions match but current patch is lower', () => {
      expect(isVersionCompatible('1.1.0', '1.1.1')).toBe(false);
      expect(isVersionCompatible('1.1.1', '1.1.2')).toBe(false);
    });
  });
});

describe('VersionedEventDto', () => {
  describe('constructor', () => {
    it('should create a versioned event with default version 1.0.0', () => {
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' });
      
      expect(event.eventType).toBe('TEST_EVENT');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.version).toBeDefined();
      expect(event.version.major).toBe('1');
      expect(event.version.minor).toBe('0');
      expect(event.version.patch).toBe('0');
    });

    it('should create a versioned event with custom version', () => {
      const version = new EventVersionDto();
      version.major = '2';
      version.minor = '1';
      version.patch = '3';
      
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' }, version);
      
      expect(event.eventType).toBe('TEST_EVENT');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.version).toBe(version);
      expect(event.getVersionString()).toBe('2.1.3');
    });
  });

  describe('getVersionString', () => {
    it('should return the version as a string in semver format', () => {
      const version = new EventVersionDto();
      version.major = '2';
      version.minor = '1';
      version.patch = '3';
      
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' }, version);
      
      expect(event.getVersionString()).toBe('2.1.3');
    });
  });

  describe('isCompatibleWith', () => {
    it('should return true when event version is compatible with required version', () => {
      const version = new EventVersionDto();
      version.major = '1';
      version.minor = '2';
      version.patch = '3';
      
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' }, version);
      
      expect(event.isCompatibleWith('1.1.0')).toBe(true);
      expect(event.isCompatibleWith('1.2.0')).toBe(true);
      expect(event.isCompatibleWith('1.2.2')).toBe(true);
      expect(event.isCompatibleWith('1.0.0')).toBe(true);
    });

    it('should return false when event version is not compatible with required version', () => {
      const version = new EventVersionDto();
      version.major = '1';
      version.minor = '2';
      version.patch = '3';
      
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' }, version);
      
      expect(event.isCompatibleWith('2.0.0')).toBe(false);
      expect(event.isCompatibleWith('1.3.0')).toBe(false);
      expect(event.isCompatibleWith('1.2.4')).toBe(false);
    });
  });

  describe('migrateToVersion', () => {
    it('should return the same instance if already at target version', () => {
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' });
      const migrated = event.migrateToVersion('1.0.0');
      
      expect(migrated).toBe(event);
    });

    it('should throw an error if no migrations are registered for the event type', () => {
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' });
      
      expect(() => event.migrateToVersion('1.1.0')).toThrow(
        'No migrations registered for event type: TEST_EVENT'
      );
    });

    it('should apply a direct migration if available', () => {
      // Register a migration from 1.0.0 to 1.1.0
      registerVersionMigration('TEST_EVENT', '1.0.0', '1.1.0', (oldData) => {
        return { ...oldData, newField: 'added' };
      });
      
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' });
      const migrated = event.migrateToVersion('1.1.0');
      
      expect(migrated).not.toBe(event); // Should be a new instance
      expect(migrated.eventType).toBe('TEST_EVENT');
      expect(migrated.getVersionString()).toBe('1.1.0');
      expect(migrated.payload).toEqual({ data: 'test', newField: 'added' });
    });

    it('should find and apply a migration path if no direct migration exists', () => {
      // Register migrations to create a path from 1.0.0 to 1.2.0
      registerVersionMigration('TEST_EVENT', '1.0.0', '1.1.0', (oldData) => {
        return { ...oldData, field1: 'added' };
      });
      
      registerVersionMigration('TEST_EVENT', '1.1.0', '1.2.0', (oldData) => {
        return { ...oldData, field2: 'also added' };
      });
      
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' });
      const migrated = event.migrateToVersion('1.2.0');
      
      expect(migrated.getVersionString()).toBe('1.2.0');
      expect(migrated.payload).toEqual({
        data: 'test',
        field1: 'added',
        field2: 'also added'
      });
    });

    it('should throw an error if no migration path exists', () => {
      // Register a migration that doesn't create a path to the target
      registerVersionMigration('TEST_EVENT', '1.0.0', '1.1.0', (oldData) => {
        return { ...oldData, field1: 'added' };
      });
      
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' });
      
      expect(() => event.migrateToVersion('2.0.0')).toThrow(
        'No migration path exists from version 1.0.0 to 2.0.0 for event type: TEST_EVENT'
      );
    });
  });
});

describe('Migration Registration and Execution', () => {
  describe('registerVersionMigration', () => {
    it('should register a migration function for a specific event type and version', () => {
      registerVersionMigration('TEST_EVENT', '1.0.0', '1.1.0', (oldData) => {
        return { ...oldData, newField: 'added' };
      });
      
      expect(versionMigrations['TEST_EVENT']).toBeDefined();
      expect(versionMigrations['TEST_EVENT']['1.0.0->1.1.0']).toBeDefined();
      expect(typeof versionMigrations['TEST_EVENT']['1.0.0->1.1.0']).toBe('function');
    });

    it('should allow registering multiple migrations for the same event type', () => {
      registerVersionMigration('TEST_EVENT', '1.0.0', '1.1.0', (oldData) => {
        return { ...oldData, field1: 'added' };
      });
      
      registerVersionMigration('TEST_EVENT', '1.1.0', '1.2.0', (oldData) => {
        return { ...oldData, field2: 'also added' };
      });
      
      expect(Object.keys(versionMigrations['TEST_EVENT'])).toHaveLength(2);
      expect(versionMigrations['TEST_EVENT']['1.0.0->1.1.0']).toBeDefined();
      expect(versionMigrations['TEST_EVENT']['1.1.0->1.2.0']).toBeDefined();
    });
  });

  describe('registerMigrationChain', () => {
    it('should register multiple migrations at once', () => {
      registerMigrationChain('TEST_EVENT', [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrationFn: (oldData) => ({ ...oldData, field1: 'added' })
        },
        {
          fromVersion: '1.1.0',
          toVersion: '1.2.0',
          migrationFn: (oldData) => ({ ...oldData, field2: 'also added' })
        },
        {
          fromVersion: '1.2.0',
          toVersion: '2.0.0',
          migrationFn: (oldData) => ({
            newFormat: true,
            data: oldData.data,
            fields: {
              field1: oldData.field1,
              field2: oldData.field2
            }
          })
        }
      ]);
      
      expect(Object.keys(versionMigrations['TEST_EVENT'])).toHaveLength(3);
      expect(versionMigrations['TEST_EVENT']['1.0.0->1.1.0']).toBeDefined();
      expect(versionMigrations['TEST_EVENT']['1.1.0->1.2.0']).toBeDefined();
      expect(versionMigrations['TEST_EVENT']['1.2.0->2.0.0']).toBeDefined();
    });
  });

  describe('Migration Path Finding', () => {
    beforeEach(() => {
      // Set up a complex migration graph
      registerMigrationChain('TEST_EVENT', [
        { fromVersion: '1.0.0', toVersion: '1.1.0', migrationFn: (d) => d },
        { fromVersion: '1.1.0', toVersion: '1.2.0', migrationFn: (d) => d },
        { fromVersion: '1.0.0', toVersion: '2.0.0', migrationFn: (d) => d }, // Direct path
        { fromVersion: '1.2.0', toVersion: '2.0.0', migrationFn: (d) => d },
        { fromVersion: '2.0.0', toVersion: '2.1.0', migrationFn: (d) => d },
        { fromVersion: '2.1.0', toVersion: '3.0.0', migrationFn: (d) => d },
      ]);
    });

    it('should find a direct migration path when available', () => {
      const event = createVersionedEvent('TEST_EVENT', { data: 'test' });
      const migrated = event.migrateToVersion('2.0.0');
      
      // Should use the direct path from 1.0.0 to 2.0.0
      expect(migrated.getVersionString()).toBe('2.0.0');
    });

    it('should find the shortest migration path when multiple paths exist', () => {
      // Create a versioned event at version 1.1.0
      const version = createVersionFromString('1.1.0');
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' }, version);
      
      // Spy on the migration functions to see which ones are called
      const spy1 = jest.spyOn(versionMigrations['TEST_EVENT']['1.1.0->1.2.0'], 'apply');
      const spy2 = jest.spyOn(versionMigrations['TEST_EVENT']['1.2.0->2.0.0'], 'apply');
      
      const migrated = event.migrateToVersion('2.0.0');
      
      // Should use the path 1.1.0 -> 1.2.0 -> 2.0.0
      expect(migrated.getVersionString()).toBe('2.0.0');
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('should find a multi-step migration path when needed', () => {
      const event = createVersionedEvent('TEST_EVENT', { data: 'test' });
      const migrated = event.migrateToVersion('3.0.0');
      
      // Should find the path from 1.0.0 to 3.0.0
      expect(migrated.getVersionString()).toBe('3.0.0');
    });
  });
});

describe('Helper Functions', () => {
  describe('createVersionedEvent', () => {
    it('should create a versioned event with default version 1.0.0', () => {
      const event = createVersionedEvent('TEST_EVENT', { data: 'test' });
      
      expect(event.eventType).toBe('TEST_EVENT');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.getVersionString()).toBe('1.0.0');
    });
  });

  describe('upgradeEventPayload', () => {
    beforeEach(() => {
      registerMigrationChain('TEST_EVENT', [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrationFn: (oldData) => ({ ...oldData, field1: 'added' })
        },
        {
          fromVersion: '1.1.0',
          toVersion: '2.0.0',
          migrationFn: (oldData) => ({
            newFormat: true,
            data: oldData.data,
            field1: oldData.field1
          })
        }
      ]);
    });

    it('should upgrade a payload to the target version', () => {
      const payload = { data: 'test' };
      const upgraded = upgradeEventPayload('TEST_EVENT', payload, '1.0.0', '2.0.0');
      
      expect(upgraded).toEqual({
        newFormat: true,
        data: 'test',
        field1: 'added'
      });
    });

    it('should throw an error if no migration path exists', () => {
      const payload = { data: 'test' };
      
      expect(() => {
        upgradeEventPayload('TEST_EVENT', payload, '1.0.0', '3.0.0');
      }).toThrow(
        'No migration path exists from version 1.0.0 to 3.0.0 for event type: TEST_EVENT'
      );
    });
  });

  describe('createVersionFromString', () => {
    it('should create a version object from a version string', () => {
      const version = createVersionFromString('2.3.4');
      
      expect(version).toBeInstanceOf(EventVersionDto);
      expect(version.major).toBe('2');
      expect(version.minor).toBe('3');
      expect(version.patch).toBe('4');
    });

    it('should handle partial version strings', () => {
      const version1 = createVersionFromString('2');
      expect(version1.major).toBe('2');
      expect(version1.minor).toBe('0');
      expect(version1.patch).toBe('0');
      
      const version2 = createVersionFromString('2.3');
      expect(version2.major).toBe('2');
      expect(version2.minor).toBe('3');
      expect(version2.patch).toBe('0');
    });
  });

  describe('getLatestVersion', () => {
    it('should return 1.0.0 if no migrations are registered', () => {
      expect(getLatestVersion('UNKNOWN_EVENT')).toBe('1.0.0');
    });

    it('should find the latest version from registered migrations', () => {
      registerMigrationChain('TEST_EVENT', [
        { fromVersion: '1.0.0', toVersion: '1.1.0', migrationFn: (d) => d },
        { fromVersion: '1.1.0', toVersion: '2.0.0', migrationFn: (d) => d },
        { fromVersion: '2.0.0', toVersion: '2.1.0', migrationFn: (d) => d },
      ]);
      
      expect(getLatestVersion('TEST_EVENT')).toBe('2.1.0');
    });
  });

  describe('canMigrate', () => {
    beforeEach(() => {
      registerMigrationChain('TEST_EVENT', [
        { fromVersion: '1.0.0', toVersion: '1.1.0', migrationFn: (d) => d },
        { fromVersion: '1.1.0', toVersion: '2.0.0', migrationFn: (d) => d },
      ]);
    });

    it('should return true if a migration path exists', () => {
      expect(canMigrate('TEST_EVENT', '1.0.0', '2.0.0')).toBe(true);
    });

    it('should return false if no migration path exists', () => {
      expect(canMigrate('TEST_EVENT', '1.0.0', '3.0.0')).toBe(false);
    });

    it('should return false for unknown event types', () => {
      expect(canMigrate('UNKNOWN_EVENT', '1.0.0', '2.0.0')).toBe(false);
    });
  });
});

describe('Integration with Event Processing', () => {
  // Define a sample event type for testing
  interface UserCreatedEvent {
    userId: string;
    email: string;
    createdAt: string;
    preferences?: {
      language?: string;
      notifications?: boolean;
    };
  }

  beforeEach(() => {
    // Register migrations for the USER_CREATED event
    registerMigrationChain<UserCreatedEvent>('USER_CREATED', [
      {
        // v1.0.0 to v1.1.0: Add preferences object with default language
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        migrationFn: (oldData) => ({
          ...oldData,
          preferences: { language: 'pt-BR' }
        })
      },
      {
        // v1.1.0 to v2.0.0: Restructure the event with nested preferences
        fromVersion: '1.1.0',
        toVersion: '2.0.0',
        migrationFn: (oldData) => ({
          ...oldData,
          preferences: {
            ...oldData.preferences,
            notifications: true
          }
        })
      }
    ]);
  });

  it('should process events with different versions correctly', () => {
    // Create events with different versions
    const v1Event = createVersionedEvent<UserCreatedEvent>('USER_CREATED', {
      userId: '123',
      email: 'user@example.com',
      createdAt: new Date().toISOString()
    });

    const v11Version = createVersionFromString('1.1.0');
    const v11Event = new VersionedEventDto<UserCreatedEvent>('USER_CREATED', {
      userId: '456',
      email: 'another@example.com',
      createdAt: new Date().toISOString(),
      preferences: { language: 'en-US' }
    }, v11Version);

    // Simulate an event processor that requires v2.0.0
    function processEvent(event: VersionedEventDto<UserCreatedEvent>): UserCreatedEvent {
      const requiredVersion = '2.0.0';
      
      if (!event.isCompatibleWith(requiredVersion)) {
        return event.migrateToVersion(requiredVersion).payload;
      }
      
      return event.payload;
    }

    // Process the events
    const processedV1 = processEvent(v1Event);
    const processedV11 = processEvent(v11Event);

    // Verify the results
    expect(processedV1.preferences).toBeDefined();
    expect(processedV1.preferences.language).toBe('pt-BR');
    expect(processedV1.preferences.notifications).toBe(true);

    expect(processedV11.preferences).toBeDefined();
    expect(processedV11.preferences.language).toBe('en-US');
    expect(processedV11.preferences.notifications).toBe(true);
  });

  it('should handle complex migration scenarios with multiple paths', () => {
    // Add a direct migration from v1.0.0 to v2.0.0
    registerVersionMigration<UserCreatedEvent>('USER_CREATED', '1.0.0', '2.0.0', (oldData) => ({
      ...oldData,
      preferences: {
        language: 'pt-BR',
        notifications: true,
        directMigration: true // Special flag to indicate direct migration
      }
    }));

    // Create a v1.0.0 event
    const v1Event = createVersionedEvent<UserCreatedEvent>('USER_CREATED', {
      userId: '123',
      email: 'user@example.com',
      createdAt: new Date().toISOString()
    });

    // Migrate directly to v2.0.0
    const migratedEvent = v1Event.migrateToVersion('2.0.0');

    // Verify that the direct migration was used
    expect(migratedEvent.payload.preferences).toBeDefined();
    expect(migratedEvent.payload.preferences.directMigration).toBe(true);
  });

  it('should maintain data integrity during migrations', () => {
    // Create a v1.0.0 event with specific data
    const originalEvent = createVersionedEvent<UserCreatedEvent>('USER_CREATED', {
      userId: 'user-123',
      email: 'test@example.com',
      createdAt: '2023-01-01T12:00:00Z'
    });

    // Migrate to v2.0.0
    const migratedEvent = originalEvent.migrateToVersion('2.0.0');

    // Verify that the original data is preserved
    expect(migratedEvent.payload.userId).toBe('user-123');
    expect(migratedEvent.payload.email).toBe('test@example.com');
    expect(migratedEvent.payload.createdAt).toBe('2023-01-01T12:00:00Z');
    
    // And new data is added correctly
    expect(migratedEvent.payload.preferences).toBeDefined();
    expect(migratedEvent.payload.preferences.language).toBe('pt-BR');
    expect(migratedEvent.payload.preferences.notifications).toBe(true);
  });
});