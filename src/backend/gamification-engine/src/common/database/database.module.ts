import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { TransactionService } from './transaction.service';
import { JourneyContextService } from './journey-context.service';
import { ErrorHandlerService } from './error-handler.service';
import { 
  CONNECTION_POOL, 
  TIMEOUTS, 
  RETRY, 
  LOGGING, 
  HEALTH_CHECK,
  DatabaseEnvironment 
} from './constants';
import { JourneyType } from '@austa/interfaces/common';

/**
 * Token for injecting database configuration
 */
export const DATABASE_CONFIG_TOKEN = 'DATABASE_CONFIG';

/**
 * Configuration options for the DatabaseModule
 */
export interface DatabaseModuleOptions {
  /**
   * Database environment type
   * @default 'development'
   */
  environment?: DatabaseEnvironment;

  /**
   * Connection pool configuration
   */
  connectionPool?: {
    /**
     * Minimum number of connections to maintain in the pool
     * @default 2 (varies by environment)
     */
    minConnections?: number;

    /**
     * Maximum number of connections allowed in the pool
     * @default 10 (varies by environment)
     */
    maxConnections?: number;

    /**
     * Maximum number of idle connections to keep in the pool
     * @default 5 (varies by environment)
     */
    maxIdleConnections?: number;

    /**
     * Time in milliseconds after which idle connections are removed from the pool
     * @default 60000 (varies by environment)
     */
    idleTimeoutMs?: number;
  };
  
  /**
   * Timeout configuration
   */
  timeouts?: {
    /**
     * Default query timeout in milliseconds
     * @default 5000 (varies by environment)
     */
    queryTimeoutMs?: number;

    /**
     * Default transaction timeout in milliseconds
     * @default 30000 (varies by environment)
     */
    transactionTimeoutMs?: number;

    /**
     * Default connection timeout in milliseconds
     * @default 10000 (varies by environment)
     */
    connectionTimeoutMs?: number;

    /**
     * Default health check timeout in milliseconds
     * @default 2000 (varies by environment)
     */
    healthCheckTimeoutMs?: number;
  };
  
  /**
   * Retry configuration
   */
  retry?: {
    /**
     * Maximum number of retry attempts for database operations
     * @default 3 (varies by environment)
     */
    maxRetryAttempts?: number;

    /**
     * Initial delay in milliseconds before the first retry
     * @default 100 (varies by environment)
     */
    initialRetryDelayMs?: number;

    /**
     * Multiplier applied to the delay after each retry attempt
     * @default 2
     */
    backoffMultiplier?: number;

    /**
     * Maximum delay in milliseconds between retry attempts
     * @default 5000
     */
    maxRetryDelayMs?: number;

    /**
     * Random factor to add jitter to retry delays (0-1)
     * @default 0.2
     */
    jitterFactor?: number;
  };
  
  /**
   * Logging configuration
   */
  logging?: {
    /**
     * Enable query logging
     * @default false in production, true in development
     */
    enableQueryLogging?: boolean;

    /**
     * Enable transaction logging
     * @default false in production, true in development
     */
    enableTransactionLogging?: boolean;

    /**
     * Enable connection pool logging
     * @default false in production, true in development
     */
    enablePoolLogging?: boolean;

    /**
     * Log slow queries that exceed this threshold in milliseconds
     * @default 1000 (varies by environment)
     */
    slowQueryThresholdMs?: number;
  };

  /**
   * Health check configuration
   */
  healthCheck?: {
    /**
     * Interval in milliseconds between health checks
     * @default 30000 (varies by environment)
     */
    intervalMs?: number;

    /**
     * Timeout in milliseconds for health check queries
     * @default 2000
     */
    timeoutMs?: number;

    /**
     * Number of consecutive failures before marking a connection as unhealthy
     * @default 3
     */
    failureThreshold?: number;

    /**
     * Number of consecutive successes before marking a connection as healthy again
     * @default 2
     */
    recoveryThreshold?: number;
  };

  /**
   * Journey-specific configurations
   */
  journeyConfigs?: {
    /**
     * Health journey configuration
     */
    [JourneyType.HEALTH]?: {
      queryTimeoutMs?: number;
      maxRetryAttempts?: number;
    };

    /**
     * Care journey configuration
     */
    [JourneyType.CARE]?: {
      queryTimeoutMs?: number;
      maxRetryAttempts?: number;
    };

    /**
     * Plan journey configuration
     */
    [JourneyType.PLAN]?: {
      queryTimeoutMs?: number;
      maxRetryAttempts?: number;
    };
  };
}

