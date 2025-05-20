import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as lockfile from 'proper-lockfile';
import { EventEmitter } from 'events';
import { Transport } from '../interfaces/transport.interface';
import { LogLevel } from '../interfaces/log-level.enum';
import { Formatter } from '../formatters/formatter.interface';

/**
 * Options for the FileTransport
 */
export interface FileTransportOptions {
  /** Path to the log file */
  filePath: string;
  /** Formatter to use for log entries */
  formatter: Formatter;
  /** Minimum log level to write */
  minLevel?: LogLevel;
  /** Maximum size of the log file before rotation (in bytes) */
  maxSize?: number;
  /** Maximum number of rotated files to keep */
  maxFiles?: number;
  /** Rotation interval (daily, hourly, etc.) */
  rotationInterval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  /** Whether to compress rotated files */
  compress?: boolean;
  /** Compression level (1-9, where 9 is maximum compression) */
  compressionLevel?: number;
  /** Buffer size for write operations */
  bufferSize?: number;
  /** Flush interval in milliseconds */
  flushInterval?: number;
  /** Whether to use synchronous file operations */
  sync?: boolean;
  /** File mode */
  fileMode?: number;
  /** File encoding */
  encoding?: string;
  /** Whether to append to existing file */
  append?: boolean;
}

/**
 * Default options for the FileTransport
 */
const DEFAULT_OPTIONS: Partial<FileTransportOptions> = {
  minLevel: LogLevel.DEBUG,
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  rotationInterval: 'daily',
  compress: true,
  compressionLevel: 6,
  bufferSize: 64 * 1024, // 64KB
  flushInterval: 1000, // 1 second
  sync: false,
  fileMode: 0o666,
  encoding: 'utf8',
  append: true,
};

/**
 * A transport that writes log entries to a file with support for
 * rotation, compression, and file locking.
 */
export class FileTransport extends EventEmitter implements Transport {
  private options: FileTransportOptions;
  private writeStream: fs.WriteStream | null = null;
  private buffer: string[] = [];
  private bufferSize = 0;
  private flushTimer: NodeJS.Timeout | null = null;
  private writing = false;
  private rotating = false;
  private closed = false;
  private currentFileSize = 0;
  private lastRotationCheck = Date.now();

  /**
   * Creates a new FileTransport instance
   * @param options Options for the transport
   */
  constructor(options: FileTransportOptions) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.ensureDirectoryExists();
    this.initializeStream();
    this.startFlushTimer();

