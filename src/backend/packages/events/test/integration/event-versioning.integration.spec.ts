import { Test, TestingModule } from '@nestjs/testing';
import {
  VersionDetector,
  CompatibilityChecker,
  EventTransformer,
  SchemaMigrator,
  VersioningErrors,
  EventVersion,
  IVersionedEvent,
  VersionRange,
  EventVersioningStrategy,
} from '../../src/versioning';
import { EventTypes } from '../../src/dto/event-types.enum';
import { BaseEventDto } from '../../src/dto/base-event.dto';
import { HealthMetricEventDto } from '../../src/dto/health-metric-event.dto';
import { AppointmentEventDto } from '../../src/dto/appointment-event.dto';
import { ClaimEventDto } from '../../src/dto/claim-event.dto';
import { EventsModule } from '../../src/events.module';

/**
 * Integration tests for event schema versioning capabilities.
 * 
 * This test suite verifies that the system can handle different versions of the same event type,
 * ensuring backward compatibility with older event formats while supporting newer schema features.
 */
describe('Event Versioning Integration', () => {
  let moduleRef: TestingModule;
  let versionDetector: VersionDetector;
  let compatibilityChecker: CompatibilityChecker;
  let eventTransformer: EventTransformer;
  let schemaMigrator: SchemaMigrator;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventsModule],
    }).compile();

    versionDetector = moduleRef.get<VersionDetector>(VersionDetector);
    compatibilityChecker = moduleRef.get<CompatibilityChecker>(CompatibilityChecker);
    eventTransformer = moduleRef.get<EventTransformer>(EventTransformer);
    schemaMigrator = moduleRef.get<SchemaMigrator>(SchemaMigrator);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // Sample events of different versions for testing
  const healthMetricEventV1: IVersionedEvent = {
    eventId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'health-service',
    type: EventTypes.Health.METRIC_RECORDED,
    payload: {
      userId: 'user123',
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
    },
    metadata: {
      correlationId: 'corr-123',
      journeyContext: 'health',
    },
  };

  const healthMetricEventV2: IVersionedEvent = {
    eventId: '123e4567-e89b-12d3-a456-426614174001',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    source: 'health-service',
    type: EventTypes.Health.METRIC_RECORDED,
    payload: {
      userId: 'user123',
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      deviceId: 'device123', // Added in v2
      confidence: 0.95, // Added in v2
    },
    metadata: {
      correlationId: 'corr-123',
      journeyContext: 'health',
      deviceInfo: { // Added in v2
        type: 'smartwatch',
        manufacturer: 'Acme',
      },
    },
  };

  const appointmentEventV1: IVersionedEvent = {
    eventId: '123e4567-e89b-12d3-a456-426614174002',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'care-service',
    type: EventTypes.Care.APPOINTMENT_BOOKED,
    payload: {
      userId: 'user123',
      appointmentId: 'apt123',
      providerId: 'provider456',
      scheduledAt: new Date().toISOString(),
      status: 'BOOKED',
    },
    metadata: {
      correlationId: 'corr-456',
      journeyContext: 'care',
    },
  };

  const appointmentEventV1_1: IVersionedEvent = {
    eventId: '123e4567-e89b-12d3-a456-426614174003',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    source: 'care-service',
    type: EventTypes.Care.APPOINTMENT_BOOKED,
    payload: {
      userId: 'user123',
      appointmentId: 'apt123',
      providerId: 'provider456',
      scheduledAt: new Date().toISOString(),
      status: 'BOOKED',
      specialtyId: 'cardiology', // Added in v1.1
    },
    metadata: {
      correlationId: 'corr-456',
      journeyContext: 'care',
    },
  };

  const claimEventV1: IVersionedEvent = {
    eventId: '123e4567-e89b-12d3-a456-426614174004',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'plan-service',
    type: EventTypes.Plan.CLAIM_SUBMITTED,
    payload: {
      userId: 'user123',
      claimId: 'claim789',
      amount: 150.0,
      currency: 'BRL',
      status: 'SUBMITTED',
      type: 'MEDICAL_CONSULTATION',
    },
    metadata: {
      correlationId: 'corr-789',
      journeyContext: 'plan',
    },
  };

  const claimEventV2: IVersionedEvent = {
    eventId: '123e4567-e89b-12d3-a456-426614174005',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    source: 'plan-service',
    type: EventTypes.Plan.CLAIM_SUBMITTED,
    payload: {
      userId: 'user123',
      claimId: 'claim789',
      amount: 150.0,
      currency: 'BRL',
      status: 'SUBMITTED',
      type: 'MEDICAL_CONSULTATION',
      documents: [ // Added in v2
        {
          id: 'doc123',
          type: 'RECEIPT',
          url: 'https://storage.example.com/receipts/doc123.pdf',
        },
      ],
      providerDetails: { // Added in v2
        id: 'provider456',
        name: 'Dr. Silva',
        specialty: 'Cardiologia',
      },
    },
    metadata: {
      correlationId: 'corr-789',
      journeyContext: 'plan',
      submittedVia: 'mobile', // Added in v2
    },
  };

  describe('Version Detection', () => {
    it('should detect version from explicit version field', async () => {
      const detectedVersion = await versionDetector.detectVersion(healthMetricEventV1);
      expect(detectedVersion).toEqual(new EventVersion('1.0.0'));
    });

    it('should detect version from event structure when version field is missing', async () => {
      // Create event without explicit version field
      const { version, ...eventWithoutVersion } = healthMetricEventV1;
      
      // Configure detector to use structure-based detection
      const detectedVersion = await versionDetector.detectVersion(eventWithoutVersion, {
        strategy: EventVersioningStrategy.STRUCTURE_BASED,
        fallbackToDefault: true,
      });
      
      expect(detectedVersion.major).toBe(1);
    });

    it('should detect version from headers when available', async () => {
      // Create event with version in headers
      const eventWithHeaders = {
        ...healthMetricEventV1,
        headers: {
          'x-event-version': '1.2.3',
        },
      };
      
      // Configure detector to use header-based detection
      const detectedVersion = await versionDetector.detectVersion(eventWithHeaders, {
        strategy: EventVersioningStrategy.HEADER_BASED,
        headerName: 'x-event-version',
      });
      
      expect(detectedVersion).toEqual(new EventVersion('1.2.3'));
    });

    it('should use fallback chain when primary detection method fails', async () => {
      // Create event without explicit version field but with headers
      const { version, ...eventBase } = healthMetricEventV1;
      const eventWithHeaders = {
        ...eventBase,
        headers: {
          'x-event-version': '1.3.0',
        },
      };
      
      // Configure detector with fallback chain
      const detectedVersion = await versionDetector.detectVersion(eventWithHeaders, {
        strategy: EventVersioningStrategy.EXPLICIT_FIELD,
        fallbackStrategies: [
          EventVersioningStrategy.HEADER_BASED,
          EventVersioningStrategy.STRUCTURE_BASED,
        ],
        headerName: 'x-event-version',
      });
      
      expect(detectedVersion).toEqual(new EventVersion('1.3.0'));
    });

    it('should throw error when version cannot be detected', async () => {
      // Create event without any version information
      const { version, ...eventBase } = healthMetricEventV1;
      const eventWithoutVersion = {
        ...eventBase,
        // Remove any properties that could be used for structure-based detection
        payload: {
          userId: 'user123',
        },
      };
      
      await expect(versionDetector.detectVersion(eventWithoutVersion, {
        strategy: EventVersioningStrategy.EXPLICIT_FIELD,
        fallbackToDefault: false,
      })).rejects.toThrow(VersioningErrors.VersionDetectionError);
    });
  });

  describe('Compatibility Checking', () => {
    it('should determine compatibility between same versions', async () => {
      const isCompatible = await compatibilityChecker.areCompatible(
        new EventVersion('1.0.0'),
        new EventVersion('1.0.0')
      );
      expect(isCompatible).toBe(true);
    });

    it('should determine compatibility between minor versions', async () => {
      const isCompatible = await compatibilityChecker.areCompatible(
        new EventVersion('1.0.0'),
        new EventVersion('1.1.0')
      );
      expect(isCompatible).toBe(true);
    });

    it('should determine incompatibility between major versions', async () => {
      const isCompatible = await compatibilityChecker.areCompatible(
        new EventVersion('1.0.0'),
        new EventVersion('2.0.0')
      );
      expect(isCompatible).toBe(false);
    });

    it('should check if consumer can process event version', async () => {
      const consumerVersion = new EventVersion('2.0.0');
      const eventVersion = new EventVersion('1.1.0');
      
      const canProcess = await compatibilityChecker.canConsumerProcessEvent(
        consumerVersion,
        eventVersion
      );
      
      // A v2.0.0 consumer should be able to process a v1.1.0 event
      expect(canProcess).toBe(true);
    });

    it('should check if producer can be understood by consumer', async () => {
      const producerVersion = new EventVersion('2.0.0');
      const consumerVersion = new EventVersion('1.0.0');
      
      const canUnderstand = await compatibilityChecker.canConsumerUnderstandProducer(
        consumerVersion,
        producerVersion
      );
      
      // A v1.0.0 consumer should not be able to understand a v2.0.0 producer
      expect(canUnderstand).toBe(false);
    });

    it('should validate version range compatibility', async () => {
      const versionRange = new VersionRange('>=1.0.0 <2.0.0');
      
      expect(await compatibilityChecker.isVersionInRange(new EventVersion('1.0.0'), versionRange)).toBe(true);
      expect(await compatibilityChecker.isVersionInRange(new EventVersion('1.5.0'), versionRange)).toBe(true);
      expect(await compatibilityChecker.isVersionInRange(new EventVersion('2.0.0'), versionRange)).toBe(false);
      expect(await compatibilityChecker.isVersionInRange(new EventVersion('0.9.0'), versionRange)).toBe(false);
    });
  });

  describe('Event Transformation', () => {
    it('should upgrade event from v1 to v2', async () => {
      // Register transformation function for health metric events
      await eventTransformer.registerTransformation(
        EventTypes.Health.METRIC_RECORDED,
        '1.0.0',
        '2.0.0',
        (sourceEvent) => {
          const v1Payload = sourceEvent.payload;
          return {
            ...sourceEvent,
            version: '2.0.0',
            payload: {
              ...v1Payload,
              deviceId: 'unknown', // Add required v2 field with default value
              confidence: 1.0, // Add required v2 field with default value
            },
            metadata: {
              ...sourceEvent.metadata,
              deviceInfo: {
                type: 'unknown',
                manufacturer: 'unknown',
              },
            },
          };
        }
      );

      // Transform the event
      const upgradedEvent = await eventTransformer.transformEvent(
        healthMetricEventV1,
        '2.0.0'
      );

      // Verify the transformation
      expect(upgradedEvent.version).toBe('2.0.0');
      expect(upgradedEvent.payload).toHaveProperty('deviceId');
      expect(upgradedEvent.payload).toHaveProperty('confidence');
      expect(upgradedEvent.metadata).toHaveProperty('deviceInfo');
    });

    it('should downgrade event from v2 to v1', async () => {
      // Register transformation function for health metric events (downgrade)
      await eventTransformer.registerTransformation(
        EventTypes.Health.METRIC_RECORDED,
        '2.0.0',
        '1.0.0',
        (sourceEvent) => {
          const v2Payload = sourceEvent.payload;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { deviceId, confidence, ...v1Payload } = v2Payload;
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { deviceInfo, ...v1Metadata } = sourceEvent.metadata || {};
          
          return {
            ...sourceEvent,
            version: '1.0.0',
            payload: v1Payload,
            metadata: v1Metadata,
          };
        }
      );

      // Transform the event
      const downgradedEvent = await eventTransformer.transformEvent(
        healthMetricEventV2,
        '1.0.0'
      );

      // Verify the transformation
      expect(downgradedEvent.version).toBe('1.0.0');
      expect(downgradedEvent.payload).not.toHaveProperty('deviceId');
      expect(downgradedEvent.payload).not.toHaveProperty('confidence');
      expect(downgradedEvent.metadata).not.toHaveProperty('deviceInfo');
    });

    it('should handle transformation errors gracefully', async () => {
      // Try to transform without registering a transformation
      await expect(eventTransformer.transformEvent(
        claimEventV1,
        '3.0.0' // No transformation registered for this target version
      )).rejects.toThrow(VersioningErrors.TransformationError);
    });

    it('should apply multiple transformations in sequence', async () => {
      // Register transformation from v1.0.0 to v1.1.0
      await eventTransformer.registerTransformation(
        EventTypes.Care.APPOINTMENT_BOOKED,
        '1.0.0',
        '1.1.0',
        (sourceEvent) => ({
          ...sourceEvent,
          version: '1.1.0',
          payload: {
            ...sourceEvent.payload,
            specialtyId: 'general', // Default specialty
          },
        }))
      );

      // Register transformation from v1.1.0 to v2.0.0
      await eventTransformer.registerTransformation(
        EventTypes.Care.APPOINTMENT_BOOKED,
        '1.1.0',
        '2.0.0',
        (sourceEvent) => ({
          ...sourceEvent,
          version: '2.0.0',
          payload: {
            ...sourceEvent.payload,
            locationId: 'default-location', // Added in v2.0.0
            virtualMeeting: false, // Added in v2.0.0
          },
        }))
      );

      // Transform from v1.0.0 to v2.0.0 (should apply both transformations)
      const transformedEvent = await eventTransformer.transformEvent(
        appointmentEventV1,
        '2.0.0'
      );

      // Verify the transformation
      expect(transformedEvent.version).toBe('2.0.0');
      expect(transformedEvent.payload).toHaveProperty('specialtyId'); // Added in v1.1.0
      expect(transformedEvent.payload).toHaveProperty('locationId'); // Added in v2.0.0
      expect(transformedEvent.payload).toHaveProperty('virtualMeeting'); // Added in v2.0.0
    });
  });

  describe('Schema Migration', () => {
    beforeEach(async () => {
      // Register migration paths
      await schemaMigrator.registerMigrationPath(
        EventTypes.Health.METRIC_RECORDED,
        '1.0.0',
        '2.0.0',
        async (event) => {
          const v1Payload = event.payload;
          return {
            ...event,
            version: '2.0.0',
            payload: {
              ...v1Payload,
              deviceId: 'unknown',
              confidence: 1.0,
            },
            metadata: {
              ...event.metadata,
              deviceInfo: {
                type: 'unknown',
                manufacturer: 'unknown',
              },
            },
          };
        }
      );

      await schemaMigrator.registerMigrationPath(
        EventTypes.Plan.CLAIM_SUBMITTED,
        '1.0.0',
        '2.0.0',
        async (event) => {
          const v1Payload = event.payload;
          return {
            ...event,
            version: '2.0.0',
            payload: {
              ...v1Payload,
              documents: [],
              providerDetails: {
                id: 'unknown',
                name: 'Unknown Provider',
                specialty: 'Unknown',
              },
            },
            metadata: {
              ...event.metadata,
              submittedVia: 'unknown',
            },
          };
        }
      );
    });

    it('should migrate event to target version', async () => {
      const migratedEvent = await schemaMigrator.migrateEvent(
        healthMetricEventV1,
        '2.0.0'
      );

      expect(migratedEvent.version).toBe('2.0.0');
      expect(migratedEvent.payload).toHaveProperty('deviceId');
      expect(migratedEvent.payload).toHaveProperty('confidence');
      expect(migratedEvent.metadata).toHaveProperty('deviceInfo');
    });

    it('should discover and execute migration path automatically', async () => {
      // Don't specify exact migration path, let the migrator discover it
      const migratedEvent = await schemaMigrator.migrateEvent(
        claimEventV1,
        '2.0.0'
      );

      expect(migratedEvent.version).toBe('2.0.0');
      expect(migratedEvent.payload).toHaveProperty('documents');
      expect(migratedEvent.payload).toHaveProperty('providerDetails');
      expect(migratedEvent.metadata).toHaveProperty('submittedVia');
    });

    it('should validate migrated event against target schema', async () => {
      // Register a validation function for v2.0.0 claim events
      await schemaMigrator.registerSchemaValidator(
        EventTypes.Plan.CLAIM_SUBMITTED,
        '2.0.0',
        async (event) => {
          // Simple validation: ensure required fields exist
          const requiredFields = [
            'userId', 'claimId', 'amount', 'currency', 'status', 'type',
            'documents', 'providerDetails'
          ];
          
          const missingFields = requiredFields.filter(field => !(field in event.payload));
          
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }
          
          return true;
        }
      );

      // Migrate and validate
      const migratedEvent = await schemaMigrator.migrateEvent(
        claimEventV1,
        '2.0.0',
        { validate: true }
      );

      expect(migratedEvent.version).toBe('2.0.0');
      expect(migratedEvent.payload).toHaveProperty('documents');
      expect(migratedEvent.payload).toHaveProperty('providerDetails');
    });

    it('should handle migration errors with proper error information', async () => {
      // Register a failing migration path
      await schemaMigrator.registerMigrationPath(
        EventTypes.Care.APPOINTMENT_BOOKED,
        '1.0.0',
        '2.0.0',
        async () => {
          throw new Error('Simulated migration failure');
        }
      );

      // Attempt migration that will fail
      await expect(schemaMigrator.migrateEvent(
        appointmentEventV1,
        '2.0.0'
      )).rejects.toThrow(VersioningErrors.MigrationError);
    });
  });

  describe('End-to-End Versioning Scenarios', () => {
    it('should handle event processing with version detection and transformation', async () => {
      // 1. Detect the version of an incoming event
      const detectedVersion = await versionDetector.detectVersion(healthMetricEventV1);
      expect(detectedVersion.toString()).toBe('1.0.0');

      // 2. Check if the current system version is compatible
      const systemVersion = new EventVersion('2.0.0'); // System expects v2.0.0
      const isCompatible = await compatibilityChecker.areCompatible(detectedVersion, systemVersion);
      expect(isCompatible).toBe(false); // v1.0.0 and v2.0.0 are not directly compatible

      // 3. Transform the event to the required version
      // (Using the transformation registered in previous tests)
      const transformedEvent = await eventTransformer.transformEvent(
        healthMetricEventV1,
        systemVersion.toString()
      );
      expect(transformedEvent.version).toBe('2.0.0');

      // 4. Validate the transformed event
      // This would typically use a schema validator, but we'll just check the structure
      expect(transformedEvent.payload).toHaveProperty('deviceId');
      expect(transformedEvent.payload).toHaveProperty('confidence');
    });

    it('should support graceful degradation for newer events in older systems', async () => {
      // Scenario: A v2.0.0 event is received by a v1.0.0 system
      
      // 1. Detect the version of the incoming event
      const detectedVersion = await versionDetector.detectVersion(claimEventV2);
      expect(detectedVersion.toString()).toBe('2.0.0');

      // 2. Check if the current system version can process it
      const systemVersion = new EventVersion('1.0.0'); // System is v1.0.0
      const canProcess = await compatibilityChecker.canConsumerProcessEvent(
        systemVersion,
        detectedVersion
      );
      expect(canProcess).toBe(false); // v1.0.0 system cannot process v2.0.0 event

      // 3. Downgrade the event to a compatible version
      // (Using the transformation registered in previous tests)
      await eventTransformer.registerTransformation(
        EventTypes.Plan.CLAIM_SUBMITTED,
        '2.0.0',
        '1.0.0',
        (sourceEvent) => {
          const { documents, providerDetails, ...v1Payload } = sourceEvent.payload;
          const { submittedVia, ...v1Metadata } = sourceEvent.metadata || {};
          
          return {
            ...sourceEvent,
            version: '1.0.0',
            payload: v1Payload,
            metadata: v1Metadata,
          };
        }
      );

      const downgradedEvent = await eventTransformer.transformEvent(
        claimEventV2,
        systemVersion.toString()
      );
      
      // 4. Verify the downgraded event is compatible with v1.0.0
      expect(downgradedEvent.version).toBe('1.0.0');
      expect(downgradedEvent.payload).not.toHaveProperty('documents');
      expect(downgradedEvent.payload).not.toHaveProperty('providerDetails');
      expect(downgradedEvent.metadata).not.toHaveProperty('submittedVia');
    });

    it('should handle mixed version environments during rolling deployments', async () => {
      // Scenario: During a rolling deployment, both v1.0.0 and v2.0.0 services exist
      
      // 1. Service A (v1.0.0) produces an event
      const v1Event = healthMetricEventV1;
      
      // 2. Service B (v2.0.0) needs to consume this event
      const serviceB_Version = new EventVersion('2.0.0');
      
      // 3. Service B detects the version and checks compatibility
      const detectedVersion = await versionDetector.detectVersion(v1Event);
      const needsTransformation = !(await compatibilityChecker.canConsumerProcessEvent(
        serviceB_Version,
        detectedVersion,
        { strictMode: true } // Strict mode requires exact version match
      ));
      
      expect(needsTransformation).toBe(true); // Transformation is needed in strict mode
      
      // 4. Service B transforms the event to its expected version
      const transformedEvent = await eventTransformer.transformEvent(
        v1Event,
        serviceB_Version.toString()
      );
      
      // 5. Service B processes the transformed event
      expect(transformedEvent.version).toBe('2.0.0');
      expect(transformedEvent.payload).toHaveProperty('deviceId');
      
      // 6. Service B (v2.0.0) produces a response event
      const responseEvent = {
        ...transformedEvent,
        eventId: '123e4567-e89b-12d3-a456-426614174999',
        type: EventTypes.Health.METRIC_PROCESSED,
        timestamp: new Date().toISOString(),
      };
      
      // 7. Service A (v1.0.0) needs to consume this response
      const serviceA_Version = new EventVersion('1.0.0');
      
      // 8. Service A detects the version and checks compatibility
      const responseVersion = await versionDetector.detectVersion(responseEvent);
      const responseNeedsTransformation = !(await compatibilityChecker.canConsumerProcessEvent(
        serviceA_Version,
        responseVersion
      ));
      
      expect(responseNeedsTransformation).toBe(true); // Transformation is needed
      
      // 9. Service A transforms the response to its expected version
      const downgradedResponse = await eventTransformer.transformEvent(
        responseEvent,
        serviceA_Version.toString()
      );
      
      // 10. Service A processes the transformed response
      expect(downgradedResponse.version).toBe('1.0.0');
      expect(downgradedResponse.payload).not.toHaveProperty('deviceId');
    });
  });
});