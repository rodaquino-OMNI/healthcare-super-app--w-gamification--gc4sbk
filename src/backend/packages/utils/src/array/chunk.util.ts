/**
 * Utility functions for splitting arrays into smaller chunks with various chunking strategies.
 * These functions optimize performance when processing large datasets across journey services,
 * particularly for batch processing in the gamification engine and notification service.
 */

/**
 * Splits an array into chunks of a specified size.
 * 
 * @param arr - The array to split into chunks
 * @param size - The size of each chunk (must be greater than 0)
 * @returns An array of chunks, each containing up to 'size' elements
 * @throws Error if the input is not an array or if size is not a positive integer
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // returns [[1, 2], [3, 4], [5]]
 * chunk(['a', 'b', 'c', 'd'], 3); // returns [['a', 'b', 'c'], ['d']]
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('Chunk size must be a positive integer');
  }

  const result: T[][] = [];
  
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  
  return result;
};

/**
 * Splits an array into a specified number of chunks of approximately equal size.
 * If the array cannot be divided equally, some chunks may have one more element than others.
 * 
 * @param arr - The array to split into chunks
 * @param numChunks - The number of chunks to create (must be greater than 0)
 * @returns An array of chunks with approximately equal size
 * @throws Error if the input is not an array or if numChunks is not a positive integer
 * @example
 * chunkBySize([1, 2, 3, 4, 5], 2); // returns [[1, 2, 3], [4, 5]]
 * chunkBySize(['a', 'b', 'c', 'd', 'e', 'f'], 4); // returns [['a', 'b'], ['c', 'd'], ['e'], ['f']]
 */
export const chunkBySize = <T>(arr: T[], numChunks: number): T[][] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (!Number.isInteger(numChunks) || numChunks <= 0) {
    throw new Error('Number of chunks must be a positive integer');
  }

  // If array is empty or numChunks is 1, return the array as a single chunk
  if (arr.length === 0) {
    return [[]];
  }
  
  if (numChunks === 1) {
    return [arr.slice()];
  }

  // If numChunks is greater than array length, each element gets its own chunk
  if (numChunks >= arr.length) {
    return arr.map(item => [item]);
  }

  const result: T[][] = [];
  const chunkSize = Math.ceil(arr.length / numChunks);
  
  // Create chunks of approximately equal size
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  
  return result;
};

/**
 * Splits an array into chunks based on a predicate function.
 * Elements for which the predicate returns the same value are grouped together.
 * 
 * @param arr - The array to split into chunks
 * @param predicate - A function that determines the chunk an element belongs to
 * @returns An array of chunks grouped by predicate result
 * @throws Error if the input is not an array or if predicate is not a function
 * @example
 * // Group numbers by even/odd
 * chunkByPredicate([1, 2, 3, 4, 5], n => n % 2 === 0); // returns [[2, 4], [1, 3, 5]]
 * 
 * // Group strings by first letter
 * chunkByPredicate(['apple', 'banana', 'apricot', 'cherry', 'blueberry'], s => s[0]);
 * // returns [['apple', 'apricot'], ['banana', 'blueberry'], ['cherry']]
 */
export const chunkByPredicate = <T, K extends string | number | symbol>(
  arr: T[],
  predicate: (item: T) => K
): T[][] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof predicate !== 'function') {
    throw new Error('Predicate must be a function');
  }

  // Group items by predicate result
  const groups = arr.reduce((result: Record<string, T[]>, item: T) => {
    try {
      const key = String(predicate(item));
      
      if (!result[key]) {
        result[key] = [];
      }
      
      result[key].push(item);
    } catch (error) {
      // If predicate throws an error, create a special group for errors
      const errorKey = 'ERROR';
      if (!result[errorKey]) {
        result[errorKey] = [];
      }
      result[errorKey].push(item);
      console.warn('Error in chunkByPredicate:', error);
    }
    
    return result;
  }, {});

  // Convert the groups object to an array of arrays
  return Object.values(groups);
};

