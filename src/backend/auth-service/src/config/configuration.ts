import { registerAs, ConfigType } from '@nestjs/config';
import { AuthServiceConfigValidation } from '@app/auth/config/validation.schema';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';
import { AppException, ErrorType } from '@austa/interfaces/auth/errors';

/**
 * Configuration interfaces for Auth Service
 * These interfaces define the structure of the configuration object
 * and provide type safety for accessing configuration values
 */

/**
 * Server configuration interface
 */
export interface ServerConfig {
  /** Port number for the Auth Service HTTP server */
  port: number;
  /** Application environment (development, production, test, staging) */
  environment: string;
  /** API route prefix for all Auth Service endpoints */
  apiPrefix: string;
  /** Host address for the server to bind to */
  host?: string;
}

/**
 * JWT configuration interface
 */
export interface JwtConfig {
  /** Secret key for JWT token signing and verification */
  secret: string;
  /** JWT access token expiration time (e.g., 1h, 30m) */
  accessTokenExpiration: string;
  /** JWT refresh token expiration time (e.g., 7d, 30d) */
  refreshTokenExpiration: string;
  /** Issuer claim for JWT tokens */
  issuer: string;
  /** Audience claim for JWT tokens */
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
 * Apple OAuth provider configuration interface
 * Extends the base OAuth provider config with Apple-specific fields
 */
export interface AppleOAuthConfig extends OAuthProviderConfig {
  /** Apple developer team ID */
  teamId: string;
  /** Apple key ID */
  keyId: string;
  /** Apple private key for authentication */
  privateKey: string;
}

/**
 * OAuth configuration interface
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
  /** Whether multi-factor authentication is enabled */
  enabled: boolean;
  /** Issuer name for MFA TOTP */
  issuer: string;
  /** MFA verification code expiration time in seconds */
  codeExpiration: number;
  /** Number of time steps to check for TOTP validation */
  windowSize: number;
  /** SMS provider for MFA code delivery */
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
  /** PostgreSQL connection string for Auth Service database */
  url: string;
  /** Whether to enable SSL for database connection */
  ssl: boolean;
  /** Maximum number of database connections */
  maxConnections: number;
  /** Database connection idle timeout in milliseconds */
  idleTimeout: number;
}

/**
 * Session configuration interface
 */
export interface SessionConfig {
  /** Maximum number of concurrent sessions per user */
  maxConcurrentSessions: number;
  /** Absolute session timeout in seconds */
  absoluteTimeout: number;
  /** Session inactivity timeout in seconds */
  inactivityTimeout: number;
  /** Session extension time when remember-me is enabled, in seconds */
  rememberMeExtension: number;
}

/**
 * Password policy configuration interface
 */
export interface PasswordConfig {
  /** Minimum password length */
  minLength: number;
  /** Whether to require at least one uppercase letter in passwords */
  requireUppercase: boolean;
  /** Whether to require at least one lowercase letter in passwords */
  requireLowercase: boolean;
  /** Whether to require at least one number in passwords */
  requireNumber: boolean;
  /** Whether to require at least one special character in passwords */
  requireSpecialChar: boolean;
  /** Number of previous passwords to remember for preventing reuse */
  history: number;
  /** Maximum password age in seconds before requiring change */
  maxAge: number;
  /** Number of failed login attempts before account lockout */
  lockoutThreshold: number;
  /** Account lockout duration in seconds after threshold is reached */
  lockoutDuration: number;
}

/**
 * Rate limiting configuration interface
 */
export interface RateLimitConfig {
  /** Rate limiting window in milliseconds */
  windowMs: number;
  /** Maximum number of requests per IP within the rate limit window */
  max: number;
}

/**
 * CORS configuration interface
 */
export interface CorsConfig {
  /** Allowed CORS origins */
  origin: string[];
  /** Allowed HTTP methods for CORS */
  methods: string[];
  /** Whether to allow credentials in CORS requests */
  credentials: boolean;
}

/**
 * Content security policy directives interface
 */
