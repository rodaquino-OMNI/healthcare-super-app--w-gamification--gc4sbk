import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { TracingService } from '../../src/tracing.service';
import { Context, Span, SpanStatusCode, Tracer, trace } from '@opentelemetry/api';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  // Create mock span
  const mockSpan = {
    isRecording: jest.fn().mockReturnValue(true),
    setStatus: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
  };

  // Create mock tracer
  const mockTracer = {
    startSpan: jest.fn().mockReturnValue(mockSpan),
  };

  // Create mock context
  const mockContext = {};

  return {
    trace: {
      getTracer: jest.fn().mockReturnValue(mockTracer),
      setSpan: jest.fn().mockReturnValue(mockContext),
      context: jest.fn().mockReturnValue(mockContext),
      with: jest.fn().mockImplementation((context, fn) => fn()),
    },
    SpanStatusCode: {
      OK: 'OK',
      ERROR: 'ERROR',
    },
    Span: jest.fn(),
    Tracer: jest.fn(),
    Context: jest.fn(),
  };
});

describe('TracingService', () => {
  let service: TracingService;
  let configService: ConfigService;
  let logger: LoggerService;
  let mockTracer: jest.Mocked<Tracer>;
  let mockSpan: jest.Mocked<Span>;

  beforeEach(async () => {
    // Create mock config service
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'service.name') return 'test-service';
        return defaultValue;
      }),
    };

    // Create mock logger service
    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<TracingService>(TracingService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<LoggerService>(LoggerService);

    // Get the mocked OpenTelemetry objects
    mockTracer = trace.getTracer('') as unknown as jest.Mocked<Tracer>;
    mockSpan = mockTracer.startSpan('') as unknown as jest.Mocked<Span>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should get service name from config service', () => {
      expect(configService.get).toHaveBeenCalledWith('service.name', 'austa-service');
    });

    it('should create a tracer with the service name', () => {
      expect(trace.getTracer).toHaveBeenCalledWith('test-service');
    });

    it('should log initialization message', () => {
      expect(logger.log).toHaveBeenCalledWith(
        'Initialized tracer for test-service',
        'AustaTracing'
      );
    });

    it('should use default service name if not provided in config', () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);
      new TracingService(configService, logger);
      expect(trace.getTracer).toHaveBeenCalledWith('austa-service');
    });
  });

  describe('createSpan', () => {
    it('should create and start a span with the given name', async () => {
      const spanName = 'test-span';
      const mockFunction = jest.fn().mockResolvedValue('test-result');

      await service.createSpan(spanName, mockFunction);

      expect(mockTracer.startSpan).toHaveBeenCalledWith(spanName);
      expect(mockFunction).toHaveBeenCalled();
    });

    it('should execute the function within the span context', async () => {
      const mockFunction = jest.fn().mockResolvedValue('test-result');

      await service.createSpan('test-span', mockFunction);

      expect(trace.setSpan).toHaveBeenCalledWith(expect.anything(), mockSpan);
      expect(trace.with).toHaveBeenCalled();
      expect(mockFunction).toHaveBeenCalled();
    });

    it('should set span status to OK on successful execution', async () => {
      const mockFunction = jest.fn().mockResolvedValue('test-result');

      await service.createSpan('test-span', mockFunction);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
    });

    it('should end the span after successful execution', async () => {
      const mockFunction = jest.fn().mockResolvedValue('test-result');

      await service.createSpan('test-span', mockFunction);

      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should return the result of the function execution', async () => {
      const mockFunction = jest.fn().mockResolvedValue('test-result');

      const result = await service.createSpan('test-span', mockFunction);

      expect(result).toBe('test-result');
    });

    it('should record exception and set span status to ERROR when function throws', async () => {
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);

      await expect(service.createSpan('test-span', mockFunction)).rejects.toThrow(testError);

      expect(mockSpan.recordException).toHaveBeenCalledWith(testError);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
    });

    it('should log error when function throws', async () => {
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);

      await expect(service.createSpan('test-span', mockFunction)).rejects.toThrow(testError);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in span test-span: Test error',
        testError.stack,
        'AustaTracing'
      );
    });

    it('should end the span even when function throws', async () => {
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);

      await expect(service.createSpan('test-span', mockFunction)).rejects.toThrow(testError);

      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should not set span status if span is not recording', async () => {
      const mockFunction = jest.fn().mockResolvedValue('test-result');
      mockSpan.isRecording.mockReturnValue(false);

      await service.createSpan('test-span', mockFunction);

      expect(mockSpan.setStatus).not.toHaveBeenCalled();
    });

    it('should not record exception if span is not recording', async () => {
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);
      mockSpan.isRecording.mockReturnValue(false);

      await expect(service.createSpan('test-span', mockFunction)).rejects.toThrow(testError);

      expect(mockSpan.recordException).not.toHaveBeenCalled();
      expect(mockSpan.setStatus).not.toHaveBeenCalled();
    });

    it('should handle nested spans correctly', async () => {
      const outerMockFunction = jest.fn().mockImplementation(async () => {
        return await service.createSpan('inner-span', () => Promise.resolve('inner-result'));
      });

      const result = await service.createSpan('outer-span', outerMockFunction);

      expect(mockTracer.startSpan).toHaveBeenCalledWith('outer-span');
      expect(mockTracer.startSpan).toHaveBeenCalledWith('inner-span');
      expect(result).toBe('inner-result');
    });
  });
});