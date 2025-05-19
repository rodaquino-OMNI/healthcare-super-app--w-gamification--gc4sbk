import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

// Import from @austa/interfaces for type definitions
import { RegisterRequest } from '@austa/interfaces/auth/requests.types';
import { ErrorCode } from '@austa/interfaces/common/error';

// Import from @design-system/primitives for basic UI elements
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { Stack } from '@design-system/primitives/components/Stack';
import { Touchable } from '@design-system/primitives/components/Touchable';

// Import from @austa/design-system for UI components
import { Button } from '@austa/design-system/components/Button';
import { Input } from '@austa/design-system/components/Input';
import { Checkbox } from '@austa/design-system/components/Checkbox';

// Import API and validation utilities
import { register } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { useUserValidationSchema } from 'src/web/shared/utils/validation';

/**
 * A React component that renders the registration screen.
 * Allows users to create a new account with name, email, and password.
 * 
 * @returns {JSX.Element} The rendered registration screen.
 */
export const RegisterScreen: React.FC = () => {
  // Access navigation functions
  const navigation = useNavigation();

  // Access authentication functions
  const { signIn } = useAuth();

  // Access translation function
  const { t } = useTranslation();

  // Get localized validation schema
  const validationSchema = useUserValidationSchema();

  // State for error handling
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize form state using `useForm` and `zodResolver` for validation.
  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid, isSubmitting },
    reset
  } = useForm<RegisterRequest>({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  // Define a submit handler that calls the `register` API function.
  const onSubmit = useCallback(async (data: RegisterRequest) => {
    try {
      // Clear any previous errors
      setApiError(null);
      
      // Call the `register` API function with the form data.
      const session = await register(data);

      // Reset the form after successful registration
      reset();

      // Navigate to the login screen upon successful registration.
      navigation.navigate('Login', { 
        email: data.email,
        registrationSuccess: true 
      });
    } catch (error: any) {
      // Handle registration errors with standardized error handling
      console.error('Registration failed', error);
      
      // Display appropriate error message based on error code
      if (error.code === ErrorCode.VALIDATION_ERROR) {
        setApiError(t('register.errors.validation'));
      } else if (error.code === ErrorCode.DUPLICATE_EMAIL) {
        setApiError(t('register.errors.emailExists'));
      } else if (error.code === ErrorCode.NETWORK_ERROR) {
        setApiError(t('register.errors.network'));
      } else {
        setApiError(t('register.errors.generic'));
      }
    }
  }, [navigation, reset, t]);

  // Render the registration form with input fields for name, email, password, and confirm password.
  return (
    <Box flex={1} padding="lg" backgroundColor="background">
      <Stack spacing="lg" alignItems="center">
        <Text variant="heading" marginBottom="md">
          {t('register.title')}
        </Text>

        {apiError && (
          <Box 
            backgroundColor="error.light" 
            padding="md" 
            borderRadius="sm" 
            width="100%"
            marginBottom="md"
          >
            <Text color="error.dark">{apiError}</Text>
          </Box>
        )}

        <Box width="100%" marginBottom="md">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('register.name')}
                placeholder={t('register.namePlaceholder')}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.name?.message}
                accessibilityLabel={t('register.name')}
                testID="register-name-input"
              />
            )}
          />
        </Box>

        <Box width="100%" marginBottom="md">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('register.email')}
                placeholder={t('register.emailPlaceholder')}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel={t('register.email')}
                testID="register-email-input"
              />
            )}
          />
        </Box>

        <Box width="100%" marginBottom="md">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('register.password')}
                placeholder={t('register.passwordPlaceholder')}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
                secureTextEntry
                accessibilityLabel={t('register.password')}
                testID="register-password-input"
              />
            )}
          />
        </Box>

        <Box width="100%" marginBottom="md">
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('register.confirmPassword')}
                placeholder={t('register.confirmPasswordPlaceholder')}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
                secureTextEntry
                accessibilityLabel={t('register.confirmPassword')}
                testID="register-confirm-password-input"
              />
            )}
          />
        </Box>

        <Box width="100%" marginBottom="md">
          <Checkbox
            id="terms"
            name="terms"
            value="terms"
            checked={termsAccepted}
            onChange={() => setTermsAccepted(!termsAccepted)}
            label={t('register.terms')}
            testID="register-terms-checkbox"
          />
        </Box>

        <Box width="100%" marginTop="md">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting || !termsAccepted}
            loading={isSubmitting}
            fullWidth
            testID="register-submit-button"
          >
            {t('register.submit')}
          </Button>
        </Box>

        <Box marginTop="lg" alignItems="center">
          <Touchable 
            onPress={() => navigation.navigate('Login')} 
            testID="register-login-link"
          >
            <Text color="primary">{t('register.alreadyHaveAccount')}</Text>
          </Touchable>
        </Box>
      </Stack>
    </Box>
  );
};