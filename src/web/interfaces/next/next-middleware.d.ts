/**
 * Type definitions for Next.js Edge middleware in the AUSTA SuperApp
 * 
 * This file provides TypeScript declarations for middleware functions, configurations,
 * and matchers, ensuring type-safe implementation of security, routing, and performance
 * optimizations across all user journeys.
 *
 * @module @austa/interfaces/next/next-middleware
 */

import type { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import type { JWTPayload } from '../auth/token.types';

/**
 * Journey types supported in the AUSTA SuperApp
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'home' | 'auth';

/**
 * Extended NextRequest with AUSTA SuperApp specific properties
 */
export interface AustaNextRequest extends NextRequest {
  /**
   * Decoded JWT payload if authentication is successful
   * Will be undefined if no valid token is present
   */
  auth?: {
    /**
     * Decoded JWT payload
     */
    token: JWTPayload;
    
    /**
     * Whether the token is valid and not expired
     */
    isAuthenticated: boolean;
    
    /**
     * User ID from the token
     */
    userId: string;
    
    /**
     * User roles from the token
     */
    roles: string[];
  };
  
  /**
   * Current journey context
   */
  journey?: {
    /**
     * Current journey type
     */
    type: JourneyType;
    
    /**
     * Whether the current journey requires authentication
     */
    requiresAuth: boolean;
    
    /**
     * Required roles for accessing the current journey
     */
    requiredRoles?: string[];
  };
}

/**
 * Base middleware function type
 */
export type AustaMiddleware = (
  request: AustaNextRequest,
  event: NextFetchEvent
) => Promise<NextResponse | Response | undefined | null> | NextResponse | Response | undefined | null;

/**
 * Authentication middleware function type
 */
export type AuthMiddleware = (
  request: AustaNextRequest,
  event: NextFetchEvent
) => Promise<AustaNextRequest>;

/**
 * Journey-specific middleware function type
 */
export type JourneyMiddleware = (
  request: AustaNextRequest,
  event: NextFetchEvent,
  journeyType: JourneyType
) => Promise<NextResponse | Response | undefined | null> | NextResponse | Response | undefined | null;

/**
 * Configuration for middleware matchers
 */
export interface MiddlewareConfig {
  /**
   * Matcher configuration for the middleware
   * Can be a string, array of strings, or a complex matcher object
   */
  matcher: string | string[] | {
    /**
     * Path pattern to match
     */
    source: string;
    
    /**
     * Optional regular expression for fine-tuning matching
     */
    regexp?: string;
    
    /**
     * Whether to ignore locale-based routing in path matching
     */
    locale?: boolean;
  }[];
  
  /**
   * Runtime for the middleware (defaults to 'edge')
   */
  runtime?: 'edge' | 'nodejs';
  
  /**
   * Unstable option to allow dynamic code evaluation for specific files
   */
  unstable_allowDynamic?: string | string[];
}

/**
 * JWT validation options for middleware
 */
export interface JwtValidationOptions {
  /**
   * Secret key for JWT validation
   * Can be a string or a function that returns a string
   */
  secret: string | (() => string | Promise<string>);
  
  /**
   * Cookie name where the JWT token is stored
   * @default 'austa.token'
   */
  cookieName?: string;
  
  /**
   * Whether to secure the cookie
   * @default true in production, false in development
   */
  secureCookie?: boolean;
  
  /**
   * Custom token decode function
   */
  decode?: (token: string, secret: string) => Promise<JWTPayload | null>;
}

/**
 * Authentication middleware options
 */
export interface AuthMiddlewareOptions {
  /**
   * JWT validation options
   */
  jwt: JwtValidationOptions;
  
  /**
   * Pages configuration for authentication
   */
  pages?: {
    /**
     * Sign in page URL
     * @default '/login'
     */
    signIn?: string;
    
    /**
     * Error page URL
     * @default '/error'
     */
    error?: string;
    
    /**
     * Unauthorized page URL
     * @default '/unauthorized'
     */
    unauthorized?: string;
  };
  
  /**
   * Callbacks for authentication middleware
   */
  callbacks?: {
    /**
     * Callback to determine if a user is authorized
     */
    authorized?: (params: { req: AustaNextRequest; token: JWTPayload | null }) => boolean | Promise<boolean>;
  };
}

/**
 * Journey middleware options
 */
export interface JourneyMiddlewareOptions {
  /**
   * Journey type
   */
  journeyType: JourneyType;
  
  /**
   * Whether the journey requires authentication
   * @default false
   */
  requiresAuth?: boolean;
  
  /**
   * Required roles for accessing the journey
   */
  requiredRoles?: string[];
  
  /**
   * Callback to determine if a user can access the journey
   */
  canAccess?: (params: { req: AustaNextRequest; token: JWTPayload | null }) => boolean | Promise<boolean>;
}

/**
 * Creates an authentication middleware function
 */
export type CreateAuthMiddleware = (options: AuthMiddlewareOptions) => AuthMiddleware;

/**
 * Creates a journey-specific middleware function
 */
export type CreateJourneyMiddleware = (options: JourneyMiddlewareOptions) => JourneyMiddleware;

/**
 * Combines multiple middleware functions into a single middleware function
 */
export type CombineMiddleware = (...middlewares: AustaMiddleware[]) => AustaMiddleware;

/**
 * Helper function to create a response with an error
 */
export type CreateErrorResponse = (params: {
  status: number;
  message: string;
  journey?: JourneyType;
}) => NextResponse;

/**
 * Helper function to create a redirect response
 */
export type CreateRedirectResponse = (params: {
  destination: string;
  status?: 301 | 302 | 303 | 307 | 308;
  journey?: JourneyType;
}) => NextResponse;

/**
 * Helper function to create a success response
 */
export type CreateSuccessResponse = (params: {
  status?: number;
  data?: any;
  journey?: JourneyType;
}) => NextResponse;

/**
 * Helper function to validate a JWT token
 */
export type ValidateJwt = (params: {
  request: AustaNextRequest;
  options: JwtValidationOptions;
}) => Promise<{
  isValid: boolean;
  payload: JWTPayload | null;
  error?: string;
}>;

/**
 * Helper function to determine the current journey from the request
 */
export type DetermineJourney = (request: AustaNextRequest) => {
  journeyType: JourneyType;
  requiresAuth: boolean;
  requiredRoles?: string[];
};

/**
 * Helper function to check if a user has the required roles
 */
export type HasRequiredRoles = (params: {
  userRoles: string[];
  requiredRoles: string[];
}) => boolean;

/**
 * Helper function to create a middleware that handles CORS
 */
export type CreateCorsMiddleware = (params: {
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  allowCredentials?: boolean;
}) => AustaMiddleware;

/**
 * Helper function to create a middleware that handles rate limiting
 */
export type CreateRateLimitMiddleware = (params: {
  limit: number;
  windowMs: number;
  keyGenerator?: (req: AustaNextRequest) => string;
  handler?: (req: AustaNextRequest) => NextResponse | Response;
}) => AustaMiddleware;

/**
 * Helper function to create a middleware that handles security headers
 */
export type CreateSecurityHeadersMiddleware = (params: {
  contentSecurityPolicy?: string | boolean;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | boolean;
  xContentTypeOptions?: 'nosniff' | boolean;
  referrerPolicy?: string | boolean;
  permissionsPolicy?: string | boolean;
  strictTransportSecurity?: string | boolean;
}) => AustaMiddleware;