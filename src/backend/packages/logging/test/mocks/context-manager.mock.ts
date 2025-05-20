/**
 * @file context-manager.mock.ts
 * @description Mock implementation of the ContextManager for testing components that depend on logging contexts.
 * Provides a simplified context manager that can be preset with contexts for different scopes and tracks context operations.
 */

import { v4 as uuidv4 } from 'uuid';
import { LoggingContext } from '../../src/context/context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext, AuthenticationStatus } from '../../src/context/user-context.interface';
import { JourneyContext, JourneyType } from '../../src/context/journey-context.interface';

/**
 * Interface for tracking context operations for test verification
 */
export interface ContextOperation {
  /** The type of operation performed */
  type: 'create' | 'merge' | 'extract' | 'fromPropagation';
  /** The method name that was called */
  method: string;
  /** The arguments passed to the method */
  args: any[];
  /** The result returned by the method */
  result: any;
  /** Timestamp when the operation was performed */
  timestamp: Date;
}

/**
 * Mock implementation of the ContextManager for testing.
 * Provides a simplified context manager that can be preset with contexts
 * for different scopes and tracks context operations.
 */
export class MockContextManager {
  /** Default context used as a base for all created contexts */
  private defaultContext: LoggingContext;
  
  /** Preset contexts that will be returned for specific types */
  private presetContexts: {
    base?: LoggingContext;
    request?: RequestContext;
    user?: UserContext;
    journey?: JourneyContext;
    complete?: LoggingContext;
  } = {};
  
  /** Tracks all context operations for test verification */
  private operations: ContextOperation[] = [];

  /**
   * Creates a new MockContextManager instance
   * @param options Configuration options
   */
  constructor(options?: {
    defaultContext?: Partial<LoggingContext>;
    presetContexts?: {
      base?: LoggingContext;
      request?: RequestContext;
      user?: UserContext;
      journey?: JourneyContext;
      complete?: LoggingContext;
    };
  }) {
    // Initialize default context
    this.defaultContext = {
      correlationId: uuidv4(),
      timestamp: new Date().toISOString(),
      serviceName: 'test-service',
      applicationName: 'austa-superapp-test',
      environment: 'test',
      version: '1.0.0',
      ...(options?.defaultContext || {}),
    };

    // Initialize preset contexts if provided
    if (options?.presetContexts) {
      this.presetContexts = { ...options.presetContexts };
    }
  }

  /**
   * Creates a new base logging context
   * @param context Optional context properties to include
   * @returns A new logging context
   */
  createContext(context?: Partial<LoggingContext>): LoggingContext {
    // Use preset context if available, otherwise create a new one
    const result = this.presetContexts.base || {
      ...this.defaultContext,
      timestamp: new Date().toISOString(),
      ...(context || {}),
    };

    // Track this operation
    this.trackOperation('create', 'createContext', [context], result);

    return result;
  }

  /**
   * Creates a new request context
   * @param requestInfo Request information
   * @returns A new request context
   */
  createRequestContext(requestInfo: Partial<RequestContext>): RequestContext {
    // Use preset context if available, otherwise create a new one
    const result = this.presetContexts.request || {
      ...this.createContext(),
      requestId: requestInfo.requestId || uuidv4(),
      ...requestInfo,
    } as RequestContext;

    // Track this operation
    this.trackOperation('create', 'createRequestContext', [requestInfo], result);

    return result;
  }

  /**
   * Creates a new user context
   * @param userInfo User information
   * @returns A new user context
   */
  createUserContext(userInfo: Partial<UserContext>): UserContext {
    // Ensure required fields are present
    if (!userInfo.userId && !this.presetContexts.user) {
      throw new Error('User ID is required for user context');
    }

    // Use preset context if available, otherwise create a new one
    const result = this.presetContexts.user || {
      ...this.createContext(),
      userId: userInfo.userId,
      authStatus: userInfo.authStatus || AuthenticationStatus.AUTHENTICATED,
      ...userInfo,
    } as UserContext;

    // Track this operation
    this.trackOperation('create', 'createUserContext', [userInfo], result);

    return result;
  }

  /**
   * Creates a new journey context
   * @param journeyInfo Journey information
   * @returns A new journey context
   */
  createJourneyContext(journeyInfo: Partial<JourneyContext>): JourneyContext {
    // Ensure required fields are present
    if (!journeyInfo.journeyType && !this.presetContexts.journey) {
      throw new Error('Journey type is required for journey context');
    }

    // Use preset context if available, otherwise create a new one
    const result = this.presetContexts.journey || {
      ...this.createContext(),
      journeyType: journeyInfo.journeyType || JourneyType.HEALTH,
      ...journeyInfo,
    } as JourneyContext;

    // Track this operation
    this.trackOperation('create', 'createJourneyContext', [journeyInfo], result);

    return result;
  }

