/**
 * Integration Test Helpers
 * 
 * This file provides utilities specifically designed for integration testing of the utils package.
 * These helpers facilitate setting up test scenarios, creating test data, mocking external dependencies,
 * and validating results across different integration test suites.
 */

import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios';
import { format, parse } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { z } from 'zod';

// Import fixtures
import { httpFixtures } from '../fixtures/http';
import { validationFixtures } from '../fixtures/validation';

// Types for test helpers
export interface TestScenario<T = any> {
  name: string;
  description: string;
  input: T;
  expected: any;
  context?: Record<string, any>;
}

export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

export interface JourneyContext {
  journeyType: JourneyType;
  userId: string;
  locale: string;
  timestamp: Date;
}

/**
 * Creates a standard journey context for testing journey-specific utilities
 */
export function createJourneyContext(journeyType: JourneyType, overrides: Partial<JourneyContext> = {}): JourneyContext {
  return {
    journeyType,
    userId: 'test-user-id',
    locale: 'pt-BR',
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * Creates a collection of test scenarios for a specific utility function
 */
export function createTestScenarios<T = any>(scenarios: TestScenario<T>[]): TestScenario<T>[] {
  return scenarios.map((scenario) => ({
    name: scenario.name,
    description: scenario.description || scenario.name,
    input: scenario.input,
    expected: scenario.expected,
    context: scenario.context || {},
  }));
}

/**
 * HTTP Response Mock Factory
 * Creates mock HTTP responses for testing HTTP utilities
 */
export const mockHttpResponse = {
  success: <T = any>(data: T, status = 200, headers = {}): AxiosResponse<T> => ({
    data,
    status,
    statusText: 'OK',
    headers,
    config: {} as AxiosRequestConfig,
  }),

  error: <T = any>(status = 500, data: T = {} as T, headers = {}): AxiosResponse<T> => ({
    data,
    status,
    statusText: status === 404 ? 'Not Found' : 'Error',
    headers,
    config: {} as AxiosRequestConfig,
  }),

  networkError: (message = 'Network Error'): AxiosError => {
    const error = new Error(message) as AxiosError;
    error.isAxiosError = true;
    error.config = {} as AxiosRequestConfig;
    error.code = 'ECONNABORTED';
    return error;
  },

  timeout: (timeout = 30000): AxiosError => {
    const error = new Error(`timeout of ${timeout}ms exceeded`) as AxiosError;
    error.isAxiosError = true;
    error.config = { timeout } as AxiosRequestConfig;
    error.code = 'ETIMEDOUT';
    return error;
  },
};

/**
 * HTTP Request Mock Factory
 * Creates mock HTTP requests for testing HTTP utilities
 */
export const mockHttpRequest = {
  get: (url: string, config: Partial<AxiosRequestConfig> = {}): AxiosRequestConfig => ({
    method: 'GET',
    url,
    headers: { 'Content-Type': 'application/json', ...config.headers },
    ...config,
  }),

  post: <T = any>(url: string, data: T, config: Partial<AxiosRequestConfig> = {}): AxiosRequestConfig => ({
    method: 'POST',
    url,
    data,
    headers: { 'Content-Type': 'application/json', ...config.headers },
    ...config,
  }),

  put: <T = any>(url: string, data: T, config: Partial<AxiosRequestConfig> = {}): AxiosRequestConfig => ({
    method: 'PUT',
    url,
    data,
    headers: { 'Content-Type': 'application/json', ...config.headers },
    ...config,
  }),

  delete: (url: string, config: Partial<AxiosRequestConfig> = {}): AxiosRequestConfig => ({
    method: 'DELETE',
    url,
    headers: { 'Content-Type': 'application/json', ...config.headers },
    ...config,
  }),
};

/**
 * Creates a mock axios instance for testing HTTP utilities
 */
export function createMockAxiosInstance() {
  const mockInstance = axios.create();
  
  // Mock implementations
  mockInstance.get = jest.fn().mockResolvedValue(mockHttpResponse.success({}));
  mockInstance.post = jest.fn().mockResolvedValue(mockHttpResponse.success({}));
  mockInstance.put = jest.fn().mockResolvedValue(mockHttpResponse.success({}));
  mockInstance.delete = jest.fn().mockResolvedValue(mockHttpResponse.success({}));
  mockInstance.request = jest.fn().mockResolvedValue(mockHttpResponse.success({}));
  
  return mockInstance;
}

/**
 * Test Data Generators
 * Creates realistic test data for integration testing
 */
export const testDataGenerators = {
  // Date-related test data
  dates: {
    /**
     * Generates a series of dates within a range
     */
    generateDateSeries: (startDate: Date, days: number, interval = 1): Date[] => {
      const dates: Date[] = [];
      const start = new Date(startDate);
      
      for (let i = 0; i < days; i += interval) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
      
      return dates;
    },
    
    /**
     * Generates a date string in the specified format
     */
    formatDateString: (date: Date, formatStr = 'dd/MM/yyyy', locale = 'pt-BR'): string => {
      const localeObj = locale === 'pt-BR' ? ptBR : enUS;
      return format(date, formatStr, { locale: localeObj });
    },
    
    /**
     * Parses a date string in the specified format
     */
    parseDateString: (dateStr: string, formatStr = 'dd/MM/yyyy', locale = 'pt-BR'): Date => {
      const localeObj = locale === 'pt-BR' ? ptBR : enUS;
      return parse(dateStr, formatStr, new Date(), { locale: localeObj });
    },
  },
  
  // Array-related test data
  arrays: {
    /**
     * Generates an array of objects with specified properties
     */
    generateObjectArray: <T extends Record<string, any>>(
      count: number,
      generator: (index: number) => T
    ): T[] => {
      return Array.from({ length: count }, (_, index) => generator(index));
    },
    
    /**
     * Creates a nested array structure for testing array utilities
     */
    createNestedArray: <T>(items: T[], depth: number, childrenPerItem = 2): any[] => {
      if (depth <= 0) return items;
      
      return items.map((item, index) => {
        const children = Array.from(
          { length: childrenPerItem },
          (_, childIndex) => `${item}-${index}-${childIndex}`
        );
        
        return [item, testDataGenerators.arrays.createNestedArray(children, depth - 1, childrenPerItem)];
      });
    },
  },
  
  // Validation-related test data
  validation: {
    /**
     * Creates a Zod schema for testing validation utilities
     */
    createTestSchema: <T extends z.ZodRawShape>(shape: T) => {
      return z.object(shape);
    },
    
    /**
     * Generates test objects that either pass or fail validation
     */
    generateValidationTestCases: <T extends z.ZodRawShape>(
      schema: z.ZodObject<T>,
      validCases: number,
      invalidCases: number,
      validGenerator: (index: number) => z.infer<typeof schema>,
      invalidGenerator: (index: number) => any
    ) => {
      const valid = Array.from({ length: validCases }, (_, index) => ({
        case: `valid-${index}`,
        data: validGenerator(index),
        shouldPass: true,
      }));
      
      const invalid = Array.from({ length: invalidCases }, (_, index) => ({
        case: `invalid-${index}`,
        data: invalidGenerator(index),
        shouldPass: false,
      }));
      
      return [...valid, ...invalid];
    },
  },
  
  // Journey-specific test data
  journeys: {
    health: {
      /**
       * Generates health metrics data for testing
       */
      generateHealthMetrics: (userId: string, days: number) => {
        const today = new Date();
        const dates = testDataGenerators.dates.generateDateSeries(today, days, 1);
        
        return {
          userId,
          metrics: dates.map((date, index) => ({
            date,
            steps: Math.floor(Math.random() * 15000) + 2000,
            heartRate: Math.floor(Math.random() * 40) + 60,
            sleepHours: Math.floor(Math.random() * 4) + 4,
            weight: Math.floor(Math.random() * 10) + 70 + (Math.random() * 0.9),
          })),
        };
      },
    },
    
    care: {
      /**
       * Generates appointment data for testing
       */
      generateAppointments: (userId: string, count: number) => {
        const today = new Date();
        const dates = testDataGenerators.dates.generateDateSeries(today, count * 2, 2);
        
        const specialties = [
          'Cardiologia',
          'Dermatologia',
          'Ortopedia',
          'Pediatria',
          'Neurologia',
        ];
        
        return dates.slice(0, count).map((date, index) => ({
          id: `appointment-${index}`,
          userId,
          providerId: `provider-${index % 5}`,
          specialty: specialties[index % specialties.length],
          date,
          status: index % 3 === 0 ? 'SCHEDULED' : index % 3 === 1 ? 'COMPLETED' : 'CANCELLED',
          notes: index % 2 === 0 ? 'Consulta de rotina' : 'Retorno',
        }));
      },
    },
    
    plan: {
      /**
       * Generates insurance claim data for testing
       */
      generateClaims: (userId: string, count: number) => {
        const today = new Date();
        const dates = testDataGenerators.dates.generateDateSeries(today, count * 3, 3);
        
        const claimTypes = [
          'MEDICAL_CONSULTATION',
          'LABORATORY_EXAM',
          'HOSPITALIZATION',
          'PROCEDURE',
          'MEDICATION',
        ];
        
        return dates.slice(0, count).map((date, index) => ({
          id: `claim-${index}`,
          userId,
          type: claimTypes[index % claimTypes.length],
          date,
          amount: Math.floor(Math.random() * 5000) + 100,
          status: index % 4 === 0 ? 'PENDING' : index % 4 === 1 ? 'APPROVED' : 
                 index % 4 === 2 ? 'REJECTED' : 'UNDER_REVIEW',
          description: `Claim for ${claimTypes[index % claimTypes.length].toLowerCase().replace('_', ' ')}`,
        }));
      },
    },
  },
};

/**
 * Integration Verification Utilities
 * Helps verify the integration between different utility modules
 */
export const integrationVerifiers = {
  /**
   * Verifies the integration between date and validation utilities
   */
  dateValidation: {
    verifyDateFormatAndValidation: (dateStr: string, format: string, locale = 'pt-BR') => {
      // First parse the date string
      const parsedDate = testDataGenerators.dates.parseDateString(dateStr, format, locale);
      
      // Then format it back to a string
      const formattedDate = testDataGenerators.dates.formatDateString(parsedDate, format, locale);
      
      // Verify the round-trip conversion
      return {
        isValid: !isNaN(parsedDate.getTime()),
        originalString: dateStr,
        parsedDate,
        formattedDate,
        isRoundTripSuccessful: dateStr === formattedDate,
      };
    },
  },
  
  /**
   * Verifies the integration between HTTP and validation utilities
   */
  httpValidation: {
    verifyRequestValidation: <T>(request: AxiosRequestConfig, schema: z.ZodType<T>) => {
      const validationResult = schema.safeParse(request.data);
      
      return {
        request,
        isValid: validationResult.success,
        validationErrors: validationResult.success ? undefined : validationResult.error.format(),
      };
    },
    
    verifyResponseValidation: <T>(response: AxiosResponse, schema: z.ZodType<T>) => {
      const validationResult = schema.safeParse(response.data);
      
      return {
        response,
        isValid: validationResult.success,
        validationErrors: validationResult.success ? undefined : validationResult.error.format(),
      };
    },
  },
  
  /**
   * Verifies the integration between array utilities and other modules
   */
  arrayIntegration: {
    verifyArrayTransformAndValidation: <T, R>(
      array: T[],
      transformFn: (arr: T[]) => R,
      schema: z.ZodType<R>
    ) => {
      // Transform the array
      const transformed = transformFn(array);
      
      // Validate the transformed result
      const validationResult = schema.safeParse(transformed);
      
      return {
        originalArray: array,
        transformedResult: transformed,
        isValid: validationResult.success,
        validationErrors: validationResult.success ? undefined : validationResult.error.format(),
      };
    },
  },
};

/**
 * Journey-specific test helpers
 */
export const journeyHelpers = {
  health: {
    /**
     * Creates a test environment for health journey integration tests
     */
    createTestEnvironment: (userId: string = 'test-health-user') => {
      const context = createJourneyContext(JourneyType.HEALTH, { userId });
      const metrics = testDataGenerators.journeys.health.generateHealthMetrics(userId, 30);
      
      return {
        context,
        metrics,
        // Add more health-specific test data and utilities as needed
      };
    },
  },
  
  care: {
    /**
     * Creates a test environment for care journey integration tests
     */
    createTestEnvironment: (userId: string = 'test-care-user') => {
      const context = createJourneyContext(JourneyType.CARE, { userId });
      const appointments = testDataGenerators.journeys.care.generateAppointments(userId, 10);
      
      return {
        context,
        appointments,
        // Add more care-specific test data and utilities as needed
      };
    },
  },
  
  plan: {
    /**
     * Creates a test environment for plan journey integration tests
     */
    createTestEnvironment: (userId: string = 'test-plan-user') => {
      const context = createJourneyContext(JourneyType.PLAN, { userId });
      const claims = testDataGenerators.journeys.plan.generateClaims(userId, 15);
      
      return {
        context,
        claims,
        // Add more plan-specific test data and utilities as needed
      };
    },
  },
};

/**
 * Constants for integration testing
 */
export const integrationTestConstants = {
  // Timeouts for different types of tests
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 15000,
  },
  
  // Common test user IDs
  users: {
    admin: 'test-admin-user',
    regular: 'test-regular-user',
    premium: 'test-premium-user',
  },
  
  // Journey-specific constants
  journeys: {
    health: {
      metricTypes: ['STEPS', 'HEART_RATE', 'SLEEP', 'WEIGHT', 'BLOOD_PRESSURE'],
      goalTypes: ['DAILY', 'WEEKLY', 'MONTHLY'],
    },
    care: {
      appointmentStatus: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      specialties: ['CARDIOLOGY', 'DERMATOLOGY', 'ORTHOPEDICS', 'PEDIATRICS', 'NEUROLOGY'],
    },
    plan: {
      claimStatus: ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'],
      planTypes: ['BASIC', 'STANDARD', 'PREMIUM', 'FAMILY'],
    },
  },
};

// Export all helpers and utilities
export {
  httpFixtures,
  validationFixtures,
};