import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as lockfile from 'proper-lockfile';

/**
 * Interface for FileTransport configuration options
 */
export interface FileTransportOptions {
  /** Path to the log file */
  filename: string;
  /** Maximum size of the log file before rotation (in bytes, or with KB, MB, GB suffix) */
  maxSize?: string | number;
  /** Maximum number of rotated log files to keep */
  maxFiles?: number;
  /** Rotation interval (daily, hourly, etc.) */
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly' | null;
  /** Whether to compress rotated log files */
  compress?: boolean;
  /** Compression level (0-9, where 9 is maximum compression) */
  compressionLevel?: number;
  /** File mode */
  fileMode?: number;
  /** Whether to use synchronous file operations */
  sync?: boolean;
  /** Encoding for the file */
  encoding?: BufferEncoding;
}

/**
 * Implementation of the Transport interface for file-based logging.
 * Provides features like log rotation, size limits, compression options,
 * and proper file locking for concurrent writes.
 */
export class FileTransport {
  private options: FileTransportOptions;
  private currentSize: number = 0;
  private stream: fs.WriteStream | null = null;
  private rotationTimer: NodeJS.Timeout | null = null;
  private rotationCheckInProgress: boolean = false;
  private initialized: boolean = false;
  private shuttingDown: boolean = false;

  /**
   * Creates a new FileTransport instance
   * @param options Configuration options for the file transport
   */
  constructor(options: FileTransportOptions) {
    this.options = {
      filename: options.filename,
      maxSize: options.maxSize || null,
      maxFiles: options.maxFiles || 5,
      interval: options.interval || null,
      compress: options.compress !== undefined ? options.compress : true,
      compressionLevel: options.compressionLevel || 6,
      fileMode: options.fileMode || 0o666,
      sync: options.sync || false,
      encoding: options.encoding || 'utf8'
    };
  }

  /**
   * Initializes the transport, creating the log file and setting up rotation timers
   */
  public async initialize(): Promise<void> {
    try {
      // Ensure the directory exists
      const dirname = path.dirname(this.options.filename);
      await this.ensureDirectoryExists(dirname);

      // Check if the file exists and get its size
      try {
        const stats = await fs.promises.stat(this.options.filename);
        this.currentSize = stats.size;

        // Check if we need to rotate immediately based on size
        if (this.options.maxSize && this.currentSize >= this.parseSize(this.options.maxSize)) {
          await this.rotate();
        }
      } catch (err) {
        // File doesn't exist, that's fine
        this.currentSize = 0;
      }

      // Open the stream
      await this.openStream();

      // Set up rotation timer if interval is specified
      if (this.options.interval) {
        this.setupRotationTimer();
      }

      this.initialized = true;
    } catch (err) {
      throw new Error(`Failed to initialize FileTransport: ${err.message}`);
    }
  }

  /**
   * Writes a log entry to the file
   * @param data The formatted log entry to write
   */
  public async write(data: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.shuttingDown) {
      throw new Error('Cannot write to transport during shutdown');
    }

