import { chunk, chunkBySize, chunkByPredicate } from '../../../src/array/chunk.util';

describe('Array Chunking Utilities', () => {
  describe('chunk()', () => {
    it('should split an array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = chunk(array, 3);
      
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    it('should return the original array as a single chunk when size is greater than array length', () => {
      const array = [1, 2, 3];
      const result = chunk(array, 5);
      
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];
      const result = chunk(array, 3);
      
      expect(result).toEqual([]);
    });

    it('should throw an error when size is less than or equal to 0', () => {
      const array = [1, 2, 3, 4, 5];
      
      expect(() => chunk(array, 0)).toThrow('Chunk size must be greater than 0');
      expect(() => chunk(array, -1)).toThrow('Chunk size must be greater than 0');
    });

    it('should handle arrays with a single element', () => {
      const array = [1];
      const result = chunk(array, 1);
      
      expect(result).toEqual([[1]]);
    });

    it('should preserve the original array', () => {
      const array = [1, 2, 3, 4, 5];
      const originalArray = [...array];
      chunk(array, 2);
      
      expect(array).toEqual(originalArray);
    });
  });

  describe('chunkBySize()', () => {
    it('should divide an array into a specified number of chunks', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = chunkBySize(array, 3);
      
      // Should divide into 3 chunks of roughly equal size
      expect(result).toEqual([[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]]);
    });

    it('should handle when count is greater than array length', () => {
      const array = [1, 2, 3];
      const result = chunkBySize(array, 5);
      
      // Should create chunks with at most one element each
      expect(result).toEqual([[1], [2], [3], [], []]);
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];
      const result = chunkBySize(array, 3);
      
      expect(result).toEqual([[], [], []]);
    });

    it('should throw an error when count is less than or equal to 0', () => {
      const array = [1, 2, 3, 4, 5];
      
      expect(() => chunkBySize(array, 0)).toThrow('Chunk count must be greater than 0');
      expect(() => chunkBySize(array, -1)).toThrow('Chunk count must be greater than 0');
    });

    it('should handle arrays with a single element', () => {
      const array = [1];
      const result = chunkBySize(array, 1);
      
      expect(result).toEqual([[1]]);
    });

    it('should preserve the original array', () => {
      const array = [1, 2, 3, 4, 5];
      const originalArray = [...array];
      chunkBySize(array, 2);
      
      expect(array).toEqual(originalArray);
    });

    it('should distribute elements as evenly as possible', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const result = chunkBySize(array, 3);
      
      // First chunks should have more elements if distribution is uneven
      expect(result).toEqual([[1, 2, 3], [4, 5], [6, 7]]);
      
      // Check that the difference between chunk sizes is at most 1
      const sizes = result.map(chunk => chunk.length);
      const maxSize = Math.max(...sizes);
      const minSize = Math.min(...sizes);
      
      expect(maxSize - minSize).toBeLessThanOrEqual(1);
    });
  });

  describe('chunkByPredicate()', () => {
    it('should chunk array based on element equality', () => {
      const array = [1, 1, 2, 3, 3, 3, 4, 5, 5];
      const result = chunkByPredicate(array, (a, b) => a === b);
      
      expect(result).toEqual([[1, 1], [2], [3, 3, 3], [4], [5, 5]]);
    });

    it('should chunk array based on custom predicate', () => {
      const array = [1, 3, 5, 2, 4, 6, 7, 9, 11];
      // Group by even/odd
      const result = chunkByPredicate(array, (a, b) => a % 2 === b % 2);
      
      expect(result).toEqual([[1, 3, 5], [2, 4, 6], [7, 9, 11]]);
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];
      const result = chunkByPredicate(array, (a, b) => a === b);
      
      expect(result).toEqual([]);
    });

    it('should handle arrays with a single element', () => {
      const array = [1];
      const result = chunkByPredicate(array, (a, b) => a === b);
      
      expect(result).toEqual([[1]]);
    });

    it('should preserve the original array', () => {
      const array = [1, 2, 3, 4, 5];
      const originalArray = [...array];
      chunkByPredicate(array, (a, b) => a === b);
      
      expect(array).toEqual(originalArray);
    });

    it('should handle complex objects', () => {
      const array = [
        { id: 1, category: 'A' },
        { id: 2, category: 'A' },
        { id: 3, category: 'B' },
        { id: 4, category: 'B' },
        { id: 5, category: 'C' }
      ];
      
      const result = chunkByPredicate(array, (a, b) => a.category === b.category);
      
      expect(result).toEqual([
        [{ id: 1, category: 'A' }, { id: 2, category: 'A' }],
        [{ id: 3, category: 'B' }, { id: 4, category: 'B' }],
        [{ id: 5, category: 'C' }]
      ]);
    });

    it('should handle arrays with all elements satisfying the predicate', () => {
      const array = [2, 4, 6, 8, 10];
      const result = chunkByPredicate(array, (a, b) => a % 2 === b % 2); // All even
      
      expect(result).toEqual([[2, 4, 6, 8, 10]]);
    });
  });

  // Performance benchmarks
  describe('Performance', () => {
    // Helper to create a large array
    const createLargeArray = (size: number) => Array.from({ length: size }, (_, i) => i);
    
    it('should efficiently chunk large arrays with chunk()', () => {
      const largeArray = createLargeArray(10000);
      const startTime = performance.now();
      
      const result = chunk(largeArray, 100);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result.length).toBe(100);
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should efficiently divide large arrays with chunkBySize()', () => {
      const largeArray = createLargeArray(10000);
      const startTime = performance.now();
      
      const result = chunkBySize(largeArray, 10);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result.length).toBe(10);
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should efficiently chunk large arrays with chunkByPredicate()', () => {
      // Create array with alternating even/odd numbers
      const largeArray = createLargeArray(1000).map(i => i % 2 === 0 ? i : i + 1);
      const startTime = performance.now();
      
      const result = chunkByPredicate(largeArray, (a, b) => a % 4 === b % 4);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should have at most 4 chunks (for values % 4)
      expect(result.length).toBeLessThanOrEqual(4);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});