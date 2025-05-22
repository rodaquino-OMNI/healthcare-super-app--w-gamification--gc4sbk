/**
 * Stack trace processing utilities for enhanced error diagnostics.
 * 
 * This module provides functions for processing, cleaning, and analyzing stack traces
 * to extract useful diagnostic information. It includes utilities for removing internal
 * framework frames, highlighting application code, extracting key stack frames,
 * determining error origins, and generating condensed stack representations for logging.
 * 
 * It also includes utilities for correlating stack traces with source maps in
 * non-production environments for improved debugging.
 */

import * as path from 'path';
import { ErrorContext } from '../base';

/**
 * Interface representing a parsed stack frame.
 */
export interface StackFrame {
  /** The file path of the stack frame */
  fileName: string;
  /** The line number in the file */
  lineNumber: number;
  /** The column number in the file */
  columnNumber: number;
  /** The function name */
  functionName: string;
  /** Whether this is an application frame (vs. framework/library code) */
  isApplicationFrame: boolean;
  /** The original source file (if source maps are available) */
  originalFileName?: string;
  /** The original line number (if source maps are available) */
  originalLineNumber?: number;
  /** The original column number (if source maps are available) */
  originalColumnNumber?: number;
  /** The raw stack frame string */
  raw: string;
}

/**
 * Configuration options for stack trace processing.
 */
export interface StackTraceOptions {
  /** Maximum number of frames to include */
  maxFrames?: number;
  /** Whether to include framework frames */
  includeFrameworkFrames?: boolean;
  /** Whether to attempt source map correlation */
  correlateSourceMaps?: boolean;
  /** Application root paths to identify application frames */
  applicationRoots?: string[];
  /** Framework paths to identify framework frames */
  frameworkPaths?: string[];
  /** Whether to include node_modules frames */
  includeNodeModules?: boolean;
}

/**
 * Default configuration for stack trace processing.
 */
const DEFAULT_OPTIONS: StackTraceOptions = {
  maxFrames: 20,
  includeFrameworkFrames: true,
  correlateSourceMaps: process.env.NODE_ENV !== 'production',
  applicationRoots: [process.cwd()],
  frameworkPaths: [
    'node_modules/@nestjs',
    'node_modules/express',
    'node_modules/next',
    'node_modules/react',
    'node_modules/react-native',
    'internal/modules',
    'internal/process',
    'internal/timers',
    'events.js',
    'node:internal'
  ],
  includeNodeModules: false
};

/**
 * Parses a stack trace string into an array of StackFrame objects.
 * 
 * @param stack - The stack trace string to parse
 * @param options - Configuration options for parsing
 * @returns An array of parsed StackFrame objects
 */
export function parseStackTrace(stack: string, options: StackTraceOptions = {}): StackFrame[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!stack) {
    return [];
  }

  // Remove the error message line if present
  const stackLines = stack.split('\n');
  const startIndex = stackLines[0].startsWith('Error:') ? 1 : 0;
  
  const frames: StackFrame[] = [];
  
  for (let i = startIndex; i < stackLines.length && frames.length < (opts.maxFrames || Infinity); i++) {
    const line = stackLines[i].trim();
    if (!line || !line.startsWith('at ')) {
      continue;
    }
    
    const frame = parseStackFrame(line, opts);
    if (frame) {
      frames.push(frame);
    }
  }
  
  return frames;
}

/**
 * Parses a single stack frame line into a StackFrame object.
 * 
 * @param line - The stack frame line to parse
 * @param options - Configuration options for parsing
 * @returns A parsed StackFrame object or null if parsing failed
 */
function parseStackFrame(line: string, options: StackTraceOptions): StackFrame | null {
  // Format: "at functionName (fileName:lineNumber:columnNumber)"
  // or: "at fileName:lineNumber:columnNumber"
  const frameRegex = /^\s*at\s+(?:([^\s(]+)\s+\(([^)]+)\)|([^\s]+))(?::([0-9]+))?(?::([0-9]+))?/;
  const match = frameRegex.exec(line);
  
  if (!match) {
    return null;
  }
  
  let functionName = match[1] || '<anonymous>';
  let fileName = match[2] || match[3] || '<unknown>';
  let lineNumber = parseInt(match[4] || '0', 10);
  let columnNumber = parseInt(match[5] || '0', 10);
  
  // Handle special case for anonymous functions
  if (functionName === 'Object.<anonymous>') {
    functionName = '<anonymous>';
  }
  
  // Handle eval frames
  if (fileName.includes('eval at')) {
    // Format: eval at functionName (fileName:lineNumber:columnNumber)
    const evalRegex = /eval at ([^\s]+) \((.+):(\d+):(\d+)\)/;
    const evalMatch = evalRegex.exec(fileName);
    
    if (evalMatch) {
      functionName = evalMatch[1];
      fileName = evalMatch[2];
      lineNumber = parseInt(evalMatch[3], 10);
      columnNumber = parseInt(evalMatch[4], 10);
    }
  }
  
  // Clean up file path
  fileName = fileName.replace(/^file:\/\//, '');
  
  // Determine if this is an application frame
  const isApplicationFrame = isApplicationStackFrame(fileName, options);
  
  return {
    fileName,
    lineNumber,
    columnNumber,
    functionName,
    isApplicationFrame,
    raw: line
  };
}

/**
 * Determines if a stack frame is from application code (vs. framework/library code).
 * 
 * @param fileName - The file path of the stack frame
 * @param options - Configuration options
 * @returns True if the frame is from application code, false otherwise
 */
export function isApplicationStackFrame(fileName: string, options: StackTraceOptions = {}): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Check if it's a node_modules frame
  const isNodeModulesFrame = fileName.includes('node_modules');
  if (isNodeModulesFrame && !opts.includeNodeModules) {
    return false;
  }
  
  // Check if it's a framework frame
  const isFrameworkFrame = opts.frameworkPaths?.some(frameworkPath => 
    fileName.includes(frameworkPath)
  ) ?? false;
  
  if (isFrameworkFrame) {
    return false;
  }
  
  // Check if it's an application frame
  const isAppFrame = opts.applicationRoots?.some(appRoot => 
    fileName.startsWith(appRoot) || 
    // Handle relative paths
    path.resolve(fileName).startsWith(appRoot)
  ) ?? true;
  
  return isAppFrame;
}

