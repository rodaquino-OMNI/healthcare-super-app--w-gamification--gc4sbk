import { DynamicModule, Global, Inject, Logger, Module, OnModuleDestroy, OnModuleInit, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { ConnectionManager } from './connection/connection-manager';
import { ConnectionPool } from './connection/connection-pool';
import { ConnectionHealth } from './connection/connection-health';
import { ConnectionRetry } from './connection/connection-retry';
import { ConnectionConfig } from './connection/connection-config';
import { TransactionService } from './transactions/transaction.service';
import { MiddlewareRegistry } from './middleware/middleware.registry';
import { MiddlewareFactory } from './middleware/middleware.factory';
import { CircuitBreakerMiddleware } from './middleware/circuit-breaker.middleware';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { PerformanceMiddleware } from './middleware/performance.middleware';
import { TransformationMiddleware } from './middleware/transformation.middleware';
import { ErrorTransformer } from './errors/error-transformer';
import { DatabaseException } from './errors/database-error.exception';
import { HealthContext } from './contexts/health.context';
import { CareContext } from './contexts/care.context';
import { PlanContext } from './contexts/plan.context';
import { BaseJourneyContext } from './contexts/base-journey.context';
import { JourneyType } from './types/journey.types';
import { DatabaseErrorType } from './errors/database-error.types';

/**
 * Configuration options for the DatabaseModule
 */
export interface DatabaseModuleOptions {
  /**
   * The journey type this service belongs to (Health, Care, Plan)
   * Used to provide the appropriate journey-specific database context
   */
  journeyType?: JourneyType;

  /**
   * Whether to enable query logging
   * @default true in development, false in production
   */
  enableLogging?: boolean;

  /**
   * Whether to enable performance tracking
   * @default true
   */
  enablePerformanceTracking?: boolean;

  /**
   * Whether to enable the circuit breaker pattern
   * @default true
   */
  enableCircuitBreaker?: boolean;

  /**
   * Whether to enable query transformation
   * @default true
   */
  enableTransformation?: boolean;

  /**
   * Connection pool configuration
   */
  connectionPool?: {
    /**
     * Minimum number of connections to keep in the pool
     * @default 2
     */
    minConnections?: number;

    /**
     * Maximum number of connections allowed in the pool
     * @default 10
     */
    maxConnections?: number;

    /**
     * Maximum number of idle connections to keep in the pool
     * @default 5
     */
    maxIdleConnections?: number;

    /**
     * Connection timeout in milliseconds
     * @default 5000
     */
    connectionTimeout?: number;
  };

  /**
   * Retry configuration for database operations
   */
  retry?: {
    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxRetries?: number;

    /**
     * Base delay between retries in milliseconds
     * @default 100
     */
    baseDelay?: number;

    /**
     * Maximum delay between retries in milliseconds
     * @default 5000
     */
    maxDelay?: number;

    /**
     * Whether to use jitter to prevent retry storms
     * @default true
     */
    useJitter?: boolean;
  };

  /**
   * Custom providers to register with the module
   */
  providers?: Provider[];

  /**
   * Whether to register the module globally
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Database URL override
   * If not provided, will use the value from ConfigService
   */
  databaseUrl?: string;

  /**
   * Whether to enable schema validation for database operations
   * @default true
   */
  enableSchemaValidation?: boolean;

  /**
   * Whether to automatically apply database migrations on module init
   * @default false
   */
  autoApplyMigrations?: boolean;
}

/**
 * Default options for the DatabaseModule
 */
const defaultOptions: DatabaseModuleOptions = {
  enableLogging: process.env.NODE_ENV !== 'production',
  enablePerformanceTracking: true,
  enableCircuitBreaker: true,
  enableTransformation: true,
  enableSchemaValidation: true,
  autoApplyMigrations: false,
  isGlobal: true,
  connectionPool: {
    minConnections: 2,
    maxConnections: 10,
    maxIdleConnections: 5,
    connectionTimeout: 5000,
  },
  retry: {
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 5000,
    useJitter: true,
  },
};

/**
 * Global NestJS module that provides database services and utilities to all microservices.
 * This module configures database connections, registers providers, and enables proper
 * dependency injection across the application.
 *
 * Features:
 * - Enhanced PrismaService with connection pooling and optimization
 * - Journey-specific database contexts (Health, Care, Plan)
 * - Comprehensive transaction management
 * - Middleware for logging, performance tracking, and circuit breaking
 * - Error handling with retry mechanisms
 *
 * @example
 * // Import with default configuration
 * @Module({
 *   imports: [DatabaseModule.forRoot()],
 * })
 * export class AppModule {}
 *
 * @example
 * // Import with custom configuration
 * @Module({
 *   imports: [
 *     DatabaseModule.forRoot({
 *       journeyType: JourneyType.HEALTH,
 *       enableLogging: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
/**
 * Service that initializes and manages the database module lifecycle
 */
export class DatabaseModuleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModuleService.name);

  constructor(
    @Inject('DATABASE_MODULE_OPTIONS')
    private readonly options: DatabaseModuleOptions,
    private readonly prismaService: PrismaService,
    private readonly connectionManager: ConnectionManager,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initializes the database module when the application starts
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing database module...');

    try {
      // Apply database migrations if configured
      if (this.options.autoApplyMigrations) {
        this.logger.log('Applying database migrations...');
        await this.prismaService.applyMigrations();
      }

      // Initialize connection pool
      await this.connectionManager.initialize({
        minConnections: this.options.connectionPool?.minConnections,
        maxConnections: this.options.connectionPool?.maxConnections,
        maxIdleConnections: this.options.connectionPool?.maxIdleConnections,
        connectionTimeout: this.options.connectionPool?.connectionTimeout,
      });

      this.logger.log('Database module initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database module', error);
      throw new DatabaseException(
        'Failed to initialize database module',
        DatabaseErrorType.CONNECTION,
        { cause: error },
      );
    }
  }

  /**
   * Cleans up database resources when the application shuts down
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down database module...');

    try {
      await this.connectionManager.shutdown();
      await this.prismaService.$disconnect();
      this.logger.log('Database module shut down successfully');
    } catch (error) {
      this.logger.error('Error during database module shutdown', error);
    }
  }
}

@Global()
@Module({
  imports: [ConfigModule],
})
export class DatabaseModule {
  /**
   * Creates a dynamic module with the specified configuration options
   * @param options Configuration options for the DatabaseModule
   * @returns A dynamic module configuration
   */
  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    const mergedOptions = { ...defaultOptions, ...options };
    const providers = this.createProviders(mergedOptions);

    return {
      module: DatabaseModule,
      imports: [ConfigModule],
      providers,
      exports: providers,
      global: mergedOptions.isGlobal,
    };
  }
  
  /**
   * Creates a dynamic module with async configuration options
   * @param options Async configuration options for the DatabaseModule
   * @returns A dynamic module configuration
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [...(options.imports || []), ConfigModule],
      providers: [
        ...this.createProviders(defaultOptions),
        {
          provide: 'DATABASE_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: DatabaseModuleService,
          useFactory: (moduleOptions: DatabaseModuleOptions, prismaService: PrismaService, connectionManager: ConnectionManager, configService: ConfigService) => {
            return new DatabaseModuleService(
              { ...defaultOptions, ...moduleOptions },
              prismaService,
              connectionManager,
              configService,
            );
          },
          inject: ['DATABASE_MODULE_OPTIONS', PrismaService, ConnectionManager, ConfigService],
        },
      ],
      exports: [
        PrismaService,
        ConnectionManager,
        ConnectionPool,
        ConnectionHealth,
        ConnectionRetry,
        TransactionService,
        ErrorTransformer,
        MiddlewareRegistry,
        MiddlewareFactory,
        LoggingMiddleware,
        PerformanceMiddleware,
        CircuitBreakerMiddleware,
        TransformationMiddleware,
        BaseJourneyContext,
        HealthContext,
        CareContext,
        PlanContext,
        'DATABASE_MODULE_OPTIONS',
      ],
      global: true,
    };
  }

  /**
   * Creates a dynamic module specifically for a journey service
   * @param journeyType The journey type (Health, Care, Plan)
   * @param options Additional configuration options
   * @returns A dynamic module configuration
   */
  static forJourney(
    journeyType: JourneyType,
    options: Omit<DatabaseModuleOptions, 'journeyType'> = {},
  ): DynamicModule {
    return this.forRoot({
      ...options,
      journeyType,
    });
  }

  /**
   * Creates the providers for the module based on the configuration options
   * @param options Configuration options
   * @returns An array of providers
   * @private
   */
  private static createProviders(options: DatabaseModuleOptions): Provider[] {
    // Core providers that are always included
    const coreProviders: Provider[] = [
      // Database module service for lifecycle management
      DatabaseModuleService,
      
      // Main database service
      {
        provide: PrismaService,
        useFactory: (configService: ConfigService, options: DatabaseModuleOptions) => {
          const databaseUrl = options.databaseUrl || configService.get<string>('database.url');
          if (!databaseUrl) {
            throw new Error('Database URL is not configured. Please provide it via environment variables or module options.');
          }
          
          return new PrismaService({
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
            log: options.enableLogging 
              ? ['query', 'info', 'warn', 'error']
              : ['warn', 'error'],
          });
        },
        inject: [ConfigService, 'DATABASE_MODULE_OPTIONS'],
      },
      
      // Connection management
      {
        provide: ConnectionManager,
        useFactory: (configService: ConfigService, options: DatabaseModuleOptions) => {
          return new ConnectionManager({
            poolConfig: {
              minConnections: options.connectionPool?.minConnections || 2,
              maxConnections: options.connectionPool?.maxConnections || 10,
              maxIdleConnections: options.connectionPool?.maxIdleConnections || 5,
              connectionTimeout: options.connectionPool?.connectionTimeout || 5000,
            },
            retryConfig: {
              maxRetries: options.retry?.maxRetries || 3,
              baseDelay: options.retry?.baseDelay || 100,
              maxDelay: options.retry?.maxDelay || 5000,
              useJitter: options.retry?.useJitter !== false,
            },
          });
        },
        inject: [ConfigService, 'DATABASE_MODULE_OPTIONS'],
      },
      
      // Other core services
      ConnectionPool,
      ConnectionHealth,
      ConnectionRetry,
      ConnectionConfig,
      TransactionService,
      ErrorTransformer,
      MiddlewareRegistry,
      MiddlewareFactory,
      {
        provide: 'DATABASE_MODULE_OPTIONS',
        useValue: options,
      },
    ];

    // Middleware providers based on configuration
    const middlewareProviders: Provider[] = [];

    if (options.enableLogging) {
      middlewareProviders.push({
        provide: LoggingMiddleware,
        useFactory: (configService: ConfigService) => {
          return new LoggingMiddleware({
            logLevel: configService.get<string>('database.logLevel') || 'info',
            includeParameters: process.env.NODE_ENV !== 'production',
            redactSensitiveData: process.env.NODE_ENV === 'production',
          });
        },
        inject: [ConfigService],
      });
    }

    if (options.enablePerformanceTracking) {
      middlewareProviders.push({
        provide: PerformanceMiddleware,
        useFactory: (configService: ConfigService) => {
          return new PerformanceMiddleware({
            slowQueryThreshold: configService.get<number>('database.slowQueryThreshold') || 1000,
            enableMetrics: true,
            trackStackTrace: process.env.NODE_ENV !== 'production',
          });
        },
        inject: [ConfigService],
      });
    }

    if (options.enableCircuitBreaker) {
      middlewareProviders.push({
        provide: CircuitBreakerMiddleware,
        useFactory: (configService: ConfigService) => {
          return new CircuitBreakerMiddleware({
            failureThreshold: configService.get<number>('database.circuitBreaker.failureThreshold') || 5,
            resetTimeout: configService.get<number>('database.circuitBreaker.resetTimeout') || 30000,
            halfOpenMaxCalls: configService.get<number>('database.circuitBreaker.halfOpenMaxCalls') || 3,
          });
        },
        inject: [ConfigService],
      });
    }

    if (options.enableTransformation) {
      middlewareProviders.push(TransformationMiddleware);
    }

    // Journey-specific context providers
    const journeyProviders: Provider[] = [];

    // Always provide the base journey context
    journeyProviders.push(BaseJourneyContext);

    if (options.journeyType) {
      switch (options.journeyType) {
        case JourneyType.HEALTH:
          journeyProviders.push({
            provide: HealthContext,
            useFactory: (prisma: PrismaService, txService: TransactionService) => {
              return new HealthContext(prisma, txService);
            },
            inject: [PrismaService, TransactionService],
          });
          break;
        case JourneyType.CARE:
          journeyProviders.push({
            provide: CareContext,
            useFactory: (prisma: PrismaService, txService: TransactionService) => {
              return new CareContext(prisma, txService);
            },
            inject: [PrismaService, TransactionService],
          });
          break;
        case JourneyType.PLAN:
          journeyProviders.push({
            provide: PlanContext,
            useFactory: (prisma: PrismaService, txService: TransactionService) => {
              return new PlanContext(prisma, txService);
            },
            inject: [PrismaService, TransactionService],
          });
          break;
      }
    }

    // Combine all providers
    return [
      ...coreProviders,
      ...middlewareProviders,
      ...journeyProviders,
      ...(options.providers || []),
    ];
  }

  /**
   * Creates a dynamic module for testing purposes with mock implementations
   * @param mockPrismaService Optional mock implementation of PrismaService
   * @param options Additional testing configuration options
   * @returns A dynamic module configuration for testing
   */
  static forTesting(
    mockPrismaService?: Type<PrismaService>,
    options: Partial<DatabaseModuleOptions> = {},
  ): DynamicModule {
    const testOptions: DatabaseModuleOptions = {
      ...defaultOptions,
      enableLogging: false,
      autoApplyMigrations: false,
      databaseUrl: 'postgresql://test:test@localhost:5432/test',
      ...options,
    };

    const providers: Provider[] = [
      // Module service for lifecycle management
      DatabaseModuleService,
      
      // Mock PrismaService
      {
        provide: PrismaService,
        useClass: mockPrismaService || class MockPrismaService {
          $connect = jest.fn().mockResolvedValue(undefined);
          $disconnect = jest.fn().mockResolvedValue(undefined);
          applyMigrations = jest.fn().mockResolvedValue(undefined);
          $transaction = jest.fn().mockImplementation((fn) => fn(this));
          $on = jest.fn();
          $use = jest.fn();
        },
      },
      
      // Mock connection services
      {
        provide: ConnectionManager,
        useValue: {
          initialize: jest.fn().mockResolvedValue(undefined),
          shutdown: jest.fn().mockResolvedValue(undefined),
          getConnection: jest.fn().mockReturnValue({}),
          releaseConnection: jest.fn(),
        },
      },
      {
        provide: ConnectionPool,
        useValue: {
          initialize: jest.fn().mockResolvedValue(undefined),
          shutdown: jest.fn().mockResolvedValue(undefined),
          acquire: jest.fn().mockResolvedValue({}),
          release: jest.fn(),
        },
      },
      {
        provide: ConnectionHealth,
        useValue: {
          checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
          registerHealthCheck: jest.fn(),
        },
      },
      {
        provide: ConnectionRetry,
        useValue: {
          executeWithRetry: jest.fn().mockImplementation((fn) => fn()),
          getRetryStrategy: jest.fn().mockReturnValue({
            shouldRetry: jest.fn().mockReturnValue(true),
            getDelay: jest.fn().mockReturnValue(100),
          }),
        },
      },
      
      // Mock transaction service
      {
        provide: TransactionService,
        useValue: {
          startTransaction: jest.fn().mockResolvedValue({}),
          commitTransaction: jest.fn().mockResolvedValue(undefined),
          rollbackTransaction: jest.fn().mockResolvedValue(undefined),
          executeInTransaction: jest.fn().mockImplementation(async (fn) => fn({})),
        },
      },
      
      // Other services
      ConnectionConfig,
      ErrorTransformer,
      MiddlewareRegistry,
      MiddlewareFactory,
      LoggingMiddleware,
      PerformanceMiddleware,
      CircuitBreakerMiddleware,
      TransformationMiddleware,
      
      // Mock journey contexts
      {
        provide: BaseJourneyContext,
        useValue: {
          executeQuery: jest.fn().mockResolvedValue([]),
          executeTransaction: jest.fn().mockImplementation(async (fn) => fn({})),
        },
      },
      {
        provide: HealthContext,
        useValue: {
          executeQuery: jest.fn().mockResolvedValue([]),
          executeTransaction: jest.fn().mockImplementation(async (fn) => fn({})),
          getHealthMetrics: jest.fn().mockResolvedValue([]),
          createHealthGoal: jest.fn().mockResolvedValue({}),
        },
      },
      {
        provide: CareContext,
        useValue: {
          executeQuery: jest.fn().mockResolvedValue([]),
          executeTransaction: jest.fn().mockImplementation(async (fn) => fn({})),
          getAppointments: jest.fn().mockResolvedValue([]),
          createAppointment: jest.fn().mockResolvedValue({}),
        },
      },
      {
        provide: PlanContext,
        useValue: {
          executeQuery: jest.fn().mockResolvedValue([]),
          executeTransaction: jest.fn().mockImplementation(async (fn) => fn({})),
          getPlans: jest.fn().mockResolvedValue([]),
          createClaim: jest.fn().mockResolvedValue({}),
        },
      },
      
      // Configuration
      {
        provide: 'DATABASE_MODULE_OPTIONS',
        useValue: testOptions,
      },
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn().mockImplementation((key: string) => {
            if (key === 'database.url') return testOptions.databaseUrl;
            if (key === 'database.poolSize') return testOptions.connectionPool?.maxConnections;
            if (key === 'database.connectionTimeout') return testOptions.connectionPool?.connectionTimeout;
            if (key === 'database.logLevel') return 'error';
            if (key === 'database.slowQueryThreshold') return 2000;
            if (key === 'database.circuitBreaker.failureThreshold') return 3;
            if (key === 'database.circuitBreaker.resetTimeout') return 10000;
            if (key === 'database.circuitBreaker.halfOpenMaxCalls') return 2;
            return undefined;
          }),
        },
      },
    ];

    return {
      module: DatabaseModule,
      providers,
      exports: providers,
      global: true,
    };
  }
}