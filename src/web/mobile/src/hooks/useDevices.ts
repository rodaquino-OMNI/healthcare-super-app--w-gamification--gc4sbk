import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@apollo/client';

// Import from @austa/interfaces package instead of local types
import { DeviceConnection, DeviceConnectionSchema } from '@austa/interfaces/health';

// Import from @austa/journey-context for journey-specific state
import { useJourneyContext } from '@austa/journey-context';
import { useAuth } from '@austa/journey-context';

// Use consistent module resolution for API imports
import { getConnectedDevices, connectDevice } from '@app/shared/api/health';

/**
 * A React hook that fetches connected devices for a user and provides a function to connect new devices.
 * This hook supports the My Health Journey functionality (F-101) for device management.
 * 
 * Uses standardized error handling with journey-aware logging and integrates with journey context.
 * For proper error handling, components using this hook should be wrapped in an ErrorBoundary component.
 * 
 * @returns An object containing the list of connected devices, loading state, error state, and functions to connect new devices and reset errors.
 */
export function useDevices() {
  const { session } = useAuth();
  const { journey, journeyState } = useJourneyContext();
  const userId = session?.accessToken ? useAuth().getUserFromToken(session.accessToken)?.sub : undefined;
  
  const [devices, setDevices] = useState<DeviceConnection[] | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch connected devices when component mounts, userId changes, or journey changes
  useEffect(() => {
    if (!userId || journey !== 'health') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    getConnectedDevices(userId)
      .then(result => {
        // Validate the data against the schema
        try {
          // Ensure all devices conform to the schema
          const validatedDevices = result.map(device => DeviceConnectionSchema.parse(device));
          setDevices(validatedDevices);
          setLoading(false);
        } catch (validationError) {
          // Journey-aware error logging
          console.error(`[Health Journey] Device validation error:`, validationError);
          setError(new Error(`Invalid device data received: ${validationError.message}`));
          setLoading(false);
        }
      })
      .catch(err => {
        // Journey-aware error logging
        console.error(`[Health Journey] Error fetching devices:`, err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching devices'));
        setLoading(false);
        
        // Update journey state with error information
        if (journeyState?.setError) {
          journeyState.setError('devices', {
            code: 'DEVICE_FETCH_ERROR',
            message: err.message || 'Failed to fetch connected devices',
            timestamp: new Date().toISOString(),
          });
        }
      });
  }, [userId, journey, journeyState]);
  
  /**
   * Connect a new device to the user's account
   * @param deviceData - Data needed to connect the device (type, id, name, etc.)
   * @returns The newly connected device object
   * @throws Error if connection fails or user is not authenticated
   */
  const connect = useCallback(async (deviceData: Partial<DeviceConnection>): Promise<DeviceConnection> => {
    if (!userId) {
      const authError = new Error('User must be authenticated to connect a device');
      
      // Journey-aware error logging
      console.error(`[Health Journey] Authentication error:`, authError);
      
      // Update journey state with error information
      if (journeyState?.setError) {
        journeyState.setError('devices', {
          code: 'AUTH_ERROR',
          message: authError.message,
          timestamp: new Date().toISOString(),
        });
      }
      
      throw authError;
    }
    
    try {
      const newDevice = await connectDevice(userId, deviceData);
      
      // Validate the new device against the schema
      const validatedDevice = DeviceConnectionSchema.parse(newDevice);
      
      // Update the devices list to include the newly connected device
      setDevices(prev => prev ? [...prev, validatedDevice] : [validatedDevice]);
      
      return validatedDevice;
    } catch (err) {
      // Journey-aware error logging
      console.error(`[Health Journey] Error connecting device:`, err);
      
      const connectionError = err instanceof Error 
        ? err 
        : new Error('Unknown error connecting device');
      
      setError(connectionError);
      
      // Update journey state with error information
      if (journeyState?.setError) {
        journeyState.setError('devices', {
          code: 'DEVICE_CONNECTION_ERROR',
          message: connectionError.message,
          timestamp: new Date().toISOString(),
        });
      }
      
      throw connectionError;
    }
  }, [userId, journeyState]);
  
  /**
   * Reset any errors in the hook state
   */
  const resetError = useCallback(() => {
    setError(null);
    
    // Clear journey error state if available
    if (journeyState?.clearError) {
      journeyState.clearError('devices');
    }
  }, [journeyState]);
  
  return {
    devices,
    loading,
    error,
    connect,
    resetError
  };
}