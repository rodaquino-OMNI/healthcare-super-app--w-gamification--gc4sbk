/**
 * useNotification Hook
 * 
 * A platform-agnostic hook for accessing and managing notifications across web and mobile platforms.
 * Provides a unified interface for retrieving notification data, handling loading states,
 * tracking unread counts, and marking notifications as read.
 * 
 * @packageDocumentation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationAdapter, currentPlatform } from '../adapters';
import { useAuth } from './useAuth';
import {
  Notification,
  NotificationStatus,
  NotificationFilter,
  NotificationCount
} from '@austa/interfaces/notification';

/**
 * Options for the useNotification hook
 */
export interface UseNotificationOptions {
  /** 
   * Auto-refresh interval in milliseconds
   * Set to 0 to disable auto-refresh
   * @default 60000 (1 minute)
   */
  refreshInterval?: number;
  
  /**
   * Initial filter to apply to notifications
   */
  initialFilter?: NotificationFilter;
  
  /**
   * Whether to subscribe to real-time updates
   * @default true
   */
  subscribeToUpdates?: boolean;
}

/**
 * Return type for the useNotification hook
 */
export interface UseNotificationResult {
  /** List of notifications */
  notifications: Notification[];
  
  /** Whether notifications are currently loading */
  isLoading: boolean;
  
  /** Error that occurred during notification operations, if any */
  error: Error | null;
  
  /** Count of unread notifications */
  unreadCount: number;
  
  /** Detailed notification counts by type and status */
  counts: NotificationCount;
  
  /** Function to mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  
  /** Function to mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  
  /** Function to manually refresh notifications */
  refresh: () => Promise<void>;
  
  /** Function to apply a filter to the notifications */
  applyFilter: (filter: NotificationFilter) => void;
  
  /** Current filter applied to notifications */
  currentFilter: NotificationFilter | null;
}

/**
 * Default options for the useNotification hook
 */
const defaultOptions: UseNotificationOptions = {
  refreshInterval: 60000, // 1 minute
  initialFilter: undefined,
  subscribeToUpdates: true,
};

/**
 * A custom React hook for managing and interacting with user notifications.
 * 
 * This hook provides a unified interface for notification functionality across
 * web and mobile platforms, abstracting away platform-specific implementation details.
 * 
 * @param options - Configuration options for the hook
 * @returns An object containing notifications, loading state, error state, counts, and utility functions
 * 
 * @example
 * ```tsx
 * const { 
 *   notifications, 
 *   isLoading, 
 *   unreadCount, 
 *   markAsRead,
 *   refresh 
 * } = useNotification();
 * 
 * // Display notifications
 * return (
 *   <div>
 *     <Badge count={unreadCount} />
 *     {isLoading ? (
 *       <Spinner />
 *     ) : (
 *       <NotificationList 
 *         notifications={notifications} 
 *         onMarkAsRead={markAsRead} 
 *       />
 *     )}
 *     <Button onClick={refresh}>Refresh</Button>
 *   </div>
 * );
 * ```
 */
