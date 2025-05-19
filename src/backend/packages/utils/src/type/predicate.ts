/**
 * Type predicates for narrowing types in a type-safe way during runtime checks.
 * 
 * These predicates serve as type guards that inform the TypeScript compiler about
 * the resulting type when the function returns true, enabling proper type narrowing
 * in conditional blocks.
 * 
 * @packageDocumentation
 */

import { FilterDto, PaginationDto, SortDto } from '@austa/interfaces/common/dto';

// ===== Basic Type Predicates =====

/**
 * Type predicate to check if a value is defined (not null or undefined).
 * 
 * @param value - The value to check
 * @returns True if the value is defined, false otherwise
 * 
 * @example
 * ```typescript
 * const processValue = (value: string | null | undefined) => {
 *   if (isDefined(value)) {
 *     // TypeScript knows value is string here (not null or undefined)
 *     return value.toUpperCase();
 *   }
 *   return '';
 * };
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type predicate to check if a value is not null.
 * 
 * @param value - The value to check
 * @returns True if the value is not null, false otherwise
 * 
 * @example
 * ```typescript
 * const processValue = (value: string | null) => {
 *   if (isNotNull(value)) {
 *     // TypeScript knows value is string here (not null)
 *     return value.toUpperCase();
 *   }
 *   return '';
 * };
 * ```
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type predicate to check if a value is not undefined.
 * 
 * @param value - The value to check
 * @returns True if the value is not undefined, false otherwise
 * 
 * @example
 * ```typescript
 * const processValue = (value: string | undefined) => {
 *   if (isNotUndefined(value)) {
 *     // TypeScript knows value is string here (not undefined)
 *     return value.toUpperCase();
 *   }
 *   return '';
 * };
 * ```
 */
export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

// ===== Array Type Predicates =====

/**
 * Type predicate to check if an array is non-empty.
 * 
 * @param arr - The array to check
 * @returns True if the array is non-empty, false otherwise
 * 
 * @example
 * ```typescript
 * const processItems = (items: string[]) => {
 *   if (isNonEmptyArray(items)) {
 *     // TypeScript knows items is a non-empty array here
 *     const first = items[0]; // Safe access
 *     return first;
 *   }
 *   return '';
 * };
 * ```
 */
export function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Type predicate to check if an array has a specific length.
 * 
 * @param arr - The array to check
 * @param length - The expected length
 * @returns True if the array has the specified length, false otherwise
 * 
 * @example
 * ```typescript
 * const processCoordinates = (coords: number[]) => {
 *   if (isArrayOfLength(coords, 2)) {
 *     // TypeScript knows coords has exactly 2 elements
 *     const [x, y] = coords; // Safe destructuring
 *     return { x, y };
 *   }
 *   return null;
 * };
 * ```
 */
export function isArrayOfLength<T, N extends number>(
  arr: T[], 
  length: N
): arr is T[] & { length: N } {
  return Array.isArray(arr) && arr.length === length;
}

/**
 * Type predicate to check if an array contains elements of a specific type.
 * 
 * @param arr - The array to check
 * @param predicate - A type predicate function to check each element
 * @returns True if all elements satisfy the predicate, false otherwise
 * 
 * @example
 * ```typescript
 * const isString = (value: unknown): value is string => typeof value === 'string';
 * 
 * const processItems = (items: unknown[]) => {
 *   if (isArrayOf(items, isString)) {
 *     // TypeScript knows items is string[] here
 *     return items.map(item => item.toUpperCase());
 *   }
 *   return [];
 * };
 * ```
 */
export function isArrayOf<T, U extends T>(
  arr: T[], 
  predicate: (value: T) => value is U
): arr is U[] {
  return Array.isArray(arr) && arr.every(predicate);
}

// ===== Object Type Predicates =====

/**
 * Type predicate to check if an object has a specific property.
 * 
 * @param obj - The object to check
 * @param prop - The property name to check for
 * @returns True if the object has the property, false otherwise
 * 
 * @example
 * ```typescript
 * const processUser = (user: unknown) => {
 *   if (hasProperty(user, 'name')) {
 *     // TypeScript knows user has a 'name' property here
 *     console.log(user.name);
 *   }
 * };
 * ```
 */
