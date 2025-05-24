import React from 'react';
import { Box } from '@design-system/primitives';
import { Text } from '@design-system/primitives';
import { Touchable } from '@design-system/primitives';
import { Icon } from '@design-system/primitives';
import { useJourneyTheme } from '@austa/journey-context';
import { DeviceCardProps } from '@austa/interfaces/components/health.types';
import {
  DeviceCardContainer,
  DeviceCardHeader,
  DeviceName,
  ConnectionStatus,
  LastSyncContainer,
  DeviceIconContainer,
  DeviceDetails
} from './DeviceCard.styles';

/**
 * DeviceCard component displays information about a connected health device
 * in a pressable card format with journey-specific styling.
 * 
 * Used in the Health Journey to show connected wearable devices and their status.
 */
export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  title,
  showLastSync = true,
  showStatus = true,
  onClick,
  onSync,
  onDisconnect,
  onSettings,
  isSyncing = false,
  variant = 'default',
  deviceIcon,
  className,
  testID,
}) => {
  const { primary } = useJourneyTheme();
  const isConnected = device.status === 'CONNECTED';
  
  // Determine the device icon to use
  const iconName = deviceIcon || getDeviceIconName(device.deviceType);
  
  // Format the device name
  const displayName = title || `${device.manufacturer || ''} ${device.model || ''}`.trim() || 'Device';
  
  // Format the device type for display
  const displayType = formatDeviceType(device.deviceType);
  
  // Format the last sync time
  const lastSyncDisplay = formatLastSync(device.lastSync);
  
  // Format the connection status
  const statusDisplay = formatConnectionStatus(device.status);
  
  return (
    <Touchable 
      onPress={onClick}
      journey="health"
      accessibilityLabel={`${displayName}, ${displayType}, ${statusDisplay}, Last synced ${lastSyncDisplay}`}
      fullWidth
      testID={testID}
    >
      <DeviceCardContainer>
        <DeviceCardHeader>
          <DeviceName>{displayName}</DeviceName>
          {showStatus && (
            <ConnectionStatus connected={isConnected}>
              {isSyncing ? 'Syncing...' : statusDisplay}
            </ConnectionStatus>
          )}
        </DeviceCardHeader>
        
        <DeviceDetails>
          <DeviceIconContainer>
            <Icon 
              name={iconName} 
              size="24px" 
              color={isConnected ? "semantic.success" : "neutral.gray400"} 
              aria-hidden={true}
            />
          </DeviceIconContainer>
          
          <Box flex="1">
            <Text color="neutral.gray600" fontSize="sm">{displayType}</Text>
            
            {showLastSync && (
              <LastSyncContainer>
                <Text color="neutral.gray600" fontSize="sm">Last sync: {lastSyncDisplay}</Text>
              </LastSyncContainer>
            )}
          </Box>
        </DeviceDetails>
      </DeviceCardContainer>
    </Touchable>
  );
};

/**
 * Helper function to determine which icon to use based on the device type
 */
const getDeviceIconName = (deviceType: string): string => {
  const type = deviceType.toLowerCase();
  
  if (type.includes('watch') || type.includes('smartwatch') || type.includes('fitness_tracker')) return 'steps';
  if (type.includes('scale') || type.includes('smart_scale')) return 'weight';
  if (type.includes('heart') || type.includes('heart_rate_monitor')) return 'heart';
  if (type.includes('glucose') || type.includes('glucose_monitor')) return 'glucose';
  if (type.includes('blood_pressure') || type.includes('blood_pressure_monitor')) return 'pulse';
  if (type.includes('sleep') || type.includes('sleep_tracker')) return 'sleep';
  if (type.includes('pulse_oximeter')) return 'pulse';
  
  // Default icon
  return 'heart-outline';
};

/**
 * Helper function to format device type for display
 */
const formatDeviceType = (deviceType: string): string => {
  // Convert from enum format (e.g., BLOOD_PRESSURE_MONITOR) to readable format (e.g., Blood Pressure Monitor)
  return deviceType
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Helper function to format last sync time
 */
const formatLastSync = (lastSync: string): string => {
  try {
    const syncDate = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    
    // Less than a minute
    if (diffMs < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diffMs < 604800000) {
      const days = Math.floor(diffMs / 86400000);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Format as date
    return syncDate.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting last sync date:', error);
    return lastSync || 'Unknown';
  }
};

/**
 * Helper function to format connection status
 */
const formatConnectionStatus = (status: string): string => {
  // Convert from enum format (e.g., CONNECTED) to readable format (e.g., Connected)
  return status.charAt(0) + status.slice(1).toLowerCase();
};

export default DeviceCard;