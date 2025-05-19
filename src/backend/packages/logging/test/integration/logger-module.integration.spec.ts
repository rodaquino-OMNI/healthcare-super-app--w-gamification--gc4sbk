import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { LoggerModule } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { TransportFactory } from '../../src/transports/transport-factory';

// Mock ConfigService to test configuration injection
@Injectable()
class MockConfigService {
  get(key: string): any {
    const config = {
      'logger.level': 'debug',
      'logger.format': 'json',
      'logger.transports.console.enabled': 'true',
      'logger.transports.file.enabled': 'false',
      'logger.transports.cloudwatch.enabled': 'false',
      'logger.defaultContext.application': 'test-app',
      'logger.defaultContext.service': 'test-service',
      'logger.defaultContext.environment': 'test',
      'logger.tracing.enabled': 'true',
    };
    return config[key];
  }
}

// Mock ConfigModule to provide MockConfigService
@Module({
  providers: [MockConfigService],
  exports: [MockConfigService],
})
class MockConfigModule {}

// Mock service that uses LoggerService to test injection
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

// Mock module that uses TestService
@Module({
  providers: [TestService],
  exports: [TestService],
})
class TestModule {}

// Mock module for testing cross-module injection
@Injectable()
class AnotherTestService {
  constructor(private readonly logger: LoggerService) {}

  logSomething(): void {
    this.logger.log('Another test message');
  }

  getLogger(): LoggerService {
    return this.logger;
  }
}

@Module({
  providers: [AnotherTestService],
  exports: [AnotherTestService],
})
class AnotherTestModule {}

// Mock TracingService for testing tracing integration
@Injectable()
class MockTracingService {
  getCurrentTraceId(): string {
    return 'test-trace-id';
  }

  getCurrentSpanId(): string {
    return 'test-span-id';
  }
}

@Module({
  providers: [{
    provide: 'TRACING_SERVICE',
    useClass: MockTracingService,
  }],
  exports: ['TRACING_SERVICE'],
})
class MockTracingModule {}

