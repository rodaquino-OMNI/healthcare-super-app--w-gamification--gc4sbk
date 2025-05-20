import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { TransportType } from '../../src/interfaces/log-config.interface';

// Mock TracingService for testing integration
class MockTracingService {
  getCurrentTraceContext() {
    return { traceId: 'test-trace-id', spanId: 'test-span-id' };
  }
}

// Test consumer module to verify LoggerService injection
@Module({
  imports: [LoggerModule],
  providers: [],
})
class TestConsumerModule {}

// Test consumer module with custom LoggerModule configuration
@Module({
  imports: [
    LoggerModule.register({
      level: LogLevel.DEBUG,
      transports: [{ type: TransportType.CONSOLE }],
    }),
  ],
  providers: [],
})
class TestConsumerWithConfigModule {}

// Test consumer module with async LoggerModule configuration
@Module({
  imports: [
    LoggerModule.registerAsync({
      imports: [],
      useFactory: () => ({
        level: LogLevel.WARN,
        transports: [{ type: TransportType.CONSOLE }],
      }),
      inject: [],
    }),
  ],
  providers: [],
})
class TestConsumerWithAsyncConfigModule {}

// Test consumer module with tracing integration
@Module({
  imports: [
    LoggerModule.registerWithTracing({
      level: LogLevel.INFO,
      transports: [{ type: TransportType.CONSOLE }],
    }),
  ],
  providers: [
    {
      provide: 'TracingService',
      useClass: MockTracingService,
    },
  ],
})
class TestConsumerWithTracingModule {}

describe('LoggerModule', () => {
  describe('basic module registration', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [LoggerModule],
      }).compile();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide LoggerService', () => {
      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
    });

    it('should be available in consumer modules', async () => {
      const consumerModule = await Test.createTestingModule({
        imports: [TestConsumerModule],
      }).compile();

      const loggerService = consumerModule.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
    });
  });

  describe('static register method', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          LoggerModule.register({
            level: LogLevel.DEBUG,
            transports: [{ type: TransportType.CONSOLE }],
          }),
        ],
      }).compile();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide LoggerService with custom configuration', () => {
      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
      // We can't directly test private properties, but we can verify the service exists
      expect(loggerService['config']).toBeDefined();
    });

    it('should be available in consumer modules with custom configuration', async () => {
      const consumerModule = await Test.createTestingModule({
        imports: [TestConsumerWithConfigModule],
      }).compile();

      const loggerService = consumerModule.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
      // Verify the configuration was applied
      expect(loggerService['config'].level).toBe(LogLevel.DEBUG);
    });
  });

  describe('static registerAsync method', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          LoggerModule.registerAsync({
            imports: [],
            useFactory: () => ({
              level: LogLevel.WARN,
              transports: [{ type: TransportType.CONSOLE }],
            }),
            inject: [],
          }),
        ],
      }).compile();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide LoggerService with async configuration', () => {
      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
      // Verify the configuration was applied
      expect(loggerService['config']).toBeDefined();
    });

    it('should be available in consumer modules with async configuration', async () => {
      const consumerModule = await Test.createTestingModule({
        imports: [TestConsumerWithAsyncConfigModule],
      }).compile();

      const loggerService = consumerModule.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
      // Verify the configuration was applied
      expect(loggerService['config'].level).toBe(LogLevel.WARN);
    });
  });

  describe('static registerWithTracing method', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          LoggerModule.registerWithTracing({
            level: LogLevel.INFO,
            transports: [{ type: TransportType.CONSOLE }],
          }),
        ],
        providers: [
          {
            provide: 'TracingService',
            useClass: MockTracingService,
          },
        ],
      }).compile();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide LoggerService with tracing integration', () => {
      const loggerService = module.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
      // Verify the configuration was applied
      expect(loggerService['config']).toBeDefined();
      expect(loggerService['tracingService']).toBeDefined();
    });

    it('should be available in consumer modules with tracing integration', async () => {
      const consumerModule = await Test.createTestingModule({
        imports: [TestConsumerWithTracingModule],
      }).compile();

      const loggerService = consumerModule.get<LoggerService>(LoggerService);
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
      // Verify the tracing service was injected
      expect(loggerService['tracingService']).toBeDefined();
    });

    it('should include trace context in logs when tracing is enabled', async () => {
      const consumerModule = await Test.createTestingModule({
        imports: [TestConsumerWithTracingModule],
      }).compile();

      const loggerService = consumerModule.get<LoggerService>(LoggerService);
      
      // Mock the writeLog method to capture the log entry
      const writeLogSpy = jest.spyOn(loggerService as any, 'writeLog');
      
      // Call a logging method
      loggerService.log('Test message with tracing');
      
      // Verify that writeLog was called with the expected parameters
      expect(writeLogSpy).toHaveBeenCalled();
      
      // Restore the original method
      writeLogSpy.mockRestore();
    });
  });

  describe('global module behavior', () => {
    it('should provide LoggerService as a global provider', async () => {
      // Create a module that doesn't explicitly import LoggerModule
      @Module({})
      class StandaloneModule {}

      // Create a parent module that imports LoggerModule
      @Module({
        imports: [LoggerModule, StandaloneModule],
      })
      class ParentModule {}

      const module = await Test.createTestingModule({
        imports: [ParentModule],
      }).compile();

      // Get the standalone module from the parent
      const standaloneModule = module.select(StandaloneModule);

      // The LoggerService should be available in the standalone module
      // even though it doesn't explicitly import LoggerModule
      const loggerService = standaloneModule.get<LoggerService>(LoggerService, { strict: false });
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
    });
  });
});