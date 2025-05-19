import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import from @austa packages
import { useJourneyContext } from '@austa/journey-context';
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/care';
import {
  Text,
  Button,
  DatePicker,
  Select,
  TextInput,
  RadioGroup,
  RadioButton,
  Card,
  ProgressBar,
  Badge
} from '@austa/design-system';
import { useCareTheme } from '@austa/design-system/themes';

// Import API functions
import { bookAppointment } from '../../api/care';

// Import constants
import { MOBILE_CARE_ROUTES } from '../../constants/routes';

// Define appointment validation schema
const appointmentSchema = z.object({
  providerId: z.string().min(1, { message: 'Seleção de médico é obrigatória' }),
  dateTime: z.date({
    required_error: 'Data da consulta é obrigatória',
    invalid_type_error: 'Formato de data inválido',
  }),
  type: z.string().min(1, { message: 'Tipo de consulta é obrigatório' }),
  reason: z.string().min(1, { message: 'Motivo da consulta é obrigatório' }),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

/**
 * AppointmentBooking Screen Component
 * 
 * Provides a form for scheduling healthcare appointments in the Care journey.
 * Allows selection of provider, date/time, consultation type, and reason.
 * Integrates with the care API for appointment creation.
 */
const AppointmentBooking: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Use journey context for care journey state management
  const { journey, user, triggerGamificationEvent } = useJourneyContext();
  const navigation = useNavigation();
  const theme = useCareTheme(); // Get care-specific theming

  const {
    control,
    handleSubmit,
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

  /**
   * Handles form submission for booking an appointment
   * Validates form data, calls API, and navigates to confirmation
   */
  const onSubmit = async (data: AppointmentFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Create appointment object using interfaces from @austa/interfaces/care
      const appointmentData = {
        providerId: data.providerId,
        patientId: user?.id,
        dateTime: data.dateTime.toISOString(),
        type: data.type as AppointmentType,
        status: 'scheduled' as AppointmentStatus,
        reason: data.reason,
        notes: data.notes || '',
      };

      // Call API to book appointment
      const response = await bookAppointment(appointmentData);
      
      // Trigger gamification event for appointment booking
      triggerGamificationEvent('APPOINTMENT_BOOKED', {
        appointmentId: response.id,
        appointmentType: data.type,
        journeyType: 'care',
      });
      
      // Navigate to appointment detail with confirmation
      navigation.navigate(MOBILE_CARE_ROUTES.APPOINTMENT_DETAIL as never, {
        appointmentId: response.id,
        showConfirmation: true,
      } as never);
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      setSubmitError('Falha ao agendar consulta. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Provider options for select component
  const providerOptions = [
    { label: 'Selecione um médico', value: '' },
    { label: 'Dr. Carlos Silva - Cardiologista', value: 'provider-1' },
    { label: 'Dra. Ana Oliveira - Neurologista', value: 'provider-2' },
    { label: 'Dr. Paulo Santos - Clínico Geral', value: 'provider-3' },
  ];

  // Appointment type options for radio group
  const appointmentTypeOptions = [
    { label: 'Presencial', value: 'in-person' },
    { label: 'Telemedicina', value: 'telemedicine' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text variant="heading" color={theme.colors.primary}>
        Agendar Consulta
      </Text>

      {submitError && (
        <Card variant="error" style={styles.errorCard}>
          <Text color="error">{submitError}</Text>
        </Card>
      )}

      <View style={styles.formContainer}>
        {/* Provider Selection */}
        <Controller
          control={control}
          name="providerId"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text variant="label">Médico</Text>
              <Select
                options={providerOptions}
                value={value}
                onValueChange={onChange}
                error={errors.providerId?.message}
                accessibilityLabel="Selecione um médico"
              />
            </View>
          )}
        />

        {/* Date and Time Selection */}
        <Controller
          control={control}
          name="dateTime"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text variant="label">Data e Hora</Text>
              <DatePicker
                value={value}
                onChange={onChange}
                onOpenChange={setShowDatePicker}
                isOpen={showDatePicker}
                mode="datetime"
                minimumDate={new Date()}
                error={errors.dateTime?.message}
                accessibilityLabel="Selecione data e hora da consulta"
              />
            </View>
          )}
        />

        {/* Appointment Type Selection */}
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text variant="label">Tipo de Consulta</Text>
              <RadioGroup 
                options={appointmentTypeOptions}
                value={value}
                onChange={onChange}
                error={errors.type?.message}
                direction="horizontal"
                accessibilityLabel="Selecione o tipo de consulta"
              />
            </View>
          )}
        />

        {/* Reason for Appointment */}
        <Controller
          control={control}
          name="reason"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text variant="label">Motivo da Consulta</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
                placeholder="Descreva brevemente o motivo da sua consulta"
                error={errors.reason?.message}
                accessibilityLabel="Motivo da consulta"
              />
            </View>
          )}
        />

        {/* Additional Notes (Optional) */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text variant="label">Observações (Opcional)</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                placeholder="Informações adicionais para o médico"
                accessibilityLabel="Observações adicionais para o médico"
              />
            </View>
          )}
        />
      </View>

      {/* Coverage Information Card */}
      <Card variant="info" style={styles.coverageCard}>
        <Text variant="subtitle" style={styles.coverageTitle}>Informações de Cobertura</Text>
        <View style={styles.coverageItem}>
          <Badge variant="success" />
          <Text>Esta consulta está coberta pelo seu plano</Text>
        </View>
        <View style={styles.coverageItem}>
          <Badge variant="success" />
          <Text>Copagamento estimado: R$ 30,00</Text>
        </View>
      </Card>

      {/* Gamification Banner */}
      <Card variant="highlight" style={styles.gamificationCard}>
        <Text variant="subtitle" style={styles.gamificationText}>
          🏆 Agende 3 consultas e ganhe 150 XP!
        </Text>
        <ProgressBar 
          progress={0.66} 
          color={theme.colors.primary} 
          style={styles.progressBar} 
        />
        <Text variant="caption" style={styles.progressText}>2/3 concluídas</Text>
      </Card>

      {/* Submit Button */}
      <Button
        variant="primary"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        loadingText="Agendando..."
        style={styles.submitButton}
        accessibilityLabel={isSubmitting ? "Agendando consulta" : "Agendar consulta"}
      >
        Agendar Consulta
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  formContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  errorCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  coverageCard: {
    marginBottom: 16,
  },
  coverageTitle: {
    marginBottom: 8,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gamificationCard: {
    marginBottom: 24,
  },
  gamificationText: {
    marginBottom: 8,
  },
  progressBar: {
    marginBottom: 4,
  },
  progressText: {
    textAlign: 'right',
  },
  submitButton: {
    marginBottom: 32,
  },
});

export default AppointmentBooking;