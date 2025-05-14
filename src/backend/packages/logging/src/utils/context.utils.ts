/**
 * Utilities for working with logging contexts in the journey-based architecture.
 * Provides functions for creating, merging, and manipulating various context types,
 * including standard contexts, HTTP request contexts, and journey-specific contexts.
 */

import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Standard context properties that should be included in all logs
 */
export interface StandardContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  timestamp?: string;
  service?: string;
  environment?: string;
}

/**
 * HTTP request-specific context properties
 */
export interface RequestContext {
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  responseTime?: number;
}

/**
 * Journey-specific context properties
 */
export interface JourneyContext {
  journeyType?: 'health' | 'care' | 'plan';
  journeyAction?: string;
  journeyStep?: string;
  journeyId?: string;
}

/**
 * Health journey-specific context properties
 */
export interface HealthJourneyContext extends JourneyContext {
  journeyType: 'health';
  metricType?: string;
  deviceId?: string;
  goalId?: string;
}

/**
 * Care journey-specific context properties
 */
export interface CareJourneyContext extends JourneyContext {
  journeyType: 'care';
  appointmentId?: string;
  providerId?: string;
  treatmentId?: string;
  medicationId?: string;
}

/**
 * Plan journey-specific context properties
 */
export interface PlanJourneyContext extends JourneyContext {
  journeyType: 'plan';
  planId?: string;
  benefitId?: string;
  claimId?: string;
  documentId?: string;
}

/**
 * Combined logging context with all possible properties
 */
export type LogContext = StandardContext & 
  Partial<RequestContext> & 
  Partial<JourneyContext> & 
  Partial<HealthJourneyContext | CareJourneyContext | PlanJourneyContext>;

/**
 * Creates a standard context with common properties
 * 
 * @param context - Optional partial context to extend
 * @returns A standard context object with default values for missing properties
 */
export function createStandardContext(context?: Partial<StandardContext>): StandardContext {
  return {
    requestId: context?.requestId || uuidv4(),
    timestamp: context?.timestamp || new Date().toISOString(),
    service: context?.service || process.env.SERVICE_NAME || 'unknown',
    environment: context?.environment || process.env.NODE_ENV || 'development',
    userId: context?.userId,
    sessionId: context?.sessionId,
    correlationId: context?.correlationId,
  };
}

/**
 * Extracts context information from an HTTP request
 * 
 * @param req - Express Request object
 * @returns Request context extracted from the HTTP request
 */
export function extractRequestContext(req: Request): RequestContext & Partial<StandardContext> {
  const headers = req.headers;
  
  return {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: headers['user-agent'] as string,
    requestId: (headers['x-request-id'] || headers['x-correlation-id']) as string,
    userId: headers['x-user-id'] as string,
    sessionId: headers['x-session-id'] as string,
    correlationId: headers['x-correlation-id'] as string,
  };
}

/**
 * Creates a journey context based on the journey type
 * 
 * @param journeyType - Type of journey (health, care, or plan)
 * @param context - Additional journey-specific context properties
 * @returns Journey-specific context object
 */
export function createJourneyContext(
  journeyType: 'health' | 'care' | 'plan',
  context?: Partial<JourneyContext>
): JourneyContext {
  return {
    journeyType,
    journeyAction: context?.journeyAction,
    journeyStep: context?.journeyStep,
    journeyId: context?.journeyId || uuidv4(),
  };
}

/**
 * Creates a health journey-specific context
 * 
 * @param context - Health journey context properties
 * @returns Health journey context object
 */
export function createHealthJourneyContext(
  context?: Partial<HealthJourneyContext>
): HealthJourneyContext {
  return {
    ...createJourneyContext('health', context),
    journeyType: 'health',
    metricType: context?.metricType,
    deviceId: context?.deviceId,
    goalId: context?.goalId,
  };
}

/**
 * Creates a care journey-specific context
 * 
 * @param context - Care journey context properties
 * @returns Care journey context object
 */
export function createCareJourneyContext(
  context?: Partial<CareJourneyContext>
): CareJourneyContext {
  return {
    ...createJourneyContext('care', context),
    journeyType: 'care',
    appointmentId: context?.appointmentId,
    providerId: context?.providerId,
    treatmentId: context?.treatmentId,
    medicationId: context?.medicationId,
  };
}

/**
 * Creates a plan journey-specific context
 * 
 * @param context - Plan journey context properties
 * @returns Plan journey context object
 */
export function createPlanJourneyContext(
  context?: Partial<PlanJourneyContext>
): PlanJourneyContext {
  return {
    ...createJourneyContext('plan', context),
    journeyType: 'plan',
    planId: context?.planId,
    benefitId: context?.benefitId,
    claimId: context?.claimId,
    documentId: context?.documentId,
  };
}

