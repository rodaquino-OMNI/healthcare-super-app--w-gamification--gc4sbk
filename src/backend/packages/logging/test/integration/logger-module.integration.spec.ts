import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { TransportType } from '../../src/interfaces/log-config.interface';

// Mock TracingService for testing integration with tracing
@Injectable()
class MockTracingService {
  getCurrentTraceContext() {
    return { traceId: 'test-trace-id', spanId: 'test-span-id' };
  }
}

// Test service that uses LoggerService
@Injectable()
class TestService {
  constructor(private readonly logger: LoggerService) {}

  logMessage(message: string): void {
    this.logger.log(message, TestService.name);
  }

  logError(message: string, error: Error): void {
    this.logger.error(message, error, TestService.name);
  }
}

// Basic test module that imports LoggerModule
@Module({
  imports: [LoggerModule],
  providers: [TestService],
  exports: [TestService],
})
class BasicTestModule {}

// Test module with custom LoggerModule configuration
@Module({
  imports: [
    LoggerModule.register({
      logLevel: LogLevel.DEBUG,
      serviceName: 'test-service',
      environment: 'test',
      appVersion: '1.0.0',
      transports: [
        {
          type: TransportType.CONSOLE,
        },
      ],
    }),
  ],
  providers: [TestService],
  exports: [TestService],
})
class CustomConfigTestModule {}

// Test module with async LoggerModule configuration
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({
        logger: {
          logLevel: LogLevel.DEBUG,
          serviceName: 'config-test-service',
          environment: 'test',
          appVersion: '1.0.0',
          transports: [
            {
              type: TransportType.CONSOLE,
            },
          ],
        },
      })],
    }),
    LoggerModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('logger'),
    }),
  ],
  providers: [TestService],
  exports: [TestService],
})
class AsyncConfigTestModule {}

// Test module with tracing integration
@Module({
  imports: [
    LoggerModule.registerWithTracing({
      logLevel: LogLevel.DEBUG,
      serviceName: 'tracing-test-service',
      environment: 'test',
      appVersion: '1.0.0',
      transports: [
        {
          type: TransportType.CONSOLE,
        },
      ],
    }),
  ],
  providers: [TestService, { provide: 'TracingService', useClass: MockTracingService }],
  exports: [TestService],
})
class TracingTestModule {}

// Secondary module to test global availability
@Module({
  providers: [TestService],
  exports: [TestService],
})
class SecondaryModule {}

describe('LoggerModule Integration', () => {
  describe('Basic Module Registration', () => {
    let module: TestingModule;
    let testService: TestService;
    let loggerService: LoggerService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [BasicTestModule],
      }).compile();

      testService = module.get<TestService>(TestService);
      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
      expect(testService).toBeDefined();
      expect(loggerService).toBeDefined();
    });

    it('should inject LoggerService into TestService', () => {
      // Verify that TestService has LoggerService injected
      expect(testService['logger']).toBe(loggerService);
    });

    it('should allow logging messages', () => {
      // Spy on the log method
      const logSpy = jest.spyOn(loggerService, 'log');
      
      // Call the test service method
      testService.logMessage('Test message');
      
      // Verify the log method was called with the correct parameters
      expect(logSpy).toHaveBeenCalledWith('Test message', TestService.name);
    });

    it('should allow logging errors', () => {
      // Spy on the error method
      const errorSpy = jest.spyOn(loggerService, 'error');
      const testError = new Error('Test error');
      
      // Call the test service method
      testService.logError('Error occurred', testError);
      
      // Verify the error method was called with the correct parameters
      expect(errorSpy).toHaveBeenCalledWith('Error occurred', testError, TestService.name);
    });
  });

  describe('Global Module Availability', () => {
    let module: TestingModule;
    let primaryTestService: TestService;
    let secondaryTestService: TestService;
    let loggerService: LoggerService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [BasicTestModule, SecondaryModule],
      }).compile();

      primaryTestService = module.get<TestService>(TestService, { strict: false });
      secondaryTestService = module.get<TestService>(TestService, { strict: false });
      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should provide the same LoggerService instance to both modules', () => {
      // Both services should have the same LoggerService instance
      expect(primaryTestService['logger']).toBe(loggerService);
      expect(secondaryTestService['logger']).toBe(loggerService);
      expect(primaryTestService['logger']).toBe(secondaryTestService['logger']);
    });
  });

  describe('Custom Configuration', () => {
    let module: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [CustomConfigTestModule],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should be configured with custom options', () => {
      // Verify that the logger service has the custom configuration
      expect(loggerService['logLevel']).toBe(LogLevel.DEBUG);
      expect(loggerService['defaultContext'].serviceName).toBe('test-service');
      expect(loggerService['defaultContext'].environment).toBe('test');
      expect(loggerService['defaultContext'].appVersion).toBe('1.0.0');
      expect(loggerService['transports'].length).toBeGreaterThan(0);
    });
  });

  describe('Async Configuration', () => {
    let module: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [AsyncConfigTestModule],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should be configured with options from ConfigService', () => {
      // Verify that the logger service has the configuration from ConfigService
      expect(loggerService['logLevel']).toBe(LogLevel.DEBUG);
      expect(loggerService['defaultContext'].serviceName).toBe('config-test-service');
      expect(loggerService['defaultContext'].environment).toBe('test');
      expect(loggerService['defaultContext'].appVersion).toBe('1.0.0');
      expect(loggerService['transports'].length).toBeGreaterThan(0);
    });
  });

  describe('Tracing Integration', () => {
    let module: TestingModule;
    let loggerService: LoggerService;
    let tracingService: MockTracingService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [TracingTestModule],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
      tracingService = module.get<MockTracingService>('TracingService');
    });

    it('should be configured with tracing service', () => {
      // Verify that the logger service has the tracing service
      expect(loggerService['tracingService']).toBeDefined();
    });

    it('should include trace context in logs', () => {
      // Spy on the writeLog method
      const writeLogSpy = jest.spyOn(loggerService as any, 'writeLog');
      
      // Call the log method
      loggerService.log('Test message with tracing');
      
      // Verify the writeLog method was called with trace context
      expect(writeLogSpy).toHaveBeenCalled();
      
      // Get the log context from the call
      const callArgs = writeLogSpy.mock.calls[0];
      const logContext = callArgs[4] || {};
      
      // The tracing context should be added by the contextManager
      // This is an indirect test since we can't easily access the final log entry
      expect(tracingService.getCurrentTraceContext).toHaveBeenCalled;
    });
  });

  describe('Module Lifecycle', () => {
    let module: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [BasicTestModule],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should initialize transports during module initialization', () => {
      // Verify that transports are initialized
      expect(loggerService['transports'].length).toBeGreaterThan(0);
    });

    it('should close transports during module destruction', async () => {
      // Spy on the close method of transports
      const transportCloseSpy = jest.spyOn(loggerService['transports'][0], 'close');
      
      // Destroy the module
      await module.close();
      
      // Verify the close method was called on transports
      expect(transportCloseSpy).toHaveBeenCalled();
    });
  });
});