/**
 * Splits an array into chunks, ensuring that the total size of elements in each chunk
 * does not exceed a specified maximum size based on a size calculation function.
 * This is useful for batching API requests or database operations with size constraints.
 * 
 * @param arr - The array to split into chunks
 * @param maxSize - The maximum total size for each chunk
 * @param sizeCalculator - A function that calculates the size of an element
 * @returns An array of chunks, each with a total size not exceeding maxSize
 * @throws Error if the input is not an array, maxSize is not positive, or sizeCalculator is not a function
 * @example
 * // Chunk an array of objects by total payload size
 * const data = [
 *   { id: 1, payload: 'x'.repeat(500) },
 *   { id: 2, payload: 'x'.repeat(300) },
 *   { id: 3, payload: 'x'.repeat(200) },
 *   { id: 4, payload: 'x'.repeat(800) }
 * ];
 * chunkByMaxSize(data, 1000, item => item.payload.length);
 * // returns [
 * //   [{ id: 1, payload: 'x'.repeat(500) }, { id: 2, payload: 'x'.repeat(300) }, { id: 3, payload: 'x'.repeat(200) }],
 * //   [{ id: 4, payload: 'x'.repeat(800) }]
 * // ]
 */
export const chunkByMaxSize = <T>(
  arr: T[],
  maxSize: number,
  sizeCalculator: (item: T) => number
): T[][] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (!Number.isFinite(maxSize) || maxSize <= 0) {
    throw new Error('Maximum size must be a positive number');
  }

  if (typeof sizeCalculator !== 'function') {
    throw new Error('Size calculator must be a function');
  }

  const result: T[][] = [];
  let currentChunk: T[] = [];
  let currentSize = 0;

  for (const item of arr) {
    try {
      const itemSize = sizeCalculator(item);
      
      if (itemSize > maxSize) {
        // If a single item exceeds maxSize, place it in its own chunk
        if (currentChunk.length > 0) {
          result.push(currentChunk);
          currentChunk = [];
          currentSize = 0;
        }
        result.push([item]);
      } else if (currentSize + itemSize > maxSize) {
        // If adding this item would exceed maxSize, start a new chunk
        result.push(currentChunk);
        currentChunk = [item];
        currentSize = itemSize;
      } else {
        // Add item to the current chunk
        currentChunk.push(item);
        currentSize += itemSize;
      }
    } catch (error) {
      // If sizeCalculator throws an error, place the item in its own chunk
      if (currentChunk.length > 0) {
        result.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }
      result.push([item]);
      console.warn('Error in chunkByMaxSize:', error);
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    result.push(currentChunk);
  }

  return result;
};

/**
 * Splits an array into chunks based on a boundary condition.
 * A new chunk is started whenever the boundary function returns true for adjacent elements.
 * 
 * @param arr - The array to split into chunks
 * @param isBoundary - A function that determines if a new chunk should start between two elements
 * @returns An array of chunks separated by boundary conditions
 * @throws Error if the input is not an array or if isBoundary is not a function
 * @example
 * // Split numbers at increasing values
 * chunkByBoundary([1, 3, 5, 2, 4, 1, 7], (curr, next) => next < curr);
 * // returns [[1, 3, 5], [2, 4], [1, 7]]
 * 
 * // Split dates by month boundaries
 * const dates = ['2023-01-28', '2023-01-31', '2023-02-01', '2023-02-15', '2023-03-01'];
 * chunkByBoundary(dates, (curr, next) => curr.substring(0, 7) !== next.substring(0, 7));
 * // returns [['2023-01-28', '2023-01-31'], ['2023-02-01', '2023-02-15'], ['2023-03-01']]
 */
export const chunkByBoundary = <T>(
  arr: T[],
  isBoundary: (current: T, next: T, index: number) => boolean
): T[][] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof isBoundary !== 'function') {
    throw new Error('Boundary function must be a function');
  }

  if (arr.length === 0) {
    return [[]];
  }

  const result: T[][] = [];
  let currentChunk: T[] = [arr[0]];

  for (let i = 0; i < arr.length - 1; i++) {
    const current = arr[i];
    const next = arr[i + 1];
    
    try {
      if (isBoundary(current, next, i)) {
        // Boundary detected, start a new chunk
        result.push(currentChunk);
        currentChunk = [next];
      } else {
        // Continue current chunk
        currentChunk.push(next);
      }
    } catch (error) {
      // If boundary function throws an error, treat it as a boundary
      result.push(currentChunk);
      currentChunk = [next];
      console.warn('Error in chunkByBoundary:', error);
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    result.push(currentChunk);
  }

  return result;
};