import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { TransportFactory } from '../../src/transports/transport-factory';
import { Transport } from '../../src/interfaces/transport.interface';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { JourneyType } from '../../src/context/context.constants';

/**
 * Mock implementation of the TracingService for testing purposes.
 * This mock simulates the behavior of the actual TracingService
 * to test the integration between LoggerService and TracingService.
 */
class MockTracingService {
  private traceId: string = 'test-trace-id';
  private spanId: string = 'test-span-id';
  private shouldThrowError: boolean = false;
  private spans: Map<string, any> = new Map();

  /**
   * Sets the trace ID to be returned by getCurrentTraceId().
   * @param traceId The trace ID to set
   */
  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  /**
   * Sets the span ID to be returned by getCurrentSpanId().
   * @param spanId The span ID to set
   */
  setSpanId(spanId: string): void {
    this.spanId = spanId;
  }

  /**
   * Configures the mock to throw an error when trace methods are called.
   * @param shouldThrow Whether the mock should throw an error
   */
  setShouldThrowError(shouldThrow: boolean): void {
    this.shouldThrowError = shouldThrow;
  }

  /**
   * Gets the current trace ID.
   * @returns The current trace ID
   * @throws Error if shouldThrowError is true
   */
  getCurrentTraceId(): string {
    if (this.shouldThrowError) {
      throw new Error('Failed to get trace ID');
    }
    return this.traceId;
  }

  /**
   * Gets the current span ID.
   * @returns The current span ID
   * @throws Error if shouldThrowError is true
   */
  getCurrentSpanId(): string {
    if (this.shouldThrowError) {
      throw new Error('Failed to get span ID');
    }
    return this.spanId;
  }

  /**
   * Creates a new span and executes the provided function within its context.
   * @param name The name of the span
   * @param fn The function to execute within the span context
   * @returns The result of the function execution
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (this.shouldThrowError) {
      throw new Error('Failed to create span');
    }

    // Create a mock span
    const span = {
      name,
      traceId: this.traceId,
      spanId: this.spanId,
      startTime: Date.now(),
      endTime: null,
      status: 'OK',
      events: [],
      attributes: {},
      recordException: (error: Error) => {
        span.events.push({
          name: 'exception',
          time: Date.now(),
          attributes: {
            'exception.type': error.name,
            'exception.message': error.message,
            'exception.stacktrace': error.stack,
          },
        });
      },
      end: () => {
        span.endTime = Date.now();
      },
    };

    // Store the span for later inspection
    this.spans.set(name, span);

    try {
      // Execute the function
      const result = await fn();
      span.status = 'OK';
      return result;
    } catch (error) {
      // Record the exception and set the status to ERROR
      span.recordException(error);
      span.status = 'ERROR';
      throw error;
    } finally {
      // End the span
      span.end();
    }
  }

  /**
   * Gets a span by name for inspection in tests.
   * @param name The name of the span to get
   * @returns The span with the given name, or undefined if not found
   */
  getSpan(name: string): any {
    return this.spans.get(name);
  }

  /**
   * Clears all spans.
   */
  clearSpans(): void {
    this.spans.clear();
  }
}

/**
 * Mock implementation of the Transport interface for testing purposes.
 * This mock captures log entries for inspection in tests.
 */
class MockTransport implements Transport {
  private entries: LogEntry[] = [];

  /**
   * Writes a log entry to the transport.
   * @param entry The log entry to write
   */
  write(entry: LogEntry): void {
    this.entries.push(entry);
  }

  /**
   * Gets all log entries written to this transport.
   * @returns All log entries
   */
  getEntries(): LogEntry[] {
    return this.entries;
  }

  /**
   * Clears all log entries.
   */
  clearEntries(): void {
    this.entries = [];
  }
}

/**
 * Mock implementation of the TransportFactory for testing purposes.
 * This factory creates mock transports for testing.
 */
class MockTransportFactory extends TransportFactory {
  private mockTransport: MockTransport;

  constructor() {
    super();
    this.mockTransport = new MockTransport();
  }

  /**
   * Creates mock transports for testing.
   * @returns An array containing a single mock transport
   */
  createTransports(): Transport[] {
    return [this.mockTransport];
  }

  /**
   * Gets the mock transport for inspection in tests.
   * @returns The mock transport
   */
  getMockTransport(): MockTransport {
    return this.mockTransport;
  }
}

