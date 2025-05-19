import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as lockfile from 'proper-lockfile';
import { Transport } from '../interfaces/transport.interface';
import { LogEntry } from '../interfaces/log-entry.interface';
import { LogLevel } from '../interfaces/log-level.enum';

/**
 * Configuration options for the FileTransport
 */
export interface FileTransportOptions {
  /** Path to the log file */
  filename: string;
  /** Directory where log files will be stored */
  dirname?: string;
  /** Maximum size of the log file before rotation (in bytes, or with k/m/g suffix) */
  maxSize?: string | number;
  /** Maximum number of log files to keep (can be a number or days with 'd' suffix) */
  maxFiles?: string | number;
  /** Date pattern for time-based rotation (e.g., 'YYYY-MM-DD') */
  datePattern?: string;
  /** Whether to compress rotated log files */
  zippedArchive?: boolean;
  /** File system flags used when opening the log file */
  flags?: string;
  /** Whether to create the directory if it doesn't exist */
  createDirectoryIfNotExists?: boolean;
  /** Encoding to use for the log file */
  encoding?: BufferEncoding;
  /** Whether to use UTC time for date-based rotation */
  utc?: boolean;
  /** Custom file extension for log files */
  extension?: string;
  /** Whether to create a tailable symlink to the current active log file */
  createSymlink?: boolean;
  /** The name of the tailable symlink */
  symlinkName?: string;
  /** Minimum log level to write to this transport */
  level?: LogLevel;
}

/**
 * FileTransport implementation that writes log entries to local files with support for
 * log rotation, compression, and file locking for concurrent write safety.
 */
export class FileTransport implements Transport {
  private options: Required<FileTransportOptions>;
  private currentFileSize: number = 0;
  private currentFilename: string;
  private fileStream: fs.WriteStream | null = null;
  private rotationCheckInterval: NodeJS.Timeout | null = null;
  private rotationTimer: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  private shuttingDown: boolean = false;

  /**
   * Creates a new FileTransport instance
   * @param options Configuration options for the file transport
   */
  constructor(options: FileTransportOptions) {
    this.options = {
      filename: options.filename,
      dirname: options.dirname || path.dirname(options.filename),
      maxSize: options.maxSize || 0, // 0 means no limit
      maxFiles: options.maxFiles || 0, // 0 means no limit
      datePattern: options.datePattern || '',
      zippedArchive: options.zippedArchive || false,
      flags: options.flags || 'a',
      createDirectoryIfNotExists: options.createDirectoryIfNotExists !== false,
      encoding: options.encoding || 'utf8',
      utc: options.utc || false,
      extension: options.extension || '',
      createSymlink: options.createSymlink || false,
      symlinkName: options.symlinkName || 'current.log',
      level: options.level || LogLevel.DEBUG
    };

    this.currentFilename = this.getFilename();

    // Register process exit handlers to ensure proper cleanup
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  /**
   * Initializes the transport, creating necessary directories and opening the log file
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create directory if it doesn't exist
      if (this.options.createDirectoryIfNotExists) {
        await this.ensureDirectoryExists(this.options.dirname);
      }

      // Open the file stream
      await this.openFile();

      // Set up rotation check if needed
      if (this.shouldRotateByTime()) {
        this.setupTimeBasedRotation();
      }

      // Check file size if needed
      if (this.shouldRotateBySize()) {
        await this.checkFileSize();
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize FileTransport: ${error.message}`);
    }
  }

  /**
   * Writes a log entry to the file
   * @param entry The log entry to write
   */
  public async write(entry: LogEntry): Promise<void> {
    // Skip if log level is below the configured level
    if (entry.level < this.options.level) {
      return;
    }

    // Ensure transport is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check if rotation is needed
      if (this.shouldRotateByTime() && this.isTimeToRotate()) {
        await this.rotateFile();
      }

      // Format the log entry as a string (assuming it's already formatted)
      const logString = entry.formattedMessage + '\n';
      const logBuffer = Buffer.from(logString, this.options.encoding);

      // Acquire a lock on the file
      const release = await lockfile.lock(this.currentFilename, {
        stale: 10000,  // Consider the lock stale after 10 seconds
        retries: 5,    // Retry 5 times
        retryWait: 100 // Wait 100ms between retries
      });

      try {
        // Write to the file
        if (this.fileStream) {
          await new Promise<void>((resolve, reject) => {
            this.fileStream!.write(logBuffer, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });

          // Update current file size
          this.currentFileSize += logBuffer.length;

          // Check if size-based rotation is needed
          if (this.shouldRotateBySize() && this.isSizeExceeded()) {
            await this.rotateFile();
          }
        } else {
          throw new Error('File stream is not open');
        }
      } finally {
        // Release the lock
        await release();
      }
    } catch (error) {
      // Handle errors but don't throw to avoid crashing the application
      console.error(`Error writing to log file: ${error.message}`);
    }
  }

  /**
   * Cleans up resources used by the transport
   */
  public async cleanup(): Promise<void> {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;

    // Clear any timers
    if (this.rotationCheckInterval) {
      clearInterval(this.rotationCheckInterval);
      this.rotationCheckInterval = null;
    }

    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
      this.rotationTimer = null;
    }

    // Close the file stream if open
    if (this.fileStream) {
      await new Promise<void>((resolve) => {
        this.fileStream!.end(() => {
          this.fileStream = null;
          resolve();
        });
      });
    }

    this.initialized = false;
    this.shuttingDown = false;
  }

