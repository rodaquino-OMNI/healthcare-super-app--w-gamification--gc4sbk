/**
 * Notification Component Interfaces
 * 
 * This module defines TypeScript interfaces for notification-related UI components
 * in the AUSTA SuperApp. These interfaces provide strongly-typed props for notification
 * display, filtering, and interaction while integrating with the notification domain models.
 * 
 * @packageDocumentation
 */

import { ReactNode } from 'react';
import {
  Notification,
  NotificationFilter,
  NotificationType,
  NotificationStatus,
} from '../notification/types';

/**
 * Defines the journey context for notification styling and presentation.
 * Different journeys may have different visual treatments for notifications.
 */
export type NotificationJourneyContext = 'health' | 'care' | 'plan' | 'gamification' | 'system';

/**
 * Defines how notifications can be grouped in a list view.
 */
export type NotificationGroupBy = 'date' | 'type' | 'status' | 'journey' | 'priority' | 'none';

/**
 * Defines visual variants for notification cards.
 */
export type NotificationCardVariant = 'default' | 'compact' | 'expanded' | 'interactive';

/**
 * Defines visual variants for notification badges.
 */
export type NotificationBadgeVariant = 'dot' | 'count' | 'pill';

/**
 * Defines sizes for notification badges.
 */
export type NotificationBadgeSize = 'sm' | 'md' | 'lg';

/**
 * Interface for the NotificationList component props.
 * This component displays a list of notifications with filtering and interaction capabilities.
 */
export interface NotificationListProps {
  /** Array of notifications to display */
  notifications: Notification[];
  
  /** Callback fired when a notification is pressed */
  onNotificationPress: (notification: Notification) => void;
  
  /** Callback fired when a notification is marked as read */
  onMarkAsRead?: (notificationId: string) => void;
  
  /** Callback fired when a notification is dismissed */
  onDismiss?: (notificationId: string) => void;
  
  /** Optional filter to apply to the notifications */
  filter?: NotificationFilter;
  
  /** Optional grouping for the notifications */
  groupBy?: NotificationGroupBy;
  
  /** Optional custom component to display when there are no notifications */
  emptyState?: ReactNode;
  
  /** Whether the notifications are currently loading */
  isLoading?: boolean;
  
  /** Optional loading state component */
  loadingState?: ReactNode;
  
  /** Maximum number of notifications to display */
  maxItems?: number;
  
  /** Whether to show unread indicators */
  showUnreadIndicator?: boolean;
  
  /** Journey context for styling */
  journeyContext?: NotificationJourneyContext;
  
  /** Whether to enable pull-to-refresh functionality (mobile only) */
  enablePullToRefresh?: boolean;
  
  /** Callback fired when the list is refreshed via pull-to-refresh */
  onRefresh?: () => void;
  
  /** Whether a refresh is currently in progress */
  isRefreshing?: boolean;
  
  /** Callback fired when the end of the list is reached (for pagination) */
  onEndReached?: () => void;
  
  /** Whether more notifications are available to load */
  hasMore?: boolean;
  
  /** Optional header component */
  header?: ReactNode;
  
  /** Optional footer component */
  footer?: ReactNode;
  
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Interface for the NotificationCard component props.
 * This component displays a single notification with interaction capabilities.
 */
export interface NotificationCardProps {
  /** The notification to display */
  notification: Notification;
  
  /** Callback fired when the card is pressed */
  onPress?: (notification: Notification) => void;
  
  /** Callback fired when the notification is marked as read */
  onMarkAsRead?: (notificationId: string) => void;
  
  /** Callback fired when the notification is dismissed */
  onDismiss?: (notificationId: string) => void;
  
  /** Whether to show action buttons (mark as read, dismiss) */
  showActions?: boolean;
  
  /** Whether the card is in an expanded state showing full details */
  isExpanded?: boolean;
  
  /** Visual variant of the card */
  variant?: NotificationCardVariant;
  
