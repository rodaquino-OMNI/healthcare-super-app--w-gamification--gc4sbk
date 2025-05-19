/**
 * WebSocket Types for AUSTA SuperApp
 * 
 * This module defines TypeScript interfaces for WebSocket communication in the AUSTA SuperApp,
 * covering real-time events, notifications, connection status, and subscription management.
 * It provides type safety for Socket.io operations across both web and mobile platforms.
 * 
 * @packageDocumentation
 */

import { NotificationType, NotificationChannel, Notification } from '../notification/types';
import { TelemedicineSession } from '../care/types';
import { HealthMetric } from '../health/types';
import { Achievement, Quest, Reward } from '../gamification/types';

/**
 * Connection states for WebSocket connections
 */
export enum WebSocketConnectionState {
  /** Socket is disconnected */
  DISCONNECTED = 'disconnected',
  
  /** Socket is in the process of connecting */
  CONNECTING = 'connecting',
  
  /** Socket is connected and ready */
  CONNECTED = 'connected',
  
  /** Socket connection is experiencing issues */
  UNSTABLE = 'unstable',
  
  /** Socket is reconnecting after a disconnection */
  RECONNECTING = 'reconnecting',
}

/**
 * Reasons for WebSocket disconnection
 */
export enum WebSocketDisconnectReason {
  /** Client initiated disconnect */
  CLIENT_DISCONNECT = 'client_disconnect',
  
  /** Server initiated disconnect */
  SERVER_DISCONNECT = 'server_disconnect',
  
  /** Transport error (network issues) */
  TRANSPORT_ERROR = 'transport_error',
  
  /** Transport closed unexpectedly */
  TRANSPORT_CLOSE = 'transport_close',
  
  /** Ping timeout (no response from server) */
  PING_TIMEOUT = 'ping_timeout',
  
  /** Parse error (invalid packet) */
  PARSE_ERROR = 'parse_error',
}

/**
 * WebSocket connection options
 */
export interface WebSocketConnectionOptions {
  /** URL for the WebSocket connection */
  url?: string;
  
  /** Path for the WebSocket connection */
  path?: string;
  
  /** Authentication token */
  auth?: {
    token: string;
  };
  
  /** Whether to reconnect automatically */
  autoReconnect?: boolean;
  
  /** Maximum number of reconnection attempts */
  maxReconnectionAttempts?: number;
  
  /** Reconnection delay in milliseconds */
  reconnectionDelay?: number;
  
  /** Timeout for connection attempts in milliseconds */
  timeout?: number;
  
  /** Additional query parameters */
  query?: Record<string, string>;
  
  /** Transport options */
  transports?: Array<'websocket' | 'polling'>;
}

/**
 * WebSocket connection statistics
 */
export interface WebSocketConnectionStats {
  /** Timestamp of the last successful connection */
  lastConnectedAt?: Date;
  
  /** Timestamp of the last disconnection */
  lastDisconnectedAt?: Date;
  
  /** Number of successful connections */
  connectionCount: number;
  
  /** Number of disconnections */
  disconnectionCount: number;
  
  /** Number of reconnection attempts */
  reconnectionAttempts: number;
  
  /** Average ping time in milliseconds */
  averagePing?: number;
  
  /** Current ping time in milliseconds */
  currentPing?: number;
  
  /** Number of messages sent */
  messagesSent: number;
  
  /** Number of messages received */
  messagesReceived: number;
}

/**
 * WebSocket connection information
 */
export interface WebSocketConnection {
  /** Current connection state */
  state: WebSocketConnectionState;
  
  /** Socket ID (if connected) */
  socketId?: string;
  
  /** Connection options */
  options: WebSocketConnectionOptions;
  
  /** Connection statistics */
  stats: WebSocketConnectionStats;
  
  /** Last error that occurred */
  lastError?: Error;
  
  /** Last disconnect reason */
  lastDisconnectReason?: WebSocketDisconnectReason;
}

/**
 * Notification subscription information
 */
export interface NotificationSubscription {
  /** Unique identifier for the subscription */
  id: string;
  
  /** User ID associated with the subscription */
  userId: string;
  
  /** Types of notifications to subscribe to */
  types: NotificationType[];
  
  /** Channels to receive notifications on */
  channels: NotificationChannel[];
  
  /** Whether the subscription is active */
  active: boolean;
  
  /** Timestamp when the subscription was created */
  createdAt: Date;
  
  /** Timestamp when the subscription was last updated */
  updatedAt: Date;
}

/**
 * Notification subscription request
 */
export interface SubscribeToNotificationsRequest {
  /** Types of notifications to subscribe to */
  types: NotificationType[];
  
  /** Channels to receive notifications on */
  channels: NotificationChannel[];
}

/**
 * Notification subscription response
 */
export interface SubscribeToNotificationsResponse {
  /** Subscription information */
  subscription: NotificationSubscription;
  
