import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/native';

// Import components from @austa/design-system
import { JourneyHeader } from '@austa/design-system/components/JourneyHeader';
import { ClaimForm } from '@austa/design-system/plan/ClaimForm';
import { LoadingIndicator } from '@austa/design-system/components/LoadingIndicator';

// Import journey context from @austa/journey-context
import { useJourney } from '@austa/journey-context';

// Import interfaces from @austa/interfaces
import { ClaimFormData } from '@austa/interfaces/plan';

// Import constants
import { MOBILE_PLAN_ROUTES } from '@austa/interfaces/next';

/**
 * Renders the claim submission screen with a journey-specific header and the ClaimForm component.
 * Provides loading state management and error handling during claim submission.
 * 
 * @param {StackScreenProps<any, any>} props - The navigation props for the screen.
 * @returns {JSX.Element} The rendered claim submission screen.
 */
const ClaimSubmissionScreen: React.FC<StackScreenProps<any, any>> = () => {
  // Use the navigation object for screen transitions
  const navigation = useNavigation();
  
  // Get the current journey from the journey context
  const { currentJourney } = useJourney();
  
  // State for loading and error handling
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Handles the claim submission process
   * @param {ClaimFormData} formData - The form data for the claim
   */
  const handleSubmitClaim = async (formData: ClaimFormData) => {
    try {
      setIsSubmitting(true);
      
      // In a real implementation, we would call an API to submit the claim
      // For now, we'll simulate a successful submission after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a successful response with a claim ID
      const claimResponse = {
        id: `claim-${Date.now()}`,
        ...formData,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      
      setIsSubmitting(false);
      
      // Navigate to the claim confirmation screen with the claim ID
      navigation.navigate(MOBILE_PLAN_ROUTES.ClaimConfirmation, { 
        claimId: claimResponse.id 
      });
    } catch (error) {
      setIsSubmitting(false);
      
      // Show error alert
      Alert.alert(
        'Submission Failed',
        'An error occurred while submitting your claim. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <JourneyHeader
        title="Submit Claim"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        journey="plan"
      />
      
      <View style={styles.formContainer}>
        <ClaimForm 
          onSubmit={handleSubmitClaim}
          isSubmitting={isSubmitting}
        />
        
        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <LoadingIndicator size="large" color="#0066CC" />
            <View style={styles.loadingTextContainer}>
              <View style={styles.loadingText}>
                <Text style={styles.loadingTextContent}>Submitting your claim...</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    padding: 16,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingTextContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
  },
  loadingText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTextContent: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export { ClaimSubmissionScreen };