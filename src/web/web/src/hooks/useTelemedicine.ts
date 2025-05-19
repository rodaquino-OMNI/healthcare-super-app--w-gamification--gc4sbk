/**
 * useTelemedicine Hook
 * 
 * A custom React hook for managing telemedicine sessions in the Care Now journey.
 * Handles WebRTC connection setup, media streams, and session state management.
 * 
 * @module hooks/useTelemedicine
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useJourney } from './useJourney';
import { 
  TelemedicineSession, 
  TelemedicineConnectionDetails,
  TelemedicineStatus
} from '@austa/interfaces/care/telemedicine-session';
import { Provider } from '@austa/interfaces/care/provider';
import { GET_TELEMEDICINE_SESSION_DETAILS } from 'src/web/shared/graphql/queries/care.queries';
import { apiConfig } from 'src/web/shared/config/apiConfig';
import { ApolloClient, InMemoryCache } from '@apollo/client';

// Error types for better error handling
interface TelemedicineError {
  code: string;
  message: string;
  details?: any;
}

// WebRTC configuration with improved error recovery
const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']
    },
    {
      urls: 'turn:turn.austa.com.br:3478',
      username: 'austauser',
      credential: 'austasecret'
    }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
  bundlePolicy: 'balanced',
  rtcpMuxPolicy: 'require',
  sdpSemantics: 'unified-plan'
};

// Apollo client for GraphQL queries
const client = new ApolloClient({
  uri: apiConfig.journeys.care,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    }
  }
});

/**
 * Custom hook for managing telemedicine sessions
 * 
 * @param sessionId - ID of the telemedicine session to connect to
 * @param config - Optional WebRTC configuration override
 * @returns Object containing session state and control methods
 */
