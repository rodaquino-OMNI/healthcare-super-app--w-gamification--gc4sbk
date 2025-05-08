import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { ClientException } from './client.exception';

/**
 * Enum defining specific unauthorized error subtypes for more granular error handling
 */
export enum UnauthorizedErrorType {
  // Authentication errors (401)
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',
  REVOKED_TOKEN = 'REVOKED_TOKEN',
  INACTIVE_USER = 'INACTIVE_USER',
  LOCKED_ACCOUNT = 'LOCKED_ACCOUNT',
  MFA_REQUIRED = 'MFA_REQUIRED',
  
  // Authorization errors (403)
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  JOURNEY_ACCESS_DENIED = 'JOURNEY_ACCESS_DENIED',
  ROLE_REQUIRED = 'ROLE_REQUIRED',
  FEATURE_RESTRICTED = 'FEATURE_RESTRICTED',
  ACCOUNT_RESTRICTED = 'ACCOUNT_RESTRICTED',
}

/**
 * Interface for security-related metadata in unauthorized exceptions
 */
export interface SecurityMetadata extends ErrorMetadata {
  errorSubtype?: UnauthorizedErrorType;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  resourceId?: string;
  resourceType?: string;
  journeyType?: 'HEALTH' | 'CARE' | 'PLAN';
  attemptCount?: number;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Specialized client exception for authentication and authorization failures.
 * Handles invalid credentials, expired tokens, insufficient permissions, and other
 * security-related errors with appropriate HTTP status codes and security-conscious
 * error messages.
 */
export class UnauthorizedException extends ClientException {
  /**
   * Creates a new authentication error (401 Unauthorized)
   * 
   * @param message Human-readable error message
   * @param errorSubtype Specific authentication error type
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static authentication(
    message: string,
    errorSubtype: UnauthorizedErrorType = UnauthorizedErrorType.INVALID_CREDENTIALS,
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return new UnauthorizedException(
      message,
      ErrorType.AUTHENTICATION_ERROR,
      HttpStatus.UNAUTHORIZED,
      { ...metadata, errorSubtype, isAuthenticationError: true },
      context,
      cause,
    );
  }
  
  /**
   * Creates a new authorization error (403 Forbidden)
   * 
   * @param message Human-readable error message
   * @param errorSubtype Specific authorization error type
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static authorization(
    message: string,
    errorSubtype: UnauthorizedErrorType = UnauthorizedErrorType.INSUFFICIENT_PERMISSIONS,
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return new UnauthorizedException(
      message,
      ErrorType.AUTHORIZATION_ERROR,
      HttpStatus.FORBIDDEN,
      { ...metadata, errorSubtype, isAuthorizationError: true },
      context,
      cause,
    );
  }
  
  /**
   * Creates a new token expired error (401 Unauthorized)
   * 
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static tokenExpired(
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return UnauthorizedException.authentication(
      'Authentication token has expired',
      UnauthorizedErrorType.EXPIRED_TOKEN,
      metadata,
      context,
      cause,
    );
  }
  
  /**
   * Creates a new invalid token error (401 Unauthorized)
   * 
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static invalidToken(
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return UnauthorizedException.authentication(
      'Invalid authentication token',
      UnauthorizedErrorType.INVALID_TOKEN,
      metadata,
      context,
      cause,
    );
  }
  
  /**
   * Creates a new missing token error (401 Unauthorized)
   * 
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static missingToken(
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return UnauthorizedException.authentication(
      'Authentication token is required',
      UnauthorizedErrorType.MISSING_TOKEN,
      metadata,
      context,
      cause,
    );
  }
  
  /**
   * Creates a new insufficient permissions error (403 Forbidden)
   * 
   * @param requiredPermissions Permissions required to access the resource
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static insufficientPermissions(
    requiredPermissions: string[] = [],
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return UnauthorizedException.authorization(
      'Insufficient permissions to access this resource',
      UnauthorizedErrorType.INSUFFICIENT_PERMISSIONS,
      { ...metadata, requiredPermissions },
      context,
      cause,
    );
  }
  
  /**
   * Creates a new role required error (403 Forbidden)
   * 
   * @param requiredRoles Roles required to access the resource
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static roleRequired(
    requiredRoles: string[] = [],
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return UnauthorizedException.authorization(
      'Required role not assigned to user',
      UnauthorizedErrorType.ROLE_REQUIRED,
      { ...metadata, requiredRoles },
      context,
      cause,
    );
  }
  
  /**
   * Creates a new journey access denied error (403 Forbidden)
   * 
   * @param journeyType Type of journey being accessed
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static journeyAccessDenied(
    journeyType: 'HEALTH' | 'CARE' | 'PLAN',
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return UnauthorizedException.authorization(
      `Access to ${journeyType} journey is not permitted`,
      UnauthorizedErrorType.JOURNEY_ACCESS_DENIED,
      { ...metadata, journeyType },
      context,
      cause,
    );
  }
  
  /**
   * Creates a new resource access denied error (403 Forbidden)
   * 
   * @param resourceType Type of resource being accessed
   * @param resourceId ID of the resource being accessed
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   * @returns UnauthorizedException instance
   */
  static resourceAccessDenied(
    resourceType: string,
    resourceId: string,
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ): UnauthorizedException {
    return UnauthorizedException.authorization(
      'Access to the requested resource is not permitted',
      UnauthorizedErrorType.RESOURCE_ACCESS_DENIED,
      { ...metadata, resourceType, resourceId },
      context,
      cause,
    );
  }
  
