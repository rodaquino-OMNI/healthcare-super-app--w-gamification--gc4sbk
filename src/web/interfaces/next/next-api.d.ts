/**
 * @file next-api.d.ts
 * @description TypeScript declaration file that extends Next.js API types with AUSTA SuperApp-specific interfaces.
 * Provides type definitions for API route handlers, ensuring type safety between client-side requests and
 * server-side handlers across all three user journeys (Health, Care, Plan).
 * 
 * This file is part of the AUSTA SuperApp refactoring to standardize module resolution,
 * create consistent GraphQL schema evolution patterns, standardize REST endpoint configurations,
 * and implement proper versioning for APIs.
 * 
 * @example
 * ```typescript
 * // pages/api/health/metrics/[id].ts
 * import { ConfiguredApiHandler, JourneyApi } from '@austa/interfaces/next/next-api';
 * import { HealthMetricRequest, HealthMetricResponse } from '@austa/interfaces/api/health.api';
 * import { z } from 'zod';
 * 
 * const handler: ConfiguredApiHandler<HealthMetricRequest, HealthMetricResponse> = {
 *   config: {
 *     version: 'v1',
 *     requireAuth: true,
 *     methods: ['GET', 'PUT', 'DELETE'],
 *     journeyContext: 'health',
 *     validation: {
 *       query: z.object({
 *         id: z.string().uuid()
 *       })
 *     }
 *   },
 *   handler: async (req, res) => {
 *     const { id } = req.query;
 *     // Implementation
 *   }
 * };
 * 
 * export default handler;
 * ```
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage, ServerResponse } from 'http';

// Import API error and response types
import { ApiErrorResponse } from '../api/error.types';
import { ApiResponse } from '../api/response.types';
import { ApiRequest } from '../api/request.types';

// Import authentication types
import { AuthUser } from '../auth/user.types';

// Import journey-specific API types
import { HealthApiRequest, HealthApiResponse } from '../api/health.api';
import { CareApiRequest, CareApiResponse } from '../api/care.api';
import { PlanApiRequest, PlanApiResponse } from '../api/plan.api';
import { GamificationApiRequest, GamificationApiResponse } from '../api/gamification.api';

/**
 * API version definition for the AUSTA SuperApp
 * Supports versioning for API evolution while maintaining backward compatibility
 */
export type ApiVersion = 'v1' | 'v2';

/**
 * Journey type representing the three main user journeys plus auth and gamification
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'auth' | 'gamification';

/**
 * Extended Next.js API request with AUSTA SuperApp-specific properties
 * Provides type safety for request handling across all journeys
 */
export interface AustaNextApiRequest<T = any> extends NextApiRequest {
  /**
   * Parsed and validated request body with proper typing
   */
  body: T;
  
  /**
   * Authenticated user information (if available)
   * Populated by auth middleware when authentication is required
   */
  user?: AuthUser;
  
  /**
   * API version extracted from the request path
   * Used for versioned API handling and backward compatibility
   */
  apiVersion?: ApiVersion;
  
  /**
   * Journey context for the request
   * Determines which journey-specific validation and processing to apply
   */
  journeyContext?: JourneyType;
}

/**
 * Extended Next.js API response with AUSTA SuperApp-specific methods
 * Provides standardized response handling for all API routes
 */
export interface AustaNextApiResponse<T = any> extends NextApiResponse<ApiResponse<T> | ApiErrorResponse> {
  /**
   * Send a successful response with proper typing and structure
   * Automatically wraps data in the standard ApiResponse format
   * @param data The response data to send
   * @param statusCode HTTP status code (defaults to 200)
   */
  success: (data: T, statusCode?: number) => void;
  
  /**
   * Send an error response with proper typing and structure
   * Uses the standardized ApiErrorResponse format
   * @param error The error response to send
   * @param statusCode HTTP status code (defaults to error.statusCode or 500)
   */
  error: (error: ApiErrorResponse, statusCode?: number) => void;
  
  /**
   * Send a validation error response
   * @param errors Validation errors object
   * @param statusCode HTTP status code (defaults to 400)
   */
  validationError: (errors: Record<string, string[]>, statusCode?: number) => void;
}

/**
 * Base Next.js API handler with AUSTA SuperApp-specific typing
 * Provides type-safe request and response handling for all API routes
 * @template T Request body type
 * @template R Response data type
 * @example
 * ```typescript
 * const handler: AustaNextApiHandler<CreateUserRequest, UserResponse> = 
 *   async (req, res) => {
 *     try {
 *       const user = await createUser(req.body);
 *       res.success(user);
 *     } catch (error) {
 *       res.error({
 *         code: 'USER_CREATION_FAILED',
 *         message: 'Failed to create user',
 *         details: error.message
 *       });
 *     }
 *   };
 * ```
 */
