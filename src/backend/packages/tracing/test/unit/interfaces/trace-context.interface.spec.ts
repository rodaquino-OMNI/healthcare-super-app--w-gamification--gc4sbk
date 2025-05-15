import { Context } from '@opentelemetry/api';
import {
  ContextCarrier,
  CreateTraceContextOptions,
  ExtractTraceContextOptions,
  InjectTraceContextOptions,
  SerializedTraceContext,
  TraceContext,
} from '../../../src/interfaces/trace-context.interface';
import {
  GamificationContext,
  HealthJourneyContext,
  JourneyType,
} from '../../../src/interfaces/journey-context.interface';
import { SpanAttributes } from '../../../src/interfaces/span-attributes.interface';
import { MockContext } from '../../../test/mocks/mock-context';

/**
 * Mock implementation of the TraceContext interface for testing
 */
class MockTraceContext implements TraceContext {
  private mockContexts: Map<string, Context> = new Map();
  private currentContext: Context | null = null;
  private mockJourneyContexts: Map<string, any> = new Map();
  private mockGamificationContexts: Map<string, any> = new Map();
  private mockCorrelationIds: Map<string, any> = new Map();
  private mockTraceIds: Map<string, string> = new Map();
  private mockSpanIds: Map<string, string> = new Map();
  private mockSampledFlags: Map<string, boolean> = new Map();

  constructor() {
    // Initialize with a default context
    const defaultContext = new MockContext();
    this.mockContexts.set('default', defaultContext);
    this.currentContext = defaultContext;
    
    // Set default trace and span IDs
    this.mockTraceIds.set('default', '0af7651916cd43dd8448eb211c80319c');
    this.mockSpanIds.set('default', 'b7ad6b7169203331');
    this.mockSampledFlags.set('default', true);
  }

  create(options?: CreateTraceContextOptions): Context {
    const contextId = `context-${Date.now()}-${Math.random()}`;
    const context = new MockContext();
    
    this.mockContexts.set(contextId, context);
    
    if (options?.journeyContext) {
      this.mockJourneyContexts.set(contextId, options.journeyContext);
    }
    
    if (options?.gamificationContext) {
      this.mockGamificationContexts.set(contextId, options.gamificationContext);
    }
    
    if (options?.correlationIds) {
      this.mockCorrelationIds.set(contextId, options.correlationIds);
    }
    
    // Generate trace and span IDs
    const traceId = options?.forceNewTrace 
      ? this.generateTraceId() 
      : (options?.parentContext ? this.getTraceId(options.parentContext) : this.generateTraceId());
    
    this.mockTraceIds.set(contextId, traceId);
    this.mockSpanIds.set(contextId, this.generateSpanId());
    this.mockSampledFlags.set(contextId, true);
    
    return context;
  }

  extract(carrier: ContextCarrier, options?: ExtractTraceContextOptions): Context {
    if (!carrier['traceparent'] && options?.ignoreInvalid !== true) {
      throw new Error('Invalid carrier: missing traceparent');
    }
    
    const contextId = `extracted-${Date.now()}-${Math.random()}`;
    const context = new MockContext();
    
    this.mockContexts.set(contextId, context);
    
    // Extract trace and span IDs from traceparent
    if (carrier['traceparent']) {
      const parts = carrier['traceparent'].split('-');
      if (parts.length === 4) {
        this.mockTraceIds.set(contextId, parts[1]);
        this.mockSpanIds.set(contextId, parts[2]);
        this.mockSampledFlags.set(contextId, parts[3].charAt(0) === '1');
      }
    } else if (options?.createIfMissing) {
      this.mockTraceIds.set(contextId, this.generateTraceId());
      this.mockSpanIds.set(contextId, this.generateSpanId());
      this.mockSampledFlags.set(contextId, true);
    }
    
    // Extract journey context
    if (carrier['journey-context']) {
      try {
        this.mockJourneyContexts.set(contextId, JSON.parse(carrier['journey-context']));
      } catch (e) {
        if (options?.defaultJourneyContext) {
          this.mockJourneyContexts.set(contextId, options.defaultJourneyContext);
        }
      }
    } else if (options?.defaultJourneyContext) {
      this.mockJourneyContexts.set(contextId, options.defaultJourneyContext);
    }
    
    // Extract gamification context
    if (carrier['gamification-context']) {
      try {
        this.mockGamificationContexts.set(contextId, JSON.parse(carrier['gamification-context']));
      } catch (e) {
        if (options?.defaultGamificationContext) {
          this.mockGamificationContexts.set(contextId, options.defaultGamificationContext);
        }
      }
    } else if (options?.defaultGamificationContext) {
      this.mockGamificationContexts.set(contextId, options.defaultGamificationContext);
    }
    
    return context;
  }

