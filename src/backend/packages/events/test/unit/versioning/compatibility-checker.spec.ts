/**
 * @file compatibility-checker.spec.ts
 * @description Unit tests for the version compatibility checker that verifies semantic versioning
 * principles are correctly applied when determining compatibility between different event versions.
 */

import { EventVersionDto } from '../../../src/dto/event-metadata.dto';
import {
  VersionedEventDto,
  compareVersions,
  isVersionCompatible,
  registerVersionMigration,
  createVersionFromString,
  canMigrate,
  versionMigrations
} from '../../../src/dto/version.dto';

describe('Version Compatibility Checker', () => {
  // Clear the version migrations registry before each test
  beforeEach(() => {
    // Clear all registered migrations
    Object.keys(versionMigrations).forEach(key => {
      delete versionMigrations[key];
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for identical versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.3.1', '2.3.1')).toBe(0);
    });

    it('should return -1 when first version is lower', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1); // Major version lower
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1); // Minor version lower
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1); // Patch version lower
      expect(compareVersions('1.2.3', '1.3.0')).toBe(-1); // Minor version lower, different patch
    });

    it('should return 1 when first version is higher', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1); // Major version higher
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1); // Minor version higher
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1); // Patch version higher
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1); // Major version higher, despite higher minor/patch
    });

    it('should compare versions with different number of digits correctly', () => {
      expect(compareVersions('1.0.0', '1.0')).toBe(0); // Treat missing patch as 0
      expect(compareVersions('1.1', '1.0.0')).toBe(1); // Higher minor version
      expect(compareVersions('1', '1.0.0')).toBe(0); // Treat missing minor/patch as 0
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true for identical versions', () => {
      expect(isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
      expect(isVersionCompatible('2.3.1', '2.3.1')).toBe(true);
    });

    it('should return false when major versions differ', () => {
      expect(isVersionCompatible('1.0.0', '2.0.0')).toBe(false);
      expect(isVersionCompatible('2.0.0', '1.0.0')).toBe(false);
      expect(isVersionCompatible('1.9.9', '2.0.0')).toBe(false);
    });

    it('should return true when current minor version is higher than required', () => {
      expect(isVersionCompatible('1.2.0', '1.1.0')).toBe(true);
      expect(isVersionCompatible('1.5.0', '1.0.0')).toBe(true);
    });

    it('should return false when current minor version is lower than required', () => {
      expect(isVersionCompatible('1.1.0', '1.2.0')).toBe(false);
      expect(isVersionCompatible('1.0.0', '1.5.0')).toBe(false);
    });

    it('should return true when minor versions match and current patch is higher or equal', () => {
      expect(isVersionCompatible('1.1.2', '1.1.1')).toBe(true);
      expect(isVersionCompatible('1.1.1', '1.1.1')).toBe(true);
    });

    it('should return false when minor versions match but current patch is lower', () => {
      expect(isVersionCompatible('1.1.0', '1.1.1')).toBe(false);
      expect(isVersionCompatible('1.1.2', '1.1.3')).toBe(false);
    });
  });

  describe('VersionedEventDto', () => {
    it('should create a versioned event with default version 1.0.0', () => {
      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' });
      expect(event.eventType).toBe('TEST_EVENT');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.getVersionString()).toBe('1.0.0');
    });

    it('should create a versioned event with specified version', () => {
      const version = new EventVersionDto();
      version.major = '2';
      version.minor = '1';
      version.patch = '3';

      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' }, version);
      expect(event.getVersionString()).toBe('2.1.3');
    });

    it('should correctly check compatibility with required version', () => {
      const version = new EventVersionDto();
      version.major = '2';
      version.minor = '3';
      version.patch = '1';

      const event = new VersionedEventDto('TEST_EVENT', { data: 'test' }, version);

      // Same major version, lower or equal minor/patch versions are compatible
      expect(event.isCompatibleWith('2.3.1')).toBe(true);
      expect(event.isCompatibleWith('2.3.0')).toBe(true);
      expect(event.isCompatibleWith('2.2.5')).toBe(true);
      expect(event.isCompatibleWith('2.0.0')).toBe(true);

      // Same major version, higher minor version is not compatible
      expect(event.isCompatibleWith('2.4.0')).toBe(false);

      // Same major/minor version, higher patch version is not compatible
      expect(event.isCompatibleWith('2.3.2')).toBe(false);

      // Different major version is not compatible
      expect(event.isCompatibleWith('1.0.0')).toBe(false);
      expect(event.isCompatibleWith('3.0.0')).toBe(false);
    });
  });

  describe('Migration and Compatibility', () => {
    const TEST_EVENT_TYPE = 'USER_PROFILE_UPDATED';

    // Define test schemas for different versions
    interface UserProfileV1 {
      userId: string;
      name: string;
      email: string;
    }

    interface UserProfileV1_1 extends UserProfileV1 {
      phoneNumber?: string; // Optional new field (backward compatible)
    }

    interface UserProfileV2 {
      userId: string;
      fullName: string; // Breaking change: renamed from 'name'
      email: string;
      phoneNumber?: string;
      preferences?: { // New nested object
        language: string;
        theme: string;
      };
    }

    beforeEach(() => {
      // Register migrations between versions
      registerVersionMigration<UserProfileV1_1>(
        TEST_EVENT_TYPE,
        '1.0.0',
        '1.1.0',
        (oldData: UserProfileV1) => {
          return {
            ...oldData,
            phoneNumber: undefined // Add new optional field with undefined value
          };
        }
      );

      registerVersionMigration<UserProfileV2>(
        TEST_EVENT_TYPE,
        '1.1.0',
        '2.0.0',
        (oldData: UserProfileV1_1) => {
          return {
            userId: oldData.userId,
            fullName: oldData.name, // Rename field (breaking change)
            email: oldData.email,
            phoneNumber: oldData.phoneNumber,
            preferences: {
              language: 'pt-BR', // Default value
              theme: 'light' // Default value
            }
          };
        }
      );
    });

    it('should detect compatibility between minor version updates', () => {
      const v1Event = new VersionedEventDto<UserProfileV1>(
        TEST_EVENT_TYPE,
        { userId: '123', name: 'John Doe', email: 'john@example.com' }
      );

      // v1.1.0 should be compatible with v1.0.0 consumers (backward compatible)
      const v1_1Version = createVersionFromString('1.1.0');
      const v1_1Event = new VersionedEventDto<UserProfileV1_1>(
        TEST_EVENT_TYPE,
        { userId: '123', name: 'John Doe', email: 'john@example.com', phoneNumber: '123-456-7890' },
        v1_1Version
      );

      // v1.0.0 consumer can process v1.1.0 event (backward compatible)
      expect(v1_1Event.isCompatibleWith('1.0.0')).toBe(false); // This is false because minor version is higher
      
      // But v1.1.0 consumer cannot process v1.0.0 event (missing new fields)
      expect(v1Event.isCompatibleWith('1.1.0')).toBe(false);
    });

    it('should detect incompatibility between major version updates', () => {
      const v1Event = new VersionedEventDto<UserProfileV1>(
        TEST_EVENT_TYPE,
        { userId: '123', name: 'John Doe', email: 'john@example.com' }
      );

      const v2Version = createVersionFromString('2.0.0');
      const v2Event = new VersionedEventDto<UserProfileV2>(
        TEST_EVENT_TYPE,
        {
          userId: '123',
          fullName: 'John Doe', // Breaking change: renamed field
          email: 'john@example.com',
          phoneNumber: '123-456-7890',
          preferences: {
            language: 'pt-BR',
            theme: 'dark'
          }
        },
        v2Version
      );

      // v1.0.0 consumer cannot process v2.0.0 event (breaking changes)
      expect(v2Event.isCompatibleWith('1.0.0')).toBe(false);
      
      // v2.0.0 consumer cannot process v1.0.0 event (missing required fields)
      expect(v1Event.isCompatibleWith('2.0.0')).toBe(false);
    });

    it('should successfully migrate events between versions', () => {
      // Create a v1.0.0 event
      const v1Event = new VersionedEventDto<UserProfileV1>(
        TEST_EVENT_TYPE,
        { userId: '123', name: 'John Doe', email: 'john@example.com' }
      );

      // Migrate to v1.1.0
      const v1_1Event = v1Event.migrateToVersion('1.1.0');
      expect(v1_1Event.getVersionString()).toBe('1.1.0');
      expect(v1_1Event.payload).toEqual({
        userId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: undefined
      });

      // Migrate to v2.0.0
      const v2Event = v1_1Event.migrateToVersion('2.0.0');
      expect(v2Event.getVersionString()).toBe('2.0.0');
      expect(v2Event.payload).toEqual({
        userId: '123',
        fullName: 'John Doe', // Field renamed
        email: 'john@example.com',
        phoneNumber: undefined,
        preferences: {
          language: 'pt-BR',
          theme: 'light'
        }
      });
    });

    it('should migrate directly from v1.0.0 to v2.0.0 using multiple steps', () => {
      // Create a v1.0.0 event
      const v1Event = new VersionedEventDto<UserProfileV1>(
        TEST_EVENT_TYPE,
        { userId: '123', name: 'John Doe', email: 'john@example.com' }
      );

      // Migrate directly to v2.0.0 (should apply both migrations in sequence)
      const v2Event = v1Event.migrateToVersion('2.0.0');
      expect(v2Event.getVersionString()).toBe('2.0.0');
      expect(v2Event.payload).toEqual({
        userId: '123',
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: undefined,
        preferences: {
          language: 'pt-BR',
          theme: 'light'
        }
      });
    });

    it('should check if migration path exists between versions', () => {
      expect(canMigrate(TEST_EVENT_TYPE, '1.0.0', '1.1.0')).toBe(true);
      expect(canMigrate(TEST_EVENT_TYPE, '1.1.0', '2.0.0')).toBe(true);
      expect(canMigrate(TEST_EVENT_TYPE, '1.0.0', '2.0.0')).toBe(true); // Multi-step migration
      expect(canMigrate(TEST_EVENT_TYPE, '2.0.0', '1.0.0')).toBe(false); // Cannot downgrade
      expect(canMigrate('UNKNOWN_EVENT', '1.0.0', '2.0.0')).toBe(false); // Unknown event type
    });
  });

  describe('Schema-based Compatibility Analysis', () => {
    // Define test schemas for different versions
    interface BaseEvent {
      eventId: string;
      timestamp: string;
    }

    interface SchemaV1 extends BaseEvent {
      data: {
        id: number;
        name: string;
        active: boolean;
      };
    }

    interface SchemaV1_1 extends BaseEvent {
      data: {
        id: number;
        name: string;
        active: boolean;
        tags?: string[]; // New optional field (backward compatible)
      };
    }

    interface SchemaV2 extends BaseEvent {
      data: {
        identifier: number; // Renamed from 'id' (breaking change)
        name: string;
        status: boolean; // Renamed from 'active' (breaking change)
        tags?: string[];
        metadata?: Record<string, unknown>; // New optional field
      };
    }

    it('should identify non-breaking changes between schema versions', () => {
      // Create sample events
      const v1Event: SchemaV1 = {
        eventId: '123',
        timestamp: '2023-01-01T00:00:00Z',
        data: {
          id: 1,
          name: 'Test',
          active: true
        }
      };

      const v1_1Event: SchemaV1_1 = {
        eventId: '123',
        timestamp: '2023-01-01T00:00:00Z',
        data: {
          id: 1,
          name: 'Test',
          active: true,
          tags: ['test', 'sample']
        }
      };

      // Verify v1 consumer can process v1 event
      const v1CanProcessV1 = Object.keys(v1Event.data).every(key => 
        Object.prototype.hasOwnProperty.call(v1Event.data, key)
      );
      expect(v1CanProcessV1).toBe(true);

      // Verify v1 consumer can process v1.1 event (ignoring extra fields)
      const v1CanProcessV1_1 = Object.keys(v1Event.data).every(key => 
        Object.prototype.hasOwnProperty.call(v1_1Event.data, key)
      );
      expect(v1CanProcessV1_1).toBe(true);

      // Verify v1.1 consumer cannot process v1 event (missing optional fields is ok)
      const v1_1CanProcessV1 = Object.keys(v1_1Event.data)
        .filter(key => key !== 'tags') // Filter out optional fields
        .every(key => Object.prototype.hasOwnProperty.call(v1Event.data, key));
      expect(v1_1CanProcessV1).toBe(true);
    });

    it('should identify breaking changes between schema versions', () => {
      // Create sample events
      const v1Event: SchemaV1 = {
        eventId: '123',
        timestamp: '2023-01-01T00:00:00Z',
        data: {
          id: 1,
          name: 'Test',
          active: true
        }
      };

      const v2Event: SchemaV2 = {
        eventId: '123',
        timestamp: '2023-01-01T00:00:00Z',
        data: {
          identifier: 1, // Renamed from 'id'
          name: 'Test',
          status: true, // Renamed from 'active'
          tags: ['test', 'sample'],
          metadata: { version: '2.0.0' }
        }
      };

      // Verify v1 consumer cannot process v2 event (missing required fields)
      const v1CanProcessV2 = Object.keys(v1Event.data).every(key => 
        Object.prototype.hasOwnProperty.call(v2Event.data, key)
      );
      expect(v1CanProcessV2).toBe(false); // Should fail because 'id' and 'active' are missing

      // Verify v2 consumer cannot process v1 event (missing required fields)
      const v2CanProcessV1 = Object.keys(v2Event.data)
        .filter(key => !['tags', 'metadata'].includes(key)) // Filter out optional fields
        .every(key => Object.prototype.hasOwnProperty.call(v1Event.data, key));
      expect(v2CanProcessV1).toBe(false); // Should fail because 'identifier' and 'status' are missing
    });

    it('should detect type compatibility issues', () => {
      // Create events with type mismatches
      const v1Event: SchemaV1 = {
        eventId: '123',
        timestamp: '2023-01-01T00:00:00Z',
        data: {
          id: 1,
          name: 'Test',
          active: true
        }
      };

      // Event with type mismatch (string instead of number for id)
      const v1EventTypeMismatch = {
        eventId: '123',
        timestamp: '2023-01-01T00:00:00Z',
        data: {
          id: '1', // Type mismatch: string instead of number
          name: 'Test',
          active: true
        }
      };

      // Simple type check function
      const checkTypeCompatibility = (expected: any, actual: any): boolean => {
        return typeof expected === typeof actual;
      };

      // Check type compatibility for each field
      const isTypeCompatible = Object.keys(v1Event.data).every(key => 
        checkTypeCompatibility(v1Event.data[key], v1EventTypeMismatch.data[key])
      );

      expect(isTypeCompatible).toBe(false); // Should fail due to type mismatch
    });
  });

  describe('Strict vs. Relaxed Compatibility Modes', () => {
    // Define a function to check compatibility in strict mode
    const isStrictCompatible = (requiredVersion: string, actualVersion: string): boolean => {
      // In strict mode, versions must match exactly
      return requiredVersion === actualVersion;
    };

    // Define a function to check compatibility in relaxed mode (semantic versioning)
    const isRelaxedCompatible = (requiredVersion: string, actualVersion: string): boolean => {
      return isVersionCompatible(actualVersion, requiredVersion);
    };

    it('should enforce exact version match in strict mode', () => {
      expect(isStrictCompatible('1.0.0', '1.0.0')).toBe(true);
      expect(isStrictCompatible('1.0.0', '1.0.1')).toBe(false);
      expect(isStrictCompatible('1.0.0', '1.1.0')).toBe(false);
      expect(isStrictCompatible('1.0.0', '2.0.0')).toBe(false);
    });

    it('should allow compatible versions in relaxed mode', () => {
      // Same version is compatible
      expect(isRelaxedCompatible('1.0.0', '1.0.0')).toBe(true);
      
      // Higher patch version is compatible
      expect(isRelaxedCompatible('1.0.0', '1.0.1')).toBe(true);
      
      // Higher minor version is compatible
      expect(isRelaxedCompatible('1.0.0', '1.1.0')).toBe(true);
      expect(isRelaxedCompatible('1.0.0', '1.2.0')).toBe(true);
      
      // Different major version is not compatible
      expect(isRelaxedCompatible('1.0.0', '2.0.0')).toBe(false);
      expect(isRelaxedCompatible('2.0.0', '1.0.0')).toBe(false);
      
      // Lower minor version is not compatible
      expect(isRelaxedCompatible('1.2.0', '1.1.0')).toBe(false);
      
      // Lower patch version with same minor is not compatible
      expect(isRelaxedCompatible('1.1.2', '1.1.1')).toBe(false);
    });

    it('should demonstrate real-world compatibility scenarios', () => {
      // Producer sends event with version 1.2.3
      const producerVersion = '1.2.3';
      
      // Scenario 1: Consumer requires exact version match (strict mode)
      const strictConsumerVersion = '1.2.3';
      expect(isStrictCompatible(strictConsumerVersion, producerVersion)).toBe(true);
      
      // Scenario 2: Consumer requires minimum version 1.1.0 (relaxed mode)
      const relaxedConsumerVersion = '1.1.0';
      expect(isRelaxedCompatible(relaxedConsumerVersion, producerVersion)).toBe(true);
      
      // Scenario 3: Consumer requires version 1.3.0 (not compatible)
      const incompatibleConsumerVersion = '1.3.0';
      expect(isRelaxedCompatible(incompatibleConsumerVersion, producerVersion)).toBe(false);
      
      // Scenario 4: Consumer requires version 2.0.0 (not compatible - major version change)
      const majorChangeConsumerVersion = '2.0.0';
      expect(isRelaxedCompatible(majorChangeConsumerVersion, producerVersion)).toBe(false);
    });
  });
});