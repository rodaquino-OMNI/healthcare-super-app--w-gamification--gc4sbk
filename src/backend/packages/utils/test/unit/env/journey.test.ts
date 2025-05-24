import { afterEach, beforeEach, describe, expect, it, jest } from 'jest';

// Import the journey utilities that will be tested
import {
  getJourneyEnv,
  getRequiredJourneyEnv,
  getOptionalJourneyEnv,
  withJourneyPrefix,
  isJourneyEnv,
  getJourneyFeatureFlag,
  getSharedEnv,
  JourneyType,
} from '../../../src/env/journey';

// Mock the core env utilities that journey utilities depend on
jest.mock('../../../src/env/config', () => ({
  getEnv: jest.fn(),
  getRequiredEnv: jest.fn(),
  getOptionalEnv: jest.fn(),
}));

// Import the mocked utilities for use in tests
import { getEnv, getRequiredEnv, getOptionalEnv } from '../../../src/env/config';

describe('Journey Environment Utilities', () => {
  // Store the original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    
    // Create a fresh copy of process.env for each test
    process.env = { ...originalEnv };
    
    // Set up some test environment variables
    process.env.HEALTH_API_URL = 'https://health-api.austa.com';
    process.env.CARE_API_URL = 'https://care-api.austa.com';
    process.env.PLAN_API_URL = 'https://plan-api.austa.com';
    process.env.SHARED_API_KEY = 'shared-api-key-123';
    process.env.HEALTH_FEATURE_METRICS_ENABLED = 'true';
    process.env.CARE_FEATURE_TELEMEDICINE_ENABLED = 'true';
    process.env.PLAN_FEATURE_CLAIMS_ENABLED = 'true';
  });

  afterEach(() => {
    // Restore the original process.env
    process.env = originalEnv;
  });

  describe('withJourneyPrefix', () => {
    it('should prefix variable name with journey type', () => {
      expect(withJourneyPrefix('API_URL', JourneyType.HEALTH)).toBe('HEALTH_API_URL');
      expect(withJourneyPrefix('API_URL', JourneyType.CARE)).toBe('CARE_API_URL');
      expect(withJourneyPrefix('API_URL', JourneyType.PLAN)).toBe('PLAN_API_URL');
    });

    it('should handle feature flag prefixing', () => {
      expect(withJourneyPrefix('FEATURE_METRICS_ENABLED', JourneyType.HEALTH)).toBe('HEALTH_FEATURE_METRICS_ENABLED');
      expect(withJourneyPrefix('FEATURE_TELEMEDICINE_ENABLED', JourneyType.CARE)).toBe('CARE_FEATURE_TELEMEDICINE_ENABLED');
    });

    it('should throw error for invalid journey type', () => {
      // @ts-expect-error - Testing invalid journey type
      expect(() => withJourneyPrefix('API_URL', 'INVALID_JOURNEY')).toThrow();
    });
  });

  describe('isJourneyEnv', () => {
    it('should return true for variables with journey prefix', () => {
      expect(isJourneyEnv('HEALTH_API_URL')).toBe(true);
      expect(isJourneyEnv('CARE_API_URL')).toBe(true);
      expect(isJourneyEnv('PLAN_API_URL')).toBe(true);
    });

    it('should return false for variables without journey prefix', () => {
      expect(isJourneyEnv('SHARED_API_KEY')).toBe(false);
      expect(isJourneyEnv('API_URL')).toBe(false);
    });

    it('should identify journey type from variable name', () => {
      expect(isJourneyEnv('HEALTH_API_URL', JourneyType.HEALTH)).toBe(true);
      expect(isJourneyEnv('HEALTH_API_URL', JourneyType.CARE)).toBe(false);
      expect(isJourneyEnv('CARE_API_URL', JourneyType.CARE)).toBe(true);
      expect(isJourneyEnv('CARE_API_URL', JourneyType.PLAN)).toBe(false);
    });
  });

  describe('getJourneyEnv', () => {
    it('should get environment variable with journey prefix', () => {
      // Setup mock implementation
      (getEnv as jest.Mock).mockImplementation((name) => {
        if (name === 'HEALTH_API_URL') return 'https://health-api.austa.com';
        if (name === 'CARE_API_URL') return 'https://care-api.austa.com';
        if (name === 'PLAN_API_URL') return 'https://plan-api.austa.com';
        return undefined;
      });

      expect(getJourneyEnv('API_URL', JourneyType.HEALTH)).toBe('https://health-api.austa.com');
      expect(getJourneyEnv('API_URL', JourneyType.CARE)).toBe('https://care-api.austa.com');
      expect(getJourneyEnv('API_URL', JourneyType.PLAN)).toBe('https://plan-api.austa.com');

      // Verify that getEnv was called with the prefixed variable name
      expect(getEnv).toHaveBeenCalledWith('HEALTH_API_URL');
      expect(getEnv).toHaveBeenCalledWith('CARE_API_URL');
      expect(getEnv).toHaveBeenCalledWith('PLAN_API_URL');
    });

    it('should pass options to the underlying getEnv function', () => {
      // Setup mock implementation
      (getEnv as jest.Mock).mockReturnValue('https://health-api.austa.com');

      const options = { cache: false, transform: (val: string) => val.toUpperCase() };
      getJourneyEnv('API_URL', JourneyType.HEALTH, options);

      // Verify that options were passed to getEnv
      expect(getEnv).toHaveBeenCalledWith('HEALTH_API_URL', options);
    });
  });

  describe('getRequiredJourneyEnv', () => {
    it('should get required environment variable with journey prefix', () => {
      // Setup mock implementation
      (getRequiredEnv as jest.Mock).mockImplementation((name) => {
        if (name === 'HEALTH_API_URL') return 'https://health-api.austa.com';
        if (name === 'CARE_API_URL') return 'https://care-api.austa.com';
        if (name === 'PLAN_API_URL') return 'https://plan-api.austa.com';
        throw new Error(`Environment variable ${name} is required but not set`);
      });

      expect(getRequiredJourneyEnv('API_URL', JourneyType.HEALTH)).toBe('https://health-api.austa.com');
      expect(getRequiredJourneyEnv('API_URL', JourneyType.CARE)).toBe('https://care-api.austa.com');
      expect(getRequiredJourneyEnv('API_URL', JourneyType.PLAN)).toBe('https://plan-api.austa.com');

      // Verify that getRequiredEnv was called with the prefixed variable name
      expect(getRequiredEnv).toHaveBeenCalledWith('HEALTH_API_URL');
      expect(getRequiredEnv).toHaveBeenCalledWith('CARE_API_URL');
      expect(getRequiredEnv).toHaveBeenCalledWith('PLAN_API_URL');
    });

    it('should throw error when required journey variable is missing', () => {
      // Setup mock implementation to throw for missing variables
      (getRequiredEnv as jest.Mock).mockImplementation((name) => {
        throw new Error(`Environment variable ${name} is required but not set`);
      });

      expect(() => getRequiredJourneyEnv('MISSING_VAR', JourneyType.HEALTH)).toThrow();
      expect(getRequiredEnv).toHaveBeenCalledWith('HEALTH_MISSING_VAR');
    });

    it('should pass options to the underlying getRequiredEnv function', () => {
      // Setup mock implementation
      (getRequiredEnv as jest.Mock).mockReturnValue('https://health-api.austa.com');

      const options = { transform: (val: string) => val.toUpperCase() };
      getRequiredJourneyEnv('API_URL', JourneyType.HEALTH, options);

      // Verify that options were passed to getRequiredEnv
      expect(getRequiredEnv).toHaveBeenCalledWith('HEALTH_API_URL', options);
    });
  });

  describe('getOptionalJourneyEnv', () => {
    it('should get optional environment variable with journey prefix', () => {
      // Setup mock implementation
      (getOptionalEnv as jest.Mock).mockImplementation((name, defaultValue) => {
        if (name === 'HEALTH_API_URL') return 'https://health-api.austa.com';
        if (name === 'CARE_API_URL') return 'https://care-api.austa.com';
        if (name === 'PLAN_API_URL') return 'https://plan-api.austa.com';
        return defaultValue;
      });

      expect(getOptionalJourneyEnv('API_URL', JourneyType.HEALTH, 'default-url')).toBe('https://health-api.austa.com');
      expect(getOptionalJourneyEnv('API_URL', JourneyType.CARE, 'default-url')).toBe('https://care-api.austa.com');
      expect(getOptionalJourneyEnv('API_URL', JourneyType.PLAN, 'default-url')).toBe('https://plan-api.austa.com');

      // Verify that getOptionalEnv was called with the prefixed variable name and default value
      expect(getOptionalEnv).toHaveBeenCalledWith('HEALTH_API_URL', 'default-url');
      expect(getOptionalEnv).toHaveBeenCalledWith('CARE_API_URL', 'default-url');
      expect(getOptionalEnv).toHaveBeenCalledWith('PLAN_API_URL', 'default-url');
    });

    it('should return default value when optional journey variable is missing', () => {
      // Setup mock implementation to return default value
      (getOptionalEnv as jest.Mock).mockImplementation((name, defaultValue) => defaultValue);

      expect(getOptionalJourneyEnv('MISSING_VAR', JourneyType.HEALTH, 'default-value')).toBe('default-value');
      expect(getOptionalEnv).toHaveBeenCalledWith('HEALTH_MISSING_VAR', 'default-value');
    });

    it('should pass options to the underlying getOptionalEnv function', () => {
      // Setup mock implementation
      (getOptionalEnv as jest.Mock).mockReturnValue('https://health-api.austa.com');

      const options = { transform: (val: string) => val.toUpperCase() };
      getOptionalJourneyEnv('API_URL', JourneyType.HEALTH, 'default-url', options);

      // Verify that options were passed to getOptionalEnv
      expect(getOptionalEnv).toHaveBeenCalledWith('HEALTH_API_URL', 'default-url', options);
    });

    it('should support journey-specific default values', () => {
      // Setup mock implementation
      (getOptionalEnv as jest.Mock).mockImplementation((name, defaultValue) => defaultValue);

      const journeyDefaults = {
        [JourneyType.HEALTH]: 'health-default',
        [JourneyType.CARE]: 'care-default',
        [JourneyType.PLAN]: 'plan-default'
      };

      expect(getOptionalJourneyEnv('MISSING_VAR', JourneyType.HEALTH, journeyDefaults)).toBe('health-default');
      expect(getOptionalJourneyEnv('MISSING_VAR', JourneyType.CARE, journeyDefaults)).toBe('care-default');
      expect(getOptionalJourneyEnv('MISSING_VAR', JourneyType.PLAN, journeyDefaults)).toBe('plan-default');

      // Verify that getOptionalEnv was called with the correct default value for each journey
      expect(getOptionalEnv).toHaveBeenCalledWith('HEALTH_MISSING_VAR', 'health-default');
      expect(getOptionalEnv).toHaveBeenCalledWith('CARE_MISSING_VAR', 'care-default');
      expect(getOptionalEnv).toHaveBeenCalledWith('PLAN_MISSING_VAR', 'plan-default');
    });
  });

  describe('getJourneyFeatureFlag', () => {
    it('should get feature flag with journey prefix', () => {
      // Setup mock implementation
      (getOptionalEnv as jest.Mock).mockImplementation((name, defaultValue) => {
        if (name === 'HEALTH_FEATURE_METRICS_ENABLED') return 'true';
        if (name === 'CARE_FEATURE_TELEMEDICINE_ENABLED') return 'true';
        if (name === 'PLAN_FEATURE_CLAIMS_ENABLED') return 'true';
        return defaultValue;
      });

      expect(getJourneyFeatureFlag('METRICS_ENABLED', JourneyType.HEALTH)).toBe(true);
      expect(getJourneyFeatureFlag('TELEMEDICINE_ENABLED', JourneyType.CARE)).toBe(true);
      expect(getJourneyFeatureFlag('CLAIMS_ENABLED', JourneyType.PLAN)).toBe(true);

      // Verify that getOptionalEnv was called with the prefixed feature flag name
      expect(getOptionalEnv).toHaveBeenCalledWith('HEALTH_FEATURE_METRICS_ENABLED', false);
      expect(getOptionalEnv).toHaveBeenCalledWith('CARE_FEATURE_TELEMEDICINE_ENABLED', false);
      expect(getOptionalEnv).toHaveBeenCalledWith('PLAN_FEATURE_CLAIMS_ENABLED', false);
    });

    it('should return false when feature flag is not set', () => {
      // Setup mock implementation to return default value
      (getOptionalEnv as jest.Mock).mockImplementation((name, defaultValue) => defaultValue);

      expect(getJourneyFeatureFlag('MISSING_FEATURE', JourneyType.HEALTH)).toBe(false);
      expect(getOptionalEnv).toHaveBeenCalledWith('HEALTH_FEATURE_MISSING_FEATURE', false);
    });

    it('should handle different boolean string representations', () => {
      // Test various string representations of boolean values
      const testCases = [
        { input: 'true', expected: true },
        { input: 'yes', expected: true },
        { input: '1', expected: true },
        { input: 'false', expected: false },
        { input: 'no', expected: false },
        { input: '0', expected: false },
        { input: 'invalid', expected: false }
      ];

      for (const testCase of testCases) {
        // Setup mock implementation for this test case
        (getOptionalEnv as jest.Mock).mockReturnValue(testCase.input);

        expect(getJourneyFeatureFlag('TEST_FEATURE', JourneyType.HEALTH)).toBe(testCase.expected);
      }
    });

    it('should allow overriding the default value', () => {
      // Setup mock implementation to return default value
      (getOptionalEnv as jest.Mock).mockImplementation((name, defaultValue) => defaultValue);

      expect(getJourneyFeatureFlag('MISSING_FEATURE', JourneyType.HEALTH, true)).toBe(true);
      expect(getOptionalEnv).toHaveBeenCalledWith('HEALTH_FEATURE_MISSING_FEATURE', true);
    });
  });

  describe('getSharedEnv', () => {
    it('should get shared environment variable without journey prefix', () => {
      // Setup mock implementation
      (getEnv as jest.Mock).mockImplementation((name) => {
        if (name === 'SHARED_API_KEY') return 'shared-api-key-123';
        return undefined;
      });

      expect(getSharedEnv('SHARED_API_KEY')).toBe('shared-api-key-123');
      expect(getEnv).toHaveBeenCalledWith('SHARED_API_KEY');
    });

    it('should get required shared environment variable', () => {
      // Setup mock implementation
      (getRequiredEnv as jest.Mock).mockImplementation((name) => {
        if (name === 'SHARED_API_KEY') return 'shared-api-key-123';
        throw new Error(`Environment variable ${name} is required but not set`);
      });

      expect(getSharedEnv('SHARED_API_KEY', { required: true })).toBe('shared-api-key-123');
      expect(getRequiredEnv).toHaveBeenCalledWith('SHARED_API_KEY');
    });

    it('should get optional shared environment variable with default value', () => {
      // Setup mock implementation
      (getOptionalEnv as jest.Mock).mockImplementation((name, defaultValue) => {
        if (name === 'SHARED_API_KEY') return 'shared-api-key-123';
        return defaultValue;
      });

      expect(getSharedEnv('MISSING_SHARED_VAR', { defaultValue: 'default-value' })).toBe('default-value');
      expect(getOptionalEnv).toHaveBeenCalledWith('MISSING_SHARED_VAR', 'default-value');
    });

    it('should pass transform option to the underlying env function', () => {
      // Setup mock implementation
      (getEnv as jest.Mock).mockReturnValue('shared-api-key-123');

      const transform = (val: string) => val.toUpperCase();
      getSharedEnv('SHARED_API_KEY', { transform });

      // Verify that transform was passed to getEnv
      expect(getEnv).toHaveBeenCalledWith('SHARED_API_KEY', { transform });
    });

    it('should throw error when trying to access journey-specific variable', () => {
      // Verify that attempting to access a journey-specific variable with getSharedEnv throws an error
      expect(() => getSharedEnv('HEALTH_API_URL')).toThrow();
      expect(() => getSharedEnv('CARE_API_URL')).toThrow();
      expect(() => getSharedEnv('PLAN_API_URL')).toThrow();
    });
  });
});