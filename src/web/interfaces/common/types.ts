/**
 * @file Common Utility Types
 * @description Defines fundamental utility types and type helpers used across all domains of the AUSTA SuperApp.
 * These types serve as building blocks for more specific domain interfaces and ensure type consistency throughout the application.
 */

/**
 * Represents a value that can be null or of type T.
 * @template T - The type that can be null
 * @example
 * // Variable that can be a string or null
 * const username: Nullable<string> = user ? user.name : null;
 */
export type Nullable<T> = T | null;

/**
 * Represents a value that can be undefined or of type T.
 * @template T - The type that can be undefined
 * @example
 * // Optional parameter in a function
 * function greet(name: Optional<string>) {
 *   console.log(`Hello ${name ?? 'Guest'}`);
 * }
 */
export type Optional<T> = T | undefined;

/**
 * Represents a value that can be null, undefined, or of type T.
 * @template T - The type that can be null or undefined
 * @example
 * // Value that might be missing or explicitly set to null
 * const middleName: Maybe<string> = user.middleName;
 */
export type Maybe<T> = T | null | undefined;

/**
 * A dictionary with string keys and values of type T.
 * @template T - The type of the values in the dictionary
 * @example
 * // Map of user IDs to user objects
 * const userMap: Dictionary<User> = {
 *   'user-123': { id: 'user-123', name: 'John' },
 *   'user-456': { id: 'user-456', name: 'Jane' }
 * };
 */
export type Dictionary<T> = Record<string, T>;

/**
 * A dictionary with string keys and values that can be null or of type T.
 * @template T - The type of the values in the dictionary
 * @example
 * // Cache that might have null entries for expired items
 * const cache: NullableDictionary<CacheItem> = {
 *   'item-1': { data: '...' },
 *   'item-2': null // Expired or invalidated
 * };
 */
export type NullableDictionary<T> = Record<string, Nullable<T>>;

/**
 * A dictionary with string keys and values that can be undefined or of type T.
 * @template T - The type of the values in the dictionary
 * @example
 * // Form values that might not all be filled
 * const formValues: OptionalDictionary<string> = {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   middleName: undefined
 * };
 */
export type OptionalDictionary<T> = Record<string, Optional<T>>;

/**
 * Makes all properties in T optional (can be undefined).
 * This is a utility type that wraps Partial<T> for better semantic meaning.
 * @template T - The type whose properties should be made optional
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * // All fields are optional
 * const partialUser: PartialObject<User> = { name: 'John' };
 */
export type PartialObject<T> = Partial<T>;

/**
 * Makes all properties in T required (cannot be undefined or null).
 * This is a utility type that wraps Required<T> for better semantic meaning.
 * @template T - The type whose properties should be made required
 * @example
 * interface Config {
 *   apiUrl?: string;
 *   timeout?: number;
 * }
 * 
 * // All fields are required
 * const fullConfig: RequiredObject<Config> = {
 *   apiUrl: 'https://api.example.com',
 *   timeout: 5000
 * };
 */
export type RequiredObject<T> = Required<T>;

/**
 * Makes all properties in T readonly (cannot be reassigned).
 * This is a utility type that wraps Readonly<T> for better semantic meaning.
 * @template T - The type whose properties should be made readonly
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 * }
 * 
 * // All fields are readonly
 * const user: ReadonlyObject<User> = {
 *   id: 'user-123',
 *   name: 'John'
 * };
 */
export type ReadonlyObject<T> = Readonly<T>;

/**
 * Makes all properties in T deeply readonly (cannot be reassigned at any level).
 * @template T - The type whose properties should be made deeply readonly
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   address: {
 *     street: string;
 *     city: string;
 *   };
 * }
 * 
 * // All fields are deeply readonly, including nested objects
 * const user: DeepReadonly<User> = {
 *   id: 'user-123',
 *   name: 'John',
 *   address: {
 *     street: '123 Main St',
 *     city: 'Anytown'
 *   }
 * };
 */
export type DeepReadonly<T> = T extends (infer R)[] 
  ? ReadonlyArray<DeepReadonly<R>> 
  : T extends Function 
    ? T 
    : T extends object 
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> } 
      : T;

/**
 * Extracts the type of an array's elements.
 * @template T - The array type
 * @example
 * const numbers = [1, 2, 3];
 * type NumberType = ArrayElement<typeof numbers>; // number
 */
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer U)[] ? U : never;

