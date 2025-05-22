import { Logger } from '@nestjs/common';
import {
  ConnectionConfig,
  ConfigValidationError,
  Environment,
  DEVELOPMENT_CONFIG,
  TEST_CONFIG,
  STAGING_CONFIG,
  PRODUCTION_CONFIG,
  validateConnectionConfig,
  getConfigForEnvironment,
  mergeConfigs,
  configFromEnvironment,
  getJourneyConfig,
  createConfigUpdater,
} from '../../src/connection/connection-config';

describe('Connection Configuration', () => {
  describe('Environment-specific configurations', () => {
    it('should have valid development configuration', () => {
      // Verify development config has expected values
      expect(DEVELOPMENT_CONFIG.poolMin).toBe(2);
      expect(DEVELOPMENT_CONFIG.poolMax).toBe(10);
      expect(DEVELOPMENT_CONFIG.enableQueryLogging).toBe(true);
      expect(DEVELOPMENT_CONFIG.enableCircuitBreaker).toBe(false);
      
      // Verify nested objects
      expect(DEVELOPMENT_CONFIG.retryConfig.maxAttempts).toBe(3);
      expect(DEVELOPMENT_CONFIG.journeyContext.enabled).toBe(true);
      expect(DEVELOPMENT_CONFIG.journeyContext.separateConnectionPools).toBe(false);
      
      // Validate the configuration
      const errors = validateConnectionConfig(DEVELOPMENT_CONFIG);
      expect(errors).toHaveLength(0);
    });

    it('should have valid test configuration', () => {
      // Verify test config has expected values
      expect(TEST_CONFIG.poolMin).toBe(1);
      expect(TEST_CONFIG.poolMax).toBe(5);
      expect(TEST_CONFIG.enableQueryLogging).toBe(false);
      expect(TEST_CONFIG.healthCheckInterval).toBe(0); // Disabled in test
      
      // Verify nested objects
      expect(TEST_CONFIG.connectionPool.lazyConnect).toBe(true);
      
      // Validate the configuration
      const errors = validateConnectionConfig(TEST_CONFIG);
      expect(errors).toHaveLength(0);
    });

    it('should have valid staging configuration', () => {
      // Verify staging config has expected values
      expect(STAGING_CONFIG.poolMin).toBe(3);
      expect(STAGING_CONFIG.poolMax).toBe(15);
      expect(STAGING_CONFIG.enableQueryLogging).toBe(false);
      expect(STAGING_CONFIG.enableCircuitBreaker).toBe(true);
      
      // Verify nested objects
      expect(STAGING_CONFIG.retryConfig.maxAttempts).toBe(4); // Increased from default
      expect(STAGING_CONFIG.journeyContext.separateConnectionPools).toBe(true);
      expect(STAGING_CONFIG.healthCheck.intervalMs).toBe(30000); // More frequent health checks
      
      // Validate the configuration
      const errors = validateConnectionConfig(STAGING_CONFIG);
      expect(errors).toHaveLength(0);
    });

    it('should have valid production configuration', () => {
      // Verify production config has expected values
      expect(PRODUCTION_CONFIG.poolMin).toBe(5);
      expect(PRODUCTION_CONFIG.poolMax).toBe(20);
      expect(PRODUCTION_CONFIG.enableQueryLogging).toBe(false);
      expect(PRODUCTION_CONFIG.enableCircuitBreaker).toBe(true);
      
      // Verify nested objects
      expect(PRODUCTION_CONFIG.retryConfig.maxAttempts).toBe(5); // Increased from default
      expect(PRODUCTION_CONFIG.retryConfig.maxDelayMs).toBe(10000); // Increased from default
      expect(PRODUCTION_CONFIG.journeyContext.maxConnectionsPerJourney).toBe(7);
      expect(PRODUCTION_CONFIG.healthCheck.failureThreshold).toBe(2); // More sensitive in production
      expect(PRODUCTION_CONFIG.healthCheck.successThreshold).toBe(3); // More conservative recovery
      
      // Validate the configuration
      const errors = validateConnectionConfig(PRODUCTION_CONFIG);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateConnectionConfig', () => {
    it('should return empty array for valid configuration', () => {
      const validConfig: Partial<ConnectionConfig> = {
        poolMin: 2,
        poolMax: 10,
        connectionTimeout: 30000,
        queryTimeout: 30000,
        retryConfig: {
          baseDelayMs: 100,
          maxDelayMs: 5000,
          maxAttempts: 3,
          jitterFactor: 0.1,
        },
      };

      const errors = validateConnectionConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid pool settings', () => {
      const invalidConfig: Partial<ConnectionConfig> = {
        poolMin: 10,
        poolMax: 5, // Invalid: poolMin > poolMax
      };

      const errors = validateConnectionConfig(invalidConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('poolMin (10) cannot be greater than poolMax (5)');
    });

    it('should detect invalid timeout settings', () => {
      const invalidConfig: Partial<ConnectionConfig> = {
        connectionTimeout: 0, // Invalid: must be > 0
        queryTimeout: -1, // Invalid: must be > 0
      };

      const errors = validateConnectionConfig(invalidConfig);
      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain('connectionTimeout (0) must be greater than 0');
      expect(errors[1]).toContain('queryTimeout (-1) must be greater than 0');
    });

    it('should detect invalid retry settings', () => {
      const invalidConfig: Partial<ConnectionConfig> = {
        retryConfig: {
          baseDelayMs: 0, // Invalid: must be > 0
          maxDelayMs: 100, // Valid
          maxAttempts: 0, // Invalid: must be > 0
          jitterFactor: 1.5, // Invalid: must be between 0 and 1
        },
      };

      const errors = validateConnectionConfig(invalidConfig);
      expect(errors).toHaveLength(3);
      expect(errors[0]).toContain('retryConfig.baseDelayMs (0) must be greater than 0');
      expect(errors[1]).toContain('retryConfig.maxAttempts (0) must be greater than 0');
      expect(errors[2]).toContain('retryConfig.jitterFactor (1.5) must be between 0 and 1');
    });

    it('should detect invalid health check settings', () => {
      const invalidConfig: Partial<ConnectionConfig> = {
        healthCheck: {
          intervalMs: -1, // Invalid: must be >= 0
          timeoutMs: 0, // Invalid: must be > 0
          failureThreshold: 0, // Invalid: must be > 0
          successThreshold: 0, // Invalid: must be > 0
          autoRecover: true, // Valid
        },
      };

      const errors = validateConnectionConfig(invalidConfig);
      expect(errors).toHaveLength(4);
      expect(errors[0]).toContain('healthCheck.intervalMs (-1) must be greater than or equal to 0');
      expect(errors[1]).toContain('healthCheck.timeoutMs (0) must be greater than 0');
      expect(errors[2]).toContain('healthCheck.failureThreshold (0) must be greater than 0');
      expect(errors[3]).toContain('healthCheck.successThreshold (0) must be greater than 0');
    });

    it('should detect invalid connection pool settings', () => {
      const invalidConfig: Partial<ConnectionConfig> = {
        connectionPool: {
          poolMin: 10,
          poolMax: 5, // Invalid: poolMin > poolMax
          poolIdle: 5000, // Valid
          validateConnection: true, // Valid
          acquireTimeoutMs: 0, // Invalid: must be > 0
          lazyConnect: true, // Valid
        },
      };

      const errors = validateConnectionConfig(invalidConfig);
      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain('connectionPool.poolMin (10) cannot be greater than connectionPool.poolMax (5)');
      expect(errors[1]).toContain('connectionPool.acquireTimeoutMs (0) must be greater than 0');
    });

    it('should detect invalid journey context settings', () => {
      const invalidConfig: Partial<ConnectionConfig> = {
        journeyContext: {
          enabled: true, // Valid
          separateConnectionPools: true, // Valid
          maxConnectionsPerJourney: 0, // Invalid: must be > 0
          enableQueryLogging: false, // Valid
        },
      };

      const errors = validateConnectionConfig(invalidConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('journeyContext.maxConnectionsPerJourney (0) must be greater than 0');
    });
  });

  describe('getConfigForEnvironment', () => {
    it('should return development config by default', () => {
      const config = getConfigForEnvironment();
      expect(config).toEqual(DEVELOPMENT_CONFIG);
    });

    it('should return config for specified environment', () => {
      const config = getConfigForEnvironment(Environment.PRODUCTION);
      expect(config).toEqual(PRODUCTION_CONFIG);
    });

    it('should apply overrides to environment config', () => {
      const overrides = {
        poolMin: 10,
        poolMax: 30,
        enableQueryLogging: true,
      };

      const config = getConfigForEnvironment(Environment.PRODUCTION, overrides);
      expect(config.poolMin).toBe(10);
      expect(config.poolMax).toBe(30);
      expect(config.enableQueryLogging).toBe(true);
      // Other properties should remain unchanged
      expect(config.retryConfig.maxAttempts).toBe(PRODUCTION_CONFIG.retryConfig.maxAttempts);
    });

    it('should throw ConfigValidationError for invalid config', () => {
      const invalidOverrides = {
        poolMin: 30,
        poolMax: 10, // Invalid: poolMin > poolMax
      };

      expect(() => {
        getConfigForEnvironment(Environment.PRODUCTION, invalidOverrides);
      }).toThrow(ConfigValidationError);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge top-level properties', () => {
      const baseConfig = { ...DEVELOPMENT_CONFIG };
      const overrides = {
        poolMin: 10,
        poolMax: 30,
        enableQueryLogging: false,
      };

      const merged = mergeConfigs(baseConfig, overrides);
      expect(merged.poolMin).toBe(10);
      expect(merged.poolMax).toBe(30);
      expect(merged.enableQueryLogging).toBe(false);
      // Other properties should remain unchanged
      expect(merged.retryConfig).toEqual(baseConfig.retryConfig);
    });

    it('should deep merge nested objects', () => {
      const baseConfig = { ...DEVELOPMENT_CONFIG };
      const overrides = {
        retryConfig: {
          maxAttempts: 10,
          jitterFactor: 0.5,
        },
        healthCheck: {
          intervalMs: 120000,
          failureThreshold: 5,
        },
      };

      const merged = mergeConfigs(baseConfig, overrides);
      
      // Verify retryConfig merge
      expect(merged.retryConfig.maxAttempts).toBe(10);
      expect(merged.retryConfig.jitterFactor).toBe(0.5);
      expect(merged.retryConfig.baseDelayMs).toBe(baseConfig.retryConfig.baseDelayMs); // Unchanged
      expect(merged.retryConfig.maxDelayMs).toBe(baseConfig.retryConfig.maxDelayMs); // Unchanged
      
      // Verify healthCheck merge
      expect(merged.healthCheck.intervalMs).toBe(120000);
      expect(merged.healthCheck.failureThreshold).toBe(5);
      expect(merged.healthCheck.timeoutMs).toBe(baseConfig.healthCheck.timeoutMs); // Unchanged
      expect(merged.healthCheck.autoRecover).toBe(baseConfig.healthCheck.autoRecover); // Unchanged
    });

    it('should handle undefined nested objects in overrides', () => {
      const baseConfig = { ...DEVELOPMENT_CONFIG };
      const overrides = {
        poolMin: 10,
        // No nested objects
      };

      const merged = mergeConfigs(baseConfig, overrides);
      expect(merged.poolMin).toBe(10);
      expect(merged.retryConfig).toEqual(baseConfig.retryConfig);
      expect(merged.healthCheck).toEqual(baseConfig.healthCheck);
      expect(merged.journeyContext).toEqual(baseConfig.journeyContext);
      expect(merged.connectionPool).toEqual(baseConfig.connectionPool);
    });
  });

  describe('configFromEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset process.env before each test
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      // Restore original process.env after all tests
      process.env = originalEnv;
    });

    it('should parse numeric values from environment variables', () => {
      process.env.DATABASE_POOL_MIN = '5';
      process.env.DATABASE_POOL_MAX = '20';
      process.env.DATABASE_QUERY_TIMEOUT = '60000';

      const config = configFromEnvironment();
      expect(config.poolMin).toBe(5);
      expect(config.poolMax).toBe(20);
      expect(config.queryTimeout).toBe(60000);
    });

    it('should parse boolean values from environment variables', () => {
      process.env.DATABASE_ENABLE_QUERY_LOGGING = 'true';
      process.env.DATABASE_ENABLE_CIRCUIT_BREAKER = 'false';

      const config = configFromEnvironment();
      expect(config.enableQueryLogging).toBe(true);
      expect(config.enableCircuitBreaker).toBe(false);
    });

    it('should handle invalid numeric values', () => {
      process.env.DATABASE_POOL_MIN = 'not-a-number';
      
      const mockLogger = {
        warn: jest.fn(),
      } as unknown as Logger;

      const config = configFromEnvironment('DATABASE_', mockLogger);
      expect(config.poolMin).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid number value for DATABASE_POOL_MIN')
      );
    });

    it('should parse nested retry configuration', () => {
      process.env.DATABASE_RETRY_BASE_DELAY = '200';
      process.env.DATABASE_RETRY_MAX_ATTEMPTS = '5';

      const config = configFromEnvironment();
      expect(config.retryConfig).toBeDefined();
      expect(config.retryConfig.baseDelayMs).toBe(200);
      expect(config.retryConfig.maxAttempts).toBe(5);
    });

    it('should parse nested journey context configuration', () => {
      process.env.DATABASE_JOURNEY_CONTEXT_ENABLED = 'true';
      process.env.DATABASE_JOURNEY_SEPARATE_POOLS = 'true';
      process.env.DATABASE_JOURNEY_MAX_CONNECTIONS = '10';

      const config = configFromEnvironment();
      expect(config.journeyContext).toBeDefined();
      expect(config.journeyContext.enabled).toBe(true);
      expect(config.journeyContext.separateConnectionPools).toBe(true);
      expect(config.journeyContext.maxConnectionsPerJourney).toBe(10);
    });

    it('should use custom prefix for environment variables', () => {
      process.env.CUSTOM_POOL_MIN = '8';
      process.env.CUSTOM_ENABLE_QUERY_LOGGING = 'true';

      const config = configFromEnvironment('CUSTOM_');
      expect(config.poolMin).toBe(8);
      expect(config.enableQueryLogging).toBe(true);
    });

    it('should not include nested objects if no values are set', () => {
      // No environment variables set for nested objects
      const config = configFromEnvironment();
      expect(config.retryConfig).toBeUndefined();
      expect(config.journeyContext).toBeUndefined();
    });
  });

  describe('getJourneyConfig', () => {
    it('should apply health journey specific configuration', () => {
      const baseConfig = { ...DEVELOPMENT_CONFIG };
      const healthConfig = getJourneyConfig('health', baseConfig);

      // Verify health-specific overrides
      expect(healthConfig.poolMax).toBeGreaterThanOrEqual(15); // Higher connection limit
      expect(healthConfig.queryTimeout).toBe(45000); // Longer timeout
      expect(healthConfig.retryConfig.maxAttempts).toBe(4); // More retries

      // Verify other properties remain unchanged
      expect(healthConfig.poolMin).toBe(baseConfig.poolMin);
      expect(healthConfig.enableQueryLogging).toBe(baseConfig.enableQueryLogging);
    });

    it('should apply care journey specific configuration', () => {
      const baseConfig = { ...DEVELOPMENT_CONFIG };
      const careConfig = getJourneyConfig('care', baseConfig);

      // Verify care-specific overrides
      expect(careConfig.poolMax).toBeGreaterThanOrEqual(12);
      expect(careConfig.enableCircuitBreaker).toBe(true); // Always enabled
      expect(careConfig.retryConfig.baseDelayMs).toBe(200); // Longer base delay

      // Verify other properties remain unchanged
      expect(careConfig.poolMin).toBe(baseConfig.poolMin);
      expect(careConfig.enableQueryLogging).toBe(baseConfig.enableQueryLogging);
    });

    it('should apply plan journey specific configuration', () => {
      const baseConfig = { ...DEVELOPMENT_CONFIG };
      const planConfig = getJourneyConfig('plan', baseConfig);

      // Verify plan-specific overrides
      expect(planConfig.poolMax).toBeGreaterThanOrEqual(10);
      expect(planConfig.enableCircuitBreaker).toBe(true); // Always enabled
      expect(planConfig.queryTimeout).toBe(40000); // Longer timeout
      expect(planConfig.retryConfig.jitterFactor).toBe(0.2); // More jitter

      // Verify other properties remain unchanged
      expect(planConfig.poolMin).toBe(baseConfig.poolMin);
      expect(planConfig.enableQueryLogging).toBe(baseConfig.enableQueryLogging);
    });

    it('should respect existing configuration values when applying journey config', () => {
      // Create a custom base config with non-default values
      const customBaseConfig: ConnectionConfig = {
        ...DEVELOPMENT_CONFIG,
        poolMax: 25, // Higher than any journey-specific value
        queryTimeout: 60000, // Higher than any journey-specific value
      };

      const healthConfig = getJourneyConfig('health', customBaseConfig);

      // Should keep the higher poolMax from base config
      expect(healthConfig.poolMax).toBe(25);
      // Should still override queryTimeout with health-specific value
      expect(healthConfig.queryTimeout).toBe(45000);
    });
  });

  describe('createConfigUpdater', () => {
    it('should return initial configuration', () => {
      const initialConfig = { ...DEVELOPMENT_CONFIG };
      const { getConfig } = createConfigUpdater(initialConfig);

      const config = getConfig();
      expect(config).toEqual(initialConfig);
      // Verify it's a copy, not the same reference
      expect(config).not.toBe(initialConfig);
    });

    it('should update configuration with valid changes', () => {
      const initialConfig = { ...DEVELOPMENT_CONFIG };
      const { getConfig, updateConfig } = createConfigUpdater(initialConfig);

      const updates = {
        poolMin: 5,
        poolMax: 15,
        enableQueryLogging: false,
      };

      const updatedConfig = updateConfig(updates);
      expect(updatedConfig.poolMin).toBe(5);
      expect(updatedConfig.poolMax).toBe(15);
      expect(updatedConfig.enableQueryLogging).toBe(false);

      // Verify getConfig returns the updated config
      const config = getConfig();
      expect(config).toEqual(updatedConfig);
    });

    it('should throw ConfigValidationError for invalid updates', () => {
      const initialConfig = { ...DEVELOPMENT_CONFIG };
      const { updateConfig } = createConfigUpdater(initialConfig);

      const invalidUpdates = {
        poolMin: 20,
        poolMax: 10, // Invalid: poolMin > poolMax
      };

      expect(() => {
        updateConfig(invalidUpdates);
      }).toThrow(ConfigValidationError);

      // Verify original config is unchanged after failed update
      const { getConfig } = createConfigUpdater(initialConfig);
      expect(getConfig()).toEqual(initialConfig);
    });

    it('should apply multiple updates cumulatively', () => {
      const initialConfig = { ...DEVELOPMENT_CONFIG };
      const { getConfig, updateConfig } = createConfigUpdater(initialConfig);

      // First update
      updateConfig({
        poolMin: 5,
        poolMax: 15,
      });

      // Second update
      updateConfig({
        enableQueryLogging: false,
        retryConfig: {
          maxAttempts: 5,
        },
      });

      const finalConfig = getConfig();
      expect(finalConfig.poolMin).toBe(5);
      expect(finalConfig.poolMax).toBe(15);
      expect(finalConfig.enableQueryLogging).toBe(false);
      expect(finalConfig.retryConfig.maxAttempts).toBe(5);
      // Other retry config values should be unchanged
      expect(finalConfig.retryConfig.baseDelayMs).toBe(initialConfig.retryConfig.baseDelayMs);
    });

    it('should deep merge nested objects during updates', () => {
      const initialConfig = { ...DEVELOPMENT_CONFIG };
      const { getConfig, updateConfig } = createConfigUpdater(initialConfig);

      updateConfig({
        retryConfig: {
          maxAttempts: 5,
          jitterFactor: 0.3,
        },
        healthCheck: {
          intervalMs: 120000,
        },
      });

      const updatedConfig = getConfig();
      
      // Verify retryConfig merge
      expect(updatedConfig.retryConfig.maxAttempts).toBe(5);
      expect(updatedConfig.retryConfig.jitterFactor).toBe(0.3);
      expect(updatedConfig.retryConfig.baseDelayMs).toBe(initialConfig.retryConfig.baseDelayMs);
      
      // Verify healthCheck merge
      expect(updatedConfig.healthCheck.intervalMs).toBe(120000);
      expect(updatedConfig.healthCheck.timeoutMs).toBe(initialConfig.healthCheck.timeoutMs);
    });
  });
});