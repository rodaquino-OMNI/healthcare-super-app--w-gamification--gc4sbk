/**
 * @file context.utils.spec.ts
 * @description Unit tests for logging context utilities that manage and enrich logs with contextual information
 */

import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  LoggingContext,
  RequestContext,
  UserContext,
  JourneyContext,
  JourneyType,
  createBaseContext,
  createRequestContext,
  createUserContext,
  createJourneyContext,
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  mergeContexts,
  extractContextFromRequest,
  createContextHeaders,
  extractContextFromHeaders,
} from '../../../src/utils/context.utils';
import { HEALTH_JOURNEY_CONTEXTS, CARE_JOURNEY_CONTEXTS, PLAN_JOURNEY_CONTEXTS } from '../../../test/fixtures/journey-data.fixture';
import { requestContexts, userContexts, journeyContexts } from '../../../test/fixtures/log-contexts.fixture';

// Mock uuid to return predictable values for testing
jest.mock('uuid');

describe('Context Utilities', () => {
  // Setup and teardown
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    // Mock uuid to return a predictable value
    (uuidv4 as jest.Mock).mockReturnValue('test-uuid-value');
    // Mock environment variables
    process.env.SERVICE_NAME = 'test-service';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SERVICE_NAME;
    delete process.env.NODE_ENV;
  });

  describe('createBaseContext', () => {
    it('should create a base context with default values', () => {
      const context = createBaseContext();
      
      expect(context).toEqual({
        requestId: 'test-uuid-value',
        correlationId: 'test-uuid-value',
        timestamp: expect.any(String),
        serviceName: 'test-service',
        environment: 'test',
        metadata: {},
      });
      
      // Verify timestamp is a valid ISO string
      expect(() => new Date(context.timestamp!)).not.toThrow();
    });

    it('should use provided service name and metadata', () => {
      const metadata = { customField: 'customValue' };
      const context = createBaseContext('custom-service', metadata);
      
      expect(context).toEqual({
        requestId: 'test-uuid-value',
        correlationId: 'test-uuid-value',
        timestamp: expect.any(String),
        serviceName: 'custom-service',
        environment: 'test',
        metadata,
      });
    });

    it('should use environment variables as fallbacks', () => {
      delete process.env.SERVICE_NAME;
      delete process.env.NODE_ENV;
      
      const context = createBaseContext();
      
      expect(context).toEqual({
        requestId: 'test-uuid-value',
        correlationId: 'test-uuid-value',
        timestamp: expect.any(String),
        serviceName: 'unknown',
        environment: 'development',
        metadata: {},
      });
    });
  });

  describe('createRequestContext', () => {
    it('should create a request context from an Express request', () => {
      const mockRequest = {
        method: 'GET',
        path: '/api/test',
        headers: {
          'user-agent': 'test-user-agent',
          'authorization': 'Bearer token',
          'cookie': 'session=123',
        },
        query: { param: 'value' },
        ip: '127.0.0.1',
      } as unknown as Request;

      const context = createRequestContext(mockRequest);
      
      expect(context).toEqual({
        requestId: 'test-uuid-value',
        correlationId: 'test-uuid-value',
        timestamp: expect.any(String),
        serviceName: 'test-service',
        environment: 'test',
        metadata: {},
        method: 'GET',
        path: '/api/test',
        ipAddress: '127.0.0.1',
        userAgent: 'test-user-agent',
        headers: {
          'user-agent': 'test-user-agent',
          // Sensitive headers should be removed
        },
        query: { param: 'value' },
      });
      
      // Verify sensitive headers are removed
      expect(context.headers).not.toHaveProperty('authorization');
      expect(context.headers).not.toHaveProperty('cookie');
    });

    it('should use request headers for requestId and correlationId if available', () => {
      const mockRequest = {
        method: 'GET',
        path: '/api/test',
        headers: {
          'x-request-id': 'existing-request-id',
          'x-correlation-id': 'existing-correlation-id',
        },
        ip: '127.0.0.1',
      } as unknown as Request;

      const context = createRequestContext(mockRequest);
      
      expect(context.requestId).toBe('existing-request-id');
      expect(context.correlationId).toBe('existing-correlation-id');
    });

    it('should use x-request-id as correlationId if x-correlation-id is not available', () => {
      const mockRequest = {
        method: 'GET',
        path: '/api/test',
        headers: {
          'x-request-id': 'existing-request-id',
        },
        ip: '127.0.0.1',
      } as unknown as Request;

      const context = createRequestContext(mockRequest);
      
      expect(context.requestId).toBe('existing-request-id');
      expect(context.correlationId).toBe('existing-request-id');
    });

    it('should extend a provided base context', () => {
      const baseContext: LoggingContext = {
        correlationId: 'base-correlation-id',
        serviceName: 'base-service',
        metadata: { baseField: 'baseValue' },
      };

      const mockRequest = {
        method: 'GET',
        path: '/api/test',
        headers: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const context = createRequestContext(mockRequest, baseContext);
      
      expect(context).toMatchObject({
        correlationId: 'base-correlation-id',
        serviceName: 'base-service',
        metadata: { baseField: 'baseValue' },
        method: 'GET',
        path: '/api/test',
        ipAddress: '127.0.0.1',
      });
    });

    it('should handle requests with missing properties gracefully', () => {
      const mockRequest = {
        headers: {},
      } as unknown as Request;

      const context = createRequestContext(mockRequest);
      
      expect(context).toMatchObject({
        requestId: 'test-uuid-value',
        correlationId: 'test-uuid-value',
        headers: {},
      });
      
      // These should be undefined but not cause errors
      expect(context.method).toBeUndefined();
      expect(context.path).toBeUndefined();
      expect(context.ipAddress).toBe('');
      expect(context.userAgent).toBeUndefined();
    });
  });

  describe('createUserContext', () => {
    it('should create a user context with provided values', () => {
      const userId = 'test-user-id';
      const isAuthenticated = true;
      const roles = ['user', 'admin'];
      const preferences = { theme: 'dark' };

      const context = createUserContext(userId, isAuthenticated, roles, preferences);
      
      expect(context).toEqual({
        requestId: 'test-uuid-value',
        correlationId: 'test-uuid-value',
        timestamp: expect.any(String),
        serviceName: 'test-service',
        environment: 'test',
        metadata: {},
        userId,
        isAuthenticated,
        roles,
        preferences,
      });
    });

    it('should handle undefined values gracefully', () => {
      const context = createUserContext('test-user-id');
      
      expect(context).toMatchObject({
        userId: 'test-user-id',
      });
      
      // These should be undefined but not cause errors
      expect(context.isAuthenticated).toBeUndefined();
      expect(context.roles).toBeUndefined();
      expect(context.preferences).toBeUndefined();
    });

    it('should extend a provided base context', () => {
      const baseContext: LoggingContext = {
        correlationId: 'base-correlation-id',
        serviceName: 'base-service',
        metadata: { baseField: 'baseValue' },
      };

      const context = createUserContext('test-user-id', true, undefined, undefined, baseContext);
      
      expect(context).toMatchObject({
        correlationId: 'base-correlation-id',
        serviceName: 'base-service',
        metadata: { baseField: 'baseValue' },
        userId: 'test-user-id',
        isAuthenticated: true,
      });
    });
  });

  describe('createJourneyContext', () => {
    it('should create a journey context with provided values', () => {
      const journeyType: JourneyType = 'Health';
      const journeyStep = 'metrics-dashboard';
      const journeyState = { metricType: 'heart-rate' };
      const crossJourneyData = { referringJourney: 'Care' };

      const context = createJourneyContext(journeyType, journeyStep, journeyState, crossJourneyData);
      
      expect(context).toEqual({
        requestId: 'test-uuid-value',
        correlationId: 'test-uuid-value',
        timestamp: expect.any(String),
        serviceName: 'test-service',
        environment: 'test',
        metadata: {},
        journeyType,
        journeyStep,
        journeyState,
        crossJourneyData,
      });
    });

    it('should handle undefined values gracefully', () => {
      const context = createJourneyContext('Health');
      
      expect(context).toMatchObject({
        journeyType: 'Health',
      });
      
      // These should be undefined but not cause errors
      expect(context.journeyStep).toBeUndefined();
      expect(context.journeyState).toBeUndefined();
      expect(context.crossJourneyData).toBeUndefined();
    });

    it('should extend a provided base context', () => {
      const baseContext: LoggingContext = {
        correlationId: 'base-correlation-id',
        serviceName: 'base-service',
        metadata: { baseField: 'baseValue' },
      };

      const context = createJourneyContext('Health', 'metrics-dashboard', undefined, undefined, baseContext);
      
      expect(context).toMatchObject({
        correlationId: 'base-correlation-id',
        serviceName: 'base-service',
        metadata: { baseField: 'baseValue' },
        journeyType: 'Health',
        journeyStep: 'metrics-dashboard',
      });
    });
  });

  describe('Journey-specific context creators', () => {
    it('should create a Health journey context', () => {
      const journeyStep = 'metrics-dashboard';
      const journeyState = { metricType: 'heart-rate' };

      const context = createHealthJourneyContext(journeyStep, journeyState);
      
      expect(context).toMatchObject({
        journeyType: 'Health',
        journeyStep,
        journeyState,
      });
    });

    it('should create a Care journey context', () => {
      const journeyStep = 'appointment-booking';
      const journeyState = { specialtyId: 'cardiology' };

      const context = createCareJourneyContext(journeyStep, journeyState);
      
      expect(context).toMatchObject({
        journeyType: 'Care',
        journeyStep,
        journeyState,
      });
    });

    it('should create a Plan journey context', () => {
      const journeyStep = 'claim-submission';
      const journeyState = { claimType: 'medical' };

      const context = createPlanJourneyContext(journeyStep, journeyState);
      
      expect(context).toMatchObject({
        journeyType: 'Plan',
        journeyStep,
        journeyState,
      });
    });

    it('should extend a provided base context in journey-specific creators', () => {
      const baseContext: LoggingContext = {
        correlationId: 'base-correlation-id',
        serviceName: 'base-service',
      };

      const context = createHealthJourneyContext('metrics-dashboard', undefined, baseContext);
      
      expect(context).toMatchObject({
        correlationId: 'base-correlation-id',
        serviceName: 'base-service',
        journeyType: 'Health',
        journeyStep: 'metrics-dashboard',
      });
    });
  });

  describe('mergeContexts', () => {
    it('should merge multiple contexts with later contexts taking precedence', () => {
      const context1: LoggingContext = {
        correlationId: 'correlation-1',
        serviceName: 'service-1',
        metadata: { field1: 'value1', shared: 'original' },
      };

      const context2: LoggingContext = {
        requestId: 'request-2',
        metadata: { field2: 'value2', shared: 'updated' },
      };

      const context3: LoggingContext = {
        timestamp: '2023-04-15T12:00:00Z',
      };

      const merged = mergeContexts<LoggingContext>(context1, context2, context3);
      
      expect(merged).toEqual({
        correlationId: 'correlation-1',
        serviceName: 'service-1',
        requestId: 'request-2',
        timestamp: '2023-04-15T12:00:00Z',
        metadata: { field1: 'value1', field2: 'value2', shared: 'updated' },
      });
    });

    it('should handle undefined contexts gracefully', () => {
      const context1: LoggingContext = {
        correlationId: 'correlation-1',
        serviceName: 'service-1',
      };

      const merged = mergeContexts<LoggingContext>(context1, undefined);
      
      expect(merged).toEqual({
        correlationId: 'correlation-1',
        serviceName: 'service-1',
      });
    });

    it('should return an empty object when no contexts are provided', () => {
      const merged = mergeContexts<LoggingContext>();
      
      expect(merged).toEqual({});
    });

    it('should merge different context types correctly', () => {
      const requestContext: RequestContext = {
        requestId: 'request-id',
        method: 'GET',
        path: '/api/test',
      };

      const userContext: UserContext = {
        userId: 'user-id',
        isAuthenticated: true,
      };

      const journeyContext: JourneyContext = {
        journeyType: 'Health',
        journeyStep: 'metrics-dashboard',
      };

      const merged = mergeContexts<LoggingContext>(requestContext, userContext, journeyContext);
      
      expect(merged).toEqual({
        requestId: 'request-id',
        method: 'GET',
        path: '/api/test',
        userId: 'user-id',
        isAuthenticated: true,
        journeyType: 'Health',
        journeyStep: 'metrics-dashboard',
      });
    });
  });

  describe('extractContextFromRequest', () => {
    it('should extract context from an Express request with user and journey', () => {
      const mockRequest = {
        method: 'GET',
        path: '/api/health/metrics',
        headers: {
          'x-request-id': 'request-id-123',
          'x-correlation-id': 'correlation-id-456',
        },
        ip: '127.0.0.1',
        user: {
          id: 'user-id-789',
          roles: ['user', 'premium'],
          preferences: { theme: 'dark' },
        },
        journey: {
          type: 'Health',
          step: 'metrics-dashboard',
          state: { metricType: 'heart-rate' },
          crossJourneyData: { referringJourney: 'Care' },
        },
      } as unknown as Request;

      const context = extractContextFromRequest(mockRequest);
      
      expect(context).toMatchObject({
        requestId: 'request-id-123',
        correlationId: 'correlation-id-456',
        method: 'GET',
        path: '/api/health/metrics',
        ipAddress: '127.0.0.1',
        userId: 'user-id-789',
        isAuthenticated: true,
        roles: ['user', 'premium'],
        preferences: { theme: 'dark' },
        journeyType: 'Health',
        journeyStep: 'metrics-dashboard',
        journeyState: { metricType: 'heart-rate' },
        crossJourneyData: { referringJourney: 'Care' },
      });
    });

    it('should extract context from a request without user or journey', () => {
      const mockRequest = {
        method: 'GET',
        path: '/api/health/metrics',
        headers: {
          'x-request-id': 'request-id-123',
        },
        ip: '127.0.0.1',
      } as unknown as Request;

      const context = extractContextFromRequest(mockRequest);
      
      expect(context).toMatchObject({
        requestId: 'request-id-123',
        method: 'GET',
        path: '/api/health/metrics',
        ipAddress: '127.0.0.1',
      });
      
      // These should not be present
      expect(context).not.toHaveProperty('userId');
      expect(context).not.toHaveProperty('journeyType');
    });

    it('should handle a request with user but no userId', () => {
      const mockRequest = {
        method: 'GET',
        path: '/api/health/metrics',
        headers: {},
        ip: '127.0.0.1',
        user: {
          // No id or userId property
          roles: ['user'],
        },
      } as unknown as Request;

      const context = extractContextFromRequest(mockRequest);
      
      // Should still create a user context, but with undefined userId
      expect(context).toMatchObject({
        method: 'GET',
        path: '/api/health/metrics',
        ipAddress: '127.0.0.1',
        isAuthenticated: true,
        roles: ['user'],
      });
      
      expect(context.userId).toBeUndefined();
    });
  });

  describe('createContextHeaders', () => {
    it('should create headers for context propagation', () => {
      const context: LoggingContext = {
        requestId: 'request-id-123',
        correlationId: 'correlation-id-456',
        userId: 'user-id-789',
        journeyType: 'Health',
      };

      const headers = createContextHeaders(context);
      
      expect(headers).toEqual({
        'x-request-id': 'request-id-123',
        'x-correlation-id': 'correlation-id-456',
        'x-user-id': 'user-id-789',
        'x-journey-type': 'Health',
      });
    });

    it('should only include available properties in headers', () => {
      const context: LoggingContext = {
        requestId: 'request-id-123',
        // No correlationId, userId, or journeyType
      };

      const headers = createContextHeaders(context);
      
      expect(headers).toEqual({
        'x-request-id': 'request-id-123',
      });
      
      // These should not be present
      expect(headers).not.toHaveProperty('x-correlation-id');
      expect(headers).not.toHaveProperty('x-user-id');
      expect(headers).not.toHaveProperty('x-journey-type');
    });

    it('should handle a complete context with all properties', () => {
      // Create a context with request, user, and journey information
      const context = mergeContexts<LoggingContext>(
        {
          requestId: 'request-id-123',
          correlationId: 'correlation-id-456',
        },
        {
          userId: 'user-id-789',
          isAuthenticated: true,
        } as UserContext,
        {
          journeyType: 'Health',
          journeyStep: 'metrics-dashboard',
        } as JourneyContext
      );

      const headers = createContextHeaders(context);
      
      expect(headers).toEqual({
        'x-request-id': 'request-id-123',
        'x-correlation-id': 'correlation-id-456',
        'x-user-id': 'user-id-789',
        'x-journey-type': 'Health',
      });
    });
  });

  describe('extractContextFromHeaders', () => {
    it('should extract context from headers', () => {
      const headers = {
        'x-request-id': 'request-id-123',
        'x-correlation-id': 'correlation-id-456',
        'x-user-id': 'user-id-789',
        'x-journey-type': 'Health',
      };

      const context = extractContextFromHeaders(headers);
      
      expect(context).toMatchObject({
        requestId: 'request-id-123',
        correlationId: 'correlation-id-456',
        userId: 'user-id-789',
        journeyType: 'Health',
        isAuthenticated: true, // Should be set when userId is present
      });
    });

    it('should only extract valid journey types', () => {
      const validHeaders = {
        'x-journey-type': 'Health',
      };

      const invalidHeaders = {
        'x-journey-type': 'InvalidJourneyType',
      };

      const validContext = extractContextFromHeaders(validHeaders);
      const invalidContext = extractContextFromHeaders(invalidHeaders);
      
      expect(validContext.journeyType).toBe('Health');
      expect(invalidContext.journeyType).toBeUndefined();
    });

    it('should handle headers with array values', () => {
      const headers = {
        'x-request-id': ['request-id-123'],
        'x-correlation-id': ['correlation-id-456'],
      };

      const context = extractContextFromHeaders(headers);
      
      expect(context).toMatchObject({
        requestId: 'request-id-123',
        correlationId: 'correlation-id-456',
      });
    });

    it('should handle empty or missing headers', () => {
      const emptyHeaders = {};
      const context = extractContextFromHeaders(emptyHeaders);
      
      // Should still create a base context
      expect(context).toMatchObject({
        requestId: 'test-uuid-value',
        correlationId: 'test-uuid-value',
        timestamp: expect.any(String),
        serviceName: 'test-service',
        environment: 'test',
        metadata: {},
      });
    });
  });

  describe('Integration with fixtures', () => {
    it('should work with journey data fixtures', () => {
      // Test with Health journey context from fixtures
      const healthContext = createJourneyContext(
        'Health',
        'metrics-dashboard',
        HEALTH_JOURNEY_CONTEXTS.METRIC_RECORDING.metricType ? 
          { metricType: HEALTH_JOURNEY_CONTEXTS.METRIC_RECORDING.metricType } : 
          undefined
      );
      
      expect(healthContext).toMatchObject({
        journeyType: 'Health',
        journeyStep: 'metrics-dashboard',
      });
      
      if (HEALTH_JOURNEY_CONTEXTS.METRIC_RECORDING.metricType) {
        expect(healthContext.journeyState).toMatchObject({
          metricType: HEALTH_JOURNEY_CONTEXTS.METRIC_RECORDING.metricType,
        });
      }

      // Test with Care journey context from fixtures
      const careContext = createJourneyContext(
        'Care',
        'appointment-booking',
        CARE_JOURNEY_CONTEXTS.APPOINTMENT_BOOKING.appointmentType ? 
          { appointmentType: CARE_JOURNEY_CONTEXTS.APPOINTMENT_BOOKING.appointmentType } : 
          undefined
      );
      
      expect(careContext).toMatchObject({
        journeyType: 'Care',
        journeyStep: 'appointment-booking',
      });

      // Test with Plan journey context from fixtures
      const planContext = createJourneyContext(
        'Plan',
        'claim-submission',
        PLAN_JOURNEY_CONTEXTS.CLAIM_SUBMISSION.claimType ? 
          { claimType: PLAN_JOURNEY_CONTEXTS.CLAIM_SUBMISSION.claimType } : 
          undefined
      );
      
      expect(planContext).toMatchObject({
        journeyType: 'Plan',
        journeyStep: 'claim-submission',
      });
    });

    it('should work with log context fixtures', () => {
      // Test with request context from fixtures
      const requestContext = requestContexts.detailedPostRequest;
      const headers = createContextHeaders(requestContext);
      
      expect(headers).toHaveProperty('x-request-id');
      expect(headers).toHaveProperty('x-correlation-id');

      // Test with user context from fixtures
      const userContext = userContexts.detailedUserContext;
      const userHeaders = createContextHeaders(userContext);
      
      expect(userHeaders).toHaveProperty('x-user-id');

      // Test with journey context from fixtures
      const journeyContext = journeyContexts.healthJourney;
      const journeyHeaders = createContextHeaders(journeyContext);
      
      expect(journeyHeaders).toHaveProperty('x-journey-type');

      // Test merging contexts from fixtures
      const mergedContext = mergeContexts<LoggingContext>(
        requestContexts.basicGetRequest,
        userContexts.basicAuthenticatedUser,
        journeyContexts.healthJourney
      );
      
      expect(mergedContext).toHaveProperty('requestId');
      expect(mergedContext).toHaveProperty('userId');
      expect(mergedContext).toHaveProperty('journeyType');
    });
  });
});