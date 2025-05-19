import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Updated imports from @austa packages
import { Input, Button } from '@austa/design-system';
import { profileUpdateSchema } from '@austa/interfaces/auth';
import { isValidCPF } from 'src/web/shared/utils/validation';
import { useAuth } from 'src/web/web/src/hooks/useAuth';
import { useAuthContext } from '@austa/journey-context';

// Interface for form data using the imported schema
type ProfileFormData = z.infer<typeof profileUpdateSchema>;

export const ProfileForm: React.FC = () => {
  const { getProfile } = useAuth();
  const { currentJourney } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form with React Hook Form
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: ''
    }
  });

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getProfile();
        
        // Reset form with profile data
        reset({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          cpf: profileData.cpf || ''
        });
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
        setError('Failed to load profile data');
      }
    };

    fetchProfile();
  }, [getProfile, reset]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // In a real implementation, this would call an API to update the profile
      // For now, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Profile data to update:', data);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use the current journey for theming or default to health
  const journeyTheme = currentJourney || 'health';

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="name">Name</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              id="name"
              {...field}
              placeholder="Your name"
              aria-label="Name"
              journey={journeyTheme}
              error={errors.name?.message}
            />
          )}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="email">Email</label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              id="email"
              {...field}
              placeholder="Your email"
              aria-label="Email"
              type="email"
              journey={journeyTheme}
              error={errors.email?.message}
            />
          )}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="phone">Phone Number</label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Input
              id="phone"
              {...field}
              placeholder="Your phone number"
              aria-label="Phone Number"
              journey={journeyTheme}
              error={errors.phone?.message}
            />
          )}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="cpf">CPF</label>
        <Controller
          name="cpf"
          control={control}
          render={({ field }) => (
            <Input
              id="cpf"
              {...field}
              placeholder="Your CPF"
              aria-label="CPF"
              journey={journeyTheme}
              error={errors.cpf?.message}
            />
          )}
        />
      </div>
      
      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '16px' }}>Profile updated successfully!</div>}
      
      <Button
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
        loading={loading}
        journey={journeyTheme}
      >
        Update Profile
      </Button>
    </form>
  );
};

export default ProfileForm;