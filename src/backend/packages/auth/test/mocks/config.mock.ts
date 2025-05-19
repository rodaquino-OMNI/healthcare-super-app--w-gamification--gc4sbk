/**
 * @file Mock ConfigService for Auth Package Tests
 * @description Provides a configurable mock implementation of NestJS ConfigService
 * for use in auth package tests. This mock simulates configuration retrieval without
 * depending on actual environment variables or configuration files.
 */

import { Injectable } from '@nestjs/common';
import { JwtConfigOptions } from '../../src/providers/jwt/jwt.config';
import { OAuthProviderType } from '../../src/providers/oauth/interfaces';
import { get, has, set } from 'lodash';

/**
 * Interface for ConfigService get method options
 */
interface ConfigGetOptions {
  /**
   * If true, attempts to infer the type of the property
   */
  infer?: boolean;
}

/**
 * Default JWT configuration for testing
 */
const DEFAULT_JWT_CONFIG: JwtConfigOptions = {
  secret: 'test-jwt-secret-key',
  accessTokenExpiration: '1h',
  refreshTokenExpiration: '7d',
  issuer: 'austa-test',
  audience: 'test-users',
  algorithms: ['HS256'],
  ignoreExpiration: false,
  clockTolerance: 0,
  includeJwtId: true,
};

/**
 * Default OAuth configuration for testing
 */
const DEFAULT_OAUTH_CONFIG = {
  google: {
    clientId: 'test-google-client-id',
    clientSecret: 'test-google-client-secret',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ['email', 'profile'],
  },
  facebook: {
    clientId: 'test-facebook-client-id',
    clientSecret: 'test-facebook-client-secret',
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    scope: ['email', 'public_profile'],
  },
  apple: {
    clientId: 'test-apple-client-id',
    clientSecret: 'test-apple-client-secret',
    teamId: 'test-apple-team-id',
    keyId: 'test-apple-key-id',
    privateKey: 'test-apple-private-key',
    callbackURL: 'http://localhost:3000/auth/apple/callback',
    scope: ['email', 'name'],
  },
};

/**
 * Default database authentication configuration for testing
 */
const DEFAULT_DB_AUTH_CONFIG = {
  usernameField: 'email',
  passwordField: 'password',
  passwordMinLength: 8,
  passwordMaxLength: 100,
  passwordHashRounds: 10,
  loginAttempts: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
};

/**
 * Default configuration values for auth testing
 */
const DEFAULT_CONFIG = {
  jwt: DEFAULT_JWT_CONFIG,
  oauth: DEFAULT_OAUTH_CONFIG,
  dbAuth: DEFAULT_DB_AUTH_CONFIG,
  environment: {
    nodeEnv: 'test',
    port: 3000,
    host: 'localhost',
  },
};

/**
 * Mock implementation of the ConfigService for auth package tests
 * 
 * This mock provides predefined configuration values for auth-specific settings
 * like JWT secrets, token expiration, and OAuth credentials. It allows tests to
 * override these values as needed.
 *
 * @implements NestJS ConfigService interface
 */
@Injectable()
export class ConfigServiceMock {
  private config: Record<string, any>;