  /** Success status */
  success: boolean;
  
  /** Error message (if any) */
  error?: string;
}

/**
 * Notification unsubscribe request
 */
export interface UnsubscribeFromNotificationsRequest {
  /** Subscription ID to unsubscribe from */
  subscriptionId: string;
}

/**
 * Notification unsubscribe response
 */
export interface UnsubscribeFromNotificationsResponse {
  /** Success status */
  success: boolean;
  
  /** Error message (if any) */
  error?: string;
}

/**
 * Telemedicine session join request
 */
export interface JoinTelemedicineSessionRequest {
  /** Session ID to join */
  sessionId: string;
  
  /** User role in the session */
  role: 'patient' | 'provider' | 'observer';
  
  /** User display name */
  displayName: string;
  
  /** User's video enabled status */
  videoEnabled?: boolean;
  
  /** User's audio enabled status */
  audioEnabled?: boolean;
}

/**
 * Telemedicine session join response
 */
export interface JoinTelemedicineSessionResponse {
  /** Session information */
  session: TelemedicineSession;
  
  /** List of participants */
  participants: TelemedicineSessionParticipant[];
  
  /** Success status */
  success: boolean;
  
  /** Error message (if any) */
  error?: string;
}

/**
 * Telemedicine session participant
 */
export interface TelemedicineSessionParticipant {
  /** Participant ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Display name */
  displayName: string;
  
  /** Role in the session */
  role: 'patient' | 'provider' | 'observer';
  
  /** Video enabled status */
  videoEnabled: boolean;
  
  /** Audio enabled status */
  audioEnabled: boolean;
  
  /** Connection state */
  connectionState: 'connected' | 'disconnected' | 'reconnecting';
  
  /** Joined timestamp */
  joinedAt: Date;
}

/**
 * Telemedicine session message
 */
export interface TelemedicineSessionMessage {
  /** Message ID */
  id: string;
  
  /** Session ID */
  sessionId: string;
  
  /** Sender ID */
  senderId: string;
  
  /** Sender display name */
  senderName: string;
  
  /** Message content */
  content: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Message type */
  type: 'text' | 'system' | 'file';
  
  /** File URL (if type is 'file') */
  fileUrl?: string;
  
  /** File name (if type is 'file') */
  fileName?: string;
  
  /** File size in bytes (if type is 'file') */
  fileSize?: number;
}

/**
 * Telemedicine session state update
 */
export interface TelemedicineSessionStateUpdate {
  /** Session ID */
  sessionId: string;
  
  /** Session state */
  state: 'waiting' | 'active' | 'ended' | 'cancelled';
  
  /** Timestamp of the update */
  timestamp: Date;
  
  /** Reason for state change */
  reason?: string;
}

/**
 * Telemedicine participant state update
 */
export interface TelemedicineParticipantStateUpdate {
  /** Session ID */
  sessionId: string;
  
  /** Participant ID */
  participantId: string;
  
  /** Video enabled status */
  videoEnabled?: boolean;
  
  /** Audio enabled status */
  audioEnabled?: boolean;
  
  /** Connection state */
  connectionState?: 'connected' | 'disconnected' | 'reconnecting';
}

/**
 * Health metric real-time update
 */
export interface HealthMetricUpdate {
  /** Metric information */
  metric: HealthMetric;
  
  /** Source of the update */
  source: 'device' | 'manual' | 'integration';
  
  /** Timestamp of the update */
  timestamp: Date;
}

/**
 * Achievement earned event
 */
export interface AchievementEarnedEvent {
  /** User ID */
  userId: string;
  
  /** Achievement information */
  achievement: Achievement;
  
  /** Timestamp when earned */
  earnedAt: Date;
  
  /** XP points awarded */
  xpAwarded: number;
}

/**
 * Quest completed event
 */
export interface QuestCompletedEvent {
  /** User ID */
  userId: string;
  
  /** Quest information */
  quest: Quest;
  
  /** Timestamp when completed */
  completedAt: Date;
  
  /** XP points awarded */
  xpAwarded: number;
  
  /** Rewards earned */
  rewards: Reward[];
}

/**
 * Level up event
 */
export interface LevelUpEvent {
  /** User ID */
  userId: string;
  
  /** New level */
  newLevel: number;
  
  /** Previous level */
  previousLevel: number;
  
  /** XP at new level */
  currentXp: number;
  
  /** XP required for next level */
  nextLevelXp: number;
  
  /** Rewards unlocked */
  unlockedRewards: Reward[];
}

/**
 * Server to client events interface for Socket.io
 */
export interface ServerToClientEvents {
  /** Connection established event */
  connect: () => void;
  
  /** Connection error event */
  connect_error: (error: Error) => void;
  
  /** Disconnection event */
  disconnect: (reason: WebSocketDisconnectReason) => void;
  
