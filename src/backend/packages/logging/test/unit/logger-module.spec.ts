import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication, Injectable } from '@nestjs/common';
import { LoggerModule } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { TracingModule } from '@austa/tracing';
import { LogLevel } from '../../src/context/context.constants';
import { TransportType } from '../../src/transports/transport.interface';
import {
  createTestModule,
  mockConfigService,
  mockTracingService,
} from '../utils/test-module.utils';
import { LogCaptureUtil } from '../utils/log-capture.utils';

// Test consumer to verify dependency injection
@Injectable()
class TestConsumer {
  constructor(public readonly loggerService: LoggerService) {}

  logSomething(message: string): void {
    this.loggerService.log(message);
  }
}

describe('LoggerModule', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let loggerService: LoggerService;
  let testConsumer: TestConsumer;
  let logCapture: LogCaptureUtil;

  beforeEach(async () => {
    // Reset log capture before each test
    logCapture = new LogCaptureUtil();

    // Create a test module with LoggerModule
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TracingModule.forRoot(),
        LoggerModule.forRoot({
          level: LogLevel.DEBUG,
          defaultTransport: TransportType.CONSOLE,
          transports: [
            {
              type: TransportType.CONSOLE,
              level: LogLevel.DEBUG,
            },
          ],
        }),
      ],
      providers: [TestConsumer],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    loggerService = moduleRef.get<LoggerService>(LoggerService);
    testConsumer = moduleRef.get<TestConsumer>(TestConsumer);
  });

  afterEach(async () => {
    await app.close();
    logCapture.restore();
  });

  describe('Module Registration', () => {
    it('should be defined', () => {
      expect(moduleRef).toBeDefined();
      expect(app).toBeDefined();
    });

    it('should register LoggerModule as a global module', async () => {
      // Create a separate module without explicitly importing LoggerModule
      const testModule = await Test.createTestingModule({
        imports: [],
        providers: [TestConsumer],
      }).compile();

      // LoggerService should be available due to global registration
      const consumer = testModule.get<TestConsumer>(TestConsumer);
      expect(consumer).toBeDefined();
      expect(consumer.loggerService).toBeDefined();
    });
  });

  describe('Provider Registration', () => {
    it('should register LoggerService as a provider', () => {
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
    });

    it('should export LoggerService for use in other modules', () => {
      expect(testConsumer).toBeDefined();
      expect(testConsumer.loggerService).toBeDefined();
      expect(testConsumer.loggerService).toBeInstanceOf(LoggerService);
    });
  });

  describe('Module Configuration', () => {
    it('should accept configuration options via forRoot', async () => {
      // Create a module with custom configuration
      const customModule = await createTestModule({
        level: LogLevel.ERROR,
        defaultTransport: TransportType.CONSOLE,
        transports: [
          {
            type: TransportType.CONSOLE,
            level: LogLevel.ERROR,
          },
        ],
      });

      const customLogger = customModule.get<LoggerService>(LoggerService);
      expect(customLogger).toBeDefined();

      // Capture logs to verify level filtering
      const capture = new LogCaptureUtil();
      
      // Debug should not be logged with ERROR level
      customLogger.debug('This should not be logged');
      expect(capture.getLogs()).not.toContain('This should not be logged');
      
      // Error should be logged
      customLogger.error('This should be logged');
      expect(capture.getLogs()).toContain('This should be logged');
      
      capture.restore();
    });

    it('should use default configuration when none is provided', async () => {
      // Create a module with default configuration
      const defaultModule = await createTestModule();
      const defaultLogger = defaultModule.get<LoggerService>(LoggerService);
      expect(defaultLogger).toBeDefined();

      // Default level should be INFO
      const capture = new LogCaptureUtil();
      
      // Debug should not be logged with default INFO level
      defaultLogger.debug('This should not be logged');
      expect(capture.getLogs()).not.toContain('This should not be logged');
      
      // Info should be logged
      defaultLogger.log('This should be logged');
      expect(capture.getLogs()).toContain('This should be logged');
      
      capture.restore();
    });
  });

  describe('Integration with ConfigModule', () => {
    it('should use configuration from ConfigService when available', async () => {
      // Create a module with ConfigService providing logging configuration
      const configValues = {
        'logging.level': LogLevel.WARN,
        'logging.defaultTransport': TransportType.CONSOLE,
      };
      
      const configModule = await createTestModule(undefined, configValues);
      const configLogger = configModule.get<LoggerService>(LoggerService);
      expect(configLogger).toBeDefined();

      // Capture logs to verify level filtering based on config
      const capture = new LogCaptureUtil();
      
      // Info should not be logged with WARN level from config
      configLogger.log('This should not be logged');
      expect(capture.getLogs()).not.toContain('This should not be logged');
      
      // Warn should be logged
      configLogger.warn('This should be logged');
      expect(capture.getLogs()).toContain('This should be logged');
      
      capture.restore();
    });
  });

  describe('Integration with TracingModule', () => {
    it('should integrate with TracingService for correlation IDs', async () => {
      // Create a module with TracingModule integration
      const traceId = '1234567890abcdef';
      const tracingModule = await createTestModule(undefined, {}, {
        getCurrentTraceId: jest.fn().mockReturnValue(traceId),
      });
      
      const tracingLogger = tracingModule.get<LoggerService>(LoggerService);
      expect(tracingLogger).toBeDefined();

      // Capture logs to verify trace correlation
      const capture = new LogCaptureUtil();
      
      tracingLogger.log('Log with trace correlation');
      const logs = capture.getLogs();
      
      // Log should contain the trace ID
      expect(logs).toContain('Log with trace correlation');
      expect(logs).toContain(traceId);
      
      capture.restore();
    });
  });

  describe('Dependency Injection', () => {
    it('should inject LoggerService into consumers', () => {
      // Test that LoggerService is properly injected
      expect(testConsumer.loggerService).toBeDefined();
      expect(testConsumer.loggerService).toBe(loggerService);
    });

    it('should allow consumers to use LoggerService', () => {
      // Capture logs to verify consumer usage
      const capture = new LogCaptureUtil();
      
      const testMessage = 'Test message from consumer';
      testConsumer.logSomething(testMessage);
      
      // Log should contain the test message
      expect(capture.getLogs()).toContain(testMessage);
      
      capture.restore();
    });
  });

  describe('Journey-specific Context', () => {
    it('should support journey-specific logging context', () => {
      // Capture logs to verify journey context
      const capture = new LogCaptureUtil();
      
      // Set journey context and log
      loggerService.setJourneyContext({
        journeyType: 'HEALTH',
        journeyId: 'health-journey-123',
      });
      
      loggerService.log('Log with journey context');
      const logs = capture.getLogs();
      
      // Log should contain journey context
      expect(logs).toContain('Log with journey context');
      expect(logs).toContain('HEALTH');
      expect(logs).toContain('health-journey-123');
      
      capture.restore();
    });
  });
});