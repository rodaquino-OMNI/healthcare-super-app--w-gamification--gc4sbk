import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../../src/errors/database-error.types';
import { QueryException, TransactionException } from '../../src/errors/database-error.exception';
import { jest } from '@jest/globals';

/**
 * Enum for transaction isolation levels
 */
enum TransactionIsolationLevel {
  ReadUncommitted = 'ReadUncommitted',
  ReadCommitted = 'ReadCommitted',
  RepeatableRead = 'RepeatableRead',
  Serializable = 'Serializable',
}

/**
 * Type for transaction options
 */
type TransactionOptions = {
  isolationLevel?: TransactionIsolationLevel;
  maxWait?: number;
  timeout?: number;
};

/**
 * Type representing a model in Prisma with all its methods
 */
type PrismaModel = {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
};

/**
 * Type for chainable query methods
 */
type ChainableMethod = {
  select: jest.Mock;
  include: jest.Mock;
  where: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  cursor: jest.Mock;
  distinct: jest.Mock;
};

/**
 * Type for a model with chainable methods
 */
type ChainablePrismaModel = PrismaModel & {
  [K in keyof PrismaModel]: jest.Mock & ChainableMethod;
};

/**
 * Creates a chainable mock method that returns itself to allow method chaining
 * 
 * @param mockFn - The base mock function
 * @returns A chainable mock function
 */
function createChainableMock(mockFn: jest.Mock): jest.Mock & ChainableMethod {
  const chainableMock = mockFn as jest.Mock & ChainableMethod;
  
  // Add chainable methods that return the mock itself
  chainableMock.select = jest.fn().mockReturnValue(chainableMock);
  chainableMock.include = jest.fn().mockReturnValue(chainableMock);
  chainableMock.where = jest.fn().mockReturnValue(chainableMock);
  chainableMock.orderBy = jest.fn().mockReturnValue(chainableMock);
  chainableMock.skip = jest.fn().mockReturnValue(chainableMock);
  chainableMock.take = jest.fn().mockReturnValue(chainableMock);
  chainableMock.cursor = jest.fn().mockReturnValue(chainableMock);
  chainableMock.distinct = jest.fn().mockReturnValue(chainableMock);
  
  return chainableMock;
}

/**
 * Creates a mock Prisma model with all standard methods
 * 
 * @returns A mock Prisma model with chainable methods
 */
function createMockPrismaModel(): ChainablePrismaModel {
  const model = {} as ChainablePrismaModel;
  
  // Create base methods
  model.findUnique = createChainableMock(jest.fn());
  model.findFirst = createChainableMock(jest.fn());
  model.findMany = createChainableMock(jest.fn());
  model.create = createChainableMock(jest.fn());
  model.createMany = createChainableMock(jest.fn());
  model.update = createChainableMock(jest.fn());
  model.updateMany = createChainableMock(jest.fn());
  model.upsert = createChainableMock(jest.fn());
  model.delete = createChainableMock(jest.fn());
  model.deleteMany = createChainableMock(jest.fn());
  model.count = createChainableMock(jest.fn());
  model.aggregate = createChainableMock(jest.fn());
  model.groupBy = createChainableMock(jest.fn());
  
  return model;
}

/**
 * Type for the mock PrismaClient with all models
 */
type MockPrismaClient = {
  [K in keyof PrismaClient]: K extends `$${string}` ? jest.Mock : ChainablePrismaModel;
} & {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $on: jest.Mock;
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
  $use: jest.Mock;
  $extends: jest.Mock;
  _activeTransaction: boolean;
  _transactionOptions: TransactionOptions | null;
  _middlewares: Array<(params: any, next: (params: any) => Promise<any>) => Promise<any>>;
  _errorSimulation: {
    enabled: boolean;
    errorType: DatabaseErrorType;
    errorMessage: string;
    errorRate: number; // 0-1 probability of error
    affectedModels: string[];
    affectedMethods: string[];
  };
};

/**
 * Creates a mock implementation of the PrismaClient
 * 
 * @returns A mock PrismaClient with all models and methods
 */
