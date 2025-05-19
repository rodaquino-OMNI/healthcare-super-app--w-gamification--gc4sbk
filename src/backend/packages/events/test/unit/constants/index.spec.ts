/**
 * Unit tests for the constants barrel file
 * 
 * These tests verify that all constants modules are correctly exported and accessible.
 * This ensures that consumers of the events package can properly import constants
 * with the expected structure and that no exports are missing or incorrectly named.
 */

import * as Constants from '../../../src/constants';

describe('Constants Barrel Exports', () => {
  describe('Namespace Exports', () => {
    it('should export ErrorConstants namespace', () => {
      expect(Constants.ErrorConstants).toBeDefined();
      expect(typeof Constants.ErrorConstants).toBe('object');
    });

    it('should export SerializationConstants namespace', () => {
      expect(Constants.SerializationConstants).toBeDefined();
      expect(typeof Constants.SerializationConstants).toBe('object');
    });

    it('should export ConfigConstants namespace', () => {
      expect(Constants.ConfigConstants).toBeDefined();
      expect(typeof Constants.ConfigConstants).toBe('object');
    });

    it('should export HeaderConstants namespace', () => {
      expect(Constants.HeaderConstants).toBeDefined();
      expect(typeof Constants.HeaderConstants).toBe('object');
    });

    it('should export TypeConstants namespace', () => {
      expect(Constants.TypeConstants).toBeDefined();
      expect(typeof Constants.TypeConstants).toBe('object');
    });

    it('should export TopicConstants namespace', () => {
      expect(Constants.TopicConstants).toBeDefined();
      expect(typeof Constants.TopicConstants).toBe('object');
    });
  });

  describe('Direct Journey Constant Exports', () => {
    it('should export JOURNEY_IDS constant', () => {
      expect(Constants.JOURNEY_IDS).toBeDefined();
      expect(Constants.JOURNEY_IDS.HEALTH).toBe('health');
      expect(Constants.JOURNEY_IDS.CARE).toBe('care');
      expect(Constants.JOURNEY_IDS.PLAN).toBe('plan');
    });

    it('should export JOURNEY_NAMES constant', () => {
      expect(Constants.JOURNEY_NAMES).toBeDefined();
      expect(Constants.JOURNEY_NAMES.HEALTH).toBe('Minha Saúde');
      expect(Constants.JOURNEY_NAMES.CARE).toBe('Cuidar-me Agora');
      expect(Constants.JOURNEY_NAMES.PLAN).toBe('Meu Plano & Benefícios');
    });

    it('should export JOURNEY_COLORS constant', () => {
      expect(Constants.JOURNEY_COLORS).toBeDefined();
      expect(Constants.JOURNEY_COLORS.HEALTH).toHaveProperty('primary');
      expect(Constants.JOURNEY_COLORS.CARE).toHaveProperty('primary');
      expect(Constants.JOURNEY_COLORS.PLAN).toHaveProperty('primary');
    });

    it('should export JOURNEY_ICONS constant', () => {
      expect(Constants.JOURNEY_ICONS).toBeDefined();
      expect(Constants.JOURNEY_ICONS.HEALTH).toBe('heart-pulse');
      expect(Constants.JOURNEY_ICONS.CARE).toBe('medical-bag');
      expect(Constants.JOURNEY_ICONS.PLAN).toBe('shield-account');
    });

    it('should export JOURNEY_ROUTES constant', () => {
      expect(Constants.JOURNEY_ROUTES).toBeDefined();
      expect(Constants.JOURNEY_ROUTES.HEALTH).toBe('/health');
      expect(Constants.JOURNEY_ROUTES.CARE).toBe('/care');
      expect(Constants.JOURNEY_ROUTES.PLAN).toBe('/plan');
    });

    it('should export DEFAULT_JOURNEY constant', () => {
      expect(Constants.DEFAULT_JOURNEY).toBeDefined();
      expect(Constants.DEFAULT_JOURNEY).toBe(Constants.JOURNEY_IDS.HEALTH);
    });

    it('should export JOURNEY_ORDER constant', () => {
      expect(Constants.JOURNEY_ORDER).toBeDefined();
      expect(Array.isArray(Constants.JOURNEY_ORDER)).toBe(false); // It's a readonly array-like object
      expect(Constants.JOURNEY_ORDER[0]).toBe(Constants.JOURNEY_IDS.HEALTH);
      expect(Constants.JOURNEY_ORDER[1]).toBe(Constants.JOURNEY_IDS.CARE);
      expect(Constants.JOURNEY_ORDER[2]).toBe(Constants.JOURNEY_IDS.PLAN);
    });

    it('should export JOURNEY_CONFIG constant', () => {
      expect(Constants.JOURNEY_CONFIG).toBeDefined();
      expect(Constants.JOURNEY_CONFIG[Constants.JOURNEY_IDS.HEALTH]).toHaveProperty('name');
      expect(Constants.JOURNEY_CONFIG[Constants.JOURNEY_IDS.HEALTH]).toHaveProperty('color');
      expect(Constants.JOURNEY_CONFIG[Constants.JOURNEY_IDS.HEALTH]).toHaveProperty('icon');
      expect(Constants.JOURNEY_CONFIG[Constants.JOURNEY_IDS.HEALTH]).toHaveProperty('route');
    });
  });

  describe('getAllConstants Function', () => {
    it('should export getAllConstants function', () => {
      expect(Constants.getAllConstants).toBeDefined();
      expect(typeof Constants.getAllConstants).toBe('function');
    });

    it('should return all constants when called', () => {
      const allConstants = Constants.getAllConstants();
      expect(allConstants).toBeDefined();
      expect(allConstants.ErrorConstants).toBeDefined();
      expect(allConstants.SerializationConstants).toBeDefined();
      expect(allConstants.ConfigConstants).toBeDefined();
      expect(allConstants.HeaderConstants).toBeDefined();
      expect(allConstants.TypeConstants).toBeDefined();
      expect(allConstants.TopicConstants).toBeDefined();
      expect(allConstants.JourneyConstants).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for JOURNEY_IDS', () => {
      // This is a type-level test that will fail at compile time if types are incorrect
      type HealthJourneyId = typeof Constants.JOURNEY_IDS.HEALTH;
      const healthId: HealthJourneyId = 'health';
      expect(healthId).toBe(Constants.JOURNEY_IDS.HEALTH);

      // @ts-expect-error - This should fail type checking
      const invalidHealthId: HealthJourneyId = 'invalid';
    });

    it('should maintain type safety for JOURNEY_COLORS', () => {
      // This is a type-level test that will fail at compile time if types are incorrect
      type HealthColorScheme = typeof Constants.JOURNEY_COLORS.HEALTH;
      const healthColors: HealthColorScheme = {
        primary: '#0ACF83',
        secondary: '#05A66A',
        accent: '#00875A',
        background: '#F0FFF4',
      };
      expect(healthColors).toEqual(Constants.JOURNEY_COLORS.HEALTH);

      // @ts-expect-error - This should fail type checking due to missing properties
      const invalidHealthColors: HealthColorScheme = { primary: '#0ACF83' };
    });
  });

  describe('Negative Tests', () => {
    it('should not expose internal implementation details', () => {
      // @ts-expect-error - This should fail type checking
      expect(Constants._internalHelper).toBeUndefined();
      // @ts-expect-error - This should fail type checking
      expect(Constants.privateFunction).toBeUndefined();
    });

    it('should not allow modification of constants', () => {
      expect(() => {
        // @ts-expect-error - This should fail type checking
        Constants.JOURNEY_IDS.HEALTH = 'modified';
      }).toThrow();

      expect(() => {
        // @ts-expect-error - This should fail type checking
        Constants.JOURNEY_COLORS.HEALTH.primary = 'modified';
      }).toThrow();
    });

    it('should not expose non-existent constants', () => {
      // @ts-expect-error - This should fail type checking
      expect(Constants.NON_EXISTENT_CONSTANT).toBeUndefined();
    });

    it('should not expose non-existent namespaces', () => {
      // @ts-expect-error - This should fail type checking
      expect(Constants.NonExistentNamespace).toBeUndefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility for required exports', () => {
      // These are the critical exports that must be maintained for backward compatibility
      const requiredExports = [
        'ErrorConstants',
        'SerializationConstants',
        'ConfigConstants',
        'HeaderConstants',
        'TypeConstants',
        'TopicConstants',
        'JOURNEY_IDS',
        'JOURNEY_NAMES',
        'JOURNEY_COLORS',
        'JOURNEY_ICONS',
        'JOURNEY_ROUTES',
        'DEFAULT_JOURNEY',
        'JOURNEY_ORDER',
        'JOURNEY_CONFIG',
        'getAllConstants',
      ];

      requiredExports.forEach(exportName => {
        expect(Constants).toHaveProperty(exportName);
      });
    });
  });
});