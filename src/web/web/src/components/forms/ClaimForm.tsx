import React from 'react';
import { useForm } from 'react-hook-form'; // 7.0+
import { zodResolver } from '@hookform/resolvers/zod'; // latest
import { z } from 'zod'; // latest
import { useRouter } from 'next/router'; // 13.0+
import { useMutation } from '@apollo/client'; // 3.7.17

// Import types from @austa/interfaces/plan
import { ClaimType } from '@austa/interfaces/plan';
import { claimValidationSchema } from '@austa/interfaces/plan';

// Import journey context from @austa/journey-context
import { useJourneyContext } from '@austa/journey-context';

// Import components from @austa/design-system
import { Button, Input, Select } from '@austa/design-system';

// Import shared constants
import { MOBILE_PLAN_ROUTES } from 'src/web/shared/constants/routes';

// Import GraphQL mutations
import { SUBMIT_CLAIM } from 'src/web/shared/graphql/mutations/plan.mutations';

// Import custom hooks
import { useClaims } from 'src/web/web/src/hooks/useClaims';

/**
 * A React component that renders a form for submitting insurance claims.
 * Uses the Plan journey theme and components from the design system.
 * @returns {JSX.Element} The rendered form.
 */
export const ClaimForm: React.FC = () => {
  // Retrieves the journey context using `useJourneyContext`.
  const { currentJourney } = useJourneyContext();

  // Initializes the form using `useForm` with default values and the `claimValidationSchema` for validation.
  const { register, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm({
    defaultValues: {
      procedureType: '',
      date: '',
      provider: '',
      amount: ''
    },
    resolver: zodResolver(claimValidationSchema)
  });

  // Use the claims hook for submission functionality
  const { submitClaim, submitting, submitError } = useClaims();
  const router = useRouter();

  // Define procedure type options for the select input
  const procedureTypeOptions = [
    { label: 'Medical', value: 'medical' },
    { label: 'Dental', value: 'dental' },
    { label: 'Vision', value: 'vision' },
    { label: 'Prescription', value: 'prescription' },
    { label: 'Other', value: 'other' },
  ];

  /**
   * Handles form submission by calling the submitClaim function
   * and navigating to the claims list on success.
   * @param {object} data - The form data
   */
  const onSubmit = async (data: any) => {
    try {
      // Calls the `submitClaim` function from the `useClaims` hook to submit the claim data to the backend.
      const result = await submitClaim({
        planId: 'your_plan_id', // Replace with actual plan ID
        type: data.procedureType,
        procedureCode: 'procedure_code', // Replace with actual procedure code
        providerName: data.provider,
        serviceDate: data.date,
        amount: parseFloat(data.amount),
        documents: [] // Implement file upload later
      });

      // Displays a success or error toast message based on the result.
      if (result) {
        // Navigates to the claim confirmation screen on success.
        router.push(MOBILE_PLAN_ROUTES.CLAIMS);
        alert('Claim submitted successfully!');
      } else {
        alert('Claim submission failed.');
      }
    } catch (error) {
      console.error("Claim submission error:", error);
      alert('An error occurred while submitting the claim.');
    }
  };

  // Renders the form with input fields for procedure type, date, provider, and amount.
  // Uses design system components for input fields and button.
  // Applies form validation and submission handling using React Hook Form.
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="claim-form">
      <div className="form-field">
        <label htmlFor="procedureType">Procedure Type</label>
        <Select
          id="procedureType"
          options={procedureTypeOptions}
          {...register("procedureType")}
          error={errors.procedureType?.message}
        />
      </div>

      <div className="form-field">
        <label htmlFor="date">Date</label>
        <Input
          type="date"
          id="date"
          {...register("date")}
          error={errors.date?.message}
        />
      </div>

      <div className="form-field">
        <label htmlFor="provider">Provider</label>
        <Input
          type="text"
          id="provider"
          {...register("provider")}
          error={errors.provider?.message}
        />
      </div>

      <div className="form-field">
        <label htmlFor="amount">Amount</label>
        <Input
          type="number"
          id="amount"
          {...register("amount")}
          error={errors.amount?.message}
        />
      </div>

      {submitError && (
        <div className="error-message">
          {submitError}
        </div>
      )}

      {/* Renders a submit button that is disabled during submission or when the form is invalid. */}
      <Button 
        type="submit" 
        disabled={!isValid || isSubmitting}
        loading={isSubmitting}
        variant="primary"
        journey="plan"
      >
        Submit Claim
      </Button>
    </form>
  );
};