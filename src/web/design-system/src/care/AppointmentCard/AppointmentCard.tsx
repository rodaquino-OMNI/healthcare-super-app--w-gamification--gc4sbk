import React from 'react';
import { format } from 'date-fns';
import {
  AppointmentCardContainer,
  AppointmentCardHeader,
  AppointmentCardBody,
  AppointmentCardFooter,
  ProviderInfo,
  AppointmentDetails,
  AppointmentActions
} from './AppointmentCard.styles';
import { Button } from '@austa/design-system/components/Button';
import { Card } from '@austa/design-system/components/Card';
import { Icon } from '@design-system/primitives/components/Icon';
import { Text } from '@design-system/primitives/components/Text';
import { Appointment, Provider } from '@austa/interfaces/care';
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/care/types';

/**
 * Props for the AppointmentCard component
 */
export interface AppointmentCardProps {
  /**
   * The appointment data to display.
   */
  appointment: Appointment;
  /**
   * The provider data associated with the appointment.
   */
  provider: Provider;
  /**
   * Callback function when the user wants to view appointment details.
   */
  onViewDetails?: () => void;
  /**
   * Callback function when the user wants to reschedule the appointment.
   */
  onReschedule?: () => void;
  /**
   * Callback function when the user wants to cancel the appointment.
   */
  onCancel?: () => void;
  /**
   * Callback function when the user wants to join a telemedicine session.
   */
  onJoinTelemedicine?: () => void;
  /**
   * Whether to show action buttons.
   * @default true
   */
  showActions?: boolean;
  /**
   * Test ID for testing purposes.
   */
  testID?: string;
}

/**
 * Formats the appointment date and time in a user-friendly format.
 * @param dateTime The date and time string to format
 * @returns Formatted date and time string
 */
const formatAppointmentDate = (dateTime: string): string => {
  const date = new Date(dateTime);
  return format(date, 'PPP p'); // Format like "Apr 29, 2023, 3:00 PM"
};

/**
 * Returns the appropriate color for the appointment status.
 * @param status The appointment status
 * @returns Color code for the status
 */
const getStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return 'journeys.care.primary';
    case AppointmentStatus.COMPLETED:
      return 'semantic.success';
    case AppointmentStatus.CANCELLED:
      return 'semantic.error';
    default:
      return 'journeys.care.primary';
  }
};

/**
 * Returns the appropriate icon name for the appointment type.
 * @param type The appointment type
 * @returns Icon name for the appointment type
 */
const getAppointmentTypeIcon = (type: AppointmentType): string => {
  switch (type) {
    case AppointmentType.TELEMEDICINE:
      return 'video';
    case AppointmentType.IN_PERSON:
      return 'clinic';
    default:
      return 'calendar';
  }
};

/**
 * A component that displays appointment information in a card format.
 * Used in the Care journey for appointment listings, details views, and telemedicine flows.
 */
export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  provider,
  onViewDetails,
  onReschedule,
  onCancel,
  onJoinTelemedicine,
  showActions = true,
  testID,
}) => {
  const formattedDate = formatAppointmentDate(appointment.scheduledAt);
  const typeIcon = getAppointmentTypeIcon(appointment.type);
  const statusColor = getStatusColor(appointment.status);
  
  // Create an accessible description of the appointment
  const appointmentDescription = `Consulta ${appointment.type === AppointmentType.TELEMEDICINE ? 'por telemedicina' : 'presencial'} com ${provider.name}, ${provider.primarySpecialty}, ${formattedDate}, status: ${appointment.status === AppointmentStatus.SCHEDULED ? 'agendada' : appointment.status === AppointmentStatus.COMPLETED ? 'concluída' : 'cancelada'}`;
  
  // Get status text
  const getStatusText = () => {
    switch (appointment.status) {
      case AppointmentStatus.SCHEDULED:
        return 'Agendada';
      case AppointmentStatus.COMPLETED:
        return 'Concluída';
      case AppointmentStatus.CANCELLED:
        return 'Cancelada';
      default:
        return '';
    }
  };
  
  return (
    <AppointmentCardContainer data-testid={testID} aria-label={appointmentDescription}>
      <AppointmentCardHeader>
        <ProviderInfo>
          {provider.profileImageUrl && (
            <img src={provider.profileImageUrl} alt="" aria-hidden="true" />
          )}
          <div>
            <Text fontWeight="medium" color="neutral.gray800">
              {provider.name}
            </Text>
            <Text fontSize="sm" color="neutral.gray600">
              {provider.primarySpecialty}
            </Text>
          </div>
        </ProviderInfo>
        <Icon 
          name={typeIcon} 
          size="24px" 
          color="journeys.care.primary" 
          aria-hidden="true"
        />
      </AppointmentCardHeader>
      
      <AppointmentCardBody>
        <AppointmentDetails>
          <div>
            <Icon name="calendar" size="16px" aria-hidden="true" />
            <Text fontSize="sm">{formattedDate}</Text>
          </div>
          
          <div>
            <Icon 
              name={appointment.type === AppointmentType.TELEMEDICINE ? 'video' : 'clinic'} 
              size="16px" 
              aria-hidden="true" 
            />
            <Text fontSize="sm">
              {appointment.type === AppointmentType.TELEMEDICINE ? 'Telemedicina' : 'Consulta presencial'}
            </Text>
          </div>
          
          <div>
            <Icon name="info" size="16px" color={statusColor} aria-hidden="true" />
            <Text fontSize="sm" color={statusColor} fontWeight="medium">
              {getStatusText()}
            </Text>
          </div>
        </AppointmentDetails>
      </AppointmentCardBody>
      
      {showActions && (
        <AppointmentCardFooter>
          <AppointmentActions>
            {onViewDetails && (
              <Button 
                variant="secondary" 
                size="sm" 
                onPress={onViewDetails}
                journey="care"
                accessibilityLabel="Ver detalhes da consulta"
              >
                Ver detalhes
              </Button>
            )}
            
            {appointment.status === AppointmentStatus.SCHEDULED && (
              <>
                {appointment.type === AppointmentType.TELEMEDICINE && onJoinTelemedicine && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onPress={onJoinTelemedicine}
                    journey="care"
                    icon="video"
                    accessibilityLabel="Iniciar teleconsulta"
                  >
                    Iniciar consulta
                  </Button>
                )}
                
                {onReschedule && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onPress={onReschedule}
                    journey="care"
                    accessibilityLabel="Reagendar consulta"
                  >
                    Reagendar
                  </Button>
                )}
                
                {onCancel && (
                  <Button 
                    variant="tertiary" 
                    size="sm" 
                    onPress={onCancel}
                    journey="care"
                    accessibilityLabel="Cancelar consulta"
                  >
                    Cancelar
                  </Button>
                )}
              </>
            )}
          </AppointmentActions>
        </AppointmentCardFooter>
      )}
    </AppointmentCardContainer>
  );
};