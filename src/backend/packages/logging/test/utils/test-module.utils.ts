/**
 * @file Test Module Utilities
 * @description Provides utilities for bootstrapping NestJS test modules with properly configured logging.
 * Includes functions to create test modules with real or mock LoggerService, configure test-specific
 * logging options, and integrate with other services like tracing.
 *
 * @module @austa/logging/test/utils
 */

import { DynamicModule, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { Logger } from '../../src/interfaces/logger.interface';
import { JourneyType } from '../../src/interfaces/log-entry.interface';

/**
 * Mock implementation of the Logger interface for testing.
 * Records all log calls for verification in tests.
 */
export class MockLoggerService implements Logger {
  public logs: { level: string; message: string; context?: any }[] = [];
  public errors: { message: string; trace?: string | Error; context?: any }[] = [];
  public debugLogs: { message: string; context?: any }[] = [];
  public infoLogs: { message: string; context?: any }[] = [];
  public warnLogs: { message: string; context?: any }[] = [];
  public errorLogs: { message: string; trace?: string | Error; context?: any }[] = [];
  public fatalLogs: { message: string; trace?: string | Error; context?: any }[] = [];
  
  // Journey-specific logs
  public healthLogs: { level: string; message: string; resourceId?: string; context?: any }[] = [];
  public careLogs: { level: string; message: string; resourceId?: string; context?: any }[] = [];
  public planLogs: { level: string; message: string; resourceId?: string; context?: any }[] = [];

  private currentLogLevel: LogLevel = LogLevel.DEBUG;
  private currentContext: Record<string, any> = {};

  // Basic NestJS LoggerService implementation
  log(message: string, context?: string | any): void {
    this.logs.push({ level: 'info', message, context });
    this.infoLogs.push({ message, context });
  }

  error(message: string, trace?: string | Error, context?: string | any): void {
    this.logs.push({ level: 'error', message, context });
    this.errors.push({ message, trace, context });
    this.errorLogs.push({ message, trace, context });
  }

  warn(message: string, context?: string | any): void {
    this.logs.push({ level: 'warn', message, context });
    this.warnLogs.push({ message, context });
  }

  debug(message: string, context?: string | any): void {
    this.logs.push({ level: 'debug', message, context });
    this.debugLogs.push({ message, context });
  }

  verbose(message: string, context?: string | any): void {
    this.logs.push({ level: 'verbose', message, context });
    this.debugLogs.push({ message, context });
  }

  // Extended Logger interface implementation
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    return level >= this.currentLogLevel;
  }

  createChildLogger(context: any): Logger {
    const childLogger = new MockLoggerService();
    childLogger.setContext({ ...this.currentContext, ...context });
    return childLogger;
  }

  setContext(context: any): void {
    this.currentContext = context;
  }

  addContext(context: any): void {
    this.currentContext = { ...this.currentContext, ...context };
  }

  clearContext(): void {
    this.currentContext = {};
  }

  getContext(): any {
    return this.currentContext;
  }

  info(message: string, context?: string | any): void {
    this.log(message, context);
  }

  fatal(message: string, trace?: string | Error, context?: string | any): void {
    this.logs.push({ level: 'fatal', message, context });
    this.fatalLogs.push({ message, trace, context });
  }

  logError(error: Error | string, context?: string | any): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.error(message, trace, context);
  }

  logFatal(error: Error | string, context?: string | any): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.fatal(message, trace, context);
  }

  // Journey-specific logging methods
  debugHealth(message: string, resourceId?: string, context?: string | any): void {
    this.healthLogs.push({ level: 'debug', message, resourceId, context });
    this.debug(message, this.createJourneyContext('health', resourceId, context));
  }

  logHealth(message: string, resourceId?: string, context?: string | any): void {
    this.healthLogs.push({ level: 'info', message, resourceId, context });
    this.log(message, this.createJourneyContext('health', resourceId, context));
  }

  warnHealth(message: string, resourceId?: string, context?: string | any): void {
    this.healthLogs.push({ level: 'warn', message, resourceId, context });
    this.warn(message, this.createJourneyContext('health', resourceId, context));
  }

  errorHealth(message: string, trace?: string | Error, resourceId?: string, context?: string | any): void {
    this.healthLogs.push({ level: 'error', message, resourceId, context });
    this.error(message, trace, this.createJourneyContext('health', resourceId, context));
  }

  logErrorHealth(error: Error | string, resourceId?: string, context?: string | any): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.errorHealth(message, trace, resourceId, context);
  }

  debugCare(message: string, resourceId?: string, context?: string | any): void {
    this.careLogs.push({ level: 'debug', message, resourceId, context });
    this.debug(message, this.createJourneyContext('care', resourceId, context));
  }

  logCare(message: string, resourceId?: string, context?: string | any): void {
    this.careLogs.push({ level: 'info', message, resourceId, context });
    this.log(message, this.createJourneyContext('care', resourceId, context));
  }

  warnCare(message: string, resourceId?: string, context?: string | any): void {
    this.careLogs.push({ level: 'warn', message, resourceId, context });
    this.warn(message, this.createJourneyContext('care', resourceId, context));
  }

  errorCare(message: string, trace?: string | Error, resourceId?: string, context?: string | any): void {
    this.careLogs.push({ level: 'error', message, resourceId, context });
    this.error(message, trace, this.createJourneyContext('care', resourceId, context));
  }

  logErrorCare(error: Error | string, resourceId?: string, context?: string | any): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.errorCare(message, trace, resourceId, context);
  }

  debugPlan(message: string, resourceId?: string, context?: string | any): void {
    this.planLogs.push({ level: 'debug', message, resourceId, context });
    this.debug(message, this.createJourneyContext('plan', resourceId, context));
  }

  logPlan(message: string, resourceId?: string, context?: string | any): void {
    this.planLogs.push({ level: 'info', message, resourceId, context });
    this.log(message, this.createJourneyContext('plan', resourceId, context));
  }

  warnPlan(message: string, resourceId?: string, context?: string | any): void {
    this.planLogs.push({ level: 'warn', message, resourceId, context });
    this.warn(message, this.createJourneyContext('plan', resourceId, context));
  }

  errorPlan(message: string, trace?: string | Error, resourceId?: string, context?: string | any): void {
    this.planLogs.push({ level: 'error', message, resourceId, context });
    this.error(message, trace, this.createJourneyContext('plan', resourceId, context));
  }

  logErrorPlan(error: Error | string, resourceId?: string, context?: string | any): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.errorPlan(message, trace, resourceId, context);
  }

  logWithLevel(level: LogLevel, message: string, context?: string | any): void {
    switch (level) {
      case LogLevel.DEBUG:
        this.debug(message, context);
        break;
      case LogLevel.INFO:
        this.log(message, context);
        break;
      case LogLevel.WARN:
        this.warn(message, context);
        break;
      case LogLevel.ERROR:
        this.error(message, undefined, context);
        break;
      case LogLevel.FATAL:
        this.fatal(message, undefined, context);
        break;
    }
  }

  logWithJourney(level: LogLevel, journeyType: 'health' | 'care' | 'plan', message: string, resourceId?: string, context?: string | any): void {
    const journeyContext = this.createJourneyContext(journeyType, resourceId, context);
    this.logWithLevel(level, message, journeyContext);
  }

  startTimer(label: string, level?: LogLevel, context?: string | any): () => void {
    const start = Date.now();
    return () => {
      const elapsed = Date.now() - start;
      this.logWithLevel(level || LogLevel.INFO, `${label}: ${elapsed}ms`, context);
    };
  }

  logOperation(operation: string, context?: string | any): (result?: string) => void {
    this.log(`Starting operation: ${operation}`, context);
    return (result?: string) => {
      this.log(`Completed operation: ${operation}${result ? ` - ${result}` : ''}`, context);
    };
  }

  logJourneyOperation(journeyType: 'health' | 'care' | 'plan', operation: string, resourceId?: string, context?: string | any): (result?: string) => void {
    const journeyContext = this.createJourneyContext(journeyType, resourceId, context);
    return this.logOperation(operation, journeyContext);
  }

  async flush(): Promise<void> {
    // No-op for mock implementation
    return Promise.resolve();
  }

  // Helper method to create journey context
  private createJourneyContext(journeyType: 'health' | 'care' | 'plan', resourceId?: string, context?: string | any): any {
    const journeyContext = {
      journey: {
        type: journeyType,
        resourceId
      }
    };

    if (typeof context === 'string') {
      return { ...journeyContext, context };
    }

    return { ...journeyContext, ...(context || {}) };
  }

  // Helper method to reset all logs (useful for test cleanup)
  reset(): void {
    this.logs = [];
    this.errors = [];
    this.debugLogs = [];
    this.infoLogs = [];
    this.warnLogs = [];
    this.errorLogs = [];
    this.fatalLogs = [];
    this.healthLogs = [];
    this.careLogs = [];
    this.planLogs = [];
    this.clearContext();
  }
}

