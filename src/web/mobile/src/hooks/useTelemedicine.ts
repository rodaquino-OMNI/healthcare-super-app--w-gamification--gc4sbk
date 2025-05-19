import { useState, useEffect, useCallback } from 'react'; // ^18.0.0
import { TelemedicineSession } from '@austa/interfaces/care';
import { createTelemedicineSession, getTelemedicineSession } from '@app/api/care';
import { useAuth } from '@app/hooks/useAuth';
import { useJourneyContext } from '@austa/journey-context';
import { config } from '@app/constants/config';
import { checkAndroidPermissions, requestCameraAndMicrophonePermissions } from '@app/utils/permissions';
import { logger } from '@austa/logging';

/**
 * Custom hook for managing telemedicine sessions within the AUSTA SuperApp.
 * 
 * This hook provides functionality for creating and retrieving telemedicine sessions
 * as part of the Care Now Journey (F-102). It handles permission checking, session
 * state management, and real-time updates.
 * 
 * @param sessionId - Optional ID of an existing session to retrieve
 * @returns Object containing session data, loading state, error state, and functions to manage the session
 */
export function useTelemedicineSession(sessionId?: string) {
  // State for session data, loading and error states
  const [session, setSession] = useState<TelemedicineSession | null>(null);
  const [loading, setLoading] = useState<boolean>(!!sessionId);
  const [error, setError] = useState<Error | null>(null);
  
  // Access auth context for user information and authentication
  const { session: authSession } = useAuth();
  
  // Access journey context for journey-specific behavior
  const { journey } = useJourneyContext();
  
  /**
   * Creates a new telemedicine session with the specified provider
   * 
   * @param providerId - ID of the healthcare provider for the session
   * @returns Promise that resolves to the created session or null if failed
   */
  const createSession = useCallback(async (providerId: string): Promise<TelemedicineSession | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Verify user is authenticated
      if (!authSession) {
        const authError = new Error('Authentication required for telemedicine session');
        logger.error('Telemedicine session creation failed: Not authenticated', {
          journey,
          error: authError,
          context: 'useTelemedicineSession'
        });
        throw authError;
      }
      
      // Check required permissions on Android
      if (config.platform === 'android') {
        try {
          const hasPermissions = await checkAndroidPermissions();
          if (!hasPermissions) {
            // Request camera and microphone permissions specifically for telemedicine
            const permissionsGranted = await requestCameraAndMicrophonePermissions();
            if (!permissionsGranted) {
              const permissionError = new Error('Camera and microphone permissions are required for telemedicine');
              logger.warn('Telemedicine permissions denied', {
                journey,
                context: 'useTelemedicineSession',
                permissions: ['CAMERA', 'RECORD_AUDIO']
              });
              throw permissionError;
            }
          }
        } catch (permErr) {
          const permissionError = permErr instanceof Error 
            ? permErr 
            : new Error('Failed to verify permissions for telemedicine');
          
          logger.error('Telemedicine permission check failed', {
            journey,
            error: permissionError,
            context: 'useTelemedicineSession'
          });
          throw permissionError;
        }
      }
      
      // Create a new session
      const newSession = await createTelemedicineSession(providerId);
      setSession(newSession);
      
      logger.info('Telemedicine session created successfully', {
        journey,
        sessionId: newSession.id,
        providerId,
        context: 'useTelemedicineSession'
      });
      
      return newSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create telemedicine session');
      
      // Only log if not already logged (avoid duplicate logs)
      if (!(err instanceof Error)) {
        logger.error('Telemedicine session creation failed', {
          journey,
          error,
          providerId,
          context: 'useTelemedicineSession'
        });
      }
      
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authSession, journey]);
  
  /**
   * Fetches the current session data from the server
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !authSession) return;
    
    try {
      const freshSession = await getTelemedicineSession(sessionId);
      setSession(freshSession);
      
      // Only log at debug level for background refreshes to avoid log spam
      logger.debug('Telemedicine session refreshed', {
        journey,
        sessionId,
        status: freshSession.status,
        context: 'useTelemedicineSession'
      });
    } catch (err) {
      // Don't update error state here to avoid disrupting the UI during background refreshes
      logger.warn('Failed to refresh telemedicine session', {
        journey,
        error: err instanceof Error ? err : new Error('Unknown error during session refresh'),
        sessionId,
        context: 'useTelemedicineSession'
      });
    }
  }, [sessionId, authSession, journey]);
  
  // Fetch session details when sessionId is provided
  useEffect(() => {
    if (!sessionId) return;
    
    const fetchSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verify user is authenticated
        if (!authSession) {
          const authError = new Error('Authentication required to retrieve telemedicine session');
          logger.error('Telemedicine session retrieval failed: Not authenticated', {
            journey,
            error: authError,
            sessionId,
            context: 'useTelemedicineSession'
          });
          throw authError;
        }
        
        // Fetch the session
        const fetchedSession = await getTelemedicineSession(sessionId);
        setSession(fetchedSession);
        
        logger.info('Telemedicine session retrieved successfully', {
          journey,
          sessionId,
          status: fetchedSession.status,
          context: 'useTelemedicineSession'
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to retrieve telemedicine session');
        
        // Only log if not already logged (avoid duplicate logs)
        if (!(err instanceof Error)) {
          logger.error('Telemedicine session retrieval failed', {
            journey,
            error,
            sessionId,
            context: 'useTelemedicineSession'
          });
        }
        
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
    
    // Set up periodic refresh for active sessions
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (sessionId && authSession) {
      // Refresh the session data every 10 seconds to keep it up-to-date
      refreshInterval = setInterval(refreshSession, 10000);
      
      logger.debug('Telemedicine session refresh interval started', {
        journey,
        sessionId,
        refreshIntervalMs: 10000,
        context: 'useTelemedicineSession'
      });
    }
    
    // Clean up the interval when the component unmounts or sessionId changes
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        
        logger.debug('Telemedicine session refresh interval cleared', {
          journey,
          sessionId,
          context: 'useTelemedicineSession'
        });
      }
    };
  }, [sessionId, authSession, refreshSession, journey]);
  
  return {
    session,
    loading,
    error,
    createSession,
    refreshSession,
  };
}