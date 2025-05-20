/**
 * @file file.transport.spec.ts
 * @description Unit tests for the FileTransport class that verify its ability to write log entries
 * to files on the local filesystem with proper rotation, compression, and error handling.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as lockfile from 'proper-lockfile';
import { EventEmitter } from 'events';
import { FileTransport, FileTransportOptions } from '../../../src/transports/file.transport';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { MockFormatter } from '../../mocks/formatter.mock';
import { createSampleLogEntry } from '../../mocks/formatter.mock';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('zlib');
jest.mock('proper-lockfile');

describe('FileTransport', () => {
  // Mock implementations
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;
  const mockZlib = zlib as jest.Mocked<typeof zlib>;
  const mockLockfile = lockfile as jest.Mocked<typeof lockfile>;
  
  // Test variables
  let transport: FileTransport;
  let formatter: MockFormatter;
  let mockWriteStream: any;
  let mockReleaseFn: jest.Mock;
  let mockGzipStream: any;
  
  // Setup default test configuration
  const testLogFilePath = '/var/log/austa/test.log';
  const testLogDir = '/var/log/austa';
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Setup formatter mock
    formatter = new MockFormatter();
    
    // Setup mock write stream
    mockWriteStream = new EventEmitter();
    mockWriteStream.write = jest.fn((data, callback) => {
      if (callback) callback();
      return true;
    });
    mockWriteStream.end = jest.fn((callback) => {
      if (callback) callback();
      return mockWriteStream;
    });
    
    // Setup mock fs implementations
    mockFs.createWriteStream.mockReturnValue(mockWriteStream);
    mockFs.statSync.mockReturnValue({ size: 0 } as any);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.rename.mockImplementation((oldPath, newPath, callback) => {
      callback(null);
    });
    mockFs.unlink.mockImplementation((path, callback) => {
      callback(null);
    });
    mockFs.readdir.mockImplementation((path, callback) => {
      callback(null, []);
    });
    
    // Setup mock path implementations
    mockPath.dirname.mockReturnValue(testLogDir);
    mockPath.basename.mockReturnValue('test.log');
    mockPath.join.mockImplementation((...paths) => paths.join('/'));
    
    // Setup mock lockfile implementation
    mockReleaseFn = jest.fn().mockResolvedValue(undefined);
    mockLockfile.lock.mockResolvedValue(mockReleaseFn);
    
    // Setup mock zlib implementation
    mockGzipStream = new EventEmitter();
    mockGzipStream.pipe = jest.fn().mockReturnValue(mockGzipStream);
    mockZlib.createGzip.mockReturnValue(mockGzipStream as any);
  });
  
  afterEach(async () => {
    // Ensure transport is closed after each test
    if (transport) {
      await transport.close();
    }
  });
  
  describe('initialization', () => {
    it('should create the log directory if it does not exist', () => {
      // Setup
      mockFs.existsSync.mockReturnValue(false);
      
      // Execute
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter
      });
      
      // Verify
      expect(mockFs.existsSync).toHaveBeenCalledWith(testLogDir);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(testLogDir, { recursive: true });
    });
    
    it('should initialize with default options', () => {
      // Execute
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter
      });
      
      // Verify
      expect(mockFs.createWriteStream).toHaveBeenCalledWith(
        testLogFilePath,
        expect.objectContaining({
          flags: 'a',
          encoding: 'utf8'
        })
      );
    });
    
    it('should initialize with custom options', () => {
      // Setup
      const customOptions: FileTransportOptions = {
        filePath: testLogFilePath,
        formatter,
        minLevel: LogLevel.INFO,
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        rotationInterval: 'hourly',
        compress: false,
        fileMode: 0o644,
        encoding: 'ascii',
        append: false
      };
      
      // Execute
      transport = new FileTransport(customOptions);
      
      // Verify
      expect(mockFs.createWriteStream).toHaveBeenCalledWith(
        testLogFilePath,
        expect.objectContaining({
          flags: 'w', // append: false
          encoding: 'ascii',
          mode: 0o644
        })
      );
    });
    
    it('should emit error when directory creation fails', () => {
      // Setup
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      // Execute & Verify
      const errorHandler = jest.fn();
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter
      });
      transport.on('error', errorHandler);
      
      // Verify
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to create log directory')
        })
      );
    });
    
    it('should emit error when file creation fails', () => {
      // Setup
      mockFs.createWriteStream.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      // Execute & Verify
      const errorHandler = jest.fn();
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter
      });
      transport.on('error', errorHandler);
      
      // Verify
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to open log file')
        })
      );
    });
    
    it('should check current file size on initialization', () => {
      // Setup
      const fileSize = 1024;
      mockFs.statSync.mockReturnValue({ size: fileSize } as any);
      
      // Execute
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter
      });
      
      // Verify
      expect(mockFs.statSync).toHaveBeenCalledWith(testLogFilePath);
      // We can't directly test the private property, but we can test behavior
      // that depends on it in other tests
    });
  });
  
  describe('write', () => {
    beforeEach(() => {
      // Initialize transport with default options
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter
      });
    });
    
    it('should format and buffer log entries', async () => {
      // Setup
      const logEntry = createSampleLogEntry();
      const formattedLog = 'Formatted log entry';
      formatter.format = jest.fn().mockReturnValue(formattedLog);
      
      // Execute
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Verify
      expect(formatter.format).toHaveBeenCalledWith(expect.objectContaining({
        level: logEntry.level,
        message: logEntry.message,
        timestamp: expect.any(Date),
        meta: expect.objectContaining(logEntry.context || {})
      }));
      
      // Note: We can't directly test the private buffer, but we'll test the flush behavior
    });
    
    it('should not write logs below minimum level', async () => {
      // Setup
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter,
        minLevel: LogLevel.ERROR
      });
      
      const logEntry = createSampleLogEntry({ level: LogLevel.INFO });
      formatter.format = jest.fn();
      
      // Execute
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Verify
      expect(formatter.format).not.toHaveBeenCalled();
    });
    
    it('should throw error when writing to closed transport', async () => {
      // Setup
      await transport.close();
      const logEntry = createSampleLogEntry();
      
      // Execute & Verify
      await expect(transport.write(logEntry.level, logEntry.message, logEntry.context))
        .rejects.toThrow('Cannot write to closed transport');
    });
    
    it('should emit error when formatting fails', async () => {
      // Setup
      const logEntry = createSampleLogEntry();
      const formatError = new Error('Formatting failed');
      formatter.format = jest.fn().mockImplementation(() => {
        throw formatError;
      });
      
      // Execute & Verify
      const errorHandler = jest.fn();
      transport.on('error', errorHandler);
      
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Verify
      expect(errorHandler).toHaveBeenCalledWith(formatError);
    });
  });
  
  describe('flush', () => {
    beforeEach(() => {
      // Initialize transport with default options
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter,
        flushInterval: 100 // Short interval for testing
      });
    });
    
    it('should write buffered logs to file', async () => {
      // Setup
      const logEntry = createSampleLogEntry();
      const formattedLog = 'Formatted log entry';
      formatter.format = jest.fn().mockReturnValue(formattedLog);
      
      // Add log to buffer
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Execute - force flush by waiting for the flush interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify
      expect(mockLockfile.lock).toHaveBeenCalledWith(
        testLogFilePath,
        expect.any(Object)
      );
      expect(mockWriteStream.write).toHaveBeenCalledWith(
        expect.stringContaining(formattedLog),
        expect.any(Function)
      );
      expect(mockReleaseFn).toHaveBeenCalled();
    });
    
    it('should handle write errors gracefully', async () => {
      // Setup
      const logEntry = createSampleLogEntry();
      const formattedLog = 'Formatted log entry';
      formatter.format = jest.fn().mockReturnValue(formattedLog);
      
      const writeError = new Error('Write failed');
      mockWriteStream.write = jest.fn((data, callback) => {
        if (callback) callback(writeError);
        return false;
      });
      
      // Execute & Verify
      const errorHandler = jest.fn();
      transport.on('error', errorHandler);
      
      // Add log to buffer
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Force flush by waiting for the flush interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to flush logs')
        })
      );
    });
    
    it('should handle lock acquisition failures', async () => {
      // Setup
      const logEntry = createSampleLogEntry();
      const formattedLog = 'Formatted log entry';
      formatter.format = jest.fn().mockReturnValue(formattedLog);
      
      const lockError = new Error('Lock failed');
      mockLockfile.lock.mockRejectedValue(lockError);
      
      // Execute & Verify
      const errorHandler = jest.fn();
      transport.on('error', errorHandler);
      
      // Add log to buffer
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Force flush by waiting for the flush interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to flush logs')
        })
      );
    });
  });
  
  describe('rotation', () => {
    it('should rotate log file when size limit is reached', async () => {
      // Setup
      const maxSize = 1024; // 1KB
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter,
        maxSize,
        flushInterval: 100 // Short interval for testing
      });
      
      // Mock current file size to be just below the limit
      mockFs.statSync.mockReturnValue({ size: maxSize - 100 } as any);
      
      // Create a large log entry that will exceed the limit
      const logEntry = createSampleLogEntry();
      const formattedLog = 'X'.repeat(200); // 200 bytes
      formatter.format = jest.fn().mockReturnValue(formattedLog);
      
      // Execute
      const rotateHandler = jest.fn();
      transport.on('rotate', rotateHandler);
      
      // Add log to buffer
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Force flush by waiting for the flush interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify
      expect(mockWriteStream.end).toHaveBeenCalled();
      expect(mockFs.rename).toHaveBeenCalled();
      expect(rotateHandler).toHaveBeenCalled();
    });
    
    it('should compress rotated files when compression is enabled', async () => {
      // Setup
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter,
        maxSize: 1024, // 1KB
        compress: true,
        flushInterval: 100 // Short interval for testing
      });
      
      // Mock current file size to be at the limit
      mockFs.statSync.mockReturnValue({ size: 1024 } as any);
      
      // Setup mock read stream
      const mockReadStream = new EventEmitter();
      mockReadStream.pipe = jest.fn().mockReturnValue(mockGzipStream);
      mockFs.createReadStream.mockReturnValue(mockReadStream as any);
      
      // Execute
      const compressHandler = jest.fn();
      transport.on('compress', compressHandler);
      
      // Add log to buffer to trigger rotation
      const logEntry = createSampleLogEntry();
      formatter.format = jest.fn().mockReturnValue('Test log');
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Force flush by waiting for the flush interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Simulate compression completion
      mockGzipStream.emit('finish');
      
      // Verify
      expect(mockZlib.createGzip).toHaveBeenCalled();
      expect(mockReadStream.pipe).toHaveBeenCalledWith(expect.any(Object)); // gzip stream
      expect(mockGzipStream.pipe).toHaveBeenCalledWith(expect.any(Object)); // write stream
      expect(mockFs.unlink).toHaveBeenCalled(); // Delete original file after compression
      expect(compressHandler).toHaveBeenCalled();
    });
    
    it('should clean up old rotated files based on maxFiles setting', async () => {
      // Setup
      const maxFiles = 3;
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter,
        maxSize: 1024, // 1KB
        maxFiles,
        flushInterval: 100 // Short interval for testing
      });
      
      // Mock current file size to be at the limit
      mockFs.statSync.mockReturnValue({ size: 1024 } as any);
      
      // Mock directory listing with rotated files
      const rotatedFiles = [
        'test.log.2023-01-01T00-00-00-000Z',
        'test.log.2023-01-02T00-00-00-000Z',
        'test.log.2023-01-03T00-00-00-000Z',
        'test.log.2023-01-04T00-00-00-000Z'
      ];
      mockFs.readdir.mockImplementation((dir, callback) => {
        callback(null, rotatedFiles);
      });
      
      // Mock file stats to have different mtimes
      let statCallCount = 0;
      mockFs.statSync.mockImplementation(() => {
        const mtime = new Date(2023, 0, statCallCount + 1);
        statCallCount++;
        return { mtime, size: 1024 } as any;
      });
      
      // Execute
      const deleteHandler = jest.fn();
      transport.on('delete', deleteHandler);
      
      // Add log to buffer to trigger rotation
      const logEntry = createSampleLogEntry();
      formatter.format = jest.fn().mockReturnValue('Test log');
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Force flush by waiting for the flush interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify
      expect(mockFs.readdir).toHaveBeenCalledWith(
        testLogDir,
        expect.any(Function)
      );
      expect(mockFs.unlink).toHaveBeenCalledTimes(rotatedFiles.length - maxFiles + 1);
      expect(deleteHandler).toHaveBeenCalledTimes(rotatedFiles.length - maxFiles + 1);
    });
    
    it('should handle rotation errors gracefully', async () => {
      // Setup
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter,
        maxSize: 1024, // 1KB
        flushInterval: 100 // Short interval for testing
      });
      
      // Mock current file size to be at the limit
      mockFs.statSync.mockReturnValue({ size: 1024 } as any);
      
      // Mock rename to fail
      const renameError = new Error('Rename failed');
      mockFs.rename.mockImplementation((oldPath, newPath, callback) => {
        callback(renameError);
      });
      
      // Execute
      const errorHandler = jest.fn();
      transport.on('error', errorHandler);
      
      // Add log to buffer to trigger rotation
      const logEntry = createSampleLogEntry();
      formatter.format = jest.fn().mockReturnValue('Test log');
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Force flush by waiting for the flush interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to rotate log file')
        })
      );
    });
  });
  
  describe('close', () => {
    beforeEach(() => {
      // Initialize transport with default options
      transport = new FileTransport({
        filePath: testLogFilePath,
        formatter
      });
    });
    
    it('should flush pending writes and close the stream', async () => {
      // Setup
      const logEntry = createSampleLogEntry();
      formatter.format = jest.fn().mockReturnValue('Test log');
      
      // Add log to buffer
      await transport.write(logEntry.level, logEntry.message, logEntry.context);
      
      // Execute
      await transport.close();
      
      // Verify
      expect(mockWriteStream.end).toHaveBeenCalled();
    });
    
    it('should be idempotent', async () => {
      // Execute
      await transport.close();
      await transport.close(); // Second call should be a no-op
      
      // Verify
      expect(mockWriteStream.end).toHaveBeenCalledTimes(1);
    });
  });
});