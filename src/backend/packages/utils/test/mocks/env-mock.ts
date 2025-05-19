/**
 * Environment Variable Mocking System for Testing
 * 
 * This module provides a configurable environment variable mocking system for testing
 * environment-dependent code. It enables simulation of different runtime environments
 * (development, testing, production) without modifying actual environment variables.
 */

import { JourneyType } from '../../src/env/journey';
import { EnvVarType, EnvVarTypeMap } from '../../src/env/types';
import { parseBoolean, parseNumber, parseArray, parseJson } from '../../src/env/transform';
import { MissingEnvironmentVariableError, InvalidEnvironmentVariableError } from '../../src/env/error';

/**
 * Interface for environment variable mock configuration
 */
export interface EnvMockConfig {
  /**
   * Initial environment variables to set
   */
  initialEnv?: Record<string, string>;
  
  /**
   * Whether to preserve existing process.env values
   */
  preserveProcessEnv?: boolean;
  
  /**
   * Whether to automatically prefix journey-specific variables
   */
  autoJourneyPrefix?: boolean;
}

/**
 * Interface for journey-specific environment preset
 */
export interface JourneyEnvPreset {
  /**
   * The journey type this preset applies to
   */
  journeyType: JourneyType;
  
  /**
   * Environment variables for this journey
   */
  variables: Record<string, string>;
  
  /**
   * Feature flags for this journey
   */
  features?: Record<string, boolean | number>;
}

/**
 * Preset environment configurations for different environments
 */
export enum EnvPreset {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * Class for mocking environment variables in tests
 */
export class EnvMock {
  private originalEnv: NodeJS.ProcessEnv;
  private mockEnv: Record<string, string | undefined>;
  private config: EnvMockConfig;
  
  /**
   * Creates a new EnvMock instance
   * 
   * @param config - Configuration for the environment mock
   */
  constructor(config: EnvMockConfig = {}) {
    // Store original process.env for restoration later
    this.originalEnv = { ...process.env };
    
    // Set default configuration
    this.config = {
      preserveProcessEnv: true,
      autoJourneyPrefix: true,
      ...config
    };
    
    // Initialize mock environment
    this.mockEnv = this.config.preserveProcessEnv ? { ...process.env } : {};
    
    // Apply initial environment variables if provided
    if (config.initialEnv) {
      Object.entries(config.initialEnv).forEach(([key, value]) => {
        this.mockEnv[key] = value;
      });
    }
    
    // Replace process.env with our mock
    this.applyMock();
  }
  
  /**
   * Applies the mock environment to process.env
   */
  private applyMock(): void {
    // Replace process.env with our mock
    // This approach maintains the object reference while replacing its contents
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    
    Object.entries(this.mockEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });
  }
  
  /**
   * Sets an environment variable in the mock environment
   * 
   * @param key - The environment variable name
   * @param value - The value to set
   * @returns The EnvMock instance for chaining
   */
  set(key: string, value: string | undefined): EnvMock {
    this.mockEnv[key] = value;
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
    return this;
  }
  
  /**
   * Sets multiple environment variables at once
   * 
   * @param env - Record of environment variables to set
   * @returns The EnvMock instance for chaining
   */
  setMultiple(env: Record<string, string | undefined>): EnvMock {
    Object.entries(env).forEach(([key, value]) => {
      this.set(key, value);
    });
    return this;
  }
  
  /**
   * Sets a journey-specific environment variable
   * Automatically applies the journey prefix if autoJourneyPrefix is enabled
   * 
   * @param journeyType - The journey type
   * @param key - The environment variable name (without prefix)
   * @param value - The value to set
   * @returns The EnvMock instance for chaining
   */
  setJourneyEnv(journeyType: JourneyType, key: string, value: string | undefined): EnvMock {
    const envKey = this.config.autoJourneyPrefix ? 
      `${journeyType.toUpperCase()}_${key}` : key;
    
    return this.set(envKey, value);
  }
  
