/**
 * Provides mock implementations of logging dependencies for isolated testing.
 * These mocks allow testing of logging functionality without requiring actual
 * external logging services or infrastructure.
 */

import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';

/**
 * Mock implementation of the Transport interface for testing.
 * Captures logs in memory for inspection during tests.
 */
export class MockTransport implements Transport {
  public logs: LogEntry[] = [];
  public initialized = false;
  public closed = false;
  public errorOnWrite = false;
  public errorOnInit = false;
  public batchSize = 10;
  public name: string;

  constructor(name = 'MockTransport') {
    this.name = name;
  }

  /**
   * Initializes the transport
   */
  async initialize(): Promise<void> {
    if (this.errorOnInit) {
      throw new Error(`Failed to initialize ${this.name}`);
    }
    this.initialized = true;
    return Promise.resolve();
  }

  /**
   * Writes a log entry to the transport
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    if (this.errorOnWrite) {
      throw new Error(`Failed to write to ${this.name}`);
    }
    this.logs.push({ ...entry });
    return Promise.resolve();
  }

  /**
   * Writes multiple log entries to the transport
   * @param entries The log entries to write
   */
  async writeBatch(entries: LogEntry[]): Promise<void> {
    if (this.errorOnWrite) {
      throw new Error(`Failed to write batch to ${this.name}`);
    }
    entries.forEach(entry => this.logs.push({ ...entry }));
    return Promise.resolve();
  }

  /**
   * Closes the transport
   */
  async close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }

  /**
   * Clears all captured logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Gets logs filtered by level
   * @param level The log level to filter by
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Gets logs containing a specific message substring
   * @param messageSubstring The substring to search for
   */
  getLogsByMessage(messageSubstring: string): LogEntry[] {
    return this.logs.filter(log => 
      typeof log.message === 'string' && log.message.includes(messageSubstring)
    );
  }

  /**
   * Gets logs with a specific journey context
   * @param journeyType The journey type to filter by
   */
  getLogsByJourney(journeyType: 'health' | 'care' | 'plan'): LogEntry[] {
    return this.logs.filter(log => 
      log.context && 
      log.context.journey && 
      log.context.journey.type === journeyType
    );
  }
}

/**
 * Mock implementation of CloudWatch transport for testing AWS integration.
 * Simulates CloudWatch-specific behavior and captures logs for inspection.
 */
export class MockCloudWatchTransport extends MockTransport {
  public logGroupName: string;
  public logStreamName: string;
  public region: string;
  public sequenceToken: string;
  public putLogEventsCallCount = 0;
  public createLogGroupCallCount = 0;
  public createLogStreamCallCount = 0;

  constructor(config: {
    logGroupName?: string;
    logStreamName?: string;
    region?: string;
  } = {}) {
    super('MockCloudWatchTransport');
    this.logGroupName = config.logGroupName || '/aws/lambda/test';
    this.logStreamName = config.logStreamName || 'test-stream';
    this.region = config.region || 'us-east-1';
    this.sequenceToken = '49590302748271309279';
  }

  /**
   * Simulates creating a CloudWatch log group
   */
  async createLogGroup(): Promise<void> {
    this.createLogGroupCallCount++;
    return Promise.resolve();
  }

  /**
   * Simulates creating a CloudWatch log stream
   */
  async createLogStream(): Promise<void> {
    this.createLogStreamCallCount++;
    return Promise.resolve();
  }

  /**
   * Simulates putting log events to CloudWatch
   * @param entries The log entries to write
   */
  async putLogEvents(entries: LogEntry[]): Promise<void> {
    this.putLogEventsCallCount++;
    await this.writeBatch(entries);
    this.sequenceToken = Math.floor(Math.random() * 10000000000000000000).toString();
    return Promise.resolve();
  }