/**
 * Represents a non-empty array of type T.
 * @template T - The type of elements in the array
 * @example
 * // Function that requires at least one item
 * function processItems(items: NonEmptyArray<string>) {
 *   const firstItem = items[0]; // Always exists
 *   // ...
 * }
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Extracts the keys of T where the property value is assignable to U.
 * @template T - The object type
 * @template U - The property value type to match
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   age: number;
 *   isActive: boolean;
 * }
 * 
 * type StringKeys = KeysOfType<User, string>; // 'id' | 'name'
 */
export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];

/**
 * Picks properties from T where the property value is assignable to U.
 * @template T - The object type
 * @template U - The property value type to match
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   age: number;
 *   isActive: boolean;
 * }
 * 
 * type StringProperties = PickByType<User, string>; // { id: string; name: string; }
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

/**
 * Omits properties from T where the property value is assignable to U.
 * @template T - The object type
 * @template U - The property value type to exclude
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   age: number;
 *   isActive: boolean;
 * }
 * 
 * type NonStringProperties = OmitByType<User, string>; // { age: number; isActive: boolean; }
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Represents a function that returns a Promise of type T.
 * @template T - The type that the Promise resolves to
 * @example
 * // Function that fetches a user
 * const fetchUser: AsyncFunction<User> = async (id: string) => {
 *   const response = await fetch(`/api/users/${id}`);
 *   return response.json();
 * };
 */
export type AsyncFunction<T> = (...args: any[]) => Promise<T>;

/**
 * Extracts the return type of an async function, unwrapping the Promise.
 * @template T - The async function type
 * @example
 * const fetchUser = async () => {
 *   return { id: '123', name: 'John' };
 * };
 * 
 * type User = UnwrapPromise<ReturnType<typeof fetchUser>>; // { id: string; name: string; }
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Represents a type that can be used as an object key (string, number, or symbol).
 * @example
 * function getProperty<T, K extends PropertyKey>(obj: T, key: K): K extends keyof T ? T[K] : undefined {
 *   return (key as keyof T) in obj ? obj[key as keyof T] : undefined as any;
 * }
 */
export type PropertyKey = string | number | symbol;

/**
 * Represents a constructor function that creates instances of type T.
 * @template T - The type of object the constructor creates
 * @example
 * // Function that takes a constructor and creates an instance
 * function createInstance<T>(ctor: Constructor<T>): T {
 *   return new ctor();
 * }
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * Represents a value that is either exactly of type T or exactly of type U.
 * This is different from T | U in that it doesn't allow for subtypes.
 * @template T - The first exact type
 * @template U - The second exact type
 * @example
 * type Status = ExactlyOne<'success', 'error'>;
 * 
 * // Only these two values are allowed
 * const status1: Status = 'success'; // Valid
 * const status2: Status = 'error';   // Valid
 */
export type ExactlyOne<T, U> = T | U extends infer V ? (T extends V ? U extends V ? never : T : U) : never;

/**
 * Represents a type with at least the properties of T.
 * @template T - The minimum properties required
 * @example
 * interface MinimalUser {
 *   id: string;
 *   name: string;
 * }
 * 
 * // Object can have additional properties beyond id and name
 * const user: AtLeast<MinimalUser> = {
 *   id: 'user-123',
 *   name: 'John',
 *   email: 'john@example.com' // Additional property
 * };
 */
export type AtLeast<T> = T & Record<string, unknown>;

/**
 * Converts a union type to an intersection type.
 * @template U - The union type to convert
 * @example
 * type Union = { a: string } | { b: number };
 * type Intersection = UnionToIntersection<Union>; // { a: string } & { b: number }
 */
export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/**
 * Represents a type that is either T or an array of T.
 * @template T - The base type
 * @example
 * // Function that accepts either a single item or an array of items
 * function process<T>(input: SingleOrArray<T>): T[] {
 *   return Array.isArray(input) ? input : [input];
 * }
 */
export type SingleOrArray<T> = T | T[];

/**
 * Represents a type that is either a value of type T or a function that returns T.
 * @template T - The value type
 * @example
 * // Component that accepts either a value or a function that returns that value
 * function Greeting({ name }: { name: ValueOrGetter<string> }) {
 *   const resolvedName = typeof name === 'function' ? name() : name;
 *   return <p>Hello, {resolvedName}!</p>;
 * }
 */
export type ValueOrGetter<T> = T | (() => T);

