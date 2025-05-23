import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as lockfile from 'proper-lockfile';
import { FileTransport, FileTransportOptions } from '../../../src/transports/file.transport';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';
import { wait, waitForLogsToProcess } from '../../utils/timing.utils';
import { createMockLogEntry } from '../../utils/assertion.utils';

// Mock dependencies
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn(),
    unlink: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn().mockResolvedValue(undefined),
    copyFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([])
  },
  createWriteStream: jest.fn(),
  writeFileSync: jest.fn()
}));

jest.mock('proper-lockfile', () => ({
  lock: jest.fn().mockResolvedValue(() => Promise.resolve())
}));

jest.mock('zlib', () => ({
  createGzip: jest.fn().mockReturnValue({
    pipe: jest.fn().mockReturnThis()
  })
}));

describe('FileTransport', () => {
  let transport: FileTransport;
  let mockWriteStream: any;
  let tempDir: string;
  let logFilePath: string;
  
  beforeEach(() => {
    // Create a temporary directory for test log files
    tempDir = path.join(os.tmpdir(), `austa-logs-${Date.now()}`);
    logFilePath = path.join(tempDir, 'test.log');
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock the write stream
    mockWriteStream = {
      write: jest.fn((data, encoding, callback) => {
        if (callback) callback();
        return true;
      }),
      end: jest.fn((callback) => {
        if (callback) callback();
      }),
      on: jest.fn((event, callback) => {
        if (event === 'open') {
          callback();
        }
        return mockWriteStream;
      })
    };
    
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    
    // Mock fs.promises.stat to return a file size
    (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 0 });
    
    // Mock fs.promises.readdir to return empty array
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
  });
  
  afterEach(async () => {
    // Clean up by closing the transport if it exists
    if (transport) {
      await transport.close();
    }
  });
  
  describe('initialization', () => {
    it('should initialize with default options', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      expect(fs.promises.mkdir).toHaveBeenCalledWith(tempDir, { recursive: true });
      expect(fs.promises.stat).toHaveBeenCalledWith(logFilePath);
      expect(fs.createWriteStream).toHaveBeenCalledWith(logFilePath, {
        flags: 'a',
        encoding: 'utf8',
        mode: 0o666
      });
    });
    
    it('should initialize with custom options', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath,
        maxSize: '10MB',
        maxFiles: 10,
        interval: 'daily',
        compress: true,
        compressionLevel: 9,
        fileMode: 0o644,
        sync: true,
        encoding: 'ascii'
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      expect(fs.createWriteStream).toHaveBeenCalledWith(logFilePath, {
        flags: 'a',
        encoding: 'ascii',
        mode: 0o644
      });
    });
    
    it('should handle initialization errors', async () => {
      (fs.promises.mkdir as jest.Mock).mockRejectedValueOnce(new Error('Directory creation failed'));
      
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      
      await expect(transport.initialize()).rejects.toThrow('Failed to initialize FileTransport');
    });
    
    it('should rotate immediately if file size exceeds maxSize', async () => {
      // Mock stat to return a large file size
      (fs.promises.stat as jest.Mock).mockResolvedValueOnce({ size: 15 * 1024 * 1024 }); // 15MB
      
      const options: FileTransportOptions = {
        filename: logFilePath,
        maxSize: '10MB',
        maxFiles: 3
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Should attempt to rename the file for rotation
      expect(fs.promises.rename).toHaveBeenCalled();
    });
  });
  
  describe('writing logs', () => {
    it('should write log entries to the file', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      const logEntry = createMockLogEntry({
        message: 'Test log message',
        level: LogLevel.INFO
      });
      
      await transport.write(JSON.stringify(logEntry) + '\n');
      
      expect(lockfile.lock).toHaveBeenCalledWith(logFilePath, expect.any(Object));
      expect(mockWriteStream.write).toHaveBeenCalledWith(
        JSON.stringify(logEntry) + '\n',
        'utf8',
        expect.any(Function)
      );
    });
    
    it('should use synchronous write when sync option is true', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath,
        sync: true
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      const logEntry = createMockLogEntry({
        message: 'Test log message',
        level: LogLevel.INFO
      });
      
      await transport.write(JSON.stringify(logEntry) + '\n');
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        logFilePath,
        JSON.stringify(logEntry) + '\n',
        expect.objectContaining({
          encoding: 'utf8',
          flag: 'a'
        })
      );
    });
    
    it('should handle write errors', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Mock write stream to fail
      mockWriteStream.write.mockImplementationOnce((data, encoding, callback) => {
        callback(new Error('Write failed'));
        return false;
      });
      
      const logEntry = createMockLogEntry({
        message: 'Test log message',
        level: LogLevel.INFO
      });
      
      await expect(transport.write(JSON.stringify(logEntry) + '\n')).rejects.toThrow('Failed to write to log file');
    });
    
    it('should handle lock acquisition errors', async () => {
      (lockfile.lock as jest.Mock).mockRejectedValueOnce(new Error('Lock acquisition failed'));
      
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      const logEntry = createMockLogEntry({
        message: 'Test log message',
        level: LogLevel.INFO
      });
      
      await expect(transport.write(JSON.stringify(logEntry) + '\n')).rejects.toThrow('Failed to write to log file');
    });
    
    it('should initialize if not already initialized when writing', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      // Don't call initialize explicitly
      
      const logEntry = createMockLogEntry({
        message: 'Test log message',
        level: LogLevel.INFO
      });
      
      await transport.write(JSON.stringify(logEntry) + '\n');
      
      expect(fs.promises.mkdir).toHaveBeenCalledWith(tempDir, { recursive: true });
      expect(mockWriteStream.write).toHaveBeenCalled();
    });
    
    it('should throw error when writing during shutdown', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      await transport.close();
      
      const logEntry = createMockLogEntry({
        message: 'Test log message',
        level: LogLevel.INFO
      });
      
      await expect(transport.write(JSON.stringify(logEntry) + '\n')).rejects.toThrow('Cannot write to transport during shutdown');
    });
  });
  
  describe('log rotation', () => {
    it('should rotate logs when size exceeds maxSize', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath,
        maxSize: '10B', // Very small size for testing
        maxFiles: 3
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Mock current size to be 5 bytes
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 5 });
      
      // Write a log entry that will exceed the max size
      const logEntry = createMockLogEntry({
        message: 'This log entry will trigger rotation',
        level: LogLevel.INFO
      });
      
      // Mock Buffer.byteLength to return a size that will trigger rotation
      jest.spyOn(Buffer, 'byteLength').mockReturnValueOnce(10);
      
      await transport.write(JSON.stringify(logEntry) + '\n');
      
      // Should attempt to close the stream and rename the file
      expect(mockWriteStream.end).toHaveBeenCalled();
      expect(fs.promises.rename).toHaveBeenCalled();
      expect(fs.createWriteStream).toHaveBeenCalledTimes(2); // Initial + after rotation
    });
    
    it('should compress rotated logs when compress option is true', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath,
        maxSize: '10B',
        compress: true
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Mock current size to be 5 bytes
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 5 });
      
      // Mock Buffer.byteLength to return a size that will trigger rotation
      jest.spyOn(Buffer, 'byteLength').mockReturnValueOnce(10);
      
      // Write a log entry that will exceed the max size
      const logEntry = createMockLogEntry({
        message: 'This log entry will trigger rotation',
        level: LogLevel.INFO
      });
      
      await transport.write(JSON.stringify(logEntry) + '\n');
      
      // Should attempt to compress the rotated file
      expect(require('zlib').createGzip).toHaveBeenCalled();
    });
    
    it('should clean up old log files when maxFiles is exceeded', async () => {
      // Mock readdir to return multiple log files
      const oldLogFiles = [
        'test.log.2023-01-01_00-00-00',
        'test.log.2023-01-02_00-00-00',
        'test.log.2023-01-03_00-00-00',
        'test.log.2023-01-04_00-00-00',
        'test.log.2023-01-05_00-00-00'
      ];
      
      (fs.promises.readdir as jest.Mock).mockResolvedValueOnce(oldLogFiles);
      
      const options: FileTransportOptions = {
        filename: logFilePath,
        maxSize: '10B',
        maxFiles: 3 // Keep only 3 files
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Mock current size to be 5 bytes
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 5 });
      
      // Mock Buffer.byteLength to return a size that will trigger rotation
      jest.spyOn(Buffer, 'byteLength').mockReturnValueOnce(10);
      
      // Write a log entry that will exceed the max size
      const logEntry = createMockLogEntry({
        message: 'This log entry will trigger rotation',
        level: LogLevel.INFO
      });
      
      await transport.write(JSON.stringify(logEntry) + '\n');
      
      // Should attempt to delete the oldest files
      expect(fs.promises.unlink).toHaveBeenCalledTimes(2); // Delete 2 oldest files
    });
    
    it('should handle rotation errors gracefully', async () => {
      // Mock rename to fail
      (fs.promises.rename as jest.Mock).mockRejectedValueOnce(new Error('Rename failed'));
      
      const options: FileTransportOptions = {
        filename: logFilePath,
        maxSize: '10B'
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Mock current size to be 5 bytes
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 5 });
      
      // Mock Buffer.byteLength to return a size that will trigger rotation
      jest.spyOn(Buffer, 'byteLength').mockReturnValueOnce(10);
      
      // Write a log entry that will exceed the max size
      const logEntry = createMockLogEntry({
        message: 'This log entry will trigger rotation',
        level: LogLevel.INFO
      });
      
      // Should fall back to copy and delete
      await transport.write(JSON.stringify(logEntry) + '\n');
      
      expect(fs.promises.copyFile).toHaveBeenCalled();
      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });
  
  describe('closing', () => {
    it('should close the transport and flush pending writes', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      await transport.close();
      
      expect(mockWriteStream.end).toHaveBeenCalled();
    });
    
    it('should handle close errors', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Mock end to trigger error
      mockWriteStream.end.mockImplementationOnce((callback) => {
        mockWriteStream.on.mock.calls.find(call => call[0] === 'error')[1](new Error('Close failed'));
      });
      
      await expect(transport.close()).rejects.toThrow('Failed to close log file stream');
    });
    
    it('should clear rotation timer when closing', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath,
        interval: 'daily'
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Mock clearTimeout
      const originalClearTimeout = global.clearTimeout;
      global.clearTimeout = jest.fn();
      
      await transport.close();
      
      expect(global.clearTimeout).toHaveBeenCalled();
      
      // Restore original clearTimeout
      global.clearTimeout = originalClearTimeout;
    });
  });
  
  describe('utility functions', () => {
    it('should parse size strings correctly', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath
      };
      
      transport = new FileTransport(options);
      
      // Test various size formats by triggering rotation with different maxSize values
      const testSizes = [
        { input: '1k', expected: 1024 },
        { input: '1m', expected: 1024 * 1024 },
        { input: '1g', expected: 1024 * 1024 * 1024 },
        { input: '1.5m', expected: 1.5 * 1024 * 1024 },
        { input: 2048, expected: 2048 }
      ];
      
      for (const { input, expected } of testSizes) {
        const newOptions = { ...options, maxSize: input };
        const newTransport = new FileTransport(newOptions);
        
        // Mock stat to return a size just below the expected value
        (fs.promises.stat as jest.Mock).mockResolvedValueOnce({ size: expected - 1 });
        
        await newTransport.initialize();
        
        // Mock Buffer.byteLength to return a size that will trigger rotation
        jest.spyOn(Buffer, 'byteLength').mockReturnValueOnce(2);
        
        // Write a log entry that will exceed the max size
        const logEntry = createMockLogEntry({
          message: 'Test size parsing',
          level: LogLevel.INFO
        });
        
        await newTransport.write(JSON.stringify(logEntry) + '\n');
        
        // Should trigger rotation
        expect(fs.promises.rename).toHaveBeenCalled();
        
        // Reset mocks for next iteration
        jest.clearAllMocks();
        await newTransport.close();
      }
    });
    
    it('should generate correct rotated filenames', async () => {
      const options: FileTransportOptions = {
        filename: logFilePath,
        maxSize: '10B'
      };
      
      transport = new FileTransport(options);
      await transport.initialize();
      
      // Mock current size to be 5 bytes
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 5 });
      
      // Mock Buffer.byteLength to return a size that will trigger rotation
      jest.spyOn(Buffer, 'byteLength').mockReturnValueOnce(10);
      
      // Mock Date.now to return a fixed timestamp
      const originalDate = global.Date;
      const mockDate = class extends Date {
        constructor() {
          super();
        }
        getFullYear() { return 2023; }
        getMonth() { return 0; } // January (0-indexed)
        getDate() { return 15; }
        getHours() { return 12; }
        getMinutes() { return 30; }
        getSeconds() { return 45; }
      };
      global.Date = mockDate as any;
      
      // Write a log entry that will exceed the max size
      const logEntry = createMockLogEntry({
        message: 'This log entry will trigger rotation',
        level: LogLevel.INFO
      });
      
      await transport.write(JSON.stringify(logEntry) + '\n');
      
      // Should rename with the correct timestamp format
      expect(fs.promises.rename).toHaveBeenCalledWith(
        logFilePath,
        expect.stringContaining('test.log.2023-01-15_12-30-45')
      );
      
      // Restore original Date
      global.Date = originalDate;
    });
  });
  
  describe('integration with file system', () => {
    // These tests interact with the actual file system
    // They are commented out to avoid file system operations during unit tests
    // Uncomment for local testing or when running in a controlled environment
    
    /*
    it('should write logs to an actual file', async () => {
      // Use real fs module for this test
      jest.unmock('fs');
      jest.unmock('proper-lockfile');
      
      const realTempDir = path.join(os.tmpdir(), `austa-logs-real-${Date.now()}`);
      const realLogFilePath = path.join(realTempDir, 'real-test.log');
      
      // Ensure directory exists
      await fs.promises.mkdir(realTempDir, { recursive: true });
      
      const options: FileTransportOptions = {
        filename: realLogFilePath
      };
      
      const realTransport = new FileTransport(options);
      await realTransport.initialize();
      
      const logEntry = createMockLogEntry({
        message: 'Real file system test',
        level: LogLevel.INFO
      });
      
      await realTransport.write(JSON.stringify(logEntry) + '\n');
      
      // Wait for file operations to complete
      await waitForLogsToProcess(100);
      
      // Verify file exists and contains the log entry
      const fileContent = await fs.promises.readFile(realLogFilePath, 'utf8');
      expect(fileContent).toContain('Real file system test');
      
      // Clean up
      await realTransport.close();
      await fs.promises.unlink(realLogFilePath);
      await fs.promises.rmdir(realTempDir);
      
      // Restore mocks
      jest.resetModules();
    });
    */
  });
});