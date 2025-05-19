import React from 'react';
import { useNavigation } from '@react-navigation/native';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

// Import from @austa/journey-context instead of local hooks
import { useAuth } from '@austa/journey-context';

// Import from shared constants
import { MOBILE_AUTH_ROUTES } from '@austa/shared/constants/routes';

// Import from @austa/design-system and @design-system/primitives
import { Input } from '@austa/design-system/components/Input';
import { Button } from '@austa/design-system/components/Button';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';

// Import types from @austa/interfaces
import { AuthCredentials } from '@austa/interfaces/auth';

/**
 * LoginScreen provides the user interface for the login screen, allowing users
 * to authenticate with their email and password.
 * 
 * It handles form input, validation, and API calls to the authentication service
 * as required by the Authentication System (F-201) specification.
 */
const LoginScreen = () => {
  // Get navigation and auth hooks
  const navigation = useNavigation();
  const { signIn } = useAuth();
  
  // Form validation schema using yup
  const validationSchema = yup.object({
    email: yup
      .string()
      .email('Please enter a valid email')
      .required('Email is required'),
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
  });
  
  // Initialize form handling with React Hook Form
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AuthCredentials>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: yupResolver(validationSchema),
  });
  
  // Handle form submission
  const onSubmit = async (data: AuthCredentials) => {
    try {
      // Attempt to sign in with provided credentials
      await signIn(data.email, data.password);
      // Navigation after successful login is handled by the auth context
    } catch (error) {
      // Handle login error with structured error handling
      if (error instanceof Error) {
        // Set specific error message based on error type
        if (error.message.includes('credentials')) {
          setError('email', { 
            type: 'manual', 
            message: 'Invalid email or password' 
          });
        } else if (error.message.includes('network')) {
          setError('root', { 
            type: 'manual', 
            message: 'Network error. Please check your connection.' 
          });
        } else {
          setError('root', { 
            type: 'manual', 
            message: 'An unexpected error occurred. Please try again.' 
          });
        }
      } else {
        // Generic error handling
        setError('root', { 
          type: 'manual', 
          message: 'Authentication failed. Please try again.' 
        });
      }
    }
  };
  
  return (
    <Box padding="lg" backgroundColor="neutral.white" flex={1} justifyContent="center">
      {/* Header section */}
      <Box marginBottom="xl" alignItems="center">
        <Text fontSize="3xl" fontWeight="bold">
          AUSTA
        </Text>
        <Text fontSize="lg" marginTop="md">
          Log in to your account
        </Text>
      </Box>
      
      {/* Display root errors if any */}
      {errors.root && (
        <Box 
          marginBottom="md" 
          padding="sm" 
          backgroundColor="semantic.errorLight" 
          borderRadius="md"
        >
          <Text color="semantic.error" fontSize="sm">
            {errors.root.message}
          </Text>
        </Box>
      )}
      
      {/* Email input field */}
      <Box marginBottom="md">
        <Text fontWeight="medium" marginBottom="xs">
          Email
        </Text>
        <Input
          control={control}
          name="email"
          placeholder="Enter your email"
          aria-label="Email"
          type="email"
          error={errors.email?.message}
        />
        {errors.email && (
          <Text color="semantic.error" fontSize="sm" marginTop="xs">
            {errors.email.message}
          </Text>
        )}
      </Box>
      
      {/* Password input field */}
      <Box marginBottom="lg">
        <Text fontWeight="medium" marginBottom="xs">
          Password
        </Text>
        <Input
          control={control}
          name="password"
          placeholder="Enter your password"
          aria-label="Password"
          type="password"
          error={errors.password?.message}
        />
        {errors.password && (
          <Text color="semantic.error" fontSize="sm" marginTop="xs">
            {errors.password.message}
          </Text>
        )}
      </Box>
      
      {/* Login button */}
      <Box marginBottom="lg">
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          loading={isSubmitting}
          journey="health"
        >
          Log In
        </Button>
      </Box>
      
      {/* Forgot password link */}
      <Box alignItems="center" marginBottom="md">
        <Button
          onPress={() => navigation.navigate(MOBILE_AUTH_ROUTES.FORGOT_PASSWORD)}
          variant="tertiary"
          journey="health"
        >
          Forgot Password?
        </Button>
      </Box>
      
      {/* Register account link */}
      <Box flexDirection="row" justifyContent="center" alignItems="center">
        <Text marginRight="sm">
          Don't have an account?
        </Text>
        <Button
          onPress={() => navigation.navigate(MOBILE_AUTH_ROUTES.REGISTER)}
          variant="tertiary"
          journey="health"
        >
          Register
        </Button>
      </Box>
    </Box>
  );
};

export default LoginScreen;