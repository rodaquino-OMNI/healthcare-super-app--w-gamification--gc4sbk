/**
 * @file fs-mock.ts
 * @description Mock implementation of Node.js fs module for testing file-dependent utilities
 * without accessing the actual filesystem. Provides configurable behavior for file operations
 * and an in-memory filesystem simulation.
 */

import { EventEmitter } from 'events';
import * as path from 'path';

/**
 * Interface for mock file system entry (file or directory)
 */
interface MockFsEntry {
  type: 'file' | 'directory';
  content?: string | Buffer;
  mode?: number;
  mtime?: Date;
  ctime?: Date;
  atime?: Date;
  size?: number;
}

/**
 * Interface for mock file system structure
 */
interface MockFileSystem {
  [path: string]: MockFsEntry;
}

/**
 * Interface for configurable error behavior
 */
interface ErrorConfig {
  operation: string;
  path?: string | RegExp;
  code?: string;
  message?: string;
  errno?: number;
  trigger?: () => boolean;
}

/**
 * Interface for journey-specific file configurations
 */
interface JourneyFileConfig {
  journey: 'health' | 'care' | 'plan' | 'common';
  basePath: string;
  templates: Record<string, string | Buffer>;
  defaultPermissions?: number;
}

/**
 * Mock implementation of Node.js fs module
 */
export class FsMock {
  private fileSystem: MockFileSystem = {};
  private errorConfigs: ErrorConfig[] = [];
  private journeyConfigs: JourneyFileConfig[] = [];
  private defaultMode = 0o666;
  private defaultDirMode = 0o777;
  private currentTime = new Date();

  constructor() {
    this.reset();
  }

  /**
   * Reset the mock filesystem to empty state
   */
  public reset(): void {
    this.fileSystem = {};
    this.errorConfigs = [];
    this.journeyConfigs = [];
    this.currentTime = new Date();
  }

  /**
   * Initialize the mock filesystem with the given structure
   * @param structure - Object representing the file system structure
   */
  public init(structure: Record<string, string | Buffer | MockFsEntry>): void {
    Object.keys(structure).forEach((filePath) => {
      const normalizedPath = this.normalizePath(filePath);
      const entry = structure[filePath];

      if (typeof entry === 'string' || Buffer.isBuffer(entry)) {
        this.fileSystem[normalizedPath] = {
          type: 'file',
          content: entry,
          mode: this.defaultMode,
          mtime: new Date(this.currentTime),
          ctime: new Date(this.currentTime),
          atime: new Date(this.currentTime),
          size: typeof entry === 'string' ? Buffer.from(entry).length : entry.length,
        };
      } else {
        this.fileSystem[normalizedPath] = {
          ...entry,
          mtime: entry.mtime || new Date(this.currentTime),
          ctime: entry.ctime || new Date(this.currentTime),
          atime: entry.atime || new Date(this.currentTime),
          mode: entry.mode || (entry.type === 'directory' ? this.defaultDirMode : this.defaultMode),
        };
      }

      // Create parent directories if they don't exist
      let dirPath = path.dirname(normalizedPath);
      while (dirPath !== '/' && dirPath !== '.') {
        if (!this.fileSystem[dirPath]) {
          this.fileSystem[dirPath] = {
            type: 'directory',
            mode: this.defaultDirMode,
            mtime: new Date(this.currentTime),
            ctime: new Date(this.currentTime),
            atime: new Date(this.currentTime),
          };
        }
        dirPath = path.dirname(dirPath);
      }
    });
  }

  /**
   * Configure error behavior for specific operations
   * @param errorConfigs - Array of error configurations
   */
  public setErrors(errorConfigs: ErrorConfig[]): void {
    this.errorConfigs = errorConfigs;
  }

  /**
   * Add a single error configuration
   * @param errorConfig - Error configuration
   */
  public addError(errorConfig: ErrorConfig): void {
    this.errorConfigs.push(errorConfig);
  }

  /**
   * Configure journey-specific file templates
   * @param journeyConfigs - Array of journey configurations
   */
  public setJourneyConfigs(journeyConfigs: JourneyFileConfig[]): void {
    this.journeyConfigs = journeyConfigs;
    
    // Initialize journey template files
    this.journeyConfigs.forEach(config => {
      Object.keys(config.templates).forEach(templateName => {
        const filePath = path.join(config.basePath, templateName);
        const content = config.templates[templateName];
        
        this.fileSystem[this.normalizePath(filePath)] = {
          type: 'file',
          content,
          mode: config.defaultPermissions || this.defaultMode,
          mtime: new Date(this.currentTime),
          ctime: new Date(this.currentTime),
          atime: new Date(this.currentTime),
          size: typeof content === 'string' ? Buffer.from(content).length : content.length,
        };
      });
    });
  }

  /**
   * Check if an error should be triggered for an operation
   * @param operation - The file operation name
   * @param filePath - The file path for the operation
   * @returns Error object if an error should be triggered, undefined otherwise
   */
  private getError(operation: string, filePath: string): Error | undefined {
    const errorConfig = this.errorConfigs.find(config => {
      if (config.operation !== operation) return false;
      
      if (config.path) {
        if (typeof config.path === 'string') {
          if (config.path !== filePath) return false;
        } else if (config.path instanceof RegExp) {
          if (!config.path.test(filePath)) return false;
        }
      }
      
      if (config.trigger && !config.trigger()) return false;
      
      return true;
    });

    if (errorConfig) {
      const error = new Error(errorConfig.message || `MOCKED ${operation.toUpperCase()} ERROR`);
      (error as any).code = errorConfig.code || 'ENOENT';
      (error as any).errno = errorConfig.errno || -2;
      (error as any).path = filePath;
      return error;
    }

    return undefined;
  }

