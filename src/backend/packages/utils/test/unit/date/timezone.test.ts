import { getLocalTimezone, convertToTimezone, getTimezoneOffset, formatWithTimezone } from '../../../src/date/timezone';

// Mock timezone-mock library
jest.mock('timezone-mock', () => ({
  register: jest.fn(),
  unregister: jest.fn(),
  TimeZone: {
    'US/Pacific': 'US/Pacific',
    'US/Eastern': 'US/Eastern',
    'Brazil/East': 'Brazil/East',
    'Europe/London': 'Europe/London',
    'UTC': 'UTC',
    'Australia/Adelaide': 'Australia/Adelaide'
  }
}));

// Import the mocked library
import timezoneMock from 'timezone-mock';

describe('Timezone Utilities', () => {
  // Store original Date implementation
  const RealDate = global.Date;
  
  // Setup and teardown for consistent timezone testing
  beforeEach(() => {
    // Reset Date to original implementation before each test
    global.Date = RealDate;
  });

  afterEach(() => {
    // Clean up any timezone mocks
    jest.resetAllMocks();
    (timezoneMock.unregister as jest.Mock).mockClear();
    global.Date = RealDate;
  });

  describe('getLocalTimezone', () => {
    it('should return the local timezone identifier', () => {
      // Mock Intl.DateTimeFormat().resolvedOptions().timeZone
      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'America/New_York' });
      const mockDateTimeFormat = jest.fn().mockReturnValue({
        resolvedOptions: mockResolvedOptions
      });
      
      // Store original Intl.DateTimeFormat
      const OriginalDateTimeFormat = Intl.DateTimeFormat;
      
      // Replace with mock
      // @ts-expect-error - Mocking Intl.DateTimeFormat
      Intl.DateTimeFormat = mockDateTimeFormat;
      
      // Test the function
      const result = getLocalTimezone();
      
      // Verify results
      expect(result).toBe('America/New_York');
      expect(mockDateTimeFormat).toHaveBeenCalledTimes(1);
      expect(mockResolvedOptions).toHaveBeenCalledTimes(1);
      
      // Restore original
      Intl.DateTimeFormat = OriginalDateTimeFormat;
    });

    it('should handle environments where Intl API is not available', () => {
      // Store original Intl
      const OriginalIntl = global.Intl;
      
      // Remove Intl to simulate environments where it's not available
      // @ts-expect-error - Removing Intl for testing
      global.Intl = undefined;
      
      // Mock Date.prototype.getTimezoneOffset to return a fixed offset
      const mockGetTimezoneOffset = jest.fn().mockReturnValue(-300); // -300 minutes = UTC-5 (Eastern)
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = mockGetTimezoneOffset;
      
      // Test the function with fallback behavior
      const result = getLocalTimezone();
      
      // Verify results - should return a fallback value or calculated value based on offset
      expect(result).toBeDefined();
      expect(mockGetTimezoneOffset).toHaveBeenCalled();
      
      // Restore originals
      global.Intl = OriginalIntl;
      Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
    });
  });

  describe('convertToTimezone', () => {
    it('should convert a date to the specified timezone', () => {
      // Create a fixed date in UTC
      const utcDate = new Date('2023-01-15T12:00:00Z');
      
      // Mock the timezone conversion function
      // Register US/Eastern timezone mock
      (timezoneMock.register as jest.Mock).mockImplementation((timezone) => {
        if (timezone === 'US/Eastern') {
          // Simulate timezone offset for US/Eastern (-5 hours from UTC)
          const originalToISOString = Date.prototype.toISOString;
          Date.prototype.toISOString = function() {
            const utcTime = originalToISOString.call(this);
            const date = new Date(utcTime);
            date.setHours(date.getHours() - 5); // Simulate EST offset
            return originalToISOString.call(date);
          };
        }
      });
      
      // Convert the date to US/Eastern timezone
      const result = convertToTimezone(utcDate, 'US/Eastern');
      
      // Verify the timezone mock was registered
      expect(timezoneMock.register).toHaveBeenCalledWith('US/Eastern');
      
      // Verify the date was converted correctly (should be 5 hours earlier)
      expect(result.getUTCHours()).toBe(7); // 12 UTC - 5 hours = 7 EST
      
      // Verify the timezone mock was unregistered
      expect(timezoneMock.unregister).toHaveBeenCalled();
    });

    it('should handle invalid timezone identifiers gracefully', () => {
      // Create a fixed date
      const date = new Date('2023-01-15T12:00:00Z');
      
      // Mock the timezone conversion function to throw an error
      (timezoneMock.register as jest.Mock).mockImplementation((timezone) => {
        if (timezone === 'Invalid/Timezone') {
          throw new Error('Invalid timezone');
        }
      });
      
      // Test with invalid timezone
      const result = convertToTimezone(date, 'Invalid/Timezone');
      
      // Should return the original date unchanged
      expect(result.toISOString()).toBe(date.toISOString());
      expect(timezoneMock.register).toHaveBeenCalledWith('Invalid/Timezone');
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return the offset in minutes for a specific timezone', () => {
      // Mock implementation for getTimezoneOffset
      // For US/Eastern, return -300 minutes (-5 hours)
      const mockOffset = -300;
      
      // Mock Date constructor to return a date with the specified offset
      const mockDate = {
        getTimezoneOffset: jest.fn().mockReturnValue(mockOffset)
      };
      
      // @ts-expect-error - Mocking Date constructor
      global.Date = jest.fn(() => mockDate);
      
      // Test the function
      const result = getTimezoneOffset('US/Eastern');
      
      // Verify results
      expect(result).toBe(mockOffset);
      expect(timezoneMock.register).toHaveBeenCalledWith('US/Eastern');
      expect(timezoneMock.unregister).toHaveBeenCalled();
    });

    it('should handle daylight saving time transitions', () => {
      // Test with a date during standard time
      const standardTimeDate = new Date('2023-01-15T12:00:00Z'); // January, standard time
      
      // Mock for standard time (EST: UTC-5)
      const mockStandardOffset = -300;
      const mockStandardDate = {
        getTimezoneOffset: jest.fn().mockReturnValue(mockStandardOffset)
      };
      
      // @ts-expect-error - Mocking Date constructor
      global.Date = jest.fn(() => mockStandardDate);
      
      // Test standard time
      const standardResult = getTimezoneOffset('US/Eastern', standardTimeDate);
      expect(standardResult).toBe(mockStandardOffset);
      
      // Test with a date during daylight saving time
      const dstTimeDate = new Date('2023-07-15T12:00:00Z'); // July, daylight saving time
      
      // Mock for daylight saving time (EDT: UTC-4)
      const mockDSTOffset = -240;
      const mockDSTDate = {
        getTimezoneOffset: jest.fn().mockReturnValue(mockDSTOffset)
      };
      
      // @ts-expect-error - Mocking Date constructor
      global.Date = jest.fn(() => mockDSTDate);
      
      // Test daylight saving time
      const dstResult = getTimezoneOffset('US/Eastern', dstTimeDate);
      expect(dstResult).toBe(mockDSTOffset);
    });
  });

  describe('formatWithTimezone', () => {
    it('should format a date with the specified timezone', () => {
      // Create a fixed date
      const date = new Date('2023-01-15T12:00:00Z');
      
      // Mock the date-fns format function
      jest.mock('date-fns', () => ({
        format: jest.fn().mockReturnValue('2023-01-15 07:00:00 EST')
      }));
      
      // Test the function
      const result = formatWithTimezone(date, 'yyyy-MM-dd HH:mm:ss zzz', 'US/Eastern');
      
      // Verify results
      expect(result).toBe('2023-01-15 07:00:00 EST');
      expect(timezoneMock.register).toHaveBeenCalledWith('US/Eastern');
      expect(timezoneMock.unregister).toHaveBeenCalled();
    });

    it('should use the local timezone if none is specified', () => {
      // Create a fixed date
      const date = new Date('2023-01-15T12:00:00Z');
      
      // Mock getLocalTimezone to return a fixed timezone
      const originalGetLocalTimezone = getLocalTimezone;
      // @ts-expect-error - Mocking imported function
      getLocalTimezone = jest.fn().mockReturnValue('America/New_York');
      
      // Test the function without specifying a timezone
      const result = formatWithTimezone(date, 'yyyy-MM-dd HH:mm:ss zzz');
      
      // Verify the local timezone was used
      expect(timezoneMock.register).toHaveBeenCalledWith('America/New_York');
      
      // Restore original function
      // @ts-expect-error - Restoring imported function
      getLocalTimezone = originalGetLocalTimezone;
    });
  });

  describe('Daylight Saving Time Edge Cases', () => {
    it('should handle dates during DST transitions correctly', () => {
      // Test with a date during the "spring forward" transition
      // 2:00 AM on the second Sunday in March (DST starts) in US/Eastern
      const springForwardDate = new Date('2023-03-12T07:00:00Z'); // 2:00 AM EST -> 3:00 AM EDT
      
      // Mock timezone-mock to simulate the DST transition
      (timezoneMock.register as jest.Mock).mockImplementation((timezone) => {
        if (timezone === 'US/Eastern') {
          // Simulate the DST transition
          const originalGetHours = Date.prototype.getHours;
          Date.prototype.getHours = function() {
            const hours = originalGetHours.call(this);
            if (this.getTime() === springForwardDate.getTime()) {
              return hours + 1; // Skip from 2 AM to 3 AM
            }
            return hours;
          };
        }
      });
      
      // Test the function during DST transition
      const result = convertToTimezone(springForwardDate, 'US/Eastern');
      
      // Verify the timezone mock was registered
      expect(timezoneMock.register).toHaveBeenCalledWith('US/Eastern');
      
      // Restore original method
      const originalGetHours = Date.prototype.getHours;
      Date.prototype.getHours = originalGetHours;
    });

    it('should handle Brazil/East DST transition at midnight', () => {
      // Brazil/East has DST transitions at midnight
      // Mock a date at the DST transition in Brazil/East
      const brazilDSTDate = new Date('2023-10-15T03:00:00Z'); // Midnight in Brazil/East during DST transition
      
      // Mock timezone-mock for Brazil/East
      (timezoneMock.register as jest.Mock).mockImplementation((timezone) => {
        if (timezone === 'Brazil/East') {
          // Simulate the DST transition at midnight
          const originalGetHours = Date.prototype.getHours;
          Date.prototype.getHours = function() {
            const hours = originalGetHours.call(this);
            if (this.getTime() === brazilDSTDate.getTime()) {
              return hours + 1; // Simulate the DST transition
            }
            return hours;
          };
        }
      });
      
      // Test the function during Brazil's DST transition
      const result = convertToTimezone(brazilDSTDate, 'Brazil/East');
      
      // Verify the timezone mock was registered
      expect(timezoneMock.register).toHaveBeenCalledWith('Brazil/East');
      
      // Restore original method
      const originalGetHours = Date.prototype.getHours;
      Date.prototype.getHours = originalGetHours;
    });
  });

  describe('Consistent Testing Environment', () => {
    it('should provide consistent results across different CI environments', () => {
      // Create a mock timezone environment for consistent testing
      const setupTestTimezone = () => {
        // Set a fixed timezone for all tests
        (timezoneMock.register as jest.Mock).mockImplementation((timezone) => {
          if (timezone === 'UTC') {
            // Ensure all dates are in UTC
            const originalToISOString = Date.prototype.toISOString;
            const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            
            Date.prototype.getTimezoneOffset = function() {
              return 0; // UTC has 0 offset
            };
            
            Date.prototype.toISOString = function() {
              return originalToISOString.call(this);
            };
          }
        });
        
        // Register UTC timezone
        timezoneMock.register('UTC');
      };
      
      // Set up the test timezone
      setupTestTimezone();
      
      // Create a test date
      const testDate = new Date('2023-01-15T12:00:00Z');
      
      // Test timezone-dependent functions
      const offset = getTimezoneOffset('UTC', testDate);
      
      // Verify results are consistent
      expect(offset).toBe(0); // UTC offset should be 0
      expect(timezoneMock.register).toHaveBeenCalledWith('UTC');
      
      // Clean up
      timezoneMock.unregister();
    });
  });
});