export function useTelemedicine(sessionId: string, config?: RTCConfiguration) {
  const { user } = useAuth();
  const { journeyData } = useJourney();
  
  // State for session management
  const [session, setSession] = useState<TelemedicineSession | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<TelemedicineConnectionDetails | null>(null);
  const [status, setStatus] = useState<TelemedicineStatus>('scheduled');
  
  // State for WebRTC
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState<TelemedicineError | null>(null);
  
  // Refs for WebRTC objects
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  /**
   * Fetches session details from the API
   */
  const fetchSessionDetails = useCallback(async () => {
    if (!sessionId || !user) return;
    
    try {
      const { data } = await client.query({
        query: GET_TELEMEDICINE_SESSION_DETAILS,
        variables: { sessionId }
      });
      
      setSession(data.telemedicineSession);
      setProvider(data.telemedicineSession.provider);
      setConnectionDetails(data.telemedicineSession.connectionDetails);
      setStatus(data.telemedicineSession.status);
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Failed to fetch telemedicine session details',
        details: err
      });
    }
  }, [sessionId, user]);
  
  /**
   * Initializes local media stream with audio and video
   */
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      setLocalStream(stream);
      
      // Attach stream to video element if ref exists
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (err) {
      setError({
        code: 'MEDIA_ERROR',
        message: 'Failed to access camera or microphone',
        details: err
      });
      return null;
    }
  }, []);
  
  /**
   * Creates and configures the RTCPeerConnection
   */
  const createPeerConnection = useCallback((stream: MediaStream) => {
    try {
      // Use provided config or default
      const rtcConfig = config || DEFAULT_RTC_CONFIG;
      const peerConnection = new RTCPeerConnection(rtcConfig);
      
      // Add all tracks from local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Create a new MediaStream for remote tracks
      const newRemoteStream = new MediaStream();
      setRemoteStream(newRemoteStream);
      
      // Set up remote stream when tracks are received
      peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          newRemoteStream.addTrack(track);
        });
        
        // Attach remote stream to video element if ref exists
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = newRemoteStream;
        }
      };
      
      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        switch (peerConnection.iceConnectionState) {
          case 'connected':
          case 'completed':
            setIsConnected(true);
            setIsConnecting(false);
            break;
          case 'disconnected':
          case 'failed':
          case 'closed':
            setIsConnected(false);
            setIsConnecting(false);
            setError({
              code: 'CONNECTION_ERROR',
              message: `ICE connection state: ${peerConnection.iceConnectionState}`,
            });
            break;
          case 'checking':
            setIsConnecting(true);
            break;
          default:
            break;
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        switch (peerConnection.connectionState) {
          case 'connected':
            setIsConnected(true);
            setIsConnecting(false);
            break;
          case 'disconnected':
          case 'failed':
          case 'closed':
            setIsConnected(false);
            setIsConnecting(false);
            break;
          default:
            break;
        }
      };
      
      // Handle ICE candidate errors
      peerConnection.onicecandidateerror = (event) => {
        // Log error but don't fail the connection as some candidate errors are normal
        console.warn('ICE candidate error:', event);
      };
      
      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (err) {
      setError({
        code: 'PEER_CONNECTION_ERROR',
        message: 'Failed to create peer connection',
        details: err
      });
      return null;
    }
  }, [config]);
  
  /**
   * Connects to the telemedicine session
   */
  const connect = useCallback(async () => {
    if (!connectionDetails || !sessionId) {
      setError({
        code: 'MISSING_DETAILS',
        message: 'Connection details or session ID missing'
      });
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Initialize local stream if not already done
      const stream = localStream || await initializeLocalStream();
      if (!stream) return;
      
      // Create peer connection if not already done
      const peerConnection = peerConnectionRef.current || createPeerConnection(stream);
      if (!peerConnection) return;
      
      // Connect to signaling server using connection details
      // This is a simplified example - in a real app, you would use the
      // connectionDetails to connect to a signaling server
      const { url, token, roomName } = connectionDetails;
      
      // Update session status
      setStatus('connecting');
      
      // In a real implementation, you would connect to the signaling server here
      // and handle the WebRTC signaling process (offer/answer/ICE candidates)
      
      // For this example, we'll simulate a successful connection after a delay
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatus('in-progress');
      }, 1500);
      
    } catch (err) {
      setIsConnecting(false);
      setError({
        code: 'CONNECTION_ERROR',
        message: 'Failed to establish connection',
        details: err
      });
    }
  }, [connectionDetails, sessionId, localStream, initializeLocalStream, createPeerConnection]);
  
  /**
   * Disconnects from the telemedicine session
   */
  const disconnect = useCallback(() => {
    // Close peer connection if it exists
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Stop all tracks in the local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Clear remote stream
    setRemoteStream(null);
    
    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setStatus('ended');
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [localStream]);
  
  /**
   * Toggles audio mute state
   */
  const toggleMute = useCallback(() => {
    if (!localStream) return;
    
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;
    
    const newMuteState = !isMuted;
    audioTracks.forEach(track => {
      track.enabled = !newMuteState;
    });
    
    setIsMuted(newMuteState);
  }, [localStream, isMuted]);
  
  /**
   * Toggles video on/off state
   */
  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;
    
    const newCameraState = !isCameraOff;
    videoTracks.forEach(track => {
      track.enabled = !newCameraState;
    });
    
    setIsCameraOff(newCameraState);
  }, [localStream, isCameraOff]);
  
  /**
   * Switches between available cameras
   */
  const switchCamera = useCallback(async () => {
    if (!localStream) return;
    
    try {
      // Get current video track settings
      const videoTrack = localStream.getVideoTracks()[0];
      if (!videoTrack) return;
      
      const currentSettings = videoTrack.getSettings();
      const currentDeviceId = currentSettings.deviceId;
      
      // Get list of available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length <= 1) return; // No other cameras available
      
      // Find the next camera in the list
      const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];
      
      // Get a new stream with the next camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } },
        audio: true
      });
      
      // Replace the video track in the local stream
      const newVideoTrack = newStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
      
      // Create a new stream with the new video track and existing audio track
      const combinedStream = new MediaStream();
      if (newVideoTrack) combinedStream.addTrack(newVideoTrack);
      if (audioTrack) combinedStream.addTrack(audioTrack);
      
      // Stop the old video track
      videoTrack.stop();
      
      // Replace the track in the peer connection if it exists
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(sender => 
          sender.track && sender.track.kind === 'video'
        );
        
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }
      
      // Update the local stream
      setLocalStream(combinedStream);
      
      // Update the video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = combinedStream;
      }
      
    } catch (err) {
      setError({
        code: 'CAMERA_SWITCH_ERROR',
        message: 'Failed to switch camera',
        details: err
      });
    }
  }, [localStream]);
  
  /**
   * Retry connection if it fails
   */
  const retryConnection = useCallback(() => {
    setError(null);
    connect();
  }, [connect]);
  
  // Fetch session details when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId, fetchSessionDetails]);
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return {
    // Session state
    session,
    provider,
    status,
    isConnecting,
    isConnected,
    isMuted,
    isCameraOff,
    error,
    
    // Media streams
    localStream,
    remoteStream,
    
    // Video refs
    localVideoRef,
    remoteVideoRef,
    
    // Methods
    connect,
    disconnect,
    toggleMute,
    toggleCamera,
    switchCamera,
    retryConnection
  };
}

export default useTelemedicine;