export interface ContentSecurityDirectives {
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
 * Content security policy configuration interface
 */
export interface ContentSecurityConfig {
  /** Content security policy directives */
  directives: ContentSecurityDirectives;
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
  /** CORS configuration */
  cors: CorsConfig;
  /** Content security policy configuration */
  contentSecurity: ContentSecurityConfig;
}

/**
 * Logging configuration interface
 */
export interface LoggingConfig {
  /** Logging level */
  level: string;
  /** Log output format */
  format: string;
  /** Whether to enable logging to file */
  fileOutput: boolean;
  /** Log file path */
  filePath: string;
}

/**
 * Monitoring configuration interface
 */
export interface MonitoringConfig {
  /** Whether to enable monitoring metrics */
  enabled: boolean;
  /** Path for exposing metrics */
  metricsPath: string;
}

/**
 * Complete Auth Service configuration interface
 */
export interface AuthServiceConfigInterface {
  /** Server configuration */
  server: ServerConfig;
  /** JWT configuration */
  jwt: JwtConfig;
  /** OAuth configuration */
  oauth: OAuthConfig;
  /** Multi-factor authentication configuration */
  mfa: MfaConfig;
  /** Database configuration */
  database: DatabaseConfig;
  /** Session configuration */
  session: SessionConfig;
  /** Password policy configuration */
  password: PasswordConfig;
  /** Security configuration */
  security: SecurityConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Monitoring configuration */
  monitoring: MonitoringConfig;
}

/**
 * Environment-specific configuration overrides
 * @param env The current environment
 * @param config The base configuration
 * @returns The configuration with environment-specific overrides applied
 */
const applyEnvironmentOverrides = (env: string, config: AuthServiceConfigInterface): AuthServiceConfigInterface => {
  // Apply environment-specific overrides
  switch (env) {
    case 'production':
      return {
        ...config,
        logging: {
          ...config.logging,
          level: 'info',
          fileOutput: true,
        },
        security: {
          ...config.security,
          cors: {
            ...config.security.cors,
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://app.austa.com.br'],
          },
        },
      };
    case 'staging':
      return {
        ...config,
        logging: {
          ...config.logging,
          level: 'debug',
          fileOutput: true,
        },
      };
    case 'test':
      return {
        ...config,
        database: {
          ...config.database,
          url: process.env.AUTH_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_test',
        },
        logging: {
          ...config.logging,
          level: 'error',
        },
      };
    default: // development
      return config;
  }
};

/**
 * Configuration for the Auth Service
 * Defines all settings related to authentication, authorization, and security
 * 
 * This configuration supports the core authentication functionality described in F-201
 * and addresses security implications outlined in Technical Specifications/2.4.4
 */
const configuration = registerAs('authService', (): AuthServiceConfigInterface => {
  // Create base configuration
  const baseConfig: AuthServiceConfigInterface = {
    server: {
      port: parseInt(process.env.AUTH_SERVICE_PORT, 10) || 3001,
      environment: process.env.NODE_ENV || 'development',
      apiPrefix: process.env.AUTH_SERVICE_API_PREFIX || 'api/v1',
      host: process.env.AUTH_SERVICE_HOST || '0.0.0.0',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'supersecretkeythatshouldbechangedinproduction',
      accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '1h', // 1 hour
      refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d', // 7 days
      issuer: process.env.JWT_ISSUER || 'austa.com.br',
      audience: process.env.JWT_AUDIENCE || 'austa-users',
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
        enabled: process.env.GOOGLE_AUTH_ENABLED === 'true',
      },
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID || '',
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
        callbackUrl: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/facebook/callback',
        enabled: process.env.FACEBOOK_AUTH_ENABLED === 'true',
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID || '',
        clientSecret: process.env.APPLE_CLIENT_SECRET || '',
        teamId: process.env.APPLE_TEAM_ID || '',
        keyId: process.env.APPLE_KEY_ID || '',
        privateKey: process.env.APPLE_PRIVATE_KEY || '',
        callbackUrl: process.env.APPLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/apple/callback',
        enabled: process.env.APPLE_AUTH_ENABLED === 'true',
      },
    },
    mfa: {
      enabled: process.env.MFA_ENABLED === 'true',
      issuer: process.env.MFA_ISSUER || 'AUSTA SuperApp',
      codeExpiration: parseInt(process.env.MFA_CODE_EXPIRATION, 10) || 300, // 5 minutes in seconds
      windowSize: parseInt(process.env.MFA_WINDOW_SIZE, 10) || 1, // Number of time steps to check
      smsProvider: process.env.SMS_PROVIDER || 'twilio',
      emailEnabled: process.env.EMAIL_MFA_ENABLED === 'true',
      smsEnabled: process.env.SMS_MFA_ENABLED === 'true',
      totpEnabled: process.env.TOTP_MFA_ENABLED === 'true',
    },
    database: {
      url: process.env.AUTH_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth',
      ssl: process.env.DATABASE_SSL === 'true',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10) || 20,
      idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT, 10) || 30000, // 30 seconds
    },
    session: {
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS, 10) || 5,
      absoluteTimeout: parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT, 10) || 43200, // 12 hours in seconds
      inactivityTimeout: parseInt(process.env.SESSION_INACTIVITY_TIMEOUT, 10) || 1800, // 30 minutes in seconds
      rememberMeExtension: parseInt(process.env.REMEMBER_ME_EXTENSION, 10) || 2592000, // 30 days in seconds
    },
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 10,
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false', // Default to true
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false', // Default to true
      requireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false', // Default to true
      requireSpecialChar: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false', // Default to true
      history: parseInt(process.env.PASSWORD_HISTORY, 10) || 5, // Remember last 5 passwords
      maxAge: parseInt(process.env.PASSWORD_MAX_AGE, 10) || 7776000, // 90 days in seconds
      lockoutThreshold: parseInt(process.env.PASSWORD_LOCKOUT_THRESHOLD, 10) || 5, // 5 failed attempts
      lockoutDuration: parseInt(process.env.PASSWORD_LOCKOUT_DURATION, 10) || 1800, // 30 minutes in seconds
    },
    security: {
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
      },
      cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
        methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: process.env.CORS_CREDENTIALS === 'true',
      },
      contentSecurity: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
      fileOutput: process.env.LOG_FILE_OUTPUT === 'true',
      filePath: process.env.LOG_FILE_PATH || './logs/auth-service.log',
    },
    monitoring: {
      enabled: process.env.MONITORING_ENABLED === 'true',
      metricsPath: process.env.METRICS_PATH || '/metrics',
    },
  };

  try {
    // Validate configuration against schema
    const validatedEnvConfig = AuthServiceConfigValidation.validate(process.env);
    
    // Apply environment-specific overrides
    const environment = baseConfig.server.environment;
    const configWithOverrides = applyEnvironmentOverrides(environment, baseConfig);
    
    return configWithOverrides;
  } catch (error) {
    // Handle validation errors
    if (error instanceof AppException) {
      throw error;
    }
    
    throw new AppException(
      ErrorType.AUTH_CONFIG_INVALID,
      `Failed to load Auth Service configuration: ${error.message}`,
      error
    );
  }
});

export type AuthServiceConfig = ConfigType<typeof configuration>;

export default configuration;
export { configuration };