  /**
   * Normalize a file path
   * @param filePath - The file path to normalize
   * @returns Normalized path
   */
  private normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Get a file entry from the mock filesystem
   * @param filePath - The file path
   * @returns The file entry or undefined if not found
   */
  private getEntry(filePath: string): MockFsEntry | undefined {
    const normalizedPath = this.normalizePath(filePath);
    return this.fileSystem[normalizedPath];
  }

  /**
   * Create a mock implementation of fs.readFile
   */
  public readFile = jest.fn((filePath: string, options: any, callback?: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = { encoding: null, flag: 'r' };
    } else if (typeof options === 'string') {
      options = { encoding: options, flag: 'r' };
    } else if (options === undefined) {
      options = { encoding: null, flag: 'r' };
    }

    const normalizedPath = this.normalizePath(filePath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('readFile', normalizedPath);
      if (error) {
        return callback(error);
      }

      const entry = this.getEntry(normalizedPath);
      if (!entry) {
        const notFoundError = new Error(`ENOENT: no such file or directory, open '${normalizedPath}'`);
        (notFoundError as any).code = 'ENOENT';
        (notFoundError as any).errno = -2;
        (notFoundError as any).path = normalizedPath;
        return callback(notFoundError);
      }

      if (entry.type !== 'file') {
        const isDirectoryError = new Error(`EISDIR: illegal operation on a directory, read '${normalizedPath}'`);
        (isDirectoryError as any).code = 'EISDIR';
        (isDirectoryError as any).errno = -21;
        (isDirectoryError as any).path = normalizedPath;
        return callback(isDirectoryError);
      }

      let content = entry.content;
      if (!content) {
        content = '';
      }

      // Update access time
      entry.atime = new Date();

      if (options.encoding) {
        if (typeof content === 'string') {
          return callback(null, content);
        } else {
          return callback(null, content.toString(options.encoding));
        }
      } else {
        if (typeof content === 'string') {
          return callback(null, Buffer.from(content));
        } else {
          return callback(null, content);
        }
      }
    });
  });

  /**
   * Create a mock implementation of fs.readFileSync
   */
  public readFileSync = jest.fn((filePath: string, options?: any) => {
    if (typeof options === 'string') {
      options = { encoding: options, flag: 'r' };
    } else if (options === undefined) {
      options = { encoding: null, flag: 'r' };
    }

    const normalizedPath = this.normalizePath(filePath);
    
    const error = this.getError('readFileSync', normalizedPath);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedPath);
    if (!entry) {
      const notFoundError = new Error(`ENOENT: no such file or directory, open '${normalizedPath}'`);
      (notFoundError as any).code = 'ENOENT';
      (notFoundError as any).errno = -2;
      (notFoundError as any).path = normalizedPath;
      throw notFoundError;
    }

    if (entry.type !== 'file') {
      const isDirectoryError = new Error(`EISDIR: illegal operation on a directory, read '${normalizedPath}'`);
      (isDirectoryError as any).code = 'EISDIR';
      (isDirectoryError as any).errno = -21;
      (isDirectoryError as any).path = normalizedPath;
      throw isDirectoryError;
    }

    let content = entry.content;
    if (!content) {
      content = '';
    }

    // Update access time
    entry.atime = new Date();

    if (options.encoding) {
      if (typeof content === 'string') {
        return content;
      } else {
        return content.toString(options.encoding);
      }
    } else {
      if (typeof content === 'string') {
        return Buffer.from(content);
      } else {
        return content;
      }
    }
  });

  /**
   * Create a mock implementation of fs.writeFile
   */
  public writeFile = jest.fn((filePath: string, data: string | Buffer, options: any, callback?: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = { encoding: 'utf8', mode: this.defaultMode, flag: 'w' };
    } else if (typeof options === 'string') {
      options = { encoding: options, mode: this.defaultMode, flag: 'w' };
    } else if (options === undefined) {
      options = { encoding: 'utf8', mode: this.defaultMode, flag: 'w' };
    }

    const normalizedPath = this.normalizePath(filePath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('writeFile', normalizedPath);
      if (error) {
        return callback(error);
      }

      // Create parent directories if they don't exist
      const dirPath = path.dirname(normalizedPath);
      if (dirPath !== '/' && dirPath !== '.') {
        try {
          this.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
          if ((err as any).code !== 'EEXIST') {
            return callback(err);
          }
        }
      }

      const now = new Date();
      this.fileSystem[normalizedPath] = {
        type: 'file',
        content: data,
        mode: options.mode,
        mtime: now,
        ctime: now,
        atime: now,
        size: typeof data === 'string' ? Buffer.from(data).length : data.length,
      };

      return callback(null);
    });
  });

  /**
   * Create a mock implementation of fs.writeFileSync
   */
  public writeFileSync = jest.fn((filePath: string, data: string | Buffer, options?: any) => {
    if (typeof options === 'string') {
      options = { encoding: options, mode: this.defaultMode, flag: 'w' };
    } else if (options === undefined) {
      options = { encoding: 'utf8', mode: this.defaultMode, flag: 'w' };
    }

    const normalizedPath = this.normalizePath(filePath);
    
    const error = this.getError('writeFileSync', normalizedPath);
    if (error) {
      throw error;
    }

    // Create parent directories if they don't exist
    const dirPath = path.dirname(normalizedPath);
    if (dirPath !== '/' && dirPath !== '.') {
      try {
        this.mkdirSync(dirPath, { recursive: true });
      } catch (err) {
        if ((err as any).code !== 'EEXIST') {
          throw err;
        }
      }
    }

    const now = new Date();
    this.fileSystem[normalizedPath] = {
      type: 'file',
      content: data,
      mode: options.mode,
      mtime: now,
      ctime: now,
      atime: now,
      size: typeof data === 'string' ? Buffer.from(data).length : data.length,
    };
  });

  /**
   * Create a mock implementation of fs.stat
   */
  public stat = jest.fn((filePath: string, callback: any) => {
    const normalizedPath = this.normalizePath(filePath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('stat', normalizedPath);
      if (error) {
        return callback(error);
      }

      const entry = this.getEntry(normalizedPath);
      if (!entry) {
        const notFoundError = new Error(`ENOENT: no such file or directory, stat '${normalizedPath}'`);
        (notFoundError as any).code = 'ENOENT';
        (notFoundError as any).errno = -2;
        (notFoundError as any).path = normalizedPath;
        return callback(notFoundError);
      }

      const stats = this.createStats(entry);
      return callback(null, stats);
    });
  });

  /**
   * Create a mock implementation of fs.statSync
   */
  public statSync = jest.fn((filePath: string) => {
    const normalizedPath = this.normalizePath(filePath);
    
    const error = this.getError('statSync', normalizedPath);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedPath);
    if (!entry) {
      const notFoundError = new Error(`ENOENT: no such file or directory, stat '${normalizedPath}'`);
      (notFoundError as any).code = 'ENOENT';
      (notFoundError as any).errno = -2;
      (notFoundError as any).path = normalizedPath;
      throw notFoundError;
    }

    return this.createStats(entry);
  });

  /**
   * Create a mock implementation of fs.exists
   */
  public exists = jest.fn((filePath: string, callback: any) => {
    const normalizedPath = this.normalizePath(filePath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('exists', normalizedPath);
      if (error) {
        // exists() is special and doesn't pass errors to the callback
        return callback(false);
      }

      const exists = !!this.getEntry(normalizedPath);
      return callback(exists);
    });
  });

  /**
   * Create a mock implementation of fs.existsSync
   */
  public existsSync = jest.fn((filePath: string) => {
    const normalizedPath = this.normalizePath(filePath);
    
    const error = this.getError('existsSync', normalizedPath);
    if (error) {
      // existsSync() is special and doesn't throw errors
      return false;
    }

    return !!this.getEntry(normalizedPath);
  });

  /**
   * Create a mock implementation of fs.mkdir
   */
  public mkdir = jest.fn((dirPath: string, options: any, callback?: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = { mode: this.defaultDirMode, recursive: false };
    } else if (typeof options === 'number') {
      options = { mode: options, recursive: false };
    } else if (options === undefined) {
      options = { mode: this.defaultDirMode, recursive: false };
    }

    const normalizedPath = this.normalizePath(dirPath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('mkdir', normalizedPath);
      if (error) {
        return callback(error);
      }

      try {
        this.mkdirSync(normalizedPath, options);
        return callback(null);
      } catch (err) {
        return callback(err);
      }
    });
  });

  /**
   * Create a mock implementation of fs.mkdirSync
   */
  public mkdirSync = jest.fn((dirPath: string, options?: any) => {
    if (typeof options === 'number') {
      options = { mode: options, recursive: false };
    } else if (options === undefined) {
      options = { mode: this.defaultDirMode, recursive: false };
    }

    const normalizedPath = this.normalizePath(dirPath);
    
    const error = this.getError('mkdirSync', normalizedPath);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedPath);
    if (entry) {
      if (options.recursive) {
        return;
      }
      const existsError = new Error(`EEXIST: file already exists, mkdir '${normalizedPath}'`);
      (existsError as any).code = 'EEXIST';
      (existsError as any).errno = -17;
      (existsError as any).path = normalizedPath;
      throw existsError;
    }

    // Create parent directories if recursive
    if (options.recursive) {
      const parentDir = path.dirname(normalizedPath);
      if (parentDir !== normalizedPath && parentDir !== '/' && parentDir !== '.') {
        try {
          this.mkdirSync(parentDir, { mode: options.mode, recursive: true });
        } catch (err) {
          if ((err as any).code !== 'EEXIST') {
            throw err;
          }
        }
      }
    } else {
      // Check if parent directory exists
      const parentDir = path.dirname(normalizedPath);
      if (parentDir !== normalizedPath && parentDir !== '/' && parentDir !== '.') {
        const parentEntry = this.getEntry(parentDir);
        if (!parentEntry) {
          const noEntryError = new Error(`ENOENT: no such file or directory, mkdir '${normalizedPath}'`);
          (noEntryError as any).code = 'ENOENT';
          (noEntryError as any).errno = -2;
          (noEntryError as any).path = normalizedPath;
          throw noEntryError;
        }
      }
    }

    const now = new Date();
    this.fileSystem[normalizedPath] = {
      type: 'directory',
      mode: options.mode,
      mtime: now,
      ctime: now,
      atime: now,
    };
  });

  /**
   * Create a mock implementation of fs.readdir
   */
  public readdir = jest.fn((dirPath: string, options: any, callback?: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = { encoding: 'utf8', withFileTypes: false };
    } else if (typeof options === 'string') {
      options = { encoding: options, withFileTypes: false };
    } else if (options === undefined) {
      options = { encoding: 'utf8', withFileTypes: false };
    }

    const normalizedPath = this.normalizePath(dirPath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('readdir', normalizedPath);
      if (error) {
        return callback(error);
      }

      const entry = this.getEntry(normalizedPath);
      if (!entry) {
        const notFoundError = new Error(`ENOENT: no such file or directory, readdir '${normalizedPath}'`);
        (notFoundError as any).code = 'ENOENT';
        (notFoundError as any).errno = -2;
        (notFoundError as any).path = normalizedPath;
        return callback(notFoundError);
      }

      if (entry.type !== 'directory') {
        const notDirError = new Error(`ENOTDIR: not a directory, readdir '${normalizedPath}'`);
        (notDirError as any).code = 'ENOTDIR';
        (notDirError as any).errno = -20;
        (notDirError as any).path = normalizedPath;
        return callback(notDirError);
      }

      // Get all entries in this directory
      const entries = Object.keys(this.fileSystem)
        .filter(p => {
          const parentDir = path.dirname(p);
          return parentDir === normalizedPath && p !== normalizedPath;
        })
        .map(p => path.basename(p));

      if (options.withFileTypes) {
        const dirents = entries.map(name => {
          const entryPath = path.join(normalizedPath, name);
          const entry = this.getEntry(entryPath);
          return this.createDirent(name, entry?.type || 'file');
        });
        return callback(null, dirents);
      } else {
        return callback(null, entries);
      }
    });
  });

  /**
   * Create a mock implementation of fs.readdirSync
   */
  public readdirSync = jest.fn((dirPath: string, options?: any) => {
    if (typeof options === 'string') {
      options = { encoding: options, withFileTypes: false };
    } else if (options === undefined) {
      options = { encoding: 'utf8', withFileTypes: false };
    }

    const normalizedPath = this.normalizePath(dirPath);
    
    const error = this.getError('readdirSync', normalizedPath);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedPath);
    if (!entry) {
      const notFoundError = new Error(`ENOENT: no such file or directory, readdir '${normalizedPath}'`);
      (notFoundError as any).code = 'ENOENT';
      (notFoundError as any).errno = -2;
      (notFoundError as any).path = normalizedPath;
      throw notFoundError;
    }

    if (entry.type !== 'directory') {
      const notDirError = new Error(`ENOTDIR: not a directory, readdir '${normalizedPath}'`);
      (notDirError as any).code = 'ENOTDIR';
      (notDirError as any).errno = -20;
      (notDirError as any).path = normalizedPath;
      throw notDirError;
    }

    // Get all entries in this directory
    const entries = Object.keys(this.fileSystem)
      .filter(p => {
        const parentDir = path.dirname(p);
        return parentDir === normalizedPath && p !== normalizedPath;
      })
      .map(p => path.basename(p));

    if (options.withFileTypes) {
      return entries.map(name => {
        const entryPath = path.join(normalizedPath, name);
        const entry = this.getEntry(entryPath);
        return this.createDirent(name, entry?.type || 'file');
      });
    } else {
      return entries;
    }
  });

  /**
   * Create a mock implementation of fs.unlink
   */
  public unlink = jest.fn((filePath: string, callback: any) => {
    const normalizedPath = this.normalizePath(filePath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('unlink', normalizedPath);
      if (error) {
        return callback(error);
      }

      try {
        this.unlinkSync(normalizedPath);
        return callback(null);
      } catch (err) {
        return callback(err);
      }
    });
  });

  /**
   * Create a mock implementation of fs.unlinkSync
   */
  public unlinkSync = jest.fn((filePath: string) => {
    const normalizedPath = this.normalizePath(filePath);
    
    const error = this.getError('unlinkSync', normalizedPath);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedPath);
    if (!entry) {
      const notFoundError = new Error(`ENOENT: no such file or directory, unlink '${normalizedPath}'`);
      (notFoundError as any).code = 'ENOENT';
      (notFoundError as any).errno = -2;
      (notFoundError as any).path = normalizedPath;
      throw notFoundError;
    }

    if (entry.type === 'directory') {
      const isDirError = new Error(`EISDIR: illegal operation on a directory, unlink '${normalizedPath}'`);
      (isDirError as any).code = 'EISDIR';
      (isDirError as any).errno = -21;
      (isDirError as any).path = normalizedPath;
      throw isDirError;
    }

    delete this.fileSystem[normalizedPath];
  });

  /**
   * Create a mock implementation of fs.rmdir
   */
  public rmdir = jest.fn((dirPath: string, options: any, callback?: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = { recursive: false };
    } else if (options === undefined) {
      options = { recursive: false };
    }

    const normalizedPath = this.normalizePath(dirPath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('rmdir', normalizedPath);
      if (error) {
        return callback(error);
      }

      try {
        this.rmdirSync(normalizedPath, options);
        return callback(null);
      } catch (err) {
        return callback(err);
      }
    });
  });

  /**
   * Create a mock implementation of fs.rmdirSync
   */
  public rmdirSync = jest.fn((dirPath: string, options?: any) => {
    if (options === undefined) {
      options = { recursive: false };
    }

    const normalizedPath = this.normalizePath(dirPath);
    
    const error = this.getError('rmdirSync', normalizedPath);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedPath);
    if (!entry) {
      const notFoundError = new Error(`ENOENT: no such file or directory, rmdir '${normalizedPath}'`);
      (notFoundError as any).code = 'ENOENT';
      (notFoundError as any).errno = -2;
      (notFoundError as any).path = normalizedPath;
      throw notFoundError;
    }

    if (entry.type !== 'directory') {
      const notDirError = new Error(`ENOTDIR: not a directory, rmdir '${normalizedPath}'`);
      (notDirError as any).code = 'ENOTDIR';
      (notDirError as any).errno = -20;
      (notDirError as any).path = normalizedPath;
      throw notDirError;
    }

    // Check if directory is empty
    const hasChildren = Object.keys(this.fileSystem).some(p => {
      const parentDir = path.dirname(p);
      return parentDir === normalizedPath && p !== normalizedPath;
    });

    if (hasChildren && !options.recursive) {
      const notEmptyError = new Error(`ENOTEMPTY: directory not empty, rmdir '${normalizedPath}'`);
      (notEmptyError as any).code = 'ENOTEMPTY';
      (notEmptyError as any).errno = -66;
      (notEmptyError as any).path = normalizedPath;
      throw notEmptyError;
    }

    if (options.recursive) {
      // Remove all children recursively
      Object.keys(this.fileSystem)
        .filter(p => p.startsWith(normalizedPath + path.sep) || p === normalizedPath)
        .sort((a, b) => b.length - a.length) // Sort by path length descending to remove deepest paths first
        .forEach(p => {
          delete this.fileSystem[p];
        });
    } else {
      delete this.fileSystem[normalizedPath];
    }
  });

  /**
   * Create a mock implementation of fs.rename
   */
  public rename = jest.fn((oldPath: string, newPath: string, callback: any) => {
    const normalizedOldPath = this.normalizePath(oldPath);
    const normalizedNewPath = this.normalizePath(newPath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('rename', normalizedOldPath);
      if (error) {
        return callback(error);
      }

      try {
        this.renameSync(normalizedOldPath, normalizedNewPath);
        return callback(null);
      } catch (err) {
        return callback(err);
      }
    });
  });

  /**
   * Create a mock implementation of fs.renameSync
   */
  public renameSync = jest.fn((oldPath: string, newPath: string) => {
    const normalizedOldPath = this.normalizePath(oldPath);
    const normalizedNewPath = this.normalizePath(newPath);
    
    const error = this.getError('renameSync', normalizedOldPath);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedOldPath);
    if (!entry) {
      const notFoundError = new Error(`ENOENT: no such file or directory, rename '${normalizedOldPath}' -> '${normalizedNewPath}'`);
      (notFoundError as any).code = 'ENOENT';
      (notFoundError as any).errno = -2;
      (notFoundError as any).path = normalizedOldPath;
      throw notFoundError;
    }

    // Create parent directories if they don't exist
    const dirPath = path.dirname(normalizedNewPath);
    if (dirPath !== '/' && dirPath !== '.') {
      try {
        this.mkdirSync(dirPath, { recursive: true });
      } catch (err) {
        if ((err as any).code !== 'EEXIST') {
          throw err;
        }
      }
    }

    // Move the file
    this.fileSystem[normalizedNewPath] = { ...entry };
    delete this.fileSystem[normalizedOldPath];

    // If it's a directory, move all children too
    if (entry.type === 'directory') {
      Object.keys(this.fileSystem)
        .filter(p => p.startsWith(normalizedOldPath + path.sep))
        .forEach(p => {
          const relativePath = p.slice(normalizedOldPath.length);
          const newChildPath = normalizedNewPath + relativePath;
          this.fileSystem[newChildPath] = { ...this.fileSystem[p] };
          delete this.fileSystem[p];
        });
    }
  });

  /**
   * Create a mock implementation of fs.copyFile
   */
  public copyFile = jest.fn((src: string, dest: string, mode: any, callback?: any) => {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 0;
    }

    const normalizedSrc = this.normalizePath(src);
    const normalizedDest = this.normalizePath(dest);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('copyFile', normalizedSrc);
      if (error) {
        return callback(error);
      }

      try {
        this.copyFileSync(normalizedSrc, normalizedDest, mode);
        return callback(null);
      } catch (err) {
        return callback(err);
      }
    });
  });

  /**
   * Create a mock implementation of fs.copyFileSync
   */
  public copyFileSync = jest.fn((src: string, dest: string, mode?: number) => {
    const normalizedSrc = this.normalizePath(src);
    const normalizedDest = this.normalizePath(dest);
    
    const error = this.getError('copyFileSync', normalizedSrc);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedSrc);
    if (!entry) {
      const notFoundError = new Error(`ENOENT: no such file or directory, copyfile '${normalizedSrc}' -> '${normalizedDest}'`);
      (notFoundError as any).code = 'ENOENT';
      (notFoundError as any).errno = -2;
      (notFoundError as any).path = normalizedSrc;
      throw notFoundError;
    }

    if (entry.type !== 'file') {
      const isDirError = new Error(`EISDIR: illegal operation on a directory, copyfile '${normalizedSrc}' -> '${normalizedDest}'`);
      (isDirError as any).code = 'EISDIR';
      (isDirError as any).errno = -21;
      (isDirError as any).path = normalizedSrc;
      throw isDirError;
    }

    // Check if destination exists and COPYFILE_EXCL flag is set
    if ((mode & 1) === 1 && this.getEntry(normalizedDest)) {
      const existsError = new Error(`EEXIST: file already exists, copyfile '${normalizedSrc}' -> '${normalizedDest}'`);
      (existsError as any).code = 'EEXIST';
      (existsError as any).errno = -17;
      (existsError as any).path = normalizedDest;
      throw existsError;
    }

    // Create parent directories if they don't exist
    const dirPath = path.dirname(normalizedDest);
    if (dirPath !== '/' && dirPath !== '.') {
      try {
        this.mkdirSync(dirPath, { recursive: true });
      } catch (err) {
        if ((err as any).code !== 'EEXIST') {
          throw err;
        }
      }
    }

    // Copy the file
    const now = new Date();
    this.fileSystem[normalizedDest] = {
      type: 'file',
      content: entry.content,
      mode: entry.mode,
      mtime: now,
      ctime: now,
      atime: now,
      size: entry.size,
    };
  });

  /**
   * Create a mock implementation of fs.appendFile
   */
  public appendFile = jest.fn((filePath: string, data: string | Buffer, options: any, callback?: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = { encoding: 'utf8', mode: this.defaultMode, flag: 'a' };
    } else if (typeof options === 'string') {
      options = { encoding: options, mode: this.defaultMode, flag: 'a' };
    } else if (options === undefined) {
      options = { encoding: 'utf8', mode: this.defaultMode, flag: 'a' };
    }

    const normalizedPath = this.normalizePath(filePath);
    
    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('appendFile', normalizedPath);
      if (error) {
        return callback(error);
      }

      const entry = this.getEntry(normalizedPath);
      if (entry && entry.type !== 'file') {
        const isDirError = new Error(`EISDIR: illegal operation on a directory, appendFile '${normalizedPath}'`);
        (isDirError as any).code = 'EISDIR';
        (isDirError as any).errno = -21;
        (isDirError as any).path = normalizedPath;
        return callback(isDirError);
      }

      let content: string | Buffer;
      if (entry && entry.content) {
        if (typeof entry.content === 'string' && typeof data === 'string') {
          content = entry.content + data;
        } else {
          const contentBuffer = typeof entry.content === 'string' ? Buffer.from(entry.content) : entry.content;
          const dataBuffer = typeof data === 'string' ? Buffer.from(data) : data;
          content = Buffer.concat([contentBuffer, dataBuffer]);
        }
      } else {
        content = data;
      }

      // Create parent directories if they don't exist
      const dirPath = path.dirname(normalizedPath);
      if (dirPath !== '/' && dirPath !== '.') {
        try {
          this.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
          if ((err as any).code !== 'EEXIST') {
            return callback(err);
          }
        }
      }

      const now = new Date();
      this.fileSystem[normalizedPath] = {
        type: 'file',
        content,
        mode: options.mode,
        mtime: now,
        ctime: entry ? entry.ctime : now,
        atime: now,
        size: typeof content === 'string' ? Buffer.from(content).length : content.length,
      };

      return callback(null);
    });
  });

  /**
   * Create a mock implementation of fs.appendFileSync
   */
  public appendFileSync = jest.fn((filePath: string, data: string | Buffer, options?: any) => {
    if (typeof options === 'string') {
      options = { encoding: options, mode: this.defaultMode, flag: 'a' };
    } else if (options === undefined) {
      options = { encoding: 'utf8', mode: this.defaultMode, flag: 'a' };
    }

    const normalizedPath = this.normalizePath(filePath);
    
    const error = this.getError('appendFileSync', normalizedPath);
    if (error) {
      throw error;
    }

    const entry = this.getEntry(normalizedPath);
    if (entry && entry.type !== 'file') {
      const isDirError = new Error(`EISDIR: illegal operation on a directory, appendFile '${normalizedPath}'`);
      (isDirError as any).code = 'EISDIR';
      (isDirError as any).errno = -21;
      (isDirError as any).path = normalizedPath;
      throw isDirError;
    }

    let content: string | Buffer;
    if (entry && entry.content) {
      if (typeof entry.content === 'string' && typeof data === 'string') {
        content = entry.content + data;
      } else {
        const contentBuffer = typeof entry.content === 'string' ? Buffer.from(entry.content) : entry.content;
        const dataBuffer = typeof data === 'string' ? Buffer.from(data) : data;
        content = Buffer.concat([contentBuffer, dataBuffer]);
      }
    } else {
      content = data;
    }

    // Create parent directories if they don't exist
    const dirPath = path.dirname(normalizedPath);
    if (dirPath !== '/' && dirPath !== '.') {
      try {
        this.mkdirSync(dirPath, { recursive: true });
      } catch (err) {
        if ((err as any).code !== 'EEXIST') {
          throw err;
        }
      }
    }

    const now = new Date();
    this.fileSystem[normalizedPath] = {
      type: 'file',
      content,
      mode: options.mode,
      mtime: now,
      ctime: entry ? entry.ctime : now,
      atime: now,
      size: typeof content === 'string' ? Buffer.from(content).length : content.length,
    };
  });

  /**
   * Create a mock implementation of fs.watch
   */
  public watch = jest.fn((filename: string, options?: any, listener?: any) => {
    if (typeof options === 'function') {
      listener = options;
      options = {};
    }

    const normalizedPath = this.normalizePath(filename);
    const watcher = new EventEmitter();
    
    // Add close method
    (watcher as any).close = jest.fn(() => {
      watcher.removeAllListeners();
    });

    if (listener) {
      watcher.on('change', listener);
    }

    // Check if path exists
    const entry = this.getEntry(normalizedPath);
    if (!entry) {
      process.nextTick(() => {
        const error = new Error(`ENOENT: no such file or directory, watch '${normalizedPath}'`);
        (error as any).code = 'ENOENT';
        (error as any).errno = -2;
        (error as any).path = normalizedPath;
        watcher.emit('error', error);
      });
    }

    return watcher;
  });

  /**
   * Create a mock implementation of fs.watchFile
   */
  public watchFile = jest.fn((filename: string, options?: any, listener?: any) => {
    if (typeof options === 'function') {
      listener = options;
      options = { persistent: true, interval: 5007 };
    }

    const normalizedPath = this.normalizePath(filename);
    const watcher = new EventEmitter();
    
    if (listener) {
      watcher.on('change', listener);
    }

    return watcher;
  });

  /**
   * Create a mock implementation of fs.unwatchFile
   */
  public unwatchFile = jest.fn((filename: string, listener?: any) => {
    // No-op in mock implementation
  });

  /**
   * Create a mock implementation of fs.createReadStream
   */
  public createReadStream = jest.fn((path: string, options?: any) => {
    const normalizedPath = this.normalizePath(path);
    const stream = new EventEmitter();
    
    // Add pipe method
    (stream as any).pipe = jest.fn((destination) => {
      return destination;
    });

    // Add close method
    (stream as any).close = jest.fn(() => {
      stream.emit('close');
    });

    // Add destroy method
    (stream as any).destroy = jest.fn(() => {
      stream.emit('close');
    });

    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('createReadStream', normalizedPath);
      if (error) {
        stream.emit('error', error);
        return;
      }

      const entry = this.getEntry(normalizedPath);
      if (!entry) {
        const notFoundError = new Error(`ENOENT: no such file or directory, open '${normalizedPath}'`);
        (notFoundError as any).code = 'ENOENT';
        (notFoundError as any).errno = -2;
        (notFoundError as any).path = normalizedPath;
        stream.emit('error', notFoundError);
        return;
      }

      if (entry.type !== 'file') {
        const isDirError = new Error(`EISDIR: illegal operation on a directory, read '${normalizedPath}'`);
        (isDirError as any).code = 'EISDIR';
        (isDirError as any).errno = -21;
        (isDirError as any).path = normalizedPath;
        stream.emit('error', isDirError);
        return;
      }

      let content = entry.content;
      if (!content) {
        content = '';
      }

      // Update access time
      entry.atime = new Date();

      // Emit data and end events
      stream.emit('open');
      if (typeof content === 'string') {
        stream.emit('data', Buffer.from(content));
      } else {
        stream.emit('data', content);
      }
      stream.emit('end');
      stream.emit('close');
    });

    return stream;
  });

  /**
   * Create a mock implementation of fs.createWriteStream
   */
  public createWriteStream = jest.fn((path: string, options?: any) => {
    const normalizedPath = this.normalizePath(path);
    const stream = new EventEmitter();
    let buffer: Buffer[] = [];
    
    // Add write method
    (stream as any).write = jest.fn((chunk: string | Buffer, encoding?: string, callback?: any) => {
      if (typeof encoding === 'function') {
        callback = encoding;
        encoding = undefined;
      }

      const chunkBuffer = typeof chunk === 'string' ? Buffer.from(chunk, encoding as BufferEncoding) : chunk;
      buffer.push(chunkBuffer);

      if (callback) {
        process.nextTick(callback);
      }

      return true;
    });

    // Add end method
    (stream as any).end = jest.fn((chunk?: string | Buffer, encoding?: string, callback?: any) => {
      if (typeof chunk === 'function') {
        callback = chunk;
        chunk = undefined;
        encoding = undefined;
      } else if (typeof encoding === 'function') {
        callback = encoding;
        encoding = undefined;
      }

      if (chunk) {
        const chunkBuffer = typeof chunk === 'string' ? Buffer.from(chunk, encoding as BufferEncoding) : chunk;
        buffer.push(chunkBuffer);
      }

      const content = Buffer.concat(buffer);
      
      // Create parent directories if they don't exist
      const dirPath = path.dirname(normalizedPath);
      if (dirPath !== '/' && dirPath !== '.') {
        try {
          this.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
          if ((err as any).code !== 'EEXIST') {
            stream.emit('error', err);
            return;
          }
        }
      }

      const now = new Date();
      this.fileSystem[normalizedPath] = {
        type: 'file',
        content,
        mode: this.defaultMode,
        mtime: now,
        ctime: now,
        atime: now,
        size: content.length,
      };

      stream.emit('finish');
      stream.emit('close');

      if (callback) {
        process.nextTick(callback);
      }
    });

    // Add close method
    (stream as any).close = jest.fn(() => {
      stream.emit('close');
    });

    // Add destroy method
    (stream as any).destroy = jest.fn(() => {
      stream.emit('close');
    });

    // Process on next tick to simulate async behavior
    process.nextTick(() => {
      const error = this.getError('createWriteStream', normalizedPath);
      if (error) {
        stream.emit('error', error);
        return;
      }

      stream.emit('open');
    });

    return stream;
  });

  /**
   * Create a Stats object from a file entry
   * @param entry - The file entry
   * @returns Stats object
   */
  private createStats(entry: MockFsEntry): any {
    const isFile = entry.type === 'file';
    const isDirectory = entry.type === 'directory';
    const size = entry.size || 0;
    const mode = entry.mode || (isDirectory ? this.defaultDirMode : this.defaultMode);
    const mtime = entry.mtime || new Date();
    const ctime = entry.ctime || new Date();
    const atime = entry.atime || new Date();

    return {
      isFile: () => isFile,
      isDirectory: () => isDirectory,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isSymbolicLink: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      dev: 1,
      ino: 1,
      mode,
      nlink: 1,
      uid: 1000,
      gid: 1000,
      rdev: 0,
      size,
      blksize: 4096,
      blocks: Math.ceil(size / 4096),
      atimeMs: atime.getTime(),
      mtimeMs: mtime.getTime(),
      ctimeMs: ctime.getTime(),
      birthtimeMs: ctime.getTime(),
      atime,
      mtime,
      ctime,
      birthtime: ctime,
    };
  }

  /**
   * Create a Dirent object for directory entries
   * @param name - The file name
   * @param type - The file type
   * @returns Dirent object
   */
  private createDirent(name: string, type: string): any {
    const isFile = type === 'file';
    const isDirectory = type === 'directory';

    return {
      name,
      isFile: () => isFile,
      isDirectory: () => isDirectory,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isSymbolicLink: () => false,
      isFIFO: () => false,
      isSocket: () => false,
    };
  }

  /**
   * Create a mock fs module with all methods
   * @returns Mock fs module
   */
  public getMockFs(): any {
    return {
      readFile: this.readFile,
      readFileSync: this.readFileSync,
      writeFile: this.writeFile,
      writeFileSync: this.writeFileSync,
      stat: this.stat,
      statSync: this.statSync,
      exists: this.exists,
      existsSync: this.existsSync,
      mkdir: this.mkdir,
      mkdirSync: this.mkdirSync,
      readdir: this.readdir,
      readdirSync: this.readdirSync,
      unlink: this.unlink,
      unlinkSync: this.unlinkSync,
      rmdir: this.rmdir,
      rmdirSync: this.rmdirSync,
      rename: this.rename,
      renameSync: this.renameSync,
      copyFile: this.copyFile,
      copyFileSync: this.copyFileSync,
      appendFile: this.appendFile,
      appendFileSync: this.appendFileSync,
      watch: this.watch,
      watchFile: this.watchFile,
      unwatchFile: this.unwatchFile,
      createReadStream: this.createReadStream,
      createWriteStream: this.createWriteStream,
      constants: {
        COPYFILE_EXCL: 1,
        COPYFILE_FICLONE: 2,
        COPYFILE_FICLONE_FORCE: 4,
      },
      promises: {
        readFile: jest.fn((filePath: string, options?: any) => {
          return new Promise((resolve, reject) => {
            this.readFile(filePath, options, (err: Error | null, data: any) => {
              if (err) reject(err);
              else resolve(data);
            });
          });
        }),
        writeFile: jest.fn((filePath: string, data: string | Buffer, options?: any) => {
          return new Promise((resolve, reject) => {
            this.writeFile(filePath, data, options, (err: Error | null) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
        }),
        stat: jest.fn((filePath: string) => {
          return new Promise((resolve, reject) => {
            this.stat(filePath, (err: Error | null, stats: any) => {
              if (err) reject(err);
              else resolve(stats);
            });
          });
        }),
        mkdir: jest.fn((dirPath: string, options?: any) => {
          return new Promise((resolve, reject) => {
            this.mkdir(dirPath, options, (err: Error | null) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
        }),
        readdir: jest.fn((dirPath: string, options?: any) => {
          return new Promise((resolve, reject) => {
            this.readdir(dirPath, options, (err: Error | null, files: any) => {
              if (err) reject(err);
              else resolve(files);
            });
          });
        }),
        unlink: jest.fn((filePath: string) => {
          return new Promise((resolve, reject) => {
            this.unlink(filePath, (err: Error | null) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
        }),
        rmdir: jest.fn((dirPath: string, options?: any) => {
          return new Promise((resolve, reject) => {
            this.rmdir(dirPath, options, (err: Error | null) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
        }),
        rename: jest.fn((oldPath: string, newPath: string) => {
          return new Promise((resolve, reject) => {
            this.rename(oldPath, newPath, (err: Error | null) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
        }),
        copyFile: jest.fn((src: string, dest: string, mode?: number) => {
          return new Promise((resolve, reject) => {
            this.copyFile(src, dest, mode, (err: Error | null) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
        }),
        appendFile: jest.fn((filePath: string, data: string | Buffer, options?: any) => {
          return new Promise((resolve, reject) => {
            this.appendFile(filePath, data, options, (err: Error | null) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
        }),
      },
    };
  }

  /**
   * Create journey-specific file templates for testing
   * @returns Preconfigured journey file templates
   */
  public static createJourneyTemplates(): JourneyFileConfig[] {
    return [
      {
        journey: 'health',
        basePath: '/tmp/health',
        templates: {
          'config.json': JSON.stringify({
            apiEndpoint: 'https://health-api.austa.com',
            metrics: ['weight', 'steps', 'heartRate', 'sleep'],
            refreshInterval: 300,
            maxHistoryDays: 90,
          }, null, 2),
          'devices.json': JSON.stringify({
            supported: ['fitbit', 'garmin', 'apple', 'samsung'],
            defaultDevice: 'fitbit',
            syncInterval: 3600,
          }, null, 2),
        },
        defaultPermissions: 0o644,
      },
      {
        journey: 'care',
        basePath: '/tmp/care',
        templates: {
          'config.json': JSON.stringify({
            apiEndpoint: 'https://care-api.austa.com',
            appointmentTypes: ['general', 'specialist', 'followup', 'emergency'],
            telemedicineEnabled: true,
            reminderHours: [24, 2],
          }, null, 2),
          'providers.json': JSON.stringify({
            categories: ['general', 'cardiology', 'dermatology', 'orthopedics'],
            searchRadius: 25,
            maxResults: 50,
          }, null, 2),
        },
        defaultPermissions: 0o644,
      },
      {
        journey: 'plan',
        basePath: '/tmp/plan',
        templates: {
          'config.json': JSON.stringify({
            apiEndpoint: 'https://plan-api.austa.com',
            planTypes: ['basic', 'standard', 'premium', 'family'],
            claimCategories: ['medical', 'dental', 'vision', 'pharmacy'],
            documentFormats: ['pdf', 'jpg'],
          }, null, 2),
          'benefits.json': JSON.stringify({
            categories: ['preventive', 'emergency', 'hospitalization', 'prescription'],
            refreshInterval: 86400,
            cacheEnabled: true,
          }, null, 2),
        },
        defaultPermissions: 0o644,
      },
      {
        journey: 'common',
        basePath: '/tmp/common',
        templates: {
          'app-config.json': JSON.stringify({
            version: '1.0.0',
            environment: 'development',
            logLevel: 'debug',
            apiTimeout: 30000,
            features: {
              gamification: true,
              notifications: true,
              offlineMode: false,
            },
          }, null, 2),
          'error-messages.json': JSON.stringify({
            network: 'Unable to connect to the server. Please check your internet connection.',
            auth: 'Authentication failed. Please log in again.',
            timeout: 'The request timed out. Please try again.',
            server: 'An unexpected server error occurred. Please try again later.',
          }, null, 2),
        },
        defaultPermissions: 0o644,
      },
    ];
  }
}

/**
 * Create a mock fs module for testing
 * @returns Mock fs module
 */
export const createMockFs = (): { mockFs: any; fsMock: FsMock } => {
  const fsMock = new FsMock();
  const mockFs = fsMock.getMockFs();
  return { mockFs, fsMock };
};

/**
 * Helper function to mock fs module in Jest tests
 * @param initialFileSystem - Initial file system structure
 * @param errorConfigs - Error configurations
 * @returns FsMock instance for further configuration
 */
export const mockFs = (
  initialFileSystem?: Record<string, string | Buffer | MockFsEntry>,
  errorConfigs?: ErrorConfig[],
): FsMock => {
  const fsMock = new FsMock();
  
  if (initialFileSystem) {
    fsMock.init(initialFileSystem);
  }
  
  if (errorConfigs) {
    fsMock.setErrors(errorConfigs);
  }
  
  // Mock fs module
  jest.mock('fs', () => fsMock.getMockFs());
  
  return fsMock;
};

export default mockFs;