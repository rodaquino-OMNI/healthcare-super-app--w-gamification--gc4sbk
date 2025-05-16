/**
 * @file Tests for date constants re-exports
 * @description Ensures that date constants are properly exposed through the constants module
 */

import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  LOCALE_MAP,
  JOURNEY_DATE_FORMATS
} from '../constants';

describe('Date Constants', () => {
  describe('Format Constants', () => {
    it('should export DEFAULT_DATE_FORMAT with correct value', () => {
      expect(DEFAULT_DATE_FORMAT).toBeDefined();
      expect(DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    });

    it('should export DEFAULT_TIME_FORMAT with correct value', () => {
      expect(DEFAULT_TIME_FORMAT).toBeDefined();
      expect(DEFAULT_TIME_FORMAT).toBe('HH:mm');
    });

    it('should export DEFAULT_DATETIME_FORMAT with correct value', () => {
      expect(DEFAULT_DATETIME_FORMAT).toBeDefined();
      expect(DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
    });
  });

  describe('Locale Constants', () => {
    it('should export DEFAULT_LOCALE with correct value', () => {
      expect(DEFAULT_LOCALE).toBeDefined();
      expect(DEFAULT_LOCALE).toBe('pt-BR');
    });

    it('should export LOCALE_MAP with required locales', () => {
      expect(LOCALE_MAP).toBeDefined();
      expect(LOCALE_MAP['pt-BR']).toBeDefined();
      expect(LOCALE_MAP['en-US']).toBeDefined();
    });
  });

  describe('Journey-specific Constants', () => {
    it('should export JOURNEY_DATE_FORMATS with formats for all journeys', () => {
      expect(JOURNEY_DATE_FORMATS).toBeDefined();
      expect(JOURNEY_DATE_FORMATS['health']).toBe('dd/MM/yyyy HH:mm');
      expect(JOURNEY_DATE_FORMATS['care']).toBe('EEE, dd MMM yyyy');
      expect(JOURNEY_DATE_FORMATS['plan']).toBe('dd/MM/yyyy');
    });
  });
});