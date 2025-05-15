import { v4 as uuidv4 } from 'uuid';

/**
 * Journey types supported by the AUSTA SuperApp.
 * These match the JourneyType enum in the main application.
 */
enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Base interface for all logging contexts.
 * This is a simplified version of the LoggingContext interface for testing purposes.
 */
interface LoggingContext {
  correlationId?: string;
  timestamp?: string;
  service?: string;
  environment?: string;
  [key: string]: any;
}

/**
 * Interface representing a journey context for logging.
 * This is a simplified version of the JourneyContext interface for testing purposes.
 */
interface JourneyContext extends LoggingContext {
  journeyType: JourneyType;
  journeyId?: string;
  journeyState?: any;
  userId?: string;
  sessionId?: string;
}

/**
 * Interface for user information to be included in journey contexts.
 */
interface UserInfo {
  userId: string;
  username?: string;
  roles?: string[];
  [key: string]: any;
}

/**
 * Options for creating a journey context.
 */
interface JourneyContextOptions {
  journeyId?: string;
  correlationId?: string;
  sessionId?: string;
  userInfo?: UserInfo;
  journeyState?: any;
  additionalContext?: Record<string, any>;
}

/**
 * Creates a generic journey context with the specified journey type and options.
 * 
 * @param journeyType - The type of journey (Health, Care, Plan)
 * @param options - Additional options for the journey context
 * @returns A journey context object for testing
 */
export function createGenericJourneyContext(
  journeyType: JourneyType,
  options: JourneyContextOptions = {}
): JourneyContext {
  const {
    journeyId = uuidv4(),
    correlationId = uuidv4(),
    sessionId = uuidv4(),
    userInfo,
    journeyState,
    additionalContext = {},
  } = options;

  const context: JourneyContext = {
    journeyType,
    journeyId,
    correlationId,
    sessionId,
    timestamp: new Date().toISOString(),
    service: 'test-service',
    environment: 'test',
    ...additionalContext,
  };

  if (userInfo) {
    context.userId = userInfo.userId;
    context.username = userInfo.username;
    context.userRoles = userInfo.roles;
    
    // Add any additional user properties
    Object.entries(userInfo)
      .filter(([key]) => !['userId', 'username', 'roles'].includes(key))
      .forEach(([key, value]) => {
        context[`user${key.charAt(0).toUpperCase()}${key.slice(1)}`] = value;
      });
  }

  if (journeyState) {
    context.journeyState = journeyState;
  }

  return context;
}

/**
 * Creates a Health journey context for testing.
 * 
 * @param options - Additional options for the journey context
 * @returns A Health journey context object
 */
export function createHealthJourneyContext(options: JourneyContextOptions = {}): JourneyContext {
  const healthState = options.journeyState || generateHealthJourneyState();
  return createGenericJourneyContext(JourneyType.HEALTH, {
    ...options,
    journeyState: healthState,
  });
}

/**
 * Creates a Care journey context for testing.
 * 
 * @param options - Additional options for the journey context
 * @returns A Care journey context object
 */
export function createCareJourneyContext(options: JourneyContextOptions = {}): JourneyContext {
  const careState = options.journeyState || generateCareJourneyState();
  return createGenericJourneyContext(JourneyType.CARE, {
    ...options,
    journeyState: careState,
  });
}

/**
 * Creates a Plan journey context for testing.
 * 
 * @param options - Additional options for the journey context
 * @returns A Plan journey context object
 */
export function createPlanJourneyContext(options: JourneyContextOptions = {}): JourneyContext {
  const planState = options.journeyState || generatePlanJourneyState();
  return createGenericJourneyContext(JourneyType.PLAN, {
    ...options,
    journeyState: planState,
  });
}

/**
 * Generates a mock user for testing journey contexts.
 * 
 * @param overrides - Optional properties to override in the generated user
 * @returns A user info object
 */
export function generateMockUser(overrides: Partial<UserInfo> = {}): UserInfo {
  return {
    userId: uuidv4(),
    username: `user_${Math.floor(Math.random() * 10000)}`,
    roles: ['user'],
    ...overrides,
  };
}

/**
 * Generates mock Health journey state for testing.
 * 
 * @returns A mock Health journey state object
 */
export function generateHealthJourneyState(): Record<string, any> {
  return {
    currentMetrics: {
      steps: Math.floor(Math.random() * 10000),
      heartRate: 60 + Math.floor(Math.random() * 40),
      sleepHours: 5 + Math.floor(Math.random() * 4),
    },
    activeGoals: [
      { id: uuidv4(), type: 'steps', target: 10000, progress: 0.7 },
      { id: uuidv4(), type: 'sleep', target: 8, progress: 0.6 },
    ],
    connectedDevices: [
      { id: uuidv4(), type: 'fitbit', lastSync: new Date().toISOString() },
    ],
  };
}

