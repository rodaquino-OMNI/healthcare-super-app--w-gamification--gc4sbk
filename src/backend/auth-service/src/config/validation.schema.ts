import * as Joi from 'joi';
import { AppException, ErrorType } from 'src/backend/packages/errors/src/journey/auth';

/**
 * Default port for the Auth Service if not specified in environment variables
 */
export const DEFAULT_PORT = 3001;

/**
 * Comprehensive validation schema for Auth Service configuration
 * Validates all environment variables at application startup
 * Throws detailed error messages for invalid configurations
 */
export class AuthServiceConfigValidation {
  /**
   * Joi validation schema for all Auth Service configuration parameters
   * Used by NestJS ConfigModule for environment validation
   */
  public static validationSchema = Joi.object({
    // Server configuration
    AUTH_SERVICE_PORT: Joi.number().port().default(DEFAULT_PORT)
      .description('Port number for the Auth Service HTTP server'),
    NODE_ENV: Joi.string().valid('development', 'production', 'test', 'staging').default('development')
      .description('Application environment'),
    AUTH_SERVICE_API_PREFIX: Joi.string().default('api/v1')
      .description('API route prefix for all Auth Service endpoints'),

    // JWT configuration
    JWT_SECRET: Joi.string().min(32).required()
      .description('Secret key for JWT token signing and verification'),
    JWT_ACCESS_EXPIRATION: Joi.string().pattern(/^\d+[smhd]$/).default('1h')
      .description('JWT access token expiration time (e.g., 1h, 30m)'),
    JWT_REFRESH_EXPIRATION: Joi.string().pattern(/^\d+[smhd]$/).default('7d')
      .description('JWT refresh token expiration time (e.g., 7d, 30d)'),
    JWT_ISSUER: Joi.string().default('austa.com.br')
      .description('Issuer claim for JWT tokens'),
    JWT_AUDIENCE: Joi.string().default('austa-users')
      .description('Audience claim for JWT tokens'),

    // OAuth configuration - Google
    GOOGLE_CLIENT_ID: Joi.string().when('GOOGLE_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Google OAuth client ID'),
    GOOGLE_CLIENT_SECRET: Joi.string().when('GOOGLE_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Google OAuth client secret'),
    GOOGLE_CALLBACK_URL: Joi.string().uri().when('GOOGLE_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Google OAuth callback URL'),
    GOOGLE_AUTH_ENABLED: Joi.boolean().default(false).description('Enable Google OAuth authentication'),

    // OAuth configuration - Facebook
    FACEBOOK_CLIENT_ID: Joi.string().when('FACEBOOK_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Facebook OAuth client ID'),
    FACEBOOK_CLIENT_SECRET: Joi.string().when('FACEBOOK_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Facebook OAuth client secret'),
    FACEBOOK_CALLBACK_URL: Joi.string().uri().when('FACEBOOK_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Facebook OAuth callback URL'),
    FACEBOOK_AUTH_ENABLED: Joi.boolean().default(false).description('Enable Facebook OAuth authentication'),

    // OAuth configuration - Apple
    APPLE_CLIENT_ID: Joi.string().when('APPLE_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Apple OAuth client ID'),
    APPLE_TEAM_ID: Joi.string().when('APPLE_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Apple developer team ID'),
    APPLE_KEY_ID: Joi.string().when('APPLE_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Apple key ID'),
    APPLE_PRIVATE_KEY: Joi.string().when('APPLE_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Apple private key for authentication'),
    APPLE_CALLBACK_URL: Joi.string().uri().when('APPLE_AUTH_ENABLED', {
      is: 'true',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).description('Apple OAuth callback URL'),
    APPLE_AUTH_ENABLED: Joi.boolean().default(false).description('Enable Apple OAuth authentication'),

    // Multi-factor authentication configuration
    MFA_ENABLED: Joi.boolean().default(false).description('Enable multi-factor authentication'),
    MFA_ISSUER: Joi.string().default('AUSTA SuperApp').description('Issuer name for MFA TOTP'),
    MFA_CODE_EXPIRATION: Joi.number().integer().min(60).max(900).default(300)
      .description('MFA verification code expiration time in seconds'),
    MFA_WINDOW_SIZE: Joi.number().integer().min(1).max(5).default(1)
      .description('Number of time steps to check for TOTP validation'),
    SMS_PROVIDER: Joi.string().valid('twilio', 'aws-sns').default('twilio')
      .description('SMS provider for MFA code delivery'),
    EMAIL_MFA_ENABLED: Joi.boolean().default(false).description('Enable email-based MFA'),
    SMS_MFA_ENABLED: Joi.boolean().default(false).description('Enable SMS-based MFA'),
    TOTP_MFA_ENABLED: Joi.boolean().default(false).description('Enable TOTP-based MFA'),

    // Database configuration
    AUTH_DATABASE_URL: Joi.string().required()
      .description('PostgreSQL connection string for Auth Service database'),
    DATABASE_SSL: Joi.boolean().default(false).description('Enable SSL for database connection'),
    DATABASE_MAX_CONNECTIONS: Joi.number().integer().min(1).max(100).default(20)
      .description('Maximum number of database connections'),
    DATABASE_IDLE_TIMEOUT: Joi.number().integer().min(1000).default(30000)
      .description('Database connection idle timeout in milliseconds'),

    // Session configuration
    MAX_CONCURRENT_SESSIONS: Joi.number().integer().min(1).max(20).default(5)
      .description('Maximum number of concurrent sessions per user'),
    SESSION_ABSOLUTE_TIMEOUT: Joi.number().integer().min(3600).max(86400).default(43200)
      .description('Absolute session timeout in seconds'),
    SESSION_INACTIVITY_TIMEOUT: Joi.number().integer().min(300).max(7200).default(1800)
      .description('Session inactivity timeout in seconds'),
    REMEMBER_ME_EXTENSION: Joi.number().integer().min(86400).max(7776000).default(2592000)
      .description('Session extension time when remember-me is enabled, in seconds'),

    // Password policy configuration
    PASSWORD_MIN_LENGTH: Joi.number().integer().min(8).max(128).default(10)
      .description('Minimum password length'),
    PASSWORD_REQUIRE_UPPERCASE: Joi.boolean().default(true)
      .description('Require at least one uppercase letter in passwords'),
    PASSWORD_REQUIRE_LOWERCASE: Joi.boolean().default(true)
      .description('Require at least one lowercase letter in passwords'),
    PASSWORD_REQUIRE_NUMBER: Joi.boolean().default(true)
      .description('Require at least one number in passwords'),
    PASSWORD_REQUIRE_SPECIAL: Joi.boolean().default(true)
      .description('Require at least one special character in passwords'),
    PASSWORD_HISTORY: Joi.number().integer().min(0).max(24).default(5)
      .description('Number of previous passwords to remember for preventing reuse'),
    PASSWORD_MAX_AGE: Joi.number().integer().min(0).max(31536000).default(7776000)
      .description('Maximum password age in seconds before requiring change'),
    PASSWORD_LOCKOUT_THRESHOLD: Joi.number().integer().min(1).max(10).default(5)
      .description('Number of failed login attempts before account lockout'),
    PASSWORD_LOCKOUT_DURATION: Joi.number().integer().min(60).max(86400).default(1800)
      .description('Account lockout duration in seconds after threshold is reached'),

    // Security configuration - Rate limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(60000).max(3600000).default(900000)
      .description('Rate limiting window in milliseconds'),
    RATE_LIMIT_MAX: Joi.number().integer().min(10).max(1000).default(100)
      .description('Maximum number of requests per IP within the rate limit window'),

    // Security configuration - CORS
    CORS_ORIGIN: Joi.string().default('http://localhost:3000')
      .description('Comma-separated list of allowed CORS origins'),
    CORS_METHODS: Joi.string().default('GET,POST,PUT,DELETE,PATCH')
      .description('Comma-separated list of allowed HTTP methods for CORS'),
    CORS_CREDENTIALS: Joi.boolean().default(false)
      .description('Allow credentials in CORS requests'),

    // Logging configuration
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info')
      .description('Logging level'),
    LOG_FORMAT: Joi.string().valid('json', 'pretty', 'simple').default('json')
      .description('Log output format'),
    LOG_FILE_OUTPUT: Joi.boolean().default(false).description('Enable logging to file'),
    LOG_FILE_PATH: Joi.string().when('LOG_FILE_OUTPUT', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).default('./logs/auth-service.log').description('Log file path'),

    // Monitoring configuration
    MONITORING_ENABLED: Joi.boolean().default(false).description('Enable monitoring metrics'),
    METRICS_PATH: Joi.string().default('/metrics').description('Path for exposing metrics'),
  });

  /**
   * Validation options for Joi schema
   * Configured to return all validation errors instead of stopping at the first one
   */
  public static validationOptions = {
    abortEarly: false, // Return all errors instead of stopping at the first one
    allowUnknown: true, // Allow unknown environment variables
    stripUnknown: true, // Remove unknown keys from the validated data
  };

  /**
   * Validates the provided environment configuration against the schema
   * @param config Configuration object to validate
   * @returns Validated configuration object
   * @throws AppException with detailed validation errors if validation fails
   */
  public static validate(config: Record<string, any>): Record<string, any> {
    const { error, value } = this.validationSchema.validate(config, this.validationOptions);
    
    if (error) {
      const errorMessage = `Configuration validation error: ${error.message}`;
      throw new AppException(ErrorType.AUTH_CONFIG_INVALID, errorMessage, error.details);
    }
    
    return value;
  }
}