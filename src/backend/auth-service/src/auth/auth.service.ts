import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Use standardized TypeScript path aliases for consistent imports
import { UsersService } from '@app/auth/users/users.service';
import { CreateUserDto } from '@app/auth/users/dto/create-user.dto';
import { TokenStorageService } from '@app/auth/redis/token-storage.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

// Integration with @austa/interfaces for shared user and token schemas
import { JwtPayload, TokenPair, LoginResponseDto, RegisterResponseDto } from '@austa/interfaces/auth';
import { User } from '@app/auth/users/entities/user.entity';

/**
 * Service responsible for authentication operations including user registration,
 * login, token generation, validation, and refresh.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenStorage: TokenStorageService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Registers a new user and generates authentication tokens.
   * @param createUserDto - Data for creating a new user
   * @returns The newly created user and authentication tokens
   */
  async register(createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    try {
      this.logger.debug(`Registering new user with email: ${createUserDto.email}`);
      
      // Create the user using the UsersService
      const user = await this.usersService.create(createUserDto);
      
      // Generate authentication tokens for the new user
      const tokens = await this.generateTokenPair(user);
      
      this.logger.info(`User registered successfully: ${user.id}`);
      
      // Return the user and tokens
      return {
        user,
        ...tokens
      };
    } catch (error) {
      this.logger.error('User registration failed', error.stack);
      
      // Enhanced error handling with structured AppException patterns
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        ErrorType.VALIDATION,
        'Failed to register user',
        'AUTH_001',
        { email: createUserDto.email }
      );
    }
  }

  /**
   * Authenticates a user with email and password.
   * @param email - User's email address
   * @param password - User's password
   * @returns Authentication tokens and user data
   */
  async login(email: string, password: string): Promise<LoginResponseDto> {
    try {
      this.logger.debug(`Attempting login for user: ${email}`);
      
      // Validate user credentials
      const user = await this.usersService.validateCredentials(email, password);
      
      // Generate authentication tokens
      const tokens = await this.generateTokenPair(user);
      
      this.logger.info(`User logged in successfully: ${user.id}`);
      
      // Return the tokens and user data
      return {
        user,
        ...tokens
      };
    } catch (error) {
      this.logger.error(`Login failed for user: ${email}`, error.stack);
      
      // Enhanced error handling with structured AppException patterns
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        ErrorType.VALIDATION,
        'Invalid credentials',
        'AUTH_002',
        { email }
      );
    }
  }

  /**
   * Validates a JWT token and returns the associated user.
   * @param payload - JWT payload to validate
   * @returns The user associated with the token
   */
  async validateToken(payload: JwtPayload): Promise<User> {
    try {
      this.logger.debug(`Validating token for user: ${payload.sub}`);
      
      // Check if the token is blacklisted
      const isBlacklisted = await this.tokenStorage.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        this.logger.warn(`Token blacklisted: ${payload.jti}`);
        throw new AppException(
          ErrorType.UNAUTHORIZED,
          'Token has been revoked',
          'AUTH_003'
        );
      }
      
      // Get the user by ID
      const user = await this.usersService.findOne(payload.sub);
      
      this.logger.debug(`Token validated successfully for user: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Token validation failed: ${payload.jti}`, error.stack);
      
      // Enhanced error handling with structured AppException patterns
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Invalid token',
        'AUTH_004'
      );
    }
  }

  /**
   * Refreshes an access token using a refresh token.
   * @param refreshToken - The refresh token to use
   * @returns New access and refresh tokens
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      this.logger.debug('Processing token refresh request');
      
      // Verify the refresh token
      const payload = await this.verifyRefreshToken(refreshToken);
      
      // Get the user by ID
      const user = await this.usersService.findOne(payload.sub);
      
      // Invalidate the old refresh token (secure token rotation)
      await this.tokenStorage.invalidateRefreshToken(payload.jti);
      
      // Generate new tokens
      const tokens = await this.generateTokenPair(user);
      
      this.logger.info(`Tokens refreshed successfully for user: ${user.id}`);
      return tokens;
    } catch (error) {
      this.logger.error('Token refresh failed', error.stack);
      
      // Enhanced error handling with structured AppException patterns
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Invalid refresh token',
        'AUTH_005'
      );
    }
  }

  /**
   * Logs out a user by blacklisting their tokens.
   * @param accessToken - The access token to blacklist
   * @param refreshToken - The refresh token to invalidate
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      this.logger.debug('Processing logout request');
      
      // Decode the access token (without verification)
      const decodedToken = this.jwtService.decode(accessToken) as JwtPayload;
      if (!decodedToken || !decodedToken.jti || !decodedToken.exp) {
        throw new AppException(
          ErrorType.VALIDATION,
          'Invalid token format',
          'AUTH_006'
        );
      }
      
      // Calculate token TTL in seconds
      const now = Math.floor(Date.now() / 1000);
      const ttl = Math.max(0, decodedToken.exp - now);
      
      // Blacklist the access token
      await this.tokenStorage.blacklistToken(decodedToken.jti, ttl);
      
      // Invalidate the refresh token if provided
      if (refreshToken) {
        try {
          const refreshPayload = await this.verifyRefreshToken(refreshToken);
          await this.tokenStorage.invalidateRefreshToken(refreshPayload.jti);
        } catch (error) {
          // Continue even if refresh token is invalid
          this.logger.warn('Invalid refresh token during logout', error.stack);
        }
      }
      
      this.logger.info(`User logged out successfully: ${decodedToken.sub}`);
    } catch (error) {
      this.logger.error('Logout failed', error.stack);
      
      // Enhanced error handling with structured AppException patterns
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        ErrorType.INTERNAL_SERVER_ERROR,
        'Logout failed',
        'AUTH_007'
      );
    }
  }

  /**
   * Generates a pair of access and refresh tokens for a user.
   * @param user - The user to generate tokens for
   * @returns Access and refresh tokens with expiration information
   * @private
   */
  private async generateTokenPair(user: User): Promise<TokenPair> {
    // Get JWT configuration from ConfigService
    const jwtConfig = this.configService.get('authService.jwt');
    
    // Generate a unique token ID
    const tokenId = this.generateTokenId();
    const refreshTokenId = this.generateTokenId();
    
    // Create the JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      jti: tokenId,
      // Include roles if available
      roles: user.roles?.map(role => role.name) || []
    };
    
    // Create the refresh token payload
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      jti: refreshTokenId,
      roles: user.roles?.map(role => role.name) || []
    };
    
    // Sign the tokens
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtConfig.accessTokenExpiration,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: jwtConfig.refreshTokenExpiration,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    // Store the refresh token in Redis for secure token rotation
    await this.tokenStorage.storeRefreshToken({
      jti: refreshTokenId,
      userId: user.id,
      expiresIn: this.getExpirationSeconds(jwtConfig.refreshTokenExpiration)
    });
    
    // Calculate expiration timestamps
    const accessTokenExpiration = this.calculateExpiration(jwtConfig.accessTokenExpiration);
    const refreshTokenExpiration = this.calculateExpiration(jwtConfig.refreshTokenExpiration);
    
    return {
      accessToken,
      refreshToken,
      accessTokenExpiration,
      refreshTokenExpiration
    };
  }

  /**
   * Verifies a refresh token and returns its payload.
   * @param refreshToken - The refresh token to verify
   * @returns The decoded and verified token payload
   * @private
   */
  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get('authService.jwt.secret')
      });
      
      // Check if the token has a valid ID
      if (!payload || !payload.jti) {
        throw new AppException(
          ErrorType.UNAUTHORIZED,
          'Invalid refresh token format',
          'AUTH_008'
        );
      }
      
      // Check if the refresh token is valid in Redis
      const isValid = await this.tokenStorage.isRefreshTokenValid(payload.jti, payload.sub);
      if (!isValid) {
        throw new AppException(
          ErrorType.UNAUTHORIZED,
          'Refresh token has been revoked or used',
          'AUTH_009'
        );
      }
      
      return payload;
    } catch (error) {
      this.logger.error('Refresh token verification failed', error.stack);
      
      // Enhanced error handling with structured AppException patterns
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        ErrorType.UNAUTHORIZED,
        'Invalid refresh token',
        'AUTH_010'
      );
    }
  }

  /**
   * Generates a unique token ID.
   * @returns A unique token ID
   * @private
   */
  private generateTokenId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Calculates an expiration timestamp from a duration string.
   * @param duration - Duration string (e.g., '1h', '7d')
   * @returns Expiration timestamp in milliseconds
   * @private
   */
  private calculateExpiration(duration: string): number {
    const seconds = this.getExpirationSeconds(duration);
    return Date.now() + (seconds * 1000);
  }

  /**
   * Converts a duration string to seconds.
   * @param duration - Duration string (e.g., '1h', '7d')
   * @returns Duration in seconds
   * @private
   */
  private getExpirationSeconds(duration: string): number {
    const unit = duration.charAt(duration.length - 1);
    const value = parseInt(duration.substring(0, duration.length - 1), 10);
    
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600; // Default to 1 hour
    }
  }
}