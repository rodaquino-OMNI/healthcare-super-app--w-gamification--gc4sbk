import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 10.0.0+

// Import feature modules using path aliases
import { AuthModule } from '@app/auth/auth/auth.module';
import { UsersModule } from '@app/auth/users/users.module';
import { RolesModule } from '@app/auth/roles/roles.module';
import { PermissionsModule } from '@app/auth/permissions/permissions.module';
import { configuration } from '@app/auth/config/configuration';

// Import shared modules using path aliases
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';
import { PrismaService } from '@app/shared/database/prisma.service';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { RedisModule } from '@app/shared/redis/redis.module';

// Import shared interfaces for type safety
import { IAuthServiceConfig } from '@austa/interfaces/auth';

/**
 * Root module for the Auth Service that configures all necessary components.
 * This module integrates authentication, user management, roles, permissions, 
 * and shared infrastructure modules to provide a complete authentication
 * and authorization system for the AUSTA SuperApp.
 *
 * The Auth Service handles:
 * - User authentication (login, registration, token management)
 * - Role-based access control
 * - Permission management
 * - User profile management
 * 
 * @module AppModule
 */
@Module({
  imports: [
    // Configure environment variables with validation
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const authConfig = config as IAuthServiceConfig;
        // Basic validation to ensure required config is present
        if (!authConfig.jwt?.secret) {
          throw new Error('JWT secret is required');
        }
        return authConfig;
      },
    }),
    
    // Feature modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    
    // Shared infrastructure modules
    ExceptionsModule,
    LoggerModule,
    TracingModule,
    KafkaModule,
    RedisModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService], // Export PrismaService for use in other modules
})
export class AppModule {}