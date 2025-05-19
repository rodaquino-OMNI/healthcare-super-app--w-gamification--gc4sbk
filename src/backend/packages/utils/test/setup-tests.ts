/**
 * Global test setup file for the utils package
 * 
 * This file configures the testing environment for all tests in the utils package.
 * It sets up mocks for external dependencies, defines custom matchers, and ensures
 * consistent test behavior across all test suites while preventing test pollution.
 */

import axios from 'axios';
import * as dateFns from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Mock axios
jest.mock('axios');
export const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock date-fns functions
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    // Allow overriding specific functions in tests
    format: jest.fn(actual.format),
    parse: jest.fn(actual.parse),
    isValid: jest.fn(actual.isValid),
    addDays: jest.fn(actual.addDays),
    addMonths: jest.fn(actual.addMonths),
    addYears: jest.fn(actual.addYears),
    subDays: jest.fn(actual.subDays),
    subMonths: jest.fn(actual.subMonths),
    subYears: jest.fn(actual.subYears),
    differenceInDays: jest.fn(actual.differenceInDays),
    differenceInMonths: jest.fn(actual.differenceInMonths),
    differenceInYears: jest.fn(actual.differenceInYears),
    startOfDay: jest.fn(actual.startOfDay),
    endOfDay: jest.fn(actual.endOfDay),
    startOfWeek: jest.fn(actual.startOfWeek),
    endOfWeek: jest.fn(actual.endOfWeek),
    startOfMonth: jest.fn(actual.startOfMonth),
    endOfMonth: jest.fn(actual.endOfMonth),
    startOfYear: jest.fn(actual.startOfYear),
    endOfYear: jest.fn(actual.endOfYear),
    isSameDay: jest.fn(actual.isSameDay),
    isBefore: jest.fn(actual.isBefore),
    isAfter: jest.fn(actual.isAfter)
  };
});

// Mock date-fns locales
jest.mock('date-fns/locale', () => ({
  ptBR: {},
  enUS: {}
}));

// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// Define custom matchers for string utilities
expect.extend({
  /**
   * Custom matcher to check if a string is capitalized
   */
  toBeCapitalized(received: string) {
    const pass = received.charAt(0) === received.charAt(0).toUpperCase() && 
                 received.slice(1) === received.slice(1).toLowerCase();
    
    if (pass) {
      return {
        message: () => `Expected "${received}" not to be capitalized`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected "${received}" to be capitalized`,
        pass: false
      };
    }
  },

  /**
   * Custom matcher to check if a string is a valid CPF
   */
  toBeValidCPF(received: string) {
    // Remove non-digit characters
    const cleanCPF = received.replace(/\D/g, '');
    
    // CPF must have 11 digits
    if (cleanCPF.length !== 11) {
      return {
        message: () => `Expected "${received}" to be a valid CPF, but it doesn't have 11 digits`,
        pass: false
      };
    }
    
    // Check if all digits are the same (invalid CPF)
    if (/^(\d)\1+$/.test(cleanCPF)) {
      return {
        message: () => `Expected "${received}" to be a valid CPF, but all digits are the same`,
        pass: false
      };
    }
    
    // Calculate first verification digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const digit1 = remainder > 9 ? 0 : remainder;
    
    // Calculate second verification digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    const digit2 = remainder > 9 ? 0 : remainder;
    
    // Verify if calculated digits match the CPF's verification digits
    const pass = (
      parseInt(cleanCPF.charAt(9)) === digit1 &&
      parseInt(cleanCPF.charAt(10)) === digit2
    );
    
    if (pass) {
      return {
        message: () => `Expected "${received}" not to be a valid CPF`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected "${received}" to be a valid CPF`,
        pass: false
      };
    }
  },

  /**
   * Custom matcher to check if a string is truncated to a specific length
   */
  toBeTruncated(received: string, length: number) {
    const pass = received.length <= length || 
                (received.length === length + 3 && received.endsWith('...'));
    
    if (pass) {
      return {
        message: () => `Expected "${received}" not to be truncated to ${length} characters`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected "${received}" to be truncated to ${length} characters`,
        pass: false
      };
    }
  }
});

// Define custom matchers for date utilities
expect.extend({
  /**
   * Custom matcher to check if a value is a valid date
   */
  toBeValidDate(received: any) {
    const pass = received !== null && 
                received !== undefined && 
                !isNaN(new Date(received).getTime());
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid date`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid date`,
        pass: false
      };
    }
  },

  /**
   * Custom matcher to check if a date is formatted according to a specific format
   */
  toBeFormattedAs(received: string, format: string) {
    // This is a simplified check - in a real implementation, you would use date-fns
    // to parse the string and check if it matches the format
    const formatRegexMap: Record<string, RegExp> = {
      'dd/MM/yyyy': /^\d{2}\/\d{2}\/\d{4}$/,
      'HH:mm': /^\d{2}:\d{2}$/,
      'dd/MM/yyyy HH:mm': /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/
    };
    
    const regex = formatRegexMap[format] || new RegExp(format);
    const pass = regex.test(received);
    
    if (pass) {
      return {
        message: () => `Expected "${received}" not to be formatted as "${format}"`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected "${received}" to be formatted as "${format}"`,
        pass: false
      };
    }
  },

  /**
   * Custom matcher to check if a date is within a specific range
   */
  toBeWithinDateRange(received: Date, startDate: Date, endDate: Date) {
    const receivedTime = received.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    const pass = receivedTime >= startTime && receivedTime <= endTime;
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be within range ${startDate} to ${endDate}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${received} to be within range ${startDate} to ${endDate}`,
        pass: false
      };
    }
  }
});

// Set up global test data
global.__TEST_DATA__ = {
  dates: {
    validDate: new Date('2023-01-01'),
    invalidDate: new Date('invalid-date'),
    today: new Date(),
    yesterday: new Date(new Date().setDate(new Date().getDate() - 1)),
    tomorrow: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  strings: {
    validCPF: '529.982.247-25',
    invalidCPF: '111.111.111-11',
    longText: 'This is a very long text that should be truncated in some tests'
  }
};

// Clean up after each test
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Clean up any resources that might persist between test runs
  jest.restoreAllMocks();
});

// TypeScript declarations for custom matchers
declare global {
  // Add global test data type
  var __TEST_DATA__: {
    dates: {
      validDate: Date;
      invalidDate: Date;
      today: Date;
      yesterday: Date;
      tomorrow: Date;
    };
    strings: {
      validCPF: string;
      invalidCPF: string;
      longText: string;
    };
  };

  // Extend Jest's expect
  namespace jest {
    interface Matchers<R> {
      // String matchers
      toBeCapitalized(): R;
      toBeValidCPF(): R;
      toBeTruncated(length: number): R;
      
      // Date matchers
      toBeValidDate(): R;
      toBeFormattedAs(format: string): R;
      toBeWithinDateRange(startDate: Date, endDate: Date): R;
    }
  }
}