    // Check current file size
    try {
      const stats = fs.statSync(this.options.filePath);
      this.currentFileSize = stats.size;
    } catch (err) {
      this.currentFileSize = 0;
    }
  }

  /**
   * Writes a log entry to the transport
   * @param level Log level
   * @param message Log message
   * @param meta Additional metadata
   */
  public async write(level: LogLevel, message: string, meta?: Record<string, any>): Promise<void> {
    if (this.closed) {
      throw new Error('Cannot write to closed transport');
    }

    if (level < (this.options.minLevel || LogLevel.DEBUG)) {
      return;
    }

    try {
      const formattedLog = this.options.formatter.format({
        level,
        message,
        timestamp: new Date(),
        meta: meta || {},
      });

      this.addToBuffer(formattedLog);
    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * Closes the transport and flushes any pending writes
   */
  public async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    await this.flush();

    // Close the write stream
    if (this.writeStream) {
      return new Promise<void>((resolve, reject) => {
        this.writeStream!.end(() => {
          this.writeStream = null;
          resolve();
        });
      });
    }
  }

  /**
   * Ensures the directory for the log file exists
   */
  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.options.filePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        this.emit('error', new Error(`Failed to create log directory: ${err.message}`));
      }
    }
  }

  /**
   * Initializes the write stream
   */
  private initializeStream(): void {
    try {
      const flags = this.options.append ? 'a' : 'w';
      this.writeStream = fs.createWriteStream(this.options.filePath, {
        flags,
        encoding: this.options.encoding,
        mode: this.options.fileMode,
      });

      this.writeStream.on('error', (err) => {
        this.emit('error', err);
      });

      this.emit('open', this.options.filePath);
    } catch (err) {
      this.emit('error', new Error(`Failed to open log file: ${err.message}`));
    }
  }

  /**
   * Starts the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.emit('error', err);
      });
    }, this.options.flushInterval);
  }

  /**
   * Adds a log entry to the buffer
   * @param log Formatted log entry
   */
  private addToBuffer(log: string): void {
    const logWithNewline = log.endsWith('\n') ? log : `${log}\n`;
    this.buffer.push(logWithNewline);
    this.bufferSize += Buffer.byteLength(logWithNewline, this.options.encoding);

    // Flush if buffer exceeds size threshold
    if (this.bufferSize >= this.options.bufferSize!) {
      this.flush().catch((err) => {
        this.emit('error', err);
      });
    }
  }

  /**
   * Flushes the buffer to the file
   */
  private async flush(): Promise<void> {
    if (this.writing || this.buffer.length === 0 || !this.writeStream) {
      return;
    }

    this.writing = true;
    const bufferToWrite = this.buffer;
    const bufferSizeToWrite = this.bufferSize;
    this.buffer = [];
    this.bufferSize = 0;

    try {
      // Check if rotation is needed before writing
      await this.checkRotation();

      // Acquire a lock on the file
      const release = await lockfile.lock(this.options.filePath, {
        stale: 10000,  // Consider the lock stale after 10 seconds
        retries: 5,    // Try 5 times to acquire the lock
        retryWait: 100 // Wait 100ms between retries
      });

      try {
        // Write to the file
        const data = bufferToWrite.join('');
        await new Promise<void>((resolve, reject) => {
          this.writeStream!.write(data, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });

        // Update current file size
        this.currentFileSize += bufferSizeToWrite;

        this.emit('flush', bufferToWrite.length);
      } finally {
        // Release the lock
        await release();
      }
    } catch (err) {
      // Put the logs back in the buffer to try again later
      this.buffer = [...bufferToWrite, ...this.buffer];
      this.bufferSize += bufferSizeToWrite;
      this.emit('error', new Error(`Failed to flush logs: ${err.message}`));
    } finally {
      this.writing = false;
    }
  }

  /**
   * Checks if rotation is needed and performs rotation if necessary
   */
  private async checkRotation(): Promise<void> {
    if (this.rotating) {
      return;
    }

    const now = Date.now();
    let needsRotation = false;

    // Check size-based rotation
    if (this.options.maxSize && this.currentFileSize >= this.options.maxSize) {
      needsRotation = true;
    }

    // Check time-based rotation
    if (this.options.rotationInterval) {
      const hourMs = 60 * 60 * 1000;
      const dayMs = 24 * hourMs;
      const weekMs = 7 * dayMs;
      const monthMs = 30 * dayMs; // Approximate

      let intervalMs: number;
      switch (this.options.rotationInterval) {
        case 'hourly':
          intervalMs = hourMs;
          break;
        case 'daily':
          intervalMs = dayMs;
          break;
        case 'weekly':
          intervalMs = weekMs;
          break;
        case 'monthly':
          intervalMs = monthMs;
          break;
        default:
          intervalMs = dayMs;
      }

      if (now - this.lastRotationCheck >= intervalMs) {
        needsRotation = true;
      }
    }

    if (needsRotation) {
      await this.rotate();
      this.lastRotationCheck = now;
    }
  }

  /**
   * Rotates the log file
   */
  private async rotate(): Promise<void> {
    if (this.rotating || !this.writeStream) {
      return;
    }

    this.rotating = true;

    try {
      // Close current stream
      await new Promise<void>((resolve, reject) => {
        this.writeStream!.end(() => {
          this.writeStream = null;
          resolve();
        });
      });

      const oldFilePath = this.options.filePath;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFilePath = `${oldFilePath}.${timestamp}`;

      // Rename current file to rotated file
      await new Promise<void>((resolve, reject) => {
        fs.rename(oldFilePath, rotatedFilePath, (err) => {
          if (err) {
            reject(new Error(`Failed to rename log file: ${err.message}`));
          } else {
            resolve();
          }
        });
      });

      // Compress the rotated file if needed
      if (this.options.compress) {
        await this.compressFile(rotatedFilePath);
      }

      // Clean up old rotated files
      await this.cleanupOldFiles();

      // Create a new stream
      this.initializeStream();
      this.currentFileSize = 0;

      this.emit('rotate', oldFilePath, rotatedFilePath);
    } catch (err) {
      this.emit('error', new Error(`Failed to rotate log file: ${err.message}`));
      // Try to re-initialize the stream if rotation failed
      if (!this.writeStream) {
        this.initializeStream();
      }
    } finally {
      this.rotating = false;
    }
  }

  /**
   * Compresses a rotated log file
   * @param filePath Path to the file to compress
   */
  private async compressFile(filePath: string): Promise<void> {
    const gzipFilePath = `${filePath}.gz`;

    try {
      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(gzipFilePath);
      const gzip = zlib.createGzip({
        level: this.options.compressionLevel
      });

      await new Promise<void>((resolve, reject) => {
        readStream
          .pipe(gzip)
          .pipe(writeStream)
          .on('finish', () => {
            // Delete the original file after successful compression
            fs.unlink(filePath, (err) => {
              if (err) {
                this.emit('error', new Error(`Failed to delete original file after compression: ${err.message}`));
              }
              resolve();
            });
          })
          .on('error', (err) => {
            reject(new Error(`Failed to compress log file: ${err.message}`));
          });
      });

      this.emit('compress', filePath, gzipFilePath);
    } catch (err) {
      this.emit('error', new Error(`Failed to compress log file: ${err.message}`));
    }
  }

  /**
   * Cleans up old rotated files based on maxFiles setting
   */
  private async cleanupOldFiles(): Promise<void> {
    if (!this.options.maxFiles) {
      return;
    }

    try {
      const dir = path.dirname(this.options.filePath);
      const baseFileName = path.basename(this.options.filePath);
      const files = await new Promise<string[]>((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
          if (err) {
            reject(err);
          } else {
            resolve(files);
          }
        });
      });

      // Filter files that match our rotation pattern
      const rotatedFiles = files
        .filter(file => file.startsWith(baseFileName) && file !== baseFileName)
        .map(file => path.join(dir, file))
        .map(file => ({ path: file, mtime: fs.statSync(file).mtime.getTime() }));

      // Sort by modification time (oldest first)
      rotatedFiles.sort((a, b) => a.mtime - b.mtime);

      // Delete oldest files if we have more than maxFiles
      const filesToDelete = rotatedFiles.slice(0, Math.max(0, rotatedFiles.length - this.options.maxFiles + 1));

      for (const file of filesToDelete) {
        await new Promise<void>((resolve, reject) => {
          fs.unlink(file.path, (err) => {
            if (err) {
              this.emit('error', new Error(`Failed to delete old log file: ${err.message}`));
            } else {
              this.emit('delete', file.path);
            }
            resolve();
          });
        });
      }
    } catch (err) {
      this.emit('error', new Error(`Failed to clean up old log files: ${err.message}`));
    }
  }
}