  /**
   * Sets multiple journey-specific environment variables
   * 
   * @param journeyType - The journey type
   * @param env - Record of environment variables to set
   * @returns The EnvMock instance for chaining
   */
  setJourneyEnvMultiple(journeyType: JourneyType, env: Record<string, string | undefined>): EnvMock {
    Object.entries(env).forEach(([key, value]) => {
      this.setJourneyEnv(journeyType, key, value);
    });
    return this;
  }
  
  /**
   * Sets a journey-specific feature flag
   * 
   * @param journeyType - The journey type
   * @param featureName - The feature name
   * @param enabled - Whether the feature is enabled
   * @param rolloutPercentage - Optional rollout percentage (0-100)
   * @returns The EnvMock instance for chaining
   */
  setFeatureFlag(
    journeyType: JourneyType, 
    featureName: string, 
    enabled: boolean,
    rolloutPercentage?: number
  ): EnvMock {
    const flagName = `FEATURE_${featureName.toUpperCase()}`;
    this.setJourneyEnv(journeyType, flagName, String(enabled));
    
    if (rolloutPercentage !== undefined) {
      const percentageName = `FEATURE_${featureName.toUpperCase()}_PERCENTAGE`;
      this.setJourneyEnv(journeyType, percentageName, String(rolloutPercentage));
    }
    
    return this;
  }
  
  /**
   * Gets an environment variable from the mock environment
   * 
   * @param key - The environment variable name
   * @returns The environment variable value or undefined if not set
   */
  get(key: string): string | undefined {
    return this.mockEnv[key];
  }
  
  /**
   * Gets a journey-specific environment variable
   * 
   * @param journeyType - The journey type
   * @param key - The environment variable name (without prefix)
   * @returns The environment variable value or undefined if not set
   */
  getJourneyEnv(journeyType: JourneyType, key: string): string | undefined {
    const envKey = this.config.autoJourneyPrefix ? 
      `${journeyType.toUpperCase()}_${key}` : key;
    
    return this.get(envKey);
  }
  
  /**
   * Gets a typed environment variable with validation
   * 
   * @param key - The environment variable name
   * @param type - The expected type
   * @param required - Whether the variable is required
   * @returns The typed environment variable value
   * @throws MissingEnvironmentVariableError if required and not set
   * @throws InvalidEnvironmentVariableError if value cannot be converted to the specified type
   */
  getTyped<T extends EnvVarType>(
    key: string, 
    type: T, 
    required = false
  ): EnvVarTypeMap[T] | undefined {
    const value = this.get(key);
    
    // Handle required check
    if (required && (value === undefined || value === '')) {
      throw new MissingEnvironmentVariableError(key);
    }
    
    // Return undefined for optional variables that aren't set
    if (!required && (value === undefined || value === '')) {
      return undefined;
    }
    
    // Convert value to the specified type
    try {
      return this.convertToType(value as string, type);
    } catch (error) {
      throw new InvalidEnvironmentVariableError(
        key, 
        value, 
        `value of type ${type}`
      );
    }
  }
  
