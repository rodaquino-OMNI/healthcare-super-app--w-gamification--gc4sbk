/**
 * HealthGoalForm.tsx
 * 
 * A React Native component for the Health journey that allows users to create or edit
 * health-related goals. It uses React Hook Form with Zod validation, leverages the
 * Health journey theme from @austa/journey-context, and provides a consistent interface
 * for goal creation across the app.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import from @austa/interfaces for type definitions and validation schemas
import { HealthGoal, healthGoalSchema } from '@austa/interfaces/health';

// Import from @austa/journey-context for Health journey theming
import { useJourney } from '@austa/journey-context';

// Import from @austa/design-system for UI components
import { 
  Button, 
  Input, 
  DatePicker,
  Select,
  ProgressBar
} from '@austa/design-system';

// Import from @design-system/primitives for layout
import { Box, Stack, Text } from '@design-system/primitives';

// Custom hook for health goal API interactions
import { useHealthGoals } from '../../hooks/useHealthGoals';

// Types for the form props
interface HealthGoalFormProps {
  initialData?: Partial<HealthGoal>;
  onSuccess?: (goal: HealthGoal) => void;
  onCancel?: () => void;
}

/**
 * HealthGoalForm component for creating or editing health goals
 */
export const HealthGoalForm: React.FC<HealthGoalFormProps> = ({ 
  initialData, 
  onSuccess, 
  onCancel 
}) => {
  // Get the current journey context to apply Health-specific theming
  const { currentJourney } = useJourney();
  
  // State for form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom hook for health goal API interactions
  const { createGoal, updateGoal, isLoading, error } = useHealthGoals();
  
  // Initialize form with React Hook Form and Zod validation
  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm<HealthGoal>({
    resolver: zodResolver(healthGoalSchema),
    defaultValues: initialData || {
      type: '',
      target: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'ACTIVE'
    }
  });
  
  // Goal type options for the select input
  const goalTypeOptions = [
    { label: 'Steps', value: 'STEPS' },
    { label: 'Weight', value: 'WEIGHT' },
    { label: 'Sleep', value: 'SLEEP' },
    { label: 'Water', value: 'WATER' },
    { label: 'Blood Pressure', value: 'BLOOD_PRESSURE' },
    { label: 'Heart Rate', value: 'HEART_RATE' },
    { label: 'Glucose', value: 'GLUCOSE' }
  ];
  
  // Handle form submission
  const onSubmit = async (data: HealthGoal) => {
    try {
      setIsSubmitting(true);
      
      // Determine if we're creating a new goal or updating an existing one
      let result;
      if (initialData?.id) {
        result = await updateGoal(initialData.id, data);
      } else {
        result = await createGoal(data);
      }
      
      // Call the onSuccess callback with the result
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Reset the form
      reset();
    } catch (err) {
      // Show error alert
      Alert.alert(
        'Error',
        'Failed to save health goal. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Error saving health goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancellation
  const handleCancel = () => {
    reset();
    if (onCancel) {
      onCancel();
    }
  };
  
  return (
    <Box 
      backgroundColor="neutral.white"
      borderRadius="md"
      padding="lg"
      width="100%"
    >
      <Stack space="md">
        {/* Form Title */}
        <Text 
          fontSize="xl" 
          fontWeight="bold" 
          color="neutral.gray900"
        >
          {initialData?.id ? 'Edit Health Goal' : 'Create Health Goal'}
        </Text>
        
        {/* Goal Type Select */}
        <Controller
          name="type"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              label="Goal Type"
              options={goalTypeOptions}
              value={value}
              onChange={onChange}
              error={errors.type?.message}
              journey="health"
              testID="health-goal-type-select"
            />
          )}
        />
        
        {/* Target Value Input */}
        <Controller
          name="target"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Target Value"
              value={value.toString()}
              onChangeText={(text) => onChange(Number(text))}
              keyboardType="numeric"
              error={errors.target?.message}
              journey="health"
              testID="health-goal-target-input"
            />
          )}
        />
        
        {/* Start Date Picker */}
        <Controller
          name="startDate"
          control={control}
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Start Date"
              value={value}
              onChange={onChange}
              error={errors.startDate?.message}
              journey="health"
              testID="health-goal-start-date-picker"
            />
          )}
        />
        
        {/* End Date Picker */}
        <Controller
          name="endDate"
          control={control}
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="End Date"
              value={value}
              onChange={onChange}
              error={errors.endDate?.message}
              journey="health"
              testID="health-goal-end-date-picker"
            />
          )}
        />
        
        {/* Error Message */}
        {error && (
          <Text color="semantic.error" fontSize="sm">
            {error.message || 'An error occurred. Please try again.'}
          </Text>
        )}
        
        {/* Form Actions */}
        <Stack direction="row" space="md" justifyContent="flex-end">
          <Button 
            variant="secondary" 
            onPress={handleCancel}
            disabled={isSubmitting || isLoading}
            journey="health"
            testID="health-goal-cancel-button"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting || isLoading}
            loading={isSubmitting || isLoading}
            journey="health"
            testID="health-goal-submit-button"
          >
            {initialData?.id ? 'Update' : 'Create'}
          </Button>
        </Stack>
        
        {/* Loading Indicator */}
        {(isSubmitting || isLoading) && (
          <Box alignItems="center" marginTop="md">
            <ProgressBar 
              progress={50} 
              journey="health" 
              testID="health-goal-loading-indicator"
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default HealthGoalForm;