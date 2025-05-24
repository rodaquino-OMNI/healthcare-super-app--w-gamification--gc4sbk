import { DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT, DEFAULT_DATETIME_FORMAT, DEFAULT_LOCALE } from '../constants';

describe('Date Constants Module', () => {
  describe('DEFAULT_DATE_FORMAT', () => {
    it('should be properly exported from constants module', () => {
      expect(DEFAULT_DATE_FORMAT).toBeDefined();
      expect(typeof DEFAULT_DATE_FORMAT).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    });
  });

  describe('DEFAULT_TIME_FORMAT', () => {
    it('should be properly exported from constants module', () => {
      expect(DEFAULT_TIME_FORMAT).toBeDefined();
      expect(typeof DEFAULT_TIME_FORMAT).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_TIME_FORMAT).toBe('HH:mm');
    });
  });

  describe('DEFAULT_DATETIME_FORMAT', () => {
    it('should be properly exported from constants module', () => {
      expect(DEFAULT_DATETIME_FORMAT).toBeDefined();
      expect(typeof DEFAULT_DATETIME_FORMAT).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
    });
  });

  describe('DEFAULT_LOCALE', () => {
    it('should be properly exported from constants module', () => {
      expect(DEFAULT_LOCALE).toBeDefined();
      expect(typeof DEFAULT_LOCALE).toBe('string');
    });

    it('should have the correct value', () => {
      expect(DEFAULT_LOCALE).toBe('pt-BR');
    });
  });

  describe('Constants usage in the application', () => {
    it('should ensure constants are used consistently across date formatting functions', () => {
      // This test verifies that the constants are the same ones used in the date utility functions
      // The actual implementation of these functions is tested in their respective test files
      // This is more of a documentation test to emphasize the importance of these constants
      
      // We're just checking that the constants exist and have the expected values
      // which is already covered by the tests above
      expect(DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
      expect(DEFAULT_TIME_FORMAT).toBe('HH:mm');
      expect(DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
      expect(DEFAULT_LOCALE).toBe('pt-BR');
    });
  });
});