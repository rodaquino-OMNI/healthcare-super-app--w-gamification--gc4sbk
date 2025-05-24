import { registerAs } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';

/**
 * Interface defining JWT configuration options
 */
export interface JwtConfigOptions {
  /**
   * Secret key used for signing JWT tokens
   * For symmetric algorithms (HS256, HS384, HS512)
   */
  secret?: string;
  
  /**
   * Public key used for verifying JWT tokens
   * For asymmetric algorithms (RS256, RS384, RS512, ES256, ES384, ES512)
   */
  publicKey?: string;
  
  /**
   * Private key used for signing JWT tokens
   * For asymmetric algorithms (RS256, RS384, RS512, ES256, ES384, ES512)
   */
  privateKey?: string;
  
  /**
   * Expiration time for access tokens
   * Short-lived tokens are recommended for security (e.g., '15m', '1h')
   */
  accessTokenExpiration: string;
  
  /**
   * Expiration time for refresh tokens
   * Longer-lived than access tokens (e.g., '7d', '30d')
   */
  refreshTokenExpiration: string;
  
  /**
   * Issuer of the JWT token
   * Identifies the principal that issued the JWT
   */
  issuer: string;
  
  /**
   * Audience for the JWT token
   * Identifies the recipients that the JWT is intended for
   */
  audience: string | string[];
  
  /**
   * Algorithm used for signing JWT tokens
   * HS256 is the default, but stronger algorithms are recommended for production
   */
  algorithm: Algorithm;
  
  /**
   * Whether to include issued at time in the token
   */
  includeIssueTime: boolean;
  
  /**
   * Whether to use HTTP-only cookies for token storage
   * Recommended for web applications to prevent XSS attacks
   */
  useHttpOnlyCookies: boolean;
  
  /**
   * Cookie configuration when useHttpOnlyCookies is true
   */
  cookieOptions?: {
    /**
     * Cookie domain
     */
    domain?: string;
    
    /**
     * Cookie path
     */
    path?: string;
    
    /**
     * Whether the cookie is secure (HTTPS only)
     */
    secure?: boolean;
    
    /**
     * Cookie same site policy
     */
    sameSite?: 'strict' | 'lax' | 'none';
  };
}

/**
 * Default JWT configuration values
 * These are sensible defaults for development, but should be overridden in production
 */
