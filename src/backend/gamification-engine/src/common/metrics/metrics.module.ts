import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * Module that provides metrics services for the gamification engine
 */
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}