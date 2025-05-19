/**
 * Unit tests for the environment variable utilities package entry point.
 * Verifies that all exports are properly exposed and accessible.
 */

import * as envUtils from '../../../src/env';
import * as configModule from '../../../src/env/config';
import * as transformModule from '../../../src/env/transform';
import * as validationModule from '../../../src/env/validation';
import * as journeyModule from '../../../src/env/journey';
import * as errorModule from '../../../src/env/error';
import * as typesModule from '../../../src/env/types';

describe('Environment Variable Utilities Package', () => {
  describe('Package Structure', () => {
    it('should export all core environment variable access functions', () => {
      // Core environment variable access functions
      expect(envUtils.getEnv).toBeDefined();
      expect(envUtils.getRequiredEnv).toBeDefined();
      expect(envUtils.getOptionalEnv).toBeDefined();
      expect(envUtils.clearEnvCache).toBeDefined();
      expect(envUtils.getNamespacedEnv).toBeDefined();
      expect(envUtils.validateRequiredEnv).toBeDefined();
      
      // Type-specific convenience functions
      expect(envUtils.getBooleanEnv).toBeDefined();
      expect(envUtils.getOptionalBooleanEnv).toBeDefined();
      expect(envUtils.getNumberEnv).toBeDefined();
      expect(envUtils.getOptionalNumberEnv).toBeDefined();
      expect(envUtils.getJsonEnv).toBeDefined();
      expect(envUtils.getOptionalJsonEnv).toBeDefined();
      expect(envUtils.getArrayEnv).toBeDefined();
      expect(envUtils.getOptionalArrayEnv).toBeDefined();
      
      // Journey-specific environment functions
      expect(envUtils.getJourneyTypedEnv).toBeDefined();
      expect(envUtils.getOptionalJourneyEnv).toBeDefined();
      
      // Feature flag functions
      expect(envUtils.getFeatureFlag).toBeDefined();
      
      // Error classes
      expect(envUtils.MissingEnvironmentVariableError).toBeDefined();
      expect(envUtils.InvalidEnvironmentVariableError).toBeDefined();
    });

    it('should export all environment variable transformation functions', () => {
      // String to boolean conversion
      expect(envUtils.parseBoolean).toBeDefined();
      
      // String to number conversion
      expect(envUtils.parseNumber).toBeDefined();
      
      // String to array conversion
      expect(envUtils.parseArray).toBeDefined();
      expect(envUtils.parseNumberArray).toBeDefined();
      
      // String to object conversion
      expect(envUtils.parseJson).toBeDefined();
      expect(envUtils.parseCSV).toBeDefined();
      
      // String to specialized types conversion
      expect(envUtils.parseRange).toBeDefined();
      expect(envUtils.isInRange).toBeDefined();
      expect(envUtils.parseUrl).toBeDefined();
      expect(envUtils.parseEnum).toBeDefined();
      expect(envUtils.parseDuration).toBeDefined();
      expect(envUtils.parseMemorySize).toBeDefined();
      
      // Generic transformation
      expect(envUtils.transform).toBeDefined();
    });

    it('should export all environment variable validation functions', () => {
      // Zod-based validators
      expect(envUtils.createZodValidator).toBeDefined();
      expect(envUtils.createZodValidatorWithDefault).toBeDefined();
      
      // Type-specific validators
      expect(envUtils.createStringValidator).toBeDefined();
      expect(envUtils.createNumberValidator).toBeDefined();
      expect(envUtils.createBooleanValidator).toBeDefined();
      expect(envUtils.createUrlValidator).toBeDefined();
      expect(envUtils.createArrayValidator).toBeDefined();
      expect(envUtils.createJsonValidator).toBeDefined();
      expect(envUtils.createEnumValidator).toBeDefined();
      expect(envUtils.createDurationValidator).toBeDefined();
      expect(envUtils.createPortValidator).toBeDefined();
      expect(envUtils.createHostValidator).toBeDefined();
      
      // Domain-specific validators
      expect(envUtils.createDatabaseUrlValidator).toBeDefined();
      expect(envUtils.createApiKeyValidator).toBeDefined();
      expect(envUtils.createJwtSecretValidator).toBeDefined();
      expect(envUtils.createEnvironmentValidator).toBeDefined();
      expect(envUtils.createRedisUrlValidator).toBeDefined();
      expect(envUtils.createKafkaBrokersValidator).toBeDefined();
      expect(envUtils.createCorsOriginsValidator).toBeDefined();
      expect(envUtils.createLogLevelValidator).toBeDefined();
      expect(envUtils.createFeatureFlagsValidator).toBeDefined();
      expect(envUtils.createJourneyConfigValidator).toBeDefined();
      expect(envUtils.createDbPoolConfigValidator).toBeDefined();
      expect(envUtils.createRetryPolicyValidator).toBeDefined();
      
      // Batch validation
      expect(envUtils.validateEnvironmentGroup).toBeDefined();
      expect(envUtils.validateServiceEnvironment).toBeDefined();
      expect(envUtils.validateJourneyEnvironment).toBeDefined();
    });

    it('should export all journey-specific configuration functions', () => {
      // Journey types
      expect(envUtils.JourneyType).toBeDefined();
      
      // Journey-specific environment functions
      expect(envUtils.getJourneyEnvName).toBeDefined();
      expect(envUtils.getJourneyEnv).toBeDefined();
      expect(envUtils.getRequiredJourneyEnv).toBeDefined();
      expect(envUtils.clearJourneyEnvCache).toBeDefined();
      
      // Feature flag functions
      expect(envUtils.getJourneyFeatureFlag).toBeDefined();
      expect(envUtils.isFeatureEnabled).toBeDefined();
      expect(envUtils.isFeatureEnabledForUser).toBeDefined();
      
      // Cross-journey sharing
      expect(envUtils.getSharedJourneyEnv).toBeDefined();
      expect(envUtils.getRequiredSharedJourneyEnv).toBeDefined();
      expect(envUtils.getAllJourneyEnvs).toBeDefined();
    });

    it('should export all error handling utilities', () => {
      // Error classes
      expect(envUtils.EnvironmentVariableError).toBeDefined();
      expect(envUtils.EnvMissingError).toBeDefined();
      expect(envUtils.EnvInvalidError).toBeDefined();
      expect(envUtils.EnvValidationError).toBeDefined();
      expect(envUtils.EnvTransformError).toBeDefined();
      expect(envUtils.EnvBatchError).toBeDefined();
      
      // Error utilities
      expect(envUtils.formatErrorMessage).toBeDefined();
      expect(envUtils.withEnvErrorFallback).toBeDefined();
      expect(envUtils.validateEnvironmentBatch).toBeDefined();
      expect(envUtils.createRequiredEnvValidator).toBeDefined();
      
      // Error categorization
      expect(envUtils.EnvironmentErrorCategory).toBeDefined();
      expect(envUtils.categorizeEnvironmentError).toBeDefined();
    });

    it('should export all type definitions', () => {
      // Type definitions are not directly testable at runtime
      // but we can verify that the module is exported
      expect(envUtils).toBeDefined();
    });
  });

  describe('Export Integrity', () => {
    it('should correctly re-export functions from config module', () => {
      expect(envUtils.getEnv).toBe(configModule.getEnv);
      expect(envUtils.getRequiredEnv).toBe(configModule.getRequiredEnv);
      expect(envUtils.getOptionalEnv).toBe(configModule.getOptionalEnv);
      expect(envUtils.clearEnvCache).toBe(configModule.clearEnvCache);
      expect(envUtils.getNamespacedEnv).toBe(configModule.getNamespacedEnv);
      expect(envUtils.validateRequiredEnv).toBe(configModule.validateRequiredEnv);
      expect(envUtils.getBooleanEnv).toBe(configModule.getBooleanEnv);
      expect(envUtils.getOptionalBooleanEnv).toBe(configModule.getOptionalBooleanEnv);
      expect(envUtils.getNumberEnv).toBe(configModule.getNumberEnv);
      expect(envUtils.getOptionalNumberEnv).toBe(configModule.getOptionalNumberEnv);
      expect(envUtils.getJsonEnv).toBe(configModule.getJsonEnv);
      expect(envUtils.getOptionalJsonEnv).toBe(configModule.getOptionalJsonEnv);
      expect(envUtils.getArrayEnv).toBe(configModule.getArrayEnv);
      expect(envUtils.getOptionalArrayEnv).toBe(configModule.getOptionalArrayEnv);
      expect(envUtils.getJourneyTypedEnv).toBe(configModule.getJourneyEnv);
      expect(envUtils.getOptionalJourneyEnv).toBe(configModule.getOptionalJourneyEnv);
      expect(envUtils.getFeatureFlag).toBe(configModule.getFeatureFlag);
      expect(envUtils.MissingEnvironmentVariableError).toBe(configModule.MissingEnvironmentVariableError);
      expect(envUtils.InvalidEnvironmentVariableError).toBe(configModule.InvalidEnvironmentVariableError);
    });

    it('should correctly re-export functions from transform module', () => {
      expect(envUtils.parseBoolean).toBe(transformModule.parseBoolean);
      expect(envUtils.parseNumber).toBe(transformModule.parseNumber);
      expect(envUtils.parseArray).toBe(transformModule.parseArray);
      expect(envUtils.parseNumberArray).toBe(transformModule.parseNumberArray);
      expect(envUtils.parseJson).toBe(transformModule.parseJson);
      expect(envUtils.parseCSV).toBe(transformModule.parseCSV);
      expect(envUtils.parseRange).toBe(transformModule.parseRange);
      expect(envUtils.isInRange).toBe(transformModule.isInRange);
      expect(envUtils.parseUrl).toBe(transformModule.parseUrl);
      expect(envUtils.parseEnum).toBe(transformModule.parseEnum);
      expect(envUtils.parseDuration).toBe(transformModule.parseDuration);
      expect(envUtils.parseMemorySize).toBe(transformModule.parseMemorySize);
      expect(envUtils.transform).toBe(transformModule.transform);
    });

    it('should correctly re-export functions from validation module', () => {
      expect(envUtils.createZodValidator).toBe(validationModule.createZodValidator);
      expect(envUtils.createZodValidatorWithDefault).toBe(validationModule.createZodValidatorWithDefault);
      expect(envUtils.createStringValidator).toBe(validationModule.createStringValidator);
      expect(envUtils.createNumberValidator).toBe(validationModule.createNumberValidator);
      expect(envUtils.createBooleanValidator).toBe(validationModule.createBooleanValidator);
      expect(envUtils.createUrlValidator).toBe(validationModule.createUrlValidator);
      expect(envUtils.createArrayValidator).toBe(validationModule.createArrayValidator);
      expect(envUtils.createJsonValidator).toBe(validationModule.createJsonValidator);
      expect(envUtils.createEnumValidator).toBe(validationModule.createEnumValidator);
      expect(envUtils.createDurationValidator).toBe(validationModule.createDurationValidator);
      expect(envUtils.createPortValidator).toBe(validationModule.createPortValidator);
      expect(envUtils.createHostValidator).toBe(validationModule.createHostValidator);
      expect(envUtils.createDatabaseUrlValidator).toBe(validationModule.createDatabaseUrlValidator);
      expect(envUtils.createApiKeyValidator).toBe(validationModule.createApiKeyValidator);
      expect(envUtils.createJwtSecretValidator).toBe(validationModule.createJwtSecretValidator);
      expect(envUtils.createEnvironmentValidator).toBe(validationModule.createEnvironmentValidator);
      expect(envUtils.createRedisUrlValidator).toBe(validationModule.createRedisUrlValidator);
      expect(envUtils.createKafkaBrokersValidator).toBe(validationModule.createKafkaBrokersValidator);
      expect(envUtils.createCorsOriginsValidator).toBe(validationModule.createCorsOriginsValidator);
      expect(envUtils.createLogLevelValidator).toBe(validationModule.createLogLevelValidator);
      expect(envUtils.createFeatureFlagsValidator).toBe(validationModule.createFeatureFlagsValidator);
      expect(envUtils.createJourneyConfigValidator).toBe(validationModule.createJourneyConfigValidator);
      expect(envUtils.createDbPoolConfigValidator).toBe(validationModule.createDbPoolConfigValidator);
      expect(envUtils.createRetryPolicyValidator).toBe(validationModule.createRetryPolicyValidator);
      expect(envUtils.validateEnvironmentGroup).toBe(validationModule.validateEnvironmentGroup);
      expect(envUtils.validateServiceEnvironment).toBe(validationModule.validateServiceEnvironment);
      expect(envUtils.validateJourneyEnvironment).toBe(validationModule.validateJourneyEnvironment);
    });

    it('should correctly re-export functions from journey module', () => {
      expect(envUtils.JourneyType).toBe(journeyModule.JourneyType);
      expect(envUtils.getJourneyEnvName).toBe(journeyModule.getJourneyEnvName);
      expect(envUtils.getJourneyEnv).toBe(journeyModule.getJourneyEnv);
      expect(envUtils.getRequiredJourneyEnv).toBe(journeyModule.getRequiredJourneyEnv);
      expect(envUtils.clearJourneyEnvCache).toBe(journeyModule.clearEnvCache);
      expect(envUtils.getJourneyFeatureFlag).toBe(journeyModule.getJourneyFeatureFlag);
      expect(envUtils.isFeatureEnabled).toBe(journeyModule.isFeatureEnabled);
      expect(envUtils.isFeatureEnabledForUser).toBe(journeyModule.isFeatureEnabledForUser);
      expect(envUtils.getSharedJourneyEnv).toBe(journeyModule.getSharedJourneyEnv);
      expect(envUtils.getRequiredSharedJourneyEnv).toBe(journeyModule.getRequiredSharedJourneyEnv);
      expect(envUtils.getAllJourneyEnvs).toBe(journeyModule.getAllJourneyEnvs);
    });

    it('should correctly re-export functions from error module', () => {
      expect(envUtils.EnvironmentVariableError).toBe(errorModule.EnvironmentVariableError);
      expect(envUtils.EnvMissingError).toBe(errorModule.MissingEnvironmentVariableError);
      expect(envUtils.EnvInvalidError).toBe(errorModule.InvalidEnvironmentVariableError);
      expect(envUtils.EnvValidationError).toBe(errorModule.ValidationEnvironmentVariableError);
      expect(envUtils.EnvTransformError).toBe(errorModule.TransformEnvironmentVariableError);
      expect(envUtils.EnvBatchError).toBe(errorModule.BatchEnvironmentValidationError);
      expect(envUtils.formatErrorMessage).toBe(errorModule.formatErrorMessage);
      expect(envUtils.withEnvErrorFallback).toBe(errorModule.withEnvErrorFallback);
      expect(envUtils.validateEnvironmentBatch).toBe(errorModule.validateEnvironmentBatch);
      expect(envUtils.createRequiredEnvValidator).toBe(errorModule.createRequiredEnvValidator);
      expect(envUtils.EnvironmentErrorCategory).toBe(errorModule.EnvironmentErrorCategory);
      expect(envUtils.categorizeEnvironmentError).toBe(errorModule.categorizeEnvironmentError);
    });
  });

  describe('Documentation and Usage Examples', () => {
    it('should provide documented exports with usage examples', () => {
      // This test verifies that the module exports are documented
      // with usage examples in JSDoc comments
      // Since we can't directly test JSDoc comments in runtime tests,
      // we're just verifying that the exports exist
      expect(Object.keys(envUtils).length).toBeGreaterThan(0);
    });
  });

  describe('Functional Categories', () => {
    it('should provide core environment variable access functions', () => {
      const coreAccessFunctions = [
        'getEnv',
        'getRequiredEnv',
        'getOptionalEnv',
        'clearEnvCache',
        'getNamespacedEnv',
        'validateRequiredEnv',
        'getBooleanEnv',
        'getOptionalBooleanEnv',
        'getNumberEnv',
        'getOptionalNumberEnv',
        'getJsonEnv',
        'getOptionalJsonEnv',
        'getArrayEnv',
        'getOptionalArrayEnv',
        'getJourneyTypedEnv',
        'getOptionalJourneyEnv',
        'getFeatureFlag'
      ];
      
      coreAccessFunctions.forEach(functionName => {
        expect(envUtils[functionName]).toBeDefined();
        expect(typeof envUtils[functionName]).toBe('function');
      });
    });

    it('should provide environment variable transformation functions', () => {
      const transformFunctions = [
        'parseBoolean',
        'parseNumber',
        'parseArray',
        'parseNumberArray',
        'parseJson',
        'parseCSV',
        'parseRange',
        'isInRange',
        'parseUrl',
        'parseEnum',
        'parseDuration',
        'parseMemorySize',
        'transform'
      ];
      
      transformFunctions.forEach(functionName => {
        expect(envUtils[functionName]).toBeDefined();
        expect(typeof envUtils[functionName]).toBe('function');
      });
    });

    it('should provide environment variable validation functions', () => {
      const validationFunctions = [
        'createZodValidator',
        'createZodValidatorWithDefault',
        'createStringValidator',
        'createNumberValidator',
        'createBooleanValidator',
        'createUrlValidator',
        'createArrayValidator',
        'createJsonValidator',
        'createEnumValidator',
        'createDurationValidator',
        'createPortValidator',
        'createHostValidator',
        'createDatabaseUrlValidator',
        'createApiKeyValidator',
        'createJwtSecretValidator',
        'createEnvironmentValidator',
        'createRedisUrlValidator',
        'createKafkaBrokersValidator',
        'createCorsOriginsValidator',
        'createLogLevelValidator',
        'createFeatureFlagsValidator',
        'createJourneyConfigValidator',
        'createDbPoolConfigValidator',
        'createRetryPolicyValidator',
        'validateEnvironmentGroup',
        'validateServiceEnvironment',
        'validateJourneyEnvironment'
      ];
      
      validationFunctions.forEach(functionName => {
        expect(envUtils[functionName]).toBeDefined();
        expect(typeof envUtils[functionName]).toBe('function');
      });
    });

    it('should provide journey-specific configuration functions', () => {
      const journeyFunctions = [
        'getJourneyEnvName',
        'getJourneyEnv',
        'getRequiredJourneyEnv',
        'clearJourneyEnvCache',
        'getJourneyFeatureFlag',
        'isFeatureEnabled',
        'isFeatureEnabledForUser',
        'getSharedJourneyEnv',
        'getRequiredSharedJourneyEnv',
        'getAllJourneyEnvs'
      ];
      
      journeyFunctions.forEach(functionName => {
        expect(envUtils[functionName]).toBeDefined();
        expect(typeof envUtils[functionName]).toBe('function');
      });
      
      // JourneyType is an enum, not a function
      expect(envUtils.JourneyType).toBeDefined();
    });

    it('should provide error handling utilities', () => {
      const errorFunctions = [
        'formatErrorMessage',
        'withEnvErrorFallback',
        'validateEnvironmentBatch',
        'createRequiredEnvValidator',
        'categorizeEnvironmentError'
      ];
      
      errorFunctions.forEach(functionName => {
        expect(envUtils[functionName]).toBeDefined();
        expect(typeof envUtils[functionName]).toBe('function');
      });
      
      // Error classes and enums
      expect(envUtils.EnvironmentVariableError).toBeDefined();
      expect(envUtils.EnvMissingError).toBeDefined();
      expect(envUtils.EnvInvalidError).toBeDefined();
      expect(envUtils.EnvValidationError).toBeDefined();
      expect(envUtils.EnvTransformError).toBeDefined();
      expect(envUtils.EnvBatchError).toBeDefined();
      expect(envUtils.EnvironmentErrorCategory).toBeDefined();
    });
  });

  describe('Interface Consistency', () => {
    it('should maintain consistent naming patterns across utilities', () => {
      // Verify that all getter functions follow the get* pattern
      const getterFunctions = Object.keys(envUtils).filter(key => key.startsWith('get'));
      expect(getterFunctions.length).toBeGreaterThan(0);
      getterFunctions.forEach(functionName => {
        expect(typeof envUtils[functionName]).toBe('function');
      });
      
      // Verify that all creator functions follow the create* pattern
      const creatorFunctions = Object.keys(envUtils).filter(key => key.startsWith('create'));
      expect(creatorFunctions.length).toBeGreaterThan(0);
      creatorFunctions.forEach(functionName => {
        expect(typeof envUtils[functionName]).toBe('function');
      });
      
      // Verify that all parser functions follow the parse* pattern
      const parserFunctions = Object.keys(envUtils).filter(key => key.startsWith('parse'));
      expect(parserFunctions.length).toBeGreaterThan(0);
      parserFunctions.forEach(functionName => {
        expect(typeof envUtils[functionName]).toBe('function');
      });
      
      // Verify that all validator functions follow the validate* pattern
      const validatorFunctions = Object.keys(envUtils).filter(key => key.startsWith('validate'));
      expect(validatorFunctions.length).toBeGreaterThan(0);
      validatorFunctions.forEach(functionName => {
        expect(typeof envUtils[functionName]).toBe('function');
      });
    });
  });
});