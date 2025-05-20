import { Test } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import {
  generateCorrelationId,
  propagateCorrelationId,
  extractParentCorrelationId,
  reconstructEventSequence,
  preserveJourneyContext,
  CorrelationMetadata,
  EventCorrelationContext,
  JourneyType
} from '../../../src/utils/correlation-tracking';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { TracingService } from '@austa/tracing';

// Mock TracingService
const mockTracingService = {
  getCurrentTraceId: jest.fn(),
  getCurrentSpanId: jest.fn(),
  startSpan: jest.fn(),
  endSpan: jest.fn()
};

describe('Correlation Tracking Utilities', () => {
  let tracingService: TracingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TracingService,
          useValue: mockTracingService
        }
      ],
    }).compile();

    tracingService = moduleRef.get<TracingService>(TracingService);
    jest.clearAllMocks();
  });

  describe('generateCorrelationId', () => {
    it('should generate a unique correlation ID for new event chains', () => {
      // Arrange
      const mockTraceId = '1234567890abcdef';
      mockTracingService.getCurrentTraceId.mockReturnValue(mockTraceId);

      // Act
      const correlationId = generateCorrelationId();

      // Assert
      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(0);
      expect(mockTracingService.getCurrentTraceId).toHaveBeenCalledTimes(1);
    });

    it('should use trace ID from tracing service when available', () => {
      // Arrange
      const mockTraceId = '1234567890abcdef';
      mockTracingService.getCurrentTraceId.mockReturnValue(mockTraceId);

      // Act
      const correlationId = generateCorrelationId();

      // Assert
      expect(correlationId).toContain(mockTraceId);
    });

    it('should generate a UUID when trace ID is not available', () => {
      // Arrange
      mockTracingService.getCurrentTraceId.mockReturnValue(null);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Act
      const correlationId = generateCorrelationId();

      // Assert
      expect(correlationId).toMatch(uuidRegex);
    });

    it('should include timestamp for temporal ordering', () => {
      // Arrange
      const before = Date.now();
      
      // Act
      const correlationId = generateCorrelationId();
      const after = Date.now();
      
      // Assert
      const parts = correlationId.split('-');
      const timestamp = parseInt(parts[0], 16);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('propagateCorrelationId', () => {
    it('should propagate correlation ID from parent event to child event', () => {
      // Arrange
      const parentCorrelationId = 'parent-correlation-id';
      const parentMetadata: EventMetadataDto = {
        correlationId: parentCorrelationId,
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0'
      };

      // Act
      const childMetadata = propagateCorrelationId(parentMetadata);

      // Assert
      expect(childMetadata).toBeDefined();
      expect(childMetadata.correlationId).toBeDefined();
      expect(childMetadata.parentCorrelationId).toBe(parentCorrelationId);
    });

    it('should generate a new correlation ID for the child event', () => {
      // Arrange
      const parentCorrelationId = 'parent-correlation-id';
      const parentMetadata: EventMetadataDto = {
        correlationId: parentCorrelationId,
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0'
      };

      // Act
      const childMetadata = propagateCorrelationId(parentMetadata);

      // Assert
      expect(childMetadata.correlationId).not.toBe(parentCorrelationId);
    });

    it('should preserve source service information', () => {
      // Arrange
      const sourceService = 'health-service';
      const parentMetadata: EventMetadataDto = {
        correlationId: 'parent-correlation-id',
        timestamp: new Date(),
        source: sourceService,
        version: '1.0.0'
      };

      // Act
      const childMetadata = propagateCorrelationId(parentMetadata, 'gamification-engine');

      // Assert
      expect(childMetadata.source).toBe('gamification-engine');
      expect(childMetadata.originalSource).toBe(sourceService);
    });

    it('should maintain correlation chain depth', () => {
      // Arrange
      const parentMetadata: EventMetadataDto = {
        correlationId: 'parent-correlation-id',
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0',
        correlationDepth: 1
      };

      // Act
      const childMetadata = propagateCorrelationId(parentMetadata);

      // Assert
      expect(childMetadata.correlationDepth).toBe(2);
    });

    it('should initialize correlation depth to 1 if not present in parent', () => {
      // Arrange
      const parentMetadata: EventMetadataDto = {
        correlationId: 'parent-correlation-id',
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0'
        // No correlationDepth
      };

      // Act
      const childMetadata = propagateCorrelationId(parentMetadata);

      // Assert
      expect(childMetadata.correlationDepth).toBe(1);
    });

    it('should propagate correlation ID across service boundaries', () => {
      // Arrange
      const parentCorrelationId = 'parent-correlation-id';
      const parentMetadata: EventMetadataDto = {
        correlationId: parentCorrelationId,
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0'
      };

      // Act
      const childMetadata = propagateCorrelationId(parentMetadata, 'care-service');

      // Assert
      expect(childMetadata.parentCorrelationId).toBe(parentCorrelationId);
      expect(childMetadata.source).toBe('care-service');
    });
  });

  describe('extractParentCorrelationId', () => {
    it('should extract parent correlation ID from event metadata', () => {
      // Arrange
      const parentCorrelationId = 'parent-correlation-id';
      const metadata: EventMetadataDto = {
        correlationId: 'child-correlation-id',
        parentCorrelationId,
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0'
      };

      // Act
      const extractedParentId = extractParentCorrelationId(metadata);

      // Assert
      expect(extractedParentId).toBe(parentCorrelationId);
    });

    it('should return null if no parent correlation ID exists', () => {
      // Arrange
      const metadata: EventMetadataDto = {
        correlationId: 'correlation-id',
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0'
        // No parentCorrelationId
      };

      // Act
      const extractedParentId = extractParentCorrelationId(metadata);

      // Assert
      expect(extractedParentId).toBeNull();
    });

    it('should handle undefined metadata gracefully', () => {
      // Act & Assert
      expect(() => extractParentCorrelationId(undefined)).not.toThrow();
      expect(extractParentCorrelationId(undefined)).toBeNull();
    });
  });

  describe('reconstructEventSequence', () => {
    it('should reconstruct event sequence using correlation metadata', async () => {
      // Arrange
      const rootCorrelationId = 'root-correlation-id';
      const childCorrelationId1 = 'child-correlation-id-1';
      const childCorrelationId2 = 'child-correlation-id-2';
      const grandchildCorrelationId = 'grandchild-correlation-id';

      const mockEvents = [
        {
          id: 'event4',
          metadata: {
            correlationId: grandchildCorrelationId,
            parentCorrelationId: childCorrelationId2,
            timestamp: new Date(2023, 0, 1, 12, 3),
            correlationDepth: 3
          }
        },
        {
          id: 'event1',
          metadata: {
            correlationId: rootCorrelationId,
            timestamp: new Date(2023, 0, 1, 12, 0),
            correlationDepth: 1
          }
        },
        {
          id: 'event3',
          metadata: {
            correlationId: childCorrelationId2,
            parentCorrelationId: rootCorrelationId,
            timestamp: new Date(2023, 0, 1, 12, 2),
            correlationDepth: 2
          }
        },
        {
          id: 'event2',
          metadata: {
            correlationId: childCorrelationId1,
            parentCorrelationId: rootCorrelationId,
            timestamp: new Date(2023, 0, 1, 12, 1),
            correlationDepth: 2
          }
        }
      ];

      const mockEventRepository = {
        findByCorrelationId: jest.fn().mockImplementation((correlationId) => {
          return Promise.resolve(mockEvents.filter(e => 
            e.metadata.correlationId === correlationId || 
            e.metadata.parentCorrelationId === correlationId
          ));
        })
      };

      // Act
      const sequence = await reconstructEventSequence(rootCorrelationId, mockEventRepository);

      // Assert
      expect(sequence).toBeDefined();
      expect(sequence.length).toBe(4);
      expect(sequence[0].id).toBe('event1'); // Root event
      expect(sequence[1].id).toBe('event2'); // First child by timestamp
      expect(sequence[2].id).toBe('event3'); // Second child by timestamp
      expect(sequence[3].id).toBe('event4'); // Grandchild
    });

    it('should handle empty event sequences', async () => {
      // Arrange
      const mockEventRepository = {
        findByCorrelationId: jest.fn().mockResolvedValue([])
      };

      // Act
      const sequence = await reconstructEventSequence('non-existent-id', mockEventRepository);

      // Assert
      expect(sequence).toEqual([]);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockEventRepository = {
        findByCorrelationId: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      // Act & Assert
      await expect(reconstructEventSequence('correlation-id', mockEventRepository))
        .rejects.toThrow('Failed to reconstruct event sequence');
    });
  });

  describe('preserveJourneyContext', () => {
    it('should preserve journey context in correlation data across services', () => {
      // Arrange
      const journeyContext: EventCorrelationContext = {
        journeyType: JourneyType.HEALTH,
        journeyId: 'health-journey-123',
        userId: 'user-123',
        sessionId: 'session-456'
      };

      const parentMetadata: EventMetadataDto = {
        correlationId: 'parent-correlation-id',
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0'
      };

      // Act
      const enrichedMetadata = preserveJourneyContext(parentMetadata, journeyContext);

      // Assert
      expect(enrichedMetadata.context).toBeDefined();
      expect(enrichedMetadata.context.journeyType).toBe(JourneyType.HEALTH);
      expect(enrichedMetadata.context.journeyId).toBe('health-journey-123');
      expect(enrichedMetadata.context.userId).toBe('user-123');
      expect(enrichedMetadata.context.sessionId).toBe('session-456');
    });

    it('should merge journey context with existing context data', () => {
      // Arrange
      const existingContext = {
        requestId: 'request-123',
        deviceInfo: 'mobile-android'
      };

      const journeyContext: EventCorrelationContext = {
        journeyType: JourneyType.CARE,
        journeyId: 'care-journey-456',
        userId: 'user-123',
        sessionId: 'session-456'
      };

      const parentMetadata: EventMetadataDto = {
        correlationId: 'parent-correlation-id',
        timestamp: new Date(),
        source: 'care-service',
        version: '1.0.0',
        context: existingContext
      };

      // Act
      const enrichedMetadata = preserveJourneyContext(parentMetadata, journeyContext);

      // Assert
      expect(enrichedMetadata.context).toBeDefined();
      expect(enrichedMetadata.context.journeyType).toBe(JourneyType.CARE);
      expect(enrichedMetadata.context.journeyId).toBe('care-journey-456');
      expect(enrichedMetadata.context.requestId).toBe('request-123');
      expect(enrichedMetadata.context.deviceInfo).toBe('mobile-android');
    });

    it('should handle transition between different journey types', () => {
      // Arrange
      const originalContext: EventCorrelationContext = {
        journeyType: JourneyType.HEALTH,
        journeyId: 'health-journey-123',
        userId: 'user-123',
        sessionId: 'session-456'
      };

      const newJourneyContext: EventCorrelationContext = {
        journeyType: JourneyType.PLAN,
        journeyId: 'plan-journey-789',
        userId: 'user-123',
        sessionId: 'session-456'
      };

      const parentMetadata: EventMetadataDto = {
        correlationId: 'parent-correlation-id',
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0',
        context: originalContext
      };

      // Act
      const enrichedMetadata = preserveJourneyContext(parentMetadata, newJourneyContext);

      // Assert
      expect(enrichedMetadata.context).toBeDefined();
      expect(enrichedMetadata.context.journeyType).toBe(JourneyType.PLAN);
      expect(enrichedMetadata.context.journeyId).toBe('plan-journey-789');
      expect(enrichedMetadata.context.previousJourneyType).toBe(JourneyType.HEALTH);
      expect(enrichedMetadata.context.previousJourneyId).toBe('health-journey-123');
    });

    it('should maintain journey transition history', () => {
      // Arrange
      // First transition: HEALTH -> CARE
      const healthContext: EventCorrelationContext = {
        journeyType: JourneyType.HEALTH,
        journeyId: 'health-journey-123',
        userId: 'user-123',
        sessionId: 'session-456'
      };

      const healthMetadata: EventMetadataDto = {
        correlationId: 'health-correlation-id',
        timestamp: new Date(),
        source: 'health-service',
        version: '1.0.0',
        context: healthContext
      };

      const careContext: EventCorrelationContext = {
        journeyType: JourneyType.CARE,
        journeyId: 'care-journey-456',
        userId: 'user-123',
        sessionId: 'session-456'
      };

      // First transition
      const careMetadata = preserveJourneyContext(healthMetadata, careContext);

      // Second transition: CARE -> PLAN
      const planContext: EventCorrelationContext = {
        journeyType: JourneyType.PLAN,
        journeyId: 'plan-journey-789',
        userId: 'user-123',
        sessionId: 'session-456'
      };

      // Act - Second transition
      const planMetadata = preserveJourneyContext(careMetadata, planContext);

      // Assert
      expect(planMetadata.context).toBeDefined();
      expect(planMetadata.context.journeyType).toBe(JourneyType.PLAN);
      expect(planMetadata.context.journeyId).toBe('plan-journey-789');
      expect(planMetadata.context.previousJourneyType).toBe(JourneyType.CARE);
      expect(planMetadata.context.previousJourneyId).toBe('care-journey-456');
      expect(planMetadata.context.journeyPath).toBeDefined();
      expect(planMetadata.context.journeyPath).toContain(JourneyType.HEALTH);
      expect(planMetadata.context.journeyPath).toContain(JourneyType.CARE);
      expect(planMetadata.context.journeyPath).toContain(JourneyType.PLAN);
    });
  });
});