  /**
   * Converts a string value to the specified type
   * 
   * @param value - The string value to convert
   * @param type - The target type
   * @returns The converted value
   */
  private convertToType<T extends EnvVarType>(value: string, type: T): EnvVarTypeMap[T] {
    switch (type) {
      case 'string':
        return value as unknown as EnvVarTypeMap[T];
      case 'number':
        return parseNumber(value) as unknown as EnvVarTypeMap[T];
      case 'boolean':
        return parseBoolean(value) as unknown as EnvVarTypeMap[T];
      case 'array':
        return parseArray(value) as unknown as EnvVarTypeMap[T];
      case 'json':
        return parseJson(value) as unknown as EnvVarTypeMap[T];
      case 'url':
        return new URL(value) as unknown as EnvVarTypeMap[T];
      case 'enum':
        return value as unknown as EnvVarTypeMap[T];
      case 'duration':
        return parseNumber(value) as unknown as EnvVarTypeMap[T];
      case 'port':
        const port = parseNumber(value);
        if (port < 0 || port > 65535) {
          throw new Error(`Invalid port number: ${port}`);
        }
        return port as unknown as EnvVarTypeMap[T];
      case 'host':
        return value as unknown as EnvVarTypeMap[T];
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }
  
  /**
   * Removes an environment variable from the mock environment
   * 
   * @param key - The environment variable name
   * @returns The EnvMock instance for chaining
   */
  unset(key: string): EnvMock {
    delete this.mockEnv[key];
    delete process.env[key];
    return this;
  }
  
  /**
   * Removes multiple environment variables at once
   * 
   * @param keys - Array of environment variable names to remove
   * @returns The EnvMock instance for chaining
   */
  unsetMultiple(keys: string[]): EnvMock {
    keys.forEach(key => {
      this.unset(key);
    });
    return this;
  }
  
  /**
   * Removes a journey-specific environment variable
   * 
   * @param journeyType - The journey type
   * @param key - The environment variable name (without prefix)
   * @returns The EnvMock instance for chaining
   */
  unsetJourneyEnv(journeyType: JourneyType, key: string): EnvMock {
    const envKey = this.config.autoJourneyPrefix ? 
      `${journeyType.toUpperCase()}_${key}` : key;
    
    return this.unset(envKey);
  }
  
  /**
   * Resets all environment variables to their original values
   * 
   * @returns The EnvMock instance for chaining
   */
  reset(): EnvMock {
    // Clear all current values
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    
    // Restore original values
    Object.entries(this.originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });
    
    // Reset mock environment
    this.mockEnv = { ...this.originalEnv };
    
    return this;
  }
  
  /**
   * Clears all environment variables
   * 
   * @returns The EnvMock instance for chaining
   */
  clear(): EnvMock {
    Object.keys(this.mockEnv).forEach(key => {
      delete this.mockEnv[key];
      delete process.env[key];
    });
    return this;
  }
  
  /**
   * Applies a preset environment configuration
   * 
   * @param preset - The environment preset to apply
   * @returns The EnvMock instance for chaining
   */
  applyPreset(preset: EnvPreset): EnvMock {
    // Clear existing environment first
    this.clear();
    
    // Apply preset-specific environment variables
    switch (preset) {
      case EnvPreset.DEVELOPMENT:
        return this.applyDevelopmentPreset();
      case EnvPreset.TEST:
        return this.applyTestPreset();
      case EnvPreset.STAGING:
        return this.applyStagingPreset();
      case EnvPreset.PRODUCTION:
        return this.applyProductionPreset();
      default:
        throw new Error(`Unknown preset: ${preset}`);
    }
  }
  
  /**
   * Applies a journey-specific environment preset
   * 
   * @param preset - The journey environment preset to apply
   * @returns The EnvMock instance for chaining
   */
  applyJourneyPreset(preset: JourneyEnvPreset): EnvMock {
    // Set environment variables
    this.setJourneyEnvMultiple(preset.journeyType, preset.variables);
    
    // Set feature flags if provided
    if (preset.features) {
      Object.entries(preset.features).forEach(([featureName, value]) => {
        if (typeof value === 'boolean') {
          this.setFeatureFlag(preset.journeyType, featureName, value);
        } else {
          this.setFeatureFlag(preset.journeyType, featureName, true, value);
        }
      });
    }
    
    return this;
  }
  
