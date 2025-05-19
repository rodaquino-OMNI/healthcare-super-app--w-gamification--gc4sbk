import { INestApplication, ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '../../../src/logger.module';
import { LoggerService } from '../../../src/logger.service';
import { TracingModule } from '@austa/tracing';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { Transport } from '../../../src/interfaces/transport.interface';
import { ConsoleTransport } from '../../../src/transports/console.transport';
import { FileTransport } from '../../../src/transports/file.transport';
import { CloudWatchTransport } from '../../../src/transports/cloudwatch.transport';
import { TextFormatter } from '../../../src/formatters/text.formatter';
import { JsonFormatter } from '../../../src/formatters/json.formatter';
import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';

/**
 * Configuration options for the test application's logging setup
 */
export interface TestLoggerOptions {
  /**
   * Minimum log level to display (defaults to DEBUG in test environment)
   */
  logLevel?: LogLevel;
  
  /**
   * Whether to use JSON formatting for logs (defaults to false in test environment)
   */
  useJsonFormat?: boolean;
  
  /**
   * Whether to enable CloudWatch formatting (defaults to false in test environment)
   */
  useCloudWatchFormat?: boolean;
  
  /**
   * Transport types to use for logging (defaults to console in test environment)
   */
  transports?: ('console' | 'file' | 'cloudwatch')[];
  
  /**
   * Path for file transport if enabled (defaults to './logs/test.log')
   */
  filePath?: string;
  
  /**
   * Whether to enable tracing integration (defaults to true)
   */
  enableTracing?: boolean;
  
  /**
   * Service name for tracing (defaults to 'test-service')
   */
  serviceName?: string;
  
  /**
   * Journey context to include in logs (optional)
   */
  journeyContext?: {
    journeyType: 'health' | 'care' | 'plan';
    journeyId: string;
    userId?: string;
  };
  
  /**
   * Additional context to include in all logs
   */
  additionalContext?: Record<string, any>;
}

/**
 * Default test logger options
 */
const defaultTestLoggerOptions: TestLoggerOptions = {
  logLevel: LogLevel.DEBUG,
  useJsonFormat: false,
  useCloudWatchFormat: false,
  transports: ['console'],
  filePath: './logs/test.log',
  enableTracing: true,
  serviceName: 'test-service',
  additionalContext: {
    environment: 'test',
    testRun: `test-run-${Date.now()}`
  }
};

/**
 * Creates a test application with configured logging for e2e tests
 * 
 * @param options Configuration options for the test logger
 * @returns A promise that resolves to the configured NestJS application
 */
export async function createTestApplication(
  options: TestLoggerOptions = {}
): Promise<INestApplication> {
  const testOptions = { ...defaultTestLoggerOptions, ...options };
  
  const imports: any[] = [
    configureLoggerModule(testOptions),
  ];
  
  if (testOptions.enableTracing) {
    imports.push(
      TracingModule.forRoot({
        serviceName: testOptions.serviceName,
        enabled: true,
        sampling: 1.0, // Sample all traces in test environment
      })
    );
  }
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports,
  }).compile();
  
  const app = moduleFixture.createNestApplication();
  await app.init();
  
  return app;
}

/**
 * Creates a test module with configured logging for e2e tests
 * 
 * @param metadata Additional module metadata to include
 * @param options Configuration options for the test logger
 * @returns A promise that resolves to the configured TestingModule
 */
export async function createTestModule(
  metadata: ModuleMetadata = {},
  options: TestLoggerOptions = {}
): Promise<TestingModule> {
  const testOptions = { ...defaultTestLoggerOptions, ...options };
  
  const imports = [
    ...(metadata.imports || []),
    configureLoggerModule(testOptions),
  ];
  
  if (testOptions.enableTracing) {
    imports.push(
      TracingModule.forRoot({
        serviceName: testOptions.serviceName,
        enabled: true,
        sampling: 1.0, // Sample all traces in test environment
      })
    );
  }
  
  return Test.createTestingModule({
    ...metadata,
    imports,
  }).compile();
}

