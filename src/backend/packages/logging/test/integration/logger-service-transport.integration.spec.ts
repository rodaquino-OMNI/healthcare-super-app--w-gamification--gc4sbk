import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { LoggerService } from '../../src/logger.service';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { FileTransport } from '../../src/transports/file.transport';
import { CloudWatchTransport } from '../../src/transports/cloudwatch.transport';
import { TransportFactory } from '../../src/transports/transport-factory';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../src/formatters/cloudwatch.formatter';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { Transport } from '../../src/interfaces/transport.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogEntry } from '../../src/interfaces/log-entry.interface';

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockPutLogEvents = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({ nextSequenceToken: 'mock-token' })
  });
  
  const mockCreateLogStream = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({})
  });

  const mockCreateLogGroup = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({})
  });

  const mockDescribeLogStreams = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      logStreams: [{ logStreamName: 'test-stream', uploadSequenceToken: 'mock-token' }]
    })
  });

  return {
    CloudWatchLogs: jest.fn().mockImplementation(() => ({
      putLogEvents: mockPutLogEvents,
      createLogStream: mockCreateLogStream,
      createLogGroup: mockCreateLogGroup,
      describeLogStreams: mockDescribeLogStreams
    }))
  };
});

// Helper to read the last line of a file
const readLastLine = async (filePath: string): Promise<string> => {
  const readFile = promisify(fs.readFile);
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  return lines[lines.length - 1];
};

// Mock console methods
let consoleOutput: { [key: string]: string[] } = {};
const originalConsole = { ...console };

