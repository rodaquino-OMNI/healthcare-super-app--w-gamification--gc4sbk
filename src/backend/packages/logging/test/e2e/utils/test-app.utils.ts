import { DynamicModule, INestApplication, ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import from the logging package
import { LoggerModule } from '../../../src/logger.module';
import { LoggerService } from '../../../src/logger.service';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LoggerConfig } from '../../../src/interfaces/log-config.interface';

// Import from the tracing package
import { TracingModule } from '@austa/tracing';
import { TracingService } from '@austa/tracing';

// Import test fixtures
import { configOptions } from '../../fixtures/config-options.fixture';
import { journeyData } from '../../fixtures/journey-data.fixture';

/**
 * Options for creating a test application with logging configured
 */
export interface TestAppOptions {
  /**
   * Additional modules to import in the test module
   */
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;
  
  /**
   * Additional providers to include in the test module
   */
  providers?: ModuleMetadata['providers'];
  
  /**
   * Additional controllers to include in the test module
   */
  controllers?: ModuleMetadata['controllers'];
  
  /**
   * Logger configuration options
   */
  loggerConfig?: Partial<LoggerConfig>;
  
  /**
   * Whether to use the tracing module
   * @default true
   */
  useTracing?: boolean;
  
  /**
   * Environment variables to set for the test
   */
  env?: Record<string, string>;
  
  /**
   * Journey type to use for the test
   * @default undefined - no journey context
   */
  journeyType?: 'health' | 'care' | 'plan';
}

/**
 * Default test application options
 */
const defaultTestAppOptions: TestAppOptions = {
  imports: [],
  providers: [],
  controllers: [],
  loggerConfig: configOptions.testing,
  useTracing: true,
  env: {},
  journeyType: undefined,
};

/**
 * Sets environment variables for the test
 * @param env Environment variables to set
 * @returns A cleanup function to restore the original environment
 */
export function setTestEnvironment(env: Record<string, string>): () => void {
  const originalEnv: Record<string, string | undefined> = {};
  
  // Save original values and set new ones
  Object.keys(env).forEach(key => {
    originalEnv[key] = process.env[key];
    process.env[key] = env[key];
  });
  
  // Return cleanup function
  return () => {
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  };
}

/**
 * Creates a test module with LoggerModule and optional TracingModule
 * @param options Test application options
 * @returns A TestingModule instance
 */
export async function createTestModule(options: TestAppOptions = {}): Promise<TestingModule> {
  const opts = { ...defaultTestAppOptions, ...options };
  const cleanup = setTestEnvironment(opts.env || {});
  
  try {
    // Create imports array with ConfigModule and LoggerModule
    const imports = [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({ logger: opts.loggerConfig })],
      }),
      LoggerModule.forRoot(opts.loggerConfig),
      ...opts.imports || [],
    ];
    
    // Add TracingModule if enabled
    if (opts.useTracing) {
      imports.push(TracingModule.forRoot({
        serviceName: 'test-service',
        disabled: process.env.DISABLE_TRACING === 'true',
      }));
    }
    
    // Create the test module
    return Test.createTestingModule({
      imports,
      providers: opts.providers || [],
      controllers: opts.controllers || [],
    }).compile();
  } catch (error) {
    // Clean up environment variables in case of error
    cleanup();
    throw error;
  }
}

/**
 * Creates a test application with LoggerModule and optional TracingModule
 * @param options Test application options
 * @returns A NestJS application instance and a cleanup function
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<{ app: INestApplication; cleanup: () => void }> {
  const opts = { ...defaultTestAppOptions, ...options };
  const cleanup = setTestEnvironment(opts.env || {});
  
  try {
    const moduleRef = await createTestModule(opts);
    const app = moduleRef.createNestApplication();
    
    // Get the logger service
    const logger = app.get(LoggerService);
    
    // Set up journey context if specified
    if (opts.journeyType) {
      const journeyContext = getJourneyContext(opts.journeyType);
      logger.setContext(journeyContext);
    }
    
    await app.init();
    
    return { 
      app, 
      cleanup: () => {
        cleanup();
        return app.close();
      }
    };
  } catch (error) {
    // Clean up environment variables in case of error
    cleanup();
    throw error;
  }
}

/**
 * Creates a controller class with methods that log at different levels
 * @returns A controller class for testing logging
 */
export function createTestController() {
  class TestController {
    constructor(private readonly logger: LoggerService) {}
    
    logDebug(message: string, context?: Record<string, any>) {
      this.logger.debug(message, context);
      return { message, level: 'debug' };
    }
    
    logInfo(message: string, context?: Record<string, any>) {
      this.logger.log(message, context);
      return { message, level: 'info' };
    }
    
    logWarn(message: string, context?: Record<string, any>) {
      this.logger.warn(message, context);
      return { message, level: 'warn' };
    }
    
    logError(message: string, error?: Error, context?: Record<string, any>) {
      this.logger.error(message, error?.stack, context);
      return { message, level: 'error' };
    }
    
    throwError(message: string) {
      throw new Error(message);
    }
  }
  
  return TestController;
}

/**
 * Gets a journey context object for the specified journey type
 * @param journeyType The type of journey (health, care, plan)
 * @returns A journey context object
 */
export function getJourneyContext(journeyType: 'health' | 'care' | 'plan') {
  switch (journeyType) {
    case 'health':
      return journeyData.healthJourney.context;
    case 'care':
      return journeyData.careJourney.context;
    case 'plan':
      return journeyData.planJourney.context;
    default:
      throw new Error(`Unknown journey type: ${journeyType}`);
  }
}

/**
 * Creates a test module with a controller that logs at different levels
 * @param options Test application options
 * @returns A TestingModule instance with the test controller
 */
export async function createTestModuleWithController(options: TestAppOptions = {}): Promise<TestingModule> {
  const TestController = createTestController();
  
  return createTestModule({
    ...options,
    controllers: [...(options.controllers || []), TestController],
  });
}

/**
 * Creates a test application with a controller that logs at different levels
 * @param options Test application options
 * @returns A NestJS application instance with the test controller and a cleanup function
 */
export async function createTestAppWithController(options: TestAppOptions = {}): Promise<{ app: INestApplication; cleanup: () => void }> {
  const TestController = createTestController();
  
  return createTestApp({
    ...options,
    controllers: [...(options.controllers || []), TestController],
  });
}

/**
 * Sets the log level for a test
 * @param level The log level to set
 * @returns A cleanup function to restore the original log level
 */
export function setTestLogLevel(level: LogLevel | string): () => void {
  return setTestEnvironment({
    LOG_LEVEL: level.toString(),
  });
}

/**
 * Configures the logger for a specific journey
 * @param journeyType The type of journey (health, care, plan)
 * @param loggerConfig Logger configuration options
 * @returns Test application options with journey-specific configuration
 */
export function configureJourneyLogger(
  journeyType: 'health' | 'care' | 'plan',
  loggerConfig?: Partial<LoggerConfig>
): TestAppOptions {
  const journeyContext = getJourneyContext(journeyType);
  
  return {
    journeyType,
    loggerConfig: {
      ...configOptions.testing,
      ...loggerConfig,
      defaultContext: {
        ...configOptions.testing.defaultContext,
        journey: journeyContext,
      },
    },
  };
}