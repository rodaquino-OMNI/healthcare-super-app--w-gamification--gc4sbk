import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Service for interacting with the database using Prisma ORM
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Creates a new instance of the PrismaService
   * 
   * @param configService - Service for accessing configuration
   */
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  /**
   * Lifecycle hook that is called once the module has been initialized.
   * Connects to the database and sets up logging.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');

    // Set up logging for Prisma events
    this.$on('query', (e) => {
      this.logger.debug(`Query: ${e.query}`, {
        params: e.params,
        duration: e.duration,
      });
    });

    this.$on('error', (e) => {
      this.logger.error('Prisma error', {
        message: e.message,
        target: e.target,
      });
    });

    this.$on('info', (e) => {
      this.logger.log(`Prisma info: ${e.message}`, {
        target: e.target,
      });
    });

    this.$on('warn', (e) => {
      this.logger.warn(`Prisma warning: ${e.message}`, {
        target: e.target,
      });
    });

    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Lifecycle hook that is called when the module is being destroyed.
   * Disconnects from the database.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Successfully disconnected from database');
  }
}