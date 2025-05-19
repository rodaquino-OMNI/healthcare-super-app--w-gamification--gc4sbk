import { ReactNode, createContext, useState, useEffect, useCallback, useContext } from 'react';
import { api } from '../api/index';
import { useAuth } from '@austa/journey-context/hooks/useAuth';
import { useJourney } from '@austa/journey-context/hooks/useJourney';
import {
  Notification,
  NotificationStatus,
  NotificationType,
  NotificationPriority,
  JourneyNotificationFilter
} from '@austa/interfaces/notification/types';
import { JourneyId } from '@austa/journey-context/types';

/**
 * Maximum number of retry attempts for notification API calls
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay in milliseconds for exponential backoff
 */
const BASE_RETRY_DELAY = 1000;

/**
 * Error types for notification operations
 */
enum NotificationErrorType {
  FETCH_ERROR = 'FETCH_ERROR',
  MARK_READ_ERROR = 'MARK_READ_ERROR',
  DELETE_ERROR = 'DELETE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Error class for notification-related errors with standardized structure
 */
class NotificationError extends Error {
  type: NotificationErrorType;
  originalError?: any;
  retryable: boolean;

  constructor(message: string, type: NotificationErrorType, originalError?: any, retryable = true) {
    super(message);
    this.name = 'NotificationError';
    this.type = type;
    this.originalError = originalError;
    this.retryable = retryable;
  }
}

/**
 * Defines the structure of the notification context value.
 */
interface NotificationContextType {
  notifications: Notification[];
  filteredNotifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: NotificationError | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setJourneyFilter: (journeyId: JourneyId | null) => void;
  clearError: () => void;
}

/**
 * React context for managing notifications.
 */
export const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * Provides the notification context to its children.
 */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for storing notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [journeyFilter, setJourneyFilter] = useState<JourneyId | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<NotificationError | null>(null);
  
  // Get authentication context for user info
  const auth = useAuth();
  
  // Get journey context for journey-specific filtering
  const { currentJourney } = useJourney();
  
  /**
   * Calculate the number of unread notifications
   */
  const unreadCount = notifications.filter(
    notification => notification.status === NotificationStatus.UNREAD
  ).length;
  
  /**
   * Clear any existing error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get the current user ID from the authentication token
   */
  const getUserId = useCallback(() => {
    if (!auth.session?.accessToken) return null;
    
    try {
      const userData = auth.getUserFromToken(auth.session.accessToken);
      return userData?.id || null;
    } catch (err) {
      console.error('Failed to extract user ID from token:', err);
      return null;
    }
  }, [auth.session, auth.getUserFromToken]);
  
