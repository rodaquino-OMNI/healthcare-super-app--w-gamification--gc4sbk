import { Injectable } from '@nestjs/common';
import { LogContext } from '../interfaces/logger.interface';
import { JourneyType } from '../interfaces/log-entry.interface';

/**
 * Service responsible for managing logging contexts throughout the application.
 * Provides methods for creating, merging, and manipulating logging contexts.
 * Integrates with the tracing service for correlation IDs.
 *
 * This class centralizes context management to ensure consistent context information
 * across all logs in the AUSTA SuperApp. It supports the journey-centered architecture
 * by providing specialized methods for journey-specific contexts and cross-journey operations.
 */
@Injectable()
export class ContextManager {
  /**
   * Creates a new context object with the provided properties.
   * This is a general-purpose method for creating contexts with arbitrary properties.
   * For specific context types, use the specialized methods like createJourneyContext,
   * createUserContext, etc.
   * 
   * @param context Partial context object to initialize with
   * @returns A new LogContext object
   * @example
   * // Create a custom context
   * const customContext = contextManager.createContext({
   *   service: 'api-gateway',
   *   operation: 'authenticate',
   *   metadata: { source: 'mobile-app' }
   * });
   */
  createContext(context?: Partial<LogContext>): LogContext {
    return { ...context };
  }

  /**
   * Creates a journey-specific context.
   * @param journey The journey type (health, care, plan)
   * @param metadata Additional metadata for the journey context
   * @returns A LogContext with journey information
   * @example
   * // Create a health journey context
   * const healthContext = contextManager.createJourneyContext('health', { metricType: 'heart_rate' });
   */
  createJourneyContext(
    journey: 'health' | 'care' | 'plan',
    metadata?: Record<string, any>,
  ): LogContext {
    return {
      journey,
      metadata,
    };
  }

  /**
   * Creates a user-specific context.
   * This method enables user activity tracking across the application,
   * which is essential for user-centric logging and analytics.
   * 
   * @param userId The ID of the user
   * @param metadata Additional metadata for the user context
   * @returns A LogContext with user information
   * @example
   * // Create a user context
   * const userContext = contextManager.createUserContext('user123', { role: 'patient' });
   */
  createUserContext(userId: string, metadata?: Record<string, any>): LogContext {
    return {
      userId,
      metadata,
    };
  }

  /**
   * Creates a request-specific context.
   * This method is crucial for tracking requests across multiple services
   * and correlating logs from different parts of the application that handle
   * the same request.
   * 
   * @param requestId The ID of the request
   * @param correlationId Optional correlation ID for the request
   * @param metadata Additional metadata for the request context
   * @returns A LogContext with request information
   * @example
   * // In a NestJS interceptor
   * const requestId = request.id || uuidv4();
   * const requestContext = contextManager.createRequestContext(requestId);
   */
  createRequestContext(
    requestId: string,
    correlationId?: string,
    metadata?: Record<string, any>,
  ): LogContext {
    return {
      requestId,
      correlationId,
      metadata,
    };
  }

  /**
   * Creates a trace-specific context.
   * This method enables integration with distributed tracing systems like OpenTelemetry,
   * allowing logs to be correlated with traces for comprehensive observability.
   * 
   * @param traceId The ID of the trace
   * @param spanId Optional span ID within the trace
   * @param metadata Additional metadata for the trace context
   * @returns A LogContext with trace information
   * @example
   * // Create a trace context from OpenTelemetry span
   * const span = tracer.getCurrentSpan();
   * const spanContext = span.context();
   * const traceContext = contextManager.createTraceContext(
   *   spanContext.traceId,
   *   spanContext.spanId
   * );
   */
  createTraceContext(
    traceId: string,
    spanId?: string,
    metadata?: Record<string, any>,
  ): LogContext {
    return {
      traceId,
      spanId,
      metadata,
    };
  }

  /**
   * Merges multiple contexts together, with later contexts overriding earlier ones.
   * This method is particularly useful for combining different types of contexts,
   * such as user context, journey context, and request context.
   * 
   * @param contexts Array of contexts to merge
   * @returns A new merged LogContext
   * @throws Error if any context is invalid
   * @example
   * // Merge user context and journey context
   * const userContext = contextManager.createUserContext('user123');
   * const journeyContext = contextManager.createJourneyContext('health');
   * const mergedContext = contextManager.mergeContexts(userContext, journeyContext);
   */
  mergeContexts(...contexts: LogContext[]): LogContext {
    try {
      // Filter out undefined or null contexts
      const validContexts = contexts.filter(context => context != null);
      
      if (validContexts.length === 0) {
        return {};
      }

      // Start with an empty context
      const mergedContext: LogContext = {};
      
      // Merge all metadata objects separately to avoid overriding
      const allMetadata: Record<string, any> = {};
      
      // Process each context
      for (const context of validContexts) {
        // Merge metadata separately
        if (context.metadata) {
          Object.assign(allMetadata, context.metadata);
        }
        
        // Merge other properties
        Object.assign(mergedContext, context);
      }
      
      // Assign the merged metadata
      if (Object.keys(allMetadata).length > 0) {
        mergedContext.metadata = allMetadata;
      }
      
      return mergedContext;
    } catch (error) {
      throw new Error(`Failed to merge contexts: ${error.message}`);
    }
  }

