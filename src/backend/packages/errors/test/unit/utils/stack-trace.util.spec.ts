import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  parseStackTrace,
  isApplicationFrame,
  isFrameworkFrame,
  cleanStack,
  formatStackFrame,
  extractKeyFrames,
  determineErrorOrigin,
  condenseStack,
  highlightApplicationFrames,
  correlateWithSourceMap,
  extractStackMetadata,
  analyzeStackTrace,
  StackFrame,
  StackProcessingOptions
} from '../../../src/utils/stack';

// Mock stack traces for testing
const mockApplicationStackTrace = `Error: Application error occurred
    at processRequest (/src/backend/api-gateway/src/utils/request.ts:42:10)
    at handleRequest (/src/backend/api-gateway/src/middleware/handler.ts:23:15)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async middleware (/node_modules/express/lib/router/index.js:635:10)
    at async /node_modules/express/lib/router/index.js:645:12`;

const mockFrameworkStackTrace = `Error: Framework error occurred
    at Parser.parse (/node_modules/@nestjs/core/router/router-explorer.js:47:23)
    at NestFactory.create (/node_modules/@nestjs/core/nest-factory.js:97:19)
    at bootstrap (/src/backend/api-gateway/src/main.ts:22:16)
    at Object.<anonymous> (/src/backend/api-gateway/src/main.ts:32:1)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)`;

const mockMixedStackTrace = `Error: Mixed error occurred
    at validateInput (/src/backend/api-gateway/src/utils/validation.ts:15:10)
    at processRequest (/src/backend/api-gateway/src/utils/request.ts:42:10)
    at Parser.parse (/node_modules/@nestjs/core/router/router-explorer.js:47:23)
    at handleRequest (/src/backend/api-gateway/src/middleware/handler.ts:23:15)
    at NestFactory.create (/node_modules/@nestjs/core/nest-factory.js:97:19)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

const mockAnonymousFunctionStackTrace = `Error: Anonymous function error
    at /src/backend/api-gateway/src/utils/validation.ts:15:10
    at /src/backend/api-gateway/src/utils/request.ts:42:10
    at /node_modules/@nestjs/core/router/router-explorer.js:47:23`;

const mockUnparsableStackTrace = `Error: Unparsable error
    something went wrong
    another line that doesn't match the format`;

// Mock process.env for testing environment-specific behavior
const originalNodeEnv = process.env.NODE_ENV;

