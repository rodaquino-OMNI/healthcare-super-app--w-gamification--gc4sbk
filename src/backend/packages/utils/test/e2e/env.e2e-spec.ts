import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Injectable } from '@nestjs/common';
import { describe, it, beforeEach, afterEach, expect, beforeAll, afterAll } from '@jest/globals';

// Import environment utilities
import {
  getEnv,
  getRequiredEnv,
  getOptionalEnv,
  parseBoolean,
  parseNumber,
  parseArray,
  parseJson,
  validateEnv,
  validateUrl,
  validateNumericRange,
  getJourneyEnv,
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
} from '../../../src/env';

/**
 * Test service that uses environment utilities to demonstrate their usage
 * in a realistic application context.
 */
@Injectable()
class TestEnvService {
  // Basic environment access
  getBasicConfig() {
    return {
      apiKey: getRequiredEnv('TEST_API_KEY'),
      debug: getOptionalEnv('TEST_DEBUG', 'false', parseBoolean),
      port: getOptionalEnv('TEST_PORT', '3000', parseNumber),
      hosts: getOptionalEnv('TEST_HOSTS', 'localhost,127.0.0.1', parseArray),
    };
  }

  // Journey-specific configuration
  getHealthJourneyConfig() {
    return {
      apiEndpoint: getJourneyEnv('health', 'API_ENDPOINT', 'https://health-api.default'),
      featureFlags: getJourneyEnv('health', 'FEATURE_FLAGS', '{"newDashboard":true}', parseJson),
    };
  }

  getCareJourneyConfig() {
    return {
      apiEndpoint: getJourneyEnv('care', 'API_ENDPOINT', 'https://care-api.default'),
      featureFlags: getJourneyEnv('care', 'FEATURE_FLAGS', '{"telehealth":true}', parseJson),
    };
  }

  getPlanJourneyConfig() {
    return {
      apiEndpoint: getJourneyEnv('plan', 'API_ENDPOINT', 'https://plan-api.default'),
      featureFlags: getJourneyEnv('plan', 'FEATURE_FLAGS', '{"newClaimsFlow":false}', parseJson),
    };
  }

  // Validation examples
  validateApiEndpoint() {
    const endpoint = getRequiredEnv('TEST_API_ENDPOINT');
    return validateUrl(endpoint, { protocols: ['https'] });
  }

  validateRateLimit() {
    const rateLimit = getRequiredEnv('TEST_RATE_LIMIT', parseNumber);
    return validateNumericRange(rateLimit, { min: 1, max: 100 });
  }

  // Comprehensive validation
  validateAllConfig() {
    return validateEnv({
      TEST_API_KEY: { required: true },
      TEST_DEBUG: { required: false, transform: parseBoolean },
      TEST_PORT: { required: false, transform: parseNumber, validate: (val) => val > 0 && val < 65536 },
      TEST_API_ENDPOINT: { required: true, validate: (val) => val.startsWith('https://') },
      TEST_RATE_LIMIT: { required: true, transform: parseNumber, validate: (val) => val > 0 },
    });
  }
}

/**
 * Test module that provides the TestEnvService.
 */
@Module({
  providers: [TestEnvService],
  exports: [TestEnvService],
})
class TestEnvModule {}

/**
 * End-to-end tests for environment configuration utilities that validate
 * environment variable handling in realistic application settings.
 */