  /**
   * Implements retry logic with exponential backoff for API calls
   * @param operation - The async operation to retry
   * @param retries - Number of retries remaining
   * @param errorType - Type of error to throw if all retries fail
   */
  const retryWithBackoff = useCallback(async <T,>(
    operation: () => Promise<T>,
    retries: number = MAX_RETRY_ATTEMPTS,
    errorType: NotificationErrorType = NotificationErrorType.UNKNOWN_ERROR
  ): Promise<T> => {
    try {
      return await operation();
    } catch (err) {
      if (retries <= 0) {
        // No more retries, throw a standardized error
        throw new NotificationError(
          `Operation failed after ${MAX_RETRY_ATTEMPTS} attempts`,
          errorType,
          err,
          false
        );
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = BASE_RETRY_DELAY * Math.pow(2, MAX_RETRY_ATTEMPTS - retries) + 
                    Math.random() * 1000;
      
      console.log(`Retrying operation in ${Math.round(delay)}ms, ${retries} attempts remaining`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the operation with one less retry attempt
      return retryWithBackoff(operation, retries - 1, errorType);
    }
  }, []);
  
  /**
   * Filter notifications based on the current journey context
   */
  useEffect(() => {
    if (!journeyFilter) {
      // If no journey filter is set, show all notifications
      setFilteredNotifications(notifications);
      return;
    }
    
    // Filter notifications based on journey context
    const filtered = notifications.filter(notification => {
      // Always show system-wide notifications
      if (notification.type === NotificationType.SYSTEM) {
        return true;
      }
      
      // Check if notification has journey metadata
      if (notification.metadata && (notification.metadata as JourneyNotificationFilter).journeyId) {
        const notificationJourney = (notification.metadata as JourneyNotificationFilter).journeyId;
        return notificationJourney === journeyFilter;
      }
      
      // Default to showing the notification if no journey metadata
      return true;
    });
    
    setFilteredNotifications(filtered);
  }, [notifications, journeyFilter]);
  
  /**
   * Update journey filter when current journey changes
   */
  useEffect(() => {
    if (currentJourney) {
      setJourneyFilter(currentJourney.id as JourneyId);
    }
  }, [currentJourney]);
  
  /**
   * Fetch notifications for the current user
   */
  const fetchNotifications = useCallback(async () => {
    if (!auth.isAuthenticated) {
      console.warn('Cannot fetch notifications: User is not authenticated');
      return;
    }
    
    setIsLoading(true);
    clearError();
    
    try {
      const userId = getUserId();
      
      if (!userId) {
        throw new NotificationError(
          'Cannot fetch notifications: User ID not found',
          NotificationErrorType.UNAUTHORIZED,
          null,
          false
        );
      }
      
      // Use retry with backoff for fetching notifications
      const notificationData = await retryWithBackoff(
        () => api.notifications.getNotifications(userId),
        MAX_RETRY_ATTEMPTS,
        NotificationErrorType.FETCH_ERROR
      );
      
      // Sort notifications by date (newest first) and priority
      const sortedNotifications = notificationData.sort((a, b) => {
        // First sort by priority (higher priority first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        
        // Then sort by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      
      // Set standardized error
      if (error instanceof NotificationError) {
        setError(error);
      } else {
        setError(new NotificationError(
          'Failed to fetch notifications',
          NotificationErrorType.FETCH_ERROR,
          error,
          true
        ));
      }
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated, getUserId, retryWithBackoff, clearError]);
  
  /**
   * Mark a notification as read
   * @param id - The ID of the notification to mark as read
   */
  const markAsRead = useCallback(async (id: string) => {
    if (!auth.isAuthenticated) {
      console.warn('Cannot mark notification as read: User is not authenticated');
      return;
    }
    
    clearError();
    
    try {
      // Use retry with backoff for marking notification as read
      await retryWithBackoff(
        () => api.notifications.markNotificationAsRead(id),
        MAX_RETRY_ATTEMPTS,
        NotificationErrorType.MARK_READ_ERROR
      );
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id 
            ? { 
                ...notification, 
                status: NotificationStatus.READ, 
                readAt: new Date() 
              } 
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      
      // Set standardized error
      if (error instanceof NotificationError) {
        setError(error);
      } else {
        setError(new NotificationError(
          'Failed to mark notification as read',
          NotificationErrorType.MARK_READ_ERROR,
          error,
          true
        ));
      }
    }
  }, [auth.isAuthenticated, retryWithBackoff, clearError]);
  
  /**
   * Delete a notification
   * @param id - The ID of the notification to delete
   */
  const deleteNotification = useCallback(async (id: string) => {
    if (!auth.isAuthenticated) {
      console.warn('Cannot delete notification: User is not authenticated');
      return;
    }
    
    clearError();
    
    try {
      // Check if the API endpoint exists
      if (api.notifications.deleteNotification) {
        // Use retry with backoff for deleting notification
        await retryWithBackoff(
          () => api.notifications.deleteNotification!(id),
          MAX_RETRY_ATTEMPTS,
          NotificationErrorType.DELETE_ERROR
        );
      } else {
        console.warn('API endpoint for deleting notifications not implemented');
      }
      
      // Update the UI by removing the notification from state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
      
      // Set standardized error
      if (error instanceof NotificationError) {
        setError(error);
      } else {
        setError(new NotificationError(
          'Failed to delete notification',
          NotificationErrorType.DELETE_ERROR,
          error,
          true
        ));
      }
    }
  }, [auth.isAuthenticated, retryWithBackoff, clearError]);
  
  // Fetch notifications when authentication state changes
  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setFilteredNotifications([]);
      clearError();
    }
  }, [auth.isAuthenticated, fetchNotifications, clearError]);
  
  // The value provided to consuming components
  const contextValue: NotificationContextType = {
    notifications,
    filteredNotifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    setJourneyFilter,
    clearError,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to access the notification context.
 * Throws an error if used outside of a NotificationProvider.
 */
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
};