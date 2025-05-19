import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

// Import from @austa/interfaces instead of local types
import { ClaimType, ClaimFormData } from '@austa/interfaces/plan';

// Import validation schema from @austa/interfaces
import { claimValidationSchema } from '@austa/interfaces/plan/validation';

// Import from @austa/journey-context instead of local context
import { useJourneyContext } from '@austa/journey-context';
import { useClaims } from '@austa/journey-context/src/hooks';

// Import UI components from @austa/design-system
import { 
  Input, 
  DatePicker, 
  Select, 
  Button 
} from '@austa/design-system';

// Import primitives from @design-system/primitives
import { Stack, Box, Text } from '@design-system/primitives';

/**
 * A React component that renders a form for submitting insurance claims.
 * Uses Zod validation and Plan journey theming.
 *
 * @returns The rendered claim submission form.
 */
export const ClaimForm: React.FC = () => {
  // Get the journey context to apply Plan-specific theming
  const { currentJourney, theme } = useJourneyContext();
  
  // Track form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Access the navigation object
  const navigation = useNavigation();

  // Use the useClaims hook from @austa/journey-context
  const { submitClaim, isLoading } = useClaims();

  // Use React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimValidationSchema),
    defaultValues: {
      procedureType: undefined,
      date: undefined,
      provider: '',
      amount: undefined,
    },
  });

  // Define options for the procedure type select
  const procedureTypeOptions = [
    { label: 'Medical Consultation', value: 'medical' },
    { label: 'Dental Procedure', value: 'dental' },
    { label: 'Vision Care', value: 'vision' },
    { label: 'Prescription', value: 'prescription' },
    { label: 'Other', value: 'other' },
  ];

  // Handle form submission
  const onSubmit = async (data: ClaimFormData) => {
    try {
      setIsSubmitting(true);
      
      // Get the active plan ID from the journey context
      const activePlanId = currentJourney.activePlanId;
      
      if (!activePlanId) {
        Alert.alert('Error', 'No active plan found. Please select a plan first.');
        setIsSubmitting(false);
        return;
      }
      
      // Submit the claim using the hook from @austa/journey-context
      const result = await submitClaim(activePlanId, data);
      
      // Handle success
      setSubmitSuccess(true);
      setIsSubmitting(false);
      
      // Reset the form
      reset();
      
      // Show success message
      Alert.alert('Success', 'Claim submitted successfully!');
      
      // Navigate to confirmation screen
      navigation.navigate('ClaimConfirmation', { claimId: result.id });
    } catch (error) {
      // Handle error
      setIsSubmitting(false);
      setSubmitSuccess(false);
      
      // Show error message
      Alert.alert(
        'Error', 
        'Claim submission failed. Please try again.'
      );
      
      console.error('Claim submission error:', error);
    }
  };

  // Render the form using primitives from @design-system/primitives
  return (
    <Box padding="medium" backgroundColor="background">
      <Stack spacing="large">
        <Text variant="heading" color={theme.colors.plan.primary}>
          Submit a New Claim
        </Text>
        
        <Stack spacing="medium">
          {/* Procedure Type */}
          <Box>
            <Text variant="label" color={theme.colors.text.primary}>
              Procedure Type
            </Text>
            <Select
              name="procedureType"
              control={control}
              options={procedureTypeOptions}
              placeholder="Select procedure type"
              error={errors.procedureType?.message}
              theme={theme.plan}
            />
          </Box>
          
          {/* Date of Service */}
          <Box>
            <Text variant="label" color={theme.colors.text.primary}>
              Date of Service
            </Text>
            <DatePicker
              name="date"
              control={control}
              placeholder="Select date"
              error={errors.date?.message}
              theme={theme.plan}
              maxDate={new Date()} // Cannot select future dates
            />
          </Box>
          
          {/* Provider */}
          <Box>
            <Text variant="label" color={theme.colors.text.primary}>
              Provider
            </Text>
            <Input
              name="provider"
              control={control}
              placeholder="Enter provider name"
              error={errors.provider?.message}
              theme={theme.plan}
            />
          </Box>
          
          {/* Amount */}
          <Box>
            <Text variant="label" color={theme.colors.text.primary}>
              Amount
            </Text>
            <Input
              name="amount"
              control={control}
              placeholder="Enter amount"
              keyboardType="numeric"
              error={errors.amount?.message}
              theme={theme.plan}
            />
          </Box>
        </Stack>
        
        {/* Submit Button */}
        <Button 
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || isLoading}
          loading={isSubmitting || isLoading}
          theme={theme.plan}
          variant="primary"
          fullWidth
        >
          {isSubmitting ? 'Submitting...' : 'Submit Claim'}
        </Button>
      </Stack>
    </Box>
  );
};