describe('LoggerService and TracingService Integration', () => {
  let loggerService: LoggerService;
  let mockTracingService: MockTracingService;
  let mockTransportFactory: MockTransportFactory;
  let mockTransport: MockTransport;

  beforeEach(async () => {
    // Create mock instances
    mockTracingService = new MockTracingService();
    mockTransportFactory = new MockTransportFactory();
    mockTransport = mockTransportFactory.getMockTransport();

    // Create a test module with the LoggerService and mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'LOGGER_CONFIG',
          useValue: {
            level: LogLevel.DEBUG,
            journeyLevels: {
              [JourneyType.HEALTH]: LogLevel.DEBUG,
              [JourneyType.CARE]: LogLevel.INFO,
              [JourneyType.PLAN]: LogLevel.INFO,
            },
            tracing: {
              enabled: true,
            },
            defaultContext: {
              application: 'austa-superapp',
              service: 'test-service',
              environment: 'test',
            },
          } as LoggerConfig,
        },
        {
          provide: TransportFactory,
          useValue: mockTransportFactory,
        },
        {
          provide: 'TRACING_SERVICE',
          useValue: mockTracingService,
        },
        LoggerService,
      ],
    }).compile();

    // Get the LoggerService instance
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    // Clear mock data after each test
    mockTransport.clearEntries();
    mockTracingService.clearSpans();
  });

  describe('Trace ID Propagation', () => {
    it('should include trace ID in log entries when tracing is enabled', () => {
      // Set up trace ID
      const testTraceId = 'test-trace-id-123';
      const testSpanId = 'test-span-id-456';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Log a message
      loggerService.log('Test message with trace');

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that the trace ID is included in the log entry
      expect(entries.length).toBe(1);
      expect(entries[0].traceId).toBe(testTraceId);
      expect(entries[0].spanId).toBe(testSpanId);
    });

    it('should handle missing trace ID gracefully', () => {
      // Set up trace ID as undefined
      mockTracingService.setTraceId(undefined);
      mockTracingService.setSpanId(undefined);

      // Log a message
      loggerService.log('Test message without trace');

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that the log entry is created without trace ID
      expect(entries.length).toBe(1);
      expect(entries[0].traceId).toBeUndefined();
      expect(entries[0].spanId).toBeUndefined();
    });

    it('should handle errors from tracing service gracefully', () => {
      // Configure the mock to throw an error
      mockTracingService.setShouldThrowError(true);

      // Log a message
      loggerService.log('Test message with tracing error');

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that the log entry is created without trace ID
      expect(entries.length).toBe(1);
      expect(entries[0].traceId).toBeUndefined();
      expect(entries[0].spanId).toBeUndefined();
    });
  });

  describe('Span Context Extraction', () => {
    it('should extract span context for different log levels', () => {
      // Set up trace ID
      const testTraceId = 'test-trace-id-789';
      const testSpanId = 'test-span-id-012';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Log messages with different levels
      loggerService.debug('Debug message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that all entries have the trace ID
      expect(entries.length).toBe(4);
      entries.forEach(entry => {
        expect(entry.traceId).toBe(testTraceId);
        expect(entry.spanId).toBe(testSpanId);
      });

      // Verify the log levels
      expect(entries[0].level).toBe(LogLevel.DEBUG);
      expect(entries[1].level).toBe(LogLevel.INFO);
      expect(entries[2].level).toBe(LogLevel.WARN);
      expect(entries[3].level).toBe(LogLevel.ERROR);
    });

    it('should extract span context with child loggers', () => {
      // Set up trace ID
      const testTraceId = 'test-trace-id-345';
      const testSpanId = 'test-span-id-678';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Create child loggers
      const healthLogger = loggerService.forHealthJourney();
      const careLogger = loggerService.forCareJourney();
      const planLogger = loggerService.forPlanJourney();

      // Log messages with different child loggers
      healthLogger.log('Health journey message');
      careLogger.log('Care journey message');
      planLogger.log('Plan journey message');

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that all entries have the trace ID
      expect(entries.length).toBe(3);
      entries.forEach(entry => {
        expect(entry.traceId).toBe(testTraceId);
        expect(entry.spanId).toBe(testSpanId);
      });

      // Verify the journey contexts
      expect(entries[0].context.journeyType).toBe(JourneyType.HEALTH);
      expect(entries[1].context.journeyType).toBe(JourneyType.CARE);
      expect(entries[2].context.journeyType).toBe(JourneyType.PLAN);
    });
  });

  describe('Error Recording', () => {
    it('should record errors in both logs and traces', async () => {
      // Set up trace ID
      const testTraceId = 'test-trace-id-901';
      const testSpanId = 'test-span-id-234';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Create an error
      const testError = new Error('Test error message');

      // Create a span and log an error within it
      try {
        await mockTracingService.createSpan('test-error-span', async () => {
          // Log the error
          loggerService.error('An error occurred', testError);
          
          // Throw the error to be recorded in the span
          throw testError;
        });
      } catch (error) {
        // Expected error, do nothing
      }

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that the error is recorded in the log
      expect(entries.length).toBe(1);
      expect(entries[0].level).toBe(LogLevel.ERROR);
      expect(entries[0].message).toBe('An error occurred');
      expect(entries[0].error).toBe(testError);
      expect(entries[0].traceId).toBe(testTraceId);
      expect(entries[0].spanId).toBe(testSpanId);

      // Get the span
      const span = mockTracingService.getSpan('test-error-span');

      // Verify that the error is recorded in the span
      expect(span).toBeDefined();
      expect(span.status).toBe('ERROR');
      expect(span.events.length).toBe(1);
      expect(span.events[0].name).toBe('exception');
      expect(span.events[0].attributes['exception.message']).toBe('Test error message');
    });

    it('should handle errors with stack traces', () => {
      // Set up trace ID
      mockTracingService.setTraceId('test-trace-id');
      mockTracingService.setSpanId('test-span-id');

      // Create an error with a stack trace
      const testError = new Error('Test stack trace error');
      const stackTrace = 'Error: Test stack trace\n    at TestFunction (test.ts:123:45)';

      // Log the error with a stack trace
      loggerService.error('Error with stack trace', stackTrace);

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that the stack trace is included in the log entry
      expect(entries.length).toBe(1);
      expect(entries[0].level).toBe(LogLevel.ERROR);
      expect(entries[0].message).toBe('Error with stack trace');
      expect(entries[0].stack).toBe(stackTrace);
    });

    it('should handle fatal errors with trace context', () => {
      // Set up trace ID
      const testTraceId = 'test-trace-id-567';
      const testSpanId = 'test-span-id-890';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Create a fatal error
      const testError = new Error('Fatal error message');

      // Log a fatal error
      loggerService.fatal('A fatal error occurred', testError);

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that the fatal error is recorded with trace context
      expect(entries.length).toBe(1);
      expect(entries[0].level).toBe(LogLevel.FATAL);
      expect(entries[0].message).toBe('A fatal error occurred');
      expect(entries[0].error).toBe(testError);
      expect(entries[0].traceId).toBe(testTraceId);
      expect(entries[0].spanId).toBe(testSpanId);
    });
  });

  describe('Trace Context Preservation', () => {
    it('should preserve trace context across async boundaries', async () => {
      // Set up trace ID
      const testTraceId = 'test-trace-id-async';
      const testSpanId = 'test-span-id-async';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Create a span
      await mockTracingService.createSpan('async-operation', async () => {
        // Log before async operation
        loggerService.log('Before async operation');

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));

        // Log after async operation
        loggerService.log('After async operation');

        // Return a value
        return 'async result';
      });

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that both log entries have the same trace context
      expect(entries.length).toBe(2);
      expect(entries[0].traceId).toBe(testTraceId);
      expect(entries[0].spanId).toBe(testSpanId);
      expect(entries[1].traceId).toBe(testTraceId);
      expect(entries[1].spanId).toBe(testSpanId);
    });

    it('should preserve trace context with nested spans', async () => {
      // Set up trace ID
      const outerTraceId = 'outer-trace-id';
      const outerSpanId = 'outer-span-id';
      mockTracingService.setTraceId(outerTraceId);
      mockTracingService.setSpanId(outerSpanId);

      // Create nested spans
      await mockTracingService.createSpan('outer-span', async () => {
        // Log in outer span
        loggerService.log('In outer span');

        // Create inner span
        const innerTraceId = 'inner-trace-id';
        const innerSpanId = 'inner-span-id';
        mockTracingService.setTraceId(innerTraceId);
        mockTracingService.setSpanId(innerSpanId);

        await mockTracingService.createSpan('inner-span', async () => {
          // Log in inner span
          loggerService.log('In inner span');
        });

        // Restore outer span context
        mockTracingService.setTraceId(outerTraceId);
        mockTracingService.setSpanId(outerSpanId);

        // Log after inner span
        loggerService.log('After inner span');
      });

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that the log entries have the correct trace context
      expect(entries.length).toBe(3);
      expect(entries[0].traceId).toBe(outerTraceId);
      expect(entries[0].spanId).toBe(outerSpanId);
      expect(entries[1].traceId).toBe(innerTraceId);
      expect(entries[1].spanId).toBe(innerSpanId);
      expect(entries[2].traceId).toBe(outerTraceId);
      expect(entries[2].spanId).toBe(outerSpanId);
    });
  });

  describe('Trace Correlation in Different Contexts', () => {
    it('should correlate traces across different journey contexts', () => {
      // Set up trace ID
      const testTraceId = 'cross-journey-trace-id';
      const testSpanId = 'cross-journey-span-id';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Create loggers for different journeys
      const healthLogger = loggerService.forHealthJourney();
      const careLogger = loggerService.forCareJourney();
      const planLogger = loggerService.forPlanJourney();

      // Log messages in different journey contexts
      healthLogger.log('Health journey event');
      careLogger.log('Care journey event');
      planLogger.log('Plan journey event');

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that all entries have the same trace ID
      expect(entries.length).toBe(3);
      entries.forEach(entry => {
        expect(entry.traceId).toBe(testTraceId);
        expect(entry.spanId).toBe(testSpanId);
      });

      // Verify the journey contexts
      expect(entries[0].context.journeyType).toBe(JourneyType.HEALTH);
      expect(entries[1].context.journeyType).toBe(JourneyType.CARE);
      expect(entries[2].context.journeyType).toBe(JourneyType.PLAN);
    });

    it('should correlate traces with user and request context', () => {
      // Set up trace ID
      const testTraceId = 'user-request-trace-id';
      const testSpanId = 'user-request-span-id';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Create loggers with different contexts
      const userLogger = loggerService.withUserContext({ userId: 'test-user-id' });
      const requestLogger = userLogger.withRequestContext({ requestId: 'test-request-id' });

      // Log messages with different contexts
      loggerService.log('Base logger message');
      userLogger.log('User context message');
      requestLogger.log('Request context message');

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that all entries have the same trace ID
      expect(entries.length).toBe(3);
      entries.forEach(entry => {
        expect(entry.traceId).toBe(testTraceId);
        expect(entry.spanId).toBe(testSpanId);
      });

      // Verify the contexts
      expect(entries[0].context.userId).toBeUndefined();
      expect(entries[0].context.requestId).toBeUndefined();
      
      expect(entries[1].context.userId).toBe('test-user-id');
      expect(entries[1].context.requestId).toBeUndefined();
      
      expect(entries[2].context.userId).toBe('test-user-id');
      expect(entries[2].context.requestId).toBe('test-request-id');
    });

    it('should handle complex nested contexts with trace correlation', () => {
      // Set up trace ID
      const testTraceId = 'complex-context-trace-id';
      const testSpanId = 'complex-context-span-id';
      mockTracingService.setTraceId(testTraceId);
      mockTracingService.setSpanId(testSpanId);

      // Create a complex nested context
      const baseLogger = loggerService.withContext({
        service: 'test-service',
        operation: 'complex-operation',
      });
      
      const userLogger = baseLogger.withUserContext({
        userId: 'complex-user-id',
        role: 'patient',
      });
      
      const journeyLogger = userLogger.forHealthJourney({
        journeyId: 'health-journey-123',
        feature: 'metrics',
      });
      
      const requestLogger = journeyLogger.withRequestContext({
        requestId: 'complex-request-id',
        correlationId: 'complex-correlation-id',
      });

      // Log a message with the complex context
      requestLogger.log('Complex context message');

      // Get the log entries
      const entries = mockTransport.getEntries();

      // Verify that the entry has the trace ID
      expect(entries.length).toBe(1);
      expect(entries[0].traceId).toBe(testTraceId);
      expect(entries[0].spanId).toBe(testSpanId);

      // Verify the complex context
      expect(entries[0].context.service).toBe('test-service');
      expect(entries[0].context.operation).toBe('complex-operation');
      expect(entries[0].context.userId).toBe('complex-user-id');
      expect(entries[0].context.role).toBe('patient');
      expect(entries[0].context.journeyType).toBe(JourneyType.HEALTH);
      expect(entries[0].context.journeyId).toBe('health-journey-123');
      expect(entries[0].context.feature).toBe('metrics');
      expect(entries[0].context.requestId).toBe('complex-request-id');
      expect(entries[0].context.correlationId).toBe('complex-correlation-id');
    });
  });
});