import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { ConnectionManager } from './connection/connection-manager';
import { ConnectionPool } from './connection/connection-pool';
import { ConnectionHealth } from './connection/connection-health';
import { ConnectionRetry } from './connection/connection-retry';
import { MiddlewareRegistry } from './middleware/middleware.registry';
import { MiddlewareFactory } from './middleware/middleware.factory';
import { TransactionService } from './transactions/transaction.service';
import { HealthContext } from './contexts/health.context';
import { CareContext } from './contexts/care.context';
import { PlanContext } from './contexts/plan.context';
import { BaseJourneyContext } from './contexts/base-journey.context';
import { ErrorTransformer } from './errors/error-transformer';

/**
 * Configuration options for the DatabaseModule
 */
export interface DatabaseModuleOptions {
  /**
   * Whether to register journey-specific database contexts
   * @default true
   */
  registerJourneyContexts?: boolean;

  /**
   * Whether to enable query logging
   * @default process.env.NODE_ENV !== 'production'
   */
  enableQueryLogging?: boolean;

  /**
   * Maximum number of connections in the connection pool
   * @default 10
   */
  maxConnections?: number;

  /**
   * Whether to enable performance tracking for database operations
   * @default true
   */
  enablePerformanceTracking?: boolean;

  /**
   * Custom providers to register with the module
   */
  extraProviders?: Provider[];

  /**
   * Custom journey context classes to register
   */
  customJourneyContexts?: Type<BaseJourneyContext>[];
}

/**
 * Default options for the DatabaseModule
 */
const defaultOptions: DatabaseModuleOptions = {
  registerJourneyContexts: true,
  enableQueryLogging: process.env.NODE_ENV !== 'production',
  maxConnections: 10,
  enablePerformanceTracking: true,
  extraProviders: [],
  customJourneyContexts: [],
};

