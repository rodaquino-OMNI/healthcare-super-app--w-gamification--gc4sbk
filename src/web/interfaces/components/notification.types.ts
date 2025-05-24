/**
 * Notification Component Interfaces
 * 
 * This file defines TypeScript interfaces for notification-related UI components
 * in the AUSTA SuperApp. These interfaces provide strongly-typed props for
 * notification display, filtering, and interaction while integrating with the
 * notification domain models.
 * 
 * The interfaces ensure consistency between notification data structures and
 * their visual representation across the application, supporting both web and
 * mobile platforms.
 */

import { ReactNode } from 'react';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationFilter
} from '../notification/types';
import {
  AchievementNotificationData,
  LevelUpNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData
} from '../notification/data';

/**
 * Base props for all notification components
 * Provides common properties that all notification components should support
 */
export interface BaseNotificationComponentProps {
  /** Optional CSS class name for styling */
  className?: string;
  
  /** Optional inline style object */
  style?: React.CSSProperties;
  
  /** Optional test ID for automated testing */
  testID?: string;
  
  /** Optional accessibility label */
  accessibilityLabel?: string;
  
  /** Journey context for theming and styling */
  journeyContext?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * NotificationBadge Component Props
 * 
 * Interface for the NotificationBadge component that displays an unread
 * notification count indicator, typically used in navigation elements.
 */
export interface NotificationBadgeProps extends BaseNotificationComponentProps {
  /** Number of unread notifications to display */
  count: number;
  
  /** Maximum count to display before showing a '+' indicator */
  maxCount?: number;
  
  /** Whether the badge should be visible when count is zero */
  showZero?: boolean;
  
  /** Size variant of the badge */
  size?: 'small' | 'medium' | 'large';
  
  /** Optional override for the badge color */
  color?: string;
  
  /** Whether the badge should pulse to draw attention */
  pulse?: boolean;
  
  /** Optional callback when the badge is pressed/clicked */
  onPress?: () => void;
  
  /** Whether the badge is currently being updated (shows animation) */
  isUpdating?: boolean;
  
  /** Optional filter to count only specific notification types */
  filter?: {
    types?: NotificationType[];
    priorities?: NotificationPriority[];
  };
}

/**
 * NotificationCard Component Props
 * 
 * Interface for the NotificationCard component that displays a single
 * notification with appropriate styling based on its type and priority.
 */
export interface NotificationCardProps extends BaseNotificationComponentProps {
  /** The notification to display */
  notification: Notification;
  
  /** Whether the card should display in a compact format */
  compact?: boolean;
  
  /** Whether the notification is currently being updated */
  isUpdating?: boolean;
  
  /** Whether to show the notification timestamp */
  showTimestamp?: boolean;
  
  /** Whether to show action buttons for the notification */
  showActions?: boolean;
  
  /** Callback when the notification is marked as read */
  onMarkAsRead?: (notificationId: string) => void | Promise<void>;
  
  /** Callback when the notification is dismissed */
  onDismiss?: (notificationId: string) => void | Promise<void>;
  
  /** Callback when the notification card is pressed/clicked */
  onPress?: (notification: Notification) => void;
  
  /** Custom renderer for notification actions based on type */
  actionRenderer?: (notification: Notification) => ReactNode;
  
  /** Custom renderer for notification icon based on type */
  iconRenderer?: (notification: Notification) => ReactNode;
  
  /** Animation to use when the card appears */
  appearAnimation?: 'fade' | 'slide' | 'scale' | 'none';
  
  /** Whether to show the notification priority indicator */
  showPriorityIndicator?: boolean;
  
