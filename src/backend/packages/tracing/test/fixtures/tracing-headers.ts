/**
 * @file tracing-headers.ts
 * @description Mock HTTP header collections with trace context information for testing.
 * Follows the W3C Trace Context standard for distributed tracing.
 */

/**
 * Interface representing HTTP headers with potential trace context information
 */
export interface HttpHeaders {
  [key: string]: string;
}

/**
 * Valid trace context header components
 */
export interface TraceContext {
  version: string;      // 2-character version (e.g., "00")
  traceId: string;      // 32-character hex trace ID
  parentId: string;     // 16-character hex parent ID
  traceFlags: string;   // 2-character hex flags
}

/**
 * Enum for trace sampling flags
 */
export enum TraceSamplingFlag {
  NOT_SAMPLED = '00',
  SAMPLED = '01',
}

/**
 * Enum for journey types to create journey-specific trace context
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Valid HTTP headers with complete trace context information
 */
export const validTraceHeaders: HttpHeaders = {
  traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
  tracestate: 'austa=t61rcWkgMzE,rojo=00f067aa0ba902b7',
};

/**
 * Valid HTTP headers with trace context but not sampled
 */
export const validNotSampledTraceHeaders: HttpHeaders = {
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00',
  tracestate: 'austa=00f067aa0ba902b7',
};

/**
 * Valid HTTP headers with only traceparent (no tracestate)
 */
export const validTraceParentOnlyHeaders: HttpHeaders = {
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
};

/**
 * Invalid HTTP headers with malformed trace-id (contains uppercase letters)
 */
export const invalidTraceIdCaseHeaders: HttpHeaders = {
  traceparent: '00-0AF7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
  tracestate: 'austa=t61rcWkgMzE',
};

/**
 * Invalid HTTP headers with malformed trace-id (all zeros)
 */
export const invalidTraceIdZeroHeaders: HttpHeaders = {
  traceparent: '00-00000000000000000000000000000000-b7ad6b7169203331-01',
  tracestate: 'austa=t61rcWkgMzE',
};

/**
 * Invalid HTTP headers with malformed parent-id (contains uppercase letters)
 */
export const invalidParentIdCaseHeaders: HttpHeaders = {
  traceparent: '00-0af7651916cd43dd8448eb211c80319c-B7AD6B7169203331-01',
  tracestate: 'austa=t61rcWkgMzE',
};

/**
 * Invalid HTTP headers with malformed parent-id (all zeros)
 */
export const invalidParentIdZeroHeaders: HttpHeaders = {
  traceparent: '00-0af7651916cd43dd8448eb211c80319c-0000000000000000-01',
  tracestate: 'austa=t61rcWkgMzE',
};

/**
 * Invalid HTTP headers with malformed version
 */
export const invalidVersionHeaders: HttpHeaders = {
  traceparent: 'ff-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
  tracestate: 'austa=t61rcWkgMzE',
};

/**
 * Invalid HTTP headers with incorrect format (missing dashes)
 */
export const invalidFormatHeaders: HttpHeaders = {
  traceparent: '000af7651916cd43dd8448eb211c80319cb7ad6b716920333101',
  tracestate: 'austa=t61rcWkgMzE',
};

/**
 * Incomplete HTTP headers with missing traceparent
 */
export const incompleteNoTraceParentHeaders: HttpHeaders = {
  tracestate: 'austa=t61rcWkgMzE,rojo=00f067aa0ba902b7',
};

/**
 * Incomplete HTTP headers with missing tracestate
 */
export const incompleteNoTraceStateHeaders: HttpHeaders = {
  traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
};

/**
 * HTTP headers with no trace context information
 */
export const noTraceContextHeaders: HttpHeaders = {
  'content-type': 'application/json',
  'user-agent': 'Mozilla/5.0',
};

/**
 * Journey-specific trace headers for Health journey
 */
export const healthJourneyTraceHeaders: HttpHeaders = {
  traceparent: '00-1af7651916cd43dd8448eb211c80319c-a7ad6b7169203331-01',
  tracestate: 'austa=health.metrics.update,rojo=00f067aa0ba902b7',
  'x-journey-context': 'health',
};

