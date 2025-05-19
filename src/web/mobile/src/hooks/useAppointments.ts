import { useQuery, useMutation, ApolloError } from '@apollo/client'; // v3.7.17
import { Appointment } from '@austa/interfaces/care';
import { useAuth } from './useAuth';
import { useJourneyContext } from '@austa/journey-context';
import { JourneyError } from '@austa/journey-context/errors';
import { GET_APPOINTMENTS, CANCEL_APPOINTMENT } from '@austa/shared/graphql/queries/care.queries';

/**
 * Provides hooks for fetching and managing appointments.
 * This hook supports the Care Now Journey (F-102) by enabling users
 * to view and manage their healthcare appointments.
 * 
 * @returns An object containing the list of appointments, loading state, error, refetch function, and cancel function.
 */
export function useAppointments() {
  // Get auth session for API authorization
  const { session } = useAuth();
  
  // Get journey context for error handling and state management
  const { journeyId, logError } = useJourneyContext();
  
  // Fetch appointments using GraphQL query
  const { data, loading, error, refetch } = useQuery<{ appointments: Appointment[] }>(
    GET_APPOINTMENTS,
    {
      // Skip query if user is not authenticated
      skip: !session,
      // Fetch fresh data on component mount
      fetchPolicy: 'cache-and-network',
      // Context for request headers
      context: {
        headers: {
          Authorization: session ? `Bearer ${session.accessToken}` : ''
        }
      },
      // Handle errors with journey context
      onError: (error: ApolloError) => {
        logError(new JourneyError({
          message: 'Failed to fetch appointments',
          journey: journeyId,
          originalError: error,
          code: 'APPOINTMENT_FETCH_ERROR'
        }));
      }
    }
  );
  
  // Set up mutation for cancelling appointments
  const [cancelMutation] = useMutation(
    CANCEL_APPOINTMENT,
    {
      // Add auth headers to the request
      context: {
        headers: {
          Authorization: session ? `Bearer ${session.accessToken}` : ''
        }
      },
      // Handle errors with journey context
      onError: (error: ApolloError) => {
        logError(new JourneyError({
          message: 'Failed to cancel appointment',
          journey: journeyId,
          originalError: error,
          code: 'APPOINTMENT_CANCEL_ERROR'
        }));
      },
      // Update cache after successful cancellation to avoid refetching
      update(cache, { data: { cancelAppointment } }) {
        // Read current appointments from cache
        const cachedData = cache.readQuery<{ appointments: Appointment[] }>({
          query: GET_APPOINTMENTS
        });
        
        if (cachedData) {
          // Update the cancelled appointment in the cache
          cache.writeQuery({
            query: GET_APPOINTMENTS,
            data: {
              appointments: cachedData.appointments.map(appointment => 
                appointment.id === cancelAppointment.id 
                  ? { ...appointment, status: cancelAppointment.status } 
                  : appointment
              )
            }
          });
        }
      }
    }
  );
  
  /**
   * Cancel an appointment by ID
   * 
   * @param id - ID of the appointment to cancel
   * @returns Promise that resolves when the cancellation is complete
   */
  const cancel = async (id: string): Promise<void> => {
    if (!session) {
      const authError = new JourneyError({
        message: 'Authentication required to cancel appointment',
        journey: journeyId,
        code: 'APPOINTMENT_AUTH_ERROR'
      });
      
      logError(authError);
      throw authError;
    }
    
    try {
      await cancelMutation({ variables: { id } });
    } catch (err) {
      // Error is already handled by onError callback in useMutation
      throw err;
    }
  };
  
  return {
    appointments: data?.appointments || [],
    loading,
    error,
    refetch,
    cancel
  };
}