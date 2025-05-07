import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loggerFactory } from '@austa/interfaces/common';

/**
 * Security headers configuration for the AUSTA SuperApp
 * These headers protect against common web vulnerabilities
 */
const securityHeaders = {
  // Content Security Policy - restricts sources of content
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.austa.health;",
  
  // HTTP Strict Transport Security - forces HTTPS
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // X-Content-Type-Options - prevents MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // X-Frame-Options - prevents clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Referrer-Policy - controls referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Custom middleware protection indicator
  'X-Middleware-Protected': '1'
};

// Create a logger instance for security events
const securityLogger = loggerFactory('security-middleware');

/**
 * Structured logging function for security events
 * Follows the logging strategy defined in the technical specification
 * 
 * @param level - Log level (DEBUG, INFO, WARN, ERROR, FATAL)
 * @param message - Log message
 * @param data - Additional data to include in the log
 */
function logSecurityEvent(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL', message: string, data: Record<string, any>) {
  const requestId = data.requestId || 'unknown';
  const userId = data.userId || 'anonymous';
  const journey = data.journey || 'system';
  
  // Use the logger from @austa/interfaces/common
  switch(level) {
    case 'DEBUG':
      securityLogger.debug(message, { requestId, userId, journey, ...data });
      break;
    case 'INFO':
      securityLogger.info(message, { requestId, userId, journey, ...data });
      break;
    case 'WARN':
      securityLogger.warn(message, { requestId, userId, journey, ...data });
      break;
    case 'ERROR':
      securityLogger.error(message, { requestId, userId, journey, ...data });
      break;
    case 'FATAL':
      securityLogger.error(message, { requestId, userId, journey, isFatal: true, ...data });
      break;
    default:
      securityLogger.info(message, { requestId, userId, journey, ...data });
  }
}

/**
 * Middleware to protect against the Authorization Bypass vulnerability (CVE-2024-36289)
 * and apply security headers to all responses
 * 
 * This middleware provides additional protection beyond the patched version (14.2.25)
 * by explicitly checking for and rejecting any requests containing the x-middleware-subrequest
 * header, which could be used in an authorization bypass attack.
 */
export function middleware(request: NextRequest) {
  // Generate a request ID for tracing
  const requestId = crypto.randomUUID();
  
  // Extract journey from URL path if possible
  const urlPath = request.nextUrl.pathname;
  let journey = 'system';
  
  if (urlPath.includes('/health')) {
    journey = 'health';
  } else if (urlPath.includes('/care')) {
    journey = 'care';
  } else if (urlPath.includes('/plan')) {
    journey = 'plan';
  } else if (urlPath.includes('/auth')) {
    journey = 'auth';
  }
  
  // Check for the x-middleware-subrequest header which could be used in the attack
  if (request.headers.get('x-middleware-subrequest')) {
    // Log potential attack attempt with structured logging
    logSecurityEvent('WARN', 'Potential authorization bypass attempt detected', {
      requestId,
      journey,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
    
    // Return 403 Forbidden for potential attack
    return new NextResponse('Forbidden', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        ...securityHeaders
      },
    });
  }
  
  // Log successful request processing
  logSecurityEvent('INFO', 'Request processed by security middleware', {
    requestId,
    journey,
    url: request.url,
    method: request.method
  });
  
  // Add security headers to the response
  const response = NextResponse.next();
  
  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Match only paths that could require authorization
export const config = {
  matcher: [
    // Skip public files and API routes
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};