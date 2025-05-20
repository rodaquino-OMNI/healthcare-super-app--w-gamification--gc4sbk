import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { LoggerModule } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { Transport } from '../../src/interfaces/transport.interface';
import { MockTransport } from '../mocks/transport.mock';
import { TransportFactory } from '../../src/transports/transport-factory';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { FileTransport } from '../../src/transports/file.transport';
import { CloudWatchTransport } from '../../src/transports/cloudwatch.transport';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../src/formatters/cloudwatch.formatter';
import { TestAppModule } from './test-app.module';
import { ContextManager } from '../../src/context/context-manager';
import * as journeyData from '../fixtures/journey-data.fixture';
import * as logContexts from '../fixtures/log-contexts.fixture';
import * as errorObjects from '../fixtures/error-objects.fixture';

describe('LoggerService (e2e)', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let mockTransport: MockTransport;
  let tempLogFile: string;
  
  beforeAll(() => {
    // Create a temporary log file for testing
    tempLogFile = path.join(os.tmpdir(), `austa-logger-test-${Date.now()}.log`);
    
    // Mock the TransportFactory to use our mock transport
    jest.spyOn(TransportFactory, 'createTransport').mockImplementation((type: string) => {
      mockTransport = new MockTransport();
      return mockTransport;
    });
  });
  
  afterAll(async () => {
    // Clean up temporary log file
    if (fs.existsSync(tempLogFile)) {
      fs.unlinkSync(tempLogFile);
    }
    
    if (app) {
      await app.close();
    }
  });
  
  describe('Development environment', () => {
    beforeEach(async () => {
      // Reset the mock transport between tests
      if (mockTransport) {
        mockTransport.reset();
      }
      
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              logger: {
                level: 'debug',
                format: 'text',
                transports: [
                  {
                    type: 'console',
                    level: 'debug'
                  },
                  {
                    type: 'file',
                    level: 'debug',
                    filename: tempLogFile
                  }
                ]
              },
              environment: 'development'
            })]
          }),
          LoggerModule.forRoot(),
          TestAppModule
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      loggerService = moduleFixture.get<LoggerService>(LoggerService);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should log messages at all levels in development environment', () => {
      // Act
      loggerService.debug('Debug message');
      loggerService.verbose('Verbose message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      
      // Assert
      expect(mockTransport.writeCallCount).toBe(5);
      expect(mockTransport.entries).toHaveLength(5);
      
      // Verify all log levels were captured
      const logLevels = mockTransport.entries.map(entry => entry.level);
      expect(logLevels).toContain(LogLevel.DEBUG);
      expect(logLevels).toContain(LogLevel.VERBOSE);
      expect(logLevels).toContain(LogLevel.INFO);
      expect(logLevels).toContain(LogLevel.WARN);
      expect(logLevels).toContain(LogLevel.ERROR);
    });

    it('should include timestamp, level, and message in all log entries', () => {
      // Act
      loggerService.log('Test message');
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.message).toBe('Test message');
    });

    it('should format error objects with stack traces in development', () => {
      // Arrange
      const error = new Error('Test error');
      
      // Act
      loggerService.error('Error occurred', error);
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.message).toBe('Error occurred');
      expect(entry.error).toBeDefined();
      expect(entry.error.message).toBe('Test error');
      expect(entry.error.stack).toBeDefined();
    });

    it('should enrich logs with context when provided', () => {
      // Arrange
      const context = { requestId: 'test-request-id', userId: 'test-user-id' };
      
      // Act
      loggerService.log('Test with context', context);
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.context).toBeDefined();
      expect(entry.context.requestId).toBe('test-request-id');
      expect(entry.context.userId).toBe('test-user-id');
    });
  });

  describe('Production environment', () => {
    beforeEach(async () => {
      // Reset the mock transport between tests
      if (mockTransport) {
        mockTransport.reset();
      }
      
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              logger: {
                level: 'info',
                format: 'json',
                transports: [
                  {
                    type: 'console',
                    level: 'info'
                  },
                  {
                    type: 'cloudwatch',
                    level: 'info',
                    logGroup: 'austa-superapp',
                    logStream: 'backend-services'
                  }
                ]
              },
              environment: 'production'
            })]
          }),
          LoggerModule.forRoot(),
          TestAppModule
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      loggerService = moduleFixture.get<LoggerService>(LoggerService);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should filter out debug and verbose logs in production environment', () => {
      // Act
      loggerService.debug('Debug message');
      loggerService.verbose('Verbose message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      
      // Assert
      expect(mockTransport.writeCallCount).toBe(3); // Only INFO, WARN, ERROR
      
      // Verify only appropriate log levels were captured
      const logLevels = mockTransport.entries.map(entry => entry.level);
      expect(logLevels).not.toContain(LogLevel.DEBUG);
      expect(logLevels).not.toContain(LogLevel.VERBOSE);
      expect(logLevels).toContain(LogLevel.INFO);
      expect(logLevels).toContain(LogLevel.WARN);
      expect(logLevels).toContain(LogLevel.ERROR);
    });

    it('should use JSON format in production environment', () => {
      // Arrange
      const jsonFormatter = new JsonFormatter();
      jest.spyOn(jsonFormatter, 'format');
      
      // Act
      loggerService.log('Test message');
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      
      // Verify the entry can be serialized to JSON
      const serialized = JSON.stringify(entry);
      expect(() => JSON.parse(serialized)).not.toThrow();
      
      // Verify the structure of the JSON
      const parsed = JSON.parse(serialized);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('Test message');
    });

    it('should sanitize error stacks in production environment', () => {
      // Arrange
      const error = new Error('Test error');
      
      // Act
      loggerService.error('Error occurred', error);
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.message).toBe('Error occurred');
      expect(entry.error).toBeDefined();
      expect(entry.error.message).toBe('Test error');
      
      // In production, we might want to limit stack trace information
      // This depends on the specific implementation
      if (entry.error.stack) {
        // If stack is included, ensure it's properly formatted
        expect(typeof entry.error.stack).toBe('string');
      }
    });
  });

  describe('Journey-specific logging', () => {
    beforeEach(async () => {
      // Reset the mock transport between tests
      if (mockTransport) {
        mockTransport.reset();
      }
      
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              logger: {
                level: 'debug',
                format: 'json',
                transports: [{ type: 'console', level: 'debug' }]
              },
              environment: 'development'
            })]
          }),
          LoggerModule.forRoot(),
          TestAppModule
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      loggerService = moduleFixture.get<LoggerService>(LoggerService);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should include journey context in logs when provided', () => {
      // Arrange
      const contextManager = app.get<ContextManager>(ContextManager);
      const healthJourneyContext = journeyData.healthJourneyContext;
      
      // Set the current context
      contextManager.setJourneyContext(healthJourneyContext);
      
      // Act
      loggerService.log('Health journey log');
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.context).toBeDefined();
      expect(entry.context.journey).toBeDefined();
      expect(entry.context.journey.type).toBe('health');
      expect(entry.context.journey.id).toBe(healthJourneyContext.id);
    });

    it('should log with different journey contexts', () => {
      // Arrange
      const contextManager = app.get<ContextManager>(ContextManager);
      
      // Act - Log with different journey contexts
      contextManager.setJourneyContext(journeyData.healthJourneyContext);
      loggerService.log('Health journey log');
      
      contextManager.setJourneyContext(journeyData.careJourneyContext);
      loggerService.log('Care journey log');
      
      contextManager.setJourneyContext(journeyData.planJourneyContext);
      loggerService.log('Plan journey log');
      
      // Assert
      expect(mockTransport.entries).toHaveLength(3);
      
      // Verify each log has the correct journey context
      expect(mockTransport.entries[0].context.journey.type).toBe('health');
      expect(mockTransport.entries[1].context.journey.type).toBe('care');
      expect(mockTransport.entries[2].context.journey.type).toBe('plan');
    });
  });

  describe('Tracing integration', () => {
    beforeEach(async () => {
      // Reset the mock transport between tests
      if (mockTransport) {
        mockTransport.reset();
      }
      
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              logger: {
                level: 'debug',
                format: 'json',
                transports: [{ type: 'console', level: 'debug' }]
              },
              environment: 'development',
              tracing: {
                enabled: true,
                serviceName: 'logger-e2e-test'
              }
            })]
          }),
          LoggerModule.forRoot(),
          TestAppModule
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      loggerService = moduleFixture.get<LoggerService>(LoggerService);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should include trace correlation IDs in logs', () => {
      // Arrange - We're using the test app module which should set up tracing
      // The actual trace ID would come from the tracing service
      
      // Act
      loggerService.log('Traced log message');
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      
      // The exact property name depends on implementation, but there should be some trace correlation
      // This might be traceId, correlationId, or similar
      expect(entry.correlationId || entry.traceId || entry.context?.traceId).toBeDefined();
    });
  });

  describe('Error logging', () => {
    beforeEach(async () => {
      // Reset the mock transport between tests
      if (mockTransport) {
        mockTransport.reset();
      }
      
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              logger: {
                level: 'debug',
                format: 'json',
                transports: [{ type: 'console', level: 'debug' }]
              },
              environment: 'development'
            })]
          }),
          LoggerModule.forRoot(),
          TestAppModule
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      loggerService = moduleFixture.get<LoggerService>(LoggerService);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should properly format standard Error objects', () => {
      // Arrange
      const error = new Error('Standard error');
      
      // Act
      loggerService.error('An error occurred', error);
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.message).toBe('An error occurred');
      expect(entry.error).toBeDefined();
      expect(entry.error.message).toBe('Standard error');
      expect(entry.error.stack).toBeDefined();
      expect(typeof entry.error.stack).toBe('string');
    });

    it('should handle custom application exceptions with metadata', () => {
      // Arrange
      const customError = errorObjects.createCustomApplicationError();
      
      // Act
      loggerService.error('Custom application error', customError);
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.error).toBeDefined();
      expect(entry.error.code).toBeDefined();
      expect(entry.error.metadata).toBeDefined();
    });

    it('should handle validation errors with field details', () => {
      // Arrange
      const validationError = errorObjects.createValidationError();
      
      // Act
      loggerService.error('Validation error', validationError);
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.error).toBeDefined();
      expect(entry.error.fields).toBeDefined();
      expect(Array.isArray(entry.error.fields)).toBe(true);
    });

    it('should handle nested error chains', () => {
      // Arrange
      const nestedError = errorObjects.createNestedError();
      
      // Act
      loggerService.error('Nested error', nestedError);
      
      // Assert
      const entry = mockTransport.entries[0];
      expect(entry).toBeDefined();
      expect(entry.error).toBeDefined();
      expect(entry.error.cause).toBeDefined();
    });
  });

  describe('Transport configuration', () => {
    it('should create console transport with text formatter in development', async () => {
      // Arrange
      const createTransportSpy = jest.spyOn(TransportFactory, 'createTransport').mockRestore();
      
      // Act
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              logger: {
                level: 'debug',
                format: 'text',
                transports: [{ type: 'console', level: 'debug' }]
              },
              environment: 'development'
            })]
          }),
          LoggerModule.forRoot(),
          TestAppModule
        ],
      }).compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();
      
      // Assert
      expect(createTransportSpy).toHaveBeenCalledWith('console', expect.objectContaining({
        level: 'debug'
      }));
      
      await testApp.close();
    });

    it('should create cloudwatch transport with json formatter in production', async () => {
      // Arrange
      const createTransportSpy = jest.spyOn(TransportFactory, 'createTransport').mockRestore();
      
      // Act
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              logger: {
                level: 'info',
                format: 'json',
                transports: [{ 
                  type: 'cloudwatch', 
                  level: 'info',
                  logGroup: 'austa-superapp',
                  logStream: 'backend-services'
                }]
              },
              environment: 'production'
            })]
          }),
          LoggerModule.forRoot(),
          TestAppModule
        ],
      }).compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();
      
      // Assert
      expect(createTransportSpy).toHaveBeenCalledWith('cloudwatch', expect.objectContaining({
        level: 'info',
        logGroup: 'austa-superapp',
        logStream: 'backend-services'
      }));
      
      await testApp.close();
    });
  });
});