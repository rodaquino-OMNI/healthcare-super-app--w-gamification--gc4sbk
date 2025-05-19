import React, { useState } from 'react'; // v18.2.0
import { useNavigation } from '@react-navigation/native'; // v6.1.9
import { StackNavigationProp } from '@react-navigation/stack'; // v6.3.20
import { yupResolver } from '@hookform/resolvers/yup'; // v3.3.4
import { useForm, Controller } from 'react-hook-form'; // v7.49.3

// Import components from centralized design system packages
import { Button } from '@austa/design-system/components/Button';
import { Input } from '@austa/design-system/components/Input';
import { Stack } from '@design-system/primitives/components/Stack';
import { Text } from '@design-system/primitives/components/Text';

// Import hooks and utilities
import { useAuth } from 'src/web/mobile/src/hooks/useAuth';
import { validateEmail } from 'src/web/mobile/src/utils/validation';
import { useToast } from '@austa/journey-context/hooks/useToast';
import { JourneyError } from '@austa/journey-context/utils/error';

// Import interfaces
import { AuthResponseError } from '@austa/interfaces/auth/responses.types';

/**
 * Interface for the forgot password form data
 */
interface ForgotPasswordFormData {
  email: string;
}

/**
 * Type definition for the navigation properties of the ForgotPasswordScreen.
 */
type ForgotPasswordScreenProp = {
  navigation: StackNavigationProp<any, 'ForgotPassword'>;
};

/**
 * A screen component that allows users to request a password reset by entering their email address.
 *
 * @param {ForgotPasswordScreenProp} props - The navigation properties passed to the screen.
 * @returns {React.ReactElement} The rendered ForgotPasswordScreen component.
 */
export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProp> = ({ navigation }) => {
  // Use the toast hook from journey-context for journey-specific styling
  const toast = useToast();
  
  // Initialize the form using React Hook Form with Yup for validation
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver({
      email: {
        required: 'Email is required',
        email: 'Please enter a valid email address'
      }
    }),
    defaultValues: {
      email: ''
    }
  });

  // Get the forgotPassword function from the authentication context
  const { forgotPassword } = useAuth();

  // Define loading state for the form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles the form submission to request a password reset
   * @param {ForgotPasswordFormData} data - The form data containing the email
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      
      // Call the forgotPassword function from the authentication context
      await forgotPassword(data.email);
      
      // Display a success toast message with journey-specific styling
      toast.show({
        type: 'success',
        message: 'A password reset link has been sent to your email address.',
        duration: 4000,
        journeyTheme: 'auth' // Apply auth journey-specific styling
      });
      
      // Navigate back to the previous screen
      navigation.goBack();
    } catch (error) {
      // Handle errors with standardized error structure
      const journeyError = error instanceof JourneyError 
        ? error 
        : new JourneyError({
            code: 'AUTH_FORGOT_PASSWORD_ERROR',
            message: error instanceof Error ? error.message : 'Failed to send password reset email.',
            severity: 'error',
            source: 'forgot-password-screen',
            originalError: error as AuthResponseError
          });
      
      // Display an error toast message with journey-specific styling
      toast.show({
        type: 'error',
        message: journeyError.message,
        duration: 4000,
        journeyTheme: 'auth' // Apply auth journey-specific styling
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing="md">
      <Text variant="body" color="neutral.800">
        Enter your email address to receive a password reset link.
      </Text>
      
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Email Address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            aria-label="Email Address"
            testID="email-input"
            type="email"
          />
        )}
      />
      
      {errors.email && (
        <Text color="error.500" variant="caption">
          {errors.email.message}
        </Text>
      )}
      
      <Button 
        onPress={handleSubmit(onSubmit)} 
        testID="submit-button"
        isLoading={isSubmitting}
        disabled={isSubmitting}
        variant="primary"
        fullWidth
      >
        Reset Password
      </Button>
    </Stack>
  );
};