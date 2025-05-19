/**
 * Environment test helpers for mocking, validating, and testing environment variables.
 * These utilities facilitate testing of environment variable access, validation,
 * transformation, and journey-specific configuration across all backend services.
 */

import { afterEach } from '@jest/globals';

/**
 * Type definitions for environment variable mocking and testing
 */
export interface EnvMock {
  /** Restore the original environment variables */
  restore: () => void;
  /** Get the current mocked environment variables */
  getEnv: () => Record<string, string | undefined>;
  /** Update the mocked environment variables */
  update: (newEnv: Record<string, string | undefined>) => void;
  /** Clear all mocked environment variables */
  clear: () => void;
}

export interface JourneyEnvMock extends EnvMock {
  /** Journey name (health, care, plan) */
  journey: string;
  /** Get a journey-specific environment variable */
  getJourneyVar: (key: string) => string | undefined;
  /** Set a journey-specific environment variable */
  setJourneyVar: (key: string, value: string | undefined) => void;
}

export type EnvTransformTestCase<T> = {
  input: string | undefined;
  expected: T | Error;
  description: string;
};

export type EnvValidationTestCase = {
  env: Record<string, string | undefined>;
  shouldPass: boolean;
  description: string;
};

/**
 * Original environment variables backup
 */
let originalEnv: Record<string, string | undefined> = {};

/**
 * Backs up the current environment variables
 */
const backupEnv = (): void => {
  originalEnv = { ...process.env };
};

/**
 * Restores the original environment variables
 */
const restoreEnv = (): void => {
  // Clear all current environment variables
  Object.keys(process.env).forEach((key) => {
    delete process.env[key];
  });

  // Restore original environment variables
  Object.entries(originalEnv).forEach(([key, value]) => {
    if (value !== undefined) {
      process.env[key] = value;
    }
  });
};

/**
 * Creates a mock environment with the specified variables and automatic cleanup
 * 
 * @param mockEnv - Environment variables to mock
 * @returns An object with methods to manage the mocked environment
 * 
 * @example
 * ```typescript
 * const envMock = mockEnv({ API_URL: 'https://api.example.com', API_KEY: 'test-key' });
 * // Test with mocked environment variables
 * expect(process.env.API_URL).toBe('https://api.example.com');
 * // Update mocked environment variables
 * envMock.update({ API_URL: 'https://new-api.example.com' });
 * // Manually restore original environment variables if needed before test ends
 * envMock.restore();
 * ```
 */
export const mockEnv = (mockEnv: Record<string, string | undefined> = {}): EnvMock => {
  // Backup current environment variables if not already backed up
  if (Object.keys(originalEnv).length === 0) {
    backupEnv();
  }

  // Set mock environment variables
  Object.keys(process.env).forEach((key) => {
    delete process.env[key];
  });

  Object.entries(mockEnv).forEach(([key, value]) => {
    if (value !== undefined) {
      process.env[key] = value;
    }
  });

  // Setup automatic cleanup after test
  afterEach(() => {
    restoreEnv();
  });

  return {
    restore: restoreEnv,
    getEnv: () => ({ ...process.env }),
    update: (newEnv: Record<string, string | undefined>) => {
      Object.entries(newEnv).forEach(([key, value]) => {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      });
    },
    clear: () => {
      Object.keys(process.env).forEach((key) => {
        delete process.env[key];
      });
    },
  };
};

/**
 * Creates a mock environment for a specific journey with automatic cleanup
 * 
 * @param journey - Journey name (health, care, plan)
 * @param mockEnv - Journey-specific environment variables to mock
 * @returns An object with methods to manage the journey-specific mocked environment
 * 
 * @example
 * ```typescript
 * const healthEnvMock = mockJourneyEnv('health', { 
 *   API_URL: 'https://health-api.example.com',
 *   FEATURE_FLAGS: 'metrics,goals,devices'
 * });
 * 
 * // Test with journey-specific environment variables
 * expect(process.env.HEALTH_API_URL).toBe('https://health-api.example.com');
 * 
 * // Get a journey-specific variable
 * expect(healthEnvMock.getJourneyVar('API_URL')).toBe('https://health-api.example.com');
 * 
 * // Set a journey-specific variable
 * healthEnvMock.setJourneyVar('NEW_FLAG', 'enabled');
 * expect(process.env.HEALTH_NEW_FLAG).toBe('enabled');
 * ```
 */
export const mockJourneyEnv = (journey: string, mockEnv: Record<string, string | undefined> = {}): JourneyEnvMock => {
  // Convert regular env vars to journey-specific ones
  const journeyEnv: Record<string, string | undefined> = {};
  
  Object.entries(mockEnv).forEach(([key, value]) => {
    journeyEnv[`${journey.toUpperCase()}_${key}`] = value;
  });

  // Create base env mock
  const envMock = mockEnv(journeyEnv);

  return {
    ...envMock,
    journey,
    getJourneyVar: (key: string) => process.env[`${journey.toUpperCase()}_${key}`],
    setJourneyVar: (key: string, value: string | undefined) => {
      if (value === undefined) {
        delete process.env[`${journey.toUpperCase()}_${key}`];
      } else {
        process.env[`${journey.toUpperCase()}_${key}`] = value;
      }
    },
  };
};

