import { DynamicModule, INestApplication, ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '../../../src';
import { LoggerConfig } from '../../../src/interfaces/log-config.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Options for creating a test application with logging configured
 */
export interface TestAppOptions {
  /**
   * Additional modules to import into the test application
   */
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;
  
  /**
   * Additional providers to register in the test application
   */
  providers?: any[];
  
  /**
   * Controllers to register in the test application
   */
  controllers?: Type<any>[];
  
  /**
   * Logger configuration options
   */
  loggerConfig?: Partial<LoggerConfig>;
  
  /**
   * Whether to include the TracingModule in the test application
   * @default true
   */
  includeTracing?: boolean;
  
  /**
   * Whether to include the ExceptionsModule in the test application
   * @default true
   */
  includeExceptions?: boolean;
}

/**
 * Default logger configuration for testing
 */
const defaultLoggerConfig: Partial<LoggerConfig> = {
  level: LogLevel.DEBUG,
  serviceName: 'test-service',
  environment: 'test',
  prettyPrint: false,
  transports: ['console'],
};

/**
 * Creates a test module with the LoggerModule and optional additional modules
 * @param options Configuration options for the test module
 * @returns A Promise resolving to a TestingModule
 */
export async function createTestModule(options: TestAppOptions = {}): Promise<TestingModule> {
  const {
    imports = [],
    providers = [],
    controllers = [],
    loggerConfig = {},
    includeTracing = true,
    includeExceptions = true,
  } = options;
  
  const moduleImports: Array<Type<any> | DynamicModule | Promise<DynamicModule>> = [
    LoggerModule.forRoot({
      ...defaultLoggerConfig,
      ...loggerConfig,
    }),
    ...imports,
  ];
  
  // Conditionally import TracingModule if available and requested
  if (includeTracing) {
    try {
      // Dynamic import to avoid direct dependency
      const { TracingModule } = await import('@austa/tracing');
      moduleImports.push(
        TracingModule.forRoot({
          serviceName: loggerConfig.serviceName || defaultLoggerConfig.serviceName,
          environment: loggerConfig.environment || defaultLoggerConfig.environment,
          enabled: true,
        })
      );
    } catch (error) {
      // TracingModule not available, continue without it
      console.warn('TracingModule not available, continuing without tracing support');
    }
  }
  
  // Conditionally import ExceptionsModule if available and requested
  if (includeExceptions) {
    try {
      // Dynamic import to avoid direct dependency
      const { ExceptionsModule } = await import('@austa/errors');
      moduleImports.push(ExceptionsModule.forRoot());
    } catch (error) {
      // ExceptionsModule not available, continue without it
      console.warn('ExceptionsModule not available, continuing without exception handling');
    }
  }
  
  const moduleMetadata: ModuleMetadata = {
    imports: moduleImports,
    providers,
    controllers,
  };
  
  return Test.createTestingModule(moduleMetadata).compile();
}

/**
 * Creates a test application with the LoggerModule and optional additional modules
 * @param options Configuration options for the test application
 * @returns A Promise resolving to a configured NestJS application
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication> {
  const moduleRef = await createTestModule(options);
  const app = moduleRef.createNestApplication();
  
  // Initialize the application
  await app.init();
  
  return app;
}

/**
 * Creates a test module with journey-specific logging configuration
 * @param journeyName The name of the journey (health, care, plan)
 * @param options Additional configuration options for the test module
 * @returns A Promise resolving to a TestingModule
 */
export async function createJourneyTestModule(
  journeyName: 'health' | 'care' | 'plan',
  options: TestAppOptions = {}
): Promise<TestingModule> {
  const journeyLoggerConfig: Partial<LoggerConfig> = {
    ...options.loggerConfig,
    serviceName: `${journeyName}-service`,
    context: {
      journey: journeyName,
      journeyId: `test-${journeyName}-journey-${Date.now()}`,
    },
  };
  
  return createTestModule({
    ...options,
    loggerConfig: journeyLoggerConfig,
  });
}

/**
 * Creates a test application with journey-specific logging configuration
 * @param journeyName The name of the journey (health, care, plan)
 * @param options Additional configuration options for the test application
 * @returns A Promise resolving to a configured NestJS application
 */
export async function createJourneyTestApp(
  journeyName: 'health' | 'care' | 'plan',
  options: TestAppOptions = {}
): Promise<INestApplication> {
  const moduleRef = await createJourneyTestModule(journeyName, options);
  const app = moduleRef.createNestApplication();
  
  // Initialize the application
  await app.init();
  
  return app;
}

/**
 * Creates a mock controller for testing logging functionality
 * @param controllerName Name of the controller
 * @returns A controller class with methods that exercise different logging scenarios
 */
export function createMockController(controllerName: string): Type<any> {
  class MockController {
    constructor(private readonly logger: any) {}
    
    getInfo() {
      this.logger.log(`Info log from ${controllerName}`);
      return { message: 'Info endpoint called' };
    }
    
    getWarning() {
      this.logger.warn(`Warning log from ${controllerName}`);
      return { message: 'Warning endpoint called' };
    }
    
    getError() {
      this.logger.error(`Error log from ${controllerName}`);
      return { message: 'Error endpoint called' };
    }
    
    getDebug() {
      this.logger.debug(`Debug log from ${controllerName}`);
      return { message: 'Debug endpoint called' };
    }
    
    throwError() {
      throw new Error(`Test error from ${controllerName}`);
    }
  }
  
  return MockController;
}

/**
 * Closes a test application and performs cleanup
 * @param app The NestJS application to close
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}