export function hasProperty<K extends string>(
  obj: unknown, 
  prop: K
): obj is Record<K, unknown> {
  return !!obj && typeof obj === 'object' && prop in obj;
}

/**
 * Type predicate to check if an object has a specific property of a specific type.
 * 
 * @param obj - The object to check
 * @param prop - The property name to check for
 * @param predicate - A type predicate function to check the property value
 * @returns True if the object has the property and it satisfies the predicate, false otherwise
 * 
 * @example
 * ```typescript
 * const isString = (value: unknown): value is string => typeof value === 'string';
 * 
 * const processUser = (user: unknown) => {
 *   if (hasPropertyOfType(user, 'name', isString)) {
 *     // TypeScript knows user has a 'name' property of type string here
 *     console.log(user.name.toUpperCase());
 *   }
 * };
 * ```
 */
export function hasPropertyOfType<K extends string, T>(
  obj: unknown, 
  prop: K, 
  predicate: (value: unknown) => value is T
): obj is Record<K, T> {
  return hasProperty(obj, prop) && predicate(obj[prop]);
}

/**
 * Type predicate to check if an object has all the specified properties.
 * 
 * @param obj - The object to check
 * @param props - The property names to check for
 * @returns True if the object has all the properties, false otherwise
 * 
 * @example
 * ```typescript
 * const processUser = (user: unknown) => {
 *   if (hasProperties(user, ['name', 'email', 'age'])) {
 *     // TypeScript knows user has 'name', 'email', and 'age' properties here
 *     console.log(`${user.name} (${user.age}): ${user.email}`);
 *   }
 * };
 * ```
 */
export function hasProperties<K extends string>(
  obj: unknown, 
  props: K[]
): obj is Record<K, unknown> {
  return !!obj && typeof obj === 'object' && props.every(prop => prop in obj);
}

// ===== Class Instance Type Predicates =====

