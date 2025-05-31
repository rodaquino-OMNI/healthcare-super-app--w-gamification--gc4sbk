import { describe, it, expect, jest } from '@jest/globals';

// Mock the modules that are imported by the index file
jest.mock('../../../src/env/config', () => ({
  getEnv: jest.fn(),
  getRequiredEnv: jest.fn(),
  getOptionalEnv: jest.fn(),
  cacheEnv: jest.fn(),
  clearEnvCache: jest.fn(),
}));

jest.mock('../../../src/env/transform', () => ({
  parseBoolean: jest.fn(),
  parseNumber: jest.fn(),
  parseArray: jest.fn(),
  parseJson: jest.fn(),
  parseUrl: jest.fn(),
  parseRange: jest.fn(),
}));

jest.mock('../../../src/env/validation', () => ({
  validateEnv: jest.fn(),
  validateUrl: jest.fn(),
  validateNumericRange: jest.fn(),
  validateEnum: jest.fn(),
  validateSchema: jest.fn(),
  validateBatchEnv: jest.fn(),
}));

jest.mock('../../../src/env/journey', () => ({
  getJourneyEnv: jest.fn(),
  getJourneyPrefix: jest.fn(),
  withJourneyPrefix: jest.fn(),
  getJourneyFeatureFlag: jest.fn(),
  getSharedEnv: jest.fn(),
}));

jest.mock('../../../src/env/error', () => ({
  MissingEnvironmentVariableError: jest.fn(),
  InvalidEnvironmentVariableError: jest.fn(),
  EnvironmentValidationError: jest.fn(),
  formatEnvErrorMessage: jest.fn(),
  handleEnvError: jest.fn(),
}));

// Import the index file after mocking its dependencies
import * as envUtils from '../../../src/env';