/**
 * Journey-specific trace headers for Care journey
 */
export const careJourneyTraceHeaders: HttpHeaders = {
  traceparent: '00-2af7651916cd43dd8448eb211c80319c-c7ad6b7169203331-01',
  tracestate: 'austa=care.appointment.create,rojo=00f067aa0ba902b7',
  'x-journey-context': 'care',
};

/**
 * Journey-specific trace headers for Plan journey
 */
export const planJourneyTraceHeaders: HttpHeaders = {
  traceparent: '00-3af7651916cd43dd8448eb211c80319c-d7ad6b7169203331-01',
  tracestate: 'austa=plan.benefits.view,rojo=00f067aa0ba902b7',
  'x-journey-context': 'plan',
};

/**
 * Generates a valid traceparent header string
 * @param traceId - The trace ID (32 hex chars)
 * @param parentId - The parent ID (16 hex chars)
 * @param sampled - Whether the trace is sampled
 * @returns A valid traceparent header string
 */
export function generateTraceParentHeader(
  traceId: string = generateTraceId(),
  parentId: string = generateParentId(),
  sampled: boolean = true
): string {
  const version = '00';
  const flags = sampled ? TraceSamplingFlag.SAMPLED : TraceSamplingFlag.NOT_SAMPLED;
  return `${version}-${traceId}-${parentId}-${flags}`;
}

/**
 * Generates a valid tracestate header string
 * @param vendorValues - Map of vendor names to their values
 * @returns A valid tracestate header string
 */
export function generateTraceStateHeader(vendorValues: Record<string, string>): string {
  return Object.entries(vendorValues)
    .map(([vendor, value]) => `${vendor}=${value}`)
    .join(',');
}

/**
 * Generates a random trace ID (32 lowercase hex characters)
 * @returns A valid trace ID string
 */
export function generateTraceId(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generates a random parent ID (16 lowercase hex characters)
 * @returns A valid parent ID string
 */
export function generateParentId(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Validates if a traceparent header string is valid according to W3C spec
 * @param traceparent - The traceparent header string to validate
 * @returns True if valid, false otherwise
 */
export function isValidTraceParentHeader(traceparent: string): boolean {
  // Basic format check: version-traceId-parentId-flags
  const parts = traceparent.split('-');
  if (parts.length !== 4) return false;
  
  const [version, traceId, parentId, flags] = parts;
  
  // Version check
  if (version !== '00' || version === 'ff') return false;
  
  // TraceId check: 32 lowercase hex chars, not all zeros
  if (!/^[0-9a-f]{32}$/.test(traceId) || traceId === '00000000000000000000000000000000') return false;
  
  // ParentId check: 16 lowercase hex chars, not all zeros
  if (!/^[0-9a-f]{16}$/.test(parentId) || parentId === '0000000000000000') return false;
  
  // Flags check: 2 lowercase hex chars
  if (!/^[0-9a-f]{2}$/.test(flags)) return false;
  
  return true;
}

/**
 * Creates journey-specific trace context headers
 * @param journeyType - The type of journey (health, care, plan)
 * @param operation - Optional operation name within the journey
 * @returns HTTP headers with journey-specific trace context
 */
export function createJourneyTraceHeaders(journeyType: JourneyType, operation?: string): HttpHeaders {
  const traceId = generateTraceId();
  const parentId = generateParentId();
  
  const traceparent = generateTraceParentHeader(traceId, parentId, true);
  
  const tracestate = generateTraceStateHeader({
    austa: operation ? `${journeyType}.${operation}` : journeyType,
    rojo: parentId,
  });
  
  return {
    traceparent,
    tracestate,
    'x-journey-context': journeyType,
  };
}

/**
 * Extracts trace context components from a traceparent header
 * @param traceparent - The traceparent header string
 * @returns Parsed trace context or null if invalid
 */
export function extractTraceContext(traceparent: string): TraceContext | null {
  if (!isValidTraceParentHeader(traceparent)) return null;
  
  const parts = traceparent.split('-');
  const [version, traceId, parentId, traceFlags] = parts;
  
  return {
    version,
    traceId,
    parentId,
    traceFlags,
  };
}