    try {
      // Acquire a lock on the file to ensure concurrent write safety
      const release = await lockfile.lock(this.options.filename, { 
        retries: 5,
        retryWait: 100,
        stale: 10000
      });

      try {
        // Check if we need to rotate based on size
        const dataSize = Buffer.byteLength(data, this.options.encoding);
        if (
          this.options.maxSize && 
          this.currentSize + dataSize >= this.parseSize(this.options.maxSize) &&
          !this.rotationCheckInProgress
        ) {
          this.rotationCheckInProgress = true;
          await this.rotate();
          this.rotationCheckInProgress = false;
        }

        // Write to the stream
        if (!this.stream) {
          await this.openStream();
        }

        return new Promise<void>((resolve, reject) => {
          const writeCallback = (err?: Error | null) => {
            if (err) {
              reject(new Error(`Failed to write to log file: ${err.message}`));
            } else {
              this.currentSize += dataSize;
              resolve();
            }
          };

          if (this.options.sync) {
            // Use synchronous write
            try {
              fs.writeFileSync(this.options.filename, data, { 
                encoding: this.options.encoding,
                flag: 'a',
                mode: this.options.fileMode
              });
              this.currentSize += dataSize;
              resolve();
            } catch (err) {
              reject(new Error(`Failed to write to log file synchronously: ${err.message}`));
            }
          } else {
            // Use stream for asynchronous write
            const canContinue = this.stream.write(data, this.options.encoding, writeCallback);
            if (canContinue) {
              // If the stream buffer is not full, resolve immediately
              // The callback will still be called, but we don't need to wait for it
              resolve();
            }
          }
        });
      } finally {
        // Release the lock
        await release();
      }
    } catch (err) {
      throw new Error(`Failed to write to log file: ${err.message}`);
    }
  }

  /**
   * Closes the transport, flushing any pending writes and cleaning up resources
   */
  public async close(): Promise<void> {
    this.shuttingDown = true;

    // Clear rotation timer if it exists
    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
      this.rotationTimer = null;
    }

    // Close the stream if it exists
    if (this.stream) {
      return new Promise<void>((resolve, reject) => {
        this.stream.end(() => {
          this.stream = null;
          resolve();
        });
        this.stream.on('error', (err) => {
          this.stream = null;
          reject(new Error(`Failed to close log file stream: ${err.message}`));
        });
      });
    }
  }

  /**
   * Rotates the log file, creating a new file and optionally compressing the old one
   */
  private async rotate(): Promise<void> {
    if (!this.stream) {
      return;
    }

    try {
      // Close the current stream
      await new Promise<void>((resolve, reject) => {
        this.stream.end(() => {
          this.stream = null;
          resolve();
        });
        this.stream.on('error', (err) => {
          this.stream = null;
          reject(new Error(`Failed to close log file stream during rotation: ${err.message}`));
        });
      });

      // Generate the rotated file name
      const rotatedFilename = this.getRotatedFilename();

      // Rename the current file to the rotated file name
      try {
        await fs.promises.rename(this.options.filename, rotatedFilename);
      } catch (err) {
        // If the rename fails, try to copy and then delete
        await fs.promises.copyFile(this.options.filename, rotatedFilename);
        await fs.promises.unlink(this.options.filename);
      }

      // Compress the rotated file if compression is enabled
      if (this.options.compress) {
        await this.compressFile(rotatedFilename);
      }

      // Clean up old log files if maxFiles is specified
      if (this.options.maxFiles > 0) {
        await this.cleanupOldFiles();
      }

      // Open a new stream
      await this.openStream();
      this.currentSize = 0;
    } catch (err) {
      throw new Error(`Failed to rotate log file: ${err.message}`);
    }
  }

  /**
   * Opens a write stream to the log file
   */
  private async openStream(): Promise<void> {
    try {
      // Ensure the directory exists
      const dirname = path.dirname(this.options.filename);
      await this.ensureDirectoryExists(dirname);

      // Create the stream
      this.stream = fs.createWriteStream(this.options.filename, {
        flags: 'a',
        encoding: this.options.encoding,
        mode: this.options.fileMode
      });

      // Wait for the stream to open
      return new Promise<void>((resolve, reject) => {
        this.stream.on('open', () => {
          resolve();
        });
        this.stream.on('error', (err) => {
          this.stream = null;
          reject(new Error(`Failed to open log file stream: ${err.message}`));
        });
      });
    } catch (err) {
      throw new Error(`Failed to open log file stream: ${err.message}`);
    }
  }

  /**
   * Ensures that the directory for the log file exists, creating it if necessary
   * @param dirname The directory path
   */
  private async ensureDirectoryExists(dirname: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirname, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw new Error(`Failed to create log directory: ${err.message}`);
      }
    }
  }

  /**
   * Compresses a file using gzip
   * @param filename The file to compress
   */
  private async compressFile(filename: string): Promise<void> {
    const gzFilename = `${filename}.gz`;

    try {
      const readStream = fs.createReadStream(filename);
      const writeStream = fs.createWriteStream(gzFilename);
      const gzip = zlib.createGzip({ 
        level: this.options.compressionLevel 
      });

      readStream.pipe(gzip).pipe(writeStream);

      return new Promise<void>((resolve, reject) => {
        writeStream.on('finish', async () => {
          try {
            // Delete the original file after successful compression
            await fs.promises.unlink(filename);
            resolve();
          } catch (err) {
            reject(new Error(`Failed to delete original file after compression: ${err.message}`));
          }
        });
        writeStream.on('error', (err) => {
          reject(new Error(`Failed to compress log file: ${err.message}`));
        });
      });
    } catch (err) {
      throw new Error(`Failed to compress log file: ${err.message}`);
    }
  }

  /**
   * Cleans up old log files based on the maxFiles option
   */
  private async cleanupOldFiles(): Promise<void> {
    try {
      const dirname = path.dirname(this.options.filename);
      const basename = path.basename(this.options.filename);
      
      // Get all files in the directory
      const files = await fs.promises.readdir(dirname);
      
      // Filter for rotated log files
      const pattern = new RegExp(`^${basename}\.\d{4}-\d{2}-\d{2}`);
      const logFiles = files
        .filter(file => pattern.test(file))
        .map(file => path.join(dirname, file))
        .sort();
      
      // If we have more files than maxFiles, delete the oldest ones
      if (logFiles.length > this.options.maxFiles) {
        const filesToDelete = logFiles.slice(0, logFiles.length - this.options.maxFiles);
        
        for (const file of filesToDelete) {
          try {
            await fs.promises.unlink(file);
          } catch (err) {
            // Log the error but continue with other files
            console.error(`Failed to delete old log file ${file}: ${err.message}`);
          }
        }
      }
    } catch (err) {
      throw new Error(`Failed to clean up old log files: ${err.message}`);
    }
  }

  /**
   * Sets up a timer for log rotation based on the interval option
   */
  private setupRotationTimer(): void {
    const now = new Date();
    let nextRotation: Date;

    switch (this.options.interval) {
      case 'hourly':
        // Rotate at the top of the next hour
        nextRotation = new Date(now);
        nextRotation.setHours(now.getHours() + 1, 0, 0, 0);
        break;
      case 'daily':
        // Rotate at midnight
        nextRotation = new Date(now);
        nextRotation.setDate(now.getDate() + 1);
        nextRotation.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        // Rotate at midnight on Sunday
        nextRotation = new Date(now);
        nextRotation.setDate(now.getDate() + (7 - now.getDay()));
        nextRotation.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        // Rotate at midnight on the first day of the next month
        nextRotation = new Date(now);
        nextRotation.setMonth(now.getMonth() + 1, 1);
        nextRotation.setHours(0, 0, 0, 0);
        break;
      default:
        return;
    }

    const msUntilRotation = nextRotation.getTime() - now.getTime();

    // Set up the timer
    this.rotationTimer = setTimeout(async () => {
      try {
        await this.rotate();
        // Set up the next rotation
        this.setupRotationTimer();
      } catch (err) {
        console.error(`Failed to rotate log file: ${err.message}`);
        // Try again in a minute
        this.rotationTimer = setTimeout(() => this.setupRotationTimer(), 60000);
      }
    }, msUntilRotation);
  }

  /**
   * Generates a filename for a rotated log file
   */
  private getRotatedFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    const timestamp = `${year}-${month}-${day}_${hour}-${minute}-${second}`;
    const dirname = path.dirname(this.options.filename);
    const basename = path.basename(this.options.filename);

    return path.join(dirname, `${basename}.${timestamp}`);
  }

  /**
   * Parses a size string (e.g., '10MB') into bytes
   * @param size The size string to parse
   */
  private parseSize(size: string | number): number {
    if (typeof size === 'number') {
      return size;
    }

    const units = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)([bkmg])(?:b|ytes)?$/);
    if (!match) {
      return parseInt(size, 10);
    }

    const num = parseFloat(match[1]);
    const unit = match[2] as keyof typeof units;

    return Math.floor(num * units[unit]);
  }
}