/**
 * @file test-module.utils.ts
 * @description Provides utilities for bootstrapping NestJS test modules with properly configured tracing
 * for different test scenarios. Includes functions to create test modules with real or mock TracingService,
 * configure test-specific tracing options, and integrate with LoggerService for correlation testing.
 */

import { DynamicModule, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Context, Span, SpanOptions, Tracer, TracerOptions } from '@opentelemetry/api';

// Import interfaces from the tracing package
import { TracerProvider } from '../../src/interfaces/tracer-provider.interface';
import { TraceContext, JourneyContextInfo } from '../../src/interfaces/trace-context.interface';
import { DEFAULT_SERVICE_NAME } from '../../src/constants/defaults';

// Import interfaces from the logging package
import { LogLevel } from '../../../logging/src/interfaces/log-level.enum';
import { LoggerConfig } from '../../../logging/src/interfaces/log-config.interface';

/**
 * Options for configuring a test module with tracing
 */
export interface TracingTestModuleOptions {
  /**
   * Service name to use for the tracer
   * @default 'test-service'
   */
  serviceName?: string;

  /**
   * Whether to use a mock tracer instead of a real one
   * @default true
   */
  useMockTracer?: boolean;

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

  /**
   * Journey type for journey-specific testing
   */
  journeyType?: 'health' | 'care' | 'plan';

  /**
   * Journey ID for journey-specific testing
   */
  journeyId?: string;

  /**
   * User ID for journey-specific testing
   */
  userId?: string;

  /**
   * Session ID for journey-specific testing
   */
  sessionId?: string;

  /**
   * Request ID for journey-specific testing
   */
  requestId?: string;

  /**
   * Whether to enable trace-log correlation
   * @default true
   */
  enableTraceLogCorrelation?: boolean;

  /**
   * Minimum log level for the test logger
   * @default LogLevel.DEBUG
   */
  logLevel?: LogLevel;

  /**
   * Environment to simulate for the test
   * @default 'test'
   */
  environment?: string;
}

/**
 * Mock implementation of the TracerProvider interface for testing
 */
export class MockTracerProvider implements TracerProvider {
  private spans: Span[] = [];
  private currentSpan?: Span;
  private currentContext: Context = {} as Context;

  getTracer(name: string, options?: TracerOptions): Tracer {
    return {
      startSpan: (name: string, options?: SpanOptions) => {
        const span = this.startSpan(null as unknown as Tracer, name, options);
        return span;
      },
      startActiveSpan: (name: string, options: any, fn: (span: Span) => any) => {
        const span = this.startSpan(null as unknown as Tracer, name, options);
        this.currentSpan = span;
        try {
          return fn(span);
        } finally {
          span.end();
          this.currentSpan = undefined;
        }
      },
    } as unknown as Tracer;
  }

  startSpan(tracer: Tracer, name: string, options?: SpanOptions): Span {
    const span = {
      name,
      spanContext: () => ({
        traceId: 'mock-trace-id',
        spanId: `mock-span-id-${this.spans.length + 1}`,
        traceFlags: 1,
        isRemote: false,
      }),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
      addEvent: jest.fn(),
      setStatus: jest.fn(),
      updateName: jest.fn(),
      end: jest.fn(),
      isRecording: () => true,
      recordException: jest.fn(),
    } as unknown as Span;

    this.spans.push(span);
    return span;
  }

  async withSpan<T>(span: Span, fn: () => Promise<T>): Promise<T> {
    this.currentSpan = span;
    try {
      return await fn();
    } finally {
      this.currentSpan = undefined;
    }
  }

  getCurrentSpan(): Span | undefined {
    return this.currentSpan;
  }

  setSpan(span: Span): Context {
    this.currentSpan = span;
    return this.currentContext;
  }

  getContext(): Context {
    return this.currentContext;
  }

  async withContext<T>(context: Context, fn: () => Promise<T>): Promise<T> {
    const previousContext = this.currentContext;
    this.currentContext = context;
    try {
      return await fn();
    } finally {
      this.currentContext = previousContext;
    }
  }

  /**
   * Gets all spans created by this mock provider
   * @returns Array of spans created during the test
   */
  getSpans(): Span[] {
    return this.spans;
  }

  /**
   * Clears all spans created by this mock provider
   */
  clearSpans(): void {
    this.spans = [];
  }
}

/**
 * Mock implementation of the TraceContext interface for testing
 */
