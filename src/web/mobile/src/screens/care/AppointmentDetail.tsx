import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

// Import from @austa/interfaces instead of shared/types
import { Appointment } from '@austa/interfaces/care';

// Import hooks and utilities
import { useAppointments } from '../../hooks/useAppointments';
import { ROUTES } from '../../constants/routes';
import { formatAppointmentTime } from '../../utils/format';

// Import from @austa/design-system instead of direct references
import { Button, Card, Text } from '@austa/design-system';
import { JourneyHeader } from '../../components/shared/JourneyHeader';

// Import from @austa/journey-context instead of local context
import { useJourney } from '@austa/journey-context';

/**
 * Interface for the route parameters expected by this screen.
 */
interface AppointmentDetailRouteParams {
  id: string;
}

/**
 * Displays the details of a specific appointment.
 * Allows users to view appointment information and potentially take actions like canceling or rescheduling.
 */
export const AppointmentDetail: React.FC = () => {
  // 1. Retrieve the appointment ID from the route parameters using `useRoute`.
  const route = useRoute<any>();
  const { id } = route.params as AppointmentDetailRouteParams;

  // 2. Uses the `useAppointments` hook to fetch appointment data and management functions.
  const { appointments, loading, error, refetch, cancel } = useAppointments();

  // 3. Find the specific appointment based on the ID.
  const appointment: Appointment | undefined = appointments.find(appt => appt.id === id);

  // Access the navigation object
  const navigation = useNavigation();

  // Access the current journey
  const { journey } = useJourney();

  // 4. If the appointment is not found, displays a loading indicator or an error message.
  if (loading) {
    return (
      <View style={styles.container}>
        <JourneyHeader title="Appointment Details" showBackButton />
        <View style={styles.loadingContainer}>
          <Text variant="body" color={`journeys.${journey}.primary`} textAlign="center">
            Loading appointment details...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <JourneyHeader title="Appointment Details" showBackButton />
        <View style={styles.errorContainer}>
          <Text variant="heading" color={`journeys.${journey}.primary`} textAlign="center" marginBottom={10}>
            Error
          </Text>
          <Text variant="body" color="colors.error.base" textAlign="center">
            Error loading appointment details: {error.message}
          </Text>
          <Button 
            variant="primary" 
            onPress={() => refetch()} 
            journey={journey}
            style={styles.retryButton}
            accessibilityLabel="Retry loading appointment"
          >
            Retry
          </Button>
        </View>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <JourneyHeader title="Appointment Details" showBackButton />
        <View style={styles.notFoundContainer}>
          <Text variant="heading" color={`journeys.${journey}.primary`} textAlign="center" marginBottom={10}>
            Not Found
          </Text>
          <Text variant="body" color="colors.neutral.600" textAlign="center">
            Appointment not found.
          </Text>
          <Button 
            variant="primary" 
            onPress={() => navigation.goBack()} 
            journey={journey}
            style={styles.backButton}
            accessibilityLabel="Go back to appointments"
          >
            Back to Appointments
          </Button>
        </View>
      </View>
    );
  }

  // 5. Formats the appointment date and time for display using `formatAppointmentTime`.
  const formattedDateTime = formatAppointmentTime(appointment.dateTime, 'long');

  // 6. Renders the appointment details, including provider information, date, time, and reason.
  return (
    <View style={styles.container}>
      <JourneyHeader title="Appointment Details" showBackButton />
      <Card 
        style={styles.card}
        journey={journey}
        elevation="md"
      >
        <Text variant="heading" color={`journeys.${journey}.primary`} marginBottom={10}>
          Appointment with
        </Text>
        <Text variant="subheading" color={`journeys.${journey}.secondary`} marginBottom={5}>
          {appointment.providerId}
        </Text>
        <Text variant="body" color="colors.neutral.800" marginBottom={5}>
          Date and Time: {formattedDateTime}
        </Text>
        <Text variant="body" color="colors.neutral.800" marginBottom={15}>
          Reason: {appointment.reason}
        </Text>

        {/* 7. Provides a button to cancel the appointment, if applicable. */}
        <Button
          variant="secondary"
          onPress={() => {
            cancel(appointment.id);
            navigation.goBack();
          }}
          accessibilityLabel="Cancel Appointment"
          journey={journey}
          fullWidth
        >
          Cancel Appointment
        </Button>
      </Card>
    </View>
  );
};

// Styles for the AppointmentDetail component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
    padding: 20,
  },
  retryButton: {
    marginTop: 20,
    minWidth: 120,
  },
  backButton: {
    marginTop: 20,
    minWidth: 200,
  },
});