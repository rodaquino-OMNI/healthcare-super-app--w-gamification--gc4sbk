import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { CoverageInfoCard } from './CoverageInfoCard';
import { planTheme } from '../../themes/plan.theme';

// Helper function to render components with theme
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={planTheme}>{ui}</ThemeProvider>);
};

describe('CoverageInfoCard', () => {
  const mockCoverage = {
    id: 'coverage-123',
    type: 'medical_visit',
    details: 'Coverage for regular doctor visits',
    limitations: 'Limited to 10 visits per year',
    coPayment: 25.00
  };

  it('renders the coverage type name correctly', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    expect(screen.getByText('Consulta Médica')).toBeInTheDocument();
  });

  it('renders the coverage details correctly', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    expect(screen.getByText('Coverage for regular doctor visits')).toBeInTheDocument();
  });

  it('renders the limitations when provided', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    expect(screen.getByText(/Limitações:/)).toBeInTheDocument();
    expect(screen.getByText(/Limited to 10 visits per year/)).toBeInTheDocument();
  });

  it('renders the co-payment when provided', () => {
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

  it('applies the correct accessibility attributes', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} />);
    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-labelledby', 'coverage-title-coverage-123');
    
    const limitationsSection = screen.getByText(/Limitações:/).closest('div');
    expect(limitationsSection).toHaveAttribute('aria-label', 'Coverage limitations');
    
    const coPaymentBadge = screen.getByText(/Copagamento:/).closest('div');
    expect(coPaymentBadge).toHaveAttribute('aria-label', 'Co-payment amount: 25.00 reais');
  });

  it('passes testID to the Card component', () => {
    renderWithTheme(<CoverageInfoCard coverage={mockCoverage} testID="test-coverage-card" />);
    expect(screen.getByTestId('test-coverage-card')).toBeInTheDocument();
  });
});