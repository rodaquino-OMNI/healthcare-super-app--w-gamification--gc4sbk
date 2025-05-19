import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@austa/journey-context';
import { Button } from '@austa/design-system/components/Button';
import { Input } from '@austa/design-system/components/Input';
import { FormField } from '@austa/design-system/components/Input';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { registerSchema } from '@austa/interfaces/auth';
import AuthLayout from '@/layouts/AuthLayout';
import { WEB_AUTH_ROUTES } from '@/shared/constants/routes';

// Define the form values interface using the Zod schema
type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * Register component - Renders the registration page with form for new users
 */
const Register: React.FC = () => {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form with validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setSubmitError(null);
      // Only send name, email, and password to the API
      const { name, email, password } = data;
      await registerUser({ name, email, password });
      router.push(WEB_AUTH_ROUTES.LOGIN);
    } catch (error: any) {
      setSubmitError(
        error.response?.data?.message || 'Erro ao criar conta. Tente novamente.'
      );
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Text as="h2" fontSize="xl" fontWeight="bold" marginBottom="lg" textAlign="center">
          Criar Nova Conta
        </Text>

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <FormField label="Nome" error={errors.name?.message}>
              <Input
                value={field.value}
                onChange={field.onChange}
                placeholder="Seu nome completo"
                aria-label="Nome completo"
              />
            </FormField>
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <FormField label="E-mail" error={errors.email?.message}>
              <Input
                value={field.value}
                onChange={field.onChange}
                type="email"
                placeholder="seu@email.com"
                aria-label="E-mail"
              />
            </FormField>
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <FormField label="Senha" error={errors.password?.message}>
              <Input
                value={field.value}
                onChange={field.onChange}
                type="password"
                placeholder="Senha"
                aria-label="Senha"
              />
            </FormField>
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <FormField label="Confirme sua senha" error={errors.confirmPassword?.message}>
              <Input
                value={field.value}
                onChange={field.onChange}
                type="password"
                placeholder="Confirme sua senha"
                aria-label="Confirme sua senha"
              />
            </FormField>
          )}
        />

        {submitError && (
          <Box marginY="md" padding="sm" backgroundColor="semantic.error" borderRadius="md">
            <Text color="neutral.white">{submitError}</Text>
          </Box>
        )}

        <Box marginTop="lg">
          <Button
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            journey="health"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Criar Conta
          </Button>
        </Box>

        <Box display="flex" justifyContent="center" marginTop="lg">
          <Text fontSize="sm">
            Já tem uma conta?{' '}
            <Link href={WEB_AUTH_ROUTES.LOGIN}>
              <Text as="span" color="brand.primary" fontWeight="medium">
                Faça login
              </Text>
            </Link>
          </Text>
        </Box>
      </form>
    </AuthLayout>
  );
};

export default Register;