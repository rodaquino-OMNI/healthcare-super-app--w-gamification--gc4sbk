import { HttpStatus } from '@nestjs/common';
import { ClientException } from './client.exception';
import { ErrorType } from './error-types.enum';

/**
 * Error types specific to authentication and authorization failures
 */
export enum AuthErrorType {
  // Authentication errors (401 Unauthorized)
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',
  REVOKED_TOKEN = 'REVOKED_TOKEN',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  
  // Authorization errors (403 Forbidden)
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_ROLE = 'INVALID_ROLE',
  JOURNEY_ACCESS_DENIED = 'JOURNEY_ACCESS_DENIED',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  ACTION_FORBIDDEN = 'ACTION_FORBIDDEN',
}

/**
 * Metadata specific to authentication and authorization errors
 */
export interface AuthErrorMetadata {
  userId?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  userRoles?: string[];
  userPermissions?: string[];
  resourceId?: string;
  resourceType?: string;
  journeyType?: 'health' | 'care' | 'plan';
  tokenType?: 'access' | 'refresh';
  ipAddress?: string;
  requestPath?: string;
  requestMethod?: string;
  timestamp?: Date;
}

/**
 * Specialized client exception for authentication and authorization failures.
 * Handles invalid credentials, expired tokens, insufficient permissions, and other
 * security-related errors with appropriate HTTP status codes and security-conscious
 * error messages.
 */
export class UnauthorizedException extends ClientException {
  /**
   * Creates a new UnauthorizedException for authentication failures (401 Unauthorized)
   * 
   * @param message - User-friendly error message (will be sanitized)
   * @param authErrorType - Specific authentication error type
   * @param metadata - Additional context about the authentication failure
   * @returns UnauthorizedException instance with 401 status code
   */
  static authentication(
    message: string,
    authErrorType: AuthErrorType.INVALID_CREDENTIALS | 
                  AuthErrorType.EXPIRED_TOKEN | 
                  AuthErrorType.INVALID_TOKEN | 
                  AuthErrorType.MISSING_TOKEN | 
                  AuthErrorType.REVOKED_TOKEN | 
                  AuthErrorType.INVALID_REFRESH_TOKEN,
    metadata?: AuthErrorMetadata
  ): UnauthorizedException {
    return new UnauthorizedException(
      UnauthorizedException.sanitizeMessage(message, authErrorType),
      ErrorType.AUTHENTICATION_ERROR,
      authErrorType,
      HttpStatus.UNAUTHORIZED,
      UnauthorizedException.sanitizeMetadata(metadata)
    );
  }

  /**
   * Creates a new UnauthorizedException for authorization failures (403 Forbidden)
   * 
   * @param message - User-friendly error message (will be sanitized)
   * @param authErrorType - Specific authorization error type
   * @param metadata - Additional context about the authorization failure
   * @returns UnauthorizedException instance with 403 status code
   */
  static authorization(
    message: string,
    authErrorType: AuthErrorType.INSUFFICIENT_PERMISSIONS | 
                  AuthErrorType.INVALID_ROLE | 
                  AuthErrorType.JOURNEY_ACCESS_DENIED | 
                  AuthErrorType.RESOURCE_ACCESS_DENIED | 
                  AuthErrorType.ACTION_FORBIDDEN,
    metadata?: AuthErrorMetadata
  ): UnauthorizedException {
    return new UnauthorizedException(
      UnauthorizedException.sanitizeMessage(message, authErrorType),
      ErrorType.AUTHORIZATION_ERROR,
      authErrorType,
      HttpStatus.FORBIDDEN,
      UnauthorizedException.sanitizeMetadata(metadata)
    );
  }

  /**
   * Creates a new UnauthorizedException for token validation failures
   * 
   * @param message - User-friendly error message (will be sanitized)
   * @param tokenType - Type of token that failed validation ('access' or 'refresh')
   * @param metadata - Additional context about the token validation failure
   * @returns UnauthorizedException instance with appropriate status code
   */
  static invalidToken(
    message: string,
    tokenType: 'access' | 'refresh',
    metadata?: AuthErrorMetadata
  ): UnauthorizedException {
    const authErrorType = tokenType === 'refresh' 
      ? AuthErrorType.INVALID_REFRESH_TOKEN 
      : AuthErrorType.INVALID_TOKEN;
    
    return UnauthorizedException.authentication(
      message,
      authErrorType,
      { ...metadata, tokenType }
    );
  }

  /**
   * Creates a new UnauthorizedException for expired token failures
   * 
   * @param message - User-friendly error message (will be sanitized)
   * @param tokenType - Type of token that expired ('access' or 'refresh')
   * @param metadata - Additional context about the token expiration
   * @returns UnauthorizedException instance with 401 status code
   */
  static expiredToken(
    message: string,
    tokenType: 'access' | 'refresh',
    metadata?: AuthErrorMetadata
  ): UnauthorizedException {
    return UnauthorizedException.authentication(
      message,
      AuthErrorType.EXPIRED_TOKEN,
      { ...metadata, tokenType }
    );
  }

  /**
   * Creates a new UnauthorizedException for insufficient permissions
   * 
   * @param message - User-friendly error message (will be sanitized)
   * @param requiredPermissions - Permissions required for the operation
   * @param userPermissions - Permissions the user actually has
   * @param metadata - Additional context about the permission failure
   * @returns UnauthorizedException instance with 403 status code
   */
  static insufficientPermissions(
    message: string,
    requiredPermissions: string[],
    userPermissions: string[] = [],
    metadata?: AuthErrorMetadata
  ): UnauthorizedException {
    return UnauthorizedException.authorization(
      message,
      AuthErrorType.INSUFFICIENT_PERMISSIONS,
      { 
        ...metadata, 
        requiredPermissions, 
        userPermissions 
      }
    );
  }

