import { JourneyType } from '../../src/context/context.constants';
import {
  ContextManager,
  ContextOptions,
  JourneyContext,
  LoggingContext,
  RequestContext,
  TracingService,
  UserContext,
} from '../../src/context/context-manager';

/**
 * Mock implementation of the TracingService for testing.
 * Provides configurable trace IDs for testing context enrichment.
 */
export class MockTracingService implements TracingService {
  private traceId?: string;
  private spanId?: string;
  private parentSpanId?: string;
  private spans: { name: string; options?: any }[] = [];

  /**
   * Configure the trace IDs returned by this mock
   */
  setTraceIds(traceId?: string, spanId?: string, parentSpanId?: string): void {
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentSpanId = parentSpanId;
  }

  /**
   * Get the spans created during testing
   */
  getSpans(): { name: string; options?: any }[] {
    return [...this.spans];
  }

  /**
   * Clear all recorded spans
   */
  clearSpans(): void {
    this.spans = [];
  }

  /**
   * Gets the current trace ID
   */
  getCurrentTraceId(): string | undefined {
    return this.traceId;
  }

  /**
   * Gets the current span ID
   */
  getCurrentSpanId(): string | undefined {
    return this.spanId;
  }

  /**
   * Gets the parent span ID
   */
  getParentSpanId(): string | undefined {
    return this.parentSpanId;
  }

  /**
   * Creates a new span with the given name and options
   */
  createSpan(name: string, options?: any): any {
    this.spans.push({ name, options });
    return { id: `span_${this.spans.length}` };
  }

  /**
   * Ends the current span
   */
  endSpan(): void {
    // No-op in mock implementation
  }
}

/**
 * Interface for tracking context operations in tests
 */
export interface ContextOperation {
  method: string;
  args: any[];
  result: any;
}

/**
 * Mock implementation of the ContextManager for testing.
 * Provides configurable contexts and tracks context operations for verification.
 */
export class MockContextManager extends ContextManager {
  /**
   * Tracks all operations performed on this context manager
   */
  private operations: ContextOperation[] = [];

  /**
   * Preconfigured contexts that will be returned by the various methods
   */
  private configuredContexts: {
    base?: LoggingContext;
    journey?: Record<JourneyType, JourneyContext>;
    user?: Record<string, UserContext>;
    request?: Record<string, RequestContext>;
    complete?: LoggingContext;
  } = {
    journey: {} as Record<JourneyType, JourneyContext>,
    user: {} as Record<string, UserContext>,
    request: {} as Record<string, RequestContext>,
  };

  /**
   * Creates a new MockContextManager instance
   */
  constructor(
    options?: {
      serviceName?: string;
      tracingService?: TracingService;
    },
    initialContexts?: {
      base?: LoggingContext;
      journey?: Record<JourneyType, JourneyContext>;
      user?: Record<string, UserContext>;
      request?: Record<string, RequestContext>;
      complete?: LoggingContext;
    },
  ) {
    super(options);
    if (initialContexts) {
      this.configuredContexts = {
        ...this.configuredContexts,
        ...initialContexts,
      };
    }
  }

  /**
   * Get all recorded operations for verification in tests
   */
  getOperations(): ContextOperation[] {
    return [...this.operations];
  }

  /**
   * Get operations filtered by method name
   */
  getOperationsByMethod(methodName: string): ContextOperation[] {
    return this.operations.filter((op) => op.method === methodName);
  }

  /**
   * Clear all recorded operations
   */
  clearOperations(): void {
    this.operations = [];
  }

  /**
   * Configure a base context to be returned by createContext
   */
  setBaseContext(context: LoggingContext): void {
    this.configuredContexts.base = context;
  }

  /**
   * Configure a journey context to be returned by createJourneyContext
   */
  setJourneyContext(journeyType: JourneyType, context: JourneyContext): void {
    this.configuredContexts.journey = {
      ...this.configuredContexts.journey,
      [journeyType]: context,
    };
  }

  /**
   * Configure a user context to be returned by createUserContext
   */
  setUserContext(userId: string, context: UserContext): void {
    this.configuredContexts.user = {
      ...this.configuredContexts.user,
      [userId]: context,
    };
  }

  /**
   * Configure a request context to be returned by createRequestContext
   */
  setRequestContext(requestId: string, context: RequestContext): void {
    this.configuredContexts.request = {
      ...this.configuredContexts.request,
      [requestId]: context,
    };
  }

  /**
   * Configure a complete context to be returned by createCompleteContext
   */
  setCompleteContext(context: LoggingContext): void {
    this.configuredContexts.complete = context;
  }

  /**
   * Creates a base logging context with common properties
   * @override
   */
  createContext(options?: ContextOptions): LoggingContext {
    // Use configured context if available, otherwise call super
    const result = this.configuredContexts.base || super.createContext(options);
    
    // Record the operation
    this.recordOperation('createContext', [options], result);
    
    return result;
  }

  /**
   * Creates a journey-specific context
   * @override
   */
  createJourneyContext(
    journeyType: JourneyType,
    options?: ContextOptions & {
      resourceId?: string;
      action?: string;
      journeyData?: Record<string, any>;
    },
  ): JourneyContext {
    // Use configured context if available, otherwise call super
    const result = 
      this.configuredContexts.journey?.[journeyType] || 
      super.createJourneyContext(journeyType, options);
    
    // Record the operation
    this.recordOperation('createJourneyContext', [journeyType, options], result);
    
    return result;
  }

