import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Input } from '@austa/design-system/components/Input';
import { Button } from '@austa/design-system/components/Button';
import { Text } from '@design-system/primitives/components/Text';
import { Box } from '@design-system/primitives/components/Box';
import { Stack } from '@design-system/primitives/components/Stack';
import { useAuth } from '@austa/journey-context/providers';
import { MFAVerificationData } from '@austa/interfaces/auth/token.types';

/**
 * MFA screen component that handles multi-factor authentication verification
 * This screen allows users to enter a verification code they received via SMS or email
 * to complete the authentication process.
 */
export const MFAScreen: React.FC = () => {
  // State for the verification code input
  const [code, setCode] = useState('');
  // State to track form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State to track validation errors
  const [error, setError] = useState<string | null>(null);
  
  // Get navigation object for routing
  const navigation = useNavigation();
  // Get route params to access the temporary token
  const route = useRoute<RouteProp<{ params: { tempToken: string } }, 'params'>>();
  // Get the MFA verification function from auth context
  const { handleMfaVerification } = useAuth();
  
  // Reset error when code changes
  useEffect(() => {
    if (error) setError(null);
  }, [code]);
  
  /**
   * Validates the verification code format
   * @returns boolean indicating if the code is valid
   */
  const validateCode = (): boolean => {
    // Check if code is empty
    if (!code.trim()) {
      setError('Verification code is required');
      return false;
    }
    
    // Check if code is numeric
    if (!/^\d+$/.test(code)) {
      setError('Verification code must contain only numbers');
      return false;
    }
    
    // Check if code has correct length (typically 6 digits)
    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return false;
    }
    
    return true;
  };
  
  /**
   * Handles the verification code submission
   * Attempts to verify the code with the temporary token
   */
  const handleSubmit = async () => {
    // Validate code before submission
    if (!validateCode()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the temporary token from route params
      const tempToken = route.params?.tempToken;
      
      if (!tempToken) {
        throw new Error('Missing temporary token');
      }
      
      // Prepare verification data
      const verificationData: MFAVerificationData = {
        code,
        tempToken
      };
      
      // Call the MFA verification function from auth context
      await handleMfaVerification(verificationData);
      // Navigation after successful verification is handled by the auth context
    } catch (error) {
      // Display user-friendly error message
      const errorMessage = error instanceof Error ? 
        error.message : 'Verification failed. Please try again.';
      
      setError(errorMessage);
      setIsSubmitting(false);
      
      // Show alert for critical errors
      if (!(error instanceof Error) || !error.message.includes('code')) {
        Alert.alert(
          'Authentication Error',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Box padding="lg">
        <Stack direction="column" spacing="md">
          <Text 
            fontSize="xl" 
            fontWeight="bold"
            textAlign="center"
            testID="mfa-title"
          >
            Verification Required
          </Text>
          
          <Text 
            fontSize="md" 
            color="neutral.gray700"
            textAlign="center"
            testID="mfa-description"
          >
            Please enter the verification code sent to your device to complete the login process.
          </Text>
          
          <Box marginTop="md">
            <Input
              value={code}
              onChangeText={setCode}
              placeholder="Enter verification code"
              keyboardType="number-pad"
              maxLength={6}
              error={error}
              journey="health"
              testID="mfa-code-input"
              accessibilityLabel="Verification code"
              autoFocus
            />
          </Box>
          
          <Box marginTop="md">
            {isSubmitting ? (
              <Button
                variant="primary"
                journey="health"
                loading={true}
                testID="mfa-verify-button"
                accessibilityLabel="Verifying code"
              >
                Verifying...
              </Button>
            ) : (
              <Button
                onPress={handleSubmit}
                journey="health"
                variant="primary"
                disabled={!code.trim()}
                testID="mfa-verify-button"
                accessibilityLabel="Verify code"
              >
                Verify
              </Button>
            )}
          </Box>
          
          <Box marginTop="sm">
            <Text 
              fontSize="sm" 
              color="neutral.gray700"
              textAlign="center"
              testID="mfa-help-text"
            >
              Didn't receive a code? Contact support for assistance.
            </Text>
          </Box>
        </Stack>
      </Box>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default MFAScreen;