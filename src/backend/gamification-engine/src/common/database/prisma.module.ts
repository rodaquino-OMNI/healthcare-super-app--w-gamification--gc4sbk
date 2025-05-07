import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module that provides database services for the gamification engine
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}