/**
 * Creates test cases for environment variable transformation functions
 * 
 * @param testCases - Array of test cases for transformation testing
 * @returns The same array of test cases for use in tests
 * 
 * @example
 * ```typescript
 * const booleanTestCases = createEnvTransformTestCases<boolean>([
 *   { input: 'true', expected: true, description: 'String true should transform to boolean true' },
 *   { input: 'false', expected: false, description: 'String false should transform to boolean false' },
 *   { input: '1', expected: true, description: 'String 1 should transform to boolean true' },
 *   { input: '0', expected: false, description: 'String 0 should transform to boolean false' },
 *   { input: 'invalid', expected: new Error('Invalid boolean value'), description: 'Invalid string should throw error' }
 * ]);
 * 
 * // Use in tests
 * booleanTestCases.forEach(({ input, expected, description }) => {
 *   test(description, () => {
 *     mockEnv({ TEST_BOOL: input });
 *     
 *     if (expected instanceof Error) {
 *       expect(() => parseBoolean(process.env.TEST_BOOL)).toThrow();
 *     } else {
 *       expect(parseBoolean(process.env.TEST_BOOL)).toBe(expected);
 *     }
 *   });
 * });
 * ```
 */
export const createEnvTransformTestCases = <T>(testCases: EnvTransformTestCase<T>[]): EnvTransformTestCase<T>[] => {
  return testCases;
};

/**
 * Creates test cases for environment variable validation functions
 * 
 * @param testCases - Array of test cases for validation testing
 * @returns The same array of test cases for use in tests
 * 
 * @example
 * ```typescript
 * const validationTestCases = createEnvValidationTestCases([
 *   { 
 *     env: { API_URL: 'https://api.example.com', API_KEY: 'valid-key' }, 
 *     shouldPass: true, 
 *     description: 'Valid API configuration should pass validation' 
 *   },
 *   { 
 *     env: { API_URL: 'invalid-url', API_KEY: 'valid-key' }, 
 *     shouldPass: false, 
 *     description: 'Invalid API URL should fail validation' 
 *   },
 *   { 
 *     env: { API_URL: 'https://api.example.com' }, 
 *     shouldPass: false, 
 *     description: 'Missing API key should fail validation' 
 *   }
 * ]);
 * 
 * // Use in tests
 * validationTestCases.forEach(({ env, shouldPass, description }) => {
 *   test(description, () => {
 *     mockEnv(env);
 *     
 *     if (shouldPass) {
 *       expect(() => validateApiConfig()).not.toThrow();
 *     } else {
 *       expect(() => validateApiConfig()).toThrow();
 *     }
 *   });
 * });
 * ```
 */
export const createEnvValidationTestCases = (testCases: EnvValidationTestCase[]): EnvValidationTestCase[] => {
  return testCases;
};

/**
 * Generates a random environment variable value for testing
 * 
 * @param type - Type of value to generate ('string', 'number', 'boolean', 'url', 'json', 'array')
 * @param options - Options for value generation
 * @returns A random value of the specified type
 * 
 * @example
 * ```typescript
 * // Generate a random URL
 * const randomUrl = generateEnvValue('url');
 * 
 * // Generate a random number between 1000 and 9999
 * const randomPort = generateEnvValue('number', { min: 1000, max: 9999 });
 * 
 * // Generate a random JSON object
 * const randomConfig = generateEnvValue('json', { 
 *   properties: ['debug', 'timeout', 'retries'],
 *   depth: 2
 * });
 * 
 * // Generate a random array
 * const randomFeatures = generateEnvValue('array', { 
 *   items: ['feature1', 'feature2', 'feature3', 'feature4'],
 *   length: 2
 * });
 * ```
 */
