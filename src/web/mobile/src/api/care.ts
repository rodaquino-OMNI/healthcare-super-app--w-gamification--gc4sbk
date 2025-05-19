/**
 * API module for interacting with the Care Service backend.
 * Provides functions for booking appointments, checking symptoms,
 * and accessing telemedicine features for the Care Now Journey (F-102).
 */

import { AxiosResponse } from 'axios';
import { restClient } from './client';
import {
  parseError,
  withErrorHandling,
  AuthenticationError,
  ValidationError,
  withRetry,
  CircuitBreaker
} from './errors';

// Import types from @austa/interfaces instead of defining locally
import { Appointment, AppointmentType, AppointmentStatus } from '@austa/interfaces/care/appointment';
import { SymptomCheckRequest, SymptomCheckResult } from '@austa/interfaces/care/types';

// Import session type from auth interfaces
import { Session } from '@austa/interfaces/auth';

// Cache configuration
const APPOINTMENT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
let appointmentCache: {
  data: Appointment[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

// Create circuit breaker for care service
const careServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 10000, // 10 seconds
  onStateChange: (from, to) => {
    console.info(`Care service circuit breaker state changed from ${from} to ${to}`);
  }
});

/**
 * Helper function to get current auth session
 * In a real implementation, this would use the useAuth hook in a component
 * Since we can't use hooks outside of components, we'll provide this helper
 * 
 * @returns The current authentication session or null if not authenticated
 */
export const getAuthSession = (): Session | null => {
  // For testing outside of React components
  try {
    // Try to get the token from storage
    const tokenFromStorage = localStorage.getItem('auth_session');
    if (tokenFromStorage) {
      return JSON.parse(tokenFromStorage);
    }
  } catch (error) {
    console.error('Failed to get auth session:', error);
  }
  
  return null;
};

/**
 * Validates that the user is authenticated and returns the session
 * @throws AuthenticationError if not authenticated
 * @returns The authenticated session
 */
const getAuthenticatedSession = (): Session => {
  const session = getAuthSession();
  
  if (!session || !session.accessToken) {
    throw new AuthenticationError({
      message: 'Authentication required to access care services',
      context: { service: 'care' }
    });
  }
  
  return session;
};

/**
 * Books an appointment with a healthcare provider.
 * 
 * @param appointmentDetails - Object containing appointment details (providerId, dateTime, type, reason, etc.)
 * @returns A promise that resolves with the created appointment data
 */
export const bookAppointment = withErrorHandling(
  async (appointmentDetails: Partial<Appointment>): Promise<Appointment> => {
    // Validate required fields
    if (!appointmentDetails.providerId) {
      throw new ValidationError({
        message: 'Provider ID is required',
        validationErrors: { providerId: ['Provider ID is required'] }
      });
    }
    
    if (!appointmentDetails.dateTime) {
      throw new ValidationError({
        message: 'Appointment date and time are required',
        validationErrors: { dateTime: ['Appointment date and time are required'] }
      });
    }
    
    if (!appointmentDetails.type) {
      throw new ValidationError({
        message: 'Appointment type is required',
        validationErrors: { type: ['Appointment type is required'] }
      });
    }
    
    // Get the authenticated session
    const session = getAuthenticatedSession();
    
    // Send a POST request to the /care/appointments endpoint with the appointment details and authorization header
    const response: AxiosResponse<Appointment> = await restClient.post(
      '/care/appointments',
      appointmentDetails,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    );
    
    // Invalidate the appointment cache since we've created a new appointment
    appointmentCache.data = null;
    
    // Return the created appointment data on success
    return response.data;
  },
  careServiceCircuitBreaker,
  {
    maxRetries: 2,
    initialDelayMs: 500,
    backoffFactor: 1.5
  }
);

/**
 * Retrieves all appointments for the current user.
 * Implements caching to improve performance.
 * 
 * @param forceRefresh - If true, bypasses the cache and fetches fresh data
 * @returns A promise that resolves with an array of appointments
 */
