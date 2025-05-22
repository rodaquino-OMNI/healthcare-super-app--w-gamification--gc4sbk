import * as path from 'path';
import {
  parseStackTrace,
  isApplicationStackFrame,
  cleanStack,
  extractKeyFrames,
  determineErrorOrigin,
  condenseStack,
  correlateWithSourceMap,
  extractStackMetadata,
  enhanceErrorWithStackInfo,
  getStackInfo,
  StackTraceOptions,
  StackFrame
} from '../../../src/utils/stack';

// Mock for source-map-support
jest.mock('source-map-support', () => ({
  mapStackTrace: jest.fn((stack) => {
    // Simple mock implementation that adds a comment to show it was processed
    return stack.replace(
      /at\s+([^\s]+)\s+\(([^:]+):(\d+):(\d+)\)/g,
      'at $1 ($2:$3:$4) /* source-mapped */'
    );
  })
}));

// Helper to create a sample error with a known stack trace
function createSampleError(includeNodeModules = true): Error {
  const error = new Error('Test error');
  
  // Create a synthetic stack trace for testing
  error.stack = 'Error: Test error\n' +
    '    at Object.<anonymous> (/app/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:10:20)\n' +
    '    at Module._compile (internal/modules/cjs/loader.js:1085:14)\n' +
    '    at processTicksAndRejections (internal/process/task_queues.js:95:5)\n' +
    (includeNodeModules ? 
      '    at runMicrotasks (<anonymous>)\n' +
      '    at Router.use (/app/node_modules/express/lib/router/index.js:136:12)\n' +
      '    at NestFactory.create (/app/node_modules/@nestjs/core/nest-factory.js:97:17)\n' : '') +
    '    at UserService.findById (/app/src/backend/auth-service/src/users/users.service.ts:42:23)\n' +
    '    at AuthController.login (/app/src/backend/auth-service/src/auth/auth.controller.ts:28:35)';
  
  return error;
}

// Helper to create a sample stack trace string
function createSampleStackTrace(includeNodeModules = true): string {
  return 'Error: Test error\n' +
    '    at Object.<anonymous> (/app/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:10:20)\n' +
    '    at Module._compile (internal/modules/cjs/loader.js:1085:14)\n' +
    '    at processTicksAndRejections (internal/process/task_queues.js:95:5)\n' +
    (includeNodeModules ? 
      '    at runMicrotasks (<anonymous>)\n' +
      '    at Router.use (/app/node_modules/express/lib/router/index.js:136:12)\n' +
      '    at NestFactory.create (/app/node_modules/@nestjs/core/nest-factory.js:97:17)\n' : '') +
    '    at UserService.findById (/app/src/backend/auth-service/src/users/users.service.ts:42:23)\n' +
    '    at AuthController.login (/app/src/backend/auth-service/src/auth/auth.controller.ts:28:35)';
}