  /** Journey context for styling */
  journeyContext?: NotificationJourneyContext;
  
  /** Whether to show the notification timestamp */
  showTimestamp?: boolean;
  
  /** Whether to show the notification icon */
  showIcon?: boolean;
  
  /** Custom icon to override the default for this notification type */
  customIcon?: ReactNode;
  
  /** Whether the card is currently being swiped (mobile only) */
  isSwiping?: boolean;
  
  /** Callback fired when swipe actions are triggered (mobile only) */
  onSwipeAction?: (action: 'read' | 'dismiss', notificationId: string) => void;
  
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Interface for the NotificationBadge component props.
 * This component displays a badge indicating the number of notifications.
 */
export interface NotificationBadgeProps {
  /** Number of notifications to display */
  count: number;
  
  /** Maximum count to display before showing "{max}+" */
  maxCount?: number;
  
  /** Whether to show the badge when count is zero */
  showZero?: boolean;
  
  /** Visual variant of the badge */
  variant?: NotificationBadgeVariant;
  
  /** Size of the badge */
  size?: NotificationBadgeSize;
  
  /** Callback fired when the badge is pressed */
  onPress?: () => void;
  
  /** Journey context for styling */
  journeyContext?: NotificationJourneyContext;
  
  /** Whether the badge is currently active/selected */
  isActive?: boolean;
  
  /** Whether to animate the badge when count changes */
  animate?: boolean;
  
  /** Optional label for accessibility */
  accessibilityLabel?: string;
  
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Interface for the NotificationIcon component props.
 * This component displays an icon representing a notification type.
 */
export interface NotificationIconProps {
  /** Type of notification */
  type: NotificationType;
  
  /** Size of the icon */
  size?: 'sm' | 'md' | 'lg';
  
  /** Color of the icon (defaults to journey color) */
  color?: string;
  
  /** Journey context for styling */
  journeyContext?: NotificationJourneyContext;
  
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Interface for the NotificationCounter component props.
 * This component displays counts of notifications by status.
 */
export interface NotificationCounterProps {
  /** Total count of notifications */
  total: number;
  
  /** Count of unread notifications */
  unread: number;
  
  /** Optional counts by notification type */
  byType?: Partial<Record<NotificationType, number>>;
  
  /** Whether the counter is currently loading */
  isLoading?: boolean;
  
  /** Callback fired when a type filter is selected */
  onTypeSelect?: (type: NotificationType | null) => void;
  
  /** Currently selected type filter */
  selectedType?: NotificationType | null;
  
  /** Journey context for styling */
  journeyContext?: NotificationJourneyContext;
  
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Interface for the NotificationEmptyState component props.
 * This component displays a message when there are no notifications.
 */
export interface NotificationEmptyStateProps {
  /** Optional custom message to display */
  message?: string;
  
  /** Optional custom icon to display */
  icon?: ReactNode;
  
  /** Optional action button label */
  actionLabel?: string;
  
  /** Callback fired when the action button is pressed */
  onAction?: () => void;
  
  /** Journey context for styling */
  journeyContext?: NotificationJourneyContext;
  
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Interface for the NotificationFilterBar component props.
 * This component provides UI for filtering notifications.
 */
export interface NotificationFilterBarProps {
  /** Current filter being applied */
  filter: NotificationFilter;
  
  /** Callback fired when the filter changes */
  onFilterChange: (filter: NotificationFilter) => void;
  
  /** Available notification types to filter by */
  availableTypes?: NotificationType[];
  
  /** Available notification statuses to filter by */
  availableStatuses?: NotificationStatus[];
  
  /** Whether to show date range filters */
  showDateFilters?: boolean;
  
  /** Whether the filter bar is compact */
  isCompact?: boolean;
  
  /** Journey context for styling */
  journeyContext?: NotificationJourneyContext;
  
  /** Optional test ID for testing */
  testID?: string;
}