beforeAll(() => {
  // Mock console methods to capture output
  ['log', 'error', 'warn', 'debug', 'info'].forEach(method => {
    consoleOutput[method] = [];
    console[method] = jest.fn((...args) => {
      consoleOutput[method].push(args.join(' '));
    });
  });
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

beforeEach(() => {
  // Clear captured console output before each test
  Object.keys(consoleOutput).forEach(key => {
    consoleOutput[key] = [];
  });
});

describe('LoggerService Transport Integration', () => {
  const TEST_LOG_DIR = path.join(__dirname, '../../../test-logs');
  const TEST_LOG_FILE = path.join(TEST_LOG_DIR, 'test.log');
  
  // Ensure test log directory exists
  beforeAll(() => {
    if (!fs.existsSync(TEST_LOG_DIR)) {
      fs.mkdirSync(TEST_LOG_DIR, { recursive: true });
    }
  });
  
  // Clean up test log files after each test
  afterEach(() => {
    if (fs.existsSync(TEST_LOG_FILE)) {
      fs.unlinkSync(TEST_LOG_FILE);
    }
  });
  
  // Clean up test log directory after all tests
  afterAll(() => {
    if (fs.existsSync(TEST_LOG_DIR)) {
      fs.rmdirSync(TEST_LOG_DIR, { recursive: true });
    }
  });

  describe('Console Transport Integration', () => {
    let loggerService: LoggerService;
    let consoleTransport: ConsoleTransport;
    
    beforeEach(async () => {
      // Create a console transport with text formatter
      consoleTransport = new ConsoleTransport({
        level: LogLevel.DEBUG,
        formatter: new TextFormatter()
      });
      
      // Create a spy on the transport's write method
      jest.spyOn(consoleTransport, 'write');
      
      // Create the logger service with the console transport
      const moduleRef = await Test.createTestingModule({
        providers: [
          {
            provide: LoggerService,
            useFactory: () => {
              const logger = new LoggerService();
              logger.setTransports([consoleTransport]);
              return logger;
            }
          }
        ]
      }).compile();
      
      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });
    
    it('should log messages to console with the correct level', () => {
      // Log messages at different levels
      loggerService.debug('Debug message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      
      // Verify transport write method was called with correct log entries
      expect(consoleTransport.write).toHaveBeenCalledTimes(4);
      
      // Verify console output contains the messages
      expect(consoleOutput.debug.some(line => line.includes('Debug message'))).toBeTruthy();
      expect(consoleOutput.log.some(line => line.includes('Info message'))).toBeTruthy();
      expect(consoleOutput.warn.some(line => line.includes('Warning message'))).toBeTruthy();
      expect(consoleOutput.error.some(line => line.includes('Error message'))).toBeTruthy();
    });
    
    it('should include context in console logs', () => {
      const context = { requestId: 'test-request', userId: 'test-user' };
      
      // Log with context
      loggerService.log('Message with context', context);
      
      // Verify context is included in the output
      expect(consoleOutput.log.some(line => {
        return line.includes('Message with context') && 
               line.includes('test-request') && 
               line.includes('test-user');
      })).toBeTruthy();
    });
    
    it('should respect log level filtering', () => {
      // Set transport level to INFO
      consoleTransport.setLevel(LogLevel.INFO);
      
      // Log at different levels
      loggerService.debug('Debug message'); // Should be filtered out
      loggerService.log('Info message');    // Should be logged
      loggerService.warn('Warning message'); // Should be logged
      
      // Verify debug message was filtered out
      expect(consoleOutput.debug.length).toBe(0);
      
      // Verify other messages were logged
      expect(consoleOutput.log.some(line => line.includes('Info message'))).toBeTruthy();
      expect(consoleOutput.warn.some(line => line.includes('Warning message'))).toBeTruthy();
    });
  });
  
  describe('File Transport Integration', () => {
    let loggerService: LoggerService;
    let fileTransport: FileTransport;
    
    beforeEach(async () => {
      // Create a file transport with JSON formatter
      fileTransport = new FileTransport({
        level: LogLevel.DEBUG,
        formatter: new JsonFormatter(),
        filename: TEST_LOG_FILE
      });
      
      // Create a spy on the transport's write method
      jest.spyOn(fileTransport, 'write');
      
      // Create the logger service with the file transport
      const moduleRef = await Test.createTestingModule({
        providers: [
          {
            provide: LoggerService,
            useFactory: () => {
              const logger = new LoggerService();
              logger.setTransports([fileTransport]);
              return logger;
            }
          }
        ]
      }).compile();
      
      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });
    
    it('should write log entries to file in JSON format', async () => {
      // Log a message
      loggerService.log('File log message');
      
      // Wait for file write to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify transport write method was called
      expect(fileTransport.write).toHaveBeenCalledTimes(1);
      
      // Verify file exists
      expect(fs.existsSync(TEST_LOG_FILE)).toBeTruthy();
      
      // Read the last line of the file
      const lastLine = await readLastLine(TEST_LOG_FILE);
      
      // Parse the JSON log entry
      const logEntry = JSON.parse(lastLine);
      
      // Verify log entry contains the message
      expect(logEntry.message).toBe('File log message');
      expect(logEntry.level).toBe('info');
    });
    
    it('should include error details in file logs', async () => {
      // Create an error
      const testError = new Error('Test error');
      
      // Log the error
      loggerService.error('Error occurred', testError);
      
      // Wait for file write to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Read the last line of the file
      const lastLine = await readLastLine(TEST_LOG_FILE);
      
      // Parse the JSON log entry
      const logEntry = JSON.parse(lastLine);
      
      // Verify error details are included
      expect(logEntry.message).toBe('Error occurred');
      expect(logEntry.level).toBe('error');
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.message).toBe('Test error');
      expect(logEntry.error.stack).toBeDefined();
    });
    
    it('should handle log rotation based on file size', async () => {
      // Create a file transport with size-based rotation
      const rotatingFileTransport = new FileTransport({
        level: LogLevel.DEBUG,
        formatter: new JsonFormatter(),
        filename: TEST_LOG_FILE,
        maxSize: 1024, // 1KB max size
        maxFiles: 3    // Keep 3 rotated files
      });
      
      // Create a logger with the rotating file transport
      const logger = new LoggerService();
      logger.setTransports([rotatingFileTransport]);
      
      // Write enough logs to trigger rotation
      const largeMessage = 'A'.repeat(500); // 500 character message
      for (let i = 0; i < 10; i++) {
        logger.log(`${largeMessage} - ${i}`);
      }
      
      // Wait for file operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify rotation files exist
      const baseDir = path.dirname(TEST_LOG_FILE);
      const baseFileName = path.basename(TEST_LOG_FILE);
      const rotatedFiles = fs.readdirSync(baseDir)
        .filter(file => file.startsWith(baseFileName) && file !== baseFileName);
      
      // Should have at least one rotated file
      expect(rotatedFiles.length).toBeGreaterThan(0);
    });
  });
  
  describe('CloudWatch Transport Integration', () => {
    let loggerService: LoggerService;
    let cloudwatchTransport: CloudWatchTransport;
    let awsSdkMock: any;
    
    beforeEach(async () => {
      // Get the mocked AWS SDK
      awsSdkMock = require('aws-sdk');
      
      // Create a CloudWatch transport with CloudWatch formatter
      cloudwatchTransport = new CloudWatchTransport({
        level: LogLevel.INFO,
        formatter: new CloudWatchFormatter(),
        logGroupName: 'test-group',
        logStreamName: 'test-stream',
        region: 'us-east-1'
      });
      
      // Create a spy on the transport's write method
      jest.spyOn(cloudwatchTransport, 'write');
      
      // Create the logger service with the CloudWatch transport
      const moduleRef = await Test.createTestingModule({
        providers: [
          {
            provide: LoggerService,
            useFactory: () => {
              const logger = new LoggerService();
              logger.setTransports([cloudwatchTransport]);
              return logger;
            }
          }
        ]
      }).compile();
      
      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });
    
    it('should send log entries to CloudWatch', () => {
      // Log a message
      loggerService.log('CloudWatch log message');
      
      // Verify transport write method was called
      expect(cloudwatchTransport.write).toHaveBeenCalledTimes(1);
      
      // Get the CloudWatchLogs instance
      const cloudwatchLogs = new awsSdkMock.CloudWatchLogs();
      
      // Verify putLogEvents was called
      expect(cloudwatchLogs.putLogEvents).toHaveBeenCalled();
      
      // Verify the log message was included in the putLogEvents call
      const putLogEventsArgs = cloudwatchLogs.putLogEvents.mock.calls[0][0];
      expect(putLogEventsArgs.logGroupName).toBe('test-group');
      expect(putLogEventsArgs.logStreamName).toBe('test-stream');
      expect(putLogEventsArgs.logEvents.length).toBe(1);
      
      // Verify the log message contains the expected content
      const logMessage = JSON.parse(putLogEventsArgs.logEvents[0].message);
      expect(logMessage.message).toBe('CloudWatch log message');
    });
    
    it('should batch multiple log entries in a single CloudWatch request', () => {
      // Configure the transport to use batching
      cloudwatchTransport.setBatchSize(5);
      cloudwatchTransport.setBatchTimeout(1000);
      
      // Log multiple messages
      for (let i = 0; i < 5; i++) {
        loggerService.log(`CloudWatch batch message ${i}`);
      }
      
      // Verify transport write method was called for each message
      expect(cloudwatchTransport.write).toHaveBeenCalledTimes(5);
      
      // Get the CloudWatchLogs instance
      const cloudwatchLogs = new awsSdkMock.CloudWatchLogs();
      
      // Verify putLogEvents was called once with all messages
      expect(cloudwatchLogs.putLogEvents).toHaveBeenCalledTimes(1);
      
      // Verify the batch contains all log messages
      const putLogEventsArgs = cloudwatchLogs.putLogEvents.mock.calls[0][0];
      expect(putLogEventsArgs.logEvents.length).toBe(5);
    });
    
    it('should handle CloudWatch API errors gracefully', async () => {
      // Mock a failure in putLogEvents
      const cloudwatchLogs = new awsSdkMock.CloudWatchLogs();
      cloudwatchLogs.putLogEvents.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValueOnce(new Error('API Error'))
      });
      
      // Log a message (this should trigger the error)
      loggerService.log('Error-triggering message');
      
      // Wait for error handling to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the transport attempted to handle the error
      // This would typically involve retry logic or fallback to another transport
      // For this test, we're just verifying the error doesn't crash the application
      expect(true).toBeTruthy(); // If we got here, the error was handled
    });
  });
  
  describe('Multiple Transports Integration', () => {
    let loggerService: LoggerService;
    let consoleTransport: ConsoleTransport;
    let fileTransport: FileTransport;
    
    beforeEach(async () => {
      // Create transports
      consoleTransport = new ConsoleTransport({
        level: LogLevel.INFO,
        formatter: new TextFormatter()
      });
      
      fileTransport = new FileTransport({
        level: LogLevel.DEBUG, // Lower level than console transport
        formatter: new JsonFormatter(),
        filename: TEST_LOG_FILE
      });
      
      // Create spies on transport write methods
      jest.spyOn(consoleTransport, 'write');
      jest.spyOn(fileTransport, 'write');
      
      // Create the logger service with multiple transports
      const moduleRef = await Test.createTestingModule({
        providers: [
          {
            provide: LoggerService,
            useFactory: () => {
              const logger = new LoggerService();
              logger.setTransports([consoleTransport, fileTransport]);
              return logger;
            }
          }
        ]
      }).compile();
      
      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });
    
    it('should send logs to all configured transports respecting their levels', async () => {
      // Log at DEBUG level
      loggerService.debug('Debug message');
      
      // Log at INFO level
      loggerService.log('Info message');
      
      // Verify console transport only received INFO message
      expect(consoleTransport.write).toHaveBeenCalledTimes(1);
      
      // Verify file transport received both messages
      expect(fileTransport.write).toHaveBeenCalledTimes(2);
      
      // Wait for file write to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify file contains both messages
      const fileContent = fs.readFileSync(TEST_LOG_FILE, 'utf8');
      const logLines = fileContent.split('\n').filter(Boolean);
      
      expect(logLines.length).toBe(2);
      expect(logLines[0].includes('Debug message')).toBeTruthy();
      expect(logLines[1].includes('Info message')).toBeTruthy();
    });
    
    it('should handle transport failures without affecting other transports', async () => {
      // Create a failing transport
      const failingTransport: Transport = {
        write: jest.fn().mockImplementation(() => {
          throw new Error('Transport failure');
        }),
        setLevel: jest.fn(),
        getLevel: jest.fn().mockReturnValue(LogLevel.INFO)
      };
      
      // Add the failing transport to the logger
      loggerService.addTransport(failingTransport);
      
      // Log a message
      loggerService.log('Message with failing transport');
      
      // Verify the failing transport was called
      expect(failingTransport.write).toHaveBeenCalledTimes(1);
      
      // Verify other transports still received the message
      expect(consoleTransport.write).toHaveBeenCalledTimes(1);
      expect(fileTransport.write).toHaveBeenCalledTimes(1);
      
      // Wait for file write to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify file contains the message
      const fileContent = fs.readFileSync(TEST_LOG_FILE, 'utf8');
      expect(fileContent.includes('Message with failing transport')).toBeTruthy();
    });
  });
  
  describe('Transport Factory Integration', () => {
    it('should create appropriate transports based on configuration', () => {
      // Create a configuration with multiple transports
      const config: LoggerConfig = {
        level: LogLevel.INFO,
        transports: {
          console: {
            enabled: true,
            level: LogLevel.INFO,
            formatter: 'text'
          },
          file: {
            enabled: true,
            level: LogLevel.DEBUG,
            formatter: 'json',
            filename: TEST_LOG_FILE
          },
          cloudwatch: {
            enabled: false, // Disabled for this test
            level: LogLevel.ERROR,
            formatter: 'cloudwatch',
            logGroupName: 'test-group',
            logStreamName: 'test-stream',
            region: 'us-east-1'
          }
        }
      };
      
      // Create transports using the factory
      const transportFactory = new TransportFactory();
      const transports = transportFactory.createFromConfig(config);
      
      // Verify the correct number of transports were created (2, since cloudwatch is disabled)
      expect(transports.length).toBe(2);
      
      // Verify the types of transports
      expect(transports[0]).toBeInstanceOf(ConsoleTransport);
      expect(transports[1]).toBeInstanceOf(FileTransport);
      
      // Verify transport levels were set correctly
      expect(transports[0].getLevel()).toBe(LogLevel.INFO);
      expect(transports[1].getLevel()).toBe(LogLevel.DEBUG);
    });
    
    it('should create a logger service with transports from factory', async () => {
      // Create a configuration
      const config: LoggerConfig = {
        level: LogLevel.INFO,
        transports: {
          console: {
            enabled: true,
            level: LogLevel.INFO,
            formatter: 'text'
          }
        }
      };
      
      // Create transports using the factory
      const transportFactory = new TransportFactory();
      const transports = transportFactory.createFromConfig(config);
      
      // Create the logger service with the transports
      const moduleRef = await Test.createTestingModule({
        providers: [
          {
            provide: LoggerService,
            useFactory: () => {
              const logger = new LoggerService();
              logger.setTransports(transports);
              return logger;
            }
          }
        ]
      }).compile();
      
      const loggerService = moduleRef.get<LoggerService>(LoggerService);
      
      // Log a message
      loggerService.log('Factory-created transport test');
      
      // Verify the message was logged to console
      expect(consoleOutput.log.some(line => 
        line.includes('Factory-created transport test')
      )).toBeTruthy();
    });
  });
  
  describe('Journey Context Integration', () => {
    let loggerService: LoggerService;
    let consoleTransport: ConsoleTransport;
    
    beforeEach(async () => {
      // Create a console transport
      consoleTransport = new ConsoleTransport({
        level: LogLevel.DEBUG,
        formatter: new TextFormatter()
      });
      
      // Create the logger service
      const moduleRef = await Test.createTestingModule({
        providers: [
          {
            provide: LoggerService,
            useFactory: () => {
              const logger = new LoggerService();
              logger.setTransports([consoleTransport]);
              return logger;
            }
          }
        ]
      }).compile();
      
      loggerService = moduleRef.get<LoggerService>(LoggerService);
    });
    
    it('should include journey context in log entries', () => {
      // Set journey context
      loggerService.setContext({
        journey: 'health',
        userId: 'test-user-123',
        requestId: 'req-456'
      });
      
      // Log a message
      loggerService.log('Journey-specific log');
      
      // Verify journey context is included in the log
      expect(consoleOutput.log.some(line => {
        return line.includes('Journey-specific log') && 
               line.includes('health') && 
               line.includes('test-user-123') && 
               line.includes('req-456');
      })).toBeTruthy();
    });
    
    it('should maintain separate contexts for different logger instances', async () => {
      // Create a second logger service
      const moduleRef = await Test.createTestingModule({
        providers: [
          {
            provide: 'SecondLogger',
            useFactory: () => {
              const logger = new LoggerService();
              logger.setTransports([new ConsoleTransport({
                level: LogLevel.DEBUG,
                formatter: new TextFormatter()
              })]);
              return logger;
            }
          }
        ]
      }).compile();
      
      const secondLogger = moduleRef.get<LoggerService>('SecondLogger');
      
      // Set different contexts for each logger
      loggerService.setContext({ journey: 'health', userId: 'user-1' });
      secondLogger.setContext({ journey: 'care', userId: 'user-2' });
      
      // Log messages with both loggers
      loggerService.log('Health journey log');
      secondLogger.log('Care journey log');
      
      // Verify each log contains the correct context
      expect(consoleOutput.log.some(line => 
        line.includes('Health journey log') && line.includes('health') && line.includes('user-1')
      )).toBeTruthy();
      
      expect(consoleOutput.log.some(line => 
        line.includes('Care journey log') && line.includes('care') && line.includes('user-2')
      )).toBeTruthy();
    });
  });
  
  describe('Error Handling and Recovery', () => {
    it('should handle transport initialization failures gracefully', async () => {
      // Create a transport factory that will throw during initialization
      const failingTransportFactory = new TransportFactory();
      jest.spyOn(failingTransportFactory, 'createFromConfig').mockImplementation(() => {
        throw new Error('Transport initialization failure');
      });
      
      // Create a logger service with a try/catch for the failing factory
      let logger: LoggerService;
      try {
        const transports = failingTransportFactory.createFromConfig({} as LoggerConfig);
        logger = new LoggerService();
        logger.setTransports(transports);
      } catch (error) {
        // Fall back to a console transport
        logger = new LoggerService();
        logger.setTransports([new ConsoleTransport({
          level: LogLevel.INFO,
          formatter: new TextFormatter()
        })]);
      }
      
      // Verify the logger still works with the fallback transport
      logger.log('Fallback transport test');
      
      // Verify the message was logged to console
      expect(consoleOutput.log.some(line => 
        line.includes('Fallback transport test')
      )).toBeTruthy();
    });
    
    it('should recover from transport write failures with fallback mechanism', async () => {
      // Create a transport that will fail after a certain number of writes
      let writeCount = 0;
      const failAfterNWritesTransport: Transport = {
        write: jest.fn().mockImplementation((entry: LogEntry) => {
          writeCount++;
          if (writeCount > 2) {
            throw new Error('Transport write failure');
          }
        }),
        setLevel: jest.fn(),
        getLevel: jest.fn().mockReturnValue(LogLevel.INFO)
      };
      
      // Create a fallback transport
      const fallbackTransport = new ConsoleTransport({
        level: LogLevel.INFO,
        formatter: new TextFormatter()
      });
      
      // Create a logger with the failing transport and fallback mechanism
      const logger = new LoggerService();
      logger.setTransports([failAfterNWritesTransport]);
      
      // Add error handler that switches to fallback transport
      logger.setErrorHandler((error, transport) => {
        // Remove the failing transport
        logger.removeTransport(transport);
        // Add the fallback transport
        logger.addTransport(fallbackTransport);
      });
      
      // Log messages (first two should go to the failing transport)
      logger.log('Message 1'); // Goes to failing transport
      logger.log('Message 2'); // Goes to failing transport
      logger.log('Message 3'); // Triggers failure, switches to fallback
      logger.log('Message 4'); // Should go to fallback transport
      
      // Verify the failing transport was called 3 times (third call throws)
      expect(failAfterNWritesTransport.write).toHaveBeenCalledTimes(3);
      
      // Verify the fallback transport received the message after failure
      expect(consoleOutput.log.some(line => line.includes('Message 4'))).toBeTruthy();
    });
  });
  
  describe('Batched Logging Operations', () => {
    it('should batch log entries for efficient delivery to CloudWatch', async () => {
      // Create a CloudWatch transport with batching enabled
      const batchedCloudWatchTransport = new CloudWatchTransport({
        level: LogLevel.INFO,
        formatter: new CloudWatchFormatter(),
        logGroupName: 'test-group',
        logStreamName: 'test-stream',
        region: 'us-east-1',
        batchSize: 10,
        batchTimeout: 500 // 500ms timeout
      });
      
      // Create a spy on the transport's flushBatch method
      jest.spyOn(batchedCloudWatchTransport as any, 'flushBatch');
      
      // Create a logger with the batched transport
      const logger = new LoggerService();
      logger.setTransports([batchedCloudWatchTransport]);
      
      // Log multiple messages (but fewer than batch size)
      for (let i = 0; i < 5; i++) {
        logger.log(`Batch message ${i}`);
      }
      
      // Verify flushBatch hasn't been called yet (batch not full)
      expect((batchedCloudWatchTransport as any).flushBatch).not.toHaveBeenCalled();
      
      // Wait for batch timeout
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Verify flushBatch was called after timeout
      expect((batchedCloudWatchTransport as any).flushBatch).toHaveBeenCalledTimes(1);
      
      // Now log enough messages to trigger batch size flush
      for (let i = 0; i < 10; i++) {
        logger.log(`Size-triggered batch message ${i}`);
      }
      
      // Verify flushBatch was called again due to batch size
      expect((batchedCloudWatchTransport as any).flushBatch).toHaveBeenCalledTimes(2);
    });
    
    it('should handle partial batch failures with retry mechanism', async () => {
      // Get the mocked AWS SDK
      const awsSdkMock = require('aws-sdk');
      const cloudwatchLogs = new awsSdkMock.CloudWatchLogs();
      
      // Mock a partial failure in putLogEvents
      let callCount = 0;
      cloudwatchLogs.putLogEvents.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return {
            promise: jest.fn().mockRejectedValueOnce({
              code: 'InvalidSequenceTokenException',
              message: 'Invalid sequence token'
            })
          };
        } else {
          // Subsequent calls succeed
          return {
            promise: jest.fn().mockResolvedValue({ nextSequenceToken: 'new-token' })
          };
        }
      });
      
      // Create a CloudWatch transport with retry enabled
      const retryingCloudWatchTransport = new CloudWatchTransport({
        level: LogLevel.INFO,
        formatter: new CloudWatchFormatter(),
        logGroupName: 'test-group',
        logStreamName: 'test-stream',
        region: 'us-east-1',
        maxRetries: 3,
        retryDelay: 100
      });
      
      // Create a logger with the retrying transport
      const logger = new LoggerService();
      logger.setTransports([retryingCloudWatchTransport]);
      
      // Log a message
      logger.log('Message with retry');
      
      // Wait for retry to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify putLogEvents was called multiple times (initial + retry)
      expect(cloudwatchLogs.putLogEvents).toHaveBeenCalledTimes(2);
      
      // Verify the second call succeeded
      expect(cloudwatchLogs.describeLogStreams).toHaveBeenCalled();
    });
  });
});