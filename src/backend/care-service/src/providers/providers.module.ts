import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module';
import { LoggerModule } from '@app/shared/logging/logger.module';

/**
 * Module that encapsulates the provider-related functionalities for the Care Now journey.
 * Provides consistent error handling and structured logging through shared modules.
 */
@Module({
  imports: [ExceptionsModule, LoggerModule],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}