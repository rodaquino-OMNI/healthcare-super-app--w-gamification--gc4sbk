/**
 * Global test setup file for the @austa/utils package
 * 
 * This file configures the testing environment for all utility tests, including:
 * - Mocking external dependencies (axios, date-fns)
 * - Setting up test environment variables
 * - Defining custom Jest matchers for utility-specific assertions
 * - Initializing test data and ensuring consistent test behavior
 * - Preventing test pollution by cleaning up resources between tests
 */

import axios from 'axios';
import * as dateFns from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Fixed test date to ensure consistent date-based tests
const TEST_DATE = new Date('2025-05-23T12:00:00Z');

// Mock date-fns functions that depend on the current date
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  
  return {
    ...actual,
    // Return a fixed date for functions that use the current date when no date is provided
    startOfDay: jest.fn((date = TEST_DATE) => actual.startOfDay(date)),
    endOfDay: jest.fn((date = TEST_DATE) => actual.endOfDay(date)),
    startOfWeek: jest.fn((date = TEST_DATE, options) => actual.startOfWeek(date, options)),
    endOfWeek: jest.fn((date = TEST_DATE, options) => actual.endOfWeek(date, options)),
    startOfMonth: jest.fn((date = TEST_DATE) => actual.startOfMonth(date)),
    endOfMonth: jest.fn((date = TEST_DATE) => actual.endOfMonth(date)),
    startOfYear: jest.fn((date = TEST_DATE) => actual.startOfYear(date)),
    endOfYear: jest.fn((date = TEST_DATE) => actual.endOfYear(date)),
    // Mock the current date for relative time calculations
    differenceInDays: jest.fn((dateLeft, dateRight) => {
      if (dateLeft === undefined) {
        return actual.differenceInDays(TEST_DATE, dateRight);
      }
      return actual.differenceInDays(dateLeft, dateRight);
    }),
    differenceInMonths: jest.fn((dateLeft, dateRight) => {
      if (dateLeft === undefined) {
        return actual.differenceInMonths(TEST_DATE, dateRight);
      }
      return actual.differenceInMonths(dateLeft, dateRight);
    }),
    differenceInYears: jest.fn((dateLeft, dateRight) => {
      if (dateLeft === undefined) {
        return actual.differenceInYears(TEST_DATE, dateRight);
      }
      return actual.differenceInYears(dateLeft, dateRight);
    }),
  };
});

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  // Journey-specific environment variables
  HEALTH_JOURNEY_API_URL: 'https://health-api.test.austa.local',
  CARE_JOURNEY_API_URL: 'https://care-api.test.austa.local',
  PLAN_JOURNEY_API_URL: 'https://plan-api.test.austa.local',
  // Authentication variables
  AUTH_SECRET: 'test-auth-secret',
  AUTH_TOKEN_EXPIRY: '1h',
  // Database connection variables
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  // Feature flags
  FEATURE_GAMIFICATION: 'true',
  FEATURE_NOTIFICATIONS: 'true',
  // Logging
  LOG_LEVEL: 'error',
};

// Global test data
global.__TEST_DATA__ = {
  // Test users for different journeys
  users: {
    health: { id: 'health-user-1', name: 'Health User', email: 'health@example.com' },
    care: { id: 'care-user-1', name: 'Care User', email: 'care@example.com' },
    plan: { id: 'plan-user-1', name: 'Plan User', email: 'plan@example.com' },
  },
  // Test dates for consistent date testing
  dates: {
    today: TEST_DATE,
    yesterday: dateFns.subDays(TEST_DATE, 1),
    tomorrow: dateFns.addDays(TEST_DATE, 1),
    lastWeek: dateFns.subDays(TEST_DATE, 7),
    nextWeek: dateFns.addDays(TEST_DATE, 7),
    lastMonth: dateFns.subMonths(TEST_DATE, 1),
    nextMonth: dateFns.addMonths(TEST_DATE, 1),
  },
  // Common test values
  values: {
    validCPF: '52998224725', // Valid CPF for testing
    invalidCPF: '11111111111', // Invalid CPF (all same digits)
    validEmail: 'test@austa.com.br',
    invalidEmail: 'not-an-email',
    validURL: 'https://austa.com.br',
    invalidURL: 'not-a-url',
  },
};

