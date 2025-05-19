import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, BackHandler, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TelemedicineSession } from '@austa/interfaces/care';
import { useTelemedicineSession } from '@app/hooks/useTelemedicine';
import { useJourneyContext } from '@austa/journey-context';
import { logger } from '@austa/logging';
import {
  Button,
  Card,
  Text,
  ProgressCircle,
  Modal
} from '@austa/design-system';
import { RTCView } from 'react-native-webrtc';
import { checkAndroidPermissions, requestCameraAndMicrophonePermissions } from '@app/utils/permissions';
import { CARE_JOURNEY } from '@austa/journey-context/constants';

/**
 * Telemedicine component for video consultations in the Care journey.
 * 
 * This component orchestrates the telemedicine session lifecycle, integrates with
 * the useTelemedicineSession hook, and provides UI for initiating and managing
 * telemedicine sessions with healthcare providers.
 * 
 * @returns React component for telemedicine video consultations
 */
const Telemedicine = () => {
  // Get navigation and route params
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId, appointmentId } = route.params || {};
  
  // Access journey context for journey-specific theming and state
  const { journey, theme } = useJourneyContext();
  
  // Local state for UI management
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  // Get session ID from route params if available
  const sessionId = route.params?.sessionId;
  
  // Use the telemedicine session hook to manage the session
  const {
    session,
    loading,
    error,
    createSession,
    refreshSession
  } = useTelemedicineSession(sessionId);
  
  /**
   * Handles back button press to prevent accidental navigation away from active call
   * @returns {boolean} True if the back action was handled, false otherwise
   */
  const handleBackPress = useCallback(() => {
    if (session && session.status === 'active') {
      Alert.alert(
        'End Call',
        'Are you sure you want to end this telemedicine session?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { 
            text: 'End Call', 
            style: 'destructive', 
            onPress: () => {
              navigation.goBack();
            } 
          },
        ]
      );
      return true; // Prevent default back action
    }
    return false; // Allow default back action
  }, [session, navigation]);
  
  /**
   * Toggles microphone mute state
   */
  const toggleMute = useCallback(() => {
    if (session) {
      // Implementation would interact with the WebRTC session to mute/unmute
      setIsMuted(prev => !prev);
      
      logger.info('Telemedicine microphone toggled', {
        journey: CARE_JOURNEY,
        sessionId: session.id,
        isMuted: !isMuted,
        context: 'Telemedicine'
      });
    }
  }, [session, isMuted]);
  
  /**
   * Toggles camera on/off state
   */
  const toggleCamera = useCallback(() => {
    if (session) {
      // Implementation would interact with the WebRTC session to enable/disable camera
      setIsCameraOff(prev => !prev);
      
      logger.info('Telemedicine camera toggled', {
        journey: CARE_JOURNEY,
        sessionId: session.id,
        isCameraOff: !isCameraOff,
        context: 'Telemedicine'
      });
    }
  }, [session, isCameraOff]);
  
  /**
   * Ends the current telemedicine session and navigates back
   */
  const endCall = useCallback(() => {
    if (session) {
      // Implementation would end the WebRTC session
      logger.info('Telemedicine session ended by user', {
        journey: CARE_JOURNEY,
        sessionId: session.id,
        context: 'Telemedicine'
      });
      
      navigation.goBack();
    }
  }, [session, navigation]);
  
  /**
   * Checks and requests necessary permissions for telemedicine
   */
  const checkPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const hasPermissions = await checkAndroidPermissions();
        if (!hasPermissions) {
          setShowPermissionModal(true);
          return false;
        }
      }
      
      // For iOS, permissions are requested when needed by the WebRTC API
      setPermissionsGranted(true);
      return true;
    } catch (err) {
      logger.error('Failed to check telemedicine permissions', {
        journey: CARE_JOURNEY,
        error: err instanceof Error ? err : new Error('Unknown permission error'),
        context: 'Telemedicine'
      });
      
      setShowPermissionModal(true);
      return false;
    }
  }, []);
  
  /**
   * Requests camera and microphone permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      const granted = await requestCameraAndMicrophonePermissions();
      if (granted) {
        setPermissionsGranted(true);
        setShowPermissionModal(false);
        
        // If we have a provider ID, create a session now that we have permissions
        if (providerId && !sessionId) {
          createSession(providerId);
        }
      } else {
        // Permissions denied, show alert
        Alert.alert(
          'Permissions Required',
          'Camera and microphone access are required for telemedicine sessions. Please enable them in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      logger.error('Failed to request telemedicine permissions', {
        journey: CARE_JOURNEY,
        error: err instanceof Error ? err : new Error('Unknown permission error'),
        context: 'Telemedicine'
      });
      
      Alert.alert(
        'Permission Error',
        'An error occurred while requesting camera and microphone permissions.',
        [{ text: 'OK' }]
      );
    }
  }, [providerId, sessionId, createSession]);
  
  // Check permissions when component mounts
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);
  
  // Create a session if we have a provider ID but no session ID
  useEffect(() => {
    const initSession = async () => {
      if (providerId && !sessionId && permissionsGranted) {
        try {
          await createSession(providerId);
        } catch (err) {
          logger.error('Failed to create telemedicine session', {
            journey: CARE_JOURNEY,
            error: err instanceof Error ? err : new Error('Failed to create session'),
            providerId,
            context: 'Telemedicine'
          });
          
          Alert.alert(
            'Session Error',
            'Failed to create telemedicine session. Please try again.',
            [{ 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }]
          );
        }
      }
    };
    
    initSession();
  }, [providerId, sessionId, permissionsGranted, createSession, navigation]);
  
  // Set up back handler to prevent accidental navigation during call
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, [handleBackPress]);
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ProgressCircle size={60} color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Connecting to telemedicine session...
        </Text>
      </View>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
          Connection Error
        </Text>
        <Text style={[styles.errorMessage, { color: theme.colors.text }]}>
          {error.message || 'Failed to connect to telemedicine session'}
        </Text>
        <Button 
          onPress={() => navigation.goBack()}
          variant="primary"
        >
          Return to Appointments
        </Button>
      </View>
    );
  }
  
  // Render permission request modal
  const renderPermissionModal = () => (
    <Modal 
      visible={showPermissionModal}
      title="Camera and Microphone Access"
      onClose={() => navigation.goBack()}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalText}>
          Telemedicine sessions require access to your camera and microphone.
          Please grant these permissions to continue.
        </Text>
        <View style={styles.modalButtons}>
          <Button 
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button 
            onPress={requestPermissions}
            variant="primary"
            style={styles.modalButton}
          >
            Grant Access
          </Button>
        </View>
      </View>
    </Modal>
  );
  
  // Render the main telemedicine interface
  return (
    <View style={styles.container}>
      {/* Permission modal */}
      {renderPermissionModal()}
      
      {/* Provider video (remote stream) */}
      {session && session.status === 'active' && (
        <View style={styles.remoteStreamContainer}>
          {session.providerStream ? (
            <RTCView 
              streamURL={session.providerStream.toURL()} 
              style={styles.remoteStream}
              objectFit="cover"
            />
          ) : (
            <View style={[styles.noVideoContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.noVideoText, { color: theme.colors.text }]}>
                Waiting for provider's video...
              </Text>
            </View>
          )}
          
          {/* Provider name and status */}
          <View style={styles.providerInfoContainer}>
            <Card style={styles.providerInfo}>
              <Text style={styles.providerName}>
                {session.providerName || 'Healthcare Provider'}
              </Text>
              <Text style={styles.sessionStatus}>
                {session.status === 'active' ? 'Connected' : 'Connecting...'}
              </Text>
            </Card>
          </View>
        </View>
      )}
      
      {/* User video (local stream) */}
      {session && session.status === 'active' && (
        <View style={styles.localStreamContainer}>
          {!isCameraOff && session.userStream ? (
            <RTCView 
              streamURL={session.userStream.toURL()} 
              style={styles.localStream}
              objectFit="cover"
              zOrder={1}
            />
          ) : (
            <View style={[styles.cameraOffContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.cameraOffText, { color: theme.colors.text }]}>
                Camera Off
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Call controls */}
      {session && (
        <View style={styles.controlsContainer}>
          <Button
            onPress={toggleMute}
            variant={isMuted ? "secondary" : "primary"}
            style={styles.controlButton}
            icon={isMuted ? "mic-off" : "mic"}
          >
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          
          <Button
            onPress={toggleCamera}
            variant={isCameraOff ? "secondary" : "primary"}
            style={styles.controlButton}
            icon={isCameraOff ? "video-off" : "video"}
          >
            {isCameraOff ? "Camera On" : "Camera Off"}
          </Button>
          
          <Button
            onPress={endCall}
            variant="destructive"
            style={styles.endCallButton}
            icon="phone-off"
          >
            End Call
          </Button>
        </View>
      )}
      
      {/* Connecting or waiting state */}
      {session && session.status !== 'active' && (
        <View style={styles.connectingContainer}>
          <ProgressCircle size={60} color={theme.colors.primary} />
          <Text style={[styles.connectingText, { color: theme.colors.text }]}>
            {session.status === 'connecting' ? 'Connecting to provider...' : 
             session.status === 'waiting' ? 'Waiting for provider to join...' : 
             'Preparing telemedicine session...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  remoteStreamContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteStream: {
    flex: 1,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
  },
  noVideoText: {
    fontSize: 16,
    textAlign: 'center',
  },
  localStreamContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localStream: {
    flex: 1,
  },
  cameraOffContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
  },
  cameraOffText: {
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  endCallButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  connectingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  connectingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  providerInfoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  providerInfo: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  providerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionStatus: {
    fontSize: 12,
    color: '#ccc',
  },
  modalContent: {
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 12,
  },
});

export default Telemedicine;