/**
 * Global NestJS module that provides database services and utilities to all microservices.
 * This module configures database connections, registers providers, and enables proper
 * dependency injection across the application.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    ConnectionManager,
    ConnectionPool,
    ConnectionHealth,
    ConnectionRetry,
    MiddlewareRegistry,
    MiddlewareFactory,
    TransactionService,
    ErrorTransformer,
  ],
  exports: [
    PrismaService,
    ConnectionManager,
    TransactionService,
    ErrorTransformer,
  ],
})
export class DatabaseModule {
  /**
   * Creates a dynamically configured DatabaseModule with custom options
   * @param options Configuration options for the DatabaseModule
   * @returns A dynamically configured DatabaseModule
   */
  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    const mergedOptions = { ...defaultOptions, ...options };
    const providers: Provider[] = [
      {
        provide: 'DATABASE_OPTIONS',
        useValue: mergedOptions,
      },
      {
        provide: PrismaService,
        useFactory: (configService: ConfigService) => {
          const databaseUrl = configService.get<string>('DATABASE_URL');
          const logQueries = mergedOptions.enableQueryLogging;
          const maxConnections = mergedOptions.maxConnections;
          
          return new PrismaService({
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
            log: logQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
            connectionLimit: maxConnections,
          });
        },
        inject: [ConfigService],
      },
      ConnectionManager,
      {
        provide: ConnectionPool,
        useFactory: (configService: ConfigService) => {
          const maxConnections = mergedOptions.maxConnections;
          return new ConnectionPool({
            maxConnections,
            minConnections: Math.max(2, Math.floor(maxConnections / 4)),
            idleTimeoutMs: 30000, // 30 seconds
          });
        },
        inject: [ConfigService],
      },
      ConnectionHealth,
      ConnectionRetry,
      MiddlewareRegistry,
      MiddlewareFactory,
      TransactionService,
      ErrorTransformer,
      ...mergedOptions.extraProviders,
    ];

    // Add journey-specific database contexts if enabled
    if (mergedOptions.registerJourneyContexts) {
      providers.push(
        {
          provide: HealthContext,
          useFactory: (prisma: PrismaService, transactionService: TransactionService) => {
            return new HealthContext(prisma, transactionService);
          },
          inject: [PrismaService, TransactionService],
        },
        {
          provide: CareContext,
          useFactory: (prisma: PrismaService, transactionService: TransactionService) => {
            return new CareContext(prisma, transactionService);
          },
          inject: [PrismaService, TransactionService],
        },
        {
          provide: PlanContext,
          useFactory: (prisma: PrismaService, transactionService: TransactionService) => {
            return new PlanContext(prisma, transactionService);
          },
          inject: [PrismaService, TransactionService],
        },
        // Register custom journey contexts if provided
        ...(mergedOptions.customJourneyContexts || []).map(contextClass => ({
          provide: contextClass,
          useFactory: (prisma: PrismaService, transactionService: TransactionService) => {
            return new contextClass(prisma, transactionService);
          },
          inject: [PrismaService, TransactionService],
        })),
      );
    }

    return {
      module: DatabaseModule,
      imports: [ConfigModule],
      providers,
      exports: [
        PrismaService,
        ConnectionManager,
        TransactionService,
        ErrorTransformer,
        ...(mergedOptions.registerJourneyContexts ? [
          HealthContext,
          CareContext,
          PlanContext,
          ...(mergedOptions.customJourneyContexts || []),
        ] : []),
      ],
    };
  }

  /**
   * Creates a DatabaseModule configured for a specific journey service
   * @param journeyType The type of journey (health, care, plan)
   * @param options Additional configuration options
   * @returns A dynamically configured DatabaseModule for the specified journey
   */
  static forJourney(journeyType: 'health' | 'care' | 'plan', options: DatabaseModuleOptions = {}): DynamicModule {
    const journeyContextMap = {
      health: HealthContext,
      care: CareContext,
      plan: PlanContext,
    };

    const JourneyContext = journeyContextMap[journeyType];
    if (!JourneyContext) {
      throw new Error(`Invalid journey type: ${journeyType}`);
    }

    const mergedOptions = { ...defaultOptions, ...options };
    const providers: Provider[] = [
      {
        provide: 'DATABASE_OPTIONS',
        useValue: { ...mergedOptions, journeyType },
      },
      {
        provide: PrismaService,
        useFactory: (configService: ConfigService) => {
          const databaseUrl = configService.get<string>(`${journeyType.toUpperCase()}_DATABASE_URL`) || 
                             configService.get<string>('DATABASE_URL');
          const logQueries = mergedOptions.enableQueryLogging;
          const maxConnections = mergedOptions.maxConnections;
          
          return new PrismaService({
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
            log: logQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
            connectionLimit: maxConnections,
          });
        },
        inject: [ConfigService],
      },
      ConnectionManager,
      ConnectionPool,
      ConnectionHealth,
      ConnectionRetry,
      MiddlewareRegistry,
      MiddlewareFactory,
      TransactionService,
      ErrorTransformer,
      {
        provide: JourneyContext,
        useFactory: (prisma: PrismaService, transactionService: TransactionService) => {
          return new JourneyContext(prisma, transactionService);
        },
        inject: [PrismaService, TransactionService],
      },
      ...mergedOptions.extraProviders,
    ];

    return {
      module: DatabaseModule,
      imports: [ConfigModule],
      providers,
      exports: [
        PrismaService,
        ConnectionManager,
        TransactionService,
        ErrorTransformer,
        JourneyContext,
      ],
    };
  }

  /**
   * Creates a DatabaseModule configured for testing with mock implementations
   * @param options Additional configuration options for testing
   * @returns A dynamically configured DatabaseModule for testing
   */
  static forTesting(options: DatabaseModuleOptions = {}): DynamicModule {
    const mergedOptions = { 
      ...defaultOptions, 
      enableQueryLogging: false,
      maxConnections: 5,
      ...options 
    };

    // Mock implementations for testing
    const mockPrismaService = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn().mockImplementation(callback => callback({})),
      $on: jest.fn(),
    };

    const providers: Provider[] = [
      {
        provide: 'DATABASE_OPTIONS',
        useValue: mergedOptions,
      },
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
      {
        provide: ConnectionManager,
        useValue: {
          getConnection: jest.fn().mockReturnValue(mockPrismaService),
          releaseConnection: jest.fn(),
        },
      },
      {
        provide: TransactionService,
        useValue: {
          startTransaction: jest.fn().mockImplementation(callback => callback(mockPrismaService)),
          commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(),
        },
      },
      {
        provide: ErrorTransformer,
        useValue: {
          transformError: jest.fn(error => error),
        },
      },
      ...mergedOptions.extraProviders,
    ];

    // Add mock journey contexts if enabled
    if (mergedOptions.registerJourneyContexts) {
      const mockJourneyContext = {
        findById: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(data => data),
        update: jest.fn().mockImplementation(data => data),
        delete: jest.fn().mockResolvedValue(true),
        transaction: jest.fn().mockImplementation(callback => callback(mockPrismaService)),
      };

      providers.push(
        {
          provide: HealthContext,
          useValue: { ...mockJourneyContext },
        },
        {
          provide: CareContext,
          useValue: { ...mockJourneyContext },
        },
        {
          provide: PlanContext,
          useValue: { ...mockJourneyContext },
        },
      );
    }

    return {
      module: DatabaseModule,
      providers,
      exports: [
        PrismaService,
        ConnectionManager,
        TransactionService,
        ErrorTransformer,
        ...(mergedOptions.registerJourneyContexts ? [
          HealthContext,
          CareContext,
          PlanContext,
        ] : []),
      ],
    };
  }
}