/**
 * Options for creating a test module with logging
 */
export interface CreateTestModuleOptions {
  /**
   * Imports to include in the test module
   */
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;
  
  /**
   * Controllers to include in the test module
   */
  controllers?: Type<any>[];
  
  /**
   * Providers to include in the test module
   */
  providers?: Provider[];
  
  /**
   * Whether to use a mock logger (true) or real logger (false)
   * @default true
   */
  useMockLogger?: boolean;
  
  /**
   * Configuration for the real logger (if useMockLogger is false)
   */
  loggerConfig?: LoggerConfig;
  
  /**
   * Whether to include a mock TracingService
   * @default false
   */
  includeTracing?: boolean;
  
  /**
   * The journey type to use for journey-specific logging
   */
  journeyType?: 'health' | 'care' | 'plan';
  
  /**
   * Additional module metadata
   */
  moduleMetadata?: Partial<ModuleMetadata>;
}

/**
 * Mock implementation of the TracingService for testing
 */
export class MockTracingService {
  private traceId: string = 'test-trace-id';
  private spanId: string = 'test-span-id';

  getCurrentTraceId(): string {
    return this.traceId;
  }

  getCurrentSpanId(): string {
    return this.spanId;
  }

  setCurrentTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  setCurrentSpanId(spanId: string): void {
    this.spanId = spanId;
  }

