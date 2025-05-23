import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LoggerService } from '../../src/logger.service';
import { LoggerModule, LOGGER_CONFIG } from '../../src/logger.module';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { JourneyType } from '../../src/context/context.constants';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { FileTransport } from '../../src/transports/file.transport';

/**
 * Custom test transport that captures logs for verification
 */
class TestTransport implements Transport {
  public logs: any[] = [];
  
  constructor(private readonly config: any = {}) {}

  async write(formattedLog: string, level: LogLevel): Promise<void> {
    try {
      // Parse the log if it's a JSON string
      const logEntry = typeof formattedLog === 'string' ? JSON.parse(formattedLog) : formattedLog;
      this.logs.push({ ...logEntry, level });
    } catch (e) {
      // If parsing fails, store the raw string
      this.logs.push({ raw: formattedLog, level });
    }
  }
}

/**
 * Helper function to create a temporary log file path
 */
function createTempLogFile(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'austa-logger-test-'));
  return path.join(tempDir, 'test.log');
}

/**
 * Helper function to read and parse a log file
 */
async function readLogFile(filePath: string): Promise<any[]> {
  const content = await fs.promises.readFile(filePath, 'utf8');
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

/**
 * End-to-end tests for the LoggerService
 */
describe('LoggerService (e2e)', () => {
  let testTransport: TestTransport;
  
  beforeEach(() => {
    testTransport = new TestTransport();
  });

  afterEach(() => {
    testTransport.logs = [];
  });

  describe('Basic Logging Functionality', () => {
    it('should log messages with different log levels', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.DEBUG,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log messages with different levels
      logger.debug('Debug message');
      logger.log('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      logger.fatal('Fatal message');

      // Verify logs were captured
      expect(testTransport.logs.length).toBe(5);
      
      // Verify log levels
      expect(testTransport.logs[0].level).toBe(LogLevel.DEBUG);
      expect(testTransport.logs[1].level).toBe(LogLevel.INFO);
      expect(testTransport.logs[2].level).toBe(LogLevel.WARN);
      expect(testTransport.logs[3].level).toBe(LogLevel.ERROR);
      expect(testTransport.logs[4].level).toBe(LogLevel.FATAL);
      
      // Verify messages
      expect(testTransport.logs[0].message).toBe('Debug message');
      expect(testTransport.logs[1].message).toBe('Info message');
      expect(testTransport.logs[2].message).toBe('Warning message');
      expect(testTransport.logs[3].message).toBe('Error message');
      expect(testTransport.logs[4].message).toBe('Fatal message');
    });

    it('should respect log level filtering', async () => {
      // Create logger with INFO level
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log messages with different levels
      logger.debug('Debug message'); // Should be filtered out
      logger.log('Info message');    // Should be included
      logger.warn('Warning message'); // Should be included
      logger.error('Error message');  // Should be included

      // Verify only INFO and above logs were captured
      expect(testTransport.logs.length).toBe(3);
      
      // Verify log levels
      expect(testTransport.logs[0].level).toBe(LogLevel.INFO);
      expect(testTransport.logs[1].level).toBe(LogLevel.WARN);
      expect(testTransport.logs[2].level).toBe(LogLevel.ERROR);
    });

    it('should include timestamp and service name in logs', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log a message
      logger.log('Test message');

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].message).toBe('Test message');
      expect(testTransport.logs[0].level).toBe(LogLevel.INFO);
      expect(testTransport.logs[0].service).toBe('test-service');
      expect(testTransport.logs[0].timestamp).toBeDefined();
      
      // Verify timestamp is in ISO format
      const timestamp = testTransport.logs[0].timestamp;
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('Structured JSON Formatting', () => {
    it('should produce valid JSON structured logs', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log a message with context
      logger.log('Test message', { userId: '123', requestId: 'req-456' });

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check required fields for structured logging
      expect(log.message).toBe('Test message');
      expect(log.level).toBe(LogLevel.INFO);
      expect(log.service).toBe('test-service');
      expect(log.timestamp).toBeDefined();
      
      // Check context data is included
      expect(log.contextData).toBeDefined();
      expect(log.contextData.userId).toBe('123');
      expect(log.contextData.requestId).toBe('req-456');
    });

    it('should handle complex objects in context', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create a complex object with nested properties
      const complexContext = {
        user: {
          id: '123',
          profile: {
            name: 'Test User',
            email: 'test@example.com',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        request: {
          id: 'req-456',
          path: '/api/test',
          method: 'GET',
          params: { id: '789' }
        },
        metadata: {
          version: '1.0.0',
          timestamp: new Date()
        }
      };

      // Log a message with complex context
      logger.log('Complex context test', complexContext);

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check context data is included and properly structured
      expect(log.contextData).toBeDefined();
      expect(log.contextData.user.id).toBe('123');
      expect(log.contextData.user.profile.name).toBe('Test User');
      expect(log.contextData.user.profile.preferences.theme).toBe('dark');
      expect(log.contextData.request.id).toBe('req-456');
      expect(log.contextData.request.path).toBe('/api/test');
      expect(log.contextData.metadata.version).toBe('1.0.0');
      
      // Verify Date objects are serialized to ISO strings
      expect(typeof log.contextData.metadata.timestamp).toBe('string');
    });

    it('should properly format error objects', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create an error
      const testError = new Error('Test error message');
      testError.name = 'TestError';
      
      // Add custom properties to the error
      (testError as any).code = 'ERR_TEST';
      (testError as any).details = { source: 'test', critical: true };

      // Log an error
      logger.error('An error occurred', testError);

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check error information is included
      expect(log.level).toBe(LogLevel.ERROR);
      expect(log.message).toBe('An error occurred');
      expect(log.error).toBeDefined();
      expect(log.error.message).toBe('Test error message');
      expect(log.error.name).toBe('TestError');
      expect(log.error.code).toBe('ERR_TEST');
      expect(log.error.stack).toBeDefined();
      expect(log.error.details).toBeDefined();
      expect(log.error.details.source).toBe('test');
      expect(log.error.details.critical).toBe(true);
    });
  });

  describe('Context-Enriched Logging', () => {
    it('should support request context enrichment', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create a logger with request context
      const requestLogger = logger.withRequestContext({
        requestId: 'req-123',
        method: 'GET',
        path: '/api/users',
        clientIp: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Test Agent'
      });

      // Log a message with the request logger
      requestLogger.log('Request received');

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check request context is included
      expect(log.message).toBe('Request received');
      expect(log.context).toBeDefined();
      expect(log.context.requestId).toBe('req-123');
      expect(log.context.method).toBe('GET');
      expect(log.context.path).toBe('/api/users');
      expect(log.context.clientIp).toBe('127.0.0.1');
      expect(log.context.userAgent).toBe('Mozilla/5.0 Test Agent');
    });

    it('should support user context enrichment', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create a logger with user context
      const userLogger = logger.withUserContext({
        userId: 'user-123',
        roles: ['admin', 'user'],
        userData: { email: 'user@example.com' }
      });

      // Log a message with the user logger
      userLogger.log('User action');

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check user context is included
      expect(log.message).toBe('User action');
      expect(log.context).toBeDefined();
      expect(log.context.userId).toBe('user-123');
      expect(log.context.roles).toEqual(['admin', 'user']);
      expect(log.context.userData).toBeDefined();
      expect(log.context.userData.email).toBe('user@example.com');
    });

    it('should support journey context enrichment', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create a logger with journey context
      const journeyLogger = logger.withJourneyContext({
        journeyType: JourneyType.HEALTH,
        resourceId: 'health-record-123',
        action: 'view-metrics'
      });

      // Log a message with the journey logger
      journeyLogger.log('Health journey action');

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check journey context is included
      expect(log.message).toBe('Health journey action');
      expect(log.context).toBeDefined();
      expect(log.context.journeyType).toBe(JourneyType.HEALTH);
      expect(log.context.resourceId).toBe('health-record-123');
      expect(log.context.action).toBe('view-metrics');
    });

    it('should support combined context enrichment', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create a logger with multiple contexts
      const requestLogger = logger.withRequestContext({
        requestId: 'req-123',
        method: 'GET',
        path: '/api/health/metrics'
      });
      
      const userRequestLogger = requestLogger.withUserContext({
        userId: 'user-456',
        roles: ['user']
      });
      
      const completeLogger = userRequestLogger.withJourneyContext({
        journeyType: JourneyType.HEALTH,
        resourceId: 'health-record-789',
        action: 'view-metrics'
      });

      // Log a message with the complete logger
      completeLogger.log('Complete context test');

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check all contexts are included
      expect(log.message).toBe('Complete context test');
      expect(log.context).toBeDefined();
      
      // Request context
      expect(log.context.requestId).toBe('req-123');
      expect(log.context.method).toBe('GET');
      expect(log.context.path).toBe('/api/health/metrics');
      
      // User context
      expect(log.context.userId).toBe('user-456');
      expect(log.context.roles).toEqual(['user']);
      
      // Journey context
      expect(log.context.journeyType).toBe(JourneyType.HEALTH);
      expect(log.context.resourceId).toBe('health-record-789');
      expect(log.context.action).toBe('view-metrics');
    });
  });

  describe('Journey-Specific Logging', () => {
    it('should create journey-specific loggers', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create journey-specific loggers
      const healthLogger = logger.forHealthJourney({ resourceId: 'health-123' });
      const careLogger = logger.forCareJourney({ resourceId: 'care-456' });
      const planLogger = logger.forPlanJourney({ resourceId: 'plan-789' });

      // Log messages with each journey logger
      healthLogger.log('Health journey log');
      careLogger.log('Care journey log');
      planLogger.log('Plan journey log');

      // Verify logs were captured
      expect(testTransport.logs.length).toBe(3);
      
      // Verify journey context in each log
      expect(testTransport.logs[0].context.journeyType).toBe(JourneyType.HEALTH);
      expect(testTransport.logs[0].context.resourceId).toBe('health-123');
      expect(testTransport.logs[0].message).toBe('Health journey log');
      
      expect(testTransport.logs[1].context.journeyType).toBe(JourneyType.CARE);
      expect(testTransport.logs[1].context.resourceId).toBe('care-456');
      expect(testTransport.logs[1].message).toBe('Care journey log');
      
      expect(testTransport.logs[2].context.journeyType).toBe(JourneyType.PLAN);
      expect(testTransport.logs[2].context.resourceId).toBe('plan-789');
      expect(testTransport.logs[2].message).toBe('Plan journey log');
    });
  });

  describe('File Transport', () => {
    let tempLogFile: string;
    
    beforeEach(() => {
      // Create a temporary log file for testing
      tempLogFile = createTempLogFile();
    });
    
    afterEach(async () => {
      // Clean up the temporary log file
      try {
        await fs.promises.unlink(tempLogFile);
        await fs.promises.rmdir(path.dirname(tempLogFile));
      } catch (e) {
        // Ignore errors during cleanup
      }
    });

    it('should write logs to a file', async () => {
      // Create a file transport
      const fileTransport = new FileTransport({
        filename: path.basename(tempLogFile),
        dirname: path.dirname(tempLogFile),
      });
      
      // Create logger with file transport
      const logger = new LoggerService({
        serviceName: 'file-test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our file transport
      (logger as any).transports = [fileTransport];

      // Log some messages
      logger.log('File transport test');
      logger.error('Error message for file', new Error('Test error'));
      
      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Read the log file
      const fileContent = await fs.promises.readFile(tempLogFile, 'utf8');
      const logLines = fileContent.trim().split('\n');
      
      // Verify logs were written to the file
      expect(logLines.length).toBe(2);
      
      // Parse the logs
      const logs = logLines.map(line => JSON.parse(line));
      
      // Verify log content
      expect(logs[0].message).toBe('File transport test');
      expect(logs[0].level).toBe('info');
      expect(logs[0].service).toBe('file-test-service');
      
      expect(logs[1].message).toBe('Error message for file');
      expect(logs[1].level).toBe('error');
      expect(logs[1].error).toBeDefined();
      expect(logs[1].error.message).toBe('Test error');
      expect(logs[1].error.stack).toBeDefined();
    });

    it('should respect log level filtering for file transport', async () => {
      // Create a file transport
      const fileTransport = new FileTransport({
        filename: path.basename(tempLogFile),
        dirname: path.dirname(tempLogFile),
      });
      
      // Create logger with file transport and WARN level
      const logger = new LoggerService({
        serviceName: 'file-test-service',
        level: LogLevel.WARN,
      });
      
      // Replace the transports with our file transport
      (logger as any).transports = [fileTransport];

      // Log messages with different levels
      logger.debug('Debug message'); // Should be filtered out
      logger.log('Info message');    // Should be filtered out
      logger.warn('Warning message'); // Should be included
      logger.error('Error message');  // Should be included
      
      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Read the log file
      const fileContent = await fs.promises.readFile(tempLogFile, 'utf8');
      const logLines = fileContent.trim().split('\n');
      
      // Verify only WARN and ERROR logs were written
      expect(logLines.length).toBe(2);
      
      // Parse the logs
      const logs = logLines.map(line => JSON.parse(line));
      
      // Verify log content
      expect(logs[0].message).toBe('Warning message');
      expect(logs[0].level).toBe('warn');
      
      expect(logs[1].message).toBe('Error message');
      expect(logs[1].level).toBe('error');
    });
  });

  describe('Environment-Specific Behavior', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    afterEach(() => {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should use appropriate defaults for development environment', async () => {
      // Set environment to development
      process.env.NODE_ENV = 'development';
      
      // Create logger with minimal config
      const logger = new LoggerService({
        serviceName: 'test-service',
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log messages with different levels
      logger.debug('Debug message');
      logger.log('Info message');

      // In development, DEBUG level should be enabled by default
      expect(testTransport.logs.length).toBe(2);
      expect(testTransport.logs[0].level).toBe(LogLevel.DEBUG);
      expect(testTransport.logs[1].level).toBe(LogLevel.INFO);
    });

    it('should use appropriate defaults for production environment', async () => {
      // Set environment to production
      process.env.NODE_ENV = 'production';
      
      // Create logger with minimal config
      const logger = new LoggerService({
        serviceName: 'test-service',
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log messages with different levels
      logger.debug('Debug message');
      logger.log('Info message');

      // In production, INFO should be the default minimum level
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].level).toBe(LogLevel.INFO);
    });
  });

  describe('Error Handling', () => {
    it('should properly format and log errors', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create a custom error with additional properties
      class CustomError extends Error {
        constructor(
          message: string,
          public readonly code: string,
          public readonly details: Record<string, any>
        ) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError(
        'Something went wrong',
        'ERR_CUSTOM',
        { source: 'test', userId: '123', critical: true }
      );

      // Log the error
      logger.error('Error occurred during operation', error);

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check error information
      expect(log.level).toBe(LogLevel.ERROR);
      expect(log.message).toBe('Error occurred during operation');
      expect(log.error).toBeDefined();
      expect(log.error.message).toBe('Something went wrong');
      expect(log.error.name).toBe('CustomError');
      expect(log.error.code).toBe('ERR_CUSTOM');
      expect(log.error.details).toBeDefined();
      expect(log.error.details.source).toBe('test');
      expect(log.error.details.userId).toBe('123');
      expect(log.error.details.critical).toBe(true);
      expect(log.error.stack).toBeDefined();
    });

    it('should handle circular references in error objects', async () => {
      // Create logger with test transport
      const logger = new LoggerService({
        serviceName: 'test-service',
        level: LogLevel.INFO,
      });
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Create an object with circular reference
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      // Create an error with the circular object
      const error = new Error('Circular reference error');
      (error as any).data = circularObj;

      // Log the error
      logger.error('Error with circular reference', error);

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      const log = testTransport.logs[0];
      
      // Check error information
      expect(log.level).toBe(LogLevel.ERROR);
      expect(log.message).toBe('Error with circular reference');
      expect(log.error).toBeDefined();
      expect(log.error.message).toBe('Circular reference error');
      
      // The circular reference should be handled gracefully
      expect(() => JSON.stringify(log)).not.toThrow();
    });
  });

  describe('NestJS Integration', () => {
    it('should work with NestJS dependency injection', async () => {
      // Create a NestJS test module with LoggerModule
      const moduleRef = await Test.createTestingModule({
        imports: [
          LoggerModule.forRoot({
            serviceName: 'test-service',
            level: LogLevel.INFO,
            format: 'json',
            transports: [{ type: 'console' }],
            includeTimestamp: true,
            traceEnabled: true,
          }),
        ],
      }).compile();

      // Get the LoggerService from the module
      const logger = moduleRef.get<LoggerService>(LoggerService);
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log a message
      logger.log('NestJS integration test');

      // Verify log structure
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].message).toBe('NestJS integration test');
      expect(testTransport.logs[0].level).toBe(LogLevel.INFO);
      expect(testTransport.logs[0].service).toBe('test-service');
    });

    it('should work with default configuration', async () => {
      // Create a NestJS test module with default LoggerModule configuration
      const moduleRef = await Test.createTestingModule({
        imports: [LoggerModule.forRootDefault()],
      }).compile();

      // Get the LoggerService from the module
      const logger = moduleRef.get<LoggerService>(LoggerService);
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log messages with different levels
      logger.debug('Debug message'); // Should be filtered out with default INFO level
      logger.log('Info message');    // Should be included

      // Verify only INFO level logs were captured (default level is INFO)
      expect(testTransport.logs.length).toBe(1);
      expect(testTransport.logs[0].message).toBe('Info message');
      expect(testTransport.logs[0].level).toBe(LogLevel.INFO);
    });

    it('should work with async configuration', async () => {
      // Create a NestJS test module with async LoggerModule configuration
      const moduleRef = await Test.createTestingModule({
        imports: [
          LoggerModule.forRootAsync({
            useFactory: () => ({
              serviceName: 'async-test-service',
              level: LogLevel.WARN,
              format: 'json',
              transports: [{ type: 'console' }],
              includeTimestamp: true,
              traceEnabled: true,
            }),
          }),
        ],
      }).compile();

      // Get the LoggerService from the module
      const logger = moduleRef.get<LoggerService>(LoggerService);
      
      // Replace the transports with our test transport
      (logger as any).transports = [testTransport];

      // Log messages with different levels
      logger.debug('Debug message'); // Should be filtered out
      logger.log('Info message');    // Should be filtered out
      logger.warn('Warning message'); // Should be included
      logger.error('Error message');  // Should be included

      // Verify only WARN and above logs were captured
      expect(testTransport.logs.length).toBe(2);
      expect(testTransport.logs[0].message).toBe('Warning message');
      expect(testTransport.logs[0].level).toBe(LogLevel.WARN);
      expect(testTransport.logs[1].message).toBe('Error message');
      expect(testTransport.logs[1].level).toBe(LogLevel.ERROR);
      expect(testTransport.logs[0].service).toBe('async-test-service');
    });
  });
});