export type AustaNextApiHandler<T = any, R = any> = (
  req: AustaNextApiRequest<T>,
  res: AustaNextApiResponse<R>
) => void | Promise<void>;

/**
 * Journey-specific API handlers
 * Provides type-safe API handlers for each journey
 */
export namespace JourneyApi {
  /**
   * Health journey API handler
   * Handles health metrics, goals, and device connections
   * @example
   * ```typescript
   * const handler: JourneyApi.HealthApiHandler<HealthMetricCreateRequest, HealthMetricResponse> = 
   *   async (req, res) => {
   *     // Implementation
   *   };
   * ```
   */
  export type HealthApiHandler<
    T extends HealthApiRequest = HealthApiRequest,
    R extends HealthApiResponse = HealthApiResponse
  > = AustaNextApiHandler<T, R>;
  
  /**
   * Care journey API handler
   * Handles appointments, medications, and treatments
   * @example
   * ```typescript
   * const handler: JourneyApi.CareApiHandler<AppointmentCreateRequest, AppointmentResponse> = 
   *   async (req, res) => {
   *     // Implementation
   *   };
   * ```
   */
  export type CareApiHandler<
    T extends CareApiRequest = CareApiRequest,
    R extends CareApiResponse = CareApiResponse
  > = AustaNextApiHandler<T, R>;
  
  /**
   * Plan journey API handler
   * Handles insurance plans, claims, and benefits
   * @example
   * ```typescript
   * const handler: JourneyApi.PlanApiHandler<ClaimCreateRequest, ClaimResponse> = 
   *   async (req, res) => {
   *     // Implementation
   *   };
   * ```
   */
  export type PlanApiHandler<
    T extends PlanApiRequest = PlanApiRequest,
    R extends PlanApiResponse = PlanApiResponse
  > = AustaNextApiHandler<T, R>;
  
  /**
   * Gamification API handler
   * Handles achievements, quests, and rewards
   * @example
   * ```typescript
   * const handler: JourneyApi.GamificationApiHandler<AchievementRequest, AchievementResponse> = 
   *   async (req, res) => {
   *     // Implementation
   *   };
   * ```
   */
  export type GamificationApiHandler<
    T extends GamificationApiRequest = GamificationApiRequest,
    R extends GamificationApiResponse = GamificationApiResponse
  > = AustaNextApiHandler<T, R>;
  
  /**
   * Auth API handler
   * Handles authentication and user management
   */
  export type AuthApiHandler<
    T = any,
    R = any
  > = AustaNextApiHandler<T, R>;
}

/**
 * API configuration for Next.js API routes
 * Provides standardized configuration for all API endpoints
 * Used to enforce consistent API behavior across the application
 */
export interface ApiConfig {
  /**
   * API version for this endpoint
   */
  version: ApiVersion;
  
  /**
   * Whether authentication is required for this endpoint
   */
  requireAuth: boolean;
  
  /**
   * Allowed HTTP methods for this endpoint
   */
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  
  /**
   * Rate limiting configuration
   */
  rateLimit?: {
    /**
     * Maximum number of requests allowed in the window
     */
    max: number;
    
    /**
     * Time window in seconds
     */
    windowSec: number;
  };
  
  /**
   * Journey context for this endpoint
   * Determines which journey-specific validation and processing to apply
   */
  journeyContext: JourneyType;
  
  /**
   * Validation schema for request body (optional)
   * Uses Zod schemas for runtime validation
   */
  validation?: {
    /**
     * Validation schema for request body
     * @example
     * ```typescript
     * import { z } from 'zod';
     * 
     * const validation = {
     *   body: z.object({
     *     name: z.string().min(3),
     *     email: z.string().email(),
     *   })
     * };
     * ```
     */
    body?: any; // Zod schema
    
    /**
     * Validation schema for query parameters
     * @example
     * ```typescript
     * import { z } from 'zod';
     * 
     * const validation = {
     *   query: z.object({
     *     page: z.string().transform(Number).optional(),
     *     limit: z.string().transform(Number).optional(),
     *   })
     * };
     * ```
     */
    query?: any; // Zod schema
    
    /**
     * Custom error messages for validation errors
     */
    errorMap?: Record<string, string>;
  };
}

/**
 * API handler factory with configuration
 * Used to create API handlers with standardized configuration
 * @example
 * ```typescript
 * export default {
 *   config: {
 *     version: 'v1',
 *     requireAuth: true,
 *     methods: ['GET', 'POST'],
 *     journeyContext: 'health',
 *     validation: {
 *       body: z.object({
 *         metricType: z.enum(['WEIGHT', 'BLOOD_PRESSURE', 'HEART_RATE']),
 *         value: z.number(),
 *         timestamp: z.string().datetime(),
 *       })
 *     }
 *   },
 *   handler: async (req, res) => {
 *     // Implementation
 *   }
 * } as ConfiguredApiHandler<HealthMetricCreateRequest, HealthMetricResponse>;
 * ```
 */
