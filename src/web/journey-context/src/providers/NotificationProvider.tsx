import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { detectPlatform } from '../utils/platform';
import useAuth from '../hooks/useAuth';
import { webNotificationAdapter, NotificationAdapter as WebNotificationAdapter } from '../adapters/web/NotificationAdapter';
import { mobileNotificationAdapter, NotificationAdapter as MobileNotificationAdapter } from '../adapters/mobile/NotificationAdapter';
import {
  Notification,
  NotificationStatus,
  NotificationFilter,
  NotificationCount
} from '@austa/interfaces/notification/types';

/**
 * Interface for the notification context value provided to consumers
 */
interface NotificationContextType {
  /** List of user notifications */
  notifications: Notification[];
  
  /** Loading state for notification data */
  isLoading: boolean;
  
  /** Count of unread notifications */
  unreadCount: number;
  
  /** Function to fetch notifications */
  fetchNotifications: () => Promise<void>;
  
  /** Function to mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  
  /** Function to delete a notification */
  deleteNotification: (notificationId: string) => Promise<void>;
  
  /** Function to get notification counts by status */
  getNotificationCounts: () => Promise<NotificationCount>;
  
  /** Function to filter notifications */
  filterNotifications: (filter: NotificationFilter) => Promise<Notification[]>;
}

// Create the context with a default undefined value
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
  
  // Loading state for notification operations
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Count of unread notifications
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Get authentication context for user info
  const auth = useAuth();
  
  // Determine which platform-specific adapter to use
  const platform = detectPlatform();
  const notificationAdapter: WebNotificationAdapter | MobileNotificationAdapter = 
    platform === 'web' ? webNotificationAdapter : mobileNotificationAdapter;
  
  /**
   * Calculate the number of unread notifications
   */
  const calculateUnreadCount = useCallback((notificationList: Notification[]) => {
    return notificationList.filter(notification => 
      notification.status === NotificationStatus.SENT || 
      notification.status === NotificationStatus.DELIVERED
    ).length;
  }, []);
  
  /**
   * Fetch notifications for the current user
   */
  const fetchNotifications = useCallback(async () => {
    if (!auth.isAuthenticated) {
      console.warn('Cannot fetch notifications: User is not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      const userId = auth.user?.id;
      
      if (!userId) {
        console.warn('Cannot fetch notifications: User ID not found');
        setIsLoading(false);
        return;
      }
      
      const notificationData = await notificationAdapter.getNotifications(userId);
      setNotifications(notificationData);
      setUnreadCount(calculateUnreadCount(notificationData));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated, auth.user, notificationAdapter, calculateUnreadCount]);
  
  /**
   * Mark a notification as read
   * @param notificationId - The ID of the notification to mark as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!auth.isAuthenticated) {
      console.warn('Cannot mark notification as read: User is not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      await notificationAdapter.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => {
        const updatedNotifications = prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { 
                ...notification, 
                status: NotificationStatus.READ, 
                readAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } 
            : notification
        );
        
        // Update unread count
        setUnreadCount(calculateUnreadCount(updatedNotifications));
        
        return updatedNotifications;
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated, notificationAdapter, calculateUnreadCount]);
  
  /**
   * Delete a notification
   * @param notificationId - The ID of the notification to delete
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!auth.isAuthenticated) {
      console.warn('Cannot delete notification: User is not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      await notificationAdapter.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => {
        const updatedNotifications = prevNotifications.filter(
          notification => notification.id !== notificationId
        );
        
        // Update unread count
        setUnreadCount(calculateUnreadCount(updatedNotifications));
        
        return updatedNotifications;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated, notificationAdapter, calculateUnreadCount]);
  
  /**
   * Get notification counts by status
   */
  const getNotificationCounts = useCallback(async (): Promise<NotificationCount> => {
    if (!auth.isAuthenticated) {
      console.warn('Cannot get notification counts: User is not authenticated');
      return { total: 0, unread: 0, byType: {} };
    }
    
    try {
      const userId = auth.user?.id;
      
      if (!userId) {
        console.warn('Cannot get notification counts: User ID not found');
        return { total: 0, unread: 0, byType: {} };
      }
      
      return await notificationAdapter.getNotificationCounts(userId);
    } catch (error) {
      console.error('Failed to get notification counts:', error);
      return { total: 0, unread: 0, byType: {} };
    }
  }, [auth.isAuthenticated, auth.user, notificationAdapter]);
  
  /**
   * Filter notifications based on criteria
   * @param filter - The filter criteria
   */
  const filterNotifications = useCallback(async (filter: NotificationFilter): Promise<Notification[]> => {
    if (!auth.isAuthenticated) {
      console.warn('Cannot filter notifications: User is not authenticated');
      return [];
    }
    
    try {
      const userId = auth.user?.id;
      
      if (!userId) {
        console.warn('Cannot filter notifications: User ID not found');
        return [];
      }
      
      return await notificationAdapter.filterNotifications(userId, filter);
    } catch (error) {
      console.error('Failed to filter notifications:', error);
      return [];
    }
  }, [auth.isAuthenticated, auth.user, notificationAdapter]);
  
  // Fetch notifications when authentication state changes
  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [auth.isAuthenticated, fetchNotifications]);
  
  // The value provided to consuming components
  const contextValue: NotificationContextType = {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    getNotificationCounts,
    filterNotifications,
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
 * const { notifications, markAsRead, unreadCount } = useNotificationContext();
 * 
 * // Display unread count
 * return <Badge count={unreadCount} />;
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
};