  /** Optional custom data renderer for specific notification types */
  dataRenderers?: {
    [NotificationType.ACHIEVEMENT]?: (data: AchievementNotificationData) => ReactNode;
    [NotificationType.LEVEL_UP]?: (data: LevelUpNotificationData) => ReactNode;
    [NotificationType.APPOINTMENT]?: (data: AppointmentReminderData) => ReactNode;
    [NotificationType.CLAIM_STATUS]?: (data: ClaimStatusUpdateData) => ReactNode;
    [key: string]: ((data: any) => ReactNode) | undefined;
  };
}

/**
 * NotificationList Component Props
 * 
 * Interface for the NotificationList component that displays a list of
 * notifications with filtering, grouping, and interaction capabilities.
 */
export interface NotificationListProps extends BaseNotificationComponentProps {
  /** Array of notifications to display */
  notifications: Notification[];
  
  /** Whether the list is currently loading */
  isLoading?: boolean;
  
  /** Error message if loading notifications failed */
  error?: string;
  
  /** Whether to group notifications by type */
  groupByType?: boolean;
  
  /** Whether to group notifications by date */
  groupByDate?: boolean;
  
  /** Filter to apply to the notifications */
  filter?: NotificationFilter;
  
  /** Callback when a notification is marked as read */
  onMarkAsRead?: (notificationId: string) => void | Promise<void>;
  
  /** Callback when a notification is dismissed */
  onDismiss?: (notificationId: string) => void | Promise<void>;
  
  /** Callback when a notification is pressed/clicked */
  onNotificationPress?: (notification: Notification) => void;
  
  /** Callback when the list is refreshed (pull-to-refresh) */
  onRefresh?: () => void | Promise<void>;
  
  /** Whether the list is currently refreshing */
  isRefreshing?: boolean;
  
  /** Callback when the end of the list is reached (for pagination) */
  onEndReached?: () => void | Promise<void>;
  
  /** Whether more notifications are available to load */
  hasMore?: boolean;
  
  /** Custom empty state component when there are no notifications */
  emptyComponent?: ReactNode;
  
  /** Custom loading component */
  loadingComponent?: ReactNode;
  
  /** Custom error component */
  errorComponent?: ReactNode;
  
  /** Custom renderer for notification items */
  renderItem?: (notification: Notification) => ReactNode;
  
  /** Custom renderer for group headers */
  renderGroupHeader?: (groupTitle: string, count: number) => ReactNode;
  
  /** Maximum number of notifications to display */
  maxItems?: number;
  
  /** Whether to show a mark all as read button */
  showMarkAllAsRead?: boolean;
  
  /** Callback when mark all as read is pressed */
  onMarkAllAsRead?: () => void | Promise<void>;
  
  /** Whether real-time updates are enabled */
  realTimeUpdates?: boolean;
  
  /** Animation to use when items are added or removed */
  itemAnimation?: 'fade' | 'slide' | 'scale' | 'none';
}

/**
 * NotificationCenter Component Props
 * 
 * Interface for the NotificationCenter component that provides a complete
 * notification management interface, typically used in a dropdown or modal.
 */
export interface NotificationCenterProps extends BaseNotificationComponentProps {
  /** Whether the notification center is open/visible */
  isOpen: boolean;
  
  /** Callback when the notification center is closed */
  onClose: () => void;
  
  /** Array of notifications to display */
  notifications: Notification[];
  
  /** Whether notifications are currently loading */
  isLoading?: boolean;
  
  /** Error message if loading notifications failed */
  error?: string;
  