  startSpan(name: string): any {
    return {
      end: () => {}
    };
  }

  withSpan<T>(name: string, fn: () => T): T {
    return fn();
  }

  async withAsyncSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return await fn();
  }
}

/**
 * Creates a test module with properly configured logging
 * 
 * @param options - Options for creating the test module
 * @returns A promise that resolves to the configured TestingModule
 */
export async function createTestModule(options: CreateTestModuleOptions = {}): Promise<TestingModule> {
  const {
    imports = [],
    controllers = [],
    providers = [],
    useMockLogger = true,
    loggerConfig = {},
    includeTracing = false,
    journeyType,
    moduleMetadata = {}
  } = options;

  // Create the base module metadata
  const metadata: ModuleMetadata = {
    imports: [...imports],
    controllers: [...controllers],
    providers: [...providers],
    ...moduleMetadata
  };

  // Add mock or real logger
  if (useMockLogger) {
    const mockLogger = new MockLoggerService();
    metadata.providers.push({
      provide: LoggerService,
      useValue: mockLogger
    });
  } else {
    // Configure real logger for testing
    const testLoggerConfig: LoggerConfig = {
      logLevel: 'DEBUG',
      transports: ['console'],
      formatter: 'text',
      serviceName: 'test-service',
      ...loggerConfig
    };

    // If tracing is included, we need to provide the TracingService
    if (includeTracing) {
      const mockTracingService = new MockTracingService();
      metadata.providers.push({
        provide: 'TracingService',
        useValue: mockTracingService
      });

      metadata.providers.push({
        provide: LoggerService,
        useFactory: () => new LoggerService(testLoggerConfig, mockTracingService)
      });
    } else {
      metadata.providers.push({
        provide: LoggerService,
        useFactory: () => new LoggerService(testLoggerConfig)
      });
    }
  }

  // Create and configure the test module
  const testModule = await Test.createTestingModule(metadata).compile();
  
  // Configure journey-specific logging if needed
  if (journeyType) {
    const logger = testModule.get<LoggerService>(LoggerService);
    
    // Apply journey context based on the specified journey type
    switch (journeyType) {
      case 'health':
        testModule.useLogger(logger['forHealthJourney']());
        break;
      case 'care':
        testModule.useLogger(logger['forCareJourney']());
        break;
      case 'plan':
        testModule.useLogger(logger['forPlanJourney']());
        break;
    }
  }

  return testModule;
}

