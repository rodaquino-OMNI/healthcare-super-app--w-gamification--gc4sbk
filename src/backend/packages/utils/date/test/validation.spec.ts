/**
 * @file validation.spec.ts
 * @description Tests for date validation utility re-exports
 */

import { expect } from 'chai';
import * as validationModule from '../validation';

describe('Date Validation Re-exports', () => {
  describe('isValidDate', () => {
    it('should be exported correctly', () => {
      expect(validationModule.isValidDate).to.be.a('function');
    });

    it('should validate Date objects correctly', () => {
      expect(validationModule.isValidDate(new Date())).to.be.true;
      expect(validationModule.isValidDate(new Date('invalid'))).to.be.false;
    });

    it('should validate string dates correctly', () => {
      expect(validationModule.isValidDate('2023-01-01')).to.be.true;
      expect(validationModule.isValidDate('2023-01-32')).to.be.false; // Invalid day
      expect(validationModule.isValidDate('not a date')).to.be.false;
      expect(validationModule.isValidDate('')).to.be.false;
    });

    it('should validate numeric timestamps correctly', () => {
      expect(validationModule.isValidDate(Date.now())).to.be.true;
      expect(validationModule.isValidDate(0)).to.be.true; // Unix epoch
      expect(validationModule.isValidDate(NaN)).to.be.false;
      expect(validationModule.isValidDate(Infinity)).to.be.false;
    });

    it('should handle null and undefined correctly', () => {
      expect(validationModule.isValidDate(null)).to.be.false;
      expect(validationModule.isValidDate(undefined)).to.be.false;
    });
  });

  describe('isValidDateFormat', () => {
    it('should be exported correctly', () => {
      expect(validationModule.isValidDateFormat).to.be.a('function');
    });

    // Note: This is testing the re-export, not the implementation
    // The actual implementation might be isValidDateString or similar
  });

  describe('isFutureDate', () => {
    it('should be exported correctly', () => {
      expect(validationModule.isFutureDate).to.be.a('function');
    });

    // Note: This is testing the re-export, not the implementation
    // The actual implementation might be isDateInFuture or similar
  });

  describe('isPastDate', () => {
    it('should be exported correctly', () => {
      expect(validationModule.isPastDate).to.be.a('function');
    });

    // Note: This is testing the re-export, not the implementation
    // The actual implementation might be isDateInPast or similar
  });

  describe('isValidJourneyDate', () => {
    it('should be exported correctly', () => {
      expect(validationModule.isValidJourneyDate).to.be.a('function');
    });

    it('should validate dates for health journey correctly', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1); // 1 year ago
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year in future
      
      expect(validationModule.isValidJourneyDate(pastDate, 'health')).to.be.true;
      expect(validationModule.isValidJourneyDate(futureDate, 'health')).to.be.false;
    });

    it('should validate dates for care journey correctly', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1); // 1 year ago
      
      const nearFutureDate = new Date();
      nearFutureDate.setMonth(nearFutureDate.getMonth() + 6); // 6 months in future
      
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 2); // 2 years in future
      
      expect(validationModule.isValidJourneyDate(pastDate, 'care')).to.be.true;
      expect(validationModule.isValidJourneyDate(nearFutureDate, 'care')).to.be.true;
      expect(validationModule.isValidJourneyDate(farFutureDate, 'care')).to.be.false;
    });

    it('should validate dates for plan journey correctly', () => {
      const recentPastDate = new Date();
      recentPastDate.setFullYear(recentPastDate.getFullYear() - 1); // 1 year ago
      
      const distantPastDate = new Date();
      distantPastDate.setFullYear(distantPastDate.getFullYear() - 6); // 6 years ago
      
      expect(validationModule.isValidJourneyDate(recentPastDate, 'plan')).to.be.true;
      expect(validationModule.isValidJourneyDate(distantPastDate, 'plan')).to.be.false;
    });

    it('should handle invalid dates correctly', () => {
      expect(validationModule.isValidJourneyDate(null, 'health')).to.be.false;
      expect(validationModule.isValidJourneyDate('invalid date', 'care')).to.be.false;
      expect(validationModule.isValidJourneyDate(undefined, 'plan')).to.be.false;
    });
  });
});