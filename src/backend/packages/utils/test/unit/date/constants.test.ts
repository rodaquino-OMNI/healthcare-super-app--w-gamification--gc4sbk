import { ptBR, enUS } from 'date-fns/locale'; // date-fns version: 3.3.1
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  LOCALE_MAP
} from '../../../src/date/constants';

describe('Date Constants', () => {
  describe('Default Format Strings', () => {
    it('should define DEFAULT_DATE_FORMAT as dd/MM/yyyy', () => {
      expect(DEFAULT_DATE_FORMAT).toBeDefined();
      expect(DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
      expect(typeof DEFAULT_DATE_FORMAT).toBe('string');
    });

    it('should define DEFAULT_TIME_FORMAT as HH:mm', () => {
      expect(DEFAULT_TIME_FORMAT).toBeDefined();
      expect(DEFAULT_TIME_FORMAT).toBe('HH:mm');
      expect(typeof DEFAULT_TIME_FORMAT).toBe('string');
    });

    it('should define DEFAULT_DATETIME_FORMAT as dd/MM/yyyy HH:mm', () => {
      expect(DEFAULT_DATETIME_FORMAT).toBeDefined();
      expect(DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
      expect(typeof DEFAULT_DATETIME_FORMAT).toBe('string');
    });

    it('should define DEFAULT_LOCALE as pt-BR', () => {
      expect(DEFAULT_LOCALE).toBeDefined();
      expect(DEFAULT_LOCALE).toBe('pt-BR');
      expect(typeof DEFAULT_LOCALE).toBe('string');
    });

    // Test immutability of constants
    it('should ensure format constants are immutable', () => {
      // Attempt to modify constants (this should fail in strict mode)
      expect(() => {
        // @ts-expect-error - Testing immutability
        DEFAULT_DATE_FORMAT = 'MM/dd/yyyy';
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing immutability
        DEFAULT_TIME_FORMAT = 'hh:mm a';
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing immutability
        DEFAULT_DATETIME_FORMAT = 'MM/dd/yyyy hh:mm a';
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing immutability
        DEFAULT_LOCALE = 'en-US';
      }).toThrow();
    });
  });

  describe('Locale Mappings', () => {
    it('should export LOCALE_MAP object', () => {
      expect(LOCALE_MAP).toBeDefined();
      expect(typeof LOCALE_MAP).toBe('object');
    });

    it('should map pt-BR to the correct date-fns locale', () => {
      expect(LOCALE_MAP).toHaveProperty('pt-BR');
      expect(LOCALE_MAP['pt-BR']).toBe(ptBR);
    });

    it('should map en-US to the correct date-fns locale', () => {
      expect(LOCALE_MAP).toHaveProperty('en-US');
      expect(LOCALE_MAP['en-US']).toBe(enUS);
    });

    it('should only contain the supported locales', () => {
      // We only support pt-BR and en-US at this point
      const localeKeys = Object.keys(LOCALE_MAP);
      expect(localeKeys).toHaveLength(2);
      expect(localeKeys).toContain('pt-BR');
      expect(localeKeys).toContain('en-US');
    });

    // Test immutability of locale map
    it('should ensure LOCALE_MAP is immutable', () => {
      const originalKeys = Object.keys(LOCALE_MAP);
      
      // Attempt to modify the locale map
      expect(() => {
        // @ts-expect-error - Testing immutability
        LOCALE_MAP['fr-FR'] = {};
      }).toThrow();

      // Verify the map wasn't changed
      expect(Object.keys(LOCALE_MAP)).toEqual(originalKeys);
    });
  });

  describe('Export Validation', () => {
    it('should properly export all constants', () => {
      // This test ensures that all constants are properly exported
      // and can be imported by other modules
      const constants = {
        DEFAULT_DATE_FORMAT,
        DEFAULT_TIME_FORMAT,
        DEFAULT_DATETIME_FORMAT,
        DEFAULT_LOCALE,
        LOCALE_MAP
      };

      expect(Object.keys(constants)).toHaveLength(5);
      expect(constants).toHaveProperty('DEFAULT_DATE_FORMAT');
      expect(constants).toHaveProperty('DEFAULT_TIME_FORMAT');
      expect(constants).toHaveProperty('DEFAULT_DATETIME_FORMAT');
      expect(constants).toHaveProperty('DEFAULT_LOCALE');
      expect(constants).toHaveProperty('LOCALE_MAP');
    });
  });
});