export const getAppointments = withErrorHandling(
  async (forceRefresh = false): Promise<Appointment[]> => {
    // Check if we have cached data and it's still valid
    const now = Date.now();
    if (
      !forceRefresh && 
      appointmentCache.data && 
      now - appointmentCache.timestamp < APPOINTMENT_CACHE_TIME
    ) {
      return appointmentCache.data;
    }
    
    // Get the authenticated session
    const session = getAuthenticatedSession();
    
    // Send a GET request to the /care/appointments endpoint with authorization header
    const response: AxiosResponse<Appointment[]> = await restClient.get(
      '/care/appointments',
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    );
    
    // Update the cache
    appointmentCache = {
      data: response.data,
      timestamp: now
    };
    
    // Return the appointments
    return response.data;
  },
  careServiceCircuitBreaker,
  {
    maxRetries: 2,
    initialDelayMs: 500,
    backoffFactor: 1.5
  }
);

/**
 * Retrieves a specific appointment by ID.
 * 
 * @param appointmentId - The ID of the appointment to retrieve
 * @returns A promise that resolves with the appointment data
 */
export const getAppointmentById = withErrorHandling(
  async (appointmentId: string): Promise<Appointment> => {
    // Validate appointment ID
    if (!appointmentId) {
      throw new ValidationError({
        message: 'Appointment ID is required',
        validationErrors: { appointmentId: ['Appointment ID is required'] }
      });
    }
    
    // Get the authenticated session
    const session = getAuthenticatedSession();
    
    // Send a GET request to the /care/appointments/:id endpoint with authorization header
    const response: AxiosResponse<Appointment> = await restClient.get(
      `/care/appointments/${appointmentId}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    );
    
    // Return the appointment data
    return response.data;
  },
  careServiceCircuitBreaker,
  {
    maxRetries: 2,
    initialDelayMs: 500,
    backoffFactor: 1.5
  }
);

/**
 * Cancels an existing appointment.
 * 
 * @param appointmentId - The ID of the appointment to cancel
 * @param reason - Optional reason for cancellation
 * @returns A promise that resolves with the updated appointment data
 */
export const cancelAppointment = withErrorHandling(
  async (appointmentId: string, reason?: string): Promise<Appointment> => {
    // Validate appointment ID
    if (!appointmentId) {
      throw new ValidationError({
        message: 'Appointment ID is required',
        validationErrors: { appointmentId: ['Appointment ID is required'] }
      });
    }
    
    // Get the authenticated session
    const session = getAuthenticatedSession();
    
    // Send a PATCH request to update the appointment status
    const response: AxiosResponse<Appointment> = await restClient.patch(
      `/care/appointments/${appointmentId}/cancel`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    );
    
    // Invalidate the appointment cache
    appointmentCache.data = null;
    
    // Return the updated appointment data
    return response.data;
  },
  careServiceCircuitBreaker,
  {
    maxRetries: 1, // Less retries for cancellation to avoid duplicate cancellations
    initialDelayMs: 300,
    backoffFactor: 1.5
  }
);

/**
 * Checks the symptoms entered by the user and returns possible diagnoses.
 * 
 * @param symptoms - Object containing symptom information
 * @returns A promise that resolves with the symptom check results
 */
export const checkSymptoms = withErrorHandling(
  async (symptoms: SymptomCheckRequest): Promise<SymptomCheckResult> => {
    // Validate symptoms input
    if (!symptoms || !symptoms.symptoms || symptoms.symptoms.length === 0) {
      throw new ValidationError({
        message: 'At least one symptom is required',
        validationErrors: { symptoms: ['At least one symptom is required'] }
      });
    }
    
    // Get the authenticated session
    const session = getAuthenticatedSession();
    
    // Send a POST request to the /care/symptoms/check endpoint with the symptoms and authorization header
    const response: AxiosResponse<SymptomCheckResult> = await restClient.post(
      '/care/symptoms/check',
      symptoms,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    );
    
    // Return the symptom check results on success
    return response.data;
  },
  careServiceCircuitBreaker,
  {
    maxRetries: 2,
    initialDelayMs: 500,
    backoffFactor: 1.5
  }
);