  /**
   * Gets CloudWatch-specific metadata from logs
   */
  getCloudWatchMetadata(): Array<{ timestamp: number, requestId?: string }> {
    return this.logs.map(log => ({
      timestamp: log.timestamp instanceof Date ? log.timestamp.getTime() : 0,
      requestId: log.context?.requestId
    }));
  }
}

/**
 * Mock implementation of console transport for testing console output.
 * Captures console output for inspection during tests.
 */
export class MockConsoleTransport extends MockTransport {
  public stdoutLogs: string[] = [];
  public stderrLogs: string[] = [];
  public colorEnabled = true;
  public originalConsoleLog: typeof console.log;
  public originalConsoleError: typeof console.error;
  public intercepting = false;

  constructor() {
    super('MockConsoleTransport');
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
  }

  /**
   * Starts intercepting console output
   */
  startIntercepting(): void {
    if (this.intercepting) return;
    
    this.intercepting = true;
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.stdoutLogs.push(message);
    };
    
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.stderrLogs.push(message);
    };
  }

  /**
   * Stops intercepting console output
   */
  stopIntercepting(): void {
    if (!this.intercepting) return;
    
    console.log = this.originalConsoleLog;
    console.error = this.originalConsoleError;
    this.intercepting = false;
  }

  /**
   * Writes a log entry to the console transport
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    const message = typeof entry.message === 'string' 
      ? entry.message 
      : JSON.stringify(entry.message);
    
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      this.stderrLogs.push(message);
    } else {
      this.stdoutLogs.push(message);
    }
    
    return Promise.resolve();
  }

  /**
   * Clears all captured console output
   */
  clear(): void {
    super.clear();
    this.stdoutLogs = [];
    this.stderrLogs = [];
  }
}

/**
 * Mock implementation of a writable stream for testing stream-based logging.
 * Captures written data for inspection during tests.
 */
export class MockWritableStream {
  public chunks: Buffer[] = [];
  public encoding: BufferEncoding = 'utf8';
  public closed = false;
  public errorOnWrite = false;
  
  /**
   * Writes data to the stream
   * @param chunk The data to write
   * @param encoding The encoding to use
   * @param callback The callback to call when done
   */
  write(chunk: any, encoding?: BufferEncoding | ((error?: Error) => void), callback?: (error?: Error) => void): boolean {
    if (this.errorOnWrite) {
      const error = new Error('Failed to write to stream');
      if (typeof encoding === 'function') {
        encoding(error);
      } else if (callback) {
        callback(error);
      }
      return false;
    }
    
    if (typeof encoding === 'string') {
      this.encoding = encoding;
    }
    
    if (Buffer.isBuffer(chunk)) {
      this.chunks.push(chunk);
    } else if (typeof chunk === 'string') {
      this.chunks.push(Buffer.from(chunk, this.encoding));
    } else {
      this.chunks.push(Buffer.from(String(chunk), this.encoding));
    }
    
    if (typeof encoding === 'function') {
      encoding();
    } else if (callback) {
      callback();
    }
    
    return true;
  }
  
  /**
   * Ends the stream
   */
  end(): void {
    this.closed = true;
  }
  
  /**
   * Gets all written data as a string
   */
  getContentsAsString(): string {
    return Buffer.concat(this.chunks).toString(this.encoding);
  }
  
  /**
   * Gets all written data as a buffer
   */
  getContentsAsBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
  
  /**
   * Gets all written data as JSON objects
   * Assumes each line is a valid JSON object
   */
  getContentsAsJsonObjects(): any[] {
    const content = this.getContentsAsString();
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { parseError: true, rawLine: line };
        }
      });
  }
  
  /**
   * Clears all captured data
   */
  clear(): void {
    this.chunks = [];
  }
}

/**
 * Mock implementation of HTTP transport for testing HTTP request logging.
 * Simulates HTTP requests and captures logs for inspection.
 */
