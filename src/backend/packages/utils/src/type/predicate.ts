/**
 * Type predicate utilities for accurate type narrowing in TypeScript.
 * 
 * These predicates serve as type guards that inform the TypeScript compiler
 * about the resulting type when the function returns true, enabling proper
 * type narrowing in conditional blocks.
 * 
 * @module
 */

import { isArray, isObject, isString, isNumber, isBoolean, isDate, isFunction } from './guard';

/**
 * Type predicate to check if a value is a non-null object of a specific interface type.
 * 
 * @template T - The interface type to check against
 * @param value - The value to check
 * @returns Type predicate indicating if the value is a non-null object of type T
 * 
 * @example
 * interface User { id: string; name: string }
 * 
 * function processData(data: User | string) {
 *   if (isInterface<User>(data)) {
 *     // TypeScript now knows data is User
 *     console.log(data.name);
 *   } else {
 *     // TypeScript now knows data is string
 *     console.log(data.toUpperCase());
 *   }
 * }
 */
export function isInterface<T extends object>(value: unknown): value is T {
  return isObject(value);
}

/**
 * Type predicate to check if a value is an instance of a specific class.
 * 
 * @template T - The class type to check against
 * @param value - The value to check
 * @param classConstructor - The class constructor to check against
 * @returns Type predicate indicating if the value is an instance of the specified class
 * 
 * @example
 * class HealthMetric { 
 *   constructor(public value: number, public unit: string) {}
 * }
 * 
 * function processMetric(data: HealthMetric | { value: number }) {
 *   if (isInstanceOf(data, HealthMetric)) {
 *     // TypeScript now knows data is HealthMetric
 *     console.log(data.unit);
 *   } else {
 *     // TypeScript now knows data is { value: number }
 *     console.log(data.value);
 *   }
 * }
 */
export function isInstanceOf<T>(value: unknown, classConstructor: new (...args: any[]) => T): value is T {
  return value instanceof classConstructor;
}

/**
 * Type predicate to check if an object has a specific property.
 * 
 * @template T - The object type
 * @template K - The property key type (string | number | symbol)
 * @param obj - The object to check
 * @param prop - The property to check for
 * @returns Type predicate indicating if the object has the specified property
 * 
 * @example
 * interface BasicUser { id: string; }
 * interface AdminUser extends BasicUser { permissions: string[]; }
 * 
 * function hasAdminAccess(user: BasicUser) {
 *   if (hasProperty(user, 'permissions')) {
 *     // TypeScript now knows user has permissions property
 *     return user.permissions.includes('ADMIN');
 *   }
 *   return false;
 * }
 */
export function hasProperty<T, K extends PropertyKey>(
  obj: T, 
  prop: K
): obj is T & Record<K, unknown> {
  return isObject(obj) && prop in obj;
}

/**
 * Type predicate to check if an object has a property of a specific type.
 * 
 * @template T - The object type
 * @template K - The property key type (string | number | symbol)
 * @template V - The expected property value type
 * @param obj - The object to check
 * @param prop - The property to check for
 * @param typePredicate - A type predicate function to validate the property value
 * @returns Type predicate indicating if the object has the property with the specified type
 * 
 * @example
 * interface User { id: string; metadata?: { roles?: string[] } }
 * 
 * function hasAdminRole(user: User) {
 *   if (hasPropertyOfType(user, 'metadata', isObject) && 
 *       hasPropertyOfType(user.metadata, 'roles', isArray)) {
 *     // TypeScript now knows user.metadata.roles is an array
 *     return user.metadata.roles.includes('ADMIN');
 *   }
 *   return false;
 * }
 */
export function hasPropertyOfType<T, K extends PropertyKey, V>(
  obj: T, 
  prop: K, 
  typePredicate: (value: unknown) => value is V
): obj is T & Record<K, V> {
  return hasProperty(obj, prop) && typePredicate(obj[prop as keyof T]);
}

