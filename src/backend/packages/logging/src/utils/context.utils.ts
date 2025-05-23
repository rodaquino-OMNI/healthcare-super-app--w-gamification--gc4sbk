/**
 * Utilities for working with logging contexts in the journey-based architecture.
 * Provides functions for creating, merging, and manipulating various context types.
 */
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Import interfaces from the context module
import {
  LoggingContext,
  RequestContext,
  UserContext,
  JourneyContext,
} from '../context';

// Import constants for journey types
import { JourneyType } from '../context/context.constants';

/**
 * Creates a base logging context with common properties.
 * @returns A new LoggingContext with default values
 */
export const createBaseContext = (): LoggingContext => {
  return {
    correlationId: uuidv4(),
    timestamp: new Date().toISOString(),
    serviceName: process.env.SERVICE_NAME || 'unknown-service',
    serviceVersion: process.env.SERVICE_VERSION || 'unknown-version',
    environment: process.env.NODE_ENV || 'development',
  };
};

/**
 * Creates a request context from an Express Request object.
 * @param req - The Express Request object
 * @returns A RequestContext with information extracted from the request
 */
export const createRequestContext = (req: Request): RequestContext => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Extract trace IDs for correlation if they exist
  const traceId = req.headers['x-trace-id'] as string || undefined;
  const spanId = req.headers['x-span-id'] as string || undefined;
  
  return {
    ...createBaseContext(),
    requestId,
    traceId,
    spanId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'],
    // Sanitize query parameters to avoid logging sensitive information
    query: sanitizeObject(req.query),
    // Sanitize request body to avoid logging sensitive information
    body: sanitizeObject(req.body),
  };
};

/**
 * Creates a user context with user-specific information.
 * @param userId - The ID of the user
 * @param roles - Optional array of user roles
 * @param additionalInfo - Optional additional user information
 * @returns A UserContext with the provided information
 */
export const createUserContext = (
  userId: string,
  roles: string[] = [],
  additionalInfo: Record<string, any> = {}
): UserContext => {
  return {
    ...createBaseContext(),
    userId,
    isAuthenticated: true,
    roles,
    ...additionalInfo,
  };
};

/**
 * Creates a journey context for the specified journey type.
 * @param journeyType - The type of journey (Health, Care, Plan)
 * @param journeyState - Optional journey-specific state information
 * @returns A JourneyContext with the provided information
 */
export const createJourneyContext = (
  journeyType: JourneyType,
  journeyState: Record<string, any> = {}
): JourneyContext => {
  return {
    ...createBaseContext(),
    journeyType,
    journeyState,
  };
};

/**
 * Creates a Health journey context with health-specific information.
 * @param healthMetrics - Optional health metrics information
 * @param deviceInfo - Optional connected device information
 * @returns A JourneyContext for the Health journey
 */
export const createHealthJourneyContext = (
  healthMetrics: Record<string, any> = {},
  deviceInfo: Record<string, any> = {}
): JourneyContext => {
  return createJourneyContext(JourneyType.HEALTH, {
    healthMetrics,
    deviceInfo,
  });
};

/**
 * Creates a Care journey context with care-specific information.
 * @param appointmentInfo - Optional appointment information
 * @param providerInfo - Optional healthcare provider information
 * @returns A JourneyContext for the Care journey
 */
export const createCareJourneyContext = (
  appointmentInfo: Record<string, any> = {},
  providerInfo: Record<string, any> = {}
): JourneyContext => {
  return createJourneyContext(JourneyType.CARE, {
    appointmentInfo,
    providerInfo,
  });
};

/**
 * Creates a Plan journey context with plan-specific information.
 * @param planInfo - Optional insurance plan information
 * @param claimInfo - Optional claim information
 * @returns A JourneyContext for the Plan journey
 */
export const createPlanJourneyContext = (
  planInfo: Record<string, any> = {},
  claimInfo: Record<string, any> = {}
): JourneyContext => {
  return createJourneyContext(JourneyType.PLAN, {
    planInfo,
    claimInfo,
  });
};

/**
 * Merges multiple contexts into a single context object.
 * Later contexts will override properties from earlier contexts if there are conflicts.
 * @param contexts - Array of context objects to merge
 * @returns A merged context object
 */
export const mergeContexts = (
  ...contexts: Record<string, any>[]
): Record<string, any> => {
  return contexts.reduce((merged, context) => {
    return { ...merged, ...context };
  }, {});
};

/**
 * Extracts context information from request headers for context propagation.
 * @param headers - HTTP headers object
 * @returns A partial context object with propagated values
 */
