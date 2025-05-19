import React, { useState } from 'react'; // v18.2.0
import { useForm } from 'react-hook-form'; // ^7.0.0
import { zodResolver } from '@hookform/resolvers/zod'; // ^3.0.0

// Import from @austa/interfaces/health instead of local types
import { 
  HealthMetricType, 
  CreateHealthMetricInput,
  CreateHealthMetricSchema 
} from '@austa/interfaces/health';

// Import from @austa/journey-context instead of local context
import { useJourney } from '@austa/journey-context';

// Import API functions from health.ts
import { createHealthMetric, useHealthMetrics } from '../../api/health';

// Import from @austa/design-system instead of local design-system
import { Input } from '@austa/design-system/components/Input';
import { Button } from '@austa/design-system/components/Button';
import { Select } from '@austa/design-system/components/Select';

// Import primitives from @design-system/primitives
import { Box } from '@design-system/primitives/components/Box';
import { Stack } from '@design-system/primitives/components/Stack';
import { Text } from '@design-system/primitives/components/Text';

/**
 * Component for adding a new health metric in the Health journey.
 * Uses Zod validation schema from @austa/interfaces/health.
 * Implements journey-specific theming from @austa/journey-context.
 * 
 * @returns {JSX.Element} The rendered form component.
 */
export const HealthMetricForm: React.FC = () => {
  // Access the current journey context for theming
  const { journey } = useJourney();
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  // Initialize the form using React Hook Form with the Zod resolver
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setValue,
    watch
  } = useForm<CreateHealthMetricInput>({
    resolver: zodResolver(CreateHealthMetricSchema),
    defaultValues: {
      value: undefined,
      unit: '',
      timestamp: new Date().toISOString(),
      type: undefined,
      userId: 'current-user-id' // This would typically come from auth context
    }
  });

  // Access the useHealthMetrics hook to refetch data after submission
  const { refetch } = useHealthMetrics(
    'current-user-id', // This would typically come from auth context
    Object.values(HealthMetricType)
  );

  // Define the options for the metric type select component
  const metricTypeOptions = Object.values(HealthMetricType).map((type) => ({
    label: type,
    value: type,
  }));

  // Watch the selected type to show appropriate unit suggestions
  const selectedType = watch('type');

  // Get suggested unit based on selected type
  const getSuggestedUnit = (type: HealthMetricType | undefined): string => {
    if (!type) return '';
    
    switch (type) {
      case HealthMetricType.WEIGHT:
        return 'kg';
      case HealthMetricType.HEIGHT:
        return 'cm';
      case HealthMetricType.BLOOD_PRESSURE:
        return 'mmHg';
      case HealthMetricType.HEART_RATE:
        return 'bpm';
      case HealthMetricType.BLOOD_GLUCOSE:
        return 'mg/dL';
      case HealthMetricType.TEMPERATURE:
        return '°C';
      case HealthMetricType.OXYGEN_SATURATION:
        return '%';
      case HealthMetricType.STEPS:
        return 'steps';
      default:
        return '';
    }
  };

  // Handle form submission to create a new health metric
  const onSubmit = async (data: CreateHealthMetricInput) => {
    // Reset submission states
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    try {
      // Create a new health metric using the createHealthMetric API function
      await createHealthMetric('health-record-id', data); // Replace with actual record ID

      // Refetch health metrics to update the UI
      await refetch();

      // Set success state
      setSubmitSuccess(true);

      // Reset the form
      reset();
    } catch (error) {
      // Set error state
      setSubmitError(error instanceof Error ? error : new Error('Failed to create health metric'));
      console.error('Error creating health metric:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle metric type selection and update unit suggestion
  const handleTypeChange = (value: string) => {
    const type = value as HealthMetricType;
    setValue('type', type);
    
    // Set suggested unit based on type
    const suggestedUnit = getSuggestedUnit(type);
    if (suggestedUnit) {
      setValue('unit', suggestedUnit);
    }
  };

  return (
    <Box 
      backgroundColor="background"
      borderRadius="md"
      padding="lg"
      boxShadow="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack direction="column" spacing="md">
          {/* Form title */}
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color={`${journey}.primary`}
          >
            Add Health Metric
          </Text>
          
          {/* Select component for choosing the metric type */}
          <Box>
            <Select
              label="Metric Type"
              options={metricTypeOptions}
              value={watch('type') || ''}
              onChange={handleTypeChange}
              error={errors.type?.message}
              required
            />
          </Box>

          {/* Input field for metric value */}
          <Box>
            <Input
              label="Value"
              placeholder="Enter value"
              type="number"
              error={errors.value?.message}
              {...register('value', { valueAsNumber: true })}
              required
            />
          </Box>

          {/* Input field for metric unit */}
          <Box>
            <Input
              label="Unit"
              placeholder="Enter unit"
              type="text"
              error={errors.unit?.message}
              {...register('unit')}
              required
            />
          </Box>

          {/* Input field for metric timestamp */}
          <Box>
            <Input
              label="Timestamp"
              placeholder="Enter timestamp"
              type="datetime-local"
              error={errors.timestamp?.message}
              {...register('timestamp')}
              required
            />
          </Box>

          {/* Success message */}
          {submitSuccess && (
            <Box 
              backgroundColor="success.light" 
              padding="md" 
              borderRadius="sm"
            >
              <Text color="success.dark">Health metric added successfully!</Text>
            </Box>
          )}

          {/* Error message */}
          {submitError && (
            <Box 
              backgroundColor="error.light" 
              padding="md" 
              borderRadius="sm"
            >
              <Text color="error.dark">{submitError.message}</Text>
            </Box>
          )}

          {/* Button component to submit the form */}
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isSubmitting}
            disabled={isSubmitting}
            journey={journey}
            fullWidth
          >
            Add Metric
          </Button>
        </Stack>
      </form>
    </Box>
  );
};