/**
 * Type predicate to check if a value is a non-empty array.
 * 
 * @template T - The array element type
 * @param value - The value to check
 * @returns Type predicate indicating if the value is a non-empty array of type T
 * 
 * @example
 * function processItems<T>(items: T[] | null | undefined) {
 *   if (isNonEmptyArray(items)) {
 *     // TypeScript now knows items is a non-empty array
 *     const firstItem = items[0]; // Safe access
 *     // Process items...
 *   } else {
 *     console.log('No items to process');
 *   }
 * }
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return isArray(value) && value.length > 0;
}

/**
 * Type predicate to check if a value is a non-empty array of a specific element type.
 * 
 * @template T - The expected array element type
 * @param value - The value to check
 * @param elementPredicate - A type predicate function to validate each array element
 * @returns Type predicate indicating if the value is a non-empty array with elements of type T
 * 
 * @example
 * function processStringItems(items: unknown) {
 *   if (isNonEmptyArrayOf(items, isString)) {
 *     // TypeScript now knows items is a non-empty array of strings
 *     const uppercased = items.map(item => item.toUpperCase());
 *     // Process string items...
 *   }
 * }
 */
export function isNonEmptyArrayOf<T>(
  value: unknown, 
  elementPredicate: (element: unknown) => element is T
): value is [T, ...T[]] {
  return isNonEmptyArray(value) && value.every(elementPredicate);
}

/**
 * Type predicate to check if a value is a string with content (non-empty after trimming).
 * 
 * @param value - The value to check
 * @returns Type predicate indicating if the value is a non-empty string
 * 
 * @example
 * function processName(name: string | null | undefined) {
 *   if (isNonEmptyString(name)) {
 *     // TypeScript now knows name is a non-empty string
 *     return `Hello, ${name}!`;
 *   }
 *   return 'Hello, Guest!';
 * }
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * Type predicate to check if a value is a finite number (not NaN or Infinity).
 * 
 * @param value - The value to check
 * @returns Type predicate indicating if the value is a finite number
 * 
 * @example
 * function calculateAverage(values: Array<number | null | undefined>) {
 *   const validNumbers = values.filter(isFiniteNumber);
 *   if (isNonEmptyArray(validNumbers)) {
 *     // TypeScript now knows validNumbers is a non-empty array of finite numbers
 *     return validNumbers.reduce((sum, num) => sum + num, 0) / validNumbers.length;
 *   }
 *   return 0;
 * }
 */
export function isFiniteNumber(value: unknown): value is number {
  return isNumber(value) && Number.isFinite(value);
}

/**
 * Type predicate to check if a value is a valid Date object (not Invalid Date).
 * 
 * @param value - The value to check
 * @returns Type predicate indicating if the value is a valid Date object
 * 
 * @example
 * function formatDate(date: Date | string | null) {
 *   if (isValidDate(date)) {
 *     // TypeScript now knows date is a valid Date object
 *     return date.toLocaleDateString();
 *   } else if (isString(date)) {
 *     const parsedDate = new Date(date);
 *     return isValidDate(parsedDate) ? parsedDate.toLocaleDateString() : 'Invalid date';
 *   }
 *   return 'No date provided';
 * }
 */
export function isValidDate(value: unknown): value is Date {
  return isDate(value) && !isNaN(value.getTime());
}

/**
 * Type predicate to check if a value is a Promise.
 * 
 * @template T - The type that the Promise resolves to
 * @param value - The value to check
 * @returns Type predicate indicating if the value is a Promise of type T
 * 
 * @example
 * async function processResult<T>(result: T | Promise<T>) {
 *   if (isPromise<T>(result)) {
 *     // TypeScript now knows result is a Promise<T>
 *     return await result;
 *   }
 *   // TypeScript now knows result is T
 *   return result;
 * }
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as any).then === 'function' &&
    typeof (value as any).catch === 'function'
  );
}

/**
 * Type predicate to check if a value is a record with string keys and values of a specific type.
 * 
 * @template T - The expected value type in the record
 * @param value - The value to check
 * @param valuePredicate - A type predicate function to validate each value in the record
 * @returns Type predicate indicating if the value is a record with values of type T
 * 
 * @example
 * function processUserRoles(roles: unknown) {
 *   if (isRecordOf(roles, isBoolean)) {
 *     // TypeScript now knows roles is a Record<string, boolean>
 *     const activeRoles = Object.entries(roles)
 *       .filter(([_, isActive]) => isActive)
 *       .map(([role]) => role);
 *     // Process active roles...
 *   }
 * }
 */