/**
 * Cleans a stack trace by filtering out framework frames and highlighting application code.
 * 
 * @param stack - The stack trace string or Error object
 * @param options - Configuration options for cleaning
 * @returns A cleaned stack trace string
 */
export function cleanStack(stack: string | Error, options: StackTraceOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stackStr = typeof stack === 'string' ? stack : stack.stack || '';
  
  const frames = parseStackTrace(stackStr, opts);
  
  // Filter frames if needed
  const filteredFrames = opts.includeFrameworkFrames 
    ? frames 
    : frames.filter(frame => frame.isApplicationFrame);
  
  // If we filtered out all frames, return the original stack
  if (filteredFrames.length === 0 && frames.length > 0) {
    return stackStr;
  }
  
  // Reconstruct the stack trace
  const errorMessage = stackStr.split('\n')[0];
  const stackLines = filteredFrames.map(frame => {
    let line = frame.raw;
    
    // Highlight application frames
    if (frame.isApplicationFrame) {
      line = `→ ${line}`;
    }
    
    return line;
  });
  
  return [errorMessage, ...stackLines].join('\n');
}

/**
 * Extracts the most important frames from a stack trace.
 * 
 * @param stack - The stack trace string or Error object
 * @param options - Configuration options for extraction
 * @returns An array of the most important StackFrame objects
 */
export function extractKeyFrames(stack: string | Error, options: StackTraceOptions = {}): StackFrame[] {
  const opts = { ...DEFAULT_OPTIONS, maxFrames: 5, ...options };
  const stackStr = typeof stack === 'string' ? stack : stack.stack || '';
  
  const frames = parseStackTrace(stackStr, opts);
  
  // Prioritize application frames
  const appFrames = frames.filter(frame => frame.isApplicationFrame);
  
  // If we have enough application frames, return those
  if (appFrames.length >= opts.maxFrames) {
    return appFrames.slice(0, opts.maxFrames);
  }
  
  // Otherwise, include some framework frames to reach the desired count
  return [
    ...appFrames,
    ...frames.filter(frame => !frame.isApplicationFrame).slice(0, opts.maxFrames - appFrames.length)
  ];
}

/**
 * Determines the origin of an error based on its stack trace.
 * 
 * @param stack - The stack trace string or Error object
 * @param options - Configuration options
 * @returns Information about the error origin
 */
export function determineErrorOrigin(stack: string | Error, options: StackTraceOptions = {}): {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName: string;
  isApplicationCode: boolean;
} {
  const stackStr = typeof stack === 'string' ? stack : stack.stack || '';
  const frames = parseStackTrace(stackStr, options);
  
  // Find the first application frame, or use the first frame if none are found
  const originFrame = frames.find(frame => frame.isApplicationFrame) || frames[0] || {
    fileName: '<unknown>',
    lineNumber: 0,
    columnNumber: 0,
    functionName: '<unknown>',
    isApplicationFrame: false,
    raw: ''
  };
  
  return {
    fileName: originFrame.fileName,
    lineNumber: originFrame.lineNumber,
    columnNumber: originFrame.columnNumber,
    functionName: originFrame.functionName,
    isApplicationCode: originFrame.isApplicationFrame
  };
}

/**
 * Generates a condensed representation of a stack trace for logging.
 * 
 * @param stack - The stack trace string or Error object
 * @param options - Configuration options
 * @returns A condensed stack trace string
 */
