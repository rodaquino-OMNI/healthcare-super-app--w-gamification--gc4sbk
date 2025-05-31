/**
 * Integration test setup file for the @austa/utils package
 * 
 * This file extends the global test setup with integration-specific configurations:
 * - Sets up realistic HTTP request mocking for external service integration
 * - Initializes timezone and locale settings for consistent date testing
 * - Establishes mock validation contexts for different journey scenarios
 * - Configures database mocks for integration testing
 * - Sets up environment variables specific to integration tests
 */

import axios from 'axios';
import * as dateFns from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { setDefaultOptions } from 'date-fns';
import nock from 'nock';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Import the global test setup to extend it
import '../setup-tests';

// Configure date-fns default options for integration tests
setDefaultOptions({
  locale: ptBR, // Default locale for AUSTA app is Brazilian Portuguese
  weekStartsOn: 0, // Sunday as first day of week for Brazilian context
});

// Fixed test date for integration tests (matches global setup)
const INTEGRATION_TEST_DATE = new Date('2025-05-23T12:00:00Z');

// Mock Date constructor for consistent date testing
const RealDate = global.Date;
global.Date = class extends RealDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      return new RealDate(INTEGRATION_TEST_DATE);
    }
    return new RealDate(...args);
  }
  
  static now() {
    return INTEGRATION_TEST_DATE.getTime();
  }
};

// Configure nock for HTTP request mocking
nock.disableNetConnect(); // Prevent real network requests during tests
nock.enableNetConnect('127.0.0.1'); // Allow localhost connections for local testing

// Load mock response data for journey services
const mockResponsesPath = resolve(__dirname, '../fixtures');

// Helper function to load mock data
const loadMockData = (journey: string, endpoint: string) => {
  try {
    const filePath = resolve(mockResponsesPath, journey, `${endpoint}.json`);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.warn(`Mock data not found for ${journey}/${endpoint}. Using empty object.`);
    return {};
  }
};

// Set up mock journey API endpoints
const setupJourneyMocks = () => {
  // Health journey mocks
  nock('https://health-api.test.austa.local')
    .persist()
    .get('/metrics')
    .reply(200, loadMockData('health', 'metrics'))
    .get('/goals')
    .reply(200, loadMockData('health', 'goals'))
    .get('/devices')
    .reply(200, loadMockData('health', 'devices'));

  // Care journey mocks
  nock('https://care-api.test.austa.local')
    .persist()
    .get('/appointments')
    .reply(200, loadMockData('care', 'appointments'))
    .get('/providers')
    .reply(200, loadMockData('care', 'providers'))
    .get('/medications')
    .reply(200, loadMockData('care', 'medications'));

  // Plan journey mocks
  nock('https://plan-api.test.austa.local')
    .persist()
    .get('/benefits')
    .reply(200, loadMockData('plan', 'benefits'))
    .get('/claims')
    .reply(200, loadMockData('plan', 'claims'))
    .get('/coverage')
    .reply(200, loadMockData('plan', 'coverage'));
};

