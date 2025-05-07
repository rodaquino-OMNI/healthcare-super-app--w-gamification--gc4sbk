import { Module } from '@nestjs/common'; // 10.3.0
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '@app/shared/database';

/**
 * A NestJS module that encapsulates user management functionality.
 * This module provides user creation, retrieval, update, and deletion operations
 * for the AUSTA SuperApp's authentication service.
 *
 * It imports the DatabaseModule to access the PrismaService for database operations
 * and exports the UsersService to make it available to other modules like AuthModule.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}