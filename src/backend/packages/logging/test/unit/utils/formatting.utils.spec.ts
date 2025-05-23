import {
  formatError,
  formatTimestamp,
  safeSerialize,
  formatObject,
  formatContext,
  formatJourneyData,
  createLogEntry
} from '../../../src/utils/format.utils';

describe('Formatting Utilities', () => {
  describe('formatError', () => {
    it('should format Error objects with name, message and stack', () => {
      // Arrange
      const error = new Error('Test error message');
      
      // Act
      const result = formatError(error);
      
      // Assert
      expect(result).toHaveProperty('name', 'Error');
      expect(result).toHaveProperty('message', 'Test error message');
      expect(result).toHaveProperty('stack');
      expect(Array.isArray(result.stack)).toBe(true);
      expect(result.stack.length).toBeGreaterThan(0);
      expect(result.stack[0]).toHaveProperty('function');
      expect(result.stack[0]).toHaveProperty('file');
    });

    it('should handle non-Error objects by converting to string', () => {
      // Arrange
      const nonError = 'This is not an error';
      
      // Act
      const result = formatError(nonError);
      
      // Assert
      expect(result).toEqual({ message: 'This is not an error' });
    });

    it('should include additional properties from custom errors', () => {
      // Arrange
      class CustomError extends Error {
        constructor(message: string, public code: number, public context: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const customError = new CustomError('Custom error', 500, 'test-context');
      
      // Act
      const result = formatError(customError);
      
      // Assert
      expect(result).toHaveProperty('name', 'CustomError');
      expect(result).toHaveProperty('message', 'Custom error');
      expect(result).toHaveProperty('code', 500);
      expect(result).toHaveProperty('context', 'test-context');
    });
  });

  describe('formatTimestamp', () => {
    it('should format Date objects to ISO string', () => {
      // Arrange
      const date = new Date('2023-01-01T12:00:00.000Z');
      
      // Act
      const result = formatTimestamp(date);
      
      // Assert
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should use current date when no date is provided', () => {
      // Arrange
      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementationOnce(() => now as any);
      
      // Act
      const result = formatTimestamp();
      
      // Assert
      expect(result).toBe(now.toISOString());
    });
  });

  describe('safeSerialize', () => {
    it('should handle primitive types directly', () => {
      // Act & Assert
      expect(safeSerialize(null)).toBeNull();
      expect(safeSerialize(undefined)).toBeUndefined();
      expect(safeSerialize(123)).toBe(123);
      expect(safeSerialize('test')).toBe('test');
      expect(safeSerialize(true)).toBe(true);
    });

    it('should convert functions to [Function]', () => {
      // Arrange
      const fn = () => 'test';
      
      // Act
      const result = safeSerialize(fn);
      
      // Assert
      expect(result).toBe('[Function]');
    });

    it('should format Date objects using formatTimestamp', () => {
      // Arrange
      const date = new Date('2023-01-01T12:00:00.000Z');
      
      // Act
      const result = safeSerialize(date);
      
      // Assert
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle arrays by serializing each item', () => {
      // Arrange
      const array = [1, 'test', { key: 'value' }];
      
      // Act
      const result = safeSerialize(array);
      
      // Assert
      expect(result).toEqual([1, 'test', { key: 'value' }]);
    });

    it('should handle objects by serializing each property', () => {
      // Arrange
      const obj = { 
        num: 123, 
        str: 'test', 
        nested: { key: 'value' } 
      };
      
      // Act
      const result = safeSerialize(obj);
      
      // Assert
      expect(result).toEqual({
        num: 123,
        str: 'test',
        nested: { key: 'value' }
      });
    });

    it('should detect and handle circular references', () => {
      // Arrange
      const obj: any = { name: 'circular' };
      obj.self = obj; // Create circular reference
      
      // Act
      const result = safeSerialize(obj);
      
      // Assert
      expect(result).toEqual({
        name: 'circular',
        self: '[Circular Reference]'
      });
    });

    it('should limit serialization depth to prevent excessive nesting', () => {
      // Arrange - Create deeply nested object
      let deepObj: any = { level: 'max' };
      let current = deepObj;
      
      // Create an object with nesting deeper than MAX_DEPTH (10)
      for (let i = 0; i < 15; i++) {
        current.nested = { level: i };
        current = current.nested;
      }
      
      // Act
      const result = safeSerialize(deepObj);
      
      // Assert - Verify that deep nesting is truncated
      let resultObj = result;
      let depth = 0;
      
      while (resultObj.nested && typeof resultObj.nested === 'object' && depth < 20) {
        resultObj = resultObj.nested;
        depth++;
      }
      
      // Should stop at MAX_DEPTH (10) and replace with message
      expect(depth).toBeLessThan(15);
      expect(resultObj).toEqual('[Object: Nested too deep]');
    });

    it('should handle Error objects using formatError', () => {
      // Arrange
      const error = new Error('Test error');
      
      // Act
      const result = safeSerialize(error);
      
      // Assert
      expect(result).toHaveProperty('name', 'Error');
      expect(result).toHaveProperty('message', 'Test error');
      expect(result).toHaveProperty('stack');
    });
  });

  describe('formatObject', () => {
    it('should use safeSerialize to format objects', () => {
      // Arrange
      const obj = { key: 'value', nested: { prop: true } };
      const mockResult = { key: 'value', nested: { prop: true } };
      jest.spyOn({ safeSerialize }, 'safeSerialize').mockReturnValue(mockResult);
      
      // Act
      const result = formatObject(obj);
      
      // Assert
      expect(result).toEqual(mockResult);
    });
  });

  describe('formatContext', () => {
    it('should format standard context fields', () => {
      // Arrange
      const context = {
        requestId: 'req-123',
        userId: 'user-456',
        journey: 'health',
        traceId: 'trace-789',
        spanId: 'span-abc',
        extra: 'data'
      };
      
      // Act
      const result = formatContext(context);
      
      // Assert
      expect(result).toEqual({
        requestId: 'req-123',
        userId: 'user-456',
        journey: 'health',
        traceId: 'trace-789',
        spanId: 'span-abc',
        extra: 'data'
      });
    });

    it('should safely serialize complex context values', () => {
      // Arrange
      const complexValue = { nested: { data: true } };
      const context = {
        requestId: 'req-123',
        complexData: complexValue
      };
      
      // Act
      const result = formatContext(context);
      
      // Assert
      expect(result).toHaveProperty('requestId', 'req-123');
      expect(result).toHaveProperty('complexData');
      expect(result.complexData).toEqual({ nested: { data: true } });
    });
  });

  describe('formatJourneyData', () => {
    it('should format health journey data and truncate large metric arrays', () => {
      // Arrange
      const healthData = {
        metrics: Array(20).fill(0).map((_, i) => ({ id: `metric-${i}`, value: i }))
      };
      
      // Act
      const result = formatJourneyData('health', healthData);
      
      // Assert
      expect(result).toHaveProperty('metrics');
      expect(result.metrics).toHaveProperty('count', 20);
      expect(result.metrics).toHaveProperty('sample');
      expect(Array.isArray(result.metrics.sample)).toBe(true);
      expect(result.metrics.sample.length).toBe(3); // Should have 3 sample items
      expect(result.metrics).toHaveProperty('message', 'Array truncated for logging');
    });

    it('should format care journey data and truncate large appointment arrays', () => {
      // Arrange
      const careData = {
        appointments: Array(10).fill(0).map((_, i) => ({ id: `appt-${i}`, date: new Date() }))
      };
      
      // Act
      const result = formatJourneyData('care', careData);
      
      // Assert
      expect(result).toHaveProperty('appointments');
      expect(result.appointments).toHaveProperty('count', 10);
      expect(result.appointments).toHaveProperty('sample');
      expect(Array.isArray(result.appointments.sample)).toBe(true);
      expect(result.appointments.sample.length).toBe(2); // Should have 2 sample items
      expect(result.appointments).toHaveProperty('message', 'Array truncated for logging');
    });

    it('should format plan journey data and truncate large claim arrays', () => {
      // Arrange
      const planData = {
        claims: Array(10).fill(0).map((_, i) => ({ id: `claim-${i}`, amount: i * 100 }))
      };
      
      // Act
      const result = formatJourneyData('plan', planData);
      
      // Assert
      expect(result).toHaveProperty('claims');
      expect(result.claims).toHaveProperty('count', 10);
      expect(result.claims).toHaveProperty('sample');
      expect(Array.isArray(result.claims.sample)).toBe(true);
      expect(result.claims.sample.length).toBe(2); // Should have 2 sample items
      expect(result.claims).toHaveProperty('message', 'Array truncated for logging');
    });

    it('should not truncate small arrays', () => {
      // Arrange
      const healthData = {
        metrics: Array(3).fill(0).map((_, i) => ({ id: `metric-${i}`, value: i }))
      };
      
      // Act
      const result = formatJourneyData('health', healthData);
      
      // Assert
      expect(result).toHaveProperty('metrics');
      expect(Array.isArray(result.metrics)).toBe(true);
      expect(result.metrics.length).toBe(3); // Should keep original array
    });
  });

  describe('createLogEntry', () => {
    it('should create a structured log entry with required fields', () => {
      // Arrange
      const level = 'info';
      const message = 'Test log message';
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementationOnce(() => mockDate as any);
      
      // Act
      const result = createLogEntry(level, message);
      
      // Assert
      expect(result).toEqual({
        timestamp: '2023-01-01T12:00:00.000Z',
        level: 'info',
        message: 'Test log message'
      });
    });

    it('should include formatted context when provided', () => {
      // Arrange
      const level = 'warn';
      const message = 'Warning message';
      const context = { requestId: 'req-123', userId: 'user-456' };
      
      // Act
      const result = createLogEntry(level, message, context);
      
      // Assert
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('level', 'warn');
      expect(result).toHaveProperty('message', 'Warning message');
      expect(result).toHaveProperty('context');
      expect(result.context).toEqual({
        requestId: 'req-123',
        userId: 'user-456'
      });
    });

    it('should include formatted error when provided', () => {
      // Arrange
      const level = 'error';
      const message = 'Error occurred';
      const error = new Error('Test error');
      
      // Act
      const result = createLogEntry(level, message, undefined, error);
      
      // Assert
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('level', 'error');
      expect(result).toHaveProperty('message', 'Error occurred');
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('name', 'Error');
      expect(result.error).toHaveProperty('message', 'Test error');
      expect(result.error).toHaveProperty('stack');
    });

    it('should include both context and error when provided', () => {
      // Arrange
      const level = 'error';
      const message = 'Error with context';
      const context = { requestId: 'req-123' };
      const error = new Error('Context error');
      
      // Act
      const result = createLogEntry(level, message, context, error);
      
      // Assert
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('level', 'error');
      expect(result).toHaveProperty('message', 'Error with context');
      expect(result).toHaveProperty('context');
      expect(result.context).toEqual({ requestId: 'req-123' });
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('name', 'Error');
      expect(result.error).toHaveProperty('message', 'Context error');
    });
  });
});