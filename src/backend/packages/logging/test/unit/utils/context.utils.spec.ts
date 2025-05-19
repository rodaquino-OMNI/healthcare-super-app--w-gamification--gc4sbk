import { Request } from 'express';
import { KafkaMessage } from 'kafkajs';
import { JourneyType } from '../../../src/context/context.constants';
import * as contextUtils from '../../../src/utils/context.utils';

describe('Context Utilities', () => {
  describe('createContext', () => {
    it('should create a basic context with required properties', () => {
      const context = contextUtils.createContext();
      
      expect(context).toBeDefined();
      expect(context.correlationId).toBeDefined();
      expect(context.timestamp).toBeDefined();
      expect(context.service).toBeDefined();
    });

    it('should create a context with custom properties', () => {
      const customContext = {
        correlationId: 'test-correlation-id',
        service: 'test-service',
        environment: 'test'
      };
      
      const context = contextUtils.createContext(customContext);
      
      expect(context).toBeDefined();
      expect(context.correlationId).toBe('test-correlation-id');
      expect(context.service).toBe('test-service');
      expect(context.environment).toBe('test');
      expect(context.timestamp).toBeDefined();
    });
  });

  describe('cloneContext', () => {
    it('should create a new instance with the same properties', () => {
      const originalContext = contextUtils.createContext({
        correlationId: 'test-correlation-id',
        service: 'test-service',
        customProperty: 'custom-value'
      });
      
      const clonedContext = contextUtils.cloneContext(originalContext);
      
      expect(clonedContext).not.toBe(originalContext); // Different instance
      expect(clonedContext).toEqual(originalContext); // Same properties
    });

    it('should allow overriding properties in the cloned context', () => {
      const originalContext = contextUtils.createContext({
        correlationId: 'test-correlation-id',
        service: 'test-service',
        customProperty: 'custom-value'
      });
      
      const clonedContext = contextUtils.cloneContext(originalContext, {
        service: 'new-service',
        newProperty: 'new-value'
      });
      
      expect(clonedContext).not.toBe(originalContext);
      expect(clonedContext.correlationId).toBe('test-correlation-id');
      expect(clonedContext.service).toBe('new-service');
      expect(clonedContext.customProperty).toBe('custom-value');
      expect(clonedContext.newProperty).toBe('new-value');
    });
  });

  describe('mergeContexts', () => {
    it('should merge parent and child contexts', () => {
      const parentContext = contextUtils.createContext({
        correlationId: 'parent-correlation-id',
        service: 'parent-service',
        parentProperty: 'parent-value'
      });
      
      const childContext = contextUtils.createContext({
        childProperty: 'child-value',
        service: 'child-service'
      });
      
      const mergedContext = contextUtils.mergeContexts(parentContext, childContext);
      
      expect(mergedContext.correlationId).toBe('parent-correlation-id'); // Preserve parent correlation ID
      expect(mergedContext.service).toBe('child-service'); // Child overrides parent
      expect(mergedContext.parentProperty).toBe('parent-value'); // Keep parent properties
      expect(mergedContext.childProperty).toBe('child-value'); // Add child properties
    });

    it('should handle undefined parent context', () => {
      const childContext = contextUtils.createContext({
        correlationId: 'child-correlation-id',
        service: 'child-service'
      });
      
      const mergedContext = contextUtils.mergeContexts(undefined, childContext);
      
      expect(mergedContext).toEqual(childContext);
    });

    it('should handle undefined child context', () => {
      const parentContext = contextUtils.createContext({
        correlationId: 'parent-correlation-id',
        service: 'parent-service'
      });
      
      const mergedContext = contextUtils.mergeContexts(parentContext, undefined);
      
      expect(mergedContext).toEqual(parentContext);
    });
  });

  describe('extractContextFromRequest', () => {
    it('should extract context from HTTP request headers', () => {
      const mockRequest = {
        headers: {
          'x-correlation-id': 'test-correlation-id',
          'x-request-id': 'test-request-id',
          'user-agent': 'test-user-agent',
          'x-journey-type': 'HEALTH'
        },
        ip: '127.0.0.1',
        method: 'GET',
        url: '/api/test',
        path: '/test',
        query: { param: 'value' }
      } as unknown as Request;
      
      const context = contextUtils.extractContextFromRequest(mockRequest);
      
      expect(context).toBeDefined();
      expect(context.correlationId).toBe('test-correlation-id');
      expect(context.requestId).toBe('test-request-id');
      expect(context.userAgent).toBe('test-user-agent');
      expect(context.ip).toBe('127.0.0.1');
      expect(context.method).toBe('GET');
      expect(context.url).toBe('/api/test');
      expect(context.path).toBe('/test');
      expect(context.journeyType).toBe('HEALTH');
    });

    it('should generate correlation ID if not present in request', () => {
      const mockRequest = {
        headers: {},
        ip: '127.0.0.1',
        method: 'GET',
        url: '/api/test'
      } as unknown as Request;
      
      const context = contextUtils.extractContextFromRequest(mockRequest);
      
      expect(context).toBeDefined();
      expect(context.correlationId).toBeDefined();
      expect(typeof context.correlationId).toBe('string');
      expect(context.correlationId.length).toBeGreaterThan(0);
    });

    it('should extract user ID from authenticated request', () => {
      const mockRequest = {
        headers: {},
        ip: '127.0.0.1',
        method: 'GET',
        url: '/api/test',
        user: { id: 'test-user-id', roles: ['user'] }
      } as unknown as Request;
      
      const context = contextUtils.extractContextFromRequest(mockRequest);
      
      expect(context).toBeDefined();
      expect(context.userId).toBe('test-user-id');
      expect(context.userRoles).toEqual(['user']);
    });
  });

  describe('extractContextFromKafkaMessage', () => {
    it('should extract context from Kafka message headers', () => {
      const mockKafkaMessage = {
        headers: {
          'x-correlation-id': { value: Buffer.from('test-correlation-id') },
          'x-request-id': { value: Buffer.from('test-request-id') },
          'x-journey-type': { value: Buffer.from('HEALTH') },
          'x-user-id': { value: Buffer.from('test-user-id') }
        },
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test-data' })),
        timestamp: '1617235200000'
      } as unknown as KafkaMessage;
      
      const context = contextUtils.extractContextFromKafkaMessage(mockKafkaMessage);
      
      expect(context).toBeDefined();
      expect(context.correlationId).toBe('test-correlation-id');
      expect(context.requestId).toBe('test-request-id');
      expect(context.journeyType).toBe('HEALTH');
      expect(context.userId).toBe('test-user-id');
      expect(context.messageKey).toBe('test-key');
      expect(context.timestamp).toBeDefined();
    });

    it('should generate correlation ID if not present in Kafka message', () => {
      const mockKafkaMessage = {
        headers: {},
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test-data' })),
        timestamp: '1617235200000'
      } as unknown as KafkaMessage;
      
      const context = contextUtils.extractContextFromKafkaMessage(mockKafkaMessage);
      
      expect(context).toBeDefined();
      expect(context.correlationId).toBeDefined();
      expect(typeof context.correlationId).toBe('string');
      expect(context.correlationId.length).toBeGreaterThan(0);
    });

    it('should handle missing or invalid headers', () => {
      const mockKafkaMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test-data' })),
        timestamp: '1617235200000'
      } as unknown as KafkaMessage;
      
      const context = contextUtils.extractContextFromKafkaMessage(mockKafkaMessage);
      
      expect(context).toBeDefined();
      expect(context.correlationId).toBeDefined();
      expect(context.messageKey).toBe('test-key');
    });
  });

  describe('createJourneyContext', () => {
    it('should create a context with journey-specific information', () => {
      const baseContext = contextUtils.createContext({
        correlationId: 'test-correlation-id',
        userId: 'test-user-id'
      });
      
      const journeyContext = contextUtils.createJourneyContext(baseContext, {
        journeyType: JourneyType.HEALTH,
        journeyState: { currentStep: 'metrics' }
      });
      
      expect(journeyContext).toBeDefined();
      expect(journeyContext.correlationId).toBe('test-correlation-id');
      expect(journeyContext.userId).toBe('test-user-id');
      expect(journeyContext.journeyType).toBe(JourneyType.HEALTH);
      expect(journeyContext.journeyState).toEqual({ currentStep: 'metrics' });
    });

    it('should create a journey context with default base context if not provided', () => {
      const journeyContext = contextUtils.createJourneyContext(undefined, {
        journeyType: JourneyType.CARE,
        journeyState: { currentStep: 'appointment' }
      });
      
      expect(journeyContext).toBeDefined();
      expect(journeyContext.correlationId).toBeDefined();
      expect(journeyContext.journeyType).toBe(JourneyType.CARE);
      expect(journeyContext.journeyState).toEqual({ currentStep: 'appointment' });
    });

    it('should create journey contexts for each journey type', () => {
      // Health Journey
      const healthContext = contextUtils.createJourneyContext(undefined, {
        journeyType: JourneyType.HEALTH,
        journeyState: { currentStep: 'metrics' }
      });
      
      expect(healthContext.journeyType).toBe(JourneyType.HEALTH);
      
      // Care Journey
      const careContext = contextUtils.createJourneyContext(undefined, {
        journeyType: JourneyType.CARE,
        journeyState: { currentStep: 'appointment' }
      });
      
      expect(careContext.journeyType).toBe(JourneyType.CARE);
      
      // Plan Journey
      const planContext = contextUtils.createJourneyContext(undefined, {
        journeyType: JourneyType.PLAN,
        journeyState: { currentStep: 'benefits' }
      });
      
      expect(planContext.journeyType).toBe(JourneyType.PLAN);
    });
  });

  describe('propagateContext', () => {
    it('should add context headers to an HTTP request', () => {
      const context = contextUtils.createContext({
        correlationId: 'test-correlation-id',
        requestId: 'test-request-id',
        userId: 'test-user-id',
        journeyType: JourneyType.HEALTH
      });
      
      const headers = {};
      contextUtils.propagateContextToHeaders(context, headers);
      
      expect(headers).toHaveProperty('x-correlation-id', 'test-correlation-id');
      expect(headers).toHaveProperty('x-request-id', 'test-request-id');
      expect(headers).toHaveProperty('x-user-id', 'test-user-id');
      expect(headers).toHaveProperty('x-journey-type', JourneyType.HEALTH);
    });

    it('should add context headers to Kafka message headers', () => {
      const context = contextUtils.createContext({
        correlationId: 'test-correlation-id',
        requestId: 'test-request-id',
        userId: 'test-user-id',
        journeyType: JourneyType.CARE
      });
      
      const headers = {};
      contextUtils.propagateContextToKafkaHeaders(context, headers);
      
      expect(headers).toHaveProperty('x-correlation-id');
      expect(headers['x-correlation-id'].value.toString()).toBe('test-correlation-id');
      expect(headers).toHaveProperty('x-request-id');
      expect(headers['x-request-id'].value.toString()).toBe('test-request-id');
      expect(headers).toHaveProperty('x-user-id');
      expect(headers['x-user-id'].value.toString()).toBe('test-user-id');
      expect(headers).toHaveProperty('x-journey-type');
      expect(headers['x-journey-type'].value.toString()).toBe(JourneyType.CARE);
    });

    it('should only propagate whitelisted headers', () => {
      const context = contextUtils.createContext({
        correlationId: 'test-correlation-id',
        requestId: 'test-request-id',
        userId: 'test-user-id',
        journeyType: JourneyType.PLAN,
        sensitiveData: 'should-not-be-propagated',
        internalState: { shouldNotBePropagated: true }
      });
      
      const headers = {};
      contextUtils.propagateContextToHeaders(context, headers);
      
      expect(headers).toHaveProperty('x-correlation-id');
      expect(headers).toHaveProperty('x-request-id');
      expect(headers).toHaveProperty('x-user-id');
      expect(headers).toHaveProperty('x-journey-type');
      expect(headers).not.toHaveProperty('x-sensitive-data');
      expect(headers).not.toHaveProperty('x-internal-state');
    });
  });
});