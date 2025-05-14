import { describe, expect, it, jest } from '@jest/globals';

// Import all interfaces from the barrel file
import {
  // Base event interfaces
  IEvent,
  IEventMetadata,
  IEventPayload,
  
  // Event handler interfaces
  IEventHandler,
  IEventProcessor,
  
  // Event response interfaces
  IEventResponse,
  IEventErrorResponse,
  
  // Event validation interfaces
  IEventValidator,
  IValidationResult,
  
  // Event versioning interfaces
  IVersionedEvent,
  EventVersion,
  EventVersioningStrategy,
  
  // Journey-specific event interfaces
  IHealthJourneyEvent,
  ICareJourneyEvent,
  IPlanJourneyEvent,
  IJourneyEvent,
  
  // Kafka-specific event interfaces
  IKafkaEvent,
  IKafkaEventHeaders,
  IKafkaMessageOptions
} from '../../../src/interfaces';

describe('Events interfaces barrel file', () => {
  describe('Base event interfaces', () => {
    it('should export IEvent interface with all required properties', () => {
      // Type verification test - this will fail at compile time if the interface is incorrect
      const event: IEvent = {
        eventId: 'test-event-id',
        timestamp: new Date(),
        version: '1.0.0',
        source: 'test-service',
        type: 'test-event-type',
        payload: { data: 'test-data' },
        metadata: {
          correlationId: 'test-correlation-id',
          userId: 'test-user-id'
        }
      };
      
      // Runtime verification
      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('version');
      expect(event).toHaveProperty('source');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('payload');
      expect(event).toHaveProperty('metadata');
    });
    
    it('should export IEventMetadata interface with all required properties', () => {
      const metadata: IEventMetadata = {
        correlationId: 'test-correlation-id',
        userId: 'test-user-id',
        traceId: 'test-trace-id',
        spanId: 'test-span-id'
      };
      
      expect(metadata).toHaveProperty('correlationId');
      expect(metadata).toHaveProperty('userId');
      // Optional properties
      expect(metadata).toHaveProperty('traceId');
      expect(metadata).toHaveProperty('spanId');
    });
    
    it('should export IEventPayload interface that can be extended', () => {
      interface TestPayload extends IEventPayload {
        testProperty: string;
      }
      
      const payload: TestPayload = {
        testProperty: 'test-value'
      };
      
      expect(payload).toHaveProperty('testProperty');
    });
  });
  
  describe('Event handler interfaces', () => {
    it('should export IEventHandler interface with all required methods', () => {
      // Create a mock implementation of IEventHandler
      class TestEventHandler implements IEventHandler<IEvent> {
        handle(event: IEvent): Promise<IEventResponse> {
          return Promise.resolve({
            success: true,
            eventId: event.eventId
          });
        }
        
        canHandle(event: IEvent): boolean {
          return event.type === 'test-event-type';
        }
        
        getEventType(): string {
          return 'test-event-type';
        }
      }
      
      const handler = new TestEventHandler();
      
      // Verify the handler has the required methods
      expect(typeof handler.handle).toBe('function');
      expect(typeof handler.canHandle).toBe('function');
      expect(typeof handler.getEventType).toBe('function');
      
      // Verify the handler works as expected
      const event: IEvent = {
        eventId: 'test-event-id',
        timestamp: new Date(),
        version: '1.0.0',
        source: 'test-service',
        type: 'test-event-type',
        payload: { data: 'test-data' },
        metadata: {
          correlationId: 'test-correlation-id',
          userId: 'test-user-id'
        }
      };
      
      expect(handler.canHandle(event)).toBe(true);
      expect(handler.getEventType()).toBe('test-event-type');
    });
    
    it('should export IEventProcessor interface with all required methods', () => {
      // Create a mock implementation of IEventProcessor
      class TestEventProcessor implements IEventProcessor {
        processEvent(event: IEvent): Promise<IEventResponse> {
          return Promise.resolve({
            success: true,
            eventId: event.eventId
          });
        }
        
        getProcessorName(): string {
          return 'test-processor';
        }
      }
      
      const processor = new TestEventProcessor();
      
      // Verify the processor has the required methods
      expect(typeof processor.processEvent).toBe('function');
      expect(typeof processor.getProcessorName).toBe('function');
      
      // Verify the processor works as expected
      expect(processor.getProcessorName()).toBe('test-processor');
    });
  });
  
  describe('Event response interfaces', () => {
    it('should export IEventResponse interface with all required properties', () => {
      const response: IEventResponse = {
        success: true,
        eventId: 'test-event-id',
        data: { result: 'processed' },
        metadata: {
          processingTime: 100,
          processorName: 'test-processor'
        }
      };
      
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('eventId');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('metadata');
    });
    
    it('should export IEventErrorResponse interface with all required properties', () => {
      const errorResponse: IEventErrorResponse = {
        success: false,
        eventId: 'test-event-id',
        error: {
          code: 'ERROR_CODE',
          message: 'Error message',
          details: { additionalInfo: 'test' }
        },
        metadata: {
          processingTime: 100,
          processorName: 'test-processor'
        }
      };
      
      expect(errorResponse).toHaveProperty('success');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse).toHaveProperty('eventId');
      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse.error).toHaveProperty('code');
      expect(errorResponse.error).toHaveProperty('message');
      expect(errorResponse.error).toHaveProperty('details');
      expect(errorResponse).toHaveProperty('metadata');
    });
  });
  
  describe('Event validation interfaces', () => {
    it('should export IEventValidator interface with all required methods', () => {
      // Create a mock implementation of IEventValidator
      class TestEventValidator implements IEventValidator {
        validate(event: IEvent): IValidationResult {
          return {
            valid: true
          };
        }
        
        validateAsync(event: IEvent): Promise<IValidationResult> {
          return Promise.resolve({
            valid: true
          });
        }
      }
      
      const validator = new TestEventValidator();
      
      // Verify the validator has the required methods
      expect(typeof validator.validate).toBe('function');
      expect(typeof validator.validateAsync).toBe('function');
    });
    
    it('should export IValidationResult interface with all required properties', () => {
      // Valid result
      const validResult: IValidationResult = {
        valid: true
      };
      
      expect(validResult).toHaveProperty('valid');
      expect(validResult.valid).toBe(true);
      
      // Invalid result
      const invalidResult: IValidationResult = {
        valid: false,
        errors: [
          {
            field: 'testField',
            message: 'Test error message',
            code: 'TEST_ERROR_CODE'
          }
        ]
      };
      
      expect(invalidResult).toHaveProperty('valid');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult).toHaveProperty('errors');
      expect(invalidResult.errors[0]).toHaveProperty('field');
      expect(invalidResult.errors[0]).toHaveProperty('message');
      expect(invalidResult.errors[0]).toHaveProperty('code');
    });
  });
  
  describe('Event versioning interfaces', () => {
    it('should export IVersionedEvent interface with all required properties', () => {
      const versionedEvent: IVersionedEvent = {
        eventId: 'test-event-id',
        timestamp: new Date(),
        version: '1.0.0',
        source: 'test-service',
        type: 'test-event-type',
        payload: { data: 'test-data' },
        metadata: {
          correlationId: 'test-correlation-id',
          userId: 'test-user-id'
        },
        getVersion(): EventVersion {
          return {
            major: 1,
            minor: 0,
            patch: 0
          };
        },
        isCompatibleWith(otherVersion: EventVersion): boolean {
          return this.getVersion().major === otherVersion.major;
        }
      };
      
      expect(versionedEvent).toHaveProperty('eventId');
      expect(versionedEvent).toHaveProperty('timestamp');
      expect(versionedEvent).toHaveProperty('version');
      expect(versionedEvent).toHaveProperty('source');
      expect(versionedEvent).toHaveProperty('type');
      expect(versionedEvent).toHaveProperty('payload');
      expect(versionedEvent).toHaveProperty('metadata');
      expect(typeof versionedEvent.getVersion).toBe('function');
      expect(typeof versionedEvent.isCompatibleWith).toBe('function');
      
      // Test the methods
      const version = versionedEvent.getVersion();
      expect(version).toHaveProperty('major');
      expect(version).toHaveProperty('minor');
      expect(version).toHaveProperty('patch');
      
      expect(versionedEvent.isCompatibleWith({ major: 1, minor: 1, patch: 0 })).toBe(true);
      expect(versionedEvent.isCompatibleWith({ major: 2, minor: 0, patch: 0 })).toBe(false);
    });
    
    it('should export EventVersion interface with all required properties', () => {
      const version: EventVersion = {
        major: 1,
        minor: 2,
        patch: 3
      };
      
      expect(version).toHaveProperty('major');
      expect(version).toHaveProperty('minor');
      expect(version).toHaveProperty('patch');
    });
    
    it('should export EventVersioningStrategy enum with all required values', () => {
      // Verify that EventVersioningStrategy is an enum or object with expected values
      expect(EventVersioningStrategy).toBeDefined();
      expect(EventVersioningStrategy).toHaveProperty('MAJOR');
      expect(EventVersioningStrategy).toHaveProperty('MINOR');
      expect(EventVersioningStrategy).toHaveProperty('PATCH');
    });
  });
  
  describe('Journey-specific event interfaces', () => {
    it('should export IJourneyEvent interface with all required properties', () => {
      const journeyEvent: IJourneyEvent = {
        eventId: 'test-event-id',
        timestamp: new Date(),
        version: '1.0.0',
        source: 'test-service',
        type: 'test-event-type',
        payload: { data: 'test-data' },
        metadata: {
          correlationId: 'test-correlation-id',
          userId: 'test-user-id'
        },
        journey: 'health'
      };
      
      expect(journeyEvent).toHaveProperty('eventId');
      expect(journeyEvent).toHaveProperty('timestamp');
      expect(journeyEvent).toHaveProperty('version');
      expect(journeyEvent).toHaveProperty('source');
      expect(journeyEvent).toHaveProperty('type');
      expect(journeyEvent).toHaveProperty('payload');
      expect(journeyEvent).toHaveProperty('metadata');
      expect(journeyEvent).toHaveProperty('journey');
    });
    
    it('should export IHealthJourneyEvent interface with all required properties', () => {
      const healthEvent: IHealthJourneyEvent = {
        eventId: 'test-event-id',
        timestamp: new Date(),
        version: '1.0.0',
        source: 'health-service',
        type: 'health-metric-recorded',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          userId: 'test-user-id'
        },
        metadata: {
          correlationId: 'test-correlation-id',
          userId: 'test-user-id'
        },
        journey: 'health'
      };
      
      expect(healthEvent).toHaveProperty('eventId');
      expect(healthEvent).toHaveProperty('timestamp');
      expect(healthEvent).toHaveProperty('version');
      expect(healthEvent).toHaveProperty('source');
      expect(healthEvent).toHaveProperty('type');
      expect(healthEvent).toHaveProperty('payload');
      expect(healthEvent.payload).toHaveProperty('metricType');
      expect(healthEvent.payload).toHaveProperty('value');
      expect(healthEvent.payload).toHaveProperty('unit');
      expect(healthEvent.payload).toHaveProperty('userId');
      expect(healthEvent).toHaveProperty('metadata');
      expect(healthEvent).toHaveProperty('journey');
      expect(healthEvent.journey).toBe('health');
    });
    
    it('should export ICareJourneyEvent interface with all required properties', () => {
      const careEvent: ICareJourneyEvent = {
        eventId: 'test-event-id',
        timestamp: new Date(),
        version: '1.0.0',
        source: 'care-service',
        type: 'appointment-booked',
        payload: {
          appointmentId: 'test-appointment-id',
          providerId: 'test-provider-id',
          userId: 'test-user-id',
          dateTime: new Date().toISOString(),
          specialty: 'Cardiology'
        },
        metadata: {
          correlationId: 'test-correlation-id',
          userId: 'test-user-id'
        },
        journey: 'care'
      };
      
      expect(careEvent).toHaveProperty('eventId');
      expect(careEvent).toHaveProperty('timestamp');
      expect(careEvent).toHaveProperty('version');
      expect(careEvent).toHaveProperty('source');
      expect(careEvent).toHaveProperty('type');
      expect(careEvent).toHaveProperty('payload');
      expect(careEvent.payload).toHaveProperty('appointmentId');
      expect(careEvent.payload).toHaveProperty('providerId');
      expect(careEvent.payload).toHaveProperty('userId');
      expect(careEvent.payload).toHaveProperty('dateTime');
      expect(careEvent.payload).toHaveProperty('specialty');
      expect(careEvent).toHaveProperty('metadata');
      expect(careEvent).toHaveProperty('journey');
      expect(careEvent.journey).toBe('care');
    });
    
    it('should export IPlanJourneyEvent interface with all required properties', () => {
      const planEvent: IPlanJourneyEvent = {
        eventId: 'test-event-id',
        timestamp: new Date(),
        version: '1.0.0',
        source: 'plan-service',
        type: 'claim-submitted',
        payload: {
          claimId: 'test-claim-id',
          userId: 'test-user-id',
          amount: 150.75,
          claimType: 'medical',
          status: 'submitted'
        },
        metadata: {
          correlationId: 'test-correlation-id',
          userId: 'test-user-id'
        },
        journey: 'plan'
      };
      
      expect(planEvent).toHaveProperty('eventId');
      expect(planEvent).toHaveProperty('timestamp');
      expect(planEvent).toHaveProperty('version');
      expect(planEvent).toHaveProperty('source');
      expect(planEvent).toHaveProperty('type');
      expect(planEvent).toHaveProperty('payload');
      expect(planEvent.payload).toHaveProperty('claimId');
      expect(planEvent.payload).toHaveProperty('userId');
      expect(planEvent.payload).toHaveProperty('amount');
      expect(planEvent.payload).toHaveProperty('claimType');
      expect(planEvent.payload).toHaveProperty('status');
      expect(planEvent).toHaveProperty('metadata');
      expect(planEvent).toHaveProperty('journey');
      expect(planEvent.journey).toBe('plan');
    });
  });
  
  describe('Kafka-specific event interfaces', () => {
    it('should export IKafkaEvent interface with all required properties', () => {
      const kafkaEvent: IKafkaEvent = {
        eventId: 'test-event-id',
        timestamp: new Date(),
        version: '1.0.0',
        source: 'test-service',
        type: 'test-event-type',
        payload: { data: 'test-data' },
        metadata: {
          correlationId: 'test-correlation-id',
          userId: 'test-user-id'
        },
        topic: 'test-topic',
        partition: 0,
        offset: 100,
        key: 'test-key',
        headers: {
          'content-type': 'application/json',
          'event-type': 'test-event-type'
        }
      };
      
      expect(kafkaEvent).toHaveProperty('eventId');
      expect(kafkaEvent).toHaveProperty('timestamp');
      expect(kafkaEvent).toHaveProperty('version');
      expect(kafkaEvent).toHaveProperty('source');
      expect(kafkaEvent).toHaveProperty('type');
      expect(kafkaEvent).toHaveProperty('payload');
      expect(kafkaEvent).toHaveProperty('metadata');
      expect(kafkaEvent).toHaveProperty('topic');
      expect(kafkaEvent).toHaveProperty('partition');
      expect(kafkaEvent).toHaveProperty('offset');
      expect(kafkaEvent).toHaveProperty('key');
      expect(kafkaEvent).toHaveProperty('headers');
    });
    
    it('should export IKafkaEventHeaders interface with all required properties', () => {
      const headers: IKafkaEventHeaders = {
        'content-type': 'application/json',
        'event-type': 'test-event-type',
        'correlation-id': 'test-correlation-id'
      };
      
      expect(headers).toHaveProperty('content-type');
      expect(headers).toHaveProperty('event-type');
      expect(headers).toHaveProperty('correlation-id');
    });
    
    it('should export IKafkaMessageOptions interface with all required properties', () => {
      const options: IKafkaMessageOptions = {
        topic: 'test-topic',
        partition: 0,
        key: 'test-key',
        headers: {
          'content-type': 'application/json',
          'event-type': 'test-event-type'
        },
        timestamp: new Date().getTime()
      };
      
      expect(options).toHaveProperty('topic');
      expect(options).toHaveProperty('partition');
      expect(options).toHaveProperty('key');
      expect(options).toHaveProperty('headers');
      expect(options).toHaveProperty('timestamp');
    });
  });
  
  describe('Backward compatibility', () => {
    it('should maintain backward compatibility with previous versions', () => {
      // Test that the interfaces can be used with objects created for previous versions
      // This is a type-level test that will fail at compile time if backward compatibility is broken
      
      // Legacy event format (v0.9.0)
      const legacyEvent: IEvent = {
        eventId: 'legacy-event-id',
        timestamp: new Date(),
        version: '0.9.0',
        source: 'legacy-service',
        type: 'legacy-event-type',
        payload: { legacyData: 'test' },
        metadata: {
          correlationId: 'legacy-correlation-id',
          userId: 'legacy-user-id'
        }
      };
      
      // Should still be compatible with current IEvent
      expect(legacyEvent).toHaveProperty('eventId');
      expect(legacyEvent).toHaveProperty('timestamp');
      expect(legacyEvent).toHaveProperty('version');
      expect(legacyEvent).toHaveProperty('source');
      expect(legacyEvent).toHaveProperty('type');
      expect(legacyEvent).toHaveProperty('payload');
      expect(legacyEvent).toHaveProperty('metadata');
    });
  });
});