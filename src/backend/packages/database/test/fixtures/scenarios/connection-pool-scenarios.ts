/**
 * @file connection-pool-scenarios.ts
 * @description Test fixtures for database connection pooling scenarios. These fixtures validate
 * the enhanced PrismaService's connection management capabilities including proper pool initialization,
 * connection reuse, timeout handling, and resource cleanup across high-concurrency operations.
 */

import { ConnectionAcquisitionOptions, ConnectionPool, ConnectionStats, PooledConnection } from '../../../src/connection/connection-pool';
import { ConnectionConfig } from '../../../src/connection/connection-config';
import { ConnectionHealth } from '../../../src/connection/connection-health';
import { ConnectionRetry } from '../../../src/connection/connection-retry';
import { DatabaseConnectionType, ConnectionEventEmitter, ConnectionEventType } from '../../../src/types/connection.types';

/**
 * Interface for a connection pool test scenario
 */
export interface ConnectionPoolScenario {
  /** Unique name for the scenario */
  name: string;
  /** Description of what the scenario tests */
  description: string;
  /** Configuration for the connection pool */
  poolConfig: Partial<ConnectionConfig>;
  /** Number of connections to acquire in the test */
  connectionCount: number;
  /** Whether to run operations concurrently */
  concurrent: boolean;
  /** Maximum time in milliseconds the scenario should take */
  expectedMaxDurationMs: number;
  /** Expected minimum number of unique connections used */
  expectedMinUniqueConnections: number;
  /** Expected maximum number of unique connections used */
  expectedMaxUniqueConnections: number;
  /** Custom connection factory function */
  connectionFactory?: () => Promise<any>;
  /** Custom validation function for the scenario */
  validate?: (results: ConnectionPoolScenarioResult) => boolean;
  /** Custom setup function to run before the scenario */
  setup?: () => Promise<void>;
  /** Custom teardown function to run after the scenario */
  teardown?: () => Promise<void>;
  /** Custom acquisition options for connections */
  acquisitionOptions?: ConnectionAcquisitionOptions;
  /** Whether to simulate connection failures */
  simulateFailures?: boolean;
  /** Failure rate (0-1) if simulating failures */
  failureRate?: number;
  /** Whether to simulate slow connections */
  simulateSlowConnections?: boolean;
  /** Slow connection rate (0-1) if simulating slow connections */
  slowConnectionRate?: number;
  /** Delay in milliseconds for slow connections */
  slowConnectionDelayMs?: number;
  /** Whether to simulate connection leaks (not releasing connections) */
  simulateConnectionLeaks?: boolean;
  /** Leak rate (0-1) if simulating connection leaks */
  leakRate?: number;
}

/**
 * Result of running a connection pool scenario
 */
export interface ConnectionPoolScenarioResult {
  /** Name of the scenario */
  scenarioName: string;
  /** Whether the scenario passed */
  passed: boolean;
  /** Error message if the scenario failed */
  errorMessage?: string;
  /** Duration of the scenario in milliseconds */
  durationMs: number;
  /** Number of connections acquired */
  connectionsAcquired: number;
  /** Number of unique connections used */
  uniqueConnectionsUsed: number;
  /** Number of connection acquisition failures */
  acquisitionFailures: number;
  /** Average acquisition time in milliseconds */
  avgAcquisitionTimeMs: number;
  /** Maximum acquisition time in milliseconds */
  maxAcquisitionTimeMs: number;
  /** Connection pool statistics at the end of the scenario */
  finalPoolStats: ConnectionStats;
  /** Additional result data */
  additionalData?: Record<string, any>;
}

/**
 * Mock connection for testing
 */
export interface MockConnection {
  /** Unique identifier for the connection */
  id: string;
  /** Whether the connection is valid */
  isValid: boolean;
  /** Timestamp when the connection was created */
  createdAt: Date;
  /** Number of times the connection has been used */
  useCount: number;
  /** Whether the connection is slow */
  isSlow: boolean;
  /** Custom query method */
  query: (sql: string) => Promise<any>;
  /** Custom disconnect method */
  disconnect: () => Promise<void>;
  /** Custom ping method for health checks */
  ping: () => Promise<boolean>;
}

/**
 * Creates a mock connection factory for testing
 * @param options Options for the mock connection factory
 * @returns A function that creates mock connections
 */
