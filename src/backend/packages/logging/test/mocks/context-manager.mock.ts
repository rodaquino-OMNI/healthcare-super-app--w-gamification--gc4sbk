import { JourneyType } from '../../src/context/context.constants';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext } from '../../src/context/user-context.interface';

/**
 * Mock implementation of the ContextManager for testing purposes.
 * Provides a simplified context manager that can be preset with contexts
 * for different scopes and tracks context operations.
 */
export class MockContextManager {
  /**
   * Tracks all context operations for verification in tests
   */
  public operations: Array<{
    operation: string;
    params?: any;
    result?: any;
  }> = [];

  /**
   * Preset contexts that will be returned by the get methods
   */
  private contexts: {
    base?: LoggingContext;
    request?: RequestContext;
    user?: UserContext;
    journey?: JourneyContext;
    [key: string]: LoggingContext | undefined;
  } = {};

  /**
   * Creates a new MockContextManager instance
   * @param presetContexts Optional preset contexts to initialize the manager with
   */
  constructor(presetContexts?: {
    base?: LoggingContext;
    request?: RequestContext;
    user?: UserContext;
    journey?: JourneyContext;
    [key: string]: LoggingContext | undefined;
  }) {
    if (presetContexts) {
      this.contexts = { ...presetContexts };
    }
  }

  /**
   * Gets the base logging context
   * @returns The base logging context or an empty object if not set
   */
  getBaseContext(): LoggingContext {
    this.operations.push({
      operation: 'getBaseContext',
      result: this.contexts.base,
    });
    return this.contexts.base || {};
  }

  /**
   * Gets the request context
   * @returns The request context or an empty object if not set
   */
  getRequestContext(): RequestContext {
    this.operations.push({
      operation: 'getRequestContext',
      result: this.contexts.request,
    });
    return this.contexts.request || {} as RequestContext;
  }

  /**
   * Gets the user context
   * @returns The user context or an empty object if not set
   */
  getUserContext(): UserContext {
    this.operations.push({
      operation: 'getUserContext',
      result: this.contexts.user,
    });
    return this.contexts.user || {} as UserContext;
  }

  /**
   * Gets the journey context
   * @returns The journey context or an empty object if not set
   */
  getJourneyContext(): JourneyContext {
    this.operations.push({
      operation: 'getJourneyContext',
      result: this.contexts.journey,
    });
    return this.contexts.journey || {} as JourneyContext;
  }

  /**
   * Gets a specific journey context by journey type
   * @param journeyType The type of journey to get context for
   * @returns The journey context for the specified type or an empty object if not set
   */
  getJourneyContextByType(journeyType: JourneyType): JourneyContext {
    const contextKey = `journey_${journeyType}`;
    this.operations.push({
      operation: 'getJourneyContextByType',
      params: { journeyType },
      result: this.contexts[contextKey],
    });
    return (this.contexts[contextKey] as JourneyContext) || {} as JourneyContext;
  }

  /**
   * Sets the base logging context
   * @param context The context to set
   */
  setBaseContext(context: LoggingContext): void {
    this.operations.push({
      operation: 'setBaseContext',
      params: { context },
    });
    this.contexts.base = context;
  }

  /**
   * Sets the request context
   * @param context The context to set
   */
  setRequestContext(context: RequestContext): void {
    this.operations.push({
      operation: 'setRequestContext',
      params: { context },
    });
    this.contexts.request = context;
  }

  /**
   * Sets the user context
   * @param context The context to set
   */
  setUserContext(context: UserContext): void {
    this.operations.push({
      operation: 'setUserContext',
      params: { context },
    });
    this.contexts.user = context;
  }

  /**
   * Sets the journey context
   * @param context The context to set
   */
  setJourneyContext(context: JourneyContext): void {
    this.operations.push({
      operation: 'setJourneyContext',
      params: { context },
    });
    this.contexts.journey = context;
  }

