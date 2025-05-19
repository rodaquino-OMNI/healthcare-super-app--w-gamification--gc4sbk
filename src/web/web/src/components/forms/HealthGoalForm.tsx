import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

// Import components from design system barrel exports
import { Input, Button, Select, DatePicker } from '@austa/design-system';

// Import type definitions from interfaces package
import { HealthGoal, healthGoalValidationSchema } from '@austa/interfaces/health';

// Import hooks from web hooks (not mobile hooks)
import { useAuth } from 'src/web/web/src/hooks/useAuth';
import { useHealthMetrics } from 'src/web/web/src/hooks/useHealthMetrics';

/**
 * Interface for the properties of the HealthGoalForm component.
 * Currently, it does not require any specific props.
 */
interface HealthGoalFormProps {}

/**
 * Defines the structure of the form values for the HealthGoalForm.
 * Includes fields for goal type, target value, start date, and end date.
 */
interface HealthGoalFormValues {
  type: string;
  target: number;
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * A form component for creating and updating health goals.
 * It allows users to set targets for various health metrics and integrates with the design system for a consistent UI.
 * @returns {JSX.Element} Rendered HealthGoalForm component
 */
export const HealthGoalForm: React.FC<HealthGoalFormProps> = () => {
  // 1. Uses the useForm hook to manage the form state and submission.
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch,
    formState: { errors, isSubmitting, isValid } 
  } = useForm<HealthGoalFormValues>({
    // 2. Uses the validation schema imported from @austa/interfaces/health
    resolver: yupResolver(healthGoalValidationSchema),
    defaultValues: {
      type: '',
      target: 0,
      startDate: null,
      endDate: null,
    },
  });

  // 3. Fetches the user ID using the useAuth hook from web hooks.
  const { session } = useAuth();
  const userId = session?.user.id;

  // Watch form values for controlled components
  const formValues = watch();

  // Define options for the goal type select component
  const goalTypeOptions = [
    { label: 'Weight Loss', value: 'weightLoss' },
    { label: 'Increase Steps', value: 'increaseSteps' },
    { label: 'Improve Sleep', value: 'improveSleep' },
  ];

  // Handle form field changes
  const handleTypeChange = (value: string) => {
    setValue('type', value, { shouldValidate: true });
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setValue('target', isNaN(value) ? 0 : value, { shouldValidate: true });
  };

  const handleStartDateChange = (date: Date | null) => {
    setValue('startDate', date, { shouldValidate: true });
  };

  const handleEndDateChange = (date: Date | null) => {
    setValue('endDate', date, { shouldValidate: true });
  };

  // 4. Renders a form with input fields for goal type, target, start date, and end date.
  return (
    <form onSubmit={handleSubmit((data) => {
      // 8. Handles form submission and API calls to create or update the health goal.
      console.log('Form data:', data);
      // TODO: Implement API call to create/update health goal
    })}>
      {/* 5. Uses the Select component for the goal type field. */}
      <div>
        <label htmlFor="type">Goal Type:</label>
        <Select
          id="type"
          options={goalTypeOptions}
          value={formValues.type}
          onChange={handleTypeChange}
          error={errors.type?.message}
          aria-invalid={!!errors.type}
          aria-describedby={errors.type ? 'type-error' : undefined}
        />
        {errors.type && <p id="type-error" className="error-message">{errors.type.message}</p>}
      </div>

      {/* 6. Uses the DatePicker component for the start and end date fields. */}
      <div>
        <label htmlFor="startDate">Start Date:</label>
        <DatePicker
          id="startDate"
          value={formValues.startDate}
          onChange={handleStartDateChange}
          error={errors.startDate?.message}
          aria-invalid={!!errors.startDate}
          aria-describedby={errors.startDate ? 'startDate-error' : undefined}
        />
        {errors.startDate && <p id="startDate-error" className="error-message">{errors.startDate.message}</p>}
      </div>

      <div>
        <label htmlFor="endDate">End Date:</label>
        <DatePicker
          id="endDate"
          value={formValues.endDate}
          onChange={handleEndDateChange}
          error={errors.endDate?.message}
          aria-invalid={!!errors.endDate}
          aria-describedby={errors.endDate ? 'endDate-error' : undefined}
          minDate={formValues.startDate || undefined}
        />
        {errors.endDate && <p id="endDate-error" className="error-message">{errors.endDate.message}</p>}
      </div>

      {/* 7. Uses the Input component for the target field. */}
      <div>
        <label htmlFor="target">Target Value:</label>
        <Input
          id="target"
          type="number"
          placeholder="Enter target value"
          value={formValues.target.toString()}
          onChange={handleTargetChange}
          error={errors.target?.message}
          aria-invalid={!!errors.target}
          aria-describedby={errors.target ? 'target-error' : undefined}
        />
        {errors.target && <p id="target-error" className="error-message">{errors.target.message}</p>}
      </div>

      {/* 8. Renders a submit button to create or update the health goal. */}
      <Button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Create Goal'}
      </Button>
    </form>
  );
};