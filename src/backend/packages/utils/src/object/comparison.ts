/**
 * Object comparison utilities for deep equality testing and difference detection.
 * These utilities are used across journey services to ensure consistent object comparison
 * logic throughout the application.
 */

/**
 * Type representing the differences between two objects.
 * Each key represents a path in dot notation, and the value is an object containing the old and new values.
 */
export type ObjectDifferences = Record<string, { oldValue: any; newValue: any }>;

/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 * Handles primitive types, arrays, dates, and plain objects.
 * 
 * @template T - The type of values being compared
 * @param {T} value1 - First value to compare
 * @param {T} value2 - Second value to compare
 * @returns {boolean} True if the values are deeply equal, false otherwise
 * 
 * @example
 * isEqual({ name: 'John', scores: [1, 2] }, { name: 'John', scores: [1, 2] }); // true
 * isEqual({ name: 'John', scores: [1, 2] }, { name: 'John', scores: [1, 3] }); // false
 */
export const isEqual = <T>(value1: T, value2: T): boolean => {
  // Handle simple cases first for performance
  if (value1 === value2) {
    return true;
  }
  
  // If either value is null or undefined, they're not equal (since we already checked ===)
  if (value1 == null || value2 == null) {
    return false;
  }
  
  // Get the type of both values
  const type1 = typeof value1;
  const type2 = typeof value2;
  
  // If types are different, values are not equal
  if (type1 !== type2) {
    return false;
  }
  
  // Handle primitive types (already checked === above, so they're not equal)
  if (type1 !== 'object') {
    return false;
  }
  
  // Handle Date objects
  if (value1 instanceof Date && value2 instanceof Date) {
    return value1.getTime() === value2.getTime();
  }
  
  // Handle RegExp objects
  if (value1 instanceof RegExp && value2 instanceof RegExp) {
    return value1.toString() === value2.toString();
  }
  
  // Handle Array objects
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false;
    }
    
    // Compare each element in the arrays
    for (let i = 0; i < value1.length; i++) {
      if (!isEqual(value1[i], value2[i])) {
        return false;
      }
    }
    
    return true;
  }
  
  // Handle plain objects
  if (isPlainObject(value1) && isPlainObject(value2)) {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    
    // If number of keys is different, objects are not equal
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    // Check if all keys in value1 exist in value2 and have equal values
    for (const key of keys1) {
      if (!Object.prototype.hasOwnProperty.call(value2, key)) {
        return false;
      }
      
      if (!isEqual((value1 as any)[key], (value2 as any)[key])) {
        return false;
      }
    }
    
    return true;
  }
  
  // If we get here, the values are not equal
  return false;
};

/**
 * Identifies differences between two objects and returns them as a record of paths and value changes.
 * 
 * @template T - The type of objects being compared
 * @param {T} oldObj - The original object
 * @param {T} newObj - The new object to compare against the original
 * @param {string} [path=''] - The current path (used internally for recursion)
 * @returns {ObjectDifferences} An object containing the differences, with keys as dot-notation paths
 * @throws {Error} If either input is not an object
 * 
 * @example
 * const oldUser = { name: 'John', age: 30, address: { city: 'New York', zip: '10001' } };
 * const newUser = { name: 'John', age: 31, address: { city: 'Boston', zip: '10001' } };
 * const differences = getDifferences(oldUser, newUser);
 * // { 
 * //   'age': { oldValue: 30, newValue: 31 },
 * //   'address.city': { oldValue: 'New York', newValue: 'Boston' }
 * // }
 */
export const getDifferences = <T extends object>(oldObj: T, newObj: T, path: string = ''): ObjectDifferences => {
  if (!isPlainObject(oldObj) || !isPlainObject(newObj)) {
    throw new Error('Both inputs must be plain objects');
  }
  
  const differences: ObjectDifferences = {};
  
  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  for (const key of allKeys) {
    const oldValue = (oldObj as any)[key];
    const newValue = (newObj as any)[key];
    const currentPath = path ? `${path}.${key}` : key;
    
    // If key exists in both objects
    if (Object.prototype.hasOwnProperty.call(oldObj, key) && 
        Object.prototype.hasOwnProperty.call(newObj, key)) {
      
      // If both values are objects, recursively check for differences
      if (isPlainObject(oldValue) && isPlainObject(newValue)) {
        const nestedDifferences = getDifferences(oldValue, newValue, currentPath);
        Object.assign(differences, nestedDifferences);
      } 
      // If values are arrays, compare them
      else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        if (!isEqual(oldValue, newValue)) {
          differences[currentPath] = { oldValue, newValue };
        }
      }
      // For all other types, compare directly
      else if (!isEqual(oldValue, newValue)) {
        differences[currentPath] = { oldValue, newValue };
      }
    }
    // If key exists only in the old object
    else if (Object.prototype.hasOwnProperty.call(oldObj, key)) {
      differences[currentPath] = { oldValue, newValue: undefined };
    }
    // If key exists only in the new object
    else {
      differences[currentPath] = { oldValue: undefined, newValue };
    }
  }
  
  return differences;
};

