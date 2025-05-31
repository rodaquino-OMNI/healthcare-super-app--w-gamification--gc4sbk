/**
 * Mock implementation of Node.js fs module for testing file-dependent utilities
 * without accessing the actual filesystem.
 * 
 * This mock provides both synchronous and asynchronous versions of common fs functions
 * with configurable behavior and content. It maintains an in-memory representation of
 * the filesystem for testing file operations in isolation.
 */

import { EventEmitter } from 'events';
import * as path from 'path';

// Types for the mock filesystem
type MockFileContent = string | Buffer;
type MockFileStats = {
  isFile: () => boolean;
  isDirectory: () => boolean;
  isSymbolicLink: () => boolean;
  size: number;
  mtime: Date;
  ctime: Date;
  atime: Date;
  birthtime: Date;
  mode: number;
};

type MockFileSystem = {
  [path: string]: MockFileContent | MockFileSystem;
};

type MockFileOptions = {
  encoding?: BufferEncoding;
  flag?: string;
  mode?: number;
};

type MockDirOptions = {
  recursive?: boolean;
  mode?: number;
};

type JourneyConfig = {
  health?: { basePath: string; allowedExtensions: string[] };
  care?: { basePath: string; allowedExtensions: string[] };
  plan?: { basePath: string; allowedExtensions: string[] };
};

/**
 * Mock implementation of the Node.js fs module for testing
 */
class FSMock {
  private fileSystem: MockFileSystem = {};
  private errorFiles: Set<string> = new Set();
  private errorDirs: Set<string> = new Set();
  private journeyConfig: JourneyConfig = {};
  private defaultEncoding: BufferEncoding = 'utf8';
  private defaultMode: number = 0o666;
  private defaultDirMode: number = 0o777;

  /**
   * Initialize the mock filesystem with the provided structure
   * @param mockFileSystem - Object representing the mock filesystem structure
   */
  public init(mockFileSystem: MockFileSystem = {}): void {
    this.fileSystem = mockFileSystem;
  }

  /**
   * Reset the mock filesystem to an empty state
   */
  public reset(): void {
    this.fileSystem = {};
    this.errorFiles.clear();
    this.errorDirs.clear();
  }

  /**
   * Configure journey-specific file handling
   * @param config - Journey configuration object
   */
  public configureJourneys(config: JourneyConfig): void {
    this.journeyConfig = config;
  }

  /**
   * Configure a file to throw an error when accessed
   * @param filePath - Path to the file that should throw an error
   */
  public setErrorFile(filePath: string): void {
    this.errorFiles.add(path.normalize(filePath));
  }

  /**
   * Configure a directory to throw an error when accessed
   * @param dirPath - Path to the directory that should throw an error
   */
  public setErrorDirectory(dirPath: string): void {
    this.errorDirs.add(path.normalize(dirPath));
  }

  /**
   * Clear all configured error files and directories
   */
  public clearErrors(): void {
    this.errorFiles.clear();
    this.errorDirs.clear();
  }

