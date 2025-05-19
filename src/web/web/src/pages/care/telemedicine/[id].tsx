import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Import from @austa packages with standardized path aliases
import { TelemedicineSession, AppointmentStatus } from '@austa/interfaces/care';
import { useJourney } from '@austa/journey-context';
import { useAuth } from '@austa/journey-context/auth';
import { Button, Card, Text, Box, Stack, Icon, LoadingIndicator } from '@austa/design-system';
import { VideoConsultation } from '@austa/design-system/care';

// Import layout and API utilities
import CareLayout from '../../../layouts/CareLayout';
import { formatDate, formatTime } from '../../../utils/date';
import { fetchTelemedicineSession } from '../../../api/care';

/**
 * TelemedicineDetailPage component displays details of a specific telemedicine session
 * and allows the user to join the video consultation.
 */
const TelemedicineDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { journey } = useJourney();
  const { session } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [telemedicineSession, setTelemedicineSession] = useState<TelemedicineSession | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  
  // Fetch telemedicine session details when the component mounts or ID changes
  useEffect(() => {
    // Only fetch if we have an ID and user is authenticated
    if (id && session?.user) {
      setLoading(true);
      setError(null);
      
      fetchTelemedicineSession(id as string)
        .then(data => {
          setTelemedicineSession(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching telemedicine session:', err);
          setError(err);
          setLoading(false);
        });
    }
  }, [id, session]);
  
  // Handle joining the telemedicine session
  const handleJoinSession = async () => {
    if (!telemedicineSession) return;
    
    try {
      setIsJoining(true);
      
      // In a real implementation, this would call an API to get the connection details
      // For now, we'll simulate a delay and then navigate to the video consultation
      setTimeout(() => {
        // Navigate to the video consultation component with the necessary props
        router.push({
          pathname: `/care/telemedicine/session/${id}`,
          query: {
            sessionId: id,
            channelName: `telemedicine-${id}`,
            token: 'simulated-token',
            providerId: telemedicineSession.providerId,
            providerName: telemedicineSession.provider?.name || 'Dr. Silva',
            providerSpecialty: telemedicineSession.provider?.specialty || 'Especialista',
            providerAvatar: telemedicineSession.provider?.avatar || ''
          }
        });
      }, 1000);
    } catch (err) {
      console.error('Error joining telemedicine session:', err);
      setError(err as Error);
      setIsJoining(false);
    }
  };
  
  // Determine if the session is joinable (scheduled or confirmed and not ended)
  const isSessionJoinable = () => {
    if (!telemedicineSession) return false;
    
    const now = new Date();
    const startTime = new Date(telemedicineSession.startTime);
    const endTime = telemedicineSession.endTime ? new Date(telemedicineSession.endTime) : null;
    
    // Session is joinable if it's scheduled or confirmed, hasn't ended, and is within 15 minutes of start time
    return (
      (telemedicineSession.appointment?.status === AppointmentStatus.SCHEDULED ||
       telemedicineSession.appointment?.status === AppointmentStatus.CONFIRMED) &&
      (!endTime || now < endTime) &&
      (now >= new Date(startTime.getTime() - 15 * 60 * 1000)) // 15 minutes before start time
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <CareLayout>
        <Head>
          <title>Carregando Consulta | Cuidar-me Agora</title>
        </Head>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <LoadingIndicator size="large" journey="care" />
        </Box>
      </CareLayout>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <CareLayout>
        <Head>
          <title>Erro | Cuidar-me Agora</title>
        </Head>
        <Box padding="lg">
          <Card journey="care" elevation="md">
            <Stack spacing="md" padding="lg">
              <Icon name="error" size="32px" color="semantic.error" />
              <Text variant="heading" color="semantic.error">Ocorreu um erro</Text>
              <Text>Não foi possível carregar os detalhes da consulta. Por favor, tente novamente mais tarde.</Text>
              <Button 
                journey="care" 
                variant="secondary" 
                onClick={() => router.back()}
              >
                Voltar
              </Button>
            </Stack>
          </Card>
        </Box>
      </CareLayout>
    );
  }
  
  // Render not found state
  if (!telemedicineSession) {
    return (
      <CareLayout>
        <Head>
          <title>Consulta não encontrada | Cuidar-me Agora</title>
        </Head>
        <Box padding="lg">
          <Card journey="care" elevation="md">
            <Stack spacing="md" padding="lg">
              <Icon name="search" size="32px" color="semantic.warning" />
              <Text variant="heading">Consulta não encontrada</Text>
              <Text>A consulta que você está procurando não foi encontrada ou não está disponível.</Text>
              <Button 
                journey="care" 
                variant="secondary" 
                onClick={() => router.push('/care/appointments')}
              >
                Ver minhas consultas
              </Button>
            </Stack>
          </Card>
        </Box>
      </CareLayout>
    );
  }
  
  // Render telemedicine session details
  return (
    <CareLayout>
      <Head>
        <title>Detalhes da Teleconsulta | Cuidar-me Agora</title>
      </Head>
      
      <Box padding="lg">
        <Stack spacing="lg">
          {/* Session header */}
          <Card journey="care" elevation="md">
            <Stack spacing="md" padding="lg">
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Text variant="heading">Teleconsulta</Text>
                <Box 
                  padding="xs" 
                  borderRadius="sm" 
                  backgroundColor={getStatusColor(telemedicineSession.status)}
                >
                  <Text color="white" fontWeight="medium">
                    {getStatusLabel(telemedicineSession.status)}
                  </Text>
                </Box>
              </Box>
              
              {/* Provider information */}
              {telemedicineSession.provider && (
                <Box 
                  display="flex" 
                  alignItems="center" 
                  padding="md" 
                  borderRadius="md" 
                  backgroundColor="neutral.gray100"
                >
                  {telemedicineSession.provider.avatar ? (
                    <img 
                      src={telemedicineSession.provider.avatar} 
                      alt={telemedicineSession.provider.name} 
                      style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        marginRight: 16 
                      }} 
                    />
                  ) : (
                    <Box 
                      width="48px" 
                      height="48px" 
                      borderRadius="50%" 
                      backgroundColor="journeys.care.primary" 
                      display="flex" 
                      justifyContent="center" 
                      alignItems="center" 
                      marginRight="md"
                    >
                      <Icon name="doctor" size="24px" color="white" />
                    </Box>
                  )}
                  <Stack spacing="xs">
                    <Text variant="subtitle" fontWeight="medium">
                      {telemedicineSession.provider.name}
                    </Text>
                    <Text color="neutral.gray700">
                      {telemedicineSession.provider.specialty}
                    </Text>
                  </Stack>
                </Box>
              )}
            </Stack>
          </Card>
          
          {/* Session details */}
          <Card journey="care" elevation="md">
            <Stack spacing="md" padding="lg">
              <Text variant="subtitle">Detalhes da Consulta</Text>
              
              <Box display="flex" justifyContent="space-between">
                <Stack spacing="xs">
                  <Text color="neutral.gray700">Data</Text>
                  <Text fontWeight="medium">
                    {formatDate(new Date(telemedicineSession.startTime))}
                  </Text>
                </Stack>
                
                <Stack spacing="xs">
                  <Text color="neutral.gray700">Horário</Text>
                  <Text fontWeight="medium">
                    {formatTime(new Date(telemedicineSession.startTime))}
                  </Text>
                </Stack>
                
                <Stack spacing="xs">
                  <Text color="neutral.gray700">Duração</Text>
                  <Text fontWeight="medium">
                    {telemedicineSession.endTime ? 
                      calculateDuration(telemedicineSession.startTime, telemedicineSession.endTime) : 
                      '30 minutos (estimado)'}
                  </Text>
                </Stack>
              </Box>
              
              {/* Appointment information if available */}
              {telemedicineSession.appointment && (
                <Box 
                  padding="md" 
                  borderRadius="md" 
                  backgroundColor="neutral.gray100"
                  marginTop="md"
                >
                  <Stack spacing="sm">
                    <Text fontWeight="medium">Informações da Consulta</Text>
                    <Text>
                      {telemedicineSession.appointment.notes || 'Nenhuma observação adicional.'}
                    </Text>
                  </Stack>
                </Box>
              )}
            </Stack>
          </Card>
          
          {/* Join session button */}
          <Card journey="care" elevation="md">
            <Stack spacing="md" padding="lg">
              <Text variant="subtitle">Entrar na Teleconsulta</Text>
              
              {isSessionJoinable() ? (
                <>
                  <Text>
                    Você pode entrar na sala de espera virtual até 15 minutos antes do horário agendado.
                    O médico irá iniciar a consulta no horário marcado.
                  </Text>
                  <Button 
                    journey="care" 
                    variant="primary" 
                    fullWidth 
                    onClick={handleJoinSession} 
                    loading={isJoining}
                    disabled={isJoining}
                  >
                    Entrar na Teleconsulta
                  </Button>
                </>
              ) : (
                <>
                  <Text color="semantic.warning">
                    {getJoinabilityMessage(telemedicineSession)}
                  </Text>
                  <Button 
                    journey="care" 
                    variant="secondary" 
                    fullWidth 
                    onClick={() => router.push('/care/appointments')}
                  >
                    Ver minhas consultas
                  </Button>
                </>
              )}
            </Stack>
          </Card>
          
          {/* Instructions */}
          <Card journey="care" elevation="md">
            <Stack spacing="md" padding="lg">
              <Text variant="subtitle">Preparação para a Teleconsulta</Text>
              
              <Stack spacing="sm">
                <Box display="flex" alignItems="center">
                  <Icon name="check" color="semantic.success" size="20px" marginRight="xs" />
                  <Text>Verifique sua conexão com a internet</Text>
                </Box>
                <Box display="flex" alignItems="center">
                  <Icon name="check" color="semantic.success" size="20px" marginRight="xs" />
                  <Text>Teste sua câmera e microfone</Text>
                </Box>
                <Box display="flex" alignItems="center">
                  <Icon name="check" color="semantic.success" size="20px" marginRight="xs" />
                  <Text>Escolha um local silencioso e bem iluminado</Text>
                </Box>
                <Box display="flex" alignItems="center">
                  <Icon name="check" color="semantic.success" size="20px" marginRight="xs" />
                  <Text>Tenha em mãos seus documentos médicos e exames recentes</Text>
                </Box>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Box>
    </CareLayout>
  );
};