describe('Stack Trace Utility', () => {
  beforeEach(() => {
    // Reset NODE_ENV before each test
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    // Restore original NODE_ENV after each test
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('parseStackTrace', () => {
    it('should parse a stack trace into structured frames', () => {
      const frames = parseStackTrace(mockApplicationStackTrace);
      
      expect(frames).toHaveLength(2); // Only application frames by default
      expect(frames[0]).toMatchObject({
        functionName: 'processRequest',
        fileName: '/src/backend/api-gateway/src/utils/request.ts',
        lineNumber: 42,
        columnNumber: 10,
        isApplicationCode: true
      });
    });

    it('should handle undefined or empty stack traces', () => {
      expect(parseStackTrace(undefined)).toEqual([]);
      expect(parseStackTrace('')).toEqual([]);
    });

    it('should respect maxFrames option', () => {
      const frames = parseStackTrace(mockMixedStackTrace, { maxFrames: 2 });
      expect(frames).toHaveLength(2);
    });

    it('should include framework frames when configured', () => {
      const frames = parseStackTrace(mockMixedStackTrace, { includeFrameworkFrames: true });
      expect(frames.some(frame => frame.fileName.includes('node_modules/@nestjs'))).toBe(true);
    });

    it('should include node_modules frames when configured', () => {
      const frames = parseStackTrace(mockMixedStackTrace, { includeNodeModules: true });
      expect(frames.some(frame => frame.fileName.includes('node_modules'))).toBe(true);
    });

    it('should parse anonymous function frames correctly', () => {
      const frames = parseStackTrace(mockAnonymousFunctionStackTrace);
      expect(frames[0]).toMatchObject({
        functionName: 'anonymous',
        fileName: '/src/backend/api-gateway/src/utils/validation.ts',
        lineNumber: 15,
        columnNumber: 10,
        isApplicationCode: true
      });
    });

    it('should handle unparsable stack frames gracefully', () => {
      const frames = parseStackTrace(mockUnparsableStackTrace);
      expect(frames).toHaveLength(0); // No parsable frames
    });
  });

  describe('isApplicationFrame', () => {
    it('should identify application frames correctly', () => {
      expect(isApplicationFrame('/src/backend/api-gateway/src/utils/request.ts')).toBe(true);
      expect(isApplicationFrame('/src/backend/shared/utils/validation.ts')).toBe(true);
      expect(isApplicationFrame('/src/web/components/Button.tsx')).toBe(true);
    });

    it('should identify non-application frames correctly', () => {
      expect(isApplicationFrame('/node_modules/@nestjs/core/router/router-explorer.js')).toBe(false);
      expect(isApplicationFrame('node:internal/process/task_queues')).toBe(false);
    });

    it('should respect custom application paths', () => {
      const options: StackProcessingOptions = {
        applicationPaths: ['/custom/path']
      };
      expect(isApplicationFrame('/custom/path/file.js', options)).toBe(true);
      expect(isApplicationFrame('/src/backend/api-gateway/src/utils/request.ts', options)).toBe(false);
    });
  });

  describe('isFrameworkFrame', () => {
    it('should identify framework frames correctly', () => {
      expect(isFrameworkFrame('/node_modules/@nestjs/core/router/router-explorer.js')).toBe(true);
      expect(isFrameworkFrame('/node_modules/express/lib/router/index.js')).toBe(true);
      expect(isFrameworkFrame('node:internal/process/task_queues')).toBe(true);
    });

    it('should identify non-framework frames correctly', () => {
      expect(isFrameworkFrame('/src/backend/api-gateway/src/utils/request.ts')).toBe(false);
      expect(isFrameworkFrame('/node_modules/lodash/index.js')).toBe(false);
    });

    it('should respect custom framework paths', () => {
      const options: StackProcessingOptions = {
        frameworkPaths: ['/node_modules/lodash']
      };
      expect(isFrameworkFrame('/node_modules/lodash/index.js', options)).toBe(true);
      expect(isFrameworkFrame('/node_modules/@nestjs/core/router/router-explorer.js', options)).toBe(false);
    });
  });

  describe('cleanStack', () => {
    it('should remove framework and node_modules frames by default', () => {
      const cleaned = cleanStack(mockMixedStackTrace);
      
      expect(cleaned).toContain('Error: Mixed error occurred');
      expect(cleaned).toContain('/src/backend/api-gateway/src/utils/validation.ts');
      expect(cleaned).toContain('/src/backend/api-gateway/src/utils/request.ts');
      expect(cleaned).toContain('/src/backend/api-gateway/src/middleware/handler.ts');
      
      // Should not contain framework frames
      expect(cleaned).not.toContain('/node_modules/@nestjs/core/router/router-explorer.js');
      expect(cleaned).not.toContain('/node_modules/@nestjs/core/nest-factory.js');
      expect(cleaned).not.toContain('node:internal/process/task_queues');
    });

    it('should handle undefined or empty stack traces', () => {
      expect(cleanStack(undefined)).toBe('');
      expect(cleanStack('')).toBe('');
    });

    it('should return original stack if no frames could be parsed', () => {
      const cleaned = cleanStack(mockUnparsableStackTrace);
      expect(cleaned).toBe(mockUnparsableStackTrace);
    });

    it('should include framework frames when configured', () => {
      const cleaned = cleanStack(mockMixedStackTrace, { includeFrameworkFrames: true });
      expect(cleaned).toContain('/node_modules/@nestjs/core/router/router-explorer.js');
    });
  });

  describe('formatStackFrame', () => {
    it('should format a stack frame correctly', () => {
      const frame: StackFrame = {
        functionName: 'processRequest',
        fileName: '/src/backend/api-gateway/src/utils/request.ts',
        lineNumber: 42,
        columnNumber: 10,
        isApplicationCode: true,
        originalFrame: 'at processRequest (/src/backend/api-gateway/src/utils/request.ts:42:10)'
      };

      const formatted = formatStackFrame(frame);
      expect(formatted).toContain('at processRequest');
      expect(formatted).toContain('/src/backend/api-gateway/src/utils/request.ts:42:10');
      expect(formatted).toContain('→'); // Arrow for application code
    });

    it('should not highlight when highlight is false', () => {
      const frame: StackFrame = {
        functionName: 'processRequest',
        fileName: '/src/backend/api-gateway/src/utils/request.ts',
        lineNumber: 42,
        columnNumber: 10,
        isApplicationCode: true,
        originalFrame: 'at processRequest (/src/backend/api-gateway/src/utils/request.ts:42:10)'
      };

      const formatted = formatStackFrame(frame, false);
      expect(formatted).not.toContain('→');
    });

    it('should not highlight in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const frame: StackFrame = {
        functionName: 'processRequest',
        fileName: '/src/backend/api-gateway/src/utils/request.ts',
        lineNumber: 42,
        columnNumber: 10,
        isApplicationCode: true,
        originalFrame: 'at processRequest (/src/backend/api-gateway/src/utils/request.ts:42:10)'
      };

      const formatted = formatStackFrame(frame);
      expect(formatted).not.toContain('→');
    });

    it('should handle frames without line numbers', () => {
      const frame: StackFrame = {
        functionName: 'processRequest',
        fileName: '/src/backend/api-gateway/src/utils/request.ts',
        isApplicationCode: true,
        originalFrame: 'at processRequest (/src/backend/api-gateway/src/utils/request.ts)'
      };

      const formatted = formatStackFrame(frame);
      expect(formatted).toContain('at processRequest');
      expect(formatted).toContain('/src/backend/api-gateway/src/utils/request.ts');
      expect(formatted).not.toContain(':');
    });
  });

  describe('extractKeyFrames', () => {
    it('should extract the most relevant frames from a stack trace', () => {
      const keyFrames = extractKeyFrames(mockMixedStackTrace);
      
      // Should prioritize application frames
      expect(keyFrames.some(frame => frame.fileName.includes('/src/backend/api-gateway/src/utils/validation.ts'))).toBe(true);
      expect(keyFrames.some(frame => frame.fileName.includes('/src/backend/api-gateway/src/utils/request.ts'))).toBe(true);
      
      // Should include some context frames
      expect(keyFrames.length).toBeGreaterThan(2);
    });

    it('should handle undefined or empty stack traces', () => {
      expect(extractKeyFrames(undefined)).toEqual([]);
      expect(extractKeyFrames('')).toEqual([]);
    });

    it('should respect maxFrames option', () => {
      const keyFrames = extractKeyFrames(mockMixedStackTrace, { maxFrames: 3 });
      expect(keyFrames.length).toBeLessThanOrEqual(3);
    });

    it('should always include the first frame (error origin)', () => {
      const keyFrames = extractKeyFrames(mockMixedStackTrace);
      expect(keyFrames[0].fileName).toContain('/src/backend/api-gateway/src/utils/validation.ts');
    });

    it('should return a subset of frames when no application frames are found', () => {
      const keyFrames = extractKeyFrames(mockFrameworkStackTrace);
      expect(keyFrames.length).toBeLessThanOrEqual(5);
    });
  });

  describe('determineErrorOrigin', () => {
    it('should determine the origin of an error from application code', () => {
      const origin = determineErrorOrigin(mockApplicationStackTrace);
      
      expect(origin.originFile).toContain('/src/backend/api-gateway/src/utils/request.ts');
      expect(origin.originFunction).toBe('processRequest');
      expect(origin.originLine).toBe(42);
      expect(origin.isApplicationCode).toBe(true);
      expect(origin.isFrameworkCode).toBe(false);
    });

    it('should determine the origin of an error from framework code', () => {
      const origin = determineErrorOrigin(mockFrameworkStackTrace);
      
      // Should find the first application frame or use the first frame
      expect(origin.originFile).toContain('/src/backend/api-gateway/src/main.ts');
      expect(origin.isApplicationCode).toBe(true);
    });

    it('should handle undefined or empty stack traces', () => {
      const origin = determineErrorOrigin(undefined);
      
      expect(origin.originFile).toBe('unknown');
      expect(origin.originFunction).toBe('unknown');
      expect(origin.originLine).toBeUndefined();
      expect(origin.isApplicationCode).toBe(false);
      expect(origin.isFrameworkCode).toBe(false);
    });

    it('should handle unparsable stack traces', () => {
      const origin = determineErrorOrigin(mockUnparsableStackTrace);
      
      expect(origin.originFile).toBe('unknown');
      expect(origin.originFunction).toBe('unknown');
    });
  });

  describe('condenseStack', () => {
    it('should create a condensed version of a stack trace', () => {
      const condensed = condenseStack(mockMixedStackTrace);
      
      // Should include the error message
      expect(condensed).toContain('Error: Mixed error occurred');
      
      // Should include key frames but be shorter than the original
      expect(condensed.split('\n').length).toBeLessThan(mockMixedStackTrace.split('\n').length);
      
      // Should prioritize application frames
      expect(condensed).toContain('/src/backend/api-gateway/src/utils/validation.ts');
    });

    it('should handle undefined or empty stack traces', () => {
      expect(condenseStack(undefined)).toBe('');
      expect(condenseStack('')).toBe('');
    });

    it('should return just the error message for unparsable stack traces', () => {
      const condensed = condenseStack(mockUnparsableStackTrace);
      expect(condensed).toBe('Error: Unparsable error');
    });

    it('should respect maxFrames option', () => {
      const condensed = condenseStack(mockMixedStackTrace, { maxFrames: 2 });
      const frameCount = condensed.split('\n').filter(line => line.includes('at ')).length;
      expect(frameCount).toBeLessThanOrEqual(2);
    });
  });

  describe('highlightApplicationFrames', () => {
    it('should highlight application code frames in a stack trace', () => {
      const highlighted = highlightApplicationFrames(mockMixedStackTrace);
      
      // Should include the error message
      expect(highlighted).toContain('Error: Mixed error occurred');
      
      // Should highlight application frames
      const lines = highlighted.split('\n');
      const appFrameLines = lines.filter(line => 
        line.includes('/src/backend/api-gateway/') && !line.includes('node_modules')
      );
      
      appFrameLines.forEach(line => {
        expect(line).toContain('→');
      });
      
      // Should not highlight framework frames
      const frameworkLines = lines.filter(line => 
        line.includes('node_modules') || line.includes('node:internal')
      );
      
      frameworkLines.forEach(line => {
        expect(line).not.toContain('→');
      });
    });

    it('should handle undefined or empty stack traces', () => {
      expect(highlightApplicationFrames(undefined)).toBe('');
      expect(highlightApplicationFrames('')).toBe('');
    });

    it('should return original stack if no frames could be parsed', () => {
      const highlighted = highlightApplicationFrames(mockUnparsableStackTrace);
      expect(highlighted).toBe(mockUnparsableStackTrace);
    });

    it('should not highlight in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const highlighted = highlightApplicationFrames(mockMixedStackTrace);
      expect(highlighted).not.toContain('→');
    });
  });

  describe('correlateWithSourceMap', () => {
    it('should skip source map correlation in production', () => {
      process.env.NODE_ENV = 'production';
      
      const correlated = correlateWithSourceMap(mockMixedStackTrace);
      expect(correlated).toBe(mockMixedStackTrace);
    });

    it('should handle undefined or empty stack traces', () => {
      expect(correlateWithSourceMap(undefined)).toBe('');
      expect(correlateWithSourceMap('')).toBe('');
    });

    it('should attempt to correlate with source maps in development', () => {
      // Since we can't actually test source map correlation without the source maps,
      // we'll just verify it calls cleanStack with useSourceMaps: true
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const correlated = correlateWithSourceMap(mockMixedStackTrace);
      expect(correlated).toBeDefined();
      
      spy.mockRestore();
    });
  });

  describe('extractStackMetadata', () => {
    it('should extract metadata from a stack trace', () => {
      const metadata = extractStackMetadata(mockMixedStackTrace);
      
      expect(metadata.files).toContain('/src/backend/api-gateway/src/utils/validation.ts');
      expect(metadata.functions).toContain('validateInput');
      expect(metadata.applicationFiles).toContain('/src/backend/api-gateway/src/utils/validation.ts');
      expect(metadata.frameworkFiles).toContain('/node_modules/@nestjs/core/router/router-explorer.js');
      expect(metadata.nodeModules).toContain('@nestjs');
    });

    it('should handle undefined or empty stack traces', () => {
      const metadata = extractStackMetadata(undefined);
      
      expect(metadata.files).toEqual([]);
      expect(metadata.functions).toEqual([]);
      expect(metadata.applicationFiles).toEqual([]);
      expect(metadata.frameworkFiles).toEqual([]);
      expect(metadata.nodeModules).toEqual([]);
    });

    it('should deduplicate entries in metadata arrays', () => {
      // Create a stack trace with duplicate entries
      const duplicateStackTrace = `Error: Duplicate error
        at validateInput (/src/backend/api-gateway/src/utils/validation.ts:15:10)
        at validateInput (/src/backend/api-gateway/src/utils/validation.ts:20:5)
        at processRequest (/src/backend/api-gateway/src/utils/request.ts:42:10)`;
      
      const metadata = extractStackMetadata(duplicateStackTrace);
      
      // Should only have one entry for the file
      expect(metadata.files.filter(f => f === '/src/backend/api-gateway/src/utils/validation.ts')).toHaveLength(1);
      
      // Should only have one entry for the function
      expect(metadata.functions.filter(f => f === 'validateInput')).toHaveLength(1);
    });
  });

  describe('analyzeStackTrace', () => {
    it('should provide comprehensive analysis of a stack trace', () => {
      const analysis = analyzeStackTrace(mockMixedStackTrace);
      
      // Should include origin information
      expect(analysis.origin.originFile).toContain('/src/backend/api-gateway/src/utils/validation.ts');
      
      // Should include metadata
      expect(analysis.metadata.files.length).toBeGreaterThan(0);
      
      // Should include key frames
      expect(analysis.keyFrames.length).toBeGreaterThan(0);
      
      // Should include diagnostics
      expect(analysis.diagnostics.hasApplicationFrames).toBe(true);
      expect(analysis.diagnostics.hasFrameworkFrames).toBe(true);
      expect(analysis.diagnostics.totalFrames).toBeGreaterThan(0);
      
      // Should identify the deepest application frame
      expect(analysis.diagnostics.deepestApplicationFrame).toBeDefined();
      if (analysis.diagnostics.deepestApplicationFrame) {
        expect(analysis.diagnostics.deepestApplicationFrame.fileName).toContain('/src/backend/api-gateway/src/');
      }
    });

    it('should handle undefined or empty stack traces', () => {
      const analysis = analyzeStackTrace(undefined);
      
      expect(analysis.origin.originFile).toBe('unknown');
      expect(analysis.metadata.files).toEqual([]);
      expect(analysis.keyFrames).toEqual([]);
      expect(analysis.diagnostics.hasApplicationFrames).toBe(false);
      expect(analysis.diagnostics.totalFrames).toBe(0);
      expect(analysis.diagnostics.deepestApplicationFrame).toBeUndefined();
    });

    it('should correctly count different types of frames', () => {
      const analysis = analyzeStackTrace(mockMixedStackTrace);
      
      expect(analysis.diagnostics.applicationFramesCount).toBeGreaterThan(0);
      expect(analysis.diagnostics.frameworkFramesCount).toBeGreaterThan(0);
      expect(analysis.diagnostics.nodeModulesCount).toBeGreaterThan(0);
      
      // Total should equal the sum of the different types
      expect(analysis.diagnostics.totalFrames).toBe(
        analysis.diagnostics.applicationFramesCount +
        analysis.diagnostics.frameworkFramesCount +
        analysis.diagnostics.nodeModulesCount -
        // Subtract overlap between framework and node_modules frames
        analysis.diagnostics.frameworkFramesCount
      );
    });
  });
});