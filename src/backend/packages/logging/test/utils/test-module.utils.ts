import { DynamicModule, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { LoggerModule } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { MockLoggerService } from './mock-logger.utils';

/**
 * Interface for test module configuration options
 */
export interface TestModuleOptions {
  /**
   * Whether to use a real LoggerService (true) or a mock (false)
   * @default false
   */
  useRealLogger?: boolean;
  
  /**
   * Custom logger configuration to use when useRealLogger is true
   */
  loggerConfig?: Partial<LoggerConfig>;
  
  /**
   * Whether to integrate with TracingService for distributed tracing
   * @default false
   */
  withTracing?: boolean;
  
  /**
   * Journey context to use for journey-specific logging
   * Can be 'health', 'care', or 'plan'
   */
  journeyContext?: 'health' | 'care' | 'plan';
  
  /**
   * Additional providers to include in the test module
   */
  providers?: Provider[];
  
  /**
   * Additional imports to include in the test module
   */
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;
  
  /**
   * Additional module metadata to include in the test module
   */
  moduleMetadata?: ModuleMetadata;
}

/**
 * Default test module options
 */
const defaultTestModuleOptions: TestModuleOptions = {
  useRealLogger: false,
  withTracing: false,
  providers: [],
  imports: [],
};

/**
 * Default logger configuration for tests
 */
const defaultTestLoggerConfig: Partial<LoggerConfig> = {
  level: LogLevel.DEBUG,
  prettyPrint: true,
  disableConsole: false,
  disableCloudWatch: true,
  includeTimestamp: true,
  includeContext: true,
};

/**
 * Journey-specific logger configurations
 */
const journeyLoggerConfigs: Record<string, Partial<LoggerConfig>> = {
  health: {
    ...defaultTestLoggerConfig,
    defaultContext: { journey: 'health' },
    serviceName: 'health-service',
  },
  care: {
    ...defaultTestLoggerConfig,
    defaultContext: { journey: 'care' },
    serviceName: 'care-service',
  },
  plan: {
    ...defaultTestLoggerConfig,
    defaultContext: { journey: 'plan' },
    serviceName: 'plan-service',
  },
};

/**
 * Creates a mock TracingService for testing
 */
const createMockTracingService = () => ({
  getCurrentTraceId: jest.fn().mockReturnValue('test-trace-id'),
  getCurrentSpanId: jest.fn().mockReturnValue('test-span-id'),
  startSpan: jest.fn().mockImplementation((name) => ({
    name,
    end: jest.fn(),
  })),
  getTraceContext: jest.fn().mockReturnValue({
    traceId: 'test-trace-id',
    spanId: 'test-span-id',
    sampled: true,
  }),
});

/**
 * Creates a NestJS testing module with configured logging
 * 
 * @param options Configuration options for the test module
 * @returns A TestingModuleBuilder that can be further customized before compilation
 */
export function createTestingModuleWithLogging(
  options: TestModuleOptions = defaultTestModuleOptions,
): TestingModuleBuilder {
  const mergedOptions = { ...defaultTestModuleOptions, ...options };
  
  // Determine logger configuration
  let loggerConfig: Partial<LoggerConfig> = { ...defaultTestLoggerConfig };
  
  // Apply journey-specific configuration if specified
  if (mergedOptions.journeyContext) {
    loggerConfig = {
      ...loggerConfig,
      ...journeyLoggerConfigs[mergedOptions.journeyContext],
    };
  }
  
  // Apply custom configuration if provided
  if (mergedOptions.loggerConfig) {
    loggerConfig = {
      ...loggerConfig,
      ...mergedOptions.loggerConfig,
    };
  }
  
  // Create module metadata
  const moduleMetadata: ModuleMetadata = {
    ...mergedOptions.moduleMetadata,
    imports: [
      ...(mergedOptions.imports || []),
    ],
    providers: [
      ...(mergedOptions.providers || []),
    ],
  };
  
  // Add real or mock logger
  if (mergedOptions.useRealLogger) {
    moduleMetadata.imports.push(
      LoggerModule.forRoot(loggerConfig as LoggerConfig),
    );
  } else {
    moduleMetadata.providers.push({
      provide: LoggerService,
      useClass: MockLoggerService,
    });
  }
  
  // Add tracing if requested
  if (mergedOptions.withTracing) {
    const mockTracingService = createMockTracingService();
    moduleMetadata.providers.push({
      provide: 'TracingService',
      useValue: mockTracingService,
    });
  }
  
  return Test.createTestingModule(moduleMetadata);
}

/**
 * Creates a compiled NestJS testing module with configured logging
 * 
 * @param options Configuration options for the test module
 * @returns A Promise that resolves to a compiled TestingModule
 */
export async function createCompiledTestingModuleWithLogging(
  options: TestModuleOptions = defaultTestModuleOptions,
): Promise<TestingModule> {
  const moduleBuilder = createTestingModuleWithLogging(options);
  return moduleBuilder.compile();
}

/**
 * Creates a test module specifically configured for Health journey testing
 * 
 * @param options Additional configuration options
 * @returns A TestingModuleBuilder configured for Health journey
 */
export function createHealthJourneyTestingModule(
  options: Omit<TestModuleOptions, 'journeyContext'> = {},
): TestingModuleBuilder {
  return createTestingModuleWithLogging({
    ...options,
    journeyContext: 'health',
  });
}

/**
 * Creates a test module specifically configured for Care journey testing
 * 
 * @param options Additional configuration options
 * @returns A TestingModuleBuilder configured for Care journey
 */
export function createCareJourneyTestingModule(
  options: Omit<TestModuleOptions, 'journeyContext'> = {},
): TestingModuleBuilder {
  return createTestingModuleWithLogging({
    ...options,
    journeyContext: 'care',
  });
}

/**
 * Creates a test module specifically configured for Plan journey testing
 * 
 * @param options Additional configuration options
 * @returns A TestingModuleBuilder configured for Plan journey
 */
export function createPlanJourneyTestingModule(
  options: Omit<TestModuleOptions, 'journeyContext'> = {},
): TestingModuleBuilder {
  return createTestingModuleWithLogging({
    ...options,
    journeyContext: 'plan',
  });
}

/**
 * Gets a LoggerService instance from a compiled testing module
 * 
 * @param module The compiled testing module
 * @returns The LoggerService instance
 */
export function getLoggerFromModule(module: TestingModule): LoggerService {
  return module.get<LoggerService>(LoggerService);
}

/**
 * Creates an environment-specific logger configuration for testing
 * 
 * @param env The environment name (e.g., 'test', 'development', 'production')
 * @param overrides Additional configuration overrides
 * @returns A logger configuration for the specified environment
 */
export function createEnvironmentLoggerConfig(
  env: string,
  overrides: Partial<LoggerConfig> = {},
): LoggerConfig {
  const baseConfig: Partial<LoggerConfig> = {
    level: LogLevel.DEBUG,
    prettyPrint: env !== 'production',
    disableConsole: env === 'production',
    disableCloudWatch: env !== 'production',
    includeTimestamp: true,
    includeContext: true,
  };
  
  return { ...baseConfig, ...overrides } as LoggerConfig;
}

/**
 * Creates a test module with a real logger and tracing integration
 * 
 * @param options Additional configuration options
 * @returns A Promise that resolves to a compiled TestingModule
 */
export async function createTracedLoggingTestModule(
  options: Omit<TestModuleOptions, 'useRealLogger' | 'withTracing'> = {},
): Promise<TestingModule> {
  return createCompiledTestingModuleWithLogging({
    ...options,
    useRealLogger: true,
    withTracing: true,
  });
}