// Set up mock validation contexts for different journeys
const setupValidationContexts = () => {
  // Define journey-specific validation contexts
  global.__TEST_VALIDATION_CONTEXTS__ = {
    health: {
      // Health journey validation context
      metricTypes: ['WEIGHT', 'BLOOD_PRESSURE', 'GLUCOSE', 'HEART_RATE', 'STEPS', 'SLEEP'],
      goalTypes: ['DAILY', 'WEEKLY', 'MONTHLY'],
      deviceTypes: ['SMARTWATCH', 'SCALE', 'BLOOD_PRESSURE_MONITOR', 'GLUCOSE_METER'],
      measurementUnits: {
        WEIGHT: 'kg',
        BLOOD_PRESSURE: 'mmHg',
        GLUCOSE: 'mg/dL',
        HEART_RATE: 'bpm',
        STEPS: 'count',
        SLEEP: 'hours'
      }
    },
    care: {
      // Care journey validation context
      appointmentTypes: ['ROUTINE', 'FOLLOW_UP', 'EMERGENCY', 'TELEMEDICINE'],
      specialties: ['GENERAL_PRACTITIONER', 'CARDIOLOGIST', 'DERMATOLOGIST', 'NEUROLOGIST', 'ORTHOPEDIST'],
      medicationFrequencies: ['DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'WEEKLY', 'MONTHLY'],
      medicationUnits: ['MG', 'ML', 'G', 'MCG']
    },
    plan: {
      // Plan journey validation context
      planTypes: ['BASIC', 'STANDARD', 'PREMIUM', 'FAMILY'],
      coverageTypes: ['CONSULTATION', 'EXAM', 'HOSPITALIZATION', 'SURGERY', 'THERAPY'],
      claimStatus: ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PENDING_INFORMATION'],
      documentTypes: ['RECEIPT', 'MEDICAL_REPORT', 'PRESCRIPTION', 'EXAM_RESULT']
    },
    gamification: {
      // Gamification validation context
      achievementTypes: ['STREAK', 'MILESTONE', 'CHALLENGE', 'QUEST'],
      rewardTypes: ['POINTS', 'BADGE', 'DISCOUNT', 'PREMIUM_CONTENT'],
      eventTypes: ['HEALTH_METRIC_RECORDED', 'APPOINTMENT_COMPLETED', 'MEDICATION_TAKEN', 'GOAL_ACHIEVED']
    }
  };
};

// Set up database mocks for integration testing
const setupDatabaseMocks = () => {
  // Mock database client for integration tests
  jest.mock('@austa/database', () => {
    const actual = jest.requireActual('@austa/database');
    return {
      ...actual,
      // Mock PrismaService with test implementations
      PrismaService: class MockPrismaService {
        // Mock database models with in-memory storage
        health = createMockDbModel('health');
        care = createMockDbModel('care');
        plan = createMockDbModel('plan');
        gamification = createMockDbModel('gamification');
        
        // Mock transaction method
        $transaction = jest.fn(async (callback) => {
          return callback(this);
        });
      }
    };
  });
};

// Helper to create mock database models with in-memory storage
const createMockDbModel = (journeyName: string) => {
  const storage = new Map();
  
  return {
    // Basic CRUD operations for mock models
    findUnique: jest.fn(async ({ where }) => {
      return storage.get(where.id) || null;
    }),
    findMany: jest.fn(async () => {
      return Array.from(storage.values());
    }),
    create: jest.fn(async ({ data }) => {
      const id = data.id || `mock-${journeyName}-${Date.now()}`;
      const record = { ...data, id };
      storage.set(id, record);
      return record;
    }),
    update: jest.fn(async ({ where, data }) => {
      const existing = storage.get(where.id);
      if (!existing) throw new Error(`Record not found: ${where.id}`);
      const updated = { ...existing, ...data };
      storage.set(where.id, updated);
      return updated;
    }),
    delete: jest.fn(async ({ where }) => {
      const existing = storage.get(where.id);
      if (!existing) throw new Error(`Record not found: ${where.id}`);
      storage.delete(where.id);
      return existing;
    }),
    // Add journey-specific mock methods as needed
  };
};

// Set up environment variables for integration tests
const setupEnvironmentVariables = () => {
  process.env = {
    ...process.env,
    // Override environment variables for integration tests
    NODE_ENV: 'test',
    TEST_MODE: 'integration',
    
    // Journey-specific API URLs
    HEALTH_JOURNEY_API_URL: 'https://health-api.test.austa.local',
    CARE_JOURNEY_API_URL: 'https://care-api.test.austa.local',
    PLAN_JOURNEY_API_URL: 'https://plan-api.test.austa.local',
    
    // Authentication variables
    AUTH_SECRET: 'integration-test-auth-secret',
    AUTH_TOKEN_EXPIRY: '1h',
    
    // Database connection variables
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_integration_db',
    
    // Feature flags
    FEATURE_GAMIFICATION: 'true',
    FEATURE_NOTIFICATIONS: 'true',
    
    // Logging
    LOG_LEVEL: 'error',
    
    // Integration test specific settings
    INTEGRATION_TEST_TIMEOUT: '30000',
    MOCK_EXTERNAL_SERVICES: 'true',
  };
};

// Initialize integration test environment
const initializeIntegrationTestEnvironment = () => {
  setupEnvironmentVariables();
  setupJourneyMocks();
  setupValidationContexts();
  setupDatabaseMocks();
  
  // Add integration-specific test data to global test data
  global.__TEST_DATA__ = {
    ...global.__TEST_DATA__,
    integration: {
      // Integration-specific test data
      mockResponses: {
        health: {
          metrics: loadMockData('health', 'metrics'),
          goals: loadMockData('health', 'goals'),
          devices: loadMockData('health', 'devices'),
        },
        care: {
          appointments: loadMockData('care', 'appointments'),
          providers: loadMockData('care', 'providers'),
          medications: loadMockData('care', 'medications'),
        },
        plan: {
          benefits: loadMockData('plan', 'benefits'),
          claims: loadMockData('plan', 'claims'),
          coverage: loadMockData('plan', 'coverage'),
        },
      },
    },
  };
};

// Extend TypeScript interfaces for integration test globals
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add integration-specific matchers if needed
      toMatchJourneySchema(journey: string, schemaName: string): R;
      toBeValidJourneyEntity(journey: string, entityType: string): R;
    }
  }
  
  // Global test data interface extension
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
      integration: {
        mockResponses: {
          health: {
            metrics: any;
            goals: any;
            devices: any;
          };
          care: {
            appointments: any;
            providers: any;
            medications: any;
          };
          plan: {
            benefits: any;
            claims: any;
            coverage: any;
          };
        };
      };
    };
    
    // Validation contexts for different journeys
    __TEST_VALIDATION_CONTEXTS__: {
      health: {
        metricTypes: string[];
        goalTypes: string[];
        deviceTypes: string[];
        measurementUnits: Record<string, string>;
      };
      care: {
        appointmentTypes: string[];
        specialties: string[];
        medicationFrequencies: string[];
        medicationUnits: string[];
      };
      plan: {
        planTypes: string[];
        coverageTypes: string[];
        claimStatus: string[];
        documentTypes: string[];
      };
      gamification: {
        achievementTypes: string[];
        rewardTypes: string[];
        eventTypes: string[];
      };
    };
  }
}

