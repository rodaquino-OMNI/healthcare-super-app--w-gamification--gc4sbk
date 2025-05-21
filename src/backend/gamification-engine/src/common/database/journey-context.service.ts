import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

// Import journey-specific interfaces
import { JourneyType } from '../interfaces/journey.interface';
import { 
  IJourneyContext, 
  IJourneyContextService, 
  IJourneyContextOptions,
  ITransactionOptions,
  IDatabaseErrorHandler,
  ITransactionHandler
} from './interfaces';
import { PrismaService } from './prisma.service';
import { ErrorHandlerService } from './error-handler.service';
import { TransactionService } from './transaction.service';
import { DATABASE_CONNECTION_POOL_SIZE, DATABASE_QUERY_TIMEOUT } from './constants';

/**
 * Service that provides journey-specific database contexts for the gamification engine.
 * Enables isolation of database operations by journey (health, care, plan) while
 * maintaining consistent access patterns.
 *
 * This service creates and manages separate database contexts for each journey type,
 * allowing for journey-specific query optimizations, connection pooling, and error handling.
 * It ensures data integrity through transaction isolation and provides consistent
 * access patterns across all journey types.
 */
@Injectable()
export class JourneyContextService implements IJourneyContextService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JourneyContextService.name);
  private readonly journeyContexts = new Map<JourneyType, IJourneyContext>();
  private readonly connectionPoolSize: number;
  private readonly queryTimeout: number;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly transactionService: TransactionService,
    private readonly configService: ConfigService,
  ) {
    // Get configuration values with defaults
    this.connectionPoolSize = this.configService.get<number>('DATABASE_CONNECTION_POOL_SIZE', DATABASE_CONNECTION_POOL_SIZE);
    this.queryTimeout = this.configService.get<number>('DATABASE_QUERY_TIMEOUT', DATABASE_QUERY_TIMEOUT);
    
    this.logger.log(`Initializing journey contexts with connection pool size: ${this.connectionPoolSize}`);
  }

  /**
   * Initialize journey contexts when the module is initialized
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing journey-specific database contexts');
    await this.initializeJourneyContexts();
  }

  /**
   * Clean up journey contexts when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Cleaning up journey-specific database contexts');
    await this.cleanupJourneyContexts();
  }

  /**
   * Initialize all journey contexts with optimized connection pools
   */
  private async initializeJourneyContexts(): Promise<void> {
    try {
      // Initialize contexts for each journey type
      await Promise.all([
        this.initializeJourneyContext(JourneyType.HEALTH),
        this.initializeJourneyContext(JourneyType.CARE),
        this.initializeJourneyContext(JourneyType.PLAN),
      ]);
      
      this.logger.log('Successfully initialized all journey contexts');
    } catch (error) {
      this.logger.error('Failed to initialize journey contexts', error);
      throw this.errorHandlerService.handleError(error, {
        operation: 'initializeJourneyContexts',
        context: 'JourneyContextService',
      });
    }
  }

  /**
   * Initialize a specific journey context with optimized connection pool
   * @param journeyType The type of journey to initialize context for
   */
  private async initializeJourneyContext(journeyType: JourneyType): Promise<void> {
    try {
      this.logger.log(`Initializing ${journeyType} journey context`);
      
      // Create a new Prisma client instance with journey-specific configuration
      const journeyClient = new PrismaClient({
        log: this.getJourneySpecificLogLevels(journeyType),
        datasources: {
          db: {
            url: this.configService.get<string>('DATABASE_URL'),
          },
        },
        // Journey-specific query engine configuration
        engineConfig: {
          connectionLimit: Math.floor(this.connectionPoolSize / 3), // Divide pool among journeys
        },
      });

      // Connect to the database
      await journeyClient.$connect();
      
      // Create journey context with middleware for journey-specific query handling
      journeyClient.$use(async (params, next) => {
        const startTime = Date.now();
        
        // Add journey context to query for logging and metrics
        params.args = params.args || {};
        params.args.journeyContext = journeyType;
        
        // Execute the query with timeout
        const result = await Promise.race([
          next(params),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Query timeout after ${this.queryTimeout}ms for journey ${journeyType}`));
            }, this.queryTimeout);
          }),
        ]);
        
        // Log query performance metrics
        const duration = Date.now() - startTime;
        this.logger.debug(
          `[${journeyType}] ${params.model}.${params.action} completed in ${duration}ms`,
          { model: params.model, action: params.action, duration }
        );
        
        return result;
      });

      // Create journey context with the client and add to map
      const journeyContext: IJourneyContext = {
        client: journeyClient,
        journeyType,
        async executeTransaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>, options?: ITransactionOptions): Promise<T> {
          return this.transactionService.executeTransaction(journeyClient, callback, {
            ...options,
            journeyType,
            isolationLevel: options?.isolationLevel || 'ReadCommitted', // Default isolation level
          });
        },
        async release(): Promise<void> {
          try {
            await journeyClient.$disconnect();
          } catch (error) {
            this.logger.error(`Error disconnecting ${journeyType} journey client`, error);
          }
        }
      };

      this.journeyContexts.set(journeyType, journeyContext);
      this.logger.log(`Successfully initialized ${journeyType} journey context`);
    } catch (error) {
      this.logger.error(`Failed to initialize ${journeyType} journey context`, error);
      throw this.errorHandlerService.handleError(error, {
        operation: 'initializeJourneyContext',
        context: 'JourneyContextService',
        journeyType,
      });
    }
  }

  /**
   * Clean up all journey contexts and disconnect from database
   */
  private async cleanupJourneyContexts(): Promise<void> {
    try {
      const disconnectPromises = [];
      
      // Disconnect each journey client
      for (const [journeyType, context] of this.journeyContexts.entries()) {
        this.logger.log(`Disconnecting ${journeyType} journey context`);
        disconnectPromises.push(context.client.$disconnect());
      }
      
      await Promise.all(disconnectPromises);
      this.journeyContexts.clear();
      
      this.logger.log('Successfully cleaned up all journey contexts');
    } catch (error) {
      this.logger.error('Error cleaning up journey contexts', error);
      // Just log the error during cleanup, don't throw
    }
  }
  
  /**
   * Release all contexts managed by this service
   */
  async releaseAllContexts(): Promise<void> {
    try {
      const releasePromises = [];
      
      // Release each journey context
      for (const [journeyType, context] of this.journeyContexts.entries()) {
        this.logger.log(`Releasing ${journeyType} journey context`);
        releasePromises.push(context.release());
      }
      
      await Promise.all(releasePromises);
      this.journeyContexts.clear();
      
      this.logger.log('Successfully released all journey contexts');
    } catch (error) {
      this.logger.error('Error releasing journey contexts', error);
      throw this.errorHandlerService.handleError(error, {
        operation: 'releaseAllContexts',
        context: 'JourneyContextService',
      });
    }
  }

  /**
   * Get a database context for a specific journey
   * @param journeyType The type of journey to get context for
   * @param options Optional context configuration options
   * @returns The journey-specific database context
   */
  getContext(journeyType: JourneyType, options?: IJourneyContextOptions): IJourneyContext {
    const context = this.journeyContexts.get(journeyType);
    
    if (!context) {
      this.logger.error(`Journey context not found for ${journeyType}`);
      throw new Error(`Journey context not found for ${journeyType}`);
    }
    
    // Apply any context options if provided
    if (options) {
      this.applyContextOptions(context, options);
    }
    
    return context;
  }
  
  /**
   * Apply context options to a journey context
   * @param context The journey context to apply options to
   * @param options The options to apply
   */
  private applyContextOptions(context: IJourneyContext, options: IJourneyContextOptions): void {
    // Apply middleware if provided
    if (options.middleware && options.middleware.length > 0) {
      const client = context.client as PrismaClient;
      
      for (const middleware of options.middleware) {
        client.$use(middleware);
      }
    }
    
    // Other options can be applied as needed
    this.logger.debug(`Applied context options to ${context.journeyType} journey context`, options);
  }

  /**
   * Execute a database operation in the context of a specific journey
   * @param journeyType The type of journey to execute in
   * @param operation The database operation to execute
   * @param options Optional context options
   * @returns The result of the operation
   */
  async executeInJourneyContext<T>(
    journeyType: JourneyType,
    operation: (client: PrismaClient) => Promise<T>,
    options?: IJourneyContextOptions
  ): Promise<T> {
    try {
      const context = this.getContext(journeyType, options);
      return await operation(context.client as PrismaClient);
    } catch (error) {
      this.logger.error(`Error executing in ${journeyType} journey context`, error);
      throw this.errorHandlerService.handleError(error, {
        operation: 'executeInJourneyContext',
        context: 'JourneyContextService',
        journeyType,
      });
    }
  }

  /**
   * Execute a database operation in a transaction within a specific journey context
   * @param journeyType The type of journey to execute in
   * @param operation The database operation to execute in a transaction
   * @param options Optional transaction options
   * @returns The result of the operation
   */
  async executeInJourneyTransaction<T>(
    journeyType: JourneyType,
    operation: (client: Prisma.TransactionClient) => Promise<T>,
    options?: ITransactionOptions
  ): Promise<T> {
    try {
      const context = this.getContext(journeyType);
      return await context.executeTransaction(operation, options);
    } catch (error) {
      this.logger.error(`Error executing transaction in ${journeyType} journey context`, error);
      throw this.errorHandlerService.handleError(error, {
        operation: 'executeInJourneyTransaction',
        context: 'JourneyContextService',
        journeyType,
      });
    }
  }

  /**
   * Get journey-specific log levels based on environment and journey type
   * @param journeyType The type of journey to get log levels for
   * @returns Array of Prisma log levels
   */
  private getJourneySpecificLogLevels(journeyType: JourneyType): Array<{
    level: 'query' | 'info' | 'warn' | 'error';
    emit: 'stdout' | 'event';
  }> {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    // Base log levels for all environments
    const baseLogLevels = [
      { level: 'error', emit: 'stdout' as const },
      { level: 'warn', emit: 'stdout' as const },
    ];
    
    // Add more detailed logging in non-production environments
    if (!isProduction) {
      // For health journey, add query logging for performance optimization
      if (journeyType === JourneyType.HEALTH) {
        baseLogLevels.push({ level: 'query', emit: 'event' as const });
      }
      
      // Add info logging for all journeys in development
      baseLogLevels.push({ level: 'info', emit: 'stdout' as const });
    }
    
    return baseLogLevels;
  }

  /**
   * Get all available journey contexts
   * @returns Map of journey types to their contexts
   */
  getAllJourneyContexts(): Map<JourneyType, IJourneyContext> {
    return new Map(this.journeyContexts);
  }
  
  /**
   * Create specialized journey contexts for specific journey types
   * This method creates journey-specific implementations with optimized
   * query methods for each journey type.
   */
  async createSpecializedJourneyContexts(): Promise<void> {
    try {
      // Create specialized contexts for each journey type
      await Promise.all([
        this.createHealthJourneyContext(),
        this.createCareJourneyContext(),
        this.createPlanJourneyContext()
      ]);
      
      this.logger.log('Successfully created specialized journey contexts');
    } catch (error) {
      this.logger.error('Failed to create specialized journey contexts', error);
      throw this.errorHandlerService.handleError(error, {
        operation: 'createSpecializedJourneyContexts',
        context: 'JourneyContextService'
      });
    }
  }
  
  /**
   * Create a specialized context for the Health journey
   * with optimized query methods for health-related gamification
   */
  private async createHealthJourneyContext(): Promise<void> {
    // Implementation will be added in a future update
    // This will include specialized methods for health metrics, goals, and device connections
    this.logger.log('Health journey context specialization is planned for future implementation');
  }
  
  /**
   * Create a specialized context for the Care journey
   * with optimized query methods for care-related gamification
   */
  private async createCareJourneyContext(): Promise<void> {
    // Implementation will be added in a future update
    // This will include specialized methods for appointments, medications, and treatments
    this.logger.log('Care journey context specialization is planned for future implementation');
  }
  
  /**
   * Create a specialized context for the Plan journey
   * with optimized query methods for plan-related gamification
   */
  private async createPlanJourneyContext(): Promise<void> {
    // Implementation will be added in a future update
    // This will include specialized methods for plans, benefits, and claims
    this.logger.log('Plan journey context specialization is planned for future implementation');
  }
}