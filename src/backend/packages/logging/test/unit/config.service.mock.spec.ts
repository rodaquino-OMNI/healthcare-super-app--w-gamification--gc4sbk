/**
 * @file config.service.mock.spec.ts
 * @description Tests for the MockConfigService implementation
 */

import { MockConfigService } from '../mocks/config.service.mock';

describe('MockConfigService', () => {
  let configService: MockConfigService;

  beforeEach(() => {
    configService = new MockConfigService();
  });

  describe('get', () => {
    it('should return undefined for non-existent paths', () => {
      expect(configService.get('nonexistent')).toBeUndefined();
    });

    it('should return the default value for non-existent paths', () => {
      expect(configService.get('nonexistent', 'default')).toBe('default');
    });

    it('should return the configured value', () => {
      configService.set('test', 'value');
      expect(configService.get('test')).toBe('value');
    });

    it('should support nested paths', () => {
      configService.set('nested.path', 'nested-value');
      expect(configService.get('nested.path')).toBe('nested-value');
    });

    it('should support type safety with generics', () => {
      configService.set('number', 42);
      const value = configService.get<number>('number');
      expect(value).toBe(42);
      // TypeScript should infer that value is a number
      expect(value + 1).toBe(43);
    });
  });

  describe('set', () => {
    it('should set a simple value', () => {
      configService.set('simple', 'value');
      expect(configService.get('simple')).toBe('value');
    });

    it('should set a nested value and create intermediate objects', () => {
      configService.set('deeply.nested.path', 'deep-value');
      expect(configService.get('deeply.nested.path')).toBe('deep-value');
      expect(configService.get('deeply.nested')).toEqual({ path: 'deep-value' });
    });

    it('should override existing values', () => {
      configService.set('test', 'original');
      configService.set('test', 'updated');
      expect(configService.get('test')).toBe('updated');
    });

    it('should throw an error for empty property path', () => {
      expect(() => configService.set('', 'value')).toThrow();
    });
  });

  describe('setAll', () => {
    it('should set multiple values at once', () => {
      configService.setAll({
        'simple': 'value',
        'nested.path': 'nested-value',
        'number': 42
      });

      expect(configService.get('simple')).toBe('value');
      expect(configService.get('nested.path')).toBe('nested-value');
      expect(configService.get('number')).toBe(42);
    });
  });

  describe('has', () => {
    it('should return false for non-existent paths', () => {
      expect(configService.has('nonexistent')).toBe(false);
    });

    it('should return true for existing paths', () => {
      configService.set('test', 'value');
      expect(configService.has('test')).toBe(true);
    });

    it('should work with nested paths', () => {
      configService.set('nested.path', 'value');
      expect(configService.has('nested.path')).toBe(true);
      expect(configService.has('nested.nonexistent')).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove an existing path', () => {
      configService.set('test', 'value');
      configService.remove('test');
      expect(configService.has('test')).toBe(false);
    });

    it('should handle non-existent paths gracefully', () => {
      expect(() => configService.remove('nonexistent')).not.toThrow();
    });

    it('should remove nested paths', () => {
      configService.set('nested.path', 'value');
      configService.remove('nested.path');
      expect(configService.has('nested.path')).toBe(false);
      expect(configService.has('nested')).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to empty state', () => {
      configService.set('test', 'value');
      configService.reset();
      expect(configService.has('test')).toBe(false);
    });

    it('should reset to provided initial values', () => {
      configService.set('test', 'value');
      configService.reset({ 'new': 'value' });
      expect(configService.has('test')).toBe(false);
      expect(configService.get('new')).toBe('value');
    });
  });

  describe('getConfigStore', () => {
    it('should return a copy of the config store', () => {
      configService.set('test', 'value');
      const store = configService.getConfigStore();
      expect(store).toEqual({ test: 'value' });

      // Modifying the returned store should not affect the original
      store.test = 'modified';
      expect(configService.get('test')).toBe('value');
    });
  });

  describe('constructor', () => {
    it('should initialize with provided values', () => {
      const initialConfig = {
        'test': 'value',
        'nested': { 'path': 'nested-value' }
      };
      const service = new MockConfigService(initialConfig);
      
      expect(service.get('test')).toBe('value');
      expect(service.get('nested.path')).toBe('nested-value');
    });
  });
});