describe('Environment Configuration Utilities (e2e)', () => {
  let app: INestApplication;
  let testEnvService: TestEnvService;
  let originalEnv: NodeJS.ProcessEnv;

  // Save original environment variables before tests
  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  // Restore original environment variables after all tests
  afterAll(() => {
    process.env = originalEnv;
  });

  // Set up test environment before each test
  beforeEach(async () => {
    // Reset environment variables for each test
    process.env = { ...originalEnv };
    
    // Set up test environment variables
    process.env.TEST_API_KEY = 'test-api-key';
    process.env.TEST_DEBUG = 'true';
    process.env.TEST_PORT = '4000';
    process.env.TEST_HOSTS = 'server1,server2,server3';
    process.env.TEST_API_ENDPOINT = 'https://api.example.com';
    process.env.TEST_RATE_LIMIT = '50';
    
    // Journey-specific environment variables
    process.env.HEALTH_API_ENDPOINT = 'https://health.example.com';
    process.env.HEALTH_FEATURE_FLAGS = '{"newDashboard":true,"healthMetrics":true}';
    process.env.CARE_API_ENDPOINT = 'https://care.example.com';
    process.env.CARE_FEATURE_FLAGS = '{"telehealth":true,"appointmentReminders":true}';
    process.env.PLAN_API_ENDPOINT = 'https://plan.example.com';
    process.env.PLAN_FEATURE_FLAGS = '{"newClaimsFlow":true,"digitalCards":true}';

    // Create a testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestEnvModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    testEnvService = moduleFixture.get<TestEnvService>(TestEnvService);
  });

  // Clean up after each test
  afterEach(async () => {
    await app.close();
  });

  describe('Basic Environment Variable Access', () => {
    it('should retrieve basic configuration from environment variables', () => {
      const config = testEnvService.getBasicConfig();
      
      expect(config.apiKey).toBe('test-api-key');
      expect(config.debug).toBe(true);
      expect(config.port).toBe(4000);
      expect(config.hosts).toEqual(['server1', 'server2', 'server3']);
    });

    it('should use default values when environment variables are not set', () => {
      // Remove environment variables to test defaults
      delete process.env.TEST_DEBUG;
      delete process.env.TEST_PORT;
      delete process.env.TEST_HOSTS;

      const config = testEnvService.getBasicConfig();
      
      expect(config.apiKey).toBe('test-api-key'); // Required, so still present
      expect(config.debug).toBe(false); // Default value
      expect(config.port).toBe(3000); // Default value
      expect(config.hosts).toEqual(['localhost', '127.0.0.1']); // Default value
    });

    it('should throw MissingEnvironmentVariableError for required variables that are not set', () => {
      // Remove required environment variable
      delete process.env.TEST_API_KEY;

      expect(() => testEnvService.getBasicConfig()).toThrow(MissingEnvironmentVariableError);
    });
  });

  describe('Type Conversion', () => {
    it('should correctly parse boolean values', () => {
      process.env.TEST_DEBUG = 'true';
      expect(getEnv('TEST_DEBUG', parseBoolean)).toBe(true);

      process.env.TEST_DEBUG = 'false';
      expect(getEnv('TEST_DEBUG', parseBoolean)).toBe(false);

      process.env.TEST_DEBUG = '1';
      expect(getEnv('TEST_DEBUG', parseBoolean)).toBe(true);

      process.env.TEST_DEBUG = '0';
      expect(getEnv('TEST_DEBUG', parseBoolean)).toBe(false);
    });

    it('should correctly parse numeric values', () => {
      process.env.TEST_PORT = '4000';
      expect(getEnv('TEST_PORT', parseNumber)).toBe(4000);

      process.env.TEST_FLOAT = '3.14';
      expect(getEnv('TEST_FLOAT', parseNumber)).toBe(3.14);
    });

    it('should correctly parse array values', () => {
      process.env.TEST_ARRAY = 'a,b,c';
      expect(getEnv('TEST_ARRAY', parseArray)).toEqual(['a', 'b', 'c']);

      process.env.TEST_ARRAY = 'a;b;c';
      expect(getEnv('TEST_ARRAY', (val) => parseArray(val, ';'))).toEqual(['a', 'b', 'c']);
    });

    it('should correctly parse JSON values', () => {
      process.env.TEST_JSON = '{"key":"value","nested":{"array":[1,2,3]}}';
      const parsed = getEnv('TEST_JSON', parseJson);
      
      expect(parsed).toEqual({
        key: 'value',
        nested: {
          array: [1, 2, 3]
        }
      });
    });

    it('should throw InvalidEnvironmentVariableError for invalid type conversions', () => {
      process.env.TEST_PORT = 'not-a-number';
      expect(() => getEnv('TEST_PORT', parseNumber)).toThrow(InvalidEnvironmentVariableError);

      process.env.TEST_JSON = '{invalid-json}';
      expect(() => getEnv('TEST_JSON', parseJson)).toThrow(InvalidEnvironmentVariableError);
    });
  });

  describe('Journey-Specific Configuration', () => {
    it('should retrieve health journey configuration', () => {
      const config = testEnvService.getHealthJourneyConfig();
      
      expect(config.apiEndpoint).toBe('https://health.example.com');
      expect(config.featureFlags).toEqual({
        newDashboard: true,
        healthMetrics: true
      });
    });

    it('should retrieve care journey configuration', () => {
      const config = testEnvService.getCareJourneyConfig();
      
      expect(config.apiEndpoint).toBe('https://care.example.com');
      expect(config.featureFlags).toEqual({
        telehealth: true,
        appointmentReminders: true
      });
    });

    it('should retrieve plan journey configuration', () => {
      const config = testEnvService.getPlanJourneyConfig();
      
      expect(config.apiEndpoint).toBe('https://plan.example.com');
      expect(config.featureFlags).toEqual({
        newClaimsFlow: true,
        digitalCards: true
      });
    });

    it('should use journey-specific defaults when environment variables are not set', () => {
      // Remove journey-specific environment variables
      delete process.env.HEALTH_API_ENDPOINT;
      delete process.env.HEALTH_FEATURE_FLAGS;

      const config = testEnvService.getHealthJourneyConfig();
      
      expect(config.apiEndpoint).toBe('https://health-api.default');
      expect(config.featureFlags).toEqual({ newDashboard: true });
    });

    it('should handle cross-journey configuration isolation', () => {
      // Modify one journey's configuration
      process.env.HEALTH_API_ENDPOINT = 'https://health-modified.example.com';
      
      // Health journey should see the modified value
      expect(testEnvService.getHealthJourneyConfig().apiEndpoint).toBe('https://health-modified.example.com');
      
      // Other journeys should be unaffected
      expect(testEnvService.getCareJourneyConfig().apiEndpoint).toBe('https://care.example.com');
      expect(testEnvService.getPlanJourneyConfig().apiEndpoint).toBe('https://plan.example.com');
    });
  });

  describe('Environment Validation', () => {
    it('should validate URL format', () => {
      process.env.TEST_API_ENDPOINT = 'https://api.example.com';
      expect(testEnvService.validateApiEndpoint()).toBe(true);

      process.env.TEST_API_ENDPOINT = 'http://api.example.com';
      expect(() => testEnvService.validateApiEndpoint()).toThrow(InvalidEnvironmentVariableError);

      process.env.TEST_API_ENDPOINT = 'not-a-url';
      expect(() => testEnvService.validateApiEndpoint()).toThrow(InvalidEnvironmentVariableError);
    });

    it('should validate numeric ranges', () => {
      process.env.TEST_RATE_LIMIT = '50';
      expect(testEnvService.validateRateLimit()).toBe(true);

      process.env.TEST_RATE_LIMIT = '0';
      expect(() => testEnvService.validateRateLimit()).toThrow(InvalidEnvironmentVariableError);

      process.env.TEST_RATE_LIMIT = '101';
      expect(() => testEnvService.validateRateLimit()).toThrow(InvalidEnvironmentVariableError);
    });

    it('should perform comprehensive validation of multiple environment variables', () => {
      // All variables are valid
      const validResult = testEnvService.validateAllConfig();
      expect(validResult.isValid).toBe(true);
      expect(validResult.values).toEqual({
        TEST_API_KEY: 'test-api-key',
        TEST_DEBUG: true,
        TEST_PORT: 4000,
        TEST_API_ENDPOINT: 'https://api.example.com',
        TEST_RATE_LIMIT: 50
      });

      // Make some variables invalid
      process.env.TEST_PORT = '-1';
      process.env.TEST_API_ENDPOINT = 'http://invalid-protocol.com';
      
      const invalidResult = testEnvService.validateAllConfig();
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBe(2);
      expect(invalidResult.errors[0].name).toBe('TEST_PORT');
      expect(invalidResult.errors[1].name).toBe('TEST_API_ENDPOINT');
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error messages for missing variables', () => {
      delete process.env.TEST_API_KEY;
      
      try {
        testEnvService.getBasicConfig();
        fail('Expected MissingEnvironmentVariableError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingEnvironmentVariableError);
        expect(error.message).toContain('TEST_API_KEY');
        expect(error.variableName).toBe('TEST_API_KEY');
      }
    });

    it('should provide detailed error messages for invalid variables', () => {
      process.env.TEST_PORT = 'not-a-number';
      
      try {
        testEnvService.getBasicConfig();
        fail('Expected InvalidEnvironmentVariableError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEnvironmentVariableError);
        expect(error.message).toContain('TEST_PORT');
        expect(error.variableName).toBe('TEST_PORT');
        expect(error.value).toBe('not-a-number');
      }
    });

    it('should handle multiple validation errors', () => {
      process.env.TEST_PORT = 'not-a-number';
      process.env.TEST_API_ENDPOINT = 'not-a-url';
      
      const result = testEnvService.validateAllConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
      
      // Check first error
      expect(result.errors[0].name).toBe('TEST_PORT');
      expect(result.errors[0].value).toBe('not-a-number');
      expect(result.errors[0].message).toContain('could not be parsed as a number');
      
      // Check second error
      expect(result.errors[1].name).toBe('TEST_API_ENDPOINT');
      expect(result.errors[1].value).toBe('not-a-url');
      expect(result.errors[1].message).toContain('failed validation');
    });
  });
});