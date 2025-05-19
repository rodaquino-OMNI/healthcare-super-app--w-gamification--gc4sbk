import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import from @austa/design-system instead of direct references
import { Card, Button } from '@austa/design-system';
import { Box, Stack } from '@design-system/primitives';

// Import from shared components with proper paths
import { JourneyHeader } from '../../components/shared/JourneyHeader';
import { LoadingIndicator } from '../../components/shared/LoadingIndicator';
import { EmptyState } from '../../components/shared/EmptyState';

// Import from @austa/journey-context instead of local context
import { useJourney, useCareContext } from '@austa/journey-context';

// Import from @austa/interfaces for type safety
import { AppointmentType, MedicationType } from '@austa/interfaces/care';
import { JOURNEY_IDS } from '@austa/interfaces/common';

// Import hooks with proper paths
import { useAppointments } from '../../hooks/useAppointments';

/**
 * Renders the Care Now dashboard screen, displaying upcoming appointments and medication tracking information.
 *
 * @returns {JSX.Element} A View containing the dashboard content.
 */
export const Dashboard: React.FC = () => {
  // Get navigation object for screen transitions
  const navigation = useNavigation();
  
  // Get journey context from @austa/journey-context
  const { journey } = useJourney();
  
  // Get care-specific context from @austa/journey-context
  const { medications, isLoadingMedications, medicationError } = useCareContext();
  
  // Get appointments data using the useAppointments hook
  const { appointments, loading: isLoadingAppointments, error: appointmentError } = useAppointments();

  // Determine if we're in a loading state
  const isLoading = isLoadingAppointments || isLoadingMedications;
  
  // Determine if we have any errors
  const hasError = appointmentError || medicationError;
  
  // Determine if we have any data to display
  const hasAppointments = appointments && appointments.length > 0;
  const hasMedications = medications && medications.length > 0;
  const hasNoData = !hasAppointments && !hasMedications;

  // Render loading state if data is being fetched
  if (isLoading) {
    return (
      <View style={styles.container}>
        <JourneyHeader
          title="Cuidar-me Agora"
          showBackButton
        />
        <Box flex={1} justifyContent="center" alignItems="center">
          <LoadingIndicator 
            journey="care" 
            size="lg" 
            label="Carregando informações..."
          />
        </Box>
      </View>
    );
  }

  // Render error state if there was an error fetching data
  if (hasError) {
    return (
      <View style={styles.container}>
        <JourneyHeader
          title="Cuidar-me Agora"
          showBackButton
        />
        <Box flex={1} justifyContent="center" alignItems="center">
          <EmptyState
            icon="error"
            title="Erro ao carregar dados"
            description="Não foi possível carregar suas informações. Por favor, tente novamente mais tarde."
            actionLabel="Tentar novamente"
            onAction={() => {
              // Refresh data
              if (appointmentError) {
                // Refetch appointments
              }
            }}
            journey="care"
          />
        </Box>
      </View>
    );
  }

  // Render empty state if there's no data
  if (hasNoData) {
    return (
      <View style={styles.container}>
        <JourneyHeader
          title="Cuidar-me Agora"
          showBackButton
        />
        <Box flex={1} justifyContent="center" alignItems="center">
          <EmptyState
            icon="medical-services"
            title="Sem informações de cuidados"
            description="Você ainda não tem consultas agendadas ou medicamentos para acompanhar. Comece agendando uma consulta ou adicionando seus medicamentos."
            actionLabel="Agendar consulta"
            onAction={() => navigation.navigate('BookAppointment' as never)}
            journey="care"
          />
        </Box>
      </View>
    );
  }

  // Render the dashboard with appointments and medications
  return (
    <View style={styles.container}>
      <JourneyHeader
        title="Cuidar-me Agora"
        showBackButton
      />
      
      <Stack spacing="md" padding="md">
        {/* Appointments Section */}
        {hasAppointments && (
          <Card 
            journey="care"
            elevation="sm"
            padding="md"
          >
            <Stack spacing="sm">
              <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Box.Text fontSize="lg" fontWeight="bold">Consultas Agendadas</Box.Text>
                  <Box.Text fontSize="sm" color="neutral.gray600">
                    {appointments.length} {appointments.length === 1 ? 'consulta' : 'consultas'} agendada{appointments.length !== 1 ? 's' : ''}
                  </Box.Text>
                </Box>
                <Button 
                  variant="text" 
                  journey="care" 
                  onPress={() => navigation.navigate('Appointments' as never)}
                >
                  Ver todas
                </Button>
              </Box>
              
              {/* We would render the AppointmentList component here */}
              {/* Since it's not available, we'll just show a placeholder */}
              <Box padding="md" backgroundColor="neutral.gray100" borderRadius="md">
                <Box.Text>Lista de consultas seria exibida aqui</Box.Text>
              </Box>
            </Stack>
          </Card>
        )}
        
        {/* Medications Section */}
        {hasMedications && (
          <Card 
            journey="care"
            elevation="sm"
            padding="md"
          >
            <Stack spacing="sm">
              <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Box.Text fontSize="lg" fontWeight="bold">Medicamentos</Box.Text>
                  <Box.Text fontSize="sm" color="neutral.gray600">
                    {medications.length} {medications.length === 1 ? 'medicamento' : 'medicamentos'} para acompanhar
                  </Box.Text>
                </Box>
                <Button 
                  variant="text" 
                  journey="care" 
                  onPress={() => navigation.navigate('Medications' as never)}
                >
                  Ver todos
                </Button>
              </Box>
              
              {/* We would render the MedicationList component here */}
              {/* Since it's not available, we'll just show a placeholder */}
              <Box padding="md" backgroundColor="neutral.gray100" borderRadius="md">
                <Box.Text>Lista de medicamentos seria exibida aqui</Box.Text>
              </Box>
            </Stack>
          </Card>
        )}
      </Stack>
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light background color for care journey screens
  },
});