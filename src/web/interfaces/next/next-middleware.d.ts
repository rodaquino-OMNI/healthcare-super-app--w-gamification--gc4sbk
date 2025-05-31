/**
 * Type declarations for Next.js Edge middleware in the AUSTA SuperApp
 * 
 * This file provides type definitions for middleware functions, configurations, and matchers,
 * ensuring type-safe implementation of security, routing, and performance optimizations
 * across all user journeys.
 */

import type { NextRequest, NextResponse, NextFetchEvent } from 'next/server';

// Extend the Next.js middleware types
declare module 'next/server' {
  /**
   * Extended NextRequest interface with AUSTA-specific properties
   */
  interface NextRequest {
    /**
     * Journey context information extracted from the request
     */
    journeyContext?: JourneyContext;
  }
}

/**
 * Authentication token payload structure
 */
export interface AuthTokenPayload {
  /** Unique user identifier */
  userId: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name?: string;
  /** List of user roles */
  roles: string[];
  /** List of user permissions */
  permissions: string[];
  /** Token issued at timestamp */
  iat: number;
  /** Token expiration timestamp */
  exp: number;
  /** Token issuer */
  iss: string;
  /** Token audience */
  aud: string;
}

/**
 * Authentication result from middleware validation
 */
export interface AuthResult {
  /** Whether the authentication was successful */
  isAuthenticated: boolean;
  /** The decoded token payload if authentication was successful */
  payload?: AuthTokenPayload;
  /** Error message if authentication failed */
  error?: string;
}

/**
 * Journey context information
 */
export interface JourneyContext {
  /** The current journey (health, care, plan) */
  currentJourney: 'health' | 'care' | 'plan' | null;
  /** Whether the current route is journey-specific */
  isJourneyRoute: boolean;
  /** Journey-specific data */
  data?: Record<string, any>;
}

/**
 * Middleware handler function type
 */
export type MiddlewareHandler = (
  request: NextRequest,
  event: NextFetchEvent
) => Promise<NextResponse | Response> | NextResponse | Response;

/**
 * Authentication middleware configuration
 */
export interface AuthMiddlewareConfig {
  /** Whether to enable JWT validation */
  enableJwtValidation: boolean;
  /** Public routes that don't require authentication */
  publicRoutes?: string[];
  /** Routes that require specific roles */
  roleProtectedRoutes?: Record<string, string[]>;
  /** Custom error handling */
  onAuthError?: (request: NextRequest, error: string) => NextResponse | Response;
  /** Custom success handling */
  onAuthSuccess?: (request: NextRequest, payload: AuthTokenPayload) => NextResponse | Response | void;
  /** JWT validation options */
  jwtOptions?: JwtValidationOptions;
}

/**
 * JWT validation options
 */
export interface JwtValidationOptions {
  /** The name of the cookie containing the JWT token */
  cookieName: string;
  /** The secret used to verify the JWT token */
  secret: string;
  /** The algorithms allowed for JWT verification */
  algorithms: string[];
  /** Whether to check token expiration */
  ignoreExpiration?: boolean;
  /** Additional validation function */
  customValidation?: (payload: AuthTokenPayload) => boolean | Promise<boolean>;
}

/**
 * Health journey middleware configuration
 */
export interface HealthJourneyMiddlewareConfig {
  /** Routes specific to the health journey */
  routes: string[];
  /** Whether to require device connection for certain routes */
  requireDeviceConnection?: boolean;
  /** Routes that require specific health permissions */
  permissionProtectedRoutes?: Record<string, string[]>;
  /** Custom handlers for health journey routes */
  handlers?: Record<string, MiddlewareHandler>;
}

/**
 * Care journey middleware configuration
 */
export interface CareJourneyMiddlewareConfig {
  /** Routes specific to the care journey */
  routes: string[];
  /** Whether to enforce appointment validation */
  validateAppointments?: boolean;
  /** Routes that require specific care permissions */
  permissionProtectedRoutes?: Record<string, string[]>;
  /** Custom handlers for care journey routes */
  handlers?: Record<string, MiddlewareHandler>;
}

/**
 * Plan journey middleware configuration
 */
export interface PlanJourneyMiddlewareConfig {
  /** Routes specific to the plan journey */
  routes: string[];
  /** Whether to validate insurance coverage */
  validateCoverage?: boolean;
  /** Routes that require specific plan permissions */
  permissionProtectedRoutes?: Record<string, string[]>;
  /** Custom handlers for plan journey routes */
  handlers?: Record<string, MiddlewareHandler>;
}

/**
 * Combined journey middleware configuration
 */
export interface JourneyMiddlewareConfig {
  /** Health journey configuration */
  health?: HealthJourneyMiddlewareConfig;
  /** Care journey configuration */
  care?: CareJourneyMiddlewareConfig;
  /** Plan journey configuration */
  plan?: PlanJourneyMiddlewareConfig;
  /** Cross-journey routes */
  crossJourneyRoutes?: string[];
  /** Default journey to redirect to if none specified */
  defaultJourney?: 'health' | 'care' | 'plan';
}

/**
 * Security middleware configuration
 */
export interface SecurityMiddlewareConfig {
  /** Content Security Policy settings */
  contentSecurityPolicy?: string | boolean;
  /** Whether to enable Strict Transport Security */
  strictTransportSecurity?: boolean | {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  /** X-Frame-Options header value */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | false;
  /** Whether to enable XSS protection */
  xssProtection?: boolean;
  /** Whether to enable noSniff */
  noSniff?: boolean;
  /** Referrer policy */
  referrerPolicy?: string | false;
  /** Permissions policy */
  permissionsPolicy?: Record<string, string[]> | false;
}

/**
 * Performance middleware configuration
 */
export interface PerformanceMiddlewareConfig {
  /** Whether to enable caching for static assets */
  enableStaticCaching?: boolean;
  /** Cache control directives for different route patterns */
  cacheControl?: Record<string, string>;
  /** Whether to enable compression */
  enableCompression?: boolean;
  /** Routes to preload */
  preloadRoutes?: string[];
  /** Whether to enable early hints */
  enableEarlyHints?: boolean;
}

/**
 * Complete middleware configuration
 */
export interface MiddlewareConfig {
  /** Authentication configuration */
  auth?: AuthMiddlewareConfig;
  /** Journey-specific configuration */
  journeys?: JourneyMiddlewareConfig;
  /** Security configuration */
  security?: SecurityMiddlewareConfig;
  /** Performance configuration */
  performance?: PerformanceMiddlewareConfig;
  /** Route matcher patterns */
  matcher?: string | string[];
  /** Routes to skip middleware execution */
  skipMiddleware?: string[];
}

/**
 * Creates an authentication middleware handler
 */
export type CreateAuthMiddleware = (
  config: AuthMiddlewareConfig
) => MiddlewareHandler;

/**
 * Creates a journey-specific middleware handler
 */
export type CreateJourneyMiddleware = (
  config: JourneyMiddlewareConfig
) => MiddlewareHandler;

/**
 * Creates a security middleware handler
 */
export type CreateSecurityMiddleware = (
  config: SecurityMiddlewareConfig
) => MiddlewareHandler;

/**
 * Creates a performance middleware handler
 */
export type CreatePerformanceMiddleware = (
  config: PerformanceMiddlewareConfig
) => MiddlewareHandler;

/**
 * Creates a complete middleware handler with all configurations
 */
export type CreateMiddleware = (
  config: MiddlewareConfig
) => MiddlewareHandler;