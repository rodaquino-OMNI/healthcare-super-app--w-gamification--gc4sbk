/**
 * Utilities for processing, cleaning, and analyzing stack traces to extract useful diagnostic information.
 * Provides functions for removing internal framework frames, highlighting application code,
 * extracting key stack frames, determining error origins, and generating condensed stack representations.
 */

/**
 * Represents a parsed stack frame with file, line, and function information.
 */
export interface StackFrame {
  /** The function name where the error occurred */
  functionName: string;
  /** The file path where the error occurred */
  fileName: string;
  /** The line number where the error occurred */
  lineNumber?: number;
  /** The column number where the error occurred */
  columnNumber?: number;
  /** Whether this frame is from application code (vs framework code) */
  isApplicationCode?: boolean;
  /** The original unparsed frame string */
  originalFrame: string;
  /** Additional metadata about the frame */
  metadata?: Record<string, any>;
}

/**
 * Options for stack trace processing.
 */
export interface StackProcessingOptions {
  /** Maximum number of frames to include */
  maxFrames?: number;
  /** Whether to include framework frames */
  includeFrameworkFrames?: boolean;
  /** Whether to include node_modules frames */
  includeNodeModules?: boolean;
  /** Application code path patterns to identify application frames */
  applicationPaths?: string[];
  /** Framework path patterns to identify framework frames */
  frameworkPaths?: string[];
  /** Whether to use source maps for correlating frames */
  useSourceMaps?: boolean;
}

/**
 * Default options for stack trace processing.
 */
const DEFAULT_STACK_OPTIONS: StackProcessingOptions = {
  maxFrames: 20,
  includeFrameworkFrames: false,
  includeNodeModules: false,
  applicationPaths: [
    '/src/backend/api-gateway/',
    '/src/backend/auth-service/',
    '/src/backend/gamification-engine/',
    '/src/backend/health-service/',
    '/src/backend/care-service/',
    '/src/backend/plan-service/',
    '/src/backend/notification-service/',
    '/src/backend/shared/',
    '/src/backend/packages/',
    '/src/web/'
  ],
  frameworkPaths: [
    'node_modules/@nestjs',
    'node_modules/express',
    'node_modules/fastify',
    'node_modules/next',
    'node_modules/react',
    'node_modules/react-native',
    'internal/process',
    'internal/modules',
    'internal/timers',
    'events.js',
    'node:events',
    'node:internal'
  ],
  useSourceMaps: process.env.NODE_ENV !== 'production'
};

/**
 * Parses a stack trace string into an array of structured StackFrame objects.
 * 
 * @param stack - The stack trace string to parse
 * @param options - Options for parsing the stack trace
 * @returns Array of parsed stack frames
 */
export function parseStackTrace(stack?: string, options: StackProcessingOptions = {}): StackFrame[] {
  if (!stack) {
    return [];
  }

  const opts = { ...DEFAULT_STACK_OPTIONS, ...options };
  const lines = stack.split('\n').filter(line => line.trim().startsWith('at '));
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const frame = parseStackFrame(line, opts);
    if (frame) {
      frames.push(frame);
    }

    if (frames.length >= (opts.maxFrames || DEFAULT_STACK_OPTIONS.maxFrames!)) {
      break;
    }
  }

  return frames;
}

/**
 * Parses a single stack frame line into a structured StackFrame object.
 * 
 * @param frameLine - The stack frame line to parse
 * @param options - Options for parsing the stack frame
 * @returns Parsed stack frame or null if the line couldn't be parsed
 */
