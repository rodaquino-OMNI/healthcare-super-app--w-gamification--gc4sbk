import React from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client';

// Import from standardized path aliases
import { ClaimType, ClaimSubmissionSchema } from '@austa/interfaces/plan';
import { useClaims } from '@app/hooks/useClaims';
import { useJourneyContext } from '@austa/journey-context';
import { MOBILE_PLAN_ROUTES } from '@app/shared/constants/routes';
import { SUBMIT_CLAIM } from '@app/shared/graphql/mutations/plan';

// Import from design system
import { FileUploader } from '@austa/design-system/components/FileUploader';
import { Button } from '@austa/design-system/components/Button';
import { Input } from '@austa/design-system/components/Input';
import { Select } from '@austa/design-system/components/Select';
import { Card } from '@austa/design-system/components/Card';
import { Stack } from '@design-system/primitives';

/**
 * Type for the form data, derived from the validation schema
 */
type ClaimFormData = {
  procedureType: ClaimType;
  date: string;
  provider: string;
  amount: number;
};

/**
 * A React component that renders a form for submitting insurance claims.
 * Uses the Plan journey context and design system components for consistent UI.
 * @returns The rendered form component.
 */
export const ClaimForm: React.FC = () => {
  // Retrieves the journey context using `useJourneyContext` from the official package
  const { currentJourney } = useJourneyContext();

  // Initializes the form using `useForm` with the schema from @austa/interfaces
  const { register, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm<ClaimFormData>({
    resolver: zodResolver(ClaimSubmissionSchema),
    defaultValues: {
      procedureType: '' as ClaimType,
      date: '',
      provider: '',
      amount: 0,
    },
  });

  // Use the claims hook for submission functionality
  const { submitClaim, submitting, submitError } = useClaims();
  const router = useRouter();

  // Procedure type options for the select dropdown
  const procedureTypeOptions = [
    { label: 'Medical', value: 'medical' },
    { label: 'Dental', value: 'dental' },
    { label: 'Vision', value: 'vision' },
    { label: 'Prescription', value: 'prescription' },
    { label: 'Other', value: 'other' },
  ];

  /**
   * Handles form submission with type-safe validation
   * @param data - The validated form data
   */
  const onSubmit = async (data: ClaimFormData) => {
    try {
      // Calls the `submitClaim` function from the `useClaims` hook to submit the claim data to the backend.
      const result = await submitClaim({
        planId: 'your_plan_id', // Replace with actual plan ID
        type: data.procedureType,
        procedureCode: 'procedure_code', // Replace with actual procedure code
        providerName: data.provider,
        serviceDate: data.date,
        amount: parseFloat(data.amount.toString()),
        documents: [], // Implement file upload later
      });

      // Navigates to the claim confirmation screen on success.
      router.push(MOBILE_PLAN_ROUTES.CLAIMS);
    } catch (error) {
      // Displays a success or error toast message based on the result.
      console.error('Claim submission failed', error);
    }
  };

  // Renders the form with input fields for procedure type, date, provider, and amount.
  return (
    <Card journey="plan" padding="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack direction="column" spacing={16}>
          <div>
            <label htmlFor="procedureType">Procedure Type</label>
            <Select
              id="procedureType"
              options={procedureTypeOptions}
              journey="plan"
              {...register('procedureType')}
              error={errors.procedureType?.message}
            />
          </div>

          <div>
            <label htmlFor="date">Service Date</label>
            <Input
              type="date"
              id="date"
              journey="plan"
              {...register('date')}
              error={errors.date?.message}
            />
          </div>

          <div>
            <label htmlFor="provider">Provider Name</label>
            <Input
              type="text"
              id="provider"
              journey="plan"
              placeholder="Enter healthcare provider name"
              {...register('provider')}
              error={errors.provider?.message}
            />
          </div>

          <div>
            <label htmlFor="amount">Amount</label>
            <Input
              type="number"
              id="amount"
              journey="plan"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />
          </div>

          <FileUploader 
            label="Upload Supporting Documents" 
            journey="plan"
            acceptedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
            maxFileSize={5 * 1024 * 1024} // 5MB
            onFileSelected={() => {}} // Will be implemented later
          />

          {submitError && (
            <div className="error-message">
              {submitError.message || 'An error occurred while submitting your claim'}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={!isValid || submitting}
            journey="plan"
            variant="primary"
            size="lg"
            fullWidth
          >
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </Stack>
      </form>
    </Card>
  );
};

/**
 * Default export for Next.js page
 */
export default ClaimForm;