describe('LoggerModule Integration', () => {
  describe('Static Registration', () => {
    let moduleRef: TestingModule;
    let testService: TestService;
    let anotherTestService: AnotherTestService;
    let loggerService: LoggerService;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          LoggerModule.register({
            level: LogLevel.DEBUG,
            format: 'json',
            transports: {
              console: { enabled: true },
              file: { enabled: false },
              cloudwatch: { enabled: false },
            },
            defaultContext: {
              application: 'test-app',
              service: 'test-service',
              environment: 'test',
            },
            tracing: {
              enabled: true,
            },
          }),
          TestModule,
          AnotherTestModule,
        ],
      }).compile();

      testService = moduleRef.get<TestService>(TestService);
      anotherTestService = moduleRef.get<AnotherTestService>(AnotherTestService);
      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });

    afterEach(async () => {
      await moduleRef.close();
    });

    it('should provide LoggerService as a global provider', () => {
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
    });

    it('should inject LoggerService into TestService', () => {
      expect(testService).toBeDefined();
      expect(testService.getLogger()).toBeDefined();
      expect(testService.getLogger()).toBeInstanceOf(LoggerService);
    });

    it('should inject the same LoggerService instance across modules', () => {
      const testLogger = testService.getLogger();
      const anotherTestLogger = anotherTestService.getLogger();
      
      // Both services should have the same LoggerService instance
      expect(testLogger).toBe(anotherTestLogger);
    });

    it('should configure LoggerService with provided options', () => {
      // Access private properties for testing
      const config = (loggerService as any).config;
      
      expect(config).toBeDefined();
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.defaultContext.application).toBe('test-app');
      expect(config.defaultContext.service).toBe('test-service');
      expect(config.defaultContext.environment).toBe('test');
    });

    it('should create transports based on configuration', () => {
      // Access private properties for testing
      const transports = (loggerService as any).transports;
      
      expect(transports).toBeDefined();
      expect(Array.isArray(transports)).toBe(true);
      // Should have at least one transport (console)
      expect(transports.length).toBeGreaterThan(0);
    });
  });

  describe('Async Registration with ConfigService', () => {
    let moduleRef: TestingModule;
    let testService: TestService;
    let configService: MockConfigService;
    let loggerService: LoggerService;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          MockConfigModule,
          LoggerModule.registerAsync({
            imports: [MockConfigModule],
            inject: [MockConfigService],
            useFactory: (configService: MockConfigService) => ({
              level: configService.get('logger.level'),
              format: configService.get('logger.format'),
              transports: {
                console: { 
                  enabled: configService.get('logger.transports.console.enabled') === 'true',
                },
                file: { 
                  enabled: configService.get('logger.transports.file.enabled') === 'true',
                },
                cloudwatch: { 
                  enabled: configService.get('logger.transports.cloudwatch.enabled') === 'true',
                },
              },
              defaultContext: {
                application: configService.get('logger.defaultContext.application'),
                service: configService.get('logger.defaultContext.service'),
                environment: configService.get('logger.defaultContext.environment'),
              },
              tracing: {
                enabled: configService.get('logger.tracing.enabled') === 'true',
              },
            }),
          }),
          TestModule,
        ],
      }).compile();

      testService = moduleRef.get<TestService>(TestService);
      configService = moduleRef.get<MockConfigService>(MockConfigService);
      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });

    afterEach(async () => {
      await moduleRef.close();
    });

    it('should provide LoggerService as a global provider', () => {
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
    });

    it('should inject LoggerService into TestService', () => {
      expect(testService).toBeDefined();
      expect(testService.getLogger()).toBeDefined();
      expect(testService.getLogger()).toBeInstanceOf(LoggerService);
    });

    it('should configure LoggerService with values from ConfigService', () => {
      // Access private properties for testing
      const config = (loggerService as any).config;
      
      expect(config).toBeDefined();
      expect(config.defaultContext.application).toBe('test-app');
      expect(config.defaultContext.service).toBe('test-service');
      expect(config.defaultContext.environment).toBe('test');
    });
  });

  describe('Tracing Integration', () => {
    let moduleRef: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          MockTracingModule,
          LoggerModule.register({
            level: LogLevel.DEBUG,
            tracing: {
              enabled: true,
            },
          }),
        ],
      }).compile();

      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });

    afterEach(async () => {
      await moduleRef.close();
    });

    it('should integrate with tracing service when available', () => {
      // Create a spy on the private getTraceContext method
      const getTraceContextSpy = jest.spyOn(loggerService as any, 'getTraceContext');
      
      // Log a message to trigger trace context extraction
      loggerService.log('Test message with tracing');
      
      // Verify that getTraceContext was called
      expect(getTraceContextSpy).toHaveBeenCalled();
    });
  });

  describe('Journey-Specific Logging', () => {
    let moduleRef: TestingModule;
    let loggerService: LoggerService;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          LoggerModule.register({
            level: LogLevel.INFO,
            journeyLevels: {
              health: LogLevel.DEBUG,
              care: LogLevel.WARN,
              plan: LogLevel.ERROR,
            },
          }),
        ],
      }).compile();

      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });

    afterEach(async () => {
      await moduleRef.close();
    });

    it('should create journey-specific logger instances', () => {
      const healthLogger = loggerService.forHealthJourney();
      const careLogger = loggerService.forCareJourney();
      const planLogger = loggerService.forPlanJourney();
      
      expect(healthLogger).toBeDefined();
      expect(careLogger).toBeDefined();
      expect(planLogger).toBeDefined();
      
      // Each logger should be a new instance
      expect(healthLogger).not.toBe(loggerService);
      expect(careLogger).not.toBe(loggerService);
      expect(planLogger).not.toBe(loggerService);
    });

    it('should apply journey-specific log levels', () => {
      // Access private properties for testing
      const journeyLevels = (loggerService as any).journeyLevels;
      
      expect(journeyLevels).toBeDefined();
      expect(journeyLevels.health).toBe(LogLevel.DEBUG);
      expect(journeyLevels.care).toBe(LogLevel.WARN);
      expect(journeyLevels.plan).toBe(LogLevel.ERROR);
    });
  });

  describe('Module Lifecycle', () => {
    let moduleRef: TestingModule;
    let transportFactory: TransportFactory;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          LoggerModule.register(),
        ],
      }).compile();

      transportFactory = moduleRef.get<TransportFactory>(TransportFactory);
    });

    it('should properly initialize providers in the correct order', () => {
      // Verify that all required providers are available
      expect(moduleRef.get('LOGGER_CONFIG')).toBeDefined();
      expect(moduleRef.get(TransportFactory)).toBeDefined();
      expect(moduleRef.get(LoggerService)).toBeDefined();
    });

    it('should close all transports when module is destroyed', async () => {
      // Create spy on transport close methods
      const loggerService = moduleRef.get<LoggerService>(LoggerService);
      const transports = (loggerService as any).transports;
      
      // Add spy to each transport's close method
      for (const transport of transports) {
        jest.spyOn(transport, 'close').mockImplementation(async () => {});
      }
      
      // Close the module
      await moduleRef.close();
      
      // Verify that close was called on each transport
      for (const transport of transports) {
        expect(transport.close).toHaveBeenCalled();
      }
    });
  });
});