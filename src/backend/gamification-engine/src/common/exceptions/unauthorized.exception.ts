import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { ClientException } from './client.exception';

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  RATE_LIMITED = 'RATE_LIMITED',
}

/**
 * Specialized client exception for authentication and authorization failures.
 * Handles invalid credentials, expired tokens, insufficient permissions, and other
 * security-related errors with appropriate HTTP status codes and security-conscious error messages.
 */
export class UnauthorizedException extends ClientException {
  public readonly authErrorType: AuthErrorType;
  public readonly isAuthenticationError: boolean;
  
  /**
   * Creates a new UnauthorizedException instance
   * 
   * @param message Human-readable error message
   * @param authErrorType Specific authentication error type
   * @param isAuthenticationError Whether this is an authentication error (vs. authorization)
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    authErrorType: AuthErrorType,
    isAuthenticationError: boolean = true,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    super(
      message,
      isAuthenticationError ? ErrorType.AUTHENTICATION_ERROR : ErrorType.AUTHORIZATION_ERROR,
      isAuthenticationError ? HttpStatus.UNAUTHORIZED : HttpStatus.FORBIDDEN,
      undefined,
      metadata,
      context,
    );
    
    this.authErrorType = authErrorType;
    this.isAuthenticationError = isAuthenticationError;
    
    // Add authentication information to metadata
    this.addMetadata('authErrorType', authErrorType);
    this.addMetadata('isAuthenticationError', isAuthenticationError);
  }
  
  /**
   * Creates an exception for invalid credentials
   * 
   * @param message Custom message (optional)
   * @returns UnauthorizedException instance
   */
  static invalidCredentials(message: string = 'Invalid username or password'): UnauthorizedException {
    return new UnauthorizedException(
      message,
      AuthErrorType.INVALID_CREDENTIALS,
      true,
    );
  }
  
  /**
   * Creates an exception for an expired token
   * 
   * @param message Custom message (optional)
   * @returns UnauthorizedException instance
   */
  static expiredToken(message: string = 'Authentication token has expired'): UnauthorizedException {
    return new UnauthorizedException(
      message,
      AuthErrorType.EXPIRED_TOKEN,
      true,
    );
  }
  
  /**
   * Creates an exception for an invalid token
   * 
   * @param message Custom message (optional)
   * @returns UnauthorizedException instance
   */
  static invalidToken(message: string = 'Invalid authentication token'): UnauthorizedException {
    return new UnauthorizedException(
      message,
      AuthErrorType.INVALID_TOKEN,
      true,
    );
  }
  
  /**
   * Creates an exception for missing token
   * 
   * @param message Custom message (optional)
   * @returns UnauthorizedException instance
   */
  static missingToken(message: string = 'Authentication token is required'): UnauthorizedException {
    return new UnauthorizedException(
      message,
      AuthErrorType.MISSING_TOKEN,
      true,
    );
  }
  
  /**
   * Creates an exception for insufficient permissions
   * 
   * @param message Custom message (optional)
   * @param requiredPermissions Required permissions (optional)
   * @returns UnauthorizedException instance
   */
  static insufficientPermissions(
    message: string = 'Insufficient permissions to access this resource',
    requiredPermissions?: string[],
  ): UnauthorizedException {
    const exception = new UnauthorizedException(
      message,
      AuthErrorType.INSUFFICIENT_PERMISSIONS,
      false, // This is an authorization error, not authentication
    );
    
    if (requiredPermissions) {
      exception.addMetadata('requiredPermissions', requiredPermissions);
    }
    
    return exception;
  }
  
  /**
   * Gets safe metadata for client responses
   * For security reasons, we limit what information is returned
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    // For authentication errors, we don't want to expose too much information
    if (this.isAuthenticationError) {
      return null;
    }
    
    // For authorization errors, we can provide more context
    const safeMetadata: Record<string, any> = {
      errorType: this.authErrorType,
    };
    
    // Include required permissions if available
    if (this.metadata.requiredPermissions) {
      safeMetadata.requiredPermissions = this.metadata.requiredPermissions;
    }
    
    return safeMetadata;
  }
  
  /**
   * Gets HTTP headers for the response
   * For authentication errors, we add WWW-Authenticate header
   * 
   * @returns HTTP headers for the response
   */
  getResponseHeaders(): Record<string, string> {
    if (this.isAuthenticationError) {
      return {
        'WWW-Authenticate': 'Bearer',
      };
    }
    
    return {};
  }
}