function parseStackFrame(frameLine: string, options: StackProcessingOptions): StackFrame | null {
  const opts = { ...DEFAULT_STACK_OPTIONS, ...options };
  const line = frameLine.trim();
  
  if (!line.startsWith('at ')) {
    return null;
  }

  // Try to match different stack trace formats
  // Format: "at functionName (fileName:lineNumber:columnNumber)"
  const frameMatch = line.match(/at\s+([^\s]+)\s+\(([^:]+)(?::(\d+))?(?::(\d+))?\)/);
  
  // Format: "at fileName:lineNumber:columnNumber"
  const anonymousFunctionMatch = line.match(/at\s+([^:]+)(?::(\d+))?(?::(\d+))?/);
  
  let functionName = 'anonymous';
  let fileName = 'unknown';
  let lineNumber: number | undefined;
  let columnNumber: number | undefined;

  if (frameMatch) {
    functionName = frameMatch[1] || 'anonymous';
    fileName = frameMatch[2] || 'unknown';
    lineNumber = frameMatch[3] ? parseInt(frameMatch[3], 10) : undefined;
    columnNumber = frameMatch[4] ? parseInt(frameMatch[4], 10) : undefined;
  } else if (anonymousFunctionMatch) {
    fileName = anonymousFunctionMatch[1] || 'unknown';
    lineNumber = anonymousFunctionMatch[2] ? parseInt(anonymousFunctionMatch[2], 10) : undefined;
    columnNumber = anonymousFunctionMatch[3] ? parseInt(anonymousFunctionMatch[3], 10) : undefined;
  } else {
    // If we can't parse the line, just use it as is
    return {
      functionName: 'unknown',
      fileName: line.replace(/^at\s+/, ''),
      originalFrame: line
    };
  }

  const isApplicationCode = isApplicationFrame(fileName, opts);
  const isFrameworkCode = isFrameworkFrame(fileName, opts);

  // Skip node_modules frames if configured
  if (!opts.includeNodeModules && fileName.includes('node_modules') && !isApplicationCode) {
    return null;
  }

  // Skip framework frames if configured
  if (!opts.includeFrameworkFrames && isFrameworkCode) {
    return null;
  }

  return {
    functionName,
    fileName,
    lineNumber,
    columnNumber,
    isApplicationCode,
    originalFrame: line
  };
}

/**
 * Determines if a stack frame is from application code based on the file path.
 * 
 * @param filePath - The file path to check
 * @param options - Options containing application path patterns
 * @returns True if the frame is from application code, false otherwise
 */
export function isApplicationFrame(filePath: string, options: StackProcessingOptions = {}): boolean {
  const opts = { ...DEFAULT_STACK_OPTIONS, ...options };
  const applicationPaths = opts.applicationPaths || DEFAULT_STACK_OPTIONS.applicationPaths!;
  
  return applicationPaths.some(path => filePath.includes(path));
}

/**
 * Determines if a stack frame is from framework code based on the file path.
 * 
 * @param filePath - The file path to check
 * @param options - Options containing framework path patterns
 * @returns True if the frame is from framework code, false otherwise
 */
export function isFrameworkFrame(filePath: string, options: StackProcessingOptions = {}): boolean {
  const opts = { ...DEFAULT_STACK_OPTIONS, ...options };
  const frameworkPaths = opts.frameworkPaths || DEFAULT_STACK_OPTIONS.frameworkPaths!;
  
  return frameworkPaths.some(path => filePath.includes(path));
}

/**
 * Cleans a stack trace by removing internal framework frames and highlighting application code.
 * 
 * @param stack - The stack trace to clean
 * @param options - Options for cleaning the stack trace
 * @returns Cleaned stack trace string
 */
export function cleanStack(stack?: string, options: StackProcessingOptions = {}): string {
  if (!stack) {
    return '';
  }

  const opts = { ...DEFAULT_STACK_OPTIONS, ...options };
  const frames = parseStackTrace(stack, opts);
  
  if (frames.length === 0) {
    return stack; // Return original if we couldn't parse any frames
  }

  // Extract the error message from the first line
  const errorMessageMatch = stack.match(/^([^\n]+)/);
  const errorMessage = errorMessageMatch ? errorMessageMatch[1] : '';

  // Format the frames and join them with newlines
  const formattedFrames = frames.map(frame => formatStackFrame(frame));
  return `${errorMessage}\n${formattedFrames.join('\n')}`;
}

/**
 * Formats a stack frame for display, optionally highlighting application code.
 * 
 * @param frame - The stack frame to format
 * @param highlight - Whether to highlight application code
 * @returns Formatted stack frame string
 */
