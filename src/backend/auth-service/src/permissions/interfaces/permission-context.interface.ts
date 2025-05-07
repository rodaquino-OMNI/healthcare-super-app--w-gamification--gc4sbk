import { IUser } from '@app/auth/users/interfaces/user.interface';
import { IRole } from '@app/auth/roles/interfaces/role.interface';
import { IJourneyContext } from '@austa/interfaces/journey';
import { Request } from 'express';

/**
 * Represents the resource being accessed in a permission check.
 * Contains information about the resource type, identifier, and metadata.
 */
export interface IResourceContext {
  /**
   * The type of resource being accessed (e.g., 'appointment', 'healthMetric', 'claim')
   */
  type: string;

  /**
   * The unique identifier of the resource
   */
  id?: string;

  /**
   * The journey this resource belongs to (e.g., 'health', 'care', 'plan')
   */
  journey?: string;

  /**
   * The owner of the resource (typically a user ID)
   */
  ownerId?: string;

  /**
   * Additional metadata about the resource that might be relevant for permission decisions
   * Examples: status, visibility, creation date, etc.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Represents the action being performed in a permission check.
 * Contains information about the operation type and any action-specific data.
 */
export interface IActionContext {
  /**
   * The type of operation being performed (e.g., 'create', 'read', 'update', 'delete')
   */
  operation: string;

  /**
   * The specific action within the operation (e.g., 'approve', 'reject', 'share')
   */
  action?: string;

  /**
   * Additional data related to the action that might be relevant for permission decisions
   * Examples: requested changes, reason for action, etc.
   */
  data?: Record<string, unknown>;
}

/**
 * Represents the environmental factors in a permission check.
 * Contains information about the time, location, and system state.
 */
export interface IEnvironmentContext {
  /**
   * The current timestamp when the permission check is being performed
   */
  timestamp: Date;

  /**
   * The IP address of the client making the request
   */
  ipAddress?: string;

  /**
   * The geographic location of the client (if available)
   */
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  /**
   * Information about the client device and browser
   */
  userAgent?: string;

  /**
   * The current system state or mode (e.g., 'normal', 'maintenance', 'emergency')
   */
  systemState?: string;

  /**
   * Additional environmental factors that might be relevant for permission decisions
   */
  factors?: Record<string, unknown>;
}

/**
 * Represents the user context in a permission check.
 * Contains information about the user, their roles, and authentication status.
 */
export interface IUserContext {
  /**
   * The user object with all user information
   */
  user: IUser;

  /**
   * The roles assigned to the user
   */
  roles: IRole[];

  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;

  /**
   * Whether the user's email is verified
   */
  isEmailVerified: boolean;

  /**
   * Whether the user has completed multi-factor authentication for this session
   */
  hasMfaCompleted?: boolean;

  /**
   * The authentication method used (e.g., 'password', 'oauth', 'token')
   */
  authMethod?: string;

  /**
   * Additional user attributes that might be relevant for permission decisions
   */
  attributes?: Record<string, unknown>;
}

/**
 * Represents the request context in a permission check.
 * Contains information about the HTTP request and related data.
 */
export interface IRequestContext {
  /**
   * The original Express request object
   */
  request?: Request;

  /**
   * The HTTP method of the request
   */
  method: string;

  /**
   * The URL path of the request
   */
  path: string;

  /**
   * The query parameters of the request
   */
  query?: Record<string, string>;

  /**
   * The headers of the request
   */
  headers?: Record<string, string>;

  /**
   * The body of the request (if applicable)
   */
  body?: Record<string, unknown>;

  /**
   * The parameters extracted from the URL path
   */
  params?: Record<string, string>;
}

/**
 * Represents the comprehensive context object used for attribute-based access control evaluations.
 * This interface contains all the information needed to make complex permission decisions
 * beyond simple role-based checks, including user information, request data, resource information,
 * and environmental factors.
 * 
 * The IPermissionContext is critical for implementing fine-grained, context-aware authorization
 * across the healthcare journeys ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").
 */
export interface IPermissionContext {
  /**
   * Information about the user making the request
   */
  user: IUserContext;

  /**
   * Information about the resource being accessed
   */
  resource: IResourceContext;

  /**
   * Information about the action being performed
   */
  action: IActionContext;

  /**
   * Information about the HTTP request
   */
  request: IRequestContext;

  /**
   * Information about the environment (time, location, etc.)
   */
  environment: IEnvironmentContext;

  /**
   * Journey-specific contextual data for the current request
   * This allows for journey-specific permission rules
   */
  journeyContext?: IJourneyContext;

  /**
   * Additional context data that might be relevant for permission decisions
   * but doesn't fit into the other categories
   */
  additionalData?: Record<string, unknown>;
}