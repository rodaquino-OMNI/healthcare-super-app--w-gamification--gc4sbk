import { Module, Provider } from '@nestjs/common';
import { WearablesService } from '@app/health/integrations/wearables/wearables.service';
import { GoogleFitAdapter } from '@app/health/integrations/wearables/adapters/googlefit.adapter';
import { HealthKitAdapter } from '@app/health/integrations/wearables/adapters/healthkit.adapter';
import { DevicesModule } from '@app/health/devices/devices.module';
import { WEARABLE_ADAPTER_TOKEN } from '@austa/interfaces/journey/health';
import { LoggerModule } from '@austa/logging';
import { PrismaModule } from '@austa/database';

/**
 * Module that configures wearable device integrations for the Health Service.
 * Provides adapters for various wearable platforms and a unified service
 * to manage their connections and data synchronization.
 * 
 * Addresses requirement F-101-RQ-004: Connect with supported wearable devices
 * to import health metrics.
 */
@Module({
  imports: [
    DevicesModule,
    LoggerModule,
    PrismaModule.forFeature({ contextName: 'health' })
  ],
  providers: [
    WearablesService,
    {
      provide: WEARABLE_ADAPTER_TOKEN.GOOGLE_FIT,
      useClass: GoogleFitAdapter
    },
    {
      provide: WEARABLE_ADAPTER_TOKEN.HEALTH_KIT,
      useClass: HealthKitAdapter
    }
  ],
  exports: [WearablesService]
})
export class WearablesModule {}