import { PrismaClient, Prisma } from '@prisma/client';
import { jest } from '@jest/globals';

/**
 * Enum representing different types of database errors that can be simulated
 */
export enum MockDatabaseErrorType {
  CONNECTION = 'connection',
  QUERY = 'query',
  TRANSACTION = 'transaction',
  CONSTRAINT = 'constraint',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * Creates a mock database error with appropriate Prisma error structure
 * 
 * @param type - The type of database error to create
 * @param message - Optional custom error message
 * @param code - Optional Prisma error code
 * @returns A simulated Prisma error
 */
export function createMockDatabaseError(
  type: MockDatabaseErrorType,
  message?: string,
  code?: string
): Error {
  let errorCode: string;
  let defaultMessage: string;
  
  switch (type) {
    case MockDatabaseErrorType.CONNECTION:
      errorCode = code || 'P1001';
      defaultMessage = 'Can\'t reach database server';
      break;
    case MockDatabaseErrorType.QUERY:
      errorCode = code || 'P2010';
      defaultMessage = 'Raw query failed';
      break;
    case MockDatabaseErrorType.TRANSACTION:
      errorCode = code || 'P2028';
      defaultMessage = 'Transaction API error';
      break;
    case MockDatabaseErrorType.CONSTRAINT:
      errorCode = code || 'P2002';
      defaultMessage = 'Unique constraint failed';
      break;
    case MockDatabaseErrorType.TIMEOUT:
      errorCode = code || 'P2024';
      defaultMessage = 'Operation timed out';
      break;
    default:
      errorCode = code || 'P2000';
      defaultMessage = 'Unknown database error';
      break;
  }
  
  const error = new Error(message || defaultMessage) as any;
  error.code = errorCode;
  error.clientVersion = 'mock';
  error.meta = { type };
  
  return error;
}

/**
 * Type representing a chainable mock method that returns itself for method chaining
 * and eventually resolves to type T when executed.
 */
type ChainableMock<T> = {
  [K in keyof T]: jest.Mock<any, any>;
} & {
  mockResolvedValue: (value: any) => ChainableMock<T>;
  mockRejectedValue: (error: Error) => ChainableMock<T>;
  mockReturnValue: (value: any) => ChainableMock<T>;
  mockImplementation: (fn: (...args: any[]) => any) => ChainableMock<T>;
};

/**
 * Type for a model with all standard Prisma operations mocked
 */
type MockModel<T> = {
  findUnique: jest.Mock<any, any> & { mockResolvedValue: (value: T | null) => ChainableMock<T> };
  findFirst: jest.Mock<any, any> & { mockResolvedValue: (value: T | null) => ChainableMock<T> };
  findMany: jest.Mock<any, any> & { mockResolvedValue: (value: T[]) => ChainableMock<T[]> };
  create: jest.Mock<any, any> & { mockResolvedValue: (value: T) => ChainableMock<T> };
  createMany: jest.Mock<any, any> & { mockResolvedValue: (value: { count: number }) => ChainableMock<{ count: number }> };
  update: jest.Mock<any, any> & { mockResolvedValue: (value: T) => ChainableMock<T> };
  updateMany: jest.Mock<any, any> & { mockResolvedValue: (value: { count: number }) => ChainableMock<{ count: number }> };
  upsert: jest.Mock<any, any> & { mockResolvedValue: (value: T) => ChainableMock<T> };
  delete: jest.Mock<any, any> & { mockResolvedValue: (value: T) => ChainableMock<T> };
  deleteMany: jest.Mock<any, any> & { mockResolvedValue: (value: { count: number }) => ChainableMock<{ count: number }> };
  count: jest.Mock<any, any> & { mockResolvedValue: (value: number) => ChainableMock<number> };
  aggregate: jest.Mock<any, any> & { mockResolvedValue: (value: any) => ChainableMock<any> };
  groupBy: jest.Mock<any, any> & { mockResolvedValue: (value: any) => ChainableMock<any> };
};

/**
 * Type for transaction options
 */
type TransactionOptions = {
  isolationLevel?: Prisma.TransactionIsolationLevel;
  maxWait?: number;
  timeout?: number;
};

/**
 * Type for the mock Prisma client that extends the original PrismaClient type
 */
type MockPrismaClient = {
  [K in keyof PrismaClient]: K extends '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    ? jest.Mock<any, any>
    : MockModel<any>;
} & {
  $transaction: jest.Mock<any, any> & {
    <T>(fn: (prisma: MockPrismaClient) => Promise<T>, options?: TransactionOptions): Promise<T>;
    <T>(queries: Array<Promise<T>>, options?: TransactionOptions): Promise<T[]>;
  };
  $connect: jest.Mock<any, any>;
  $disconnect: jest.Mock<any, any>;
  $extends: jest.Mock<any, any>;
  $use: jest.Mock<any, any>;
  $on: jest.Mock<any, any>;
  $queryRaw: jest.Mock<any, any>;
  $executeRaw: jest.Mock<any, any>;
  $queryRawUnsafe: jest.Mock<any, any>;
  $executeRawUnsafe: jest.Mock<any, any>;
  _isTransaction?: boolean;
  _transactionId?: string;
};

/**
 * Creates a chainable mock that returns itself for method chaining
 * and eventually resolves to the provided value when executed.
 *
 * @param mockFn - The Jest mock function to make chainable
 * @returns A chainable mock object
 */
function createChainableMock<T>(mockFn: jest.Mock): ChainableMock<T> {
  const chainable = mockFn as unknown as ChainableMock<T>;
  
  // Create a proxy to handle method chaining
  return new Proxy(chainable, {
    get: (target, prop) => {
      if (prop === 'mockResolvedValue') {
        return (value: any) => {
          mockFn.mockImplementation(async () => value);
          return chainable;
        };
      }
      
      if (prop === 'mockRejectedValue') {
        return (error: Error) => {
          mockFn.mockImplementation(async () => Promise.reject(error));
          return chainable;
        };
      }
      
      if (prop === 'mockReturnValue') {
        return (value: any) => {
          mockFn.mockImplementation(() => value);
          return chainable;
        };
      }
      
      if (prop === 'mockImplementation') {
        return (fn: (...args: any[]) => any) => {
          mockFn.mockImplementation(fn);
          return chainable;
        };
      }
      
      // Return the original property if it exists
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      
      // For any other method, return a new chainable mock
      const methodMock = jest.fn();
      return createChainableMock(methodMock);
    },
  });
}

/**
 * Creates a chainable mock with context-aware behavior for journey-specific operations
 *
 * @param mockFn - The Jest mock function to make chainable
 * @param journeyContext - Optional journey context to associate with the mock
 * @returns A chainable mock object with journey context awareness
 */
function createJourneyAwareMock<T>(mockFn: jest.Mock, journeyContext?: string): ChainableMock<T> {
  const chainable = createChainableMock<T>(mockFn);
  
  // Store journey context in the mock function for later use
  if (journeyContext) {
    (mockFn as any)._journeyContext = journeyContext;
  }
  
  return chainable;
}

/**
 * Creates a mock model with all standard Prisma operations
 *
 * @returns A mock model with chainable methods
 */
function createMockModel<T>(): MockModel<T> {
  const operations = [
    'findUnique',
    'findFirst',
    'findMany',
    'create',
    'createMany',
    'update',
    'updateMany',
    'upsert',
    'delete',
    'deleteMany',
    'count',
    'aggregate',
    'groupBy',
  ];
  
  const model = {} as MockModel<T>;
  
  operations.forEach((op) => {
    const mockFn = jest.fn();
    model[op as keyof MockModel<T>] = createChainableMock(mockFn) as any;
  });
  
  return model;
}

/**
 * Creates a mock Prisma client with all models and methods mocked
 *
 * @param options - Optional configuration options for the mock client
 * @returns A mock Prisma client
 */
export function createMockPrismaClient(options: {
  isTransaction?: boolean;
  transactionId?: string;
  journeyContext?: 'health' | 'care' | 'plan' | null;
  simulateErrors?: boolean;
} = {}): MockPrismaClient {
  const {
    isTransaction = false,
    transactionId = '',
    journeyContext = null,
    simulateErrors = false,
  } = options;
  
  const mockClient = {} as MockPrismaClient;
  
  // Set transaction properties if this is a transaction client
  if (isTransaction) {
    mockClient._isTransaction = true;
    mockClient._transactionId = transactionId || `transaction-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  // Mock client methods
  mockClient.$connect = jest.fn().mockResolvedValue(undefined);
  mockClient.$disconnect = jest.fn().mockResolvedValue(undefined);
  mockClient.$extends = jest.fn().mockReturnValue(mockClient);
  mockClient.$on = jest.fn();
  mockClient.$use = jest.fn().mockImplementation((middleware) => {
    // Store middleware for potential future use
    (mockClient as any)._middleware = (mockClient as any)._middleware || [];
    (mockClient as any)._middleware.push(middleware);
    return mockClient;
  });
  
  // Mock raw query methods
  mockClient.$queryRaw = jest.fn().mockImplementation(async (query, ...values) => {
    if (simulateErrors && Math.random() < 0.1) {
      throw new Error('Simulated database query error');
    }
    return [];
  });
  
  mockClient.$executeRaw = jest.fn().mockImplementation(async (query, ...values) => {
    if (simulateErrors && Math.random() < 0.1) {
      throw new Error('Simulated database execution error');
    }
    return 0;
  });
  
  mockClient.$queryRawUnsafe = jest.fn().mockImplementation(async (query, ...values) => {
    if (simulateErrors && Math.random() < 0.1) {
      throw new Error('Simulated database query error');
    }
    return [];
  });
  
  mockClient.$executeRawUnsafe = jest.fn().mockImplementation(async (query, ...values) => {
    if (simulateErrors && Math.random() < 0.1) {
      throw new Error('Simulated database execution error');
    }
    return 0;
  });
  
  // Mock transaction method with support for nested transactions and isolation levels
  mockClient.$transaction = jest.fn().mockImplementation(async (arg, options = {}) => {
    // Create a transaction client if this is a function transaction
    const txClient = createMockPrismaClient({
      isTransaction: true,
      journeyContext,
      simulateErrors,
    });
    
    // If arg is a function, execute it with the transaction client
    if (typeof arg === 'function') {
      try {
        const result = await arg(txClient);
        return result;
      } catch (error) {
        // Simulate transaction rollback on error
        if (simulateErrors) {
          console.error(`Transaction ${txClient._transactionId} rolled back due to error:`, error);
        }
        throw error;
      }
    }
    
    // If arg is an array of promises, resolve them sequentially
    if (Array.isArray(arg)) {
      try {
        return await Promise.all(arg);
      } catch (error) {
        // Simulate transaction rollback on error
        if (simulateErrors) {
          console.error('Transaction rolled back due to error:', error);
        }
        throw error;
      }
    }
    
    return null;
  });
  
  // Create mock models based on the standard Prisma models
  // These are derived from the seed.ts file and the database architecture
  const models = [
    'user',
    'permission',
    'role',
    'healthMetricType',
    'healthMetric',
    'healthGoal',
    'deviceType',
    'deviceConnection',
    'medicalEvent',
    'providerSpecialty',
    'provider',
    'appointment',
    'medication',
    'treatment',
    'telemedicineSession',
    'insurancePlanType',
    'insurancePlan',
    'benefit',
    'coverage',
    'claimType',
    'claim',
    'document',
    'achievementType',
    'achievement',
    'gamificationProfile',
    'quest',
    'reward',
    'rule',
    'event',
    'leaderboard',
  ];
  
  // Group models by journey for better organization and potential journey-specific behavior
  const journeyModels = {
    health: [
      'healthMetricType',
      'healthMetric',
      'healthGoal',
      'deviceType',
      'deviceConnection',
      'medicalEvent',
    ],
    care: [
      'providerSpecialty',
      'provider',
      'appointment',
      'medication',
      'treatment',
      'telemedicineSession',
    ],
    plan: [
      'insurancePlanType',
      'insurancePlan',
      'benefit',
      'coverage',
      'claimType',
      'claim',
      'document',
    ],
    gamification: [
      'achievementType',
      'achievement',
      'gamificationProfile',
      'quest',
      'reward',
      'rule',
      'event',
      'leaderboard',
    ],
    common: [
      'user',
      'permission',
      'role',
    ],
  };
  
  // Create mock models
  models.forEach((modelName) => {
    // Determine which journey this model belongs to
    let modelJourney: string | null = null;
    for (const [journey, journeyModelList] of Object.entries(journeyModels)) {
      if (journeyModelList.includes(modelName)) {
        modelJourney = journey;
        break;
      }
    }
    
    // Create the mock model with journey context if applicable
    mockClient[modelName as keyof MockPrismaClient] = createMockModel();
    
    // Add journey context to the model for potential journey-specific behavior
    if (modelJourney) {
      (mockClient[modelName as keyof MockPrismaClient] as any)._journeyContext = modelJourney;
    }
    
    // If we're simulating errors, add random error simulation to some operations
    if (simulateErrors) {
      const model = mockClient[modelName as keyof MockPrismaClient] as any;
      const errorProneOperations = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'];
      
      errorProneOperations.forEach((operation) => {
        const originalMock = model[operation].mockImplementation;
        model[operation].mockImplementation = function(...args: any[]) {
          if (Math.random() < 0.05) { // 5% chance of error
            return Promise.reject(new Error(`Simulated database error in ${modelName}.${operation}`));
          }
          return originalMock.apply(this, args);
        };
      });
    }
  });
  
  return mockClient;
}

/**
 * Factory function to create model-specific mock data
 * 
 * @param modelName - The name of the model to create mock data for
 * @param overrides - Optional overrides for the default mock data
 * @param journeyContext - Optional journey context to use for generating journey-specific data
 * @returns Mock data for the specified model
 */
export function createMockData<T>(
  modelName: string, 
  overrides: Partial<T> = {}, 
  journeyContext?: 'health' | 'care' | 'plan' | null
): T {
  // Default mock data for common models
  const mockDataMap: Record<string, any> = {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      phone: '+5511999999999',
      cpf: '12345678901',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    permission: {
      id: 'permission-1',
      name: 'test:permission',
      description: 'Test permission',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: {
      id: 'role-1',
      name: 'Test Role',
      description: 'Test role description',
      isDefault: false,
      journey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    healthMetricType: {
      id: 'metric-type-1',
      name: 'HEART_RATE',
      unit: 'bpm',
      normalRangeMin: 60,
      normalRangeMax: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    healthMetric: {
      id: 'metric-1',
      userId: 'user-1',
      typeId: 'metric-type-1',
      value: 75,
      timestamp: new Date(),
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    healthGoal: {
      id: 'goal-1',
      userId: 'user-1',
      metricTypeId: 'metric-type-1',
      targetValue: 10000,
      currentValue: 5000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'IN_PROGRESS',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    deviceType: {
      id: 'device-type-1',
      name: 'Smartwatch',
      description: 'Wearable smartwatch device',
      manufacturer: 'Test Manufacturer',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    deviceConnection: {
      id: 'device-connection-1',
      userId: 'user-1',
      deviceTypeId: 'device-type-1',
      externalId: 'external-device-id',
      status: 'CONNECTED',
      lastSyncDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    providerSpecialty: {
      id: 'specialty-1',
      name: 'Cardiologia',
      description: 'Especialista em coração e sistema cardiovascular',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    provider: {
      id: 'provider-1',
      name: 'Dr. Test Provider',
      specialtyId: 'specialty-1',
      crm: '12345/SP',
      email: 'provider@example.com',
      phone: '+5511888888888',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    appointment: {
      id: 'appointment-1',
      userId: 'user-1',
      providerId: 'provider-1',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      status: 'SCHEDULED',
      type: 'IN_PERSON',
      notes: 'Test appointment notes',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    insurancePlanType: {
      id: 'plan-type-1',
      name: 'Básico',
      description: 'Plano com cobertura básica',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    insurancePlan: {
      id: 'plan-1',
      userId: 'user-1',
      typeId: 'plan-type-1',
      number: 'PLAN123456',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    claimType: {
      id: 'claim-type-1',
      name: 'Consulta Médica',
      description: 'Reembolso para consulta médica',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    claim: {
      id: 'claim-1',
      userId: 'user-1',
      planId: 'plan-1',
      typeId: 'claim-type-1',
      amount: 150.0,
      date: new Date(),
      status: 'PENDING',
      receiptUrl: 'https://example.com/receipt.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    achievementType: {
      id: 'achievement-type-1',
      name: 'health-check-streak',
      title: 'Monitor de Saúde',
      description: 'Registre suas métricas de saúde por dias consecutivos',
      journey: 'health',
      icon: 'heart-pulse',
      levels: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    achievement: {
      id: 'achievement-1',
      userId: 'user-1',
      typeId: 'achievement-type-1',
      level: 1,
      progress: 100,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    gamificationProfile: {
      id: 'profile-1',
      userId: 'user-1',
      level: 5,
      xp: 1250,
      streakDays: 7,
      lastActivityDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    quest: {
      id: 'quest-1',
      title: 'Complete 3 health checks',
      description: 'Record your health metrics for 3 consecutive days',
      journey: 'health',
      requiredActions: 3,
      completedActions: 0,
      xpReward: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    reward: {
      id: 'reward-1',
      userId: 'user-1',
      title: 'Discount Coupon',
      description: '10% discount on next appointment',
      type: 'COUPON',
      value: '10%',
      code: 'REWARD123',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    event: {
      id: 'event-1',
      userId: 'user-1',
      type: 'HEALTH_METRIC_RECORDED',
      journey: 'health',
      payload: JSON.stringify({ metricType: 'HEART_RATE', value: 75 }),
      timestamp: new Date(),
      processed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
  
  // Get default mock data for the model or use an empty object if not found
  const defaultData = mockDataMap[modelName] || {};
  
  // Merge default data with overrides
  return { ...defaultData, ...overrides } as T;
}

/**
 * Sets up mock responses for specific model operations
 * 
 * @param mockClient - The mock Prisma client to configure
 * @param modelName - The name of the model to configure
 * @param operations - Configuration for each operation
 */
export function setupMockResponses<T>(
  mockClient: MockPrismaClient,
  modelName: string,
  operations: {
    findUnique?: T | null | Error;
    findFirst?: T | null | Error;
    findMany?: T[] | Error;
    create?: T | Error;
    createMany?: { count: number } | Error;
    update?: T | Error;
    updateMany?: { count: number } | Error;
    upsert?: T | Error;
    delete?: T | Error;
    deleteMany?: { count: number } | Error;
    count?: number | Error;
    aggregate?: any | Error;
    groupBy?: any | Error;
  }
): void {
  const model = mockClient[modelName as keyof MockPrismaClient] as any;
  
  if (!model) {
    throw new Error(`Model ${modelName} not found in mock client`);
  }
  
  // Configure each operation
  Object.entries(operations).forEach(([operation, response]) => {
    if (!(operation in model)) {
      throw new Error(`Operation ${operation} not found in model ${modelName}`);
    }
    
    if (response instanceof Error) {
      model[operation].mockRejectedValue(response);
    } else {
      model[operation].mockResolvedValue(response);
    }
  });
}

/**
 * Utility function to reset all mocks in a mock Prisma client
 * 
 * @param mockClient - The mock Prisma client to reset
 */
export function resetMockPrismaClient(mockClient: MockPrismaClient): void {
  // Reset client methods
  mockClient.$connect.mockReset();
  mockClient.$disconnect.mockReset();
  mockClient.$extends.mockReset();
  mockClient.$on.mockReset();
  mockClient.$use.mockReset();
  mockClient.$transaction.mockReset();
  mockClient.$queryRaw.mockReset();
  mockClient.$executeRaw.mockReset();
  mockClient.$queryRawUnsafe.mockReset();
  mockClient.$executeRawUnsafe.mockReset();
  
  // Reset model methods
  Object.keys(mockClient).forEach((key) => {
    const value = mockClient[key as keyof MockPrismaClient];
    if (value && typeof value === 'object') {
      Object.keys(value).forEach((methodName) => {
        const method = value[methodName as keyof typeof value];
        if (typeof method === 'function' && typeof method.mockReset === 'function') {
          method.mockReset();
        }
      });
    }
  });
  
  // Re-implement transaction method
  mockClient.$transaction.mockImplementation(async (arg) => {
    if (typeof arg === 'function') {
      return await arg(mockClient);
    }
    if (Array.isArray(arg)) {
      return await Promise.all(arg);
    }
    return null;
  });
}

/**
 * Creates multiple mock data items for a specific model
 * 
 * @param modelName - The name of the model to create mock data for
 * @param count - Number of mock data items to create
 * @param overridesFn - Optional function to generate custom overrides for each item
 * @param journeyContext - Optional journey context to use for generating journey-specific data
 * @returns Array of mock data items for the specified model
 */
export function createMockDataBatch<T>(
  modelName: string,
  count: number,
  overridesFn?: (index: number) => Partial<T>,
  journeyContext?: 'health' | 'care' | 'plan' | null
): T[] {
  return Array.from({ length: count }, (_, index) => {
    const overrides = overridesFn ? overridesFn(index) : {};
    return createMockData<T>(modelName, overrides, journeyContext);
  });
}

/**
 * Creates a mock Prisma client instance
 */
export const mockPrismaClient = createMockPrismaClient();