import { DynamicModule, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import { TracingOptions } from '../../src/interfaces/tracing-options.interface';
import { JourneyType } from '../../src/interfaces/journey-context.interface';

/**
 * Mock implementation of the TracingService for testing purposes.
 * This mock provides stub implementations of all TracingService methods
 * to avoid actual tracing instrumentation during tests.
 */
export class MockTracingService {
  createSpan = jest.fn().mockImplementation((name, fn) => fn());
  createJourneySpan = jest.fn().mockImplementation((journeyName, operationName, fn) => fn());
  createHttpSpan = jest.fn().mockImplementation((method, url, fn) => fn());
  createDatabaseSpan = jest.fn().mockImplementation((operation, entity, fn) => fn());
  getTraceContextForPropagation = jest.fn().mockReturnValue({});
  injectTraceContextIntoHeaders = jest.fn().mockImplementation((headers) => headers);
  extractTraceContextFromHeaders = jest.fn().mockReturnValue({});
  getCurrentTraceInfo = jest.fn().mockReturnValue({ traceId: 'mock-trace-id', spanId: 'mock-span-id' });
}

/**
 * Mock implementation of the LoggerService for testing trace-log correlation.
 * This mock captures log messages and their associated trace context for verification.
 */
export class MockLoggerService {
  logs: Array<{ level: string; message: string; context?: string; meta?: any }> = [];
  
  log(message: any, context?: string, ...meta: any[]): void {
    this.logs.push({ level: 'log', message, context, meta: meta[0] });
  }
  
  error(message: any, trace?: string, context?: string, ...meta: any[]): void {
    this.logs.push({ level: 'error', message, context, meta: meta[0] });
  }
  
  warn(message: any, context?: string, ...meta: any[]): void {
    this.logs.push({ level: 'warn', message, context, meta: meta[0] });
  }
  
  debug(message: any, context?: string, ...meta: any[]): void {
    this.logs.push({ level: 'debug', message, context, meta: meta[0] });
  }
  
  verbose(message: any, context?: string, ...meta: any[]): void {
    this.logs.push({ level: 'verbose', message, context, meta: meta[0] });
  }
}

/**
 * Options for creating a test module with tracing capabilities.
 */
export interface TracingTestModuleOptions {
  /**
   * Whether to use a mock TracingService instead of the real one.
   * Default is false (uses real TracingService).
   */
  useMockTracer?: boolean;
  
  /**
   * Custom tracing options to configure the TracingService.
   */
  tracingOptions?: Partial<TracingOptions>;
  
  /**
   * Whether to integrate with the LoggerService for trace-log correlation testing.
   * Default is false.
   */
  enableLogCorrelation?: boolean;
  
  /**
   * Journey type to use for journey-specific testing.
   */
  journeyType?: JourneyType;
  
  /**
   * Additional providers to include in the test module.
   */
  providers?: Provider[];
  
  /**
   * Additional imports to include in the test module.
   */
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;
  
  /**
   * Additional module metadata to include in the test module.
   */
  moduleMetadata?: ModuleMetadata;
}

/**
 * Default test configuration for tracing.
 */
const defaultTracingOptions: TracingOptions = {
  serviceName: 'test-service',
  serviceVersion: '1.0.0',
  samplingRatio: 1.0,
  enableDebug: true,
  exporter: {
    type: 'console'
  }
};

/**
 * Creates a NestJS testing module with tracing capabilities.
 * 
 * This function configures a test module with the TracingModule and optional mock implementations.
 * It supports various testing scenarios including mock tracers, journey-specific testing,
 * and trace-log correlation testing.
 * 
 * @param options Configuration options for the test module
 * @returns A promise that resolves to a configured TestingModule
 */
export async function createTracingTestModule(options: TracingTestModuleOptions = {}): Promise<TestingModule> {
  const {
    useMockTracer = false,
    tracingOptions = {},
    enableLogCorrelation = false,
    journeyType,
    providers = [],
    imports = [],
    moduleMetadata = {}
  } = options;
  
  // Merge default and custom tracing options
  const mergedTracingOptions: TracingOptions = {
    ...defaultTracingOptions,
    ...tracingOptions
  };
  
  // Add journey context if specified
  if (journeyType) {
    mergedTracingOptions.journeyContext = journeyType;
  }
  
  // Create config provider for tracing options
  const configServiceProvider: Provider = {
    provide: ConfigService,
    useValue: {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'tracing.serviceName':
            return mergedTracingOptions.serviceName;
          case 'tracing.serviceVersion':
            return mergedTracingOptions.serviceVersion;
          case 'tracing.samplingRatio':
            return mergedTracingOptions.samplingRatio;
          case 'tracing.journeyContext':
            return mergedTracingOptions.journeyContext;
          case 'tracing.enableDebug':
            return mergedTracingOptions.enableDebug;
          case 'tracing.exporter.type':
            return mergedTracingOptions.exporter?.type;
          default:
            return undefined;
        }
      })
    }
  };
  
  // Create module imports
  const moduleImports = [
    ConfigModule,
    TracingModule,
    ...imports
  ];
  
  // Create module providers
  const moduleProviders = [
    configServiceProvider,
    ...providers
  ];
  
  // Add mock tracer if specified
  if (useMockTracer) {
    moduleProviders.push({
      provide: TracingService,
      useClass: MockTracingService
    });
  }
  
  // Add mock logger if log correlation is enabled
  let mockLoggerService: MockLoggerService | undefined;
  if (enableLogCorrelation) {
    mockLoggerService = new MockLoggerService();
    moduleProviders.push({
      provide: 'LoggerService',
      useValue: mockLoggerService
    });
  }
  
  // Create and compile the test module
  const testingModule = await Test.createTestingModule({
    imports: moduleImports,
    providers: moduleProviders,
    ...moduleMetadata
  }).compile();
  
  // Attach the mock logger to the module for test access if it exists
  if (mockLoggerService) {
    (testingModule as any).mockLoggerService = mockLoggerService;
  }
  
  return testingModule;
}

