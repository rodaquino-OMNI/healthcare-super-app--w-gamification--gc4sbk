import React from 'react';
import { useForm } from 'react-hook-form'; // react-hook-form 7.0+
import { yupResolver } from '@hookform/resolvers/yup'; // @hookform/resolvers 3.0+
import { gql, useMutation } from '@apollo/client'; // @apollo/client 3.7.17
import { HealthMetricType } from '@austa/interfaces/health';
import { healthMetricValidationSchema } from '@austa/interfaces/health';
import { Input } from '@austa/design-system/components/Input';
import { Select } from '@austa/design-system/components/Select';
import { Button } from '@austa/design-system/components/Button';
import { Stack } from '@austa/design-system/components/Stack';
import { Text } from '@austa/design-system/components/Text';
import { useAuth } from 'src/web/web/src/hooks/useAuth';
import { CREATE_HEALTH_METRIC } from 'src/web/shared/graphql/mutations/health.mutations';
import { GET_HEALTH_METRICS } from 'src/web/shared/graphql/queries/health.queries';

/**
 * A form component for creating and updating health metrics.
 * Uses the design system components and validation schemas from @austa/interfaces.
 */
export const HealthMetricForm: React.FC = () => {
  // Initialize the form state using React Hook Form and Yup for validation.
  const { control, register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(healthMetricValidationSchema),
    defaultValues: {
      metricType: '',
      value: '',
      unit: ''
    }
  });

  // Retrieve the current user's ID using the useAuth hook.
  const { session } = useAuth();
  const userId = session?.user?.id;

  // Define the CREATE_HEALTH_METRIC mutation using the useMutation hook.
  const [createHealthMetric, { loading }] = useMutation(gql(CREATE_HEALTH_METRIC));

  // Define the onSubmit function to handle form submission.
  const onSubmit = async (data: any) => {
    if (!userId) {
      console.error('User ID is not available.');
      return;
    }

    try {
      // Execute the CREATE_HEALTH_METRIC mutation to create a new health metric.
      await createHealthMetric({
        variables: {
          recordId: userId, // Assuming recordId is the same as userId
          createMetricDto: {
            type: data.metricType,
            value: parseFloat(data.value),
            timestamp: new Date().toISOString(),
            unit: data.unit || 'units', // Use unit from form or default
            source: 'manual',
          },
        },
        refetchQueries: [{ query: GET_HEALTH_METRICS, variables: { userId } }],
      });
      
      // Reset form after successful submission
      reset();
    } catch (error) {
      console.error('Error creating health metric:', error);
    }
  };

  // Define options for the Select component
  const healthMetricOptions = Object.values(HealthMetricType).map((type) => ({
    label: type,
    value: type,
  }));

  // Render the form with input fields for metric type, value, and timestamp.
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing="medium">
        <Stack spacing="small">
          <Select
            label="Metric Type"
            options={healthMetricOptions}
            {...register('metricType')}
            aria-label="Select metric type"
            error={errors.metricType?.message}
          />
        </Stack>

        <Stack spacing="small">
          <Input
            type="number"
            label="Metric Value"
            placeholder="Enter value"
            {...register('value')}
            aria-label="Enter metric value"
            error={errors.value?.message}
          />
        </Stack>

        <Stack spacing="small">
          <Input
            type="text"
            label="Unit"
            placeholder="e.g., kg, bpm, mmHg"
            {...register('unit')}
            aria-label="Enter unit of measurement"
            error={errors.unit?.message}
          />
        </Stack>

        <Button 
          type="submit" 
          variant="primary" 
          fullWidth
          isLoading={loading}
          disabled={loading}
        >
          Save Metric
        </Button>
      </Stack>
    </form>
  );
};