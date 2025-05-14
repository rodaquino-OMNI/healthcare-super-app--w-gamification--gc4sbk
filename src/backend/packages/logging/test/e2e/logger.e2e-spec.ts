import { Test } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerModule } from '../../src/logger.module';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { TransportFactory } from '../../src/transports/transport-factory';
import { Transport } from '../../src/interfaces/transport.interface';
import { JourneyType } from '../../src/context/context.constants';

/**
 * Mock transport for testing that captures log entries
 */
class MockTransport implements Transport {
  public entries: LogEntry[] = [];
  private readonly level: LogLevel;

  constructor(level: LogLevel = LogLevel.DEBUG) {
    this.level = level;
  }

  write(entry: LogEntry): void {
    if (entry.level >= this.level) {
      this.entries.push(entry);
    }
  }

  clear(): void {
    this.entries = [];
  }
}

/**
 * Mock transport factory for testing
 */
class MockTransportFactory extends TransportFactory {
  private readonly mockTransports: MockTransport[] = [];

  constructor(transports: MockTransport[] = []) {
    super();
    this.mockTransports = transports;
  }

  createTransports(): Transport[] {
    return this.mockTransports;
  }

  getMockTransports(): MockTransport[] {
    return this.mockTransports;
  }
}

describe('LoggerService (e2e)', () => {
  let loggerService: LoggerService;
  let mockTransport: MockTransport;
  let mockTransportFactory: MockTransportFactory;

  beforeEach(async () => {
    // Create a mock transport to capture logs
    mockTransport = new MockTransport();
    mockTransportFactory = new MockTransportFactory([mockTransport]);

    // Create a test module with the logger service
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({
        level: LogLevel.DEBUG,
        defaultContext: {
          application: 'test-app',
          service: 'test-service',
          environment: 'test',
        },
        journeyLevels: {
          [JourneyType.HEALTH]: LogLevel.INFO,
          [JourneyType.CARE]: LogLevel.DEBUG,
          [JourneyType.PLAN]: LogLevel.WARN,
        },
        tracing: {
          enabled: false,
        },
      })],
      providers: [
        {
          provide: TransportFactory,
          useValue: mockTransportFactory,
        },
      ],
    }).compile();

    loggerService = moduleRef.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    mockTransport.clear();
  });

  describe('Basic logging functionality', () => {
    it('should log messages with the correct level', () => {
      // Test all log methods
      loggerService.debug('Debug message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      loggerService.fatal('Fatal message');

      // Verify log entries
      expect(mockTransport.entries).toHaveLength(5);
      expect(mockTransport.entries[0].level).toBe(LogLevel.DEBUG);
      expect(mockTransport.entries[1].level).toBe(LogLevel.INFO);
      expect(mockTransport.entries[2].level).toBe(LogLevel.WARN);
      expect(mockTransport.entries[3].level).toBe(LogLevel.ERROR);
      expect(mockTransport.entries[4].level).toBe(LogLevel.FATAL);

      // Verify messages
      expect(mockTransport.entries[0].message).toBe('Debug message');
      expect(mockTransport.entries[1].message).toBe('Info message');
      expect(mockTransport.entries[2].message).toBe('Warning message');
      expect(mockTransport.entries[3].message).toBe('Error message');
      expect(mockTransport.entries[4].message).toBe('Fatal message');
    });

    it('should include timestamp in log entries', () => {
      loggerService.log('Test message');
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].timestamp).toBeInstanceOf(Date);
    });

    it('should include default context in log entries', () => {
      loggerService.log('Test message');
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].context).toMatchObject({
        application: 'test-app',
        service: 'test-service',
        environment: 'test',
      });
    });
  });

  describe('Log level filtering', () => {
    it('should filter logs based on transport level', () => {
      // Create a new transport with INFO level
      const infoTransport = new MockTransport(LogLevel.INFO);
      mockTransportFactory.getMockTransports().push(infoTransport);

      // Log messages at different levels
      loggerService.debug('Debug message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');

      // Debug transport should receive all logs
      expect(mockTransport.entries).toHaveLength(3);
      
      // Info transport should only receive INFO and above
      expect(infoTransport.entries).toHaveLength(2);
      expect(infoTransport.entries[0].level).toBe(LogLevel.INFO);
      expect(infoTransport.entries[1].level).toBe(LogLevel.WARN);
    });

    it('should filter logs based on journey-specific levels', () => {
      // Create loggers for different journeys
      const healthLogger = loggerService.forHealthJourney();
      const careLogger = loggerService.forCareJourney();
      const planLogger = loggerService.forPlanJourney();

      // Log DEBUG messages for each journey
      healthLogger.debug('Health debug message');
      careLogger.debug('Care debug message');
      planLogger.debug('Plan debug message');

      // Verify filtering based on journey levels
      // Health: INFO level, should not log DEBUG
      // Care: DEBUG level, should log DEBUG
      // Plan: WARN level, should not log DEBUG
      const debugEntries = mockTransport.entries.filter(e => e.level === LogLevel.DEBUG);
      expect(debugEntries).toHaveLength(1);
      expect(debugEntries[0].message).toBe('Care debug message');
      expect(debugEntries[0].context.journeyType).toBe(JourneyType.CARE);
    });

    it('should respect environment-specific log levels', async () => {
      // Create a test module with production settings
      const prodTransport = new MockTransport(LogLevel.INFO);
      const prodTransportFactory = new MockTransportFactory([prodTransport]);

      const prodModuleRef = await Test.createTestingModule({
        imports: [LoggerModule.forRoot({
          level: LogLevel.INFO, // Production typically uses INFO
          defaultContext: {
            application: 'test-app',
            service: 'test-service',
            environment: 'production',
          },
          tracing: {
            enabled: false,
          },
        })],
        providers: [
          {
            provide: TransportFactory,
            useValue: prodTransportFactory,
          },
        ],
      }).compile();

      const prodLoggerService = prodModuleRef.get<LoggerService>(LoggerService);

      // Log at different levels
      prodLoggerService.debug('Debug message');
      prodLoggerService.log('Info message');
      prodLoggerService.warn('Warning message');

      // In production, DEBUG should be filtered out
      expect(prodTransport.entries).toHaveLength(2);
      expect(prodTransport.entries[0].level).toBe(LogLevel.INFO);
      expect(prodTransport.entries[1].level).toBe(LogLevel.WARN);
    });
  });

  describe('Context enrichment', () => {
    it('should enrich logs with string context', () => {
      loggerService.log('Test message', 'TestContext');
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].context.contextName).toBe('TestContext');
    });

    it('should enrich logs with object context', () => {
      const context = { userId: '123', requestId: 'req-456' };
      loggerService.log('Test message', context);
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].context).toMatchObject(context);
    });

    it('should create child loggers with request context', () => {
      const requestContext = { requestId: 'req-123', ip: '127.0.0.1', method: 'GET', path: '/test' };
      const requestLogger = loggerService.withRequestContext(requestContext);
      
      requestLogger.log('Request received');
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].context).toMatchObject({
        requestId: 'req-123',
        ip: '127.0.0.1',
        method: 'GET',
        path: '/test',
      });
    });

    it('should create child loggers with user context', () => {
      const userContext = { userId: 'user-123', email: 'test@example.com', roles: ['user'] };
      const userLogger = loggerService.withUserContext(userContext);
      
      userLogger.log('User action');
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].context).toMatchObject({
        userId: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
      });
    });

    it('should create child loggers with journey context', () => {
      const journeyContext = { journeyType: JourneyType.HEALTH, step: 'record-metrics' };
      const journeyLogger = loggerService.withJourneyContext(journeyContext);
      
      journeyLogger.log('Journey step completed');
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].context).toMatchObject({
        journeyType: JourneyType.HEALTH,
        step: 'record-metrics',
      });
    });

    it('should combine multiple contexts correctly', () => {
      const requestLogger = loggerService.withRequestContext({ requestId: 'req-123' });
      const userRequestLogger = requestLogger.withUserContext({ userId: 'user-456' });
      const fullContextLogger = userRequestLogger.withJourneyContext({ journeyType: JourneyType.CARE });
      
      fullContextLogger.log('Complete context test');
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].context).toMatchObject({
        requestId: 'req-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
      });
    });
  });

  describe('Error logging', () => {
    it('should log errors with stack traces', () => {
      const error = new Error('Test error');
      loggerService.error('An error occurred', error);
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].message).toBe('An error occurred');
      expect(mockTransport.entries[0].error).toBeDefined();
      expect(mockTransport.entries[0].stack).toBeDefined();
      expect(mockTransport.entries[0].stack).toContain('Error: Test error');
    });

    it('should log errors with string stack traces', () => {
      const stackTrace = 'Error: Test error\n    at TestFunction (/test/file.ts:10:15)';
      loggerService.error('An error occurred', stackTrace);
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].message).toBe('An error occurred');
      expect(mockTransport.entries[0].stack).toBe(stackTrace);
    });

    it('should log fatal errors with additional context', () => {
      const error = new Error('Critical failure');
      const context = { component: 'database', operation: 'query' };
      
      loggerService.fatal('System failure', error, context);
      
      expect(mockTransport.entries).toHaveLength(1);
      expect(mockTransport.entries[0].level).toBe(LogLevel.FATAL);
      expect(mockTransport.entries[0].message).toBe('System failure');
      expect(mockTransport.entries[0].error).toBeDefined();
      expect(mockTransport.entries[0].context).toMatchObject(context);
    });
  });

  describe('JSON structure validation', () => {
    it('should produce valid JSON-serializable log entries', () => {
      // Log with various types of data
      loggerService.log('Test message', { 
        userId: '123', 
        metadata: { tags: ['test', 'json'], count: 42 },
        timestamp: new Date('2023-01-01T12:00:00Z')
      });
      
      const entry = mockTransport.entries[0];
      
      // Verify the entry can be serialized to JSON
      const serialized = JSON.stringify(entry);
      expect(() => JSON.parse(serialized)).not.toThrow();
      
      // Verify the structure after serialization
      const parsed = JSON.parse(serialized);
      expect(parsed.message).toBe('Test message');
      expect(parsed.level).toBe(LogLevel.INFO);
      expect(parsed.context.userId).toBe('123');
      expect(parsed.context.metadata.tags).toEqual(['test', 'json']);
      expect(parsed.context.metadata.count).toBe(42);
      expect(parsed.context.timestamp).toBeDefined();
    });

    it('should handle circular references in log objects', () => {
      // Create an object with circular reference
      const circular: any = { name: 'circular' };
      circular.self = circular;
      
      // Log the circular object
      loggerService.log('Circular object test', { circular });
      
      const entry = mockTransport.entries[0];
      
      // Verify the entry can be serialized without errors
      expect(() => JSON.stringify(entry)).not.toThrow();
      
      // The circular reference should be replaced with a placeholder
      const serialized = JSON.stringify(entry);
      expect(serialized).toContain('circular');
      expect(serialized).toContain('[Circular]');
    });

    it('should sanitize sensitive information', () => {
      // Log with sensitive information
      loggerService.log('Auth test', { 
        user: 'testuser', 
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        creditCard: '4111-1111-1111-1111'
      });
      
      const entry = mockTransport.entries[0];
      const serialized = JSON.stringify(entry);
      
      // Sensitive fields should be redacted
      expect(serialized).not.toContain('secret123');
      expect(serialized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(serialized).not.toContain('4111-1111-1111-1111');
      
      // But should contain placeholders
      expect(serialized).toContain('[REDACTED]');
    });
  });

  describe('Environment-specific behavior', () => {
    it('should configure transports based on environment', async () => {
      // Test development environment
      const devFactory = new TransportFactory();
      const devTransports = devFactory.createEnvironmentTransports('development', 'test-app');
      
      expect(devTransports.length).toBe(2); // Console + File
      expect(devTransports[0].type).toBe('console');
      expect(devTransports[0].level).toBe('debug');
      expect(devTransports[1].type).toBe('file');
      
      // Test production environment
      const prodFactory = new TransportFactory();
      const prodTransports = prodFactory.createEnvironmentTransports('production', 'test-app');
      
      expect(prodTransports.length).toBe(1); // CloudWatch only
      expect(prodTransports[0].type).toBe('cloudwatch');
      expect(prodTransports[0].level).toBe('info');
    });

    it('should apply different formatting based on environment', async () => {
      // This would require testing the actual formatters
      // For now, we'll just verify the transport factory creates the right configs
      const devFactory = new TransportFactory();
      const devTransports = devFactory.createEnvironmentTransports('development', 'test-app');
      
      // Development should have colorized console output
      expect(devTransports[0].colorize).toBe(true);
      
      // Production should have structured JSON for CloudWatch
      const prodFactory = new TransportFactory();
      const prodTransports = prodFactory.createEnvironmentTransports('production', 'test-app');
      
      // CloudWatch transport should have appropriate settings
      expect(prodTransports[0].logGroupName).toContain('/austa/production/');
      expect(prodTransports[0].retentionDays).toBe(90); // Longer retention in production
    });
  });
});