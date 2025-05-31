/**
 * WebSocket TypeScript interfaces for the AUSTA SuperApp
 * 
 * This file defines the TypeScript interfaces for WebSocket communication
 * in the AUSTA SuperApp, including real-time events, notifications,
 * connection status, and subscription management.
 */

import { Notification } from '../notification';

/**
 * Socket.io connection options for the AUSTA SuperApp
 */
export interface SocketConnectionOptions {
  /**
   * Authentication token for the WebSocket connection
   */
  auth: {
    token: string;
  };
  /**
   * Whether to automatically reconnect on connection loss
   * @default true
   */
  reconnection?: boolean;
  /**
   * Maximum number of reconnection attempts
   * @default 10
   */
  reconnectionAttempts?: number;
  /**
   * Delay between reconnection attempts in milliseconds
   * @default 1000
   */
  reconnectionDelay?: number;
  /**
   * Maximum delay between reconnection attempts in milliseconds
   * @default 5000
   */
  reconnectionDelayMax?: number;
  /**
   * Timeout for connection attempts in milliseconds
   * @default 20000
   */
  timeout?: number;
}

/**
 * WebSocket connection states
 */
export enum WebSocketConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * WebSocket connection status information
 */
export interface WebSocketConnectionStatus {
  /**
   * Current connection state
   */
  state: WebSocketConnectionState;
  /**
   * Error message if state is ERROR
   */
  error?: string;
  /**
   * Timestamp of the last connection state change
   */
  timestamp: number;
  /**
   * Number of reconnection attempts if state is RECONNECTING
   */
  reconnectAttempt?: number;
  /**
   * Socket ID assigned by the server when connected
   */
  socketId?: string;
  /**
   * User ID associated with the connection
   */
  userId?: string;
}

/**
 * Payload for subscribing to journey-specific notifications
 */
export interface SubscriptionPayload {
  /**
   * Journey ID to subscribe to (e.g., 'health', 'care', 'plan')
   */
  journey: string;
}

/**
 * Payload for marking a notification as read
 */
export interface MarkAsReadPayload {
  /**
   * ID of the notification to mark as read
   */
  notificationId: number;
}

/**
 * Server response for successful connection
 */
export interface ConnectedResponse {
  /**
   * User ID associated with the connection
   */
  userId: string;
}

/**
 * Server response for successful subscription
 */
export interface SubscribedResponse {
  /**
   * Journey ID that was subscribed to
   */
  journey: string;
}

/**
 * Server response for successful unsubscription
 */
export interface UnsubscribedResponse {
  /**
   * Journey ID that was unsubscribed from
   */
  journey: string;
}

/**
 * Server response for successfully marking a notification as read
 */
export interface MarkedResponse {
  /**
   * ID of the notification that was marked as read
   */
  notificationId: number;
}

/**
 * Server error response
 */
export interface ErrorResponse {
  /**
   * Error message
   */
  message: string;
  /**
   * Error code (optional)
   */
  code?: string;
}

/**
 * WebSocket event types for client-to-server communication
 */
export enum WebSocketClientEvent {
  /**
   * Subscribe to journey-specific notifications
   */
  SUBSCRIBE = 'subscribe',
  /**
   * Unsubscribe from journey-specific notifications
   */
  UNSUBSCRIBE = 'unsubscribe',
  /**
   * Mark a notification as read
   */
  MARK_AS_READ = 'markAsRead'
}

/**
 * WebSocket event types for server-to-client communication
 */
export enum WebSocketServerEvent {
  /**
   * Connection established and authenticated
   */
  CONNECTED = 'connected',
  /**
   * Successfully subscribed to a journey
   */
  SUBSCRIBED = 'subscribed',
  /**
   * Successfully unsubscribed from a journey
   */
  UNSUBSCRIBED = 'unsubscribed',
  /**
   * Successfully marked a notification as read
   */
  MARKED = 'marked',
  /**
   * New notification received
   */
  NOTIFICATION = 'notification',
  /**
   * Error occurred
   */
  ERROR = 'error'
}

/**
 * Telemedicine session WebSocket events
 */
export enum TelemedicineSocketEvent {
  /**
   * Join a telemedicine session
   */
  JOIN_SESSION = 'joinSession',
  /**
   * Leave a telemedicine session
   */
  LEAVE_SESSION = 'leaveSession',
  /**
   * Send a message in a telemedicine session
   */
  SEND_MESSAGE = 'sendMessage',
  /**
   * Offer WebRTC connection
   */
  VIDEO_OFFER = 'videoOffer',
  /**
   * Answer WebRTC connection
   */
  VIDEO_ANSWER = 'videoAnswer',
  /**
   * Send ICE candidate for WebRTC
   */
  NEW_ICE_CANDIDATE = 'newIceCandidate',
  /**
   * End the video call
   */
  END_CALL = 'endCall',
  /**
   * Toggle video stream
   */
  TOGGLE_VIDEO = 'toggleVideo',
  /**
   * Toggle audio stream
   */
  TOGGLE_AUDIO = 'toggleAudio',
  /**
   * Participant joined the session
   */
  PARTICIPANT_JOINED = 'participantJoined',
  /**
   * Participant left the session
   */
  PARTICIPANT_LEFT = 'participantLeft',
  /**
   * Session ended
   */
  SESSION_ENDED = 'sessionEnded'
}

/**
 * Payload for joining a telemedicine session
 */
export interface JoinSessionPayload {
  /**
   * ID of the telemedicine session to join
   */
  sessionId: string;
  /**
   * User information for the participant
   */
  user: {
    id: string;
    name: string;
    role: 'patient' | 'provider';
  };
}

