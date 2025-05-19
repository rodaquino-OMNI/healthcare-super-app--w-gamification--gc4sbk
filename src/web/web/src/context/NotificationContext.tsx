import { createContext, useContext, ReactNode, useState, useCallback } from 'react'; // react 18.0+
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '@austa/interfaces/notification';

/**
 * Custom error class for notification-related errors
 * Provides better error handling and context for notification operations
 */
export class NotificationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NotificationError';
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, NotificationError.prototype);
  }
}

/**
 * Type definition for the notification context
 * Provides access to notifications data and related functionality
 */
interface NotificationContextType {
  /** List of user notifications */
  notifications: Notification[];
  
  /** Loading state for notification data */
  isLoading: boolean;
  
  /** Function to mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  
  /** Count of unread notifications */
  unreadCount: number | undefined;
  
  /** Last error that occurred during notification operations */
  error: NotificationError | null;
  
  /** Clear the current error state */
  clearError: () => void;
}

// Create the context with a default value of undefined
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Props for the NotificationProvider component
 */
interface NotificationProviderProps {
  /** React children */
  children: ReactNode;
}

/**
 * Provider component that makes notification functionality available to all child components
 * This provider should be placed within the application's component tree, typically near the root
 * but below the AuthProvider since it depends on authentication state.
 */
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  // Use the useNotifications hook to get notification functionality
  const { 
    notifications, 
    isLoading, 
    markAsRead: markNotificationAsRead, 
    unreadCount
  } = useNotifications();
  
  // State for error handling (since the hook might not have this yet)
  const [error, setError] = useState<NotificationError | null>(null);
  
  // Function to clear the current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Wrapper for markAsRead with proper error handling
  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (err) {
      // Create a NotificationError with context information
      const notificationError = new NotificationError(
        err instanceof Error ? err.message : 'Failed to mark notification as read',
        'NOTIFICATION_MARK_READ_ERROR',
        { notificationId, originalError: err }
      );
      
      // Set the error state
      setError(notificationError);
      
      // Log the error for debugging
      console.error('Error marking notification as read:', notificationError);
    }
  };

  // The value to be provided to consuming components
  const contextValue: NotificationContextType = {
    notifications,
    isLoading,
    markAsRead,
    unreadCount,
    error,
    clearError
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to use the notification context
 * This hook provides access to the user's notifications and related functionality
 * 
 * @returns The notification context value including notifications, loading state, and functions
 * @throws NotificationError if used outside of NotificationProvider
 * 
 * @example
 * const { notifications, markAsRead, unreadCount, error } = useNotificationContext();
 * 
 * // Handle errors
 * useEffect(() => {
 *   if (error) {
 *     toast.error(`Notification error: ${error.message}`);
 *     clearError();
 *   }
 * }, [error, clearError]);
 * 
 * // Display unread count
 * return <Badge count={unreadCount} />;
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new NotificationError(
      'useNotificationContext must be used within a NotificationProvider',
      'CONTEXT_OUTSIDE_PROVIDER',
      { component: 'useNotificationContext' }
    );
  }
  
  return context;
};