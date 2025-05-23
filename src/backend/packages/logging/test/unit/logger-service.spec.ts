import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { TracingService } from '@austa/tracing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Mock formatters and transports
const mockJsonFormatter = {
  format: jest.fn().mockImplementation((level, message, meta) => {
    return JSON.stringify({ level, message, ...meta });
  }),
};

const mockConsoleTransport = {
  log: jest.fn(),
};

const mockCloudWatchTransport = {
  log: jest.fn(),
};

// Mock NestJS Logger
jest.mock('@nestjs/common', () => {
  const originalModule = jest.requireActual('@nestjs/common');
  return {
    ...originalModule,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    })),
  };
});

// Mock formatters module
jest.mock('../../src/formatters', () => ({
  JsonFormatter: jest.fn().mockImplementation(() => mockJsonFormatter),
}));

// Mock transports module
jest.mock('../../src/transports', () => ({
  ConsoleTransport: jest.fn().mockImplementation(() => mockConsoleTransport),
  CloudWatchTransport: jest.fn().mockImplementation(() => mockCloudWatchTransport),
}));

// Mock ConfigService
const mockConfigService = {
  get: jest.fn().mockImplementation((key) => {
    const config = {
      'logging.level': 'info',
      'logging.format': 'json',
      'logging.transports': ['console', 'cloudwatch'],
      'logging.cloudwatch.logGroupName': 'austa-logs',
      'logging.cloudwatch.logStreamName': 'austa-service',
      'app.name': 'test-service',
    };
    return config[key];
  }),
};

