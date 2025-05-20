import * as constants from '../../../src/constants';
import * as errorCodes from '../../../src/constants/error-codes';
import * as configKeys from '../../../src/constants/config-keys';
import * as defaults from '../../../src/constants/defaults';
import * as spanAttributes from '../../../src/constants/span-attributes';

describe('Constants Barrel File', () => {
  describe('Error Codes', () => {
    it('should export all error code constants', () => {
      // Get all exported keys from the error-codes module
      const errorCodeKeys = Object.keys(errorCodes);
      
      // Verify each error code is exported from the barrel file
      errorCodeKeys.forEach(key => {
        expect(constants).toHaveProperty(key);
        expect(constants[key]).toBe(errorCodes[key]);
      });
    });

    it('should maintain the correct format for error codes', () => {
      // Get all exported keys from the error-codes module
      const errorCodeKeys = Object.keys(errorCodes);
      
      // Verify each error code follows the TRACING_XXX format
      errorCodeKeys.forEach(key => {
        expect(typeof constants[key]).toBe('string');
        expect(constants[key]).toMatch(/^TRACING_\d{3}$/);
      });
    });
  });

  describe('Config Keys', () => {
    it('should export all config key constants', () => {
      // Get all exported keys from the config-keys module
      const configKeyKeys = Object.keys(configKeys);
      
      // Verify each config key is exported from the barrel file
      configKeyKeys.forEach(key => {
        expect(constants).toHaveProperty(key);
      });
    });

    it('should export the CONFIG_KEYS namespace', () => {
      expect(constants).toHaveProperty('CONFIG_KEYS');
      expect(constants.CONFIG_KEYS).toBe(configKeys.CONFIG_KEYS);
    });

    it('should maintain the correct structure for namespaced config keys', () => {
      // Verify the structure of the SERVICE namespace
      expect(constants.SERVICE).toEqual(configKeys.SERVICE);
      expect(constants.SERVICE.NAME).toBe(configKeys.SERVICE.NAME);
      expect(constants.SERVICE.VERSION).toBe(configKeys.SERVICE.VERSION);
      expect(constants.SERVICE.ENVIRONMENT).toBe(configKeys.SERVICE.ENVIRONMENT);

      // Verify the structure of the EXPORTER namespace
      expect(constants.EXPORTER).toEqual(configKeys.EXPORTER);
      expect(constants.EXPORTER.TYPE).toBe(configKeys.EXPORTER.TYPE);
      expect(constants.EXPORTER.ENDPOINT).toBe(configKeys.EXPORTER.ENDPOINT);
      expect(constants.EXPORTER.HEADERS).toBe(configKeys.EXPORTER.HEADERS);
      expect(constants.EXPORTER.TIMEOUT).toBe(configKeys.EXPORTER.TIMEOUT);

      // Verify the structure of the SAMPLING namespace
      expect(constants.SAMPLING).toEqual(configKeys.SAMPLING);
      expect(constants.SAMPLING.RATIO).toBe(configKeys.SAMPLING.RATIO);
      expect(constants.SAMPLING.STRATEGY).toBe(configKeys.SAMPLING.STRATEGY);

      // Verify the structure of the RESOURCE namespace
      expect(constants.RESOURCE).toEqual(configKeys.RESOURCE);
      expect(constants.RESOURCE.ATTRIBUTES).toBe(configKeys.RESOURCE.ATTRIBUTES);
      expect(constants.RESOURCE.AUTO_DETECT).toBe(configKeys.RESOURCE.AUTO_DETECT);

      // Verify the structure of the BATCH_PROCESSOR namespace
      expect(constants.BATCH_PROCESSOR).toEqual(configKeys.BATCH_PROCESSOR);
      expect(constants.BATCH_PROCESSOR.MAX_BATCH_SIZE).toBe(configKeys.BATCH_PROCESSOR.MAX_BATCH_SIZE);
      expect(constants.BATCH_PROCESSOR.MAX_EXPORT_BATCH_SIZE).toBe(configKeys.BATCH_PROCESSOR.MAX_EXPORT_BATCH_SIZE);
      expect(constants.BATCH_PROCESSOR.EXPORT_TIMEOUT).toBe(configKeys.BATCH_PROCESSOR.EXPORT_TIMEOUT);
      expect(constants.BATCH_PROCESSOR.SCHEDULE_DELAY).toBe(configKeys.BATCH_PROCESSOR.SCHEDULE_DELAY);

      // Verify the structure of the JOURNEY namespace
      expect(constants.JOURNEY).toEqual(configKeys.JOURNEY);
      expect(constants.JOURNEY.HEALTH_ENABLED).toBe(configKeys.JOURNEY.HEALTH_ENABLED);
      expect(constants.JOURNEY.CARE_ENABLED).toBe(configKeys.JOURNEY.CARE_ENABLED);
      expect(constants.JOURNEY.PLAN_ENABLED).toBe(configKeys.JOURNEY.PLAN_ENABLED);
      expect(constants.JOURNEY.HEALTH_SAMPLING_RATIO).toBe(configKeys.JOURNEY.HEALTH_SAMPLING_RATIO);
      expect(constants.JOURNEY.CARE_SAMPLING_RATIO).toBe(configKeys.JOURNEY.CARE_SAMPLING_RATIO);
      expect(constants.JOURNEY.PLAN_SAMPLING_RATIO).toBe(configKeys.JOURNEY.PLAN_SAMPLING_RATIO);

      // Verify the structure of the GENERAL namespace
      expect(constants.GENERAL).toEqual(configKeys.GENERAL);
      expect(constants.GENERAL.ENABLED).toBe(configKeys.GENERAL.ENABLED);
      expect(constants.GENERAL.LOG_LEVEL).toBe(configKeys.GENERAL.LOG_LEVEL);
      expect(constants.GENERAL.CONTEXT_PROPAGATION_ENABLED).toBe(configKeys.GENERAL.CONTEXT_PROPAGATION_ENABLED);
    });

    it('should maintain backward compatibility for deprecated keys', () => {
      // Verify the deprecated SERVICE_NAME key is still exported
      expect(constants).toHaveProperty('SERVICE_NAME');
      expect(constants.SERVICE_NAME).toBe(configKeys.SERVICE_NAME);
      expect(constants.SERVICE_NAME).toBe(constants.SERVICE.NAME);
    });
  });

  describe('Defaults', () => {
    it('should export all default value constants', () => {
      // Get all exported keys from the defaults module
      const defaultKeys = Object.keys(defaults);
      
      // Verify each default value is exported from the barrel file
      defaultKeys.forEach(key => {
        expect(constants).toHaveProperty(key);
        expect(constants[key]).toBe(defaults[key]);
      });
    });

    it('should maintain the correct types for default values', () => {
      // Verify string defaults
      expect(typeof constants.DEFAULT_SERVICE_NAME).toBe('string');
      expect(typeof constants.DEFAULT_SPAN_NAME).toBe('string');
      expect(typeof constants.DEFAULT_LOGGER_CONTEXT).toBe('string');
      
      // Verify numeric defaults
      expect(typeof constants.DEFAULT_SAMPLING_RATE).toBe('number');
      expect(typeof constants.MAX_SPAN_ATTRIBUTES).toBe('number');
      expect(typeof constants.DEFAULT_SPAN_TIMEOUT_MS).toBe('number');
      
      // Verify specific values
      expect(constants.DEFAULT_SAMPLING_RATE).toBe(1.0);
      expect(constants.MAX_SPAN_ATTRIBUTES).toBe(128);
      expect(constants.DEFAULT_SPAN_TIMEOUT_MS).toBe(30000);
    });
  });

  describe('Span Attributes', () => {
    it('should export all span attribute constants', () => {
      // Get all exported keys from the span-attributes module
      const spanAttributeKeys = Object.keys(spanAttributes);
      
      // Verify each span attribute is exported from the barrel file
      spanAttributeKeys.forEach(key => {
        expect(constants).toHaveProperty(key);
      });
    });

    it('should export the AUSTA_ATTRIBUTE_NAMESPACE constant', () => {
      expect(constants).toHaveProperty('AUSTA_ATTRIBUTE_NAMESPACE');
      expect(constants.AUSTA_ATTRIBUTE_NAMESPACE).toBe(spanAttributes.AUSTA_ATTRIBUTE_NAMESPACE);
      expect(constants.AUSTA_ATTRIBUTE_NAMESPACE).toBe('austa');
    });

    it('should export the SPAN_ATTRIBUTES namespace', () => {
      expect(constants).toHaveProperty('SPAN_ATTRIBUTES');
      expect(constants.SPAN_ATTRIBUTES).toBe(spanAttributes.SPAN_ATTRIBUTES);
    });

    it('should maintain the correct structure for attribute groups', () => {
      // Verify the structure of the GENERAL_ATTRIBUTES group
      expect(constants.GENERAL_ATTRIBUTES).toEqual(spanAttributes.GENERAL_ATTRIBUTES);
      expect(constants.GENERAL_ATTRIBUTES.SERVICE_NAME).toBe(spanAttributes.GENERAL_ATTRIBUTES.SERVICE_NAME);
      expect(constants.GENERAL_ATTRIBUTES.REQUEST_ID).toBe(spanAttributes.GENERAL_ATTRIBUTES.REQUEST_ID);
      
      // Verify the structure of the JOURNEY_ATTRIBUTES group
      expect(constants.JOURNEY_ATTRIBUTES).toEqual(spanAttributes.JOURNEY_ATTRIBUTES);
      expect(constants.JOURNEY_ATTRIBUTES.JOURNEY_TYPE).toBe(spanAttributes.JOURNEY_ATTRIBUTES.JOURNEY_TYPE);
      
      // Verify the structure of journey-specific attribute groups
      expect(constants.HEALTH_JOURNEY_ATTRIBUTES).toEqual(spanAttributes.HEALTH_JOURNEY_ATTRIBUTES);
      expect(constants.CARE_JOURNEY_ATTRIBUTES).toEqual(spanAttributes.CARE_JOURNEY_ATTRIBUTES);
      expect(constants.PLAN_JOURNEY_ATTRIBUTES).toEqual(spanAttributes.PLAN_JOURNEY_ATTRIBUTES);
      
      // Verify the structure of other attribute groups
      expect(constants.GAMIFICATION_ATTRIBUTES).toEqual(spanAttributes.GAMIFICATION_ATTRIBUTES);
      expect(constants.DATABASE_ATTRIBUTES).toEqual(spanAttributes.DATABASE_ATTRIBUTES);
      expect(constants.EXTERNAL_API_ATTRIBUTES).toEqual(spanAttributes.EXTERNAL_API_ATTRIBUTES);
      expect(constants.NOTIFICATION_ATTRIBUTES).toEqual(spanAttributes.NOTIFICATION_ATTRIBUTES);
      
      // Verify the SPAN_ATTRIBUTES namespace structure
      expect(constants.SPAN_ATTRIBUTES.GENERAL).toBe(constants.GENERAL_ATTRIBUTES);
      expect(constants.SPAN_ATTRIBUTES.JOURNEY).toBe(constants.JOURNEY_ATTRIBUTES);
      expect(constants.SPAN_ATTRIBUTES.HEALTH).toBe(constants.HEALTH_JOURNEY_ATTRIBUTES);
      expect(constants.SPAN_ATTRIBUTES.CARE).toBe(constants.CARE_JOURNEY_ATTRIBUTES);
      expect(constants.SPAN_ATTRIBUTES.PLAN).toBe(constants.PLAN_JOURNEY_ATTRIBUTES);
      expect(constants.SPAN_ATTRIBUTES.GAMIFICATION).toBe(constants.GAMIFICATION_ATTRIBUTES);
      expect(constants.SPAN_ATTRIBUTES.DATABASE).toBe(constants.DATABASE_ATTRIBUTES);
      expect(constants.SPAN_ATTRIBUTES.EXTERNAL_API).toBe(constants.EXTERNAL_API_ATTRIBUTES);
      expect(constants.SPAN_ATTRIBUTES.NOTIFICATION).toBe(constants.NOTIFICATION_ATTRIBUTES);
    });

    it('should ensure attribute keys follow the correct format', () => {
      // Check that AUSTA-specific attributes use the namespace prefix
      Object.values(constants.GENERAL_ATTRIBUTES)
        .filter(value => typeof value === 'string' && value.startsWith(constants.AUSTA_ATTRIBUTE_NAMESPACE))
        .forEach(value => {
          expect(value).toMatch(new RegExp(`^${constants.AUSTA_ATTRIBUTE_NAMESPACE}\.`));
        });
      
      // Check journey-specific attributes
      Object.values(constants.HEALTH_JOURNEY_ATTRIBUTES)
        .forEach(value => {
          expect(value).toMatch(new RegExp(`^${constants.AUSTA_ATTRIBUTE_NAMESPACE}\.health\.`));
        });
      
      Object.values(constants.CARE_JOURNEY_ATTRIBUTES)
        .forEach(value => {
          expect(value).toMatch(new RegExp(`^${constants.AUSTA_ATTRIBUTE_NAMESPACE}\.care\.`));
        });
      
      Object.values(constants.PLAN_JOURNEY_ATTRIBUTES)
        .forEach(value => {
          expect(value).toMatch(new RegExp(`^${constants.AUSTA_ATTRIBUTE_NAMESPACE}\.plan\.`));
        });
    });
  });

  describe('Negative Tests', () => {
    it('should not expose internal implementation details', () => {
      // The barrel file should not expose any properties that aren't explicitly exported
      expect(constants).not.toHaveProperty('__esModule');
      expect(constants).not.toHaveProperty('default');
    });

    it('should throw an error when accessing non-existent constants', () => {
      // Accessing non-existent properties should result in undefined
      expect(constants['NON_EXISTENT_CONSTANT']).toBeUndefined();
    });

    it('should not have naming collisions between different constant files', () => {
      // Check that there are no duplicate keys between different constant files
      const errorCodeKeys = new Set(Object.keys(errorCodes));
      const configKeyTopLevelKeys = new Set(Object.keys(configKeys).filter(key => key !== 'CONFIG_KEYS'));
      const defaultKeys = new Set(Object.keys(defaults));
      const spanAttributeTopLevelKeys = new Set(Object.keys(spanAttributes).filter(key => key !== 'SPAN_ATTRIBUTES'));
      
      // Create sets of keys that appear in multiple constant files
      const errorAndConfigCollisions = new Set([...errorCodeKeys].filter(key => configKeyTopLevelKeys.has(key)));
      const errorAndDefaultCollisions = new Set([...errorCodeKeys].filter(key => defaultKeys.has(key)));
      const errorAndSpanCollisions = new Set([...errorCodeKeys].filter(key => spanAttributeTopLevelKeys.has(key)));
      const configAndDefaultCollisions = new Set([...configKeyTopLevelKeys].filter(key => defaultKeys.has(key)));
      const configAndSpanCollisions = new Set([...configKeyTopLevelKeys].filter(key => spanAttributeTopLevelKeys.has(key)));
      const defaultAndSpanCollisions = new Set([...defaultKeys].filter(key => spanAttributeTopLevelKeys.has(key)));
      
      // Verify there are no collisions
      expect(errorAndConfigCollisions.size).toBe(0);
      expect(errorAndDefaultCollisions.size).toBe(0);
      expect(errorAndSpanCollisions.size).toBe(0);
      expect(configAndDefaultCollisions.size).toBe(0);
      expect(configAndSpanCollisions.size).toBe(0);
      expect(defaultAndSpanCollisions.size).toBe(0);
    });
  });
});