const defaultConfig: JwtConfigOptions = {
  secret: process.env.NODE_ENV === 'production' ? undefined : 'default-jwt-secret-do-not-use-in-production',
  accessTokenExpiration: '15m',
  refreshTokenExpiration: '7d',
  issuer: 'austa-superapp',
  audience: 'austa-users',
  algorithm: 'HS256',
  includeIssueTime: true,
  useHttpOnlyCookies: false,
  cookieOptions: {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
};

/**
 * Validates the JWT configuration to ensure it has the required properties
 * based on the selected algorithm
 * 
 * @param config JWT configuration to validate
 * @throws Error if the configuration is invalid
 */
const validateJwtConfig = (config: JwtConfigOptions): void => {
  const isAsymmetric = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'].includes(config.algorithm);
  const isSymmetric = ['HS256', 'HS384', 'HS512'].includes(config.algorithm);
  
  if (isAsymmetric && (!config.privateKey || !config.publicKey)) {
    throw new Error(`JWT configuration error: ${config.algorithm} requires both privateKey and publicKey`);
  }
  
  if (isSymmetric && !config.secret) {
    throw new Error(`JWT configuration error: ${config.algorithm} requires a secret`);
  }
  
  if (process.env.NODE_ENV === 'production' && isSymmetric && config.secret === defaultConfig.secret) {
    throw new Error('JWT configuration error: Using default secret in production environment');
  }
};

/**
 * Registers JWT configuration with NestJS config system
 * 
 * @returns JWT configuration factory function
 */
export const jwtConfig = registerAs('jwt', (): JwtConfigOptions => {
  // Get environment variables with fallbacks to default values
  const config = {
    secret: process.env.JWT_SECRET || defaultConfig.secret,
    publicKey: process.env.JWT_PUBLIC_KEY || defaultConfig.publicKey,
    privateKey: process.env.JWT_PRIVATE_KEY || defaultConfig.privateKey,
    accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || defaultConfig.accessTokenExpiration,
    refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION || defaultConfig.refreshTokenExpiration,
    issuer: process.env.JWT_ISSUER || defaultConfig.issuer,
    audience: process.env.JWT_AUDIENCE || defaultConfig.audience,
    algorithm: (process.env.JWT_ALGORITHM || defaultConfig.algorithm) as Algorithm,
    includeIssueTime: process.env.JWT_INCLUDE_ISSUE_TIME ? 
      process.env.JWT_INCLUDE_ISSUE_TIME.toLowerCase() === 'true' : 
      defaultConfig.includeIssueTime,
    useHttpOnlyCookies: process.env.JWT_USE_HTTP_ONLY_COOKIES ? 
      process.env.JWT_USE_HTTP_ONLY_COOKIES.toLowerCase() === 'true' : 
      defaultConfig.useHttpOnlyCookies,
    cookieOptions: {
      domain: process.env.JWT_COOKIE_DOMAIN || defaultConfig.cookieOptions?.domain,
      path: process.env.JWT_COOKIE_PATH || defaultConfig.cookieOptions?.path,
      secure: process.env.JWT_COOKIE_SECURE ? 
        process.env.JWT_COOKIE_SECURE.toLowerCase() === 'true' : 
        defaultConfig.cookieOptions?.secure,
      sameSite: (process.env.JWT_COOKIE_SAME_SITE || defaultConfig.cookieOptions?.sameSite) as 'strict' | 'lax' | 'none',
    },
  };
  
  // Validate the configuration
  validateJwtConfig(config);
  
  return config;
});

/**
 * Helper function to get JWT sign options for NestJS JwtModule
 * 
 * @param config JWT configuration options
 * @returns JWT sign options for NestJS JwtModule
 */
export const getJwtSignOptions = (config: JwtConfigOptions) => {
  const isAsymmetric = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'].includes(config.algorithm);
  
  return {
    ...(isAsymmetric ? {
      privateKey: config.privateKey,
      publicKey: config.publicKey,
    } : {
      secret: config.secret,
    }),
    signOptions: {
      expiresIn: config.accessTokenExpiration,
      issuer: config.issuer,
      audience: config.audience,
      algorithm: config.algorithm,
      ...(config.includeIssueTime ? { iat: Math.floor(Date.now() / 1000) } : {}),
    },
  };
};

/**
 * Helper function to get JWT module async options for NestJS JwtModule
 * 
 * @param configFactory Optional custom config factory function
 * @returns Async options for JwtModule.registerAsync
 */
export const getJwtModuleOptions = (configFactory?: () => Promise<JwtConfigOptions> | JwtConfigOptions) => {
  return {
    imports: [],
    useFactory: async () => {
      const config = configFactory ? await configFactory() : jwtConfig();
      return getJwtSignOptions(config);
    },
    inject: [],
  };
};

/**
 * Helper function to get journey-specific JWT configuration
 * 
 * @param journeyName Name of the journey (health, care, plan)
 * @returns Journey-specific JWT configuration
 */
export const getJourneyJwtConfig = (journeyName: 'health' | 'care' | 'plan'): JwtConfigOptions => {
  const baseConfig = jwtConfig();
  const journeyPrefix = journeyName.toUpperCase();
  
  // Get journey-specific environment variables with fallbacks to base config
  const config = {
    ...baseConfig,
    issuer: process.env[`JWT_${journeyPrefix}_ISSUER`] || `austa-${journeyName}-journey`,
    audience: process.env[`JWT_${journeyPrefix}_AUDIENCE`] || baseConfig.audience,
    accessTokenExpiration: process.env[`JWT_${journeyPrefix}_ACCESS_TOKEN_EXPIRATION`] || baseConfig.accessTokenExpiration,
    refreshTokenExpiration: process.env[`JWT_${journeyPrefix}_REFRESH_TOKEN_EXPIRATION`] || baseConfig.refreshTokenExpiration,
    algorithm: (process.env[`JWT_${journeyPrefix}_ALGORITHM`] || baseConfig.algorithm) as Algorithm,
  };
  
  // Validate the journey-specific configuration
  validateJwtConfig(config);
  
  return config;
};

/**
 * Helper function to create a refresh token configuration based on the access token configuration
 * 
 * @param config Base JWT configuration
 * @returns JWT configuration for refresh tokens
 */
export const getRefreshTokenConfig = (config: JwtConfigOptions): JwtConfigOptions => {
  return {
    ...config,
    accessTokenExpiration: config.refreshTokenExpiration,
    audience: Array.isArray(config.audience) 
      ? [...config.audience, 'refresh']
      : [config.audience, 'refresh'],
  };
};