/**
 * Integration Test Setup for @austa/utils package
 *
 * This file configures the testing environment specifically for integration tests
 * in the utils package. It sets up mocks for external services, configures timezone
 * and locale settings, and provides journey-specific validation contexts.
 */

import axios from 'axios';
import * as dateFns from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ValidationContext } from '../../src/validation/validation-context';
import { JourneyType } from '@austa/interfaces/journey';

// Set up environment variables for integration testing
process.env.NODE_ENV = 'test';
process.env.TZ = 'America/Sao_Paulo'; // Set timezone for consistent date testing

// Mock axios for external service integration
jest.mock('axios');
export const mockedAxios = axios as jest.Mocked<typeof axios>;

// Configure default axios mock responses
mockedAxios.get.mockImplementation(async (url) => {
  if (url.includes('/health-check')) {
    return { data: { status: 'ok' }, status: 200 };
  }
  
  // Default response for unhandled URLs
  return { data: {}, status: 404 };
});

// Mock date-fns functions for consistent date handling
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

// Mock date-fns locales for internationalization testing
jest.mock('date-fns/locale', () => ({
  ptBR: { code: 'pt-BR', formatDistance: jest.fn() },
  enUS: { code: 'en-US', formatDistance: jest.fn() }
}));

// Create journey-specific validation contexts for testing
export const validationContexts = {
  health: new ValidationContext({
    journeyType: JourneyType.HEALTH,
    strictMode: true,
    locale: 'pt-BR'
  }),
  care: new ValidationContext({
    journeyType: JourneyType.CARE,
    strictMode: true,
    locale: 'pt-BR'
  }),
  plan: new ValidationContext({
    journeyType: JourneyType.PLAN,
    strictMode: true,
    locale: 'pt-BR'
  }),
  // Context with English locale for internationalization testing
  english: new ValidationContext({
    journeyType: JourneyType.HEALTH,
    strictMode: true,
    locale: 'en-US'
  }),
  // Non-strict context for testing validation warnings
  nonStrict: new ValidationContext({
    journeyType: JourneyType.HEALTH,
    strictMode: false,
    locale: 'pt-BR'
  })
};

// Define custom matchers for integration testing
expect.extend({
  /**
   * Custom matcher to check if a value matches a specific validation context
   */
  toPassValidation(received: any, context: ValidationContext, schema: string) {
    const validationResult = context.validate(schema, received);
    const pass = validationResult.valid;
    
    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to pass validation with schema ${schema}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to pass validation with schema ${schema}, but got errors: ${JSON.stringify(validationResult.errors)}`,
        pass: false
      };
    }
  },
  
  /**
   * Custom matcher to check if an HTTP response has the expected structure
   */
  toHaveResponseStructure(received: any, expectedKeys: string[]) {
    const receivedKeys = Object.keys(received?.data || {});
    const missingKeys = expectedKeys.filter(key => !receivedKeys.includes(key));
    const pass = missingKeys.length === 0;
    
    if (pass) {
      return {
        message: () => `Expected response not to have structure with keys: ${expectedKeys.join(', ')}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected response to have structure with keys: ${expectedKeys.join(', ')}\nMissing keys: ${missingKeys.join(', ')}`,
        pass: false
      };
    }
  },
  
  /**
   * Custom matcher to check if a function throws a specific error type
   */
  toThrowErrorOfType(received: Function, errorType: string) {
    let error: Error | null = null;
    let pass = false;
    
    try {
      received();
    } catch (e) {
      error = e as Error;
      pass = error.constructor.name === errorType;
    }
    
    if (pass) {
      return {
        message: () => `Expected function not to throw error of type ${errorType}`,
        pass: true
      };
    } else {
      const actualType = error ? error.constructor.name : 'No error';
      return {
        message: () => `Expected function to throw error of type ${errorType}, but got ${actualType}`,
        pass: false
      };
    }
  }
});

// Set up global test data for integration tests
global.__INTEGRATION_TEST_DATA__ = {
  dates: {
    validDate: new Date('2023-01-01T12:00:00Z'),
    invalidDate: new Date('invalid-date'),
    today: new Date(),
    yesterday: new Date(new Date().setDate(new Date().getDate() - 1)),
    tomorrow: new Date(new Date().setDate(new Date().getDate() + 1)),
    nextMonth: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    lastMonth: new Date(new Date().setMonth(new Date().getMonth() - 1))
  },
  strings: {
    validCPF: '529.982.247-25',
    invalidCPF: '111.111.111-11',
    validEmail: 'test@austa.com.br',
    invalidEmail: 'not-an-email',
    validPhone: '+55 11 98765-4321',
    invalidPhone: '123',
    longText: 'This is a very long text that should be truncated in some tests'
  },
  journeys: {
    health: {
      metricTypes: ['WEIGHT', 'HEIGHT', 'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE'],
      goalTypes: ['STEPS', 'WEIGHT_LOSS', 'SLEEP', 'WATER_INTAKE']
    },
    care: {
      appointmentTypes: ['GENERAL', 'SPECIALIST', 'FOLLOW_UP', 'EMERGENCY'],
      providerTypes: ['DOCTOR', 'NURSE', 'THERAPIST', 'SPECIALIST']
    },
    plan: {
      coverageTypes: ['BASIC', 'STANDARD', 'PREMIUM', 'FAMILY'],
      claimTypes: ['MEDICAL', 'DENTAL', 'VISION', 'PHARMACY']
    }
  },
  mockResponses: {
    success: { status: 200, data: { success: true } },
    notFound: { status: 404, data: { error: 'Not found' } },
    serverError: { status: 500, data: { error: 'Internal server error' } },
    validation: { status: 400, data: { error: 'Validation error', fields: [] } }
  }
};

// Clean up before each test
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset axios mock implementations to defaults
  mockedAxios.get.mockImplementation(async (url) => {
    if (url.includes('/health-check')) {
      return { data: { status: 'ok' }, status: 200 };
    }
    return { data: {}, status: 404 };
  });
  
  mockedAxios.post.mockImplementation(async () => {
    return { data: {}, status: 200 };
  });
});

// Clean up after all tests
afterAll(() => {
  // Clean up any resources that might persist between test runs
  jest.restoreAllMocks();
});

// TypeScript declarations for custom matchers and global data
declare global {
  // Add global test data type
  var __INTEGRATION_TEST_DATA__: {
    dates: {
      validDate: Date;
      invalidDate: Date;
      today: Date;
      yesterday: Date;
      tomorrow: Date;
      nextMonth: Date;
      lastMonth: Date;
    };
    strings: {
      validCPF: string;
      invalidCPF: string;
      validEmail: string;
      invalidEmail: string;
      validPhone: string;
      invalidPhone: string;
      longText: string;
    };
    journeys: {
      health: {
        metricTypes: string[];
        goalTypes: string[];
      };
      care: {
        appointmentTypes: string[];
        providerTypes: string[];
      };
      plan: {
        coverageTypes: string[];
        claimTypes: string[];
      };
    };
    mockResponses: {
      success: { status: number; data: { success: boolean } };
      notFound: { status: number; data: { error: string } };
      serverError: { status: number; data: { error: string } };
      validation: { status: number; data: { error: string; fields: any[] } };
    };
  };

  // Extend Jest's expect
  namespace jest {
    interface Matchers<R> {
      toPassValidation(context: ValidationContext, schema: string): R;
      toHaveResponseStructure(expectedKeys: string[]): R;
      toThrowErrorOfType(errorType: string): R;
    }
  }
}