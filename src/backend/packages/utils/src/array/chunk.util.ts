/**
 * Utility functions for splitting arrays into smaller chunks with various chunking strategies.
 * These functions optimize performance when processing large datasets across journey services,
 * particularly for batch processing in the gamification engine and notification service.
 */

/**
 * Splits an array into chunks of a specified size.
 * 
 * @param array - The array to split into chunks
 * @param size - The size of each chunk (must be greater than 0)
 * @returns An array of chunks, where each chunk is an array of the original elements
 * @throws Error if size is less than or equal to 0
 * 
 * @example
 * ```typescript
 * // Split an array into chunks of size 2
 * const result = chunk([1, 2, 3, 4, 5], 2);
 * // result: [[1, 2], [3, 4], [5]]
 * ```
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  
  if (size <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }
  
  if (array.length === 0) {
    return [];
  }
  
  const result: T[][] = [];
  
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  
  return result;
};

/**
 * Splits an array into a specified number of chunks of approximately equal size.
 * 
 * @param array - The array to split into chunks
 * @param numChunks - The number of chunks to create (must be greater than 0)
 * @returns An array of chunks, where each chunk is an array of the original elements
 * @throws Error if numChunks is less than or equal to 0
 * 
 * @example
 * ```typescript
 * // Split an array into 3 chunks
 * const result = chunkBySize([1, 2, 3, 4, 5, 6, 7], 3);
 * // result: [[1, 2, 3], [4, 5], [6, 7]]
 * ```
 */
export const chunkBySize = <T>(array: T[], numChunks: number): T[][] => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  
  if (numChunks <= 0) {
    throw new Error('Number of chunks must be greater than 0');
  }
  
  if (array.length === 0) {
    return [];
  }
  
  // Ensure numChunks doesn't exceed array length
  const effectiveNumChunks = Math.min(numChunks, array.length);
  
  const result: T[][] = [];
  const chunkSize = Math.ceil(array.length / effectiveNumChunks);
  
  for (let i = 0; i < effectiveNumChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, array.length);
    result.push(array.slice(start, end));
  }
  
  return result;
};

/**
 * Splits an array into chunks based on a predicate function.
 * Elements for which the predicate returns the same value will be grouped together.
 * 
 * @param array - The array to split into chunks
 * @param predicate - A function that determines the grouping key for each element
 * @returns An array of chunks, where each chunk contains elements with the same predicate result
 * 
 * @example
 * ```typescript
 * // Group numbers by their parity (even/odd)
 * const result = chunkByPredicate([1, 2, 3, 4, 5], n => n % 2 === 0);
 * // result: [[1, 3, 5], [2, 4]]
 * ```
 */
export const chunkByPredicate = <T>(array: T[], predicate: (item: T) => boolean): T[][] => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  
  if (typeof predicate !== 'function') {
    throw new Error('Predicate must be a function');
  }
  
  if (array.length === 0) {
    return [];
  }
  
  const trueChunk: T[] = [];
  const falseChunk: T[] = [];
  
  for (const item of array) {
    if (predicate(item)) {
      trueChunk.push(item);
    } else {
      falseChunk.push(item);
    }
  }
  
  // Only return non-empty chunks
  const result: T[][] = [];
  if (falseChunk.length > 0) result.push(falseChunk);
  if (trueChunk.length > 0) result.push(trueChunk);
  
  return result;
};

/**
 * Splits an array into chunks based on a key selector function.
 * Elements for which the key selector returns the same value will be grouped together.
 * 
 * @param array - The array to split into chunks
 * @param keySelector - A function that determines the grouping key for each element
 * @returns An array of chunks, where each chunk contains elements with the same key
 * 
 * @example
 * ```typescript
 * // Group objects by a property
 * const users = [
 *   { id: 1, role: 'admin' },
 *   { id: 2, role: 'user' },
 *   { id: 3, role: 'admin' }
 * ];
 * const result = chunkByKey(users, user => user.role);
 * // result: [
 * //   [{ id: 1, role: 'admin' }, { id: 3, role: 'admin' }],
 * //   [{ id: 2, role: 'user' }]
 * // ]
 * ```
 */
export const chunkByKey = <T, K extends string | number | symbol>(
  array: T[],
  keySelector: (item: T) => K
): T[][] => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  
  if (typeof keySelector !== 'function') {
    throw new Error('Key selector must be a function');
  }
  
  if (array.length === 0) {
    return [];
  }
  
  const groups = new Map<K, T[]>();
  
  for (const item of array) {
    const key = keySelector(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  
  return Array.from(groups.values());
};

/**
 * Splits an array into chunks optimized for parallel processing.
 * This function attempts to create chunks with similar computational complexity
 * based on a weight selector function.
 * 
 * @param array - The array to split into chunks
 * @param numChunks - The number of chunks to create (must be greater than 0)
 * @param weightSelector - A function that determines the computational weight of each element
 * @returns An array of chunks, where each chunk has approximately equal total weight
 * @throws Error if numChunks is less than or equal to 0
 * 
 * @example
 * ```typescript
 * // Split tasks into chunks with balanced processing time
 * const tasks = [
 *   { id: 1, complexity: 5 },
 *   { id: 2, complexity: 2 },
 *   { id: 3, complexity: 7 },
 *   { id: 4, complexity: 3 }
 * ];
 * const result = chunkForParallel(tasks, 2, task => task.complexity);
 * // result will balance the chunks based on complexity
 * ```
 */
export const chunkForParallel = <T>(
  array: T[],
  numChunks: number,
  weightSelector: (item: T) => number = () => 1
): T[][] => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  
  if (numChunks <= 0) {
    throw new Error('Number of chunks must be greater than 0');
  }
  
  if (array.length === 0) {
    return [];
  }
  
  // Ensure numChunks doesn't exceed array length
  const effectiveNumChunks = Math.min(numChunks, array.length);
  
  // Sort items by weight in descending order
  const weightedItems = array
    .map((item, index) => ({
      item,
      weight: weightSelector(item),
      index // Preserve original order for stable sorting
    }))
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  
  // Initialize chunks with empty arrays and zero weights
  const chunks: T[][] = Array.from({ length: effectiveNumChunks }, () => []);
  const chunkWeights = Array(effectiveNumChunks).fill(0);
  
  // Distribute items using a greedy approach
  for (const { item, weight } of weightedItems) {
    // Find the chunk with the lowest current weight
    const minWeightIndex = chunkWeights.indexOf(Math.min(...chunkWeights));
    
    // Add the item to that chunk
    chunks[minWeightIndex].push(item);
    chunkWeights[minWeightIndex] += weight;
  }
  
  return chunks;
};