  /**
   * Creates a new ConfigServiceMock instance
   * @param initialConfig Optional initial configuration to override defaults
   */
  constructor(initialConfig: Record<string, any> = {}) {
    this.config = { ...DEFAULT_CONFIG };
    
    // Apply any initial configuration overrides
    Object.entries(initialConfig).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Gets a configuration value by key
   * @param propertyPath Path to the configuration property
   * @param options Optional configuration options
   * @returns The configuration value, or undefined if not found
   */
  get<T = any>(propertyPath: string, options?: ConfigGetOptions): T | undefined {
    return get(this.config, propertyPath);
  }
  
  /**
   * Gets a configuration value by key with a default value if not found
   * @param propertyPath Path to the configuration property
   * @param defaultValue Default value to return if the property is not found
   * @returns The configuration value, or the default value if not found
   */
  getOrDefault<T = any>(propertyPath: string, defaultValue: T): T {
    const value = this.get<T>(propertyPath);
    return value === undefined ? defaultValue : value;
  }

  /**
   * Sets a configuration value
   * @param propertyPath Path to the configuration property
   * @param value Value to set
   */
  set(propertyPath: string, value: any): void {
    set(this.config, propertyPath, value);
  }

  /**
   * Checks if a configuration property exists
   * @param propertyPath Path to the configuration property
   * @returns True if the property exists, false otherwise
   */
  has(propertyPath: string): boolean {
    return has(this.config, propertyPath);
  }

  /**
   * Gets the entire configuration object
   * @returns The complete configuration object
   */
  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Resets the configuration to default values
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Gets JWT configuration
   * @returns JWT configuration
   */
  getJwtConfig(): JwtConfigOptions {
    return this.get<JwtConfigOptions>('jwt');
  }

  /**
   * Gets OAuth configuration for a specific provider
   * @param provider OAuth provider type
   * @returns Provider-specific OAuth configuration
   */
  getOAuthConfig(provider: OAuthProviderType): Record<string, any> {
    return this.get<Record<string, any>>(`oauth.${provider}`);
  }

  /**
   * Gets database authentication configuration
   * @returns Database authentication configuration
   */
  getDbAuthConfig(): Record<string, any> {
    return this.get<Record<string, any>>('dbAuth');
  }

  /**
   * Creates a pre-configured ConfigServiceMock instance for JWT testing
   * @param overrides Optional JWT configuration overrides
   * @returns ConfigServiceMock instance
   */
  static forJwtTesting(overrides: Partial<JwtConfigOptions> = {}): ConfigServiceMock {
    const mock = new ConfigServiceMock();
    mock.set('jwt', { ...DEFAULT_JWT_CONFIG, ...overrides });
    return mock;
  }

  /**
   * Creates a pre-configured ConfigServiceMock instance for OAuth testing
   * @param provider OAuth provider type
   * @param overrides Optional provider-specific configuration overrides
   * @returns ConfigServiceMock instance
   */
  static forOAuthTesting(
    provider: OAuthProviderType,
    overrides: Record<string, any> = {}
  ): ConfigServiceMock {
    const mock = new ConfigServiceMock();
    const providerConfig = { ...DEFAULT_OAUTH_CONFIG[provider], ...overrides };
    mock.set(`oauth.${provider}`, providerConfig);
    return mock;
  }

  /**
   * Creates a pre-configured ConfigServiceMock instance for database authentication testing
   * @param overrides Optional database authentication configuration overrides
   * @returns ConfigServiceMock instance
   */
  static forDbAuthTesting(overrides: Record<string, any> = {}): ConfigServiceMock {
    const mock = new ConfigServiceMock();
    mock.set('dbAuth', { ...DEFAULT_DB_AUTH_CONFIG, ...overrides });
    return mock;
  }
  
  /**
   * Creates a pre-configured ConfigServiceMock instance with custom configuration
   * @param config Custom configuration object
   * @returns ConfigServiceMock instance
   */
  static forCustomTesting(config: Record<string, any>): ConfigServiceMock {
    return new ConfigServiceMock(config);
  }
  
  /**
   * Creates a pre-configured ConfigServiceMock instance for journey-specific testing
   * @param journey Journey type ('health', 'care', or 'plan')
   * @param overrides Optional journey-specific configuration overrides
   * @returns ConfigServiceMock instance
   */
  static forJourneyTesting(
    journey: 'health' | 'care' | 'plan',
    overrides: Record<string, any> = {}
  ): ConfigServiceMock {
    const mock = new ConfigServiceMock();
    
    // Apply journey-specific JWT overrides if provided
    if (overrides.jwt) {
      const jwtConfig = mock.getJwtConfig();
      if (!jwtConfig.journeyOverrides) {
        jwtConfig.journeyOverrides = {};
      }
      jwtConfig.journeyOverrides[journey] = overrides.jwt;
      mock.set('jwt', jwtConfig);
    }
    
    // Apply other journey-specific overrides
    Object.entries(overrides)
      .filter(([key]) => key !== 'jwt')
      .forEach(([key, value]) => {
        mock.set(`${journey}.${key}`, value);
      });
    
    return mock;
  }
}