/**
 * @file config.interface.ts
 * @description Configuration interfaces for the Auth Service
 * 
 * This file defines the TypeScript interfaces for the Auth Service configuration,
 * ensuring type safety and standardization across the service. It integrates with
 * @austa/interfaces for shared configuration types and supports environment-specific
 * configurations and feature flags.
 */

import { CommonConfigInterface } from '@austa/interfaces/common/config';

/**
 * Server configuration interface for the Auth Service
 */
export interface ServerConfig {
  /** Port number for the Auth Service to listen on */
  port: number;
  /** Current environment (development, staging, production) */
  environment: string;
  /** API prefix for all routes */
  apiPrefix: string;
  /** API version for versioning support */
  apiVersion?: string;
}

/**
 * JWT configuration interface for authentication tokens
 */
export interface JwtConfig {
  /** Secret key used to sign JWT tokens */
  secret: string;
  /** Expiration time for access tokens */
  accessTokenExpiration: string;
  /** Expiration time for refresh tokens */
  refreshTokenExpiration: string;
  /** JWT issuer claim */
  issuer: string;
  /** JWT audience claim */
  audience: string;
}

/**
 * OAuth provider configuration interface
 */
export interface OAuthProviderConfig {
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** OAuth callback URL */
  callbackUrl: string;
  /** Whether this OAuth provider is enabled */
  enabled: boolean;
}

/**
 * Apple OAuth provider specific configuration
 */
export interface AppleOAuthConfig extends Omit<OAuthProviderConfig, 'clientSecret'> {
  /** Apple Team ID */
  teamId: string;
  /** Apple Key ID */
  keyId: string;
  /** Apple Private Key */
  privateKey: string;
}

/**
 * OAuth configuration interface for all supported providers
 */
export interface OAuthConfig {
  /** Google OAuth configuration */
  google: OAuthProviderConfig;
  /** Facebook OAuth configuration */
  facebook: OAuthProviderConfig;
  /** Apple OAuth configuration */
  apple: AppleOAuthConfig;
}

/**
 * Multi-factor authentication configuration interface
 */
export interface MfaConfig {
  /** Whether MFA is enabled globally */
  enabled: boolean;
  /** Issuer name for TOTP */
  issuer: string;
  /** Expiration time for MFA codes in seconds */
  codeExpiration: number;
  /** Window size for TOTP validation */
  windowSize: number;
  /** SMS provider for MFA */
  smsProvider: string;
  /** Whether email-based MFA is enabled */
  emailEnabled: boolean;
  /** Whether SMS-based MFA is enabled */
  smsEnabled: boolean;
  /** Whether TOTP-based MFA is enabled */
  totpEnabled: boolean;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  /** Database connection URL */
  url: string;
  /** Whether SSL is enabled for database connections */
  ssl: boolean;
  /** Maximum number of database connections */
  maxConnections: number;
  /** Idle timeout for database connections in milliseconds */
  idleTimeout: number;
}

/**
 * Session management configuration interface
 */
export interface SessionConfig {
  /** Maximum number of concurrent sessions per user */
  maxConcurrentSessions: number;
  /** Absolute timeout for sessions in seconds */
  absoluteTimeout: number;
  /** Inactivity timeout for sessions in seconds */
  inactivityTimeout: number;
  /** Extension time for "remember me" functionality in seconds */
  rememberMeExtension: number;
}

/**
 * Password policy configuration interface
 */
export interface PasswordConfig {
  /** Minimum password length */
  minLength: number;
  /** Whether uppercase letters are required */
  requireUppercase: boolean;
  /** Whether lowercase letters are required */
  requireLowercase: boolean;
  /** Whether numbers are required */
  requireNumber: boolean;
  /** Whether special characters are required */
  requireSpecialChar: boolean;
  /** Number of previous passwords to remember */
  history: number;
  /** Maximum password age in seconds */
  maxAge: number;
  /** Number of failed attempts before account lockout */
  lockoutThreshold: number;
  /** Duration of account lockout in seconds */
  lockoutDuration: number;
}