export function condenseStack(stack: string | Error, options: StackTraceOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, maxFrames: 3, ...options };
  const stackStr = typeof stack === 'string' ? stack : stack.stack || '';
  
  const frames = parseStackTrace(stackStr, opts);
  if (frames.length === 0) {
    return stackStr;
  }
  
  // Get the error message
  const errorLines = stackStr.split('\n');
  const errorMessage = errorLines[0].startsWith('Error:') ? errorLines[0] : '';
  
  // Get key frames
  const keyFrames = extractKeyFrames(stackStr, opts);
  
  // Format the condensed stack
  const condensedFrames = keyFrames.map(frame => {
    const fileName = path.basename(frame.fileName);
    return `at ${frame.functionName} (${fileName}:${frame.lineNumber}:${frame.columnNumber})`;
  });
  
  // Add an ellipsis if we truncated frames
  if (frames.length > keyFrames.length) {
    condensedFrames.push(`... ${frames.length - keyFrames.length} more`);
  }
  
  return [errorMessage, ...condensedFrames].filter(Boolean).join('\n');
}

/**
 * Correlates stack frames with source maps in non-production environments.
 * 
 * Note: This is a simplified implementation. In a real-world scenario, you would
 * use a library like 'source-map-support' for more robust source map handling.
 * 
 * @param stack - The stack trace string or Error object
 * @param context - Optional error context with additional information
 * @returns A stack trace with source map information if available
 */
export function correlateWithSourceMap(
  stack: string | Error,
  context?: ErrorContext
): string {
  // Only attempt source map correlation in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return typeof stack === 'string' ? stack : stack.stack || '';
  }
  
  // In a real implementation, this would use source-map-support or a similar library
  // to correlate the stack trace with source maps
  
  // For now, we'll just add a note that source map correlation would happen here
  const stackStr = typeof stack === 'string' ? stack : stack.stack || '';
  
  try {
    // Check if source-map-support is available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sourceMapSupport = require('source-map-support');
    
    // If we have source-map-support, use it to get the mapped stack trace
    if (sourceMapSupport && typeof sourceMapSupport.mapStackTrace === 'function') {
      // This would normally be async, but we're simplifying for this implementation
      let mappedStack = stackStr;
      
      // Synchronously map the stack trace if possible
      try {
        mappedStack = sourceMapSupport.mapStackTrace(stackStr, {
          offline: true,
          cacheFile: path.join(process.cwd(), '.stack-cache')
        });
      } catch (e) {
        // If mapping fails, return the original stack
        return stackStr;
      }
      
      return mappedStack;
    }
  } catch (e) {
    // source-map-support is not available, return the original stack
    return stackStr;
  }
  
  return stackStr;
}

/**
 * Extracts metadata from a stack trace, such as file paths, line numbers, etc.
 * 
 * @param stack - The stack trace string or Error object
 * @param options - Configuration options
 * @returns Metadata extracted from the stack trace
 */
export function extractStackMetadata(stack: string | Error, options: StackTraceOptions = {}): {
  files: string[];
  functions: string[];
  applicationFrames: number;
  frameworkFrames: number;
  deepestFrame: {
    fileName: string;
    lineNumber: number;
    functionName: string;
  };
} {
  const stackStr = typeof stack === 'string' ? stack : stack.stack || '';
  const frames = parseStackTrace(stackStr, options);
  
  const files = frames.map(frame => frame.fileName);
  const functions = frames.map(frame => frame.functionName).filter(Boolean);
  const applicationFrames = frames.filter(frame => frame.isApplicationFrame).length;
  const frameworkFrames = frames.length - applicationFrames;
  
  // Get the deepest frame (last in the stack)
  const deepestFrame = frames[frames.length - 1] || {
    fileName: '<unknown>',
    lineNumber: 0,
    functionName: '<unknown>'
  };
  
  return {
    files,
    functions,
    applicationFrames,
    frameworkFrames,
    deepestFrame: {
      fileName: deepestFrame.fileName,
      lineNumber: deepestFrame.lineNumber,
      functionName: deepestFrame.functionName
    }
  };
}

/**
 * Enhances an error object with additional stack information.
 * 
 * @param error - The error object to enhance
 * @param options - Configuration options
 * @returns The enhanced error object
 */
export function enhanceErrorWithStackInfo<T extends Error>(error: T, options: StackTraceOptions = {}): T {
  if (!error.stack) {
    return error;
  }
  
  const origin = determineErrorOrigin(error.stack, options);
  const metadata = extractStackMetadata(error.stack, options);
  
  // Add properties to the error object without modifying its prototype
  Object.defineProperties(error, {
    _stackInfo: {
      value: {
        origin,
        metadata,
        isApplicationError: origin.isApplicationCode,
        frames: parseStackTrace(error.stack, options)
      },
      enumerable: false,
      writable: false,
      configurable: false
    }
  });
  
  return error;
}

/**
 * Gets the stack info from an enhanced error object.
 * 
 * @param error - The enhanced error object
 * @returns The stack info or null if not available
 */
export function getStackInfo(error: Error): {
  origin: ReturnType<typeof determineErrorOrigin>;
  metadata: ReturnType<typeof extractStackMetadata>;
  isApplicationError: boolean;
  frames: StackFrame[];
} | null {
  return (error as any)._stackInfo || null;
}