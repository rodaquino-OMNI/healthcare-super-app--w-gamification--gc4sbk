import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, FormField, Text } from '@austa/design-system';
import { Box, Stack } from '@design-system/primitives';
import { useAuth } from '@austa/journey-context';
import { userProfileSchema, UserProfile } from '@austa/interfaces/auth';

/**
 * A form component for editing user profile information.
 * Allows users to update their name and email across all journeys.
 */
export const ProfileForm: React.FC = () => {
  const { session, user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Create a validation schema for profile updates (just name and email)
  const profileSchema = userProfileSchema.pick({ name: true, email: true });
  
  // Initialize form with React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm<UserProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    }
  });

  // Handle form submission
  const onSubmit = async (data: UserProfile) => {
    setIsSubmitting(true);
    setUpdateSuccess(false);
    setUpdateError(null);

    try {
      await updateProfile(data);
      setUpdateSuccess(true);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !session) {
    return (
      <Box padding="md" backgroundColor="neutral.gray100" borderRadius="md">
        <Text color="neutral.gray700">You must be logged in to edit your profile</Text>
      </Box>
    );
  }

  return (
    <Box padding="md" backgroundColor="neutral.white" borderRadius="md">
      <Stack direction="column" spacing="md">
        <Text variant="heading" color="neutral.gray900">Edit Profile</Text>
        
        {updateSuccess && (
          <Box padding="sm" backgroundColor="semantic.success.light" borderRadius="sm">
            <Text color="semantic.success.dark">Profile updated successfully</Text>
          </Box>
        )}
        
        {updateError && (
          <Box padding="sm" backgroundColor="semantic.error.light" borderRadius="sm">
            <Text color="semantic.error.dark">{updateError}</Text>
          </Box>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack direction="column" spacing="md">
            <FormField
              label="Name"
              error={errors.name?.message}
            >
              <Input
                {...register('name')}
                placeholder="Your name"
                disabled={isSubmitting}
                aria-label="Name"
              />
            </FormField>
            
            <FormField
              label="Email"
              error={errors.email?.message}
            >
              <Input
                {...register('email')}
                type="email"
                placeholder="Your email"
                disabled={isSubmitting}
                aria-label="Email"
              />
            </FormField>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              variant="primary"
              journey={user.journey || 'health'}
            >
              Update Profile
            </Button>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
};

