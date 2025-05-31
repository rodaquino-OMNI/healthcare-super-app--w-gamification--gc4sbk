import { isSameDay, isDateInRange } from '../comparison';

describe('Date Comparison Module', () => {
  describe('isSameDay function', () => {
    it('should be properly exported from comparison module', () => {
      expect(isSameDay).toBeDefined();
      expect(typeof isSameDay).toBe('function');
    });

    it('should return true when dates are on the same day (Date objects)', () => {
      const date1 = new Date('2023-05-15T10:30:00');
      const date2 = new Date('2023-05-15T18:45:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false when dates are on different days (Date objects)', () => {
      const date1 = new Date('2023-05-15T10:30:00');
      const date2 = new Date('2023-05-16T10:30:00');
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should handle string date inputs correctly', () => {
      expect(isSameDay('2023-05-15T10:30:00', '2023-05-15T18:45:00')).toBe(true);
      expect(isSameDay('2023-05-15', '2023-05-15')).toBe(true);
      expect(isSameDay('2023-05-15', '2023-05-16')).toBe(false);
      expect(isSameDay('May 15, 2023', 'May 15, 2023 18:45:00')).toBe(true);
    });

    it('should handle timestamp (number) inputs correctly', () => {
      const timestamp1 = new Date('2023-05-15T10:30:00').getTime();
      const timestamp2 = new Date('2023-05-15T18:45:00').getTime();
      const timestamp3 = new Date('2023-05-16T10:30:00').getTime();
      
      expect(isSameDay(timestamp1, timestamp2)).toBe(true);
      expect(isSameDay(timestamp1, timestamp3)).toBe(false);
    });

    it('should handle mixed input types correctly', () => {
      const dateObj = new Date('2023-05-15T10:30:00');
      const dateStr = '2023-05-15T18:45:00';
      const timestamp = new Date('2023-05-15T14:20:00').getTime();
      
      expect(isSameDay(dateObj, dateStr)).toBe(true);
      expect(isSameDay(dateStr, timestamp)).toBe(true);
      expect(isSameDay(dateObj, timestamp)).toBe(true);
    });

    it('should return false for invalid date inputs', () => {
      expect(isSameDay('not-a-date', '2023-05-15')).toBe(false);
      expect(isSameDay('2023-05-15', 'not-a-date')).toBe(false);
      expect(isSameDay('not-a-date', 'also-not-a-date')).toBe(false);
      expect(isSameDay(null, '2023-05-15')).toBe(false);
      expect(isSameDay('2023-05-15', undefined)).toBe(false);
    });

    it('should handle edge cases with midnight boundaries', () => {
      const endOfDay = new Date('2023-05-15T23:59:59.999');
      const startOfNextDay = new Date('2023-05-16T00:00:00.000');
      
      expect(isSameDay(endOfDay, startOfNextDay)).toBe(false);
      expect(isSameDay(endOfDay, new Date('2023-05-15T00:00:00'))).toBe(true);
    });
  });

  describe('isDateInRange function', () => {
    it('should be properly exported from comparison module', () => {
      expect(isDateInRange).toBeDefined();
      expect(typeof isDateInRange).toBe('function');
    });

    it('should return true when date is within range (Date objects)', () => {
      const date = new Date('2023-05-15T12:00:00');
      const startDate = new Date('2023-05-10T00:00:00');
      const endDate = new Date('2023-05-20T23:59:59');
      
      expect(isDateInRange(date, startDate, endDate)).toBe(true);
    });

    it('should return false when date is before range (Date objects)', () => {
      const date = new Date('2023-05-05T12:00:00');
      const startDate = new Date('2023-05-10T00:00:00');
      const endDate = new Date('2023-05-20T23:59:59');
      
      expect(isDateInRange(date, startDate, endDate)).toBe(false);
    });

    it('should return false when date is after range (Date objects)', () => {
      const date = new Date('2023-05-25T12:00:00');
      const startDate = new Date('2023-05-10T00:00:00');
      const endDate = new Date('2023-05-20T23:59:59');
      
      expect(isDateInRange(date, startDate, endDate)).toBe(false);
    });

    it('should return true when date is exactly at range boundaries', () => {
      const startDate = new Date('2023-05-10T00:00:00');
      const endDate = new Date('2023-05-20T23:59:59');
      
      // Date at start boundary
      expect(isDateInRange(startDate, startDate, endDate)).toBe(true);
      
      // Date at end boundary
      expect(isDateInRange(endDate, startDate, endDate)).toBe(true);
    });

    it('should handle string date inputs correctly', () => {
      expect(isDateInRange('2023-05-15', '2023-05-10', '2023-05-20')).toBe(true);
      expect(isDateInRange('2023-05-05', '2023-05-10', '2023-05-20')).toBe(false);
      expect(isDateInRange('2023-05-25', '2023-05-10', '2023-05-20')).toBe(false);
    });

    it('should handle timestamp (number) inputs correctly', () => {
      const dateTimestamp = new Date('2023-05-15T12:00:00').getTime();
      const startTimestamp = new Date('2023-05-10T00:00:00').getTime();
      const endTimestamp = new Date('2023-05-20T23:59:59').getTime();
      
      expect(isDateInRange(dateTimestamp, startTimestamp, endTimestamp)).toBe(true);
      
      const beforeRangeTimestamp = new Date('2023-05-05T12:00:00').getTime();
      expect(isDateInRange(beforeRangeTimestamp, startTimestamp, endTimestamp)).toBe(false);
      
      const afterRangeTimestamp = new Date('2023-05-25T12:00:00').getTime();
      expect(isDateInRange(afterRangeTimestamp, startTimestamp, endTimestamp)).toBe(false);
    });

    it('should handle mixed input types correctly', () => {
      const dateObj = new Date('2023-05-15T12:00:00');
      const startDateStr = '2023-05-10';
      const endDateTimestamp = new Date('2023-05-20T23:59:59').getTime();
      
      expect(isDateInRange(dateObj, startDateStr, endDateTimestamp)).toBe(true);
    });

    it('should return false for invalid date inputs', () => {
      const validDate = new Date('2023-05-15T12:00:00');
      const validStartDate = new Date('2023-05-10T00:00:00');
      const validEndDate = new Date('2023-05-20T23:59:59');
      
      expect(isDateInRange('not-a-date', validStartDate, validEndDate)).toBe(false);
      expect(isDateInRange(validDate, 'not-a-date', validEndDate)).toBe(false);
      expect(isDateInRange(validDate, validStartDate, 'not-a-date')).toBe(false);
      expect(isDateInRange(null, validStartDate, validEndDate)).toBe(false);
      expect(isDateInRange(validDate, undefined, validEndDate)).toBe(false);
    });

    it('should handle single-day ranges correctly', () => {
      const date = new Date('2023-05-15T12:00:00');
      const sameDay = new Date('2023-05-15T18:30:00');
      
      expect(isDateInRange(date, date, date)).toBe(true);
      expect(isDateInRange(sameDay, date, date)).toBe(true);
    });
  });
});