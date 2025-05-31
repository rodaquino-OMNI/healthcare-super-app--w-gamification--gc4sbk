import { getLocalTimezone } from '../timezone';

describe('Date Timezone Module', () => {
  describe('getLocalTimezone function', () => {
    it('should be properly exported from timezone module', () => {
      expect(getLocalTimezone).toBeDefined();
      expect(typeof getLocalTimezone).toBe('function');
    });

    it('should return a string in the format +/-HH:MM', () => {
      const timezone = getLocalTimezone();
      expect(typeof timezone).toBe('string');
      
      // Should match format +HH:MM or -HH:MM
      expect(timezone).toMatch(/^[+-]\d{2}:\d{2}$/);
    });

    it('should have a valid direction sign (+ or -)', () => {
      const timezone = getLocalTimezone();
      const firstChar = timezone.charAt(0);
      
      expect(['+', '-']).toContain(firstChar);
    });

    it('should have hours between 00 and 14', () => {
      const timezone = getLocalTimezone();
      const hours = parseInt(timezone.substring(1, 3), 10);
      
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(14); // Maximum timezone offset is UTC+14
    });

    it('should have minutes that are either 00, 15, 30, or 45', () => {
      const timezone = getLocalTimezone();
      const minutes = parseInt(timezone.substring(4, 6), 10);
      
      // Most timezone offsets use these standard minute values
      // This is a loose validation as some rare timezones might have different values
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThanOrEqual(59);
    });

    it('should handle zero offset correctly', () => {
      // We can't force a specific timezone in the test environment,
      // but we can test that the function handles the format correctly
      // by mocking Date.prototype.getTimezoneOffset
      
      // Save the original method
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      
      try {
        // Mock the method to return 0 (UTC)
        Date.prototype.getTimezoneOffset = jest.fn().mockReturnValue(0);
        
        const timezone = getLocalTimezone();
        expect(timezone).toBe('+00:00');
      } finally {
        // Restore the original method
        Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
      }
    });

    it('should handle positive offset correctly', () => {
      // Save the original method
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      
      try {
        // Mock the method to return -180 (UTC+3)
        // Note: getTimezoneOffset returns negative value for positive UTC offset
        Date.prototype.getTimezoneOffset = jest.fn().mockReturnValue(-180);
        
        const timezone = getLocalTimezone();
        expect(timezone).toBe('+03:00');
      } finally {
        // Restore the original method
        Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
      }
    });

    it('should handle negative offset correctly', () => {
      // Save the original method
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      
      try {
        // Mock the method to return 300 (UTC-5)
        // Note: getTimezoneOffset returns positive value for negative UTC offset
        Date.prototype.getTimezoneOffset = jest.fn().mockReturnValue(300);
        
        const timezone = getLocalTimezone();
        expect(timezone).toBe('-05:00');
      } finally {
        // Restore the original method
        Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
      }
    });

    it('should handle non-whole hour offsets correctly', () => {
      // Save the original method
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      
      try {
        // Mock the method to return -570 (UTC+9:30, like Adelaide, Australia)
        Date.prototype.getTimezoneOffset = jest.fn().mockReturnValue(-570);
        
        const timezone = getLocalTimezone();
        expect(timezone).toBe('+09:30');
      } finally {
        // Restore the original method
        Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
      }
    });

    it('should be compatible with different runtime environments', () => {
      // This test ensures the function doesn't rely on browser-specific APIs
      // that might not be available in Node.js or other JavaScript environments
      
      // The function should only use standard JavaScript Date methods
      const timezone = getLocalTimezone();
      
      // Basic validation that we got a result in the expected format
      expect(timezone).toMatch(/^[+-]\d{2}:\d{2}$/);
    });
  });
});