/**
 * @file Auth Service Mock
 * 
 * Mock implementation of the core AuthService that simulates authentication operations
 * like login, registration, and token validation. This mock provides configurable responses
 * for different test scenarios without relying on actual database, token, or external
 * provider dependencies.
 */

import { Injectable } from '@nestjs/common';

import {
  AuthResult,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  TokenResponse,
  UserResponse,
  TokenUserInfo,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  PasswordChangeRequest,
  SocialLoginRequest,
  MfaChallengeRequest,
  MfaVerifyRequest,
  AuthProvider,
  MfaMethod,
} from '../../src/types';

/**
 * Configuration for the AuthServiceMock
 */
export interface AuthServiceMockConfig {
  /** Default user to return for authentication operations */
  defaultUser?: UserResponse;
  /** Default tokens to return for authentication operations */
  defaultTokens?: TokenResponse;
  /** Whether to simulate MFA requirement */
  requireMfa?: boolean;
  /** Default MFA challenge token */
  defaultMfaChallengeToken?: string;
  /** Whether to simulate errors for specific operations */
  simulateErrors?: {
    login?: boolean;
    register?: boolean;
    refreshToken?: boolean;
    validateToken?: boolean;
    socialLogin?: boolean;
    passwordReset?: boolean;
    passwordChange?: boolean;
    mfaVerify?: boolean;
  };
  /** Custom error messages for simulated errors */
  errorMessages?: {
    login?: string;
    register?: string;
    refreshToken?: string;
    validateToken?: string;
    socialLogin?: string;
    passwordReset?: string;
    passwordChange?: string;
    mfaVerify?: string;
  };
}

/**
 * Mock implementation of AuthService for testing
 */
@Injectable()
export class AuthServiceMock {
  /** Configuration for the mock */
  private config: AuthServiceMockConfig;

  /** Tracks method calls for verification in tests */
  public methodCalls: {
    login: LoginRequest[];
    register: RegisterRequest[];
    refreshToken: RefreshTokenRequest[];
    validateToken: string[];
    logout: { userId: string; token: string }[];
    socialLogin: SocialLoginRequest[];
    requestPasswordReset: PasswordResetRequest[];
    confirmPasswordReset: PasswordResetConfirmRequest[];
    changePassword: { userId: string; request: PasswordChangeRequest }[];
    createMfaChallenge: { userId: string; method: MfaMethod }[];
    verifyMfaCode: MfaVerifyRequest[];
    enableMfa: { userId: string; method: MfaMethod }[];
    disableMfa: string[];
    getUserById: string[];
    verifyEmail: string[];
    resendVerificationEmail: string[];
  };

  /**
   * Create a new AuthServiceMock
   * 
   * @param config Configuration for the mock
   */
  constructor(config: AuthServiceMockConfig = {}) {
    this.config = {
      defaultUser: config.defaultUser || this.createDefaultUser(),
      defaultTokens: config.defaultTokens || this.createDefaultTokens(),
      requireMfa: config.requireMfa || false,
      defaultMfaChallengeToken: config.defaultMfaChallengeToken || 'mock-mfa-challenge-token',
      simulateErrors: config.simulateErrors || {},
      errorMessages: config.errorMessages || {},
    };

    this.methodCalls = {
      login: [],
      register: [],
      refreshToken: [],
      validateToken: [],
      logout: [],
      socialLogin: [],
      requestPasswordReset: [],
      confirmPasswordReset: [],
      changePassword: [],
      createMfaChallenge: [],
      verifyMfaCode: [],
      enableMfa: [],
      disableMfa: [],
      getUserById: [],
      verifyEmail: [],
      resendVerificationEmail: [],
    };
  }