export function formatStackFrame(frame: StackFrame, highlight: boolean = true): string {
  const { functionName, fileName, lineNumber, columnNumber, isApplicationCode } = frame;
  
  let location = fileName;
  if (lineNumber !== undefined) {
    location += `:${lineNumber}`;
    if (columnNumber !== undefined) {
      location += `:${columnNumber}`;
    }
  }

  let formattedFrame = `    at ${functionName} (${location})`;
  
  // Add highlighting for application code in non-production environments
  if (highlight && process.env.NODE_ENV !== 'production' && isApplicationCode) {
    formattedFrame = `  → ${formattedFrame}`; // Add an arrow to highlight application frames
  }

  return formattedFrame;
}

/**
 * Extracts the most relevant frames from a stack trace for better diagnostics.
 * Prioritizes application code frames and includes surrounding context.
 * 
 * @param stack - The stack trace to extract key frames from
 * @param options - Options for extracting key frames
 * @returns Array of key stack frames
 */
export function extractKeyFrames(stack?: string, options: StackProcessingOptions = {}): StackFrame[] {
  if (!stack) {
    return [];
  }

  const opts = { 
    ...DEFAULT_STACK_OPTIONS, 
    includeFrameworkFrames: true, // We need all frames initially to determine context
    includeNodeModules: true,
    ...options 
  };
  
  const allFrames = parseStackTrace(stack, opts);
  if (allFrames.length === 0) {
    return [];
  }

  // Find application code frames
  const applicationFrames = allFrames.filter(frame => frame.isApplicationCode);
  
  // If we have application frames, use them as key frames with some context
  if (applicationFrames.length > 0) {
    const keyFrames: StackFrame[] = [];
    const maxKeyFrames = Math.min(opts.maxFrames || 10, 10);
    
    // Always include the first frame (error origin)
    keyFrames.push(allFrames[0]);
    
    // Add application frames with priority
    for (const appFrame of applicationFrames) {
      if (!keyFrames.includes(appFrame)) {
        keyFrames.push(appFrame);
        
        // Add one frame before and after for context if they exist
        const frameIndex = allFrames.indexOf(appFrame);
        if (frameIndex > 0 && !keyFrames.includes(allFrames[frameIndex - 1])) {
          keyFrames.push(allFrames[frameIndex - 1]);
        }
        if (frameIndex < allFrames.length - 1 && !keyFrames.includes(allFrames[frameIndex + 1])) {
          keyFrames.push(allFrames[frameIndex + 1]);
        }
      }
      
      if (keyFrames.length >= maxKeyFrames) {
        break;
      }
    }
    
    // Sort frames by their original order in the stack
    return keyFrames
      .sort((a, b) => allFrames.indexOf(a) - allFrames.indexOf(b))
      .slice(0, maxKeyFrames);
  }
  
  // If no application frames, just return the first few frames
  return allFrames.slice(0, Math.min(opts.maxFrames || 5, 5));
}

/**
 * Determines the likely origin of an error based on stack trace analysis.
 * 
 * @param stack - The stack trace to analyze
 * @param options - Options for analyzing the stack trace
 * @returns Object containing error origin information
 */
export function determineErrorOrigin(stack?: string, options: StackProcessingOptions = {}): {
  originFile: string;
  originFunction: string;
  originLine?: number;
  isApplicationCode: boolean;
  isFrameworkCode: boolean;
} {
  if (!stack) {
    return {
      originFile: 'unknown',
      originFunction: 'unknown',
      isApplicationCode: false,
      isFrameworkCode: false
    };
  }

  const opts = { 
    ...DEFAULT_STACK_OPTIONS, 
    includeFrameworkFrames: true,
    includeNodeModules: true,
    ...options 
  };
  
  const frames = parseStackTrace(stack, opts);
  if (frames.length === 0) {
    return {
      originFile: 'unknown',
      originFunction: 'unknown',
      isApplicationCode: false,
      isFrameworkCode: false
    };
  }

  // Find the first application code frame
  const applicationFrame = frames.find(frame => frame.isApplicationCode);
  
  // If we found an application frame, use it as the origin
  if (applicationFrame) {
    return {
      originFile: applicationFrame.fileName,
      originFunction: applicationFrame.functionName,
      originLine: applicationFrame.lineNumber,
      isApplicationCode: true,
      isFrameworkCode: false
    };
  }
  
  // Otherwise, use the first frame
  const firstFrame = frames[0];
  return {
    originFile: firstFrame.fileName,
    originFunction: firstFrame.functionName,
    originLine: firstFrame.lineNumber,
    isApplicationCode: Boolean(firstFrame.isApplicationCode),
    isFrameworkCode: isFrameworkFrame(firstFrame.fileName, opts)
  };
}

