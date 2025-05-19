/**
 * Unit tests for date calculation utilities
 */
import {
  calculateAge,
  getTimeAgo,
  getDatesBetween,
  isDateInRange,
  formatRelativeDate,
  getDaysDifference,
  getMonthsDifference,
  getYearsDifference,
  SupportedLocale
} from '../../../src/date/calculation';

describe('Date Calculation Utilities', () => {
  // Store original Date.now to restore after tests
  const originalDateNow = Date.now;
  
  // Mock date for consistent testing
  const mockNow = new Date('2023-05-15T12:00:00Z').getTime();
  
  beforeAll(() => {
    // Mock Date.now for consistent test results
    global.Date.now = jest.fn(() => mockNow);
    jest.spyOn(global, 'Date').mockImplementation((arg) => {
      return arg ? new originalDate(arg) : new originalDate(mockNow);
    });
  });
  
  afterAll(() => {
    // Restore original Date implementation
    global.Date.now = originalDateNow;
    jest.restoreAllMocks();
  });
  
  const originalDate = global.Date;
  
  describe('calculateAge', () => {
    it('should calculate age correctly for a standard case', () => {
      const birthdate = new Date('1990-01-01');
      const referenceDate = new Date('2023-05-15');
      
      expect(calculateAge(birthdate, referenceDate)).toBe(33);
    });
    
    it('should calculate age correctly when birthdate is provided as string', () => {
      const birthdate = '1990-01-01';
      const referenceDate = new Date('2023-05-15');
      
      expect(calculateAge(birthdate, referenceDate)).toBe(33);
    });
    
    it('should calculate age correctly when birthdate is provided as timestamp', () => {
      const birthdate = new Date('1990-01-01').getTime();
      const referenceDate = new Date('2023-05-15');
      
      expect(calculateAge(birthdate, referenceDate)).toBe(33);
    });
    
    it('should calculate age as 0 for a child less than 1 year old', () => {
      const birthdate = new Date('2023-01-01');
      const referenceDate = new Date('2023-05-15');
      
      expect(calculateAge(birthdate, referenceDate)).toBe(0);
    });
    
    it('should handle leap year birthdates correctly', () => {
      // February 29 in a leap year
      const birthdate = new Date('2000-02-29');
      const referenceDate = new Date('2023-05-15');
      
      expect(calculateAge(birthdate, referenceDate)).toBe(23);
    });
    
    it('should handle same-day birthdays correctly', () => {
      // Birthday is today
      const birthdate = new Date('1990-05-15');
      const referenceDate = new Date('2023-05-15');
      
      expect(calculateAge(birthdate, referenceDate)).toBe(33);
    });
    
    it('should handle day-before-birthday correctly', () => {
      // Birthday is tomorrow
      const birthdate = new Date('1990-05-16');
      const referenceDate = new Date('2023-05-15');
      
      expect(calculateAge(birthdate, referenceDate)).toBe(32);
    });
    
    it('should handle day-after-birthday correctly', () => {
      // Birthday was yesterday
      const birthdate = new Date('1990-05-14');
      const referenceDate = new Date('2023-05-15');
      
      expect(calculateAge(birthdate, referenceDate)).toBe(33);
    });
    
    it('should throw error for invalid birthdate', () => {
      expect(() => calculateAge('invalid-date')).toThrow('Invalid birthdate provided');
    });
    
    it('should throw error for future birthdate', () => {
      const futureBirthdate = new Date('2024-01-01');
      const referenceDate = new Date('2023-05-15');
      
      expect(() => calculateAge(futureBirthdate, referenceDate)).toThrow('Birthdate cannot be in the future');
    });
  });
  
  describe('getTimeAgo', () => {
    // Test Portuguese locale (default)
    describe('with pt-BR locale', () => {
      const locale: SupportedLocale = 'pt-BR';
      
      it('should return "agora mesmo" for dates less than 10 seconds ago', () => {
        const date = new Date(mockNow - 5 * 1000); // 5 seconds ago
        expect(getTimeAgo(date, locale)).toBe('agora mesmo');
      });
      
      it('should format seconds correctly', () => {
        const date = new Date(mockNow - 30 * 1000); // 30 seconds ago
        expect(getTimeAgo(date, locale)).toBe('30 segundos atrás');
      });
      
      it('should format single minute correctly', () => {
        const date = new Date(mockNow - 60 * 1000); // 1 minute ago
        expect(getTimeAgo(date, locale)).toBe('1 minuto atrás');
      });
      
      it('should format multiple minutes correctly', () => {
        const date = new Date(mockNow - 5 * 60 * 1000); // 5 minutes ago
        expect(getTimeAgo(date, locale)).toBe('5 minutos atrás');
      });
      
      it('should format single hour correctly', () => {
        const date = new Date(mockNow - 60 * 60 * 1000); // 1 hour ago
        expect(getTimeAgo(date, locale)).toBe('1 hora atrás');
      });
      
      it('should format multiple hours correctly', () => {
        const date = new Date(mockNow - 5 * 60 * 60 * 1000); // 5 hours ago
        expect(getTimeAgo(date, locale)).toBe('5 horas atrás');
      });
      
      it('should format single day correctly', () => {
        const date = new Date(mockNow - 24 * 60 * 60 * 1000); // 1 day ago
        expect(getTimeAgo(date, locale)).toBe('1 dia atrás');
      });
      
      it('should format multiple days correctly', () => {
        const date = new Date(mockNow - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        expect(getTimeAgo(date, locale)).toBe('5 dias atrás');
      });
      
      it('should format single week correctly', () => {
        const date = new Date(mockNow - 7 * 24 * 60 * 60 * 1000); // 1 week ago
        expect(getTimeAgo(date, locale)).toBe('1 semana atrás');
      });
      
      it('should format multiple weeks correctly', () => {
        const date = new Date(mockNow - 3 * 7 * 24 * 60 * 60 * 1000); // 3 weeks ago
        expect(getTimeAgo(date, locale)).toBe('3 semanas atrás');
      });
      
      it('should format single month correctly', () => {
        // Mock a date exactly 1 month ago
        const oneMonthAgo = new Date('2023-04-15T12:00:00Z');
        expect(getTimeAgo(oneMonthAgo, locale)).toBe('1 mês atrás');
      });
      
      it('should format multiple months correctly', () => {
        // Mock a date exactly 3 months ago
        const threeMonthsAgo = new Date('2023-02-15T12:00:00Z');
        expect(getTimeAgo(threeMonthsAgo, locale)).toBe('3 meses atrás');
      });
      
      it('should format single year correctly', () => {
        // Mock a date exactly 1 year ago
        const oneYearAgo = new Date('2022-05-15T12:00:00Z');
        expect(getTimeAgo(oneYearAgo, locale)).toBe('1 ano atrás');
      });
      
      it('should format multiple years correctly', () => {
        // Mock a date exactly 5 years ago
        const fiveYearsAgo = new Date('2018-05-15T12:00:00Z');
        expect(getTimeAgo(fiveYearsAgo, locale)).toBe('5 anos atrás');
      });
      
      it('should handle future dates correctly', () => {
        const futureDate = new Date(mockNow + 24 * 60 * 60 * 1000); // 1 day in future
        expect(getTimeAgo(futureDate, locale)).toBe('no futuro');
      });
      
      it('should return empty string for invalid dates', () => {
        expect(getTimeAgo('invalid-date', locale)).toBe('');
      });
    });
    
    // Test English locale
    describe('with en-US locale', () => {
      const locale: SupportedLocale = 'en-US';
      
      it('should return "just now" for dates less than 10 seconds ago', () => {
        const date = new Date(mockNow - 5 * 1000); // 5 seconds ago
        expect(getTimeAgo(date, locale)).toBe('just now');
      });
      
      it('should format seconds correctly', () => {
        const date = new Date(mockNow - 30 * 1000); // 30 seconds ago
        expect(getTimeAgo(date, locale)).toBe('30 seconds ago');
      });
      
      it('should format single minute correctly', () => {
        const date = new Date(mockNow - 60 * 1000); // 1 minute ago
        expect(getTimeAgo(date, locale)).toBe('1 minute ago');
      });
      
      it('should format multiple minutes correctly', () => {
        const date = new Date(mockNow - 5 * 60 * 1000); // 5 minutes ago
        expect(getTimeAgo(date, locale)).toBe('5 minutes ago');
      });
      
      it('should format single hour correctly', () => {
        const date = new Date(mockNow - 60 * 60 * 1000); // 1 hour ago
        expect(getTimeAgo(date, locale)).toBe('1 hour ago');
      });
      
      it('should format multiple hours correctly', () => {
        const date = new Date(mockNow - 5 * 60 * 60 * 1000); // 5 hours ago
        expect(getTimeAgo(date, locale)).toBe('5 hours ago');
      });
      
      it('should format single day correctly', () => {
        const date = new Date(mockNow - 24 * 60 * 60 * 1000); // 1 day ago
        expect(getTimeAgo(date, locale)).toBe('1 day ago');
      });
      
      it('should format multiple days correctly', () => {
        const date = new Date(mockNow - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        expect(getTimeAgo(date, locale)).toBe('5 days ago');
      });
      
      it('should format single week correctly', () => {
        const date = new Date(mockNow - 7 * 24 * 60 * 60 * 1000); // 1 week ago
        expect(getTimeAgo(date, locale)).toBe('1 week ago');
      });
      
      it('should format multiple weeks correctly', () => {
        const date = new Date(mockNow - 3 * 7 * 24 * 60 * 60 * 1000); // 3 weeks ago
        expect(getTimeAgo(date, locale)).toBe('3 weeks ago');
      });
      
      it('should format single month correctly', () => {
        // Mock a date exactly 1 month ago
        const oneMonthAgo = new Date('2023-04-15T12:00:00Z');
        expect(getTimeAgo(oneMonthAgo, locale)).toBe('1 month ago');
      });
      
      it('should format multiple months correctly', () => {
        // Mock a date exactly 3 months ago
        const threeMonthsAgo = new Date('2023-02-15T12:00:00Z');
        expect(getTimeAgo(threeMonthsAgo, locale)).toBe('3 months ago');
      });
      
      it('should format single year correctly', () => {
        // Mock a date exactly 1 year ago
        const oneYearAgo = new Date('2022-05-15T12:00:00Z');
        expect(getTimeAgo(oneYearAgo, locale)).toBe('1 year ago');
      });
      
      it('should format multiple years correctly', () => {
        // Mock a date exactly 5 years ago
        const fiveYearsAgo = new Date('2018-05-15T12:00:00Z');
        expect(getTimeAgo(fiveYearsAgo, locale)).toBe('5 years ago');
      });
      
      it('should handle future dates correctly', () => {
        const futureDate = new Date(mockNow + 24 * 60 * 60 * 1000); // 1 day in future
        expect(getTimeAgo(futureDate, locale)).toBe('in the future');
      });
      
      it('should return empty string for invalid dates', () => {
        expect(getTimeAgo('invalid-date', locale)).toBe('');
      });
    });
  });
  
  describe('getDatesBetween', () => {
    it('should return array of dates between start and end dates (inclusive)', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      const result = getDatesBetween(startDate, endDate);
      
      expect(result.length).toBe(5);
      expect(result[0].toISOString().split('T')[0]).toBe('2023-05-01');
      expect(result[4].toISOString().split('T')[0]).toBe('2023-05-05');
    });
    
    it('should handle same start and end date', () => {
      const date = new Date('2023-05-01');
      const result = getDatesBetween(date, date);
      
      expect(result.length).toBe(1);
      expect(result[0].toISOString().split('T')[0]).toBe('2023-05-01');
    });
    
    it('should throw error for invalid date range', () => {
      const startDate = new Date('2023-05-05');
      const endDate = new Date('2023-05-01');
      
      expect(() => getDatesBetween(startDate, endDate)).toThrow('Start date must be before or the same as end date');
    });
    
    it('should throw error for invalid dates', () => {
      expect(() => getDatesBetween('invalid-date', '2023-05-01')).toThrow('Invalid date range provided');
      expect(() => getDatesBetween('2023-05-01', 'invalid-date')).toThrow('Invalid date range provided');
    });
  });
  
  describe('isDateInRange', () => {
    it('should return true when date is within range', () => {
      const date = new Date('2023-05-03');
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      
      expect(isDateInRange(date, startDate, endDate)).toBe(true);
    });
    
    it('should return true when date is equal to start date', () => {
      const date = new Date('2023-05-01');
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      
      expect(isDateInRange(date, startDate, endDate)).toBe(true);
    });
    
    it('should return true when date is equal to end date', () => {
      const date = new Date('2023-05-05');
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      
      expect(isDateInRange(date, startDate, endDate)).toBe(true);
    });
    
    it('should return false when date is before range', () => {
      const date = new Date('2023-04-30');
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      
      expect(isDateInRange(date, startDate, endDate)).toBe(false);
    });
    
    it('should return false when date is after range', () => {
      const date = new Date('2023-05-06');
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      
      expect(isDateInRange(date, startDate, endDate)).toBe(false);
    });
    
    it('should return false for invalid dates', () => {
      expect(isDateInRange('invalid-date', '2023-05-01', '2023-05-05')).toBe(false);
      expect(isDateInRange('2023-05-03', 'invalid-date', '2023-05-05')).toBe(false);
      expect(isDateInRange('2023-05-03', '2023-05-01', 'invalid-date')).toBe(false);
    });
  });
  
  describe('formatRelativeDate', () => {
    // Test Portuguese locale (default)
    describe('with pt-BR locale', () => {
      const locale: SupportedLocale = 'pt-BR';
      
      it('should return "Hoje" for today', () => {
        const today = new Date(mockNow);
        expect(formatRelativeDate(today, locale)).toBe('Hoje');
      });
      
      it('should return "Ontem" for yesterday', () => {
        const yesterday = new Date(mockNow - 24 * 60 * 60 * 1000);
        expect(formatRelativeDate(yesterday, locale)).toBe('Ontem');
      });
      
      it('should return days ago for recent past dates', () => {
        const threeDaysAgo = new Date(mockNow - 3 * 24 * 60 * 60 * 1000);
        expect(formatRelativeDate(threeDaysAgo, locale)).toBe('3 dias atrás');
      });
      
      it('should return "Amanhã" for tomorrow', () => {
        const tomorrow = new Date(mockNow + 24 * 60 * 60 * 1000);
        expect(formatRelativeDate(tomorrow, locale)).toBe('Amanhã');
      });
      
      it('should format future dates correctly', () => {
        const inFiveDays = new Date(mockNow + 5 * 24 * 60 * 60 * 1000);
        expect(formatRelativeDate(inFiveDays, locale)).toBe('em 5 dias');
      });
      
      it('should return "No futuro" for dates far in the future', () => {
        const farFuture = new Date(mockNow + 60 * 24 * 60 * 60 * 1000); // 60 days in future
        expect(formatRelativeDate(farFuture, locale)).toBe('No futuro');
      });
      
      it('should return empty string for invalid dates', () => {
        expect(formatRelativeDate('invalid-date', locale)).toBe('');
      });
    });
    
    // Test English locale
    describe('with en-US locale', () => {
      const locale: SupportedLocale = 'en-US';
      
      it('should return "Today" for today', () => {
        const today = new Date(mockNow);
        expect(formatRelativeDate(today, locale)).toBe('Today');
      });
      
      it('should return "Yesterday" for yesterday', () => {
        const yesterday = new Date(mockNow - 24 * 60 * 60 * 1000);
        expect(formatRelativeDate(yesterday, locale)).toBe('Yesterday');
      });
      
      it('should return days ago for recent past dates', () => {
        const threeDaysAgo = new Date(mockNow - 3 * 24 * 60 * 60 * 1000);
        expect(formatRelativeDate(threeDaysAgo, locale)).toBe('3 days ago');
      });
      
      it('should return "Tomorrow" for tomorrow', () => {
        const tomorrow = new Date(mockNow + 24 * 60 * 60 * 1000);
        expect(formatRelativeDate(tomorrow, locale)).toBe('Tomorrow');
      });
      
      it('should format future dates correctly', () => {
        const inFiveDays = new Date(mockNow + 5 * 24 * 60 * 60 * 1000);
        expect(formatRelativeDate(inFiveDays, locale)).toBe('in 5 days');
      });
      
      it('should return "In the future" for dates far in the future', () => {
        const farFuture = new Date(mockNow + 60 * 24 * 60 * 60 * 1000); // 60 days in future
        expect(formatRelativeDate(farFuture, locale)).toBe('In the future');
      });
      
      it('should return empty string for invalid dates', () => {
        expect(formatRelativeDate('invalid-date', locale)).toBe('');
      });
    });
  });
  
  describe('getDaysDifference', () => {
    it('should calculate days difference correctly', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-10');
      
      expect(getDaysDifference(startDate, endDate)).toBe(9);
    });
    
    it('should return 0 for same day', () => {
      const date = new Date('2023-05-01');
      
      expect(getDaysDifference(date, date)).toBe(0);
    });
    
    it('should return negative value when end date is before start date', () => {
      const startDate = new Date('2023-05-10');
      const endDate = new Date('2023-05-01');
      
      expect(getDaysDifference(startDate, endDate)).toBe(-9);
    });
    
    it('should throw error for invalid dates', () => {
      expect(() => getDaysDifference('invalid-date', '2023-05-01')).toThrow('Invalid date provided');
      expect(() => getDaysDifference('2023-05-01', 'invalid-date')).toThrow('Invalid date provided');
    });
  });
  
  describe('getMonthsDifference', () => {
    it('should calculate months difference correctly', () => {
      const startDate = new Date('2023-01-15');
      const endDate = new Date('2023-05-15');
      
      expect(getMonthsDifference(startDate, endDate)).toBe(4);
    });
    
    it('should return 0 for dates in same month', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-31');
      
      expect(getMonthsDifference(startDate, endDate)).toBe(0);
    });
    
    it('should handle year boundaries correctly', () => {
      const startDate = new Date('2022-11-15');
      const endDate = new Date('2023-02-15');
      
      expect(getMonthsDifference(startDate, endDate)).toBe(3);
    });
    
    it('should return negative value when end date is before start date', () => {
      const startDate = new Date('2023-05-15');
      const endDate = new Date('2023-01-15');
      
      expect(getMonthsDifference(startDate, endDate)).toBe(-4);
    });
    
    it('should throw error for invalid dates', () => {
      expect(() => getMonthsDifference('invalid-date', '2023-05-01')).toThrow('Invalid date provided');
      expect(() => getMonthsDifference('2023-05-01', 'invalid-date')).toThrow('Invalid date provided');
    });
  });
  
  describe('getYearsDifference', () => {
    it('should calculate years difference correctly', () => {
      const startDate = new Date('2020-05-15');
      const endDate = new Date('2023-05-15');
      
      expect(getYearsDifference(startDate, endDate)).toBe(3);
    });
    
    it('should return 0 for dates in same year but different months', () => {
      const startDate = new Date('2023-01-15');
      const endDate = new Date('2023-12-15');
      
      expect(getYearsDifference(startDate, endDate)).toBe(0);
    });
    
    it('should handle leap years correctly', () => {
      const startDate = new Date('2020-02-29'); // Leap year
      const endDate = new Date('2023-02-28'); // Non-leap year
      
      expect(getYearsDifference(startDate, endDate)).toBe(2); // Not quite 3 years
    });
    
    it('should return negative value when end date is before start date', () => {
      const startDate = new Date('2023-05-15');
      const endDate = new Date('2020-05-15');
      
      expect(getYearsDifference(startDate, endDate)).toBe(-3);
    });
    
    it('should throw error for invalid dates', () => {
      expect(() => getYearsDifference('invalid-date', '2023-05-01')).toThrow('Invalid date provided');
      expect(() => getYearsDifference('2023-05-01', 'invalid-date')).toThrow('Invalid date provided');
    });
  });
});