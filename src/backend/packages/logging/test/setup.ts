/**
 * Test setup file for the logging package
 * 
 * This file configures the testing environment before running tests, including:
 * - Setting up environment variables
 * - Initializing mocks for external dependencies
 * - Configuring global test utilities
 * - Setting up trace context for tests
 * - Implementing cleanup to prevent test pollution
 */

import { AsyncLocalStorage } from 'async_hooks';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LogLevel } from '../src/interfaces/log-level.enum';
import { TracingService } from '@austa/tracing';

// Mock implementations
const mockTracingService = {
  getTraceId: jest.fn().mockReturnValue('test-trace-id'),
  getSpanId: jest.fn().mockReturnValue('test-span-id'),
  getTraceContext: jest.fn().mockReturnValue({
    traceId: 'test-trace-id',
    spanId: 'test-span-id',
    traceFlags: 1,
  }),
  startSpan: jest.fn().mockImplementation((name, options, fn) => {
    if (typeof fn === 'function') {
      return fn();
    }
    return { end: jest.fn() };
  }),
  createSpan: jest.fn().mockReturnValue({
    end: jest.fn(),
    setAttributes: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
  }),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key, defaultValue) => {
    const config = {
      LOG_LEVEL: 'debug',
      LOG_FORMAT: 'json',
      LOG_TRANSPORTS: 'console',
      LOG_JOURNEY_CONTEXT: 'true',
      LOG_REQUEST_CONTEXT: 'true',
      LOG_USER_CONTEXT: 'true',
      LOG_TRACE_CONTEXT: 'true',
      NODE_ENV: 'test',
    };
    return config[key] || defaultValue;
  }),
};

// Create AsyncLocalStorage for context management in tests
const asyncLocalStorage = new AsyncLocalStorage();

// Setup global mocks
jest.mock('@austa/tracing', () => ({
  TracingService: jest.fn().mockImplementation(() => mockTracingService),
}));

jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => mockConfigService),
}));

// Mock console methods to prevent noise during tests
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'debug';
process.env.LOG_FORMAT = 'json';
process.env.LOG_TRANSPORTS = 'console';

// Create test module factory for consistent DI in tests
export const createTestingModule = async (providers = []) => {
  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: TracingService,
        useValue: mockTracingService,
      },
      {
        provide: ConfigService,
        useValue: mockConfigService,
      },
      ...providers,
    ],
  }).compile();

  return moduleRef;
};

// Create test utilities for journey-specific testing
export const journeyContexts = {
  health: {
    journeyId: 'health',
    journeyName: 'Minha Saúde',
    journeyContext: {
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      deviceId: 'test-device-id',
    },
  },
  care: {
    journeyId: 'care',
    journeyName: 'Cuidar-me Agora',
    journeyContext: {
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      appointmentId: 'test-appointment-id',
    },
  },
  plan: {
    journeyId: 'plan',
    journeyName: 'Meu Plano & Benefícios',
    journeyContext: {
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      planId: 'test-plan-id',
    },
  },
};

// Create test utilities for request context
export const createTestRequestContext = (overrides = {}) => ({
  requestId: 'test-request-id',
  method: 'GET',
  url: '/test',
  userAgent: 'jest-test',
  ip: '127.0.0.1',
  ...overrides,
});

// Create test utilities for user context
export const createTestUserContext = (overrides = {}) => ({
  userId: 'test-user-id',
  email: 'test@example.com',
  roles: ['user'],
  ...overrides,
});

// Create test utilities for error objects
export const createTestError = (message = 'Test error', code = 'TEST_ERROR') => {
  const error = new Error(message);
  error['code'] = code;
  return error;
};

// Create test utilities for log entry verification
export const createExpectedLogEntry = (level = LogLevel.INFO, message = 'Test message', context = {}) => ({
  level,
  message,
  timestamp: expect.any(String),
  context: expect.objectContaining(context),
  trace: expect.objectContaining({
    traceId: 'test-trace-id',
    spanId: 'test-span-id',
  }),
});

// Setup function to run before each test
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup context for tests
  asyncLocalStorage.enterWith({
    requestId: 'test-request-id',
    traceId: 'test-trace-id',
    spanId: 'test-span-id',
  });
});

// Cleanup function to run after each test
afterEach(() => {
  // Restore console
  if (process.env.SHOW_CONSOLE_OUTPUT === 'true') {
    global.console = originalConsole;
  }
});

// Cleanup function to run after all tests
afterAll(() => {
  // Restore console
  global.console = originalConsole;
});

// Export mocks for use in tests
export const mocks = {
  tracingService: mockTracingService,
  configService: mockConfigService,
};

// Export AsyncLocalStorage for context testing
export const testAsyncLocalStorage = asyncLocalStorage;