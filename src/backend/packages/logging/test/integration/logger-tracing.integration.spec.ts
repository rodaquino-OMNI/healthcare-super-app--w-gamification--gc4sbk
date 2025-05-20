import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '../../src/logger.service';
import { LoggerModule } from '../../src/logger.module';
import { TracingService } from '@austa/tracing';
import { Context, SpanStatusCode, trace } from '@opentelemetry/api';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { ContextManager } from '../../src/context/context-manager';
import { logCaptureUtils, testContextUtils } from '../utils';
import { mockTracerUtils, spanAssertionUtils } from '@austa/tracing/test/utils';

describe('LoggerService and TracingService Integration', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let tracingService: TracingService;
  let contextManager: ContextManager;
  let configService: ConfigService;
  let logCapture: ReturnType<typeof logCaptureUtils.createLogCapture>;
  
  beforeEach(async () => {
    // Create a log capture utility to intercept and verify logs
    logCapture = logCaptureUtils.createLogCapture();
    
    // Create a test module with both LoggerService and TracingService
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            service: {
              name: 'test-service',
            },
            logging: {
              level: LogLevel.DEBUG,
              format: 'json',
              transports: ['console'],
            },
          })],
        }),
        LoggerModule.forRoot(),
      ],
      providers: [
        {
          provide: TracingService,
          useFactory: (configService: ConfigService, loggerService: LoggerService) => {
            return mockTracerUtils.createMockTracingService(configService, loggerService);
          },
          inject: [ConfigService, LoggerService],
        },
        ContextManager,
      ],
    }).compile();

    loggerService = module.get<LoggerService>(LoggerService);
    tracingService = module.get<TracingService>(TracingService);
    contextManager = module.get<ContextManager>(ContextManager);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    await module.close();
    logCapture.restore();
  });

  describe('Trace ID propagation to logs', () => {
    it('should include trace ID in log entries when a span is active', async () => {
      // Create a span using the tracing service
      await tracingService.createSpan('test-operation', async () => {
        // Get the current span and trace ID
        const currentSpan = trace.getSpan(trace.context());
        const traceId = currentSpan?.spanContext().traceId;
        
        // Log a message within the span
        loggerService.log('Test message within span');
        
        // Verify the log contains the trace ID
        const logs = logCapture.getLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[logs.length - 1]).toContain(traceId);
      });
    });

    it('should include trace ID in all log levels', async () => {
      await tracingService.createSpan('test-all-levels', async () => {
        const currentSpan = trace.getSpan(trace.context());
        const traceId = currentSpan?.spanContext().traceId;
        
        // Test all log levels
        loggerService.debug('Debug message');
        loggerService.log('Info message');
        loggerService.warn('Warning message');
        loggerService.error('Error message');
        loggerService.verbose('Verbose message');
        
        // Verify all logs contain the trace ID
        const logs = logCapture.getLogs();
        expect(logs.length).toBeGreaterThanOrEqual(5);
        
        logs.forEach(log => {
          expect(log).toContain(traceId);
        });
      });
    });

    it('should not include trace ID when no span is active', () => {
      // Log without an active span
      loggerService.log('Test message without span');
      
      // Verify the log doesn't contain a trace ID field
      const logs = logCapture.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      
      // The log should not contain a trace ID or should have a null/empty trace ID
      const parsedLog = JSON.parse(lastLog);
      expect(parsedLog.traceId).toBeFalsy();
    });
  });

  describe('Span context extraction in logging operations', () => {
    it('should extract span context and include it in log metadata', async () => {
      await tracingService.createSpan('test-span-context', async () => {
        const currentSpan = trace.getSpan(trace.context());
        const spanContext = currentSpan?.spanContext();
        
        // Log with additional context
        const testContext = { testKey: 'testValue' };
        loggerService.log('Test message with context', testContext);
        
        // Verify the log contains both span context and the provided context
        const logs = logCapture.getLogs();
        const lastLog = JSON.parse(logs[logs.length - 1]);
        
        // Check trace context
        expect(lastLog.traceId).toBe(spanContext?.traceId);
        expect(lastLog.spanId).toBe(spanContext?.spanId);
        
        // Check additional context
        expect(lastLog.context).toMatchObject(testContext);
      });
    });

    it('should include journey context along with trace context', async () => {
      // Create a journey context
      const journeyContext: JourneyContext = testContextUtils.createHealthJourneyContext();
      
      // Set the journey context
      contextManager.setContext(journeyContext);
      
      await tracingService.createSpan('test-journey-context', async () => {
        const currentSpan = trace.getSpan(trace.context());
        const spanContext = currentSpan?.spanContext();
        
        // Log within the journey and span context
        loggerService.log('Test message within journey');
        
        // Verify the log contains both journey and trace context
        const logs = logCapture.getLogs();
        const lastLog = JSON.parse(logs[logs.length - 1]);
        
        // Check trace context
        expect(lastLog.traceId).toBe(spanContext?.traceId);
        expect(lastLog.spanId).toBe(spanContext?.spanId);
        
        // Check journey context
        expect(lastLog.journeyType).toBe(journeyContext.journeyType);
        expect(lastLog.journeyId).toBe(journeyContext.journeyId);
      });
    });
  });

  describe('Error recording in both logs and traces', () => {
    it('should record errors in both logs and traces', async () => {
      const errorMessage = 'Test error message';
      const error = new Error(errorMessage);
      
      try {
        await tracingService.createSpan('test-error-recording', async () => {
          // Log an error and throw it
          loggerService.error(errorMessage, error.stack);
          throw error;
        });
      } catch (e) {
        // Expected error, continue with test
      }
      
      // Verify the error was logged
      const logs = logCapture.getLogs();
      const errorLog = logs.find(log => log.includes(errorMessage));
      expect(errorLog).toBeDefined();
      
      // Verify the error was recorded in the span
      const mockTracer = mockTracerUtils.getMockTracer();
      const spans = mockTracer.getRecordedSpans();
      const errorSpan = spans.find(span => span.name === 'test-error-recording');
      
      expect(errorSpan).toBeDefined();
      expect(errorSpan?.status.code).toBe(SpanStatusCode.ERROR);
      expect(errorSpan?.events.some(event => 
        event.name === 'exception' && 
        event.attributes['exception.message'] === errorMessage
      )).toBe(true);
    });

    it('should include trace context in error logs', async () => {
      const errorMessage = 'Another test error';
      
      await tracingService.createSpan('test-error-context', async () => {
        const currentSpan = trace.getSpan(trace.context());
        const traceId = currentSpan?.spanContext().traceId;
        
        // Log an error within the span
        loggerService.error(errorMessage, new Error(errorMessage).stack);
        
        // Verify the error log contains the trace ID
        const logs = logCapture.getLogs();
        const errorLog = logs.find(log => log.includes(errorMessage));
        expect(errorLog).toBeDefined();
        expect(errorLog).toContain(traceId);
      });
    });
  });

  describe('Trace context preservation across async boundaries', () => {
    it('should preserve trace context across async operations', async () => {
      await tracingService.createSpan('test-async-context', async () => {
        const currentSpan = trace.getSpan(trace.context());
        const traceId = currentSpan?.spanContext().traceId;
        
        // Create a promise that will log after a delay
        const asyncOperation = new Promise<void>(resolve => {
          setTimeout(() => {
            loggerService.log('Async message after delay');
            resolve();
          }, 10);
        });
        
        await asyncOperation;
        
        // Verify the async log contains the same trace ID
        const logs = logCapture.getLogs();
        const asyncLog = logs.find(log => log.includes('Async message after delay'));
        expect(asyncLog).toBeDefined();
        expect(asyncLog).toContain(traceId);
      });
    });

    it('should preserve trace context in nested async operations', async () => {
      await tracingService.createSpan('test-nested-async', async () => {
        const outerSpan = trace.getSpan(trace.context());
        const traceId = outerSpan?.spanContext().traceId;
        
        // Create nested async operations
        const nestedAsyncOperation = async () => {
          await new Promise<void>(resolve => setTimeout(resolve, 10));
          return new Promise<void>(resolve => {
            setTimeout(() => {
              loggerService.log('Nested async message');
              resolve();
            }, 10);
          });
        };
        
        await nestedAsyncOperation();
        
        // Verify the nested async log contains the same trace ID
        const logs = logCapture.getLogs();
        const nestedLog = logs.find(log => log.includes('Nested async message'));
        expect(nestedLog).toBeDefined();
        expect(nestedLog).toContain(traceId);
      });
    });
  });

  describe('Trace correlation in different logging formats', () => {
    it('should include trace correlation in JSON format', async () => {
      // Configure logger to use JSON format
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'logging.format') return 'json';
        return undefined;
      });
      
      await tracingService.createSpan('test-json-format', async () => {
        const currentSpan = trace.getSpan(trace.context());
        const traceId = currentSpan?.spanContext().traceId;
        const spanId = currentSpan?.spanContext().spanId;
        
        loggerService.log('Test JSON format message');
        
        // Verify the log is in JSON format and contains trace correlation
        const logs = logCapture.getLogs();
        const lastLog = logs[logs.length - 1];
        
        // Should be valid JSON
        expect(() => JSON.parse(lastLog)).not.toThrow();
        
        const parsedLog = JSON.parse(lastLog);
        expect(parsedLog.traceId).toBe(traceId);
        expect(parsedLog.spanId).toBe(spanId);
        expect(parsedLog.message).toBe('Test JSON format message');
      });
    });

    it('should include trace correlation in text format', async () => {
      // Configure logger to use text format
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'logging.format') return 'text';
        return undefined;
      });
      
      await tracingService.createSpan('test-text-format', async () => {
        const currentSpan = trace.getSpan(trace.context());
        const traceId = currentSpan?.spanContext().traceId;
        
        loggerService.log('Test text format message');
        
        // Verify the log is in text format and contains trace correlation
        const logs = logCapture.getLogs();
        const lastLog = logs[logs.length - 1];
        
        // Should be text format (not valid JSON)
        expect(() => JSON.parse(lastLog)).toThrow();
        
        // Should contain the trace ID
        expect(lastLog).toContain(traceId);
        expect(lastLog).toContain('Test text format message');
      });
    });
  });

  describe('Integration with request and user context', () => {
    it('should combine trace, request, and user context in logs', async () => {
      // Create request and user contexts
      const requestContext: RequestContext = testContextUtils.createRequestContext();
      const userContext: UserContext = testContextUtils.createUserContext();
      
      // Set the contexts
      contextManager.setContext(requestContext);
      contextManager.setContext(userContext);
      
      await tracingService.createSpan('test-combined-context', async () => {
        const currentSpan = trace.getSpan(trace.context());
        const traceId = currentSpan?.spanContext().traceId;
        
        // Log with combined contexts
        loggerService.log('Test message with combined contexts');
        
        // Verify the log contains all contexts
        const logs = logCapture.getLogs();
        const lastLog = JSON.parse(logs[logs.length - 1]);
        
        // Check trace context
        expect(lastLog.traceId).toBe(traceId);
        
        // Check request context
        expect(lastLog.requestId).toBe(requestContext.requestId);
        expect(lastLog.method).toBe(requestContext.method);
        
        // Check user context
        expect(lastLog.userId).toBe(userContext.userId);
      });
    });

    it('should add trace attributes from request and user context', async () => {
      // Create request and user contexts
      const requestContext: RequestContext = testContextUtils.createRequestContext();
      const userContext: UserContext = testContextUtils.createUserContext();
      
      // Set the contexts
      contextManager.setContext(requestContext);
      contextManager.setContext(userContext);
      
      await tracingService.createSpan('test-context-attributes', async () => {
        // Log with combined contexts
        loggerService.log('Test message for span attributes');
        
        // Verify the span has attributes from the contexts
        const mockTracer = mockTracerUtils.getMockTracer();
        const spans = mockTracer.getRecordedSpans();
        const span = spans.find(s => s.name === 'test-context-attributes');
        
        expect(span).toBeDefined();
        expect(span?.attributes['http.request.id']).toBe(requestContext.requestId);
        expect(span?.attributes['http.method']).toBe(requestContext.method);
        expect(span?.attributes['user.id']).toBe(userContext.userId);
      });
    });
  });
});