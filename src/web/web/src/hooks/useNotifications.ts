import { useState, useEffect, useCallback, useRef } from 'react'; // react 18.2.0
import { useAuth } from './useAuth';
import { getNotifications, markNotificationAsRead } from '../api/notifications';
import { io, Socket } from 'socket.io-client'; // socket.io-client 4.7.4
import apiConfig from 'src/web/shared/config/apiConfig';

// Import types from the new @austa/interfaces package
import { 
  Notification, 
  NotificationStatus,
  NotificationFilter 
} from '@austa/interfaces/notification';
import { ApiError } from '@austa/interfaces/common';

/**
 * Error types specific to notification operations
 */
export interface NotificationError extends ApiError {
  code: 'NOTIFICATION_NOT_FOUND' | 'NOTIFICATION_ALREADY_READ' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR';
}

/**
 * Options for the useNotifications hook
 */
export interface UseNotificationsOptions {
  /** Initial filter to apply to notifications */
  initialFilter?: NotificationFilter;
  /** Whether to automatically connect to real-time updates */
  autoConnect?: boolean;
  /** Maximum number of notifications to fetch */
  limit?: number;
}

/**
 * A custom React hook for managing and interacting with user notifications.
 * Provides functionality for fetching, filtering, and managing notifications,
 * as well as subscribing to real-time updates.
 * 
 * @param options - Configuration options for the hook
 * @returns An object containing the notifications, loading state, unread count, and functions to interact with notifications
 */
export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { 
    initialFilter = {},
    autoConnect = true,
    limit = 50
  } = options;

  // State for storing notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  // Error state
  const [error, setError] = useState<NotificationError | null>(null);
  // Count of unread notifications
  const [unreadCount, setUnreadCount] = useState(0);
  // Filter state
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
  // Connection state for real-time updates
  const [isConnected, setIsConnected] = useState(false);
  
  // Reference to store socket connection for cleanup
  const socketRef = useRef<Socket | null>(null);
  
  // Get the current user ID from auth
  const { session } = useAuth();
  const userId = session?.userId;

  /**
   * Function to mark a notification as read
   * 
   * @param notificationId - The ID of the notification to mark as read
   * @returns A promise that resolves when the notification is marked as read
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update the notifications state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: NotificationStatus.READ, readAt: new Date() } 
            : notification
        )
      );

      // Clear any previous errors
      setError(null);
    } catch (err: unknown) {
      // Type guard for ApiError
      const apiError = err as ApiError;
      
      // Create a typed notification error
      const notificationError: NotificationError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred while marking notification as read',
        status: apiError.status || 500,
        ...apiError
      };
      
      // Set the error state
      setError(notificationError);
      console.error('Error marking notification as read:', notificationError);
      
      // Re-throw the error for the caller to handle if needed
      throw notificationError;
    }
  }, []);

  /**
   * Function to mark all notifications as read
   * 
   * @returns A promise that resolves when all notifications are marked as read
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!userId || notifications.length === 0) return;

    try {
      // Get all unread notification IDs
      const unreadIds = notifications
        .filter(notification => notification.status !== NotificationStatus.READ)
        .map(notification => notification.id);

      // Mark each notification as read sequentially
      // This could be optimized with a batch API endpoint in the future
      for (const id of unreadIds) {
        await markAsRead(id);
      }

      // Clear any previous errors
      setError(null);
    } catch (err: unknown) {
      // Type guard for ApiError
      const apiError = err as ApiError;
      
      // Create a typed notification error
      const notificationError: NotificationError = {
        code: 'UNKNOWN_ERROR',
        message: 'An error occurred while marking all notifications as read',
        status: apiError.status || 500,
        ...apiError
      };
      
      // Set the error state
      setError(notificationError);
      console.error('Error marking all notifications as read:', notificationError);
      
      // Re-throw the error for the caller to handle if needed
      throw notificationError;
    }
  }, [userId, notifications, markAsRead]);

  /**
   * Calculate unread count from the notifications list
   * 
   * @param notificationsList - The list of notifications to count unread from
   * @returns The number of unread notifications
   */
  const calculateUnreadCount = useCallback((notificationsList: Notification[]): number => {
    return notificationsList.filter(notification => notification.status !== NotificationStatus.READ).length;
  }, []);

  /**
   * Handle new notification from real-time updates
   * 
   * @param notification - The new notification received
   */
  const handleNewNotification = useCallback((notification: Notification): void => {
    // Add the new notification to the beginning of the list
    setNotifications(prev => [notification, ...prev]);
    
    // Play notification sound if enabled in user preferences
    // This could be enhanced with user preference checks
    if (notification.priority === 'high' || notification.priority === 'critical') {
      // Play a sound for high priority notifications
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(err => console.error('Failed to play notification sound:', err));
    }
  }, []);

  /**
   * Connect to the real-time notification service
   */
  const connect = useCallback(() => {
    if (!userId || isConnected || socketRef.current) return;

    try {
      // Create a new socket connection
      const socket = io(`${apiConfig.baseURL}/notifications`, {
        auth: {
          token: session?.accessToken
        },
        query: {
          userId
        },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      // Set up event handlers
      socket.on('connect', () => {
        console.log('Connected to notification service');
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from notification service:', reason);
        setIsConnected(false);
      });

      socket.on('error', (err) => {
        console.error('Notification socket error:', err);
        setError({
          code: 'UNKNOWN_ERROR',
          message: 'Error connecting to notification service',
          status: 500
        });
      });

      socket.on('notification', handleNewNotification);

      // Store the socket reference for cleanup
      socketRef.current = socket;
    } catch (err) {
      console.error('Error setting up notification socket:', err);
      setError({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to connect to notification service',
        status: 500
      });
    }
  }, [userId, isConnected, session, handleNewNotification]);

  /**
   * Disconnect from the real-time notification service
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting from notification service');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Apply a filter to the notifications
   * 
   * @param newFilter - The filter to apply
   */
  const applyFilter = useCallback((newFilter: NotificationFilter) => {
    setFilter(newFilter);
    // This will trigger a re-fetch with the new filter
  }, []);

  /**
   * Fetch notifications based on current filter
   */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Combine userId with current filter and limit
      const data = await getNotifications(userId, { ...filter, limit });
      setNotifications(data);
      setError(null);
    } catch (err: unknown) {
      // Type guard for ApiError
      const apiError = err as ApiError;
      
      // Create a typed notification error
      const notificationError: NotificationError = {
        code: 'UNKNOWN_ERROR',
        message: 'Error fetching notifications',
        status: apiError.status || 500,
        ...apiError
      };
      
      // Set the error state
      setError(notificationError);
      console.error('Error fetching notifications:', notificationError);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filter, limit]);

  // Fetch notifications when userId or filter changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Connect to real-time notifications if autoConnect is true
  useEffect(() => {
    if (autoConnect && userId && !isConnected) {
      connect();
    }

    // Cleanup function to disconnect when component unmounts
    return () => {
      disconnect();
    };
  }, [userId, autoConnect, isConnected, connect, disconnect]);

  // Update unread count whenever notifications change
  useEffect(() => {
    setUnreadCount(calculateUnreadCount(notifications));
  }, [notifications, calculateUnreadCount]);

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    connect,
    disconnect,
    applyFilter,
    refresh: fetchNotifications
  };
};