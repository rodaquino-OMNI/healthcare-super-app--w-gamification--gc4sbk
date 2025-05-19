import React, { useCallback } from 'react'; // react v18.0.0
import { FlatList, TouchableOpacity } from 'react-native'; // react-native v0.71.8
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.0.0
import {
  Card,
  Text,
  Icon,
  Badge,
  EmptyState,
  LoadingIndicator
} from '@austa/design-system';
import { Box, Stack } from '@design-system/primitives';
import { useNotifications, useJourney } from '@austa/journey-context';
import {
  Notification,
  NotificationType,
  NotificationStatus
} from '@austa/interfaces/notification';
import { formatRelativeTime } from '@austa/design-system/utils';

/**
 * Interface defining the props for the NotificationList component
 */
interface NotificationListProps {
  /**
   * Optional filter criteria for notifications
   */
  filter?: (notification: Notification) => boolean;
  /**
   * Optional callback when a notification is pressed
   */
  onNotificationPress?: (notification: Notification) => void;
  /**
   * Optional limit on the number of notifications to display
   */
  maxItems?: number;
  /**
   * Whether to show the empty state when no notifications exist
   */
  showEmptyState?: boolean;
}

/**
 * Returns the appropriate icon name based on notification type
 * @param NotificationType type
 * @returns Icon name to be used for the notification type
 */
const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      return 'trophy';
    case NotificationType.APPOINTMENT_REMINDER:
      return 'calendar';
    case NotificationType.CLAIM_STATUS_UPDATE:
      return 'document';
    case NotificationType.LEVEL_UP:
      return 'level-up';
    default:
      return 'notifications';
  }
};

/**
 * Component that renders a list of notifications with journey-specific styling
 */
export const NotificationList: React.FC<NotificationListProps> = ({
  filter,
  onNotificationPress,
  maxItems,
  showEmptyState,
}) => {
  // Use the useNotifications hook to get notifications, loading state, and markAsRead function
  const { notifications, loading, error, markAsRead } = useNotifications();

  // Use the useJourney hook to get the current journey context
  const { journey } = useJourney();

  // Use the useNavigation hook for handling deep links
  const navigation = useNavigation();

  // Filter notifications based on the filter prop if provided
  const filteredNotifications = filter
    ? notifications.filter(filter)
    : notifications;

  // Limit the number of notifications based on maxItems prop if provided
  const limitedNotifications = maxItems
    ? filteredNotifications.slice(0, maxItems)
    : filteredNotifications;

  // Define a renderItem function to render each notification
  const renderItem = useCallback(
    ({ item }: { item: Notification }) => {
      // Handle notification press by marking as read and navigating to deep link if available
      const handlePress = async () => {
        try {
          await markAsRead(item.id);
          if (item.deepLink) {
            navigation.navigate(item.deepLink);
          }
          if (onNotificationPress) {
            onNotificationPress(item);
          }
        } catch (err) {
          console.error('Error handling notification press:', err);
        }
      };

      return (
        <TouchableOpacity onPress={handlePress} mb="2">
          <Card journey={item.journey}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb="1">
              <Stack direction="row" flex={1} alignItems="center">
                <Box mr="3">
                  <Icon name={getNotificationIcon(item.type)} size={24} />
                </Box>
                <Text variant="subtitle" flex={1}>
                  {item.title}
                </Text>
              </Stack>
              {item.status !== NotificationStatus.READ && (
                <Badge 
                  position="absolute"
                  top="1"
                  right="1"
                  size="xs"
                  variant="notification"
                />
              )}
            </Stack>
            <Text variant="body" mt="1" mb="2">
              {item.body}
            </Text>
            <Text variant="caption" color="text.secondary">
              {formatRelativeTime(item.createdAt)}
            </Text>
          </Card>
        </TouchableOpacity>
      );
    },
    [markAsRead, navigation, onNotificationPress]
  );

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <Text variant="body" color="error.main">Error: {error.message}</Text>;
  }

  if (limitedNotifications.length === 0 && showEmptyState) {
    return (
      <EmptyState
        icon="notifications"
        title="No notifications yet"
        description="Check back later for updates"
      />
    );
  }

  return (
    <Box flex={1}>
      <FlatList
        data={limitedNotifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </Box>
  );
};