export const generateEnvValue = (
  type: 'string' | 'number' | 'boolean' | 'url' | 'json' | 'array',
  options: Record<string, any> = {}
): string => {
  switch (type) {
    case 'string': {
      const length = options.length || 10;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
    
    case 'number': {
      const min = options.min || 0;
      const max = options.max || 1000;
      return String(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    
    case 'boolean': {
      return Math.random() > 0.5 ? 'true' : 'false';
    }
    
    case 'url': {
      const protocols = options.protocols || ['http', 'https'];
      const domains = options.domains || ['example.com', 'test.org', 'api.service.io'];
      const paths = options.paths || ['', '/api', '/v1/resources', '/health'];
      
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const path = paths[Math.floor(Math.random() * paths.length)];
      
      return `${protocol}://${domain}${path}`;
    }
    
    case 'json': {
      const depth = options.depth || 1;
      const properties = options.properties || ['prop1', 'prop2', 'prop3'];
      
      const generateObject = (currentDepth: number): Record<string, any> => {
        const obj: Record<string, any> = {};
        
        properties.forEach(prop => {
          if (currentDepth < depth && Math.random() > 0.7) {
            obj[prop] = generateObject(currentDepth + 1);
          } else {
            const valueType = Math.floor(Math.random() * 3);
            switch (valueType) {
              case 0: obj[prop] = generateEnvValue('string'); break;
              case 1: obj[prop] = generateEnvValue('number'); break;
              case 2: obj[prop] = generateEnvValue('boolean'); break;
            }
          }
        });
        
        return obj;
      };
      
      return JSON.stringify(generateObject(0));
    }
    
    case 'array': {
      const length = options.length || 3;
      const items = options.items || [
        generateEnvValue('string'),
        generateEnvValue('string'),
        generateEnvValue('string'),
        generateEnvValue('string'),
      ];
      
      const result = [];
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * items.length);
        result.push(items[randomIndex]);
      }
      
      return options.format === 'json' ? JSON.stringify(result) : result.join(',');
    }
    
    default:
      return '';
  }
};

/**
 * Creates a mock for testing missing environment variables
 * 
 * @param requiredVars - Array of required environment variable names
 * @param presentVars - Object containing environment variables that should be present
 * @returns An EnvMock instance with the specified configuration
 * 
 * @example
 * ```typescript
 * // Mock environment with missing DATABASE_URL
 * const envMock = mockMissingEnvVars(
 *   ['API_KEY', 'DATABASE_URL', 'PORT'], 
 *   { API_KEY: 'test-key', PORT: '3000' }
 * );
 * 
 * // Test that validation fails due to missing DATABASE_URL
 * expect(() => validateRequiredEnvVars(['API_KEY', 'DATABASE_URL', 'PORT'])).toThrow();
 * ```
 */
export const mockMissingEnvVars = (
  requiredVars: string[],
  presentVars: Record<string, string> = {}
): EnvMock => {
  // Ensure we're only setting the variables specified in presentVars
  const mockVars: Record<string, string | undefined> = {};
  
  // Initialize all required vars as undefined
  requiredVars.forEach(varName => {
    mockVars[varName] = undefined;
  });
  
  // Set the present vars
  Object.entries(presentVars).forEach(([key, value]) => {
    mockVars[key] = value;
  });
  
  return mockEnv(mockVars);
};

/**
 * Creates a mock for testing invalid environment variable formats
 * 
 * @param validationRules - Object mapping environment variable names to their validation rules
 * @param invalidVars - Object containing environment variables with invalid formats
 * @returns An EnvMock instance with the specified configuration
 * 
 * @example
 * ```typescript
 * // Mock environment with invalid PORT (not a number) and invalid URL format
 * const envMock = mockInvalidEnvVarFormats(
 *   { 
 *     PORT: 'number', 
 *     API_URL: 'url',
 *     DEBUG: 'boolean'
 *   }, 
 *   { 
 *     PORT: 'not-a-number', 
 *     API_URL: 'invalid-url',
 *     DEBUG: 'true' // This one is valid
 *   }
 * );
 * 
 * // Test that validation fails due to invalid formats
 * expect(() => validateEnvVarFormats()).toThrow();
 * ```
 */
export const mockInvalidEnvVarFormats = (
  validationRules: Record<string, string>,
  invalidVars: Record<string, string>
): EnvMock => {
  return mockEnv(invalidVars);
};

/**
 * Creates a mock for testing journey-specific environment variable conflicts
 * 
 * @param journeys - Array of journey names
 * @param conflictVars - Object mapping variable names to their conflicting values across journeys
 * @returns An object containing EnvMock instances for each journey
 * 
 * @example
 * ```typescript
 * // Mock environment with conflicting DATABASE_URL across journeys
 * const journeyMocks = mockJourneyEnvConflicts(
 *   ['health', 'care', 'plan'],
 *   {
 *     DATABASE_URL: {
 *       health: 'postgres://user:pass@health-db:5432/health',
 *       care: 'postgres://user:pass@care-db:5432/care',
 *       plan: 'postgres://user:pass@plan-db:5432/plan'
 *     },
 *     API_KEY: {
 *       health: 'health-key',
 *       care: 'care-key',
 *       plan: 'plan-key'
 *     }
 *   }
 * );
 * 
 * // Test journey-specific environment variables
 * expect(process.env.HEALTH_DATABASE_URL).toBe('postgres://user:pass@health-db:5432/health');
 * expect(process.env.CARE_DATABASE_URL).toBe('postgres://user:pass@care-db:5432/care');
 * expect(process.env.PLAN_DATABASE_URL).toBe('postgres://user:pass@plan-db:5432/plan');
 * ```
 */
export const mockJourneyEnvConflicts = (
  journeys: string[],
  conflictVars: Record<string, Record<string, string>>
): Record<string, JourneyEnvMock> => {
  const result: Record<string, JourneyEnvMock> = {};
  
  journeys.forEach(journey => {
    const journeyVars: Record<string, string> = {};
    
    Object.entries(conflictVars).forEach(([varName, journeyValues]) => {
      if (journeyValues[journey]) {
        journeyVars[varName] = journeyValues[journey];
      }
    });
    
    result[journey] = mockJourneyEnv(journey, journeyVars);
  });
  
  return result;
};