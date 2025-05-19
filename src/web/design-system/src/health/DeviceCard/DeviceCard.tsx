import React from 'react';
import { Box, Text, Touchable, Icon } from '@design-system/primitives';
import { useJourneyTheme } from '@austa/journey-context';
import { DeviceCardProps } from '@austa/interfaces/health';
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
  deviceName,
  deviceType,
  lastSync,
  status,
  onPress
}) => {
  const isConnected = status.toLowerCase() === 'connected';
  const deviceIconName = getDeviceIconName(deviceType);
  const theme = useJourneyTheme('health');
  
  return (
    <Touchable 
      onPress={onPress}
      accessibilityLabel={`${deviceName}, ${deviceType}, ${status}, Last synced ${lastSync}`}
      fullWidth
    >
      <DeviceCardContainer>
        <DeviceDetails>
          <DeviceIconContainer>
            <Icon 
              name={deviceIconName} 
              size="24px" 
              color={isConnected ? "semantic.success" : "neutral.gray400"} 
              aria-hidden={true}
            />
          </DeviceIconContainer>
          
          <Box flex="1">
            <DeviceCardHeader>
              <DeviceName>{deviceName}</DeviceName>
              <ConnectionStatus connected={isConnected}>
                {status}
              </ConnectionStatus>
            </DeviceCardHeader>
            
            <Text 
              color="neutral.gray600"
              fontSize="sm"
              marginBottom="xs"
            >
              {deviceType}
            </Text>
            
            <LastSyncContainer>
              Last sync: {lastSync}
            </LastSyncContainer>
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
  
  if (type.includes('watch') || type.includes('band')) return 'steps'; // Use steps icon for wearables
  if (type.includes('scale')) return 'weight';
  if (type.includes('heart') || type.includes('pulse')) return 'heart';
  if (type.includes('glucose')) return 'glucose';
  if (type.includes('blood pressure')) return 'pulse';
  if (type.includes('sleep')) return 'sleep';
  
  // Default icon
  return 'heart-outline'; // Use as a generic device icon
};