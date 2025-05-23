/**
 * Global setup file for logging package tests.
 * This file is executed before any tests run and is responsible for
 * setting up the test environment with proper mocks and configurations.
 */

import { LogLevel } from '../src/interfaces/log-level.enum';
import { TEST_LOGGER_CONFIGS, TEST_TRACE_CONTEXTS } from './test-constants';
import { initializeAllMocks } from './mocks/index';
import { setupMockTransports } from './mocks/transport.mock';
import { setupMockFormatters } from './mocks/formatter.mock';
import { setupContextManagers } from './mocks/context-manager.mock';
import { setupTracingService } from './mocks/tracing.service.mock';
import { setupConfigService } from './mocks/config.service.mock';
import { setupAwsSdk } from './mocks/aws-sdk.mock';
import { setupEnvironment, setupTestUtilities, registerGlobalHelpers } from './mocks/test-utils';

// TypeScript declarations for global objects used in tests
declare global {
  namespace NodeJS {
    interface Global {
      __LOGGING_TEST_MODE__: boolean;
      AWS?: {
        _reset?: () => void;
        [key: string]: any;
      };
      console: Console & {
        _originalConsole?: Console;
      };
    }
  }
}

/**
 * Main setup function that orchestrates the initialization of all test resources.
 * This function is automatically called by the test runner before any tests run.
 */
export default async (): Promise<void> => {
  try {
    // Mark that we're running in test mode
    global.__LOGGING_TEST_MODE__ = true;
    
    // Set up environment variables for testing
    setupEnvironment({
      NODE_ENV: 'test',
      LOG_LEVEL: LogLevel.DEBUG.toString(),
      LOG_FORMAT: 'json',
      LOG_TRANSPORTS: 'console',
      SERVICE_NAME: 'test-service',
      ENABLE_CLOUDWATCH_LOGS: 'false',
      ENABLE_FILE_LOGS: 'false',
      AWS_REGION: 'us-east-1',
      TRACE_ENABLED: 'true',
    });
    
    // Initialize all mocks with default configurations
    initializeAllMocks();
    
    // Set up specific mocks with test configurations
    setupMockTransports();
    setupMockFormatters();
    setupContextManagers();
    setupTracingService({
      getCurrentTraceContext: jest.fn().mockReturnValue(TEST_TRACE_CONTEXTS.STANDARD),
      startSpan: jest.fn().mockImplementation((name, options) => ({
        name,
        context: TEST_TRACE_CONTEXTS.STANDARD,
        end: jest.fn(),
      })),
    });
    
    // Set up config service with test configurations
    setupConfigService({
      'logging': TEST_LOGGER_CONFIGS.DEFAULT,
      'logging.health': TEST_LOGGER_CONFIGS.HEALTH_JOURNEY,
      'logging.care': TEST_LOGGER_CONFIGS.CARE_JOURNEY,
      'logging.plan': TEST_LOGGER_CONFIGS.PLAN_JOURNEY,
    });
    
    // Set up AWS SDK mocks
    setupAwsSdk();
    
    // Set up test utilities and global helpers
    setupTestUtilities();
    registerGlobalHelpers();
    
    // Set up console capture to prevent logs from cluttering test output
    setupConsoleCapture();
    
    console.log('Logging package test setup completed successfully');
  } catch (error) {
    // Provide more detailed error information
    console.error('Error during logging package test setup:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown Error',
    });
    // Rethrow to prevent tests from running with an improperly set up environment
    throw error;
  }
};

/**
 * Sets up console capture to prevent logs from cluttering test output
 * while still allowing them to be inspected in tests.
 */
function setupConsoleCapture(): void {
  // Save original console
  global.console._originalConsole = { ...global.console };
  
  // Create captured logs storage
  const capturedLogs = {
    log: [] as string[],
    error: [] as string[],
    warn: [] as string[],
    info: [] as string[],
    debug: [] as string[],
  };
  
  // Override console methods to capture logs
  global.console.log = jest.fn((...args) => {
    capturedLogs.log.push(args.map(arg => String(arg)).join(' '));
    // Still log to console in verbose mode or if explicitly requested
    if (process.env.VERBOSE_LOGS === 'true') {
      global.console._originalConsole?.log?.(...args);
    }
  });
  
  global.console.error = jest.fn((...args) => {
    capturedLogs.error.push(args.map(arg => String(arg)).join(' '));
    // Always log errors to console for debugging
    global.console._originalConsole?.error?.(...args);
  });
  
  global.console.warn = jest.fn((...args) => {
    capturedLogs.warn.push(args.map(arg => String(arg)).join(' '));
    if (process.env.VERBOSE_LOGS === 'true') {
      global.console._originalConsole?.warn?.(...args);
    }
  });
  
  global.console.info = jest.fn((...args) => {
    capturedLogs.info.push(args.map(arg => String(arg)).join(' '));
    if (process.env.VERBOSE_LOGS === 'true') {
      global.console._originalConsole?.info?.(...args);
    }
  });
  
  global.console.debug = jest.fn((...args) => {
    capturedLogs.debug.push(args.map(arg => String(arg)).join(' '));
    if (process.env.VERBOSE_LOGS === 'true') {
      global.console._originalConsole?.debug?.(...args);
    }
  });
  
  // Add method to retrieve captured logs
  (global.console as any).getCapturedLogs = () => ({ ...capturedLogs });
  
  // Add method to clear captured logs
  (global.console as any).clearCapturedLogs = () => {
    Object.keys(capturedLogs).forEach(key => {
      (capturedLogs as any)[key] = [];
    });
  };
}

/**
 * Sets up journey-specific test factories for creating test entities
 * related to each journey (Health, Care, Plan).
 */
function setupJourneyTestFactories(): void {
  // Health journey test factories
  global.healthFactories = {
    createHealthMetric: jest.fn(),
    createHealthGoal: jest.fn(),
    createDeviceConnection: jest.fn(),
    createMedicalEvent: jest.fn(),
  };
  
  // Care journey test factories
  global.careFactories = {
    createAppointment: jest.fn(),
    createProvider: jest.fn(),
    createMedication: jest.fn(),
    createTreatment: jest.fn(),
  };
  
  // Plan journey test factories
  global.planFactories = {
    createPlan: jest.fn(),
    createBenefit: jest.fn(),
    createClaim: jest.fn(),
    createCoverage: jest.fn(),
  };
  
  // Gamification test factories
  global.gamificationFactories = {
    createAchievement: jest.fn(),
    createQuest: jest.fn(),
    createReward: jest.fn(),
    createEvent: jest.fn(),
  };
}

// Add TypeScript declarations for the global journey test factories
declare global {
  const healthFactories: {
    createHealthMetric: jest.Mock;
    createHealthGoal: jest.Mock;
    createDeviceConnection: jest.Mock;
    createMedicalEvent: jest.Mock;
  };
  
  const careFactories: {
    createAppointment: jest.Mock;
    createProvider: jest.Mock;
    createMedication: jest.Mock;
    createTreatment: jest.Mock;
  };
  
  const planFactories: {
    createPlan: jest.Mock;
    createBenefit: jest.Mock;
    createClaim: jest.Mock;
    createCoverage: jest.Mock;
  };
  
  const gamificationFactories: {
    createAchievement: jest.Mock;
    createQuest: jest.Mock;
    createReward: jest.Mock;
    createEvent: jest.Mock;
  };
}

// Call setupJourneyTestFactories to initialize the journey test factories
setupJourneyTestFactories();