import React, { useState } from 'react';
import { View } from 'react-native';
// Updated imports to use @austa/design-system for UI components
import { DeviceCard } from '@austa/design-system/health';
import { Button } from '@austa/design-system/components/Button';
// Updated imports to use @austa/journey-context for journey state management
import { useJourney } from '@austa/journey-context';
// Updated imports to use shared components with consistent styling
import LoadingIndicator from 'src/web/mobile/src/components/shared/LoadingIndicator';
import ErrorState from 'src/web/mobile/src/components/shared/ErrorState';
// Updated imports to use JourneyHeader from the same location
import { JourneyHeader } from 'src/web/mobile/src/components/shared/JourneyHeader';
// Updated import to use the hook from the same location
import { useDevices } from 'src/web/mobile/src/hooks/useDevices';

/**
 * Renders the DeviceConnection screen, allowing users to connect and manage their wearable devices.
 * 
 * This screen is part of the Health journey and displays a list of connected health devices
 * with their connection status and last sync time.
 *
 * @returns {JSX.Element} The rendered DeviceConnection screen.
 */
export const DeviceConnection: React.FC = () => {
  // Retrieve the current journey using the useJourney hook from @austa/journey-context
  const { currentJourney } = useJourney();

  // Retrieve the connected devices, loading state, and error state using the useDevices hook
  const { devices, loading, error, connect, resetError } = useDevices();

  // Sets up local state for managing the new device type
  const [newDevice, setNewDevice] = useState<string>('');

  /**
   * Handles the connection of a new device
   * Shows a confirmation dialog and then initiates the connection process
   */
  const handleConnectDevice = () => {
    // In a real implementation, this would open a modal or navigate to a device selection screen
    console.log('Connect new device');
  };

  return (
    <View style={{ flex: 1 }}>
      <JourneyHeader title="Dispositivos Conectados" showBackButton />

      {/* Show loading indicator when data is being fetched */}
      {loading && (
        <LoadingIndicator 
          journey="health" 
          label="Carregando dispositivos..." 
          testID="device-connection-loading"
        />
      )}

      {/* Show error state with retry option if there was an error */}
      {error && (
        <ErrorState
          title="Não foi possível carregar os dispositivos"
          description={error.message || "Ocorreu um erro ao carregar seus dispositivos conectados. Por favor, tente novamente."}
          journey="health"
          onRetry={resetError}
          testID="device-connection-error"
        />
      )}

      {/* Show device list when data is available */}
      {devices && devices.length > 0 ? (
        <View style={{ padding: 16 }}>
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              deviceName={device.deviceName || device.deviceType}
              deviceType={device.deviceType}
              lastSync={device.lastSync}
              status={device.status}
              onPress={() => console.log(`Device selected: ${device.id}`)}
              testID={`device-card-${device.id}`}
            />
          ))}
        </View>
      ) : !loading && !error ? (
        // Show empty state when no devices are connected
        <ErrorState
          title="Nenhum dispositivo conectado"
          description="Você ainda não tem dispositivos conectados. Conecte um dispositivo para começar a monitorar sua saúde."
          icon="device-health"
          journey="health"
          testID="device-connection-empty"
        />
      ) : null}

      {/* Button to connect a new device */}
      <View style={{ padding: 16, marginTop: 'auto' }}>
        <Button 
          onPress={handleConnectDevice} 
          journey="health"
          testID="connect-device-button"
          icon="plus"
        >
          Conectar Novo Dispositivo
        </Button>
      </View>
    </View>
  );
};

export default DeviceConnection;