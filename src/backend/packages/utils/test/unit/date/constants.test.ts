/**
 * @file Tests for date-related constants
 * @description Validates date-related constants including default formats, locale settings, and locale mappings
 */

import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  LOCALE_MAP,
  PT_BR_TIME_UNITS,
  EN_US_TIME_UNITS,
  TIME_UNITS_MAP,
  PT_BR_RELATIVE_TERMS,
  EN_US_RELATIVE_TERMS,
  RELATIVE_TERMS_MAP,
  DATE_RANGE_TYPES,
  JOURNEY_IDS,
  JOURNEY_DATE_FORMATS
} from '../../../src/date/constants';

describe('Date Constants', () => {
  describe('Default Format Strings', () => {
    test('DEFAULT_DATE_FORMAT should be defined and have the correct format', () => {
      expect(DEFAULT_DATE_FORMAT).toBeDefined();
      expect(DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    });

    test('DEFAULT_TIME_FORMAT should be defined and have the correct format', () => {
      expect(DEFAULT_TIME_FORMAT).toBeDefined();
      expect(DEFAULT_TIME_FORMAT).toBe('HH:mm');
    });

    test('DEFAULT_DATETIME_FORMAT should be defined and have the correct format', () => {
      expect(DEFAULT_DATETIME_FORMAT).toBeDefined();
      expect(DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
    });
  });

  describe('Locale Settings', () => {
    test('DEFAULT_LOCALE should be defined and set to pt-BR', () => {
      expect(DEFAULT_LOCALE).toBeDefined();
      expect(DEFAULT_LOCALE).toBe('pt-BR');
    });

    test('LOCALE_MAP should contain mappings for Portuguese and English', () => {
      expect(LOCALE_MAP).toBeDefined();
      expect(LOCALE_MAP['pt-BR']).toBe(ptBR);
      expect(LOCALE_MAP['en-US']).toBe(enUS);
      expect(Object.keys(LOCALE_MAP).length).toBe(2);
    });
  });

  describe('Time Unit Translations', () => {
    test('PT_BR_TIME_UNITS should contain Portuguese translations for time units', () => {
      expect(PT_BR_TIME_UNITS).toBeDefined();
      expect(PT_BR_TIME_UNITS.seconds).toBe('segundos');
      expect(PT_BR_TIME_UNITS.minute).toBe('minuto');
      expect(PT_BR_TIME_UNITS.minutes).toBe('minutos');
      expect(PT_BR_TIME_UNITS.hour).toBe('hora');
      expect(PT_BR_TIME_UNITS.hours).toBe('horas');
      expect(PT_BR_TIME_UNITS.day).toBe('dia');
      expect(PT_BR_TIME_UNITS.days).toBe('dias');
      expect(PT_BR_TIME_UNITS.week).toBe('semana');
      expect(PT_BR_TIME_UNITS.weeks).toBe('semanas');
      expect(PT_BR_TIME_UNITS.month).toBe('mês');
      expect(PT_BR_TIME_UNITS.months).toBe('meses');
      expect(PT_BR_TIME_UNITS.year).toBe('ano');
      expect(PT_BR_TIME_UNITS.years).toBe('anos');
      expect(PT_BR_TIME_UNITS.ago).toBe('atrás');
    });

    test('EN_US_TIME_UNITS should contain English translations for time units', () => {
      expect(EN_US_TIME_UNITS).toBeDefined();
      expect(EN_US_TIME_UNITS.seconds).toBe('seconds');
      expect(EN_US_TIME_UNITS.minute).toBe('minute');
      expect(EN_US_TIME_UNITS.minutes).toBe('minutes');
      expect(EN_US_TIME_UNITS.hour).toBe('hour');
      expect(EN_US_TIME_UNITS.hours).toBe('hours');
      expect(EN_US_TIME_UNITS.day).toBe('day');
      expect(EN_US_TIME_UNITS.days).toBe('days');
      expect(EN_US_TIME_UNITS.week).toBe('week');
      expect(EN_US_TIME_UNITS.weeks).toBe('weeks');
      expect(EN_US_TIME_UNITS.month).toBe('month');
      expect(EN_US_TIME_UNITS.months).toBe('months');
      expect(EN_US_TIME_UNITS.year).toBe('year');
      expect(EN_US_TIME_UNITS.years).toBe('years');
      expect(EN_US_TIME_UNITS.ago).toBe('ago');
    });

    test('TIME_UNITS_MAP should map locale identifiers to time unit translations', () => {
      expect(TIME_UNITS_MAP).toBeDefined();
      expect(TIME_UNITS_MAP['pt-BR']).toBe(PT_BR_TIME_UNITS);
      expect(TIME_UNITS_MAP['en-US']).toBe(EN_US_TIME_UNITS);
      expect(Object.keys(TIME_UNITS_MAP).length).toBe(2);
    });
  });

  describe('Relative Date Terms', () => {
    test('PT_BR_RELATIVE_TERMS should contain Portuguese translations for relative date terms', () => {
      expect(PT_BR_RELATIVE_TERMS).toBeDefined();
      expect(PT_BR_RELATIVE_TERMS.today).toBe('Hoje');
      expect(PT_BR_RELATIVE_TERMS.yesterday).toBe('Ontem');
      expect(PT_BR_RELATIVE_TERMS.daysAgo).toBe('dias atrás');
      expect(PT_BR_RELATIVE_TERMS.thisMonth).toBe('Este mês');
      expect(PT_BR_RELATIVE_TERMS.lastMonth).toBe('Mês passado');
    });

    test('EN_US_RELATIVE_TERMS should contain English translations for relative date terms', () => {
      expect(EN_US_RELATIVE_TERMS).toBeDefined();
      expect(EN_US_RELATIVE_TERMS.today).toBe('Today');
      expect(EN_US_RELATIVE_TERMS.yesterday).toBe('Yesterday');
      expect(EN_US_RELATIVE_TERMS.daysAgo).toBe('days ago');
      expect(EN_US_RELATIVE_TERMS.thisMonth).toBe('This month');
      expect(EN_US_RELATIVE_TERMS.lastMonth).toBe('Last month');
    });

    test('RELATIVE_TERMS_MAP should map locale identifiers to relative date term translations', () => {
      expect(RELATIVE_TERMS_MAP).toBeDefined();
      expect(RELATIVE_TERMS_MAP['pt-BR']).toBe(PT_BR_RELATIVE_TERMS);
      expect(RELATIVE_TERMS_MAP['en-US']).toBe(EN_US_RELATIVE_TERMS);
      expect(Object.keys(RELATIVE_TERMS_MAP).length).toBe(2);
    });
  });

  describe('Date Range Types', () => {
    test('DATE_RANGE_TYPES should define all supported date range types', () => {
      expect(DATE_RANGE_TYPES).toBeDefined();
      expect(DATE_RANGE_TYPES.TODAY).toBe('today');
      expect(DATE_RANGE_TYPES.YESTERDAY).toBe('yesterday');
      expect(DATE_RANGE_TYPES.THIS_WEEK).toBe('thisWeek');
      expect(DATE_RANGE_TYPES.LAST_WEEK).toBe('lastWeek');
      expect(DATE_RANGE_TYPES.THIS_MONTH).toBe('thisMonth');
      expect(DATE_RANGE_TYPES.LAST_MONTH).toBe('lastMonth');
      expect(DATE_RANGE_TYPES.THIS_YEAR).toBe('thisYear');
      expect(DATE_RANGE_TYPES.LAST_YEAR).toBe('lastYear');
      expect(DATE_RANGE_TYPES.LAST_7_DAYS).toBe('last7Days');
      expect(DATE_RANGE_TYPES.LAST_30_DAYS).toBe('last30Days');
      expect(DATE_RANGE_TYPES.LAST_90_DAYS).toBe('last90Days');
      expect(DATE_RANGE_TYPES.LAST_365_DAYS).toBe('last365Days');
    });

    test('DATE_RANGE_TYPES should be immutable', () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        DATE_RANGE_TYPES.TODAY = 'modified';
      }).toThrow();
    });
  });

  describe('Journey-specific Formats', () => {
    test('JOURNEY_IDS should define all supported journey identifiers', () => {
      expect(JOURNEY_IDS).toBeDefined();
      expect(JOURNEY_IDS.HEALTH).toBe('health');
      expect(JOURNEY_IDS.CARE).toBe('care');
      expect(JOURNEY_IDS.PLAN).toBe('plan');
    });

    test('JOURNEY_IDS should be immutable', () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        JOURNEY_IDS.HEALTH = 'modified';
      }).toThrow();
    });

    test('JOURNEY_DATE_FORMATS should map journey identifiers to date formats', () => {
      expect(JOURNEY_DATE_FORMATS).toBeDefined();
      expect(JOURNEY_DATE_FORMATS[JOURNEY_IDS.HEALTH]).toBe('dd/MM/yyyy HH:mm');
      expect(JOURNEY_DATE_FORMATS[JOURNEY_IDS.CARE]).toBe('EEE, dd MMM yyyy');
      expect(JOURNEY_DATE_FORMATS[JOURNEY_IDS.PLAN]).toBe('dd/MM/yyyy');
      expect(Object.keys(JOURNEY_DATE_FORMATS).length).toBe(3);
    });
  });

  describe('Constant Exports', () => {
    test('All constants should be properly exported', () => {
      const constants = {
        DEFAULT_DATE_FORMAT,
        DEFAULT_TIME_FORMAT,
        DEFAULT_DATETIME_FORMAT,
        DEFAULT_LOCALE,
        LOCALE_MAP,
        PT_BR_TIME_UNITS,
        EN_US_TIME_UNITS,
        TIME_UNITS_MAP,
        PT_BR_RELATIVE_TERMS,
        EN_US_RELATIVE_TERMS,
        RELATIVE_TERMS_MAP,
        DATE_RANGE_TYPES,
        JOURNEY_IDS,
        JOURNEY_DATE_FORMATS
      };

      Object.entries(constants).forEach(([name, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
      });
    });
  });
});