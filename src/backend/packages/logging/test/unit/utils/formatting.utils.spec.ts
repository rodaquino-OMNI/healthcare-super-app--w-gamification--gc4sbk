import {
  formatError,
  formatObject,
  formatArray,
  formatValue,
  formatTimestamp,
  truncateLogEntry,
  MAX_LOG_SIZE
} from '../../../src/utils/format.utils';

describe('Format Utils', () => {
  describe('formatError', () => {
    it('formats Error objects with stack trace', () => {
      // Arrange
      const testError = new Error('Test error message');
      
      // Act
      const result = formatError(testError);
      
      // Assert
      expect(result).toHaveProperty('message', 'Test error message');
      expect(result).toHaveProperty('stack');
      expect(result).toHaveProperty('name', 'Error');
    });

    it('handles errors with additional properties', () => {
      // Arrange
      const testError = new Error('Test error message');
      (testError as any).code = 'ERR_TEST';
      (testError as any).statusCode = 400;
      
      // Act
      const result = formatError(testError);
      
      // Assert
      expect(result).toHaveProperty('message', 'Test error message');
      expect(result).toHaveProperty('code', 'ERR_TEST');
      expect(result).toHaveProperty('statusCode', 400);
    });

    it('handles non-Error objects gracefully', () => {
      // Arrange
      const nonError = { message: 'Not a real error' };
      
      // Act
      const result = formatError(nonError);
      
      // Assert
      expect(result).toHaveProperty('message', 'Not a real error');
      expect(result).not.toHaveProperty('stack');
    });

    it('preserves error cause if available', () => {
      // Arrange
      const causeError = new Error('Cause error');
      const testError = new Error('Test error message', { cause: causeError });
      
      // Act
      const result = formatError(testError);
      
      // Assert
      expect(result).toHaveProperty('cause');
      expect(result.cause).toHaveProperty('message', 'Cause error');
    });
  });

  describe('formatObject', () => {
    it('formats simple objects correctly', () => {
      // Arrange
      const testObj = { name: 'Test', value: 123 };
      
      // Act
      const result = formatObject(testObj);
      
      // Assert
      expect(result).toEqual(testObj);
    });

    it('handles nested objects', () => {
      // Arrange
      const testObj = { 
        name: 'Test', 
        nested: { 
          value: 123,
          deep: {
            array: [1, 2, 3]
          }
        } 
      };
      
      // Act
      const result = formatObject(testObj);
      
      // Assert
      expect(result).toEqual(testObj);
    });

    it('detects and handles circular references', () => {
      // Arrange
      const circular: any = { name: 'Circular' };
      circular.self = circular;
      
      // Act
      const result = formatObject(circular);
      
      // Assert
      expect(result).toHaveProperty('name', 'Circular');
      expect(result.self).toEqual('[Circular Reference]');
    });

    it('handles objects with functions by removing them', () => {
      // Arrange
      const objWithFunction = {
        name: 'Test',
        method: function() { return 'test'; }
      };
      
      // Act
      const result = formatObject(objWithFunction);
      
      // Assert
      expect(result).toHaveProperty('name', 'Test');
      expect(result).not.toHaveProperty('method');
    });

    it('handles objects with undefined or null values', () => {
      // Arrange
      const objWithNulls = {
        name: 'Test',
        nullValue: null,
        undefinedValue: undefined
      };
      
      // Act
      const result = formatObject(objWithNulls);
      
      // Assert
      expect(result).toHaveProperty('name', 'Test');
      expect(result).toHaveProperty('nullValue', null);
      expect(result).not.toHaveProperty('undefinedValue');
    });
  });

  describe('formatArray', () => {
    it('formats simple arrays correctly', () => {
      // Arrange
      const testArray = [1, 2, 3, 4, 5];
      
      // Act
      const result = formatArray(testArray);
      
      // Assert
      expect(result).toEqual(testArray);
    });

    it('handles arrays with objects', () => {
      // Arrange
      const testArray = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
      
      // Act
      const result = formatArray(testArray);
      
      // Assert
      expect(result).toEqual(testArray);
    });

    it('handles arrays with circular references', () => {
      // Arrange
      const circular: any = { name: 'Circular' };
      circular.self = circular;
      const testArray = [1, circular, 3];
      
      // Act
      const result = formatArray(testArray);
      
      // Assert
      expect(result[0]).toBe(1);
      expect(result[1]).toHaveProperty('name', 'Circular');
      expect(result[1].self).toEqual('[Circular Reference]');
      expect(result[2]).toBe(3);
    });

    it('handles empty arrays', () => {
      // Arrange
      const emptyArray: any[] = [];
      
      // Act
      const result = formatArray(emptyArray);
      
      // Assert
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('formatValue', () => {
    it('returns strings unchanged', () => {
      // Arrange
      const testString = 'test string';
      
      // Act
      const result = formatValue(testString);
      
      // Assert
      expect(result).toBe(testString);
    });

    it('returns numbers unchanged', () => {
      // Arrange
      const testNumber = 123.456;
      
      // Act
      const result = formatValue(testNumber);
      
      // Assert
      expect(result).toBe(testNumber);
    });

    it('returns booleans unchanged', () => {
      // Arrange
      const testBoolean = true;
      
      // Act
      const result = formatValue(testBoolean);
      
      // Assert
      expect(result).toBe(testBoolean);
    });

    it('returns null unchanged', () => {
      // Arrange
      const testNull = null;
      
      // Act
      const result = formatValue(testNull);
      
      // Assert
      expect(result).toBe(testNull);
    });

    it('converts undefined to null', () => {
      // Arrange
      const testUndefined = undefined;
      
      // Act
      const result = formatValue(testUndefined);
      
      // Assert
      expect(result).toBe(null);
    });

    it('formats Error objects using formatError', () => {
      // Arrange
      const testError = new Error('Test error');
      
      // Act
      const result = formatValue(testError);
      
      // Assert
      expect(result).toHaveProperty('message', 'Test error');
      expect(result).toHaveProperty('stack');
    });

    it('formats objects using formatObject', () => {
      // Arrange
      const testObj = { name: 'Test', value: 123 };
      
      // Act
      const result = formatValue(testObj);
      
      // Assert
      expect(result).toEqual(testObj);
    });

    it('formats arrays using formatArray', () => {
      // Arrange
      const testArray = [1, 2, 3];
      
      // Act
      const result = formatValue(testArray);
      
      // Assert
      expect(result).toEqual(testArray);
    });

    it('converts functions to string representation', () => {
      // Arrange
      const testFunction = function() { return 'test'; };
      
      // Act
      const result = formatValue(testFunction);
      
      // Assert
      expect(result).toBe('[Function]');
    });

    it('converts symbols to string representation', () => {
      // Arrange
      const testSymbol = Symbol('test');
      
      // Act
      const result = formatValue(testSymbol);
      
      // Assert
      expect(result).toBe('Symbol(test)');
    });

    it('converts BigInt to string representation', () => {
      // Arrange
      const testBigInt = BigInt(9007199254740991);
      
      // Act
      const result = formatValue(testBigInt);
      
      // Assert
      expect(result).toBe('9007199254740991');
    });
  });

  describe('formatTimestamp', () => {
    it('formats Date objects to ISO string', () => {
      // Arrange
      const testDate = new Date('2023-01-01T12:00:00Z');
      
      // Act
      const result = formatTimestamp(testDate);
      
      // Assert
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('converts numeric timestamps to ISO string', () => {
      // Arrange
      const timestamp = 1672574400000; // 2023-01-01T12:00:00Z
      
      // Act
      const result = formatTimestamp(timestamp);
      
      // Assert
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('returns valid ISO strings unchanged', () => {
      // Arrange
      const isoString = '2023-01-01T12:00:00.000Z';
      
      // Act
      const result = formatTimestamp(isoString);
      
      // Assert
      expect(result).toBe(isoString);
    });

    it('handles invalid date strings by returning them unchanged', () => {
      // Arrange
      const invalidDate = 'not a date';
      
      // Act
      const result = formatTimestamp(invalidDate);
      
      // Assert
      expect(result).toBe(invalidDate);
    });

    it('handles duration values in milliseconds', () => {
      // Arrange
      const duration = { value: 1500, unit: 'ms' };
      
      // Act
      const result = formatTimestamp(duration);
      
      // Assert
      expect(result).toBe('1.5s');
    });

    it('handles duration values in seconds', () => {
      // Arrange
      const duration = { value: 90, unit: 's' };
      
      // Act
      const result = formatTimestamp(duration);
      
      // Assert
      expect(result).toBe('1m 30s');
    });
  });

  describe('truncateLogEntry', () => {
    it('does not modify entries smaller than the maximum size', () => {
      // Arrange
      const smallEntry = { message: 'Small log entry' };
      
      // Act
      const result = truncateLogEntry(smallEntry);
      
      // Assert
      expect(result).toEqual(smallEntry);
    });

    it('truncates large string values', () => {
      // Arrange
      const largeString = 'a'.repeat(MAX_LOG_SIZE + 1000);
      const largeEntry = { message: largeString };
      
      // Act
      const result = truncateLogEntry(largeEntry);
      
      // Assert
      expect(result.message.length).toBeLessThan(largeString.length);
      expect(result.message).toContain('[Truncated]');
    });

    it('truncates large nested objects', () => {
      // Arrange
      const largeNestedObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'a'.repeat(MAX_LOG_SIZE)
              }
            }
          }
        }
      };
      
      // Act
      const result = truncateLogEntry(largeNestedObject);
      
      // Assert
      expect(JSON.stringify(result).length).toBeLessThanOrEqual(MAX_LOG_SIZE);
    });

    it('truncates large arrays', () => {
      // Arrange
      const largeArray = Array(10000).fill('test item');
      const largeEntry = { items: largeArray };
      
      // Act
      const result = truncateLogEntry(largeEntry);
      
      // Assert
      expect(result.items.length).toBeLessThan(largeArray.length);
      expect(result.items[result.items.length - 1]).toContain('[Truncated]');
    });

    it('preserves error information when truncating', () => {
      // Arrange
      const error = new Error('Test error');
      error.stack = 'a'.repeat(MAX_LOG_SIZE); // Very large stack trace
      const entry = { error: formatError(error) };
      
      // Act
      const result = truncateLogEntry(entry);
      
      // Assert
      expect(result.error).toHaveProperty('message', 'Test error');
      expect(result.error).toHaveProperty('stack');
      expect(result.error.stack.length).toBeLessThan(error.stack!.length);
    });
  });
});