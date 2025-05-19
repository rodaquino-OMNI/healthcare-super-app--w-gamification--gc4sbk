import React, { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { launchCameraAsync, launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker'; // Updated for v0.73.4
import { useNavigation } from '@react-navigation/native';

// Import from design system packages
import { Box, Text, Touchable } from '@design-system/primitives';
import { LoadingIndicator, Image } from '@austa/design-system';
import { useJourneyTheme } from '@austa/journey-context';
import { FileUploaderProps } from '@austa/interfaces/components';

// Import from shared utilities
import { checkPermissions } from '@austa/utils/permissions';

/**
 * FileUploader component for capturing images via camera or selecting files from gallery
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  onFileSelected,
  journey,
}) => {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation();
  const { colors } = useJourneyTheme(journey);

  // Handle camera capture
  const handleCameraCapture = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check permissions on Android
      if (Platform.OS === 'android') {
        const hasPermission = await checkPermissions('camera');
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Camera permission is needed to capture images.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }
      }

      const result = await launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      setLoading(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setFileUri(selectedAsset.uri);
        onFileSelected(selectedAsset.uri);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      console.error('Camera capture error:', error);
    }
  }, [onFileSelected]);

  // Handle file selection
  const handleFileSelect = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check permissions on Android
      if (Platform.OS === 'android') {
        const hasPermission = await checkPermissions('storage');
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Storage permission is needed to select files.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }
      }

      const result = await launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: MediaTypeOptions.All,
        quality: 0.8,
      });

      setLoading(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setFileUri(selectedAsset.uri);
        onFileSelected(selectedAsset.uri);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to select file. Please try again.');
      console.error('File selection error:', error);
    }
  }, [onFileSelected]);

  // Determine if the file is an image based on its URI
  const isImageFile = (uri: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(uri.toLowerCase());
  };

  // Extract filename from URI
  const getFileName = (uri: string) => {
    return uri.split('/').pop() || 'File';
  };

  return (
    <Box width="100%" marginVertical={10}>
      <Text 
        fontSize={16} 
        marginBottom={8} 
        fontWeight="500" 
        color="textPrimary"
      >
        {label}
      </Text>
      <Box 
        borderWidth={1} 
        borderColor="border" 
        borderRadius={8} 
        padding={12} 
        backgroundColor="backgroundSecondary" 
        minHeight={120} 
        justifyContent="center"
      >
        {loading ? (
          <Box alignItems="center" justifyContent="center" height={120}>
            <LoadingIndicator journey={journey} />
            <Text marginTop={10} color="textSecondary" fontSize={14}>
              Processing...
            </Text>
          </Box>
        ) : fileUri ? (
          <Box 
            alignItems="center" 
            justifyContent="center" 
            position="relative" 
            width="100%" 
            minHeight={120} 
            maxHeight={200}
          >
            {isImageFile(fileUri) ? (
              <Image 
                source={{ uri: fileUri }} 
                style={{ width: '100%', height: '100%', borderRadius: 8 }}
                resizeMode="contain" 
                accessibilityLabel="Selected image preview"
              />
            ) : (
              <Box 
                alignItems="center" 
                justifyContent="center" 
                backgroundColor="backgroundTertiary" 
                borderRadius={8} 
                padding={20} 
                width="80%"
              >
                <Text fontSize={48} marginBottom={10}>📄</Text>
                <Text 
                  fontSize={14} 
                  color="textPrimary" 
                  numberOfLines={1} 
                  ellipsizeMode="middle"
                  maxWidth="100%"
                >
                  {getFileName(fileUri)}
                </Text>
              </Box>
            )}
            <Touchable
              position="absolute"
              top={10}
              right={10}
              width={30}
              height={30}
              borderRadius={15}
              alignItems="center"
              justifyContent="center"
              backgroundColor={colors.primary}
              elevation={3}
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.3}
              shadowRadius={2}
              onPress={() => {
                setFileUri(null);
                onFileSelected('');
              }}
              accessibilityLabel="Remove file"
              accessibilityHint="Removes the currently selected file"
            >
              <Text color="white" fontSize={16} fontWeight="bold">✕</Text>
            </Touchable>
          </Box>
        ) : (
          <Box 
            flexDirection="row" 
            justifyContent="space-around" 
            width="100%" 
            paddingVertical={20}
          >
            <Touchable
              paddingVertical={12}
              paddingHorizontal={20}
              borderRadius={8}
              alignItems="center"
              justifyContent="center"
              minWidth={120}
              backgroundColor={colors.primary}
              elevation={2}
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.2}
              shadowRadius={1.5}
              onPress={handleCameraCapture}
              disabled={loading}
              accessibilityLabel="Take photo"
              accessibilityHint="Opens camera to take a photo"
            >
              <Text color="white" fontSize={16} fontWeight="500">📷 Camera</Text>
            </Touchable>
            <Touchable
              paddingVertical={12}
              paddingHorizontal={20}
              borderRadius={8}
              alignItems="center"
              justifyContent="center"
              minWidth={120}
              backgroundColor={colors.primary}
              elevation={2}
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.2}
              shadowRadius={1.5}
              onPress={handleFileSelect}
              disabled={loading}
              accessibilityLabel="Select file"
              accessibilityHint="Opens file picker to select a file"
            >
              <Text color="white" fontSize={16} fontWeight="500">📁 Gallery</Text>
            </Touchable>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FileUploader;