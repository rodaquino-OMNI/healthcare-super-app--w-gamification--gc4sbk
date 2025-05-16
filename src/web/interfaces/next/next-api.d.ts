/**
 * @file next-api.d.ts
 * @description TypeScript declaration file that extends Next.js API types with AUSTA SuperApp-specific interfaces.
 * Provides type definitions for API route handlers, ensuring type safety between client-side requests and
 * server-side handlers across all three user journeys.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { HealthMetricType } from '../health/types';
import { AppointmentType, AppointmentStatus } from '../care/types';
import { ClaimStatus, ClaimType } from '../plan/claims.types';

/**
 * API version definition for the AUSTA SuperApp
 * Used to ensure proper versioning for all API endpoints
 */
declare global {
  namespace AustaAPI {
    /**
     * API version format: MAJOR.MINOR
     * - MAJOR: Breaking changes
     * - MINOR: Non-breaking additions
     */
    type Version = 'v1.0' | 'v1.1' | 'v2.0';

    /**
     * Common API response structure for all endpoints
     */
    interface ApiResponse<T = any> {
      data: T;
      meta: {
        version: Version;
        timestamp: string;
        requestId: string;
      };
      success: boolean;
      error?: {
        code: string;
        message: string;
        details?: any;
      };
    }

    /**
     * Common pagination parameters for list endpoints
     */
    interface PaginationParams {
      page?: number;
      limit?: number;
      cursor?: string;
    }

    /**
     * Common sorting parameters for list endpoints
     */
    interface SortParams {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }

    /**
     * Common filtering parameters for list endpoints
     */
    interface FilterParams {
      [key: string]: string | number | boolean | string[] | number[] | null;
    }

    /**
     * Journey context for request handling
     */
    type JourneyContext = 'health' | 'care' | 'plan' | 'auth' | 'gamification';

    /**
     * Base interface for all journey-specific requests
     */
    interface JourneyRequest extends NextApiRequest {
      journeyContext: JourneyContext;
      apiVersion: Version;
    }

    /**
     * Base interface for all journey-specific responses
     */
    interface JourneyResponse<T = any> extends NextApiResponse<ApiResponse<T>> {
      // Extended methods will be implemented in the actual response object
    }

    /**
     * Health Journey API interfaces
     */
    namespace Health {
      interface MetricsRequest extends JourneyRequest {
        body: {
          metricType: HealthMetricType;
          value: number;
          unit: string;
          timestamp?: string;
          deviceId?: string;
        };
      }

      interface MetricsListRequest extends JourneyRequest, PaginationParams, SortParams {
        query: {
          metricType?: HealthMetricType;
          startDate?: string;
          endDate?: string;
        } & FilterParams & PaginationParams & SortParams;
      }

      interface GoalRequest extends JourneyRequest {
        body: {
          metricType: HealthMetricType;
          target: number;
          unit: string;
          startDate: string;
          endDate: string;
          reminderFrequency?: 'daily' | 'weekly' | 'monthly';
        };
      }

      interface DeviceRequest extends JourneyRequest {
        body: {
          deviceType: string;
          deviceId: string;
          manufacturer: string;
          model: string;
          connectionToken?: string;
        };
      }
    }

    /**
     * Care Journey API interfaces
     */
    namespace Care {
      interface AppointmentRequest extends JourneyRequest {
        body: {
          providerId: string;
          appointmentType: AppointmentType;
          date: string;
          time: string;
          duration: number;
          reason: string;
          notes?: string;
        };
      }

      interface AppointmentListRequest extends JourneyRequest, PaginationParams, SortParams {
        query: {
          status?: AppointmentStatus;
          appointmentType?: AppointmentType;
          startDate?: string;
          endDate?: string;
          providerId?: string;
        } & FilterParams & PaginationParams & SortParams;
      }

      interface MedicationRequest extends JourneyRequest {
        body: {
          name: string;
          dosage: string;
          frequency: string;
          startDate: string;
          endDate?: string;
          instructions?: string;
          reminderEnabled?: boolean;
          reminderTimes?: string[];
        };
      }

      interface TelemedicineRequest extends JourneyRequest {
        body: {
          appointmentId: string;
          preferredPlatform?: 'native' | 'zoom' | 'teams';
          deviceType?: 'mobile' | 'desktop' | 'tablet';
        };
      }
    }

    /**
     * Plan Journey API interfaces
     */
    namespace Plan {
      interface ClaimRequest extends JourneyRequest {
        body: {
          claimType: ClaimType;
          serviceDate: string;
          providerId: string;
          amount: number;
          description: string;
          receiptIds?: string[];
          additionalInfo?: Record<string, any>;
        };
      }

      interface ClaimListRequest extends JourneyRequest, PaginationParams, SortParams {
        query: {
          status?: ClaimStatus;
          claimType?: ClaimType;
          startDate?: string;
          endDate?: string;
        } & FilterParams & PaginationParams & SortParams;
      }

      interface DocumentUploadRequest extends JourneyRequest {
        // This will be handled by a multipart form parser
        // The actual file will be in the req.files object provided by the parser
        body: {
          documentType: 'receipt' | 'prescription' | 'referral' | 'labResult' | 'other';
          relatedEntityId?: string;
          relatedEntityType?: 'claim' | 'appointment' | 'medication';
          description?: string;
        };
      }

      interface BenefitRequest extends JourneyRequest {
        query: {
          planId: string;
          includeUsage?: boolean;
          includeDetails?: boolean;
        };
      }
    }

    /**
     * Authentication API interfaces
     */
    namespace Auth {
      interface LoginRequest extends JourneyRequest {
        body: {
          email: string;
          password: string;
          rememberMe?: boolean;
          deviceInfo?: {
            deviceId?: string;
            platform?: 'ios' | 'android' | 'web';
            appVersion?: string;
          };
        };
      }

      interface RegisterRequest extends JourneyRequest {
        body: {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
          dateOfBirth: string;
          phoneNumber?: string;
          acceptedTerms: boolean;
          marketingConsent?: boolean;
        };
      }

      interface RefreshTokenRequest extends JourneyRequest {
        body: {
          refreshToken: string;
        };
      }

      interface PasswordResetRequest extends JourneyRequest {
        body: {
          email: string;
        };
      }

      interface PasswordUpdateRequest extends JourneyRequest {
        body: {
          token: string;
          newPassword: string;
          confirmPassword: string;
        };
      }
    }

    /**
     * Gamification API interfaces
     */
    namespace Gamification {
      interface EventRequest extends JourneyRequest {
        body: {
          eventType: string;
          eventData: Record<string, any>;
          sourceJourney: JourneyContext;
          timestamp?: string;
        };
      }

      interface AchievementListRequest extends JourneyRequest, PaginationParams {
        query: {
          status?: 'locked' | 'unlocked' | 'completed';
          category?: string;
          includeProgress?: boolean;
        } & PaginationParams;
      }

      interface QuestListRequest extends JourneyRequest, PaginationParams {
        query: {
          status?: 'active' | 'completed' | 'expired';
          difficulty?: 'easy' | 'medium' | 'hard';
          includeProgress?: boolean;
        } & PaginationParams;
      }

      interface RewardClaimRequest extends JourneyRequest {
        body: {
          rewardId: string;
        };
      }
    }
  }
}