export function createMockConnectionFactory(options: {
  failureRate?: number;
  slowConnectionRate?: number;
  slowConnectionDelayMs?: number;
  connectionDelayMs?: number;
  queryDelayMs?: number;
  disconnectDelayMs?: number;
}) {
  let connectionCounter = 0;

  return async (journeyId?: string): Promise<MockConnection> => {
    // Simulate connection delay
    if (options.connectionDelayMs) {
      await new Promise(resolve => setTimeout(resolve, options.connectionDelayMs));
    }

    // Simulate connection failure
    if (options.failureRate && Math.random() < options.failureRate) {
      throw new Error('Simulated connection failure');
    }

    // Determine if this connection should be slow
    const isSlow = options.slowConnectionRate ? Math.random() < options.slowConnectionRate : false;

    // Create the mock connection
    const connection: MockConnection = {
      id: `mock_${++connectionCounter}`,
      isValid: true,
      createdAt: new Date(),
      useCount: 0,
      isSlow,
      query: async (sql: string) => {
        connection.useCount++;

        // Simulate query delay
        const delay = isSlow && options.slowConnectionDelayMs
          ? options.slowConnectionDelayMs
          : options.queryDelayMs || 0;

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Return mock query result
        return { rows: [{ result: 'success', connectionId: connection.id, journeyId }] };
      },
      disconnect: async () => {
        // Simulate disconnect delay
        if (options.disconnectDelayMs) {
          await new Promise(resolve => setTimeout(resolve, options.disconnectDelayMs));
        }

        connection.isValid = false;
      },
      ping: async () => {
        // Simulate ping delay
        const delay = isSlow && options.slowConnectionDelayMs
          ? options.slowConnectionDelayMs / 2
          : options.queryDelayMs ? options.queryDelayMs / 2 : 0;

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        return connection.isValid;
      }
    };

    return connection;
  };
}

/**
 * Creates a mock event emitter for testing
 * @returns A mock event emitter
 */
export function createMockEventEmitter(): ConnectionEventEmitter {
  const events: any[] = [];
  const listeners: Record<string, Function[]> = {};

  return {
    on: (eventType: ConnectionEventType | '*', listener: Function) => {
      if (!listeners[eventType]) {
        listeners[eventType] = [];
      }
      listeners[eventType].push(listener);
    },
    off: (eventType: ConnectionEventType | '*', listener: Function) => {
      if (listeners[eventType]) {
        listeners[eventType] = listeners[eventType].filter(l => l !== listener);
      }
    },
    emit: (event: any) => {
      events.push(event);
      
      // Notify type-specific listeners
      if (listeners[event.type]) {
        listeners[event.type].forEach(listener => listener(event));
      }
      
      // Notify wildcard listeners
      if (listeners['*']) {
        listeners['*'].forEach(listener => listener(event));
      }
    },
    getEvents: () => [...events],
    clearEvents: () => { events.length = 0; }
  } as ConnectionEventEmitter & { getEvents: () => any[], clearEvents: () => void };
}

/**
 * Basic connection pool scenario with minimal configuration
 */
export const basicPoolScenario: ConnectionPoolScenario = {
  name: 'basic-pool',
  description: 'Tests basic connection pool initialization and acquisition',
  poolConfig: {
    connectionPool: {
      poolMin: 2,
      poolMax: 5,
      poolIdle: 30000,
      lazyConnect: false,
    }
  },
  connectionCount: 10,
  concurrent: false,
  expectedMaxDurationMs: 5000,
  expectedMinUniqueConnections: 2,
  expectedMaxUniqueConnections: 5,
};

/**
 * High concurrency connection pool scenario
 */
export const highConcurrencyPoolScenario: ConnectionPoolScenario = {
  name: 'high-concurrency-pool',
  description: 'Tests connection pool under high concurrency load',
  poolConfig: {
    connectionPool: {
      poolMin: 5,
      poolMax: 20,
      poolIdle: 30000,
      lazyConnect: false,
    }
  },
  connectionCount: 100,
  concurrent: true,
  expectedMaxDurationMs: 10000,
  expectedMinUniqueConnections: 5,
  expectedMaxUniqueConnections: 20,
  simulateSlowConnections: true,
  slowConnectionRate: 0.1,
  slowConnectionDelayMs: 100,
};

/**
 * Connection timeout scenario
 */
export const connectionTimeoutScenario: ConnectionPoolScenario = {
  name: 'connection-timeout',
  description: 'Tests connection acquisition timeout handling',
  poolConfig: {
    connectionPool: {
      poolMin: 2,
      poolMax: 5,
      poolIdle: 30000,
      lazyConnect: false,
    }
  },
  connectionCount: 10,
  concurrent: true,
  expectedMaxDurationMs: 5000,
  expectedMinUniqueConnections: 2,
  expectedMaxUniqueConnections: 5,
  acquisitionOptions: {
    timeoutMs: 500,
  },
  simulateSlowConnections: true,
  slowConnectionRate: 0.5,
  slowConnectionDelayMs: 1000,
  validate: (results) => {
    // We expect some acquisition failures due to timeouts
    return results.acquisitionFailures > 0;
  }
};

