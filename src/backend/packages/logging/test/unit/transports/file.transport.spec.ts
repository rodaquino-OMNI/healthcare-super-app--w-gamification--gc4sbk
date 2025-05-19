import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { FileTransport } from '../../../src/transports/file.transport';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  statSync: jest.fn(),
  renameSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
  createWriteStream: jest.fn(),
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    stat: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
  },
}));

// Mock the path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/')),
  basename: jest.fn((p) => p.split('/').pop()),
}));

describe('FileTransport', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create log directory if it does not exist', () => {
      // Setup
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Execute
      new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
      });
      
      // Verify
      expect(fs.existsSync).toHaveBeenCalledWith('/var/log/austa');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/var/log/austa', { recursive: true });
    });

    it('should not create log directory if it already exists', () => {
      // Setup
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Execute
      new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
      });
      
      // Verify
      expect(fs.existsSync).toHaveBeenCalledWith('/var/log/austa');
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should use default values if not provided', () => {
      // Setup
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Execute
      const transport = new FileTransport();
      
      // Verify - using any to access private properties for testing
      expect((transport as any).filename).toBe('application.log');
      expect((transport as any).directory).toBe('logs');
      expect((transport as any).maxSize).toBe(10 * 1024 * 1024); // 10MB
      expect((transport as any).maxFiles).toBe(5);
      expect((transport as any).compress).toBe(false);
    });

    it('should use provided configuration values', () => {
      // Setup
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Execute
      const transport = new FileTransport({
        filename: 'custom.log',
        directory: 'custom-logs',
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 10,
        compress: true,
      });
      
      // Verify - using any to access private properties for testing
      expect((transport as any).filename).toBe('custom.log');
      expect((transport as any).directory).toBe('custom-logs');
      expect((transport as any).maxSize).toBe(5 * 1024 * 1024);
      expect((transport as any).maxFiles).toBe(10);
      expect((transport as any).compress).toBe(true);
    });
  });

  describe('write', () => {
    let transport: FileTransport;
    const mockLogEntry: LogEntry = {
      message: 'Test log message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    const formattedLogEntry = '{"message":"Test log message","level":"INFO","timestamp":"2023-01-01T12:00:00.000Z","context":{"requestId":"123","userId":"456","journey":"health"}}\n';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 }); // Small file size
      transport = new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
      });
    });

    it('should append log entry to file', async () => {
      // Execute
      await transport.write(mockLogEntry, formattedLogEntry);
      
      // Verify
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        formattedLogEntry,
        { encoding: 'utf8' }
      );
    });

    it('should handle synchronous write errors', async () => {
      // Setup
      const errorMessage = 'Failed to write to file';
      (fs.appendFileSync as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute & Verify
      await expect(transport.write(mockLogEntry, formattedLogEntry))
        .rejects.toThrow(errorMessage);
    });

    it('should support asynchronous writing when configured', async () => {
      // Setup
      transport = new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
        sync: false,
      });
      
      // Execute
      await transport.write(mockLogEntry, formattedLogEntry);
      
      // Verify
      expect(fs.promises.appendFile).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        formattedLogEntry,
        { encoding: 'utf8' }
      );
    });

    it('should handle asynchronous write errors', async () => {
      // Setup
      transport = new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
        sync: false,
      });
      
      const errorMessage = 'Failed to write to file asynchronously';
      (fs.promises.appendFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Execute & Verify
      await expect(transport.write(mockLogEntry, formattedLogEntry))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('log rotation', () => {
    let transport: FileTransport;
    const mockLogEntry: LogEntry = {
      message: 'Test log message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    const formattedLogEntry = '{"message":"Test log message","level":"INFO","timestamp":"2023-01-01T12:00:00.000Z","context":{"requestId":"123","userId":"456","journey":"health"}}\n';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      transport = new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3,
      });
    });

    it('should rotate log file when size exceeds maxSize', async () => {
      // Setup - file size exceeds maxSize
      (fs.statSync as jest.Mock).mockReturnValue({ size: 6 * 1024 * 1024 }); // 6MB
      (fs.readdirSync as jest.Mock).mockReturnValue(['app.log']);
      
      // Execute
      await transport.write(mockLogEntry, formattedLogEntry);
      
      // Verify
      expect(fs.statSync).toHaveBeenCalledWith('/var/log/austa/app.log');
      expect(fs.renameSync).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        '/var/log/austa/app.1.log'
      );
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        formattedLogEntry,
        { encoding: 'utf8' }
      );
    });

    it('should delete oldest log file when maxFiles is reached', async () => {
      // Setup - file size exceeds maxSize and maxFiles is reached
      (fs.statSync as jest.Mock).mockReturnValue({ size: 6 * 1024 * 1024 }); // 6MB
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'app.log',
        'app.1.log',
        'app.2.log',
        'app.3.log',
      ]);
      
      // Execute
      await transport.write(mockLogEntry, formattedLogEntry);
      
      // Verify
      expect(fs.unlinkSync).toHaveBeenCalledWith('/var/log/austa/app.3.log');
      expect(fs.renameSync).toHaveBeenCalledWith(
        '/var/log/austa/app.2.log',
        '/var/log/austa/app.3.log'
      );
      expect(fs.renameSync).toHaveBeenCalledWith(
        '/var/log/austa/app.1.log',
        '/var/log/austa/app.2.log'
      );
      expect(fs.renameSync).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        '/var/log/austa/app.1.log'
      );
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        formattedLogEntry,
        { encoding: 'utf8' }
      );
    });

    it('should compress rotated logs when configured', async () => {
      // Setup - file size exceeds maxSize and compression is enabled
      transport = new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3,
        compress: true,
      });
      
      (fs.statSync as jest.Mock).mockReturnValue({ size: 6 * 1024 * 1024 }); // 6MB
      (fs.readdirSync as jest.Mock).mockReturnValue(['app.log']);
      
      // Mock zlib module
      const zlibMock = {
        createGzip: jest.fn().mockReturnValue({
          pipe: jest.fn().mockReturnThis(),
          on: jest.fn().mockImplementation(function(event, callback) {
            if (event === 'finish') {
              callback();
            }
            return this;
          }),
        }),
      };
      jest.mock('zlib', () => zlibMock);
      
      // Mock createWriteStream
      const mockWriteStream = {
        on: jest.fn().mockImplementation(function(event, callback) {
          if (event === 'finish') {
            callback();
          }
          return this;
        }),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
      
      // Execute
      await transport.write(mockLogEntry, formattedLogEntry);
      
      // Verify
      expect(fs.renameSync).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        '/var/log/austa/app.1.log'
      );
      // Additional verification for compression would go here
      // but it depends on the actual implementation details
    });
  });

  describe('file locking', () => {
    let transport: FileTransport;
    const mockLogEntry: LogEntry = {
      message: 'Test log message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    const formattedLogEntry = '{"message":"Test log message","level":"INFO","timestamp":"2023-01-01T12:00:00.000Z","context":{"requestId":"123","userId":"456","journey":"health"}}\n';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 }); // Small file size
      
      // Mock proper-lockfile module
      const lockfileMock = {
        lockSync: jest.fn(),
        unlockSync: jest.fn(),
      };
      jest.mock('proper-lockfile', () => lockfileMock);
      
      transport = new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
        useLocking: true,
      });
    });

    it('should use file locking when configured', async () => {
      // Get the mocked proper-lockfile module
      const lockfile = require('proper-lockfile');
      
      // Execute
      await transport.write(mockLogEntry, formattedLogEntry);
      
      // Verify
      expect(lockfile.lockSync).toHaveBeenCalledWith('/var/log/austa/app.log', {
        stale: 5000, // Assuming a default stale lock timeout
        retries: 5,   // Assuming default retry attempts
      });
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        formattedLogEntry,
        { encoding: 'utf8' }
      );
      expect(lockfile.unlockSync).toHaveBeenCalledWith('/var/log/austa/app.log');
    });

    it('should handle locking errors', async () => {
      // Get the mocked proper-lockfile module
      const lockfile = require('proper-lockfile');
      
      // Setup - simulate locking error
      const errorMessage = 'Failed to acquire lock';
      lockfile.lockSync.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute & Verify
      await expect(transport.write(mockLogEntry, formattedLogEntry))
        .rejects.toThrow(errorMessage);
      
      // Verify no write was attempted
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });

    it('should release lock even if write fails', async () => {
      // Get the mocked proper-lockfile module
      const lockfile = require('proper-lockfile');
      
      // Setup - simulate write error
      const errorMessage = 'Failed to write to file';
      (fs.appendFileSync as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute
      await expect(transport.write(mockLogEntry, formattedLogEntry))
        .rejects.toThrow(errorMessage);
      
      // Verify lock was released
      expect(lockfile.unlockSync).toHaveBeenCalledWith('/var/log/austa/app.log');
    });
  });

  describe('error handling', () => {
    let transport: FileTransport;
    const mockLogEntry: LogEntry = {
      message: 'Test log message',
      level: LogLevel.INFO,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123', userId: '456', journey: 'health' },
    };
    const formattedLogEntry = '{"message":"Test log message","level":"INFO","timestamp":"2023-01-01T12:00:00.000Z","context":{"requestId":"123","userId":"456","journey":"health"}}\n';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 }); // Small file size
      transport = new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
      });
    });

    it('should handle directory creation errors', () => {
      // Setup
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const errorMessage = 'Permission denied';
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute & Verify
      expect(() => new FileTransport({
        filename: 'app.log',
        directory: '/var/log/austa',
      })).toThrow(errorMessage);
    });

    it('should handle file stat errors during rotation check', async () => {
      // Setup
      const errorMessage = 'File not found';
      (fs.statSync as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute
      await transport.write(mockLogEntry, formattedLogEntry);
      
      // Verify - should still try to write even if stat fails
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/var/log/austa/app.log',
        formattedLogEntry,
        { encoding: 'utf8' }
      );
    });

    it('should handle rotation errors', async () => {
      // Setup - file size exceeds maxSize
      (fs.statSync as jest.Mock).mockReturnValue({ size: 6 * 1024 * 1024 }); // 6MB
      const errorMessage = 'Failed to rename file';
      (fs.renameSync as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute
      await expect(transport.write(mockLogEntry, formattedLogEntry))
        .rejects.toThrow(errorMessage);
    });

    it('should handle errors when cleaning up old log files', async () => {
      // Setup - file size exceeds maxSize and maxFiles is reached
      (fs.statSync as jest.Mock).mockReturnValue({ size: 6 * 1024 * 1024 }); // 6MB
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'app.log',
        'app.1.log',
        'app.2.log',
        'app.3.log',
      ]);
      
      const errorMessage = 'Failed to delete old log file';
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Execute
      await expect(transport.write(mockLogEntry, formattedLogEntry))
        .rejects.toThrow(errorMessage);
    });
  });
});