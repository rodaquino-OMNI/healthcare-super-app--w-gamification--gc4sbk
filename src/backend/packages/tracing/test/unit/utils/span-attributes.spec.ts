import { SpanStatusCode } from '@opentelemetry/api';
import { MockSpan } from '../../mocks/mock-tracer';
import {
  AttributeNamespace,
  JourneyType,
  ErrorType,
  addUserAttributes,
  addRequestAttributes,
  addServiceAttributes,
  addHealthJourneyAttributes,
  addCareJourneyAttributes,
  addPlanJourneyAttributes,
  addErrorAttributes,
  classifyHttpError,
  addDatabasePerformanceAttributes,
  addExternalServicePerformanceAttributes,
  addProcessingPerformanceAttributes,
  measureExecutionTime
} from '../../../src/utils/span-attributes';

describe('Span Attribute Utilities', () => {
  let span: MockSpan;

  beforeEach(() => {
    // Create a fresh span for each test
    span = new MockSpan('test-span');
  });

  // ===== COMMON ATTRIBUTE HELPERS =====

  describe('Common Attribute Helpers', () => {
    describe('addUserAttributes', () => {
      it('should add user ID attribute', () => {
        const userId = 'user-123';
        addUserAttributes(span, userId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.id`]).toBe(userId);
      });

      it('should add session ID attribute when provided', () => {
        const userId = 'user-123';
        const sessionId = 'session-456';
        addUserAttributes(span, userId, sessionId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.id`]).toBe(userId);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.session_id`]).toBe(sessionId);
      });

      it('should add additional attributes when provided', () => {
        const userId = 'user-123';
        const additionalAttributes = {
          role: 'admin',
          premium: true,
          loginCount: 42
        };
        addUserAttributes(span, userId, undefined, additionalAttributes);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.id`]).toBe(userId);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.role`]).toBe('admin');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.premium`]).toBe(true);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.loginCount`]).toBe(42);
      });

      it('should return the span for chaining', () => {
        const result = addUserAttributes(span, 'user-123');
        expect(result).toBe(span);
      });
    });

    describe('addRequestAttributes', () => {
      it('should add request ID attribute', () => {
        const requestId = 'req-123';
        addRequestAttributes(span, requestId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.id`]).toBe(requestId);
      });

      it('should add correlation ID attribute when provided', () => {
        const requestId = 'req-123';
        const correlationId = 'corr-456';
        addRequestAttributes(span, requestId, correlationId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.id`]).toBe(requestId);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.correlation_id`]).toBe(correlationId);
      });

      it('should add additional attributes when provided', () => {
        const requestId = 'req-123';
        const additionalAttributes = {
          method: 'POST',
          path: '/api/health',
          duration: 150
        };
        addRequestAttributes(span, requestId, undefined, additionalAttributes);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.id`]).toBe(requestId);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.method`]).toBe('POST');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.path`]).toBe('/api/health');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.duration`]).toBe(150);
      });

      it('should return the span for chaining', () => {
        const result = addRequestAttributes(span, 'req-123');
        expect(result).toBe(span);
      });
    });

    describe('addServiceAttributes', () => {
      it('should add service name attribute', () => {
        const serviceName = 'health-service';
        addServiceAttributes(span, serviceName);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.name`]).toBe(serviceName);
      });

      it('should add service version attribute when provided', () => {
        const serviceName = 'health-service';
        const serviceVersion = '1.2.3';
        addServiceAttributes(span, serviceName, serviceVersion);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.name`]).toBe(serviceName);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.version`]).toBe(serviceVersion);
      });

      it('should add additional attributes when provided', () => {
        const serviceName = 'health-service';
        const additionalAttributes = {
          region: 'us-east-1',
          instance: 'i-12345',
          environment: 'production'
        };
        addServiceAttributes(span, serviceName, undefined, additionalAttributes);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.name`]).toBe(serviceName);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.region`]).toBe('us-east-1');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.instance`]).toBe('i-12345');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.environment`]).toBe('production');
      });

      it('should return the span for chaining', () => {
        const result = addServiceAttributes(span, 'health-service');
        expect(result).toBe(span);
      });
    });
  });

  // ===== JOURNEY-SPECIFIC ATTRIBUTE HELPERS =====

  describe('Journey-Specific Attribute Helpers', () => {
    describe('addHealthJourneyAttributes', () => {
      it('should add journey type attribute', () => {
        addHealthJourneyAttributes(span);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.HEALTH);
      });

      it('should add metric type attribute when provided', () => {
        const metricType = 'heart_rate';
        addHealthJourneyAttributes(span, metricType);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.HEALTH);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.metric_type`]).toBe(metricType);
      });

      it('should add device ID attribute when provided', () => {
        const deviceId = 'device-123';
        addHealthJourneyAttributes(span, undefined, deviceId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.HEALTH);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.device_id`]).toBe(deviceId);
      });

      it('should add goal ID attribute when provided', () => {
        const goalId = 'goal-123';
        addHealthJourneyAttributes(span, undefined, undefined, goalId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.HEALTH);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.goal_id`]).toBe(goalId);
      });

      it('should add additional attributes when provided', () => {
        const additionalAttributes = {
          value: 72,
          unit: 'bpm',
          timestamp: '2023-01-01T12:00:00Z'
        };
        addHealthJourneyAttributes(span, undefined, undefined, undefined, additionalAttributes);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.HEALTH);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.value`]).toBe(72);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.unit`]).toBe('bpm');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.timestamp`]).toBe('2023-01-01T12:00:00Z');
      });

      it('should return the span for chaining', () => {
        const result = addHealthJourneyAttributes(span);
        expect(result).toBe(span);
      });
    });

    describe('addCareJourneyAttributes', () => {
      it('should add journey type attribute', () => {
        addCareJourneyAttributes(span);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.CARE);
      });

      it('should add appointment ID attribute when provided', () => {
        const appointmentId = 'appointment-123';
        addCareJourneyAttributes(span, appointmentId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.CARE);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.appointment_id`]).toBe(appointmentId);
      });

      it('should add provider ID attribute when provided', () => {
        const providerId = 'provider-123';
        addCareJourneyAttributes(span, undefined, providerId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.CARE);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.provider_id`]).toBe(providerId);
      });

      it('should add session ID attribute when provided', () => {
        const sessionId = 'session-123';
        addCareJourneyAttributes(span, undefined, undefined, sessionId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.CARE);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.session_id`]).toBe(sessionId);
      });

      it('should add treatment plan ID attribute when provided', () => {
        const treatmentPlanId = 'treatment-123';
        addCareJourneyAttributes(span, undefined, undefined, undefined, treatmentPlanId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.CARE);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.treatment_plan_id`]).toBe(treatmentPlanId);
      });

      it('should add additional attributes when provided', () => {
        const additionalAttributes = {
          speciality: 'cardiology',
          duration: 30,
          virtual: true
        };
        addCareJourneyAttributes(span, undefined, undefined, undefined, undefined, additionalAttributes);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.CARE);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.speciality`]).toBe('cardiology');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.duration`]).toBe(30);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.virtual`]).toBe(true);
      });

      it('should return the span for chaining', () => {
        const result = addCareJourneyAttributes(span);
        expect(result).toBe(span);
      });
    });

    describe('addPlanJourneyAttributes', () => {
      it('should add journey type attribute', () => {
        addPlanJourneyAttributes(span);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.PLAN);
      });

      it('should add plan ID attribute when provided', () => {
        const planId = 'plan-123';
        addPlanJourneyAttributes(span, planId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.PLAN);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.plan_id`]).toBe(planId);
      });

      it('should add claim ID attribute when provided', () => {
        const claimId = 'claim-123';
        addPlanJourneyAttributes(span, undefined, claimId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.PLAN);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.claim_id`]).toBe(claimId);
      });

      it('should add benefit ID attribute when provided', () => {
        const benefitId = 'benefit-123';
        addPlanJourneyAttributes(span, undefined, undefined, benefitId);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.PLAN);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.benefit_id`]).toBe(benefitId);
      });

      it('should add additional attributes when provided', () => {
        const additionalAttributes = {
          coverage: 'full',
          amount: 1500.50,
          status: 'approved'
        };
        addPlanJourneyAttributes(span, undefined, undefined, undefined, additionalAttributes);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`]).toBe(JourneyType.PLAN);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.coverage`]).toBe('full');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.amount`]).toBe(1500.50);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.status`]).toBe('approved');
      });

      it('should return the span for chaining', () => {
        const result = addPlanJourneyAttributes(span);
        expect(result).toBe(span);
      });
    });
  });

  // ===== ERROR ATTRIBUTE UTILITIES =====

  describe('Error Attribute Utilities', () => {
    describe('addErrorAttributes', () => {
      it('should set span status to ERROR', () => {
        const error = new Error('Test error');
        addErrorAttributes(span, error, ErrorType.SYSTEM);
        
        expect(span.getStatus().code).toBe(SpanStatusCode.ERROR);
      });

      it('should record the exception', () => {
        const error = new Error('Test error');
        addErrorAttributes(span, error, ErrorType.SYSTEM);
        
        const events = span.getEvents();
        expect(events.length).toBe(1);
        expect(events[0].name).toBe('exception');
        expect(events[0].attributes?.['exception.type']).toBe('Error');
        expect(events[0].attributes?.['exception.message']).toBe('Test error');
      });

      it('should add error type attribute', () => {
        const error = new Error('Test error');
        addErrorAttributes(span, error, ErrorType.CLIENT);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.type`]).toBe(ErrorType.CLIENT);
      });

      it('should add error message attribute', () => {
        const error = new Error('Test error');
        addErrorAttributes(span, error, ErrorType.EXTERNAL);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.message`]).toBe('Test error');
      });

      it('should add error name attribute', () => {
        const error = new Error('Test error');
        addErrorAttributes(span, error, ErrorType.TRANSIENT);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.name`]).toBe('Error');
      });

      it('should add error stack attribute when available', () => {
        const error = new Error('Test error');
        addErrorAttributes(span, error, ErrorType.SYSTEM);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.stack`]).toBeDefined();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.stack`]).toContain('Error: Test error');
      });

      it('should add additional attributes when provided', () => {
        const error = new Error('Test error');
        const additionalAttributes = {
          code: 'ERR_INVALID_INPUT',
          retryable: false,
          component: 'validation'
        };
        addErrorAttributes(span, error, ErrorType.CLIENT, additionalAttributes);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.code`]).toBe('ERR_INVALID_INPUT');
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.retryable`]).toBe(false);
        expect(attributes[`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.component`]).toBe('validation');
      });

      it('should return the span for chaining', () => {
        const error = new Error('Test error');
        const result = addErrorAttributes(span, error, ErrorType.SYSTEM);
        expect(result).toBe(span);
      });
    });

    describe('classifyHttpError', () => {
      it('should classify 4xx errors as CLIENT', () => {
        expect(classifyHttpError(400)).toBe(ErrorType.CLIENT);
        expect(classifyHttpError(401)).toBe(ErrorType.CLIENT);
        expect(classifyHttpError(403)).toBe(ErrorType.CLIENT);
        expect(classifyHttpError(404)).toBe(ErrorType.CLIENT);
        expect(classifyHttpError(422)).toBe(ErrorType.CLIENT);
        expect(classifyHttpError(429)).toBe(ErrorType.CLIENT);
      });

      it('should classify 5xx errors as SYSTEM', () => {
        expect(classifyHttpError(500)).toBe(ErrorType.SYSTEM);
        expect(classifyHttpError(501)).toBe(ErrorType.SYSTEM);
        expect(classifyHttpError(502)).toBe(ErrorType.SYSTEM);
        expect(classifyHttpError(503)).toBe(ErrorType.SYSTEM);
        expect(classifyHttpError(504)).toBe(ErrorType.SYSTEM);
      });

      it('should classify unexpected status codes as SYSTEM', () => {
        expect(classifyHttpError(600)).toBe(ErrorType.SYSTEM);
        expect(classifyHttpError(0)).toBe(ErrorType.SYSTEM);
        expect(classifyHttpError(-1)).toBe(ErrorType.SYSTEM);
      });
    });
  });

  // ===== PERFORMANCE METRIC ATTRIBUTE HELPERS =====

  describe('Performance Metric Attribute Helpers', () => {
    describe('addDatabasePerformanceAttributes', () => {
      it('should add database operation attributes', () => {
        const operation = 'query';
        const table = 'users';
        const durationMs = 150;
        addDatabasePerformanceAttributes(span, operation, table, durationMs);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.database`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.operation`]).toBe(operation);
        expect(attributes[`${perfNamespace}.table`]).toBe(table);
        expect(attributes[`${perfNamespace}.duration_ms`]).toBe(durationMs);
      });

      it('should add record count attribute when provided', () => {
        const operation = 'query';
        const table = 'users';
        const durationMs = 150;
        const recordCount = 42;
        addDatabasePerformanceAttributes(span, operation, table, durationMs, recordCount);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.database`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.record_count`]).toBe(recordCount);
      });

      it('should add additional attributes when provided', () => {
        const operation = 'query';
        const table = 'users';
        const durationMs = 150;
        const additionalAttributes = {
          query: 'SELECT * FROM users WHERE id = ?',
          params: 'user-123',
          index: 'idx_users_id'
        };
        addDatabasePerformanceAttributes(span, operation, table, durationMs, undefined, additionalAttributes);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.database`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.query`]).toBe('SELECT * FROM users WHERE id = ?');
        expect(attributes[`${perfNamespace}.params`]).toBe('user-123');
        expect(attributes[`${perfNamespace}.index`]).toBe('idx_users_id');
      });

      it('should return the span for chaining', () => {
        const result = addDatabasePerformanceAttributes(span, 'query', 'users', 150);
        expect(result).toBe(span);
      });
    });

    describe('addExternalServicePerformanceAttributes', () => {
      it('should add external service performance attributes', () => {
        const serviceName = 'payment-api';
        const operation = 'processPayment';
        const durationMs = 250;
        addExternalServicePerformanceAttributes(span, serviceName, operation, durationMs);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.external`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.service`]).toBe(serviceName);
        expect(attributes[`${perfNamespace}.operation`]).toBe(operation);
        expect(attributes[`${perfNamespace}.duration_ms`]).toBe(durationMs);
      });

      it('should add status code attribute when provided', () => {
        const serviceName = 'payment-api';
        const operation = 'processPayment';
        const durationMs = 250;
        const statusCode = 200;
        addExternalServicePerformanceAttributes(span, serviceName, operation, durationMs, statusCode);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.external`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.status_code`]).toBe(statusCode);
      });

      it('should add additional attributes when provided', () => {
        const serviceName = 'payment-api';
        const operation = 'processPayment';
        const durationMs = 250;
        const additionalAttributes = {
          endpoint: 'https://api.payment.com/v1/process',
          method: 'POST',
          paymentId: 'payment-123'
        };
        addExternalServicePerformanceAttributes(span, serviceName, operation, durationMs, undefined, additionalAttributes);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.external`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.endpoint`]).toBe('https://api.payment.com/v1/process');
        expect(attributes[`${perfNamespace}.method`]).toBe('POST');
        expect(attributes[`${perfNamespace}.paymentId`]).toBe('payment-123');
      });

      it('should return the span for chaining', () => {
        const result = addExternalServicePerformanceAttributes(span, 'payment-api', 'processPayment', 250);
        expect(result).toBe(span);
      });
    });

    describe('addProcessingPerformanceAttributes', () => {
      it('should add processing performance attributes', () => {
        const operationType = 'data-transformation';
        const durationMs = 75;
        addProcessingPerformanceAttributes(span, operationType, durationMs);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.processing`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.operation_type`]).toBe(operationType);
        expect(attributes[`${perfNamespace}.duration_ms`]).toBe(durationMs);
      });

      it('should add item count attribute when provided', () => {
        const operationType = 'data-transformation';
        const durationMs = 75;
        const itemCount = 100;
        addProcessingPerformanceAttributes(span, operationType, durationMs, itemCount);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.processing`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.item_count`]).toBe(itemCount);
      });

      it('should add additional attributes when provided', () => {
        const operationType = 'data-transformation';
        const durationMs = 75;
        const additionalAttributes = {
          source: 'csv',
          destination: 'database',
          batchSize: 50
        };
        addProcessingPerformanceAttributes(span, operationType, durationMs, undefined, additionalAttributes);
        
        const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.processing`;
        const attributes = span.getAttributes();
        expect(attributes[`${perfNamespace}.source`]).toBe('csv');
        expect(attributes[`${perfNamespace}.destination`]).toBe('database');
        expect(attributes[`${perfNamespace}.batchSize`]).toBe(50);
      });

      it('should return the span for chaining', () => {
        const result = addProcessingPerformanceAttributes(span, 'data-transformation', 75);
        expect(result).toBe(span);
      });
    });

    describe('measureExecutionTime', () => {
      it('should measure execution time and add it as an attribute', async () => {
        const fn = jest.fn().mockImplementation(async () => {
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'result';
        });

        const result = await measureExecutionTime(span, 'test', 'operation', fn);
        
        expect(result).toBe('result');
        expect(fn).toHaveBeenCalledTimes(1);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.test.operation_duration_ms`]).toBeDefined();
        expect(typeof attributes[`${AttributeNamespace.AUSTA}.test.operation_duration_ms`]).toBe('number');
        expect(attributes[`${AttributeNamespace.AUSTA}.test.operation_duration_ms`]).toBeGreaterThan(0);
      });

      it('should add attribute even if function throws an error', async () => {
        const error = new Error('Test error');
        const fn = jest.fn().mockImplementation(async () => {
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 10));
          throw error;
        });

        await expect(measureExecutionTime(span, 'test', 'operation', fn)).rejects.toThrow(error);
        
        expect(fn).toHaveBeenCalledTimes(1);
        
        const attributes = span.getAttributes();
        expect(attributes[`${AttributeNamespace.AUSTA}.test.operation_duration_ms`]).toBeDefined();
        expect(typeof attributes[`${AttributeNamespace.AUSTA}.test.operation_duration_ms`]).toBe('number');
        expect(attributes[`${AttributeNamespace.AUSTA}.test.operation_duration_ms`]).toBeGreaterThan(0);
      });
    });
  });
});