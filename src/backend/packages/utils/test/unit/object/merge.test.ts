/**
 * Unit tests for object merging utilities
 * 
 * These tests verify that objects are correctly merged at all nesting levels,
 * with appropriate handling of arrays, primitive values, and edge cases including
 * null/undefined values and conflicting property types.
 */

import { 
  deepMerge, 
  deepMergeWithOptions, 
  MergeStrategy, 
  mergeConfig,
  mergeJourneyConfig
} from '../../../src/object/merge';

describe('Object Merge Utilities', () => {
  describe('deepMerge', () => {
    it('should merge shallow objects correctly', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
      // Original objects should not be modified
      expect(target).toEqual({ a: 1, b: 2 });
      expect(source).toEqual({ b: 3, c: 4 });
    });
    
    it('should merge multiple source objects from left to right', () => {
      const target = { a: 1, b: 2 };
      const source1 = { b: 3, c: 4 };
      const source2 = { c: 5, d: 6 };
      
      const result = deepMerge(target, source1, source2);
      
      expect(result).toEqual({ a: 1, b: 3, c: 5, d: 6 });
    });
    
    it('should return a copy of the target when no sources are provided', () => {
      const target = { a: 1, b: 2 };
      
      const result = deepMerge(target);
      
      expect(result).toEqual(target);
      expect(result).not.toBe(target); // Should be a new object
    });
    
    it('should deeply merge nested objects', () => {
      const target = { 
        user: { 
          name: 'John', 
          age: 30,
          address: {
            city: 'New York',
            zip: '10001'
          }
        } 
      };
      
      const source = { 
        user: { 
          age: 31, 
          role: 'admin',
          address: {
            street: 'Broadway',
            zip: '10002'
          }
        } 
      };
      
      const result = deepMerge(target, source);
      
      expect(result).toEqual({
        user: {
          name: 'John',
          age: 31,
          role: 'admin',
          address: {
            city: 'New York',
            street: 'Broadway',
            zip: '10002'
          }
        }
      });
    });
    
    it('should replace arrays by default', () => {
      const target = { tags: ['important', 'urgent'] };
      const source = { tags: ['approved', 'urgent'] };
      
      const result = deepMerge(target, source);
      
      expect(result.tags).toEqual(['approved', 'urgent']);
      // Should be a new array
      expect(result.tags).not.toBe(source.tags);
    });
    
    it('should handle null sources by skipping them', () => {
      const target = { a: 1, b: 2 };
      const source1 = null;
      const source2 = { c: 3 };
      
      // @ts-ignore - Testing null handling
      const result = deepMerge(target, source1, source2);
      
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
    
    it('should throw an error if target is not a plain object', () => {
      const target = ['not', 'an', 'object'];
      const source = { a: 1 };
      
      // @ts-ignore - Testing type validation
      expect(() => deepMerge(target, source)).toThrow(TypeError);
    });
    
    it('should throw an error if source is not a plain object', () => {
      const target = { a: 1 };
      const source = ['not', 'an', 'object'];
      
      // @ts-ignore - Testing type validation
      expect(() => deepMerge(target, source)).toThrow(TypeError);
    });
  });
  
  describe('deepMergeWithOptions', () => {
    it('should combine arrays when using COMBINE strategy', () => {
      const target = { tags: ['important', 'urgent'] };
      const source = { tags: ['approved', 'urgent'] };
      
      const result = deepMergeWithOptions(target, [source], {
        arrayStrategy: MergeStrategy.COMBINE
      });
      
      // Should combine arrays and remove duplicates
      expect(result.tags).toEqual(['important', 'urgent', 'approved']);
    });
    
    it('should append arrays when using APPEND strategy', () => {
      const target = { tags: ['important', 'urgent'] };
      const source = { tags: ['approved', 'urgent'] };
      
      const result = deepMergeWithOptions(target, [source], {
        arrayStrategy: MergeStrategy.APPEND
      });
      
      // Should append source array to target array (with duplicates)
      expect(result.tags).toEqual(['important', 'urgent', 'approved', 'urgent']);
    });
    
    it('should throw an error for unknown array strategy', () => {
      const target = { tags: ['important'] };
      const source = { tags: ['approved'] };
      
      expect(() => deepMergeWithOptions(target, [source], {
        // @ts-ignore - Testing invalid strategy
        arrayStrategy: 'invalid-strategy'
      })).toThrow(/Unknown array merge strategy/);
    });
    
    it('should respect maxDepth to prevent stack overflow', () => {
      // Create a deeply nested object
      let deeplyNested = {};
      let current = deeplyNested;
      
      // Create an object with 10 levels of nesting
      for (let i = 0; i < 10; i++) {
        current['level'] = {};
        current = current['level'];
      }
      
      // Set maxDepth to 5 (less than our nesting)
      expect(() => deepMergeWithOptions({}, [deeplyNested], {
        maxDepth: 5
      })).toThrow(/Maximum merge depth of 5 exceeded/);
    });
    
    it('should skip undefined source values', () => {
      const target = { a: 1, b: 2 };
      const source = { b: undefined, c: 3 };
      
      const result = deepMergeWithOptions(target, [source], {});
      
      // Should keep the original value for b
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
    
    it('should handle conflicting property types by using source value', () => {
      const target = { 
        prop: { nested: 'value' } 
      };
      
      const source = { 
        prop: 'string value' 
      };
      
      const result = deepMergeWithOptions(target, [source], {});
      
      // Should use the source value when types conflict
      expect(result.prop).toBe('string value');
    });
    
    it('should handle array to object type conflicts', () => {
      const target = { 
        prop: ['array', 'value'] 
      };
      
      const source = { 
        prop: { key: 'object value' } 
      };
      
      const result = deepMergeWithOptions(target, [source], {});
      
      // Should use the source value when types conflict
      expect(result.prop).toEqual({ key: 'object value' });
    });
    
    it('should handle object to array type conflicts', () => {
      const target = { 
        prop: { key: 'object value' } 
      };
      
      const source = { 
        prop: ['array', 'value'] 
      };
      
      const result = deepMergeWithOptions(target, [source], {});
      
      // Should use the source value when types conflict
      expect(result.prop).toEqual(['array', 'value']);
    });
  });
  
  describe('mergeConfig', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    afterEach(() => {
      // Restore original NODE_ENV after each test
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    it('should merge base config with environment-specific overrides', () => {
      // Set environment to development
      process.env.NODE_ENV = 'development';
      
      const baseConfig = { 
        apiUrl: 'https://api.example.com', 
        timeout: 5000 
      };
      
      const envConfigs = {
        development: { 
          apiUrl: 'http://localhost:3000', 
          debug: true 
        },
        production: { 
          timeout: 3000 
        }
      };
      
      const result = mergeConfig(baseConfig, envConfigs);
      
      // Should apply development overrides
      expect(result).toEqual({
        apiUrl: 'http://localhost:3000',
        timeout: 5000,
        debug: true
      });
    });
    
    it('should use production environment overrides when NODE_ENV is production', () => {
      // Set environment to production
      process.env.NODE_ENV = 'production';
      
      const baseConfig = { 
        apiUrl: 'https://api.example.com', 
        timeout: 5000 
      };
      
      const envConfigs = {
        development: { 
          apiUrl: 'http://localhost:3000', 
          debug: true 
        },
        production: { 
          timeout: 3000 
        }
      };
      
      const result = mergeConfig(baseConfig, envConfigs);
      
      // Should apply production overrides
      expect(result).toEqual({
        apiUrl: 'https://api.example.com',
        timeout: 3000
      });
    });
    
    it('should use default environment when NODE_ENV is not set', () => {
      // Unset NODE_ENV
      delete process.env.NODE_ENV;
      
      const baseConfig = { 
        apiUrl: 'https://api.example.com', 
        timeout: 5000 
      };
      
      const envConfigs = {
        development: { 
          apiUrl: 'http://localhost:3000', 
          debug: true 
        }
      };
      
      const result = mergeConfig(baseConfig, envConfigs);
      
      // Should default to development
      expect(result).toEqual({
        apiUrl: 'http://localhost:3000',
        timeout: 5000,
        debug: true
      });
    });
    
    it('should handle missing environment config', () => {
      // Set to an environment that doesn't exist in the config
      process.env.NODE_ENV = 'staging';
      
      const baseConfig = { 
        apiUrl: 'https://api.example.com', 
        timeout: 5000 
      };
      
      const envConfigs = {
        development: { 
          apiUrl: 'http://localhost:3000' 
        },
        production: { 
          timeout: 3000 
        }
      };
      
      const result = mergeConfig(baseConfig, envConfigs);
      
      // Should use base config without overrides
      expect(result).toEqual(baseConfig);
    });
    
    it('should handle empty environment configs', () => {
      const baseConfig = { 
        apiUrl: 'https://api.example.com', 
        timeout: 5000 
      };
      
      const result = mergeConfig(baseConfig);
      
      // Should return base config unchanged
      expect(result).toEqual(baseConfig);
    });
    
    it('should throw an error if base config is not a plain object', () => {
      // @ts-ignore - Testing type validation
      expect(() => mergeConfig(['not', 'an', 'object'])).toThrow(TypeError);
    });
  });
  
  describe('mergeJourneyConfig', () => {
    it('should merge journey-specific configuration with base configuration', () => {
      const baseConfig = { 
        theme: 'light', 
        apiTimeout: 5000 
      };
      
      const journeyConfig = { 
        theme: 'health-theme', 
        metrics: { refresh: 60 } 
      };
      
      const result = mergeJourneyConfig(baseConfig, journeyConfig);
      
      expect(result).toEqual({
        theme: 'health-theme',
        apiTimeout: 5000,
        metrics: { refresh: 60 }
      });
    });
    
    it('should use custom array strategy when provided', () => {
      const baseConfig = { 
        features: ['base1', 'base2'] 
      };
      
      const journeyConfig = { 
        features: ['journey1', 'journey2'] 
      };
      
      const result = mergeJourneyConfig(baseConfig, journeyConfig, {
        arrayStrategy: MergeStrategy.COMBINE
      });
      
      // Should combine arrays without duplicates
      expect(result.features).toEqual(['base1', 'base2', 'journey1', 'journey2']);
    });
    
    it('should handle deeply nested journey configuration', () => {
      const baseConfig = { 
        theme: {
          colors: {
            primary: '#1a73e8',
            secondary: '#f50057'
          },
          fonts: {
            main: 'Roboto'
          }
        },
        api: {
          timeout: 5000
        }
      };
      
      const journeyConfig = { 
        theme: {
          colors: {
            primary: '#00796b',  // Override primary color
            tertiary: '#ffab00'  // Add new color
          },
          spacing: {             // Add new theme property
            unit: 8
          }
        },
        features: ['metrics', 'goals']
      };
      
      const result = mergeJourneyConfig(baseConfig, journeyConfig);
      
      expect(result).toEqual({
        theme: {
          colors: {
            primary: '#00796b',    // Overridden
            secondary: '#f50057',  // Preserved
            tertiary: '#ffab00'    // Added
          },
          fonts: {
            main: 'Roboto'         // Preserved
          },
          spacing: {               // Added
            unit: 8
          }
        },
        api: {
          timeout: 5000            // Preserved
        },
        features: ['metrics', 'goals'] // Added
      });
    });
    
    it('should throw an error if base config is not a plain object', () => {
      const baseConfig = ['not', 'an', 'object'];
      const journeyConfig = { theme: 'health' };
      
      // @ts-ignore - Testing type validation
      expect(() => mergeJourneyConfig(baseConfig, journeyConfig))
        .toThrow(TypeError);
    });
    
    it('should throw an error if journey config is not a plain object', () => {
      const baseConfig = { theme: 'light' };
      const journeyConfig = ['not', 'an', 'object'];
      
      // @ts-ignore - Testing type validation
      expect(() => mergeJourneyConfig(baseConfig, journeyConfig))
        .toThrow(TypeError);
    });
    
    it('should use custom maxDepth when provided', () => {
      // Create a deeply nested object
      let deeplyNested = {};
      let current = deeplyNested;
      
      // Create an object with 10 levels of nesting
      for (let i = 0; i < 10; i++) {
        current['level'] = {};
        current = current['level'];
      }
      
      // Set maxDepth to 5 (less than our nesting)
      expect(() => mergeJourneyConfig({}, deeplyNested, {
        maxDepth: 5
      })).toThrow(/Maximum merge depth of 5 exceeded/);
    });
  });
});