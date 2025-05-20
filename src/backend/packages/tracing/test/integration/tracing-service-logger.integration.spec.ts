import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService, LoggerModule, LogLevel } from '@austa/logging';
import { TracingService } from '../../src/tracing.service';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { createTestModule } from '../utils/test-module.utils';
import { MockLoggerService } from '../mocks/mock-logger.service';
import { getTraceCorrelation } from '../../src/utils/correlation';

/**
 * Integration tests that verify the correct interaction between TracingService and LoggerService
 * for log correlation. These tests ensure that trace and span IDs are properly propagated to
 * log entries, enabling correlation between logs and traces for unified observability.
 */
describe('TracingService-LoggerService Integration', () => {
  let tracingService: TracingService;
  let loggerService: LoggerService;
  let mockLoggerService: MockLoggerService;
  let module: TestingModule;

  beforeEach(async () => {
    // Create a mock logger service that we can inspect
    mockLoggerService = new MockLoggerService();

    // Create a test module with both TracingService and LoggerService
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            service: {
              name: 'test-service',
            },
          })],
        }),
      ],
      providers: [
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        TracingService,
      ],
    }).compile();

    tracingService = module.get<TracingService>(TracingService);
    loggerService = module.get<LoggerService>(LoggerService);
    
    // Set up the mock logger to extract trace context from the active span
    mockLoggerService.setTraceContextSimulator(() => {
      const correlation = getTraceCorrelation();
      if (!correlation) {
        return {};
      }
      return {
        traceId: correlation.traceId,
        spanId: correlation.spanId
      };
    });
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Trace Context Propagation to Logs', () => {
    it('should include trace and span IDs in log entries', async () => {
      // Create a span and execute a function that logs a message
      await tracingService.createSpan('test-span', async () => {
        // Get the current span to verify later
        const currentSpan = tracingService.getCurrentSpan();
        expect(currentSpan).toBeDefined();
        
        // Log a message within the span context
        loggerService.log('Test message within span');
        
        // Verify that the log entry includes trace and span IDs
        const logEntries = mockLoggerService.getLogEntries();
        expect(logEntries.length).toBeGreaterThan(0);
        
        const lastLogEntry = logEntries[logEntries.length - 1];
        expect(lastLogEntry).toHaveProperty('traceId');
        expect(lastLogEntry).toHaveProperty('spanId');
        
        // Verify that the trace and span IDs match the current span
        const spanContext = currentSpan.spanContext();
        expect(lastLogEntry.traceId).toBe(spanContext.traceId);
        expect(lastLogEntry.spanId).toBe(spanContext.spanId);
      });
    });

    it('should propagate trace context to error logs', async () => {
      // Create a span and execute a function that throws an error
      try {
        await tracingService.createSpan('error-span', async () => {
          // Get the current span to verify later
          const currentSpan = tracingService.getCurrentSpan();
          expect(currentSpan).toBeDefined();
          
          // Log an error within the span context
          const error = new Error('Test error');
          loggerService.error('Test error message', error.stack);
          
          // Verify that the error log entry includes trace and span IDs
          const errorLogEntries = mockLoggerService.getErrorLogEntries();
          expect(errorLogEntries.length).toBeGreaterThan(0);
          
          const lastErrorLogEntry = errorLogEntries[errorLogEntries.length - 1];
          expect(lastErrorLogEntry).toHaveProperty('traceId');
          expect(lastErrorLogEntry).toHaveProperty('spanId');
          
          // Verify that the trace and span IDs match the current span
          const spanContext = currentSpan.spanContext();
          expect(lastErrorLogEntry.traceId).toBe(spanContext.traceId);
          expect(lastErrorLogEntry.spanId).toBe(spanContext.spanId);
          
          // Throw the error to test error handling
          throw error;
        });
      } catch (error) {
        // Expected error, continue with test
        expect(error.message).toBe('Test error');
      }
      
      // Verify that the TracingService logged the error with trace context
      const errorLogEntries = mockLoggerService.getErrorLogEntries();
      expect(errorLogEntries.length).toBeGreaterThan(1); // Should have at least 2 error logs (our manual one and the one from TracingService)
      
      // The last error log should be from TracingService's error handling
      const tracingErrorLog = errorLogEntries[errorLogEntries.length - 1];
      expect(tracingErrorLog.message).toContain('Error in span error-span');
      expect(tracingErrorLog).toHaveProperty('traceId');
      expect(tracingErrorLog).toHaveProperty('spanId');
    });
  });

  describe('Context Extraction and Enrichment', () => {
    it('should extract trace context and enrich log context', async () => {
      // Create a span with custom attributes
      await tracingService.createSpan('context-span', async () => {
        // Add custom attributes to the current span
        tracingService.addAttributesToCurrentSpan({
          'user.id': 'test-user-123',
          'journey.type': 'health',
          'request.id': 'req-456',
        });
        
        // Log a message with context
        loggerService.log('Test message with context', { customField: 'test-value' });
        
        // Verify that the log entry includes both trace context and custom context
        const logEntries = mockLoggerService.getLogEntries();
        const lastLogEntry = logEntries[logEntries.length - 1];
        
        // Should have trace context
        expect(lastLogEntry).toHaveProperty('traceId');
        expect(lastLogEntry).toHaveProperty('spanId');
        
        // Should have custom context
        expect(lastLogEntry).toHaveProperty('customField');
        expect(lastLogEntry.customField).toBe('test-value');
      });
    });

    it('should preserve trace context in nested logging operations', async () => {
      // Create a parent span
      await tracingService.createSpan('parent-span', async () => {
        const parentSpan = tracingService.getCurrentSpan();
        const parentContext = parentSpan.spanContext();
        
        // Log in parent span
        loggerService.log('Parent span log');
        
        // Create a child span
        await tracingService.createSpan('child-span', async () => {
          const childSpan = tracingService.getCurrentSpan();
          const childContext = childSpan.spanContext();
          
          // Log in child span
          loggerService.log('Child span log');
          
          // Verify child span log has correct context
          const logEntries = mockLoggerService.getLogEntries();
          const childLogEntry = logEntries[logEntries.length - 1];
          
          // Should have child span's context
          expect(childLogEntry).toHaveProperty('traceId');
          expect(childLogEntry).toHaveProperty('spanId');
          expect(childLogEntry.traceId).toBe(childContext.traceId);
          expect(childLogEntry.spanId).toBe(childContext.spanId);
          
          // Child and parent should share the same trace ID but have different span IDs
          expect(childContext.traceId).toBe(parentContext.traceId);
          expect(childContext.spanId).not.toBe(parentContext.spanId);
        });
        
        // Log again in parent span after child span completes
        loggerService.log('Parent span log after child');
        
        // Verify parent span log has correct context
        const logEntries = mockLoggerService.getLogEntries();
        const parentLogEntry = logEntries[logEntries.length - 1];
        
        // Should have parent span's context
        expect(parentLogEntry).toHaveProperty('traceId');
        expect(parentLogEntry).toHaveProperty('spanId');
        expect(parentLogEntry.traceId).toBe(parentContext.traceId);
        expect(parentLogEntry.spanId).toBe(parentContext.spanId);
      });
    });
  });

  describe('Journey-Specific Tracing and Logging', () => {
    it('should propagate journey context to logs in health journey', async () => {
      // Create a journey-specific span for the health journey
      await tracingService.createJourneySpan('health', 'record-metrics', async () => {
        // Get the current span to verify later
        const currentSpan = tracingService.getCurrentSpan();
        expect(currentSpan).toBeDefined();
        
        // Add journey-specific context to the log
        const journeyContext = { journeyType: 'health', operationType: 'record-metrics' };
        
        // Log within the journey span
        loggerService.log('Recording health metrics', journeyContext);
        
        // Verify that the log entry includes journey-specific context
        const logEntries = mockLoggerService.getLogEntries();
        const lastLogEntry = logEntries[logEntries.length - 1];
        
        // Should have trace context
        expect(lastLogEntry).toHaveProperty('traceId');
        expect(lastLogEntry).toHaveProperty('spanId');
        
        // Should have journey context
        expect(lastLogEntry).toHaveProperty('journeyType');
        expect(lastLogEntry.journeyType).toBe('health');
        expect(lastLogEntry).toHaveProperty('operationType');
        expect(lastLogEntry.operationType).toBe('record-metrics');
        
        // Verify the span name follows the expected pattern for journey spans
        const spanContext = currentSpan.spanContext();
        expect(lastLogEntry.traceId).toBe(spanContext.traceId);
        expect(lastLogEntry.spanId).toBe(spanContext.spanId);
      });
    });

    it('should propagate journey context to logs in care journey', async () => {
      // Create a journey-specific span for the care journey
      await tracingService.createJourneySpan('care', 'schedule-appointment', async () => {
        // Get the current span to verify later
        const currentSpan = tracingService.getCurrentSpan();
        expect(currentSpan).toBeDefined();
        
        // Add journey-specific context to the log
        const journeyContext = { journeyType: 'care', operationType: 'schedule-appointment' };
        
        // Log within the journey span
        loggerService.log('Scheduling care appointment', journeyContext);
        
        // Verify that the log entry includes journey-specific context
        const logEntries = mockLoggerService.getLogEntries();
        const lastLogEntry = logEntries[logEntries.length - 1];
        
        // Should have trace context
        expect(lastLogEntry).toHaveProperty('traceId');
        expect(lastLogEntry).toHaveProperty('spanId');
        
        // Should have journey context
        expect(lastLogEntry).toHaveProperty('journeyType');
        expect(lastLogEntry.journeyType).toBe('care');
        expect(lastLogEntry).toHaveProperty('operationType');
        expect(lastLogEntry.operationType).toBe('schedule-appointment');
        
        // Verify the span name follows the expected pattern for journey spans
        const spanContext = currentSpan.spanContext();
        expect(lastLogEntry.traceId).toBe(spanContext.traceId);
        expect(lastLogEntry.spanId).toBe(spanContext.spanId);
      });
    });

    it('should propagate journey context to logs in plan journey', async () => {
      // Create a journey-specific span for the plan journey
      await tracingService.createJourneySpan('plan', 'submit-claim', async () => {
        // Get the current span to verify later
        const currentSpan = tracingService.getCurrentSpan();
        expect(currentSpan).toBeDefined();
        
        // Add journey-specific context to the log
        const journeyContext = { journeyType: 'plan', operationType: 'submit-claim' };
        
        // Log within the journey span
        loggerService.log('Submitting insurance claim', journeyContext);
        
        // Verify that the log entry includes journey-specific context
        const logEntries = mockLoggerService.getLogEntries();
        const lastLogEntry = logEntries[logEntries.length - 1];
        
        // Should have trace context
        expect(lastLogEntry).toHaveProperty('traceId');
        expect(lastLogEntry).toHaveProperty('spanId');
        
        // Should have journey context
        expect(lastLogEntry).toHaveProperty('journeyType');
        expect(lastLogEntry.journeyType).toBe('plan');
        expect(lastLogEntry).toHaveProperty('operationType');
        expect(lastLogEntry.operationType).toBe('submit-claim');
        
        // Verify the span name follows the expected pattern for journey spans
        const spanContext = currentSpan.spanContext();
        expect(lastLogEntry.traceId).toBe(spanContext.traceId);
        expect(lastLogEntry.spanId).toBe(spanContext.spanId);
      });
    });
    
    it('should maintain trace context across different journey spans', async () => {
      // Create a parent span for a health journey operation
      await tracingService.createJourneySpan('health', 'view-metrics', async () => {
        const healthSpan = tracingService.getCurrentSpan();
        const healthContext = healthSpan.spanContext();
        
        // Log in health journey
        loggerService.log('Viewing health metrics', { journeyType: 'health' });
        
        // Create a child span for a care journey operation
        await tracingService.createJourneySpan('care', 'view-appointments', async () => {
          const careSpan = tracingService.getCurrentSpan();
          const careContext = careSpan.spanContext();
          
          // Log in care journey
          loggerService.log('Viewing care appointments', { journeyType: 'care' });
          
          // Verify care journey log has correct context
          const logEntries = mockLoggerService.getLogEntries();
          const careLogEntry = logEntries[logEntries.length - 1];
          
          // Should have care span's context
          expect(careLogEntry).toHaveProperty('traceId');
          expect(careLogEntry).toHaveProperty('spanId');
          expect(careLogEntry.traceId).toBe(careContext.traceId);
          expect(careLogEntry.spanId).toBe(careContext.spanId);
          expect(careLogEntry.journeyType).toBe('care');
          
          // Care and health should share the same trace ID but have different span IDs
          expect(careContext.traceId).toBe(healthContext.traceId);
          expect(careContext.spanId).not.toBe(healthContext.spanId);
        });
        
        // Create another child span for a plan journey operation
        await tracingService.createJourneySpan('plan', 'view-claims', async () => {
          const planSpan = tracingService.getCurrentSpan();
          const planContext = planSpan.spanContext();
          
          // Log in plan journey
          loggerService.log('Viewing plan claims', { journeyType: 'plan' });
          
          // Verify plan journey log has correct context
          const logEntries = mockLoggerService.getLogEntries();
          const planLogEntry = logEntries[logEntries.length - 1];
          
          // Should have plan span's context
          expect(planLogEntry).toHaveProperty('traceId');
          expect(planLogEntry).toHaveProperty('spanId');
          expect(planLogEntry.traceId).toBe(planContext.traceId);
          expect(planLogEntry.spanId).toBe(planContext.spanId);
          expect(planLogEntry.journeyType).toBe('plan');
          
          // Plan and health should share the same trace ID but have different span IDs
          expect(planContext.traceId).toBe(healthContext.traceId);
          expect(planContext.spanId).not.toBe(healthContext.spanId);
        });
        
        // Log again in health journey after other journeys complete
        loggerService.log('Back to health journey', { journeyType: 'health' });
        
        // Verify health journey log has correct context
        const logEntries = mockLoggerService.getLogEntries();
        const healthLogEntry = logEntries[logEntries.length - 1];
        
        // Should have health span's context
        expect(healthLogEntry).toHaveProperty('traceId');
        expect(healthLogEntry).toHaveProperty('spanId');
        expect(healthLogEntry.traceId).toBe(healthContext.traceId);
        expect(healthLogEntry.spanId).toBe(healthContext.spanId);
        expect(healthLogEntry.journeyType).toBe('health');
      });
    });
  });

  describe('Error Handling and Logging', () => {
    it('should record exceptions in spans and propagate to logs', async () => {
      // Create a span that will throw an error
      try {
        await tracingService.createSpan('error-handling-span', async () => {
          // Throw an error within the span
          throw new Error('Intentional test error');
        });
        
        // Should not reach here
        fail('Expected error was not thrown');
      } catch (error) {
        // Expected error, continue with test
        expect(error.message).toBe('Intentional test error');
      }
      
      // Verify that the error was logged with trace context
      const errorLogEntries = mockLoggerService.getErrorLogEntries();
      expect(errorLogEntries.length).toBeGreaterThan(0);
      
      const lastErrorLogEntry = errorLogEntries[errorLogEntries.length - 1];
      expect(lastErrorLogEntry.message).toContain('Error in span error-handling-span');
      expect(lastErrorLogEntry).toHaveProperty('traceId');
      expect(lastErrorLogEntry).toHaveProperty('spanId');
    });

    it('should handle and log errors in nested spans with proper context', async () => {
      // Create a parent span
      await tracingService.createSpan('parent-error-span', async () => {
        const parentSpan = tracingService.getCurrentSpan();
        const parentContext = parentSpan.spanContext();
        
        try {
          // Create a child span that will throw an error
          await tracingService.createSpan('child-error-span', async () => {
            const childSpan = tracingService.getCurrentSpan();
            const childContext = childSpan.spanContext();
            
            // Verify child has same trace ID but different span ID
            expect(childContext.traceId).toBe(parentContext.traceId);
            expect(childContext.spanId).not.toBe(parentContext.spanId);
            
            // Throw an error in the child span
            throw new Error('Child span error');
          });
          
          // Should not reach here
          fail('Expected error was not thrown');
        } catch (error) {
          // Expected error, continue with parent span
          expect(error.message).toBe('Child span error');
          
          // Log in parent span after catching child error
          loggerService.log('Continuing in parent span after child error');
        }
        
        // Verify that the error was logged with child span context
        const errorLogEntries = mockLoggerService.getErrorLogEntries();
        expect(errorLogEntries.length).toBeGreaterThan(0);
        
        const childErrorLogEntry = errorLogEntries[errorLogEntries.length - 1];
        expect(childErrorLogEntry.message).toContain('Error in span child-error-span');
        expect(childErrorLogEntry).toHaveProperty('traceId');
        expect(childErrorLogEntry).toHaveProperty('spanId');
        expect(childErrorLogEntry.traceId).toBe(parentContext.traceId); // Same trace ID
        expect(childErrorLogEntry.spanId).not.toBe(parentContext.spanId); // Different span ID
        
        // Verify that the parent span log has parent context
        const logEntries = mockLoggerService.getLogEntries();
        const parentLogEntry = logEntries[logEntries.length - 1];
        expect(parentLogEntry.message).toBe('Continuing in parent span after child error');
        expect(parentLogEntry).toHaveProperty('traceId');
        expect(parentLogEntry).toHaveProperty('spanId');
        expect(parentLogEntry.traceId).toBe(parentContext.traceId);
        expect(parentLogEntry.spanId).toBe(parentContext.spanId);
      });
    });
  });

  describe('Correlation IDs Consistency', () => {
    it('should maintain consistent correlation IDs between traces and logs', async () => {
      // Create a span with a correlation ID
      await tracingService.createSpan('correlation-span', async () => {
        // Get the current trace correlation
        const correlation = getTraceCorrelation();
        expect(correlation).toBeDefined();
        expect(correlation.traceId).toBeDefined();
        expect(correlation.spanId).toBeDefined();
        
        // Log a message
        loggerService.log('Test correlation message');
        
        // Verify that the log entry has the same correlation IDs
        const logEntries = mockLoggerService.getLogEntries();
        const lastLogEntry = logEntries[logEntries.length - 1];
        
        expect(lastLogEntry).toHaveProperty('traceId');
        expect(lastLogEntry).toHaveProperty('spanId');
        expect(lastLogEntry.traceId).toBe(correlation.traceId);
        expect(lastLogEntry.spanId).toBe(correlation.spanId);
      });
    });

    it('should maintain correlation IDs across multiple log types', async () => {
      // Create a span for testing multiple log types
      await tracingService.createSpan('multi-log-span', async () => {
        // Get the current trace correlation
        const correlation = getTraceCorrelation();
        expect(correlation).toBeDefined();
        
        // Log different types of messages
        loggerService.log('Info message');
        loggerService.warn('Warning message');
        loggerService.error('Error message');
        loggerService.debug('Debug message');
        
        // Verify info logs
        const infoLogs = mockLoggerService.getLogEntries();
        expect(infoLogs[infoLogs.length - 1]).toHaveProperty('traceId', correlation.traceId);
        expect(infoLogs[infoLogs.length - 1]).toHaveProperty('spanId', correlation.spanId);
        
        // Verify warning logs
        const warnLogs = mockLoggerService.getWarnLogEntries();
        expect(warnLogs[warnLogs.length - 1]).toHaveProperty('traceId', correlation.traceId);
        expect(warnLogs[warnLogs.length - 1]).toHaveProperty('spanId', correlation.spanId);
        
        // Verify error logs
        const errorLogs = mockLoggerService.getErrorLogEntries();
        expect(errorLogs[errorLogs.length - 1]).toHaveProperty('traceId', correlation.traceId);
        expect(errorLogs[errorLogs.length - 1]).toHaveProperty('spanId', correlation.spanId);
        
        // Verify debug logs
        const debugLogs = mockLoggerService.getDebugLogEntries();
        expect(debugLogs[debugLogs.length - 1]).toHaveProperty('traceId', correlation.traceId);
        expect(debugLogs[debugLogs.length - 1]).toHaveProperty('spanId', correlation.spanId);
      });
    });
  });
});