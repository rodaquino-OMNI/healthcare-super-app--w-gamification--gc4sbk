import React from 'react';
import { DeviceCard } from '@austa/design-system/health';
import { DeviceConnection } from '@austa/interfaces/health';
import { useHealthContext } from '@austa/journey-context';
import { useDevices } from 'src/web/web/src/hooks/useDevices';
import { useAuth } from 'src/web/web/src/hooks/useAuth';
import HealthLayout from 'src/web/web/src/layouts/HealthLayout';

/**
 * Displays the list of connected devices and allows connecting new ones.
 * Part of the Health journey's wearable device integration feature.
 * @returns {JSX.Element} The rendered component.
 */
const Devices: React.FC = () => {
  // Retrieve the user ID from the authentication context
  const { session } = useAuth();
  const userId = session?.accessToken ? useAuth().getUserFromToken(session.accessToken)?.sub : undefined;

  // Access the Health journey context for journey-specific state management
  const { setActiveSection } = useHealthContext();

  // Fetch the list of connected devices using the type-safe hook
  const { data: devices, isLoading, error, refetch } = useDevices();

  // Set the active section in the Health journey context when component mounts
  React.useEffect(() => {
    setActiveSection('devices');
  }, [setActiveSection]);

  // Handle connecting a new device
  const handleConnectDevice = () => {
    // This would typically open a device connection flow
    // For now, we'll just refetch the devices list
    refetch();
  };

  return (
    <HealthLayout>
      <h1>Connected Devices</h1>
      {isLoading && <p>Loading devices...</p>}
      {error && <p>Error: {error.message}</p>}
      {devices && devices.length > 0 ? (
        devices.map((device: DeviceConnection) => (
          <DeviceCard key={device.id} device={device} />
        ))
      ) : (
        <p>No devices connected.</p>
      )}
      <button onClick={handleConnectDevice}>Connect New Device</button>
    </HealthLayout>
  );
};

// Export the Devices page component
export { Devices };
export default Devices;