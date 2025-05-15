import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { Tracer, trace, SpanStatusCode, SpanKind, Context } from '@opentelemetry/api';
import { TracingService } from '../../src/tracing.service';
import { JourneyContext } from '../../src/interfaces/journey-context.interface';
import { CONFIG_KEYS, DEFAULT_VALUES } from '../../src/constants';
import * as correlationUtils from '../../src/utils/correlation';
import * as spanAttributeUtils from '../../src/utils/span-attributes';
import * as contextPropagationUtils from '../../src/utils/context-propagation';

// Mock implementations
class MockConfigService {
  get(key: string, defaultValue?: any) {
    if (key === CONFIG_KEYS.SERVICE_NAME) return 'test-service';
    if (key === CONFIG_KEYS.SERVICE_VERSION) return '1.0.0';
    return defaultValue;
  }
}

class MockLoggerService implements LoggerService {
  logs: any[] = [];
  errors: any[] = [];
  warnings: any[] = [];
  debugs: any[] = [];

  log(message: any, context?: string, ...optionalParams: any[]) {
    this.logs.push({ message, context, optionalParams });
  }

  error(message: any, trace?: string, context?: string, ...optionalParams: any[]) {
    this.errors.push({ message, trace, context, optionalParams });
  }

  warn(message: any, context?: string, ...optionalParams: any[]) {
    this.warnings.push({ message, context, optionalParams });
  }

  debug(message: any, context?: string, ...optionalParams: any[]) {
    this.debugs.push({ message, context, optionalParams });
  }

  verbose(message: any, context?: string, ...optionalParams: any[]) {}
}

class MockSpan {
  private _recording = true;
  private _attributes: Record<string, any> = {};
  private _events: any[] = [];
  private _status: { code: SpanStatusCode; message?: string } = { code: SpanStatusCode.UNSET };
  private _exceptions: any[] = [];

  constructor(public name: string, public options?: any) {}

  setAttribute(key: string, value: any) {
    this._attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Record<string, any>) {
    Object.assign(this._attributes, attributes);
    return this;
  }

  addEvent(name: string, attributes?: Record<string, any>) {
    this._events.push({ name, attributes });
    return this;
  }

  setStatus(status: { code: SpanStatusCode; message?: string }) {
    this._status = status;
    return this;
  }

  recordException(exception: any) {
    this._exceptions.push(exception);
    return this;
  }

  end() {
    this._recording = false;
  }

  isRecording() {
    return this._recording;
  }

  // Helper methods for testing
  getAttributes() {
    return this._attributes;
  }

  getEvents() {
    return this._events;
  }

  getStatus() {
    return this._status;
  }

  getExceptions() {
    return this._exceptions;
  }
}

class MockTracer implements Partial<Tracer> {
  spans: MockSpan[] = [];

  startSpan(name: string, options?: any): MockSpan {
    const span = new MockSpan(name, options);
    this.spans.push(span);
    return span;
  }

  // Helper method for testing
  getSpans() {
    return this.spans;
  }
}

// Mock the OpenTelemetry trace API
jest.mock('@opentelemetry/api', () => {
  const originalModule = jest.requireActual('@opentelemetry/api');
  const mockTracer = new MockTracer();
  const mockContext = {};
  
  return {
    ...originalModule,
    SpanStatusCode: {
      UNSET: 'UNSET',
      OK: 'OK',
      ERROR: 'ERROR'
    },
    SpanKind: {
      INTERNAL: 'INTERNAL',
      SERVER: 'SERVER',
      CLIENT: 'CLIENT',
      PRODUCER: 'PRODUCER',
      CONSUMER: 'CONSUMER'
    },
    trace: {
      getTracer: jest.fn().mockReturnValue(mockTracer),
      setSpan: jest.fn().mockReturnValue(mockContext),
      getSpan: jest.fn(),
      context: jest.fn().mockReturnValue(mockContext),
      with: jest.fn().mockImplementation((context, fn) => fn())
    },
    _mockTracer: mockTracer,
    _mockReset: () => {
      mockTracer.spans = [];
    }
  };
});

// Mock utility functions
jest.mock('../../src/utils/correlation', () => ({
  getOrCreateCorrelationId: jest.fn().mockReturnValue('test-correlation-id'),
  getTraceInfoForLogs: jest.fn().mockReturnValue({ traceId: 'test-trace-id', spanId: 'test-span-id' }),
  getCurrentTraceInfo: jest.fn().mockReturnValue({ traceId: 'test-trace-id', spanId: 'test-span-id' })
}));

