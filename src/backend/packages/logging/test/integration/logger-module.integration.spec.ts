import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { LoggerModule, LOGGER_CONFIG } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';

// Mock TracingService to test integration with tracing
class MockTracingService {
  getCurrentTraceId(): string {
    return 'mock-trace-id';
  }

  getCurrentSpanId(): string {
    return 'mock-span-id';
  }
}

// Mock ConfigService to test configuration inheritance
@Injectable()
class MockConfigService {
  get(key: string): any {
    if (key === 'logger') {
      return {
        level: 'debug',
        serviceName: 'test-service',
        transports: ['console'],
        formatter: 'json',
      };
    }
    return null;
  }
}

// Test service that uses LoggerService to verify injection
@Injectable()
class TestService {
  constructor(private readonly logger: LoggerService) {}

  logSomething(): void {
    this.logger.log('Test message');
  }

  getLogger(): LoggerService {
    return this.logger;
  }
}

// Test module that uses LoggerService
@Module({
  providers: [TestService],
  exports: [TestService],
})
class TestModule {}

// Module that provides configuration for LoggerModule
@Module({
  providers: [MockConfigService],
  exports: [MockConfigService],
})
class ConfigModule {}

// Factory for creating logger config
class TestLoggerConfigFactory {
  createLoggerConfig(): LoggerConfig {
    return {
      serviceName: 'factory-service',
      level: LogLevel.DEBUG,
      transports: [{ type: 'console' }],
    };
  }
}

