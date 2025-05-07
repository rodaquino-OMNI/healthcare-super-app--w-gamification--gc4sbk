import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { DeadLetterQueueController } from './dead-letter-queue.controller';
import { DlqEntryEntity } from './entities/dlq-entry.entity';
import { EventsModule } from '../events.module';

/**
 * Module for Dead Letter Queue functionality
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DlqEntryEntity]),
    ConfigModule,
    EventsModule,
  ],
  controllers: [DeadLetterQueueController],
  providers: [DeadLetterQueueService],
  exports: [DeadLetterQueueService],
})
export class DeadLetterQueueModule {}