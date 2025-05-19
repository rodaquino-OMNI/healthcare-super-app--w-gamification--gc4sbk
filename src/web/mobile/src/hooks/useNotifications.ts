import { useState, useEffect, useCallback } from 'react'; // Version ^18.0.0
import { getNotifications, markNotificationAsRead } from '@app/api/notifications';
import { Notification, NotificationStatus } from '@austa/interfaces/notification';
import { useJourney } from '@austa/journey-context';
import { useErrorHandler } from '@app/utils/errorHandling';

/**
 * A React hook that fetches and manages notifications for the current user.
 * 
 * This hook provides functionalities to fetch notifications, mark them as read,
 * and track loading and error states throughout the process. It integrates with
 * the journey context to provide journey-specific notifications and error handling.
 * 
 * @returns An object containing notifications, loading state, error state, and utility functions.
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentJourney } = useJourney();
  const { handleError } = useErrorHandler();
  
  // Function to fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // In a real implementation, this would be replaced with the actual
      // method of getting the current user's ID from a context or auth service
      const userId = "current-user-id"; // Placeholder for demonstration
      
      const data = await getNotifications(userId);
      
      // Filter notifications based on current journey if specified
      const filteredData = currentJourney 
        ? data.filter(notification => 
            !notification.journeyContext || 
            notification.journeyContext === currentJourney)
        : data;
      
      setNotifications(filteredData);
      setError(null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch notifications');
      setError(errorObj);
      handleError(errorObj, {
        context: 'useNotifications.fetchNotifications',
        journey: currentJourney,
        additionalData: { userId: "current-user-id" }
      });
    } finally {
      setLoading(false);
    }
  }, [currentJourney, handleError]);
  
  // Fetch notifications on component mount and when journey changes
  useEffect(() => {
    fetchNotifications();
    
    // Set up global error handler for unhandled promise rejections related to notifications
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.context?.includes('notifications')) {
        handleError(event.reason, {
          context: 'useNotifications.globalErrorHandler',
          journey: currentJourney,
          additionalData: { unhandledRejection: true }
        });
      }
    };
    
    // Add event listener for unhandled promise rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [fetchNotifications, currentJourney, handleError]);
  
  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistically update the UI
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
      
      // Make the API call
      await markNotificationAsRead(notificationId);
    } catch (err) {
      // Revert the optimistic update on error
      fetchNotifications();
      
      const errorObj = err instanceof Error ? err : new Error('Failed to mark notification as read');
      handleError(errorObj, {
        context: 'useNotifications.markAsRead',
        journey: currentJourney,
        additionalData: { notificationId }
      });
      
      throw errorObj;
    }
  }, [fetchNotifications, currentJourney, handleError]);
  
  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(notification => 
      notification.status === NotificationStatus.SENT || 
      notification.status === NotificationStatus.DELIVERED
    ).length;
  }, [notifications]);
  
  // Get journey-specific notifications
  const getJourneyNotifications = useCallback((journey: string) => {
    return notifications.filter(notification => 
      !notification.journeyContext || notification.journeyContext === journey
    );
  }, [notifications]);
  
  return { 
    notifications, 
    loading, 
    error, 
    markAsRead, 
    refresh: fetchNotifications,
    unreadCount: getUnreadCount(),
    getJourneyNotifications
  };
};