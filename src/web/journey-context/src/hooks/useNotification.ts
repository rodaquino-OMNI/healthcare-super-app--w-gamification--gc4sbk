/**
 * Platform-agnostic hook for accessing and managing notifications
 * 
 * This hook provides a unified interface for retrieving notification data,
 * handling loading states, tracking unread counts, and marking notifications as read.
 * It abstracts away platform-specific implementation details, ensuring consistent
 * notification behavior throughout the application.
 * 
 * @module hooks/useNotification
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationAdapter } from '../adapters';
import { useAuth } from './useAuth';
import {
  Notification,
  NotificationStatus,
  NotificationType,
  NotificationPriority
} from '@austa/interfaces/notification/types';

/**
 * Return type for the useNotification hook
 */
export interface UseNotificationResult {
  /** List of user notifications */
  notifications: Notification[];
  
  /** Loading state for notification data */
  isLoading: boolean;
  
  /** Error state for notification operations */
  error: Error | null;
  
  /** Count of unread notifications */
  unreadCount: number;
  
  /** Function to mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  
  /** Function to manually refresh notifications */
  refresh: () => Promise<void>;
  
  /** Function to delete a notification (if supported by platform) */
  deleteNotification?: (notificationId: string) => Promise<void>;
}

/**
 * Custom React hook for managing and interacting with user notifications
 * across both web and mobile platforms.
 * 
 * This hook provides a unified interface for retrieving notification data,
 * handling loading states, tracking unread counts, and marking notifications as read.
 * 
 * @returns An object containing notifications, loading state, error state, unread count,
 * and functions to interact with notifications.
 * 
 * @example
 * ```tsx
 * const { notifications, isLoading, unreadCount, markAsRead } = useNotification();
 * 
 * // Display unread count
 * return <Badge count={unreadCount} />;
 * 
 * // Mark a notification as read
 * const handleNotificationPress = (id: string) => {
 *   markAsRead(id);
 * };
 * ```
 */
export const useNotification = (): UseNotificationResult => {
  // State for storing notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Error state
  const [error, setError] = useState<Error | null>(null);
  
  // Count of unread notifications
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Reference to store subscription for cleanup
  const subscriptionRef = useRef<(() => void) | null>(null);
  
  // Get the current user information from auth
  const { userId, isAuthenticated } = useAuth();

  /**
   * Calculate the number of unread notifications
   */
  const calculateUnreadCount = useCallback((notificationsList: Notification[]): number => {
    return notificationsList.filter(
      notification => notification.status !== NotificationStatus.READ
    ).length;
  }, []);

  /**
   * Handle new notification from real-time updates
   */
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  /**
   * Fetch notifications from the adapter
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await NotificationAdapter.getNotifications(userId);
      setNotifications(data);
    } catch (err) {
      const errorObject = err instanceof Error ? err : new Error('Failed to fetch notifications');
      setError(errorObject);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  /**
   * Mark a notification as read
   * @param notificationId - The ID of the notification to mark as read
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!isAuthenticated) {
      console.warn('Cannot mark notification as read: User is not authenticated');
      return;
    }

    try {
      await NotificationAdapter.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { 
                ...notification, 
                status: NotificationStatus.READ, 
                readAt: new Date() 
              } 
            : notification
        )
      );
    } catch (err) {
      const errorObject = err instanceof Error ? err : new Error('Failed to mark notification as read');
      setError(errorObject);
      console.error('Error marking notification as read:', err);
      throw errorObject;
    }
  }, [isAuthenticated]);

  /**
   * Delete a notification if the platform supports it
   * @param notificationId - The ID of the notification to delete
   */
  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    if (!isAuthenticated) {
      console.warn('Cannot delete notification: User is not authenticated');
      return;
    }

    try {
      // Check if the adapter supports deleting notifications
      if (NotificationAdapter.deleteNotification) {
        await NotificationAdapter.deleteNotification(notificationId);
      } else {
        console.warn('Notification deletion not supported on this platform');
      }
      
      // Update local state regardless of adapter support
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      const errorObject = err instanceof Error ? err : new Error('Failed to delete notification');
      setError(errorObject);
      console.error('Error deleting notification:', err);
      throw errorObject;
    }
  }, [isAuthenticated]);

  // Fetch notifications on component mount and when auth state changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time notifications if supported by the adapter
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Only subscribe if the adapter supports it
    if (NotificationAdapter.subscribeToNotifications) {
      subscriptionRef.current = NotificationAdapter.subscribeToNotifications(
        userId,
        handleNewNotification
      );
    }

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [userId, isAuthenticated, handleNewNotification]);

  // Update unread count whenever notifications change
  useEffect(() => {
    setUnreadCount(calculateUnreadCount(notifications));
  }, [notifications, calculateUnreadCount]);

  // Prepare the result object
  const result: UseNotificationResult = {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    refresh: fetchNotifications,
  };

  // Only add deleteNotification if the adapter supports it
  if (NotificationAdapter.deleteNotification) {
    result.deleteNotification = deleteNotification;
  }

  return result;
};

/**
 * Filter notifications by type
 * 
 * @param notifications - The list of notifications to filter
 * @param type - The notification type to filter by
 * @returns A filtered list of notifications of the specified type
 */
export const filterNotificationsByType = (
  notifications: Notification[],
  type: NotificationType
): Notification[] => {
  return notifications.filter(notification => notification.type === type);
};

/**
 * Filter notifications by priority
 * 
 * @param notifications - The list of notifications to filter
 * @param priority - The notification priority to filter by
 * @returns A filtered list of notifications of the specified priority
 */
export const filterNotificationsByPriority = (
  notifications: Notification[],
  priority: NotificationPriority
): Notification[] => {
  return notifications.filter(notification => notification.priority === priority);
};

/**
 * Get unread notifications from a list
 * 
 * @param notifications - The list of notifications to filter
 * @returns A filtered list of unread notifications
 */
export const getUnreadNotifications = (notifications: Notification[]): Notification[] => {
  return notifications.filter(
    notification => notification.status !== NotificationStatus.READ
  );
};

export default useNotification;