/**
 * Jest setup file for database package tests
 * 
 * This file configures the Jest testing environment for database tests, including:
 * - Environment variable configuration
 * - Global mocks for database dependencies
 * - Test lifecycle hooks for setup and cleanup
 * - Utilities for database connection management
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test file
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Set default environment variables for tests if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_test';
process.env.TIMESCALE_URL = process.env.TIMESCALE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_timescale_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

// Create mock for PrismaClient
const mockPrismaClient = mockDeep<PrismaClient>();

// Create mock for PrismaService (extends PrismaClient with additional functionality)
const mockPrismaService = {
  ...mockPrismaClient,
  cleanDatabase: jest.fn(),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
  enableShutdownHooks: jest.fn(),
};

// Mock the database module
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock the PrismaService
jest.mock('../src/prisma.service', () => ({
  PrismaService: jest.fn(() => mockPrismaService),
}));

// Mock journey-specific database contexts
jest.mock('../src/contexts/health-context', () => ({
  HealthDatabaseContext: jest.fn().mockImplementation(() => ({
    getMetrics: jest.fn(),
    saveMetric: jest.fn(),
    getGoals: jest.fn(),
    saveGoal: jest.fn(),
    getDevices: jest.fn(),
    connectDevice: jest.fn(),
  })),
}));

jest.mock('../src/contexts/care-context', () => ({
  CareDatabaseContext: jest.fn().mockImplementation(() => ({
    getAppointments: jest.fn(),
    saveAppointment: jest.fn(),
    getProviders: jest.fn(),
    getMedications: jest.fn(),
    saveMedication: jest.fn(),
    getTreatments: jest.fn(),
    saveTreatment: jest.fn(),
  })),
}));

jest.mock('../src/contexts/plan-context', () => ({
  PlanDatabaseContext: jest.fn().mockImplementation(() => ({
    getPlans: jest.fn(),
    getBenefits: jest.fn(),
    getClaims: jest.fn(),
    saveClaim: jest.fn(),
    getDocuments: jest.fn(),
    saveDocument: jest.fn(),
  })),
}));

// Mock transaction management
jest.mock('../src/transactions/transaction.service', () => ({
  TransactionService: jest.fn().mockImplementation(() => ({
    withTransaction: jest.fn().mockImplementation((callback) => callback(mockPrismaClient)),
    startTransaction: jest.fn().mockReturnValue(Promise.resolve(mockPrismaClient)),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
  })),
}));

// Mock database error handling
jest.mock('../src/errors/error-transformer', () => ({
  transformPrismaError: jest.fn(),
  transformDatabaseError: jest.fn(),
}));

// Reset all mocks before each test
beforeEach(() => {
  mockReset(mockPrismaClient);
  jest.clearAllMocks();
});

// Global test utilities
global.createTestDatabase = () => {
  return {
    prisma: mockPrismaClient as DeepMockProxy<PrismaClient>,
    prismaService: mockPrismaService,
  };
};

// Type definitions for global utilities
declare global {
  // eslint-disable-next-line no-var
  var createTestDatabase: () => {
    prisma: DeepMockProxy<PrismaClient>;
    prismaService: typeof mockPrismaService;
  };
}

// Export mocks for direct import in tests
export {
  mockPrismaClient,
  mockPrismaService,
};