  /** Reconnection attempt event */
  reconnect_attempt: (attemptNumber: number) => void;
  
  /** Reconnection error event */
  reconnect_error: (error: Error) => void;
  
  /** Reconnection failed event */
  reconnect_failed: () => void;
  
  /** Reconnection successful event */
  reconnect: (attemptNumber: number) => void;
  
  /** Ping event */
  ping: () => void;
  
  /** Pong event (response to ping) */
  pong: (latency: number) => void;
  
  /** New notification received */
  notification: (notification: Notification) => void;
  
  /** Notification read status update */
  notification_read: (notificationId: string) => void;
  
  /** Notification deleted */
  notification_deleted: (notificationId: string) => void;
  
  /** Batch of notifications received */
  notifications_batch: (notifications: Notification[]) => void;
  
  /** Achievement earned */
  achievement_earned: (event: AchievementEarnedEvent) => void;
  
  /** Quest completed */
  quest_completed: (event: QuestCompletedEvent) => void;
  
  /** Level up */
  level_up: (event: LevelUpEvent) => void;
  
  /** Health metric update */
  health_metric_update: (update: HealthMetricUpdate) => void;
  
  /** Telemedicine session state update */
  telemedicine_session_state: (update: TelemedicineSessionStateUpdate) => void;
  
  /** Telemedicine participant state update */
  telemedicine_participant_state: (update: TelemedicineParticipantStateUpdate) => void;
  
  /** Telemedicine session message */
  telemedicine_message: (message: TelemedicineSessionMessage) => void;
}

/**
 * Client to server events interface for Socket.io
 */
export interface ClientToServerEvents {
  /** Subscribe to notifications */
  subscribe_to_notifications: (
    request: SubscribeToNotificationsRequest,
    callback: (response: SubscribeToNotificationsResponse) => void
  ) => void;
  
  /** Unsubscribe from notifications */
  unsubscribe_from_notifications: (
    request: UnsubscribeFromNotificationsRequest,
    callback: (response: UnsubscribeFromNotificationsResponse) => void
  ) => void;
  
  /** Mark notification as read */
  mark_notification_read: (
    notificationId: string,
    callback?: (success: boolean) => void
  ) => void;
  
  /** Mark all notifications as read */
  mark_all_notifications_read: (
    callback?: (success: boolean) => void
  ) => void;
  
  /** Join telemedicine session */
  join_telemedicine_session: (
    request: JoinTelemedicineSessionRequest,
    callback: (response: JoinTelemedicineSessionResponse) => void
  ) => void;
  
  /** Leave telemedicine session */
  leave_telemedicine_session: (
    sessionId: string,
    callback?: (success: boolean) => void
  ) => void;
  
  /** Send telemedicine message */
  send_telemedicine_message: (
    message: Omit<TelemedicineSessionMessage, 'id' | 'timestamp'>,
    callback?: (messageId: string) => void
  ) => void;
  
  /** Update telemedicine participant state */
  update_telemedicine_state: (
    update: Omit<TelemedicineParticipantStateUpdate, 'participantId'>,
    callback?: (success: boolean) => void
  ) => void;
}

/**
 * Socket.io client configuration
 */
export interface SocketIOConfig {
  /** URL for the Socket.io connection */
  url: string;
  
  /** Path for the Socket.io connection */
  path?: string;
  
  /** Authentication token */
  auth?: {
    token: string;
  };
  
  /** Whether to reconnect automatically */
  autoConnect?: boolean;
  
  /** Reconnection attempts */
  reconnectionAttempts?: number;
  
  /** Reconnection delay in milliseconds */
  reconnectionDelay?: number;
  
  /** Timeout for connection attempts in milliseconds */
  timeout?: number;
  
  /** Transport options */
  transports?: Array<'websocket' | 'polling'>;
}

/**
 * Socket.io client interface with typed events
 */
export interface TypedSocketIOClient {
  /** Connect to the server */
  connect: () => void;
  
  /** Disconnect from the server */
  disconnect: () => void;
  
  /** Check if connected */
  connected: boolean;
  
  /** Socket ID */
  id?: string;
  
  /** Emit an event to the server */
  emit: <T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ) => void;
  
  /** Listen for an event from the server */
  on: <T extends keyof ServerToClientEvents>(
    event: T,
    listener: ServerToClientEvents[T]
  ) => void;
  
  /** Listen for an event from the server once */
  once: <T extends keyof ServerToClientEvents>(
    event: T,
    listener: ServerToClientEvents[T]
  ) => void;
  
  /** Remove a listener */
  off: <T extends keyof ServerToClientEvents>(
    event: T,
    listener?: ServerToClientEvents[T]
  ) => void;
  
  /** Get current connection state */
  getConnectionState: () => WebSocketConnectionState;
  
  /** Get connection statistics */
  getConnectionStats: () => WebSocketConnectionStats;
}