import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Import components from @austa/design-system and @design-system/primitives
import { Box } from '@design-system/primitives';
import { Button } from '@austa/design-system';

// Import shared components with updated paths
import ProfileForm from '@app/web/src/components/forms/ProfileForm';
import JourneyHeader from '@app/web/src/components/shared/JourneyHeader';
import { ConfirmationModal } from '@app/web/src/components/modals/ConfirmationModal';
import { ErrorState } from '@app/web/src/components/shared/ErrorState';
import { LoadingIndicator } from '@app/web/src/components/shared/LoadingIndicator';
import { EmptyState } from '@app/web/src/components/shared/EmptyState';
import MainLayout from '@app/web/src/layouts/MainLayout';

// Import hooks from @austa/journey-context instead of local hooks
import { useAuth, useJourney } from '@austa/journey-context';

// Import types from @austa/interfaces
import { UserProfile } from '@austa/interfaces/auth';

// Import constants with proper path aliases
import { WEB_AUTH_ROUTES } from '@app/web/shared/constants/routes';

// Import utility for retry with exponential backoff
import { retryWithExponentialBackoff } from '@app/web/src/utils/retry';

/**
 * A page component that displays and allows users to edit their profile information.
 * Uses the journey context for authentication and theming.
 * 
 * @returns The rendered profile page component
 */
const ProfilePage: React.FC = () => {
  // Use hooks from @austa/journey-context for authentication and journey state
  const { isLoading, isAuthenticated, error, session, getProfile } = useAuth();
  const { currentJourney } = useJourney();

  // Use the Next.js router for navigation
  const router = useRouter();

  // State for managing the confirmation modal visibility
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Function to handle retry with exponential backoff
  const handleRetry = useCallback(async () => {
    try {
      await retryWithExponentialBackoff(
        async () => {
          // Attempt to refresh the page data
          router.refresh();
        },
        {
          maxRetries: 3,
          initialDelayMs: 200,
          maxDelayMs: 3000,
          onRetry: (attempt) => {
            console.log(`Retrying profile data fetch, attempt ${attempt}`);
          }
        }
      );
    } catch (retryError) {
      console.error('Failed to load profile after multiple retries:', retryError);
    }
  }, [router]);

  // If the authentication status is loading, render a loading indicator
  if (isLoading) {
    return (
      <MainLayout>
        <LoadingIndicator text="Carregando perfil..." />
      </MainLayout>
    );
  }

  // If there is an error fetching user data, render an error state component
  if (error) {
    return (
      <MainLayout>
        <ErrorState 
          message="Falha ao carregar perfil." 
          onRetry={handleRetry} 
        />
      </MainLayout>
    );
  }

  // If there is no user data, render an empty state component
  if (!isAuthenticated || !session) {
    return (
      <MainLayout>
        <EmptyState 
          title="Nenhum perfil encontrado" 
          description="Por favor, faça login para visualizar seu perfil." 
          journey={currentJourney}
          actionLabel="Fazer login"
          onAction={() => router.push(WEB_AUTH_ROUTES.LOGIN)}
        />
      </MainLayout>
    );
  }

  // Handle account deletion with confirmation
  const handleDeleteAccount = useCallback(async () => {
    try {
      // TODO: Implement account deletion logic with the API
      console.log('Account deletion confirmed');
      
      // Close the modal after successful deletion
      setIsModalVisible(false);
      
      // Redirect to login page after account deletion
      router.push(WEB_AUTH_ROUTES.LOGIN);
    } catch (deleteError) {
      console.error('Error deleting account:', deleteError);
      // Handle error appropriately
    }
  }, [router]);

  // If there is user data, render the main layout with the profile form and a confirmation modal for account deletion
  return (
    <MainLayout>
      <Box padding="md">
        <JourneyHeader title="Perfil" />
        
        <Box marginY="lg">
          <ProfileForm />
        </Box>
        
        <Box marginTop="xl">
          <Button 
            variant="danger"
            onPress={() => setIsModalVisible(true)}
            journey={currentJourney}
            accessibilityLabel="Excluir conta"
          >
            Excluir Conta
          </Button>
        </Box>

        {/* Confirmation modal for account deletion */}
        <ConfirmationModal
          visible={isModalVisible}
          onConfirm={handleDeleteAccount}
          onCancel={() => setIsModalVisible(false)}
          title="Excluir Conta"
          message="Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          journey={currentJourney}
        />
      </Box>
    </MainLayout>
  );
};

export default ProfilePage;