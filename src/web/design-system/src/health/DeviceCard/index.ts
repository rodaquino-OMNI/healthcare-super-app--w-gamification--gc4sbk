/**
 * @file DeviceCard component entry point
 * @description Exports the DeviceCard component for the Health journey
 * @module @austa/design-system/health/DeviceCard
 */

// Export the main component
export { DeviceCard } from './DeviceCard';

// Export styled components that might be useful for consumers
export {
  DeviceCardContainer,
  DeviceCardHeader,
  DeviceName,
  ConnectionStatus,
  LastSyncContainer,
  DeviceIconContainer,
  DeviceDetails
} from './DeviceCard.styles';

// Re-export the component props interface from @austa/interfaces
export type { DeviceCardProps } from '@austa/interfaces/components/health.types';

// Re-export relevant device types from @austa/interfaces
export { ConnectionState } from '@austa/interfaces/health/device';