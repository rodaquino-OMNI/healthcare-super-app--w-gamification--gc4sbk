import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';
import { LoggerModule } from '../../src';
import { LoggerService } from '../../src';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { Transport } from '../../src/interfaces/transport.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LogEntry } from '../../src/formatters/formatter.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { LoggingContext } from '../../src/context/context.interface';

/**
 * Mock implementation of the TracingService for testing purposes.
 * This mock provides controlled trace context for integration tests.
 */
export class MockTracingService {
  private traceId: string = 'test-trace-id';
  private spanId: string = 'test-span-id';

  /**
   * Gets the current trace ID
   */
  getCurrentTraceId(): string {
    return this.traceId;
  }

  /**
   * Gets the current span ID
   */
  getCurrentSpanId(): string {
    return this.spanId;
  }

  /**
   * Sets a custom trace ID for testing
   */
  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  /**
   * Sets a custom span ID for testing
   */
  setSpanId(spanId: string): void {
    this.spanId = spanId;
  }

  /**
   * Creates a new span for the given operation
   * @param name Operation name
   * @param options Span options
   */
  createSpan(name: string, options?: any): any {
    return {
      name,
      traceId: this.traceId,
      spanId: this.spanId,
      end: jest.fn(),
      setAttributes: jest.fn(),
      recordException: jest.fn(),
      setStatus: jest.fn(),
    };
  }

  /**
   * Injects trace context into carrier object
   */
  inject(carrier: any): void {
    carrier['traceparent'] = `00-${this.traceId}-${this.spanId}-01`;
  }

  /**
   * Extracts trace context from carrier object
   */
  extract(carrier: any): any {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
    };
  }
}

/**
 * Mock transport implementation that captures logs for testing
 */
export class CapturingTransport implements Transport {
  public logs: LogEntry[] = [];
  public name = 'capturing-transport';
  public initialized = false;
  public closed = false;
  public formatter: Formatter;

  constructor(formatter: Formatter) {
    this.formatter = formatter;
  }

  /**
   * Initializes the transport
   */
  async initialize(): Promise<void> {
    this.initialized = true;
    this.logs = [];
  }

  /**
   * Writes a log entry to the internal logs array
   */
  async write(entry: LogEntry): Promise<void> {
    this.logs.push({ ...entry });
  }

  /**
   * Closes the transport
   */
  async close(): Promise<void> {
    this.closed = true;
  }

  /**
   * Gets all captured logs
   */
  getCapturedLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Clears all captured logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Gets logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Gets logs containing a specific message substring
   */
  getLogsByMessage(messageSubstring: string): LogEntry[] {
    return this.logs.filter(log => 
      typeof log.message === 'string' && log.message.includes(messageSubstring)
    );
  }

  /**
   * Gets logs with a specific context property value
   */
  getLogsByContextProperty(property: string, value: any): LogEntry[] {
    return this.logs.filter(log => 
      log.context && log.context[property] === value
    );
  }
}

/**
 * Mock formatter that returns the log entry as-is for testing
 */
export class PassthroughFormatter implements Formatter {
  format(entry: LogEntry): string {
    return JSON.stringify(entry);
  }
}

/**
 * Creates test fixtures for different context types
 */
export class ContextFixtures {
  /**
   * Creates a basic logging context
   */
  static createBaseContext(): LoggingContext {
    return {
      correlationId: 'test-correlation-id',
      timestamp: new Date().toISOString(),
      service: 'test-service',
      environment: 'test',
    };
  }

  /**
   * Creates a request context for testing
   */
  static createRequestContext(): RequestContext {
    return {
      ...this.createBaseContext(),
      requestId: 'test-request-id',
      method: 'GET',
      url: '/test/path',
      userAgent: 'Test User Agent',
      ip: '127.0.0.1',
      path: '/test/path',
      params: { id: '123' },
      headers: { 'content-type': 'application/json' },
    };
  }

  /**
   * Creates a user context for testing
   */
  static createUserContext(): UserContext {
    return {
      ...this.createBaseContext(),
      userId: 'test-user-id',
      isAuthenticated: true,
      roles: ['user'],
      permissions: ['read:profile'],
    };
  }

  /**
   * Creates a journey context for testing
   */
  static createJourneyContext(journeyType: 'health' | 'care' | 'plan' = 'health'): JourneyContext {
    return {
      ...this.createBaseContext(),
      journeyType,
      journeyState: { currentStep: 'test-step' },
      journeyId: 'test-journey-id',
    };
  }

  /**
   * Creates a combined context with request, user, and journey information
   */
  static createCombinedContext(): LoggingContext {
    return {
      ...this.createRequestContext(),
      ...this.createUserContext(),
      ...this.createJourneyContext(),
    };
  }
}

/**
 * Configuration for test logger module
 */
export interface TestLoggerModuleConfig {
  /**
   * Custom logger configuration
   */
  loggerConfig?: Partial<LoggerConfig>;
  
  /**
   * Additional providers to include in the test module
   */
  providers?: any[];
  
  /**
   * Additional imports to include in the test module
   */
  imports?: any[];
}

/**
 * Creates a test module with the LoggerModule and optional additional configuration
 */
