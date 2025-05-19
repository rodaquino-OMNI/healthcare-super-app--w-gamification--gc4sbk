import React from 'react';
import { Box, Stack, Text } from '@design-system/primitives';
import { useAppointments } from 'src/web/web/src/hooks/useAppointments';
import { Appointment } from '@austa/interfaces/care';
import { Card } from '@austa/design-system';
import { Button } from '@austa/design-system';
import { formatRelativeDate } from '@austa/interfaces/common/utils';
import { MOBILE_CARE_ROUTES } from 'src/web/shared/constants/routes';
import { useJourneyContext } from '@austa/journey-context';

/**
 * Displays a list of upcoming appointments in a widget format for the Care Now journey dashboard.
 * This component fetches appointment data and displays up to three upcoming appointments,
 * with a button to navigate to the full appointments page.
 */
export const AppointmentsWidget: React.FC = () => {
  const { currentJourney } = useJourneyContext();
  const { appointments, loading, error } = useAppointments();
  
  // Get upcoming appointments, sorted by date (nearest first)
  const upcomingAppointments = React.useMemo(() => {
    if (!appointments?.length) return [];
    
    return [...appointments]
      .filter(appointment => new Date(appointment.dateTime) >= new Date())
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 3); // Show at most 3 appointments
  }, [appointments]);
  
  // Format appointment time (HH:MM)
  const formatAppointmentTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString(['pt-BR', 'en-US'], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // Use 24-hour format for Brazilian convention
    });
  };
  
  // Handle navigation to appointments page
  // In a real implementation, this would use the appropriate navigation method
  // depending on platform (router.push for web, navigation.navigate for mobile)
  const handleViewAllAppointments = () => {
    // For web implementation, we would use Next.js router:
    // router.push('/care/appointments');
    
    // For demonstration purposes, just log the navigation intent
    console.log(`Navigate to: ${MOBILE_CARE_ROUTES.APPOINTMENTS}`);
  };
  
  return (
    <Card journey="care" elevation="sm">
      <Text 
        fontSize={18} 
        fontWeight={500} 
        color="neutral.gray900" 
        marginBottom={16}
      >
        Upcoming Appointments
      </Text>
      
      {loading && (
        <Text 
          color="neutral.gray600" 
          textAlign="center" 
          margin="24px 0"
        >
          Loading appointments...
        </Text>
      )}
      
      {error && (
        <Text 
          color="semantic.error" 
          textAlign="center" 
          margin="24px 0"
        >
          Failed to load appointments. Please try again later.
        </Text>
      )}
      
      {!loading && !error && upcomingAppointments.length === 0 && (
        <Text 
          color="neutral.gray600" 
          textAlign="center" 
          margin="24px 0"
        >
          You have no upcoming appointments.
        </Text>
      )}
      
      {!loading && !error && upcomingAppointments.length > 0 && (
        <Stack 
          as="ul" 
          listStyle="none" 
          padding={0} 
          margin="0 0 16px 0"
          spacing={0}
        >
          {upcomingAppointments.map((appointment) => (
            <Box 
              key={appointment.id} 
              as="li" 
              padding="12px 0" 
              borderBottom="1px solid" 
              borderBottomColor="neutral.gray200"
              _last={{ borderBottom: 'none' }}
            >
              <Text 
                fontWeight={500} 
                color="neutral.gray900" 
                marginBottom={4}
              >
                {formatRelativeDate(appointment.dateTime)}, {formatAppointmentTime(appointment.dateTime)}
              </Text>
              <Text 
                color="neutral.gray700" 
                fontSize={14}
              >
                {appointment.type} appointment
                {appointment.reason && ` • ${appointment.reason}`}
              </Text>
            </Box>
          ))}
        </Stack>
      )}
      
      <Stack 
        direction="row" 
        justifyContent="center" 
        marginTop={16}
      >
        <Button 
          journey="care"
          variant="secondary"
          icon="calendar"
          onPress={handleViewAllAppointments}
          accessibilityLabel="View all appointments"
        >
          View All Appointments
        </Button>
      </Stack>
    </Card>
  );
};