/**
 * Creates a condensed version of a stack trace for logging, focusing on the most relevant information.
 * 
 * @param stack - The stack trace to condense
 * @param options - Options for condensing the stack trace
 * @returns Condensed stack trace string
 */
export function condenseStack(stack?: string, options: StackProcessingOptions = {}): string {
  if (!stack) {
    return '';
  }

  const opts = { ...DEFAULT_STACK_OPTIONS, maxFrames: 5, ...options };
  const keyFrames = extractKeyFrames(stack, opts);
  
  if (keyFrames.length === 0) {
    return stack.split('\n')[0] || ''; // Just return the error message if we couldn't extract frames
  }

  // Extract the error message from the first line
  const errorMessageMatch = stack.match(/^([^\n]+)/);
  const errorMessage = errorMessageMatch ? errorMessageMatch[1] : '';

  // Format the key frames and join them with newlines
  const formattedFrames = keyFrames.map(frame => formatStackFrame(frame, true));
  return `${errorMessage}\n${formattedFrames.join('\n')}`;
}

/**
 * Highlights application code frames in a stack trace for better visibility.
 * 
 * @param stack - The stack trace to highlight
 * @param options - Options for highlighting the stack trace
 * @returns Highlighted stack trace string
 */
export function highlightApplicationFrames(stack?: string, options: StackProcessingOptions = {}): string {
  if (!stack) {
    return '';
  }

  const opts = { 
    ...DEFAULT_STACK_OPTIONS, 
    includeFrameworkFrames: true,
    includeNodeModules: true,
    ...options 
  };
  
  const frames = parseStackTrace(stack, opts);
  if (frames.length === 0) {
    return stack; // Return original if we couldn't parse any frames
  }

  // Extract the error message from the first line
  const errorMessageMatch = stack.match(/^([^\n]+)/);
  const errorMessage = errorMessageMatch ? errorMessageMatch[1] : '';

  // Format the frames with highlighting and join them with newlines
  const formattedFrames = frames.map(frame => formatStackFrame(frame, true));
  return `${errorMessage}\n${formattedFrames.join('\n')}`;
}

/**
 * Correlates stack frames with source maps to show original source locations in non-production environments.
 * 
 * @param stack - The stack trace to correlate
 * @param options - Options for correlating the stack trace
 * @returns Stack trace with source map correlation
 */
export function correlateWithSourceMap(stack?: string, options: StackProcessingOptions = {}): string {
  // Skip source map correlation in production
  if (process.env.NODE_ENV === 'production' || !stack) {
    return stack || '';
  }

  try {
    // This is a placeholder for actual source map correlation logic
    // In a real implementation, you would use a library like 'source-map' to correlate stack frames
    // with their original source locations
    
    // For now, we'll just return the cleaned stack trace
    return cleanStack(stack, { ...options, useSourceMaps: true });
  } catch (error) {
    // If source map correlation fails, return the original stack
    console.warn('Failed to correlate stack trace with source maps:', error);
    return stack;
  }
}

/**
 * Extracts metadata from a stack trace, such as file paths, function names, and line numbers.
 * 
 * @param stack - The stack trace to extract metadata from
 * @param options - Options for extracting metadata
 * @returns Object containing stack trace metadata
 */
