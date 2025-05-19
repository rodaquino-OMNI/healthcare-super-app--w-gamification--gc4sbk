/**
 * Care API Module
 * 
 * This module provides functions for interacting with the Care service,
 * including methods for fetching providers, booking appointments, and
 * managing telemedicine sessions.
 * 
 * This is part of the Care Now Journey which provides immediate healthcare access
 * through appointment booking, telemedicine, and other care-related features.
 */

import { gql, ApolloClient, InMemoryCache } from '@apollo/client'; // v3.7.0
import { apiConfig } from 'src/web/shared/config/apiConfig';
import { API_TIMEOUT } from 'src/web/shared/constants/index';

// Import types from @austa/interfaces package
import { 
  Appointment, 
  Provider,
  AppointmentInput,
  AppointmentType,
  AppointmentStatus,
  ProviderSearchParams
} from '@austa/interfaces/api/care.api';

// Import error and response types
import { ApiError, ErrorCode } from '@austa/interfaces/api/error.types';
import { ApiResponse, PaginatedResponse } from '@austa/interfaces/api/response.types';

// Import GraphQL operations
import { 
  GET_USER_APPOINTMENTS, 
  GET_APPOINTMENT_DETAILS, 
  SEARCH_PROVIDERS 
} from 'src/web/shared/graphql/queries/care.queries';
import { 
  BOOK_APPOINTMENT, 
  CANCEL_APPOINTMENT 
} from 'src/web/shared/graphql/mutations/care.mutations';

// Apollo client instance for making GraphQL requests to the Care journey API
const client = new ApolloClient({
  uri: apiConfig.journeys.care,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all', // Return both data and errors if they exist
      timeout: API_TIMEOUT
    },
    mutate: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all', // Return both data and errors if they exist
      timeout: API_TIMEOUT
    }
  }
});

/**
 * Fetches a list of appointments for a given user ID.
 * 
 * @param userId - The ID of the user whose appointments to fetch
 * @param status - Optional filter for appointment status
 * @param type - Optional filter for appointment type
 * @returns A promise that resolves to an ApiResponse containing an array of Appointment objects
 */
export async function getAppointments(
  userId: string, 
  status?: AppointmentStatus,
  type?: AppointmentType
): Promise<ApiResponse<Appointment[]>> {
  try {
    const { data, errors } = await client.query({
      query: GET_USER_APPOINTMENTS,
      variables: { userId, status, type },
      errorPolicy: 'all' // Return both data and errors if they exist
    });
    
    if (errors) {
      return {
        success: false,
        error: {
          code: ErrorCode.CARE_FETCH_FAILED,
          message: 'Failed to fetch appointments',
          details: errors
        }
      };
    }
    
    return {
      success: true,
      data: data.userAppointments
    };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return {
      success: false,
      error: {
        code: ErrorCode.CARE_FETCH_FAILED,
        message: 'Failed to fetch appointments. Please check your connection and try again.',
        details: error
      }
    };
  }
}

/**
 * Fetches a single appointment by its ID.
 * 
 * @param appointmentId - The ID of the appointment to fetch
 * @returns A promise that resolves to an ApiResponse containing an Appointment object
 */
export async function getAppointment(appointmentId: string): Promise<ApiResponse<Appointment>> {
  try {
    const { data, errors } = await client.query({
      query: GET_APPOINTMENT_DETAILS,
      variables: { appointmentId },
      errorPolicy: 'all' // Return both data and errors if they exist
    });
    
    if (errors) {
      return {
        success: false,
        error: {
          code: ErrorCode.CARE_FETCH_FAILED,
          message: 'Failed to fetch appointment details',
          details: errors
        }
      };
    }
    
    return {
      success: true,
      data: data.appointment
    };
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return {
      success: false,
      error: {
        code: ErrorCode.CARE_FETCH_FAILED,
        message: 'Failed to fetch appointment details. Please check your connection and try again.',
        details: error
      }
    };
  }
}

/**
 * Fetches a list of providers based on search parameters.
 * 
 * @param searchParams - Parameters to filter providers by (specialty, location, etc.)
 * @returns A promise that resolves to an ApiResponse containing an array of Provider objects
 */
export async function getProviders(
  searchParams: ProviderSearchParams
): Promise<ApiResponse<Provider[]>> {
  try {
    const { data, errors } = await client.query({
      query: SEARCH_PROVIDERS,
      variables: searchParams,
      errorPolicy: 'all' // Return both data and errors if they exist
    });
    
    if (errors) {
      return {
        success: false,
        error: {
          code: ErrorCode.CARE_FETCH_FAILED,
          message: 'Failed to fetch providers',
          details: errors
        }
      };
    }
    
    return {
      success: true,
      data: data.searchProviders
    };
  } catch (error) {
    console.error('Error fetching providers:', error);
    return {
      success: false,
      error: {
        code: ErrorCode.CARE_FETCH_FAILED,
        message: 'Failed to fetch providers. Please check your search criteria and try again.',
        details: error
      }
    };
  }
}

/**
 * Books a new appointment with the given provider, date, type and reason.
 * 
 * @param appointmentInput - The appointment details including provider, date, type and reason
 * @returns A promise that resolves to an ApiResponse containing the newly booked Appointment object
 */
export async function bookAppointment(
  appointmentInput: AppointmentInput
): Promise<ApiResponse<Appointment>> {
  try {
    const { data, errors } = await client.mutate({
      mutation: BOOK_APPOINTMENT,
      variables: appointmentInput,
      errorPolicy: 'all' // Return both data and errors if they exist
    });
    
    if (errors) {
      return {
        success: false,
        error: {
          code: ErrorCode.CARE_BOOKING_FAILED,
          message: 'Failed to book appointment',
          details: errors
        }
      };
    }
    
    return {
      success: true,
      data: data.bookAppointment
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    
    // Check if it's a provider availability error
    const errorMessage = error instanceof Error && error.message.includes('provider unavailable') 
      ? 'The selected provider is not available at this time. Please choose another time slot.'
      : 'Failed to book appointment. Please try again later.';
      
    return {
      success: false,
      error: {
        code: ErrorCode.CARE_BOOKING_FAILED,
        message: errorMessage,
        details: error
      }
    };
  }
}

/**
 * Cancels an existing appointment with the given ID.
 * 
 * @param appointmentId - The ID of the appointment to cancel
 * @returns A promise that resolves to an ApiResponse containing the cancelled Appointment object
 */
export async function cancelAppointment(appointmentId: string): Promise<ApiResponse<Appointment>> {
  try {
    const { data, errors } = await client.mutate({
      mutation: CANCEL_APPOINTMENT,
      variables: { id: appointmentId },
      errorPolicy: 'all' // Return both data and errors if they exist
    });
    
    if (errors) {
      return {
        success: false,
        error: {
          code: ErrorCode.CARE_CANCELLATION_FAILED,
          message: 'Failed to cancel appointment',
          details: errors
        }
      };
    }
    
    return {
      success: true,
      data: data.cancelAppointment
    };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    
    // Check if it's a cancellation policy error
    const errorMessage = error instanceof Error && error.message.includes('cancellation policy') 
      ? 'This appointment cannot be cancelled due to the provider\'s cancellation policy.'
      : 'Failed to cancel appointment. Please try again later.';
      
    return {
      success: false,
      error: {
        code: ErrorCode.CARE_CANCELLATION_FAILED,
        message: errorMessage,
        details: error
      }
    };
  }
}