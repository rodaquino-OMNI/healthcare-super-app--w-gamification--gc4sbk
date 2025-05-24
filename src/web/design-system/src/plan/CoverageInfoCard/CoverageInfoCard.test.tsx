import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { CoverageInfoCard } from './CoverageInfoCard';
import { CoverageType } from '@austa/interfaces/plan/coverage.types';
import { planTheme } from '../../themes/plan.theme';

// Helper function to render components with theme
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={planTheme}>
      {ui}
    </ThemeProvider>
  );
};

describe('CoverageInfoCard', () => {
  const mockCoverage = {
    id: 'coverage-123',
    planId: 'plan-456',
    type: CoverageType.SPECIALIST_VISIT,
    details: 'Covers visits to in-network specialists',
    limitations: 'Limited to 10 visits per year',
    coPayment: 25
  };

  it('renders the coverage type name correctly', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    expect(screen.getByText('Consulta com Especialista')).toBeInTheDocument();
  });

  it('renders the coverage details correctly', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    expect(screen.getByText('Covers visits to in-network specialists')).toBeInTheDocument();
  });

  it('renders the limitations when provided', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    expect(screen.getByText(/Limitações:/)).toBeInTheDocument();
    expect(screen.getByText(/Limited to 10 visits per year/)).toBeInTheDocument();
  });

  it('renders the co-payment information when provided', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    expect(screen.getByText(/Copagamento: R\$ 25\.00/)).toBeInTheDocument();
  });

  it('does not render limitations when not provided', () => {
    const coverageWithoutLimitations = {
      ...mockCoverage,
      limitations: undefined
    };
    renderWithTheme(<CoverageInfoCard coverage={coverageWithoutLimitations} />);
    expect(screen.queryByText(/Limitações:/)).not.toBeInTheDocument();
  });

  it('does not render co-payment when not provided', () => {
    const coverageWithoutCoPayment = {
      ...mockCoverage,
      coPayment: undefined
    };
    renderWithTheme(<CoverageInfoCard coverage={coverageWithoutCoPayment} />);
    expect(screen.queryByText(/Copagamento:/)).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    renderWithTheme(
      <CoverageInfoCard 
        coverage={mockCoverage} 
        className="custom-class"
      />
    );
    // Find the Card component with the custom class
    const cardElement = document.querySelector('.custom-class');
    expect(cardElement).toBeInTheDocument();
  });

  it('applies custom testID when provided', () => {
    renderWithTheme(
      <CoverageInfoCard 
        coverage={mockCoverage} 
        testID="custom-test-id"
      />
    );
    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });

  it('uses default testID when not provided', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    expect(screen.getByTestId('coverage-info-card')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    
    // Check for aria-labelledby on the card
    const card = screen.getByTestId('coverage-info-card');
    expect(card).toHaveAttribute('aria-labelledby', 'coverage-title');
    
    // Check for aria-label on limitations
    const limitations = screen.getByText(/Limitações:/);
    expect(limitations.parentElement).toHaveAttribute('aria-label', 'Limitações da cobertura');
    
    // Check for aria-label on co-payment badge
    const coPayment = screen.getByText(/Copagamento: R\$ 25\.00/);
    expect(coPayment).toHaveAttribute('aria-label', 'Copagamento: R$ 25.00');
  });
});