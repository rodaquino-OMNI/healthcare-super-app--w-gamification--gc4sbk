import { describe, it, expect } from 'jest';

/**
 * This test suite verifies that all date utility functions are properly exported
 * from the main entry point (index.ts) of the date utility package.
 * 
 * It ensures that consumers can reliably import all date functions from a single location,
 * which is critical for maintaining consistent date handling across all services.
 */
describe('Date Utils - Main Entry Point', () => {
  /**
   * Test that all date utility functions are properly exported
   */
  it('should export all date utility functions', () => {
    // Import all exports from the date utility package
    const dateUtils = require('../../../src/date');
    
    // Validation functions
    expect(typeof dateUtils.isValidDate).toBe('function');
    
    // Formatting functions
    expect(typeof dateUtils.formatDate).toBe('function');
    expect(typeof dateUtils.formatTime).toBe('function');
    expect(typeof dateUtils.formatDateTime).toBe('function');
    expect(typeof dateUtils.formatDateRange).toBe('function');
    expect(typeof dateUtils.formatRelativeDate).toBe('function');
    
    // Parsing functions
    expect(typeof dateUtils.parseDate).toBe('function');
    
    // Comparison functions
    expect(typeof dateUtils.isSameDay).toBe('function');
    expect(typeof dateUtils.isDateInRange).toBe('function');
    
    // Calculation functions
    expect(typeof dateUtils.calculateAge).toBe('function');
    expect(typeof dateUtils.getTimeAgo).toBe('function');
    
    // Range functions
    expect(typeof dateUtils.getDateRange).toBe('function');
    expect(typeof dateUtils.getDatesBetween).toBe('function');
    
    // Timezone functions
    expect(typeof dateUtils.getLocalTimezone).toBe('function');
    
    // Journey-specific functions
    expect(typeof dateUtils.formatJourneyDate).toBe('function');
    
    // Constants
    expect(dateUtils.DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    expect(dateUtils.DEFAULT_TIME_FORMAT).toBe('HH:mm');
    expect(dateUtils.DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
    expect(dateUtils.DEFAULT_LOCALE).toBe('pt-BR');
  });

  /**
   * Test that named imports work correctly
   */
  it('should support named imports', () => {
    // Import specific functions using named imports
    const {
      isValidDate,
      formatDate,
      formatTime,
      formatDateTime,
      parseDate,
      isSameDay,
      calculateAge,
      getDateRange,
      getDatesBetween,
      getLocalTimezone,
      formatJourneyDate,
      DEFAULT_DATE_FORMAT,
      DEFAULT_TIME_FORMAT,
      DEFAULT_DATETIME_FORMAT,
      DEFAULT_LOCALE
    } = require('../../../src/date');
    
    // Verify that each imported function exists and is of the correct type
    expect(typeof isValidDate).toBe('function');
    expect(typeof formatDate).toBe('function');
    expect(typeof formatTime).toBe('function');
    expect(typeof formatDateTime).toBe('function');
    expect(typeof parseDate).toBe('function');
    expect(typeof isSameDay).toBe('function');
    expect(typeof calculateAge).toBe('function');
    expect(typeof getDateRange).toBe('function');
    expect(typeof getDatesBetween).toBe('function');
    expect(typeof getLocalTimezone).toBe('function');
    expect(typeof formatJourneyDate).toBe('function');
    
    // Verify constants
    expect(DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    expect(DEFAULT_TIME_FORMAT).toBe('HH:mm');
    expect(DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
    expect(DEFAULT_LOCALE).toBe('pt-BR');
  });

  /**
   * Test that ES module imports work correctly
   */
  it('should support ES module imports', () => {
    // This test simulates ES module imports by using require with destructuring
    // In actual code, this would be: import { formatDate, parseDate } from '@austa/utils/date';
    const { formatDate, parseDate } = require('../../../src/date');
    
    // Verify that the imported functions exist and are of the correct type
    expect(typeof formatDate).toBe('function');
    expect(typeof parseDate).toBe('function');
  });

  /**
   * Test backward compatibility with legacy import patterns
   */
  it('should maintain backward compatibility with legacy imports', () => {
    // In the old structure, date utils were imported from a monolithic file
    // This test ensures that the new modular structure maintains compatibility
    const dateUtils = require('../../../src/date');
    
    // Legacy functions that must still be available
    expect(typeof dateUtils.isValidDate).toBe('function');
    expect(typeof dateUtils.formatDate).toBe('function');
    expect(typeof dateUtils.formatTime).toBe('function');
    expect(typeof dateUtils.formatDateTime).toBe('function');
    expect(typeof dateUtils.parseDate).toBe('function');
    expect(typeof dateUtils.calculateAge).toBe('function');
    expect(typeof dateUtils.getDateRange).toBe('function');
    
    // Legacy constants that must still be available
    expect(dateUtils.DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    expect(dateUtils.DEFAULT_TIME_FORMAT).toBe('HH:mm');
    expect(dateUtils.DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
    expect(dateUtils.DEFAULT_LOCALE).toBe('pt-BR');
  });

  /**
   * Test that all functions from specialized modules are properly re-exported
   */
  it('should re-export all functions from specialized modules', () => {
    // This test verifies that all functions from specialized modules are properly re-exported
    const dateUtils = require('../../../src/date');
    
    // Functions from validation.ts
    expect(typeof dateUtils.isValidDate).toBe('function');
    
    // Functions from format.ts
    expect(typeof dateUtils.formatDate).toBe('function');
    expect(typeof dateUtils.formatTime).toBe('function');
    expect(typeof dateUtils.formatDateTime).toBe('function');
    expect(typeof dateUtils.formatDateRange).toBe('function');
    expect(typeof dateUtils.formatRelativeDate).toBe('function');
    
    // Functions from parse.ts
    expect(typeof dateUtils.parseDate).toBe('function');
    
    // Functions from comparison.ts
    expect(typeof dateUtils.isSameDay).toBe('function');
    expect(typeof dateUtils.isDateInRange).toBe('function');
    
    // Functions from calculation.ts
    expect(typeof dateUtils.calculateAge).toBe('function');
    expect(typeof dateUtils.getTimeAgo).toBe('function');
    
    // Functions from range.ts
    expect(typeof dateUtils.getDateRange).toBe('function');
    expect(typeof dateUtils.getDatesBetween).toBe('function');
    
    // Functions from timezone.ts
    expect(typeof dateUtils.getLocalTimezone).toBe('function');
    
    // Functions from journey.ts
    expect(typeof dateUtils.formatJourneyDate).toBe('function');
    
    // Constants from constants.ts
    expect(dateUtils.DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    expect(dateUtils.DEFAULT_TIME_FORMAT).toBe('HH:mm');
    expect(dateUtils.DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
    expect(dateUtils.DEFAULT_LOCALE).toBe('pt-BR');
  });

  /**
   * Test that TypeScript types are properly exported (this is a compile-time check)
   */
  it('should export proper TypeScript types', () => {
    // This test is primarily a compile-time check
    // If the types are not properly exported, TypeScript would show errors during compilation
    // We can only do a runtime check to ensure the functions exist
    const dateUtils = require('../../../src/date');
    
    // Verify that all functions exist
    expect(Object.keys(dateUtils).length).toBeGreaterThan(0);
    
    // Check a few key functions to ensure they're properly exported
    expect(typeof dateUtils.formatDate).toBe('function');
    expect(typeof dateUtils.parseDate).toBe('function');
    expect(typeof dateUtils.isValidDate).toBe('function');
  });
});