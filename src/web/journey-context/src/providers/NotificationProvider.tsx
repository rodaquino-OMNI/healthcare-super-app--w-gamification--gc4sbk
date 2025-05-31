import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Notification, NotificationStatus } from '@austa/interfaces/notification/types';
import { NotificationAdapter } from '../adapters';
import { useAuth } from './AuthProvider';

/**
 * Interface defining the notification context value
 * Provides access to notifications data and related functionality
 */
interface NotificationContextType {
  /** List of user notifications */
  notifications: Notification[];
  
  /** Loading state for notification data */
  isLoading: boolean;
  
  /** Error state for notification operations */
  error: Error | null;
  
  /** Count of unread notifications */
  unreadCount: number;
  
  /** Function to fetch notifications for the current user */
  fetchNotifications: () => Promise<void>;
  
  /** Function to mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  
  /** Function to delete a notification */
  deleteNotification: (notificationId: string) => Promise<void>;
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
 * Platform-agnostic notification provider that centralizes user notification management
 * and distribution throughout the application. It manages notification state and provides
 * operations to fetch, mark as read, and delete notifications.
 * 
 * This provider abstracts platform-specific notification API calls through adapters,
 * making it compatible with both web and mobile applications.
 */
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  // State for storing notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Loading state for async operations
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Error state for notification operations
  const [error, setError] = useState<Error | null>(null);
  
  // Get authentication context for user info
  const auth = useAuth();
  
  /**
   * Calculate the number of unread notifications
   */
  const unreadCount = notifications.filter(
    (notification) => notification.status !== NotificationStatus.READ
  ).length;
  
  /**
   * Fetch notifications for the current user
   * Uses the platform-specific adapter to retrieve notifications
   */
  const fetchNotifications = useCallback(async () => {
    // Skip if user is not authenticated
    if (!auth.isAuthenticated || !auth.user?.id) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = auth.user.id;
      const notificationData = await NotificationAdapter.getNotifications(userId);
      setNotifications(notificationData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated, auth.user]);
  
  /**
   * Mark a notification as read
   * Uses the platform-specific adapter to update notification status
   * 
   * @param notificationId - The ID of the notification to mark as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    // Skip if user is not authenticated
    if (!auth.isAuthenticated) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await NotificationAdapter.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { 
                ...notification, 
                status: NotificationStatus.READ, 
                updatedAt: new Date() 
              } 
            : notification
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
      console.error('Failed to mark notification as read:', err);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);
  
  /**
   * Delete a notification
   * Uses the platform-specific adapter to remove a notification
   * 
   * @param notificationId - The ID of the notification to delete
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    // Skip if user is not authenticated
    if (!auth.isAuthenticated) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await NotificationAdapter.deleteNotification(notificationId);
      
      // Update local state by removing the notification
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete notification'));
      console.error('Failed to delete notification:', err);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);
  
  // Fetch notifications when authentication state changes
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
    }
  }, [auth.isAuthenticated, auth.user, fetchNotifications]);
  
  // The value provided to consuming components
  const contextValue: NotificationContextType = {
    notifications,
    isLoading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    deleteNotification,
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
 * @throws Error if used outside of NotificationProvider
 * 
 * @example
 * const { notifications, markAsRead, unreadCount } = useNotifications();
 * 
 * // Display unread count
 * return <Badge count={unreadCount} />;
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};