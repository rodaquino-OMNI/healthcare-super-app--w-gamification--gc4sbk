import { useQuery } from '@tanstack/react-query'; // v5.25.0
import { DeviceConnection } from '@austa/interfaces/health';
import { useAuth } from 'src/web/web/src/hooks/useAuth';
import { getConnectedDevices } from 'src/web/shared/api/health';

/**
 * Hook for fetching connected devices for a specific user
 * Supports the Wearable Device Integration requirement in the Health Journey.
 * 
 * This hook leverages TanStack Query patterns for efficient data fetching with
 * caching, background refreshing, and error handling.
 * 
 * @returns Query result containing connected devices data or error information
 */
export const useDevices = () => {
  // Get the current authentication context
  const { session } = useAuth();
  
  // Extract user ID from session
  const userId = session?.userId || '';

  // Use TanStack Query to fetch and cache connected devices data
  return useQuery<DeviceConnection[], Error>({
    queryKey: ['connectedDevices', userId], // Unique query key based on userId
    queryFn: () => getConnectedDevices(userId), // Function to fetch the data
    enabled: Boolean(userId), // Only fetch if we have a valid userId
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes before considering it stale
    gcTime: 30 * 60 * 1000, // Keep cached data for 30 minutes even if unused (renamed from cacheTime in v5)
    refetchOnWindowFocus: true, // Automatically refetch when window regains focus
    retry: (failureCount, error) => {
      // Only retry network errors, not 4xx client errors
      if (error instanceof Error && error.message.includes('Network Error')) {
        return failureCount < 3; // Retry up to 3 times for network errors
      }
      return false; // Don't retry other errors
    },
    onError: (error: Error) => {
      console.error('Error fetching connected devices:', error);
      // Here you could add a toast notification or other user feedback
    }
  });
};