export class MockTraceContext implements TraceContext {
  private context: Context = {} as Context;
  private spanContext?: any;
  private journeyContext?: JourneyContextInfo;
  private attributes: Record<string, any> = {};

  constructor(
    private traceId: string = 'mock-trace-id',
    private spanId: string = 'mock-span-id',
    private traceFlags: number = 1,
  ) {
    this.spanContext = {
      traceId,
      spanId,
      traceFlags,
      isRemote: false,
    };
  }

  getContext(): Context {
    return this.context;
  }

  getSpanContext(): any {
    return this.spanContext;
  }

  getTraceId(): string | undefined {
    return this.traceId;
  }

  getSpanId(): string | undefined {
    return this.spanId;
  }

  getTraceFlags(): number | undefined {
    return this.traceFlags;
  }

  isSampled(): boolean {
    return (this.traceFlags & 1) === 1;
  }

  extractFromHttpHeaders(): TraceContext {
    return this;
  }

  injectIntoHttpHeaders(headers: Record<string, any>): Record<string, any> {
    return {
      ...headers,
      'traceparent': `00-${this.traceId}-${this.spanId}-0${this.traceFlags}`,
    };
  }

  extractFromKafkaMessage(): TraceContext {
    return this;
  }

  injectIntoKafkaMessage(message: any): any {
    return {
      ...message,
      headers: {
        ...message.headers,
        'traceparent': `00-${this.traceId}-${this.spanId}-0${this.traceFlags}`,
      },
    };
  }

  serialize(): string {
    return JSON.stringify({
      traceId: this.traceId,
      spanId: this.spanId,
      traceFlags: this.traceFlags,
      journeyContext: this.journeyContext,
      attributes: this.attributes,
    });
  }

  deserialize(serialized: string): TraceContext {
    const data = JSON.parse(serialized);
    this.traceId = data.traceId;
    this.spanId = data.spanId;
    this.traceFlags = data.traceFlags;
    this.journeyContext = data.journeyContext;
    this.attributes = data.attributes || {};
    return this;
  }

  withJourneyContext(journeyContext: JourneyContextInfo): TraceContext {
    this.journeyContext = journeyContext;
    return this;
  }

  getJourneyContext(): JourneyContextInfo | undefined {
    return this.journeyContext;
  }

  withHealthJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'health',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  withCareJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'care',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  withPlanJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext {
    return this.withJourneyContext({
      journeyType: 'plan',
      journeyId,
      userId,
      sessionId,
      requestId,
    });
  }

  getCorrelationInfo() {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      traceFlags: this.traceFlags,
      isSampled: this.isSampled(),
      journeyType: this.journeyContext?.journeyType,
      journeyId: this.journeyContext?.journeyId,
      userId: this.journeyContext?.userId,
      sessionId: this.journeyContext?.sessionId,
      requestId: this.journeyContext?.requestId,
    };
  }

  createLogContext(additionalContext?: Record<string, any>): Record<string, any> {
    return {
      trace: {
        traceId: this.traceId,
        spanId: this.spanId,
        sampled: this.isSampled(),
      },
      journey: this.journeyContext,
      ...additionalContext,
    };
  }

  withAttributes(attributes: Record<string, any>): TraceContext {
    this.attributes = { ...this.attributes, ...attributes };
    return this;
  }

  hasAttribute(key: string): boolean {
    return key in this.attributes;
  }

  getAttribute(key: string): any {
    return this.attributes[key];
  }
}

/**
 * Mock implementation of the LoggerService for testing
 */
export class MockLoggerService {
  private logs: Array<{ level: string; message: string; context?: any }> = [];

  log(message: string, context?: any): void {
    this.logs.push({ level: 'info', message, context });
  }

  error(message: string, trace?: string, context?: any): void {
    this.logs.push({ level: 'error', message, context: { ...context, trace } });
  }

  warn(message: string, context?: any): void {
    this.logs.push({ level: 'warn', message, context });
  }

  debug(message: string, context?: any): void {
    this.logs.push({ level: 'debug', message, context });
  }

  verbose(message: string, context?: any): void {
    this.logs.push({ level: 'verbose', message, context });
  }

  /**
   * Gets all logs captured by this mock logger
   * @returns Array of logs captured during the test
   */
  getLogs(): Array<{ level: string; message: string; context?: any }> {
    return this.logs;
  }

