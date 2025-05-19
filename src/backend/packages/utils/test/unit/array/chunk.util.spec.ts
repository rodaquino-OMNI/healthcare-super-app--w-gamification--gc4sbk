import { chunk, chunkBySize, chunkByPredicate, chunkByKey, chunkForParallel } from '../../../src/array/chunk.util';

describe('Array Chunking Utilities', () => {
  describe('chunk', () => {
    it('should split an array into chunks of specified size', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = chunk(input, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8]]);
    });

    it('should handle arrays with length divisible by chunk size', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = chunk(input, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle empty arrays', () => {
      const result = chunk([], 3);
      expect(result).toEqual([]);
    });

    it('should handle single-element arrays', () => {
      const result = chunk([1], 3);
      expect(result).toEqual([[1]]);
    });

    it('should throw an error if size is less than or equal to 0', () => {
      expect(() => chunk([1, 2, 3], 0)).toThrow('Chunk size must be greater than 0');
      expect(() => chunk([1, 2, 3], -1)).toThrow('Chunk size must be greater than 0');
    });

    it('should throw an error if input is not an array', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => chunk('not an array', 2)).toThrow('Input must be an array');
    });
  });

  describe('chunkBySize', () => {
    it('should split an array into specified number of chunks', () => {
      const input = [1, 2, 3, 4, 5, 6, 7];
      const result = chunkBySize(input, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5], [6, 7]]);
    });

    it('should handle arrays with length divisible by number of chunks', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = chunkBySize(input, 3);
      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle empty arrays', () => {
      const result = chunkBySize([], 3);
      expect(result).toEqual([]);
    });

    it('should handle single-element arrays', () => {
      const result = chunkBySize([1], 3);
      expect(result).toEqual([[1]]);
    });

    it('should limit number of chunks to array length', () => {
      const input = [1, 2, 3];
      const result = chunkBySize(input, 5);
      expect(result).toEqual([[1], [2], [3]]);
    });

    it('should throw an error if numChunks is less than or equal to 0', () => {
      expect(() => chunkBySize([1, 2, 3], 0)).toThrow('Number of chunks must be greater than 0');
      expect(() => chunkBySize([1, 2, 3], -1)).toThrow('Number of chunks must be greater than 0');
    });

    it('should throw an error if input is not an array', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => chunkBySize('not an array', 2)).toThrow('Input must be an array');
    });
  });

  describe('chunkByPredicate', () => {
    it('should split an array based on a predicate function', () => {
      const input = [1, 2, 3, 4, 5];
      const result = chunkByPredicate(input, n => n % 2 === 0);
      expect(result).toEqual([[1, 3, 5], [2, 4]]);
    });

    it('should handle arrays where all elements satisfy the predicate', () => {
      const input = [2, 4, 6, 8];
      const result = chunkByPredicate(input, n => n % 2 === 0);
      expect(result).toEqual([[2, 4, 6, 8]]);
    });

    it('should handle arrays where no elements satisfy the predicate', () => {
      const input = [1, 3, 5, 7];
      const result = chunkByPredicate(input, n => n % 2 === 0);
      expect(result).toEqual([[1, 3, 5, 7]]);
    });

    it('should handle empty arrays', () => {
      const result = chunkByPredicate([], n => n % 2 === 0);
      expect(result).toEqual([]);
    });

    it('should handle single-element arrays', () => {
      const result = chunkByPredicate([1], n => n % 2 === 0);
      expect(result).toEqual([[1]]);
    });

    it('should throw an error if input is not an array', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => chunkByPredicate('not an array', n => n % 2 === 0)).toThrow('Input must be an array');
    });

    it('should throw an error if predicate is not a function', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => chunkByPredicate([1, 2, 3], 'not a function')).toThrow('Predicate must be a function');
    });
  });

  describe('chunkByKey', () => {
    it('should split an array based on a key selector function', () => {
      const input = [
        { id: 1, role: 'admin' },
        { id: 2, role: 'user' },
        { id: 3, role: 'admin' },
        { id: 4, role: 'user' },
        { id: 5, role: 'guest' }
      ];
      const result = chunkByKey(input, user => user.role);
      
      // Sort the result for consistent testing
      const sortedResult = result.sort((a, b) => a[0].role.localeCompare(b[0].role));
      
      expect(sortedResult).toEqual([
        [{ id: 1, role: 'admin' }, { id: 3, role: 'admin' }],
        [{ id: 5, role: 'guest' }],
        [{ id: 2, role: 'user' }, { id: 4, role: 'user' }]
      ]);
    });

    it('should handle arrays with unique keys', () => {
      const input = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'C' }
      ];
      const result = chunkByKey(input, item => item.category);
      
      // Sort the result for consistent testing
      const sortedResult = result.sort((a, b) => a[0].category.localeCompare(b[0].category));
      
      expect(sortedResult).toEqual([
        [{ id: 1, category: 'A' }],
        [{ id: 2, category: 'B' }],
        [{ id: 3, category: 'C' }]
      ]);
    });

    it('should handle empty arrays', () => {
      const result = chunkByKey([], item => item);
      expect(result).toEqual([]);
    });

    it('should handle single-element arrays', () => {
      const input = [{ id: 1, role: 'admin' }];
      const result = chunkByKey(input, user => user.role);
      expect(result).toEqual([[{ id: 1, role: 'admin' }]]);
    });

    it('should throw an error if input is not an array', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => chunkByKey('not an array', item => item)).toThrow('Input must be an array');
    });

    it('should throw an error if key selector is not a function', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => chunkByKey([1, 2, 3], 'not a function')).toThrow('Key selector must be a function');
    });
  });

  describe('chunkForParallel', () => {
    it('should split an array into chunks optimized for parallel processing', () => {
      const input = [
        { id: 1, complexity: 5 },
        { id: 2, complexity: 2 },
        { id: 3, complexity: 7 },
        { id: 4, complexity: 3 },
        { id: 5, complexity: 4 }
      ];
      const result = chunkForParallel(input, 2, item => item.complexity);
      
      // Verify that we have 2 chunks
      expect(result.length).toBe(2);
      
      // Verify that all items are included
      const flatResult = result.flat();
      expect(flatResult.length).toBe(input.length);
      expect(new Set(flatResult.map(item => item.id))).toEqual(new Set(input.map(item => item.id)));
      
      // Verify that the chunks are balanced by weight
      const weights = result.map(chunk => 
        chunk.reduce((sum, item) => sum + item.complexity, 0)
      );
      
      // The difference between chunk weights should be minimal
      const weightDifference = Math.abs(weights[0] - weights[1]);
      expect(weightDifference).toBeLessThanOrEqual(1);
    });

    it('should use default weight of 1 when no weight selector is provided', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = chunkForParallel(input, 3);
      
      // Verify that we have 3 chunks
      expect(result.length).toBe(3);
      
      // Verify that all items are included
      const flatResult = result.flat();
      expect(flatResult.length).toBe(input.length);
      expect(new Set(flatResult)).toEqual(new Set(input));
      
      // Verify that the chunks are balanced
      expect(result.map(chunk => chunk.length)).toEqual([2, 2, 2]);
    });

    it('should handle empty arrays', () => {
      const result = chunkForParallel([], 3);
      expect(result).toEqual([]);
    });

    it('should handle single-element arrays', () => {
      const result = chunkForParallel([1], 3);
      expect(result).toEqual([[1]]);
    });

    it('should limit number of chunks to array length', () => {
      const input = [1, 2, 3];
      const result = chunkForParallel(input, 5);
      expect(result.length).toBe(3);
    });

    it('should throw an error if numChunks is less than or equal to 0', () => {
      expect(() => chunkForParallel([1, 2, 3], 0)).toThrow('Number of chunks must be greater than 0');
      expect(() => chunkForParallel([1, 2, 3], -1)).toThrow('Number of chunks must be greater than 0');
    });

    it('should throw an error if input is not an array', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => chunkForParallel('not an array', 2)).toThrow('Input must be an array');
    });
  });

  // Performance benchmarks
  describe('Performance Benchmarks', () => {
    // Helper function to create a large array
    const createLargeArray = (size: number) => Array.from({ length: size }, (_, i) => i);
    
    // Helper function to measure execution time
    const measureExecutionTime = (fn: () => void): number => {
      const start = performance.now();
      fn();
      return performance.now() - start;
    };

    it('should efficiently chunk large arrays by size', () => {
      const largeArray = createLargeArray(10000);
      const executionTime = measureExecutionTime(() => {
        chunk(largeArray, 100);
      });
      
      // Log the execution time for reference
      console.log(`Chunking 10,000 elements by size took ${executionTime.toFixed(2)}ms`);
      
      // This is not a strict test, but ensures the operation completes in a reasonable time
      expect(executionTime).toBeLessThan(100); // Should be well under 100ms on modern hardware
    });

    it('should efficiently split large arrays into chunks', () => {
      const largeArray = createLargeArray(10000);
      const executionTime = measureExecutionTime(() => {
        chunkBySize(largeArray, 10);
      });
      
      console.log(`Splitting 10,000 elements into 10 chunks took ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(100);
    });

    it('should efficiently chunk large arrays by predicate', () => {
      const largeArray = createLargeArray(10000);
      const executionTime = measureExecutionTime(() => {
        chunkByPredicate(largeArray, n => n % 2 === 0);
      });
      
      console.log(`Chunking 10,000 elements by predicate took ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(100);
    });

    it('should efficiently chunk large arrays by key', () => {
      // Create an array of objects with various keys
      const largeObjectArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        category: `Category ${i % 10}` // 10 different categories
      }));
      
      const executionTime = measureExecutionTime(() => {
        chunkByKey(largeObjectArray, item => item.category);
      });
      
      console.log(`Chunking 10,000 objects by key took ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(200); // Slightly higher threshold for more complex operation
    });

    it('should efficiently chunk large arrays for parallel processing', () => {
      // Create an array of objects with varying weights
      const largeWeightedArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        weight: Math.floor(Math.random() * 10) + 1 // Random weight between 1 and 10
      }));
      
      const executionTime = measureExecutionTime(() => {
        chunkForParallel(largeWeightedArray, 8, item => item.weight);
      });
      
      console.log(`Chunking 10,000 weighted objects for parallel processing took ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(200);
    });
  });
});