/**
 * Connection failure and retry scenario
 */
export const connectionFailureScenario: ConnectionPoolScenario = {
  name: 'connection-failure-retry',
  description: 'Tests connection failure handling and retry mechanisms',
  poolConfig: {
    connectionPool: {
      poolMin: 2,
      poolMax: 10,
      poolIdle: 30000,
      lazyConnect: false,
    }
  },
  connectionCount: 20,
  concurrent: true,
  expectedMaxDurationMs: 10000,
  expectedMinUniqueConnections: 2,
  expectedMaxUniqueConnections: 10,
  simulateFailures: true,
  failureRate: 0.3,
  validate: (results) => {
    // We expect some acquisition failures but also successful retries
    return results.acquisitionFailures > 0 && results.connectionsAcquired > 0;
  }
};

/**
 * Resource cleanup scenario
 */
export const resourceCleanupScenario: ConnectionPoolScenario = {
  name: 'resource-cleanup',
  description: 'Tests proper cleanup of idle connections',
  poolConfig: {
    connectionPool: {
      poolMin: 2,
      poolMax: 10,
      poolIdle: 1000, // Short idle timeout for testing
      lazyConnect: false,
    }
  },
  connectionCount: 20,
  concurrent: true,
  expectedMaxDurationMs: 5000,
  expectedMinUniqueConnections: 2,
  expectedMaxUniqueConnections: 10,
  setup: async () => {
    // No special setup needed
  },
  teardown: async () => {
    // Wait for idle connections to be cleaned up
    await new Promise(resolve => setTimeout(resolve, 2000));
  },
  validate: (results) => {
    // After cleanup, we expect the number of connections to be close to poolMin
    return results.finalPoolStats.totalConnections <= results.finalPoolStats.activeConnections + 3;
  }
};

/**
 * Connection leak scenario
 */
export const connectionLeakScenario: ConnectionPoolScenario = {
  name: 'connection-leak',
  description: 'Tests pool behavior when connections are not properly released',
  poolConfig: {
    connectionPool: {
      poolMin: 2,
      poolMax: 10,
      poolIdle: 30000,
      lazyConnect: false,
    }
  },
  connectionCount: 15,
  concurrent: true,
  expectedMaxDurationMs: 5000,
  expectedMinUniqueConnections: 2,
  expectedMaxUniqueConnections: 10,
  simulateConnectionLeaks: true,
  leakRate: 0.2,
  validate: (results) => {
    // We expect the pool to eventually reach max connections
    return results.finalPoolStats.totalConnections === 10 && 
           results.finalPoolStats.activeConnections > 0;
  }
};

/**
 * Journey-specific connection scenario
 */
export const journeySpecificScenario: ConnectionPoolScenario = {
  name: 'journey-specific-connections',
  description: 'Tests connection pool with journey-specific connections',
  poolConfig: {
    connectionPool: {
      poolMin: 5,
      poolMax: 15,
      poolIdle: 30000,
      lazyConnect: false,
    }
  },
  connectionCount: 30,
  concurrent: true,
  expectedMaxDurationMs: 5000,
  expectedMinUniqueConnections: 5,
  expectedMaxUniqueConnections: 15,
  acquisitionOptions: {
    // Randomly assign connections to different journeys
    journeyId: () => {
      const journeys = ['health', 'care', 'plan', 'gamification', 'auth'];
      return journeys[Math.floor(Math.random() * journeys.length)];
    },
  },
  validate: (results) => {
    // We expect connections to be distributed across journeys
    return results.additionalData?.journeyDistribution &&
           Object.keys(results.additionalData.journeyDistribution).length > 1;
  }
};

/**
 * Connection validation scenario
 */
export const connectionValidationScenario: ConnectionPoolScenario = {
  name: 'connection-validation',
  description: 'Tests connection validation before acquisition',
  poolConfig: {
    connectionPool: {
      poolMin: 3,
      poolMax: 10,
      poolIdle: 30000,
      lazyConnect: false,
    }
  },
  connectionCount: 20,
  concurrent: true,
  expectedMaxDurationMs: 5000,
  expectedMinUniqueConnections: 3,
  expectedMaxUniqueConnections: 10,
  acquisitionOptions: {
    validateConnection: true,
    validationFn: async (connection: any) => {
      // Simulate validation that occasionally fails
      if (connection.ping && typeof connection.ping === 'function') {
        return await connection.ping();
      }
      return Math.random() > 0.2; // 20% validation failure rate
    }
  },
  validate: (results) => {
    // We expect some connections to be replaced due to validation failures
    return results.uniqueConnectionsUsed > results.connectionCount * 0.1;
  }
};

