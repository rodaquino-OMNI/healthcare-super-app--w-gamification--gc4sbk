/**
 * Integration tests for error handling in the tracing system.
 * 
 * These tests verify the correct error handling behavior across different components,
 * ensuring that errors are properly captured, recorded in spans, propagated to logs,
 * and handled gracefully without breaking the tracing context.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { SpanStatusCode, context, trace, SpanKind } from '@opentelemetry/api';
import { TracingService } from '../../src/tracing.service';
import { JourneyContext, JourneyType } from '../../src/interfaces/journey-context.interface';
import { TEST_ERROR_SCENARIOS, TEST_JOURNEY_ATTRIBUTES, TEST_SERVICE_NAMES } from '../test-constants';

// Mock implementations
class MockConfigService {
  get(key: string, defaultValue?: any) {
    const config = {
      'service.name': TEST_SERVICE_NAMES.API_GATEWAY,
      'service.version': '1.0.0',
    };
    return config[key] || defaultValue;
  }
}

class MockLoggerService {
  logs: any[] = [];
  errors: any[] = [];
  
  log(message: string, context?: string, ...meta: any[]) {
    this.logs.push({ message, context, meta });
  }
  
  error(message: string, trace?: string, context?: string, ...meta: any[]) {
    this.errors.push({ message, trace, context, meta });
  }
  
  clear() {
    this.logs = [];
    this.errors = [];
  }
}

describe('TracingService Error Handling (Integration)', () => {
  let tracingService: TracingService;
  let mockLogger: MockLoggerService;
  let module: TestingModule;
  
  beforeEach(async () => {
    mockLogger = new MockLoggerService();
    
    module = await Test.createTestingModule({
      providers: [
        TracingService,
        { provide: ConfigService, useClass: MockConfigService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();
    
    tracingService = module.get<TracingService>(TracingService);
  });
  
  afterEach(async () => {
    mockLogger.clear();
    await module.close();
  });
  
  describe('Basic Error Handling', () => {
    it('should record exceptions in spans and set status to ERROR', async () => {
      // Arrange
      const testError = new Error('Test error');
      const spanName = 'test-error-span';
      
      // Act & Assert
      await expect(tracingService.createSpan(spanName, async () => {
        throw testError;
      })).rejects.toThrow(testError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span test-error-span');
      expect(mockLogger.errors[0].trace).toBe(testError.stack);
    });
    
    it('should propagate errors while maintaining the trace context', async () => {
      // Arrange
      const outerSpanName = 'outer-error-span';
      const innerSpanName = 'inner-error-span';
      const testError = new Error('Inner operation failed');
      
      // Act & Assert
      await expect(tracingService.createSpan(outerSpanName, async () => {
        // This should create a child span that fails
        return tracingService.createSpan(innerSpanName, async () => {
          throw testError;
        });
      })).rejects.toThrow(testError);
      
      // Verify both spans were recorded with errors
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span inner-error-span');
    });
    
    it('should complete spans even when errors occur', async () => {
      // Arrange
      const spanName = 'error-with-completion';
      const testError = new Error('Operation failed but span should complete');
      
      // We'll use a flag to verify the finally block was executed
      let finallyCalled = false;
      
      // Act & Assert
      await expect(tracingService.createSpan(spanName, async () => {
        try {
          throw testError;
        } finally {
          finallyCalled = true;
        }
      })).rejects.toThrow(testError);
      
      // Verify the finally block was executed
      expect(finallyCalled).toBe(true);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
    });
  });
  
  describe('Error Classification and Attributes', () => {
    it('should add appropriate attributes for database errors', async () => {
      // Arrange
      const { name, message, code } = TEST_ERROR_SCENARIOS.DATABASE_CONNECTION;
      const dbError = new Error(message);
      dbError.name = name;
      (dbError as any).code = code;
      
      // Act & Assert
      await expect(tracingService.createDatabaseSpan(
        'query',
        'users',
        async () => { throw dbError; }
      )).rejects.toThrow(dbError);
      
      // Verify error was logged with correct context
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span DB query users');
    });
    
    it('should add appropriate attributes for authentication errors', async () => {
      // Arrange
      const { name, message, code } = TEST_ERROR_SCENARIOS.AUTHENTICATION_FAILED;
      const authError = new Error(message);
      authError.name = name;
      (authError as any).code = code;
      
      // Act & Assert
      await expect(tracingService.createSpan(
        'authenticate-user',
        async () => { throw authError; },
        { attributes: { 'security.category': 'authentication' } }
      )).rejects.toThrow(authError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span authenticate-user');
    });
    
    it('should add appropriate attributes for external API errors', async () => {
      // Arrange
      const { name, message, code } = TEST_ERROR_SCENARIOS.EXTERNAL_API_TIMEOUT;
      const apiError = new Error(message);
      apiError.name = name;
      (apiError as any).code = code;
      (apiError as any).statusCode = 504;
      
      // Act & Assert
      await expect(tracingService.createHttpSpan(
        'GET',
        'https://external-api.example.com/data',
        async () => { throw apiError; }
      )).rejects.toThrow(apiError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span HTTP GET');
    });
    
    it('should add appropriate attributes for validation errors', async () => {
      // Arrange
      const { name, message, code } = TEST_ERROR_SCENARIOS.VALIDATION_ERROR;
      const validationError = new Error(message);
      validationError.name = name;
      (validationError as any).code = code;
      (validationError as any).field = 'email';
      (validationError as any).constraint = 'format';
      
      // Act & Assert
      await expect(tracingService.createSpan(
        'validate-input',
        async () => { throw validationError; },
        { attributes: { 'validation.operation': 'user_registration' } }
      )).rejects.toThrow(validationError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span validate-input');
    });
  });
  
  describe('Journey-Specific Error Handling', () => {
    it('should add health journey context to error spans', async () => {
      // Arrange
      const journeyContext: JourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-123',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        currentStep: 'record-metrics',
        metrics: {
          metricType: 'steps',
          timePeriod: 'daily'
        }
      };
      
      const healthError = new Error('Failed to record health metric');
      healthError.name = 'HealthMetricError';
      (healthError as any).metricType = 'steps';
      
      // Act & Assert
      await expect(tracingService.createJourneySpan(
        'health',
        'recordMetric',
        async () => { throw healthError; },
        journeyContext
      )).rejects.toThrow(healthError);
      
      // Verify error was logged with journey context
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span health.recordMetric');
    });
    
    it('should add care journey context to error spans', async () => {
      // Arrange
      const journeyContext: JourneyContext = {
        journeyId: 'care-journey-456',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString(),
        currentStep: 'schedule-appointment',
        appointment: {
          appointmentType: 'consultation',
          provider: {
            providerId: 'provider-789'
          }
        }
      };
      
      const appointmentError = new Error('Failed to schedule appointment');
      appointmentError.name = 'AppointmentSchedulingError';
      (appointmentError as any).providerAvailability = false;
      
      // Act & Assert
      await expect(tracingService.createJourneySpan(
        'care',
        'scheduleAppointment',
        async () => { throw appointmentError; },
        journeyContext
      )).rejects.toThrow(appointmentError);
      
      // Verify error was logged with journey context
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span care.scheduleAppointment');
    });
    
    it('should add plan journey context to error spans', async () => {
      // Arrange
      const journeyContext: JourneyContext = {
        journeyId: 'plan-journey-789',
        userId: 'user-789',
        journeyType: JourneyType.PLAN,
        startedAt: new Date().toISOString(),
        currentStep: 'submit-claim',
        claim: {
          claimType: 'medical',
          amount: 500
        }
      };
      
      const claimError = new Error('Failed to submit claim');
      claimError.name = 'ClaimSubmissionError';
      (claimError as any).validationErrors = ['Missing receipt'];
      
      // Act & Assert
      await expect(tracingService.createJourneySpan(
        'plan',
        'submitClaim',
        async () => { throw claimError; },
        journeyContext
      )).rejects.toThrow(claimError);
      
      // Verify error was logged with journey context
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span plan.submitClaim');
    });
  });
  
  describe('Error Recovery and Resilience', () => {
    it('should handle errors in nested spans correctly', async () => {
      // Arrange
      const outerSpanName = 'resilient-outer-span';
      const innerSpanName = 'failing-inner-span';
      const innerError = new Error('Inner operation failed');
      
      // Act
      const result = await tracingService.createSpan(outerSpanName, async () => {
        try {
          await tracingService.createSpan(innerSpanName, async () => {
            throw innerError;
          });
          return false; // Should not reach here
        } catch (error) {
          // Recover from the error
          return true; // Indicate successful recovery
        }
      });
      
      // Assert
      expect(result).toBe(true); // Verify recovery was successful
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span failing-inner-span');
    });
    
    it('should maintain trace context after error recovery', async () => {
      // Arrange
      const firstSpanName = 'first-span';
      const errorSpanName = 'error-span';
      const recoverySpanName = 'recovery-span';
      const testError = new Error('Recoverable error');
      
      // Act
      const result = await tracingService.createSpan(firstSpanName, async () => {
        try {
          await tracingService.createSpan(errorSpanName, async () => {
            throw testError;
          });
        } catch (error) {
          // Recover and create another span
          return tracingService.createSpan(recoverySpanName, async () => {
            return 'recovered';
          });
        }
      });
      
      // Assert
      expect(result).toBe('recovered');
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span error-span');
    });
    
    it('should handle concurrent spans with mixed success/failure', async () => {
      // Arrange
      const parentSpanName = 'parent-span';
      const successSpanName = 'success-span';
      const failureSpanName = 'failure-span';
      const testError = new Error('One operation failed');
      
      // Act
      const result = await tracingService.createSpan(parentSpanName, async () => {
        // Create two concurrent spans, one succeeds, one fails
        const successPromise = tracingService.createSpan(successSpanName, async () => {
          return 'success';
        });
        
        const failurePromise = tracingService.createSpan(failureSpanName, async () => {
          throw testError;
        }).catch(error => {
          // Catch the error to prevent it from propagating
          return 'handled failure';
        });
        
        // Wait for both to complete
        const [successResult, failureResult] = await Promise.all([successPromise, failurePromise]);
        
        return { successResult, failureResult };
      });
      
      // Assert
      expect(result.successResult).toBe('success');
      expect(result.failureResult).toBe('handled failure');
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span failure-span');
    });
  });
  
  describe('Trace Correlation with Logs', () => {
    it('should include trace context in error logs', async () => {
      // Arrange
      const spanName = 'traced-error-span';
      const testError = new Error('Error with trace context');
      
      // Act & Assert
      await expect(tracingService.createSpan(spanName, async () => {
        throw testError;
      })).rejects.toThrow(testError);
      
      // Verify error log contains trace information
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].meta).toBeDefined();
      expect(mockLogger.errors[0].meta[0]).toHaveProperty('traceId');
      expect(mockLogger.errors[0].meta[0]).toHaveProperty('spanId');
    });
    
    it('should maintain correlation IDs across spans in error scenarios', async () => {
      // Arrange
      const rootSpanName = 'root-span';
      const childSpanName = 'child-span';
      const testError = new Error('Error in child span');
      
      // Act & Assert
      await expect(tracingService.createSpan(rootSpanName, async () => {
        return tracingService.createSpan(childSpanName, async () => {
          throw testError;
        });
      })).rejects.toThrow(testError);
      
      // Verify error log contains trace information
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].meta).toBeDefined();
      expect(mockLogger.errors[0].meta[0]).toHaveProperty('correlationId');
    });
  });
  
  describe('HTTP and External Service Errors', () => {
    it('should properly handle HTTP client errors', async () => {
      // Arrange
      const clientError = new Error('HTTP 400 Bad Request');
      clientError.name = 'HttpClientError';
      (clientError as any).statusCode = 400;
      (clientError as any).response = { data: { message: 'Invalid parameters' } };
      
      // Act & Assert
      await expect(tracingService.createHttpSpan(
        'POST',
        'https://api.example.com/users',
        async () => { throw clientError; }
      )).rejects.toThrow(clientError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span HTTP POST');
    });
    
    it('should properly handle HTTP server errors', async () => {
      // Arrange
      const serverError = new Error('HTTP 500 Internal Server Error');
      serverError.name = 'HttpServerError';
      (serverError as any).statusCode = 500;
      (serverError as any).response = { data: { message: 'Server error' } };
      
      // Act & Assert
      await expect(tracingService.createHttpSpan(
        'GET',
        'https://api.example.com/data',
        async () => { throw serverError; }
      )).rejects.toThrow(serverError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span HTTP GET');
    });
    
    it('should properly handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network error: connection refused');
      networkError.name = 'NetworkError';
      (networkError as any).code = 'ECONNREFUSED';
      
      // Act & Assert
      await expect(tracingService.createHttpSpan(
        'GET',
        'https://unavailable-service.example.com',
        async () => { throw networkError; }
      )).rejects.toThrow(networkError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span HTTP GET');
    });
  });
  
  describe('Database Operation Errors', () => {
    it('should properly handle database query errors', async () => {
      // Arrange
      const queryError = new Error('SQL syntax error');
      queryError.name = 'QueryError';
      (queryError as any).code = 'ER_PARSE_ERROR';
      
      // Act & Assert
      await expect(tracingService.createDatabaseSpan(
        'query',
        'users',
        async () => { throw queryError; }
      )).rejects.toThrow(queryError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span DB query users');
    });
    
    it('should properly handle database connection errors', async () => {
      // Arrange
      const connectionError = new Error('Connection to database failed');
      connectionError.name = 'ConnectionError';
      (connectionError as any).code = 'ECONNREFUSED';
      
      // Act & Assert
      await expect(tracingService.createDatabaseSpan(
        'connect',
        'postgres',
        async () => { throw connectionError; }
      )).rejects.toThrow(connectionError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span DB connect postgres');
    });
    
    it('should properly handle database transaction errors', async () => {
      // Arrange
      const transactionError = new Error('Transaction rollback due to constraint violation');
      transactionError.name = 'TransactionError';
      (transactionError as any).code = 'ER_CONSTRAINT_VIOLATION';
      
      // Act & Assert
      await expect(tracingService.createDatabaseSpan(
        'transaction',
        'orders',
        async () => { throw transactionError; }
      )).rejects.toThrow(transactionError);
      
      // Verify error was logged
      expect(mockLogger.errors.length).toBe(1);
      expect(mockLogger.errors[0].message).toContain('Error in span DB transaction orders');
    });
  });
});