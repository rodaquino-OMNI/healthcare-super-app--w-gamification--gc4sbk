import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigOptions } from './jwt.config';
import { IJwtProvider } from './jwt.interface';
import { IAuthProvider } from '../auth-provider.interface';
import { JwtPayload } from '@austa/interfaces/auth';

/**
 * Core implementation of the JWT provider interface.
 * Handles token generation, validation, and verification using @nestjs/jwt.
 */
@Injectable()
export class JwtProvider<TUser extends Record<string, any>> implements IJwtProvider<TUser>, IAuthProvider<TUser, any> {
  private readonly logger = new Logger(JwtProvider.name);

  /**
   * Creates a new instance of JwtProvider.
   * 
   * @param jwtService NestJS JWT service for token operations
   * @param configService NestJS config service for accessing JWT configuration
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates user credentials and returns the authenticated user.
   * This method should be implemented by the concrete authentication provider.
   * 
   * @param credentials User credentials
   * @returns Promise resolving to the authenticated user or null if authentication fails
   */
  async validateCredentials(credentials: any): Promise<TUser | null> {
    // This method should be implemented by the concrete authentication provider
    throw new Error('Method not implemented. Use a concrete authentication provider.');
  }

  /**
   * Validates a token and returns the associated user.
   * 
   * @param token JWT token to validate
   * @returns Promise resolving to the user or null if validation fails
   */
  async validateToken(token: string): Promise<TUser | null> {
    try {
      // Verify the token
      const payload = this.jwtService.verify(token);
      return await this.getUserById(payload.sub);
    } catch (error) {
      this.logger.debug(`Token validation failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Retrieves a user by their unique identifier.
   * This method should be implemented by the concrete authentication provider.
   * 
   * @param id User identifier
   * @returns Promise resolving to the user or null if not found
   */
  async getUserById(id: string): Promise<TUser | null> {
    // This method should be implemented by the concrete authentication provider
    throw new Error('Method not implemented. Use a concrete authentication provider.');
  }

  /**
   * Generates a JWT token for the authenticated user.
   * 
   * @param user Authenticated user
   * @param expiresIn Token expiration time in seconds (optional)
   * @returns Promise resolving to the generated token
   */
  async generateToken(user: TUser, expiresIn?: number): Promise<string> {
    const jwtConfig = this.configService.get<JwtConfigOptions>('jwt');
    
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username || user.email,
      roles: user.roles || [],
      jti: this.generateTokenId(),
    };

    const options = {
      expiresIn: expiresIn ? `${expiresIn}s` : jwtConfig.accessTokenExpiration,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    };

    return this.jwtService.sign(payload, options);
  }

  /**
   * Decodes a token and returns its payload without validation.
   * 
   * @param token JWT token to decode
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  async decodeToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      this.logger.debug(`Token decoding failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extracts the token from the request.
   * 
   * @param request HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null {
    if (!request || !request.headers) {
      return null;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Revokes a token, making it invalid for future authentication.
   * Base implementation does not support token revocation.
   * Override this method in derived classes to implement token revocation.
   * 
   * @param token JWT token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  async revokeToken(token: string): Promise<boolean> {
    this.logger.warn('Token revocation is not supported by the base JwtProvider');
    return false;
  }

  /**
   * Refreshes an existing token and returns a new one.
   * This method should be implemented by the concrete authentication provider.
   * 
   * @param refreshToken Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    // This method should be implemented by the concrete authentication provider
    throw new Error('Method not implemented. Use a concrete authentication provider.');
  }

  /**
   * Generates a unique token ID for the jti claim.
   * 
   * @returns Unique token ID
   */
  protected generateTokenId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}