/**
 * Extended Next.js API handler types with AUSTA SuperApp-specific typing
 */
declare module 'next' {
  /**
   * Journey-specific API handler type
   * Provides type safety for journey-specific request and response objects
   */
  export type JourneyApiHandler<T = any, J extends AustaAPI.JourneyContext = AustaAPI.JourneyContext> = (
    req: AustaAPI.JourneyRequest,
    res: AustaAPI.JourneyResponse<T>
  ) => void | Promise<void>;

  /**
   * Health journey API handler
   */
  export type HealthApiHandler<T = any> = JourneyApiHandler<T, 'health'>;

  /**
   * Care journey API handler
   */
  export type CareApiHandler<T = any> = JourneyApiHandler<T, 'care'>;

  /**
   * Plan journey API handler
   */
  export type PlanApiHandler<T = any> = JourneyApiHandler<T, 'plan'>;

  /**
   * Auth API handler
   */
  export type AuthApiHandler<T = any> = JourneyApiHandler<T, 'auth'>;

  /**
   * Gamification API handler
   */
  export type GamificationApiHandler<T = any> = JourneyApiHandler<T, 'gamification'>;

  /**
   * Versioned API handler that enforces API version in the request and response
   */
  export type VersionedApiHandler<
    T = any,
    V extends AustaAPI.Version = AustaAPI.Version
  > = (
    req: NextApiRequest & { apiVersion: V },
    res: NextApiResponse<AustaAPI.ApiResponse<T>>
  ) => void | Promise<void>;

  /**
   * API handler with middleware support
   * Allows for composing multiple middleware functions with the handler
   */
  export type MiddlewareApiHandler<T = any> = (
    req: NextApiRequest,
    res: NextApiResponse<AustaAPI.ApiResponse<T>>,
    next: () => void | Promise<void>
  ) => void | Promise<void>;

  /**
   * API handler factory function type
   * Used to create API handlers with consistent error handling and response formatting
   */
  export type ApiHandlerFactory = <T>(
    handler: JourneyApiHandler<T>
  ) => (
    req: NextApiRequest,
    res: NextApiResponse
  ) => Promise<void>;
}

/**
 * Utility types for API handlers
 */
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Configuration for API endpoints
 */
export interface ApiEndpointConfig {
  methods: ApiMethod[];
  handler: {
    [key in ApiMethod]?: Function;
  };
  middlewares?: Function[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  cacheControl?: string;
  apiVersions?: AustaAPI.Version[];
}

/**
 * Type for API route configuration
 */
export interface ApiRouteConfig {
  [path: string]: ApiEndpointConfig;
}

/**
 * GraphQL schema evolution types
 */
export interface GraphQLSchemaVersion {
  version: AustaAPI.Version;
  schema: string;
  deprecated?: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
}

/**
 * GraphQL operation context with journey information
 */
export interface GraphQLJourneyContext {
  journey: AustaAPI.JourneyContext;
  apiVersion: AustaAPI.Version;
  user?: {
    id: string;
    roles: string[];
    permissions: string[];
  };
  requestId: string;
}