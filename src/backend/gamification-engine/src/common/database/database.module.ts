import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionService } from './transaction.service';
import { JourneyContextService } from './journey-context.service';
import { DatabaseErrorHandlerService } from './error-handler.service';

/**
 * Global module that provides database services for the gamification engine.
 * Registers and exports all database-related services for consistent database access
 * across the application.
 */
@Global()
@Module({
  providers: [
    PrismaService,
    TransactionService,
    JourneyContextService,
    DatabaseErrorHandlerService,
  ],
  exports: [
    PrismaService,
    TransactionService,
    JourneyContextService,
    DatabaseErrorHandlerService,
  ],
})
export class DatabaseModule {}