/**
 * Generates mock Care journey state for testing.
 * 
 * @returns A mock Care journey state object
 */
export function generateCareJourneyState(): Record<string, any> {
  return {
    appointments: [
      {
        id: uuidv4(),
        providerId: uuidv4(),
        date: new Date(Date.now() + 86400000 * 3).toISOString(),
        status: 'scheduled',
      },
    ],
    medications: [
      {
        id: uuidv4(),
        name: 'Test Medication',
        dosage: '10mg',
        schedule: 'daily',
        adherence: 0.9,
      },
    ],
    recentSymptoms: [
      { id: uuidv4(), name: 'headache', severity: 3, reported: new Date().toISOString() },
    ],
  };
}

/**
 * Generates mock Plan journey state for testing.
 * 
 * @returns A mock Plan journey state object
 */
export function generatePlanJourneyState(): Record<string, any> {
  return {
    activePlan: {
      id: uuidv4(),
      name: 'Premium Health Plan',
      coverage: 0.8,
      startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 335).toISOString(),
    },
    claims: [
      {
        id: uuidv4(),
        amount: 120.50,
        status: 'processing',
        submittedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
    benefits: [
      { id: uuidv4(), type: 'dental', used: 250, limit: 1000 },
      { id: uuidv4(), type: 'vision', used: 0, limit: 500 },
    ],
  };
}

/**
 * Verifies that a log object contains the expected journey context information.
 * 
 * @param log - The log object to verify
 * @param expectedJourneyType - The expected journey type
 * @param additionalChecks - Optional function to perform additional verification
 * @returns True if the log contains valid journey context, false otherwise
 */
export function verifyJourneyContext(
  log: Record<string, any>,
  expectedJourneyType: JourneyType,
  additionalChecks?: (log: Record<string, any>) => boolean
): boolean {
  // Basic journey context checks
  const hasBasicContext = (
    log.journeyType === expectedJourneyType &&
    typeof log.journeyId === 'string' &&
    typeof log.correlationId === 'string'
  );

  if (!hasBasicContext) {
    return false;
  }

  // Journey state checks based on journey type
  const hasJourneyState = log.journeyState !== undefined;
  
  if (!hasJourneyState) {
    return false;
  }

  // Run additional checks if provided
  if (additionalChecks) {
    return additionalChecks(log);
  }

  return true;
}

/**
 * Creates a journey context with random data for the specified journey type.
 * Useful for quick testing without needing to specify all options.
 * 
 * @param journeyType - The type of journey to create a context for
 * @returns A journey context with random data
 */
export function createRandomJourneyContext(journeyType: JourneyType): JourneyContext {
  const user = generateMockUser();
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      return createHealthJourneyContext({ userInfo: user });
    case JourneyType.CARE:
      return createCareJourneyContext({ userInfo: user });
    case JourneyType.PLAN:
      return createPlanJourneyContext({ userInfo: user });
    default:
      return createGenericJourneyContext(journeyType as JourneyType, { userInfo: user });
  }
}

/**
 * Extracts journey context from a log object.
 * 
 * @param log - The log object to extract journey context from
 * @returns The extracted journey context or null if not found
 */
export function extractJourneyContext(log: Record<string, any>): JourneyContext | null {
  if (!log.journeyType || !log.journeyId) {
    return null;
  }

  const journeyContext: JourneyContext = {
    journeyType: log.journeyType as JourneyType,
    journeyId: log.journeyId,
    correlationId: log.correlationId,
    sessionId: log.sessionId,
    userId: log.userId,
    timestamp: log.timestamp,
    service: log.service,
    environment: log.environment,
  };

  if (log.journeyState) {
    journeyContext.journeyState = log.journeyState;
  }

  return journeyContext;
}

/**
 * Merges multiple journey contexts, with later contexts overriding earlier ones.
 * Useful for testing scenarios where context is built up across multiple services.
 * 
 * @param contexts - The journey contexts to merge
 * @returns A merged journey context
 */
export function mergeJourneyContexts(...contexts: JourneyContext[]): JourneyContext {
  if (contexts.length === 0) {
    throw new Error('At least one context must be provided');
  }

  // Start with the first context as the base
  const result = { ...contexts[0] };
  
  // Merge in subsequent contexts
  for (let i = 1; i < contexts.length; i++) {
    const context = contexts[i];
    
    // Merge regular properties
    Object.entries(context).forEach(([key, value]) => {
      if (key !== 'journeyState') {
        result[key] = value;
      }
    });
    
    // Special handling for journeyState to do a deep merge
    if (context.journeyState) {
      result.journeyState = result.journeyState 
        ? { ...result.journeyState, ...context.journeyState }
        : { ...context.journeyState };
    }
  }
  
  return result;
}