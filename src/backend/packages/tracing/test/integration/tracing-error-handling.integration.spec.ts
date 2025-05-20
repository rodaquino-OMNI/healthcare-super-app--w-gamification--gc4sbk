import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { TracingService } from '../../src';
import { SpanStatusCode, trace, context, Span, SpanKind } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Custom error classes for testing different error types
class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientError';
  }
}

class SystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemError';
  }
}

class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientError';
  }
}

class ExternalDependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExternalDependencyError';
  }
}

// Mock logger service for testing log propagation
class MockLoggerService implements LoggerService {
  logs: any[] = [];
  errors: any[] = [];
  warns: any[] = [];

  log(message: any, ...optionalParams: any[]) {
    this.logs.push({ message, params: optionalParams });
  }

  error(message: any, ...optionalParams: any[]) {
    this.errors.push({ message, params: optionalParams });
  }

  warn(message: any, ...optionalParams: any[]) {
    this.warns.push({ message, params: optionalParams });
  }

  debug(message: any, ...optionalParams: any[]) {}
  verbose(message: any, ...optionalParams: any[]) {}

  clear() {
    this.logs = [];
    this.errors = [];
    this.warns = [];
  }
}

describe('TracingService Error Handling Integration Tests', () => {
  let tracingService: TracingService;
  let mockLogger: MockLoggerService;
  let memoryExporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeEach(async () => {
    // Create in-memory span exporter for testing
    memoryExporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      resource: {
        attributes: {
          'service.name': 'test-service',
        },
      },
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(memoryExporter));
    provider.register();

    mockLogger = new MockLoggerService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              if (key === 'service.name') {
                return 'test-service';
              }
              return defaultValue;
            }),
          },
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    tracingService = module.get<TracingService>(TracingService);
  });

  afterEach(() => {
    memoryExporter.reset();
    mockLogger.clear();
  });

  it('should record exceptions in spans and set status to ERROR', async () => {
    // Arrange
    const errorMessage = 'Test error';
    const error = new Error(errorMessage);

    // Act & Assert
    await expect(
      tracingService.createSpan('test-error-span', async () => {
        throw error;
      }),
    ).rejects.toThrow(errorMessage);

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('test-error-span');
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    expect(spans[0].events.length).toBe(1); // Should have one event for the exception
    expect(spans[0].events[0].name).toBe('exception');
    
    // Verify error was logged
    expect(mockLogger.errors.length).toBe(1);
    expect(mockLogger.errors[0].message).toContain('Error in span test-error-span');
  });

  it('should properly handle and classify client errors', async () => {
    // Arrange
    const errorMessage = 'Invalid input data';
    const clientError = new ClientError(errorMessage);

    // Act & Assert
    await expect(
      tracingService.createSpan('client-error-span', async () => {
        throw clientError;
      }),
    ).rejects.toThrow(errorMessage);

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('client-error-span');
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    
    // Verify error attributes
    const exceptionEvent = spans[0].events.find(event => event.name === 'exception');
    expect(exceptionEvent).toBeDefined();
    expect(exceptionEvent?.attributes?.['exception.type']).toBe('ClientError');
    expect(exceptionEvent?.attributes?.['exception.message']).toBe(errorMessage);
  });

  it('should properly handle and classify system errors', async () => {
    // Arrange
    const errorMessage = 'Database connection failed';
    const systemError = new SystemError(errorMessage);

    // Act & Assert
    await expect(
      tracingService.createSpan('system-error-span', async () => {
        throw systemError;
      }),
    ).rejects.toThrow(errorMessage);

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('system-error-span');
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    
    // Verify error attributes
    const exceptionEvent = spans[0].events.find(event => event.name === 'exception');
    expect(exceptionEvent).toBeDefined();
    expect(exceptionEvent?.attributes?.['exception.type']).toBe('SystemError');
    expect(exceptionEvent?.attributes?.['exception.message']).toBe(errorMessage);
  });

  it('should properly handle and classify transient errors', async () => {
    // Arrange
    const errorMessage = 'Network timeout';
    const transientError = new TransientError(errorMessage);

    // Act & Assert
    await expect(
      tracingService.createSpan('transient-error-span', async () => {
        throw transientError;
      }),
    ).rejects.toThrow(errorMessage);

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('transient-error-span');
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    
    // Verify error attributes
    const exceptionEvent = spans[0].events.find(event => event.name === 'exception');
    expect(exceptionEvent).toBeDefined();
    expect(exceptionEvent?.attributes?.['exception.type']).toBe('TransientError');
    expect(exceptionEvent?.attributes?.['exception.message']).toBe(errorMessage);
  });

  it('should properly handle and classify external dependency errors', async () => {
    // Arrange
    const errorMessage = 'External API returned 500';
    const externalError = new ExternalDependencyError(errorMessage);

    // Act & Assert
    await expect(
      tracingService.createSpan('external-error-span', async () => {
        throw externalError;
      }),
    ).rejects.toThrow(errorMessage);

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('external-error-span');
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    
    // Verify error attributes
    const exceptionEvent = spans[0].events.find(event => event.name === 'exception');
    expect(exceptionEvent).toBeDefined();
    expect(exceptionEvent?.attributes?.['exception.type']).toBe('ExternalDependencyError');
    expect(exceptionEvent?.attributes?.['exception.message']).toBe(errorMessage);
  });

  it('should ensure spans are properly completed even in error scenarios', async () => {
    // Arrange
    const error = new Error('Test error');

    // Act & Assert
    await expect(
      tracingService.createSpan('error-completion-span', async () => {
        throw error;
      }),
    ).rejects.toThrow('Test error');

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('error-completion-span');
    
    // Verify span is ended (has endTime)
    expect(spans[0].endTime).toBeDefined();
  });

  it('should propagate trace context to error logs', async () => {
    // Arrange
    const error = new Error('Test error for log correlation');

    // Act & Assert
    await expect(
      tracingService.createSpan('log-correlation-span', async () => {
        throw error;
      }),
    ).rejects.toThrow('Test error for log correlation');

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('log-correlation-span');
    
    // Verify error was logged with trace information
    expect(mockLogger.errors.length).toBe(1);
    expect(mockLogger.errors[0].message).toContain('Error in span log-correlation-span');
    
    // The logger context should include 'AustaTracing'
    expect(mockLogger.errors[0].params).toContain('AustaTracing');
  });

  it('should handle nested spans with errors correctly', async () => {
    // Act & Assert
    await expect(
      tracingService.createSpan('parent-span', async () => {
        await tracingService.createSpan('child-span-1', async () => {
          // This span completes successfully
          return 'success';
        });
        
        await expect(
          tracingService.createSpan('child-span-2', async () => {
            throw new Error('Error in child span');
          }),
        ).rejects.toThrow('Error in child span');
        
        throw new Error('Error in parent span');
      }),
    ).rejects.toThrow('Error in parent span');

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert - should have 3 spans (parent + 2 children)
    expect(spans.length).toBe(3);
    
    // Find spans by name
    const parentSpan = spans.find(span => span.name === 'parent-span');
    const childSpan1 = spans.find(span => span.name === 'child-span-1');
    const childSpan2 = spans.find(span => span.name === 'child-span-2');
    
    expect(parentSpan).toBeDefined();
    expect(childSpan1).toBeDefined();
    expect(childSpan2).toBeDefined();
    
    // Verify status codes
    expect(parentSpan?.status.code).toBe(SpanStatusCode.ERROR);
    expect(childSpan1?.status.code).toBe(SpanStatusCode.OK);
    expect(childSpan2?.status.code).toBe(SpanStatusCode.ERROR);
    
    // Verify all spans are ended
    expect(parentSpan?.endTime).toBeDefined();
    expect(childSpan1?.endTime).toBeDefined();
    expect(childSpan2?.endTime).toBeDefined();
  });

  it('should add journey-specific context to errors', async () => {
    // Arrange
    const journeyContext = { journey: 'health', userId: '12345', action: 'recordMetric' };
    const error = new Error('Health metric recording failed');

    // Act & Assert
    await expect(
      tracingService.createSpan('health-journey-span', async () => {
        const span = trace.getSpan(context.active());
        if (span) {
          // Add journey-specific attributes to the span
          span.setAttribute('journey.type', journeyContext.journey);
          span.setAttribute('journey.userId', journeyContext.userId);
          span.setAttribute('journey.action', journeyContext.action);
        }
        throw error;
      }),
    ).rejects.toThrow('Health metric recording failed');

    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('health-journey-span');
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    
    // Verify journey-specific attributes
    expect(spans[0].attributes['journey.type']).toBe('health');
    expect(spans[0].attributes['journey.userId']).toBe('12345');
    expect(spans[0].attributes['journey.action']).toBe('recordMetric');
    
    // Verify exception is recorded
    const exceptionEvent = spans[0].events.find(event => event.name === 'exception');
    expect(exceptionEvent).toBeDefined();
  });

  it('should test error recovery with retry mechanism', async () => {
    // Arrange
    let attempts = 0;
    const maxAttempts = 3;
    
    // Act
    const result = await tracingService.createSpan('retry-span', async () => {
      return await retryOperation(maxAttempts);
    });
    
    // Helper function that simulates a retry mechanism
    async function retryOperation(maxRetries: number): Promise<string> {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        attempts++;
        try {
          if (attempt < maxRetries) {
            // Simulate failure on first attempts
            throw new TransientError(`Attempt ${attempt} failed`);
          }
          // Succeed on final attempt
          return 'Operation succeeded after retries';
        } catch (error) {
          // Record the retry in a child span
          await tracingService.createSpan(`retry-attempt-${attempt}`, async () => {
            const span = trace.getSpan(context.active());
            if (span) {
              span.setAttribute('retry.attempt', attempt);
              span.setAttribute('retry.max', maxRetries);
              span.recordException(error as Error);
              span.setStatus({ code: SpanStatusCode.ERROR });
            }
            // Don't rethrow on intermediate attempts
            return 'Retry recorded';
          });
          
          // Rethrow on final attempt
          if (attempt === maxRetries) {
            throw error;
          }
        }
      }
      return 'Should not reach here';
    }
    
    // Get exported spans
    const spans = memoryExporter.getFinishedSpans();
    
    // Assert
    expect(result).toBe('Operation succeeded after retries');
    expect(attempts).toBe(maxAttempts);
    
    // Should have 1 parent span + (maxAttempts-1) retry spans
    expect(spans.length).toBe(maxAttempts);
    
    // Parent span should be successful
    const parentSpan = spans.find(span => span.name === 'retry-span');
    expect(parentSpan).toBeDefined();
    expect(parentSpan?.status.code).toBe(SpanStatusCode.OK);
    
    // Retry spans should have error status
    const retrySpans = spans.filter(span => span.name.startsWith('retry-attempt-'));
    expect(retrySpans.length).toBe(maxAttempts - 1);
    
    retrySpans.forEach(span => {
      expect(span.status.code).toBe(SpanStatusCode.ERROR);
      expect(span.attributes['retry.attempt']).toBeDefined();
      expect(span.attributes['retry.max']).toBe(maxAttempts);
    });
  });
});