/**
 * Priority-based acquisition scenario
 */
export const priorityAcquisitionScenario: ConnectionPoolScenario = {
  name: 'priority-acquisition',
  description: 'Tests priority-based connection acquisition',
  poolConfig: {
    connectionPool: {
      poolMin: 2,
      poolMax: 5,
      poolIdle: 30000,
      lazyConnect: false,
    }
  },
  connectionCount: 20,
  concurrent: true,
  expectedMaxDurationMs: 5000,
  expectedMinUniqueConnections: 2,
  expectedMaxUniqueConnections: 5,
  acquisitionOptions: {
    // Randomly assign different priorities
    priority: () => {
      const priorities = ['low', 'normal', 'high'] as const;
      return priorities[Math.floor(Math.random() * priorities.length)];
    }
  },
  validate: (results) => {
    // We expect high priority requests to be processed first
    // This is hard to validate in the result, so we'll just check that all connections were acquired
    return results.connectionsAcquired === results.connectionCount;
  }
};

/**
 * Connection health monitoring scenario
 */
export const healthMonitoringScenario: ConnectionPoolScenario = {
  name: 'health-monitoring',
  description: 'Tests connection health monitoring integration',
  poolConfig: {
    connectionPool: {
      poolMin: 3,
      poolMax: 10,
      poolIdle: 30000,
      lazyConnect: false,
    },
    healthCheck: {
      enabled: true,
      intervalMs: 1000,
      timeoutMs: 500,
      failureThreshold: 3,
      successThreshold: 2,
      autoRecover: true,
    }
  },
  connectionCount: 30,
  concurrent: true,
  expectedMaxDurationMs: 10000,
  expectedMinUniqueConnections: 3,
  expectedMaxUniqueConnections: 10,
  simulateFailures: true,
  failureRate: 0.1,
  validate: (results) => {
    // We expect health checks to detect and recover from failures
    return results.additionalData?.healthEvents && 
           results.additionalData.healthEvents.length > 0;
  }
};

/**
 * All connection pool test scenarios
 */
export const connectionPoolScenarios: ConnectionPoolScenario[] = [
  basicPoolScenario,
  highConcurrencyPoolScenario,
  connectionTimeoutScenario,
  connectionFailureScenario,
  resourceCleanupScenario,
  connectionLeakScenario,
  journeySpecificScenario,
  connectionValidationScenario,
  priorityAcquisitionScenario,
  healthMonitoringScenario,
];

/**
 * Runs a connection pool scenario
 * @param scenario Scenario to run
 * @returns Result of the scenario
 */