  /**
   * Applies development environment preset
   * 
   * @returns The EnvMock instance for chaining
   */
  private applyDevelopmentPreset(): EnvMock {
    return this.setMultiple({
      'NODE_ENV': 'development',
      'LOG_LEVEL': 'debug',
      'PORT': '3000',
      'DATABASE_URL': 'postgresql://postgres:postgres@localhost:5432/austa_dev',
      'REDIS_URL': 'redis://localhost:6379/0',
      'KAFKA_BROKERS': 'localhost:9092',
      'JWT_SECRET': 'dev-secret-key',
      'JWT_EXPIRES_IN': '1d',
      'CORS_ORIGINS': 'http://localhost:3000,http://localhost:3001',
      'API_TIMEOUT': '30000',
      'ENABLE_SWAGGER': 'true',
      'ENABLE_GRAPHQL_PLAYGROUND': 'true'
    });
  }
  
  /**
   * Applies test environment preset
   * 
   * @returns The EnvMock instance for chaining
   */
  private applyTestPreset(): EnvMock {
    return this.setMultiple({
      'NODE_ENV': 'test',
      'LOG_LEVEL': 'error',
      'PORT': '3001',
      'DATABASE_URL': 'postgresql://postgres:postgres@localhost:5432/austa_test',
      'REDIS_URL': 'redis://localhost:6379/1',
      'KAFKA_BROKERS': 'localhost:9092',
      'JWT_SECRET': 'test-secret-key',
      'JWT_EXPIRES_IN': '1h',
      'CORS_ORIGINS': 'http://localhost:3000',
      'API_TIMEOUT': '5000',
      'ENABLE_SWAGGER': 'false',
      'ENABLE_GRAPHQL_PLAYGROUND': 'false'
    });
  }
  
  /**
   * Applies staging environment preset
   * 
   * @returns The EnvMock instance for chaining
   */
  private applyStagingPreset(): EnvMock {
    return this.setMultiple({
      'NODE_ENV': 'staging',
      'LOG_LEVEL': 'info',
      'PORT': '8080',
      'DATABASE_URL': 'postgresql://postgres:postgres@db:5432/austa_staging',
      'REDIS_URL': 'redis://redis:6379/0',
      'KAFKA_BROKERS': 'kafka:9092',
      'JWT_SECRET': 'staging-secret-key',
      'JWT_EXPIRES_IN': '4h',
      'CORS_ORIGINS': 'https://staging.austa.health',
      'API_TIMEOUT': '15000',
      'ENABLE_SWAGGER': 'true',
      'ENABLE_GRAPHQL_PLAYGROUND': 'false'
    });
  }
  
  /**
   * Applies production environment preset
   * 
   * @returns The EnvMock instance for chaining
   */
  private applyProductionPreset(): EnvMock {
    return this.setMultiple({
      'NODE_ENV': 'production',
      'LOG_LEVEL': 'warn',
      'PORT': '8080',
      'DATABASE_URL': 'postgresql://postgres:postgres@db:5432/austa_prod',
      'REDIS_URL': 'redis://redis:6379/0',
      'KAFKA_BROKERS': 'kafka-1:9092,kafka-2:9092,kafka-3:9092',
      'JWT_SECRET': 'prod-secret-key',
      'JWT_EXPIRES_IN': '1d',
      'CORS_ORIGINS': 'https://app.austa.health',
      'API_TIMEOUT': '10000',
      'ENABLE_SWAGGER': 'false',
      'ENABLE_GRAPHQL_PLAYGROUND': 'false'
    });
  }
}

/**
 * Predefined journey presets for testing
 */