  /**
   * Creates a new UnauthorizedException for invalid role
   * 
   * @param message - User-friendly error message (will be sanitized)
   * @param requiredRoles - Roles required for the operation
   * @param userRoles - Roles the user actually has
   * @param metadata - Additional context about the role failure
   * @returns UnauthorizedException instance with 403 status code
   */
  static invalidRole(
    message: string,
    requiredRoles: string[],
    userRoles: string[] = [],
    metadata?: AuthErrorMetadata
  ): UnauthorizedException {
    return UnauthorizedException.authorization(
      message,
      AuthErrorType.INVALID_ROLE,
      { 
        ...metadata, 
        requiredRoles, 
        userRoles 
      }
    );
  }

  /**
   * Creates a new UnauthorizedException for journey access denied
   * 
   * @param message - User-friendly error message (will be sanitized)
   * @param journeyType - Type of journey the user attempted to access
   * @param metadata - Additional context about the journey access failure
   * @returns UnauthorizedException instance with 403 status code
   */
  static journeyAccessDenied(
    message: string,
    journeyType: 'health' | 'care' | 'plan',
    metadata?: AuthErrorMetadata
  ): UnauthorizedException {
    return UnauthorizedException.authorization(
      message,
      AuthErrorType.JOURNEY_ACCESS_DENIED,
      { ...metadata, journeyType }
    );
  }

  /**
   * Creates a new UnauthorizedException for resource access denied
   * 
   * @param message - User-friendly error message (will be sanitized)
   * @param resourceType - Type of resource the user attempted to access
   * @param resourceId - ID of the resource the user attempted to access
   * @param metadata - Additional context about the resource access failure
   * @returns UnauthorizedException instance with 403 status code
   */
  static resourceAccessDenied(
    message: string,
    resourceType: string,
    resourceId: string,
    metadata?: AuthErrorMetadata
  ): UnauthorizedException {
    return UnauthorizedException.authorization(
      message,
      AuthErrorType.RESOURCE_ACCESS_DENIED,
      { ...metadata, resourceType, resourceId }
    );
  }

  /**
   * Sanitizes error messages to prevent information disclosure
   * 
   * @param message - Original error message
   * @param authErrorType - Type of authentication/authorization error
   * @returns Sanitized error message safe for client response
   */
  private static sanitizeMessage(message: string, authErrorType: AuthErrorType): string {
    // Generic messages for security-sensitive errors to prevent information disclosure
    const genericMessages = {
      [AuthErrorType.INVALID_CREDENTIALS]: 'Authentication failed. Please check your credentials and try again.',
      [AuthErrorType.EXPIRED_TOKEN]: 'Your session has expired. Please log in again.',
      [AuthErrorType.INVALID_TOKEN]: 'Invalid authentication token. Please log in again.',
      [AuthErrorType.MISSING_TOKEN]: 'Authentication required. Please log in to continue.',
      [AuthErrorType.REVOKED_TOKEN]: 'Your session is no longer valid. Please log in again.',
      [AuthErrorType.INVALID_REFRESH_TOKEN]: 'Unable to refresh your session. Please log in again.',
      [AuthErrorType.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
      [AuthErrorType.INVALID_ROLE]: 'This action requires a different user role.',
      [AuthErrorType.JOURNEY_ACCESS_DENIED]: 'You do not have access to this journey.',
      [AuthErrorType.RESOURCE_ACCESS_DENIED]: 'You do not have access to this resource.',
      [AuthErrorType.ACTION_FORBIDDEN]: 'This action is not allowed for your user account.',
    };

    // Use generic message if available, otherwise use the provided message
    // but sanitize it to remove any potentially sensitive information
    return genericMessages[authErrorType] || 
      message.replace(/token|password|credential|secret|key/gi, '[REDACTED]');
  }

  /**
   * Sanitizes error metadata to prevent sensitive information disclosure
   * 
   * @param metadata - Original error metadata
   * @returns Sanitized metadata safe for logging and internal use
   */
  private static sanitizeMetadata(metadata?: AuthErrorMetadata): AuthErrorMetadata {
    if (!metadata) return {};

    // Create a copy to avoid modifying the original
    const sanitized = { ...metadata };

    // Add timestamp if not present
    if (!sanitized.timestamp) {
      sanitized.timestamp = new Date();
    }

    // Log the security event with audit logging
    // This would typically call a logging service, but we'll just return the sanitized metadata for now
    UnauthorizedException.logSecurityEvent(sanitized);

    return sanitized;
  }

  /**
   * Logs security events for audit purposes
   * 
   * @param metadata - Security event metadata
   */
  private static logSecurityEvent(metadata: AuthErrorMetadata): void {
    // In a real implementation, this would call the audit logging service
    // For now, we'll just log to console in development environments
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SECURITY_AUDIT]', JSON.stringify(metadata, null, 2));
    }

    // In production, this would integrate with a proper audit logging system
    // auditLogger.logSecurityEvent({
    //   eventType: 'SECURITY_VIOLATION',
    //   severity: 'WARNING',
    //   metadata
    // });
  }
}