import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaService } from './prisma.service';
import { TransactionService } from './transaction.service';
import { DatabaseErrorHandlerService } from './error-handler.service';
import { JourneyContextService } from './journey-context.service';
import { IGamificationDatabaseService } from './interfaces';
import { GamificationDatabaseService } from './gamification-database.service';

/**
 * Database module configuration options
 */
export interface DatabaseModuleOptions {
  /**
   * Whether to make the module global
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Whether to enable query logging
   * @default process.env.NODE_ENV !== 'production'
   */
  enableQueryLogging?: boolean;

  /**
   * Whether to enable performance logging
   * @default process.env.NODE_ENV !== 'production'
   */
  enablePerformanceLogging?: boolean;

  /**
   * Maximum number of connections in the pool
   * @default 25
   */
  maxConnections?: number;
}

/**
 * NestJS module that registers and exports all database services for the gamification engine.
 * Provides a unified entry point for database access, ensuring consistent database configuration
 * across the application and proper lifecycle management.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    DatabaseErrorHandlerService,
    TransactionService,
    JourneyContextService,
    {
      provide: IGamificationDatabaseService,
      useClass: GamificationDatabaseService,
    },
  ],
  exports: [
    PrismaService,
    DatabaseErrorHandlerService,
    TransactionService,
    JourneyContextService,
    IGamificationDatabaseService,
  ],
})
export class DatabaseModule {
  /**
   * Register the database module with custom options
   * 
   * @param options Configuration options for the database module
   * @returns Configured database module
   */
  static register(options: DatabaseModuleOptions = {}): DynamicModule {
    const isGlobal = options.isGlobal ?? true;
    
    // Define providers with custom configuration
    const providers: Provider[] = [
      {
        provide: 'DATABASE_MODULE_OPTIONS',
        useValue: {
          enableQueryLogging: options.enableQueryLogging ?? process.env.NODE_ENV !== 'production',
          enablePerformanceLogging: options.enablePerformanceLogging ?? process.env.NODE_ENV !== 'production',
          maxConnections: options.maxConnections ?? 25,
        },
      },
      PrismaService,
      DatabaseErrorHandlerService,
      TransactionService,
      JourneyContextService,
      {
        provide: IGamificationDatabaseService,
        useClass: GamificationDatabaseService,
      },
    ];

    return {
      module: DatabaseModule,
      global: isGlobal,
      imports: [ConfigModule],
      providers,
      exports: [
        PrismaService,
        DatabaseErrorHandlerService,
        TransactionService,
        JourneyContextService,
        IGamificationDatabaseService,
      ],
    };
  }

  /**
   * Register the database module for testing with mock implementations
   * 
   * @returns Configured database module for testing
   */
  static registerForTesting(): DynamicModule {
    // Define mock providers for testing
    const mockPrismaService = {
      provide: PrismaService,
      useFactory: () => ({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $on: jest.fn(),
        $transaction: jest.fn((fn) => fn({})),
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
      }),
    };

    const mockErrorHandlerService = {
      provide: DatabaseErrorHandlerService,
      useFactory: () => ({
        handleError: jest.fn((error) => error),
        isTransientError: jest.fn(() => false),
        getRetryStrategy: jest.fn(),
        logError: jest.fn(),
        executeWithRetry: jest.fn((fn) => fn()),
      }),
    };

    return {
      module: DatabaseModule,
      global: true,
      providers: [
        mockPrismaService,
        mockErrorHandlerService,
        TransactionService,
        JourneyContextService,
        {
          provide: IGamificationDatabaseService,
          useClass: GamificationDatabaseService,
        },
      ],
      exports: [
        PrismaService,
        DatabaseErrorHandlerService,
        TransactionService,
        JourneyContextService,
        IGamificationDatabaseService,
      ],
    };
  }

  /**
   * Register the database module with journey-specific configuration
   * 
   * @param journeyOptions Configuration options specific to each journey
   * @returns Configured database module with journey-specific settings
   */
  static registerWithJourneyConfig(journeyOptions: Record<string, any> = {}): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'JOURNEY_DATABASE_OPTIONS',
          useValue: journeyOptions,
        },
        PrismaService,
        DatabaseErrorHandlerService,
        TransactionService,
        {
          provide: JourneyContextService,
          useFactory: (prisma: PrismaService, txService: TransactionService, errorHandler: DatabaseErrorHandlerService) => {
            return new JourneyContextService(prisma, txService, errorHandler);
          },
          inject: [PrismaService, TransactionService, DatabaseErrorHandlerService],
        },
        {
          provide: IGamificationDatabaseService,
          useClass: GamificationDatabaseService,
        },
      ],
      exports: [
        PrismaService,
        DatabaseErrorHandlerService,
        TransactionService,
        JourneyContextService,
        IGamificationDatabaseService,
      ],
    };
  }
}