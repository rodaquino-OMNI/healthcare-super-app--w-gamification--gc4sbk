import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { FileTransport } from '../../src/transports/file.transport';
import { CloudWatchTransport } from '../../src/transports/cloudwatch.transport';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { CloudWatchFormatter } from '../../src/formatters/cloudwatch.formatter';
import { Transport } from '../../src/interfaces/transport.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { TransportFactory } from '../../src/transports/transport-factory';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { ContextManager } from '../../src/context/context-manager';
import { TracingService } from '@austa/tracing';

// Import test utilities and fixtures
import { MockTransport } from '../mocks/transport.mock';
import { MockTracingService } from '../mocks/tracing.service.mock';
import * as fixtures from './fixtures';
import * as testUtils from './utils';

/**
 * Integration tests for LoggerService with various transports.
 * 
 * These tests verify the correct interaction between LoggerService and the
 * Console, File, and CloudWatch transports. They ensure log entries are properly
 * delivered to the appropriate destinations with correct formatting.
 */
describe('LoggerService Transport Integration', () => {
  // Common test variables
  let loggerService: LoggerService;
  let mockTracingService: TracingService;
  let tempLogDir: string;
  let tempLogFile: string;

  // Setup before all tests
  beforeAll(() => {
    // Create temporary directory for log files
    tempLogDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-test-'));
    tempLogFile = path.join(tempLogDir, 'test.log');
  });

  // Cleanup after all tests
  afterAll(() => {
    // Remove temporary log files and directory
    if (fs.existsSync(tempLogDir)) {
      const files = fs.readdirSync(tempLogDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempLogDir, file));
      });
      fs.rmdirSync(tempLogDir);
    }
  });

  describe('Console Transport Integration', () => {
    let consoleTransport: ConsoleTransport;
    let originalConsoleLog: typeof console.log;
    let originalConsoleError: typeof console.error;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      // Save original console methods
      originalConsoleLog = console.log;
      originalConsoleError = console.error;

      // Create spies for console methods
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create console transport with text formatter
      const textFormatter = new TextFormatter();
      consoleTransport = new ConsoleTransport({
        formatter: textFormatter,
        minLevel: LogLevel.DEBUG,
        colorize: false, // Disable colors for testing
        bufferSize: 1, // Flush immediately for testing
      });

      // Create logger service with console transport
      mockTracingService = new MockTracingService();
      const loggerConfig: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: LogLevel.DEBUG,
        transports: [consoleTransport],
      };

      loggerService = new LoggerService(loggerConfig, mockTracingService);
    });

    afterEach(() => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log messages to console with correct level', async () => {
      // Log messages at different levels
      loggerService.debug('Debug message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');

      // Allow time for async flush
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify console.log was called for debug, info, and warn levels
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      
      // Verify console.error was called for error level
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      // Verify log content contains the messages
      const allCalls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain('Debug message');
      expect(allCalls).toContain('Info message');
      expect(allCalls).toContain('Warning message');
      
      const errorCalls = consoleErrorSpy.mock.calls.flat().join(' ');
      expect(errorCalls).toContain('Error message');
    });

    it('should include context information in console logs', async () => {
      // Create context objects
      const requestContext: RequestContext = fixtures.sampleRequestContext;
      
      // Log with context
      loggerService.log('Message with context', { requestId: requestContext.requestId });
      
      // Allow time for async flush
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify context is included in logs
      const allCalls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain(requestContext.requestId);
    });

    it('should handle errors in console transport gracefully', async () => {
      // Make console.log throw an error
      console.log = jest.fn().mockImplementation(() => {
        throw new Error('Console error');
      });
      
      // This should not throw despite the console error
      expect(() => {
        loggerService.log('This should not throw');
      }).not.toThrow();
      
      // Allow time for async flush
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify error was handled
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should batch console logs correctly', async () => {
      // Create a transport with larger buffer size
      const textFormatter = new TextFormatter();
      const batchedTransport = new ConsoleTransport({
        formatter: textFormatter,
        minLevel: LogLevel.DEBUG,
        colorize: false,
        bufferSize: 5, // Batch 5 logs before flushing
      });

      // Create logger with batched transport
      const batchedLoggerConfig: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: LogLevel.DEBUG,
        transports: [batchedTransport],
      };

      const batchedLogger = new LoggerService(batchedLoggerConfig, mockTracingService);

      // Reset console spies
      consoleLogSpy.mockClear();
      consoleErrorSpy.mockClear();

      // Log 4 messages (less than buffer size)
      batchedLogger.log('Batch message 1');
      batchedLogger.log('Batch message 2');
      batchedLogger.log('Batch message 3');
      batchedLogger.log('Batch message 4');

      // Verify no logs yet (buffer not full)
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Log one more message to trigger flush
      batchedLogger.log('Batch message 5');

      // Allow time for async flush
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify all logs were flushed together
      expect(consoleLogSpy).toHaveBeenCalled();
      const allCalls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain('Batch message 1');
      expect(allCalls).toContain('Batch message 5');
    });
  });

  describe('File Transport Integration', () => {
    let fileTransport: FileTransport;
    
    beforeEach(() => {
      // Create file transport with JSON formatter
      const jsonFormatter = new JsonFormatter();
      fileTransport = new FileTransport({
        filePath: tempLogFile,
        formatter: jsonFormatter,
        minLevel: LogLevel.DEBUG,
        bufferSize: 1, // Flush immediately for testing
        sync: true, // Use synchronous file operations for testing
      });

      // Create logger service with file transport
      mockTracingService = new MockTracingService();
      const loggerConfig: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: LogLevel.DEBUG,
        transports: [fileTransport],
      };

      loggerService = new LoggerService(loggerConfig, mockTracingService);

      // Clear log file before each test
      if (fs.existsSync(tempLogFile)) {
        fs.truncateSync(tempLogFile, 0);
      }
    });

    it('should write logs to file with correct format', async () => {
      // Log messages at different levels
      loggerService.debug('Debug file message');
      loggerService.log('Info file message');
      loggerService.warn('Warning file message');
      loggerService.error('Error file message');

      // Allow time for async flush
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify file exists and has content
      expect(fs.existsSync(tempLogFile)).toBe(true);
      const fileContent = fs.readFileSync(tempLogFile, 'utf8');
      
      // Verify log content contains the messages
      expect(fileContent).toContain('Debug file message');
      expect(fileContent).toContain('Info file message');
      expect(fileContent).toContain('Warning file message');
      expect(fileContent).toContain('Error file message');

      // Verify JSON format
      const logLines = fileContent.trim().split('\n');
      logLines.forEach(line => {
        const logEntry = JSON.parse(line);
        expect(logEntry).toHaveProperty('level');
        expect(logEntry).toHaveProperty('message');
        expect(logEntry).toHaveProperty('timestamp');
        expect(logEntry).toHaveProperty('serviceName', 'test-service');
      });
    });

    it('should include context and trace information in file logs', async () => {
      // Set trace context
      (mockTracingService as MockTracingService).setCurrentTraceContext({
        traceId: 'test-trace-id',
        spanId: 'test-span-id',
      });

      // Create journey context
      const journeyContext: JourneyContext = fixtures.sampleJourneyContext;
      
      // Log with journey context
      loggerService.logWithJourneyContext(
        LogLevel.INFO,
        'Journey context message',
        journeyContext
      );
      
      // Allow time for async flush
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify file content
      const fileContent = fs.readFileSync(tempLogFile, 'utf8');
      const logEntry = JSON.parse(fileContent.trim());
      
      // Verify journey context
      expect(logEntry).toHaveProperty('journeyType', journeyContext.journeyType);
      expect(logEntry).toHaveProperty('journeyId', journeyContext.journeyId);
      
      // Verify trace context
      expect(logEntry).toHaveProperty('traceId', 'test-trace-id');
      expect(logEntry).toHaveProperty('spanId', 'test-span-id');
    });

    it('should handle file rotation correctly', async () => {
      // Create file transport with small max size to trigger rotation
      const jsonFormatter = new JsonFormatter();
      const rotatingTransport = new FileTransport({
        filePath: tempLogFile,
        formatter: jsonFormatter,
        minLevel: LogLevel.DEBUG,
        maxSize: 100, // Very small size to trigger rotation
        maxFiles: 3,
        bufferSize: 1, // Flush immediately
        sync: true, // Synchronous for testing
      });

      // Create logger with rotating transport
      const rotatingLoggerConfig: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: LogLevel.DEBUG,
        transports: [rotatingTransport],
      };

      const rotatingLogger = new LoggerService(rotatingLoggerConfig, mockTracingService);

      // Write logs to trigger rotation
      for (let i = 0; i < 10; i++) {
        rotatingLogger.log(`Rotation test message ${i} with some extra content to make it larger`);
        // Allow time for async operations
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Check for rotated files
      const dirContents = fs.readdirSync(tempLogDir);
      const logFiles = dirContents.filter(file => file.startsWith(path.basename(tempLogFile)));
      
      // Should have original file plus rotated files (up to maxFiles)
      expect(logFiles.length).toBeGreaterThan(1);
      
      // Original file should exist and have content
      expect(fs.existsSync(tempLogFile)).toBe(true);
      expect(fs.readFileSync(tempLogFile, 'utf8')).not.toBe('');
    });

    it('should handle file write errors gracefully', async () => {
      // Create a directory with the same name as the log file to cause a write error
      const errorFilePath = path.join(tempLogDir, 'error-file');
      if (fs.existsSync(errorFilePath)) {
        fs.unlinkSync(errorFilePath);
      }
      fs.mkdirSync(errorFilePath);

      // Create file transport that will fail
      const jsonFormatter = new JsonFormatter();
      const errorTransport = new FileTransport({
        filePath: errorFilePath, // This is a directory, so writes will fail
        formatter: jsonFormatter,
        minLevel: LogLevel.DEBUG,
        bufferSize: 1,
      });

      // Create logger with error transport
      const errorLoggerConfig: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: LogLevel.DEBUG,
        transports: [errorTransport],
      };

      const errorLogger = new LoggerService(errorLoggerConfig, mockTracingService);

      // This should not throw despite the file error
      expect(() => {
        errorLogger.log('This should not throw despite file error');
      }).not.toThrow();

      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Clean up
      fs.rmdirSync(errorFilePath);
    });
  });

  describe('CloudWatch Transport Integration', () => {
    let cloudWatchTransport: CloudWatchTransport;
    let mockCloudWatchClient: any;
    
    beforeEach(() => {
      // Create mock CloudWatch client
      mockCloudWatchClient = testUtils.createMockCloudWatchClient();
      
      // Create CloudWatch transport with CloudWatch formatter
      const cloudWatchFormatter = new CloudWatchFormatter();
      cloudWatchTransport = new CloudWatchTransport({
        region: 'us-east-1',
        logGroupName: 'test-log-group',
        logStreamName: 'test-log-stream',
        batchSize: 1, // Flush immediately for testing
      }, cloudWatchFormatter);
      
      // Replace the AWS client with our mock
      (cloudWatchTransport as any).client = mockCloudWatchClient;
      
      // Initialize the transport
      (cloudWatchTransport as any).logGroupExists = true;
      (cloudWatchTransport as any).logStreamExists = true;
      (cloudWatchTransport as any).initialized = true;

      // Create logger service with CloudWatch transport
      mockTracingService = new MockTracingService();
      const loggerConfig: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: LogLevel.DEBUG,
        transports: [cloudWatchTransport],
      };

      loggerService = new LoggerService(loggerConfig, mockTracingService);
    });

    it('should send logs to CloudWatch with correct format', async () => {
      // Log messages at different levels
      loggerService.debug('Debug CloudWatch message');
      loggerService.log('Info CloudWatch message');
      loggerService.warn('Warning CloudWatch message');
      loggerService.error('Error CloudWatch message');

      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify PutLogEvents was called
      expect(mockCloudWatchClient.send).toHaveBeenCalled();
      
      // Get the PutLogEvents commands
      const putLogEventsCalls = mockCloudWatchClient.send.mock.calls.filter(
        call => call[0].constructor.name === 'PutLogEventsCommand'
      );
      
      // Verify log events were sent
      expect(putLogEventsCalls.length).toBeGreaterThan(0);
      
      // Verify log content
      let foundDebug = false;
      let foundInfo = false;
      let foundWarn = false;
      let foundError = false;
      
      putLogEventsCalls.forEach(call => {
        const command = call[0];
        const logEvents = command.input.logEvents;
        
        logEvents.forEach(event => {
          const message = event.message;
          if (message.includes('Debug CloudWatch message')) foundDebug = true;
          if (message.includes('Info CloudWatch message')) foundInfo = true;
          if (message.includes('Warning CloudWatch message')) foundWarn = true;
          if (message.includes('Error CloudWatch message')) foundError = true;
        });
      });
      
      expect(foundDebug).toBe(true);
      expect(foundInfo).toBe(true);
      expect(foundWarn).toBe(true);
      expect(foundError).toBe(true);
    });

    it('should create log group and stream if they do not exist', async () => {
      // Reset the transport state
      (cloudWatchTransport as any).logGroupExists = false;
      (cloudWatchTransport as any).logStreamExists = false;
      (cloudWatchTransport as any).initialized = false;
      
      // Clear mock calls
      mockCloudWatchClient.send.mockClear();
      
      // Log a message to trigger initialization
      loggerService.log('Initialize CloudWatch transport');
      
      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify describe and create commands were called
      const describeLogGroupsCalls = mockCloudWatchClient.send.mock.calls.filter(
        call => call[0].constructor.name === 'DescribeLogGroupsCommand'
      );
      
      const createLogGroupCalls = mockCloudWatchClient.send.mock.calls.filter(
        call => call[0].constructor.name === 'CreateLogGroupCommand'
      );
      
      const describeLogStreamsCalls = mockCloudWatchClient.send.mock.calls.filter(
        call => call[0].constructor.name === 'DescribeLogStreamsCommand'
      );
      
      const createLogStreamCalls = mockCloudWatchClient.send.mock.calls.filter(
        call => call[0].constructor.name === 'CreateLogStreamCommand'
      );
      
      expect(describeLogGroupsCalls.length).toBeGreaterThan(0);
      expect(createLogGroupCalls.length).toBeGreaterThan(0);
      expect(describeLogStreamsCalls.length).toBeGreaterThan(0);
      expect(createLogStreamCalls.length).toBeGreaterThan(0);
    });

    it('should handle CloudWatch API errors gracefully', async () => {
      // Make the CloudWatch client throw an error
      mockCloudWatchClient.send.mockRejectedValueOnce(new Error('CloudWatch API error'));
      
      // This should not throw despite the API error
      expect(() => {
        loggerService.log('This should not throw despite CloudWatch error');
      }).not.toThrow();
      
      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should batch CloudWatch logs correctly', async () => {
      // Create a transport with larger batch size
      const cloudWatchFormatter = new CloudWatchFormatter();
      const batchedTransport = new CloudWatchTransport({
        region: 'us-east-1',
        logGroupName: 'test-log-group',
        logStreamName: 'test-log-stream',
        batchSize: 5, // Batch 5 logs before sending
      }, cloudWatchFormatter);
      
      // Replace the AWS client with our mock
      (batchedTransport as any).client = mockCloudWatchClient;
      
      // Initialize the transport
      (batchedTransport as any).logGroupExists = true;
      (batchedTransport as any).logStreamExists = true;
      (batchedTransport as any).initialized = true;

      // Create logger with batched transport
      const batchedLoggerConfig: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: LogLevel.DEBUG,
        transports: [batchedTransport],
      };

      const batchedLogger = new LoggerService(batchedLoggerConfig, mockTracingService);

      // Clear mock calls
      mockCloudWatchClient.send.mockClear();

      // Log 4 messages (less than batch size)
      batchedLogger.log('Batch CloudWatch message 1');
      batchedLogger.log('Batch CloudWatch message 2');
      batchedLogger.log('Batch CloudWatch message 3');
      batchedLogger.log('Batch CloudWatch message 4');

      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify no PutLogEvents calls yet (batch not full)
      const putLogEventsCalls = mockCloudWatchClient.send.mock.calls.filter(
        call => call[0].constructor.name === 'PutLogEventsCommand'
      );
      expect(putLogEventsCalls.length).toBe(0);

      // Log one more message to trigger batch send
      batchedLogger.log('Batch CloudWatch message 5');

      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify batch was sent
      const updatedPutLogEventsCalls = mockCloudWatchClient.send.mock.calls.filter(
        call => call[0].constructor.name === 'PutLogEventsCommand'
      );
      expect(updatedPutLogEventsCalls.length).toBeGreaterThan(0);
      
      // Verify all messages were in the batch
      const lastCall = updatedPutLogEventsCalls[updatedPutLogEventsCalls.length - 1];
      const logEvents = lastCall[0].input.logEvents;
      expect(logEvents.length).toBe(5);
    });
  });

  describe('Multiple Transports Integration', () => {
    let consoleTransport: ConsoleTransport;
    let fileTransport: FileTransport;
    let mockTransport: MockTransport;
    let consoleLogSpy: jest.SpyInstance;
    
    beforeEach(() => {
      // Create spies for console methods
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Create transports
      const textFormatter = new TextFormatter();
      const jsonFormatter = new JsonFormatter();
      
      consoleTransport = new ConsoleTransport({
        formatter: textFormatter,
        minLevel: LogLevel.INFO, // Only INFO and above
        colorize: false,
        bufferSize: 1,
      });
      
      fileTransport = new FileTransport({
        filePath: tempLogFile,
        formatter: jsonFormatter,
        minLevel: LogLevel.WARN, // Only WARN and above
        bufferSize: 1,
        sync: true,
      });
      
      mockTransport = new MockTransport();
      
      // Create logger service with multiple transports
      mockTracingService = new MockTracingService();
      const loggerConfig: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: LogLevel.DEBUG, // Logger accepts all levels
        transports: [consoleTransport, fileTransport, mockTransport],
      };

      loggerService = new LoggerService(loggerConfig, mockTracingService);

      // Clear log file before each test
      if (fs.existsSync(tempLogFile)) {
        fs.truncateSync(tempLogFile, 0);
      }
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should respect different log levels for different transports', async () => {
      // Log at DEBUG level (should only go to mockTransport)
      loggerService.debug('Debug multi-transport message');
      
      // Log at INFO level (should go to console and mock, but not file)
      loggerService.log('Info multi-transport message');
      
      // Log at WARN level (should go to all transports)
      loggerService.warn('Warning multi-transport message');
      
      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify console transport (INFO and above)
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // INFO and WARN
      const consoleCalls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(consoleCalls).not.toContain('Debug multi-transport message');
      expect(consoleCalls).toContain('Info multi-transport message');
      expect(consoleCalls).toContain('Warning multi-transport message');
      
      // Verify file transport (WARN and above)
      const fileContent = fs.readFileSync(tempLogFile, 'utf8');
      expect(fileContent).not.toContain('Debug multi-transport message');
      expect(fileContent).not.toContain('Info multi-transport message');
      expect(fileContent).toContain('Warning multi-transport message');
      
      // Verify mock transport (all levels)
      expect(mockTransport.getWrittenLogs()).toHaveLength(3); // DEBUG, INFO, WARN
      expect(mockTransport.getWrittenLogs()[0].message).toContain('Debug multi-transport message');
      expect(mockTransport.getWrittenLogs()[1].message).toContain('Info multi-transport message');
      expect(mockTransport.getWrittenLogs()[2].message).toContain('Warning multi-transport message');
    });

    it('should handle transport failures without affecting other transports', async () => {
      // Make file transport fail
      jest.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
        throw new Error('File write error');
      });
      
      // Log a message
      loggerService.error('Error message with failing transport');
      
      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify console transport still worked
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Verify mock transport still worked
      expect(mockTransport.getWrittenLogs()).toHaveLength(1);
      expect(mockTransport.getWrittenLogs()[0].message).toContain('Error message with failing transport');
    });

    it('should propagate context and trace information to all transports', async () => {
      // Set trace context
      (mockTracingService as MockTracingService).setCurrentTraceContext({
        traceId: 'multi-trace-id',
        spanId: 'multi-span-id',
      });

      // Create user context
      const userContext: UserContext = fixtures.sampleUserContext;
      
      // Log with user context
      loggerService.logWithUserContext(
        LogLevel.ERROR,
        'User context message to multiple transports',
        userContext
      );
      
      // Allow time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify file transport received context
      const fileContent = fs.readFileSync(tempLogFile, 'utf8');
      const fileLogEntry = JSON.parse(fileContent.trim());
      expect(fileLogEntry).toHaveProperty('userId', userContext.userId);
      expect(fileLogEntry).toHaveProperty('traceId', 'multi-trace-id');
      
      // Verify mock transport received context
      const mockLogs = mockTransport.getWrittenLogs();
      expect(mockLogs[0]).toHaveProperty('userId', userContext.userId);
      expect(mockLogs[0]).toHaveProperty('traceId', 'multi-trace-id');
    });
  });

  describe('Transport Factory Integration', () => {
    it('should create console transport with correct configuration', () => {
      const transport = TransportFactory.createConsoleTransport({
        minLevel: LogLevel.INFO,
        colorize: true,
      });
      
      expect(transport).toBeInstanceOf(ConsoleTransport);
      expect((transport as any).options.minLevel).toBe(LogLevel.INFO);
      expect((transport as any).options.colorize).toBe(true);
    });

    it('should create file transport with correct configuration', () => {
      const transport = TransportFactory.createFileTransport({
        filePath: tempLogFile,
        minLevel: LogLevel.WARN,
        maxSize: 1024 * 1024,
      });
      
      expect(transport).toBeInstanceOf(FileTransport);
      expect((transport as any).options.filePath).toBe(tempLogFile);
      expect((transport as any).options.minLevel).toBe(LogLevel.WARN);
      expect((transport as any).options.maxSize).toBe(1024 * 1024);
    });

    it('should create CloudWatch transport with correct configuration', () => {
      const transport = TransportFactory.createCloudWatchTransport({
        region: 'us-west-2',
        logGroupName: 'test-group',
        logStreamName: 'test-stream',
      });
      
      expect(transport).toBeInstanceOf(CloudWatchTransport);
      expect((transport as any).config.region).toBe('us-west-2');
      expect((transport as any).config.logGroupName).toBe('test-group');
      expect((transport as any).config.logStreamName).toBe('test-stream');
    });

    it('should create transport from configuration object', () => {
      const consoleConfig = {
        type: 'console',
        options: {
          minLevel: LogLevel.INFO,
          colorize: true,
        },
      };
      
      const fileConfig = {
        type: 'file',
        options: {
          filePath: tempLogFile,
          minLevel: LogLevel.WARN,
        },
      };
      
      const cloudWatchConfig = {
        type: 'cloudwatch',
        options: {
          region: 'us-east-1',
          logGroupName: 'test-group',
        },
      };
      
      const consoleTransport = TransportFactory.createTransport(consoleConfig);
      const fileTransport = TransportFactory.createTransport(fileConfig);
      const cloudWatchTransport = TransportFactory.createTransport(cloudWatchConfig);
      
      expect(consoleTransport).toBeInstanceOf(ConsoleTransport);
      expect(fileTransport).toBeInstanceOf(FileTransport);
      expect(cloudWatchTransport).toBeInstanceOf(CloudWatchTransport);
    });

    it('should throw error for invalid transport type', () => {
      const invalidConfig = {
        type: 'invalid-type',
        options: {},
      };
      
      expect(() => {
        TransportFactory.createTransport(invalidConfig);
      }).toThrow();
    });
  });
});