  /**
   * Merges multiple contexts into a single context
   * @param contexts Contexts to merge
   * @returns Merged context
   */
  mergeContexts(...contexts: Partial<LoggingContext>[]): LoggingContext {
    if (contexts.length === 0) {
      const result = this.createContext();
      this.trackOperation('merge', 'mergeContexts', [[]], result);
      return result;
    }

    // Start with a base context
    const baseContext = this.createContext();
    
    // Merge all contexts, with later contexts taking precedence
    const result = contexts.reduce(
      (merged, context) => ({ ...merged, ...(context || {}) }),
      baseContext
    );

    // Track this operation
    this.trackOperation('merge', 'mergeContexts', [contexts], result);

    return result;
  }

  /**
   * Creates a complete context with request, user, and journey information
   * @param requestInfo Request information
   * @param userInfo User information
   * @param journeyInfo Journey information
   * @returns Complete context with all information
   */
  createCompleteContext(
    requestInfo?: Partial<RequestContext>,
    userInfo?: Partial<UserContext>,
    journeyInfo?: Partial<JourneyContext>
  ): LoggingContext {
    // If a preset complete context exists, use it
    if (this.presetContexts.complete) {
      const result = this.presetContexts.complete;
      this.trackOperation(
        'create',
        'createCompleteContext',
        [requestInfo, userInfo, journeyInfo],
        result
      );
      return result;
    }

    const contexts: Partial<LoggingContext>[] = [this.createContext()];

    // Add request context if provided
    if (requestInfo) {
      try {
        contexts.push(this.createRequestContext(requestInfo));
      } catch (error) {
        // Log error but continue with other contexts
        console.error('Error creating request context:', error);
      }
    }

    // Add user context if provided
    if (userInfo && userInfo.userId) {
      try {
        contexts.push(this.createUserContext(userInfo));
      } catch (error) {
        // Log error but continue with other contexts
        console.error('Error creating user context:', error);
      }
    }

    // Add journey context if provided
    if (journeyInfo && journeyInfo.journeyType) {
      try {
        contexts.push(this.createJourneyContext(journeyInfo));
      } catch (error) {
        // Log error but continue with other contexts
        console.error('Error creating journey context:', error);
      }
    }

    // Merge all contexts
    const result = this.mergeContexts(...contexts);

    // Track this operation
    this.trackOperation(
      'create',
      'createCompleteContext',
      [requestInfo, userInfo, journeyInfo],
      result
    );

    return result;
  }

  /**
   * Extracts context information for propagation across service boundaries
   * @param context Context to extract from
   * @returns Object with serialized context for propagation
   */
  extractContextForPropagation(context: LoggingContext): Record<string, string> {
    const propagationContext: Record<string, string> = {};

    // Include correlation ID for connecting logs
    if (context.correlationId) {
      propagationContext['x-correlation-id'] = context.correlationId;
    }

    // Include trace context for distributed tracing
    if (context.traceId) {
      propagationContext['traceparent'] = `00-${context.traceId}-${context.spanId || '0000000000000000'}-01`;
    }

    // Include journey information if available
    if (context.journeyType) {
      propagationContext['x-journey-type'] = context.journeyType.toString();
    }

    // Include user ID if available
    if (context.userId) {
      propagationContext['x-user-id'] = context.userId;
    }

    // Track this operation
    this.trackOperation('extract', 'extractContextForPropagation', [context], propagationContext);

    return propagationContext;
  }