  /**
   * Sets a specific journey context by journey type
   * @param journeyType The type of journey to set context for
   * @param context The context to set
   */
  setJourneyContextByType(journeyType: JourneyType, context: JourneyContext): void {
    const contextKey = `journey_${journeyType}`;
    this.operations.push({
      operation: 'setJourneyContextByType',
      params: { journeyType, context },
    });
    this.contexts[contextKey] = context;
  }

  /**
   * Merges multiple contexts into a single context
   * @param contexts The contexts to merge
   * @returns The merged context
   */
  mergeContexts(...contexts: LoggingContext[]): LoggingContext {
    this.operations.push({
      operation: 'mergeContexts',
      params: { contexts },
    });

    // Filter out undefined or null contexts
    const validContexts = contexts.filter(Boolean);
    
    // Return empty object if no valid contexts
    if (validContexts.length === 0) {
      return {};
    }
    
    // Merge all contexts, with later contexts overriding earlier ones
    const mergedContext = validContexts.reduce(
      (result, context) => ({ ...result, ...context }),
      {}
    );
    
    this.operations[this.operations.length - 1].result = mergedContext;
    return mergedContext;
  }

  /**
   * Gets the complete context by merging all available contexts
   * @returns The complete merged context
   */
  getCompleteContext(): LoggingContext {
    this.operations.push({
      operation: 'getCompleteContext',
    });

    const mergedContext = this.mergeContexts(
      this.getBaseContext(),
      this.getRequestContext(),
      this.getUserContext(),
      this.getJourneyContext()
    );
    
    this.operations[this.operations.length - 1].result = mergedContext;
    return mergedContext;
  }

  /**
   * Clears all contexts
   */
  clearAllContexts(): void {
    this.operations.push({
      operation: 'clearAllContexts',
    });
    this.contexts = {};
  }

  /**
   * Clears a specific context
   * @param contextType The type of context to clear
   */
  clearContext(contextType: 'base' | 'request' | 'user' | 'journey' | string): void {
    this.operations.push({
      operation: 'clearContext',
      params: { contextType },
    });
    delete this.contexts[contextType];
  }

  /**
   * Creates a context with journey-specific information
   * @param journeyType The type of journey
   * @param journeyData Additional journey-specific data
   * @returns A journey context
   */
  createJourneyContext(journeyType: JourneyType, journeyData?: Record<string, any>): JourneyContext {
    this.operations.push({
      operation: 'createJourneyContext',
      params: { journeyType, journeyData },
    });

    const journeyContext: JourneyContext = {
      journeyType,
      journeyId: `mock-journey-${Date.now()}`,
      ...journeyData,
    };

    this.operations[this.operations.length - 1].result = journeyContext;
    return journeyContext;
  }

  /**
   * Creates a request context with the specified information
   * @param requestId The request ID
   * @param requestData Additional request-specific data
   * @returns A request context
   */
  createRequestContext(requestId: string, requestData?: Record<string, any>): RequestContext {
    this.operations.push({
      operation: 'createRequestContext',
      params: { requestId, requestData },
    });

    const requestContext: RequestContext = {
      requestId,
      timestamp: new Date().toISOString(),
      ...requestData,
    };

    this.operations[this.operations.length - 1].result = requestContext;
    return requestContext;
  }

  /**
   * Creates a user context with the specified information
   * @param userId The user ID
   * @param userData Additional user-specific data
   * @returns A user context
   */
  createUserContext(userId: string, userData?: Record<string, any>): UserContext {
    this.operations.push({
      operation: 'createUserContext',
      params: { userId, userData },
    });

    const userContext: UserContext = {
      userId,
      isAuthenticated: true,
      ...userData,
    };

    this.operations[this.operations.length - 1].result = userContext;
    return userContext;
  }

  /**
   * Resets the operations tracking array
   */
  resetOperations(): void {
    this.operations = [];
  }
}