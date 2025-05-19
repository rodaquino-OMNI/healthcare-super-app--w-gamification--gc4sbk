/**
 * @file comparison.spec.ts
 * @description Tests for date comparison utility re-exports
 */

import { expect } from 'chai';
import * as comparisonModule from '../comparison';

describe('Date Comparison Re-exports', () => {
  describe('isSameDay', () => {
    it('should be exported correctly', () => {
      expect(comparisonModule.isSameDay).to.be.a('function');
    });

    it('should correctly identify same days with Date objects', () => {
      const date1 = new Date(2023, 0, 1, 10, 30); // Jan 1, 2023 10:30 AM
      const date2 = new Date(2023, 0, 1, 22, 45); // Jan 1, 2023 10:45 PM
      const date3 = new Date(2023, 0, 2, 10, 30); // Jan 2, 2023 10:30 AM

      expect(comparisonModule.isSameDay(date1, date2)).to.be.true;
      expect(comparisonModule.isSameDay(date1, date3)).to.be.false;
    });

    it('should correctly identify same days with string dates', () => {
      expect(comparisonModule.isSameDay('2023-01-01T10:30:00', '2023-01-01T22:45:00')).to.be.true;
      expect(comparisonModule.isSameDay('2023-01-01', '2023-01-02')).to.be.false;
    });

    it('should correctly identify same days with timestamp numbers', () => {
      const date1 = new Date(2023, 0, 1, 10, 30).getTime(); // Jan 1, 2023 10:30 AM
      const date2 = new Date(2023, 0, 1, 22, 45).getTime(); // Jan 1, 2023 10:45 PM
      const date3 = new Date(2023, 0, 2, 10, 30).getTime(); // Jan 2, 2023 10:30 AM

      expect(comparisonModule.isSameDay(date1, date2)).to.be.true;
      expect(comparisonModule.isSameDay(date1, date3)).to.be.false;
    });

    it('should handle invalid dates correctly', () => {
      expect(comparisonModule.isSameDay(new Date(), 'invalid-date')).to.be.false;
      expect(comparisonModule.isSameDay('invalid-date', new Date())).to.be.false;
      expect(comparisonModule.isSameDay(null, undefined)).to.be.false;
    });
  });

  describe('isDateInRange', () => {
    it('should be exported correctly', () => {
      expect(comparisonModule.isDateInRange).to.be.a('function');
    });

    it('should correctly identify dates within range with Date objects', () => {
      const startDate = new Date(2023, 0, 1); // Jan 1, 2023
      const endDate = new Date(2023, 0, 31); // Jan 31, 2023
      const dateInRange = new Date(2023, 0, 15); // Jan 15, 2023
      const dateBeforeRange = new Date(2022, 11, 31); // Dec 31, 2022
      const dateAfterRange = new Date(2023, 1, 1); // Feb 1, 2023

      expect(comparisonModule.isDateInRange(dateInRange, startDate, endDate)).to.be.true;
      expect(comparisonModule.isDateInRange(dateBeforeRange, startDate, endDate)).to.be.false;
      expect(comparisonModule.isDateInRange(dateAfterRange, startDate, endDate)).to.be.false;
    });

    it('should correctly identify dates at range boundaries', () => {
      const startDate = new Date(2023, 0, 1); // Jan 1, 2023
      const endDate = new Date(2023, 0, 31); // Jan 31, 2023

      // Dates at boundaries should be included (inclusive range)
      expect(comparisonModule.isDateInRange(startDate, startDate, endDate)).to.be.true;
      expect(comparisonModule.isDateInRange(endDate, startDate, endDate)).to.be.true;
    });

    it('should correctly identify dates within range with string dates', () => {
      expect(comparisonModule.isDateInRange(
        '2023-01-15', 
        '2023-01-01', 
        '2023-01-31'
      )).to.be.true;

      expect(comparisonModule.isDateInRange(
        '2022-12-31', 
        '2023-01-01', 
        '2023-01-31'
      )).to.be.false;
    });

    it('should correctly identify dates within range with timestamp numbers', () => {
      const startDate = new Date(2023, 0, 1).getTime(); // Jan 1, 2023
      const endDate = new Date(2023, 0, 31).getTime(); // Jan 31, 2023
      const dateInRange = new Date(2023, 0, 15).getTime(); // Jan 15, 2023
      const dateBeforeRange = new Date(2022, 11, 31).getTime(); // Dec 31, 2022

      expect(comparisonModule.isDateInRange(dateInRange, startDate, endDate)).to.be.true;
      expect(comparisonModule.isDateInRange(dateBeforeRange, startDate, endDate)).to.be.false;
    });

    it('should handle invalid dates correctly', () => {
      const validDate = new Date(2023, 0, 15);
      const validStartDate = new Date(2023, 0, 1);
      const validEndDate = new Date(2023, 0, 31);

      expect(comparisonModule.isDateInRange('invalid-date', validStartDate, validEndDate)).to.be.false;
      expect(comparisonModule.isDateInRange(validDate, 'invalid-date', validEndDate)).to.be.false;
      expect(comparisonModule.isDateInRange(validDate, validStartDate, 'invalid-date')).to.be.false;
      expect(comparisonModule.isDateInRange(null, undefined, validEndDate)).to.be.false;
    });
  });

  describe('isDateBefore', () => {
    it('should be exported correctly', () => {
      expect(comparisonModule.isDateBefore).to.be.a('function');
    });

    it('should correctly identify if a date is before another with Date objects', () => {
      const earlierDate = new Date(2023, 0, 1); // Jan 1, 2023
      const laterDate = new Date(2023, 0, 2); // Jan 2, 2023

      expect(comparisonModule.isDateBefore(earlierDate, laterDate)).to.be.true;
      expect(comparisonModule.isDateBefore(laterDate, earlierDate)).to.be.false;
      expect(comparisonModule.isDateBefore(earlierDate, earlierDate)).to.be.false; // Same date
    });

    it('should correctly identify if a date is before another with string dates', () => {
      expect(comparisonModule.isDateBefore('2023-01-01', '2023-01-02')).to.be.true;
      expect(comparisonModule.isDateBefore('2023-01-02', '2023-01-01')).to.be.false;
      expect(comparisonModule.isDateBefore('2023-01-01', '2023-01-01')).to.be.false; // Same date
    });

    it('should correctly identify if a date is before another with timestamp numbers', () => {
      const earlierDate = new Date(2023, 0, 1).getTime(); // Jan 1, 2023
      const laterDate = new Date(2023, 0, 2).getTime(); // Jan 2, 2023

      expect(comparisonModule.isDateBefore(earlierDate, laterDate)).to.be.true;
      expect(comparisonModule.isDateBefore(laterDate, earlierDate)).to.be.false;
    });

    it('should handle invalid dates correctly', () => {
      const validDate = new Date(2023, 0, 1);

      expect(comparisonModule.isDateBefore('invalid-date', validDate)).to.be.false;
      expect(comparisonModule.isDateBefore(validDate, 'invalid-date')).to.be.false;
      expect(comparisonModule.isDateBefore(null, undefined)).to.be.false;
    });
  });

  describe('isDateAfter', () => {
    it('should be exported correctly', () => {
      expect(comparisonModule.isDateAfter).to.be.a('function');
    });

    it('should correctly identify if a date is after another with Date objects', () => {
      const earlierDate = new Date(2023, 0, 1); // Jan 1, 2023
      const laterDate = new Date(2023, 0, 2); // Jan 2, 2023

      expect(comparisonModule.isDateAfter(laterDate, earlierDate)).to.be.true;
      expect(comparisonModule.isDateAfter(earlierDate, laterDate)).to.be.false;
      expect(comparisonModule.isDateAfter(earlierDate, earlierDate)).to.be.false; // Same date
    });

    it('should correctly identify if a date is after another with string dates', () => {
      expect(comparisonModule.isDateAfter('2023-01-02', '2023-01-01')).to.be.true;
      expect(comparisonModule.isDateAfter('2023-01-01', '2023-01-02')).to.be.false;
      expect(comparisonModule.isDateAfter('2023-01-01', '2023-01-01')).to.be.false; // Same date
    });

    it('should correctly identify if a date is after another with timestamp numbers', () => {
      const earlierDate = new Date(2023, 0, 1).getTime(); // Jan 1, 2023
      const laterDate = new Date(2023, 0, 2).getTime(); // Jan 2, 2023

      expect(comparisonModule.isDateAfter(laterDate, earlierDate)).to.be.true;
      expect(comparisonModule.isDateAfter(earlierDate, laterDate)).to.be.false;
    });

    it('should handle invalid dates correctly', () => {
      const validDate = new Date(2023, 0, 1);

      expect(comparisonModule.isDateAfter('invalid-date', validDate)).to.be.false;
      expect(comparisonModule.isDateAfter(validDate, 'invalid-date')).to.be.false;
      expect(comparisonModule.isDateAfter(null, undefined)).to.be.false;
    });
  });

  describe('isDateSameOrBefore', () => {
    it('should be exported correctly', () => {
      expect(comparisonModule.isDateSameOrBefore).to.be.a('function');
    });

    it('should correctly identify if a date is same or before another with Date objects', () => {
      const earlierDate = new Date(2023, 0, 1); // Jan 1, 2023
      const laterDate = new Date(2023, 0, 2); // Jan 2, 2023
      const sameDate = new Date(2023, 0, 1); // Jan 1, 2023 (same as earlierDate)

      expect(comparisonModule.isDateSameOrBefore(earlierDate, laterDate)).to.be.true;
      expect(comparisonModule.isDateSameOrBefore(sameDate, earlierDate)).to.be.true;
      expect(comparisonModule.isDateSameOrBefore(laterDate, earlierDate)).to.be.false;
    });

    it('should correctly identify if a date is same or before another with string dates', () => {
      expect(comparisonModule.isDateSameOrBefore('2023-01-01', '2023-01-02')).to.be.true;
      expect(comparisonModule.isDateSameOrBefore('2023-01-01', '2023-01-01')).to.be.true;
      expect(comparisonModule.isDateSameOrBefore('2023-01-02', '2023-01-01')).to.be.false;
    });

    it('should handle invalid dates correctly', () => {
      const validDate = new Date(2023, 0, 1);

      expect(comparisonModule.isDateSameOrBefore('invalid-date', validDate)).to.be.false;
      expect(comparisonModule.isDateSameOrBefore(validDate, 'invalid-date')).to.be.false;
      expect(comparisonModule.isDateSameOrBefore(null, undefined)).to.be.false;
    });
  });

  describe('isDateSameOrAfter', () => {
    it('should be exported correctly', () => {
      expect(comparisonModule.isDateSameOrAfter).to.be.a('function');
    });

    it('should correctly identify if a date is same or after another with Date objects', () => {
      const earlierDate = new Date(2023, 0, 1); // Jan 1, 2023
      const laterDate = new Date(2023, 0, 2); // Jan 2, 2023
      const sameDate = new Date(2023, 0, 2); // Jan 2, 2023 (same as laterDate)

      expect(comparisonModule.isDateSameOrAfter(laterDate, earlierDate)).to.be.true;
      expect(comparisonModule.isDateSameOrAfter(sameDate, laterDate)).to.be.true;
      expect(comparisonModule.isDateSameOrAfter(earlierDate, laterDate)).to.be.false;
    });

    it('should correctly identify if a date is same or after another with string dates', () => {
      expect(comparisonModule.isDateSameOrAfter('2023-01-02', '2023-01-01')).to.be.true;
      expect(comparisonModule.isDateSameOrAfter('2023-01-01', '2023-01-01')).to.be.true;
      expect(comparisonModule.isDateSameOrAfter('2023-01-01', '2023-01-02')).to.be.false;
    });

    it('should handle invalid dates correctly', () => {
      const validDate = new Date(2023, 0, 1);

      expect(comparisonModule.isDateSameOrAfter('invalid-date', validDate)).to.be.false;
      expect(comparisonModule.isDateSameOrAfter(validDate, 'invalid-date')).to.be.false;
      expect(comparisonModule.isDateSameOrAfter(null, undefined)).to.be.false;
    });
  });
});