export function isRecordOf<T>(
  value: unknown, 
  valuePredicate: (value: unknown) => value is T
): value is Record<string, T> {
  if (!isObject(value) || isArray(value)) {
    return false;
  }
  
  return Object.values(value).every(valuePredicate);
}

/**
 * Type predicate to check if a value is one of a specific set of literal values.
 * 
 * @template T - The union type of allowed values
 * @param value - The value to check
 * @param allowedValues - Array of allowed values
 * @returns Type predicate indicating if the value is one of the allowed values
 * 
 * @example
 * type JourneyType = 'health' | 'care' | 'plan';
 * 
 * function processJourney(journey: string) {
 *   if (isOneOf<JourneyType>(journey, ['health', 'care', 'plan'])) {
 *     // TypeScript now knows journey is a JourneyType
 *     switch (journey) {
 *       case 'health': return processHealthJourney();
 *       case 'care': return processCareJourney();
 *       case 'plan': return processPlanJourney();
 *     }
 *   }
 *   throw new Error(`Invalid journey type: ${journey}`);
 * }
 */
export function isOneOf<T extends string | number | boolean>(
  value: unknown, 
  allowedValues: readonly T[]
): value is T {
  return allowedValues.includes(value as T);
}

/**
 * Type predicate to check if all properties of an object satisfy a type predicate.
 * 
 * @template T - The expected property value type
 * @param obj - The object to check
 * @param valuePredicate - A type predicate function to validate each property value
 * @returns Type predicate indicating if all properties satisfy the predicate
 * 
 * @example
 * interface Config {
 *   timeouts: Record<string, number>;
 * }
 * 
 * function validateConfig(config: unknown): config is Config {
 *   return (
 *     isObject(config) &&
 *     hasPropertyOfType(config, 'timeouts', (value): value is Record<string, number> => 
 *       isObject(value) && hasAllPropertiesOfType(value, isFiniteNumber))
 *   );
 * }
 */
export function hasAllPropertiesOfType<T>(
  obj: unknown, 
  valuePredicate: (value: unknown) => value is T
): obj is Record<string, T> {
  if (!isObject(obj)) {
    return false;
  }
  
  return Object.values(obj).every(valuePredicate);
}

/**
 * Type predicate to check if a value is a function with a specific signature.
 * 
 * @template T - The function type
 * @param value - The value to check
 * @returns Type predicate indicating if the value is a function of type T
 * 
 * @example
 * type EventHandler = (event: string, data: unknown) => void;
 * 
 * function registerHandler(handler: unknown) {
 *   if (isFunctionOfType<EventHandler>(handler)) {
 *     // TypeScript now knows handler is an EventHandler
 *     return { trigger: (event: string, data: unknown) => handler(event, data) };
 *   }
 *   throw new Error('Invalid event handler');
 * }
 */
export function isFunctionOfType<T extends (...args: any[]) => any>(
  value: unknown
): value is T {
  return isFunction(value);
}

/**
 * Type predicate to check if a value is a tuple of a specific structure.
 * 
 * @template T - The tuple type
 * @param value - The value to check
 * @param predicates - Array of type predicates for each tuple element
 * @returns Type predicate indicating if the value matches the tuple structure
 * 
 * @example
 * type UserTuple = [string, number, boolean]; // [name, age, isActive]
 * 
 * function processUserData(data: unknown) {
 *   if (isTuple<UserTuple>(data, [isString, isFiniteNumber, isBoolean])) {
 *     // TypeScript now knows data is [string, number, boolean]
 *     const [name, age, isActive] = data;
 *     // Process user data...
 *   }
 * }
 */
export function isTuple<T extends unknown[]>(
  value: unknown,
  predicates: { [K in keyof T]: (value: unknown) => value is T[K] }
): value is T {
  if (!isArray(value) || value.length !== predicates.length) {
    return false;
  }
  
  return predicates.every((predicate, index) => predicate(value[index]));
}