export function createMockPrismaClient(): MockPrismaClient {
  const prismaClientMock = {} as MockPrismaClient;
  
  // Add state for transaction tracking and middleware
  prismaClientMock._activeTransaction = false;
  prismaClientMock._transactionOptions = null;
  prismaClientMock._middlewares = [];
  prismaClientMock._errorSimulation = {
    enabled: false,
    errorType: DatabaseErrorType.QUERY,
    errorMessage: 'Simulated database error',
    errorRate: 0,
    affectedModels: [],
    affectedMethods: [],
  };
  
  // Mock core methods
  prismaClientMock.$connect = jest.fn().mockResolvedValue(undefined);
  prismaClientMock.$disconnect = jest.fn().mockResolvedValue(undefined);
  prismaClientMock.$on = jest.fn().mockReturnValue(undefined);
  
  // Enhanced transaction implementation with isolation level support
  prismaClientMock.$transaction = jest.fn().mockImplementation((arg, options) => {
    // Set transaction state
    prismaClientMock._activeTransaction = true;
    prismaClientMock._transactionOptions = options || null;
    
    // Simulate transaction error if configured
    if (prismaClientMock._errorSimulation.enabled && 
        Math.random() < prismaClientMock._errorSimulation.errorRate &&
        prismaClientMock._errorSimulation.affectedMethods.includes('$transaction')) {
      prismaClientMock._activeTransaction = false;
      return Promise.reject(new TransactionException(
        prismaClientMock._errorSimulation.errorMessage,
        {
          errorType: prismaClientMock._errorSimulation.errorType,
          severity: DatabaseErrorSeverity.CRITICAL,
          transactionOptions: options,
        }
      ));
    }
    
    try {
      // Handle both function-based and array-based transactions
      let result;
      if (typeof arg === 'function') {
        result = Promise.resolve(arg(prismaClientMock));
      } else {
        result = Promise.resolve(arg);
      }
      
      // Reset transaction state
      prismaClientMock._activeTransaction = false;
      return result;
    } catch (error) {
      // Reset transaction state on error
      prismaClientMock._activeTransaction = false;
      return Promise.reject(error);
    }
  });
  
  // Enhanced raw query implementation with parameter support
  prismaClientMock.$queryRaw = jest.fn().mockImplementation((query, ...params) => {
    // Simulate query error if configured
    if (prismaClientMock._errorSimulation.enabled && 
        Math.random() < prismaClientMock._errorSimulation.errorRate &&
        prismaClientMock._errorSimulation.affectedMethods.includes('$queryRaw')) {
      return Promise.reject(new QueryException(
        prismaClientMock._errorSimulation.errorMessage,
        {
          errorType: prismaClientMock._errorSimulation.errorType,
          severity: DatabaseErrorSeverity.MAJOR,
          query: String(query),
          params,
        }
      ));
    }
    
    return Promise.resolve([{ result: 1 }]);
  });
  
  // Enhanced execute raw implementation with parameter support
  prismaClientMock.$executeRaw = jest.fn().mockImplementation((query, ...params) => {
    // Simulate query error if configured
    if (prismaClientMock._errorSimulation.enabled && 
        Math.random() < prismaClientMock._errorSimulation.errorRate &&
        prismaClientMock._errorSimulation.affectedMethods.includes('$executeRaw')) {
      return Promise.reject(new QueryException(
        prismaClientMock._errorSimulation.errorMessage,
        {
          errorType: prismaClientMock._errorSimulation.errorType,
          severity: DatabaseErrorSeverity.MAJOR,
          query: String(query),
          params,
        }
      ));
    }
    
    return Promise.resolve({ count: 1 });
  });
  
  // Middleware support
  prismaClientMock.$use = jest.fn().mockImplementation((middleware) => {
    prismaClientMock._middlewares.push(middleware);
    return prismaClientMock;
  });
  
  // Extension support
  prismaClientMock.$extends = jest.fn().mockImplementation((extension) => {
    return prismaClientMock;
  });
  
  // Create mock models for all Prisma models
  // User model
  prismaClientMock.user = createMockPrismaModel();
  
  // Role and Permission models
  prismaClientMock.role = createMockPrismaModel();
  prismaClientMock.permission = createMockPrismaModel();
  
  // Health journey models
  prismaClientMock.healthMetric = createMockPrismaModel();
  prismaClientMock.healthMetricType = createMockPrismaModel();
  prismaClientMock.healthGoal = createMockPrismaModel();
  prismaClientMock.deviceConnection = createMockPrismaModel();
  prismaClientMock.deviceType = createMockPrismaModel();
  prismaClientMock.medicalEvent = createMockPrismaModel();
  
  // Care journey models
  prismaClientMock.appointment = createMockPrismaModel();
  prismaClientMock.provider = createMockPrismaModel();
  prismaClientMock.providerSpecialty = createMockPrismaModel();
  prismaClientMock.medication = createMockPrismaModel();
  prismaClientMock.treatment = createMockPrismaModel();
  prismaClientMock.telemedicineSession = createMockPrismaModel();
  
  // Plan journey models
  prismaClientMock.insurancePlan = createMockPrismaModel();
  prismaClientMock.insurancePlanType = createMockPrismaModel();
  prismaClientMock.benefit = createMockPrismaModel();
  prismaClientMock.coverage = createMockPrismaModel();
  prismaClientMock.claim = createMockPrismaModel();
  prismaClientMock.claimType = createMockPrismaModel();
  prismaClientMock.document = createMockPrismaModel();
  
  // Gamification models
  prismaClientMock.gamificationProfile = createMockPrismaModel();
  prismaClientMock.achievement = createMockPrismaModel();
  prismaClientMock.achievementType = createMockPrismaModel();
  prismaClientMock.quest = createMockPrismaModel();
  prismaClientMock.reward = createMockPrismaModel();
  prismaClientMock.rule = createMockPrismaModel();
  prismaClientMock.event = createMockPrismaModel();
  prismaClientMock.leaderboard = createMockPrismaModel();
  
  return prismaClientMock;
}

