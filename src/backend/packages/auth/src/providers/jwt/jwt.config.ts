import { registerAs } from '@nestjs/config';

/**
 * Interface defining all JWT configuration options used across the AUSTA SuperApp.
 * This provides a standardized structure for JWT settings to ensure consistent
 * token generation and validation across all services.
 */
export interface JwtConfigOptions {
  /**
   * Secret key used to sign JWT tokens.
   * Should be a strong, unique value in production environments.
   */
  secret: string;

  /**
   * Duration for which access tokens are valid.
   * Expressed as a string in the format accepted by the jsonwebtoken library.
   * Examples: '1h', '30m', '1d'
   */
  accessTokenExpiration: string;

  /**
   * Duration for which refresh tokens are valid.
   * Typically longer than access tokens to reduce authentication frequency.
   * Examples: '7d', '30d', '60d'
   */
  refreshTokenExpiration: string;

  /**
   * Entity that issued the JWT token.
   * Typically the domain name of the application.
   */
  issuer: string;

  /**
   * Intended recipient of the JWT token.
   * Used to prevent token use by unintended services.
   */
  audience: string;

  /**
   * Algorithms allowed for token verification.
   * Default is HS256 which uses the secret key for both signing and verification.
   */
  algorithms?: string[];

  /**
   * Whether to ignore token expiration during validation.
   * Should be false in production environments.
   */
  ignoreExpiration?: boolean;

  /**
   * Tolerance for clock skew in seconds.
   * Allows for small time differences between servers.
   */
  clockTolerance?: number;

  /**
   * Whether to include the JWT ID claim in the token.
   * Useful for token revocation strategies.
   */
  includeJwtId?: boolean;

  /**
   * Journey-specific configuration overrides.
   * Allows for different JWT settings per journey if needed.
   */
  journeyOverrides?: {
    health?: Partial<JwtConfigOptions>;
    care?: Partial<JwtConfigOptions>;
    plan?: Partial<JwtConfigOptions>;
  };
}

/**
 * Factory function that creates JWT configuration based on environment variables.
 * Provides sensible defaults for all options while allowing environment-specific overrides.
 * 
 * @returns Complete JWT configuration with all required options
 */
export const createJwtConfig = (): JwtConfigOptions => {
  return {
    secret: process.env.JWT_SECRET || 'supersecretkeythatshouldbechangedinproduction',
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '1h', // 1 hour
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d', // 7 days
    issuer: process.env.JWT_ISSUER || 'austa.com.br',
    audience: process.env.JWT_AUDIENCE || 'austa-users',
    algorithms: process.env.JWT_ALGORITHMS ? 
      process.env.JWT_ALGORITHMS.split(',') : 
      ['HS256'],
    ignoreExpiration: process.env.JWT_IGNORE_EXPIRATION === 'true' ? true : false,
    clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE || '0', 10),
    includeJwtId: process.env.JWT_INCLUDE_JWT_ID === 'true' ? true : false,
    // Journey-specific overrides can be added here if needed
    journeyOverrides: {
      // Example: Different token expiration for health journey
      health: process.env.HEALTH_JWT_ACCESS_EXPIRATION ? {
        accessTokenExpiration: process.env.HEALTH_JWT_ACCESS_EXPIRATION
      } : undefined,
      care: process.env.CARE_JWT_ACCESS_EXPIRATION ? {
        accessTokenExpiration: process.env.CARE_JWT_ACCESS_EXPIRATION
      } : undefined,
      plan: process.env.PLAN_JWT_ACCESS_EXPIRATION ? {
        accessTokenExpiration: process.env.PLAN_JWT_ACCESS_EXPIRATION
      } : undefined,
    }
  };
};

/**
 * NestJS configuration provider for JWT settings.
 * Registers JWT configuration under the 'jwt' namespace for use with ConfigService.
 * 
 * Usage:
 * ```typescript
 * // In your module
 * imports: [
 *   ConfigModule.forFeature(jwtConfig),
 *   JwtModule.registerAsync({
 *     imports: [ConfigModule],
 *     useFactory: (configService: ConfigService) => ({
 *       secret: configService.get<string>('jwt.secret'),
 *       signOptions: {
 *         expiresIn: configService.get<string>('jwt.accessTokenExpiration'),
 *         issuer: configService.get<string>('jwt.issuer'),
 *         audience: configService.get<string>('jwt.audience'),
 *       },
 *     }),
 *     inject: [ConfigService],
 *   }),
 * ]
 * ```
 */
export const jwtConfig = registerAs('jwt', createJwtConfig);

/**
 * Helper function to get journey-specific JWT configuration.
 * Falls back to default configuration if no journey-specific override exists.
 * 
 * @param journeyType The journey type ('health', 'care', or 'plan')
 * @param config The base JWT configuration
 * @returns JWT configuration with journey-specific overrides applied
 */
export const getJourneyJwtConfig = (
  journeyType: 'health' | 'care' | 'plan',
  config: JwtConfigOptions
): JwtConfigOptions => {
  if (!config.journeyOverrides || !config.journeyOverrides[journeyType]) {
    return config;
  }

  return {
    ...config,
    ...config.journeyOverrides[journeyType],
  };
};

export default jwtConfig;