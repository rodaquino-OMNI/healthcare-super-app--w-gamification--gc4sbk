import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { RetryService } from '@austa/events/utils/retry-utils';
import { CorrelationIdService } from '@austa/events/utils/correlation-id';
import { EventValidator } from '@austa/events/utils/event-validator';
import { EventSerializer } from '@austa/events/utils/event-serializer';
import { JourneyContext } from '@austa/events/utils/journey-context';
import { EventType } from '@austa/events/dto/event-types.enum';
import { GamificationEvent } from '@austa/interfaces/gamification/events';
import { EventProcessingUtil, isGamificationEvent, createGamificationEvent, getPayloadValue } from './event-processing.util';

// Mock implementations
const mockLoggerService = {
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

const mockTracingService = {
  createSpan: jest.fn().mockReturnValue({ spanId: 'test-span-id', traceId: 'test-trace-id' })
};

const mockRetryService = {
  executeWithRetry: jest.fn().mockImplementation((fn) => fn())
};

const mockCorrelationService = {
  generate: jest.fn().mockReturnValue('test-correlation-id')
};

const mockEventValidator = {
  validate: jest.fn().mockReturnValue(true)
};

const mockEventSerializer = {
  serialize: jest.fn().mockImplementation((event) => JSON.stringify(event)),
  deserialize: jest.fn().mockImplementation((str) => JSON.parse(str))
};

const mockJourneyContext = {
  extract: jest.fn().mockReturnValue({})
};

// Mock crypto.randomUUID for testing
global.crypto = {
  randomUUID: jest.fn().mockReturnValue('test-uuid')
} as any;

describe('EventProcessingUtil', () => {
  let service: EventProcessingUtil;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventProcessingUtil,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TracingService, useValue: mockTracingService },
        { provide: RetryService, useValue: mockRetryService },
        { provide: CorrelationIdService, useValue: mockCorrelationService },
        { provide: EventValidator, useValue: mockEventValidator },
        { provide: EventSerializer, useValue: mockEventSerializer },
        { provide: JourneyContext, useValue: mockJourneyContext }
      ],
    }).compile();

    service = module.get<EventProcessingUtil>(EventProcessingUtil);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateEvent', () => {
    it('should validate an event successfully', () => {
      const event = createTestEvent();
      const result = service.validateEvent(event);
      
      expect(result).toBe(true);
      expect(mockEventValidator.validate).toHaveBeenCalledWith(event);
      expect(mockLoggerService.debug).toHaveBeenCalled();
    });

    it('should handle validation errors', () => {
      const event = createTestEvent();
      const error = new Error('Validation failed');
      
      mockEventValidator.validate.mockImplementationOnce(() => {
        throw error;
      });
      
      const result = service.validateEvent(event);
      
      expect(result).toBe(false);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('enrichEvent', () => {
    it('should enrich an event with metadata', () => {
      const event = createTestEvent();
      const enriched = service.enrichEvent(event);
      
      expect(enriched).toHaveProperty('metadata.correlationId', 'test-correlation-id');
      expect(enriched).toHaveProperty('metadata.processedAt');
      expect(enriched).toHaveProperty('metadata.spanId', 'test-span-id');
      expect(enriched).toHaveProperty('metadata.traceId', 'test-trace-id');
      expect(mockTracingService.createSpan).toHaveBeenCalled();
    });

    it('should preserve existing correlation ID if present', () => {
      const event = createTestEvent();
      event.metadata.correlationId = 'existing-correlation-id';
      
      const enriched = service.enrichEvent(event);
      
      expect(enriched).toHaveProperty('metadata.correlationId', 'existing-correlation-id');
    });

    it('should handle errors during enrichment', () => {
      const event = createTestEvent();
      
      mockTracingService.createSpan.mockImplementationOnce(() => {
        throw new Error('Tracing error');
      });
      
      const result = service.enrichEvent(event);
      
      expect(result).toEqual(event); // Should return original event on error
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('processWithRetry', () => {
    it('should process an event with retry capabilities', async () => {
      const event = createTestEvent();
      const processor = jest.fn().mockResolvedValue({ success: true });
      
      const result = await service.processWithRetry(event, processor);
      
      expect(result).toEqual({ success: true });
      expect(processor).toHaveBeenCalledWith(event);
      expect(mockRetryService.executeWithRetry).toHaveBeenCalled();
    });
  });

  describe('serializeEvent', () => {
    it('should serialize an event to a string', () => {
      const event = createTestEvent();
      const serialized = service.serializeEvent(event);
      
      expect(typeof serialized).toBe('string');
      expect(mockEventSerializer.serialize).toHaveBeenCalledWith(event);
    });

    it('should handle serialization errors', () => {
      const event = createTestEvent();
      
      mockEventSerializer.serialize.mockImplementationOnce(() => {
        throw new Error('Serialization error');
      });
      
      expect(() => service.serializeEvent(event)).toThrow('Serialization error');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('deserializeEvent', () => {
    it('should deserialize a string to an event', () => {
      const event = createTestEvent();
      const serialized = JSON.stringify(event);
      
      const deserialized = service.deserializeEvent(serialized);
      
      expect(deserialized).toEqual(event);
      expect(mockEventSerializer.deserialize).toHaveBeenCalledWith(serialized);
    });

    it('should handle deserialization errors', () => {
      mockEventSerializer.deserialize.mockImplementationOnce(() => {
        throw new Error('Deserialization error');
      });
      
      expect(() => service.deserializeEvent('{}')).toThrow('Deserialization error');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('journey detection', () => {
    it('should detect health events by journey', () => {
      const event = createTestEvent('test-event', 'health');
      expect(service.isHealthEvent(event)).toBe(true);
    });

    it('should detect health events by type', () => {
      const event = createTestEvent(EventType.HEALTH_METRIC_RECORDED, 'unknown');
      expect(service.isHealthEvent(event)).toBe(true);
    });

    it('should detect care events by journey', () => {
      const event = createTestEvent('test-event', 'care');
      expect(service.isCareEvent(event)).toBe(true);
    });

    it('should detect care events by type', () => {
      const event = createTestEvent(EventType.APPOINTMENT_BOOKED, 'unknown');
      expect(service.isCareEvent(event)).toBe(true);
    });

    it('should detect plan events by journey', () => {
      const event = createTestEvent('test-event', 'plan');
      expect(service.isPlanEvent(event)).toBe(true);
    });

    it('should detect plan events by type', () => {
      const event = createTestEvent(EventType.CLAIM_SUBMITTED, 'unknown');
      expect(service.isPlanEvent(event)).toBe(true);
    });
  });

  describe('transformLegacyEvent', () => {
    it('should transform a legacy event to the standardized format', () => {
      const legacyEvent = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: 'user-123',
        data: { metricType: 'weight', value: 70 },
        journey: 'health'
      };
      
      const transformed = service.transformLegacyEvent(legacyEvent);
      
      expect(transformed).toHaveProperty('eventId', 'test-uuid');
      expect(transformed).toHaveProperty('type', 'HEALTH_METRIC_RECORDED');
      expect(transformed).toHaveProperty('userId', 'user-123');
      expect(transformed).toHaveProperty('journey', 'health');
      expect(transformed).toHaveProperty('timestamp');
      expect(transformed).toHaveProperty('version', '1.0');
      expect(transformed).toHaveProperty('payload', legacyEvent.data);
      expect(transformed).toHaveProperty('metadata.transformedFromLegacy', true);
    });

    it('should determine journey from event type if not provided', () => {
      const legacyEvent = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: 'user-123',
        data: { metricType: 'weight', value: 70 }
      };
      
      const transformed = service.transformLegacyEvent(legacyEvent);
      
      expect(transformed).toHaveProperty('journey', 'health');
    });
  });
});

describe('isGamificationEvent', () => {
  it('should return true for valid GamificationEvent objects', () => {
    const event = createTestEvent();
    expect(isGamificationEvent(event)).toBe(true);
  });

  it('should return false for invalid objects', () => {
    expect(isGamificationEvent(null)).toBe(false);
    expect(isGamificationEvent({})).toBe(false);
    expect(isGamificationEvent({ eventId: 'id', type: 'type' })).toBe(false);
  });
});

describe('createGamificationEvent', () => {
  it('should create a valid GamificationEvent object', () => {
    const event = createGamificationEvent(
      'TEST_EVENT',
      'user-123',
      { test: 'data' },
      'health'
    );
    
    expect(event).toHaveProperty('eventId', 'test-uuid');
    expect(event).toHaveProperty('type', 'TEST_EVENT');
    expect(event).toHaveProperty('userId', 'user-123');
    expect(event).toHaveProperty('journey', 'health');
    expect(event).toHaveProperty('timestamp');
    expect(event).toHaveProperty('version', '1.0');
    expect(event).toHaveProperty('payload', { test: 'data' });
    expect(event).toHaveProperty('metadata.correlationId', 'test-uuid');
  });
});

describe('getPayloadValue', () => {
  it('should extract a value from the event payload', () => {
    const event = createTestEvent();
    event.payload = { level1: { level2: { level3: 'test-value' } } };
    
    const value = getPayloadValue(event, 'level1.level2.level3');
    expect(value).toBe('test-value');
  });

  it('should return the default value if path does not exist', () => {
    const event = createTestEvent();
    event.payload = { level1: {} };
    
    const value = getPayloadValue(event, 'level1.level2.level3', 'default-value');
    expect(value).toBe('default-value');
  });

  it('should handle errors and return the default value', () => {
    const event = createTestEvent();
    event.payload = null;
    
    const value = getPayloadValue(event, 'level1.level2', 'default-value');
    expect(value).toBe('default-value');
  });
});

// Helper function to create test events
function createTestEvent(type = 'TEST_EVENT', journey = 'health'): GamificationEvent<any> {
  return {
    eventId: 'test-event-id',
    type,
    userId: 'test-user-id',
    journey,
    timestamp: '2023-01-01T00:00:00.000Z',
    version: '1.0',
    payload: {},
    metadata: {}
  };
}