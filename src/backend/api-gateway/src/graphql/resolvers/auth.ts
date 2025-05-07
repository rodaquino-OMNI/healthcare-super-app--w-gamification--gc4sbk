/**
 * Authentication GraphQL Resolvers
 * 
 * This file defines resolvers for all authentication-related GraphQL operations,
 * including login, registration, token management, and user profile operations.
 * It implements enhanced error handling with retry policies and circuit breakers.
 */
import { AuthService } from '@app/auth';
import {
  LoginRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
  MfaVerificationDto,
  PasswordResetRequestDto,
  PasswordResetDto,
  UpdateUserDto,
  ChangePasswordDto,
  SocialLoginDto,
  BiometricLoginDto
} from '@austa/interfaces/auth/request.interface';
import {
  LoginResponseDto,
  RegisterResponseDto,
  TokenValidationResponseDto
} from '@austa/interfaces/auth/response.interface';
import { AuthSession, JwtPayload } from '@austa/interfaces/auth/auth.interface';
import { User } from '@austa/interfaces/auth/user.interface';
import { Resilient } from '@austa/errors/decorators/resilient.decorator';
import { RetryWithBackoff } from '@austa/errors/decorators/retry.decorator';
import { WithCircuitBreaker } from '@austa/errors/decorators/circuit-breaker.decorator';
import { WithErrorContext, ClassifyError } from '@austa/errors/decorators/error-context.decorator';
import { BaseError } from '@austa/errors/base';

/**
 * Factory function that creates authentication resolvers
 * @param authService - Instance of the AuthService for handling auth operations
 * @returns Object containing Query and Mutation resolvers for auth operations
 */
