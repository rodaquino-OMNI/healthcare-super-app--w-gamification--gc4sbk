/**
 * HealthGoalForm.test.tsx
 * 
 * Unit tests for the HealthGoalForm component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Component to test
import { HealthGoalForm } from '../HealthGoalForm';

// Mocks
import { useHealthGoals } from '../../../hooks/useHealthGoals';
import { useJourney } from '@austa/journey-context';

// Mock the hooks
jest.mock('../../../hooks/useHealthGoals');
jest.mock('@austa/journey-context');

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('HealthGoalForm', () => {
  // Setup default mock values
  beforeEach(() => {
    // Mock useJourney hook
    (useJourney as jest.Mock).mockReturnValue({
      currentJourney: 'health',
    });

    // Mock useHealthGoals hook
    (useHealthGoals as jest.Mock).mockReturnValue({
      createGoal: jest.fn().mockResolvedValue({ id: '123', type: 'STEPS', target: 10000 }),
      updateGoal: jest.fn().mockResolvedValue({ id: '123', type: 'STEPS', target: 12000 }),
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for creating a new goal', () => {
    const { getByText, getByTestId } = render(<HealthGoalForm />);
    
    // Check if the form title is correct
    expect(getByText('Create Health Goal')).toBeTruthy();
    
    // Check if form elements are present
    expect(getByTestId('health-goal-type-select')).toBeTruthy();
    expect(getByTestId('health-goal-target-input')).toBeTruthy();
    expect(getByTestId('health-goal-start-date-picker')).toBeTruthy();
    expect(getByTestId('health-goal-end-date-picker')).toBeTruthy();
    expect(getByTestId('health-goal-submit-button')).toBeTruthy();
    expect(getByTestId('health-goal-cancel-button')).toBeTruthy();
  });

  it('renders correctly for editing an existing goal', () => {
    const initialData = {
      id: '123',
      type: 'STEPS',
      target: 10000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'ACTIVE'
    };
    
    const { getByText, getByTestId } = render(<HealthGoalForm initialData={initialData} />);
    
    // Check if the form title is correct for editing
    expect(getByText('Edit Health Goal')).toBeTruthy();
    
    // Check if the submit button text is correct
    expect(getByText('Update')).toBeTruthy();
  });

  it('calls createGoal when submitting a new goal', async () => {
    const mockCreateGoal = jest.fn().mockResolvedValue({ id: '123', type: 'STEPS', target: 10000 });
    (useHealthGoals as jest.Mock).mockReturnValue({
      createGoal: mockCreateGoal,
      updateGoal: jest.fn(),
      isLoading: false,
      error: null,
    });
    
    const mockOnSuccess = jest.fn();
    const { getByTestId, getByText } = render(
      <HealthGoalForm onSuccess={mockOnSuccess} />
    );
    
    // Fill out the form
    fireEvent.changeText(getByTestId('health-goal-target-input'), '10000');
    
    // Submit the form
    fireEvent.press(getByText('Create'));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockCreateGoal).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls updateGoal when submitting an existing goal', async () => {
    const mockUpdateGoal = jest.fn().mockResolvedValue({ id: '123', type: 'STEPS', target: 12000 });
    (useHealthGoals as jest.Mock).mockReturnValue({
      createGoal: jest.fn(),
      updateGoal: mockUpdateGoal,
      isLoading: false,
      error: null,
    });
    
    const initialData = {
      id: '123',
      type: 'STEPS',
      target: 10000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'ACTIVE'
    };
    
    const mockOnSuccess = jest.fn();
    const { getByTestId, getByText } = render(
      <HealthGoalForm initialData={initialData} onSuccess={mockOnSuccess} />
    );
    
    // Update the target value
    fireEvent.changeText(getByTestId('health-goal-target-input'), '12000');
    
    // Submit the form
    fireEvent.press(getByText('Update'));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockUpdateGoal).toHaveBeenCalledWith('123', expect.any(Object));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows error message when API call fails', async () => {
    const mockError = new Error('API Error');
    (useHealthGoals as jest.Mock).mockReturnValue({
      createGoal: jest.fn().mockRejectedValue(mockError),
      updateGoal: jest.fn(),
      isLoading: false,
      error: null,
    });
    
    const { getByTestId, getByText } = render(<HealthGoalForm />);
    
    // Fill out the form
    fireEvent.changeText(getByTestId('health-goal-target-input'), '10000');
    
    // Submit the form
    fireEvent.press(getByText('Create'));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to save health goal. Please try again.',
        [{ text: 'OK' }]
      );
    });
  });

  it('calls onCancel when cancel button is pressed', () => {
    const mockOnCancel = jest.fn();
    const { getByText } = render(<HealthGoalForm onCancel={mockOnCancel} />);
    
    // Press the cancel button
    fireEvent.press(getByText('Cancel'));
    
    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading indicator when submitting', async () => {
    // Mock a slow API call
    const mockCreateGoal = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ id: '123', type: 'STEPS', target: 10000 });
        }, 100);
      });
    });
    
    (useHealthGoals as jest.Mock).mockReturnValue({
      createGoal: mockCreateGoal,
      updateGoal: jest.fn(),
      isLoading: false,
      error: null,
    });
    
    const { getByTestId, getByText, queryByTestId } = render(<HealthGoalForm />);
    
    // Verify loading indicator is not visible initially
    expect(queryByTestId('health-goal-loading-indicator')).toBeNull();
    
    // Fill out the form
    fireEvent.changeText(getByTestId('health-goal-target-input'), '10000');
    
    // Submit the form
    fireEvent.press(getByText('Create'));
    
    // Check if loading indicator appears
    await waitFor(() => {
      expect(getByTestId('health-goal-loading-indicator')).toBeTruthy();
    });
  });
});