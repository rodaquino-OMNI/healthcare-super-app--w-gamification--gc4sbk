import { SpanKind, Context, SpanOptions as OtelSpanOptions } from '@opentelemetry/api';
import { SpanOptions } from '../../../src/interfaces/span-options.interface';
import { JourneyType } from '../../../src/utils/span-attributes';

/**
 * Unit tests for the SpanOptions interface.
 * 
 * These tests verify that the SpanOptions interface properly extends the OpenTelemetry
 * SpanOptions interface and adds AUSTA-specific configuration options for spans.
 */
describe('SpanOptions Interface', () => {
  // Mock objects for testing
  const mockContext = {} as Context;
  const mockStartTime = 1625097600000; // Example timestamp
  const mockEndTime = 1625097601000; // Example timestamp + 1 second
  const mockAttributes = { 'test.attribute': 'value' };
  const mockUserId = 'user-123';
  const mockRequestId = 'req-456';
  
  describe('Basic OpenTelemetry SpanOptions compatibility', () => {
    it('should support standard OpenTelemetry SpanOptions properties', () => {
      // Create a SpanOptions object with standard OpenTelemetry properties
      const options: SpanOptions = {
        kind: SpanKind.CLIENT,
        attributes: mockAttributes,
        startTime: mockStartTime,
      };
      
      // Verify the properties are correctly typed and accessible
      expect(options.kind).toBe(SpanKind.CLIENT);
      expect(options.attributes).toEqual(mockAttributes);
      expect(options.startTime).toBe(mockStartTime);
    });
    
    it('should be assignable to OpenTelemetry SpanOptions', () => {
      // Create a SpanOptions object
      const austaOptions: SpanOptions = {
        kind: SpanKind.CLIENT,
        attributes: mockAttributes,
      };
      
      // Verify it can be assigned to an OpenTelemetry SpanOptions variable
      const otelOptions: OtelSpanOptions = austaOptions;
      
      expect(otelOptions.kind).toBe(SpanKind.CLIENT);
      expect(otelOptions.attributes).toEqual(mockAttributes);
    });
  });
  
  describe('Custom attributes configuration', () => {
    it('should support custom business attributes', () => {
      // Create a SpanOptions object with custom business attributes
      const options: SpanOptions = {
        attributes: {
          'business.operation': 'appointment-booking',
          'business.entity.id': 'appointment-789',
          'business.entity.type': 'appointment',
        },
      };
      
      // Verify the custom attributes are correctly configured
      expect(options.attributes['business.operation']).toBe('appointment-booking');
      expect(options.attributes['business.entity.id']).toBe('appointment-789');
      expect(options.attributes['business.entity.type']).toBe('appointment');
    });
    
    it('should support nested attribute objects that get flattened during span creation', () => {
      // Create a SpanOptions object with nested attributes
      const options: SpanOptions = {
        attributes: {
          business: {
            operation: 'appointment-booking',
            entity: {
              id: 'appointment-789',
              type: 'appointment',
            },
          },
        },
      };
      
      // In actual usage, these would be flattened to dot notation when applied to a span
      // This test just verifies the interface accepts the nested structure
      expect(options.attributes.business.operation).toBe('appointment-booking');
      expect(options.attributes.business.entity.id).toBe('appointment-789');
      expect(options.attributes.business.entity.type).toBe('appointment');
    });
  });
  
  describe('Parent context reference', () => {
    it('should support parent context for span hierarchy', () => {
      // Create a SpanOptions object with a parent context
      const options: SpanOptions = {
        parent: mockContext,
      };
      
      // Verify the parent context is correctly configured
      expect(options.parent).toBe(mockContext);
    });
    
    it('should support both parent context and other options', () => {
      // Create a SpanOptions object with parent context and other options
      const options: SpanOptions = {
        parent: mockContext,
        kind: SpanKind.INTERNAL,
        attributes: mockAttributes,
      };
      
      // Verify all properties are correctly configured
      expect(options.parent).toBe(mockContext);
      expect(options.kind).toBe(SpanKind.INTERNAL);
      expect(options.attributes).toEqual(mockAttributes);
    });
  });
  
  describe('Timing configuration options', () => {
    it('should support custom start time', () => {
      // Create a SpanOptions object with a custom start time
      const options: SpanOptions = {
        startTime: mockStartTime,
      };
      
      // Verify the start time is correctly configured
      expect(options.startTime).toBe(mockStartTime);
    });
    
    it('should support custom end time', () => {
      // Create a SpanOptions object with custom start and end times
      const options: SpanOptions = {
        startTime: mockStartTime,
        endTime: mockEndTime,
      };
      
      // Verify the timing options are correctly configured
      expect(options.startTime).toBe(mockStartTime);
      expect(options.endTime).toBe(mockEndTime);
    });
    
    it('should support timing object for more complex timing scenarios', () => {
      // Create a SpanOptions object with a timing object
      const options: SpanOptions = {
        timing: {
          startTime: mockStartTime,
          endTime: mockEndTime,
          durationMs: mockEndTime - mockStartTime,
        },
      };
      
      // Verify the timing object is correctly configured
      expect(options.timing.startTime).toBe(mockStartTime);
      expect(options.timing.endTime).toBe(mockEndTime);
      expect(options.timing.durationMs).toBe(1000); // 1 second difference
    });
  });
  
  describe('AUSTA-specific extensions', () => {
    it('should support userId for user context', () => {
      // Create a SpanOptions object with a userId
      const options: SpanOptions = {
        userId: mockUserId,
      };
      
      // Verify the userId is correctly configured
      expect(options.userId).toBe(mockUserId);
    });
    
    it('should support requestId for request tracking', () => {
      // Create a SpanOptions object with a requestId
      const options: SpanOptions = {
        requestId: mockRequestId,
      };
      
      // Verify the requestId is correctly configured
      expect(options.requestId).toBe(mockRequestId);
    });
    
    it('should support journeyType for journey-specific spans', () => {
      // Create a SpanOptions object with a journeyType
      const options: SpanOptions = {
        journeyType: JourneyType.HEALTH,
      };
      
      // Verify the journeyType is correctly configured
      expect(options.journeyType).toBe(JourneyType.HEALTH);
    });
    
    it('should support comprehensive AUSTA-specific configuration', () => {
      // Create a SpanOptions object with all AUSTA-specific options
      const options: SpanOptions = {
        userId: mockUserId,
        requestId: mockRequestId,
        journeyType: JourneyType.CARE,
        attributes: {
          'journey.operation': 'book-appointment',
          'journey.entity.id': 'appointment-789',
        },
      };
      
      // Verify all AUSTA-specific options are correctly configured
      expect(options.userId).toBe(mockUserId);
      expect(options.requestId).toBe(mockRequestId);
      expect(options.journeyType).toBe(JourneyType.CARE);
      expect(options.attributes['journey.operation']).toBe('book-appointment');
      expect(options.attributes['journey.entity.id']).toBe('appointment-789');
    });
  });
  
  describe('Journey-specific span customization', () => {
    it('should support Health journey specific attributes', () => {
      // Create a SpanOptions object for a Health journey span
      const options: SpanOptions = {
        journeyType: JourneyType.HEALTH,
        attributes: {
          'health.metric.type': 'heart_rate',
          'health.metric.value': 75,
          'health.device.id': 'device-123',
          'health.goal.id': 'goal-456',
        },
      };
      
      // Verify the Health journey specific attributes are correctly configured
      expect(options.journeyType).toBe(JourneyType.HEALTH);
      expect(options.attributes['health.metric.type']).toBe('heart_rate');
      expect(options.attributes['health.metric.value']).toBe(75);
      expect(options.attributes['health.device.id']).toBe('device-123');
      expect(options.attributes['health.goal.id']).toBe('goal-456');
    });
    
    it('should support Care journey specific attributes', () => {
      // Create a SpanOptions object for a Care journey span
      const options: SpanOptions = {
        journeyType: JourneyType.CARE,
        attributes: {
          'care.appointment.id': 'appointment-123',
          'care.provider.id': 'provider-456',
          'care.session.id': 'session-789',
          'care.treatment.plan.id': 'plan-012',
        },
      };
      
      // Verify the Care journey specific attributes are correctly configured
      expect(options.journeyType).toBe(JourneyType.CARE);
      expect(options.attributes['care.appointment.id']).toBe('appointment-123');
      expect(options.attributes['care.provider.id']).toBe('provider-456');
      expect(options.attributes['care.session.id']).toBe('session-789');
      expect(options.attributes['care.treatment.plan.id']).toBe('plan-012');
    });
    
    it('should support Plan journey specific attributes', () => {
      // Create a SpanOptions object for a Plan journey span
      const options: SpanOptions = {
        journeyType: JourneyType.PLAN,
        attributes: {
          'plan.id': 'plan-123',
          'plan.claim.id': 'claim-456',
          'plan.benefit.id': 'benefit-789',
        },
      };
      
      // Verify the Plan journey specific attributes are correctly configured
      expect(options.journeyType).toBe(JourneyType.PLAN);
      expect(options.attributes['plan.id']).toBe('plan-123');
      expect(options.attributes['plan.claim.id']).toBe('claim-456');
      expect(options.attributes['plan.benefit.id']).toBe('benefit-789');
    });
  });
  
  describe('Attribute inheritance from parent spans', () => {
    it('should support attribute inheritance configuration', () => {
      // Create a SpanOptions object with attribute inheritance configuration
      const options: SpanOptions = {
        parent: mockContext,
        inheritAttributes: true,
      };
      
      // Verify the attribute inheritance configuration is correctly set
      expect(options.parent).toBe(mockContext);
      expect(options.inheritAttributes).toBe(true);
    });
    
    it('should support selective attribute inheritance', () => {
      // Create a SpanOptions object with selective attribute inheritance
      const options: SpanOptions = {
        parent: mockContext,
        inheritAttributes: ['userId', 'requestId', 'journeyType'],
      };
      
      // Verify the selective attribute inheritance is correctly configured
      expect(options.parent).toBe(mockContext);
      expect(options.inheritAttributes).toEqual(['userId', 'requestId', 'journeyType']);
    });
    
    it('should support attribute inheritance with overrides', () => {
      // Create a SpanOptions object with attribute inheritance and overrides
      const options: SpanOptions = {
        parent: mockContext,
        inheritAttributes: true,
        attributes: {
          // These would override any inherited attributes with the same keys
          'overridden.attribute': 'new-value',
        },
      };
      
      // Verify the configuration is correct
      expect(options.parent).toBe(mockContext);
      expect(options.inheritAttributes).toBe(true);
      expect(options.attributes['overridden.attribute']).toBe('new-value');
    });
  });
});