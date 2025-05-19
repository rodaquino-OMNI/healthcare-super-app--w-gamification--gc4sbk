import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { TracingService } from '@austa/tracing';
import { MockTracingService } from '../mocks/tracing.service.mock';
import { MockFormatter } from '../mocks/formatter.mock';
import { MockTransport } from '../mocks/transport.mock';
import { MockConfigService } from '../mocks/config.service.mock';
import { ConfigService } from '@nestjs/config';
import { LogLevel } from '@nestjs/common';

describe('LoggerService', () => {
  let service: LoggerService;
  let tracingService: MockTracingService;
  let mockFormatter: MockFormatter;
  let mockTransport: MockTransport;
  let mockConfigService: MockConfigService;

  beforeEach(async () => {
    tracingService = new MockTracingService();
    mockFormatter = new MockFormatter();
    mockTransport = new MockTransport();
    mockConfigService = new MockConfigService();

    // Configure mock formatter to return structured JSON
    mockFormatter.format.mockImplementation((level, message, context) => {
      return JSON.stringify({
        level,
        message,
        context,
        timestamp: expect.any(String),
      });
    });

    // Configure mock config service with default values
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'logging.level': 'debug',
        'logging.format': 'json',
        'logging.transports': ['console'],
        'app.name': 'test-service',
      };
      return config[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        { provide: TracingService, useValue: tracingService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'FORMATTER', useValue: mockFormatter },
        { provide: 'TRANSPORT', useValue: mockTransport },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    tracingService.reset();
    mockFormatter.format.mockClear();
    mockTransport.write.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log methods', () => {
    it('should call log method with INFO level', () => {
      const message = 'Test info message';
      const context = { requestId: '123' };
      
      service.log(message, context);
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        message,
        expect.objectContaining(context)
      );
      expect(mockTransport.write).toHaveBeenCalled();
    });

    it('should call error method with ERROR level', () => {
      const message = 'Test error message';
      const trace = new Error('Test error');
      const context = { requestId: '123' };
      
      service.error(message, trace, context);
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'ERROR',
        message,
        expect.objectContaining({
          ...context,
          trace: expect.any(String),
        })
      );
      expect(mockTransport.write).toHaveBeenCalled();
    });

    it('should call warn method with WARN level', () => {
      const message = 'Test warn message';
      const context = { requestId: '123' };
      
      service.warn(message, context);
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'WARN',
        message,
        expect.objectContaining(context)
      );
      expect(mockTransport.write).toHaveBeenCalled();
    });

    it('should call debug method with DEBUG level', () => {
      const message = 'Test debug message';
      const context = { requestId: '123' };
      
      service.debug(message, context);
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'DEBUG',
        message,
        expect.objectContaining(context)
      );
      expect(mockTransport.write).toHaveBeenCalled();
    });

    it('should call verbose method with VERBOSE level', () => {
      const message = 'Test verbose message';
      const context = { requestId: '123' };
      
      service.verbose(message, context);
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'VERBOSE',
        message,
        expect.objectContaining(context)
      );
      expect(mockTransport.write).toHaveBeenCalled();
    });

    it('should not log messages below configured log level', () => {
      // Configure log level to INFO
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'logging.level': 'info',
          'logging.format': 'json',
          'logging.transports': ['console'],
          'app.name': 'test-service',
        };
        return config[key];
      });

      // Re-initialize service with new config
      service.onModuleInit();

      // This should be logged (INFO level)
      service.log('Info message');
      // This should be logged (ERROR level > INFO)
      service.error('Error message');
      // This should be logged (WARN level > INFO)
      service.warn('Warn message');
      // This should NOT be logged (DEBUG level < INFO)
      service.debug('Debug message');
      // This should NOT be logged (VERBOSE level < INFO)
      service.verbose('Verbose message');

      // Verify only INFO, ERROR, and WARN were logged
      expect(mockFormatter.format).toHaveBeenCalledTimes(3);
      expect(mockFormatter.format).toHaveBeenCalledWith('INFO', 'Info message', expect.any(Object));
      expect(mockFormatter.format).toHaveBeenCalledWith('ERROR', 'Error message', expect.any(Object));
      expect(mockFormatter.format).toHaveBeenCalledWith('WARN', 'Warn message', expect.any(Object));
    });
  });

  describe('context enrichment', () => {
    it('should enrich logs with request context', () => {
      const requestContext = {
        requestId: 'req-123',
        userId: 'user-456',
        ip: '127.0.0.1',
      };

      // Set request context
      service.setRequestContext(requestContext);
      
      // Log a message
      service.log('Test message with request context');
      
      // Verify context was included
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Test message with request context',
        expect.objectContaining(requestContext)
      );
    });

    it('should enrich logs with user context', () => {
      const userContext = {
        userId: 'user-456',
        email: 'user@example.com',
        roles: ['user', 'admin'],
      };

      // Set user context
      service.setUserContext(userContext);
      
      // Log a message
      service.log('Test message with user context');
      
      // Verify context was included
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Test message with user context',
        expect.objectContaining({ user: userContext })
      );
    });

    it('should enrich logs with journey context', () => {
      const journeyContext = {
        journeyId: 'journey-789',
        journeyType: 'health',
        step: 'metrics-input',
      };

      // Set journey context
      service.setJourneyContext(journeyContext);
      
      // Log a message
      service.log('Test message with journey context');
      
      // Verify context was included
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Test message with journey context',
        expect.objectContaining({ journey: journeyContext })
      );
    });

    it('should combine multiple contexts in logs', () => {
      const requestContext = { requestId: 'req-123', ip: '127.0.0.1' };
      const userContext = { userId: 'user-456', roles: ['user'] };
      const journeyContext = { journeyId: 'journey-789', journeyType: 'health' };

      // Set all contexts
      service.setRequestContext(requestContext);
      service.setUserContext(userContext);
      service.setJourneyContext(journeyContext);
      
      // Log a message
      service.log('Test message with all contexts');
      
      // Verify all contexts were included
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Test message with all contexts',
        expect.objectContaining({
          ...requestContext,
          user: userContext,
          journey: journeyContext,
        })
      );
    });

    it('should allow context to be passed directly to log methods', () => {
      const directContext = { transactionId: 'tx-123', source: 'payment-service' };
      
      // Log with direct context
      service.log('Test message with direct context', directContext);
      
      // Verify direct context was included
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Test message with direct context',
        expect.objectContaining(directContext)
      );
    });

    it('should merge direct context with stored contexts', () => {
      const requestContext = { requestId: 'req-123' };
      const directContext = { transactionId: 'tx-123' };

      // Set request context
      service.setRequestContext(requestContext);
      
      // Log with direct context
      service.log('Test message with merged contexts', directContext);
      
      // Verify contexts were merged
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Test message with merged contexts',
        expect.objectContaining({
          ...requestContext,
          ...directContext,
        })
      );
    });
  });

  describe('trace correlation', () => {
    it('should create a span for each log operation', () => {
      service.log('Test message with span');
      
      expect(tracingService.createSpan).toHaveBeenCalledWith(
        'log.info',
        expect.any(Function)
      );
    });

    it('should include trace context in log entries', () => {
      // Configure tracing service to return trace context
      const traceContext = {
        traceId: 'trace-123',
        spanId: 'span-456',
      };
      
      tracingService.getTraceContext.mockReturnValue(traceContext);
      
      // Log a message
      service.log('Test message with trace context');
      
      // Verify trace context was included
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Test message with trace context',
        expect.objectContaining({
          trace: traceContext,
        })
      );
    });

    it('should handle errors in span creation', () => {
      // Configure tracing service to throw an error
      tracingService.createSpan.mockImplementation(() => {
        throw new Error('Tracing error');
      });
      
      // Log should not throw even if tracing fails
      expect(() => service.log('Test message with tracing error')).not.toThrow();
      
      // Log should still be written
      expect(mockTransport.write).toHaveBeenCalled();
    });

    it('should add error details to span for error logs', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at TestFunction';
      
      service.error('Error message', error);
      
      expect(tracingService.createSpan).toHaveBeenCalledWith(
        'log.error',
        expect.any(Function)
      );
      
      // Verify span was annotated with error details
      const spanCallback = tracingService.createSpan.mock.calls[0][1];
      const mockSpan = { setAttributes: jest.fn(), recordException: jest.fn() };
      spanCallback(mockSpan);
      
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'log.level': 'ERROR',
        'log.message': 'Error message',
      });
    });
  });

  describe('structured JSON format', () => {
    it('should use JSON formatter when configured', () => {
      // Already configured in beforeEach
      
      service.log('Test JSON formatted message');
      
      // Verify formatter was called
      expect(mockFormatter.format).toHaveBeenCalled();
      // Verify transport received formatted output
      expect(mockTransport.write).toHaveBeenCalled();
    });

    it('should include standard fields in JSON output', () => {
      const standardFields = {
        timestamp: expect.any(String),
        level: 'INFO',
        message: 'Test standard fields',
        service: 'test-service',
      };
      
      // Configure formatter to verify fields
      mockFormatter.format.mockImplementation((level, message, context) => {
        const output = {
          timestamp: new Date().toISOString(),
          level,
          message,
          service: context.service,
          ...context,
        };
        return JSON.stringify(output);
      });
      
      service.log('Test standard fields');
      
      // Extract the context argument passed to formatter
      const formatterContext = mockFormatter.format.mock.calls[0][2];
      
      // Verify standard fields
      expect(formatterContext).toMatchObject({
        service: 'test-service',
      });
    });
  });

  describe('journey-specific context', () => {
    it('should handle health journey context', () => {
      const healthJourneyContext = {
        journeyType: 'health',
        metricId: 'blood-pressure',
        deviceId: 'device-123',
      };

      service.setJourneyContext(healthJourneyContext);
      service.log('Health journey log');
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Health journey log',
        expect.objectContaining({
          journey: healthJourneyContext,
        })
      );
    });

    it('should handle care journey context', () => {
      const careJourneyContext = {
        journeyType: 'care',
        appointmentId: 'appt-123',
        providerId: 'provider-456',
      };

      service.setJourneyContext(careJourneyContext);
      service.log('Care journey log');
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Care journey log',
        expect.objectContaining({
          journey: careJourneyContext,
        })
      );
    });

    it('should handle plan journey context', () => {
      const planJourneyContext = {
        journeyType: 'plan',
        planId: 'plan-123',
        benefitId: 'benefit-456',
      };

      service.setJourneyContext(planJourneyContext);
      service.log('Plan journey log');
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Plan journey log',
        expect.objectContaining({
          journey: planJourneyContext,
        })
      );
    });

    it('should handle cross-journey context', () => {
      const crossJourneyContext = {
        journeyType: 'cross',
        healthMetricId: 'blood-pressure',
        appointmentId: 'appt-123',
        planId: 'plan-456',
      };

      service.setJourneyContext(crossJourneyContext);
      service.log('Cross journey log');
      
      expect(mockFormatter.format).toHaveBeenCalledWith(
        'INFO',
        'Cross journey log',
        expect.objectContaining({
          journey: crossJourneyContext,
        })
      );
    });
  });

  describe('configuration', () => {
    it('should initialize with default configuration', () => {
      // Reset config mock to return undefined
      mockConfigService.get.mockReturnValue(undefined);
      
      // Re-initialize service
      service.onModuleInit();
      
      // Log a message
      service.log('Test default config');
      
      // Verify default formatter and transport were used
      expect(mockFormatter.format).toHaveBeenCalled();
      expect(mockTransport.write).toHaveBeenCalled();
    });

    it('should respect configured log level', () => {
      // Configure log level to ERROR
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'logging.level') return 'error';
        return undefined;
      });
      
      // Re-initialize service
      service.onModuleInit();
      
      // These should NOT be logged (below ERROR level)
      service.log('Info message');
      service.warn('Warn message');
      service.debug('Debug message');
      service.verbose('Verbose message');
      
      // This should be logged (ERROR level)
      service.error('Error message');
      
      // Verify only ERROR was logged
      expect(mockFormatter.format).toHaveBeenCalledTimes(1);
      expect(mockFormatter.format).toHaveBeenCalledWith('ERROR', 'Error message', expect.any(Object));
    });

    it('should handle invalid log level configuration', () => {
      // Configure invalid log level
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'logging.level') return 'INVALID_LEVEL';
        return undefined;
      });
      
      // Re-initialize service should not throw
      expect(() => service.onModuleInit()).not.toThrow();
      
      // Should default to INFO level
      service.debug('Debug message'); // Should not be logged
      service.log('Info message'); // Should be logged
      
      // Verify only INFO was logged
      expect(mockFormatter.format).toHaveBeenCalledTimes(1);
      expect(mockFormatter.format).toHaveBeenCalledWith('INFO', 'Info message', expect.any(Object));
    });
  });
});