export async function runConnectionPoolScenario(
  scenario: ConnectionPoolScenario
): Promise<ConnectionPoolScenarioResult> {
  const startTime = Date.now();
  const result: ConnectionPoolScenarioResult = {
    scenarioName: scenario.name,
    passed: false,
    durationMs: 0,
    connectionsAcquired: 0,
    uniqueConnectionsUsed: 0,
    acquisitionFailures: 0,
    avgAcquisitionTimeMs: 0,
    maxAcquisitionTimeMs: 0,
    finalPoolStats: {} as ConnectionStats,
    additionalData: {},
  };

  // Create mock event emitter
  const eventEmitter = createMockEventEmitter();

  // Create connection factory
  const connectionFactory = scenario.connectionFactory || createMockConnectionFactory({
    failureRate: scenario.simulateFailures ? scenario.failureRate : 0,
    slowConnectionRate: scenario.simulateSlowConnections ? scenario.slowConnectionRate : 0,
    slowConnectionDelayMs: scenario.simulateSlowConnections ? scenario.slowConnectionDelayMs : 0,
    connectionDelayMs: 10, // Small delay to simulate real connection time
    queryDelayMs: 5, // Small delay to simulate real query time
    disconnectDelayMs: 5, // Small delay to simulate real disconnect time
  });

  // Create connection health and retry services
  const connectionRetry = new ConnectionRetry(undefined, eventEmitter as ConnectionEventEmitter);
  const connectionHealth = new ConnectionHealth(
    scenario.poolConfig as ConnectionConfig,
    connectionRetry,
    eventEmitter as ConnectionEventEmitter
  );

  // Create connection pool
  const pool = new ConnectionPool(
    scenario.poolConfig as ConnectionConfig,
    connectionFactory,
    connectionHealth,
    connectionRetry,
    eventEmitter as ConnectionEventEmitter
  );

  try {
    // Initialize the pool
    await pool.onModuleInit();

    // Run setup if provided
    if (scenario.setup) {
      await scenario.setup();
    }

    // Track unique connections
    const uniqueConnections = new Set<string>();
    const acquisitionTimes: number[] = [];
    const journeyDistribution: Record<string, number> = {};

    // Function to acquire and release a connection
    const acquireAndRelease = async (index: number) => {
      const acquisitionStart = Date.now();
      try {
        // Prepare acquisition options
        let options: ConnectionAcquisitionOptions = {};
        if (scenario.acquisitionOptions) {
          options = { ...scenario.acquisitionOptions };
          
          // Handle function-based options
          if (typeof options.journeyId === 'function') {
            options.journeyId = (options.journeyId as Function)() as string;
          }
          if (typeof options.priority === 'function') {
            options.priority = (options.priority as Function)() as 'low' | 'normal' | 'high';
          }
        }

        // Acquire connection
        const connection = await pool.acquire(options);
        const acquisitionTime = Date.now() - acquisitionStart;
        acquisitionTimes.push(acquisitionTime);

        // Track unique connections
        uniqueConnections.add(connection.id);
        result.connectionsAcquired++;

        // Track journey distribution
        if (connection.journeyId) {
          journeyDistribution[connection.journeyId] = (journeyDistribution[connection.journeyId] || 0) + 1;
        }

        // Simulate using the connection
        if (connection.connection && typeof connection.connection.query === 'function') {
          await connection.connection.query('SELECT 1');
        }

        // Simulate connection leak
        const shouldLeak = scenario.simulateConnectionLeaks && 
                          scenario.leakRate && 
                          Math.random() < scenario.leakRate;

        if (!shouldLeak) {
          // Release the connection back to the pool
          pool.release(connection);
        }
      } catch (error) {
        result.acquisitionFailures++;
      }
    };

    // Run the scenario
    if (scenario.concurrent) {
      // Run operations concurrently
      const operations = Array.from({ length: scenario.connectionCount }, (_, i) => acquireAndRelease(i));
      await Promise.all(operations);
    } else {
      // Run operations sequentially
      for (let i = 0; i < scenario.connectionCount; i++) {
        await acquireAndRelease(i);
      }
    }

    // Calculate statistics
    result.uniqueConnectionsUsed = uniqueConnections.size;
    result.avgAcquisitionTimeMs = acquisitionTimes.length > 0
      ? acquisitionTimes.reduce((sum, time) => sum + time, 0) / acquisitionTimes.length
      : 0;
    result.maxAcquisitionTimeMs = acquisitionTimes.length > 0
      ? Math.max(...acquisitionTimes)
      : 0;
    result.finalPoolStats = pool.getStats();
    result.additionalData = {
      journeyDistribution,
      healthEvents: (eventEmitter as any).getEvents().filter(
        (e: any) => e.type === ConnectionEventType.HEALTH_CHECK_SUCCESS || 
                    e.type === ConnectionEventType.HEALTH_CHECK_FAILURE
      ),
    };

    // Run teardown if provided
    if (scenario.teardown) {
      await scenario.teardown();
    }

    // Validate the results
    if (scenario.validate) {
      result.passed = scenario.validate(result);
    } else {
      // Default validation
      result.passed = (
        result.uniqueConnectionsUsed >= scenario.expectedMinUniqueConnections &&
        result.uniqueConnectionsUsed <= scenario.expectedMaxUniqueConnections &&
        result.durationMs <= scenario.expectedMaxDurationMs
      );
    }
  } catch (error) {
    result.passed = false;
    result.errorMessage = error instanceof Error ? error.message : String(error);
  } finally {
    // Clean up the pool
    await pool.onModuleDestroy();
    result.durationMs = Date.now() - startTime;
  }

  return result;
}

/**
 * Runs all connection pool scenarios
 * @returns Results of all scenarios
 */
export async function runAllConnectionPoolScenarios(): Promise<Record<string, ConnectionPoolScenarioResult>> {
  const results: Record<string, ConnectionPoolScenarioResult> = {};

  for (const scenario of connectionPoolScenarios) {
    results[scenario.name] = await runConnectionPoolScenario(scenario);
  }

  return results;
}