  /**
   * Extracts context from a trace context for propagation across service boundaries.
   * This method is essential for maintaining context continuity in distributed systems,
   * allowing logs from different services to be correlated.
   * 
   * The extracted context can be passed as headers in HTTP requests or as metadata
   * in message broker payloads.
   * 
   * @param context The context to extract from
   * @returns A serializable context object for propagation
   * @throws Error if extraction fails
   * @example
   * // Extract context for HTTP headers
   * const context = logger.getContext();
   * const headers = contextManager.extractContextForPropagation(context);
   * // headers can now be added to an HTTP request
   */
  extractContextForPropagation(context: LogContext): Record<string, string> {
    try {
      const propagationContext: Record<string, string> = {};
      
      // Extract key fields for propagation
      if (context.traceId) propagationContext['trace-id'] = context.traceId;
      if (context.spanId) propagationContext['span-id'] = context.spanId;
      if (context.correlationId) propagationContext['correlation-id'] = context.correlationId;
      if (context.requestId) propagationContext['request-id'] = context.requestId;
      if (context.userId) propagationContext['user-id'] = context.userId;
      if (context.journey) propagationContext['journey'] = context.journey;
      
      return propagationContext;
    } catch (error) {
      throw new Error(`Failed to extract context for propagation: ${error.message}`);
    }
  }

  /**
   * Injects a propagated context into a new LogContext object.
   * This method is the counterpart to extractContextForPropagation and is used
   * to reconstruct a LogContext from propagated headers or metadata.
   * 
   * @param propagatedContext The propagated context headers/object
   * @returns A new LogContext with the propagated values
   * @throws Error if injection fails
   * @example
   * // In a receiving service, reconstruct context from HTTP headers
   * const headers = request.headers;
   * const context = contextManager.injectPropagatedContext(headers);
   * // Now use this context for logging in the receiving service
   */
  injectPropagatedContext(propagatedContext: Record<string, string>): LogContext {
    try {
      const context: LogContext = {};
      
      // Map propagated fields back to context
      if (propagatedContext['trace-id']) context.traceId = propagatedContext['trace-id'];
      if (propagatedContext['span-id']) context.spanId = propagatedContext['span-id'];
      if (propagatedContext['correlation-id']) context.correlationId = propagatedContext['correlation-id'];
      if (propagatedContext['request-id']) context.requestId = propagatedContext['request-id'];
      if (propagatedContext['user-id']) context.userId = propagatedContext['user-id'];
      if (propagatedContext['journey']) {
        const journey = propagatedContext['journey'];
        if (journey === 'health' || journey === 'care' || journey === 'plan') {
          context.journey = journey;
        }
      }
      
      return context;
    } catch (error) {
      throw new Error(`Failed to inject propagated context: ${error.message}`);
    }
  }

  /**
   * Enriches a context with trace information from the current active span.
   * This method should be used when integrating with OpenTelemetry or other tracing systems.
   * 
   * By connecting logs with traces, this method enables powerful observability capabilities,
   * allowing developers to correlate logs with distributed traces for comprehensive
   * request flow analysis.
   * 
   * @param context The context to enrich
   * @param traceId The trace ID from the active span
   * @param spanId The span ID from the active span
   * @returns A new context with trace information
   * @example
   * // In a NestJS interceptor or middleware
   * const span = tracer.startSpan('operation');
   * const enrichedContext = contextManager.enrichWithTraceContext(
   *   existingContext,
   *   span.context().traceId,
   *   span.context().spanId
   * );
   */
  enrichWithTraceContext(
    context: LogContext,
    traceId: string,
    spanId?: string,
  ): LogContext {
    try {
      return this.mergeContexts(context, { traceId, spanId });
    } catch (error) {
      // Fail gracefully if trace enrichment fails
      return context;
    }
  }

  /**
   * Creates a context specifically for cross-journey operations.
   * This is particularly important for the gamification engine and other
   * components that operate across multiple journeys.
   * 
   * @param journeys The journeys involved in the operation
   * @param metadata Additional metadata for the cross-journey context
   * @returns A LogContext for cross-journey operations
   * @example
   * // Create a context for an operation involving health and care journeys
   * const crossJourneyContext = contextManager.createCrossJourneyContext(
   *   ['health', 'care'],
   *   { operation: 'achievement_unlock', achievementId: 'daily_checkup' }
   * );
   */
  createCrossJourneyContext(
    journeys: Array<'health' | 'care' | 'plan'>,
    metadata?: Record<string, any>,
  ): LogContext {
    return {
      journey: 'shared',
      metadata: {
        ...metadata,
        involvedJourneys: journeys,
      },
    };
  }

  /**
   * Adds service information to a context.
   * This method enriches logs with information about which service generated them,
   * making it easier to filter and analyze logs in a microservices architecture.
   * 
   * @param context The context to enrich
   * @param serviceName The name of the service
   * @param operation Optional operation being performed
   * @returns A new context with service information
   * @example
   * // Add service information to a context
   * const enrichedContext = contextManager.addServiceInfo(
   *   existingContext,
   *   'health-service',
   *   'fetch-metrics'
   * );
   */
  addServiceInfo(
    context: LogContext,
    serviceName: string,
    operation?: string,
  ): LogContext {
    return this.mergeContexts(context, {
      service: serviceName,
      operation,
    });
  }

  /**
   * Validates a context object to ensure it has the required properties for a specific use case.
   * This method is useful for ensuring that contexts have the necessary information
   * before they are used in critical operations.
   * 
   * @param context The context to validate
   * @param requiredProps Array of property names that must be present
   * @returns True if the context is valid, false otherwise
   * @example
   * // Validate that a context has both userId and traceId
   * const isValid = contextManager.validateContext(context, ['userId', 'traceId']);
   * if (!isValid) {
   *   throw new Error('Invalid context for this operation');
   * }
   */
  validateContext(context: LogContext, requiredProps: Array<keyof LogContext>): boolean {
    if (!context) return false;
    
    return requiredProps.every(prop => 
      Object.prototype.hasOwnProperty.call(context, prop) && 
      context[prop] !== undefined && 
      context[prop] !== null
    );
  }
}