/**
 * Merges multiple context objects into a single context
 * 
 * @param contexts - Array of context objects to merge
 * @returns Combined context object with properties from all input contexts
 */
export function mergeContexts(...contexts: Partial<LogContext>[]): LogContext {
  return contexts.reduce((merged, context) => ({ ...merged, ...context }), {});
}

/**
 * Creates a complete log context by combining standard, request, and journey contexts
 * 
 * @param standardContext - Standard context properties
 * @param requestContext - Request-specific context properties
 * @param journeyContext - Journey-specific context properties
 * @returns Combined log context with all provided properties
 */
export function createLogContext(
  standardContext?: Partial<StandardContext>,
  requestContext?: Partial<RequestContext>,
  journeyContext?: Partial<JourneyContext | HealthJourneyContext | CareJourneyContext | PlanJourneyContext>
): LogContext {
  return mergeContexts(
    createStandardContext(standardContext),
    requestContext || {},
    journeyContext || {}
  );
}

/**
 * Creates context headers for propagating context in service-to-service communication
 * 
 * @param context - Log context to convert to headers
 * @returns Object with context properties formatted as HTTP headers
 */
export function createContextHeaders(context: Partial<LogContext>): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (context.requestId) headers['x-request-id'] = context.requestId;
  if (context.correlationId) headers['x-correlation-id'] = context.correlationId;
  if (context.userId) headers['x-user-id'] = context.userId;
  if (context.sessionId) headers['x-session-id'] = context.sessionId;
  
  if (context.journeyType) headers['x-journey-type'] = context.journeyType;
  if (context.journeyId) headers['x-journey-id'] = context.journeyId;
  if (context.journeyAction) headers['x-journey-action'] = context.journeyAction;
  
  return headers;
}

/**
 * Extracts context from incoming headers for service-to-service communication
 * 
 * @param headers - HTTP headers containing context information
 * @returns Log context extracted from headers
 */
export function extractContextFromHeaders(headers: Record<string, string | string[]>): Partial<LogContext> {
  const context: Partial<LogContext> = {};
  
  // Helper to get string value from header which might be string or string[]
  const getHeaderValue = (key: string): string | undefined => {
    const value = headers[key];
    return value ? (Array.isArray(value) ? value[0] : value) : undefined;
  };
  
  // Standard context
  context.requestId = getHeaderValue('x-request-id');
  context.correlationId = getHeaderValue('x-correlation-id');
  context.userId = getHeaderValue('x-user-id');
  context.sessionId = getHeaderValue('x-session-id');
  
  // Journey context
  const journeyType = getHeaderValue('x-journey-type') as 'health' | 'care' | 'plan' | undefined;
  if (journeyType) {
    context.journeyType = journeyType;
    context.journeyId = getHeaderValue('x-journey-id');
    context.journeyAction = getHeaderValue('x-journey-action');
    context.journeyStep = getHeaderValue('x-journey-step');
    
    // Add journey-specific properties based on journey type
    switch (journeyType) {
      case 'health':
        context.metricType = getHeaderValue('x-metric-type');
        context.deviceId = getHeaderValue('x-device-id');
        context.goalId = getHeaderValue('x-goal-id');
        break;
      case 'care':
        context.appointmentId = getHeaderValue('x-appointment-id');
        context.providerId = getHeaderValue('x-provider-id');
        context.treatmentId = getHeaderValue('x-treatment-id');
        context.medicationId = getHeaderValue('x-medication-id');
        break;
      case 'plan':
        context.planId = getHeaderValue('x-plan-id');
        context.benefitId = getHeaderValue('x-benefit-id');
        context.claimId = getHeaderValue('x-claim-id');
        context.documentId = getHeaderValue('x-document-id');
        break;
    }
  }
  
  return context;
}

/**
 * Enriches an existing context with additional properties
 * 
 * @param baseContext - Base context to enrich
 * @param additionalContext - Additional context properties to add
 * @returns Enriched context with combined properties
 */
export function enrichContext(
  baseContext: Partial<LogContext>,
  additionalContext: Partial<LogContext>
): LogContext {
  return mergeContexts(baseContext, additionalContext);
}

/**
 * Sanitizes a context object by removing undefined or null values
 * 
 * @param context - Context object to sanitize
 * @returns Sanitized context with only defined values
 */
export function sanitizeContext(context: Partial<LogContext>): Partial<LogContext> {
  return Object.entries(context).reduce((sanitized, [key, value]) => {
    if (value !== undefined && value !== null) {
      sanitized[key as keyof LogContext] = value;
    }
    return sanitized;
  }, {} as Partial<LogContext>);
}