  inject(context: Context, carrier: ContextCarrier, options?: InjectTraceContextOptions): ContextCarrier {
    const contextId = this.getContextId(context);
    
    if (!contextId) {
      throw new Error('Invalid context: not created by this TraceContext instance');
    }
    
    // Inject trace and span IDs
    const traceId = this.mockTraceIds.get(contextId) || this.generateTraceId();
    const spanId = this.mockSpanIds.get(contextId) || this.generateSpanId();
    const sampled = this.mockSampledFlags.get(contextId) ? '1' : '0';
    
    carrier['traceparent'] = `00-${traceId}-${spanId}-${sampled}0`;
    
    // Inject journey context if requested
    if (options?.includeJourneyContext !== false) {
      const journeyContext = this.mockJourneyContexts.get(contextId);
      if (journeyContext) {
        carrier['journey-context'] = JSON.stringify(journeyContext);
      }
    }
    
    // Inject gamification context if requested
    if (options?.includeGamificationContext !== false) {
      const gamificationContext = this.mockGamificationContexts.get(contextId);
      if (gamificationContext) {
        carrier['gamification-context'] = JSON.stringify(gamificationContext);
      }
    }
    
    // Add additional headers if provided
    if (options?.additionalHeaders) {
      Object.entries(options.additionalHeaders).forEach(([key, value]) => {
        carrier[key] = value;
      });
    }
    
    return carrier;
  }

  serialize(context: Context): SerializedTraceContext {
    const contextId = this.getContextId(context);
    
    if (!contextId) {
      throw new Error('Invalid context: not created by this TraceContext instance');
    }
    
    const traceId = this.mockTraceIds.get(contextId) || this.generateTraceId();
    const spanId = this.mockSpanIds.get(contextId) || this.generateSpanId();
    const sampled = this.mockSampledFlags.get(contextId) ? '1' : '0';
    
    const serialized: SerializedTraceContext = {
      traceParent: `00-${traceId}-${spanId}-${sampled}0`,
    };
    
    // Add journey context if available
    const journeyContext = this.mockJourneyContexts.get(contextId);
    if (journeyContext) {
      serialized.journeyContext = JSON.stringify(journeyContext);
    }
    
    // Add gamification context if available
    const gamificationContext = this.mockGamificationContexts.get(contextId);
    if (gamificationContext) {
      serialized.gamificationContext = JSON.stringify(gamificationContext);
    }
    
    // Add correlation IDs if available
    const correlationIds = this.mockCorrelationIds.get(contextId);
    if (correlationIds) {
      serialized.correlationIds = correlationIds;
    }
    
    return serialized;
  }