/**
 * Creates a NestJS testing module with a mock TracingService.
 * 
 * This is a convenience function that calls createTracingTestModule with useMockTracer set to true.
 * 
 * @param options Additional configuration options for the test module
 * @returns A promise that resolves to a configured TestingModule with a mock TracingService
 */
export async function createMockTracingTestModule(options: Omit<TracingTestModuleOptions, 'useMockTracer'> = {}): Promise<TestingModule> {
  return createTracingTestModule({
    ...options,
    useMockTracer: true
  });
}

/**
 * Creates a NestJS testing module with journey-specific tracing configuration.
 * 
 * This function configures a test module with journey-specific tracing options,
 * making it suitable for testing journey-specific functionality.
 * 
 * @param journeyType The type of journey to configure (health, care, plan)
 * @param options Additional configuration options for the test module
 * @returns A promise that resolves to a configured TestingModule with journey-specific tracing
 */
export async function createJourneyTracingTestModule(
  journeyType: JourneyType,
  options: Omit<TracingTestModuleOptions, 'journeyType'> = {}
): Promise<TestingModule> {
  return createTracingTestModule({
    ...options,
    journeyType,
    tracingOptions: {
      serviceName: `${journeyType}-journey-service`,
      ...options.tracingOptions
    }
  });
}

/**
 * Creates a NestJS testing module with trace-log correlation capabilities.
 * 
 * This function configures a test module with both tracing and logging services,
 * enabling testing of trace-log correlation functionality.
 * 
 * @param options Additional configuration options for the test module
 * @returns A promise that resolves to a configured TestingModule with trace-log correlation
 */
export async function createTraceLogCorrelationTestModule(options: Omit<TracingTestModuleOptions, 'enableLogCorrelation'> = {}): Promise<TestingModule & { mockLoggerService: MockLoggerService }> {
  return createTracingTestModule({
    ...options,
    enableLogCorrelation: true
  }) as Promise<TestingModule & { mockLoggerService: MockLoggerService }>;
}

/**
 * Creates a NestJS testing module with custom tracing options.
 * 
 * This function allows complete customization of the tracing configuration for testing
 * specific tracing behaviors or edge cases.
 * 
 * @param tracingOptions Custom tracing options to use for the test
 * @param options Additional configuration options for the test module
 * @returns A promise that resolves to a configured TestingModule with custom tracing options
 */
export async function createCustomTracingTestModule(
  tracingOptions: Partial<TracingOptions>,
  options: Omit<TracingTestModuleOptions, 'tracingOptions'> = {}
): Promise<TestingModule> {
  return createTracingTestModule({
    ...options,
    tracingOptions
  });
}