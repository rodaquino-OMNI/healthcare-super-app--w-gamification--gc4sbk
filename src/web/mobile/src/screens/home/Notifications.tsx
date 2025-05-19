import React, { useEffect } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Box, Text, Touchable, Stack } from '@design-system/primitives';
import { Card, LoadingIndicator, EmptyState, ErrorState } from '@austa/design-system';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationContext } from '../../context/NotificationContext';
import { useJourneyContext } from '@austa/journey-context';
import { Notification, NotificationStatus } from '@austa/interfaces/notification';
import { AccessibilityProps } from '@austa/interfaces/common';

/**
 * Notifications Screen Component
 * 
 * Displays and manages the user's notifications within the mobile application.
 * Supports marking notifications as read and navigating to deep-linked screens.
 * 
 * Features:
 * - Fetches notifications using the useNotifications hook
 * - Supports marking notifications as read
 * - Automatically refreshes when the screen comes into focus
 * - Provides navigation to deep-linked screens when notifications are tapped
 * - Applies journey-specific styling based on the notification's source journey
 * - Fully accessible with screen reader support
 */
const Notifications = () => {
  const navigation = useNavigation();
  const { notifications, loading, error, refresh } = useNotifications();
  const notificationContext = useNotificationContext();
  const { getJourneyTheme } = useJourneyContext();

  // Refresh notifications when the screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
    });

    return unsubscribe;
  }, [navigation, refresh]);

  // Handle notification press - mark as read and navigate to relevant screen
  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (notification.status !== NotificationStatus.READ) {
        await notificationContext.markAsRead(notification.id);
      }
      
      // Navigate based on the notification's deepLink
      if (notification.deepLink) {
        // Parse the deepLink to extract route name and params
        // For now, we're assuming the deepLink is directly usable as a route name
        navigation.navigate(notification.deepLink as never);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  // Format the notification date for display
  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Render an individual notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    // Get journey-specific theme based on notification source
    const journeyTheme = getJourneyTheme(item.journey.toLowerCase());
    const isRead = item.status === NotificationStatus.READ;
    const formattedDate = formatNotificationDate(new Date(item.createdAt));
    
    // Prepare accessibility props for screen readers
    const a11yProps: AccessibilityProps = {
      accessibilityLabel: `${isRead ? 'Read' : 'Unread'} notification: ${item.title}`,
      accessibilityHint: "Double tap to view details and mark as read",
      accessibilityRole: "button",
    };
    
    return (
      <Touchable 
        onPress={() => handleNotificationPress(item)}
        {...a11yProps}
      >
        <Card 
          variant={isRead ? 'subtle' : 'default'}
          mb="sm"
          borderLeftWidth={4}
          borderLeftColor={journeyTheme.colors.primary}
          elevation={isRead ? 1 : 2}
        >
          <Stack direction="row" spacing="sm" alignItems="center">
            {!isRead && (
              <Box 
                width={8} 
                height={8} 
                borderRadius="full" 
                backgroundColor={journeyTheme.colors.primary} 
                accessibilityLabel="Unread notification indicator"
              />
            )}
            <Box flex={1}>
              <Text 
                variant="subtitle1" 
                color={isRead ? 'text.secondary' : 'text.primary'}
                mb="xxs"
              >
                {item.title}
              </Text>
              <Text 
                variant="body2" 
                color={isRead ? 'text.disabled' : 'text.secondary'}
                mb="xs"
              >
                {item.body}
              </Text>
              <Text 
                variant="caption" 
                color="text.tertiary"
                alignSelf="flex-end"
              >
                {formattedDate}
              </Text>
            </Box>
          </Stack>
        </Card>
      </Touchable>
    );
  };

  // Loading state
  if (loading && (!notifications || notifications.length === 0)) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" padding="lg">
        <LoadingIndicator size="large" accessibilityLabel="Loading notifications" />
        <Text 
          variant="body2" 
          color="text.secondary" 
          mt="md"
          accessibilityLiveRegion="polite"
        >
          Loading notifications...
        </Text>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Could not load notifications"
        message="There was a problem retrieving your notifications"
        actionLabel="Try Again"
        onAction={refresh}
        icon="alert-circle"
        accessibilityLabel="Error loading notifications"
        accessibilityHint="Double tap the Try Again button to reload"
      />
    );
  }

  // Empty state
  if (!notifications || notifications.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        message="We'll notify you about important updates and activities"
        icon="notifications-outline"
        accessibilityLabel="No notifications"
        accessibilityHint="You don't have any notifications yet"
      />
    );
  }

  // Notification list
  return (
    <Box flex={1} backgroundColor="background.default">
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refresh}
        accessibilityLabel="Notifications list"
        accessible={true}
        accessibilityHint="Pull down to refresh notifications"
        accessibilityLiveRegion="polite"
        testID="notifications-list"
      />
    </Box>
  );
};

export default Notifications;