  /**
   * Opens the log file for writing
   */
  private async openFile(): Promise<void> {
    // Close existing stream if open
    if (this.fileStream) {
      await new Promise<void>((resolve) => {
        this.fileStream!.end(() => {
          this.fileStream = null;
          resolve();
        });
      });
    }

    // Create a new write stream
    this.fileStream = fs.createWriteStream(this.currentFilename, {
      flags: this.options.flags,
      encoding: this.options.encoding
    });

    // Create symlink if configured
    if (this.options.createSymlink) {
      await this.createSymlink();
    }
  }

  /**
   * Creates a symlink to the current log file
   */
  private async createSymlink(): Promise<void> {
    const symlinkPath = path.join(this.options.dirname, this.options.symlinkName);

    try {
      // Remove existing symlink if it exists
      try {
        await fs.promises.unlink(symlinkPath);
      } catch (error) {
        // Ignore if file doesn't exist
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Create new symlink
      await fs.promises.symlink(
        path.basename(this.currentFilename),
        symlinkPath,
        'file'
      );
    } catch (error) {
      console.error(`Error creating symlink: ${error.message}`);
      // Continue even if symlink creation fails
    }
  }

  /**
   * Ensures the log directory exists
   * @param dirname Directory path to ensure
   */
  private async ensureDirectoryExists(dirname: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirname, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Checks the current file size
   */
  private async checkFileSize(): Promise<void> {
    try {
      const stats = await fs.promises.stat(this.currentFilename);
      this.currentFileSize = stats.size;

      // Check if rotation is needed
      if (this.isSizeExceeded()) {
        await this.rotateFile();
      }
    } catch (error) {
      // File might not exist yet, which is fine
      if (error.code !== 'ENOENT') {
        throw error;
      }
      this.currentFileSize = 0;
    }
  }

  /**
   * Rotates the log file
   */
  private async rotateFile(): Promise<void> {
    // Close current file stream
    if (this.fileStream) {
      await new Promise<void>((resolve) => {
        this.fileStream!.end(() => {
          this.fileStream = null;
          resolve();
        });
      });
    }

    // Generate new filename for the current log file
    const rotatedFilename = this.getRotatedFilename();

    try {
      // Rename current file to rotated filename
      await fs.promises.rename(this.currentFilename, rotatedFilename);
    } catch (error) {
      // If the file doesn't exist, just create a new one
      if (error.code !== 'ENOENT') {
        console.error(`Error rotating log file: ${error.message}`);
      }
    }

    // Compress the rotated file if configured
    if (this.options.zippedArchive) {
      this.compressFile(rotatedFilename);
    }

    // Clean up old log files if maxFiles is set
    if (this.options.maxFiles > 0) {
      this.removeOldFiles();
    }

    // Update current filename and open new file
    this.currentFilename = this.getFilename();
    this.currentFileSize = 0;
    await this.openFile();
  }

  /**
   * Compresses a rotated log file
   * @param filename Path to the file to compress
   */
  private compressFile(filename: string): void {
    const gzipFilename = `${filename}.gz`;

    // Create read and write streams
    const readStream = fs.createReadStream(filename);
    const writeStream = fs.createWriteStream(gzipFilename);
    const gzipStream = zlib.createGzip();

    // Pipe the streams
    readStream.pipe(gzipStream).pipe(writeStream);

    // Handle completion
    writeStream.on('finish', () => {
      // Remove the original file after compression
      fs.unlink(filename, (err) => {
        if (err) {
          console.error(`Error removing original file after compression: ${err.message}`);
        }
      });
    });

    // Handle errors
    readStream.on('error', (err) => {
      console.error(`Error reading file for compression: ${err.message}`);
    });

    gzipStream.on('error', (err) => {
      console.error(`Error compressing file: ${err.message}`);
    });

    writeStream.on('error', (err) => {
      console.error(`Error writing compressed file: ${err.message}`);
    });
  }

  /**
   * Removes old log files based on maxFiles setting
   */
  private async removeOldFiles(): Promise<void> {
    try {
      // Get all log files in the directory
      const files = await fs.promises.readdir(this.options.dirname);
      const logFiles = files.filter(file => {
        // Filter to include only log files matching our pattern
        return file.startsWith(path.basename(this.options.filename)) && 
               file !== path.basename(this.currentFilename) &&
               file !== this.options.symlinkName;
      });

      // Sort files by creation time (oldest first)
      const fileStats = await Promise.all(
        logFiles.map(async (file) => {
          const filePath = path.join(this.options.dirname, file);
          const stats = await fs.promises.stat(filePath);
          return { file, path: filePath, ctime: stats.ctime };
        })
      );

      fileStats.sort((a, b) => a.ctime.getTime() - b.ctime.getTime());

      // Determine how many files to remove
      let maxFilesToKeep = typeof this.options.maxFiles === 'string' && 
                          this.options.maxFiles.endsWith('d')
        ? this.getMaxFilesByDays()
        : Number(this.options.maxFiles);

      // Remove excess files
      const filesToRemove = fileStats.slice(0, Math.max(0, fileStats.length - maxFilesToKeep));
      
      for (const file of filesToRemove) {
        await fs.promises.unlink(file.path);
      }
    } catch (error) {
      console.error(`Error removing old log files: ${error.message}`);
    }
  }

  /**
   * Calculates the maximum number of files to keep based on days
   */
  private getMaxFilesByDays(): number {
    if (typeof this.options.maxFiles !== 'string') {
      return Number(this.options.maxFiles);
    }

    // Parse days from string like '14d'
    const days = parseInt(this.options.maxFiles.slice(0, -1), 10);
    if (isNaN(days)) {
      return 0; // Default to no limit if parsing fails
    }

    // Estimate number of files per day based on rotation settings
    let filesPerDay = 1;
    if (this.options.datePattern) {
      // If using date pattern, assume 1 file per day unless pattern includes hours
      filesPerDay = this.options.datePattern.includes('HH') ? 24 : 1;
    } else if (this.shouldRotateBySize()) {
      // For size-based rotation, this is just an estimate
      filesPerDay = 10; // Arbitrary estimate
    }

    return days * filesPerDay;
  }

  /**
   * Gets the current log filename
   */
  private getFilename(): string {
    let filename = this.options.filename;
    
    // Add date pattern if configured
    if (this.options.datePattern) {
      const date = this.options.utc ? new Date(Date.now()) : new Date();
      const formattedDate = this.formatDate(date, this.options.datePattern);
      filename = filename.replace(/%DATE%/g, formattedDate);
    }
    
    // Add extension if configured
    if (this.options.extension && !filename.endsWith(this.options.extension)) {
      filename += this.options.extension;
    }
    
    // Ensure absolute path
    if (!path.isAbsolute(filename)) {
      filename = path.join(this.options.dirname, filename);
    }
    
    return filename;
  }

  /**
   * Gets the filename for a rotated log file
   */
  private getRotatedFilename(): string {
    const dirname = path.dirname(this.currentFilename);
    const basename = path.basename(this.currentFilename);
    const timestamp = this.formatDate(new Date(), 'YYYY-MM-DD-HHmmss');
    return path.join(dirname, `${basename}.${timestamp}`);
  }

  /**
   * Formats a date according to the specified pattern
   * @param date Date to format
   * @param pattern Format pattern
   */
  private formatDate(date: Date, pattern: string): string {
    // Simple date formatter - in a real implementation, you might use a library like date-fns
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return pattern
      .replace(/YYYY/g, String(year))
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds);
  }

  /**
   * Sets up time-based rotation
   */
  private setupTimeBasedRotation(): void {
    // Check every minute for time-based rotation
    this.rotationCheckInterval = setInterval(() => {
      if (this.isTimeToRotate()) {
        this.rotateFile().catch(err => {
          console.error(`Error during scheduled rotation: ${err.message}`);
        });
      }
    }, 60000); // Check every minute

    // Schedule the next rotation
    this.scheduleNextRotation();
  }

  /**
   * Schedules the next time-based rotation
   */
  private scheduleNextRotation(): void {
    if (!this.options.datePattern) {
      return;
    }

    const now = new Date();
    const nextRotationTime = this.getNextRotationTime(now);
    const delay = nextRotationTime.getTime() - now.getTime();

    if (delay > 0) {
      // Clear any existing timer
      if (this.rotationTimer) {
        clearTimeout(this.rotationTimer);
      }

      // Set timer for next rotation
      this.rotationTimer = setTimeout(() => {
        this.rotateFile().catch(err => {
          console.error(`Error during scheduled rotation: ${err.message}`);
        });
        this.scheduleNextRotation(); // Schedule the next rotation
      }, delay);
    }
  }

  /**
   * Calculates the next rotation time based on the date pattern
   * @param now Current date
   */
  private getNextRotationTime(now: Date): Date {
    const pattern = this.options.datePattern;
    const next = new Date(now);

    // Reset to start of day
    next.setHours(0, 0, 0, 0);

    // Add a day to get the next day
    next.setDate(next.getDate() + 1);

    // If pattern includes hours, adjust accordingly
    if (pattern.includes('HH')) {
      const hourMatch = pattern.match(/HH(\d{2})/i);
      if (hourMatch && hourMatch[1]) {
        const hour = parseInt(hourMatch[1], 10);
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          next.setHours(hour);
        }
      }
    }

    return next;
  }