export const extractContextFromHeaders = (
  headers: Record<string, string | string[] | undefined>
): Partial<LoggingContext> => {
  const context: Partial<LoggingContext> = {};
  
  // Extract correlation ID
  if (headers['x-correlation-id']) {
    context.correlationId = headers['x-correlation-id'] as string;
  }
  
  // Extract trace IDs for distributed tracing
  if (headers['x-trace-id']) {
    context.traceId = headers['x-trace-id'] as string;
  }
  
  if (headers['x-span-id']) {
    context.spanId = headers['x-span-id'] as string;
  }
  
  // Extract journey information if available
  if (headers['x-journey-type']) {
    context.journeyType = headers['x-journey-type'] as JourneyType;
  }
  
  // Extract user ID if available
  if (headers['x-user-id']) {
    context.userId = headers['x-user-id'] as string;
  }
  
  return context;
};

/**
 * Prepares context headers for propagation to another service.
 * @param context - The context object to propagate
 * @returns An object with headers for context propagation
 */
export const createContextPropagationHeaders = (
  context: Record<string, any>
): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // Add correlation ID
  if (context.correlationId) {
    headers['x-correlation-id'] = context.correlationId;
  }
  
  // Add trace IDs for distributed tracing
  if (context.traceId) {
    headers['x-trace-id'] = context.traceId;
  }
  
  if (context.spanId) {
    headers['x-span-id'] = context.spanId;
  }
  
  // Add journey information if available
  if (context.journeyType) {
    headers['x-journey-type'] = context.journeyType;
  }
  
  // Add user ID if available
  if (context.userId) {
    headers['x-user-id'] = context.userId;
  }
  
  // Add request ID if available
  if (context.requestId) {
    headers['x-request-id'] = context.requestId;
  }
  
  return headers;
};

/**
 * Extracts context from an Express Request object, combining request, user, and journey contexts.
 * @param req - The Express Request object
 * @returns A combined context object
 */
export const extractContextFromRequest = (req: Request): Record<string, any> => {
  // Create request context
  const requestContext = createRequestContext(req);
  
  // Extract user context if user is authenticated
  const userContext = req.user
    ? createUserContext(
        (req.user as any).id || (req.user as any).userId,
        (req.user as any).roles || [],
        { email: (req.user as any).email }
      )
    : {};
  
  // Extract journey context if journey type is specified
  let journeyContext = {};
  const journeyType = req.headers['x-journey-type'] as JourneyType;
  
  if (journeyType) {
    journeyContext = createJourneyContext(journeyType);
  }
  
  // Merge all contexts
  return mergeContexts(requestContext, userContext, journeyContext);
};

/**
 * Gets the client IP address from an Express Request object.
 * Handles various proxy scenarios and headers.
 * @param req - The Express Request object
 * @returns The client IP address
 */
const getClientIp = (req: Request): string => {
  // Check for X-Forwarded-For header (common in proxy setups)
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  if (xForwardedFor) {
    // Get the first IP in the list (client IP)
    const ips = xForwardedFor.split(',');
    return ips[0].trim();
  }
  
  // Check for other common proxy headers
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'] as string;
  }
  
  // Fall back to the remote address from the request
  return req.ip || req.connection.remoteAddress || 'unknown';
};

/**
 * Sanitizes an object to remove sensitive information before logging.
 * @param obj - The object to sanitize
 * @returns A sanitized copy of the object
 */
const sanitizeObject = (obj: any): any => {
  if (!obj) return obj;
  
  // Create a copy to avoid modifying the original
  const sanitized = { ...obj };
  
  // List of sensitive field names to mask
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'credentials',
    'credit_card',
    'creditCard',
    'ssn',
    'socialSecurity',
    'social_security',
  ];
  
  // Recursively sanitize the object
  const sanitizeRecursive = (object: any): any => {
    if (!object || typeof object !== 'object') return object;
    
    const result: any = Array.isArray(object) ? [] : {};
    
    for (const key in object) {
      // Check if this is a sensitive field
      const isSensitive = sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (isSensitive) {
        // Mask sensitive values
        result[key] = '[REDACTED]';
      } else if (typeof object[key] === 'object' && object[key] !== null) {
        // Recursively sanitize nested objects
        result[key] = sanitizeRecursive(object[key]);
      } else {
        // Keep non-sensitive values as is
        result[key] = object[key];
      }
    }
    
    return result;
  };
  
  return sanitizeRecursive(sanitized);
};