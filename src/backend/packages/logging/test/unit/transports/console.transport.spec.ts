import { EventEmitter } from 'events';
import { ConsoleTransport, ConsoleTransportOptions } from '../../../src/transports/console.transport';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { Formatter } from '../../../src/formatters/formatter.interface';

// Mock formatter implementation
class MockFormatter implements Formatter {
  format(entry: any): string {
    return `[${LogLevel[entry.level]}] ${entry.message}`;
  }
}

describe('ConsoleTransport', () => {
  // Spy on console methods
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  
  // Mock formatter
  let formatter: Formatter;
  
  // Default options
  let defaultOptions: ConsoleTransportOptions;
  
  beforeEach(() => {
    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create formatter
    formatter = new MockFormatter();
    
    // Setup default options
    defaultOptions = {
      formatter,
      minLevel: LogLevel.DEBUG,
      colorize: false, // Disable colors for easier testing
    };
    
    // Clear mocks before each test
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  describe('constructor', () => {
    it('should create a transport with default options', () => {
      const transport = new ConsoleTransport(defaultOptions);
      
      expect(transport).toBeInstanceOf(ConsoleTransport);
      expect(transport).toBeInstanceOf(EventEmitter);
    });
    
    it('should merge provided options with defaults', () => {
      const customOptions: ConsoleTransportOptions = {
        formatter,
        minLevel: LogLevel.ERROR,
        colorize: true,
        timestamp: false,
      };
      
      const transport = new ConsoleTransport(customOptions);
      
      // We can't directly test private properties, but we can test behavior
      // that depends on these options in other tests
      expect(transport).toBeInstanceOf(ConsoleTransport);
    });
  });
  
  describe('write', () => {
    it('should write a log entry to console.log', async () => {
      const transport = new ConsoleTransport(defaultOptions);
      const message = 'Test log message';
      
      await transport.write(LogLevel.INFO, message);
      
      // Force flush the buffer
      await (transport as any).flush();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test log message');
    });
    
    it('should write error logs to console.error when useStderr is true', async () => {
      const transport = new ConsoleTransport({
        ...defaultOptions,
        useStderr: true,
      });
      const message = 'Test error message';
      
      await transport.write(LogLevel.ERROR, message);
      
      // Force flush the buffer
      await (transport as any).flush();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
    
    it('should not write logs below the minimum level', async () => {
      const transport = new ConsoleTransport({
        ...defaultOptions,
        minLevel: LogLevel.ERROR,
      });
      
      await transport.write(LogLevel.DEBUG, 'Debug message');
      await transport.write(LogLevel.INFO, 'Info message');
      await transport.write(LogLevel.WARN, 'Warn message');
      
      // Force flush the buffer
      await (transport as any).flush();
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
    
    it('should throw an error when writing to a closed transport', async () => {
      const transport = new ConsoleTransport(defaultOptions);
      await transport.close();
      
      await expect(transport.write(LogLevel.INFO, 'Test message')).rejects.toThrow(
        'Cannot write to closed transport'
      );
    });
    
    it('should emit an error event when write fails', async () => {
      const transport = new ConsoleTransport(defaultOptions);
      const errorSpy = jest.fn();
      
      transport.on('error', errorSpy);
      
      // Mock addToBuffer to throw an error
      jest.spyOn(transport as any, 'addToBuffer').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      await transport.write(LogLevel.INFO, 'Test message');
      
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(errorSpy.mock.calls[0][0].message).toBe('Test error');
    });
  });
  
  describe('close', () => {
    it('should close the transport and flush pending writes', async () => {
      const transport = new ConsoleTransport(defaultOptions);
      const flushSpy = jest.spyOn(transport as any, 'flush');
      
      await transport.write(LogLevel.INFO, 'Test message');
      await transport.close();
      
      expect(flushSpy).toHaveBeenCalled();
      expect((transport as any).closed).toBe(true);
    });
    
    it('should do nothing if the transport is already closed', async () => {
      const transport = new ConsoleTransport(defaultOptions);
      
      await transport.close();
      const flushSpy = jest.spyOn(transport as any, 'flush');
      
      await transport.close();
      
      expect(flushSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('flush', () => {
    it('should flush the buffer and write logs to console', async () => {
      const transport = new ConsoleTransport({
        ...defaultOptions,
        bufferSize: 5, // Set a larger buffer size to prevent auto-flush
      });
      
      await transport.write(LogLevel.INFO, 'Message 1');
      await transport.write(LogLevel.INFO, 'Message 2');
      
      // Manually flush
      await (transport as any).flush();
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, '[INFO] Message 1');
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, '[INFO] Message 2');
    });
    
    it('should emit a flush event with the number of entries flushed', async () => {
      const transport = new ConsoleTransport({
        ...defaultOptions,
        bufferSize: 5,
      });
      const flushSpy = jest.fn();
      
      transport.on('flush', flushSpy);
      
      await transport.write(LogLevel.INFO, 'Message 1');
      await transport.write(LogLevel.INFO, 'Message 2');
      
      // Manually flush
      await (transport as any).flush();
      
      expect(flushSpy).toHaveBeenCalledWith(2);
    });
    
    it('should handle errors during flush and put logs back in buffer', async () => {
      const transport = new ConsoleTransport(defaultOptions);
      const errorSpy = jest.fn();
      
      transport.on('error', errorSpy);
      
      // Mock writeToConsole to throw an error
      jest.spyOn(transport as any, 'writeToConsole').mockImplementation(() => {
        throw new Error('Console write error');
      });
      
      await transport.write(LogLevel.INFO, 'Test message');
      
      // Manually flush
      await (transport as any).flush();
      
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(errorSpy.mock.calls[0][0].message).toContain('Failed to flush logs');
      
      // Verify logs are put back in buffer
      expect((transport as any).buffer.length).toBe(1);
    });
    
    it('should not flush if already writing', async () => {
      const transport = new ConsoleTransport(defaultOptions);
      
      // Set writing flag to true
      (transport as any).writing = true;
      
      const writeToConsoleSpy = jest.spyOn(transport as any, 'writeToConsole');
      
      await transport.write(LogLevel.INFO, 'Test message');
      
      // Manually flush
      await (transport as any).flush();
      
      expect(writeToConsoleSpy).not.toHaveBeenCalled();
    });
    
    it('should not flush if buffer is empty', async () => {
      const transport = new ConsoleTransport(defaultOptions);
      const writeToConsoleSpy = jest.spyOn(transport as any, 'writeToConsole');
      
      // Manually flush with empty buffer
      await (transport as any).flush();
      
      expect(writeToConsoleSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('colorization', () => {
    it('should colorize output when colorize option is true', async () => {
      const transport = new ConsoleTransport({
        ...defaultOptions,
        colorize: true,
      });
      
      // Spy on colorizeByLevel method
      const colorizeByLevelSpy = jest.spyOn(transport as any, 'colorizeByLevel');
      
      await transport.write(LogLevel.INFO, 'Colorized message');
      
      // Force flush
      await (transport as any).flush();
      
      expect(colorizeByLevelSpy).toHaveBeenCalled();
    });
    
    it('should not colorize output when colorize option is false', async () => {
      const transport = new ConsoleTransport({
        ...defaultOptions,
        colorize: false,
      });
      
      // Spy on colorizeByLevel method
      const colorizeByLevelSpy = jest.spyOn(transport as any, 'colorizeByLevel');
      
      await transport.write(LogLevel.INFO, 'Non-colorized message');
      
      // Force flush
      await (transport as any).flush();
      
      expect(colorizeByLevelSpy).not.toHaveBeenCalled();
    });
    
    it('should apply different colors based on log level', async () => {
      const transport = new ConsoleTransport({
        ...defaultOptions,
        colorize: true,
      });
      
      // Test each log level
      const levels = [
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL,
      ];
      
      // Create a unique message for each level
      const messages = levels.map((level) => `${LogLevel[level]} message`);
      
      // Write a log for each level
      for (let i = 0; i < levels.length; i++) {
        await transport.write(levels[i], messages[i]);
      }
      
      // Force flush
      await (transport as any).flush();
      
      // Verify console.log was called with different colorized strings
      expect(consoleLogSpy).toHaveBeenCalledTimes(3); // DEBUG, INFO, WARN
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // ERROR, FATAL
      
      // We can't easily test the exact color codes, but we can verify
      // that different strings were passed to console.log/error
      const logCalls = consoleLogSpy.mock.calls.map((call) => call[0]);
      const errorCalls = consoleErrorSpy.mock.calls.map((call) => call[0]);
      
      // Verify all log calls have different colorized strings
      const uniqueLogCalls = new Set(logCalls);
      expect(uniqueLogCalls.size).toBe(3);
      
      // Verify all error calls have different colorized strings
      const uniqueErrorCalls = new Set(errorCalls);
      expect(uniqueErrorCalls.size).toBe(2);
    });
  });
  
  describe('batching', () => {
    it('should batch logs and flush when buffer size is reached', async () => {
      const bufferSize = 3;
      const transport = new ConsoleTransport({
        ...defaultOptions,
        bufferSize,
      });
      
      const flushSpy = jest.spyOn(transport as any, 'flush');
      
      // Write logs up to buffer size
      for (let i = 0; i < bufferSize; i++) {
        await transport.write(LogLevel.INFO, `Message ${i + 1}`);
      }
      
      // Verify flush was called once
      expect(flushSpy).toHaveBeenCalledTimes(1);
      
      // Write one more log
      await transport.write(LogLevel.INFO, 'Message 4');
      
      // Verify flush was not called again
      expect(flushSpy).toHaveBeenCalledTimes(1);
    });
    
    it('should flush logs periodically based on flushInterval', async () => {
      jest.useFakeTimers();
      
      const flushInterval = 100;
      const transport = new ConsoleTransport({
        ...defaultOptions,
        bufferSize: 10, // Large buffer to prevent size-based flush
        flushInterval,
      });
      
      const flushSpy = jest.spyOn(transport as any, 'flush');
      
      // Write a log
      await transport.write(LogLevel.INFO, 'Test message');
      
      // Verify flush was not called immediately
      expect(flushSpy).not.toHaveBeenCalled();
      
      // Advance timer to trigger flush
      jest.advanceTimersByTime(flushInterval);
      
      // Verify flush was called
      expect(flushSpy).toHaveBeenCalledTimes(1);
      
      // Cleanup
      jest.useRealTimers();
    });
  });
  
  describe('pretty printing', () => {
    it('should pretty print objects when prettyPrint is true', async () => {
      // Create a formatter that returns an object
      const objectFormatter: Formatter = {
        format: () => ({ key: 'value', nested: { prop: 'test' } }),
      };
      
      const transport = new ConsoleTransport({
        formatter: objectFormatter,
        prettyPrint: true,
        colorize: false,
      });
      
      await transport.write(LogLevel.INFO, 'Object message');
      
      // Force flush
      await (transport as any).flush();
      
      // Verify console.log was called with pretty-printed JSON
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify({ key: 'value', nested: { prop: 'test' } }, null, 2));
    });
    
    it('should not pretty print objects when prettyPrint is false', async () => {
      // Create a formatter that returns an object
      const objectFormatter: Formatter = {
        format: () => ({ key: 'value', nested: { prop: 'test' } }),
      };
      
      const transport = new ConsoleTransport({
        formatter: objectFormatter,
        prettyPrint: false,
        colorize: false,
      });
      
      await transport.write(LogLevel.INFO, 'Object message');
      
      // Force flush
      await (transport as any).flush();
      
      // Verify console.log was called with compact JSON
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify({ key: 'value', nested: { prop: 'test' } }));
    });
  });
  
  describe('integration with formatters', () => {
    it('should use the provided formatter to format log entries', async () => {
      // Create a custom formatter
      const customFormatter: Formatter = {
        format: (entry) => `CUSTOM: ${entry.level} - ${entry.message}`,
      };
      
      const transport = new ConsoleTransport({
        formatter: customFormatter,
        colorize: false,
      });
      
      await transport.write(LogLevel.INFO, 'Formatted message');
      
      // Force flush
      await (transport as any).flush();
      
      // Verify console.log was called with formatted message
      expect(consoleLogSpy).toHaveBeenCalledWith('CUSTOM: 1 - Formatted message');
    });
    
    it('should pass metadata to the formatter', async () => {
      // Create a formatter that includes metadata
      const metadataFormatter: Formatter = {
        format: (entry) => `META: ${JSON.stringify(entry.meta)}`,
      };
      
      const transport = new ConsoleTransport({
        formatter: metadataFormatter,
        colorize: false,
      });
      
      const metadata = { userId: '123', requestId: 'abc' };
      
      await transport.write(LogLevel.INFO, 'Message with metadata', metadata);
      
      // Force flush
      await (transport as any).flush();
      
      // Verify console.log was called with metadata
      expect(consoleLogSpy).toHaveBeenCalledWith(`META: ${JSON.stringify(metadata)}`);
    });
  });
});