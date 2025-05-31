/**
 * Environment variable mocking system for testing environment-dependent code.
 * Enables simulation of different runtime environments without modifying actual environment variables.
 */

import { EnvVarPrimitiveType, JourneyType } from '../../src/env/types';

/**
 * Interface for the mocked environment variables.
 */
export interface MockedEnv {
  [key: string]: string | undefined;
}

/**
 * Interface for environment preset configurations.
 */
export interface EnvPreset {
  name: string;
  description: string;
  variables: Record<string, string>;
}

/**
 * Interface for journey-specific environment presets.
 */
export interface JourneyEnvPreset extends EnvPreset {
  journey: JourneyType;
}

/**
 * Options for creating a mocked environment.
 */
export interface MockEnvOptions {
  /**
   * Initial environment variables to set
   */
  initialEnv?: Record<string, string>;
  
  /**
   * Whether to include process.env values as fallbacks
   */
  includeProcessEnv?: boolean;
  
  /**
   * Preset configuration to use
   */
  preset?: string | EnvPreset;
  
  /**
   * Journey-specific preset to use
   */
  journeyPreset?: string | JourneyEnvPreset;
}

/**
 * Common environment presets for testing.
 */
export const ENV_PRESETS: Record<string, EnvPreset> = {
  development: {
    name: 'development',
    description: 'Development environment configuration',
    variables: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
      API_URL: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/austa_dev',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'localhost:9092',
      ENABLE_SWAGGER: 'true',
      CORS_ORIGINS: 'http://localhost:3000,http://localhost:8000',
      JWT_SECRET: 'dev-jwt-secret',
      JWT_EXPIRATION: '1h',
      REFRESH_TOKEN_EXPIRATION: '7d',
      ENABLE_GRAPHQL_PLAYGROUND: 'true',
      ENABLE_TRACING: 'true',
      CACHE_TTL: '300',
    },
  },
  test: {
    name: 'test',
    description: 'Test environment configuration',
    variables: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      API_URL: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/austa_test',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'localhost:9092',
      ENABLE_SWAGGER: 'false',
      CORS_ORIGINS: 'http://localhost:3000',
      JWT_SECRET: 'test-jwt-secret',
      JWT_EXPIRATION: '5m',
      REFRESH_TOKEN_EXPIRATION: '1h',
      ENABLE_GRAPHQL_PLAYGROUND: 'false',
      ENABLE_TRACING: 'false',
      CACHE_TTL: '60',
    },
  },
  production: {
    name: 'production',
    description: 'Production environment configuration',
    variables: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      API_URL: 'https://api.austa.health',
      DATABASE_URL: 'postgresql://postgres:postgres@db:5432/austa_prod',
      REDIS_URL: 'redis://redis:6379',
      KAFKA_BROKERS: 'kafka:9092',
      ENABLE_SWAGGER: 'false',
      CORS_ORIGINS: 'https://app.austa.health',
      JWT_EXPIRATION: '15m',
      REFRESH_TOKEN_EXPIRATION: '7d',
      ENABLE_GRAPHQL_PLAYGROUND: 'false',
      ENABLE_TRACING: 'true',
      CACHE_TTL: '600',
    },
  },
};

/**
 * Journey-specific environment presets for testing.
 */
export const JOURNEY_ENV_PRESETS: Record<string, JourneyEnvPreset> = {
  health: {
    name: 'health',
    description: 'Health journey environment configuration',
    journey: 'health',
    variables: {
      HEALTH_SERVICE_PORT: '3001',
      HEALTH_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/austa_health_test',
      HEALTH_METRICS_RETENTION_DAYS: '90',
      HEALTH_GOALS_ENABLED: 'true',
      HEALTH_INSIGHTS_ENABLED: 'true',
      HEALTH_WEARABLES_SYNC_INTERVAL: '15',
      HEALTH_FHIR_API_URL: 'http://localhost:8080/fhir',
      HEALTH_FHIR_API_VERSION: 'R4',
    },
  },
  care: {
    name: 'care',
    description: 'Care journey environment configuration',
    journey: 'care',
    variables: {
      CARE_SERVICE_PORT: '3002',
      CARE_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/austa_care_test',
      CARE_APPOINTMENTS_ENABLED: 'true',
      CARE_TELEMEDICINE_ENABLED: 'true',
      CARE_SYMPTOM_CHECKER_ENABLED: 'true',
      CARE_PROVIDERS_SYNC_INTERVAL: '60',
      CARE_MEDICATIONS_REMINDER_ENABLED: 'true',
    },
  },
  plan: {
    name: 'plan',
    description: 'Plan journey environment configuration',
    journey: 'plan',
    variables: {
      PLAN_SERVICE_PORT: '3003',
      PLAN_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/austa_plan_test',
      PLAN_CLAIMS_ENABLED: 'true',
      PLAN_BENEFITS_ENABLED: 'true',
      PLAN_DOCUMENTS_ENABLED: 'true',
      PLAN_COVERAGE_SYNC_INTERVAL: '120',
    },
  },
  common: {
    name: 'common',
    description: 'Common journey environment configuration',
    journey: 'common',
    variables: {
      COMMON_SERVICE_PORT: '3000',
      COMMON_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/austa_common_test',
      COMMON_FEATURES_ENABLED: 'true',
      COMMON_SYNC_INTERVAL: '30',
    },
  },
};

