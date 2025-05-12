import { Test } from '@nestjs/testing';
import { VersionDetector } from '../../src/versioning/version-detector';
import { CompatibilityChecker } from '../../src/versioning/compatibility-checker';
import { SchemaMigrator } from '../../src/versioning/schema-migrator';
import { EventTransformer } from '../../src/versioning/transformer';
import { 
  VersionDetectionError,
  VersionIncompatibleError,
  MigrationFailedError,
  TransformationError 
} from '../../src/versioning/errors';
import { 
  IVersionedEvent, 
  EventVersion,
  EventVersioningStrategy 
} from '../../src/interfaces/event-versioning.interface';
import { 
  healthMetricV1, 
  healthMetricV2, 
  appointmentV1,
  appointmentV2,
  claimV1,
  claimV2,
  breakingChangeEvent,
  nonBreakingChangeEvent
} from '../fixtures/event-versions';
import { mockHealthMetricEvent } from '../utils/mock-events';
import { compareEvents } from '../utils/event-comparison';
import { validateEventSchema } from '../utils/event-validators';

/**
 * Integration tests for event schema versioning capabilities.
 * 
 * This test suite verifies that the system can handle different versions of the same event type,
 * ensuring backward compatibility with older event formats while supporting newer schema features.
 * It tests version upgrade transformations and version validation logic.
 */
