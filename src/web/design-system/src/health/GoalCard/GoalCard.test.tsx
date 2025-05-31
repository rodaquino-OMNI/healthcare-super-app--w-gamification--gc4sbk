/**
 * @file GoalCard.test.tsx
 * @description Tests for the GoalCard component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { JourneyProvider } from '@austa/journey-context';
import GoalCard from './GoalCard';

// Mock the journey context
jest.mock('@austa/journey-context', () => ({
  useJourney: jest.fn().mockReturnValue({
    journeyData: { id: 'health', name: 'Health' },
  }),
  JourneyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('GoalCard', () => {
  it('renders the title and progress correctly', () => {
    render(
      <GoalCard 
        title="Walk 10,000 steps daily" 
        progress={75} 
      />
    );
    
    expect(screen.getByText('Walk 10,000 steps daily')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });
  
  it('renders the description when provided', () => {
    render(
      <GoalCard 
        title="Walk 10,000 steps daily" 
        description="Stay active by walking at least 10,000 steps every day" 
        progress={75} 
      />
    );
    
    expect(screen.getByText('Stay active by walking at least 10,000 steps every day')).toBeInTheDocument();
  });
  
  it('shows completed status when completed is true', () => {
    render(
      <GoalCard 
        title="Walk 10,000 steps daily" 
        completed={true} 
      />
    );
    
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
  
  it('normalizes progress values outside the 0-100 range', () => {
    render(
      <GoalCard 
        title="Walk 10,000 steps daily" 
        progress={150} 
      />
    );
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    
    // Re-render with negative progress
    screen.unmount();
    render(
      <GoalCard 
        title="Walk 10,000 steps daily" 
        progress={-10} 
      />
    );
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
  
  it('applies the correct test ID', () => {
    render(
      <GoalCard 
        title="Walk 10,000 steps daily" 
        testID="custom-goal-card" 
      />
    );
    
    expect(screen.getByTestId('custom-goal-card')).toBeInTheDocument();
  });
  
  it('has proper accessibility attributes', () => {
    render(
      <GoalCard 
        title="Walk 10,000 steps daily" 
        progress={75} 
      />
    );
    
    const card = screen.getByTestId('goal-card');
    expect(card).toHaveAttribute('role', 'region');
    expect(card).toHaveAttribute('aria-roledescription', 'health goal card');
    expect(card).toHaveAttribute('aria-label', 'Goal: Walk 10,000 steps daily, 75% complete');
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
  });
});