/**
 * Rate limiting configuration interface
 */
export interface RateLimitConfig {
  /** Time window for rate limiting in milliseconds */
  windowMs: number;
  /** Maximum number of requests per window */
  max: number;
}

/**
 * CORS configuration interface
 */
export interface CorsConfig {
  /** Allowed origins */
  origin: string[];
  /** Allowed HTTP methods */
  methods: string[];
  /** Whether credentials are allowed */
  credentials: boolean;
}

/**
 * Content Security Policy directives interface
 */
export interface CspDirectives {
  /** Default source directive */
  defaultSrc: string[];
  /** Script source directive */
  scriptSrc: string[];
  /** Style source directive */
  styleSrc: string[];
  /** Image source directive */
  imgSrc: string[];
  /** Connect source directive */
  connectSrc: string[];
  /** Font source directive */
  fontSrc: string[];
  /** Object source directive */
  objectSrc: string[];
  /** Frame source directive */
  frameSrc: string[];
  /** Base URI directive */
  baseUri: string[];
  /** Form action directive */
  formAction: string[];
}

/**
 * Content Security Policy configuration interface
 */
export interface ContentSecurityConfig {
  /** CSP directives */
  directives: CspDirectives;
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
  /** CORS configuration */
  cors: CorsConfig;
  /** Content Security Policy configuration */
  contentSecurity: ContentSecurityConfig;
}

/**
 * Logging configuration interface
 */
export interface LoggingConfig {
  /** Log level */
  level: string;
  /** Log format (json, pretty, etc.) */
  format: string;
  /** Whether to output logs to file */
  fileOutput: boolean;
  /** File path for log output */
  filePath: string;
}

/**
 * Monitoring configuration interface
 */
export interface MonitoringConfig {
  /** Whether monitoring is enabled */
  enabled: boolean;
  /** Path for metrics endpoint */
  metricsPath: string;
}

/**
 * Feature flags interface for the Auth Service
 * Controls which features are enabled/disabled
 */
export interface AuthFeatureFlags {
  /** Whether OAuth authentication is enabled */
  oauthEnabled: boolean;
  /** Whether MFA is enabled */
  mfaEnabled: boolean;
  /** Whether password policies are enforced */
  passwordPolicyEnabled: boolean;
  /** Whether session management features are enabled */
  sessionManagementEnabled: boolean;
  /** Whether rate limiting is enabled */
  rateLimitingEnabled: boolean;
  /** Whether content security policies are enforced */
  cspEnabled: boolean;
  /** Whether monitoring is enabled */
  monitoringEnabled: boolean;
}

/**
 * Environment-specific configuration interface
 * Allows for different configurations based on environment
 */
export interface EnvironmentConfig {
  /** Development environment configuration */
  development: Partial<AuthServiceConfig>;
  /** Staging environment configuration */
  staging: Partial<AuthServiceConfig>;
  /** Production environment configuration */
  production: Partial<AuthServiceConfig>;
}

/**
 * Main Auth Service configuration interface
 * Combines all configuration sections
 */
export interface AuthServiceConfig extends CommonConfigInterface {
  /** Server configuration */
  server: ServerConfig;
  /** JWT configuration */
  jwt: JwtConfig;
  /** OAuth configuration */
  oauth: OAuthConfig;
  /** MFA configuration */
  mfa: MfaConfig;
  /** Database configuration */
  database: DatabaseConfig;
  /** Session configuration */
  session: SessionConfig;
  /** Password configuration */
  password: PasswordConfig;
  /** Security configuration */
  security: SecurityConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Monitoring configuration */
  monitoring: MonitoringConfig;
  /** Feature flags */
  features?: AuthFeatureFlags;
  /** Environment-specific overrides */
  environments?: EnvironmentConfig;
}