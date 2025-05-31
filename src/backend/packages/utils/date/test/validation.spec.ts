import { isValidDate } from '../validation';

describe('Date Validation Module', () => {
  describe('isValidDate function', () => {
    it('should be properly exported from validation module', () => {
      expect(isValidDate).toBeDefined();
      expect(typeof isValidDate).toBe('function');
    });

    it('should return true for valid Date objects', () => {
      const validDate = new Date();
      expect(isValidDate(validDate)).toBe(true);

      const specificDate = new Date('2023-01-15T12:00:00');
      expect(isValidDate(specificDate)).toBe(true);
    });

    it('should return true for valid date strings', () => {
      expect(isValidDate('2023-01-15')).toBe(true);
      expect(isValidDate('2023-01-15T12:00:00')).toBe(true);
      expect(isValidDate('January 15, 2023')).toBe(true);
      expect(isValidDate('15/01/2023')).toBe(true); // dd/MM/yyyy format
    });

    it('should return true for valid timestamps (numbers)', () => {
      const now = Date.now();
      expect(isValidDate(now)).toBe(true);

      const specificTimestamp = new Date('2023-01-15').getTime();
      expect(isValidDate(specificTimestamp)).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate('2023-13-45')).toBe(false); // Invalid month and day
      expect(isValidDate('32/01/2023')).toBe(false); // Invalid day
    });

    it('should return false for invalid Date objects', () => {
      const invalidDate = new Date('invalid-date-string');
      expect(isValidDate(invalidDate)).toBe(false);
    });

    it('should handle edge cases correctly', () => {
      // Null and undefined should return false
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);

      // Non-date types should return false
      expect(isValidDate({})).toBe(false);
      expect(isValidDate([])).toBe(false);
      expect(isValidDate(true)).toBe(false);
      expect(isValidDate(false)).toBe(false);
      expect(isValidDate(() => {})).toBe(false);
    });

    it('should handle leap year edge cases', () => {
      // February 29 in leap year (valid)
      expect(isValidDate('2020-02-29')).toBe(true);
      
      // February 29 in non-leap year (invalid)
      expect(isValidDate('2023-02-29')).toBe(false);
    });

    it('should handle different date formats consistently', () => {
      const testDate = new Date('2023-01-15');
      const testDateISOString = testDate.toISOString();
      const testDateTimeStamp = testDate.getTime();

      // All these should return true as they represent the same valid date
      expect(isValidDate(testDate)).toBe(true);
      expect(isValidDate(testDateISOString)).toBe(true);
      expect(isValidDate(testDateTimeStamp)).toBe(true);
    });
  });
});