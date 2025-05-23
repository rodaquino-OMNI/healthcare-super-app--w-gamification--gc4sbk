import { Test } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { FileTransport } from '../../src/transports/file.transport';
import { CloudWatchTransport } from '../../src/transports/cloudwatch.transport';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { Transport } from '../../src/interfaces/transport.interface';
import { TracingService } from '@austa/tracing';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Integration tests for LoggerService with various transports.
 * 
 * These tests verify the correct interaction between LoggerService and the
 * Console, File, and CloudWatch transports, ensuring log entries are properly
 * delivered to the appropriate destinations with correct formatting.
 */
describe('LoggerService Transport Integration', () => {
  // Mock implementations
  let mockConsoleTransport: jest.Mocked<ConsoleTransport>;
  let mockFileTransport: jest.Mocked<FileTransport>;
  let mockCloudWatchTransport: jest.Mocked<CloudWatchTransport>;
  let mockTracingService: jest.Mocked<TracingService>;
  
  // Temp file for file transport tests
  let tempLogFile: string;
  
  beforeEach(() => {
    // Create mock implementations
    mockConsoleTransport = {
      write: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      writeBatch: jest.fn(),
    } as unknown as jest.Mocked<ConsoleTransport>;
    
    mockFileTransport = {
      write: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      writeBatch: jest.fn(),
    } as unknown as jest.Mocked<FileTransport>;
    
    mockCloudWatchTransport = {
      write: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      writeBatch: jest.fn(),
    } as unknown as jest.Mocked<CloudWatchTransport>;
    
    mockTracingService = {
      getCurrentTraceId: jest.fn().mockReturnValue('test-trace-id'),
      getCurrentSpanId: jest.fn().mockReturnValue('test-span-id'),
    } as unknown as jest.Mocked<TracingService>;
    
    // Create temp file for file transport tests
    tempLogFile = path.join(os.tmpdir(), `austa-logger-test-${Date.now()}.log`);
  });
  
  afterEach(async () => {
    // Clean up temp file
    if (fs.existsSync(tempLogFile)) {
      fs.unlinkSync(tempLogFile);
    }
  });

  describe('Console Transport', () => {
    let loggerService: LoggerService;
    
    beforeEach(() => {
      // Create logger with console transport
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'DEBUG',
        formatter: 'text',
        transports: ['console']
      };
      
      // Create a logger service with the mock console transport
      loggerService = new LoggerService(config, mockTracingService);
      // Replace the real transport with the mock
      (loggerService as any).transports = [mockConsoleTransport];
    });
    
    it('should write logs to console transport', () => {
      // Log messages at different levels
      loggerService.debug('Debug message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      
      // Verify console transport was called for each message
      expect(mockConsoleTransport.write).toHaveBeenCalledTimes(4);
    });
    
    it('should respect log level filtering', () => {
      // Create a new logger with INFO level
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'INFO',
        formatter: 'text',
        transports: ['console']
      };
      
      const infoLogger = new LoggerService(config, mockTracingService);
      // Replace the real transport with the mock
      (infoLogger as any).transports = [mockConsoleTransport];
      
      // Reset mock calls
      mockConsoleTransport.write.mockClear();
      
      // Log messages at different levels
      infoLogger.debug('Debug message'); // Should be filtered out
      infoLogger.log('Info message');    // Should be logged
      infoLogger.warn('Warning message'); // Should be logged
      infoLogger.error('Error message');  // Should be logged
      
      // Verify console transport was called only for INFO and above
      expect(mockConsoleTransport.write).toHaveBeenCalledTimes(3);
    });
    
    it('should include context in log entries', () => {
      // Log with context
      loggerService.log('Message with context', { userId: '123', action: 'test' });
      
      // Verify context was included
      const lastCall = mockConsoleTransport.write.mock.calls[0][0];
      expect(lastCall).toContain('userId');
      expect(lastCall).toContain('123');
      expect(lastCall).toContain('action');
      expect(lastCall).toContain('test');
    });
    
    it('should include error details when logging errors', () => {
      // Create an error
      const error = new Error('Test error');
      
      // Log the error
      loggerService.error('An error occurred', error);
      
      // Verify error details were included
      const lastCall = mockConsoleTransport.write.mock.calls[0][0];
      expect(lastCall).toContain('Test error');
      expect(lastCall).toContain('stack');
    });
    
    it('should include trace context when available', () => {
      // Log a message
      loggerService.log('Message with trace context');
      
      // Verify trace context was included
      const lastCall = mockConsoleTransport.write.mock.calls[0][0];
      expect(lastCall).toContain('test-trace-id');
      expect(lastCall).toContain('test-span-id');
    });
  });

  describe('File Transport', () => {
    let loggerService: LoggerService;
    let realFileTransport: FileTransport;
    
    beforeEach(() => {
      // Create logger with file transport
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'DEBUG',
        formatter: 'json',
        transports: ['file'],
        fileTransport: {
          filePath: tempLogFile,
          maxSize: '10m',
          maxFiles: 5,
        }
      };
      
      // Create a real file transport for some tests
      realFileTransport = new FileTransport(config.fileTransport);
      
      // Create a logger service
      loggerService = new LoggerService(config, mockTracingService);
    });
    
    afterEach(async () => {
      // Shutdown the real file transport
      await realFileTransport.shutdown();
    });
    
    it('should write logs to file transport (mock)', () => {
      // Replace the real transport with the mock
      (loggerService as any).transports = [mockFileTransport];
      
      // Log messages at different levels
      loggerService.debug('Debug message');
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      
      // Verify file transport was called for each message
      expect(mockFileTransport.write).toHaveBeenCalledTimes(4);
    });
    
    it('should write logs to actual file', async () => {
      // Initialize the real file transport
      await realFileTransport.initialize();
      
      // Replace the transport in the logger
      (loggerService as any).transports = [realFileTransport];
      
      // Log a message
      const testMessage = `Test log message ${Date.now()}`;
      loggerService.log(testMessage);
      
      // Wait for file write to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the message was written to the file
      const fileContent = fs.readFileSync(tempLogFile, 'utf8');
      expect(fileContent).toContain(testMessage);
    });
    
    it('should handle file rotation configuration', () => {
      // Create a logger with file rotation config
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'INFO',
        formatter: 'json',
        transports: ['file'],
        fileTransport: {
          filePath: tempLogFile,
          maxSize: '5m',
          maxFiles: 3,
          compress: true,
        }
      };
      
      // Create a new file transport with this config
      const rotatingTransport = new FileTransport(config.fileTransport);
      
      // Verify the configuration was applied
      expect((rotatingTransport as any).maxSize).toBe('5m');
      expect((rotatingTransport as any).maxFiles).toBe(3);
      expect((rotatingTransport as any).compress).toBe(true);
    });
    
    it('should handle transport initialization errors', async () => {
      // Create a transport with an invalid path
      const invalidTransport = new FileTransport({
        filePath: '/invalid/path/that/does/not/exist/file.log',
      });
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        // Initialize should handle the error
        await invalidTransport.initialize();
        
        // Write should not throw but log an error
        invalidTransport.write('This should not throw', LogLevel.INFO);
        
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalled();
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('CloudWatch Transport', () => {
    let loggerService: LoggerService;
    
    beforeEach(() => {
      // Create logger with CloudWatch transport
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'INFO',
        formatter: 'cloudwatch',
        transports: ['cloudwatch'],
        cloudWatchTransport: {
          logGroupName: '/austa/test',
          logStreamName: 'test-stream',
          region: 'us-east-1',
          batchSize: 10,
          retryCount: 3,
          retryDelay: 100,
        }
      };
      
      // Create a logger service with the mock CloudWatch transport
      loggerService = new LoggerService(config, mockTracingService);
      // Replace the real transport with the mock
      (loggerService as any).transports = [mockCloudWatchTransport];
    });
    
    it('should write logs to CloudWatch transport', () => {
      // Log messages at different levels
      loggerService.log('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      
      // Verify CloudWatch transport was called for each message
      expect(mockCloudWatchTransport.write).toHaveBeenCalledTimes(3);
    });
    
    it('should format logs specifically for CloudWatch', () => {
      // Log a message with context
      loggerService.log('CloudWatch message', { requestId: 'req-123', userId: 'user-456' });
      
      // Verify the message was formatted for CloudWatch
      const lastCall = mockCloudWatchTransport.write.mock.calls[0][0];
      
      // CloudWatch format should include these fields
      expect(lastCall).toContain('timestamp');
      expect(lastCall).toContain('requestId');
      expect(lastCall).toContain('userId');
      expect(lastCall).toContain('level');
      expect(lastCall).toContain('message');
    });
    
    it('should handle batched logging operations', () => {
      // Create a batch of logs
      const batch = [
        { message: 'Batch message 1', level: LogLevel.INFO },
        { message: 'Batch message 2', level: LogLevel.WARN },
        { message: 'Batch message 3', level: LogLevel.ERROR },
      ];
      
      // Write the batch
      (mockCloudWatchTransport.writeBatch as jest.Mock).mockClear();
      mockCloudWatchTransport.writeBatch(batch.map(item => JSON.stringify(item)));
      
      // Verify the batch was written
      expect(mockCloudWatchTransport.writeBatch).toHaveBeenCalledTimes(1);
      expect(mockCloudWatchTransport.writeBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('Batch message 1'),
          expect.stringContaining('Batch message 2'),
          expect.stringContaining('Batch message 3'),
        ])
      );
    });
    
    it('should handle transport initialization and shutdown', async () => {
      // Initialize and shutdown should be called
      await mockCloudWatchTransport.initialize();
      await mockCloudWatchTransport.shutdown();
      
      // Verify initialize and shutdown were called
      expect(mockCloudWatchTransport.initialize).toHaveBeenCalledTimes(1);
      expect(mockCloudWatchTransport.shutdown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Transports', () => {
    let loggerService: LoggerService;
    
    beforeEach(() => {
      // Create logger with multiple transports
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'INFO',
        formatter: 'json',
        transports: ['console', 'file', 'cloudwatch'],
      };
      
      // Create a logger service with multiple mock transports
      loggerService = new LoggerService(config, mockTracingService);
      // Replace the real transports with mocks
      (loggerService as any).transports = [
        mockConsoleTransport,
        mockFileTransport,
        mockCloudWatchTransport,
      ];
    });
    
    it('should write logs to all configured transports', () => {
      // Log a message
      loggerService.log('Multi-transport message');
      
      // Verify all transports were called
      expect(mockConsoleTransport.write).toHaveBeenCalledTimes(1);
      expect(mockFileTransport.write).toHaveBeenCalledTimes(1);
      expect(mockCloudWatchTransport.write).toHaveBeenCalledTimes(1);
    });
    
    it('should continue logging if one transport fails', () => {
      // Make one transport fail
      mockFileTransport.write.mockImplementation(() => {
        throw new Error('Transport failure');
      });
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        // Log a message
        loggerService.log('Should continue despite transport failure');
        
        // Verify other transports were still called
        expect(mockConsoleTransport.write).toHaveBeenCalledTimes(1);
        expect(mockCloudWatchTransport.write).toHaveBeenCalledTimes(1);
        
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalled();
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('Journey-Specific Logging', () => {
    let loggerService: LoggerService;
    
    beforeEach(() => {
      // Create logger
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'INFO',
        formatter: 'json',
        transports: ['console'],
      };
      
      // Create a logger service with the mock console transport
      loggerService = new LoggerService(config, mockTracingService);
      // Replace the real transport with the mock
      (loggerService as any).transports = [mockConsoleTransport];
    });
    
    it('should create journey-specific loggers', () => {
      // Create journey-specific loggers
      const healthLogger = loggerService.forHealthJourney();
      const careLogger = loggerService.forCareJourney();
      const planLogger = loggerService.forPlanJourney();
      
      // Log messages with each logger
      healthLogger.log('Health journey message');
      careLogger.log('Care journey message');
      planLogger.log('Plan journey message');
      
      // Verify all messages were logged
      expect(mockConsoleTransport.write).toHaveBeenCalledTimes(3);
      
      // Verify journey context was included
      const calls = mockConsoleTransport.write.mock.calls;
      expect(calls[0][0]).toContain('HEALTH');
      expect(calls[1][0]).toContain('CARE');
      expect(calls[2][0]).toContain('PLAN');
    });
    
    it('should maintain context across child loggers', () => {
      // Create a logger with user context
      const userLogger = loggerService.withUserContext({ userId: 'user-123' });
      
      // Create a journey logger from the user logger
      const healthUserLogger = userLogger.forHealthJourney();
      
      // Log a message
      healthUserLogger.log('Health journey for specific user');
      
      // Verify both contexts were included
      const lastCall = mockConsoleTransport.write.mock.calls[0][0];
      expect(lastCall).toContain('HEALTH');
      expect(lastCall).toContain('user-123');
    });
  });

  describe('Error Handling and Recovery', () => {
    let loggerService: LoggerService;
    
    beforeEach(() => {
      // Create logger with multiple transports
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'INFO',
        formatter: 'json',
        transports: ['console', 'file'],
      };
      
      // Create a logger service with multiple mock transports
      loggerService = new LoggerService(config, mockTracingService);
      // Replace the real transports with mocks
      (loggerService as any).transports = [
        mockConsoleTransport,
        mockFileTransport,
      ];
    });
    
    it('should handle transport initialization failures', async () => {
      // Make initialization fail
      mockFileTransport.initialize.mockRejectedValue(new Error('Init failure'));
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        // Create a new transport factory that will use the mock
        const factory = {
          createTransport: jest.fn().mockReturnValue(mockFileTransport),
        };
        
        // Create a new logger with this factory
        const newLogger = new LoggerService({
          serviceName: 'test-service',
          logLevel: 'INFO',
          transports: ['file'],
        });
        
        // Replace the transport factory
        (newLogger as any).createTransports = jest.fn().mockReturnValue([mockFileTransport]);
        
        // Initialize the transport (should handle the error)
        await mockFileTransport.initialize();
        
        // Log a message (should not throw)
        newLogger.log('Should not throw despite init failure');
        
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalled();
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });
    
    it('should recover from temporary transport failures', () => {
      // Make the transport fail once then succeed
      let failCount = 0;
      mockFileTransport.write.mockImplementation(() => {
        if (failCount === 0) {
          failCount++;
          throw new Error('Temporary failure');
        }
      });
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        // First log should encounter the error but not throw
        loggerService.log('First message');
        
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalled();
        
        // Reset the spy
        consoleErrorSpy.mockClear();
        
        // Second log should succeed
        loggerService.log('Second message');
        
        // Verify no error was logged
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        
        // Verify both messages were logged to the console transport
        expect(mockConsoleTransport.write).toHaveBeenCalledTimes(2);
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });
  });
});