  /**
   * Checks if it's time to rotate based on the date pattern
   */
  private isTimeToRotate(): boolean {
    if (!this.options.datePattern) {
      return false;
    }

    const now = this.options.utc ? new Date(Date.now()) : new Date();
    const currentDate = this.formatDate(now, this.options.datePattern);
    const fileDate = this.extractDateFromFilename();

    return currentDate !== fileDate;
  }

  /**
   * Extracts the date from the current filename
   */
  private extractDateFromFilename(): string {
    if (!this.options.datePattern) {
      return '';
    }

    const basename = path.basename(this.currentFilename);
    const dateMatch = basename.match(/%DATE%/g);
    if (dateMatch) {
      return dateMatch[0];
    }

    return '';
  }

  /**
   * Checks if size-based rotation is configured
   */
  private shouldRotateBySize(): boolean {
    return this.getMaxSize() > 0;
  }

  /**
   * Checks if time-based rotation is configured
   */
  private shouldRotateByTime(): boolean {
    return !!this.options.datePattern;
  }

  /**
   * Checks if the current file size exceeds the maximum size
   */
  private isSizeExceeded(): boolean {
    const maxSize = this.getMaxSize();
    return maxSize > 0 && this.currentFileSize >= maxSize;
  }

  /**
   * Gets the maximum file size in bytes
   */
  private getMaxSize(): number {
    const maxSize = this.options.maxSize;
    if (!maxSize) {
      return 0;
    }

    if (typeof maxSize === 'number') {
      return maxSize;
    }

    // Parse string like '10m' or '1g'
    const sizeRegex = /^(\d+)([kmg])$/i;
    const match = maxSize.match(sizeRegex);
    if (!match) {
      return parseInt(maxSize, 10) || 0;
    }

    const size = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'k': return size * 1024;
      case 'm': return size * 1024 * 1024;
      case 'g': return size * 1024 * 1024 * 1024;
      default: return size;
    }
  }
}