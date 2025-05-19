import React from 'react';
import { 
  EmptyState, 
  LoadingIndicator, 
  JourneyHeader,
  Card,
  Badge,
  Text
} from '@austa/design-system';
import { MainLayout } from '../../layouts/MainLayout';
import { useNotification } from '@austa/journey-context';
import { Notification, NotificationType } from '@austa/interfaces/notification';
import { ALL_JOURNEYS } from '@austa/interfaces/common';

/**
 * Maps notification types to their corresponding journey context for styling
 * @param type The notification type
 * @returns The journey context (health, care, plan, or cross-journey)
 */
const getJourneyContextFromType = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.HEALTH_METRIC:
    case NotificationType.HEALTH_GOAL:
    case NotificationType.DEVICE_SYNC:
      return 'health';
    case NotificationType.APPOINTMENT:
    case NotificationType.MEDICATION:
    case NotificationType.TELEMEDICINE:
      return 'care';
    case NotificationType.CLAIM:
    case NotificationType.BENEFIT:
    case NotificationType.COVERAGE:
      return 'plan';
    default:
      return 'cross-journey';
  }
};

/**
 * NotificationsPage component displays user notifications with journey-specific styling
 * and proper accessibility support.
 */
const NotificationsPage: React.FC = () => {
  // Use the standardized useNotification hook from @austa/journey-context
  const { notifications, isLoading, markAsRead } = useNotification();

  // Handle notification click to mark as read
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
  };

  return (
    <MainLayout>
      <JourneyHeader title="Notifications" />

      {isLoading ? (
        <LoadingIndicator 
          text="Carregando notificações..." 
          fullScreen 
          aria-label="Loading notifications" 
        />
      ) : (
        <>
          {notifications.length === 0 ? (
            <EmptyState
              title="Sem notificações"
              description="Você não tem nenhuma notificação."
              aria-label="No notifications"
            />
          ) : (
            <ul 
              className="notifications-list"
              aria-label="Notifications list"
              role="list"
            >
              {notifications.map((notification) => {
                const journeyContext = getJourneyContextFromType(notification.type);
                
                return (
                  <li key={notification.id} role="listitem">
                    <Card 
                      onClick={() => handleNotificationClick(notification)}
                      className={`notification-card notification-card--${journeyContext}`}
                      aria-label={`${notification.title} notification`}
                    >
                      <div className="notification-header">
                        <Text variant="subtitle1">{notification.title}</Text>
                        <Badge 
                          variant={journeyContext} 
                          label={journeyContext.toUpperCase()}
                        />
                      </div>
                      <Text variant="body1">{notification.body}</Text>
                      {notification.createdAt && (
                        <Text variant="caption" className="notification-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Text>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default NotificationsPage;