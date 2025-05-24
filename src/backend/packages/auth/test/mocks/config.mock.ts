import { Algorithm } from 'jsonwebtoken';
import { OAuthProviderType } from '../../src/providers/oauth/interfaces';

/**
 * Mock implementation of the ConfigService for testing auth package components
 * Provides predefined configuration values without depending on environment variables
 */
export class ConfigServiceMock {
  private config: Record<string, any> = {
    // JWT Configuration
    jwt: {
      secret: 'test-jwt-secret',
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo\n4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u\n+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyeh\nkd3qqGElvW/VDL5AaWTg0nLVkjRo9z+40RQzuVaE8AkAFmxZzow3x+VJYKdjykkJ\n0iT9wCS0DRTXu269V264Vf/3jvredZiKRkgwlL9xNAwxXFg0x/XFw005UWVRIkdg\ncKWTjpBP2dPwVZ4WWC+9aGVd+Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbc\nmwIDAQAB\n-----END PUBLIC KEY-----',
      privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu\nNMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ\nqgtzJ6GR3eqoYSW9b9UMvkBpZODSctWSNGj3P7jRFDO5VoTwCQAWbFnOjDfH5Ulg\np2PKSQnSJP3AJLQNFNe7br1XbrhV//eO+t51mIpGSDCUv3E0DDFcWDTH9cXDTTlR\nZVEiR2BwpZOOkE/Z0/BVnhZYL71oZV34bKfWjQIt6V/isSMahdsAASACp4ZTGtwi\nVuNd9tybAgMBAAECggEBAKTmjaS6tkK8BlPXClTQ2vpz/N6uxDeS35mXpqasqskV\nlaAidgg/sWqpjXDbXr93otIMLlWsM+X0CqMDgSXKejLS2jx4GDjI1ZTXg++0AMJ8\nsJ74pWzVDOfmCEQ/7wXs3+cbnXhKriO8Z036q92Qc1+N87SI38nkGa0ABH9CN83H\nmQqt4fB7UdHzuIRe/me2PGhIq5ZBzj6h3BpoPGzEP+x3l9YmK8t/1cN0pqI+dQwY\ndgfGjackLu/2qH80MCF7IyQaseZUOJyKrCLtSD/Iixv/hzDEUPfOCjFDgTpzf3cw\nta8+oE4wHCo1iI1/4TlPkwmXx4qSXtmw4aQPz7IDQvECgYEA8KNThCO2gsC2I9PQ\nDM/8Cw0O983WCDY+oi+7JPiNAJwv5DYBqEZB1QYdj06YD16XlC/HAZMsMku1na2T\nN0driwenQQWzoev3g2S7gRDoS/FCJSI3jJ+kjgtaA7Qmzlgk1TxODN+G1H91HW7t\n0l7VnL27IWyYo2qRRK3jzxqUiPUCgYEAx0oQs2reBQGMVZnApD1jeq7n4MvNLcPv\nt8b/eU9iUv6Y4Mj0Suo/AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDU\nAhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn//LiH1B3rXhcdyo3/vIttEk\n48RakUKClU8CgYEAzV7W3COOlDDcQd935DdtKBFRAPRPAlspQUnzMi5eSHMD/ISL\nDY5IiQHbIH83D4bvXq0X7qQoSBSNP7Dvv3HYuqMhf0DaegrlBuJllFVVq9qPVRnK\nxt1Il2HgxOBvbhOT+9in1BzA+YJ99UzC85O0Qz06A+CmtHEy4aZ2kj5hHjECgYEA\nmNS4+A8Fkss8Js1RieK2LniBxMgmYml3pfVLKGnzmng7H2+cwPLhPIzIuwytXywh\n2bzbsYEfYx3EoEVgMEpPhoarQnYPukrJO4gwE2o5Te6T5mJSZGlQJQj9q4ZB2Dfz\net6INsK0oG8XVGXSpQvQh3RUYekCZQkBBFcpqWpbIEsCgYAnM3DQf3FJoSnXaMhr\nVBIovic5l0xFkEHskAjFTevO86Fsz1C2aSeRKSqGFoOQ0tmJzBEs1R6KqnHInicD\nTQrKhArgLXX4v3CddjfTRJkFWDbE/CkvKZNOrcf1nhaGCPspRJj2KUkj1Fhl9Cnc\ndn/RsYEONbwQSjIfMPkvxF+8HQ==\n-----END PRIVATE KEY-----',
      accessTokenExpiration: '15m',
      refreshTokenExpiration: '7d',
      issuer: 'test-issuer',
      audience: 'test-audience',
      algorithm: 'RS256' as Algorithm,
      includeIssueTime: true,
      useHttpOnlyCookies: false,
      cookieOptions: {
        domain: 'localhost',
        path: '/',
        secure: false,
        sameSite: 'lax' as 'strict' | 'lax' | 'none',
      },
    },
    
    // OAuth Configuration
    oauth: {
      // Google OAuth Configuration
      google: {
        clientID: 'test-google-client-id',
        clientSecret: 'test-google-client-secret',
        callbackURL: 'http://localhost:3000/auth/google/callback',
        scope: ['profile', 'email'],
        includeGrantedScopes: true,
        hostedDomain: '',
        includeProfile: true,
      },
      
      // Facebook OAuth Configuration
      facebook: {
        clientID: 'test-facebook-client-id',
        clientSecret: 'test-facebook-client-secret',
        callbackURL: 'http://localhost:3000/auth/facebook/callback',
        scope: ['email', 'public_profile'],
        profileFields: ['id', 'displayName', 'photos', 'email'],
        enableProof: true,
      },
      
      // Apple OAuth Configuration
      apple: {
        clientID: 'test.apple.client.id',
        clientSecret: 'test-apple-client-secret',
        callbackURL: 'http://localhost:3000/auth/apple/callback',
        scope: ['name', 'email'],
        teamID: 'test-team-id',
        keyID: 'test-key-id',
        privateKeyLocation: './test-private-key.p8',
      },
    },
    
    // Auth Service Configuration
    auth: {
      // Password policy
      password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxHistory: 5,
      },
      
      // Multi-factor authentication
      mfa: {
        enabled: true,
        issuer: 'AUSTA SuperApp',
        codeLength: 6,
        validityDuration: 300, // seconds
        maxAttempts: 3,
      },
      
      // Session configuration
      session: {
        maxConcurrentSessions: 5,
        inactivityTimeout: 30, // minutes
        absoluteTimeout: 24, // hours
      },
      
      // Rate limiting
      rateLimit: {
        loginAttempts: 5,
        loginWindow: 15, // minutes
        passwordResetAttempts: 3,
        passwordResetWindow: 60, // minutes
      },
    },
    
