import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import * as opentelemetry from '@opentelemetry/api';

import { TracingService } from '../../src/tracing.service';
import { DEFAULT_SERVICE_NAME } from '../../src/constants/defaults';

// Mock the OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  // Create a mock span
  const mockSpan = {
    isRecording: jest.fn().mockReturnValue(true),
    setStatus: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
  };

  // Create a mock tracer
  const mockTracer = {
    startSpan: jest.fn().mockReturnValue(mockSpan),
  };

  // Create a mock trace API
  return {
    trace: {
      getTracer: jest.fn().mockReturnValue(mockTracer),
      setSpan: jest.fn().mockImplementation((context, span) => context),
      context: jest.fn().mockReturnValue({}),
      with: jest.fn().mockImplementation((context, fn) => fn()),
    },
    SpanStatusCode: {
      OK: 'OK',
      ERROR: 'ERROR',
    },
  };
});

describe('TracingService', () => {
  let service: TracingService;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let mockTracer: any;
  let mockSpan: any;

  beforeEach(async () => {
    // Create mock services
    const mockConfigService = {
      get: jest.fn().mockImplementation((key, defaultValue) => {
        if (key === 'service.name') return DEFAULT_SERVICE_NAME;
        return defaultValue;
      }),
    };

    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // Reset the OpenTelemetry mocks
    jest.clearAllMocks();
    mockTracer = opentelemetry.trace.getTracer();
    mockSpan = mockTracer.startSpan();

    // Create a test module with TracingService
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    // Get the service and mocked dependencies
    service = module.get<TracingService>(TracingService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should get the service name from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('service.name', 'austa-service');
    });

    it('should get a tracer with the service name', () => {
      expect(opentelemetry.trace.getTracer).toHaveBeenCalledWith(DEFAULT_SERVICE_NAME);
    });

    it('should log the initialization', () => {
      expect(loggerService.log).toHaveBeenCalledWith(
        `Initialized tracer for ${DEFAULT_SERVICE_NAME}`,
        'AustaTracing'
      );
    });
  });

  describe('createSpan', () => {
    it('should create a span with the given name', async () => {
      const spanName = 'test-span';
      const mockFunction = jest.fn().mockResolvedValue('result');

      await service.createSpan(spanName, mockFunction);

      expect(mockTracer.startSpan).toHaveBeenCalledWith(spanName);
      expect(mockFunction).toHaveBeenCalled();
    });

    it('should execute the function within the span context', async () => {
      const spanName = 'test-span';
      const mockFunction = jest.fn().mockResolvedValue('result');

      await service.createSpan(spanName, mockFunction);

      expect(opentelemetry.trace.with).toHaveBeenCalled();
      expect(opentelemetry.trace.setSpan).toHaveBeenCalledWith(
        expect.anything(),
        mockSpan
      );
      expect(mockFunction).toHaveBeenCalled();
    });

    it('should set the span status to OK on successful execution', async () => {
      const spanName = 'test-span';
      const mockFunction = jest.fn().mockResolvedValue('result');

      await service.createSpan(spanName, mockFunction);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetry.SpanStatusCode.OK,
      });
    });

    it('should return the result of the function', async () => {
      const spanName = 'test-span';
      const expectedResult = 'test-result';
      const mockFunction = jest.fn().mockResolvedValue(expectedResult);

      const result = await service.createSpan(spanName, mockFunction);

      expect(result).toBe(expectedResult);
    });

    it('should end the span after execution', async () => {
      const spanName = 'test-span';
      const mockFunction = jest.fn().mockResolvedValue('result');

      await service.createSpan(spanName, mockFunction);

      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle errors and set span status to ERROR', async () => {
      const spanName = 'test-span';
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);

      await expect(service.createSpan(spanName, mockFunction)).rejects.toThrow(testError);

      expect(mockSpan.recordException).toHaveBeenCalledWith(testError);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetry.SpanStatusCode.ERROR,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should log errors that occur during span execution', async () => {
      const spanName = 'test-span';
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);

      await expect(service.createSpan(spanName, mockFunction)).rejects.toThrow(testError);

      expect(loggerService.error).toHaveBeenCalledWith(
        `Error in span ${spanName}: ${testError.message}`,
        testError.stack,
        'AustaTracing'
      );
    });

    it('should rethrow errors after recording them', async () => {
      const spanName = 'test-span';
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);

      await expect(service.createSpan(spanName, mockFunction)).rejects.toThrow(testError);
    });

    it('should end the span even if an error occurs', async () => {
      const spanName = 'test-span';
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);

      await expect(service.createSpan(spanName, mockFunction)).rejects.toThrow(testError);

      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should check if span is recording before setting status', async () => {
      const spanName = 'test-span';
      const mockFunction = jest.fn().mockResolvedValue('result');

      // Mock span to not be recording
      mockSpan.isRecording.mockReturnValueOnce(false);

      await service.createSpan(spanName, mockFunction);

      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setStatus).not.toHaveBeenCalled();
    });

    it('should check if span is recording before recording exception', async () => {
      const spanName = 'test-span';
      const testError = new Error('Test error');
      const mockFunction = jest.fn().mockRejectedValue(testError);

      // Mock span to not be recording
      mockSpan.isRecording.mockReturnValueOnce(false);

      await expect(service.createSpan(spanName, mockFunction)).rejects.toThrow(testError);

      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.recordException).not.toHaveBeenCalled();
      expect(mockSpan.setStatus).not.toHaveBeenCalled();
    });
  });

  describe('integration with OpenTelemetry', () => {
    it('should use the OpenTelemetry trace API', () => {
      expect(opentelemetry.trace.getTracer).toHaveBeenCalled();
    });

    it('should use the OpenTelemetry context API', async () => {
      const spanName = 'test-span';
      const mockFunction = jest.fn().mockResolvedValue('result');

      await service.createSpan(spanName, mockFunction);

      expect(opentelemetry.trace.context).toHaveBeenCalled();
      expect(opentelemetry.trace.setSpan).toHaveBeenCalled();
      expect(opentelemetry.trace.with).toHaveBeenCalled();
    });

    it('should use the OpenTelemetry SpanStatusCode', async () => {
      const spanName = 'test-span';
      const mockFunction = jest.fn().mockResolvedValue('result');

      await service.createSpan(spanName, mockFunction);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetry.SpanStatusCode.OK,
      });
    });
  });
});