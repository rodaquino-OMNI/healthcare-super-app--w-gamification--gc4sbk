import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IJwtProvider } from './jwt.interface';

/**
 * Base JWT provider implementation that handles token generation, validation, and verification.
 * Uses @nestjs/jwt for token signing and verification.
 */
@Injectable()
export class JwtProvider implements IJwtProvider {
  private readonly logger = new Logger(JwtProvider.name);

  /**
   * Creates an instance of JwtProvider.
   * @param jwtService NestJS JWT service for token operations
   */
  constructor(protected readonly jwtService: JwtService) {}

  /**
   * Generates a JWT token with the provided payload.
   * @param payload Data to include in the token
   * @returns Generated JWT token
   */
  async generateToken<T = any>(payload: T): Promise<string> {
    try {
      return this.jwtService.sign(payload as object);
    } catch (error) {
      this.logger.error(
        `Error generating token: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Validates a JWT token.
   * @param token JWT token to validate
   * @returns Decoded token payload if valid, null otherwise
   */
  async validateToken<T = any>(token: string): Promise<T | null> {
    try {
      const payload = await this.jwtService.verifyAsync<T>(token);
      return payload;
    } catch (error) {
      this.logger.debug(
        `Token validation failed: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Decodes a JWT token without validation.
   * @param token JWT token to decode
   * @returns Decoded token payload
   */
  decodeToken<T = any>(token: string): T | null {
    try {
      const decoded = this.jwtService.decode(token);
      return decoded as T;
    } catch (error) {
      this.logger.error(
        `Error decoding token: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}