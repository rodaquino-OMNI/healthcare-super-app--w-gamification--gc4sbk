import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LoggerService } from '@app/logging';
import * as path from 'path';

/**
 * Handles database configuration validation and error handling
 * during application bootstrap.
 */
@Injectable()
export class DatabaseErrorHandler implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Validates database configuration on application bootstrap
   */
  onApplicationBootstrap() {
    const dbConfig = this.configService.get('database');

    if (!dbConfig) {
      this.logger.warn(
        'Database configuration not found. Using default configuration.',
        'DatabaseErrorHandler',
      );
      return;
    }

    this.logger.log(
      `Database configuration loaded: ${dbConfig.type} at ${dbConfig.host || dbConfig.url}`,
      'DatabaseErrorHandler',
    );
  }

  /**
   * Creates TypeORM connection options from configuration
   * @param config ConfigService instance
   * @returns TypeOrmModuleOptions for database connection
   */
  static createTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
    try {
      const dbConfig = config.get('database');

      if (!dbConfig) {
        return {
          autoLoadEntities: true,
          synchronize: false,
        };
      }

      // Determine connection options based on URL or individual parameters
      const connectionOptions: TypeOrmModuleOptions = dbConfig.url
        ? { url: dbConfig.url }
        : {
            type: dbConfig.type || 'postgres',
            host: dbConfig.host,
            port: dbConfig.port,
            username: dbConfig.username,
            password: dbConfig.password,
            database: dbConfig.database,
          };

      // Configure entity and migration paths
      const baseDir = __dirname;
      const entitiesPath = path.join(baseDir, '../**/*.entity{.ts,.js}');
      const migrationsPath = path.join(baseDir, '../database/migrations/*{.ts,.js}');

      return {
        ...connectionOptions,
        autoLoadEntities: true,
        synchronize: dbConfig.synchronize === 'true' || dbConfig.synchronize === true,
        logging: dbConfig.logging || false,
        entities: [entitiesPath],
        migrations: [migrationsPath],
        migrationsRun: dbConfig.migrationsRun === 'true' || dbConfig.migrationsRun === true,
        // Connection pool settings
        extra: {
          max: dbConfig.maxConnections || 10,
          min: 1,
          idleTimeoutMillis: dbConfig.idleTimeoutMillis || 30000,
        },
        // Retry settings
        retryAttempts: dbConfig.retryAttempts || 5,
        retryDelay: dbConfig.retryDelay || 1000,
        // SSL configuration
        ssl: dbConfig.ssl === 'true' || dbConfig.ssl === true,
      };
    } catch (error) {
      console.error('Failed to create TypeORM options:', error);
      // Return minimal default options
      return {
        autoLoadEntities: true,
        synchronize: false,
      };
    }
  }
}