  /**
   * Creates a user-specific context
   * @override
   */
  createUserContext(
    userId: string,
    options?: ContextOptions & {
      sessionId?: string;
      roles?: string[];
      isAuthenticated?: boolean;
      userData?: Record<string, any>;
    },
  ): UserContext {
    // Use configured context if available, otherwise call super
    const result = 
      this.configuredContexts.user?.[userId] || 
      super.createUserContext(userId, options);
    
    // Record the operation
    this.recordOperation('createUserContext', [userId, options], result);
    
    return result;
  }

  /**
   * Creates a request-specific context
   * @override
   */
  createRequestContext(
    requestId: string,
    options?: ContextOptions & {
      method?: string;
      url?: string;
      path?: string;
      clientIp?: string;
      userAgent?: string;
      params?: Record<string, any>;
      headers?: Record<string, any>;
    },
  ): RequestContext {
    // Use configured context if available, otherwise call super
    const result = 
      this.configuredContexts.request?.[requestId] || 
      super.createRequestContext(requestId, options);
    
    // Record the operation
    this.recordOperation('createRequestContext', [requestId, options], result);
    
    return result;
  }

  /**
   * Merges multiple contexts into a single context
   * @override
   */
  mergeContexts<T extends LoggingContext>(...contexts: LoggingContext[]): T {
    const result = super.mergeContexts<T>(...contexts);
    
    // Record the operation
    this.recordOperation('mergeContexts', contexts, result);
    
    return result;
  }

  /**
   * Creates a complete context by merging journey, user, and request contexts
   * @override
   */
  createCompleteContext(options: {
    journeyType?: JourneyType;
    resourceId?: string;
    action?: string;
    journeyData?: Record<string, any>;
    userId?: string;
    sessionId?: string;
    roles?: string[];
    userData?: Record<string, any>;
    requestId?: string;
    method?: string;
    url?: string;
    path?: string;
    clientIp?: string;
    userAgent?: string;
    params?: Record<string, any>;
    headers?: Record<string, any>;
    includeTraceInfo?: boolean;
    serviceName?: string;
    metadata?: Record<string, any>;
  }): LoggingContext {
    // Use configured context if available, otherwise call super
    const result = 
      this.configuredContexts.complete || 
      super.createCompleteContext(options);
    
    // Record the operation
    this.recordOperation('createCompleteContext', [options], result);
    
    return result;
  }

  /**
   * Extracts context information from a request object
   * @override
   */
  extractContextFromRequest(request: any): RequestContext {
    const result = super.extractContextFromRequest(request);
    
    // Record the operation
    this.recordOperation('extractContextFromRequest', [request], result);
    
    return result;
  }

  /**
   * Serializes a context to a string for transmission across service boundaries
   * @override
   */
  serializeContext(context: LoggingContext): string {
    const result = super.serializeContext(context);
    
    // Record the operation
    this.recordOperation('serializeContext', [context], result);
    
    return result;
  }

  /**
   * Deserializes a context string back into a context object
   * @override
   */
  deserializeContext(contextString: string): LoggingContext {
    const result = super.deserializeContext(contextString);
    
    // Record the operation
    this.recordOperation('deserializeContext', [contextString], result);
    
    return result;
  }

  /**
   * Enriches a context with trace information from the tracing service
   * @override
   */
  enrichWithTraceInfo<T extends LoggingContext>(context: T): T {
    const result = super.enrichWithTraceInfo(context);
    
    // Record the operation
    this.recordOperation('enrichWithTraceInfo', [context], result);
    
    return result;
  }

  /**
   * Creates a health journey context with predefined options
   * Convenience method for testing health journey features
   */
  createHealthJourneyContext(options?: {
    resourceId?: string;
    action?: string;
    journeyData?: Record<string, any>;
    includeTraceInfo?: boolean;
    serviceName?: string;
    metadata?: Record<string, any>;
  }): JourneyContext {
    return this.createJourneyContext(JourneyType.HEALTH, options);
  }

  /**
   * Creates a care journey context with predefined options
   * Convenience method for testing care journey features
   */
  createCareJourneyContext(options?: {
    resourceId?: string;
    action?: string;
    journeyData?: Record<string, any>;
    includeTraceInfo?: boolean;
    serviceName?: string;
    metadata?: Record<string, any>;
  }): JourneyContext {
    return this.createJourneyContext(JourneyType.CARE, options);
  }

  /**
   * Creates a plan journey context with predefined options
   * Convenience method for testing plan journey features
   */
  createPlanJourneyContext(options?: {
    resourceId?: string;
    action?: string;
    journeyData?: Record<string, any>;
    includeTraceInfo?: boolean;
    serviceName?: string;
    metadata?: Record<string, any>;
  }): JourneyContext {
    return this.createJourneyContext(JourneyType.PLAN, options);
  }

  /**
   * Records an operation for later verification in tests
   */
  private recordOperation(method: string, args: any[], result: any): void {
    this.operations.push({
      method,
      args,
      result,
    });
  }
}