  deserialize(serialized: SerializedTraceContext): Context {
    const contextId = `deserialized-${Date.now()}-${Math.random()}`;
    const context = new MockContext();
    
    this.mockContexts.set(contextId, context);
    
    // Extract trace and span IDs from traceparent
    if (serialized.traceParent) {
      const parts = serialized.traceParent.split('-');
      if (parts.length === 4) {
        this.mockTraceIds.set(contextId, parts[1]);
        this.mockSpanIds.set(contextId, parts[2]);
        this.mockSampledFlags.set(contextId, parts[3].charAt(0) === '1');
      }
    }
    
    // Deserialize journey context if available
    if (serialized.journeyContext) {
      try {
        this.mockJourneyContexts.set(contextId, JSON.parse(serialized.journeyContext));
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Deserialize gamification context if available
    if (serialized.gamificationContext) {
      try {
        this.mockGamificationContexts.set(contextId, JSON.parse(serialized.gamificationContext));
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Set correlation IDs if available
    if (serialized.correlationIds) {
      this.mockCorrelationIds.set(contextId, serialized.correlationIds);
    }
    
    return context;
  }

  getCurrentContext(): Context {
    return this.currentContext || this.mockContexts.get('default') as Context;
  }

  getTraceId(context: Context): string {
    const contextId = this.getContextId(context);
    return contextId ? (this.mockTraceIds.get(contextId) || '') : '';
  }

  getSpanId(context: Context): string {
    const contextId = this.getContextId(context);
    return contextId ? (this.mockSpanIds.get(contextId) || '') : '';
  }

  getJourneyContext(context: Context): any | undefined {
    const contextId = this.getContextId(context);
    return contextId ? this.mockJourneyContexts.get(contextId) : undefined;
  }

  getGamificationContext(context: Context): any | undefined {
    const contextId = this.getContextId(context);
    return contextId ? this.mockGamificationContexts.get(contextId) : undefined;
  }

  setJourneyContext(context: Context, journeyContext: any): Context {
    const contextId = this.getContextId(context);
    
    if (!contextId) {
      throw new Error('Invalid context: not created by this TraceContext instance');
    }
    
    this.mockJourneyContexts.set(contextId, journeyContext);
    return context;
  }

  setGamificationContext(context: Context, gamificationContext: any): Context {
    const contextId = this.getContextId(context);
    
    if (!contextId) {
      throw new Error('Invalid context: not created by this TraceContext instance');
    }
    
    this.mockGamificationContexts.set(contextId, gamificationContext);
    return context;
  }

  getCorrelationIds(context: Context): { requestId?: string; sessionId?: string; userId?: string; transactionId?: string; } | undefined {
    const contextId = this.getContextId(context);
    return contextId ? this.mockCorrelationIds.get(contextId) : undefined;
  }

  setCorrelationIds(context: Context, correlationIds: { requestId?: string; sessionId?: string; userId?: string; transactionId?: string; }): Context {
    const contextId = this.getContextId(context);
    
    if (!contextId) {
      throw new Error('Invalid context: not created by this TraceContext instance');
    }
    
    this.mockCorrelationIds.set(contextId, correlationIds);
    return context;
  }

  merge(target: Context, source: Context): Context {
    const targetId = this.getContextId(target);
    const sourceId = this.getContextId(source);
    
    if (!targetId || !sourceId) {
      throw new Error('Invalid context: not created by this TraceContext instance');
    }
    
    // Merge journey contexts
    const sourceJourneyContext = this.mockJourneyContexts.get(sourceId);
    if (sourceJourneyContext) {
      const targetJourneyContext = this.mockJourneyContexts.get(targetId) || {};
      this.mockJourneyContexts.set(targetId, { ...targetJourneyContext, ...sourceJourneyContext });
    }
    
    // Merge gamification contexts
    const sourceGamificationContext = this.mockGamificationContexts.get(sourceId);
    if (sourceGamificationContext) {
      const targetGamificationContext = this.mockGamificationContexts.get(targetId) || {};
      this.mockGamificationContexts.set(targetId, { ...targetGamificationContext, ...sourceGamificationContext });
    }
    
    // Merge correlation IDs
    const sourceCorrelationIds = this.mockCorrelationIds.get(sourceId);
    if (sourceCorrelationIds) {
      const targetCorrelationIds = this.mockCorrelationIds.get(targetId) || {};
      this.mockCorrelationIds.set(targetId, { ...targetCorrelationIds, ...sourceCorrelationIds });
    }
    
    return target;
  }

  clearCurrentContext(): void {
    this.currentContext = null;
  }

  isSampled(context: Context): boolean {
    const contextId = this.getContextId(context);
    return contextId ? (this.mockSampledFlags.get(contextId) || false) : false;
  }

  isValid(context: Context): boolean {
    const contextId = this.getContextId(context);
    return !!contextId && !!this.mockTraceIds.get(contextId) && !!this.mockSpanIds.get(contextId);
  }

  createChildContext(parentContext: Context, name: string, attributes?: SpanAttributes): Context {
    const parentId = this.getContextId(parentContext);
    
    if (!parentId) {
      throw new Error('Invalid parent context: not created by this TraceContext instance');
    }
    
    const childId = `child-${Date.now()}-${Math.random()}`;
    const childContext = new MockContext();
    
    this.mockContexts.set(childId, childContext);
    
    // Inherit trace ID from parent, but generate new span ID
    this.mockTraceIds.set(childId, this.mockTraceIds.get(parentId) || this.generateTraceId());
    this.mockSpanIds.set(childId, this.generateSpanId());
    this.mockSampledFlags.set(childId, this.mockSampledFlags.get(parentId) || false);
    
    // Inherit journey context from parent
    const parentJourneyContext = this.mockJourneyContexts.get(parentId);
    if (parentJourneyContext) {
      this.mockJourneyContexts.set(childId, { ...parentJourneyContext });
    }
    
    // Inherit gamification context from parent
    const parentGamificationContext = this.mockGamificationContexts.get(parentId);
    if (parentGamificationContext) {
      this.mockGamificationContexts.set(childId, { ...parentGamificationContext });
    }
    
    // Inherit correlation IDs from parent
    const parentCorrelationIds = this.mockCorrelationIds.get(parentId);
    if (parentCorrelationIds) {
      this.mockCorrelationIds.set(childId, { ...parentCorrelationIds });
    }
    
    return childContext;
  }

  propagateToExternalSystem(context: Context, format: string, carrier: ContextCarrier): ContextCarrier {
    const contextId = this.getContextId(context);
    
    if (!contextId) {
      throw new Error('Invalid context: not created by this TraceContext instance');
    }
    
    const traceId = this.mockTraceIds.get(contextId) || this.generateTraceId();
    const spanId = this.mockSpanIds.get(contextId) || this.generateSpanId();
    const sampled = this.mockSampledFlags.get(contextId) ? '1' : '0';
    
    // Format-specific propagation
    switch (format.toLowerCase()) {
      case 'b3':
        // B3 single header format
        carrier['b3'] = `${traceId}-${spanId}-${sampled}`;
        break;
      case 'b3multi':
        // B3 multi-header format
        carrier['X-B3-TraceId'] = traceId;
        carrier['X-B3-SpanId'] = spanId;
        carrier['X-B3-Sampled'] = sampled;
        break;
      case 'jaeger':
        // Jaeger format
        carrier['uber-trace-id'] = `${traceId}:${spanId}:0:${sampled}`;
        break;
      case 'ot':
        // OpenTracing format
        carrier['ot-tracer-traceid'] = traceId;
        carrier['ot-tracer-spanid'] = spanId;
        carrier['ot-tracer-sampled'] = sampled;
        break;
      default:
        // Default to W3C format
        carrier['traceparent'] = `00-${traceId}-${spanId}-${sampled}0`;
        break;
    }
    
    return carrier;
  }

  extractFromExternalSystem(format: string, carrier: ContextCarrier): Context {
    const contextId = `external-${Date.now()}-${Math.random()}`;
    const context = new MockContext();
    
    this.mockContexts.set(contextId, context);
    
    let traceId = '';
    let spanId = '';
    let sampled = false;
    
    // Format-specific extraction
    switch (format.toLowerCase()) {
      case 'b3':
        // B3 single header format
        if (carrier['b3']) {
          const parts = carrier['b3'].split('-');
          if (parts.length >= 3) {
            traceId = parts[0];
            spanId = parts[1];
            sampled = parts[2] === '1';
          }
        }
        break;
      case 'b3multi':
        // B3 multi-header format
        traceId = carrier['X-B3-TraceId'] || '';
        spanId = carrier['X-B3-SpanId'] || '';
        sampled = carrier['X-B3-Sampled'] === '1';
        break;
      case 'jaeger':
        // Jaeger format
        if (carrier['uber-trace-id']) {
          const parts = carrier['uber-trace-id'].split(':');
          if (parts.length >= 4) {
            traceId = parts[0];
            spanId = parts[1];
            sampled = parts[3] === '1';
          }
        }
        break;
      case 'ot':
        // OpenTracing format
        traceId = carrier['ot-tracer-traceid'] || '';
        spanId = carrier['ot-tracer-spanid'] || '';
        sampled = carrier['ot-tracer-sampled'] === '1';
        break;
      default:
        // Default to W3C format
        if (carrier['traceparent']) {
          const parts = carrier['traceparent'].split('-');
          if (parts.length === 4) {
            traceId = parts[1];
            spanId = parts[2];
            sampled = parts[3].charAt(0) === '1';
          }
        }
        break;
    }
    
    if (traceId && spanId) {
      this.mockTraceIds.set(contextId, traceId);
      this.mockSpanIds.set(contextId, spanId);
      this.mockSampledFlags.set(contextId, sampled);
    } else {
      throw new Error(`Invalid carrier for format ${format}: missing required trace information`);
    }
    
    return context;
  }

  // Helper methods for the mock implementation
  private getContextId(context: Context): string | undefined {
    for (const [id, ctx] of this.mockContexts.entries()) {
      if (ctx === context) {
        return id;
      }
    }
    return undefined;
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

describe('TraceContext Interface', () => {
  let traceContext: TraceContext;
  
  beforeEach(() => {
    traceContext = new MockTraceContext();
  });
  
  describe('Context Creation', () => {
    it('should create a new trace context with default options', () => {
      const context = traceContext.create();
      
      expect(context).toBeDefined();
      expect(traceContext.getTraceId(context)).toBeTruthy();
      expect(traceContext.getSpanId(context)).toBeTruthy();
      expect(traceContext.isSampled(context)).toBe(true);
    });
    
    it('should create a trace context with journey context', () => {
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        currentStep: 'metrics-view',
        metrics: {
          metricType: 'heart-rate',
          timePeriod: 'daily',
        },
      };
      
      const context = traceContext.create({ journeyContext });
      
      expect(context).toBeDefined();
      expect(traceContext.getJourneyContext(context)).toEqual(journeyContext);
    });
    
    it('should create a trace context with gamification context', () => {
      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'health-metric-recorded',
          sourceJourney: JourneyType.HEALTH,
          pointsAwarded: 10,
        },
      };
      
      const context = traceContext.create({ gamificationContext });
      
      expect(context).toBeDefined();
      expect(traceContext.getGamificationContext(context)).toEqual(gamificationContext);
    });
    
    it('should create a trace context with correlation IDs', () => {
      const correlationIds = {
        requestId: 'req-123',
        sessionId: 'session-456',
        userId: 'user-789',
        transactionId: 'tx-abc',
      };
      
      const context = traceContext.create({ correlationIds });
      
      expect(context).toBeDefined();
      expect(traceContext.getCorrelationIds(context)).toEqual(correlationIds);
    });
    
    it('should inherit trace ID from parent context', () => {
      const parentContext = traceContext.create();
      const parentTraceId = traceContext.getTraceId(parentContext);
      
      const childContext = traceContext.create({ parentContext });
      const childTraceId = traceContext.getTraceId(childContext);
      
      expect(childTraceId).toBe(parentTraceId);
      expect(traceContext.getSpanId(childContext)).not.toBe(traceContext.getSpanId(parentContext));
    });
    
    it('should force new trace ID when forceNewTrace is true', () => {
      const parentContext = traceContext.create();
      const parentTraceId = traceContext.getTraceId(parentContext);
      
      const childContext = traceContext.create({ parentContext, forceNewTrace: true });
      const childTraceId = traceContext.getTraceId(childContext);
      
      expect(childTraceId).not.toBe(parentTraceId);
    });
  });
  
  describe('Context Extraction', () => {
    it('should extract context from carrier with traceparent', () => {
      const carrier: ContextCarrier = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      };
      
      const context = traceContext.extract(carrier);
      
      expect(context).toBeDefined();
      expect(traceContext.getTraceId(context)).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(traceContext.getSpanId(context)).toBe('b7ad6b7169203331');
      expect(traceContext.isSampled(context)).toBe(true);
    });
    
    it('should extract journey context from carrier', () => {
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        currentStep: 'metrics-view',
      };
      
      const carrier: ContextCarrier = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        'journey-context': JSON.stringify(journeyContext),
      };
      
      const context = traceContext.extract(carrier);
      
      expect(context).toBeDefined();
      expect(traceContext.getJourneyContext(context)).toEqual(journeyContext);
    });
    
    it('should extract gamification context from carrier', () => {
      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'health-metric-recorded',
          sourceJourney: JourneyType.HEALTH,
          pointsAwarded: 10,
        },
      };
      
      const carrier: ContextCarrier = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        'gamification-context': JSON.stringify(gamificationContext),
      };
      
      const context = traceContext.extract(carrier);
      
      expect(context).toBeDefined();
      expect(traceContext.getGamificationContext(context)).toEqual(gamificationContext);
    });
    