export const useNotification = (options?: UseNotificationOptions): UseNotificationResult => {
  // Merge provided options with defaults
  const {
    refreshInterval,
    initialFilter,
    subscribeToUpdates,
  } = { ...defaultOptions, ...options };

  // State for notifications and related data
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [counts, setCounts] = useState<NotificationCount>({
    total: 0,
    unread: 0,
    byType: {}
  });
  const [currentFilter, setCurrentFilter] = useState<NotificationFilter | null>(
    initialFilter || null
  );

  // Reference to store subscription for cleanup
  const subscriptionRef = useRef<any>(null);
  // Reference to store refresh interval for cleanup
  const refreshIntervalRef = useRef<any>(null);

  // Get authentication context
  const { userId, isAuthenticated } = useAuth();

  /**
   * Calculate notification counts from the notification list
   */
  const calculateCounts = useCallback((notificationsList: Notification[]): NotificationCount => {
    const counts: NotificationCount = {
      total: notificationsList.length,
      unread: 0,
      byType: {}
    };

    // Calculate counts by iterating through notifications
    notificationsList.forEach(notification => {
      // Count unread notifications
      if (notification.status !== NotificationStatus.READ) {
        counts.unread += 1;
      }

      // Count by type
      if (!counts.byType[notification.type]) {
        counts.byType[notification.type] = 0;
      }
      counts.byType[notification.type]! += 1;
    });

    return counts;
  }, []);

  /**
   * Fetch notifications from the adapter
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setNotifications([]);
      setUnreadCount(0);
      setCounts({
        total: 0,
        unread: 0,
        byType: {}
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get notifications from the adapter
      const fetchedNotifications = await NotificationAdapter.getNotifications();
      
      // Apply filter if one is set
      let filteredNotifications = fetchedNotifications;
      if (currentFilter) {
        filteredNotifications = applyFilterToNotifications(fetchedNotifications, currentFilter);
      }
      
      // Update state with fetched notifications
      setNotifications(filteredNotifications);
      
      // Calculate and update counts
      const newCounts = calculateCounts(filteredNotifications);
      setCounts(newCounts);
      setUnreadCount(newCounts.unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, currentFilter, calculateCounts]);

  /**
   * Apply a filter to the notifications list
   */
  const applyFilterToNotifications = (notificationsList: Notification[], filter: NotificationFilter): Notification[] => {
    return notificationsList.filter(notification => {
      // Filter by types
      if (filter.types && filter.types.length > 0 && !filter.types.includes(notification.type)) {
        return false;
      }
      
      // Filter by status
      if (filter.status && notification.status !== filter.status) {
        return false;
      }
      
      // Filter by channel
      if (filter.channel && notification.channel !== filter.channel) {
        return false;
      }
      
      // Filter by read status
      if (filter.read !== undefined) {
        const isRead = notification.status === NotificationStatus.READ;
        if (filter.read !== isRead) {
          return false;
        }
      }
      
      // Filter by date range
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        const notificationDate = new Date(notification.createdAt);
        if (notificationDate < startDate) {
          return false;
        }
      }
      
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        const notificationDate = new Date(notification.createdAt);
        if (notificationDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  /**
   * Apply a filter to the current notifications
   */
  const applyFilter = useCallback((filter: NotificationFilter) => {
    setCurrentFilter(filter);
    
    // Apply filter to current notifications
    const filteredNotifications = applyFilterToNotifications(notifications, filter);
    setNotifications(filteredNotifications);
    
    // Update counts based on filtered notifications
    const newCounts = calculateCounts(filteredNotifications);
    setCounts(newCounts);
    setUnreadCount(newCounts.unread);
  }, [notifications, calculateCounts]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) {
      console.warn('Cannot mark notification as read: User is not authenticated');
      return;
    }

    try {
      // Call the adapter to mark the notification as read
      await NotificationAdapter.markAsRead(notificationId);
      
      // Update the local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { 
                ...notification, 
                status: NotificationStatus.READ, 
                readAt: new Date().toISOString() 
              } 
            : notification
        )
      );
      
      // Recalculate counts
      setNotifications(currentNotifications => {
        const newCounts = calculateCounts(currentNotifications);
        setCounts(newCounts);
        setUnreadCount(newCounts.unread);
        return currentNotifications;
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
      throw err;
    }
  }, [isAuthenticated, calculateCounts]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn('Cannot mark all notifications as read: User is not authenticated');
      return;
    }

    try {
      // Call the adapter to mark all notifications as read
      await NotificationAdapter.markAllAsRead();
      
      // Update the local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          status: NotificationStatus.READ,
          readAt: new Date().toISOString()
        }))
      );
      
      // Update counts
      setCounts(prevCounts => ({
        ...prevCounts,
        unread: 0
      }));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark all notifications as read'));
      throw err;
    }
  }, [isAuthenticated]);

  /**
   * Handle new notification from real-time updates
   */
  const handleNewNotification = useCallback((notification: Notification) => {
    // Check if the notification passes the current filter
    if (currentFilter && !applyFilterToNotifications([notification], currentFilter).length) {
      return;
    }
    
    // Add the new notification to the list
    setNotifications(prev => [notification, ...prev]);
    
    // Update counts
    setNotifications(currentNotifications => {
      const newCounts = calculateCounts(currentNotifications);
      setCounts(newCounts);
      setUnreadCount(newCounts.unread);
      return currentNotifications;
    });
  }, [currentFilter, calculateCounts]);

  // Fetch notifications on component mount and when dependencies change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshInterval, fetchNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !userId || !subscribeToUpdates) {
      return;
    }

    // Platform-specific subscription setup
    if (currentPlatform === 'web') {
      // Web-specific implementation using the adapter
      try {
        // This would typically involve WebSocket or SSE subscription
        // The actual implementation depends on the NotificationAdapter
        // For now, we'll assume the adapter provides a method to subscribe
        subscriptionRef.current = NotificationAdapter.subscribeToNotifications?.(handleNewNotification);
      } catch (err) {
        console.error('Error subscribing to notifications:', err);
      }
    } else {
      // Mobile-specific implementation
      try {
        // Similar to web, but might use different native APIs
        subscriptionRef.current = NotificationAdapter.subscribeToNotifications?.(handleNewNotification);
      } catch (err) {
        console.error('Error subscribing to notifications:', err);
      }
    }

    // Cleanup function
    return () => {
      if (subscriptionRef.current && typeof subscriptionRef.current === 'function') {
        subscriptionRef.current();
      }
    };
  }, [isAuthenticated, userId, subscribeToUpdates, handleNewNotification]);

  // Return the hook result
  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    counts,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
    applyFilter,
    currentFilter,
  };
};