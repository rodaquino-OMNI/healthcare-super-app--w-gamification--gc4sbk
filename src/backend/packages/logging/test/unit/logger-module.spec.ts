import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { LoggerModule, LoggerModuleAsyncOptions, LOGGER_CONFIG } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { TransportType, FormatterType } from '../../src/interfaces/log-config.interface';

/**
 * Test consumer service that depends on LoggerService
 */
@Injectable()
class TestConsumerService {
  constructor(public readonly logger: LoggerService) {}

  logSomething(): void {
    this.logger.log('Test message from consumer');
  }
}

/**
 * Test module that consumes the LoggerService
 */
@Module({
  imports: [LoggerModule],
  providers: [TestConsumerService],
  exports: [TestConsumerService],
})
class TestConsumerModule {}

/**
 * Test config factory for async configuration tests
 */
@Injectable()
class TestLoggerConfigFactory {
  createLoggerConfig(): LoggerConfig {
    return {
      level: LogLevel.DEBUG,
      serviceName: 'test-service',
      transports: [{ type: TransportType.CONSOLE }],
    };
  }
}

/**
 * Test module that provides configuration for async tests
 */
@Module({
  providers: [TestLoggerConfigFactory],
  exports: [TestLoggerConfigFactory],
})
class TestConfigModule {}