export class MockHttpTransport extends MockTransport {
  public endpoint: string;
  public headers: Record<string, string>;
  public requestCount = 0;
  public lastRequestBody: any = null;
  public lastRequestHeaders: Record<string, string> = {};
  public responseStatus = 200;
  public responseBody = { success: true };
  
  constructor(config: {
    endpoint?: string;
    headers?: Record<string, string>;
  } = {}) {
    super('MockHttpTransport');
    this.endpoint = config.endpoint || 'https://logs.example.com/ingest';
    this.headers = config.headers || { 'Content-Type': 'application/json' };
  }
  
  /**
   * Simulates sending an HTTP request with log data
   * @param entry The log entry to send
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    this.requestCount++;
    this.lastRequestBody = entry;
    this.lastRequestHeaders = { ...this.headers };
    return Promise.resolve();
  }
  
  /**
   * Simulates sending a batch of log entries in a single HTTP request
   * @param entries The log entries to send
   */
  async writeBatch(entries: LogEntry[]): Promise<void> {
    await super.writeBatch(entries);
    this.requestCount++;
    this.lastRequestBody = entries;
    this.lastRequestHeaders = { ...this.headers };
    return Promise.resolve();
  }
  
  /**
   * Sets the simulated HTTP response
   * @param status The HTTP status code to return
   * @param body The response body to return
   */
  setResponse(status: number, body: any): void {
    this.responseStatus = status;
    this.responseBody = body;
  }
  
  /**
   * Sets custom headers for HTTP requests
   * @param headers The headers to set
   */
  setHeaders(headers: Record<string, string>): void {
    this.headers = { ...headers };
  }
  
  /**
   * Gets information about all HTTP requests made
   */
  getRequestInfo(): { count: number, lastBody: any, lastHeaders: Record<string, string> } {
    return {
      count: this.requestCount,
      lastBody: this.lastRequestBody,
      lastHeaders: this.lastRequestHeaders
    };
  }
}

/**
 * Mock implementation of the Formatter interface for testing log format transformations.
 * Provides configurable formatting behavior for testing different format scenarios.
 */
export class MockFormatter implements Formatter {
  public formatCallCount = 0;
  public lastEntry: LogEntry | null = null;
  public formatResult: string = '{"mock":"formatted"}';
  public errorOnFormat = false;
  public formatImplementation: ((entry: LogEntry) => string) | null = null;
  
  /**
   * Formats a log entry into a string
   * @param entry The log entry to format
   */
  format(entry: LogEntry): string {
    this.formatCallCount++;
    this.lastEntry = { ...entry };
    
    if (this.errorOnFormat) {
      throw new Error('Failed to format log entry');
    }
    
    if (this.formatImplementation) {
      return this.formatImplementation(entry);
    }
    
    return this.formatResult;
  }
  
  /**
   * Sets a custom format implementation
   * @param implementation The custom format implementation
   */
  setFormatImplementation(implementation: (entry: LogEntry) => string): void {
    this.formatImplementation = implementation;
  }
  
  /**
   * Sets the result to return from format
   * @param result The result to return
   */
  setFormatResult(result: string): void {
    this.formatResult = result;
  }
  
  /**
   * Resets the mock formatter state
   */
  reset(): void {
    this.formatCallCount = 0;
    this.lastEntry = null;
    this.errorOnFormat = false;
    this.formatImplementation = null;
    this.formatResult = '{"mock":"formatted"}';
  }
}

/**
 * Creates a mock logger configuration for testing
 * @param overrides Configuration overrides
 */
export function createMockLoggerConfig(overrides: Partial<LoggerConfig> = {}): LoggerConfig {
  return {
    level: LogLevel.INFO,
    transports: ['console'],
    formatter: 'json',
    context: {
      application: 'test-app',
      environment: 'test',
    },
    cloudwatch: {
      enabled: false,
      logGroupName: '/aws/lambda/test',
      logStreamName: 'test-stream',
      region: 'us-east-1',
    },
    file: {
      enabled: false,
      filename: 'logs/test.log',
      maxSize: '10m',
      maxFiles: 5,
    },
    console: {
      enabled: true,
      colorize: true,
    },
    http: {
      enabled: false,
      endpoint: 'https://logs.example.com/ingest',
      headers: { 'Content-Type': 'application/json' },
    },
    ...overrides,
  };
}