// Helper function to get status color based on session status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'SCHEDULED':
      return 'journeys.care.primary';
    case 'STARTED':
      return 'semantic.success';
    case 'COMPLETED':
      return 'semantic.info';
    case 'CANCELLED':
      return 'semantic.error';
    default:
      return 'neutral.gray700';
  }
};

// Helper function to get status label based on session status
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'SCHEDULED':
      return 'Agendada';
    case 'STARTED':
      return 'Em andamento';
    case 'COMPLETED':
      return 'Concluída';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status;
  }
};

// Helper function to calculate duration between two dates
const calculateDuration = (startTime: string | Date, endTime: string | Date): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  const minutes = Math.floor(durationMs / (1000 * 60));
  
  if (minutes < 60) {
    return `${minutes} minutos`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  }
};

// Helper function to get message about session joinability
const getJoinabilityMessage = (session: TelemedicineSession): string => {
  const now = new Date();
  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : null;
  
  if (session.status === 'CANCELLED') {
    return 'Esta consulta foi cancelada.';
  }
  
  if (session.status === 'COMPLETED' || (endTime && now > endTime)) {
    return 'Esta consulta já foi concluída.';
  }
  
  if (now < new Date(startTime.getTime() - 15 * 60 * 1000)) {
    return `A sala de espera virtual estará disponível 15 minutos antes do horário agendado (${formatTime(startTime)}).`;
  }
  
  return 'Esta consulta não está disponível no momento.';
};

export default TelemedicineDetailPage;