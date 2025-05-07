import { Module, Provider, Inject, Optional, Global, DynamicModule } from '@nestjs/common';
import { WearablesService } from './wearables.service';
import { GoogleFitAdapter } from './adapters/googlefit.adapter';
import { HealthKitAdapter } from './adapters/healthkit.adapter';
import { DevicesModule } from '@app/health/devices/devices.module';
import { IDeviceConnection, DeviceType, ConnectionStatus } from '@austa/interfaces/journey/health';

/**
 * Injection tokens for wearable adapters and services
 */
export const WEARABLE_TOKENS = {
  GOOGLE_FIT: 'GOOGLE_FIT_ADAPTER',
  HEALTH_KIT: 'HEALTH_KIT_ADAPTER',
  ADAPTER_FACTORY: 'WEARABLE_ADAPTER_FACTORY',
  CONFIG: 'WEARABLE_CONFIG'
};

/**
 * Interface for the adapter factory function
 */
export interface WearableAdapterFactory {
  getAdapter(deviceType: DeviceType): GoogleFitAdapter | HealthKitAdapter;
}

/**
 * Module that configures wearable device integrations for the Health Service.
 * Provides adapters for various wearable platforms and a unified service
 * to manage their connections and data synchronization.
 * 
 * Features:
 * - Type-safe integration with device connection interfaces from @austa/interfaces
 * - Platform-specific adapters for Google Fit and Apple HealthKit
 * - Unified service for managing wearable connections and data synchronization
 * - Factory provider for dynamic adapter selection based on device type
 * - Dynamic module configuration with forRoot() method
 * 
 * Addresses requirement F-101-RQ-004: Connect with supported wearable devices
 * to import health metrics.
 */
@Global()
@Module({
  imports: [DevicesModule],
  providers: [
    // Main service
    {
      provide: WearablesService,
      useClass: WearablesService
    },
    // Platform-specific adapters with explicit tokens
    {
      provide: WEARABLE_TOKENS.GOOGLE_FIT,
      useClass: GoogleFitAdapter
    },
    {
      provide: WEARABLE_TOKENS.HEALTH_KIT,
      useClass: HealthKitAdapter
    },
    // Factory provider for dynamic adapter selection
    {
      provide: WEARABLE_TOKENS.ADAPTER_FACTORY,
      useFactory: (googleFitAdapter: GoogleFitAdapter, healthKitAdapter: HealthKitAdapter) => ({
        getAdapter: (deviceType: DeviceType): GoogleFitAdapter | HealthKitAdapter => {
          switch (deviceType) {
            case DeviceType.FITNESS_TRACKER:
            case DeviceType.SMARTWATCH:
              // Determine the appropriate adapter based on the device type
              // This is a simplified example; in a real implementation, you might need more logic
              return googleFitAdapter;
            case DeviceType.SMART_SCALE:
            case DeviceType.BLOOD_PRESSURE_MONITOR:
            case DeviceType.GLUCOSE_MONITOR:
            case DeviceType.SLEEP_TRACKER:
              return healthKitAdapter;
            default:
              throw new Error(`Unsupported device type: ${deviceType}`);
          }
        }
      }),
      inject: [WEARABLE_TOKENS.GOOGLE_FIT, WEARABLE_TOKENS.HEALTH_KIT]
    },
    // Make adapters available without tokens for backward compatibility
    GoogleFitAdapter,
    HealthKitAdapter
  ],
  exports: [
    WearablesService,
    GoogleFitAdapter,
    HealthKitAdapter,
    WEARABLE_TOKENS.GOOGLE_FIT,
    WEARABLE_TOKENS.HEALTH_KIT,
    WEARABLE_TOKENS.ADAPTER_FACTORY
  ]
})
export class WearablesModule {
  /**
   * Creates a dynamic module with configuration options
   * @param config Configuration options for the wearables module
   * @returns A dynamic module configuration
   */
  static forRoot(config: {
    supportedDevices?: DeviceType[];
    enabledAdapters?: string[];
    syncInterval?: number;
  }): DynamicModule {
    return {
      module: WearablesModule,
      providers: [
        {
          provide: WEARABLE_TOKENS.CONFIG,
          useValue: {
            supportedDevices: config.supportedDevices || Object.values(DeviceType),
            enabledAdapters: config.enabledAdapters || ['googlefit', 'healthkit'],
            syncInterval: config.syncInterval || 3600000 // Default: 1 hour
          }
        }
      ],
      exports: [WEARABLE_TOKENS.CONFIG]
    };
  }
}