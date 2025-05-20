/**
 * @file event-versioning.integration.spec.ts
 * @description Integration tests for event schema versioning capabilities.
 * 
 * This test suite verifies that the system can handle different versions of the same event type,
 * ensuring backward compatibility with older event formats while supporting newer schema features.
 * It tests version upgrade transformations and version validation logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventsModule } from '../../src/events.module';
import { KafkaService } from '../../src/kafka/kafka.service';
import { EventVersionDto, createEventMetadata } from '../../src/dto/event-metadata.dto';
import {
  VersionedEventDto,
  registerVersionMigration,
  createVersionedEvent,
  upgradeEventPayload,
  getLatestVersion,
  isVersionCompatible,
  compareVersions,
  canMigrate,
  versionMigrations,
  registerMigrationChain,
  createVersionFromString
} from '../../src/dto/version.dto';
import { EventType } from '../../src/dto/event-types.enum';

// Test event types
enum TestEventType {
  USER_CREATED = 'USER_CREATED',
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED'
}

// Test event payloads
interface UserCreatedEventV1 {
  userId: string;
  email: string;
  name: string;
}

interface UserCreatedEventV2 extends UserCreatedEventV1 {
  preferredLanguage: string;
}

interface UserCreatedEventV3 extends UserCreatedEventV2 {
  accountType: string;
  createdAt: string;
}

interface HealthMetricEventV1 {
  userId: string;
  metricType: string;
  value: number;
  unit: string;
  recordedAt: string;
}

interface HealthMetricEventV2 extends HealthMetricEventV1 {
  deviceId?: string;
  notes?: string;
}

interface AppointmentBookedEventV1 {
  userId: string;
  providerId: string;
  appointmentDate: string;
  specialtyId: string;
}

interface AppointmentBookedEventV2 extends AppointmentBookedEventV1 {
  locationId: string;
  notes?: string;
}

describe('Event Versioning Integration Tests', () => {
  let module: TestingModule;
  let kafkaService: KafkaService;

  beforeAll(async () => {
    // Clear any existing migrations before tests
    Object.keys(versionMigrations).forEach(key => {
      delete versionMigrations[key];
    });

    // Register test migrations
    registerTestMigrations();

    module = await Test.createTestingModule({
      imports: [EventsModule],
    }).compile();

    kafkaService = module.get<KafkaService>(KafkaService);
  });

  afterAll(async () => {
    await module.close();
  });

  /**
   * Registers test migrations for different event types
   */
  function registerTestMigrations() {
    // USER_CREATED: v1.0.0 -> v1.1.0 (adds preferredLanguage)
    registerVersionMigration<UserCreatedEventV2>(
      TestEventType.USER_CREATED,
      '1.0.0',
      '1.1.0',
      (oldData: UserCreatedEventV1) => {
        return {
          ...oldData,
          preferredLanguage: 'pt-BR'
        };
      }
    );

    // USER_CREATED: v1.1.0 -> v2.0.0 (adds accountType and createdAt)
    registerVersionMigration<UserCreatedEventV3>(
      TestEventType.USER_CREATED,
      '1.1.0',
      '2.0.0',
      (oldData: UserCreatedEventV2) => {
        return {
          ...oldData,
          accountType: 'standard',
          createdAt: new Date().toISOString()
        };
      }
    );

    // HEALTH_METRIC_RECORDED: v1.0.0 -> v1.1.0 (adds deviceId and notes)
    registerVersionMigration<HealthMetricEventV2>(
      TestEventType.HEALTH_METRIC_RECORDED,
      '1.0.0',
      '1.1.0',
      (oldData: HealthMetricEventV1) => {
        return {
          ...oldData,
          deviceId: undefined,
          notes: undefined
        };
      }
    );

    // APPOINTMENT_BOOKED: v1.0.0 -> v2.0.0 (adds locationId and notes)
    registerVersionMigration<AppointmentBookedEventV2>(
      TestEventType.APPOINTMENT_BOOKED,
      '1.0.0',
      '2.0.0',
      (oldData: AppointmentBookedEventV1) => {
        return {
          ...oldData,
          locationId: 'default-location',
          notes: undefined
        };
      }
    );
  }

  describe('Version Creation and Validation', () => {
    it('should create a versioned event with default version 1.0.0', () => {
      const payload: UserCreatedEventV1 = {
        userId: '123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const event = createVersionedEvent(TestEventType.USER_CREATED, payload);

      expect(event).toBeInstanceOf(VersionedEventDto);
      expect(event.eventType).toBe(TestEventType.USER_CREATED);
      expect(event.payload).toEqual(payload);
      expect(event.getVersionString()).toBe('1.0.0');
    });

    it('should create a versioned event with custom version', () => {
      const payload: UserCreatedEventV2 = {
        userId: '123',
        email: 'user@example.com',
        name: 'Test User',
        preferredLanguage: 'en-US'
      };

      const version = createVersionFromString('1.1.0');
      const event = new VersionedEventDto(TestEventType.USER_CREATED, payload, version);

      expect(event).toBeInstanceOf(VersionedEventDto);
      expect(event.eventType).toBe(TestEventType.USER_CREATED);
      expect(event.payload).toEqual(payload);
      expect(event.getVersionString()).toBe('1.1.0');
    });

    it('should correctly compare versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.1.1')).toBe(-1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('should correctly determine version compatibility', () => {
      // Same version is always compatible
      expect(isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
      
      // Major version must match
      expect(isVersionCompatible('1.0.0', '2.0.0')).toBe(false);
      expect(isVersionCompatible('2.0.0', '1.0.0')).toBe(false);
      
      // Current minor version must be >= required minor version
      expect(isVersionCompatible('1.1.0', '1.0.0')).toBe(true);
      expect(isVersionCompatible('1.0.0', '1.1.0')).toBe(false);
      
      // If minor versions match, current patch must be >= required patch
      expect(isVersionCompatible('1.1.1', '1.1.0')).toBe(true);
      expect(isVersionCompatible('1.1.0', '1.1.1')).toBe(false);
      
      // Higher minor version is compatible regardless of patch
      expect(isVersionCompatible('1.2.0', '1.1.5')).toBe(true);
    });
  });

  describe('Version Migration', () => {
    it('should migrate an event from v1.0.0 to v1.1.0', () => {
      const payload: UserCreatedEventV1 = {
        userId: '123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const event = createVersionedEvent(TestEventType.USER_CREATED, payload);
      const migratedEvent = event.migrateToVersion('1.1.0');

      expect(migratedEvent.getVersionString()).toBe('1.1.0');
      expect(migratedEvent.payload).toHaveProperty('preferredLanguage');
      expect(migratedEvent.payload.preferredLanguage).toBe('pt-BR');
    });

    it('should migrate an event through multiple versions (v1.0.0 -> v2.0.0)', () => {
      const payload: UserCreatedEventV1 = {
        userId: '123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const event = createVersionedEvent(TestEventType.USER_CREATED, payload);
      const migratedEvent = event.migrateToVersion('2.0.0');

      expect(migratedEvent.getVersionString()).toBe('2.0.0');
      expect(migratedEvent.payload).toHaveProperty('preferredLanguage');
      expect(migratedEvent.payload).toHaveProperty('accountType');
      expect(migratedEvent.payload).toHaveProperty('createdAt');
      expect(migratedEvent.payload.preferredLanguage).toBe('pt-BR');
      expect(migratedEvent.payload.accountType).toBe('standard');
    });

    it('should throw an error when no migration path exists', () => {
      const payload = { userId: '123', someField: 'value' };
      const event = createVersionedEvent('UNKNOWN_EVENT_TYPE', payload);

      expect(() => {
        event.migrateToVersion('2.0.0');
      }).toThrow(/No migrations registered for event type/);
    });

    it('should check if a migration path exists', () => {
      expect(canMigrate(TestEventType.USER_CREATED, '1.0.0', '1.1.0')).toBe(true);
      expect(canMigrate(TestEventType.USER_CREATED, '1.0.0', '2.0.0')).toBe(true);
      expect(canMigrate(TestEventType.USER_CREATED, '1.1.0', '1.0.0')).toBe(false);
      expect(canMigrate('UNKNOWN_EVENT_TYPE', '1.0.0', '2.0.0')).toBe(false);
    });

    it('should get the latest version for an event type', () => {
      expect(getLatestVersion(TestEventType.USER_CREATED)).toBe('2.0.0');
      expect(getLatestVersion(TestEventType.HEALTH_METRIC_RECORDED)).toBe('1.1.0');
      expect(getLatestVersion(TestEventType.APPOINTMENT_BOOKED)).toBe('2.0.0');
      expect(getLatestVersion('UNKNOWN_EVENT_TYPE')).toBe('1.0.0');
    });
  });

  describe('Migration Chain Registration', () => {
    it('should register and use a migration chain', () => {
      // Clear existing migrations for this test
      if (versionMigrations['TEST_CHAIN_EVENT']) {
        delete versionMigrations['TEST_CHAIN_EVENT'];
      }

      // Register a chain of migrations
      registerMigrationChain('TEST_CHAIN_EVENT', [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrationFn: (oldData: any) => ({ ...oldData, field1: 'added' })
        },
        {
          fromVersion: '1.1.0',
          toVersion: '1.2.0',
          migrationFn: (oldData: any) => ({ ...oldData, field2: 'added' })
        },
        {
          fromVersion: '1.2.0',
          toVersion: '2.0.0',
          migrationFn: (oldData: any) => ({ ...oldData, field3: 'added' })
        }
      ]);

      // Create a test event
      const payload = { originalField: 'value' };
      const event = createVersionedEvent('TEST_CHAIN_EVENT', payload);

      // Migrate through the chain
      const migratedEvent = event.migrateToVersion('2.0.0');

      // Verify all migrations were applied
      expect(migratedEvent.getVersionString()).toBe('2.0.0');
      expect(migratedEvent.payload).toEqual({
        originalField: 'value',
        field1: 'added',
        field2: 'added',
        field3: 'added'
      });
    });
  });

  describe('Event Payload Upgrade Utility', () => {
    it('should upgrade an event payload directly', () => {
      const payload: UserCreatedEventV1 = {
        userId: '123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const upgradedPayload = upgradeEventPayload<UserCreatedEventV3>(
        TestEventType.USER_CREATED,
        payload,
        '1.0.0',
        '2.0.0'
      );

      expect(upgradedPayload).toHaveProperty('preferredLanguage');
      expect(upgradedPayload).toHaveProperty('accountType');
      expect(upgradedPayload).toHaveProperty('createdAt');
      expect(upgradedPayload.userId).toBe('123');
      expect(upgradedPayload.email).toBe('user@example.com');
      expect(upgradedPayload.name).toBe('Test User');
      expect(upgradedPayload.preferredLanguage).toBe('pt-BR');
      expect(upgradedPayload.accountType).toBe('standard');
    });
  });

  describe('Integration with Kafka Service', () => {
    it('should be able to send and receive versioned events', async () => {
      // Mock the Kafka service methods
      const sendSpy = jest.spyOn(kafkaService, 'send').mockImplementation(async () => {});
      const subscribeSpy = jest.spyOn(kafkaService, 'subscribe').mockImplementation(() => {});

      // Create a versioned event
      const payload: UserCreatedEventV1 = {
        userId: '123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const event = createVersionedEvent(TestEventType.USER_CREATED, payload);

      // Add metadata
      const metadata = createEventMetadata('test-service', {
        correlationId: '550e8400-e29b-41d4-a716-446655440000'
      });

      // Send the event
      await kafkaService.send('test-topic', event, metadata);

      // Verify the event was sent with the correct structure
      expect(sendSpy).toHaveBeenCalledWith('test-topic', event, metadata);

      // Verify the event structure is as expected
      const sentEvent = sendSpy.mock.calls[0][1];
      expect(sentEvent).toBeInstanceOf(VersionedEventDto);
      expect(sentEvent.eventType).toBe(TestEventType.USER_CREATED);
      expect(sentEvent.getVersionString()).toBe('1.0.0');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle events with different versions in the same consumer', () => {
      // Create events with different versions
      const v1Payload: UserCreatedEventV1 = {
        userId: '123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const v2Payload: UserCreatedEventV2 = {
        userId: '456',
        email: 'user2@example.com',
        name: 'Test User 2',
        preferredLanguage: 'en-US'
      };

      const v1Event = createVersionedEvent(TestEventType.USER_CREATED, v1Payload);
      
      const v2Version = createVersionFromString('1.1.0');
      const v2Event = new VersionedEventDto(TestEventType.USER_CREATED, v2Payload, v2Version);

      // Simulate a consumer that expects v1.1.0
      const requiredVersion = '1.1.0';

      // Process v1 event (needs migration)
      let processedV1: UserCreatedEventV2;
      if (!v1Event.isCompatibleWith(requiredVersion)) {
        const migratedEvent = v1Event.migrateToVersion(requiredVersion);
        processedV1 = migratedEvent.payload as UserCreatedEventV2;
      } else {
        processedV1 = v1Event.payload as UserCreatedEventV2;
      }

      // Process v2 event (already compatible)
      let processedV2: UserCreatedEventV2;
      if (!v2Event.isCompatibleWith(requiredVersion)) {
        const migratedEvent = v2Event.migrateToVersion(requiredVersion);
        processedV2 = migratedEvent.payload as UserCreatedEventV2;
      } else {
        processedV2 = v2Event.payload as UserCreatedEventV2;
      }

      // Verify both events were processed correctly
      expect(processedV1).toHaveProperty('preferredLanguage');
      expect(processedV1.userId).toBe('123');
      expect(processedV1.preferredLanguage).toBe('pt-BR');

      expect(processedV2).toHaveProperty('preferredLanguage');
      expect(processedV2.userId).toBe('456');
      expect(processedV2.preferredLanguage).toBe('en-US');
    });

    it('should handle events with major version incompatibility', () => {
      // Create an event with v1.0.0
      const v1Payload: UserCreatedEventV1 = {
        userId: '123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const v1Event = createVersionedEvent(TestEventType.USER_CREATED, v1Payload);

      // Simulate a consumer that requires v3.0.0 (incompatible major version)
      const requiredVersion = '3.0.0';

      // Check compatibility
      const isCompatible = v1Event.isCompatibleWith(requiredVersion);
      expect(isCompatible).toBe(false);

      // Attempt to migrate should throw an error
      expect(() => {
        v1Event.migrateToVersion(requiredVersion);
      }).toThrow(/No migration path exists/);
    });
  });

  describe('Cross-Journey Event Compatibility', () => {
    it('should handle different event types with their own versioning', () => {
      // Create events from different journeys
      const healthEvent = createVersionedEvent(TestEventType.HEALTH_METRIC_RECORDED, {
        userId: '123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date().toISOString()
      });

      const appointmentEvent = createVersionedEvent(TestEventType.APPOINTMENT_BOOKED, {
        userId: '123',
        providerId: 'provider-456',
        appointmentDate: new Date().toISOString(),
        specialtyId: 'cardiology'
      });

      // Migrate both events to their latest versions
      const latestHealthVersion = getLatestVersion(TestEventType.HEALTH_METRIC_RECORDED);
      const latestAppointmentVersion = getLatestVersion(TestEventType.APPOINTMENT_BOOKED);

      const migratedHealthEvent = healthEvent.migrateToVersion(latestHealthVersion);
      const migratedAppointmentEvent = appointmentEvent.migrateToVersion(latestAppointmentVersion);

      // Verify migrations worked correctly
      expect(migratedHealthEvent.getVersionString()).toBe('1.1.0');
      expect(migratedHealthEvent.payload).toHaveProperty('deviceId');
      expect(migratedHealthEvent.payload).toHaveProperty('notes');

      expect(migratedAppointmentEvent.getVersionString()).toBe('2.0.0');
      expect(migratedAppointmentEvent.payload).toHaveProperty('locationId');
      expect(migratedAppointmentEvent.payload).toHaveProperty('notes');
      expect(migratedAppointmentEvent.payload.locationId).toBe('default-location');
    });
  });
});