import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Updated from next/router to next/navigation
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Updated imports using standardized path aliases
import { WEB_AUTH_ROUTES } from '@app/shared/constants/routes';
import { useAuth } from '@austa/journey-context/hooks'; // Updated to use the new journey-context package
import { Button } from '@austa/design-system/components/Button'; // Updated to use design system components
import { Input } from '@austa/design-system/components/Input'; // Updated to use design system components
import { JourneyHeader } from '@app/components/shared/JourneyHeader';
import { Box } from '@design-system/primitives/components/Box'; // Using primitives for layout
import { Stack } from '@design-system/primitives/components/Stack'; // Using primitives for layout

// Import interfaces from @austa/interfaces
import { UserProfile } from '@austa/interfaces/auth/user.types';
import { InputProps } from '@austa/interfaces/components/core.types';
import { ButtonProps } from '@austa/interfaces/components/core.types';

// Define validation schema using Zod
const profileSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  phone: z.string().min(10, { message: 'Telefone inválido' }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Renders the user profile settings page.
 * @returns The rendered settings page.
 */
const Settings: React.FC = () => {
  // Use the updated router from next/navigation
  const router = useRouter();

  // Use the auth hook from journey-context
  const { logout, session, user, updateProfile } = useAuth();

  // Setup form with React Hook Form and Zod validation
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Load user profile data when component mounts
  useEffect(() => {
    if (session?.accessToken && user) {
      // Set form values from user profile
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [session, user, reset]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Call the updateProfile function from useAuth hook
      await updateProfile(data);
      // Show success message or notification here
    } catch (error) {
      // Handle error
      console.error('Failed to update profile:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push(WEB_AUTH_ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Box padding="md">
      <JourneyHeader title="Configurações" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing="md" direction="column">
          {/* Name input field */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                label="Nome"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSubmitting}
                aria-label="Nome"
                error={errors.name?.message}
                aria-invalid={!!errors.name}
              />
            )}
          />

          {/* Email input field */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                label="Email"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSubmitting}
                aria-label="Email"
                error={errors.email?.message}
                aria-invalid={!!errors.email}
              />
            )}
          />

          {/* Phone input field */}
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                label="Telefone"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSubmitting}
                aria-label="Telefone"
                error={errors.phone?.message}
                aria-invalid={!!errors.phone}
              />
            )}
          />

          {/* Save button */}
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            loading={isSubmitting}
            variant="primary"
          >
            Salvar
          </Button>

          {/* Change password button */}
          <Button 
            onPress={() => router.push('/profile/change-password')} 
            disabled={isSubmitting}
            variant="secondary"
          >
            Alterar Senha
          </Button>

          {/* Manage notifications button */}
          <Button 
            onPress={() => router.push('/profile/notifications')} 
            disabled={isSubmitting}
            variant="secondary"
          >
            Gerenciar Notificações
          </Button>

          {/* Logout button */}
          <Button
            onPress={handleLogout}
            disabled={isSubmitting}
            variant="tertiary"
          >
            Sair
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

// Export the Settings component
export default Settings;