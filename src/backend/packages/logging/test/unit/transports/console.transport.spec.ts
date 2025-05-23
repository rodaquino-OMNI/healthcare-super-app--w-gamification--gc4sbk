import { ConsoleTransport, ConsoleTransportOptions } from '../../../src/transports/console.transport';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import * as chalk from 'chalk';

describe('ConsoleTransport', () => {
  // Store original console methods to restore after tests
  let originalStdoutWrite: any;
  let originalStderrWrite: any;
  let mockStdoutWrite: jest.Mock;
  let mockStderrWrite: jest.Mock;
  let consoleTransport: ConsoleTransport;
  
  // Helper function to create a basic log entry
  const createLogEntry = (level: LogLevel, message: string, context?: any, metadata?: any, error?: any): LogEntry => ({
    message,
    level,
    timestamp: new Date('2023-01-01T12:00:00Z'),
    context,
    metadata,
    error
  });

  beforeEach(() => {
    // Mock console output methods
    mockStdoutWrite = jest.fn();
    mockStderrWrite = jest.fn();
    originalStdoutWrite = process.stdout.write;
    originalStderrWrite = process.stderr.write;
    process.stdout.write = mockStdoutWrite;
    process.stderr.write = mockStderrWrite;
    
    // Reset timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore original console methods
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    
    // Clean up any pending timers
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Close the transport if it exists
    if (consoleTransport) {
      consoleTransport.close();
    }
  });

  describe('initialization', () => {
    it('should initialize with default options', async () => {
      consoleTransport = new ConsoleTransport();
      await consoleTransport.initialize();
      
      // Write a simple log entry to verify initialization worked
      const entry = createLogEntry(LogLevel.INFO, 'Test message');
      await consoleTransport.write(entry);
      
      // Flush immediately to verify output
      await (consoleTransport as any).flushBatch();
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      expect(output).toContain('Test message');
    });

    it('should initialize with custom options', async () => {
      const options: ConsoleTransportOptions = {
        colorize: false,
        timestamp: false,
        showLevel: false,
        showContext: false,
        prettyPrint: false,
        batchSize: 10,
        batchInterval: 500
      };
      
      consoleTransport = new ConsoleTransport(options);
      await consoleTransport.initialize();
      
      // Write a simple log entry
      const entry = createLogEntry(LogLevel.INFO, 'Test message');
      await consoleTransport.write(entry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      // Verify output format based on options
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      expect(output).toBe('Test message\n'); // Only the message should be present
    });
  });

  describe('write method', () => {
    it('should write a log entry to stdout', async () => {
      consoleTransport = new ConsoleTransport({ colorize: false });
      await consoleTransport.initialize();
      
      const entry = createLogEntry(LogLevel.INFO, 'Info message');
      await consoleTransport.write(entry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      expect(output).toContain('12:00:00.000');
      expect(output).toContain('INFO');
      expect(output).toContain('Info message');
    });

    it('should write error and fatal logs to stderr', async () => {
      consoleTransport = new ConsoleTransport({ colorize: false, useStderr: true });
      await consoleTransport.initialize();
      
      // Write an error log
      const errorEntry = createLogEntry(LogLevel.ERROR, 'Error message');
      await consoleTransport.write(errorEntry);
      
      // Write a fatal log
      const fatalEntry = createLogEntry(LogLevel.FATAL, 'Fatal message');
      await consoleTransport.write(fatalEntry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      // Verify stderr was used for both logs
      expect(mockStderrWrite).toHaveBeenCalledTimes(2);
      expect(mockStderrWrite.mock.calls[0][0]).toContain('Error message');
      expect(mockStderrWrite.mock.calls[1][0]).toContain('Fatal message');
    });

    it('should use stdout for error logs when useStderr is false', async () => {
      consoleTransport = new ConsoleTransport({ colorize: false, useStderr: false });
      await consoleTransport.initialize();
      
      const errorEntry = createLogEntry(LogLevel.ERROR, 'Error message');
      await consoleTransport.write(errorEntry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      // Verify stdout was used
      expect(mockStdoutWrite).toHaveBeenCalled();
      expect(mockStderrWrite).not.toHaveBeenCalled();
      expect(mockStdoutWrite.mock.calls[0][0]).toContain('Error message');
    });
  });

  describe('formatting', () => {
    it('should format timestamps according to the specified format', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        timestampFormat: 'YYYY-MM-DD HH:mm:ss'
      });
      await consoleTransport.initialize();
      
      const entry = createLogEntry(LogLevel.INFO, 'Test message');
      await consoleTransport.write(entry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      expect(output).toContain('2023-01-01 12:00:00');
    });

    it('should include context when showContext is true', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        showContext: true
      });
      await consoleTransport.initialize();
      
      // Test with string context
      const entry = createLogEntry(LogLevel.INFO, 'Test message', 'TestContext');
      await consoleTransport.write(entry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      expect(output).toContain('[TestContext]');
    });

    it('should format complex context objects', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        showContext: true
      });
      await consoleTransport.initialize();
      
      // Test with object context
      const entry = createLogEntry(LogLevel.INFO, 'Test message', {
        service: 'TestService',
        journey: 'health',
        requestId: '1234567890abcdef'
      });
      await consoleTransport.write(entry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      expect(output).toContain('[TestService]');
      expect(output).toContain('[health]');
      expect(output).toContain('[12345678]'); // First 8 chars of requestId
    });

    it('should format metadata as JSON', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        prettyPrint: false
      });
      await consoleTransport.initialize();
      
      const metadata = { userId: '123', action: 'login', duration: 150 };
      const entry = createLogEntry(LogLevel.INFO, 'Test message', null, metadata);
      await consoleTransport.write(entry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      expect(output).toContain(JSON.stringify(metadata));
    });

    it('should pretty print metadata when prettyPrint is true', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        prettyPrint: true,
        prettyPrintIndent: 2
      });
      await consoleTransport.initialize();
      
      const metadata = { userId: '123', action: 'login', duration: 150 };
      const entry = createLogEntry(LogLevel.INFO, 'Test message', null, metadata);
      await consoleTransport.write(entry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      expect(output).toContain(JSON.stringify(metadata, null, 2));
    });

    it('should format error objects', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false
      });
      await consoleTransport.initialize();
      
      const error = new Error('Test error');
      const entry = createLogEntry(LogLevel.ERROR, 'Error occurred', null, null, error);
      await consoleTransport.write(entry);
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      expect(mockStderrWrite).toHaveBeenCalled();
      const output = mockStderrWrite.mock.calls[0][0];
      expect(output).toContain('Error occurred');
      expect(output).toContain('Error: Test error');
      expect(output).toContain(error.stack);
    });
  });

  describe('colorization', () => {
    beforeEach(() => {
      // Enable chalk colors for testing
      chalk.level = 3; // Force colors
    });

    it('should colorize output based on log level when colorize is true', async () => {
      // Create a spy on chalk methods
      const debugSpy = jest.spyOn(chalk, 'cyan');
      const infoSpy = jest.spyOn(chalk, 'green');
      const warnSpy = jest.spyOn(chalk, 'yellow');
      const errorSpy = jest.spyOn(chalk, 'red');
      const fatalSpy = jest.spyOn(chalk, 'bgRed');
      
      consoleTransport = new ConsoleTransport({ colorize: true });
      await consoleTransport.initialize();
      
      // Write logs of different levels
      await consoleTransport.write(createLogEntry(LogLevel.DEBUG, 'Debug message'));
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Info message'));
      await consoleTransport.write(createLogEntry(LogLevel.WARN, 'Warn message'));
      await consoleTransport.write(createLogEntry(LogLevel.ERROR, 'Error message'));
      await consoleTransport.write(createLogEntry(LogLevel.FATAL, 'Fatal message'));
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      // Verify chalk color functions were called
      expect(debugSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      expect(fatalSpy).toHaveBeenCalled();
      
      // Clean up spies
      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
      fatalSpy.mockRestore();
    });

    it('should not colorize output when colorize is false', async () => {
      // Create a spy on chalk methods
      const debugSpy = jest.spyOn(chalk, 'cyan');
      const infoSpy = jest.spyOn(chalk, 'green');
      
      consoleTransport = new ConsoleTransport({ colorize: false });
      await consoleTransport.initialize();
      
      // Write logs of different levels
      await consoleTransport.write(createLogEntry(LogLevel.DEBUG, 'Debug message'));
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Info message'));
      
      // Flush immediately
      await (consoleTransport as any).flushBatch();
      
      // Verify chalk color functions were not called
      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      
      // Clean up spies
      debugSpy.mockRestore();
      infoSpy.mockRestore();
    });
  });

  describe('batching', () => {
    it('should batch log entries and flush after reaching batch size', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        batchSize: 3,
        batchInterval: 1000
      });
      await consoleTransport.initialize();
      
      // Write 2 log entries (less than batch size)
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Message 1'));
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Message 2'));
      
      // Verify no output yet
      expect(mockStdoutWrite).not.toHaveBeenCalled();
      
      // Write one more entry to reach batch size
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Message 3'));
      
      // Verify batch was flushed
      expect(mockStdoutWrite).toHaveBeenCalledTimes(3);
      expect(mockStdoutWrite.mock.calls[0][0]).toContain('Message 1');
      expect(mockStdoutWrite.mock.calls[1][0]).toContain('Message 2');
      expect(mockStdoutWrite.mock.calls[2][0]).toContain('Message 3');
    });

    it('should flush batch after interval even if batch size not reached', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        batchSize: 10,
        batchInterval: 500
      });
      await consoleTransport.initialize();
      
      // Write 2 log entries (less than batch size)
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Message 1'));
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Message 2'));
      
      // Verify no output yet
      expect(mockStdoutWrite).not.toHaveBeenCalled();
      
      // Advance timer to trigger batch flush
      jest.advanceTimersByTime(500);
      
      // Verify batch was flushed
      expect(mockStdoutWrite).toHaveBeenCalledTimes(2);
      expect(mockStdoutWrite.mock.calls[0][0]).toContain('Message 1');
      expect(mockStdoutWrite.mock.calls[1][0]).toContain('Message 2');
    });
  });

  describe('error handling', () => {
    it('should handle errors during formatting', async () => {
      consoleTransport = new ConsoleTransport({ colorize: false });
      await consoleTransport.initialize();
      
      // Create a circular reference to cause JSON.stringify to fail
      const metadata: any = {};
      metadata.circular = metadata;
      
      const entry = createLogEntry(LogLevel.INFO, 'Test message', null, metadata);
      
      // Mock console.error to capture error messages
      const originalConsoleError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;
      
      try {
        await consoleTransport.write(entry);
        await (consoleTransport as any).flushBatch();
        
        // Verify error was handled and fallback formatting was used
        expect(mockConsoleError).toHaveBeenCalled();
        expect(mockConsoleError.mock.calls[0][0]).toContain('Failed to format log entry');
      } finally {
        // Restore original console.error
        console.error = originalConsoleError;
      }
    });

    it('should handle errors during console writing', async () => {
      consoleTransport = new ConsoleTransport({ colorize: false });
      await consoleTransport.initialize();
      
      // Make process.stdout.write throw an error
      mockStdoutWrite.mockImplementation(() => {
        throw new Error('Write error');
      });
      
      // Mock console.error to capture error messages
      const originalConsoleError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;
      
      try {
        const entry = createLogEntry(LogLevel.INFO, 'Test message');
        
        // This should throw because flushBatch will propagate the error
        await expect(async () => {
          await consoleTransport.write(entry);
          await (consoleTransport as any).flushBatch();
        }).rejects.toThrow('Write error');
        
        // Verify error was logged
        expect(mockConsoleError).toHaveBeenCalled();
        expect(mockConsoleError.mock.calls[0][0]).toContain('Failed to write logs to console');
      } finally {
        // Restore original console.error
        console.error = originalConsoleError;
      }
    });

    it('should throw error when writing during shutdown', async () => {
      consoleTransport = new ConsoleTransport();
      await consoleTransport.initialize();
      
      // Close the transport
      await consoleTransport.close();
      
      // Try to write after closing
      const entry = createLogEntry(LogLevel.INFO, 'Test message');
      await expect(consoleTransport.write(entry)).rejects.toThrow('Cannot write to transport during shutdown');
    });
  });

  describe('close method', () => {
    it('should flush pending logs when closing', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        batchSize: 10,
        batchInterval: 1000
      });
      await consoleTransport.initialize();
      
      // Write some logs but don't flush
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Message 1'));
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Message 2'));
      
      // Verify no output yet
      expect(mockStdoutWrite).not.toHaveBeenCalled();
      
      // Close the transport
      await consoleTransport.close();
      
      // Verify logs were flushed
      expect(mockStdoutWrite).toHaveBeenCalledTimes(2);
      expect(mockStdoutWrite.mock.calls[0][0]).toContain('Message 1');
      expect(mockStdoutWrite.mock.calls[1][0]).toContain('Message 2');
    });

    it('should cancel batch timer when closing', async () => {
      consoleTransport = new ConsoleTransport({
        colorize: false,
        batchSize: 10,
        batchInterval: 1000
      });
      await consoleTransport.initialize();
      
      // Write a log to start the batch timer
      await consoleTransport.write(createLogEntry(LogLevel.INFO, 'Test message'));
      
      // Spy on clearTimeout
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Close the transport
      await consoleTransport.close();
      
      // Verify clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      // Clean up spy
      clearTimeoutSpy.mockRestore();
    });
  });
});