/**
 * Jest setup file for database package tests
 * 
 * This file configures the Jest testing environment for database tests, including:
 * - Setting up environment variables for test database connections
 * - Configuring global mocks for PrismaClient and other dependencies
 * - Implementing automatic mock resetting between tests
 * - Setting up cleanup procedures for database connections
 * - Providing utilities for database connection management during tests
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { ConnectionManager } from '../src/connection/connection-manager';
import { PrismaService } from '../src/prisma.service';

// Mock PrismaClient
const prismaMock = mockDeep<PrismaClient>();

// Mock PrismaService
const prismaServiceMock = mockDeep<PrismaService>();

// Mock ConnectionManager
const connectionManagerMock = mockDeep<ConnectionManager>();

// Configure Jest to use fake timers for all tests
jest.useFakeTimers();

// Set up environment variables for test database connections
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/austa_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.NODE_ENV = 'test';

// Mock modules
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

jest.mock('../src/prisma.service', () => ({
  PrismaService: jest.fn(() => prismaServiceMock),
}));

jest.mock('../src/connection/connection-manager', () => ({
  ConnectionManager: jest.fn(() => connectionManagerMock),
}));

// Mock Redis client
jest.mock('redis', () => {
  const redisMock = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockImplementation((key) => Promise.resolve(null)),
    set: jest.fn().mockImplementation((key, value) => Promise.resolve('OK')),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  };

  return {
    createClient: jest.fn(() => redisMock),
  };
});

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
  mockReset(prismaServiceMock);
  mockReset(connectionManagerMock);
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Ensure all pending timers are executed
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Global utility to create a test database connection
global.createTestConnection = async () => {
  return {
    prisma: prismaMock,
    prismaService: prismaServiceMock,
    connectionManager: connectionManagerMock,
  };
};

// Global utility to create an isolated test database context
global.createTestDatabaseContext = async (journeyType?: 'health' | 'care' | 'plan') => {
  // Import journey-specific context mocks dynamically to avoid circular dependencies
  const { HealthContextMock } = await import('./mocks/health-context.mock');
  const { CareContextMock } = await import('./mocks/care-context.mock');
  const { PlanContextMock } = await import('./mocks/plan-context.mock');
  const { JourneyContextMock } = await import('./mocks/journey-context.mock');

  // Return the appropriate journey context mock based on the journey type
  switch (journeyType) {
    case 'health':
      return new HealthContextMock(prismaMock);
    case 'care':
      return new CareContextMock(prismaMock);
    case 'plan':
      return new PlanContextMock(prismaMock);
    default:
      return new JourneyContextMock(prismaMock);
  }
};

// Global utility to create a test transaction
global.createTestTransaction = async () => {
  const { TransactionMock } = await import('./mocks/transaction.mock');
  return new TransactionMock(prismaMock);
};

// Extend Jest's global types
declare global {
  // eslint-disable-next-line no-var
  var createTestConnection: () => Promise<{
    prisma: PrismaClient;
    prismaService: PrismaService;
    connectionManager: ConnectionManager;
  }>;
  
  // eslint-disable-next-line no-var
  var createTestDatabaseContext: (journeyType?: 'health' | 'care' | 'plan') => Promise<any>;
  
  // eslint-disable-next-line no-var
  var createTestTransaction: () => Promise<any>;
}

// Export mocks for direct import in tests
export {
  prismaMock,
  prismaServiceMock,
  connectionManagerMock,
};