/**
 * Class that provides a configurable environment variable mocking system for testing.
 */
export class EnvMock {
  private originalEnv: NodeJS.ProcessEnv;
  private mockedEnv: MockedEnv = {};
  private includeProcessEnv: boolean;

  /**
   * Creates a new EnvMock instance.
   * 
   * @param options - Configuration options for the mocked environment
   */
  constructor(options: MockEnvOptions = {}) {
    // Store the original process.env
    this.originalEnv = { ...process.env };
    this.includeProcessEnv = options.includeProcessEnv ?? false;

    // Initialize with empty environment
    this.reset();

    // Apply initial environment if provided
    if (options.initialEnv) {
      this.set(options.initialEnv);
    }

    // Apply preset if provided
    if (options.preset) {
      this.applyPreset(options.preset);
    }

    // Apply journey preset if provided
    if (options.journeyPreset) {
      this.applyJourneyPreset(options.journeyPreset);
    }

    // Override process.env with our mock
    this.mock();
  }

  /**
   * Gets the current mocked environment variables.
   * 
   * @returns The current mocked environment
   */
  get env(): MockedEnv {
    return { ...this.mockedEnv };
  }

  /**
   * Sets environment variables in the mocked environment.
   * 
   * @param key - Environment variable name or object with multiple variables
   * @param value - Value to set (if key is a string)
   * @returns The EnvMock instance for chaining
   */
  set(key: string | Record<string, string>, value?: string): EnvMock {
    if (typeof key === 'object') {
      // Set multiple variables at once
      Object.entries(key).forEach(([k, v]) => {
        this.mockedEnv[k] = v;
      });
    } else if (typeof key === 'string' && value !== undefined) {
      // Set a single variable
      this.mockedEnv[key] = value;
    }

    // Update process.env with the new values
    this.updateProcessEnv();

    return this;
  }

  /**
   * Gets the value of an environment variable from the mocked environment.
   * 
   * @param key - Environment variable name
   * @returns The value of the environment variable, or undefined if not set
   */
  get(key: string): string | undefined {
    // Check the mocked environment first
    if (key in this.mockedEnv) {
      return this.mockedEnv[key];
    }

    // Fall back to process.env if includeProcessEnv is true
    if (this.includeProcessEnv && key in this.originalEnv) {
      return this.originalEnv[key];
    }

    return undefined;
  }

  /**
   * Gets a typed environment variable value.
   * 
   * @param key - Environment variable name
   * @param transform - Function to transform the string value to the desired type
   * @param defaultValue - Default value to return if the variable is not set
   * @returns The transformed value, or the default value if not set
   */
  getTyped<T extends EnvVarPrimitiveType>(
    key: string,
    transform: (value: string) => T,
    defaultValue?: T
  ): T | undefined {
    const value = this.get(key);
    if (value === undefined) {
      return defaultValue;
    }
    return transform(value);
  }

  /**
   * Unsets environment variables in the mocked environment.
   * 
   * @param keys - Environment variable name(s) to unset
   * @returns The EnvMock instance for chaining
   */
  unset(...keys: string[]): EnvMock {
    keys.forEach(key => {
      delete this.mockedEnv[key];
    });

    // Update process.env with the new values
    this.updateProcessEnv();

    return this;
  }

  /**
   * Resets the mocked environment to an empty state or to the specified values.
   * 
   * @param newEnv - New environment variables to set after resetting
   * @returns The EnvMock instance for chaining
   */
  reset(newEnv?: Record<string, string>): EnvMock {
    // Reset to empty environment
    this.mockedEnv = {};

    // Set new environment if provided
    if (newEnv) {
      this.set(newEnv);
    }

    // Update process.env with the new values
    this.updateProcessEnv();

    return this;
  }

  /**
   * Applies an environment preset to the mocked environment.
   * 
   * @param preset - Preset name or preset object
   * @returns The EnvMock instance for chaining
   */
  applyPreset(preset: string | EnvPreset): EnvMock {
    let presetConfig: EnvPreset;

    if (typeof preset === 'string') {
      // Look up preset by name
      presetConfig = ENV_PRESETS[preset];
      if (!presetConfig) {
        throw new Error(`Unknown environment preset: ${preset}`);
      }
    } else {
      // Use provided preset object
      presetConfig = preset;
    }

    // Apply preset variables
    this.set(presetConfig.variables);

    return this;
  }

