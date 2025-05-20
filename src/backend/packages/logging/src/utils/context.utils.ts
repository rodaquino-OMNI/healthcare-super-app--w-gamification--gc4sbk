/**
 * Utilities for working with logging contexts in the journey-based architecture.
 * Provides functions for creating, merging, and manipulating various context types.
 */

import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Context interfaces
export interface LoggingContext {
  /** Unique identifier for the current request */
  requestId?: string;
  /** Correlation ID for tracing across services */
  correlationId?: string;
  /** Timestamp when the context was created */
  timestamp?: string;
  /** Service name that generated the log */
  serviceName?: string;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Additional metadata for the context */
  metadata?: Record<string, unknown>;
}

export interface RequestContext extends LoggingContext {
  /** HTTP method of the request */
  method?: string;
  /** Request URL path */
  path?: string;
  /** Client IP address */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Request headers (sanitized) */
  headers?: Record<string, string>;
  /** Request query parameters (sanitized) */
  query?: Record<string, unknown>;
}

export interface UserContext extends LoggingContext {
  /** User identifier */
  userId?: string;
  /** Authentication status */
  isAuthenticated?: boolean;
  /** User roles */
  roles?: string[];
  /** User preferences affecting system behavior */
  preferences?: Record<string, unknown>;
}

export type JourneyType = 'Health' | 'Care' | 'Plan';

export interface JourneyContext extends LoggingContext {
  /** Type of journey (Health, Care, Plan) */
  journeyType?: JourneyType;
  /** Current step in the journey */
  journeyStep?: string;
  /** Journey-specific state */
  journeyState?: Record<string, unknown>;
  /** Cross-journey context when needed */
  crossJourneyData?: Record<string, unknown>;
}

/**
 * Creates a base logging context with common properties.
 * 
 * @param serviceName - The name of the service generating the log
 * @param metadata - Additional metadata to include in the context
 * @returns A base logging context
 */
export function createBaseContext(serviceName?: string, metadata?: Record<string, unknown>): LoggingContext {
  return {
    requestId: uuidv4(),
    correlationId: uuidv4(),
    timestamp: new Date().toISOString(),
    serviceName: serviceName || process.env.SERVICE_NAME || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    metadata: metadata || {},
  };
}

/**
 * Creates a request context from an Express request object.
 * 
 * @param req - The Express request object
 * @param baseContext - Optional base context to extend
 * @returns A request context with HTTP-specific information
 */
export function createRequestContext(req: Request, baseContext?: LoggingContext): RequestContext {
  // Extract headers while filtering out sensitive information
  const sanitizedHeaders = { ...req.headers };
  // Remove sensitive headers
  delete sanitizedHeaders.authorization;
  delete sanitizedHeaders.cookie;
  
  // Create the request context
  return {
    ...baseContext || createBaseContext(),
    requestId: req.headers['x-request-id'] as string || uuidv4(),
    correlationId: req.headers['x-correlation-id'] as string || req.headers['x-request-id'] as string || uuidv4(),
    method: req.method,
    path: req.path,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] as string,
    headers: sanitizedHeaders as Record<string, string>,
    query: sanitizeObject(req.query),
  };
}

/**
 * Creates a user context with user-specific information.
 * 
 * @param userId - The user identifier
 * @param isAuthenticated - Whether the user is authenticated
 * @param roles - User roles
 * @param preferences - User preferences
 * @param baseContext - Optional base context to extend
 * @returns A user context
 */
export function createUserContext(
  userId?: string,
  isAuthenticated?: boolean,
  roles?: string[],
  preferences?: Record<string, unknown>,
  baseContext?: LoggingContext
): UserContext {
  return {
    ...baseContext || createBaseContext(),
    userId,
    isAuthenticated,
    roles,
    preferences,
  };
}

/**
 * Creates a journey context for journey-specific logging.
 * 
 * @param journeyType - The type of journey (Health, Care, Plan)
 * @param journeyStep - Current step in the journey
 * @param journeyState - Journey-specific state
 * @param crossJourneyData - Data shared across journeys
 * @param baseContext - Optional base context to extend
 * @returns A journey context
 */
export function createJourneyContext(
  journeyType?: JourneyType,
  journeyStep?: string,
  journeyState?: Record<string, unknown>,
  crossJourneyData?: Record<string, unknown>,
  baseContext?: LoggingContext
): JourneyContext {
  return {
    ...baseContext || createBaseContext(),
    journeyType,
    journeyStep,
    journeyState,
    crossJourneyData,
  };
}

/**
 * Creates a Health journey context.
 * 
 * @param journeyStep - Current step in the Health journey
 * @param journeyState - Health journey-specific state
 * @param baseContext - Optional base context to extend
 * @returns A Health journey context
 */
export function createHealthJourneyContext(
  journeyStep?: string,
  journeyState?: Record<string, unknown>,
  baseContext?: LoggingContext
): JourneyContext {
  return createJourneyContext('Health', journeyStep, journeyState, undefined, baseContext);
}

/**
 * Creates a Care journey context.
 * 
 * @param journeyStep - Current step in the Care journey
 * @param journeyState - Care journey-specific state
 * @param baseContext - Optional base context to extend
 * @returns A Care journey context
 */
