import { JourneyType, CrossJourneyConfig, getJourneyEnvName, getJourneyEnv, getRequiredJourneyEnv, getJourneyFeatureFlag, isFeatureEnabled, isFeatureEnabledForUser, getSharedJourneyEnv, getRequiredSharedJourneyEnv, getAllJourneyEnvs, clearEnvCache } from '../../../src/env/journey';
import { MissingEnvironmentVariableError } from '../../../src/env/error';

describe('Journey Environment Utilities', () => {
  // Store original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Clear the environment cache
    clearEnvCache();
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
  });

  afterAll(() => {
    // Ensure process.env is restored after all tests
    process.env = originalEnv;
  });

  describe('getJourneyEnvName', () => {
    it('should prefix environment variable names with journey type', () => {
      expect(getJourneyEnvName(JourneyType.HEALTH, 'API_URL')).toBe('HEALTH_API_URL');
      expect(getJourneyEnvName(JourneyType.CARE, 'API_URL')).toBe('CARE_API_URL');
      expect(getJourneyEnvName(JourneyType.PLAN, 'API_URL')).toBe('PLAN_API_URL');
      expect(getJourneyEnvName(JourneyType.SHARED, 'API_URL')).toBe('SHARED_API_URL');
    });

    it('should handle variable names with underscores', () => {
      expect(getJourneyEnvName(JourneyType.HEALTH, 'API_BASE_URL')).toBe('HEALTH_API_BASE_URL');
    });

    it('should handle lowercase journey types correctly', () => {
      // JourneyType enum values are lowercase, but the function should convert to uppercase
      expect(getJourneyEnvName(JourneyType.HEALTH, 'DEBUG')).toBe('HEALTH_DEBUG');
    });
  });

  describe('getJourneyEnv', () => {
    it('should retrieve journey-specific environment variables', () => {
      // Set up test environment variables
      process.env.HEALTH_API_URL = 'https://health-api.austa.com';
      process.env.CARE_API_URL = 'https://care-api.austa.com';
      process.env.PLAN_API_URL = 'https://plan-api.austa.com';

      // Test retrieval
      expect(getJourneyEnv(JourneyType.HEALTH, 'API_URL')).toBe('https://health-api.austa.com');
      expect(getJourneyEnv(JourneyType.CARE, 'API_URL')).toBe('https://care-api.austa.com');
      expect(getJourneyEnv(JourneyType.PLAN, 'API_URL')).toBe('https://plan-api.austa.com');
    });

    it('should return undefined for non-existent variables', () => {
      expect(getJourneyEnv(JourneyType.HEALTH, 'NON_EXISTENT')).toBeUndefined();
    });

    it('should use default values when variables are not set', () => {
      expect(getJourneyEnv(JourneyType.HEALTH, 'DEBUG', 'false')).toBe('false');
      expect(getJourneyEnv(JourneyType.CARE, 'TIMEOUT', '30000')).toBe('30000');
    });

    it('should cache environment variable values', () => {
      // Set initial value
      process.env.HEALTH_CACHE_TEST = 'initial';
      
      // First access should cache the value
      expect(getJourneyEnv(JourneyType.HEALTH, 'CACHE_TEST')).toBe('initial');
      
      // Change the value in process.env
      process.env.HEALTH_CACHE_TEST = 'changed';
      
      // Second access should return cached value
      expect(getJourneyEnv(JourneyType.HEALTH, 'CACHE_TEST')).toBe('initial');
      
      // Clear cache
      clearEnvCache();
      
      // After clearing cache, should get the new value
      expect(getJourneyEnv(JourneyType.HEALTH, 'CACHE_TEST')).toBe('changed');
    });
  });

  describe('getRequiredJourneyEnv', () => {
    it('should retrieve required journey-specific environment variables', () => {
      // Set up test environment variables
      process.env.HEALTH_REQUIRED_VAR = 'required-value';

      // Test retrieval
      expect(getRequiredJourneyEnv(JourneyType.HEALTH, 'REQUIRED_VAR')).toBe('required-value');
    });

    it('should use default values when variables are not set', () => {
      expect(getRequiredJourneyEnv(JourneyType.HEALTH, 'DEFAULT_VAR', 'default-value')).toBe('default-value');
    });

    it('should throw MissingEnvironmentVariableError for missing required variables', () => {
      expect(() => {
        getRequiredJourneyEnv(JourneyType.HEALTH, 'MISSING_VAR');
      }).toThrow(MissingEnvironmentVariableError);

      expect(() => {
        getRequiredJourneyEnv(JourneyType.HEALTH, 'MISSING_VAR');
      }).toThrow('Required journey-specific environment variable HEALTH_MISSING_VAR is not set');
    });
  });

  describe('getJourneyFeatureFlag', () => {
    it('should retrieve feature flag configuration', () => {
      // Set up test environment variables
      process.env.HEALTH_FEATURE_TEST_FEATURE = 'true';
      process.env.HEALTH_FEATURE_TEST_FEATURE_PERCENTAGE = '50';

      // Test retrieval
      const featureFlag = getJourneyFeatureFlag(JourneyType.HEALTH, 'TEST_FEATURE');
      expect(featureFlag).toEqual({
        journeyType: JourneyType.HEALTH,
        featureName: 'TEST_FEATURE',
        enabled: true,
        rolloutPercentage: 50
      });
    });

    it('should use default enabled state when not specified', () => {
      // Test with default true
      const featureFlagTrue = getJourneyFeatureFlag(JourneyType.CARE, 'DEFAULT_TRUE', true);
      expect(featureFlagTrue.enabled).toBe(true);

      // Test with default false
      const featureFlagFalse = getJourneyFeatureFlag(JourneyType.CARE, 'DEFAULT_FALSE', false);
      expect(featureFlagFalse.enabled).toBe(false);
    });

    it('should handle various boolean formats', () => {
      // Test different boolean string formats
      process.env.HEALTH_FEATURE_BOOL_TRUE = 'true';
      process.env.HEALTH_FEATURE_BOOL_YES = 'yes';
      process.env.HEALTH_FEATURE_BOOL_1 = '1';
      process.env.HEALTH_FEATURE_BOOL_FALSE = 'false';
      process.env.HEALTH_FEATURE_BOOL_NO = 'no';
      process.env.HEALTH_FEATURE_BOOL_0 = '0';

      expect(getJourneyFeatureFlag(JourneyType.HEALTH, 'BOOL_TRUE').enabled).toBe(true);
      expect(getJourneyFeatureFlag(JourneyType.HEALTH, 'BOOL_YES').enabled).toBe(true);
      expect(getJourneyFeatureFlag(JourneyType.HEALTH, 'BOOL_1').enabled).toBe(true);
      expect(getJourneyFeatureFlag(JourneyType.HEALTH, 'BOOL_FALSE').enabled).toBe(false);
      expect(getJourneyFeatureFlag(JourneyType.HEALTH, 'BOOL_NO').enabled).toBe(false);
      expect(getJourneyFeatureFlag(JourneyType.HEALTH, 'BOOL_0').enabled).toBe(false);
    });

    it('should handle invalid percentage values', () => {
      // Test invalid percentage values
      process.env.HEALTH_FEATURE_INVALID_PERCENTAGE = 'true';
      process.env.HEALTH_FEATURE_INVALID_PERCENTAGE_PERCENTAGE = 'not-a-number';

      const featureFlag = getJourneyFeatureFlag(JourneyType.HEALTH, 'INVALID_PERCENTAGE');
      expect(featureFlag.enabled).toBe(true);
      expect(featureFlag.rolloutPercentage).toBeUndefined();
    });

    it('should clamp percentage values to 0-100 range', () => {
      // Test percentage values outside valid range
      process.env.HEALTH_FEATURE_OVER_PERCENTAGE = 'true';
      process.env.HEALTH_FEATURE_OVER_PERCENTAGE_PERCENTAGE = '150';
      process.env.HEALTH_FEATURE_UNDER_PERCENTAGE = 'true';
      process.env.HEALTH_FEATURE_UNDER_PERCENTAGE_PERCENTAGE = '-50';

      const overFeatureFlag = getJourneyFeatureFlag(JourneyType.HEALTH, 'OVER_PERCENTAGE');
      expect(overFeatureFlag.rolloutPercentage).toBe(100);

      const underFeatureFlag = getJourneyFeatureFlag(JourneyType.HEALTH, 'UNDER_PERCENTAGE');
      expect(underFeatureFlag.rolloutPercentage).toBe(0);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      process.env.HEALTH_FEATURE_ENABLED_FEATURE = 'true';
      expect(isFeatureEnabled(JourneyType.HEALTH, 'ENABLED_FEATURE')).toBe(true);
    });

    it('should return false for disabled features', () => {
      process.env.CARE_FEATURE_DISABLED_FEATURE = 'false';
      expect(isFeatureEnabled(JourneyType.CARE, 'DISABLED_FEATURE')).toBe(false);
    });

    it('should use default value when feature flag is not set', () => {
      expect(isFeatureEnabled(JourneyType.PLAN, 'DEFAULT_TRUE_FEATURE', true)).toBe(true);
      expect(isFeatureEnabled(JourneyType.PLAN, 'DEFAULT_FALSE_FEATURE', false)).toBe(false);
    });
  });

  describe('isFeatureEnabledForUser', () => {
    it('should return false if feature is globally disabled', () => {
      process.env.HEALTH_FEATURE_DISABLED_FEATURE = 'false';
      process.env.HEALTH_FEATURE_DISABLED_FEATURE_PERCENTAGE = '100';

      expect(isFeatureEnabledForUser(JourneyType.HEALTH, 'DISABLED_FEATURE', 'user-123')).toBe(false);
    });

    it('should return true if feature is enabled with no percentage rollout', () => {
      process.env.CARE_FEATURE_ENABLED_FEATURE = 'true';

      expect(isFeatureEnabledForUser(JourneyType.CARE, 'ENABLED_FEATURE', 'user-123')).toBe(true);
    });

    it('should be deterministic for the same user and feature', () => {
      process.env.PLAN_FEATURE_PERCENTAGE_FEATURE = 'true';
      process.env.PLAN_FEATURE_PERCENTAGE_FEATURE_PERCENTAGE = '50';

      const userId = 'user-456';
      const result1 = isFeatureEnabledForUser(JourneyType.PLAN, 'PERCENTAGE_FEATURE', userId);
      const result2 = isFeatureEnabledForUser(JourneyType.PLAN, 'PERCENTAGE_FEATURE', userId);

      expect(result1).toBe(result2);
    });

    it('should be different for different users with the same feature', () => {
      // This test is probabilistic and could occasionally fail
      // We'll run multiple tests to reduce the chance of false positives
      process.env.HEALTH_FEATURE_MULTI_USER = 'true';
      process.env.HEALTH_FEATURE_MULTI_USER_PERCENTAGE = '50';

      // Generate results for multiple users
      const results = new Array(10).fill(0).map((_, i) => {
        return isFeatureEnabledForUser(JourneyType.HEALTH, 'MULTI_USER', `user-${i}`);
      });

      // There should be at least one true and one false in the results
      // This is probabilistic but with 10 users and 50% rollout, the chance of all being the same is very low
      const hasTrueResult = results.some(result => result === true);
      const hasFalseResult = results.some(result => result === false);

      expect(hasTrueResult).toBe(true);
      expect(hasFalseResult).toBe(true);
    });

    it('should respect percentage rollout thresholds', () => {
      // Test with 0% rollout - should be disabled for all users
      process.env.PLAN_FEATURE_ZERO_PERCENT = 'true';
      process.env.PLAN_FEATURE_ZERO_PERCENT_PERCENTAGE = '0';

      expect(isFeatureEnabledForUser(JourneyType.PLAN, 'ZERO_PERCENT', 'any-user')).toBe(false);

      // Test with 100% rollout - should be enabled for all users
      process.env.PLAN_FEATURE_FULL_PERCENT = 'true';
      process.env.PLAN_FEATURE_FULL_PERCENT_PERCENTAGE = '100';

      expect(isFeatureEnabledForUser(JourneyType.PLAN, 'FULL_PERCENT', 'any-user')).toBe(true);
    });
  });

  describe('getSharedJourneyEnv', () => {
    it('should retrieve shared environment variables', () => {
      // Set up test environment variables
      process.env.SHARED_DATABASE_URL = 'shared-db-url';

      const config: CrossJourneyConfig = {
        shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
        variableName: 'DATABASE_URL'
      };

      expect(getSharedJourneyEnv(config)).toBe('shared-db-url');
    });

    it('should fall back to journey-specific variables in order', () => {
      // Set up test environment variables
      process.env.HEALTH_FALLBACK_VAR = 'health-value';
      process.env.CARE_FALLBACK_VAR = 'care-value';

      const config: CrossJourneyConfig = {
        shareAcross: [JourneyType.PLAN, JourneyType.CARE, JourneyType.HEALTH],
        variableName: 'FALLBACK_VAR'
      };

      // Should get CARE value since PLAN is not set and CARE comes before HEALTH in the list
      expect(getSharedJourneyEnv(config)).toBe('care-value');
    });

    it('should use default value when no variables are set', () => {
      const config: CrossJourneyConfig = {
        shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
        variableName: 'DEFAULT_VAR',
        defaultValue: 'default-value'
      };

      expect(getSharedJourneyEnv(config)).toBe('default-value');
    });

    it('should return undefined when no variables are set and no default is provided', () => {
      const config: CrossJourneyConfig = {
        shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
        variableName: 'MISSING_VAR'
      };

      expect(getSharedJourneyEnv(config)).toBeUndefined();
    });
  });

  describe('getRequiredSharedJourneyEnv', () => {
    it('should retrieve required shared environment variables', () => {
      // Set up test environment variables
      process.env.SHARED_REQUIRED_VAR = 'shared-required-value';

      const config: CrossJourneyConfig = {
        shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
        variableName: 'REQUIRED_VAR'
      };

      expect(getRequiredSharedJourneyEnv(config)).toBe('shared-required-value');
    });

    it('should fall back to journey-specific variables', () => {
      // Set up test environment variables
      process.env.CARE_JOURNEY_VAR = 'care-journey-value';

      const config: CrossJourneyConfig = {
        shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
        variableName: 'JOURNEY_VAR'
      };

      expect(getRequiredSharedJourneyEnv(config)).toBe('care-journey-value');
    });

    it('should use default value when no variables are set', () => {
      const config: CrossJourneyConfig = {
        shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
        variableName: 'DEFAULT_REQUIRED_VAR',
        defaultValue: 'default-required-value'
      };

      expect(getRequiredSharedJourneyEnv(config)).toBe('default-required-value');
    });

    it('should throw MissingEnvironmentVariableError when no variables are set and no default is provided', () => {
      const config: CrossJourneyConfig = {
        shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
        variableName: 'MISSING_REQUIRED_VAR'
      };

      expect(() => {
        getRequiredSharedJourneyEnv(config);
      }).toThrow(MissingEnvironmentVariableError);

      expect(() => {
        getRequiredSharedJourneyEnv(config);
      }).toThrow('Required shared environment variable MISSING_REQUIRED_VAR is not set in any journey: health, care, plan');
    });
  });

  describe('getAllJourneyEnvs', () => {
    it('should retrieve all environment variables for a journey', () => {
      // Set up test environment variables
      process.env.HEALTH_API_URL = 'https://health-api.austa.com';
      process.env.HEALTH_DATABASE_URL = 'health-db-url';
      process.env.HEALTH_DEBUG = 'true';
      process.env.CARE_API_URL = 'https://care-api.austa.com'; // Should not be included

      const healthEnvs = getAllJourneyEnvs(JourneyType.HEALTH);

      expect(healthEnvs).toEqual({
        API_URL: 'https://health-api.austa.com',
        DATABASE_URL: 'health-db-url',
        DEBUG: 'true'
      });

      // Should not include variables from other journeys
      expect(healthEnvs.CARE_API_URL).toBeUndefined();
    });

    it('should return an empty object when no variables exist for a journey', () => {
      // Ensure no TEST_JOURNEY variables exist
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('TEST_JOURNEY_')) {
          delete process.env[key];
        }
      });

      const testJourneyEnvs = getAllJourneyEnvs(JourneyType.SHARED);
      expect(Object.keys(testJourneyEnvs).length).toBe(0);
    });

    it('should handle variables with undefined values', () => {
      // Set up test environment variables
      process.env.PLAN_DEFINED = 'defined-value';
      process.env.PLAN_UNDEFINED = undefined;

      const planEnvs = getAllJourneyEnvs(JourneyType.PLAN);

      expect(planEnvs.DEFINED).toBe('defined-value');
      expect('UNDEFINED' in planEnvs).toBe(false);
    });
  });

  describe('clearEnvCache', () => {
    it('should clear the environment variable cache', () => {
      // Set up test environment variables
      process.env.HEALTH_CACHE_TEST = 'initial';
      
      // First access should cache the value
      expect(getJourneyEnv(JourneyType.HEALTH, 'CACHE_TEST')).toBe('initial');
      
      // Change the value in process.env
      process.env.HEALTH_CACHE_TEST = 'changed';
      
      // Second access should return cached value
      expect(getJourneyEnv(JourneyType.HEALTH, 'CACHE_TEST')).toBe('initial');
      
      // Clear cache
      clearEnvCache();
      
      // After clearing cache, should get the new value
      expect(getJourneyEnv(JourneyType.HEALTH, 'CACHE_TEST')).toBe('changed');
    });
  });
});