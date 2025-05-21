import { Module } from '@nestjs/common';
import { WebsocketsModule } from '../../websockets/websockets.module';
import { RedisModule } from 'src/backend/shared/src/redis/redis.module';
import { RetryModule } from '../../retry/retry.module';
import { TracingModule } from 'src/backend/shared/src/tracing/tracing.module';
import { LoggerModule } from 'src/backend/shared/src/logging/logger.module';
import { InAppService } from './in-app.service';

/**
 * Module for in-app notification channel
 * 
 * Provides real-time and queued in-app notifications through WebSockets
 * with Redis for connection state management and RetryModule for handling
 * delivery failures. Integrates with TracingModule for distributed request
 * tracking and LoggerModule for structured logging.
 */
@Module({
  imports: [
    WebsocketsModule,
    RedisModule,
    RetryModule,
    TracingModule,
    LoggerModule,
  ],
  providers: [InAppService],
  exports: [InAppService],
})
export class InAppModule {}