export function createCareJourneyContext(
  journeyStep?: string,
  journeyState?: Record<string, unknown>,
  baseContext?: LoggingContext
): JourneyContext {
  return createJourneyContext('Care', journeyStep, journeyState, undefined, baseContext);
}

/**
 * Creates a Plan journey context.
 * 
 * @param journeyStep - Current step in the Plan journey
 * @param journeyState - Plan journey-specific state
 * @param baseContext - Optional base context to extend
 * @returns A Plan journey context
 */
export function createPlanJourneyContext(
  journeyStep?: string,
  journeyState?: Record<string, unknown>,
  baseContext?: LoggingContext
): JourneyContext {
  return createJourneyContext('Plan', journeyStep, journeyState, undefined, baseContext);
}

/**
 * Merges multiple contexts together, with later contexts overriding earlier ones.
 * 
 * @param contexts - Array of contexts to merge
 * @returns A merged context
 */
export function mergeContexts<T extends LoggingContext>(...contexts: (LoggingContext | undefined)[]): T {
  return contexts.reduce((merged, context) => {
    if (!context) return merged;
    return { ...merged, ...context };
  }, {}) as T;
}

/**
 * Extracts context information from an Express request.
 * 
 * @param req - The Express request object
 * @returns A combined context with request and user information
 */
export function extractContextFromRequest(req: Request): LoggingContext {
  const requestContext = createRequestContext(req);
  
  // Extract user context if user is authenticated
  let userContext: UserContext | undefined;
  if (req.user) {
    userContext = createUserContext(
      (req.user as any).id || (req.user as any).userId,
      true,
      (req.user as any).roles,
      (req.user as any).preferences
    );
  }
  
  // Extract journey context if available
  let journeyContext: JourneyContext | undefined;
  if ((req as any).journey) {
    const journey = (req as any).journey;
    journeyContext = createJourneyContext(
      journey.type,
      journey.step,
      journey.state,
      journey.crossJourneyData
    );
  }
  
  // Merge all contexts
  return mergeContexts(requestContext, userContext, journeyContext);
}

/**
 * Creates context headers for propagating context in service-to-service communication.
 * 
 * @param context - The context to propagate
 * @returns Headers for context propagation
 */
export function createContextHeaders(context: LoggingContext): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (context.requestId) {
    headers['x-request-id'] = context.requestId;
  }
  
  if (context.correlationId) {
    headers['x-correlation-id'] = context.correlationId;
  }
  
  // Add journey context if available
  const journeyContext = context as JourneyContext;
  if (journeyContext.journeyType) {
    headers['x-journey-type'] = journeyContext.journeyType;
  }
  
  // Add user context if available
  const userContext = context as UserContext;
  if (userContext.userId) {
    headers['x-user-id'] = userContext.userId;
  }
  
  return headers;
}

/**
 * Extracts context from incoming headers for service-to-service communication.
 * 
 * @param headers - The headers containing context information
 * @returns A context object extracted from headers
 */
export function extractContextFromHeaders(headers: Record<string, string | string[] | undefined>): LoggingContext {
  const context: LoggingContext = createBaseContext();
  
  // Extract basic context
  if (headers['x-request-id']) {
    context.requestId = headers['x-request-id'] as string;
  }
  
  if (headers['x-correlation-id']) {
    context.correlationId = headers['x-correlation-id'] as string;
  }
  
  // Extract journey context
  const journeyContext = context as JourneyContext;
  if (headers['x-journey-type']) {
    const journeyType = headers['x-journey-type'] as string;
    if (journeyType === 'Health' || journeyType === 'Care' || journeyType === 'Plan') {
      journeyContext.journeyType = journeyType;
    }
  }
  
  // Extract user context
  const userContext = context as UserContext;
  if (headers['x-user-id']) {
    userContext.userId = headers['x-user-id'] as string;
    userContext.isAuthenticated = true;
  }
  
  return context;
}

/**
 * Gets the client IP address from an Express request.
 * 
 * @param req - The Express request object
 * @returns The client IP address
 */
function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  if (xForwardedFor) {
    // Get the first IP in case of multiple proxies
    return xForwardedFor.split(',')[0].trim();
  }
  
  return req.ip || req.socket.remoteAddress || '';
}

/**
 * Sanitizes an object by removing sensitive information and handling circular references.
 * 
 * @param obj - The object to sanitize
 * @returns A sanitized copy of the object
 */
function sanitizeObject(obj: any): Record<string, unknown> {
  if (!obj) return {};
  
  // Create a new object to avoid modifying the original
  const sanitized: Record<string, unknown> = {};
  const seen = new WeakSet();
  
  // Sensitive keys to filter out
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'key'];
  
  // Helper function to handle circular references and sensitive data
  const sanitizeValue = (key: string, value: any): any => {
    // Filter out sensitive keys
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      return '[REDACTED]';
    }
    
    // Handle primitive types
    if (value === null || value === undefined || typeof value !== 'object') {
      return value;
    }
    
    // Handle circular references
    if (seen.has(value)) {
      return '[Circular]';
    }
    
    // Add object to seen set
    seen.add(value);
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => sanitizeValue(`${key}[${index}]`, item));
    }
    
    // Handle objects
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeValue(k, v);
    }
    
    return result;
  };
  
  // Process each key in the object
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(key, value);
  }
  
  return sanitized;
}