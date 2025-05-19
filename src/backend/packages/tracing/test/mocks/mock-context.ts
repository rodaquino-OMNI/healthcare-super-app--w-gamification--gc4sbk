/**
 * Mock implementation of OpenTelemetry Context for testing purposes.
 * This mock simulates context propagation and active context management
 * without requiring actual telemetry infrastructure.
 */

import { Context, ContextManager } from '@opentelemetry/api';

/**
 * Mock implementation of a context key for testing.
 */
export class MockContextKey<T> {
  constructor(public readonly description: string) {}
}

/**
 * Creates a mock context key for testing purposes.
 * @param description A description of the context key
 * @returns A new mock context key
 */
export function createMockContextKey<T>(description: string): MockContextKey<T> {
  return new MockContextKey<T>(description);
}

/**
 * Mock implementation of OpenTelemetry Context for testing.
 * Simulates the immutable key-value store behavior of Context.
 */
export class MockContext implements Context {
  private readonly _values: Map<MockContextKey<unknown>, unknown>;

  /**
   * Creates a new MockContext instance.
   * @param values Optional initial values for the context
   */
  constructor(values?: Map<MockContextKey<unknown>, unknown>) {
    this._values = values ? new Map(values) : new Map();
  }

  /**
   * Gets a value from the context.
   * @param key The context key to get the value for
   * @returns The value associated with the key, or undefined if not found
   */
  getValue<T>(key: MockContextKey<T>): T | undefined {
    return this._values.get(key) as T | undefined;
  }

  /**
   * Sets a value in the context.
   * @param key The context key to set the value for
   * @param value The value to set
   * @returns A new context with the updated value
   */
  setValue<T>(key: MockContextKey<T>, value: T): MockContext {
    const newValues = new Map(this._values);
    newValues.set(key, value);
    return new MockContext(newValues);
  }

  /**
   * Deletes a value from the context.
   * @param key The context key to delete
   * @returns A new context with the key removed
   */
  deleteValue(key: MockContextKey<unknown>): MockContext {
    const newValues = new Map(this._values);
    newValues.delete(key);
    return new MockContext(newValues);
  }
}

/**
 * The empty root context for testing.
 */
export const ROOT_CONTEXT = new MockContext();

/**
 * Mock implementation of OpenTelemetry ContextManager for testing.
 * Simulates context propagation and active context management.
 */
export class MockContextManager implements ContextManager {
  private _activeContext: MockContext = ROOT_CONTEXT;

  /**
   * Gets the active context.
   * @returns The current active context
   */
  active(): MockContext {
    return this._activeContext;
  }

  /**
   * Executes a callback with a context as the active context.
   * @param context The context to use as active during the callback
   * @param fn The callback function to execute
   * @returns The return value of the callback
   */
  with<T>(context: MockContext, fn: () => T): T {
    const previousContext = this._activeContext;
    this._activeContext = context;

    try {
      return fn();
    } finally {
      this._activeContext = previousContext;
    }
  }

  /**
   * Binds a context to a target function.
   * @param context The context to bind
   * @param target The target function to bind the context to
   * @returns A new function that will have the context active when called
   */
  bind<T>(context: MockContext, target: T): T {
    if (typeof target === 'function') {
      return ((...args: unknown[]) => {
        return this.with(context, () => {
          return (target as Function)(...args);
        });
      }) as unknown as T;
    }
    return target;
  }

  /**
   * Enables context propagation for the current execution context.
   */
  enable(): this {
    return this;
  }

  /**
   * Disables context propagation for the current execution context.
   */
  disable(): this {
    return this;
  }
}

/**
 * A singleton instance of MockContextManager for testing.
 */
export const mockContextManager = new MockContextManager();