// Add integration-specific matchers
expect.extend({
  // Matcher to validate an object against a journey-specific schema
  toMatchJourneySchema(received: any, journey: string, schemaName: string) {
    // Get validation context for the specified journey
    const validationContext = global.__TEST_VALIDATION_CONTEXTS__[journey];
    if (!validationContext) {
      return {
        pass: false,
        message: () => `Unknown journey: ${journey}`,
      };
    }
    
    // Basic schema validation based on journey and schema name
    // In a real implementation, this would use Zod or another validation library
    let isValid = false;
    let validationErrors = [];
    
    switch (`${journey}.${schemaName}`) {
      case 'health.metric':
        isValid = (
          received &&
          typeof received === 'object' &&
          typeof received.userId === 'string' &&
          validationContext.metricTypes.includes(received.type) &&
          typeof received.value === 'number' &&
          typeof received.unit === 'string' &&
          received.unit === validationContext.measurementUnits[received.type] &&
          received.recordedAt instanceof Date
        );
        if (!isValid) {
          validationErrors.push('Invalid health metric format');
        }
        break;
        
      case 'care.appointment':
        isValid = (
          received &&
          typeof received === 'object' &&
          typeof received.userId === 'string' &&
          validationContext.appointmentTypes.includes(received.type) &&
          typeof received.providerId === 'string' &&
          received.scheduledAt instanceof Date
        );
        if (!isValid) {
          validationErrors.push('Invalid care appointment format');
        }
        break;
        
      case 'plan.claim':
        isValid = (
          received &&
          typeof received === 'object' &&
          typeof received.userId === 'string' &&
          typeof received.amount === 'number' &&
          validationContext.coverageTypes.includes(received.coverageType) &&
          validationContext.claimStatus.includes(received.status) &&
          received.submittedAt instanceof Date
        );
        if (!isValid) {
          validationErrors.push('Invalid plan claim format');
        }
        break;
        
      default:
        return {
          pass: false,
          message: () => `Unknown schema: ${journey}.${schemaName}`,
        };
    }
    
    return {
      pass: isValid,
      message: () => isValid
        ? `Expected object not to match ${journey}.${schemaName} schema`
        : `Expected object to match ${journey}.${schemaName} schema. Errors: ${validationErrors.join(', ')}`,
    };
  },
  
  // Matcher to validate a journey entity
  toBeValidJourneyEntity(received: any, journey: string, entityType: string) {
    // Basic entity validation
    const isValid = (
      received &&
      typeof received === 'object' &&
      typeof received.id === 'string' &&
      typeof received.createdAt === 'object' &&
      received.createdAt instanceof Date &&
      typeof received.updatedAt === 'object' &&
      received.updatedAt instanceof Date
    );
    
    return {
      pass: isValid,
      message: () => isValid
        ? `Expected object not to be a valid ${journey} ${entityType} entity`
        : `Expected object to be a valid ${journey} ${entityType} entity with id, createdAt, and updatedAt properties`,
    };
  },
});

// Setup before tests
beforeAll(() => {
  initializeIntegrationTestEnvironment();
});

// Reset mocks between tests
beforeEach(() => {
  // Reset all HTTP mocks
  nock.cleanAll();
  setupJourneyMocks();
  
  // Reset axios mock (from global setup)
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Restore Date constructor
  global.Date = RealDate;
  
  // Restore all mocks
  jest.restoreAllMocks();
  
  // Enable real network connections
  nock.enableNetConnect();
  
  // Clean up nock
  nock.restore();
});