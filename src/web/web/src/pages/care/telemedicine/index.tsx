import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Import from @austa packages with standardized path aliases
import { useJourney } from '@austa/journey-context';
import { useAuth } from '@austa/journey-context/src/hooks/useAuth';
import { useIntl } from '@austa/journey-context/src/hooks/useIntl';
import { Provider, TelemedicineSession } from '@austa/interfaces/care';
import { ApiResponse } from '@austa/interfaces/api/response.types';
import { ErrorCode } from '@austa/interfaces/api/error.types';

// Import design system components
import {
  Box,
  Stack,
  Text,
  Card,
  Button,
  LoadingIndicator,
  Icon
} from '@austa/design-system';
import { ProviderCard } from '@austa/design-system/src/care/ProviderCard';

// Import layout and components
import CareLayout from '../../../layouts/CareLayout';
import { JourneyHeader } from '../../../components/navigation/JourneyHeader';

// Import API utilities
import { getProviders } from '../../../api/care';
import { formatDate, formatTime } from '../../../utils/date';

/**
 * TelemedicinePage component serves as the main entry point for the telemedicine section
 * within the Care journey. It allows users to browse available providers for telemedicine
 * consultations and book appointments.
 */
const TelemedicinePage: React.FC = () => {
  const router = useRouter();
  const { journey } = useJourney();
  const { session, status } = useAuth();
  const { formatMessage } = useIntl();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  // Fetch telemedicine providers when the component mounts
  useEffect(() => {
    // Only fetch if user is authenticated
    if (status === 'authenticated' && session?.user) {
      fetchTelemedicineProviders();
    } else if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      router.push('/auth/login?returnUrl=/care/telemedicine');
    }
  }, [status, session]);
  
  /**
   * Fetches providers that offer telemedicine services
   */
  const fetchTelemedicineProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Provider[]> = await getProviders({
        supportsTelemedicine: true,
        availability: 'next7days',
        specialties: [],
        location: null,
        insuranceId: session?.user?.insuranceId
      });
      
      if (response.success && response.data) {
        setProviders(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch providers');
      }
    } catch (err) {
      console.error('Error fetching telemedicine providers:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handles booking a telemedicine appointment with a provider
   */
  const handleBookAppointment = (providerId: string) => {
    router.push({
      pathname: '/care/appointments/book',
      query: { 
        providerId,
        type: 'telemedicine'
      }
    });
  };
  
  /**
   * Renders the page content based on loading and error states
   */
  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <LoadingIndicator size="large" journey="care" />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Card journey="care" elevation="md">
          <Stack spacing="md" padding="lg">
            <Box display="flex" alignItems="center">
              <Icon name="error" size="24px" color="semantic.error" marginRight="sm" />
              <Text variant="heading" color="semantic.error">
                {formatMessage('error.title', 'Ocorreu um erro')}
              </Text>
            </Box>
            <Text>
              {formatMessage(
                'telemedicine.error.providers',
                'Não foi possível carregar os médicos disponíveis para teleconsulta. Por favor, tente novamente mais tarde.'
              )}
            </Text>
            <Button 
              journey="care" 
              variant="secondary" 
              onClick={fetchTelemedicineProviders}
            >
              {formatMessage('common.tryAgain', 'Tentar novamente')}
            </Button>
          </Stack>
        </Card>
      );
    }
    
    if (providers.length === 0) {
      return (
        <Card journey="care" elevation="md">
          <Stack spacing="md" padding="lg">
            <Box display="flex" alignItems="center">
              <Icon name="info" size="24px" color="semantic.info" marginRight="sm" />
              <Text variant="heading">
                {formatMessage('telemedicine.noProviders.title', 'Nenhum médico disponível')}
              </Text>
            </Box>
            <Text>
              {formatMessage(
                'telemedicine.noProviders.message',
                'No momento não há médicos disponíveis para teleconsulta. Por favor, tente novamente mais tarde.'
              )}
            </Text>
            <Button 
              journey="care" 
              variant="secondary" 
              onClick={fetchTelemedicineProviders}
            >
              {formatMessage('common.refresh', 'Atualizar')}
            </Button>
          </Stack>
        </Card>
      );
    }
    
    return (
      <Stack spacing="lg">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onPress={() => handleBookAppointment(provider.id)}
          />
        ))}
      </Stack>
    );
  };
  
  return (
    <CareLayout>
      <Head>
        <title>{formatMessage('telemedicine.page.title', 'Teleconsulta | Cuidar-me Agora')}</title>
        <meta 
          name="description" 
          content={formatMessage(
            'telemedicine.page.description',
            'Agende uma teleconsulta com médicos disponíveis e receba atendimento sem sair de casa.'
          )} 
        />
      </Head>
      
      <Box padding="lg">
        <Stack spacing="lg">
          <JourneyHeader 
            title={formatMessage('telemedicine.title', 'Teleconsulta')} 
            journey="care"
          />
          
          <Card journey="care" elevation="md">
            <Stack spacing="md" padding="lg">
              <Text variant="heading">
                {formatMessage('telemedicine.intro.title', 'Consultas médicas online')}
              </Text>
              <Text>
                {formatMessage(
                  'telemedicine.intro.description',
                  'Agende uma consulta com um médico especialista sem sair de casa. Nossas teleconsultas são realizadas por vídeo, de forma segura e confidencial.'
                )}
              </Text>
              <Box 
                padding="md" 
                borderRadius="md" 
                backgroundColor="neutral.gray100"
              >
                <Stack spacing="sm">
                  <Box display="flex" alignItems="center">
                    <Icon name="check" color="semantic.success" size="20px" marginRight="xs" />
                    <Text>
                      {formatMessage(
                        'telemedicine.benefits.convenience',
                        'Atendimento no conforto da sua casa'
                      )}
                    </Text>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Icon name="check" color="semantic.success" size="20px" marginRight="xs" />
                    <Text>
                      {formatMessage(
                        'telemedicine.benefits.quick',
                        'Consultas disponíveis em até 24 horas'
                      )}
                    </Text>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Icon name="check" color="semantic.success" size="20px" marginRight="xs" />
                    <Text>
                      {formatMessage(
                        'telemedicine.benefits.secure',
                        'Plataforma segura e confidencial'
                      )}
                    </Text>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Card>
          
          <Text variant="subtitle">
            {formatMessage('telemedicine.availableProviders', 'Médicos disponíveis para teleconsulta')}
          </Text>
          
          {renderContent()}
        </Stack>
      </Box>
    </CareLayout>
  );
};

export default TelemedicinePage;