describe('Event Versioning Integration', () => {
  let versionDetector: VersionDetector;
  let compatibilityChecker: CompatibilityChecker;
  let schemaMigrator: SchemaMigrator;
  let eventTransformer: EventTransformer;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        VersionDetector,
        CompatibilityChecker,
        SchemaMigrator,
        EventTransformer
      ],
    }).compile();

    versionDetector = moduleRef.get<VersionDetector>(VersionDetector);
    compatibilityChecker = moduleRef.get<CompatibilityChecker>(CompatibilityChecker);
    schemaMigrator = moduleRef.get<SchemaMigrator>(SchemaMigrator);
    eventTransformer = moduleRef.get<EventTransformer>(EventTransformer);
  });

  describe('Version Detection', () => {
    it('should detect version from explicit version field', () => {
      const event = healthMetricV2;
      const version = versionDetector.detectVersion(event);
      expect(version).toEqual('2.0.0');
    });

    it('should detect version from event structure when version field is missing', () => {
      const event = { ...healthMetricV1 };
      delete (event as any).version;
      
      const version = versionDetector.detectVersion(event, {
        fallbackStrategies: [EventVersioningStrategy.STRUCTURE_BASED]
      });
      
      expect(version).toEqual('1.0.0');
    });

    it('should detect version from headers when available', () => {
      const event = { ...healthMetricV1, headers: { 'x-event-version': '1.5.0' } };
      delete (event as any).version;
      
      const version = versionDetector.detectVersion(event, {
        fallbackStrategies: [EventVersioningStrategy.HEADER_BASED],
        headerName: 'x-event-version'
      });
      
      expect(version).toEqual('1.5.0');
    });

    it('should throw VersionDetectionError when version cannot be detected', () => {
      const event = { type: 'UNKNOWN_EVENT', payload: {} };
      
      expect(() => {
        versionDetector.detectVersion(event);
      }).toThrow(VersionDetectionError);
    });
  });

  describe('Compatibility Checking', () => {
    it('should identify compatible versions (same major version)', () => {
      const sourceVersion: EventVersion = '1.2.0';
      const targetVersion: EventVersion = '1.3.5';
      
      const isCompatible = compatibilityChecker.areVersionsCompatible(
        sourceVersion, 
        targetVersion
      );
      
      expect(isCompatible).toBe(true);
    });

    it('should identify incompatible versions (different major versions)', () => {
      const sourceVersion: EventVersion = '1.0.0';
      const targetVersion: EventVersion = '2.0.0';
      
      const isCompatible = compatibilityChecker.areVersionsCompatible(
        sourceVersion, 
        targetVersion
      );
      
      expect(isCompatible).toBe(false);
    });

    it('should validate event compatibility based on schema', () => {
      const isCompatible = compatibilityChecker.isEventCompatible(
        healthMetricV1,
        '2.0.0'
      );
      
      // V1 health metric should be compatible with V2 schema (backward compatibility)
      expect(isCompatible).toBe(true);
    });

    it('should identify breaking changes between event schemas', () => {
      const hasBreakingChanges = compatibilityChecker.hasBreakingChanges(
        breakingChangeEvent.v1,
        breakingChangeEvent.v2
      );
      
      expect(hasBreakingChanges).toBe(true);
    });

    it('should identify non-breaking changes between event schemas', () => {
      const hasBreakingChanges = compatibilityChecker.hasBreakingChanges(
        nonBreakingChangeEvent.v1,
        nonBreakingChangeEvent.v2
      );
      
      expect(hasBreakingChanges).toBe(false);
    });
  });

  describe('Schema Migration', () => {
    beforeEach(() => {
      // Register migration paths for testing
      schemaMigrator.registerMigrationPath({
        sourceVersion: '1.0.0',
        targetVersion: '2.0.0',
        eventType: 'HEALTH_METRIC_RECORDED',
        upgrade: (v1Event) => {
          // Convert v1 to v2 format
          const v2Event = { ...v1Event };
          v2Event.version = '2.0.0';
          
          // In v2, metrics are structured differently
          if (v1Event.payload.metricType && v1Event.payload.value) {
            v2Event.payload.metrics = [{
              type: v1Event.payload.metricType,
              value: v1Event.payload.value,
              unit: v1Event.payload.unit || 'unknown'
            }];
            
            // Remove old fields
            delete v2Event.payload.metricType;
            delete v2Event.payload.value;
            delete v2Event.payload.unit;
          }
          
          return v2Event;
        },
        downgrade: (v2Event) => {
          // Convert v2 back to v1 format
          const v1Event = { ...v2Event };
          v1Event.version = '1.0.0';
          
          // In v1, metrics were flat properties
          if (v2Event.payload.metrics && v2Event.payload.metrics.length > 0) {
            const primaryMetric = v2Event.payload.metrics[0];
            v1Event.payload.metricType = primaryMetric.type;
            v1Event.payload.value = primaryMetric.value;
            v1Event.payload.unit = primaryMetric.unit;
            
            // Remove new field
            delete v1Event.payload.metrics;
          }
          
          return v1Event;
        }
      });
    });

    it('should migrate event from v1 to v2 schema', async () => {
      const migratedEvent = await schemaMigrator.migrateEvent(
        healthMetricV1,
        '2.0.0'
      );
      
      expect(migratedEvent.version).toEqual('2.0.0');
      expect(migratedEvent.payload.metrics).toBeDefined();
      expect(migratedEvent.payload.metrics[0].type).toEqual(healthMetricV1.payload.metricType);
      expect(migratedEvent.payload.metrics[0].value).toEqual(healthMetricV1.payload.value);
      expect(migratedEvent.payload.metricType).toBeUndefined();
    });

    it('should migrate event from v2 to v1 schema', async () => {
      const migratedEvent = await schemaMigrator.migrateEvent(
        healthMetricV2,
        '1.0.0'
      );
      
      expect(migratedEvent.version).toEqual('1.0.0');
      expect(migratedEvent.payload.metricType).toEqual(healthMetricV2.payload.metrics[0].type);
      expect(migratedEvent.payload.value).toEqual(healthMetricV2.payload.metrics[0].value);
      expect(migratedEvent.payload.metrics).toBeUndefined();
    });

    it('should throw MigrationFailedError when no migration path exists', async () => {
      await expect(schemaMigrator.migrateEvent(
        { ...appointmentV1, type: 'UNKNOWN_EVENT_TYPE' },
        '2.0.0'
      )).rejects.toThrow(MigrationFailedError);
    });

    it('should validate migrated event against target schema', async () => {
      const migratedEvent = await schemaMigrator.migrateEvent(
        healthMetricV1,
        '2.0.0'
      );
      
      const isValid = validateEventSchema(migratedEvent, 'HEALTH_METRIC_RECORDED', '2.0.0');
      expect(isValid).toBe(true);
    });
  });

  describe('Event Transformation', () => {
    it('should transform event between versions using registered transformers', () => {
      // Register a test transformer
      eventTransformer.registerTransformer({
        sourceVersion: '1.0.0',
        targetVersion: '2.0.0',
        eventType: 'APPOINTMENT_BOOKED',
        transform: (event) => {
          const transformed = { ...event, version: '2.0.0' };
          
          // In v2, provider information is structured differently
          if (event.payload.providerId && event.payload.providerName) {
            transformed.payload.provider = {
              id: event.payload.providerId,
              name: event.payload.providerName,
              specialty: event.payload.providerSpecialty || 'General'
            };
            
            // Remove old fields
            delete transformed.payload.providerId;
            delete transformed.payload.providerName;
            delete transformed.payload.providerSpecialty;
          }
          
          return transformed;
        }
      });
      
      const transformed = eventTransformer.transformEvent(
        appointmentV1,
        '2.0.0'
      );
      
      expect(transformed.version).toEqual('2.0.0');
      expect(transformed.payload.provider).toBeDefined();
      expect(transformed.payload.provider.id).toEqual(appointmentV1.payload.providerId);
      expect(transformed.payload.providerId).toBeUndefined();
    });

    it('should transform events using automatic field mapping for non-breaking changes', () => {
      const sourceEvent = {
        type: 'TEST_EVENT',
        version: '1.0.0',
        payload: {
          id: '123',
          name: 'Test',
          value: 100
        }
      };
      
      const targetSchema = {
        type: 'TEST_EVENT',
        version: '1.1.0',
        payload: {
          id: '',
          name: '',
          value: 0,
          description: '' // New field in v1.1.0
        }
      };
      
      const transformed = eventTransformer.transformEventWithSchema(
        sourceEvent,
        targetSchema,
        '1.1.0'
      );
      
      expect(transformed.version).toEqual('1.1.0');
      expect(transformed.payload.id).toEqual('123');
      expect(transformed.payload.name).toEqual('Test');
      expect(transformed.payload.value).toEqual(100);
      expect(transformed.payload.description).toEqual(''); // Default value for new field
    });

    it('should throw TransformationError when no transformer exists for the version pair', () => {
      expect(() => {
        eventTransformer.transformEvent(
          claimV1,
          '3.0.0' // No transformer registered for this version
        );
      }).toThrow(TransformationError);
    });

    it('should handle complex nested transformations', () => {
      // Register a test transformer for nested structures
      eventTransformer.registerTransformer({
        sourceVersion: '1.0.0',
        targetVersion: '2.0.0',
        eventType: 'CLAIM_SUBMITTED',
        transform: (event) => {
          const transformed = { ...event, version: '2.0.0' };
          
          // In v2, claim details are structured differently with nested objects
          if (event.payload.claimAmount && event.payload.claimType) {
            transformed.payload.claim = {
              details: {
                amount: {
                  value: event.payload.claimAmount,
                  currency: event.payload.currency || 'BRL'
                },
                type: event.payload.claimType,
                category: event.payload.category || 'General'
              },
              documents: event.payload.documents || []
            };
            
            // Remove old fields
            delete transformed.payload.claimAmount;
            delete transformed.payload.claimType;
            delete transformed.payload.currency;
            delete transformed.payload.category;
            delete transformed.payload.documents;
          }
          
          return transformed;
        }
      });
      
      const transformed = eventTransformer.transformEvent(
        claimV1,
        '2.0.0'
      );
      
      expect(transformed.version).toEqual('2.0.0');
      expect(transformed.payload.claim).toBeDefined();
      expect(transformed.payload.claim.details.amount.value).toEqual(claimV1.payload.claimAmount);
      expect(transformed.payload.claimAmount).toBeUndefined();
      expect(transformed.payload.claimType).toBeUndefined();
    });
  });

  describe('End-to-End Versioning', () => {
    it('should handle the complete versioning workflow for an event', async () => {
      // 1. Create a v1 event
      const originalEvent = healthMetricV1;
      
      // 2. Detect its version
      const detectedVersion = versionDetector.detectVersion(originalEvent);
      expect(detectedVersion).toEqual('1.0.0');
      
      // 3. Check compatibility with target version
      const isCompatible = compatibilityChecker.isEventCompatible(
        originalEvent,
        '2.0.0'
      );
      expect(isCompatible).toBe(true);
      
      // 4. Migrate to target version
      const migratedEvent = await schemaMigrator.migrateEvent(
        originalEvent,
        '2.0.0'
      );
      expect(migratedEvent.version).toEqual('2.0.0');
      
      // 5. Validate the migrated event
      const isValid = validateEventSchema(migratedEvent, 'HEALTH_METRIC_RECORDED', '2.0.0');
      expect(isValid).toBe(true);
      
      // 6. Compare with expected v2 structure
      const isEquivalent = compareEvents(migratedEvent, healthMetricV2, { ignoreTimestamps: true });
      expect(isEquivalent).toBe(true);
    });

    it('should maintain data integrity through multiple version transformations', async () => {
      // Start with v1
      const originalEvent = healthMetricV1;
      
      // Upgrade to v2
      const upgradedEvent = await schemaMigrator.migrateEvent(
        originalEvent,
        '2.0.0'
      );
      
      // Downgrade back to v1
      const downgradedEvent = await schemaMigrator.migrateEvent(
        upgradedEvent,
        '1.0.0'
      );
      
      // The round-trip should preserve the original data
      const isEquivalent = compareEvents(originalEvent, downgradedEvent, { 
        ignoreTimestamps: true,
        ignoreMetadata: true
      });
      
      expect(isEquivalent).toBe(true);
      expect(downgradedEvent.payload.metricType).toEqual(originalEvent.payload.metricType);
      expect(downgradedEvent.payload.value).toEqual(originalEvent.payload.value);
    });

    it('should handle events from different journeys with their specific versioning rules', async () => {
      // Register migration paths for different journeys
      schemaMigrator.registerMigrationPath({
        sourceVersion: '1.0.0',
        targetVersion: '2.0.0',
        eventType: 'APPOINTMENT_BOOKED',
        upgrade: (v1Event) => {
          const v2Event = { ...v1Event, version: '2.0.0' };
          
          // Transform Care journey specific fields
          if (v1Event.payload.providerId) {
            v2Event.payload.provider = {
              id: v1Event.payload.providerId,
              name: v1Event.payload.providerName || 'Unknown',
              specialty: v1Event.payload.providerSpecialty || 'General'
            };
            
            delete v2Event.payload.providerId;
            delete v2Event.payload.providerName;
            delete v2Event.payload.providerSpecialty;
          }
          
          return v2Event;
        },
        downgrade: (v2Event) => {
          const v1Event = { ...v2Event, version: '1.0.0' };
          
          if (v2Event.payload.provider) {
            v1Event.payload.providerId = v2Event.payload.provider.id;
            v1Event.payload.providerName = v2Event.payload.provider.name;
            v1Event.payload.providerSpecialty = v2Event.payload.provider.specialty;
            
            delete v1Event.payload.provider;
          }
          
          return v1Event;
        }
      });
      
      schemaMigrator.registerMigrationPath({
        sourceVersion: '1.0.0',
        targetVersion: '2.0.0',
        eventType: 'CLAIM_SUBMITTED',
        upgrade: (v1Event) => {
          const v2Event = { ...v1Event, version: '2.0.0' };
          
          // Transform Plan journey specific fields
          if (v1Event.payload.claimAmount) {
            v2Event.payload.claim = {
              details: {
                amount: {
                  value: v1Event.payload.claimAmount,
                  currency: v1Event.payload.currency || 'BRL'
                },
                type: v1Event.payload.claimType || 'General',
                category: v1Event.payload.category || 'Medical'
              },
              documents: v1Event.payload.documents || []
            };
            
            delete v2Event.payload.claimAmount;
            delete v2Event.payload.claimType;
            delete v2Event.payload.currency;
            delete v2Event.payload.category;
            delete v2Event.payload.documents;
          }
          
          return v2Event;
        },
        downgrade: (v2Event) => {
          const v1Event = { ...v2Event, version: '1.0.0' };
          
          if (v2Event.payload.claim && v2Event.payload.claim.details) {
            v1Event.payload.claimAmount = v2Event.payload.claim.details.amount.value;
            v1Event.payload.currency = v2Event.payload.claim.details.amount.currency;
            v1Event.payload.claimType = v2Event.payload.claim.details.type;
            v1Event.payload.category = v2Event.payload.claim.details.category;
            v1Event.payload.documents = v2Event.payload.claim.documents;
            
            delete v1Event.payload.claim;
          }
          
          return v1Event;
        }
      });
      
      // Test Care journey event
      const careEvent = appointmentV1;
      const migratedCareEvent = await schemaMigrator.migrateEvent(careEvent, '2.0.0');
      
      expect(migratedCareEvent.version).toEqual('2.0.0');
      expect(migratedCareEvent.payload.provider).toBeDefined();
      expect(migratedCareEvent.payload.provider.id).toEqual(careEvent.payload.providerId);
      
      // Test Plan journey event
      const planEvent = claimV1;
      const migratedPlanEvent = await schemaMigrator.migrateEvent(planEvent, '2.0.0');
      
      expect(migratedPlanEvent.version).toEqual('2.0.0');
      expect(migratedPlanEvent.payload.claim).toBeDefined();
      expect(migratedPlanEvent.payload.claim.details.amount.value).toEqual(planEvent.payload.claimAmount);
    });
  });
});