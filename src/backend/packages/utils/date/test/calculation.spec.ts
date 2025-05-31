import { calculateAge, getTimeAgo } from '../calculation';

describe('Date Calculation Utilities', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly from a Date object', () => {
      // Create a reference date (2023-01-01)
      const referenceDate = new Date(2023, 0, 1);
      
      // Test with a birthdate 30 years before the reference date
      const birthdate = new Date(1993, 0, 1);
      
      expect(calculateAge(birthdate, referenceDate)).toBe(30);
    });

    it('should calculate age correctly from a date string', () => {
      // Create a reference date (2023-01-01)
      const referenceDate = new Date(2023, 0, 1);
      
      // Test with a birthdate string in dd/MM/yyyy format
      const birthdateStr = '01/01/1993';
      
      expect(calculateAge(birthdateStr, referenceDate)).toBe(30);
    });

    it('should handle edge cases around birthdays', () => {
      // Create a reference date (2023-01-01)
      const referenceDate = new Date(2023, 0, 1);
      
      // Test with a birthdate one day after the reference date (day before birthday)
      const beforeBirthday = new Date(1993, 0, 2);
      expect(calculateAge(beforeBirthday, referenceDate)).toBe(29);
      
      // Test with a birthdate on the reference date (exact birthday)
      const exactBirthday = new Date(1993, 0, 1);
      expect(calculateAge(exactBirthday, referenceDate)).toBe(30);
      
      // Test with a birthdate one day before the reference date (day after birthday)
      const afterBirthday = new Date(1992, 11, 31);
      expect(calculateAge(afterBirthday, referenceDate)).toBe(30);
    });

    it('should throw an error for invalid birthdates', () => {
      expect(() => calculateAge('invalid-date')).toThrow();
    });
  });

  describe('getTimeAgo', () => {
    it('should return time ago in Portuguese (pt-BR) by default', () => {
      // Mock current date to ensure consistent test results
      const now = new Date(2023, 0, 15, 12, 0, 0); // 2023-01-15 12:00:00
      jest.spyOn(global, 'Date').mockImplementation(() => now);
      
      // Test various time differences
      const fiveMinutesAgo = new Date(2023, 0, 15, 11, 55, 0); // 5 minutes ago
      expect(getTimeAgo(fiveMinutesAgo)).toBe('5 minutos atrás');
      
      const oneHourAgo = new Date(2023, 0, 15, 11, 0, 0); // 1 hour ago
      expect(getTimeAgo(oneHourAgo)).toBe('1 hora atrás');
      
      const oneDayAgo = new Date(2023, 0, 14, 12, 0, 0); // 1 day ago
      expect(getTimeAgo(oneDayAgo)).toBe('1 dia atrás');
      
      const oneMonthAgo = new Date(2022, 11, 15, 12, 0, 0); // 1 month ago
      expect(getTimeAgo(oneMonthAgo)).toBe('1 mês atrás');
      
      const oneYearAgo = new Date(2022, 0, 15, 12, 0, 0); // 1 year ago
      expect(getTimeAgo(oneYearAgo)).toBe('1 ano atrás');
      
      // Restore the original Date implementation
      jest.spyOn(global, 'Date').mockRestore();
    });

    it('should return time ago in English (en-US) when specified', () => {
      // Mock current date to ensure consistent test results
      const now = new Date(2023, 0, 15, 12, 0, 0); // 2023-01-15 12:00:00
      jest.spyOn(global, 'Date').mockImplementation(() => now);
      
      // Test various time differences with en-US locale
      const fiveMinutesAgo = new Date(2023, 0, 15, 11, 55, 0); // 5 minutes ago
      expect(getTimeAgo(fiveMinutesAgo, 'en-US')).toBe('5 minutes ago');
      
      const oneHourAgo = new Date(2023, 0, 15, 11, 0, 0); // 1 hour ago
      expect(getTimeAgo(oneHourAgo, 'en-US')).toBe('1 hour ago');
      
      const oneDayAgo = new Date(2023, 0, 14, 12, 0, 0); // 1 day ago
      expect(getTimeAgo(oneDayAgo, 'en-US')).toBe('1 day ago');
      
      const oneMonthAgo = new Date(2022, 11, 15, 12, 0, 0); // 1 month ago
      expect(getTimeAgo(oneMonthAgo, 'en-US')).toBe('1 month ago');
      
      const oneYearAgo = new Date(2022, 0, 15, 12, 0, 0); // 1 year ago
      expect(getTimeAgo(oneYearAgo, 'en-US')).toBe('1 year ago');
      
      // Restore the original Date implementation
      jest.spyOn(global, 'Date').mockRestore();
    });

    it('should handle different input types', () => {
      // Mock current date to ensure consistent test results
      const now = new Date(2023, 0, 15, 12, 0, 0); // 2023-01-15 12:00:00
      jest.spyOn(global, 'Date').mockImplementation(() => now);
      
      // Test with Date object
      const dateObj = new Date(2023, 0, 14, 12, 0, 0); // 1 day ago
      expect(getTimeAgo(dateObj)).toBe('1 dia atrás');
      
      // Test with ISO string
      const isoString = '2023-01-14T12:00:00.000Z'; // 1 day ago
      expect(getTimeAgo(isoString)).toBe('1 dia atrás');
      
      // Test with timestamp (milliseconds)
      const timestamp = dateObj.getTime(); // 1 day ago
      expect(getTimeAgo(timestamp)).toBe('1 dia atrás');
      
      // Restore the original Date implementation
      jest.spyOn(global, 'Date').mockRestore();
    });

    it('should return empty string for invalid dates', () => {
      expect(getTimeAgo('invalid-date')).toBe('');
      expect(getTimeAgo(null as any)).toBe('');
      expect(getTimeAgo(undefined as any)).toBe('');
    });
  });
});