jest.mock('../../src/utils/span-attributes', () => ({
  addErrorAttributes: jest.fn(),
  addJourneyErrorContext: jest.fn(),
  addJourneyAttributes: jest.fn(),
  createJourneyAttributes: jest.fn().mockReturnValue({ journey: 'test-journey', operation: 'test-operation' })
}));

jest.mock('../../src/utils/context-propagation', () => ({
  extractContextForPropagation: jest.fn().mockReturnValue({ 'traceparent': 'test-traceparent' }),
  injectContextIntoHeaders: jest.fn().mockImplementation(headers => ({ ...headers, 'traceparent': 'test-traceparent' })),
  extractContextFromHeaders: jest.fn().mockReturnValue({})
}));

describe('TracingService', () => {
  let service: TracingService;
  let configService: ConfigService;
  let loggerService: MockLoggerService;
  let mockTracer: MockTracer;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (trace as any)._mockReset?.();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        { provide: ConfigService, useClass: MockConfigService },
        { provide: LoggerService, useClass: MockLoggerService }
      ],
    }).compile();

    service = module.get<TracingService>(TracingService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get(LoggerService) as MockLoggerService;
    mockTracer = (trace as any)._mockTracer;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize tracer with service name from config', () => {
    // Verify that the tracer was initialized with the correct service name
    expect(trace.getTracer).toHaveBeenCalledWith('test-service', '1.0.0');
    expect(loggerService.logs[0].message).toContain('Initialized tracer for test-service');
    expect(loggerService.logs[0].context).toBe(DEFAULT_VALUES.LOGGER_CONTEXT);
  });

  describe('createSpan', () => {
    it('should create and complete a span successfully', async () => {
      const result = await service.createSpan('test-span', async () => 'success');

      // Verify result
      expect(result).toBe('success');

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('test-span');
      
      // Verify span attributes
      expect(spans[0].getAttributes()['correlation.id']).toBe('test-correlation-id');
      
      // Verify span status
      expect(spans[0].getStatus().code).toBe(SpanStatusCode.OK);
      
      // Verify span is ended
      expect(spans[0].isRecording()).toBe(false);
    });

    it('should handle errors within a span', async () => {
      const testError = new Error('Test error');
      
      await expect(service.createSpan('error-span', async () => {
        throw testError;
      })).rejects.toThrow('Test error');

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('error-span');
      
      // Verify error handling
      expect(spans[0].getStatus().code).toBe(SpanStatusCode.ERROR);
      expect(spans[0].getStatus().message).toBe('Test error');
      expect(spans[0].getExceptions()[0]).toBe(testError);
      
      // Verify error logging
      expect(loggerService.errors.length).toBe(1);
      expect(loggerService.errors[0].message).toContain('Error in span error-span: Test error');
      expect(loggerService.errors[0].context).toBe(DEFAULT_VALUES.LOGGER_CONTEXT);
      
      // Verify span is ended despite error
      expect(spans[0].isRecording()).toBe(false);
    });

    it('should add journey context to span when provided', async () => {
      const journeyContext: JourneyContext = {
        userId: 'test-user',
        requestId: 'test-request',
        journeyId: 'test-journey'
      };

      await service.createSpan('journey-span', async () => 'success', { journeyContext });

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      
      // Verify journey context attributes
      expect(spanAttributeUtils.addJourneyAttributes).toHaveBeenCalledWith(
        spans[0],
        journeyContext
      );
      expect(spans[0].getAttributes()['user.id']).toBe('test-user');
      expect(spans[0].getAttributes()['request.id']).toBe('test-request');
    });

    it('should support custom span attributes', async () => {
      const customAttributes = {
        'custom.attribute1': 'value1',
        'custom.attribute2': 'value2'
      };

      await service.createSpan('custom-span', async () => 'success', { attributes: customAttributes });

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      
      // Verify custom attributes
      expect(spans[0].getAttributes()['custom.attribute1']).toBe('value1');
      expect(spans[0].getAttributes()['custom.attribute2']).toBe('value2');
    });

    it('should support custom span kind', async () => {
      await service.createSpan('kind-span', async () => 'success', { kind: SpanKind.SERVER });

      // Verify span creation with correct kind
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].options.kind).toBe(SpanKind.SERVER);
    });
  });

  describe('createJourneySpan', () => {
    it('should create a span with journey-specific attributes', async () => {
      const journeyContext: JourneyContext = {
        userId: 'test-user',
        requestId: 'test-request',
        journeyId: 'health-journey'
      };

      await service.createJourneySpan('health', 'viewMetrics', async () => 'success', journeyContext);

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('health.viewMetrics');
      
      // Verify journey attributes
      expect(spanAttributeUtils.createJourneyAttributes).toHaveBeenCalledWith('health', 'viewMetrics');
      
      // Verify journey context
      expect(spanAttributeUtils.addJourneyAttributes).toHaveBeenCalledWith(spans[0], journeyContext);
    });
  });

  describe('createHttpSpan', () => {
    it('should create a span with HTTP-specific attributes', async () => {
      await service.createHttpSpan('GET', 'https://api.example.com/data', async () => 'success');

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('HTTP GET');
      
      // Verify HTTP attributes
      expect(spans[0].getAttributes()['http.method']).toBe('GET');
      expect(spans[0].getAttributes()['http.url']).toBe('https://api.example.com/data');
      
      // Verify span kind
      expect(spans[0].options.kind).toBe(SpanKind.CLIENT);
    });

    it('should support additional custom attributes for HTTP spans', async () => {
      const customAttributes = { 'http.status_code': 200 };
      
      await service.createHttpSpan(
        'POST',
        'https://api.example.com/data',
        async () => 'success',
        { attributes: customAttributes }
      );

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      
      // Verify combined attributes
      expect(spans[0].getAttributes()['http.method']).toBe('POST');
      expect(spans[0].getAttributes()['http.url']).toBe('https://api.example.com/data');
      expect(spans[0].getAttributes()['http.status_code']).toBe(200);
    });
  });

  describe('createDatabaseSpan', () => {
    it('should create a span with database-specific attributes', async () => {
      await service.createDatabaseSpan('query', 'users', async () => 'success');

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('DB query users');
      
      // Verify database attributes
      expect(spans[0].getAttributes()['db.operation']).toBe('query');
      expect(spans[0].getAttributes()['db.entity']).toBe('users');
      
      // Verify span kind
      expect(spans[0].options.kind).toBe(SpanKind.CLIENT);
    });

    it('should support additional custom attributes for database spans', async () => {
      const customAttributes = { 'db.statement': 'SELECT * FROM users' };
      
      await service.createDatabaseSpan(
        'query',
        'users',
        async () => 'success',
        { attributes: customAttributes }
      );

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      
      // Verify combined attributes
      expect(spans[0].getAttributes()['db.operation']).toBe('query');
      expect(spans[0].getAttributes()['db.entity']).toBe('users');
      expect(spans[0].getAttributes()['db.statement']).toBe('SELECT * FROM users');
    });
  });

  describe('context propagation', () => {
    it('should extract trace context for propagation', () => {
      const context = service.getTraceContextForPropagation();
      
      expect(contextPropagationUtils.extractContextForPropagation).toHaveBeenCalled();
      expect(context).toEqual({ 'traceparent': 'test-traceparent' });
    });

    it('should inject trace context into headers', () => {
      const headers = { 'content-type': 'application/json' };
      const result = service.injectTraceContextIntoHeaders(headers);
      
      expect(contextPropagationUtils.injectContextIntoHeaders).toHaveBeenCalledWith(headers);
      expect(result).toEqual({
        'content-type': 'application/json',
        'traceparent': 'test-traceparent'
      });
    });

    it('should extract trace context from headers', () => {
      const headers = { 'traceparent': 'test-traceparent' };
      const result = service.extractTraceContextFromHeaders(headers);
      
      expect(contextPropagationUtils.extractContextFromHeaders).toHaveBeenCalledWith(headers);
      expect(result).toEqual({});
    });

    it('should get current trace info', () => {
      const traceInfo = service.getCurrentTraceInfo();
      
      expect(correlationUtils.getCurrentTraceInfo).toHaveBeenCalled();
      expect(traceInfo).toEqual({ traceId: 'test-trace-id', spanId: 'test-span-id' });
    });
  });

  describe('error handling with journey context', () => {
    it('should add journey-specific error context when an error occurs', async () => {
      const journeyContext: JourneyContext = {
        userId: 'test-user',
        requestId: 'test-request',
        journeyId: 'health-journey'
      };
      const testError = new Error('Journey error');
      
      await expect(service.createSpan('journey-error-span', async () => {
        throw testError;
      }, { journeyContext })).rejects.toThrow('Journey error');

      // Verify span creation
      const spans = mockTracer.getSpans();
      expect(spans.length).toBe(1);
      
      // Verify error handling with journey context
      expect(spanAttributeUtils.addErrorAttributes).toHaveBeenCalledWith(spans[0], testError);
      expect(spanAttributeUtils.addJourneyErrorContext).toHaveBeenCalledWith(
        spans[0],
        testError,
        journeyContext
      );
    });
  });
});