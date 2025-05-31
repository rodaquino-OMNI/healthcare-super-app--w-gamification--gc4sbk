/**
 * @file Common Types
 * @description Defines fundamental utility types and type helpers used across all domains of the AUSTA SuperApp.
 * These types serve as building blocks for more specific domain interfaces and ensure type consistency throughout the application.
 */

/**
 * Represents a value that can be null.
 * @template T The type of the value.
 */
export type Nullable<T> = T | null;

/**
 * Represents a value that can be undefined.
 * @template T The type of the value.
 */
export type Optional<T> = T | undefined;

/**
 * Represents a value that can be null or undefined.
 * @template T The type of the value.
 */
export type Maybe<T> = T | null | undefined;

/**
 * Represents JavaScript primitive types.
 */
export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * A type-safe dictionary with string keys and values of type T.
 * @template T The type of the values in the dictionary.
 */
export type Dictionary<T> = {
  [key: string]: T;
};

/**
 * A type-safe record with keys of type K and values of type T.
 * @template K The type of the keys in the record (must be a string, number, or symbol).
 * @template T The type of the values in the record.
 */
export type TypedRecord<K extends keyof any, T> = {
  [P in K]: T;
};

/**
 * Makes all properties in T optional recursively.
 * @template T The type to make deeply partial.
 */
export type DeepPartial<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends Map<infer K, infer V>
  ? Map<DeepPartial<K>, DeepPartial<V>>
  : T extends Set<infer U>
  ? Set<DeepPartial<U>>
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/**
 * Makes all properties in T readonly recursively.
 * @template T The type to make deeply readonly.
 */
export type ReadonlyDeep<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
  ? ReadonlyArray<ReadonlyDeep<U>>
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<ReadonlyDeep<K>, ReadonlyDeep<V>>
  : T extends Set<infer U>
  ? ReadonlySet<ReadonlyDeep<U>>
  : T extends object
  ? { readonly [K in keyof T]: ReadonlyDeep<T[K]> }
  : T;

/**
 * Extracts the element type from an array type.
 * @template T The array type to extract the element type from.
 */
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer U)[] ? U : never;

/**
 * Represents a function that takes any arguments and returns any value.
 */
export type AnyFunction = (...args: any[]) => any;

/**
 * Extracts the return type from a function or promise.
 * @template T The function or promise type to extract the return type from.
 */
export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

/**
 * Represents a constructor function that creates instances of type T.
 * @template T The type of the instances created by the constructor.
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Extracts the keys of T whose values are assignable to U.
 * @template T The object type to extract keys from.
 * @template U The type that the values must be assignable to.
 */
export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];

/**
 * Picks properties from T that are of type U.
 * @template T The object type to pick properties from.
 * @template U The type that the properties must be.
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

/**
 * Omits properties from T that are of type U.
 * @template T The object type to omit properties from.
 * @template U The type of properties to omit.
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Makes specified properties in T required.
 * @template T The object type to modify.
 * @template K The keys of properties to make required.
 */
export type RequiredProps<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Makes specified properties in T optional.
 * @template T The object type to modify.
 * @template K The keys of properties to make optional.
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Represents a value that is either in a loading state, has an error, or has data.
 * Useful for representing async operation states.
 * @template T The type of the data.
 * @template E The type of the error.
 */
export type AsyncData<T, E = Error> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'error'; error: E; data?: undefined }
  | { status: 'success'; data: T; error?: undefined };

/**
 * Represents a paginated response.
 * @template T The type of items in the response.
 */
export interface PaginatedResponse<T> {
  /** The items in the current page */
  items: T[];
  /** The total number of items across all pages */
  total: number;
  /** The current page number (1-based) */
  page: number;
  /** The number of items per page */
  pageSize: number;
  /** Whether there are more pages available */
  hasMore: boolean;
}

/**
 * Represents a request for paginated data.
 */
export interface PaginationParams {
  /** The page number to retrieve (1-based) */
  page: number;
  /** The number of items per page */
  pageSize: number;
  /** Optional sorting criteria */
  sortBy?: string;
  /** Optional sort direction ('asc' or 'desc') */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Represents a filter for querying data.
 */
export interface FilterParams {
  /** The field to filter by */
  field: string;
  /** The operator to use for filtering */
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  /** The value to filter by */
  value: any;
}

/**
 * Represents a query with pagination, sorting, and filtering.
 */
export interface QueryParams {
  /** Pagination parameters */
  pagination?: PaginationParams;
  /** Filtering parameters */
  filters?: FilterParams[];
  /** Whether to include soft-deleted items */
  includeDeleted?: boolean;
}