// Add custom matchers for utility-specific assertions
expect.extend({
  // String utility matchers
  toBeCapitalized(received: string) {
    const firstChar = received.charAt(0);
    const pass = firstChar === firstChar.toUpperCase() && received.slice(1) === received.slice(1).toLowerCase();
    return {
      pass,
      message: () => pass
        ? `Expected "${received}" not to be properly capitalized`
        : `Expected "${received}" to be properly capitalized`,
    };
  },
  
  // Date utility matchers
  toBeValidDate(received: any) {
    const isValid = received instanceof Date && !isNaN(received.getTime());
    return {
      pass: isValid,
      message: () => isValid
        ? `Expected ${received} not to be a valid Date`
        : `Expected ${received} to be a valid Date`,
    };
  },
  
  toBeWithinDateRange(received: Date, range: { start: Date; end: Date }) {
    const timestamp = received.getTime();
    const pass = timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be within range ${range.start} - ${range.end}`
        : `Expected ${received} to be within range ${range.start} - ${range.end}`,
    };
  },
  
  // Object utility matchers
  toHaveExactProperties(received: object, properties: string[]) {
    const receivedKeys = Object.keys(received).sort();
    const expectedKeys = [...properties].sort();
    const pass = JSON.stringify(receivedKeys) === JSON.stringify(expectedKeys);
    return {
      pass,
      message: () => pass
        ? `Expected object not to have exactly these properties: ${expectedKeys.join(', ')}`
        : `Expected object to have exactly these properties: ${expectedKeys.join(', ')}\nReceived: ${receivedKeys.join(', ')}`,
    };
  },
  
  // Array utility matchers
  toBeArrayOfType(received: any[], type: string) {
    const pass = Array.isArray(received) && received.every(item => typeof item === type);
    return {
      pass,
      message: () => pass
        ? `Expected array not to contain only items of type "${type}"`
        : `Expected array to contain only items of type "${type}"`,
    };
  },
  
  // Validation utility matchers
  toBeValidCPF(received: string) {
    // CPF validation algorithm
    const cleanCPF = received.replace(/\D/g, '');
    
    // CPF must have 11 digits
    if (cleanCPF.length !== 11) {
      return {
        pass: false,
        message: () => `Expected "${received}" to be a valid CPF, but it doesn't have 11 digits`,
      };
    }
    
    // Check if all digits are the same (invalid CPF)
    if (/^(\d)\1+$/.test(cleanCPF)) {
      return {
        pass: false,
        message: () => `Expected "${received}" to be a valid CPF, but it has all digits the same`,
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
    
    return {
      pass,
      message: () => pass
        ? `Expected "${received}" not to be a valid CPF`
        : `Expected "${received}" to be a valid CPF`,
    };
  },
});

// Extend TypeScript interfaces for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      // String utility matchers
      toBeCapitalized(): R;
      
      // Date utility matchers
      toBeValidDate(): R;
      toBeWithinDateRange(range: { start: Date; end: Date }): R;
      
      // Object utility matchers
      toHaveExactProperties(properties: string[]): R;
      
      // Array utility matchers
      toBeArrayOfType(type: string): R;
      
      // Validation utility matchers
      toBeValidCPF(): R;
    }
  }
  
  // Global test data interface
  interface Global {
    __TEST_DATA__: {
      users: {
        health: { id: string; name: string; email: string };
        care: { id: string; name: string; email: string };
        plan: { id: string; name: string; email: string };
      };
      dates: {
        today: Date;
        yesterday: Date;
        tomorrow: Date;
        lastWeek: Date;
        nextWeek: Date;
        lastMonth: Date;
        nextMonth: Date;
      };
      values: {
        validCPF: string;
        invalidCPF: string;
        validEmail: string;
        invalidEmail: string;
        validURL: string;
        invalidURL: string;
      };
    };
  }
}

// Reset mocks between tests to prevent test pollution
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset axios mock
  mockedAxios.get.mockReset();
  mockedAxios.post.mockReset();
  mockedAxios.put.mockReset();
  mockedAxios.delete.mockReset();
  mockedAxios.patch.mockReset();
  
  // Default axios mock implementation
  mockedAxios.get.mockResolvedValue({ data: {} });
  mockedAxios.post.mockResolvedValue({ data: {} });
  mockedAxios.put.mockResolvedValue({ data: {} });
  mockedAxios.delete.mockResolvedValue({ data: {} });
  mockedAxios.patch.mockResolvedValue({ data: {} });
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});