  /**
   * Check if a path exists in the mock filesystem
   * @param filePath - Path to check
   * @returns True if the path exists, false otherwise
   */
  private pathExists(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    const parts = normalizedPath.split(path.sep).filter(Boolean);
    
    let current: any = this.fileSystem;
    
    for (const part of parts) {
      if (typeof current !== 'object' || current === null || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  /**
   * Get a file or directory from the mock filesystem
   * @param filePath - Path to the file or directory
   * @returns The file content or directory object
   */
  private getPath(filePath: string): MockFileContent | MockFileSystem | null {
    const normalizedPath = path.normalize(filePath);
    const parts = normalizedPath.split(path.sep).filter(Boolean);
    
    let current: any = this.fileSystem;
    
    for (const part of parts) {
      if (typeof current !== 'object' || current === null || !(part in current)) {
        return null;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Create a mock stats object for a file or directory
   * @param item - The file content or directory object
   * @returns A mock stats object
   */
  private createStats(item: MockFileContent | MockFileSystem): MockFileStats {
    const isFile = typeof item === 'string' || Buffer.isBuffer(item);
    const now = new Date();
    
    return {
      isFile: () => isFile,
      isDirectory: () => !isFile,
      isSymbolicLink: () => false,
      size: isFile ? (typeof item === 'string' ? Buffer.from(item).length : (item as Buffer).length) : 0,
      mtime: now,
      ctime: now,
      atime: now,
      birthtime: now,
      mode: isFile ? this.defaultMode : this.defaultDirMode
    };
  }

  /**
   * Check if a path should throw an error
   * @param filePath - Path to check
   * @throws Error if the path is configured to throw an error
   */
  private checkErrors(filePath: string): void {
    const normalizedPath = path.normalize(filePath);
    
    if (this.errorFiles.has(normalizedPath)) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    
    if (this.errorDirs.has(path.dirname(normalizedPath))) {
      throw new Error(`ENOENT: no such file or directory, scandir '${path.dirname(filePath)}'`);
    }
  }

  /**
   * Create parent directories for a file path
   * @param filePath - Path to create parent directories for
   */
  private createParentDirectories(filePath: string): void {
    const dirPath = path.dirname(filePath);
    const parts = dirPath.split(path.sep).filter(Boolean);
    
    let current: any = this.fileSystem;
    
    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {};
      } else if (typeof current[part] !== 'object' || Buffer.isBuffer(current[part])) {
        throw new Error(`ENOTDIR: not a directory, mkdir '${dirPath}'`);
      }
      current = current[part];
    }
  }

  /**
   * Set a file in the mock filesystem
   * @param filePath - Path to the file
   * @param content - Content of the file
   */
  private setFile(filePath: string, content: MockFileContent): void {
    const normalizedPath = path.normalize(filePath);
    const fileName = path.basename(normalizedPath);
    const dirPath = path.dirname(normalizedPath);
    
    this.createParentDirectories(normalizedPath);
    
    const dir = this.getPath(dirPath) as MockFileSystem;
    if (!dir || typeof dir !== 'object' || Buffer.isBuffer(dir)) {
      throw new Error(`ENOTDIR: not a directory, open '${filePath}'`);
    }
    
    (dir as any)[fileName] = content;
  }

  // Mock implementations of fs functions

  /**
   * Mock implementation of fs.readFile
   */
  public readFile(filePath: string, options: MockFileOptions | BufferEncoding, callback?: (err: Error | null, data: Buffer | string) => void): void {
    if (typeof options === 'function') {
      callback = options as any;
      options = { encoding: this.defaultEncoding };
    }
    
    if (typeof options === 'string') {
      options = { encoding: options };
    }

    const encoding = options.encoding;
    
    setTimeout(() => {
      try {
        this.checkErrors(filePath);
        
        const content = this.getPath(filePath);
        
        if (content === null) {
          return callback?.(new Error(`ENOENT: no such file or directory, open '${filePath}'`), null as any);
        }
        
        if (typeof content === 'object' && !Buffer.isBuffer(content)) {
          return callback?.(new Error(`EISDIR: illegal operation on a directory, read '${filePath}'`), null as any);
        }
        
        const data = Buffer.isBuffer(content) ? content : Buffer.from(content as string);
        callback?.(null, encoding ? data.toString(encoding) : data);
      } catch (err) {
        callback?.(err as Error, null as any);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.readFileSync
   */
  public readFileSync(filePath: string, options?: MockFileOptions | BufferEncoding): Buffer | string {
    this.checkErrors(filePath);
    
    if (typeof options === 'string') {
      options = { encoding: options };
    }
    
    const encoding = options?.encoding;
    
    const content = this.getPath(filePath);
    
    if (content === null) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    
    if (typeof content === 'object' && !Buffer.isBuffer(content)) {
      throw new Error(`EISDIR: illegal operation on a directory, read '${filePath}'`);
    }
    
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content as string);
    return encoding ? data.toString(encoding) : data;
  }

  /**
   * Mock implementation of fs.writeFile
   */
  public writeFile(filePath: string, data: string | Buffer, options: MockFileOptions | BufferEncoding, callback?: (err: Error | null) => void): void {
    if (typeof options === 'function') {
      callback = options as any;
      options = { encoding: this.defaultEncoding };
    }
    
    if (typeof options === 'string') {
      options = { encoding: options };
    }
    
    setTimeout(() => {
      try {
        this.checkErrors(filePath);
        this.setFile(filePath, data);
        callback?.(null);
      } catch (err) {
        callback?.(err as Error);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.writeFileSync
   */
  public writeFileSync(filePath: string, data: string | Buffer, options?: MockFileOptions | BufferEncoding): void {
    this.checkErrors(filePath);
    this.setFile(filePath, data);
  }

  /**
   * Mock implementation of fs.stat
   */
  public stat(filePath: string, callback: (err: Error | null, stats: MockFileStats) => void): void {
    setTimeout(() => {
      try {
        this.checkErrors(filePath);
        
        const item = this.getPath(filePath);
        
        if (item === null) {
          return callback(new Error(`ENOENT: no such file or directory, stat '${filePath}'`), null as any);
        }
        
        callback(null, this.createStats(item));
      } catch (err) {
        callback(err as Error, null as any);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.statSync
   */
  public statSync(filePath: string): MockFileStats {
    this.checkErrors(filePath);
    
    const item = this.getPath(filePath);
    
    if (item === null) {
      throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
    }
    
    return this.createStats(item);
  }

  /**
   * Mock implementation of fs.exists
   */
  public exists(filePath: string, callback: (exists: boolean) => void): void {
    setTimeout(() => {
      try {
        // exists() doesn't throw errors for error files/dirs
        callback(this.pathExists(filePath));
      } catch (err) {
        // Ignore errors and return false
        callback(false);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.existsSync
   */
  public existsSync(filePath: string): boolean {
    try {
      // existsSync() doesn't throw errors for error files/dirs
      return this.pathExists(filePath);
    } catch (err) {
      // Ignore errors and return false
      return false;
    }
  }

  /**
   * Mock implementation of fs.mkdir
   */
  public mkdir(dirPath: string, options: MockDirOptions | number, callback?: (err: Error | null) => void): void {
    if (typeof options === 'function') {
      callback = options as any;
      options = { mode: this.defaultDirMode };
    }
    
    if (typeof options === 'number') {
      options = { mode: options };
    }
    
    const recursive = options.recursive || false;
    
    setTimeout(() => {
      try {
        this.checkErrors(dirPath);
        
        if (this.pathExists(dirPath)) {
          return callback?.(new Error(`EEXIST: file already exists, mkdir '${dirPath}'`));
        }
        
        if (!recursive && !this.pathExists(path.dirname(dirPath))) {
          return callback?.(new Error(`ENOENT: no such file or directory, mkdir '${dirPath}'`));
        }
        
        const parts = dirPath.split(path.sep).filter(Boolean);
        let current: any = this.fileSystem;
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          
          if (!(part in current)) {
            current[part] = {};
          } else if (typeof current[part] !== 'object' || Buffer.isBuffer(current[part])) {
            return callback?.(new Error(`ENOTDIR: not a directory, mkdir '${dirPath}'`));
          }
          
          current = current[part];
        }
        
        callback?.(null);
      } catch (err) {
        callback?.(err as Error);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.mkdirSync
   */
  public mkdirSync(dirPath: string, options?: MockDirOptions | number): void {
    if (typeof options === 'number') {
      options = { mode: options };
    }
    
    const recursive = options?.recursive || false;
    
    this.checkErrors(dirPath);
    
    if (this.pathExists(dirPath)) {
      throw new Error(`EEXIST: file already exists, mkdir '${dirPath}'`);
    }
    
    if (!recursive && !this.pathExists(path.dirname(dirPath))) {
      throw new Error(`ENOENT: no such file or directory, mkdir '${dirPath}'`);
    }
    
    const parts = dirPath.split(path.sep).filter(Boolean);
    let current: any = this.fileSystem;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (!(part in current)) {
        current[part] = {};
      } else if (typeof current[part] !== 'object' || Buffer.isBuffer(current[part])) {
        throw new Error(`ENOTDIR: not a directory, mkdir '${dirPath}'`);
      }
      
      current = current[part];
    }
  }

  /**
   * Mock implementation of fs.readdir
   */
  public readdir(dirPath: string, options: { encoding?: BufferEncoding } | BufferEncoding, callback?: (err: Error | null, files: string[]) => void): void {
    if (typeof options === 'function') {
      callback = options as any;
      options = { encoding: this.defaultEncoding };
    }
    
    if (typeof options === 'string') {
      options = { encoding: options };
    }
    
    setTimeout(() => {
      try {
        this.checkErrors(dirPath);
        
        const dir = this.getPath(dirPath);
        
        if (dir === null) {
          return callback?.(new Error(`ENOENT: no such file or directory, scandir '${dirPath}'`), null as any);
        }
        
        if (typeof dir === 'string' || Buffer.isBuffer(dir)) {
          return callback?.(new Error(`ENOTDIR: not a directory, scandir '${dirPath}'`), null as any);
        }
        
        const files = Object.keys(dir);
        callback?.(null, files);
      } catch (err) {
        callback?.(err as Error, null as any);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.readdirSync
   */
  public readdirSync(dirPath: string, options?: { encoding?: BufferEncoding } | BufferEncoding): string[] {
    this.checkErrors(dirPath);
    
    const dir = this.getPath(dirPath);
    
    if (dir === null) {
      throw new Error(`ENOENT: no such file or directory, scandir '${dirPath}'`);
    }
    
    if (typeof dir === 'string' || Buffer.isBuffer(dir)) {
      throw new Error(`ENOTDIR: not a directory, scandir '${dirPath}'`);
    }
    
    return Object.keys(dir);
  }

  /**
   * Mock implementation of fs.unlink
   */
  public unlink(filePath: string, callback: (err: Error | null) => void): void {
    setTimeout(() => {
      try {
        this.checkErrors(filePath);
        
        const item = this.getPath(filePath);
        
        if (item === null) {
          return callback(new Error(`ENOENT: no such file or directory, unlink '${filePath}'`));
        }
        
        if (typeof item === 'object' && !Buffer.isBuffer(item)) {
          return callback(new Error(`EISDIR: illegal operation on a directory, unlink '${filePath}'`));
        }
        
        const dirPath = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const dir = this.getPath(dirPath) as MockFileSystem;
        
        if (dir && typeof dir === 'object' && !Buffer.isBuffer(dir)) {
          delete (dir as any)[fileName];
        }
        
        callback(null);
      } catch (err) {
        callback(err as Error);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.unlinkSync
   */
  public unlinkSync(filePath: string): void {
    this.checkErrors(filePath);
    
    const item = this.getPath(filePath);
    
    if (item === null) {
      throw new Error(`ENOENT: no such file or directory, unlink '${filePath}'`);
    }
    
    if (typeof item === 'object' && !Buffer.isBuffer(item)) {
      throw new Error(`EISDIR: illegal operation on a directory, unlink '${filePath}'`);
    }
    
    const dirPath = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const dir = this.getPath(dirPath) as MockFileSystem;
    
    if (dir && typeof dir === 'object' && !Buffer.isBuffer(dir)) {
      delete (dir as any)[fileName];
    }
  }

  /**
   * Mock implementation of fs.rmdir
   */
  public rmdir(dirPath: string, callback: (err: Error | null) => void): void {
    setTimeout(() => {
      try {
        this.checkErrors(dirPath);
        
        const dir = this.getPath(dirPath);
        
        if (dir === null) {
          return callback(new Error(`ENOENT: no such file or directory, rmdir '${dirPath}'`));
        }
        
        if (typeof dir === 'string' || Buffer.isBuffer(dir)) {
          return callback(new Error(`ENOTDIR: not a directory, rmdir '${dirPath}'`));
        }
        
        if (Object.keys(dir).length > 0) {
          return callback(new Error(`ENOTEMPTY: directory not empty, rmdir '${dirPath}'`));
        }
        
        const parentPath = path.dirname(dirPath);
        const dirName = path.basename(dirPath);
        const parent = this.getPath(parentPath) as MockFileSystem;
        
        if (parent && typeof parent === 'object' && !Buffer.isBuffer(parent)) {
          delete (parent as any)[dirName];
        }
        
        callback(null);
      } catch (err) {
        callback(err as Error);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.rmdirSync
   */
  public rmdirSync(dirPath: string): void {
    this.checkErrors(dirPath);
    
    const dir = this.getPath(dirPath);
    
    if (dir === null) {
      throw new Error(`ENOENT: no such file or directory, rmdir '${dirPath}'`);
    }
    
    if (typeof dir === 'string' || Buffer.isBuffer(dir)) {
      throw new Error(`ENOTDIR: not a directory, rmdir '${dirPath}'`);
    }
    
    if (Object.keys(dir).length > 0) {
      throw new Error(`ENOTEMPTY: directory not empty, rmdir '${dirPath}'`);
    }
    
    const parentPath = path.dirname(dirPath);
    const dirName = path.basename(dirPath);
    const parent = this.getPath(parentPath) as MockFileSystem;
    
    if (parent && typeof parent === 'object' && !Buffer.isBuffer(parent)) {
      delete (parent as any)[dirName];
    }
  }

  /**
   * Mock implementation of fs.createReadStream
   */
  public createReadStream(filePath: string, options?: { encoding?: BufferEncoding; start?: number; end?: number }): EventEmitter {
    const emitter = new EventEmitter();
    
    setTimeout(() => {
      try {
        this.checkErrors(filePath);
        
        const content = this.getPath(filePath);
        
        if (content === null) {
          const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
          (error as any).code = 'ENOENT';
          emitter.emit('error', error);
          return;
        }
        
        if (typeof content === 'object' && !Buffer.isBuffer(content)) {
          const error = new Error(`EISDIR: illegal operation on a directory, read '${filePath}'`);
          (error as any).code = 'EISDIR';
          emitter.emit('error', error);
          return;
        }
        
        const data = Buffer.isBuffer(content) ? content : Buffer.from(content as string);
        const start = options?.start || 0;
        const end = options?.end !== undefined ? options.end : data.length - 1;
        
        const chunk = data.slice(start, end + 1);
        
        if (options?.encoding) {
          emitter.emit('data', chunk.toString(options.encoding));
        } else {
          emitter.emit('data', chunk);
        }
        
        emitter.emit('end');
        emitter.emit('close');
      } catch (err) {
        emitter.emit('error', err);
      }
    }, 0);
    
    return emitter;
  }

  /**
   * Mock implementation of fs.createWriteStream
   */
  public createWriteStream(filePath: string): EventEmitter {
    const emitter = new EventEmitter();
    let data: Buffer[] = [];
    
    // Add write method to the emitter
    (emitter as any).write = (chunk: string | Buffer, encoding?: BufferEncoding): boolean => {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk;
      data.push(buffer);
      return true;
    };
    
    // Add end method to the emitter
    (emitter as any).end = (chunk?: string | Buffer, encoding?: BufferEncoding): void => {
      if (chunk) {
        const buffer = typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk;
        data.push(buffer);
      }
      
      try {
        this.checkErrors(filePath);
        this.setFile(filePath, Buffer.concat(data));
        emitter.emit('finish');
        emitter.emit('close');
      } catch (err) {
        emitter.emit('error', err);
      }
    };
    
    setTimeout(() => {
      try {
        this.checkErrors(filePath);
        emitter.emit('open');
      } catch (err) {
        emitter.emit('error', err);
      }
    }, 0);
    
    return emitter;
  }

  /**
   * Mock implementation of fs.access
   */
  public access(filePath: string, mode: number | undefined, callback?: (err: Error | null) => void): void {
    if (typeof mode === 'function') {
      callback = mode as any;
      mode = undefined;
    }
    
    setTimeout(() => {
      try {
        this.checkErrors(filePath);
        
        const item = this.getPath(filePath);
        
        if (item === null) {
          return callback?.(new Error(`ENOENT: no such file or directory, access '${filePath}'`));
        }
        
        // In a real implementation, we would check the mode against file permissions
        // For simplicity, we just check existence
        
        callback?.(null);
      } catch (err) {
        callback?.(err as Error);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.accessSync
   */
  public accessSync(filePath: string, mode?: number): void {
    this.checkErrors(filePath);
    
    const item = this.getPath(filePath);
    
    if (item === null) {
      throw new Error(`ENOENT: no such file or directory, access '${filePath}'`);
    }
    
    // In a real implementation, we would check the mode against file permissions
    // For simplicity, we just check existence
  }

  /**
   * Mock implementation of fs.copyFile
   */
  public copyFile(src: string, dest: string, flags: number | undefined, callback?: (err: Error | null) => void): void {
    if (typeof flags === 'function') {
      callback = flags as any;
      flags = 0;
    }
    
    setTimeout(() => {
      try {
        this.checkErrors(src);
        this.checkErrors(dest);
        
        const content = this.getPath(src);
        
        if (content === null) {
          return callback?.(new Error(`ENOENT: no such file or directory, copyfile '${src}'`));
        }
        
        if (typeof content === 'object' && !Buffer.isBuffer(content)) {
          return callback?.(new Error(`EISDIR: illegal operation on a directory, copyfile '${src}'`));
        }
        
        // Check if destination exists and COPYFILE_EXCL flag is set
        if ((flags || 0) & 1 && this.pathExists(dest)) {
          return callback?.(new Error(`EEXIST: file already exists, copyfile '${dest}'`));
        }
        
        this.setFile(dest, content);
        callback?.(null);
      } catch (err) {
        callback?.(err as Error);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.copyFileSync
   */
  public copyFileSync(src: string, dest: string, flags?: number): void {
    this.checkErrors(src);
    this.checkErrors(dest);
    
    const content = this.getPath(src);
    
    if (content === null) {
      throw new Error(`ENOENT: no such file or directory, copyfile '${src}'`);
    }
    
    if (typeof content === 'object' && !Buffer.isBuffer(content)) {
      throw new Error(`EISDIR: illegal operation on a directory, copyfile '${src}'`);
    }
    
    // Check if destination exists and COPYFILE_EXCL flag is set
    if ((flags || 0) & 1 && this.pathExists(dest)) {
      throw new Error(`EEXIST: file already exists, copyfile '${dest}'`);
    }
    
    this.setFile(dest, content);
  }

  /**
   * Mock implementation of fs.rename
   */
  public rename(oldPath: string, newPath: string, callback: (err: Error | null) => void): void {
    setTimeout(() => {
      try {
        this.checkErrors(oldPath);
        this.checkErrors(newPath);
        
        const content = this.getPath(oldPath);
        
        if (content === null) {
          return callback(new Error(`ENOENT: no such file or directory, rename '${oldPath}'`));
        }
        
        // Copy the content to the new path
        if (typeof content === 'string' || Buffer.isBuffer(content)) {
          this.setFile(newPath, content);
        } else {
          // For directories, we would need to recursively copy
          // For simplicity, we don't support directory renaming in this mock
          return callback(new Error(`EISDIR: illegal operation on a directory, rename '${oldPath}'`));
        }
        
        // Remove the old path
        this.unlinkSync(oldPath);
        
        callback(null);
      } catch (err) {
        callback(err as Error);
      }
    }, 0);
  }

  /**
   * Mock implementation of fs.renameSync
   */
  public renameSync(oldPath: string, newPath: string): void {
    this.checkErrors(oldPath);
    this.checkErrors(newPath);
    
    const content = this.getPath(oldPath);
    
    if (content === null) {
      throw new Error(`ENOENT: no such file or directory, rename '${oldPath}'`);
    }
    
    // Copy the content to the new path
    if (typeof content === 'string' || Buffer.isBuffer(content)) {
      this.setFile(newPath, content);
    } else {
      // For directories, we would need to recursively copy
      // For simplicity, we don't support directory renaming in this mock
      throw new Error(`EISDIR: illegal operation on a directory, rename '${oldPath}'`);
    }
    
    // Remove the old path
    this.unlinkSync(oldPath);
  }

  /**
   * Helper method to create a journey-specific file path
   * @param journey - The journey name ('health', 'care', or 'plan')
   * @param relativePath - The relative path within the journey
   * @returns The full path to the file
   */
  public getJourneyPath(journey: 'health' | 'care' | 'plan', relativePath: string): string {
    const config = this.journeyConfig[journey];
    
    if (!config) {
      throw new Error(`Journey '${journey}' is not configured`);
    }
    
    return path.join(config.basePath, relativePath);
  }

  /**
   * Helper method to check if a file extension is allowed for a journey
   * @param journey - The journey name ('health', 'care', or 'plan')
   * @param filePath - The path to the file
   * @returns True if the file extension is allowed, false otherwise
   */
  public isJourneyFileAllowed(journey: 'health' | 'care' | 'plan', filePath: string): boolean {
    const config = this.journeyConfig[journey];
    
    if (!config) {
      return false;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    return config.allowedExtensions.includes(ext);
  }
}

// Create and export a singleton instance
const fsMock = new FSMock();

// Export the mock as a drop-in replacement for the fs module
export default {
  // Core fs functions
  readFile: fsMock.readFile.bind(fsMock),
  readFileSync: fsMock.readFileSync.bind(fsMock),
  writeFile: fsMock.writeFile.bind(fsMock),
  writeFileSync: fsMock.writeFileSync.bind(fsMock),
  stat: fsMock.stat.bind(fsMock),
  statSync: fsMock.statSync.bind(fsMock),
  exists: fsMock.exists.bind(fsMock),
  existsSync: fsMock.existsSync.bind(fsMock),
  mkdir: fsMock.mkdir.bind(fsMock),
  mkdirSync: fsMock.mkdirSync.bind(fsMock),
  readdir: fsMock.readdir.bind(fsMock),
  readdirSync: fsMock.readdirSync.bind(fsMock),
  unlink: fsMock.unlink.bind(fsMock),
  unlinkSync: fsMock.unlinkSync.bind(fsMock),
  rmdir: fsMock.rmdir.bind(fsMock),
  rmdirSync: fsMock.rmdirSync.bind(fsMock),
  createReadStream: fsMock.createReadStream.bind(fsMock),
  createWriteStream: fsMock.createWriteStream.bind(fsMock),
  access: fsMock.access.bind(fsMock),
  accessSync: fsMock.accessSync.bind(fsMock),
  copyFile: fsMock.copyFile.bind(fsMock),
  copyFileSync: fsMock.copyFileSync.bind(fsMock),
  rename: fsMock.rename.bind(fsMock),
  renameSync: fsMock.renameSync.bind(fsMock),
  
  // Mock control functions
  __setMockFiles: fsMock.init.bind(fsMock),
  __reset: fsMock.reset.bind(fsMock),
  __configureJourneys: fsMock.configureJourneys.bind(fsMock),
  __setErrorFile: fsMock.setErrorFile.bind(fsMock),
  __setErrorDirectory: fsMock.setErrorDirectory.bind(fsMock),
  __clearErrors: fsMock.clearErrors.bind(fsMock),
  __getJourneyPath: fsMock.getJourneyPath.bind(fsMock),
  __isJourneyFileAllowed: fsMock.isJourneyFileAllowed.bind(fsMock),
  
  // Constants
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
    COPYFILE_EXCL: 1,
    COPYFILE_FICLONE: 2,
    COPYFILE_FICLONE_FORCE: 4,
  },
  
  // Promises API (simplified version)
  promises: {
    readFile: (filePath: string, options?: any) => {
      return new Promise((resolve, reject) => {
        fsMock.readFile(filePath, options as any, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
    },
    writeFile: (filePath: string, data: string | Buffer, options?: any) => {
      return new Promise((resolve, reject) => {
        fsMock.writeFile(filePath, data, options as any, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    },
    stat: (filePath: string) => {
      return new Promise((resolve, reject) => {
        fsMock.stat(filePath, (err, stats) => {
          if (err) reject(err);
          else resolve(stats);
        });
      });
    },
    mkdir: (dirPath: string, options?: any) => {
      return new Promise((resolve, reject) => {
        fsMock.mkdir(dirPath, options as any, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    },
    readdir: (dirPath: string, options?: any) => {
      return new Promise((resolve, reject) => {
        fsMock.readdir(dirPath, options as any, (err, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });
    },
    unlink: (filePath: string) => {
      return new Promise((resolve, reject) => {
        fsMock.unlink(filePath, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    },
    rmdir: (dirPath: string) => {
      return new Promise((resolve, reject) => {
        fsMock.rmdir(dirPath, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    },
    access: (filePath: string, mode?: number) => {
      return new Promise((resolve, reject) => {
        fsMock.access(filePath, mode, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    },
    copyFile: (src: string, dest: string, flags?: number) => {
      return new Promise((resolve, reject) => {
        fsMock.copyFile(src, dest, flags as any, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    },
    rename: (oldPath: string, newPath: string) => {
      return new Promise((resolve, reject) => {
        fsMock.rename(oldPath, newPath, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    },
  },
};

// Export the FSMock class for advanced usage
export { FSMock, MockFileSystem, MockFileContent, MockFileStats, JourneyConfig };