  /**
   * Update the mock configuration
   * 
   * @param config New configuration options
   */
  updateConfig(config: Partial<AuthServiceMockConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      simulateErrors: {
        ...this.config.simulateErrors,
        ...config.simulateErrors,
      },
      errorMessages: {
        ...this.config.errorMessages,
        ...config.errorMessages,
      },
    };
  }

  /**
   * Reset all tracked method calls
   */
  resetMethodCalls(): void {
    Object.keys(this.methodCalls).forEach(key => {
      this.methodCalls[key] = [];
    });
  }

  /**
   * Mock implementation of register
   * 
   * @param registerRequest User registration data
   * @returns Authentication result with user info and tokens
   */
  async register(registerRequest: RegisterRequest): Promise<AuthResult> {
    this.methodCalls.register.push(registerRequest);

    if (this.config.simulateErrors?.register) {
      throw new Error(this.config.errorMessages?.register || 'Mock register error');
    }

    // Create a user based on the registration request
    const user: UserResponse = {
      ...this.config.defaultUser,
      email: registerRequest.email,
      firstName: registerRequest.firstName,
      lastName: registerRequest.lastName,
      phoneNumber: registerRequest.phoneNumber,
    };

    return {
      user,
      tokens: this.config.defaultTokens,
    };
  }

  /**
   * Mock implementation of login
   * 
   * @param loginRequest Login credentials
   * @returns Authentication result with user info and tokens
   */
  async login(loginRequest: LoginRequest): Promise<AuthResult> {
    this.methodCalls.login.push(loginRequest);

    if (this.config.simulateErrors?.login) {
      throw new Error(this.config.errorMessages?.login || 'Mock login error');
    }

    // If MFA is required, return MFA challenge
    if (this.config.requireMfa) {
      return {
        user: this.config.defaultUser,
        tokens: null,
        mfaRequired: true,
        mfaChallengeToken: this.config.defaultMfaChallengeToken,
      };
    }

    return {
      user: this.config.defaultUser,
      tokens: this.config.defaultTokens,
    };
  }

  /**
   * Mock implementation of socialLogin
   * 
   * @param socialLoginRequest Social login data
   * @returns Authentication result with user info and tokens
   */
  async socialLogin(socialLoginRequest: SocialLoginRequest): Promise<AuthResult> {
    this.methodCalls.socialLogin.push(socialLoginRequest);

    if (this.config.simulateErrors?.socialLogin) {
      throw new Error(this.config.errorMessages?.socialLogin || 'Mock social login error');
    }

    // Update user with provider information
    const user: UserResponse = {
      ...this.config.defaultUser,
      provider: socialLoginRequest.provider,
    };

    return {
      user,
      tokens: this.config.defaultTokens,
    };
  }

  /**
   * Mock implementation of refreshToken
   * 
   * @param refreshTokenRequest Refresh token request
   * @returns New token response
   */
  async refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<TokenResponse> {
    this.methodCalls.refreshToken.push(refreshTokenRequest);

    if (this.config.simulateErrors?.refreshToken) {
      throw new Error(this.config.errorMessages?.refreshToken || 'Mock refresh token error');
    }

    return this.config.defaultTokens;
  }

  /**
   * Mock implementation of logout
   * 
   * @param userId User ID
   * @param token Access token to revoke
   * @returns True if logout was successful
   */
  async logout(userId: string, token: string): Promise<boolean> {
    this.methodCalls.logout.push({ userId, token });
    return true;
  }

  /**
   * Mock implementation of validateToken
   * 
   * @param token JWT token to validate
   * @returns Token user info if token is valid
   */
  async validateToken(token: string): Promise<TokenUserInfo> {
    this.methodCalls.validateToken.push(token);

    if (this.config.simulateErrors?.validateToken) {
      throw new Error(this.config.errorMessages?.validateToken || 'Mock validate token error');
    }

    const { id, email, roles, permissions } = this.config.defaultUser;
    return { id, email, roles, permissions };
  }

  /**
   * Mock implementation of requestPasswordReset
   * 
   * @param passwordResetRequest Password reset request
   * @returns True if reset email was sent
   */
  async requestPasswordReset(passwordResetRequest: PasswordResetRequest): Promise<boolean> {
    this.methodCalls.requestPasswordReset.push(passwordResetRequest);

    if (this.config.simulateErrors?.passwordReset) {
      throw new Error(this.config.errorMessages?.passwordReset || 'Mock password reset error');
    }

    return true;
  }

  /**
   * Mock implementation of confirmPasswordReset
   * 
   * @param passwordResetConfirmRequest Password reset confirmation
   * @returns True if password was reset successfully
   */
  async confirmPasswordReset(passwordResetConfirmRequest: PasswordResetConfirmRequest): Promise<boolean> {
    this.methodCalls.confirmPasswordReset.push(passwordResetConfirmRequest);

    if (this.config.simulateErrors?.passwordReset) {
      throw new Error(this.config.errorMessages?.passwordReset || 'Mock confirm password reset error');
    }

    return true;
  }

  /**
   * Mock implementation of changePassword
   * 
   * @param userId User ID
   * @param passwordChangeRequest Password change request
   * @returns True if password was changed successfully
   */
  async changePassword(userId: string, passwordChangeRequest: PasswordChangeRequest): Promise<boolean> {
    this.methodCalls.changePassword.push({ userId, request: passwordChangeRequest });

    if (this.config.simulateErrors?.passwordChange) {
      throw new Error(this.config.errorMessages?.passwordChange || 'Mock change password error');
    }

    return true;
  }

  /**
   * Mock implementation of createMfaChallenge
   * 
   * @param userId User ID
   * @param method MFA method
   * @returns MFA challenge token
   */
  async createMfaChallenge(userId: string, method: MfaMethod): Promise<string> {
    this.methodCalls.createMfaChallenge.push({ userId, method });
    return this.config.defaultMfaChallengeToken;
  }

  /**
   * Mock implementation of verifyMfaCode
   * 
   * @param mfaVerifyRequest MFA verification request
   * @returns Authentication result with user info and tokens
   */
  async verifyMfaCode(mfaVerifyRequest: MfaVerifyRequest): Promise<AuthResult> {
    this.methodCalls.verifyMfaCode.push(mfaVerifyRequest);

    if (this.config.simulateErrors?.mfaVerify) {
      throw new Error(this.config.errorMessages?.mfaVerify || 'Mock MFA verification error');
    }

    return {
      user: this.config.defaultUser,
      tokens: this.config.defaultTokens,
    };
  }

  /**
   * Mock implementation of enableMfa
   * 
   * @param userId User ID
   * @param method MFA method
   * @returns True if MFA was enabled successfully
   */
  async enableMfa(userId: string, method: MfaMethod): Promise<boolean> {
    this.methodCalls.enableMfa.push({ userId, method });
    return true;
  }

  /**
   * Mock implementation of disableMfa
   * 
   * @param userId User ID
   * @returns True if MFA was disabled successfully
   */
  async disableMfa(userId: string): Promise<boolean> {
    this.methodCalls.disableMfa.push(userId);
    return true;
  }

  /**
   * Mock implementation of getUserById
   * 
   * @param userId User ID
   * @returns User object if found
   */
  async getUserById(userId: string): Promise<UserResponse> {
    this.methodCalls.getUserById.push(userId);
    return {
      ...this.config.defaultUser,
      id: userId,
    };
  }

  /**
   * Mock implementation of verifyEmail
   * 
   * @param token Email verification token
   * @returns True if email was verified successfully
   */
  async verifyEmail(token: string): Promise<boolean> {
    this.methodCalls.verifyEmail.push(token);
    return true;
  }

  /**
   * Mock implementation of resendVerificationEmail
   * 
   * @param email User email
   * @returns True if verification email was sent
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    this.methodCalls.resendVerificationEmail.push(email);
    return true;
  }

  /**
   * Create default user for testing
   * 
   * @returns Default user response
   */
  private createDefaultUser(): UserResponse {
    return {
      id: 'mock-user-id',
      email: 'mock-user@example.com',
      firstName: 'Mock',
      lastName: 'User',
      phoneNumber: '+1234567890',
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provider: AuthProvider.LOCAL,
      roles: ['user'],
      permissions: {
        common: ['user:read', 'user:update'],
        health: ['health_journey:read'],
        care: ['care_journey:read'],
        plan: ['plan_journey:read'],
      },
    };
  }

  /**
   * Create default tokens for testing
   * 
   * @returns Default token response
   */
  private createDefaultTokens(): TokenResponse {
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  }
}