    it('should throw error for invalid carrier without ignoreInvalid option', () => {
      const carrier: ContextCarrier = {};
      
      expect(() => traceContext.extract(carrier)).toThrow('Invalid carrier: missing traceparent');
    });
    
    it('should not throw error for invalid carrier with ignoreInvalid option', () => {
      const carrier: ContextCarrier = {};
      
      expect(() => traceContext.extract(carrier, { ignoreInvalid: true })).not.toThrow();
    });
    
    it('should create new context if extraction fails and createIfMissing is true', () => {
      const carrier: ContextCarrier = {};
      
      const context = traceContext.extract(carrier, { ignoreInvalid: true, createIfMissing: true });
      
      expect(context).toBeDefined();
      expect(traceContext.getTraceId(context)).toBeTruthy();
      expect(traceContext.getSpanId(context)).toBeTruthy();
    });
    
    it('should use default journey context if not present in carrier', () => {
      const defaultJourneyContext: HealthJourneyContext = {
        journeyId: 'default-journey-123',
        userId: 'default-user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
      };
      
      const carrier: ContextCarrier = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      };
      
      const context = traceContext.extract(carrier, { defaultJourneyContext });
      
      expect(context).toBeDefined();
      expect(traceContext.getJourneyContext(context)).toEqual(defaultJourneyContext);
    });
  });
  
  describe('Context Injection', () => {
    it('should inject context into carrier with traceparent', () => {
      const context = traceContext.create();
      const carrier: ContextCarrier = {};
      
      const result = traceContext.inject(context, carrier);
      
      expect(result).toBe(carrier);
      expect(result['traceparent']).toBeTruthy();
      expect(result['traceparent']).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-[01]0$/);
    });
    
    it('should inject journey context into carrier', () => {
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        currentStep: 'metrics-view',
      };
      
      const context = traceContext.create({ journeyContext });
      const carrier: ContextCarrier = {};
      
      const result = traceContext.inject(context, carrier, { includeJourneyContext: true });
      
      expect(result['journey-context']).toBeTruthy();
      expect(JSON.parse(result['journey-context'])).toEqual(journeyContext);
    });
    
    it('should inject gamification context into carrier', () => {
      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'health-metric-recorded',
          sourceJourney: JourneyType.HEALTH,
          pointsAwarded: 10,
        },
      };
      
      const context = traceContext.create({ gamificationContext });
      const carrier: ContextCarrier = {};
      
      const result = traceContext.inject(context, carrier, { includeGamificationContext: true });
      
      expect(result['gamification-context']).toBeTruthy();
      expect(JSON.parse(result['gamification-context'])).toEqual(gamificationContext);
    });
    
    it('should not inject journey context when includeJourneyContext is false', () => {
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
      };
      
      const context = traceContext.create({ journeyContext });
      const carrier: ContextCarrier = {};
      
      const result = traceContext.inject(context, carrier, { includeJourneyContext: false });
      
      expect(result['journey-context']).toBeUndefined();
    });
    
    it('should include additional headers in carrier', () => {
      const context = traceContext.create();
      const carrier: ContextCarrier = {};
      const additionalHeaders = {
        'custom-header-1': 'value-1',
        'custom-header-2': 'value-2',
      };
      
      const result = traceContext.inject(context, carrier, { additionalHeaders });
      
      expect(result['custom-header-1']).toBe('value-1');
      expect(result['custom-header-2']).toBe('value-2');
    });
    
    it('should throw error for invalid context', () => {
      const invalidContext = new MockContext();
      const carrier: ContextCarrier = {};
      
      expect(() => traceContext.inject(invalidContext, carrier)).toThrow('Invalid context');
    });
  });
  
  describe('Context Serialization and Deserialization', () => {
    it('should serialize context to SerializedTraceContext', () => {
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
      };
      
      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'health-metric-recorded',
          sourceJourney: JourneyType.HEALTH,
          pointsAwarded: 10,
        },
      };
      
      const correlationIds = {
        requestId: 'req-123',
        sessionId: 'session-456',
        userId: 'user-789',
        transactionId: 'tx-abc',
      };
      
      const context = traceContext.create({ journeyContext, gamificationContext, correlationIds });
      
      const serialized = traceContext.serialize(context);
      
      expect(serialized.traceParent).toBeTruthy();
      expect(serialized.traceParent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-[01]0$/);
      expect(serialized.journeyContext).toBeTruthy();
      expect(JSON.parse(serialized.journeyContext!)).toEqual(journeyContext);
      expect(serialized.gamificationContext).toBeTruthy();
      expect(JSON.parse(serialized.gamificationContext!)).toEqual(gamificationContext);
      expect(serialized.correlationIds).toEqual(correlationIds);
    });
    
    it('should deserialize context from SerializedTraceContext', () => {
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
      };
      
      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'health-metric-recorded',
          sourceJourney: JourneyType.HEALTH,
          pointsAwarded: 10,
        },
      };
      
      const correlationIds = {
        requestId: 'req-123',
        sessionId: 'session-456',
        userId: 'user-789',
        transactionId: 'tx-abc',
      };
      
      const serialized: SerializedTraceContext = {
        traceParent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-10',
        journeyContext: JSON.stringify(journeyContext),
        gamificationContext: JSON.stringify(gamificationContext),
        correlationIds,
      };
      
      const context = traceContext.deserialize(serialized);
      
      expect(context).toBeDefined();
      expect(traceContext.getTraceId(context)).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(traceContext.getSpanId(context)).toBe('b7ad6b7169203331');
      expect(traceContext.getJourneyContext(context)).toEqual(journeyContext);
      expect(traceContext.getGamificationContext(context)).toEqual(gamificationContext);
      expect(traceContext.getCorrelationIds(context)).toEqual(correlationIds);
    });
    
    it('should handle invalid journey context during deserialization', () => {
      const serialized: SerializedTraceContext = {
        traceParent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-10',
        journeyContext: 'invalid-json',
      };
      
      const context = traceContext.deserialize(serialized);
      
      expect(context).toBeDefined();
      expect(traceContext.getTraceId(context)).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(traceContext.getSpanId(context)).toBe('b7ad6b7169203331');
      expect(traceContext.getJourneyContext(context)).toBeUndefined();
    });
    
    it('should throw error for invalid context during serialization', () => {
      const invalidContext = new MockContext();
      
      expect(() => traceContext.serialize(invalidContext)).toThrow('Invalid context');
    });
  });
  
  describe('Context Getters and Setters', () => {
    it('should get and set journey context', () => {
      const context = traceContext.create();
      
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
      };
      
      traceContext.setJourneyContext(context, journeyContext);
      
      expect(traceContext.getJourneyContext(context)).toEqual(journeyContext);
    });
    
    it('should get and set gamification context', () => {
      const context = traceContext.create();
      
      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'health-metric-recorded',
          sourceJourney: JourneyType.HEALTH,
          pointsAwarded: 10,
        },
      };
      
      traceContext.setGamificationContext(context, gamificationContext);
      
      expect(traceContext.getGamificationContext(context)).toEqual(gamificationContext);
    });
    
    it('should get and set correlation IDs', () => {
      const context = traceContext.create();
      
      const correlationIds = {
        requestId: 'req-123',
        sessionId: 'session-456',
        userId: 'user-789',
        transactionId: 'tx-abc',
      };
      
      traceContext.setCorrelationIds(context, correlationIds);
      
      expect(traceContext.getCorrelationIds(context)).toEqual(correlationIds);
    });
    
    it('should throw error when setting journey context on invalid context', () => {
      const invalidContext = new MockContext();
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
      };
      
      expect(() => traceContext.setJourneyContext(invalidContext, journeyContext)).toThrow('Invalid context');
    });
  });
  
  describe('Context Merging', () => {
    it('should merge two contexts', () => {
      const targetJourneyContext: HealthJourneyContext = {
        journeyId: 'target-journey-123',
        userId: 'target-user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        currentStep: 'target-step',
      };
      
      const sourceJourneyContext: HealthJourneyContext = {
        journeyId: 'source-journey-123',
        userId: 'source-user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        previousStep: 'source-step',
      };
      
      const targetContext = traceContext.create({ journeyContext: targetJourneyContext });
      const sourceContext = traceContext.create({ journeyContext: sourceJourneyContext });
      
      traceContext.merge(targetContext, sourceContext);
      
      const mergedJourneyContext = traceContext.getJourneyContext(targetContext);
      
      expect(mergedJourneyContext).toEqual({
        ...targetJourneyContext,
        ...sourceJourneyContext,
      });
    });
    
    it('should throw error when merging invalid contexts', () => {
      const validContext = traceContext.create();
      const invalidContext = new MockContext();
      
      expect(() => traceContext.merge(validContext, invalidContext)).toThrow('Invalid context');
      expect(() => traceContext.merge(invalidContext, validContext)).toThrow('Invalid context');
    });
  });
  
  describe('Child Context Creation', () => {
    it('should create child context with parent trace ID', () => {
      const parentContext = traceContext.create();
      const parentTraceId = traceContext.getTraceId(parentContext);
      
      const childContext = traceContext.createChildContext(parentContext, 'child-operation');
      
      expect(traceContext.getTraceId(childContext)).toBe(parentTraceId);
      expect(traceContext.getSpanId(childContext)).not.toBe(traceContext.getSpanId(parentContext));
    });
    
    it('should inherit journey context in child context', () => {
      const journeyContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
      };
      
      const parentContext = traceContext.create({ journeyContext });
      const childContext = traceContext.createChildContext(parentContext, 'child-operation');
      
      expect(traceContext.getJourneyContext(childContext)).toEqual(journeyContext);
    });
    
    it('should throw error when creating child from invalid parent context', () => {
      const invalidContext = new MockContext();
      
      expect(() => traceContext.createChildContext(invalidContext, 'child-operation')).toThrow('Invalid parent context');
    });
  });
  
  describe('External System Propagation', () => {
    it('should propagate context to B3 format', () => {
      const context = traceContext.create();
      const carrier: ContextCarrier = {};
      
      traceContext.propagateToExternalSystem(context, 'b3', carrier);
      
      expect(carrier['b3']).toBeTruthy();
      expect(carrier['b3']).toMatch(/^[a-f0-9]{32}-[a-f0-9]{16}-[01]$/);
    });
    
    it('should propagate context to B3 multi-header format', () => {
      const context = traceContext.create();
      const carrier: ContextCarrier = {};
      
      traceContext.propagateToExternalSystem(context, 'b3multi', carrier);
      
      expect(carrier['X-B3-TraceId']).toBeTruthy();
      expect(carrier['X-B3-SpanId']).toBeTruthy();
      expect(carrier['X-B3-Sampled']).toBeTruthy();
    });
    
    it('should propagate context to Jaeger format', () => {
      const context = traceContext.create();
      const carrier: ContextCarrier = {};
      
      traceContext.propagateToExternalSystem(context, 'jaeger', carrier);
      
      expect(carrier['uber-trace-id']).toBeTruthy();
      expect(carrier['uber-trace-id']).toMatch(/^[a-f0-9]{32}:[a-f0-9]{16}:0:[01]$/);
    });
    
    it('should extract context from B3 format', () => {
      const carrier: ContextCarrier = {
        'b3': '0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-1',
      };
      
      const context = traceContext.extractFromExternalSystem('b3', carrier);
      
      expect(context).toBeDefined();
      expect(traceContext.getTraceId(context)).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(traceContext.getSpanId(context)).toBe('b7ad6b7169203331');
      expect(traceContext.isSampled(context)).toBe(true);
    });
    
    it('should extract context from B3 multi-header format', () => {
      const carrier: ContextCarrier = {
        'X-B3-TraceId': '0af7651916cd43dd8448eb211c80319c',
        'X-B3-SpanId': 'b7ad6b7169203331',
        'X-B3-Sampled': '1',
      };
      
      const context = traceContext.extractFromExternalSystem('b3multi', carrier);
      
      expect(context).toBeDefined();
      expect(traceContext.getTraceId(context)).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(traceContext.getSpanId(context)).toBe('b7ad6b7169203331');
      expect(traceContext.isSampled(context)).toBe(true);
    });
    
    it('should throw error for invalid carrier in external system extraction', () => {
      const carrier: ContextCarrier = {};
      
      expect(() => traceContext.extractFromExternalSystem('b3', carrier)).toThrow('Invalid carrier for format b3');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid journey context during extraction', () => {
      const carrier: ContextCarrier = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        'journey-context': 'invalid-json',
      };
      
      const defaultJourneyContext: HealthJourneyContext = {
        journeyId: 'default-journey-123',
        userId: 'default-user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
      };
      
      const context = traceContext.extract(carrier, { defaultJourneyContext });
      
      expect(context).toBeDefined();
      expect(traceContext.getJourneyContext(context)).toEqual(defaultJourneyContext);
    });
    
    it('should handle invalid gamification context during extraction', () => {
      const carrier: ContextCarrier = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        'gamification-context': 'invalid-json',
      };
      
      const defaultGamificationContext: GamificationContext = {
        event: {
          eventId: 'default-event-123',
          eventType: 'default-event-type',
          sourceJourney: JourneyType.HEALTH,
        },
      };
      
      const context = traceContext.extract(carrier, { defaultGamificationContext });
      
      expect(context).toBeDefined();
      expect(traceContext.getGamificationContext(context)).toEqual(defaultGamificationContext);
    });
    
    it('should validate context is valid', () => {
      const validContext = traceContext.create();
      const invalidContext = new MockContext();
      
      expect(traceContext.isValid(validContext)).toBe(true);
      expect(traceContext.isValid(invalidContext)).toBe(false);
    });
  });
});