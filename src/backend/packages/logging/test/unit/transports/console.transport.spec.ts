import { jest } from '@jest/globals';
import { ConsoleTransport } from '../../../src/transports/console.transport';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';

describe('ConsoleTransport', () => {
  // Console method spies
  let consoleLogSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  // Set up spies before each test
  beforeEach(() => {
    // Use spyOn instead of direct replacement for better cleanup
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  // Restore original console methods after each test
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('initialization', () => {
    it('should use default values if not provided', () => {
      // Execute
      const transport = new ConsoleTransport();
      
      // Verify - using any to access private properties for testing
      expect((transport as any).colorize).toBe(true);
      expect((transport as any).level).toBe(LogLevel.DEBUG);
    });

    it('should use provided configuration values', () => {
      // Execute
      const transport = new ConsoleTransport({
        colorize: false,
        level: LogLevel.ERROR,
      });
      
      // Verify - using any to access private properties for testing
      expect((transport as any).colorize).toBe(false);
      expect((transport as any).level).toBe(LogLevel.ERROR);
    });
  });

  describe('write', () => {
    let transport: ConsoleTransport;
    
    const mockDebugEntry: LogEntry = {
      message: 'Debug message',
      level: LogLevel.DEBUG,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    
    const mockInfoEntry: LogEntry = {
      message: 'Info message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    
    const mockWarnEntry: LogEntry = {
      message: 'Warning message',
      level: LogLevel.WARN,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    
    const mockErrorEntry: LogEntry = {
      message: 'Error message',
      level: LogLevel.ERROR,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
      error: new Error('Test error'),
    };
    
    const mockFatalEntry: LogEntry = {
      message: 'Fatal message',
      level: LogLevel.FATAL,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
      error: new Error('Fatal error'),
    };

    const formattedEntry = 'Formatted log entry';

    beforeEach(() => {
      transport = new ConsoleTransport();
    });

    it('should write DEBUG level logs to console.log', async () => {
      // Execute
      await transport.write(mockDebugEntry, formattedEntry);
      
      // Verify
      expect(consoleLogSpy).toHaveBeenCalledWith(formattedEntry);
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should write INFO level logs to console.info', async () => {
      // Execute
      await transport.write(mockInfoEntry, formattedEntry);
      
      // Verify
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith(formattedEntry);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should write WARN level logs to console.warn', async () => {
      // Execute
      await transport.write(mockWarnEntry, formattedEntry);
      
      // Verify
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(formattedEntry);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should write ERROR level logs to console.error', async () => {
      // Execute
      await transport.write(mockErrorEntry, formattedEntry);
      
      // Verify
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(formattedEntry);
    });

    it('should write FATAL level logs to console.error', async () => {
      // Execute
      await transport.write(mockFatalEntry, formattedEntry);
      
      // Verify
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(formattedEntry);
    });

    it('should not write logs below the configured level', async () => {
      // Setup - configure transport to only show ERROR and above
      transport = new ConsoleTransport({ level: LogLevel.ERROR });
      
      // Execute
      await transport.write(mockDebugEntry, formattedEntry);
      await transport.write(mockInfoEntry, formattedEntry);
      await transport.write(mockWarnEntry, formattedEntry);
      
      // Verify - no console methods should be called for logs below ERROR
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      
      // Now write an ERROR log
      await transport.write(mockErrorEntry, formattedEntry);
      
      // Verify - only console.error should be called
      expect(consoleErrorSpy).toHaveBeenCalledWith(formattedEntry);
    });
  });

  describe('colorization', () => {
    let transport: ConsoleTransport;
    const mockInfoEntry: LogEntry = {
      message: 'Info message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };

    // Mock chalk or other colorization library
    jest.mock('chalk', () => ({
      green: jest.fn((text) => `GREEN:${text}`),
      blue: jest.fn((text) => `BLUE:${text}`),
      yellow: jest.fn((text) => `YELLOW:${text}`),
      red: jest.fn((text) => `RED:${text}`),
      magenta: jest.fn((text) => `MAGENTA:${text}`),
    }));

    beforeEach(() => {
      transport = new ConsoleTransport({ colorize: true });
    });

    it('should apply colors when colorize is enabled', async () => {
      // Setup
      const formattedEntry = 'Formatted log entry';
      const colorizedEntry = 'BLUE:Formatted log entry'; // Assuming INFO is blue
      
      // Mock the colorize method
      (transport as any).colorize = true;
      (transport as any).colorizeText = jest.fn().mockReturnValue(colorizedEntry);
      
      // Execute
      await transport.write(mockInfoEntry, formattedEntry);
      
      // Verify
      expect((transport as any).colorizeText).toHaveBeenCalledWith(formattedEntry, LogLevel.INFO);
      expect(consoleInfoSpy).toHaveBeenCalledWith(colorizedEntry);
    });

    it('should not apply colors when colorize is disabled', async () => {
      // Setup
      transport = new ConsoleTransport({ colorize: false });
      const formattedEntry = 'Formatted log entry';
      
      // Mock the colorize method to ensure it's not called
      (transport as any).colorizeText = jest.fn();
      
      // Execute
      await transport.write(mockInfoEntry, formattedEntry);
      
      // Verify
      expect((transport as any).colorizeText).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith(formattedEntry);
    });

    it('should apply different colors based on log level', async () => {
      // This test would depend on the actual implementation of colorizeText
      // Here we're just testing the concept
      
      // Setup mock entries for different levels
      const mockEntries = [
        { entry: { ...mockInfoEntry, level: LogLevel.DEBUG }, color: 'GREEN' },
        { entry: { ...mockInfoEntry, level: LogLevel.INFO }, color: 'BLUE' },
        { entry: { ...mockInfoEntry, level: LogLevel.WARN }, color: 'YELLOW' },
        { entry: { ...mockInfoEntry, level: LogLevel.ERROR }, color: 'RED' },
        { entry: { ...mockInfoEntry, level: LogLevel.FATAL }, color: 'MAGENTA' },
      ];
      
      // Mock the colorizeText method with different returns based on level
      (transport as any).colorizeText = jest.fn((text, level) => {
        const color = mockEntries.find(e => e.entry.level === level)?.color || '';
        return `${color}:${text}`;
      });
      
      // Execute for each level and verify
      for (const { entry, color } of mockEntries) {
        const formattedEntry = 'Formatted log entry';
        const expectedColorized = `${color}:${formattedEntry}`;
        
        await transport.write(entry, formattedEntry);
        
        // Determine which console method should be called based on level
        let consoleMethod;
        switch (entry.level) {
          case LogLevel.DEBUG:
            consoleMethod = consoleLogSpy;
            break;
          case LogLevel.INFO:
            consoleMethod = consoleInfoSpy;
            break;
          case LogLevel.WARN:
            consoleMethod = consoleWarnSpy;
            break;
          case LogLevel.ERROR:
          case LogLevel.FATAL:
            consoleMethod = consoleErrorSpy;
            break;
        }
        
        expect((transport as any).colorizeText).toHaveBeenCalledWith(formattedEntry, entry.level);
        expect(consoleMethod).toHaveBeenCalledWith(expectedColorized);
        
        // Clear mock calls for next iteration
        jest.clearAllMocks();
      }
    });
  });

  describe('error handling', () => {
    let transport: ConsoleTransport;
    const mockInfoEntry: LogEntry = {
      message: 'Info message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    const formattedEntry = 'Formatted log entry';

    beforeEach(() => {
      transport = new ConsoleTransport();
    });

    it('should handle console output errors', async () => {
      // Setup - simulate console.info throwing an error
      const errorMessage = 'Console output error';
      consoleInfoSpy.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute & Verify
      await expect(transport.write(mockInfoEntry, formattedEntry))
        .rejects.toThrow(errorMessage);
    });

    it('should handle colorization errors', async () => {
      // Setup - simulate colorizeText throwing an error
      const errorMessage = 'Colorization error';
      (transport as any).colorizeText = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute & Verify
      await expect(transport.write(mockInfoEntry, formattedEntry))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('batching', () => {
    let transport: ConsoleTransport;
    const mockInfoEntry: LogEntry = {
      message: 'Info message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    const formattedEntry = 'Formatted log entry';

    beforeEach(() => {
      transport = new ConsoleTransport({ batchSize: 3 });
    });

    it('should support batched writing when configured', async () => {
      // This test depends on the actual implementation of batching
      // Here we're just testing the concept
      
      // Setup - mock the flush method
      (transport as any).flush = jest.fn();
      (transport as any).batch = [];
      (transport as any).batchSize = 3;
      
      // Execute - write entries but not enough to trigger flush
      await transport.write(mockInfoEntry, formattedEntry);
      await transport.write(mockInfoEntry, formattedEntry);
      
      // Verify - batch should have entries but flush not called
      expect((transport as any).batch.length).toBe(2);
      expect((transport as any).flush).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      
      // Execute - write one more entry to trigger flush
      await transport.write(mockInfoEntry, formattedEntry);
      
      // Verify - flush should be called and batch emptied
      expect((transport as any).flush).toHaveBeenCalled();
    });

    it('should flush batch on demand', async () => {
      // Setup - prepare a batch
      (transport as any).batch = [
        { entry: mockInfoEntry, formatted: formattedEntry },
        { entry: mockInfoEntry, formatted: formattedEntry },
      ];
      
      // Execute - call flush directly
      await (transport as any).flush();
      
      // Verify - console should be called for each entry and batch emptied
      expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
      expect(consoleInfoSpy).toHaveBeenCalledWith(formattedEntry);
      expect((transport as any).batch.length).toBe(0);
    });
  });

  describe('integration with formatters', () => {
    let transport: ConsoleTransport;
    const mockInfoEntry: LogEntry = {
      message: 'Info message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };

    beforeEach(() => {
      transport = new ConsoleTransport();
    });

    it('should use the formatted entry provided by the formatter', async () => {
      // Setup - create a mock formatter result
      const formattedEntry = 'Custom formatted entry with special formatting';
      
      // Execute
      await transport.write(mockInfoEntry, formattedEntry);
      
      // Verify
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        (transport as any).colorize ? expect.any(String) : formattedEntry
      );
    });

    it('should work with different formatter outputs', async () => {
      // Test with different formatter outputs
      const formatterOutputs = [
        'Simple text output',
        '{"json":"formatted","output":true}',
        'Output with special characters: \n\t\r',
        'Very long output '.repeat(100), // Test with long output
      ];
      
      for (const formatted of formatterOutputs) {
        jest.clearAllMocks();
        
        // Execute
        await transport.write(mockInfoEntry, formatted);
        
        // Verify
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          (transport as any).colorize ? expect.any(String) : formatted
        );
      }
    });
  });
});