  /**
   * Creates a new UnauthorizedException instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification
   * @param statusCode HTTP status code
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param cause Original error that caused this exception
   */
  constructor(
    message: string,
    errorType: ErrorType = ErrorType.AUTHENTICATION_ERROR,
    statusCode: HttpStatus = HttpStatus.UNAUTHORIZED,
    metadata: SecurityMetadata = {},
    context: ErrorContext = {},
    cause?: Error,
  ) {
    super(message, errorType, statusCode, cause, metadata, context);
    
    // Add security event flag for audit logging
    this.addMetadata('isSecurityEvent', true);
    
    // Add timestamp for security event tracking
    this.addMetadata('securityEventTimestamp', new Date().toISOString());
  }
  
  /**
   * Gets client-safe metadata that can be included in responses
   * For security errors, we carefully filter what information is returned
   * to avoid leaking sensitive details
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    const safeMetadata: Record<string, any> = {};
    
    // Include error subtype if present
    if (this.metadata.errorSubtype) {
      safeMetadata.errorType = this.metadata.errorSubtype;
    }
    
    // For authorization errors, we can include the required permissions/roles
    // to help client applications understand what's missing
    if (this.getStatus() === HttpStatus.FORBIDDEN) {
      if (this.metadata.requiredPermissions) {
        safeMetadata.requiredPermissions = this.metadata.requiredPermissions;
      }
      
      if (this.metadata.requiredRoles) {
        safeMetadata.requiredRoles = this.metadata.requiredRoles;
      }
      
      if (this.metadata.journeyType) {
        safeMetadata.journeyType = this.metadata.journeyType;
      }
    }
    
    return Object.keys(safeMetadata).length > 0 ? safeMetadata : null;
  }
  
  /**
   * Gets the client message with security-focused sanitization
   * For security errors, we provide generic messages that don't leak sensitive information
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    // For authentication errors, use generic messages to avoid leaking information
    // about valid usernames, password policies, etc.
    if (this.getStatus() === HttpStatus.UNAUTHORIZED) {
      // Use specific messages for token issues
      if (this.metadata.errorSubtype === UnauthorizedErrorType.EXPIRED_TOKEN) {
        return 'Authentication session has expired. Please log in again.';
      }
      
      if (this.metadata.errorSubtype === UnauthorizedErrorType.INVALID_TOKEN) {
        return 'Invalid authentication credentials. Please log in again.';
      }
      
      if (this.metadata.errorSubtype === UnauthorizedErrorType.MISSING_TOKEN) {
        return 'Authentication required to access this resource.';
      }
      
      if (this.metadata.errorSubtype === UnauthorizedErrorType.REVOKED_TOKEN) {
        return 'Authentication session has been revoked. Please log in again.';
      }
      
      if (this.metadata.errorSubtype === UnauthorizedErrorType.MFA_REQUIRED) {
        return 'Multi-factor authentication required to complete this action.';
      }
      
      // Generic message for other authentication errors
      return 'Authentication failed. Please check your credentials and try again.';
    }
    
    // For authorization errors, we can be more specific about what's missing
    if (this.getStatus() === HttpStatus.FORBIDDEN) {
      if (this.metadata.errorSubtype === UnauthorizedErrorType.JOURNEY_ACCESS_DENIED && this.metadata.journeyType) {
        return `You do not have access to the ${this.metadata.journeyType} journey.`;
      }
      
      if (this.metadata.errorSubtype === UnauthorizedErrorType.ROLE_REQUIRED && this.metadata.requiredRoles) {
        const roles = Array.isArray(this.metadata.requiredRoles) 
          ? this.metadata.requiredRoles.join(', ') 
          : this.metadata.requiredRoles;
        return `This action requires one of the following roles: ${roles}.`;
      }
      
      if (this.metadata.errorSubtype === UnauthorizedErrorType.RESOURCE_ACCESS_DENIED) {
        return 'You do not have permission to access the requested resource.';
      }
      
      // Generic message for other authorization errors
      return 'You do not have sufficient permissions to perform this action.';
    }
    
    // Fallback to the original message
    return this.message;
  }
}