  /**
   * Creates a context from propagated headers
   * @param headers Headers containing propagated context
   * @returns Context created from propagated information
   */
  createContextFromPropagation(headers: Record<string, string>): LoggingContext {
    const context = this.createContext();

    // Extract correlation ID
    if (headers['x-correlation-id']) {
      context.correlationId = headers['x-correlation-id'];
    }

    // Extract trace context
    if (headers['traceparent']) {
      try {
        // Expected format: 00-traceId-spanId-flags
        const parts = headers['traceparent'].split('-');
        if (parts.length === 4) {
          context.traceId = parts[1];
          context.spanId = parts[2];
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Extract journey information
    if (headers['x-journey-type']) {
      context.journeyType = headers['x-journey-type'] as any;
    }

    // Extract user ID
    if (headers['x-user-id']) {
      context.userId = headers['x-user-id'];
    }

    // Track this operation
    this.trackOperation('fromPropagation', 'createContextFromPropagation', [headers], context);

    return context;
  }

  /**
   * Creates a health journey context with preset values
   * @param customValues Custom values to include in the context
   * @returns Health journey context
   */
  createHealthJourneyContext(customValues?: Partial<JourneyContext>): JourneyContext {
    return this.createJourneyContext({
      journeyType: JourneyType.HEALTH,
      journeyState: {
        journeySessionId: uuidv4(),
        currentStep: 'health-dashboard',
      },
      businessTransaction: {
        transactionId: uuidv4(),
        transactionType: 'health-metrics-view',
        status: 'in-progress',
        startedAt: new Date().toISOString(),
      },
      ...customValues,
    });
  }

  /**
   * Creates a care journey context with preset values
   * @param customValues Custom values to include in the context
   * @returns Care journey context
   */
  createCareJourneyContext(customValues?: Partial<JourneyContext>): JourneyContext {
    return this.createJourneyContext({
      journeyType: JourneyType.CARE,
      journeyState: {
        journeySessionId: uuidv4(),
        currentStep: 'care-dashboard',
      },
      businessTransaction: {
        transactionId: uuidv4(),
        transactionType: 'appointment-booking',
        status: 'in-progress',
        startedAt: new Date().toISOString(),
      },
      ...customValues,
    });
  }

  /**
   * Creates a plan journey context with preset values
   * @param customValues Custom values to include in the context
   * @returns Plan journey context
   */
  createPlanJourneyContext(customValues?: Partial<JourneyContext>): JourneyContext {
    return this.createJourneyContext({
      journeyType: JourneyType.PLAN,
      journeyState: {
        journeySessionId: uuidv4(),
        currentStep: 'plan-dashboard',
      },
      businessTransaction: {
        transactionId: uuidv4(),
        transactionType: 'benefit-review',
        status: 'in-progress',
        startedAt: new Date().toISOString(),
      },
      ...customValues,
    });
  }

  /**
   * Creates a cross-journey context that spans multiple journeys
   * @param sourceJourney Source journey type
   * @param targetJourney Target journey type
   * @param customValues Custom values to include in the context
   * @returns Cross-journey context
   */
  createCrossJourneyContext(
    sourceJourney: JourneyType,
    targetJourney: JourneyType,
    customValues?: Partial<JourneyContext>
  ): JourneyContext {
    return this.createJourneyContext({
      journeyType: sourceJourney,
      crossJourneyContext: {
        sourceJourney,
        targetJourney,
        flowId: uuidv4(),
        startedAt: new Date().toISOString(),
      },
      businessTransaction: {
        transactionId: uuidv4(),
        transactionType: 'cross-journey-navigation',
        status: 'in-progress',
        startedAt: new Date().toISOString(),
      },
      ...customValues,
    });
  }

  /**
   * Sets a preset context for a specific type
   * @param type Type of context to preset
   * @param context Context to use for this type
   */
  setPresetContext(type: 'base' | 'request' | 'user' | 'journey' | 'complete', context: any): void {
    this.presetContexts[type] = context;
  }

  /**
   * Clears all preset contexts
   */
  clearPresetContexts(): void {
    this.presetContexts = {};
  }

  /**
   * Gets all tracked operations
   * @returns Array of tracked operations
   */
  getOperations(): ContextOperation[] {
    return [...this.operations];
  }

  /**
   * Clears all tracked operations
   */
  clearOperations(): void {
    this.operations = [];
  }

  /**
   * Gets operations of a specific type
   * @param type Type of operations to get
   * @returns Array of operations of the specified type
   */
  getOperationsByType(type: ContextOperation['type']): ContextOperation[] {
    return this.operations.filter(op => op.type === type);
  }

  /**
   * Gets operations for a specific method
   * @param method Method name to filter by
   * @returns Array of operations for the specified method
   */
  getOperationsByMethod(method: string): ContextOperation[] {
    return this.operations.filter(op => op.method === method);
  }

  /**
   * Tracks a context operation for test verification
   * @param type Type of operation
   * @param method Method name
   * @param args Method arguments
   * @param result Operation result
   */
  private trackOperation(type: ContextOperation['type'], method: string, args: any[], result: any): void {
    this.operations.push({
      type,
      method,
      args,
      result,
      timestamp: new Date(),
    });
  }
}