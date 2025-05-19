import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';

// Updated imports using standardized module resolution
import { HealthMetricType } from '@austa/interfaces/health/types';
import { HealthMetric } from '@austa/interfaces/health/metric';
import { createHealthMetric } from '@app/api/health';
import { useHealthMetrics } from '@app/hooks/useHealthMetrics';
import { Input } from '@austa/design-system/components/Input';
import { Button } from '@austa/design-system/components/Button';
import { useJourney } from '@austa/journey-context';
import JourneyHeader from '@app/components/shared/JourneyHeader';
import ErrorState from '@app/components/shared/ErrorState';
import LoadingIndicator from '@app/components/shared/LoadingIndicator';

/**
 * Form data interface for adding a new health metric
 */
interface AddMetricFormData {
  type: string;
  value: string;
  timestamp: string;
}

/**
 * Props for the AddMetricScreen component
 */
interface AddMetricScreenProps {
  // No specific props are defined for this screen
}

/**
 * Renders a form for adding a new health metric in the Health journey.
 * This screen allows users to record various health measurements like
 * blood pressure, weight, heart rate, etc.
 * 
 * @returns The rendered AddMetricScreen component.
 */
export const AddMetricScreen: React.FC<AddMetricScreenProps> = () => {
  // Get journey context for journey-specific theming and state
  const { journey, theme } = useJourney();
  const navigation = useNavigation();
  const { refreshMetrics } = useHealthMetrics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define a form schema using Yup for validation
  const schema = yup.object({
    type: yup.string().required('Metric type is required'),
    value: yup.number().required('Metric value is required').typeError('Value must be a number'),
    timestamp: yup.string().required('Timestamp is required'),
  });

  // Use react-hook-form to manage the form state and validation
  const { control, handleSubmit, formState: { errors }, reset } = useForm<AddMetricFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      type: '',
      value: '',
      timestamp: new Date().toISOString(),
    },
  });

  // Handle form submission
  const onSubmit = async (data: AddMetricFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert form data to the expected format
      const metricData: Partial<HealthMetric> = {
        type: data.type as HealthMetricType,
        value: parseFloat(data.value),
        timestamp: new Date(data.timestamp),
        source: 'manual-entry'
      };
      
      // Call the createHealthMetric API function
      await createHealthMetric('user-health-record-id', metricData);
      
      // Refresh metrics list to show the newly added metric
      await refreshMetrics();
      
      // Reset the form
      reset();
      
      // Show success message
      Alert.alert('Success', 'Health metric added successfully');
      
      // Navigate back to the health dashboard
      navigation.goBack();
    } catch (error) {
      // Handle errors with user-friendly message
      console.error('Error creating health metric:', error);
      setError(error instanceof Error ? error.message : 'Failed to add health metric. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state during submission
  if (isSubmitting) {
    return <LoadingIndicator />;
  }

  // Show error state if there was a problem
  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Journey-specific header with theming */}
      <JourneyHeader title="Add Health Metric" showBackButton />
      
      <View style={styles.form}>
        {/* Metric Type Input */}
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Metric Type"
              placeholder="e.g., BLOOD_PRESSURE, WEIGHT, HEART_RATE"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.type?.message}
              accessibilityLabel="Metric Type"
              journeyTheme={journey}
            />
          )}
        />
        
        {/* Metric Value Input */}
        <Controller
          control={control}
          name="value"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Metric Value"
              placeholder="Enter numeric value"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.value?.message}
              keyboardType="numeric"
              accessibilityLabel="Metric Value"
              journeyTheme={journey}
            />
          )}
        />
        
        {/* Timestamp Input */}
        <Controller
          control={control}
          name="timestamp"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Timestamp"
              placeholder="YYYY-MM-DDTHH:MM:SS.sssZ"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.timestamp?.message}
              accessibilityLabel="Timestamp"
              journeyTheme={journey}
            />
          )}
        />
        
        {/* Submit Button */}
        <Button 
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          size="lg"
          journeyTheme={journey}
          style={styles.submitButton}
          accessibilityLabel="Add Health Metric"
        >
          Add Metric
        </Button>
      </View>
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  form: {
    padding: 16,
    gap: 16,
  },
  submitButton: {
    marginTop: 24,
  },
});

export default AddMetricScreen;