/**
 * Checks if an object has any differences compared to another object.
 * More efficient than getDifferences when you only need to know if there are any differences.
 * 
 * @template T - The type of objects being compared
 * @param {T} oldObj - The original object
 * @param {T} newObj - The new object to compare against the original
 * @returns {boolean} True if there are any differences, false if the objects are deeply equal
 * @throws {Error} If either input is not an object
 * 
 * @example
 * const oldUser = { name: 'John', age: 30 };
 * const newUser = { name: 'John', age: 31 };
 * const hasDifferences = hasDifferences(oldUser, newUser); // true
 */
export const hasDifferences = <T extends object>(oldObj: T, newObj: T): boolean => {
  if (!isPlainObject(oldObj) || !isPlainObject(newObj)) {
    throw new Error('Both inputs must be plain objects');
  }
  
  // Quick check: if the objects are the same instance, no differences
  if (oldObj === newObj) {
    return false;
  }
  
  // Quick check: if the objects have different number of keys, they have differences
  const oldKeys = Object.keys(oldObj);
  const newKeys = Object.keys(newObj);
  
  if (oldKeys.length !== newKeys.length) {
    return true;
  }
  
  // Check if any key in oldObj has a different value in newObj
  for (const key of oldKeys) {
    if (!Object.prototype.hasOwnProperty.call(newObj, key)) {
      return true;
    }
    
    const oldValue = (oldObj as any)[key];
    const newValue = (newObj as any)[key];
    
    // If both values are objects, recursively check for differences
    if (isPlainObject(oldValue) && isPlainObject(newValue)) {
      if (hasDifferences(oldValue, newValue)) {
        return true;
      }
    }
    // If values are arrays or other types, compare them
    else if (!isEqual(oldValue, newValue)) {
      return true;
    }
  }
  
  // Check if newObj has any keys that oldObj doesn't have
  for (const key of newKeys) {
    if (!Object.prototype.hasOwnProperty.call(oldObj, key)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Type guard to check if a value is a plain object (not an array, null, or a class instance).
 * 
 * @param {any} value - The value to check
 * @returns {boolean} True if the value is a plain object, false otherwise
 * 
 * @example
 * isPlainObject({}); // true
 * isPlainObject([]); // false
 * isPlainObject(null); // false
 * isPlainObject(new Date()); // false
 */
export const isPlainObject = (value: any): value is Record<string, any> => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value !== 'object') {
    return false;
  }
  
  if (Array.isArray(value)) {
    return false;
  }
  
  // Check if the object is a plain object (created by {} or new Object())
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

/**
 * Checks if an object is a subset of another object (all properties in subset exist in superset with the same values).
 * 
 * @template T - The type of the superset object
 * @template U - The type of the subset object (should be assignable to a partial of T)
 * @param {T} superset - The object that should contain all properties of the subset
 * @param {U} subset - The object whose properties should all exist in the superset
 * @returns {boolean} True if all properties in subset exist in superset with the same values
 * @throws {Error} If either input is not an object
 * 
 * @example
 * const user = { id: 1, name: 'John', age: 30, email: 'john@example.com' };
 * const subset = { id: 1, name: 'John' };
 * isSubset(user, subset); // true
 */
export const isSubset = <T extends object, U extends Partial<T>>(superset: T, subset: U): boolean => {
  if (!isPlainObject(superset) || !isPlainObject(subset)) {
    throw new Error('Both inputs must be plain objects');
  }
  
  for (const key in subset) {
    if (Object.prototype.hasOwnProperty.call(subset, key)) {
      // If the key doesn't exist in the superset, it's not a subset
      if (!Object.prototype.hasOwnProperty.call(superset, key)) {
        return false;
      }
      
      const subsetValue = subset[key];
      const supersetValue = (superset as any)[key];
      
      // If both values are objects, recursively check if subsetValue is a subset of supersetValue
      if (isPlainObject(subsetValue) && isPlainObject(supersetValue)) {
        if (!isSubset(supersetValue, subsetValue)) {
          return false;
        }
      }
      // If values are arrays or other types, compare them for equality
      else if (!isEqual(subsetValue, supersetValue)) {
        return false;
      }
    }
  }
  
  return true;
};