/**
 * Creates a test module with a mock logger
 * 
 * @param options - Options for creating the test module
 * @returns A promise that resolves to the configured TestingModule with a mock logger
 */
export async function createTestModuleWithMockLogger(options: Omit<CreateTestModuleOptions, 'useMockLogger'> = {}): Promise<TestingModule> {
  return createTestModule({
    ...options,
    useMockLogger: true
  });
}

/**
 * Creates a test module with a real logger
 * 
 * @param options - Options for creating the test module
 * @returns A promise that resolves to the configured TestingModule with a real logger
 */
export async function createTestModuleWithRealLogger(options: Omit<CreateTestModuleOptions, 'useMockLogger'> = {}): Promise<TestingModule> {
  return createTestModule({
    ...options,
    useMockLogger: false
  });
}

/**
 * Creates a test module with journey-specific logging
 * 
 * @param journeyType - The journey type to use for logging
 * @param options - Additional options for creating the test module
 * @returns A promise that resolves to the configured TestingModule with journey-specific logging
 */
export async function createJourneyTestModule(
  journeyType: 'health' | 'care' | 'plan',
  options: Omit<CreateTestModuleOptions, 'journeyType'> = {}
): Promise<TestingModule> {
  return createTestModule({
    ...options,
    journeyType
  });
}

/**
 * Creates a test module for the Health journey
 * 
 * @param options - Options for creating the test module
 * @returns A promise that resolves to the configured TestingModule for the Health journey
 */
export async function createHealthJourneyTestModule(options: Omit<CreateTestModuleOptions, 'journeyType'> = {}): Promise<TestingModule> {
  return createJourneyTestModule('health', options);
}

/**
 * Creates a test module for the Care journey
 * 
 * @param options - Options for creating the test module
 * @returns A promise that resolves to the configured TestingModule for the Care journey
 */
export async function createCareJourneyTestModule(options: Omit<CreateTestModuleOptions, 'journeyType'> = {}): Promise<TestingModule> {
  return createJourneyTestModule('care', options);
}

/**
 * Creates a test module for the Plan journey
 * 
 * @param options - Options for creating the test module
 * @returns A promise that resolves to the configured TestingModule for the Plan journey
 */
export async function createPlanJourneyTestModule(options: Omit<CreateTestModuleOptions, 'journeyType'> = {}): Promise<TestingModule> {
  return createJourneyTestModule('plan', options);
}

/**
 * Gets the mock logger from a test module
 * 
 * @param testModule - The test module
 * @returns The mock logger instance
 * @throws Error if the logger is not a MockLoggerService
 */
export function getTestLogger(testModule: TestingModule): MockLoggerService {
  const logger = testModule.get<LoggerService>(LoggerService);
  
  if (!(logger instanceof MockLoggerService)) {
    throw new Error('Logger is not a MockLoggerService. Make sure you created the test module with useMockLogger=true');
  }
  
  return logger;
}

/**
 * Resets the mock logger in a test module
 * 
 * @param testModule - The test module
 * @throws Error if the logger is not a MockLoggerService
 */
export function resetTestLogger(testModule: TestingModule): void {
  const logger = getTestLogger(testModule);
  logger.reset();
}

/**
 * Creates a test-specific logger configuration
 * 
 * @param overrides - Configuration overrides
 * @returns The test logger configuration
 */
export function createTestLoggerConfig(overrides: Partial<LoggerConfig> = {}): LoggerConfig {
  return {
    logLevel: 'DEBUG',
    transports: ['console'],
    formatter: 'text',
    serviceName: 'test-service',
    ...overrides
  };
}