  /**
   * Applies a journey-specific environment preset to the mocked environment.
   * 
   * @param preset - Journey preset name or preset object
   * @returns The EnvMock instance for chaining
   */
  applyJourneyPreset(preset: string | JourneyEnvPreset): EnvMock {
    let presetConfig: JourneyEnvPreset;

    if (typeof preset === 'string') {
      // Look up journey preset by name
      presetConfig = JOURNEY_ENV_PRESETS[preset];
      if (!presetConfig) {
        throw new Error(`Unknown journey environment preset: ${preset}`);
      }
    } else {
      // Use provided journey preset object
      presetConfig = preset;
    }

    // Apply journey preset variables
    this.set(presetConfig.variables);

    return this;
  }

  /**
   * Creates a journey-specific environment variable name with the appropriate prefix.
   * 
   * @param journey - The journey type
   * @param name - The base variable name
   * @returns The prefixed variable name
   */
  static journeyVar(journey: JourneyType, name: string): string {
    const prefix = journey.toUpperCase();
    return `${prefix}_${name}`;
  }

  /**
   * Overrides process.env with the mocked environment.
   * This method is called automatically by the constructor.
   * 
   * @returns The EnvMock instance for chaining
   */
  mock(): EnvMock {
    this.updateProcessEnv();
    return this;
  }

  /**
   * Restores the original process.env values.
   * Call this method in your test cleanup to restore the original environment.
   * 
   * @returns The EnvMock instance for chaining
   */
  restore(): EnvMock {
    // Restore original process.env
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });

    Object.entries(this.originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });

    return this;
  }

  /**
   * Updates process.env with the current mocked environment values.
   * 
   * @private
   */
  private updateProcessEnv(): void {
    // Start with a clean slate or original env depending on configuration
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });

    // Add original env values if includeProcessEnv is true
    if (this.includeProcessEnv) {
      Object.entries(this.originalEnv).forEach(([key, value]) => {
        if (value !== undefined) {
          process.env[key] = value;
        }
      });
    }

    // Override with mocked values
    Object.entries(this.mockedEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    });
  }
}

/**
 * Creates a mocked environment for testing.
 * 
 * @param options - Configuration options for the mocked environment
 * @returns A new EnvMock instance
 */
export function createMockEnv(options: MockEnvOptions = {}): EnvMock {
  return new EnvMock(options);
}

/**
 * Creates a journey-specific mocked environment for testing.
 * 
 * @param journey - The journey type
 * @param additionalVars - Additional environment variables to set
 * @param basePreset - Base environment preset to use (default: 'test')
 * @returns A new EnvMock instance configured for the specified journey
 */
export function createJourneyMockEnv(
  journey: JourneyType,
  additionalVars: Record<string, string> = {},
  basePreset: string = 'test'
): EnvMock {
  return new EnvMock({
    preset: basePreset,
    journeyPreset: journey,
    initialEnv: additionalVars,
  });
}

/**
 * Creates a mocked environment with development configuration.
 * 
 * @param additionalVars - Additional environment variables to set
 * @returns A new EnvMock instance with development configuration
 */
export function createDevMockEnv(additionalVars: Record<string, string> = {}): EnvMock {
  return new EnvMock({
    preset: 'development',
    initialEnv: additionalVars,
  });
}

/**
 * Creates a mocked environment with test configuration.
 * 
 * @param additionalVars - Additional environment variables to set
 * @returns A new EnvMock instance with test configuration
 */
export function createTestMockEnv(additionalVars: Record<string, string> = {}): EnvMock {
  return new EnvMock({
    preset: 'test',
    initialEnv: additionalVars,
  });
}

/**
 * Creates a mocked environment with production configuration.
 * 
 * @param additionalVars - Additional environment variables to set
 * @returns A new EnvMock instance with production configuration
 */
export function createProdMockEnv(additionalVars: Record<string, string> = {}): EnvMock {
  return new EnvMock({
    preset: 'production',
    initialEnv: additionalVars,
  });
}

/**
 * Utility function to run a test with a mocked environment and automatically restore it afterward.
 * 
 * @param callback - Test function to run with the mocked environment
 * @param options - Configuration options for the mocked environment
 * @returns The result of the callback function
 */
export async function withMockEnv<T>(
  callback: (env: EnvMock) => Promise<T> | T,
  options: MockEnvOptions = {}
): Promise<T> {
  const mockEnv = new EnvMock(options);
  try {
    return await Promise.resolve(callback(mockEnv));
  } finally {
    mockEnv.restore();
  }
}

/**
 * Utility function to run a test with a journey-specific mocked environment and automatically restore it afterward.
 * 
 * @param journey - The journey type
 * @param callback - Test function to run with the mocked environment
 * @param additionalVars - Additional environment variables to set
 * @param basePreset - Base environment preset to use (default: 'test')
 * @returns The result of the callback function
 */
export async function withJourneyMockEnv<T>(
  journey: JourneyType,
  callback: (env: EnvMock) => Promise<T> | T,
  additionalVars: Record<string, string> = {},
  basePreset: string = 'test'
): Promise<T> {
  return withMockEnv(callback, {
    preset: basePreset,
    journeyPreset: journey,
    initialEnv: additionalVars,
  });
}