/**
 * Factory function to create mock data for specific models
 */
export const mockDataFactory = {
  /**
   * Creates mock user data
   * 
   * @param overrides - Optional overrides for the user data
   * @returns Mock user data
   */
  user: (overrides = {}) => ({
    id: 'user-id-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    phone: '+5511999999999',
    cpf: '12345678901',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock role data
   * 
   * @param overrides - Optional overrides for the role data
   * @returns Mock role data
   */
  role: (overrides = {}) => ({
    id: 'role-id-1',
    name: 'User',
    description: 'Standard user with access to all journeys',
    isDefault: true,
    journey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock permission data
   * 
   * @param overrides - Optional overrides for the permission data
   * @returns Mock permission data
   */
  permission: (overrides = {}) => ({
    id: 'permission-id-1',
    name: 'health:metrics:read',
    description: 'View health metrics',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock health metric data
   * 
   * @param overrides - Optional overrides for the health metric data
   * @returns Mock health metric data
   */
  healthMetric: (overrides = {}) => ({
    id: 'health-metric-id-1',
    userId: 'user-id-1',
    typeId: 'health-metric-type-id-1',
    value: 75,
    unit: 'bpm',
    recordedAt: new Date(),
    source: 'MANUAL',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock health metric type data
   * 
   * @param overrides - Optional overrides for the health metric type data
   * @returns Mock health metric type data
   */
  healthMetricType: (overrides = {}) => ({
    id: 'health-metric-type-id-1',
    name: 'HEART_RATE',
    unit: 'bpm',
    normalRangeMin: 60,
    normalRangeMax: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock health goal data
   * 
   * @param overrides - Optional overrides for the health goal data
   * @returns Mock health goal data
   */
  healthGoal: (overrides = {}) => ({
    id: 'health-goal-id-1',
    userId: 'user-id-1',
    metricTypeId: 'health-metric-type-id-1',
    targetValue: 10000,
    currentValue: 5000,
    unit: 'steps',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'IN_PROGRESS',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock device connection data
   * 
   * @param overrides - Optional overrides for the device connection data
   * @returns Mock device connection data
   */
  deviceConnection: (overrides = {}) => ({
    id: 'device-connection-id-1',
    userId: 'user-id-1',
    deviceTypeId: 'device-type-id-1',
    deviceIdentifier: 'device-123',
    name: 'My Smartwatch',
    status: 'CONNECTED',
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock device type data
   * 
   * @param overrides - Optional overrides for the device type data
   * @returns Mock device type data
   */
  deviceType: (overrides = {}) => ({
    id: 'device-type-id-1',
    name: 'Smartwatch',
    description: 'Wearable smartwatch device',
    manufacturer: 'Various',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock medical event data
   * 
   * @param overrides - Optional overrides for the medical event data
   * @returns Mock medical event data
   */
  medicalEvent: (overrides = {}) => ({
    id: 'medical-event-id-1',
    userId: 'user-id-1',
    type: 'APPOINTMENT',
    title: 'Doctor Visit',
    description: 'Regular check-up',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock appointment data
   * 
   * @param overrides - Optional overrides for the appointment data
   * @returns Mock appointment data
   */
  appointment: (overrides = {}) => ({
    id: 'appointment-id-1',
    userId: 'user-id-1',
    providerId: 'provider-id-1',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    duration: 30, // minutes
    status: 'SCHEDULED',
    type: 'IN_PERSON',
    notes: 'Regular check-up',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock provider data
   * 
   * @param overrides - Optional overrides for the provider data
   * @returns Mock provider data
   */
  provider: (overrides = {}) => ({
    id: 'provider-id-1',
    name: 'Dr. Test Provider',
    specialtyId: 'specialty-id-1',
    licenseNumber: 'CRM-12345',
    email: 'doctor@example.com',
    phone: '+5511888888888',
    address: 'Av. Paulista, 1000',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock provider specialty data
   * 
   * @param overrides - Optional overrides for the provider specialty data
   * @returns Mock provider specialty data
   */
  providerSpecialty: (overrides = {}) => ({
    id: 'specialty-id-1',
    name: 'Cardiologia',
    description: 'Especialista em coração e sistema cardiovascular',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock medication data
   * 
   * @param overrides - Optional overrides for the medication data
   * @returns Mock medication data
   */
  medication: (overrides = {}) => ({
    id: 'medication-id-1',
    userId: 'user-id-1',
    name: 'Test Medication',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'ACTIVE',
    notes: 'Take with food',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock treatment data
   * 
   * @param overrides - Optional overrides for the treatment data
   * @returns Mock treatment data
   */
  treatment: (overrides = {}) => ({
    id: 'treatment-id-1',
    userId: 'user-id-1',
    providerId: 'provider-id-1',
    name: 'Test Treatment',
    description: 'Treatment for test condition',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock telemedicine session data
   * 
   * @param overrides - Optional overrides for the telemedicine session data
   * @returns Mock telemedicine session data
   */
  telemedicineSession: (overrides = {}) => ({
    id: 'telemedicine-session-id-1',
    userId: 'user-id-1',
    providerId: 'provider-id-1',
    appointmentId: 'appointment-id-1',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    duration: 30, // minutes
    status: 'SCHEDULED',
    sessionUrl: 'https://meet.example.com/session-123',
    notes: 'Virtual consultation',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock insurance plan data
   * 
   * @param overrides - Optional overrides for the insurance plan data
   * @returns Mock insurance plan data
   */
  insurancePlan: (overrides = {}) => ({
    id: 'insurance-plan-id-1',
    userId: 'user-id-1',
    typeId: 'plan-type-id-1',
    planNumber: 'PLAN-12345',
    provider: 'AUSTA Sau00fade',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock insurance plan type data
   * 
   * @param overrides - Optional overrides for the insurance plan type data
   * @returns Mock insurance plan type data
   */
  insurancePlanType: (overrides = {}) => ({
    id: 'plan-type-id-1',
    name: 'Bu00e1sico',
    description: 'Plano com cobertura bu00e1sica',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock benefit data
   * 
   * @param overrides - Optional overrides for the benefit data
   * @returns Mock benefit data
   */
  benefit: (overrides = {}) => ({
    id: 'benefit-id-1',
    planTypeId: 'plan-type-id-1',
    name: 'Consultas Mu00e9dicas',
    description: 'Cobertura para consultas mu00e9dicas',
    coveragePercentage: 80,
    annualLimit: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock coverage data
   * 
   * @param overrides - Optional overrides for the coverage data
   * @returns Mock coverage data
   */
  coverage: (overrides = {}) => ({
    id: 'coverage-id-1',
    planId: 'insurance-plan-id-1',
    benefitId: 'benefit-id-1',
    coveragePercentage: 80,
    annualLimit: 12,
    usedCount: 2,
    remainingCount: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock claim data
   * 
   * @param overrides - Optional overrides for the claim data
   * @returns Mock claim data
   */
  claim: (overrides = {}) => ({
    id: 'claim-id-1',
    userId: 'user-id-1',
    planId: 'insurance-plan-id-1',
    typeId: 'claim-type-id-1',
    amount: 150.0,
    currency: 'BRL',
    serviceDate: new Date(),
    submissionDate: new Date(),
    status: 'SUBMITTED',
    providerName: 'Dr. Test Provider',
    description: 'Consulta médica',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock claim type data
   * 
   * @param overrides - Optional overrides for the claim type data
   * @returns Mock claim type data
   */
  claimType: (overrides = {}) => ({
    id: 'claim-type-id-1',
    name: 'Consulta Médica',
    description: 'Reembolso para consulta médica',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock document data
   * 
   * @param overrides - Optional overrides for the document data
   * @returns Mock document data
   */
  document: (overrides = {}) => ({
    id: 'document-id-1',
    userId: 'user-id-1',
    claimId: 'claim-id-1',
    type: 'RECEIPT',
    filename: 'receipt.pdf',
    fileUrl: 'https://storage.example.com/documents/receipt.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024, // 1MB
    uploadedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock gamification profile data
   * 
   * @param overrides - Optional overrides for the gamification profile data
   * @returns Mock gamification profile data
   */
  gamificationProfile: (overrides = {}) => ({
    id: 'gamification-profile-id-1',
    userId: 'user-id-1',
    level: 5,
    xp: 1250,
    xpToNextLevel: 500,
    streakDays: 7,
    lastActivityAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock achievement data
   * 
   * @param overrides - Optional overrides for the achievement data
   * @returns Mock achievement data
   */
  achievement: (overrides = {}) => ({
    id: 'achievement-id-1',
    userId: 'user-id-1',
    typeId: 'achievement-type-id-1',
    level: 1,
    progress: 100,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock achievement type data
   * 
   * @param overrides - Optional overrides for the achievement type data
   * @returns Mock achievement type data
   */
  achievementType: (overrides = {}) => ({
    id: 'achievement-type-id-1',
    name: 'health-check-streak',
    title: 'Monitor de Saúde',
    description: 'Registre suas métricas de saúde por dias consecutivos',
    journey: 'health',
    icon: 'heart-pulse',
    levels: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock quest data
   * 
   * @param overrides - Optional overrides for the quest data
   * @returns Mock quest data
   */
  quest: (overrides = {}) => ({
    id: 'quest-id-1',
    userId: 'user-id-1',
    title: 'Semana Saudável',
    description: 'Complete todas as tarefas de saúde por uma semana',
    journey: 'health',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    progress: 50,
    status: 'IN_PROGRESS',
    xpReward: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock reward data
   * 
   * @param overrides - Optional overrides for the reward data
   * @returns Mock reward data
   */
  reward: (overrides = {}) => ({
    id: 'reward-id-1',
    userId: 'user-id-1',
    title: 'Desconto em Consulta',
    description: '10% de desconto em consulta médica',
    type: 'DISCOUNT',
    value: 10,
    code: 'REWARD-123',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock rule data
   * 
   * @param overrides - Optional overrides for the rule data
   * @returns Mock rule data
   */
  rule: (overrides = {}) => ({
    id: 'rule-id-1',
    name: 'health-metric-recorded',
    description: 'Rule for health metric recording',
    eventType: 'HEALTH_METRIC_RECORDED',
    journey: 'health',
    condition: JSON.stringify({
      operator: 'AND',
      conditions: [
        { field: 'metricType', operator: 'EQUALS', value: 'HEART_RATE' },
        { field: 'value', operator: 'GREATER_THAN', value: 60 },
      ],
    }),
    action: JSON.stringify({
      type: 'AWARD_XP',
      value: 10,
    }),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock event data
   * 
   * @param overrides - Optional overrides for the event data
   * @returns Mock event data
   */
  event: (overrides = {}) => ({
    id: 'event-id-1',
    userId: 'user-id-1',
    type: 'HEALTH_METRIC_RECORDED',
    journey: 'health',
    payload: JSON.stringify({
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
    }),
    processedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Creates mock leaderboard data
   * 
   * @param overrides - Optional overrides for the leaderboard data
   * @returns Mock leaderboard data
   */
  leaderboard: (overrides = {}) => ({
    id: 'leaderboard-id-1',
    name: 'Weekly XP Leaders',
    type: 'XP',
    period: 'WEEKLY',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

/**
 * Creates a mock PrismaClient instance with pre-configured mock data
 * 
 * @param mockData - Optional mock data to pre-configure the client with
 * @returns A mock PrismaClient instance
 */
export function createMockPrismaClientWithData(mockData: Record<string, any[]> = {}): MockPrismaClient {
  const mockClient = createMockPrismaClient();
  
  // Configure mock data for each model
  Object.entries(mockData).forEach(([modelName, data]) => {
    if (modelName in mockClient) {
      const model = mockClient[modelName as keyof typeof mockClient] as ChainablePrismaModel;
      
      // Configure findMany to return the mock data
      model.findMany.mockResolvedValue(data);
      
      // Configure findUnique and findFirst to return the first item or null
      model.findUnique.mockImplementation(({ where }) => {
        const item = data.find(d => {
          return Object.entries(where).every(([key, value]) => d[key] === value);
        });
        return Promise.resolve(item || null);
      });
      
      model.findFirst.mockImplementation(({ where }) => {
        const item = data.find(d => {
          return Object.entries(where).every(([key, value]) => d[key] === value);
        });
        return Promise.resolve(item || null);
      });
      
      // Configure count to return the length of the data array
      model.count.mockResolvedValue(data.length);
      
      // Configure create to add a new item to the data array
      model.create.mockImplementation(({ data: itemData }) => {
        const newItem = {
          id: `${modelName}-id-${data.length + 1}`,
          ...itemData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        data.push(newItem);
        return Promise.resolve(newItem);
      });
      
      // Configure update to modify an existing item
      model.update.mockImplementation(({ where, data: updateData }) => {
        const index = data.findIndex(d => {
          return Object.entries(where).every(([key, value]) => d[key] === value);
        });
        
        if (index === -1) {
          return Promise.reject(new Error(`Record to update not found.`));
        }
        
        const updatedItem = {
          ...data[index],
          ...updateData,
          updatedAt: new Date(),
        };
        
        data[index] = updatedItem;
        return Promise.resolve(updatedItem);
      });
      
      // Configure delete to remove an item
      model.delete.mockImplementation(({ where }) => {
        const index = data.findIndex(d => {
          return Object.entries(where).every(([key, value]) => d[key] === value);
        });
        
        if (index === -1) {
          return Promise.reject(new Error(`Record to delete not found.`));
        }
        
        const deletedItem = data[index];
        data.splice(index, 1);
        return Promise.resolve(deletedItem);
      });
    }
  });
  
  return mockClient;
}

/**
 * Configures error simulation for a mock PrismaClient
 * 
 * @param mockClient - The mock PrismaClient to configure
 * @param options - Error simulation options
 */
export function configureErrorSimulation(mockClient: MockPrismaClient, options: {
  enabled: boolean;
  errorType?: DatabaseErrorType;
  errorMessage?: string;
  errorRate?: number;
  affectedModels?: string[];
  affectedMethods?: string[];
}): void {
  mockClient._errorSimulation = {
    enabled: options.enabled,
    errorType: options.errorType || DatabaseErrorType.QUERY,
    errorMessage: options.errorMessage || 'Simulated database error',
    errorRate: options.errorRate || 1.0, // Default to 100% error rate
    affectedModels: options.affectedModels || [],
    affectedMethods: options.affectedMethods || [
      'findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete',
      '$queryRaw', '$executeRaw', '$transaction',
    ],
  };
  
  // Apply error simulation to affected models
  if (options.enabled && options.affectedModels && options.affectedModels.length > 0) {
    options.affectedModels.forEach(modelName => {
      if (modelName in mockClient) {
        const model = mockClient[modelName as keyof typeof mockClient] as ChainablePrismaModel;
        
        // Apply error simulation to each affected method
        mockClient._errorSimulation.affectedMethods.forEach(methodName => {
          if (methodName in model) {
            const originalMethod = model[methodName as keyof PrismaModel];
            
            model[methodName as keyof PrismaModel].mockImplementation((...args: any[]) => {
              if (Math.random() < mockClient._errorSimulation.errorRate) {
                return Promise.reject(new QueryException(
                  mockClient._errorSimulation.errorMessage,
                  {
                    errorType: mockClient._errorSimulation.errorType,
                    severity: DatabaseErrorSeverity.MAJOR,
                    model: modelName,
                    method: methodName,
                    args,
                  }
                ));
              }
              
              return originalMethod.mockImplementation(...args);
            });
          }
        });
      }
    });
  }
}

/**
 * Mock implementation of the Prisma Client for testing
 */
export const mockPrismaClient = createMockPrismaClient();