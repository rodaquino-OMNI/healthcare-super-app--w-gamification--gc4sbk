import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import from @austa/interfaces instead of local files
import { appointmentSchema, AppointmentFormData, AppointmentType, Appointment } from '@austa/interfaces/care';
import { ROUTES } from '@austa/interfaces/common';

// Import from @austa/journey-context instead of local context
import { useJourneyContext, useJourneyTheme } from '@austa/journey-context';

// Import from @design-system/primitives for layout and styling
import { Box, Stack, Text } from '@design-system/primitives';

// Import from @austa/design-system for UI components
import { 
  Button, 
  DatePicker, 
  Select, 
  RadioGroup, 
  RadioButton,
  TextArea,
  ErrorMessage,
  ProgressBar,
  Card,
  LoadingIndicator
} from '@austa/design-system';
import { CareTheme } from '@austa/design-system/themes';

// Import custom hook for API interactions
import { useAppointments } from '../../hooks/useAppointments';
import { useNavigation } from '@react-navigation/native';

const AppointmentForm: React.FC = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { journey } = useJourneyContext();
  const { theme: journeyTheme } = useJourneyTheme();
  const navigation = useNavigation();
  
  // Use the useAppointments hook for API interactions
  const { bookAppointment, isLoading, error: apiError, triggerGamificationEvent } = useAppointments();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      providerId: '',
      dateTime: undefined,
      type: '',
      reason: '',
      notes: '',
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      // Create appointment object
      const appointmentData: Partial<Appointment> = {
        providerId: data.providerId,
        dateTime: data.dateTime.toISOString(),
        type: data.type,
        reason: data.reason,
        notes: data.notes || '',
        status: 'scheduled',
      };

      // Use the bookAppointment function from the hook
      const response = await bookAppointment(appointmentData);
      
      // Trigger gamification event
      triggerGamificationEvent('APPOINTMENT_BOOKED', {
        appointmentType: data.type,
      });
      
      // Navigate to confirmation
      // Use constants from @austa/interfaces for route names
      navigation.navigate(ROUTES.CARE_APPOINTMENTS as never, {
        appointmentId: response.id,
        showConfirmation: true,
      } as never);
      
    } catch (error) {
      // Error handling is managed by the useAppointments hook
      console.error('Error in form submission:', error);
    }
  };

  // Get care journey theme
  const careTheme = journeyTheme || CareTheme;

  return (
    <Box flex={1} backgroundColor="white">
      <Stack spacing="md" padding="lg">
        <Text variant="heading" color={careTheme.colors.primary} textAlign="center">
          Agendar Consulta
        </Text>

        {apiError && (
          <Card variant="error">
            <Text color="error">{apiError.message || 'Falha ao agendar consulta. Por favor, tente novamente.'}</Text>
          </Card>
        )}

        <Controller
          control={control}
          name="providerId"
          render={({ field: { onChange, value } }) => (
            <Box marginBottom="md">
              <Text variant="label" marginBottom="xs">Médico</Text>
              <Select
                value={value}
                onValueChange={onChange}
                placeholder="Selecione um médico"
                items={[
                  { label: "Dr. Carlos Silva - Cardiologista", value: "provider-1" },
                  { label: "Dra. Ana Oliveira - Neurologista", value: "provider-2" },
                  { label: "Dr. Paulo Santos - Clínico Geral", value: "provider-3" },
                ]}
                error={errors.providerId?.message}
                accessibilityLabel="Selecione um médico"
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="dateTime"
          render={({ field: { onChange, value } }) => (
            <Box marginBottom="md">
              <Text variant="label" marginBottom="xs">Data e Hora</Text>
              <DatePicker
                value={value}
                onChange={onChange}
                minimumDate={new Date()}
                mode="datetime"
                locale="pt-BR"
                error={errors.dateTime?.message}
                accessibilityLabel="Selecione data e hora da consulta"
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <Box marginBottom="md">
              <Text variant="label" marginBottom="xs">Tipo de Consulta</Text>
              <RadioGroup 
                value={value} 
                onChange={onChange}
                error={errors.type?.message}
              >
                <Stack direction="row" spacing="sm">
                  <RadioButton 
                    value={AppointmentType.IN_PERSON} 
                    label="Presencial"
                    accessibilityLabel="Consulta presencial"
                  />
                  <RadioButton 
                    value={AppointmentType.TELEMEDICINE} 
                    label="Telemedicina"
                    accessibilityLabel="Teleconsulta"
                  />
                </Stack>
              </RadioGroup>
            </Box>
          )}
        />

        <Controller
          control={control}
          name="reason"
          render={({ field: { onChange, value } }) => (
            <Box marginBottom="md">
              <Text variant="label" marginBottom="xs">Motivo da Consulta</Text>
              <TextArea
                value={value}
                onChangeText={onChange}
                placeholder="Descreva brevemente o motivo da sua consulta"
                error={errors.reason?.message}
                accessibilityLabel="Motivo da consulta"
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Box marginBottom="md">
              <Text variant="label" marginBottom="xs">Observações (Opcional)</Text>
              <TextArea
                value={value}
                onChangeText={onChange}
                placeholder="Informações adicionais para o médico"
                accessibilityLabel="Observações adicionais para o médico"
              />
            </Box>
          )}
        />

        <Card variant="info" marginVertical="md">
          <Stack spacing="xs">
            <Text variant="subtitle" fontWeight="bold">Informações de Cobertura</Text>
            <Text variant="body">✓ Esta consulta está coberta pelo seu plano</Text>
            <Text variant="body">✓ Copagamento estimado: R$ 30,00</Text>
          </Stack>
        </Card>

        <Card variant="highlight" backgroundColor={`${careTheme.colors.primary}10`} marginBottom="md">
          <Stack spacing="xs">
            <Text variant="subtitle" fontWeight="bold">🏆 Agende 3 consultas e ganhe 150 XP!</Text>
            <ProgressBar 
              progress={0.66} 
              color={careTheme.colors.primary} 
              accessibilityLabel="Progresso: 2 de 3 consultas agendadas"
            />
            <Text variant="caption" textAlign="right">2/3 concluídas</Text>
          </Stack>
        </Card>

        <Button
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          accessibilityLabel={isLoading ? "Agendando consulta" : "Agendar consulta"}
          fullWidth
        >
          {isLoading ? (
            <Stack direction="row" spacing="xs" alignItems="center" justifyContent="center">
              <LoadingIndicator size="small" color="white" />
              <Text color="white" fontWeight="bold">Agendando...</Text>
            </Stack>
          ) : (
            "Agendar Consulta"
          )}
        </Button>
      </Stack>
    </Box>
  );
};

export default AppointmentForm;