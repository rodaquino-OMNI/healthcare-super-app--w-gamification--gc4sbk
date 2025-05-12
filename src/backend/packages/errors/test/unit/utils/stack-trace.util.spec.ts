import { jest } from '@jest/globals';
import * as path from 'path';
import {
  captureStackTrace,
  cleanStackTrace,
  enhanceStackTrace,
  extractErrorOrigin,
  formatStackTrace,
  parseStackFrame,
  filterStackFrames,
  getSourceMapInfo,
} from '../../../src/utils/stack';

describe('Stack Trace Utilities', () => {
  // Mock Error.captureStackTrace to control stack trace generation
  const originalCaptureStackTrace = Error.captureStackTrace;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  afterAll(() => {
    // Restore original implementation after all tests
    Error.captureStackTrace = originalCaptureStackTrace;
  });

  describe('captureStackTrace', () => {
    it('should capture a stack trace for the current call site', () => {
      const stack = captureStackTrace();
      
      // Stack should be a string
      expect(typeof stack).toBe('string');
      
      // Stack should contain this file name
      expect(stack).toContain('stack-trace.util.spec.ts');
      
      // Stack should contain multiple lines
      expect(stack.split('\n').length).toBeGreaterThan(1);
    });

    it('should capture a stack trace from an error object', () => {
      const error = new Error('Test error');
      const stack = captureStackTrace(error);
      
      // Stack should contain the error message
      expect(stack).toContain('Test error');
      
      // Stack should contain stack frames
      expect(stack.split('\n').length).toBeGreaterThan(1);
    });

    it('should handle errors without stack traces', () => {
      const errorWithoutStack = new Error('No stack');
      delete errorWithoutStack.stack;
      
      const stack = captureStackTrace(errorWithoutStack);
      
      // Should still return a string
      expect(typeof stack).toBe('string');
      
      // Should contain the error message
      expect(stack).toContain('No stack');
    });
  });

  describe('parseStackFrame', () => {
    it('should parse a Node.js stack frame correctly', () => {
      const frame = '    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)';
      const parsed = parseStackFrame(frame);
      
      expect(parsed).toEqual({
        raw: frame,
        functionName: 'Context.<anonymous>',
        fileName: '/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts',
        lineNumber: 42,
        columnNumber: 7,
        isNative: false,
        isEval: false,
        isConstructor: false,
        isNodeInternal: false,
        isAppCode: true,
      });
    });

    it('should identify node internal frames', () => {
      const frame = '    at Module._compile (node:internal/modules/cjs/loader:1105:14)';
      const parsed = parseStackFrame(frame);
      
      expect(parsed.isNodeInternal).toBe(true);
      expect(parsed.isAppCode).toBe(false);
    });

    it('should identify node_modules frames', () => {
      const frame = '    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)';
      const parsed = parseStackFrame(frame);
      
      expect(parsed.isNodeInternal).toBe(false);
      expect(parsed.isAppCode).toBe(false);
    });

    it('should identify constructor calls', () => {
      const frame = '    at new CustomError (/project/src/backend/packages/errors/src/journey/health/custom-error.ts:15:5)';
      const parsed = parseStackFrame(frame);
      
      expect(parsed.isConstructor).toBe(true);
      expect(parsed.functionName).toBe('new CustomError');
    });

    it('should handle eval frames', () => {
      const frame = '    at eval (eval at <anonymous> (/project/src/file.js:1:1), <anonymous>:1:1)';
      const parsed = parseStackFrame(frame);
      
      expect(parsed.isEval).toBe(true);
    });

    it('should handle native frames', () => {
      const frame = '    at Array.map (<native>)';
      const parsed = parseStackFrame(frame);
      
      expect(parsed.isNative).toBe(true);
    });

    it('should handle malformed frames', () => {
      const frame = 'This is not a valid stack frame';
      const parsed = parseStackFrame(frame);
      
      expect(parsed.raw).toBe(frame);
      expect(parsed.fileName).toBeUndefined();
      expect(parsed.lineNumber).toBeUndefined();
    });
  });

  describe('filterStackFrames', () => {
    it('should filter out node_modules frames when specified', () => {
      const frames = [
        '    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)',
        '    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)',
        '    at Module._compile (node:internal/modules/cjs/loader:1105:14)',
        '    at CustomHandler (/project/src/backend/packages/errors/src/handlers/custom-handler.ts:25:3)'
      ];
      
      const filtered = filterStackFrames(frames, { removeNodeModules: true });
      
      expect(filtered.length).toBe(2);
      expect(filtered[0]).toContain('stack-trace.util.spec.ts');
      expect(filtered[1]).toContain('custom-handler.ts');
    });

    it('should filter out node internal frames when specified', () => {
      const frames = [
        '    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)',
        '    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)',
        '    at Module._compile (node:internal/modules/cjs/loader:1105:14)',
        '    at CustomHandler (/project/src/backend/packages/errors/src/handlers/custom-handler.ts:25:3)'
      ];
      
      const filtered = filterStackFrames(frames, { removeNodeInternals: true });
      
      expect(filtered.length).toBe(3);
      expect(filtered).not.toContain('    at Module._compile (node:internal/modules/cjs/loader:1105:14)');
    });

    it('should limit the number of frames when specified', () => {
      const frames = [
        '    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)',
        '    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)',
        '    at Module._compile (node:internal/modules/cjs/loader:1105:14)',
        '    at CustomHandler (/project/src/backend/packages/errors/src/handlers/custom-handler.ts:25:3)'
      ];
      
      const filtered = filterStackFrames(frames, { limit: 2 });
      
      expect(filtered.length).toBe(2);
      expect(filtered[0]).toContain('stack-trace.util.spec.ts');
      expect(filtered[1]).toContain('jest.js');
    });

    it('should only include app code when specified', () => {
      const frames = [
        '    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)',
        '    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)',
        '    at Module._compile (node:internal/modules/cjs/loader:1105:14)',
        '    at CustomHandler (/project/src/backend/packages/errors/src/handlers/custom-handler.ts:25:3)'
      ];
      
      const filtered = filterStackFrames(frames, { onlyAppCode: true });
      
      expect(filtered.length).toBe(2);
      expect(filtered[0]).toContain('stack-trace.util.spec.ts');
      expect(filtered[1]).toContain('custom-handler.ts');
    });
  });

  describe('cleanStackTrace', () => {
    it('should clean a stack trace by removing node_modules and internal frames', () => {
      const stack = `Error: Test error
    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)
    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
    at CustomHandler (/project/src/backend/packages/errors/src/handlers/custom-handler.ts:25:3)`;
      
      const cleaned = cleanStackTrace(stack);
      
      expect(cleaned).toContain('Error: Test error');
      expect(cleaned).toContain('stack-trace.util.spec.ts');
      expect(cleaned).toContain('custom-handler.ts');
      expect(cleaned).not.toContain('node_modules');
      expect(cleaned).not.toContain('node:internal');
    });

    it('should preserve the error message when cleaning', () => {
      const stack = `TypeError: Cannot read property 'id' of undefined
    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)`;
      
      const cleaned = cleanStackTrace(stack);
      
      expect(cleaned).toContain('TypeError: Cannot read property \'id\' of undefined');
    });

    it('should handle multi-line error messages', () => {
      const stack = `Error: Complex error message
with multiple lines
and details
    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)`;
      
      const cleaned = cleanStackTrace(stack);
      
      expect(cleaned).toContain('Error: Complex error message\nwith multiple lines\nand details');
    });

    it('should handle stack traces without an error message', () => {
      const stack = `    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)
    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)`;
      
      const cleaned = cleanStackTrace(stack);
      
      expect(cleaned).toContain('stack-trace.util.spec.ts');
      expect(cleaned).not.toContain('node_modules');
    });
  });

  describe('enhanceStackTrace', () => {
    it('should add contextual information to stack frames', () => {
      const stack = `Error: Test error
    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)`;
      
      const enhanced = enhanceStackTrace(stack, {
        userId: '12345',
        journeyId: 'health',
        requestId: 'req-abc-123',
      });
      
      expect(enhanced).toContain('Error: Test error');
      expect(enhanced).toContain('stack-trace.util.spec.ts');
      expect(enhanced).toContain('Context: {');
      expect(enhanced).toContain('"userId": "12345"');
      expect(enhanced).toContain('"journeyId": "health"');
      expect(enhanced).toContain('"requestId": "req-abc-123"');
    });

    it('should handle empty context object', () => {
      const stack = `Error: Test error
    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)`;
      
      const enhanced = enhanceStackTrace(stack, {});
      
      expect(enhanced).toContain('Error: Test error');
      expect(enhanced).toContain('stack-trace.util.spec.ts');
      expect(enhanced).not.toContain('Context:');
    });

    it('should handle complex context objects with nested properties', () => {
      const stack = `Error: Test error
    at Context.<anonymous> (/project/src/backend/packages/errors/test/unit/utils/stack-trace.util.spec.ts:42:7)`;
      
      const enhanced = enhanceStackTrace(stack, {
        user: {
          id: '12345',
          roles: ['admin', 'user'],
        },
        request: {
          path: '/api/health',
          method: 'GET',
        },
      });
      
      expect(enhanced).toContain('Error: Test error');
      expect(enhanced).toContain('stack-trace.util.spec.ts');
      expect(enhanced).toContain('Context: {');
      expect(enhanced).toContain('"user": {');
      expect(enhanced).toContain('"id": "12345"');
      expect(enhanced).toContain('"roles": [');
      expect(enhanced).toContain('"admin"');
    });
  });

  describe('extractErrorOrigin', () => {
    it('should extract the origin of an error from the stack trace', () => {
      const stack = `Error: Test error
    at UserService.findById (/project/src/backend/health-service/src/users/user.service.ts:42:7)
    at HealthController.getProfile (/project/src/backend/health-service/src/health/health.controller.ts:25:3)
    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)`;
      
      const origin = extractErrorOrigin(stack);
      
      expect(origin).toEqual({
        service: 'health-service',
        module: 'users',
        file: 'user.service.ts',
        function: 'UserService.findById',
        line: 42,
        column: 7,
      });
    });

    it('should handle stack traces without service information', () => {
      const stack = `Error: Test error
    at Object.<anonymous> (/project/src/utils/helper.ts:15:3)`;
      
      const origin = extractErrorOrigin(stack);
      
      expect(origin).toEqual({
        service: undefined,
        module: 'utils',
        file: 'helper.ts',
        function: 'Object.<anonymous>',
        line: 15,
        column: 3,
      });
    });

    it('should return undefined for malformed stack traces', () => {
      const stack = `Error: Test error
    This is not a valid stack frame`;
      
      const origin = extractErrorOrigin(stack);
      
      expect(origin).toBeUndefined();
    });

    it('should prioritize app code over node_modules and internals', () => {
      const stack = `Error: Test error
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)
    at UserService.findById (/project/src/backend/health-service/src/users/user.service.ts:42:7)`;
      
      const origin = extractErrorOrigin(stack);
      
      expect(origin?.file).toBe('user.service.ts');
      expect(origin?.function).toBe('UserService.findById');
    });
  });

  describe('formatStackTrace', () => {
    it('should format a stack trace with default options', () => {
      const stack = `Error: Test error
    at UserService.findById (/project/src/backend/health-service/src/users/user.service.ts:42:7)
    at Object.<anonymous> (/project/node_modules/jest/bin/jest.js:23:11)`;
      
      const formatted = formatStackTrace(stack);
      
      expect(formatted).toContain('Error: Test error');
      expect(formatted).toContain('UserService.findById');
      expect(formatted).toContain('user.service.ts:42:7');
      expect(formatted).not.toContain('/project/src/backend/health-service/src/');
      expect(formatted).not.toContain('node_modules');
    });

    it('should format a stack trace with color highlighting when specified', () => {
      const stack = `Error: Test error
    at UserService.findById (/project/src/backend/health-service/src/users/user.service.ts:42:7)`;
      
      const formatted = formatStackTrace(stack, { colors: true });
      
      // Check for ANSI color codes
      expect(formatted).toMatch(/\u001b\[/); 
      expect(formatted).toContain('Error: Test error');
    });

    it('should include line content when available', () => {
      const stack = `Error: Test error
    at UserService.findById (/project/src/backend/health-service/src/users/user.service.ts:42:7)`;
      
      // Mock the function that would normally read the file content
      jest.spyOn(global, 'require').mockImplementation(() => ({
        readFileSync: jest.fn().mockReturnValue('  const user = await this.userRepository.findById(id); // Line 42')
      }));
      
      const formatted = formatStackTrace(stack, { includeLineContent: true });
      
      expect(formatted).toContain('Error: Test error');
      expect(formatted).toContain('user.service.ts:42:7');
      expect(formatted).toContain('const user = await this.userRepository.findById(id);');
    });

    it('should handle relative paths when specified', () => {
      const stack = `Error: Test error
    at UserService.findById (/project/src/backend/health-service/src/users/user.service.ts:42:7)`;
      
      const formatted = formatStackTrace(stack, { relativePaths: true, basePath: '/project' });
      
      expect(formatted).toContain('Error: Test error');
      expect(formatted).toContain('src/backend/health-service/src/users/user.service.ts:42:7');
      expect(formatted).not.toContain('/project/');
    });
  });

  describe('getSourceMapInfo', () => {
    beforeEach(() => {
      // Mock process.env.NODE_ENV
      process.env.NODE_ENV = 'development';
      
      // Mock source-map module
      jest.mock('source-map-support', () => ({
        install: jest.fn(),
        retrieveSourceMap: jest.fn().mockReturnValue({
          url: 'file:///project/src/backend/packages/errors/src/utils/stack.ts',
          map: {
            version: 3,
            sources: ['stack.ts'],
            names: [],
            mappings: 'AAAA',
            file: 'stack.js',
            sourceRoot: '',
          },
        }),
      }));
    });

    it('should retrieve source map information for a compiled file', () => {
      const frame = {
        fileName: '/project/dist/backend/packages/errors/utils/stack.js',
        lineNumber: 42,
        columnNumber: 7,
      };
      
      const sourceMapInfo = getSourceMapInfo(frame);
      
      expect(sourceMapInfo).toBeDefined();
      expect(sourceMapInfo?.originalFile).toContain('stack.ts');
      expect(sourceMapInfo?.originalLine).toBeDefined();
      expect(sourceMapInfo?.originalColumn).toBeDefined();
    });

    it('should return undefined in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const frame = {
        fileName: '/project/dist/backend/packages/errors/utils/stack.js',
        lineNumber: 42,
        columnNumber: 7,
      };
      
      const sourceMapInfo = getSourceMapInfo(frame);
      
      expect(sourceMapInfo).toBeUndefined();
    });

    it('should handle missing source maps', () => {
      // Mock source-map module to return null
      jest.mock('source-map-support', () => ({
        install: jest.fn(),
        retrieveSourceMap: jest.fn().mockReturnValue(null),
      }));
      
      const frame = {
        fileName: '/project/dist/backend/packages/errors/utils/stack.js',
        lineNumber: 42,
        columnNumber: 7,
      };
      
      const sourceMapInfo = getSourceMapInfo(frame);
      
      expect(sourceMapInfo).toBeUndefined();
    });

    it('should handle source map errors', () => {
      // Mock source-map module to throw an error
      jest.mock('source-map-support', () => ({
        install: jest.fn(),
        retrieveSourceMap: jest.fn().mockImplementation(() => {
          throw new Error('Source map error');
        }),
      }));
      
      const frame = {
        fileName: '/project/dist/backend/packages/errors/utils/stack.js',
        lineNumber: 42,
        columnNumber: 7,
      };
      
      const sourceMapInfo = getSourceMapInfo(frame);
      
      expect(sourceMapInfo).toBeUndefined();
    });
  });
});