describe('Environment Variable Utilities - Index', () => {
  describe('Export Structure', () => {
    it('should export all core environment accessor functions', () => {
      expect(envUtils).toHaveProperty('getEnv');
      expect(envUtils).toHaveProperty('getRequiredEnv');
      expect(envUtils).toHaveProperty('getOptionalEnv');
      expect(envUtils).toHaveProperty('cacheEnv');
      expect(envUtils).toHaveProperty('clearEnvCache');
    });

    it('should export all transformation utilities', () => {
      expect(envUtils).toHaveProperty('parseBoolean');
      expect(envUtils).toHaveProperty('parseNumber');
      expect(envUtils).toHaveProperty('parseArray');
      expect(envUtils).toHaveProperty('parseJson');
      expect(envUtils).toHaveProperty('parseUrl');
      expect(envUtils).toHaveProperty('parseRange');
    });

    it('should export all validation utilities', () => {
      expect(envUtils).toHaveProperty('validateEnv');
      expect(envUtils).toHaveProperty('validateUrl');
      expect(envUtils).toHaveProperty('validateNumericRange');
      expect(envUtils).toHaveProperty('validateEnum');
      expect(envUtils).toHaveProperty('validateSchema');
      expect(envUtils).toHaveProperty('validateBatchEnv');
    });

    it('should export all journey-specific utilities', () => {
      expect(envUtils).toHaveProperty('getJourneyEnv');
      expect(envUtils).toHaveProperty('getJourneyPrefix');
      expect(envUtils).toHaveProperty('withJourneyPrefix');
      expect(envUtils).toHaveProperty('getJourneyFeatureFlag');
      expect(envUtils).toHaveProperty('getSharedEnv');
    });

    it('should export all error classes and utilities', () => {
      expect(envUtils).toHaveProperty('MissingEnvironmentVariableError');
      expect(envUtils).toHaveProperty('InvalidEnvironmentVariableError');
      expect(envUtils).toHaveProperty('EnvironmentValidationError');
      expect(envUtils).toHaveProperty('formatEnvErrorMessage');
      expect(envUtils).toHaveProperty('handleEnvError');
    });
  });

  describe('Export Categories', () => {
    it('should maintain proper categorization of utilities', () => {
      // Group exports by their module origin
      const configUtils = [
        envUtils.getEnv,
        envUtils.getRequiredEnv,
        envUtils.getOptionalEnv,
        envUtils.cacheEnv,
        envUtils.clearEnvCache,
      ];

      const transformUtils = [
        envUtils.parseBoolean,
        envUtils.parseNumber,
        envUtils.parseArray,
        envUtils.parseJson,
        envUtils.parseUrl,
        envUtils.parseRange,
      ];

      const validationUtils = [
        envUtils.validateEnv,
        envUtils.validateUrl,
        envUtils.validateNumericRange,
        envUtils.validateEnum,
        envUtils.validateSchema,
        envUtils.validateBatchEnv,
      ];

      const journeyUtils = [
        envUtils.getJourneyEnv,
        envUtils.getJourneyPrefix,
        envUtils.withJourneyPrefix,
        envUtils.getJourneyFeatureFlag,
        envUtils.getSharedEnv,
      ];

      const errorUtils = [
        envUtils.MissingEnvironmentVariableError,
        envUtils.InvalidEnvironmentVariableError,
        envUtils.EnvironmentValidationError,
        envUtils.formatEnvErrorMessage,
        envUtils.handleEnvError,
      ];

      // Verify each utility is defined (not undefined)
      configUtils.forEach(util => expect(util).toBeDefined());
      transformUtils.forEach(util => expect(util).toBeDefined());
      validationUtils.forEach(util => expect(util).toBeDefined());
      journeyUtils.forEach(util => expect(util).toBeDefined());
      errorUtils.forEach(util => expect(util).toBeDefined());
    });
  });

  describe('Export Consistency', () => {
    it('should maintain consistent naming conventions across utilities', () => {
      // Verify accessor functions follow the 'getX' pattern
      expect(envUtils.getEnv.name).toBe('getEnv');
      expect(envUtils.getRequiredEnv.name).toBe('getRequiredEnv');
      expect(envUtils.getOptionalEnv.name).toBe('getOptionalEnv');
      expect(envUtils.getJourneyEnv.name).toBe('getJourneyEnv');
      expect(envUtils.getJourneyPrefix.name).toBe('getJourneyPrefix');
      expect(envUtils.getSharedEnv.name).toBe('getSharedEnv');
      expect(envUtils.getJourneyFeatureFlag.name).toBe('getJourneyFeatureFlag');

      // Verify transformation functions follow the 'parseX' pattern
      expect(envUtils.parseBoolean.name).toBe('parseBoolean');
      expect(envUtils.parseNumber.name).toBe('parseNumber');
      expect(envUtils.parseArray.name).toBe('parseArray');
      expect(envUtils.parseJson.name).toBe('parseJson');
      expect(envUtils.parseUrl.name).toBe('parseUrl');
      expect(envUtils.parseRange.name).toBe('parseRange');

      // Verify validation functions follow the 'validateX' pattern
      expect(envUtils.validateEnv.name).toBe('validateEnv');
      expect(envUtils.validateUrl.name).toBe('validateUrl');
      expect(envUtils.validateNumericRange.name).toBe('validateNumericRange');
      expect(envUtils.validateEnum.name).toBe('validateEnum');
      expect(envUtils.validateSchema.name).toBe('validateSchema');
      expect(envUtils.validateBatchEnv.name).toBe('validateBatchEnv');
    });

    it('should maintain consistent error class naming', () => {
      // Verify error classes follow the 'XError' pattern
      expect(envUtils.MissingEnvironmentVariableError.name).toBe('MissingEnvironmentVariableError');
      expect(envUtils.InvalidEnvironmentVariableError.name).toBe('InvalidEnvironmentVariableError');
      expect(envUtils.EnvironmentValidationError.name).toBe('EnvironmentValidationError');
    });
  });

  describe('Type Definitions', () => {
    it('should export all necessary type definitions', () => {
      // We can't directly test TypeScript types at runtime,
      // but we can verify the index exports them by checking
      // that the TypeScript compiler doesn't complain when used
      // This is more of a compilation check than a runtime test
      
      // This test will pass as long as the TypeScript compiler
      // doesn't complain about these types during build
      const typeCheck = () => {
        // These type annotations are just for verification
        // that the types are properly exported
        type EnvValue = envUtils.EnvValue;
        type EnvTransformer<T> = envUtils.EnvTransformer<T>;
        type EnvValidator<T> = envUtils.EnvValidator<T>;
        type JourneyType = envUtils.JourneyType;
        type EnvSchema = envUtils.EnvSchema;
      };
      
      // Just to make sure the function is used
      expect(typeCheck).toBeDefined();
    });
  });

  describe('Module Integrity', () => {
    it('should not expose any internal implementation details', () => {
      // Check that no unexpected properties are exported
      const expectedExports = [
        // Config module
        'getEnv', 'getRequiredEnv', 'getOptionalEnv', 'cacheEnv', 'clearEnvCache',
        // Transform module
        'parseBoolean', 'parseNumber', 'parseArray', 'parseJson', 'parseUrl', 'parseRange',
        // Validation module
        'validateEnv', 'validateUrl', 'validateNumericRange', 'validateEnum', 'validateSchema', 'validateBatchEnv',
        // Journey module
        'getJourneyEnv', 'getJourneyPrefix', 'withJourneyPrefix', 'getJourneyFeatureFlag', 'getSharedEnv',
        // Error module
        'MissingEnvironmentVariableError', 'InvalidEnvironmentVariableError', 'EnvironmentValidationError',
        'formatEnvErrorMessage', 'handleEnvError',
        // Types
        'EnvValue', 'EnvTransformer', 'EnvValidator', 'JourneyType', 'EnvSchema'
      ];

      // Get all keys from the exported module
      const actualExports = Object.keys(envUtils);

      // Check that all expected exports exist
      expectedExports.forEach(exportName => {
        expect(actualExports).toContain(exportName);
      });

      // Check that no unexpected exports exist
      actualExports.forEach(exportName => {
        expect(expectedExports).toContain(exportName);
      });
    });
  });
});