export async function createTestLoggerModule(
  config: TestLoggerModuleConfig = {}
): Promise<TestingModule> {
  const { loggerConfig = {}, providers = [], imports = [] } = config;
  
  // Create a capturing transport for testing
  const formatter = new PassthroughFormatter();
  const transport = new CapturingTransport(formatter);
  
  // Default test configuration
  const defaultConfig: LoggerConfig = {
    level: LogLevel.DEBUG,
    service: 'test-service',
    transports: [transport],
    defaultContext: ContextFixtures.createBaseContext(),
  };
  
  const moduleMetadata: ModuleMetadata = {
    imports: [
      LoggerModule.forRoot({
        ...defaultConfig,
        ...loggerConfig,
      }),
      ...imports,
    ],
    providers: [
      {
        provide: 'TracingService',
        useClass: MockTracingService,
      },
      ...providers,
    ],
  };
  
  return Test.createTestingModule(moduleMetadata).compile();
}

/**
 * Helper class for testing log assertions
 */
export class LogAssertions {
  private transport: CapturingTransport;
  
  constructor(transport: CapturingTransport) {
    this.transport = transport;
  }
  
  /**
   * Asserts that a log with the given level and message exists
   */
  assertLogExists(level: LogLevel, messageSubstring: string): void {
    const logs = this.transport.getLogsByMessage(messageSubstring)
      .filter(log => log.level === level);
    
    expect(logs.length).toBeGreaterThan(0);
  }
  
  /**
   * Asserts that a log with the given context property exists
   */
  assertLogWithContextExists(property: string, value: any): void {
    const logs = this.transport.getLogsByContextProperty(property, value);
    
    expect(logs.length).toBeGreaterThan(0);
  }
  
  /**
   * Asserts that a log contains the expected trace correlation IDs
   */
  assertLogHasTraceIds(messageSubstring: string, traceId: string, spanId?: string): void {
    const logs = this.transport.getLogsByMessage(messageSubstring);
    
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].context).toBeDefined();
    expect(logs[0].context.correlationId).toBeDefined();
    expect(logs[0].context.traceId).toEqual(traceId);
    
    if (spanId) {
      expect(logs[0].context.spanId).toEqual(spanId);
    }
  }
  
  /**
   * Asserts that a log contains journey-specific context
   */
  assertLogHasJourneyContext(messageSubstring: string, journeyType: string): void {
    const logs = this.transport.getLogsByMessage(messageSubstring);
    
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].context).toBeDefined();
    expect(logs[0].context.journeyType).toEqual(journeyType);
    expect(logs[0].context.journeyId).toBeDefined();
  }
  
  /**
   * Asserts that a log contains user-specific context
   */
  assertLogHasUserContext(messageSubstring: string, userId: string): void {
    const logs = this.transport.getLogsByMessage(messageSubstring);
    
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].context).toBeDefined();
    expect(logs[0].context.userId).toEqual(userId);
    expect(logs[0].context.isAuthenticated).toBeDefined();
  }
  
  /**
   * Asserts that a log contains request-specific context
   */
  assertLogHasRequestContext(messageSubstring: string, requestId: string): void {
    const logs = this.transport.getLogsByMessage(messageSubstring);
    
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].context).toBeDefined();
    expect(logs[0].context.requestId).toEqual(requestId);
    expect(logs[0].context.method).toBeDefined();
    expect(logs[0].context.url).toBeDefined();
  }
  
  /**
   * Gets the transport for direct access to logs
   */
  getTransport(): CapturingTransport {
    return this.transport;
  }
}

/**
 * Creates a logger service and assertions helper for testing
 */
export async function createTestLogger(): Promise<{
  module: TestingModule;
  logger: LoggerService;
  assertions: LogAssertions;
  transport: CapturingTransport;
  tracingService: MockTracingService;
}> {
  const formatter = new PassthroughFormatter();
  const transport = new CapturingTransport(formatter);
  
  const module = await createTestLoggerModule({
    loggerConfig: {
      transports: [transport],
    },
  });
  
  const logger = module.get<LoggerService>(LoggerService);
  const tracingService = module.get<MockTracingService>('TracingService');
  const assertions = new LogAssertions(transport);
  
  return {
    module,
    logger,
    assertions,
    transport,
    tracingService,
  };
}

/**
 * Helper to create a test error with stack trace for testing error logging
 */
export function createTestError(message: string = 'Test error'): Error {
  return new Error(message);
}

/**
 * Helper to create a test HTTP request object for testing request context
 */
export function createTestRequest(overrides: Partial<any> = {}): any {
  return {
    id: 'test-request-id',
    method: 'GET',
    url: '/test/path',
    headers: {
      'user-agent': 'Test User Agent',
      'content-type': 'application/json',
    },
    ip: '127.0.0.1',
    params: {},
    query: {},
    body: {},
    ...overrides,
  };
}

/**
 * Helper to create a test HTTP response object for testing
 */
export function createTestResponse(overrides: Partial<any> = {}): any {
  return {
    statusCode: 200,
    getHeaders: () => ({
      'content-type': 'application/json',
    }),
    ...overrides,
  };
}

/**
 * Helper to wait for all async operations to complete
 * Useful for testing async logging operations
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}