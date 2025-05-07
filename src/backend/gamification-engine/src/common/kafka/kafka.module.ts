import { Module } from '@nestjs/common';
import { DlqService } from './dlq.service';
import { PrismaModule } from '../database/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';

/**
 * Module that provides Kafka-related services for the gamification engine
 */
@Module({
  imports: [PrismaModule, MetricsModule],
  providers: [DlqService],
  exports: [DlqService],
})
export class KafkaModule {}