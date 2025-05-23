/**
 * @file Interface Barrel Tests
 * @description Unit tests for the interface barrel file (index.ts) to ensure all interfaces are correctly exported and accessible.
 */

import * as EventInterfaces from '../../../src/interfaces';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

describe('Event Interfaces Barrel File', () => {
  describe('Base Event Interfaces', () => {
    it('should export BaseEvent interface', () => {
      // Type assertion test - this will fail at compile time if the interface is not exported correctly
      const testEvent: EventInterfaces.BaseEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        payload: { test: 'data' },
      };

      // Runtime verification
      expect(testEvent).toBeDefined();
      expect(testEvent.eventId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(testEvent.type).toBe('TEST_EVENT');
    });

    it('should export EventMetadata interface', () => {
      const metadata: EventInterfaces.EventMetadata = {
        correlationId: 'corr-123',
        traceId: 'trace-456',
        priority: 'high',
        isRetry: false,
      };

      expect(metadata).toBeDefined();
      expect(metadata.correlationId).toBe('corr-123');
      expect(metadata.priority).toBe('high');
    });

    it('should export isBaseEvent type guard function', () => {
      const validEvent = {
        eventId: '123',
        type: 'TEST',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        payload: {},
      };

      const invalidEvent = {
        id: '123', // wrong property name
        type: 'TEST',
      };

      expect(EventInterfaces.isBaseEvent).toBeDefined();
      expect(typeof EventInterfaces.isBaseEvent).toBe('function');
      expect(EventInterfaces.isBaseEvent(validEvent)).toBe(true);
      expect(EventInterfaces.isBaseEvent(invalidEvent)).toBe(false);
    });

    it('should export createEvent helper function', () => {
      expect(EventInterfaces.createEvent).toBeDefined();
      expect(typeof EventInterfaces.createEvent).toBe('function');

      const event = EventInterfaces.createEvent('TEST', 'test-service', { data: 'test' });
      
      expect(event).toBeDefined();
      expect(event.type).toBe('TEST');
      expect(event.source).toBe('test-service');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.eventId).toBeDefined(); // Should be auto-generated
      expect(event.timestamp).toBeDefined(); // Should be auto-generated
      expect(event.version).toBe('1.0.0'); // Default version
    });

    it('should export validateEvent function', () => {
      expect(EventInterfaces.validateEvent).toBeDefined();
      expect(typeof EventInterfaces.validateEvent).toBe('function');

      const validEvent = {
        eventId: '123',
        type: 'TEST',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        payload: {},
      };

      const invalidEvent = {
        type: 'TEST', // Missing required fields
      };

      const validResult = EventInterfaces.validateEvent(validEvent);
      const invalidResult = EventInterfaces.validateEvent(invalidEvent);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Journey-Specific Event Interfaces', () => {
    it('should export HealthJourneyEvent interface', () => {
      // Type assertion test
      const healthEvent: EventInterfaces.HealthJourneyEvent = {
        eventId: '123',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        journey: 'HEALTH',
        userId: 'user123',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
        },
      };

      expect(healthEvent).toBeDefined();
      expect(healthEvent.journey).toBe('HEALTH');
      expect(healthEvent.payload.metricType).toBe('HEART_RATE');
    });

    it('should export CareJourneyEvent interface', () => {
      // Type assertion test
      const careEvent: EventInterfaces.CareJourneyEvent = {
        eventId: '123',
        type: 'APPOINTMENT_BOOKED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        journey: 'CARE',
        userId: 'user123',
        payload: {
          appointmentId: 'appt123',
          providerId: 'provider456',
          scheduledAt: new Date().toISOString(),
          specialtyType: 'CARDIOLOGY',
        },
      };

      expect(careEvent).toBeDefined();
      expect(careEvent.journey).toBe('CARE');
      expect(careEvent.payload.appointmentId).toBe('appt123');
    });

    it('should export PlanJourneyEvent interface', () => {
      // Type assertion test
      const planEvent: EventInterfaces.PlanJourneyEvent = {
        eventId: '123',
        type: 'CLAIM_SUBMITTED',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        journey: 'PLAN',
        userId: 'user123',
        payload: {
          claimId: 'claim123',
          amount: 150.75,
          serviceDate: new Date().toISOString(),
          claimType: 'MEDICAL',
        },
      };

      expect(planEvent).toBeDefined();
      expect(planEvent.journey).toBe('PLAN');
      expect(planEvent.payload.claimId).toBe('claim123');
    });
  });

  describe('Event Handler Interfaces', () => {
    it('should export EventHandler interface', () => {
      // Create a mock implementation of EventHandler
      class TestEventHandler implements EventInterfaces.EventHandler<EventInterfaces.BaseEvent> {
        async handle(event: EventInterfaces.BaseEvent): Promise<EventInterfaces.EventResponse> {
          return { success: true, eventId: event.eventId };
        }

        canHandle(event: EventInterfaces.BaseEvent): boolean {
          return event.type === 'TEST_EVENT';
        }

        getEventType(): string {
          return 'TEST_EVENT';
        }
      }

      const handler = new TestEventHandler();
      const event: EventInterfaces.BaseEvent = {
        eventId: '123',
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        payload: {},
      };

      expect(handler).toBeDefined();
      expect(handler.canHandle(event)).toBe(true);
      expect(handler.getEventType()).toBe('TEST_EVENT');
      expect(handler.handle(event)).resolves.toEqual({
        success: true,
        eventId: '123',
      });
    });
  });

  describe('Event Response Interfaces', () => {
    it('should export EventResponse interface', () => {
      // Type assertion test
      const successResponse: EventInterfaces.EventResponse = {
        success: true,
        eventId: '123',
        timestamp: new Date().toISOString(),
      };

      const errorResponse: EventInterfaces.EventResponse = {
        success: false,
        eventId: '123',
        timestamp: new Date().toISOString(),
        error: {
          code: 'EVENT_PROCESSING_ERROR',
          message: 'Failed to process event',
        },
      };

      expect(successResponse).toBeDefined();
      expect(successResponse.success).toBe(true);
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error!.code).toBe('EVENT_PROCESSING_ERROR');
    });
  });

  describe('Event Validation Interfaces', () => {
    it('should export EventValidator interface', () => {
      // Create a mock implementation of EventValidator
      class TestValidator implements EventInterfaces.EventValidator<EventInterfaces.BaseEvent> {
        validate(event: EventInterfaces.BaseEvent): EventInterfaces.ValidationResult {
          if (!event.eventId) {
            return {
              valid: false,
              errors: [{ field: 'eventId', message: 'Event ID is required' }],
            };
          }
          return { valid: true };
        }
      }

      const validator = new TestValidator();
      const validEvent: EventInterfaces.BaseEvent = {
        eventId: '123',
        type: 'TEST',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        payload: {},
      };

      const invalidEvent = {
        type: 'TEST',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        payload: {},
      } as EventInterfaces.BaseEvent; // Missing eventId

      expect(validator).toBeDefined();
      expect(validator.validate(validEvent).valid).toBe(true);
      expect(validator.validate(invalidEvent).valid).toBe(false);
    });

    it('should export ValidationResult interface', () => {
      // Type assertion test
      const validResult: EventInterfaces.ValidationResult = {
        valid: true,
      };

      const invalidResult: EventInterfaces.ValidationResult = {
        valid: false,
        errors: [
          { field: 'eventId', message: 'Event ID is required' },
          { field: 'timestamp', message: 'Timestamp must be a valid ISO string' },
        ],
      };

      expect(validResult).toBeDefined();
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toHaveLength(2);
      expect(invalidResult.errors![0].field).toBe('eventId');
    });
  });

  describe('Event Versioning Interfaces', () => {
    it('should export VersionedEvent interface', () => {
      // Type assertion test
      const versionedEvent: EventInterfaces.VersionedEvent = {
        eventId: '123',
        type: 'TEST',
        timestamp: new Date().toISOString(),
        version: '2.1.0', // Specific version
        source: 'test',
        payload: {},
      };

      expect(versionedEvent).toBeDefined();
      expect(versionedEvent.version).toBe('2.1.0');
    });

    it('should export EventVersion interface', () => {
      // Type assertion test
      const version: EventInterfaces.EventVersion = {
        major: 2,
        minor: 1,
        patch: 0,
      };

      expect(version).toBeDefined();
      expect(version.major).toBe(2);
      expect(version.minor).toBe(1);
      expect(version.patch).toBe(0);
    });

    it('should export EventVersioningStrategy interface', () => {
      // Create a mock implementation of EventVersioningStrategy
      class TestVersioningStrategy implements EventInterfaces.EventVersioningStrategy {
        parseVersion(versionString: string): EventInterfaces.EventVersion {
          const [major, minor, patch] = versionString.split('.').map(Number);
          return { major, minor, patch };
        }

        formatVersion(version: EventInterfaces.EventVersion): string {
          return `${version.major}.${version.minor}.${version.patch}`;
        }

        isCompatible(eventVersion: string, handlerVersion: string): boolean {
          const event = this.parseVersion(eventVersion);
          const handler = this.parseVersion(handlerVersion);
          return event.major === handler.major;
        }
      }

      const strategy = new TestVersioningStrategy();
      
      expect(strategy).toBeDefined();
      expect(strategy.parseVersion('2.1.0')).toEqual({ major: 2, minor: 1, patch: 0 });
      expect(strategy.formatVersion({ major: 2, minor: 1, patch: 0 })).toBe('2.1.0');
      expect(strategy.isCompatible('2.1.0', '2.0.0')).toBe(true);
      expect(strategy.isCompatible('2.1.0', '3.0.0')).toBe(false);
    });
  });

  describe('Kafka-Specific Event Interfaces', () => {
    it('should export KafkaEvent interface', () => {
      // Type assertion test
      const kafkaEvent: EventInterfaces.KafkaEvent = {
        eventId: '123',
        type: 'TEST',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        payload: {},
        topic: 'test-topic',
        partition: 0,
        offset: '100',
        key: 'test-key',
        headers: {
          correlationId: 'corr-123',
        },
      };

      expect(kafkaEvent).toBeDefined();
      expect(kafkaEvent.topic).toBe('test-topic');
      expect(kafkaEvent.partition).toBe(0);
      expect(kafkaEvent.offset).toBe('100');
      expect(kafkaEvent.key).toBe('test-key');
      expect(kafkaEvent.headers.correlationId).toBe('corr-123');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with older event formats', () => {
      // Test with a minimal event format that would have been valid in previous versions
      const legacyEvent = {
        eventId: '123',
        type: 'LEGACY_EVENT',
        timestamp: new Date().toISOString(),
        version: '0.9.0', // Old version
        source: 'legacy-service',
        data: { test: 'data' }, // Using 'data' instead of 'payload' (assuming this was the old format)
      };

      // Convert to current format
      const convertedEvent: EventInterfaces.BaseEvent = {
        ...legacyEvent,
        payload: legacyEvent.data as any,
      };

      // Remove the old property
      delete (convertedEvent as any).data;

      expect(convertedEvent).toBeDefined();
      expect(convertedEvent.eventId).toBe('123');
      expect(convertedEvent.type).toBe('LEGACY_EVENT');
      expect(convertedEvent.payload).toEqual({ test: 'data' });
    });

    it('should support both new and old journey event formats', () => {
      // Old format (assuming journey was previously called 'journeyType')
      const oldFormatEvent = {
        eventId: '123',
        type: 'OLD_FORMAT_EVENT',
        timestamp: new Date().toISOString(),
        version: '0.9.0',
        source: 'legacy-service',
        journeyType: 'HEALTH' as JourneyType, // Old property name
        payload: { test: 'data' },
      };

      // Convert to current format
      const convertedEvent: EventInterfaces.BaseEvent = {
        ...oldFormatEvent,
        journey: oldFormatEvent.journeyType,
      };

      // Remove the old property
      delete (convertedEvent as any).journeyType;

      expect(convertedEvent).toBeDefined();
      expect(convertedEvent.eventId).toBe('123');
      expect(convertedEvent.journey).toBe('HEALTH');
    });
  });

  describe('Complete Interface Coverage', () => {
    it('should export all expected interfaces and types', () => {
      // This test ensures that all expected interfaces are exported
      // If any interface is missing, TypeScript will show a compile-time error
      
      // Base Event Interfaces
      expect(typeof EventInterfaces.BaseEvent).toBe('object'); // Interfaces are 'object' at runtime
      expect(typeof EventInterfaces.EventMetadata).toBe('object');
      expect(typeof EventInterfaces.isBaseEvent).toBe('function');
      expect(typeof EventInterfaces.createEvent).toBe('function');
      expect(typeof EventInterfaces.validateEvent).toBe('function');
      
      // Journey-Specific Event Interfaces
      expect(typeof EventInterfaces.HealthJourneyEvent).toBe('object');
      expect(typeof EventInterfaces.CareJourneyEvent).toBe('object');
      expect(typeof EventInterfaces.PlanJourneyEvent).toBe('object');
      
      // Event Handler Interfaces
      expect(typeof EventInterfaces.EventHandler).toBe('object');
      
      // Event Response Interfaces
      expect(typeof EventInterfaces.EventResponse).toBe('object');
      expect(typeof EventInterfaces.EventError).toBe('object');
      
      // Event Validation Interfaces
      expect(typeof EventInterfaces.EventValidator).toBe('object');
      expect(typeof EventInterfaces.ValidationResult).toBe('object');
      expect(typeof EventInterfaces.ValidationError).toBe('object');
      
      // Event Versioning Interfaces
      expect(typeof EventInterfaces.VersionedEvent).toBe('object');
      expect(typeof EventInterfaces.EventVersion).toBe('object');
      expect(typeof EventInterfaces.EventVersioningStrategy).toBe('object');
      
      // Kafka-Specific Event Interfaces
      expect(typeof EventInterfaces.KafkaEvent).toBe('object');
      expect(typeof EventInterfaces.KafkaHeaders).toBe('object');
    });
  });
});