/**
 * Payload for sending a message in a telemedicine session
 */
export interface SendMessagePayload {
  /**
   * ID of the telemedicine session
   */
  sessionId: string;
  /**
   * Content of the message
   */
  message: string;
  /**
   * Timestamp of the message
   */
  timestamp: number;
}

/**
 * Payload for WebRTC video offer
 */
export interface VideoOfferPayload {
  /**
   * ID of the telemedicine session
   */
  sessionId: string;
  /**
   * Target user ID to send the offer to
   */
  target: string;
  /**
   * SDP (Session Description Protocol) offer
   */
  sdp: RTCSessionDescriptionInit;
}

/**
 * Payload for WebRTC video answer
 */
export interface VideoAnswerPayload {
  /**
   * ID of the telemedicine session
   */
  sessionId: string;
  /**
   * Target user ID to send the answer to
   */
  target: string;
  /**
   * SDP (Session Description Protocol) answer
   */
  sdp: RTCSessionDescriptionInit;
}

/**
 * Payload for WebRTC ICE candidate
 */
export interface IceCandidatePayload {
  /**
   * ID of the telemedicine session
   */
  sessionId: string;
  /**
   * Target user ID to send the ICE candidate to
   */
  target: string;
  /**
   * ICE candidate
   */
  candidate: RTCIceCandidateInit;
}

/**
 * Payload for toggling video or audio
 */
export interface MediaTogglePayload {
  /**
   * ID of the telemedicine session
   */
  sessionId: string;
  /**
   * Whether the media is enabled
   */
  enabled: boolean;
}

/**
 * Participant information for telemedicine sessions
 */
export interface TelemedicineParticipant {
  /**
   * User ID of the participant
   */
  id: string;
  /**
   * Name of the participant
   */
  name: string;
  /**
   * Role of the participant
   */
  role: 'patient' | 'provider';
  /**
   * Whether the participant's video is enabled
   */
  videoEnabled: boolean;
  /**
   * Whether the participant's audio is enabled
   */
  audioEnabled: boolean;
  /**
   * Whether the participant is connected
   */
  connected: boolean;
}

/**
 * WebSocket client interface for the AUSTA SuperApp
 */
export interface WebSocketClient {
  /**
   * Connect to the WebSocket server
   * @param options Connection options
   */
  connect(options: SocketConnectionOptions): Promise<void>;
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void;
  
  /**
   * Subscribe to journey-specific notifications
   * @param journey Journey ID to subscribe to
   */
  subscribe(journey: string): Promise<void>;
  
  /**
   * Unsubscribe from journey-specific notifications
   * @param journey Journey ID to unsubscribe from
   */
  unsubscribe(journey: string): Promise<void>;
  
  /**
   * Mark a notification as read
   * @param notificationId ID of the notification to mark as read
   */
  markAsRead(notificationId: number): Promise<void>;
  
  /**
   * Add an event listener for WebSocket events
   * @param event Event type to listen for
   * @param listener Callback function to execute when the event occurs
   */
  on<T>(event: WebSocketServerEvent | TelemedicineSocketEvent, listener: (data: T) => void): void;
  
  /**
   * Remove an event listener for WebSocket events
   * @param event Event type to stop listening for
   * @param listener Callback function to remove
   */
  off<T>(event: WebSocketServerEvent | TelemedicineSocketEvent, listener: (data: T) => void): void;
  
  /**
   * Get the current connection status
   */
  getStatus(): WebSocketConnectionStatus;
  
  /**
   * Join a telemedicine session
   * @param sessionId ID of the telemedicine session to join
   * @param user User information for the participant
   */
  joinTelemedicineSession(sessionId: string, user: { id: string; name: string; role: 'patient' | 'provider' }): Promise<void>;
  
  /**
   * Leave a telemedicine session
   * @param sessionId ID of the telemedicine session to leave
   */
  leaveTelemedicineSession(sessionId: string): Promise<void>;
  
  /**
   * Send a message in a telemedicine session
   * @param sessionId ID of the telemedicine session
   * @param message Content of the message
   */
  sendTelemedicineMessage(sessionId: string, message: string): Promise<void>;
  
  /**
   * Send a WebRTC video offer
   * @param sessionId ID of the telemedicine session
   * @param target Target user ID to send the offer to
   * @param sdp SDP offer
   */
  sendVideoOffer(sessionId: string, target: string, sdp: RTCSessionDescriptionInit): Promise<void>;
  
  /**
   * Send a WebRTC video answer
   * @param sessionId ID of the telemedicine session
   * @param target Target user ID to send the answer to
   * @param sdp SDP answer
   */
  sendVideoAnswer(sessionId: string, target: string, sdp: RTCSessionDescriptionInit): Promise<void>;
  
  /**
   * Send a WebRTC ICE candidate
   * @param sessionId ID of the telemedicine session
   * @param target Target user ID to send the ICE candidate to
   * @param candidate ICE candidate
   */
  sendIceCandidate(sessionId: string, target: string, candidate: RTCIceCandidateInit): Promise<void>;
  
  /**
   * Toggle video in a telemedicine session
   * @param sessionId ID of the telemedicine session
   * @param enabled Whether video is enabled
   */
  toggleVideo(sessionId: string, enabled: boolean): Promise<void>;
  
  /**
   * Toggle audio in a telemedicine session
   * @param sessionId ID of the telemedicine session
   * @param enabled Whether audio is enabled
   */
  toggleAudio(sessionId: string, enabled: boolean): Promise<void>;
}