describe('LoggerModule Integration', () => {
  describe('forRoot static configuration', () => {
    let module: TestingModule;
    let loggerService: LoggerService;
    let testService: TestService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          LoggerModule.forRoot({
            serviceName: 'test-service',
            level: LogLevel.DEBUG,
            transports: [{ type: 'console' }],
          }),
          TestModule,
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
      testService = module.get<TestService>(TestService);
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
      expect(loggerService).toBeDefined();
      expect(testService).toBeDefined();
    });

    it('should provide LoggerService as a global service', () => {
      expect(testService.getLogger()).toBeInstanceOf(LoggerService);
    });

    it('should configure LoggerService with provided options', () => {
      // Access private property for testing
      const config = (loggerService as any).config;
      expect(config.serviceName).toBe('test-service');
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.transports[0].type).toBe('console');
    });

    it('should allow logging through the service', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      testService.logSomething();
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('forRootDefault default configuration', () => {
    let module: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [LoggerModule.forRootDefault()],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should be defined with default configuration', () => {
      expect(module).toBeDefined();
      expect(loggerService).toBeDefined();
    });

    it('should configure LoggerService with default options', () => {
      // Access private property for testing
      const config = (loggerService as any).config;
      expect(config.level).toBe(LogLevel.INFO);
      expect(config.format).toBe('json');
      expect(config.transports[0].type).toBe('console');
    });
  });

  describe('forRootAsync with useFactory', () => {
    let module: TestingModule;
    let loggerService: LoggerService;
    let configService: MockConfigService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule,
          LoggerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: MockConfigService) => {
              return configService.get('logger');
            },
            inject: [MockConfigService],
          }),
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
      configService = module.get<MockConfigService>(MockConfigService);
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
      expect(loggerService).toBeDefined();
      expect(configService).toBeDefined();
    });

    it('should configure LoggerService with options from factory', () => {
      // Access private property for testing
      const config = (loggerService as any).config;
      expect(config.serviceName).toBe('test-service');
      expect(config.level).toBe('debug');
      expect(config.transports[0]).toBe('console');
    });
  });

  describe('forRootAsync with useClass', () => {
    let module: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          LoggerModule.forRootAsync({
            useClass: TestLoggerConfigFactory,
          }),
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
      expect(loggerService).toBeDefined();
    });

    it('should configure LoggerService with options from class factory', () => {
      // Access private property for testing
      const config = (loggerService as any).config;
      expect(config.serviceName).toBe('factory-service');
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.transports[0].type).toBe('console');
    });
  });

  describe('forRootAsync with useExisting', () => {
    let module: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      // First create a module with the factory
      const factoryProvider = {
        provide: TestLoggerConfigFactory,
        useClass: TestLoggerConfigFactory,
      };

      module = await Test.createTestingModule({
        providers: [factoryProvider],
        imports: [
          LoggerModule.forRootAsync({
            useExisting: TestLoggerConfigFactory,
          }),
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
      expect(loggerService).toBeDefined();
    });

    it('should configure LoggerService with options from existing factory', () => {
      // Access private property for testing
      const config = (loggerService as any).config;
      expect(config.serviceName).toBe('factory-service');
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.transports[0].type).toBe('console');
    });
  });

  describe('Global module availability', () => {
    let module: TestingModule;
    let testService: TestService;

    // Create a separate module that doesn't directly import LoggerModule
    @Module({
      providers: [TestService],
      exports: [TestService],
    })
    class StandaloneModule {}

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          LoggerModule.forRoot({
            serviceName: 'test-service',
            level: LogLevel.DEBUG,
            transports: [{ type: 'console' }],
          }),
          StandaloneModule,
        ],
      }).compile();

      testService = module.get<TestService>(TestService);
    });

    it('should provide LoggerService to modules that don\'t import it', () => {
      expect(testService).toBeDefined();
      expect(testService.getLogger()).toBeInstanceOf(LoggerService);
    });

    it('should allow logging from services in other modules', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      testService.logSomething();
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('Integration with tracing', () => {
    let module: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      const tracingServiceProvider = {
        provide: 'TracingService',
        useClass: MockTracingService,
      };

      module = await Test.createTestingModule({
        providers: [tracingServiceProvider],
        imports: [
          LoggerModule.forRootAsync({
            useFactory: (tracingService: MockTracingService) => ({
              serviceName: 'tracing-service',
              level: LogLevel.DEBUG,
              transports: [{ type: 'console' }],
              traceEnabled: true,
            }),
            inject: ['TracingService'],
          }),
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should be defined with tracing integration', () => {
      expect(module).toBeDefined();
      expect(loggerService).toBeDefined();
    });

    it('should include trace information in logs when available', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Force the logger to use the tracing service
      const withTraceLogger = loggerService.withCurrentTraceContext();
      withTraceLogger.log('Test with trace');
      
      // Check that the log contains trace information
      expect(logSpy).toHaveBeenCalled();
      const logCall = logSpy.mock.calls[0][0];
      
      // The log is likely a JSON string, so we need to parse it
      try {
        const logObject = JSON.parse(logCall);
        expect(logObject.traceId).toBe('mock-trace-id');
        expect(logObject.spanId).toBe('mock-span-id');
      } catch (e) {
        // If it's not JSON, check the raw string
        expect(logCall).toContain('mock-trace-id');
      }
      
      logSpy.mockRestore();
    });
  });

  describe('Configuration through providers', () => {
    let module: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      // Provide configuration directly through providers
      const configProvider = {
        provide: LOGGER_CONFIG,
        useValue: {
          serviceName: 'provider-service',
          level: LogLevel.INFO,
          transports: [{ type: 'console' }],
        },
      };

      module = await Test.createTestingModule({
        providers: [configProvider, LoggerService],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);
    });

    it('should be defined with provider configuration', () => {
      expect(module).toBeDefined();
      expect(loggerService).toBeDefined();
    });

    it('should configure LoggerService with options from provider', () => {
      // Access private property for testing
      const config = (loggerService as any).config;
      expect(config.serviceName).toBe('provider-service');
      expect(config.level).toBe(LogLevel.INFO);
      expect(config.transports[0].type).toBe('console');
    });
  });

  describe('Lifecycle hooks', () => {
    let module: TestingModule;
    let loggerService: LoggerService;
    let onModuleInitSpy: jest.SpyInstance;
    let onApplicationShutdownSpy: jest.SpyInstance;

    beforeEach(async () => {
      // Create a custom logger service with lifecycle hooks
      class LifecycleLoggerService extends LoggerService {
        async onModuleInit() {
          // Implementation would go here
        }

        async onApplicationShutdown(signal?: string) {
          // Implementation would go here
        }
      }

      // Spy on the lifecycle methods
      onModuleInitSpy = jest.spyOn(LifecycleLoggerService.prototype, 'onModuleInit');
      onApplicationShutdownSpy = jest.spyOn(LifecycleLoggerService.prototype, 'onApplicationShutdown');

      module = await Test.createTestingModule({
        providers: [
          {
            provide: LoggerService,
            useClass: LifecycleLoggerService,
          },
        ],
      }).compile();

      loggerService = module.get<LoggerService>(LoggerService);

      // Trigger lifecycle hooks
      await module.init();
      await module.close();
    });

    it('should call onModuleInit when module initializes', () => {
      expect(onModuleInitSpy).toHaveBeenCalled();
    });

    it('should call onApplicationShutdown when application shuts down', () => {
      expect(onApplicationShutdownSpy).toHaveBeenCalled();
    });
  });
});