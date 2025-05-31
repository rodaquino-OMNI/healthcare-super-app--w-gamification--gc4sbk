import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { AppointmentCard } from './AppointmentCard';
import { AppointmentType, AppointmentStatus, Provider } from '@austa/interfaces/care';

describe('AppointmentCard', () => {
  // Mock data for testing
  const mockAppointment = {
    id: 'appointment-123',
    dateTime: '2023-04-15T14:30:00Z',
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.SCHEDULED,
    reason: 'Annual check-up'
  };

  const mockProvider: Provider = {
    id: 'provider-123',
    name: 'Dr. Ana Oliveira',
    specialty: 'Cardiologista',
    profileImageUrl: 'https://example.com/doctor.jpg',
    rating: 4.8
  } as Provider; // Using type assertion for the mock

  // Mock callbacks
  const mockViewDetails = jest.fn();
  const mockReschedule = jest.fn();
  const mockCancel = jest.fn();
  const mockJoinTelemedicine = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    render(
      <AppointmentCard
        appointment={mockAppointment}
        provider={mockProvider}
        testID="appointment-card"
      />
    );

    // Check provider information is displayed
    expect(screen.getByText('Dr. Ana Oliveira')).toBeTruthy();
    expect(screen.getByText('Cardiologista')).toBeTruthy();

    // Check appointment type is displayed
    expect(screen.getByText('Consulta presencial')).toBeTruthy();
    
    // Check appointment status is displayed
    expect(screen.getByText('Agendada')).toBeTruthy();
  });

  it('renders telemedicine appointment correctly', () => {
    const telemedicineAppointment = {
      ...mockAppointment,
      type: AppointmentType.TELEMEDICINE
    };

    render(
      <AppointmentCard
        appointment={telemedicineAppointment}
        provider={mockProvider}
        onJoinTelemedicine={mockJoinTelemedicine}
        testID="appointment-card"
      />
    );

    // Check telemedicine info is displayed
    expect(screen.getByText('Telemedicina')).toBeTruthy();
    
    // Check telemedicine button is present for upcoming appointments
    expect(screen.getByText('Iniciar consulta')).toBeTruthy();
  });

  it('renders different appointment statuses correctly', () => {
    // Test completed status
    const { rerender } = render(
      <AppointmentCard
        appointment={{...mockAppointment, status: AppointmentStatus.COMPLETED}}
        provider={mockProvider}
        testID="appointment-card"
      />
    );
    expect(screen.getByText('Concluída')).toBeTruthy();
    
    // Test cancelled status
    rerender(
      <AppointmentCard
        appointment={{...mockAppointment, status: AppointmentStatus.CANCELLED}}
        provider={mockProvider}
        testID="appointment-card"
      />
    );
    expect(screen.getByText('Cancelada')).toBeTruthy();
  });

  it('handles button clicks correctly', () => {
    render(
      <AppointmentCard
        appointment={mockAppointment}
        provider={mockProvider}
        onViewDetails={mockViewDetails}
        onReschedule={mockReschedule}
        onCancel={mockCancel}
        testID="appointment-card"
      />
    );

    // Click the buttons and check callbacks
    fireEvent.click(screen.getByText('Ver detalhes'));
    expect(mockViewDetails).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByText('Reagendar'));
    expect(mockReschedule).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onJoinTelemedicine when telemedicine button is clicked', () => {
    const telemedicineAppointment = {
      ...mockAppointment,
      type: AppointmentType.TELEMEDICINE
    };

    render(
      <AppointmentCard
        appointment={telemedicineAppointment}
        provider={mockProvider}
        onJoinTelemedicine={mockJoinTelemedicine}
        testID="appointment-card"
      />
    );

    fireEvent.click(screen.getByText('Iniciar consulta'));
    expect(mockJoinTelemedicine).toHaveBeenCalledTimes(1);
  });

  it('hides action buttons when showActions is false', () => {
    render(
      <AppointmentCard
        appointment={mockAppointment}
        provider={mockProvider}
        onViewDetails={mockViewDetails}
        showActions={false}
        testID="appointment-card"
      />
    );

    // Buttons should not be present
    expect(screen.queryByText('Ver detalhes')).toBeNull();
  });

  it('has appropriate accessibility attributes', () => {
    render(
      <AppointmentCard
        appointment={mockAppointment}
        provider={mockProvider}
        testID="appointment-card"
      />
    );

    // Check for aria-label with appointment description
    const card = screen.getByTestId('appointment-card');
    const ariaLabel = card.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Dr. Ana Oliveira');
    expect(ariaLabel).toContain('Consulta presencial');
  });
  
  it('renders correctly without provider image', () => {
    const providerWithoutImage = {
      ...mockProvider,
      profileImageUrl: undefined
    };

    render(
      <AppointmentCard
        appointment={mockAppointment}
        provider={providerWithoutImage}
        testID="appointment-card"
      />
    );

    // Component should render without errors
    expect(screen.getByText('Dr. Ana Oliveira')).toBeTruthy();
    expect(screen.getByText('Cardiologista')).toBeTruthy();
  });
  
  it('does not show rescheduling options for non-upcoming appointments', () => {
    // Test with completed appointment
    render(
      <AppointmentCard
        appointment={{...mockAppointment, status: AppointmentStatus.COMPLETED}}
        provider={mockProvider}
        onReschedule={mockReschedule}
        onCancel={mockCancel}
        testID="appointment-card"
      />
    );
    
    // Reschedule and cancel buttons should not be present
    expect(screen.queryByText('Reagendar')).toBeNull();
    expect(screen.queryByText('Cancelar')).toBeNull();
  });
  
  it('only shows telemedicine button for upcoming telemedicine appointments', () => {
    // Create a completed telemedicine appointment
    render(
      <AppointmentCard
        appointment={{...mockAppointment, type: AppointmentType.TELEMEDICINE, status: AppointmentStatus.COMPLETED}}
        provider={mockProvider}
        onJoinTelemedicine={mockJoinTelemedicine}
        testID="appointment-card"
      />
    );
    
    // Start telemedicine button should not be present for completed appointments
    expect(screen.queryByText('Iniciar consulta')).toBeNull();
  });

  it('renders buttons with correct accessibility labels', () => {
    render(
      <AppointmentCard
        appointment={{...mockAppointment, type: AppointmentType.TELEMEDICINE}}
        provider={mockProvider}
        onViewDetails={mockViewDetails}
        onReschedule={mockReschedule}
        onCancel={mockCancel}
        onJoinTelemedicine={mockJoinTelemedicine}
        testID="appointment-card"
      />
    );

    // Check accessibility labels for buttons
    const viewDetailsButton = screen.getByText('Ver detalhes');
    expect(viewDetailsButton.getAttribute('aria-label')).toBe('Ver detalhes da consulta');

    const startConsultationButton = screen.getByText('Iniciar consulta');
    expect(startConsultationButton.getAttribute('aria-label')).toBe('Iniciar teleconsulta');

    const rescheduleButton = screen.getByText('Reagendar');
    expect(rescheduleButton.getAttribute('aria-label')).toBe('Reagendar consulta');

    const cancelButton = screen.getByText('Cancelar');
    expect(cancelButton.getAttribute('aria-label')).toBe('Cancelar consulta');
  });
});