    // Journey-specific auth configuration
    journeys: {
      health: {
        requiredRoles: ['user', 'health_user'],
        defaultPermissions: ['health:read', 'health:write'],
        jwtIssuer: 'austa-health-journey',
      },
      care: {
        requiredRoles: ['user', 'care_user'],
        defaultPermissions: ['care:read', 'care:write'],
        jwtIssuer: 'austa-care-journey',
      },
      plan: {
        requiredRoles: ['user', 'plan_user'],
        defaultPermissions: ['plan:read', 'plan:write'],
        jwtIssuer: 'austa-plan-journey',
      },
    },
  };

  /**
   * Constructor that allows overriding default configuration values
   * @param overrides Optional configuration overrides for testing specific scenarios
   */
  constructor(overrides: Record<string, any> = {}) {
    this.config = this.mergeDeep(this.config, overrides);
  }

  /**
   * Gets a configuration value by key
   * @param key Configuration key in dot notation (e.g., 'jwt.secret')
   * @returns The configuration value or undefined if not found
   */
  get<T = any>(key: string): T {
    return this.getValueByPath(this.config, key);
  }

  /**
   * Gets a required configuration value by key
   * Throws an error if the configuration value is not found
   * @param key Configuration key in dot notation (e.g., 'jwt.secret')
   * @returns The configuration value
   * @throws Error if the configuration value is not found
   */
  getOrThrow<T = any>(key: string): T {
    const value = this.getValueByPath(this.config, key);
    if (value === undefined) {
      throw new Error(`Configuration key '${key}' not found`);
    }
    return value;
  }

  /**
   * Gets JWT configuration for a specific journey
   * @param journeyName Name of the journey (health, care, plan)
   * @returns Journey-specific JWT configuration
   */
  getJourneyJwtConfig(journeyName: 'health' | 'care' | 'plan') {
    const baseConfig = this.get<Record<string, any>>('jwt');
    const journeyConfig = this.get<Record<string, any>>(`journeys.${journeyName}`);
    
    return {
      ...baseConfig,
      issuer: journeyConfig.jwtIssuer || `austa-${journeyName}-journey`,
    };
  }

  /**
   * Gets OAuth configuration for a specific provider
   * @param provider OAuth provider type
   * @returns Provider-specific OAuth configuration
   */
  getOAuthConfig(provider: OAuthProviderType) {
    return this.get<Record<string, any>>(`oauth.${provider}`);
  }

  /**
   * Updates configuration values for testing specific scenarios
   * @param updates Configuration updates in the same structure as the original config
   */
  updateConfig(updates: Record<string, any>) {
    this.config = this.mergeDeep(this.config, updates);
  }

  /**
   * Resets configuration to default values
   */
  resetConfig() {
    this.config = {
      jwt: {
        secret: 'test-jwt-secret',
        publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo\n4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u\n+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyeh\nkd3qqGElvW/VDL5AaWTg0nLVkjRo9z+40RQzuVaE8AkAFmxZzow3x+VJYKdjykkJ\n0iT9wCS0DRTXu269V264Vf/3jvredZiKRkgwlL9xNAwxXFg0x/XFw005UWVRIkdg\ncKWTjpBP2dPwVZ4WWC+9aGVd+Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbc\nmwIDAQAB\n-----END PUBLIC KEY-----',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu\nNMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ\nqgtzJ6GR3eqoYSW9b9UMvkBpZODSctWSNGj3P7jRFDO5VoTwCQAWbFnOjDfH5Ulg\np2PKSQnSJP3AJLQNFNe7br1XbrhV//eO+t51mIpGSDCUv3E0DDFcWDTH9cXDTTlR\nZVEiR2BwpZOOkE/Z0/BVnhZYL71oZV34bKfWjQIt6V/isSMahdsAASACp4ZTGtwi\nVuNd9tybAgMBAAECggEBAKTmjaS6tkK8BlPXClTQ2vpz/N6uxDeS35mXpqasqskV\nlaAidgg/sWqpjXDbXr93otIMLlWsM+X0CqMDgSXKejLS2jx4GDjI1ZTXg++0AMJ8\nsJ74pWzVDOfmCEQ/7wXs3+cbnXhKriO8Z036q92Qc1+N87SI38nkGa0ABH9CN83H\nmQqt4fB7UdHzuIRe/me2PGhIq5ZBzj6h3BpoPGzEP+x3l9YmK8t/1cN0pqI+dQwY\ndgfGjackLu/2qH80MCF7IyQaseZUOJyKrCLtSD/Iixv/hzDEUPfOCjFDgTpzf3cw\nta8+oE4wHCo1iI1/4TlPkwmXx4qSXtmw4aQPz7IDQvECgYEA8KNThCO2gsC2I9PQ\nDM/8Cw0O983WCDY+oi+7JPiNAJwv5DYBqEZB1QYdj06YD16XlC/HAZMsMku1na2T\nN0driwenQQWzoev3g2S7gRDoS/FCJSI3jJ+kjgtaA7Qmzlgk1TxODN+G1H91HW7t\n0l7VnL27IWyYo2qRRK3jzxqUiPUCgYEAx0oQs2reBQGMVZnApD1jeq7n4MvNLcPv\nt8b/eU9iUv6Y4Mj0Suo/AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDU\nAhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn//LiH1B3rXhcdyo3/vIttEk\n48RakUKClU8CgYEAzV7W3COOlDDcQd935DdtKBFRAPRPAlspQUnzMi5eSHMD/ISL\nDY5IiQHbIH83D4bvXq0X7qQoSBSNP7Dvv3HYuqMhf0DaegrlBuJllFVVq9qPVRnK\nxt1Il2HgxOBvbhOT+9in1BzA+YJ99UzC85O0Qz06A+CmtHEy4aZ2kj5hHjECgYEA\nmNS4+A8Fkss8Js1RieK2LniBxMgmYml3pfVLKGnzmng7H2+cwPLhPIzIuwytXywh\n2bzbsYEfYx3EoEVgMEpPhoarQnYPukrJO4gwE2o5Te6T5mJSZGlQJQj9q4ZB2Dfz\net6INsK0oG8XVGXSpQvQh3RUYekCZQkBBFcpqWpbIEsCgYAnM3DQf3FJoSnXaMhr\nVBIovic5l0xFkEHskAjFTevO86Fsz1C2aSeRKSqGFoOQ0tmJzBEs1R6KqnHInicD\nTQrKhArgLXX4v3CddjfTRJkFWDbE/CkvKZNOrcf1nhaGCPspRJj2KUkj1Fhl9Cnc\ndn/RsYEONbwQSjIfMPkvxF+8HQ==\n-----END PRIVATE KEY-----',
        accessTokenExpiration: '15m',
        refreshTokenExpiration: '7d',
        issuer: 'test-issuer',
        audience: 'test-audience',
        algorithm: 'RS256' as Algorithm,
        includeIssueTime: true,
        useHttpOnlyCookies: false,
        cookieOptions: {
          domain: 'localhost',
          path: '/',
          secure: false,
          sameSite: 'lax' as 'strict' | 'lax' | 'none',
        },
      },
      oauth: {
        google: {
          clientID: 'test-google-client-id',
          clientSecret: 'test-google-client-secret',
          callbackURL: 'http://localhost:3000/auth/google/callback',
          scope: ['profile', 'email'],
          includeGrantedScopes: true,
          hostedDomain: '',
          includeProfile: true,
        },
        facebook: {
          clientID: 'test-facebook-client-id',
          clientSecret: 'test-facebook-client-secret',
          callbackURL: 'http://localhost:3000/auth/facebook/callback',
          scope: ['email', 'public_profile'],
          profileFields: ['id', 'displayName', 'photos', 'email'],
          enableProof: true,
        },
        apple: {
          clientID: 'test.apple.client.id',
          clientSecret: 'test-apple-client-secret',
          callbackURL: 'http://localhost:3000/auth/apple/callback',
          scope: ['name', 'email'],
          teamID: 'test-team-id',
          keyID: 'test-key-id',
          privateKeyLocation: './test-private-key.p8',
        },
      },
      auth: {
        password: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxHistory: 5,
        },
        mfa: {
          enabled: true,
          issuer: 'AUSTA SuperApp',
          codeLength: 6,
          validityDuration: 300,
          maxAttempts: 3,
        },
        session: {
          maxConcurrentSessions: 5,
          inactivityTimeout: 30,
          absoluteTimeout: 24,
        },
        rateLimit: {
          loginAttempts: 5,
          loginWindow: 15,
          passwordResetAttempts: 3,
          passwordResetWindow: 60,
        },
      },
      journeys: {
        health: {
          requiredRoles: ['user', 'health_user'],
          defaultPermissions: ['health:read', 'health:write'],
          jwtIssuer: 'austa-health-journey',
        },
        care: {
          requiredRoles: ['user', 'care_user'],
          defaultPermissions: ['care:read', 'care:write'],
          jwtIssuer: 'austa-care-journey',
        },
        plan: {
          requiredRoles: ['user', 'plan_user'],
          defaultPermissions: ['plan:read', 'plan:write'],
          jwtIssuer: 'austa-plan-journey',
        },
      },
    };
  }

  /**
   * Helper method to get a value from a nested object using a dot-notation path
   * @param obj Object to get value from
   * @param path Path to the value in dot notation (e.g., 'jwt.secret')
   * @returns The value at the specified path or undefined if not found
   */
  private getValueByPath(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) {
        return undefined;
      }
      result = result[key];
    }
    
    return result;
  }

  /**
   * Deep merges two objects
   * @param target Target object
   * @param source Source object
   * @returns Merged object
   */
  private mergeDeep(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Checks if a value is an object
   * @param item Value to check
   * @returns True if the value is an object, false otherwise
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

/**
 * Creates a ConfigServiceMock instance with default values
 * @returns ConfigServiceMock instance
 */
export const createConfigServiceMock = () => {
  return new ConfigServiceMock();
};

/**
 * Creates a ConfigServiceMock instance with custom overrides
 * @param overrides Configuration overrides
 * @returns ConfigServiceMock instance with overrides applied
 */
export const createConfigServiceMockWithOverrides = (overrides: Record<string, any>) => {
  return new ConfigServiceMock(overrides);
};