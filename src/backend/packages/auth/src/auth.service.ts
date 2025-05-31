/**
 * @file Authentication Service
 * 
 * Implements the core authentication business logic as an @Injectable NestJS service,
 * handling user registration, login, JWT token generation, and token validation.
 * It integrates with the database service for user operations, implements secure
 * password handling, and wraps operations in structured error handling with specific
 * auth error codes.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// Import from @austa/errors package for standardized error handling
import { BaseError, ErrorType } from '@austa/errors';
import { AuthError, ValidationError } from '@austa/errors/categories';
import { withRetry } from '@austa/errors/utils';

// Import from @austa/database package for database access
import { PrismaService } from '@austa/database';
import { DatabaseError } from '@austa/database/errors';

// Import from @austa/logging package for structured logging
import { LoggerService } from '@austa/logging';

// Local imports
import { TokenService } from './token.service';
import { ERROR_CODES } from './constants';
import {
  AuthResult,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  TokenResponse,
  User,
  UserResponse,
  TokenUserInfo,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  PasswordChangeRequest,
  SocialLoginRequest,
  MfaChallengeRequest,
  MfaVerifyRequest,
  AuthProvider,
  TokenType,
  AuthEvent,
  AuthEventType,
  MfaMethod,
} from './types';

/**
 * Authentication Service
 * 
 * Handles core authentication operations including user registration, login,
 * token management, and password operations.
 */