/**
 * Global module that provides database services for the gamification engine
 * including enhanced PrismaService, JourneyContextService, and TransactionService.
 * 
 * This module ensures consistent database configuration across the application
 * and proper lifecycle management for database connections.
 * 
 * It provides optimized database access for gamification operations with:
 * - Connection pooling and optimization
 * - Journey-specific database contexts
 * - Comprehensive transaction management
 * - Robust error handling with retry mechanisms
 * - Performance monitoring and health checks
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    TransactionService,
    JourneyContextService,
    ErrorHandlerService,
  ],
  exports: [
    PrismaService,
    TransactionService,
    JourneyContextService,
    ErrorHandlerService,
  ],
})
export class DatabaseModule {
  /**
   * Register the DatabaseModule with default configuration
   * @returns The configured DatabaseModule
   */
  static register(): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_CONFIG_TOKEN,
          useFactory: (configService: ConfigService) => {
            const environment = configService.get<DatabaseEnvironment>(
              'NODE_ENV', 
              DatabaseEnvironment.DEVELOPMENT
            ) as DatabaseEnvironment;

            return {
              environment,
              connectionPool: {
                minConnections: configService.get<number>(
                  'DATABASE_MIN_CONNECTIONS',
                  CONNECTION_POOL.ENVIRONMENT[environment]?.MIN_CONNECTIONS ?? CONNECTION_POOL.MIN_CONNECTIONS
                ),
                maxConnections: configService.get<number>(
                  'DATABASE_MAX_CONNECTIONS',
                  CONNECTION_POOL.ENVIRONMENT[environment]?.MAX_CONNECTIONS ?? CONNECTION_POOL.MAX_CONNECTIONS
                ),
                maxIdleConnections: configService.get<number>(
                  'DATABASE_MAX_IDLE_CONNECTIONS',
                  CONNECTION_POOL.ENVIRONMENT[environment]?.MAX_IDLE_CONNECTIONS ?? CONNECTION_POOL.MAX_IDLE_CONNECTIONS
                ),
                idleTimeoutMs: configService.get<number>(
                  'DATABASE_IDLE_TIMEOUT_MS',
                  CONNECTION_POOL.ENVIRONMENT[environment]?.IDLE_TIMEOUT_MS ?? CONNECTION_POOL.IDLE_TIMEOUT_MS
                ),
              },
              timeouts: {
                queryTimeoutMs: configService.get<number>(
                  'DATABASE_QUERY_TIMEOUT_MS',
                  TIMEOUTS.ENVIRONMENT[environment]?.QUERY_TIMEOUT_MS ?? TIMEOUTS.QUERY_TIMEOUT_MS
                ),
                transactionTimeoutMs: configService.get<number>(
                  'DATABASE_TRANSACTION_TIMEOUT_MS',
                  TIMEOUTS.ENVIRONMENT[environment]?.TRANSACTION_TIMEOUT_MS ?? TIMEOUTS.TRANSACTION_TIMEOUT_MS
                ),
                connectionTimeoutMs: configService.get<number>(
                  'DATABASE_CONNECTION_TIMEOUT_MS',
                  TIMEOUTS.ENVIRONMENT[environment]?.CONNECTION_TIMEOUT_MS ?? TIMEOUTS.CONNECTION_TIMEOUT_MS
                ),
                healthCheckTimeoutMs: configService.get<number>(
                  'DATABASE_HEALTH_CHECK_TIMEOUT_MS',
                  TIMEOUTS.ENVIRONMENT[environment]?.HEALTH_CHECK_TIMEOUT_MS ?? TIMEOUTS.HEALTH_CHECK_TIMEOUT_MS
                ),
              },
              retry: {
                maxRetryAttempts: configService.get<number>(
                  'DATABASE_MAX_RETRY_ATTEMPTS',
                  RETRY.ENVIRONMENT[environment]?.MAX_RETRY_ATTEMPTS ?? RETRY.MAX_RETRY_ATTEMPTS
                ),
                initialRetryDelayMs: configService.get<number>(
                  'DATABASE_INITIAL_RETRY_DELAY_MS',
                  RETRY.ENVIRONMENT[environment]?.INITIAL_RETRY_DELAY_MS ?? RETRY.INITIAL_RETRY_DELAY_MS
                ),
                backoffMultiplier: configService.get<number>(
                  'DATABASE_BACKOFF_MULTIPLIER',
                  RETRY.BACKOFF_MULTIPLIER
                ),
                maxRetryDelayMs: configService.get<number>(
                  'DATABASE_MAX_RETRY_DELAY_MS',
                  RETRY.MAX_RETRY_DELAY_MS
                ),
                jitterFactor: configService.get<number>(
                  'DATABASE_JITTER_FACTOR',
                  RETRY.JITTER_FACTOR
                ),
              },
              logging: {
                enableQueryLogging: configService.get<boolean>(
                  'DATABASE_ENABLE_QUERY_LOGGING',
                  LOGGING.ENVIRONMENT[environment]?.ENABLE_QUERY_LOGGING ?? LOGGING.ENABLE_QUERY_LOGGING
                ),
                enableTransactionLogging: configService.get<boolean>(
                  'DATABASE_ENABLE_TRANSACTION_LOGGING',
                  LOGGING.ENVIRONMENT[environment]?.ENABLE_TRANSACTION_LOGGING ?? LOGGING.ENABLE_TRANSACTION_LOGGING
                ),
                enablePoolLogging: configService.get<boolean>(
                  'DATABASE_ENABLE_POOL_LOGGING',
                  LOGGING.ENVIRONMENT[environment]?.ENABLE_POOL_LOGGING ?? LOGGING.ENABLE_POOL_LOGGING
                ),
                slowQueryThresholdMs: configService.get<number>(
                  'DATABASE_SLOW_QUERY_THRESHOLD_MS',
                  LOGGING.ENVIRONMENT[environment]?.SLOW_QUERY_THRESHOLD_MS ?? LOGGING.SLOW_QUERY_THRESHOLD_MS
                ),
              },
              healthCheck: {
                intervalMs: configService.get<number>(
                  'DATABASE_HEALTH_CHECK_INTERVAL_MS',
                  HEALTH_CHECK.ENVIRONMENT[environment]?.INTERVAL_MS ?? HEALTH_CHECK.INTERVAL_MS
                ),
                timeoutMs: configService.get<number>(
                  'DATABASE_HEALTH_CHECK_TIMEOUT_MS',
                  HEALTH_CHECK.TIMEOUT_MS
                ),
                failureThreshold: configService.get<number>(
                  'DATABASE_HEALTH_CHECK_FAILURE_THRESHOLD',
                  HEALTH_CHECK.FAILURE_THRESHOLD
                ),
                recoveryThreshold: configService.get<number>(
                  'DATABASE_HEALTH_CHECK_RECOVERY_THRESHOLD',
                  HEALTH_CHECK.RECOVERY_THRESHOLD
                ),
              },
              journeyConfigs: {
                [JourneyType.HEALTH]: {
                  queryTimeoutMs: configService.get<number>(
                    'DATABASE_HEALTH_JOURNEY_QUERY_TIMEOUT_MS',
                    TIMEOUTS.JOURNEY.HEALTH?.QUERY_TIMEOUT_MS
                  ),
                },
                [JourneyType.CARE]: {
                  queryTimeoutMs: configService.get<number>(
                    'DATABASE_CARE_JOURNEY_QUERY_TIMEOUT_MS',
                    TIMEOUTS.JOURNEY.CARE?.QUERY_TIMEOUT_MS
                  ),
                },
                [JourneyType.PLAN]: {
                  queryTimeoutMs: configService.get<number>(
                    'DATABASE_PLAN_JOURNEY_QUERY_TIMEOUT_MS',
                    TIMEOUTS.JOURNEY.PLAN?.QUERY_TIMEOUT_MS
                  ),
                },
              },
            };
          },
          inject: [ConfigService],
        },
      ],
    };
  }

  /**
   * Register the DatabaseModule with custom configuration
   * @param options Custom database configuration options
   * @returns The configured DatabaseModule
   */
  static registerAsync(options: DatabaseModuleOptions): DynamicModule {
    const environment = options.environment ?? DatabaseEnvironment.DEVELOPMENT;

    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_CONFIG_TOKEN,
          useValue: {
            environment,
            connectionPool: {
              minConnections: options.connectionPool?.minConnections ?? 
                CONNECTION_POOL.ENVIRONMENT[environment]?.MIN_CONNECTIONS ?? 
                CONNECTION_POOL.MIN_CONNECTIONS,
              maxConnections: options.connectionPool?.maxConnections ?? 
                CONNECTION_POOL.ENVIRONMENT[environment]?.MAX_CONNECTIONS ?? 
                CONNECTION_POOL.MAX_CONNECTIONS,
              maxIdleConnections: options.connectionPool?.maxIdleConnections ?? 
                CONNECTION_POOL.ENVIRONMENT[environment]?.MAX_IDLE_CONNECTIONS ?? 
                CONNECTION_POOL.MAX_IDLE_CONNECTIONS,
              idleTimeoutMs: options.connectionPool?.idleTimeoutMs ?? 
                CONNECTION_POOL.ENVIRONMENT[environment]?.IDLE_TIMEOUT_MS ?? 
                CONNECTION_POOL.IDLE_TIMEOUT_MS,
            },
            timeouts: {
              queryTimeoutMs: options.timeouts?.queryTimeoutMs ?? 
                TIMEOUTS.ENVIRONMENT[environment]?.QUERY_TIMEOUT_MS ?? 
                TIMEOUTS.QUERY_TIMEOUT_MS,
              transactionTimeoutMs: options.timeouts?.transactionTimeoutMs ?? 
                TIMEOUTS.ENVIRONMENT[environment]?.TRANSACTION_TIMEOUT_MS ?? 
                TIMEOUTS.TRANSACTION_TIMEOUT_MS,
              connectionTimeoutMs: options.timeouts?.connectionTimeoutMs ?? 
                TIMEOUTS.ENVIRONMENT[environment]?.CONNECTION_TIMEOUT_MS ?? 
                TIMEOUTS.CONNECTION_TIMEOUT_MS,
              healthCheckTimeoutMs: options.timeouts?.healthCheckTimeoutMs ?? 
                TIMEOUTS.ENVIRONMENT[environment]?.HEALTH_CHECK_TIMEOUT_MS ?? 
                TIMEOUTS.HEALTH_CHECK_TIMEOUT_MS,
            },
            retry: {
              maxRetryAttempts: options.retry?.maxRetryAttempts ?? 
                RETRY.ENVIRONMENT[environment]?.MAX_RETRY_ATTEMPTS ?? 
                RETRY.MAX_RETRY_ATTEMPTS,
              initialRetryDelayMs: options.retry?.initialRetryDelayMs ?? 
                RETRY.ENVIRONMENT[environment]?.INITIAL_RETRY_DELAY_MS ?? 
                RETRY.INITIAL_RETRY_DELAY_MS,
              backoffMultiplier: options.retry?.backoffMultiplier ?? 
                RETRY.BACKOFF_MULTIPLIER,
              maxRetryDelayMs: options.retry?.maxRetryDelayMs ?? 
                RETRY.MAX_RETRY_DELAY_MS,
              jitterFactor: options.retry?.jitterFactor ?? 
                RETRY.JITTER_FACTOR,
            },
            logging: {
              enableQueryLogging: options.logging?.enableQueryLogging ?? 
                LOGGING.ENVIRONMENT[environment]?.ENABLE_QUERY_LOGGING ?? 
                LOGGING.ENABLE_QUERY_LOGGING,
              enableTransactionLogging: options.logging?.enableTransactionLogging ?? 
                LOGGING.ENVIRONMENT[environment]?.ENABLE_TRANSACTION_LOGGING ?? 
                LOGGING.ENABLE_TRANSACTION_LOGGING,
              enablePoolLogging: options.logging?.enablePoolLogging ?? 
                LOGGING.ENVIRONMENT[environment]?.ENABLE_POOL_LOGGING ?? 
                LOGGING.ENABLE_POOL_LOGGING,
              slowQueryThresholdMs: options.logging?.slowQueryThresholdMs ?? 
                LOGGING.ENVIRONMENT[environment]?.SLOW_QUERY_THRESHOLD_MS ?? 
                LOGGING.SLOW_QUERY_THRESHOLD_MS,
            },
            healthCheck: {
              intervalMs: options.healthCheck?.intervalMs ?? 
                HEALTH_CHECK.ENVIRONMENT[environment]?.INTERVAL_MS ?? 
                HEALTH_CHECK.INTERVAL_MS,
              timeoutMs: options.healthCheck?.timeoutMs ?? 
                HEALTH_CHECK.TIMEOUT_MS,
              failureThreshold: options.healthCheck?.failureThreshold ?? 
                HEALTH_CHECK.FAILURE_THRESHOLD,
              recoveryThreshold: options.healthCheck?.recoveryThreshold ?? 
                HEALTH_CHECK.RECOVERY_THRESHOLD,
            },
            journeyConfigs: {
              [JourneyType.HEALTH]: {
                queryTimeoutMs: options.journeyConfigs?.[JourneyType.HEALTH]?.queryTimeoutMs ?? 
                  TIMEOUTS.JOURNEY.HEALTH?.QUERY_TIMEOUT_MS,
              },
              [JourneyType.CARE]: {
                queryTimeoutMs: options.journeyConfigs?.[JourneyType.CARE]?.queryTimeoutMs ?? 
                  TIMEOUTS.JOURNEY.CARE?.QUERY_TIMEOUT_MS,
              },
              [JourneyType.PLAN]: {
                queryTimeoutMs: options.journeyConfigs?.[JourneyType.PLAN]?.queryTimeoutMs ?? 
                  TIMEOUTS.JOURNEY.PLAN?.QUERY_TIMEOUT_MS,
              },
            },
          },
        },
      ],
    };
  }

  /**
   * Register the DatabaseModule with a custom provider factory
   * @param options Factory configuration for creating database options
   * @returns The configured DatabaseModule
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const databaseConfigProvider: Provider = {
      provide: DATABASE_CONFIG_TOKEN,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: DatabaseModule,
      imports: options.imports || [],
      providers: [databaseConfigProvider],
    };
  }

  /**
   * Register the DatabaseModule for testing with mock implementations
   * @returns The configured DatabaseModule for testing
   */
  static forTesting(): DynamicModule {
    const mockPrismaService = {
      provide: PrismaService,
      useValue: {
        // Mock implementation for testing
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $transaction: jest.fn((callback) => callback()),
        executeTransaction: jest.fn((fn) => fn({})),
        getJourneyContext: jest.fn(() => ({
          journeyType: JourneyType.HEALTH,
          client: {},
          executeTransaction: jest.fn((fn) => fn({})),
          release: jest.fn(),
        })),
      },
    };

    const mockTransactionService = {
      provide: TransactionService,
      useValue: {
        // Mock implementation for testing
        executeTransaction: jest.fn((fn) => fn({})),
        executeNestedTransaction: jest.fn((fn, parent) => fn(parent)),
        startTransaction: jest.fn(() => ({})),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
      },
    };

    const mockJourneyContextService = {
      provide: JourneyContextService,
      useValue: {
        // Mock implementation for testing
        getContext: jest.fn((journeyType) => ({
          journeyType,
          client: {},
          executeTransaction: jest.fn((fn) => fn({})),
          release: jest.fn(),
        })),
        releaseAllContexts: jest.fn(),
      },
    };

    const mockErrorHandlerService = {
      provide: ErrorHandlerService,
      useValue: {
        // Mock implementation for testing
        handleError: jest.fn((error) => { throw error; }),
        isRetryableError: jest.fn(() => false),
        isConnectionError: jest.fn(() => false),
        isConstraintViolation: jest.fn(() => false),
        logError: jest.fn(),
        createRetryStrategy: jest.fn(() => ({
          maxRetries: 0,
          baseDelayMs: 0,
          maxDelayMs: 0,
          backoffFactor: 1,
          useJitter: false,
          calculateDelay: jest.fn(() => 0),
          shouldRetry: jest.fn(() => false),
        })),
      },
    };

    return {
      module: DatabaseModule,
      providers: [
        mockPrismaService,
        mockTransactionService,
        mockJourneyContextService,
        mockErrorHandlerService,
        {
          provide: DATABASE_CONFIG_TOKEN,
          useValue: {
            environment: DatabaseEnvironment.TEST,
            connectionPool: {
              minConnections: 1,
              maxConnections: 3,
              maxIdleConnections: 1,
              idleTimeoutMs: 10000,
            },
            timeouts: {
              queryTimeoutMs: 3000,
              transactionTimeoutMs: 15000,
              connectionTimeoutMs: 5000,
              healthCheckTimeoutMs: 2000,
            },
            retry: {
              maxRetryAttempts: 2,
              initialRetryDelayMs: 50,
              backoffMultiplier: 2,
              maxRetryDelayMs: 5000,
              jitterFactor: 0.2,
            },
            logging: {
              enableQueryLogging: false,
              enableTransactionLogging: false,
              enablePoolLogging: false,
              slowQueryThresholdMs: 1000,
            },
            healthCheck: {
              intervalMs: 10000,
              timeoutMs: 2000,
              failureThreshold: 3,
              recoveryThreshold: 2,
            },
            journeyConfigs: {
              [JourneyType.HEALTH]: {
                queryTimeoutMs: 3000,
              },
              [JourneyType.CARE]: {
                queryTimeoutMs: 3000,
              },
              [JourneyType.PLAN]: {
                queryTimeoutMs: 3000,
              },
            },
          },
        },
      ],
      exports: [
        PrismaService,
        TransactionService,
        JourneyContextService,
        ErrorHandlerService,
      ],
    };
  }
}