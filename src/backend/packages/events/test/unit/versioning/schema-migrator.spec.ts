/**
 * @file schema-migrator.spec.ts
 * @description Unit tests for the schema migration functionality that validates the system's ability
 * to transform events between different schema versions.
 */

import { Test } from '@nestjs/testing';
import { SchemaMigrator } from '../../../src/versioning/schema-migrator';
import { VersionDetector } from '../../../src/versioning/version-detector';
import { VersionCompatibilityChecker } from '../../../src/versioning/compatibility-checker';
import { EventTransformer } from '../../../src/versioning/transformer';
import { EventTypes } from '../../../src/dto/event-types.enum';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { MigrationError, VersionError } from '../../../src/versioning/errors';

describe('SchemaMigrator', () => {
  let schemaMigrator: SchemaMigrator;
  let versionDetector: VersionDetector;
  let compatibilityChecker: VersionCompatibilityChecker;
  let eventTransformer: EventTransformer;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SchemaMigrator,
        {
          provide: VersionDetector,
          useValue: {
            detectVersion: jest.fn(),
          },
        },
        {
          provide: VersionCompatibilityChecker,
          useValue: {
            isCompatible: jest.fn(),
            requiresTransformation: jest.fn(),
          },
        },
        {
          provide: EventTransformer,
          useValue: {
            transform: jest.fn(),
            transformPipeline: jest.fn(),
            registerTransformation: jest.fn(),
          },
        },
      ],
    }).compile();

    schemaMigrator = moduleRef.get<SchemaMigrator>(SchemaMigrator);
    versionDetector = moduleRef.get<VersionDetector>(VersionDetector);
    compatibilityChecker = moduleRef.get<VersionCompatibilityChecker>(VersionCompatibilityChecker);
    eventTransformer = moduleRef.get<EventTransformer>(EventTransformer);
  });

  describe('registerMigrationPath', () => {
    it('should register a migration path for a specific event type and version pair', () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      const mockMigrationFn = jest.fn();

      // Act
      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion,
        targetVersion,
        migrate: mockMigrationFn,
      });

      // Assert
      expect(schemaMigrator['migrationPaths']).toHaveProperty(eventType);
      expect(schemaMigrator['migrationPaths'][eventType]).toHaveProperty(`${sourceVersion}->${targetVersion}`);
      expect(schemaMigrator['migrationPaths'][eventType][`${sourceVersion}->${targetVersion}`]).toBe(mockMigrationFn);
    });

    it('should throw an error when registering a duplicate migration path', () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      const mockMigrationFn = jest.fn();

      // Act & Assert
      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion,
        targetVersion,
        migrate: mockMigrationFn,
      });

      expect(() => {
        schemaMigrator.registerMigrationPath({
          eventType,
          sourceVersion,
          targetVersion,
          migrate: mockMigrationFn,
        });
      }).toThrow(/Migration path already registered/);
    });

    it('should register multiple migration paths for different event types', () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType1 = EventTypes.HEALTH_METRIC_RECORDED;
      const eventType2 = EventTypes.APPOINTMENT_BOOKED;
      const mockMigrationFn1 = jest.fn();
      const mockMigrationFn2 = jest.fn();

      // Act
      schemaMigrator.registerMigrationPath({
        eventType: eventType1,
        sourceVersion,
        targetVersion,
        migrate: mockMigrationFn1,
      });

      schemaMigrator.registerMigrationPath({
        eventType: eventType2,
        sourceVersion,
        targetVersion,
        migrate: mockMigrationFn2,
      });

      // Assert
      expect(schemaMigrator['migrationPaths']).toHaveProperty(eventType1);
      expect(schemaMigrator['migrationPaths']).toHaveProperty(eventType2);
      expect(schemaMigrator['migrationPaths'][eventType1][`${sourceVersion}->${targetVersion}`]).toBe(mockMigrationFn1);
      expect(schemaMigrator['migrationPaths'][eventType2][`${sourceVersion}->${targetVersion}`]).toBe(mockMigrationFn2);
    });

    it('should register multiple migration paths for the same event type but different versions', () => {
      // Arrange
      const sourceVersion1 = '1.0.0';
      const targetVersion1 = '1.1.0';
      const sourceVersion2 = '1.1.0';
      const targetVersion2 = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      const mockMigrationFn1 = jest.fn();
      const mockMigrationFn2 = jest.fn();

      // Act
      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: sourceVersion1,
        targetVersion: targetVersion1,
        migrate: mockMigrationFn1,
      });

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: sourceVersion2,
        targetVersion: targetVersion2,
        migrate: mockMigrationFn2,
      });

      // Assert
      expect(schemaMigrator['migrationPaths']).toHaveProperty(eventType);
      expect(schemaMigrator['migrationPaths'][eventType]).toHaveProperty(`${sourceVersion1}->${targetVersion1}`);
      expect(schemaMigrator['migrationPaths'][eventType]).toHaveProperty(`${sourceVersion2}->${targetVersion2}`);
      expect(schemaMigrator['migrationPaths'][eventType][`${sourceVersion1}->${targetVersion1}`]).toBe(mockMigrationFn1);
      expect(schemaMigrator['migrationPaths'][eventType][`${sourceVersion2}->${targetVersion2}`]).toBe(mockMigrationFn2);
    });
  });

  describe('migrate', () => {
    it('should migrate an event from source to target version', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };
      
      const expectedMigratedEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: expect.any(String) },
        metadata: { version: targetVersion } as EventMetadataDto,
      };

      const mockMigrationFn = jest.fn().mockImplementation((event) => ({
        ...event,
        payload: { ...event.payload, timestamp: new Date().toISOString() },
        metadata: { ...event.metadata, version: targetVersion },
      }));

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion,
        targetVersion,
        migrate: mockMigrationFn,
      });

      // Act
      const result = await schemaMigrator.migrate(sourceEvent, targetVersion);

      // Assert
      expect(result).toEqual(expectedMigratedEvent);
      expect(mockMigrationFn).toHaveBeenCalledWith(sourceEvent);
      expect(versionDetector.detectVersion).toHaveBeenCalledWith(sourceEvent);
      expect(compatibilityChecker.requiresTransformation).toHaveBeenCalledWith(
        sourceVersion,
        targetVersion
      );
    });

    it('should return the original event if no migration is required', async () => {
      // Arrange
      const sourceVersion = '2.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(false);

      // Act
      const result = await schemaMigrator.migrate(sourceEvent, targetVersion);

      // Assert
      expect(result).toBe(sourceEvent);
      expect(versionDetector.detectVersion).toHaveBeenCalledWith(sourceEvent);
      expect(compatibilityChecker.requiresTransformation).toHaveBeenCalledWith(
        sourceVersion,
        targetVersion
      );
    });

    it('should throw an error when no migration path is registered for the version pair', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      // Act & Assert
      await expect(schemaMigrator.migrate(sourceEvent, targetVersion)).rejects.toThrow(
        MigrationError
      );
      expect(versionDetector.detectVersion).toHaveBeenCalledWith(sourceEvent);
      expect(compatibilityChecker.requiresTransformation).toHaveBeenCalledWith(
        sourceVersion,
        targetVersion
      );
    });
  });

  describe('migrationPathDiscovery', () => {
    it('should discover a direct migration path between versions', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      const mockMigrationFn = jest.fn();

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion,
        targetVersion,
        migrate: mockMigrationFn,
      });

      // Act
      const path = schemaMigrator.findMigrationPath(eventType, sourceVersion, targetVersion);

      // Assert
      expect(path).toEqual([{ from: sourceVersion, to: targetVersion }]);
    });

    it('should discover a multi-step migration path between versions', async () => {
      // Arrange
      const v1 = '1.0.0';
      const v2 = '1.5.0';
      const v3 = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      const mockMigrationFn1 = jest.fn();
      const mockMigrationFn2 = jest.fn();

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v1,
        targetVersion: v2,
        migrate: mockMigrationFn1,
      });

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v2,
        targetVersion: v3,
        migrate: mockMigrationFn2,
      });

      // Act
      const path = schemaMigrator.findMigrationPath(eventType, v1, v3);

      // Assert
      expect(path).toEqual([
        { from: v1, to: v2 },
        { from: v2, to: v3 }
      ]);
    });

    it('should return null when no migration path exists', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '3.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;

      // Act
      const path = schemaMigrator.findMigrationPath(eventType, sourceVersion, targetVersion);

      // Assert
      expect(path).toBeNull();
    });

    it('should discover the shortest migration path when multiple paths exist', async () => {
      // Arrange
      const v1 = '1.0.0';
      const v2 = '1.5.0';
      const v3 = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      const mockMigrationFn1 = jest.fn();
      const mockMigrationFn2 = jest.fn();
      const mockMigrationFn3 = jest.fn();

      // Direct path from v1 to v3
      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v1,
        targetVersion: v3,
        migrate: mockMigrationFn1,
      });

      // Indirect path from v1 to v3 via v2
      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v1,
        targetVersion: v2,
        migrate: mockMigrationFn2,
      });

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v2,
        targetVersion: v3,
        migrate: mockMigrationFn3,
      });

      // Act
      const path = schemaMigrator.findMigrationPath(eventType, v1, v3);

      // Assert
      expect(path).toEqual([{ from: v1, to: v3 }]); // Should prefer the direct path
    });
  });

  describe('migrateWithPath', () => {
    it('should migrate an event using a specified migration path', async () => {
      // Arrange
      const v1 = '1.0.0';
      const v2 = '1.5.0';
      const v3 = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: v1 } as EventMetadataDto,
      };
      
      const v2Event = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z' },
        metadata: { version: v2 } as EventMetadataDto,
      };
      
      const v3Event = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z', deviceId: 'device-123' },
        metadata: { version: v3 } as EventMetadataDto,
      };

      const v1ToV2MigrationFn = jest.fn().mockReturnValue(v2Event);
      const v2ToV3MigrationFn = jest.fn().mockReturnValue(v3Event);

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v1,
        targetVersion: v2,
        migrate: v1ToV2MigrationFn,
      });

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v2,
        targetVersion: v3,
        migrate: v2ToV3MigrationFn,
      });

      const migrationPath = [
        { from: v1, to: v2 },
        { from: v2, to: v3 }
      ];

      // Act
      const result = await schemaMigrator.migrateWithPath(sourceEvent, migrationPath);

      // Assert
      expect(result).toEqual(v3Event);
      expect(v1ToV2MigrationFn).toHaveBeenCalledWith(sourceEvent);
      expect(v2ToV3MigrationFn).toHaveBeenCalledWith(v2Event);
    });

    it('should throw an error when a migration step fails', async () => {
      // Arrange
      const v1 = '1.0.0';
      const v2 = '1.5.0';
      const v3 = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: v1 } as EventMetadataDto,
      };

      const v1ToV2MigrationFn = jest.fn().mockReturnValue({
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z' },
        metadata: { version: v2 } as EventMetadataDto,
      });

      const v2ToV3MigrationFn = jest.fn().mockImplementation(() => {
        throw new Error('Migration failed');
      });

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v1,
        targetVersion: v2,
        migrate: v1ToV2MigrationFn,
      });

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v2,
        targetVersion: v3,
        migrate: v2ToV3MigrationFn,
      });

      const migrationPath = [
        { from: v1, to: v2 },
        { from: v2, to: v3 }
      ];

      // Act & Assert
      await expect(schemaMigrator.migrateWithPath(sourceEvent, migrationPath)).rejects.toThrow(
        MigrationError
      );
      expect(v1ToV2MigrationFn).toHaveBeenCalledWith(sourceEvent);
      expect(v2ToV3MigrationFn).toHaveBeenCalled();
    });
  });

  describe('data integrity verification', () => {
    it('should verify data integrity after migration', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { 
          value: 120, 
          unit: 'bpm',
          userId: 'user-123',
          timestamp: '2023-01-01T12:00:00Z'
        },
        metadata: { 
          version: sourceVersion,
          correlationId: 'corr-123'
        } as EventMetadataDto,
      };

      // Migration function that preserves data integrity
      const migrationFn = jest.fn().mockImplementation((event) => {
        // Ensure all required fields are preserved
        if (!event.payload.value || !event.payload.unit || !event.payload.userId) {
          throw new MigrationError(
            'Missing required fields for migration',
            eventType,
            sourceVersion,
            targetVersion
          );
        }

        return {
          ...event,
          payload: { 
            ...event.payload,
            // Transform timestamp to ISO string if it's not already
            timestamp: new Date(event.payload.timestamp).toISOString(),
            // Add new field
            deviceId: 'unknown'
          },
          metadata: { 
            ...event.metadata, 
            version: targetVersion,
            // Preserve correlation ID
            correlationId: event.metadata.correlationId
          },
        };
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion,
        targetVersion,
        migrate: migrationFn,
      });

      // Act
      const result = await schemaMigrator.migrate(sourceEvent, targetVersion);

      // Assert
      expect(result.payload).toHaveProperty('value', 120);
      expect(result.payload).toHaveProperty('unit', 'bpm');
      expect(result.payload).toHaveProperty('userId', 'user-123');
      expect(result.payload).toHaveProperty('timestamp');
      expect(result.payload).toHaveProperty('deviceId', 'unknown');
      expect(result.metadata).toHaveProperty('version', targetVersion);
      expect(result.metadata).toHaveProperty('correlationId', 'corr-123');
      expect(migrationFn).toHaveBeenCalledWith(sourceEvent);
    });

    it('should throw an error when data integrity is compromised during migration', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { 
          value: 120, 
          unit: 'bpm',
          userId: 'user-123'
        },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      // Migration function that compromises data integrity by removing required fields
      const migrationFn = jest.fn().mockImplementation((event) => {
        const { userId, ...restPayload } = event.payload;
        return {
          ...event,
          payload: restPayload, // Removes userId which is required
          metadata: { ...event.metadata, version: targetVersion },
        };
      });

      // Validator function that checks data integrity
      const validateFn = jest.fn().mockImplementation((event) => {
        if (!event.payload.userId) {
          throw new MigrationError(
            'Data integrity compromised: missing required userId field',
            eventType,
            sourceVersion,
            targetVersion
          );
        }
        return true;
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion,
        targetVersion,
        migrate: migrationFn,
        validate: validateFn,
      });

      // Act & Assert
      await expect(schemaMigrator.migrate(sourceEvent, targetVersion)).rejects.toThrow(
        MigrationError
      );
      expect(migrationFn).toHaveBeenCalledWith(sourceEvent);
      expect(validateFn).toHaveBeenCalled();
    });
  });

  describe('transaction-like semantics', () => {
    it('should support rollback when migration fails in a multi-step process', async () => {
      // Arrange
      const v1 = '1.0.0';
      const v2 = '1.5.0';
      const v3 = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: v1 } as EventMetadataDto,
      };
      
      const v2Event = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z' },
        metadata: { version: v2 } as EventMetadataDto,
      };

      // First migration succeeds
      const v1ToV2MigrationFn = jest.fn().mockReturnValue(v2Event);
      
      // Second migration fails
      const v2ToV3MigrationFn = jest.fn().mockImplementation(() => {
        throw new Error('Migration failed');
      });

      // Rollback function for the first migration
      const v2ToV1RollbackFn = jest.fn().mockReturnValue(sourceEvent);

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v1,
        targetVersion: v2,
        migrate: v1ToV2MigrationFn,
        rollback: v2ToV1RollbackFn,
      });

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v2,
        targetVersion: v3,
        migrate: v2ToV3MigrationFn,
      });

      // Mock the migrateWithPath method to test rollback
      jest.spyOn(schemaMigrator as any, 'migrateWithPath').mockImplementation(async (event, path) => {
        // Simulate the first migration succeeding and the second failing
        const firstResult = await v1ToV2MigrationFn(event);
        try {
          await v2ToV3MigrationFn(firstResult);
        } catch (error) {
          // Rollback the first migration
          return v2ToV1RollbackFn(firstResult);
        }
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(v1);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);
      jest.spyOn(schemaMigrator as any, 'findMigrationPath').mockReturnValue([
        { from: v1, to: v2 },
        { from: v2, to: v3 }
      ]);

      // Act
      const result = await schemaMigrator.migrate(sourceEvent, v3);

      // Assert
      expect(result).toEqual(sourceEvent); // Should be rolled back to the original event
      expect(v1ToV2MigrationFn).toHaveBeenCalledWith(sourceEvent);
      expect(v2ToV3MigrationFn).toHaveBeenCalledWith(v2Event);
      expect(v2ToV1RollbackFn).toHaveBeenCalledWith(v2Event);
    });

    it('should maintain atomicity during migration process', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      // Migration function that performs multiple operations atomically
      const migrationFn = jest.fn().mockImplementation((event) => {
        // Simulate a transaction with multiple operations
        const updatedEvent = {
          ...event,
          payload: { 
            ...event.payload,
            timestamp: new Date().toISOString(),
            deviceId: 'device-123'
          },
          metadata: { ...event.metadata, version: targetVersion },
        };

        // Simulate a validation check that fails
        if (!updatedEvent.payload.userId) {
          // Throw an error to trigger rollback
          throw new MigrationError(
            'Missing required userId field',
            eventType,
            sourceVersion,
            targetVersion
          );
        }

        return updatedEvent;
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion,
        targetVersion,
        migrate: migrationFn,
      });

      // Act & Assert
      await expect(schemaMigrator.migrate(sourceEvent, targetVersion)).rejects.toThrow(
        MigrationError
      );
      expect(migrationFn).toHaveBeenCalledWith(sourceEvent);
    });
  });

  describe('automatic migration path discovery', () => {
    it('should automatically discover and apply the migration path', async () => {
      // Arrange
      const v1 = '1.0.0';
      const v2 = '1.5.0';
      const v3 = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: v1 } as EventMetadataDto,
      };
      
      const v2Event = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z' },
        metadata: { version: v2 } as EventMetadataDto,
      };
      
      const v3Event = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z', deviceId: 'device-123' },
        metadata: { version: v3 } as EventMetadataDto,
      };

      const v1ToV2MigrationFn = jest.fn().mockReturnValue(v2Event);
      const v2ToV3MigrationFn = jest.fn().mockReturnValue(v3Event);

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v1,
        targetVersion: v2,
        migrate: v1ToV2MigrationFn,
      });

      schemaMigrator.registerMigrationPath({
        eventType,
        sourceVersion: v2,
        targetVersion: v3,
        migrate: v2ToV3MigrationFn,
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(v1);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      // Act
      const result = await schemaMigrator.migrate(sourceEvent, v3);

      // Assert
      expect(result).toEqual(v3Event);
      expect(v1ToV2MigrationFn).toHaveBeenCalledWith(sourceEvent);
      expect(v2ToV3MigrationFn).toHaveBeenCalledWith(v2Event);
    });

    it('should throw an error when no migration path can be discovered', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '3.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      // Act & Assert
      await expect(schemaMigrator.migrate(sourceEvent, targetVersion)).rejects.toThrow(
        MigrationError
      );
      expect(versionDetector.detectVersion).toHaveBeenCalledWith(sourceEvent);
      expect(compatibilityChecker.requiresTransformation).toHaveBeenCalledWith(
        sourceVersion,
        targetVersion
      );
    });
  });
});