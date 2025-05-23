/**
 * Test fixtures for W3C Trace Context HTTP headers
 * 
 * This file contains mock HTTP header collections that contain trace context information,
 * following the W3C Trace Context standard. These fixtures are used for testing the extraction
 * and injection of trace context from/to HTTP headers to ensure proper context propagation
 * in distributed tracing across service boundaries.
 * 
 * @see https://www.w3.org/TR/trace-context/
 */

/**
 * Interface representing HTTP headers with potential tracing information
 */
export interface HttpHeaders {
  [key: string]: string;
}

/**
 * Interface for W3C Trace Context components
 */
export interface TraceContext {
  version: string;      // Version of the trace context format (e.g., "00")
  traceId: string;      // Unique identifier for the whole trace (32 hex chars)
  parentId: string;     // Identifier for the parent span (16 hex chars)
  traceFlags: string;   // Trace flags as hex string (e.g., "01" for sampled)
}

/**
 * Valid HTTP headers with W3C Trace Context information
 */
export const validTracingHeaders: HttpHeaders = {
  traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
  tracestate: 'austa=journey-health,rojo=00f067aa0ba902b7'
};

/**
 * Valid HTTP headers with W3C Trace Context information and sampling disabled
 */
export const validNonSampledTracingHeaders: HttpHeaders = {
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00',
  tracestate: 'austa=journey-care,rojo=00f067aa0ba902b7'
};

/**
 * Valid HTTP headers with only traceparent (no tracestate)
 */
export const validTraceparentOnlyHeaders: HttpHeaders = {
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
};

/**
 * Invalid HTTP headers with malformed traceparent
 */
export const invalidTraceparentHeaders: HttpHeaders = {
  traceparent: 'XYZ-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
  tracestate: 'austa=journey-plan,rojo=00f067aa0ba902b7'
};

/**
 * Invalid HTTP headers with missing parts in traceparent
 */
export const incompleteTraceparentHeaders: HttpHeaders = {
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7', // missing trace flags
  tracestate: 'austa=journey-health,rojo=00f067aa0ba902b7'
};

/**
 * Invalid HTTP headers with invalid trace ID (all zeros)
 */
export const invalidTraceIdHeaders: HttpHeaders = {
  traceparent: '00-00000000000000000000000000000000-b7ad6b7169203331-01',
  tracestate: 'austa=journey-care,rojo=00f067aa0ba902b7'
};

/**
 * Invalid HTTP headers with invalid parent ID (all zeros)
 */
export const invalidParentIdHeaders: HttpHeaders = {
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01',
  tracestate: 'austa=journey-plan,rojo=00f067aa0ba902b7'
};

/**
 * Invalid HTTP headers with invalid version (FF is reserved)
 */
export const invalidVersionHeaders: HttpHeaders = {
  traceparent: 'ff-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01',
  tracestate: 'austa=journey-health,rojo=00f067aa0ba902b7'
};

/**
 * HTTP headers with future version (hypothetical)
 */
export const futureVersionHeaders: HttpHeaders = {
  traceparent: '01-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01-extended-data',
  tracestate: 'austa=journey-care,rojo=00f067aa0ba902b7'
};

/**
 * Journey-specific tracing headers - Health Journey
 */
export const healthJourneyHeaders: HttpHeaders = {
  traceparent: '00-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6-1234567890abcdef-01',
  tracestate: 'austa=journey-health,health-service=metrics-update'
};

/**
 * Journey-specific tracing headers - Care Journey
 */
export const careJourneyHeaders: HttpHeaders = {
  traceparent: '00-b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a1-2345678901abcdef-01',
  tracestate: 'austa=journey-care,care-service=appointment-booking'
};

/**
 * Journey-specific tracing headers - Plan Journey
 */
export const planJourneyHeaders: HttpHeaders = {
  traceparent: '00-c3d4e5f6a7b8c9d0e1f2a3b4c5d6a1b2-3456789012abcdef-01',
  tracestate: 'austa=journey-plan,plan-service=benefits-query'
};

/**
 * Journey-specific tracing headers - Gamification
 */
export const gamificationHeaders: HttpHeaders = {
  traceparent: '00-d4e5f6a7b8c9d0e1f2a3b4c5d6a1b2c3-456789012abcdef3-01',
  tracestate: 'austa=journey-gamification,gamification-engine=achievement-unlock'
};

/**
 * Parses a traceparent header value into its components
 * 
 * @param traceparent The traceparent header value
 * @returns The parsed trace context or null if invalid
 */
export function parseTraceparent(traceparent: string): TraceContext | null {
  // Regular expression for version 00 traceparent format
  const v00Regex = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
  const match = traceparent.match(v00Regex);
  
  if (!match) {
    return null;
  }
  
  const [, traceId, parentId, traceFlags] = match;
  
  // Validate trace ID and parent ID are not all zeros
  if (traceId === '00000000000000000000000000000000' || parentId === '0000000000000000') {
    return null;
  }
  
  return {
    version: '00',
    traceId,
    parentId,
    traceFlags
  };
}

/**
 * Validates if the provided headers contain valid W3C Trace Context
 * 
 * @param headers HTTP headers to validate
 * @returns true if headers contain valid trace context, false otherwise
 */
export function hasValidTraceContext(headers: HttpHeaders): boolean {
  const traceparent = headers.traceparent || headers.TRACEPARENT;
  
  if (!traceparent) {
    return false;
  }
  
  return parseTraceparent(traceparent) !== null;
}

/**
 * Generates a valid traceparent header value with random IDs
 * 
 * @param sampled Whether the trace is sampled (default: true)
 * @returns A valid traceparent header value
 */
export function generateTraceparent(sampled: boolean = true): string {
  // Generate random trace ID (32 hex chars)
  const traceId = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)).join('');
  
  // Generate random parent ID (16 hex chars)
  const parentId = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)).join('');
  
  // Set trace flags (01 for sampled, 00 for not sampled)
  const traceFlags = sampled ? '01' : '00';
  
  return `00-${traceId}-${parentId}-${traceFlags}`;
}

/**
 * Creates a complete set of tracing headers with optional journey context
 * 
 * @param journey Optional journey identifier (health, care, plan, gamification)
 * @param sampled Whether the trace is sampled (default: true)
 * @returns HTTP headers with trace context
 */
export function createTracingHeaders(journey?: 'health' | 'care' | 'plan' | 'gamification', sampled: boolean = true): HttpHeaders {
  const traceparent = generateTraceparent(sampled);
  let tracestate = '';
  
  if (journey) {
    tracestate = `austa=journey-${journey}`;
    
    // Add journey-specific context
    switch (journey) {
      case 'health':
        tracestate += ',health-service=user-metrics';
        break;
      case 'care':
        tracestate += ',care-service=provider-search';
        break;
      case 'plan':
        tracestate += ',plan-service=coverage-check';
        break;
      case 'gamification':
        tracestate += ',gamification-engine=points-award';
        break;
    }
  }
  
  const headers: HttpHeaders = { traceparent };
  
  if (tracestate) {
    headers.tracestate = tracestate;
  }
  
  return headers;
}