  /** Available filters for the notification list */
  availableFilters?: {
    types?: NotificationType[];
    priorities?: NotificationPriority[];
    statuses?: NotificationStatus[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  
  /** Currently applied filter */
  currentFilter?: NotificationFilter;
  
  /** Callback when filter is changed */
  onFilterChange?: (filter: NotificationFilter) => void;
  
  /** Callback when a notification is marked as read */
  onMarkAsRead?: (notificationId: string) => void | Promise<void>;
  
  /** Callback when a notification is dismissed */
  onDismiss?: (notificationId: string) => void | Promise<void>;
  
  /** Callback when mark all as read is pressed */
  onMarkAllAsRead?: () => void | Promise<void>;
  
  /** Callback when a notification is pressed/clicked */
  onNotificationPress?: (notification: Notification) => void;
  
  /** Callback when the list is refreshed */
  onRefresh?: () => void | Promise<void>;
  
  /** Whether the list is currently refreshing */
  isRefreshing?: boolean;
  
  /** Callback when the end of the list is reached (for pagination) */
  onEndReached?: () => void | Promise<void>;
  
  /** Whether more notifications are available to load */
  hasMore?: boolean;
  
  /** Position of the notification center */
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  
  /** Size of the notification center */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  
  /** Whether to show notification preferences link */
  showPreferencesLink?: boolean;
  
  /** Callback when notification preferences link is clicked */
  onPreferencesClick?: () => void;
  
  /** Whether real-time updates are enabled */
  realTimeUpdates?: boolean;
  
  /** Custom header component */
  headerComponent?: ReactNode;
  
  /** Custom footer component */
  footerComponent?: ReactNode;
}

/**
 * NotificationToast Component Props
 * 
 * Interface for the NotificationToast component that displays a temporary
 * notification toast/snackbar, typically for real-time notifications.
 */
export interface NotificationToastProps extends BaseNotificationComponentProps {
  /** The notification to display */
  notification: Notification;
  
  /** Duration to show the toast in milliseconds */
  duration?: number;
  
  /** Whether the toast is currently visible */
  visible: boolean;
  
  /** Callback when the toast is dismissed */
  onDismiss: () => void;
  
  /** Callback when the toast is pressed/clicked */
  onPress?: (notification: Notification) => void;
  
  /** Position of the toast on the screen */
  position?: 'top' | 'bottom';
  
  /** Animation to use when the toast appears/disappears */
  animation?: 'fade' | 'slide' | 'scale';
  
  /** Whether to show a progress indicator for the duration */
  showProgress?: boolean;
  
  /** Whether to show a close button */
  showCloseButton?: boolean;
  
  /** Whether to auto-dismiss the toast after duration */
  autoDismiss?: boolean;
  
  /** Z-index for the toast */
  zIndex?: number;
  
  /** Custom renderer for the notification content */
  contentRenderer?: (notification: Notification) => ReactNode;
}

/**
 * NotificationPreferencesForm Component Props
 * 
 * Interface for the NotificationPreferencesForm component that allows users
 * to manage their notification preferences across channels and journeys.
 */
export interface NotificationPreferencesFormProps extends BaseNotificationComponentProps {
  /** Current notification preferences */
  preferences: {
    global: {
      enabled: boolean;
      channels: {
        [key in NotificationChannel]?: boolean;
      };
    };
    journeys: {
      health?: {
        enabled: boolean;
        channels: {
          [key in NotificationChannel]?: boolean;
        };
        types: {
          [key in NotificationType]?: boolean;
        };
      };
      care?: {
        enabled: boolean;
        channels: {
          [key in NotificationChannel]?: boolean;
        };
        types: {
          [key in NotificationType]?: boolean;
        };
      };
      plan?: {
        enabled: boolean;
        channels: {
          [key in NotificationChannel]?: boolean;
        };
        types: {
          [key in NotificationType]?: boolean;
        };
      };
    };
  };
  
  /** Whether the form is currently saving */
  isSaving?: boolean;
  
  /** Error message if saving preferences failed */
  error?: string;
  
  /** Callback when preferences are changed */
  onPreferencesChange: (preferences: any) => void | Promise<void>;
  
  /** Callback when the form is submitted */
  onSubmit: () => void | Promise<void>;
  
  /** Callback when the form is reset */
  onReset?: () => void;
  
  /** Whether to show a success message after saving */
  showSuccessMessage?: boolean;
  
  /** Available notification channels to configure */
  availableChannels?: NotificationChannel[];
  
  /** Available notification types to configure */
  availableTypes?: {
    health?: NotificationType[];
    care?: NotificationType[];
    plan?: NotificationType[];
  };
  
  /** Whether to group preferences by journey */
  groupByJourney?: boolean;
  
  /** Whether to show advanced preferences */
  showAdvancedPreferences?: boolean;
}