/**
 * Type predicate to check if a value is an instance of a specific class.
 * 
 * @param value - The value to check
 * @param constructor - The class constructor to check against
 * @returns True if the value is an instance of the class, false otherwise
 * 
 * @example
 * ```typescript
 * class User { /* ... */ }
 * 
 * const processEntity = (entity: unknown) => {
 *   if (isInstanceOf(entity, User)) {
 *     // TypeScript knows entity is a User instance here
 *     console.log(entity.name);
 *   }
 * };
 * ```
 */
export function isInstanceOf<T>(
  value: unknown, 
  constructor: new (...args: any[]) => T
): value is T {
  return value instanceof constructor;
}

/**
 * Type predicate to check if a value is an instance of one of the specified classes.
 * 
 * @param value - The value to check
 * @param constructors - The class constructors to check against
 * @returns True if the value is an instance of any of the classes, false otherwise
 * 
 * @example
 * ```typescript
 * class User { /* ... */ }
 * class Admin { /* ... */ }
 * 
 * const processEntity = (entity: unknown) => {
 *   if (isInstanceOfAny(entity, [User, Admin])) {
 *     // TypeScript knows entity is a User or Admin instance here
 *     console.log(entity.id);
 *   }
 * };
 * ```
 */
export function isInstanceOfAny<T>(
  value: unknown, 
  constructors: Array<new (...args: any[]) => T>
): value is T {
  return constructors.some(constructor => value instanceof constructor);
}

// ===== Journey-Specific Type Predicates =====

/**
 * Type predicate to check if a value is a valid FilterDto.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid FilterDto, false otherwise
 * 
 * @example
 * ```typescript
 * const processQuery = (query: unknown) => {
 *   if (isFilterDto(query)) {
 *     // TypeScript knows query is a FilterDto here
 *     return repository.findAll(query);
 *   }
 *   return [];
 * };
 * ```
 */
export function isFilterDto(value: unknown): value is FilterDto {
  return (
    !!value &&
    typeof value === 'object' &&
    ('where' in value || 'include' in value || 'select' in value)
  );
}

/**
 * Type predicate to check if a value is a valid PaginationDto.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid PaginationDto, false otherwise
 * 
 * @example
 * ```typescript
 * const processQuery = (query: unknown) => {
 *   if (isPaginationDto(query)) {
 *     // TypeScript knows query is a PaginationDto here
 *     return repository.findWithPagination(query);
 *   }
 *   return { items: [], total: 0 };
 * };
 * ```
 */
export function isPaginationDto(value: unknown): value is PaginationDto {
  return (
    !!value &&
    typeof value === 'object' &&
    (('page' in value && 'limit' in value) || 'cursor' in value)
  );
}

/**
 * Type predicate to check if a value is a valid SortDto.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid SortDto, false otherwise
 * 
 * @example
 * ```typescript
 * const processQuery = (query: unknown) => {
 *   if (isSortDto(query)) {
 *     // TypeScript knows query is a SortDto here
 *     return repository.findWithSorting(query);
 *   }
 *   return [];
 * };
 * ```
 */
export function isSortDto(value: unknown): value is SortDto {
  return (
    !!value &&
    typeof value === 'object' &&
    'orderBy' in value &&
    !!value.orderBy &&
    typeof value.orderBy === 'object'
  );
}

// ===== Union Type Predicates =====

/**
 * Type predicate to check if a value is one of the specified values.
 * 
 * @param value - The value to check
 * @param validValues - The valid values to check against
 * @returns True if the value is one of the valid values, false otherwise
 * 
 * @example
 * ```typescript
 * type Status = 'pending' | 'active' | 'completed';
 * 
 * const processStatus = (status: string) => {
 *   if (isOneOf(status, ['pending', 'active', 'completed'] as const)) {
 *     // TypeScript knows status is a Status here
 *     return handleStatus(status);
 *   }
 *   return handleInvalidStatus(status);
 * };
 * ```
 */
export function isOneOf<T extends U, U>(
  value: U, 
  validValues: readonly T[]
): value is T {
  return validValues.includes(value as any);
}

/**
 * Type predicate to check if a value matches one of the specified predicates.
 * 
 * @param value - The value to check
 * @param predicates - The predicates to check against
 * @returns True if the value matches any of the predicates, false otherwise
 * 
 * @example
 * ```typescript
 * const isString = (value: unknown): value is string => typeof value === 'string';
 * const isNumber = (value: unknown): value is number => typeof value === 'number';
 * 
 * const processValue = (value: unknown) => {
 *   if (isOneOfType(value, [isString, isNumber])) {
 *     // TypeScript knows value is string | number here
 *     return value.toString();
 *   }
 *   return '';
 * };
 * ```
 */
export function isOneOfType<T, U extends T>(
  value: T, 
  predicates: Array<(value: T) => value is U>
): value is U {
  return predicates.some(predicate => predicate(value));
}

// ===== Discriminated Union Type Predicates =====

/**
 * Type predicate to check if an object has a specific discriminator property with a specific value.
 * 
 * @param obj - The object to check
 * @param discriminator - The discriminator property name
 * @param value - The expected discriminator value
 * @returns True if the object has the discriminator property with the expected value, false otherwise
 * 
 * @example
 * ```typescript
 * type Shape = 
 *   | { kind: 'circle'; radius: number }
 *   | { kind: 'rectangle'; width: number; height: number };
 * 
 * const processShape = (shape: Shape) => {
 *   if (hasDiscriminator(shape, 'kind', 'circle')) {
 *     // TypeScript knows shape is { kind: 'circle'; radius: number } here
 *     return Math.PI * shape.radius * shape.radius;
 *   }
 *   return shape.width * shape.height;
 * };
 * ```
 */
export function hasDiscriminator<T extends object, K extends keyof T, V extends T[K]>(
  obj: T, 
  discriminator: K, 
  value: V
): obj is Extract<T, Record<K, V>> {
  return obj[discriminator] === value;
}