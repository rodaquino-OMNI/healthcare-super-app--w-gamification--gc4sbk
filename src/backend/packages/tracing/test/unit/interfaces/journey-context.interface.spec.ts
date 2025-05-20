import { Context, Span, SpanContext, SpanKind, trace } from '@opentelemetry/api';
import { JourneyContextInfo } from '../../../src/interfaces/trace-context.interface';
import { JourneyType, addHealthJourneyAttributes, addCareJourneyAttributes, addPlanJourneyAttributes } from '../../../src/utils/span-attributes';

// Mock implementation of TraceContext for testing
class MockTraceContext {
  private context: Context;
  private journeyContext?: JourneyContextInfo;

  constructor() {
    this.context = trace.context();
  }

  getContext(): Context {
    return this.context;
  }

  withJourneyContext(journeyContext: JourneyContextInfo): MockTraceContext {
    const newContext = new MockTraceContext();
    newContext.journeyContext = journeyContext;
    return newContext;
  }

  getJourneyContext(): JourneyContextInfo | undefined {
    return this.journeyContext;
  }

  withHealthJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
    return this.withJourneyContext({
      journeyType: 'health',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  withCareJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
    return this.withJourneyContext({
      journeyType: 'care',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  withPlanJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
    return this.withJourneyContext({
      journeyType: 'plan',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  getCorrelationInfo() {
    return {
      traceId: undefined,
      spanId: undefined,
      traceFlags: undefined,
      isSampled: false,
      journeyType: this.journeyContext?.journeyType,
      journeyId: this.journeyContext?.journeyId,
      userId: this.journeyContext?.userId,
      sessionId: this.journeyContext?.sessionId,
      requestId: this.journeyContext?.requestId,
    };
  }
}

// Mock implementation of Span for testing
class MockSpan implements Span {
  private attributes: Record<string, any> = {};

  setAttribute(key: string, value: any): this {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Record<string, any>): this {
    Object.entries(attributes).forEach(([key, value]) => {
      this.attributes[key] = value;
    });
    return this;
  }

  getAttributes(): Record<string, any> {
    return this.attributes;
  }

  // Implement other required methods with minimal functionality for testing
  addEvent(): this { return this; }
  setStatus(): this { return this; }
  updateName(): this { return this; }
  end(): void {}
  isRecording(): boolean { return true; }
  recordException(): void {}
  spanContext(): SpanContext { return {} as SpanContext; }
}

describe('Journey Context Interface', () => {
  describe('JourneyContextInfo interface', () => {
    it('should have the correct structure', () => {
      const healthJourneyContext: JourneyContextInfo = {
        journeyType: 'health',
        journeyId: 'health-journey-123',
        userId: 'user-123',
        sessionId: 'session-123',
        requestId: 'request-123',
      };

      expect(healthJourneyContext.journeyType).toBe('health');
      expect(healthJourneyContext.journeyId).toBe('health-journey-123');
      expect(healthJourneyContext.userId).toBe('user-123');
      expect(healthJourneyContext.sessionId).toBe('session-123');
      expect(healthJourneyContext.requestId).toBe('request-123');

      // Test with minimal required fields
      const minimalJourneyContext: JourneyContextInfo = {
        journeyType: 'care',
        journeyId: 'care-journey-456',
      };

      expect(minimalJourneyContext.journeyType).toBe('care');
      expect(minimalJourneyContext.journeyId).toBe('care-journey-456');
      expect(minimalJourneyContext.userId).toBeUndefined();
      expect(minimalJourneyContext.sessionId).toBeUndefined();
      expect(minimalJourneyContext.requestId).toBeUndefined();
    });

    it('should validate journey types', () => {
      // Valid journey types
      const healthJourney: JourneyContextInfo = { journeyType: 'health', journeyId: 'id-1' };
      const careJourney: JourneyContextInfo = { journeyType: 'care', journeyId: 'id-2' };
      const planJourney: JourneyContextInfo = { journeyType: 'plan', journeyId: 'id-3' };

      expect(healthJourney.journeyType).toBe('health');
      expect(careJourney.journeyType).toBe('care');
      expect(planJourney.journeyType).toBe('plan');

      // TypeScript would catch this at compile time, but we're testing the runtime behavior
      // @ts-expect-error - Invalid journey type
      const invalidJourney: JourneyContextInfo = { journeyType: 'invalid', journeyId: 'id-4' };
      
      // In runtime, this would still work but wouldn't be type-safe
      expect(invalidJourney.journeyType).toBe('invalid');
    });
  });

  describe('TraceContext journey methods', () => {
    let traceContext: MockTraceContext;

    beforeEach(() => {
      traceContext = new MockTraceContext();
    });

    it('should create a health journey context', () => {
      const healthContext = traceContext.withHealthJourney(
        'health-journey-123',
        'user-123',
        'session-123',
        'request-123'
      );

      const journeyContext = healthContext.getJourneyContext();
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('health');
      expect(journeyContext?.journeyId).toBe('health-journey-123');
      expect(journeyContext?.userId).toBe('user-123');
      expect(journeyContext?.sessionId).toBe('session-123');
      expect(journeyContext?.requestId).toBe('request-123');
    });

    it('should create a care journey context', () => {
      const careContext = traceContext.withCareJourney(
        'care-journey-456',
        'user-456',
        'session-456',
        'request-456'
      );

      const journeyContext = careContext.getJourneyContext();
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('care');
      expect(journeyContext?.journeyId).toBe('care-journey-456');
      expect(journeyContext?.userId).toBe('user-456');
      expect(journeyContext?.sessionId).toBe('session-456');
      expect(journeyContext?.requestId).toBe('request-456');
    });

    it('should create a plan journey context', () => {
      const planContext = traceContext.withPlanJourney(
        'plan-journey-789',
        'user-789',
        'session-789',
        'request-789'
      );

      const journeyContext = planContext.getJourneyContext();
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('plan');
      expect(journeyContext?.journeyId).toBe('plan-journey-789');
      expect(journeyContext?.userId).toBe('user-789');
      expect(journeyContext?.sessionId).toBe('session-789');
      expect(journeyContext?.requestId).toBe('request-789');
    });

    it('should create journey context with minimal information', () => {
      const healthContext = traceContext.withHealthJourney('health-journey-123');
      const journeyContext = healthContext.getJourneyContext();
      
      expect(journeyContext).toBeDefined();
      expect(journeyContext?.journeyType).toBe('health');
      expect(journeyContext?.journeyId).toBe('health-journey-123');
      expect(journeyContext?.userId).toBeUndefined();
      expect(journeyContext?.sessionId).toBeUndefined();
      expect(journeyContext?.requestId).toBeUndefined();
    });

    it('should include journey context in correlation info', () => {
      const healthContext = traceContext.withHealthJourney(
        'health-journey-123',
        'user-123',
        'session-123',
        'request-123'
      );

      const correlationInfo = healthContext.getCorrelationInfo();
      expect(correlationInfo.journeyType).toBe('health');
      expect(correlationInfo.journeyId).toBe('health-journey-123');
      expect(correlationInfo.userId).toBe('user-123');
      expect(correlationInfo.sessionId).toBe('session-123');
      expect(correlationInfo.requestId).toBe('request-123');
    });
  });

  describe('Journey-specific span attributes', () => {
    let mockSpan: MockSpan;

    beforeEach(() => {
      mockSpan = new MockSpan();
    });

    it('should add health journey attributes to span', () => {
      const span = addHealthJourneyAttributes(
        mockSpan,
        'heart_rate',
        'device-123',
        'goal-123',
        { activity_type: 'running' }
      );

      const attributes = span.getAttributes();
      expect(attributes['austa.journey.type']).toBe(JourneyType.HEALTH);
      expect(attributes['austa.journey.health.metric_type']).toBe('heart_rate');
      expect(attributes['austa.journey.health.device_id']).toBe('device-123');
      expect(attributes['austa.journey.health.goal_id']).toBe('goal-123');
      expect(attributes['austa.journey.health.activity_type']).toBe('running');
    });

    it('should add care journey attributes to span', () => {
      const span = addCareJourneyAttributes(
        mockSpan,
        'appointment-123',
        'provider-123',
        'telemedicine-123',
        'treatment-123',
        { specialty: 'cardiology' }
      );

      const attributes = span.getAttributes();
      expect(attributes['austa.journey.type']).toBe(JourneyType.CARE);
      expect(attributes['austa.journey.care.appointment_id']).toBe('appointment-123');
      expect(attributes['austa.journey.care.provider_id']).toBe('provider-123');
      expect(attributes['austa.journey.care.session_id']).toBe('telemedicine-123');
      expect(attributes['austa.journey.care.treatment_plan_id']).toBe('treatment-123');
      expect(attributes['austa.journey.care.specialty']).toBe('cardiology');
    });

    it('should add plan journey attributes to span', () => {
      const span = addPlanJourneyAttributes(
        mockSpan,
        'plan-123',
        'claim-123',
        'benefit-123',
        { coverage_type: 'family' }
      );

      const attributes = span.getAttributes();
      expect(attributes['austa.journey.type']).toBe(JourneyType.PLAN);
      expect(attributes['austa.journey.plan.plan_id']).toBe('plan-123');
      expect(attributes['austa.journey.plan.claim_id']).toBe('claim-123');
      expect(attributes['austa.journey.plan.benefit_id']).toBe('benefit-123');
      expect(attributes['austa.journey.plan.coverage_type']).toBe('family');
    });

    it('should add minimal health journey attributes to span', () => {
      const span = addHealthJourneyAttributes(mockSpan);

      const attributes = span.getAttributes();
      expect(attributes['austa.journey.type']).toBe(JourneyType.HEALTH);
      expect(attributes['austa.journey.health.metric_type']).toBeUndefined();
      expect(attributes['austa.journey.health.device_id']).toBeUndefined();
      expect(attributes['austa.journey.health.goal_id']).toBeUndefined();
    });

    it('should add minimal care journey attributes to span', () => {
      const span = addCareJourneyAttributes(mockSpan);

      const attributes = span.getAttributes();
      expect(attributes['austa.journey.type']).toBe(JourneyType.CARE);
      expect(attributes['austa.journey.care.appointment_id']).toBeUndefined();
      expect(attributes['austa.journey.care.provider_id']).toBeUndefined();
      expect(attributes['austa.journey.care.session_id']).toBeUndefined();
      expect(attributes['austa.journey.care.treatment_plan_id']).toBeUndefined();
    });

    it('should add minimal plan journey attributes to span', () => {
      const span = addPlanJourneyAttributes(mockSpan);

      const attributes = span.getAttributes();
      expect(attributes['austa.journey.type']).toBe(JourneyType.PLAN);
      expect(attributes['austa.journey.plan.plan_id']).toBeUndefined();
      expect(attributes['austa.journey.plan.claim_id']).toBeUndefined();
      expect(attributes['austa.journey.plan.benefit_id']).toBeUndefined();
    });
  });

  describe('Cross-journey correlation', () => {
    let traceContext: MockTraceContext;

    beforeEach(() => {
      traceContext = new MockTraceContext();
    });

    it('should maintain correlation attributes across journey transitions', () => {
      // Start with a health journey
      const userId = 'user-123';
      const sessionId = 'session-123';
      const requestId = 'request-123';
      
      const healthContext = traceContext.withHealthJourney(
        'health-journey-123',
        userId,
        sessionId,
        requestId
      );

      // Transition to a care journey while maintaining user context
      const careContext = traceContext.withCareJourney(
        'care-journey-456',
        userId,
        sessionId,
        requestId
      );

      // Transition to a plan journey while maintaining user context
      const planContext = traceContext.withPlanJourney(
        'plan-journey-789',
        userId,
        sessionId,
        requestId
      );

      // Verify health journey context
      const healthJourneyContext = healthContext.getJourneyContext();
      expect(healthJourneyContext?.journeyType).toBe('health');
      expect(healthJourneyContext?.journeyId).toBe('health-journey-123');
      expect(healthJourneyContext?.userId).toBe(userId);
      expect(healthJourneyContext?.sessionId).toBe(sessionId);
      expect(healthJourneyContext?.requestId).toBe(requestId);

      // Verify care journey context
      const careJourneyContext = careContext.getJourneyContext();
      expect(careJourneyContext?.journeyType).toBe('care');
      expect(careJourneyContext?.journeyId).toBe('care-journey-456');
      expect(careJourneyContext?.userId).toBe(userId);
      expect(careJourneyContext?.sessionId).toBe(sessionId);
      expect(careJourneyContext?.requestId).toBe(requestId);

      // Verify plan journey context
      const planJourneyContext = planContext.getJourneyContext();
      expect(planJourneyContext?.journeyType).toBe('plan');
      expect(planJourneyContext?.journeyId).toBe('plan-journey-789');
      expect(planJourneyContext?.userId).toBe(userId);
      expect(planJourneyContext?.sessionId).toBe(sessionId);
      expect(planJourneyContext?.requestId).toBe(requestId);

      // Verify correlation info for each journey
      const healthCorrelation = healthContext.getCorrelationInfo();
      const careCorrelation = careContext.getCorrelationInfo();
      const planCorrelation = planContext.getCorrelationInfo();

      // All should have the same user, session, and request IDs
      expect(healthCorrelation.userId).toBe(userId);
      expect(careCorrelation.userId).toBe(userId);
      expect(planCorrelation.userId).toBe(userId);

      expect(healthCorrelation.sessionId).toBe(sessionId);
      expect(careCorrelation.sessionId).toBe(sessionId);
      expect(planCorrelation.sessionId).toBe(sessionId);

      expect(healthCorrelation.requestId).toBe(requestId);
      expect(careCorrelation.requestId).toBe(requestId);
      expect(planCorrelation.requestId).toBe(requestId);

      // But different journey types and IDs
      expect(healthCorrelation.journeyType).toBe('health');
      expect(careCorrelation.journeyType).toBe('care');
      expect(planCorrelation.journeyType).toBe('plan');

      expect(healthCorrelation.journeyId).toBe('health-journey-123');
      expect(careCorrelation.journeyId).toBe('care-journey-456');
      expect(planCorrelation.journeyId).toBe('plan-journey-789');
    });

    it('should support multi-journey achievement tracking', () => {
      // Create contexts for different journeys with the same user
      const userId = 'user-123';
      const healthContext = traceContext.withHealthJourney('health-journey-123', userId);
      const careContext = traceContext.withCareJourney('care-journey-456', userId);
      const planContext = traceContext.withPlanJourney('plan-journey-789', userId);

      // Verify all contexts have the same user ID for achievement tracking
      expect(healthContext.getJourneyContext()?.userId).toBe(userId);
      expect(careContext.getJourneyContext()?.userId).toBe(userId);
      expect(planContext.getJourneyContext()?.userId).toBe(userId);

      // Verify correlation info contains the user ID for achievement tracking
      expect(healthContext.getCorrelationInfo().userId).toBe(userId);
      expect(careContext.getCorrelationInfo().userId).toBe(userId);
      expect(planContext.getCorrelationInfo().userId).toBe(userId);
    });
  });
});