/**
 * Configures the LoggerModule with the specified options
 * 
 * @param options Configuration options for the logger
 * @returns Configured LoggerModule
 */
export function configureLoggerModule(options: TestLoggerOptions): Type<any> {
  const transports: Transport[] = [];
  
  // Configure transports based on options
  if (options.transports?.includes('console')) {
    transports.push(
      new ConsoleTransport({
        formatter: options.useJsonFormat 
          ? new JsonFormatter() 
          : options.useCloudWatchFormat 
            ? new CloudWatchFormatter() 
            : new TextFormatter(),
      })
    );
  }
  
  if (options.transports?.includes('file')) {
    transports.push(
      new FileTransport({
        formatter: options.useJsonFormat 
          ? new JsonFormatter() 
          : options.useCloudWatchFormat 
            ? new CloudWatchFormatter() 
            : new TextFormatter(),
        filePath: options.filePath || './logs/test.log',
        rotationSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );
  }
  
  if (options.transports?.includes('cloudwatch')) {
    transports.push(
      new CloudWatchTransport({
        formatter: options.useCloudWatchFormat 
          ? new CloudWatchFormatter() 
          : new JsonFormatter(),
        logGroupName: '/test/logs',
        logStreamName: `test-stream-${Date.now()}`,
        region: 'us-east-1',
      })
    );
  }
  
  return LoggerModule.forRoot({
    level: options.logLevel || LogLevel.DEBUG,
    transports,
    defaultContext: {
      ...options.additionalContext,
      ...(options.journeyContext ? {
        journey: options.journeyContext.journeyType,
        journeyId: options.journeyContext.journeyId,
        userId: options.journeyContext.userId,
      } : {}),
    },
  });
}

/**
 * Creates a test controller with logging capabilities for testing
 * 
 * @param loggerService The logger service instance to use
 * @returns A test controller with logging methods
 */
export function createTestController(loggerService: LoggerService) {
  return {
    logDebug(message: string, context?: Record<string, any>) {
      loggerService.debug(message, { context: { method: 'logDebug', ...context } });
      return { message, level: 'debug' };
    },
    
    logInfo(message: string, context?: Record<string, any>) {
      loggerService.log(message, { context: { method: 'logInfo', ...context } });
      return { message, level: 'info' };
    },
    
    logWarn(message: string, context?: Record<string, any>) {
      loggerService.warn(message, { context: { method: 'logWarn', ...context } });
      return { message, level: 'warn' };
    },
    
    logError(message: string, error?: Error, context?: Record<string, any>) {
      loggerService.error(message, error?.stack, { context: { method: 'logError', ...context } });
      return { message, level: 'error' };
    },
    
    logWithJourneyContext(message: string, journeyType: 'health' | 'care' | 'plan', context?: Record<string, any>) {
      loggerService.log(message, { 
        context: { 
          method: 'logWithJourneyContext', 
          journey: journeyType,
          ...context 
        } 
      });
      return { message, journey: journeyType };
    },
    
    throwError(message: string) {
      const error = new Error(message);
      loggerService.error('Controller threw an error', error.stack, { context: { method: 'throwError' } });
      throw error;
    }
  };
}

/**
 * Creates a mock transport that captures logs for testing
 * 
 * @returns A transport that captures logs and provides methods to access them
 */
export function createCapturingTransport(): Transport & { getLogs: () => any[] } {
  const logs: any[] = [];
  
  return {
    write: (entry: any) => {
      logs.push(entry);
      return Promise.resolve();
    },
    getLogs: () => logs,
  } as Transport & { getLogs: () => any[] };
}

/**
 * Utility to wait for async operations to complete
 * Useful when testing logging that might happen asynchronously
 * 
 * @param ms Milliseconds to wait
 * @returns Promise that resolves after the specified time
 */
export function waitForLogging(ms = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}