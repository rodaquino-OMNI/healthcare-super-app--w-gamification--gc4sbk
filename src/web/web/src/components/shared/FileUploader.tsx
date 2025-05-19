import React, { useState, useRef, ChangeEvent } from 'react';

// Import from design system packages
import { Box, Text, Stack } from '@design-system/primitives';
import { Button, ProgressBar, Image } from '@austa/design-system';
import { useJourneyTheme } from '@austa/journey-context';
import { FileUploaderProps } from '@austa/interfaces/components';

/**
 * FileUploader component for web applications
 * Allows users to select files from their device, shows upload progress,
 * previews selected files, and provides a mechanism to remove files.
 */
export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  onFileSelected,
  journey,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedFileTypes = ['*/*'],
}) => {
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { colors } = useJourneyTheme(journey);

  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Check file size
      if (maxFileSize && file.size > maxFileSize) {
        alert(`File size exceeds the maximum allowed size (${formatFileSize(maxFileSize)})`);
        return;
      }

      setLoading(true);
      setFileObj(file);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setLoading(false);
          
          // Create a URL for the file
          const fileUrl = URL.createObjectURL(file);
          setFileUri(fileUrl);
          onFileSelected(fileUrl);
        }
      }, 200);
    }
  };

  // Trigger file input click
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setFileObj(null);
    setFileUri(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelected('');
  };

  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Determine if the file is an image based on its type
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  return (
    <Box width="100%" marginVertical={16}>
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
        padding={16} 
        backgroundColor="backgroundSecondary" 
        minHeight={120} 
        justifyContent="center"
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFileTypes.join(',')}
          style={{ display: 'none' }}
          aria-label="File input"
        />

        {loading ? (
          <Stack direction="column" spacing={12} alignItems="center" justifyContent="center" height={120}>
            <ProgressBar 
              current={uploadProgress} 
              total={100} 
              journey={journey}
              size="md"
            />
            <Text color="textSecondary" fontSize={14}>
              Uploading... {uploadProgress}%
            </Text>
          </Stack>
        ) : fileUri && fileObj ? (
          <Box 
            position="relative" 
            width="100%" 
            minHeight={120} 
            maxHeight={200}
            alignItems="center"
            justifyContent="center"
          >
            {isImageFile(fileObj) ? (
              <Image 
                src={fileUri} 
                alt="Selected image preview"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  maxHeight: 180,
                  objectFit: 'contain',
                  borderRadius: 8 
                }}
              />
            ) : (
              <Stack 
                direction="column"
                spacing={8}
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
                  style={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {fileObj.name}
                </Text>
                <Text fontSize={12} color="textSecondary">
                  {formatFileSize(fileObj.size)}
                </Text>
              </Stack>
            )}
            
            {/* Remove button */}
            <Button
              variant="tertiary"
              size="sm"
              iconOnly
              icon="✕"
              journey={journey}
              onPress={handleRemoveFile}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                borderRadius: '50%',
                width: 30,
                height: 30,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                color: 'white',
              }}
              accessibilityLabel="Remove file"
            />
          </Box>
        ) : (
          <Stack 
            direction="column" 
            spacing={16} 
            alignItems="center" 
            justifyContent="center" 
            padding={20}
          >
            <Text color="textSecondary" fontSize={14} textAlign="center">
              Drag and drop a file here, or click to select a file
            </Text>
            <Button
              variant="primary"
              size="md"
              onPress={handleSelectFile}
              journey={journey}
              accessibilityLabel="Select file"
            >
              Select File
            </Button>
          </Stack>
        )}
      </Box>
      
      {/* File type information */}
      {!fileUri && (
        <Text fontSize={12} color="textSecondary" marginTop={8}>
          Accepted file types: {acceptedFileTypes.join(', ')}
          {maxFileSize ? ` • Max size: ${formatFileSize(maxFileSize)}` : ''}
        </Text>
      )}
    </Box>
  );
};