export type ConfiguredApiHandler<T = any, R = any> = {
  /**
   * API configuration
   */
  config: ApiConfig;
  
  /**
   * API handler function
   */
  handler: AustaNextApiHandler<T, R>;
};

/**
 * Extend the global Next.js namespace
 * Adds AUSTA SuperApp-specific properties to the global namespace
 */
declare global {
  namespace NodeJS {
    interface Global {
      /**
       * API configuration registry for the AUSTA SuperApp
       * Used to store and retrieve API configurations at runtime
       */
      _austaApiConfigs?: Map<string, ApiConfig>;
      
      /**
       * API middleware registry for the AUSTA SuperApp
       * Used to store and retrieve API middleware at runtime
       */
      _austaApiMiddleware?: Map<string, Array<AustaNextApiHandler>>;
    }
  }
}

/**
 * Augment the Next.js module
 */
declare module 'next' {
  /**
   * Extended Next.js API request with AUSTA SuperApp-specific properties
   */
  export interface NextApiRequest {
    /**
     * Authenticated user information (if available)
     */
    user?: AuthUser;
    
    /**
     * API version extracted from the request path
     */
    apiVersion?: ApiVersion;
    
    /**
     * Journey context for the request
     * Determines which journey-specific validation and processing to apply
     */
    journeyContext?: JourneyType;
  }
}

/**
 * Versioned API handler types
 * Provides type-safe API handlers for different API versions
 * Enables proper API evolution while maintaining backward compatibility
 */
export namespace VersionedApi {
  /**
   * V1 API handlers
   * Initial version of the API
   */
  export namespace V1 {
    export type HealthApiHandler<
      T extends HealthApiRequest = HealthApiRequest,
      R extends HealthApiResponse = HealthApiResponse
    > = AustaNextApiHandler<T, R>;
    
    export type CareApiHandler<
      T extends CareApiRequest = CareApiRequest,
      R extends CareApiResponse = CareApiResponse
    > = AustaNextApiHandler<T, R>;
    
    export type PlanApiHandler<
      T extends PlanApiRequest = PlanApiRequest,
      R extends PlanApiResponse = PlanApiResponse
    > = AustaNextApiHandler<T, R>;
    
    export type GamificationApiHandler<
      T extends GamificationApiRequest = GamificationApiRequest,
      R extends GamificationApiResponse = GamificationApiResponse
    > = AustaNextApiHandler<T, R>;
  }
  
  /**
   * V2 API handlers
   * Enhanced version of the API with additional features
   * Maintains backward compatibility with V1
   */
  export namespace V2 {
    export type HealthApiHandler<
      T extends HealthApiRequest = HealthApiRequest,
      R extends HealthApiResponse = HealthApiResponse
    > = AustaNextApiHandler<T, R>;
    
    export type CareApiHandler<
      T extends CareApiRequest = CareApiRequest,
      R extends CareApiResponse = CareApiResponse
    > = AustaNextApiHandler<T, R>;
    
    export type PlanApiHandler<
      T extends PlanApiRequest = PlanApiRequest,
      R extends PlanApiResponse = PlanApiResponse
    > = AustaNextApiHandler<T, R>;
    
    export type GamificationApiHandler<
      T extends GamificationApiRequest = GamificationApiRequest,
      R extends GamificationApiResponse = GamificationApiResponse
    > = AustaNextApiHandler<T, R>;
  }
  
  /**
   * Helper function to create a versioned API handler
   * @example
   * ```typescript
   * const handler = createVersionedHandler({
   *   v1: async (req, res) => {
   *     // V1 implementation
   *   },
   *   v2: async (req, res) => {
   *     // V2 implementation
   *   }
   * });
   * ```
   */
  export type VersionedHandlerConfig<T = any, R = any> = {
    v1: AustaNextApiHandler<T, R>;
    v2?: AustaNextApiHandler<T, R>;
    defaultVersion?: ApiVersion;
  };
  
  /**
   * API middleware configuration
   * Used to configure middleware for API routes
   */
  export interface ApiMiddlewareConfig {
    /**
     * Whether to apply this middleware to all routes
     */
    global?: boolean;
    
    /**
     * Journey contexts to apply this middleware to
     */
    journeyContexts?: JourneyType[];
    
    /**
     * API versions to apply this middleware to
     */
    apiVersions?: ApiVersion[];
    
    /**
     * HTTP methods to apply this middleware to
     */
    methods?: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
    
    /**
     * Route patterns to apply this middleware to
     */
    routes?: string[];
  }
}