describe('Stack Trace Utilities', () => {
  // Save original NODE_ENV and restore after tests
  const originalNodeEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    // Set a consistent working directory for tests
    jest.spyOn(process, 'cwd').mockReturnValue('/app');
  });
  
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });
  
  describe('parseStackTrace', () => {
    it('should parse a stack trace string into StackFrame objects', () => {
      const stack = createSampleStackTrace();
      const frames = parseStackTrace(stack);
      
      expect(frames).toBeInstanceOf(Array);
      expect(frames.length).toBeGreaterThan(0);
      expect(frames[0]).toHaveProperty('fileName');
      expect(frames[0]).toHaveProperty('lineNumber');
      expect(frames[0]).toHaveProperty('columnNumber');
      expect(frames[0]).toHaveProperty('functionName');
      expect(frames[0]).toHaveProperty('isApplicationFrame');
      expect(frames[0]).toHaveProperty('raw');
    });
    
    it('should handle empty or invalid stack traces', () => {
      expect(parseStackTrace('')).toEqual([]);
      expect(parseStackTrace('Not a stack trace')).toEqual([]);
      expect(parseStackTrace(undefined as any)).toEqual([]);
    });
    
    it('should respect maxFrames option', () => {
      const stack = createSampleStackTrace();
      const frames = parseStackTrace(stack, { maxFrames: 3 });
      
      expect(frames.length).toBeLessThanOrEqual(3);
    });
    
    it('should correctly identify application frames', () => {
      const stack = createSampleStackTrace();
      const frames = parseStackTrace(stack);
      
      // The first frame should be an application frame (our test file)
      expect(frames[0].isApplicationFrame).toBe(true);
      
      // Node.js internal frames should not be application frames
      const internalFrame = frames.find(f => f.fileName.includes('internal/modules'));
      expect(internalFrame?.isApplicationFrame).toBe(false);
    });
    
    it('should handle eval stack frames', () => {
      const evalStack = 'Error: Test error\n' +
        '    at eval (eval at <anonymous> (/app/src/test.js:1:1), <anonymous>:1:1)';
      
      const frames = parseStackTrace(evalStack);
      expect(frames.length).toBe(1);
      expect(frames[0].fileName).toContain('/app/src/test.js');
    });
  });
  
  describe('isApplicationStackFrame', () => {
    it('should identify application frames correctly', () => {
      // Application file
      expect(isApplicationStackFrame('/app/src/backend/auth-service/src/users/users.service.ts')).toBe(true);
      
      // Node.js internal
      expect(isApplicationStackFrame('internal/modules/cjs/loader.js')).toBe(false);
      
      // node_modules
      expect(isApplicationStackFrame('/app/node_modules/express/lib/router/index.js')).toBe(false);
    });
    
    it('should respect applicationRoots option', () => {
      const options: StackTraceOptions = {
        applicationRoots: ['/custom/path']
      };
      
      expect(isApplicationStackFrame('/custom/path/file.js', options)).toBe(true);
      expect(isApplicationStackFrame('/app/src/file.js', options)).toBe(false);
    });
    
    it('should respect includeNodeModules option', () => {
      const options: StackTraceOptions = {
        includeNodeModules: true
      };
      
      expect(isApplicationStackFrame('/app/node_modules/express/lib/router/index.js', options)).toBe(true);
    });
    
    it('should handle relative paths', () => {
      // Mock path.resolve to simulate relative path resolution
      jest.spyOn(path, 'resolve').mockImplementation((p) => {
        if (p === 'src/file.js') {
          return '/app/src/file.js';
        }
        return p;
      });
      
      expect(isApplicationStackFrame('src/file.js')).toBe(true);
    });
  });
  
  describe('cleanStack', () => {
    it('should clean a stack trace by highlighting application frames', () => {
      const error = createSampleError();
      const cleaned = cleanStack(error);
      
      // Should contain the original error message
      expect(cleaned).toContain('Error: Test error');
      
      // Should highlight application frames with an arrow
      expect(cleaned).toContain('→ ');
    });
    
    it('should filter out framework frames when includeFrameworkFrames is false', () => {
      const error = createSampleError();
      const cleaned = cleanStack(error, { includeFrameworkFrames: false });
      
      // Should not contain node_modules frames
      expect(cleaned).not.toContain('node_modules/@nestjs/core');
      expect(cleaned).not.toContain('node_modules/express');
    });
    
    it('should return the original stack if all frames would be filtered out', () => {
      // Create an error with only framework frames
      const error = new Error('Framework error');
      error.stack = 'Error: Framework error\n' +
        '    at NestFactory.create (/app/node_modules/@nestjs/core/nest-factory.js:97:17)\n' +
        '    at Router.use (/app/node_modules/express/lib/router/index.js:136:12)';
      
      const cleaned = cleanStack(error, { includeFrameworkFrames: false });
      
      // Should return the original stack
      expect(cleaned).toBe(error.stack);
    });
    
    it('should handle string input', () => {
      const stack = createSampleStackTrace();
      const cleaned = cleanStack(stack);
      
      expect(cleaned).toContain('Error: Test error');
      expect(cleaned).toContain('→ ');
    });
  });
  
  describe('extractKeyFrames', () => {
    it('should extract the most important frames from a stack trace', () => {
      const error = createSampleError();
      const keyFrames = extractKeyFrames(error, { maxFrames: 3 });
      
      expect(keyFrames.length).toBeLessThanOrEqual(3);
      
      // Should prioritize application frames
      const appFrameCount = keyFrames.filter(f => f.isApplicationFrame).length;
      expect(appFrameCount).toBeGreaterThan(0);
    });
    
    it('should include framework frames if not enough application frames', () => {
      const error = createSampleError();
      const keyFrames = extractKeyFrames(error, { maxFrames: 10 });
      
      // Should include both application and framework frames
      const appFrames = keyFrames.filter(f => f.isApplicationFrame);
      const frameworkFrames = keyFrames.filter(f => !f.isApplicationFrame);
      
      expect(appFrames.length).toBeGreaterThan(0);
      expect(frameworkFrames.length).toBeGreaterThan(0);
    });
    
    it('should handle string input', () => {
      const stack = createSampleStackTrace();
      const keyFrames = extractKeyFrames(stack, { maxFrames: 3 });
      
      expect(keyFrames.length).toBeLessThanOrEqual(3);
    });
  });
  
  describe('determineErrorOrigin', () => {
    it('should determine the origin of an error based on its stack trace', () => {
      const error = createSampleError();
      const origin = determineErrorOrigin(error);
      
      expect(origin).toHaveProperty('fileName');
      expect(origin).toHaveProperty('lineNumber');
      expect(origin).toHaveProperty('columnNumber');
      expect(origin).toHaveProperty('functionName');
      expect(origin).toHaveProperty('isApplicationCode');
      
      // The first frame in our sample error is an application frame
      expect(origin.isApplicationCode).toBe(true);
    });
    
    it('should prioritize application frames over framework frames', () => {
      // Create an error with framework frames first
      const error = new Error('Mixed error');
      error.stack = 'Error: Mixed error\n' +
        '    at NestFactory.create (/app/node_modules/@nestjs/core/nest-factory.js:97:17)\n' +
        '    at UserService.findById (/app/src/backend/auth-service/src/users/users.service.ts:42:23)';
      
      const origin = determineErrorOrigin(error);
      
      // Should identify the application frame as the origin
      expect(origin.fileName).toContain('users.service.ts');
      expect(origin.isApplicationCode).toBe(true);
    });
    
    it('should handle string input', () => {
      const stack = createSampleStackTrace();
      const origin = determineErrorOrigin(stack);
      
      expect(origin.fileName).toContain('stack-trace.util.spec.ts');
    });
    
    it('should handle empty or invalid stack traces', () => {
      const origin = determineErrorOrigin('');
      
      expect(origin.fileName).toBe('<unknown>');
      expect(origin.lineNumber).toBe(0);
      expect(origin.isApplicationCode).toBe(false);
    });
  });
  
  describe('condenseStack', () => {
    it('should generate a condensed representation of a stack trace', () => {
      const error = createSampleError();
      const condensed = condenseStack(error, { maxFrames: 2 });
      
      // Should contain the error message
      expect(condensed).toContain('Error: Test error');
      
      // Should contain only file basenames
      expect(condensed).toContain('stack-trace.util.spec.ts:');
      expect(condensed).not.toContain('/app/src/backend/packages/errors/test/unit/utils/');
      
      // Should indicate truncated frames
      expect(condensed).toContain('... ');
      expect(condensed).toContain(' more');
    });
    
    it('should handle string input', () => {
      const stack = createSampleStackTrace();
      const condensed = condenseStack(stack, { maxFrames: 2 });
      
      expect(condensed).toContain('Error: Test error');
      expect(condensed).toContain('stack-trace.util.spec.ts:');
    });
    
    it('should handle empty or invalid stack traces', () => {
      expect(condenseStack('')).toBe('');
    });
  });
  
  describe('correlateWithSourceMap', () => {
    it('should not attempt source map correlation in production', () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';
      
      const error = createSampleError();
      const correlated = correlateWithSourceMap(error);
      
      // Should return the original stack
      expect(correlated).toBe(error.stack);
    });
    
    it('should attempt source map correlation in development', () => {
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
      
      const error = createSampleError();
      const correlated = correlateWithSourceMap(error);
      
      // Should contain source-mapped comment from our mock
      expect(correlated).toContain('/* source-mapped */');
    });
    
    it('should handle string input', () => {
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
      
      const stack = createSampleStackTrace();
      const correlated = correlateWithSourceMap(stack);
      
      expect(correlated).toContain('/* source-mapped */');
    });
    
    it('should handle errors when source-map-support is not available', () => {
      // Mock require to throw when source-map-support is required
      const originalRequire = require;
      global.require = jest.fn((module) => {
        if (module === 'source-map-support') {
          throw new Error('Module not found');
        }
        return originalRequire(module);
      });
      
      const error = createSampleError();
      const correlated = correlateWithSourceMap(error);
      
      // Should return the original stack
      expect(correlated).toBe(error.stack);
      
      // Restore original require
      global.require = originalRequire;
    });
  });
  
  describe('extractStackMetadata', () => {
    it('should extract metadata from a stack trace', () => {
      const error = createSampleError();
      const metadata = extractStackMetadata(error);
      
      expect(metadata).toHaveProperty('files');
      expect(metadata).toHaveProperty('functions');
      expect(metadata).toHaveProperty('applicationFrames');
      expect(metadata).toHaveProperty('frameworkFrames');
      expect(metadata).toHaveProperty('deepestFrame');
      
      // Files should be an array of file paths
      expect(Array.isArray(metadata.files)).toBe(true);
      expect(metadata.files.length).toBeGreaterThan(0);
      
      // Should have both application and framework frames
      expect(metadata.applicationFrames).toBeGreaterThan(0);
      expect(metadata.frameworkFrames).toBeGreaterThan(0);
      
      // Deepest frame should be the last one in the stack
      expect(metadata.deepestFrame.fileName).toContain('auth.controller.ts');
    });
    
    it('should handle string input', () => {
      const stack = createSampleStackTrace();
      const metadata = extractStackMetadata(stack);
      
      expect(metadata.files.length).toBeGreaterThan(0);
      expect(metadata.deepestFrame.fileName).toContain('auth.controller.ts');
    });
    
    it('should handle empty or invalid stack traces', () => {
      const metadata = extractStackMetadata('');
      
      expect(metadata.files).toEqual([]);
      expect(metadata.functions).toEqual([]);
      expect(metadata.applicationFrames).toBe(0);
      expect(metadata.frameworkFrames).toBe(0);
      expect(metadata.deepestFrame.fileName).toBe('<unknown>');
    });
  });
  
  describe('enhanceErrorWithStackInfo', () => {
    it('should enhance an error object with additional stack information', () => {
      const error = createSampleError();
      const enhanced = enhanceErrorWithStackInfo(error);
      
      // Should be the same error object
      expect(enhanced).toBe(error);
      
      // Should have _stackInfo property
      expect((enhanced as any)._stackInfo).toBeDefined();
      expect((enhanced as any)._stackInfo.origin).toBeDefined();
      expect((enhanced as any)._stackInfo.metadata).toBeDefined();
      expect((enhanced as any)._stackInfo.isApplicationError).toBeDefined();
      expect((enhanced as any)._stackInfo.frames).toBeDefined();
    });
    
    it('should handle errors without a stack trace', () => {
      const error = new Error('No stack');
      error.stack = undefined;
      
      const enhanced = enhanceErrorWithStackInfo(error);
      
      // Should be the same error object
      expect(enhanced).toBe(error);
      
      // Should not have _stackInfo property
      expect((enhanced as any)._stackInfo).toBeUndefined();
    });
  });
  
  describe('getStackInfo', () => {
    it('should get the stack info from an enhanced error object', () => {
      const error = createSampleError();
      const enhanced = enhanceErrorWithStackInfo(error);
      const stackInfo = getStackInfo(enhanced);
      
      expect(stackInfo).toBeDefined();
      expect(stackInfo?.origin).toBeDefined();
      expect(stackInfo?.metadata).toBeDefined();
      expect(stackInfo?.isApplicationError).toBeDefined();
      expect(stackInfo?.frames).toBeDefined();
    });
    
    it('should return null for non-enhanced errors', () => {
      const error = new Error('Not enhanced');
      const stackInfo = getStackInfo(error);
      
      expect(stackInfo).toBeNull();
    });
  });
});