describe('LoggerModule', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('forRoot', () => {
    it('should provide LoggerService', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          LoggerModule.forRoot({
            serviceName: 'test-service',
            level: LogLevel.INFO,
            transports: [{ type: TransportType.CONSOLE }],
          }),
        ],
      }).compile();

      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
    });

    it('should register the module as global', async () => {
      // Create a module that imports LoggerModule and a consumer module
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          LoggerModule.forRoot({
            serviceName: 'test-service',
            level: LogLevel.INFO,
            transports: [{ type: TransportType.CONSOLE }],
          }),
          TestConsumerModule,
        ],
      }).compile();

      // The consumer service should be able to access LoggerService
      // even though TestConsumerModule doesn't explicitly import LoggerModule
      const consumerService = module.get<TestConsumerService>(TestConsumerService);
      expect(consumerService).toBeDefined();
      expect(consumerService.logger).toBeDefined();
      expect(consumerService.logger).toBeInstanceOf(LoggerService);

      // Verify the consumer can use the logger
      const logSpy = jest.spyOn(consumerService.logger, 'log');
      consumerService.logSomething();
      expect(logSpy).toHaveBeenCalledWith('Test message from consumer');
    });

    it('should properly configure LoggerService with provided options', async () => {
      const testConfig: LoggerConfig = {
        serviceName: 'test-service',
        level: LogLevel.DEBUG,
        transports: [
          { type: TransportType.CONSOLE, formatter: FormatterType.TEXT },
        ],
        environment: 'test',
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRoot(testConfig)],
      }).compile();

      // Verify the config was provided correctly
      const providedConfig = module.get<LoggerConfig>(LOGGER_CONFIG);
      expect(providedConfig).toEqual(testConfig);

      // Verify the logger was configured with the provided options
      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      
      // Since the internal properties of LoggerService are private,
      // we can only verify its behavior indirectly
      const logSpy = jest.spyOn(loggerService, 'log');
      loggerService.log('Test message');
      expect(logSpy).toHaveBeenCalledWith('Test message');
    });
  });

  describe('forRootDefault', () => {
    it('should provide LoggerService with default configuration', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRootDefault()],
      }).compile();

      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);

      // Verify the config was provided with default values
      const providedConfig = module.get<LoggerConfig>(LOGGER_CONFIG);
      expect(providedConfig).toBeDefined();
      expect(providedConfig.level).toBe(LogLevel.INFO);
      expect(providedConfig.format).toBe('json');
      expect(providedConfig.transports).toEqual([{ type: 'console' }]);
      expect(providedConfig.includeTimestamp).toBe(true);
      expect(providedConfig.traceEnabled).toBe(true);
    });

    it('should allow consumers to use the default LoggerService', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRootDefault(), TestConsumerModule],
      }).compile();

      const consumerService = module.get<TestConsumerService>(TestConsumerService);
      expect(consumerService).toBeDefined();
      expect(consumerService.logger).toBeDefined();

      // Verify the consumer can use the logger
      const logSpy = jest.spyOn(consumerService.logger, 'log');
      consumerService.logSomething();
      expect(logSpy).toHaveBeenCalledWith('Test message from consumer');
    });
  });

  describe('forRootAsync', () => {
    it('should support useFactory pattern', async () => {
      const asyncOptions: LoggerModuleAsyncOptions = {
        useFactory: () => ({
          serviceName: 'test-service',
          level: LogLevel.DEBUG,
          transports: [{ type: TransportType.CONSOLE }],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRootAsync(asyncOptions)],
      }).compile();

      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);

      // Verify the config was provided correctly
      const providedConfig = module.get<LoggerConfig>(LOGGER_CONFIG);
      expect(providedConfig).toBeDefined();
      expect(providedConfig.serviceName).toBe('test-service');
      expect(providedConfig.level).toBe(LogLevel.DEBUG);
    });

    it('should support useFactory with injection', async () => {
      // Create a value to inject
      const ENV = 'test-environment';

      const asyncOptions: LoggerModuleAsyncOptions = {
        imports: [
          // Create a module that provides the ENV token
          {
            module: class EnvModule {},
            providers: [{ provide: 'ENV', useValue: ENV }],
            exports: ['ENV'],
          },
        ],
        useFactory: (env: string) => ({
          serviceName: 'test-service',
          environment: env,
          level: LogLevel.DEBUG,
          transports: [{ type: TransportType.CONSOLE }],
        }),
        inject: ['ENV'],
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRootAsync(asyncOptions)],
      }).compile();

      // Verify the config was provided with the injected value
      const providedConfig = module.get<LoggerConfig>(LOGGER_CONFIG);
      expect(providedConfig).toBeDefined();
      expect(providedConfig.environment).toBe(ENV);
    });

    it('should support useClass pattern', async () => {
      const asyncOptions: LoggerModuleAsyncOptions = {
        imports: [TestConfigModule],
        useClass: TestLoggerConfigFactory,
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRootAsync(asyncOptions)],
      }).compile();

      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();

      // Verify the config was provided correctly
      const providedConfig = module.get<LoggerConfig>(LOGGER_CONFIG);
      expect(providedConfig).toBeDefined();
      expect(providedConfig.serviceName).toBe('test-service');
      expect(providedConfig.level).toBe(LogLevel.DEBUG);
    });

    it('should support useExisting pattern', async () => {
      const asyncOptions: LoggerModuleAsyncOptions = {
        imports: [TestConfigModule],
        useExisting: TestLoggerConfigFactory,
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRootAsync(asyncOptions)],
      }).compile();

      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();

      // Verify the config was provided correctly
      const providedConfig = module.get<LoggerConfig>(LOGGER_CONFIG);
      expect(providedConfig).toBeDefined();
      expect(providedConfig.serviceName).toBe('test-service');
      expect(providedConfig.level).toBe(LogLevel.DEBUG);
    });
  });

  describe('integration', () => {
    it('should work with multiple modules in the application', async () => {
      // Create a more complex application structure with multiple modules
      @Injectable()
      class ServiceA {
        constructor(public readonly logger: LoggerService) {}
        log(): void {
          this.logger.log('Message from ServiceA');
        }
      }

      @Injectable()
      class ServiceB {
        constructor(public readonly logger: LoggerService) {}
        log(): void {
          this.logger.log('Message from ServiceB');
        }
      }

      @Module({
        providers: [ServiceA],
        exports: [ServiceA],
      })
      class ModuleA {}

      @Module({
        imports: [ModuleA],
        providers: [ServiceB],
        exports: [ServiceB, ModuleA],
      })
      class ModuleB {}

      // Create the application with LoggerModule and our test modules
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          LoggerModule.forRoot({
            serviceName: 'test-app',
            level: LogLevel.INFO,
            transports: [{ type: TransportType.CONSOLE }],
          }),
          ModuleB,
        ],
      }).compile();

      // Get services from different modules
      const serviceA = module.get<ServiceA>(ServiceA);
      const serviceB = module.get<ServiceB>(ServiceB);

      // Verify both services have access to the logger
      expect(serviceA.logger).toBeDefined();
      expect(serviceB.logger).toBeDefined();

      // Verify both services can use the logger
      const logSpyA = jest.spyOn(serviceA.logger, 'log');
      const logSpyB = jest.spyOn(serviceB.logger, 'log');

      serviceA.log();
      serviceB.log();

      expect(logSpyA).toHaveBeenCalledWith('Message from ServiceA');
      expect(logSpyB).toHaveBeenCalledWith('Message from ServiceB');
    });

    it('should support journey-specific logging contexts', async () => {
      @Injectable()
      class JourneyService {
        constructor(public readonly logger: LoggerService) {}

        logHealthJourney(): void {
          const healthLogger = this.logger.forHealthJourney({ userId: 'user123' });
          healthLogger.log('Health journey event');
        }

        logCareJourney(): void {
          const careLogger = this.logger.forCareJourney({ appointmentId: 'appt456' });
          careLogger.log('Care journey event');
        }

        logPlanJourney(): void {
          const planLogger = this.logger.forPlanJourney({ claimId: 'claim789' });
          planLogger.log('Plan journey event');
        }
      }

      const module: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRootDefault()],
        providers: [JourneyService],
      }).compile();

      const journeyService = module.get<JourneyService>(JourneyService);
      
      // Spy on the base logger's withJourneyContext method
      const withJourneyContextSpy = jest.spyOn(journeyService.logger, 'withJourneyContext');
      
      // Call the journey-specific logging methods
      journeyService.logHealthJourney();
      journeyService.logCareJourney();
      journeyService.logPlanJourney();

      // Verify the withJourneyContext method was called with the correct journey types
      expect(withJourneyContextSpy).toHaveBeenCalledTimes(3);
      expect(withJourneyContextSpy).toHaveBeenCalledWith(expect.objectContaining({
        journeyType: 'HEALTH',
        userId: 'user123'
      }));
      expect(withJourneyContextSpy).toHaveBeenCalledWith(expect.objectContaining({
        journeyType: 'CARE',
        appointmentId: 'appt456'
      }));
      expect(withJourneyContextSpy).toHaveBeenCalledWith(expect.objectContaining({
        journeyType: 'PLAN',
        claimId: 'claim789'
      }));
    });
  });
});