  /**
   * Clears all logs captured by this mock logger
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Finds logs that match the given criteria
   * @param criteria Object with properties to match against logs
   * @returns Array of matching logs
   */
  findLogs(criteria: { level?: string; message?: string | RegExp; context?: any }): Array<{ level: string; message: string; context?: any }> {
    return this.logs.filter(log => {
      if (criteria.level && log.level !== criteria.level) {
        return false;
      }
      if (criteria.message) {
        if (criteria.message instanceof RegExp) {
          if (!criteria.message.test(log.message)) {
            return false;
          }
        } else if (log.message !== criteria.message) {
          return false;
        }
      }
      if (criteria.context) {
        for (const [key, value] of Object.entries(criteria.context)) {
          if (!log.context || log.context[key] !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }

  /**
   * Checks if a log matching the given criteria exists
   * @param criteria Object with properties to match against logs
   * @returns True if a matching log exists, false otherwise
   */
  hasLog(criteria: { level?: string; message?: string | RegExp; context?: any }): boolean {
    return this.findLogs(criteria).length > 0;
  }
}

/**
 * Mock implementation of the TracingService for testing
 */
export class MockTracingService {
  private tracerProvider: MockTracerProvider;
  private currentContext: MockTraceContext;

  constructor() {
    this.tracerProvider = new MockTracerProvider();
    this.currentContext = new MockTraceContext();
  }

  getTracerProvider(): MockTracerProvider {
    return this.tracerProvider;
  }

  getTracer(name?: string): Tracer {
    return this.tracerProvider.getTracer(name || 'test-tracer');
  }

  startSpan(name: string, options?: SpanOptions): Span {
    const tracer = this.getTracer();
    return this.tracerProvider.startSpan(tracer, name, options);
  }

  getCurrentSpan(): Span | undefined {
    return this.tracerProvider.getCurrentSpan();
  }

  getTraceContext(): MockTraceContext {
    return this.currentContext;
  }

  createTraceContext(traceId?: string, spanId?: string, traceFlags?: number): MockTraceContext {
    return new MockTraceContext(traceId, spanId, traceFlags);
  }

  withHealthJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
    return this.currentContext.withHealthJourney(journeyId, userId, sessionId, requestId) as MockTraceContext;
  }

  withCareJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
    return this.currentContext.withCareJourney(journeyId, userId, sessionId, requestId) as MockTraceContext;
  }

  withPlanJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): MockTraceContext {
    return this.currentContext.withPlanJourney(journeyId, userId, sessionId, requestId) as MockTraceContext;
  }

  /**
   * Gets all spans created during the test
   * @returns Array of spans created during the test
   */
  getSpans(): Span[] {
    return this.tracerProvider.getSpans();
  }

  /**
   * Clears all spans created during the test
   */
  clearSpans(): void {
    this.tracerProvider.clearSpans();
  }
}

/**
 * Creates a testing module with tracing configured according to the provided options
 * @param options Configuration options for the test module
 * @returns TestingModuleBuilder that can be further configured and compiled
 */
export function createTestingModuleWithTracing(options: TracingTestModuleOptions = {}): TestingModuleBuilder {
  const {
    serviceName = 'test-service',
    useMockTracer = true,
    providers = [],
    imports = [],
    moduleMetadata = {},
    enableTraceLogCorrelation = true,
    logLevel = LogLevel.DEBUG,
    environment = 'test',
  } = options;

  // Create mock or real tracing providers based on options
  const tracingProviders: Provider[] = [];
  const loggerProviders: Provider[] = [];

  if (useMockTracer) {
    // Use mock implementations for testing
    const mockTracingService = new MockTracingService();
    const mockLoggerService = new MockLoggerService();

    tracingProviders.push({
      provide: 'TracingService',
      useValue: mockTracingService,
    });

    if (enableTraceLogCorrelation) {
      loggerProviders.push({
        provide: 'LoggerService',
        useValue: mockLoggerService,
      });
    }
  } else {
    // Use real implementations with test configuration
    tracingProviders.push({
      provide: 'TracingService',
      useFactory: (configService: ConfigService) => {
        // This would be the real TracingService implementation
        // but configured for testing purposes
        return {
          // Implement with real TracingService for integration testing
        };
      },
      inject: [ConfigService],
    });

    if (enableTraceLogCorrelation) {
      loggerProviders.push({
        provide: 'LoggerService',
        useFactory: (configService: ConfigService) => {
          // This would be the real LoggerService implementation
          // but configured for testing purposes
          const loggerConfig: LoggerConfig = {
            level: logLevel,
            formatter: environment === 'production' ? 'json' : 'text',
            context: {
              service: serviceName,
              environment,
            },
            enableTracing: true,
            silent: false, // Enable logs during tests
          };

          return {
            // Implement with real LoggerService for integration testing
          };
        },
        inject: [ConfigService],
      });
    }
  }

  // Create config for the test module
  const configProvider: Provider = {
    provide: ConfigService,
    useValue: {
      get: (key: string) => {
        const config: Record<string, any> = {
          'service.name': serviceName,
          'tracing.enabled': true,
          'tracing.serviceName': serviceName,
          'environment': environment,
          'logging.level': logLevel,
        };
        return config[key];
      },
    },
  };

  // Create the test module
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({
          service: {
            name: serviceName,
          },
          tracing: {
            enabled: true,
            serviceName,
          },
          environment,
          logging: {
            level: logLevel,
          },
        })],
      }),
      ...imports,
      ...(moduleMetadata.imports || []),
    ],
    providers: [
      configProvider,
      ...tracingProviders,
      ...loggerProviders,
      ...providers,
      ...(moduleMetadata.providers || []),
    ],
    controllers: [...(moduleMetadata.controllers || [])],
    exports: [...(moduleMetadata.exports || [])],
  });
}