export function extractStackMetadata(stack?: string, options: StackProcessingOptions = {}): {
  files: string[];
  functions: string[];
  applicationFiles: string[];
  frameworkFiles: string[];
  nodeModules: string[];
} {
  if (!stack) {
    return {
      files: [],
      functions: [],
      applicationFiles: [],
      frameworkFiles: [],
      nodeModules: []
    };
  }

  const opts = { 
    ...DEFAULT_STACK_OPTIONS, 
    includeFrameworkFrames: true,
    includeNodeModules: true,
    ...options 
  };
  
  const frames = parseStackTrace(stack, opts);
  
  const files = frames.map(frame => frame.fileName);
  const functions = frames.map(frame => frame.functionName).filter(Boolean);
  const applicationFiles = frames
    .filter(frame => frame.isApplicationCode)
    .map(frame => frame.fileName);
  const frameworkFiles = frames
    .filter(frame => isFrameworkFrame(frame.fileName, opts))
    .map(frame => frame.fileName);
  const nodeModules = frames
    .filter(frame => frame.fileName.includes('node_modules'))
    .map(frame => {
      // Extract the package name from node_modules path
      const match = frame.fileName.match(/node_modules\/([^/]+)/);
      return match ? match[1] : frame.fileName;
    });

  return {
    files: [...new Set(files)],
    functions: [...new Set(functions)],
    applicationFiles: [...new Set(applicationFiles)],
    frameworkFiles: [...new Set(frameworkFiles)],
    nodeModules: [...new Set(nodeModules)]
  };
}

/**
 * Analyzes a stack trace to identify potential error patterns and provide diagnostic information.
 * 
 * @param stack - The stack trace to analyze
 * @param options - Options for analyzing the stack trace
 * @returns Object containing diagnostic information
 */
export function analyzeStackTrace(stack?: string, options: StackProcessingOptions = {}): {
  origin: ReturnType<typeof determineErrorOrigin>;
  metadata: ReturnType<typeof extractStackMetadata>;
  keyFrames: StackFrame[];
  diagnostics: {
    hasApplicationFrames: boolean;
    hasFrameworkFrames: boolean;
    hasNodeModules: boolean;
    totalFrames: number;
    applicationFramesCount: number;
    frameworkFramesCount: number;
    nodeModulesCount: number;
    deepestApplicationFrame?: StackFrame;
  };
} {
  if (!stack) {
    return {
      origin: determineErrorOrigin(),
      metadata: extractStackMetadata(),
      keyFrames: [],
      diagnostics: {
        hasApplicationFrames: false,
        hasFrameworkFrames: false,
        hasNodeModules: false,
        totalFrames: 0,
        applicationFramesCount: 0,
        frameworkFramesCount: 0,
        nodeModulesCount: 0
      }
    };
  }

  const opts = { 
    ...DEFAULT_STACK_OPTIONS, 
    includeFrameworkFrames: true,
    includeNodeModules: true,
    ...options 
  };
  
  const allFrames = parseStackTrace(stack, opts);
  const origin = determineErrorOrigin(stack, opts);
  const metadata = extractStackMetadata(stack, opts);
  const keyFrames = extractKeyFrames(stack, opts);
  
  const applicationFrames = allFrames.filter(frame => frame.isApplicationCode);
  const frameworkFrames = allFrames.filter(frame => isFrameworkFrame(frame.fileName, opts));
  const nodeModulesFrames = allFrames.filter(frame => frame.fileName.includes('node_modules'));
  
  // Find the deepest application frame (the one that appears last in the stack)
  const deepestApplicationFrame = applicationFrames.length > 0 
    ? applicationFrames[applicationFrames.length - 1] 
    : undefined;

  return {
    origin,
    metadata,
    keyFrames,
    diagnostics: {
      hasApplicationFrames: applicationFrames.length > 0,
      hasFrameworkFrames: frameworkFrames.length > 0,
      hasNodeModules: nodeModulesFrames.length > 0,
      totalFrames: allFrames.length,
      applicationFramesCount: applicationFrames.length,
      frameworkFramesCount: frameworkFrames.length,
      nodeModulesCount: nodeModulesFrames.length,
      deepestApplicationFrame
    }
  };
}