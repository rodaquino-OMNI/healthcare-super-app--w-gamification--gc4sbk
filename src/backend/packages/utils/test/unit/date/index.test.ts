/**
 * @file Date Utilities Index Tests
 * @description Tests for the main entry point of the date utility package.
 * Verifies that all functions are properly exported and accessible through the public API.
 */

import { expect } from 'chai';

// Import all exports from the date utility package
import * as dateUtils from '../../../src/date';

// Import individual modules to compare exports
import * as constants from '../../../src/date/constants';
import * as validation from '../../../src/date/validation';
import * as format from '../../../src/date/format';
import * as parse from '../../../src/date/parse';
import * as range from '../../../src/date/range';
import * as calculation from '../../../src/date/calculation';
import * as comparison from '../../../src/date/comparison';
import * as timezone from '../../../src/date/timezone';
import * as journey from '../../../src/date/journey';

describe('Date Utilities Index', () => {
  describe('Exports', () => {
    it('should export all constants', () => {
      // Check that all constants are exported
      Object.keys(constants).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(constants[key]);
      });
    });

    it('should export all validation utilities', () => {
      // Check that all validation utilities are exported
      Object.keys(validation).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(validation[key]);
      });
    });

    it('should export all formatting utilities', () => {
      // Check that all formatting utilities are exported
      Object.keys(format).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(format[key]);
      });
    });

    it('should export all parsing utilities', () => {
      // Check that all parsing utilities are exported
      Object.keys(parse).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(parse[key]);
      });
    });

    it('should export all range utilities', () => {
      // Check that all range utilities are exported
      Object.keys(range).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(range[key]);
      });
    });

    it('should export all calculation utilities', () => {
      // Check that all calculation utilities are exported
      Object.keys(calculation).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(calculation[key]);
      });
    });

    it('should export all comparison utilities', () => {
      // Check that all comparison utilities are exported
      Object.keys(comparison).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(comparison[key]);
      });
    });

    it('should export all timezone utilities', () => {
      // Check that all timezone utilities are exported
      Object.keys(timezone).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(timezone[key]);
      });
    });

    it('should export all journey-specific utilities', () => {
      // Check that all journey-specific utilities are exported
      Object.keys(journey).forEach(key => {
        expect(dateUtils).to.have.property(key);
        expect(dateUtils[key]).to.equal(journey[key]);
      });
    });
  });

  describe('Named Exports', () => {
    // Test specific named exports to ensure they are correctly typed and accessible
    it('should export formatDate function', () => {
      expect(dateUtils.formatDate).to.be.a('function');
      const date = new Date(2023, 0, 1); // January 1, 2023
      expect(dateUtils.formatDate(date, 'yyyy-MM-dd')).to.equal('2023-01-01');
    });

    it('should export parseDate function', () => {
      expect(dateUtils.parseDate).to.be.a('function');
      const dateStr = '2023-01-01';
      const parsed = dateUtils.parseDate(dateStr, 'yyyy-MM-dd');
      expect(parsed).to.be.instanceOf(Date);
      expect(parsed.getFullYear()).to.equal(2023);
      expect(parsed.getMonth()).to.equal(0); // January is 0
      expect(parsed.getDate()).to.equal(1);
    });

    it('should export isValidDate function', () => {
      expect(dateUtils.isValidDate).to.be.a('function');
      expect(dateUtils.isValidDate(new Date())).to.be.true;
      expect(dateUtils.isValidDate(new Date('invalid-date'))).to.be.false;
    });

    it('should export calculateAge function', () => {
      expect(dateUtils.calculateAge).to.be.a('function');
      const birthdate = new Date(1990, 0, 1); // January 1, 1990
      const referenceDate = new Date(2023, 0, 1); // January 1, 2023
      expect(dateUtils.calculateAge(birthdate, referenceDate)).to.equal(33);
    });

    it('should export getDateRange function', () => {
      expect(dateUtils.getDateRange).to.be.a('function');
      const range = dateUtils.getDateRange('today');
      expect(range).to.have.property('start');
      expect(range).to.have.property('end');
      expect(range.start).to.be.instanceOf(Date);
      expect(range.end).to.be.instanceOf(Date);
    });

    it('should export isSameDay function', () => {
      expect(dateUtils.isSameDay).to.be.a('function');
      const date1 = new Date(2023, 0, 1, 10, 30); // January 1, 2023, 10:30 AM
      const date2 = new Date(2023, 0, 1, 14, 45); // January 1, 2023, 2:45 PM
      expect(dateUtils.isSameDay(date1, date2)).to.be.true;
    });

    it('should export getLocalTimezone function', () => {
      expect(dateUtils.getLocalTimezone).to.be.a('function');
      // We can't test the actual return value as it depends on the environment
      expect(typeof dateUtils.getLocalTimezone()).to.equal('string');
    });

    it('should export formatJourneyDate function', () => {
      expect(dateUtils.formatJourneyDate).to.be.a('function');
      const date = new Date(2023, 0, 1); // January 1, 2023
      expect(typeof dateUtils.formatJourneyDate(date, 'health')).to.equal('string');
    });
  });

  describe('Import Patterns', () => {
    it('should support direct import of specific functions', () => {
      // This test verifies that the import pattern works as expected
      // We're already importing the functions in the test file, so we just need to verify they exist
      expect(dateUtils.formatDate).to.exist;
      expect(dateUtils.parseDate).to.exist;
      expect(dateUtils.isValidDate).to.exist;
    });

    it('should support importing all utilities as a namespace', () => {
      // This test verifies that the namespace import pattern works as expected
      expect(dateUtils).to.be.an('object');
      expect(Object.keys(dateUtils).length).to.be.greaterThan(0);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with legacy import patterns', () => {
      // In the old structure, all date utilities were exported from a single file
      // Now they are modularized, but the index file should re-export everything
      // to maintain backward compatibility
      
      // Legacy functions that must be available
      const legacyFunctions = [
        'formatDate',
        'parseDate',
        'isValidDate',
        'calculateAge',
        'getTimeAgo',
        'isSameDay',
        'isDateInRange',
        'getDateRange',
        'getDatesBetween',
        'formatJourneyDate'
      ];

      legacyFunctions.forEach(funcName => {
        expect(dateUtils).to.have.property(funcName);
        expect(dateUtils[funcName]).to.be.a('function');
      });
    });
  });
});