/**
 * Represents a type with all properties of T except those that are functions.
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   getFullName: () => string;
 * }
 * 
 * type UserData = OmitFunctions<User>; // { id: string; name: string; }
 */
export type OmitFunctions<T> = Pick<T, { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]>;

/**
 * Represents a type with all function properties of T.
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   getFullName: () => string;
 * }
 * 
 * type UserMethods = PickFunctions<User>; // { getFullName: () => string; }
 */
export type PickFunctions<T> = Pick<T, { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]>;

/**
 * Represents a type that is either T or a Promise of T.
 * @template T - The value type
 * @example
 * // Function that handles both synchronous and asynchronous results
 * async function process<T>(value: MaybePromise<T>): Promise<T> {
 *   return value instanceof Promise ? await value : value;
 * }
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents a type with all properties of T made optional at the first level.
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   address: {
 *     street: string;
 *     city: string;
 *   };
 * }
 * 
 * // First-level properties are optional, but nested properties remain required
 * const partialUser: PartialShallow<User> = {
 *   name: 'John',
 *   // address is optional, but if provided, its properties are required
 *   address: {
 *     street: '123 Main St',
 *     city: 'Anytown'
 *   }
 * };
 */
export type PartialShallow<T> = { [P in keyof T]?: T[P] };

/**
 * Represents a type with all properties of T made deeply optional (can be undefined at any level).
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   address: {
 *     street: string;
 *     city: string;
 *   };
 * }
 * 
 * // All properties at all levels are optional
 * const partialUser: DeepPartial<User> = {
 *   name: 'John',
 *   address: {
 *     street: '123 Main St'
 *     // city can be omitted
 *   }
 * };
 */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * Represents a type with all properties of T made non-nullable (not null or undefined).
 * @template T - The object type
 * @example
 * interface User {
 *   id: string | null;
 *   name?: string;
 *   email: string | undefined;
 * }
 * 
 * // All properties are non-nullable
 * const user: NonNullableProperties<User> = {
 *   id: 'user-123',    // string (not null)
 *   name: 'John',      // string (not undefined)
 *   email: 'john@example.com' // string (not undefined)
 * };
 */
export type NonNullableProperties<T> = { [P in keyof T]: NonNullable<T[P]> };

/**
 * Represents a type with all properties of T made nullable (can be null).
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 * }
 * 
 * // All properties can be null
 * const user: NullableProperties<User> = {
 *   id: 'user-123',
 *   name: null
 * };
 */
export type NullableProperties<T> = { [P in keyof T]: Nullable<T[P]> };

/**
 * Represents a type with all properties of T made optional (can be undefined).
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 * }
 * 
 * // All properties can be undefined
 * const user: OptionalProperties<User> = {
 *   id: 'user-123'
 *   // name is undefined
 * };
 */
export type OptionalProperties<T> = { [P in keyof T]?: T[P] };

/**
 * Represents a type with all properties of T made maybe (can be null or undefined).
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 * }
 * 
 * // All properties can be null or undefined
 * const user: MaybeProperties<User> = {
 *   id: null,
 *   // name is undefined
 * };
 */
export type MaybeProperties<T> = { [P in keyof T]: Maybe<T[P]> };

/**
 * Represents a type that is a subset of T with at least one property.
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * // Must have at least one property from User
 * const userSubset1: AtLeastOne<User> = { id: 'user-123' };
 * const userSubset2: AtLeastOne<User> = { name: 'John', email: 'john@example.com' };
 */
export type AtLeastOne<T> = { [K in keyof T]: Pick<T, K> }[keyof T];

/**
 * Represents a type that is a subset of T with exactly one property.
 * @template T - The object type
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * // Must have exactly one property from User
 * const userSubset1: ExactlyOne<User> = { id: 'user-123' };
 * const userSubset2: ExactlyOne<User> = { name: 'John' };
 */
export type ExactlyOneProperty<T> = { [K in keyof T]: Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>> }[keyof T];

/**
 * Represents a type with all properties of T made required and non-nullable.
 * @template T - The object type
 * @example
 * interface User {
 *   id?: string | null;
 *   name?: string;
 *   email: string | undefined;
 * }
 * 
 * // All properties are required and non-nullable
 * const user: RequiredNonNullable<User> = {
 *   id: 'user-123',
 *   name: 'John',
 *   email: 'john@example.com'
 * };
 */
export type RequiredNonNullable<T> = { [P in keyof T]-?: NonNullable<T[P]> };