export const journeyPresets = {
  /**
   * Health journey preset for testing
   */
  health: {
    journeyType: JourneyType.HEALTH,
    variables: {
      'API_URL': 'https://api.health.austa.test',
      'FHIR_API_URL': 'https://fhir.health.austa.test',
      'METRICS_RETENTION_DAYS': '90',
      'DEFAULT_GOAL_DURATION_DAYS': '30',
      'WEARABLE_SYNC_INTERVAL': '3600',
      'MAX_HEALTH_RECORDS': '1000'
    },
    features: {
      'WEARABLE_INTEGRATION': true,
      'HEALTH_INSIGHTS': true,
      'HEALTH_SHARING': false,
      'ADVANCED_METRICS': 50 // 50% rollout
    }
  },
  
  /**
   * Care journey preset for testing
   */
  care: {
    journeyType: JourneyType.CARE,
    variables: {
      'API_URL': 'https://api.care.austa.test',
      'PROVIDER_API_URL': 'https://providers.care.austa.test',
      'APPOINTMENT_REMINDER_HOURS': '24',
      'TELEMEDICINE_PROVIDER': 'agora',
      'MEDICATION_REMINDER_ENABLED': 'true',
      'SYMPTOM_CHECKER_API_URL': 'https://symptoms.care.austa.test'
    },
    features: {
      'TELEMEDICINE': true,
      'APPOINTMENT_BOOKING': true,
      'MEDICATION_TRACKING': true,
      'AI_SYMPTOM_CHECKER': 25 // 25% rollout
    }
  },
  
  /**
   * Plan journey preset for testing
   */
  plan: {
    journeyType: JourneyType.PLAN,
    variables: {
      'API_URL': 'https://api.plan.austa.test',
      'INSURANCE_API_URL': 'https://insurance.plan.austa.test',
      'CLAIMS_RETENTION_DAYS': '365',
      'DOCUMENT_STORAGE_PATH': '/tmp/documents',
      'BENEFIT_CALCULATION_STRATEGY': 'standard',
      'PAYMENT_GATEWAY_URL': 'https://payments.plan.austa.test'
    },
    features: {
      'DIGITAL_ID_CARD': true,
      'CLAIM_SUBMISSION': true,
      'BENEFIT_CALCULATOR': true,
      'PLAN_COMPARISON': 75 // 75% rollout
    }
  }
};

/**
 * Creates a new EnvMock instance with default configuration
 * 
 * @param config - Optional configuration for the environment mock
 * @returns A new EnvMock instance
 */
export function createEnvMock(config?: EnvMockConfig): EnvMock {
  return new EnvMock(config);
}

/**
 * Creates a new EnvMock instance with a specific preset
 * 
 * @param preset - The environment preset to apply
 * @param config - Optional additional configuration
 * @returns A new EnvMock instance with the preset applied
 */
export function createEnvMockWithPreset(preset: EnvPreset, config?: EnvMockConfig): EnvMock {
  const envMock = new EnvMock(config);
  return envMock.applyPreset(preset);
}

/**
 * Creates a new EnvMock instance with a journey-specific preset
 * 
 * @param journeyPreset - The journey preset to apply
 * @param config - Optional additional configuration
 * @returns A new EnvMock instance with the journey preset applied
 */
export function createEnvMockWithJourneyPreset(
  journeyPreset: JourneyEnvPreset, 
  config?: EnvMockConfig
): EnvMock {
  const envMock = new EnvMock(config);
  return envMock.applyJourneyPreset(journeyPreset);
}

/**
 * Creates a new EnvMock instance for testing the health journey
 * 
 * @param config - Optional additional configuration
 * @returns A new EnvMock instance with the health journey preset applied
 */
export function createHealthJourneyEnvMock(config?: EnvMockConfig): EnvMock {
  return createEnvMockWithJourneyPreset(journeyPresets.health, config);
}

/**
 * Creates a new EnvMock instance for testing the care journey
 * 
 * @param config - Optional additional configuration
 * @returns A new EnvMock instance with the care journey preset applied
 */
export function createCareJourneyEnvMock(config?: EnvMockConfig): EnvMock {
  return createEnvMockWithJourneyPreset(journeyPresets.care, config);
}

/**
 * Creates a new EnvMock instance for testing the plan journey
 * 
 * @param config - Optional additional configuration
 * @returns A new EnvMock instance with the plan journey preset applied
 */
export function createPlanJourneyEnvMock(config?: EnvMockConfig): EnvMock {
  return createEnvMockWithJourneyPreset(journeyPresets.plan, config);
}