export const authResolvers = (authService: AuthService) => {
  // Create a class to apply decorators to methods
  class AuthResolvers {
    /**
     * Login resolver with retry and circuit breaker patterns
     * Retries on transient errors, breaks circuit on persistent failures
     */
    @Resilient()
      .withRetry({ maxAttempts: 3, delay: 300, exponential: true })
      .withCircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 })
      .withErrorContext('auth.login')
    async login(_: any, { email, password }: { email: string; password: string }): Promise<AuthSession> {
      try {
        const loginDto: LoginRequestDto = { email, password };
        const response: LoginResponseDto = await authService.login(loginDto);
        
        return {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt
        };
      } catch (error) {
        // Transform error to include more context
        throw new BaseError(
          'Authentication failed',
          { email, cause: error },
          'AUTH_LOGIN_FAILED'
        );
      }
    }

    /**
     * Register resolver with retry pattern for database operations
     */
    @RetryWithBackoff({ maxAttempts: 3, delay: 500, exponential: true })
    @WithErrorContext('auth.register')
    @ClassifyError()
    async register(
      _: any,
      { name, email, password }: { name: string; email: string; password: string }
    ): Promise<AuthSession> {
      const registerDto: RegisterRequestDto = { name, email, password };
      const response: RegisterResponseDto = await authService.register(registerDto);
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt
      };
    }

    /**
     * Logout resolver
     */
    @WithErrorContext('auth.logout')
    async logout(_: any, __: any, context: any): Promise<boolean> {
      const token = context.req.headers.authorization?.split(' ')[1];
      if (!token) {
        return true; // Already logged out
      }
      
      await authService.logout(token);
      return true;
    }

    /**
     * Token refresh resolver with circuit breaker pattern
     * Breaks circuit on persistent token validation failures
     */
    @WithCircuitBreaker({ failureThreshold: 10, resetTimeout: 60000 })
    @WithErrorContext('auth.refreshToken')
    async refreshToken(_: any, __: any, context: any): Promise<AuthSession> {
      const refreshToken = context.req.headers['x-refresh-token'];
      if (!refreshToken) {
        throw new BaseError(
          'Refresh token is required',
          { context: 'Missing refresh token header' },
          'AUTH_REFRESH_TOKEN_MISSING'
        );
      }
      
      const refreshTokenDto: RefreshTokenRequestDto = { refreshToken };
      const response: TokenValidationResponseDto = await authService.refreshToken(refreshTokenDto);
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt
      };
    }

    /**
     * MFA verification resolver
     */
    @WithErrorContext('auth.verifyMFA')
    async verifyMFA(_: any, { code }: { code: string }, context: any): Promise<AuthSession> {
      const token = context.req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new BaseError(
          'Authentication required',
          { context: 'Missing authorization header' },
          'AUTH_TOKEN_MISSING'
        );
      }
      
      const mfaDto: MfaVerificationDto = { token, code };
      const response = await authService.verifyMfa(mfaDto);
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt
      };
    }

    /**
     * Password reset request resolver
     */
    @RetryWithBackoff({ maxAttempts: 2, delay: 300 })
    @WithErrorContext('auth.requestPasswordReset')
    async requestPasswordReset(_: any, { email }: { email: string }): Promise<boolean> {
      const resetRequestDto: PasswordResetRequestDto = { email };
      await authService.requestPasswordReset(resetRequestDto);
      return true;
    }

    /**
     * Password reset resolver
     */
    @WithErrorContext('auth.resetPassword')
    async resetPassword(
      _: any,
      { token, password }: { token: string; password: string }
    ): Promise<boolean> {
      const resetDto: PasswordResetDto = { token, password };
      await authService.resetPassword(resetDto);
      return true;
    }

    /**
     * Update user resolver
     */
    @WithErrorContext('auth.updateUser')
    async updateUser(
      _: any,
      { name, email }: { name?: string; email?: string },
      context: any
    ): Promise<User> {
      const userId = this.getUserIdFromContext(context);
      const updateDto: UpdateUserDto = { userId, name, email };
      return await authService.updateUser(updateDto);
    }

    /**
     * Change password resolver
     */
    @WithErrorContext('auth.changePassword')
    async changePassword(
      _: any,
      { oldPassword, newPassword }: { oldPassword: string; newPassword: string },
      context: any
    ): Promise<boolean> {
      const userId = this.getUserIdFromContext(context);
      const changePasswordDto: ChangePasswordDto = { userId, oldPassword, newPassword };
      await authService.changePassword(changePasswordDto);
      return true;
    }

    /**
     * Setup MFA resolver
     */
    @WithErrorContext('auth.setupMFA')
    async setupMFA(_: any, __: any, context: any): Promise<boolean> {
      const userId = this.getUserIdFromContext(context);
      await authService.setupMfa(userId);
      return true;
    }

    /**
     * Disable MFA resolver
     */
    @WithErrorContext('auth.disableMFA')
    async disableMFA(_: any, __: any, context: any): Promise<boolean> {
      const userId = this.getUserIdFromContext(context);
      await authService.disableMfa(userId);
      return true;
    }

    /**
     * Social login resolver
     */
    @Resilient()
      .withRetry({ maxAttempts: 2, delay: 500 })
      .withCircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 })
      .withErrorContext('auth.socialLogin')
    async socialLogin(
      _: any,
      { provider, token }: { provider: string; token: string }
    ): Promise<AuthSession> {
      const socialLoginDto: SocialLoginDto = { provider, token };
      const response = await authService.socialLogin(socialLoginDto);
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt
      };
    }

    /**
     * Biometric login resolver
     */
    @WithCircuitBreaker({ failureThreshold: 3, resetTimeout: 60000 })
    @WithErrorContext('auth.biometricLogin')
    async biometricLogin(
      _: any,
      { biometricData }: { biometricData: string }
    ): Promise<AuthSession> {
      const biometricLoginDto: BiometricLoginDto = { biometricData };
      const response = await authService.biometricLogin(biometricLoginDto);
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt
      };
    }

    /**
     * Get user resolver
     */
    @WithErrorContext('auth.getUser')
    async getUser(_: any, { id }: { id: string }): Promise<User> {
      return await authService.getUserById(id);
    }

    /**
     * Helper method to extract user ID from context
     */
    private getUserIdFromContext(context: any): string {
      const token = context.req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new BaseError(
          'Authentication required',
          { context: 'Missing authorization header' },
          'AUTH_TOKEN_MISSING'
        );
      }
      
      try {
        // Decode token to get user ID
        // This is a simplified version - in production, use proper JWT verification
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) as JwtPayload;
        return payload.sub;
      } catch (error) {
        throw new BaseError(
          'Invalid authentication token',
          { cause: error },
          'AUTH_TOKEN_INVALID'
        );
      }
    }
  }

  // Create an instance of the resolvers class
  const resolvers = new AuthResolvers();

  // Return the resolver map
  return {
    Query: {
      getUser: resolvers.getUser.bind(resolvers)
    },
    Mutation: {
      login: resolvers.login.bind(resolvers),
      register: resolvers.register.bind(resolvers),
      logout: resolvers.logout.bind(resolvers),
      refreshToken: resolvers.refreshToken.bind(resolvers),
      verifyMFA: resolvers.verifyMFA.bind(resolvers),
      requestPasswordReset: resolvers.requestPasswordReset.bind(resolvers),
      resetPassword: resolvers.resetPassword.bind(resolvers),
      updateUser: resolvers.updateUser.bind(resolvers),
      changePassword: resolvers.changePassword.bind(resolvers),
      setupMFA: resolvers.setupMFA.bind(resolvers),
      disableMFA: resolvers.disableMFA.bind(resolvers),
      socialLogin: resolvers.socialLogin.bind(resolvers),
      biometricLogin: resolvers.biometricLogin.bind(resolvers)
    }
  };
};