/**
 * Creates a mock log entry for testing
 * @param overrides Log entry overrides
 */
export function createMockLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    message: 'Test log message',
    level: LogLevel.INFO,
    timestamp: new Date(),
    context: {
      requestId: '12345-67890-abcdef',
      userId: 'user-123',
      journey: {
        type: 'health',
        action: 'view-metrics',
      },
      application: 'test-app',
      environment: 'test',
    },
    metadata: {},
    ...overrides,
  };
}

/**
 * Creates journey-specific mock log entries for testing
 * @param journeyType The journey type
 * @param count Number of entries to create
 */
export function createJourneyMockLogEntries(
  journeyType: 'health' | 'care' | 'plan',
  count = 5
): LogEntry[] {
  const entries: LogEntry[] = [];
  
  const journeyActions: Record<string, string[]> = {
    health: ['view-metrics', 'record-measurement', 'set-goal', 'sync-device', 'view-insights'],
    care: ['book-appointment', 'view-providers', 'start-telemedicine', 'check-symptoms', 'view-medications'],
    plan: ['view-benefits', 'submit-claim', 'check-coverage', 'view-documents', 'update-plan'],
  };
  
  const actions = journeyActions[journeyType] || ['default-action'];
  
  for (let i = 0; i < count; i++) {
    const level = i % 5 === 0 ? LogLevel.ERROR :
                i % 4 === 0 ? LogLevel.WARN :
                i % 3 === 0 ? LogLevel.DEBUG :
                i % 2 === 0 ? LogLevel.VERBOSE : LogLevel.INFO;
    
    const action = actions[i % actions.length];
    
    entries.push({
      message: `${journeyType} journey log ${i + 1}`,
      level,
      timestamp: new Date(Date.now() - i * 1000), // Staggered timestamps
      context: {
        requestId: `req-${journeyType}-${i}`,
        userId: `user-${100 + i}`,
        journey: {
          type: journeyType,
          action,
        },
        application: 'test-app',
        environment: 'test',
      },
      metadata: {
        testId: i,
        journeyType,
      },
    });
  }
  
  return entries;
}

/**
 * Creates a mock transport factory for testing
 */
export function createMockTransportFactory() {
  const transports: Record<string, MockTransport> = {
    console: new MockConsoleTransport(),
    cloudwatch: new MockCloudWatchTransport(),
    file: new MockTransport('MockFileTransport'),
    http: new MockHttpTransport(),
  };
  
  return {
    /**
     * Gets a transport by name
     * @param name The transport name
     */
    getTransport(name: string): MockTransport {
      return transports[name] || new MockTransport(`Mock${name}Transport`);
    },
    
    /**
     * Creates a new transport
     * @param type The transport type
     * @param config The transport configuration
     */
    createTransport(type: string, config: any = {}): MockTransport {
      let transport: MockTransport;
      
      switch (type) {
        case 'console':
          transport = new MockConsoleTransport();
          break;
        case 'cloudwatch':
          transport = new MockCloudWatchTransport(config);
          break;
        case 'http':
          transport = new MockHttpTransport(config);
          break;
        case 'file':
        default:
          transport = new MockTransport(`Mock${type}Transport`);
      }
      
      transports[type] = transport;
      return transport;
    },
    
    /**
     * Gets all created transports
     */
    getAllTransports(): Record<string, MockTransport> {
      return { ...transports };
    },
    
    /**
     * Clears all transports
     */
    clearAll(): void {
      Object.values(transports).forEach(transport => transport.clear());
    },
  };
}