/**
 * Creates a testing module with mock tracing for unit tests
 * @param options Configuration options for the test module
 * @returns Promise resolving to a compiled TestingModule
 */
export async function createTestingModuleWithMockTracing(
  options: TracingTestModuleOptions = {}
): Promise<TestingModule> {
  return createTestingModuleWithTracing({
    ...options,
    useMockTracer: true,
  }).compile();
}

/**
 * Creates a testing module with real tracing for integration tests
 * @param options Configuration options for the test module
 * @returns Promise resolving to a compiled TestingModule
 */
export async function createTestingModuleWithRealTracing(
  options: TracingTestModuleOptions = {}
): Promise<TestingModule> {
  return createTestingModuleWithTracing({
    ...options,
    useMockTracer: false,
  }).compile();
}

/**
 * Creates a testing module with journey-specific tracing configuration
 * @param journeyType Type of journey (health, care, plan)
 * @param options Additional configuration options for the test module
 * @returns Promise resolving to a compiled TestingModule
 */
export async function createJourneyTestingModule(
  journeyType: 'health' | 'care' | 'plan',
  options: Omit<TracingTestModuleOptions, 'journeyType'> = {}
): Promise<TestingModule> {
  const journeyId = options.journeyId || `test-${journeyType}-journey-${Date.now()}`;
  
  const module = await createTestingModuleWithTracing({
    ...options,
    journeyType,
    journeyId,
    serviceName: options.serviceName || `austa-${journeyType}-service`,
  }).compile();

  // Configure journey-specific context if using mock tracer
  if (options.useMockTracer !== false) {
    const tracingService = module.get<MockTracingService>('TracingService');
    
    // Set up the appropriate journey context based on journey type
    switch (journeyType) {
      case 'health':
        tracingService.withHealthJourney(journeyId, options.userId, options.sessionId, options.requestId);
        break;
      case 'care':
        tracingService.withCareJourney(journeyId, options.userId, options.sessionId, options.requestId);
        break;
      case 'plan':
        tracingService.withPlanJourney(journeyId, options.userId, options.sessionId, options.requestId);
        break;
    }
  }

  return module;
}

/**
 * Creates a testing module specifically for the Health journey
 * @param options Configuration options for the test module
 * @returns Promise resolving to a compiled TestingModule
 */
export async function createHealthJourneyTestingModule(
  options: Omit<TracingTestModuleOptions, 'journeyType'> = {}
): Promise<TestingModule> {
  return createJourneyTestingModule('health', options);
}

/**
 * Creates a testing module specifically for the Care journey
 * @param options Configuration options for the test module
 * @returns Promise resolving to a compiled TestingModule
 */
export async function createCareJourneyTestingModule(
  options: Omit<TracingTestModuleOptions, 'journeyType'> = {}
): Promise<TestingModule> {
  return createJourneyTestingModule('care', options);
}

/**
 * Creates a testing module specifically for the Plan journey
 * @param options Configuration options for the test module
 * @returns Promise resolving to a compiled TestingModule
 */
export async function createPlanJourneyTestingModule(
  options: Omit<TracingTestModuleOptions, 'journeyType'> = {}
): Promise<TestingModule> {
  return createJourneyTestingModule('plan', options);
}