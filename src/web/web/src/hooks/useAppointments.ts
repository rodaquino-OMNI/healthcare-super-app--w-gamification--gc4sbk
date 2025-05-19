import { useQuery, ApolloError } from '@apollo/client'; // v3.0+
import { Appointment } from '@austa/interfaces/care';
import { useAuth } from '@app/context/AuthContext';
import { GET_USER_APPOINTMENTS } from '@app/shared/graphql/queries/care.queries';

/**
 * Custom error type for appointment-related errors
 */
export interface AppointmentError extends ApolloError {
  code?: string;
  details?: string;
}

/**
 * Hook to fetch and manage appointments within the Care Now journey.
 * Provides type-safe access to appointment data with improved error handling.
 * 
 * @returns An object containing loading state, typed error state, and the list of appointments.
 */
export const useAppointments = () => {
  const { session } = useAuth();
  
  // In a real implementation, the user ID would typically be extracted from
  // the JWT token in session.accessToken or from user context
  // For this implementation, we'll assume it's available via the session
  const userId = session?.userId;
  
  const { loading, error, data } = useQuery<
    { userAppointments: Appointment[] },
    { userId: string; status?: string; type?: string }
  >(GET_USER_APPOINTMENTS, {
    variables: { userId },
    skip: !userId, // Skip the query if there's no user ID available
    fetchPolicy: 'cache-and-network', // Fetch from cache first, then update from network
    onError: (error) => {
      // Log detailed error information for debugging
      console.error('Error fetching appointments:', {
        message: error.message,
        networkError: error.networkError,
        graphQLErrors: error.graphQLErrors,
      });
    }
  });
  
  return {
    loading,
    error: error as AppointmentError | undefined,
    appointments: data?.userAppointments || [],
  };
};