@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly logger: Logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = new Logger(AuthService.name);
    this.loggerService.setContext(AuthService.name);
  }

  /**
   * Register a new user
   * 
   * @param registerRequest User registration data
   * @returns Authentication result with user info and tokens
   * @throws AuthError if email already exists
   * @throws ValidationError if data is invalid
   * @throws DatabaseError if database operation fails
   */
  async register(registerRequest: RegisterRequest): Promise<AuthResult> {
    try {
      const { email, password, firstName, lastName, phoneNumber } = registerRequest;

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AuthError(
          'Email already in use',
          ERROR_CODES.EMAIL_ALREADY_EXISTS,
          { email },
        );
      }

      // Validate password against policy
      this.validatePassword(password);

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user with retry mechanism for transient database errors
      const user = await withRetry(
        () => this.prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phoneNumber,
            emailVerified: false,
            mfaEnabled: false,
            provider: AuthProvider.LOCAL,
          },
        }),
        {
          maxRetries: 3,
          retryDelay: 300,
          retryableErrors: [DatabaseError],
          onRetry: (error, attempt) => {
            this.loggerService.warn(
              `Retrying user creation (attempt ${attempt}): ${error.message}`,
              { email, attempt, error: error.message },
            );
          },
        },
      );

      // Create default role assignment
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: await this.getDefaultRoleId(),
        },
      });

      // Log registration event
      this.logAuthEvent({
        type: AuthEventType.REGISTER,
        userId: user.id,
        email: user.email,
        provider: AuthProvider.LOCAL,
        timestamp: new Date(),
        status: 'success',
      });

      // Generate tokens
      const userInfo = await this.getUserInfo(user.id);
      const tokens = await this.tokenService.generateTokens(userInfo);

      // Send verification email (async, don't await)
      this.sendVerificationEmail(user.email).catch(error => {
        this.loggerService.error(
          `Failed to send verification email: ${error.message}`,
          { userId: user.id, email: user.email, error: error.message },
        );
      });

      return {
        user: this.mapUserToUserResponse(user, userInfo.roles, userInfo.permissions),
        tokens,
      };
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Map database errors to appropriate auth errors
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new AuthError(
          'Email already in use',
          ERROR_CODES.EMAIL_ALREADY_EXISTS,
          { email: registerRequest.email },
        );
      }

      // Log unexpected errors
      this.loggerService.error(
        `Registration failed: ${error.message}`,
        { email: registerRequest.email, error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Registration failed',
        ERROR_CODES.INVALID_CREDENTIALS,
        { email: registerRequest.email },
        error,
      );
    }
  }

  /**
   * Authenticate a user with email and password
   * 
   * @param loginRequest Login credentials
   * @returns Authentication result with user info and tokens
   * @throws AuthError if credentials are invalid
   * @throws ValidationError if data is invalid
   */
  async login(loginRequest: LoginRequest): Promise<AuthResult> {
    try {
      const { email, password, rememberMe } = loginRequest;

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AuthError(
          'Invalid email or password',
          ERROR_CODES.INVALID_CREDENTIALS,
          { email },
        );
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new AuthError(
          'Account is locked',
          ERROR_CODES.ACCOUNT_LOCKED,
          { email, lockedUntil: user.lockedUntil },
        );
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        await this.handleFailedLogin(user);

        throw new AuthError(
          'Invalid email or password',
          ERROR_CODES.INVALID_CREDENTIALS,
          { email },
        );
      }

      // Reset failed login attempts on successful login
      if (user.failedLoginAttempts > 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });
      }

      // Check if email verification is required
      if (!user.emailVerified && this.configService.get<boolean>('AUTH_REQUIRE_EMAIL_VERIFICATION', true)) {
        throw new AuthError(
          'Email not verified',
          ERROR_CODES.ACCOUNT_NOT_VERIFIED,
          { email, userId: user.id },
        );
      }

      // Check if MFA is required
      if (user.mfaEnabled) {
        const mfaChallengeToken = await this.createMfaChallenge(user.id, user.mfaMethod as MfaMethod);
        
        // Log MFA challenge event
        this.logAuthEvent({
          type: AuthEventType.MFA_CHALLENGE,
          userId: user.id,
          email: user.email,
          provider: AuthProvider.LOCAL,
          timestamp: new Date(),
          status: 'success',
          metadata: { mfaMethod: user.mfaMethod },
        });

        return {
          user: this.mapUserToUserResponse(user, [], {}),
          tokens: null,
          mfaRequired: true,
          mfaChallengeToken,
        };
      }

      // Get user info with roles and permissions
      const userInfo = await this.getUserInfo(user.id);

      // Generate tokens with extended expiration if rememberMe is true
      const tokens = await this.tokenService.generateTokens(
        userInfo,
        rememberMe ? this.getRememberMeExpiration() : undefined,
      );

      // Log successful login
      this.logAuthEvent({
        type: AuthEventType.LOGIN,
        userId: user.id,
        email: user.email,
        provider: AuthProvider.LOCAL,
        timestamp: new Date(),
        status: 'success',
        metadata: { rememberMe },
      });

      return {
        user: this.mapUserToUserResponse(user, userInfo.roles, userInfo.permissions),
        tokens,
      };
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Log unexpected errors
      this.loggerService.error(
        `Login failed: ${error.message}`,
        { email: loginRequest.email, error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Login failed',
        ERROR_CODES.INVALID_CREDENTIALS,
        { email: loginRequest.email },
        error,
      );
    }
  }

  /**
   * Authenticate a user with a social provider
   * 
   * @param socialLoginRequest Social login data
   * @returns Authentication result with user info and tokens
   * @throws AuthError if social authentication fails
   */
  async socialLogin(socialLoginRequest: SocialLoginRequest): Promise<AuthResult> {
    try {
      const { provider, code, redirectUri, idToken } = socialLoginRequest;

      // Validate provider
      if (!Object.values(AuthProvider).includes(provider)) {
        throw new ValidationError(
          'Invalid authentication provider',
          ERROR_CODES.OAUTH_PROVIDER_ERROR,
          { provider },
        );
      }

      // Get user profile from provider
      const profile = await this.getSocialProfile(provider, code, redirectUri, idToken);

      if (!profile || !profile.email) {
        throw new AuthError(
          'Failed to get user profile from provider',
          ERROR_CODES.OAUTH_PROVIDER_ERROR,
          { provider },
        );
      }

      // Find existing user or create a new one
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: profile.email },
            { 
              AND: [
                { provider },
                { externalId: profile.id },
              ],
            },
          ],
        },
      });

      if (user) {
        // Update user if needed
        if (user.provider !== provider || user.externalId !== profile.id) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              provider,
              externalId: profile.id,
              emailVerified: true, // Social logins are considered verified
            },
          });
        }
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            provider,
            externalId: profile.id,
            emailVerified: true, // Social logins are considered verified
            mfaEnabled: false,
          },
        });

        // Assign default role
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: await this.getDefaultRoleId(),
          },
        });
      }

      // Get user info with roles and permissions
      const userInfo = await this.getUserInfo(user.id);

      // Generate tokens
      const tokens = await this.tokenService.generateTokens(userInfo);

      // Log social login event
      this.logAuthEvent({
        type: AuthEventType.SOCIAL_LOGIN,
        userId: user.id,
        email: user.email,
        provider,
        timestamp: new Date(),
        status: 'success',
      });

      return {
        user: this.mapUserToUserResponse(user, userInfo.roles, userInfo.permissions),
        tokens,
      };
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Log unexpected errors
      this.loggerService.error(
        `Social login failed: ${error.message}`,
        { provider: socialLoginRequest.provider, error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Social login failed',
        ERROR_CODES.OAUTH_PROVIDER_ERROR,
        { provider: socialLoginRequest.provider },
        error,
      );
    }
  }

  /**
   * Refresh access token using a refresh token
   * 
   * @param refreshTokenRequest Refresh token request
   * @returns New token response
   * @throws AuthError if refresh token is invalid
   */
  async refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<TokenResponse> {
    try {
      return await this.tokenService.refreshToken(refreshTokenRequest);
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Log unexpected errors
      this.loggerService.error(
        `Token refresh failed: ${error.message}`,
        { error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to refresh token',
        ERROR_CODES.INVALID_REFRESH_TOKEN,
        {},
        error,
      );
    }
  }

  /**
   * Logout a user by revoking their tokens
   * 
   * @param userId User ID
   * @param token Access token to revoke
   * @returns True if logout was successful
   */
  async logout(userId: string, token: string): Promise<boolean> {
    try {
      // Revoke the token
      const revoked = await this.tokenService.revokeToken(token);

      // Log logout event
      this.logAuthEvent({
        type: AuthEventType.LOGOUT,
        userId,
        timestamp: new Date(),
        status: revoked ? 'success' : 'failure',
      });

      return revoked;
    } catch (error) {
      // Log error but don't throw (logout should always succeed)
      this.loggerService.error(
        `Logout failed: ${error.message}`,
        { userId, error: error.message, stack: error.stack },
      );

      return false;
    }
  }

  /**
   * Validate a token and return the user info
   * 
   * @param token JWT token to validate
   * @returns Token user info if token is valid
   * @throws AuthError if token is invalid
   */
  async validateToken(token: string): Promise<TokenUserInfo> {
    try {
      const payload = await this.tokenService.validateToken(token, TokenType.ACCESS);
      return {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
        permissions: payload.permissions || {},
      };
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Map token errors to appropriate auth errors
      if (error.message === ERROR_CODES.TOKEN_EXPIRED) {
        throw new AuthError(
          'Token has expired',
          ERROR_CODES.TOKEN_EXPIRED,
          {},
        );
      } else if (error.message === ERROR_CODES.INVALID_TOKEN) {
        throw new AuthError(
          'Invalid token',
          ERROR_CODES.INVALID_TOKEN,
          {},
        );
      } else if (error.message === ERROR_CODES.TOKEN_REVOKED) {
        throw new AuthError(
          'Token has been revoked',
          ERROR_CODES.TOKEN_REVOKED,
          {},
        );
      }

      // Log unexpected errors
      this.loggerService.error(
        `Token validation failed: ${error.message}`,
        { error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to validate token',
        ERROR_CODES.INVALID_TOKEN,
        {},
        error,
      );
    }
  }

  /**
   * Initiate password reset process
   * 
   * @param passwordResetRequest Password reset request
   * @returns True if reset email was sent
   */
  async requestPasswordReset(passwordResetRequest: PasswordResetRequest): Promise<boolean> {
    try {
      const { email } = passwordResetRequest;

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      // Always return true even if user doesn't exist (security best practice)
      if (!user) {
        this.loggerService.warn(
          `Password reset requested for non-existent email: ${email}`,
          { email },
        );
        return true;
      }

      // Check if user is using social login
      if (user.provider !== AuthProvider.LOCAL) {
        this.loggerService.warn(
          `Password reset requested for social login user: ${email}`,
          { email, provider: user.provider },
        );
        return true;
      }

      // Generate password reset token
      const resetToken = await this.tokenService.generateSpecialToken(
        user.id,
        TokenType.RESET_PASSWORD,
        3600, // 1 hour expiration
        { email: user.email },
      );

      // Send password reset email (with retry for transient errors)
      await withRetry(
        () => this.sendPasswordResetEmail(user.email, resetToken),
        {
          maxRetries: 3,
          retryDelay: 500,
          exponentialBackoff: true,
          onRetry: (error, attempt) => {
            this.loggerService.warn(
              `Retrying password reset email (attempt ${attempt}): ${error.message}`,
              { email, attempt, error: error.message },
            );
          },
        },
      );

      // Log password reset event
      this.logAuthEvent({
        type: AuthEventType.PASSWORD_RESET,
        userId: user.id,
        email: user.email,
        timestamp: new Date(),
        status: 'success',
      });

      return true;
    } catch (error) {
      // Log error but return true (security best practice)
      this.loggerService.error(
        `Password reset request failed: ${error.message}`,
        { email: passwordResetRequest.email, error: error.message, stack: error.stack },
      );

      return true;
    }
  }

  /**
   * Complete password reset process
   * 
   * @param passwordResetConfirmRequest Password reset confirmation
   * @returns True if password was reset successfully
   * @throws AuthError if reset token is invalid
   * @throws ValidationError if password doesn't meet requirements
   */
  async confirmPasswordReset(passwordResetConfirmRequest: PasswordResetConfirmRequest): Promise<boolean> {
    try {
      const { token, password } = passwordResetConfirmRequest;

      // Validate token
      const payload = await this.tokenService.validateToken(token, TokenType.RESET_PASSWORD);

      // Validate password against policy
      this.validatePassword(password);

      // Hash new password
      const hashedPassword = await this.hashPassword(password);

      // Update user password
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Revoke all existing tokens for this user
      await this.tokenService.revokeToken(token);

      // Log password change event
      this.logAuthEvent({
        type: AuthEventType.PASSWORD_CHANGE,
        userId: payload.sub,
        email: payload.email,
        timestamp: new Date(),
        status: 'success',
      });

      return true;
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Map token errors to appropriate auth errors
      if (error.message === ERROR_CODES.TOKEN_EXPIRED) {
        throw new AuthError(
          'Password reset link has expired',
          ERROR_CODES.INVALID_RESET_TOKEN,
          {},
        );
      } else if (error.message === ERROR_CODES.INVALID_TOKEN) {
        throw new AuthError(
          'Invalid password reset link',
          ERROR_CODES.INVALID_RESET_TOKEN,
          {},
        );
      }

      // Log unexpected errors
      this.loggerService.error(
        `Password reset confirmation failed: ${error.message}`,
        { error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to reset password',
        ERROR_CODES.INVALID_RESET_TOKEN,
        {},
        error,
      );
    }
  }

  /**
   * Change user password
   * 
   * @param userId User ID
   * @param passwordChangeRequest Password change request
   * @returns True if password was changed successfully
   * @throws AuthError if current password is invalid
   * @throws ValidationError if new password doesn't meet requirements
   */
  async changePassword(userId: string, passwordChangeRequest: PasswordChangeRequest): Promise<boolean> {
    try {
      const { currentPassword, newPassword } = passwordChangeRequest;

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AuthError(
          'User not found',
          ERROR_CODES.INVALID_CREDENTIALS,
          { userId },
        );
      }

      // Check if user is using social login
      if (user.provider !== AuthProvider.LOCAL) {
        throw new AuthError(
          'Password change not available for social login accounts',
          ERROR_CODES.INVALID_CREDENTIALS,
          { userId, provider: user.provider },
        );
      }

      // Verify current password
      const isPasswordValid = await this.verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AuthError(
          'Current password is incorrect',
          ERROR_CODES.INVALID_CREDENTIALS,
          { userId },
        );
      }

      // Validate new password against policy
      this.validatePassword(newPassword);

      // Check if new password is different from current
      if (currentPassword === newPassword) {
        throw new ValidationError(
          'New password must be different from current password',
          ERROR_CODES.PASSWORD_POLICY_VIOLATION,
          { userId },
        );
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update user password
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      });

      // Log password change event
      this.logAuthEvent({
        type: AuthEventType.PASSWORD_CHANGE,
        userId,
        email: user.email,
        timestamp: new Date(),
        status: 'success',
      });

      return true;
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Log unexpected errors
      this.loggerService.error(
        `Password change failed: ${error.message}`,
        { userId, error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to change password',
        ERROR_CODES.INVALID_CREDENTIALS,
        { userId },
        error,
      );
    }
  }

  /**
   * Create MFA challenge for a user
   * 
   * @param userId User ID
   * @param method MFA method
   * @returns MFA challenge token
   * @throws AuthError if MFA challenge creation fails
   */
  async createMfaChallenge(userId: string, method: MfaMethod): Promise<string> {
    try {
      // Generate MFA challenge token
      const challengeToken = await this.tokenService.generateSpecialToken(
        userId,
        TokenType.MFA_CHALLENGE,
        300, // 5 minutes expiration
        { mfaMethod: method },
      );

      // Generate and send MFA code based on method
      const code = this.generateMfaCode();
      
      // Store MFA code (hashed) with expiration
      await this.prisma.mfaChallenge.create({
        data: {
          userId,
          method,
          token: challengeToken,
          code: await this.hashPassword(code),
          expiresAt: new Date(Date.now() + 300000), // 5 minutes
        },
      });

      // Send MFA code based on method
      await this.sendMfaCode(userId, method, code);

      return challengeToken;
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Log unexpected errors
      this.loggerService.error(
        `MFA challenge creation failed: ${error.message}`,
        { userId, method, error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to create MFA challenge',
        ERROR_CODES.MFA_REQUIRED,
        { userId, method },
        error,
      );
    }
  }

  /**
   * Verify MFA code and complete authentication
   * 
   * @param mfaVerifyRequest MFA verification request
   * @returns Authentication result with user info and tokens
   * @throws AuthError if MFA verification fails
   */
  async verifyMfaCode(mfaVerifyRequest: MfaVerifyRequest): Promise<AuthResult> {
    try {
      const { token, code } = mfaVerifyRequest;

      // Validate MFA challenge token
      const payload = await this.tokenService.validateToken(token, TokenType.MFA_CHALLENGE);
      const userId = payload.sub;

      // Find MFA challenge
      const challenge = await this.prisma.mfaChallenge.findFirst({
        where: {
          userId,
          token,
          expiresAt: { gt: new Date() },
        },
      });

      if (!challenge) {
        throw new AuthError(
          'Invalid or expired MFA challenge',
          ERROR_CODES.MFA_INVALID_CODE,
          { userId },
        );
      }

      // Verify MFA code
      const isCodeValid = await this.verifyPassword(code, challenge.code);
      if (!isCodeValid) {
        throw new AuthError(
          'Invalid MFA code',
          ERROR_CODES.MFA_INVALID_CODE,
          { userId },
        );
      }

      // Delete used challenge
      await this.prisma.mfaChallenge.delete({
        where: { id: challenge.id },
      });

      // Get user with roles and permissions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AuthError(
          'User not found',
          ERROR_CODES.INVALID_CREDENTIALS,
          { userId },
        );
      }

      // Get user info with roles and permissions
      const userInfo = await this.getUserInfo(userId);

      // Generate tokens
      const tokens = await this.tokenService.generateTokens(userInfo);

      // Log MFA verification event
      this.logAuthEvent({
        type: AuthEventType.MFA_VERIFY,
        userId,
        email: user.email,
        timestamp: new Date(),
        status: 'success',
        metadata: { method: challenge.method },
      });

      return {
        user: this.mapUserToUserResponse(user, userInfo.roles, userInfo.permissions),
        tokens,
      };
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Map token errors to appropriate auth errors
      if (error.message === ERROR_CODES.TOKEN_EXPIRED) {
        throw new AuthError(
          'MFA challenge has expired',
          ERROR_CODES.MFA_INVALID_CODE,
          {},
        );
      } else if (error.message === ERROR_CODES.INVALID_TOKEN) {
        throw new AuthError(
          'Invalid MFA challenge',
          ERROR_CODES.MFA_INVALID_CODE,
          {},
        );
      }

      // Log unexpected errors
      this.loggerService.error(
        `MFA verification failed: ${error.message}`,
        { error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to verify MFA code',
        ERROR_CODES.MFA_INVALID_CODE,
        {},
        error,
      );
    }
  }

  /**
   * Enable MFA for a user
   * 
   * @param userId User ID
   * @param method MFA method
   * @returns True if MFA was enabled successfully
   */
  async enableMfa(userId: string, method: MfaMethod): Promise<boolean> {
    try {
      // Update user
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaMethod: method,
        },
      });

      return true;
    } catch (error) {
      // Log unexpected errors
      this.loggerService.error(
        `MFA enablement failed: ${error.message}`,
        { userId, method, error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to enable MFA',
        ERROR_CODES.INVALID_CREDENTIALS,
        { userId, method },
        error,
      );
    }
  }

  /**
   * Disable MFA for a user
   * 
   * @param userId User ID
   * @returns True if MFA was disabled successfully
   */
  async disableMfa(userId: string): Promise<boolean> {
    try {
      // Update user
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaMethod: null,
        },
      });

      return true;
    } catch (error) {
      // Log unexpected errors
      this.loggerService.error(
        `MFA disablement failed: ${error.message}`,
        { userId, error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to disable MFA',
        ERROR_CODES.INVALID_CREDENTIALS,
        { userId },
        error,
      );
    }
  }

  /**
   * Get user by ID
   * 
   * @param userId User ID
   * @returns User object if found
   * @throws AuthError if user is not found
   */
  async getUserById(userId: string): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AuthError(
          'User not found',
          ERROR_CODES.INVALID_CREDENTIALS,
          { userId },
        );
      }

      // Get user info with roles and permissions
      const userInfo = await this.getUserInfo(userId);

      return this.mapUserToUserResponse(user, userInfo.roles, userInfo.permissions);
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Log unexpected errors
      this.loggerService.error(
        `Get user failed: ${error.message}`,
        { userId, error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to get user',
        ERROR_CODES.INVALID_CREDENTIALS,
        { userId },
        error,
      );
    }
  }

  /**
   * Verify user's email address
   * 
   * @param token Email verification token
   * @returns True if email was verified successfully
   * @throws AuthError if verification token is invalid
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      // Validate token
      const payload = await this.tokenService.validateToken(token, TokenType.VERIFY_EMAIL);

      // Update user
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { emailVerified: true },
      });

      return true;
    } catch (error) {
      // Enhance error with context and rethrow
      if (error instanceof BaseError) {
        throw error;
      }

      // Map token errors to appropriate auth errors
      if (error.message === ERROR_CODES.TOKEN_EXPIRED) {
        throw new AuthError(
          'Email verification link has expired',
          ERROR_CODES.INVALID_TOKEN,
          {},
        );
      } else if (error.message === ERROR_CODES.INVALID_TOKEN) {
        throw new AuthError(
          'Invalid email verification link',
          ERROR_CODES.INVALID_TOKEN,
          {},
        );
      }

      // Log unexpected errors
      this.loggerService.error(
        `Email verification failed: ${error.message}`,
        { error: error.message, stack: error.stack },
      );

      throw new AuthError(
        'Failed to verify email',
        ERROR_CODES.INVALID_TOKEN,
        {},
        error,
      );
    }
  }

  /**
   * Resend email verification link
   * 
   * @param email User email
   * @returns True if verification email was sent
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      // Always return true even if user doesn't exist (security best practice)
      if (!user) {
        this.loggerService.warn(
          `Verification email requested for non-existent email: ${email}`,
          { email },
        );
        return true;
      }

      // Check if email is already verified
      if (user.emailVerified) {
        this.loggerService.info(
          `Verification email requested for already verified email: ${email}`,
          { email, userId: user.id },
        );
        return true;
      }

      // Send verification email
      await this.sendVerificationEmail(email);

      return true;
    } catch (error) {
      // Log error but return true (security best practice)
      this.loggerService.error(
        `Resend verification email failed: ${error.message}`,
        { email, error: error.message, stack: error.stack },
      );

      return true;
    }
  }

  /**
   * Hash a password using bcrypt
   * 
   * @param password Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a hash
   * 
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if password matches hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password against policy
   * 
   * @param password Password to validate
   * @throws ValidationError if password doesn't meet requirements
   */
  private validatePassword(password: string): void {
    const minLength = this.configService.get<number>('PASSWORD_MIN_LENGTH', 8);
    const requireUppercase = this.configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true);
    const requireLowercase = this.configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true);
    const requireNumber = this.configService.get<boolean>('PASSWORD_REQUIRE_NUMBER', true);
    const requireSpecial = this.configService.get<boolean>('PASSWORD_REQUIRE_SPECIAL', true);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumber && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new ValidationError(
        'Password does not meet requirements',
        ERROR_CODES.PASSWORD_POLICY_VIOLATION,
        { errors },
      );
    }
  }

  /**
   * Handle failed login attempt
   * 
   * @param user User object
   */
  private async handleFailedLogin(user: User): Promise<void> {
    const maxAttempts = this.configService.get<number>('PASSWORD_LOCKOUT_THRESHOLD', 5);
    const lockoutDuration = this.configService.get<number>('PASSWORD_LOCKOUT_DURATION', 15); // minutes

    // Increment failed login attempts
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: failedAttempts };

    // Lock account if max attempts reached
    if (failedAttempts >= maxAttempts) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + lockoutDuration);
      updateData.lockedUntil = lockUntil;

      this.loggerService.warn(
        `Account locked due to too many failed login attempts: ${user.email}`,
        { userId: user.id, email: user.email, failedAttempts, lockedUntil: lockUntil },
      );
    }

    // Update user
    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Log failed login event
    this.logAuthEvent({
      type: AuthEventType.LOGIN,
      userId: user.id,
      email: user.email,
      provider: AuthProvider.LOCAL,
      timestamp: new Date(),
      status: 'failure',
      metadata: { failedAttempts, accountLocked: failedAttempts >= maxAttempts },
    });
  }

  /**
   * Get user info with roles and permissions
   * 
   * @param userId User ID
   * @returns User info with roles and permissions
   */
  private async getUserInfo(userId: string): Promise<TokenUserInfo> {
    // Get user with roles
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AuthError(
        'User not found',
        ERROR_CODES.INVALID_CREDENTIALS,
        { userId },
      );
    }

    // Extract roles
    const roles = user.userRoles.map(ur => ur.role.name);

    // Extract permissions grouped by journey
    const permissions: Record<string, string[]> = {};

    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        const permission = rp.permission;
        const journey = permission.journey || 'common';

        if (!permissions[journey]) {
          permissions[journey] = [];
        }

        const permissionKey = `${permission.resource}:${permission.action}`;
        if (!permissions[journey].includes(permissionKey)) {
          permissions[journey].push(permissionKey);
        }
      });
    });

    return {
      id: user.id,
      email: user.email,
      roles,
      permissions,
    };
  }

  /**
   * Map user entity to user response
   * 
   * @param user User entity
   * @param roles User roles
   * @param permissions User permissions
   * @returns User response object
   */
  private mapUserToUserResponse(
    user: User,
    roles: string[],
    permissions: Record<string, string[]>,
  ): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod as MfaMethod,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      provider: user.provider as AuthProvider,
      roles,
      permissions,
    };
  }

  /**
   * Get default role ID
   * 
   * @returns Default role ID
   */
  private async getDefaultRoleId(): Promise<string> {
    const defaultRoleName = this.configService.get<string>('DEFAULT_ROLE', 'user');
    
    const role = await this.prisma.role.findFirst({
      where: { name: defaultRoleName },
    });

    if (!role) {
      this.loggerService.warn(
        `Default role '${defaultRoleName}' not found, creating it`,
        { defaultRoleName },
      );

      // Create default role if it doesn't exist
      const newRole = await this.prisma.role.create({
        data: {
          name: defaultRoleName,
          description: 'Default user role',
          isSystem: true,
        },
      });

      return newRole.id;
    }

    return role.id;
  }

  /**
   * Get remember me expiration extension
   * 
   * @returns Remember me expiration in seconds
   */
  private getRememberMeExpiration(): number {
    return this.configService.get<number>('REMEMBER_ME_EXTENSION', 2592000); // 30 days default
  }

  /**
   * Generate MFA code
   * 
   * @returns 6-digit MFA code
   */
  private generateMfaCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send MFA code to user
   * 
   * @param userId User ID
   * @param method MFA method
   * @param code MFA code
   */
  private async sendMfaCode(userId: string, method: MfaMethod, code: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      switch (method) {
        case MfaMethod.SMS:
          if (!user.phoneNumber) {
            throw new Error(`User ${userId} has no phone number for SMS MFA`);
          }
          // TODO: Implement SMS sending
          this.loggerService.debug(
            `[MOCK] Sending MFA code ${code} via SMS to ${user.phoneNumber}`,
            { userId, method, phoneNumber: user.phoneNumber },
          );
          break;

        case MfaMethod.EMAIL:
          // TODO: Implement email sending
          this.loggerService.debug(
            `[MOCK] Sending MFA code ${code} via email to ${user.email}`,
            { userId, method, email: user.email },
          );
          break;

        default:
          throw new Error(`Unsupported MFA method: ${method}`);
      }
    } catch (error) {
      this.loggerService.error(
        `Failed to send MFA code: ${error.message}`,
        { userId, method, error: error.message, stack: error.stack },
      );
      throw error;
    }
  }

  /**
   * Send verification email
   * 
   * @param email User email
   */
  private async sendVerificationEmail(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error(`User not found with email: ${email}`);
      }

      // Generate verification token
      const verificationToken = await this.tokenService.generateSpecialToken(
        user.id,
        TokenType.VERIFY_EMAIL,
        86400, // 24 hours expiration
        { email },
      );

      // TODO: Implement email sending
      this.loggerService.debug(
        `[MOCK] Sending verification email to ${email} with token ${verificationToken}`,
        { userId: user.id, email },
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to send verification email: ${error.message}`,
        { email, error: error.message, stack: error.stack },
      );
      throw error;
    }
  }

  /**
   * Send password reset email
   * 
   * @param email User email
   * @param resetToken Password reset token
   */
  private async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      // TODO: Implement email sending
      this.loggerService.debug(
        `[MOCK] Sending password reset email to ${email} with token ${resetToken}`,
        { email },
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to send password reset email: ${error.message}`,
        { email, error: error.message, stack: error.stack },
      );
      throw error;
    }
  }

  /**
   * Get social profile from provider
   * 
   * @param provider OAuth provider
   * @param code Authorization code
   * @param redirectUri Redirect URI
   * @param idToken ID token (for Apple Sign In)
   * @returns Social profile
   */
  private async getSocialProfile(
    provider: AuthProvider,
    code: string,
    redirectUri?: string,
    idToken?: string,
  ): Promise<any> {
    // This is a placeholder for actual OAuth implementation
    // In a real implementation, this would call the appropriate OAuth provider
    
    this.loggerService.debug(
      `[MOCK] Getting social profile from ${provider}`,
      { provider, redirectUri },
    );

    // Return mock profile for development
    return {
      id: `mock-${provider}-id-${Date.now()}`,
      email: `mock-${provider}-user-${Date.now()}@example.com`,
      firstName: 'Mock',
      lastName: 'User',
    };
  }

  /**
   * Log authentication event
   * 
   * @param event Authentication event
   */
  private logAuthEvent(event: AuthEvent): void {
    try {
      // Log to application logger
      if (event.status === 'success') {
        this.loggerService.info(
          `Auth event: ${event.type}`,
          { ...event },
        );
      } else {
        this.loggerService.warn(
          `Auth event failed: ${event.type}`,
          { ...event },
        );
      }

      // TODO: Store event in database for audit trail
      // In a real implementation, this would store the event in the database
    } catch (error) {
      this.loggerService.error(
        `Failed to log auth event: ${error.message}`,
        { event, error: error.message, stack: error.stack },
      );
    }
  }
}