describe('LoggerService', () => {
  let service: LoggerService;
  let tracingService: TracingService;
  let nestLogger: any;

  // Mock context data
  const mockContext = { requestId: 'req-123', userId: 'user-456', journey: 'health' };
  const mockTraceContext = { traceId: 'mock-trace-id', spanId: 'mock-span-id' };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: TracingService,
          useValue: {
            getCurrentSpan: jest.fn().mockReturnValue({
              context: () => ({
                traceId: mockTraceContext.traceId,
                spanId: mockTraceContext.spanId,
              }),
            }),
            getTraceId: jest.fn().mockReturnValue(mockTraceContext.traceId),
            getSpanId: jest.fn().mockReturnValue(mockTraceContext.spanId),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    tracingService = module.get<TracingService>(TracingService);
    
    // Get the mocked Logger instance
    nestLogger = (service as any).logger;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log methods', () => {
    it('should call logger.log with the correct parameters', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      service.log(message, context);
      
      expect(nestLogger.log).toHaveBeenCalledWith(message, context);
    });

    it('should call logger.error with the correct parameters', () => {
      const message = 'Test error message';
      const trace = new Error('Test error');
      const context = { requestId: 'req-123' };
      
      service.error(message, trace, context);
      
      expect(nestLogger.error).toHaveBeenCalledWith(message, trace, context);
    });

    it('should call logger.warn with the correct parameters', () => {
      const message = 'Test warn message';
      const context = { requestId: 'req-123' };
      
      service.warn(message, context);
      
      expect(nestLogger.warn).toHaveBeenCalledWith(message, context);
    });

    it('should call logger.debug with the correct parameters', () => {
      const message = 'Test debug message';
      const context = { requestId: 'req-123' };
      
      service.debug(message, context);
      
      expect(nestLogger.debug).toHaveBeenCalledWith(message, context);
    });

    it('should call logger.verbose with the correct parameters', () => {
      const message = 'Test verbose message';
      const context = { requestId: 'req-123' };
      
      service.verbose(message, context);
      
      expect(nestLogger.verbose).toHaveBeenCalledWith(message, context);
    });
  });

  describe('trace correlation', () => {
    it('should enrich log context with trace information', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      // Mock the enrichContext method to verify it's called with the right parameters
      const enrichContextSpy = jest.spyOn(service as any, 'enrichContext');
      
      service.log(message, context);
      
      expect(enrichContextSpy).toHaveBeenCalledWith(context);
      expect(tracingService.getTraceId).toHaveBeenCalled();
      expect(tracingService.getSpanId).toHaveBeenCalled();
    });
    
    it('should add trace and span IDs to the log context', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      service.log(message, context);
      
      // The enriched context should include trace and span IDs
      const expectedContext = {
        ...context,
        traceId: mockTraceContext.traceId,
        spanId: mockTraceContext.spanId,
      };
      
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining(expectedContext));
    });
  });
  
  describe('context enrichment', () => {
    it('should enrich context with request ID if available', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      service.log(message, context);
      
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        requestId: 'req-123',
      }));
    });
    
    it('should enrich context with user ID if available', () => {
      const message = 'Test log message';
      const context = { userId: 'user-456' };
      
      service.log(message, context);
      
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        userId: 'user-456',
      }));
    });
    
    it('should enrich context with journey information if available', () => {
      const message = 'Test log message';
      const context = { journey: 'health' };
      
      service.log(message, context);
      
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        journey: 'health',
      }));
    });
    
    it('should handle undefined context gracefully', () => {
      const message = 'Test log message';
      
      service.log(message);
      
      // Should still call log with trace context
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        traceId: mockTraceContext.traceId,
        spanId: mockTraceContext.spanId,
      }));
    });
  });

  describe('structured JSON logging', () => {
    it('should format logs as structured JSON', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      // Mock the formatLog method to verify it's called with the right parameters
      const formatLogSpy = jest.spyOn(service as any, 'formatLog');
      
      service.log(message, context);
      
      expect(formatLogSpy).toHaveBeenCalledWith('info', message, expect.objectContaining(context));
      expect(mockJsonFormatter.format).toHaveBeenCalled();
    });
    
    it('should include all required fields in the structured log', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123', userId: 'user-456', journey: 'health' };
      
      service.log(message, context);
      
      // Verify the JSON formatter was called with all required fields
      expect(mockJsonFormatter.format).toHaveBeenCalledWith(
        'info',
        message,
        expect.objectContaining({
          requestId: 'req-123',
          userId: 'user-456',
          journey: 'health',
          traceId: mockTraceContext.traceId,
          spanId: mockTraceContext.spanId,
          timestamp: expect.any(String),
          service: expect.any(String),
        })
      );
    });
    
    it('should send logs to configured transports', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      service.log(message, context);
      
      // Verify logs are sent to both console and CloudWatch transports
      expect(mockConsoleTransport.log).toHaveBeenCalled();
      expect(mockCloudWatchTransport.log).toHaveBeenCalled();
    });
  });
  
  describe('journey-specific context', () => {
    it('should add health journey-specific context', () => {
      const message = 'Test log message';
      const context = { journey: 'health', metricId: 'heart-rate' };
      
      service.log(message, context);
      
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        journey: 'health',
        metricId: 'heart-rate',
        journeyContext: expect.objectContaining({
          journey: 'health',
        }),
      }));
    });
    
    it('should add care journey-specific context', () => {
      const message = 'Test log message';
      const context = { journey: 'care', appointmentId: 'apt-123' };
      
      service.log(message, context);
      
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        journey: 'care',
        appointmentId: 'apt-123',
        journeyContext: expect.objectContaining({
          journey: 'care',
        }),
      }));
    });
    
    it('should add plan journey-specific context', () => {
      const message = 'Test log message';
      const context = { journey: 'plan', claimId: 'claim-123' };
      
      service.log(message, context);
      
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        journey: 'plan',
        claimId: 'claim-123',
        journeyContext: expect.objectContaining({
          journey: 'plan',
        }),
      }));
    });
  });

  describe('error handling', () => {
    it('should handle errors during context enrichment', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      // Mock enrichContext to throw an error
      jest.spyOn(service as any, 'enrichContext').mockImplementation(() => {
        throw new Error('Context enrichment error');
      });
      
      // Should not throw when calling log
      expect(() => service.log(message, context)).not.toThrow();
      
      // Should still log the message with original context
      expect(nestLogger.log).toHaveBeenCalledWith(message, context);
    });
    
    it('should handle errors during log formatting', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      // Mock formatLog to throw an error
      jest.spyOn(service as any, 'formatLog').mockImplementation(() => {
        throw new Error('Formatting error');
      });
      
      // Should not throw when calling log
      expect(() => service.log(message, context)).not.toThrow();
      
      // Should still log the message with original context
      expect(nestLogger.log).toHaveBeenCalledWith(message, context);
    });
    
    it('should handle transport failures gracefully', () => {
      const message = 'Test log message';
      const context = { requestId: 'req-123' };
      
      // Mock transport to throw an error
      mockConsoleTransport.log.mockImplementation(() => {
        throw new Error('Transport error');
      });
      
      // Should not throw when calling log
      expect(() => service.log(message, context)).not.toThrow();
      
      // Should still log the message with original context
      expect(nestLogger.log).toHaveBeenCalledWith(message, context);
    });
    
    it('should handle circular references in context objects', () => {
      const message = 'Test log message';
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj; // Create circular reference
      
      // Should not throw when calling log with circular reference
      expect(() => service.log(message, circularObj)).not.toThrow();
      
      // Should still log the message
      expect(nestLogger.log).toHaveBeenCalled();
    });
  });
  
  describe('edge cases', () => {
    it('should handle null or undefined messages', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      service.log(null);
      // @ts-ignore - Testing runtime behavior with invalid input
      service.log(undefined);
      
      // Should convert null/undefined to strings
      expect(nestLogger.log).toHaveBeenCalledWith('null', expect.any(Object));
      expect(nestLogger.log).toHaveBeenCalledWith('undefined', expect.any(Object));
    });
    
    it('should handle non-object contexts', () => {
      const message = 'Test log message';
      
      // @ts-ignore - Testing runtime behavior with invalid input
      service.log(message, 'string-context');
      // @ts-ignore - Testing runtime behavior with invalid input
      service.log(message, 123);
      
      // Should convert non-object contexts to objects
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        originalContext: 'string-context',
      }));
      expect(nestLogger.log).toHaveBeenCalledWith(message, expect.objectContaining({
        originalContext: 123,
      }));
    });
    
    it('should handle very large context objects', () => {
      const message = 'Test log message';
      const largeContext = { data: 'x'.repeat(10000) }; // Very large string
      
      // Should not throw when calling log with large context
      expect(() => service.log(message, largeContext)).not.toThrow();
      
      // Should still log the message
      expect(nestLogger.log).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should initialize with the correct log level from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('logging.level');
      expect((service as any).logLevel).toBe('info');
    });
    
    it('should initialize with the correct formatter from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('logging.format');
      expect((service as any).formatter).toBe(mockJsonFormatter);
    });
    
    it('should initialize with the correct transports from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('logging.transports');
      expect((service as any).transports).toContain(mockConsoleTransport);
      expect((service as any).transports).toContain(mockCloudWatchTransport);
    });
    
    it('should use the application name from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('app.name');
      expect((service as any).serviceName).toBe('test-service');
    });
    
    it('should handle missing configuration gracefully', () => {
      // Mock ConfigService to return undefined for some keys
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'logging.level') return undefined;
        if (key === 'app.name') return undefined;
        
        const config = {
          'logging.format': 'json',
          'logging.transports': ['console'],
        };
        return config[key];
      });
      
      // Create a new instance of LoggerService with the updated mock
      const newService = new LoggerService(mockConfigService as any, tracingService as any);
      
      // Should use default values for missing config
      expect((newService as any).logLevel).toBe('info'); // Default level
      expect((newService as any).serviceName).toBe('austa-service'); // Default name
    });
  });
});