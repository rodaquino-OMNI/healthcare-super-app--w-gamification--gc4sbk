import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  useCameraPermission,
  CameraRuntimeError,
  CameraPosition,
} from 'react-native-vision-camera'; // Updated to latest version
import { Platform, View, Image, StyleSheet, Text } from 'react-native'; // Updated to match RN 0.73.4
import { Button } from '@austa/design-system'; // Updated to use @austa/design-system
import { LoadingIndicator } from 'src/web/mobile/src/components/shared/LoadingIndicator';
// No need to import requestCameraPermission as we're using the hook's requestPermission
import { PhotoCaptureProps } from '@austa/interfaces/components/shared.types'; // Import from interfaces package

/**
 * PhotoCapture Component:
 * A component that allows users to capture photos using the device's camera.
 * It handles permission requests, camera access, and displays a preview of the captured image.
 */
export const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onCapture }) => {
  // State variables
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const camera = useRef<Camera>(null);

  // Use the updated camera permission hook
  const { hasPermission, requestPermission } = useCameraPermission();

  // Get the available camera device
  const device = Camera.getAvailableCameraDevices().find(
    (device) => device.position === 'back'
  );

  /**
   * useEffect hook to handle camera initialization.
   */
  useEffect(() => {
    // Set camera as initialized once permissions are determined
    setIsCameraInitialized(true);
  }, [hasPermission]);

  /**
   * Handles the photo capture process.
   */
  const capturePhoto = async () => {
    // Check if the camera reference is available
    if (camera.current && hasPermission) {
      try {
        // Capture the photo using the camera
        const photo = await camera.current.takePhoto({
          qualityPrioritization: 'speed',
          flash: 'off',
        });

        // Set the captured image URI
        const imageUri = `file://${photo.path}`;
        setCapturedImage(imageUri);
        onCapture(imageUri);
      } catch (error) {
        console.error('Error capturing photo:', error);
        setCameraError('Failed to capture photo. Please try again.');
      }
    }
  };

  /**
   * Handles camera errors
   */
  const onCameraError = (error: CameraRuntimeError) => {
    console.error(`Camera error: ${error.code}`, error.message);
    setCameraError(`Camera error: ${error.message}`);
  };

  // Render loading indicator while camera is initializing
  if (!isCameraInitialized) {
    return <LoadingIndicator label="Initializing Camera..." />;
  }

  // Render permission request UI if camera permission is not granted
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Button 
          onPress={requestPermission} 
          accessibilityLabel="Request Camera Permission"
          variant="primary"
          size="md"
        >
          Request Camera Permission
        </Button>
      </View>
    );
  }

  // Render error message if there's a camera error
  if (cameraError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{cameraError}</Text>
        <Button 
          onPress={() => setCameraError(null)} 
          accessibilityLabel="Try Again"
          variant="primary"
          size="md"
        >
          Try Again
        </Button>
      </View>
    );
  }

  // Render the camera preview and capture button
  return (
    <View style={styles.container}>
      {device ? (
        <Camera
          style={styles.camera}
          device={device}
          isActive={hasPermission}
          ref={camera}
          photo={true}
          onError={onCameraError}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No camera device available</Text>
        </View>
      )}
      
      {capturedImage && (
        <Image source={{ uri: capturedImage }} style={styles.imagePreview} />
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          onPress={capturePhoto} 
          style={styles.captureButton} 
          accessibilityLabel="Capture Photo"
          variant="primary"
          size="lg"
        >
          Capture Photo
        </Button>
      </View>
    </View>
  );
};

// Component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 15,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    padding: 20,
  },
});